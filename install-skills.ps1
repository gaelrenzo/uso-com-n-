# UCN Skills Manager
# Sincroniza las skills compartidas con los agentes instalados.
# Uso: .\install-skills.ps1

$ScriptDir = $PSScriptRoot
$SyncScript = Join-Path $ScriptDir "skills\sync-agent-skills.ps1"

Write-Host "=== UCN Skills Manager ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $SyncScript)) {
    Write-Host "No se encontró el sincronizador: $SyncScript" -ForegroundColor Red
    exit 1
}

& powershell -ExecutionPolicy Bypass -File $SyncScript

Write-Host ""
Write-Host "Listo! Skills sincronizadas desde: $(Join-Path $ScriptDir 'skills\agent-skills')" -ForegroundColor Cyan
