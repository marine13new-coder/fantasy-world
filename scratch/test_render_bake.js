// scratch/test_render_bake.js
const fs = require('fs');

const code = fs.readFileSync('fantasy_world/js/renderer.js', 'utf8');

// Quick check of TILE constants
const worldGenCode = fs.readFileSync('fantasy_world/js/world_gen.js', 'utf8');
const tileMatch = worldGenCode.match(/const TILE = \{([\s\S]*?)\n  \};/);
const TILE = eval('({' + tileMatch[1] + '})');

console.log('TILE constants loaded successfully:', Object.keys(TILE).length);
