// ============================================================================
// world_gen.js - 5대 대륙 초대형 오픈월드 (960x600 타일, 30,720px x 19,200px)
// [1] 중앙 아테리아 제국 본토 (솔라리스 황도·푸른파도항·솔헤이븐항·베로니아공작령·그랜드오크백작령·황금밀후작령·아이언포지·발로르요새)
// [2] 서부 실바니아 요정림 & 미라주 사막 제국 & 천공 용의 고원 (엘븐하임·오아시스·피라미드·사막바자르항)
// [3] 북부 노스펠름 혹한 영구동토 대륙 (서리거인 성채·세인트마레 포구·발키리 관문·오크 요새·늑대동굴·예티빙벽)
// [4] 남부 드라코니아 화염·용족 대륙 (흑요석 용족성채·발라카스 분화구·용골 묘지·마그마 용광로·샐러맨더 군락·흑요석남항)
// [5] 동부 신비 & 네크로폴리스 대륙 (흑암 네크로폴리스·속삭이는 늪지·비전 수정동굴·악어 군락·고대 룬 유적·안개포구)
// [해양] 대양 군도 & 환초 (외로운 등대섬·해골초도 해적성채·세이렌 산호환초·아틀란티스 신전·유령선 해구·크라켄 심해)
// ============================================================================

