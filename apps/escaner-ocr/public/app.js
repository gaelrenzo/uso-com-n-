// Escáner OCR: cámara → jscanify (bordes + perspectiva, esquinas ajustables) → filtro OpenCV → Tesseract (en segundo plano) → PDF buscable → IA local → Drive
// Modos: con server.js (IA y rclone desde Termux), PWA/navegador (IA directa por CORS, compartir a Drive)
// o APK Capacitor (librerías incluidas; IA por HTTP nativo sin CORS; plugins Filesystem y Share)
const $ = (id) => document.getElementById(id);
const A4 = { w: 1240, h: 1754 }; // 150 dpi
const MAX_LADO = 2000; // reduce fotos grandes de galería para no agotar la RAM
const ORDEN = ['topLeftCorner', 'topRightCorner', 'bottomRightCorner', 'bottomLeftCorner'];
const { CARPETAS } = IA;
// Primero vendor/ (descargado por descargar-libs.js, sin internet); si no existe (GitHub Pages), el CDN
const LIBS = [
  ['vendor/opencv.js', 'https://docs.opencv.org/4.7.0/opencv.js'],
  ['vendor/jscanify.js', 'https://cdn.jsdelivr.net/npm/jscanify@1.4.2/src/jscanify.js'],
  ['vendor/tesseract/tesseract.min.js', 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'],
  ['vendor/jspdf.umd.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'],
];
const CLAVE_AJUSTES = 'escaner-ia';
const DETECCION = 360; // ancho de trabajo para detectar la hoja: rápido y suficiente para ubicar esquinas
// OCR: "rapido" = tessdata_fast solo español (~3x más rápido); "preciso" = best_int español+inglés
const OCR_MODOS = {
  rapido: { idiomas: 'spa', vendor: 'vendor/tessdata_fast', cdn: 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main', gzipCdn: false },
  preciso: { idiomas: 'spa+eng', vendor: 'vendor/tessdata', cdn: null, gzipCdn: true },
};

let escaner, worker, modoWorker, flujo, pdfActual, conVendor, conServidor, iaNavegador, ultimasEsquinas;
const paginas = []; // { original, esquinas, filtro, canvas, mini, ocr (promesa) }

const estado = (t) => ($('estado').textContent = t);
const nativo = () => !!window.Capacitor?.isNativePlatform?.();
const plugin = (n) => window.Capacitor.Plugins?.[n] ?? window.Capacitor.registerPlugin(n);

const blobABase64 = (blob) => new Promise((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1]);
  r.onerror = mal;
  r.readAsDataURL(blob);
});

// APK: escribe el PDF con el plugin Filesystem y devuelve su uri
async function escribirNativo(nombre, directorio) {
  const { uri } = await plugin('Filesystem').writeFile({
    path: directorio === 'DOCUMENTS' ? `Escaneos/${nombre}` : nombre,
    data: await blobABase64(pdfActual), directory: directorio, recursive: true,
  });
  return uri;
}

const cargarScript = (src) => new Promise((ok, mal) => {
  const s = document.createElement('script');
  s.src = src; s.onload = ok; s.onerror = () => { s.remove(); mal(new Error(src)); };
  document.head.append(s);
});

async function cargarLibs() {
  conVendor = true;
  for (const [local, cdn] of LIBS) {
    await cargarScript(local).catch(() => { conVendor = false; return cargarScript(cdn); });
  }
}

async function esperarOpenCV() {
  if (cv instanceof Promise) cv = await cv; // builds nuevos de opencv.js
  if (!cv.Mat) await new Promise((ok) => (cv.onRuntimeInitialized = ok));
}

// ---------- Cámara ----------
async function iniciarCamara() {
  flujo = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false,
  });
  $('video').srcObject = flujo;
  await $('video').play();
  $('btnCapturar').disabled = false;
  $('btnCamara').textContent = 'Detener cámara';
  vistaPrevia();
}

function detenerCamara() {
  flujo?.getTracks().forEach((t) => t.stop());
  flujo = null;
  $('btnCapturar').disabled = true;
  $('btnCamara').textContent = 'Iniciar cámara';
}

function cuadro(ancho, c = document.createElement('canvas')) {
  const v = $('video');
  c.width = ancho; c.height = Math.round((v.videoHeight / v.videoWidth) * ancho);
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  return c;
}

