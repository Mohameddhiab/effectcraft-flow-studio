# Builds design/handoff/thumbnails-contact-sheet.png from catalogue.json and assets/thumbs.
# Run from the repository root: powershell -File design/handoff/tools/make_contact_sheet.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$here = Split-Path -Parent $PSScriptRoot            # design/handoff
$repo = Split-Path -Parent (Split-Path -Parent $here)
$cat = Get-Content (Join-Path $here 'catalogue.json') -Raw | ConvertFrom-Json

$cellW = 160; $cellH = 96; $labelH = 22; $nameH = 16; $pad = 8
$cols = 6
$kinds = @('Titles','UI widgets','Text animations','Transitions','Effects','Gradients & generators','Palettes','Captions','Sounds','Tools')
$kindKeys = @('title','widget','text','transition','effect','gradient','palette','caption','sfx','tool')
$rows = $kinds.Count
$w = $pad + $cols * ($cellW + $pad)
$rowH = $labelH + $cellH + $nameH + $pad
$h = $pad + $rows * $rowH

$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.Clear([System.Drawing.ColorTranslator]::FromHtml('#0b0f1a'))

$accent = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#5ce1ff'))
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f5f7fb'))
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#a8b0c2'))
$panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#101526'))
$font = New-Object System.Drawing.Font('Segoe UI', 8)
$fontBold = New-Object System.Drawing.Font('Segoe UI', 9, [System.Drawing.FontStyle]::Bold)

$y = $pad
for ($r = 0; $r -lt $rows; $r++) {
    $key = $kindKeys[$r]
    $g.DrawString($kinds[$r].ToUpper(), $fontBold, $accent, $pad, $y + 2)
    $items = @($cat.items | Where-Object { $_.kind -eq $key } | Select-Object -First $cols)
    $x = $pad
    foreach ($it in $items) {
        $g.FillRectangle($panelBrush, $x, $y + $labelH, $cellW, $cellH)
        $imgPath = Join-Path $repo ('assets/thumbs/' + $it.thumb)
        if (Test-Path $imgPath) {
            $img = [System.Drawing.Image]::FromFile($imgPath)
            $g.DrawImage($img, $x, $y + $labelH, $cellW, $cellH)
            $img.Dispose()
        }
        $name = [string]$it.name
        if ($name.Length -gt 24) { $name = $name.Substring(0, 23) + '…' }
        $g.DrawString($name, $font, $textBrush, $x, $y + $labelH + $cellH + 1)
        $x += $cellW + $pad
    }
    $y += $rowH
}

$out = Join-Path $here 'thumbnails-contact-sheet.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "Wrote $out ($w x $h)"
