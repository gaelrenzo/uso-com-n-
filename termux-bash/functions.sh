# ==========================================
# FUNCIONES PERSONALIZADAS
# ==========================================

repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || printf '%s\n' "${UCN_REPO_DIR:-$HOME/workspace/uso-com-n-}"
}

html-serve() {
  local port=${1:-8080}
  cd "$(repo_root)" || return
  live-server --host=127.0.0.1 --port="$port"
}

html-push() {
  local msg="${1:-avance}"
  cd "$(repo_root)" || return
  git pull --rebase
  git add .
  git commit -m "$msg" && git push
}

html-status() {
  cd "$(repo_root)" || return
  echo "=== RAMA ===" && git branch
  echo "=== ESTADO ===" && git status
  echo "=== REMOTO ===" && git remote -v
  echo "=== ULTIMOS COMMITS ===" && git log --oneline --decorate -5
}

html-public() {
  local port=${1:-8080}
  ssh -R "80:localhost:$port" nokey@localhost.run
}

html-clone() {
  local target="${UCN_REPO_DIR:-$HOME/workspace/uso-com-n-}"
  if [ -d "$target/.git" ]; then
    cd "$target" && git pull
  else
    mkdir -p "$(dirname "$target")"
    cd "$(dirname "$target")" || return
    git clone git@github.com:gaelrenzo/uso-com-n-.git
    cd uso-com-n- || return
  fi
}

skills-sync() {
  local repo_dir
  repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  echo "Actualizando repositorio de dotfiles/skills..."
  cd "$repo_dir" || return
  git pull --rebase
  if [ -f "./install-agent-skills.sh" ]; then
    bash "./install-agent-skills.sh"
  fi
  source ~/.bashrc
  echo "Sincronizacion completada"
}

skills-push() {
  local msg="${1:-update skills}"
  local repo_dir
  repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  echo "Subiendo cambios de skills a GitHub (modo seguro)..."
  cd "$repo_dir" || return
  git add --ignore-removal skills/agent-skills/
  git commit -m "$msg"
  git push
}
# ==========================================
# FUNCIONES UCN (Mochila Digital)
# ==========================================

ucn-note() {
  bash ~/workspace/uso-com-n-/scripts/ucn-note.sh "$@"
}

ucn-clase() {
  bash ~/workspace/uso-com-n-/scripts/ucn-clase.sh "$@"
}

ucn-informe() {
  bash ~/workspace/uso-com-n-/scripts/ucn-informe.sh "$@"
}

ucn-update() {
  cd ~/workspace/uso-com-n- && git pull && bash install.sh && source ~/.bashrc
  echo "UCN actualizado"
}

ucn-install-all() {
  bash ~/workspace/uso-com-n-/scripts/ucn-install-all.sh
}