// El video se ve en vivo; encima solo se dibuja el contorno detectado en un cuadro chico (~4 fps)
const lienzoDeteccion = document.createElement('canvas');
function vistaPrevia() {
  if (!flujo) return;
  if (!document.hidden) {
    const chico = cuadro(DETECCION, lienzoDeteccion);
    const e = esquinasEn(chico);
    const o = $('overlay'), v = $('video');
    o.width = v.clientWidth; o.height = v.clientHeight;
    const ctx = o.getContext('2d');
    ctx.clearRect(0, 0, o.width, o.height);
    ultimasEsquinas = e && { esquinas: e, escala: v.videoWidth / chico.width };
    if (e) {
      const k = o.width / chico.width;
      ctx.beginPath();
      ORDEN.forEach((n, i) => ctx[i ? 'lineTo' : 'moveTo'](e[n].x * k, e[n].y * k));
      ctx.closePath();
      ctx.lineWidth = 4; ctx.strokeStyle = '#1f6feb'; ctx.fillStyle = 'rgba(31,111,235,.15)';
      ctx.fill(); ctx.stroke();
    }
  }
  setTimeout(vistaPrevia, 250);
}

// ---------- Esquinas ----------
const esquinasCompletas = (c) => ({
  topLeftCorner: { x: 0, y: 0 }, topRightCorner: { x: c.width, y: 0 },
  bottomRightCorner: { x: c.width, y: c.height }, bottomLeftCorner: { x: 0, y: c.height },
});

// Esquinas de la hoja en el canvas dado, o null
function esquinasEn(c) {
  const m = cv.imread(c);
  try {
    const contorno = escaner.findPaperContour(m);
    const e = contorno && escaner.getCornerPoints(contorno);
    contorno?.delete();
    if (e && ORDEN.every((k) => e[k])) return e;
  } catch { /* sin contorno */ } finally {
    m.delete();
  }
  return null;
}

const escalar = (e, k) => Object.fromEntries(ORDEN.map((n) => [n, { x: e[n].x * k, y: e[n].y * k }]));

// Detecta sobre una copia reducida y escala las esquinas al tamaño original
function detectarEsquinas(c) {
  const k = Math.min(1, DETECCION / c.width);
  const chico = document.createElement('canvas');
  chico.width = Math.round(c.width * k); chico.height = Math.round(c.height * k);
  chico.getContext('2d').drawImage(c, 0, 0, chico.width, chico.height);
  const e = esquinasEn(chico);
  return e ? escalar(e, 1 / k) : esquinasCompletas(c);
}

