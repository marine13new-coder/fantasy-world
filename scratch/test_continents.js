const fs = require('fs');

// We simulate the new continent elevation function
function simulateContinents() {
  const WORLD_WIDTH = 480;
  const WORLD_HEIGHT = 320;

  class SeededRNG {
    constructor(seed = 20261016) {
      this.s = seed % 2147483647;
      if (this.s <= 0) this.s += 2147483646;
    }
    next() {
      this.s = (this.s * 16807) % 2147483647;
      return (this.s - 1) / 2147483646;
    }
  }

  function createNoise2D(seed = 1337) {
    const rng = new SeededRNG(seed);
    const perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }
    for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + t * (b - a); }
    function val(ix, iy) {
      const h = perm[(perm[ix & 255] + (iy & 255)) & 255];
      return h / 255;
    }
    return function noise(x, y) {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;
      const u = fade(xf);
      const v = fade(yf);
      const aa = val(xi, yi);
      const ba = val(xi + 1, yi);
      const ab = val(xi, yi + 1);
      const bb = val(xi + 1, yi + 1);
      return lerp(lerp(aa, ba, u), lerp(ab, bb, u), v);
    };
  }

  function fbm(noiseFn, x, y, octaves = 4) {
    let total = 0, amp = 0.5, freq = 1, maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      total += noiseFn(x * freq, y * freq) * amp;
      maxVal += amp;
      amp *= 0.5;
      freq *= 2.05;
    }
    return total / maxVal;
  }

  const elevNoise = createNoise2D(10101);
  const moistNoise = createNoise2D(20202);

  let landCount = 0;
  let waterCount = 0;
  let deepWaterCount = 0;

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const nx = x / WORLD_WIDTH;
      const ny = y / WORLD_HEIGHT;
      const nVal = fbm(elevNoise, nx * 7.5, ny * 5.2, 4);

      // 5 Continents Normalized Distances
      // 1. Central
      const dCentral = Math.hypot((x - 240) / 60, (y - 160) / 48);
      // 2. West
      const dWest = Math.hypot((x - 82) / 58, (y - 160) / 106);
      // 3. North
      const dNorth = Math.hypot((x - 240) / 108, (y - 44) / 28);
      // 4. South
      const dSouth = Math.hypot((x - 240) / 108, (y - 276) / 28);
      // 5. East
      const dEast = Math.hypot((x - 398) / 58, (y - 160) / 106);

      // Stepping Isles in the Straits
      const dBeacon = Math.hypot(x - 162, (y - 145) * 1.1);
      const dPirate = Math.hypot(x - 158, (y - 185) * 1.1);
      const dAtlantis = Math.hypot(x - 240, (y - 228) * 1.1);

      let maxLandE = -1;
      let cont = null;

      if (dCentral < 1.0) {
        const e = (1 - dCentral) * 0.72 + nVal * 0.36;
        if (e > maxLandE) { maxLandE = e; cont = 'central'; }
      }
      if (dWest < 1.0) {
        const e = (1 - dWest) * 0.74 + nVal * 0.36;
        if (e > maxLandE) { maxLandE = e; cont = 'west'; }
      }
      if (dNorth < 1.0) {
        const e = (1 - dNorth) * 0.76 + nVal * 0.35;
        if (e > maxLandE) { maxLandE = e; cont = 'north'; }
      }
      if (dSouth < 1.0) {
        const e = (1 - dSouth) * 0.76 + nVal * 0.35;
        if (e > maxLandE) { maxLandE = e; cont = 'south'; }
      }
      if (dEast < 1.0) {
        const e = (1 - dEast) * 0.74 + nVal * 0.36;
        if (e > maxLandE) { maxLandE = e; cont = 'east'; }
      }

      if (dBeacon < 10) {
        const e = (1 - dBeacon / 10) * 0.65 + nVal * 0.35;
        if (e > maxLandE) { maxLandE = e; cont = 'beacon'; }
      }
      if (dPirate < 12) {
        const e = (1 - dPirate / 12) * 0.65 + nVal * 0.35;
        if (e > maxLandE) { maxLandE = e; cont = 'pirate'; }
      }

      if (maxLandE > 0.31) {
        landCount++;
      } else if (maxLandE > 0.22) {
        waterCount++;
      } else {
        deepWaterCount++;
      }
    }
  }

  const total = WORLD_WIDTH * WORLD_HEIGHT;
  console.log(`Total tiles: ${total}`);
  console.log(`Land: ${landCount} (${Math.round(landCount/total*100)}%)`);
  console.log(`Shallow Water & Straits: ${waterCount} (${Math.round(waterCount/total*100)}%)`);
  console.log(`Deep Ocean: ${deepWaterCount} (${Math.round(deepWaterCount/total*100)}%)`);
}

simulateContinents();
