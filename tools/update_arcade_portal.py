import json
import html as html_lib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

site_dir = Path("site")
site_dir.mkdir(exist_ok=True)

# 14 Games Definition
GAMES = [
    {
        "session": "01",
        "slug": "neon-survivor",
        "title": "NEON SURVIVOR",
        "sub_title": "Top-Down Cyber Survivor",
        "category": "action",
        "category_name": "아케이드/액션",
        "genre": "탑다운 뱀서라이크",
        "platform": "Web HTML5",
        "tech": "Canvas 2D · WebAudio",
        "score": 98,
        "fun": 94,
        "desc": "네온 사이버틱 전장에서 몰려오는 사이버 바이러스를 레이저와 광역 스킬로 섬멸하는 탑다운 서바이벌.",
        "icon": "⚡",
        "theme_color": "#00f0ff"
    },
    {
        "session": "02",
        "slug": "chrono-blade",
        "title": "CHRONO BLADE",
        "sub_title": "Time Slicer Casual Arcade",
        "category": "action",
        "category_name": "아케이드/액션",
        "genre": "타임 슬라이서",
        "platform": "Web HTML5",
        "tech": "Canvas 2D · Procedural Slice",
        "score": 98,
        "fun": 95,
        "desc": "터치/드래그 시 시간이 슬로우모션으로 흐르며 광속의 궤적으로 적들을 절단하는 타임 슬라이서 액션.",
        "icon": "⏱️",
        "theme_color": "#ff007f"
    },
    {
        "session": "03",
        "slug": "gamst-lake-park",
        "title": "감스트 상동호수공원 질주",
        "sub_title": "Gamst Lake Park Run HD",
        "category": "action",
        "category_name": "아케이드/액션",
        "genre": "탑다운 질주 러너",
        "platform": "Web HTML5",
        "tech": "Canvas 2D · Sprite Animation",
        "score": 96,
        "fun": 96,
        "desc": "자전거를 탄 감스트가 상동호수공원의 장애물과 비둘기를 피하며 특유의 찰진 보이스로 질주하는 러너 게임.",
        "icon": "🚴",
        "theme_color": "#ff7700"
    },
    {
        "session": "04",
        "slug": "architecture-fc",
        "title": "아키텍츠 FC",
        "sub_title": "Architects Football Club Online",
        "category": "strategy",
        "category_name": "전략/시뮬레이션",
        "genre": "피파풍 축구 스쿼드 매니저",
        "platform": "Web HTML5",
        "tech": "2D Tactical Pitch AI · Audio API",
        "score": 99,
        "fun": 97,
        "desc": "르 코르뷔지에, 자하 하디드 등 전설적 건축가들이 감독이 되어 랜드마크 건물을 선수로 스쿼드를 짜 대결하는 축구 시뮬레이션.",
        "icon": "⚽",
        "theme_color": "#1e5fad"
    },
    {
        "session": "05",
        "slug": "claw-machine",
        "title": "CLAW MASTER 3000",
        "sub_title": "3D Physical Crane Arcade",
        "category": "action",
        "category_name": "아케이드/액션",
        "genre": "3D 물리 인형뽑기",
        "platform": "Web HTML5",
        "tech": "Three.js · Cannon Physics",
        "score": 96,
        "fun": 92,
        "desc": "실제 오락실 감성의 집게 장력과 흔들림, 물리 충돌을 정밀하게 구현한 풀 3D 크레인 인형뽑기 게임.",
        "icon": "🕹️",
        "theme_color": "#eab308"
    },
    {
        "session": "06",
        "slug": "flight-3d",
        "title": "스카이 에이스 3D",
        "sub_title": "Sky Ace 3D Flight Simulator",
        "category": "action",
        "category_name": "아케이드/액션",
        "genre": "3D 공중전 시뮬레이션",
        "platform": "Web HTML5",
        "tech": "Three.js · 6-DOF Flight Math",
        "score": 98,
        "fun": 95,
        "desc": "푸른 창공을 비행하며 적기를 록온 미사일과 발칸포로 격추하는 박진감 넘치는 3D 비행 도그파이트 시뮬레이터.",
        "icon": "✈️",
        "theme_color": "#38bdf8"
    },
    {
        "session": "07",
        "slug": "fantasy_world",
        "title": "아테리아 대륙 연대기",
        "sub_title": "Chronicles of Artheria RPG",
        "category": "rpg",
        "category_name": "RPG/로그라이크",
        "genre": "판타지 오픈월드 RPG",
        "platform": "Web HTML5",
        "tech": "Modular Procedural Engine",
        "score": 97,
        "fun": 95,
        "desc": "절차적으로 생성되는 방대한 픽셀 월드, 다양한 마을 건축과 퀘스트, 던전 탐험을 제공하는 판타지 샌드박스 RPG.",
        "icon": "🏰",
        "theme_color": "#8b5cf6"
    },
    {
        "session": "08",
        "slug": "songbaek-killings",
        "title": "송백리 살인사건 1997",
        "sub_title": "The Songbaek Killings Mystery",
        "category": "horror",
        "category_name": "공포/미스터리",
        "genre": "미스터리 반전 추리",
        "platform": "Web HTML5",
        "tech": "Dynamic Narrative State Tree",
        "score": 100,
        "fun": 100,
        "desc": "1997년 고립된 시골 마을 송백리에서 벌어진 충격적인 연쇄 의문사. 단서를 조합해 진범의 거짓말을 깨부수는 추리물.",
        "icon": "🔍",
        "theme_color": "#b91c1c"
    },
    {
        "session": "09",
        "slug": "apartment-13",
        "title": "은하아파트 13동",
        "sub_title": "Apartment 13: Midnight Patrol",
        "category": "horror",
        "category_name": "공포/미스터리",
        "genre": "청각 기반 심야 순찰 공포",
        "platform": "Web HTML5",
        "tech": "Binaural Spatial Sound · CRT Shader",
        "score": 100,
        "fun": 99,
        "desc": "새벽 2시, 불 꺼진 복도식 아파트를 순찰하며 계단 밑에서 들려오는 발소리와 기괴한 잡음을 피해 생환하는 사운드 호러.",
        "icon": "🔦",
        "theme_color": "#475569"
    },
    {
        "session": "10",
        "slug": "archive-1999",
        "title": "아카이브 1999: 잔향의 병동",
        "sub_title": "Archive 1999: Retro 3D Horror",
        "category": "horror",
        "category_name": "공포/미스터리",
        "genre": "레트로 3D 단서 공포",
        "platform": "Web HTML5",
        "tech": "Three.js · PS1 Retro Shaders",
        "score": 99,
        "fun": 96,
        "desc": "90년대 PS1 풍 로우폴리 3D 폐병원. 터미널의 암호 파일과 CCTV 잔향을 조사하며 폐쇄 구역의 진실을 파헤치는 공포.",
        "icon": "📼",
        "theme_color": "#059669"
    },
    {
        "session": "11",
        "slug": "fps-arena",
        "title": "아웃포스트 서바이버: 오픈월드 RPG",
        "sub_title": "OUTPOST SURVIVOR : OPEN WORLD RPG",
        "category": "action",
        "category_name": "아케이드/액션",
        "genre": "오픈월드 전술 RPG 파밍 슈터",
        "platform": "Web HTML5",
        "tech": "Three.js · Dynamic Quest & RPG Skill Engine",
        "score": 100,
        "fun": 99,
        "desc": "안전 기지 스폰, 배그풍 보급 투하 및 보스 레이드, RPG 스킬 트리/레벨업, 자동 재생 실드 및 대미지 팝업의 완성도 높은 오픈월드 파밍 슈터.",
        "icon": "⚡",
        "theme_color": "#00f0ff"
    },
    {
        "session": "12",
        "slug": "abyss-roll",
        "title": "어비스 롤: 피의 카지노",
        "sub_title": "Abyss Roll: Blood Casino 2.0",
        "category": "rpg",
        "category_name": "RPG/로그라이크",
        "genre": "발라트로풍 주사위 로그라이크",
        "platform": "Web · Unity · Android APK",
        "tech": "Balatro-Math · Polychrome FX",
        "score": 100,
        "fun": 99,
        "desc": "[Chips x Mult] 폭발적 시너지, 5개 조커 슬롯, 보스 블라인드 디버프와 타로 부스터 팩을 결합한 다크 판타지 주사위 겜블 로그라이크.",
        "icon": "🎲",
        "theme_color": "#dc2626"
    },
    {
        "session": "13",
        "slug": "seamless-pixel-rpg",
        "title": "심리스 오픈월드 픽셀 RPG",
        "sub_title": "Seamless Open-World Pixel RPG",
        "category": "rpg",
        "category_name": "RPG/로그라이크",
        "genre": "200직업 & 거대 드래곤 레이드",
        "platform": "Web · Unity 2D (Isolated)",
        "tech": "HD-2D · Boss Telegraph · Weather Synergy",
        "score": 99,
        "fun": 98,
        "desc": "200종 직업과 용병 파티 전술 AI, 화면 절반을 채우는 거대 드래곤 장판 레이드 및 영지 재건을 담은 스팀 퀄리티 심리스 픽셀 RPG.",
        "icon": "⚔️",
        "theme_color": "#d97706"
    },
    {
        "session": "14",
        "slug": "cozy-fishing",
        "title": "코지 픽셀 낚시터",
        "sub_title": "Cozy Pixel Fishing & ASMR",
        "category": "cozy",
        "category_name": "코지/힐링",
        "genre": "50종 도감 & ASMR 텐션 릴링",
        "platform": "Web · Unity Overlay (Isolated)",
        "tech": "Procedural Wave · WebAudio ASMR · 6-Step FSM",
        "score": 100,
        "fun": 98,
        "desc": "파스텔 노을빛 수면에서 즐기는 ASMR 릴링 낚시. 50종 따스한 물고기 도감과 낚싯대 업그레이드, 동행 고양이 모찌의 방치형 낚시 루프.",
        "icon": "🎣",
        "theme_color": "#f67280"
    },
    {
        "session": "15",
        "slug": "zombie-hardcore",
        "title": "데드존: 3D 좀비 하드코어 액션",
        "sub_title": "Zombie Hardcore : Dead Zone",
        "category": "action",
        "category_name": "아케이드/액션",
        "genre": "3D 하드코어 좀비 서바이벌",
        "platform": "Web · Unity 3D (Isolated)",
        "tech": "Three.js · Dynamic Combat & Dismemberment · Spatial Audio",
        "score": 100,
        "fun": 99,
        "desc": "헤드샷 3.5배 데미지, 부위별 피격 경직 및 절단, 0.05초 역경직(Hit-stop), 50종 무기 스위칭과 물리 래그돌을 탑재한 스팀 퀄리티 3D 하드코어 좀비 액션.",
        "icon": "🧟",
        "theme_color": "#ff3b30"
    }
]

