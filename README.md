# uso-com-n-

Guia web para usar Android como entorno de desarrollo con Termux, Ubuntu proot,
Node.js, GitHub y un servidor local con autorecarga.

## Uso rapido en Termux

Abre Termux y actualiza paquetes:

```bash
pkg update && pkg upgrade
pkg install git nodejs-lts openssh curl nano tmux
npm install -g live-server
```

Clona este repositorio:

```bash
mkdir -p ~/workspace
cd ~/workspace
git clone https://github.com/gaelrenzo/uso-com-n-.git
cd uso-com-n-
```

Inicia la pagina local:

```bash
live-server --host=127.0.0.1 --port=8080
```

Abre en el navegador de Android:

```text
http://127.0.0.1:8080
```

## Uso con Ubuntu en Termux

Si trabajas dentro de Ubuntu proot:

```bash
pkg install proot-distro
proot-distro install ubuntu
proot-distro login ubuntu
```

Dentro de Ubuntu:

```bash
apt update && apt upgrade -y
apt install -y git curl nano openssh-client nodejs npm
npm install -g live-server
```

Clona y ejecuta:

```bash
mkdir -p /root/Workspace
cd /root/Workspace
git clone https://github.com/gaelrenzo/uso-com-n-.git html
cd html
live-server --host=127.0.0.1 --port=8080
```

Luego abre:

```text
http://127.0.0.1:8080
```

## Editar el proyecto

Archivos principales:

```text
index.html        estructura de la pagina
css/style.css     estilos visuales
js/content.js     textos, listas y comandos fijos
js/app.js         formulario, render y botones de copiar
```

Editar desde terminal:

```bash
nano index.html
nano js/content.js
nano css/style.css
```

Mientras `live-server` este encendido, el navegador se recarga al guardar cambios.

## Guardar cambios en GitHub

Configura tu identidad:

```bash
git config --global user.name "ENZO"
git config --global user.email "renzomamanigalindo@gmail.com"
git config --global init.defaultBranch main
```

Flujo diario:

```bash
git pull
git status
git add .
git commit -m "avance"
git push
```

## Usar SSH con GitHub

Crea una clave:

```bash
ssh-keygen -t ed25519 -C "renzomamanigalindo@gmail.com"
cat ~/.ssh/id_ed25519.pub
```

Copia la clave publica completa y agregala en:

```text
GitHub > Settings > SSH and GPG keys > New SSH key
```

Verifica:

```bash
ssh -T git@github.com
```

Si GitHub responde con autenticacion correcta, puedes cambiar el remoto a SSH:

```bash
git remote set-url origin git@github.com:gaelrenzo/uso-com-n-.git
git remote -v
```

## Compartir la pagina con una URL publica

Primero deja corriendo el servidor:

```bash
live-server --host=127.0.0.1 --port=8080
```

En otra sesion de Termux o tmux:

```bash
ssh -R 80:localhost:8080 nokey@localhost.run
```

`localhost.run` mostrara una URL publica HTTPS. La URL funciona mientras esa
terminal siga abierta.

## Consejos para Termux

Mantener sesiones largas:

```bash
termux-wake-lock
tmux
```

Crear una nueva ventana en tmux:

```text
Ctrl+b c
```

Cambiar de ventana:

```text
Ctrl+b n
```

Salir de Ubuntu proot:

```bash
exit
```

Liberar wake lock:

```bash
termux-wake-unlock
```

## Instalación automática del entorno (dotfiles)

`install.sh` inyecta aliases, configuración de herramientas IA y un MOTD personalizado en `~/.bashrc` para entornos Termux/Ubuntu.

```bash
git clone https://github.com/gaelrenzo/uso-com-n- ~/mis-dotfiles
chmod +x ~/mis-dotfiles/install.sh
~/mis-dotfiles/install.sh
source ~/.bashrc
```