// Diálogo con las 4 esquinas arrastrables; resuelve con las esquinas o null si se cancela
function editarEsquinas(original, esquinas) {
  return new Promise((resolver) => {
    const dlg = $('editor'), lz = $('lienzo'), ctx = lz.getContext('2d');
    lz.width = original.width; lz.height = original.height;
    const e = structuredClone(esquinas);
    const radio = Math.max(lz.width, lz.height) * 0.025;
    let arrastrando = null;

    const pintar = () => {
      ctx.drawImage(original, 0, 0);
      ctx.beginPath();
      ORDEN.forEach((k, i) => ctx[i ? 'lineTo' : 'moveTo'](e[k].x, e[k].y));
      ctx.closePath();
      ctx.lineWidth = radio / 3; ctx.strokeStyle = '#1f6feb'; ctx.stroke();
      ctx.fillStyle = 'rgba(31,111,235,.35)';
      for (const k of ORDEN) { ctx.beginPath(); ctx.arc(e[k].x, e[k].y, radio, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
    };
    const punto = (ev) => {
      const b = lz.getBoundingClientRect();
      const x = ((ev.clientX - b.left) * lz.width) / b.width, y = ((ev.clientY - b.top) * lz.height) / b.height;
      return { x: Math.min(Math.max(x, 0), lz.width), y: Math.min(Math.max(y, 0), lz.height) };
    };
    // Al tocar se toma la esquina más cercana: cómodo con el dedo
    lz.onpointerdown = (ev) => {
      const p = punto(ev);
      arrastrando = ORDEN.reduce((a, k) => (Math.hypot(e[k].x - p.x, e[k].y - p.y) < Math.hypot(e[a].x - p.x, e[a].y - p.y) ? k : a));
      lz.setPointerCapture(ev.pointerId);
      e[arrastrando] = p; pintar();
    };
    let pendiente = false; // redibuja como máximo una vez por cuadro de pantalla
    lz.onpointermove = (ev) => {
      if (!arrastrando) return;
      e[arrastrando] = punto(ev);
      if (!pendiente) { pendiente = true; requestAnimationFrame(() => { pendiente = false; pintar(); }); }
    };
    lz.onpointerup = () => (arrastrando = null);

    const cerrar = (v) => { dlg.close(); resolver(v); };
    $('btnAceptar').onclick = () => cerrar(e);
    $('btnTodo').onclick = () => cerrar(esquinasCompletas(original));
    $('btnCancelar').onclick = () => cerrar(null);
    dlg.oncancel = () => resolver(null); // tecla Esc / botón atrás
    pintar();
    dlg.showModal();
  });
}

// ---------- Procesado de imagen ----------
function filtrar(origen, filtro) {
  if (filtro === 'color') return origen;
  const m = cv.imread(origen);
  let g = new cv.Mat();
  cv.cvtColor(m, g, cv.COLOR_RGBA2GRAY);
  if (filtro === 'bn') {
    const b = new cv.Mat();
    cv.adaptiveThreshold(g, b, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 31, 15);
    g.delete(); g = b;
  }
  const out = document.createElement('canvas');
  cv.imshow(out, g);
  m.delete(); g.delete();
  return out;
}

function renderizar(p) {
  p.canvas = filtrar(escaner.extractPaper(p.original, A4.w, A4.h, p.esquinas), p.filtro);
  p.mini = p.canvas.toDataURL('image/jpeg', 0.4);
  p.ocr = reconocer(p.canvas); // el OCR corre mientras se capturan las siguientes páginas
  p.ocr.catch(() => {}); // el error se informa al procesar
}

async function agregarPagina(original, esquinas = detectarEsquinas(original)) {
  if ($('revisar').checked && !(esquinas = await editarEsquinas(original, esquinas))) return;
  const p = { original, esquinas, filtro: $('filtro').value };
  renderizar(p);
  paginas.push(p);
  pintarPaginas();
}

async function reeditar(p) {
  const esquinas = await editarEsquinas(p.original, p.esquinas);
  if (!esquinas) return;
  p.esquinas = esquinas;
  p.filtro = $('filtro').value;
  renderizar(p);
  pintarPaginas();
}

function pintarPaginas() {
  $('paginas').replaceChildren(...paginas.map((p, i) => {
    const fig = document.createElement('figure');
    fig.title = 'Tocar para ajustar esquinas';
    fig.onclick = () => reeditar(p);
    const img = new Image();
    img.src = p.mini;
    const quitar = document.createElement('button');
    quitar.textContent = '✕';
    quitar.title = 'Quitar página';
    quitar.onclick = (ev) => { ev.stopPropagation(); paginas.splice(i, 1); pintarPaginas(); };
    fig.append(img, quitar);
    return fig;
  }));
  $('nPaginas').textContent = `(${paginas.length})`;
  $('btnProcesar').disabled = paginas.length === 0;
}

function imagenACanvas(archivo) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, MAX_LADO / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      ok(c);
    };
    img.onerror = mal;
    img.src = URL.createObjectURL(archivo);
  });
}

// ---------- OCR + PDF ----------
// Un solo worker, creado al arrancar (precalentado); Tesseract encola los trabajos en orden
function obtenerWorker() {
  const modo = $('modoOCR').value;
  if (worker && modoWorker === modo) return worker;
  worker?.then((w) => w.terminate()).catch(() => {});
  const m = OCR_MODOS[modo];
  const rutas = conVendor
    ? { workerPath: 'vendor/tesseract/worker.min.js', corePath: 'vendor/tesseract/core', langPath: m.vendor }
    : { ...(m.cdn && { langPath: m.cdn }), gzip: m.gzipCdn }; // sin vendor: CDN; el idioma queda en IndexedDB
  modoWorker = modo;
  worker = Tesseract.createWorker(m.idiomas, 1, {
    ...rutas,
    logger: (x) => x.status === 'recognizing text' && ($('progreso').value = x.progress),
  });
  worker.catch(() => { worker = null; });
  return worker;
}

async function reconocer(canvas) {
  return (await (await obtenerWorker()).recognize(canvas)).data;
}

// Espera el OCR de cada página (casi siempre ya terminó en segundo plano); reintenta las que fallaron
async function ocr() {
  const datos = [];
  for (const [i, p] of paginas.entries()) {
    estado(`OCR página ${i + 1}/${paginas.length}…`);
    datos.push(await p.ocr.catch(() => (p.ocr = reconocer(p.canvas))));
  }
  return datos;
}

// PDF A4 con la imagen y el texto OCR invisible encima (buscable/copiable)
function armarPDF(datos) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  paginas.forEach((p, i) => {
    if (i) doc.addPage();
    doc.addImage(p.canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, 210, 297);
    const k = 210 / p.canvas.width;
    for (const linea of datos[i]?.lines || []) {
      const { x0, y0, y1 } = linea.bbox;
      doc.setFontSize(Math.max(4, (y1 - y0) * k * 2.83));
      doc.text(linea.text.trim(), x0 * k, y1 * k, { renderingMode: 'invisible', baseline: 'bottom' });
    }
  });
  return doc.output('blob');
}