# Write site/manifest.json
manifest_file = site_dir / "manifest.json"
manifest_file.write_text(json.dumps(GAMES, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"site/manifest.json updated with {len(GAMES)} games.")

# Helper to generate thumbnails if missing
def create_styled_thumb(game):
    out_path = site_dir / game["slug"] / "thumb.png"
    if out_path.exists():
        return
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (640, 400), color="#0c101a")
    draw = ImageDraw.Draw(img)

    # Gradient background
    theme = game["theme_color"]
    # Parse hex
    r = int(theme[1:3], 16)
    g = int(theme[3:5], 16)
    b = int(theme[5:7], 16)

    for y in range(400):
        ratio = y / 400.0
        nr = int(12 * (1 - ratio) + (r * 0.25) * ratio)
        ng = int(16 * (1 - ratio) + (g * 0.25) * ratio)
        nb = int(26 * (1 - ratio) + (b * 0.25) * ratio)
        draw.line([(0, y), (640, y)], fill=(nr, ng, nb))

    # Outer border accent
    draw.rectangle([10, 10, 630, 390], outline=theme, width=3)
    draw.rectangle([16, 16, 624, 384], outline=(255, 255, 255, 30), width=1)

    # Accent decorative lines
    draw.line([(30, 80), (610, 80)], fill=theme, width=2)

    # Session Tag
    draw.rectangle([30, 30, 120, 65], fill=theme)
    draw.text((45, 38), f"#{game['session']}", fill="#ffffff")

    # Category badge
    draw.rectangle([135, 30, 280, 65], fill=(30, 40, 60))
    draw.text((150, 38), game["genre"], fill="#e2e8f0")

    # Title
    draw.text((36, 120), game["title"], fill="#ffffff")
    draw.text((36, 170), game["sub_title"], fill=theme)

    # Platform & Tech
    draw.text((36, 260), f"Platform: {game['platform']}", fill="#94a3b8")
    draw.text((36, 290), f"Engine: {game['tech']}", fill="#cbd5e1")
    draw.text((36, 330), f"Rating: Vision {game['score']} · Fun {game['fun']} / 100", fill="#ffd166")

    img.save(out_path, format="PNG")
    print(f"Generated thumbnail: {out_path}")

