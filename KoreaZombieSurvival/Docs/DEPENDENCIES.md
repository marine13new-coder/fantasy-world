# 의존성 조사 및 적용 결과

확인일: 2026-10-24. 다른 프로젝트 전체를 통째로 이식하지 않고, 당장 필요한 도구만 연결했습니다.

| 후보 | 결과 및 이유 | 공식 출처 |
|---|---|---|
| CoplayDev/unity-mcp | **도입 및 실제 연결 검증**. v10.0.0, commit `d49ae2953580f3481beb1e084a1da2682f0b5610`. MIT. Editor 패키지와 Python 서버를 프로젝트 Tools에 설치. 런타임 게임에 서버를 포함하지 않음 | https://github.com/CoplayDev/unity-mcp |
| Unity Cinemachine | **도입**. 설치된 Unity 6 패키지 6.6.0의 ImpulseSource로 피격 카메라 반응 연결. 자체 추적 카메라는 유지 | https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineImpulseSource.html |
| LibTessDotNet | **도입**. OSM의 오목한 건물 윤곽도 지붕으로 삼각분할. commit `bdc0b0f94904dd94c3edfb2c25aa358695276e09`, SGI Free Software License B 2.0 전문 보관 | https://github.com/speps/LibTessDotNet |
| FreeLLMAPI | **개발 도구로 도입**. commit `e5df303b4b0a4dd66383867c2303865835d8521d`, MIT. 로컬 서버와 무료 Groq 모델의 초안 생성 검증. 게임 빌드에는 미포함 | https://github.com/tashfeenahmed/freellmapi |
| Unity NavMeshComponents | 구형 저장소는 신규 개발이 AI Navigation 패키지로 이동. 이번 기능은 Unity 내장 NavMeshBuilder/NavMeshAgent/NavMeshObstacle로 구현해 추가 의존성 없이 사용 | https://github.com/Unity-Technologies/NavMeshComponents |
| Arnis | Minecraft 월드 생성 프로젝트이며 현재 Apache-2.0. Unity 게임용 MIT 라이브러리라고 가정하면 안 됨. 미도입 | https://github.com/louis-e/arnis / https://github.com/louis-e/arnis/blob/main/LICENSE |
| UnityOSM | 동명 저장소가 여럿이라 사용자 이름만으로 단일 저장소/라이선스를 확정할 수 없음. 미도입 | 특정 저장소 확정 후 재평가 |
| Mapbox Unity SDK | 지도 플랫폼 SDK는 서비스 토큰/약관/지원 범위를 별도 검토해야 함. 이번 반경 지도 프로토타입은 Overpass와 폴백으로 구현. 미도입 | https://github.com/mapbox/mapbox-unity-sdk |
| DOTween | 무료 버전도 단순 MIT라고 부를 수 없음. 자체 라이선스는 상업적 사용을 허용하지만 수정본 재배포 조건 등이 있음. 현재 짧은 카메라/조명 보간에 새 의존성이 필요 없어 미도입 | https://dotween.demigiant.com/license.php |
| Steamworks.NET | MIT 라이선스의 C# 래퍼. Steam 전용 기능이 생기는 단계에 도입할 후보, 현재 미도입 | https://github.com/rlabrecque/Steamworks.NET |

Unity MCP 소스의 LICENSE를 `Tools/unity-mcp/LICENSE`에 그대로 유지했습니다. Python 설치 버전은 `Tools/mcp-requirements.txt`, Unity 패키지는 `Packages/packages-lock.json`에 기록합니다. `Tools/unity-mcp`와 가상환경은 git에서 제외되므로 새 PC에서는 Setup-MCP.ps1을 먼저 실행합니다.

OSM 데이터는 소프트웨어 MIT 라이선스와 별개인 ODbL입니다. 인게임에는 OpenStreetMap contributors와 ODbL 표기를 넣었습니다. 지도 데이터 재배포/가공 DB 배포 시 [OSM 저작권 및 라이선스 안내](https://www.openstreetmap.org/copyright)를 확인해야 합니다. 공용 Overpass 엔드포인트가 상용 게임의 무제한 무료 백엔드라는 뜻은 아닙니다. Overpass 공식 사용 안내는 앱의 공용 서버 상시 의존 대신 자체 운영을 권합니다: https://dev.overpass-api.de/overpass-doc/en/preface/commons.html. 사각형 bbox와 `out body geom` 형식: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL.

`MapSnapshots/Gangnam.json`은 2026-10-23, `Nowon.json`과 `Jamsil.json`은 2026-10-24 해당 역 근처 OSM API 표본을 `Tools/Make-GangnamSample.py`로 변환한 가공 데이터입니다. OSM 원본의 노드·웨이 좌표와 시설 태그만 사용하며 실제 건물 실내는 포함하지 않지만 OSM에 기록된 일부 건물의 `height`와 `building:levels` 태그 및 일부 `leisure=park` 공원 경계는 포함합니다. 이 표본의 출처 및 이용 조건은 ODbL을 따릅니다. 상용 서비스 시 공용 OSM 편집 API/Overpass를 대량 트래픽 백엔드로 사용하지 말고 캐시·자체 데이터 공급 경로를 설계해야 합니다. 공개 Nominatim의 [사용 정책](https://operations.osmfoundation.org/policies/nominatim/)에 맞지 않는 임의 주소 자동 검색은 현재 게임에 넣지 않았습니다.

`BundledPlaceCatalog`는 위 세 표본에 이미 포함된 정확한 시설명과 좌표만 오프라인으로 조회합니다. 동일 명칭이 서로 다른 위치에 있으면 자동 선택하지 않습니다. 임의 주소 지오코딩이나 전국 POI 데이터가 아니며, 범위를 넓힐 때는 별도 허가된 데이터 공급 경로가 필요합니다.

적용한 작업 규칙: 프로젝트 AGENTS.md의 4대 원칙, 오류 지점 우선 조사, 자동 플레이 검사, MCP 콘솔/화면 검증, 자체 스크립트 전문 묶음. graphify 스킬의 기존 그래프 우선 경로도 확인했지만 현재 폴더에는 기존 graphify 그래프가 없고 사용자가 `/graphify` 빌드를 요청하지 않아 전체 웹게임 코퍼스 그래프는 새로 생성하지 않았습니다.


