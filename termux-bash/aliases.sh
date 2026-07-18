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

UCN_DIR="/mnt/sdcard/universida-datos/uso-com-n-"

alias ucn-note="bash $UCN_DIR/scripts/ucn-note.sh"
alias ucn-clase="bash $UCN_DIR/scripts/ucn-clase.sh"
alias ucn-informe="bash $UCN_DIR/scripts/ucn-informe.sh"
alias ucn-install-all="bash $UCN_DIR/scripts/ucn-install-all.sh"
alias ucn-update="cd $UCN_DIR && git pull && bash install.sh && source ~/.bashrc"
alias ucn-logs="tail -f $UCN_DIR/ucn/ucn.log 2>/dev/null || echo 'No logs'"
alias ucn-debian="bash ~/.shortcuts/start-debian-xfce.sh"
alias ucn-install-debian="bash $UCN_DIR/scripts/install-debian-xfce.sh"

# ==========================================
# ALIASES DE PRODUCTIVIDAD
# ==========================================

alias notas="cd /mnt/sdcard/universida-datos/notas 2>/dev/null || mkdir -p /mnt/sdcard/universida-datos/notas && cd /mnt/sdcard/universida-datos/notas && ls -la"
alias informes="cd /mnt/sdcard/universida-datos/informes 2>/dev/null || mkdir -p /mnt/sdcard/universida-datos/informes && cd /mnt/sdcard/universida-datos/informes && ls -la"
alias cursos="cd /mnt/sdcard/universida-datos/cursos 2>/dev/null || mkdir -p /mnt/sdcard/universida-datos/cursos && cd /mnt/sdcard/universida-datos/cursos && ls -la"
alias labs="cd /mnt/sdcard/universida-datos/laboratorios 2>/dev/null || mkdir -p /mnt/sdcard/universida-datos/laboratorios && cd /mnt/sdcard/universida-datos/laboratorios && ls -la"
alias uni="cd /mnt/sdcard/universida-datos"
alias workspace="cd $HOME/workspace 2>/dev/null || mkdir -p $HOME/workspace && cd $HOME/workspace"
alias repos="cd $HOME/workspace 2>/dev/null && ls -d */"
