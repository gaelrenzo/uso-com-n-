#!/bin/bash
# Instalacion completa: paquetes base + Ubuntu + Debian + librerias + UCN
# Ejecutar en Termux normal (NO como root)

echo "=== Instalacion completa UCN ==="

# --- Detectar plataforma ---
if [ -n "${TERMUX_VERSION:-}" ]; then
  PLATFORM="termux"
else
  PLATFORM="linux"
fi
echo "   Plataforma: $PLATFORM"

# --- Directorio del repo ---
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ "$PLATFORM" = "termux" ]; then
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
else
  echo "[1/5] Omitido (solo paquetes base en Termux)"
  echo "[2/5] Omitido (proot solo en Termux)"
  echo "[3/5] Agentes IA..."
  npm install -g @openai/codex || true
  npm install -g opencode-ai || true
  pip install aider-chat || true
  echo "[4/5] Librerias Python..."
  pip install numpy scipy pandas matplotlib sympy jupyterlab || true
  pip install pint control slycot CoolProp fluids ht || true
fi

# 5. Instalar UCN
echo "[5/5] Instalando UCN..."
cd "$SCRIPT_DIR"
if [ -d ".git" ]; then
  git pull
fi
bash install.sh

echo ""
echo "=== Instalacion completada ==="
echo "Ejecuta: source ~/.bashrc"