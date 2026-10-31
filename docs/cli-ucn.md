# 🕹️ Comandos del CLI `ucn`

El binario compilado te da acceso a las siguientes automatizaciones:

### 1. Sincronizar Skills (`ucn sync`)
Actualiza el repositorio remoto (`git pull --rebase` automático si está activo en tu YAML) y reconstruye todos los enlaces simbólicos de tus agentes instalados:
```bash
ucn sync
```
*En Linux/Android crea **Symlinks** y en Windows crea **Junctions** (uniones de directorios) de forma segura y sin requerir permisos de administrador.*

También puedes usar los sincronizadores directos:
```bash
bash skills/sync-agent-skills.sh
powershell -File skills/sync-agent-skills.ps1
```

### 2. Safe GitOps Push (`ucn push "[mensaje]"`)
Agrega y sube los cambios que realices a tus configuraciones o skills locales a GitHub.
```bash
ucn push "agregada nueva skill de diseño"
```
*Utiliza de forma interna `git add --ignore-removal` para registrar nuevos archivos u modificaciones, ignorando y protegiéndote contra eliminaciones accidentales de archivos locales en el repositorio remoto.*

### 3. Diagnóstico del Sistema (`ucn doctor`)
Ejecuta un diagnóstico completo para validar la salud de tu entorno de desarrollo y de los agentes IA:
```bash
ucn doctor
```
*Verifica la plataforma (Termux/Linux/Windows/macOS), las rutas de datos/notas, la instalación de `git`, `node`, `npm`, `live-server`, `cloudflared`, el registro de agentes del `config/agents.yaml`, los archivos `.yaml`/`.env` locales y detecta enlaces simbólicos rotos.*

Corrige automáticamente configuraciones seguras (crear config faltante desde `.example`, directorios de notas/informes/cursos):
```bash
ucn doctor --fix
```

### 4. Estado de Agentes IA (`ucn agents`)
Muestra la tabla de agentes registrados en `config/agents.yaml` con su estado y ruta resuelta:
```bash
ucn agents
```

### 4b. Bootstrap de dispositivo (`ucn bootstrap`)
Prepara un dispositivo (nuevo o recien reinstalado) para que quede igual que los demas:
```bash
ucn bootstrap
```
*Detecta la plataforma, crea `config/config.yaml` y `config/.env` desde sus plantillas si faltan,
asegura los directorios de datos (notas/informes/cursos/laboratorios), agrega el hook de `termux-bash.sh`
al `~/.bashrc`, sincroniza las skills de todos los agentes y muestra el estado de los agentes. Es idempotente
(se puede correr varias veces).*

### 5. Túnel de Exposición Seguro (`ucn tunnel [nombre_tunel]`)
Expone tu servidor local (`live-server` u otros) hacia la red pública mediante Cloudflare Tunnel utilizando el token configurado en tu `.env`:
```bash
ucn tunnel
```

### 5b. Actualización (`ucn update`)
Sincroniza el dispositivo con el resto: pull del repo, resync de skills y verificación de agentes:
```bash
ucn update          # aplica cambios
ucn update --check  # solo comprueba si hay actualizaciones
ucn update --build  # además, recompila el CLI ucn tras actualizar
```
*Hace `git fetch` + `git pull --rebase`, re-enlaza las skills de todos los agentes y reporta
el estado de los agentes. Ideal para ponerse al día tras trabajar en otro dispositivo.*

### 5c. Perfiles de especialidad (`ucn profile`)
Ajusta el contexto que entregan los agentes IA según la tarea de cada momento:
```bash
ucn profile list        # ver perfiles disponibles
ucn profile use ingenieria    # activa el perfil de ingenieria
ucn profile current     # ver el perfil activo
ucn profile show        # ver el prompt que se activara en los agentes
ucn profile export      # regenera config/profile-prompts/<perfil>.md
```
Perfiles incluidos (`profiles/<nombre>/profile.yaml`): `default`, `ingenieria` (MATLAB, Python,
LaTeX, AutoCAD, SolidWorks, ETAP, APA 7), `programacion` (GitHub, Node, Docker, APIs, testing),
`investigacion` (IEEE/APA, LaTeX/BibTeX) y `universidad` (tareas, examenes, exposiciones).

**Inyección en los agentes.** El prompt del perfil activo se exporta a `config/profile-prompts/<perfil>.md`
(se regenera con `ucn profile export`). Los wrappers de agentes lo inyectan automáticamente:
`cl`/`cl-full` (Claude) lanzan `claude --append-system-prompt-file <archivo>`, y los demás agentes
reciben el perfil vía `UCN_PROFILE`. Los wrappers están en `termux-bash/ia-tools.sh` (Termux/Linux),
`laptop-powershell/Microsoft.PowerShell_profile.ps1` (Windows) y `laptop-cmd/ucn.cmd` (CMD).

El perfil activo queda guardado por dispositivo en `config/.current-profile` (no se sube al repo)
y se exporta como `UCN_PROFILE` en `ucn-platform.sh`.

### 5d. Gestión de skills (`ucn skills`)
Lista, inspecciona y limpia los enlaces de skills de todos los agentes instalados:
```bash
ucn skills list              # tabla: estado de cada skill y enlaces por agente
ucn skills status spice      # detalle de los enlaces de una skill
ucn skills status            # detalle de todas
ucn skills clean             # solo reporta problemas (no destructivo)
ucn skills clean --apply     # elimina los enlaces rotos detectados
```
Estados: `✓ ok` (enlazada en todos los agentes), `⚠ parcial` (faltan agentes), `⚠ dir local`
(existe un directorio real en lugar del enlace UCN), `✗ roto` (el destino no existe) y
`✗ no enlazada`. `clean` además detecta los respaldos `*_backup` que `ucn sync` deja al
reemplazar directorios reales; se reportan pero **no se eliminan automáticamente** (revísalos
a mano antes de borrarlos).

### 5e. Recompilar el CLI (`ucn build`)
```bash
ucn build            # compila ucn/cmd/ucn -> ucn/ucn (o ucn/ucn.exe en Windows)
ucn update --build   # actualiza el repo y recompila en un solo paso
```
Requiere Go instalado. El binario queda en el repo y está en `.gitignore`, así que no
se sube a GitHub. En Termux/Linux/macOS el build produce `ucn/ucn` y en Windows `ucn/ucn.exe`.

---

