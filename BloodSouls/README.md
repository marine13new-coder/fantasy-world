# 🩸 블러드 소울: 재의 사냥꾼 (Blood Souls: Ashen Hunter)
> 다크소울 & 블러드본 정통 오마주 3D 소울라이크 프로젝트

---

## 📁 프로젝트 구조 (Dedicated Directory Structure)

```
BloodSouls/
├── Web/                                  # 최신 3D WebGL 게임 빌드
│   ├── index.html                        # 메인 소울라이크 3D 게임 (Three.js & GLTFLoader)
│   ├── thumb.png                         # 게임 대표 썸네일 (640x400)
│   └── models/                           # 실제 3D 스킨드 메쉬 (.glb)
│       ├── hunter.glb                    # 플레이어 사냥꾼 3D 모델 (Mixamo 67개 본 스켈레톤 탑재)
│       ├── enemy_knight.glb              # 성당 기사 3D 모델 (플레이트 아머, 실드, 검)
│       └── boss_malakor.glb              # 심연의 군주 말라코르 3.8m 거구 보스 3D 모델
│
├── Unity/                                # 유니티 6000 (Unity 6) 정식 C# 소스코드
│   ├── Scripts/
│   │   ├── SoulsGameBootstrap.cs         # 1-오브젝트 자동 조립 (Auto-Setup)
│   │   ├── SoulsMovementController.cs    # 3인칭 기동, 스프린트, 구르기 & 퀵스텝
│   │   ├── SoulsAnimationController.cs   # 메카님 & 프로시저럴 다관절 본 애니메이션
│   │   ├── SoulsCombatSystem.cs          # 무기 변형, 패링, 내장뽑기, 리게인 흡혈
│   │   ├── SoulsLockOnCamera.cs          # 3인칭 숄더뷰 궤도 및 지형 충돌 방지 카메라
│   │   ├── SoulsImpactAndJuice.cs        # 0.05초 역경직(Hit-stop), 화면 흔들림, 피분수 파티클
│   │   ├── SoulsGothicAI.cs              # 적 FSM & 2페이즈 보스 각성
│   │   ├── SoulsTacticalAudio.cs         # AudioClip.Create 기반 절차적 3D 공간 음향
│   │   └── SoulsUIManager.cs             # uGUI HUD (HP/Rally/Stamina, YOU DIED 배너)
│   └── Editor/
│       └── AutoSetupBloodSoulsScene.cs   # 원클릭 씬 생성 & Standalone PC 빌드 도구
│
├── Tools/
│   ├── sync_blood_souls.py               # BloodSouls/Web -> site/ 및 games/ 실시간 자동 동기화
│   └── start_lan_server.py               # 다른 컴퓨터 실시간 접속용 고성능 웹서버
│
├── 🎮_게임실행_로컬브라우저.bat              # 내 PC 로컬 브라우저 즉시 실행
├── 🌐_다른컴퓨터_실시간접속_서버실행.bat      # 다른 컴퓨터 / 모바일 실시간 접속 서버 가동
├── ⚔️_유니티_에디터열기.bat                 # Unity 6 에디터로 정식 프로젝트 열기
└── README.md
```

---

## 🌐 다른 컴퓨터에서 실시간으로 플레이하는 방법

### 1. 같은 와이파이 / 공유기(LAN) 연결 시
1. [`🌐_다른컴퓨터_실시간접속_서버실행.bat`](file:///c:/Users/임종서/Desktop/auto%20gnimag/BloodSouls/🌐_다른컴퓨터_실시간접속_서버실행.bat) 실행
2. 같은 Wi-Fi에 연결된 다른 노트북, 컴퓨터, 태블릿의 크롬/엣지 브라우저에서 아래 주소 입력:
   - **블러드 소울 바로가기**: `http://192.168.18.152:8000/site/souls-borne/index.html`
   - **16종 통합 아케이드 허브**: `http://192.168.18.152:8000/site/index.html`
3. 개발 중 코드를 수정하면, 다른 컴퓨터에서 **새로고침(F5)**만 누르면 실시간 업데이트가 즉시 반영됩니다.

### 2. 외부 인터넷(카페, 다른 집, LTE/5G 모바일)에서 접속 시
- 루트 폴더의 [`🌐_외부인터넷_공유실행.bat`](file:///c:/Users/임종서/Desktop/auto%20gnimag/🌐_외부인터넷_공유실행.bat)을 실행하면 발급되는 고유 HTTPS 링크를 통해 전 세계 어디서든 접속할 수 있습니다.

---

## 🕹️ 조작 가이드

- **`W, A, S, D`**: 이동 기동
- **`Shift` (누른 상태)**: 스프린트 전력 질주 (스태미너 지속 소모)
- **`Space`**: 회피 (**락온 시: 블러드본 퀵스텝**, **비 락온 시: 다크소울 롤링 구르기**)
- **`마우스 좌클릭`**: 일반 공격 / 3단 콤보 (그로기 적 앞에서는 **내장 뽑기**)
- **`마우스 우클릭`**: 사냥꾼 단총 사격 (**적 윈드업 타이밍에 패링 시도**)
- **`Q` 또는 `마우스 휠 클릭`**: 타겟 락온 (숄더뷰 자동 추적)
- **`Z` 또는 `T`**: 톱단도 무기 변형 (접힘 ↔ 펼침)
- **`1` / `2`**: 주무기 변경 (톱단도 ↔ 월광의 대검)
- **`R`**: 수혈액(에스트 병) 섭취 (체력 45% 회복)
- **`E`**: 상호작용 (화톳불 휴식, 안개벽 진입, 내장 뽑기)
