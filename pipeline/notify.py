"""Slack 알림 — 파이프라인 에이전트들을 '회사 팀'처럼 각자 화자로 채널에 대화시킨다.

각 에이전트는 고유 이름/아이콘으로 발화하고 서로에게 말을 건다(@개발자 ...).
Slack Incoming Webhook URL 필요(SLACK_WEBHOOK_URL, 없으면 test-project/.env). 없으면 no-op.
알림 실패는 빌드를 막지 않는다.
"""
import json
import os
import urllib.request
from pathlib import Path


def _webhook() -> str | None:
    if os.getenv("SLACK_WEBHOOK_URL"):
        return os.getenv("SLACK_WEBHOOK_URL")
    src = Path(os.getenv("SLACK_ENV_FILE", str(Path(__file__).parent.parent / ".env")))
    if src.exists():
        try:
            from dotenv import dotenv_values
            return dotenv_values(src).get("SLACK_WEBHOOK_URL")
        except ImportError:
            pass
    return None


WEBHOOK = _webhook()
ENABLED = bool(WEBHOOK)

# 팀 구성 — 각 에이전트의 표시이름/아이콘 (회사처럼)
ROLES = {
    "pm":      ("PM 오케스트레이터", ":clipboard:"),
    "planner": ("기획자 Planner",    ":memo:"),
    "dev":     ("개발자 Dev",        ":hammer_and_wrench:"),
    "review":  ("평가자 Reviewer",   ":eyes:"),
    "qa":      ("QA 테스터",         ":video_game:"),
    "release": ("릴리스 Release",    ":rocket:"),
}


def _send(payload: dict) -> None:
    if not WEBHOOK:
        return
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            WEBHOOK, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def say(role: str, text: str) -> None:
    """특정 에이전트(role)가 발화. 표시이름/아이콘 + 텍스트 화자 표기(웹훅이 이름override 무시해도 구분되게)."""
    name, icon = ROLES.get(role, ("시스템", ":robot_face:"))
    _send({"text": f"*{name}*: {text}", "username": name, "icon_emoji": icon})


def post(text: str) -> None:
    """일반 시스템 메시지(화자 없음)."""
    _send({"text": text})
