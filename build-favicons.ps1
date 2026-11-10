Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "logo-icon-ivory.png").Path
$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

function CreateFavicon($size, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background color: Deep Emerald #026047
    $bgColor = [System.Drawing.Color]::FromArgb(255, 2, 96, 71)
    
    # Draw rounded rectangle
    $radius = [int]($size * 0.22)
    $diameter = $radius * 2
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    
    $path.AddArc(0, 0, $diameter, $diameter, 180, 90)
    $path.AddArc($size - $diameter, 0, $diameter, $diameter, 270, 90)
    $path.AddArc($size - $diameter, $size - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc(0, $size - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    $brush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillPath($brush, $path)

    # Optional subtle border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 253, 232), [Math]::Max(1.0, $size * 0.03))
    $g.DrawPath($pen, $path)

    # Calculate bird position (centered with padding)
    $padding = [int]($size * 0.16)
    $destW = $size - ($padding * 2)
    # Bird aspect ratio: 522w x 388h = ~1.345
    $destH = [int]($destW * (388.0 / 522.0))
    $destX = $padding
    $destY = [int](($size - $destH) / 2.0)

    $srcCrop = New-Object System.Drawing.Rectangle(10, 10, 522, 388)
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
    $g.DrawImage($srcBmp, $destRect, $srcCrop, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Dispose()
    $brush.Dispose()
    $pen.Dispose()
    $path.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $outputPath ($($size)x$($size))"
}

CreateFavicon 180 "apple-touch-icon.png"
CreateFavicon 64 "favicon.png"
CreateFavicon 32 "favicon-32x32.png"
CreateFavicon 16 "favicon-16x16.png"

# Also create favicon.ico from 32x32
$bmp32 = [System.Drawing.Bitmap]::FromFile((Resolve-Path "favicon-32x32.png").Path)
$hIcon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream("favicon.ico", [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$bmp32.Dispose()
Write-Host "Created favicon.ico"

$srcBmp.Dispose()
