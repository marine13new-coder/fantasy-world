"""AI 게임 생성 → AI 평가 → 자동배포 파이프라인.

사용:
    python main.py "우주 슈팅 게임"
    python main.py "벽돌깨기" --threshold 80 --max-retries 5 --no-deploy
"""
import argparse
import re
import sys
import time
from pathlib import Path

import config
from pipeline import tracing  # import 시 LangSmith 환경 셋업 실행
from pipeline.static_check import static_check
from pipeline.runtime_check import runtime_check
from pipeline.deploy import deploy


def _slug(theme: str) -> str:
    s = re.sub(r"[^\w가-힣]+", "-", theme).strip("-").lower()
    return (s or "game")[:40]


def _load_engine(engine: str):
    """엔진별 (generate, evaluate) 함수 반환."""
    if engine == "openai":
        from pipeline.openai_engine import generate, evaluate
    else:
        from pipeline.generate import generate
        from pipeline.evaluate import evaluate
    return generate, evaluate


@tracing.traceable(name="game_pipeline", run_type="chain")
def run(theme: str, threshold: int, max_retries: int, do_deploy: bool, engine: str) -> int:
    generate, evaluate = _load_engine(engine)
    print(f"엔진: {engine}")
    if tracing.ENABLED:
        print(f"LangSmith 추적 ON → 프로젝트 '{tracing.PROJECT}' (smith.langchain.com)")
    else:
        print("LangSmith 추적 OFF (LANGSMITH_API_KEY/langsmith 미설정)")
    slug = f"{_slug(theme)}-{int(time.time())}"
    game_dir = config.GAMES_DIR / slug
    game_dir.mkdir(parents=True, exist_ok=True)
    print(f"▶ 테마: {theme!r}  →  작업 폴더: {game_dir}")

    feedback: str | None = None
    prior_html: str | None = None

    for attempt in range(1, max_retries + 1):
        print(f"\n=== 시도 {attempt}/{max_retries} ===")

        print("① 생성 중…")
        try:
            html = generate(theme, feedback, prior_html)
        except Exception as e:
            print(f"  생성 실패: {e}")
            return 1
        (game_dir / "index.html").write_text(html, encoding="utf-8")
        print(f"  HTML {len(html):,} bytes 저장")

        print("② 정적 검사…")
        ok, issues = static_check(html)
        if not ok:
            print(f"  결함: {issues}")
            feedback, prior_html = "\n".join(f"- {i}" for i in issues), html
            continue
        print("  통과")

        print("③ 런타임 실행(헤드리스 Chrome)…")
        shot, errors, ran = runtime_check(game_dir)
        print(f"  렌더 {'성공' if ran else '실패'}, 에러 {len(errors)}건")

        print("④ AI 평가…")
        ev = evaluate(theme, shot, errors)
        print(f"  점수 {ev.overall_score}/100  "
              f"(render={ev.renders} play={ev.playable} theme={ev.matches_theme} bugfree={ev.bug_free})")
        if ev.issues:
            print("  문제:", "; ".join(ev.issues[:3]))

        if ev.passed(threshold):
            print(f"\n✅ 임계값({threshold}) 통과!")
            if not do_deploy:
                print(f"배포 생략. 결과물: {game_dir / 'index.html'}")
                return 0
            print("⑤ 배포…")
            success, where = deploy(game_dir)
            if success:
                print(f"\n🚀 배포 완료: {where}")
            else:
                print(f"\n📦 로컬 빌드 완료 (자동배포 미설정/실패): {where}")
            return 0

        print("  ✗ 미달 — 피드백 반영해 재생성")
        feedback, prior_html = ev.feedback(), html

    print(f"\n❌ {max_retries}회 시도했으나 임계값({threshold}) 미달. 마지막 결과: {game_dir / 'index.html'}")
    return 2


def main() -> int:
    p = argparse.ArgumentParser(description="AI 게임 생성→평가→자동배포")
    p.add_argument("theme", help="게임 테마/프롬프트 (예: '우주 슈팅 게임')")
    p.add_argument("--threshold", type=int, default=config.PASS_THRESHOLD, help="배포 통과 점수 (기본 75)")
    p.add_argument("--max-retries", type=int, default=config.MAX_RETRIES, help="최대 재생성 횟수 (기본 4)")
    p.add_argument("--no-deploy", action="store_true", help="배포 생략, 생성·평가만")
    p.add_argument("--engine", choices=["claude", "openai"], default="claude", help="LLM 엔진 (기본 claude)")
    args = p.parse_args()
    return run(args.theme, args.threshold, args.max_retries, not args.no_deploy, args.engine)


if __name__ == "__main__":
    sys.exit(main())
