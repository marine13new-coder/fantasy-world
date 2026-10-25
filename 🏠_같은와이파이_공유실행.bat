@echo off
chcp 65001 > nul
cls
echo ===================================================================
echo     🎮 [AI 게임 아케이드 허브] 세션 01~14 통합 서버 가동
echo ===================================================================
echo.
echo   같은 공유기(Wi-Fi / LAN)에 연결된 다른 컴퓨터, 태블릿, 스마트폰에서
echo   크롬(Chrome)이나 엣지(Edge) 브라우저를 열고 아래 주소를 입력하세요:
echo.
echo   ▶▶▶ [14종 통합 아케이드 허브 포털] : http://192.168.18.152:8000/site/index.html
echo.
echo   -----------------------------------------------------------------
echo   [세션별 게임 목록]
echo   #01 ⚡ 네온 서바이벌         : http://192.168.18.152:8000/site/neon-survivor/index.html
echo   #02 ⏱️ 크로노 블레이드       : http://192.168.18.152:8000/site/chrono-blade/index.html
echo   #03 🚴 감스트 호수공원 질주  : http://192.168.18.152:8000/site/gamst-lake-park/index.html
echo   #04 ⚽ 아키텍츠 FC           : http://192.168.18.152:8000/site/architecture-fc/index.html
echo   #05 🕹️ 3D 인형뽑기           : http://192.168.18.152:8000/site/claw-machine/index.html
echo   #06 ✈️ 스카이 에이스 3D      : http://192.168.18.152:8000/site/flight-3d/index.html
echo   #07 🏰 아테리아 대륙 연대기  : http://192.168.18.152:8000/site/fantasy_world/index.html
echo   #08 🔍 송백리 살인사건 1997  : http://192.168.18.152:8000/site/songbaek-killings/index.html
echo   #09 🔦 은하아파트 13동       : http://192.168.18.152:8000/site/apartment-13/index.html
echo   #10 📼 아카이브 1999         : http://192.168.18.152:8000/site/archive-1999/index.html
echo   #11 🎯 VALO-LITE 3D FPS      : http://192.168.18.152:8000/site/fps-arena/index.html
echo   #12 🎲 어비스 롤 (피의 카지노): http://192.168.18.152:8000/site/abyss-roll/index.html
echo   #13 ⚔️ 심리스 오픈월드 RPG   : http://192.168.18.152:8000/site/seamless-pixel-rpg/index.html
echo   #14 🎣 코지 픽셀 낚시터      : http://192.168.18.152:8000/site/cozy-fishing/index.html
echo   -----------------------------------------------------------------
echo.
echo   ※ 이 창을 닫으면 다른 컴퓨터에서 접속이 종료됩니다. (종료: Ctrl + C)
echo ===================================================================
echo.
python -m http.server 8000
pause
