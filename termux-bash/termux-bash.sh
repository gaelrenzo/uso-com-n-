# shellcheck shell=bash
# ==========================================
# TERMUX BASH - PUNTO DE ENTRADA PRINCIPAL
# Sincronizado via GitHub entre dispositivos
# ==========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detectar plataforma primero (si existe)
UCN_PLATFORM_SH="$SCRIPT_DIR/../scripts/ucn-platform.sh"
if [ -f "$UCN_PLATFORM_SH" ]; then
  source "$UCN_PLATFORM_SH"
elif [ -f "$SCRIPT_DIR/../scripts/ucn-platform.sh" ]; then
  source "$SCRIPT_DIR/../scripts/ucn-platform.sh"
fi

source "$SCRIPT_DIR/aliases.sh"
source "$SCRIPT_DIR/ia-tools.sh"
source "$SCRIPT_DIR/functions.sh"
# En el celular el panel completo no cabe: compacto por defecto (UCN_MOTD_COMPACT=0 lo desactiva)
[ "$UCN_PLATFORM" = termux ] && : "${UCN_MOTD_COMPACT:=1}"
source "$SCRIPT_DIR/motd.sh"