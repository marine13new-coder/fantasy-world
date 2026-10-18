// Mock minimal browser environment for world_gen.js
global.window = global;
global.performance = { now: () => Date.now() };

require('../fantasy_world/js/world_gen.js');

console.log('Testing generateWorld() v62...');
const t0 = Date.now();
const world = global.generateWorld();
const t1 = Date.now();

console.log(`[Success] World generated in ${t1 - t0}ms!`);
console.log(`- Settlements: ${world.settlements.length}`);
console.log(`- Buildings: ${world.buildings.length}`);
console.log(`- Props: ${world.props.length}`);

const shangrilaSettlements = world.settlements.filter(s => s.continent === 'shangrila');
console.log(`- Shangri-La Settlements: ${shangrilaSettlements.length}`);
shangrilaSettlements.forEach(s => {
  console.log(`  * [${s.id}] ${s.name} at (${s.x}, ${s.y})`);
});

// Check buildings
require('../fantasy_world/js/pixel_buildings.js');
console.log('PixelBuildings loaded successfully. Methods:', Object.keys(global.PixelBuildings).filter(k => k.includes('Shangrila') || k.includes('Lotus')));
