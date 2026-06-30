# UCN Skills Manager
# Instala skills en todos los agentes de IA de la laptop
# Uso: .\install-skills.ps1

$agents = @("claude", "cursor", "codex", "opencode")
$skillsDir = "$PSScriptRoot\skills\agent-skills"

Write-Host "=== UCN Skills Manager ===" -ForegroundColor Cyan
Write-Host ""

# List available skills
$skills = Get-ChildItem $skillsDir -Directory | Select-Object -ExpandProperty Name
Write-Host "Skills disponibles: $($skills.Count)" -ForegroundColor Green
Write-Host ""

# Install to each agent
foreach ($agent in $agents) {
    if ($agent -eq "opencode") {
        $agentDir = "$env:USERPROFILE\.config\opencode\skills"
    } else {
        $agentDir = "$env:USERPROFILE\.$agent\skills"
    }
    
    if (-not (Test-Path $agentDir)) {
        New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
    }
    
    $count = 0
    foreach ($skill in $skills) {
        $src = "$skillsDir\$skill"
        $dst = "$agentDir\$skill"
        Copy-Item $src $dst -Recurse -Force
        $count++
    }
    
    Write-Host "[$agent] $count skills instaladas en $agentDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "Listo! Skills instaladas en: $($agents -join ', ')" -ForegroundColor Cyan
