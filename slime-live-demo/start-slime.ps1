$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$port = 8765
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
try {
  $listener.Start()
  Write-Host "Slime LIVE hazir: http://127.0.0.1:$port/?obs=1" -ForegroundColor Green
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { $client.Close(); continue }
      while (($header = $reader.ReadLine()) -ne $null -and $header -ne "") {}
      $parts = $requestLine.Split(" ")
      $urlPath = [Uri]::UnescapeDataString(($parts[1] -split '\?')[0])
      if ($urlPath -eq "/") { $urlPath = "/index.html" }
      $relative = $urlPath.TrimStart('/') -replace '/', [System.IO.Path]::DirectorySeparatorChar
      $file = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $relative))
      if (-not $file.StartsWith([System.IO.Path]::GetFullPath($root), [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
        $status = "404 Not Found"; $body = [System.Text.Encoding]::UTF8.GetBytes("Not found"); $type = "text/plain; charset=utf-8"
      } else {
        $status = "200 OK"
        $body = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
        $type = switch ($ext) {
          ".html" { "text/html; charset=utf-8" }
          ".js" { "text/javascript; charset=utf-8" }
          ".css" { "text/css; charset=utf-8" }
          ".json" { "application/json; charset=utf-8" }
          ".png" { "image/png" }
          ".jpg" { "image/jpeg" }
          ".jpeg" { "image/jpeg" }
          ".svg" { "image/svg+xml" }
          ".webp" { "image/webp" }
          ".mp4" { "video/mp4" }
          default { "application/octet-stream" }
        }
      }
      $crlf = [char]13 + [char]10
      $head = "HTTP/1.1 $status" + $crlf + "Content-Type: $type" + $crlf + "Content-Length: $($body.Length)" + $crlf + "Access-Control-Allow-Origin: *" + $crlf + "Connection: close" + $crlf + $crlf
      $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($headBytes, 0, $headBytes.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    } catch {
      Write-Host $_.Exception.Message -ForegroundColor Yellow
    } finally {
      if ($client) { $client.Close() }
    }
  }
} finally {
  $listener.Stop()
}
