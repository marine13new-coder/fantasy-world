$ErrorActionPreference='Stop'
$root=Split-Path $MyInvocation.MyCommand.Path -Parent
$manifest=Join-Path $root 'Checksums.sha256'
if(-not (Test-Path -LiteralPath $manifest)) { throw 'Checksums.sha256 파일이 없습니다.' }
$checked=0
foreach($line in Get-Content -LiteralPath $manifest -Encoding utf8) {
    if([string]::IsNullOrWhiteSpace($line)) { continue }
    $parts=$line -split "`t",2
    if($parts.Count -ne 2 -or $parts[0] -notmatch '^[0-9a-f]{64}$') { throw '해시 목록 형식이 잘못되었습니다.' }
    $path=[IO.Path]::GetFullPath((Join-Path $root $parts[1]))
    if(-not $path.StartsWith(([IO.Path]::GetFullPath($root).TrimEnd('\')+'\'),[StringComparison]::OrdinalIgnoreCase)) { throw '허용되지 않은 경로입니다.' }
    if(-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "파일 누락: $($parts[1])" }
    if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $parts[0]) { throw "파일 불일치: $($parts[1])" }
    $checked++
}
if($checked -lt 5) { throw '검사한 게임 파일이 너무 적습니다.' }
Write-Output "검증 완료: 게임 파일 ${checked}개가 원본과 일치합니다. Play.cmd를 실행하세요."
