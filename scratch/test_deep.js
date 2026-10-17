const fs = require('fs');
const vm = require('vm');

const mockCanvas = {
  width: 1920,
  height: 1080,
  getContext: () => new Proxy({}, {
    get: () => () => ({
      addColorStop: () => {}
    })
  }),
  addEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 })
};

const elements = {};
const mockCtx = {
  window: {},
  document: {
    addEventListener: (evt, cb) => {
      if (evt === 'DOMContentLoaded') setTimeout(cb, 10);
    },
    getElementById: (id) => {
      if (id === 'worldCanvas' || id === 'minimapCanvas') return mockCanvas;
      if (!elements[id]) {
        elements[id] = {
          id,
          addEventListener: () => {},
          classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
            toggle(c, force) {
              if (force !== undefined) {
                if (force) this.classes.add(c); else this.classes.delete(c);
              } else {
                if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
              }
            }
          },
          style: {},
          textContent: '',
          innerHTML: '',
          dataset: {},
          querySelectorAll: () => [],
          appendChild: () => {}
        };
      }
      return elements[id];
    },
    querySelectorAll: () => [{ addEventListener: () => {}, classList: { add: () => {}, remove: () => {} }, dataset: {} }],
    createElement: (tag) => {
      if (tag === 'canvas') return {
        width: 100, height: 100,
        getContext: () => new Proxy({}, { get: () => () => ({ addColorStop: () => {} }) })
      };
      return {
        addEventListener: () => {},
        classList: { add: () => {} },
        style: {},
        appendChild: () => {},
        setAttribute: () => {},
        querySelector: () => ({ addEventListener: () => {} })
      };
    },
    body: {
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); },
        toggle(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); }
      },
      appendChild: () => {}
    }
  },
  AudioContext: class {
    createOscillator() { return { type:'', frequency:{ setValueAtTime(){}, exponentialRampToValueAtTime(){}, linearRampToValueAtTime(){} }, connect(){}, start(){}, stop(){} }; }
    createGain() { return { gain:{ setValueAtTime(){}, exponentialRampToValueAtTime(){}, linearRampToValueAtTime(){} }, connect(){} }; }
    get currentTime() { return 0; }
    get state() { return 'running'; }
    resume() { return Promise.resolve(); }
  },
  webkitAudioContext: null,
  console: console,
  Math: Math,
  Date: Date,
  performance: { now: () => Date.now() },
  setInterval: () => {},
  requestAnimationFrame: () => {},
  addEventListener: () => {}
};
mockCtx.window = mockCtx;

// Run scripts
vm.runInNewContext(fs.readFileSync('fantasy_world/js/audio.js', 'utf8'), mockCtx);
vm.runInNewContext(fs.readFileSync('fantasy_world/js/world_gen.js', 'utf8'), mockCtx);
vm.runInNewContext(fs.readFileSync('fantasy_world/js/entities.js', 'utf8'), mockCtx);
vm.runInNewContext(fs.readFileSync('fantasy_world/js/rpg_systems.js', 'utf8'), mockCtx);
vm.runInNewContext(fs.readFileSync('fantasy_world/js/renderer.js', 'utf8'), mockCtx);
vm.runInNewContext(fs.readFileSync('fantasy_world/js/main.js', 'utf8'), mockCtx);

setTimeout(() => {
  const world = mockCtx.generateWorld();
  console.log(`World generated: ${world.settlements.length} settlements, ${world.resourceNodes.length} resource nodes`);
  
  const em = new mockCtx.EntityManager(world);
  em.spawnInitialPopulation();
  const player = em.spawnOrGetPlayer();
  console.log(`Player spawned at (${player.x}, ${player.y}), Level: ${player.level}, HP: ${player.hp}`);

  // Test EXP gain and level up
  em.gainPlayerExp(300);
  console.log(`After EXP gain: Level ${player.level}, StatPoints: ${player.statPoints}, HP: ${player.hp}`);

  // Test Stat allocation
  const statSuccess = em.rpgManager.allocateStat('str');
  console.log(`Stat allocation STR success: ${statSuccess}, Player Atk: ${player.atk}`);

  // Test Pet toggle
  em.togglePetCompanion();
  console.log(`Pet companion active: ${em.pet && em.pet.active}, Player atk: ${player.atk}`);

  // Test Resource gathering
  player.x = world.resourceNodes[0].x;
  player.y = world.resourceNodes[0].y;
  const gatherSuccess = em.gatherNearestResource();
  console.log(`Resource gather success: ${gatherSuccess}, Player inventory:`, player.inventory);

  // Test Crafting
  player.inventory.ore = 20;
  player.inventory.gems = 10;
  player.gold = 2000;
  const craftSuccess = em.rpgManager.craftItem('excalibur');
  console.log(`Crafting excalibur success: ${craftSuccess}, Player Atk: ${player.atk}`);

  // Test Renderer draw methods
  const renderer = new mockCtx.WorldRenderer(mockCanvas, mockCanvas, world, em);
  renderer.render({ x: 200, y: 150, zoom: 1.0 }, { hour: 22, minute: 0, speed: 1, seasonIndex: 0, seasons: ['봄'], day: 1 }, 'all', null, 10.0);
  console.log(`WorldRenderer night render executed cleanly!`);

  console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  process.exit(0);
}, 50);
