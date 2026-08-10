# uso-com-n- (UCN) — Mochila Digital

Entorno portable de productividad academica y tecnica para Android (Termux), Linux, Windows y macOS, con sincronizacion de Skills para Agentes de IA.

```
Multi-plataforma: Termux + Linux + Windows + macOS
GitHub + Syncthing + Skills IA + Scripts + CLI Go
```

---

## Que es UCN?

**UCN** es una "mochila digital": todo lo que necesitas para estudiar, programar, hacer informes y trabajar desde cualquier dispositivo.

- **Misma terminal** en Android, Linux, Windows y macOS (alias, funciones, MOTD)
- **42 skills de IA** sincronizadas entre agentes (OpenCode, Claude, Codex, Cursor, Gemini)
- **CLI propio** (`ucn`) para sincronizar, subir cambios, diagnosticar y exponer tu entorno
- **Multi-plataforma**: detecta automaticamente Termux, Linux, WSL, macOS, Windows
- **Desacoplado**: secretos en `.env`, config en `config.yaml`, todo versionado

---

## Contenido del repo

```
UCN/
├── termux-bash/           # Dotfiles para bash (multi-plataforma)
│   ├── aliases.sh         # Alias generales y UCN
│   ├── functions.sh       # Funciones personalizadas
│   ├── ia-tools.sh        # Atajos para agentes IA
│   ├── motd.sh            # Mensaje de bienvenida
│   └── termux-bash.sh     # Entry point
├── laptop-powershell/     # Perfil PowerShell para Windows
│   └── Microsoft.PowerShell_profile.ps1
├── ucn/                   # CLI en Go (sync, push, doctor, tunnel)
│   ├── cmd/ucn/main.go    # Entrypoint
│   └── internal/          # Logica interna
├── skills/
│   ├── agent-skills/      # 42 skills para agentes IA
│   ├── agents/            # Reglas por agente
│   ├── sync-agent-skills.sh   # Sync bash (Linux/macOS/Termux)
│   └── sync-agent-skills.ps1  # Sync PowerShell (Windows)
├── super_organizador/      # Organizador inteligente de archivos con IA
├── scripts/
│   ├── ucn-platform.sh    # Deteccion de plataforma (nuevo)
│   ├── test-all.sh        # Suite de verificacion (build, bash, resolver, doctor)
│   ├── ucn-note.sh        # Nota rapida Markdown
│   ├── ucn-clase.sh       # Abrir carpeta universidad
│   ├── ucn-informe.sh     # Plantilla de informe
│   ├── ucn-install-all.sh # Instalacion completa
│   ├── install-debian-xfce.sh # Instalador Debian + XFCE
│   └── install-arch-xfce.sh   # Instalador Arch Linux ARM + XFCE
├── config/
│   ├── agents.yaml          # Registro central de agentes IA
│   ├── config.yaml.example  # Config con paths por plataforma
│   └── .env.example         # Tokens y UCN_<AGENTE>_BIN (nunca subir el .env)
├── .github/workflows/ci.yml # CI: gofmt, vet, build, tests, bash syntax
├── docs/
│   ├── mochila-digital.md                  # Guia completa
│   ├── flujo-productividad-academica-tecnica.md # Flujo diario
│   ├── escritorio-debian-xfce.md          # Escritorio Debian + XFCE
│   └── escritorio-arch-xfce.md            # Escritorio Arch Linux ARM
├── css/ / js/ / index.html            # Interfaz web
└── install.sh                          # Instalador principal
```

---

## Super Organizador Inteligente

Organizador automatico de archivos con inteligencia artificial. Escanea cualquier directorio o unidad, genera arboles de directorios, inventarios de archivos, detecta duplicados y problemas, y usa IA (OpenAI, Gemini, Ollama) para sugerir una estructura de categorias personalizada y ejecutar el plan de organizacion.

```
super_organizador/
├── main.py                 # Entrypoint
├── config.yaml             # Configuracion general
├── core/                   # Logica principal
│   ├── scanner.py          # Escaneo recursivo de directorios
│   ├── tree_generator.py   # Generacion de arbol
│   ├── inventory.py        # Inventario de archivos CSV/JSON
│   ├── problem_detector.py # Deteccion de duplicados y problemas
│   ├── duplicate_detector.py # Deteccion de archivos duplicados
│   ├── ai_classifier.py    # Clasificador por IA
│   ├── category_suggester.py # Sugerencia de categorias con IA
│   ├── classifier.py       # Clasificador por reglas
│   ├── planner.py          # Plan de organizacion
│   ├── executor.py         # Ejecucion de movimientos
│   ├── rollback.py         # Reversion de cambios
│   ├── normalizer.py       # Normalizacion de nombres
│   └── validators.py       # Validadores de ruta y config
├── data/                   # Datos de referencia
│   ├── categories.yaml     # Categorias predefinidas
│   ├── keywords.yaml       # Palabras clave por categoria
│   └── ignored_patterns.yaml # Patrones a ignorar
├── tests/                  # Tests unitarios
├── reports/                # Reportes generados
├── .opencode/agents/       # Agente para OpenCode
└── requirements.txt        # Dependencias
```

