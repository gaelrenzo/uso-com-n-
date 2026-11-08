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

// IA local: IA_URL fija un servidor; si no, se prueban los habituales en orden.
// formato "anthropic" = /v1/messages (fcc-server); "openai" = /v1/chat/completions (Ollama, LM Studio, llama.cpp, vLLM, Jan…)
const IA_CANDIDATOS = process.env.IA_URL
  ? [{ nombre: 'IA_URL', url: process.env.IA_URL.replace(/\/$/, ''), formato: process.env.IA_FORMATO || 'auto' }]
  : [
    { nombre: 'fcc-server', url: 'http://127.0.0.1:8082', formato: 'anthropic' },
    { nombre: 'Ollama', url: 'http://127.0.0.1:11434', formato: 'openai' },
    { nombre: 'LM Studio', url: 'http://127.0.0.1:1234', formato: 'openai' },
    { nombre: 'llama.cpp', url: 'http://127.0.0.1:8081', formato: 'openai' },
    { nombre: 'Jan', url: 'http://127.0.0.1:1337', formato: 'openai' },
    { nombre: 'vLLM', url: 'http://127.0.0.1:8000', formato: 'openai' },
  ];
const IA_CLAVE = process.env.IA_API_KEY || 'local';

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm', '.gz': 'application/octet-stream',
};
const CARPETAS = [
  '01_Silabo_y_Planificacion', '02_Teoria_y_Diapositivas', '03_Bibliografia_y_Textos',
  '04_Practicas_y_Laboratorios', '05_Tareas_y_Proyectos', '06_Examenes_y_Evaluaciones',
  '07_Software_y_Scripts', '08_Recursos_y_Repositorios',
];

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

// Un candidato sirve si responde /v1/models; para "openai" además debe tener algún modelo de chat cargado
async function sondear(c) {
  try {
    const r = await fetch(`${c.url}/v1/models`, { headers: { authorization: `Bearer ${IA_CLAVE}`, 'x-api-key': IA_CLAVE }, signal: AbortSignal.timeout(1500) });
    const modelos = r.ok ? ((await r.json()).data || []).map((m) => m.id).filter((id) => !/embed|rerank|whisper/i.test(id)) : [];
    const formato = c.formato === 'auto' ? (modelos.some((m) => /^claude/.test(m)) ? 'anthropic' : 'openai') : c.formato;
    const modelo = process.env.IA_MODELO || (formato === 'anthropic' ? 'claude-sonnet-5-5' : modelos[0]);
    if (!modelo || (formato === 'openai' && !r.ok)) return null;
    return { nombre: c.nombre, url: c.url, formato, modelo };
  } catch {
    return null; // no hay servidor en ese puerto
  }
}

async function proveedorIA(forzar = false) {
  if (!forzar && iaCache && iaCache.hasta > Date.now()) return iaCache.proveedor;
  let proveedor = null;
  for (const c of IA_CANDIDATOS) if ((proveedor = await sondear(c))) break;
  iaCache = { proveedor, hasta: Date.now() + 60_000 };
  return proveedor;
}

async function preguntarIA(p, prompt) {
  const comun = { method: 'POST', signal: AbortSignal.timeout(Number(process.env.IA_TIMEOUT_MS) || 180_000) };
  let r, texto;
  if (p.formato === 'anthropic') {
    r = await fetch(`${p.url}/v1/messages`, {
      ...comun,
      headers: { 'content-type': 'application/json', 'x-api-key': IA_CLAVE, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: p.modelo, max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
    });
    if (r.ok) texto = ((await r.json()).content || []).map((b) => b.text || '').join('');
  } else {
    r = await fetch(`${p.url}/v1/chat/completions`, {
      ...comun,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${IA_CLAVE}` },
      body: JSON.stringify({ model: p.modelo, temperature: 0.2, max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
    });
    if (r.ok) texto = (await r.json()).choices?.[0]?.message?.content || '';
  }
  if (!r.ok) throw new Error(`${p.nombre} respondió ${r.status}`);
  return texto.replace(/<think>[\s\S]*?<\/think>/g, ''); // modelos con razonamiento (qwen3, deepseek-r1)
}

async function clasificar(texto) {
  const p = await proveedorIA();
  if (!p) throw new Error('no hay IA local corriendo (fcc-server, Ollama, LM Studio, llama.cpp…)');
  const prompt = `Eres el clasificador de documentos de un estudiante de ingeniería (FIME, semestres S01–S10, actual S09).
Del texto OCR de un documento escaneado, responde SOLO un JSON, sin texto extra:
{"semestre":"S09_Semestre" o null,"curso":"Nombre del curso con tildes" o null,"carpeta":uno de ${JSON.stringify(CARPETAS)},"nombre":"Nombre_corto_sin_espacios","resumen":"2-3 frases","formulas":["..."]}
Si no estás seguro del curso, usa null (no adivines).

TEXTO:
${texto.slice(0, Number(process.env.IA_MAX_CHARS) || 6000)}`;
  let salida;
  try {
    salida = await preguntarIA(p, prompt);
  } catch (e) {
    iaCache = null; // el servidor pudo caerse: volver a detectar la próxima vez
    throw e;
  }
  const json = salida.match(/\{[\s\S]*\}/);
  if (!json) throw new Error(`${p.nombre} no devolvió JSON`);
  return { ...JSON.parse(json[0]), ia: `${p.nombre} · ${p.modelo}` };
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
