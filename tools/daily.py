"""하루치 게임 — '통과작 N개를 배포할 때까지' 자동으로 만들고 개선·교체한다.

각 게임: 기획 → 생성 → 정적검사 → 헤드리스 실행 → 비전평가 → 실제 조작 기능+재미 테스트.
한 게임이 게임당 재시도(MAX_RETRIES) 안에 통과 못 하면 버리고 다른 게임으로 교체해
목표 N개의 통과작을 채운다(안전 상한까지). 통과작만 갤러리에 병합·배포(git push).

실행:
    python daily.py            # 통과작 3개 목표
    python daily.py 5
    python daily.py 3 --no-deploy
"""
import json
import subprocess
import sys

from build_arcade import build_one, build_gallery, SITE, CATALOG
from pipeline import tracing, notify
from pipeline.openai_engine import invent_games

MAX_ATTEMPTS_PER_TARGET = 4  # 목표 1개당 시도할 게임 수 상한 (폭주 방지)


def _used_from_manifest() -> tuple[set, set]:
    mp = SITE / "manifest.json"
    if not mp.exists():
        return set(), set()
    m = json.loads(mp.read_text(encoding="utf-8"))
    return {g["slug"] for g in m}, {g["title"] for g in m}


def _next_candidate(used_slugs: set, used_titles: set) -> dict | None:
    """다음에 시도할 게임 — 카탈로그 미사용분 우선, 없으면 트렌드 기반 신규 발굴."""
    for c in CATALOG:
        if c["slug"] not in used_slugs and c["title"] not in used_titles:
            return c
    for _ in range(3):  # 신규 발굴(중복 회피) 재시도
        for g in invent_games(2, list(used_titles)):
            if g["slug"] not in used_slugs and g["title"] not in used_titles:
                return g
    return None


def deploy() -> None:
    git = ["git", "-C", str(SITE), "-c", "user.email=bat981120@gmail.com", "-c", "user.name=bat1120"]
    subprocess.run(["git", "-C", str(SITE), "add", "-A"], check=True)
    r = subprocess.run(git + ["commit", "-q", "-m",
                              "feat(daily): 신규 게임 배포 (생성→평가→기능/재미 테스트 통과분)\n\n"
                              "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"])
    if r.returncode != 0:
        print("커밋할 변경 없음")
        return
    subprocess.run(["git", "-C", str(SITE), "push", "-q", "origin", "main"], check=True)
    print("푸시 완료 → GitHub Actions/Pages 자동 배포")


@tracing.traceable(name="daily_build", run_type="chain")
def main(n: int, do_deploy: bool) -> None:
    print(f"오늘의 목표: 통과작 {n}개 · 엔진 gpt-5.4-mini · LangSmith {'ON' if tracing.ENABLED else 'OFF'}")
    notify.say("pm", f"오늘 스탠드업 ☕ 목표는 *QA(기능+재미) 통과작 {n}개 배포*입니다. 될 때까지 만들고 고쳐봅니다.")

    used_slugs, used_titles = _used_from_manifest()
    delivered: list[dict] = []
    attempts = 0
    cap = n * MAX_ATTEMPTS_PER_TARGET

    while len(delivered) < n and attempts < cap:
        g = _next_candidate(used_slugs, used_titles)
        if g is None:
            notify.say("pm", "더 만들 후보를 못 찾아 여기서 마칩니다.")
            break
        used_slugs.add(g["slug"])
        used_titles.add(g["title"])
        attempts += 1
        try:
            r = build_one(g)
        except Exception as e:
            msg = str(e)
            if "insufficient_quota" in msg or "RateLimitError" in type(e).__name__ or "429" in msg:
                print("API 쿼터/한도 도달 — 중단:", msg[:120])
                notify.say("pm", "⚠️ OpenAI 쿼터/요금 한도에 도달해 오늘은 여기서 중단합니다. "
                           "지금까지 통과작까지만 배포할게요. (결제/크레딧 충전 필요)")
                break
            print(f"  {g['title']} 빌드 오류 — 건너뜀: {msg[:120]}")
            notify.say("pm", f"*{g['title']}* 빌드 중 오류로 건너뜁니다: {msg[:100]}")
            continue
        if r["passed"]:
            delivered.append(r)
            build_gallery(delivered)  # 통과할 때마다 병합(진행 보존)
            notify.say("pm", f"진행 상황: 통과작 {len(delivered)}/{n} (시도 {attempts}회째)")

    print("\n=== 최종 ===")
    print(f"  통과·배포 {len(delivered)}/{n} (총 {attempts}게임 시도)")
    for r in delivered:
        print(f"  ✅ {r['title']} 비전 {r['score']} 재미 {r.get('fun',0)}")

    if delivered:
        summary = "\n".join(f"  ✅ {r['title']} (비전 {r['score']}, 재미 {r.get('fun',0)})" for r in delivered)
        notify.say("pm", f"오늘 결과: 통과작 *{len(delivered)}/{n}* (총 {attempts}게임 시도)\n{summary}")
        if do_deploy:
            deploy()
            notify.say("release", f"통과작 {len(delivered)}개 배포 완료 🚀\nhttps://bat1120.github.io/ai-game-arcade/")
    else:
        notify.say("release", f"{attempts}게임을 시도했지만 통과작이 없네요. 내일 다시 가시죠.")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--no-deploy"]
    n = int(args[0]) if args else 3
    main(n, "--no-deploy" not in sys.argv)
