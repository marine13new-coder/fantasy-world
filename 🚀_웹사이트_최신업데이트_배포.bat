@echo off
chcp 65001 > nul
cls
echo ===================================================================
echo   🚀 [AI 게임 아케이드] 최신 개발 결과물 GitHub Pages 자동 배포
echo ===================================================================
echo.
echo   각 세션(11번 FPS, 13번 RPG, 14번 낚시 등)의 최신 소스 코드를
echo   site/ 웹 포털로 자동 동기화하고 GitHub Pages로 실시간 배포합니다.
echo.
python tools\sync_and_deploy.py
echo.
echo ===================================================================
echo   배포 완료! 잠시 후 아래 주소에서 새로고침(Ctrl+F5) 해보세요:
echo   👉 https://marine13new-coder.github.io/fantasy-world/
echo ===================================================================
pause
