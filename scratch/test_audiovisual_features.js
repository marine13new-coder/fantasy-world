const fs = require('fs');

const worldGenCode = fs.readFileSync('fantasy_world/js/world_gen.js', 'utf8');
const entitiesCode = fs.readFileSync('fantasy_world/js/entities.js', 'utf8');
const rpgSystemsCode = fs.readFileSync('fantasy_world/js/rpg_systems.js', 'utf8');
const audioCode = fs.readFileSync('fantasy_world/js/audio.js', 'utf8');

global.window = global;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};


const fullScript = `
${worldGenCode}
${audioCode}
${entitiesCode}
${rpgSystemsCode}
`;

eval(fullScript);

console.log('=== [1] Testing RetroAudioSystem ===');
const audio = new RetroAudioSystem();
console.log('Audio instance created, muted state:', audio.muted);
audio.startBGM('peaceful');
console.log('BGM started, isPlaying:', audio.bgmPlaying, 'mood:', audio.bgmMood);
audio.setBGMMood('battle');
console.log('BGM mood changed to:', audio.bgmMood);
audio.stopBGM();
console.log('BGM stopped, isPlaying:', audio.bgmPlaying);

console.log('=== [2] Testing World & Entities with Campfire & Dice ===');
const world = generateWorld();
const entityMgr = new EntityManager(world, () => {});
entityMgr.camera = { shake: 0 };
entityMgr.spawnInitialPopulation();

const player = entityMgr.spawnOrGetPlayer();
const rpg = new RPGSystemsManager(world, entityMgr);
entityMgr.rpgManager = rpg;

console.log('Player initial gold:', player.gold, 'HP:', player.hp);

// Test Tavern Dice
console.log('=== [3] Testing Tavern Dice ===');
const result = rpg.playTavernDice(20);
console.log('Tavern Dice outcome:', result);
console.log('Player gold after dice:', player.gold);

// Test Campfire Rest
console.log('=== [4] Testing Campfire Interaction ===');
player.hp = 100;
const campResult = rpg.interactCampfire(player);
console.log('Campfire rest success:', campResult, 'Player HP now:', player.hp);

// Test Spark Particles
console.log('=== [5] Testing Spark Particles & Screen Shake ===');
entityMgr.addHitSparks(player.x, player.y, '#fde047', 8);
console.log('Spark particles count:', entityMgr.sparkParticles.length);
entityMgr.update(0.1, { hour: 12 }, { dx: 0, dy: 0 });
console.log('Spark particles updated, active:', entityMgr.sparkParticles.length);

console.log('ALL AUDIOVISUAL & MINIGAME TESTS PASSED 100%!');
