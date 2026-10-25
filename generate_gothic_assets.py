# -*- coding: utf-8 -*-
"""
High-End Dark Gothic Pixel & Vector Asset Library for Abyss Roll
Replaces cheap emojis with commercial Darkest Dungeon x Balatro art assets.
"""

# 4 Heroes
HERO_CRUSADER = """<svg viewBox="0 0 64 64" class="unit-svg">
  <defs>
    <linearGradient id="crusaderSteel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9aaec4"/>
      <stop offset="50%" stop-color="#4a5d73"/>
      <stop offset="100%" stop-color="#1f2733"/>
    </linearGradient>
    <linearGradient id="crusaderGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe066"/>
      <stop offset="60%" stop-color="#c59b27"/>
      <stop offset="100%" stop-color="#5a4209"/>
    </linearGradient>
  </defs>
  <!-- Cape / Cloak -->
  <path d="M12 40 Q 6 58 10 64 L 54 64 Q 58 58 52 40 Z" fill="#661111" stroke="#220000" stroke-width="1.5"/>
  <!-- Pauldrons -->
  <path d="M6 34 Q 4 22 18 20 L 24 32 L 10 42 Z" fill="url(#crusaderSteel)" stroke="#111" stroke-width="1.5"/>
  <path d="M58 34 Q 60 22 46 20 L 40 32 L 54 42 Z" fill="url(#crusaderSteel)" stroke="#111" stroke-width="1.5"/>
  <!-- Torso Plate & Red Cross -->
  <path d="M18 28 L 46 28 L 42 54 L 22 54 Z" fill="url(#crusaderSteel)" stroke="#0e131a" stroke-width="2"/>
  <rect x="29" y="30" width="6" height="20" fill="#cc1111"/>
  <rect x="22" y="36" width="20" height="6" fill="#cc1111"/>
  <!-- Great Helm -->
  <path d="M20 10 L 44 10 L 46 32 L 32 40 L 18 32 Z" fill="url(#crusaderSteel)" stroke="#000" stroke-width="2"/>
  <path d="M30 14 L 34 14 L 34 36 L 30 36 Z" fill="url(#crusaderGold)"/>
  <path d="M22 22 L 42 22 L 42 26 L 22 26 Z" fill="url(#crusaderGold)"/>
  <!-- Glowing Eye Slits -->
  <rect x="23" y="23" width="7" height="2" fill="#00ffff" style="filter:drop-shadow(0 0 4px #00ffff);"/>
  <rect x="34" y="23" width="7" height="2" fill="#00ffff" style="filter:drop-shadow(0 0 4px #00ffff);"/>
  <!-- Crest Crown -->
  <polygon points="26,6 32,1 38,6 32,8" fill="url(#crusaderGold)" stroke="#222"/>
</svg>"""

HERO_BARBARIAN = """<svg viewBox="0 0 64 64" class="unit-svg">
  <defs>
    <linearGradient id="barbSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b88360"/>
      <stop offset="100%" stop-color="#6e462e"/>
    </linearGradient>
    <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0e6d2"/>
      <stop offset="70%" stop-color="#8a7962"/>
      <stop offset="100%" stop-color="#2a2218"/>
    </linearGradient>
  </defs>
  <!-- Fur Mantle -->
  <path d="M10 32 Q 4 52 14 62 L 50 62 Q 60 52 54 32 Z" fill="#3a2f26" stroke="#16120e" stroke-width="2"/>
  <!-- Massive Shoulders & War Paint -->
  <path d="M12 28 Q 32 36 52 28 L 48 50 L 16 50 Z" fill="url(#barbSkin)" stroke="#2b1a10" stroke-width="2"/>
  <path d="M20 32 L 28 46 L 24 48 L 18 34 Z" fill="#990000"/>
  <path d="M44 32 L 36 46 L 40 48 L 46 34 Z" fill="#990000"/>
  <!-- Horned Helmet -->
  <!-- Left Horn -->
  <path d="M18 18 Q 4 10 2 0 Q 14 6 22 14 Z" fill="url(#hornGrad)" stroke="#111" stroke-width="1.5"/>
  <!-- Right Horn -->
  <path d="M46 18 Q 60 10 62 0 Q 50 6 42 14 Z" fill="url(#hornGrad)" stroke="#111" stroke-width="1.5"/>
  <!-- Iron Nose Guard Helm -->
  <path d="M20 12 L 44 12 L 45 28 L 36 28 L 34 38 L 30 38 L 28 28 L 19 28 Z" fill="#4a5057" stroke="#111" stroke-width="2"/>
  <!-- Glowing Blood Eyes -->
  <circle cx="25" cy="24" r="2.5" fill="#ff2200" style="filter:drop-shadow(0 0 3px #ff2200);"/>
  <circle cx="39" cy="24" r="2.5" fill="#ff2200" style="filter:drop-shadow(0 0 3px #ff2200);"/>
</svg>"""

