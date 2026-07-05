# uso-com-n- (UCN)

## Guia de productividad academica y tecnica

Este repo incluye una guia operativa para organizar laptop, tablet y celular con Google Drive, GitHub, VS Code, Termux y agentes IA:

- [Flujo de productividad academica y tecnica](docs/flujo-productividad-academica-tecnica.md)

---
> Guía web y entorno portable de desarrollo para Android (Termux/Ubuntu proot), Linux y Windows, con sincronización de Habilidades (Skills) para Agentes de IA.

---

## 🚀 ¿Qué es UCN?
**UCN** es un entorno portable y un conjunto de herramientas diseñadas para unificar tu experiencia de desarrollo en cualquier dispositivo. Te permite:
*   **Tener la misma terminal:** Mantener alias, variables y mensajes de bienvenida coherentes entre Android, Linux y Windows.
*   **Centralizar Habilidades de IA:** Compartir y sincronizar de forma nativa tus *habilidades* (skills) de agentes de IA (como Claude, Codex, Antigravity, OpenCode, Cursor, etc.).
*   **Desacoplar secretos:** Configurar datos del desarrollador en un único archivo YAML funcional y secretos en un archivo de variables de entorno `.env` seguro.
*   **Exposición Segura:** Levantar túneles de red seguros en local a través de **Cloudflare Tunnels**.
*   **Escribir una vez, correr en todos lados:** Gestionar todo el flujo mediante un binario CLI multiplataforma único desarrollado en Go (`ucn`).

---

## 📂 Estructura del Proyecto

```text
├── config/                # Plantillas y configuraciones locales (.gitignoreado)
│   ├── README.md          # Manual del sistema de configuración
│   ├── .env.example       # Plantilla de variables sensibles y API Keys
│   └── config.yaml.example# Plantilla de configuración funcional de alias y agentes
├── termux-bash/           # Configuración del entorno de terminal para Termux/Ubuntu
│   ├── aliases.sh         # Alias generales de terminal
│   ├── functions.sh       # Funciones personalizadas
│   ├── ia-tools.sh        # Accesos y atajos para herramientas IA
│   ├── motd.sh            # Mensaje de bienvenida (clima, RAM, comandos rápidos)
│   └── termux-bash.sh     # Script de inicio principal
├── laptop-powershell/     # Configuración y duplicado de entorno en Windows
│   └── Microsoft.PowerShell_profile.ps1 # Perfil de Windows PowerShell
├── ucn/                   # Motor Core escrito en Go (Multiplataforma)
│   ├── README.md          # Documentación interna y compilación
│   ├── go.mod             # Módulo de Go
│   ├── cmd/ucn/           # Entrypoint del CLI
│   └── internal/          # Lógica interna (config, sync, git, doctor, tunnel)
├── skills/                # Directorio de habilidades para tus agentes de IA
│   └── agent-skills/      # 42 skills de agentes de IA (electrónica, dev, AI, diseño, escritura...)
└── index.html             # Interfaz de la guía web interactiva (con estilos en css/ y js/)
```

---

## 🛠️ Instalación y Configuración del CLI `ucn`

Para utilizar la herramienta de gestión multiplataforma `ucn`:

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

---

## 🕹️ Comandos del CLI `ucn`

El binario compilado te da acceso a las siguientes automatizaciones:

### 1. Sincronizar Skills (`ucn sync`)
Actualiza el repositorio remoto (`git pull --rebase` automático si está activo en tu YAML) y reconstruye todos los enlaces simbólicos de tus agentes instalados:
```bash
ucn sync
```
*En Linux/Android crea **Symlinks** y en Windows crea **Junctions** (uniones de directorios) de forma segura y sin requerir permisos de administrador.*

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
pkg install git nodejs-lts openssh curl nano tmux -y
npm install -g live-server
```

### 2. Clonar e Instalar
```bash
git clone https://github.com/gaelrenzo/uso-com-n-.git ~/workspace/uso-com-n-
cd ~/workspace/uso-com-n-
# Ejecutar instalador de terminal (dotfiles)
chmod +x install.sh
./install.sh
source ~/.bashrc
```

### 3. Lanzar Servidor Local
```bash
live-server --host=127.0.0.1 --port=8080
```
Y abre en tu navegador de Android: `http://127.0.0.1:8080`.

