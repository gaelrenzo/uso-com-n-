# ==========================================
# MOTD - MENSAJE DE BIENVENIDA
# ==========================================

clear
echo -e "\e[35m=====================================================\e[0m"
echo -e "        \e[32mBienvenido de vuelta\e[0m"
echo -e "        \e[33mUCN - Mochila Digital\e[0m"
echo -e "        \e[33m${UCN_PLATFORM:-bash}\e[0m"
echo -e "\e[35m=====================================================\e[0m\n"

echo -e "\e[36mFecha:\e[0m      $(date +'%A, %d %B %Y')"
echo -e "\e[36mHora:\e[0m       $(date +'%I:%M %p')"
echo -e "\e[36mDirectorio:\e[0m $(pwd)"
echo -e "\e[36mPlataforma:\e[0m ${UCN_PLATFORM:-desconocida}"
echo -e "\e[36mMemoria:\e[0m    $(free -m | awk 'NR==2{printf "%.2fG / %.2fG (%.2f%%)", $3/1024, $2/1024, $3*100/$2}' 2>/dev/null || echo "N/A")\n"

echo -e "\e[33mComandos rapidos:\e[0m"
echo -e "  \e[32mupdate\e[0m   = Actualiza paquetes"
echo -e "  \e[32mcls\e[0m      = Limpia y recarga"
echo -e "  \e[32mll\e[0m       = Lista detallada"
echo -e "  \e[32muni\e[0m      = Ir a universida-datos"
echo -e "  \e[32mweather\e[0m  = Clima en Puno"
echo -e "  \e[32msysinfo\e[0m  = Info del sistema"
echo -e "  \e[32meditui\e[0m   = Editar configuracion\n"

# --- Tabla de IAs: nombre | comando | version -full (sin confirmaciones) ---
_ia()  { printf "  \e[35m│\e[0m %-15s \e[1;32m%-8s\e[0m \e[33m%-13s\e[0m \e[35m│\e[0m
" "$1" "$2" "$3"; }
_iax() { printf "  \e[35m│\e[0m \e[36m%-14s\e[0m %-23s \e[35m│\e[0m
" "$1" "$2"; }
_iah() { printf "  \e[35m%s%s%s\e[0m
" "$1" "────────────────────────────────────────" "$2"; }
echo -e "  \e[35m╭───────────\e[1;33m HERRAMIENTAS IA \e[0;35m────────────╮\e[0m"
printf "  \e[35m│\e[0m \e[1;36m%-15s %-8s %-13s\e[0m \e[35m│\e[0m
" "Agente" "Normal" "Full (yolo)"
_iah "├" "┤"
_ia "Claude Code" "cl" "cl-full"
_ia "Codex" "codex" "codex-full"
_ia "Gemini CLI" "gem" "gem-full"
_ia "OpenCode" "ocode" "ocode-full"
_ia "Antigravity" "anti" "anti-full"
_ia "Hermes Agent" "hermes" "hermes-full"
_ia "Qwen Code" "qwen" "qwen-full"
_ia "Crush" "crush" "crush-full"
_ia "GitHub Copilot" "copilot" "copilot-full"
_ia "Amp" "amp" "amp-full"
_ia "iFlow" "iflow" "iflow-full"
_ia "Aider" "aider" "aider-full"
_ia "Kimi CLI" "kimi" "kimi-full"
_ia "Cursor Agent" "cursor" "cursor-full"
_ia "Kilo Code" "kilo" "-"
_ia "Augment" "auggie" "-"
_iah "├" "┤"
_iax "ucn-agents" "ver instaladas"
_iax "ucn-install-ia" "instalar las que falten"
_iah "╰" "╯"
unset -f _ia _iax _iah
echo

echo -e "\e[33mProductividad:\e[0m"
echo -e "  \e[32mnotas\e[0m    = Ir a notas"
echo -e "  \e[32minformes\e[0m = Ir a informes"
echo -e "  \e[32mcursos\e[0m   = Ir a cursos"
echo -e "  \e[32mlabs\e[0m     = Ir a laboratorios"
echo -e "  \e[32mworkspace\e[0m = Ir a workspace\n"

echo -e "\e[35m=====================================================\e[0m"