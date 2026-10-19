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
REM ESC para colores ANSI (Windows 10+)
for /F "delims=#" %%a in ('"prompt #$E# & for %%a in (1) do rem"') do set "E=%%a"
ECHO.
ECHO   %E%[35m+-----------%E%[1;33m HERRAMIENTAS IA %E%[35m------------+%E%[0m
ECHO   %E%[35m^|%E%[0m %E%[1;36mAgente          Normal   Full (yolo)  %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|----------------------------------------^|%E%[0m
ECHO   %E%[35m^|%E%[0m Claude Code     %E%[1;32mcl      %E%[0m %E%[33mcl-full      %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Codex           %E%[1;32mcodex   %E%[0m %E%[33mcodex-full   %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Gemini CLI      %E%[1;32mgem     %E%[0m %E%[33mgem-full     %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m OpenCode        %E%[1;32mocode   %E%[0m %E%[33mocode-full   %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Antigravity     %E%[1;32manti    %E%[0m %E%[33manti-full    %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Hermes Agent    %E%[1;32mhermes  %E%[0m %E%[33mhermes-full  %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Qwen Code       %E%[1;32mqwen    %E%[0m %E%[33mqwen-full    %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Crush           %E%[1;32mcrush   %E%[0m %E%[33mcrush-full   %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m GitHub Copilot  %E%[1;32mcopilot %E%[0m %E%[33mcopilot-full %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Amp             %E%[1;32mamp     %E%[0m %E%[33mamp-full     %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m iFlow           %E%[1;32miflow   %E%[0m %E%[33miflow-full   %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Aider           %E%[1;32maider   %E%[0m %E%[33maider-full   %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Kimi CLI        %E%[1;32mkimi    %E%[0m %E%[33mkimi-full    %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Cursor Agent    %E%[1;32mcursor  %E%[0m %E%[33mcursor-full  %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Kilo Code       %E%[1;32mkilo    %E%[0m %E%[33m-            %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m Augment         %E%[1;32mauggie  %E%[0m %E%[33m-            %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|----------------------------------------^|%E%[0m
ECHO   %E%[35m^|%E%[0m %E%[36mucn-agents    %E%[0m ver instaladas          %E%[35m^|%E%[0m
ECHO   %E%[35m^|%E%[0m %E%[36mucn-install-ia%E%[0m instalar las que falten %E%[35m^|%E%[0m
ECHO   %E%[35m+----------------------------------------+%E%[0m
ECHO.
set "E="
