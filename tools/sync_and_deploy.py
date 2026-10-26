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

# 4. Sync Game 14 (Cozy Pixel Fishing full web build)
fishing_build_script = root / "tools" / "build_cozy_fishing_full_web.py"
if fishing_build_script.exists():
    subprocess.run([sys.executable, str(fishing_build_script)], check=True, cwd=root)
    print("✔ Synced #14 Cozy Pixel Fishing (Full Web Build with 7 systems & 73 textures)")

# 5. Sync Game 15 (Zombie Hardcore : Dead Zone)
zombie_src = root / "games" / "zombie-hardcore.html"
zombie_dst_dir = site / "zombie-hardcore"
zombie_dst_dir.mkdir(parents=True, exist_ok=True)
zombie_dst = zombie_dst_dir / "index.html"
if zombie_src.exists():
    shutil.copy2(zombie_src, zombie_dst)
    print("✔ Synced #15 Zombie Hardcore : Dead Zone")

# 6. Sync Game 16 (Blood Souls : Ashen Hunter from BloodSouls/ dedicated folder)
blood_souls_sync = root / "BloodSouls" / "Tools" / "sync_blood_souls.py"
if blood_souls_sync.exists():
    subprocess.run([sys.executable, str(blood_souls_sync)], check=True, cwd=root)
    print("✔ Synced #16 Blood Souls : Ashen Hunter (Web, 3D Models, and Portal)")

# 7. Sync Game 17 (FM Dream Club : Tactical Manager)
fm_src_dir = root / "games" / "fm-dream-team"
fm_dst_dir = site / "fm-dream-team"
if fm_src_dir.exists():
    fm_dst_dir.mkdir(parents=True, exist_ok=True)
    for f in fm_src_dir.glob("*"):
        if f.is_file():
            shutil.copy2(f, fm_dst_dir / f.name)
    print("✔ Synced #17 FM Dream Club : Tactical Manager")

# 8. Sync Game 18 (F1 Apex Motorsport Manager & 3D Grand Prix)
f1_src_dir = root / "games" / "f1-apex-manager"
f1_dst_dir = site / "f1-apex-manager"
if f1_src_dir.exists():
    f1_dst_dir.mkdir(parents=True, exist_ok=True)
    for f in f1_src_dir.glob("*"):
        if f.is_file():
            shutil.copy2(f, f1_dst_dir / f.name)
    print("✔ Synced #18 F1 Apex Motorsport Manager & 3D Grand Prix")

# 9. Update Portal HTML
sys.path.insert(0, str(root / "tools"))
import update_arcade_portal
print("✔ Rebuilt site/index.html & manifest.json")

# 10. Git Commit & Push
try:
    subprocess.run(["git", "add", "site/", "BloodSouls/", "SeamlessPixelRPG/pixel_rpg_playable_test.html", "tools/"], check=True, cwd=root)
    res = subprocess.run(["git", "commit", "-m", "sync: auto-sync all 18 games including #18 F1 Apex Manager to GitHub Pages"], capture_output=True, text=True, cwd=root)
    print(res.stdout or res.stderr)
    subprocess.run(["git", "push", "origin", "main"], check=True, cwd=root)
    print("🚀 Successfully pushed to GitHub Pages! Deployment in progress.")
except Exception as e:
    print(f"Git push error: {e}")
