// Agente de playit.gg: túnel gratis para que amigos entren sin abrir puertos (sirve con CGNAT / datos móviles)
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const readline = require('node:readline');
const { spawn, execFile } = require('node:child_process');
const des = require('./descargas');

let BIN = null, CLI = null;
let proc = null, vinculando = null;
const log = [];
const oyentes = new Set();
let enlace = null; // URL para vincular el agente con la cuenta de playit (solo la primera vez)
let direcciones = []; // direcciones públicas de los túneles que muestra el agente

function configurar(dirDatos) {
  BIN = path.join(dirDatos, 'bin', process.platform === 'win32' ? 'playit.exe' : 'playit');
  CLI = path.join(dirDatos, 'bin', 'playit-cli');
}

const estado = () => ({ instalado: fs.existsSync(BIN), encendido: !!proc, enlace, direcciones });

function emitir(linea) {
  if (linea !== null) { log.push(linea); if (log.length > 300) log.shift(); }
  const msg = linea === null ? `event: estado\ndata: ${JSON.stringify(estado())}\n\n` : `event: linea\ndata: ${JSON.stringify(linea)}\n\n`;
  for (const r of oyentes) r.write(msg);
}

// El agente usa códigos de color ANSI y redibuja la pantalla: se limpian para mostrarlo en el panel
const limpiar = (l) => l.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r/g, '').trim();

async function instalar() {
  emitir('[panel] Descargando agente de playit.gg…');
  await des.bajarPlayit(BIN, CLI);
  emitir('[panel] Agente instalado');
  emitir(null);
}

// playit 1.2: el servicio espera la clave; "playit-cli setup" imprime el enlace de vinculación y se la entrega
function vincularSiFalta() {
  if (!fs.existsSync(CLI) || vinculando) return;
  execFile(CLI, ['status'], { timeout: 15_000 }, (e, salida = '') => {
    if (!/Secret configured: false/.test(salida) || vinculando) return;
    emitir('[panel] El agente necesita vincularse con tu cuenta de playit…');
    vinculando = spawn(CLI, ['setup'], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NO_COLOR: '1' } });
    for (const flujo of [vinculando.stdout, vinculando.stderr]) leerLineas(flujo);
    vinculando.on('exit', () => { vinculando = null; enlace = null; emitir(null); });
  });
}

function leerLineas(flujo) {
  readline.createInterface({ input: flujo }).on('line', (crudo) => {
    const l = limpiar(crudo);
    if (!l) return;
    emitir(l);
    const claim = l.match(/https:\/\/playit\.gg\/claim\/\S+/);
    if (claim) { enlace = claim[0]; emitir(null); }
    // Direcciones públicas de túneles (joinmc.link = Java; ply.gg:puerto suele ser Bedrock/UDP). El formato
    // de salida del agente cambia entre versiones, así que se toma cualquier dominio de playit, con o sin "=> local"
    for (const m of l.matchAll(/\b((?:[a-z0-9-]+\.)+(?:joinmc\.link|ply\.gg))(:\d{2,5})?(?:\s*=>\s*(\S+))?/gi)) {
      const publica = `${m[1]}${m[2] || ''}`;
      if (/^(api|www)\./.test(publica) || direcciones.some((d) => d.publica === publica)) continue;
      direcciones.push({ publica, local: m[3] || '' });
      emitir(null);
    }
    if (/setup is complete/i.test(l)) { enlace = null; emitir(null); }
  });
}

function iniciar() {
  if (proc) return estado();
  if (!fs.existsSync(BIN)) throw new Error('primero instala el agente');
  proc = spawn(BIN, [], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NO_COLOR: '1' } });
  for (const flujo of [proc.stdout, proc.stderr]) leerLineas(flujo);
  setTimeout(vincularSiFalta, 3000);
  proc.on('exit', (c) => { proc = null; emitir(`[panel] Agente detenido (código ${c})`); emitir(null); });
  emitir(null);
  return estado();
}

function detener() {
  vinculando?.kill();
  proc?.kill();
}

// ---------- API de playit (con la clave del agente vinculado) ----------
const API = 'https://api.playit.gg';

function clave() {
  try {
    const toml = fs.readFileSync(path.join(os.homedir(), '.config', 'playit_gg', 'playit.toml'), 'utf8');
    return toml.match(/secret_key\s*=\s*"([^"]+)"/)?.[1] || null;
  } catch {
    return null;
  }
}

async function apiPlayit(ruta, cuerpo = {}) {
  const k = clave();
  if (!k) throw new Error('el agente todavía no está vinculado con tu cuenta');
  const r = await fetch(`${API}/${ruta}`, {
    method: 'POST', headers: { authorization: `Agent-Key ${k}`, 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(15_000),
  });
  const d = await r.json().catch(() => ({}));
  if (d.status !== 'success') throw new Error(`playit: ${d.data?.message || d.data?.type || r.status}`);
  return d.data;
}

// Túneles de la cuenta con la dirección lista para compartir. Java en joinmc.link no necesita puerto (usa SRV)
async function tuneles() {
  const { tunnels } = await apiPlayit('tunnels/list', { tunnel_id: null, agent_id: null });
  return tunnels.map((t) => {
    const a = t.alloc?.data || {};
    const dominio = a.assigned_domain || a.ip_hostname;
    const soloDominio = t.tunnel_type === 'minecraft-java' && /joinmc\.link$/.test(dominio || '');
    return {
      id: t.id, nombre: t.name, tipo: t.tunnel_type, protocolo: t.port_type, activo: t.active,
      publica: dominio ? (soloDominio ? dominio : `${dominio}:${a.port_start}`) : null,
      ip: a.static_ip4 ? `${a.static_ip4}:${a.port_start}` : null,
      localPuerto: t.origin?.data?.local_port ?? null,
    };
  });
}

function suscribir(res) {
  for (const l of log) res.write(`event: linea\ndata: ${JSON.stringify(l)}\n\n`);
  res.write(`event: estado\ndata: ${JSON.stringify(estado())}\n\n`);
  oyentes.add(res);
  res.on('close', () => oyentes.delete(res));
}

module.exports = { configurar, estado, instalar, iniciar, detener, suscribir, tuneles };
