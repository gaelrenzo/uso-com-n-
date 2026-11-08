// Agente de playit.gg: túnel gratis para que amigos entren sin abrir puertos (sirve con CGNAT / datos móviles)
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const readline = require('node:readline');
const { spawn, execFile, execFileSync } = require('node:child_process');
const des = require('./descargas');

let BIN = null, CLI = null;
let proc = null, vinculando = null;
const log = [];
const oyentes = new Set();
let enlace = null; // URL para vincular el agente con la cuenta de playit (solo la primera vez)
let alVincular = null; // lo define server.js: crear los túneles en cuanto se aprueba el agente
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

const RUTA_SECRETO = path.join(os.homedir(), '.config', 'playit_gg', 'playit.toml');

// playit 1.2: si el servicio no tiene clave, se vincula. Se usa el tipo "self-managed" (no "playit-cli setup"),
// porque solo ese tipo de agente puede crear sus propios túneles; la clave de "setup" es de solo lectura
function vincularSiFalta() {
  if (!fs.existsSync(CLI) || vinculando) return;
  execFile(CLI, ['status'], { timeout: 15_000 }, (e, salida = '') => {
    if (/Secret configured: false/.test(salida)) vincular();
  });
}

function vincular() {
  if (!fs.existsSync(CLI)) throw new Error('primero instala el agente');
  if (vinculando) return estado();
  const codigo = execFileSync(CLI, ['claim', 'generate'], { encoding: 'utf8' }).trim();
  const url = execFileSync(CLI, ['claim', 'url', codigo, '--name', `Panel Minecraft (${os.hostname()})`, '--type', 'self-managed'], { encoding: 'utf8' });
  enlace = url.match(/https:\/\/\S+/)?.[0] || null;
  emitir('[panel] Abre el enlace "Vincular" para aprobar el agente en tu cuenta de playit');
  emitir(null);
  let salida = '';
  vinculando = spawn(CLI, ['claim', 'exchange', codigo, '--wait', '3600'], { stdio: ['ignore', 'pipe', 'pipe'] });
  vinculando.stdout.on('data', (c) => { salida += c; });
  vinculando.on('exit', (c) => {
    vinculando = null;
    enlace = null;
    const secreto = salida.match(/\b[0-9a-f]{64}\b/)?.[0];
    if (c === 0 && secreto) {
      guardarSecreto(secreto);
      emitir('[panel] Agente vinculado: ya puede crear túneles. Reiniciando el agente…');
      reiniciar();
      setTimeout(() => alVincular?.().catch((e) => emitir(`[panel] No se pudieron crear los túneles: ${e.message}`)), 5000);
    } else {
      emitir('[panel] La vinculación no se completó (¿se venció la hora de espera?)');
    }
    emitir(null);
  });
  return estado();
}

// La clave anterior se conserva como playit.toml.antes-<fecha>
function guardarSecreto(secreto) {
  fs.mkdirSync(path.dirname(RUTA_SECRETO), { recursive: true });
  if (fs.existsSync(RUTA_SECRETO)) fs.copyFileSync(RUTA_SECRETO, `${RUTA_SECRETO}.antes-${Date.now()}`);
  fs.writeFileSync(RUTA_SECRETO, `secret_key = "${secreto}"\n`, { mode: 0o600 });
}

function reiniciar() {
  if (!proc) return iniciar();
  proc.once('exit', () => iniciar());
  proc.kill();
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
    const toml = fs.readFileSync(RUTA_SECRETO, 'utf8');
    return toml.match(/secret_key\s*=\s*"([^"]+)"/)?.[1] || null;
  } catch {
    return null;
  }
}

async function apiPlayit(ruta, cuerpo = {}, intento = 1) {
  const k = clave();
  if (!k) throw new Error('el agente todavía no está vinculado con tu cuenta');
  let r;
  try {
    r = await fetch(`${API}/${ruta}`, {
      method: 'POST', headers: { authorization: `Agent-Key ${k}`, 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    if (intento < 3) { await new Promise((ok) => setTimeout(ok, 1500 * intento)); return apiPlayit(ruta, cuerpo, intento + 1); }
    throw new Error(`sin conexión con playit (${e.cause?.code || e.message})`);
  }
  const d = await r.json().catch(() => ({}));
  if (d.status !== 'success') throw new Error(`playit: ${d.data?.message || d.data?.type || r.status}`);
  return d.data;
}

// Túneles de la cuenta con la dirección lista para compartir. Java en joinmc.link no necesita puerto (usa SRV)
async function tuneles() {
  const [{ tunnels }, { agent_id: propio }] = await Promise.all([
    apiPlayit('tunnels/list', { tunnel_id: null, agent_id: null }), apiPlayit('agents/rundata'),
  ]);
  return tunnels.map((t) => {
    const a = t.alloc?.data || {};
    const dominio = a.assigned_domain || a.ip_hostname;
    const soloDominio = t.tunnel_type === 'minecraft-java' && /joinmc\.link$/.test(dominio || '');
    return {
      id: t.id, nombre: t.name, tipo: t.tunnel_type, protocolo: t.port_type, activo: t.active,
      publica: dominio ? (soloDominio ? dominio : `${dominio}:${a.port_start}`) : null,
      ip: a.static_ip4 ? `${a.static_ip4}:${a.port_start}` : null,
      localPuerto: t.origin?.data?.local_port ?? null,
      propio: t.origin?.data?.agent_id === propio, // del agente de este equipo (los de otros agentes pueden estar apagados)
    };
  });
}

// Crea los túneles que falten para el servidor (Java TCP y, si tiene Geyser, Bedrock UDP) en el agente de este equipo
async function crearTuneles(s) {
  const { agent_id } = await apiPlayit('agents/rundata');
  const existentes = await tuneles();
  const deseados = [{ tipo: 'minecraft-java', protocolo: 'tcp', puerto: s.puerto, nombre: `${s.nombre} Java` }];
  if (s.bedrock) deseados.push({ tipo: 'minecraft-bedrock', protocolo: 'udp', puerto: s.puertoBedrock, nombre: `${s.nombre} Bedrock` });
  for (const d of deseados) {
    if (existentes.some((t) => t.propio && t.tipo === d.tipo && t.localPuerto === d.puerto)) continue;
    try {
      await apiPlayit('tunnels/create', {
        name: d.nombre.slice(0, 40), tunnel_type: d.tipo, port_type: d.protocolo, port_count: 1,
        origin: { type: 'agent', data: { agent_id, local_ip: '127.0.0.1', local_port: d.puerto } },
        enabled: true, alloc: null, firewall_id: null, proxy_protocol: null,
      });
    } catch (e) {
      if (/ReadOnly/i.test(e.message)) throw new Error('la clave del agente es de solo lectura: toca "Revincular" para que pueda crear túneles');
      throw e;
    }
  }
  return tuneles();
}

function suscribir(res) {
  for (const l of log) res.write(`event: linea\ndata: ${JSON.stringify(l)}\n\n`);
  res.write(`event: estado\ndata: ${JSON.stringify(estado())}\n\n`);
  oyentes.add(res);
  res.on('close', () => oyentes.delete(res));
}

// ¿La clave actual puede crear túneles? Las de "playit-cli setup" (agente "assignable") son de solo lectura
async function puedeCrear() {
  try {
    return (await apiPlayit('agents/rundata')).agent_type === 'self-managed';
  } catch {
    return false;
  }
}

const cuandoSeVincule = (fn) => { alVincular = fn; };

module.exports = { configurar, estado, instalar, iniciar, detener, suscribir, tuneles, crearTuneles, vincular, puedeCrear, cuandoSeVincule };
