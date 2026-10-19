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


# --- Resolutor de binarios de agentes IA (multi-dispositivo) ---
# Orden: 1) Variable de entorno UCN_<AGENTE>_BIN  2) Get-Command (PATH)  3) Rutas conocidas Windows
function Get-UcnAgentBin {
    param([string]$Tool)
    $EnvVar = "UCN_" + $Tool.ToUpper().Replace("-", "_") + "_BIN"
    if ((Test-Path Env:$EnvVar) -and (Test-Path (Get-Item Env:$EnvVar).Value)) {
        return (Get-Item Env:$EnvVar).Value
    }
    # -CommandType Application: ignora las funciones wrapper de este perfil (cl, codex, qwen...)
    $InPath = Get-Command $Tool -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($InPath) { return $InPath.Source }
    # Rutas conocidas de Windows
    $Known = @{
        codex   = @((Join-Path $env:USERPROFILE ".codex\bin\codex.exe"), (Join-Path $env:APPDATA "npm\codex.cmd"))
        claude  = @((Join-Path $env:USERPROFILE ".claude\local\claude.exe"), (Join-Path $env:APPDATA "npm\claude.cmd"))
        opencode= @((Join-Path $env:USERPROFILE ".opencode\bin\opencode.exe"), (Join-Path $env:APPDATA "npm\opencode.cmd"))
        agy     = @((Join-Path $env:USERPROFILE ".local\bin\agy.exe"))
        hermes  = @((Join-Path $env:LOCALAPPDATA "hermes\hermes-agent\venv\Scripts\hermes.exe"), (Join-Path $env:USERPROFILE "hermes-agent\.venv\Scripts\hermes.exe"))
    }
    foreach ($cand in $Known[$Tool]) {
        if ($cand -and (Test-Path $cand)) { return $cand }
    }
    return $null
}

# --- Perfil de especialidad activo (equivalente Windows de UCN_PROFILE) ---
$ProfileFile = Join-Path $RepoDir "config\.current-profile"
if (Test-Path $ProfileFile) {
    $env:UCN_PROFILE = (Get-Content $ProfileFile -Raw).Trim()
}
if (-not $env:UCN_PROFILE) { $env:UCN_PROFILE = "default" }

# Ruta al prompt del perfil activo (generado con: ucn profile export)
function Get-UcnProfilePromptFile {
    $name = $env:UCN_PROFILE
    if (-not $name) { $name = "default" }
    $f = Join-Path $RepoDir "config\profile-prompts\$name.md"
    if (Test-Path $f) { return $f }
    return $null
}

function Invoke-UcnAgent {
    param([string]$Tool, [string]$ExtraArgs = "", [string[]]$UserArgs = @())
    $Bin = Get-UcnAgentBin $Tool
    if (-not $Bin) {
        Write-Host "Agente '$Tool' no instalado en este dispositivo." -ForegroundColor Yellow
        Write-Host "Instalalo o define UCN_$($Tool.ToUpper())_BIN en config\.env" -ForegroundColor Yellow
        return
    }
    $ArgsList = @()
    # Inyeccion del prompt del perfil activo: claude usa --append-system-prompt-file
    if ($Tool -eq "claude") {
        $pp = Get-UcnProfilePromptFile
        if ($pp) {
            $ArgsList += "--append-system-prompt-file", $pp
        }
    }
    if ($ExtraArgs) { $ArgsList += $ExtraArgs.Split(' ') }
    if ($UserArgs.Count -gt 0) { $ArgsList += $UserArgs }
    & $Bin @ArgsList
}

function codex       { Invoke-UcnAgent "codex"       "--no-daemon" $args }
function codex-full  { Invoke-UcnAgent "codex"       "--no-daemon --dangerously-bypass-approvals-and-sandbox" $args }
function anti        { Invoke-UcnAgent "agy"         "" $args }
function anti-full   { Invoke-UcnAgent "agy"         "--dangerously-skip-permissions" $args }
function cl          { Invoke-UcnAgent "claude"      "" $args }
function cl-full     { Invoke-UcnAgent "claude"      "--dangerously-skip-permissions" $args }
function ocode       { Invoke-UcnAgent "opencode"    "" $args }
function ocode-full  { Invoke-UcnAgent "opencode"    "--agent build" $args }
function hermes      { Invoke-UcnAgent "hermes"      "" $args }
function hermes-full { Invoke-UcnAgent "hermes"      "--yolo" $args }

