// ============================================================================
// pixel_sprites.js - High-Resolution RPG Pixel Art Engine (32x32 & 24x24)
// Multi-Tier Shaded Pixel Art for Heroes, NPC Professions, Monsters, Animals, Bosses
// Offscreen Canvas Caching, Left/Right Flip, Animated Status Balloons, Combat FX
// ============================================================================

(function(window) {
  'use strict';

  // 1. 공통 6단계 명암 마스터 팔레트 (Master 6-Tier Color Palette)
  const PALETTE = {
    '.': null,                     // 투명 (Transparent)
    '#': '#0b0f19',                // 외곽선 1px 다크 콘투어 (Dark Slate Contour)
    'k': '#1e293b',                // 심연 암영 (Deep Shadow)
    's': '#475569',                // 강철/의복 그림자 (Dark Steel/Slate)
    'm': '#94a3b8',                // 강철/무기 기본 (Mid Steel)
    'h': '#e2e8f0',                // 강철 하이라이트 (Bright Steel)
    'w': '#ffffff',                // 순백 광택 / 눈 흰자 (Pure White Shine)
    'f': '#fed7aa',                // 피부 기본 (Flesh Tone)
    'F': '#ea580c',                // 피부 음영 (Flesh Shadow)
    'd': '#9a3412',                // 짙은 피부 그림자 / 적갈색 (Deep Auburn)
    'r': '#991b1b',                // 진홍색 / 망토 음영 (Dark Crimson)
    'R': '#dc2626',                // 루비 / 붉은 깃털 / 망토 (Ruby Red)
    'e': '#ef4444',                // 밝은 주홍 / 안광 (Bright Red)
    'g': '#854d0e',                // 황금 짙은 그림자 (Deep Gold Shadow)
    'G': '#ca8a04',                // 황금 음영 (Gold Shadow)
    'y': '#facc15',                // 황금빛 (Bright Gold)
    'Y': '#fef08a',                // 연노랑 하이라이트 (Pale Gold Shine)
    'b': '#1e3a8a',                // 로열 블루 암영 (Navy Blue)
    'B': '#2563eb',                // 로열 블루 갑주/로브 (Royal Blue)
    'u': '#3b82f6',                // 밝은 블루 하이라이트 (Sky Blue)
    'c': '#0284c7',                // 비전 청록 / 마법 (Arcane Cyan)
    'C': '#38bdf8',                // 발광 청록 (Glow Cyan)
    'p': '#581c87',                // 심연 보라 암영 (Deep Purple)
    'P': '#9333ea',                // 심연 보라 / 흑마법 (Purple)
    'v': '#c084fc',                // 비전 수정 라벤더 (Amethyst)
    'g1': '#14532d',               // 숲/녹색 암영 (Dark Forest Green)
    'g2': '#16a34a',               // 에메랄드 녹색 (Emerald Green)
    'g3': '#4ade80',               // 라임 하이라이트 (Lime Glow)
    'o': '#451a03',                // 짙은 흑목재 (Dark Timber)
    'O': '#78350f',                // 가죽 갈색 (Leather Brown)
    'l': '#b45309',                // 밝은 목재 / 모래빛 (Light Wood)
    't': '#fcd34d',                // 짚모자/밀짚 노랑 (Straw Yellow)
    'z': '#334155'                 // 건메탈 (Gunmetal)
  };

  // 2. 8x8 픽셀 생태계 상태 풍선 (Ecology Status Balloons)
  const BALLOON_SPRITES = {
    // 🌾 농사/수확
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
    // ⛏️ 채광
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
    // 🔨 대장간 단조
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
    // 🎣 낚시
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
    // 💤 수면/휴식
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
    // ⚔️ 전투
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
    // 🍺 주점/휴식
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
    // 🎵 바드 연주
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
    // ❗ 경비/경계
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
    // ❤️ 치유/호감
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

  // 3. 24x24 / 16x16 원형 스프라이트 데이터 (Raw Sprite Matrices)
  const RAW_SPRITES = {
    // ------------------------------------------------------------------------
    // [A] 플레이어 영웅 (High-Res Player Hero)
    // ------------------------------------------------------------------------
    hero_walk_0: [
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
    hero_walk_1: [
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
    hero_attack: [
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

    // ------------------------------------------------------------------------
    // [B] 왕국 주민 & 직업군 (Ecology Professions)
    // ------------------------------------------------------------------------
    // 농부 (밀짚모자, 작업 멜빵, 괭이)
    farmer: [
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
    // 광부 (안전모 & 램프, 곡괭이, 가죽 앞치마)
    miner: [
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
    // 대장장이 (가죽 앞치마, 망치, 굵은 수염)
    blacksmith: [
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
    // 어부 (방수 모자, 낚시 조끼, 낚싯대)
    fisherman: [
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
    // 바드 / 음유시인 (깃털 모자, 화려한 튜닉, 류트)
    bard: [
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
    // 경비병 / 가디언 (깃발 장창, 전면 투구, 타워실드)
    guard: [
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

    // ------------------------------------------------------------------------
    // [C] 기사단 및 고위 클래스
    // ------------------------------------------------------------------------
    knight: [
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
    paladin: [
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
    wizard: [
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
    king: [
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
    elf: [
      ".....######.....",
      "....#yYYYYy#....",
      "...#yYYYYYYy#...",
      "...#f#ffff#f#...",
      "..#ff#ff##ff#...",
      "..#ffffffff#....",
      "...#ffffff#.....",
      "..#gg####gg#....",
      ".#gg#g2g2#gg#...",
      ".#f#gg22gg#f#...",
      "..#gggggggg#....",
      "...##gggg##.....",
      "...#oooooo#.....",
      "..#oo#..#oo#....",
      "..####..####....",
      "................"
    ],
    dwarf: [
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

    // ------------------------------------------------------------------------
    // [D] 몬스터 & 보스 (Monsters & Bosses)
    // ------------------------------------------------------------------------
    skeleton: [
      ".....######.....",
      "....#hhhhhh#....",
      "...#hhkkkkhh#...",
      "...#h#kk##kh#...",
      "...#hkkkkkkh#...",
      "....#hkhhkh#....",
      ".....#hhhh#.....",
      "....##ssss##....",
      "...#h#ssss#h#...",
      "..#hh#smmms#hh#.",
      "..#hh#smmms#hh#.",
      "...##ssssss##...",
      "....#h#..#h#....",
      "...#hh#..#hh#...",
      "...#hh#..#hh#...",
      "...###....###..."
    ],
    reaper: [
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
    goblin: [
      "....########....",
      "..##eEeeeeEe##..",
      ".#eEe#ffff#eEe#.",
      "#eEe#ffffff#eEe#",
      "#eE#fRffffRf#Ee#",
      "#ee#fffffffff#ee",
      ".##ffffffffff##.",
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
    orc: [
      "....########....",
      "..##g1g2g1g2##..",
      ".#g2#ffffff#g2#.",
      "#g2#fRffffRf#g2#",
      "#g2#fffffffff#g2",
      ".#g2#ffffff#g2#.",
      "..##f#ffff#f##..",
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
    slime: [
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
    bat: [
      "................",
      "#k#..........#k#",
      "#kk#........#kk#",
      "#kkk#..##..#kkk#",
      ".#kkk##kk##kkk#.",
      "..#kkkkRkRkkk#..",
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

    // ------------------------------------------------------------------------
    // [E] 탈것 및 동물 (Mounts & Animals)
    // ------------------------------------------------------------------------
    horse: [
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
    bear: [
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
    deer: [
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
    turtle: [
      "................",
      "................",
      "................",
      ".....######.....",
      "...##gggggg##...",
      "..#gggggggggg#..",
      ".#gggGgGgGgggg#.",
      ".#ggGgGgGgGggg#e",
      "#gggGgGgGgggg#ee",
      ".#gggggggggggg#e",
      "..#gggggggggg#..",
      "...##gggggg##...",
      "..#gg######gg#..",
      "..####....####..",
      "................",
      "................"
    ],
    camel: [
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

      // 1. 캐릭터 & 몬스터 스프라이트 오프스크린 캔버스 캐싱
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
        for (let c = 0; c < w; c++) {
          const char = rows[r][c];
          const color = PALETTE[char];
          if (color) {
            ctxNorm.fillStyle = color;
            ctxNorm.fillRect(c, r, 1, 1);

            ctxFlip.fillStyle = color;
            ctxFlip.fillRect(w - 1 - c, r, 1, 1);
          }
        }
      }

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
        for (let c = 0; c < w; c++) {
          const char = rows[r][c];
          const color = PALETTE[char];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(c * 2, r * 2, 2, 2);
          }
        }
      }
      this.balloonCache.set(key, cv);
    }

    // 엔티티 직업/역할에 따른 스프라이트 분기
    getSpriteKeyForEntity(e) {
      if (e.role === 'player') {
        if (e.state === 'combat') return 'hero_attack';
        const frame = Math.floor((e.animPhase || 0) * 2) % 2;
        return frame === 1 ? 'hero_walk_1' : 'hero_walk_0';
      }
      if (e.role === 'king') return 'king';
      if (e.role === 'royal_guard' || e.role === 'guard') return 'guard';
      if (e.role === 'soldier') return 'knight';

      // 전문 직업군
      if (e.role === 'farmer') return 'farmer';
      if (e.role === 'miner') return 'miner';
      if (e.role === 'blacksmith') return 'blacksmith';
      if (e.role === 'fisherman') return 'fisherman';
      if (e.role === 'bard') return 'bard';

      if (e.role === 'adventurer' || e.role === 'mercenary') {
        if (e.race === 'dwarf') return 'dwarf';
        if (e.race === 'elf') return 'elf';
        return (e.id % 2 === 0) ? 'paladin' : 'knight';
      }

      if (e.role === 'merchant') return 'bard';

      // 몬스터
      if (e.role === 'monster') {
        if (e.subClass && e.subClass.includes('언데드') || e.name.includes('스켈레톤') || e.homeId === 'obsidian_necropolis') {
          return e.hp > 200 ? 'reaper' : 'skeleton';
        }
        if (e.subClass && e.subClass.includes('오크') || e.homeId === 'orc_stronghold') {
          return 'orc';
        }
        if (e.name.includes('슬라임')) return 'slime';
        if (e.name.includes('박쥐')) return 'bat';
        return 'goblin';
      }

      // 동물
      if (e.role === 'animal') {
        if (e.animalType === 'horse') return 'horse';
        if (e.animalType === 'bear') return 'bear';
        if (e.animalType === 'deer') return 'deer';
        if (e.animalType === 'turtle') return 'turtle';
        if (e.animalType === 'camel') return 'camel';
        if (e.animalType === 'wolf') return 'bear';
        return 'deer';
      }

      return 'knight';
    }

    // 엔티티 활동 상태에 맞는 풍선 반환
    getBalloonKeyForEntity(e, isNight) {
      if (e.state === 'combat') return 'balloon_combat';
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

    draw(ctx, e, px, py, bounce, timeSec, isNight = false) {
      const spriteBaseKey = this.getSpriteKeyForEntity(e);
      const isFacingLeft = (e.vx < -0.05);
      const key = `${spriteBaseKey}_${isFacingLeft ? 'left' : 'right'}`;
      let cv = this.cache.get(key);
      if (!cv) cv = this.cache.get(`${spriteBaseKey}_right`);
      if (!cv) cv = this.cache.get('knight_right');

      const sc = e.scale || 1.0;
      const sw = cv.width;
      const sh = cv.height;

      // 1. 발밑 픽셀 타원 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.ellipse(px, py + 6 * sc, 7 * sc, 3 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. 픽셀 스프라이트 블릿 (High-Res 1.5x Scaling)
      const renderW = Math.round(sw * sc * 1.5);
      const renderH = Math.round(sh * sc * 1.5);
      const renderX = Math.round(px - renderW / 2);
      const renderY = Math.round(py - renderH + 6 * sc - bounce);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cv, renderX, renderY, renderW, renderH);

      // 3. 생태계 상태 풍선 렌더링 (Ecology Status Balloon Float)
      const bKey = this.getBalloonKeyForEntity(e, isNight);
      if (bKey && this.balloonCache.has(bKey)) {
        const bCvs = this.balloonCache.get(bKey);
        const floatY = Math.round(Math.sin(timeSec * 3 + (e.id || 0)) * 2);
        const bx = Math.round(px - bCvs.width / 2);
        const by = Math.round(renderY - bCvs.height - 2 + floatY);
        ctx.drawImage(bCvs, bx, by);
      }

      // 4. 전투 모션 시 픽셀 무기 슬래시 이펙트
      if (e.state === 'combat' && Math.sin(timeSec * 12 + (e.id || 0)) > 0.4) {
        ctx.fillStyle = '#f8fafc';
        const slashDir = isFacingLeft ? -1 : 1;
        const sx = px + slashDir * 12 * sc;
        const sy = py - 8 * sc - bounce;
        ctx.fillRect(sx, sy, 3 * sc, 2 * sc);
        ctx.fillRect(sx + slashDir * 2 * sc, sy - 3 * sc, 2 * sc, 2 * sc);
        ctx.fillRect(sx + slashDir * 4 * sc, sy + 3 * sc, 2 * sc, 2 * sc);
      }
    }
  }

  window.PixelSprites = new PixelSpriteAtlas();
})(typeof window !== 'undefined' ? window : global);
