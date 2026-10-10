#!/usr/bin/env bash
# ==============================================================================
# UCN TEST-ALL - Suite de verificacion de la Mochila Digital
# ------------------------------------------------------------------------------
# Comprueba: build Go, sintaxis bash, resolutor de agentes, variables de
# entorno, deteccion de repositorio y notas, wrappers y doctor.
#
# Uso:
#   ./scripts/test-all.sh            # todos los checks
#   ./scripts/test-all.sh quick      # solo checks rapidos (sin compilar)
# ==============================================================================

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0
SKIP=0
FAILED_NAMES=()

say()   { printf '%s\n' "$*"; }
ok()    { say "  [✓] $*"; PASS=$((PASS+1)); }
bad()   { say "  [✗] $*"; FAIL=$((FAIL+1)); FAILED_NAMES+=("$*"); }
skip()  { say "  [-] $*"; SKIP=$((SKIP+1)); }
header(){ say ""; say "─── $* ───"; }

# ---------------------------------------------------------------------------
# Check 1: Sintaxis bash de todos los scripts
# ---------------------------------------------------------------------------
check_bash_syntax() {
  header "Sintaxis bash"
  local files
  files=$(find "$REPO_ROOT" -name "*.sh" -not -path "*/node_modules/*" -not -path "*/.git/*")
  if [ -z "$files" ]; then
    skip "No hay scripts .sh"
    return
  fi
  while IFS= read -r f; do
    if bash -n "$f" 2>/dev/null; then
      ok "bash -n $(basename "$f")"
    else
      local err
      err="$(bash -n "$f" 2>&1 || true)"
      bad "bash -n $(basename "$f"): $err"
    fi
  done <<< "$files"
}

# ---------------------------------------------------------------------------
# Check 2: Build del CLI Go
# ---------------------------------------------------------------------------
GO_BIN=""    # ruta del binary compilado (usado despues por check_go_cli)
GO_TMP=""    # directorio temporal que se limpia al final

check_go_build() {
  header "Build Go"
  if ! command -v go >/dev/null 2>&1; then
    skip "Go no esta instalado"
    return
  fi
  local out
  GO_TMP="$(mktemp -d)"
  cp -r "$REPO_ROOT/ucn" "$GO_TMP/ucn" 2>/dev/null || { bad "no se pudo copiar ucn/"; return; }
  out="$GO_TMP/ucn-test"
  if ( cd "$GO_TMP/ucn" && go build -o "$out" ./cmd/ucn/ ) 2>"$GO_TMP/err.log"; then
    ok "go build ./cmd/ucn"
    GO_BIN="$out"
  else
    bad "go build: $(head -5 "$GO_TMP/err.log")"
  fi
}

# ---------------------------------------------------------------------------
# Check 3: Resolutor de agentes (ucn_resolve)
# ---------------------------------------------------------------------------
check_agent_resolver() {
  header "Resolutor de agentes"
  local os
  os="$(uname -s 2>/dev/null || echo unknown)"
  local osvar="${os//[^a-zA-Z]/}"
  osvar="$(echo "$osvar" | tr '[:upper:]' '[:lower:]')"
  if [ "$osvar" = "darwin" ]; then
    osvar="linux"  # macOS usa las mismas rutas POSIX que linux
  fi
  if [ "${UCN_PLATFORM:-}" = "termux" ] || [ -d "/data/data/com.termux/files/usr" ]; then
    osvar="termux"
  fi
  say "  Plataforma detectada para resolutor: $osvar"
  # Los scripts fuente referencian vars opcionales, asi que se corre todo el
  # check dentro de un subshell SIN set -u y se reportan los resultados.
  local out
  out="$(
    set +u
    source "$REPO_ROOT/scripts/ucn-platform.sh" >/dev/null 2>&1
    source "$REPO_ROOT/termux-bash/ia-tools.sh" >/dev/null 2>&1
    for tool in codex claude opencode hermes agy; do
      if command -v "$tool" >/dev/null 2>&1; then
        resolved="$(ucn_resolve "$tool" 2>/dev/null)"
        if [ -n "$resolved" ]; then
          printf 'OK ucn_resolve %s -> %s\n' "$tool" "$resolved"
        else
          printf 'BAD ucn_resolve %s (binario en PATH pero resolv fracaso)\n' "$tool"
        fi
      else
        printf 'SKIP ucn_resolve %s (no instalado)\n' "$tool"
      fi
    done
  )"
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    case "$line" in
      OK*)   ok "${line#OK }" ;;
      BAD*)  bad "${line#BAD }" ;;
      SKIP*) skip "${line#SKIP }" ;;
      *)     say "  (sin estado) $line" ;;
    esac
  done <<< "$out"
}

