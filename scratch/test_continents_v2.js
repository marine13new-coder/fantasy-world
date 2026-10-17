const fs = require('fs');

const WORLD_WIDTH = 480;
const WORLD_HEIGHT = 320;

const TILE = {
  DEEP_WATER: 0, WATER: 1, SAND: 2, GRASS: 3, MEADOW: 4, FOREST: 5, DARK_FOREST: 6,
  HILLS: 7, MOUNTAIN: 8, SNOW: 9, BADLANDS: 10, FARMLAND: 11, ROAD: 12, BRIDGE: 13,
  CASTLE_FLOOR: 14, DOCK: 15, WALL: 16, DESERT: 17, ELVEN_FOREST: 18, LAVA: 19,
  CORAL: 20, AUTUMN_WOOD: 21, SWAMP: 22
};

const TILE_REV = ['DEEP_WATER', 'WATER', 'SAND', 'GRASS', 'MEADOW', 'FOREST', 'DARK_FOREST', 'HILLS', 'MOUNTAIN', 'SNOW', 'BADLANDS', 'FARMLAND', 'ROAD', 'BRIDGE', 'CASTLE_FLOOR', 'DOCK', 'WALL', 'DESERT', 'ELVEN_FOREST', 'LAVA', 'CORAL', 'AUTUMN_WOOD', 'SWAMP'];

class SeededRNG {
  constructor(seed = 20261016) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  next() {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
}

function createNoise2D(seed = 1337) {
  const rng = new SeededRNG(seed);
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function val(ix, iy) {
    const h = perm[(perm[ix & 255] + (iy & 255)) & 255];
    return h / 255;
  }
  return function noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = fade(xf);
    const v = fade(yf);
    const aa = val(xi, yi);
    const ba = val(xi + 1, yi);
    const ab = val(xi, yi + 1);
    const bb = val(xi + 1, yi + 1);
    return lerp(lerp(aa, ba, u), lerp(ab, bb, u), v);
  };
}

