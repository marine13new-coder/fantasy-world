# -*- coding: utf-8 -*-
import os
import shutil
from pathlib import Path

root = Path(__file__).resolve().parent.parent.parent
blood_souls_web = root / "BloodSouls" / "Web"
site_souls = root / "site" / "souls-borne"
games_file = root / "games" / "souls-borne.html"

# 1. Sync HTML and Thumb to site/souls-borne
site_souls.mkdir(parents=True, exist_ok=True)
shutil.copy2(blood_souls_web / "index.html", site_souls / "index.html")
shutil.copy2(blood_souls_web / "thumb.png", site_souls / "thumb.png")

# 2. Sync Models folder
site_models = site_souls / "models"
site_models.mkdir(parents=True, exist_ok=True)
for f in (blood_souls_web / "models").glob("*.glb"):
    shutil.copy2(f, site_models / f.name)

# 3. Sync to games/souls-borne.html
games_file.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(blood_souls_web / "index.html", games_file)

# games/models
games_models = root / "games" / "models"
games_models.mkdir(parents=True, exist_ok=True)
for f in (blood_souls_web / "models").glob("*.glb"):
    shutil.copy2(f, games_models / f.name)

print("✔ Successfully synchronized BloodSouls/Web to site/souls-borne and games/!")
