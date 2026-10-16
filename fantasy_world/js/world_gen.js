// ============================================================================
// world_gen.js - 초대형 오픈월드 (480x320 타일)
// 동부 아테리아 제국 본토 + 중앙 대양 & 산호 군도 + 서부 엘븐하임 & 황금 사막 신대륙 + 극서부 천공 용의 고원
// ============================================================================

const WORLD_WIDTH = 480;  // 가로 480 타일 (15,360px 대형 오픈월드)
const WORLD_HEIGHT = 320; // 세로 320 타일 (10,240px)
const WORLD_SIZE = WORLD_WIDTH; // 하위 호환
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
  LAVA: 19,
  CORAL: 20,
  AUTUMN_WOOD: 21,
  SWAMP: 22
};

const TILE_INFO = {
  [TILE.DEEP_WATER]:   { name: '대해양 (심해)', color: '#091b2c', miniColor: '#091b2c', walkable: false, naval: true },
  [TILE.WATER]:        { name: '연안/강/호수', color: '#1d4ed8', miniColor: '#2563eb', walkable: false, naval: true },
  [TILE.SAND]:         { name: '황금 모래해변', color: '#d6be86', miniColor: '#d6be86', walkable: true, naval: false },
  [TILE.GRASS]:        { name: '초원', color: '#386934', miniColor: '#386934', walkable: true, naval: false },
  [TILE.MEADOW]:       { name: '비옥한 평야', color: '#477d40', miniColor: '#477d40', walkable: true, naval: false },
  [TILE.FOREST]:       { name: '울창한 참나무 숲', color: '#244b23', miniColor: '#20431f', walkable: true, naval: false },
  [TILE.DARK_FOREST]:  { name: '그림자 침엽수림', color: '#182922', miniColor: '#15241e', walkable: true, naval: false },
  [TILE.HILLS]:        { name: '구릉지', color: '#575446', miniColor: '#575446', walkable: true, naval: false },
  [TILE.MOUNTAIN]:     { name: '험준한 암벽 산맥', color: '#413f3d', miniColor: '#413f3d', walkable: false, naval: false },
  [TILE.SNOW]:         { name: '만년설 봉우리', color: '#cbd5e1', miniColor: '#e2e8f0', walkable: false, naval: false },
  [TILE.BADLANDS]:     { name: '붉은 황무지', color: '#663e2f', miniColor: '#663e2f', walkable: true, naval: false },
  [TILE.FARMLAND]:     { name: '비옥한 경작지', color: '#684f2b', miniColor: '#85662f', walkable: true, naval: false },
  [TILE.ROAD]:         { name: '왕국 포장 가도', color: '#978770', miniColor: '#b4a187', walkable: true, naval: false },
  [TILE.BRIDGE]:       { name: '견고한 교량', color: '#7c5332', miniColor: '#98653e', walkable: true, naval: true },
  [TILE.CASTLE_FLOOR]: { name: '성채 석재 광장', color: '#717882', miniColor: '#8c95a3', walkable: true, naval: false },
  [TILE.DOCK]:         { name: '항구 목조 부두', color: '#714b29', miniColor: '#855831', walkable: true, naval: true },
  [TILE.WALL]:         { name: '방어 성벽', color: '#414d5e', miniColor: '#cbd5e1', walkable: false, naval: false },
  [TILE.DESERT]:       { name: '황금빛 모래사막', color: '#d4964b', miniColor: '#d4964b', walkable: true, naval: false },
  [TILE.ELVEN_FOREST]: { name: '영원의 요정숲', color: '#276859', miniColor: '#2dd4bf', walkable: true, naval: false },
  [TILE.LAVA]:         { name: '펄펄 끓는 용암', color: '#dc2626', miniColor: '#ef4444', walkable: false, naval: false },
  [TILE.CORAL]:        { name: '산호초 환초', color: '#0ea5e9', miniColor: '#38bdf8', walkable: false, naval: true },
  [TILE.AUTUMN_WOOD]:  { name: '붉은 단풍나무 숲', color: '#7c2d12', miniColor: '#c2410c', walkable: true, naval: false },
  [TILE.SWAMP]:        { name: '안개 낀 늪지대', color: '#2e3a23', miniColor: '#3f4f30', walkable: true, naval: false }
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

// 본토 X 오프셋 (동부 대륙 위치)
const MAINLAND_OFFSET_X = 180;

function generateWorld() {
  const elevNoise = createNoise2D(10101);
  const moistNoise = createNoise2D(20202);
  const detailNoise = createNoise2D(30303);

  const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  // deco: 0:없음, 1:참나무, 2:침엽수, 3:들꽃, 4:바위, 5:야자수/선인장, 6:벚꽃/요정나무, 7:단풍나무, 8:빛나는수정
  const deco = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);

  const idx = (x, y) => y * WORLD_WIDTH + x;
  const inBounds = (x, y) => x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;

  // 1. 대륙 & 해양 윤곽 생성
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const nx = x / WORLD_WIDTH;
      const ny = y / WORLD_HEIGHT;
      const nVal = fbm(elevNoise, nx * 7.5, ny * 5.2, 4);
      const m = fbm(moistNoise, nx * 7.0, ny * 5.5, 3);
      const d = detailNoise(nx * 32, ny * 26);

      let t = TILE.DEEP_WATER;

      // [A] 동부 아테리아 대륙 (x: 190 ~ 475)
      if (x >= 180) {
        const mx = (x - MAINLAND_OFFSET_X) / (WORLD_WIDTH - MAINLAND_OFFSET_X);
        const my = y / WORLD_HEIGHT;
        const edgeDistX = Math.min(Math.max(0, (mx - 0.04) / 0.14), (1 - mx) / 0.05, 1);
        const edgeDistY = Math.min(my / 0.08, (1 - my) / 0.09, 1);
        const islandMask = Math.min(edgeDistX, edgeDistY);
        let e = nVal * 0.76 + islandMask * 0.38 - 0.12;

        // 서해안 푸른파도 항구 만(Bay)
        const distPortBay = Math.hypot(x - (MAINLAND_OFFSET_X + 35), y - 195);
        if (distPortBay < 42) {
          e -= (1 - distPortBay / 42) * 0.40;
        }
        // 북부 철벽산맥 융기
        const distNorthMtn = Math.hypot((x - (MAINLAND_OFFSET_X + 155)) * 0.75, (y - 45) * 1.3);
        if (distNorthMtn < 68) {
          e += (1 - distNorthMtn / 68) * 0.45;
        }
        // 중앙 평원 보정
        const distPlains = Math.hypot(x - (MAINLAND_OFFSET_X + 120), y - 165);
        if (distPlains < 70) {
          e = e * 0.42 + 0.30;
        }

        if (e < 0.20) t = TILE.DEEP_WATER;
        else if (e < 0.27) t = TILE.WATER;
        else if (e < 0.305) t = TILE.SAND;
        else if (e > 0.76) t = TILE.SNOW;
        else if (e > 0.65) t = TILE.MOUNTAIN;
        else if (e > 0.55) t = TILE.HILLS;
        else {
          // 동남부 몬스터/단풍/황무지
          if (x > MAINLAND_OFFSET_X + 210 && y > 180) {
            t = m < 0.45 ? TILE.BADLANDS : TILE.AUTUMN_WOOD;
          } else if (x > MAINLAND_OFFSET_X + 180 && y <= 180) {
            t = m > 0.52 ? TILE.DARK_FOREST : TILE.HILLS;
          } else {
            if (m > 0.65) t = TILE.FOREST;
            else if (m > 0.45) t = TILE.MEADOW;
            else t = TILE.GRASS;
          }
        }
      }

      // [B] 서부 신대륙 북쪽: 요정과 세계수의 섬 '엘븐하임' (x=65, y=75)
      const distElven = Math.hypot((x - 65) * 0.82, (y - 75) * 0.95);
      if (distElven < 54) {
        const eElv = (1 - distElven / 50) * 0.70 + nVal * 0.38;
        if (eElv > 0.35) {
          t = m > 0.38 ? TILE.ELVEN_FOREST : TILE.MEADOW;
          if (distElven < 12 && eElv > 0.65) t = TILE.MEADOW;
        } else if (eElv > 0.28) {
          t = TILE.SAND;
        } else if (eElv > 0.21) {
          t = TILE.WATER;
        }
      }

      // [C] 서부 신대륙 남쪽: 황금 사막 제국 '미라주 오아시스' (x=65, y=235)
      const distDesert = Math.hypot((x - 65) * 0.80, (y - 235) * 0.90);
      if (distDesert < 60) {
        const eDes = (1 - distDesert / 54) * 0.72 + nVal * 0.38;
        if (eDes > 0.70) {
          t = TILE.HILLS;
        } else if (eDes > 0.34) {
          t = TILE.DESERT;
          const dOasis = Math.hypot(x - 65, y - 235);
          if (dOasis < 7.5) t = TILE.WATER;
          else if (dOasis < 13.5) t = TILE.MEADOW;
        } else if (eDes > 0.28) {
          t = TILE.SAND;
        } else if (eDes > 0.21) {
          t = TILE.WATER;
        }
      }

      // [D] 극서부 천공 용의 둥지 고원 (x=35, y=135)
      const distSkyPeaks = Math.hypot((x - 35) * 0.90, (y - 135) * 1.1);
      if (distSkyPeaks < 28) {
        const eSky = (1 - distSkyPeaks / 26) * 0.85 + nVal * 0.35;
        if (eSky > 0.72) t = TILE.SNOW;
        else if (eSky > 0.58) t = TILE.MOUNTAIN;
        else if (eSky > 0.42) t = TILE.HILLS;
        else if (eSky > 0.30) t = TILE.SAND;
        else if (eSky > 0.22) t = TILE.WATER;
      }

      // [E] 중앙 대해양 섬들
      // 해골초도 해적 요새 (x=150, y=165)
      const distPirate = Math.hypot((x - 150) * 1.0, (y - 165) * 1.1);
      if (distPirate < 22) {
        const ePir = (1 - distPirate / 20) * 0.70 + nVal * 0.35;
        if (ePir > 0.44) t = TILE.BADLANDS;
        else if (ePir > 0.32) t = TILE.SAND;
        else if (ePir > 0.21) t = TILE.WATER;
      }

      // 흑요석 화산도 (x=160, y=55)
      const distVolcano = Math.hypot((x - 160) * 1.0, (y - 55) * 1.15);
      if (distVolcano < 22) {
        const eVol = (1 - distVolcano / 20) * 0.75 + nVal * 0.32;
        if (distVolcano < 5.0) t = TILE.LAVA;
        else if (eVol > 0.55) t = TILE.MOUNTAIN;
        else if (eVol > 0.36) t = TILE.BADLANDS;
        else if (eVol > 0.22) t = TILE.WATER;
      }

      // 세이렌 산호섬 (x=140, y=255)
      const distCoral = Math.hypot((x - 140) * 0.95, (y - 255) * 1.05);
      if (distCoral < 24) {
        const eCoral = (1 - distCoral / 22) * 0.65 + nVal * 0.35;
        if (eCoral > 0.48) t = TILE.MEADOW;
        else if (eCoral > 0.36) t = TILE.SAND;
        else if (eCoral > 0.24) t = TILE.CORAL;
        else if (eCoral > 0.18) t = TILE.WATER;
      }

      // 외로운 등대섬 (x=185, y=115)
      const distBeacon = Math.hypot((x - 185) * 1.0, (y - 115) * 1.1);
      if (distBeacon < 12) {
        const eBea = (1 - distBeacon / 11) * 0.70 + nVal * 0.35;
        if (eBea > 0.40) t = TILE.CASTLE_FLOOR;
        else if (eBea > 0.28) t = TILE.SAND;
        else if (eBea > 0.20) t = TILE.WATER;
      }

      tiles[idx(x, y)] = t;

      // 자연 장식물 배치
      if (t === TILE.FOREST && d > 0.36) deco[idx(x, y)] = 1; // 참나무
      else if (t === TILE.DARK_FOREST && d > 0.33) deco[idx(x, y)] = 2; // 침엽수
      else if (t === TILE.MEADOW && d > 0.68) deco[idx(x, y)] = 3; // 들꽃
      else if ((t === TILE.HILLS || t === TILE.BADLANDS) && d > 0.68) deco[idx(x, y)] = 4; // 바위
      else if ((t === TILE.DESERT || t === TILE.SAND) && d > 0.75) deco[idx(x, y)] = 5; // 사막 야자수/선인장
      else if (t === TILE.ELVEN_FOREST && d > 0.34) deco[idx(x, y)] = 6; // 요정 벚꽃나무
      else if (t === TILE.AUTUMN_WOOD && d > 0.35) deco[idx(x, y)] = 7; // 단풍나무
      else if (t === TILE.SNOW && d > 0.70) deco[idx(x, y)] = 8; // 빛나는 얼음 결정
    }
  }

  // 2. 본토 호수 & 강줄기 생성
  // (1) 실버리프 호수 (중심: x=MAINLAND_OFFSET_X + 85, y=110)
  const lakeCenter = { x: MAINLAND_OFFSET_X + 85, y: 110 };
  for (let y = lakeCenter.y - 20; y <= lakeCenter.y + 20; y++) {
    for (let x = lakeCenter.x - 26; x <= lakeCenter.x + 26; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot((x - lakeCenter.x) * 0.85, (y - lakeCenter.y) * 1.1);
      if (dist < 15.0) {
        tiles[idx(x, y)] = dist < 8.0 ? TILE.DEEP_WATER : TILE.WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 17.5 && tiles[idx(x, y)] !== TILE.WATER) {
        tiles[idx(x, y)] = TILE.SAND;
        deco[idx(x, y)] = 0;
      }
    }
  }

  // 강줄기 조각 헬퍼
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

  // 북부 산맥 -> 호수 -> 서해안 하구 강줄기
  carveRiver([
    { x: MAINLAND_OFFSET_X + 150, y: 50 },
    { x: MAINLAND_OFFSET_X + 115, y: 80 },
    { x: lakeCenter.x, y: lakeCenter.y },
    { x: MAINLAND_OFFSET_X + 80, y: 155 },
    { x: MAINLAND_OFFSET_X + 50, y: 195 }
  ], 2.4);

  // 남부 농업 평원 관개 수로 강줄기
  carveRiver([
    { x: MAINLAND_OFFSET_X + 180, y: 190 },
    { x: MAINLAND_OFFSET_X + 140, y: 220 },
    { x: MAINLAND_OFFSET_X + 100, y: 250 },
    { x: MAINLAND_OFFSET_X + 60, y: 275 }
  ], 2.2);

  // 3. 전체 20+ 거점 정의
  const settlements = [
    // [동부 본토]
    {
      id: 'solaris',
      name: '왕도 솔라리스',
      subtitle: '아테리아 왕국 수도 · 왕궁 & 중앙 대광장',
      icon: '👑',
      type: 'capital',
      faction: 'kingdom',
      x: MAINLAND_OFFSET_X + 120,
      y: 150,
      radius: 20,
      gold: 12000,
      stocks: { wheat: 60, fish: 50, ore: 40, weapons: 45, herbs: 40, gems: 30, spices: 25 },
      prices: { wheat: 18, fish: 20, ore: 28, weapons: 65, herbs: 24, gems: 95, spices: 110 },
      description: '아테리아 국왕과 성기사단이 머무는 대륙 최대의 성채 수도입니다.'
    },
    {
      id: 'goldenwheat',
      name: '황금밀 대농장',
      subtitle: '본토 최대 곡창지대 · 거대 풍차 & 대농경지',
      icon: '🌾',
      type: 'farming',
      faction: 'kingdom',
      x: MAINLAND_OFFSET_X + 135,
      y: 220,
      radius: 16,
      gold: 3800,
      stocks: { wheat: 200, fish: 20, ore: 10, weapons: 12, herbs: 80, gems: 5, spices: 4 },
      prices: { wheat: 7, fish: 24, ore: 32, weapons: 62, herbs: 12, gems: 85, spices: 95 },
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
      portWaterX: MAINLAND_OFFSET_X + 35,
      portWaterY: 195,
      x: MAINLAND_OFFSET_X + 58,
      y: 195,
      radius: 16,
      gold: 6800,
      stocks: { wheat: 40, fish: 180, ore: 20, weapons: 25, herbs: 25, gems: 35, spices: 30 },
      prices: { wheat: 20, fish: 8, ore: 32, weapons: 58, herbs: 22, gems: 75, spices: 85 },
      description: '본토와 바다 너머 신대륙(엘븐하임·미라주 사막·군도)을 잇는 관문 대항구입니다.'
    },
    {
      id: 'ironforge',
      name: '아이언포지 드워프 광산성채',
      subtitle: '북부 철벽산맥 · 대용광로 & 미스릴 대장간',
      icon: '⛏️',
      type: 'mining',
      faction: 'kingdom',
      x: MAINLAND_OFFSET_X + 155,
      y: 65,
      radius: 14,
      gold: 5200,
      stocks: { wheat: 20, fish: 15, ore: 190, weapons: 85, herbs: 12, gems: 45, spices: 5 },
      prices: { wheat: 25, fish: 26, ore: 10, weapons: 35, herbs: 26, gems: 58, spices: 105 },
      description: '험준한 북부 산맥 자락의 광산 요새로, 마정석과 철을 채굴하고 전설의 무기를 단조합니다.'
    },
    {
      id: 'silverleaf',
      name: '실버리프 호수마을',
      subtitle: '에메랄드 호숫가 · 민물 낚시터와 약초 공방',
      icon: '🌲',
      type: 'lakeside',
      faction: 'kingdom',
      x: MAINLAND_OFFSET_X + 85,
      y: 130,
      radius: 13,
      gold: 3200,
      stocks: { wheat: 35, fish: 110, ore: 12, weapons: 15, herbs: 120, gems: 12, spices: 8 },
      prices: { wheat: 16, fish: 10, ore: 28, weapons: 55, herbs: 9, gems: 80, spices: 90 },
      description: '맑은 실버리프 호수 남쪽에 위치한 마을로, 호수 어부들과 약초꾼들이 살아갑니다.'
    },
    {
      id: 'valor_fort',
      name: '발로르 최전방 요새',
      subtitle: '동부 전선 방어기지 · 성전사 기사단 주둔지',
      icon: '🛡️',
      type: 'fortress',
      faction: 'kingdom',
      x: MAINLAND_OFFSET_X + 200,
      y: 150,
      radius: 15,
      gold: 5600,
      stocks: { wheat: 45, fish: 30, ore: 40, weapons: 90, herbs: 40, gems: 25, spices: 10 },
      prices: { wheat: 22, fish: 22, ore: 20, weapons: 46, herbs: 28, gems: 70, spices: 95 },
      description: '동부 황무지와 그림자 숲의 몬스터 침공을 막아내는 최전선 성채입니다.'
    },
    {
      id: 'oakwood',
      name: '오크우드 벌목 마을',
      subtitle: '중남부 참나무 숲 · 목재 제재소 & 숲 사냥꾼 길드',
      icon: '🪓',
      type: 'forest_village',
      faction: 'kingdom',
      x: MAINLAND_OFFSET_X + 185,
      y: 220,
      radius: 13,
      gold: 3100,
      stocks: { wheat: 30, fish: 15, ore: 20, weapons: 22, herbs: 75, gems: 10, spices: 12 },
      prices: { wheat: 16, fish: 22, ore: 26, weapons: 52, herbs: 14, gems: 75, spices: 85 },
      description: '거대한 고목 참나무를 가공하고 숲 짐승을 추적하는 사냥꾼과 벌목꾼들의 터전입니다.'
    },
    {
      id: 'windmill_valley',
      name: '윈드밀 방앗간 계곡',
      subtitle: '서남부 강변 분지 · 수차 방앗간 & 과수원',
      icon: '💨',
      type: 'farming',
      faction: 'kingdom',
      x: MAINLAND_OFFSET_X + 95,
      y: 250,
      radius: 12,
      gold: 2700,
      stocks: { wheat: 140, fish: 30, ore: 8, weapons: 10, herbs: 60, gems: 6, spices: 15 },
      prices: { wheat: 9, fish: 18, ore: 30, weapons: 60, herbs: 14, gems: 80, spices: 80 },
      description: '시원한 강바람을 이용해 물레방아와 풍차로 밀가루를 빻고 사과 과수원을 가꿉니다.'
    },
    {
      id: 'st_mare',
      name: '세인트 마레 어촌 포구',
      subtitle: '남부 해안 곶 · 원양 참치 어장 & 진주 채취소',
      icon: '🎣',
      type: 'port',
      faction: 'kingdom',
      isPort: true,
      portWaterX: MAINLAND_OFFSET_X + 45,
      portWaterY: 280,
      x: MAINLAND_OFFSET_X + 65,
      y: 280,
      radius: 12,
      gold: 3500,
      stocks: { wheat: 25, fish: 160, ore: 10, weapons: 15, herbs: 18, gems: 45, spices: 20 },
      prices: { wheat: 22, fish: 7, ore: 34, weapons: 60, herbs: 24, gems: 65, spices: 85 },
      description: '따뜻한 남해 바다의 원양 어선들이 정박하는 평화로운 어촌입니다.'
    },
    {
      id: 'crystal_falls',
      name: '크리스탈폴 아케인 학탑',
      subtitle: '북서부 호수 폭포 상류 · 대마법사 의회',
      icon: '🔮',
      type: 'magic_spire',
      faction: 'kingdom',
      x: MAINLAND_OFFSET_X + 70,
      y: 70,
      radius: 12,
      gold: 5800,
      stocks: { wheat: 25, fish: 20, ore: 30, weapons: 50, herbs: 90, gems: 85, spices: 30 },
      prices: { wheat: 24, fish: 22, ore: 24, weapons: 45, herbs: 15, gems: 50, spices: 75 },
      description: '폭포수 위에 솟아오른 룬 수정 마법탑으로 비전 마법을 연구합니다.'
    },
    {
      id: 'valkyrie_gate',
      name: '발키리 협곡 관문',
      subtitle: '북동부 설산 협곡 요새 · 국경 수비대',
      icon: '🏰',
      type: 'fortress',
      faction: 'kingdom',
      x: MAINLAND_OFFSET_X + 225,
      y: 80,
      radius: 12,
      gold: 4400,
      stocks: { wheat: 30, fish: 15, ore: 45, weapons: 70, herbs: 20, gems: 20, spices: 5 },
      prices: { wheat: 24, fish: 25, ore: 18, weapons: 42, herbs: 30, gems: 70, spices: 100 },
      description: '북부 설산과 동부 황무지 사이의 험난한 협곡을 방어하는 철벽 관문입니다.'
    },

    // [서부 신대륙]
    {
      id: 'elvenheim',
      name: '신대륙 엘븐하임 성소',
      subtitle: '북서 요정 대륙 · 세계수 이그드라실 & 대성역',
      icon: '🌸',
      type: 'overseas_elven',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 105,
      portWaterY: 75,
      x: 65,
      y: 75,
      radius: 16,
      gold: 8900,
      stocks: { wheat: 40, fish: 35, ore: 20, weapons: 50, herbs: 240, gems: 80, spices: 60 },
      prices: { wheat: 22, fish: 20, ore: 36, weapons: 52, herbs: 6, gems: 42, spices: 65 },
      description: '대해양 건너 신비로운 엘프와 정령들의 대륙입니다. 세계수의 영약을 수출합니다.'
    },
    {
      id: 'fairy_glade',
      name: '달빛 요정 정원',
      subtitle: '엘븐하임 북부 깊은 숲 · 정령의 호수 & 유니콘 쉼터',
      icon: '🌙',
      type: 'overseas_elven',
      faction: 'kingdom',
      x: 45,
      y: 45,
      radius: 12,
      gold: 4200,
      stocks: { wheat: 20, fish: 25, ore: 10, weapons: 30, herbs: 180, gems: 90, spices: 40 },
      prices: { wheat: 25, fish: 22, ore: 40, weapons: 60, herbs: 5, gems: 38, spices: 70 },
      description: '달빛이 내려앉는 신성한 정원으로 마법 약초와 축복의 이슬이 샘솟습니다.'
    },
    {
      id: 'mirage_oasis',
      name: '황금사막 미라주 오아시스',
      subtitle: '남서 사막 제국 · 황금 술탄국 대교역항',
      icon: '🏜️',
      type: 'overseas_desert',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 110,
      portWaterY: 235,
      x: 65,
      y: 235,
      radius: 17,
      gold: 9800,
      stocks: { wheat: 25, fish: 20, ore: 40, weapons: 35, herbs: 30, gems: 150, spices: 260 },
      prices: { wheat: 30, fish: 28, ore: 24, weapons: 68, herbs: 28, gems: 35, spices: 12 },
      description: '사막 한가운데 피어난 거대 오아시스 교역 도시로 진귀한 향신료와 유물이 모입니다.'
    },
    {
      id: 'sphinx_pyramid',
      name: '스핑크스 고대 피라미드',
      subtitle: '사막 깊은 고대 유적 · 파라오의 보물창고',
      icon: '🏛️',
      type: 'overseas_desert',
      faction: 'kingdom',
      x: 40,
      y: 275,
      radius: 13,
      gold: 6500,
      stocks: { wheat: 15, fish: 10, ore: 30, weapons: 40, herbs: 15, gems: 180, spices: 110 },
      prices: { wheat: 35, fish: 35, ore: 26, weapons: 72, herbs: 35, gems: 30, spices: 20 },
      description: '천년 전 고대 왕조의 유물과 보물이 잠들어 있는 거대한 석조 피라미드입니다.'
    },
    {
      id: 'bedouin_camp',
      name: '베두인 전갈 유목민 캠프',
      subtitle: '사막 모래언덕 오아시스 · 대상단 천막 바자르',
      icon: '🎪',
      type: 'overseas_desert',
      faction: 'kingdom',
      x: 40,
      y: 195,
      radius: 12,
      gold: 4800,
      stocks: { wheat: 20, fish: 15, ore: 25, weapons: 35, herbs: 20, gems: 90, spices: 160 },
      prices: { wheat: 32, fish: 30, ore: 28, weapons: 65, herbs: 26, gems: 42, spices: 15 },
      description: '낙타를 몰고 사막을 횡단하는 수인족 유목민들의 활기찬 이동식 천막 시장입니다.'
    },

    // [극서부 천공 고원]
    {
      id: 'dragon_eyrie',
      name: '천공의 용의 둥지 고원',
      subtitle: '구름 위 천공 절벽 · 4대 고대 원소 드래곤의 성소',
      icon: '🐉',
      type: 'dragon_sanctuary',
      faction: 'neutral',
      x: 35,
      y: 135,
      radius: 15,
      gold: 15000,
      stocks: { wheat: 10, fish: 15, ore: 80, weapons: 60, herbs: 50, gems: 250, spices: 50 },
      prices: { wheat: 40, fish: 35, ore: 15, weapons: 80, herbs: 20, gems: 25, spices: 60 },
      description: '구름을 뚫고 솟은 천공의 고원으로 불·얼음·번개·숲의 드래곤들이 비상합니다.'
    },

    // [중앙 대양 및 군도]
    {
      id: 'pirate_cove',
      name: '해골초도 대해적 성채',
      subtitle: '대해양 중앙 암초섬 · 해적선단 연합 본거지',
      icon: '🏴‍☠️',
      type: 'monster_lair',
      faction: 'monster',
      isPort: true,
      portWaterX: 135,
      portWaterY: 165,
      x: 150,
      y: 165,
      radius: 13,
      gold: 8200,
      stocks: { wheat: 30, fish: 70, ore: 30, weapons: 80, herbs: 20, gems: 80, spices: 70 },
      prices: { wheat: 28, fish: 15, ore: 30, weapons: 45, herbs: 30, gems: 50, spices: 50 },
      description: '검은 깃발을 내건 해적들이 무역선을 습격하고 약탈품을 집결시키는 거점입니다.',
      danger: true
    },
    {
      id: 'volcano_isle',
      name: '흑요석 화산 군도',
      subtitle: '북부 화산섬 · 심해 크라켄 둥지 & 펄펄 끓는 용암',
      icon: '🌋',
      type: 'monster_lair',
      faction: 'monster',
      x: 160,
      y: 55,
      radius: 12,
      gold: 5500,
      stocks: { wheat: 5, fish: 30, ore: 90, weapons: 40, herbs: 5, gems: 110, spices: 30 },
      prices: { wheat: 45, fish: 20, ore: 12, weapons: 65, herbs: 45, gems: 40, spices: 70 },
      description: '붉은 용암이 바다로 흘러내리는 화산 군도로 크라켄과 화염 야수가 서식합니다.',
      danger: true
    },
    {
      id: 'siren_coral',
      name: '세이렌 산호섬',
      subtitle: '남부 대해양 에메랄드 환초 · 심해 진주 & 침몰선 유적',
      icon: '🧜‍♀️',
      type: 'coral_isle',
      faction: 'neutral',
      isPort: true,
      portWaterX: 155,
      portWaterY: 255,
      x: 140,
      y: 255,
      radius: 12,
      gold: 4800,
      stocks: { wheat: 15, fish: 130, ore: 15, weapons: 20, herbs: 35, gems: 140, spices: 50 },
      prices: { wheat: 28, fish: 9, ore: 35, weapons: 60, herbs: 20, gems: 45, spices: 60 },
      description: '환상적인 산호초로 둘러싸인 무인도로 심해 진주와 돌고래 떼가 노닙니다.'
    },
    {
      id: 'lone_beacon',
      name: '외로운 등대섬',
      subtitle: '대해양 횡단 관문 · 거대 회전 등대 & 보급소',
      icon: '🗼',
      type: 'beacon_isle',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 175,
      portWaterY: 115,
      x: 185,
      y: 115,
      radius: 9,
      gold: 3200,
      stocks: { wheat: 35, fish: 60, ore: 15, weapons: 20, herbs: 20, gems: 25, spices: 20 },
      prices: { wheat: 22, fish: 14, ore: 30, weapons: 55, herbs: 22, gems: 70, spices: 75 },
      description: '밤바다를 밝히는 거대한 등대가 서 있어 험난한 대양을 건너는 선박들의 길잡이가 됩니다.'
    },

    // [남동부 몬스터 위험지대]
    {
      id: 'orc_stronghold',
      name: '오크 혈투 대요새',
      subtitle: '동남부 황무지 · 붉은 오크 군단 본진',
      icon: '👹',
      type: 'monster_lair',
      faction: 'monster',
      x: MAINLAND_OFFSET_X + 240,
      y: 240,
      radius: 14,
      gold: 6800,
      stocks: { wheat: 10, fish: 10, ore: 70, weapons: 110, herbs: 10, gems: 40, spices: 5 },
      prices: { wheat: 30, fish: 30, ore: 14, weapons: 28, herbs: 35, gems: 55, spices: 90 },
      description: '강력한 쇠몽둥이와 전투 도끼로 무장한 오크 군단 요새입니다.',
      danger: true
    },
    {
      id: 'goblin_camp',
      name: '고블린 소굴 야영지',
      subtitle: '남동부 암석 구릉 · 도적단 군락',
      icon: '👺',
      type: 'monster_lair',
      faction: 'monster',
      x: MAINLAND_OFFSET_X + 215,
      y: 275,
      radius: 12,
      gold: 3600,
      stocks: { wheat: 15, fish: 12, ore: 35, weapons: 50, herbs: 25, gems: 55, spices: 10 },
      prices: { wheat: 26, fish: 26, ore: 20, weapons: 40, herbs: 25, gems: 45, spices: 70 },
      description: '반짝이는 보물을 탐하며 숲길을 지나가는 여행자를 노립니다.',
      danger: true
    },
    {
      id: 'obsidian_necropolis',
      name: '흑요석 강령술 묘지',
      subtitle: '동부 저주받은 고분군 · 언데드 리치 군주',
      icon: '💀',
      type: 'monster_lair',
      faction: 'monster',
      x: MAINLAND_OFFSET_X + 255,
      y: 180,
      radius: 13,
      gold: 7200,
      stocks: { wheat: 0, fish: 0, ore: 50, weapons: 60, herbs: 10, gems: 130, spices: 10 },
      prices: { wheat: 40, fish: 40, ore: 20, weapons: 50, herbs: 40, gems: 35, spices: 80 },
      description: '죽은 자들의 뼈와 망령 기사들이 배회하는 공포의 묘지입니다.',
      danger: true
    }
  ];

  const settlementMap = {};
  for (const s of settlements) settlementMap[s.id] = s;

  // 4. 가도 및 도로망 연결 (도로망 확장)
  const roadLinks = [
    // 본토 가도
    ['solaris', 'goldenwheat'],
    ['solaris', 'bluewave'],
    ['solaris', 'ironforge'],
    ['solaris', 'silverleaf'],
    ['solaris', 'valor_fort'],
    ['goldenwheat', 'bluewave'],
    ['goldenwheat', 'oakwood'],
    ['goldenwheat', 'windmill_valley'],
    ['windmill_valley', 'st_mare'],
    ['bluewave', 'silverleaf'],
    ['bluewave', 'st_mare'],
    ['silverleaf', 'crystal_falls'],
    ['ironforge', 'crystal_falls'],
    ['ironforge', 'valkyrie_gate'],
    ['valor_fort', 'valkyrie_gate'],
    ['valor_fort', 'oakwood'],
    // 몬스터 전선 연결
    ['valor_fort', 'obsidian_necropolis'],
    ['oakwood', 'orc_stronghold'],
    ['st_mare', 'goblin_camp'],
    // 서부 신대륙 내부 가도
    ['elvenheim', 'fairy_glade'],
    ['mirage_oasis', 'sphinx_pyramid'],
    ['mirage_oasis', 'bedouin_camp']
  ];

  function carveRoad(fromS, toS) {
    let curX = fromS.x;
    let curY = fromS.y;
    const destX = toS.x;
    const destY = toS.y;
    const maxSteps = Math.ceil(Math.hypot(destX - curX, destY - curY) * 2.5);
    let step = 0;

    while ((Math.abs(curX - destX) > 1 || Math.abs(curY - destY) > 1) && step++ < maxSteps) {
      const dx = destX - curX;
      const dy = destY - curY;
      if (Math.abs(dx) > Math.abs(dy)) curX += Math.sign(dx);
      else curY += Math.sign(dy);

      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const rx = curX + ox;
          const ry = curY + oy;
          if (!inBounds(rx, ry)) continue;
          const ct = tiles[idx(rx, ry)];
          if (ct === TILE.WATER || ct === TILE.DEEP_WATER) {
            tiles[idx(rx, ry)] = TILE.BRIDGE;
            deco[idx(rx, ry)] = 0;
          } else if (ct !== TILE.BRIDGE && ct !== TILE.CASTLE_FLOOR && ct !== TILE.DOCK && ct !== TILE.WALL) {
            tiles[idx(rx, ry)] = TILE.ROAD;
            deco[idx(rx, ry)] = 0;
          }
        }
      }
    }
  }

  for (const [aId, bId] of roadLinks) {
    if (settlementMap[aId] && settlementMap[bId]) {
      carveRoad(settlementMap[aId], settlementMap[bId]);
    }
  }

  // 5. 해상 무역 항로 정의 (점선 렌더링용)
  const seaRoutes = [
    { fromId: 'bluewave', toId: 'elvenheim', name: '북서 요정항로' },
    { fromId: 'bluewave', toId: 'mirage_oasis', name: '남서 황금향신료항로' },
    { fromId: 'bluewave', toId: 'lone_beacon', name: '대양 등대항로' },
    { fromId: 'lone_beacon', toId: 'elvenheim', name: '등대-엘븐하임 항로' },
    { fromId: 'st_mare', toId: 'siren_coral', name: '세이렌 환초항로' },
    { fromId: 'siren_coral', toId: 'mirage_oasis', name: '남부 사막횡단항로' },
    { fromId: 'bluewave', toId: 'pirate_cove', name: '해골초도 위험항로' },
    { fromId: 'lone_beacon', toId: 'volcano_isle', name: '북해 화산항로' }
  ];

  // 6. 건물 & 랜드마크 생성
  const buildings = [];
  function addBuilding(b) {
    buildings.push(b);
    for (let by = b.y - Math.floor(b.h / 2); by <= b.y + Math.floor(b.h / 2); by++) {
      for (let bx = b.x - Math.floor(b.w / 2); bx <= b.x + Math.floor(b.w / 2); bx++) {
        if (inBounds(bx, by)) {
          tiles[idx(bx, by)] = TILE.CASTLE_FLOOR;
          deco[idx(bx, by)] = 0;
        }
      }
    }
  }

  // 솔라리스 왕도 건물들
  const capital = settlementMap.solaris;
  addBuilding({ id: 'sol_palace', settlementId: 'solaris', name: '아테리아 왕궁', type: 'palace', x: capital.x, y: capital.y - 4, w: 7, h: 5, color: '#fef08a', roofColor: '#b45309', icon: '👑' });
  addBuilding({ id: 'sol_cathedral', settlementId: 'solaris', name: '빛의 대성당', type: 'temple', x: capital.x - 7, y: capital.y - 1, w: 5, h: 4, color: '#93c5fd', roofColor: '#1d4ed8', icon: '⛪' });
  addBuilding({ id: 'sol_market', settlementId: 'solaris', name: '왕도 중앙 대시장', type: 'market', x: capital.x + 6, y: capital.y + 1, w: 6, h: 4, color: '#fed7aa', roofColor: '#ea580c', icon: '⚖️' });
  addBuilding({ id: 'sol_barracks', settlementId: 'solaris', name: '왕립 근위대 병영', type: 'barracks', x: capital.x - 6, y: capital.y + 6, w: 5, h: 4, color: '#cbd5e1', roofColor: '#334155', icon: '🛡️' });
  addBuilding({ id: 'sol_tavern', settlementId: 'solaris', name: '황금 사자 주점 & 여관', type: 'tavern', x: capital.x + 5, y: capital.y + 7, w: 4, h: 3, color: '#fde68a', roofColor: '#b45309', icon: '🍺' });

  // 황금밀 대농장
  const farm = settlementMap.goldenwheat;
  addBuilding({ id: 'gw_mill', settlementId: 'goldenwheat', name: '황금 풍차 방앗간', type: 'windmill', x: farm.x - 4, y: farm.y - 3, w: 4, h: 4, color: '#fef08a', roofColor: '#b45309', icon: '💨' });
  addBuilding({ id: 'gw_granary', settlementId: 'goldenwheat', name: '곡물 저장소 & 농업 조합', type: 'market', x: farm.x + 4, y: farm.y + 2, w: 5, h: 3, color: '#fed7aa', roofColor: '#ea580c', icon: '🌾' });

  // 농작물 패치 생성
  const farmPlots = [];
  for (let dy = -10; dy <= 10; dy++) {
    for (let dx = -12; dx <= 12; dx++) {
      const fx = farm.x + dx;
      const fy = farm.y + dy;
      if (inBounds(fx, fy) && Math.hypot(dx, dy) < 11 && Math.abs(dx) > 2 && Math.abs(dy) > 2) {
        tiles[idx(fx, fy)] = TILE.FARMLAND;
        deco[idx(fx, fy)] = 0;
        farmPlots.push({ x: fx, y: fy, growth: 50 + Math.random() * 50, cropType: dx > 0 ? '밀' : '약초' });
      }
    }
  }

  // 윈드밀 방앗간 계곡 농경지
  const wValley = settlementMap.windmill_valley;
  addBuilding({ id: 'wv_mill', settlementId: 'windmill_valley', name: '윈드밀 수차 방앗간', type: 'windmill', x: wValley.x, y: wValley.y - 2, w: 4, h: 4, color: '#fef08a', roofColor: '#b45309', icon: '💨' });
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -7; dx <= 7; dx++) {
      const fx = wValley.x + dx;
      const fy = wValley.y + dy;
      if (inBounds(fx, fy) && Math.hypot(dx, dy) < 6.5 && (dx !== 0 || dy !== 0)) {
        tiles[idx(fx, fy)] = TILE.FARMLAND;
        deco[idx(fx, fy)] = 0;
        farmPlots.push({ x: fx, y: fy, growth: 40 + Math.random() * 60, cropType: '향신료' });
      }
    }
  }

  // 푸른파도 대항구
  const port = settlementMap.bluewave;
  addBuilding({ id: 'bw_shipyard', settlementId: 'bluewave', name: '왕립 조선소 & 등대', type: 'shipyard', x: port.x - 4, y: port.y - 3, w: 5, h: 4, color: '#93c5fd', roofColor: '#1d4ed8', icon: '⚓' });
  addBuilding({ id: 'bw_market', settlementId: 'bluewave', name: '해상무역 어시장', type: 'market', x: port.x + 3, y: port.y + 3, w: 5, h: 3, color: '#fed7aa', roofColor: '#ea580c', icon: '🐟' });
  addBuilding({ id: 'bw_navy', settlementId: 'bluewave', name: '왕립 해군 제독부', type: 'barracks', x: port.x + 3, y: port.y - 6, w: 4, h: 3, color: '#60a5fa', roofColor: '#1e3a8a', icon: '🚢' });

  // 부두 타일 & 낚시터
  const fishingSpots = [];
  for (let dy = -8; dy <= 8; dy += 2) {
    for (let dx = -14; dx <= -8; dx++) {
      const tx = port.x + dx;
      const ty = port.y + dy;
      if (inBounds(tx, ty)) {
        tiles[idx(tx, ty)] = TILE.DOCK;
        deco[idx(tx, ty)] = 0;
        if (dx === -14) {
          fishingSpots.push({ x: tx, y: ty, waterX: tx - 2, waterY: ty, settlementId: 'bluewave', isBoat: false });
        }
      }
    }
  }

  // 세인트 마레 어촌 부두 & 낚시터
  const stMare = settlementMap.st_mare;
  addBuilding({ id: 'sm_fishhouse', settlementId: 'st_mare', name: '세인트 마레 어선 조합', type: 'market', x: stMare.x, y: stMare.y - 2, w: 4, h: 3, color: '#38bdf8', roofColor: '#0369a1', icon: '🎣' });
  for (let dy = -4; dy <= 4; dy += 2) {
    for (let dx = -10; dx <= -6; dx++) {
      const tx = stMare.x + dx;
      const ty = stMare.y + dy;
      if (inBounds(tx, ty)) {
        tiles[idx(tx, ty)] = TILE.DOCK;
        deco[idx(tx, ty)] = 0;
        if (dx === -10) {
          fishingSpots.push({ x: tx, y: ty, waterX: tx - 2, waterY: ty, settlementId: 'st_mare', isBoat: true });
        }
      }
    }
  }

  // 엘븐하임 성소 건물들
  const elvenTown = settlementMap.elvenheim;
  addBuilding({ id: 'elv_tree', settlementId: 'elvenheim', name: '세계수 이그드라실 성소', type: 'palace', x: elvenTown.x, y: elvenTown.y - 3, w: 6, h: 5, color: '#2dd4bf', roofColor: '#0f766e', icon: '🌸' });
  addBuilding({ id: 'elv_spire', settlementId: 'elvenheim', name: '별빛 아카나 마법학탑', type: 'guild', x: elvenTown.x - 6, y: elvenTown.y + 2, w: 4, h: 4, color: '#c084fc', roofColor: '#6b21a8', icon: '🔮' });
  addBuilding({ id: 'elv_market', settlementId: 'elvenheim', name: '엘프 영약·보석 교역소', type: 'market', x: elvenTown.x + 6, y: elvenTown.y + 2, w: 4, h: 3, color: '#34d399', roofColor: '#065f46', icon: '💎' });

  // 달빛 요정 정원
  const fairyGlade = settlementMap.fairy_glade;
  addBuilding({ id: 'fairy_shrine', settlementId: 'fairy_glade', name: '달빛 요정의 제단', type: 'temple', x: fairyGlade.x, y: fairyGlade.y, w: 4, h: 4, color: '#c084fc', roofColor: '#7e22ce', icon: '🌙' });

  // 미라주 오아시스 건물들
  const desertTown = settlementMap.mirage_oasis;
  addBuilding({ id: 'mir_palace', settlementId: 'mirage_oasis', name: '황금 술탄의 신기루 궁전', type: 'palace', x: desertTown.x, y: desertTown.y - 5, w: 6, h: 5, color: '#facc15', roofColor: '#b45309', icon: '🕌' });
  addBuilding({ id: 'mir_bazaar', settlementId: 'mirage_oasis', name: '미라주 대바자르 (향신료·유물 시장)', type: 'market', x: desertTown.x + 6, y: desertTown.y + 2, w: 5, h: 4, color: '#f97316', roofColor: '#9a3412', icon: '🌶️' });

  // 스핑크스 피라미드 & 베두인 캠프
  const sphinx = settlementMap.sphinx_pyramid;
  addBuilding({ id: 'sph_pyramid', settlementId: 'sphinx_pyramid', name: '고대 태양왕의 대피라미드', type: 'temple', x: sphinx.x, y: sphinx.y, w: 7, h: 6, color: '#eab308', roofColor: '#713f12', icon: '🏛️' });
  const bedouin = settlementMap.bedouin_camp;
  addBuilding({ id: 'bed_bazaar', settlementId: 'bedouin_camp', name: '베두인 전갈 오아시스 천막', type: 'market', x: bedouin.x, y: bedouin.y, w: 4, h: 4, color: '#fb923c', roofColor: '#9a3412', icon: '🎪' });

  // 천공의 용의 둥지
  const dragonNest = settlementMap.dragon_eyrie;
  addBuilding({ id: 'drag_shrine', settlementId: 'dragon_eyrie', name: '천공의 고대 드래곤 제단', type: 'lair', x: dragonNest.x, y: dragonNest.y, w: 6, h: 5, color: '#a855f7', roofColor: '#4c1d95', icon: '🐉' });

  // 실버리프 호수 산장
  const lakeTown = settlementMap.silverleaf;
  addBuilding({ id: 'sl_lodge', settlementId: 'silverleaf', name: '실버리프 호수 산장 & 교역소', type: 'market', x: lakeTown.x, y: lakeTown.y, w: 4, h: 3, color: '#34d399', roofColor: '#065f46', icon: '🌲' });

  // 아이언포지 드워프 광산성채
  const mineTown = settlementMap.ironforge;
  addBuilding({ id: 'if_forge', settlementId: 'ironforge', name: '드워프 대용광로 & 대장간', type: 'forge', x: mineTown.x, y: mineTown.y - 2, w: 5, h: 4, color: '#f97316', roofColor: '#7c2d12', icon: '⚒️' });
  addBuilding({ id: 'if_market', settlementId: 'ironforge', name: '광물·무기 교역소', type: 'market', x: mineTown.x - 5, y: mineTown.y + 3, w: 4, h: 3, color: '#94a3b8', roofColor: '#334155', icon: '⛏️' });

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

  // 발로르 요새 & 오크우드 & 크리스탈폴 & 발키리 관문
  const fort = settlementMap.valor_fort;
  addBuilding({ id: 'vf_keep', settlementId: 'valor_fort', name: '발로르 변경 사령부', type: 'barracks', x: fort.x, y: fort.y - 3, w: 5, h: 4, color: '#60a5fa', roofColor: '#1e3a8a', icon: '🛡️' });
  addBuilding({ id: 'vf_merc', settlementId: 'valor_fort', name: '붉은매 용병단 & 모험가 길드', type: 'guild', x: fort.x - 5, y: fort.y + 3, w: 4, h: 3, color: '#f43f5e', roofColor: '#881337', icon: '⚔️' });

  const oakwood = settlementMap.oakwood;
  addBuilding({ id: 'ow_sawmill', settlementId: 'oakwood', name: '오크우드 왕립 제재소', type: 'market', x: oakwood.x, y: oakwood.y - 2, w: 4, h: 3, color: '#a16207', roofColor: '#451a03', icon: '🪓' });

  const cFalls = settlementMap.crystal_falls;
  addBuilding({ id: 'cf_spire', settlementId: 'crystal_falls', name: '크리스탈폴 비전 학탑', type: 'guild', x: cFalls.x, y: cFalls.y, w: 4, h: 5, color: '#c084fc', roofColor: '#581c87', icon: '🔮' });

  const vGate = settlementMap.valkyrie_gate;
  addBuilding({ id: 'vg_bastion', settlementId: 'valkyrie_gate', name: '발키리 협곡 철벽 관문', type: 'barracks', x: vGate.x, y: vGate.y, w: 5, h: 4, color: '#94a3b8', roofColor: '#1e293b', icon: '🏰' });

  // 해양 및 위험지대 건물들
  const pirate = settlementMap.pirate_cove;
  addBuilding({ id: 'pir_fort', settlementId: 'pirate_cove', name: '블랙비어드 대해적 성채', type: 'lair', x: pirate.x, y: pirate.y, w: 5, h: 4, color: '#334155', roofColor: '#0f172a', icon: '🏴‍☠️' });

  const volcano = settlementMap.volcano_isle;
  addBuilding({ id: 'vol_altar', settlementId: 'volcano_isle', name: '심해 크라켄 & 화산 제단', type: 'lair', x: volcano.x, y: volcano.y + 3, w: 5, h: 4, color: '#dc2626', roofColor: '#450a0a', icon: '🌋' });

  const beacon = settlementMap.lone_beacon;
  addBuilding({ id: 'lb_tower', settlementId: 'lone_beacon', name: '외로운 회전 등대', type: 'shipyard', x: beacon.x, y: beacon.y, w: 4, h: 5, color: '#fef08a', roofColor: '#1e3a8a', icon: '🗼' });

  const siren = settlementMap.siren_coral;
  addBuilding({ id: 'sr_temple', settlementId: 'siren_coral', name: '세이렌 진주 산호 신전', type: 'temple', x: siren.x, y: siren.y, w: 4, h: 4, color: '#38bdf8', roofColor: '#0369a1', icon: '🧜‍♀️' });

  const orc = settlementMap.orc_stronghold;
  addBuilding({ id: 'orc_keep', settlementId: 'orc_stronghold', name: '오크 대족장의 피의 요새', type: 'lair', x: orc.x, y: orc.y, w: 5, h: 4, color: '#b91c1c', roofColor: '#3f1d1d', icon: '👹' });

  const gob = settlementMap.goblin_camp;
  addBuilding({ id: 'gob_camp', settlementId: 'goblin_camp', name: '고블린 도적 야영지', type: 'lair', x: gob.x, y: gob.y, w: 4, h: 3, color: '#dc2626', roofColor: '#450a0a', icon: '👺' });

  const necro = settlementMap.obsidian_necropolis;
  addBuilding({ id: 'nec_tomb', settlementId: 'obsidian_necropolis', name: '강령술 리치 군주의 영묘', type: 'lair', x: necro.x, y: necro.y, w: 5, h: 4, color: '#475569', roofColor: '#0f172a', icon: '💀' });

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
