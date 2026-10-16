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
      "....#yYyYYYYyYy#....",
      "....#F#ffffff#F#....",
      "....#f#ff##ff#f#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      "....#RR######RR#..wh",
      "...#RRbBBBBBBbRR#wwh",
      "..#RR#bBBBBBBb#RRwhh",
      "..#RR#bYyYYyYb#RRwhh",
      "..#R#bbBBBBBBbb#Rwhh",
      "..#RR#bbBBBBbb#RRwhh",
      "...##bbBBBBBBbb##Gwh",
      "...#ssss####ssss#Gwh",
      "...#ssss#..#ssss#.G#",
      "...#hhhh#..#hhhh#...",
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
      "..#RRRRRRRRRRRRRR#..",
      "...##RRRRRRRRRR##...",
      "...#ssss####ssss#...",
      "...#ssss#..#ssss#...",
      "...#hhhh#..#hhhh#...",
      "...#hhhh#..#hhhh#...",
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
      "....#yYyYYYYy#......",
      "....#ffffff##.......",
      "....#ffff##f#.......",
      "....#ffffffff#......",
      "....#ffffff##.......",
      "...#RRbBBBBb########",
      "..#RR#bBBBBb#wwwhhhh",
      "..#R#bbBBBBb#wwwhhhh",
      "..#RR#bbBBBb#wwwhhhh",
      "...##bbBBBBb#GGGG###",
      "...#ssss####........",
      "...#ssss#...........",
      "...#ssss#...........",
      "...#hhhh#...........",
      "...#hhhh#...........",
      "....####............",
      "...................."
    ],
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
      "..####..####....",
      "..####..####.##."
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
      "..####..####....",
      "..####..####.##."
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
      "..####...####...",
      "..####..####.##."
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
      "..####..####....",
      "...#kk##kk#.wh#.",
      "..#hh#..#hh#G##.",
      "..####..####.##."
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
      "....####....####..#.",
      "...#ssss####ssss#.O.",
      "...#ssss#..#ssss#.O.",
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
      "..####..####....",
      "...#kk##kk#...x.",
      "..#hh#..#hh#..x.",
      "..####..####..x."
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
      "..####....####..",
      "...##bbBBbb##...",
      "...#pppppppp#...",
      "..#ppp#..#ppp#..",
      "..####....####.."
    ],
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
      "....####....####....",
      "....#ssss##ssss#.O..",
      "...#ssss#..#ssss#O..",
      "...#OOOO#..#OOOO#h..",
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
      "....####....####....",
      "....##bbOOOOdd##.O..",
      "....#ssss##ssss#.O..",
      "...#ssss#..#ssss#O..",
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
      "....####....####....",
      "...#O#bbOOOOdd#O#O..",
      "....##bbOOOOdd##.O..",
      "....#ssss##ssss#.O..",
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
      "....####....####....",
      "....##bbccccdd##.O..",
      "....#ssss##ssss#.O..",
      "...#ssss#..#ssss#O..",
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
      "....####....####....",
      "....##bbPPPPdd##.O..",
      "....#ssss##ssss#.O..",
      "...#ssss#..#ssss#...",
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
      "..####..####....",
      "...#oooooo#.....",
      "..#oo#..#oo#....",
      "..####..####....",
      "................"
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
      "..####..####....",
      "...#ssssssss#...",
      "...#kk####kk#...",
      "..#hh#....#hh#..",
      "..####....####..",
      "................"
    ],
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
      "..####..####....",
      "..#hh#....#hh#..",
      "..####....####..",
      "................"
    ],
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
      "...###....###...",
      "....#x#..#x#....",
      "...#xx#..#xx#...",
      "...#xx#..#xx#...",
      "...###....###..."
    ],
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
      "..####..####....",
      "...#oooooooo#...",
      "...#kk####kk#...",
      "..#oo#....#oo#..",
      "..####....####.."
    ],
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
      ".###..........##",
      "...##bbBBbb##Fwh",
      "...#ssss##ssss#.",
      "...#ssss#..#ssss",
      "..#hhhh#....#hhh",
      ".#RR#........#RR",
      ".###..........##"
    ],
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
      "...###......###.",
      ".....#kkkk#...m#",
      "....#kk##kk#..##",
      "...#kk#..#kk#...",
      "...###....###..."
    ],
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
      "................",
      ".#OO#..#OO#..#O#",
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
    ],
    goblin_archer_down_0: [
      "....########....",
      "..##LEEEEEEL##..",
      ".#LE#effffe#EL#.",
      "#LE#effffff#eEL#",
      "#EE#ffffffff#EE#",
      "..#f#ffffff#f#..",
      "..#o#oooooo#o#.#",
      ".#oo#o#oo#o#oo#l",
      ".#oo#oooooo#oo#l",
      "..##oooooooo##ll",
      "...#oooooooo#..l",
      "...#kk####kk#..l",
      "..#oo#....#oo#.#",
      "..####....####.."
    ],
    goblin_archer_down_1: [
      "....########....",
      "..##LEEEEEEL##..",
      ".#LE#effffe#EL#.",
      "#LE#effffff#eEL#",
      "#EE#ffffffff#EE#",
      "..#f#ffffff#f#..",
      "..#o#oooooo#o#.#",
      ".#oo#o#oo#o#oo#l",
      ".#oo#oooooo#oo#l",
      "..##oooooooo##ll",
      "...#oooooooo#..l",
      "..#kk#....#kk#.l",
      "..#oo#....#oo#.#",
      "..####....####.."
    ],
    goblin_archer_attack: [
      "....########....",
      "..##LEEEEEEL##..",
      ".#LE#effffe#EL#.",
      "#EE#ffffffff#EE#",
      "..#f#ffffff#f#..",
      "..#o#oooooo#o#..",
      ".#oo#o#oo#o#oo##",
      "..##oooooooo#lll",
      "...#oooooooo#hLL",
      "..#kk####kk##lll",
      "..#oo#..#oo#..##",
      "..####..####....",
      "..#oo#....#oo#.#",
      "..####....####.."
    ],
    orc_shaman_down_0: [
      "....########....",
      "...#xxxxkxxx#...",
      "..#xxee#k#eex#..",
      "..#xxxxk#kxxx#..",
      "..#xxxxkkkxxx#..",
      "...##P####P##...",
      "..#p#pPPPPp#p#..",
      ".#p#pPvPPvPp#p#v",
      ".#p#pPPPPPPp#p#P",
      ".#p#pPvPPvPp#p#x",
      "..##pPPPPPPp##.x",
      "...#pPPPPPPp#..x",
      "...#pppppppp#..x",
      "..#ppp#..#ppp#.#",
      "..####....####.."
    ],
    orc_shaman_down_1: [
      "....########....",
      "...#xxxxkxxx#...",
      "..#xxee#k#eex#..",
      "..#xxxxk#kxxx#..",
      "..#xxxxkkkxxx#..",
      "...##P####P##...",
      "..#p#pPPPPp#p#..",
      ".#p#pPvPPvPp#p#v",
      ".#p#pPPPPPPp#p#P",
      ".#p#pPvPPvPp#p#x",
      "..##pPPPPPPp##.x",
      "...#pPPPPPPp#..x",
      "...#pppppppp#..x",
      ".#ppp#....#ppp##",
      ".####......####."
    ],
    orc_shaman_attack: [
      "....########..#v",
      "...#xxxxkxxx#vvv",
      "..#xxee#k#eex#vv",
      "..#xxxxkkkxxx#vv",
      "...##P####P##.vP",
      "..#p#pPPPPp#p#xP",
      ".#p#pPvPPvPp#p#x",
      "..##pPPPPPPp##.x",
      "...#pPPPPPPp#..x",
      "...#pppppppp#..x",
      "..#ppp####ppp#.#",
      "..####....####..",
      "...#pppppppp#..x",
      "..#ppp#..#ppp#.#",
      "..####....####.."
    ],
    fire_golem_down_0: [
      ".....######.....",
      "....#kReeek#....",
      "...#keeeeeek#...",
      "..#kRFkkkkFRk#..",
      "..#keF#ee#Fek#..",
      "..#keeeFkeek#...",
      "...#keeeFek#....",
      ".##kReeeFeeRk##.",
      "#RFkReeeFeeRkFR#",
      "#eFkeeeFeeeekFe#",
      "#eFkeeeFeeeekFe#",
      "#RFkeeeeeeeekFR#",
      ".##kRkFFFFkRk##.",
      "...#kkk##kkk#...",
      "..#kFk#..#kFk#..",
      "..####....####.."
    ],
    fire_golem_down_1: [
      ".....######.....",
      "....#kReeek#....",
      "...#keeeeeek#...",
      "..#kRFkkkkFRk#..",
      "..#keF#ee#Fek#..",
      "..#keeeFkeek#...",
      "...#keeeFek#....",
      ".##kReeeFeeRk##.",
      "#RFkReeeFeeRkFR#",
      "#eFkeeeFeeeekFe#",
      "#eFkeeeFeeeekFe#",
      "#RFkeeeeeeeekFR#",
      ".##kRkFFFFkRk##.",
      "..#kkk#..#kkk#..",
      ".#kFk#....#kFk#.",
      ".####......####."
    ],
    fire_golem_attack: [
      ".....######.....",
      "....#kReeek#....",
      "...#keeeeeek#FfR",
      "..#keF#ee#Fek#eF",
      "..#keeeFkeek##eF",
      ".##kReeeFeeRkeee",
      "#RFkeeeFeeeekeee",
      "#eFkeeeFeeeekFfe",
      ".##kRkFFFFkRk###",
      "...#kkk##kkk#...",
      "..#kFk#..#kFk#..",
      "..####....####..",
      ".##kRkFFFFkRk##.",
      "...#kkk##kkk#...",
      "..#kFk#..#kFk#..",
      "..####....####.."
    ],
    ice_golem_down_0: [
      ".....######.....",
      "....#cCCCcc#....",
      "...#cCCCCCCc#...",
      "..#cChkkkkhCc#..",
      "..#cC#ww#ww#Cc#.",
      "..#cCCChCCCCc#..",
      "...#cChhhCc#....",
      ".##cCCCChhCCc##.",
      "#ChcCCCCChCCchC#",
      "#CucChhhhhhCcuC#",
      "#CucChhhhhhCcuC#",
      "#ChcCCCCCCCCchC#",
      ".##cChhhhhhCc##.",
      "...#ccc##ccc#...",
      "..#cCc#..#cCc#..",
      "..####....####.."
    ],
    ice_golem_down_1: [
      ".....######.....",
      "....#cCCCcc#....",
      "...#cCCCCCCc#...",
      "..#cChkkkkhCc#..",
      "..#cC#ww#ww#Cc#.",
      "..#cCCChCCCCc#..",
      "...#cChhhCc#....",
      ".##cCCCChhCCc##.",
      "#ChcCCCCChCCchC#",
      "#CucChhhhhhCcuC#",
      "#CucChhhhhhCcuC#",
      "#ChcCCCCCCCCchC#",
      ".##cChhhhhhCc##.",
      "..#ccc#..#ccc#..",
      ".#cCc#....#cCc#.",
      ".####......####."
    ],
    ice_golem_attack: [
      ".....######..#w#",
      "....#cCCCcc#hCww",
      "...#cCCCCCCc#Chw",
      "..#cC#ww#ww#cChw",
      ".##cCCCChhCCcChw",
      "#ChcCCCCChCCChC#",
      "#CucChhhhhhCc###",
      ".##cChhhhhhCc#..",
      "...#ccc##ccc#...",
      "..#cCc#..#cCc#..",
      "..####....####..",
      "#ChcCCCCCCCCchC#",
      ".##cChhhhhhCc##.",
      "...#ccc##ccc#...",
      "..#cCc#..#cCc#..",
      "..####....####.."
    ],
    yeti_down_0: [
      ".....######.....",
      "....#wwwwww#....",
      "...#whhhkhhw#...",
      "...#whkeeehw#...",
      "...#wkkkkkkw#...",
      "...#whhhhkhw#...",
      "..#wwwhhhhwww#..",
      ".#www#whhw#www#.",
      ".#sww#whhw#wws#.",
      ".#swwhhhhhhwws#.",
      ".#swwhhhhhhwws#.",
      "..##whhhhhh##...",
      "...#wwh##hww#...",
      "...#wwh..hww#...",
      "..#www#..#www#..",
      "..####....####.."
    ],
    yeti_down_1: [
      ".....######.....",
      "....#wwwwww#....",
      "...#whhhkhhw#...",
      "...#whkeeehw#...",
      "...#wkkkkkkw#...",
      "...#whhhhkhw#...",
      "..#wwwhhhhwww#..",
      ".#www#whhw#www#.",
      ".#sww#whhw#wws#.",
      ".#swwhhhhhhwws#.",
      ".#swwhhhhhhwws#.",
      "..##whhhhhh##...",
      "..#wwh#..#hww#..",
      ".#www#....#www#.",
      ".####......####.",
      "..####....####.."
    ],
    yeti_attack: [
      ".....######..##.",
      "....#wwwwww#hsww",
      "...#whhhkhhw#sww",
      "...#whkeeehw#sww",
      "...#wkkkkkkw#sww",
      "..#wwwhhhhwww###",
      ".#www#whhw#www#.",
      ".#swwhhhhhhwws#.",
      "..##whhhhhh##...",
      "...#wwh##hww#...",
      "..#www#..#www#..",
      "..####....####..",
      "...#wwh##hww#...",
      "...#wwh..hww#...",
      "..#www#..#www#..",
      "..####....####.."
    ],
    treant_down_0: [
      "..#o#......#o#..",
      ".#oDo#....#oDo#.",
      "..#oDE####EDo#..",
      "...#oDEEEEDo#...",
      "....#oDyyDo#....",
      "...#ooDEEDoo#...",
      "..#o#oDEEDo#o#..",
      ".#oDo#oDDo#oDo#.",
      ".#oDE#oDDo#EDo#.",
      ".#oDE#oooo#EDo#.",
      "..#o#oDooDo#o#..",
      "...##oDooDo##...",
      "...#oo####oo#...",
      "...#o#....#o#...",
      "..#oo#....#oo#..",
      "..####....####.."
    ],
    treant_down_1: [
      "..#o#......#o#..",
      ".#oDo#....#oDo#.",
      "..#oDE####EDo#..",
      "...#oDEEEEDo#...",
      "....#oDyyDo#....",
      "...#ooDEEDoo#...",
      "..#o#oDEEDo#o#..",
      ".#oDo#oDDo#oDo#.",
      ".#oDE#oDDo#EDo#.",
      ".#oDE#oooo#EDo#.",
      "..#o#oDooDo#o#..",
      "...##oDooDo##...",
      "..#oo#....#oo#..",
      ".#oo#......#oo#.",
      ".####......####.",
      "..####....####.."
    ],
    treant_attack: [
      "..#o#......#o#..",
      ".#oDo#....#oDo#.",
      "..#oDE####EDo#..",
      "...#oDyyDo#..#oD",
      "...#ooDEEDoo#oDo",
      "..#o#oDEEDo#oEDo",
      ".#oDo#oDDo#oEDo#",
      ".#oDE#oooo#oEDo#",
      "..##oDooDo###...",
      "...#oo####oo#...",
      "..#oo#....#oo#..",
      "..####....####..",
      "...#oo####oo#...",
      "...#o#....#o#...",
      "..#oo#....#oo#..",
      "..####....####.."
    ],
    mummy_down_0: [
      ".....######.....",
      "....#tttttt#....",
      "...#ttkkkktt#...",
      "...#t#ee##et#...",
      "...#tkkkkkkt#...",
      "....#ttlltt#....",
      ".....#tttt#.....",
      "....##llll##....",
      "...#t#llll#t#...",
      "..#tt#ltttl#tt#.",
      "..#tt#ltttl#tt#.",
      "...##llllll##...",
      "....#t#..#t#....",
      "...#tt#..#tt#...",
      "...#tt#..#tt#...",
      "...###....###..."
    ],
    mummy_down_1: [
      ".....######.....",
      "....#tttttt#....",
      "...#ttkkkktt#...",
      "...#t#ee##et#...",
      "...#tkkkkkkt#...",
      "....#ttlltt#....",
      ".....#tttt#.....",
      "....##llll##....",
      "...#t#llll#t#...",
      "..#tt#ltttl#tt#.",
      "..#tt#ltttl#tt#.",
      "...##llllll##...",
      "...#t#....#t#...",
      "..#tt#....#tt#..",
      "..#tt#....#tt#..",
      "..###......###.."
    ],
    mummy_attack: [
      ".....######..#t.",
      "....#tttttt#ttY.",
      "...#ttkkkktt#tY.",
      "...#t#ee##et#tY.",
      "....#ttlltt##tY.",
      "....##llll##.tY.",
      "...#t#llll#t#tY.",
      "..#tt#ltttl#tY..",
      "...##llllll##...",
      "....#t####t#....",
      "...#tt#..#tt#...",
      "...###....###...",
      "....#t#..#t#....",
      "...#tt#..#tt#...",
      "...#tt#..#tt#...",
      "...###....###..."
    ],
    scorpion_down_0: [
      ".......#L#......",
      "......#lEl#.....",
      ".....#ll#ll#....",
      "....#lll#lll#...",
      "...#llll#llll#..",
      "..#lllllllll#...",
      ".#llkkllkkll#...",
      "#ll#ee##ee#ll#..",
      "#ll#llllll#ll#..",
      "#ll#llllll#ll#..",
      ".#llllllllll#...",
      "..#lll##lll#....",
      ".#ll#....#ll#...",
      ".###......###..."
    ],
    scorpion_down_1: [
      ".......#L#......",
      "......#lEl#.....",
      ".....#ll#ll#....",
      "....#lll#lll#...",
      "...#llll#llll#..",
      "..#lllllllll#...",
      ".#llkkllkkll#...",
      "#ll#ee##ee#ll#..",
      "#ll#llllll#ll#..",
      "#ll#llllll#ll#..",
      ".#llllllllll#...",
      "..#lll##lll#....",
      "..#ll#..#ll#....",
      "..###....###...."
    ],
    scorpion_attack: [
      ".......#L#..#L#.",
      "......#lEl##lEl#",
      ".....#llll#llll#",
      "....#llllllllll#",
      "...#llllllllll#.",
      ".#llkkllkkll#...",
      "#ll#ee##ee#ll#..",
      "#ll#llllll#ll#..",
      "#ll#llllll#ll#..",
      ".#llllllllll#...",
      "..#lll##lll#....",
      ".#ll#....#ll#...",
      ".###......###...",
      ".###......###..."
    ],
    lich_down_0: [
      ".....######.....",
      "....#pPyyPp#....",
      "...#pxxxxkxp#...",
      "...#pxeekexxp#..",
      "...#pxxkkxxp#...",
      "....#pPkkPp#....",
      "...#pP####Pp#...",
      "..#pp#pPPp#pp#..",
      ".#pp#pPvPPp#pp#.",
      ".#x#pPvPPvPp#x#.",
      "..#p#pPPPPp#p#..",
      "...##pPPPPp##...",
      "...#pppppppp#...",
      "..#ppp#..#ppp#..",
      "..####....####.."
    ],
    lich_down_1: [
      ".....######.....",
      "....#pPyyPp#....",
      "...#pxxxxkxp#...",
      "...#pxeekexxp#..",
      "...#pxxkkxxp#...",
      "....#pPkkPp#....",
      "...#pP####Pp#...",
      "..#pp#pPPp#pp#..",
      ".#pp#pPvPPp#pp#.",
      ".#x#pPvPPvPp#x#.",
      "..#p#pPPPPp#p#..",
      "...##pPPPPp##...",
      "...#pppppppp#...",
      ".#ppp#....#ppp#.",
      ".####......####."
    ],
    lich_attack: [
      ".....######...#L",
      "....#pPyyPp#.LLL",
      "...#pxxxxkxp#LLL",
      "...#pxeekexxp#LL",
      "....#pPkkPp##LLL",
      "...#pP####Pp#kLL",
      "..#pp#pPPp#pp#k#",
      ".#x#pPvPPvPp#x#.",
      "..#p#pPPPPp#p#..",
      "...##pPPPPp##...",
      "...#pppppppp#...",
      "..#ppp####ppp#..",
      "..####....####..",
      "..#ppp#..#ppp#..",
      "..####....####.."
    ],
    hellhound_walk_0: [
      "................",
      ".......####.....",
      "......#kkkk#....",
      ".....#kweee#....",
      "....#kkkkwk#....",
      "...#kkkkkkkk####",
      "..#kFFRReekkRRkk",
      ".#kkFeeeFFeekkFF",
      ".#kFFRRFFRRkkFFk",
      "..#kk####kkkkk#.",
      "..#kk#..#kkkk#..",
      "..#kk#..#kkkk#..",
      "..#rr#...#rr#...",
      "..#kk#...#kk#...",
      "..####...####...",
      "................"
    ],
    hellhound_walk_1: [
      "................",
      ".......####.....",
      "......#kkkk#....",
      ".....#kweee#....",
      "....#kkkkwk#....",
      "...#kkkkkkkk####",
      "..#kFFRReekkRRkk",
      ".#kkFeeeFFeekkFF",
      ".#kFFRRFFRRkkFFk",
      "..#kk####kkkkk#.",
      "..#kk#...#kk#...",
      "..#kk#....#kk#..",
      "..#rr#....#rr#..",
      "..#kk#....#kk#..",
      "..####....####..",
      "................"
    ],
    hellhound_attack: [
      "................",
      "........####....",
      ".......#kkkk#...",
      "......#kweee#...",
      ".....#kkwewk#...",
      "....#kkkkkkkk###",
      "..##kFFRReekkRR#",
      ".#kkFeeeFFeekkFF",
      "..#kk####kkkkk#.",
      "..#rr#..#rr#....",
      "..#kk#..#kk#....",
      "..####..####....",
      "................",
      "................",
      "................",
      "................"
    ],
    wolf_frost_walk_0: [
      "................",
      ".......####.....",
      "......#hhhh#....",
      ".....#hwCCh#....",
      "....#hhhhwh#....",
      "...#hhhhhhhh####",
      "..#hhhhhhhhhhhh#",
      ".#hhhhhhhhhhhhh#",
      ".#hhhhhhhhhhhhh#",
      "..#hh####hhhhh#.",
      "..#hh#..#hhhh#..",
      "..#hh#..#hhhh#..",
      "..#mm#...#mm#...",
      "..#ss#...#ss#...",
      "..####...####...",
      "................"
    ],
    wolf_frost_walk_1: [
      "................",
      ".......####.....",
      "......#hhhh#....",
      ".....#hwCCh#....",
      "....#hhhhwh#....",
      "...#hhhhhhhh####",
      "..#hhhhhhhhhhhh#",
      ".#hhhhhhhhhhhhh#",
      ".#hhhhhhhhhhhhh#",
      "..#hh####hhhhh#.",
      "..#hh#...#hh#...",
      "..#hh#....#hh#..",
      "..#mm#....#mm#..",
      "..#ss#....#ss#..",
      "..####....####..",
      "................"
    ],
    wolf_frost_attack: [
      "................",
      "........####....",
      ".......#hhhh#...",
      "......#hwCCh#...",
      ".....#hhwewh#...",
      "....#hhhhhhhh###",
      "..##hhhhhhhhhhh#",
      ".#hhhhhhhhhhhhh#",
      "..#hh####hhhhh#.",
      "..#mm#..#mm#....",
      "..#ss#..#ss#....",
      "..####..####....",
      "................",
      "................",
      "................",
      "................"
    ],
    pirate_captain_down_0: [
      "......########......",
      "....##kkkkkkkk##....",
      "...#kkkkkkkkkkkk#...",
      "...#kkkkkwkkkkkk#...",
      "....#F#ffffff#F#....",
      "....#f#k##fff#f#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      "....#RR######RR#....",
      "...#RRkRRRRRRkRR#...",
      "..#RR#kRRRRRRk#RR#..",
      "..#RR#kYkYYkYk#RR#h.",
      "..#R#kkRRRRRRkk#R#wh",
      "..#RR#kkRRRRkk#RR#wh",
      "...##kkRRRRRRkk##Gwh",
      "...#ssss####ssss#.G#",
      "...#ssss#..#ssss#...",
      "...#kkkk#..#kkkk#...",
      "...#kkkk#..#kkkk#...",
      "....####....####...."
    ],
    pirate_captain_down_1: [
      "......########......",
      "....##kkkkkkkk##....",
      "...#kkkkkkkkkkkk#...",
      "...#kkkkkwkkkkkk#...",
      "....#F#ffffff#F#....",
      "....#f#k##fff#f#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      "....#RR######RR#....",
      "...#RRkRRRRRRkRR#...",
      "..#RR#kRRRRRRk#RR#..",
      "..#RR#kYkYYkYk#RR#h.",
      "..#R#kkRRRRRRkk#R#wh",
      "..#RR#kkRRRRkk#RR#wh",
      "...##kkRRRRRRkk##Gwh",
      "..#ssss#....#ssss#G#",
      "..#ssss#....#ssss#..",
      "..#kkkk#.....#kkkk#.",
      "..#kkkk#.....#kkkk#.",
      "...####.......####.."
    ],
    pirate_captain_attack: [
      "......########......",
      "....##kkkkkkkk##....",
      "...#kkkkkkkkkkkk#...",
      "...#kkkkkwkkkkkk#...",
      "....#ffffffffff#....",
      "....#RR######RR#..wh",
      "...#RRkRRRRRRkRR#wwh",
      "..#RR#kRRRRRRk#RRwhh",
      "..#R#kkRRRRRRkk#Rwhh",
      "...##kkRRRRRRkk##whh",
      "...#ssss####ssss#Gwh",
      "...#kkkk#..#kkkk#.G#",
      "....####....####....",
      "..#RR#kkRRRRkk#RR#wh",
      "...##kkRRRRRRkk##Gwh",
      "...#ssss####ssss#.G#",
      "...#ssss#..#ssss#...",
      "...#kkkk#..#kkkk#...",
      "...#kkkk#..#kkkk#...",
      "....####....####...."
    ],
    merchant_down_0: [
      "......########......",
      ".....#llllllll#.....",
      "....#llffffllll#....",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      "....#OO######OO#....",
      "...#OOoOOOOOOoOO#...",
      "..#OO#oOOOOOOo#OO#..",
      "..#OO#oYgGGgYo#OO#..",
      "..#O#ooOOOOOOoo#O#y.",
      "..#OO#ooOOOOoo#OO#yy",
      "...##ooOOOOOOoo##yG#",
      "...#ssss####ssss#.##",
      "...#ssss#..#ssss#...",
      "...#OOOO#..#OOOO#...",
      "...#OOOO#..#OOOO#...",
      "....####....####...."
    ],
    merchant_down_1: [
      "......########......",
      ".....#llllllll#.....",
      "....#llffffllll#....",
      "....#F#ffffff#F#....",
      "....#ffffffffff#....",
      "....#f##ffff##f#....",
      "....#OO######OO#....",
      "...#OOoOOOOOOoOO#...",
      "..#OO#oOOOOOOo#OO#..",
      "..#OO#oYgGGgYo#OO#..",
      "..#O#ooOOOOOOoo#O#y.",
      "..#OO#ooOOOOoo#OO#yy",
      "...##ooOOOOOOoo##yG#",
      "..#ssss#....#ssss#.G",
      "..#ssss#....#ssss#..",
      "..#OOOO#.....#OOOO#.",
      "..#OOOO#.....#OOOO#.",
      "...####.......####.."
    ],
    priest_down_0: [
      ".....######.....",
      "....#wYYYYw#....",
      "...#wwYYYYww#...",
      "...#ww#YY#ww#...",
      "...#w#ffff#w#...",
      "...#ffffffff#...",
      "....#ffffff#....",
      "...#ww####ww#...",
      "..#wwhYYYYhww#..",
      ".#ww#hYYYYh#ww#.",
      ".#f#hhYYYYhh#f#.",
      "..#w#hYYYYh#w#..",
      "...##hhYYhh##...",
      "...#wwwwwwww#...",
      "..#www#..#www#..",
      "..####....####.."
    ],
    priest_down_1: [
      ".....######.....",
      "....#wYYYYw#....",
      "...#wwYYYYww#...",
      "...#ww#YY#ww#...",
      "...#w#ffff#w#...",
      "...#ffffffff#...",
      "....#ffffff#....",
      "...#ww####ww#...",
      "..#wwhYYYYhww#..",
      ".#ww#hYYYYh#ww#.",
      ".#f#hhYYYYhh#f#.",
      "..#w#hYYYYh#w#..",
      "...##hhYYhh##...",
      "...#wwwwwwww#...",
      ".#www#....#www#.",
      ".####......####."
    ],
    crusader_down_0: [
      "......####......",
      ".....#hhhh#.....",
      "....#hskksh#....",
      "...#hhmhhhh#....",
      "..#h#m#h#m##....",
      "..#hhsmhhhsh#...",
      "...#ssssss#.....",
      "..#wwwhhhhww#...",
      ".#ww#wRRRRw#ww#.",
      ".#f#wwRRRRww#f#h",
      "..#hwwRRRRwwh#wh",
      "..#hh#wRRw#hh#wh",
      "...##ssssss##.wh",
      "...#kk##kk#.wh#.",
      "..#hh#..#hh#G##.",
      "..####..####.##."
    ],
    crusader_down_1: [
      "......####......",
      ".....#hhhh#.....",
      "....#hskksh#....",
      "...#hhmhhhh#....",
      "..#h#m#h#m##....",
      "..#hhsmhhhsh#...",
      "...#ssssss#.....",
      "..#wwwhhhhww#...",
      ".#ww#wRRRRw#ww#.",
      ".#f#wwRRRRww#f#h",
      "..#hwwRRRRwwh#wh",
      "..#hh#wRRw#hh#wh",
      "...##ssssss##.wh",
      "..#kk#..#kk#wh#.",
      "..#hh#...#hh#G##",
      "..####...####.##"
    ],
    harpy_down_0: [
      "..#p#......#p#..",
      ".#pp#......#pp#.",
      "#ppp#..##..#ppp#",
      "#pppp##pp##pppp#",
      ".#pppf#ff#fppp#.",
      "..#ppffffffpp#..",
      "...#ffffffff#...",
      "....#ff##ff#....",
      "...#PffffffP#...",
      "..#PP######PP#..",
      ".#PP#......#PP#.",
      ".#P#........#P#.",
      "..#yy#....#yy#..",
      "..####....####.."
    ],
    harpy_down_1: [
      "................",
      ".......##.......",
      ".....##pp##.....",
      "...##pppppp##...",
      ".##ppppffpppp##.",
      "#ppppffffffpppp#",
      ".##ffffffffff##.",
      "...#ffffffff#...",
      "....#ff##ff#....",
      "...#PffffffP#...",
      "..#PP######PP#..",
      "..#yy#....#yy#..",
      "..####....####..",
      "................"
    ],
    harpy_attack: [
      "..#p#......#p#..",
      ".#pp#..##..#pp#.",
      "#ppp#.#ff#.#ppp#",
      ".#ppffffffffpp#.",
      "..#ffffffffff#..",
      "...#ffffffff#...",
      "...#PffffffP#...",
      "..#PP######PP#..",
      ".#PP#......#PP#.",
      ".#P#........#P#.",
      ".#yyy#....#yyy#.",
      ".#####....#####.",
      "................",
      "................"
    ],
    skeleton_archer_down_0: [
      ".....######.....",
      "....#xxxxxx#....",
      "...#xxkkkkxx#...",
      "...#x#ee##ex#...",
      "...#xkkkkkkx#...",
      "....#xkhhkx#....",
      ".....#xxxx#...#.",
      "....##ssss##..#l",
      "...#x#ssss#x#.ll",
      "..#xx#smmms#xxll",
      "..#xx#smmms#xx#l",
      "...##ssssss##..#",
      "....#x#..#x#....",
      "...#xx#..#xx#...",
      "...#xx#..#xx#...",
      "...###....###..."
    ],
    skeleton_archer_down_1: [
      ".....######.....",
      "....#xxxxxx#....",
      "...#xxkkkkxx#...",
      "...#x#ee##ex#...",
      "...#xkkkkkkx#...",
      "....#xkhhkx#....",
      ".....#xxxx#...#.",
      "....##ssss##..#l",
      "...#x#ssss#x#.ll",
      "..#xx#smmms#xxll",
      "..#xx#smmms#xx#l",
      "...##ssssss##..#",
      "...#x#....#x#...",
      "..#xx#....#xx#..",
      "..#xx#....#xx#..",
      "..###......###.."
    ],
    skeleton_archer_attack: [
      ".....######.....",
      "....#xxxxxx#....",
      "...#xxkkkkxx#...",
      "...#x#ee##ex#...",
      "....#xkhhkx#....",
      "....##ssss##..#.",
      "...#x#ssss#x#lll",
      "..#xx#smmms#xhLL",
      "...##ssssss##lll",
      "....#x####x#..#.",
      "...#xx#..#xx#...",
      "...###....###...",
      "....#x#..#x#....",
      "...#xx#..#xx#...",
      "...#xx#..#xx#...",
      "...###....###..."
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

    // 엔티티 베이스 스프라이트 정밀 분류 (Every creature is distinct!)
    getBaseKeyForEntity(e) {
      if (e.role === 'player') return 'hero';
      if (e.role === 'king') return 'king';
      if (e.role === 'priest' || e.role === 'cleric' || (e.subClass && e.subClass.includes('사제'))) return 'priest';
      if (e.role === 'merchant') return 'merchant';
      if (e.race === 'dragonkin' || e.role === 'dragonkin') return 'dragonkin';
      if (e.role === 'royal_guard' || e.role === 'guard') return 'guard';
      if (e.role === 'crusader') return 'crusader';
      if (e.role === 'soldier') {
        if (e.homeId && (e.homeId.includes('necropolis') || e.homeId.includes('obsidian'))) return 'skeleton';
        return (e.id % 3 === 0) ? 'crusader' : ((e.id % 2 === 0) ? 'guard' : 'knight');
      }

      // 전문 직업군
      if (e.role === 'farmer') return 'farmer';
      if (e.role === 'miner') return 'miner';
      if (e.role === 'blacksmith') return 'blacksmith';
      if (e.role === 'fisherman') return 'fisherman';
      if (e.role === 'bard') return 'bard';

      if (e.role === 'adventurer' || e.role === 'mercenary') {
        if (e.race === 'dwarf') return 'dwarf';
        if (e.race === 'elf') return 'elf';
        if (e.race === 'undead') return 'skeleton';
        return (e.id % 2 === 0) ? 'paladin' : 'crusader';
      }

      // 몬스터 정밀 세부 분류 (Individual Visual Identity)
      if (e.role === 'monster') {
        const name = e.name || '';
        const sub = e.subClass || '';
        const mtype = e.monsterType || '';

        // 1. 해골 / 리치 / 사신 언데드 군단
        if (mtype === 'lich' || name.includes('리치') || sub.includes('리치')) return 'lich';
        if (mtype === 'reaper' || name.includes('사신') || name.includes('리퍼') || name.includes('망령 흑기사')) return 'reaper';
        if (mtype === 'skeleton_archer' || name.includes('해골 궁수') || (sub.includes('언데드') && name.includes('궁수'))) return 'skeleton_archer_down';
        if (mtype === 'skeleton' || name.includes('스켈레톤') || name.includes('해골') || sub.includes('언데드') || e.homeId === 'obsidian_necropolis') return 'skeleton';

        // 2. 미라 & 사막 괴수
        if (mtype === 'mummy' || name.includes('미라') || name.includes('머미')) return 'mummy';
        if (mtype === 'scorpion' || name.includes('전갈') || name.includes('스콜피온')) return 'scorpion';

        // 3. 골렘 (화염 / 얼음)
        if (mtype === 'lava_golem' || mtype === 'fire_golem' || name.includes('화염골렘') || name.includes('용암골렘') || name.includes('화염 골렘')) return 'fire_golem';
        if (mtype === 'ice_golem' || name.includes('얼음골렘') || name.includes('빙결골렘') || name.includes('얼음 골렘')) return 'ice_golem';

        // 4. 설원 / 한대 괴수
        if (mtype === 'yeti' || name.includes('예티') || name.includes('설인')) return 'yeti';
        if (mtype === 'wolf_frost' || name.includes('서리 늑대') || name.includes('빙결 늑대')) return 'wolf_frost';

        // 5. 원시림 / 자연 정령 & 비행 마수
        if (mtype === 'treant' || name.includes('트렌트') || name.includes('나무 정령') || name.includes('세계수')) return 'treant';
        if (mtype === 'harpy' || name.includes('하피') || name.includes('가고일') || mtype === 'gargoyle') return 'harpy';

        // 6. 마수 & 지옥견
        if (mtype === 'hellhound' || name.includes('지옥') || name.includes('헬하운드') || name.includes('케르베로스')) return 'hellhound';

        // 7. 오크 부족 (전사 / 샤먼)
        if (mtype === 'orc_shaman' || name.includes('샤먼') || name.includes('주술사')) return 'orc_shaman';
        if (mtype === 'orc' || mtype === 'orc_berserker' || sub.includes('오크') || name.includes('오크') || e.homeId === 'orc_stronghold') return 'orc';

        // 8. 고블린 부족 (도적 / 덫사냥꾼)
        if (mtype === 'goblin_archer' || name.includes('사냥꾼') || name.includes('궁수')) return 'goblin_archer';
        if (mtype === 'goblin' || name.includes('고블린') || e.homeId === 'goblin_camp') return 'goblin';

        // 9. 대해적 선단
        if (mtype === 'pirate_captain' || name.includes('해적선장') || name.includes('블랙비어드')) return 'pirate_captain';
        if (mtype === 'pirate_raider' || mtype === 'pirate_sailor' || name.includes('해적') || e.homeId === 'pirate_cove') return 'pirate_captain';

        // 10. 용족
        if (e.race === 'dragonkin' || name.includes('용족') || name.includes('드래고니안')) return 'dragonkin';

        // 11. 기타
        if (name.includes('슬라임')) return 'slime';
        if (name.includes('박쥐')) return 'bat';
        if (name.includes('늑대')) return 'wolf';

        return (e.id % 4 === 0) ? 'orc' : ((e.id % 3 === 0) ? 'skeleton' : ((e.id % 2 === 0) ? 'goblin_archer' : 'goblin'));
      }

      // 동물
      if (e.role === 'animal') {
        const at = e.animalType;
        if (at === 'horse') return 'horse';
        if (at === 'bear') return 'bear';
        if (at === 'wolf') return (e.name && (e.name.includes('서리') || e.name.includes('빙결'))) ? 'wolf_frost' : 'wolf';
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
      const isAttacking = (e.state === 'combat') || ((e.attackCooldown || 0) > 0.3);
      const isMoving = Math.abs(e.vx || 0) > 0.08 || Math.abs(e.vy || 0) > 0.08;

      // 2. 애니메이션 프레임 산출 (보행 시 균형 잡힌 0/1 스텝)
      let animFrame = '0';
      if (isAttacking) {
        animFrame = 'attack';
      } else if (isMoving) {
        const step = Math.floor(((e.animPhase || 0) * 1.5)) % 2;
        animFrame = step === 1 ? '1' : '0';
      } else if (e.role === 'farmer' || e.role === 'miner' || e.role === 'blacksmith' || e.role === 'fisherman' || e.role === 'bard') {
        if (!isNight && Math.sin(timeSec * 2.0 + (e.id || 0)) > 0.3) {
          animFrame = 'action';
        }
      }

      // 3. 캔버스 리졸브
      const cv = this.resolveCanvas(baseKey, dir, animFrame, isFacingLeft);
      if (!cv) return;

      const sc = e.scale || 1.0;
      const sw = cv.width;
      const sh = cv.height;

      // 4. 발밑 정밀 픽셀 타원 그림자 (지면에 견고하게 접지)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
      ctx.beginPath();
      ctx.ellipse(px, py + 5 * sc, 7 * sc, 3 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. 공격 시 부드러운 1~2px 전진 런지 & 피격 시 1px 부드러운 스태거 (지터링 제거)
      let offsetX = 0;
      let offsetY = 0;

      if (isAttacking) {
        // 공격 시 부드럽게 앞으로 1.5px 숙이는 안정된 공격 전진
        const lunge = 1.5 * sc;
        if (dir === 'down') offsetY += lunge;
        else if (dir === 'up') offsetY -= lunge;
        else if (dir === 'left') offsetX -= lunge;
        else if (dir === 'right') offsetX += lunge;
      }

      if (e.hitTimer && e.hitTimer > 0) {
        // 피격 시 넉백 방향으로 부드럽게 1~2px 후퇴
        const flinch = (e.hitTimer / 0.25) * 2.0 * sc;
        if (dir === 'down') offsetY -= flinch;
        else if (dir === 'up') offsetY += flinch;
        else if (dir === 'left') offsetX += flinch;
        else if (dir === 'right') offsetX -= flinch;
      }

      // 6. 스프라이트 블릿 (High-Res 1.5x Scaling, Zero-Pop 고정 높이)
      const renderW = Math.round(sw * sc * 1.5);
      const renderH = Math.round(sh * sc * 1.5);
      const renderX = Math.round(px - renderW / 2 + offsetX);
      const renderY = Math.round(py - renderH + 6 * sc - bounce + offsetY);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cv, renderX, renderY, renderW, renderH);

      // 7. 피격 시 선명한 적색 플래시 틴트
      if (e.hitTimer && e.hitTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.40)';
        ctx.fillRect(renderX, renderY, renderW, renderH);
        ctx.restore();
      }

      // 8. 공격 시 전방 크리스피 픽셀 참격 궤적 (캐릭터 전면을 가리지 않고 전방에만 선명하게 발도)
      if (isAttacking) {
        ctx.save();
        const sideSign = isFacingLeft ? -1 : 1;
        let slashColor = '#f8fafc';
        if (baseKey === 'dragonkin' || baseKey === 'fire_golem' || baseKey === 'hellhound') slashColor = '#f97316';
        else if (baseKey === 'ice_golem' || baseKey === 'yeti' || baseKey === 'wolf_frost') slashColor = '#38bdf8';
        else if (baseKey === 'lich' || baseKey === 'reaper' || baseKey === 'orc_shaman') slashColor = '#c084fc';
        else if (baseKey === 'goblin' || baseKey === 'goblin_archer' || baseKey === 'treant' || baseKey === 'slime') slashColor = '#4ade80';

        // 참격 호 (Crisp Crescent Slash Arc)
        ctx.strokeStyle = slashColor;
        ctx.lineWidth = 2.0 * sc;
        ctx.beginPath();
        const arcCenterX = px + (dir === 'left' ? -10 : (dir === 'right' ? 10 : 0)) * sc;
        const arcCenterY = py - 8 * sc - bounce + (dir === 'down' ? 6 : (dir === 'up' ? -6 : 0)) * sc;
        const startAng = isFacingLeft ? Math.PI * 0.7 : -Math.PI * 0.3;
        const endAng = isFacingLeft ? Math.PI * 1.3 : Math.PI * 0.3;
        ctx.arc(arcCenterX, arcCenterY, 12 * sc, startAng, endAng, isFacingLeft);
        ctx.stroke();

        // 픽셀 스파크 파편 2개
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(arcCenterX + sideSign * 8 * sc, arcCenterY - 4 * sc, 2 * sc, 2 * sc);
        ctx.fillRect(arcCenterX + sideSign * 11 * sc, arcCenterY + 2 * sc, 1.5 * sc, 1.5 * sc);
        ctx.restore();
      }

      // 9. 방패 장착 캐릭터 (성기사 / 근위병 / 십자군): 반대편 손에 방패 픽셀 블릿
      if ((baseKey === 'crusader' || baseKey === 'guard' || (baseKey === 'hero' && e.hasShield)) && (dir === 'down' || dir === 'left' || dir === 'right')) {
        if (window.PixelItems) {
          const sCvs = window.PixelItems.getCanvas('shield_iron');
          if (sCvs) {
            ctx.save();
            const sideSign = isFacingLeft ? -1 : 1;
            const shieldX = px - sideSign * 8 * sc;
            const shieldY = py - 12 * sc - bounce;
            ctx.drawImage(sCvs, shieldX - 5 * sc, shieldY, 11 * sc, 11 * sc);
            ctx.restore();
          }
        }
      }

      // 10. 생태계 상태 풍선 렌더링 (Ecology Status Balloon Float)
      const bKey = this.getBalloonKeyForEntity(e, isNight);
      if (bKey && this.balloonCache.has(bKey)) {
        const bCvs = this.balloonCache.get(bKey);
        const floatY = Math.round(Math.sin(timeSec * 2.5 + (e.id || 0)) * 2);
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
      } else if (e.role === 'crusader') {
        weaponId = 'sword_steel';
        shieldId = 'shield_iron';
      } else if (e.role === 'priest' || e.role === 'cleric') {
        weaponId = 'lance_holy';
      } else if (e.role === 'adventurer' || e.role === 'mercenary') {
        weaponId = (e.race === 'dwarf') ? 'axe_battle' : ((e.race === 'elf') ? 'bow_frost' : 'sword_steel');
      } else if (e.role === 'monster') {
        const name = e.name || '';
        const mtype = e.monsterType || '';
        if (mtype === 'orc_shaman' || name.includes('샤먼')) weaponId = 'staff_arcane';
        else if (mtype === 'orc' || mtype === 'orc_berserker' || name.includes('오크')) weaponId = 'axe_battle';
        else if (mtype === 'skeleton_archer' || name.includes('궁수')) weaponId = 'bow_frost';
        else if (mtype === 'skeleton' || name.includes('스켈레톤')) weaponId = 'sword_steel';
        else if (mtype === 'goblin_archer') weaponId = 'bow_elven';
        else if (mtype === 'goblin' || name.includes('고블린')) weaponId = 'dagger_poison';
        else if (mtype === 'reaper' || name.includes('사신') || name.includes('리퍼')) weaponId = 'scythe_shadow';
        else if (mtype === 'lich' || name.includes('리치')) weaponId = 'staff_arcane';
        else if (mtype === 'pirate_captain' || name.includes('해적')) weaponId = 'saber_pirate';
        else if (e.race === 'dragonkin' || name.includes('용족')) weaponId = 'sword_flame';
        else if (mtype === 'treant' || name.includes('트렌트')) weaponId = 'staff_nature';
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
        if (weaponId.includes('flame') || weaponId.includes('magma')) slashColor = '#f97316';
        else if (weaponId.includes('excalibur') || weaponId.includes('frost')) slashColor = '#38bdf8';
        else if (weaponId.includes('poison') || weaponId.includes('nature')) slashColor = '#4ade80';
        else if (weaponId.includes('shadow') || weaponId.includes('arcane')) slashColor = '#c084fc';
        else if (weaponId.includes('holy') || weaponId.includes('gold')) slashColor = '#facc15';

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
          ctx.rotate(isLeft ? 0.4 : -0.4);
          ctx.drawImage(wCvs, -4 * sc, -14 * sc, 14 * sc, 14 * sc);
        } else {
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
