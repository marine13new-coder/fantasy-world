# -*- coding: utf-8 -*-
import os
import re

builder_path = r"c:\Users\임종서\Desktop\auto gnimag\build_full_abyss_roll.py"
with open(builder_path, 'r', encoding='utf-8') as f:
    code = f.read()

from generate_gothic_assets import (
    HERO_CRUSADER, HERO_BARBARIAN, HERO_HIGHWAYMAN, HERO_OCCULTIST,
    BOSS_GOLEM, MONSTER_PRIEST, MONSTER_HELLHOUND, BOSS_SOVEREIGN
)

# Relic Card Ornate SVGs
RELIC_BLOOD_CHIPS = """<svg viewBox="0 0 32 40" class="relic-svg">
  <defs>
    <radialGradient id="bloodGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff3333"/>
      <stop offset="80%" stop-color="#880000"/>
      <stop offset="100%" stop-color="#330000"/>
    </radialGradient>
  </defs>
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#141824" stroke="#00ffff" stroke-width="1.5"/>
  <circle cx="16" cy="18" r="9" fill="url(#bloodGlow)" stroke="#ff7777" stroke-width="1"/>
  <path d="M16 12 Q 13 17 13 20 A 3 3 0 0 0 19 20 Q 19 17 16 12 Z" fill="#ffffff"/>
</svg>"""

RELIC_GOLDEN_MULT = """<svg viewBox="0 0 32 40" class="relic-svg">
  <defs>
    <linearGradient id="polyGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff275"/>
      <stop offset="50%" stop-color="#ff7700"/>
      <stop offset="100%" stop-color="#aa0055"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#1c1624" stroke="#ff7700" stroke-width="1.5"/>
  <!-- Ornate Golden Crown -->
  <polygon points="7,24 10,14 16,19 22,14 25,24" fill="url(#polyGold)" stroke="#ffd700" stroke-width="1"/>
  <rect x="7" y="24" width="18" height="3" fill="#ffd700"/>
  <circle cx="16" cy="10" r="2" fill="#00ffff"/>
</svg>"""

RELIC_PHOENIX_SHIELD = """<svg viewBox="0 0 32 40" class="relic-svg">
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#182218" stroke="#ffd700" stroke-width="1.5"/>
  <path d="M8 12 L 24 12 L 22 24 L 16 28 L 10 24 Z" fill="#992200" stroke="#ffd700" stroke-width="1"/>
  <!-- Phoenix Wings -->
  <path d="M10 16 Q 16 22 22 16 M 16 14 L 16 24" stroke="#ffd700" stroke-width="1.5" fill="none"/>
</svg>"""

RELIC_NEGATIVE_DEVIL = """<svg viewBox="0 0 32 40" class="relic-svg">
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#08080c" stroke="#ffffff" stroke-width="1.5"/>
  <!-- Horned Demon Skull -->
  <path d="M9 16 Q 6 8 4 6 Q 10 10 12 14" fill="#fff"/>
  <path d="M23 16 Q 26 8 28 6 Q 22 10 20 14" fill="#fff"/>
  <ellipse cx="16" cy="20" rx="6" ry="7" fill="#fff"/>
  <circle cx="14" cy="19" r="1.5" fill="#000"/>
  <circle cx="18" cy="19" r="1.5" fill="#000"/>
  <polygon points="15,23 16,24 17,23" fill="#000"/>
</svg>"""

RELIC_LOCKED_SLOT = """<svg viewBox="0 0 32 40" class="relic-svg">
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#0c0e14" stroke="#332a20" stroke-width="1"/>
  <!-- Lock -->
  <rect x="11" y="18" width="10" height="9" rx="2" fill="#554433"/>
  <path d="M13 18 L 13 14 A 3 3 0 0 1 19 14 L 19 18" stroke="#554433" stroke-width="2" fill="none"/>
</svg>"""

# Replace Hero Party HTML
old_hero_party = """      <!-- 4인 아군 파티 -->
      <div class="party-row" id="hero-party">
        <div class="entity-unit hero" id="hero-0">
          <div class="entity-avatar">🛡️</div>
          <div class="entity-name">성기사</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-0"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-0"></div></div>
        </div>
        <div class="entity-unit hero" id="hero-1">
          <div class="entity-avatar">🪓</div>
          <div class="entity-name">야만용사</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-1"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-1"></div></div>
        </div>
        <div class="entity-unit hero" id="hero-2">
          <div class="entity-avatar">🏹</div>
          <div class="entity-name">노상강도</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-2"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-2"></div></div>
        </div>
        <div class="entity-unit hero" id="hero-3">
          <div class="entity-avatar">🔮</div>
          <div class="entity-name">신비학자</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-3"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-3"></div></div>
        </div>
      </div>"""

