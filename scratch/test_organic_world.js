const fs = require('fs');

console.log('Testing organic road and island generator...');

// Load settlement generator
const settlementDefCode = fs.readFileSync('scratch/build_world_3840.js', 'utf8');
eval(settlementDefCode + '; global.createSettlementList = createSettlementList;');
const settlements = createSettlementList();

console.log('300 settlements defined.');

// Test island and landmass carving
const WORLD_WIDTH = 3840;
const WORLD_HEIGHT = 2400;
const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
const idx = (x, y) => y * WORLD_WIDTH + x;
const inBounds = (x, y) => x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;

tiles.fill(0); // All deep water

// Carve natural island/land around every settlement
settlements.forEach(s => {
  const isIsland = (s.continent === 'strait');
  const landRad = s.hasWall ? Math.max(26, (s.wallRadius || 8) + 14) : 22;

  let baseTile = 3; // GRASS
  if (s.continent === 'north') baseTile = 23; // TUNDRA
  else if (s.continent === 'south') baseTile = 10; // BADLANDS
  else if (s.continent === 'west') baseTile = (s.y > 1200) ? 17 : 18; // DESERT : ELVEN_FOREST
  else if (s.continent === 'east') baseTile = 22; // SWAMP

  for (let dy = -landRad; dy <= landRad; dy++) {
    for (let dx = -landRad; dx <= landRad; dx++) {
      const dist = Math.hypot(dx, dy);
      const tx = s.x + dx;
      const ty = s.y + dy;
      if (!inBounds(tx, ty)) continue;

      if (dist <= landRad - 4) {
        tiles[idx(tx, ty)] = baseTile;
      } else if (dist <= landRad - 1) {
        tiles[idx(tx, ty)] = 2; // SAND beach
      } else if (dist <= landRad) {
        tiles[idx(tx, ty)] = 1; // shallow WATER
      }
    }
  }
});

console.log('All settlements granted solid landmass and sandy beaches.');

// Test organic meandering road carver
function carveOrganicRoad(p0, p1, width = 2.4, meanderAmp = 3.5) {
  const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const steps = Math.ceil(dist * 1.5);
  const dirX = (p1.x - p0.x) / dist;
  const dirY = (p1.y - p0.y) / dist;
  const normX = -dirY;
  const normY = dirX;

  const r = Math.ceil(width);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const wobble = Math.sin(t * Math.PI * 4) * meanderAmp * Math.sin(t * Math.PI);
    const cx = Math.round(p0.x + (p1.x - p0.x) * t + normX * wobble);
    const cy = Math.round(p0.y + (p1.y - p0.y) * t + normY * wobble);

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.hypot(dx, dy) <= width) {
          const rx = cx + dx, ry = cy + dy;
          if (inBounds(rx, ry)) {
            const cur = tiles[idx(rx, ry)];
            if (cur === 0 || cur === 1) {
              tiles[idx(rx, ry)] = 13; // BRIDGE
            } else if (cur !== 14 && cur !== 16) {
              tiles[idx(rx, ry)] = 12; // ROAD
            }
          }
        }
      }
    }
  }
}

// Test carving multiple routes
carveOrganicRoad({ x: 1920, y: 1200 }, { x: 1740, y: 1020 }, 2.8, 4.0);
carveOrganicRoad({ x: 1920, y: 1200 }, { x: 1520, y: 1220 }, 2.8, 5.0);

console.log('Organic roads carved successfully.');
