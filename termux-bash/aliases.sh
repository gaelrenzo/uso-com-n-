# shellcheck shell=bash
# ==========================================
# ALIASES GENERALES
# ==========================================

alias update="apt update && apt upgrade -y"
alias cls="clear && source ~/.bashrc"
alias ll="ls -la"
alias weather="curl wttr.in/Puno"
alias sysinfo="fastfetch"
alias editui="nano ~/.bashrc"

# ==========================================
# ALIASES UCN (Mochila Digital)
# ==========================================

# UCN_DIR se resuelve dinamicamente desde ucn-platform.sh
# Si no existe, usar fallback
if [ -z "$UCN_REPO_DIR" ]; then
  SCRIPT_DIR_AUX="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  UCN_REPO_DIR="$(cd "$SCRIPT_DIR_AUX/.." && pwd)"
fi

# Comillas simples: las variables se evaluan al usar el alias (soporta espacios)
alias ucn-logs='tail -f "$UCN_REPO_DIR/ucn/ucn.log" 2>/dev/null || echo "No logs"'
alias ucn-debian="bash ~/.shortcuts/start-debian-xfce.sh"
alias ucn-install-debian='bash "$UCN_REPO_DIR/scripts/install-debian-xfce.sh"'
alias ucn-arch="bash ~/.shortcuts/start-arch-xfce.sh"
alias ucn-install-arch='bash "$UCN_REPO_DIR/scripts/install-arch-xfce.sh"'

# ==========================================
# ALIASES DE PRODUCTIVIDAD
# ==========================================

# Usar UCN_DATA_DIR si existe, si no fallback dinamico
if [ -n "$UCN_DATA_DIR" ]; then
  _DATA="$UCN_DATA_DIR"
else
  _DATA="$HOME/universida-datos"
fi

# Crea la carpeta si falta, entra y lista
_ucn_go() { mkdir -p -- "$1" && cd -- "$1" && ls -la; }
alias notas='_ucn_go "${UCN_NOTES_DIR:-$_DATA/notas}"'
alias informes='_ucn_go "${UCN_INFORMES_DIR:-$_DATA/informes}"'
alias cursos='_ucn_go "${UCN_CURSOS_DIR:-$_DATA/cursos}"'
alias labs='_ucn_go "${UCN_LABS_DIR:-$_DATA/laboratorios}"'
alias uni='cd "$_DATA"'
alias workspace='cd "$UCN_REPO_DIR"'
alias repos='cd "$HOME/workspace" 2>/dev/null && ls -d */'