---

## 💻 Guía Rápida para Windows (PowerShell)

Para replicar la misma terminal interactiva (MOTD) y alias en tu Laptop:

1.  Abre PowerShell como Administrador y habilita la ejecución de scripts locales:
    ```powershell
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```
2.  Crea la carpeta del perfil si no existe y copia el script personalizado:
    ```powershell
    New-Item -ItemType Directory -Path (Split-Path -Parent $PROFILE) -Force
    # Desde la carpeta raíz del proyecto clonado:
    Copy-Item -Path .\laptop-powershell\Microsoft.PowerShell_profile.ps1 -Destination $PROFILE -Force
    ```
3.  Cierra y vuelve a abrir PowerShell para visualizar tu panel interactivo de bienvenida.

---

## 📦 Skills Instaladas (42 total)

> **Nota**: Estas skills se sincronizan automáticamente mediante `ucn sync` y están disponibles para todos los agentes de IA configurados (OpenCode, Claude, Codex, Cursor).

### 🌐 Internet & Plataformas

| Skill | Descripción | Fuente |
|-------|-------------|--------|
| **agent-reach** | Router de internet para 13 plataformas (búsqueda, redes sociales, carreras, dev, web, video) | [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) |
| **freedomain** | Dominios gratuitos (.dpdns.org, .us.kg, .qzz.io, .xx.kg, .qd.je) | [DigitalPlatDev/FreeDomain](https://github.com/DigitalPlatDev/FreeDomain) ⭐181k |
| **last30days** | Motor de búsqueda AI — Reddit, X, YouTube, TikTok, HN, Polymarket, GitHub en paralelo | [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) MIT |
| **notebooklm** | API completa de Google NotebookLM — notebooks, fuentes, podcasts, videos | [teng-lin/notebooklm-py](https://github.com/teng-lin/notebooklm-py) |

### ⚡ Electrónica & PCB

| Skill | Descripción | Fuente |
|-------|-------------|--------|
| **bom** | Gestión de BOM — orquesta DigiKey, Mouser, LCSC, element14, JLCPCB, PCBWay, KiCad | Interna |
| **datasheets** | Extracción de specs de datasheets PDF — pinouts, características eléctricas | Interna |
| **digikey** | Búsqueda en DigiKey — fuente principal para prototipos | Interna |
| **element14** | Búsqueda en Newark/Farnell/element14 — API unificada US/UK/EU/APAC | Interna |
| **emc** | Análisis EMC pre-compliance — 18 categorías, 44 reglas, CISPR/FCC/MIL-STD | Interna |
| **jlcpcb** | Fabricación y ensamblaje JLCPCB — BOM/CPL, partes básicas/extendidas | Interna |
| **kicad** | Análisis de proyectos KiCad — schematics, PCB, DRC/ERC, BOM, power trees | Interna |
| **kidoc** | Documentación de ingeniería desde KiCad — HDD, CE, ICD, design reviews | Interna |
| **lcsc** | Búsqueda en LCSC — API gratuita jlcsearch, sin auth, biblioteca JLCPCB | Interna |
| **mouser** | Búsqueda en Mouser — fuente secundaria para prototipos | Interna |
| **pcbway** | Fabricación y ensamblaje PCBWay — turnkey/consignado, alternativa a JLCPCB | Interna |
| **spice** | Simulaciones SPICE automáticas — filtros, dividers, opamps, cristales | Interna |

### 🛠️ Desarrollo & Código

| Skill | Descripción | Fuente |
|-------|-------------|--------|
| **api-design-principles** | Principios de diseño REST y GraphQL — APIs intuitivas y escalables | Interna |
| **changelog-automation** | Generación automática de changelogs desde commits, PRs y releases | Interna |
| **codegraph** | Inteligencia semántica de código — tree-sitter, SQLite, knowledge graph para agents | [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph) MIT |
| **find-skills** | Descubrir e instalar skills del ecosistema via `npx skills` | Interna |
| **karpathy-guidelines** | 4 principios de Andrej Karpathy — pensar antes, simplicidad, cambios quirúrgicos, meta-clara | [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) MIT |
| **postgresql** | Diseño de schemas PostgreSQL — tipos, índices, constraints, rendimiento | Interna |
| **spec-kit** | Spec-Driven Development by GitHub — specs ejecutables, planes, tareas para 30+ agents | [github/spec-kit](https://github.com/github/spec-kit) MIT |
| **superpowers** | Metodología completa de desarrollo — 14 skills composables, TDD, subagents, workflow | [obra/superpowers](https://github.com/obra/superpowers) MIT |
| **systematic-debugging** | Debug sistemático — proceso de 4 fases para bugs y fallos | Interna |

### 🎨 Diseño & Visual

| Skill | Descripción | Fuente |
|-------|-------------|--------|
| **floor-plan-generator** | Generar planos con solver de IA y dimensiones de habitaciones | [z-aqib/Floor-Plan-Generator](https://github.com/z-aqib/Floor-Plan-Generator-Using-AI) |
| **frontend-design** | Diseño frontend — UIs web hermosas, responsive, componentes, accesibilidad | [anthropics/skills](https://github.com/anthropics/skills) Apache-2.0 |
| **visual-design-foundations** | Tipografía, teoría del color, espaciado e iconografía para diseños cohesivos | Interna |

### 🧠 Agentes & Productividad

| Skill | Descripción | Fuente |
|-------|-------------|--------|
| **claude-mem** | Memoria persistente para Claude — captura observaciones, resume, inyecta contexto | [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) Apache-2.0 |
| **claude-plugins** | Directorio oficial de plugins Anthropic — gestión, modernización, seguridad, integraciones | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) Apache-2.0 |
| **obsidian-skills** | 5 skills para Obsidian — markdown, bases, canvas, CLI, extracción web | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) MIT |
| **professor-synapse** | Invocar y orquestar agentes expertos para tareas de dominio específico | Interna |
| **ponytail** | Solución más simple que funciona — YAGNI, stdlib primero, una línea antes de cincuenta | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) MIT |
| **ponytail-audit** | Auditoría completa de repo por over-engineering — qué borrar, simplificar | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) MIT |
| **ponytail-debt** | Ledger de deuda pendiente — recoge comentarios `ponytail:` en deuda | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) MIT |
| **ponytail-gain** | Impacto medido de ponytail — scoreboard compacto de ahorro | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) MIT |
| **ponytail-help** | Tarjeta de referencia rápida de todos los modos y comandos ponytail | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) MIT |
| **ponytail-review** | Revisión de código enfocada en over-engineering — qué eliminar, deps innecesarias | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) MIT |
| **rtk** | Proxy CLI que reduce consumo de tokens LLM en 60-90% | [rtk-ai/rtk](https://github.com/rtk-ai/rtk) ⭐67k Apache-2.0 |
| **skillspector** | Scanner de seguridad para skills — 68 patrones, 17 categorías, análisis LLM opcional | [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector) Apache-2.0 |

### 📝 Escritura & Academia

| Skill | Descripción | Fuente |
|-------|-------------|--------|
| **thesis-writing** | Escritura de tesis — scope, outline, draft, review, 5 modos, undergraduate-doctoral | [santifs/thesis-writing-skill](https://github.com/santifs/thesis-writing-skill) MIT |

### 🔧 Ingeniería

| Skill | Descripción | Fuente |
|-------|-------------|--------|
| **ingenieria-electromecanica** | Asistente de ingeniería mecánica-eléctrica, CAD, circuitos y simulación | Interna |
