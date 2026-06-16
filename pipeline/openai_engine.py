"""OpenAI(GPT) 엔진 — 생성·평가를 Claude 대신 OpenAI SDK로 수행.

Claude 버전(generate.py/evaluate.py)과 동일한 시그니처/반환형(GameEval)을 제공한다.
키는 OPENAI_API_KEY 환경변수, 없으면 사용자의 다른 프로젝트 .env 에서 런타임에 읽는다
(값은 출력하지 않음).
"""
import base64
import json
import os
from pathlib import Path

from openai import OpenAI, BadRequestError

import config
from pipeline.schema import GameEval, PlayVerdict  # 평가 스키마 (SDK 비의존)
from pipeline import tracing  # LangSmith 셋업 + 데코레이터

_GEN_SYSTEM = (config.PROMPTS_DIR / "generate_system.md").read_text(encoding="utf-8")
_EVAL_SYSTEM = (config.PROMPTS_DIR / "evaluate_system.md").read_text(encoding="utf-8")


def _load_key() -> str | None:
    if os.getenv("OPENAI_API_KEY"):
        return os.getenv("OPENAI_API_KEY")
    src = Path(os.getenv(
        "OPENAI_ENV_FILE",
        r"C:\Users\bat98\ai-news-summarizer\.env",
    ))
    if src.exists():
        try:
            from dotenv import dotenv_values
            return dotenv_values(src).get("OPENAI_API_KEY")
        except ImportError:
            pass
    return None


_client = tracing.wrap_openai(OpenAI(api_key=_load_key()))  # OpenAI 호출 자동 트레이싱


def _chat(**kw):
    """gpt-5.x 계열의 파라미터 차이에 방어적으로 대응하는 chat.completions 래퍼."""
    try:
        return _client.chat.completions.create(**kw)
    except BadRequestError as e:
        msg = str(e).lower()
        # 일부 신모델: max_tokens 미지원 → max_completion_tokens, temperature 미지원
        if "max_tokens" in msg and "max_completion_tokens" not in kw and "max_tokens" in kw:
            kw["max_completion_tokens"] = kw.pop("max_tokens")
            return _chat(**kw)
        if "temperature" in msg and "temperature" in kw:
            kw.pop("temperature")
            return _chat(**kw)
        raise


def _strip_fences(text: str) -> str:
    import re
    text = (text or "").strip()
    m = re.match(r"^```[a-zA-Z]*\n(.*)\n```$", text, re.DOTALL)
    if m:
        text = m.group(1).strip()
    idx = text.lower().find("<!doctype")
    if idx == -1:
        idx = text.lower().find("<html")
    return text[idx:].strip() if idx > 0 else text


def _loads_first(raw: str | None) -> dict:
    """JSON 파싱 — 'Extra data'(객체 여러 개 연결) 등은 첫 객체만 안전하게 디코드."""
    raw = raw or "{}"
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        try:
            obj, _ = json.JSONDecoder().raw_decode(raw[raw.find("{"):])
            return obj if isinstance(obj, dict) else {}
        except Exception:
            return {}


_PLAN_SYSTEM = (
    "너는 캐주얼 게임 기획자다. 주어진 테마로 단일 HTML5 canvas 게임을 만들기 위한 "
    "구체적이고 실행 가능한 기획안을 작성한다. 추상적 표현 금지, 개발자가 바로 구현할 수준으로.\n"
    "핵심: '동작만 하는 얕은 게임'이 아니라 계속 하고 싶은 게임을 설계하라. 반드시:\n"
    "- progression: 시간/점수/웨이브/레벨에 따라 난이도가 어떻게 점점 올라가는지 구체적으로.\n"
    "- choices: 플레이어가 하는 의미 있는 선택/성장 시스템 — 예) 레벨업 시 3택1 업그레이드, "
    "아이템 획득·사용, 퍽, 전략 분기. 최소 한 종류는 반드시 넣고 구체적 옵션 예시를 적어라.\n"
    "JSON 으로만: {\"concept\":\"한 줄 컨셉\", \"core_loop\":\"핵심 플레이 루프\", "
    "\"controls\":\"조작 방식(키/마우스)\", \"objective\":\"목표·승리조건\", \"lose\":\"패배조건\", "
    "\"progression\":\"난이도 상승 방식(구체)\", \"choices\":\"플레이어 선택/업그레이드 시스템(구체 옵션 포함)\", "
    "\"ui\":[\"화면에 표시할 요소들\"], \"scope\":[\"구현 체크리스트 항목들(난이도·선택 시스템 포함)\"]}"
)