HERO_HIGHWAYMAN = """<svg viewBox="0 0 64 64" class="unit-svg">
  <defs>
    <linearGradient id="leatherCoat" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a3f35"/>
      <stop offset="100%" stop-color="#1f1a16"/>
    </linearGradient>
  </defs>
  <!-- Longcoat & Scarf -->
  <path d="M14 36 L 6 64 L 58 64 L 50 36 Z" fill="url(#leatherCoat)" stroke="#110d0a" stroke-width="2"/>
  <!-- Red Bandana Mask -->
  <path d="M22 26 L 42 26 L 46 44 L 32 52 L 18 44 Z" fill="#881111" stroke="#330000" stroke-width="1.5"/>
  <path d="M28 32 L 36 32 L 32 40 Z" fill="#aa2222"/>
  <!-- Tricorne Hat -->
  <path d="M6 16 Q 32 4 58 16 Q 44 24 32 20 Q 20 24 6 16 Z" fill="#18181c" stroke="#000" stroke-width="2"/>
  <path d="M20 16 Q 32 8 44 16 L 40 6 Q 32 4 24 6 Z" fill="#2c2c36"/>
  <!-- Shadowed Eyes under brim -->
  <ellipse cx="26" cy="22" rx="3" ry="1.5" fill="#ffd700" style="filter:drop-shadow(0 0 3px #ffd700);"/>
  <ellipse cx="38" cy="22" rx="3" ry="1.5" fill="#ffd700" style="filter:drop-shadow(0 0 3px #ffd700);"/>
</svg>"""

HERO_OCCULTIST = """<svg viewBox="0 0 64 64" class="unit-svg">
  <defs>
    <linearGradient id="voidPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#aa44ff"/>
      <stop offset="100%" stop-color="#330066"/>
    </linearGradient>
    <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff00ea"/>
      <stop offset="50%" stop-color="#9900ff"/>
      <stop offset="100%" stop-color="#000"/>
    </radialGradient>
  </defs>
  <!-- Dark Cult Robes -->
  <path d="M12 36 L 4 64 L 60 64 L 52 36 Z" fill="#1e182e" stroke="#0b0812" stroke-width="2"/>
  <!-- Mystical Turban -->
  <ellipse cx="32" cy="18" rx="16" ry="12" fill="#2d2244" stroke="#0f0b17" stroke-width="2"/>
  <!-- Elder Eye Gem in Forehead -->
  <path d="M27 16 Q 32 11 37 16 Q 32 21 27 16 Z" fill="#00ffcc" stroke="#003322" stroke-width="1"/>
  <circle cx="32" cy="16" r="2" fill="#ff0055"/>
  <!-- Bone Mask / Beard -->
  <path d="M24 24 L 40 24 L 38 38 L 32 44 L 26 38 Z" fill="#d8cfbe" stroke="#3d3528" stroke-width="1.5"/>
  <!-- Void Skull / Orb floating in hand -->
  <circle cx="48" cy="46" r="9" fill="url(#orbGlow)" stroke="#ff77ff" stroke-width="1" style="filter:drop-shadow(0 0 8px #aa00ff);"/>
  <!-- Glowing Occult Runes -->
  <circle cx="28" cy="30" r="1.5" fill="#00ffcc"/>
  <circle cx="36" cy="30" r="1.5" fill="#00ffcc"/>
</svg>"""

# Bosses & Monsters
BOSS_GOLEM = """<svg viewBox="0 0 80 80" class="boss-svg">
  <defs>
    <linearGradient id="magmaRock" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3d2a24"/>
      <stop offset="50%" stop-color="#1f1410"/>
      <stop offset="100%" stop-color="#0a0503"/>
    </linearGradient>
    <linearGradient id="lavaVein" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffff00"/>
      <stop offset="30%" stop-color="#ff6600"/>
      <stop offset="100%" stop-color="#cc0000"/>
    </linearGradient>
  </defs>
  <!-- Stone Body Silhouette -->
  <polygon points="10,48 24,20 56,20 70,48 58,74 22,74" fill="url(#magmaRock)" stroke="#110905" stroke-width="3"/>
  <!-- Spiked Stone Shoulders -->
  <polygon points="4,32 18,18 26,34" fill="url(#magmaRock)" stroke="#111" stroke-width="2"/>
  <polygon points="76,32 62,18 54,34" fill="url(#magmaRock)" stroke="#111" stroke-width="2"/>
  <!-- Molten Lava Cracks -->
  <path d="M24 22 L 32 38 L 28 54 L 40 68" stroke="url(#lavaVein)" stroke-width="3.5" fill="none" style="filter:drop-shadow(0 0 6px #ff4400);"/>
  <path d="M56 22 L 48 38 L 52 54 L 42 68" stroke="url(#lavaVein)" stroke-width="3.5" fill="none" style="filter:drop-shadow(0 0 6px #ff4400);"/>
  <path d="M32 38 L 48 38" stroke="url(#lavaVein)" stroke-width="3" fill="none"/>
  <!-- Giant Glowing Magma Eyes -->
  <polygon points="26,30 36,32 32,38" fill="#ffff33" style="filter:drop-shadow(0 0 8px #ff5500);"/>
  <polygon points="54,30 44,32 48,38" fill="#ffff33" style="filter:drop-shadow(0 0 8px #ff5500);"/>
  <!-- Jagged Lava Maw -->
  <polygon points="28,48 34,54 40,48 46,54 52,48 48,58 32,58" fill="#ff3300" stroke="#ffaa00" stroke-width="1.5" style="filter:drop-shadow(0 0 8px #ff2200);"/>
  <!-- Lava Core Crest -->
  <polygon points="34,14 40,4 46,14" fill="#ffaa00" style="filter:drop-shadow(0 0 6px #ffff00);"/>
</svg>"""

