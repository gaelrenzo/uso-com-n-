# ==========================================
# POWERSHELL PROFILE - PERSONALIZADO (Laptop)
# Sincronizado y adaptado de la Workstation
# ==========================================

$RepoDir = Join-Path $env:USERPROFILE "workspace\uso-com-n-"
$HermesExe = Join-Path $env:LOCALAPPDATA "hermes\hermes-agent\venv\Scripts\hermes.exe"

# --- ALIASES ---
Set-Alias -Name ll -Value Get-ChildItem -Option ReadOnly
Set-Alias -Name weather -Value Get-Weather -Option ReadOnly
Set-Alias -Name sysinfo -Value Get-SysInfo -Option ReadOnly
Set-Alias -Name editui -Value Edit-Profile -Option ReadOnly
Set-Alias -Name update -Value Update-System -Option ReadOnly

# --- FUNCTIONS ---
function Get-Weather {
    curl.exe -s wttr.in/Puno
}

function Get-SysInfo {
    if (Get-Command fastfetch -ErrorAction SilentlyContinue) {
        fastfetch
    } else {
        systeminfo
    }
}

function Edit-Profile {
    notepad $PROFILE
}

function Update-System {
    Write-Host "[Update] Buscando actualizaciones de Winget..." -ForegroundColor Cyan
    winget upgrade --all
}

function anti {
    agy $args
}

function anti-full {
    agy --dangerously-skip-permissions $args
}

function cl {
    claude $args
}

function cl-full {
    claude --yes $args
}

function ocode {
    opencode $args
}

function ocode-full {
    opencode --agent build $args
}

function codex-full {
    codex --dangerously-bypass-approvals-and-sandbox $args
}

function hermes {
    & $HermesExe $args
}

function hermes-full {
    & $HermesExe --yolo $args
}

# --- HTML FUNCTIONS ---
function html-serve {
    param($Port = 8080)
    Set-Location $RepoDir
    live-server --host=127.0.0.1 --port=$Port
}

function html-push {
    param($Msg = "avance")
    Set-Location $RepoDir
    git pull --rebase
    git add .
    git commit -m $Msg
    git push
}

function html-status {
    Set-Location $RepoDir
    Write-Host "=== RAMA ===" -ForegroundColor Cyan
    git branch
    Write-Host "=== ESTADO ===" -ForegroundColor Cyan
    git status
    Write-Host "=== REMOTO ===" -ForegroundColor Cyan
    git remote -v
    Write-Host "=== ULTIMOS COMMITS ===" -ForegroundColor Cyan
    git log --oneline --decorate -n 5
}

# --- SKILLS SYNC & PUSH (SOLO AGREGAR, NO ELIMINAR) ---
function skills-sync {
    Write-Host "[Sync] Actualizando repositorio y sincronizando skills de agentes..." -ForegroundColor Cyan
    Set-Location $RepoDir
    git pull --rebase
    powershell -ExecutionPolicy Bypass -File (Join-Path $RepoDir "skills\sync-agent-skills.ps1")
    Write-Host "[Sync] Sincronizacion de skills completada!" -ForegroundColor Green
}

function skills-push {
    param($Msg = "update skills")
    Write-Host "[Sync] Subiendo nuevas skills a GitHub (Modo Seguro: Solo Agregar)..." -ForegroundColor Cyan
    Set-Location $RepoDir
    git add --ignore-removal skills/agent-skills/
    git commit -m $Msg
    git push
    Write-Host "[Sync] Skills subidas con exito!" -ForegroundColor Green
}

# --- MOTD (Message of the Day) ---
function Show-MOTD {
    Clear-Host
    Write-Host "=====================================================" -ForegroundColor Magenta
    Write-Host "        Bienvenido de vuelta (Laptop Windows)" -ForegroundColor Green
    Write-Host "        PowerShell + Entorno Sincronizado IA" -ForegroundColor Yellow
    Write-Host "=====================================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  Fecha:      $((Get-Date).ToString('dddd, dd MMMM yyyy'))" -ForegroundColor Cyan
    Write-Host "  Hora:       $((Get-Date).ToString('hh:mm tt'))" -ForegroundColor Cyan
    Write-Host "  Directorio: $(Get-Location)" -ForegroundColor Cyan
    
    try {
        $os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
        if ($os) {
            $total = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
            $free = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
            $used = [math]::Round($total - $free, 2)
            $percent = [math]::Round(($used / $total) * 100, 2)
            Write-Host "  Memoria:    $used GB / $total GB ($percent%)" -ForegroundColor Cyan
        }
    } catch {}
    Write-Host ""
    
    Write-Host "  [ATAJOS RAPIDOS]" -ForegroundColor Yellow
    Write-Host "  update      = Actualiza paquetes de Windows (winget)" -ForegroundColor Green
    Write-Host "  cls         = Limpia la pantalla y recarga el MOTD" -ForegroundColor Green
    Write-Host "  ll          = Listar archivos (Get-ChildItem)" -ForegroundColor Green
    Write-Host "  weather     = Clima en Puno (wttr.in)" -ForegroundColor Green
    Write-Host "  sysinfo     = Informacion de hardware del sistema" -ForegroundColor Green
    Write-Host "  editui      = Editar este perfil de PowerShell" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "  [HERRAMIENTAS IA]" -ForegroundColor Yellow
    Write-Host "  codex / codex-full       = Codex CLI" -ForegroundColor Green
    Write-Host "  anti  / anti-full        = Antigravity (agy)" -ForegroundColor Green
    Write-Host "  cl    / cl-full          = Claude Code" -ForegroundColor Green
    Write-Host "  ocode / ocode-full       = OpenCode" -ForegroundColor Green
    Write-Host "  hermes / hermes-full     = Hermes Agent" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "  [HTML & WEB]" -ForegroundColor Yellow
    Write-Host "  html-serve  = Servir pagina local (live-server)" -ForegroundColor Green
    Write-Host "  html-push   = Git pull + add + commit + push de la web" -ForegroundColor Green
    Write-Host "  html-status = Estado del repositorio git" -ForegroundColor Green
    Write-Host ""

    Write-Host "  [SYNC DE SKILLS]" -ForegroundColor Yellow
    Write-Host "  skills-sync = Sincronizar y actualizar skills locales" -ForegroundColor Green
    Write-Host "  skills-push = Subir skills locales (Modo Seguro: Solo Agregar)" -ForegroundColor Green
    Write-Host ""

    Write-Host "  [COMO USAR LA SINCRONIZACION]" -ForegroundColor Yellow
    Write-Host "  1. Sube cambios locales:  skills-push 'mensaje'" -ForegroundColor Green
    Write-Host "  2. Descarga en otros:    skills-sync" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "  Skills sincronizadas y protegidas contra eliminaciones." -ForegroundColor Yellow
    Write-Host "=====================================================" -ForegroundColor Magenta
}

# Sobrescribir clear/cls para mostrar el MOTD
function cls {
    Show-MOTD
}

# Iniciar cargando el MOTD
Show-MOTD