for g in GAMES:
    create_styled_thumb(g)

# Build site/index.html
cards_html = []
for g in GAMES:
    thumb_path = f"{g['slug']}/thumb.png"
    has_thumb = (site_dir / g['slug'] / "thumb.png").exists()
    thumb_tag = f'<img src="{thumb_path}" alt="{html_lib.escape(g["title"])}">' if has_thumb else f'<div class="no-thumb-icon">{g["icon"]}</div>'

    cards_html.append(f"""
      <div class="card" data-category="{g['category']}" data-search="{g['title'].lower()} {g['sub_title'].lower()} {g['genre'].lower()} {g['session']}" onclick="window.open('{g['slug']}/index.html', '_blank')" style="cursor:pointer;">
        <div class="thumb-wrap">
          <div class="thumb">
            {thumb_tag}
          </div>
          <div class="session-badge">#{g['session']}</div>
          <div class="category-pill">{g['category_name']}</div>
        </div>
        <div class="meta">
          <div class="genre-tag" style="color:{g['theme_color']}">{g['genre']}</div>
          <h2>{html_lib.escape(g['title'])}</h2>
          <div class="sub-title">{html_lib.escape(g['sub_title'])}</div>
          <p class="desc">{html_lib.escape(g['desc'])}</p>
          <div class="tech-row">
            <span class="tech-pill">{g['tech']}</span>
            <span class="platform-pill">{g['platform']}</span>
          </div>
          <div class="card-footer">
            <div class="score-badge">비전 {g['score']} · 재미 {g['fun']}</div>
            <a class="play-btn" href="{g['slug']}/index.html" target="_blank" onclick="event.stopPropagation()">
              <span>플레이</span> 🎮
            </a>
          </div>
        </div>
      </div>
    """)

