const fs = require('fs');

const WORLD_WIDTH = 480;
const WORLD_HEIGHT = 320;

const TILE = {
  DEEP_WATER: 0, WATER: 1, SAND: 2, GRASS: 3, MEADOW: 4, FOREST: 5, DARK_FOREST: 6,
  HILLS: 7, MOUNTAIN: 8, SNOW: 9, BADLANDS: 10, FARMLAND: 11, ROAD: 12, BRIDGE: 13,
  CASTLE_FLOOR: 14, DOCK: 15, WALL: 16, DESERT: 17, ELVEN_FOREST: 18, LAVA: 19,
  CORAL: 20, AUTUMN_WOOD: 21, SWAMP: 22
};

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

function generateNewWorld() {
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

      // 5 Major Continents Normalized Elliptical Distances
      const dCentral = Math.hypot((x - 240) / 60, (y - 160) / 48);
      const dWest = Math.hypot((x - 82) / 58, (y - 160) / 106);
      const dNorth = Math.hypot((x - 240) / 108, (y - 44) / 28);
      const dSouth = Math.hypot((x - 240) / 108, (y - 276) / 28);
      const dEast = Math.hypot((x - 398) / 58, (y - 160) / 106);

      // Stepping isles in straits
      const dBeacon = Math.hypot(x - 162, (y - 145) * 1.1);
      const dPirate = Math.hypot(x - 158, (y - 185) * 1.1);
      const dAtlantis = Math.hypot(x - 240, (y - 228) * 1.1);
      const dSiren = Math.hypot(x - 140, (y - 255) * 1.1);

      let maxE = -1;
      let region = 'ocean';

      if (dCentral < 1.0) {
        const e = (1 - dCentral) * 0.74 + nVal * 0.36;
        if (e > maxE) { maxE = e; region = 'central'; }
      }
      if (dWest < 1.0) {
        const e = (1 - dWest) * 0.74 + nVal * 0.36;
        if (e > maxE) { maxE = e; region = 'west'; }
      }
      if (dNorth < 1.0) {
        const e = (1 - dNorth) * 0.76 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'north'; }
      }
      if (dSouth < 1.0) {
        const e = (1 - dSouth) * 0.76 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'south'; }
      }
      if (dEast < 1.0) {
        const e = (1 - dEast) * 0.74 + nVal * 0.36;
        if (e > maxE) { maxE = e; region = 'east'; }
      }

      if (dBeacon < 10) {
        const e = (1 - dBeacon / 10) * 0.65 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'beacon'; }
      }
      if (dPirate < 12) {
        const e = (1 - dPirate / 12) * 0.65 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'pirate'; }
      }
      if (dSiren < 14) {
        const e = (1 - dSiren / 14) * 0.65 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'siren'; }
      }

      let t = TILE.DEEP_WATER;

      if (maxE < 0.22) {
        t = TILE.DEEP_WATER;
      } else if (maxE < 0.28) {
        t = (region === 'siren' || region === 'atlantis') ? TILE.CORAL : TILE.WATER;
      } else if (maxE < 0.315) {
        t = TILE.SAND;
      } else {
        // Land Biome assignment based on continent
        if (region === 'north') {
          // 북부 혹한 대륙
          if (maxE > 0.68) t = TILE.SNOW;
          else if (maxE > 0.55) t = TILE.MOUNTAIN;
          else if (maxE > 0.44) t = TILE.HILLS;
          else t = m > 0.45 ? TILE.DARK_FOREST : TILE.SNOW;
        } else if (region === 'south') {
          // 남부 화염 대륙
          if (maxE > 0.65) t = TILE.LAVA;
          else if (maxE > 0.52) t = TILE.MOUNTAIN;
          else if (maxE > 0.40) t = TILE.BADLANDS;
          else t = m > 0.50 ? TILE.AUTUMN_WOOD : TILE.BADLANDS;
        } else if (region === 'west') {
          // 서부 실바니아 (북) & 미라주 사막 (남)
          if (y < 145) {
            // 요정 대륙
            if (x < 42 && maxE > 0.60) t = TILE.SNOW;
            else if (x < 50 && maxE > 0.50) t = TILE.MOUNTAIN;
            else if (maxE > 0.42) t = TILE.ELVEN_FOREST;
            else t = m > 0.45 ? TILE.ELVEN_FOREST : TILE.MEADOW;
          } else if (y > 175) {
            // 황금 사막
            if (maxE > 0.60) t = TILE.HILLS;
            else t = TILE.DESERT;
          } else {
            // 중앙 고블린 불모지
            t = TILE.BADLANDS;
          }
        } else if (region === 'east') {
          // 동부 신비 대륙
          if (maxE > 0.65) t = TILE.MOUNTAIN;
          else if (maxE > 0.52) t = TILE.HILLS;
          else if (y < 130) t = m > 0.5 ? TILE.DARK_FOREST : TILE.SWAMP;
          else t = m > 0.45 ? TILE.AUTUMN_WOOD : TILE.FOREST;
        } else if (region === 'beacon') {
          t = TILE.CASTLE_FLOOR;
        } else if (region === 'pirate') {
          t = TILE.BADLANDS;
        } else {
          // 중앙 아테리아 본토
          if (y < 125 && maxE > 0.58) t = TILE.MOUNTAIN;
          else if (maxE > 0.62) t = TILE.MOUNTAIN;
          else if (maxE > 0.52) t = TILE.HILLS;
          else if (y > 185 && maxE < 0.42) t = TILE.FARMLAND;
          else if (m > 0.58) t = TILE.FOREST;
          else if (m > 0.42) t = TILE.MEADOW;
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

  // Lake in central continent (Silverleaf Lake, center: 220, 138)
  const lakeCenter = { x: 220, y: 138 };
  for (let y = lakeCenter.y - 12; y <= lakeCenter.y + 12; y++) {
    for (let x = lakeCenter.x - 16; x <= lakeCenter.x + 16; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot((x - lakeCenter.x) * 0.85, (y - lakeCenter.y) * 1.1);
      if (dist < 9.0) {
        tiles[idx(x, y)] = TILE.WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 11.0 && tiles[idx(x, y)] !== TILE.WATER) {
        tiles[idx(x, y)] = TILE.SAND;
        deco[idx(x, y)] = 0;
      }
    }
  }

  // Oasis Lake in Mirage Desert (center: 75, 235)
  const oasisCenter = { x: 75, y: 235 };
  for (let y = oasisCenter.y - 8; y <= oasisCenter.y + 8; y++) {
    for (let x = oasisCenter.x - 10; x <= oasisCenter.x + 10; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot(x - oasisCenter.x, y - oasisCenter.y);
      if (dist < 4.5) {
        tiles[idx(x, y)] = TILE.WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 7.5) {
        tiles[idx(x, y)] = TILE.MEADOW;
      }
    }
  }

  return { tiles, deco, inBounds, idx };
}

const res = generateNewWorld();
console.log('generateNewWorld ran successfully!');



const settlements = [
  // 1. 중앙 대륙 (아테리아 제국 본토)
  { id: 'solaris', name: '왕도 솔라리스', x: 240, y: 155, faction: 'kingdom' },
  { id: 'bluewave', name: '푸른파도 대항구', x: 185, y: 165, portWaterX: 174, portWaterY: 165, isPort: true },
  { id: 'ironforge', name: '아이언포지 드워프 광산성채', x: 245, y: 118 },
  { id: 'goldenwheat', name: '황금밀 대농장', x: 240, y: 195 },
  { id: 'valor_fort', name: '발로르 최전방 요새', x: 295, y: 160 },
  { id: 'silverleaf', name: '실버리프 호수마을', x: 215, y: 135 },
  { id: 'crystal_falls', name: '크리스탈폴 아케인 학탑', x: 215, y: 118 },
  { id: 'oakwood', name: '오크우드 벌목 마을', x: 270, y: 185 },
  { id: 'windmill_valley', name: '윈드밀 방앗간 계곡', x: 215, y: 190 },

  // 2. 서부 신대륙 (실바니아 요정림 & 미라주 사막 제국)
  { id: 'elvenheim', name: '신대륙 엘븐하임 성소', x: 75, y: 80, portWaterX: 102, portWaterY: 80, isPort: true },
  { id: 'fairy_glade', name: '달빛 요정 정원', x: 48, y: 60 },
  { id: 'celestial_haven', name: '천공의 룬 비행섬', x: 35, y: 105 },
  { id: 'dragon_eyrie', name: '천공의 용의 둥지 고원', x: 35, y: 150 },
  { id: 'mirage_oasis', name: '황금사막 미라주 오아시스', x: 75, y: 235, portWaterX: 105, portWaterY: 235, isPort: true },
  { id: 'sphinx_pyramid', name: '스핑크스 고대 피라미드', x: 45, y: 260 },
  { id: 'bedouin_camp', name: '베두인 전갈 유목민 캠프', x: 45, y: 205 },
  { id: 'goblin_camp', name: '고블린 소굴 야영지', x: 105, y: 160, danger: true },

  // 3. 북부 혹한 대륙 (노스펠름 만년설 영구동토)
  { id: 'frost_citadel', name: '서리 거인의 얼음 성채', x: 240, y: 32, danger: true },
  { id: 'st_mare', name: '세인트 마레 어촌 포구', x: 155, y: 55, portWaterX: 155, portWaterY: 68, isPort: true },
  { id: 'valkyrie_gate', name: '발키리 협곡 관문', x: 205, y: 55 },
  { id: 'orc_stronghold', name: '오크 혈투 대요새', x: 315, y: 45, danger: true },

  // 4. 남부 화염 대륙 (드라코니아 화산 & 용족 성역)
  { id: 'volcano_isle', name: '흑요석 화산 군도', x: 175, y: 280, danger: true },
  { id: 'dragon_graveyard', name: '용들의 안식처 묘지', x: 240, y: 285, danger: true },
  { id: 'magma_underforge', name: '마그마 심연 지하용광로', x: 305, y: 275 },
  { id: 'siren_coral', name: '세이렌 산호섬', x: 140, y: 255, portWaterX: 140, portWaterY: 245, isPort: true },

  // 5. 동부 신비 대륙 (네크로폴리스 & 수정 신비 대륙)
  { id: 'obsidian_necropolis', name: '흑요석 강령술 묘지', x: 425, y: 75, danger: true },
  { id: 'whispering_woods', name: '속삭이는 마법 숲', x: 375, y: 100 },
  { id: 'crystal_caverns', name: '수정 동굴 성소', x: 415, y: 155 },
  { id: 'dragon_ruins', name: '용의 계곡 고대 신전', x: 420, y: 220, danger: true },
  { id: 'sunken_shipwreck', name: '난파선 해구', x: 350, y: 225, portWaterX: 345, portWaterY: 215, isPort: true },

  // 6. 해협 및 바다의 관문/성역
  { id: 'lone_beacon', name: '외로운 등대섬', x: 162, y: 145, portWaterX: 162, portWaterY: 135, isPort: true },
  { id: 'pirate_cove', name: '해골초도 대해적 성채', x: 158, y: 185, portWaterX: 150, portWaterY: 185, isPort: true, danger: true },
  { id: 'atlantis_ruins', name: '아틀란티스 해저 침몰신전', x: 240, y: 228, portWaterX: 240, portWaterY: 228, isPort: true }
];

console.log(`Checking ${settlements.length} settlements...`);
settlements.forEach(s => {
  if (s.x < 5 || s.x >= WORLD_WIDTH - 5 || s.y < 5 || s.y >= WORLD_HEIGHT - 5) {
    console.error(`Settlement ${s.id} out of bounds: (${s.x}, ${s.y})`);
  }
});
console.log('All settlement coordinates within bounds!');

const TILE_REV = ['DEEP_WATER', 'WATER', 'SAND', 'GRASS', 'MEADOW', 'FOREST', 'DARK_FOREST', 'HILLS', 'MOUNTAIN', 'SNOW', 'BADLANDS', 'FARMLAND', 'ROAD', 'BRIDGE', 'CASTLE_FLOOR', 'DOCK', 'WALL', 'DESERT', 'ELVEN_FOREST', 'LAVA', 'CORAL', 'AUTUMN_WOOD', 'SWAMP'];
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
