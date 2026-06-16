"""① 생성 — Claude 가 단일 파일 HTML5 게임을 만든다 (필요 시 피드백 반영 재생성)."""
import re
import anthropic

import config
from pipeline import tracing

try:
    from langsmith.wrappers import wrap_anthropic
    _client = wrap_anthropic(anthropic.Anthropic())  # Claude 호출 자동 트레이싱
except ImportError:
    _client = anthropic.Anthropic()
_SYSTEM = (config.PROMPTS_DIR / "generate_system.md").read_text(encoding="utf-8")


def _strip_fences(text: str) -> str:
    """모델이 실수로 ```html ... ``` 로 감싸면 벗겨낸다."""
    text = text.strip()
    fence = re.match(r"^```[a-zA-Z]*\n(.*)\n```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    # <!DOCTYPE 이전의 잡담 제거
    idx = text.lower().find("<!doctype")
    if idx == -1:
        idx = text.lower().find("<html")
    return text[idx:].strip() if idx > 0 else text


@tracing.traceable(name="generate", run_type="chain")
def generate(theme: str, feedback: str | None = None, prior_html: str | None = None) -> str:
    """게임 HTML 문자열을 반환. feedback+prior_html 이 있으면 개선 모드."""
    if feedback and prior_html:
        user = (
            f"테마: {theme}\n\n"
            f"아래는 직전 버전 게임 코드다. 평가에서 다음 문제가 지적됐다:\n\n"
            f"{feedback}\n\n"
            f"이 문제들을 고쳐서 완전한 HTML 전체를 다시 출력하라.\n\n"
            f"--- 직전 버전 ---\n{prior_html}"
        )
    else:
        user = f"테마: {theme}\n\n이 테마로 완성도 높은 단일 파일 HTML5 게임을 만들어라."

    with _client.messages.stream(
        model=config.GEN_MODEL,
        max_tokens=config.GEN_MAX_TOKENS,
        thinking={"type": "adaptive"},
        output_config={"effort": "high"},
        system=_SYSTEM,
        messages=[{"role": "user", "content": user}],
    ) as stream:
        msg = stream.get_final_message()

    text = next((b.text for b in msg.content if b.type == "text"), "")
    html = _strip_fences(text)
    if "<canvas" not in html.lower() and "<script" not in html.lower():
        raise ValueError("생성 결과가 유효한 게임 HTML 같지 않음")
    return html