function fbm(noiseFn, x, y, octaves = 4) {
  let total = 0, amp = 0.5, freq = 1, maxVal = 0;
  for (let i = 0; i < octaves; i++) {
    total += noiseFn(x * freq, y * freq) * amp;
    maxVal += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return total / maxVal;
}

function generate5ContinentsWorld() {
  const elevNoise = createNoise2D(10101);
  const moistNoise = createNoise2D(20202);
  const detailNoise = createNoise2D(30303);

  const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const deco = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const idx = (x, y) => y * WORLD_WIDTH + x;
  const inBounds = (x, y) => x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const nx = x / WORLD_WIDTH;
      const ny = y / WORLD_HEIGHT;
      const nVal = fbm(elevNoise, nx * 7.5, ny * 5.2, 4);
      const m = fbm(moistNoise, nx * 7.0, ny * 5.5, 3);
      const d = detailNoise(nx * 32, ny * 26);

      // Distance to 5 Continental Centers
      const dCentral = Math.hypot((x - 240) / 66, (y - 160) / 54);
      const dWest = Math.hypot((x - 80) / 64, (y - 160) / 116);
      const dNorth = Math.hypot((x - 240) / 114, (y - 44) / 32);
      const dSouth = Math.hypot((x - 240) / 114, (y - 276) / 32);
      const dEast = Math.hypot((x - 400) / 64, (y - 160) / 116);

      // Stepping-stone Isles in Straits
      const dBeacon = Math.hypot(x - 162, y - 145);
      const dPirate = Math.hypot(x - 158, y - 185);
      const dSiren = Math.hypot(x - 140, y - 255);
      const dShipwreck = Math.hypot(x - 340, y - 225);

      let maxE = 0;
      let region = 'central';

      if (dCentral < 1.0) {
        let e = (1 - dCentral) * 0.78 + nVal * 0.35;
        // Moderate the central heartland so it becomes fertile rolling plains rather than high peak
        const dSolaris = Math.hypot(x - 240, y - 160);
        if (dSolaris < 35) {
          e = 0.42 + (nVal - 0.5) * 0.15; // fertile plains
        }
        if (e > maxE) { maxE = e; region = 'central'; }
      }
      if (dWest < 1.0) {
        const e = (1 - dWest) * 0.78 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'west'; }
      }
      if (dNorth < 1.0) {
        const e = (1 - dNorth) * 0.78 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'north'; }
      }
      if (dSouth < 1.0) {
        const e = (1 - dSouth) * 0.78 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'south'; }
      }
      if (dEast < 1.0) {
        const e = (1 - dEast) * 0.78 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'east'; }
      }

      if (dBeacon < 11) {
        const e = (1 - dBeacon / 11) * 0.70 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'beacon'; }
      }
      if (dPirate < 13) {
        const e = (1 - dPirate / 13) * 0.70 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'pirate'; }
      }
      if (dSiren < 14) {
        const e = (1 - dSiren / 14) * 0.68 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'siren'; }
      }
      if (dShipwreck < 12) {
        const e = (1 - dShipwreck / 12) * 0.65 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'shipwreck'; }
      }

      let t = TILE.DEEP_WATER;

      if (maxE < 0.22) {
        t = TILE.DEEP_WATER;
      } else if (maxE < 0.28) {
        t = (region === 'siren' || region === 'shipwreck') ? TILE.CORAL : TILE.WATER;
      } else if (maxE < 0.31) {
        t = TILE.SAND;
      } else {
        // Continent Biomes
        if (region === 'north') {
          if (maxE > 0.68) t = TILE.SNOW;
          else if (maxE > 0.54) t = TILE.MOUNTAIN;
          else if (maxE > 0.44) t = TILE.HILLS;
          else t = m > 0.45 ? TILE.DARK_FOREST : TILE.SNOW;
        } else if (region === 'south') {
          if (maxE > 0.65) t = TILE.LAVA;
          else if (maxE > 0.52) t = TILE.MOUNTAIN;
          else if (maxE > 0.40) t = TILE.BADLANDS;
          else t = m > 0.50 ? TILE.AUTUMN_WOOD : TILE.BADLANDS;
        } else if (region === 'west') {
          if (y < 145) {
            if (x < 42 && maxE > 0.58) t = TILE.SNOW;
            else if (x < 52 && maxE > 0.48) t = TILE.MOUNTAIN;
            else if (maxE > 0.40) t = TILE.ELVEN_FOREST;
            else t = m > 0.42 ? TILE.ELVEN_FOREST : TILE.MEADOW;
          } else if (y > 175) {
            if (maxE > 0.60) t = TILE.HILLS;
            else t = TILE.DESERT;
          } else {
            t = TILE.BADLANDS;
          }
        } else if (region === 'east') {
          if (maxE > 0.65) t = TILE.MOUNTAIN;
          else if (maxE > 0.52) t = TILE.HILLS;
          else if (y < 130) t = m > 0.5 ? TILE.DARK_FOREST : TILE.SWAMP;
          else t = m > 0.45 ? TILE.AUTUMN_WOOD : TILE.FOREST;
        } else if (region === 'beacon') {
          t = TILE.CASTLE_FLOOR;
        } else if (region === 'pirate') {
          t = TILE.BADLANDS;
        } else {
          // Central Continent
          if (y < 132 && maxE > 0.52) t = TILE.MOUNTAIN; // Northern Iron Mountains
          else if (y < 138 && maxE > 0.45) t = TILE.HILLS;
          else if (maxE > 0.66) t = TILE.MOUNTAIN;
          else if (maxE > 0.54) t = TILE.HILLS;
          else if (y > 185 && maxE < 0.48) t = TILE.FARMLAND; // Southern breadbasket
          else if (m > 0.58) t = TILE.FOREST;
          else if (m > 0.38) t = TILE.MEADOW;
          else t = TILE.GRASS;
        }
      }

      tiles[idx(x, y)] = t;

      // Deco
      if (t === TILE.FOREST && d > 0.36) deco[idx(x, y)] = 1;
      else if (t === TILE.DARK_FOREST && d > 0.33) deco[idx(x, y)] = 2;
      else if (t === TILE.MEADOW && d > 0.68) deco[idx(x, y)] = 3;
      else if ((t === TILE.HILLS || t === TILE.BADLANDS) && d > 0.68) deco[idx(x, y)] = 4;
      else if ((t === TILE.DESERT || t === TILE.SAND) && d > 0.75) deco[idx(x, y)] = 5;
      else if (t === TILE.ELVEN_FOREST && d > 0.34) deco[idx(x, y)] = 6;
      else if (t === TILE.AUTUMN_WOOD && d > 0.35) deco[idx(x, y)] = 7;
      else if (t === TILE.SNOW && d > 0.70) deco[idx(x, y)] = 8;
    }
  }

  // Silverleaf Lake (center: 220, 138)
  const lakeCenter = { x: 220, y: 138 };
  for (let y = lakeCenter.y - 8; y <= lakeCenter.y + 8; y++) {
    for (let x = lakeCenter.x - 12; x <= lakeCenter.x + 12; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot((x - lakeCenter.x) * 0.9, (y - lakeCenter.y) * 1.1);
      if (dist < 7.0) {
        tiles[idx(x, y)] = TILE.WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 9.0 && tiles[idx(x, y)] !== TILE.WATER) {
        tiles[idx(x, y)] = TILE.SAND;
        deco[idx(x, y)] = 0;
      }
    }
  }

  // Oasis Lake in Mirage Desert (center: 80, 235)
  const oasisCenter = { x: 80, y: 235 };
  for (let y = oasisCenter.y - 7; y <= oasisCenter.y + 7; y++) {
    for (let x = oasisCenter.x - 9; x <= oasisCenter.x + 9; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot(x - oasisCenter.x, y - oasisCenter.y);
      if (dist < 4.0) {
        tiles[idx(x, y)] = TILE.WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 6.5) {
        tiles[idx(x, y)] = TILE.MEADOW;
      }
    }
  }

  return { tiles, deco, inBounds, idx };
}

