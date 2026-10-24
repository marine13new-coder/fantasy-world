param([switch]$Check, [string]$PromptFile, [switch]$ReplaceSavedKey, [switch]$NoSaveKey)
$ErrorActionPreference = 'Stop'
$oldKey = $env:FREELLM_API_KEY
$pointer = [IntPtr]::Zero
$keyFile = Join-Path $PSScriptRoot '.freellm-key.clixml'
$secure = $null
try {
    if (!$env:FREELLM_API_KEY -or $ReplaceSavedKey) {
        if ((Test-Path -LiteralPath $keyFile) -and !$ReplaceSavedKey) {
            try { $secure = Import-Clixml -LiteralPath $keyFile } catch { throw 'Cannot unlock the saved key. Use -ReplaceSavedKey to enter it again on this Windows account.' }
            if ($secure -isnot [Security.SecureString]) { throw 'Invalid saved key file. Use -ReplaceSavedKey to replace it.' }
        } else {
            $secure = Read-Host 'Paste the unified API key (hidden; saved encrypted for this Windows account)' -AsSecureString
            if ($secure.Length -eq 0) { throw 'The unified API key cannot be empty.' }
            if (!$NoSaveKey) {
                # Export-Clixml uses Windows DPAPI CurrentUser for SecureString values.
                $temporaryKeyFile = "$keyFile.tmp"
                try {
                    $secure | Export-Clixml -LiteralPath $temporaryKeyFile
                    Move-Item -LiteralPath $temporaryKeyFile -Destination $keyFile -Force
                } finally {
                    if (Test-Path -LiteralPath $temporaryKeyFile) { Remove-Item -LiteralPath $temporaryKeyFile }
                }
            }
        }
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $env:FREELLM_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    $arguments = @((Join-Path $PSScriptRoot 'FreeLLMWorker.js'))
    if ($Check) { $arguments += '--check' }
    elseif ($PromptFile) { $arguments += @('--prompt', $PromptFile) }
    & node @arguments
    $workerExit = $LASTEXITCODE
} finally {
    $env:FREELLM_API_KEY = $oldKey
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($secure) { $secure.Dispose() }
}
exit $workerExit
