# Flujo de productividad academica y tecnica

Sistema operativo personal para estudiar, programar, investigar y producir entregas usando laptop, tablet, celular, Google Drive, GitHub, VS Code, terminal, Termux y agentes IA.

## Principio central

```text
Laptop = crear y producir
Tablet = leer, comprender y anotar
Celular = capturar, revisar y consultar rapido

Google Drive = PDFs, documentos, datasets, recursos y entregas
GitHub = codigo, scripts, notebooks, documentacion tecnica y control de versiones
IA = planificacion, explicacion, correccion, sintesis y apoyo estrategico
```

Regla maestra: cada archivo debe tener una casa unica. Si es codigo o texto tecnico versionable, vive en GitHub. Si es PDF, dataset, recurso pesado, documento final o entrega formal, vive en Drive.

## 1. Funcion de cada dispositivo

### Laptop: produccion principal

Uso principal:

- Programar en VS Code.
- Escribir entregas tecnicas, informes, papers, documentacion y README.
- Ejecutar terminal, Git, scripts, notebooks y agentes IA.
- Organizar repositorios GitHub.
- Convertir notas e investigacion en productos finales.

Debe tener:

- VS Code con extensiones para Markdown, Python, GitHub, Jupyter y Git.
- Git configurado con nombre, correo y autenticacion.
- Terminal PowerShell con el perfil de este repo `uso-com-n-`.
- Carpeta de workspace separada de Google Drive para repositorios clonados.
- Acceso sincronizado a Drive para recursos, datasets y entregas.

Uso ideal:

```text
Idea o fuente -> repo/notas -> codigo o informe -> revision IA -> commit -> entrega final en Drive
```

### Tablet: lectura, comprension y anotaciones

Uso principal:

- Leer papers, libros, PDFs, guias y rubricas.
- Subrayar y anotar documentos.
- Hacer mapas conceptuales.
- Tomar notas manuscritas o visuales.
- Revisar entregas en modo lectura.

Debe tener:

- Google Drive con PDFs disponibles sin conexion para cursos activos.
- Lector PDF con subrayado, comentarios y exportacion.
- App de notas manuscritas o mixtas.
- App de mapas conceptuales o pizarra.
- Navegador con acceso a GitHub y documentos.

Uso ideal:

```text
PDF en Drive -> lectura activa -> anotaciones exportadas -> resumen en notas -> conceptos clave al repo o documento
```

### Celular: captura, revision e IA movil

Uso principal:

- Capturar ideas, fotos, audios, enlaces y pendientes.
- Consultar IA rapidamente.
- Revisar GitHub, issues, commits y README.
- Usar Termux en emergencias.
- Hacer micro-repasos durante tiempos muertos.

Debe tener:

- Google Drive.
- GitHub.
- App de notas rapidas.
- Lector PDF liviano.
- Chat/IA movil.
- Termux con Git, SSH, Node/Python si lo necesitas.

Uso ideal:

```text
Captura rapida -> bandeja de entrada en Drive/notas -> revision diaria -> mover a repo, tarea o documento final
```

## 2. Organizacion recomendada de Google Drive

Drive debe guardar materiales y resultados, no el historial fino de codigo.

Estructura sugerida:

```text
Mi unidad/
  00_INBOX/
    capturas-celular/
    enlaces-pendientes/
    audios/
    fotos/
  01_ACADEMIA/
    2026/
      curso-nombre/
        00_rubrica_y_silabo/
        01_pdfs/
        02_notas_tablet/
        03_datasets/
        04_recursos/
        05_borradores/
        06_entregas_finales/
        99_archivo/
  02_PROYECTOS_TECNICOS/
    proyecto-nombre/
      00_brief/
      01_referencias/
      02_pdfs/
      03_datasets/
      04_media/
      05_entregables/
      99_archivo/
  03_PLANTILLAS/
    informes/
    presentaciones/
    checklists/
    prompts/
  04_RECURSOS/
    libros/
    papers_generales/
    datasets_generales/
    software/
  05_ENTREGAS/
    por_fecha/
    por_curso/
  99_ARCHIVO/
```

Reglas:

- `00_INBOX` es temporal. Debe vaciarse cada dia.
- Los PDFs originales van en `01_pdfs`.
- Las anotaciones exportadas de tablet van en `02_notas_tablet`.
- Los datasets pesados van en Drive, no en GitHub.
- Las entregas finales van en `06_entregas_finales` y tambien pueden tener copia en `05_ENTREGAS`.
- No guardes repositorios Git dentro de Drive sincronizado si Drive puede modificar archivos internos de `.git`.

