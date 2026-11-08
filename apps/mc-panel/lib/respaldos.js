// Respaldos del mundo: tar.gz con el servidor guardado en caliente, rotación, copia a Drive y restauración
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const srv = require('./servidores');

let DIR = null;
const REMOTO = process.env.MC_DRIVE_REMOTO || 'ENZO1:05_Juegos_y_Ocio/Minecraft';
const enCurso = new Set();

function configurar(dirDatos) {
  DIR = path.join(dirDatos, 'respaldos');
  fs.mkdirSync(DIR, { recursive: true });
}

const carpeta = (id) => path.join(DIR, id);
const ejecutar = (cmd, args, opciones = {}) => new Promise((ok, mal) =>
  execFile(cmd, args, { timeout: 30 * 60 * 1000, ...opciones }, (e, so, se) => (e ? mal(new Error(se || e.message)) : ok(so))));

// Carpetas de mundo = las que tienen level.dat (world, world_nether, world_the_end…)
const mundos = (id) => fs.readdirSync(srv.carpeta(id), { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(srv.carpeta(id), d.name, 'level.dat')))
  .map((d) => d.name);

function listar(id) {
  if (!fs.existsSync(carpeta(id))) return [];
  return fs.readdirSync(carpeta(id)).filter((f) => f.endsWith('.tar.gz')).sort().reverse()
    .map((f) => ({ archivo: f, mb: +(fs.statSync(path.join(carpeta(id), f)).size / 2 ** 20).toFixed(1) }));
}

async function respaldar(id, motivo = 'manual') {
  if (enCurso.has(id)) throw new Error('ya hay un respaldo en curso');
  const lista = mundos(id);
  if (!lista.length) throw new Error('todavía no hay mundo (inicia el servidor una vez)');
  enCurso.add(id);
  const encendido = !!srv.instancia(id).proc;
  try {
    // En caliente: desactivar el guardado automático y forzar guardado completo antes de comprimir
    if (encendido) {
      srv.comando(id, 'save-off');
      const guardado = srv.esperarLinea(id, /Saved the game|saved the game|All dimensions are saved/, 120_000);
      srv.comando(id, 'save-all flush');
      await guardado;
    }
    // Hora local con segundos: dos respaldos seguidos no se pisan
    const d = new Date(), n = (x) => String(x).padStart(2, '0');
    const sello = `${d.getFullYear()}${n(d.getMonth() + 1)}${n(d.getDate())}-${n(d.getHours())}${n(d.getMinutes())}${n(d.getSeconds())}`;
    const archivo = `${id}-${sello}.tar.gz`;
    fs.mkdirSync(carpeta(id), { recursive: true });
    srv.panel(id, `Respaldo (${motivo}): comprimiendo ${lista.join(', ')}…`);
    await ejecutar('tar', ['-czf', path.join(carpeta(id), archivo), '-C', srv.carpeta(id), ...lista]);
    srv.panel(id, `Respaldo listo: ${archivo}`);
    const cfg = srv.leerCfg(id);
    if (cfg.respaldoDrive) {
      await ejecutar('rclone', ['copy', '--ignore-existing', path.join(carpeta(id), archivo), `${REMOTO}/${id}`])
        .then(() => srv.panel(id, `Subido a ${REMOTO}/${id}`))
        .catch((e) => srv.panel(id, `No se pudo subir a Drive: ${e.message}`));
    }
    podar(id, cfg.respaldosGuardar);
    cfg.ultimoRespaldo = new Date().toISOString();
    fs.writeFileSync(path.join(srv.carpeta(id), 'panel.json'), JSON.stringify(cfg, null, 2));
    return archivo;
  } finally {
    if (encendido && srv.instancia(id).proc) srv.comando(id, 'save-on');
    enCurso.delete(id);
  }
}

// Conserva los N respaldos locales más nuevos (0 = conservar todos); Drive nunca se poda
function podar(id, guardar) {
  if (!guardar) return;
  for (const { archivo } of listar(id).slice(guardar)) {
    fs.rmSync(path.join(carpeta(id), archivo));
    srv.panel(id, `Respaldo antiguo eliminado por rotación: ${archivo}`);
  }
}

// Restaurar con el servidor apagado; el mundo actual se renombra (no se borra) por si acaso
async function restaurar(id, archivo) {
  const nombre = path.basename(String(archivo));
  const ruta = path.join(carpeta(id), nombre);
  if (!fs.existsSync(ruta)) throw new Error('respaldo no encontrado');
  if (srv.instancia(id).proc) throw new Error('detén el servidor antes de restaurar');
  const sello = Date.now();
  for (const m of mundos(id)) fs.renameSync(path.join(srv.carpeta(id), m), path.join(srv.carpeta(id), `${m}.antes-${sello}`));
  await ejecutar('tar', ['-xzf', ruta, '-C', srv.carpeta(id)]);
  srv.panel(id, `Restaurado ${nombre}. El mundo anterior quedó como *.antes-${sello}`);
}

// Cada 10 min revisa qué servidores encendidos tocan respaldo según su intervalo
function programar() {
  setInterval(() => {
    for (const s of srv.listar()) {
      if (!s.respaldoHoras || s.estado !== 'encendido') continue;
      const ultimo = s.ultimoRespaldo ? Date.parse(s.ultimoRespaldo) : 0;
      if (Date.now() - ultimo >= s.respaldoHoras * 3600e3) respaldar(s.id, 'automático').catch((e) => srv.panel(s.id, `Respaldo automático falló: ${e.message}`));
    }
  }, 10 * 60 * 1000).unref();
}

module.exports = { configurar, listar, respaldar, restaurar, programar, REMOTO };
