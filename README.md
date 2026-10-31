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

## Instalacion con chezmoi (opcional)

Alternativa a `install.sh` que funciona igual en Termux, Linux, macOS y Windows.
La raiz de chezmoi es `home/` (ver `.chezmoiroot`); el resto del repo no se toca.

```bash
# Termux / Linux / macOS (instalar chezmoi: pkg install chezmoi | apt install chezmoi)
chezmoi init --apply gaelrenzo/uso-com-n-
# Usar un clon existente en vez de clonar otro:
chezmoi init --apply --source ~/workspace/uso-com-n-
```

```powershell
# Windows
winget install twpayne.chezmoi
chezmoi init --apply gaelrenzo/uso-com-n-
```

- **bash**: agrega `source .../termux-bash/termux-bash.sh` a `~/.bashrc` solo si falta (no pisa tu contenido).
- **PowerShell 5 y 7**: el perfil carga `laptop-powershell/Microsoft.PowerShell_profile.ps1` del repo.
  Si tus Documentos estan en OneDrive, chezmoi usa `~/Documents`; ajusta con `chezmoi cd` si hace falta.
- Actualizar en cualquier dispositivo: `chezmoi update`.

---

## Repositorios de Ingenieria y Practicas PLC-Modbus

Repos para mejorar dotfiles, skills IA y Termux: [docs/repos-recomendados.md](docs/repos-recomendados.md)

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

## Documentacion

- [Super Organizador](docs/super-organizador.md)
- [CLI `ucn`](docs/cli-ucn.md)
- [Guia para moviles](docs/guia-movil.md)
- [Verificacion y CI](docs/verificacion-ci.md)
- [Apps recomendadas](docs/apps-recomendadas.md)
- [Solucion de problemas](docs/troubleshooting.md)
- [Mochila digital](docs/mochila-digital.md)
- [Personalizacion multi-dispositivo](docs/personalizacion-multi-dispositivo.md)
- [Flujo de productividad academica](docs/flujo-productividad-academica-tecnica.md)

## Seguridad

- `ucn push` bloquea credenciales y archivos privados antes del commit; `ucn secrets` revisa lo ya versionado.
- Los modos `*-full` no piden confirmacion. Como root estan bloqueados salvo `UCN_ALLOW_ROOT_AGENTS=1` en `config/.env`.
- Licencias de terceros: [NOTICE.md](NOTICE.md).

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

## Comandos UCN

| Comando | Que hace |
|---------|----------|
| `ucn sync` | Sincroniza skills desde GitHub |
| `ucn push "msg"` | Sube cambios seguros (sin borrar locales) |
| `ucn doctor` | Diagnostica plataforma, dependencias y agentes IA |
| `ucn doctor --fix` | Corrige config y directorios automáticamente |
| `ucn agents` | Muestra el estado de los agentes IA del registro |
| `ucn bootstrap` | Prepara el dispositivo (config, dirs, hook, skills) |
| `ucn update` | Actualiza repo, resync skills y verifica agentes |
| `ucn update --check` | Solo comprueba si hay actualizaciones |
| `ucn update --build` | Actualiza y además recompila el CLI |
| `ucn build` | Recompila el CLI ucn (ucn/ucn o ucn/ucn.exe) |
| `ucn skills list` | Estado de las skills del repo por agente |
| `ucn skills status X` | Detalle de enlaces de una skill |
| `ucn skills clean` | Detecta enlaces rotos y respaldos huérfanos (--apply elimina) |
| `ucn profile list` | Lista los perfiles de especialidad |
| `ucn profile use X` | Activa el perfil X |
| `ucn profile show` | Muestra el perfil activo y su prompt |
| `ucn tunnel` | Tunnel Cloudflare |
| `ucn note "tema"` | Crea nota rapida en Markdown |
| `ucn clase` | Abre carpeta de universidad |
| `ucn informe "t"` | Genera plantilla de informe |
| `ucn update` | Actualiza UCN desde GitHub |
| `ucn-install-all` | Instalacion completa del sistema |
| `ucn-debian` | Arranca escritorio Debian + XFCE |
| `ucn-install-debian` | Instala Debian + XFCE en Termux |

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
| `gem` / `gem-full` | Gemini CLI |
| `qwen` / `qwen-full` | Qwen Code |
| `crush` / `crush-full` | Crush |
| `copilot` / `copilot-full` | GitHub Copilot CLI |
| `amp` / `amp-full` | Amp |
| `iflow` / `iflow-full` | iFlow |
| `aider` / `aider-full` | Aider |
| `kimi` / `kimi-full` | Kimi CLI |
| `cursor` / `cursor-full` | Cursor CLI |
| `kilo` / `auggie` | Kilo Code / Augment (sin modo full) |
| `ucn-agents` | Diagnostico de agentes instalados |
| `ucn-install-ia` | Instala las IAs que falten |

Comandos basicos y de navegacion (`ll`, `update`, `weather`, `sysinfo`, `editui`,
`uni`, `notas`, `informes`, `cursos`, `labs`, `workspace`, `repos`) tambien son
identicos en Bash/Termux, PowerShell y CMD.

Verificacion en cada dispositivo:

```bash
source scripts/ucn-platform.sh   # o: source termux-bash/termux-bash.sh
echo "Plataforma: $UCN_PLATFORM | Datos: $UCN_DATA_DIR"
ucn-agents
```

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

