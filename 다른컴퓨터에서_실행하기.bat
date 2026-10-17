@echo off
chcp 65001 > nul
echo ========================================================
echo   [CLAW MASTER 3000] 네트워크 서버가 시작되었습니다!
echo   같은 와이파이/네트워크에 연결된 다른 컴퓨터나 폰에서
echo   아래 주소를 브라우저에 입력하세요:
echo.
echo   http://192.168.18.152:8000/claw_machine.html
echo ========================================================
python -m http.server 8000
pause
