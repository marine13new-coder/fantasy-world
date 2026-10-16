"""트렌드 기반 게임 3종을 생성·평가 통과시킨 뒤, 갤러리 사이트(site/)로 묶는다.
배포(GitHub Pages)는 site/ 를 git push 해서 진행한다.

실행: python build_arcade.py
"""
import html as html_lib
import json
import shutil
import time
from pathlib import Path

import config
from pipeline import tracing, notify
from pipeline.openai_engine import generate, evaluate, design_test, judge_playtest, plan_game
from pipeline.static_check import static_check
from pipeline.runtime_check import runtime_check
from pipeline.playtest import run_playtest

# 전체 카탈로그 (slug → 정의). 이번 실행에서 만들 것만 GAMES 에 담는다.
CATALOG = [
    {"slug": "daily-word", "title": "WORD RUSH",
     "theme": "제한시간 워드러시 — 주어진 글자(또는 자유 입력)로 유효한 영어 단어를 빠르게 많이 만들어 점수를 쌓는다. "
              "연속 정답 콤보로 점수 배수가 오르고, 정답마다 시간이 약간 추가된다. 긴 단어일수록 고득점. "
              "힌트 토큰/시간추가/점수배수 같은 파워업을 가끔 획득해 사용. 시간이 갈수록 글자 난이도·시간 압박이 점진 상승. "
              "최고점수(localStorage) 저장. 사전 데이터가 없으면 5글자 이상 등 형식만으로 유효성 판단(정답목록으로 막지 말 것)."},
    {"slug": "idle-forge", "title": "IDLE FORGE",
     "theme": "Cookie Clicker 스타일 방치형 증분(idle) 게임. 큰 버튼을 눌러 자원을 모으고, 자동 생산 유닛과 업그레이드를 구매해 초당 생산량을 늘린다. 클릭 시 자원이 실제로 증가해야 한다."},
    {"slug": "neon-dash", "title": "NEON DASH",
     "theme": "Geometry Dash 스타일 한 버튼 리듬 점프 아케이드. 스페이스/클릭으로 점프해 다가오는 장애물을 피하고, 속도감 있는 스크롤과 점수·거리 표시, 충돌 시 재시작."},
    {"slug": "gem-match", "title": "GEM MATCH",
     "theme": "Match-3 보석 매칭 퍼즐. 인접한 두 보석을 클릭/스왑해 3개 이상 일렬을 만들면 사라지고 점수 획득, 위에서 새 보석이 떨어져 채워진다. 제한 수 또는 시간 + 점수 표시."},
    {"slug": "tower-defense", "title": "TOWER LINE",
     "theme": "심플 타워 디펜스. 경로를 따라 적이 몰려오고, 빈 칸을 클릭해 타워를 설치(골드 소모)하면 자동으로 사거리 내 적을 공격한다. 웨이브·체력·골드 표시, 적 처치 시 골드 획득."},
    {"slug": "zombie-survival", "title": "DEAD HOUR",
     "theme": "탑다운 좀비 서바이벌. WASD/방향키로 이동하고 마우스 방향으로 자동 또는 클릭 사격해 몰려오는 좀비를 처치한다. 체력·점수·웨이브 표시, 사망 시 재시작."},
    {"slug": "merge-2048", "title": "MERGE 2048",
     "theme": "2048 슬라이드 머지 퍼즐. 방향키로 타일을 밀어 같은 숫자가 만나면 합쳐지고 새 타일이 생성된다. 점수와 최고점, 2048 도달 승리/이동 불가 시 패배 표시."},
    {"slug": "chrono-blade", "title": "CHRONO BLADE",
     "theme": "타임 슬라이서 캐주얼 아케이드. 터치 시 시간이 슬로우모션으로 흐르고, 손가락으로 궤적을 그린 뒤 손을 떼면 광속으로 적들을 절단하며 질주한다. 콤보, 피버 타임, 퍽 성장 시스템 탑재."},
]
_BY_SLUG = {c["slug"]: c for c in CATALOG}

# 이번에 새로 만들 게임들 (이미 통과·배포된 daily-word/neon-dash 는 매니페스트로 보존)
NEW_SLUGS = ["gem-match", "tower-defense", "zombie-survival", "merge-2048"]
GAMES = [_BY_SLUG[s] for s in NEW_SLUGS]

