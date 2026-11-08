// Escáner OCR: cámara → jscanify (bordes + perspectiva, esquinas ajustables) → filtro OpenCV → Tesseract (spa+eng) → PDF buscable → IA local → Drive
const $ = (id) => document.getElementById(id);
const A4 = { w: 1240, h: 1754 }; // 150 dpi
const MAX_LADO = 2000; // reduce fotos grandes de galería para no agotar la RAM
const ORDEN = ['topLeftCorner', 'topRightCorner', 'bottomRightCorner', 'bottomLeftCorner'];
const CARPETAS = [
  '01_Silabo_y_Planificacion', '02_Teoria_y_Diapositivas', '03_Bibliografia_y_Textos',
  '04_Practicas_y_Laboratorios', '05_Tareas_y_Proyectos', '06_Examenes_y_Evaluaciones',
  '07_Software_y_Scripts', '08_Recursos_y_Repositorios',
];

let escaner, worker, flujo, pdfActual;
const paginas = []; // { original, esquinas, filtro, canvas, ocr }

const estado = (t) => ($('estado').textContent = t);

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

function cuadro(ancho) {
  const v = $('video');
  const c = document.createElement('canvas');
  c.width = ancho; c.height = Math.round((v.videoHeight / v.videoWidth) * ancho);
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  return c;
}

// Resalta la hoja a baja resolución (~5 fps) para no ahogar la tablet
function vistaPrevia() {
  if (!flujo) return;
  try {
    const resaltado = escaner.highlightPaper(cuadro(640), { color: '#1f6feb', thickness: 6 });
    const o = $('overlay');
    o.width = resaltado.width; o.height = resaltado.height;
    o.getContext('2d').drawImage(resaltado, 0, 0);
  } catch { /* cuadro sin hoja detectable */ }
  setTimeout(vistaPrevia, 200);
}

// ---------- Esquinas ----------
const esquinasCompletas = (c) => ({
  topLeftCorner: { x: 0, y: 0 }, topRightCorner: { x: c.width, y: 0 },
  bottomRightCorner: { x: c.width, y: c.height }, bottomLeftCorner: { x: 0, y: c.height },
});

function detectarEsquinas(c) {
  const m = cv.imread(c);
  try {
    const contorno = escaner.findPaperContour(m);
    const e = contorno && escaner.getCornerPoints(contorno);
    if (e && ORDEN.every((k) => e[k])) return e;
  } catch { /* sin contorno */ } finally {
    m.delete();
  }
  return esquinasCompletas(c);
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
    lz.onpointermove = (ev) => { if (arrastrando) { e[arrastrando] = punto(ev); pintar(); } };
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
  p.ocr = null;
}

async function agregarPagina(original) {
  let esquinas = detectarEsquinas(original);
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
    img.src = p.canvas.toDataURL('image/jpeg', 0.5);
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
async function ocr() {
  worker ??= await Tesseract.createWorker('spa+eng', 1, {
    workerPath: 'vendor/tesseract/worker.min.js',
    corePath: 'vendor/tesseract/core',
    langPath: 'vendor/tessdata',
    logger: (m) => m.status === 'recognizing text' && ($('progreso').value = m.progress),
  });
  for (const [i, p] of paginas.entries()) {
    if (p.ocr) continue;
    estado(`OCR página ${i + 1}/${paginas.length}…`);
    p.ocr = (await worker.recognize(p.canvas)).data;
  }
}

// PDF A4 con la imagen y el texto OCR invisible encima (buscable/copiable)
function armarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  paginas.forEach((p, i) => {
    if (i) doc.addPage();
    doc.addImage(p.canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, 210, 297);
    const k = 210 / p.canvas.width;
    for (const linea of p.ocr?.lines || []) {
      const { x0, y0, y1 } = linea.bbox;
      doc.setFontSize(Math.max(4, (y1 - y0) * k * 2.83));
      doc.text(linea.text.trim(), x0 * k, y1 * k, { renderingMode: 'invisible', baseline: 'bottom' });
    }
  });
  return doc.output('blob');
}

async function clasificarConIA(texto) {
  try {
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
    await ocr();
    const texto = paginas.map((p) => p.ocr.text).join('\n\n---\n\n');
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
    pdfActual = armarPDF();
    $('resultado').hidden = false;
    if (ia.nombre) estado('Listo: revisa el destino y guarda');
  } catch (e) {
    estado(`Error: ${e.message}`);
  } finally {
    $('progreso').hidden = true;
    $('btnProcesar').disabled = false;
  }
}

async function guardar(ev) {
  ev.preventDefault();
  const f = new FormData(ev.target);
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

function descargar() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(pdfActual);
  a.download = `${$('formDestino').elements.nombre.value || 'escaneo'}.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Arranque ----------
function llenarSelects() {
  const f = $('formDestino').elements;
  for (let s = 1; s <= 10; s++) f.semestre.add(new Option(`S${String(s).padStart(2, '0')}`, `S${String(s).padStart(2, '0')}_Semestre`));
  CARPETAS.forEach((c) => f.carpeta.add(new Option(c.replace(/_/g, ' '), c)));
}

async function mostrarIA(redetectar = false) {
  try {
    const { ia } = await (await fetch(`api/estado${redetectar ? '?redetectar' : ''}`)).json();
    $('ia').textContent = ia ? `IA: ${ia.nombre} · ${ia.modelo}` : 'IA: ninguna local (tocar para buscar)';
  } catch {
    $('ia').textContent = 'IA: sin servidor (usa node server.js)';
  }
}

async function main() {
  llenarSelects();
  $('btnCamara').onclick = () => (flujo ? detenerCamara() : iniciarCamara().catch((e) => estado(`Cámara: ${e.message}`)));
  $('btnCapturar').onclick = () => agregarPagina(cuadro($('video').videoWidth));
  $('archivo').onchange = async (e) => { for (const a of e.target.files) await agregarPagina(await imagenACanvas(a)); e.target.value = ''; };
  $('btnProcesar').onclick = procesar;
  $('formDestino').onsubmit = guardar;
  $('btnDescargar').onclick = descargar;
  $('ia').onclick = () => mostrarIA(true);
  mostrarIA();

  await esperarOpenCV();
  escaner = new jscanify();
  estado('Listo');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

main();
