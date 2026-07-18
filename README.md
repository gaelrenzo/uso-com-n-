# uso-com-n- (UCN) — Mochila Digital

Entorno portable de productividad academica y tecnica para Android (Termux), Linux y Windows, con sincronizacion de Skills para Agentes de IA.

```
Termux + Ubuntu + GitHub + Syncthing + Skills IA + Scripts
```

---

## Que es UCN?

**UCN** es una "mochila digital": todo lo que necesitas para estudiar, programar, hacer informes y trabajar desde cualquier dispositivo.

- **Misma terminal** en Android, Linux y Windows (alias, funciones, MOTD)
- **42 skills de IA** sincronizadas entre agentes (OpenCode, Claude, Codex, Cursor, Gemini)
- **CLI propio** (`ucn`) para sincronizar, subir cambios, diagnosticar y exponer tu entorno
- **Desacoplado**: secretos en `.env`, config en `config.yaml`, todo versionado

---

## Contenido del repo

```
UCN/
├── termux-bash/           # Dotfiles para Termux/Android
│   ├── aliases.sh         # Alias generales y UCN
│   ├── functions.sh       # Funciones personalizadas
│   ├── ia-tools.sh        # Atajos para agentes IA
│   ├── motd.sh            # Mensaje de bienvenida
│   └── termux-bash.sh     # Entry point
├── laptop-powershell/     # Perfil PowerShell para Windows
├── ucn/                   # CLI en Go (sync, push, doctor, tunnel)
│   ├── cmd/ucn/main.go    # Entrypoint
│   └── internal/          # Logica interna
├── skills/
│   ├── agent-skills/      # 42 skills para agentes IA
│   ├── agents/            # Reglas por agente
│   └── sync-agent-skills.sh
├── scripts/               # Scripts auxiliares
│   ├── ucn-note.sh        # Nota rapida Markdown
│   ├── ucn-clase.sh       # Abrir carpeta universidad
│   ├── ucn-informe.sh     # Plantilla de informe
│   └── ucn-install-all.sh # Instalacion completa
├── config/
│   ├── config.yaml.example
│   └── .env.example
├── docs/
│   ├── mochila-digital.md              # Guia completa de instalacion
│   └── flujo-productividad-academica-tecnica.md
├── css/ / js/ / index.html            # Interfaz web
└── install.sh                          # Instalador principal
```

---

## Instalacion rapida

### En Termux (Android)

### 1. Prerrequisitos
Debes tener instalado **Go (GoLang)**:
*   **Windows (PowerShell):** `winget install GoLang.Go`
*   **Ubuntu / Linux:** `sudo apt update && sudo apt install golang -y`
*   **Android (Termux):** `pkg update && pkg install golang -y`

### 2. Compilar el CLI
Ingresa al directorio `ucn` y construye el binario ejecutable:
```bash
cd ucn
# En Windows:
go build -o ucn.exe cmd/ucn/main.go
# En Linux/Termux:
go build -o ucn cmd/ucn/main.go
```
*Tip: Te recomendamos añadir el binario compilado a tu variable de entorno PATH para poder llamarlo con `ucn` desde cualquier directorio.*

### 3. Crear Configuraciones Locales
Genera tus archivos de parámetros a partir de las plantillas provistas:
```bash
cp config/config.yaml.example config/config.yaml
cp config/.env.example config/.env
```
> [!IMPORTANT]
> Edita `config/config.yaml` para añadir tu nombre de desarrollador, correo y activar/desactivar las carpetas de tus agentes locales. Agrega tus tokens de API en `config/.env`.

Si quieres sincronizar las skills del repo con los agentes locales sin compilar el CLI, ejecuta:
```bash
bash install-agent-skills.sh
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
Ejecuta un diagnóstico completo para validar la salud de tu entorno de desarrollo:
```bash
ucn doctor
```
*Verifica la instalación de `git`, `node`, `npm`, `live-server`, `cloudflared`, revisa el estado de tus ficheros `.yaml`/`.env` locales y detecta enlaces simbólicos rotos.*

### 4. Túnel de Exposición Seguro (`ucn tunnel [nombre_tunel]`)
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

### Instalacion completa (todo incluido)

```bash
bash /storage/emulated/0/universida-datos/uso-com-n-/scripts/ucn-install-all.sh
```

Esto instala: paquetes base, Ubuntu proot, Python cientifico, agentes IA, librerias de ingenieria y UCN.

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
| `ucn doctor` | Diagnostica el entorno |
| `ucn tunnel` | Tunnel Cloudflare |
| `ucn note "tema"` | Crea nota rapida en Markdown |
| `ucn clase` | Abre carpeta de universidad |
| `ucn informe "t"` | Genera plantilla de informe |
| `ucn update` | Actualiza UCN desde GitHub |
| `ucn-install-all` | Instalacion completa del sistema |

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