Incluye:
- **Alias:** `update`, `cls`, `ll`, `uni`, `weather` (Puno), `sysinfo`, `editui`
- **IA tools:** `codex`/`codex-full`, `anti`/`anti-full`, `cl`/`cl-full`, `ocode`/`ocode-full`
- **MOTD:** fecha, hora, directorio, memoria, comandos rápidos y frase del día
- **Anti-duplicado:** verifica si ya está instalado antes de escribir

## Skills sincronizadas (Agentes IA y Terminal)

Las skills de terminal y de agentes IA viven en `skills/` y se sincronizan entre todos tus dispositivos (celular, tablet, laptop) a través de GitHub.

### Estructura de Carpetas

```text
skills/
├── agent-skills/          # Todas las skills compartidas de agentes IA (api-design-principles, bom, etc.)
│   ├── api-design-principles/
│   ├── bom/
│   ├── changelog-automation/
│   └── ... (21 skills en total)
├── agents/                # Configuraciones y reglas específicas de cada agente
│   ├── agy/               # Antigravity config
│   ├── claude/            # Reglas de Claude Code
│   ├── codex/             # Reglas de Codex
│   └── opencode/          # Reglas/skills de OpenCode
├── aliases.sh             # Alias generales de bash
├── functions.sh           # Funciones personalizadas (html-serve, skills-sync, etc.)
├── ia-tools.sh            # Alias para herramientas IA
├── motd.sh                # Mensaje de bienvenida (MOTD)
├── skills.sh              # Entrypoint de bash (sourcea aliases, functions, etc.)
├── sync-agent-skills.sh   # Sincronizador para Linux/Termux/Ubuntu (Symlinks)
└── sync-agent-skills.ps1  # Sincronizador para Windows/Laptop (Junctions)
```

### Funcionamiento de la Sincronización

Para lograr que cada agente tenga las mismas skills en todos los dispositivos de manera automatizada:
1. **Windows (Laptop):** `sync-agent-skills.ps1` crea *Junctions* (uniones de directorios) desde `skills/agent-skills/` a las carpetas correspondientes de tus agentes instalados (Claude, Codex, Antigravity, OpenCode, Cursor, Copilot, etc.). No requiere permisos de administrador.
2. **Linux/Termux/Ubuntu (Celular, Tablet):** `sync-agent-skills.sh` crea *Symlinks* (enlaces simbólicos) equivalentes.

**Ventaja:** Al usar symlinks/junctions, cualquier cambio que un agente haga a una skill (o que tú hagas editando los archivos en el repo) se refleja al instante en todas partes en ese dispositivo sin necesidad de copiar archivos manualmente.

### Comandos Rápidos de Terminal

Hemos añadido funciones de automatización para simplificar tu flujo diario:

- **`skills-sync`**: Actualiza el repositorio local desde GitHub (`git pull --rebase`), instala las configuraciones de agentes y sincroniza todos los enlaces simbólicos de skills de agentes de forma automática.
- **`skills-push "[mensaje]"`**: Sube todos tus cambios de skills locales en `agent-skills/` a GitHub con un solo comando.

### Flujo de Trabajo Sincronizado

```bash
# 1. En cualquier dispositivo (después de modificar o crear skills)
skills-push "agregada skill de ingenieria electromecanica"

# 2. En tus otros dispositivos (para recibir los cambios y aplicarlos)
skills-sync
```


## Resumen

1. Abre Termux.
2. Entra al repo con `cd ~/workspace/uso-com-n-` o `cd /root/Workspace/html`.
3. Ejecuta `live-server --host=127.0.0.1 --port=8080`.
4. Abre `http://127.0.0.1:8080`.
5. Edita archivos y guarda cambios.
6. Publica con `git add . && git commit -m "avance" && git push`.

## Dotfiles

El archivo [install.sh](install.sh) funciona como dotfiles auto-instalables para configurar el entorno de trabajo en segundos.
