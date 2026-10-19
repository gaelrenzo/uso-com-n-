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

echo -e "\e[33mIA y Codigo:\e[0m  (\e[32m<cmd>-full\e[0m = modo sin confirmaciones)"
echo -e "  \e[32mcl\e[0m      Claude Code     \e[32mcodex\e[0m   Codex          \e[32mgem\e[0m     Gemini CLI"
echo -e "  \e[32mocode\e[0m   OpenCode        \e[32manti\e[0m    Antigravity    \e[32mhermes\e[0m  Hermes Agent"
echo -e "  \e[32mqwen\e[0m    Qwen Code       \e[32mcrush\e[0m   Crush          \e[32mcopilot\e[0m GitHub Copilot"
echo -e "  \e[32mamp\e[0m     Amp             \e[32miflow\e[0m   iFlow          \e[32maider\e[0m   Aider"
echo -e "  \e[32mkimi\e[0m    Kimi CLI        \e[32mcursor\e[0m  Cursor Agent   \e[32mkilo\e[0m    Kilo Code (sin -full)"
echo -e "  \e[32mauggie\e[0m  Augment (sin -full)"
echo -e "  \e[32mucn-agents\e[0m = Ver instaladas   \e[32mucn-install-ia\e[0m = Instalar las que falten
"

echo -e "\e[33mProductividad:\e[0m"
echo -e "  \e[32mnotas\e[0m    = Ir a notas"
echo -e "  \e[32minformes\e[0m = Ir a informes"
echo -e "  \e[32mcursos\e[0m   = Ir a cursos"
echo -e "  \e[32mlabs\e[0m     = Ir a laboratorios"
echo -e "  \e[32mworkspace\e[0m = Ir a workspace\n"

echo -e "\e[35m=====================================================\e[0m"