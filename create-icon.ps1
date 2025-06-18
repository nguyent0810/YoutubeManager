# PowerShell script to create a simple ICO file
# This creates a basic red circle icon for YouTube Manager

Add-Type -AssemblyName System.Drawing

# Create a 256x256 bitmap
$bitmap = New-Object System.Drawing.Bitmap(256, 256)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Set high quality rendering
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Create brushes and pens
$redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 0, 0))
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$blackPen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 2)

# Draw background circle (YouTube red)
$graphics.FillEllipse($redBrush, 20, 20, 216, 216)
$graphics.DrawEllipse($blackPen, 20, 20, 216, 216)

# Draw YouTube play button background (white rectangle)
$playRect = New-Object System.Drawing.Rectangle(80, 100, 96, 56)
$graphics.FillRectangle($whiteBrush, $playRect)

# Draw play triangle (red)
$playPoints = @(
    [System.Drawing.Point]::new(110, 115),
    [System.Drawing.Point]::new(110, 141),
    [System.Drawing.Point]::new(135, 128)
)
$graphics.FillPolygon($redBrush, $playPoints)

# Draw "YTM" text
$font = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Bold)
$textRect = New-Object System.Drawing.Rectangle(0, 180, 256, 40)
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("YTM", $font, $whiteBrush, $textRect, $stringFormat)

# Save as PNG first (ICO creation is complex in PowerShell)
$bitmap.Save("assets\youtube-manager-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Clean up
$graphics.Dispose()
$bitmap.Dispose()
$redBrush.Dispose()
$whiteBrush.Dispose()
$blackPen.Dispose()
$font.Dispose()

Write-Host "Icon created as youtube-manager-icon.png"
Write-Host "You can convert this to ICO using online tools or rename it for now"
