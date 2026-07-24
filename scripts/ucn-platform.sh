# ==============================================================================
# DETECTOR DE PLATAFORMA - UCN (Mochila Digital)
# ==============================================================================
# Detecta automaticamente: Termux/Android, Linux, Windows (Git Bash/MSYS), macOS
# Exporta variables de entorno para uso por todos los scripts.
# Uso: source scripts/ucn-platform.sh
# ==============================================================================

# --- Detectar plataforma ---
if [ -n "$TERMUX_VERSION" ]; then
  UCN_PLATFORM="termux"
elif [ -f "/proc/sys/fs/binfmt_misc/WSLInterop" ] 2>/dev/null || [ -n "$WSL_DISTRO_NAME" ]; then
  UCN_PLATFORM="wsl"
elif [ "$(uname -s 2>/dev/null)" = "Linux" ]; then
  UCN_PLATFORM="linux"
elif [ "$(uname -s 2>/dev/null)" = "Darwin" ]; then
  UCN_PLATFORM="macos"
elif [ -n "$MSYSTEM" ] || [ -n "$MINGW_PREFIX" ]; then
  UCN_PLATFORM="windows"
elif [ "$(uname -o 2>/dev/null)" = "Msys" ]; then
  UCN_PLATFORM="windows"
else
  UCN_PLATFORM="linux"
fi

# --- Raiz del repo (se asume que este script esta en scripts/) ---
UCN_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Directorio base de datos del usuario ---
case "$UCN_PLATFORM" in
  termux)
    # En Termux: usar sdcard
    if [ -d "/storage/emulated/0/universida-datos" ]; then
      UCN_DATA_DIR="/storage/emulated/0/universida-datos"
    elif [ -d "/mnt/sdcard/universida-datos" ]; then
      UCN_DATA_DIR="/mnt/sdcard/universida-datos"
    else
      UCN_DATA_DIR="$HOME/universida-datos"
    fi
    ;;
  windows)
    # En Windows: USERPROFILE/universida-datos
    if [ -n "$USERPROFILE" ]; then
      UCN_DATA_DIR="$USERPROFILE/universida-datos"
    else
      UCN_DATA_DIR="$HOME/universida-datos"
    fi
    ;;
  *)
    # Linux/macOS: HOME/universida-datos
    UCN_DATA_DIR="$HOME/universida-datos"
    ;;
esac

# --- Rutas derivadas ---
UCN_NOTES_DIR="${UCN_NOTES_DIR:-$UCN_DATA_DIR/notas}"
UCN_CLASE_DIR="${UCN_CLASE_DIR:-$UCN_DATA_DIR}"
UCN_INFORMES_DIR="${UCN_INFORMES_DIR:-$UCN_DATA_DIR/informes}"
UCN_CURSOS_DIR="${UCN_CURSOS_DIR:-$UCN_DATA_DIR/cursos}"
UCN_LABS_DIR="${UCN_LABS_DIR:-$UCN_DATA_DIR/laboratorios}"

# --- Exportar todo ---
export UCN_PLATFORM
export UCN_REPO_DIR
export UCN_DATA_DIR
export UCN_NOTES_DIR
export UCN_CLASE_DIR
export UCN_INFORMES_DIR
export UCN_CURSOS_DIR
export UCN_LABS_DIR