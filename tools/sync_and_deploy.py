"""
모든 게임 작업 폴더의 최신 결과물을 site/ 에 동기화하고 GitHub Pages로 배포하는 스크립트
실행: python tools/sync_and_deploy.py
"""
import shutil
import subprocess
from pathlib import Path
import sys

root = Path(__file__).resolve().parent.parent
site = root / "site"

# 1. Sync Game 11 (CHRONO-PULSE FPS)
fps_src = root / "games" / "fps_arena.html"
fps_dst = site / "fps-arena" / "index.html"
if fps_src.exists():
    shutil.copy2(fps_src, fps_dst)
    print("✔ Synced #11 FPS Arena")

# 2. Sync Game 13 (Seamless Pixel RPG)
rpg_src = root / "SeamlessPixelRPG" / "pixel_rpg_playable_test.html"
rpg_dst = site / "seamless-pixel-rpg" / "index.html"
if rpg_src.exists():
    shutil.copy2(rpg_src, rpg_dst)
    print("✔ Synced #13 Seamless Pixel RPG")

# 3. Sync Game 03 (Gamst Lake Park)
gamst_src = root / "games" / "gamst-lake-park" / "game.html"
gamst_dst = site / "gamst-lake-park" / "index.html"
if gamst_src.exists():
    shutil.copy2(gamst_src, gamst_dst)
    print("✔ Synced #03 Gamst Lake Park")

# 4. Update Portal HTML
sys.path.insert(0, str(root / "tools"))
import update_arcade_portal
print("✔ Rebuilt site/index.html & manifest.json")

# 5. Git Commit & Push
try:
    subprocess.run(["git", "add", "site/", "SeamlessPixelRPG/pixel_rpg_playable_test.html"], check=True, cwd=root)
    res = subprocess.run(["git", "commit", "-m", "fix(rpg): fix runtime error in 13 and sync all games to GitHub Pages"], capture_output=True, text=True, cwd=root)
    print(res.stdout or res.stderr)
    subprocess.run(["git", "push", "origin", "main"], check=True, cwd=root)
    print("🚀 Successfully pushed to GitHub Pages! Deployment in progress.")
except Exception as e:
    print(f"Git push error: {e}")
