@echo off
chcp 65001 > nul
echo ========================================================
echo  [어비스 롤: 피의 카지노] 안드로이드폰 1-클릭 설치 도구
echo ========================================================
echo.
set ADB="C:\Program Files\Unity\Hub\Editor\6000.6.7f1\Editor\Data\PlaybackEngines\AndroidPlayer\SDK\platform-tools\adb.exe"
set APK="%~dp0AbyssRoll-BloodCasino.apk"

echo 휴대폰 연결 상태 확인 중...
%ADB% devices
echo.
echo 휴대폰이 USB 디버깅 모드로 연결되어 있다면 바로 설치를 진행합니다...
%ADB% install -r %APK%
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  [설치 성공!] 휴대폰 앱 서랍에서 '어비스 롤'을 실행하세요!
    echo ========================================================
    %ADB% shell am start -n com.abyssroll.bloodcasino/.MainActivity
) else (
    echo.
    echo [안내] 휴대폰이 USB로 연결되지 않았거나 승인이 필요합니다.
    echo 1) 휴대폰 브라우저에서 직다운로드 링크로 설치하거나
    echo 2) 화면의 QR코드를 카메라로 스캔하여 다운로드하세요.
    echo 다운로드 링크: https://litter.catbox.moe/vtrg9v.apk
)
pause
