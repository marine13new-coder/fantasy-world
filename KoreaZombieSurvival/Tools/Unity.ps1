param([ValidateSet('Open','Check','BuildWindows','BuildAndroid','BuildAndroidApk','Mcp')][string]$Mode='Open')
$ErrorActionPreference='Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskMapped=$false
if ($Mode -eq 'BuildAndroidApk' -and $taskRoot -match '[^\x00-\x7F]') {
    if (Get-PSDrive -Name Z -ErrorAction SilentlyContinue) { throw 'Android 빌드용 Z: 드라이브가 이미 사용 중입니다.' }
    subst Z: (Split-Path $taskRoot -Parent)
    if ($LASTEXITCODE -ne 0) { throw 'Android 빌드용 ASCII 경로를 만들 수 없습니다.' }
    $taskRoot=Join-Path 'Z:\' (Split-Path $taskRoot -Leaf); $taskMapped=$true
}
if ($Mode -eq 'BuildAndroidApk') {
    $env:GRADLE_USER_HOME=Join-Path $taskRoot 'Tools\AndroidGradle'
    $env:TEMP=Join-Path $taskRoot 'Tools\AndroidTemp'
    $env:TMP=$env:TEMP
    New-Item -ItemType Directory -Path $env:GRADLE_USER_HOME,$env:TEMP -Force | Out-Null
}
$taskEditors = Get-ChildItem 'C:\Program Files\Unity\Hub\Editor' -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
$taskEditor = $taskEditors | ForEach-Object { Join-Path $_.FullName 'Editor\Unity.exe' } | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $taskEditor) { throw 'Unity Hub에서 Unity 6 에디터를 설치해 주세요.' }
New-Item -ItemType Directory -Path (Join-Path $taskRoot 'Logs') -Force | Out-Null
if ($Mode -eq 'Mcp') {
    $taskServer=Join-Path $PSScriptRoot '.venv\Scripts\mcp-for-unity.exe'
    if (-not (Test-Path -LiteralPath $taskServer)) { throw 'Tools/Setup-MCP.ps1을 먼저 실행해 주세요.' }
    $env:MCP_DISABLE_TELEMETRY='true'
    if (-not (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue)) {
        Start-Process -FilePath $taskServer -ArgumentList @('--transport','http','--http-url','http://127.0.0.1:8080') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRoot 'Logs\mcp-server.log') -RedirectStandardError (Join-Path $taskRoot 'Logs\mcp-server-error.log')
    }
}
$taskArgs=@('-projectPath',('"'+$taskRoot+'"'),'-logFile',('"'+$taskRoot+'\Logs\launcher-'+$Mode+'.log"'))
switch ($Mode) {
    'Check' { $taskArgs+=@('-batchmode','-executeMethod','SeoulSurvival.Editor.ProjectAutomation.RunChecks') }
    'BuildWindows' { $taskArgs+=@('-batchmode','-quit','-executeMethod','SeoulSurvival.Editor.ProjectAutomation.BuildWindows') }
    'BuildAndroid' { $taskArgs+=@('-batchmode','-quit','-executeMethod','SeoulSurvival.Editor.ProjectAutomation.BuildAndroid') }
    'BuildAndroidApk' { $taskArgs+=@('-batchmode','-quit','-executeMethod','SeoulSurvival.Editor.ProjectAutomation.BuildAndroidApk') }
    'Mcp' { $taskArgs+=@('-executeMethod','SeoulSurvival.Editor.McpAutomation.OpenAndConnect') }
}
try {
    if($Mode -in @('Open','Mcp')) { Start-Process -FilePath $taskEditor -ArgumentList $taskArgs }
    else { $taskProcess=Start-Process -FilePath $taskEditor -ArgumentList $taskArgs -WindowStyle Hidden -Wait -PassThru; $taskExit=$taskProcess.ExitCode }
} finally { if($taskMapped) { subst Z: /D | Out-Null } }
if($Mode -notin @('Open','Mcp')) { exit $taskExit }
