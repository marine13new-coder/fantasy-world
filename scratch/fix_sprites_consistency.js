// scratch/fix_sprites_consistency.js
const fs = require('fs');

const content = fs.readFileSync('fantasy_world/js/pixel_sprites.js', 'utf8');
const spritesMatch = content.match(/const RAW_SPRITES = \{([\s\S]*?)\n  \};/);
const RAW_SPRITES = eval('({' + spritesMatch[1] + '})');

// We need to ensure that every frame of a character has the EXACT same dimensions.
// Find target dimensions for each character base
const targetDims = {};
for (const [k, rows] of Object.entries(RAW_SPRITES)) {
  const base = k.replace(/(_down|_up|_side|_walk|_fly|_action|_attack|_0|_1).*$/, '');
  const w = rows[0].length;
  const h = rows.length;
  if (!targetDims[base]) targetDims[base] = { w, h, maxH: h };
  if (h > targetDims[base].maxH) {
    targetDims[base].maxH = h;
    targetDims[base].h = h;
  }
}

// For all sprites, if h < maxH:
// Pad appropriately so character feet remain grounded!
// In character sprites, the feet are at the bottom.
// If an attack sprite has only 12 rows while idle has 16 rows, the missing 4 rows are typically:
// - The legs/boots at the bottom (which were chopped off!)
// So we must copy the legs/boots from the idle frame (_0) or pad top/bottom appropriately!

let fixedCount = 0;
for (const [k, rows] of Object.entries(RAW_SPRITES)) {
  const base = k.replace(/(_down|_up|_side|_walk|_fly|_action|_attack|_0|_1).*$/, '');
  const target = targetDims[base];
  const curH = rows.length;
  const curW = rows[0].length;

  if (curH < target.maxH) {
    const diff = target.maxH - curH;
    const idleKey = `${base}_down_0`;
    const idleRows = RAW_SPRITES[idleKey] || RAW_SPRITES[Object.keys(RAW_SPRITES).find(name => name.startsWith(base))];

    // Most attack frames kept the head and torso, but cut off the legs!
    // Take the bottom 'diff' rows from idleRows (the boots/legs) and append them!
    const newRows = [...rows];
    if (idleRows && idleRows.length === target.maxH) {
      for (let i = target.maxH - diff; i < target.maxH; i++) {
        newRows.push(idleRows[i]);
      }
    } else {
      // Pad with '.'
      for (let i = 0; i < diff; i++) {
        newRows.push('.'.repeat(curW));
      }
    }

    RAW_SPRITES[k] = newRows;
    fixedCount++;
  }
}

console.log(`Padded and normalized ${fixedCount} sprites to uniform dimensions!`);

// Verify all are now uniform
const verifyDims = {};
for (const [k, rows] of Object.entries(RAW_SPRITES)) {
  const base = k.replace(/(_down|_up|_side|_walk|_fly|_action|_attack|_0|_1).*$/, '');
  if (!verifyDims[base]) verifyDims[base] = new Set();
  verifyDims[base].add(rows[0].length + 'x' + rows.length);
}

let mismatches = 0;
for (const [base, set] of Object.entries(verifyDims)) {
  if (set.size > 1) {
    console.error(`Still mismatched: ${base}`, Array.from(set));
    mismatches++;
  }
}

if (mismatches === 0) {
  console.log('PERFECT! 100% of all characters now have identical, zero-pop dimensions across all frames!');
}
