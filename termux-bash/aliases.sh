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

# Los comandos ucn-note, ucn-clase, ucn-informe, ucn-update, ucn-install-all,
# skills-sync, skills-push y html-* estan definidos como FUNCIONES en
# functions.sh (mismo comportamiento en todos los dispositivos).
# Aqui solo se definen los aliases SIN equivalente en functions.sh.

alias ucn-logs="tail -f $UCN_REPO_DIR/ucn/ucn.log 2>/dev/null || echo 'No logs'"
alias ucn-debian="bash ~/.shortcuts/start-debian-xfce.sh"
alias ucn-install-debian="bash $UCN_REPO_DIR/scripts/install-debian-xfce.sh"
alias ucn-arch="bash ~/.shortcuts/start-arch-xfce.sh"
alias ucn-install-arch="bash $UCN_REPO_DIR/scripts/install-arch-xfce.sh"

# ==========================================
# ALIASES DE PRODUCTIVIDAD
# ==========================================

# Usar UCN_DATA_DIR si existe, si no fallback dinamico
if [ -n "$UCN_DATA_DIR" ]; then
  _DATA="$UCN_DATA_DIR"
else
  _DATA="$HOME/universida-datos"
fi

alias notas="cd ${UCN_NOTES_DIR:-$_DATA/notas} 2>/dev/null || mkdir -p ${UCN_NOTES_DIR:-$_DATA/notas} && cd ${UCN_NOTES_DIR:-$_DATA/notas} && ls -la"
alias informes="cd ${UCN_INFORMES_DIR:-$_DATA/informes} 2>/dev/null || mkdir -p ${UCN_INFORMES_DIR:-$_DATA/informes} && cd ${UCN_INFORMES_DIR:-$_DATA/informes} && ls -la"
alias cursos="cd ${UCN_CURSOS_DIR:-$_DATA/cursos} 2>/dev/null || mkdir -p ${UCN_CURSOS_DIR:-$_DATA/cursos} && cd ${UCN_CURSOS_DIR:-$_DATA/cursos} && ls -la"
alias labs="cd ${UCN_LABS_DIR:-$_DATA/laboratorios} 2>/dev/null || mkdir -p ${UCN_LABS_DIR:-$_DATA/laboratorios} && cd ${UCN_LABS_DIR:-$_DATA/laboratorios} && ls -la"
alias uni="cd $_DATA"
alias workspace="cd $HOME/workspace 2>/dev/null || mkdir -p $HOME/workspace && cd $HOME/workspace"
alias repos="cd $HOME/workspace 2>/dev/null && ls -d */"