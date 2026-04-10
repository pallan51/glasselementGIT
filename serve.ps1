# Simple PowerShell HTTP Server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server running at http://localhost:8080/"

$mimeTypes = @{
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".json" = "application/json"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = $context.Request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $filePath = Join-Path $root $path.TrimStart("/").Replace("/", "\")

    if (Test-Path $filePath) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
        $context.Response.ContentType = $mime
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $context.Response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
        $context.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $context.Response.Close()
}