**Uso basico:**
```bash
python main.py --path "C:\Users\..."        # Escanear y analizar
python main.py --path "./mi carpeta" --analyze-only  # Solo analisis
python main.py --path "./mi carpeta" --plan           # Generar plan sin ejecutar
python main.py --path "./mi carpeta" --apply          # Ejecutar plan
```

**Configuracion:** editar `config.yaml` para seleccionar proveedor IA (openai/gemini/ollama), definir categorias personalizadas y ajustar comportamiento.

---

## Repositorios de Ingenieria y Practicas PLC-Modbus

Documentacion completa (repos verificados, fuentes, OpenPLC v4, búsquedas): [docs/repos-ingenieria-electromecanica.md](docs/repos-ingenieria-electromecanica.md)

Practicas de automatizacion sin hardware (simulan un PLC por Modbus TCP):

```
practicas/plc-modbus/
├── 1_servidor_plc.py        # PLC virtual: servidor Modbus TCP
├── 2_cliente_panel.py       # Panel de operador (motores, velocidad, alarmas)
└── 3_escaneo_rtu_futuro.py  # Polling tipo SCADA
```

```bash
# Requiere (fuera de la SD, FUSE no permite venv con symlinks):
python3 -m venv /tmp/opencode/venv
/tmp/opencode/venv/bin/pip install pymodbus

# Terminal 1: PLC | Terminal 2: panel | Terminal 3: SCADA
/tmp/opencode/venv/bin/python 1_servidor_plc.py 5020
/tmp/opencode/venv/bin/python 2_cliente_panel.py 127.0.0.1 5020
/tmp/opencode/venv/bin/python 3_escaneo_rtu_futuro.py 127.0.0.1 5020
```

---

## Instalacion rapida (multi-plataforma)

### 1. Clonar el repo
```bash
# Android (Termux)
git clone https://github.com/gaelrenzo/uso-com-n-.git /storage/emulated/0/universida-datos/uso-com-n-

# Linux / macOS
git clone https://github.com/gaelrenzo/uso-com-n-.git ~/universida-datos/uso-com-n-

# Windows (Git Bash o PowerShell)
git clone https://github.com/gaelrenzo/uso-com-n-.git %USERPROFILE%\universida-datos\uso-com-n-
```

### 2. Ejecutar instalador
```bash
cd uso-com-n-
bash install.sh
source ~/.bashrc
```

El instalador **detecta automaticamente** tu plataforma (Termux, Linux, macOS, Windows Git Bash) y configura todo.

### 3. (Opcional) Compilar el CLI en Go
```bash
# Instalar Go: 
#   Termux:   pkg install golang
#   Linux:    sudo apt install golang
#   Windows:  winget install GoLang.Go
#   macOS:    brew install go

cd ucn
# Linux/Termux/macOS:
go build -o ucn cmd/ucn/main.go
# Windows:
go build -o ucn.exe cmd/ucn/main.go
```

### 4. Configurar
```bash
# Editar config con tu nombre
nano config/config.yaml

# Editar tokens de API
nano config/.env
```

> [!IMPORTANT]
> `config/config.yaml` tiene paths por plataforma. El instalador crea uno local desde la plantilla.
> `config/.env` tiene tus tokens - NUNCA lo subas a GitHub.

