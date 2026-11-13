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
if [ -z "${UCN_REPO_DIR:-}" ]; then
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
alias l="ls -CF"
alias la="ls -A"
alias ports="ss -tulanp"
alias ipinfo="curl -s ipinfo.io"
alias repos='cd "$HOME/workspace" 2>/dev/null && ls -d */'
# ==========================================
# TERMINAL MODERNA (solo si estan instaladas)
# Termux: pkg install starship eza bat zoxide fzf
# ==========================================

if command -v eza >/dev/null 2>&1; then
  alias ll="eza -l --icons --git --group-directories-first"
  alias l="eza --icons --group-directories-first"
  alias la="eza -la --icons --git --group-directories-first"
  alias lt="eza --tree --level=2 --icons"
fi
# Debian/Ubuntu instala bat como batcat
command -v batcat >/dev/null 2>&1 && ! command -v bat >/dev/null 2>&1 && alias bat="batcat"
export BAT_THEME="ansi"
[ -f "$UCN_REPO_DIR/config/starship.toml" ] && export STARSHIP_CONFIG="$UCN_REPO_DIR/config/starship.toml"
if [[ $- == *i* ]]; then
  command -v starship >/dev/null 2>&1 && eval "$(starship init bash)"
  command -v zoxide >/dev/null 2>&1 && eval "$(zoxide init bash)"
  command -v fzf >/dev/null 2>&1 && eval "$(fzf --bash 2>/dev/null)"
fi
# Instala herramientas + tema Catppuccin + Nerd Font (Termux nativo o proot Ubuntu)
ucn-install-terminal() {
  if command -v pkg >/dev/null 2>&1; then
    pkg install -y starship eza bat zoxide fzf unzip
  else
    apt update && apt install -y eza bat zoxide fzf unzip curl
    command -v starship >/dev/null 2>&1 || curl -sS https://starship.rs/install.sh | sh -s -- -y
  fi
  local tdir="${TERMUX_HOME:-/data/data/com.termux/files/home}/.termux"
  [ -d "$(dirname "$tdir")" ] || { echo "Sin acceso a ~/.termux: colores/fuente omitidos"; return 0; }
  mkdir -p "$tdir"
  cp "$UCN_REPO_DIR/config/termux/colors.properties" "$tdir/colors.properties"
  if [ ! -f "$tdir/font.ttf" ]; then
    local tmp; tmp="$(mktemp -d)"
    curl -fsSL -o "$tmp/f.zip" https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip       && unzip -oj "$tmp/f.zip" JetBrainsMonoNerdFontMono-Regular.ttf -d "$tmp"       && mv "$tmp/JetBrainsMonoNerdFontMono-Regular.ttf" "$tdir/font.ttf"
    rm -rf "$tmp"
  fi
  command -v termux-reload-settings >/dev/null 2>&1 && termux-reload-settings
  echo "Listo. Si no ves cambios, cierra y abre Termux."
}
