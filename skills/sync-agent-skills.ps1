# ==============================================================================
# Sincronizador de Skills para Agentes IA (Windows)
# Crea uniones de directorios (Junctions) desde el repositorio a cada agente
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoSkillsDir = Join-Path $ScriptDir "agent-skills"

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
                    $BackupPath = $DestLink + "_backup"
                    Write-Host "  Saving backup of existing directory at: $BackupPath" -ForegroundColor DarkYellow
                    Rename-Item -Path $DestLink -NewName ($SkillDir.Name + "_backup") -Force
                }
            }
            
            # Crear Junction en Windows (no requiere privilegios de administrador)
            New-Item -ItemType Junction -Path $DestLink -Value $SkillDir.FullName | Out-Null
            Write-Host "  Linked at: $DestLink" -ForegroundColor Green
        }
    }
}

Write-Host "Sync completed successfully!" -ForegroundColor Green