THRESHOLD = 75       # 비전 평가 최소 점수
FUN_THRESHOLD = 60   # QA 재미/몰입 최소 점수 (미달이면 깊이 보강해 재생성)
MAX_RETRIES = 4      # 게임당 자동 개선(재생성) 최대 횟수
SITE = config.ROOT / "site"


def _depth_features(html: str) -> str:
    """생성된 코드에 어떤 깊이 시스템이 들어있는지 정적 스캔 (재미 평가 보조)."""
    import re
    low = html.lower()
    checks = [
        ("업그레이드/퍽 선택", r"perk|업그레이드|upgrade"),
        ("레벨업", r"levelup|레벨업|level up|onlevel|gainxp|addxp"),
        ("웨이브/스테이지 진행", r"wave|웨이브|stage|스테이지"),
        ("난이도 스케일링", r"difficulty|난이도|\*\s*1\.[0-9]|speed\s*\*=|\+\s*wave|\*\s*wave|\*\s*level"),
        ("콤보/연쇄", r"combo|콤보|streak|연쇄"),
        ("상점/아이템", r"shop|상점|\bitem\b|아이템|inventory"),
        ("최고점수 저장", r"localstorage|highscore|best ?score|최고"),
    ]
    found = [label for label, pat in checks if re.search(pat, low)]
    return ", ".join(found) if found else ""


