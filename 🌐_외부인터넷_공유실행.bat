@echo off
chcp 65001 > nul
cls
echo ===================================================================
echo     🌐 [AI 게임 아케이드] 외부 인터넷(다른 네트워크) 공유 터널 가동
echo ===================================================================
echo.
echo   같은 와이파이가 아니어도, 외부 카페, 모바일 LTE/5G, 친구 컴퓨터에서
echo   접속할 수 있는 임시 보안 HTTPS 외부 링크를 생성합니다.
echo.
echo   [1단계] 로컬 게임 서버 가동 (Port 8000)...
start /B python -m http.server 8000 > nul 2>&1
timeout /t 2 > nul

echo.
echo   [2단계] 외부 인터넷 공개 터널 주소 발급중... (잠시만 기다려주세요)
echo.
echo   ※ 아래에 나오는 "your url is: https://xxxx.loca.lt" 링크 뒤에
echo      "/site/index.html" 을 붙여서 다른 컴퓨터 브라우저에 입력하시면 됩니다.
echo   ※ 처음 접속 시 나오는 안내창에는 현재 내 공인 IP를 비밀번호로 입력하면 열립니다.
echo.
echo   (서버 종료: 이 창을 닫거나 Ctrl + C)
echo -------------------------------------------------------------------
npx --yes localtunnel --port 8000
pause
