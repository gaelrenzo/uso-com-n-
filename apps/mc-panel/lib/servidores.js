// Servidores Minecraft: crear, arrancar/parar, consola en vivo, jugadores y server.properties
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const readline = require('node:readline');
const { spawn, spawnSync } = require('node:child_process');
const des = require('./descargas');

const JAVA = process.env.MC_JAVA || 'java';
const MAX_LINEAS = 600;
// Propiedades editables desde el panel (el resto se edita a mano en server.properties)
const EDITABLES = ['motd', 'max-players', 'difficulty', 'gamemode', 'pvp', 'online-mode', 'white-list',
  'view-distance', 'simulation-distance', 'spawn-protection', 'allow-flight', 'level-seed', 'hardcore'];
// Valores iniciales pensados para una tablet: distancias cortas = menos RAM y CPU
const PROPIEDADES_INICIALES = { 'view-distance': '6', 'simulation-distance': '4', 'max-players': '8', difficulty: 'normal', 'spawn-protection': '0' };

let DIR = null;
const instancias = new Map(); // id → { proc, estado, log[], jugadores:Set, oyentes:Set }

function configurar(dirDatos) {
  DIR = path.join(dirDatos, 'servidores');
  fs.mkdirSync(DIR, { recursive: true });
}

const carpeta = (id) => path.join(DIR, id);
const rutaCfg = (id) => path.join(carpeta(id), 'panel.json');
const leerCfg = (id) => JSON.parse(fs.readFileSync(rutaCfg(id), 'utf8'));
const guardarCfg = (id, cfg) => fs.writeFileSync(rutaCfg(id), JSON.stringify(cfg, null, 2));
const existe = (id) => /^[a-z0-9-]{1,40}$/.test(id) && fs.existsSync(rutaCfg(id));

function instancia(id) {
  if (!instancias.has(id)) instancias.set(id, { proc: null, estado: 'apagado', log: [], jugadores: new Set(), oyentes: new Set() });
  return instancias.get(id);
}

// Cada línea va al buffer y a los navegadores conectados por SSE
function emitir(id, linea, tipo = 'linea') {
  const inst = instancia(id);
  if (tipo === 'linea') { inst.log.push(linea); if (inst.log.length > MAX_LINEAS) inst.log.shift(); }
  const msg = `event: ${tipo}\ndata: ${JSON.stringify(tipo === 'linea' ? linea : resumen(id))}\n\n`;
  for (const res of inst.oyentes) res.write(msg);
}

const panel = (id, texto) => emitir(id, `[panel] ${texto}`);

function cambiarEstado(id, estado) {
  instancia(id).estado = estado;
  emitir(id, null, 'estado');
}

function resumen(id) {
  const cfg = leerCfg(id), inst = instancia(id);
  return { id, ...cfg, estado: inst.estado, jugadores: [...inst.jugadores] };
}

const listar = () => fs.readdirSync(DIR).filter(existe).map(resumen);

// ---------- server.properties ----------
function leerPropiedades(id) {
  const f = path.join(carpeta(id), 'server.properties');
  if (!fs.existsSync(f)) return {};
  return Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
}

// Reescribe solo las claves dadas, conservando orden y comentarios
function escribirPropiedades(id, cambios) {
  const f = path.join(carpeta(id), 'server.properties');
  const lineas = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n') : [];
  const pendientes = { ...cambios };
  const nuevas = lineas.map((l) => {
    const k = l.slice(0, l.indexOf('='));
    if (l.includes('=') && !l.startsWith('#') && k in pendientes) { const v = pendientes[k]; delete pendientes[k]; return `${k}=${v}`; }
    return l;
  });
  for (const [k, v] of Object.entries(pendientes)) nuevas.splice(nuevas.length - (nuevas.at(-1) === '' ? 1 : 0), 0, `${k}=${v}`);
  fs.writeFileSync(f, nuevas.join('\n').replace(/\n?$/, '\n'));
}

function actualizarPropiedades(id, cambios) {
  const limpias = Object.fromEntries(Object.entries(cambios)
    .filter(([k]) => EDITABLES.includes(k))
    .map(([k, v]) => [k, String(v).replace(/[\r\n]/g, '').slice(0, 200)]));
  escribirPropiedades(id, limpias);
  return leerPropiedades(id);
}

