# Phoenix Tech Local HTTP Server (PowerShell .NET HttpListener)
param(
    [int]$Port = 5500
)

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "=========================================================="
    Write-Host "🚀 Phoenix Tech Solutions Local Server Active!" -ForegroundColor Green
    Write-Host "🌐 URL: $prefix" -ForegroundColor Cyan
    Write-Host "📁 Document Root: $root"
    Write-Host "Press Ctrl+C to terminate server."
    Write-Host "=========================================================="
} catch {
    Write-Host "Port $Port is in use or blocked. Trying port 8080..." -ForegroundColor Yellow
    $Port = 8080
    $prefix = "http://localhost:$Port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix)
    $listener.Start()
    Write-Host "🌐 Phoenix Tech Local Server listening at $prefix" -ForegroundColor Green
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/" -or $urlPath -eq "") {
            $urlPath = "/index.html"
        }

        # Normalize relative path to prevent directory traversal
        $safePath = $urlPath.TrimStart('/').Replace('/', '\')
        $filePath = Join-Path $root $safePath

        # Security check: Ensure file is within root
        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        if (-not $fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $fullPath -PathType Leaf)) {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            $response.Close()
            continue
        }

        $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
        $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }

        try {
            $fileBytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.StatusCode = 200
            $response.ContentType = $contentType
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.ContentLength64 = $fileBytes.Length
            $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
            $response.Close()
            Write-Host "[200 OK] $urlPath ($($fileBytes.Length) bytes)" -ForegroundColor DarkGray
        } catch {
            try {
                $response.StatusCode = 500
                $response.Close()
            } catch {}
        }
    }
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}

