const fs = require('fs');

console.log('Writing comprehensive 3840x2400 world_gen.js generator...');

// Let's read the 300 settlements from scratch/build_world_3840.js
const baseCode = fs.readFileSync('scratch/build_world_3840.js', 'utf8');
eval(baseCode + '; global.createSettlementList = createSettlementList;');
const settlements = createSettlementList();

console.log('Got', settlements.length, 'settlements.');

// Road connections
const roadPairs = [
  // Central core highways
  ['solaris', 'bluewave'],
  ['solaris', 'solhaven'],
  ['solaris', 'veronia'],
  ['solaris', 'goldenwheat'],
  ['solaris', 'oakwood'],
  ['solaris', 'ironforge'],
  ['solaris', 'valor_fort'],
  ['solaris', 'silverleaf'],
  ['solaris', 'riverfall'],
  ['solaris', 'stonehaven'],
  ['solaris', 'windmill_valley'],
  ['veronia', 'bluewave'],
  ['veronia', 'goblin_camp'],
  ['goldenwheat', 'riverfall'],
  ['goldenwheat', 'windmill_valley'],
  ['oakwood', 'silverleaf'],
  ['ironforge', 'solhaven'],
  ['valor_fort', 'blackwolf_stronghold'],
  ['stonehaven', 'solhaven'],
  ['silverleaf', 'stonehaven'],
  ['riverfall', 'bluewave'],

  // West
  ['elvenheim', 'fairy_glade'],
  ['elvenheim', 'breeze_gate'],
  ['fairy_glade', 'whispering_canopy'],
  ['mirage_oasis', 'sphinx_pyramid'],
  ['mirage_oasis', 'dune_bazaar'],
  ['mirage_oasis', 'scorpion_canyon'],
  ['dune_bazaar', 'sandstone_citadel'],
  ['breeze_gate', 'dragon_eyrie'],

  // North
  ['frost_citadel', 'st_mare'],
  ['frost_citadel', 'valkyrie_gate'],
  ['frost_citadel', 'orc_stronghold'],
  ['frost_citadel', 'frostwolf_den'],
  ['st_mare', 'glacier_port'],
  ['valkyrie_gate', 'valkyrie_sanctum'],

  // South
  ['obsidian_keep', 'obsidian_haven'],
  ['obsidian_keep', 'magma_underforge'],
  ['obsidian_keep', 'volcano_isle'],
  ['obsidian_keep', 'dragon_graveyard'],
  ['obsidian_haven', 'sulfur_spring_harbor'],

  // East
  ['obsidian_necropolis', 'whispering_woods'],
  ['obsidian_necropolis', 'crystal_caverns'],
  ['crystal_caverns', 'mist_haven'],
  ['mist_haven', 'croc_bayou'],
  ['crystal_caverns', 'crystal_refinery'],
  ['dragon_ruins', 'obsidian_necropolis']
];

// Sea routes
const seaRoutes = [
  { fromId: 'bluewave', toId: 'lone_beacon', name: '황금해협 북부 항로' },
  { fromId: 'lone_beacon', toId: 'elvenheim', name: '등대-엘븐하임 항로' },
  { fromId: 'bluewave', toId: 'pirate_cove', name: '해골초도 위험항로' },
  { fromId: 'pirate_cove', toId: 'mirage_oasis', name: '미라주 오아시스 횡단항로' },
  { fromId: 'bluewave', toId: 'st_mare', name: '북방 빙해항로' },
  { fromId: 'st_mare', toId: 'lone_beacon', name: '노스펠름 해협항로' },
  { fromId: 'bluewave', toId: 'atlantis_ruins', name: '아틀란티스 심해항로' },
  { fromId: 'atlantis_ruins', toId: 'obsidian_haven', name: '화산군도 흑요석항로' },
  { fromId: 'atlantis_ruins', toId: 'siren_coral', name: '세이렌 산호환초항로' },
  { fromId: 'siren_coral', toId: 'dune_bazaar', name: '남서 대양쾌속항로' },
  { fromId: 'solhaven', toId: 'mist_haven', name: '비전해협 동부항로' },
  { fromId: 'solhaven', toId: 'sunken_shipwreck', name: '난파선 해구항로' },
  { fromId: 'sunken_shipwreck', toId: 'dragon_ruins', name: '용의 계곡 유적항로' },
  { fromId: 'solhaven', toId: 'kraken_abyss', name: '심연 크라켄 위험항로' }
];

console.log('Setup complete, now assembling world_gen.js content...');
