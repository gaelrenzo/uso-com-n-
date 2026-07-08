# ==========================================
# FUNCIONES PERSONALIZADAS
# ==========================================

html-serve() {
  local port=${1:-8080}
  cd /root/Workspace/html 2>/dev/null || cd ~/workspace/uso-com-n- 2>/dev/null
  live-server --host=127.0.0.1 --port="$port"
}

html-push() {
  local msg="${1:-avance}"
  git pull --rebase
  git add .
  git commit -m "$msg" && git push
}

html-status() {
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
  if [ -d /root/workspace/uso-com-n- ]; then
    cd /root/workspace/uso-com-n- && git pull
  else
    mkdir -p /root/workspace
    cd /root/workspace
    git clone git@github.com:gaelrenzo/uso-com-n-.git
    cd uso-com-n-
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
