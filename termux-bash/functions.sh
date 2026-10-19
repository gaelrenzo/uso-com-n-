# ==========================================
# FUNCIONES PERSONALIZADAS
# ==========================================

# UCN_REPO_DIR se resuelve desde ucn-platform.sh
if [ -z "$UCN_REPO_DIR" ]; then
  SCRIPT_DIR_AUX="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  UCN_REPO_DIR="$(cd "$SCRIPT_DIR_AUX/.." && pwd)"
fi

# Directorio de datos del usuario
if [ -z "$UCN_DATA_DIR" ]; then
  UCN_DATA_DIR="$HOME/universida-datos"
fi

ucn-install-all() {
  bash "$UCN_REPO_DIR/scripts/ucn-install-all.sh"
}