// Descargas: Paper (Fill v3), Fabric (meta), Geyser/Floodgate, Modrinth y el agente de playit.gg
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

// Node prueba IPv6/IPv4 con solo 250 ms por intento: con datos móviles o WiFi lenta no alcanza
require('node:net').setDefaultAutoSelectFamilyAttemptTimeout?.(3000);

const UA = 'gaelrenzo/uso-com-n- mc-panel'; // Modrinth y PaperMC piden un User-Agent identificable
const MODRINTH = 'https://api.modrinth.com/v2';
const LOADERS = { paper: ['paper', 'spigot', 'bukkit', 'purpur'], fabric: ['fabric'] };

// Reintenta errores de red (no los HTTP 4xx) hasta 3 veces
async function pedir(url) {
  for (let intento = 1; ; intento++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA } });
      if (!r.ok) throw Object.assign(new Error(`${url} → ${r.status}`), { http: r.status });
      return r;
    } catch (e) {
      if (intento >= 3 || (e.http && e.http < 500)) throw e;
      await new Promise((ok) => setTimeout(ok, 1500 * intento));
    }
  }
}

const json = async (url) => (await pedir(url)).json();

// Descarga a <destino>.tmp y renombra al final; si se da sha256, lo verifica
async function bajar(url, destino, sha256) {
  const r = await pedir(url);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const tmp = `${destino}.tmp`;
  const hash = crypto.createHash('sha256');
  const cuerpo = Readable.fromWeb(r.body);
  cuerpo.on('data', (c) => hash.update(c));
  await pipeline(cuerpo, fs.createWriteStream(tmp));
  if (sha256 && hash.digest('hex') !== sha256) { fs.rmSync(tmp); throw new Error(`checksum distinto en ${path.basename(destino)}`); }
  fs.renameSync(tmp, destino);
  return destino;
}

const estable = (v) => /^\d+(\.\d+)+$/.test(v);

// ---------- Paper ----------
async function versionesPaper() {
  const p = await json('https://fill.papermc.io/v3/projects/paper');
  return Object.values(p.versions).flat().filter(estable);
}

// Java mínimo y opciones JVM recomendadas por PaperMC para esa versión
async function requisitosPaper(version) {
  try {
    const v = await json(`https://fill.papermc.io/v3/projects/paper/versions/${version}`);
    return { javaMin: v.version.java.version.minimum, flags: v.version.java.flags?.recommended || [] };
  } catch {
    return { javaMin: 21, flags: [] };
  }
}

async function bajarPaper(version, destino) {
  const b = await json(`https://fill.papermc.io/v3/projects/paper/versions/${version}/builds/latest`);
  const d = b.downloads['server:default'];
  await bajar(d.url, destino, d.checksums.sha256);
  return `Paper ${version} build ${b.id}`;
}

// ---------- Fabric ----------
async function versionesFabric() {
  return (await json('https://meta.fabricmc.net/v2/versions/game')).filter((v) => v.stable).map((v) => v.version);
}

async function bajarFabric(version, destino) {
  const loader = (await json(`https://meta.fabricmc.net/v2/versions/loader/${version}`)).find((l) => l.loader.stable)?.loader.version;
  const instalador = (await json('https://meta.fabricmc.net/v2/versions/installer')).find((i) => i.stable)?.version;
  if (!loader || !instalador) throw new Error(`Fabric no tiene loader estable para ${version}`);
  await bajar(`https://meta.fabricmc.net/v2/versions/loader/${version}/${loader}/${instalador}/server/jar`, destino);
  return `Fabric ${version} (loader ${loader})`;
}

// ---------- Geyser + Floodgate (jugadores Bedrock) ----------
async function bajarGeyser(plataforma, carpeta) {
  const tipo = plataforma === 'fabric' ? 'fabric' : 'spigot';
  for (const proyecto of ['geyser', 'floodgate']) {
    const b = await json(`https://download.geysermc.org/v2/projects/${proyecto}/versions/latest/builds/latest`);
    const d = b.downloads[tipo];
    await bajar(`https://download.geysermc.org/v2/projects/${proyecto}/versions/${b.version}/builds/${b.build}/downloads/${tipo}`,
      path.join(carpeta, d.name), d.sha256);
  }
}

// ---------- Modrinth ----------
async function buscarModrinth(q, plataforma, version) {
  const facetas = plataforma === 'fabric'
    ? [['project_type:mod'], ['categories:fabric'], ['server_side:required', 'server_side:optional']]
    : [['project_type:plugin'], LOADERS.paper.map((l) => `categories:${l}`)];
  if (version) facetas.push([`versions:${version}`]);
  const url = `${MODRINTH}/search?limit=20&query=${encodeURIComponent(q)}&facets=${encodeURIComponent(JSON.stringify(facetas))}`;
  return (await json(url)).hits.map((h) => ({
    id: h.project_id, slug: h.slug, titulo: h.title, descripcion: h.description, descargas: h.downloads, icono: h.icon_url,
  }));
}

// Instala la versión más nueva compatible y sus dependencias obligatorias; devuelve los archivos instalados
async function instalarModrinth(proyecto, plataforma, version, carpeta, vistos = new Set()) {
  if (vistos.has(proyecto)) return [];
  vistos.add(proyecto);
  const q = `loaders=${encodeURIComponent(JSON.stringify(LOADERS[plataforma]))}&game_versions=${encodeURIComponent(JSON.stringify([version]))}`;
  const [v] = await json(`${MODRINTH}/project/${proyecto}/version?${q}`);
  if (!v) throw new Error(`${proyecto} no tiene versión para ${plataforma} ${version}`);
  const archivo = v.files.find((f) => f.primary) || v.files[0];
  await bajar(archivo.url, path.join(carpeta, archivo.filename));
  const instalados = [archivo.filename];
  for (const dep of v.dependencies.filter((d) => d.dependency_type === 'required' && d.project_id)) {
    instalados.push(...await instalarModrinth(dep.project_id, plataforma, version, carpeta, vistos).catch(() => []));
  }
  return instalados;
}

// ---------- playit.gg ----------
function nombrePlayit() {
  const arq = { arm64: 'aarch64', x64: 'amd64', arm: 'armv7', ia32: 'i686' }[process.arch];
  if (process.platform === 'win32') return process.arch === 'x64' ? 'playit-windows-x86_64-signed.exe' : 'playit-windows-x86-signed.exe';
  if (process.platform === 'linux' && arq) return `playit-linux-${arq}`;
  throw new Error(`playit no publica binario para ${process.platform}/${process.arch}`);
}

async function bajarPlayit(destino) {
  await bajar(`https://github.com/playit-cloud/playit-agent/releases/latest/download/${nombrePlayit()}`, destino);
  if (process.platform !== 'win32') fs.chmodSync(destino, 0o755);
}

module.exports = {
  versionesPaper, requisitosPaper, bajarPaper, versionesFabric, bajarFabric, bajarGeyser,
  buscarModrinth, instalarModrinth, bajarPlayit, bajar,
};
