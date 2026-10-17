const fs = require('fs');

console.log('Testing PixelBuildings.render and organic road generator...');

// Let's inspect the building types present in the world
const wg = require('../fantasy_world/js/world_gen.js');
const world = wg.generateWorld();

const buildingTypes = new Set();
world.buildings.forEach(b => buildingTypes.add(b.type));
console.log('All building types in world:', Array.from(buildingTypes));

