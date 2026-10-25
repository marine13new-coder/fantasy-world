"""
AI Game Arcade 갤러리 사이트(site/) 빌더
실행: python generate_site.py
"""
import sys
from pathlib import Path

tools_dir = Path(__file__).resolve().parent / "tools"
if str(tools_dir) not in sys.path:
    sys.path.insert(0, str(tools_dir))

import update_arcade_portal

if __name__ == "__main__":
    print("AI Arcade 14종 통합 포털 사이트 빌드 완료.")