const WORLD_WIDTH = 960;  // 가로 960 타일 (30,720px)
const WORLD_HEIGHT = 600; // 세로 600 타일 (19,200px)
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
  const deco = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);

  const idx = (x, y) => y * WORLD_WIDTH + x;
  const inBounds = (x, y) => x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;

  // 1. 5대 대륙 및 4대 해협 & 광활한 외해 대양 생성 (960x600 초대형 맵)
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const nx = x / WORLD_WIDTH;
      const ny = y / WORLD_HEIGHT;
      const nVal = fbm(elevNoise, nx * 7.5, ny * 5.2, 4);
      const m = fbm(moistNoise, nx * 7.0, ny * 5.5, 3);
      const d = detailNoise(nx * 32, ny * 26);

      // 5대 대륙 타원 거리 함수 (중앙 제국 대륙 초대형 4.4배 확장 & 4대 외해 대륙 황금 밸런스)
      const dCentral = Math.hypot((x - 480) / 195, (y - 300) / 135);
      const dWest    = Math.hypot((x - 130) / 105, (y - 300) / 220);
      const dNorth   = Math.hypot((x - 480) / 240, (y - 75) / 55);
      const dSouth   = Math.hypot((x - 480) / 240, (y - 525) / 55);
      const dEast    = Math.hypot((x - 830) / 105, (y - 300) / 220);

      // 해협 중간 징검다리 섬 & 환초
      const dBeacon = Math.hypot(x - 290, y - 270);
      const dPirate = Math.hypot(x - 280, y - 350);
      const dSiren = Math.hypot(x - 240, y - 460);
      const dShipwreck = Math.hypot(x - 670, y - 420);
      const dAtlantis = Math.hypot(x - 320, y - 420);

      let maxE = 0;
      let region = 'central';

      // [1] 중앙 대륙 (아테리아 제국 본토 - 거대한 제국 영지들과 산맥, 대평원)
      if (dCentral < 1.0) {
        let e = (1 - dCentral) * 0.82 + nVal * 0.32;
        // 솔라리스 황도 대평원 분지
        const dSolaris = Math.hypot(x - 480, y - 290);
        if (dSolaris < 65) e = 0.44 + (nVal - 0.5) * 0.14;
        // 북부 철벽산맥
        const dIronMtn = Math.hypot(x - 480, y - 205);
        if (dIronMtn < 40 && nVal > 0.42) e += 0.35;
        // 동부 암석 협곡 (스톤헤븐)
        const dStone = Math.hypot(x - 550, y - 350);
        if (dStone < 32) e += 0.20;
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
      if (dBeacon < 16) {
        const e = (1 - dBeacon / 16) * 0.50 + nVal * 0.20;
        if (e > maxE) { maxE = e; region = 'beacon'; }
      }
      if (dPirate < 18) {
        const e = (1 - dPirate / 18) * 0.52 + nVal * 0.20;
        if (e > maxE) { maxE = e; region = 'pirate'; }
      }
      if (dSiren < 20) {
        const e = (1 - dSiren / 20) * 0.48 + nVal * 0.20;
        if (e > maxE) { maxE = e; region = 'siren'; }
      }
      if (dShipwreck < 18) {
        const e = (1 - dShipwreck / 18) * 0.48 + nVal * 0.20;
        if (e > maxE) { maxE = e; region = 'shipwreck'; }
      }
      if (dAtlantis < 18) {
        const e = (1 - dAtlantis / 18) * 0.45 + nVal * 0.20;
        if (e > maxE) { maxE = e; region = 'siren'; }
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
        if (region === 'shipwreck') {
          t = dShipwreck < 10 ? TILE.SAND : TILE.CORAL;
        } else if (region === 'siren') {
          t = dSiren < 10 ? TILE.SAND : TILE.CORAL;
        } else if (region === 'beacon') {
          t = dBeacon < 9 ? TILE.CASTLE_FLOOR : TILE.SAND;
        } else if (region === 'pirate') {
          t = dPirate < 10 ? TILE.CASTLE_FLOOR : TILE.BADLANDS;
        } else if (region === 'north') {
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
          // 서부 실바니아(북) & 미라주 사막(남)
          if (y < 260) {
            if (x < 65 && maxE > 0.58) t = TILE.SNOW;
            else if (x < 85 && maxE > 0.48) t = TILE.MOUNTAIN;
            else if (maxE > 0.40) t = TILE.ELVEN_FOREST;
            else t = m > 0.42 ? TILE.ELVEN_FOREST : TILE.MEADOW;
          } else {
            if (maxE > 0.60) t = TILE.HILLS;
            else if (maxE > 0.52) t = TILE.BADLANDS;
            else t = TILE.DESERT;
          }
        } else if (region === 'east') {
          // 동부 신비 & 흑요석 네크로폴리스 & 비전 수정 & 안개 늪지
          if (maxE > 0.65) t = TILE.MOUNTAIN;
          else if (maxE > 0.52) t = TILE.HILLS;
          else if (Math.hypot(x - 800, y - 300) < 22) t = TILE.CRYSTAL_CAVE;
          else if (y < 260) t = (m > 0.4 ? TILE.OBSIDIAN : TILE.DARK_FOREST);
          else t = m > 0.48 ? TILE.SWAMP : TILE.AUTUMN_WOOD;
        } else {
          // 중앙 아테리아 제국 본토 (거대 평원, 수림, 산맥, 농경지, 구릉지)
          if (y < 235 && maxE > 0.52) t = TILE.MOUNTAIN; // 북부 철벽산맥
          else if (y < 245 && maxE > 0.44) t = TILE.HILLS;
          else if (maxE > 0.66) t = TILE.MOUNTAIN;
          else if (maxE > 0.54) t = TILE.HILLS;
          else if (y > 345 && maxE < 0.48) t = TILE.FARMLAND; // 남부 황금밀 대평원
          else if (m > 0.58) t = TILE.FOREST;
          else if (m > 0.38) t = TILE.MEADOW;
          else t = TILE.GRASS;
        }
      }

      tiles[idx(x, y)] = t;

      // 자연 장식물 정밀 배치 (1:참나무, 2:침엽수, 3:야생화, 4:바위, 5:야자/선인장, 6:요정수, 7:단풍, 8:수정, 9:그루터기, 10:통나무, 11:울타리, 12:모닥불, 13:룬유적, 14:수련, 15:버섯)
      if (t === TILE.FOREST) {
        if (d > 0.40) deco[idx(x, y)] = 1;
        else if (d > 0.36) deco[idx(x, y)] = 9;
        else if (d > 0.33) deco[idx(x, y)] = 15;
        else if (d > 0.30) deco[idx(x, y)] = 10;
      } else if (t === TILE.DARK_FOREST) {
        if (d > 0.36) deco[idx(x, y)] = 2;
        else if (d > 0.32) deco[idx(x, y)] = 10;
      } else if (t === TILE.MEADOW || t === TILE.GRASS) {
        if (d > 0.72) deco[idx(x, y)] = 3;
        else if (d > 0.67) deco[idx(x, y)] = 1;
        else if (d > 0.64) deco[idx(x, y)] = 4;
        else if (d > 0.61) deco[idx(x, y)] = 9;
        else if (d > 0.58) deco[idx(x, y)] = 15;
      } else if (t === TILE.FARMLAND) {
        if (d > 0.70) deco[idx(x, y)] = 11;
      } else if (t === TILE.HILLS || t === TILE.BADLANDS || t === TILE.TUNDRA || t === TILE.OBSIDIAN) {
        if (d > 0.60) deco[idx(x, y)] = 4;
        else if (d > 0.56) deco[idx(x, y)] = 13;
      } else if (t === TILE.DESERT || t === TILE.SAND) {
        if (d > 0.74) deco[idx(x, y)] = 5;
      } else if (t === TILE.ELVEN_FOREST) {
        if (d > 0.38) deco[idx(x, y)] = 6;
        else if (d > 0.33) deco[idx(x, y)] = 13;
      } else if (t === TILE.AUTUMN_WOOD) {
        if (d > 0.38) deco[idx(x, y)] = 7;
        else if (d > 0.33) deco[idx(x, y)] = 10;
      } else if (t === TILE.SNOW || t === TILE.CRYSTAL_CAVE) {
        if (d > 0.68) deco[idx(x, y)] = 8;
      }
    }
  }

  // 2. 호수 및 대형 강줄기 네트워크
  // (1) 중앙 아테리아 대호수 (455, 290)
  const lakeCenter = { x: 455, y: 290 };
  for (let y = lakeCenter.y - 14; y <= lakeCenter.y + 14; y++) {
    for (let x = lakeCenter.x - 20; x <= lakeCenter.x + 20; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot((x - lakeCenter.x) * 0.9, (y - lakeCenter.y) * 1.1);
      if (dist < 13.0) {
        tiles[idx(x, y)] = TILE.WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 16.5 && tiles[idx(x, y)] !== TILE.WATER) {
        tiles[idx(x, y)] = TILE.SAND;
        deco[idx(x, y)] = 0;
      }
    }
  }

  // (2) 사막 오아시스 에메랄드 호수 (130, 360)
  const oasisCenter = { x: 130, y: 360 };
  for (let y = oasisCenter.y - 10; y <= oasisCenter.y + 10; y++) {
    for (let x = oasisCenter.x - 14; x <= oasisCenter.x + 14; x++) {
      if (!inBounds(x, y)) continue;
      const dist = Math.hypot(x - oasisCenter.x, y - oasisCenter.y);
      if (dist < 7.5) {
        tiles[idx(x, y)] = TILE.OASIS_WATER;
        deco[idx(x, y)] = 0;
      } else if (dist < 11.5) {
        tiles[idx(x, y)] = TILE.MEADOW;
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

  // 강줄기 1: 북부 철벽산맥 수원지 -> 아이언포지 -> 대호수 -> 서해안 푸른파도 대항구
  carveRiver([
    { x: 480, y: 215 },
    { x: 468, y: 250 },
    { x: lakeCenter.x, y: lakeCenter.y },
    { x: 415, y: 305 },
    { x: 370, y: 310 }
  ], 2.4);

  // 강줄기 2: 대호수 -> 베로니아 공작령 -> 동해안 솔헤이븐 대항구
  carveRiver([
    { x: lakeCenter.x, y: lakeCenter.y },
    { x: 505, y: 285 },
    { x: 550, y: 265 },
    { x: 585, y: 310 }
  ], 2.2);

  // 강줄기 3: 대호수 -> 황금밀 대평원 후작령 -> 발로르 최전선 요새
  carveRiver([
    { x: lakeCenter.x, y: lakeCenter.y },
    { x: 465, y: 335 },
    { x: 475, y: 380 },
    { x: 480, y: 435 }
  ], 2.2);

  // 3. 5대 대륙 50개 거점 (마을, 성채, 영지, 항구, 요새, 몹 서식지/군락지)
  const settlements = [
    // ------------------------------------------------------------------------
    // [1] 중앙 제국 본토 (아테리아 대륙 - 16개 거점)
    // ------------------------------------------------------------------------
    {
      id: 'solaris',
      continent: 'central',
      name: '왕도 솔라리스',
      subtitle: '아테리아 제국 수도 · 황제궁 & 중앙 대광장',
      icon: '👑',
      type: 'capital',
      faction: 'kingdom',
      x: 480, y: 290, radius: 26, gold: 25000,
      stocks: { wheat: 120, fish: 80, ore: 70, weapons: 90, herbs: 70, gems: 55, spices: 50 },
      prices: { wheat: 18, fish: 20, ore: 28, weapons: 65, herbs: 24, gems: 95, spices: 110 },
      description: '5대 대륙의 심장인 아테리아 제국의 수도로 황실 성채와 근위기사단이 상주합니다.'
    },
    {
      id: 'bluewave',
      continent: 'central',
      name: '푸른파도 대항구',
      subtitle: '서해안 관문 · 제국 해군 사령부 & 원양 무역항',
      icon: '⚓',
      type: 'port',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 360, portWaterY: 310,
      x: 380, y: 310, radius: 20, gold: 14000,
      stocks: { wheat: 80, fish: 280, ore: 40, weapons: 50, herbs: 45, gems: 60, spices: 55 },
      prices: { wheat: 20, fish: 8, ore: 32, weapons: 58, herbs: 22, gems: 75, spices: 85 },
      description: '황금해협을 가로질러 서부 실바니아와 북부 노스펠름으로 출항하는 대항구입니다.'
    },
    {
      id: 'solhaven',
      continent: 'central',
      name: '솔헤이븐 동부 대항구',
      subtitle: '동해안 관문 · 비전 해상 교역항 & 상선단 기지',
      icon: '⛵',
      type: 'port',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 600, portWaterY: 310,
      x: 580, y: 310, radius: 18, gold: 12000,
      stocks: { wheat: 70, fish: 220, ore: 50, weapons: 60, herbs: 40, gems: 85, spices: 60 },
      prices: { wheat: 22, fish: 9, ore: 28, weapons: 62, herbs: 25, gems: 65, spices: 90 },
      description: '동부 신비 대륙과 남동 난파선 해역으로 통하는 제국의 동쪽 무역 거점입니다.'
    },
    {
      id: 'veronia',
      continent: 'central',
      name: '베로니아 공작령 성채',
      subtitle: '제국 동부 요충지 성채 · 철벽 근위대 주둔지',
      icon: '🏰',
      type: 'castle',
      faction: 'kingdom',
      x: 550, y: 250, radius: 20, gold: 11000,
      stocks: { wheat: 90, fish: 35, ore: 95, weapons: 110, herbs: 40, gems: 45, spices: 25 },
      prices: { wheat: 19, fish: 22, ore: 20, weapons: 45, herbs: 25, gems: 80, spices: 100 },
      description: '제국 동부 국경을 수호하는 유서 깊은 공작령 성채로 중무장 기사단이 주둔합니다.'
    },
    {
      id: 'oakwood',
      continent: 'central',
      name: '그랜드오크 대수림 백작령',
      subtitle: '서부 대삼림 목재 자치령 & 엘프 우호 교역마을',
      icon: '🌲',
      type: 'forest_haven',
      faction: 'kingdom',
      x: 410, y: 250, radius: 18, gold: 8500,
      stocks: { wheat: 50, fish: 30, ore: 30, weapons: 40, herbs: 140, gems: 35, spices: 20 },
      prices: { wheat: 22, fish: 24, ore: 35, weapons: 68, herbs: 12, gems: 88, spices: 105 },
      description: '울창한 고대 참나무 숲의 중심지로 목재 벌목과 엘프족과의 교역이 활발합니다.'
    },
    {
      id: 'goldenwheat',
      continent: 'central',
      name: '황금밀 대평원 후작령',
      subtitle: '남부 대곡창지대 · 거대 풍차 방앗간 타운',
      icon: '🌾',
      type: 'farming',
      faction: 'kingdom',
      x: 480, y: 375, radius: 22, gold: 9500,
      stocks: { wheat: 350, fish: 20, ore: 25, weapons: 30, herbs: 55, gems: 20, spices: 15 },
      prices: { wheat: 7, fish: 25, ore: 36, weapons: 70, herbs: 20, gems: 90, spices: 115 },
      description: '제국 전역의 식량을 책임지는 광활한 대곡창지대로 거대 풍차들이 장관을 이룹니다.'
    },
    {
      id: 'ironforge',
      continent: 'central',
      name: '아이언포지 드워프 광산성채',
      subtitle: '북부 철벽산맥 · 대용광로 & 미스릴 대장간',
      icon: '⛏️',
      type: 'mining',
      faction: 'kingdom',
      x: 480, y: 215, radius: 18, gold: 12000,
      stocks: { wheat: 35, fish: 20, ore: 320, weapons: 140, herbs: 20, gems: 80, spices: 12 },
      prices: { wheat: 25, fish: 26, ore: 10, weapons: 35, herbs: 26, gems: 58, spices: 105 },
      description: '험준한 북부 산맥 자락의 광산 요새로 드워프 장인들이 전설의 룬 장비를 단조합니다.'
    },
    {
      id: 'valor_fort',
      continent: 'central',
      name: '발로르 최전선 방어성채',
      subtitle: '남부 화염 방어벽 관문 · 붉은매 용병단 본부',
      icon: '🛡️',
      type: 'fortress',
      faction: 'kingdom',
      x: 480, y: 430, radius: 18, gold: 9000,
      stocks: { wheat: 60, fish: 25, ore: 60, weapons: 120, herbs: 50, gems: 30, spices: 20 },
      prices: { wheat: 24, fish: 26, ore: 25, weapons: 40, herbs: 24, gems: 85, spices: 95 },
      description: '남부 화염 대륙의 몬스터 침공을 막아내는 철통같은 방어 관문 요새입니다.'
    },
    {
      id: 'silverleaf',
      continent: 'central',
      name: '실버리프 호수 마을',
      subtitle: '중앙 대호수 북안 · 수변 약초 채집 마을',
      icon: '🌿',
      type: 'lake_town',
      faction: 'kingdom',
      x: 440, y: 260, radius: 15, gold: 6500,
      stocks: { wheat: 45, fish: 70, ore: 20, weapons: 25, herbs: 95, gems: 30, spices: 25 },
      prices: { wheat: 20, fish: 16, ore: 34, weapons: 60, herbs: 14, gems: 80, spices: 90 },
      description: '맑은 아테리아 호숫가에 위치한 전원마을로 희귀한 물약초가 자생합니다.'
    },
    {
      id: 'riverfall',
      continent: 'central',
      name: '리버폴 내륙 하구마을',
      subtitle: '아테리아 대호수 서안 · 내륙 어업 및 나룻배 포구',
      icon: '🛶',
      type: 'port',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 448, portWaterY: 310,
      x: 440, y: 310, radius: 15, gold: 6000,
      stocks: { wheat: 50, fish: 150, ore: 20, weapons: 30, herbs: 40, gems: 25, spices: 20 },
      prices: { wheat: 21, fish: 11, ore: 35, weapons: 62, herbs: 24, gems: 85, spices: 95 },
      description: '대호수와 강줄기가 만나는 내륙 포구로 신선한 민물어종이 풍부합니다.'
    },
    {
      id: 'stonehaven',
      continent: 'central',
      name: '스톤헤븐 대채석장 타운',
      subtitle: '동남부 암석지대 · 거대 석공 조합 마을',
      icon: '🪨',
      type: 'mining',
      faction: 'kingdom',
      x: 540, y: 350, radius: 16, gold: 7500,
      stocks: { wheat: 40, fish: 25, ore: 210, weapons: 55, herbs: 20, gems: 50, spices: 15 },
      prices: { wheat: 23, fish: 26, ore: 14, weapons: 50, herbs: 26, gems: 68, spices: 100 },
      description: '제국 성벽과 성채를 짓는 대형 화강암과 석재를 캐내는 채석 거점입니다.'
    },
    {
      id: 'moonlight_lake',
      continent: 'central',
      name: '달빛 호수 은신처',
      subtitle: '대호수 중앙 은밀한 숲 · 은둔 마법사 은신처',
      icon: '🌙',
      type: 'sanctuary',
      faction: 'kingdom',
      x: 465, y: 280, radius: 12, gold: 5000,
      stocks: { wheat: 30, fish: 40, ore: 15, weapons: 20, herbs: 80, gems: 65, spices: 30 },
      prices: { wheat: 22, fish: 20, ore: 35, weapons: 65, herbs: 16, gems: 60, spices: 85 },
      description: '호수 안개 속에 숨겨진 신비로운 은신처로 고대 마법 연구가 진행됩니다.'
    },
    {
      id: 'windmill_valley',
      continent: 'central',
      name: '윈드밀 평원 마을',
      subtitle: '남서부 평원 농경지 · 가축 방목 평화 마을',
      icon: '🏡',
      type: 'farming',
      faction: 'kingdom',
      x: 440, y: 370, radius: 14, gold: 5500,
      stocks: { wheat: 180, fish: 20, ore: 15, weapons: 20, herbs: 40, gems: 15, spices: 15 },
      prices: { wheat: 11, fish: 25, ore: 35, weapons: 68, herbs: 22, gems: 90, spices: 110 },
      description: '양과 소들이 뛰노는 푸른 평원의 평화로운 자치 마을입니다.'
    },
    {
      id: 'goblin_camp',
      continent: 'central',
      name: '고블린 대군락 동굴',
      subtitle: '서북 구릉지 험봉 · 고블린 약탈단 총본산',
      icon: '👺',
      type: 'monster_lair',
      faction: 'monster',
      x: 390, y: 210, radius: 16, gold: 6500,
      stocks: { wheat: 20, fish: 10, ore: 110, weapons: 80, herbs: 20, gems: 45, spices: 10 },
      prices: { wheat: 30, fish: 30, ore: 12, weapons: 38, herbs: 28, gems: 45, spices: 85 },
      description: '가도를 지나는 마차를 노리는 대규모 고블린 무리의 요새화된 동굴입니다.',
      danger: true
    },
    {
      id: 'blackwolf_stronghold',
      continent: 'central',
      name: '블랙울프 산적요새',
      subtitle: '동북 협곡 암벽 · 악명 높은 무법자 산적 성채',
      icon: '🏴',
      type: 'monster_lair',
      faction: 'monster',
      x: 570, y: 210, radius: 16, gold: 7500,
      stocks: { wheat: 30, fish: 15, ore: 70, weapons: 95, herbs: 25, gems: 60, spices: 20 },
      prices: { wheat: 28, fish: 28, ore: 18, weapons: 42, herbs: 26, gems: 50, spices: 80 },
      description: '험난한 산악 협곡을 요새화하여 상단을 습격하는 정예 산적단 아지트입니다.',
      danger: true
    },
    {
      id: 'wyvern_crag',
      continent: 'central',
      name: '와이번 바위산 둥지',
      subtitle: '철벽산맥 고봉 · 사나운 와이번 비행 둥지',
      icon: '🦅',
      type: 'monster_lair',
      faction: 'monster',
      x: 505, y: 220, radius: 14, gold: 8000,
      stocks: { wheat: 10, fish: 20, ore: 60, weapons: 50, herbs: 30, gems: 90, spices: 25 },
      prices: { wheat: 32, fish: 28, ore: 20, weapons: 55, herbs: 28, gems: 40, spices: 75 },
      description: '인간의 발길이 닿기 힘든 절벽 꼭대기의 사나운 와이번 서식지입니다.',
      danger: true
    },

    // ------------------------------------------------------------------------
    // [2] 서부 대륙 (실바니아 요정림 & 미라주 사막 제국 - 8개 거점)
    // ------------------------------------------------------------------------
    {
      id: 'elvenheim',
      continent: 'west',
      name: '실바니아 엘븐하임',
      subtitle: '영원의 요정숲 · 세계수 이그드라실 여왕궁',
      icon: '🌸',
      type: 'capital',
      faction: 'kingdom',
      x: 130, y: 230, radius: 24, gold: 18000,
      stocks: { wheat: 40, fish: 30, ore: 30, weapons: 70, herbs: 350, gems: 130, spices: 40 },
      prices: { wheat: 24, fish: 22, ore: 35, weapons: 60, herbs: 8, gems: 55, spices: 90 },
      description: '수천 년을 살아온 고대 엘프들의 성지로 세계수에서 흘러나오는 신비한 마력이 가득합니다.'
    },
    {
      id: 'fairy_glade',
      continent: 'west',
      name: '에메랄드 숲마을',
      subtitle: '요정 대수림 남단 · 요정 궁수 주둔지',
      icon: '🏹',
      type: 'village',
      faction: 'kingdom',
      x: 130, y: 170, radius: 16, gold: 7000,
      stocks: { wheat: 30, fish: 20, ore: 15, weapons: 50, herbs: 160, gems: 60, spices: 25 },
      prices: { wheat: 25, fish: 24, ore: 38, weapons: 55, herbs: 10, gems: 60, spices: 95 },
      description: '숲의 침입자를 감시하는 정예 엘프 순찰대와 약초사들이 거주하는 마을입니다.'
    },
    {
      id: 'breeze_gate',
      continent: 'west',
      name: '바람의 요정 관문',
      subtitle: '실바니아 동부 국경 · 대륙 횡단 관문 요새',
      icon: '🌿',
      type: 'fortress',
      faction: 'kingdom',
      x: 200, y: 230, radius: 15, gold: 6800,
      stocks: { wheat: 40, fish: 25, ore: 25, weapons: 60, herbs: 90, gems: 50, spices: 30 },
      prices: { wheat: 22, fish: 22, ore: 32, weapons: 58, herbs: 15, gems: 65, spices: 85 },
      description: '외부 세계와 요정림을 연결하는 관문으로 신비한 결계가 둘러쳐져 있습니다.'
    },
    {
      id: 'mirage_oasis',
      continent: 'west',
      name: '미라주 오아시스 바자르',
      subtitle: '미라주 사막 중심 · 황금 술탄 궁전 & 대상 거점',
      icon: '🕌',
      type: 'capital',
      faction: 'neutral',
      x: 130, y: 360, radius: 22, gold: 16000,
      stocks: { wheat: 35, fish: 20, ore: 45, weapons: 60, herbs: 40, gems: 140, spices: 320 },
      prices: { wheat: 28, fish: 28, ore: 25, weapons: 58, herbs: 30, gems: 45, spices: 12 },
      description: '사막 한가운데 에메랄드빛 오아시스를 품은 술탄의 궁전과 대규모 대상 바자르입니다.'
    },
    {
      id: 'sphinx_pyramid',
      continent: 'west',
      name: '태양신전 피라미드',
      subtitle: '남부 모래사막 유적 · 고대 파라오 룬 성소',
      icon: '🏛️',
      type: 'temple',
      faction: 'monster',
      x: 100, y: 420, radius: 18, gold: 12000,
      stocks: { wheat: 15, fish: 10, ore: 60, weapons: 70, herbs: 20, gems: 260, spices: 90 },
      prices: { wheat: 35, fish: 35, ore: 20, weapons: 65, herbs: 35, gems: 28, spices: 50 },
      description: '모래 폭풍 속에 파묻힌 고대 피라미드로 무시무시한 미라와 골렘이 지키고 있습니다.',
      danger: true
    },
    {
      id: 'dune_bazaar',
      continent: 'west',
      name: '사막 바자르 서해항',
      subtitle: '미라주 서해안 관문 · 향신료 선적 무역항',
      icon: '⚓',
      type: 'port',
      faction: 'neutral',
      isPort: true,
      portWaterX: 52, portWaterY: 330,
      x: 65, y: 330, radius: 16, gold: 9500,
      stocks: { wheat: 45, fish: 130, ore: 30, weapons: 40, herbs: 25, gems: 80, spices: 220 },
      prices: { wheat: 26, fish: 12, ore: 30, weapons: 60, herbs: 28, gems: 50, spices: 15 },
      description: '대양을 건너오는 상선에 사막의 귀중한 황금 향신료와 보석을 수출하는 항구입니다.'
    },
    {
      id: 'scorpion_canyon',
      continent: 'west',
      name: '전갈 군락지 협곡',
      subtitle: '사막 남부 암석 협곡 · 거대 맹독전갈 둥지',
      icon: '🦂',
      type: 'monster_lair',
      faction: 'monster',
      x: 150, y: 440, radius: 16, gold: 7500,
      stocks: { wheat: 10, fish: 10, ore: 70, weapons: 50, herbs: 40, gems: 85, spices: 90 },
      prices: { wheat: 34, fish: 32, ore: 18, weapons: 50, herbs: 30, gems: 42, spices: 35 },
      description: '날카로운 독침을 지닌 거대 사막 전갈들이 떼를 지어 서식하는 위험 구역입니다.',
      danger: true
    },
    {
      id: 'dragon_eyrie',
      continent: 'west',
      name: '천공의 용의 둥지',
      subtitle: '서부 최고봉 암벽 절벽 · 천공 고대룡 성역',
      icon: '🐉',
      type: 'dragon_sanctuary',
      faction: 'monster',
      x: 75, y: 200, radius: 20, gold: 15000,
      stocks: { wheat: 10, fish: 20, ore: 90, weapons: 80, herbs: 30, gems: 320, spices: 50 },
      prices: { wheat: 38, fish: 34, ore: 15, weapons: 65, herbs: 32, gems: 25, spices: 70 },
      description: '구름을 뚫고 솟아오른 천공 암봉 위에 자리한 전설의 고대 비룡 둥지입니다.',
      danger: true
    },

    // ------------------------------------------------------------------------
    // [3] 북부 노스펠름 혹한 영구동토 대륙 (7개 거점)
    // ------------------------------------------------------------------------
    {
      id: 'frost_citadel',
      continent: 'north',
      name: '서리거인 얼음성채',
      subtitle: '북방 동토 대요새 · 서리거인 왕의 빙벽 성채',
      icon: '🏰',
      type: 'capital',
      faction: 'kingdom',
      x: 480, y: 60, radius: 22, gold: 14000,
      stocks: { wheat: 30, fish: 90, ore: 140, weapons: 110, herbs: 50, gems: 90, spices: 15 },
      prices: { wheat: 28, fish: 14, ore: 16, weapons: 45, herbs: 26, gems: 55, spices: 120 },
      description: '영구동토 만년설 빙벽을 깎아 만든 웅장한 요새로 혹한의 북방을 수호합니다.'
    },
    {
      id: 'st_mare',
      continent: 'north',
      name: '세인트마레 북방 포구',
      subtitle: '노스펠름 서남해안 · 북극 쇄빙 무역항 & 포경 기지',
      icon: '⚓',
      type: 'port',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 375, portWaterY: 75,
      x: 390, y: 75, radius: 18, gold: 8800,
      stocks: { wheat: 40, fish: 320, ore: 70, weapons: 50, herbs: 30, gems: 60, spices: 15 },
      prices: { wheat: 25, fish: 6, ore: 24, weapons: 55, herbs: 28, gems: 65, spices: 110 },
      description: '유빙을 헤치고 나아가는 북방 쇄빙선들의 기착지로 고래기름과 빙어 무역이 성행합니다.'
    },
    {
      id: 'valkyrie_gate',
      continent: 'north',
      name: '발키리 만년설 관문',
      subtitle: '동북 설산 협곡 · 눈보라 빙하 철벽 요새',
      icon: '🛡️',
      type: 'fortress',
      faction: 'kingdom',
      x: 570, y: 75, radius: 16, gold: 7200,
      stocks: { wheat: 35, fish: 50, ore: 90, weapons: 95, herbs: 35, gems: 45, spices: 10 },
      prices: { wheat: 26, fish: 20, ore: 20, weapons: 42, herbs: 28, gems: 60, spices: 115 },
      description: '동북 설산의 매서운 눈보라 속에서 국경을 수호하는 발키리 수비대의 관문입니다.'
    },
    {
      id: 'orc_stronghold',
      continent: 'north',
      name: '오크 바바리안 전쟁요새',
      subtitle: '북부 혹한 황무지 · 붉은 오크 대군단 성채',
      icon: '👹',
      type: 'monster_lair',
      faction: 'monster',
      x: 430, y: 50, radius: 18, gold: 8500,
      stocks: { wheat: 20, fish: 40, ore: 110, weapons: 120, herbs: 25, gems: 40, spices: 10 },
      prices: { wheat: 32, fish: 24, ore: 15, weapons: 36, herbs: 30, gems: 50, spices: 110 },
      description: '혹한을 견디며 강인한 무력을 키운 붉은 오크 군단의 거대한 성채입니다.',
      danger: true
    },
    {
      id: 'frostwolf_den',
      continent: 'north',
      name: '설원 은빛늑대 동굴',
      subtitle: '영구동토 빙벽 자락 · 툰드라 늑대 무리 군락',
      icon: '🐺',
      type: 'animal_colony',
      faction: 'monster',
      x: 520, y: 65, radius: 15, gold: 5000,
      stocks: { wheat: 10, fish: 50, ore: 30, weapons: 30, herbs: 20, gems: 40, spices: 5 },
      prices: { wheat: 35, fish: 18, ore: 28, weapons: 60, herbs: 32, gems: 55, spices: 125 },
      description: '눈보라치는 설원을 떼지어 질주하는 은빛 늑대들의 보금자리입니다.',
      danger: true
    },
    {
      id: 'yeti_cavern',
      continent: 'north',
      name: '예티 빙하 동굴',
      subtitle: '만년설 고봉 빙벽 · 설원 거대 예티 서식지',
      icon: '🦍',
      type: 'monster_lair',
      faction: 'monster',
      x: 500, y: 40, radius: 15, gold: 6500,
      stocks: { wheat: 10, fish: 30, ore: 40, weapons: 30, herbs: 20, gems: 70, spices: 5 },
      prices: { wheat: 36, fish: 22, ore: 25, weapons: 62, herbs: 34, gems: 45, spices: 130 },
      description: '바위를 던지며 포효하는 거대한 만년설 예티가 도사리는 얼음 동굴입니다.',
      danger: true
    },
    {
      id: 'ice_dragon_altar',
      continent: 'north',
      name: '얼음룡 혹한 제단',
      subtitle: '극북 빙하 절벽 · 빙결룡 글라키에스 안식처',
      icon: '🧊',
      type: 'dragon_sanctuary',
      faction: 'monster',
      x: 450, y: 45, radius: 16, gold: 14000,
      stocks: { wheat: 10, fish: 20, ore: 80, weapons: 70, herbs: 25, gems: 280, spices: 10 },
      prices: { wheat: 38, fish: 30, ore: 18, weapons: 65, herbs: 35, gems: 28, spices: 120 },
      description: '혹한의 냉기 폭풍을 뿜어내는 고대 빙결룡의 신성한 얼음 제단입니다.',
      danger: true
    },

    // ------------------------------------------------------------------------
    // [4] 남부 드라코니아 화염 & 용족 대륙 (6개 거점)
    // ------------------------------------------------------------------------
    {
      id: 'obsidian_keep',
      continent: 'south',
      name: '흑요석 용족 성채',
      subtitle: '남부 화염 대륙 수도 · 흑요석 용혈 군주 성채',
      icon: '🏰',
      type: 'capital',
      faction: 'neutral',
      x: 480, y: 540, radius: 22, gold: 16000,
      stocks: { wheat: 30, fish: 20, ore: 220, weapons: 130, herbs: 20, gems: 160, spices: 60 },
      prices: { wheat: 28, fish: 28, ore: 12, weapons: 40, herbs: 35, gems: 45, spices: 70 },
      description: '흑요석 바위를 깎아 세운 용족 전사들의 수도로 마그마의 열기가 전신을 감쌉니다.'
    },
    {
      id: 'volcano_isle',
      continent: 'south',
      name: '화염룡 발라카스 분화구',
      subtitle: '활화산 정상 분화구 · 에인션트 화염룡 둥지',
      icon: '🌋',
      type: 'dragon_sanctuary',
      faction: 'monster',
      x: 505, y: 535, radius: 20, gold: 18000,
      stocks: { wheat: 10, fish: 10, ore: 260, weapons: 90, herbs: 15, gems: 350, spices: 80 },
      prices: { wheat: 38, fish: 38, ore: 10, weapons: 60, herbs: 40, gems: 22, spices: 60 },
      description: '부글부글 끓는 마그마 칼데라 중심부에 자리한 대륙 최강의 화염룡 둥지입니다.',
      danger: true
    },
    {
      id: 'dragon_graveyard',
      continent: 'south',
      name: '드래곤 해골 묘지',
      subtitle: '남서 흑요석 협곡 · 거대 고대룡 화석 묘지',
      icon: '🦴',
      type: 'monster_lair',
      faction: 'monster',
      x: 410, y: 545, radius: 18, gold: 8000,
      stocks: { wheat: 10, fish: 10, ore: 110, weapons: 60, herbs: 15, gems: 180, spices: 30 },
      prices: { wheat: 35, fish: 35, ore: 18, weapons: 55, herbs: 38, gems: 35, spices: 75 },
      description: '수만 년 전 전사한 거대 드래곤들의 거대한 뼈와 화석이 즐비한 언데드 구역입니다.',
      danger: true
    },
    {
      id: 'magma_underforge',
      continent: 'south',
      name: '마그마 지하용광로',
      subtitle: '화산 심층 주조소 · 전설의 화염 명검 대장간',
      icon: '🔥',
      type: 'forge',
      faction: 'neutral',
      x: 550, y: 545, radius: 16, gold: 10500,
      stocks: { wheat: 20, fish: 15, ore: 290, weapons: 140, herbs: 15, gems: 90, spices: 40 },
      prices: { wheat: 30, fish: 30, ore: 10, weapons: 32, herbs: 36, gems: 50, spices: 70 },
      description: '자연 분출하는 용암의 열기를 그대로 끌어들여 신화 등급의 무기를 주조하는 공방입니다.'
    },
    {
      id: 'salamander_pools',
      continent: 'south',
      name: '샐러맨더 용암 군락',
      subtitle: '남부 흑요석 화산암대 · 불꽃도마뱀 군락지',
      icon: '🦎',
      type: 'animal_colony',
      faction: 'monster',
      x: 440, y: 555, radius: 16, gold: 6500,
      stocks: { wheat: 10, fish: 10, ore: 120, weapons: 40, herbs: 10, gems: 110, spices: 50 },
      prices: { wheat: 35, fish: 35, ore: 15, weapons: 58, herbs: 40, gems: 42, spices: 60 },
      description: '용암천에서 헤엄치며 불꽃을 내뿜는 흑요석 도마뱀들이 득실거리는 서식지입니다.',
      danger: true
    },
    {
      id: 'obsidian_haven',
      continent: 'south',
      name: '흑요석 남항',
      subtitle: '드라코니아 서해안 · 용암석 방파제 항구',
      icon: '⚓',
      type: 'port',
      faction: 'neutral',
      isPort: true,
      portWaterX: 355, portWaterY: 530,
      x: 370, y: 530, radius: 16, gold: 8000,
      stocks: { wheat: 40, fish: 140, ore: 180, weapons: 70, herbs: 20, gems: 80, spices: 40 },
      prices: { wheat: 28, fish: 11, ore: 16, weapons: 50, herbs: 34, gems: 58, spices: 75 },
      description: '남부 대륙의 풍부한 광물과 화산석을 대륙 각지로 실어나르는 전진 기지입니다.'
    },

    // ------------------------------------------------------------------------
    // [5] 동부 신비 & 네크로폴리스 대륙 (7개 거점)
    // ------------------------------------------------------------------------
    {
      id: 'obsidian_necropolis',
      continent: 'east',
      name: '흑암 네크로폴리스 성채',
      subtitle: '동부 북단 사령술 영지 · 언데드 리치 군주 성채',
      icon: '💀',
      type: 'capital',
      faction: 'monster',
      x: 830, y: 230, radius: 22, gold: 15000,
      stocks: { wheat: 20, fish: 20, ore: 80, weapons: 110, herbs: 30, gems: 240, spices: 20 },
      prices: { wheat: 32, fish: 32, ore: 22, weapons: 45, herbs: 30, gems: 35, spices: 95 },
      description: '죽은 자들의 영혼과 해골 병사들이 순찰하는 거대한 언데드 군단의 총본산입니다.',
      danger: true
    },
    {
      id: 'whispering_woods',
      continent: 'east',
      name: '속삭이는 안개 늪지대',
      subtitle: '동부 남단 독성 늪지 · 마녀와 약초꾼 수상가옥',
      icon: '🌲',
      type: 'village',
      faction: 'neutral',
      x: 830, y: 370, radius: 18, gold: 7500,
      stocks: { wheat: 30, fish: 80, ore: 25, weapons: 35, herbs: 240, gems: 50, spices: 40 },
      prices: { wheat: 26, fish: 15, ore: 34, weapons: 65, herbs: 10, gems: 75, spices: 80 },
      description: '짙은 독안개가 자욱한 늪지대로 강력한 비전 마법약과 독초를 조제합니다.'
    },
    {
      id: 'crystal_caverns',
      continent: 'east',
      name: '비전 수정동굴 광산',
      subtitle: '동부 중앙 수정 첨탑 · 마나 수정 채굴 거점',
      icon: '🔮',
      type: 'mining',
      faction: 'kingdom',
      x: 800, y: 300, radius: 18, gold: 11000,
      stocks: { wheat: 35, fish: 25, ore: 110, weapons: 65, herbs: 30, gems: 310, spices: 30 },
      prices: { wheat: 26, fish: 25, ore: 18, weapons: 50, herbs: 24, gems: 28, spices: 85 },
      description: '보랏빛 마나 수정이 자라나는 신비로운 지하 동굴로 강력한 마도구를 제작합니다.'
    },
    {
      id: 'croc_bayou',
      continent: 'east',
      name: '맹독 악어 서식지 늪',
      subtitle: '안개 늪 심층 하구 · 늪지대 맹독악어 군락지',
      icon: '🐊',
      type: 'animal_colony',
      faction: 'monster',
      x: 860, y: 390, radius: 16, gold: 6000,
      stocks: { wheat: 10, fish: 90, ore: 20, weapons: 30, herbs: 40, gems: 50, spices: 20 },
      prices: { wheat: 32, fish: 12, ore: 32, weapons: 62, herbs: 28, gems: 65, spices: 90 },
      description: '독성 늪풀 사이로 날카로운 이빨을 숨긴 악어들이 득실거리는 맹독 서식지입니다.',
      danger: true
    },
    {
      id: 'dragon_ruins',
      continent: 'east',
      name: '고대 룬 파멸 유적',
      subtitle: '동부 북동 해안 절벽 · 고대 뇌룡 숭배 신전',
      icon: '🏛️',
      type: 'temple',
      faction: 'monster',
      x: 860, y: 200, radius: 18, gold: 13000,
      stocks: { wheat: 10, fish: 20, ore: 80, weapons: 70, herbs: 25, gems: 290, spices: 35 },
      prices: { wheat: 35, fish: 30, ore: 18, weapons: 60, herbs: 30, gems: 30, spices: 80 },
      description: '고대 마도 제국의 파괴된 신전 유적으로 고대 유물과 뇌룡의 마력이 잠들어 있습니다.',
      danger: true
    },
    {
      id: 'abyssal_drake_altar',
      continent: 'east',
      name: '심연룡 네크로스 제단',
      subtitle: '동부 암흑 봉우리 · 암흑룡 서식 제단',
      icon: '🐲',
      type: 'dragon_sanctuary',
      faction: 'monster',
      x: 880, y: 260, radius: 16, gold: 14000,
      stocks: { wheat: 10, fish: 15, ore: 70, weapons: 60, herbs: 20, gems: 300, spices: 30 },
      prices: { wheat: 36, fish: 32, ore: 18, weapons: 62, herbs: 32, gems: 26, spices: 85 },
      description: '죽음의 장막으로 뒤덮인 절벽 위에서 영혼을 삼키는 심연룡의 둥지입니다.',
      danger: true
    },
    {
      id: 'mist_haven',
      continent: 'east',
      name: '안개만 동부 포구',
      subtitle: '동부 내해 연안 · 약초 및 보석 선적 포구',
      icon: '⚓',
      type: 'port',
      faction: 'neutral',
      isPort: true,
      portWaterX: 755, portWaterY: 340,
      x: 770, y: 340, radius: 15, gold: 7800,
      stocks: { wheat: 45, fish: 160, ore: 40, weapons: 45, herbs: 90, gems: 110, spices: 30 },
      prices: { wheat: 24, fish: 10, ore: 28, weapons: 55, herbs: 18, gems: 50, spices: 85 },
      description: '안개 자욱한 만에 숨겨진 비밀 포구로 희귀한 약초와 마법 원석을 무역합니다.'
    },

    // ------------------------------------------------------------------------
    // [6] 대양 군도 & 환초 & 해협 거점 (6개 거점)
    // ------------------------------------------------------------------------
    {
      id: 'lone_beacon',
      continent: 'strait',
      name: '외로운 등대섬',
      subtitle: '황금해협 북단 관문 · 거대 회전 등대 & 해상 보급소',
      icon: '🗼',
      type: 'beacon_isle',
      faction: 'kingdom',
      isPort: true,
      portWaterX: 290, portWaterY: 258,
      x: 290, y: 270, radius: 14, gold: 5500,
      stocks: { wheat: 50, fish: 110, ore: 25, weapons: 35, herbs: 30, gems: 45, spices: 35 },
      prices: { wheat: 22, fish: 13, ore: 30, weapons: 55, herbs: 22, gems: 70, spices: 75 },
      description: '밤바다를 밝히는 거대한 등대가 서 있어 험난한 해협을 건너는 선박들의 길잡이가 됩니다.'
    },
    {
      id: 'pirate_cove',
      continent: 'strait',
      name: '해골초도 대해적 성채',
      subtitle: '황금해협 남단 암초섬 · 해적선단 연합 본거지',
      icon: '🏴‍☠️',
      type: 'monster_lair',
      faction: 'monster',
      isPort: true,
      portWaterX: 268, portWaterY: 350,
      x: 280, y: 350, radius: 16, gold: 12000,
      stocks: { wheat: 30, fish: 80, ore: 60, weapons: 130, herbs: 20, gems: 180, spices: 90 },
      prices: { wheat: 30, fish: 16, ore: 22, weapons: 35, herbs: 28, gems: 40, spices: 45 },
      description: '약탈한 금은보화를 숨겨둔 해적들의 소굴로 중무장 해적 갤리온선들이 정박해 있습니다.',
      danger: true
    },
    {
      id: 'siren_coral',
      continent: 'strait',
      name: '세이렌 산호초 환초',
      subtitle: '남서 대양 에메랄드 환초 · 심해 진주 성역',
      icon: '🏝️',
      type: 'coral_isle',
      faction: 'neutral',
      isPort: true,
      portWaterX: 240, portWaterY: 445,
      x: 240, y: 460, radius: 18, gold: 11000,
      stocks: { wheat: 20, fish: 240, ore: 20, weapons: 30, herbs: 50, gems: 320, spices: 70 },
      prices: { wheat: 32, fish: 6, ore: 38, weapons: 65, herbs: 20, gems: 25, spices: 60 },
      description: '형형색색 산호초가 끝없이 펼쳐진 신비의 환초로 전설의 심해 흑진주가 채취됩니다.'
    },
    {
      id: 'atlantis_ruins',
      continent: 'strait',
      name: '아틀란티스 침몰 신전',
      subtitle: '대양 중앙 심해 해구 · 고대 해저 제국 유적',
      icon: '🔱',
      type: 'coral_isle',
      faction: 'neutral',
      isPort: true,
      portWaterX: 310, portWaterY: 410,
      x: 320, y: 420, radius: 16, gold: 13000,
      stocks: { wheat: 15, fish: 210, ore: 40, weapons: 60, herbs: 30, gems: 290, spices: 80 },
      prices: { wheat: 34, fish: 7, ore: 30, weapons: 55, herbs: 25, gems: 26, spices: 65 },
      description: '해수면 아래 잠긴 고대 해저 문명의 거대한 석조 기둥과 삼지창 신전입니다.'
    },
    {
      id: 'sunken_shipwreck',
      continent: 'strait',
      name: '유령선 난파 해구',
      subtitle: '남동 대해양 암초해역 · 전설의 보물선 침몰지',
      icon: '⛵',
      type: 'coral_isle',
      faction: 'neutral',
      isPort: true,
      portWaterX: 660, portWaterY: 410,
      x: 670, y: 420, radius: 16, gold: 11500,
      stocks: { wheat: 15, fish: 200, ore: 40, weapons: 60, herbs: 25, gems: 260, spices: 70 },
      prices: { wheat: 34, fish: 7, ore: 28, weapons: 52, herbs: 28, gems: 30, spices: 65 },
      description: '과거 거대 상선들이 암초에 걸려 침몰한 해역으로 잠수부들이 보물을 인양합니다.'
    },
    {
      id: 'kraken_abyss',
      continent: 'strait',
      name: '심연의 크라켄 해역',
      subtitle: '동부 대해양 거대 소용돌이 · 심해 괴수 크라켄 서식지',
      icon: '🦑',
      type: 'monster_lair',
      faction: 'monster',
      x: 700, y: 280, radius: 16, gold: 14000,
      stocks: { wheat: 10, fish: 260, ore: 30, weapons: 40, herbs: 15, gems: 280, spices: 50 },
      prices: { wheat: 36, fish: 6, ore: 32, weapons: 60, herbs: 30, gems: 28, spices: 70 },
      description: '거대한 촉수로 군함을 두 동강 내는 전설의 심해 괴수 크라켄이 도사리는 해역입니다.',
      danger: true
    }
  ];

  const settlementMap = {};
  for (const s of settlements) settlementMap[s.id] = s;

  // 4. 대륙 도로망 및 대양 교량 연결 (Road & Bridge Network)
  const roadLinks = [
    // [중앙 대륙 제국 가도]
    ['solaris', 'bluewave'],
    ['solaris', 'solhaven'],
    ['solaris', 'veronia'],
    ['solaris', 'oakwood'],
    ['solaris', 'goldenwheat'],
    ['solaris', 'ironforge'],
    ['solaris', 'silverleaf'],
    ['solaris', 'riverfall'],
    ['solaris', 'stonehaven'],
    ['solaris', 'moonlight_lake'],
    ['goldenwheat', 'valor_fort'],
    ['goldenwheat', 'windmill_valley'],
    ['veronia', 'solhaven'],
    ['veronia', 'stonehaven'],
    ['oakwood', 'riverfall'],
    ['ironforge', 'silverleaf'],

    // [서부 실바니아 & 미라주 도로]
    ['elvenheim', 'fairy_glade'],
    ['elvenheim', 'breeze_gate'],
    ['elvenheim', 'mirage_oasis'],
    ['mirage_oasis', 'sphinx_pyramid'],
    ['mirage_oasis', 'dune_bazaar'],

    // [북부 노스펠름 도로]
    ['frost_citadel', 'st_mare'],
    ['frost_citadel', 'valkyrie_gate'],
    ['frost_citadel', 'orc_stronghold'],

    // [남부 드라코니아 도로]
    ['obsidian_keep', 'obsidian_haven'],
    ['obsidian_keep', 'dragon_graveyard'],
    ['obsidian_keep', 'magma_underforge'],

    // [동부 신비 대륙 도로]
    ['obsidian_necropolis', 'crystal_caverns'],
    ['whispering_woods', 'crystal_caverns'],
    ['whispering_woods', 'mist_haven'],
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

  // 5. 4대 해협 및 대양을 가로지르는 해상 무역 항로
  const seaRoutes = [
    { fromId: 'bluewave', toId: 'lone_beacon', name: '황금해협 북부 항로' },
    { fromId: 'lone_beacon', toId: 'elvenheim', name: '등대-엘븐하임 항로' },
    { fromId: 'bluewave', toId: 'pirate_cove', name: '해골초도 위험항로' },
    { fromId: 'pirate_cove', toId: 'mirage_oasis', name: '미라주 오아시스 횡단항로' },
    { fromId: 'bluewave', toId: 'st_mare', name: '북방 빙해항로' },
    { fromId: 'st_mare', toId: 'lone_beacon', name: '노스펠름 해협항로' },
    { fromId: 'bluewave', toId: 'atlantis_ruins', name: '아틀란티스 심해항로' },
    { fromId: 'atlantis_ruins', toId: 'obsidian_haven', name: '화산군도 흑요석항로' },
    { fromId: 'atlantis_ruins', toId: 'siren_coral', name: '세이렌 산호환초항로' },
    { fromId: 'siren_coral', toId: 'dune_bazaar', name: '남서 대양쾌속항로' },
    { fromId: 'solhaven', toId: 'mist_haven', name: '비전해협 동부항로' },
    { fromId: 'solhaven', toId: 'sunken_shipwreck', name: '난파선 해구항로' },
    { fromId: 'sunken_shipwreck', toId: 'dragon_ruins', name: '용의 계곡 유적항로' },
    { fromId: 'solhaven', toId: 'kraken_abyss', name: '심연 크라켄 위험항로' }
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

  const veronia = settlementMap.veronia;
  addBuilding({ id: 'ver_keep', settlementId: 'veronia', name: '베로니아 대성채', type: 'castle', x: veronia.x, y: veronia.y - 3, w: 6, h: 5, color: '#94a3b8', roofColor: '#1e293b', icon: '🏰' });
  addBuilding({ id: 'ver_guild', settlementId: 'veronia', name: '철벽 기사단 훈련소', type: 'barracks', x: veronia.x - 5, y: veronia.y + 2, w: 4, h: 3, color: '#60a5fa', roofColor: '#1e3a8a', icon: '⚔️' });

  const farm = settlementMap.goldenwheat;
  addBuilding({ id: 'gw_mill', settlementId: 'goldenwheat', name: '황금 풍차 방앗간', type: 'windmill', x: farm.x - 4, y: farm.y - 3, w: 4, h: 4, color: '#fef08a', roofColor: '#b45309', icon: '💨' });
  addBuilding({ id: 'gw_granary', settlementId: 'goldenwheat', name: '곡물 저장소 & 농업 조합', type: 'market', x: farm.x + 4, y: farm.y + 2, w: 5, h: 3, color: '#fed7aa', roofColor: '#ea580c', icon: '🌾' });

  // 농경지 패치
  const farmPlots = [];
  for (let dy = -12; dy <= 12; dy++) {
    for (let dx = -14; dx <= 14; dx++) {
      const fx = farm.x + dx;
      const fy = farm.y + dy;
      if (inBounds(fx, fy) && Math.hypot(dx, dy) < 13 && Math.abs(dx) > 2 && Math.abs(dy) > 2) {
        tiles[idx(fx, fy)] = TILE.FARMLAND;
        deco[idx(fx, fy)] = 0;
        farmPlots.push({ x: fx, y: fy, growth: 50 + Math.random() * 50, cropType: dx > 0 ? '밀' : '약초' });
      }
    }
  }

  const wValley = settlementMap.windmill_valley;
  if (wValley) {
    addBuilding({ id: 'wv_mill', settlementId: 'windmill_valley', name: '윈드밀 수차 방앗간', type: 'windmill', x: wValley.x, y: wValley.y - 2, w: 4, h: 4, color: '#fef08a', roofColor: '#b45309', icon: '💨' });
  }

  const port = settlementMap.bluewave;
  addBuilding({ id: 'bw_shipyard', settlementId: 'bluewave', name: '제국 해군 조선소', type: 'shipyard', x: port.x - 4, y: port.y - 3, w: 5, h: 4, color: '#93c5fd', roofColor: '#1d4ed8', icon: '⚓' });
  addBuilding({ id: 'bw_market', settlementId: 'bluewave', name: '해상무역 어시장', type: 'market', x: port.x + 3, y: port.y + 3, w: 5, h: 3, color: '#fed7aa', roofColor: '#ea580c', icon: '🐟' });
  addBuilding({ id: 'bw_navy', settlementId: 'bluewave', name: '제국 해군 제독부', type: 'barracks', x: port.x + 3, y: port.y - 6, w: 4, h: 3, color: '#60a5fa', roofColor: '#1e3a8a', icon: '🚢' });

  const solhaven = settlementMap.solhaven;
  addBuilding({ id: 'sh_dock', settlementId: 'solhaven', name: '동부 상선 세관', type: 'shipyard', x: solhaven.x + 3, y: solhaven.y - 3, w: 5, h: 4, color: '#fde047', roofColor: '#b45309', icon: '⛵' });
  addBuilding({ id: 'sh_market', settlementId: 'solhaven', name: '동부 비전 상업소', type: 'market', x: solhaven.x - 4, y: solhaven.y + 2, w: 4, h: 3, color: '#fed7aa', roofColor: '#ea580c', icon: '💎' });

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

  const lakeTown = settlementMap.silverleaf;
  addBuilding({ id: 'sl_lodge', settlementId: 'silverleaf', name: '실버리프 호수 산장 & 교역소', type: 'market', x: lakeTown.x, y: lakeTown.y, w: 4, h: 3, color: '#34d399', roofColor: '#065f46', icon: '🌲' });

  // [서부 대륙 건물들]
  const elvenTown = settlementMap.elvenheim;
  addBuilding({ id: 'elv_tree', settlementId: 'elvenheim', name: '세계수 이그드라실 성소', type: 'palace', x: elvenTown.x, y: elvenTown.y - 3, w: 6, h: 5, color: '#2dd4bf', roofColor: '#0f766e', icon: '🌸' });
  addBuilding({ id: 'elv_spire', settlementId: 'elvenheim', name: '별빛 아카나 마법학탑', type: 'guild', x: elvenTown.x - 6, y: elvenTown.y + 2, w: 4, h: 4, color: '#c084fc', roofColor: '#6b21a8', icon: '🔮' });
  addBuilding({ id: 'elv_market', settlementId: 'elvenheim', name: '엘프 영약·보석 교역소', type: 'market', x: elvenTown.x + 6, y: elvenTown.y + 2, w: 4, h: 3, color: '#34d399', roofColor: '#065f46', icon: '💎' });

  const desertTown = settlementMap.mirage_oasis;
  addBuilding({ id: 'mir_palace', settlementId: 'mirage_oasis', name: '황금 술탄의 신기루 궁전', type: 'palace', x: desertTown.x, y: desertTown.y - 5, w: 6, h: 5, color: '#facc15', roofColor: '#b45309', icon: '🕌' });
  addBuilding({ id: 'mir_bazaar', settlementId: 'mirage_oasis', name: '미라주 대바자르', type: 'market', x: desertTown.x + 6, y: desertTown.y + 2, w: 5, h: 4, color: '#f97316', roofColor: '#9a3412', icon: '🌶️' });

  const sphinx = settlementMap.sphinx_pyramid;
  addBuilding({ id: 'sph_pyramid', settlementId: 'sphinx_pyramid', name: '고대 태양왕의 대피라미드', type: 'temple', x: sphinx.x, y: sphinx.y, w: 7, h: 6, color: '#eab308', roofColor: '#713f12', icon: '🏛️' });

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
  const obsidianKeep = settlementMap.obsidian_keep;
  addBuilding({ id: 'ok_keep', settlementId: 'obsidian_keep', name: '흑요석 용족 사령부', type: 'castle', x: obsidianKeep.x, y: obsidianKeep.y - 3, w: 6, h: 5, color: '#292524', roofColor: '#dc2626', icon: '🏰' });

  const volcano = settlementMap.volcano_isle;
  addBuilding({ id: 'vol_altar', settlementId: 'volcano_isle', name: '화염룡 발라카스 분화구 제단', type: 'lair', x: volcano.x, y: volcano.y + 3, w: 5, h: 4, color: '#dc2626', roofColor: '#450a0a', icon: '🌋' });

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

  // [해협 관문 & 성역 건물들]
  const beacon = settlementMap.lone_beacon;
  addBuilding({ id: 'lb_tower', settlementId: 'lone_beacon', name: '외로운 회전 등대', type: 'shipyard', x: beacon.x, y: beacon.y, w: 4, h: 5, color: '#fef08a', roofColor: '#1e3a8a', icon: '🗼' });

  const pirate = settlementMap.pirate_cove;
  addBuilding({ id: 'pir_fort', settlementId: 'pirate_cove', name: '블랙비어드 대해적 성채', type: 'lair', x: pirate.x, y: pirate.y, w: 5, h: 4, color: '#334155', roofColor: '#0f172a', icon: '🏴‍☠️' });

  const atlantis = settlementMap.atlantis_ruins;
  addBuilding({ id: 'atl_temple', settlementId: 'atlantis_ruins', name: '아틀란티스 해저 신전', type: 'temple', x: atlantis.x, y: atlantis.y, w: 6, h: 5, color: '#0284c7', roofColor: '#075985', icon: '🔱' });

  // 7. 5대 대륙 자원 노드 (채집 & 채광 & 발굴 280+ 개소)
  const resourceNodes = [];
  // (1) 중앙 대륙: 미스릴 & 황금 광맥 (32개소)
  for (let i = 0; i < 32; i++) {
    const rx = Math.round(480 + Math.cos(i * 1.5) * (12 + (i % 6) * 10));
    const ry = Math.round(215 + Math.sin(i * 1.5) * (10 + (i % 6) * 7));
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] !== TILE.DEEP_WATER && tiles[idx(rx, ry)] !== TILE.WATER) {
      resourceNodes.push({ id: 'res_mine_c_' + i, type: 'mine', x: rx, y: ry, name: i % 2 === 0 ? '⛏️ 미스릴 광맥' : '⛏️ 황금 광맥', resource: i % 2 === 0 ? 'ore' : 'gold', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (2) 중앙 대륙: 그랜드오크 벌목 참나무 (36개소)
  for (let i = 0; i < 36; i++) {
    const rx = Math.round(410 + Math.sin(i * 1.7) * 35);
    const ry = Math.round(250 + Math.cos(i * 1.3) * 30);
    if (inBounds(rx, ry) && (tiles[idx(rx, ry)] === TILE.FOREST || tiles[idx(rx, ry)] === TILE.MEADOW || tiles[idx(rx, ry)] === TILE.GRASS)) {
      resourceNodes.push({ id: 'res_tree_c_' + i, type: 'tree', x: rx, y: ry, name: '🌲 고대 참나무', resource: 'wood', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (3) 서부 신대륙: 세계수 영약초 (32개소)
  for (let i = 0; i < 32; i++) {
    const rx = Math.round(130 + Math.sin(i * 2.1) * 30);
    const ry = Math.round(200 + Math.cos(i * 1.9) * 30);
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] !== TILE.DEEP_WATER && tiles[idx(rx, ry)] !== TILE.WATER) {
      resourceNodes.push({ id: 'res_herb_w_' + i, type: 'herb', x: rx, y: ry, name: '🌿 세계수 영약초', resource: 'herbs', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (4) 서부 신대륙: 사막 황금 향신료 선인장 (28개소)
  for (let i = 0; i < 28; i++) {
    const rx = Math.round(130 + Math.sin(i * 1.8) * 35);
    const ry = Math.round(360 + Math.cos(i * 1.6) * 30);
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] === TILE.DESERT) {
      resourceNodes.push({ id: 'res_spice_w_' + i, type: 'spice', x: rx, y: ry, name: '🌶️ 황금 사막 향신료', resource: 'spices', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (5) 북부 노스펠름: 영구동토 빙정석 광맥 (24개소)
  for (let i = 0; i < 24; i++) {
    const rx = Math.round(480 + Math.cos(i * 1.9) * (14 + (i % 5) * 8));
    const ry = Math.round(60 + Math.sin(i * 1.9) * (8 + (i % 4) * 6));
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] !== TILE.DEEP_WATER && tiles[idx(rx, ry)] !== TILE.WATER) {
      resourceNodes.push({ id: 'res_frost_n_' + i, type: 'mine', x: rx, y: ry, name: '🧊 혹한의 빙정석', resource: 'ore', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (6) 남부 드라코니아: 흑요석 화산마정석 (26개소)
  for (let i = 0; i < 26; i++) {
    const rx = Math.round(480 + Math.sin(i * 1.6) * 35);
    const ry = Math.round(540 + Math.cos(i * 1.8) * 20);
    if (inBounds(rx, ry) && (tiles[idx(rx, ry)] === TILE.OBSIDIAN || tiles[idx(rx, ry)] === TILE.BADLANDS)) {
      resourceNodes.push({ id: 'res_obsid_s_' + i, type: 'mine', x: rx, y: ry, name: '🔥 흑요석 화산 마정석', resource: 'gems', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (7) 대해양 군도: 세이렌 산호초 흑진주 (28개소)
  for (let i = 0; i < 28; i++) {
    const rx = Math.round(240 + Math.cos(i * 1.4) * 25);
    const ry = Math.round(460 + Math.sin(i * 1.4) * 25);
    if (inBounds(rx, ry) && (tiles[idx(rx, ry)] === TILE.CORAL || tiles[idx(rx, ry)] === TILE.WATER)) {
      resourceNodes.push({ id: 'res_pearl_o_' + i, type: 'herb', x: rx, y: ry, name: '🦪 심해 흑진주 산호', resource: 'gems', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }
  // (8) 동부 신비 대륙: 비전 에테르 수정 (28개소)
  for (let i = 0; i < 28; i++) {
    const rx = Math.round(800 + Math.sin(i * 1.8) * 25);
    const ry = Math.round(300 + Math.cos(i * 1.6) * 22);
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] !== TILE.DEEP_WATER && tiles[idx(rx, ry)] !== TILE.WATER) {
      resourceNodes.push({ id: 'res_crys_e_' + i, type: 'mine', x: rx, y: ry, name: '💎 비전 에테르 수정', resource: 'gems', amount: 5, maxAmount: 5, respawn: 0 });
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
window.WORLD_HEIGHT = WORLD_HEIGHT;
window.WORLD_SIZE = WORLD_WIDTH;
window.TILE_SIZE = TILE_SIZE;
window.TILE = TILE;
window.TILE_INFO = TILE_INFO;
window.generateWorld = generateWorld;