const settlements = [
  // 1. 중앙 대륙 (아테리아 제국 본토)
  { id: 'solaris', name: '왕도 솔라리스', x: 240, y: 155, faction: 'kingdom' },
  { id: 'bluewave', name: '푸른파도 대항구', x: 190, y: 165, portWaterX: 176, portWaterY: 165, isPort: true },
  { id: 'ironforge', name: '아이언포지 드워프 광산성채', x: 245, y: 125 },
  { id: 'goldenwheat', name: '황금밀 대농장', x: 240, y: 195 },
  { id: 'valor_fort', name: '발로르 최전방 요새', x: 285, y: 160 },
  { id: 'silverleaf', name: '실버리프 호수마을', x: 206, y: 142 },
  { id: 'crystal_falls', name: '크리스탈폴 아케인 학탑', x: 215, y: 120 },
  { id: 'oakwood', name: '오크우드 벌목 마을', x: 270, y: 185 },
  { id: 'windmill_valley', name: '윈드밀 방앗간 계곡', x: 215, y: 190 },

  // 2. 서부 신대륙 (실바니아 요정림 & 미라주 사막 제국)
  { id: 'elvenheim', name: '신대륙 엘븐하임 성소', x: 75, y: 80, portWaterX: 102, portWaterY: 80, isPort: true },
  { id: 'fairy_glade', name: '달빛 요정 정원', x: 55, y: 65 },
  { id: 'celestial_haven', name: '천공의 룬 비행섬', x: 42, y: 100 },
  { id: 'dragon_eyrie', name: '천공의 용의 둥지 고원', x: 38, y: 145 },
  { id: 'mirage_oasis', name: '황금사막 미라주 오아시스', x: 72, y: 230, portWaterX: 105, portWaterY: 230, isPort: true },
  { id: 'sphinx_pyramid', name: '스핑크스 고대 피라미드', x: 58, y: 245 },
  { id: 'bedouin_camp', name: '베두인 전갈 유목민 캠프', x: 48, y: 205 },
  { id: 'goblin_camp', name: '고블린 소굴 야영지', x: 100, y: 160, danger: true },

  // 3. 북부 혹한 대륙 (노스펠름 만년설 영구동토)
  { id: 'frost_citadel', name: '서리 거인의 얼음 성채', x: 240, y: 32, danger: true },
  { id: 'st_mare', name: '세인트 마레 어촌 포구', x: 165, y: 52, portWaterX: 165, portWaterY: 66, isPort: true },
  { id: 'valkyrie_gate', name: '발키리 협곡 관문', x: 205, y: 50 },
  { id: 'orc_stronghold', name: '오크 혈투 대요새', x: 315, y: 45, danger: true },

  // 4. 남부 화염 대륙 (드라코니아 화산 & 용족 성역)
  { id: 'volcano_isle', name: '흑요석 화산 군도', x: 175, y: 280, danger: true },
  { id: 'dragon_graveyard', name: '용들의 안식처 묘지', x: 240, y: 285, danger: true },
  { id: 'magma_underforge', name: '마그마 심연 지하용광로', x: 305, y: 275 },
  { id: 'siren_coral', name: '세이렌 산호섬', x: 140, y: 255, portWaterX: 140, portWaterY: 245, isPort: true },

  // 5. 동부 신비 대륙 (네크로폴리스 & 수정 신비 대륙)
  { id: 'obsidian_necropolis', name: '흑요석 강령술 묘지', x: 415, y: 85, danger: true },
  { id: 'whispering_woods', name: '속삭이는 마법 숲', x: 375, y: 100 },
  { id: 'crystal_caverns', name: '수정 동굴 성소', x: 415, y: 155 },
  { id: 'dragon_ruins', name: '용의 계곡 고대 신전', x: 420, y: 220, danger: true },
  { id: 'sunken_shipwreck', name: '난파선 해구', x: 340, y: 225, portWaterX: 335, portWaterY: 215, isPort: true },

  // 6. 해협 및 바다의 관문/성역
  { id: 'lone_beacon', name: '외로운 등대섬', x: 162, y: 145, portWaterX: 162, portWaterY: 135, isPort: true },
  { id: 'pirate_cove', name: '해골초도 대해적 성채', x: 158, y: 185, portWaterX: 150, portWaterY: 185, isPort: true, danger: true },
  { id: 'atlantis_ruins', name: '아틀란티스 해저 침몰신전', x: 240, y: 228, portWaterX: 240, portWaterY: 228, isPort: true }
];

const res = generate5ContinentsWorld();
let issueCount = 0;
settlements.forEach(s => {
  const t = res.tiles[res.idx(s.x, s.y)];
  const name = TILE_REV[t];
  const isWater = (t === TILE.DEEP_WATER || t === TILE.WATER);
  if (isWater && s.id !== 'atlantis_ruins') {
    console.warn('WARN: ' + s.id + ' is on water: ' + name);
    issueCount++;
  } else {
    console.log('OK: [' + s.id + '] (' + s.x + ', ' + s.y + ') -> ' + name);
  }
});
console.log('Total issues: ' + issueCount);
