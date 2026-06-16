"""④ 평가 — Claude 비전이 스크린샷+에러로그를 보고 점수를 매긴다 (structured output)."""
import base64
from pathlib import Path

import anthropic

import config
from pipeline.schema import GameEval
from pipeline import tracing

try:
    from langsmith.wrappers import wrap_anthropic
    _client = wrap_anthropic(anthropic.Anthropic())
except ImportError:
    _client = anthropic.Anthropic()
_SYSTEM = (config.PROMPTS_DIR / "evaluate_system.md").read_text(encoding="utf-8")


@tracing.traceable(name="evaluate", run_type="chain")
def evaluate(theme: str, screenshot: Path | None, errors: list[str]) -> GameEval:
    err_text = "\n".join(errors) if errors else "(없음)"
    content: list[dict] = []

    if screenshot and screenshot.exists():
        data = base64.standard_b64encode(screenshot.read_bytes()).decode()
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/png", "data": data},
        })
    else:
        content.append({"type": "text", "text": "[스크린샷 없음 — 렌더 실패로 간주]"})

    content.append({"type": "text", "text": (
        f"의도한 테마: {theme}\n\n콘솔/런타임 에러 로그:\n{err_text}\n\n"
        "위 스크린샷과 로그를 근거로 게임을 평가하라."
    )})

    resp = _client.messages.parse(
        model=config.EVAL_MODEL,
        max_tokens=2000,
        system=_SYSTEM,
        messages=[{"role": "user", "content": content}],
        output_format=GameEval,
    )
    return resp.parsed_output