cards_rendered = "\n".join(cards_html)

portal_html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Game Arcade Hub - 14 Games Showcase</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700;800;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<style>
  :root {{
    --bg: #07090e;
    --card: #0d121d;
    --card-hover: #121927;
    --line: #1c2638;
    --ink: #f1f5f9;
    --sub: #94a3b8;
    --accent: #00f0ff;
    --neon-pink: #ff007f;
    --gold: #ffd166;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: var(--bg);
    color: var(--ink);
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
    padding-bottom: 80px;
  }}
  /* Header Banner */
  .hero {{
    background: radial-gradient(circle at 50% 10%, #17243c 0%, #07090e 75%);
    border-bottom: 1px solid var(--line);
    padding: 60px 24px 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }}
  .hero::before {{
    content: '';
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 200px;
    background: radial-gradient(ellipse, rgba(0, 240, 255, 0.15), transparent 70%);
    pointer-events: none;
  }}
  .eyebrow {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 240, 255, 0.1);
    color: var(--accent);
    border: 1px solid rgba(0, 240, 255, 0.3);
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }}
  h1 {{
    font-size: clamp(2.4rem, 5vw, 3.8rem);
    font-weight: 900;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #00f0ff 0%, #ff007f 60%, #ffd166 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 12px;
  }}
  p.lead {{
    color: var(--sub);
    max-width: 680px;
    margin: 0 auto 24px;
    font-size: 1.12rem;
  }}
  .unity-safe-notice {{
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #6ee7b7;
    padding: 8px 18px;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
  }}

  /* Filter & Controls */
  .controls-bar {{
    max-width: 1280px;
    margin: 30px auto 35px;
    padding: 0 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }}
  .tabs {{
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }}
  .tab-btn {{
    background: #0d131f;
    border: 1px solid var(--line);
    color: var(--sub);
    padding: 9px 18px;
    border-radius: 12px;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }}
  .tab-btn:hover {{
    border-color: var(--accent);
    color: var(--ink);
  }}
  .tab-btn.active {{
    background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(255, 0, 127, 0.2));
    border-color: var(--accent);
    color: #fff;
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.25);
  }}
  .search-box {{
    position: relative;
    min-width: 280px;
  }}
  .search-box input {{
    width: 100%;
    background: #0d131f;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px 16px 10px 38px;
    color: #fff;
    font-size: 0.92rem;
    outline: none;
    transition: border-color 0.2s ease;
  }}
  .search-box input:focus {{
    border-color: var(--accent);
  }}
  .search-box span {{
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    opacity: 0.6;
  }}

  /* Grid Layout */
  .wrap {{
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
  }}
  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(370px, 1fr));
    gap: 26px;
  }}
  .card {{
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s ease, box-shadow 0.25s ease;
    position: relative;
  }}
  .card:hover {{
    transform: translateY(-8px);
    border-color: var(--accent);
    box-shadow: 0 16px 36px rgba(0, 240, 255, 0.2);
  }}
  .thumb-wrap {{
    position: relative;
    aspect-ratio: 16/10;
    background: #04060a;
    overflow: hidden;
    border-bottom: 1px solid var(--line);
  }}
  .thumb {{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .thumb img {{
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }}
  .card:hover .thumb img {{
    transform: scale(1.04);
  }}
  .no-thumb-icon {{
    font-size: 60px;
  }}
  .session-badge {{
    position: absolute;
    top: 14px;
    left: 14px;
    background: rgba(0, 0, 0, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffd166;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    backdrop-filter: blur(6px);
  }}
  .category-pill {{
    position: absolute;
    top: 14px;
    right: 14px;
    background: rgba(13, 18, 29, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #e2e8f0;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    backdrop-filter: blur(6px);
  }}

  /* Card Meta */
  .meta {{
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }}
  .genre-tag {{
    font-size: 0.82rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 6px;
  }}
  .meta h2 {{
    font-size: 1.32rem;
    font-weight: 800;
    line-height: 1.3;
    margin-bottom: 4px;
    color: #fff;
  }}
  .sub-title {{
    font-size: 0.86rem;
    color: #64748b;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 12px;
  }}
  .desc {{
    font-size: 0.92rem;
    color: var(--sub);
    line-height: 1.55;
    margin-bottom: 16px;
    flex: 1;
  }}
  .tech-row {{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }}
  .tech-pill, .platform-pill {{
    font-size: 0.76rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 3px 8px;
    color: #cbd5e1;
  }}
  .platform-pill {{
    border-color: rgba(0, 240, 255, 0.25);
    color: #38bdf8;
  }}
  .card-footer {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }}
  .score-badge {{
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--gold);
    background: rgba(255, 209, 102, 0.1);
    border: 1px solid rgba(255, 209, 102, 0.25);
    padding: 4px 10px;
    border-radius: 8px;
  }}
  .play-btn {{
    background: linear-gradient(135deg, #00f0ff, #0099ff);
    color: #000;
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 800;
    padding: 7px 18px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
  }}
  .play-btn:hover {{
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(0, 240, 255, 0.5);
  }}
</style>
</head>
<body>

<header class="hero">
  <div class="eyebrow">⚡ Unified Arcade Testbed · 14 Projects</div>
  <h1>AI Arcade Showcase</h1>
  <p class="lead">세션 01부터 14까지 제작된 모든 게임을 하나의 포털에서 직접 플레이하고 테스트하세요.</p>
  <div class="unity-safe-notice">
    <span>🛡️ 유니티 개발 환경 격리 보호 완료</span>
    <span style="opacity:0.6">|</span>
    <span>웹 단독 런처 구동으로 유니티 에셋 및 씬 파일에 무간섭</span>
  </div>
</header>

<div class="controls-bar">
  <div class="tabs">
    <button class="tab-btn active" data-filter="all">전체보기 (14)</button>
    <button class="tab-btn" data-filter="action">아케이드/액션 (5)</button>
    <button class="tab-btn" data-filter="rpg">RPG/로그라이크 (3)</button>
    <button class="tab-btn" data-filter="horror">공포/미스터리 (3)</button>
    <button class="tab-btn" data-filter="strategy">전략/시뮬레이션 (1)</button>
    <button class="tab-btn" data-filter="cozy">코지/힐링 (1)</button>
  </div>
  <div class="search-box">
    <span>🔍</span>
    <input type="text" id="searchInput" placeholder="게임 이름, 장르, 세션 번호 검색...">
  </div>
</div>

<main class="wrap">
  <div class="grid" id="gameGrid">
    {cards_rendered}
  </div>
</main>

<script>
// Tab Filtering
const tabs = document.querySelectorAll('.tab-btn');
const cards = document.querySelectorAll('.card');
const searchInput = document.getElementById('searchInput');

let currentFilter = 'all';
let searchQuery = '';

tabs.forEach(tab => {{
  tab.addEventListener('click', () => {{
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.getAttribute('data-filter');
    filterCards();
  }});
}});

searchInput.addEventListener('input', (e) => {{
  searchQuery = e.target.value.toLowerCase().trim();
  filterCards();
}});

function filterCards() {{
  cards.forEach(card => {{
    const category = card.getAttribute('data-category');
    const searchData = card.getAttribute('data-search');

    const matchesCategory = (currentFilter === 'all' || category === currentFilter);
    const matchesSearch = (!searchQuery || searchData.includes(searchQuery));

    if (matchesCategory && matchesSearch) {{
      card.style.display = 'flex';
    }} else {{
      card.style.display = 'none';
    }}
  }});
}}
</script>

</body>
</html>
"""

(site_dir / "index.html").write_text(portal_html, encoding="utf-8")
print("site/index.html generated with 14 games successfully!")
