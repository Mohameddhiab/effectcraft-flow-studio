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

# Sound-effect pack: copied to <settings>/FlowStudio/assets/sfx-pack so the helper
# (sfx.pack.list) can find it at runtime.
$sfxSource = Join-Path $root "assets\sfx-pack"
$sfxDest = Join-Path $config "FlowStudio\assets\sfx-pack"
if (Test-Path $sfxSource) {
    if (Test-Path $sfxDest) {
        $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backup = "$sfxDest.$stamp.bak"
        Move-Item -Force $sfxDest $backup
        Write-Host "Backup of the previous pack: $backup"
    }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $sfxDest) | Out-Null
    Copy-Item -Recurse -Force $sfxSource $sfxDest
    Write-Host "Installed sound pack: $sfxDest"
} else {
    Write-Host "No assets/sfx-pack found alongside the panel; sounds will fall back to built-in."
}
Write-Host "Restart EffectCraft, then open Window > Flow Studio.jsx."
Write-Host "Optional helper (silence, captions, sounds, models): run effectcraft-flow-helper.exe serve."
