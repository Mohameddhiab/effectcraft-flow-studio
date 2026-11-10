param(
    [string]$Cli = $env:EFFECTCRAFT_CLI,
    [string]$Helper = $env:EFFECTCRAFT_FLOW_HELPER,
    [int]$Port = 9890
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not $Cli) { $Cli = "effectcraft-cli" }
if (-not $Helper) { $Helper = "effectcraft-flow-helper" }

# Same runtime layout as the smoke suite: sounds need the helper and the pack.
$flowDir = Join-Path $root "target\flowtest"
New-Item -ItemType Directory -Force -Path $flowDir | Out-Null
$env:EFFECTCRAFT_FLOW_DIR = $flowDir
$env:EFFECTCRAFT_FLOW_ASSETS = Join-Path $root "assets\sfx-pack"

node (Join-Path $PSScriptRoot "build_coverage_steps.js")
$helperProc = Start-Process -FilePath $Helper -ArgumentList @("serve", "--port", "$Port") -PassThru -NoNewWindow
Start-Sleep -Seconds 2
try {
    $res = & $Cli run --commands (Join-Path $root "target\coverage-steps.json") --empty --json 2>&1
    $text = $res -join "`n"
    [System.IO.File]::WriteAllText((Join-Path $root "target\coverage-output.txt"), $text, [System.Text.Encoding]::UTF8)
    $decoded = $text
    try {
        $start = $text.IndexOf("[")
        if ($start -lt 0) { throw "no JSON array in the CLI output" }
        $doc = ConvertFrom-Json -InputObject $text.Substring($start)
        $lines = New-Object System.Collections.Generic.List[string]
        foreach ($entry in @($doc)) {
            $r = $entry.result
            if ($r -is [string]) { $lines.Add($r); continue }
            if ($r -and $r.PSObject.Properties["result"] -and $r.result -is [string]) {
                $lines.Add($r.result)
                if ($r.error) { $lines.Add("FAIL " + [string]$r.error) }
                continue
            }
            if ($entry.PSObject.Properties["error"] -and $entry.error) { $lines.Add("FAIL " + [string]$entry.error) }
        }
        $decoded = $lines -join "`n"
    } catch {
        Write-Host "Could not decode the CLI JSON output."
    }
    [System.IO.File]::WriteAllText((Join-Path $root "target\coverage-report.txt"), $decoded, [System.Text.Encoding]::UTF8)
    $decoded -split "`n" | Where-Object { $_ -match '^(FAIL|SUMMARY)' }
    $fail = ([regex]::Matches($decoded, '(?m)^FAIL ')).Count
    $pass = ([regex]::Matches($decoded, '(?m)^PASS ')).Count
    Write-Host "PASS=$pass FAIL=$fail"
    if ($fail -gt 0 -or $pass -eq 0) { exit 1 }
} finally {
    if ($helperProc -and !$helperProc.HasExited) {
        Stop-Process -Id $helperProc.Id -Force
        Write-Host "Helper process stopped."
    }
}