def plan_game(theme: str) -> dict:
    resp = _chat(
        model=config.OPENAI_EVAL_MODEL,
        messages=[{"role": "system", "content": _PLAN_SYSTEM},
                  {"role": "user", "content": f"테마: {theme}"}],
        max_completion_tokens=900,
        response_format={"type": "json_object"},
    )
    return _loads_first(resp.choices[0].message.content)


def _plan_text(plan: dict) -> str:
    if not plan:
        return ""
    ui = ", ".join(plan.get("ui", [])) if isinstance(plan.get("ui"), list) else plan.get("ui", "")
    scope = ", ".join(plan.get("scope", [])) if isinstance(plan.get("scope"), list) else plan.get("scope", "")
    return (f"[기획안]\n- 컨셉: {plan.get('concept','')}\n- 핵심 루프: {plan.get('core_loop','')}\n"
            f"- 조작: {plan.get('controls','')}\n- 목표: {plan.get('objective','')}\n"
            f"- 패배: {plan.get('lose','')}\n- 난이도 진행: {plan.get('progression','')}\n"
            f"- 선택/성장: {plan.get('choices','')}\n- UI: {ui}\n- 구현 범위: {scope}")


@tracing.traceable(name="generate", run_type="chain")
def generate(theme: str, feedback: str | None = None, prior_html: str | None = None,
             plan: dict | None = None) -> str:
    plan_block = (_plan_text(plan) + "\n\n") if plan else ""
    if feedback and prior_html:
        user = (
            f"테마: {theme}\n\n{plan_block}직전 버전 평가에서 지적된 문제:\n{feedback}\n\n"
            f"기획안을 지키되 이 문제들을 고쳐 완전한 HTML 전체를 다시 출력하라.\n\n--- 직전 버전 ---\n{prior_html}"
        )
    else:
        user = f"테마: {theme}\n\n{plan_block}위 기획안대로 완성도 높은 단일 파일 HTML5 게임을 만들어라."

    resp = _chat(
        model=config.OPENAI_GEN_MODEL,
        messages=[
            {"role": "system", "content": _GEN_SYSTEM},
            {"role": "user", "content": user},
        ],
        max_completion_tokens=config.GEN_MAX_TOKENS,
    )
    html = _strip_fences(resp.choices[0].message.content)
    if "<canvas" not in html.lower() and "<script" not in html.lower():
        raise ValueError("생성 결과가 유효한 게임 HTML 같지 않음")
    return html


