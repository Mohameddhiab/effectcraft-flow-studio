# Installs ONLY the Flow Studio panel into EffectCraft's Scripts folder (Windows).
# EffectCraft itself must already be installed; this script does not build, copy or modify the app.
# The Scripts folder lives in %APPDATA%\EffectCraft (or EFFECTCRAFT_CONFIG_DIR) and is not replaced
# by EffectCraft updates.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$config = $env:EFFECTCRAFT_CONFIG_DIR
if (-not $config) { $config = Join-Path $env:APPDATA "EffectCraft" }
$panels = Join-Path $config "Scripts\ScriptUI Panels"
$source = Join-Path $root "extensions\scriptui-panels\Flow Studio.jsx"
$dest = Join-Path $panels "Flow Studio.jsx"
if (-not (Test-Path $source)) {
    Write-Host "Missing panel file: $source"
    exit 1
}
New-Item -ItemType Directory -Force -Path $panels | Out-Null
if (Test-Path $dest) {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backup = "$dest.$stamp.bak"
    Copy-Item -Force $dest $backup
    Write-Host "Backup of the previous panel: $backup"
}
Copy-Item -Force $source $dest
Write-Host "Installed: $dest"
Write-Host "Restart EffectCraft, then open Window > Flow Studio.jsx."
Write-Host "Optional helper (silence, captions, sounds, models): run effectcraft-flow-helper.exe serve."