new_hero_party = f"""      <!-- 4인 아군 파티 (고품질 다크 판타지 고딕 벡터 일러스트) -->
      <div class="party-row" id="hero-party">
        <div class="entity-unit hero" id="hero-0">
          <div class="entity-avatar">{HERO_CRUSADER}</div>
          <div class="entity-name">성기사</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-0"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-0"></div></div>
        </div>
        <div class="entity-unit hero" id="hero-1">
          <div class="entity-avatar">{HERO_BARBARIAN}</div>
          <div class="entity-name">야만용사</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-1"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-1"></div></div>
        </div>
        <div class="entity-unit hero" id="hero-2">
          <div class="entity-avatar">{HERO_HIGHWAYMAN}</div>
          <div class="entity-name">노상강도</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-2"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-2"></div></div>
        </div>
        <div class="entity-unit hero" id="hero-3">
          <div class="entity-avatar">{HERO_OCCULTIST}</div>
          <div class="entity-name">신비학자</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-3"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-3"></div></div>
        </div>
      </div>"""

# Replace Monster Party HTML
old_monster_party = """      <!-- 보스 블라인드 몬스터 라인업 -->
      <div class="monster-row" id="monster-party">
        <div class="entity-unit monster boss" id="mon-0">
          <div class="entity-avatar" id="boss-avatar">👹</div>
          <div class="entity-name" id="boss-name">화염 골렘</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="m-hp-0"></div></div>
        </div>
        <div class="entity-unit monster" id="mon-1">
          <div class="entity-avatar">🧙‍♂️</div>
          <div class="entity-name">망령 사제</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="m-hp-1"></div></div>
        </div>
        <div class="entity-unit monster" id="mon-2">
          <div class="entity-avatar">🐺</div>
          <div class="entity-name">지옥견</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="m-hp-2"></div></div>
        </div>
      </div>"""

new_monster_party = f"""      <!-- 보스 블라인드 몬스터 라인업 (고품질 다크 고딕 보스 & 하수인) -->
      <div class="monster-row" id="monster-party">
        <div class="entity-unit monster boss" id="mon-0">
          <div class="entity-avatar" id="boss-avatar">{BOSS_GOLEM}</div>
          <div class="entity-name" id="boss-name">화염 골렘</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="m-hp-0"></div></div>
        </div>
        <div class="entity-unit monster" id="mon-1">
          <div class="entity-avatar">{MONSTER_PRIEST}</div>
          <div class="entity-name">망령 사제</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="m-hp-1"></div></div>
        </div>
        <div class="entity-unit monster" id="mon-2">
          <div class="entity-avatar">{MONSTER_HELLHOUND}</div>
          <div class="entity-name">지옥견</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="m-hp-2"></div></div>
        </div>
      </div>"""

# Replace Relic Card Slots
old_relic_slots = """    <div class="relic-slots">
      <div class="relic-card foil" id="joker-0" onclick="inspectJoker(0)" title="블러드 칩스: +30 Chips">
        <span>🩸</span>
        <div class="relic-badge">+30</div>
      </div>
      <div class="relic-card polychrome" id="joker-1" onclick="inspectJoker(1)" title="황금 배율: X1.5 Mult">
        <span>👑</span>
        <div class="relic-badge">X1.5</div>
      </div>
      <div class="relic-card" id="joker-2" onclick="inspectJoker(2)" title="불사조 보험: 자멸 1회 무효">
        <span>🛡️</span>
        <div class="relic-badge">SHLD</div>
      </div>
      <div class="relic-card negative" id="joker-3" onclick="inspectJoker(3)" title="네거티브 심연 악마: 조커 슬롯 확장">
        <span>💀</span>
        <div class="relic-badge">+1SLT</div>
      </div>
      <div class="relic-card" id="joker-4" onclick="inspectJoker(4)" style="opacity: 0.3;">
        <span>🔒</span>
      </div>
    </div>"""

new_relic_slots = f"""    <div class="relic-slots">
      <div class="relic-card foil" id="joker-0" onclick="inspectJoker(0)" title="블러드 칩스: +30 Chips">
        {RELIC_BLOOD_CHIPS}
        <div class="relic-badge">+30</div>
      </div>
      <div class="relic-card polychrome" id="joker-1" onclick="inspectJoker(1)" title="황금 배율: X1.5 Mult">
        {RELIC_GOLDEN_MULT}
        <div class="relic-badge">X1.5</div>
      </div>
      <div class="relic-card" id="joker-2" onclick="inspectJoker(2)" title="불사조 보험: 자멸 1회 무효">
        {RELIC_PHOENIX_SHIELD}
        <div class="relic-badge">SHLD</div>
      </div>
      <div class="relic-card negative" id="joker-3" onclick="inspectJoker(3)" title="네거티브 심연 악마: 조커 슬롯 확장">
        {RELIC_NEGATIVE_DEVIL}
        <div class="relic-badge">+1SLT</div>
      </div>
      <div class="relic-card" id="joker-4" onclick="inspectJoker(4)" style="opacity: 0.3;">
        {RELIC_LOCKED_SLOT}
      </div>
    </div>"""

