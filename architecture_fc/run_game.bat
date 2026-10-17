@echo off
chcp 65001 > nul
echo ========================================================
echo   🏛️ ARCHITECTS FC: Master Builders United
echo   건축가 FC - 명장 감독들과 상징적 건축물들의 축구 대결
echo ========================================================
echo.
echo 웹 브라우저를 열고 로컬 서버를 실행합니다...
start "" "http://localhost:8089"
python serve.py
pause
