param([string]$Python='python')
$ErrorActionPreference='Stop'
$taskRepo=Join-Path $PSScriptRoot 'unity-mcp'
if(-not (Test-Path -LiteralPath $taskRepo)) {
    & git clone --depth 1 --branch v10.0.0 https://github.com/CoplayDev/unity-mcp.git $taskRepo
    if($LASTEXITCODE -ne 0){throw 'Unity MCP download failed.'}
}
$taskRevision=(& git -C $taskRepo rev-parse HEAD).Trim()
if($taskRevision -ne 'd49ae2953580f3481beb1e084a1da2682f0b5610'){throw 'Unexpected Unity MCP revision. Review before using.'}
$taskVenv=Join-Path $PSScriptRoot '.venv'
if(-not(Test-Path -LiteralPath $taskVenv)){ & $Python -m venv $taskVenv; if($LASTEXITCODE -ne 0){throw 'Python 3.10+ required.'} }
$taskPython=Join-Path $taskVenv 'Scripts\python.exe'
$taskLock=Join-Path $PSScriptRoot 'mcp-requirements.txt'
if(Test-Path -LiteralPath $taskLock){ & $taskPython -m pip install -r $taskLock; if($LASTEXITCODE -ne 0){throw 'MCP dependencies installation failed.'} }
& $taskPython -m pip install (Join-Path $taskRepo 'Server')
if($LASTEXITCODE -ne 0){throw 'MCP server installation failed.'}
Write-Host 'Unity MCP v10.0.0 installed. Run Tools/Unity.ps1 -Mode Mcp.'
