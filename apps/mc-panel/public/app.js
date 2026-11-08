// Panel Minecraft: lista de servidores, consola en vivo (SSE), ajustes, Modrinth, respaldos, playit e IA
const $ = (id) => document.getElementById(id);
const ETIQUETAS = {
  motd: 'Mensaje (MOTD)', 'max-players': 'Máx. jugadores', difficulty: 'Dificultad', gamemode: 'Modo de juego', pvp: 'PvP',
  'online-mode': 'Modo online (cuentas premium)', 'white-list': 'Whitelist', 'view-distance': 'Distancia de visión',
  'simulation-distance': 'Distancia de simulación', 'spawn-protection': 'Protección del spawn', 'allow-flight': 'Permitir vuelo',
  'level-seed': 'Semilla', hardcore: 'Hardcore',
};
const OPCIONES = {
  difficulty: ['peaceful', 'easy', 'normal', 'hard'], gamemode: ['survival', 'creative', 'adventure', 'spectator'],
  pvp: ['true', 'false'], 'online-mode': ['true', 'false'], 'white-list': ['true', 'false'], 'allow-flight': ['true', 'false'], hardcore: ['true', 'false'],
};
const ESTADOS = { apagado: 'Apagado', iniciando: 'Iniciando…', encendido: 'Encendido', deteniendo: 'Deteniendo…', instalando: 'Instalando…', error: 'Error' };

let actual = null, fuente = null, info = {}, servidor = null, playitEstado = { instalado: false, encendido: false, direcciones: [] };
let tunelesCuenta = null; // túneles leídos de la API de playit (null = aún no se pudo leer)
let puedeCrear = false; // la clave del agente permite crear túneles (agente "self-managed")

// Token: llega una vez en la URL (?token=) cuando se abre desde otro equipo y queda guardado
const TOKEN = (() => {
  const t = new URLSearchParams(location.search).get('token');
  try {
    if (t) { localStorage.setItem('mc-token', t); history.replaceState(null, '', location.pathname); }
    return t || localStorage.getItem('mc-token') || '';
  } catch { return t || ''; }
})();

