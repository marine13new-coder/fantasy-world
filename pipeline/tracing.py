"""LangSmith 추적 셋업 — 파이프라인 전체를 트레이스 트리로 기록.

LANGSMITH_API_KEY 등이 환경에 없으면 사용자의 다른 프로젝트(.env)에서 읽어온다
(값은 출력하지 않음). langsmith 미설치 시 모든 데코레이터는 무동작(no-op)으로 떨어진다.
"""
import os
from pathlib import Path


def setup() -> None:
    if not os.getenv("LANGSMITH_API_KEY"):
        src = Path(os.getenv("OPENAI_ENV_FILE", r"C:\Users\bat98\ai-news-summarizer\.env"))
        if src.exists():
            try:
                from dotenv import dotenv_values
                vals = dotenv_values(src)
                for k in ("LANGSMITH_API_KEY", "LANGSMITH_ENDPOINT", "LANGSMITH_TRACING"):
                    v = vals.get(k)
                    if v and not os.getenv(k):
                        os.environ[k] = v
            except ImportError:
                pass
    os.environ.setdefault("LANGSMITH_TRACING", "true")
    os.environ.setdefault("LANGSMITH_PROJECT", "ai-game-pipeline")


setup()

try:
    from langsmith import traceable
    from langsmith.wrappers import wrap_openai
    ENABLED = bool(os.getenv("LANGSMITH_API_KEY")) and \
        os.getenv("LANGSMITH_TRACING", "").lower() == "true"
except ImportError:
    ENABLED = False

    def traceable(*args, **kwargs):  # type: ignore
        """langsmith 없을 때: @traceable / @traceable(...) 둘 다 무동작 처리."""
        if len(args) == 1 and callable(args[0]) and not kwargs:
            return args[0]

        def deco(fn):
            return fn
        return deco

    def wrap_openai(client):  # type: ignore
        return client


PROJECT = os.getenv("LANGSMITH_PROJECT", "ai-game-pipeline")