# CSS Enhancements for SVGs, Casino Velvet Table, and 3D Dice
additional_css = """
  /* 고품질 고딕 일러스트 SVG 스타일 */
  .unit-svg {
    width: 48px;
    height: 48px;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.9));
    transition: transform 0.2s ease-out;
  }
  .unit-svg:hover { transform: scale(1.08) translateY(-2px); }
  .boss-svg {
    width: 62px;
    height: 62px;
    filter: drop-shadow(0 0 12px rgba(255, 34, 0, 0.7));
    animation: bossPulse 2s infinite ease-in-out alternate;
  }
  @keyframes bossPulse {
    0% { transform: scale(0.96) translateY(0); filter: drop-shadow(0 0 10px rgba(255, 34, 0, 0.6)); }
    100% { transform: scale(1.04) translateY(-3px); filter: drop-shadow(0 0 18px rgba(255, 80, 0, 0.9)); }
  }
  .relic-svg {
    width: 26px;
    height: 32px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
  }

  /* 카지노 펠트 테이블 백그라운드 */
  #top-battle-view {
    background: radial-gradient(circle at 50% 20%, #2b0e0e 0%, #0c080b 100%),
                repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 8px);
    border-bottom: 3px solid #3d2d1e;
    box-shadow: inset 0 -10px 20px rgba(0,0,0,0.8);
  }
  #middle-casino-board {
    background: radial-gradient(circle at 50% 40%, #17231c 0%, #070e0a 100%);
    border-top: 1px solid #233b2a;
    border-bottom: 2px solid #3d2d1e;
  }

  /* 3D 엠보싱 주사위 큐브 */
  .dice-slot {
    width: 72px;
    height: 78px;
    background: linear-gradient(145deg, #242938, #10131d);
    border: 2px solid #54442e;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.6);
  }
  .dice-value {
    font-family: 'Cinzel', 'Noto Serif KR', serif;
    font-size: 32px;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 0 10px rgba(255,215,0,0.8), 0 3px 6px #000;
  }
"""

# Replace in code
assert old_hero_party in code, "old_hero_party not found"
code = code.replace(old_hero_party, new_hero_party)

assert old_monster_party in code, "old_monster_party not found"
code = code.replace(old_monster_party, new_monster_party)

assert old_relic_slots in code, "old_relic_slots not found"
code = code.replace(old_relic_slots, new_relic_slots)

# Insert CSS right before </style>
code = code.replace("</style>", additional_css + "\n</style>")

# Dynamic Boss Avatar in respawnMonsters:
# When Ante changes, swap to BOSS_SOVEREIGN for Ante 8, etc.
old_respawn = """  document.getElementById('boss-avatar').innerText = bossData.icon;"""
new_respawn = """  if (currentAnte >= 8) {
    document.getElementById('boss-avatar').innerHTML = `" + BOSS_SOVEREIGN.replace('"', '\\"') + "`;
  } else {
    document.getElementById('boss-avatar').innerHTML = `" + BOSS_GOLEM.replace('"', '\\"') + "`;
  }"""
# Wait, let's inject a helper function updateBossVisual() in JS
code = code.replace(
    "document.getElementById('boss-avatar').innerText = bossData.icon;",
    "updateBossSvgAvatar(currentAnte);"
)

# Add updateBossSvgAvatar function into JS
js_boss_helper = f"""
function updateBossSvgAvatar(ante) {{
  const el = document.getElementById('boss-avatar');
  if (ante >= 8) {{
    el.innerHTML = `{BOSS_SOVEREIGN}`;
  }} else {{
    el.innerHTML = `{BOSS_GOLEM}`;
  }}
}}
"""
code = code.replace("function respawnMonsters() {", js_boss_helper + "\nfunction respawnMonsters() {")

# Cutin attacker / target icons
code = code.replace(
    "document.getElementById('cutin-attacker').innerText = attackerIcon;",
    "document.getElementById('cutin-attacker').innerHTML = `" + HERO_CRUSADER.replace("width=\"100%\"", "width=\"80px\"").replace("height=\"100%\"", "height=\"80px\"") + "`;"
)
code = code.replace(
    "document.getElementById('cutin-target').innerText = targetIcon;",
    "document.getElementById('cutin-target').innerHTML = `" + BOSS_GOLEM.replace("width=\"100%\"", "width=\"90px\"").replace("height=\"100%\"", "height=\"90px\"") + "`;"
)

with open(builder_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Visual upgrade applied to build_full_abyss_roll.py successfully!")
