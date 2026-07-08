# ==========================================
# ALIASES GENERALES
# ==========================================

alias update="apt update && apt upgrade -y"
alias cls="clear && source ~/.bashrc"
alias ll="ls -la"
alias uni="cd /storage/emulated/0/universida-datos"
alias weather="curl wttr.in/Puno"
alias sysinfo="fastfetch"
alias editui="nano ~/.bashrc"

# ==========================================
# ALIASES UCN (Mochila Digital)
# ==========================================

alias ucn-note="bash ~/workspace/uso-com-n-/scripts/ucn-note.sh"
alias ucn-clase="bash ~/workspace/uso-com-n-/scripts/ucn-clase.sh"
alias ucn-informe="bash ~/workspace/uso-com-n-/scripts/ucn-informe.sh"
alias ucn-install-all="bash ~/workspace/uso-com-n-/scripts/ucn-install-all.sh"
alias ucn-update="cd ~/workspace/uso-com-n- && git pull && bash install.sh && source ~/.bashrc"
alias ucn-logs="tail -f ~/workspace/uso-com-n-/ucn/ucn.log 2>/dev/null || echo 'No logs'"

# ==========================================
# ALIASES DE PRODUCTIVIDAD
# ==========================================

alias notas="cd /storage/emulated/0/universida-datos/notas && ls -la"
alias informes="cd /storage/emulated/0/universida-datos/informes && ls -la"
alias cursos="cd /storage/emulated/0/universida-datos/cursos && ls -la"
alias labs="cd /storage/emulated/0/universida-datos/laboratorios && ls -la"
alias workspace="cd ~/workspace"
alias repos="cd ~/workspace && ls -d */"
