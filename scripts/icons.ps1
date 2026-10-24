# Genera las imágenes de la app a partir del mismo dibujo que src/icon.svg (pergamino con pluma, coordenadas sobre 256):
#   favicon.ico (16 a 256 px), apple-touch-icon.png (180 px) y social-card.png (1200x630, para Open Graph).
# Uso (Windows, PowerShell 5.1 o superior): powershell -File scripts/icons.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot

$ink = '#3a2410'; $paper = '#f0d9a8'; $gold = '#d9a54a'; $night = '#0f0d0a'; $muted = '#a39a8a'; $light = '#ece5d8'

function Col($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
function Brush($hex) { New-Object System.Drawing.SolidBrush (Col $hex) }
function Pen($hex, $w) { $p = New-Object System.Drawing.Pen (Col $hex), ([float]$w); $p.StartCap = 'Round'; $p.EndCap = 'Round'; $p.LineJoin = 'Round'; $p }
function W($s, $w, $min) { [Math]::Max($w * $s, $min) }
function RR($s, $ox, $oy, $x, $y, $w, $h, $r) {
  $g = New-Object System.Drawing.Drawing2D.GraphicsPath
  $x = $ox + $x * $s; $y = $oy + $y * $s; $w *= $s; $h *= $s; $d = 2 * $r * $s
  $g.AddArc($x, $y, $d, $d, 180, 90); $g.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $g.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90); $g.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $g.CloseFigure(); $g
}

# Ojo: en PowerShell las variables no distinguen mayúsculas ($P y $p son la misma); de ahí los nombres largos.
# El icono: escala $s (tamaño/256) con origen en ($ox, $oy). A 16 px se omiten los renglones, que solo ensucian.
function Draw-Icon($g, $s, $ox, $oy) {
  $size = 256 * $s
  $toPoint = { param($x, $y) New-Object System.Drawing.PointF ([float]($ox + $x * $s)), ([float]($oy + $y * $s)) }
  $drawLine = { param($pen, $x1, $y1, $x2, $y2) $g.DrawLine($pen, (& $toPoint $x1 $y1), (& $toPoint $x2 $y2)) }
  $o = W $s 9 1.4
  $g.FillPath((Brush $paper), (RR $s $ox $oy 0 0 256 256 56))
  $g.DrawRectangle((Pen $ink $o), [float]($ox + 66 * $s), [float]($oy + 62 * $s), [float](108 * $s), [float](134 * $s))
  foreach ($y in 44, 180) { $r = RR $s $ox $oy 50 $y 140 32 16; $g.FillPath((Brush $gold), $r); $g.DrawPath((Pen $ink $o), $r) }
  if ($size -ge 24) { $rule = Pen $ink (W $s 8 1); & $drawLine $rule 84 102 148 102; & $drawLine $rule 84 124 140 124; & $drawLine $rule 84 146 124 146 }
  $feather = [System.Drawing.PointF[]]@((& $toPoint 216 30), (& $toPoint 178 56), (& $toPoint 144 124), (& $toPoint 136 148), (& $toPoint 156 124), (& $toPoint 206 64))
  $g.FillPolygon((Brush $ink), $feather)
  & $drawLine (Pen $ink (W $s 8 1.3)) 216 30 124 170
}

function New-Canvas($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.PixelOffsetMode = 'HighQuality'; $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.Clear([System.Drawing.Color]::Transparent)
  return $bmp, $g
}
# La coma evita que PowerShell desenrolle el byte[] en bytes sueltos al devolverlo.
function Png-Bytes($bmp) { $ms = New-Object System.IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); ,$ms.ToArray() }

# favicon.ico: un PNG por tamaño dentro del contenedor ICO (válido desde Windows Vista y en todos los navegadores).
$sizes = 16, 24, 32, 48, 64, 256
$pngs = foreach ($size in $sizes) { $bmp, $g = New-Canvas $size $size; Draw-Icon $g ($size / 256) 0 0; $g.Dispose(); ,(Png-Bytes $bmp); $bmp.Dispose() }
$ico = New-Object System.IO.MemoryStream; $bw = New-Object System.IO.BinaryWriter $ico
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $dim = [byte]($sizes[$i] % 256)
  $bw.Write($dim); $bw.Write($dim); $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([UInt16]1); $bw.Write([UInt16]32)
  $bw.Write([UInt32]$pngs[$i].Length); $bw.Write([UInt32]$offset); $offset += $pngs[$i].Length
}
foreach ($png in $pngs) { $bw.Write([byte[]]$png) }
[IO.File]::WriteAllBytes((Join-Path $root 'public/favicon.ico'), $ico.ToArray())

# apple-touch-icon.png: iOS recorta las esquinas él mismo, así que va a sangre (sin fondo redondeado transparente).
$bmp, $g = New-Canvas 180 180; $g.Clear((Col $paper)); Draw-Icon $g (180 / 256) 0 0; $g.Dispose()
$bmp.Save((Join-Path $root 'public/apple-touch-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()

# social-card.png: 1200x630, lo que muestran Discord, WhatsApp, Reddit o X al compartir el enlace.
$bmp, $g = New-Canvas 1200 630; $g.Clear((Col $night))
$g.FillRectangle((Brush $gold), 0, 622, 1200, 8)
Draw-Icon $g (300 / 256) 90 165
$title = New-Object System.Drawing.Font 'Georgia', 58, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$sub = New-Object System.Drawing.Font 'Segoe UI', 30, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$small = New-Object System.Drawing.Font 'Segoe UI', 24, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('Gemas de la Build', $title, (Brush $gold), 450, 190)
$g.DrawString('Guía de leveling para Path of Exile', $sub, (Brush $light), 452, 278)
$g.DrawString("Pega tu build de Path of Building y sigue la campaña`nzona por zona: gemas, compras, equipo y árbol.", $small, (Brush $muted), 452, 340)
$g.Dispose(); $bmp.Save((Join-Path $root 'public/social-card.png'), [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
"favicon.ico, apple-touch-icon.png y social-card.png generados en $rootpublic"
