# AI Game Arcade — 생성 → 평가 → 플레이테스트 → 자동배포 파이프라인

테마 한 줄을 주면 **AI가 브라우저 게임을 만들고 → AI 비전이 평가하고 → 헤드리스 브라우저로 직접 플레이해 기능·재미를 검증하고 → 통과작만 자동 배포**한다.
여러 AI 에이전트(기획·개발·평가·QA·배포)가 한 팀처럼 일하며, 통과하지 못하면 피드백을 반영해 다시 만들거나 다른 게임으로 교체해 **목표 개수의 통과작을 채울 때까지** 무인으로 돈다.

🎮 **라이브 데모:** https://bat1120.github.io/ai-game-arcade/
　(매일 자동으로 통과작이 쌓이는 갤러리 — 배포 결과물 저장소는 [bat1120/ai-game-arcade](https://github.com/bat1120/ai-game-arcade))

---

## 왜 만들었나

"AI가 게임을 만든다"는 데모는 많지만, 화면만 그럴듯하고 **실제로는 안 돌아가는** 결과가 그대로 통과되는 게 문제였다.
이 프로젝트의 핵심은 생성이 아니라 **평가·검증·배포까지 닫힌 루프**다. 스크린샷·콘솔 로그로는 절대 안 잡히는 동작 버그(반응 없는 클릭, 멈추는 적, 유효 단어를 거부하는 워들)를 **실제 키·마우스 입력으로 플레이해보는 QA 에이전트**가 걸러낸다.

## 파이프라인

```
[테마/기획]
 ① 기획   plan_game        다음에 만들 게임 장르·메카닉·승패조건 설계
 ② 생성   generate         LLM이 단일 HTML5 게임 코드 생성 (피드백 반영 재생성)
 ③ 정적검사 static_check    구조/오프라인 위반 등 싼 결함 필터
 ④ 런타임  runtime_check    헤드리스 Chrome 렌더 → 스크린샷 + 콘솔에러 수집
 ⑤ 비전평가 evaluate        비전 모델이 채점(JSON) — 렌더/플레이가능/테마부합/버그
 ⑥ 기능+재미 playtest(CDP)  실제 키·마우스로 직접 플레이 → 반응/진행/유효입력 판정 + 재미 0~100 채점
 ⑦ 게이트  build_arcade     비전≥THRESHOLD & 재미≥FUN_THRESHOLD → 통과 / 미달 → ②로 피드백 재생성
 ⑧ 배포   deploy / daily   통과작만 갤러리에 병합 → git push site/ → GitHub Pages
```

- **게임 형식**은 "단일 HTML5 파일"로 고정 — 장르·메카닉은 AI가 매번 자유롭게 정하되, 테스트·배포 파이프라인은 항상 동작한다.
- **QA가 재미까지 평가** — 난이도 상승·업그레이드 선택·보상 루프 같은 요소를 0~100으로 채점해, "돌아가지만 재미없는" 게임도 걸러낸다.
- **측정의 함정 보정** — 실시간 게임은 플레이테스터가 가만히 있으면 과소평가되므로, WASD+마우스로 계속 움직이며 조준·플레이하는 액티브 플레이 라운드로 측정한다.

## 에이전트 협업 (Slack 중계)

`SLACK_WEBHOOK_URL`을 넣으면 각 단계가 **회사 팀 대화처럼** 슬랙으로 중계된다.

| 역할 | 페르소나 | 하는 일 |
|---|---|---|
| `pm` | 팀 리드 | 스탠드업, 목표 공유, 진행상황 종합 |
| `planner` | 기획자 | 게임 컨셉·메카닉 설계 |
| `dev` | 개발자 | HTML5 게임 코드 생성/수정 |
| `review` | 평가자 | 비전 기반 채점·피드백 |
| `qa` | QA | 실제 플레이로 기능·재미 검증 |
| `release` | 릴리스 | 통과작 배포 |

## 설치

```bash
python -m venv .venv && .venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env                              # 키 입력 (아래 참고)
```

전제: PC에 **Google Chrome** 설치(④⑥ 헤드리스 실행/플레이테스트용). 자동탐지 실패 시 `.env`의 `CHROME_PATH` 지정.

`.env` 필수/선택 항목은 [`.env.example`](.env.example) 참고:
- `ANTHROPIC_API_KEY` (claude 엔진) 또는 `OPENAI_API_KEY` (openai 엔진 / 아케이드 빌드)
- 선택: `SLACK_WEBHOOK_URL`, `LANGSMITH_API_KEY`, `NETLIFY_*`, `CHROME_PATH`

## 사용

### 단건 — 테마 하나로 게임 1개
```bash
python main.py "우주 슈팅 게임"
python main.py "벽돌깨기" --threshold 80 --max-retries 5
python main.py "뱀 게임" --no-deploy            # 생성·평가만, 배포 생략
python main.py "퍼즐" --engine openai           # 엔진 선택 (claude 기본)
```
결과물·스크린샷은 `games/<slug>/` 에 저장된다.

### 아케이드 — 통과작 N개를 채울 때까지 무인 빌드
```bash
python daily.py            # 기능+재미 통과작 3개 목표
python daily.py 5
python daily.py 3 --no-deploy
```
카탈로그 미사용분 → 트렌드 기반 신규 발굴 순으로 후보를 골라, 한 게임이 통과 못 하면 버리고 교체해 목표 개수를 채운다(안전 상한 `N×4`). 통과작은 `site/manifest.json`에 병합되고 GitHub Pages로 배포된다.

매일 자동 실행은 Windows Task Scheduler(오전 9시)로 `daily.py`를 돌리도록 구성돼 있다.

## 모델 / 엔진 (`config.py`)

| 엔진 | 생성 | 평가 |
|---|---|---|
| `claude` (기본) | `claude-opus-4-8` (adaptive thinking) | `claude-sonnet-4-6` (비전+structured output) |
| `openai` | `gpt-5.4-mini` | `gpt-5.4-mini` |

| 항목 | 기본 | 의미 |
|---|---|---|
| `PASS_THRESHOLD` | 75 | 비전 평가 통과 점수 |
| `FUN_THRESHOLD` | 60 | 재미 평가 통과 점수 (`build_arcade.py`) |
| `MAX_RETRIES` | 4 | 통과까지 최대 재생성 |
| `RUNTIME_BUDGET_MS` | 4000 | 헤드리스로 게임을 굴려볼 시간 |

## LangSmith 추적

파이프라인 전체가 LangSmith 트레이스 트리로 기록된다(`game_pipeline`/`daily_build` 루트 → 시도별 단계, LLM 호출은 `wrap_openai`/`wrap_anthropic`로 토큰·지연까지 자동 중첩).

- `LANGSMITH_API_KEY`(+`LANGSMITH_TRACING=true`)를 `.env`에 넣으면 켜짐. 없으면 추적 OFF로 정상 동작.
- 보기: https://smith.langchain.com → 프로젝트 `ai-game-pipeline`.

## 프로젝트 구조

```
main.py            단건 파이프라인 진입점 (테마 1개 → 게임 1개)
daily.py           아케이드 빌드 — 통과작 N개 채우는 deliver 루프 + 배포
build_arcade.py    게임 카탈로그 + build_one()/build_gallery() (비전+재미 게이트)
config.py          모델·임계값·경로·Chrome 탐지
rebuild.py / audit_games.py / rescore_fun.py   유지보수 스크립트
prompts/           생성·평가 시스템 프롬프트
pipeline/
  generate.py / evaluate.py    Claude 엔진 (생성 / 비전 평가)
  openai_engine.py             OpenAI 엔진 (생성·평가·기획·테스트설계·재미판정·게임발굴)
  static_check.py              정적 결함 필터
  runtime_check.py             헤드리스 Chrome 렌더 + 콘솔에러
  cdp.py                       Chrome DevTools Protocol — 실제 키/마우스 입력
  playtest.py                  실시간/턴제 자동 플레이테스트
  schema.py                    GameEval / PlayVerdict(재미 점수)
  notify.py                    Slack 에이전트 페르소나 중계
  tracing.py                   LangSmith 셋업
  deploy.py                    Netlify/로컬 배포 (단건 경로)
```
