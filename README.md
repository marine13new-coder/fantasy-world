# 🎮 AI Game Arcade & Multi-Game Dev Studio

스팀(Steam) 및 모바일, 웹 플랫폼을 타깃으로 개발된 **14개 자율형 AI 인디 게임 개발 프로젝트** 통합 스튜디오입니다.

---

## ⚡ 빠른 실행 가이드 (3대 마스터 런처)

| 런처 파일 | 설명 | 접속/실행 방법 |
| :--- | :--- | :--- |
| [**`🎮_전체게임모음_실행.bat`**](file:///c:/Users/임종서/Desktop/auto%20gnimag/🎮_전체게임모음_실행.bat) | **14종 통합 허브**를 내 컴퓨터 기본 브라우저에서 즉시 실행 | 더블클릭 실행 |
| [**`🌐_외부인터넷_공유실행.bat`**](file:///c:/Users/임종서/Desktop/auto%20gnimag/🌐_외부인터넷_공유실행.bat) | 외부 네트워크(다른 집 PC, 모바일 LTE)에서 접속 가능한 **보안 HTTPS 터널** 발급 | 실행 후 화면의 URL 복사 |
| [**`🏠_같은와이파이_공유실행.bat`**](file:///c:/Users/임종서/Desktop/auto%20gnimag/🏠_같은와이파이_공유실행.bat) | 같은 Wi-Fi/LAN에 연결된 스마트폰이나 노트북에서 접속 (`192.168.18.152:8000`) | 로컬 웹 서버 가동 |

> 🌐 **24시간 온라인 GitHub Pages 주소**:  
> 👉 [**https://marine13new-coder.github.io/fantasy-world/**](https://marine13new-coder.github.io/fantasy-world/)  
> *(PC가 꺼져 있어도 전 세계 어디서든 링크 클릭만으로 14종 전체 즉시 플레이 가능)*

---

## 📂 프로젝트 폴더 구조도

```
auto gnimag/
├── 🎮_전체게임모음_실행.bat         (내 PC에서 14종 통합 허브 즉시 실행)
├── 🌐_외부인터넷_공유실행.bat        (원격/외부 PC용 HTTPS 공유 링크 발급)
├── 🏠_같은와이파이_공유실행.bat      (동일 LAN/와이파이 로컬 서버 가동)
├── README.md                        (현재 프로젝트 종합 설명서)
├── AGENTS.md                        (AI 바이브코딩 4대 아키텍처 원칙 가이드)
│
├── site/                            (⭐ 14종 통합 웹 포털 & GitHub Pages 배포 소스)
│   ├── index.html                   (14개 게임 아케이드 허브 메인 페이지)
│   ├── manifest.json                (14종 게임 데이터베이스 및 메타데이터)
│   ├── 01~14 개별 게임 웹 클라이언트 폴더들...
│
├── 개별게임_실행/                    (개별 게임 1클릭 단독 실행 런처 14개)
│   ├── 01_네온서바이벌_실행.bat
│   ├── 02_크로노블레이드_실행.bat
│   ├── 03_감스트호수공원_실행.bat
│   ├── 04_아키텍츠FC_실행.bat
│   ├── 05_인형뽑기_실행.bat
│   ├── 06_3D비행기_실행.bat
│   ├── 07_판타지월드_실행.bat
│   ├── 08_송백리살인사건_실행.bat
│   ├── 09_은하아파트13동_실행.bat
│   ├── 10_아카이브1999_실행.bat
│   ├── 11_VALO_FPS_실행.bat
│   ├── 12_어비스롤_실행.bat
│   ├── 13_심리스픽셀RPG_실행.bat
│   └── 14_코지픽셀낚시_실행.bat
│
├── 🎮 유니티(Unity) 게임 프로젝트 폴더들
│   ├── AbyssRoll/                   (#12 어비스 롤 유니티 다크 판타지 주사위 로그라이크)
│   ├── SeamlessPixelRPG/            (#13 심리스 오픈월드 200직업 & 드래곤 레이드 픽셀 RPG)
│   ├── KoreaZombieSurvival/         (서울 실지도 기반 좀비 서바이벌 유니티 프로젝트)
│   └── Assets/ & ProjectSettings/   (#14 코지 픽셀 낚시터 바탕화면 투명 오버레이 프로젝트)
│
├── apk_releases/                    (안드로이드 모바일 APK 설치 파일 및 QR코드)
│   ├── AbyssRoll-BloodCasino.apk
│   └── 안드로이드_APK_휴대폰설치.bat
│
├── docs/                            (기획서, 스토리 시나리오, 출시 가이드 문서)
│   ├── README_송백리살인사건_시나리오.md
│   ├── README_은하아파트13동_시나리오.md
│   ├── README_호러게임_시나리오.md
│   ├── STEAM_STORE_PAGE.md
│   └── MORNING_RELEASE_GUIDE.md
│
├── tools/                           (Python 생성기, 데이터 파서, 보조 자동화 유틸)
│   ├── update_arcade_portal.py
│   ├── generate_fish_dex.py
│   └── create_launchers.py ...
│
├── assets_archive/                  (원화, 스프라이트, 베이스64 및 레거시 HTML 백업)
└── logs/                            (빌드 및 컴파일 로그 보관)
```

---

## 🕹️ 14개 게임 전체 카탈로그

| # | 게임 타이틀 | 장르 / 주요 메커니즘 | 플랫폼 / 엔진 | 웹 플레이 경로 |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **NEON SURVIVOR** | 탑다운 사이버 뱀서라이크 | Web (Canvas 2D) | [`site/neon-survivor/`](site/neon-survivor/index.html) |
| **02** | **CHRONO BLADE** | 슬로우모션 타임 슬라이서 아케이드 | Web (Canvas 2D) | [`site/chrono-blade/`](site/chrono-blade/index.html) |
| **03** | **감스트 호수공원 질주** | 탑다운 장애물 회피 보이스 러너 | Web (Canvas 2D) | [`site/gamst-lake-park/`](site/gamst-lake-park/index.html) |
| **04** | **아키텍츠 FC** | 전설적 건축가 & 건물 축구 스쿼드 시뮬레이터 | Web (Tactical AI) | [`site/architecture-fc/`](site/architecture-fc/index.html) |
| **05** | **CLAW MASTER 3000** | 물리 엔진 3D 크레인 인형뽑기 | Web (Three.js) | [`site/claw-machine/`](site/claw-machine/index.html) |
| **06** | **스카이 에이스 3D** | 공중전 도그파이트 3D 비행 시뮬레이터 | Web (Three.js) | [`site/flight-3d/`](site/flight-3d/index.html) |
| **07** | **아테리아 대륙 연대기** | 절차적 생성 월드 & 샌드박스 판타지 RPG | Web (Modular Engine)| [`site/fantasy_world/`](site/fantasy_world/index.html) |
| **08** | **송백리 살인사건 1997** | 1997년 시골 마을 의문사 반전 추리 | Web (State Tree) | [`site/songbaek-killings/`](site/songbaek-killings/index.html) |
| **09** | **은하아파트 13동** | 입체 공간 음향 기반 심야 순찰 1인칭 공포 | Web (WebAudio Spatial)| [`site/apartment-13/`](site/apartment-13/index.html) |
| **10** | **아카이브 1999** | PS1 로우폴리 3D 폐병원 단서 공포 | Web (Three.js Retro)| [`site/archive-1999/`](site/archive-1999/index.html) |
| **11** | **크로노 펄스 3D** | 플라즈마 샷건 & 3D 반동 사이버펑크 FPS | Web (Three.js) | [`site/fps-arena/`](site/fps-arena/index.html) |
| **12** | **어비스 롤: 피의 카지노** | [칩 x 배수] 발라트로풍 주사위 로그라이크 | Web · Unity · APK | [`site/abyss-roll/`](site/abyss-roll/index.html) |
| **13** | **심리스 오픈월드 픽셀 RPG** | 200직업, 용병 전술 AI, 거대 드래곤 레이드 | Web · Unity 2D | [`site/seamless-pixel-rpg/`](site/seamless-pixel-rpg/index.html) |
| **14** | **코지 픽셀 낚시터** | 50종 도감, 6단계 FSM 텐션 릴링 & ASMR | Web · Unity Overlay | [`site/cozy-fishing/`](site/cozy-fishing/index.html) |

---

## 🛡️ 유니티 개발 환경 보호 원칙
- 모든 웹 테스트용 클라이언트는 [`site/`](site/) 디렉터리 내에 독립 패키징되어 있으므로, Unity 프로젝트 파일(`Assets/`, `Packages/`, `ProjectSettings/`, `AbyssRoll/`, `SeamlessPixelRPG/`, `KoreaZombieSurvival/`)을 직접 조작하거나 수정하지 않습니다.
- 유니티 에디터 개발 및 Unity-MCP 작업 시 파일 충돌이나 Lock 문제가 일체 발생하지 않습니다.
