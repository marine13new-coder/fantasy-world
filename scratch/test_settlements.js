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
