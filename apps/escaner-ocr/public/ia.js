// IA local compartida: la usan el escáner (server.js y navegador) y apps/mc-panel (asistente).
// formato "anthropic" = /v1/messages (fcc-server); "openai" = /v1/chat/completions (Ollama, LM Studio, llama.cpp, vLLM, Jan…)
(function (raiz) {
  const CARPETAS = [
    '01_Silabo_y_Planificacion', '02_Teoria_y_Diapositivas', '03_Bibliografia_y_Textos',
    '04_Practicas_y_Laboratorios', '05_Tareas_y_Proyectos', '06_Examenes_y_Evaluaciones',
    '07_Software_y_Scripts', '08_Recursos_y_Repositorios',
  ];
  const CANDIDATOS = [
    { nombre: 'fcc-server', url: 'http://127.0.0.1:8082', formato: 'anthropic' },
    { nombre: 'Ollama', url: 'http://127.0.0.1:11434', formato: 'openai' },
    { nombre: 'LM Studio', url: 'http://127.0.0.1:1234', formato: 'openai' },
    { nombre: 'llama.cpp', url: 'http://127.0.0.1:8081', formato: 'openai' },
    { nombre: 'Jan', url: 'http://127.0.0.1:1337', formato: 'openai' },
    { nombre: 'vLLM', url: 'http://127.0.0.1:8000', formato: 'openai' },
  ];

  // Un candidato sirve si responde /v1/models; para "openai" además debe tener algún modelo de chat cargado
  async function sondear(c, { clave = 'local', modelo } = {}) {
    try {
      const r = await fetch(`${c.url}/v1/models`, { headers: { authorization: `Bearer ${clave}` }, signal: AbortSignal.timeout(1500) });
      const modelos = r.ok ? ((await r.json()).data || []).map((m) => m.id).filter((id) => !/embed|rerank|whisper/i.test(id)) : [];
      const formato = !c.formato || c.formato === 'auto' ? (modelos.some((m) => /^claude/.test(m)) ? 'anthropic' : 'openai') : c.formato;
      const elegido = modelo || (formato === 'anthropic' ? 'claude-sonnet-5-5' : modelos[0]);
      if (!elegido || (formato === 'openai' && !r.ok)) return null;
      return { nombre: c.nombre, url: c.url, formato, modelo: elegido };
    } catch {
      return null; // no hay servidor ahí, o CORS lo bloquea
    }
  }

  async function detectar(candidatos = CANDIDATOS, opciones) {
    for (const c of candidatos) {
      const p = await sondear(c, opciones);
      if (p) return p;
    }
    return null;
  }

  async function preguntar(p, prompt, { clave = 'local', timeoutMs = 180_000 } = {}) {
    const comun = { method: 'POST', signal: AbortSignal.timeout(timeoutMs) };
    let r, texto;
    if (p.formato === 'anthropic') {
      r = await fetch(`${p.url}/v1/messages`, {
        ...comun,
        headers: { 'content-type': 'application/json', 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: p.modelo, max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
      });
      if (r.ok) texto = ((await r.json()).content || []).map((b) => b.text || '').join('');
    } else {
      r = await fetch(`${p.url}/v1/chat/completions`, {
        ...comun,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${clave}` },
        body: JSON.stringify({ model: p.modelo, temperature: 0.2, max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
      });
      if (r.ok) texto = (await r.json()).choices?.[0]?.message?.content || '';
    }
    if (!r.ok) throw new Error(`${p.nombre} respondió ${r.status}`);
    return texto.replace(/<think>[\s\S]*?<\/think>/g, ''); // modelos con razonamiento (qwen3, deepseek-r1)
  }

  const prompt = (texto, maxChars = 6000) => `Eres el clasificador de documentos de un estudiante de ingeniería (FIME, semestres S01–S10, actual S09).
Del texto OCR de un documento escaneado, responde SOLO un JSON, sin texto extra:
{"semestre":"S09_Semestre" o null,"curso":"Nombre del curso con tildes" o null,"carpeta":uno de ${JSON.stringify(CARPETAS)},"nombre":"Nombre_corto_sin_espacios","resumen":"2-3 frases","formulas":["..."]}
Si no estás seguro del curso, usa null (no adivines).

TEXTO:
${texto.slice(0, maxChars)}`;

  async function clasificar(p, texto, opciones = {}) {
    const salida = await preguntar(p, prompt(texto, opciones.maxChars), opciones);
    const json = salida.match(/\{[\s\S]*\}/);
    if (!json) throw new Error(`${p.nombre} no devolvió JSON`);
    return { ...JSON.parse(json[0]), ia: `${p.nombre} · ${p.modelo}` };
  }

  const IA = { CARPETAS, CANDIDATOS, sondear, detectar, preguntar, clasificar };
  if (typeof module !== 'undefined') module.exports = IA;
  else raiz.IA = IA;
})(this);
