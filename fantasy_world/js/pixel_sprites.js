// ============================================================================
// pixel_sprites.js - Master RPG Pixel Art Engine (32x32 & 24x24 & 16x16)
// 4-Directional Facing (Down, Up, Left, Right), Multi-Frame Walk Cycles,
// Action & Combat Attack Motions, Recoil Stagger, Dynamic Weapon & Shield Overlays,
// Offscreen Canvas Caching & 8x8 Ecology Status Balloons
// ============================================================================

(function(window) {
  'use strict';

  // 1. 공통 1글자 정밀 마스터 팔레트 (Single-Char Precision Palette)
  const PALETTE = {
    '.': null,                     // 투명 (Transparent)
    '#': '#0b0f19',                // 외곽선 1px 다크 콘투어 (Dark Slate Contour)
    'k': '#1e293b',                // 심연 암영 (Deep Slate Shadow)
    's': '#475569',                // 강철/의복 그림자 (Dark Steel / Slate)
    'm': '#94a3b8',                // 강철/무기 기본 (Mid Steel / Silver)
    'h': '#e2e8f0',                // 강철 하이라이트 (Bright Steel / White Silver)
    'w': '#ffffff',                // 순백 광택 / 눈 흰자 (Pure White Shine)
    'f': '#fed7aa',                // 피부 기본 (Flesh Tone)
    'F': '#ea580c',                // 피부 음영 (Flesh Shadow)
    'd': '#9a3412',                // 짙은 피부 그림자 / 적갈색 (Deep Auburn)
    'r': '#991b1b',                // 진홍색 / 망토 음영 (Dark Crimson)
    'R': '#dc2626',                // 루비 / 붉은 깃털 / 망토 (Ruby Red)
    'e': '#ef4444',                // 밝은 주홍 / 안광 / 피격 (Bright Red / Glowing Eye)
    'g': '#854d0e',                // 황금 짙은 그림자 (Deep Gold Shadow)
    'G': '#ca8a04',                // 황금 음영 (Gold Shadow)
    'y': '#facc15',                // 황금빛 (Bright Gold / Blonde)
    'Y': '#fef08a',                // 연노랑 하이라이트 (Pale Gold Shine)
    'b': '#1e3a8a',                // 로열 블루 암영 (Navy Blue)
    'B': '#2563eb',                // 로열 블루 갑주/로브 (Royal Blue)
    'u': '#3b82f6',                // 밝은 블루 하이라이트 (Sky Blue)
    'c': '#0284c7',                // 비전 청록 / 마법 (Arcane Cyan)
    'C': '#38bdf8',                // 발광 청록 (Glow Cyan)
    'p': '#581c87',                // 심연 보라 암영 (Deep Purple)
    'P': '#9333ea',                // 심연 보라 / 흑마법 (Amethyst Purple)
    'v': '#c084fc',                // 비전 수정 라벤더 (Amethyst Glow)
    'D': '#14532d',                // 숲/녹색 암영 (Dark Forest Green)
    'E': '#16a34a',                // 에메랄드 녹색 / 오크 피부 (Emerald Green)
    'L': '#4ade80',                // 라임 하이라이트 / 독소 (Lime Glow)
    'o': '#451a03',                // 짙은 흑목재 / 뿔 (Dark Timber)
    'O': '#78350f',                // 가죽 갈색 / 곰 털 (Leather Brown)
    'l': '#b45309',                // 밝은 목재 / 모래빛 (Light Wood)
    't': '#fcd34d',                // 짚모자/밀짚 노랑 (Straw Yellow)
    'z': '#334155',                // 건메탈 (Gunmetal)
    'x': '#cbd5e1',                // 해골 뼈대 (Bone Slate)
    'q': '#64748b'                 // 늑대 털 / 슬레이트 (Wolf Slate)
  };

  // 2. 8x8 픽셀 생태계 상태 풍선 (Ecology Status Balloons)
  const BALLOON_SPRITES = {
    balloon_harvest: [
      "..####..",
      ".#gggg#.",
      "#gYYYYg#",
      "#gYYYYg#",
      "#gYYYYg#",
      ".#gggg#.",
      "..####..",
      "....#..."
    ],
    balloon_mine: [
      "..####..",
      ".#hssh#.",
      "#hshshh#",
      "#sOOssh#",
      "#hOOssh#",
      ".#hhhh#.",
      "..####..",
      "....#..."
    ],
    balloon_forge: [
      "..####..",
      ".#hhhh#.",
      "#hssssh#",
      "#hsRRsh#",
      "#hssssh#",
      ".#hhhh#.",
      "..####..",
      "....#..."
    ],
    balloon_fish: [
      "..####..",
      ".#BccB#.",
      "#BccccB#",
      "#BwcccB#",
      "#BccccB#",
      ".#BccB#.",
      "..####..",
      "....#..."
    ],
    balloon_sleep: [
      "..####..",
      ".#yyyy#.",
      "#yYYYYy#",
      "#yyYyyy#",
      "#yYYYYy#",
      ".#yyyy#.",
      "..####..",
      "....#..."
    ],
    balloon_combat: [
      "..####..",
      ".#eeee#.",
      "#ewhhwe#",
      "#eRhhRe#",
      "#ewhhwe#",
      ".#eeee#.",
      "..####..",
      "....#..."
    ],
    balloon_beer: [
      "..####..",
      ".#wwww#.",
      "#wYYYYw#",
      "#wYYYYw#",
      "#wYYYYw#",
      ".#OOOO#.",
      "..####..",
      "....#..."
    ],
    balloon_music: [
      "..####..",
      ".#vvvv#.",
      "#vvCCvv#",
      "#vvCvvv#",
      "#vCCvvv#",
      ".#vvvv#.",
      "..####..",
      "....#..."
    ],
    balloon_alert: [
      "..####..",
      ".#eeee#.",
      "#eeRRee#",
      "#eeRRee#",
      "#ee..ee#",
      ".#eRRe#.",
      "..####..",
      "....#..."
    ],
    balloon_heart: [
      "..####..",
      ".#eeee#.",
      "#eReeRe#",
      "#eReeeRe#",
      "#eRReRRe#",
      ".#eeee#.",
      "..####..",
      "....#..."
    ]
  };

  // 3. 4방향 & 멀티프레임 원형 스프라이트 데이터 (Raw Sprite Matrices)
  const RAW_SPRITES = {
    // ------------------------------------------------------------------------
    // [A] 플레이어 영웅 (Hero - Down / Up / Side / Attack)
    // ------------------------------------------------------------------------
    hero_down_0: [
      "......########......",
      ".....#yYYYYYYy#.....",
      "....#yYyYYYYyYy#....",
      "....#yYyYYYYyYy#....",
      "....#F#ffffff#F#....",
      "....#f#ff##ff#f#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      "....#RR######RR#....",
      "...#RRbBBBBBBbRR#...",
      "..#RR#bBBBBBBb#RR#..",
      "..#RR#bYyYYyYb#RR#h.",
      "..#R#bbBBBBBBbb#R#wh",
      "..#RR#bbBBBBbb#RR#wh",
      "...##bbBBBBBBbb##Gwh",
      "...#ssss####ssss#.G#",
      "...#ssss#..#ssss#...",
      "...#hhhh#..#hhhh#...",
      "...#hhhh#..#hhhh#...",
      "....####....####...."
    ],
    hero_down_1: [
      "......########......",
      ".....#yYYYYYYy#.....",
      "....#yYyYYYYyYy#....",
      "....#yYyYYYYyYy#....",
      "....#F#ffffff#F#....",
      "....#f#ff##ff#f#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      "....#RR######RR#....",
      "...#RRbBBBBBBbRR#...",
      "..#RR#bBBBBBBb#RR#..",
      "..#RR#bYyYYyYb#RR#h.",
      "..#R#bbBBBBBBbb#R#wh",
      "..#RR#bbBBBBbb#RR#wh",
      "...##bbBBBBBBbb##Gwh",
      "..#ssss#....#ssss#G#",
      "..#ssss#....#ssss#..",
      "..#hhhh#.....#hhhh#.",
      "..#hhhh#.....#hhhh#.",
      "...####.......####.."
    ],
    hero_down_attack: [
      "......########......",
      ".....#yYYYYYYy#.....",
      "....#yYyYYYYyYy#....",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#RR######RR#..wh",
      "...#RRbBBBBBBbRR#wwh",
      "..#RR#bBBBBBBb#RRwhh",
      "..#RR#bYyYYyYb#RRwhh",
      "..#R#bbBBBBBBbb#Rwhh",
      "..#RR#bbBBBBbb#RRwhh",
      "...##bbBBBBBBbb##whh",
      "...#ssss####ssss#Gwh",
      "...#ssss#..#ssss#.G#",
      "...#hhhh#..#hhhh#...",
      "....####....####...."
    ],
    hero_up_0: [
      "......########......",
      ".....#yYYYYYYy#.....",
      "....#yYYYYYYYYy#....",
      "....#yYYYYYYYYy#....",
      "....#yYYYYYYYYy#....",
      "....#yyyYYYYyyy#....",
      "....#RRRRRRRRRR#....",
      "...#RRRRRRRRRRRR#...",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRYYRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "...##RRRRRRRRRR##...",
      "...#ssss####ssss#...",
      "...#ssss#..#ssss#...",
      "...#hhhh#..#hhhh#...",
      "...#hhhh#..#hhhh#...",
      "....####....####...."
    ],
    hero_up_1: [
      "......########......",
      ".....#yYYYYYYy#.....",
      "....#yYYYYYYYYy#....",
      "....#yYYYYYYYYy#....",
      "....#yYYYYYYYYy#....",
      "....#yyyYYYYyyy#....",
      "....#RRRRRRRRRR#....",
      "...#RRRRRRRRRRRR#...",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRYYRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "...##RRRRRRRRRR##...",
      "..#ssss#....#ssss#..",
      "..#ssss#....#ssss#..",
      "..#hhhh#.....#hhhh#.",
      "..#hhhh#.....#hhhh#.",
      "...####.......####.."
    ],
    hero_up_attack: [
      "......########...wh.",
      ".....#yYYYYYYy#.wwh.",
      "....#yYYYYYYYYy#whh.",
      "....#yYYYYYYYYy#whh.",
      "....#yYYYYYYYYy#whh.",
      "....#yyyYYYYyyy#whh.",
      "....#RRRRRRRRRR#Gwh.",
      "...#RRRRRRRRRRRR#G#.",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "..#RRRRRRYYRRRRRR#..",
      "..#RRRRRRRRRRRRRR#..",
      "...##RRRRRRRRRR##...",
      "...#ssss####ssss#...",
      "....####....####...."
    ],
    hero_side_0: [
      "......#######.......",
      ".....#yYYYYYY#......",
      "....#yYYYYYYy#......",
      "....#yYyYYYYy#......",
      "....#ffffff##.......",
      "....#ffff##f#.......",
      "....#ffffffff#......",
      "....#ffffff##.......",
      "...#RRbBBBBb#.......",
      "..#RR#bBBBBb#...wh..",
      "..#RR#bBBBBb#..wwh..",
      "..#R#bbBBBBb#..whh..",
      "..#RR#bbBBBb#..whh..",
      "...##bbBBBBb#..whh..",
      "...#ssss####...Gwh..",
      "...#ssss#.......G#..",
      "...#hhhh#...........",
      "...#hhhh#...........",
      "....####............",
      "...................."
    ],
    hero_side_1: [
      "......#######.......",
      ".....#yYYYYYY#......",
      "....#yYYYYYYy#......",
      "....#yYyYYYYy#......",
      "....#ffffff##.......",
      "....#ffff##f#.......",
      "....#ffffffff#......",
      "....#ffffff##.......",
      "...#RRbBBBBb#.......",
      "..#RR#bBBBBb#...wh..",
      "..#RR#bBBBBb#..wwh..",
      "..#R#bbBBBBb#..whh..",
      "..#RR#bbBBBb#..whh..",
      "...##bbBBBBb#..whh..",
      "....#ssss#.....Gwh..",
      "....#ssss#......G#..",
      "....#hhhh#..........",
      ".....#hhhh#.........",
      "......####..........",
      "...................."
    ],
    hero_side_attack: [
      "......#######.......",
      ".....#yYYYYYY#......",
      "....#yYYYYYYy#......",
      "....#ffffff##.......",
      "....#ffffffff#......",
      "...#RRbBBBBb########",
      "..#RR#bBBBBb#wwwhhhh",
      "..#R#bbBBBBb#wwwhhhh",
      "..#RR#bbBBBb#wwwhhhh",
      "...##bbBBBBb#GGGG###",
      "..#ssss#ssss#.......",
      "..#hhhh#hhhh#.......",
      "...####.####........",
      "....................",
      "....................",
      "...................."
    ],

    // ------------------------------------------------------------------------
    // [B] 기사단 및 고위 수호자 (Knights, Guards, Paladins, Wizards)
    // ------------------------------------------------------------------------
    knight_down_0: [
      "......####......",
      ".....#RRrr#.....",
      "....#Rkddrr#....",
      "...#hhmhhhh#....",
      "..#h#m#h#m##....",
      "..#hhsmhhhsh#...",
      "...#ssssss#.....",
      "..#bbGssGbb#....",
      ".#bb#GssG#bb#...",
      ".#f#ssssss#f#h..",
      "..#hssssssh#wh#.",
      "..#hh#ss#hh#wh#.",
      "...##ssss##.wh#.",
      "...#kk##kk#.wh#.",
      "..#hh#..#hh#G##.",
      "..####..####.##."
    ],
    knight_down_1: [
      "......####......",
      ".....#RRrr#.....",
      "....#Rkddrr#....",
      "...#hhmhhhh#....",
      "..#h#m#h#m##....",
      "..#hhsmhhhsh#...",
      "...#ssssss#.....",
      "..#bbGssGbb#....",
      ".#bb#GssG#bb#...",
      ".#f#ssssss#f#h..",
      "..#hssssssh#wh#.",
      "..#hh#ss#hh#wh#.",
      "...##ssss##.wh#.",
      "..#kk#..#kk#wh#.",
      "..#hh#...#hh#G##",
      "..####...####.##"
    ],
    knight_down_attack: [
      "......####...wh.",
      ".....#RRrr#.wwh.",
      "....#Rkddrr#whh.",
      "...#hhmhhhh#whh.",
      "..#h#m#h#m##whh.",
      "..#hhsmhhhshwhh.",
      "...#ssssss#Gwh#.",
      "..#bbGssGbb#G##.",
      ".#bb#GssG#bb#...",
      ".#f#ssssss#f#...",
      "..#hssssssh#....",
      "...##ssss##.....",
      "..#kk####kk#....",
      "..#hh#..#hh#....",
      "..####..####...."
    ],
    knight_up_0: [
      "......####......",
      ".....#RRrr#.....",
      "....#Rkddrr#....",
      "...#hhhhhhh#....",
      "..#hhhhhhhhh#...",
      "..#hhhhhhhhh#...",
      "...#ssssss#.....",
      "..#RRssssRR#....",
      ".#RR#ssss#RR#...",
      ".#RR#ssss#RR#...",
      "..#R#ssss#R#....",
      "..#RR#ss#RR#....",
      "...##ssss##.....",
      "...#kk##kk#.....",
      "..#hh#..#hh#....",
      "..####..####...."
    ],
    knight_up_1: [
      "......####......",
      ".....#RRrr#.....",
      "....#Rkddrr#....",
      "...#hhhhhhh#....",
      "..#hhhhhhhhh#...",
      "..#hhhhhhhhh#...",
      "...#ssssss#.....",
      "..#RRssssRR#....",
      ".#RR#ssss#RR#...",
      ".#RR#ssss#RR#...",
      "..#R#ssss#R#....",
      "..#RR#ss#RR#....",
      "...##ssss##.....",
      "..#kk#..#kk#....",
      "..#hh#...#hh#...",
      "..####...####..."
    ],
    knight_side_0: [
      "......####......",
      ".....#RRrr#.....",
      "....#Rkddrr#....",
      "...#hhmhhhh#....",
      "..#h#m#h#m##....",
      "..#hhsmhhhsh#...",
      "...#ssssss#.....",
      "..#bbGssGbb#wh..",
      ".#bb#GssG#bbwhh.",
      ".#f#ssssss#Gwh#.",
      "..#hssssssh#G##.",
      "...##ssss##.....",
      "...#kk##kk#.....",
      "..#hh#..#hh#....",
      "..####..####...."
    ],
    knight_side_1: [
      "......####......",
      ".....#RRrr#.....",
      "....#Rkddrr#....",
      "...#hhmhhhh#....",
      "..#h#m#h#m##....",
      "..#hhsmhhhsh#...",
      "...#ssssss#.....",
      "..#bbGssGbb#wh..",
      ".#bb#GssG#bbwhh.",
      ".#f#ssssss#Gwh#.",
      "..#hssssssh#G##.",
      "...##ssss##.....",
      "..#kk#..#kk#....",
      "..#hh#...#hh#...",
      "..####...####..."
    ],
    knight_side_attack: [
      "......####......",
      ".....#RRrr#.....",
      "....#hhmhhhh####",
      "..#h#m#h#m##whhh",
      "..#hhsmhhhshwhhh",
      "...#ssssss##whhh",
      "..#bbGssGbb#G###",
      ".#bb#GssG#bb#...",
      "..#hssssssh#....",
      "...##ssss##.....",
      "..#kk####kk#....",
      "..#hh#..#hh#....",
      "..####..####...."
    ],

    guard_down_0: [
      "......########......",
      ".....#hhhhhhhh#.....",
      "....#hhGGGGGGhh#....",
      "....#hh#GG##GGhh#...",
      "....#GGGGGGGGGG#....",
      "....#hh#GG##GGhh#...",
      "....#Rh#hhhhhh#h#...",
      "...#Rhb#mmmmmm#bRh#.",
      "..#Rhb#bmmmmmmb#bRh#",
      "..#Rhb#bmmmmmmb#bRh#",
      "..#Rh#bbmmmmmmbb#Rh#",
      "...##bbmmmmmmbb##.O.",
      "...#ssss####ssss#.O.",
      "...#ssss#..#ssss#.O.",
      "...#hhhh#..#hhhh#.O.",
      "....####....####..#."
    ],
    guard_down_1: [
      "......########......",
      ".....#hhhhhhhh#.....",
      "....#hhGGGGGGhh#....",
      "....#hh#GG##GGhh#...",
      "....#GGGGGGGGGG#....",
      "....#hh#GG##GGhh#...",
      "....#Rh#hhhhhh#h#...",
      "...#Rhb#mmmmmm#bRh#.",
      "..#Rhb#bmmmmmmb#bRh#",
      "..#Rhb#bmmmmmmb#bRh#",
      "..#Rh#bbmmmmmmbb#Rh#",
      "...##bbmmmmmmbb##.O.",
      "..#ssss#....#ssss#O.",
      "..#ssss#....#ssss#O.",
      "..#hhhh#.....#hhhhO.",
      "...####.......####.#"
    ],
    guard_attack: [
      "......########...wh.",
      ".....#hhhhhhhh#.wwh.",
      "....#hhGGGGGGhh#whh.",
      "....#GGGGGGGGGG#whh.",
      "....#Rh#hhhhhh#hwhh.",
      "...#Rhb#mmmmmm#bRh#.",
      "..#Rhb#bmmmmmmb#bRh#",
      "..#Rh#bbmmmmmmbb#Rh#",
      "...##bbmmmmmmbb##.O.",
      "...#ssss####ssss#.O.",
      "...#hhhh#..#hhhh#.O.",
      "....####....####..#."
    ],

    paladin_down_0: [
      ".....######.....",
      "....#hhhhhh#....",
      "...#hhGGGGhh#...",
      "...#hh#GG#hh#...",
      "...#GGGGGGGG#...",
      "...#hh#GG#hh#...",
      "....#hhhhhh#....",
      "..#h#hhhhhh#h#h.",
      ".#Rh#hhmmhh#hR#h",
      ".#Rh#hhsshh#hR#h",
      ".#Rh#hhhhhh#hR#h",
      "..#G#hhsshh#G##.",
      "...##hhhhhh##.x.",
      "...#kk##kk#...x.",
      "..#hh#..#hh#..x.",
      "..####..####..x."
    ],
    paladin_down_1: [
      ".....######.....",
      "....#hhhhhh#....",
      "...#hhGGGGhh#...",
      "...#hh#GG#hh#...",
      "...#GGGGGGGG#...",
      "...#hh#GG#hh#...",
      "....#hhhhhh#....",
      "..#h#hhhhhh#h#h.",
      ".#Rh#hhmmhh#hR#h",
      ".#Rh#hhsshh#hR#h",
      ".#Rh#hhhhhh#hR#h",
      "..#G#hhsshh#G##.",
      "...##hhhhhh##.x.",
      "..#kk#..#kk#..x.",
      "..#hh#...#hh#.x.",
      "..####...####.x."
    ],
    paladin_attack: [
      ".....######..#Y.",
      "....#hhhhhh##YY.",
      "...#hhGGGGhh#YY.",
      "...#GGGGGGGG#YY.",
      "....#hhhhhh#gYY.",
      "..#h#hhhhhh#hgY.",
      ".#Rh#hhmmhh#hR#g",
      ".#Rh#hhhhhh#hR#.",
      "..#G#hhsshh#G##.",
      "...##hhhhhh##...",
      "..#kk####kk#....",
      "..#hh#..#hh#....",
      "..####..####...."
    ],

    wizard_down_0: [
      ".....######.....",
      "....#pppppp#....",
      "...#ppPPPPpp#...",
      "...#pp#PP#pp#...",
      "...#p#ffff#p#...",
      "...#ffffffff#...",
      "....#ffffff#....",
      "...#pp####pp#...",
      "..#ppbBBBBbpp#..",
      ".#pp#bBBBBb#pp#.",
      ".#f#bbBBBBbb#f#.",
      "..#p#bBBBBb#p#..",
      "...##bbBBbb##...",
      "...#pppppppp#...",
      "..#ppp#..#ppp#..",
      "..####....####.."
    ],
    wizard_down_1: [
      ".....######.....",
      "....#pppppp#....",
      "...#ppPPPPpp#...",
      "...#pp#PP#pp#...",
      "...#p#ffff#p#...",
      "...#ffffffff#...",
      "....#ffffff#....",
      "...#pp####pp#...",
      "..#ppbBBBBbpp#..",
      ".#pp#bBBBBb#pp#.",
      ".#f#bbBBBBbb#f#.",
      "..#p#bBBBBb#p#..",
      "...##bbBBbb##...",
      "...#pppppppp#...",
      ".#ppp#....#ppp#.",
      ".####......####."
    ],
    wizard_attack: [
      ".....######...#C",
      "....#pppppp#.vCC",
      "...#ppPPPPpp#vCC",
      "...#ffffffff#vCC",
      "....#ffffff##vCC",
      "...#pp####pp#PvC",
      "..#ppbBBBBbpp#P#",
      ".#f#bbBBBBbb#f#.",
      "...##bbBBbb##...",
      "...#pppppppp#...",
      "..#ppp####ppp#..",
      "..####....####.."
    ],

    // ------------------------------------------------------------------------
    // [C] 주민 직업군 (Ecology Professions & Action Motions)
    // ------------------------------------------------------------------------
    farmer_down_0: [
      "......########......",
      "....##tttttttt##....",
      "...#tttttttttttt#...",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      ".....#O######O#.....",
      "....#ObBBBBBBbO#....",
      "...#Ob#bBBBBb#bO#...",
      "...#Ob#bBBBBb#bO#...",
      "...#O#bbBBBBbb#O#...",
      "....##bbBBBBbb##.O..",
      "....#ssss##ssss#.O..",
      "...#ssss#..#ssss#O..",
      "...#OOOO#..#OOOO#h..",
      "....####....####...."
    ],
    farmer_down_1: [
      "......########......",
      "....##tttttttt##....",
      "...#tttttttttttt#...",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      ".....#O######O#.....",
      "....#ObBBBBBBbO#....",
      "...#Ob#bBBBBb#bO#...",
      "...#Ob#bBBBBb#bO#...",
      "...#O#bbBBBBbb#O#...",
      "....##bbBBBBbb##.O..",
      "...#ssss#..#ssss#O..",
      "..#ssss#....#ssss#O.",
      "..#OOOO#....#OOOO#h.",
      "...####......####..."
    ],
    farmer_action: [
      "......########......",
      "....##tttttttt##....",
      "...#tttttttttttt#...",
      "....#ffffffffff#....",
      ".....#O######O#..h..",
      "....#ObBBBBBBbO#hh..",
      "...#Ob#bBBBBb#bOh...",
      "...#O#bbBBBBbb#O#...",
      "....##bbBBBBbb##....",
      "....#ssss##ssss#....",
      "...#OOOO#..#OOOO#...",
      "....####....####...."
    ],

    miner_down_0: [
      "......########......",
      ".....#zzzzzzzz#.....",
      "....#zzzzYYYYzz#....",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      ".....#O######O#..h..",
      "....#ObOOOOOObO#whh.",
      "...#Ob#bOOOOd#bO#shh",
      "...#Ob#bOOOOd#bO#sh.",
      "...#O#bbOOOOdd#O#O..",
      "....##bbOOOOdd##.O..",
      "....#ssss##ssss#.O..",
      "...#ssss#..#ssss#O..",
      "...#zzzz#..#zzzz#...",
      "....####....####...."
    ],
    miner_down_1: [
      "......########......",
      ".....#zzzzzzzz#.....",
      "....#zzzzYYYYzz#....",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      ".....#O######O#..h..",
      "....#ObOOOOOObO#whh.",
      "...#Ob#bOOOOd#bO#shh",
      "...#Ob#bOOOOd#bO#sh.",
      "...#O#bbOOOOdd#O#O..",
      "....##bbOOOOdd##.O..",
      "...#ssss#..#ssss#.O.",
      "..#ssss#....#ssss#O.",
      "..#zzzz#....#zzzz#..",
      "...####......####..."
    ],
    miner_action: [
      "......########......",
      ".....#zzzzzzzz#..shh",
      "....#zzzzYYYYzz#wshh",
      "....#ffffffffff#sh..",
      ".....#O######O#O#...",
      "....#ObOOOOOObO#....",
      "...#O#bbOOOOdd#O#...",
      "....##bbOOOOdd##....",
      "....#ssss##ssss#....",
      "...#zzzz#..#zzzz#...",
      "....####....####...."
    ],

    blacksmith_down_0: [
      "......########......",
      ".....#oooooooo#.....",
      "....#oooofffooo#....",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#ffffffffff#....",
      "....#dddddddddd#....",
      ".....#O######O#..hh.",
      "....#ObOOOOOObO#whhh",
      "...#Ob#bOOOOd#bO#msh",
      "...#Ob#bOOOOd#bO#O##",
      "...#O#bbOOOOdd#O#O..",
      "....##bbOOOOdd##.O..",
      "....#ssss##ssss#.O..",
      "...#ssss#..#ssss#...",
      "....####....####...."
    ],
    blacksmith_down_1: [
      "......########......",
      ".....#oooooooo#.....",
      "....#oooofffooo#....",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#ffffffffff#....",
      "....#dddddddddd#....",
      ".....#O######O#..hh.",
      "....#ObOOOOOObO#whhh",
      "...#Ob#bOOOOd#bO#msh",
      "...#Ob#bOOOOd#bO#O##",
      "...#O#bbOOOOdd#O#O..",
      "....##bbOOOOdd##.O..",
      "...#ssss#..#ssss#.O.",
      "..#ssss#....#ssss#..",
      "...####......####..."
    ],
    blacksmith_action: [
      "......########..whhh",
      ".....#oooooooo#..msh",
      "....#ffffffffff#.O##",
      "....#dddddddddd#O#..",
      ".....#O######O#O#...",
      "....#ObOOOOOObO#....",
      "...#O#bbOOOOdd#O#...",
      "....##bbOOOOdd##....",
      "....#ssss##ssss#....",
      "...#ssss#..#ssss#...",
      "....####....####...."
    ],

    fisherman_down_0: [
      "......########......",
      ".....#cccccccc#.....",
      "....#cCCcccccc#.....",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      ".....#O######O#..c..",
      "....#ObccccccbO#.c..",
      "...#Ob#bccccd#bO#c..",
      "...#Ob#bccccd#bO#c..",
      "...#O#bbccccdd#O#O..",
      "....##bbccccdd##.O..",
      "....#ssss##ssss#.O..",
      "...#ssss#..#ssss#O..",
      "...#cccc#..#cccc#...",
      "....####....####...."
    ],
    fisherman_down_1: [
      "......########......",
      ".....#cccccccc#.....",
      "....#cCCcccccc#.....",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      ".....#O######O#..c..",
      "....#ObccccccbO#.c..",
      "...#Ob#bccccd#bO#c..",
      "...#Ob#bccccd#bO#c..",
      "...#O#bbccccdd#O#O..",
      "....##bbccccdd##.O..",
      "...#ssss#..#ssss#.O.",
      "..#ssss#....#ssss#O.",
      "..#cccc#....#cccc#..",
      "...####......####..."
    ],
    fisherman_action: [
      "......########...c..",
      ".....#cccccccc#..c..",
      "....#cCCcccccc#..c..",
      "....#ffffffffff#.c..",
      ".....#O######O#..c..",
      "....#ObccccccbO#.c..",
      "...#O#bbccccdd#O#O..",
      "....##bbccccdd##.O..",
      "....#ssss##ssss#....",
      "...#cccc#..#cccc#...",
      "....####....####...."
    ],

    bard_down_0: [
      "......########......",
      "....##vvvvvvvv##....",
      "...#vvPPvvvvPPvv#...",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      ".....#P######P#.....",
      "....#PbPPPPPPbP#....",
      "...#Pb#bPPPPd#bP#.O.",
      "...#Pb#bPPPPd#bP#OO.",
      "...#P#bbPPPPdd#P#OO.",
      "....##bbPPPPdd##.O..",
      "....#ssss##ssss#.O..",
      "...#ssss#..#ssss#...",
      "...#vvvv#..#vvvv#...",
      "....####....####...."
    ],
    bard_down_1: [
      "......########......",
      "....##vvvvvvvv##....",
      "...#vvPPvvvvPPvv#...",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      ".....#P######P#.....",
      "....#PbPPPPPPbP#....",
      "...#Pb#bPPPPd#bP#.O.",
      "...#Pb#bPPPPd#bP#OO.",
      "...#P#bbPPPPdd#P#OO.",
      "....##bbPPPPdd##.O..",
      "...#ssss#..#ssss#.O.",
      "..#ssss#....#ssss#..",
      "..#vvvv#....#vvvv#..",
      "...####......####..."
    ],
    bard_action: [
      "......########...v..",
      "....##vvvvvvvv##.vv.",
      "...#vvPPvvvvPPvv#vv.",
      "....#ffffffffff#.v..",
      ".....#P######P#.OO..",
      "....#PbPPPPPPbP#OO..",
      "...#P#bbPPPPdd#P#O..",
      "....##bbPPPPdd##....",
      "....#ssss##ssss#....",
      "...#vvvv#..#vvvv#...",
      "....####....####...."
    ],

    king_down_0: [
      "....########....",
      "...#yYYYYYYy#...",
      "..#yYyYYYYyYy#..",
      "..#F#ffffff#F#..",
      "..#ffffffffff#..",
      "..#ffffffddff#..",
      "..#dddddddddd#..",
      ".#RR#RRRRRR#RR#.",
      ".#RR#RyyyyR#RR#.",
      ".#RR#RyyyyR#RR#.",
      ".#RR#RRRRRR#RR#.",
      "..##RRRRRRRR##..",
      "...#ssssssss#...",
      "..#hhhh##hhhh#..",
      "..####....####..",
      "................"
    ],
    king_down_1: [
      "....########....",
      "...#yYYYYYYy#...",
      "..#yYyYYYYyYy#..",
      "..#F#ffffff#F#..",
      "..#ffffffffff#..",
      "..#ffffffddff#..",
      "..#dddddddddd#..",
      ".#RR#RRRRRR#RR#.",
      ".#RR#RyyyyR#RR#.",
      ".#RR#RyyyyR#RR#.",
      ".#RR#RRRRRR#RR#.",
      "..##RRRRRRRR##..",
      "...#ssssssss#...",
      ".#hhhh#..#hhhh#.",
      ".####......####.",
      "................"
    ],

    elf_down_0: [
      ".....######.....",
      "....#yYYYYy#....",
      "...#yYYYYYYy#...",
      "...#f#ffff#f#...",
      "..#ff#ff##ff#...",
      "..#ffffffff#....",
      "...#ffffff#.....",
      "..#DD####DD#....",
      ".#DD#EEEE#DD#...",
      ".#f#DDLLDD#f#...",
      "..#DDDDDDDD#....",
      "...##DDDD##.....",
      "...#oooooo#.....",
      "..#oo#..#oo#....",
      "..####..####....",
      "................"
    ],
    elf_down_1: [
      ".....######.....",
      "....#yYYYYy#....",
      "...#yYYYYYYy#...",
      "...#f#ffff#f#...",
      "..#ff#ff##ff#...",
      "..#ffffffff#....",
      "...#ffffff#.....",
      "..#DD####DD#....",
      ".#DD#EEEE#DD#...",
      ".#f#DDLLDD#f#...",
      "..#DDDDDDDD#....",
      "...##DDDD##.....",
      "...#oooooo#.....",
      ".#oo#....#oo#...",
      ".####....####...",
      "................"
    ],
    elf_attack: [
      ".....######.....",
      "....#yYYYYy#....",
      "...#yYYYYYYy#...",
      "..#ffffffff#....",
      "..#DD####DD#.#l.",
      ".#DD#EEEE#DD##l.",
      ".#f#DDLLDD#f#ll.",
      "..#DDDDDDDD#llh.",
      "...##DDDD##..#l.",
      "...#oooooo#..#l.",
      "..#oo####oo#....",
      "..####..####...."
    ],

    dwarf_down_0: [
      "....########....",
      "...#zzzzzzzz#...",
      "...#zzhhhhzz#...",
      "..#F#ffffff#F#..",
      "..#ffffffffff#..",
      "..#dddddddddd#..",
      "..#dddddddddd#..",
      ".#ss#ssssss#ss#.",
      ".#ss#sGssGs#ss#.",
      ".#ss#sGGGGs#ss#.",
      "..##ssssssss##..",
      "...#ssssssss#...",
      "...#kk####kk#...",
      "..#hh#....#hh#..",
      "..####....####..",
      "................"
    ],
    dwarf_down_1: [
      "....########....",
      "...#zzzzzzzz#...",
      "...#zzhhhhzz#...",
      "..#F#ffffff#F#..",
      "..#ffffffffff#..",
      "..#dddddddddd#..",
      "..#dddddddddd#..",
      ".#ss#ssssss#ss#.",
      ".#ss#sGssGs#ss#.",
      ".#ss#sGGGGs#ss#.",
      "..##ssssssss##..",
      "...#ssssssss#...",
      "..#kk#....#kk#..",
      "..#hh#....#hh#..",
      "..####....####..",
      "................"
    ],
    dwarf_attack: [
      "....########.whh",
      "...#zzzzzzzz#whh",
      "...#zzhhhhzz#whh",
      "..#dddddddddd##.",
      ".#ss#ssssss#ss#.",
      ".#ss#sGGGGs#ss#.",
      "..##ssssssss##..",
      "...#ssssssss#...",
      "..#kk####kk#....",
      "..#hh#..#hh#....",
      "..####..####...."
    ],

    // ------------------------------------------------------------------------
    // [D] 몬스터 & 보스 (Monsters: Walk cycles, Attacks, Recoil)
    // ------------------------------------------------------------------------
    // 1. 오크 전사 (Orc Warrior - Heavy Dual Axe Cleave)
    orc_down_0: [
      "....########....",
      "..##DEEEDEED##..",
      ".#EE#ffffff#EE#.",
      "#EE#feffffef#EE#",
      "#EE#fffffffff#EE",
      ".#EE#ffffff#EE#.",
      "..##F#ffff#F##..",
      "..#s#ssssss#s#..",
      ".#ss#s#ss#s#ss#.",
      ".#ss#ssssss#ss#.",
      "..##ssssssss##..",
      "...#ssssssss#...",
      "...#kk####kk#...",
      "..#hh#....#hh#..",
      "..####....####..",
      "................"
    ],
    orc_down_1: [
      "....########....",
      "..##DEEEDEED##..",
      ".#EE#ffffff#EE#.",
      "#EE#feffffef#EE#",
      "#EE#fffffffff#EE",
      ".#EE#ffffff#EE#.",
      "..##F#ffff#F##..",
      "..#s#ssssss#s#..",
      ".#ss#s#ss#s#ss#.",
      ".#ss#ssssss#ss#.",
      "..##ssssssss##..",
      "...#ssssssss#...",
      "..#kk#....#kk#..",
      "..#hh#....#hh#..",
      "..####....####..",
      "................"
    ],
    orc_attack: [
      "....########.whh",
      "..##DEEEDEED#whh",
      ".#EE#ffffff#Ewhh",
      "#EE#feffffef#msh",
      "#EE#fffffffff#O#",
      "..##F#ffff#F##O#",
      "..#s#ssssss#s#O#",
      ".#ss#ssssss#ss##",
      "..##ssssssss##..",
      "...#ssssssss#...",
      "..#kk####kk#....",
      "..#hh#..#hh#....",
      "..####..####...."
    ],

    // 2. 스켈레톤 (Skeleton Warrior - Bone Sword Thrust)
    skeleton_down_0: [
      ".....######.....",
      "....#xxxxxx#....",
      "...#xxkkkkxx#...",
      "...#x#ee##ex#...",
      "...#xkkkkkkx#...",
      "....#xkhhkx#....",
      ".....#xxxx#.....",
      "....##ssss##....",
      "...#x#ssss#x#...",
      "..#xx#smmms#xx#.",
      "..#xx#smmms#xx#.",
      "...##ssssss##...",
      "....#x#..#x#....",
      "...#xx#..#xx#...",
      "...#xx#..#xx#...",
      "...###....###..."
    ],
    skeleton_down_1: [
      ".....######.....",
      "....#xxxxxx#....",
      "...#xxkkkkxx#...",
      "...#x#ee##ex#...",
      "...#xkkkkkkx#...",
      "....#xkhhkx#....",
      ".....#xxxx#.....",
      "....##ssss##....",
      "...#x#ssss#x#...",
      "..#xx#smmms#xx#.",
      "..#xx#smmms#xx#.",
      "...##ssssss##...",
      "...#x#....#x#...",
      "..#xx#....#xx#..",
      "..#xx#....#xx#..",
      "..###......###.."
    ],
    skeleton_attack: [
      ".....######.....",
      "....#xxxxxx#....",
      "...#xxkkkkxx#...",
      "...#x#ee##ex#...",
      "....#xkhhkx#....",
      "....##ssss##.whh",
      "...#x#ssss#x#whh",
      "..#xx#smmms#xwhh",
      "...##ssssss##G##",
      "....#x####x#....",
      "...#xx#..#xx#...",
      "...###....###..."
    ],

    // 3. 고블린 도적 (Goblin Rogue - Poison Dagger Flurry)
    goblin_down_0: [
      "....########....",
      "..##LEEEEEEL##..",
      ".#LE#effffe#EL#.",
      "#LE#effffff#eEL#",
      "#LE#effffff#eEL#",
      "#EE#ffffffff#EE#",
      ".##fffffffff##..",
      "..#f#ffffff#f#..",
      "..#o#oooooo#o#..",
      ".#oo#o#oo#o#oo#.",
      ".#oo#oooooo#oo#.",
      "..##oooooooo##..",
      "...#oooooooo#...",
      "...#kk####kk#...",
      "..#oo#....#oo#..",
      "..####....####.."
    ],
    goblin_down_1: [
      "....########....",
      "..##LEEEEEEL##..",
      ".#LE#effffe#EL#.",
      "#LE#effffff#eEL#",
      "#LE#effffff#eEL#",
      "#EE#ffffffff#EE#",
      ".##fffffffff##..",
      "..#f#ffffff#f#..",
      "..#o#oooooo#o#..",
      ".#oo#o#oo#o#oo#.",
      ".#oo#oooooo#oo#.",
      "..##oooooooo##..",
      "...#oooooooo#...",
      "..#kk#....#kk#..",
      "..#oo#....#oo#..",
      "..####....####.."
    ],
    goblin_attack: [
      "....########....",
      "..##LEEEEEEL##..",
      ".#LE#effffe#EL#.",
      "#EE#ffffffff#EE#",
      "..#f#ffffff#f#..",
      "..#o#oooooo#o#L.",
      ".#oo#o#oo#o#ooLL",
      "..##oooooooo##LL",
      "...#oooooooo##L#",
      "..#kk####kk#....",
      "..#oo#..#oo#....",
      "..####..####...."
    ],

    // 4. 용족 전사 (Dragonkin Warrior - Flame Greatsword Cleave)
    dragonkin_down_0: [
      "....#......#....",
      "...#y#....#y#...",
      "....#y####y#....",
      "....#yRRRRe#....",
      "...#RRRRRRRe#...",
      "...#e#ee##ef#...",
      "...#eeeeffff#...",
      "....#f##ff##....",
      ".....#R####R#...",
      "...#RRbBBbRR#...",
      "..#RR#bBBb#RR#..",
      "..#Re#bYYb#Re#F.",
      "..#e#bbBBbb#e#wh",
      "..#e#bbBBbb#e#wh",
      "...##bbBBbb##Fwh",
      "...#ssss##ssss#.",
      "...#ssss#..#ssss",
      "..#hhhh#....#hhh",
      ".#RR#........#RR",
      ".###..........##"
    ],
    dragonkin_down_1: [
      "....#......#....",
      "...#y#....#y#...",
      "....#y####y#....",
      "....#yRRRRe#....",
      "...#RRRRRRRe#...",
      "...#e#ee##ef#...",
      "...#eeeeffff#...",
      "....#f##ff##....",
      ".....#R####R#...",
      "...#RRbBBbRR#...",
      "..#RR#bBBb#RR#..",
      "..#Re#bYYb#Re#F.",
      "..#e#bbBBbb#e#wh",
      "..#e#bbBBbb#e#wh",
      "...##bbBBbb##Fwh",
      "..#ssss#..#ssss#",
      "..#ssss#..#ssss#",
      ".#hhhh#....#hhhh",
      ".#RR#........#RR",
      ".###..........##"
    ],
    dragonkin_attack: [
      "....#......#.whh",
      "...#y#....#y#Fff",
      "....#y####y#Ffr#",
      "....#yRRRRe#Ffr#",
      "...#RRRRRRRe#Ffr",
      "...#eeeeffff#Ffr",
      ".....#R####R##fr",
      "...#RRbBBbRR##fr",
      "..#e#bbBBbb#e#r#",
      "...##bbBBbb##...",
      "...#ssss##ssss#.",
      "..#hhhh#..#hhhh#",
      ".#RR#........#RR",
      ".###..........##"
    ],

    // 5. 슬라임 (Slime - Squash & Wobble & Surge)
    slime_0: [
      "................",
      "......####......",
      "....##EEEE##....",
      "...#EEEEEEEE#...",
      "..#EELLLLLLLE#..",
      ".#EELLwLLLLwLE#.",
      "#EELLwwLLLLwwLE#",
      "#EELLwwLLLLwwLE#",
      "#EEELLLLLLLLLEE#",
      "#EEELLLLLLLLLEE#",
      ".#EEEEEEEEEEEE#.",
      "..#EEEEEEEEEE#..",
      "...##EEEEEE##...",
      ".....######.....",
      "................",
      "................"
    ],
    slime_1: [
      "................",
      "................",
      ".....######.....",
      "...##EEEEEE##...",
      "..#EELLLLLLLE#..",
      ".#EELLwLLLLwLE#.",
      "#EELLwwLLLLwwLE#",
      "#EELLwwLLLLwwLE#",
      "#EEELLLLLLLLLEE#",
      "#EEEEEEEEEEEEEE#",
      ".#EEEEEEEEEEEE#.",
      "..#EEEEEEEEEE#..",
      "...##########...",
      "................",
      "................",
      "................"
    ],
    slime_attack: [
      "................",
      "......####......",
      "....##LLLL##....",
      "...#LLLLLLLL#...",
      "..#LLeLLLLeLL#..",
      ".#LLeeLLLLeeLL#.",
      "#LLLeeLLLLeeLLL#",
      "#LLLLLLLLLLLLLL#",
      "#EEEEEEEEEEEEEE#",
      ".#EEEEEEEEEEEE#.",
      "..#EEEEEEEEEE#..",
      "...##EEEEEE##...",
      ".....######.....",
      "................",
      "................",
      "................"
    ],

    // 6. 박쥐 (Cave Bat - Wing Flap Cycle)
    bat_0: [
      "................",
      "#k#..........#k#",
      "#kk#........#kk#",
      "#kkk#..##..#kkk#",
      ".#kkk##kk##kkk#.",
      "..#kkkkekeekkk#.",
      "...#kkkkkkkk#...",
      "....#kkwwkk#....",
      "...#kkkkkkkk#...",
      "..#kkk#kk#kkk#..",
      ".#kkk#....#kkk#.",
      "#kk#........#kk#",
      "##............##",
      "................",
      "................",
      "................"
    ],
    bat_1: [
      "................",
      "................",
      ".......##.......",
      ".....##kk##.....",
      "...##kkkkkk##...",
      ".##kkkkekeekkk##",
      "#kkkkkkkkkkkkkk#",
      ".##kkkkwwkkkk##.",
      "...#kkkkkkkk#...",
      "....#kk##kk#....",
      ".....#k##k#.....",
      "......####......",
      "................",
      "................",
      "................",
      "................"
    ],
    bat_attack: [
      "................",
      "#k#..........#k#",
      "#kk#..#ee#..#kk#",
      "#kkk##eeee##kkk#",
      ".#kkkkeeeekkkk#.",
      "..#kkkwewewkk#..",
      "...#kkkwwkkk#...",
      "....#kkkkkk#....",
      "...#kkk##kkk#...",
      "..#kk#....#kk#..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],

    // 7. 사신 / 언데드 군주 (Reaper - Scythe Cleave)
    reaper_0: [
      ".....######.....",
      "....#kkkkkk#....",
      "...#kRkkkkRk#...",
      "...#kkRkkRkk#...",
      "....#kkkkkk#....",
      "...#kk####kk#...",
      "..#kkk#kk#kkk#..",
      ".#kkkk#kk#kkkk#h",
      ".#kkkkk##kkkkk#h",
      "..#kkkkkkkkkk#wh",
      "...#kkkkkkkk#wwh",
      "....#kkkkkk#..sh",
      ".....#kkkk#...m#",
      "....#kk##kk#..##",
      "...#kk#..#kk#...",
      "...###....###..."
    ],
    reaper_1: [
      ".....######.....",
      "....#kkkkkk#....",
      "...#kRkkkkRk#...",
      "...#kkRkkRkk#...",
      "....#kkkkkk#....",
      "...#kk####kk#...",
      "..#kkk#kk#kkk#..",
      ".#kkkk#kk#kkkk#h",
      ".#kkkkk##kkkkk#h",
      "..#kkkkkkkkkk#wh",
      "...#kkkkkkkk#wwh",
      "....#kkkkkk#..sh",
      ".....#kkkk#...m#",
      "...#kk####kk#.##",
      "..#kk#....#kk#..",
      "..###......###.."
    ],
    reaper_attack: [
      ".....######..whh",
      "....#kkkkkk#wwwh",
      "...#keeeeeek#whh",
      "....#kkkkkk#..sh",
      "...#kk####kk#.m#",
      "..#kkk#kk#kkk###",
      ".#kkkkk##kkkkk#.",
      "..#kkkkkkkkkk#..",
      "...#kkkkkkkk#...",
      "....#kk####kk#..",
      "...#kk#....#kk#.",
      "...###......###."
    ],

    // 8. 야생 늑대 (Wolf - Quadrupedal Stride & Pounce)
    wolf_walk_0: [
      "................",
      ".......####.....",
      "......#qqqq#....",
      ".....#qqweeq#...",
      "....#qqqqwqq#...",
      "...#qqqqqqqq####",
      "..#qqqqqqqqqqqq#",
      ".#qqqqqqqqqqqqq#",
      ".#qqqqqqqqqqqqq#",
      "..#qq####qqqqq#.",
      "..#qq#..#qqqq#..",
      "..#qq#..#qqqq#..",
      "..#ss#...#ss#...",
      "..#kk#...#kk#...",
      "..####...####...",
      "................"
    ],
    wolf_walk_1: [
      "................",
      ".......####.....",
      "......#qqqq#....",
      ".....#qqweeq#...",
      "....#qqqqwqq#...",
      "...#qqqqqqqq####",
      "..#qqqqqqqqqqqq#",
      ".#qqqqqqqqqqqqq#",
      ".#qqqqqqqqqqqqq#",
      "..#qq####qqqqq#.",
      "..#qq#...#qq#...",
      "..#qq#....#qq#..",
      "..#ss#....#ss#..",
      "..#kk#....#kk#..",
      "..####....####..",
      "................"
    ],
    wolf_attack: [
      "................",
      "........####....",
      ".......#qqqq#...",
      "......#qqeeqq#..",
      ".....#qqwwwwq#..",
      "....#qqqqqqqq###",
      "..##qqqqqqqqqqq#",
      ".#qqqqqqqqqqqqq#",
      "..#qq####qqqqq#.",
      "..#ss#..#ss#....",
      "..#kk#..#kk#....",
      "..####..####....",
      "................",
      "................",
      "................",
      "................"
    ],

    // ------------------------------------------------------------------------
    // [E] 탈것 및 동물 (Mounts & Animals)
    // ------------------------------------------------------------------------
    horse_walk_0: [
      "................",
      "........#####...",
      ".......#hhhhh#..",
      "......#hwhkkkh#.",
      ".....#hhhhk#k#..",
      "....#hhhhh#.....",
      "...#hhhhhh######",
      "..#hhhhhhhhhhhh#",
      ".#hhhhhhhhhhhhh#",
      ".#hhhhhhhhhhhhh#",
      "..#hh####hhhhh#.",
      "..#hh#..#hhhh#..",
      "..#hh#..#hhhh#..",
      "..#hh#...#hh#...",
      "..#kk#...#kk#...",
      "..####...####..."
    ],
    horse_walk_1: [
      "................",
      "........#####...",
      ".......#hhhhh#..",
      "......#hwhkkkh#.",
      ".....#hhhhk#k#..",
      "....#hhhhh#.....",
      "...#hhhhhh######",
      "..#hhhhhhhhhhhh#",
      ".#hhhhhhhhhhhhh#",
      ".#hhhhhhhhhhhhh#",
      "..#hh####hhhhh#.",
      "..#hh#...#hh#...",
      "..#hh#....#hh#..",
      "..#hh#....#hh#..",
      "..#kk#....#kk#..",
      "..####....####..."
    ],

    bear_walk_0: [
      "................",
      "....##....##....",
      "...#OO#..#OO#...",
      "..#OOOO##OOOO#..",
      "..#OOOOOOOOOO#..",
      "..#OkkOOOOkkO#..",
      "..#OOOOkkOOOO#..",
      ".#OOOOOOOOOOOO#.",
      "#OOOOOOOOOOOOOO#",
      "#OOOOOOOOOOOOOO#",
      "#OOOOOOOOOOOOOO#",
      ".#OO####OO####O#",
      ".#OO#..#OO#..#O#",
      ".#OO#..#OO#..#O#",
      ".####..####..###",
      "................"
    ],
    bear_walk_1: [
      "................",
      "....##....##....",
      "...#OO#..#OO#...",
      "..#OOOO##OOOO#..",
      "..#OOOOOOOOOO#..",
      "..#OkkOOOOkkO#..",
      "..#OOOOkkOOOO#..",
      ".#OOOOOOOOOOOO#.",
      "#OOOOOOOOOOOOOO#",
      "#OOOOOOOOOOOOOO#",
      "#OOOOOOOOOOOOOO#",
      ".#OO####OO####O#",
      "..#OO#....#OO#..",
      "..#OO#....#OO#..",
      "..####....####..",
      "................"
    ],
    bear_attack: [
      "....##....##.whh",
      "...#OO#..#OO#whh",
      "..#OOOO##OOOO#wh",
      "..#OeeOOOOeeO#..",
      "..#OOOOeeOOOO#..",
      ".#OOOOOOOOOOOO#.",
      "#OOOOOOOOOOOOOO#",
      "#OOOOOOOOOOOOOO#",
      ".#OO####OO####O#",
      ".#OO#..#OO#..#O#",
      ".####..####..###",
      "................"
    ],

    deer_walk_0: [
      "....#......#....",
      "...#O#....#O#...",
      "....#O#..#O#....",
      ".....#OOOO#.....",
      "....#OlwwlO#....",
      "...#OllllllO#...",
      "....#OllllO#....",
      ".....#OOOO######",
      "....#OlllllllllO",
      "...#OllllllllllO",
      "...#OlllllllllO#",
      "....#Ol###lllO#.",
      "....#Ol#..#llO#.",
      "....#Ol#..#llO#.",
      "....#kk#..#kk#..",
      "....####..####.."
    ],
    deer_walk_1: [
      "....#......#....",
      "...#O#....#O#...",
      "....#O#..#O#....",
      ".....#OOOO#.....",
      "....#OlwwlO#....",
      "...#OllllllO#...",
      "....#OllllO#....",
      ".....#OOOO######",
      "....#OlllllllllO",
      "...#OllllllllllO",
      "...#OlllllllllO#",
      "....#Ol###lllO#.",
      "....#Ol#...#llO#",
      "...#Ol#....#llO#",
      "...#kk#....#kk#.",
      "...####....####."
    ],

    turtle_walk_0: [
      "................",
      "................",
      "................",
      ".....######.....",
      "...##DDDDDD##...",
      "..#DDDDDDDDDD#..",
      ".#DDDGDGDGDDDD#.",
      ".#DDGDGDGDGDDD#e",
      "#DDDGDGDGDDDD#ee",
      ".#DDDDDDDDDDDD#e",
      "..#DDDDDDDDDD#..",
      "...##DDDDDD##...",
      "..#DD######DD#..",
      "..####....####..",
      "................",
      "................"
    ],
    turtle_walk_1: [
      "................",
      "................",
      "................",
      ".....######.....",
      "...##DDDDDD##...",
      "..#DDDDDDDDDD#..",
      ".#DDDGDGDGDDDD#.",
      ".#DDGDGDGDGDDD#e",
      "#DDDGDGDGDDDD#ee",
      ".#DDDDDDDDDDDD#e",
      "..#DDDDDDDDDD#..",
      "...##DDDDDD##...",
      ".#DD#......#DD#.",
      ".####......####.",
      "................",
      "................"
    ],

    camel_walk_0: [
      "................",
      ".......##.......",
      "......#ll#..##..",
      ".....#llk#.#ll#.",
      "....#llll#.#ll#.",
      "...#llll######..",
      "..#lllllllllll#.",
      ".#lllllllllllll#",
      ".#lllllllllllll#",
      "..#ll####lllll#.",
      "..#ll#..#llll#..",
      "..#ll#..#llll#..",
      "..#ll#...#ll#...",
      "..#kk#...#kk#...",
      "..####...####...",
      "................"
    ],
    camel_walk_1: [
      "................",
      ".......##.......",
      "......#ll#..##..",
      ".....#llk#.#ll#.",
      "....#llll#.#ll#.",
      "...#llll######..",
      "..#lllllllllll#.",
      ".#lllllllllllll#",
      ".#lllllllllllll#",
      "..#ll####lllll#.",
      "..#ll#...#ll#...",
      "..#ll#....#ll#..",
      "..#ll#....#ll#..",
      "..#kk#....#kk#..",
      "..####....####..",
      "................"
    ]
  };

  class PixelSpriteAtlas {
    constructor() {
      this.cache = new Map();
      this.balloonCache = new Map();
      this.isReady = false;
      this.init();
    }

    init() {
      if (typeof document === 'undefined') return;

      // 1. 캐릭터, 몬스터, NPC 스프라이트 오프스크린 캔버스 캐싱
      for (const [key, rows] of Object.entries(RAW_SPRITES)) {
        this.cacheSprite(key, rows);
      }

      // 2. 8x8 생태계 상태 풍선 캐싱
      for (const [bKey, bRows] of Object.entries(BALLOON_SPRITES)) {
        this.cacheBalloon(bKey, bRows);
      }

      this.isReady = true;
    }

    cacheSprite(key, rows) {
      const h = rows.length;
      const w = rows[0].length;

      const cvNormal = document.createElement('canvas');
      cvNormal.width = w;
      cvNormal.height = h;
      const ctxNorm = cvNormal.getContext('2d');

      const cvFlipped = document.createElement('canvas');
      cvFlipped.width = w;
      cvFlipped.height = h;
      const ctxFlip = cvFlipped.getContext('2d');

      for (let r = 0; r < h; r++) {
        const rowStr = rows[r];
        for (let c = 0; c < w; c++) {
          const char = rowStr[c];
          const color = PALETTE[char];
          if (color) {
            ctxNorm.fillStyle = color;
            ctxNorm.fillRect(c, r, 1, 1);

            ctxFlip.fillStyle = color;
            ctxFlip.fillRect(w - 1 - c, r, 1, 1);
          }
        }
      }

      // 기본 키 등록
      this.cache.set(key, cvNormal);
      this.cache.set(`${key}_right`, cvNormal);
      this.cache.set(`${key}_left`, cvFlipped);
    }

    cacheBalloon(key, rows) {
      const h = rows.length;
      const w = rows[0].length;
      const cv = document.createElement('canvas');
      cv.width = w * 2;
      cv.height = h * 2;
      const ctx = cv.getContext('2d');

      for (let r = 0; r < h; r++) {
        const rowStr = rows[r];
        for (let c = 0; c < w; c++) {
          const char = rowStr[c];
          const color = PALETTE[char];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(c * 2, r * 2, 2, 2);
          }
        }
      }
      this.balloonCache.set(key, cv);
    }

    // 엔티티 베이스 스프라이트 식별
    getBaseKeyForEntity(e) {
      if (e.role === 'player') return 'hero';
      if (e.role === 'king') return 'king';
      if (e.race === 'dragonkin') return 'dragonkin';
      if (e.role === 'royal_guard' || e.role === 'guard') return 'guard';
      if (e.role === 'soldier') return 'knight';

      // 전문 직업군
      if (e.role === 'farmer') return 'farmer';
      if (e.role === 'miner') return 'miner';
      if (e.role === 'blacksmith') return 'blacksmith';
      if (e.role === 'fisherman') return 'fisherman';
      if (e.role === 'bard' || e.role === 'merchant') return 'bard';

      if (e.role === 'adventurer' || e.role === 'mercenary') {
        if (e.race === 'dwarf') return 'dwarf';
        if (e.race === 'elf') return 'elf';
        return (e.id % 2 === 0) ? 'paladin' : 'knight';
      }

      // 몬스터
      if (e.role === 'monster') {
        const name = e.name || '';
        const sub = e.subClass || '';
        if (sub.includes('언데드') || name.includes('스켈레톤') || e.homeId === 'obsidian_necropolis') {
          return e.hp > 200 ? 'reaper' : 'skeleton';
        }
        if (sub.includes('오크') || e.homeId === 'orc_stronghold') {
          return 'orc';
        }
        if (name.includes('슬라임')) return 'slime';
        if (name.includes('박쥐')) return 'bat';
        if (name.includes('사신') || name.includes('리퍼') || name.includes('망령')) return 'reaper';
        if (name.includes('늑대') || name.includes('울프')) return 'wolf';
        return 'goblin';
      }

      // 동물
      if (e.role === 'animal') {
        const at = e.animalType;
        if (at === 'horse') return 'horse';
        if (at === 'bear') return 'bear';
        if (at === 'wolf') return 'wolf';
        if (at === 'deer') return 'deer';
        if (at === 'turtle') return 'turtle';
        if (at === 'camel') return 'camel';
        return 'deer';
      }

      return 'knight';
    }

    // 엔티티 활동 상태에 맞는 풍선 반환
    getBalloonKeyForEntity(e, isNight) {
      if (e.state === 'combat' || (e.hitTimer && e.hitTimer > 0)) return 'balloon_combat';
      if (isNight && (e.role === 'farmer' || e.role === 'miner' || e.role === 'fisherman' || e.role === 'animal')) {
        return 'balloon_sleep';
      }
      if (e.role === 'farmer') return 'balloon_harvest';
      if (e.role === 'miner') return 'balloon_mine';
      if (e.role === 'blacksmith') return 'balloon_forge';
      if (e.role === 'fisherman') return 'balloon_fish';
      if (e.role === 'bard' || (isNight && e.role === 'merchant')) return 'balloon_beer';
      if (e.role === 'royal_guard' || e.role === 'guard') return 'balloon_alert';
      return null;
    }

    // 4방향 및 애니메이션 프레임에 맞는 Canvas 캐시 검색
    resolveCanvas(baseKey, dir, animFrame, isFacingLeft) {
      // 1순위: 정확한 방향 + 프레임 매칭
      let candidateKey = `${baseKey}_${dir}_${animFrame}`;
      if (isFacingLeft && (dir === 'left' || dir === 'side')) {
        candidateKey += '_left';
      }
      if (this.cache.has(candidateKey)) return this.cache.get(candidateKey);

      // 2순위: 방향_0 매칭
      const dirZeroKey = `${baseKey}_${dir}_0${isFacingLeft ? '_left' : ''}`;
      if (this.cache.has(dirZeroKey)) return this.cache.get(dirZeroKey);

      // 3순위: side / down 프레임 폴백
      if (dir === 'left' || dir === 'right') {
        const sideKey = `${baseKey}_side_${animFrame}_${isFacingLeft ? 'left' : 'right'}`;
        if (this.cache.has(sideKey)) return this.cache.get(sideKey);
        const sideZero = `${baseKey}_side_0_${isFacingLeft ? 'left' : 'right'}`;
        if (this.cache.has(sideZero)) return this.cache.get(sideZero);
      }

      // 4순위: down_0 폴백
      const downKey = `${baseKey}_down_${animFrame}`;
      if (this.cache.has(downKey)) return this.cache.get(downKey);
      const downZero = `${baseKey}_down_0`;
      if (this.cache.has(downZero)) return this.cache.get(downZero);

      // 5순위: _walk_0 또는 단일 키 폴백
      const walkKey = `${baseKey}_walk_${animFrame}_${isFacingLeft ? 'left' : 'right'}`;
      if (this.cache.has(walkKey)) return this.cache.get(walkKey);

      const singleKey = `${baseKey}_${isFacingLeft ? 'left' : 'right'}`;
      if (this.cache.has(singleKey)) return this.cache.get(singleKey);

      if (this.cache.has(baseKey)) return this.cache.get(baseKey);

      // 궁극적 기본값
      return this.cache.get('knight_down_0') || this.cache.get('knight_right') || null;
    }

    draw(ctx, e, px, py, bounce, timeSec, isNight = false) {
      const baseKey = this.getBaseKeyForEntity(e);

      // 1. 4방향 결정 (Down, Up, Left, Right)
      let dir = e.facing;
      if (!dir) {
        const vx = e.vx || 0;
        const vy = e.vy || 0;
        if (Math.abs(vy) > Math.abs(vx) && Math.abs(vy) > 0.05) {
          dir = vy > 0 ? 'down' : 'up';
        } else if (Math.abs(vx) > 0.05) {
          dir = vx > 0 ? 'right' : 'left';
        } else {
          dir = 'down';
        }
      }

      const isFacingLeft = (dir === 'left');
      const isAttacking = (e.state === 'combat') || ((e.attackCooldown || 0) > 0.25);
      const isMoving = Math.abs(e.vx || 0) > 0.08 || Math.abs(e.vy || 0) > 0.08;

      // 2. 애니메이션 프레임 산출
      let animFrame = '0';
      if (isAttacking) {
        animFrame = 'attack';
      } else if (isMoving) {
        const step = Math.floor(((e.animPhase || 0) * 1.8)) % 2;
        animFrame = step === 1 ? '1' : '0';
      } else if (e.role === 'farmer' || e.role === 'miner' || e.role === 'blacksmith' || e.role === 'fisherman' || e.role === 'bard') {
        // 주간 직업 작업 액션
        if (!isNight && Math.sin(timeSec * 2.5 + (e.id || 0)) > 0.2) {
          animFrame = 'action';
        }
      }

      // 3. 캔버스 리졸브
      const cv = this.resolveCanvas(baseKey, dir, animFrame, isFacingLeft);
      if (!cv) return;

      const sc = e.scale || 1.0;
      const sw = cv.width;
      const sh = cv.height;

      // 4. 발밑 픽셀 타원 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
      ctx.beginPath();
      ctx.ellipse(px, py + 6 * sc, 7 * sc, 3 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. 공격 돌진(Lunge) 및 피격 흔들림(Stagger) 오프셋
      let offsetX = 0;
      let offsetY = 0;

      if (isAttacking) {
        const lunge = Math.sin(timeSec * 16 + (e.id || 0)) * 4.5 * sc;
        if (dir === 'down') offsetY += Math.max(0, lunge);
        else if (dir === 'up') offsetY -= Math.max(0, lunge);
        else if (dir === 'left') offsetX -= Math.max(0, lunge);
        else if (dir === 'right') offsetX += Math.max(0, lunge);
      }

      if (e.hitTimer && e.hitTimer > 0) {
        offsetX += (Math.sin(timeSec * 45) * 3 * sc);
        offsetY += (Math.cos(timeSec * 45) * 2 * sc);
      }

      // 6. 스프라이트 블릿 (High-Res 1.5x Scaling)
      const renderW = Math.round(sw * sc * 1.5);
      const renderH = Math.round(sh * sc * 1.5);
      const renderX = Math.round(px - renderW / 2 + offsetX);
      const renderY = Math.round(py - renderH + 6 * sc - bounce + offsetY);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cv, renderX, renderY, renderW, renderH);

      // 7. 피격 플래시 이펙트 (Hit Flash Overlay)
      if (e.hitTimer && e.hitTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.38)';
        ctx.fillRect(renderX, renderY, renderW, renderH);
        ctx.restore();
      }

      // 8. 동적 무기 & 방패 오버레이 (Dynamic Weapon / Shield Hand Overlay)
      this.drawEquippedGear(ctx, e, px + offsetX, py + offsetY, bounce, dir, isAttacking, timeSec, sc);

      // 9. 생태계 상태 풍선 렌더링 (Ecology Status Balloon Float)
      const bKey = this.getBalloonKeyForEntity(e, isNight);
      if (bKey && this.balloonCache.has(bKey)) {
        const bCvs = this.balloonCache.get(bKey);
        const floatY = Math.round(Math.sin(timeSec * 3 + (e.id || 0)) * 2);
        const bx = Math.round(px - bCvs.width / 2);
        const by = Math.round(renderY - bCvs.height - 2 + floatY);
        ctx.drawImage(bCvs, bx, by);
      }
    }

    // 캐릭터 장비 무기/방패 동적 오버레이
    drawEquippedGear(ctx, e, px, py, bounce, dir, isAttacking, timeSec, sc) {
      if (!window.PixelItems) return;

      // 무기 결정
      let weaponId = null;
      let shieldId = null;

      if (e.role === 'player') {
        const rpg = (window.game && window.game.rpg) ? window.game.rpg : null;
        weaponId = (rpg && rpg.equipment && rpg.equipment.weapon) ? rpg.equipment.weapon.id : 'sword_excalibur';
        shieldId = (rpg && rpg.equipment && rpg.equipment.shield) ? rpg.equipment.shield.id : 'shield_dragon';
      } else if (e.role === 'soldier' || e.role === 'guard') {
        weaponId = 'sword_steel';
        shieldId = 'shield_iron';
      } else if (e.role === 'adventurer' || e.role === 'mercenary') {
        weaponId = (e.race === 'dwarf') ? 'axe_battle' : ((e.race === 'elf') ? 'bow_hunter' : 'sword_steel');
      } else if (e.role === 'monster') {
        if (e.name && e.name.includes('오크')) weaponId = 'axe_battle';
        else if (e.name && e.name.includes('스켈레톤')) weaponId = 'sword_steel';
        else if (e.name && e.name.includes('고블린')) weaponId = 'dagger_poison';
        else if (e.name && e.name.includes('용족')) weaponId = 'sword_flame';
      }

      if (!weaponId) return;

      const wCvs = window.PixelItems.getCanvas(weaponId);
      if (!wCvs) return;

      ctx.save();
      const isLeft = (dir === 'left');
      const sideSign = isLeft ? -1 : 1;

      // 손의 위치 기준점 (Hand anchor)
      const handX = px + sideSign * 8 * sc;
      const handY = py - 10 * sc - bounce;

      if (isAttacking) {
        // 공격 모션: 검기 호(Slash Arc) 및 무기 휘두르기 회전
        const swingProgress = (Math.sin(timeSec * 16 + (e.id || 0)) + 1) / 2;
        const swingAngle = (isLeft ? -1 : 1) * (0.8 - swingProgress * 1.8);

        ctx.translate(handX, handY);
        ctx.rotate(swingAngle);
        ctx.drawImage(wCvs, -6 * sc, -18 * sc, 18 * sc, 18 * sc);
        ctx.restore();

        // 화려한 픽셀 참격 궤적 (Slash Arc Particle Trail)
        ctx.save();
        let slashColor = '#f8fafc';
        if (weaponId.includes('flame')) slashColor = '#f97316';
        else if (weaponId.includes('excalibur')) slashColor = '#38bdf8';
        else if (weaponId.includes('poison')) slashColor = '#4ade80';

        ctx.strokeStyle = slashColor;
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        const arcCenter = px + sideSign * 4 * sc;
        const startAng = isLeft ? Math.PI * 0.7 : Math.PI * 0.3;
        const endAng = isLeft ? Math.PI * 1.3 : -Math.PI * 0.3;
        ctx.arc(arcCenter, py - 10 * sc - bounce, 16 * sc, startAng, endAng, isLeft);
        ctx.stroke();

        // 반짝이는 참격 스파크 픽셀
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(arcCenter + sideSign * 14 * sc, py - 14 * sc - bounce, 3 * sc, 3 * sc);
        ctx.fillRect(arcCenter + sideSign * 18 * sc, py - 6 * sc - bounce, 2 * sc, 2 * sc);
        ctx.restore();
      } else {
        // 대기 / 이동 모션: 자연스럽게 손에 쥐거나 옆구리에 찬 모습
        ctx.translate(handX, handY);
        if (dir === 'up') {
          // 등 뒤에 멘 검
          ctx.rotate(isLeft ? 0.4 : -0.4);
          ctx.drawImage(wCvs, -4 * sc, -14 * sc, 14 * sc, 14 * sc);
        } else {
          // 측면/정면 하향 파지
          ctx.rotate(isLeft ? -0.35 : 0.35);
          ctx.drawImage(wCvs, -4 * sc, -12 * sc, 15 * sc, 15 * sc);
        }
        ctx.restore();
      }

      // 방패 렌더링 (반대편 손)
      if (shieldId && (dir === 'down' || dir === 'left' || dir === 'right')) {
        const sCvs = window.PixelItems.getCanvas(shieldId);
        if (sCvs) {
          ctx.save();
          const shieldX = px - sideSign * 7 * sc;
          const shieldY = py - 9 * sc - bounce;
          ctx.drawImage(sCvs, shieldX - 6 * sc, shieldY - 7 * sc, 13 * sc, 13 * sc);
          ctx.restore();
        }
      }
    }
  }

  window.PixelSprites = new PixelSpriteAtlas();
})(typeof window !== 'undefined' ? window : global);
