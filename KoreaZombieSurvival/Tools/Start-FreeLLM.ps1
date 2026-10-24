param([switch]$OpenDashboard)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../freellmapi'))
$logs = Join-Path $PSScriptRoot '../Logs'
New-Item -ItemType Directory -Path $logs -Force | Out-Null
if (!(Test-Path (Join-Path $repo 'server/dist/index.js')) -or !(Test-Path (Join-Path $repo 'client/dist/index.html'))) {
    throw 'FreeLLMAPI build missing. Run npm ci and npm run build in the freellmapi folder first.'
}
$envFile = Join-Path $repo '.env'
if (!(Test-Path $envFile)) {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
    [IO.File]::WriteAllText($envFile, "ENCRYPTION_KEY=$secret`nPORT=3001`nHOST=127.0.0.1`n", (New-Object Text.UTF8Encoding $false))
    $secret = $null
}
try { $ready = (Invoke-WebRequest 'http://127.0.0.1:3001' -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { $ready = $false }
if (!$ready) {
    $oldHostValue = $env:HOST
    $oldPortValue = $env:PORT
    $oldNodeEnvValue = $env:NODE_ENV
    try {
        $env:HOST = '127.0.0.1'
        $env:PORT = '3001'
        $env:NODE_ENV = 'production'
        $process = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList 'dist/index.js' -WorkingDirectory (Join-Path $repo 'server') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logs 'freellm-server.log') -RedirectStandardError (Join-Path $logs 'freellm-server-error.log')
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Milliseconds 500
            $process.Refresh()
            if ($process.HasExited) { throw 'FreeLLMAPI stopped during startup. Inspect Logs/freellm-server-error.log locally.' }
            try { $ready = (Invoke-WebRequest 'http://127.0.0.1:3001' -UseBasicParsing -TimeoutSec 1).StatusCode -eq 200 } catch { $ready = $false }
            if ($ready) { break }
        }
        if (!$ready) { throw 'FreeLLMAPI did not become ready within 10 seconds.' }
    } finally { $env:HOST = $oldHostValue; $env:PORT = $oldPortValue; $env:NODE_ENV = $oldNodeEnvValue }
}
Write-Output 'Dashboard: http://127.0.0.1:3001 | API: http://127.0.0.1:3001/v1'
if ($OpenDashboard) { Start-Process 'http://127.0.0.1:3001' }
