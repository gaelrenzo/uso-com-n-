// Panel de servidores Minecraft (Paper/Fabric + Geyser, playit.gg, Modrinth, respaldos, IA local). Sin dependencias npm.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const srv = require('./lib/servidores');
const resp = require('./lib/respaldos');
const playit = require('./lib/playit');
const des = require('./lib/descargas');
const IA = require('../escaner-ocr/public/ia.js'); // misma detección de IA local que el escáner

const PORT = Number(process.env.PORT) || 8095;
const HOST = process.env.MC_HOST || '127.0.0.1'; // 0.0.0.0 para controlarlo desde otro equipo de la red (pide token)
const DATOS = process.env.MC_DATOS || path.join(os.homedir(), 'minecraft');
const PUBLICO = path.join(__dirname, 'public');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

fs.mkdirSync(DATOS, { recursive: true });
srv.configurar(DATOS);
resp.configurar(DATOS);
playit.configurar(DATOS);
resp.programar();

// Al aprobar el agente en playit: crear los túneles de cada servidor y guardar sus direcciones, sin más pasos
playit.cuandoSeVincule(async () => {
  for (const s of srv.listar()) {
    const tuneles = (await playit.crearTuneles(s)).filter((t) => t.propio);
    const java = tuneles.find((t) => t.tipo === 'minecraft-java' && t.localPuerto === s.puerto);
    const bedrock = tuneles.find((t) => t.protocolo === 'udp' && t.localPuerto === s.puertoBedrock);
    srv.actualizarCfg(s.id, { direccionJava: java?.publica || s.direccionJava, direccionBedrock: bedrock?.publica || s.direccionBedrock });
    srv.panel(s.id, `Túneles listos: ${[java?.publica, bedrock?.publica].filter(Boolean).join(' · ') || 'asignando dirección…'}`);
  }
});

// Token: el panel ejecuta comandos, así que fuera de este equipo se exige el token guardado en DATOS/token
const rutaToken = path.join(DATOS, 'token');
if (!fs.existsSync(rutaToken)) fs.writeFileSync(rutaToken, crypto.randomBytes(16).toString('hex'), { mode: 0o600 });
const TOKEN = fs.readFileSync(rutaToken, 'utf8').trim();
const local = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const autorizado = (req, url) => local(req) || [req.headers['x-token'], url.searchParams.get('token')].some((t) => t && t.length === TOKEN.length
  && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(TOKEN)));

let iaCache = null;
async function proveedorIA(forzar) {
  if (forzar || !iaCache || iaCache.hasta < Date.now()) {
    const candidatos = process.env.IA_URL ? [{ nombre: 'IA_URL', url: process.env.IA_URL, formato: process.env.IA_FORMATO || 'auto' }] : IA.CANDIDATOS;
    iaCache = { p: await IA.detectar(candidatos, { modelo: process.env.IA_MODELO }), hasta: Date.now() + 60_000 };
  }
  return iaCache.p;
}

// El asistente recibe el contexto real del servidor: consola reciente, propiedades, RAM y plugins
async function asistente(id, pregunta) {
  const p = await proveedorIA();
  if (!p) throw new Error('no hay IA local corriendo (Ollama, LM Studio, llama.cpp, fcc-server…)');
  const s = srv.resumen(id), props = srv.leerPropiedades(id), ex = srv.extras(id);
  const consola = srv.instancia(id).log.slice(-120).join('\n').slice(-6000);
  const prompt = `Eres un experto en servidores de Minecraft (${s.plataforma}). Responde en español, breve y con pasos concretos
(comandos de consola o claves de server.properties exactas). Si el problema es de RAM o lag, considera que corre en ${os.platform()} ${os.arch()}
con ${Math.round(os.totalmem() / 2 ** 30)} GB de RAM total y ${Math.round(os.freemem() / 2 ** 20)} MB libres.

Servidor: ${s.nombre} · ${s.plataforma} ${s.version} · ${s.ramMB} MB asignados · estado ${s.estado} · Bedrock: ${s.bedrock ? 'sí (Geyser)' : 'no'}
Jugadores: ${s.jugadores.join(', ') || 'ninguno'}
${s.plataforma === 'fabric' ? 'Mods' : 'Plugins'}: ${ex.activos.join(', ') || 'ninguno'}
server.properties: ${JSON.stringify(Object.fromEntries(srv.EDITABLES.map((k) => [k, props[k]])))}

Consola (últimas líneas):
${consola || '(vacía)'}

Pregunta: ${pregunta}`;
  return { respuesta: (await IA.preguntar(p, prompt, { timeoutMs: 240_000 })).trim(), ia: `${p.nombre} · ${p.modelo}` };
}

// ---------- HTTP ----------
const MAX_JSON = 64 * 1024;
const leerJSON = (req) => new Promise((ok, mal) => {
  let d = '';
  req.on('data', (c) => { d += c; if (d.length > MAX_JSON) { mal(new Error('cuerpo muy grande')); req.destroy(); } });
  req.on('end', () => { try { ok(d ? JSON.parse(d) : {}); } catch { mal(new Error('JSON inválido')); } });
});

function responder(res, codigo, obj) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function sse(res) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const latido = setInterval(() => res.write(': ping\n\n'), 25_000);
  res.on('close', () => clearInterval(latido));
}

