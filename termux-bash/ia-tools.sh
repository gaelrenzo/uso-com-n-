# ==============================================================================
# HERRAMIENTAS IA Y CODIGO (multi-dispositivo)
# ------------------------------------------------------------------------------
# Todos los agentes se resuelven con el MISMO criterio en cualquier dispositivo:
#
#   1) Variables de entorno UCN_<AGENTE>_BIN (override explicito, ver config/.env)
#   2) command -v (binario en el PATH del dispositivo)
#   3) Rutas conocidas por plataforma (Termux/linux en primer plano)
#
# Si el agente no esta instalado, se muestra un mensaje de ayuda en vez de
# fallar con "command not found". Asi las personalizaciones SON IDENTICAS en
# la laptop (Windows/PowerShell, Git Bash), la tablet y el celular (Termux).
# ==============================================================================

# --- Resolutor generico: devuelve la ruta del binario o vacio si no existe ---
ucn_resolve() {
  local tool="$1"

  # 1) Override explicito via .env / variables de entorno
  local env_var="UCN_${tool^^}_BIN"
  if [ -n "${!env_var:-}" ] && [ -x "${!env_var}" ]; then
    printf '%s\n' "${!env_var}"
    return 0
  fi

  # 2) Normalmente el binario esta en el PATH.
  #    type -P busca SOLO ejecutables en PATH (ignora funciones/aliases).
  local in_path
  if in_path="$(type -P "$tool" 2>/dev/null)"; then
    printf '%s\n' "$in_path"
    return 0
  fi

  # 3) Rutas conocidas por plataforma (usadas si el PATH no lo tiene)
  case "$tool" in
    codex)
      for c in "$HOME/.codex/bin/codex" "$HOME/.local/bin/codex" /usr/local/bin/codex /usr/bin/codex /data/data/com.termux/files/usr/bin/codex; do
        [ -x "$c" ] && { printf '%s\n' "$c"; return 0; }
      done
      ;;
    claude)
      for c in "$HOME/.claude/local/claude" "$HOME/.local/bin/claude" /usr/local/bin/claude /usr/bin/claude /data/data/com.termux/files/usr/bin/claude; do
        [ -x "$c" ] && { printf '%s\n' "$c"; return 0; }
      done
      ;;
    opencode)
      for c in "$HOME/.opencode/bin/opencode" "$HOME/.local/bin/opencode" /usr/local/bin/opencode /usr/bin/opencode /data/data/com.termux/files/usr/bin/opencode; do
        [ -x "$c" ] && { printf '%s\n' "$c"; return 0; }
      done
      ;;
    hermes)
      for c in "$HOME/.local/bin/hermes" "$HOME/hermes-agent/.venv/bin/hermes" /usr/local/bin/hermes /usr/bin/hermes /data/data/com.termux/files/usr/bin/hermes /tmp/hermes-agent/.venv/bin/hermes; do
        [ -x "$c" ] && { printf '%s\n' "$c"; return 0; }
      done
      ;;
    agy)
      for c in "$HOME/.local/bin/agy" /usr/local/bin/agy /usr/bin/agy /data/data/com.termux/files/usr/bin/agy; do
        [ -x "$c" ] && { printf '%s\n' "$c"; return 0; }
      done
      ;;
  esac
  return 1
}

# --- Lanzador: ejecuta el agente o explica como instalarlo ---
ucn_run() {
  local tool="$1"
  shift
  local bin
  bin="$(ucn_resolve "$tool")"
  if [ -z "$bin" ]; then
    echo "⚠️  El agente '$tool' no esta instalado en este dispositivo." >&2
    echo "    Instalalo y vuelve a intentarlo, o define la variable" >&2
    echo "    UCN_${tool^^}_BIN con su ruta en config/.env" >&2
    return 127
  fi

  # Limpieza preventiva para codex en caso de socket huérfano en Termux/Linux
  if [ "$tool" = "codex" ] && [ -d "$HOME/.codex/app-server-control" ]; then
    local sock="$HOME/.codex/app-server-control/app-server-control.sock"
    if [ -L "$sock" ] && [ ! -e "$sock" ]; then
      rm -f "$sock" "$HOME/.codex/app-server-control/app-server-startup.lock" 2>/dev/null || true
    fi
  fi

  # Inyeccion del prompt del perfil activo (UCN_PROFILE):
  # claude soporta --append-system-prompt-file con un archivo de texto plano.
  local pp
  pp="$(ucn_profile_prompt_file)"
  if [ "$tool" = "claude" ] && [ -n "$pp" ]; then
    "$bin" --append-system-prompt-file "$pp" "$@"
    return $?
  fi

  "$bin" "$@"
}

# --- Prompt del perfil activo (config/profile-prompts/<UCN_PROFILE>.md) ---
# Archivos generados con: ucn profile export [<perfil>]
ucn_profile_prompt_file() {
  local name="${UCN_PROFILE:-default}"
  local f
  if [ -n "$UCN_REPO_DIR" ]; then
    f="$UCN_REPO_DIR/config/profile-prompts/$name.md"
  else
    f="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd)/config/profile-prompts/$name.md"
  fi
  [ -f "$f" ] && printf '%s\n' "$f"
}

# --- API de comando unificado (igual en todos los dispositivos) ---
codex() {
  if [ "${1:-}" = "app-server" ] || [[ " $* " == *" --no-daemon "* ]]; then
    ucn_run codex "$@"
  else
    ucn_run codex --no-daemon "$@"
  fi
}

codex-full() {
  if [[ " $* " == *" --no-daemon "* ]]; then
    ucn_run codex --dangerously-bypass-approvals-and-sandbox "$@"
  else
    ucn_run codex --no-daemon --dangerously-bypass-approvals-and-sandbox "$@"
  fi
}

cl() {
  ucn_run claude "$@"
}

cl-full() {
  ucn_run claude --yes "$@"
}

ocode() {
  ucn_run opencode "$@"
}

ocode-full() {
  ucn_run opencode --agent build "$@"
}

anti() {
  ucn_run agy "$@"
}

anti-full() {
  ucn_run agy --dangerously-skip-permissions "$@"
}

hermes() {
  ucn_run hermes "$@"
}

hermes-full() {
  ucn_run hermes --yolo "$@"
}

# --- Diagnostico rapido de agentes instalados en el dispositivo ---
# Usa el CLI Go (ucn agents -> config/agents.yaml) si esta compilado;
# si no, usa el resolutor bash como fallback.
ucn-agents() {
  if command -v ucn >/dev/null 2>&1; then
    ucn agents 2>/dev/null && return 0
  fi
  echo "=== Agentes IA detectados en: ${UCN_PLATFORM:-desconocido} ==="
  local tool bin
  for tool in codex claude opencode hermes agy; do
    if bin="$(ucn_resolve "$tool")"; then
      printf '  %-8s -> %s\n' "$tool" "$bin"
    else
      printf '  %-8s -> (no instalado)\n' "$tool"
    fi
  done
}

# --- Perfiles de especialidad (ucn profile) ---
# Lista, activa o muestra el perfil de especialidad. El prompt del perfil
# activo queda disponible para los agentes via $UCN_PROFILE y ucn profile show.
ucn-profile() {
  if command -v ucn >/dev/null 2>&1; then
    ucn profile "$@"
    return $?
  fi
  echo "⚠️  El CLI ucn no esta instalado. Instalalo para usar perfiles."
  return 127
}