$ErrorActionPreference='Stop'
$project=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$build=Join-Path $project 'Builds\Windows'
$root=Join-Path $project 'Builds\Portable'
$package=Join-Path $root 'SeoulLastSignal-Windows'
$zip=Join-Path $root 'SeoulLastSignal-Windows.zip'
if(-not (Test-Path -LiteralPath (Join-Path $build 'SeoulLastSignal.exe'))) { throw 'Windows 빌드가 없습니다. Tools/Unity.ps1 -Mode BuildWindows를 먼저 실행하세요.' }
New-Item -ItemType Directory -Path $root -Force | Out-Null
$resolvedRoot=[IO.Path]::GetFullPath($root).TrimEnd('\')+'\'
$resolvedPackage=[IO.Path]::GetFullPath($package)
if(-not $resolvedPackage.StartsWith($resolvedRoot,[StringComparison]::OrdinalIgnoreCase)) { throw '패키지 경로가 Builds/Portable 밖입니다.' }
if(Test-Path -LiteralPath $package) { Remove-Item -LiteralPath $package -Recurse -Force }
New-Item -ItemType Directory -Path $package | Out-Null
Get-ChildItem -LiteralPath $build -Force | Copy-Item -Destination $package -Recurse -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Portable-Verify.ps1') -Destination (Join-Path $package 'Verify.ps1')
@'
@echo off
cd /d "%~dp0"
start "" "SeoulLastSignal.exe"
'@ | Set-Content -LiteralPath (Join-Path $package 'Play.cmd') -Encoding ascii
@'
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Verify.ps1"
exit /b %errorlevel%
'@ | Set-Content -LiteralPath (Join-Path $package 'Verify.cmd') -Encoding ascii
@'
SEOUL / LAST SIGNAL — 다른 Windows 컴퓨터 테스트

1. ZIP 전체를 일반 폴더에 압축 해제하세요. SeoulLastSignal_Data 폴더와 EXE를 같이 두세요.
2. Verify.cmd를 실행해 게임 파일의 SHA-256 무결성을 확인하세요.
3. Play.cmd를 실행하세요. Unity 에디터나 소스 프로젝트는 필요 없습니다.
4. 노원역/잠실역/강남역 또는 지원되는 정확한 장소명을 입력한 뒤 E/V 파밍, C 조합, Q 유인탄, B 거점, M 지도, F5 저장을 확인하세요.
5. 오류가 있으면 실패한 단계와 아래 Player.log 파일을 전달하세요.
   %USERPROFILE%\AppData\LocalLow\Seoul Survival Studio\Seoul Last Signal\Player.log

이 묶음에는 개인 저장 파일, API 키, 소스 프로젝트, FreeLLMAPI 계정이 없습니다.
저장 파일은 테스트 컴퓨터에 남습니다. Windows 10/11 64비트와 3D 그래픽 지원이 필요합니다.
'@ | Set-Content -LiteralPath (Join-Path $package 'START_HERE.txt') -Encoding utf8
$files=Get-ChildItem -LiteralPath $build -Recurse -File | Sort-Object FullName
$manifest=foreach($file in $files) { $relative=$file.FullName.Substring($build.Length+1); (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()+"`t"+$relative }
Set-Content -LiteralPath (Join-Path $package 'Checksums.sha256') -Value $manifest -Encoding utf8
if(Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -LiteralPath $package -DestinationPath $zip -CompressionLevel Optimal
Write-Output "PORTABLE_PACKAGE_OK $zip"
