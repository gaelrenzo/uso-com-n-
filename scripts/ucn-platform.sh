# ==============================================================================
# DETECTOR DE PLATAFORMA - UCN (Mochila Digital)
# ==============================================================================
# Detecta automaticamente: Termux/Android, Linux, Windows (Git Bash/MSYS), macOS
# Exporta variables de entorno para uso por todos los scripts.
# Uso: source scripts/ucn-platform.sh
# ==============================================================================

# --- Detectar plataforma ---
# Termux se detecta por TERMUX_VERSION o por la raiz de instalacion de Termux
# (esto cubre tambien bash corriendo dentro de proot-distro Ubuntu/Debian).
if [ -n "${TERMUX_VERSION:-}" ] || [ -d "/data/data/com.termux/files/usr" ]; then
  UCN_PLATFORM="termux"
elif [ -f "/proc/sys/fs/binfmt_misc/WSLInterop" ] 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ]; then
  UCN_PLATFORM="wsl"
elif [ "$(uname -s 2>/dev/null)" = "Darwin" ]; then
  UCN_PLATFORM="macos"
elif [ -n "${MSYSTEM:-}" ] || [ -n "${MINGW_PREFIX:-}" ]; then
  UCN_PLATFORM="windows"
elif [ "$(uname -o 2>/dev/null)" = "Msys" ]; then
  UCN_PLATFORM="windows"
elif [ "$(uname -s 2>/dev/null)" = "Linux" ]; then
  UCN_PLATFORM="linux"
else
  UCN_PLATFORM="linux"
fi

# --- Raiz del repo (se asume que este script esta en scripts/) ---
UCN_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Directorio base de datos del usuario ---
case "$UCN_PLATFORM" in
  termux)
    # En Termux: usar sdcard. Probar varios puntos de montaje comunes.
    for cand in \
      "/storage/emulated/0/universida-datos" \
      "/storage/0000-0000/universida-datos" \
      "/mnt/sdcard/universida-datos" \
      "/data/media/0/universida-datos" \
      "$HOME/universida-datos"; do
      if [ -d "$cand" ]; then
        UCN_DATA_DIR="$cand"
        break
      fi
    done
    UCN_DATA_DIR="${UCN_DATA_DIR:-$HOME/universida-datos}"
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

# --- Perfil activo (informacion de especialidad) ---
UCN_PROFILE="${UCN_PROFILE:-}"
if [ -z "$UCN_PROFILE" ] && [ -f "$UCN_REPO_DIR/config/.current-profile" ]; then
  UCN_PROFILE="$(tr -d '[:space:]' < "$UCN_REPO_DIR/config/.current-profile")"
fi
UCN_PROFILE="${UCN_PROFILE:-default}"

# --- Exportar todo ---
export UCN_PLATFORM
export UCN_REPO_DIR
export UCN_DATA_DIR
export UCN_NOTES_DIR
export UCN_CLASE_DIR
export UCN_INFORMES_DIR
export UCN_CURSOS_DIR
export UCN_LABS_DIR
export UCN_PROFILE