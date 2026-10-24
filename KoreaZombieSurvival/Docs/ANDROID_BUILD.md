# Android APK

2026-10-25 Unity 6000.6.7f1에서 `Builds/Android/SeoulLastSignal.apk`를 다시 생성했습니다. 지역별 폴백 배치·정밀 수색 보너스, 생수·배터리·신호탄, 의뢰 대상 지도 표시가 포함됩니다. 빌드 결과 `Succeeded`, 오류 0개, 실제 APK 20,959,115바이트입니다. Android SDK `apksigner verify`가 v2 서명 유효를 확인했고, 패키지는 `com.seoulsurvival.lastsignal`, 최소 Android API 26, ARM64입니다.

다시 빌드하려면 프로젝트 폴더에서 `powershell -File .\Tools\Unity.ps1 -Mode BuildAndroidApk`를 실행합니다. 스크립트는 한글 사용자 경로에 대한 Unity Android 제한을 피하려고 빈 `Z:` 드라이브를 빌드 중에만 사용하며 종료 시 해제합니다. Unity Hub의 Android Build Support·SDK/NDK 설치가 필요합니다. Hub OpenJDK 설치가 이 PC에서 완료되지 않아 공식 Unity 다운로드 아카이브의 OpenJDK 17을 `Tools/AndroidJDK`에 풀어 사용합니다. 이 도구 폴더는 Git에서 제외됩니다.

SHA-256: `920BD6CA394051D0AF1319940181474A0613E841FA953E5E54F7AA55D85ACEB6`

ADB에 연결된 휴대폰이 없어 설치·프레임률·터치 조작은 실기기로 아직 확인하지 못했습니다. 이 APK는 테스트용 서명이며 Google Play 출시에는 별도 릴리스 서명과 AAB 검증이 필요합니다.