_EVAL_SCHEMA = {
    "type": "object",
    "properties": {
        "renders": {"type": "boolean"},
        "playable": {"type": "boolean"},
        "matches_theme": {"type": "boolean"},
        "visual_quality": {"type": "integer"},
        "bug_free": {"type": "boolean"},
        "overall_score": {"type": "integer"},
        "issues": {"type": "array", "items": {"type": "string"}},
        "suggestions": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["renders", "playable", "matches_theme", "visual_quality",
                 "bug_free", "overall_score", "issues", "suggestions"],
    "additionalProperties": False,
}


@tracing.traceable(name="evaluate", run_type="chain")
def evaluate(theme: str, screenshot: Path | None, errors: list[str]) -> GameEval:
    err_text = "\n".join(errors) if errors else "(없음)"
    parts: list[dict] = []
    if screenshot and screenshot.exists():
        b64 = base64.standard_b64encode(screenshot.read_bytes()).decode()
        parts.append({"type": "image_url",
                      "image_url": {"url": f"data:image/png;base64,{b64}"}})
    else:
        parts.append({"type": "text", "text": "[스크린샷 없음 — 렌더 실패로 간주]"})
    parts.append({"type": "text", "text": (
        f"의도한 테마: {theme}\n\n콘솔/런타임 에러 로그:\n{err_text}\n\n"
        "위 스크린샷과 로그를 근거로 게임을 평가하라."
    )})

    resp = _chat(
        model=config.OPENAI_EVAL_MODEL,
        messages=[
            {"role": "system", "content": _EVAL_SYSTEM},
            {"role": "user", "content": parts},
        ],
        max_completion_tokens=2000,
        response_format={
            "type": "json_schema",
            "json_schema": {"name": "game_eval", "strict": True, "schema": _EVAL_SCHEMA},
        },
    )
    return GameEval(**json.loads(resp.choices[0].message.content))


# ---- 기능 테스트: 테스트 설계 + 결과 판정 ----
_DESIGN_SYSTEM = (
    "너는 게임 QA 자동화 테스트 설계자다. 주어진 게임 HTML 을 읽고, 핵심 플레이를 실제로 "
    "조작해 '동작 버그'(코드/스크린샷만으로는 안 드러나는 것)를 노출시킬 테스트 계획을 만든다.\n\n"
    "먼저 게임의 진행 방식을 분류하라:\n"
    "  - mode=\"turn_based\": 입력할 때만 상태가 변함 (워들/2048/매치3/카드 등). 유휴 시간엔 안 변하는 게 정상.\n"
    "  - mode=\"realtime\": 시간이 흐르면 입력 없이도 상태가 계속 변함 (러너/슈팅/타워디펜스/서바이벌/방치형 등).\n"
    "  - needs_aim=true: 마우스 방향으로 조준/사격하는 게임. 이때 steps 에 'move' 로 마우스를 적들 쪽으로 옮겨라.\n\n"
    "조작 수단(steps 의 action):\n"
    "  - {\"action\":\"type\",\"text\":\"...\"}\n"
    "  - {\"action\":\"press\",\"key\":\"Enter|Space|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Backspace|a~z|0~9\"}\n"
    "  - {\"action\":\"click\",\"x\":0~1,\"y\":0~1} / {\"action\":\"move\",\"x\":0~1,\"y\":0~1} (상대좌표)\n"
    "  - {\"action\":\"wait\",\"ms\":정수}\n\n"
    "규칙:\n"
    "  - 반드시 게임을 시작시켜라(필요시 Space/Enter/Start 클릭).\n"
    "  - turn_based 면 상태를 바꾸는 입력을 '여러 번 서로 다르게' 넣어라(각 입력마다 변화를 확인하려는 것).\n"
    "  - realtime 이면 시작시킨 뒤 자연 진행을 관찰하도록 적절한 입력 + wait 를 섞어라.\n"
    "  - 단어 맞추기류면 흔한 유효 5글자 단어(예: crane, slate, house)를 입력+Enter 해서 '유효 단어 거부' 여부를 꼭 확인하라.\n"
    "  - needs_aim 이면 move 로 마우스를 옮겨 자동사격이 적을 맞히게 하라.\n\n"
    "JSON 으로만 출력: {\"mode\":\"turn_based|realtime\", \"needs_aim\":true|false, "
    "\"steps\":[...], \"expected\":\"통과로 볼 정상 동작\", \"bug_signals\":[\"버그 신호들\"]}"
)


_INVENT_SYSTEM = (
    "너는 캐주얼 브라우저 게임 기획자다. 2026년 웹에서 인기 있는 장르(데일리 퍼즐, 방치형, "
    "레트로 아케이드, 매치류, 타워디펜스, 서바이벌, 리듬, 단어/숫자 퍼즐 등)를 바탕으로 "
    "단일 HTML5 canvas 로 구현 가능한 신선한 게임 컨셉을 만든다.\n"
    "각 컨셉: slug(영문 소문자-하이픈, 고유), title(짧은 영문 대문자), "
    "theme(생성기에 줄 한국어 설명 — 핵심 조작·목표·승패·표시요소 포함).\n"
    "이미 있는 제목과 겹치지 않게 하라. JSON 으로만: {\"games\":[{\"slug\":..,\"title\":..,\"theme\":..}, ...]}"
)


def invent_games(n: int, avoid_titles: list[str]) -> list[dict]:
    resp = _chat(
        model=config.OPENAI_EVAL_MODEL,
        messages=[
            {"role": "system", "content": _INVENT_SYSTEM},
            {"role": "user", "content": f"{n}개의 새 게임 컨셉을 만들어라. 이미 있는 제목(피할 것): {avoid_titles}"},
        ],
        max_completion_tokens=1200,
        response_format={"type": "json_object"},
    )
    data = _loads_first(resp.choices[0].message.content)
    out = []
    for g in (data.get("games") or [])[:n]:
        if g.get("slug") and g.get("title") and g.get("theme"):
            out.append({"slug": str(g["slug"]).strip().lower().replace(" ", "-"),
                        "title": g["title"], "theme": g["theme"]})
    return out


def design_test(theme: str, html: str) -> dict:
    resp = _chat(
        model=config.OPENAI_EVAL_MODEL,
        messages=[
            {"role": "system", "content": _DESIGN_SYSTEM},
            {"role": "user", "content": f"테마: {theme}\n\n게임 HTML:\n{html[:14000]}"},
        ],
        max_completion_tokens=1600,
        response_format={"type": "json_object"},
    )
    data = _loads_first(resp.choices[0].message.content)
    steps = data.get("steps") if isinstance(data.get("steps"), list) else []
    mode = data.get("mode") if data.get("mode") in ("turn_based", "realtime") else "realtime"
    return {"steps": steps, "mode": mode, "needs_aim": bool(data.get("needs_aim")),
            "expected": data.get("expected", ""),
            "bug_signals": data.get("bug_signals", [])}


_VERDICT_SCHEMA = {
    "type": "object",
    "properties": {
        "passed": {"type": "boolean"},
        "severity": {"type": "string"},
        "bugs": {"type": "array", "items": {"type": "string"}},
        "notes": {"type": "string"},
        "fun_score": {"type": "integer"},
        "fun_notes": {"type": "string"},
    },
    "required": ["passed", "severity", "bugs", "notes", "fun_score", "fun_notes"],
    "additionalProperties": False,
}

_JUDGE_SYSTEM = (
    "너는 직접 플레이해본 게임 QA 겸 플레이테스터다. 게임의 진행 방식(mode), 기획 의도, "
    "'조작 전/후' 스크린샷, 콘솔 에러, 그리고 두 종류의 상태 스냅샷이 주어진다:\n"
    "  (A) 조작-단위 스냅샷: 각 입력 직후의 화면 텍스트 (입력→변화 확인용)\n"
    "  (B) 시간경과 스냅샷: 입력 없이 둔 동안의 화면 텍스트 (자연 진행 확인용)\n\n"
    "【1】 기능 정상 여부(passed) — mode 에 따라:\n"
    "- turn_based: 입력에 따라 상태(보드/타일/글자/점수 등)가 반응해 변해야 정상. 여러 입력에도 (A)가 "
    "처음부터 끝까지 완전 동일하면 버그. (B) 유휴 정지는 정상. 유효 입력 거부는 버그(단 '글자수 부족'류는 "
    "테스트 입력 누락일 수 있어 단정 금지).\n"
    "- realtime: 시작 후 (B)에서 상태가 계속 진행해야 정상. 시작됐는데 완전히 얼어붙으면 버그. 정상 게임오버는 제외.\n"
    "- 콘솔/런타임 에러 있으면 passed=false. severity 는 none/minor/major/critical.\n\n"
    "【2】 재미/몰입 평가(fun_score 0~100) — 직접 해본 입장에서 솔직하게:\n"
    "- 난이도가 점점 올라가 긴장감이 생기는가? (시간/웨이브/점수에 따라 강해지는 신호가 보이나)\n"
    "- 업그레이드/아이템/퍽 등 **의미 있는 선택·성장**이 실제로 등장하는가? (기획 의도와 대조)\n"
    "- 점수·콤보·연쇄 등 **보상 루프**가 있는가? 다시 하고 싶은 동기가 있나?\n"
    "- 단조로운 반복뿐이거나 한 번 보면 끝인 얕은 게임이면 낮게(40 이하) 줘라.\n"
    "- 기능이 깨졌으면(passed=false) 재미도 그에 맞게 낮게.\n"
    "fun_notes 에 재미를 높이려면 뭘 추가/개선해야 하는지 구체적으로 적어라. 모두 한국어."
)


def judge_playtest(theme: str, expected: str, bug_signals: list[str], mode: str,
                   before_png: Path, after_png: Path,
                   step_series: list[str], time_series: list[str],
                   console_errors: list[str], plan_summary: str = "",
                   code_features: str = "") -> PlayVerdict:
    parts: list[dict] = [{"type": "text", "text": "[조작 전 화면]"}]
    parts.append({"type": "image_url", "image_url": {
        "url": f"data:image/png;base64,{base64.standard_b64encode(before_png.read_bytes()).decode()}"}})
    parts.append({"type": "text", "text": "[조작 후 화면]"})
    parts.append({"type": "image_url", "image_url": {
        "url": f"data:image/png;base64,{base64.standard_b64encode(after_png.read_bytes()).decode()}"}})
    step_txt = "\n".join(f"  {i}. {s}" for i, s in enumerate(step_series or []))
    time_txt = "\n".join(f"  [{i*2.5:.1f}s] {s}" for i, s in enumerate(time_series or []))
    parts.append({"type": "text", "text": (
        f"게임 mode: {mode}\n테마: {theme}\n기대 동작: {expected}\n버그 신호: {bug_signals}\n\n"
        f"기획 의도(난이도·선택 시스템):\n{plan_summary or '(미제공)'}\n\n"
        f"코드에 실제로 구현된 시스템(정적 스캔): {code_features or '(감지 안 됨)'}\n"
        "→ 짧은 자동 플레이로 직접 못 본 시스템이라도 코드에 분명히 있으면 그 깊이를 재미 점수에 인정하라"
        "(단, 기능이 깨졌으면 제외).\n\n"
        f"(A) 조작-단위 스냅샷:\n{step_txt or '(없음)'}\n\n"
        f"(B) 시간경과 스냅샷:\n{time_txt or '(없음)'}\n\n"
        f"콘솔/런타임 에러:\n{chr(10).join(console_errors) or '(없음)'}\n\n"
        "기능 정상 여부(passed)와 재미/몰입(fun_score)을 함께 판정하라. "
        "기획에 적힌 난이도 진행·선택 시스템이 실제 플레이에서 보이는지 대조하라."
    )})

    resp = _chat(
        model=config.OPENAI_EVAL_MODEL,
        messages=[{"role": "system", "content": _JUDGE_SYSTEM},
                  {"role": "user", "content": parts}],
        max_completion_tokens=1200,
        response_format={"type": "json_schema",
                         "json_schema": {"name": "play_verdict", "strict": True,
                                         "schema": _VERDICT_SCHEMA}},
    )
    return PlayVerdict(**json.loads(resp.choices[0].message.content))