## 3. Organizacion recomendada de GitHub

GitHub debe guardar todo lo que necesita versionado:

- Codigo fuente.
- Scripts.
- Notebooks.
- Documentacion tecnica.
- README.
- Configuraciones reproducibles.
- Tareas del proyecto.
- Prompts tecnicos reutilizables.
- Resultados ligeros.

Estructura de repositorios:

```text
github.com/usuario/
  uso-com-n-                    # entorno personal y skills
  curso-nombre-labs             # practicas y ejercicios de un curso
  curso-nombre-proyecto-final   # proyecto grande de curso
  tesis-o-investigacion         # investigacion larga
  scripts-academicos            # utilidades pequeñas reutilizables
  notebooks-data                # notebooks versionables sin datasets pesados
```

Estructura interna recomendada para un repo academico/tecnico:

```text
repo-nombre/
  README.md
  .gitignore
  docs/
    arquitectura.md
    metodologia.md
    bitacora.md
  notebooks/
    01_exploracion.ipynb
    02_modelo.ipynb
  src/
    paquete_o_modulo/
  scripts/
    preparar_datos.py
    generar_reporte.py
  tests/
  data/
    README.md
    sample/
  reports/
    borradores/
    figuras/
  prompts/
    lectura-paper.md
    revision-codigo.md
  references/
    README.md
```

Regla para datos:

- `data/sample/` puede ir a Git si es pequeno.
- Datasets completos viven en Drive.
- En Git deja `data/README.md` con el enlace o ruta al dataset en Drive.

## 4. Como conectar laptop, tablet y celular

### Conexion por Drive

Usa Drive como puente de materiales:

```text
Celular captura -> Drive/00_INBOX
Tablet lee/anota -> Drive/curso/02_notas_tablet
Laptop produce -> Drive/curso/06_entregas_finales
```

### Conexion por GitHub

Usa GitHub como puente de codigo:

```text
Laptop desarrolla -> commit -> push
Celular revisa GitHub -> issue/comentario
Termux emergencia -> pull -> editar minimo -> commit -> push
Laptop retoma -> pull
```

### Conexion por IA

Usa IA como puente cognitivo:

```text
Tablet: "resume mis anotaciones"
Celular: "captura y convierte en tareas"
Laptop: "transforma esto en codigo, informe o plan"
```

## 5. Uso de Drive por tipo de material

PDFs:

- Guarda el original en `01_pdfs`.
- Nombra asi: `AAAA-MM-DD_autor_tema.pdf`.
- Si lo anotas, exporta una copia a `02_notas_tablet`.

Datasets:

- Guarda completos en `03_datasets`.
- Crea un `README_dataset.md` con fuente, fecha, licencia, variables y uso.
- En GitHub solo guarda muestras pequenas o scripts de descarga.

Notas:

- Notas rapidas entran a `00_INBOX`.
- Notas de lectura van a `02_notas_tablet`.
- Notas ya depuradas pasan a `docs/bitacora.md` o `docs/metodologia.md` del repo.

Recursos:

- Plantillas, rubricas, imagenes, audios, capturas y enlaces van a `04_recursos`.

Entregas:

- Borradores en `05_borradores`.
- Finales en `06_entregas_finales`.
- Nombre recomendado:

```text
AAAA-MM-DD_curso_tarea_v01_borrador.docx
AAAA-MM-DD_curso_tarea_v02_revision.pdf
AAAA-MM-DD_curso_tarea_FINAL.pdf
```

## 6. Uso de GitHub por tipo de trabajo

Codigo:

- Va en `src/`, `scripts/` o `notebooks/`.
- Cada cambio relevante debe tener commit.

Scripts:

- Scripts reutilizables van en `scripts/`.
- Agrega encabezado corto con proposito, entradas y salida.

Notebooks:

- Usa nombres numerados: `01_exploracion.ipynb`, `02_limpieza.ipynb`.
- Evita guardar salidas gigantes.
- Si el notebook depende de datos en Drive, documenta la ruta.

Documentacion:

- `README.md`: como instalar, ejecutar y entender el proyecto.
- `docs/bitacora.md`: decisiones y progreso.
- `docs/metodologia.md`: metodo, supuestos y fuentes.
- `docs/entrega.md`: estructura del informe final.

