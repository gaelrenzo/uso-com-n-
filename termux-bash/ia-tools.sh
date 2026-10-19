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
  local env_var="UCN_${tool^^}_BIN"; env_var="${env_var//-/_}"
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
    *)
      # npm global / uv tool / pipx dejan el binario en ~/.local/bin o ~/.npm-global/bin
      for c in "$HOME/.local/bin/$tool" "$HOME/.npm-global/bin/$tool" "/usr/local/bin/$tool"; do
        [ -x "$c" ] && { printf '%s
' "$c"; return 0; }
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
  ucn_run claude --dangerously-skip-permissions "$@"
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

# --- Otras IAs del mercado (funcionan si estan instaladas: ucn-install-ia) ---
gem()          { ucn_run gemini "$@"; }
gem-full()     { ucn_run gemini --yolo "$@"; }
qwen()         { ucn_run qwen "$@"; }
qwen-full()    { ucn_run qwen --yolo "$@"; }
crush()        { ucn_run crush "$@"; }
crush-full()   { ucn_run crush --yolo "$@"; }
copilot()      { ucn_run copilot "$@"; }
copilot-full() { ucn_run copilot --allow-all-tools "$@"; }
amp()          { ucn_run amp "$@"; }
amp-full()     { ucn_run amp --dangerously-allow-all "$@"; }
iflow()        { ucn_run iflow "$@"; }
iflow-full()   { ucn_run iflow --yolo "$@"; }
aider()        { ucn_run aider "$@"; }
aider-full()   { ucn_run aider --yes-always "$@"; }
kimi()         { ucn_run kimi "$@"; }
kimi-full()    { ucn_run kimi --yolo "$@"; }
cursor()       { ucn_run cursor-agent "$@"; }
cursor-full()  { ucn_run cursor-agent --force "$@"; }
kilo()         { ucn_run kilocode "$@"; }
auggie()       { ucn_run auggie "$@"; }

UCN_IA_TOOLS="codex claude opencode hermes agy gemini qwen crush copilot amp iflow aider kimi cursor-agent kilocode auggie"

# --- Instala todas las IAs que falten (npm + uv). Uno por uno: si falla uno, sigue ---
ucn-install-ia() {
  local spec bin pkg
  for spec in codex:@openai/codex claude:@anthropic-ai/claude-code opencode:opencode-ai               gemini:@google/gemini-cli qwen:@qwen-code/qwen-code crush:@charmland/crush               copilot:@github/copilot amp:@sourcegraph/amp iflow:@iflow-ai/iflow-cli               kilocode:@kilocode/cli auggie:@augmentcode/auggie; do
    bin="${spec%%:*}"; pkg="${spec#*:}"
    ucn_resolve "$bin" >/dev/null && { echo "✓ $bin"; continue; }
    echo "→ npm i -g $pkg"; npm install -g "$pkg" || echo "✗ fallo $pkg"
  done
  command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh
  ucn_resolve aider >/dev/null || uv tool install aider-chat || echo "✗ fallo aider"
  ucn_resolve kimi  >/dev/null || uv tool install kimi-cli   || echo "✗ fallo kimi"
  ucn_resolve cursor-agent >/dev/null || curl -fsS https://cursor.com/install | bash || echo "✗ fallo cursor"
  ucn-agents
}

# --- Diagnostico rapido de agentes instalados en el dispositivo ---
ucn-agents() {
  echo "=== Agentes IA detectados en: ${UCN_PLATFORM:-desconocido} ==="
  local tool bin
  for tool in $UCN_IA_TOOLS; do
    if bin="$(ucn_resolve "$tool")"; then
      printf '  %-13s -> %s\n' "$tool" "$bin"
    else
      printf '  %-13s -> (no instalado)\n' "$tool"
    fi
  done
}
