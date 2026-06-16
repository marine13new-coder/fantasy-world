"""⑤ 배포 — Netlify 로 퍼블리시. 토큰/CLI 없으면 로컬 빌드 경로만 반환."""
import json
import os
import shutil
import subprocess
from pathlib import Path

from pipeline import tracing


@tracing.traceable(name="deploy", run_type="tool")
def deploy(game_dir: Path) -> tuple[bool, str]:
    """(성공여부, URL 또는 로컬경로) 반환. 게임 외 임시파일은 제외하고 배포."""
    # 배포 대상만 추린 dist 폴더 구성 (index.html 만)
    dist = game_dir / "dist"
    dist.mkdir(exist_ok=True)
    shutil.copy(game_dir / "index.html", dist / "index.html")

    token = os.getenv("NETLIFY_AUTH_TOKEN")
    site = os.getenv("NETLIFY_SITE_ID")
    npx = shutil.which("npx") or shutil.which("npx.cmd")

    if not (token and npx):
        return (False, str(dist / "index.html"))

    cmd = [npx, "netlify-cli", "deploy", "--prod", "--dir", str(dist), "--json"]
    if site:
        cmd += ["--site", site]
    env = {**os.environ, "NETLIFY_AUTH_TOKEN": token}
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=180, env=env)
        out = json.loads(r.stdout or "{}")
        url = out.get("deploy_ssl_url") or out.get("url") or out.get("deploy_url")
        if url:
            return (True, url)
        return (False, f"Netlify 응답 파싱 실패: {r.stdout[:200]} {r.stderr[:200]}")
    except (subprocess.TimeoutExpired, json.JSONDecodeError) as e:
        return (False, f"배포 실패: {e}")
