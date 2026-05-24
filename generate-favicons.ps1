Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "assets/images/favicon.jpg").Path
$src = [System.Drawing.Bitmap]::new($srcPath)
$w = $src.Width; $h = $src.Height
Write-Host "Source: $w x $h"

# Lock pixels for fast bbox detection
$rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$src.UnlockBits($data)

$threshold = 60  # luminance threshold — gold ~150+, black bg <30
$minX = $w; $maxX = 0; $minY = $h; $maxY = 0
for ($y = 0; $y -lt $h; $y++) {
  $row = $y * $stride
  for ($x = 0; $x -lt $w; $x++) {
    $i = $row + ($x * 3)
    # BGR order in Format24bppRgb
    $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
    $lum = 0.299 * $r + 0.587 * $g + 0.114 * $b
    if ($lum -gt $threshold) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}

Write-Host "Crown bbox: ($minX, $minY) to ($maxX, $maxY)  size: $($maxX - $minX) x $($maxY - $minY)"

$cx = ($minX + $maxX) / 2.0
$cy = ($minY + $maxY) / 2.0
$crownDim = [Math]::Max($maxX - $minX, $maxY - $minY)
# 24% total padding -> crown ~76% of canvas (fits Android's 80% safe circle)
$canvasSize = [int][Math]::Round($crownDim * 1.24)
$cropX = [int][Math]::Round($cx - $canvasSize / 2.0)
$cropY = [int][Math]::Round($cy - $canvasSize / 2.0)

Write-Host "Square crop: ($cropX, $cropY) size $canvasSize"

$ink = [System.Drawing.Color]::FromArgb(10, 8, 7)
$sizes = [ordered]@{
  'favicon-32.png'        = 32
  'apple-touch-icon.png'  = 180
  'favicon-192.png'       = 192
  'favicon-512.png'       = 512
}

foreach ($name in $sizes.Keys) {
  $size = $sizes[$name]
  $bmp = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode   = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode       = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode     = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality  = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear($ink)
  $srcRect = [System.Drawing.Rectangle]::new($cropX, $cropY, $canvasSize, $canvasSize)
  $dstRect = [System.Drawing.Rectangle]::new(0, 0, $size, $size)
  $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $outPath = (Join-Path (Resolve-Path "assets/images").Path $name)
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  $len = (Get-Item $outPath).Length
  Write-Host "  -> $name  ($size x $size, $len bytes)"
}

$src.Dispose()
Write-Host "Done."