// ---------- Crear ----------
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'mundo';

function puertoLibre(campo, base) {
  const usados = new Set(listar().map((s) => s[campo]));
  let p = base;
  while (usados.has(p)) p++;
  return p;
}

// RAM sugerida: lo disponible menos un margen para Android/el sistema, entre 1 y 4 GB
function ramSugerida() {
  const mb = Math.floor((os.freemem() / 2 ** 20 - 768) / 256) * 256;
  return Math.min(4096, Math.max(1024, mb));
}

// "java -version" escribe en stderr
function versionJava() {
  const r = spawnSync(JAVA, ['-version'], { encoding: 'utf8' });
  return Number(`${r.stderr}${r.stdout}`.match(/version "(\d+)/)?.[1]) || null;
}

// La descarga sigue en segundo plano; el progreso se ve en la consola del servidor
function crear({ nombre, plataforma = 'paper', version, ramMB, bedrock, eula }) {
  if (eula !== true) throw new Error('Debes aceptar el EULA de Minecraft (https://aka.ms/MinecraftEULA)');
  if (!['paper', 'fabric'].includes(plataforma)) throw new Error('plataforma inválida');
  if (!version || !/^[\w.-]+$/.test(version)) throw new Error('versión inválida');
  let id = slug(nombre);
  for (let i = 2; fs.existsSync(carpeta(id)); i++) id = `${slug(nombre)}-${i}`;
  fs.mkdirSync(carpeta(id), { recursive: true });

  const cfg = {
    nombre: String(nombre || id).slice(0, 40), plataforma, version,
    ramMB: Math.max(512, Math.min(16384, Number(ramMB) || ramSugerida())),
    bedrock: !!bedrock, puerto: puertoLibre('puerto', 25565), puertoBedrock: bedrock ? puertoLibre('puertoBedrock', 19132) : null,
    eulaAceptado: new Date().toISOString(), javaMin: 21, flags: [], instalado: false,
    respaldoHoras: 0, respaldosGuardar: 7, respaldoDrive: false, creado: new Date().toISOString(),
    playitAuto: true, direccionJava: '', direccionBedrock: '',
  };
  guardarCfg(id, cfg);
  fs.writeFileSync(path.join(carpeta(id), 'eula.txt'), `# Aceptado por el usuario en el panel: ${cfg.eulaAceptado}\neula=true\n`);
  escribirPropiedades(id, { ...PROPIEDADES_INICIALES, 'server-port': cfg.puerto, motd: cfg.nombre });
  instalar(id).catch((e) => { panel(id, `ERROR instalando: ${e.message}`); cambiarEstado(id, 'error'); });
  return resumen(id);
}

async function instalar(id) {
  const cfg = leerCfg(id);
  const extras = cfg.plataforma === 'fabric' ? 'mods' : 'plugins';
  cambiarEstado(id, 'instalando');
  panel(id, `Descargando ${cfg.plataforma} ${cfg.version}…`);
  const req = await des.requisitosPaper(cfg.version); // Fabric usa los mismos requisitos de Java del juego
  cfg.javaMin = req.javaMin;
  cfg.flags = cfg.plataforma === 'paper' ? req.flags : [];
  const desc = cfg.plataforma === 'paper'
    ? await des.bajarPaper(cfg.version, path.join(carpeta(id), 'server.jar'))
    : await des.bajarFabric(cfg.version, path.join(carpeta(id), 'server.jar'));
  panel(id, `${desc} listo`);
  if (cfg.bedrock) {
    panel(id, 'Descargando Geyser + Floodgate (jugadores Bedrock)…');
    await des.bajarGeyser(cfg.plataforma, path.join(carpeta(id), extras));
    if (cfg.plataforma === 'fabric') await des.instalarModrinth('fabric-api', 'fabric', cfg.version, path.join(carpeta(id), 'mods'));
  }
  cfg.instalado = true;
  guardarCfg(id, cfg);
  panel(id, 'Instalación completa. Ya puedes iniciarlo.');
  cambiarEstado(id, 'apagado');
}

// Geyser genera su config al primer arranque: se ajusta el puerto Bedrock y la autenticación por Floodgate.
// Transporte "both": RakNet en el puerto Bedrock (el túnel gratis de playit solo soporta RakNet) y
// NetherNet (método nuevo de Bedrock) en puerto Bedrock + 1000 para quienes entren por la red local
function ajustarGeyser(id, cfg) {
  const base = path.join(carpeta(id), cfg.plataforma === 'fabric' ? 'config/Geyser-Fabric' : 'plugins/Geyser-Spigot');
  const f = path.join(base, 'config.yml');
  if (!fs.existsSync(f)) return;
  const antes = fs.readFileSync(f, 'utf8');
  const despues = antes
    .replace(/(bedrock:[\s\S]*?\n\s+port:\s*)\d+/, `$1${cfg.puertoBedrock}`)
    .replace(/auth-type:\s*online/, 'auth-type: floodgate')
    .replace(/(\n\s+)transport:\s*nethernet/, '$1transport: both')
    .replace(/(\n\s+)webrtc-port:\s*0\b/, `$1webrtc-port: ${cfg.puertoBedrock + 1000}`);
  if (despues !== antes) fs.writeFileSync(f, despues);
}

// ---------- Arrancar / parar ----------
function iniciar(id) {
  const cfg = leerCfg(id), inst = instancia(id);
  if (inst.proc) throw new Error('ya está encendido');
  if (!cfg.instalado) throw new Error('todavía se está instalando');
  const java = versionJava();
  if (!java) throw new Error(`no se encontró Java (${JAVA}); instala OpenJDK ${cfg.javaMin}+`);
  if (java < cfg.javaMin) throw new Error(`${cfg.plataforma} ${cfg.version} pide Java ${cfg.javaMin}+ y hay Java ${java}`);
  if (cfg.bedrock) ajustarGeyser(id, cfg);

  // AlwaysPreTouch reserva toda la RAM al inicio: con poca memoria (tablet) Android puede matar el proceso
  const flags = cfg.ramMB < 3072 ? cfg.flags.filter((f) => f !== '-XX:+AlwaysPreTouch') : cfg.flags;
  const args = [`-Xms${cfg.ramMB}M`, `-Xmx${cfg.ramMB}M`, ...flags, '-jar', 'server.jar', '--nogui'];
  panel(id, `java ${args.join(' ')}`);
  const proc = spawn(JAVA, args, { cwd: carpeta(id), stdio: ['pipe', 'pipe', 'pipe'] });
  inst.proc = proc;
  inst.jugadores.clear();
  cambiarEstado(id, 'iniciando');

  for (const flujo of [proc.stdout, proc.stderr]) {
    readline.createInterface({ input: flujo }).on('line', (l) => {
      emitir(id, l);
      if (/Done \([\d.,]+s\)!/.test(l)) cambiarEstado(id, 'encendido');
      const entra = l.match(/INFO\]:? (?:\[[^\]]+\] )?([.\w]{1,20}) joined the game/);
      const sale = l.match(/INFO\]:? (?:\[[^\]]+\] )?([.\w]{1,20}) left the game/);
      if (entra) { inst.jugadores.add(entra[1]); emitir(id, null, 'estado'); }
      if (sale) { inst.jugadores.delete(sale[1]); emitir(id, null, 'estado'); }
    });
  }
  proc.on('error', (e) => panel(id, `ERROR: ${e.message}`));
  proc.on('exit', (codigo) => {
    inst.proc = null;
    inst.jugadores.clear();
    clearTimeout(inst.matar);
    panel(id, `Servidor detenido (código ${codigo})`);
    cambiarEstado(id, 'apagado');
  });
  return resumen(id);
}

