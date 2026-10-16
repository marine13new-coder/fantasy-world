// ============================================================================
// pixel_items.js - High-Definition RPG Pixel Art Item Icon Engine
// 16x16 & 24x24 Retro Pixel Art Icons for Weapons, Armor, Potions, Resources, Fish
// Provides offscreen canvas rendering & base64 DataURL caching for UI & HUD
// ============================================================================

(function(window) {
  'use strict';

  // Item Palette: rich 5-tier shaded retro RPG colors
  const IPAL = {
    '.': null,                     // Transparent
    '#': '#0b0f19',                // Dark 1px Contour Outline
    'k': '#1e293b',                // Deep Shadow
    's': '#475569',                // Steel Shadow
    'm': '#94a3b8',                // Steel Midtone
    'h': '#e2e8f0',                // Steel Bright / Silver
    'w': '#ffffff',                // Pure White Glint
    'g': '#854d0e',                // Dark Gold
    'G': '#ca8a04',                // Gold Mid
    'y': '#facc15',                // Bright Gold
    'Y': '#fef08a',                // Gold Highlight
    'r': '#991b1b',                // Crimson Shadow
    'R': '#dc2626',                // Red / Ruby
    'e': '#ef4444',                // Bright Red
    'b': '#1e3a8a',                // Dark Blue
    'B': '#2563eb',                // Royal Blue
    'c': '#38bdf8',                // Arcane Cyan
    'C': '#7dd3fc',                // Glow Cyan
    'p': '#581c87',                // Dark Purple
    'P': '#9333ea',                // Amethyst Purple
    'v': '#c084fc',                // Lavender Glow
    'g1': '#14532d',               // Dark Forest Green
    'g2': '#16a34a',               // Emerald
    'g3': '#4ade80',               // Lime Highlight
    'o': '#451a03',                // Dark Leather / Wood
    'O': '#78350f',                // Oak Brown
    'l': '#b45309',                // Light Amber / Bronze
    't': '#fed7aa',                // Flesh / Parchment
    'T': '#ffedd5',                // Clean Parchment
    'f': '#ea580c',                // Flame Orange
    'F': '#f97316'                 // Bright Flame
  };

  const RAW_ITEMS = {
    // ------------------------------------------------------------------------
    // [1] Weapons (장검, 성검, 도끼, 지팡이, 활)
    // ------------------------------------------------------------------------
    sword_steel: [
      "..............#w",
      ".............#wh",
      "............#wh#",
      "...........#wh#.",
      "..........#wh#..",
      ".........#wh#...",
      "........#wh#....",
      ".......#wh#.....",
      "......#wh#......",
      "..###.#s#.......",
      ".#GGG#s#........",
      "#GyYG#..........",
      ".#GGG#..........",
      "...#O#..........",
      "...#O#..........",
      "....#..........."
    ],
    sword_flame: [
      "..............#w",
      ".............#Ff",
      "............#Ffr",
      "...........#Ffr#",
      "..........#Ffr#.",
      ".........#Ffr#..",
      "........#Ffr#...",
      ".......#Ffr#....",
      "......#Ffr#.....",
      "..###.#f#.......",
      ".#yyy#f#........",
      "#yyyy#..........",
      ".#yyy#..........",
      "...#r#..........",
      "...#r#..........",
      "....#..........."
    ],
    sword_excalibur: [
      "..............#w",
      ".............#wC",
      "............#wCc",
      "...........#wCc#",
      "..........#wCc#.",
      ".........#wCc#..",
      "........#wCc#...",
      ".......#wCc#....",
      "......#wCc#.....",
      "..###.#Y#.......",
      ".#yYy#Y#........",
      "#YYYY#..........",
      ".#yYy#..........",
      "...#C#..........",
      "...#C#..........",
      "....#..........."
    ],
    axe_battle: [
      "......#####.....",
      "....##hhhhh##...",
      "...#hhshhhshh#..",
      "..#hshm#m#mshh#.",
      ".#hsh#.#O#.#hsh#",
      ".#sh#..#O#..#hs#",
      "..##...#O#...##.",
      ".......#O#......",
      ".......#O#......",
      ".......#O#......",
      ".......#O#......",
      ".......#O#......",
      ".......#O#......",
      ".......#O#......",
      "......#yyy#.....",
      ".......###......"
    ],
    staff_arcane: [
      ".....##P##......",
      "...##vvvvv##....",
      "..#vvwCvwvvw#...",
      "..#vvCwCvvvv#...",
      "...##vvvvv##....",
      ".....##P##......",
      "......#G#.......",
      "......#O#.......",
      "......#O#.......",
      "......#O#.......",
      "......#O#.......",
      "......#O#.......",
      "......#O#.......",
      "......#O#.......",
      "......#O#.......",
      "......###......."
    ],
    bow_elven: [
      ".......####.....",
      ".....##g2g3##...",
      "...##g2g1..#s#..",
      "..#g2g1....#s#..",
      ".#g2g1.....#s#..",
      "#g2g1......#s#..",
      "#g2g1......#s#..",
      "#g3g2#.....#s#..",
      "#g2g1......#s#..",
      "#g2g1......#s#..",
      ".#g2g1.....#s#..",
      "..#g2g1....#s#..",
      "...##g2g1..#s#..",
      ".....##g2g3##...",
      ".......####.....",
      "................"
    ],

    // ------------------------------------------------------------------------
    // [2] Shields & Armors (방패, 투구, 갑옷)
    // ------------------------------------------------------------------------
    shield_iron: [
      "................",
      ".##############.",
      ".#hhhhssssssss#.",
      ".#hshhGssGssss#.",
      ".#hshhGssGssss#.",
      ".#hshhGGGGssss#.",
      ".#hshhGGGGssss#.",
      ".#hshhGssGssss#.",
      ".#hshhGssGssss#.",
      "..#hshssssss#...",
      "..#hshssssss#...",
      "...#hshssss#....",
      "....#hshss#.....",
      ".....#hss#......",
      "......#s#.......",
      ".......#........"
    ],
    shield_dragon: [
      "................",
      ".##############.",
      ".#RRRRrrrrrrrr#.",
      ".#ReRRfssfrrrr#.",
      ".#ReRRfssfrrrr#.",
      ".#ReRRffffrrrr#.",
      ".#ReRRffffrrrr#.",
      ".#ReRRfssfrrrr#.",
      ".#ReRRfssfrrrr#.",
      "..#ReRrrrrrr#...",
      "..#ReRrrrrrr#...",
      "...#ReRrrrr#....",
      "....#ReRrr#.....",
      ".....#Rrr#......",
      "......#r#.......",
      ".......#........"
    ],
    armor_plate: [
      ".....######.....",
      "..###hhhhhh###..",
      ".#hhhssGssGsshh#",
      ".#hhsssGssGsssh#",
      ".#hhssssssssssh#",
      "..##hssssssss##.",
      "...#hssssssss#..",
      "...#hGGGGGGGG#..",
      "...#hssssssss#..",
      "...#hssssssss#..",
      "...#hssssssss#..",
      "...#hssssssss#..",
      "...#hssssssss#..",
      "..#hhs#..#shh#..",
      "..#hhs#..#shh#..",
      "..####....####.."
    ],
    crown_royal: [
      "................",
      "................",
      "....#..#..#.....",
      "...#y#.#y#.#y#...",
      "..#yY#.#yY#.#yY#.",
      ".#yYY#.#yYY#.#yYY",
      ".#yYY###yYY###yY#",
      ".#yYYYYyYYYYyYYY#",
      ".#yRRyGGyCCyGyyY#",
      ".#yRRyGGyCCyGyyY#",
      ".#yYYYYYYYYYYYYY#",
      ".################",
      "................",
      "................",
      "................",
      "................"
    ],

    // ------------------------------------------------------------------------
    // [3] Potions & Elixirs (생명력 물약, 마나 물약, 비약)
    // ------------------------------------------------------------------------
    potion_red: [
      "......####......",
      "......#OO#......",
      ".....#mmmm#.....",
      ".....#whhm#.....",
      "....#whhhhm#....",
      "...#whReeRhm#...",
      "..#whReeeeeRhm#.",
      "..#whReeeeeRhm#.",
      "..#whReeeeeRhm#.",
      "..#whReeeeeRhm#.",
      "..#whRrrrreRhm#.",
      "..#whRrrrrrrhm#.",
      "..#whRrrrrrrhm#.",
      "...#whrrrrrhm#..",
      "....#########...",
      "................"
    ],
    potion_blue: [
      "......####......",
      "......#OO#......",
      ".....#mmmm#.....",
      ".....#whhm#.....",
      "....#whhhhm#....",
      "...#whBccBhm#...",
      "..#whBccccBhm#..",
      "..#whBccccBhm#..",
      "..#whBccccBhm#..",
      "..#whBccccBhm#..",
      "..#whBbbbbBhm#..",
      "..#whBbbbbbbhm#.",
      "..#whBbbbbbbhm#.",
      "...#whbbbbbhm#..",
      "....#########...",
      "................"
    ],
    potion_gold: [
      "......####......",
      "......#OO#......",
      ".....#mmmm#.....",
      ".....#whhm#.....",
      "....#whhhhm#....",
      "...#whyYYyhm#...",
      "..#whyYYYYyhm#..",
      "..#whyYYYYyhm#..",
      "..#whyYYYYyhm#..",
      "..#whyYYYYyhm#..",
      "..#whyGGGGyhm#..",
      "..#whyGGGGGGhm#.",
      "..#whyGGGGGGhm#.",
      "...#whGGGGGhm#..",
      "....#########...",
      "................"
    ],

    // ------------------------------------------------------------------------
    // [4] Resources, Gems & Crops (밀, 목재, 광석, 보석, 향신료)
    // ------------------------------------------------------------------------
    crop_wheat: [
      ".......#y#......",
      "......#yYy#.....",
      ".....#yYy#y#....",
      "....#yYy#yYy#...",
      "...#yYy#yYy#....",
      "....#y#yYy#.....",
      ".....#yYy#......",
      "....#yYy#.......",
      "...#yYy#........",
      "....#y#.........",
      ".....#G#........",
      ".....#G#........",
      "......#G#.......",
      "......#G#.......",
      ".......#G#......",
      "........##......"
    ],
    ore_iron: [
      "................",
      ".....######.....",
      "...##hhhhhh##...",
      "..#hhhhssssshh#.",
      ".#hhhsssssssssh#",
      ".#hhss##sss##sh#",
      "#hhss#..#s#..#sh",
      "#hhss#..#s#..#sh",
      "#hssss##sss##ss#",
      "#hsssssssssssss#",
      ".#hsssssssssssh#",
      ".#hhssssssssssh#",
      "..#hhhsssssshh#.",
      "...##hhhhhh##...",
      ".....######.....",
      "................"
    ],
    ore_gold: [
      "................",
      ".....######.....",
      "...##yyyyyy##...",
      "..#yyyyGGGGGyy#.",
      ".#yyyGGGGGGGGGy#",
      ".#yyGG##GGG##Gy#",
      "#yyGG#..#G#..#Gy",
      "#yyGG#..#G#..#Gy",
      "#yGGGG##GGG##GG#",
      "#yGGGGGGGGGGGGG#",
      ".#yGGGGGGGGGGGy#",
      ".#yyGGGGGGGGGGy#",
      "..#yyyGGGGGGyy#.",
      "...##yyyyyy##...",
      ".....######.....",
      "................"
    ],
    gem_ruby: [
      "......####......",
      "....##eeRR##....",
      "...#eeeRRRRR#...",
      "..#eeeeRRRRRR#..",
      ".#weeeeRRRRRRR#.",
      ".#wweeeRRRRRRR#.",
      ".#wwweeRRRRRRR#.",
      "..#weeRRRRRRR#..",
      "...#eRRRRRRR#...",
      "....#RRRRRR#....",
      ".....#RRRR#.....",
      "......#RR#......",
      ".......##.......",
      "................",
      "................",
      "................"
    ],
    gem_sapphire: [
      "......####......",
      "....##ccBB##....",
      "...#cccBBBBB#...",
      "..#ccccBBBBBB#..",
      ".#wccccBBBBBBB#.",
      ".#wwcccBBBBBBB#.",
      ".#wwwccBBBBBBB#.",
      "..#wccBBBBBBB#..",
      "...#cBBBBBBB#...",
      "....#BBBBBB#....",
      ".....#BBBB#.....",
      "......#BB#......",
      ".......##.......",
      "................",
      "................",
      "................"
    ],
    item_wood: [
      "................",
      "....########....",
      "..##OOOOOOOO##..",
      ".#OOOOOOOOOOOO#.",
      ".#OOooOOooOOOO#.",
      "#OOo..o..oOOOOO#",
      "#OOo..o..oOOOOO#",
      "#OOOooOOooOOOOO#",
      "#OOOOOOOOOOOOOO#",
      ".#OOOOOOOOOOOO#.",
      "..##OOOOOOOO##..",
      "....########....",
      "................",
      "................",
      "................",
      "................"
    ],

    // ------------------------------------------------------------------------
    // [5] Fish & Marine Catches (물고기, 황금 잉어, 심해어)
    // ------------------------------------------------------------------------
    fish_salmon: [
      "................",
      "..........##....",
      "........##cc#...",
      ".......#ccBB#...",
      "......#wccBB#...",
      "....##wccBB##...",
      "..##ReeRBB##.#..",
      ".#ReeeeeR##..##.",
      "#ReeeeeeR#....##",
      ".#ReeeeeR##..##.",
      "..##ReeRBB##.#..",
      "....##sccBB##...",
      "......#sccBB#...",
      ".......#ccBB#...",
      "........##cc#...",
      "..........##...."
    ],
    fish_golden_koi: [
      "................",
      "..........##....",
      "........##yy#...",
      ".......#yyGG#...",
      "......#wyyGG#...",
      "....##wyyGG##...",
      "..##yYYyGG##.#..",
      ".#yYYYYyG##..##.",
      "#yYYYYYyG#....##",
      ".#yYYYYyG##..##.",
      "..##yYYyGG##.#..",
      "....##syyGG##...",
      "......#syyGG#...",
      ".......#yyGG#...",
      "........##yy#...",
      "..........##...."
    ],

    // ------------------------------------------------------------------------
    // [6] Scrolls & Artifacts (주문서, 고대 유물, 룬)
    // ------------------------------------------------------------------------
    scroll_magic: [
      "....########....",
      "...#TTTTTTTT#...",
      "..#TTTTTTTTTT#..",
      ".#TT..#c#...TT#.",
      "#TT..#cCc#...TT#",
      "#TT...#c#....TT#",
      "#TT..........TT#",
      "#TT..#vvv#...TT#",
      "#TT.#vvvvv#..TT#",
      "#TT..#vvv#...TT#",
      "#TT..........TT#",
      ".#TT........TT#.",
      "..#TTTTTTTTTT#..",
      "...#TTTTTTTT#...",
      "....########....",
      "................"
    ]
  };

  // Cache of offscreen canvases & DataURLs
  const canvasCache = {};
  const dataUrlCache = {};

  function bakeItemCanvas(key, matrix, scale = 2) {
    const w = matrix[0].length;
    const h = matrix.length;
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < h; y++) {
      const row = matrix[y];
      for (let x = 0; x < w; x++) {
        const char = row[x];
        const color = IPAL[char];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    return canvas;
  }

  // Pre-bake all items
  for (const [key, matrix] of Object.entries(RAW_ITEMS)) {
    const cvs = bakeItemCanvas(key, matrix, 2); // 32x32 standard icon
    canvasCache[key] = cvs;
    try {
      dataUrlCache[key] = cvs.toDataURL('image/png');
    } catch (e) {
      // Node or headless fallback
    }
  }

  // Helper to map item/trade/recipe IDs to pixel sprite keys
  const ITEM_MAP = {
    // Weapons
    weapon: 'sword_steel',
    weapons: 'sword_steel',
    sword: 'sword_steel',
    steel_sword: 'sword_steel',
    flame_sword: 'sword_flame',
    excalibur: 'sword_excalibur',
    battle_axe: 'axe_battle',
    axe: 'axe_battle',
    arcane_staff: 'staff_arcane',
    staff: 'staff_arcane',
    bow: 'bow_elven',
    elven_bow: 'bow_elven',

    // Armor & Defense
    shield: 'shield_iron',
    iron_shield: 'shield_iron',
    dragon_shield: 'shield_dragon',
    armor: 'armor_plate',
    plate_armor: 'armor_plate',
    crown: 'crown_royal',

    // Potions
    potion: 'potion_red',
    health_potion: 'potion_red',
    hp_potion: 'potion_red',
    mana_potion: 'potion_blue',
    elixir: 'potion_gold',

    // Resources & Ores
    wheat: 'crop_wheat',
    crops: 'crop_wheat',
    wood: 'item_wood',
    lumber: 'item_wood',
    ore: 'ore_iron',
    iron_ore: 'ore_iron',
    gold_ore: 'ore_gold',
    gem: 'gem_ruby',
    gems: 'gem_ruby',
    ruby: 'gem_ruby',
    sapphire: 'gem_sapphire',
    magic_core: 'gem_sapphire',

    // Fish
    fish: 'fish_salmon',
    salmon: 'fish_salmon',
    golden_koi: 'fish_golden_koi',

    // Magic & Misc
    scroll: 'scroll_magic',
    spices: 'potion_gold',
    herbs: 'potion_blue'
  };

  const PixelItems = {
    draw(ctx, itemKey, x, y, width = 32, height = 32) {
      const realKey = ITEM_MAP[itemKey] || itemKey;
      const cvs = canvasCache[realKey] || canvasCache.sword_steel;
      if (cvs) {
        ctx.drawImage(cvs, x, y, width, height);
      }
    },

    getDataUrl(itemKey) {
      const realKey = ITEM_MAP[itemKey] || itemKey;
      return dataUrlCache[realKey] || dataUrlCache.sword_steel || '';
    },

    getCanvas(itemKey) {
      const realKey = ITEM_MAP[itemKey] || itemKey;
      return canvasCache[realKey] || canvasCache.sword_steel;
    }
  };

  window.PixelItems = PixelItems;
})(typeof window !== 'undefined' ? window : global);
