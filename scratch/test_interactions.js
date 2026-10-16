const fs = require('fs');

// Browser mock environment
global.window = global;
global.document = {
  getElementById: (id) => null,
  addEventListener: () => {},
  createElement: () => ({ getContext: () => ({ fillRect: ()=>{}, clearRect: ()=>{}, measureText: ()=>({ width: 20 }) }) })
};

// 1. Load world_gen, rpg_systems, entities
require('../fantasy_world/js/world_gen.js');
require('../fantasy_world/js/rpg_systems.js');
require('../fantasy_world/js/entities.js');

console.log('=== [1] World & Entity Initialization ===');
const world = global.generateWorld();
const logs = [];
const em = new global.EntityManager(world, (ev) => logs.push(ev));
em.spawnInitialPopulation();
em.spawnWildlifeEcosystem();
em.spawnDragonsAndLairs();
const player = em.spawnOrGetPlayer();
console.log(`- Entities active: ${em.entities.length}`);
console.log(`- Player initial gold: ${player.gold}, atk: ${player.atk}, hp: ${player.hp}`);

console.log('\n=== [2] Testing Hostility Matrix (isHostile) ===');
const civilian = em.entities.find(e => e.role === 'farmer');
const soldier = em.entities.find(e => e.role === 'soldier');
const goblin = em.entities.find(e => e.subClass === '고블린 정찰병' || (e.faction === 'monster' && e.homeId === 'goblin_camp'));
const undead = em.entities.find(e => e.homeId === 'obsidian_necropolis' || e.subClass === '사령술사' || e.subClass === '해골병사');
const wolf = em.entities.find(e => e.animalType === 'wolf' || e.isPredator);
const deer = em.entities.find(e => e.animalType === 'deer' || (e.role === 'animal' && !e.isPredator));

console.log(`- Player vs Goblin: ${em.isHostile(player, goblin)} (expected: true)`);
if (!em.isHostile(player, goblin)) throw new Error('Player should be hostile to goblin!');

console.log(`- Goblin vs Player: ${em.isHostile(goblin, player)} (expected: true)`);
if (!em.isHostile(goblin, player)) throw new Error('Goblin should be hostile to player!');

console.log(`- Soldier vs Goblin: ${em.isHostile(soldier, goblin)} (expected: true)`);
if (!em.isHostile(soldier, goblin)) throw new Error('Soldier should be hostile to goblin!');

console.log(`- Civilian vs Goblin (Civilian does NOT initiate): ${em.isHostile(civilian, goblin)} (expected: false)`);
if (em.isHostile(civilian, goblin)) throw new Error('Civilian should not initiate attack on goblin!');

console.log(`- Goblin vs Civilian (Monsters prey on civilians): ${em.isHostile(goblin, civilian)} (expected: true)`);
if (!em.isHostile(goblin, civilian)) throw new Error('Goblin should attack civilian!');

if (wolf && deer) {
  console.log(`- Wolf (Predator) vs Deer (Prey): ${em.isHostile(wolf, deer)} (expected: true)`);
  if (!em.isHostile(wolf, deer)) throw new Error('Predator should hunt prey!');
  console.log(`- Deer (Prey) vs Wolf: ${em.isHostile(deer, wolf)} (expected: false)`);
  if (em.isHostile(deer, wolf)) throw new Error('Prey should not attack predator!');
}

if (undead && goblin) {
  console.log(`- Undead vs Goblin rivalry: ${em.isHostile(undead, goblin)} (expected: true)`);
  if (!em.isHostile(undead, goblin)) throw new Error('Undead and goblin rival clans should be hostile!');
}

console.log('\n=== [3] Testing Player Combat Aggro & Pack Rally ===');
if (goblin) {
  goblin.x = player.x + 2;
  goblin.y = player.y;
  goblin.combatTarget = null;
  console.log(`- Before player attack, goblin combatTarget: ${goblin.combatTarget}`);
  em.playerPerformAttack(player, goblin);
  console.log(`- After player attack, goblin combatTarget: ${goblin.combatTarget ? goblin.combatTarget.name : null}`);
  if (goblin.combatTarget !== player) {
    throw new Error('Goblin MUST target player after being attacked!');
  }
}

console.log('\n=== [4] Testing Civic Defense SOS (Civilian -> Guards) ===');
if (civilian && goblin && soldier) {
  civilian.x = 100;
  civilian.y = 100;
  goblin.x = 101;
  goblin.y = 100;
  soldier.x = 105;
  soldier.y = 100;
  soldier.combatTarget = null;

  em.alertCivicDefense(civilian, goblin, 18.0);
  console.log(`- Guard combatTarget after civilian SOS: ${soldier.combatTarget ? soldier.combatTarget.name : null}`);
  if (soldier.combatTarget !== goblin) {
    throw new Error('Guard should rush to attack goblin when civilian alerts defense!');
  }
}

console.log('\n=== [5] Testing NPC Interactive Dialogue System ===');
const king = em.entities.find(e => e.role === 'king');
if (king) {
  const goldBefore = player.gold;
  em.interactWithNPC(player, king);
  console.log(`- King dialogue triggered. Gold before: ${goldBefore}, after: ${player.gold}`);
  if (player.gold <= goldBefore) throw new Error('King should reward player with gold!');
}

const priest = em.entities.find(e => e.subClass === '대사제' || e.subClass === '성기사');
if (priest) {
  player.hp = 10;
  em.interactWithNPC(player, priest);
  console.log(`- Priest dialogue triggered. Player HP restored to: ${player.hp} / ${player.maxHp}`);
  if (player.hp !== player.maxHp) throw new Error('Priest should heal player to full HP!');
}

const blacksmith = em.entities.find(e => e.role === 'blacksmith');
if (blacksmith) {
  const atkBefore = player.atk;
  em.interactWithNPC(player, blacksmith);
  console.log(`- Blacksmith dialogue triggered. Player ATK before: ${atkBefore}, after: ${player.atk}`);
  if (player.atk <= atkBefore) throw new Error('Blacksmith should increase player ATK!');
}

const adventurer = em.entities.find(e => e.role === 'adventurer');
if (adventurer) {
  em.interactWithNPC(player, adventurer);
  console.log(`- Adventurer dialogue triggered. Adventurer companion guardTargetId: ${adventurer.guardTargetId}`);
  if (adventurer.guardTargetId !== player.id) throw new Error('Adventurer should join player party as companion!');
}

console.log('\n=== [6] Testing NPC <-> NPC Social Greetings ===');
em.checkNPCSocialInteractions();
console.log('- NPC social interactions executed smoothly!');

console.log('\n=== [7] Running 100 Real-Time Simulation Ticks ===');
const input = { dx: 0, dy: 0 };
for (let t = 0; t < 100; t++) {
  em.update(0.016, { timeOfDay: 0.4, speed: 1.0 }, input);
}
console.log(`- 100 ticks complete! Active battles: ${em.activeBattles}`);
console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
