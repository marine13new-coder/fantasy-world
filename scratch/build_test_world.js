const fs = require('fs');

global.window = global;

const worldGenSrc = fs.readFileSync('fantasy_world/js/world_gen.js', 'utf8');

console.log('Original world_gen.js lines:', worldGenSrc.split('\n').length);
