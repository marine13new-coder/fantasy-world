# 다른 컴퓨터에서 바로 테스트

`Builds/Portable/SeoulLastSignal-Windows.zip`을 USB, 클라우드 드라이브 또는 파일 전송으로 다른 Windows 10/11 64비트 컴퓨터에 복사합니다. ZIP 전체를 압축 해제한 뒤 `SeoulLastSignal-Windows/Verify.cmd`를 실행하세요. 게임 파일 160개의 해시가 일치한다는 메시지가 나오면 같은 폴더의 `Play.cmd`를 실행합니다. **Unity 에디터, 개발 도구, 이 소스 프로젝트는 필요 없습니다.** 실행 파일만 따로 옮기면 데이터 폴더가 없어 시작하지 못합니다.

처음에는 노원역→잠실역을 입력해 시작합니다. E/V로 시설 파밍, C로 조합, Q로 신호탄, B로 주민센터 의뢰, M으로 지역도, F5로 저장을 확인하세요. 다른 장소는 노원·잠실·강남의 정확한 시설명 또는 대한민국 위도·경도 쌍만 지원합니다. 인터넷이 없어도 번들 지도와 폴백 지도로 시작합니다.

저장은 테스트 컴퓨터의 `%USERPROFILE%\AppData\LocalLow\Seoul Survival Studio\Seoul Last Signal\`에 생성됩니다. ZIP에는 개인 저장이나 API 키가 들어 있지 않습니다. 오류를 보고할 때는 실패 단계와 같은 폴더의 `Player.log`를 전달하면 됩니다. 저장 파일에는 입력한 위치가 들어 있으므로 공유 전에 확인하세요.

개발 컴퓨터에서 새 PC 빌드를 만든 뒤 `powershell -File Tools/Make-Portable.ps1`을 실행하면 ZIP과 해시 목록을 다시 생성합니다. 이번 패키지는 ZIP을 다른 경로에 풀고 해시 검사 및 헤드리스 실행 초기화를 확인했습니다. 실제 다른 컴퓨터의 GPU·입력·프레임률은 그 컴퓨터에서 직접 테스트해야 합니다.
