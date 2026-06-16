"""재미 평가 도입 전 게임들의 재미 점수를 재생성 없이 일괄 재산정.

각 게임을 실제로 플레이(QA)해 fun_score 를 매기고 manifest 에 기록 → 갤러리 갱신·배포.
실행: python rescore_fun.py            # fun 없는 것만
      python rescore_fun.py --all      # 전부 다시
      python rescore_fun.py --no-deploy
"""
import json
import sys

from build_arcade import SITE, build_gallery, _depth_features, CATALOG
from daily import deploy
from pipeline import notify
from pipeline.openai_engine import design_test, judge_playtest
from pipeline.playtest import run_playtest

_BY_SLUG = {c["slug"]: c for c in CATALOG}


def main(force_all: bool, do_deploy: bool) -> None:
    mp = SITE / "manifest.json"
    manifest = json.loads(mp.read_text(encoding="utf-8"))
    targets = [m for m in manifest if force_all or not m.get("fun")]
    print(f"재산정 대상 {len(targets)}/{len(manifest)}개")
    notify.say("qa", f"재미 평가 전 게임 {len(targets)}개 일괄 재산정 시작합니다. 하나씩 직접 플레이해볼게요…")

    for m in targets:
        slug = m["slug"]
        gdir = SITE / slug
        theme = _BY_SLUG.get(slug, {}).get("theme", m["title"])
        try:
            html = (gdir / "index.html").read_text(encoding="utf-8")
            d = design_test(theme, html)
            pt = run_playtest(gdir, d["steps"], d["mode"])
            v = judge_playtest(theme, d["expected"], d["bug_signals"], d["mode"],
                               pt["before_png"], pt["after_png"],
                               pt["step_series"], pt["time_series"], pt["console_errors"],
                               "", _depth_features(html))
            m["fun"] = v.fun_score
            print(f"  {m['title']:14} 재미 {v.fun_score}/100")
            notify.say("qa", f"*{m['title']}* 재미 재산정 → *{v.fun_score}/100*"
                       + (f"\n> {v.fun_notes[:90]}" if v.fun_notes else ""))
        except Exception as e:
            print(f"  {m['title']} 재산정 실패: {e}")

    mp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    build_gallery([])  # manifest 기준으로 갤러리 index 재생성 (카드에 재미 반영)
    print("\n=== 재산정 결과 ===")
    for m in manifest:
        print(f"  {m['title']:14} 비전 {m['score']:>3}  재미 {m.get('fun','-')}")
    notify.say("pm", "재미 점수 일괄 재산정 완료. 갤러리 갱신해서 배포합니다.")
    if do_deploy:
        deploy()


if __name__ == "__main__":
    main("--all" in sys.argv, "--no-deploy" not in sys.argv)
