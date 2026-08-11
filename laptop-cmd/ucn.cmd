@echo off
REM ============================================================
REM UCN - Mochila Digital | Alias para Windows CMD (laptop)
REM Equivalente en cmd.exe de termux-bash/ia-tools.sh
REM Cargar manualmente en cada sesion:  ucn.cmd
REM (para carga automatica usa el perfil PowerShell en
REM  laptop-powershell/Microsoft.PowerShell_profile.ps1)
REM ============================================================

REM --- Comandos IA (equivale a ia-tools.sh) ---
doskey codex=codex $*
doskey codex-full=codex --dangerously-bypass-approvals-and-sandbox $*
doskey cl=claude $*
doskey cl-full=claude --yes $*
doskey ocode=opencode $*
doskey ocode-full=opencode --agent build $*
doskey anti=agy $*
doskey anti-full=agy --dangerously-skip-permissions $*
doskey hermes=hermes $*
doskey hermes-full=hermes --yolo $*

REM --- Resolver raiz del repo desde la ubicacion de este archivo ---
set "UCN_CMD_DIR=%~dp0"
set "UCN_REPO_CMD=%UCN_CMD_DIR%\.."

REM --- Diagnostico ---
doskey ucn-agents=where codex claude opencode hermes agy
doskey ucn-profile=ucn profile $*

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

REM --- UCN ---
doskey ucn-update=cd /d "%UCN_REPO_CMD%" ^&^& git pull ^&^& git push
doskey ucn-note=powershell -ExecutionPolicy Bypass -NoExit -File "%UCN_REPO_CMD%\laptop-powershell\Microsoft.PowerShell_profile.ps1"
doskey cls=cls

ECHO.
ECHO   [UCN] Alias de CMD cargados (lee laptop-cmd/ucn.cmd)
ECHO   [UCN] Preferido: PowerShell con laptop-powershell\Microsoft.PowerShell_profile.ps1