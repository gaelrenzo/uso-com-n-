# Escáner OCR

PWA para escanear documentos con la tablet, hacer OCR en español, generar un PDF buscable,
clasificarlo con **cualquier IA local** (fcc-server, Ollama, LM Studio, llama.cpp, Jan, vLLM) y subirlo a Drive por curso (`ENZO1:01_Universidad_FIME/Sxx/<Curso>/<carpeta>`).

Base open source: [jscanify](https://github.com/ColonelParrot/jscanify) (MIT) · [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0) · [jsPDF](https://github.com/parallax/jsPDF) (MIT) · OpenCV.js (Apache-2.0).

## Como app en el celular (sin Termux)
1. En Chrome abrir **https://gaelrenzo.github.io/uso-com-n-/escaner/**
2. Menú ⋮ → **Instalar app** (queda con ícono propio, pantalla completa).
3. Escanear → OCR → **Compartir (Drive…)** → elegir Drive y la carpeta sugerida.

Sin servidor, las librerías vienen del CDN (la primera vez con internet; luego quedan en caché) y la IA
se llama directo desde el navegador a `localhost`. Para eso la IA debe permitir CORS:
`OLLAMA_ORIGINS="*" ollama serve` (Ollama) o "Enable CORS" (LM Studio). URL y modelo en **Ajustes de IA**.

## Uso con servidor (Termux: IA + subida automática con rclone)
```bash
node server.js            # http://localhost:8090  (sin dependencias npm)
```
La primera vez descarga ~22 MB de librerías y datos OCR (spa+eng) a `public/vendor/` (fuera de git);
después funciona **sin internet**. Para descargarlas a mano: `node descargar-libs.js`.
Abrir en el navegador de la tablet → menú → "Instalar app". La cámara exige `localhost` o HTTPS.
Con `live-server` funciona escanear/OCR/descargar, pero no la IA ni la subida (necesitan `server.js`).

## Variables
| Variable | Por defecto |
|---|---|
| `PORT` | `8090` |
| `ESCANER_SALIDA` | `$UCN_DATA_DIR/escaneos` |
| `DRIVE_CURSOS_REMOTO` | `ENZO1:01_Universidad_FIME` |
| `IA_URL` | autodetecta (ver abajo) |
| `IA_FORMATO` | `auto` · `anthropic` (/v1/messages) · `openai` (/v1/chat/completions) |
| `IA_MODELO` | el primero que liste el servidor (`claude-sonnet-5-5` en fcc-server) |
| `IA_API_KEY` / `IA_TIMEOUT_MS` / `IA_MAX_CHARS` | `local` / `180000` / `6000` |

## IA local
Sin `IA_URL` se prueba en orden y se usa el primero que responda:
fcc-server `:8082` → Ollama `:11434` → LM Studio `:1234` → llama.cpp `:8081` → Jan `:1337` → vLLM `:8000`.
Se ignoran modelos de embeddings y se limpian los bloques `<think>` de modelos con razonamiento.
Tocar "IA: …" en la cabecera vuelve a detectar. Sin IA la app funciona igual (destino a mano).

Ejemplo con Ollama en la tablet: `ollama serve &` y `ollama pull qwen3:4b` (~2.5 GB; con 7 GB de RAM,
modelos de 1–4B van bien). `llama-server` de llama.cpp: usar `--port 8081` (8080 es live-server).

## Reglas
- Sube con `rclone copyto --ignore-existing`: nunca sobrescribe ni borra.
- Sin curso claro → `98_Por_Clasificar/Desde_escaner_AAAA-MM/`.

## Esquinas
Con "Revisar esquinas" activo, cada captura abre un editor con las 4 esquinas detectadas para arrastrarlas.
Tocar una miniatura vuelve a abrirlo.

## Pendiente
- Fork Android nativo (MakeACopy, Apache-2.0) compilado con GitHub Actions.