# ---------------------------------------------------------------------------
# Check 4: Variables de entorno y deteccion de rutas
# ---------------------------------------------------------------------------
check_env_and_paths() {
  header "Variables de entorno / deteccion de rutas"
  if [ "${UCN_PLATFORM:-}" = "" ]; then
    bash -c 'source "$0/scripts/ucn-platform.sh"' "$REPO_ROOT" >/dev/null 2>&1
  fi
  [ "${UCN_PLATFORM:-}" != "" ] && ok "UCN_PLATFORM=${UCN_PLATFORM}" || bad "UCN_PLATFORM sin definir"
  [ "${UCN_REPO_DIR:-}" != "" ] && ok "UCN_REPO_DIR=${UCN_REPO_DIR}" || bad "UCN_REPO_DIR sin definir"

  # Verificar que el repo fue detectado
  if [ -d "${UCN_REPO_DIR:-/nonexistent}" ]; then
    ok "UCN_REPO_DIR apunta a un directorio existente"
  else
    bad "UCN_REPO_DIR no existe: ${UCN_REPO_DIR:-}"
  fi
}

# ---------------------------------------------------------------------------
# Check 5: Estructura del repositorio documentada
# ---------------------------------------------------------------------------
check_structure() {
  header "Estructura del repositorio"
  local required=(
    config/agents.yaml
    config/config.yaml.example
    config/.env.example
    profiles/default/profile.yaml
    profiles/ingenieria/profile.yaml
    profiles/programacion/profile.yaml
    profiles/investigacion/profile.yaml
    profiles/universidad/profile.yaml
    config/profile-prompts/default.md
    config/profile-prompts/ingenieria.md
    config/profile-prompts/programacion.md
    config/profile-prompts/investigacion.md
    config/profile-prompts/universidad.md
    scripts/ucn-platform.sh
    termux-bash/termux-bash.sh
    termux-bash/ia-tools.sh
    termux-bash/aliases.sh
    laptop-powershell/Microsoft.PowerShell_profile.ps1
    laptop-cmd/ucn.cmd
    README.md
  )
  local f
  for f in "${required[@]}"; do
    [ -e "$REPO_ROOT/$f" ] && ok "$f" || bad "falta $f"
  done
}