async function api(req, res, url) {
  const partes = url.pathname.split('/').filter(Boolean).slice(1); // sin "api"
  const metodo = req.method;
  const [recurso, id, accion] = partes;

  if (recurso === 'info') {
    return responder(res, 200, {
      ramLibreMB: Math.round(os.freemem() / 2 ** 20), ramTotalMB: Math.round(os.totalmem() / 2 ** 20), ramSugeridaMB: srv.ramSugerida(),
      java: srv.versionJava(), plataforma: `${os.platform()} ${os.arch()}`, ia: await proveedorIA(url.searchParams.has('redetectar')),
      drive: resp.REMOTO, ips: Object.values(os.networkInterfaces()).flat().filter((i) => i.family === 'IPv4' && !i.internal).map((i) => i.address),
    });
  }
  if (recurso === 'apagar' && metodo === 'POST') {
    responder(res, 200, { ok: true });
    return setImmediate(apagar);
  }
  if (recurso === 'versiones') {
    const plataforma = url.searchParams.get('plataforma') === 'fabric' ? 'fabric' : 'paper';
    return responder(res, 200, plataforma === 'fabric' ? await des.versionesFabric() : await des.versionesPaper());
  }
  if (recurso === 'modrinth') {
    return responder(res, 200, await des.buscarModrinth(url.searchParams.get('q') || '', url.searchParams.get('plataforma') || 'paper', url.searchParams.get('version')));
  }
  if (recurso === 'playit') {
    if (id === 'consola') { sse(res); return playit.suscribir(res); }
    if (metodo === 'POST' && id === 'instalar') { await playit.instalar(); return responder(res, 200, playit.estado()); }
    if (metodo === 'POST' && id === 'iniciar') return responder(res, 200, playit.iniciar());
    if (metodo === 'POST' && id === 'detener') { playit.detener(); return responder(res, 200, playit.estado()); }
    if (id === 'tuneles') return responder(res, 200, { tuneles: await playit.tuneles(), puedeCrear: await playit.puedeCrear() });
    if (metodo === 'POST' && id === 'vincular') return responder(res, 200, playit.vincular());
    return responder(res, 200, playit.estado());
  }

  if (recurso !== 'servidores') return responder(res, 404, { error: 'no existe' });
  if (!id) {
    if (metodo === 'POST') return responder(res, 201, srv.crear(await leerJSON(req)));
    return responder(res, 200, srv.listar());
  }
  if (!srv.existe(id)) return responder(res, 404, { error: 'servidor no encontrado' });

  if (!accion) return responder(res, 200, { ...srv.resumen(id), propiedades: srv.leerPropiedades(id), extras: srv.extras(id), respaldos: resp.listar(id) });
  if (accion === 'consola') {
    sse(res);
    const inst = srv.instancia(id);
    for (const l of inst.log) res.write(`event: linea\ndata: ${JSON.stringify(l)}\n\n`);
    res.write(`event: estado\ndata: ${JSON.stringify(srv.resumen(id))}\n\n`);
    inst.oyentes.add(res);
    return res.on('close', () => inst.oyentes.delete(res));
  }
  if (metodo !== 'POST') return responder(res, 405, { error: 'usar POST' });
  const cuerpo = await leerJSON(req);
  switch (accion) {
    case 'iniciar': {
      const s = srv.iniciar(id);
      // Túnel automático: si el agente ya está instalado, arranca junto con el servidor
      if (s.playitAuto !== false && playit.estado().instalado) { try { playit.iniciar(); } catch (e) { srv.panel(id, `playit: ${e.message}`); } }
      return responder(res, 200, s);
    }
    case 'detener': srv.detener(id); return responder(res, 200, srv.resumen(id));
    case 'comando': srv.comando(id, cuerpo.comando); return responder(res, 200, { ok: true });
    case 'propiedades': return responder(res, 200, srv.actualizarPropiedades(id, cuerpo));
    case 'config': return responder(res, 200, srv.actualizarCfg(id, cuerpo));
    case 'instalar-extra': return responder(res, 200, await srv.instalarExtra(id, cuerpo.proyecto));
    case 'mover-extra': return responder(res, 200, srv.moverExtra(id, cuerpo.archivo, !!cuerpo.activar));
    case 'respaldar': return responder(res, 200, { archivo: await resp.respaldar(id), respaldos: resp.listar(id) });
    case 'restaurar': await resp.restaurar(id, cuerpo.archivo); return responder(res, 200, { ok: true });
    case 'tuneles': return responder(res, 200, await playit.crearTuneles(srv.resumen(id)));
    case 'ia': return responder(res, 200, await asistente(id, String(cuerpo.pregunta || '').slice(0, 1000)));
    default: return responder(res, 404, { error: 'acción desconocida' });
  }
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

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (!url.pathname.startsWith('/api/')) return estatico(res, url);
    if (!autorizado(req, url)) return responder(res, 401, { error: 'token requerido' });
    await api(req, res, url);
  } catch (e) {
    if (!res.headersSent) responder(res, 400, { error: e.message });
  }
}).listen(PORT, HOST, () => {
  console.log(`Panel Minecraft en http://localhost:${PORT}  (datos: ${DATOS})`);
  if (HOST !== '127.0.0.1') {
    const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i.family === 'IPv4' && !i.internal).map((i) => i.address);
    for (const ip of ips) console.log(`  desde la red: http://${ip}:${PORT}/?token=${TOKEN}`);
  }
});

// Ctrl+C, cierre de Termux o botón "Apagar" de la app: detener los servidores con "stop" para no corromper mundos
async function apagar() {
  console.log('Deteniendo servidores…');
  playit.detener();
  await Promise.race([srv.detenerTodos(), new Promise((ok) => setTimeout(ok, 70_000))]);
  process.exit(0);
}
for (const senal of ['SIGINT', 'SIGTERM']) process.on(senal, apagar);
