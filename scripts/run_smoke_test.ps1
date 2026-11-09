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

    # The CLI answers with a JSON array and every script result keeps its newlines escaped, so the
    # raw text has no line starts to match. Decode the nested result objects first, then count.
    $decoded = $text
    try {
        $start = $text.IndexOf("[")
        if ($start -lt 0) { throw "no JSON array in the CLI output" }
        $doc = ConvertFrom-Json -InputObject $text.Substring($start)
        $lines = New-Object System.Collections.Generic.List[string]
        foreach ($entry in @($doc)) {
            $r = $entry.result
            if ($r -is [string]) {
                $lines.Add($r)
                continue
            }
            if ($r -and $r.PSObject.Properties["result"] -and $r.result -is [string]) {
                $lines.Add($r.result)
                if ($r.error) { $lines.Add("FAIL " + [string]$r.error) }
                continue
            }
            if ($entry.PSObject.Properties["error"] -and $entry.error) {
                $lines.Add("FAIL " + [string]$entry.error)
            }
        }
        $decoded = $lines -join "`n"
    } catch {
        Write-Host "Could not decode the CLI JSON output; counting the raw text instead."
    }
    [System.IO.File]::WriteAllText((Join-Path $root "target\test-report.txt"), $decoded, [System.Text.Encoding]::UTF8)

    $pass = ([regex]::Matches($decoded, '(?m)^PASS ')).Count
    $fail = ([regex]::Matches($decoded, '(?m)^FAIL ')).Count
    Write-Host "PASS=$pass FAIL=$fail"
    if ($fail -gt 0 -or $pass -eq 0) { exit 1 }
} finally {
    if ($helperProc -and !$helperProc.HasExited) {
        Stop-Process -Id $helperProc.Id -Force
        Write-Host "Helper process stopped."
    }
}
