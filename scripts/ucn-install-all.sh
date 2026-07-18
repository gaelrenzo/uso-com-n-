#!/data/data/com.termux/files/usr/bin/bash
# Instalacion completa: paquetes base + Ubuntu + Debian + librerias + UCN
# Ejecutar en Termux normal (NO como root)

echo "=== Instalacion completa UCN ==="

# 1. Paquetes base Termux
echo "[1/5] Paquetes base Termux..."
pkg update -y
pkg upgrade -y
pkg install -y \
  git gh curl wget nano vim neovim \
  openssh rsync rclone tmux tree jq ripgrep fd \
  python python-pip nodejs-lts clang make cmake \
  golang rust termux-api proot-distro pulseaudio \
  x11-repo termux-x11-nightly

# 2. Ubuntu proot
echo "[2/5] Ubuntu via proot-distro..."
if proot-distro list 2>/dev/null | grep -q ubuntu; then
  echo "  Ubuntu ya instalado, saltando..."
else
  proot-distro install ubuntu
fi

# 2b. Debian proot
echo "[2b/5] Debian via proot-distro..."
if proot-distro list 2>/dev/null | grep -q debian; then
  echo "  Debian ya instalado, saltando..."
else
  proot-distro install debian
fi

# 3. Herramientas IA
echo "[3/5] Agentes IA..."
npm install -g @openai/codex || true
npm install -g opencode-ai || true
pip install aider-chat || true

# 4. Librerias Python
echo "[4/5] Librerias Python..."
pip install numpy scipy pandas matplotlib sympy jupyterlab || true
pip install pint control slycot CoolProp fluids ht || true

# 5. Clonar e instalar UCN
echo "[5/5] Instalando UCN..."
REPO_DIR="/storage/emulated/0/universida-datos/uso-com-n-"
if [ -d "$REPO_DIR/.git" ]; then
  cd "$REPO_DIR"
  git pull
else
  git clone https://github.com/gaelrenzo/uso-com-n-.git "$REPO_DIR"
  cd "$REPO_DIR"
fi
bash install.sh

echo ""
echo "=== Instalacion completada ==="
echo "Ejecuta: source ~/.bashrc"
echo "Para debian: bash ~/.shortcuts/start-debian-xfce.sh"
