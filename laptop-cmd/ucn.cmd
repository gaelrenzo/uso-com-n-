@echo off
REM ============================================================
REM UCN - Mochila Digital | Alias para Windows CMD (laptop)
REM Equivalente en cmd.exe de termux-bash/ia-tools.sh
REM Cargar manualmente en cada sesion:  ucn.cmd
REM (para carga automatica usa el perfil PowerShell en
REM  laptop-powershell/Microsoft.PowerShell_profile.ps1)
REM ============================================================

REM --- Comandos IA (equivale a ia-tools.sh) ---
doskey l=dir $*
doskey la=dir /a $*
doskey ports=netstat -ano $*
doskey ipinfo=curl -s ipinfo.io
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
doskey claw=openclaw $*
doskey gem=gemini $*
doskey gem-full=gemini --yolo $*
doskey qwen=qwen $*
doskey qwen-full=qwen --yolo $*
doskey crush=crush $*
doskey crush-full=crush --yolo $*
doskey copilot=copilot $*
doskey copilot-full=copilot --allow-all-tools $*
doskey amp=amp $*
doskey amp-full=amp --dangerously-allow-all $*
doskey iflow=iflow $*
doskey iflow-full=iflow --yolo $*
doskey aider=aider $*
doskey aider-full=aider --yes-always $*
doskey kimi=kimi $*
doskey kimi-full=kimi --yolo $*
doskey cursor=cursor-agent $*
doskey cursor-full=cursor-agent --force $*
doskey kilo=kilocode $*
doskey auggie=auggie $*

REM --- Resolver raiz del repo desde la ubicacion de este archivo ---
set "UCN_CMD_DIR=%~dp0"
set "UCN_REPO_CMD=%UCN_CMD_DIR%\.."
if not defined UCN_DATA_DIR set "UCN_DATA_DIR=%USERPROFILE%\universida-datos"
if not defined UCN_SHARED_MEMORY_DIR set "UCN_SHARED_MEMORY_DIR=%UCN_DATA_DIR%\ia\memoria-compartida"

REM --- Diagnostico ---
doskey ucn-agents=where codex claude opencode hermes openclaw agy gemini qwen crush copilot amp iflow aider kimi cursor-agent kilocode auggie
doskey ucn-install-ia=powershell -NoProfile -ExecutionPolicy Bypass -Command ". '%UCN_REPO_CMD%\laptop-powershell\Microsoft.PowerShell_profile.ps1' | Out-Null; ucn-install-ia"

REM --- Comandos base (equivale a aliases.sh) ---
doskey ll=dir /a
doskey update=winget upgrade --all
doskey weather=curl.exe -s wttr.in/Puno
doskey sysinfo=systeminfo
doskey editui=notepad "%UCN_REPO_CMD%\config\terminal-ui.conf"

REM --- Navegacion (equivale a aliases.sh) ---
doskey uni=cd /d %USERPROFILE%\universida-datos
doskey notas=cd /d %USERPROFILE%\universida-datos\notas
doskey informes=cd /d %USERPROFILE%\universida-datos\informes
doskey cursos=cd /d %USERPROFILE%\universida-datos\cursos
doskey labs=cd /d %USERPROFILE%\universida-datos\laboratorios
doskey workspace=cd /d %USERPROFILE%\workspace
doskey repos=dir /b /ad %USERPROFILE%\workspace

REM --- Menu solo en sesiones interactivas (AutoRun tambien corre en "cmd /c") ---
echo %CMDCMDLINE% | find /i "/c" >nul && goto :eof
REM ESC para colores ANSI (Windows 10+)
for /F "delims=#" %%a in ('"prompt #$E# & for %%a in (1) do rem"') do set "E=%%a"

REM --- MOTD: datos en config\terminal-ui.conf (fuente unica) ---
set "UCN_UI_CONF=%UCN_REPO_CMD%\config\terminal-ui.conf"
if not exist "%UCN_UI_CONF%" goto :ucn_motd_missing

ECHO.
for /f "usebackq eol=# tokens=1,2,3 delims=|" %%A in ("%UCN_UI_CONF%") do (
  if /i "%%A"=="section" if /i "%%B"=="commands" ECHO   %E%[33m%%C:%E%[0m
)
for /f "usebackq eol=# tokens=1,2,3 delims=|" %%A in ("%UCN_UI_CONF%") do (
  if /i "%%A"=="command" ECHO   %E%[32m%%~B%E%[0m = %%~C
)
ECHO.

for /f "usebackq eol=# tokens=1,2,3 delims=|" %%A in ("%UCN_UI_CONF%") do (
  if /i "%%A"=="section" if /i "%%B"=="agents" ECHO   %E%[33m%%C:%E%[0m
)
ECHO   %E%[35m+----------------------------------------+%E%[0m
ECHO   %E%[35m^|%E%[0m %E%[1;36mAgente          Normal   Full (yolo)  %E%[0m %E%[35m^|%E%[0m
ECHO   %E%[35m^|----------------------------------------^|%E%[0m
set "UCN_MOTD_ANY=0"
for /f "usebackq eol=# tokens=1,2,3,4,5 delims=|" %%A in ("%UCN_UI_CONF%") do (
  if /i "%%A"=="agent" (
    where /q "%%C" >nul 2>&1
    if not errorlevel 1 (
      call :ucn_cmd_agent "%%B" "%%D" "%%E"
      set "UCN_MOTD_ANY=1"
    )
  )
)
if "%UCN_MOTD_ANY%"=="0" ECHO   %E%[35m^|%E%[0m No se detectaron agentes instalados.   %E%[35m^|%E%[0m
ECHO   %E%[35m+----------------------------------------+%E%[0m
ECHO.

for /f "usebackq eol=# tokens=1,2,3 delims=|" %%A in ("%UCN_UI_CONF%") do (
  if /i "%%A"=="section" if /i "%%B"=="productivity" ECHO   %E%[33m%%C:%E%[0m
)
for /f "usebackq eol=# tokens=1,2,3 delims=|" %%A in ("%UCN_UI_CONF%") do (
  if /i "%%A"=="nav" ECHO   %E%[32m%%~B%E%[0m = %%~C
)
ECHO.
goto :ucn_motd_done

:ucn_motd_missing
ECHO.
ECHO   [UCN] No se encontro config\terminal-ui.conf
ECHO.

:ucn_motd_done
set "E="
set "UCN_MOTD_ANY="
set "UCN_UI_CONF="
goto :eof

REM --- Fila del cuadro de agentes (ancho fijo 15/8/13) ---
:ucn_cmd_agent
setlocal EnableDelayedExpansion
set "N=%~1                              "
set "R=%~2                        "
set "F=%~3                              "
set "N=!N:~0,15!"
set "R=!R:~0,8!"
set "F=!F:~0,13!"
ECHO   !E![35m^|!E![0m !N! !E![1;32m! !R! !E![33m! !F! !E![35m^|!E![0m
endlocal
exit /b
