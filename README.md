# uso-com-n- (UCN)
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
│   └── agent-skills/      # Biblioteca de skills compartidas (api-design-principles, postgresql, etc.)
│       ├── freedomain/    # [NEW] Dominios gratuitos - DigitalPlat FreeDomain
│       └── rtk/           # [NEW] Reductor de tokens LLM - rtk-ai/rtk
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

## 📦 Skills Instaladas (Extraídas de)

| Skill | Repositorio Fuente | Licencia | Descripción |
|-------|-------------------|----------|-------------|
| **freedomain** | [DigitalPlatDev/FreeDomain](https://github.com/DigitalPlatDev/FreeDomain) | AGPL-3.0 | Dominios gratuitos (.dpdns.org, .us.kg, .qzz.io, .xx.kg, .qd.je) |
| **rtk** | [rtk-ai/rtk](https://github.com/rtk-ai/rtk) | Apache-2.0 | Proxy CLI que reduce consumo de tokens LLM en 60-90% |

### Freedomain
- **Qué hace**: Permite registrar dominios gratuitos para proyectos web
- **Dashboard**: https://dash.domain.digitalplat.org/
- **Autor**: Edward Hsing (DigitalPlat Foundation)
- **Stars**: 181k+

### RTK (Rust Token Killer)
- **Qué hace**: Filtra y comprime salidas de comandos antes de llegar al contexto del LLM
- **Ahorro**: ~80% de tokens en sesiones de desarrollo
- **Instalación**: `brew install rtk` o `curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh`
- **Sitio web**: https://www.rtk-ai.app
- **Stars**: 67.1k+

> **Nota**: Estas skills se sincronizan automáticamente mediante `ucn sync` y están disponibles para todos los agentes de IA configurados (OpenCode, Claude, Codex, etc.).
