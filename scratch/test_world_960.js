const fs = require('fs');

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 600;

console.log(`Testing world generation parameters: ${WORLD_WIDTH} x ${WORLD_HEIGHT}...`);
const totalTiles = WORLD_WIDTH * WORLD_HEIGHT;
console.log(`Total tiles: ${totalTiles.toLocaleString()}`);

const tiles = new Uint8Array(totalTiles);
const deco = new Uint8Array(totalTiles);

console.log('Allocated Uint8Array buffers successfully. Size: ' + (tiles.byteLength / 1024) + ' KB');
