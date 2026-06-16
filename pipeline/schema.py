"""평가 결과 스키마 — 엔진(Claude/OpenAI) 공용. 어떤 LLM SDK에도 의존하지 않음."""
from pydantic import BaseModel


class GameEval(BaseModel):
    renders: bool
    playable: bool
    matches_theme: bool
    visual_quality: int
    bug_free: bool
    overall_score: int
    issues: list[str]
    suggestions: list[str]

    def passed(self, threshold: int) -> bool:
        return self.renders and self.playable and self.overall_score >= threshold

    def feedback(self) -> str:
        lines = [f"- (문제) {i}" for i in self.issues]
        lines += [f"- (개선) {s}" for s in self.suggestions]
        return "\n".join(lines) or "구체적 피드백 없음"


class PlayVerdict(BaseModel):
    """실제 조작 기능 테스트 + 재미 평가 판정."""
    passed: bool            # 기능적으로 정상 동작하는가
    severity: str           # none | minor | major | critical
    bugs: list[str]
    notes: str
    fun_score: int          # 재미/몰입 0~100 (직접 플레이해본 QA의 평가)
    fun_notes: str          # 재미 관련 코멘트 (난이도 체감·선택·반복성 등)

    def fun_ok(self, threshold: int) -> bool:
        return self.fun_score >= threshold

    def feedback(self) -> str:
        out = [f"- (기능버그) {b}" for b in self.bugs]
        if self.fun_notes:
            out.append(f"- (재미 개선) {self.fun_notes}")
        return "\n".join(out) or "구체적 피드백 없음"
