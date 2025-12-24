
Add-Type -AssemblyName System.Drawing

$sourcePath = "public\pwa-icon-512.png"
$target512 = "public\pwa-icon-512.png"
$target192 = "public\pwa-icon-192.png"

# Check if source exists
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source file not found: $sourcePath"
    exit 1
}

# Create a temp copy to avoid file locking issues when overwriting
$tempPath = [System.IO.Path]::GetTempFileName()
Copy-Item $sourcePath $tempPath

try {
    $img = [System.Drawing.Image]::FromFile($tempPath)
    
    function Save-ResizedImage {
        param ($image, $width, $height, $outputPath)
        
        $rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
        $dest = New-Object System.Drawing.Bitmap $width, $height
        $dest.SetResolution($image.HorizontalResolution, $image.VerticalResolution)
        
        $g = [System.Drawing.Graphics]::FromImage($dest)
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        
        $g.DrawImage($image, $rect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel)
        
        $dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $g.Dispose()
        $dest.Dispose()
        
        Write-Host "Success: Created $width x $height icon at $outputPath"
    }

    # Resize to 512x512
    Save-ResizedImage -image $img -width 512 -height 512 -outputPath $target512
    
    # Resize to 192x192
    Save-ResizedImage -image $img -width 192 -height 192 -outputPath $target192

    $img.Dispose()
}
catch {
    Write-Error "An error occurred: $_"
}
finally {
    if (Test-Path $tempPath) {
        Remove-Item $tempPath
    }
}
