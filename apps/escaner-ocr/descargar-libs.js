// Descarga las librerías y datos OCR a public/vendor/ para que la app funcione sin internet (una vez por dispositivo)
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const VENDOR = path.join(__dirname, 'public', 'vendor');
const CORE = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1';
const FAST = 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main';
const ARCHIVOS = {
  'opencv.js': 'https://docs.opencv.org/4.7.0/opencv.js',
  'jscanify.js': 'https://cdn.jsdelivr.net/npm/jscanify@1.4.2/src/jscanify.js',
  'jspdf.umd.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'tesseract/tesseract.min.js': 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
  'tesseract/worker.min.js': 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
  // Tesseract elige solo la variante (con o sin SIMD) según el navegador
  'tesseract/core/tesseract-core-lstm.wasm.js': `${CORE}/tesseract-core-lstm.wasm.js`,
  'tesseract/core/tesseract-core-simd-lstm.wasm.js': `${CORE}/tesseract-core-simd-lstm.wasm.js`,
  'tessdata/spa.traineddata.gz': 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/spa/4.0.0_best_int/spa.traineddata.gz',
  'tessdata/eng.traineddata.gz': 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
  // Modo "OCR rápido": tessdata_fast viene sin comprimir; se guarda en gzip como lo espera Tesseract
  'tessdata_fast/spa.traineddata.gz': `${FAST}/spa.traineddata`,
};

const faltantes = () => Object.keys(ARCHIVOS).filter((f) => !fs.existsSync(path.join(VENDOR, f)));

async function descargar() {
  for (const f of faltantes()) {
    process.stdout.write(`↓ ${f} … `);
    const r = await fetch(ARCHIVOS[f]);
    if (!r.ok) throw new Error(`${ARCHIVOS[f]} → ${r.status}`);
    const destino = path.join(VENDOR, f);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    let datos = Buffer.from(await r.arrayBuffer());
    if (f.endsWith('.gz') && !ARCHIVOS[f].endsWith('.gz')) datos = zlib.gzipSync(datos);
    fs.writeFileSync(`${destino}.tmp`, datos);
    fs.renameSync(`${destino}.tmp`, destino);
    console.log('ok');
  }
}

module.exports = { faltantes, descargar };
if (require.main === module) descargar().catch((e) => { console.error(e.message); process.exit(1); });
