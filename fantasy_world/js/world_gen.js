// ============================================================================
// world_gen.js - 아테리아 대륙 지형, 강, 도로망, 왕궁, 마을, 농장, 낚시터, 광산, 던전 생성
// ============================================================================

const WORLD_SIZE = 240; // 240 x 240 타일
const TILE_SIZE = 32;   // 타일 당 32px (총 7680 x 7680 월드)

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
  WALL: 16
};

const TILE_INFO = {
  [TILE.DEEP_WATER]:   { name: '심해', color: '#0e2a47', miniColor: '#0e2a47', walkable: false },
  [TILE.WATER]:        { name: '강/연안', color: '#1d4ed8', miniColor: '#2563eb', walkable: false },
  [TILE.SAND]:         { name: '모래해변', color: '#d6be86', miniColor: '#d6be86', walkable: true },
  [TILE.GRASS]:        { name: '초원', color: '#3b6e38', miniColor: '#3b6e38', walkable: true },
  [TILE.MEADOW]:       { name: '비옥한 평야', color: '#477d40', miniColor: '#477d40', walkable: true },
  [TILE.FOREST]:       { name: '울창한 숲', color: '#274e26', miniColor: '#234722', walkable: true },
  [TILE.DARK_FOREST]:  { name: '그림자 숲', color: '#1d2f28', miniColor: '#1a2a24', walkable: true },
  [TILE.HILLS]:        { name: '구릉지', color: '#5c5849', miniColor: '#5c5849', walkable: true },
  [TILE.MOUNTAIN]:     { name: '험준한 산맥', color: '#454340', miniColor: '#454340', walkable: false },
  [TILE.SNOW]:         { name: '만년설 봉우리', color: '#cbd5e1', miniColor: '#e2e8f0', walkable: false },
  [TILE.BADLANDS]:     { name: '붉은 황무지', color: '#6b4232', miniColor: '#6b4232', walkable: true },
  [TILE.FARMLAND]:     { name: '경작지', color: '#6d542d', miniColor: '#8c6d32', walkable: true },
  [TILE.ROAD]:         { name: '왕국 가도', color: '#9c8c74', miniColor: '#b8a68a', walkable: true },
  [TILE.BRIDGE]:       { name: '목조/석조 다리', color: '#855834', miniColor: '#a16c42', walkable: true },
  [TILE.CASTLE_FLOOR]: { name: '성채 석재 바닥', color: '#787e87', miniColor: '#94a3b8', walkable: true },
  [TILE.DOCK]:         { name: '항구 부두', color: '#78502b', miniColor: '#8c5e34', walkable: true },
  [TILE.WALL]:         { name: '성벽', color: '#475569', miniColor: '#cbd5e1', walkable: false }
};

// 결정론적 시드 난수 생성기
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
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// 부드러운 2D Value Noise
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

