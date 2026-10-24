# 에셋 교체와 출시 발전 가이드

현재는 장기 생존 저장, 거점 성장과 Kenney 캐릭터/대기·달리기 모션/생존 소품이 적용된 개발 빌드입니다. 라이선스는 ART_LICENSES.md에 기록했습니다. 전용 전투 모션, 건물 아트와 녹음 효과음/BGM은 다음 단계입니다. 아래 순서는 기본 게임 규칙을 유지하면서 외형과 사운드를 교체하기 위한 절차입니다. 파일을 구해 프로젝트에 넣는 작업도 Codex에게 맡길 수 있습니다. 계정 로그인/유료 에셋 구매/스토어 계약은 소유자 계정이 필요합니다.

## A. 캐릭터와 Mixamo 모션

1. 사용 가능한 라이선스가 확인된 캐릭터 FBX와 텍스처를 `Assets/Game/Art/Characters/`에 넣습니다. Kenney/Quaternius 등도 선택한 에셋별 라이선스를 확인하고 원문을 함께 보관합니다.
2. 캐릭터 모델은 키 약 1.8~2m, 발바닥 원점, 앞쪽 +Z로 맞춥니다. 크기나 축이 다르면 빈 부모 오브젝트를 만들고 모델 자식의 회전/배율만 보정한 뒤 Prefab으로 저장합니다.
3. 에디터가 멈춘 상태에서 GameBootstrap → Assets → Player Prefab 또는 Zombie Prefab 슬롯에 Prefab을 넣습니다. 슬롯이 비어 있으면 기본 도형이 나옵니다. 충돌과 이동은 부모의 CharacterController/NavMeshAgent가 담당하며 모델의 충돌체와 Rigidbody는 비활성화합니다.
4. Mixamo에서 Idle, Walking/Running, Aiming, Shooting, Axe Swing, Hit Reaction, Death 모션을 가져옵니다. 이동 모션은 In Place를 쓰고, FBX Rig를 Humanoid로 설정합니다. 캐릭터 Avatar와 모션 Avatar 호환을 확인합니다.
5. Animator Controller를 만들고 Float `Speed`, Bool `IsAiming`, Trigger `AttackTrigger`, Bool `HeadshotDie`를 정확한 대소문자로 추가합니다. 일반 사망용 선택 파라미터 `DieTrigger`도 사용할 수 있습니다. Speed는 실제 m/s이므로 0=정지, 약 2.3=좀비 이동, 6=플레이어 이동을 기준으로 Blend Tree를 맞춥니다.
6. Idle↔Move는 Speed, Aim은 IsAiming, 공격은 AttackTrigger, 사망은 DieTrigger/HeadshotDie로 전환하도록 연결합니다. Controller는 GameBootstrap → Assets → Player Animator / Zombie Animator에 넣습니다. 루트 모션은 코드가 끄므로 이동이 중복되지 않습니다.
7. 다시 Play하여 이동/조준/공격/피격/사망을 검사합니다. 모델을 넣기만 해서 존재하지 않는 모션이 생기지는 않습니다. Controller의 전환 구성과 클립 매핑은 한 번 필요하며 Codex에게 자동 생성을 맡길 수 있습니다.

## B. 건물 외관과 실내 가구

1. 프리팹 6개를 `Assets/Game/Art/Buildings/`에 준비합니다. 배열 순서는 Police, FireStation, Convenience, School, Office, Housing입니다.
2. 현재 기본 건물 규격은 X 14m × Z 12m, 중앙이 원점, 남쪽(-Z) 중앙에 폭 3.2m 입구입니다. 실내 Trigger 및 상자/잠복 좀비 배치도 이 규격을 기준으로 합니다. 다른 크기를 쓰려면 건물 컴포넌트의 규격/소켓을 먼저 확장해야 합니다.
3. 외벽·바닥·실내 칸막이·가구에는 충돌체를 넣고, 문은 실제로 열려 있어야 합니다. 지붕 오브젝트는 프리팹의 **직계 자식 `Roof`**로 만듭니다. 플레이어가 들어오면 이 자식이 꺼집니다. 지붕 아래 천장까지 같은 자식에 묶어야 실내가 보입니다.
4. 루트 프리팹에는 게임용 플레이어/좀비/상자 스크립트를 넣지 않습니다. 게임은 상자를 로컬 (-4,0,2), 잠복 좀비를 (4,0,1)에 생성하므로 그 자리는 가구로 막지 않습니다.
5. GameBootstrap → Assets → Building Prefabs에 종류별 프리팹을 넣습니다. 비어 있는 종류만 기존 도형으로 생성됩니다. Loot Prefab에 상자 모델을 넣으면 파밍 상자 외형도 교체됩니다.
6. 건물 출입, 지붕 열림/복원, 벽 너머 사격 차단, 상자 상호작용, 좀비의 출입문 경로를 검증합니다. 바리케이드 역시 Barricade Prefab 슬롯으로 교체합니다. 바리케이드 기본 규격은 폭 3.4m, 높이 1.4m, 깊이 .8m입니다.

실제 시설 좌표와 실제 외관/실내 재현은 별개입니다. OSM 좌표만으로 해당 경찰서의 실내 도면을 얻을 수 없습니다. 상용판의 내부는 일관된 모듈형 가상 공간으로 제작하거나 별도로 권리가 확보된 자료를 사용합니다.

## C. 효과음과 BGM

