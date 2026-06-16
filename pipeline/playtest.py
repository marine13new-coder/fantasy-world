"""실제 조작 기반 기능 테스트 — CDP 로 게임을 직접 플레이해보고 전/후 상태를 회수한다.

스텝 스키마(엔진이 게임별로 설계):
  {"action":"type","text":"crane"} | {"action":"press","key":"Enter"|"ArrowLeft"|...}
  {"action":"click","x":0.5,"y":0.6} | {"action":"wait","ms":800}
"""
from pathlib import Path

from pipeline import tracing
from pipeline.cdp import CDP


@tracing.traceable(name="playtest", run_type="tool")
def run_playtest(game_dir: Path, steps: list[dict], mode: str = "realtime") -> dict:
    url = (game_dir / "index.html").resolve().as_uri()
    before = game_dir / "pt_before.png"
    after = game_dir / "pt_after.png"
    drv = CDP()

    def short(t: str) -> str:
        return " ".join(t.split())[:220]

    try:
        drv.navigate(url, settle_ms=1800)
        drv.screenshot(before)
        before_text = drv.inner_text()

        # 조작-단위 스냅샷: 각 입력 직후 상태를 기록 (턴제 게임의 "입력→변화" 검증용)
        step_series: list[str] = [f"START -> {short(before_text)}"]
        for s in steps[:40]:
            a = s.get("action")
            if a == "type" and s.get("text"):
                drv.type_text(str(s["text"]))
                label = f"type {s['text']!r}"
            elif a in ("press", "key") and s.get("key"):
                drv.press(str(s["key"]))
                label = f"press {s['key']}"
            elif a == "click":
                drv.click(float(s.get("x", 0.5)), float(s.get("y", 0.5)))
                label = f"click {s.get('x',0.5):.2f},{s.get('y',0.5):.2f}"
            elif a == "move":
                drv.move(float(s.get("x", 0.5)), float(s.get("y", 0.5)))
                label = f"move {s.get('x',0.5):.2f},{s.get('y',0.5):.2f}"
            elif a == "wait":
                drv.drain(int(s.get("ms", 500)))
                continue
            else:
                continue
            step_series.append(f"{label} -> {short(drv.inner_text())}")

        # 진행 샘플링.
        # 실시간: 가만 두면 서서 죽거나 진행이 안 드러나므로, 계속 '능동적으로 플레이'(이동·조준·사격)
        #         하면서 길게(≈5라운드) 관찰 → 레벨업/퍽/웨이브 같은 깊이가 실제로 드러나게.
        # 턴제: 유휴 1회만(턴제는 입력 시에만 변함, 위 step_series 로 이미 확인).
        time_series: list[str] = []
        if mode == "realtime":
            moves = ["w", "d", "s", "a", "ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown"]
            aim = [(0.72, 0.30), (0.28, 0.32), (0.50, 0.72), (0.82, 0.60), (0.20, 0.50), (0.50, 0.20)]
            n = 0
            for r in range(5):
                for k in range(8):  # 한 라운드 ≈ 능동 플레이 버스트
                    drv.press(moves[n % len(moves)])
                    drv.move(*aim[n % len(aim)])
                    n += 1
                drv.click(0.5, 0.5)   # 사격/행동
                drv.press("Space")    # 점프/액션
                drv.drain(500)
                time_series.append(short(drv.inner_text()))
        else:
            drv.drain(2500)
            time_series.append(short(drv.inner_text()))

        drv.screenshot(after)
        after_text = drv.inner_text()
        errors = list(drv.errors)
    finally:
        drv.close()

    return {
        "before_png": before, "after_png": after,
        "before_text": before_text[:1500], "after_text": after_text[:1500],
        "step_series": step_series[:14], "time_series": time_series,
        "console_errors": errors,
    }