@tracing.traceable(name="build_one", run_type="chain")
def build_one(g: dict) -> dict:
    gdir = config.GAMES_DIR / g["slug"]
    gdir.mkdir(parents=True, exist_ok=True)
    feedback = prior = None
    best_html = best_eval = None
    best_fun = 0
    best_thumb = gdir / "best.png"

    fully_passed = False
    T = g["title"]
    notify.say("pm", f"새 게임 *{T}* 착수합니다. @기획자 기획안부터 잡아 주세요.\n> 테마: {g['theme'][:90]}")

    # ⓪ 기획 단계 — 기획자가 구체 기획안 작성, 이후 모든 단계가 이걸 기준으로 진행
    try:
        plan = plan_game(g["theme"])
    except Exception:
        plan = {}
    if plan:
        ui = ", ".join(plan.get("ui", [])) if isinstance(plan.get("ui"), list) else plan.get("ui", "")
        scope = ", ".join(plan.get("scope", [])) if isinstance(plan.get("scope"), list) else plan.get("scope", "")
        notify.say("planner", f"*{T}* 기획안 나왔습니다. @개발자 이대로 부탁해요:\n"
                   f"> • 컨셉: {plan.get('concept','')}\n"
                   f"> • 핵심 루프: {plan.get('core_loop','')}\n"
                   f"> • 조작: {plan.get('controls','')}\n"
                   f"> • 목표: {plan.get('objective','')}  / 패배: {plan.get('lose','')}\n"
                   f"> • 🔺난이도 진행: {plan.get('progression','')}\n"
                   f"> • 🎯선택/성장: {plan.get('choices','')}\n"
                   f"> • UI: {ui}\n> • 구현 범위: {scope}")

    for attempt in range(1, MAX_RETRIES + 1):
        print(f"  [{T}] 시도 {attempt}/{MAX_RETRIES} — 생성…", flush=True)
        if attempt == 1:
            notify.say("dev", f"기획안 받았습니다. *{T}* 그대로 구현해 볼게요. (시도 {attempt}/{MAX_RETRIES})")
        else:
            notify.say("dev", f"피드백 반영해서 *{T}* 다시 수정합니다. (시도 {attempt}/{MAX_RETRIES})")
        html_code = generate(g["theme"], feedback, prior, plan)
        (gdir / "index.html").write_text(html_code, encoding="utf-8")

        ok, issues = static_check(html_code)
        if not ok:
            print(f"    정적검사 결함: {issues}")
            notify.say("review", f"@개발자 코드 구조에 문제가 있어요. 다시 봐주세요:\n> {', '.join(issues)}")
            feedback, prior = "\n".join(f"- {i}" for i in issues), html_code
            continue

        shot, errors, _ = runtime_check(gdir)
        ev = evaluate(g["theme"], shot, errors)
        print(f"    ④ 비전평가 {ev.overall_score}/100 (render={ev.renders} play={ev.playable} bugfree={ev.bug_free})")
        notify.say("review", f"*{T}* 화면 리뷰했습니다 → *{ev.overall_score}/100* "
                   f"(렌더 {ev.renders}·플레이 {ev.playable}·버그없음 {ev.bug_free})"
                   + (f"\n> 지적: {', '.join(ev.issues[:2])}" if ev.issues else ""))

        if best_eval is None or ev.overall_score > best_eval.overall_score:
            best_html, best_eval = html_code, ev
            if shot and shot.exists():
                shutil.copy(shot, best_thumb)

        if not ev.passed(THRESHOLD):
            notify.say("review", f"@개발자 {ev.overall_score}점이라 기준({THRESHOLD}) 미달이에요. 위 지적 반영해서 다시 부탁해요.")
            feedback, prior = ev.feedback(), html_code
            continue

        # ⑤ 실제 조작 기능 테스트 (코드/스크린샷이 못 잡는 동작 버그 검출)
        print("    ⑤ 기능 테스트(실제 조작)…", flush=True)
        notify.say("qa", f"화면은 통과됐네요. 제가 *{T}* 직접 플레이해서 동작이랑 재미까지 봐볼게요…")
        plan_summary = (f"난이도 진행: {plan.get('progression','')}\n선택/성장: {plan.get('choices','')}"
                        if plan else "")
        try:
            dtest = design_test(g["theme"], html_code)
            pt = run_playtest(gdir, dtest["steps"], dtest["mode"])
            verdict = judge_playtest(g["theme"], dtest["expected"], dtest["bug_signals"], dtest["mode"],
                                     pt["before_png"], pt["after_png"],
                                     pt["step_series"], pt["time_series"], pt["console_errors"],
                                     plan_summary, _depth_features(html_code))
        except Exception as e:
            print(f"      기능 테스트 실행 오류: {e} — 재시도")
            notify.say("qa", f"@개발자 테스트 실행 중 오류가 나서 확인이 안 돼요. 다시 만들어 주세요: {e}")
            feedback, prior = f"- 기능 테스트 실행 불가: {e}", html_code
            continue

        fun_ok = verdict.fun_ok(FUN_THRESHOLD)
        print(f"      판정 {'통과' if verdict.passed else '실패'} (severity={verdict.severity}) "
              f"재미 {verdict.fun_score}/100" + (f" · {verdict.bugs[:2]}" if verdict.bugs else ""))

        if verdict.passed and fun_ok:
            best_html, best_eval, best_fun = html_code, ev, verdict.fun_score  # 통과본으로 확정
            if pt["after_png"].exists():
                shutil.copy(pt["after_png"], best_thumb)
            fully_passed = True
            notify.say("qa", f"직접 해보니 *{T}* 잘 돌아가고 재미도 *{verdict.fun_score}/100* 👍 "
                       f"@PM 배포해도 됩니다.")
            break

        if not verdict.passed:
            # 기능 버그 → 재생성
            notify.say("qa", f"@개발자 *{T}* 실제로 해보니 버그가 있어요 ({verdict.severity}):\n"
                       f"> {', '.join(verdict.bugs[:2])}\n고쳐서 다시 주세요.")
        else:
            # 동작은 되는데 재미 부족 → 깊이 보강해 재생성
            notify.say("qa", f"@개발자 *{T}* 동작은 되는데 재미가 좀 부족해요 (재미 {verdict.fun_score}/100, 기준 {FUN_THRESHOLD}):\n"
                       f"> {verdict.fun_notes}\n난이도/선택 요소 보강해서 다시 부탁해요.")
        feedback = ev.feedback() + "\n" + verdict.feedback()
        prior = html_code

    if fully_passed:
        notify.say("pm", f"📦 *{T}* 결과 보고 — 기획대로 완성. "
                   f"목표 「{plan.get('objective','-')}」 구현, 비전 {best_eval.overall_score}/100, "
                   f"재미 {best_fun}/100, QA 통과. 배포 진행합니다.")
    else:
        notify.say("pm", f"📦 *{T}* 결과 보고 — {MAX_RETRIES}회 시도에도 QA(기능/재미) 통과 실패로 *이번 배포 제외*. "
                   f"(최고 비전 {best_eval.overall_score}/100)")

    (gdir / "index.html").write_text(best_html, encoding="utf-8")
    return {**g, "score": best_eval.overall_score, "fun": best_fun, "passed": fully_passed,
            "html": best_html, "thumb": best_thumb if best_thumb.exists() else None}