Control de versiones:

- Un commit debe representar una unidad de avance entendible.
- No mezcles codigo, datasets y entrega final en el mismo commit si no es necesario.

## 7. VS Code y terminal en laptop

Flujo recomendado:

```powershell
cd "J:\Mi unidad\02_Software_y_Herramientas\uso-com-n-"
git status
code .
```

Para un proyecto nuevo:

```powershell
mkdir proyecto-nombre
cd proyecto-nombre
git init
code .
```

En VS Code:

- Abre un repo por ventana.
- Usa el panel Source Control para revisar diffs antes de commitear.
- Usa terminal integrada para instalar, probar y ejecutar.
- Escribe documentacion en Markdown dentro de `docs/`.
- Usa agentes IA desde terminal o extension cuando el trabajo requiera plan, codigo, pruebas o revision.

Comandos utiles del entorno `uso-com-n-`:

```powershell
html-status
html-push "actualiza guia de productividad"
skills-sync
ucn doctor
ucn sync
ucn push "actualiza documentacion"
```

## 8. Tablet para lectura, mapas y notas

Flujo de lectura activa:

1. Abre el PDF desde Drive.
2. Lee primero titulo, resumen, conclusiones y figuras.
3. Marca en tres colores:
   - Amarillo: ideas clave.
   - Azul: definiciones o metodo.
   - Rojo: dudas, errores o cosas por verificar.
4. Al final escribe una nota de 5 bloques:
   - Pregunta central.
   - Metodo.
   - Hallazgos.
   - Limitaciones.
   - Como lo puedo usar.
5. Exporta las anotaciones a `02_notas_tablet`.
6. Crea un mapa conceptual si el tema tiene muchas relaciones.

Plantilla de nota de paper:

```markdown
# Paper: titulo

Fuente:
Fecha de lectura:
Curso/proyecto:

## Idea central

## Metodo

## Evidencia importante

## Conceptos nuevos

## Citas o paginas relevantes

## Dudas

## Como lo uso en mi proyecto
```

## 9. Celular para captura, IA, GitHub y Termux

Captura rapida:

- Ideas sueltas -> nota rapida.
- Enlaces -> `Drive/00_INBOX/enlaces-pendientes`.
- Fotos de pizarra o libros -> `Drive/00_INBOX/fotos`.
- Audios -> `Drive/00_INBOX/audios`.

Consulta IA movil:

- Pide explicaciones cortas.
- Convierte ideas en tareas.
- Resume capturas.
- Genera preguntas de repaso.
- Revisa redaccion antes de enviar.

GitHub movil:

- Revisa issues, README, commits y PRs.
- No hagas cambios grandes desde celular.
- Usa issues como recordatorios tecnicos.

Termux en emergencias:

```bash
pkg update && pkg install git openssh nano -y
git clone https://github.com/usuario/repo.git
cd repo
git pull
nano archivo.md
git status
git add archivo.md
git commit -m "fix: ajuste rapido desde termux"
git push
```

Regla de emergencia: Termux es para correcciones pequenas, no para reestructurar proyectos.

## 10. Reglas para no perder archivos ni duplicar versiones

Reglas de oro:

- Drive no reemplaza GitHub.
- GitHub no reemplaza Drive.
- No trabajes el mismo archivo final en tres ubicaciones.
- No guardes repos Git dentro de carpetas sincronizadas si eso causa conflictos.
- Todo archivo importante debe estar en Drive o GitHub, nunca solo local.
- Todo dataset debe tener README.
- Toda entrega final debe tener fecha y estado en el nombre.
- Todo repo activo debe tener `README.md`.
- Antes de trabajar en codigo: `git pull`.
- Despues de un avance importante: `git status`, `git add`, `git commit`, `git push`.
- Al cerrar el dia: limpia `00_INBOX`.

Convencion de nombres:

```text
AAAA-MM-DD_contexto_tema_estado.ext
2026-07-04_algoritmos_tarea01_FINAL.pdf
2026-07-04_paper-smith-resumen.md
2026-07-04_dataset-sensores_readme.md
```

Estados permitidos:

```text
borrador
revision
final
archivado
```

Evita:

```text
final.docx
final_final.pdf
nuevo2.ipynb
copia_de_copia.py
entrega_ultima_ahora_si.pdf
```

## 11. Rutina diaria recomendada

