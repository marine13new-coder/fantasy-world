// ============================================================================
// world_gen.js - 5대 대륙 초대형 오픈월드 (640x400 타일, 20,480px x 12,800px)
// [1] 중앙 아테리아 제국 본토 (솔라리스·푸른파도항·황금밀밭·아이언포지·발로르요새)
// [2] 서부 실바니아 요정림 & 미라주 사막 제국 & 천공 용의 고원 (엘븐하임·오아시스·피라미드)
// [3] 북부 노스펠름 혹한 영구동토 대륙 (서리거인 성채·세인트마레 포구·발키리 관문·오크 요새)
// [4] 남부 드라코니아 화염·용족 대륙 (흑요석 화산·용골 묘지·마그마 지하용광로·세이렌 산호섬)
// [5] 동부 신비 & 네크로폴리스 대륙 (흑요석 강령술 묘지·속삭이는 숲·수정동굴·용의 유적·난파선 해구)
// [해양] 4대 좁은 해협 (황금해협·서리해협·용족해협·비전해협) 및 광활한 4대 외해 대양
// ============================================================================

const WORLD_WIDTH = 640;  // 가로 640 타일
const WORLD_HEIGHT = 400; // 세로 400 타일
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
  SWAMP: 22,
  TUNDRA: 23,
  OBSIDIAN: 24,
  CRYSTAL_CAVE: 25,
  OASIS_WATER: 26
};

