#!/bin/bash
# Instalacion completa: paquetes base + Ubuntu + librerias + UCN
# Ejecutar en Termux recien instalado

set -e

echo "=== Instalacion completa UCN ==="

# 1. Paquetes base Termux
echo "[1/5] Paquetes base Termux..."
pkg update && pkg upgrade -y
pkg install -y \
  git gh curl wget nano vim neovim \
  openssh rsync rclone tmux tree jq ripgrep fd \
  python python-pip nodejs-lts clang make cmake \
  golang rust termux-api proot-distro

# 2. Ubuntu proot
echo "[2/5] Ubuntu via proot-distro..."
proot-distro install ubuntu || true

# 3. Herramientas IA
echo "[3/5] Agentes IA..."
npm install -g @openai/codex 2>/dev/null || true
npm install -g opencode-ai 2>/dev/null || true
pip install aider-chat 2>/dev/null || true

# 4. Librerias Python
echo "[4/5] Librerias Python..."
pip install numpy scipy pandas matplotlib sympy jupyterlab 2>/dev/null || true
pip install pint control slycot CoolProp fluids ht 2>/dev/null || true

# 5. Clonar e instalar UCN
echo "[5/5] Instalando UCN..."
if [ ! -d ~/workspace/uso-com-n- ]; then
  mkdir -p ~/workspace
  git clone https://github.com/gaelrenzo/uso-com-n-.git ~/workspace/uso-com-n-
fi
cd ~/workspace/uso-com-n-
bash install.sh
source ~/.bashrc

echo ""
echo "Instalacion completada."
echo "Ejecuta: source ~/.bashrc"
echo "Luego:   proot-distro login ubuntu"
echo "Para actualizar: ucn sync"
