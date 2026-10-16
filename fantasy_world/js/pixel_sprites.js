// ============================================================================
// pixel_sprites.js - Tiny RPG 스타일 정밀 픽셀 아트 매트릭스 엔진
// 16x16 & 24x24 순수 도트 매트릭스 + 4단계 명암 팔레트 + 오프스크린 캔버스 캐싱
// ============================================================================

(function(window) {
  'use strict';

  // 1. 공통 4단계 명암 마스터 팔레트
  const PALETTE = {
    '.': null,                     // 투명
    '#': '#0f172a',                // 외곽선 1px 다크 콘투어 (Dark Slate)
    'k': '#1e293b',                // 심연 암영 (Deep Shadow)
    's': '#475569',                // 강철/의복 그림자 (Dark Steel/Slate)
    'm': '#94a3b8',                // 강철/무기 기본 (Mid Steel)
    'h': '#e2e8f0',                // 강철 하이라이트 (Bright Steel)
    'w': '#ffffff',                // 순백 광택 / 눈 흰자 (Pure White Shine)
    'f': '#fed7aa',                // 피부 기본 (Flesh Tone)
    'F': '#ea580c',                // 피부 음영 (Flesh Shadow)
    'd': '#9a3412',                // 짙은 피부 그림자 / 적갈색 (Deep Auburn)
    'r': '#dc2626',                // 루비 / 붉은 깃털 / 망토 (Ruby Red)
    'R': '#ef4444',                // 밝은 주홍 / 안광 (Bright Red)
    'g': '#ca8a04',                // 황금 음영 (Gold Shadow)
    'G': '#facc15',                // 황금빛 (Bright Gold)
    'y': '#fef08a',                // 연노랑 하이라이트 (Pale Gold Shine)
    'b': '#1d4ed8',                // 로열 블루 갑주/로브 (Royal Blue)
    'B': '#3b82f6',                // 하늘빛 블루 (Sky Blue)
    'c': '#0284c7',                // 비전 청록 / 마법 (Arcane Cyan)
    'C': '#38bdf8',                // 발광 청록 (Glow Cyan)
    'p': '#7e22ce',                // 심연 보라 / 흑마법 (Purple)
    'P': '#c084fc',                // 비전 수정 보라 (Amethyst)
    'e': '#15803d',                // 숲/고블린 녹색 음영 (Forest Green)
    'E': '#22c55e',                // 생기있는 녹색 / 고블린 피부 (Emerald Green)
    'L': '#86efac',                // 라임 하이라이트 / 슬라임 광택 (Lime Glow)
    'o': '#78350f',                // 가죽 갈색 (Leather Brown)
    'O': '#b45309',                // 밝은 목재 / 모래빛 (Light Wood)
    'x': '#451a03',                // 짙은 흑목재 (Dark Timber)
    'n': '#334155'                 // 건메탈 (Gunmetal)
  };

  // 2. 16x16 / 24x24 도트 매트릭스 원형 데이터
  const RAW_SPRITES = {
    // ------------------------------------------------------------------------
    // [A] 플레이어 영웅 (도보 / 백마 기병 / 비룡 라이더)
    // ------------------------------------------------------------------------
    // 1. 도보 영웅 (황금 왕관, 블루 플레이트, 강철 장검, 붉은 망토) - Walk 0
    hero_walk_0: [
      ".....######.....",
      "....#GyGGyG#....",
      "...#GyGGGGyG#...",
      "...#F#ffff#F#...",
      "...#f#ff##f#....",
      "...#ffffffff#...",
      "...#rr####rr#...",
      "..#rrbBBbbrr#h..",
      ".#rr#bBBbb#rr#h.",
      ".#rr#bGGbb#rr#wh",
      "..#r#bbbb#r#Gwh#",
      "..#rr#bb#rr#.G##",
      "...##bbbb##..##.",
      "...#ss##ss#.....",
      "..#hh#..#hh#....",
      "..####..####...."
    ],
    // 2. 도보 영웅 - Walk 1 (걷기 보폭 프레임)
    hero_walk_1: [
      ".....######.....",
      "....#GyGGyG#....",
      "...#GyGGGGyG#...",
      "...#F#ffff#F#...",
      "...#f#ff##f#....",
      "...#ffffffff#...",
      "...#rr####rr#...",
      "..#rrbBBbbrr#...",
      ".#rr#bBBbb#rr#h.",
      ".#rr#bGGbb#rr#wh",
      "..#r#bbbb#r#Gwh#",
      "..#rr#bb#rr#.G##",
      "...##bbbb##..##.",
      "..#ss#..#ss#....",
      "..#hh#...#hh#...",
      "..####...####..."
    ],

    // ------------------------------------------------------------------------
    // [B] 왕국 전사 및 기사단
    // ------------------------------------------------------------------------
    // 3. 기사 (풀 플레이트, 붉은 깃털 투구, 십자 바이저, 방패, 장검)
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

    // 4. 성기사 / 팔라딘 (그레이트 헬름, 십자 슬릿, 십자 타워실드, 장창)
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

    // 5. 대형 도끼 기사 (Axe Knight - 헤비 아머 & 거대 배틀액스)
    axe_knight: [
      "......####......",
      ".....#hhhh#.....",
      "....#hskksh#....",
      "...#hhmhhhh#....",
      "..#h#m#h#m##.hh.",
      "..#hhsmhhhsh#whh",
      "...#ssssss#.#wwh",
      "..#ssGssGss##msh",
      ".#ss#GssG#ss#x##",
      ".#f#ssssss#f#x..",
      "..#hssssssh#xx..",
      "..#hh#ss#hh#xx..",
      "...##ssss##.xx..",
      "...#kk##kk#.xx..",
      "..#hh#..#hh#xx..",
      "..####..####...."
    ],

    // 6. 경비병 / 수비병 (케틀 헬름, 사슬갑옷, 붉은 튜닉, 창)
    soldier: [
      ".....######.....",
      "....#hhhhhh#....",
      "...#hhhhhhhh#...",
      "...#F#ffff#F#...",
      "...#f#ff##f#....",
      "...#ffffffff#...",
      "....#ssssss#....",
      "..#rr#ssss#rr#h.",
      ".#rr#smmss#rr#wh",
      ".#f#smmsss#f#.wh",
      "..#ssssssss#..x.",
      "..#ss#ss#ss#..x.",
      "...##ssss##...x.",
      "...#kk##kk#...x.",
      "..#hh#..#hh#..x.",
      "..####..####..x."
    ],

    // ------------------------------------------------------------------------
    // [C] 마법사 및 사제 (Casters)
    // ------------------------------------------------------------------------
    // 7. 대마법사 (뾰족 모자, 긴 흰 수염, 마법 로브, 룬 보주 지팡이)
    wizard: [
      "......##........",
      ".....#bb#.......",
      "....#bbbb#......",
      "...#bGGbbb#.....",
      "..#bbbbbbbb#....",
      ".############...",
      "...#FffffF#..y..",
      "...#f#ff#f#.yCy.",
      "...#wwwwww#..y..",
      "...#wwwwww#..x..",
      "..#bbbbbbbb#GxG.",
      ".#b#bbbbbb#b#x..",
      ".#b#bbbbbb#b#x..",
      "..#bbbbbbbb#x...",
      "...#kk##kk#.x...",
      "..####..####x..."
    ],

    // 8. 사제 / 힐러 (수녀 윔플, 황금 십자가, 치유 로브, 목조 성물 지팡이)
    priestess: [
      "....######......",
      "...#wwwwww#.....",
      "..#wwwGGwww#....",
      "..#wwGGGGww#....",
      "..#wwwGGwww#....",
      "..#w#FffF#w#....",
      "..#w#f##f#w#....",
      "..#w#ffff#w#....",
      "...#wwwwww#..O..",
      "..#bbwwwwbb#.OxO",
      ".#bb#wwww#bb#.x.",
      ".#f#bbwwbb#f#.x.",
      "..#bbbbbbbb#..x.",
      "..#bbbbbbbb#..x.",
      "...#kk##kk#...x.",
      "..####..####..x."
    ],

    // ------------------------------------------------------------------------
    // [D] 궁수 및 특수 클래스
    // ------------------------------------------------------------------------
    // 9. 궁수 / 사냥꾼 (후드 모자, 깃털, 화살통, 곡궁)
    archer: [
      ".....######.....",
      "....#eeeeee#R...",
      "...#eeeeeeee#R..",
      "...#F#ffff#F#R..",
      "...#f#ff##f#....",
      "...#ffffffff#...",
      "....#oooooo#....",
      "..#oo#oooo#oo#..",
      ".#oo#oommo#oo#..",
      ".#f#oommmo#f#x..",
      "..#oooooooo#OxO.",
      "..#oo#oo#oo#.x..",
      "...##oooo##..x..",
      "...#kk##kk#..x..",
      "..#oo#..#oo#.x..",
      "..####..####...."
    ],

    // 10. 국왕 / 군주 (황금 왕관, 주홍 벨벳 모피 망토, 황금 홀)
    king: [
      "....########....",
      "...#GyGGyGGy#...",
      "...#GyGGGGyG#...",
      "...#F#ffff#F#...",
      "...#f#ff##f#....",
      "...#ffffffff#...",
      "...#rrwwwwrr#G..",
      "..#rr#wwww#rr#G.",
      ".#rr#rwwrr#rr#G.",
      ".#f#rrwwrr#f#xG.",
      "..#rrrrrrrr#..x.",
      "..#rr#rr#rr#..x.",
      "...##rrrr##...x.",
      "...#kk##kk#...x.",
      "..#rr#..#rr#..x.",
      "..####..####...."
    ],

    // ------------------------------------------------------------------------
    // [E] 엘프 & 드워프 & 수인족
    // ------------------------------------------------------------------------
    // 11. 엘프 레인저 (긴 뾰족 귀, 금발, 녹색 잎사귀 튜닉, 은 단검)
    elf: [
      "................",
      ".#F#........#F#.",
      "#ff#..####..#ff#",
      "#ff#.#yyyy#.#ff#",
      ".#f#yyyyyyy#f#..",
      "...#f#yy##f#....",
      "...#ffffffff#...",
      "....#eeeeee#....",
      "..#e#eeeeee#e#..",
      ".#e#eeLLEee#e#..",
      ".#f#eeLLEee#f#h.",
      "..#eeeeeeee#wh#.",
      "..#ee#ee#ee#.G##",
      "...##eeee##..##.",
      "..#ee#..#ee#....",
      "..####..####...."
    ],

    // 12. 드워프 전사 (뿔 달린 강철 투구, 배꼽까지 내려온 붉은 수염, 배틀액스)
    dwarf: [
      "................",
      "...#hh####hh#...",
      "..#hhhhhhshhh#..",
      "..#hhsmhhhshh#..",
      "...#ssssssss#...",
      "...#F#ffff#F#...",
      "..#d#dff##d#d#..",
      ".#dddddddddddd#.",
      ".#dddddddddddd#h",
      ".#dddddddddddd#h",
      "..#ssssssss#..wh",
      "..#ssssssss#..wh",
      "...#kk####kk#.x#",
      "..#hh#....#hh#x.",
      "..####....####x.",
      "................"
    ],

    // 13. 수인족 늑대 전사 (어두운 늑대 머리, 발광 안광, 클로, 가죽대)
    beastkin: [
      "................",
      "..##........##..",
      ".#kk#......#kk#.",
      ".#kkk#....#kkk#.",
      "..#kkk####kkk#..",
      "...#kkRRkkRR#...",
      "...#kkkkkkkk#...",
      "....#kkwwkk#....",
      "...#oooooooo#...",
      "..#k#oooooo#k#..",
      ".#kk#oGssGo#kk#.",
      ".#w#oooooooo#w#.",
      "..#oooooooo#....",
      "...#kk##kk#.....",
      "..#kk#..#kk#....",
      "..####..####...."
    ],

    // ------------------------------------------------------------------------
    // [F] 언데드 & 사신 & 악마
    // ------------------------------------------------------------------------
    // 14. 스켈레톤 (백색 해골, 암흑 안와, 갈비뼈, 녹슨 검, 방패)
    skeleton: [
      ".....####.......",
      "....#wwww#......",
      "...#w#ww#w#.....",
      "...#k#ww#k#.....",
      "...#wwwwww#.....",
      "....#w#w#w#.....",
      ".....####.......",
      "..#h#wwww#h#....",
      ".#hh#w##w#hh#...",
      ".#hh#wwww#hh#h..",
      "..#h#w##w#h#wh#.",
      "...#wwwwww#.wh#.",
      "....#w##w#..wh#.",
      "....#w##w#..G##.",
      "...#ww##ww#..##.",
      "...###..###....."
    ],

    // 15. 그림 리퍼 / 사신 (칠흑빛 누더기 로브, 붉은 안광, 거대한 죽음의 낫)
    reaper: [
      "......####......",
      ".....#kkkk#.....",
      "....#kRRkk#.....",
      "...#kR##Rkk#....",
      "...#kkkkkkk#.hh.",
      "...#w#ww#w##hhhh",
      "....#w##w#..#sh#",
      "...#kkkkkk#..x..",
      "..#p#kkkk#p#.x..",
      ".#pp#kkkk#pp#x..",
      ".#pp#kkkk#pp#x..",
      "..#p#kkkk#p#.x..",
      "...#kk##kk#..x..",
      "...#kk##kk#..x..",
      "..#kk#..#kk#.x..",
      "..####..####.x.."
    ],

    // ------------------------------------------------------------------------
    // [G] 고블린 & 오크
    // ------------------------------------------------------------------------
    // 16. 고블린 (녹색 피부, 큰 뾰족 귀, 붉은 안광, 돌도끼)
    goblin: [
      "................",
      "..##........##..",
      ".#EE#..##..#EE#.",
      "#EEEE##ee##EEEE#",
      "#EEEEeeeeeeEEEE#",
      ".#eERRReeRRRe#..",
      "..#ee##ee##e#...",
      "...#eeeeee#.....",
      "....#eeee#...hh.",
      "...#oooooo#.#mh#",
      "..#e#oooo#e#xm##",
      "..#e#oooo#e#xx..",
      "...#ee##ee#.xx..",
      "...#ee##ee#.xx..",
      "..#ee#..#ee#xx..",
      "..####..####...."
    ],

    // 17. 오크 버서커 (거대한 체구, 턱 송곳니, 뿔 투구, 가시 쇠몽둥이)
    orc: [
      ".....######.....",
      "....#EEkkEE#....",
      "...#EEEEEEEE#...",
      "..#kkEEeeEEkk#..",
      "..#k#EEeeEE#k#..",
      "..#E#RReeRR#E#..",
      "...#EewwwweE#...",
      "...#EEwwwwEE#.hh",
      "..#ooEeeeeEoo#hh",
      ".#oo#oooooo#o#hh",
      ".#EE#oooooo#E#hh",
      "..#E#oooooo#E#xx",
      "...##oooooo##.xx",
      "...#kk####kk#.xx",
      "..#EE#....#EE#xx",
      "..####....####xx"
    ],

    // ------------------------------------------------------------------------
    // [H] 몬스터 & 생태계 야생동물
    // ------------------------------------------------------------------------
    // 18. 슬라임 (반투명 에메랄드 젤리, 상단 하이라이트, 귀여운 검은 눈)
    slime: [
      "................",
      "................",
      "......####......",
      "....##LLLE##....",
      "...#LLLEEEEE#...",
      "..#LLEEEEEEEE#..",
      ".#LEEE##EE##EE#.",
      "#LEEEE##EE##EEE#",
      "#LEEEEEEEEEEEEE#",
      "#LEEEEEEEEEEEEE#",
      "#EEEEEEEEEEEEEE#",
      "#EEEEEEEEEEEEEE#",
      ".#eeeeeeeeeeee#.",
      "..#eeeeeeeeee#..",
      "...##########...",
      "................"
    ],

    // 19. 동굴 박쥐 (보랏빛 박쥐 날개, 뾰족 귀, 하얀 송곳니)
    bat: [
      "................",
      "................",
      "....##....##....",
      "..#pppp##pppp#..",
      ".#pppppppppppp#.",
      "#pp#kppRRppk#pp#",
      "#pp#kkkRRkkk#pp#",
      "#pp##kwwwwk##pp#",
      ".#pp##kwwk##pp#.",
      "..#pp######pp#..",
      "...#p#....#p#...",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],

    // 20. 백마 (White Horse - 갈기, 등 안장, 발굽)
    horse: [
      "................",
      ".........#####..",
      "........#wwwww#.",
      ".......#wwmwww#.",
      "......#wwwwwww#.",
      "....##wwkkwww#..",
      "...#wwwwwwww#...",
      "..#wwwwwwwwww#..",
      ".#wwwwGooGwwww#.",
      "#wwww#GooG#wwww#",
      "#wwww#oooo#wwww#",
      ".#ww#wwwwww#ww#.",
      "..##.#wwww#.##..",
      ".....#s##s#.....",
      ".....#k##k#.....",
      ".....##..##....."
    ],

    // 21. 갈색 곰 (Brown Bear - 둥근 귀, 코, 굵은 앞발)
    bear: [
      ".....##....##...",
      "....#oo#..#oo#..",
      "...#oooooooooo#.",
      "...#o#oo##oo#o#.",
      "...#oooooooooo#.",
      "....#oo#kk#oo#..",
      "...#oooooooooo#.",
      "..#oooooooooooo#",
      ".#oo#oooooooo#oo",
      ".#oo#oooooooo#oo",
      "..#oooooooooooo#",
      "...#oo#oooo#oo#.",
      "...#xx######xx#.",
      "..#xx#......#xx#",
      "..###........###",
      "................"
    ],

    // 22. 야생 백록 / 사슴 (Deer - 사슴 뿔, 가는 다리, 흰 꼬리)
    deer: [
      "...#x#....#x#...",
      "...#xx#..#xx#...",
      "....#xx##xx#....",
      ".....#oooo#.....",
      "....#o#oo#o#....",
      "....#oooooo#....",
      ".....#oooo#.....",
      "....#oooooo#....",
      "...#oooooooo#...",
      "..#oooooooooo#..",
      "..#oooooooooo#w.",
      "...#oo#..#oo#ww.",
      "...#oo#..#oo#...",
      "...#xx#..#xx#...",
      "...#kk#..#kk#...",
      "...###....###..."
    ],

    // 23. 거대 바다거북 (Turtle - 등껍질 문양, 물갈퀴)
    turtle: [
      "................",
      "......####......",
      ".....#EEEE#.....",
      "....#EE##EE#....",
      "...#ooEEEEoo#...",
      "..#oooooooooo#..",
      ".#ooGoGooGoGoo#.",
      "#oooooooooooooo#",
      "#ooGoGooGoGooGo#",
      "#oooooooooooooo#",
      ".#ooGoGooGoGoo#.",
      "..#oooooooooo#..",
      "...#EE#..#EE#...",
      "..#EEEE##EEEE#..",
      "..####....####..",
      "................"
    ],

    // 24. 사막 낙타 (Camel - 쌍혹, 긴 목, 방울)
    camel: [
      ".........#####..",
      "........#OOOOO#.",
      ".......#OOkkOO#.",
      "......#OOOOOOO#.",
      ".....#OOOOOO#...",
      "....#OOOOOO#....",
      "...#OO#..#OO#...",
      "..#OOOO##OOOO#..",
      ".#OOOOOOOOOOOO#.",
      "#OOOO#rGGr#OOOO#",
      "#OOOO#rGGr#OOOO#",
      ".#OO#OOOOOO#OO#.",
      "..##.#OOOO#.##..",
      ".....#xx##xx#...",
      ".....#kk##kk#...",
      ".....##..##....."
    ]
  };

  // 3. 스프라이트 오프스크린 캔버스 캐시 매니저
  class PixelSpriteAtlas {
    constructor() {
      this.cache = new Map();
      this.isReady = false;
      this.init();
    }

    init() {
      if (typeof document === 'undefined') return;
      for (const [key, rows] of Object.entries(RAW_SPRITES)) {
        this.cacheSprite(key, rows);
      }
      this.isReady = true;
    }

    cacheSprite(key, rows) {
      const h = rows.length;
      const w = rows[0].length;

      // 정방향(오른쪽) 캔버스
      const cvNormal = document.createElement('canvas');
      cvNormal.width = w;
      cvNormal.height = h;
      const ctxNorm = cvNormal.getContext('2d');

      // 반전(왼쪽) 캔버스
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

    // 엔티티 역할/종족에 따라 적절한 스프라이트 키 반환
    getSpriteKeyForEntity(e) {
      if (e.role === 'player') {
        const frame = Math.floor((e.animPhase || 0) * 2) % 2;
        return frame === 1 ? 'hero_walk_1' : 'hero_walk_0';
      }
      if (e.role === 'king') return 'king';
      if (e.role === 'royal_guard') return 'knight';
      if (e.role === 'soldier') return 'soldier';
      if (e.role === 'adventurer' || e.role === 'mercenary') {
        if (e.race === 'dwarf') return 'dwarf';
        if (e.race === 'elf') return 'elf';
        if (e.race === 'beastkin') return 'beastkin';
        return (e.id % 2 === 0) ? 'paladin' : 'axe_knight';
      }
      if (e.role === 'merchant') return 'archer';
      if (e.role === 'farmer' || e.role === 'fisherman' || e.role === 'miner' || e.role === 'blacksmith') {
        if (e.race === 'dwarf') return 'dwarf';
        if (e.race === 'elf') return 'elf';
        return (e.role === 'farmer' || e.role === 'fisherman') ? 'priestess' : 'dwarf';
      }
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
      if (e.role === 'animal') {
        if (e.animalType === 'horse') return 'horse';
        if (e.animalType === 'bear') return 'bear';
        if (e.animalType === 'deer') return 'deer';
        if (e.animalType === 'turtle') return 'turtle';
        if (e.animalType === 'camel') return 'camel';
        if (e.animalType === 'wolf') return 'beastkin';
        return 'deer';
      }
      return 'knight';
    }

    // 픽셀 스프라이트 렌더링
    draw(ctx, e, px, py, bounce, timeSec) {
      const spriteBaseKey = this.getSpriteKeyForEntity(e);
      const isFacingLeft = (e.vx < -0.05);
      const key = `${spriteBaseKey}_${isFacingLeft ? 'left' : 'right'}`;
      let cv = this.cache.get(key);
      if (!cv) cv = this.cache.get(`${spriteBaseKey}_right`);
      if (!cv) cv = this.cache.get('knight_right');

      const sc = e.scale || 1.0;
      const sw = cv.width;
      const sh = cv.height;

      // 1. 발밑 픽셀 타원 그림자 (Under-Sprite Ground Shadow)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.ellipse(px, py + 6 * sc, 7 * sc, 3 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. 픽셀 스프라이트 블릿 (Draw Cached Pixel Canvas)
      const renderW = Math.round(sw * sc * 1.5);
      const renderH = Math.round(sh * sc * 1.5);
      const renderX = Math.round(px - renderW / 2);
      const renderY = Math.round(py - renderH + 6 * sc - bounce);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cv, renderX, renderY, renderW, renderH);

      // 3. 공격 모션 시 픽셀 무기 슬래시 이펙트 (Slash Arc Particle)
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
