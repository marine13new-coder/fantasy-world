"""중앙 설정 — 모델, 임계값, 경로."""
import os
import shutil
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv 없으면 os.environ 만 사용

# ---- 모델 ----
# Claude 엔진
GEN_MODEL = "claude-opus-4-8"      # 게임 생성 — 가장 강력한 모델
EVAL_MODEL = "claude-sonnet-4-6"   # 평가 — 비전 + 빠름/저렴
# OpenAI 엔진 (--engine openai)
OPENAI_GEN_MODEL = "gpt-5.4-mini"
OPENAI_EVAL_MODEL = "gpt-5.4-mini"

# ---- 파이프라인 ----
PASS_THRESHOLD = 75   # 0~100, 이 점수 이상이면 배포
MAX_RETRIES = 4       # 통과할 때까지 최대 재생성 횟수
GEN_MAX_TOKENS = 64000
RUNTIME_BUDGET_MS = 4000  # 헤드리스 렌더 시 게임을 굴려볼 시간

# ---- 경로 ----
ROOT = Path(__file__).parent
GAMES_DIR = ROOT / "games"
PROMPTS_DIR = ROOT / "prompts"
GAMES_DIR.mkdir(exist_ok=True)


def find_chrome() -> str | None:
    """Chrome/Chromium 실행 파일 경로 탐지."""
    if os.getenv("CHROME_PATH"):
        return os.getenv("CHROME_PATH")
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "google-chrome", "chromium", "chromium-browser", "chrome",
    ]
    for c in candidates:
        if os.path.sep in c or (":" in c):
            if Path(c).exists():
                return c
        else:
            found = shutil.which(c)
            if found:
                return found
    return None


CHROME = find_chrome()
