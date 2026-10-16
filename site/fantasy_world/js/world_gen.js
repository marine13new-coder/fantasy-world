// ============================================================================
// world_gen.js - 아테리아 본토 + 대해양 + 바다 너머 신대륙(엘븐하임·미라주 사막·해적섬·화산군도) 생성
// ============================================================================

const WORLD_WIDTH = 340;  // 가로 340 타일 (바다 너머 서부 신대륙 & 군도 포함)
const WORLD_HEIGHT = 240; // 세로 240 타일
const WORLD_SIZE = WORLD_WIDTH; // 하위 호환용
const TILE_SIZE = 32;

const TILE = {
  DEEP_WATER: 0,
  WATER: 1,
  SAND: 2,
  GRASS: 3,
  MEADOW: 4,
  FOREST: 5,
  DARK_FOREST: 6,
  HILLS: 7,
  MOUNTAIN: 8,
  SNOW: 9,
  BADLANDS: 10,
  FARMLAND: 11,
  ROAD: 12,
  BRIDGE: 13,
  CASTLE_FLOOR: 14,
  DOCK: 15,
  WALL: 16,
  DESERT: 17,
  ELVEN_FOREST: 18,
  LAVA: 19
};

const TILE_INFO = {
  [TILE.DEEP_WATER]:   { name: '대해양 (심해)', color: '#0b2239', miniColor: '#0b2239', walkable: false, naval: true },
  [TILE.WATER]:        { name: '연안/강/호수', color: '#1d4ed8', miniColor: '#2563eb', walkable: false, naval: true },
  [TILE.SAND]:         { name: '모래해변', color: '#d6be86', miniColor: '#d6be86', walkable: true, naval: false },
  [TILE.GRASS]:        { name: '초원', color: '#3b6e38', miniColor: '#3b6e38', walkable: true, naval: false },
  [TILE.MEADOW]:       { name: '비옥한 평야', color: '#477d40', miniColor: '#477d40', walkable: true, naval: false },
  [TILE.FOREST]:       { name: '울창한 숲', color: '#274e26', miniColor: '#234722', walkable: true, naval: false },
  [TILE.DARK_FOREST]:  { name: '그림자 숲', color: '#1d2f28', miniColor: '#1a2a24', walkable: true, naval: false },
  [TILE.HILLS]:        { name: '구릉지', color: '#5c5849', miniColor: '#5c5849', walkable: true, naval: false },
  [TILE.MOUNTAIN]:     { name: '험준한 산맥', color: '#454340', miniColor: '#454340', walkable: false, naval: false },
  [TILE.SNOW]:         { name: '만년설 봉우리', color: '#cbd5e1', miniColor: '#e2e8f0', walkable: false, naval: false },
  [TILE.BADLANDS]:     { name: '붉은 황무지', color: '#6b4232', miniColor: '#6b4232', walkable: true, naval: false },
  [TILE.FARMLAND]:     { name: '경작지', color: '#6d542d', miniColor: '#8c6d32', walkable: true, naval: false },
  [TILE.ROAD]:         { name: '왕국 가도', color: '#9c8c74', miniColor: '#b8a68a', walkable: true, naval: false },
  [TILE.BRIDGE]:       { name: '목조/석조 다리', color: '#855834', miniColor: '#a16c42', walkable: true, naval: true },
  [TILE.CASTLE_FLOOR]: { name: '성채 석재 바닥', color: '#787e87', miniColor: '#94a3b8', walkable: true, naval: false },
  [TILE.DOCK]:         { name: '항구 부두', color: '#78502b', miniColor: '#8c5e34', walkable: true, naval: true },
  [TILE.WALL]:         { name: '성벽', color: '#475569', miniColor: '#cbd5e1', walkable: false, naval: false },
  [TILE.DESERT]:       { name: '황금 사막', color: '#d99b4e', miniColor: '#d99b4e', walkable: true, naval: false },
  [TILE.ELVEN_FOREST]: { name: '신성한 요정숲', color: '#2b6e5e', miniColor: '#2dd4bf', walkable: true, naval: false },
  [TILE.LAVA]:         { name: '용암 지대', color: '#dc2626', miniColor: '#ef4444', walkable: false, naval: false }
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
  range(min, max) {
    return min + this.next() * (max - min);
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
  let total = 0;
  let amp = 0.5;
  let freq = 1;
  let maxVal = 0;
  for (let i = 0; i < octaves; i++) {
    total += noiseFn(x * freq, y * freq) * amp;
    maxVal += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return total / maxVal;
}

// 본토 X 오프셋 (+100 타일 이동하여 서쪽에 광활한 대해양과 신대륙 배치)
const MAINLAND_OFFSET_X = 100;

function generateWorld() {
  const rng = new SeededRNG(7772026);
  const elevNoise = createNoise2D(101);
  const moistNoise = createNoise2D(202);
  const detailNoise = createNoise2D(303);

  const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  // deco: 0:없음, 1:참나무, 2:침엽수, 3:꽃, 4:바위, 5:야자수/선인장, 6:벚꽃/요정나무
  const deco = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);

  const idx = (x, y) => y * WORLD_WIDTH + x;
  const inBounds = (x, y) => x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;

  // 1. 다중 대륙 & 대해양 지형 생성
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const nx = x / WORLD_WIDTH;
      const ny = y / WORLD_HEIGHT;
      const nVal = fbm(elevNoise, nx * 6.0, ny * 4.5, 4);
      const m = fbm(moistNoise, nx * 6.5, ny * 5.0, 3);
      const d = detailNoise(nx * 24, ny * 20);

      // 기본적으로는 바다로 시작
      let t = TILE.DEEP_WATER;

      // (A) 동부 아테리아 본 대륙 (x: 115 ~ 335)
      if (x >= 105) {
        const mx = (x - MAINLAND_OFFSET_X) / 240;
        const my = y / WORLD_HEIGHT;
        const edgeDistX = Math.min(Math.max(0, (mx - 0.05) / 0.16), (1 - mx) / 0.08, 1);
        const edgeDistY = Math.min(my / 0.09, (1 - my) / 0.12, 1);
        const islandMask = Math.min(edgeDistX, edgeDistY);
        let e = nVal * 0.78 + islandMask * 0.34 - 0.12;

        // 푸른파도 항구 앞바다 만(Bay)
        const distPortBay = Math.hypot(x - (28 + MAINLAND_OFFSET_X), y - 160);
        if (distPortBay < 34) {
          e -= (1 - distPortBay / 34) * 0.36;
        }
        // 북부 산맥 융기
        const distNorthMtn = Math.hypot((x - (135 + MAINLAND_OFFSET_X)) * 0.7, (y - 34) * 1.2);
        if (distNorthMtn < 52) {
          e += (1 - distNorthMtn / 52) * 0.42;
        }
        // 중앙 평원 보정
        const distPlains = Math.hypot(x - (102 + MAINLAND_OFFSET_X), y - 138);
        if (distPlains < 50) {
          e = e * 0.45 + 0.28;
        }

        if (e < 0.20) t = TILE.DEEP_WATER;
        else if (e < 0.27) t = TILE.WATER;
        else if (e < 0.305) t = TILE.SAND;
        else if (e > 0.75) t = TILE.SNOW;
        else if (e > 0.65) t = TILE.MOUNTAIN;
        else if (e > 0.56) t = TILE.HILLS;
        else {
          if (x > 165 + MAINLAND_OFFSET_X && y < 135) {
            t = m < 0.48 ? TILE.BADLANDS : TILE.HILLS;
          } else if (x > 152 + MAINLAND_OFFSET_X && y >= 135) {
            t = m > 0.42 ? TILE.DARK_FOREST : TILE.FOREST;
          } else {
            if (m > 0.62) t = TILE.FOREST;
            else if (m > 0.47) t = TILE.MEADOW;
            else t = TILE.GRASS;
          }
        }
      }

      // (B) 북서 신대륙: 요정과 세계수의 섬 '엘븐하임' (중심: x=46, y=58)
      const distElven = Math.hypot((x - 46) * 0.85, (y - 58) * 1.0);
      if (distElven < 38) {
        const eElv = (1 - distElven / 34) * 0.65 + nVal * 0.42;
        if (eElv > 0.36) {
          t = m > 0.42 ? TILE.ELVEN_FOREST : TILE.MEADOW;
          if (distElven < 10 && eElv > 0.68) t = TILE.MEADOW;
        } else if (eElv > 0.29) {
          t = TILE.SAND;
        } else if (eElv > 0.22) {
          t = TILE.WATER;
        }
      }

      // (C) 남서 신대륙: 황금 사막 제국 '미라주 오아시스' (중심: x=48, y=176)
      const distDesert = Math.hypot((x - 48) * 0.82, (y - 176) * 0.95);
      if (distDesert < 42) {
        const eDes = (1 - distDesert / 38) * 0.68 + nVal * 0.40;
        if (eDes > 0.68) {
          t = TILE.HILLS;
        } else if (eDes > 0.34) {
          t = TILE.DESERT;
          // 중앙 오아시스 호수 및 녹지
          const dOasis = Math.hypot(x - 46, y - 174);
          if (dOasis < 5.5) t = TILE.WATER;
          else if (dOasis < 9.5) t = TILE.MEADOW;
        } else if (eDes > 0.28) {
          t = TILE.SAND;
        } else if (eDes > 0.21) {
          t = TILE.WATER;
        }
      }

      // (D) 대해양 중앙 암초섬: '해골초도 해적 요새' (중심: x=96, y=112)
      const distPirate = Math.hypot((x - 96) * 1.0, (y - 112) * 1.1);
      if (distPirate < 18) {
        const ePir = (1 - distPirate / 16) * 0.65 + nVal * 0.38;
        if (ePir > 0.44) t = TILE.BADLANDS;
        else if (ePir > 0.33) t = TILE.SAND;
        else if (ePir > 0.22) t = TILE.WATER;
      }

      // (E) 북부 대해양 화산섬: '흑요석 화산 군도' (중심: x=102, y=38)
      const distVolcano = Math.hypot((x - 102), (y - 38) * 1.15);
      if (distVolcano < 17) {
        const eVol = (1 - distVolcano / 15) * 0.72 + nVal * 0.35;
        if (distVolcano < 4.2) t = TILE.LAVA;
        else if (eVol > 0.52) t = TILE.MOUNTAIN;
        else if (eVol > 0.34) t = TILE.BADLANDS;
        else if (eVol > 0.23) t = TILE.WATER;
      }

      tiles[idx(x, y)] = t;

      // 자연 장식물 배치
      if (t === TILE.FOREST && d > 0.38) deco[idx(x, y)] = 1;
      else if (t === TILE.DARK_FOREST && d > 0.35) deco[idx(x, y)] = 2;
      else if (t === TILE.MEADOW && d > 0.72) deco[idx(x, y)] = 3;
      else if ((t === TILE.HILLS || t === TILE.BADLANDS) && d > 0.70) deco[idx(x, y)] = 4;
      else if ((t === TILE.DESERT || t === TILE.SAND) && d > 0.78) deco[idx(x, y)] = 5; // 야자수/선인장
      else if (t === TILE.ELVEN_FOREST && d > 0.36) deco[idx(x, y)] = 6; // 요정 벚꽃나무
    }
  }

  // 2. 본토 실버리프 호수 & 강줄기 생성
  const lakeCenter = { x: 74 + MAINLAND_OFFSET_X, y: 78 };
  for (let y = lakeCenter.y - 16; y <= lakeCenter.y + 16; y++) {
    for (let x = lakeCenter.x - 20; x <= lakeCenter.x + 20; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot((x - lakeCenter.x) * 0.85, (y - lakeCenter.y) * 1.1);
      if (dist < 11.5) {
        tiles[idx(x, y)] = dist < 6.5 ? TILE.DEEP_WATER : TILE.WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 13.0 && tiles[idx(x, y)] !== TILE.WATER) {
        tiles[idx(x, y)] = TILE.SAND;
        deco[idx(x, y)] = 0;
      }
    }
  }

  function carveRiver(points, width = 2.4) {
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const steps = Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) * 2);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cx = p0.x + (p1.x - p0.x) * t + Math.sin(t * Math.PI * 2) * 1.8;
        const cy = p0.y + (p1.y - p0.y) * t + Math.cos(t * Math.PI * 2) * 1.2;
        const r = Math.ceil(width + 1);
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const rx = Math.round(cx + dx);
            const ry = Math.round(cy + dy);
            if (!inBounds(rx, ry)) continue;
            if (Math.hypot(dx, dy) <= width) {
              tiles[idx(rx, ry)] = TILE.WATER;
              deco[idx(rx, ry)] = 0;
            }
          }
        }
      }
    }
  }

  carveRiver([
    { x: 112 + MAINLAND_OFFSET_X, y: 40 },
    { x: 94 + MAINLAND_OFFSET_X, y: 58 },
    { x: 74 + MAINLAND_OFFSET_X, y: 78 },
    { x: 72 + MAINLAND_OFFSET_X, y: 112 },
    { x: 68 + MAINLAND_OFFSET_X, y: 136 },
    { x: 40 + MAINLAND_OFFSET_X, y: 156 }
  ], 2.3);

  carveRiver([
    { x: 155 + MAINLAND_OFFSET_X, y: 62 },
    { x: 145 + MAINLAND_OFFSET_X, y: 92 },
    { x: 140 + MAINLAND_OFFSET_X, y: 120 },
    { x: 115 + MAINLAND_OFFSET_X, y: 138 },
    { x: 68 + MAINLAND_OFFSET_X, y: 136 }
  ], 2.1);

  // 3. 전체 대륙 거점 (본토 9개 + 바다 너머 신대륙·해양 4개 = 총 13개 거점!)
  const settlements = [
    {
      id: 'solaris',
      name: '왕도 솔라리스',
      subtitle: '아테리아 왕국 수도 · 왕궁 & 중앙 대시장',
      icon: '👑',
      type: 'capital',
      faction: 'kingdom',
      x: 96 + MAINLAND_OFFSET_X,
      y: 110,
      radius: 18,
      gold: 9500,
      stocks: { wheat: 50, fish: 40, ore: 30, weapons: 35, herbs: 30, gems: 20, spices: 10 },
      prices: { wheat: 18, fish: 20, ore: 28, weapons: 65, herbs: 24, gems: 95, spices: 110 },
      description: '아테리아 국왕과 왕궁 근위대가 머무는 대륙 최대의 성채 수도입니다. 육로 상단과 바다 건너 신대륙의 진귀한 교역품이 모두 이곳으로 모입니다.'
    },
    {
      id: 'goldenwheat',
      name: '황금밀 농촌마을',
      subtitle: '본토 최대 곡창지대 · 풍차와 대농장',
      icon: '🌾',
      type: 'farming',
      faction: 'kingdom',
      x: 106 + MAINLAND_OFFSET_X,
      y: 168,
      radius: 14,
      gold: 2800,
      stocks: { wheat: 150, fish: 15, ore: 8, weapons: 10, herbs: 60, gems: 4, spices: 2 },
      prices: { wheat: 8, fish: 24, ore: 30, weapons: 60, herbs: 12, gems: 85, spices: 95 },
      description: '끝없이 펼쳐진 황금빛 밀밭과 약초밭을 일구는 평화로운 농촌입니다.'
    },
    {
      id: 'bluewave',
      name: '푸른파도 대항구',
      subtitle: '서해안 해상무역 허브 · 해군 기지 & 어시장',
      icon: '⚓',
      type: 'port',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 36 + MAINLAND_OFFSET_X,
      portWaterY: 152,
      x: 54 + MAINLAND_OFFSET_X,
      y: 152,
      radius: 14,
      gold: 4800,
      stocks: { wheat: 30, fish: 145, ore: 15, weapons: 20, herbs: 20, gems: 25, spices: 22 },
      prices: { wheat: 20, fish: 9, ore: 32, weapons: 58, herbs: 22, gems: 75, spices: 85 },
      description: '본토와 바다 너머 신대륙(엘븐하임·미라주 사막)을 잇는 대항구입니다. 무역 범선과 왕립 해군 함대가 출항하며 어부들이 고기를 낚습니다.'
    },
    {
      id: 'ironforge',
      name: '아이언포지 광산촌',
      subtitle: '북부 철벽산맥 · 광산 & 드워프 대장간',
      icon: '⛏️',
      type: 'mining',
      faction: 'kingdom',
      x: 124 + MAINLAND_OFFSET_X,
      y: 56,
      radius: 12,
      gold: 3600,
      stocks: { wheat: 15, fish: 10, ore: 140, weapons: 60, herbs: 10, gems: 32, spices: 2 },
      prices: { wheat: 24, fish: 26, ore: 11, weapons: 36, herbs: 25, gems: 60, spices: 100 },
      description: '험준한 북부 산맥 자락의 광산 요새로, 철광석·금광석·마정석을 채굴하고 강철 무기를 단조합니다.'
    },
    {
      id: 'silverleaf',
      name: '실버리프 호수마을',
      subtitle: '에메랄드 호숫가 · 민물 낚시터와 약초 공방',
      icon: '🌲',
      type: 'lakeside',
      faction: 'kingdom',
      x: 74 + MAINLAND_OFFSET_X,
      y: 95,
      radius: 10,
      gold: 2100,
      stocks: { wheat: 30, fish: 80, ore: 10, weapons: 12, herbs: 90, gems: 8, spices: 4 },
      prices: { wheat: 16, fish: 11, ore: 28, weapons: 55, herbs: 10, gems: 80, spices: 90 },
      description: '맑은 실버리프 호수 남쪽에 위치한 마을로, 호수 어부들과 약초꾼들이 살아갑니다.'
    },
    {
      id: 'valor_fort',
      name: '발로르 변경 요새',
      subtitle: '동부 전선 방어기지 · 용병 길드 & 모험가 주둔지',
      icon: '🛡️',
      type: 'fortress',
      faction: 'kingdom',
      x: 154 + MAINLAND_OFFSET_X,
      y: 116,
      radius: 12,
      gold: 4100,
      stocks: { wheat: 35, fish: 25, ore: 30, weapons: 65, herbs: 35, gems: 22, spices: 6 },
      prices: { wheat: 22, fish: 22, ore: 20, weapons: 48, herbs: 28, gems: 70, spices: 95 },
      description: '동부 황무지와 그림자 숲의 몬스터 침공을 막아내는 최전선 요새입니다.'
    },
    // === 바다 너머 신대륙 거점들 ===
    {
      id: 'elvenheim',
      name: '신대륙 엘븐하임 성소',
      subtitle: '북서 바다 너머 요정 대륙 · 세계수와 마법 학탑',
      icon: '🌸',
      type: 'overseas_elven',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 74,
      portWaterY: 64,
      x: 46,
      y: 58,
      radius: 13,
      gold: 6200,
      stocks: { wheat: 40, fish: 35, ore: 15, weapons: 45, herbs: 160, gems: 65, spices: 45 },
      prices: { wheat: 22, fish: 20, ore: 38, weapons: 55, herbs: 8, gems: 45, spices: 70 },
      description: '대해양 북서쪽 바다 건너에 위치한 신비로운 엘프와 정령들의 대륙입니다. 세계수의 영약과 마법 보석을 해상 무역선으로 수출합니다.'
    },
    {
      id: 'mirage_oasis',
      name: '황금사막 미라주 오아시스',
      subtitle: '남서 바다 너머 사막 제국 · 향신료·보석 대교역항',
      icon: '🏜️',
      type: 'overseas_desert',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 80,
      portWaterY: 172,
      x: 52,
      y: 174,
      radius: 14,
      gold: 7400,
      stocks: { wheat: 20, fish: 20, ore: 35, weapons: 30, herbs: 25, gems: 110, spices: 180 },
      prices: { wheat: 32, fish: 30, ore: 25, weapons: 70, herbs: 30, gems: 40, spices: 15 },
      description: '남서쪽 바다 건너 황금 사막 한가운데 피어난 오아시스 무역 도시입니다. 진귀한 향신료와 황금 유물이 가득하여 해상 무역선들이 일확천금을 노리고 입항합니다.'
    },
    // === 해양 & 본토 위험 지대 (몬스터/해적 군락) ===
    {
      id: 'pirate_cove',
      name: '해골초도 해적 요새',
      subtitle: '대해양 중앙 암초섬 · 대해적 함대 본거지',
      icon: '🏴‍☠️',
      type: 'monster_lair',
      faction: 'monster',
      danger: true,
      isPort: true,
      portWaterX: 96,
      portWaterY: 126,
      x: 96,
      y: 112,
      radius: 11,
      gold: 3900,
      stocks: {},
      prices: {},
      description: '대해양 항로 한가운데 자리 잡은 해적단과 바다 괴수들의 소굴입니다. 해적선들이 출항해 본토와 신대륙을 오가는 무역선을 약탈합니다.'
    },
    {
      id: 'volcano_isle',
      name: '흑요석 화산 군도',
      subtitle: '북부 대해양 · 심해 크라켄 & 화염 골렘 둥지',
      icon: '🌋',
      type: 'monster_lair',
      faction: 'monster',
      danger: true,
      x: 102,
      y: 38,
      radius: 10,
      gold: 4500,
      stocks: {},
      prices: {},
      description: '검은 용암이 끓어오르는 바다의 화산섬입니다. 주변 해역에는 심해 괴수 크라켄이 도사리고 있습니다.'
    },
    {
      id: 'goblin_camp',
      name: '그림자숲 고블린 군락',
      subtitle: '남동부 위험지대 · 약탈자 야영지',
      icon: '👺',
      type: 'monster_lair',
      faction: 'monster',
      danger: true,
      x: 176 + MAINLAND_OFFSET_X,
      y: 170,
      radius: 11,
      gold: 1200,
      stocks: {},
      prices: {},
      description: '울창한 그림자 숲 깊은 곳에 세워진 고블린과 늑대 무리의 본거지입니다.'
    },
    {
      id: 'orc_stronghold',
      name: '붉은협곡 오크 요새',
      subtitle: '동부 황무지 · 오크 전사 군단 주둔지',
      icon: '👹',
      type: 'monster_lair',
      faction: 'monster',
      danger: true,
      x: 196 + MAINLAND_OFFSET_X,
      y: 104,
      radius: 12,
      gold: 2200,
      stocks: {},
      prices: {},
      description: '붉은 협곡에 세워진 호전적인 오크 전사들의 군락입니다.'
    },
    {
      id: 'dragon_ruins',
      name: '고대 용의 폐허',
      subtitle: '북동부 설산 · 언데드 군단과 고대 와이번 둥지',
      icon: '🐉',
      type: 'monster_lair',
      faction: 'monster',
      danger: true,
      x: 186 + MAINLAND_OFFSET_X,
      y: 48,
      radius: 12,
      gold: 5000,
      stocks: {},
      prices: {},
      description: '고대 왕국의 유적이 잠든 설산 지대입니다. 해골 기사단과 거대한 레드 와이번이 서식합니다.'
    }
  ];

  // 거점 주변 평탄화
  for (const s of settlements) {
    const r = s.radius + 2;
    for (let y = s.y - r; y <= s.y + r; y++) {
      for (let x = s.x - r; x <= s.x + r; x++) {
        if (!inBounds(x, y)) continue;
        const d = Math.hypot(x - s.x, y - s.y);
        if (d <= s.radius) {
          const cur = tiles[idx(x, y)];
          if (s.id === 'bluewave' && x < s.x - 4) continue;
          if (cur === TILE.DEEP_WATER || cur === TILE.WATER || cur === TILE.LAVA) continue;
          if (s.type === 'capital') tiles[idx(x, y)] = TILE.CASTLE_FLOOR;
          else if (s.type === 'overseas_desert') tiles[idx(x, y)] = TILE.DESERT;
          else if (s.type === 'overseas_elven') tiles[idx(x, y)] = TILE.ELVEN_FOREST;
          else if (s.faction === 'monster') {
            if (cur === TILE.MOUNTAIN || cur === TILE.SNOW) tiles[idx(x, y)] = TILE.BADLANDS;
          } else {
            tiles[idx(x, y)] = TILE.GRASS;
          }
          deco[idx(x, y)] = 0;
        }
      }
    }
  }

  // 4. 본토 육상 도로망 및 신대륙 내부 도로 건설
  const roadLinks = [
    ['solaris', 'goldenwheat'],
    ['solaris', 'bluewave'],
    ['solaris', 'silverleaf'],
    ['silverleaf', 'ironforge'],
    ['solaris', 'valor_fort'],
    ['goldenwheat', 'bluewave'],
    ['goldenwheat', 'valor_fort'],
    ['ironforge', 'valor_fort'],
    ['valor_fort', 'orc_stronghold'],
    ['valor_fort', 'goblin_camp'],
    ['goldenwheat', 'goblin_camp'],
    ['ironforge', 'dragon_ruins']
  ];

  // 해상 무역 항로 정의 (바다 건너 신대륙 교역로)
  const seaRoutes = [
    { from: 'bluewave', to: 'elvenheim', name: '북서 요정항로' },
    { from: 'bluewave', to: 'mirage_oasis', name: '남서 황금향신료 항로' },
    { from: 'elvenheim', to: 'mirage_oasis', name: '서해 신대륙 종단항로' }
  ];

  function buildRoad(x0, y0, x1, y1, width = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const curve = Math.sin(t * Math.PI) * 3.5;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const cx = Math.round(x0 + dx * t + nx * curve);
      const cy = Math.round(y0 + dy * t + ny * curve);

      for (let wy = -width; wy <= width; wy++) {
        for (let wx = -width; wx <= width; wx++) {
          const rx = cx + wx;
          const ry = cy + wy;
          if (!inBounds(rx, ry)) continue;
          const cur = tiles[idx(rx, ry)];
          deco[idx(rx, ry)] = 0;
          if (cur === TILE.WATER || cur === TILE.DEEP_WATER) {
            tiles[idx(rx, ry)] = TILE.BRIDGE;
          } else if (cur !== TILE.CASTLE_FLOOR && cur !== TILE.BRIDGE) {
            tiles[idx(rx, ry)] = TILE.ROAD;
          }
        }
      }
    }
  }

  const settlementMap = Object.fromEntries(settlements.map(s => [s.id, s]));
  for (const [idA, idB] of roadLinks) {
    const a = settlementMap[idA];
    const b = settlementMap[idB];
    const isMainHighway = a.faction === 'kingdom' && b.faction === 'kingdom';
    buildRoad(a.x, a.y, b.x, b.y, isMainHighway ? 1 : 0);
  }

  // 5. 건물, 성벽, 부두, 농장, 광산 배치
  const buildings = [];
  const cap = settlementMap['solaris'];
  const wallR = 15;
  for (let y = cap.y - wallR; y <= cap.y + wallR; y++) {
    for (let x = cap.x - wallR; x <= cap.x + wallR; x++) {
      const dx = Math.abs(x - cap.x);
      const dy = Math.abs(y - cap.y);
      if (Math.max(dx, dy) <= wallR) {
        tiles[idx(x, y)] = TILE.CASTLE_FLOOR;
        deco[idx(x, y)] = 0;
      }
      if (Math.max(dx, dy) === wallR) {
        const isGate = (dx <= 2 || dy <= 2);
        tiles[idx(x, y)] = isGate ? TILE.ROAD : TILE.WALL;
      }
    }
  }
  for (let i = -wallR; i <= wallR; i++) {
    for (let w = -1; w <= 1; w++) {
      tiles[idx(cap.x + i, cap.y + w)] = TILE.ROAD;
      tiles[idx(cap.x + w, cap.y + i)] = TILE.ROAD;
    }
  }

  function addBuilding(b) { buildings.push(b); }

  // 왕도 솔라리스
  addBuilding({ id: 'palace', settlementId: 'solaris', name: '솔라리스 왕궁 (태양성)', type: 'palace', x: cap.x, y: cap.y - 7, w: 7, h: 5, color: '#d4af37', roofColor: '#1e3a8a', icon: '👑' });
  addBuilding({ id: 'cap_market_w', settlementId: 'solaris', name: '왕도 중앙 대시장 (서관)', type: 'market', x: cap.x - 7, y: cap.y + 3, w: 4, h: 3, color: '#f59e0b', roofColor: '#b45309', icon: '⚖️' });
  addBuilding({ id: 'cap_market_e', settlementId: 'solaris', name: '왕도 중앙 대시장 (동관)', type: 'market', x: cap.x + 7, y: cap.y + 3, w: 4, h: 3, color: '#f59e0b', roofColor: '#b45309', icon: '⚖️' });
  addBuilding({ id: 'cap_barracks', settlementId: 'solaris', name: '왕실 근위대 병영', type: 'barracks', x: cap.x + 8, y: cap.y - 6, w: 4, h: 4, color: '#60a5fa', roofColor: '#1d4ed8', icon: '🛡️' });
  addBuilding({ id: 'cap_guild', settlementId: 'solaris', name: '왕립 모험가 길드 본부', type: 'guild', x: cap.x - 8, y: cap.y - 6, w: 4, h: 4, color: '#a78bfa', roofColor: '#5b21b6', icon: '⚔️' });
  addBuilding({ id: 'cap_inn', settlementId: 'solaris', name: '황금사자 여관 & 주점', type: 'inn', x: cap.x - 7, y: cap.y + 8, w: 4, h: 3, color: '#fb923c', roofColor: '#9a3412', icon: '🍺' });
  addBuilding({ id: 'cap_house1', settlementId: 'solaris', name: '귀족 저택', type: 'house', x: cap.x + 7, y: cap.y + 8, w: 4, h: 3, color: '#94a3b8', roofColor: '#334155', icon: '🏛️' });

  // 황금밀 농촌마을 & 신대륙 엘븐하임 농장
  const farmVillage = settlementMap['goldenwheat'];
  const elvenTown = settlementMap['elvenheim'];
  const desertTown = settlementMap['mirage_oasis'];
  const farmPlots = [];
  const plotOffsets = [
    { base: farmVillage, ox: -14, oy: -10, w: 7, h: 6, crop: '밀' },
    { base: farmVillage, ox: -14, oy: 2,  w: 7, h: 6, crop: '밀' },
    { base: farmVillage, ox: 7,   oy: -10, w: 8, h: 6, crop: '밀' },
    { base: farmVillage, ox: 7,   oy: 2,  w: 8, h: 6, crop: '약초' },
    { base: farmVillage, ox: -4,  oy: 9,  w: 9, h: 6, crop: '밀' },
    { base: elvenTown,   ox: -10, oy: 5,  w: 7, h: 5, crop: '약초' },
    { base: desertTown,  ox: -10, oy: -8, w: 7, h: 5, crop: '향신료' }
  ];

  for (const po of plotOffsets) {
    for (let py = 0; py < po.h; py++) {
      for (let px = 0; px < po.w; px++) {
        const tx = po.base.x + po.ox + px;
        const ty = po.base.y + po.oy + py;
        if (inBounds(tx, ty) && tiles[idx(tx, ty)] !== TILE.ROAD && tiles[idx(tx, ty)] !== TILE.WATER) {
          tiles[idx(tx, ty)] = TILE.FARMLAND;
          deco[idx(tx, ty)] = 0;
          farmPlots.push({
            x: tx,
            y: ty,
            settlementId: po.base.id,
            cropType: po.crop,
            growth: rng.range(20, 95),
            reservedBy: null
          });
        }
      }
    }
  }

  addBuilding({ id: 'gw_mill', settlementId: 'goldenwheat', name: '황금밀 대풍차 & 곡물창고', type: 'granary', x: farmVillage.x, y: farmVillage.y - 4, w: 4, h: 4, color: '#eab308', roofColor: '#854d0e', icon: '🌾' });
  addBuilding({ id: 'gw_market', settlementId: 'goldenwheat', name: '농산물 직거래 장터', type: 'market', x: farmVillage.x - 4, y: farmVillage.y + 3, w: 4, h: 3, color: '#f59e0b', roofColor: '#92400e', icon: '🛒' });
  addBuilding({ id: 'gw_house1', settlementId: 'goldenwheat', name: '농부의 오두막', type: 'house', x: farmVillage.x + 4, y: farmVillage.y - 3, w: 3, h: 3, color: '#d97706', roofColor: '#78350f', icon: '🏠' });

  // 푸른파도 대항구 & 신대륙 항구 부두(Docks) 생성
  const port = settlementMap['bluewave'];
  const fishingSpots = [];
  const dockYs = [port.y - 5, port.y, port.y + 5];
  for (const dy of dockYs) {
    for (let dx = -16; dx <= -2; dx++) {
      const tx = port.x + dx;
      const ty = dy;
      if (inBounds(tx, ty)) {
        tiles[idx(tx, ty)] = TILE.DOCK;
        deco[idx(tx, ty)] = 0;
        if (dx <= -9) {
          fishingSpots.push({
            x: tx,
            y: ty,
            waterX: tx,
            waterY: ty - 2,
            settlementId: 'bluewave',
            isBoat: false
          });
        }
      }
    }
    fishingSpots.push({
      x: port.x - 20,
      y: dy + 1,
      waterX: port.x - 22,
      waterY: dy + 1,
      settlementId: 'bluewave',
      isBoat: true
    });
  }

  // 엘븐하임 동쪽 해안 부두 건설
  for (let dx = 12; dx <= 28; dx++) {
    const tx = elvenTown.x + dx;
    const ty = elvenTown.y + 6;
    if (inBounds(tx, ty)) {
      tiles[idx(tx, ty)] = TILE.DOCK;
      deco[idx(tx, ty)] = 0;
    }
  }
  buildRoad(elvenTown.x, elvenTown.y, elvenTown.x + 12, elvenTown.y + 6, 1);

  // 미라주 오아시스 동쪽 해안 부두 건설
  for (let dx = 14; dx <= 30; dx++) {
    const tx = desertTown.x + dx;
    const ty = desertTown.y - 2;
    if (inBounds(tx, ty)) {
      tiles[idx(tx, ty)] = TILE.DOCK;
      deco[idx(tx, ty)] = 0;
    }
  }
  buildRoad(desertTown.x, desertTown.y, desertTown.x + 14, desertTown.y - 2, 1);

  addBuilding({ id: 'bw_market', settlementId: 'bluewave', name: '푸른파도 해상교역소 & 수산시장', type: 'market', x: port.x + 2, y: port.y - 2, w: 5, h: 4, color: '#38bdf8', roofColor: '#0369a1', icon: '⚓' });
  addBuilding({ id: 'bw_inn', settlementId: 'bluewave', name: '닻과 인어 항해사 주점', type: 'inn', x: port.x + 4, y: port.y + 4, w: 4, h: 3, color: '#0284c7', roofColor: '#075985', icon: '🍺' });
  addBuilding({ id: 'bw_navy', settlementId: 'bluewave', name: '왕립 해군 제독부', type: 'barracks', x: port.x + 3, y: port.y - 7, w: 4, h: 3, color: '#60a5fa', roofColor: '#1e3a8a', icon: '🚢' });

  // 엘븐하임 성소 건물들
  addBuilding({ id: 'elv_tree', settlementId: 'elvenheim', name: '세계수 이그드라실 성소', type: 'palace', x: elvenTown.x, y: elvenTown.y - 3, w: 6, h: 5, color: '#2dd4bf', roofColor: '#0f766e', icon: '🌸' });
  addBuilding({ id: 'elv_spire', settlementId: 'elvenheim', name: '별빛 아카나 마법학탑', type: 'guild', x: elvenTown.x - 6, y: elvenTown.y + 2, w: 4, h: 4, color: '#c084fc', roofColor: '#6b21a8', icon: '🔮' });
  addBuilding({ id: 'elv_market', settlementId: 'elvenheim', name: '엘프 영약·보석 교역소', type: 'market', x: elvenTown.x + 6, y: elvenTown.y + 2, w: 4, h: 3, color: '#34d399', roofColor: '#065f46', icon: '💎' });

  // 미라주 오아시스 사막 제국 건물들
  addBuilding({ id: 'mir_palace', settlementId: 'mirage_oasis', name: '황금 술탄의 신기루 궁전', type: 'palace', x: desertTown.x, y: desertTown.y - 5, w: 6, h: 5, color: '#facc15', roofColor: '#b45309', icon: '🕌' });
  addBuilding({ id: 'mir_bazaar', settlementId: 'mirage_oasis', name: '미라주 대바자르 (향신료·유물 시장)', type: 'market', x: desertTown.x + 6, y: desertTown.y + 2, w: 5, h: 4, color: '#f97316', roofColor: '#9a3412', icon: '🌶️' });
  addBuilding({ id: 'mir_pyramid', settlementId: 'mirage_oasis', name: '고대 태양왕의 피라미드', type: 'guild', x: desertTown.x - 9, y: desertTown.y + 4, w: 5, h: 5, color: '#eab308', roofColor: '#713f12', icon: '🏺' });

  // 실버리프 호숫가 부두
  const lakeTown = settlementMap['silverleaf'];
  for (let dx = -2; dx <= 2; dx += 4) {
    for (let dy = -11; dy <= -5; dy++) {
      const tx = lakeTown.x + dx;
      const ty = lakeTown.y + dy;
      if (inBounds(tx, ty)) {
        tiles[idx(tx, ty)] = TILE.DOCK;
        deco[idx(tx, ty)] = 0;
        if (dy <= -8) {
          fishingSpots.push({
            x: tx,
            y: ty,
            waterX: tx,
            waterY: ty - 2,
            settlementId: 'silverleaf',
            isBoat: false
          });
        }
      }
    }
  }
  addBuilding({ id: 'sl_lodge', settlementId: 'silverleaf', name: '실버리프 호수 산장 & 교역소', type: 'market', x: lakeTown.x, y: lakeTown.y, w: 4, h: 3, color: '#34d399', roofColor: '#065f46', icon: '🌲' });

  // 아이언포지 광산촌
  const mineTown = settlementMap['ironforge'];
  const mineNodes = [
    { x: mineTown.x - 8, y: mineTown.y - 7, oreType: '철광석', richness: 100 },
    { x: mineTown.x - 4, y: mineTown.y - 9, oreType: '철광석', richness: 100 },
    { x: mineTown.x + 4, y: mineTown.y - 8, oreType: '금광석', richness: 100 },
    { x: mineTown.x + 8, y: mineTown.y - 6, oreType: '마정석', richness: 100 },
    { x: mineTown.x - 9, y: mineTown.y - 3, oreType: '철광석', richness: 100 },
    { x: mineTown.x + 9, y: mineTown.y - 2, oreType: '금광석', richness: 100 }
  ];
  for (const mn of mineNodes) {
    if (inBounds(mn.x, mn.y)) {
      tiles[idx(mn.x, mn.y)] = TILE.HILLS;
      deco[idx(mn.x, mn.y)] = 4;
    }
  }
  addBuilding({ id: 'if_forge', settlementId: 'ironforge', name: '드워프 대용광로 & 대장간', type: 'forge', x: mineTown.x, y: mineTown.y, w: 5, h: 4, color: '#f97316', roofColor: '#7c2d12', icon: '⚒️' });
  addBuilding({ id: 'if_market', settlementId: 'ironforge', name: '광물·무기 교역소', type: 'market', x: mineTown.x - 5, y: mineTown.y + 4, w: 4, h: 3, color: '#94a3b8', roofColor: '#334155', icon: '⛏️' });

  // 발로르 변경 요새
  const fort = settlementMap['valor_fort'];
  addBuilding({ id: 'vf_keep', settlementId: 'valor_fort', name: '발로르 변경 사령부', type: 'barracks', x: fort.x, y: fort.y - 3, w: 5, h: 4, color: '#60a5fa', roofColor: '#1e3a8a', icon: '🛡️' });
  addBuilding({ id: 'vf_merc', settlementId: 'valor_fort', name: '붉은매 용병단 & 모험가 캠프', type: 'guild', x: fort.x - 5, y: fort.y + 3, w: 4, h: 3, color: '#f43f5e', roofColor: '#881337', icon: '⚔️' });

  // 위험 지대 건물들 (해적 요새, 화산 군도, 고블린, 오크, 드래곤)
  const pirate = settlementMap['pirate_cove'];
  addBuilding({ id: 'pir_fort', settlementId: 'pirate_cove', name: '블랙비어드 해적단 요새', type: 'lair', x: pirate.x, y: pirate.y, w: 5, h: 4, color: '#334155', roofColor: '#0f172a', icon: '🏴‍☠️' });

  const volcano = settlementMap['volcano_isle'];
  addBuilding({ id: 'vol_altar', settlementId: 'volcano_isle', name: '심해 크라켄 & 화산 제단', type: 'lair', x: volcano.x, y: volcano.y + 4, w: 5, h: 4, color: '#dc2626', roofColor: '#450a0a', icon: '🦑' });

  const gob = settlementMap['goblin_camp'];
  addBuilding({ id: 'gob_totem', settlementId: 'goblin_camp', name: '고블린 족장의 해골 천막', type: 'lair', x: gob.x, y: gob.y, w: 4, h: 4, color: '#dc2626', roofColor: '#450a0a', icon: '👺' });

  const orc = settlementMap['orc_stronghold'];
  addBuilding({ id: 'orc_altar', settlementId: 'orc_stronghold', name: '오크 대족장의 피의 요새', type: 'lair', x: orc.x, y: orc.y, w: 5, h: 4, color: '#b91c1c', roofColor: '#3f1d1d', icon: '👹' });

  const drag = settlementMap['dragon_ruins'];
  addBuilding({ id: 'drag_nest', settlementId: 'dragon_ruins', name: '고대 드래곤의 제단', type: 'lair', x: drag.x, y: drag.y, w: 6, h: 5, color: '#9333ea', roofColor: '#3b0764', icon: '🐉' });

  return {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    tileSize: TILE_SIZE,
    tiles,
    deco,
    settlements,
    settlementMap,
    buildings,
    farmPlots,
    fishingSpots,
    mineNodes,
    roadLinks,
    seaRoutes,
    getTile(tx, ty) {
      if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) return TILE.DEEP_WATER;
      return tiles[ty * WORLD_WIDTH + tx];
    },
    isWalkable(tx, ty) {
      const t = this.getTile(tx, ty);
      return TILE_INFO[t] ? TILE_INFO[t].walkable : false;
    },
    isNaval(tx, ty) {
      const t = this.getTile(tx, ty);
      return TILE_INFO[t] ? !!TILE_INFO[t].naval : false;
    }
  };
}

window.WORLD_WIDTH = WORLD_WIDTH;
window.WORLD_HEIGHT = WORLD_HEIGHT;
window.WORLD_SIZE = WORLD_WIDTH;
window.TILE_SIZE = TILE_SIZE;
window.TILE = TILE;
window.TILE_INFO = TILE_INFO;
window.generateWorld = generateWorld;