def build_gallery(results: list[dict]) -> None:
    """새로 통과한 게임을 기존 배포 사이트에 병합. manifest.json 으로 목록 유지."""
    SITE.mkdir(exist_ok=True)
    (SITE / ".nojekyll").write_text("", encoding="utf-8")
    manifest_path = SITE / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else []
    by_slug = {m["slug"]: m for m in manifest}

    for r in results:  # 통과한 새 게임만 들어옴
        gdir = SITE / r["slug"]
        gdir.mkdir(exist_ok=True)
        (gdir / "index.html").write_text(r["html"], encoding="utf-8")
        if r["thumb"]:
            shutil.copy(r["thumb"], gdir / "thumb.png")
        by_slug[r["slug"]] = {"slug": r["slug"], "title": r["title"],
                              "score": r["score"], "fun": r.get("fun", 0)}

    manifest = [m for m in by_slug.values() if (SITE / m["slug"] / "index.html").exists()]
    manifest.sort(key=lambda m: m["slug"])

    cards = []
    for m in manifest:
        thumb_tag = ""
        if (SITE / m["slug"] / "thumb.png").exists():
            thumb_tag = f'<img src="{m["slug"]}/thumb.png" alt="{html_lib.escape(m["title"])}">'
        cards.append(f"""
      <a class="card" href="{m['slug']}/index.html">
        <div class="thumb">{thumb_tag}</div>
        <div class="meta">
          <h2>{html_lib.escape(m['title'])}</h2>
          <span class="score">비전 {m['score']} · 재미 {m.get('fun', 0)} · PASS</span>
        </div>
      </a>""")

    page = f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Game Arcade</title>
<style>
  :root{{--bg:#0a0e1a;--card:#131a2e;--line:#26304a;--ink:#eef2fb;--sub:#8a96b3;--accent:#5b8cff}}
  *{{box-sizing:border-box}}
  body{{margin:0;background:var(--bg);color:var(--ink);font-family:Pretendard,system-ui,"Segoe UI",sans-serif;line-height:1.6}}
  .wrap{{max-width:1000px;margin:0 auto;padding:64px 24px}}
  .eyebrow{{color:var(--accent);font-weight:700;letter-spacing:.1em;font-size:.8rem;text-transform:uppercase}}
  h1{{font-size:clamp(2rem,5vw,3rem);margin:.3em 0 .2em;letter-spacing:-.02em}}
  p.lead{{color:var(--sub);margin:0 0 40px}}
  .grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}}
  @media(max-width:760px){{.grid{{grid-template-columns:1fr}}}}
  .card{{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;color:inherit;text-decoration:none;transition:transform .15s,border-color .15s}}
  .card:hover{{transform:translateY(-4px);border-color:var(--accent)}}
  .thumb{{aspect-ratio:16/10;background:#070a14;display:grid;place-items:center;overflow:hidden}}
  .thumb img{{width:100%;height:100%;object-fit:cover}}
  .meta{{padding:16px 18px}}
  .meta h2{{margin:0;font-size:1.15rem}}
  .score{{color:var(--sub);font-size:.85rem}}
  footer{{color:var(--sub);font-size:.82rem;margin-top:48px;border-top:1px solid var(--line);padding-top:20px}}
</style></head>
<body><div class="wrap">
  <div class="eyebrow">AI generated · gpt-5.4-mini</div>
  <h1>AI Game Arcade</h1>
  <p class="lead">AI가 2026 트렌드 장르로 만들고, AI 비전 평가 + 실제 조작 기능 테스트를 통과시킨 브라우저 게임 {len(manifest)}종.</p>
  <div class="grid">{''.join(cards)}</div>
  <footer>생성→자동평가(비전)→실제 조작 기능 테스트→자동배포 파이프라인 데모. 기능 테스트를 통과한 게임만 배포됩니다.</footer>
</div></body></html>"""
    (SITE / "index.html").write_text(page, encoding="utf-8")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


@tracing.traceable(name="arcade_build", run_type="chain")
def main() -> None:
    print(f"엔진: openai (gpt-5.4-mini) | LangSmith: {'ON' if tracing.ENABLED else 'OFF'}")
    results = [build_one(g) for g in GAMES]
    deployable = [r for r in results if r["passed"]]   # 기능 테스트 통과한 것만 배포
    build_gallery(deployable)
    print("\n=== 빌드 요약 ===")
    for r in results:
        tag = "✅ 배포" if r["passed"] else "⛔ 제외(기능 테스트 미통과)"
        print(f"  {r['title']:12} 비전 {r['score']:>3}/100  {tag}")
    print(f"\n배포 대상 {len(deployable)}/{len(results)}개 · 갤러리: {SITE}")


if __name__ == "__main__":
    main()
