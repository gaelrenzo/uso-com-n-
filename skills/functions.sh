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
