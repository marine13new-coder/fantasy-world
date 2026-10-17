const fs = require('fs');

global.window = global;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// SpatialGrid class definition
class SpatialGrid {
  constructor(cellSize = 16) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(cx, cy) {
    return (cx << 16) ^ (cy & 0xffff);
  }

  insert(entity) {
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const k = this._key(cx, cy);
    let list = this.cells.get(k);
    if (!list) {
      list = [];
      this.cells.set(k, list);
    }
    list.push(entity);
  }

  query(x, y, radius, filterFn) {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    const results = [];
    const r2 = radius * radius;

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const list = this.cells.get(this._key(cx, cy));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const e = list[i];
            const dx = e.x - x;
            const dy = e.y - y;
            if (dx * dx + dy * dy <= r2) {
              if (!filterFn || filterFn(e)) {
                results.push(e);
              }
            }
          }
        }
      }
    }
    return results;
  }

  findNearest(x, y, radius, filterFn) {
    const nearby = this.query(x, y, radius, filterFn);
    let nearest = null;
    let minDist = radius;
    for (let i = 0; i < nearby.length; i++) {
      const e = nearby[i];
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    return nearest;
  }
}

// Benchmark 2,000 entities: SpatialGrid vs O(N) loop
console.log('=== BENCHMARK: 2,000 Entities Nearest Search ===');
const dummyEntities = [];
for (let i = 0; i < 2000; i++) {
  dummyEntities.push({
    id: i,
    x: Math.random() * 960,
    y: Math.random() * 600,
    hp: 100,
    faction: i % 2 === 0 ? 'kingdom' : 'monster'
  });
}

const grid = new SpatialGrid(16);
const t0 = process.hrtime.bigint();
grid.clear();
for (let i = 0; i < dummyEntities.length; i++) {
  grid.insert(dummyEntities[i]);
}
const insertTime = Number(process.hrtime.bigint() - t0) / 1e6;
console.log(`SpatialGrid insertion of 2,000 entities: ${insertTime.toFixed(3)} ms`);

// 500 entity queries
const tOld0 = process.hrtime.bigint();
let oldFound = 0;
for (let i = 0; i < 500; i++) {
  const e = dummyEntities[i];
  let nearest = null;
  let minDist = 14.0;
  for (let j = 0; j < dummyEntities.length; j++) {
    const other = dummyEntities[j];
    if (other === e || other.hp <= 0 || other.faction === e.faction) continue;
    const d = Math.hypot(other.x - e.x, other.y - e.y);
    if (d < minDist) {
      minDist = d;
      nearest = other;
    }
  }
  if (nearest) oldFound++;
}
const oldQueryTime = Number(process.hrtime.bigint() - tOld0) / 1e6;
console.log(`Old O(N) search (500 queries): ${oldQueryTime.toFixed(3)} ms (found: ${oldFound})`);

const tGrid0 = process.hrtime.bigint();
let gridFound = 0;
for (let i = 0; i < 500; i++) {
  const e = dummyEntities[i];
  const nearest = grid.findNearest(e.x, e.y, 14.0, other => other !== e && other.hp > 0 && other.faction !== e.faction);
  if (nearest) gridFound++;
}
const gridQueryTime = Number(process.hrtime.bigint() - tGrid0) / 1e6;
console.log(`SpatialGrid search (500 queries): ${gridQueryTime.toFixed(3)} ms (found: ${gridFound})`);
console.log(`SPEEDUP: ${(oldQueryTime / gridQueryTime).toFixed(1)}x FASTER!`);