async function clasificarConIA(texto) {
  try {
    if (!conServidor) {
      iaNavegador ??= await detectarIANavegador();
      if (!iaNavegador) throw new Error('no se encontró IA local; revisa "Ajustes de IA"');
      return await IA.clasificar(iaNavegador, texto).catch((e) => { iaNavegador = null; throw e; });
    }
    const r = await fetch('api/ia', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texto }) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
    return await r.json();
  } catch (e) {
    estado(`IA no disponible (${e.message}); completa el destino a mano`);
    return {};
  }
}

async function procesar() {
  $('btnProcesar').disabled = true;
  $('progreso').hidden = false;
  try {
    const datos = await ocr();
    const texto = datos.map((d) => d.text).join('\n\n---\n\n');
    $('texto').textContent = texto;
    estado('Clasificando con IA… (un modelo local puede tardar)');
    const ia = await clasificarConIA(texto);
    const f = $('formDestino').elements;
    f.nombre.value = ia.nombre || `Escaneo_${new Date().toISOString().slice(0, 10)}`;
    f.semestre.value = ia.semestre || 'S09_Semestre';
    f.curso.value = ia.curso || '';
    f.carpeta.value = CARPETAS.includes(ia.carpeta) ? ia.carpeta : '02_Teoria_y_Diapositivas';
    $('resumen').textContent = [ia.resumen, ...(ia.formulas || [])].filter(Boolean).join(' · ');
    $('iaUsada').textContent = ia.ia ? `Clasificado por ${ia.ia}` : '';
    pdfActual = armarPDF(datos);
    $('resultado').hidden = false;
    if (ia.nombre) estado('Listo: revisa el destino y guarda');
  } catch (e) {
    estado(`Error: ${e.message}`);
  } finally {
    $('progreso').hidden = true;
    $('btnProcesar').disabled = false;
  }
}

function rutaSugerida(f) {
  return f.get('curso')
    ? `01_Universidad_FIME/${f.get('semestre')}/${f.get('curso')}/${f.get('carpeta')}`
    : `01_Universidad_FIME/98_Por_Clasificar/Desde_escaner_${new Date().toISOString().slice(0, 7)}`;
}

// Sin servidor: menú "Compartir" de Android (Drive, WhatsApp, Gmail…); si no se puede, descarga
async function compartir(f) {
  const archivo = new File([pdfActual], `${f.get('nombre') || 'escaneo'}.pdf`, { type: 'application/pdf' });
  if (nativo()) {
    try {
      await plugin('Share').share({ title: archivo.name, text: `Guardar en: ${rutaSugerida(f)}`, files: [await escribirNativo(archivo.name, 'CACHE')] });
      estado(`Compartido. Carpeta sugerida: ${rutaSugerida(f)}`);
    } catch (e) {
      if (!/cancel/i.test(e.message)) estado(`No se pudo compartir (${e.message})`);
    }
    return;
  }
  if (!navigator.canShare?.({ files: [archivo] })) return descargar();
  try {
    await navigator.share({ files: [archivo], title: archivo.name, text: `Guardar en: ${rutaSugerida(f)}` });
    estado(`Compartido. Carpeta sugerida: ${rutaSugerida(f)}`);
  } catch (e) {
    if (e.name !== 'AbortError') estado(`No se pudo compartir (${e.message})`);
  }
}

async function guardar(ev) {
  ev.preventDefault();
  const f = new FormData(ev.target);
  if (!conServidor) return compartir(f);
  const q = new URLSearchParams({
    nombre: f.get('nombre'), semestre: f.get('semestre'), curso: f.get('curso'),
    carpeta: f.get('carpeta'), drive: f.get('drive') ? '1' : '0',
  });
  estado(f.get('drive') ? 'Guardando y subiendo a Drive…' : 'Guardando…');
  try {
    const r = await fetch(`api/subir?${q}`, { method: 'POST', body: pdfActual });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    estado(d.remoto ? `Subido: ${d.remoto}` : `Guardado: ${d.local}`);
  } catch (e) {
    estado(`No se pudo guardar (${e.message}). Usa "Descargar PDF".`);
  }
}

