# FreeLLMAPI 반복 작업 위임

설치 위치: 프로젝트 옆 `freellmapi/`. 공식 저장소 `tashfeenahmed/freellmapi`, 확인한 커밋 `e5df303b4b0a4dd66383867c2303865835d8521d`, MIT. 기존 저장소를 재클론하거나 설정을 덮어쓰지 않고 잠금파일로 `npm ci` 후 서버와 대시보드를 빌드했다. Node 24.14.0, npm 11.9.0으로 확인했다.

## 최초 연결 — 직접 할 일 3줄

1. `Tools/Start-FreeLLM.cmd`를 더블클릭하고 **http://127.0.0.1:3001**에서 최초 관리자 계정을 만든다.
2. **Keys**에서 본인의 무료 공급자 API 키를 추가한다. 키를 채팅·Git·게임 파일에 넣지 않는다.
3. `game-data` 체인은 현재 Qwen3.8 27B와 GPT-OSS 120B 두 Groq 모델로 설정되어 있다. **Keys → 통합 API 키 → 복사**를 누른 뒤 `Tools/FreeLLMWorker.cmd` 실행 시 숨김 입력란에 한 번 붙여넣는다. 키 자체를 채팅에 보내지 않는다.

무료 계정의 한도와 현재 가격은 공급자 콘솔에서 확인한다. FreeLLMAPI는 여러 공급자의 무료 할당량을 모으는 라우터이며 **무제한 무료 AI가 아니다**. 결제된 사용자 정의 모델도 연결할 수 있으므로 작업용 프로필에는 무료로 확인한 모델만 담는다. 공급자 계정 생성, API 키 발급 및 공급자 약관 동의는 대리 완료하지 않았다.

## 실제 위임 동작

`FreeLLMWorker.cmd` 기본 실행은 한국 시설별 아이템 6개를 제안하는 작은 JSON 작업 한 건이다. 출력은 최대 1,000토큰이며 자동 재시도나 여러 모델 동시 합성(Fusion)을 하지 않는다. 결과는 `Tools/AI-Drafts/`에 고유 파일명으로 저장된다. `reviewStatus: unreviewed`와 모델·사용량 메타데이터가 함께 남는다.

핵심 코드와 원본 게임 데이터는 호출기가 수정하지 않는다. 생성된 C#이나 셸 명령도 실행하지 않는다. 리드 에이전트가 JSON 의미·밸런스·중복 ID를 확인한 뒤 필요한 항목만 게임 데이터로 옮긴다. API가 실패하면 성공인 척한 가짜 AI 출력을 만들지 않는다.

작업 파일을 전달할 때:

```powershell
./Tools/FreeLLMWorker.ps1 -PromptFile ./Tools/my-task.txt
```

작업 파일에는 필요한 데이터 형식과 작은 예시만 넣는다. 전체 프로젝트, 저장 게임, 실제 사용자 위치, 비밀 키를 프롬프트에 넣지 않는다. 이 서버는 로컬에서 실행되지만, 선택한 외부 공급자에 프롬프트가 전송된다.

모델 사용 가능 여부만 확인하려면 `./Tools/FreeLLMWorker.ps1 -Check`. 이 호출은 추론을 요청하지 않는다. `FREELLM_API_KEY` 환경변수가 이미 있다면 우선 사용한다. 직접 입력한 unified key는 Windows DPAPI로 암호화하여 Git에서 제외된 `Tools/.freellm-key.clixml`에 저장하고, 다음 더블클릭부터 같은 Windows 계정에서 재사용한다. 브라우저나 서버 DB에서 키를 추출하지 않는다. `-ReplaceSavedKey`는 새 키를 입력해 교체하며, `-NoSaveKey`는 새로 입력한 키를 저장하지 않는다. 런처 종료 시 기존 프로세스 환경변수를 복원한다. Windows 계정/컴퓨터 변경 후 복호화할 수 없으면 키를 다시 입력한다.

`FREELLM_MODEL` 기본값은 `auto:game-data`, `FREELLM_BASE_URL` 기본값은 `http://127.0.0.1:3001/v1`이다. 비용 통제는 서버의 해당 프로필과 공급자 계정 설정에 달려 있다.

## 역할 분담

- 리드 에이전트: GIS 좌표·청크·저장 호환성·전투 판정·Unity 연결·빌드 검증과 최종 결과 검토.
- FreeLLMAPI: 소량 아이템/시설 설명/한국어 문구 초안, 데이터 행 확장, 국소적인 반복 코드 제안.
- Unity MCP: 리드 에이전트가 승인한 코드 반영 후 에디터 재컴파일·콘솔 검사·화면 확인.

현재 Codex 대화가 이 도구 때문에 자동으로 무료 모델로 전환되지는 않는다. OpenAI 호환 엔드포인트를 지원하는 별도 클라이언트에서는 Base URL `http://127.0.0.1:3001/v1`, API key는 unified key, model은 `auto:game-data`로 설정할 수 있다. 첨부 요청에 언급된 **Antigravity의 실제 설치/버전/Custom Base URL 지원 여부는 확인하지 않았으므로 메뉴 경로를 만들어 안내하지 않는다**. 사용량 소진 후 이 로컬 호출기를 직접 실행하는 것은 가능하지만, 코드 자동 검토·게임 개발 전체를 무인으로 완료하는 에이전트는 아니다.

## 실행과 보존

`Start-FreeLLM.ps1`은 서버를 숨김 창으로 실행하고 `127.0.0.1:3001`에만 바인딩한다. 재실행 시 정상 서버가 있으면 재사용한다. 신규 설치에서만 `.env` 암호화 키를 생성한다. 원본 `.env`와 `server/data/`는 공급자 키 복호화 및 사용자 설정에 필요하므로 지우거나 암호화 키를 교체하지 않는다. 원본 저장소 `.gitignore`가 두 경로를 제외한다. 서버 로그는 게임 `Logs/`에 남는다. 로그에는 초기 설정 코드가 있을 수 있으므로 통째로 공유하지 않는다.

## 실제 검증 범위

2026-10-24: 의존성 설치, TypeScript 서버 및 대시보드 빌드 완료. 로컬 대시보드 HTTP 200 응답 확인. 호출기 자체 검사 6개와 Windows DPAPI 키 재사용 검사 통과. `node --test Tools/FreeLLMWorker.test.js` 및 `powershell -File Tools/FreeLLMWorker.ps1.test.ps1`로 반복 가능하다.

Groq 공급자 키는 사용자가 등록했고 대시보드에서 `건강함`으로 확인되었다. `game-data` 체인에 무료 모델 2개를 저장한 후 Playground에서 GPT-OSS 120B 응답을 실제로 받았다. 제안된 일부 아이템은 배경·밸런스에 맞지 않아 게임 데이터에 무검토 반영하지 않았다. CLI 호출기는 통합 API 키를 아직 입력받지 않아 실제 호출 성공을 별도로 검증하지 않았다. Android·게임 빌드에는 이 개발 도구와 공급자 키를 포함하지 않는다.

공식 자료: [저장소](https://github.com/tashfeenahmed/freellmapi), 로컬 `freellmapi/docs/en/install/01-install.md`, `freellmapi/docs/en/api/01-rest-api.md`, `freellmapi/LICENSE`.
