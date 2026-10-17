const fs = require('fs');

console.log('Testing complete 3840x2400 world generator with 300 settlements...');

const WORLD_WIDTH = 3840;
const WORLD_HEIGHT = 2400;

// Read settlement generator
const baseCode = fs.readFileSync('scratch/build_world_3840.js', 'utf8');
eval(baseCode + '; global.createSettlementList = createSettlementList;');
const settlements = createSettlementList();

console.log('300 settlements defined.');

// Test generation logic
const t0 = Date.now();
const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
const deco = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);

function idx(x, y) {
  return y * WORLD_WIDTH + x;
}
function inBounds(x, y) {
  return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}

// 1. Fill deep water
tiles.fill(0);

// 2. Continents macro elevation
const mw = 128, mh = 80;
const macroElev = new Float32Array(mw * mh);
const macroMoist = new Float32Array(mw * mh);
const macroTemp = new Float32Array(mw * mh);

for (let my = 0; my < mh; my++) {
  const normY = my / (mh - 1);
  for (let mx = 0; mx < mw; mx++) {
    const normX = mx / (mw - 1);
    const mIdx = my * mw + mx;

    // Temperature: north is cold (-1), south is hot (+1)
    macroTemp[mIdx] = (normY - 0.5) * 2.2;

    // Continent distance masks
    // A. Central: (0.50, 0.50)
    const dCentral = Math.hypot((normX - 0.50) * 2.4, (normY - 0.50) * 2.8);
    // B. West: (0.15, 0.50)
    const dWest = Math.hypot((normX - 0.15) * 2.8, (normY - 0.50) * 1.5);
    // C. North: (0.50, 0.12)
    const dNorth = Math.hypot((normX - 0.50) * 1.6, (normY - 0.12) * 5.0);
    // D. South: (0.50, 0.88)
    const dSouth = Math.hypot((normX - 0.50) * 1.7, (normY - 0.88) * 5.0);
    // E. East: (0.85, 0.50)
    const dEast = Math.hypot((normX - 0.85) * 2.8, (normY - 0.50) * 1.6);

    let elev = 0;
    elev = Math.max(elev, 1.25 - dCentral * 2.2);
    elev = Math.max(elev, 1.15 - dWest * 2.4);
    elev = Math.max(elev, 1.10 - dNorth * 2.6);
    elev = Math.max(elev, 1.10 - dSouth * 2.6);
    elev = Math.max(elev, 1.15 - dEast * 2.4);

    // Micro island noise in straits
    const noise = Math.sin(mx * 0.45) * Math.cos(my * 0.45) * 0.18;
    elev += noise;

    macroElev[mIdx] = elev;
    macroMoist[mIdx] = 0.5 + Math.sin(mx * 0.3 + my * 0.2) * 0.35;
  }
}

// Bilinear upscale to full 3840x2400
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

    let t = 0; // deep water
    if (elev > 0.45) {
      if (elev < 0.48) {
        t = 1; // shallow water
      } else if (elev < 0.52) {
        t = 2; // sand/beach
      } else if (temp < -0.45) { // North
        if (elev > 0.85) t = 9; // glacier
        else if (elev > 0.72) t = 6; // snow
        else t = 6; // snow
      } else if (temp > 0.45) { // South
        if (elev > 0.88) t = 19; // lava
        else if (elev > 0.75) t = 10; // volcanic
        else t = 18; // basalt
      } else if (x < 1100 && y > 1200) { // West Desert
        if (elev > 0.75) t = 5; // mountain
        else if (elev > 0.65) t = 16; // dunes
        else t = 8; // desert
      } else if (x > 2800 && moist > 0.55) { // East Swamp
        if (elev > 0.78) t = 5;
        else if (elev < 0.58) t = 7; // swamp
        else t = 4; // forest
      } else { // Central & West Forest
        if (elev > 0.82) t = 5; // mountain
        else if (elev > 0.68) t = 4; // forest
        else t = 3; // grass
      }
    }
    tiles[rowOffset + x] = t;
  }
}

console.log('Base terrain rasterized in', Date.now() - t0, 'ms');

// Carve Central Lake and 3 Great Rivers
const lakeCenter = { x: 1920, y: 1200 };
for (let dy = -55; dy <= 55; dy++) {
  for (let dx = -80; dx <= 80; dx++) {
    const dist = Math.hypot(dx * 0.9, dy * 1.1);
    const tx = lakeCenter.x + dx;
    const ty = lakeCenter.y + dy;
    if (inBounds(tx, ty)) {
      if (dist < 48) tiles[idx(tx, ty)] = 1; // water
      else if (dist < 58 && tiles[idx(tx, ty)] !== 1 && tiles[idx(tx, ty)] !== 0) tiles[idx(tx, ty)] = 2; // sand
    }
  }
}

// Carve Rivers
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
            if (inBounds(rx, ry)) tiles[idx(rx, ry)] = 1;
          }
        }
      }
    }
  }
}

carveRiver([{ x: 1920, y: 880 }, { x: 1880, y: 1040 }, lakeCenter, { x: 1720, y: 1210 }, { x: 1520, y: 1220 }], 6.0);
carveRiver([lakeCenter, { x: 2060, y: 1190 }, { x: 2200, y: 1180 }, { x: 2320, y: 1180 }], 5.5);
carveRiver([lakeCenter, { x: 1860, y: 1340 }, { x: 1760, y: 1480 }, { x: 1920, y: 1650 }], 5.5);

// Carve Stone Walls and Courtyards around settlements with hasWall: true
let wallCount = 0;
settlements.forEach(s => {
  if (s.hasWall) {
    wallCount++;
    const rad = s.wallRadius || 8;
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const isPerimeter = Math.abs(dx) === rad || Math.abs(dy) === rad;
        const isGate = (Math.abs(dx) <= 1 && dy === rad) || (Math.abs(dx) <= 1 && dy === -rad) || (Math.abs(dy) <= 1 && dx === rad) || (Math.abs(dy) <= 1 && dx === -rad);
        const tx = s.x + dx;
        const ty = s.y + dy;
        if (inBounds(tx, ty)) {
          if (isPerimeter) {
            tiles[idx(tx, ty)] = isGate ? 12 : 17; // 12: ROAD, 17: WALL
          } else {
            tiles[idx(tx, ty)] = 14; // CASTLE_FLOOR
          }
        }
      }
    }
  }
});

// Compound buildings generation
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
      buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '목조 가옥 ' + (h + 1), type: 'house', x: sx + (h%3 - 1)*7 + (h>2?6:-6), y: sy + 9 + Math.floor(h/3)*6, w: 5, h: 4, icon: '🏠' });
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

// Ensure settlement anchor tiles are walkable
settlements.forEach(s => {
  const currentTile = tiles[idx(s.x, s.y)];
  if (currentTile === 0 || currentTile === 1 || currentTile === 5 || currentTile === 9 || currentTile === 17 || currentTile === 19) {
    tiles[idx(s.x, s.y)] = 12; // ROAD
  }
});

const totalElapsed = Date.now() - t0;
console.log('=== 3840x2400 WORLD GENERATION COMPLETE ===');
console.log(`- Dimensions: ${WORLD_WIDTH} x ${WORLD_HEIGHT} (${WORLD_WIDTH * WORLD_HEIGHT} tiles)`);
console.log(`- Total Settlements: ${settlements.length}`);
console.log(`- Total Walled Citadels/Castles: ${wallCount}`);
console.log(`- Total Compound Buildings & Props: ${buildings.length}`);
console.log(`- Total Generation Time: ${totalElapsed} ms!`);
