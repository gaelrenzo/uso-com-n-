# ==========================================
# MOTD - MENSAJE DE BIENVENIDA
# ==========================================

clear
echo -e "\e[35m=====================================================\e[0m"
echo -e "        \e[32mBienvenido de vuelta\e[0m"
echo -e "        \e[33mUCN - Mochila Digital\e[0m"
echo -e "        \e[33mTermux + Ubuntu Container\e[0m"
echo -e "\e[35m=====================================================\e[0m\n"

echo -e "\e[36mFecha:\e[0m      $(date +'%A, %d %B %Y')"
echo -e "\e[36mHora:\e[0m       $(date +'%I:%M %p')"
echo -e "\e[36mDirectorio:\e[0m $(pwd)"
echo -e "\e[36mMemoria:\e[0m    $(free -m | awk 'NR==2{printf "%.2fG / %.2fG (%.2f%%)", $3/1024, $2/1024, $3*100/$2}' 2>/dev/null || echo "N/A")\n"

echo -e "\e[33mComandos rapidos:\e[0m"
echo -e "  \e[32mupdate\e[0m   = Actualiza paquetes"
echo -e "  \e[32mcls\e[0m      = Limpia y recarga"
echo -e "  \e[32mll\e[0m       = Lista detallada"
echo -e "  \e[32muni\e[0m      = Ir a universida-datos"
echo -e "  \e[32mweather\e[0m  = Clima en Puno"
echo -e "  \e[32msysinfo\e[0m  = Info del sistema"
echo -e "  \e[32meditui\e[0m   = Editar skills\n"

echo -e "\e[33mIA y Codigo:\e[0m"
echo -e "  \e[32mcodex\e[0m / \e[32mcodex-full\e[0m   = Codex"
echo -e "  \e[32manti\e[0m  / \e[32manti-full\e[0m    = Antigravity"
echo -e "  \e[32mcl\e[0m    / \e[32mcl-full\e[0m      = Claude Code"
echo -e "  \e[32mocode\e[0m / \e[32mocode-full\e[0m   = OpenCode"
echo -e "  \e[32mhermes\e[0m / \e[32mhermes-full\e[0m  = Hermes Agent\n"

echo -e "\e[33mUCN - Mochila Digital:\e[0m"
echo -e "  \e[32mucn note\e[0m    = Nota rapida Markdown"
echo -e "  \e[32mucn clase\e[0m   = Abrir carpeta universidad"
echo -e "  \e[32mucn informe\e[0m = Plantilla de informe"
echo -e "  \e[32mucn sync\e[0m    = Sincronizar skills"
echo -e "  \e[32mucn doctor\e[0m  = Diagnosticar entorno"
echo -e "  \e[32mucn push\e[0m    = Subir cambios"
echo -e "  \e[32mucn tunnel\e[0m  = Tunnel Cloudflare"
echo -e "  \e[32mucn update\e[0m  = Actualizar UCN\n"

echo -e "\e[33mProductividad:\e[0m"
echo -e "  \e[32mnotas\e[0m    = Ir a notas"
echo -e "  \e[32minformes\e[0m = Ir a informes"
echo -e "  \e[32mcursos\e[0m   = Ir a cursos"
echo -e "  \e[32mlabs\e[0m     = Ir a laboratorios"
echo -e "  \e[32mworkspace\e[0m = Ir a workspace\n"

echo -e "\e[33mFunciones HTML:\e[0m"
echo -e "  \e[32mhtml-serve\e[0m  = Servir pagina local"
echo -e "  \e[32mhtml-push\e[0m   = Git add + commit + push de la web"
echo -e "  \e[32mhtml-status\e[0m = Estado del repo"
echo -e "  \e[32mhtml-public\e[0m = Tunel publico SSH"
echo -e "  \e[32mhtml-clone\e[0m  = Clonar o actualizar repo\n"

echo -e "\e[33mSincronizacion de Skills:\e[0m"
echo -e "  \e[32mskills-sync\e[0m = Descarga y enlaza skills de agentes"
echo -e "  \e[32mskills-push\e[0m = Sube skills locales (Modo Seguro)\n"

echo -e "\e[33mDirectorios de Agentes:\e[0m"
echo -e "  skills/agents/claude/   = Reglas para Claude Code"
echo -e "  skills/agents/opencode/ = Skills para OpenCode"
echo -e "  skills/agents/codex/    = Instrucciones para Codex"
echo -e "  skills/agents/agy/      = Config para Antigravity\n"

echo -e "\e[35m=====================================================\e[0m"
