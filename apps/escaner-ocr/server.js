// Servidor sin dependencias: sirve public/ y expone /api/ia (clasificar con IA) y /api/subir (guardar + rclone)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');

const PORT = Number(process.env.PORT) || 8090;
const PUBLICO = path.join(__dirname, 'public');
const DATOS = process.env.UCN_DATA_DIR || path.join(os.homedir(), 'universida-datos');
const SALIDA = process.env.ESCANER_SALIDA || path.join(DATOS, 'escaneos');
const REMOTO = process.env.DRIVE_CURSOS_REMOTO || 'ENZO1:01_Universidad_FIME';
const MAX_BYTES = 60 * 1024 * 1024;

// IA local (lógica compartida con la app en public/ia.js): IA_URL fija un servidor; si no, se prueban los habituales
const IA = require('./public/ia.js');
const IA_CANDIDATOS = process.env.IA_URL
  ? [{ nombre: 'IA_URL', url: process.env.IA_URL.replace(/\/$/, ''), formato: process.env.IA_FORMATO || 'auto' }]
  : IA.CANDIDATOS;
const IA_OPCIONES = {
  clave: process.env.IA_API_KEY || 'local',
  modelo: process.env.IA_MODELO,
  timeoutMs: Number(process.env.IA_TIMEOUT_MS) || 180_000,
  maxChars: Number(process.env.IA_MAX_CHARS) || 6000,
};
const { CARPETAS } = IA;

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm', '.gz': 'application/octet-stream',
};

// Un segmento de ruta seguro: sin barras, sin "..", sin caracteres de control
const segmento = (s) => String(s || '').replace(/[\/\\\x00-\x1f]/g, '').replace(/\.\.+/g, '.').replace(/^\.+/, '').trim().slice(0, 120);

function leerCuerpo(req) {
  return new Promise((ok, mal) => {
    const partes = []; let total = 0;
    req.on('data', (c) => { total += c.length; if (total > MAX_BYTES) { mal(new Error('archivo muy grande')); req.destroy(); } else partes.push(c); });
    req.on('end', () => ok(Buffer.concat(partes)));
    req.on('error', mal);
  });
}

function responder(res, codigo, obj) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

// ---------- IA ----------
let iaCache = null; // { proveedor, hasta }

async function proveedorIA(forzar = false) {
  if (!forzar && iaCache && iaCache.hasta > Date.now()) return iaCache.proveedor;
  const proveedor = await IA.detectar(IA_CANDIDATOS, IA_OPCIONES);
  iaCache = { proveedor, hasta: Date.now() + 60_000 };
  return proveedor;
}

async function clasificar(texto) {
  const p = await proveedorIA();
  if (!p) throw new Error('no hay IA local corriendo (fcc-server, Ollama, LM Studio, llama.cpp…)');
  try {
    return await IA.clasificar(p, texto, IA_OPCIONES);
  } catch (e) {
    iaCache = null; // el servidor pudo caerse: volver a detectar la próxima vez
    throw e;
  }
}

function rutaDestino(q) {
  const semestre = /^S(0[1-9]|10)_Semestre$/.test(q.get('semestre')) ? q.get('semestre') : null;
  const curso = segmento(q.get('curso'));
  const carpeta = CARPETAS.includes(q.get('carpeta')) ? q.get('carpeta') : '02_Teoria_y_Diapositivas';
  if (semestre && curso) return `${semestre}/${curso}/${carpeta}`;
  return `98_Por_Clasificar/Desde_escaner_${new Date().toISOString().slice(0, 7)}`;
}

function guardarLocal(buf, nombre) {
  fs.mkdirSync(SALIDA, { recursive: true });
  let destino = path.join(SALIDA, `${nombre}.pdf`);
  for (let i = 2; fs.existsSync(destino); i++) destino = path.join(SALIDA, `${nombre}_${i}.pdf`);
  fs.writeFileSync(destino, buf);
  return destino;
}

const rclone = (args) => new Promise((ok, mal) =>
  execFile('rclone', args, { timeout: 10 * 60 * 1000 }, (e, so, se) => (e ? mal(new Error(se || e.message)) : ok(so))));

async function api(req, res, url) {
  if (url.pathname === '/api/estado') {
    return responder(res, 200, { ok: true, salida: SALIDA, remoto: REMOTO, ia: await proveedorIA(url.searchParams.has('redetectar')) });
  }
  if (req.method !== 'POST') return responder(res, 405, { error: 'usar POST' });

  if (url.pathname === '/api/ia') {
    const { texto } = JSON.parse((await leerCuerpo(req)).toString('utf8') || '{}');
    if (!texto) return responder(res, 400, { error: 'falta texto' });
    return responder(res, 200, await clasificar(texto));
  }

  if (url.pathname === '/api/subir') {
    const q = url.searchParams;
    const nombre = segmento(q.get('nombre')).replace(/\.pdf$/i, '').replace(/\s+/g, '_') || `Escaneo_${Date.now()}`;
    const local = guardarLocal(await leerCuerpo(req), nombre);
    if (q.get('drive') !== '1') return responder(res, 200, { local });
    // Solo copiar, nunca sobrescribir (reglas de drive-cursos)
    const remoto = `${REMOTO}/${rutaDestino(q)}/${path.basename(local)}`;
    await rclone(['copyto', '--ignore-existing', local, remoto]);
    return responder(res, 200, { local, remoto });
  }
  responder(res, 404, { error: 'no existe' });
}

function estatico(res, url) {
  const ruta = path.normalize(path.join(PUBLICO, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
  if (!ruta.startsWith(PUBLICO)) { res.writeHead(403); return res.end(); }
  fs.readFile(ruta, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('no encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] || 'application/octet-stream' });
    res.end(buf);
  });
}

const libs = require('./descargar-libs');
if (libs.faltantes().length) {
  console.log('Faltan librerías en public/vendor, descargando (solo la primera vez)…');
  libs.descargar().catch((e) => console.error(`No se pudieron descargar: ${e.message}`));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else estatico(res, url);
  } catch (e) {
    responder(res, 500, { error: e.message });
  }
}).listen(PORT, async () => {
  console.log(`Escáner OCR en http://localhost:${PORT}  (salida: ${SALIDA}, remoto: ${REMOTO})`);
  const p = await proveedorIA();
  console.log(p ? `IA: ${p.nombre} · ${p.modelo} (${p.url})` : 'IA: ninguna detectada (la app funciona; el destino se completa a mano)');
});
