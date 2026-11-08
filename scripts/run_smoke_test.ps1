param(
    [string]$Cli = $env:EFFECTCRAFT_CLI,
    [string]$Helper = $env:EFFECTCRAFT_FLOW_HELPER,
    [int]$Port = 9890
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not $Cli) { $Cli = "effectcraft-cli" }
if (-not $Helper) { $Helper = "effectcraft-flow-helper" }

$flowDir = Join-Path $root "target\flowtest"
New-Item -ItemType Directory -Force -Path $flowDir | Out-Null
$env:EFFECTCRAFT_FLOW_DIR = $flowDir

& (Join-Path $PSScriptRoot "build_steps.ps1")
if (!(Test-Path (Join-Path $root "target\steps.json"))) {
    throw "target/steps.json was not created"
}

$helperProc = Start-Process -FilePath $Helper -ArgumentList @("serve", "--port", "$Port") -PassThru -NoNewWindow
Start-Sleep -Seconds 2
try {
    Write-Host "Running the Flow Studio smoke suite through $Cli (helper on port $Port)..."
    $res = & $Cli run --commands (Join-Path $root "target\steps.json") --empty --json 2>&1
    $text = $res -join "`n"
    [System.IO.File]::WriteAllText((Join-Path $root "target\test-output.txt"), $text, [System.Text.Encoding]::UTF8)
    $pass = ([regex]::Matches($text, '(?m)^PASS ')).Count
    $fail = ([regex]::Matches($text, '(?m)^FAIL ')).Count
    Write-Host "PASS=$pass FAIL=$fail"
    if ($fail -gt 0) { exit 1 }
} finally {
    if ($helperProc -and !$helperProc.HasExited) {
        Stop-Process -Id $helperProc.Id -Force
        Write-Host "Helper process stopped."
    }
}
