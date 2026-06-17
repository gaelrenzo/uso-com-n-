#!/bin/bash
# ==============================================================================
# Instalador Automático - Entorno de Laboratorio Termux (Ubuntu Container)
# ==============================================================================

echo "🚀 Configurando el Laboratorio Personal de Abu Saalim..."

# El bloque de configuración que se inyectará en el bashrc
CONFIG_BLOCK='
# ==========================================
# 🚀 CONFIGURACIÓN PERSONAL: ABU SAALIM
# ==========================================

# 1. Alias Generales
alias update="apt update && apt upgrade -y"
alias cls="clear && source ~/.bashrc"
alias ll="ls -la"
alias uni="cd /storage/emulated/0/universida-datos"
alias weather="curl wttr.in/Puno"
alias sysinfo="fastfetch"
alias editui="nano ~/.bashrc"

# 2. Accesos Rápidos: IA y Código
alias codex="codex"
alias codex-full="codex --dangerously-skip-permissions"
alias anti="agy"
alias anti-full="agy --dangerously-skip-permissions"
alias cl="claude"
alias cl-full="claude --yes"
alias ocode="opencode"
alias ocode-full="opencode --agent build"

# 3. Interfaz Visual (MOTD)
clear
echo -e "\e[35m=== ABU SAALIM ===\e[0m"
echo -e "\e[35m=======================================================================\e[0m"
echo -e "        🚀 \e[32mBienvenido de vuelta, Abu Saalim\e[0m 🚀"
echo -e "        \e[33mTu Laboratorio Personal de Termux (Ubuntu Container)\e[0m"
echo -e "\e[35m=======================================================================\e[0m\n"

echo -e "\e[36m📅 Fecha:\e[0m      $(date +'%A, %d %B %Y')"
echo -e "\e[36m⏰ Hora:\e[0m       $(date +'%I:%M %p')"
echo -e "\e[36m📁 Directorio:\e[0m $(pwd)"
echo -e "\e[36m🧠 Memoria:\e[0m    $(free -m | awk '\''NR==2{printf "%.2fG / %.2fG (%.2f%%)", $3/1024, $2/1024, $3*100/$2 }'\'')\n"

echo -e "\e[33m⚡ Comandos rápidos:\e[0m"
echo -e "  \e[32mupdate\e[0m   = Actualiza los paquetes de Ubuntu"
echo -e "  \e[32mcls\e[0m      = Limpia la pantalla y recarga la UI"
echo -e "  \e[32mll\e[0m       = Muestra archivos detallados (ls -la)"
echo -e "  \e[32muni\e[0m      = Ir a la carpeta universida-datos"
echo -e "  \e[32mweather\e[0m  = Muestra el clima de hoy"
echo -e "  \e[32msysinfo\e[0m  = Muestra info detallada del hardware (fastfetch)"
echo -e "  \e[32meditui\e[0m   = Edita esta pantalla de bienvenida\n"

echo -e "\e[33m🤖 Herramientas de Código e IA:\e[0m"
echo -e "  \e[32mcodex\e[0m / \e[32mcodex-full\e[0m = Lanza Codex (Seguro / Acceso Total)"
echo -e "  \e[32manti\e[0m  / \e[32manti-full\e[0m  = Lanza Antigravity (Seguro / --dangerously-skip-permissions)"
echo -e "  \e[32mcl\e[0m    / \e[32mcl-full\e[0m    = Lanza Claude Code (Seguro / Auto-aprobar)"
echo -e "  \e[32mocode\e[0m / \e[32mocode-full\e[0m = Lanza Open Code (Normal / --agent build)\n"

echo -e "\e[33m💡 Frase del día:\e[0m Un buen programador escribe código que los humanos pueden entender. 💻"
'

# Verificar si la configuración ya existe para no duplicarla
if grep -q "CONFIGURACIÓN PERSONAL: ABU SAALIM" ~/.bashrc; then
    echo "⚠️  La configuración ya parece estar instalada en ~/.bashrc"
else
    echo "$CONFIG_BLOCK" >> ~/.bashrc
    echo "✅ Alias e Interfaz inyectados con éxito en ~/.bashrc"
fi

echo "🎉 ¡Instalación completada! Ejecuta 'source ~/.bashrc' para ver los cambios."
