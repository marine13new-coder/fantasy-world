$ErrorActionPreference = 'Stop'
$testRoot = Join-Path $PSScriptRoot ('../Logs/freellm-key-test-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
Copy-Item (Join-Path $PSScriptRoot 'FreeLLMWorker.ps1') (Join-Path $testRoot 'FreeLLMWorker.ps1')
$harness = @'
param([switch]$Reuse, [switch]$EnvironmentKey)
$ErrorActionPreference = 'Stop'
$env:FREELLM_API_KEY = $null
if ($EnvironmentKey) { $env:FREELLM_API_KEY = 'test-environment-not-a-real-key' }
function Read-Host {
    param($Prompt, [switch]$AsSecureString)
    if ($Reuse -or $EnvironmentKey) { throw 'Unexpected second key prompt.' }
    ConvertTo-SecureString 'test-dpapi-not-a-real-key' -AsPlainText -Force
}
function node {
    $expected = if ($EnvironmentKey) { 'test-environment-not-a-real-key' } else { 'test-dpapi-not-a-real-key' }
    if ($env:FREELLM_API_KEY -ne $expected) { throw 'Incorrect key received by child process.' }
    $global:LASTEXITCODE = 0
}
& (Join-Path $PSScriptRoot 'FreeLLMWorker.ps1') -Check
'@
$harnessPath = Join-Path $testRoot 'harness.ps1'
Set-Content -LiteralPath $harnessPath -Value $harness -Encoding UTF8
foreach ($mode in @('', '-Reuse', '-EnvironmentKey')) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $harnessPath @($mode | Where-Object { $_ })
    if ($LASTEXITCODE -ne 0) { throw "Key storage test failed: $mode" }
}
$savedFile = Join-Path $testRoot '.freellm-key.clixml'
if ((Get-Content -Raw -LiteralPath $savedFile).Contains('test-dpapi-not-a-real-key')) { throw 'Key was stored in plaintext.' }
Write-Output 'PASS: first input encrypted, second invocation reused, environment key took priority, no plaintext key.'
