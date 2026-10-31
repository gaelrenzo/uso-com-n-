#!/bin/bash
# ==============================================================================
# Instalador Principal UCN - Multi-plataforma
# Funciona en: Termux/Android, Linux, macOS, Windows (Git Bash)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASH_DIR="$SCRIPT_DIR/termux-bash"

echo "🚀 Instalando UCN - Mochila Digital..."

# --- Detectar plataforma ---
if [ -n "${TERMUX_VERSION:-}" ]; then
  PLATFORM="termux"
elif [ -f "/proc/sys/fs/binfmt_misc/WSLInterop" ] 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ]; then
  PLATFORM="wsl"
elif [ "$(uname -s 2>/dev/null)" = "Darwin" ]; then
  PLATFORM="macos"
elif [ -n "${MSYSTEM:-}" ] || [ -n "${MINGW_PREFIX:-}" ]; then
  PLATFORM="windows"
else
  PLATFORM="linux"
fi
echo "   Plataforma detectada: $PLATFORM"

# --- Configurar .bashrc ---
if [ -f ~/.bashrc ]; then
  if grep -q "skills/skills.sh" ~/.bashrc 2>/dev/null; then
    echo "🔄 Actualizando ruta antigua en ~/.bashrc..."
    # sed -i no es portable (BSD/macOS exige otra sintaxis)
    bashrc_tmp="$(mktemp)"
    sed 's|skills/skills.sh|termux-bash/termux-bash.sh|g' ~/.bashrc > "$bashrc_tmp"
    cat "$bashrc_tmp" > ~/.bashrc
    rm -f "$bashrc_tmp"
  fi

  if grep -q "termux-bash/termux-bash.sh" ~/.bashrc 2>/dev/null; then
    echo "⚠️  Configuracion ya instalada en ~/.bashrc"
  else
    {
      echo ""
      echo "# Configuracion UCN sincronizada via GitHub"
      echo "source \"$BASH_DIR/termux-bash.sh\""
    } >> ~/.bashrc
    echo "✅ Configuracion anadida a ~/.bashrc"
  fi
else
  {
    echo "# Configuracion UCN sincronizada via GitHub"
    echo "source \"$BASH_DIR/termux-bash.sh\""
  } >> ~/.bashrc
  echo "✅ Archivo .bashrc creado con configuracion UCN"
fi

# --- Crear directorio de datos si no existe ---
if [ "$PLATFORM" = "termux" ]; then
  DATA_DIR="${UCN_DATA_DIR:-/storage/emulated/0/universida-datos}"
else
  DATA_DIR="${UCN_DATA_DIR:-$HOME/universida-datos}"
fi
mkdir -p "$DATA_DIR/notas" "$DATA_DIR/informes" "$DATA_DIR/cursos" "$DATA_DIR/laboratorios" 2>/dev/null || true

# --- Hacer ejecutables los scripts ---
if [ -d "$SCRIPT_DIR/scripts" ]; then
  chmod +x "$SCRIPT_DIR/scripts/"*.sh 2>/dev/null || true
  echo "✅ Scripts listos en scripts/"
fi

# --- Crear config local si no existe ---
if [ ! -f "$SCRIPT_DIR/config/config.yaml" ] && [ -f "$SCRIPT_DIR/config/config.yaml.example" ]; then
  cp "$SCRIPT_DIR/config/config.yaml.example" "$SCRIPT_DIR/config/config.yaml"
  echo "✅ config/config.yaml creado desde plantilla"
  echo "   → Edita config/config.yaml con tu nombre y configuracion"
fi

if [ ! -f "$SCRIPT_DIR/config/.env" ] && [ -f "$SCRIPT_DIR/config/.env.example" ]; then
  cp "$SCRIPT_DIR/config/.env.example" "$SCRIPT_DIR/config/.env"
  echo "✅ config/.env creado desde plantilla"
  echo "   → Edita config/.env con tus tokens de API"
fi

# --- Instalar skills para agentes IA ---
if [ -f "$SCRIPT_DIR/install-agent-skills.sh" ]; then
  echo ""
  bash "$SCRIPT_DIR/install-agent-skills.sh"
fi

echo ""
echo "🎉 Todo listo. Ejecuta: source ~/.bashrc"
echo "   Plataforma: $PLATFORM"
echo "   Directorio datos: $DATA_DIR"
echo ""
echo "📚 Proximos pasos:"
echo "   1. Edita config/config.yaml con tu nombre"
echo "   2. Edita config/.env con tus tokens"
echo "   3. source ~/.bashrc"
echo ""
echo "📚 Documentacion:"
echo "   docs/mochila-digital.md                    - Guia completa"
echo "   docs/flujo-productividad-academica-tecnica.md - Flujo diario"