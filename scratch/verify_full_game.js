const fs = require('fs');

// Browser mock environment
global.window = global;
global.document = {
  getElementById: (id) => null,
  addEventListener: () => {},
  createElement: () => ({ getContext: () => ({ fillRect: ()=>{}, clearRect: ()=>{}, measureText: ()=>({ width: 20 }) }) })
};

// 1. Load world_gen.js
require('../fantasy_world/js/world_gen.js');

console.log('[1/4] Testing world generation...');
const world = global.generateWorld();
console.log(`- World size: ${world.width} x ${world.height}`);
console.log(`- Settlements: ${world.settlements.length}`);
console.log(`- Buildings: ${world.buildings.length}`);
console.log(`- Resource nodes: ${world.resourceNodes.length}`);
console.log(`- Road links: ${world.roadLinks.length}`);
console.log(`- Sea routes: ${world.seaRoutes.length}`);

if (world.settlements.length !== 50) {
  throw new Error(`Expected 50 settlements, got ${world.settlements.length}`);
}

// 2. Load rpg_systems.js
require('../fantasy_world/js/rpg_systems.js');

// 3. Load entities.js
require('../fantasy_world/js/entities.js');

console.log('[2/4] Testing entity manager and spawning...');
const logs = [];
const em = new global.EntityManager(world, (ev) => logs.push(ev));

em.spawnInitialPopulation();
console.log(`- Entities after initial population: ${em.entities.length}`);

em.spawnWildlifeEcosystem();
console.log(`- Entities after wildlife ecosystem: ${em.entities.length}`);

em.spawnDragonsAndLairs();
console.log(`- Entities after dragons & lairs: ${em.entities.length}`);

const player = em.spawnOrGetPlayer();
console.log(`- Player created at (${player.x.toFixed(1)}, ${player.y.toFixed(1)})`);

// Verify player is on land
const pTile = world.getTile(Math.floor(player.x), Math.floor(player.y));
console.log(`- Player tile type: ${pTile} (Walkable: ${world.isWalkable(Math.floor(player.x), Math.floor(player.y))})`);
if (pTile === 0 || pTile === 1) {
  throw new Error('Player spawned in water!');
}

console.log('[3/4] Testing quest generation across 5 continents...');
for (let i = 0; i < 20; i++) {
  em.questSystem.generateNewQuest();
  const q = em.questSystem.activeQuest;
  if (!q) throw new Error('Quest generation failed');
  if (isNaN(q.targetX) || isNaN(q.targetY)) throw new Error(`NaN in quest coordinates: ${JSON.stringify(q)}`);
}
console.log('- 20 dynamic quests generated successfully with valid target coordinates!');

console.log('[4/4] Testing simulation tick update (60 frames)...');
const dummyInput = { up: false, down: false, left: false, right: false, attack: false, space: false };
for (let frame = 0; frame < 60; frame++) {
  em.update(0.016, { timeOfDay: 0.35, speed: 1.0 }, dummyInput);
}
console.log('- Simulation ran 60 frames flawlessly!');
console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
