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
    // =========================================================================
    // LOREON KINGDOM SPRITES (Reference Images 2 & 3 Matching)
    // =========================================================================
    // 1. ⚔️ 로레온 나이트 커맨더 (Knight Commander - Crimson Plume & Gold Trim)
    commander_down_0: [
      "......##RRRR##......",
      ".....#RRRRRRRR#.....",
      ".....#R#mmmm#R#.....",
      ".....##mh##hm##.....",
      "....#shhmmmmhhs#....",
      "....#s#ffffff#s#....",
      "....#s#ff##ff#s#....",
      "...#Gg#ffffff#gG#...",
      "..#GyG#ssssss#GyG#..",
      "..#Gyy#bBBBBb#yyG#..",
      "..#yyy#bBBBBb#yyy#h.",
      "..#Gyy#bYYYYb#yyG#wh",
      "..#GyG#bBBBBb#GyG#wh",
      "...#Gg#bbBBbb#gG#Gwh",
      "....##bBBBBBBb##.Gwh",
      "...#sssm####msss#.G#",
      "...#shhm#..#mhhs#...",
      "...#shhm#..#mhhs#...",
      "...#mmmm#..#mmmm#...",
      "....####....####...."
    ],
    commander_down_1: [
      "......##RRRR##......",
      ".....#RRRRRRRR#.....",
      ".....#R#mmmm#R#.....",
      ".....##mh##hm##.....",
      "....#shhmmmmhhs#....",
      "....#s#ffffff#s#....",
      "....#s#ff##ff#s#....",
      "...#Gg#ffffff#gG#...",
      "..#GyG#ssssss#GyG#..",
      "..#Gyy#bBBBBb#yyG#..",
      "..#yyy#bBBBBb#yyy#h.",
      "..#Gyy#bYYYYb#yyG#wh",
      "..#GyG#bBBBBb#GyG#wh",
      "...#Gg#bbBBbb#gG#Gwh",
      "..#sssm#bBBb#msssGwh",
      "..#shhm#....#mhhsG#.",
      "..#shhm#.....#mhhs#.",
      "..#mmmm#.....#mmmm#.",
      "...####.......####.."
    ],
    commander_down_attack: [
      "......##RRRR##......",
      ".....#RRRRRRRR#.....",
      ".....#R#mmmm#R#.....",
      ".....##mh##hm##.....",
      "....#shhmmmmhhs#..wh",
      "....#s#ffffff#s#.wwh",
      "....#s#ff##ff#s#whhh",
      "...#Gg#ffffff#gGwhhh",
      "..#GyG#ssssss#Gywhhh",
      "..#Gyy#bBBBBb#yywhhh",
      "..#yyy#bBBBBb#yywhhh",
      "..#Gyy#bYYYYb#yywhhh",
      "..#GyG#bBBBBb#GyGwhh",
      "...#Gg#bbBBbb#gG#Gwh",
      "....##bBBBBBBb##..G#",
      "...#sssm####msss#...",
      "...#shhm#..#mhhs#...",
      "...#shhm#..#mhhs#...",
      "...#mmmm#..#mmmm#...",
      "....####....####...."
    ],
    commander_side_0: [
      "....##RRRR##........",
      "...#RRRRRRRR#.......",
      "...#RR#mmmm##.......",
      "...#R#mh##hm#.......",
      "....#shmmmmhs#......",
      "....#sffffff#.......",
      "....#sff##ff#.......",
      "...#Ggffffff#.......",
      "..#GyGssssss#.......",
      "..#GyybBBBBb#.......",
      "..#yyybBBBBb#h......",
      "..#GyybYYYYb#wh.....",
      "..#GyGbBBBBb#wh.....",
      "...#GgbbBBbb#Gwh....",
      "....##bBBBBb##Gwh...",
      "...#sssm##msss#.G#..",
      "...#shhm##mhhs#.....",
      "...#shhm##mhhs#.....",
      "...#mmmm##mmmm#.....",
      "....####..####......"
    ],
    commander_side_1: [
      "....##RRRR##........",
      "...#RRRRRRRR#.......",
      "...#RR#mmmm##.......",
      "...#R#mh##hm#.......",
      "....#shmmmmhs#......",
      "....#sffffff#.......",
      "....#sff##ff#.......",
      "...#Ggffffff#.......",
      "..#GyGssssss#.......",
      "..#GyybBBBBb#.......",
      "..#yyybBBBBb#h......",
      "..#GyybYYYYb#wh.....",
      "..#GyGbBBBBb#wh.....",
      "...#GgbbBBbb#Gwh....",
      "..#sssm#bBb#msss#Gwh",
      "..#shhm#...#mhhs#.G#",
      "..#shhm#....#mhhs#..",
      "..#mmmm#....#mmmm#..",
      "...####......####..."
    ],
    commander_side_attack: [
      "....##RRRR##........",
      "...#RRRRRRRR#.......",
      "...#RR#mmmm##.......",
      "...#R#mh##hm#.....wh",
      "....#shmmmmhs#...wwh",
      "....#sffffff#...whhh",
      "....#sff##ff#..whhhh",
      "...#Ggffffff#.whhhhh",
      "..#GyGssssss#whhhhhh",
      "..#GyybBBBBb#whhhhhh",
      "..#yyybBBBBb#Gwhhhhh",
      "..#GyybYYYYb#..Gwhhh",
      "..#GyGbBBBBb#...Gwhh",
      "...#GgbbBBbb#....Gwh",
      "....##bBBBBb##....G#",
      "...#sssm##msss#.....",
      "...#shhm##mhhs#.....",
      "...#shhm##mhhs#.....",
      "...#mmmm##mmmm#.....",
      "....####..####......"
    ],

    // 2. 👑 로레온 여공작 (Duchess - White Silver Armor & Rapier)
    duchess_down_0: [
      "......######........",
      ".....#yyyyyy#.......",
      "....#yyyyyyyy#......",
      "....#y#ffff#y#......",
      "....#y#f##f#y#......",
      "....#fffffffff#.....",
      "....#f##ff##f#......",
      "...#GgffffffgG#.....",
      "..#Gww#hhhh#wwG#....",
      "..#Gww#hBBh#wwG#....",
      "..#yww#hBBh#wwy#....",
      "..#yww#hYYh#wwy#h...",
      "..#Gww#bBBb#wwG#mh..",
      "...#Gg#bBBb#gG#..mh.",
      "....##bBBBBb##...mhh",
      "...#wwww##wwww#..mhh",
      "...#whhw##whhw#...m#",
      "...#whhw##whhw#.....",
      "...#wwww##wwww#.....",
      "....####..####......"
    ],
    duchess_down_1: [
      "......######........",
      ".....#yyyyyy#.......",
      "....#yyyyyyyy#......",
      "....#y#ffff#y#......",
      "....#y#f##f#y#......",
      "....#fffffffff#.....",
      "....#f##ff##f#......",
      "...#GgffffffgG#.....",
      "..#Gww#hhhh#wwG#....",
      "..#Gww#hBBh#wwG#....",
      "..#yww#hBBh#wwy#....",
      "..#yww#hYYh#wwy#h...",
      "..#Gww#bBBb#wwG#mh..",
      "...#Gg#bBBb#gG#..mh.",
      "..#wwww#bBb#wwww#mhh",
      "..#whhw#...#whhw#mhh",
      "..#whhw#....#whhw#m#",
      "..#wwww#....#wwww#..",
      "...####......####..."
    ],
    duchess_down_attack: [
      "......######........",
      ".....#yyyyyy#.......",
      "....#yyyyyyyy#......",
      "....#y#ffff#y#......",
      "....#y#f##f#y#......",
      "....#fffffffff#..mhh",
      "....#f##ff##f#..mhhh",
      "...#GgffffffgG#mhhhh",
      "..#Gww#hhhh#wwGmhhhh",
      "..#Gww#hBBh#wwGmhhhh",
      "..#yww#hBBh#wwy#mhhh",
      "..#yww#hYYh#wwy##mhh",
      "..#Gww#bBBb#wwG#..m#",
      "...#Gg#bBBb#gG#.....",
      "....##bBBBBb##......",
      "...#wwww##wwww#.....",
      "...#whhw##whhw#.....",
      "...#whhw##whhw#.....",
      "...#wwww##wwww#.....",
      "....####..####......"
    ],

    // 3. 🏹 로레온 왕립 레인저 (Royal Ranger / Archer - Cowl & Quiver)
    archer_down_0: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEDDDED#.......",
      "....#DE#ffff#D#.....",
      "....#D#ff##ff#D#....",
      "....#Dffffffff#D#...",
      "....#D#ffffff#D#....",
      "...#OO#ffffff#OO#...",
      "..#OlO#OllO#OlO#o...",
      "..#OlO#OOOO#OlO#ol..",
      "..#OOO#OllO#OOO#olw.",
      "..#OlO#OOOO#OlO#olww",
      "..#OOO#OllO#OOO#olw.",
      "...#OO#OOOO#OO#..ol.",
      "....##OOOOOO##...o..",
      "...#OOOO##OOOO#.....",
      "...#OllO##OllO#.....",
      "...#OllO##OllO#.....",
      "...#oooo##oooo#.....",
      "....####..####......"
    ],
    archer_down_1: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEDDDED#.......",
      "....#DE#ffff#D#.....",
      "....#D#ff##ff#D#....",
      "....#Dffffffff#D#...",
      "....#D#ffffff#D#....",
      "...#OO#ffffff#OO#...",
      "..#OlO#OllO#OlO#o...",
      "..#OlO#OOOO#OlO#ol..",
      "..#OOO#OllO#OOO#olw.",
      "..#OlO#OOOO#OlO#olww",
      "..#OOO#OllO#OOO#olw.",
      "...#OO#OOOO#OO#..ol.",
      "..#OOOO#OO#OOOO#.o..",
      "..#OllO#..#OllO#....",
      "..#OllO#...#OllO#...",
      "..#oooo#...#oooo#...",
      "...####.....####...."
    ],
    archer_down_attack: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEDDDED#.......",
      "....#DE#ffff#D#.....",
      "....#D#ff##ff#D#....",
      "....#Dffffffff#D#...",
      "....#D#ffffff#D#..o.",
      "...#OO#ffffff#OO#ool",
      "..#OlO#OllO#OlO#oolw",
      "..#OlO#OOOO#OlO#oolw",
      "..#OOO#OllO#OOO#oolw",
      "..#OlO#OOOO#OlO#oolw",
      "..#OOO#OllO#OOO#oolw",
      "...#OO#OOOO#OO#..oow",
      "....##OOOOOO##....o.",
      "...#OOOO##OOOO#.....",
      "...#OllO##OllO#.....",
      "...#OllO##OllO#.....",
      "...#oooo##oooo#.....",
      "....####..####......"
    ],

    // 4. 🔮 로레온 왕립 비전 마도사 (Royal Mage - Blue Robe & Arcane Orb Staff)
    mage_down_0: [
      "......######........",
      ".....#bbbbbb#.......",
      "....#bBBbbBBb#......",
      "....#bB#ffff#b#..cC.",
      "....#b#ff##ff#b#.CcC",
      "....#bffffffff#b#cC.",
      "....#b#ffffff#b#..o.",
      "...#yY#ffffff#Yy#.o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "...#bB#bBBBBb#Bb#.o.",
      "....##bBBBBBBb##..o.",
      "...#bBBb####bBBb#.o.",
      "...#bbbb#..#bbbb#...",
      "...#bbbb#..#bbbb#...",
      "...#oooo#..#oooo#...",
      "....####....####...."
    ],
    mage_down_1: [
      "......######........",
      ".....#bbbbbb#.......",
      "....#bBBbbBBb#......",
      "....#bB#ffff#b#..cC.",
      "....#b#ff##ff#b#.CcC",
      "....#bffffffff#b#cC.",
      "....#b#ffffff#b#..o.",
      "...#yY#ffffff#Yy#.o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "...#bB#bBBBBb#Bb#.o.",
      "..#bBBb#bBB#bBBb#.o.",
      "..#bbbb#...#bbbb#...",
      "..#bbbb#....#bbbb#..",
      "..#oooo#....#oooo#..",
      "...####......####..."
    ],
    mage_down_attack: [
      "......######.....CCC",
      ".....#bbbbbb#...CCCCC",
      "....#bBBbbBBb#..CCCCC",
      "....#bB#ffff#b#..CCC",
      "....#b#ff##ff#b#..o.",
      "....#bffffffff#b#.o.",
      "....#b#ffffff#b#..o.",
      "...#yY#ffffff#Yy#.o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "...#bB#bBBBBb#Bb#.o.",
      "....##bBBBBBBb##..o.",
      "...#bBBb####bBBb#.o.",
      "...#bbbb#..#bbbb#...",
      "...#bbbb#..#bbbb#...",
      "...#oooo#..#oooo#...",
      "....####....####...."
    ],

    // 5. 🐺 다이어울프 라이더 (Wolf Rider - Mounted Scout)
    wolfrider_down_0: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEffffED#......",
      "....#DffffffD#......",
      "....#D#ffff#D#......",
      "...#qq#ssss#qq#.....",
      "..#qqqq#ss#qqqq#....",
      ".#qq#qqqqqqqq#qq#...",
      ".#q#qqq####qqq#q#...",
      ".##qqqq#ee#qqqq##...",
      "...#qqq#ww#qqq#.....",
      "...#qqq####qqq#.....",
      "..#qqqqqqqqqqqq#....",
      "..#qqqqssssqqqq#....",
      "..#qqqqssssqqqq#....",
      "...#qqq#..#qqq#.....",
      "...#qqq#..#qqq#.....",
      "...#qqq#..#qqq#.....",
      "...#ooo#..#ooo#.....",
      "....###....###......"
    ],
    wolfrider_down_1: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEffffED#......",
      "....#DffffffD#......",
      "....#D#ffff#D#......",
      "...#qq#ssss#qq#.....",
      "..#qqqq#ss#qqqq#....",
      ".#qq#qqqqqqqq#qq#...",
      ".#q#qqq####qqq#q#...",
      ".##qqqq#ee#qqqq##...",
      "...#qqq#ww#qqq#.....",
      "...#qqq####qqq#.....",
      "..#qqqqqqqqqqqq#....",
      "..#qqqqssssqqqq#....",
      "..#qqqqssssqqqq#....",
      "..#qqq#....#qqq#....",
      "..#qqq#.....#qqq#...",
      "..#qqq#.....#qqq#...",
      "..#ooo#.....#ooo#...",
      "...###.......###...."
    ],
    wolfrider_attack: [
      "......######........",
      ".....#DDDDDD#.....wh",
      "....#DEffffED#...wwh",
      "....#DffffffD#..whhh",
      "....#D#ffff#D#.whhhh",
      "...#qq#ssss#qqwhhhhh",
      "..#qqqq#ss#qqqqwhhhh",
      ".#qq#qqqqqqqq#qq#Gwh",
      ".#q#qqq####qqq#q#.G#",
      ".##qqqq#ee#qqqq##...",
      "...#qqq#ww#qqq#.....",
      "...#qqq####qqq#.....",
      "..#qqqqqqqqqqqq#....",
      "..#qqqqssssqqqq#....",
      "..#qqqqssssqqqq#....",
      "...#qqq#..#qqq#.....",
      "...#qqq#..#qqq#.....",
      "...#qqq#..#qqq#.....",
      "...#ooo#..#ooo#.....",
      "....###....###......"
    ],

    // =========================================================================
    // 6. 🐊 진짜 악어 (Crocodile - Realistic Low Reptile Body & Razor Snout)
    // =========================================================================
    croc_side_0: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "...........#DED#....",
      "..........#DEDLD#...",
      ".....#o##DDEDDDED#..",
      "...#oDDDDDDDDDDEDy#.",
      "..#DDDDDDDDDDDDDDww#",
      ".#oDDDDDDDDDDDDDDww#",
      ".#DDDDD#DDDDDDDDww#.",
      "..#DDDD##DDDD####...",
      "...#o#o#..#o#o#.....",
      "....###....###......"
    ],
    croc_side_1: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "...........#DED#....",
      "..........#DEDLD#...",
      ".....#o##DDEDDDED#..",
      "..#oDDDDDDDDDDDEDy#.",
      ".#DDDDDDDDDDDDDDDww#",
      "..#oDDDDDDDDDDDDDww#",
      "...#DDDD#DDDDDDDww#.",
      "....#DDDD##DDD####..",
      "....#o#o#..#o#o#....",
      ".....###....###....."
    ],
    croc_up_0: [
      ".....####..####.....",
      "....#o#DD##DD#o#....",
      "...#oD#DDDDDD#Do#...",
      "....##DDEDDEDD##....",
      ".....#DDEDDEDD#.....",
      ".....#DDLEDDLD#.....",
      ".....#DDEDDEDD#.....",
      "....#o#DDDDDD#o#....",
      "...#oD#DDDDDD#Do#...",
      "....##DDDDDDDD##....",
      ".....#DDEDDEDD#.....",
      ".....#DDEDDEDD#.....",
      "......#DEDDED#......",
      ".......#DEDD#.......",
      "........#DD#........",
      ".........##........."
    ],
    croc_up_1: [
      ".....####..####.....",
      "...#o#DD#..#DD#o#...",
      "...#oD#DD##DD#Do#...",
      "....##DDDDDDDD##....",
      ".....#DDEDDEDD#.....",
      ".....#DDLEDDLD#.....",
      ".....#DDEDDEDD#.....",
      "....#o#DDDDDD#o#....",
      ".....#oDDDDDD#Do#...",
      "....##DDDDDDDD##....",
      ".....#DDEDDEDD#.....",
      ".....#DDEDDEDD#.....",
      "......#DEDDED#......",
      ".......#DEDD#.......",
      "........#DD#........",
      ".........##........."
    ],

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
      "..#o#......#o#..",
      ".#oko#....#oko#.",
      "..#okG####Gko#..",
      "...#oGRRRRGo#...",
      "..#RRRRRRRRRR#..",
      "..#R#ye##ey#R#..",
      "..#R#ffffff#R#..",
      "...#RR####RR#...",
      "..#rRRgYYgRRr#..",
      ".#rRR#gYYg#RRr#.",
      ".#rR#Gksskk#Rr#.",
      ".#rr#kssssk#rr#.",
      "..##kssssss##...",
      "...#ssssssss#...",
      "..#ss#k##k#ss#..",
      "..#RR#....#RR#.."
    ],
    dragonkin_down_1: [
      "..#o#......#o#..",
      ".#oko#....#oko#.",
      "..#okG####Gko#..",
      "...#oGRRRRGo#...",
      "..#RRRRRRRRRR#..",
      "..#R#ye##ey#R#..",
      "..#R#ffffff#R#..",
      "...#RR####RR#...",
      "..#rRRgYYgRRr#..",
      ".#rRR#gYYg#RRr#.",
      ".#rR#Gksskk#Rr#.",
      ".#rr#kssssk#rr#.",
      "..##kssssss##...",
      "..#ssss##ssss#..",
      ".#ss#......#ss#.",
      ".#RR#......#RR#."
    ],
    dragonkin_attack: [
      "..#o#......#o#..",
      ".#oko#....#oko#.",
      "..#okG####Gko#..",
      "...#oGRRRRGo#..#",
      "..#RRRRRRRRRR#wh",
      "..#R#ee##ee#R#wh",
      "..#R#weeeew#R#Fw",
      "...#RR####RR#Fw#",
      "..#rRRgYYgRRr##.",
      ".#rRR#gYYg#RRr#.",
      ".#rR#Gksskk#Rr#.",
      ".#rr#kssssk#rr#.",
      "..##kssssss##...",
      "...#ssssssss#...",
      "..#ss#k##k#ss#..",
      "..#RR#....#RR#.."
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
    // 🐊 늪지대 맹독 악어 (Crocodile)
    croc_down_0: [
      "......####......",
      ".....#DED#......",
      "....#DEDLD#.....",
      "...#oDEDDDo#....",
      "..#o#DEDDDo#o#..",
      ".#oD#DDDDDo#Do#.",
      "..##DDEDDDD##...",
      "...#DDLEDDD#....",
      "...#DDEDDDD#....",
      "..#o#DDDDDo#o#..",
      ".#oD#DDDDDo#Do#.",
      "..##DDy#yDD##...",
      "...#DEw#wED#....",
      "...#DDw#wDD#....",
      "....#DDED#......",
      ".....####......."
    ],
    croc_down_1: [
      ".......####.....",
      "......#DED#.....",
      ".....#DEDLD#....",
      "...#oDEDDDo#....",
      ".#oD#DEDDDo#....",
      "..##DDDDDo#o#...",
      "...#DDEDDDD#Do#.",
      "...#DDLEDDD##...",
      "..#o#DEDDDD#....",
      ".#oD#DDDDDo#o#..",
      "..##DDDDDo#Do#..",
      "...#DDy#yDD##...",
      "...#DEw#wED#....",
      "...#DDw#wDD#....",
      "....#DDED#......",
      ".....####......."
    ],
    croc_attack: [
      "......####......",
      ".....#DED#......",
      "....#DEDLD#.....",
      "...#oDEDDDo#....",
      "..#o#DEDDDo#o#..",
      ".#oD#DDDDDo#Do#.",
      "..##DDEDDDD##...",
      "...#DDLEDDD#....",
      "...#DDEDDDD#....",
      "..#o#DDDDDo#o#..",
      ".#oD#DDDDDo#Do#.",
      "..##DDy#yDD##...",
      "..#DEw#e#wED#...",
      ".#DDw#eee#wDD#..",
      "..#DDw#e#wDD#...",
      "...####w####...."
    ],

    // 🐇 들토끼 (White Bunny)
    rabbit_down_0: [
      "...##......##...",
      "..#P#....#P#....",
      "..#w#....#w#....",
      "..#w#....#w#....",
      "...#w####w#.....",
      "..#wwwwwwww#....",
      "..#w#e##e#w#....",
      "..#wwwwwwww#....",
      "...#wwwwww#.....",
      "..#wwwwwwww#....",
      ".#wwwwwwwwww#...",
      ".#wwwwwwwwww#...",
      ".#swwwwwwwws#...",
      "..#sww##wws#....",
      "...#ww##ww#.....",
      "...##..##......."
    ],
    rabbit_down_1: [
      "...##......##...",
      "..#P#....#P#....",
      "..#w#....#w#....",
      "..#w#....#w#....",
      "...#w####w#.....",
      "..#wwwwwwww#....",
      "..#w#e##e#w#....",
      "..#wwwwwwww#....",
      "...#wwwwww#.....",
      "..#wwwwwwww#....",
      ".#wwwwwwwwww#...",
      ".#swwwwwwwws#...",
      "..#sww##wws#....",
      "..#ww#..#ww#....",
      ".#ww#....#ww#...",
      ".##........##..."
    ],
    rabbit_attack: [
      "...##......##...",
      "..#P#....#P#....",
      "..#w#....#w#....",
      "...#w####w#.....",
      "..#wwwwwwww#....",
      "..#we#ee#ew#....",
      "..#wwwwwwww#....",
      "...#wwwwww#.....",
      "..#wwwwwwww#....",
      ".#wwwwwwwwww#...",
      ".#swweeeewws#...",
      "..#sww##wws#....",
      "...#ww##ww#.....",
      "...##..##.......",
      "................",
      "................"
    ],

    // 🐄 젖소 (Holstein Cow)
    cow_down_0: [
      "...##......##...",
      "..#s#......#s#..",
      "..#k########k#..",
      ".#kkkwwwwwwkkk#.",
      ".#k#kwwwwwwk#k#.",
      "..#fwwwwwwf#....",
      "...#ffffff#.....",
      "....#yyyy#......",
      "..#kkkwwwwkk#...",
      ".#kkkwwkwwwwk#..",
      ".#kwwwwkwwkkk#..",
      ".#kwwwwkkkkkk#..",
      "..#kwwwwkkkk#...",
      "..#k#s##s#k#....",
      "..#s#s..s#s#....",
      "..###....###...."
    ],
    cow_down_1: [
      "...##......##...",
      "..#s#......#s#..",
      "..#k########k#..",
      ".#kkkwwwwwwkkk#.",
      ".#k#kwwwwwwk#k#.",
      "..#fwwwwwwf#....",
      "...#ffffff#.....",
      "....#yyyy#......",
      "..#kkkwwwwkk#...",
      ".#kkkwwkwwwwk#..",
      ".#kwwwwkwwkkk#..",
      "..#kwwwkkkkk#...",
      "...#k#s##s#k#...",
      "...#s#s..s#s#...",
      "..#s#......#s#..",
      "..###......###.."
    ],
    cow_attack: [
      "...##......##...",
      "..#s#......#s#..",
      "..#k########k#..",
      ".#kkkwwwwwwkkk#.",
      ".#k#kweeewwk#k#.",
      "..#fweeewwf#....",
      "...#ffffff#.....",
      "....#yyyy#......",
      "..#kkkwwwwkk#...",
      ".#kkkwwkwwwwk#..",
      ".#kwwwwkwwkkk#..",
      ".#kwwwwkkkkkk#..",
      "..#kwwwwkkkk#...",
      "..#k#s##s#k#....",
      "..#s#s..s#s#....",
      "..###....###...."
    ],

    // 4. 🐑 목초지 양 (Sheep)
    sheep_down_0: [
      ".....######.....",
      "...##hhhhhh##...",
      "..#hhwhwhwhh#...",
      ".#h#f####f#hh#..",
      ".#h#ffffff#hh#..",
      "..##f##ff##hh#..",
      ".#hhhwhwhwhhh#..",
      "#hwhwhwhwhwhwh#.",
      "#whwhwhwhwhwhw#.",
      "#hwhwhwhwhwhwh#.",
      "#whwhwhwhwhwhw#.",
      ".#hwhwhwhwhwh#..",
      "..##whwhwhw##...",
      "...#o#....#o#...",
      "...#o#....#o#...",
      "...##......##..."
    ],
    sheep_down_1: [
      ".....######.....",
      "...##hhhhhh##...",
      "..#hhwhwhwhh#...",
      ".#h#f####f#hh#..",
      ".#h#ffffff#hh#..",
      "..##f##ff##hh#..",
      ".#hhhwhwhwhhh#..",
      "#hwhwhwhwhwhwh#.",
      "#whwhwhwhwhwhw#.",
      "#hwhwhwhwhwhwh#.",
      "#whwhwhwhwhwhw#.",
      ".#hwhwhwhwhwh#..",
      "..##whwhwhw##...",
      "..#o#......#o#..",
      "..#o#......#o#..",
      "..##........##.."
    ],
    sheep_attack: [
      ".....######.....",
      "...##hhhhhh##...",
      "..#hhwhwhwhh#...",
      ".#h#f####f#hh#..",
      ".#h#ffffff#hh#..",
      "..##feeffeehh#..",
      ".#hhhwhwhwhhh#..",
      "#hwhwhwhwhwhwh#.",
      "#whwhwhwhwhwhw#.",
      "#hwhwhwhwhwhwh#.",
      "#whwhwhwhwhwhw#.",
      ".#hwhwhwhwhwh#..",
      "..##whwhwhw##...",
      "...#o#....#o#...",
      "...#o#....#o#...",
      "...##......##..."
    ],

    // 5. 🐐 바위 산양 (Mountain Goat)
    goat_down_0: [
      "...###....###...",
      "..#zz#....#zz#..",
      "...#z#....#z#...",
      "....#zz##zz#....",
      "...#qqqqqqqq#...",
      "..#qq#k##k#qq#..",
      "...#qqqqqqqq#...",
      "....#qqwwqq#....",
      ".....#wwww#.....",
      "...#qqqqqqqq#...",
      "..#qqqqqqqqqq#..",
      "..#qqqqqqqqqq#..",
      "...#qqqqqqqq#...",
      "...#ss#..#ss#...",
      "...#ss#..#ss#...",
      "...###....###..."
    ],
    goat_down_1: [
      "...###....###...",
      "..#zz#....#zz#..",
      "...#z#....#z#...",
      "....#zz##zz#....",
      "...#qqqqqqqq#...",
      "..#qq#k##k#qq#..",
      "...#qqqqqqqq#...",
      "....#qqwwqq#....",
      ".....#wwww#.....",
      "...#qqqqqqqq#...",
      "..#qqqqqqqqqq#..",
      "..#qqqqqqqqqq#..",
      "...#qqqqqqqq#...",
      "..#ss#....#ss#..",
      "..#ss#....#ss#..",
      "..###......###.."
    ],
    goat_attack: [
      "..###......###..",
      ".#zz#......#zz#.",
      "..#zz#....#zz#..",
      "...#zz####zz#...",
      "...#qqqqqqqq#...",
      "..#qq#e##e#qq#..",
      "...#qqqqqqqq#...",
      "....#qqwwqq#....",
      ".....#wwww#.....",
      "...#qqqqqqqq#...",
      "..#qqqqqqqqqq#..",
      "..#qqqqqqqqqq#..",
      "...#qqqqqqqq#...",
      "...#ss#..#ss#...",
      "...#ss#..#ss#...",
      "...###....###..."
    ],

    // 6. 🐔 [CUTE FANTASY] 시골 흰 암탉 & 둥지에서 잠자는 갈색 암탉 (Reference Image Match)
    chicken_down_0: [
      "................",
      "......#R#.......",
      ".....#RRR#......",
      ".....#www#y#....",
      "....#wwkww##....",
      "....#wwwwww#....",
      "...#wwwwwwww#...",
      "...#wwwwwwww#...",
      "...#wwwwwwww#...",
      "....#wwwwww#....",
      ".....#wwww#.....",
      "......#yy#......",
      "......#..#......",
      "................",
      "................",
      "................"
    ],
    chicken_down_1: [
      "................",
      "......#R#.......",
      ".....#RRR#......",
      ".....#www#y#....",
      "....#wwkww##....",
      "....#wwwwww#....",
      "...#wwwwwwww#...",
      "...#wwwwwwww#...",
      "...#wwwwwwww#...",
      "....#wwwwww#....",
      ".....#wwww#.....",
      ".....#y..y#.....",
      ".....#....#.....",
      "................",
      "................",
      "................"
    ],
    chicken_attack: [
      "................",
      "......#R#.......",
      ".....#RRR#......",
      "......#ww#......",
      ".....#wwkw#.....",
      "....#wwwwww#y#..",
      "...#wwwwwwww##..",
      "...#wwwwwwww#...",
      "...#wwwwwwww#...",
      "....#wwwwww#....",
      ".....#wwww#.....",
      "......#yy#......",
      "......#..#......",
      "................",
      "................",
      "................"
    ],
    chicken_sleep: [
      "......#r#.......",
      ".....#rrr#......",
      ".....#OOO#y#....",
      "....#OO-OO##....",
      "....#OOOOOO#....",
      "...#OOOOOOOO#...",
      "...#lltlltll#...",
      "..#tttttttttt#..",
      "..#tttttttttt#..",
      "...##########...",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],

    // 7. 🐬 대양 돌고래 (Ocean Dolphin)
    dolphin_down_0: [
      ".......##.......",
      "......#cc#......",
      ".....#cccc#.....",
      "....#cccccc#....",
      "...#cccwcccc#...",
      "..#cccccccccc#..",
      ".#cccccccccccc#.",
      "#ccwhhhhhhwwcc#.",
      ".#ccwhhhhwwcc#..",
      "..#cccccccc#....",
      "...#cccccc#.....",
      "....#cccc#......",
      ".....#cc#.......",
      "....#cccc#......",
      "...#cc##cc#.....",
      "...##....##....."
    ],
    dolphin_down_1: [
      ".......##.......",
      "......#cc#......",
      ".....#cccc#.....",
      "....#cccccc#....",
      "...#cccwcccc#...",
      "..#cccccccccc#..",
      ".#cccccccccccc#.",
      "#ccwhhhhhhwwcc#.",
      ".#ccwhhhhwwcc#..",
      "..#cccccccc#....",
      "...#cccccc#.....",
      "....#cccc#......",
      ".....#cc#.......",
      ".....#cc#.......",
      "....#cccc#......",
      "....##..##......"
    ],
    dolphin_attack: [
      ".......##.......",
      "......#cc#......",
      ".....#cccc#.....",
      "....#cccccc#....",
      "...#cccCcccc#...",
      "..#ccccCCCCCC#..",
      ".#cccccccccccc#.",
      "#ccwhhhhhhwwcc#.",
      ".#ccwhhhhwwcc#..",
      "..#cccccccc#....",
      "...#cccccc#.....",
      "....#cccc#......",
      ".....#cc#.......",
      "....#cccc#......",
      "...#cc##cc#.....",
      "...##....##....."
    ],

    // 7. 🦎 화산 흑요석 불꽃도마뱀 (Salamander)
    salamander_down_0: [
      "......#Y#.......",
      ".....#yRy#......",
      "....#kRkRk#.....",
      "...#okRRRko#....",
      "..#o#kRRRk#o#...",
      ".#ok#kkkkk#ko#..",
      "..##kRkkRkk##...",
      "...#kkRRRkk#....",
      "...#kkkRkkk#....",
      "..#o#kkkkk#o#...",
      ".#ok#kkkkk#ko#..",
      "..##kye#eyk##...",
      "...#kkRRRkk#....",
      "...#kkkkkkk#....",
      "....#kkkkk#.....",
      ".....#####......"
    ],
    salamander_down_1: [
      ".......#Y#......",
      "......#yRy#.....",
      ".....#kRkRk#....",
      "...#okRRRko#....",
      ".#ok#kRRRk#.....",
      "..##kkkkk#ko#...",
      "...#kRkkRkk##...",
      "...#kkRRRkk#....",
      "..#o#kkkRkkk#...",
      ".#ok#kkkkk#o#...",
      "..##kkkkk#ko#...",
      "...##kye#eyk##..",
      "...#kkRRRkk#....",
      "...#kkkkkkk#....",
      "....#kkkkk#.....",
      ".....#####......"
    ],
    salamander_attack: [
      ".....#YYY#......",
      "....#yRRRy#.....",
      "...#kRRRRRk#....",
      "...#okRRRko#....",
      "..#o#kRRRk#o#...",
      ".#ok#kkkkk#ko#..",
      "..##kRkkRkk##...",
      "..#kkRRRRRkk#...",
      "...#kkkRkkk#....",
      "..#o#kkkkk#o#...",
      ".#ok#kkkkk#ko#..",
      "..##keeeeee##...",
      "..#kkRRRRRkk#...",
      "...#kkkkkkk#....",
      "....#kkkkk#.....",
      ".....#####......"
    ],

    // 8. 🦊 사막 수인족 (Beastkin Nomad)
    beastkin_down_0: [
      "...#d#....#d#...",
      "..#dFd#..#dFd#..",
      "..#dffffffffd#..",
      ".#dffffffffffd#.",
      ".#df#k####k#fd#.",
      "..#ffffffffff#..",
      "..#f#ff##ff#f#..",
      "...#d#ffff#d#...",
      "...#OO####OO#...",
      "..#OOOlyylOOO#..",
      ".#d#OOlyylOO#d#.",
      ".#d#ffffffff#d#.",
      "..##OOOOOOOO##..",
      "...#OO#..#OO#...",
      "...#ll#..#ll#...",
      "...###....###..."
    ],
    beastkin_down_1: [
      "...#d#....#d#...",
      "..#dFd#..#dFd#..",
      "..#dffffffffd#..",
      ".#dffffffffffd#.",
      ".#df#k####k#fd#.",
      "..#ffffffffff#..",
      "..#f#ff##ff#f#..",
      "...#d#ffff#d#...",
      "...#OO####OO#...",
      "..#OOOlyylOOO#..",
      ".#d#OOlyylOO#d#.",
      ".#d#ffffffff#d#.",
      "..##OOOOOOOO##..",
      "..#OO#....#OO#..",
      "..#ll#....#ll#..",
      "..###......###.."
    ],
    beastkin_attack: [
      "...#d#....#d#...",
      "..#dFd#..#dFd#..",
      "..#dffffffffd#..",
      ".#dffffffffffd#.",
      ".#df#e####e#fd#.",
      "..#ffffffffff#..",
      "..#f#ff##ff#f#..",
      "...#d#ffff#d#..#",
      "...#OO####OO##wh",
      "..#OOOlyylOO#wwh",
      ".#d#OOlyylOO#wh#",
      ".#d#ffffffff##..",
      "..##OOOOOOOO##..",
      "...#OO#..#OO#...",
      "...#ll#..#ll#...",
      "...###....###..."
    ],

    // 10. 🐙 심연의 군주 크라켄 (Kraken World Boss)
    kraken_down_0: [
      "......######......",
      "....#pppppppp#....",
      "...#ppvvvvvvpp#...",
      "..#ppvvPPPPvvpp#..",
      "..#ppvPkeekPvpp#..",
      "..#ppvPkeekPvpp#..",
      "..#ppvvPPPPvvpp#..",
      "...#ppvvvvvvpp#...",
      "...#pppppppppp#...",
      "..#p#pppppppp#p#..",
      ".#pP#pp####pp#Pp#.",
      "#pP#p#......#p#Pp#",
      "#pp#p#......#p#pp#",
      ".##.#p#....#p#.##.",
      "....#Pp#..#pP#....",
      ".....##....##....."
    ],
    kraken_down_1: [
      "......######......",
      "....#pppppppp#....",
      "...#ppvvvvvvpp#...",
      "..#ppvvPPPPvvpp#..",
      "..#ppvPkeekPvpp#..",
      "..#ppvPkeekPvpp#..",
      "..#ppvvPPPPvvpp#..",
      "...#ppvvvvvvpp#...",
      "...#pppppppppp#...",
      "..#p#pppppppp#p#..",
      ".#pP#pp####pp#Pp#.",
      ".#pp#p#....#p#pp#.",
      "#pP#p#......#p#Pp#",
      "#pp#p#......#p#pp#",
      ".##.#Pp#..#pP#.##.",
      ".....##....##....."
    ],
    kraken_attack: [
      "......######......",
      "....#pppppppp#....",
      "...#ppvvvvvvpp#...",
      "..#ppvvPPPPvvpp#..",
      "..#ppvPeeeePvpp#..",
      "..#ppvPeeeePvpp#..",
      "..#ppvvPPPPvvpp#..",
      "...#ppvvvvvvpp#...",
      "..#pppppppppppp#..",
      ".#pP#pppppppp#Pp#.",
      ".#pP#pp####pp#Pp#.",
      "#pp#p#......#p#pp#",
      "#pP#p#......#p#Pp#",
      ".##.#p#....#p#.##.",
      "....#Pp#..#pP#....",
      ".....##....##....."
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
      // Loreon Kingdom 고유 비주얼 맵핑 (Knight Commander, Duchess, Ranger, Mage, Wolf Rider)
      const eName = e.name || '';
      const eSub = e.subClass || '';

      if (e.role === 'commander' || eName.includes('커맨더') || eName.includes('사령관') || eSub.includes('사령관')) {
        return 'commander';
      }
      if (e.role === 'duchess' || eName.includes('여공작') || eName.includes('공작부인') || eSub.includes('공작')) {
        return 'duchess';
      }
      if (e.role === 'ranger' || e.role === 'archer' || eName.includes('궁수') || eName.includes('레인저') || eSub.includes('순찰대')) {
        return 'archer';
      }
      if (e.role === 'mage' || e.role === 'wizard' || eName.includes('마법사') || eName.includes('마도사') || eSub.includes('마도사')) {
        return 'mage';
      }
      if (e.role === 'wolfrider' || eName.includes('늑대기수') || eName.includes('울프라이더') || eSub.includes('늑대기사')) {
        return 'wolfrider';
      }

      if (e.role === 'player') {
        if (e.race === 'dragonkin') return 'dragonkin';
        if (e.race === 'beastkin') return 'beastkin';
        if (e.race === 'elf') return 'elf';
        if (e.race === 'dwarf') return 'dwarf';
        return 'hero';
      }
      if (e.role === 'king') {
        if (e.race === 'beastkin' || (e.subClass && e.subClass.includes('술탄'))) return 'beastkin';
        return 'king';
      }
      if (e.role === 'priest' || e.role === 'cleric' || (e.subClass && e.subClass.includes('사제'))) return 'priest';
      if (e.role === 'merchant') {
        if (e.race === 'beastkin') return 'beastkin';
        return 'merchant';
      }
      if (e.race === 'dragonkin' || e.role === 'dragonkin') return 'dragonkin';
      if (e.race === 'beastkin' || e.role === 'beastkin') return 'beastkin';
      if (e.race === 'elf') return 'elf';
      if (e.race === 'dwarf') return 'dwarf';
      if (e.role === 'royal_guard' || e.role === 'guard') return 'guard';
      if (e.role === 'crusader') return 'crusader';
      if (e.role === 'soldier') {
        if (e.homeId && (e.homeId.includes('necropolis') || e.homeId.includes('obsidian'))) return 'skeleton';
        if (e.race === 'beastkin') return 'beastkin';
        if (e.race === 'elf') return 'elf';
        if (e.race === 'dwarf') return 'dwarf';
        return (e.id % 3 === 0) ? 'crusader' : ((e.id % 2 === 0) ? 'guard' : 'knight');
      }

      // 전문 직업군
      if (e.role === 'farmer') {
        if (e.race === 'beastkin') return 'beastkin';
        if (e.race === 'elf') return 'elf';
        if (e.race === 'dwarf') return 'dwarf';
        return 'farmer';
      }
      if (e.role === 'miner') {
        if (e.race === 'dwarf') return 'dwarf';
        return 'miner';
      }
      if (e.role === 'blacksmith') {
        if (e.race === 'dwarf') return 'dwarf';
        return 'blacksmith';
      }
      if (e.role === 'fisherman') return 'fisherman';
      if (e.role === 'bard') return 'bard';

      if (e.role === 'adventurer' || e.role === 'mercenary') {
        if (e.race === 'dwarf') return 'dwarf';
        if (e.race === 'elf') return 'elf';
        if (e.race === 'beastkin') return 'beastkin';
        if (e.race === 'dragonkin') return 'dragonkin';
        if (e.race === 'undead') return 'skeleton';
        return (e.id % 2 === 0) ? 'paladin' : 'crusader';
      }

      // 몬스터 정밀 세부 분류 (Individual Visual Identity)
      if (e.role === 'monster') {
        const name = e.name || '';
        const sub = e.subClass || '';
        const mtype = e.monsterType || '';

        // 해양 군주
        if (mtype === 'kraken' || name.includes('크라켄')) return 'kraken';

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

        // 11. 악어 / 샐러맨더 몬스터
        if (mtype === 'croc' || name.includes('악어')) return 'croc';
        if (mtype === 'salamander' || name.includes('샐러맨더') || name.includes('도마뱀')) return 'salamander';

        // 12. 기타
        if (name.includes('슬라임')) return 'slime';
        if (name.includes('박쥐')) return 'bat';
        if (name.includes('늑대')) return 'wolf';

        return (e.id % 4 === 0) ? 'orc' : ((e.id % 3 === 0) ? 'skeleton' : ((e.id % 2 === 0) ? 'goblin_archer' : 'goblin'));
      }

      // 동물 (야생 동물 고유 디자인 맵핑)
      if (e.role === 'animal') {
        const at = e.animalType;
        if (at === 'croc') return 'croc';
        if (at === 'rabbit') return 'rabbit';
        if (at === 'cow') return 'cow';
        if (at === 'sheep') return 'sheep';
        if (at === 'goat') return 'goat';
        if (at === 'dolphin') return 'dolphin';
        if (at === 'salamander') return 'salamander';
        if (at === 'scorpion') return 'scorpion';
        if (at === 'horse') return 'horse';
        if (at === 'bear') return 'bear';
        if (at === 'wolf') return (e.name && (e.name.includes('서리') || e.name.includes('빙결'))) ? 'wolf_frost' : 'wolf';
        if (at === 'turtle') return 'turtle';
        if (at === 'camel') return 'camel';
        if (at === 'deer') return 'deer';
        if (at === 'chicken') return 'chicken';

        const name = e.name || '';
        if (name.includes('닭') || name.includes('치킨')) return 'chicken';
        if (name.includes('악어')) return 'croc';
        if (name.includes('토끼')) return 'rabbit';
        if (name.includes('소') || name.includes('젖소')) return 'cow';
        if (name.includes('산양')) return 'goat';
        if (name.includes('양')) return 'sheep';
        if (name.includes('돌고래')) return 'dolphin';
        if (name.includes('도마뱀') || name.includes('샐러맨더')) return 'salamander';
        if (name.includes('전갈')) return 'scorpion';
        if (name.includes('거북')) return 'turtle';
        if (name.includes('낙타')) return 'camel';
        if (name.includes('곰')) return 'bear';
        if (name.includes('늑대')) return 'wolf';
        if (name.includes('사슴') || name.includes('백록')) return 'deer';

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
      // 0순위: 공격 모션 (Attack Frame) 우선 검색
      if (animFrame === 'attack') {
        const directAttack = `${baseKey}_${dir}_attack${isFacingLeft ? '_left' : ''}`;
        if (this.cache.has(directAttack)) return this.cache.get(directAttack);
        const attackKey = `${baseKey}_attack${isFacingLeft ? '_left' : ''}`;
        if (this.cache.has(attackKey)) return this.cache.get(attackKey);
        if (this.cache.has(`${baseKey}_attack`)) return this.cache.get(`${baseKey}_attack`);
      }

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
      const isAttacking = (e.state === 'combat' && (Math.sin(timeSec * 8 + (e.id || 0)) > 0.15)) || ((e.attackCooldown || 0) > 0.08);
      const isMoving = Math.abs(e.vx || 0) > 0.08 || Math.abs(e.vy || 0) > 0.08;

      // 2. 애니메이션 프레임 산출 (보행 시 균형 잡힌 0/1 스텝)
      let animFrame = '0';
      if (baseKey === 'chicken' && (e.isSleeping || e.state === 'sleeping')) {
        animFrame = 'sleep';
      } else if (isAttacking) {
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

      // 잠자는 닭 상공 'Zzz' 수면 말풍선 파티클 (Reference Image Match)
      if (baseKey === 'chicken' && animFrame === 'sleep') {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        const zBob = Math.sin(timeSec * 3 + (e.id || 0)) * 2;
        ctx.fillText('z', px + 3, py - 9 * sc + zBob);
        ctx.fillText('Z', px + 7, py - 14 * sc + zBob * 1.2);
      }

      // 7. 피격 시 선명한 적색 플래시 틴트
      if (e.hitTimer && e.hitTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.40)';
        ctx.fillRect(renderX, renderY, renderW, renderH);
        ctx.restore();
      }

      // 8. [CUTE FANTASY 스타일] 3단 연속 콤보 참격호 (Combo Slash Arc Trail: 1타 전방, 2타 어퍼크로스, 3타 360도 회전베기 피니셔)
      if (isAttacking) {
        ctx.save();
        const sideSign = isFacingLeft ? -1 : 1;
        let slashColor = '#ffffff';
        let glowColor = 'rgba(186, 230, 253, 0.75)'; // 밝은 하늘빛 잔상 (Cute Fantasy Glow)
        if (baseKey === 'dragonkin' || baseKey === 'fire_golem' || baseKey === 'hellhound' || baseKey === 'salamander') {
          slashColor = '#fef08a'; glowColor = 'rgba(249, 115, 22, 0.8)';
        } else if (baseKey === 'ice_golem' || baseKey === 'yeti' || baseKey === 'wolf_frost') {
          slashColor = '#ffffff'; glowColor = 'rgba(56, 189, 248, 0.85)';
        } else if (baseKey === 'lich' || baseKey === 'reaper' || baseKey === 'orc_shaman' || baseKey === 'kraken') {
          slashColor = '#f3e8ff'; glowColor = 'rgba(192, 132, 252, 0.85)';
        } else if (baseKey === 'goblin' || baseKey === 'goblin_archer' || baseKey === 'treant' || baseKey === 'slime' || baseKey === 'croc') {
          slashColor = '#f0fdf4'; glowColor = 'rgba(74, 222, 128, 0.85)';
        }

        const arcCenterX = px + (dir === 'left' ? -12 : (dir === 'right' ? 12 : 0)) * sc;
        const arcCenterY = py - 7 * sc - bounce + (dir === 'down' ? 6 : (dir === 'up' ? -6 : 0)) * sc;

        if (e.comboStep === 3) {
          // 💥 [3단계 피니셔] 360도 전방위 골든 회전참격호 (Giant 360 Spin Cleave Finisher)
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
          ctx.lineWidth = 5.5 * sc;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(px, py - 6 * sc, 17 * sc, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.8 * sc;
          ctx.beginPath();
          ctx.arc(px, py - 6 * sc, 17 * sc, 0, Math.PI * 2);
          ctx.stroke();

          // 8방향 스타버스트 스파크 & 불꽃 파편
          for (let a = 0; a < 8; a++) {
            const ang = (Math.PI / 4) * a;
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(px + Math.cos(ang) * 19 * sc, py - 6 * sc + Math.sin(ang) * 19 * sc, 3 * sc, 3 * sc);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(px + Math.cos(ang + 0.2) * 21 * sc, py - 6 * sc + Math.sin(ang + 0.2) * 21 * sc, 2 * sc, 2 * sc);
          }
        } else if (e.comboStep === 2) {
          // 💥 [2단계 콤보] 대각선 어퍼 크로스 참격호 (Uppercut Cross Slash - Amber Orange Glow)
          const startAng = isFacingLeft ? -Math.PI * 0.25 : Math.PI * 0.75;
          const endAng = isFacingLeft ? Math.PI * 0.45 : -Math.PI * 0.05;
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
          ctx.lineWidth = 5.0 * sc;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(arcCenterX, arcCenterY, 15 * sc, startAng, endAng, !isFacingLeft);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.6 * sc;
          ctx.beginPath();
          ctx.arc(arcCenterX, arcCenterY, 15 * sc, startAng + 0.1, endAng - 0.1, !isFacingLeft);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(arcCenterX + sideSign * 13 * sc, arcCenterY - 8 * sc, 3 * sc, 3 * sc);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(arcCenterX + sideSign * 16 * sc, arcCenterY + 2 * sc, 2.5 * sc, 2.5 * sc);
        } else {
          // 💥 [1단계 기본] 전방 순백 크레센트 참격호 (Pure White Crescent Core)
          const startAng = isFacingLeft ? Math.PI * 0.65 : -Math.PI * 0.35;
          const endAng = isFacingLeft ? Math.PI * 1.35 : Math.PI * 0.35;

          // 1. 외곽 푸른빛 에너지 잔상 (Tapered Outer Glow)
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 4.5 * sc;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(arcCenterX, arcCenterY, 14 * sc, startAng, endAng, isFacingLeft);
          ctx.stroke();

          // 2. 내부 순백의 날카로운 참격 코어
          ctx.strokeStyle = slashColor;
          ctx.lineWidth = 2.4 * sc;
          ctx.beginPath();
          ctx.arc(arcCenterX, arcCenterY, 14 * sc, startAng + 0.1, endAng - 0.1, isFacingLeft);
          ctx.stroke();

          // 3. 팁 스파크 & 별빛 궤적 파편
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(arcCenterX + sideSign * 12 * sc, arcCenterY - 7 * sc, 3 * sc, 3 * sc);
          ctx.fillRect(arcCenterX + sideSign * 16 * sc, arcCenterY, 2.5 * sc, 2.5 * sc);
          ctx.fillRect(arcCenterX + sideSign * 13 * sc, arcCenterY + 6 * sc, 2 * sc, 2 * sc);
          ctx.fillStyle = glowColor;
          ctx.fillRect(arcCenterX + sideSign * 10 * sc, arcCenterY - 9 * sc, 2 * sc, 2 * sc);
          ctx.fillRect(arcCenterX + sideSign * 18 * sc, arcCenterY - 2 * sc, 1.5 * sc, 1.5 * sc);
        }
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

      // 🛡️ 방패 렌더링 (일반 파지 & 패링 가드 전방 거치 자세)
      const hasShieldActive = shieldId || (e && (e.isParrying || e.shieldBlockTimer > 0));
      if (hasShieldActive && (dir === 'down' || dir === 'left' || dir === 'right' || dir === 'up')) {
        const sCvs = window.PixelItems.getCanvas(shieldId || 'shield_iron');
        if (sCvs) {
          ctx.save();
          if (e && (e.isParrying || e.shieldBlockTimer > 0)) {
            // 전방 거치 방패 가드 자세 (Forward braced shield)
            const fwdX = dir === 'left' ? -9 * sc : (dir === 'right' ? 9 * sc : 0);
            const fwdY = dir === 'up' ? -13 * sc : (dir === 'down' ? -4 * sc : -8 * sc);
            ctx.translate(px + fwdX, py + fwdY - bounce);
            ctx.drawImage(sCvs, -7 * sc, -7 * sc, 14 * sc, 14 * sc);

            // 🛡️ 마법 방패 펄스 배리어 링
            ctx.strokeStyle = (e.parryTimer > 0) ? '#38bdf8' : 'rgba(148, 163, 184, 0.65)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 0, 10 * sc, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            const shieldX = px - sideSign * 7 * sc;
            const shieldY = py - 9 * sc - bounce;
            ctx.drawImage(sCvs, shieldX - 6 * sc, shieldY - 7 * sc, 13 * sc, 13 * sc);
          }
          ctx.restore();
        }
      }
    }
  }

  window.PixelSprites = new PixelSpriteAtlas();
})(typeof window !== 'undefined' ? window : global);
