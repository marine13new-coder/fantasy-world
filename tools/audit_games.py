"""배포된 게임들을 강화된 기능 테스트(시간경과 상태 샘플링 포함)로 전수 재검사.
재생성하지 않고 site/<slug>/index.html 을 그대로 실제 조작·관찰만 한다.

실행: python audit_games.py
"""
import json
from pathlib import Path

import config
from pipeline.openai_engine import design_test, judge_playtest
from pipeline.playtest import run_playtest

SITE = config.ROOT / "site"
CATALOG = {c["slug"]: c for c in __import__("build_arcade").CATALOG}


def audit() -> None:
    manifest = json.loads((SITE / "manifest.json").read_text(encoding="utf-8"))
    print(f"감사 대상 {len(manifest)}개\n")
    results = []
    for m in manifest:
        slug = m["slug"]
        gdir = SITE / slug
        theme = CATALOG.get(slug, {}).get("theme", m["title"])
        html = (gdir / "index.html").read_text(encoding="utf-8")
        print(f"[{m['title']}] 검사 중…", flush=True)
        try:
            plan = design_test(theme, html)
            pt = run_playtest(gdir, plan["steps"], plan["mode"])
            v = judge_playtest(theme, plan["expected"], plan["bug_signals"], plan["mode"],
                               pt["before_png"], pt["after_png"],
                               pt["step_series"], pt["time_series"], pt["console_errors"])
            results.append((m["title"], v))
            mark = "✅ 정상" if v.passed else f"❌ 버그({v.severity})"
            print(f"  {mark}" + (f" · {v.bugs[:2]}" if v.bugs else ""))
        except Exception as e:
            print(f"  ⚠️ 검사 실패: {e}")
            results.append((m["title"], None))
        print()

    print("=== 감사 요약 ===")
    for title, v in results:
        if v is None:
            print(f"  {title:12} ⚠️ 검사오류")
        else:
            print(f"  {title:12} {'✅ 정상' if v.passed else '❌ ' + v.severity}")


if __name__ == "__main__":
    audit()
