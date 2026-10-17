const fs = require('fs');

global.window = global;

require('./generated_world_gen.js');

const t0 = process.hrtime.bigint();
const world = generateWorld();
const ms = Number(process.hrtime.bigint() - t0) / 1e6;

console.log(`World generated in ${ms.toFixed(2)} ms`);
console.log(`Dimensions: ${world.width} x ${world.height}`);
console.log(`Settlements count: ${world.settlements.length}`);
console.log(`Buildings count: ${world.buildings.length}`);
console.log(`Resource nodes count: ${world.resourceNodes.length}`);
console.log(`Farm plots count: ${world.farmPlots.length}`);
console.log(`Fishing spots count: ${world.fishingSpots.length}`);

// Verify all settlements are on valid tiles
let errors = 0;
for (const s of world.settlements) {
  const t = world.getTile(s.x, s.y);
  const info = TILE_INFO[t];
  if (!info) {
    console.error(`Invalid tile at settlement ${s.id} (${s.x}, ${s.y})`);
    errors++;
  } else if (!info.walkable && t !== TILE.DOCK && t !== TILE.BRIDGE) {
    console.warn(`Settlement ${s.id} at (${s.x}, ${s.y}) is on non-walkable tile: ${info.name} (type: ${t})`);
  }
}

if (errors === 0) {
  console.log('ALL SETTLEMENTS VERIFIED CLEANLY!');
} else {
  console.error(`Found ${errors} settlement errors.`);
}