1. 라이선스가 확인된 WAV/OGG를 `Assets/Game/Audio/`에 넣습니다.
2. GameBootstrap → Assets의 Shot, Headshot, Empty, Reload, Axe, Groan, Loot, Siren 슬롯에 효과음을 넣습니다. 비어 있으면 생성된 비프/잡음 파형으로 재생됩니다. 오디오 파일 없이도 화면 소음 캡션과 좀비 어그로가 작동합니다.
3. Day Bgm, Night Bgm에 낮/밤 음악을 넣습니다. 이 두 슬롯이 비어 있으면 BGM은 재생하지 않습니다. 효과음용 대체 파형과 BGM은 구분됩니다.
4. 소리 파일 길이와 볼륨을 맞춥니다. 현재 효과음은 2D 믹스이며 낮밤에 음악이 전환됩니다. 상용판에서는 AudioMixer, 3D 공간음, 음악 크로스페이드 및 음량 설정을 추가하는 단계가 필요합니다.
5. 총성 파일을 교체해도 Noise Radius는 GameBalance의 Weapon 데이터가 결정합니다. 음향 길이/크기가 좀비 청각 반경을 자동 변경하지 않습니다.

## D. PC와 Android 조작 및 빌드

### PC / Steam

현재 PC는 WASD/마우스/1(구호 권총)·2(소방도끼)·3(현장 조립 소총)/R/E/C/H/G(탈것 탑승)/J(스쿠터 충전)입니다. 첫 화면에서 출발지와 소중한 사람의 장소를 입력하며, 현재 시범 장소는 노원역·잠실역·강남역 또는 직접 입력한 위도·경도입니다. 스쿠터는 소음으로 좀비를 유인하고 자전거는 기력을 소모합니다. 이동 방향은 쿼터뷰 카메라 기준입니다. 패드 지원은 별도 단계입니다.

`Seoul Survival → Build Windows` 또는 `Tools/Unity.ps1 -Mode BuildWindows`를 실행합니다. 결과는 `Builds/Windows/`이며 exe와 Data 폴더, UnityPlayer.dll을 함께 배포합니다. Steam은 이 Windows 빌드를 업로드하는 단계와 Steamworks SDK 연동을 구분합니다. 업적/클라우드가 필요해질 때 Steamworks.NET을 추가하고 Steam App ID 및 개발자 계정 설정을 연결합니다.

### Android / Google Play

Android에서는 `Application.isMobilePlatform`으로 터치 UI가 자동 표시됩니다. 왼쪽 패드는 이동, 오른쪽 패드는 조준/정밀조준, 오른쪽 끝까지 밀면 발사입니다. 획득/재장전/무기변경/조합/회복 버튼도 제공됩니다. 탈것은 가까이 있을 때 화면의 탑승/충전 버튼을 씁니다. 모바일 입력을 새 UI로 바꾸더라도 TacticalPlayerController의 `SetMoveInput`, `SetAimInput`, `SetFocusInput`, `SetFireInput`에 연결하면 전투 코드를 바꾸지 않습니다.

1. Unity Hub에서 이 프로젝트 에디터 버전의 Android Build Support, SDK/NDK Tools, OpenJDK를 설치합니다. 현재 PC에는 Windows와 WebGL 모듈만 있어 Android 빌드는 검증하지 못했습니다.
2. Android로 빌드 타깃을 바꿉니다. 자동 빌드 메서드는 IL2CPP/ARM64, 가로 화면, 앱 식별자 `com.seoulsurvival.lastsignal`을 준비합니다. 출시용 식별자는 소유 브랜드에 맞게 확정하세요.
3. `Seoul Survival → Build Android AAB`를 실행합니다. 결과는 `Builds/Android/SeoulLastSignal.aab`입니다. 배포용 키스토어/서명 비밀번호는 소유자가 관리하며 저장소에 넣지 않습니다.
4. 실제 Android 기기에서 멀티터치, 노치/안전영역, 여러 화면 비율, 30/60fps, 발열, 낮은 메모리, 백그라운드 복귀를 검사합니다. 현재 OnGUI 터치 배치는 첫 작동 검증용이므로 이 검사를 거쳐 Canvas/UI Toolkit 기반 조작 UI로 발전시킵니다.
5. 출시 시점의 Google Play SDK 타깃 요구, 개인정보/데이터 보안 문항, 등급 분류와 계정 요건을 공식 콘솔에서 확인합니다. 프로토타입의 minSdk 26 설정이 출시 정책 전체를 충족한다는 뜻은 아닙니다.

## 출시까지의 단계별 완료 조건

1. **코어 검증:** 노원→잠실 실제 이동 완주, 정밀 사격/근접/소총/탈것 밸런스, 오프라인/지도 실패 대응. 자동 검사는 기능 단위를 확인하며 사람이 15km 이상 여정을 완주한 검사는 아직 없습니다.
2. **한 구역 완성:** 캐릭터 2종, 건물 6종, 실내 모듈, 애니메이션과 소리, 조명/시야 연출을 실제 에셋으로 교체합니다. 무조건 전국 규모를 늘리기보다 10분 플레이 품질을 먼저 확정합니다.
3. **제품 기능:** 세이브/로드, 일시정지/설정/키 재지정, 접근성, 튜토리얼, 업적, 부동 원점, 지도 공급/캐시 정책을 실제 필요에 맞춰 추가합니다.
4. **성능/출시:** 청크/AI 풀링과 비동기 NavMesh, Android 실기기 프로파일링, 긴 플레이 안정성, 라이선스/고지, 스토어 빌드/서명/심사를 완료합니다.
