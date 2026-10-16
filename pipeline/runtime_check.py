"""③ 런타임 검사 — 헤드리스 Chrome 로 실제 실행: 스크린샷 + 콘솔/런타임 에러 수집.

추가 의존성 없이 Chrome CLI 만 사용한다. 게임 HTML 에 에러 수집 스크립트를 주입한
사본을 만들어 실행하고, 일정 시간 게임을 굴린 뒤 화면과 누적 에러를 회수한다.
"""
import html as html_lib
import json
import re
import subprocess
from pathlib import Path

import config
from pipeline import tracing

# 페이지의 런타임 에러를 모아 숨은 div(#__errout)에 적어두는 주입 스크립트
_CATCHER = """<script>
window.__errs=[];
addEventListener('error',function(e){window.__errs.push((e.message||String(e.error)||'error')+' @'+(e.filename||'')+':'+(e.lineno||0));});
addEventListener('unhandledrejection',function(e){window.__errs.push('promise: '+((e.reason&&e.reason.message)||String(e.reason)));});
addEventListener('load',function(){setTimeout(function(){var d=document.createElement('div');d.id='__errout';d.style.display='none';d.textContent=JSON.stringify(window.__errs);(document.body||document.documentElement).appendChild(d);},1500);});
</script>
"""


def _instrument(html: str) -> str:
    """에러 수집 스크립트를 <head> 직후(없으면 맨 앞)에 삽입."""
    m = re.search(r"<head[^>]*>", html, re.IGNORECASE)
    if m:
        return html[: m.end()] + _CATCHER + html[m.end():]
    return _CATCHER + html


def _run_chrome(extra: list[str], file_url: str) -> subprocess.CompletedProcess:
    cmd = [
        config.CHROME, "--headless", "--disable-gpu", "--no-sandbox",
        "--hide-scrollbars", f"--virtual-time-budget={config.RUNTIME_BUDGET_MS}",
        *extra, file_url,
    ]
    return subprocess.run(cmd, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=60)


@tracing.traceable(name="runtime_check", run_type="tool")
def runtime_check(game_dir: Path) -> tuple[Path | None, list[str], bool]:
    """game_dir/index.html 을 실행. (스크린샷경로, 에러목록, ok) 반환."""
    if not config.CHROME:
        return (None, ["Chrome 실행 파일을 찾지 못함 (CHROME_PATH 설정 필요)"], False)

    src = (game_dir / "index.html").read_text(encoding="utf-8")
    inst = game_dir / "_instrumented.html"
    inst.write_text(_instrument(src), encoding="utf-8")
    file_url = inst.resolve().as_uri()
    shot = (game_dir / "screenshot.png").resolve()

    errors: list[str] = []
    try:
        _run_chrome([f"--screenshot={shot}", "--window-size=1280,800"], file_url)
        dom = _run_chrome(["--dump-dom"], file_url)
        mm = re.search(r'<div id="__errout"[^>]*>(.*?)</div>', dom.stdout or "", re.DOTALL)
        if mm:
            raw = html_lib.unescape(mm.group(1))
            try:
                errors = [e for e in json.loads(raw) if e]
            except json.JSONDecodeError:
                pass
    except subprocess.TimeoutExpired:
        return (None, ["Chrome 렌더 타임아웃"], False)

    ok = shot.exists() and shot.stat().st_size > 0
    if not ok:
        errors.append("스크린샷 생성 실패 (렌더 불가 의심)")
    return (shot if shot.exists() else None, errors, ok)