# ---------------------------------------------------------------------------
# Check 6: ucn (CLI Go) - doctor y agents
# ---------------------------------------------------------------------------
check_go_cli() {
  header "CLI Go (doctor / agents / bootstrap / update / skills / build / profile)"
  local bin="${GO_BIN:-}"
  if [ -z "$bin" ]; then
    bin="$(command -v ucn || true)"
  fi
  if [ -z "$bin" ]; then
    skip "ucn no instalado ni compilado"
    return
  fi
  if ( cd "$REPO_ROOT" && "$bin" doctor 2>&1 | grep -q "UCN MULTI-DEVICE DIAGNOSTIC" ); then
    ok "ucn doctor responde"
  else
    bad "ucn doctor no responde como se espera"
  fi
  if ( cd "$REPO_ROOT" && "$bin" agents 2>&1 | grep -q "NAME" ); then
    ok "ucn agents responde"
  else
    bad "ucn agents no responde como se espera"
  fi
  # bootstrap: respuesta basica (idempotente, no requiere cambios)
  if ( cd "$REPO_ROOT" && "$bin" bootstrap 2>&1 | grep -q "Dispositivo configurado" ); then
    ok "ucn bootstrap responde"
  else
    bad "ucn bootstrap no responde como se espera"
  fi
  # update --check: solo comprueba, no aplica cambios
  if ( cd "$REPO_ROOT" && "$bin" update --check 2>&1 | grep -q "UCN UPDATE" ); then
    ok "ucn update --check responde"
  else
    bad "ucn update --check no responde como se espera"
  fi
  # skills list: lista las skills del repo
  if ( cd "$REPO_ROOT" && "$bin" skills list 2>&1 | grep -q "SKILL" ); then
    ok "ucn skills list responde"
  else
    bad "ucn skills list no responde como se espera"
  fi
  # skills clean: detecta enlaces rotos / respaldos huerfanos (no destructivo por defecto)
  if ( cd "$REPO_ROOT" && "$bin" skills clean 2>&1 | grep -q "Problemas encontrados\|No hay enlaces rotos" ); then
    ok "ucn skills clean responde"
  else
    bad "ucn skills clean no responde como se espera"
  fi
  # build: recompila el CLI solo si Go esta disponible
  if command -v go >/dev/null 2>&1; then
    if ( cd "$REPO_ROOT" && "$bin" build 2>&1 | grep -q "Binario listo" ); then
      ok "ucn build responde"
    else
      bad "ucn build no responde como se espera"
    fi
  else
    skip "ucn build (go no instalado)"
  fi
  # profile list: debe listar los perfiles
  if ( cd "$REPO_ROOT" && "$bin" profile list 2>&1 | grep -q "ingenieria" ); then
    ok "ucn profile list responde"
  else
    bad "ucn profile list no responde como se espera"
  fi
  # profile use/current (idempotente: restaura default al final)
  if ( cd "$REPO_ROOT" && "$bin" profile use ingenieria >/dev/null 2>&1 \
       && "$bin" profile current 2>&1 | grep -q "ingenieria" \
       && "$bin" profile use default >/dev/null 2>&1 ); then
    ok "ucn profile use/current responde"
  else
    bad "ucn profile use/current no responde como se espera"
  fi
  # profile export: genera el archivo de prompt para los wrappers
  if ( cd "$REPO_ROOT" && "$bin" profile export ingenieria 2>&1 | grep -q "profile-prompts/ingenieria.md" ); then
    ok "ucn profile export responde"
  else
    bad "ucn profile export no responde como se espera"
  fi
}

# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------
run_all() {
  say ""
  say "🧪 UCN TEST-ALL  ($REPO_ROOT)"
  check_bash_syntax
  check_go_build
  check_env_and_paths
  check_structure
  check_agent_resolver
  check_go_cli

  say ""
  header "RESULTADO"
  say "  ✅ ${PASS} ok | ❌ ${FAIL} fallo | [-] ${SKIP} skip"
  if [ -n "${GO_TMP:-}" ]; then
    rm -rf "$GO_TMP"
  fi
  if [ "$FAIL" -gt 0 ]; then
    say ""
    header "Fallos"
    local f
    for f in "${FAILED_NAMES[@]}"; do say "  - $f"; done
    say ""
    say "❌ UCN TEST-ALL FAILED"
    exit 1
  fi
  say ""
  say "✓ UCN TEST-ALL PASSED"
  exit 0
}

run_quick() {
  say ""
  say "🧪 UCN TEST-ALL (quick - sin compilar)"
  check_bash_syntax
  check_env_and_paths
  check_structure
  check_go_cli
  if [ -n "${GO_TMP:-}" ]; then
    rm -rf "$GO_TMP"
  fi
  say ""
  header "RESULTADO"
  say "  ✅ ${PASS} ok | ❌ ${FAIL} fallo | [-] ${SKIP} skip"
  [ "$FAIL" -gt 0 ] && { say "❌ UCN TEST-ALL FAILED"; exit 1; }
  say "✓ UCN TEST-ALL PASSED"
  exit 0
}

case "${1:-all}" in
  quick) run_quick ;;
  all)   run_all ;;
  *)     say "Uso: $0 [all|quick]"; exit 1 ;;
esac