### Manana: orientar

1. Revisa calendario, entregas y prioridades.
2. Abre `Drive/00_INBOX` y mueve capturas urgentes.
3. Abre el repo activo en laptop.
4. Ejecuta:

```powershell
git pull
git status
```

5. Pide a IA un plan de 3 bloques:

```text
Actua como planificador academico-tecnico. Tengo estas tareas: [...]
Organizalas en 3 bloques de trabajo para hoy con prioridad, resultado esperado y criterio de cierre.
```

### Bloque profundo 1: producir

- Laptop.
- Codigo, informe, notebook o documentacion.
- Cierra con commit.

```powershell
git add .
git commit -m "feat: avanza modulo principal"
git push
```

### Medio dia: comprender

- Tablet.
- Lee un PDF o revisa material teorico.
- Exporta anotaciones.
- Convierte lectura en 5 bullets utiles para el proyecto.

### Bloque profundo 2: integrar

- Laptop.
- Transforma lectura en entregable, README, codigo o informe.
- Usa IA para explicar partes dificiles, revisar estructura o detectar huecos.

### Tarde/noche: revisar

- Celular o laptop.
- Revisa GitHub, Drive y pendientes.
- Actualiza bitacora.
- Sube avances.

### Cierre del dia

Checklist:

```markdown
- [ ] Drive/00_INBOX vaciado o reducido.
- [ ] PDFs nuevos ubicados en carpeta correcta.
- [ ] Notas de tablet exportadas.
- [ ] Repo activo con `git status` revisado.
- [ ] Cambios importantes commiteados y pusheados.
- [ ] Entregas finales guardadas en Drive.
- [ ] Tres tareas de manana definidas.
```

## 12. Estructura de carpetas recomendada para Drive

Para cursos:

```text
01_ACADEMIA/2026/curso-nombre/
  00_rubrica_y_silabo/
  01_pdfs/
  02_notas_tablet/
  03_datasets/
  04_recursos/
  05_borradores/
  06_entregas_finales/
  99_archivo/
```

Para proyectos tecnicos:

```text
02_PROYECTOS_TECNICOS/proyecto-nombre/
  00_brief/
  01_referencias/
  02_pdfs/
  03_datasets/
  04_media/
  05_entregables/
  99_archivo/
```

Para investigacion:

```text
01_ACADEMIA/2026/investigacion-tema/
  00_pregunta_y_objetivos/
  01_bibliografia/
  02_papers_pdf/
  03_notas_y_fichas/
  04_datos/
  05_analisis/
  06_borradores/
  07_entregables/
  99_archivo/
```

## 13. Estructura de repositorios recomendada para GitHub

Este repo `uso-com-n-` debe ser tu base de entorno:

```text
uso-com-n-/
  docs/
    flujo-productividad-academica-tecnica.md
  laptop-powershell/
  termux-bash/
  skills/
  config/
  ucn/
```

Para cada curso:

```text
curso-nombre-labs/
  README.md
  docs/
  notebooks/
  src/
  scripts/
  tests/
  data/
    README.md
  reports/
```

Para una entrega tecnica:

```text
proyecto-entrega/
  README.md
  docs/
    brief.md
    metodologia.md
    bitacora.md
  src/
  scripts/
  notebooks/
  reports/
    figuras/
    entrega.md
```

Para notebooks:

```text
notebooks-tema/
  README.md
  notebooks/
  data/
    README.md
    sample/
  exports/
  requirements.txt
```

## 14. Comandos basicos de Git

