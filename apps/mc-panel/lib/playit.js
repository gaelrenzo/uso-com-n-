// Agente de playit.gg: túnel gratis para que amigos entren sin abrir puertos (sirve con CGNAT / datos móviles)
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { spawn } = require('node:child_process');
const des = require('./descargas');

let BIN = null;
let proc = null;
const log = [];
const oyentes = new Set();
let enlace = null; // URL para vincular el agente con la cuenta de playit (solo la primera vez)
let direcciones = []; // direcciones públicas de los túneles que muestra el agente

function configurar(dirDatos) {
  BIN = path.join(dirDatos, 'bin', process.platform === 'win32' ? 'playit.exe' : 'playit');
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
  await des.bajarPlayit(BIN);
  emitir('[panel] Agente instalado');
  emitir(null);
}

function iniciar() {
  if (proc) return estado();
  if (!fs.existsSync(BIN)) throw new Error('primero instala el agente');
  proc = spawn(BIN, [], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NO_COLOR: '1' } });
  for (const flujo of [proc.stdout, proc.stderr]) {
    readline.createInterface({ input: flujo }).on('line', (crudo) => {
      const l = limpiar(crudo);
      if (!l) return;
      emitir(l);
      const claim = l.match(/https:\/\/playit\.gg\/claim\/\S+/);
      if (claim) { enlace = claim[0]; emitir(null); }
      const dir = l.match(/([\w-]+(?:\.[\w-]+)*\.(?:joinmc\.link|ply\.gg|playit\.gg)(?::\d+)?)\s*=>\s*(\S+)/);
      if (dir && !direcciones.some((d) => d.publica === dir[1])) { direcciones.push({ publica: dir[1], local: dir[2] }); emitir(null); }
    });
  }
  proc.on('exit', (c) => { proc = null; emitir(`[panel] Agente detenido (código ${c})`); emitir(null); });
  emitir(null);
  return estado();
}

function detener() {
  proc?.kill();
}

function suscribir(res) {
  for (const l of log) res.write(`event: linea\ndata: ${JSON.stringify(l)}\n\n`);
  res.write(`event: estado\ndata: ${JSON.stringify(estado())}\n\n`);
  oyentes.add(res);
  res.on('close', () => oyentes.delete(res));
}

module.exports = { configurar, estado, instalar, iniciar, detener, suscribir };