### Windows (PowerShell nativo)
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
Copy-Item -Path .\laptop-powershell\Microsoft.PowerShell_profile.ps1 -Destination $PROFILE -Force
. $PROFILE
```

---

## 🕹️ Comandos del CLI `ucn`

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

---

## 📱 Guía Rápida para Dispositivos Móviles (Termux / Ubuntu)

### 1. Configurar Terminal Termux
Ejecuta la actualización inicial e instala los paquetes base en Termux:
```bash
pkg update && pkg upgrade -y
pkg install git -y
git clone https://github.com/gaelrenzo/uso-com-n-.git /storage/emulated/0/universida-datos/uso-com-n-
cd /storage/emulated/0/universida-datos/uso-com-n-
bash install.sh
source ~/.bashrc
```

### Escritorio Debian + XFCE (Termux:X11)

Ejecuta un escritorio Linux completo en Android, sin root, con la app Termux:X11.

**Instalacion:**
```bash
ucn-install-debian
# o directamente
bash /mnt/sdcard/universida-datos/uso-com-n-/scripts/install-debian-xfce.sh
```

**Arranque:**
```bash
ucn-debian
# o directamente
bash ~/.shortcuts/start-debian-xfce.sh
```

> Requiere la app **Termux:X11** descargada desde GitHub (buscar nightly release).
> Guia completa y solucion de problemas: `docs/escritorio-debian-xfce.md`

### Instalacion completa (todo incluido)

```bash
bash /storage/emulated/0/universida-datos/uso-com-n-/scripts/ucn-install-all.sh
```

Esto instala: paquetes base, Ubuntu proot, Python cientifico, agentes IA, librerias de ingenieria y UCN.

### Instalar Cloudflared (opcional)

Cloudflared permite exponer servicios locales a internet mediante tuneles seguros:

```bash
pkg install cloudflared
```

Para configurar el tunel, edita `config/.env` y agrega tu token:
```
CLOUDFLARE_TUNNEL_TOKEN=tu_token_aqui
```

Luego ejecuta:
```bash
ucn tunnel
```

### En Windows

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
Copy-Item -Path .\laptop-powershell\Microsoft.PowerShell_profile.ps1 -Destination $PROFILE -Force
```

---

## Comandos UCN

| Comando | Que hace |
|---------|----------|
| `ucn sync` | Sincroniza skills desde GitHub |
| `ucn push "msg"` | Sube cambios seguros (sin borrar locales) |
| `ucn doctor` | Diagnostica plataforma, dependencias y agentes IA |
| `ucn doctor --fix` | Corrige config y directorios automáticamente |
| `ucn agents` | Muestra el estado de los agentes IA del registro |
| `ucn bootstrap` | Prepara el dispositivo (config, dirs, hook, skills) |
| `ucn tunnel` | Tunnel Cloudflare |
| `ucn note "tema"` | Crea nota rapida en Markdown |
| `ucn clase` | Abre carpeta de universidad |
| `ucn informe "t"` | Genera plantilla de informe |
| `ucn update` | Actualiza UCN desde GitHub |
| `ucn-install-all` | Instalacion completa del sistema |
| `ucn-debian` | Arranca escritorio Debian + XFCE |
| `ucn-install-debian` | Instala Debian + XFCE en Termux |

---

## 🔬 Verificacion y CI (Fase 1 - Robustez)

El registro central de agentes es **`config/agents.yaml`**: Bash, PowerShell, CMD y el CLI Go resuelven los binarios con el MISMO criterio:

1. Variable `UCN_<AGENTE>_BIN` (override en `config/.env`)
2. Comando en el PATH del dispositivo
3. Rutas conocidas por plataforma (del `agents.yaml`)

### Suite de tests local

```bash
./scripts/test-all.sh        # todos los checks (build Go, bash -n, resolver, doctor, estructura)
./scripts/test-all.sh quick  # solo checks rapidos sin compilar
```

Comprueba: build Go, `bash -n` de todos los scripts, resolución de agentes, variables de entorno, detección del repositorio/notas, estructura del repo y respuesta del CLI (`doctor`/`agents`).

### CI en GitHub Actions

Cada `push`/PR a `main` ejecuta (ver `.github/workflows/ci.yml`): `gofmt`, `go vet`, `go build`, tests de parseo de `agents.yaml`, `bash -n` de todos los scripts, `shellcheck` (si está disponible) y la suite `test-all.sh quick`.

### Agregar un agente IA nuevo

Para añadir un agente (ej. `composum`) se actualiza **solo el registro central**:

```yaml
  composum:
    command: composum
    env: UCN_COMPOSUM_BIN
    wrapper: comp
    full_args: --yolo
    description: Nuevo agente
    known_paths:
      termux: ["/data/data/com.termux/files/usr/bin/composum"]
      linux: ["/usr/bin/composum"]
      windows: ["%USERPROFILE%\\.local\\bin\\composum.exe"]
```

Y el wrapper `comp() { ucn_run composum "$@"; }` en `termux-bash/ia-tools.sh`. La suite de tests y el doctor lo detectan automáticamente.

---

## Personalizacion multi-dispositivo (igual en laptop, tablet y celular)

Documentacion completa: [docs/personalizacion-multi-dispositivo.md](docs/personalizacion-multi-dispositivo.md)

Los comandos de agentes IA son **identicos** en PowerShell (laptop), Bash/Termux
(tablet y celular) y CMD (laptop). Se resuelven automaticamente en cada dispositivo.

| Comando | Agente |
|---------|--------|
| `codex` / `codex-full` | Codex CLI |
| `cl` / `cl-full` | Claude Code |
| `ocode` / `ocode-full` | OpenCode |
| `anti` / `anti-full` | Antigravity (`agy`) |
| `hermes` / `hermes-full` | Hermes Agent |
| `ucn-agents` | Diagnostico de agentes instalados |

