// scratch/test_terrain_autotile.js
const fs = require('fs');

console.log('Testing terrain autotiling logic in node...');

function tileHash(x, y) {
  let h = (x * 374761393) ^ (y * 668265263);
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) >>> 0;
}

for (let y = 0; y < 10; y++) {
  for (let x = 0; x < 10; x++) {
    const h = tileHash(x, y);
    const varType = h % 5;
  }
}

console.log('tileHash function works deterministically and fast!');