async function descargar() {
  if (nativo()) { // el WebView no descarga blobs: se guarda en Documentos/Escaneos
    try {
      await escribirNativo(`${$('formDestino').elements.nombre.value || 'escaneo'}.pdf`, 'DOCUMENTS');
      estado('Guardado en Documentos/Escaneos');
    } catch (e) {
      estado(`No se pudo guardar (${e.message})`);
    }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(pdfActual);
  a.download = `${$('formDestino').elements.nombre.value || 'escaneo'}.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Fotos compartidas a la app (Galería → Compartir → Escáner) ----------
// El service worker guarda las imágenes del share_target en la caché "compartidos" y redirige a ?compartido=N
async function recibirCompartidas() {
  const params = new URLSearchParams(location.search);
  if (!params.has('compartido') || !('caches' in window)) return;
  history.replaceState(null, '', location.pathname);
  const cache = await caches.open('compartidos');
  for (const req of await cache.keys()) {
    const blob = await (await cache.match(req)).blob();
    await cache.delete(req);
    await agregarPagina(await imagenACanvas(blob));
  }
  estado(`${paginas.length} imagen(es) recibida(s)`);
}

// ---------- Arranque ----------
function llenarSelects() {
  const f = $('formDestino').elements;
  for (let s = 1; s <= 10; s++) f.semestre.add(new Option(`S${String(s).padStart(2, '0')}`, `S${String(s).padStart(2, '0')}_Semestre`));
  CARPETAS.forEach((c) => f.carpeta.add(new Option(c.replace(/_/g, ' '), c)));
}

function leerAjustes() {
  try { return JSON.parse(localStorage.getItem(CLAVE_AJUSTES)) || {}; } catch { return {}; }
}

function detectarIANavegador() {
  const { url, modelo } = leerAjustes();
  const candidatos = url ? [{ nombre: 'Personalizada', url: url.replace(/\/$/, ''), formato: 'auto' }] : IA.CANDIDATOS;
  return IA.detectar(candidatos, { modelo: modelo || undefined });
}

async function mostrarIA(redetectar = false) {
  $('ia').textContent = 'IA: buscando…';
  let ia = null;
  try {
    if (conServidor) ia = (await (await fetch(`api/estado${redetectar ? '?redetectar' : ''}`)).json()).ia;
    else ia = iaNavegador = await detectarIANavegador();
  } catch { /* servidor caído: se informa como "ninguna" */ }
  $('ia').textContent = ia ? `IA: ${ia.nombre} · ${ia.modelo}` : 'IA: ninguna local (tocar para buscar)';
}

async function detectarServidor() {
  try {
    conServidor = (await fetch('api/estado', { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    conServidor = false;
  }
  document.body.classList.toggle('con-servidor', conServidor);
  $('btnGuardar').textContent = conServidor ? 'Guardar' : 'Compartir (Drive…)';
  $('ajustes').hidden = conServidor; // con servidor la IA se configura con variables de entorno
}

function prepararAjustes() {
  const f = $('formIA').elements, a = leerAjustes();
  f.url.value = a.url || ''; f.modelo.value = a.modelo || '';
  $('formIA').onsubmit = (ev) => {
    ev.preventDefault();
    try { localStorage.setItem(CLAVE_AJUSTES, JSON.stringify({ url: f.url.value.trim(), modelo: f.modelo.value.trim() })); } catch { /* modo privado */ }
    mostrarIA(true);
  };
}

async function main() {
  llenarSelects();
  $('btnCamara').onclick = () => (flujo ? detenerCamara() : iniciarCamara().catch((e) => estado(`Cámara: ${e.message}`)));
  // Reutiliza las esquinas que la vista previa ya encontró: capturar es instantáneo
  $('btnCapturar').onclick = () => {
    const d = ultimasEsquinas;
    agregarPagina(cuadro($('video').videoWidth), d ? escalar(d.esquinas, d.escala) : undefined);
  };
  $('modoOCR').onchange = () => paginas.forEach((p) => { p.ocr = reconocer(p.canvas); p.ocr.catch(() => {}); });
  $('archivo').onchange = async (e) => { for (const a of e.target.files) await agregarPagina(await imagenACanvas(a)); e.target.value = ''; };
  $('btnProcesar').onclick = procesar;
  $('formDestino').onsubmit = guardar;
  $('btnDescargar').onclick = descargar;
  $('ia').onclick = () => mostrarIA(true);
  prepararAjustes();
  await detectarServidor();
  mostrarIA();

  await cargarLibs();
  await esperarOpenCV();
  escaner = new jscanify();
  obtenerWorker(); // precalienta Tesseract (carga del idioma) mientras se usa la cámara
  estado('Listo');
  if (!nativo() && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  await recibirCompartidas();
}

main();