# --- Otras IAs del mercado (funcionan si estan instaladas: ucn-install-ia) ---
function gem          { Invoke-UcnAgent "gemini"       "" $args }
function gem-full     { Invoke-UcnAgent "gemini"       "--yolo" $args }
function qwen         { Invoke-UcnAgent "qwen"         "" $args }
function qwen-full    { Invoke-UcnAgent "qwen"         "--yolo" $args }
function crush        { Invoke-UcnAgent "crush"        "" $args }
function crush-full   { Invoke-UcnAgent "crush"        "--yolo" $args }
function copilot      { Invoke-UcnAgent "copilot"      "" $args }
function copilot-full { Invoke-UcnAgent "copilot"      "--allow-all-tools" $args }
function amp          { Invoke-UcnAgent "amp"          "" $args }
function amp-full     { Invoke-UcnAgent "amp"          "--dangerously-allow-all" $args }
function iflow        { Invoke-UcnAgent "iflow"        "" $args }
function iflow-full   { Invoke-UcnAgent "iflow"        "--yolo" $args }
function aider        { Invoke-UcnAgent "aider"        "" $args }
function aider-full   { Invoke-UcnAgent "aider"        "--yes-always" $args }
function kimi         { Invoke-UcnAgent "kimi"         "" $args }
function kimi-full    { Invoke-UcnAgent "kimi"         "--yolo" $args }
function cursor       { Invoke-UcnAgent "cursor-agent" "" $args }
function cursor-full  { Invoke-UcnAgent "cursor-agent" "--force" $args }
function kilo         { Invoke-UcnAgent "kilocode"     "" $args }
function auggie       { Invoke-UcnAgent "auggie"       "" $args }

$UcnIaTools = @("codex","claude","opencode","hermes","agy","gemini","qwen","crush","copilot","amp","iflow","aider","kimi","cursor-agent","kilocode","auggie")

# Instala las IAs que falten (npm + uv). Una por una: si falla una, sigue.
function ucn-install-ia {
    $npm = [ordered]@{
        codex="@openai/codex"; claude="@anthropic-ai/claude-code"; opencode="opencode-ai"
        gemini="@google/gemini-cli"; qwen="@qwen-code/qwen-code"; crush="@charmland/crush"
        copilot="@github/copilot"; amp="@sourcegraph/amp"; iflow="@iflow-ai/iflow-cli"
        kilocode="@kilocode/cli"; auggie="@augmentcode/auggie"
    }
    foreach ($bin in $npm.Keys) {
        if (Get-UcnAgentBin $bin) { Write-Host "OK $bin" -ForegroundColor Green; continue }
        Write-Host "-> npm i -g $($npm[$bin])" -ForegroundColor Cyan
        npm install -g $npm[$bin]
    }
    foreach ($p in @(@("aider","aider-chat"), @("kimi","kimi-cli"))) {
        if (-not (Get-UcnAgentBin $p[0])) { uv tool install $p[1] }
    }
    if (-not (Get-UcnAgentBin "cursor-agent")) {
        Write-Host "cursor-agent: instalar manual desde https://cursor.com/cli" -ForegroundColor Yellow
    }
    ucn-agents
}

function ucn-agents {
    Write-Host "=== Agentes IA detectados en Windows ===" -ForegroundColor Cyan
    foreach ($t in $UcnIaTools) {
        $b = Get-UcnAgentBin $t
        if ($b) { Write-Host ("  {0,-13} -> {1}" -f $t, $b) -ForegroundColor Green }
        else    { Write-Host ("  {0,-13} -> (no instalado)" -f $t) -ForegroundColor DarkGray }
    }
}

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
    
    Write-Host "  [HERRAMIENTAS IA]  (<cmd>-full = modo sin confirmaciones)" -ForegroundColor Yellow
    Write-Host "  cl      Claude Code     codex   Codex          gem     Gemini CLI" -ForegroundColor Green
    Write-Host "  ocode   OpenCode        anti    Antigravity    hermes  Hermes Agent" -ForegroundColor Green
    Write-Host "  qwen    Qwen Code       crush   Crush          copilot GitHub Copilot" -ForegroundColor Green
    Write-Host "  amp     Amp             iflow   iFlow          aider   Aider" -ForegroundColor Green
    Write-Host "  kimi    Kimi CLI        cursor  Cursor Agent   kilo    Kilo Code (sin -full)" -ForegroundColor Green
    Write-Host "  auggie  Augment (sin -full)" -ForegroundColor Green
    Write-Host "  ucn-agents = Ver instaladas   ucn-install-ia = Instalar las que falten" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "=====================================================" -ForegroundColor Magenta
}

function cls {
    Show-MOTD
}

Show-MOTD