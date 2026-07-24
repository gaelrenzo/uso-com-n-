# UCN Skills Manager (Windows PowerShell)
# Sincroniza las skills compartidas con los agentes instalados.
# Uso: .\install-skills.ps1

$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$SyncScript = Join-Path $ScriptDir "skills\sync-agent-skills.ps1"

Write-Host "=== UCN Skills Manager ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $SyncScript)) {
    Write-Host "No se encontro el sincronizador: $SyncScript" -ForegroundColor Red
    Write-Host "Intentando con el script bash via Git Bash..." -ForegroundColor Yellow
    $BashScript = Join-Path $ScriptDir "install-agent-skills.sh"
    if (Test-Path $BashScript) {
        & bash $BashScript
    } else {
        Write-Host "No se encontro ningun script de instalacion de skills" -ForegroundColor Red
        exit 1
    }
} else {
    & powershell -ExecutionPolicy Bypass -File $SyncScript
}

Write-Host ""
Write-Host "Listo! Skills sincronizadas desde: $(Join-Path $ScriptDir 'skills\agent-skills')" -ForegroundColor Cyan