const TILE_INFO = {
  [TILE.DEEP_WATER]:   { name: '대해양 (심해)', color: '#091b2c', miniColor: '#091b2c', walkable: false, naval: true },
  [TILE.WATER]:        { name: '연안/해협/호수', color: '#1d4ed8', miniColor: '#2563eb', walkable: false, naval: true },
  [TILE.SAND]:         { name: '황금 모래해변', color: '#d6be86', miniColor: '#d6be86', walkable: true, naval: false },
  [TILE.GRASS]:        { name: '초원', color: '#386934', miniColor: '#386934', walkable: true, naval: false },
  [TILE.MEADOW]:       { name: '비옥한 평야', color: '#477d40', miniColor: '#477d40', walkable: true, naval: false },
  [TILE.FOREST]:       { name: '울창한 참나무 숲', color: '#244b23', miniColor: '#20431f', walkable: true, naval: false },
  [TILE.DARK_FOREST]:  { name: '그림자 침엽수림', color: '#182922', miniColor: '#15241e', walkable: true, naval: false },
  [TILE.HILLS]:        { name: '구릉지', color: '#575446', miniColor: '#575446', walkable: true, naval: false },
  [TILE.MOUNTAIN]:     { name: '험준한 암벽 산맥', color: '#413f3d', miniColor: '#413f3d', walkable: false, naval: false },
  [TILE.SNOW]:         { name: '만년설 빙하 봉우리', color: '#cbd5e1', miniColor: '#e2e8f0', walkable: false, naval: false },
  [TILE.BADLANDS]:     { name: '붉은 황무지', color: '#663e2f', miniColor: '#663e2f', walkable: true, naval: false },
  [TILE.FARMLAND]:     { name: '비옥한 경작지', color: '#684f2b', miniColor: '#85662f', walkable: true, naval: false },
  [TILE.ROAD]:         { name: '대륙 포장 가도', color: '#978770', miniColor: '#b4a187', walkable: true, naval: false },
  [TILE.BRIDGE]:       { name: '견고한 교량', color: '#7c5332', miniColor: '#98653e', walkable: true, naval: true },
  [TILE.CASTLE_FLOOR]: { name: '성채 석재 광장', color: '#717882', miniColor: '#8c95a3', walkable: true, naval: false },
  [TILE.DOCK]:         { name: '항구 목조 부두', color: '#714b29', miniColor: '#855831', walkable: true, naval: true },
  [TILE.WALL]:         { name: '방어 성벽', color: '#414d5e', miniColor: '#cbd5e1', walkable: false, naval: false },
  [TILE.DESERT]:       { name: '황금빛 모래사막', color: '#d4964b', miniColor: '#d4964b', walkable: true, naval: false },
  [TILE.ELVEN_FOREST]: { name: '영원의 요정숲', color: '#276859', miniColor: '#2dd4bf', walkable: true, naval: false },
  [TILE.LAVA]:         { name: '펄펄 끓는 용암', color: '#dc2626', miniColor: '#ef4444', walkable: false, naval: false },
  [TILE.CORAL]:        { name: '산호초 환초', color: '#0ea5e9', miniColor: '#38bdf8', walkable: false, naval: true },
  [TILE.AUTUMN_WOOD]:  { name: '붉은 단풍나무 숲', color: '#7c2d12', miniColor: '#c2410c', walkable: true, naval: false },
  [TILE.SWAMP]:        { name: '안개 낀 늪지대', color: '#2e3a23', miniColor: '#3f4f30', walkable: true, naval: false },
  [TILE.TUNDRA]:       { name: '영구동토 툰드라', color: '#607274', miniColor: '#94a3b8', walkable: true, naval: false },
  [TILE.OBSIDIAN]:     { name: '흑요석 화산암대', color: '#1c1917', miniColor: '#292524', walkable: true, naval: false },
  [TILE.CRYSTAL_CAVE]: { name: '비전 수정 광맥', color: '#581c87', miniColor: '#a855f7', walkable: true, naval: false },
  [TILE.OASIS_WATER]:  { name: '오아시스 에메랄드 담수', color: '#0d9488', miniColor: '#14b8a6', walkable: false, naval: true }
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

function generateWorld() {
  const elevNoise = createNoise2D(10101);
  const moistNoise = createNoise2D(20202);
  const detailNoise = createNoise2D(30303);

  const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  // deco: 0:없음, 1:참나무, 2:침엽수, 3:들꽃, 4:바위, 5:야자수/선인장, 6:요정나무, 7:단풍나무, 8:빛나는수정
  const deco = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);

  const idx = (x, y) => y * WORLD_WIDTH + x;
  const inBounds = (x, y) => x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;

  // 1. 5대 대륙 및 4대 해협 & 광활한 외해 대양 생성 (640x400 초대형 맵)
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const nx = x / WORLD_WIDTH;
      const ny = y / WORLD_HEIGHT;
      const nVal = fbm(elevNoise, nx * 7.5, ny * 5.2, 4);
      const m = fbm(moistNoise, nx * 7.0, ny * 5.5, 3);
      const d = detailNoise(nx * 32, ny * 26);

      // 5대 대륙 타원 거리 함수 (유사한 대륙 크기 & 황금 밸런스 배치)
      const dCentral = Math.hypot((x - 320) / 88, (y - 200) / 68);
      const dWest = Math.hypot((x - 110) / 85, (y - 200) / 145);
      const dNorth = Math.hypot((x - 320) / 152, (y - 58) / 40);
      const dSouth = Math.hypot((x - 320) / 152, (y - 342) / 40);
      const dEast = Math.hypot((x - 530) / 85, (y - 200) / 145);

      // 해협 중간 징검다리 섬 & 환초
      const dBeacon = Math.hypot(x - 216, y - 180);
      const dPirate = Math.hypot(x - 210, y - 232);
      const dSiren = Math.hypot(x - 185, y - 320);
      const dShipwreck = Math.hypot(x - 455, y - 280);

      let maxE = 0;
      let region = 'central';

      // [1] 중앙 대륙 (아테리아 제국)
      if (dCentral < 1.0) {
        let e = (1 - dCentral) * 0.78 + nVal * 0.35;
        // 솔라리스 왕도 주변 비옥한 평야 분지 보정
        const dSolaris = Math.hypot(x - 320, y - 195);
        if (dSolaris < 45) e = 0.42 + (nVal - 0.5) * 0.15;
        if (e > maxE) { maxE = e; region = 'central'; }
      }
      // [2] 서부 대륙 (실바니아 요정림 & 미라주 사막 제국)
      if (dWest < 1.0) {
        const e = (1 - dWest) * 0.78 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'west'; }
      }
      // [3] 북부 대륙 (노스펠름 혹한 영구동토)
      if (dNorth < 1.0) {
        const e = (1 - dNorth) * 0.78 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'north'; }
      }
      // [4] 남부 대륙 (드라코니아 화산 & 용족 성역)
      if (dSouth < 1.0) {
        const e = (1 - dSouth) * 0.78 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'south'; }
      }
      // [5] 동부 대륙 (신비 & 네크로폴리스 대륙)
      if (dEast < 1.0) {
        const e = (1 - dEast) * 0.78 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'east'; }
      }

      // [해협 징검다리 섬]
      if (dBeacon < 14) {
        const e = (1 - dBeacon / 14) * 0.70 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'beacon'; }
      }
      if (dPirate < 16) {
        const e = (1 - dPirate / 16) * 0.70 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'pirate'; }
      }
      if (dSiren < 18) {
        const e = (1 - dSiren / 18) * 0.68 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'siren'; }
      }
      if (dShipwreck < 15) {
        const e = (1 - dShipwreck / 15) * 0.65 + nVal * 0.35;
        if (e > maxE) { maxE = e; region = 'shipwreck'; }
      }

      // 수심 및 타일 결정
      let t = TILE.DEEP_WATER;

      if (maxE < 0.22) {
        t = TILE.DEEP_WATER;
      } else if (maxE < 0.28) {
        t = (region === 'siren' || region === 'shipwreck') ? TILE.CORAL : TILE.WATER;
      } else if (maxE < 0.31) {
        t = TILE.SAND;
      } else {
        // 대륙별 독창적 기후 및 지형
        if (region === 'north') {
          // 북부 혹한 노스펠름
          if (maxE > 0.68) t = TILE.SNOW;
          else if (maxE > 0.54) t = TILE.MOUNTAIN;
          else if (maxE > 0.44) t = TILE.HILLS;
          else {
            if (m > 0.60) t = TILE.DARK_FOREST;
            else if (m > 0.35) t = TILE.TUNDRA;
            else t = TILE.SNOW;
          }
        } else if (region === 'south') {
          // 남부 화염 드라코니아
          if (maxE > 0.65) t = TILE.LAVA;
          else if (maxE > 0.54) t = TILE.OBSIDIAN;
          else if (maxE > 0.44) t = TILE.MOUNTAIN;
          else if (maxE > 0.36) t = TILE.BADLANDS;
          else t = m > 0.50 ? TILE.AUTUMN_WOOD : TILE.BADLANDS;
        } else if (region === 'west') {
          // 서부 실바니아(북) & 미라주 사막(남) & 천공 고원(서)
          if (y < 180) {
            if (x < 55 && maxE > 0.58) t = TILE.SNOW;
            else if (x < 70 && maxE > 0.48) t = TILE.MOUNTAIN;
            else if (maxE > 0.40) t = TILE.ELVEN_FOREST;
            else t = m > 0.42 ? TILE.ELVEN_FOREST : TILE.MEADOW;
          } else if (y > 220) {
            if (maxE > 0.60) t = TILE.HILLS;
            else t = TILE.DESERT;
          } else {
            t = TILE.BADLANDS;
          }
        } else if (region === 'east') {
          // 동부 신비 & 흑요석 네크로폴리스 & 비전 수정
          if (maxE > 0.65) t = TILE.MOUNTAIN;
          else if (maxE > 0.52) t = TILE.HILLS;
          else if (Math.hypot(x - 555, y - 195) < 18) t = TILE.CRYSTAL_CAVE;
          else if (Math.hypot(x - 555, y - 105) < 22) t = (m > 0.4 ? TILE.OBSIDIAN : TILE.DARK_FOREST);
          else if (y < 165) t = m > 0.5 ? TILE.DARK_FOREST : TILE.SWAMP;
          else t = m > 0.45 ? TILE.AUTUMN_WOOD : TILE.FOREST;
        } else if (region === 'beacon') {
          t = TILE.CASTLE_FLOOR;
        } else if (region === 'pirate') {
          t = TILE.BADLANDS;
        } else {
          // 중앙 아테리아 제국 본토
          if (y < 165 && maxE > 0.52) t = TILE.MOUNTAIN; // 북부 철벽산맥
          else if (y < 172 && maxE > 0.45) t = TILE.HILLS;
          else if (maxE > 0.66) t = TILE.MOUNTAIN;
          else if (maxE > 0.54) t = TILE.HILLS;
          else if (y > 230 && maxE < 0.48) t = TILE.FARMLAND; // 남부 비옥한 곡창지대
          else if (m > 0.58) t = TILE.FOREST;
          else if (m > 0.38) t = TILE.MEADOW;
          else t = TILE.GRASS;
        }
      }

      tiles[idx(x, y)] = t;

      // 자연 장식물 정밀 배치 (1:참나무, 2:침엽수, 3:야생화, 4:바위, 5:야자/선인장, 6:요정수, 7:단풍, 8:수정, 9:그루터기, 10:통나무, 11:울타리, 12:모닥불, 13:룬유적, 14:수련, 15:버섯)
      if (t === TILE.FOREST) {
        if (d > 0.40) deco[idx(x, y)] = 1; // 대형 참나무
        else if (d > 0.36) deco[idx(x, y)] = 9; // 이끼 낀 그루터기
        else if (d > 0.33) deco[idx(x, y)] = 15; // 야생 버섯 군락
        else if (d > 0.30) deco[idx(x, y)] = 10; // 쓰러진 통나무
      } else if (t === TILE.DARK_FOREST) {
        if (d > 0.36) deco[idx(x, y)] = 2; // 침엽수림
        else if (d > 0.32) deco[idx(x, y)] = 10; // 고목 통나무
      } else if (t === TILE.MEADOW || t === TILE.GRASS) {
        if (d > 0.72) deco[idx(x, y)] = 3; // 형형색색 야생화 군락
        else if (d > 0.67) deco[idx(x, y)] = 1; // 단독 풍성한 참나무
        else if (d > 0.64) deco[idx(x, y)] = 4; // 자연 입체 바위
        else if (d > 0.61) deco[idx(x, y)] = 9; // 나이테 그루터기
        else if (d > 0.58) deco[idx(x, y)] = 15; // 들판 버섯
      } else if (t === TILE.FARMLAND) {
        if (d > 0.70) deco[idx(x, y)] = 11; // 목조 울타리
      } else if (t === TILE.HILLS || t === TILE.BADLANDS || t === TILE.TUNDRA || t === TILE.OBSIDIAN) {
        if (d > 0.60) deco[idx(x, y)] = 4; // 거대 화강암 바위
        else if (d > 0.56) deco[idx(x, y)] = 13; // 고대 룬 유적 기둥
      } else if (t === TILE.DESERT || t === TILE.SAND) {
        if (d > 0.74) deco[idx(x, y)] = 5; // 오아시스 야자수 & 선인장
      } else if (t === TILE.ELVEN_FOREST) {
        if (d > 0.38) deco[idx(x, y)] = 6; // 요정 벚꽃나무
        else if (d > 0.33) deco[idx(x, y)] = 13; // 발광 엘프 룬 성소
      } else if (t === TILE.AUTUMN_WOOD) {
        if (d > 0.38) deco[idx(x, y)] = 7; // 붉은 단풍나무
        else if (d > 0.33) deco[idx(x, y)] = 10; // 단풍 낙엽 통나무
      } else if (t === TILE.SNOW || t === TILE.CRYSTAL_CAVE) {
        if (d > 0.68) deco[idx(x, y)] = 8; // 비전 마력 수정 첨탑
      }
    }
  }

  // 2. 호수 및 강줄기
  // (1) 실버리프 호수 (중앙 대륙 중심: 275, 178 주변)
  const lakeCenter = { x: 295, y: 172 };
  for (let y = lakeCenter.y - 10; y <= lakeCenter.y + 10; y++) {
    for (let x = lakeCenter.x - 15; x <= lakeCenter.x + 15; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot((x - lakeCenter.x) * 0.9, (y - lakeCenter.y) * 1.1);
      if (dist < 9.0) {
        tiles[idx(x, y)] = TILE.WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 11.5 && tiles[idx(x, y)] !== TILE.WATER) {
        tiles[idx(x, y)] = TILE.SAND;
        deco[idx(x, y)] = 0;
      }
    }
  }

  // (2) 사막 오아시스 호수 (서부 대륙 중심: 96, 290 주변)
  const oasisCenter = { x: 96, y: 290 };
  for (let y = oasisCenter.y - 8; y <= oasisCenter.y + 8; y++) {
    for (let x = oasisCenter.x - 10; x <= oasisCenter.x + 10; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot(x - oasisCenter.x, y - oasisCenter.y);
      if (dist < 5.0) {
        tiles[idx(x, y)] = TILE.OASIS_WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 8.0) {
        tiles[idx(x, y)] = TILE.MEADOW;
      }
    }
  }

  // 강줄기 조각 헬퍼
  function carveRiver(points, width = 2.0) {
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const steps = Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) * 2);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cx = p0.x + (p1.x - p0.x) * t;
        const cy = p0.y + (p1.y - p0.y) * t;
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

  // 중앙 대륙 산맥 -> 호수 -> 황금해협 서해안 하구 강줄기
  carveRiver([
    { x: 325, y: 155 },
    { x: 310, y: 165 },
    { x: lakeCenter.x, y: lakeCenter.y },
    { x: 275, y: 188 },
    { x: 245, y: 205 }
  ], 2.2);

  // 3. 5대 대륙 33개 거점 정의
  const settlements = [
    // ------------------------------------------------------------------------
    // [1] 중앙 제국 대륙 (아테리아 제국 본토)
    // ------------------------------------------------------------------------
    {
      id: 'solaris',
      name: '왕도 솔라리스',
      subtitle: '아테리아 제국 수도 · 황제궁 & 중앙 대광장',
      icon: '👑',
      type: 'capital',
      faction: 'kingdom',
      x: 320,
      y: 195,
      radius: 24,
      gold: 14000,
      stocks: { wheat: 70, fish: 50, ore: 45, weapons: 50, herbs: 45, gems: 35, spices: 30 },
      prices: { wheat: 18, fish: 20, ore: 28, weapons: 65, herbs: 24, gems: 95, spices: 110 },
      description: '5대 대륙의 중심인 아테리아 제국의 수도로 황실 근위대와 성기사단이 주둔합니다.'
    },
    {
      id: 'bluewave',
      name: '푸른파도 대항구',
      subtitle: '황금해협 서해안 관문 · 제국 해군 사령부 & 원양 어시장',
      icon: '⚓',
      type: 'port',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 235,
      portWaterY: 205,
      x: 255,
      y: 205,
      radius: 18,
      gold: 7800,
      stocks: { wheat: 50, fish: 190, ore: 25, weapons: 30, herbs: 30, gems: 40, spices: 35 },
      prices: { wheat: 20, fish: 8, ore: 32, weapons: 58, herbs: 22, gems: 75, spices: 85 },
      description: '황금해협을 가로질러 4대 대륙(실바니아·노스펠름·드라코니아·네크로폴리스)으로 출항하는 대항구입니다.'
    },
    {
      id: 'ironforge',
      name: '아이언포지 드워프 광산성채',
      subtitle: '중앙 북부 철벽산맥 · 대용광로 & 미스릴 대장간',
      icon: '⛏️',
      type: 'mining',
      faction: 'kingdom',
      x: 325,
      y: 155,
      radius: 16,
      gold: 5800,
      stocks: { wheat: 25, fish: 15, ore: 210, weapons: 95, herbs: 15, gems: 50, spices: 8 },
      prices: { wheat: 25, fish: 26, ore: 10, weapons: 35, herbs: 26, gems: 58, spices: 105 },
      description: '험준한 북부 산맥 자락의 광산 요새로 드워프 장인들이 전설의 무기를 단조합니다.'
    },
    {
      id: 'goldenwheat',
      name: '황금밀 대농장',
      subtitle: '중앙 남부 대곡창지대 · 거대 풍차 & 대농경지',
      icon: '🌾',
      type: 'farming',
      faction: 'kingdom',
      x: 320,
      y: 245,
      radius: 18,
      gold: 4200,
      stocks: { wheat: 240, fish: 20, ore: 12, weapons: 15, herbs: 85, gems: 6, spices: 5 },
      prices: { wheat: 7, fish: 24, ore: 32, weapons: 62, herbs: 12, gems: 85, spices: 95 },
      description: '끝없이 펼쳐진 황금빛 밀밭과 약초밭을 일구는 제국의 생명줄입니다.'
    },
    {
      id: 'valor_fort',
      name: '발로르 최전방 요새',
      subtitle: '중앙 동부 관문 방어기지 · 성전사 기사단 주둔지',
      icon: '🛡️',
      type: 'fortress',
      faction: 'kingdom',
      x: 380,
      y: 200,
      radius: 16,
      gold: 6200,
      stocks: { wheat: 50, fish: 30, ore: 45, weapons: 95, herbs: 40, gems: 25, spices: 12 },
      prices: { wheat: 22, fish: 22, ore: 20, weapons: 46, herbs: 28, gems: 70, spices: 95 },
      description: '동부 신비 대륙과 흑요석 네크로폴리스의 위협을 감시하는 국경 방벽입니다.'
    },
    {
      id: 'silverleaf',
      name: '실버리프 호수마을',
      subtitle: '중앙 에메랄드 호숫가 · 민물 낚시터와 약초 공방',
      icon: '🌲',
      type: 'lakeside',
      faction: 'kingdom',
      x: 275,
      y: 178,
      radius: 15,
      gold: 3600,
      stocks: { wheat: 40, fish: 130, ore: 15, weapons: 18, herbs: 130, gems: 15, spices: 10 },
      prices: { wheat: 16, fish: 10, ore: 28, weapons: 55, herbs: 9, gems: 80, spices: 90 },
      description: '맑은 실버리프 호숫가에 위치한 호수 어부들과 약초꾼들의 평화로운 마을입니다.'
    },
    {
      id: 'crystal_falls',
      name: '크리스탈폴 아케인 학탑',
      subtitle: '중앙 북서부 호수 폭포 상류 · 대마법사 의회',
      icon: '🔮',
      type: 'magic_spire',
      faction: 'kingdom',
      x: 285,
      y: 150,
      radius: 14,
      gold: 6200,
      stocks: { wheat: 30, fish: 20, ore: 35, weapons: 55, herbs: 95, gems: 90, spices: 35 },
      prices: { wheat: 24, fish: 22, ore: 24, weapons: 45, herbs: 15, gems: 50, spices: 75 },
      description: '룬 수정 마법탑으로 에테르 에너지를 연구하는 마법사들의 본거지입니다.'
    },
    {
      id: 'oakwood',
      name: '오크우드 벌목 마을',
      subtitle: '중앙 동남부 참나무 숲 · 목재 제재소 & 숲 사냥꾼 길드',
      icon: '🪓',
      type: 'forest_village',
      faction: 'kingdom',
      x: 360,
      y: 230,
      radius: 15,
      gold: 3400,
      stocks: { wheat: 35, fish: 15, ore: 22, weapons: 25, herbs: 80, gems: 12, spices: 15 },
      prices: { wheat: 16, fish: 22, ore: 26, weapons: 52, herbs: 14, gems: 75, spices: 85 },
      description: '거대한 고목 참나무를 가공하고 숲 짐승을 추적하는 사냥꾼들의 터전입니다.'
    },
    {
      id: 'windmill_valley',
      name: '윈드밀 방앗간 계곡',
      subtitle: '중앙 서남부 강변 분지 · 수차 방앗간 & 과수원',
      icon: '💨',
      type: 'farming',
      faction: 'kingdom',
      x: 285,
      y: 238,
      radius: 14,
      gold: 3100,
      stocks: { wheat: 160, fish: 35, ore: 10, weapons: 12, herbs: 65, gems: 8, spices: 18 },
      prices: { wheat: 9, fish: 18, ore: 30, weapons: 60, herbs: 14, gems: 80, spices: 80 },
      description: '시원한 강바람을 이용해 수차와 풍차로 곡물을 빻고 과수를 재배합니다.'
    },

    // ------------------------------------------------------------------------
    // [2] 서부 신대륙 (실바니아 요정림 & 미라주 사막 제국 & 천공 용의 고원)
    // ------------------------------------------------------------------------
    {
      id: 'elvenheim',
      name: '신대륙 엘븐하임 성소',
      subtitle: '서부 요정 영지 · 세계수 이그드라실 & 대성역',
      icon: '🌸',
      type: 'overseas_elven',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 136,
      portWaterY: 100,
      x: 100,
      y: 100,
      radius: 18,
      gold: 9500,
      stocks: { wheat: 45, fish: 40, ore: 22, weapons: 55, herbs: 260, gems: 90, spices: 65 },
      prices: { wheat: 22, fish: 20, ore: 36, weapons: 52, herbs: 6, gems: 42, spices: 65 },
      description: '황금해협 건너 서부 신대륙의 요정과 정령들의 성역입니다. 세계수의 영약을 수출합니다.'
    },
    {
      id: 'fairy_glade',
      name: '달빛 요정 정원',
      subtitle: '엘븐하임 북부 깊은 숲 · 정령의 호수 & 유니콘 쉼터',
      icon: '🌙',
      type: 'overseas_elven',
      faction: 'kingdom',
      x: 75,
      y: 80,
      radius: 14,
      gold: 4600,
      stocks: { wheat: 22, fish: 25, ore: 12, weapons: 32, herbs: 190, gems: 95, spices: 45 },
      prices: { wheat: 25, fish: 22, ore: 40, weapons: 60, herbs: 5, gems: 38, spices: 70 },
      description: '달빛이 내려앉는 신성한 정원으로 마법 약초와 축복의 이슬이 샘솟습니다.'
    },
    {
      id: 'celestial_haven',
      name: '천공의 룬 비행섬',
      subtitle: '서부 상공 부유석 군도 · 고대 천공 수호자 성역',
      icon: '☁️',
      type: 'dragon_sanctuary',
      faction: 'dragon',
      x: 55,
      y: 125,
      radius: 14,
      gold: 14500,
      stocks: { wheat: 15, fish: 20, ore: 65, weapons: 75, herbs: 95, gems: 340, spices: 75 },
      prices: { wheat: 42, fish: 35, ore: 18, weapons: 70, herbs: 18, gems: 24, spices: 50 },
      description: '대기권 구름 위에 둥둥 떠 있는 마력 부유섬으로 천공의 비룡을 만날 수 있습니다.'
    },
    {
      id: 'dragon_eyrie',
      name: '천공의 용의 둥지 고원',
      subtitle: '구름 위 천공 절벽 · 4대 고대 원소 드래곤의 성소',
      icon: '🐉',
      type: 'dragon_sanctuary',
      faction: 'neutral',
      x: 50,
      y: 180,
      radius: 16,
      gold: 16000,
      stocks: { wheat: 10, fish: 15, ore: 85, weapons: 65, herbs: 55, gems: 270, spices: 55 },
      prices: { wheat: 40, fish: 35, ore: 15, weapons: 80, herbs: 20, gems: 25, spices: 60 },
      description: '구름을 뚫고 솟은 천공의 고원으로 불·얼음·번개·숲의 드래곤들이 비상합니다.'
    },
    {
      id: 'mirage_oasis',
      name: '황금사막 미라주 오아시스',
      subtitle: '서남 사막 제국 · 황금 술탄국 대교역항',
      icon: '🏜️',
      type: 'overseas_desert',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 140,
      portWaterY: 290,
      x: 96,
      y: 290,
      radius: 18,
      gold: 10500,
      stocks: { wheat: 30, fish: 25, ore: 45, weapons: 40, herbs: 35, gems: 160, spices: 280 },
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
      x: 78,
      y: 310,
      radius: 15,
      gold: 7000,
      stocks: { wheat: 15, fish: 10, ore: 35, weapons: 45, herbs: 18, gems: 195, spices: 120 },
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
      x: 64,
      y: 255,
      radius: 14,
      gold: 5200,
      stocks: { wheat: 22, fish: 16, ore: 28, weapons: 38, herbs: 22, gems: 95, spices: 175 },
      prices: { wheat: 32, fish: 30, ore: 28, weapons: 65, herbs: 26, gems: 42, spices: 15 },
      description: '낙타를 몰고 사막을 횡단하는 수인족 유목민들의 활기찬 이동식 천막 시장입니다.'
    },
    {
      id: 'goblin_camp',
      name: '고블린 소굴 야영지',
      subtitle: '서부 대륙 중앙 구릉 · 도적단 군락',
      icon: '👺',
      type: 'monster_lair',
      faction: 'monster',
      x: 135,
      y: 200,
      radius: 14,
      gold: 3800,
      stocks: { wheat: 15, fish: 12, ore: 38, weapons: 55, herbs: 25, gems: 60, spices: 15 },
      prices: { wheat: 26, fish: 26, ore: 20, weapons: 40, herbs: 25, gems: 45, spices: 70 },
      description: '반짝이는 보물을 탐하며 사막과 숲길을 지나는 상단을 노리는 고블린 소굴입니다.',
      danger: true
    },

    // ------------------------------------------------------------------------
    // [3] 북부 혹한 대륙 (노스펠름 만년설 영구동토)
    // ------------------------------------------------------------------------
    {
      id: 'frost_citadel',
      name: '서리 거인의 얼음 성채',
      subtitle: '극북 빙하 영구동토 · 빙룡과 서리 거인족 본거지',
      icon: '❄️',
      type: 'fortress',
      faction: 'monster',
      x: 320,
      y: 40,
      radius: 15,
      gold: 9000,
      stocks: { wheat: 5, fish: 45, ore: 85, weapons: 100, herbs: 28, gems: 130, spices: 12 },
      prices: { wheat: 45, fish: 20, ore: 15, weapons: 45, herbs: 30, gems: 45, spices: 85 },
      description: '혹한의 칼바람이 몰아치는 빙하 성채로 서리 거인과 얼음 드래곤이 지키고 있습니다.',
      danger: true
    },
    {
      id: 'st_mare',
      name: '세인트 마레 어촌 포구',
      subtitle: '북방 빙해 포구 · 원양 참치 어장 & 진주 채취소',
      icon: '🎣',
      type: 'port',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 220,
      portWaterY: 82,
      x: 220,
      y: 65,
      radius: 14,
      gold: 3800,
      stocks: { wheat: 28, fish: 175, ore: 12, weapons: 18, herbs: 20, gems: 50, spices: 22 },
      prices: { wheat: 22, fish: 7, ore: 34, weapons: 60, herbs: 24, gems: 65, spices: 85 },
      description: '혹한의 빙해 바다를 항해하는 원양 어선들이 정박하는 북방 어촌입니다.'
    },
    {
      id: 'valkyrie_gate',
      name: '발키리 협곡 관문',
      subtitle: '북부 설산 협곡 요새 · 노스펠름 국경 수비대',
      icon: '🏰',
      type: 'fortress',
      faction: 'kingdom',
      x: 275,
      y: 62,
      radius: 14,
      gold: 4800,
      stocks: { wheat: 32, fish: 18, ore: 50, weapons: 75, herbs: 22, gems: 24, spices: 6 },
      prices: { wheat: 24, fish: 25, ore: 18, weapons: 42, herbs: 30, gems: 70, spices: 100 },
      description: '북부 설산과 서리 거인의 남하를 방어하는 철벽 협곡 관문입니다.'
    },
    {
      id: 'orc_stronghold',
      name: '오크 혈투 대요새',
      subtitle: '북동부 붉은 암벽 · 붉은 오크 군단 본진',
      icon: '👹',
      type: 'monster_lair',
      faction: 'monster',
      x: 420,
      y: 56,
      radius: 15,
      gold: 7200,
      stocks: { wheat: 12, fish: 12, ore: 75, weapons: 115, herbs: 12, gems: 45, spices: 6 },
      prices: { wheat: 30, fish: 30, ore: 14, weapons: 28, herbs: 35, gems: 55, spices: 90 },
      description: '강력한 쇠몽둥이와 전투 도끼로 무장한 오크 군단의 철벽 요새입니다.',
      danger: true
    },

    // ------------------------------------------------------------------------
    // [4] 남부 화염 대륙 (드라코니아 화산 & 용족 성역)
    // ------------------------------------------------------------------------
    {
      id: 'volcano_isle',
      name: '흑요석 화산 군도',
      subtitle: '남부 화산 정상 · 심해 크라켄 둥지 & 화염 드래곤 분화구',
      icon: '🌋',
      type: 'monster_lair',
      faction: 'monster',
      x: 235,
      y: 350,
      radius: 14,
      gold: 6000,
      stocks: { wheat: 6, fish: 32, ore: 95, weapons: 45, herbs: 6, gems: 120, spices: 35 },
      prices: { wheat: 45, fish: 20, ore: 12, weapons: 65, herbs: 45, gems: 40, spices: 70 },
      description: '붉은 용암이 바다로 흘러내리는 화산 지대로 고대 화염룡과 용암 정령이 서식합니다.',
      danger: true
    },
    {
      id: 'dragon_graveyard',
      name: '용들의 안식처 묘지',
      subtitle: '남부 화염 고원 · 거대 용골 암석과 불꽃 정령',
      icon: '🦴',
      type: 'monster_lair',
      faction: 'monster',
      x: 320,
      y: 355,
      radius: 15,
      gold: 8200,
      stocks: { wheat: 6, fish: 12, ore: 130, weapons: 85, herbs: 18, gems: 170, spices: 45 },
      prices: { wheat: 40, fish: 35, ore: 12, weapons: 50, herbs: 35, gems: 40, spices: 75 },
      description: '수천 년 동안 쓰러진 고대 드래곤들의 뼈가 산을 이루며 강력한 마력이 감돕니다.',
      danger: true
    },
    {
      id: 'magma_underforge',
      name: '마그마 심연 지하용광로',
      subtitle: '남부 화산 지하 분화구 · 심연 드워프 대장장이 은신처',
      icon: '🔥',
      type: 'mining',
      faction: 'dwarf',
      x: 405,
      y: 345,
      radius: 14,
      gold: 9200,
      stocks: { wheat: 16, fish: 12, ore: 250, weapons: 150, herbs: 12, gems: 95, spices: 22 },
      prices: { wheat: 35, fish: 30, ore: 8, weapons: 30, herbs: 35, gems: 55, spices: 80 },
      description: '지하 마그마의 열기로 신화급 룬 무기를 제련하는 심연 드워프 대장장이들의 비밀 용광로입니다.'
    },
    {
      id: 'siren_coral',
      name: '세이렌 산호섬',
      subtitle: '남서 대양 에메랄드 환초 · 심해 진주 & 침몰선 유적',
      icon: '🧜‍♀️',
      type: 'coral_isle',
      faction: 'neutral',
      isPort: true,
      portWaterX: 185,
      portWaterY: 308,
      x: 185,
      y: 320,
      radius: 14,
      gold: 5200,
      stocks: { wheat: 18, fish: 140, ore: 18, weapons: 22, herbs: 38, gems: 150, spices: 55 },
      prices: { wheat: 28, fish: 9, ore: 35, weapons: 60, herbs: 20, gems: 45, spices: 60 },
      description: '환상적인 산호초로 둘러싸인 무인도로 심해 진주와 돌고래 떼가 노닙니다.'
    },

    // ------------------------------------------------------------------------
    // [5] 동부 신비 대륙 (네크로폴리스 & 수정 신비 대륙)
    // ------------------------------------------------------------------------
    {
      id: 'obsidian_necropolis',
      name: '흑요석 강령술 묘지',
      subtitle: '동부 저주받은 고분군 · 언데드 리치 군주 본거지',
      icon: '💀',
      type: 'monster_lair',
      faction: 'monster',
      x: 555,
      y: 105,
      radius: 15,
      gold: 7600,
      stocks: { wheat: 0, fish: 0, ore: 55, weapons: 65, herbs: 12, gems: 140, spices: 12 },
      prices: { wheat: 40, fish: 40, ore: 20, weapons: 50, herbs: 40, gems: 35, spices: 80 },
      description: '죽은 자들의 뼈와 망령 기사들이 배회하는 공포의 흑요석 묘지입니다.',
      danger: true
    },
    {
      id: 'whispering_woods',
      name: '속삭이는 마법 숲',
      subtitle: '동부 신비 대륙 침엽수림 · 고대 드루이드 성소',
      icon: '🌲',
      type: 'forest_village',
      faction: 'kingdom',
      x: 500,
      y: 125,
      radius: 15,
      gold: 4800,
      stocks: { wheat: 30, fish: 20, ore: 25, weapons: 30, herbs: 140, gems: 80, spices: 30 },
      prices: { wheat: 20, fish: 22, ore: 28, weapons: 55, herbs: 10, gems: 60, spices: 75 },
      description: '바람이 불면 나무들이 속삭이며 고대 마법의 지혜를 전해주는 신비로운 숲입니다.'
    },
    {
      id: 'crystal_caverns',
      name: '수정 동굴 성소',
      subtitle: '동부 대륙 중앙 자수정 동굴 · 비전 수정 채굴소',
      icon: '💎',
      type: 'magic_spire',
      faction: 'kingdom',
      x: 555,
      y: 195,
      radius: 16,
      gold: 8400,
      stocks: { wheat: 20, fish: 15, ore: 90, weapons: 50, herbs: 50, gems: 260, spices: 40 },
      prices: { wheat: 28, fish: 26, ore: 18, weapons: 50, herbs: 22, gems: 30, spices: 80 },
      description: '거대한 보랏빛 비전 수정이 자라나는 신비 동굴로 강력한 마법 도구를 제작합니다.'
    },
    {
      id: 'dragon_ruins',
      name: '용의 계곡 고대 신전',
      subtitle: '동부 남단 단풍 고원 · 고대 황금 드래곤 제단',
      icon: '🏛️',
      type: 'dragon_sanctuary',
      faction: 'monster',
      x: 560,
      y: 275,
      radius: 16,
      gold: 9800,
      stocks: { wheat: 15, fish: 15, ore: 80, weapons: 70, herbs: 30, gems: 210, spices: 50 },
      prices: { wheat: 35, fish: 30, ore: 16, weapons: 60, herbs: 30, gems: 32, spices: 70 },
      description: '고대 황금룡을 숭배하던 거대 신전 유적으로 고대 마법 유물이 잠들어 있습니다.',
      danger: true
    },
    {
      id: 'sunken_shipwreck',
      name: '난파선 해구',
      subtitle: '남동 대해양 암초해역 · 전설의 보물선 침몰지',
      icon: '⛵',
      type: 'coral_isle',
      faction: 'neutral',
      isPort: true,
      portWaterX: 450,
      portWaterY: 268,
      x: 455,
      y: 280,
      radius: 14,
      gold: 8800,
      stocks: { wheat: 10, fish: 180, ore: 35, weapons: 50, herbs: 20, gems: 220, spices: 60 },
      prices: { wheat: 35, fish: 6, ore: 28, weapons: 52, herbs: 28, gems: 32, spices: 65 },
      description: '과거 거대 상선들이 암초에 걸려 침몰한 해역으로 잠수부들이 보물을 인양합니다.'
    },

    // ------------------------------------------------------------------------
    // [6] 해협 및 바다의 관문/성역
    // ------------------------------------------------------------------------
    {
      id: 'lone_beacon',
      name: '외로운 등대섬',
      subtitle: '황금해협 북단 관문 · 거대 회전 등대 & 해상 보급소',
      icon: '🗼',
      type: 'beacon_isle',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 216,
      portWaterY: 168,
      x: 216,
      y: 180,
      radius: 12,
      gold: 3600,
      stocks: { wheat: 40, fish: 70, ore: 18, weapons: 24, herbs: 24, gems: 30, spices: 25 },
      prices: { wheat: 22, fish: 14, ore: 30, weapons: 55, herbs: 22, gems: 70, spices: 75 },
      description: '밤바다를 밝히는 거대한 등대가 서 있어 험난한 해협을 건너는 선박들의 길잡이가 됩니다.'
    },
    {
      id: 'pirate_cove',
      name: '해골초도 대해적 성채',
      subtitle: '황금해협 남단 암초섬 · 해적선단 연합 본거지',
      icon: '🏴‍☠️',
      type: 'monster_lair',
      faction: 'monster',
      isPort: true,
      portWaterX: 200,
      portWaterY: 232,
      x: 210,
      y: 232,
      radius: 14,
      gold: 8800,
      stocks: { wheat: 35, fish: 80, ore: 35, weapons: 85, herbs: 25, gems: 90, spices: 75 },
      prices: { wheat: 28, fish: 15, ore: 30, weapons: 45, herbs: 30, gems: 50, spices: 50 },
      description: '검은 깃발을 내건 해적들이 무역선을 습격하고 약탈품을 집결시키는 거점입니다.',
      danger: true
    },
    {
      id: 'atlantis_ruins',
      name: '아틀란티스 해저 침몰신전',
      subtitle: '용족해협 심해 고대 문명 · 인어 왕국 성역 & 삼지창 제단',
      icon: '🔱',
      type: 'coral_isle',
      faction: 'merfolk',
      isPort: true,
      portWaterX: 320,
      portWaterY: 275,
      x: 320,
      y: 285,
      radius: 15,
      gold: 11000,
      stocks: { wheat: 10, fish: 260, ore: 35, weapons: 45, herbs: 45, gems: 320, spices: 90 },
      prices: { wheat: 35, fish: 6, ore: 30, weapons: 55, herbs: 20, gems: 30, spices: 60 },
      description: '중앙 대륙과 화염 대륙 사이 해협 심해에 잠긴 고대 해양 제국의 신전입니다.'
    }
  ];

  const settlementMap = {};
  for (const s of settlements) settlementMap[s.id] = s;

  // 4. 가도 및 도로망 연결 (각 대륙 내부 완결형 도로망)
  const roadLinks = [
    // [중앙 대륙 내부 도로]
    ['solaris', 'goldenwheat'],
    ['solaris', 'bluewave'],
    ['solaris', 'ironforge'],
    ['solaris', 'silverleaf'],
    ['solaris', 'valor_fort'],
    ['goldenwheat', 'oakwood'],
    ['goldenwheat', 'windmill_valley'],
    ['bluewave', 'silverleaf'],
    ['silverleaf', 'crystal_falls'],
    ['ironforge', 'crystal_falls'],
    ['valor_fort', 'oakwood'],

    // [서부 대륙 내부 도로]
    ['elvenheim', 'fairy_glade'],
    ['elvenheim', 'celestial_haven'],
    ['celestial_haven', 'dragon_eyrie'],
    ['dragon_eyrie', 'goblin_camp'],
    ['goblin_camp', 'bedouin_camp'],
    ['bedouin_camp', 'mirage_oasis'],
    ['mirage_oasis', 'sphinx_pyramid'],

    // [북부 노스펠름 대륙 도로]
    ['st_mare', 'valkyrie_gate'],
    ['valkyrie_gate', 'frost_citadel'],
    ['frost_citadel', 'orc_stronghold'],

    // [남부 드라코니아 대륙 도로]
    ['volcano_isle', 'dragon_graveyard'],
    ['dragon_graveyard', 'magma_underforge'],

    // [동부 신비 대륙 도로]
    ['whispering_woods', 'obsidian_necropolis'],
    ['whispering_woods', 'crystal_caverns'],
    ['crystal_caverns', 'dragon_ruins']
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

  // 5. 4대 해협 및 대양을 가로지르는 해상 무역 항로 (점선 렌더링용)
  const seaRoutes = [
    { fromId: 'bluewave', toId: 'lone_beacon', name: '황금해협 북부 항로' },
    { fromId: 'lone_beacon', toId: 'elvenheim', name: '등대-엘븐하임 항로' },
    { fromId: 'bluewave', toId: 'pirate_cove', name: '해골초도 위험항로' },
    { fromId: 'pirate_cove', toId: 'mirage_oasis', name: '미라주 오아시스 횡단항로' },
    { fromId: 'bluewave', toId: 'st_mare', name: '북방 빙해항로' },
    { fromId: 'st_mare', toId: 'lone_beacon', name: '노스펠름 해협항로' },
    { fromId: 'bluewave', toId: 'atlantis_ruins', name: '아틀란티스 심해항로' },
    { fromId: 'atlantis_ruins', toId: 'volcano_isle', name: '화산군도 흑요석항로' },
    { fromId: 'atlantis_ruins', toId: 'siren_coral', name: '세이렌 산호환초항로' },
    { fromId: 'siren_coral', toId: 'mirage_oasis', name: '남서 대양쾌속항로' },
    { fromId: 'atlantis_ruins', toId: 'sunken_shipwreck', name: '난파선 해구항로' },
    { fromId: 'sunken_shipwreck', toId: 'dragon_ruins', name: '용의 계곡 유적항로' }
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

  // [중앙 대륙 건물들]
  const capital = settlementMap.solaris;
  addBuilding({ id: 'sol_palace', settlementId: 'solaris', name: '아테리아 제국 황궁', type: 'palace', x: capital.x, y: capital.y - 4, w: 7, h: 5, color: '#fef08a', roofColor: '#b45309', icon: '👑' });
  addBuilding({ id: 'sol_cathedral', settlementId: 'solaris', name: '빛의 대성당', type: 'temple', x: capital.x - 7, y: capital.y - 1, w: 5, h: 4, color: '#93c5fd', roofColor: '#1d4ed8', icon: '⛪' });
  addBuilding({ id: 'sol_market', settlementId: 'solaris', name: '제국 중앙 대시장', type: 'market', x: capital.x + 6, y: capital.y + 1, w: 6, h: 4, color: '#fed7aa', roofColor: '#ea580c', icon: '⚖️' });
  addBuilding({ id: 'sol_barracks', settlementId: 'solaris', name: '황실 근위대 병영', type: 'barracks', x: capital.x - 6, y: capital.y + 6, w: 5, h: 4, color: '#cbd5e1', roofColor: '#334155', icon: '🛡️' });
  addBuilding({ id: 'sol_tavern', settlementId: 'solaris', name: '황금 사자 주점 & 여관', type: 'tavern', x: capital.x + 5, y: capital.y + 7, w: 4, h: 3, color: '#fde68a', roofColor: '#b45309', icon: '🍺' });

  const farm = settlementMap.goldenwheat;
  addBuilding({ id: 'gw_mill', settlementId: 'goldenwheat', name: '황금 풍차 방앗간', type: 'windmill', x: farm.x - 4, y: farm.y - 3, w: 4, h: 4, color: '#fef08a', roofColor: '#b45309', icon: '💨' });
  addBuilding({ id: 'gw_granary', settlementId: 'goldenwheat', name: '곡물 저장소 & 농업 조합', type: 'market', x: farm.x + 4, y: farm.y + 2, w: 5, h: 3, color: '#fed7aa', roofColor: '#ea580c', icon: '🌾' });

  // 농경지 패치
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

  const wValley = settlementMap.windmill_valley;
  addBuilding({ id: 'wv_mill', settlementId: 'windmill_valley', name: '윈드밀 수차 방앗간', type: 'windmill', x: wValley.x, y: wValley.y - 2, w: 4, h: 4, color: '#fef08a', roofColor: '#b45309', icon: '💨' });

  const port = settlementMap.bluewave;
  addBuilding({ id: 'bw_shipyard', settlementId: 'bluewave', name: '제국 해군 조선소', type: 'shipyard', x: port.x - 4, y: port.y - 3, w: 5, h: 4, color: '#93c5fd', roofColor: '#1d4ed8', icon: '⚓' });
  addBuilding({ id: 'bw_market', settlementId: 'bluewave', name: '해상무역 어시장', type: 'market', x: port.x + 3, y: port.y + 3, w: 5, h: 3, color: '#fed7aa', roofColor: '#ea580c', icon: '🐟' });
  addBuilding({ id: 'bw_navy', settlementId: 'bluewave', name: '제국 해군 제독부', type: 'barracks', x: port.x + 3, y: port.y - 6, w: 4, h: 3, color: '#60a5fa', roofColor: '#1e3a8a', icon: '🚢' });

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

  const fort = settlementMap.valor_fort;
  addBuilding({ id: 'vf_keep', settlementId: 'valor_fort', name: '발로르 사령부', type: 'barracks', x: fort.x, y: fort.y - 3, w: 5, h: 4, color: '#60a5fa', roofColor: '#1e3a8a', icon: '🛡️' });
  addBuilding({ id: 'vf_merc', settlementId: 'valor_fort', name: '붉은매 용병단 & 모험가 길드', type: 'guild', x: fort.x - 5, y: fort.y + 3, w: 4, h: 3, color: '#f43f5e', roofColor: '#881337', icon: '⚔️' });

  const oakwood = settlementMap.oakwood;
  addBuilding({ id: 'ow_sawmill', settlementId: 'oakwood', name: '오크우드 왕립 제재소', type: 'market', x: oakwood.x, y: oakwood.y - 2, w: 4, h: 3, color: '#a16207', roofColor: '#451a03', icon: '🪓' });

  const cFalls = settlementMap.crystal_falls;
  addBuilding({ id: 'cf_spire', settlementId: 'crystal_falls', name: '크리스탈폴 비전 학탑', type: 'guild', x: cFalls.x, y: cFalls.y, w: 4, h: 5, color: '#c084fc', roofColor: '#581c87', icon: '🔮' });

  const lakeTown = settlementMap.silverleaf;
  addBuilding({ id: 'sl_lodge', settlementId: 'silverleaf', name: '실버리프 호수 산장 & 교역소', type: 'market', x: lakeTown.x, y: lakeTown.y, w: 4, h: 3, color: '#34d399', roofColor: '#065f46', icon: '🌲' });

  // [서부 신대륙 건물들]
  const elvenTown = settlementMap.elvenheim;
  addBuilding({ id: 'elv_tree', settlementId: 'elvenheim', name: '세계수 이그드라실 성소', type: 'palace', x: elvenTown.x, y: elvenTown.y - 3, w: 6, h: 5, color: '#2dd4bf', roofColor: '#0f766e', icon: '🌸' });
  addBuilding({ id: 'elv_spire', settlementId: 'elvenheim', name: '별빛 아카나 마법학탑', type: 'guild', x: elvenTown.x - 6, y: elvenTown.y + 2, w: 4, h: 4, color: '#c084fc', roofColor: '#6b21a8', icon: '🔮' });
  addBuilding({ id: 'elv_market', settlementId: 'elvenheim', name: '엘프 영약·보석 교역소', type: 'market', x: elvenTown.x + 6, y: elvenTown.y + 2, w: 4, h: 3, color: '#34d399', roofColor: '#065f46', icon: '💎' });

  const fairyGlade = settlementMap.fairy_glade;
  addBuilding({ id: 'fairy_shrine', settlementId: 'fairy_glade', name: '달빛 요정의 제단', type: 'temple', x: fairyGlade.x, y: fairyGlade.y, w: 4, h: 4, color: '#c084fc', roofColor: '#7e22ce', icon: '🌙' });

  const desertTown = settlementMap.mirage_oasis;
  addBuilding({ id: 'mir_palace', settlementId: 'mirage_oasis', name: '황금 술탄의 신기루 궁전', type: 'palace', x: desertTown.x, y: desertTown.y - 5, w: 6, h: 5, color: '#facc15', roofColor: '#b45309', icon: '🕌' });
  addBuilding({ id: 'mir_bazaar', settlementId: 'mirage_oasis', name: '미라주 대바자르', type: 'market', x: desertTown.x + 6, y: desertTown.y + 2, w: 5, h: 4, color: '#f97316', roofColor: '#9a3412', icon: '🌶️' });

  const sphinx = settlementMap.sphinx_pyramid;
  addBuilding({ id: 'sph_pyramid', settlementId: 'sphinx_pyramid', name: '고대 태양왕의 대피라미드', type: 'temple', x: sphinx.x, y: sphinx.y, w: 7, h: 6, color: '#eab308', roofColor: '#713f12', icon: '🏛️' });

  const bedouin = settlementMap.bedouin_camp;
  addBuilding({ id: 'bed_bazaar', settlementId: 'bedouin_camp', name: '베두인 전갈 오아시스 천막', type: 'market', x: bedouin.x, y: bedouin.y, w: 4, h: 4, color: '#fb923c', roofColor: '#9a3412', icon: '🎪' });

  const dragonNest = settlementMap.dragon_eyrie;
  addBuilding({ id: 'drag_shrine', settlementId: 'dragon_eyrie', name: '천공의 고대 드래곤 제단', type: 'lair', x: dragonNest.x, y: dragonNest.y, w: 6, h: 5, color: '#a855f7', roofColor: '#4c1d95', icon: '🐉' });

  const celHaven = settlementMap.celestial_haven;
  addBuilding({ id: 'ch_spire', settlementId: 'celestial_haven', name: '천공 비행 룬 탑', type: 'guild', x: celHaven.x, y: celHaven.y, w: 5, h: 5, color: '#c084fc', roofColor: '#6b21a8', icon: '☁️' });

  const gob = settlementMap.goblin_camp;
  addBuilding({ id: 'gob_camp', settlementId: 'goblin_camp', name: '고블린 도적 야영지', type: 'lair', x: gob.x, y: gob.y, w: 4, h: 3, color: '#dc2626', roofColor: '#450a0a', icon: '👺' });

  // [북부 노스펠름 건물들]
  const frostCit = settlementMap.frost_citadel;
  addBuilding({ id: 'fc_keep', settlementId: 'frost_citadel', name: '서리 거인 얼음 요새', type: 'lair', x: frostCit.x, y: frostCit.y, w: 6, h: 5, color: '#e0f2fe', roofColor: '#38bdf8', icon: '❄️' });

  const stMare = settlementMap.st_mare;
  addBuilding({ id: 'sm_fishhouse', settlementId: 'st_mare', name: '세인트 마레 어선 조합', type: 'market', x: stMare.x, y: stMare.y - 2, w: 4, h: 3, color: '#38bdf8', roofColor: '#0369a1', icon: '🎣' });

  const vGate = settlementMap.valkyrie_gate;
  addBuilding({ id: 'vg_bastion', settlementId: 'valkyrie_gate', name: '발키리 협곡 철벽 관문', type: 'barracks', x: vGate.x, y: vGate.y, w: 5, h: 4, color: '#94a3b8', roofColor: '#1e293b', icon: '🏰' });

  const orc = settlementMap.orc_stronghold;
  addBuilding({ id: 'orc_keep', settlementId: 'orc_stronghold', name: '오크 대족장의 피의 요새', type: 'lair', x: orc.x, y: orc.y, w: 5, h: 4, color: '#b91c1c', roofColor: '#3f1d1d', icon: '👹' });

  // [남부 드라코니아 건물들]
  const volcano = settlementMap.volcano_isle;
  addBuilding({ id: 'vol_altar', settlementId: 'volcano_isle', name: '심해 크라켄 & 화산 제단', type: 'lair', x: volcano.x, y: volcano.y + 3, w: 5, h: 4, color: '#dc2626', roofColor: '#450a0a', icon: '🌋' });

  const dragonGrave = settlementMap.dragon_graveyard;
  addBuilding({ id: 'dg_altar', settlementId: 'dragon_graveyard', name: '용골 흑마법 제단', type: 'lair', x: dragonGrave.x, y: dragonGrave.y, w: 5, h: 4, color: '#78350f', roofColor: '#451a03', icon: '🦴' });

  const magmaForge = settlementMap.magma_underforge;
  addBuilding({ id: 'mu_foundry', settlementId: 'magma_underforge', name: '심연 마그마 대주조소', type: 'forge', x: magmaForge.x, y: magmaForge.y, w: 5, h: 4, color: '#dc2626', roofColor: '#7f1d1d', icon: '🔥' });

  const siren = settlementMap.siren_coral;
  addBuilding({ id: 'sr_temple', settlementId: 'siren_coral', name: '세이렌 진주 산호 신전', type: 'temple', x: siren.x, y: siren.y, w: 4, h: 4, color: '#38bdf8', roofColor: '#0369a1', icon: '🧜‍♀️' });

  // [동부 신비 & 네크로폴리스 건물들]
  const necro = settlementMap.obsidian_necropolis;
  addBuilding({ id: 'nec_tomb', settlementId: 'obsidian_necropolis', name: '강령술 리치 군주의 영묘', type: 'lair', x: necro.x, y: necro.y, w: 5, h: 4, color: '#475569', roofColor: '#0f172a', icon: '💀' });

  const whisWood = settlementMap.whispering_woods;
  addBuilding({ id: 'ww_lodge', settlementId: 'whispering_woods', name: '속삭이는 숲 마법 산장', type: 'market', x: whisWood.x, y: whisWood.y, w: 4, h: 3, color: '#10b981', roofColor: '#064e3b', icon: '🌲' });

  const crystalCav = settlementMap.crystal_caverns;
  addBuilding({ id: 'cc_shrine', settlementId: 'crystal_caverns', name: '수정 동굴 비전 성소', type: 'guild', x: crystalCav.x, y: crystalCav.y, w: 5, h: 4, color: '#c084fc', roofColor: '#581c87', icon: '💎' });

  const dragRuins = settlementMap.dragon_ruins;
  addBuilding({ id: 'dr_temple', settlementId: 'dragon_ruins', name: '용의 계곡 고대 신전', type: 'lair', x: dragRuins.x, y: dragRuins.y, w: 6, h: 5, color: '#f59e0b', roofColor: '#78350f', icon: '🏛️' });

  const shipwreck = settlementMap.sunken_shipwreck;
  addBuilding({ id: 'ss_wreck', settlementId: 'sunken_shipwreck', name: '전설의 해적선 갈레온 침몰 잔해', type: 'shipyard', x: shipwreck.x, y: shipwreck.y, w: 5, h: 4, color: '#78350f', roofColor: '#1c1917', icon: '⛵' });

  // [해협 관문 & 성역 건물들]
  const beacon = settlementMap.lone_beacon;
  addBuilding({ id: 'lb_tower', settlementId: 'lone_beacon', name: '외로운 회전 등대', type: 'shipyard', x: beacon.x, y: beacon.y, w: 4, h: 5, color: '#fef08a', roofColor: '#1e3a8a', icon: '🗼' });

  const pirate = settlementMap.pirate_cove;
  addBuilding({ id: 'pir_fort', settlementId: 'pirate_cove', name: '블랙비어드 대해적 성채', type: 'lair', x: pirate.x, y: pirate.y, w: 5, h: 4, color: '#334155', roofColor: '#0f172a', icon: '🏴‍☠️' });

  const atlantis = settlementMap.atlantis_ruins;
  addBuilding({ id: 'atl_temple', settlementId: 'atlantis_ruins', name: '아틀란티스 해저 신전', type: 'temple', x: atlantis.x, y: atlantis.y, w: 6, h: 5, color: '#0284c7', roofColor: '#075985', icon: '🔱' });

  // 7. 5대 대륙 자원 노드 (채집 & 채광 & 발굴 190+ 개소)
  const resourceNodes = [];
  // (1) 중앙 대륙: 미스릴 & 황금 광맥 (24개소)
  for (let i = 0; i < 24; i++) {
    const rx = Math.round(325 + Math.cos(i * 1.5) * (8 + (i % 5) * 8));
    const ry = Math.round(155 + Math.sin(i * 1.5) * (8 + (i % 5) * 6));
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] !== TILE.DEEP_WATER && tiles[idx(rx, ry)] !== TILE.WATER) {
      resourceNodes.push({ id: 'res_mine_c_' + i, type: 'mine', x: rx, y: ry, name: i % 2 === 0 ? '⛏️ 미스릴 광맥' : '⛏️ 황금 광맥', resource: i % 2 === 0 ? 'ore' : 'gold', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (2) 중앙 대륙: 고대 벌목 참나무 (26개소)
  for (let i = 0; i < 26; i++) {
    const rx = Math.round(360 + Math.sin(i * 1.7) * 30);
    const ry = Math.round(230 + Math.cos(i * 1.3) * 24);
    if (inBounds(rx, ry) && (tiles[idx(rx, ry)] === TILE.FOREST || tiles[idx(rx, ry)] === TILE.MEADOW || tiles[idx(rx, ry)] === TILE.GRASS)) {
      resourceNodes.push({ id: 'res_tree_c_' + i, type: 'tree', x: rx, y: ry, name: '🌲 고대 참나무', resource: 'wood', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (3) 서부 신대륙: 세계수 영약초 (26개소)
  for (let i = 0; i < 26; i++) {
    const rx = Math.round(100 + Math.sin(i * 2.1) * 26);
    const ry = Math.round(100 + Math.cos(i * 1.9) * 26);
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] !== TILE.DEEP_WATER && tiles[idx(rx, ry)] !== TILE.WATER) {
      resourceNodes.push({ id: 'res_herb_w_' + i, type: 'herb', x: rx, y: ry, name: '🌿 세계수 영약초', resource: 'herbs', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (4) 서부 신대륙: 사막 황금 향신료 선인장 (22개소)
  for (let i = 0; i < 22; i++) {
    const rx = Math.round(96 + Math.sin(i * 1.8) * 30);
    const ry = Math.round(290 + Math.cos(i * 1.6) * 24);
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] === TILE.DESERT) {
      resourceNodes.push({ id: 'res_spice_w_' + i, type: 'spice', x: rx, y: ry, name: '🌵 황금 사막 선인장', resource: 'spices', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (5) 북부 노스펠름: 영구동토 빙정석 (20개소)
  for (let i = 0; i < 20; i++) {
    const rx = Math.round(320 + Math.sin(i * 1.9) * 36);
    const ry = Math.round(40 + Math.cos(i * 1.5) * 14);
    if (inBounds(rx, ry) && (tiles[idx(rx, ry)] === TILE.SNOW || tiles[idx(rx, ry)] === TILE.MOUNTAIN || tiles[idx(rx, ry)] === TILE.TUNDRA)) {
      resourceNodes.push({ id: 'res_ice_n_' + i, type: 'mine', x: rx, y: ry, name: '❄️ 영구동토 빙정석', resource: 'gems', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (6) 남부 드라코니아: 심연 흑요석 광맥 (20개소)
  for (let i = 0; i < 20; i++) {
    const rx = Math.round(405 + Math.sin(i * 1.9) * 26);
    const ry = Math.round(345 + Math.cos(i * 1.7) * 16);
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] !== TILE.DEEP_WATER && tiles[idx(rx, ry)] !== TILE.WATER) {
      resourceNodes.push({ id: 'res_obs_s_' + i, type: 'mine', x: rx, y: ry, name: '🔥 심연 흑요석 광맥', resource: 'ore', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (7) 남서 산호환초 & 심해 진주 조개 (24개소)
  for (let i = 0; i < 24; i++) {
    const rx = Math.round(185 + Math.sin(i * 1.4) * 26);
    const ry = Math.round(320 + Math.cos(i * 1.4) * 26);
    if (inBounds(rx, ry) && (tiles[idx(rx, ry)] === TILE.WATER || tiles[idx(rx, ry)] === TILE.SAND || tiles[idx(rx, ry)] === TILE.CORAL)) {
      resourceNodes.push({ id: 'res_clam_' + i, type: 'clam', x: rx, y: ry, name: '🦪 심해 진주조개', resource: 'gems', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (8) 동부 신비 대륙: 비전 에테르 수정 (20개소)
  for (let i = 0; i < 20; i++) {
    const rx = Math.round(555 + Math.sin(i * 1.8) * 22);
    const ry = Math.round(195 + Math.cos(i * 1.6) * 18);
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] !== TILE.DEEP_WATER && tiles[idx(rx, ry)] !== TILE.WATER) {
      resourceNodes.push({ id: 'res_crys_e_' + i, type: 'mine', x: rx, y: ry, name: '💎 비전 에테르 수정', resource: 'gems', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (9) 북부 노스펠름: 툰드라 서리이끼 (18개소)
  for (let i = 0; i < 18; i++) {
    const rx = Math.round(275 + Math.sin(i * 2.0) * 24);
    const ry = Math.round(62 + Math.cos(i * 1.8) * 12);
    if (inBounds(rx, ry) && (tiles[idx(rx, ry)] === TILE.TUNDRA || tiles[idx(rx, ry)] === TILE.DARK_FOREST)) {
      resourceNodes.push({ id: 'res_moss_n_' + i, type: 'herb', x: rx, y: ry, name: '🌿 툰드라 서리이끼', resource: 'herbs', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }

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
    resourceNodes,
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
// 하위 호환
window.WORLD_HEIGHT = WORLD_HEIGHT;
window.WORLD_SIZE = WORLD_WIDTH;
window.TILE_SIZE = TILE_SIZE;
window.TILE = TILE;
window.TILE_INFO = TILE_INFO;
window.generateWorld = generateWorld;