Configuracion inicial:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo@example.com"
git config --global init.defaultBranch main
```

Crear repo:

```bash
git init
git add README.md
git commit -m "docs: inicializa proyecto"
```

Clonar:

```bash
git clone https://github.com/usuario/repo.git
cd repo
```

Trabajo diario:

```bash
git pull
git status
git add archivo.md
git commit -m "docs: actualiza metodologia"
git push
```

Ver cambios:

```bash
git diff
git log --oneline --graph --decorate -10
```

Ramas:

```bash
git switch -c feature/nombre-corto
git switch main
git merge feature/nombre-corto
```

Deshacer con cuidado:

```bash
git restore archivo.md
git restore --staged archivo.md
```

No uses comandos destructivos como `git reset --hard` si no tienes seguridad total.

Mensajes de commit recomendados:

```text
docs: agrega guia de productividad
feat: implementa analisis de datos
fix: corrige calculo de metricas
refactor: simplifica parser
test: agrega pruebas de validacion
chore: actualiza configuracion
```

## 15. Integracion de agentes IA

Usa IA por rol, no como chat generico.

### Planificacion

Prompt:

```text
Actua como planificador academico-tecnico.
Tengo este objetivo: [...]
Tengo estos plazos: [...]
Divide el trabajo en hitos, tareas de 45-90 minutos, riesgos y criterio de terminado.
```

### Lectura academica

Prompt:

```text
Actua como asistente de lectura academica.
Resume este paper en: pregunta central, metodo, hallazgos, limitaciones, conceptos clave y como puedo usarlo en mi proyecto.
Devuelve tambien 5 preguntas de repaso.
```

### Programacion

Prompt:

```text
Actua como senior developer.
Lee este README y este error.
Propone la causa mas probable, un plan corto y el cambio minimo verificable.
```

### Escritura

Prompt:

```text
Actua como editor academico.
Revisa este borrador por claridad, estructura, argumentos, evidencia y tono.
No cambies el sentido. Dame una version mejorada y una lista de observaciones.
```

### Resumen y sintesis

Prompt:

```text
Convierte estas notas en:
1. resumen ejecutivo,
2. lista de conceptos,
3. tareas accionables,
4. preguntas abiertas,
5. material para repaso.
```

### Repaso

Prompt:

```text
Crea una sesion de repaso activo sobre este tema.
Incluye preguntas faciles, medias, dificiles, respuestas esperadas y errores comunes.
```

### Uso con este repo

Este repo ya integra accesos a agentes IA en PowerShell y Termux. Flujo recomendado:

```powershell
cd "J:\Mi unidad\02_Software_y_Herramientas\uso-com-n-"
git pull
codex
```

O desde Termux:

```bash
cd ~/workspace/uso-com-n-
git pull
codex
```

Para tareas academicas recurrentes, crea prompts dentro de:

```text
prompts/
  planificacion-dia.md
  lectura-paper.md
  revision-codigo.md
  editor-academico.md
  repaso-activo.md
```

## Flujo paso a paso de un entregable completo

1. Captura la consigna en celular y guardala en Drive.
2. Crea carpeta del curso/proyecto en Drive.
3. Crea o clona repo en laptop.
4. Crea `README.md` con objetivo, fecha, entregable y criterios.
5. Guarda PDFs, rubrica y datasets en Drive.
6. Lee y anota PDFs en tablet.
7. Exporta anotaciones a Drive.
8. En laptop, convierte anotaciones en `docs/metodologia.md` o `docs/bitacora.md`.
9. Programa scripts, notebooks o analisis en GitHub.
10. Haz commits pequenos.
11. Genera informe o entrega.
12. Guarda el final en Drive `06_entregas_finales`.
13. Haz commit de documentacion y scripts finales.
14. Cierra con checklist diario.

## Politica simple de ubicacion

```text
PDF original              -> Drive
PDF anotado               -> Drive
Dataset pesado            -> Drive
Dataset pequeno de prueba -> GitHub
Codigo                    -> GitHub
Notebook                  -> GitHub
Informe fuente Markdown   -> GitHub
Informe final PDF/DOCX    -> Drive
Capturas rapidas          -> Drive/00_INBOX
Prompts reutilizables     -> GitHub
Bitacora tecnica          -> GitHub
Rubricas y silabos        -> Drive
```

## Checklist semanal

```markdown
- [ ] Repos activos con cambios subidos.
- [ ] Drive sin archivos importantes en `00_INBOX`.
- [ ] Datasets documentados.
- [ ] Entregas finales ubicadas y nombradas.
- [ ] PDFs anotados exportados.
- [ ] README de cada repo actualizado.
- [ ] Issues o tareas de la semana proxima definidos.
- [ ] Backups implicitos confirmados: Drive sincronizado y GitHub actualizado.
```

## Resultado esperado

Con este sistema:

- La laptop produce.
- La tablet profundiza.
- El celular captura y revisa.
- Drive conserva materiales y entregas.
- GitHub conserva evolucion tecnica.
- IA acelera planificacion, comprension, codigo, escritura y repaso.

El sistema funciona si al final del dia puedes responder sin dudar:

```text
Donde esta el material?
Donde esta el codigo?
Que cambie hoy?
Que falta hacer?
Que debo entregar?
```