MONSTER_PRIEST = """<svg viewBox="0 0 64 64" class="unit-svg">
  <!-- Ghostly Shroud -->
  <path d="M16 20 Q 32 6 48 20 L 52 58 Q 42 64 32 56 Q 22 64 12 58 Z" fill="#1b2828" stroke="#0d1717" stroke-width="2"/>
  <!-- Skeletal Face Mask -->
  <ellipse cx="32" cy="24" rx="10" ry="12" fill="#d9e0db" stroke="#1c2620" stroke-width="1.5"/>
  <!-- Hollow Ghostly Cyan Eyes -->
  <circle cx="28" cy="22" r="3.5" fill="#00ffff" style="filter:drop-shadow(0 0 6px #00ffff);"/>
  <circle cx="36" cy="22" r="3.5" fill="#00ffff" style="filter:drop-shadow(0 0 6px #00ffff);"/>
  <path d="M28 30 L 36 30" stroke="#111" stroke-width="2"/>
  <!-- Cursed Grimoire -->
  <polygon points="20,44 44,44 42,56 18,56" fill="#4a1515" stroke="#ff4444" stroke-width="1"/>
</svg>"""

MONSTER_HELLHOUND = """<svg viewBox="0 0 64 64" class="unit-svg">
  <!-- Beast Body -->
  <path d="M8 44 Q 18 20 44 26 L 58 46 L 46 56 L 16 56 Z" fill="#211c19" stroke="#0a0807" stroke-width="2"/>
  <!-- Ribcage Exposed Bone -->
  <path d="M26 34 L 32 44 M 34 32 L 40 42 M 42 34 L 46 44" stroke="#e0d5c1" stroke-width="2"/>
  <!-- Snarling Wolf Head -->
  <polygon points="40,24 58,16 62,32 48,36" fill="#302621" stroke="#0a0807" stroke-width="2"/>
  <!-- Piercing Crimson Eyes -->
  <circle cx="50" cy="22" r="2.5" fill="#ff0033" style="filter:drop-shadow(0 0 5px #ff0033);"/>
  <!-- Sharp Fangs with Blood -->
  <polygon points="56,32 58,38 60,32" fill="#fff"/>
  <polygon points="52,34 54,39 56,34" fill="#ff2222"/>
</svg>"""

BOSS_SOVEREIGN = """<svg viewBox="0 0 80 80" class="boss-svg">
  <defs>
    <linearGradient id="dragonScales" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a001a"/>
      <stop offset="50%" stop-color="#1f000b"/>
      <stop offset="100%" stop-color="#0a0003"/>
    </linearGradient>
    <linearGradient id="goldCrown" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff275"/>
      <stop offset="60%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#705307"/>
    </linearGradient>
  </defs>
  <!-- Dragon Wings / Abyssal Shroud -->
  <path d="M4 36 Q 40 6 76 36 L 68 76 Q 40 64 12 76 Z" fill="url(#dragonScales)" stroke="#000" stroke-width="2.5"/>
  <!-- Great Curved Horns -->
  <path d="M22 22 Q 2 8 0 0 Q 18 4 28 16 Z" fill="#1c0f14" stroke="#ff2255" stroke-width="1.5"/>
  <path d="M58 22 Q 78 8 80 0 Q 62 4 52 16 Z" fill="#1c0f14" stroke="#ff2255" stroke-width="1.5"/>
  <!-- Sovereign Crown -->
  <polygon points="26,16 32,4 40,12 48,4 54,16" fill="url(#goldCrown)" stroke="#3a2503" stroke-width="1.5"/>
  <!-- Dragon Skull Visage -->
  <polygon points="26,22 54,22 50,56 40,68 30,56" fill="#2b0d19" stroke="#ff0044" stroke-width="2"/>
  <!-- 3 Glowing Abyssal Eyes -->
  <ellipse cx="34" cy="34" rx="4" ry="3" fill="#ff0033" style="filter:drop-shadow(0 0 6px #ff0033);"/>
  <ellipse cx="46" cy="34" rx="4" ry="3" fill="#ff0033" style="filter:drop-shadow(0 0 6px #ff0033);"/>
  <circle cx="40" cy="26" r="3" fill="#ffd700" style="filter:drop-shadow(0 0 8px #ffd700);"/>
  <!-- Core Maw / Breath Chamber -->
  <polygon points="34,50 40,60 46,50" fill="#ff0055" style="filter:drop-shadow(0 0 10px #ff0055);"/>
</svg>"""

print("Gothic asset library ready!")