function comando(id, cmd) {
  const inst = instancia(id);
  if (!inst.proc) throw new Error('el servidor está apagado');
  const limpio = String(cmd).replace(/[\r\n]/g, '').replace(/^\//, '').slice(0, 500);
  emitir(id, `> ${limpio}`);
  inst.proc.stdin.write(`${limpio}\n`);
}

// "stop" guarda el mundo; si en 60 s no terminó, se fuerza
function detener(id) {
  const inst = instancia(id);
  if (!inst.proc) return;
  cambiarEstado(id, 'deteniendo');
  comando(id, 'stop');
  inst.matar = setTimeout(() => { panel(id, 'No respondió a stop en 60 s: se fuerza el cierre'); inst.proc?.kill('SIGKILL'); }, 60_000);
}

const detenerTodos = () => Promise.all([...instancias.entries()].filter(([, i]) => i.proc).map(([id, i]) => new Promise((ok) => {
  i.proc.once('exit', ok);
  detener(id);
})));

// Espera una línea de consola que cumpla la expresión (para respaldos: "Saved the game")
function esperarLinea(id, re, ms) {
  return new Promise((ok, mal) => {
    const inst = instancia(id);
    const res = { write: (msg) => { if (msg.startsWith('event: linea') && re.test(msg)) { fin(); ok(); } } };
    const t = setTimeout(() => { fin(); mal(new Error('tiempo de espera agotado')); }, ms);
    const fin = () => { clearTimeout(t); inst.oyentes.delete(res); };
    inst.oyentes.add(res);
  });
}

function actualizarCfg(id, cambios) {
  const cfg = leerCfg(id);
  if ('ramMB' in cambios) cfg.ramMB = Math.max(512, Math.min(16384, Number(cambios.ramMB) || cfg.ramMB));
  if ('respaldoHoras' in cambios) cfg.respaldoHoras = Math.max(0, Math.min(168, Number(cambios.respaldoHoras) || 0));
  if ('respaldosGuardar' in cambios) cfg.respaldosGuardar = Math.max(0, Math.min(100, Number(cambios.respaldosGuardar) || 0));
  if ('respaldoDrive' in cambios) cfg.respaldoDrive = !!cambios.respaldoDrive;
  if ('playitAuto' in cambios) cfg.playitAuto = !!cambios.playitAuto;
  // Direcciones públicas para invitar amigos: host o host:puerto (vacío = borrar)
  for (const k of ['direccionJava', 'direccionBedrock']) {
    if (!(k in cambios)) continue;
    const v = String(cambios[k] || '').trim();
    if (v && !/^[\w.-]{1,120}(:\d{1,5})?$/.test(v)) throw new Error(`dirección inválida: ${v}`);
    cfg[k] = v;
  }
  guardarCfg(id, cfg);
  return resumen(id);
}

// ---------- Plugins / mods instalados ----------
const carpetaExtras = (id) => path.join(carpeta(id), leerCfg(id).plataforma === 'fabric' ? 'mods' : 'plugins');

function extras(id) {
  const dir = carpetaExtras(id), off = path.join(dir, '.desactivados');
  const jars = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.jar')) : []);
  return { activos: jars(dir), desactivados: jars(off) };
}

// Desactivar mueve el .jar a .desactivados/ (reversible); no se borra nada
function moverExtra(id, archivo, activar) {
  const nombre = path.basename(String(archivo));
  if (!nombre.endsWith('.jar')) throw new Error('archivo inválido');
  const dir = carpetaExtras(id), off = path.join(dir, '.desactivados');
  fs.mkdirSync(off, { recursive: true });
  const [de, a] = activar ? [off, dir] : [dir, off];
  fs.renameSync(path.join(de, nombre), path.join(a, nombre));
  panel(id, `${nombre} ${activar ? 'activado' : 'desactivado'} (reinicia para aplicar)`);
  return extras(id);
}

async function instalarExtra(id, proyecto) {
  const cfg = leerCfg(id);
  const archivos = await des.instalarModrinth(String(proyecto), cfg.plataforma, cfg.version, carpetaExtras(id));
  panel(id, `Instalado: ${archivos.join(', ')} (reinicia para aplicar)`);
  return extras(id);
}

module.exports = {
  configurar, listar, resumen, existe, carpeta, leerCfg, crear, instalar, iniciar, detener, detenerTodos, comando, instancia,
  emitir, panel, esperarLinea, leerPropiedades, actualizarPropiedades, actualizarCfg, extras, moverExtra, instalarExtra,
  ramSugerida, versionJava, EDITABLES,
};
