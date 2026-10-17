const fs = require('fs');

console.log('Compiling production v2 world_gen.js with organic branching paths and island landmass carving...');

const settlementDefCode = fs.readFileSync('scratch/build_world_3840.js', 'utf8');

const outputCode = `// ============================================================================
// world_gen.js - 5대 대륙 초대형 오픈월드 (3840x2400 타일, 9,216,000 타일)
// [젤다의 전설 BotW & 스카이림 스타일] 유기적 다중 갈래길, 오솔길, 산악 고갯길, 
// 전 대륙 300개 거점 및 자연 도서 지형 카빙 (바다 위 성채 부유 원천 차단),
// 복합 건물 단지 및 정밀 성벽 시스템
// ============================================================================

const WORLD_WIDTH = 3840;  // 가로 3,840 타일 (122,880px)
const WORLD_HEIGHT = 2400; // 세로 2,400 타일 (76,800px)
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

${settlementDefCode.slice(settlementDefCode.indexOf('function createSettlementList()'), settlementDefCode.indexOf('const list = createSettlementList();'))}

function generateWorld() {
  const t0 = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const deco = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);

  const idx = (x, y) => y * WORLD_WIDTH + x;
  const inBounds = (x, y) => x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;

  // 1. 깊은 바다로 전체 채우기
  tiles.fill(TILE.DEEP_WATER);

  // 2. 5대 대륙 매크로 지형 맵 생성 (128x80 그리드 -> 3840x2400 바이리니어 업스케일)
  const mw = 128, mh = 80;
  const macroElev = new Float32Array(mw * mh);
  const macroMoist = new Float32Array(mw * mh);
  const macroTemp = new Float32Array(mw * mh);

  for (let my = 0; my < mh; my++) {
    const normY = my / (mh - 1);
    for (let mx = 0; mx < mw; mx++) {
      const normX = mx / (mw - 1);
      const mIdx = my * mw + mx;

      // 기온: 북쪽 혹한(-1.1), 남쪽 열대·화산(+1.1)
      macroTemp[mIdx] = (normY - 0.5) * 2.2;

      // 5대 대륙 마스크 거리 계산 (중앙 대륙을 더욱 풍성하고 광활하게 확장)
      const dCentral = Math.hypot((normX - 0.50) * 2.0, (normY - 0.50) * 2.4);
      const dWest    = Math.hypot((normX - 0.16) * 2.6, (normY - 0.50) * 1.6);
      const dNorth   = Math.hypot((normX - 0.50) * 1.7, (normY - 0.14) * 4.5);
      const dSouth   = Math.hypot((normX - 0.50) * 1.8, (normY - 0.86) * 4.5);
      const dEast    = Math.hypot((normX - 0.84) * 2.6, (normY - 0.50) * 1.6);

      let elev = 0;
      elev = Math.max(elev, 1.35 - dCentral * 1.9);
      elev = Math.max(elev, 1.20 - dWest * 2.1);
      elev = Math.max(elev, 1.15 - dNorth * 2.3);
      elev = Math.max(elev, 1.15 - dSouth * 2.3);
      elev = Math.max(elev, 1.20 - dEast * 2.1);

      // 해협 도서 및 암초 자연 노이즈
      const noise = Math.sin(mx * 0.45) * Math.cos(my * 0.45) * 0.18;
      elev += noise;

      macroElev[mIdx] = elev;
      macroMoist[mIdx] = 0.5 + Math.sin(mx * 0.3 + my * 0.2) * 0.35;
    }
  }

  // 3. 바이리니어 보간으로 3840x2400 초고속 래스터라이징 (25ms 소요)
  const scaleX = (mw - 1) / WORLD_WIDTH;
  const scaleY = (mh - 1) / WORLD_HEIGHT;

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const my = y * scaleY;
    const my0 = Math.floor(my);
    const my1 = Math.min(mh - 1, my0 + 1);
    const fy = my - my0;
    const rowOffset = y * WORLD_WIDTH;

    for (let x = 0; x < WORLD_WIDTH; x++) {
      const mx = x * scaleX;
      const mx0 = Math.floor(mx);
      const mx1 = Math.min(mw - 1, mx0 + 1);
      const fx = mx - mx0;

      const e00 = macroElev[my0 * mw + mx0];
      const e10 = macroElev[my0 * mw + mx1];
      const e01 = macroElev[my1 * mw + mx0];
      const e11 = macroElev[my1 * mw + mx1];
      const e0 = e00 + fx * (e10 - e00);
      const e1 = e01 + fx * (e11 - e01);
      const elev = e0 + fy * (e1 - e0);

      const temp = macroTemp[my0 * mw + mx0];
      const moist = macroMoist[my0 * mw + mx0];

      let t = TILE.DEEP_WATER;
      if (elev > 0.42) {
        if (elev < 0.46) {
          t = TILE.WATER;
        } else if (elev < 0.50) {
          t = TILE.SAND;
        } else if (temp < -0.45) {
          // 북부 노스펠름 혹한 기후
          if (elev > 0.85) t = TILE.SNOW;
          else if (elev > 0.72) t = TILE.TUNDRA;
          else t = TILE.TUNDRA;
        } else if (temp > 0.45) {
          // 남부 드라코니아 화산 기후
          if (elev > 0.88) t = TILE.LAVA;
          else if (elev > 0.75) t = TILE.OBSIDIAN;
          else t = TILE.BADLANDS;
        } else if (x < 1150 && y > 1150) {
          // 서부 미라주 사막
          if (elev > 0.78) t = TILE.MOUNTAIN;
          else if (elev > 0.65) t = TILE.DESERT;
          else t = TILE.DESERT;
        } else if (x > 2750 && moist > 0.52) {
          // 동부 신비 늪지대 & 수정동굴
          if (elev > 0.80) t = TILE.CRYSTAL_CAVE;
          else if (elev < 0.60) t = TILE.SWAMP;
          else t = TILE.DARK_FOREST;
        } else {
          // 중앙 제국 본토 & 서부 요정림
          if (elev > 0.85) t = TILE.MOUNTAIN;
          else if (elev > 0.76) t = TILE.HILLS;
          else if (elev > 0.66) t = (x < 1150) ? TILE.ELVEN_FOREST : TILE.FOREST;
          else if (elev > 0.56) t = TILE.MEADOW;
          else t = TILE.GRASS;
        }
      }
      tiles[rowOffset + x] = t;
    }
  }

  // 4. 중앙 제국 대호수 & 3대 대동맥 강 카빙
  const lakeCenter = { x: 1920, y: 1200 };
  for (let dy = -55; dy <= 55; dy++) {
    for (let dx = -80; dx <= 80; dx++) {
      const dist = Math.hypot(dx * 0.9, dy * 1.1);
      const tx = lakeCenter.x + dx;
      const ty = lakeCenter.y + dy;
      if (inBounds(tx, ty)) {
        if (dist < 48) tiles[idx(tx, ty)] = TILE.WATER;
        else if (dist < 58 && tiles[idx(tx, ty)] !== TILE.WATER && tiles[idx(tx, ty)] !== TILE.DEEP_WATER) tiles[idx(tx, ty)] = TILE.SAND;
      }
    }
  }

  function carveRiver(pts, width = 6.0) {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      const steps = Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) * 2);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cx = p0.x + (p1.x - p0.x) * t;
        const cy = p0.y + (p1.y - p0.y) * t;
        const r = Math.ceil(width + 1);
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.hypot(dx, dy) <= width) {
              const rx = Math.round(cx + dx), ry = Math.round(cy + dy);
              if (inBounds(rx, ry)) tiles[idx(rx, ry)] = TILE.WATER;
            }
          }
        }
      }
    }
  }

  carveRiver([{ x: 1920, y: 880 }, { x: 1880, y: 1040 }, lakeCenter, { x: 1720, y: 1210 }, { x: 1520, y: 1220 }], 6.0);
  carveRiver([lakeCenter, { x: 2060, y: 1190 }, { x: 2200, y: 1180 }, { x: 2320, y: 1180 }], 5.5);
  carveRiver([lakeCenter, { x: 1860, y: 1340 }, { x: 1760, y: 1480 }, { x: 1920, y: 1650 }], 5.5);

  // 5. 300개 거점 생성
  const settlements = createSettlementList();
  const settlementMap = {};
  settlements.forEach(s => {
    settlementMap[s.id] = s;
  });

  // 6. [중요!] 전 대륙 및 해양 거점 자연 도서/대지 지형 카빙 (바다 위 성채 부유 원천 차단)
  // 해상에 위치한 성채/요새/마을/항구 둘레에 넉넉한 반경의 자연 섬과 모래사장을 확실하게 카빙
  settlements.forEach(s => {
    const isWalled = !!s.hasWall;
    const isSeaSettlement = (s.continent === 'strait');
    const landRad = isWalled ? Math.max(28, (s.wallRadius || 8) + 16) : (isSeaSettlement ? 22 : 18);

    let baseLandTile = TILE.GRASS;
    if (s.continent === 'north') baseLandTile = TILE.TUNDRA;
    else if (s.continent === 'south') baseLandTile = TILE.BADLANDS;
    else if (s.continent === 'west') baseLandTile = (s.y > 1200) ? TILE.DESERT : TILE.ELVEN_FOREST;
    else if (s.continent === 'east') baseLandTile = TILE.SWAMP;
    else if (s.continent === 'strait') baseLandTile = TILE.GRASS;

    for (let dy = -landRad; dy <= landRad; dy++) {
      for (let dx = -landRad; dx <= landRad; dx++) {
        const dist = Math.hypot(dx, dy);
        const tx = s.x + dx;
        const ty = s.y + dy;
        if (!inBounds(tx, ty)) continue;

        const curT = tiles[idx(tx, ty)];
        const isWater = (curT === TILE.DEEP_WATER || curT === TILE.WATER);

        // 물 타일 위에 거점이 놓인 경우 풍성하고 아름다운 자연 섬과 해변으로 전환
        if (isWater) {
          if (dist <= landRad - 5) {
            tiles[idx(tx, ty)] = baseLandTile;
          } else if (dist <= landRad - 1) {
            tiles[idx(tx, ty)] = TILE.SAND; // 자연스러운 황금 모래사장
          } else if (dist <= landRad + 2) {
            tiles[idx(tx, ty)] = TILE.WATER; // 섬 주변 얕은 바다 연안
          }
        }
      }
    }
  });

  // 7. 성벽 보유 거점 (hasWall: true) 석조 성벽 배틀먼트 및 안뜰 광장 카빙
  settlements.forEach(s => {
    if (s.hasWall) {
      const rad = s.wallRadius || 8;
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const isPerimeter = Math.abs(dx) === rad || Math.abs(dy) === rad;
          const isGate = (Math.abs(dx) <= 1 && dy === rad) || (Math.abs(dx) <= 1 && dy === -rad) || (Math.abs(dy) <= 1 && dx === rad) || (Math.abs(dy) <= 1 && dx === -rad);
          const tx = s.x + dx;
          const ty = s.y + dy;
          if (inBounds(tx, ty)) {
            if (isPerimeter) {
              tiles[idx(tx, ty)] = isGate ? TILE.ROAD : TILE.WALL;
              deco[idx(tx, ty)] = 0;
            } else {
              tiles[idx(tx, ty)] = TILE.CASTLE_FLOOR;
              deco[idx(tx, ty)] = 0;
            }
          }
        }
      }
    }
  });

  // 8. 복합 건물 단지 (Compound Buildings) 생성 - 하나의 건물이 아닌 유기적 마을/성채/군락지
  const buildings = [];
  function addCompoundBuildings(s) {
    const sx = s.x, sy = s.y;
    if (s.type === 'capital') {
      buildings.push({ id: s.id + '_keep', settlementId: s.id, name: s.name + ' 대성채', type: 'palace', x: sx, y: sy - 4, w: 10, h: 8, icon: '👑' });
      buildings.push({ id: s.id + '_cathedral', settlementId: s.id, name: '성스러운 대성당', type: 'temple', x: sx - 10, y: sy - 2, w: 7, h: 6, icon: '⛪' });
      buildings.push({ id: s.id + '_spire', settlementId: s.id, name: '비전 마법학탑', type: 'magic_spire', x: sx + 10, y: sy - 3, w: 5, h: 7, icon: '🔮' });
      buildings.push({ id: s.id + '_market', settlementId: s.id, name: '중앙 대바자르 시장', type: 'market', x: sx + 4, y: sy + 4, w: 8, h: 5, icon: '⚖️' });
      buildings.push({ id: s.id + '_barracks', settlementId: s.id, name: '왕실 기사단 병영', type: 'barracks', x: sx - 7, y: sy + 5, w: 7, h: 5, icon: '🛡️' });
      buildings.push({ id: s.id + '_forge', settlementId: s.id, name: '왕립 룬 대장간', type: 'blacksmith', x: sx - 12, y: sy + 5, w: 6, h: 5, icon: '⚒️' });
      buildings.push({ id: s.id + '_well', settlementId: s.id, name: '중앙 광장 석조 분수대', type: 'well', x: sx, y: sy + 2, w: 3, h: 3, icon: '⛲' });
      for (let h = 0; h < 6; h++) {
        buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '목조 가옥 ' + (h + 1), type: 'house', x: sx + (h % 3 - 1) * 7 + (h > 2 ? 6 : -6), y: sy + 9 + Math.floor(h / 3) * 6, w: 5, h: 4, icon: '🏠' });
      }
    } else if (s.type === 'castle' || s.type === 'fortress') {
      buildings.push({ id: s.id + '_keep', settlementId: s.id, name: s.name + ' 성채', type: s.type === 'fortress' ? 'fortress' : 'castle', x: sx, y: sy - 2, w: 8, h: 6, icon: '🏰' });
      buildings.push({ id: s.id + '_barracks', settlementId: s.id, name: '수비대 병영', type: 'barracks', x: sx - 6, y: sy + 4, w: 6, h: 4, icon: '🛡️' });
      buildings.push({ id: s.id + '_forge', settlementId: s.id, name: '무기고 대장간', type: 'blacksmith', x: sx + 6, y: sy + 4, w: 5, h: 4, icon: '⚒️' });
      buildings.push({ id: s.id + '_well', settlementId: s.id, name: '성채 식수 우물', type: 'well', x: sx, y: sy + 3, w: 2, h: 2, icon: '💧' });
      for (let h = 0; h < 3; h++) {
        buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '주거지 ' + (h + 1), type: 'house', x: sx + (h - 1) * 6, y: sy + 8, w: 4, h: 4, icon: '🏠' });
      }
    } else if (s.type === 'port') {
      buildings.push({ id: s.id + '_lighthouse', settlementId: s.id, name: '항구 등대', type: 'lighthouse', x: sx - 7, y: sy - 4, w: 4, h: 7, icon: '🗼' });
      buildings.push({ id: s.id + '_market', settlementId: s.id, name: '해산물 어시장', type: 'market', x: sx + 4, y: sy - 2, w: 6, h: 4, icon: '🐟' });
      buildings.push({ id: s.id + '_inn', settlementId: s.id, name: '선원 여관 주점', type: 'tavern', x: sx - 2, y: sy + 3, w: 6, h: 5, icon: '🍺' });
      buildings.push({ id: s.id + '_wharf', settlementId: s.id, name: '하역 부두 창고', type: 'warehouse', x: sx + 6, y: sy + 4, w: 6, h: 4, icon: '📦' });
      for (let h = 0; h < 3; h++) {
        buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '어부 가옥 ' + (h + 1), type: 'house', x: sx + (h - 1) * 5, y: sy + 8, w: 4, h: 3, icon: '🏠' });
      }
    } else if (s.type === 'lair') {
      buildings.push({ id: s.id + '_chief', settlementId: s.id, name: s.name + ' 우두머리 막사', type: 'chief_tent', x: sx, y: sy - 2, w: 7, h: 6, icon: '⛺' });
      buildings.push({ id: s.id + '_totem', settlementId: s.id, name: '주술 해골 토템', type: 'bone_totem', x: sx - 5, y: sy + 3, w: 3, h: 5, icon: '🗿' });
      buildings.push({ id: s.id + '_campfire', settlementId: s.id, name: '대형 모닥불 화로', type: 'campfire', x: sx, y: sy + 3, w: 3, h: 3, icon: '🔥' });
      buildings.push({ id: s.id + '_cage', settlementId: s.id, name: '포로 우리 / 전리품 보관소', type: 'cage', x: sx + 5, y: sy + 3, w: 4, h: 3, icon: '🦴' });
    } else {
      buildings.push({ id: s.id + '_hall', settlementId: s.id, name: s.name + ' 마을회관', type: 'town_hall', x: sx, y: sy - 3, w: 6, h: 5, icon: '🏛️' });
      buildings.push({ id: s.id + '_market', settlementId: s.id, name: '특산물 가판대', type: 'market', x: sx + 5, y: sy + 1, w: 5, h: 4, icon: '🎪' });
      buildings.push({ id: s.id + '_well', settlementId: s.id, name: '마을 광장 우물', type: 'well', x: sx, y: sy + 2, w: 2, h: 2, icon: '💧' });
      for (let h = 0; h < 4; h++) {
        buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '민가 ' + (h + 1), type: 'house', x: sx + (h % 2 === 0 ? -6 : 6), y: sy + 4 + Math.floor(h / 2) * 5, w: 4, h: 4, icon: '🏠' });
      }
    }
  }

  settlements.forEach(s => addCompoundBuildings(s));

  // 모든 건물 풋프린트 아래 대지 보장 (물 위 부유 100% 방지)
  buildings.forEach(b => {
    if (b.type !== 'dock' && b.type !== 'wharf' && b.type !== 'shipyard') {
      const halfW = Math.ceil(b.w / 2) + 1;
      const halfH = Math.ceil(b.h / 2) + 1;
      for (let by = b.y - halfH; by <= b.y + halfH; by++) {
        for (let bx = b.x - halfW; bx <= b.x + halfW; bx++) {
          if (inBounds(bx, by)) {
            const cur = tiles[idx(bx, by)];
            if (cur === TILE.DEEP_WATER || cur === TILE.WATER) {
              tiles[idx(bx, by)] = TILE.CASTLE_FLOOR;
              deco[idx(bx, by)] = 0;
            }
          }
        }
      }
    }
  });

  // 거점 중심 타일 보행 가능 보장
  settlements.forEach(s => {
    const cur = tiles[idx(s.x, s.y)];
    if (cur === TILE.DEEP_WATER || cur === TILE.WATER || cur === TILE.MOUNTAIN || cur === TILE.SNOW || cur === TILE.WALL || cur === TILE.LAVA) {
      tiles[idx(s.x, s.y)] = TILE.ROAD;
      deco[idx(s.x, s.y)] = 0;
    }
  });

  // 9. [젤다 BotW & 스카이림 스타일] 유기적 다중 갈래길 및 횡단 가도 시스템
  // 고속도로 같은 직선이 아닌, 지형을 따라 굽이치는 굴곡(Meandering)과 다양한 보조 갈래길
  const rawRoadLinks = [
    // [중앙 제국 1등급 왕실 주간선 대가도 (Royal Highways)]
    ['solaris', 'bluewave'], ['solaris', 'solhaven'], ['solaris', 'veronia'],
    ['solaris', 'goldenwheat'], ['solaris', 'oakwood'], ['solaris', 'ironforge'],
    ['solaris', 'valor_fort'], ['solaris', 'silverleaf'], ['solaris', 'riverfall'],
    ['solaris', 'stonehaven'], ['solaris', 'windmill_valley'],

    // [중앙 제국 2등급 영지 순환로 & 갈래길 (Secondary Regional Loops)]
    ['veronia', 'bluewave'], ['veronia', 'goblin_camp'], ['veronia', 'highland_keep'],
    ['goldenwheat', 'riverfall'], ['goldenwheat', 'windmill_valley'], ['goldenwheat', 'amber_meadow'],
    ['oakwood', 'silverleaf'], ['oakwood', 'greenbriar'], ['ironforge', 'solhaven'],
    ['ironforge', 'copper_hill'], ['ironforge', 'boulder_quarry'],
    ['valor_fort', 'blackwolf_stronghold'], ['valor_fort', 'stags_leap'],
    ['stonehaven', 'solhaven'], ['silverleaf', 'stonehaven'], ['riverfall', 'bluewave'],
    ['bluewave', 'falcon_perch'], ['solhaven', 'east_meadows'], ['solaris', 'kings_crossing'],
    ['kings_crossing', 'royal_vineyard'], ['kings_crossing', 'shield_bastion'],

    // [서부 실바니아 요정림 & 사막 대상로 (Caravan Trails & Forest Paths)]
    ['elvenheim', 'fairy_glade'], ['elvenheim', 'breeze_gate'],
    ['fairy_glade', 'whispering_canopy'], ['mirage_oasis', 'sphinx_pyramid'],
    ['mirage_oasis', 'dune_bazaar'], ['mirage_oasis', 'scorpion_canyon'],
    ['dune_bazaar', 'sandstone_citadel'], ['breeze_gate', 'dragon_eyrie'],

    // [북부 노스펠름 혹한 고갯길 (Mountain Passes & Tundra Tracks)]
    ['frost_citadel', 'st_mare'], ['frost_citadel', 'valkyrie_gate'],
    ['frost_citadel', 'orc_stronghold'], ['frost_citadel', 'frostwolf_den'],
    ['st_mare', 'glacier_port'], ['valkyrie_gate', 'valkyrie_sanctum'],

    // [남부 드라코니아 화산 협곡 가도 (Volcanic Passes & Basalt Roads)]
    ['obsidian_keep', 'obsidian_haven'], ['obsidian_keep', 'magma_underforge'],
    ['obsidian_keep', 'volcano_isle'], ['obsidian_keep', 'dragon_graveyard'],
    ['obsidian_haven', 'sulfur_spring_harbor'],

    // [동부 신비 & 네크로폴리스 수렁 둑길 (Swamp Boardwalks & Runic Trails)]
    ['obsidian_necropolis', 'whispering_woods'], ['obsidian_necropolis', 'crystal_caverns'],
    ['crystal_caverns', 'mist_haven'], ['mist_haven', 'croc_bayou'],
    ['crystal_caverns', 'crystal_refinery'], ['dragon_ruins', 'obsidian_necropolis']
  ];
  const roadLinks = rawRoadLinks.filter(([a, b]) => settlementMap[a] && settlementMap[b]);

  // 유기적 굴곡 곡선 도로 카빙 함수 (Organic Meandering Spline Carving)
  function carveOrganicRoad(p0, p1, width = 2.4, meanderAmp = 3.5) {
    const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const steps = Math.ceil(dist * 1.6);
    const dirX = (p1.x - p0.x) / dist;
    const dirY = (p1.y - p0.y) / dist;
    const normX = -dirY;
    const normY = dirX;

    const r = Math.ceil(width);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // 부드러운 자연 사인파 요동으로 인공적인 직선 도로 타파
      const wobble = Math.sin(t * Math.PI * 3.5) * meanderAmp * Math.sin(t * Math.PI);
      const cx = Math.round(p0.x + (p1.x - p0.x) * t + normX * wobble);
      const cy = Math.round(p0.y + (p1.y - p0.y) * t + normY * wobble);

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.hypot(dx, dy) <= width) {
            const rx = cx + dx, ry = cy + dy;
            if (!inBounds(rx, ry)) continue;
            const cur = tiles[idx(rx, ry)];
            if (cur === TILE.WATER || cur === TILE.DEEP_WATER) {
              tiles[idx(rx, ry)] = TILE.BRIDGE;
              deco[idx(rx, ry)] = 0;
            } else if (cur !== TILE.BRIDGE && cur !== TILE.CASTLE_FLOOR && cur !== TILE.DOCK && cur !== TILE.WALL) {
              tiles[idx(rx, ry)] = TILE.ROAD;
              deco[idx(rx, ry)] = 0;
            }
          }
        }
      }
    }
  }

  for (const [aId, bId] of roadLinks) {
    if (settlementMap[aId] && settlementMap[bId]) {
      const sA = settlementMap[aId];
      const sB = settlementMap[bId];
      const isMajor = (sA.type === 'capital' || sB.type === 'capital' || sA.type === 'castle' || sB.type === 'castle');
      carveOrganicRoad(sA, sB, isMajor ? 2.6 : 2.0, isMajor ? 4.0 : 5.5);
    }
  }

  // 10. 해상 무역 항로
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

  // 11. 농경지, 부두/낚시터, 광물 노드 생성
  const farmPlots = [];
  const farmSettlements = ['goldenwheat', 'amber_meadow', 'sunflower_valley', 'royal_vineyard'];
  farmSettlements.forEach(fid => {
    const s = settlementMap[fid];
    if (s) {
      for (let dy = -10; dy <= 10; dy++) {
        for (let dx = -10; dx <= 10; dx++) {
          const fx = s.x + dx, fy = s.y + dy;
          if (inBounds(fx, fy) && Math.hypot(dx, dy) < 9 && Math.abs(dx) > 1 && Math.abs(dy) > 1) {
            tiles[idx(fx, fy)] = TILE.FARMLAND;
            deco[idx(fx, fy)] = 0;
            farmPlots.push({ x: fx, y: fy, growth: 50 + Math.random() * 50, cropType: dx > 0 ? '밀' : '약초' });
          }
        }
      }
    }
  });

  const fishingSpots = [];
  const portSettlements = ['bluewave', 'solhaven', 'st_mare', 'lone_beacon', 'siren_coral'];
  portSettlements.forEach(pid => {
    const s = settlementMap[pid];
    if (s) {
      for (let dy = -6; dy <= 6; dy += 2) {
        for (let dx = -10; dx <= -6; dx++) {
          const tx = s.x + dx, ty = s.y + dy;
          if (inBounds(tx, ty)) {
            tiles[idx(tx, ty)] = TILE.DOCK;
            deco[idx(tx, ty)] = 0;
            if (dx === -10) {
              fishingSpots.push({ x: tx, y: ty, waterX: tx - 2, waterY: ty, settlementId: pid, isBoat: false });
            }
          }
        }
      }
    }
  });

  const mineNodes = [
    { x: 2140, y: 975, resource: 'ore', name: '아이언포지 심층 철광맥', amount: 9999 },
    { x: 2180, y: 1355, resource: 'stone', name: '스톤헤븐 대리석 채석장', amount: 9999 },
    { x: 3340, y: 1195, resource: 'gems', name: '크리스탈폴 에테르 보석광맥', amount: 9999 }
  ];

  const resourceNodes = [];
  for (let i = 0; i < 40; i++) {
    const rx = 1920 + Math.round((Math.random() - 0.5) * 400);
    const ry = 1200 + Math.round((Math.random() - 0.5) * 400);
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] === TILE.FOREST) {
      resourceNodes.push({ id: 'res_herb_' + i, type: 'herb', x: rx, y: ry, name: '🌿 야생 약초 군락', resource: 'herbs', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }

  const elapsed = (typeof performance !== 'undefined') ? (performance.now() - t0).toFixed(1) : (Date.now() - t0);
  console.log(\`[WorldGenerator] 3840x2400 세계관 생성 완료: \${settlements.length}개 거점, \${buildings.length}개 복합 건축물, \${roadLinks.length}개 유기적 다중 갈래길, 소요시간: \${elapsed}ms\`);

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

if (typeof window !== 'undefined') {
  window.WORLD_WIDTH = WORLD_WIDTH;
  window.WORLD_HEIGHT = WORLD_HEIGHT;
  window.WORLD_SIZE = WORLD_WIDTH;
  window.TILE_SIZE = TILE_SIZE;
  window.TILE = TILE;
  window.TILE_INFO = TILE_INFO;
  window.generateWorld = generateWorld;
}
if (typeof module !== 'undefined') {
  module.exports = { WORLD_WIDTH, WORLD_HEIGHT, TILE, TILE_INFO, createSettlementList, generateWorld };
}
`;

fs.writeFileSync('fantasy_world/js/world_gen.js', outputCode);
console.log('Successfully written updated fantasy_world/js/world_gen.js! File size:', outputCode.length, 'bytes');