Verificacion en cada dispositivo:

```bash
source scripts/ucn-platform.sh   # o: source termux-bash/termux-bash.sh
echo "Plataforma: $UCN_PLATFORM | Datos: $UCN_DATA_DIR"
ucn-agents
```

---

## Apps recomendadas (F-Droid)

| App | Para que |
|-----|----------|
| Termux | Terminal principal |
| Termux:API | Sensores, bateria, clipboard |
| Termux:Widget | Botones rapidos |
| Material Files | Explorador de archivos |
| Aegis | 2FA (GitHub, Google) |
| K-9 Mail | Correo |
| Syncthing-Fork | Sync Android-Laptop |
| Markor | Notas Markdown |
| AntennaPod | Podcasts |
| Fennec | Navegador Firefox |
| NewPipe | Videos sin anuncios |

---

## Skills instaladas (42)

### Internet
agent-reach, freedomain, last30days, notebooklm

### Electronica & PCB
bom, datasheets, digikey, element14, emc, jlcpcb, kicad, kidoc, lcsc, mouser, pcbway, spice

### Desarrollo
api-design-principles, changelog-automation, codegraph, find-skills, karpathy-guidelines, postgresql, spec-kit, superpowers, systematic-debugging

### Diseno
floor-plan-generator, frontend-design, visual-design-foundations

### Agentes & Productividad
claude-mem, claude-plugins, obsidian-skills, professor-synapse, ponytail (y variantes), rtk, skillspector

### Escritura
thesis-writing

### Ingenieria
ingenieria-electromecanica

---

## Flujo diario

```bash
ucn sync       # traer ultimas skills
ucn doctor     # verificar entorno
ucn clase      # empezar a estudiar
ucn note "tema"  # tomar apuntes
ucn informe "titulo"  # crear informe
ucn push "avance"  # subir cambios
```

Para mas detalle: `docs/flujo-productividad-academica-tecnica.md`
Guia de instalacion completa: `docs/mochila-digital.md`

---

## Troubleshooting

### Permisos de scripts en FAT32 (sdcard)

Los scripts en `/storage/emulated/0/` o `/mnt/sdcard/` no conservan permisos `+x` porque la sdcard usa FAT32. Solucion:

```bash
# Ejecutar con bash directamente
bash scripts/ucn-note.sh "tema"

# O usar el alias (ya configurado)
ucn-note "tema"
```

### Debian + XFCE no inicia

**Error: "Cannot open display"**
```bash
# Verificar que termux-x11 este corriendo
ps aux | grep termux-x11

# Reiniciar si es necesario
termux-x11 :0 -ac &
sleep 3
```

**Error: "Bus address not found"**
```bash
# Dentro de Debian, reiniciar dbus
service dbus restart
```

**Error: "PulseAudio no conecta"**
```bash
# Verificar PulseAudio
pulseaudio --kill
pulseaudio --start --exit-idle-time=-1
pacmd load-module module-native-protocol-tcp auth-ip-acl=127.0.0.1 auth-anonymous=1
```

**Pantalla negra en Termux:X11**
```bash
# Verificar que XFCE este instalado
proot-distro login debian -- apt list --installed | grep xfce4

# Si no esta, reinstalar
proot-distro login debian -- apt install -y xfce4
```

### UCN CLI no encuentra el repositorio

Asegurate de estar dentro del directorio del proyecto o ejecutar desde la raiz:
```bash
cd /mnt/sdcard/universida-datos/uso-com-n-
ucn doctor
```

### Agentes IA (codex, claude, opencode, hermes) no funcionan

Ver detalle completo: [docs/personalizacion-multi-dispositivo.md](docs/personalizacion-multi-dispositivo.md)

```bash
# Diagnostico rapido: muestra la ruta de cada agente detectado
ucn-agents

# Codex roto por dependencia ARM64 -> reinstalar
npm install -g @openai/codex@latest

# Hermes no encontrado -> localizar y fijar ruta en config/.env
which hermes
# UCN_HERMES_BIN=/ruta/al/hermes

# La tablet y el celular se ven distintos -> verificar plataforma/rutas
source scripts/ucn-platform.sh
echo "Plataforma: $UCN_PLATFORM | Datos: $UCN_DATA_DIR"
```

### Skills no aparecen despues de sincronizar

```bash
# Forzar resincronizacion
ucn sync

# Verificar enlaces
ls -la ~/.claude/skills/
ls -la ~/.config/opencode/skills/
```

### Git pull falla en Termux

```bash
# Configurar git si no esta configurado
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Verificar conexion
git remote -v
```
