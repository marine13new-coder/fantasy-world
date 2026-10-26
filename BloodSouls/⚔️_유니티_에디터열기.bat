@echo off
chcp 65001 > nul
echo ========================================================
echo    ⚔️ 유니티 6 정식 3D 소울라이크 에디터 실행중...
echo ========================================================
start "" "C:\Program Files\Unity\Hub\Editor\6000.6.7f1\Editor\Unity.exe" -projectPath "%~dp0.."
exit
