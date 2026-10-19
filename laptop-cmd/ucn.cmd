@echo off
REM ============================================================
REM UCN - Mochila Digital | Alias para Windows CMD (laptop)
REM Equivalente en cmd.exe de termux-bash/ia-tools.sh
REM Cargar manualmente en cada sesion:  ucn.cmd
REM (para carga automatica usa el perfil PowerShell en
REM  laptop-powershell/Microsoft.PowerShell_profile.ps1)
REM ============================================================

REM --- Comandos IA (equivale a ia-tools.sh) ---
doskey codex=codex --no-daemon $*
doskey codex-full=codex --no-daemon --dangerously-bypass-approvals-and-sandbox $*
doskey cl=claude $*
doskey cl-full=claude --dangerously-skip-permissions $*
doskey ocode=opencode $*
doskey ocode-full=opencode --agent build $*
doskey anti=agy $*
doskey anti-full=agy --dangerously-skip-permissions $*
doskey hermes=hermes $*
doskey hermes-full=hermes --yolo $*
doskey gem=gemini $*
doskey gem-full=gemini --yolo $*
doskey qwen-full=qwen --yolo $*
doskey crush-full=crush --yolo $*
doskey copilot-full=copilot --allow-all-tools $*
doskey amp-full=amp --dangerously-allow-all $*
doskey iflow-full=iflow --yolo $*
doskey aider-full=aider --yes-always $*
doskey kimi-full=kimi --yolo $*
doskey cursor=cursor-agent $*
doskey cursor-full=cursor-agent --force $*
doskey kilo=kilocode $*

REM --- Resolver raiz del repo desde la ubicacion de este archivo ---
set "UCN_CMD_DIR=%~dp0"
set "UCN_REPO_CMD=%UCN_CMD_DIR%\.."

REM --- Diagnostico ---
doskey ucn-agents=where codex claude opencode hermes agy gemini qwen crush copilot amp iflow aider kimi cursor-agent kilocode auggie
doskey ucn-install-ia=powershell -NoProfile -ExecutionPolicy Bypass -Command ". '%UCN_REPO_CMD%\laptop-powershell\Microsoft.PowerShell_profile.ps1' | Out-Null; ucn-install-ia"

REM --- Comandos base (equivale a aliases.sh) ---
doskey ll=dir /a
doskey update=winget upgrade --all
doskey weather=curl.exe -s wttr.in/Puno
doskey sysinfo=systeminfo
doskey editui=notepad "%UCN_CMD_DIR%ucn.cmd"

REM --- Navegacion ---
doskey uni=cd /d %USERPROFILE%\universida-datos
doskey notas=cd /d %USERPROFILE%\universida-datos\notas
doskey informes=cd /d %USERPROFILE%\universida-datos\informes
doskey cursos=cd /d %USERPROFILE%\universida-datos\cursos
doskey workspace=cd /d %UCN_REPO_CMD%

REM --- Menu solo en sesiones interactivas (AutoRun tambien corre en "cmd /c") ---
echo %CMDCMDLINE% | find /i "/c" >nul && goto :eof
ECHO.
ECHO   [UCN] IA:  cl codex gem ocode anti hermes qwen crush copilot
ECHO              amp iflow aider kimi cursor kilo auggie   (^<cmd^>-full = sin confirmaciones)
ECHO   [UCN] ucn-agents = ver instaladas   ucn-install-ia = instalar las que falten
