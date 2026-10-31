# ==============================================================================
# Sincronizador de Skills para Agentes IA (Windows)
# Crea uniones de directorios (Junctions) desde el repositorio a cada agente
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoSkillsDir = Join-Path $ScriptDir "agent-skills"

# ucn es la implementacion principal; este script cubre el arranque sin Go
if (Get-Command ucn -ErrorAction SilentlyContinue) {
    $env:UCN_REPO_DIR = Split-Path -Parent $ScriptDir
    ucn skills sync
    if ($LASTEXITCODE -eq 0) { exit 0 }
    Write-Host "ucn could not sync; using the PowerShell fallback" -ForegroundColor Yellow
}

Write-Host "Syncing agent skills from: $RepoSkillsDir" -ForegroundColor Cyan

$HomeDir = [System.Environment]::GetFolderPath("UserProfile")

$TargetDirs = @(
    (Join-Path $HomeDir ".agents\skills"),
    (Join-Path $HomeDir ".claude\skills"),
    (Join-Path $HomeDir ".codex\skills"),
    (Join-Path $HomeDir ".config\opencode\skills"),
    (Join-Path $HomeDir ".copilot\skills"),
    (Join-Path $HomeDir ".cursor\skills"),
    (Join-Path $HomeDir ".hermes\skills"),
    (Join-Path $HomeDir ".antigravitycli\skills"),
    (Join-Path $HomeDir ".gemini\skills"),
    (Join-Path $HomeDir ".gemini\antigravity-cli\skills")
)

# Asegurar que el origen exista
if (!(Test-Path $RepoSkillsDir)) {
    New-Item -ItemType Directory -Path $RepoSkillsDir -Force | Out-Null
}

# Obtener cada skill del repositorio
Get-ChildItem -Path $RepoSkillsDir -Directory | ForEach-Object {
    $SkillDir = $_
    Write-Host "Processing skill: $($SkillDir.Name)" -ForegroundColor Yellow
    
    foreach ($TargetDir in $TargetDirs) {
        $AgentBase = Split-Path -Parent $TargetDir
        
        # Si la carpeta base del agente existe, realizamos la vinculacion
        if (Test-Path $AgentBase) {
            if (!(Test-Path $TargetDir)) {
                New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
            }
            
            $DestLink = Join-Path $TargetDir $SkillDir.Name
            
            # Si ya existe, ver que tipo de elemento es
            if (Test-Path $DestLink) {
                $Item = Get-Item $DestLink
                if ($Item.Attributes -match "ReparsePoint") {
                    # Es una union o symlink existente, lo eliminamos para recrearlo
                    [System.IO.Directory]::Delete($DestLink)
                } else {
                    # Carpeta real, la respaldamos
                    # Nunca pisar un respaldo anterior; "ucn skills clean" busca el sufijo _backup
                    $BackupPath = $DestLink + "_backup"
                    $N = 2
                    while (Test-Path -LiteralPath $BackupPath) {
                        $BackupPath = "{0}_{1}_backup" -f $DestLink, $N
                        $N++
                    }
                    Write-Host "  Saving backup of existing directory at: $BackupPath" -ForegroundColor DarkYellow
                    Rename-Item -Path $DestLink -NewName (Split-Path -Leaf $BackupPath) -Force
                }
            }
            
            # Crear Junction en Windows (no requiere privilegios de administrador)
            New-Item -ItemType Junction -Path $DestLink -Value $SkillDir.FullName | Out-Null
            Write-Host "  Linked at: $DestLink" -ForegroundColor Green
        }
    }
}

Write-Host "Sync completed successfully!" -ForegroundColor Green
