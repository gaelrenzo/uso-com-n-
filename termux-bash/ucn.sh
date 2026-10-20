# shellcheck shell=bash
# Cargar los comandos UCN en la sesión actual: source termux-bash/ucn.sh
_UCN_TERMUX_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$_UCN_TERMUX_DIR/termux-bash.sh"
unset _UCN_TERMUX_DIR
