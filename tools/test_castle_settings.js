const assert = require('node:assert/strict');
const s = require('../site/castle-siege/settings.js');
for (const preset of Object.values(s.presets)) {
  const c = s.resolve(preset);
  assert.ok(s.estimated(c.half, c.rows, c.brick) <= 5000);
  assert.ok(c.brick <= 1.2, 'Preset blocks stay finer than the old 1.45-unit stones');
}
const custom = s.resolve({half:99, rows:99, brick:.1});
assert.equal(custom.half, 14);
assert.equal(custom.rows, 20);
assert.ok(custom.limited);
assert.ok(s.estimated(custom.half, custom.rows, custom.brick) <= 5000);
console.log('Castle settings OK');
