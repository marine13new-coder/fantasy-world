const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('fantasy_world/js/pixel_sprites.js', 'utf8');
const sandbox = {
  window: {},
  document: {
    createElement: () => ({
      getContext: () => ({
        fillRect: () => {},
        drawImage: () => {}
      })
    })
  }
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const atlas = sandbox.window.PixelSprites;

const testCases = [
  { e: { role: 'animal', animalType: 'croc', name: '늪지대 맹독악어' }, expected: 'croc' },
  { e: { role: 'animal', animalType: 'rabbit', name: '들토끼' }, expected: 'rabbit' },
  { e: { role: 'animal', animalType: 'cow', name: '젖소' }, expected: 'cow' },
  { e: { role: 'animal', animalType: 'sheep', name: '목초지 양' }, expected: 'sheep' },
  { e: { role: 'animal', animalType: 'goat', name: '바위 산양' }, expected: 'goat' },
  { e: { role: 'animal', animalType: 'dolphin', name: '대양 돌고래' }, expected: 'dolphin' },
  { e: { role: 'animal', animalType: 'salamander', name: '흑요석 불꽃도마뱀' }, expected: 'salamander' },
  { e: { role: 'animal', animalType: 'scorpion', name: '사막 거대전갈' }, expected: 'scorpion' },
  { e: { role: 'animal', animalType: 'deer', name: '야생 백록' }, expected: 'deer' },
  { e: { role: 'animal', animalType: 'bear', name: '갈색 불곰' }, expected: 'bear' },
  { e: { role: 'animal', animalType: 'turtle', name: '거대 바다거북' }, expected: 'turtle' },
  { e: { role: 'animal', animalType: 'camel', name: '사막 낙타' }, expected: 'camel' },
  { e: { role: 'soldier', race: 'beastkin', name: '사막 수인전사' }, expected: 'beastkin' },
  { e: { role: 'king', race: 'beastkin', name: '사막의 술탄' }, expected: 'beastkin' },
  { e: { role: 'farmer', race: 'beastkin', name: '수인 재배사' }, expected: 'beastkin' },
  { e: { role: 'monster', race: 'dragonkin', name: '화염 용족 전사' }, expected: 'dragonkin' },
  { e: { role: 'monster', monsterType: 'kraken', name: '심연의 군주 크라켄' }, expected: 'kraken' },
  { e: { role: 'monster', monsterType: 'croc', name: '거대 악어괴수' }, expected: 'croc' }
];

let allPassed = true;
for (const tc of testCases) {
  const actual = atlas.getBaseKeyForEntity(tc.e);
  const ok = (actual === tc.expected);
  console.log(`${tc.e.name} (${tc.e.animalType || tc.e.monsterType || tc.e.race}) -> ${actual} : ${ok ? 'PASS' : 'FAIL (expected ' + tc.expected + ')'}`);
  if (!ok) allPassed = false;
}

if (!allPassed) {
  console.error('Some tests failed!');
  process.exit(1);
}
console.log('\nALL ENTITY DESIGN ROUTINGS VERIFIED 100%!');