// 월드 데이터 생성 함수
function generateWorld() {
  const rng = new SeededRNG(7772026);
  const elevNoise = createNoise2D(101);
  const moistNoise = createNoise2D(202);
  const detailNoise = createNoise2D(303);

  const tiles = new Uint8Array(WORLD_SIZE * WORLD_SIZE);
  const deco = new Uint8Array(WORLD_SIZE * WORLD_SIZE); // 나무, 꽃, 바위 등 장식(0:없음, 1:참나무, 2:소나무, 3:꽃, 4:바위, 5:수초)

  const idx = (x, y) => y * WORLD_SIZE + x;
  const inBounds = (x, y) => x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE;

  // 1. 기본 대륙 지형 생성 (서쪽·남서쪽은 대해양, 북쪽·북동쪽은 산맥, 중앙은 대평원, 동쪽은 황무지/그림자숲)
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      const nx = x / WORLD_SIZE;
      const ny = y / WORLD_SIZE;

      let e = fbm(elevNoise, nx * 4.2, ny * 4.2, 4);
      const m = fbm(moistNoise, nx * 5.0, ny * 5.0, 3);
      const d = detailNoise(nx * 18, ny * 18);

      // 가장자리 바다 마스크 (특히 서쪽과 남쪽 해안선 형성)
      const edgeDistX = Math.min(nx / 0.16, (1 - nx) / 0.08, 1);
      const edgeDistY = Math.min(ny / 0.09, (1 - ny) / 0.12, 1);
      const islandMask = Math.min(edgeDistX, edgeDistY);
      e = e * 0.78 + islandMask * 0.32 - 0.12;

      // 서쪽 해안 만(Bay) 형성 (항구마을 앞바다)
      const distPortBay = Math.hypot(x - 28, y - 160);
      if (distPortBay < 34) {
        e -= (1 - distPortBay / 34) * 0.36;
      }

      // 북부/북동부 대산맥 융기
      const distNorthMtn = Math.hypot((x - 135) * 0.7, (y - 34) * 1.2);
      if (distNorthMtn < 52) {
        e += (1 - distNorthMtn / 52) * 0.42;
      }

      // 중앙-서부 왕도 및 황금밀 평원은 평탄하고 비옥하게 보정
      const distPlains = Math.hypot(x - 102, y - 138);
      if (distPlains < 50) {
        e = e * 0.45 + 0.28;
      }

      let t = TILE.GRASS;
      if (e < 0.20) {
        t = TILE.DEEP_WATER;
      } else if (e < 0.27) {
        t = TILE.WATER;
      } else if (e < 0.305) {
        t = TILE.SAND;
      } else if (e > 0.75) {
        t = TILE.SNOW;
      } else if (e > 0.65) {
        t = TILE.MOUNTAIN;
      } else if (e > 0.56) {
        t = TILE.HILLS;
      } else {
        // 동쪽/북동쪽은 붉은 협곡 황무지, 남동쪽은 그림자 숲
        if (x > 165 && y < 135) {
          t = m < 0.48 ? TILE.BADLANDS : TILE.HILLS;
        } else if (x > 152 && y >= 135) {
          t = m > 0.42 ? TILE.DARK_FOREST : TILE.FOREST;
        } else {
          if (m > 0.62) t = TILE.FOREST;
          else if (m > 0.47) t = TILE.MEADOW;
          else t = TILE.GRASS;
        }
      }

      tiles[idx(x, y)] = t;

      // 자연 장식물 배치
      if (t === TILE.FOREST && d > 0.38) deco[idx(x, y)] = 1; // 참나무
      else if (t === TILE.DARK_FOREST && d > 0.35) deco[idx(x, y)] = 2; // 침엽수/고목
      else if (t === TILE.MEADOW && d > 0.72) deco[idx(x, y)] = 3; // 야생화
      else if ((t === TILE.HILLS || t === TILE.BADLANDS) && d > 0.70) deco[idx(x, y)] = 4; // 바위
    }
  }

  // 2. 실버리프 에메랄드 호수 & 대륙을 가로지르는 강 줄기 생성
  const lakeCenter = { x: 74, y: 78 };
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

  // 강 줄기 1: 북부 산맥(118, 42) -> 실버리프 호수(74, 78) -> 왕도 남쪽 -> 푸른파도 항구만(42, 158)
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
            const d = Math.hypot(dx, dy);
            if (d <= width) {
              tiles[idx(rx, ry)] = TILE.WATER;
              deco[idx(rx, ry)] = 0;
            }
          }
        }
      }
    }
  }

  carveRiver([
    { x: 112, y: 40 },
    { x: 94, y: 58 },
    { x: 74, y: 78 },
    { x: 72, y: 112 },
    { x: 68, y: 136 },
    { x: 46, y: 156 }
  ], 2.3);

  // 강 줄기 2: 동부 산맥(155, 62) -> 변경백 요새 서쪽(142, 118) -> 남부 합류(68, 136)
  carveRiver([
    { x: 155, y: 62 },
    { x: 145, y: 92 },
    { x: 140, y: 120 },
    { x: 115, y: 138 },
    { x: 68, y: 136 }
  ], 2.1);

  // 3. 대륙 핵심 거점 (왕궁, 마을, 항구, 광산, 요새, 몬스터 군락) 정의
  const settlements = [
    {
      id: 'solaris',
      name: '왕도 솔라리스',
      subtitle: '아테리아 왕국 수도 · 왕궁 & 중앙 대시장',
      icon: '👑',
      type: 'capital',
      faction: 'kingdom',
      x: 96,
      y: 110,
      radius: 18,
      gold: 8500,
      stocks: { wheat: 45, fish: 35, ore: 25, weapons: 30, herbs: 25, gems: 15 },
      prices: { wheat: 18, fish: 20, ore: 28, weapons: 65, herbs: 24, gems: 95 },
      description: '아테리아 국왕과 왕궁 근위대가 머무는 거대한 성채 도시입니다. 각지의 상인들이 농산물, 해산물, 광물을 실어 나르며 가장 활발한 거래가 이루어집니다.'
    },
    {
      id: 'goldenwheat',
      name: '황금밀 농촌마을',
      subtitle: '대륙 최대 곡창지대 · 풍차와 대농장',
      icon: '🌾',
      type: 'farming',
      faction: 'kingdom',
      x: 106,
      y: 168,
      radius: 14,
      gold: 2600,
      stocks: { wheat: 140, fish: 12, ore: 8, weapons: 8, herbs: 55, gems: 2 },
      prices: { wheat: 8, fish: 24, ore: 30, weapons: 60, herbs: 12, gems: 85 },
      description: '끝없이 펼쳐진 황금빛 밀밭과 약초밭을 일구는 평화로운 농촌입니다. 농부들이 매일 작물을 수확해 창고에 쌓으며, 상인들이 저렴한 식량을 매입해 갑니다.'
    },
    {
      id: 'bluewave',
      name: '푸른파도 항구',
      subtitle: '서해안 무역항 · 어부들의 부두와 어시장',
      icon: '⚓',
      type: 'port',
      faction: 'kingdom',
      x: 54,
      y: 152,
      radius: 13,
      gold: 3200,
      stocks: { wheat: 20, fish: 135, ore: 10, weapons: 12, herbs: 15, gems: 18 },
      prices: { wheat: 20, fish: 9, ore: 32, weapons: 58, herbs: 22, gems: 75 },
      description: '강줄기와 서해 바다가 만나는 아름다운 항구 마을입니다. 어부들이 부두와 고기잡이배에서 싱싱한 생선과 진주를 낚아 올립니다.'
    },
    {
      id: 'ironforge',
      name: '아이언포지 광산촌',
      subtitle: '북부 철벽산맥 · 광산 & 대장간 거리',
      icon: '⛏️',
      type: 'mining',
      faction: 'kingdom',
      x: 124,
      y: 56,
      radius: 12,
      gold: 3400,
      stocks: { wheat: 15, fish: 10, ore: 130, weapons: 55, herbs: 10, gems: 28 },
      prices: { wheat: 24, fish: 26, ore: 11, weapons: 36, herbs: 25, gems: 60 },
      description: '험준한 북부 산맥 자락에 자리 잡은 광산 요새입니다. 광부들이 철광석과 마정석을 캐내고 대장장이들이 모험가와 병사들을 위한 무기를 벼려냅니다.'
    },
    {
      id: 'silverleaf',
      name: '실버리프 호수마을',
      subtitle: '에메랄드 호숫가 · 민물 낚시터와 약초꾼 마을',
      icon: '🌲',
      type: 'lakeside',
      faction: 'kingdom',
      x: 74,
      y: 95,
      radius: 10,
      gold: 1900,
      stocks: { wheat: 30, fish: 75, ore: 10, weapons: 12, herbs: 80, gems: 6 },
      prices: { wheat: 16, fish: 11, ore: 28, weapons: 55, herbs: 10, gems: 80 },
      description: '맑은 실버리프 호수 남쪽에 위치한 마을로, 호수 낚시꾼들과 숲의 약초꾼, 레인저들이 모여 살아갑니다.'
    },
    {
      id: 'valor_fort',
      name: '발로르 변경 요새',
      subtitle: '동부 전선 방어기지 · 용병 길드 & 모험가 주둔지',
      icon: '🛡️',
      type: 'fortress',
      faction: 'kingdom',
      x: 154,
      y: 116,
      radius: 12,
      gold: 3800,
      stocks: { wheat: 35, fish: 25, ore: 30, weapons: 60, herbs: 35, gems: 20 },
      prices: { wheat: 22, fish: 22, ore: 20, weapons: 48, herbs: 28, gems: 70 },
      description: '동부 황무지와 그림자 숲의 몬스터 침공을 막아내는 최전선 요새입니다. 수많은 모험가와 용병, 왕국 수비대가 집결해 출정합니다.'
    },
    {
      id: 'goblin_camp',
      name: '그림자숲 고블린 군락',
      subtitle: '남동부 위험지대 · 약탈자 야영지',
      icon: '👺',
      type: 'monster_lair',
      faction: 'monster',
      danger: true,
      x: 176,
      y: 170,
      radius: 11,
      gold: 1200,
      stocks: {},
      prices: {},
      description: '울창한 그림자 숲 깊은 곳에 세워진 고블린과 늑대 무리의 본거지입니다. 가도를 지나는 상인 마차를 습격하거나 농촌 마을을 노립니다.'
    },
    {
      id: 'orc_stronghold',
      name: '붉은협곡 오크 요새',
      subtitle: '동부 황무지 · 오크 전사 군단 주둔지',
      icon: '👹',
      type: 'monster_lair',
      faction: 'monster',
      danger: true,
      x: 196,
      y: 104,
      radius: 12,
      gold: 2200,
      stocks: {},
      prices: {},
      description: '붉은 협곡에 세워진 호전적인 오크 전사들의 군락입니다. 발로르 변경 요새의 병사 및 용병들과 끊임없이 치열한 전투를 벌입니다.'
    },
    {
      id: 'dragon_ruins',
      name: '고대 용의 폐허',
      subtitle: '북동부 설산 · 언데드 군단과 고대 와이번 둥지',
      icon: '🐉',
      type: 'monster_lair',
      faction: 'monster',
      danger: true,
      x: 186,
      y: 48,
      radius: 12,
      gold: 5000,
      stocks: {},
      prices: {},
      description: '고대 왕국의 유적이 잠든 설산 지대입니다. 해골 기사단과 거대한 레드 와이번이 서식하며, 최고 실력의 모험가 파티가 보물을 찾아 도전합니다.'
    }
  ];

  // 거점 주변 지형 평탄화
  for (const s of settlements) {
    const r = s.radius + 3;
    for (let y = s.y - r; y <= s.y + r; y++) {
      for (let x = s.x - r; x <= s.x + r; x++) {
        if (!inBounds(x, y)) continue;
        const d = Math.hypot(x - s.x, y - s.y);
        if (d <= s.radius) {
          const cur = tiles[idx(x, y)];
          if (s.id === 'bluewave' && x < s.x - 4) continue; // 항구 서쪽 바다 유지
          if (cur === TILE.DEEP_WATER || cur === TILE.WATER) continue;
          if (s.type === 'capital') {
            tiles[idx(x, y)] = TILE.CASTLE_FLOOR;
          } else if (s.faction === 'monster') {
            if (cur === TILE.MOUNTAIN || cur === TILE.SNOW) tiles[idx(x, y)] = TILE.BADLANDS;
          } else {
            tiles[idx(x, y)] = TILE.GRASS;
          }
          deco[idx(x, y)] = 0;
        }
      }
    }
  }

  // 4. 거점 간 왕국 가도(도로망) 및 교량(다리) 건설
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

  function buildRoad(x0, y0, x1, y1, width = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // 약간의 자연스러운 곡선 가도
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

  // 5. 왕도 솔라리스 성벽, 성문, 왕궁, 시장, 건물 상세 배치
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
      // 외곽 사각 성벽 및 4대 성문 개방
      if (Math.max(dx, dy) === wallR) {
        const isGate = (dx <= 2 || dy <= 2);
        tiles[idx(x, y)] = isGate ? TILE.ROAD : TILE.WALL;
      }
    }
  }
  // 왕도 십자 중앙 대로
  for (let i = -wallR; i <= wallR; i++) {
    for (let w = -1; w <= 1; w++) {
      tiles[idx(cap.x + i, cap.y + w)] = TILE.ROAD;
      tiles[idx(cap.x + w, cap.y + i)] = TILE.ROAD;
    }
  }

  // 주요 건물 등록 헬퍼
  function addBuilding(b) {
    buildings.push(b);
  }

  // 왕도 솔라리스 건물들
  addBuilding({ id: 'palace', settlementId: 'solaris', name: '솔라리스 왕궁 (태양성)', type: 'palace', x: cap.x, y: cap.y - 7, w: 7, h: 5, color: '#d4af37', roofColor: '#1e3a8a', icon: '👑' });
  addBuilding({ id: 'cap_market_w', settlementId: 'solaris', name: '왕도 중앙 대시장 (서관)', type: 'market', x: cap.x - 7, y: cap.y + 3, w: 4, h: 3, color: '#f59e0b', roofColor: '#b45309', icon: '⚖️' });
  addBuilding({ id: 'cap_market_e', settlementId: 'solaris', name: '왕도 중앙 대시장 (동관)', type: 'market', x: cap.x + 7, y: cap.y + 3, w: 4, h: 3, color: '#f59e0b', roofColor: '#b45309', icon: '⚖️' });
  addBuilding({ id: 'cap_barracks', settlementId: 'solaris', name: '왕실 근위대 병영', type: 'barracks', x: cap.x + 8, y: cap.y - 6, w: 4, h: 4, color: '#60a5fa', roofColor: '#1d4ed8', icon: '🛡️' });
  addBuilding({ id: 'cap_guild', settlementId: 'solaris', name: '왕립 모험가 길드 본부', type: 'guild', x: cap.x - 8, y: cap.y - 6, w: 4, h: 4, color: '#a78bfa', roofColor: '#5b21b6', icon: '⚔️' });
  addBuilding({ id: 'cap_inn', settlementId: 'solaris', name: '황금사자 여관 & 주점', type: 'inn', x: cap.x - 7, y: cap.y + 8, w: 4, h: 3, color: '#fb923c', roofColor: '#9a3412', icon: '🍺' });
  addBuilding({ id: 'cap_house1', settlementId: 'solaris', name: '귀족 저택', type: 'house', x: cap.x + 7, y: cap.y + 8, w: 4, h: 3, color: '#94a3b8', roofColor: '#334155', icon: '🏛️' });

  // 6. 황금밀 농촌마을 경작지(Farmland Plots) & 풍차/창고 배치
  const farmVillage = settlementMap['goldenwheat'];
  const farmPlots = [];
  const plotOffsets = [
    { ox: -14, oy: -10, w: 7, h: 6, crop: '밀' },
    { ox: -14, oy: 2,  w: 7, h: 6, crop: '밀' },
    { ox: 7,   oy: -10, w: 8, h: 6, crop: '밀' },
    { ox: 7,   oy: 2,  w: 8, h: 6, crop: '약초' },
    { ox: -4,  oy: 9,  w: 9, h: 6, crop: '밀' },
    { ox: -15, oy: 10, w: 8, h: 5, crop: '호박' }
  ];

  for (const po of plotOffsets) {
    for (let py = 0; py < po.h; py++) {
      for (let px = 0; px < po.w; px++) {
        const tx = farmVillage.x + po.ox + px;
        const ty = farmVillage.y + po.oy + py;
        if (inBounds(tx, ty) && tiles[idx(tx, ty)] !== TILE.ROAD && tiles[idx(tx, ty)] !== TILE.WATER) {
          tiles[idx(tx, ty)] = TILE.FARMLAND;
          deco[idx(tx, ty)] = 0;
          farmPlots.push({
            x: tx,
            y: ty,
            cropType: po.crop,
            growth: rng.range(20, 95), // 0~100 성장도
            reservedBy: null
          });
        }
      }
    }
  }

  addBuilding({ id: 'gw_mill', settlementId: 'goldenwheat', name: '황금밀 대풍차 & 곡물창고', type: 'granary', x: farmVillage.x, y: farmVillage.y - 4, w: 4, h: 4, color: '#eab308', roofColor: '#854d0e', icon: '🌾' });
  addBuilding({ id: 'gw_market', settlementId: 'goldenwheat', name: '농산물 직거래 장터', type: 'market', x: farmVillage.x - 4, y: farmVillage.y + 3, w: 4, h: 3, color: '#f59e0b', roofColor: '#92400e', icon: '🛒' });
  addBuilding({ id: 'gw_house1', settlementId: 'goldenwheat', name: '농부의 오두막', type: 'house', x: farmVillage.x + 4, y: farmVillage.y - 3, w: 3, h: 3, color: '#d97706', roofColor: '#78350f', icon: '🏠' });
  addBuilding({ id: 'gw_house2', settlementId: 'goldenwheat', name: '농부의 오두막', type: 'house', x: farmVillage.x + 4, y: farmVillage.y + 3, w: 3, h: 3, color: '#d97706', roofColor: '#78350f', icon: '🏠' });

  // 7. 푸른파도 항구마을 & 실버리프 호수마을 낚시 부두(Docks) 및 낚시 포인트 생성
  const port = settlementMap['bluewave'];
  const fishingSpots = [];

  // 항구 서쪽 바다로 뻗은 부두 3개 생성
  const dockYs = [port.y - 5, port.y, port.y + 5];
  for (const dy of dockYs) {
    for (let dx = -12; dx <= -2; dx++) {
      const tx = port.x + dx;
      const ty = dy;
      if (inBounds(tx, ty)) {
        tiles[idx(tx, ty)] = TILE.DOCK;
        deco[idx(tx, ty)] = 0;
        if (dx <= -7) {
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
    // 바다 위 고기잡이배 포인트
    fishingSpots.push({
      x: port.x - 16,
      y: dy + 1,
      waterX: port.x - 18,
      waterY: dy + 1,
      settlementId: 'bluewave',
      isBoat: true
    });
  }

  addBuilding({ id: 'bw_market', settlementId: 'bluewave', name: '푸른파도 수산시장 & 교역소', type: 'market', x: port.x + 2, y: port.y - 2, w: 4, h: 4, color: '#38bdf8', roofColor: '#0369a1', icon: '🐟' });
  addBuilding({ id: 'bw_inn', settlementId: 'bluewave', name: '닻과 인어 선원 주점', type: 'inn', x: port.x + 4, y: port.y + 4, w: 4, h: 3, color: '#0284c7', roofColor: '#075985', icon: '⚓' });
  addBuilding({ id: 'bw_house', settlementId: 'bluewave', name: '어부 조합 회관', type: 'house', x: port.x + 3, y: port.y - 7, w: 3, h: 3, color: '#7dd3fc', roofColor: '#0c4a6e', icon: '🎣' });

  // 실버리프 호숫가 부두 및 낚시터
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
  addBuilding({ id: 'sl_herb', settlementId: 'silverleaf', name: '연금술 & 약초 공방', type: 'house', x: lakeTown.x - 5, y: lakeTown.y + 2, w: 3, h: 3, color: '#10b981', roofColor: '#047857', icon: '🌿' });

  // 8. 아이언포지 광산촌 광맥(Mine Nodes) 및 대장간 배치
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

  // 9. 발로르 변경 요새 건물
  const fort = settlementMap['valor_fort'];
  addBuilding({ id: 'vf_keep', settlementId: 'valor_fort', name: '발로르 변경 사령부', type: 'barracks', x: fort.x, y: fort.y - 3, w: 5, h: 4, color: '#60a5fa', roofColor: '#1e3a8a', icon: '🛡️' });
  addBuilding({ id: 'vf_merc', settlementId: 'valor_fort', name: '붉은매 용병단 & 모험가 캠프', type: 'guild', x: fort.x - 5, y: fort.y + 3, w: 4, h: 3, color: '#f43f5e', roofColor: '#881337', icon: '⚔️' });
  addBuilding({ id: 'vf_market', settlementId: 'valor_fort', name: '군수품 보급소', type: 'market', x: fort.x + 5, y: fort.y + 3, w: 4, h: 3, color: '#eab308', roofColor: '#713f12', icon: '📦' });

  // 10. 몬스터 군락지 스포너 건물/제단
  const gob = settlementMap['goblin_camp'];
  addBuilding({ id: 'gob_totem', settlementId: 'goblin_camp', name: '고블린 족장의 해골 천막', type: 'lair', x: gob.x, y: gob.y, w: 4, h: 4, color: '#dc2626', roofColor: '#450a0a', icon: '👺' });

  const orc = settlementMap['orc_stronghold'];
  addBuilding({ id: 'orc_altar', settlementId: 'orc_stronghold', name: '오크 대족장의 피의 요새', type: 'lair', x: orc.x, y: orc.y, w: 5, h: 4, color: '#b91c1c', roofColor: '#3f1d1d', icon: '👹' });

  const drag = settlementMap['dragon_ruins'];
  addBuilding({ id: 'drag_nest', settlementId: 'dragon_ruins', name: '고대 드래곤의 제단', type: 'lair', x: drag.x, y: drag.y, w: 6, h: 5, color: '#9333ea', roofColor: '#3b0764', icon: '🐉' });

  return {
    width: WORLD_SIZE,
    height: WORLD_SIZE,
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
    getTile(tx, ty) {
      if (tx < 0 || tx >= WORLD_SIZE || ty < 0 || ty >= WORLD_SIZE) return TILE.DEEP_WATER;
      return tiles[ty * WORLD_SIZE + tx];
    },
    isWalkable(tx, ty) {
      const t = this.getTile(tx, ty);
      return TILE_INFO[t] ? TILE_INFO[t].walkable : false;
    }
  };
}

window.WORLD_SIZE = WORLD_SIZE;
window.TILE_SIZE = TILE_SIZE;
window.TILE = TILE;
window.TILE_INFO = TILE_INFO;
window.generateWorld = generateWorld;
