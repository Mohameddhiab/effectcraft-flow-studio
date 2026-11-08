$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$panel = Join-Path $root "extensions/scriptui-panels/Flow Studio.jsx"
$smoke = Join-Path $root "flow-install/tests/smoke-test.jsx"
$target = Join-Path $root "target"
New-Item -ItemType Directory -Force -Path $target | Out-Null

$p1 = [System.IO.File]::ReadAllText($panel, [System.Text.Encoding]::UTF8)
$p2 = [System.IO.File]::ReadAllText($smoke, [System.Text.Encoding]::UTF8)
$all = $p1 + [Environment]::NewLine + $p2
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $target "flow-all.jsx"), $all, $utf8NoBom)

$step1 = @{
    command = "prefs.set"
    params = @{
        key = "scripting.allowScriptsWriteFiles"
        value = $true
    }
}
$step2 = @{
    command = "script.run"
    params = @{
        code = $all
        name = "flow-all.jsx"
    }
}
$steps = @($step1, $step2)
$json = ConvertTo-Json $steps -Depth 10
[System.IO.File]::WriteAllText((Join-Path $target "steps.json"), $json, $utf8NoBom)
Write-Host "Steps written to $target\steps.json"
