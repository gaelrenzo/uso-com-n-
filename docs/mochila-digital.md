# Mochila Digital UCN

Entorno portable de productividad academica y tecnica para Android (Termux), Linux y Windows.

---

## Apps F-Droid recomendadas

| App | Uso |
|-----|-----|
| **Termux** | Terminal principal Android. Instalar desde F-Droid, no Play Store |
| **Termux:API** | Usar sensores, bateria, portapapeles, notificaciones |
| **Termux:Widget** | Botones rapidos para scripts UCN |
| **Material Files** | Explorador de archivos limpio |
| **Aegis Authenticator** | 2FA para GitHub, Google, Supabase |
| **K-9 Mail** | Correo ligero |
| **Syncthing-Fork** | Sincronizar carpetas Android-Laptop sin nube |
| **Markor** | Notas Markdown para clases/informes |
| **AntennaPod** | Podcasts/cursos |
| **Fennec F-Droid** | Navegador Firefox libre |
| **NewPipe** | Videos/clases sin app oficial |

---

## Instalacion base en Termux

```bash
pkg update && pkg upgrade -y

pkg install -y \
  git gh curl wget nano vim neovim \
  openssh rsync rclone tmux tree jq ripgrep fd \
  python python-pip nodejs-lts clang make cmake \
  golang rust termux-api proot-distro
```

---

## Ubuntu dentro de Termux

```bash
pkg install proot-distro -y
proot-distro install ubuntu
proot-distro login ubuntu
```

Dentro de Ubuntu:

```bash
apt update && apt upgrade -y

apt install -y \
  git curl wget build-essential cmake pkg-config \
  python3 python3-pip python3-venv \
  nodejs npm golang rustc cargo \
  neovim tmux ripgrep fd-find jq tree \
  openssh-client rsync rclone
```

---

## Librerias utiles para universidad/trabajo

### Python tecnico

```bash
pip install numpy scipy pandas matplotlib sympy jupyterlab
```

### Para ingenieria

```bash
pip install pint control slycot CoolProp fluids ht
```

| Libreria | Uso |
|----------|-----|
| **sympy** | Algebra, Laplace, matrices |
| **control** | Sistemas de control |
| **CoolProp** | Termodinamica |
| **pandas** | Tablas de laboratorio |
| **matplotlib** | Graficas para informes |

---

## IA y agentes

```bash
npm install -g @openai/codex
npm install -g opencode-ai
pip install aider-chat
```

---

## Clonar e instalar UCN

```bash
git clone https://github.com/gaelrenzo/uso-com-n-.git ~/workspace/uso-com-n-
cd ~/workspace/uso-com-n-
bash install.sh
source ~/.bashrc
```

---

## Estructura final recomendada

```
UCN/
├── termux-bash/         # Configuracion de terminal (alias, funciones, MOTD)
├── laptop-powershell/   # Perfil PowerShell para Windows
├── ucn/                 # CLI en Go (sync, push, doctor, tunnel)
├── skills/
│   └── agent-skills/    # 42 skills para agentes IA
├── scripts/             # Scripts auxiliares (nota, clase, informe)
├── config/              # Configuracion local (.env, config.yaml)
├── docs/                # Guias y documentacion
└── install.sh           # Instalador principal
```

---

## Flujo diario

```bash
ucn sync       # sincroniza skills
ucn doctor     # revisa entorno
ucn clase      # abre carpeta universidad

# Para informes:
ucn informe "compresor"

# Para subir avances:
ucn push "avance informe compresor"
```

La base es: **Termux + Ubuntu + GitHub + Rclone/Syncthing + skills IA + scripts UCN**.
