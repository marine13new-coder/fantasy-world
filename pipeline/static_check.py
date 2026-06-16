"""② 정적 검사 — API 호출/렌더 전에 명백한 결함을 싸게 걸러낸다."""
from pipeline import tracing


@tracing.traceable(name="static_check", run_type="tool")
def static_check(html: str) -> tuple[bool, list[str]]:
    issues: list[str] = []
    low = html.lower()

    if len(html) < 400:
        issues.append("HTML 이 너무 짧음 (불완전 생성 의심)")
    if "<!doctype" not in low and "<html" not in low:
        issues.append("<!DOCTYPE/<html> 누락")
    if "<script" not in low:
        issues.append("<script> 없음 — 게임 로직 부재")
    if "<canvas" not in low and "getcontext" not in low:
        issues.append("<canvas> 렌더링 요소 없음")
    if low.count("<script") != low.count("</script>"):
        issues.append("<script> 태그 짝이 안 맞음")
    # 외부 리소스(오프라인 동작 위반) 감지
    if "http://" in low or "https://" in low:
        if "src=" in low or "href=" in low or "import" in low:
            issues.append("외부 리소스(http) 참조 가능성 — 오프라인 동작 위반 소지")

    return (len(issues) == 0, issues)
