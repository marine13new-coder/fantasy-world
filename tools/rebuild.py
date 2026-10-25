"""특정 게임 하나를 (깊이 추가된) 파이프라인으로 재생성·검증·재배포.

실행: python rebuild.py <slug>   예: python rebuild.py zombie-survival
"""
import sys

from build_arcade import build_one, build_gallery, _BY_SLUG
from daily import deploy


def main(slug: str, do_deploy: bool = True) -> None:
    if slug not in _BY_SLUG:
        print("알 수 없는 slug:", slug, "| 가능:", list(_BY_SLUG))
        return
    r = build_one(_BY_SLUG[slug])
    build_gallery([r] if r["passed"] else [])
    if r["passed"]:
        print(f"재빌드 성공: {slug} 비전 {r['score']}/100 — 기능테스트 통과")
        if do_deploy:
            deploy()
    else:
        print(f"재빌드 실패(QA 미통과): {slug} 비전 {r['score']}/100 — 배포 안 함")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python rebuild.py <slug>")
        sys.exit(1)
    main(sys.argv[1], "--no-deploy" not in sys.argv)