async function api(ruta, cuerpo) {
  const r = await fetch(`api/${ruta}`, {
    method: cuerpo === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', 'x-token': TOKEN },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || r.status);
  return d;
}

const avisar = (e) => alert(e.message || e);
const conToken = (ruta) => `api/${ruta}${TOKEN ? `?token=${TOKEN}` : ''}`;
const li = (...hijos) => { const l = document.createElement('li'); l.append(...hijos); return l; };
const boton = (texto, accion, clase) => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = texto; if (clase) b.className = clase;
  b.onclick = () => accion(b);
  return b;
};
// Deshabilita el botón mientras dura la acción (descargas, respaldos, IA)
const ocupado = async (b, fn) => { b.disabled = true; try { await fn(); } catch (e) { avisar(e); } finally { b.disabled = false; } };

// ---------- Info general ----------
async function cargarInfo(redetectar = false) {
  $('ia').textContent = 'IA: buscando…';
  info = await api(`info${redetectar ? '?redetectar' : ''}`);
  $('ram').textContent = `RAM libre ${info.ramLibreMB} / ${info.ramTotalMB} MB · Java ${info.java || '¿?'}`;
  $('ia').textContent = info.ia ? `IA: ${info.ia.nombre} · ${info.ia.modelo}` : 'IA: ninguna local';
  $('driveRuta').textContent = `(${info.drive})`;
}

// ---------- Lista ----------
async function cargarLista() {
  const lista = await api('servidores');
  $('lista').replaceChildren(...lista.map((s) => {
    const b = boton(`${s.nombre}`, () => abrir(s.id), s.id === actual ? 'activo' : '');
    const chip = document.createElement('span');
    chip.className = `chip ${s.estado}`; chip.textContent = ESTADOS[s.estado] || s.estado;
    b.append(chip);
    return li(b);
  }));
  if (!actual && lista[0]) abrir(lista[0].id);
}

// ---------- Detalle ----------
async function abrir(id) {
  actual = id;
  $('vacio').hidden = true;
  $('detalle').hidden = false;
  $('consola').textContent = '';
  fuente?.close();
  fuente = new EventSource(conToken(`servidores/${id}/consola`));
  fuente.addEventListener('linea', (e) => agregarLinea(JSON.parse(e.data)));
  fuente.addEventListener('estado', (e) => pintarEstado(JSON.parse(e.data)));
  await refrescar();
  cargarLista();
  cargarTuneles();
}

function agregarLinea(l) {
  const c = $('consola');
  const abajo = c.scrollTop + c.clientHeight >= c.scrollHeight - 30;
  const span = document.createElement('span');
  span.textContent = `${l}\n`;
  if (/ERROR|Exception|SEVERE/.test(l)) span.className = 'error';
  else if (/WARN/.test(l)) span.className = 'aviso';
  else if (l.startsWith('[panel]')) span.className = 'panel';
  c.append(span);
  while (c.childNodes.length > 800) c.firstChild.remove();
  if (abajo) c.scrollTop = c.scrollHeight;
}

function pintarEstado(s) {
  servidor = s;
  pintarAmigos();
  $('dNombre').textContent = s.nombre;
  const dirs = [`Java: puerto ${s.puerto}`, s.bedrock && `Bedrock: puerto ${s.puertoBedrock} (UDP)`].filter(Boolean).join(' · ');
  $('dInfo').textContent = `${s.plataforma} ${s.version} · ${s.ramMB} MB · ${dirs}${info.ips?.length ? ` · LAN ${info.ips[0]}` : ''}`;
  $('dEstado').textContent = ESTADOS[s.estado] || s.estado;
  $('dEstado').className = `chip ${s.estado}`;
  const prendido = ['encendido', 'iniciando', 'deteniendo'].includes(s.estado);
  $('btnEncender').textContent = prendido ? 'Detener' : 'Iniciar';
  $('btnEncender').disabled = ['instalando', 'deteniendo'].includes(s.estado);
  $('jugadores').replaceChildren(...(s.jugadores.length ? s.jugadores.map((j) => li(`🎮 ${j}`)) : [li('Nadie conectado')]));
  cargarLista();
}

async function refrescar() {
  const s = await api(`servidores/${actual}`);
  pintarEstado(s);
  pintarPropiedades(s.propiedades);
  $('formCfg').elements.ramMB.value = s.ramMB;
  const r = $('formRespaldo').elements;
  r.respaldoHoras.value = s.respaldoHoras; r.respaldosGuardar.value = s.respaldosGuardar; r.respaldoDrive.checked = s.respaldoDrive;
  pintarExtras(s.extras);
  pintarRespaldos(s.respaldos);
  const d = $('formDirecciones').elements;
  d.direccionJava.value = s.direccionJava || ''; d.direccionBedrock.value = s.direccionBedrock || ''; d.playitAuto.checked = s.playitAuto !== false;
  pintarAmigos();
  document.querySelector('[data-p="extras"]').textContent = s.plataforma === 'fabric' ? 'Mods' : 'Plugins';
}

function pintarPropiedades(p) {
  $('formPropiedades').replaceChildren(...Object.entries(ETIQUETAS).map(([k, etiqueta]) => {
    const l = document.createElement('label');
    let campo;
    if (OPCIONES[k]) {
      campo = document.createElement('select');
      OPCIONES[k].forEach((o) => campo.add(new Option(o, o)));
    } else {
      campo = document.createElement('input');
      if (/distance|players|protection/.test(k)) campo.type = 'number';
    }
    campo.name = k;
    campo.value = p[k] ?? '';
    l.append(etiqueta, campo);
    return l;
  }));
}

function pintarExtras({ activos, desactivados }) {
  $('instalados').replaceChildren(
    ...activos.map((f) => li(f, boton('Desactivar', (b) => ocupado(b, async () => pintarExtras(await api(`servidores/${actual}/mover-extra`, { archivo: f, activar: false })))))),
    ...desactivados.map((f) => li(`(desactivado) ${f}`, boton('Activar', (b) => ocupado(b, async () => pintarExtras(await api(`servidores/${actual}/mover-extra`, { archivo: f, activar: true })))))),
  );
  if (!activos.length && !desactivados.length) $('instalados').replaceChildren(li('Ninguno todavía'));
}

function pintarRespaldos(lista) {
  $('respaldos').replaceChildren(...(lista.length ? lista.map((r) => li(`${r.archivo} · ${r.mb} MB`, boton('Restaurar', (b) => {
    if (!confirm(`¿Restaurar ${r.archivo}? El mundo actual no se borra: queda renombrado como *.antes-…`)) return;
    ocupado(b, async () => { await api(`servidores/${actual}/restaurar`, { archivo: r.archivo }); alert('Restaurado'); });
  }))) : [li('Sin respaldos')]));
}

// ---------- Modrinth ----------
async function buscar(ev) {
  ev.preventDefault();
  const s = await api(`servidores/${actual}`);
  const q = new URLSearchParams({ q: ev.target.elements.q.value, plataforma: s.plataforma, version: s.version });
  const hits = await api(`modrinth?${q}`);
  $('resultados').replaceChildren(...(hits.length ? hits.map((h) => {
    const img = new Image(32, 32);
    img.src = h.icono || 'icono.svg'; img.alt = '';
    const texto = document.createElement('div');
    texto.innerHTML = '<strong></strong><br><small></small>';
    texto.querySelector('strong').textContent = h.titulo;
    texto.querySelector('small').textContent = `${h.descripcion} · ${h.descargas.toLocaleString()} descargas`;
    return li(img, texto, boton('Instalar', (b) => ocupado(b, async () => {
      pintarExtras(await api(`servidores/${actual}/instalar-extra`, { proyecto: h.id }));
      b.textContent = 'Instalado ✓';
    })));
  }) : [li(`Nada compatible con ${s.plataforma} ${s.version}`)]));
}

// ---------- IA ----------
async function preguntar(pregunta, b) {
  const caja = document.createElement('div');
  caja.className = 'respuesta';
  caja.innerHTML = '<strong></strong><p>Pensando… (un modelo local puede tardar)</p><small></small>';
  caja.querySelector('strong').textContent = pregunta;
  $('respuestas').prepend(caja);
  await ocupado(b, async () => {
    try {
      const r = await api(`servidores/${actual}/ia`, { pregunta });
      caja.querySelector('p').textContent = r.respuesta;
      caja.querySelector('small').textContent = r.ia;
    } catch (e) {
      caja.querySelector('p').textContent = `Error: ${e.message}`;
    }
  });
}

// ---------- playit ----------
function conectarPlayit() {
  const f = new EventSource(conToken('playit/consola'));
  f.addEventListener('linea', (e) => {
    const p = $('playitLog');
    p.textContent += `${JSON.parse(e.data)}\n`;
    p.scrollTop = p.scrollHeight;
  });
  f.addEventListener('estado', (e) => {
    const s = JSON.parse(e.data);
    const recienEncendido = s.encendido && !playitEstado.encendido;
    const recienAprobado = playitEstado.enlace && !s.enlace; // volvió de aprobar: el panel crea los túneles solo
    playitEstado = s;
    pintarAmigos();
    if (recienEncendido) setTimeout(cargarTuneles, 4000);
    if (recienAprobado) [8000, 15000, 30000].forEach((ms) => setTimeout(() => cargarTuneles().then(refrescar), ms));
    $('btnPlayitInstalar').hidden = s.instalado;
    $('btnPlayit').hidden = !s.instalado;
    $('btnPlayit').textContent = s.encendido ? 'Detener túnel' : 'Iniciar túnel';
    const partes = [];
    if (!s.instalado) partes.push('Agente no instalado.');
    else partes.push(s.encendido ? '🟢 Túnel activo.' : '⚪ Túnel apagado.');
    const est = $('playitEstado');
    est.replaceChildren(partes.join(' '));
    if (s.enlace) {
      const a = document.createElement('a');
      a.href = s.enlace; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Vincular con tu cuenta de playit (solo la primera vez)';
      est.append(document.createElement('br'), a);
    }
    for (const d of s.direcciones) {
      const c = document.createElement('code');
      c.textContent = d.publica;
      est.append(document.createElement('br'), 'Dirección para amigos: ', c, ` → ${d.local}`);
    }
    if (s.encendido && !s.direcciones.length) est.append(document.createElement('br'), 'Crea los túneles en playit.gg: "Minecraft Java" (TCP 25565) y "Minecraft Bedrock" (UDP 19132).');
  });
}

// ---------- Amigos (playit.gg) ----------

function paso(hecho, texto, detalle, ...acciones) {
  const l = li();
  l.className = hecho ? 'hecho' : '';
  const t = document.createElement('span');
  t.textContent = texto;
  if (detalle) { const s = document.createElement('small'); s.append(...[detalle].flat()); t.append(s); }
  l.append(t, ...(hecho ? [] : acciones));
  return l;
}

const enlace = (href, texto) => {
  const a = document.createElement('a');
  a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = texto;
  return a;
};

function pintarAmigos() {
  if (!servidor) return;
  const s = servidor, p = playitEstado;
  const tieneDireccion = !!(s.direccionJava || s.direccionBedrock);
  // Primero los túneles del agente de este equipo; los de agentes viejos solo si no hay otros
  const todos = (tunelesCuenta || []).filter((t) => [s.puerto, s.puertoBedrock].includes(t.localPuerto));
  const delServidor = todos.some((t) => t.propio) ? todos.filter((t) => t.propio) : todos;
  const encendido = s.estado === 'encendido';
  const tuneles = [`Minecraft Java → local 127.0.0.1:${s.puerto}`, s.bedrock && `Minecraft Bedrock (UDP) → local 127.0.0.1:${s.puertoBedrock}`].filter(Boolean);
  $('pasos').replaceChildren(
    paso(p.instalado, 'Instalar el agente de playit.gg', 'Programa gratis que crea el túnel (unos 10 MB).',
      boton('Instalar', (b) => ocupado(b, () => api('playit/instalar', {})), 'primario')),
    paso(p.encendido, 'Iniciar el túnel', s.playitAuto !== false ? 'Después arranca solo con el servidor.' : '',
      boton('Iniciar túnel', (b) => ocupado(b, () => api('playit/iniciar', {})), 'primario')),
    paso(!p.enlace && (puedeCrear || tieneDireccion), 'Aprobar el agente en tu cuenta de playit (un toque, una sola vez)',
      p.enlace ? 'Toca Aprobar, luego "Approve" en playit y vuelve: lo demás se hace solo.'
        : 'Permite que esta app cree los túneles por ti.',
      ...(p.enlace ? [enlace(p.enlace, 'Aprobar ↗')]
        : [boton('Vincular', (b) => ocupado(b, () => api('playit/vincular', {})), 'primario')])),
    paso(delServidor.some((t) => t.propio) && (!s.bedrock || delServidor.some((t) => t.protocolo === 'udp')),
      'Crear los túneles (solo la primera vez)', `Se crean en tu cuenta de playit: ${tuneles.join(' · ')}.`,
      ...(puedeCrear ? [boton('Crear túneles', (b) => ocupado(b, crearTuneles), 'primario')] : [])),
    paso(encendido, 'Encender el servidor', '',
      boton('Iniciar servidor', (b) => ocupado(b, () => api(`servidores/${actual}/iniciar`, {})), 'primario')),
    paso(tieneDireccion && encendido && p.encendido, '¡Listo! Comparte la invitación', 'Tus amigos solo necesitan Minecraft.'),
  );
  // Autocompletar: primero los túneles de la cuenta que apuntan a los puertos de este servidor; si no, la salida del agente
  const d = $('formDirecciones').elements;
  const java = delServidor.find((t) => t.tipo === 'minecraft-java' && t.localPuerto === s.puerto)
    || p.direcciones.find((x) => /joinmc\.link/.test(x.publica));
  const bedrock = delServidor.find((t) => t.protocolo === 'udp' && t.localPuerto === s.puertoBedrock)
    || p.direcciones.find((x) => /ply\.gg:\d+/.test(x.publica) && x !== java);
  // Un túnel propio manda sobre lo guardado (al revincular cambia la dirección); los demás solo rellenan si está vacío
  if (java?.publica && (java.propio || !d.direccionJava.value)) d.direccionJava.value = java.publica;
  if (s.bedrock && bedrock?.publica && (bedrock.propio || !d.direccionBedrock.value)) d.direccionBedrock.value = bedrock.publica;
  $('invitacion').textContent = invitacion();
  const cambio = (d.direccionJava.value || '') !== (s.direccionJava || '') || (d.direccionBedrock.value || '') !== (s.direccionBedrock || '');
  if (cambio && (java || bedrock)) guardarDirecciones().catch(() => {}); // queda guardado sin tocar "Guardar"
}

async function crearTuneles() {
  tunelesCuenta = await api(`servidores/${actual}/tuneles`, {});
  puedeCrear = true;
  pintarAmigos();
  // playit tarda unos segundos en asignar la dirección a un túnel nuevo
  if (tunelesCuenta.some((t) => t.propio && !t.publica)) setTimeout(cargarTuneles, 5000);
}

async function cargarTuneles() {
  try {
    ({ tuneles: tunelesCuenta, puedeCrear } = await api('playit/tuneles'));
  } catch {
    tunelesCuenta = null; // agente sin vincular o sin internet: queda el modo manual
  }
  pintarAmigos();
}

function invitacion() {
  const s = servidor, d = $('formDirecciones').elements;
  const java = d.direccionJava.value.trim(), bedrock = d.direccionBedrock.value.trim();
  if (!java && !bedrock) return '';
  const lineas = [`¡Únete a mi servidor de Minecraft "${s.nombre}"! 🎮`];
  if (java) lineas.push(`💻 PC (Java ${s.version}): Multijugador → Agregar servidor → ${java}`);
  if (bedrock) {
    const [host, puerto = '19132'] = bedrock.split(':');
    lineas.push(`📱 Celular/Windows (Bedrock): Servidores → Agregar servidor → Dirección: ${host} · Puerto: ${puerto}`);
  }
  return lineas.join('\n');
}

async function guardarDirecciones() {
  const d = $('formDirecciones').elements;
  pintarEstado(await api(`servidores/${actual}/config`, {
    direccionJava: d.direccionJava.value, direccionBedrock: d.direccionBedrock.value, playitAuto: d.playitAuto.checked,
  }));
}

async function compartirInvitacion() {
  await guardarDirecciones();
  const texto = invitacion();
  if (!texto) throw new Error('Primero escribe la dirección Java o Bedrock');
  if (navigator.share) {
    try { await navigator.share({ text: texto }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
}

// El portapapeles exige HTTPS/localhost: desde la red local (http) se selecciona el texto para copiarlo a mano
async function copiarInvitacion() {
  try {
    await navigator.clipboard.writeText(invitacion());
    alert('Invitación copiada');
  } catch {
    getSelection().selectAllChildren($('invitacion'));
    alert('Texto seleccionado: mantén presionado para copiarlo');
  }
}

// ---------- Nuevo servidor ----------
async function cargarVersiones() {
  const f = $('formNuevo').elements;
  f.version.replaceChildren(new Option('Cargando…', ''));
  try {
    const vs = await api(`versiones?plataforma=${f.plataforma.value}`);
    f.version.replaceChildren(...vs.slice(0, 40).map((v) => new Option(v, v)));
  } catch (e) {
    f.version.replaceChildren(new Option(`Error: ${e.message}`, ''));
  }
}

async function nuevo() {
  const f = $('formNuevo').elements;
  f.ramMB.value = info.ramSugeridaMB;
  $('ramAyuda').textContent = `Sugerido según la RAM libre (${info.ramLibreMB} MB). Para 2–5 jugadores: 1536–2048 MB.`;
  cargarVersiones();
  $('dlgNuevo').showModal();
}

async function crear(ev) {
  if (ev.submitter?.value !== 'crear') return;
  const f = new FormData(ev.target);
  try {
    const s = await api('servidores', {
      nombre: f.get('nombre'), plataforma: f.get('plataforma'), version: f.get('version'),
      ramMB: Number(f.get('ramMB')), bedrock: f.get('bedrock') === 'on', eula: f.get('eula') === 'on',
    });
    ev.target.reset();
    await abrir(s.id);
  } catch (e) {
    avisar(e);
  }
}

// ---------- Arranque ----------
function main() {
  document.querySelectorAll('#pestanas button').forEach((b) => (b.onclick = () => {
    document.querySelectorAll('#pestanas button').forEach((x) => x.classList.toggle('activa', x === b));
    document.querySelectorAll('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.p));
  }));
  $('ia').onclick = () => cargarInfo(true).catch(avisar);
  $('btnApagar').onclick = async () => {
    if (!confirm('¿Apagar el panel? Se detienen los servidores guardando los mundos y el túnel.')) return;
    await api('apagar', {}).catch(() => {});
    document.body.innerHTML = '<main><section><h2>Panel apagado</h2><p class="ayuda">Los mundos se guardaron. Puedes cerrar esta ventana.</p></section></main>';
  };
  $('btnNuevo').onclick = nuevo;
  $('formNuevo').onsubmit = crear;
  $('formNuevo').elements.plataforma.onchange = cargarVersiones;
  $('btnEncender').onclick = (ev) => ocupado(ev.target, async () => {
    const prendido = $('btnEncender').textContent === 'Detener';
    await api(`servidores/${actual}/${prendido ? 'detener' : 'iniciar'}`, {});
  });
  $('formComando').onsubmit = (ev) => {
    ev.preventDefault();
    const c = ev.target.elements.comando;
    if (c.value.trim()) api(`servidores/${actual}/comando`, { comando: c.value }).catch(avisar);
    c.value = '';
  };
  $('formJugador').onsubmit = (ev) => {
    ev.preventDefault();
    const nombre = ev.target.elements.jugador.value.trim();
    if (nombre) api(`servidores/${actual}/comando`, { comando: `${ev.submitter.dataset.cmd} ${nombre}` }).catch(avisar);
  };
  $('btnGuardarAjustes').onclick = (ev) => ocupado(ev.target, async () => {
    await api(`servidores/${actual}/propiedades`, Object.fromEntries(new FormData($('formPropiedades'))));
    await api(`servidores/${actual}/config`, { ramMB: $('formCfg').elements.ramMB.value });
    alert('Guardado. Reinicia el servidor para aplicar.');
  });
  $('btnGuardarRespaldo').onclick = (ev) => ocupado(ev.target, async () => {
    const r = $('formRespaldo').elements;
    await api(`servidores/${actual}/config`, { respaldoHoras: r.respaldoHoras.value, respaldosGuardar: r.respaldosGuardar.value, respaldoDrive: r.respaldoDrive.checked });
  });
  $('btnRespaldar').onclick = (ev) => ocupado(ev.target, async () => pintarRespaldos((await api(`servidores/${actual}/respaldar`, {})).respaldos));
  $('formBuscar').onsubmit = (ev) => buscar(ev).catch(avisar);
  $('formIA').onsubmit = (ev) => {
    ev.preventDefault();
    const p = ev.target.elements.pregunta;
    if (p.value.trim()) preguntar(p.value.trim(), ev.submitter);
    p.value = '';
  };
  document.querySelectorAll('#sugerencias button').forEach((b) => (b.onclick = () => preguntar(b.textContent, b)));
  $('btnGuardarDirecciones').onclick = (ev) => ocupado(ev.target, guardarDirecciones);
  $('btnCompartir').onclick = (ev) => ocupado(ev.target, compartirInvitacion);
  $('btnCopiarInv').onclick = copiarInvitacion;
  $('formDirecciones').oninput = () => ($('invitacion').textContent = invitacion());
  $('btnPlayitInstalar').onclick = (ev) => ocupado(ev.target, () => api('playit/instalar', {}));
  $('btnPlayit').onclick = (ev) => ocupado(ev.target, () => api(`playit/${$('btnPlayit').textContent.startsWith('Detener') ? 'detener' : 'iniciar'}`, {}));

  cargarInfo().catch(avisar);
  cargarLista().catch(avisar);
  conectarPlayit();
}

main();
