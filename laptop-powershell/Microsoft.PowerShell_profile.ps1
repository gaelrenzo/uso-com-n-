# ==========================================
# POWERSHELL PROFILE - PERSONALIZADO (Windows)
# Sincronizado y adaptado de la Mochila Digital UCN
# ==========================================

# --- Detectar directorios dinamicamente ---
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

# Buscar el repo en ubicaciones comunes
$PossiblePaths = @(
    (Join-Path $env:USERPROFILE "workspace\uso-com-n-"),
    (Join-Path $env:USERPROFILE "universida-datos\uso-com-n-"),
    (Join-Path $env:USERPROFILE "uso-com-n-"),
    (Join-Path $env:LOCALAPPDATA "uso-com-n-")
)

$RepoDir = $null
foreach ($p in $PossiblePaths) {
    if (Test-Path (Join-Path $p ".git")) {
        $RepoDir = $p
        break
    }
}
if (-not $RepoDir) {
    $RepoDir = Join-Path $env:USERPROFILE "workspace\uso-com-n-"
}

# Directorio de datos del usuario
$DataDir = Join-Path $env:USERPROFILE "universida-datos"
$NotesDir = Join-Path $DataDir "notas"
$InformesDir = Join-Path $DataDir "informes"
$CursosDir = Join-Path $DataDir "cursos"

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

# --- SKILLS SYNC & PUSH ---
function skills-sync {
    Write-Host "[Sync] Actualizando repositorio y sincronizando skills..." -ForegroundColor Cyan
    Set-Location $RepoDir
    git pull --rebase
    $syncScript = Join-Path $RepoDir "skills\sync-agent-skills.ps1"
    if (Test-Path $syncScript) {
        powershell -ExecutionPolicy Bypass -File $syncScript
    } else {
        Write-Host "  ⚠️  Script de sincronizacion no encontrado: $syncScript" -ForegroundColor Yellow
    }
    Write-Host "[Sync] Sincronizacion completada!" -ForegroundColor Green
}

function skills-push {
    param($Msg = "update skills")
    Write-Host "[Sync] Subiendo skills a GitHub (Modo Seguro)..." -ForegroundColor Cyan
    Set-Location $RepoDir
    git add --ignore-removal skills/agent-skills/
    git commit -m $Msg
    git push
    Write-Host "[Sync] Skills subidas!" -ForegroundColor Green
}

# --- UCN FUNCTIONS ---
function ucn-note {
    param([string]$Title = "nota-$(Get-Date -Format 'yyyyMMdd-HHmm')")
    if (-not (Test-Path $NotesDir)) { New-Item -ItemType Directory -Path $NotesDir -Force | Out-Null }
    $File = Join-Path $NotesDir "$(Get-Date -Format 'yyyyMMdd')-$($Title -replace ' ','-').md"
    @"
# $Title

**Fecha:** $(Get-Date -Format 'yyyy-MM-dd HH:mm')

---

## Notas

"@ | Out-File -FilePath $File -Encoding UTF8
    Write-Host "Nota creada: $File" -ForegroundColor Green
}

function ucn-clase {
    param([string]$Subject = "")
    if ($Subject) {
        $Target = Join-Path $CursosDir $Subject
        if (-not (Test-Path $Target)) { New-Item -ItemType Directory -Path $Target -Force | Out-Null }
        Set-Location $Target
    } else {
        Set-Location $DataDir
    }
    Get-ChildItem
}

function ucn-informe {
    param([string]$Title = "informe")
    $Dir = Join-Path $InformesDir ($Title -replace ' ','-')
    if (-not (Test-Path $Dir)) { New-Item -ItemType Directory -Path $Dir -Force | Out-Null }
    $File = Join-Path $Dir "informe.md"
    @"
# $Title

**Fecha:** $(Get-Date -Format 'yyyy-MM-dd')

---

## 1. Objetivo

## 2. Marco teorico

## 3. Materiales y metodos

## 4. Resultados

## 5. Discusion

## 6. Conclusiones

## 7. Referencias

"@ | Out-File -FilePath $File -Encoding UTF8
    Write-Host "Plantilla creada: $File" -ForegroundColor Green
}

function ucn-update {
    Set-Location $RepoDir
    git pull
    Write-Host "UCN actualizado!" -ForegroundColor Green
}

# --- MOTD ---
function Show-MOTD {
    Clear-Host
    Write-Host "=====================================================" -ForegroundColor Magenta
    Write-Host "        Bienvenido de vuelta (Windows)" -ForegroundColor Green
    Write-Host "        UCN - Mochila Digital" -ForegroundColor Yellow
    Write-Host "=====================================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  Fecha:      $((Get-Date).ToString('dddd, dd MMMM yyyy'))" -ForegroundColor Cyan
    Write-Host "  Hora:       $((Get-Date).ToString('hh:mm tt'))" -ForegroundColor Cyan
    Write-Host "  Directorio: $(Get-Location)" -ForegroundColor Cyan
    Write-Host "  Repo:       $RepoDir" -ForegroundColor Cyan
    
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
    Write-Host "  update      = Actualiza paquetes (winget)" -ForegroundColor Green
    Write-Host "  cls         = Limpia pantalla y recarga MOTD" -ForegroundColor Green
    Write-Host "  ll          = Listar archivos" -ForegroundColor Green
    Write-Host "  weather     = Clima en Puno" -ForegroundColor Green
    Write-Host "  sysinfo     = Info del sistema" -ForegroundColor Green
    Write-Host "  editui      = Editar perfil PowerShell" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "  [HERRAMIENTAS IA]" -ForegroundColor Yellow
    Write-Host "  codex / codex-full       = Codex CLI" -ForegroundColor Green
    Write-Host "  anti  / anti-full        = Antigravity (agy)" -ForegroundColor Green
    Write-Host "  cl    / cl-full          = Claude Code" -ForegroundColor Green
    Write-Host "  ocode / ocode-full       = OpenCode" -ForegroundColor Green
    Write-Host "  hermes / hermes-full     = Hermes Agent" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "  [UCN - Mochila Digital]" -ForegroundColor Yellow
    Write-Host "  ucn-note    = Nota rapida Markdown" -ForegroundColor Green
    Write-Host "  ucn-clase   = Abrir carpeta universidad" -ForegroundColor Green
    Write-Host "  ucn-informe = Plantilla de informe" -ForegroundColor Green
    Write-Host "  skills-sync = Sincronizar skills" -ForegroundColor Green
    Write-Host "  skills-push = Subir skills" -ForegroundColor Green
    Write-Host "  ucn-update  = Actualizar UCN" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "  [HTML & WEB]" -ForegroundColor Yellow
    Write-Host "  html-serve  = Servir pagina local" -ForegroundColor Green
    Write-Host "  html-push   = Git add + commit + push" -ForegroundColor Green
    Write-Host "  html-status = Estado del repo" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "=====================================================" -ForegroundColor Magenta
}

function cls {
    Show-MOTD
}

Show-MOTD