import os
from pathlib import Path

launchers_dir = Path("개별게임_실행")
launchers_dir.mkdir(exist_ok=True)

GAMES_LAUNCHERS = [
    ("01_네온서바이벌_실행.bat", "site/neon-survivor/index.html", "⚡ [01] NEON SURVIVOR"),
    ("02_크로노블레이드_실행.bat", "site/chrono-blade/index.html", "⏱️ [02] CHRONO BLADE"),
    ("03_감스트호수공원_실행.bat", "site/gamst-lake-park/index.html", "🚴 [03] 감스트 상동호수공원 질주"),
    ("04_아키텍츠FC_실행.bat", "site/architecture-fc/index.html", "⚽ [04] 아키텍츠 FC"),
    ("05_인형뽑기_실행.bat", "site/claw-machine/index.html", "🕹️ [05] CLAW MASTER 3000"),
    ("06_3D비행기_실행.bat", "site/flight-3d/index.html", "✈️ [06] 스카이 에이스 3D"),
    ("07_판타지월드_실행.bat", "site/fantasy_world/index.html", "🏰 [07] 아테리아 대륙 연대기"),
    ("08_송백리살인사건_실행.bat", "site/songbaek-killings/index.html", "🔍 [08] 송백리 살인사건 1997"),
    ("09_은하아파트13동_실행.bat", "site/apartment-13/index.html", "🔦 [09] 은하아파트 13동"),
    ("10_아카이브1999_실행.bat", "site/archive-1999/index.html", "📼 [10] 아카이브 1999: 잔향의 병동"),
    ("11_택티컬프로토콜FPS_실행.bat", "site/fps-arena/index.html", "🎯 [11] 택티컬 프로토콜 3D (TACTICAL PROTOCOL)"),
    ("12_어비스롤_실행.bat", "site/abyss-roll/index.html", "🎲 [12] 어비스 롤: 피의 카지노"),
    ("13_심리스픽셀RPG_실행.bat", "site/seamless-pixel-rpg/index.html", "⚔️ [13] 심리스 오픈월드 픽셀 RPG"),
    ("14_코지픽셀낚시_실행.bat", "site/cozy-fishing/index.html", "🎣 [14] 코지 픽셀 낚시터")
]

for filename, rel_path, title in GAMES_LAUNCHERS:
    bat_content = f"""@echo off
chcp 65001 > nul
echo ============================================================
echo   {title} 실행
echo ============================================================
start "" "%~dp0..\\{rel_path.replace('/', chr(92))}"
exit
"""
    (launchers_dir / filename).write_text(bat_content, encoding="utf-8")

print(f"Created {len(GAMES_LAUNCHERS)} launcher bat files in 개별게임_실행/")
