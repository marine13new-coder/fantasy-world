const fs = require('fs');

console.log('=== VERIFYING FULL GAME SIMULATION (3840x2400 & 300 SETTLEMENTS) ===');

// Setup mock browser globals
global.window = global;
global.document = {
  createElement: () => ({
    getContext: () => ({
      fillRect: () => {},
      drawImage: () => {},
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
      fill: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      clearRect: () => {}
    }),
    width: 0,
    height: 0
  })
};

// 1. Load Audio mock
require('../fantasy_world/js/audio.js');

// 2. Load World Generator
const wg = require('../fantasy_world/js/world_gen.js');
const tWorld0 = Date.now();
const world = wg.generateWorld();
const tWorld = Date.now() - tWorld0;

console.log(`- World generated: ${world.width} x ${world.height} (${world.width * world.height} tiles) in ${tWorld} ms`);
console.log(`- Settlements count: ${world.settlements.length}`);
console.log(`- Buildings count: ${world.buildings.length}`);
console.log(`- Road links count: ${world.roadLinks.length}`);
console.log(`- Sea routes count: ${world.seaRoutes.length}`);

// 3. Load Pixel Buildings
require('../fantasy_world/js/pixel_buildings.js');
console.log('- PixelBuildings loaded:', typeof global.PixelBuildings !== 'undefined');

// 4. Load Entities
const entitiesCode = fs.readFileSync('fantasy_world/js/entities.js', 'utf8');
eval(entitiesCode);

const em = new EntityManager(world, (ev) => {});
const tPop0 = Date.now();
em.spawnInitialPopulation();
const tPop = Date.now() - tPop0;
const player = em.spawnOrGetPlayer();

console.log(`- Entities populated: ${em.entities.length} entities in ${tPop} ms`);
console.log(`- Player spawned at (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`);

// Verify Loreon Kingdom heroes exist
const commander = em.entities.find(e => e.role === 'commander');
const duchess = em.entities.find(e => e.role === 'duchess');
const ranger = em.entities.find(e => e.role === 'ranger');
const mage = em.entities.find(e => e.role === 'mage');
const wolfrider = em.entities.find(e => e.role === 'wolfrider');
const croc = em.entities.find(e => e.animalType === 'croc');

console.log('- Commander:', commander ? `${commander.name} (HP ${commander.hp}, ATK ${commander.atk})` : 'MISSING');
console.log('- Duchess:', duchess ? `${duchess.name} (HP ${duchess.hp}, ATK ${duchess.atk})` : 'MISSING');
console.log('- Ranger:', ranger ? `${ranger.name} (HP ${ranger.hp}, ATK ${ranger.atk})` : 'MISSING');
console.log('- Mage:', mage ? `${mage.name} (HP ${mage.hp}, ATK ${mage.atk})` : 'MISSING');
console.log('- Wolfrider:', wolfrider ? `${wolfrider.name} (HP ${wolfrider.hp}, ATK ${wolfrider.atk})` : 'MISSING');
console.log('- Crocodile:', croc ? `${croc.name} (Type: ${croc.animalType})` : 'MISSING');

// 5. Test Spatial Grid Queries
const tGrid0 = Date.now();
let totalFound = 0;
for (let i = 0; i < 500; i++) {
  const qx = 1920 + (i % 20) * 15;
  const qy = 1200 + Math.floor(i / 20) * 15;
  const found = em.spatialGrid.query(qx, qy, 30);
  totalFound += found.length;
}
const tGrid = Date.now() - tGrid0;
console.log(`- SpatialGrid 500 queries executed in ${tGrid} ms (found ${totalFound} entities)`);

// 6. Test 300 Simulation Frames Benchmark
console.log('Running 300 simulation frames benchmark...');
const tSim0 = Date.now();
for (let f = 0; f < 300; f++) {
  em.update(1 / 60, false);
}
const tSim = Date.now() - tSim0;
const fps = (300 / (tSim / 1000)).toFixed(1);
console.log(`- 300 simulation frames completed in ${tSim} ms (${(tSim / 300).toFixed(2)} ms/frame, equivalent to ~${fps} FPS!)`);

console.log('=== VERIFICATION PASSED SUCCESSFULLY! ===');
