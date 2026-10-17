const fs = require('fs');

console.log('Patching entities.js with 48 cellSize SpatialGrid and 300 settlements population...');

let code = fs.readFileSync('fantasy_world/js/entities.js', 'utf8');

// 1. Update SpatialGrid cellSize in constructor
code = code.replace('this.spatialGrid = new SpatialGrid(16);', 'this.spatialGrid = new SpatialGrid(48);');

// 2. Add ROLE_CONFIG entries if missing
const roleConfigTarget = 'const ROLE_CONFIG = {';
const newRoleConfigs = `const ROLE_CONFIG = {
  commander:    { label: '기사단 총사령관', category: 'soldier', icon: '⚔️', color: '#dc2626', speed: 1.65 },
  duchess:      { label: '제국 여공작', category: 'soldier', icon: '👑', color: '#facc15', speed: 1.55 },
  ranger:       { label: '왕립 순찰대 궁수', category: 'adventurer', icon: '🏹', color: '#16a34a', speed: 1.80 },
  mage:         { label: '왕립 비전 마도사', category: 'adventurer', icon: '🔮', color: '#38bdf8', speed: 1.55 },
  wolfrider:    { label: '늑대 기병', category: 'soldier', icon: '🐺', color: '#64748b', speed: 2.10 },`;

code = code.replace(roleConfigTarget, newRoleConfigs);

// 3. Add Loreon Kingdom heroes and 300 settlements population to initPopulation
const popEndTarget = '    this.spawnMonstersForLair(\'dragon_graveyard\', 18);';
const popEndIdx = code.indexOf(popEndTarget);

if (popEndIdx === -1) {
  console.error('Target popEndTarget not found!');
  process.exit(1);
}

const loreonKingdomAnd300Pop = `    this.spawnMonstersForLair('dragon_graveyard', 18);

    // =========================================================================
    // LOREON KINGDOM KEY LEGENDARY HEROES & COMMANDERS
    // =========================================================================
    const solTown = sMap.solaris;
    if (solTown) {
      this.createEntity({
        name: '왕국 총사령관 아르투르',
        race: 'human',
        role: 'commander',
        subClass: '로레온 왕립기사단 총사령관',
        customIcon: '⚔️',
        faction: 'kingdom',
        homeId: 'solaris',
        x: solTown.x + 1,
        y: solTown.y - 1,
        hp: 650, maxHp: 650, atk: 45, gold: 1200, scale: 1.3,
        thought: '⚔️ 붉은 깃털 투구와 황금 견장을 번뜩이며 대륙 통일 전선을 지휘하는 중'
      });
      this.createEntity({
        name: '왕실 비전 대마도사 실비아',
        race: 'human',
        role: 'mage',
        subClass: '비전 학탑 수석 대현자',
        customIcon: '🔮',
        ranged: true,
        projColor: '#38bdf8',
        faction: 'kingdom',
        homeId: 'solaris',
        x: solTown.x + 8,
        y: solTown.y - 2,
        hp: 380, maxHp: 380, atk: 52, gold: 1000, scale: 1.2,
        thought: '🔮 아케인 보주 지팡이에서 뿜어져 나오는 비전 마력으로 황도를 수호하는 중'
      });
    }

    const verTown = sMap.veronia;
    if (verTown) {
      this.createEntity({
        name: '베로니아 여공작 엘레나',
        race: 'human',
        role: 'duchess',
        subClass: '베로니아 공작령 통치자',
        customIcon: '👑',
        faction: 'kingdom',
        homeId: 'veronia',
        x: verTown.x,
        y: verTown.y - 1,
        hp: 520, maxHp: 520, atk: 40, gold: 2000, scale: 1.25,
        thought: '👑 순백의 은빛 갑주를 입고 레이피어를 쥐어 가문의 명예와 영지를 통솔하는 중'
      });
    }

    const frostTown = sMap.frost_citadel;
    if (frostTown) {
      this.createEntity({
        name: '설원 늑대기사단장 베른하르트',
        race: 'human',
        role: 'wolfrider',
        subClass: '노스펠름 혹한 기마사령관',
        customIcon: '🐺',
        faction: 'kingdom',
        homeId: 'frost_citadel',
        x: frostTown.x - 2,
        y: frostTown.y + 2,
        hp: 580, maxHp: 580, atk: 42, gold: 900, scale: 1.3,
        thought: '🐺 거대한 장갑 다이어울프를 타고 영구동토의 얼음 바람을 가르는 중'
      });
    }

    const elvenTown = sMap.elvenheim;
    if (elvenTown) {
      this.createEntity({
        name: '바람의 추적자 일리디아',
        race: 'elf',
        role: 'ranger',
        subClass: '실바니아 요정림 수석 순찰대장',
        customIcon: '🏹',
        ranged: true,
        projColor: '#16a34a',
        faction: 'kingdom',
        homeId: 'elvenheim',
        x: elvenTown.x + 3,
        y: elvenTown.y - 3,
        hp: 420, maxHp: 420, atk: 44, gold: 800, scale: 1.2,
        thought: '🏹 녹색 후드를 깊게 눌러쓴 채 마법 화살을 시위에 메겨 숲을 경계하는 중'
      });
    }

    // =========================================================================
    // 300개 전 대륙 거점 자동 생태계 및 주둔군/몬스터 유기적 생성
    // =========================================================================
    const populatedSet = new Set(['solaris', 'veronia', 'bluewave', 'solhaven', 'goldenwheat', 'ironforge', 'valor_fort', 'silverleaf', 'riverfall', 'stonehaven', 'moonlight_lake', 'windmill_valley', 'goblin_camp', 'blackwolf_stronghold', 'wyvern_crag', 'elvenheim', 'fairy_glade', 'breeze_gate', 'mirage_oasis', 'sphinx_pyramid', 'dune_bazaar', 'scorpion_canyon', 'dragon_eyrie', 'frost_citadel', 'st_mare', 'valkyrie_gate', 'orc_stronghold', 'frostwolf_den', 'yeti_cavern', 'ice_dragon_altar', 'obsidian_keep', 'volcano_isle', 'dragon_graveyard', 'magma_underforge', 'salamander_pools', 'obsidian_haven', 'obsidian_necropolis', 'whispering_woods', 'crystal_caverns', 'croc_bayou', 'dragon_ruins', 'abyssal_drake_altar', 'mist_haven', 'lone_beacon', 'pirate_cove', 'siren_coral', 'atlantis_ruins', 'sunken_shipwreck', 'kraken_abyss']);

    for (const s of this.world.settlements) {
      if (populatedSet.has(s.id)) continue;
      const sx = s.x;
      const sy = s.y;

      if (s.faction === 'monster' || s.type === 'lair') {
        const count = 4 + (s.id.charCodeAt(0) % 3);
        for (let i = 0; i < count; i++) {
          let mtype = 'orc';
          let mname = '오크 전사';
          if (s.id.includes('wolf')) { mtype = 'wolf'; mname = '야생 늑대'; }
          else if (s.id.includes('croc') || s.id.includes('swamp') || s.id.includes('marsh') || s.id.includes('bog')) { mtype = 'croc'; mname = '늪지대 맹독 악어'; }
          else if (s.id.includes('spider')) { mtype = 'spider'; mname = '거대 거미'; }
          else if (s.id.includes('skeleton') || s.id.includes('crypt') || s.id.includes('ghoul') || s.id.includes('tomb') || s.id.includes('grave')) { mtype = 'skeleton'; mname = '망령 스켈레톤'; }
          else if (s.id.includes('bandit') || s.id.includes('raider') || s.id.includes('pirate')) { mtype = 'pirate_captain'; mname = '악명높은 무법자'; }
          else if (s.id.includes('harpy') || s.id.includes('gargoyle')) { mtype = 'harpy'; mname = '절벽 하피'; }
          else if (s.id.includes('golem')) { mtype = 'fire_golem'; mname = '암석 골렘'; }
          else if (s.id.includes('hellhound')) { mtype = 'hellhound'; mname = '지옥 사냥개'; }

          this.createEntity({
            name: \`\${mname} \${i + 1}\`,
            race: (mtype === 'croc' || mtype === 'wolf' || mtype === 'hellhound') ? 'animal' : 'monster',
            role: (mtype === 'croc') ? 'animal' : 'monster',
            monsterType: mtype,
            animalType: (mtype === 'croc') ? 'croc' : ((mtype === 'wolf') ? 'wolf' : null),
            faction: 'monster',
            homeId: s.id,
            x: sx + (Math.random() - 0.5) * 8,
            y: sy + (Math.random() - 0.5) * 8,
            hp: 150 + (i * 20),
            maxHp: 150 + (i * 20),
            atk: 18 + (i * 2),
            gold: 30 + (i * 10)
          });
        }
      } else {
        const isCastle = (s.type === 'castle' || s.type === 'fortress');
        const isPort = (s.type === 'port');

        const leaderRole = isCastle ? 'commander' : (isPort ? 'soldier' : 'guard');
        const leaderTitle = isCastle ? '영지 수호기사단장' : (isPort ? '항구 경비대장' : '자치 수비대장');
        this.createEntity({
          name: \`\${s.name} \${leaderTitle}\`,
          race: s.continent === 'west' ? (s.y > 1200 ? 'beastkin' : 'elf') : 'human',
          role: leaderRole,
          subClass: leaderTitle,
          faction: 'kingdom',
          homeId: s.id,
          x: sx + (Math.random() - 0.5) * 3,
          y: sy + (Math.random() - 0.5) * 3,
          hp: 320, maxHp: 320, atk: 30, gold: 200, scale: 1.15
        });

        const guardCount = isCastle ? 3 : 2;
        for (let g = 0; g < guardCount; g++) {
          const isRanger = (g % 2 === 0);
          this.createEntity({
            name: \`\${s.name} \${isRanger ? '왕립 순찰대' : '성채 수비병'} \${g + 1}\`,
            race: s.continent === 'west' ? 'elf' : 'human',
            role: isRanger ? 'ranger' : 'soldier',
            subClass: isRanger ? '로레온 왕립 순찰대' : '성채 수비병',
            faction: 'kingdom',
            homeId: s.id,
            x: sx + (Math.random() - 0.5) * 6,
            y: sy + (Math.random() - 0.5) * 6,
            hp: 180, maxHp: 180, atk: 20, gold: 60
          });
        }

        this.createEntity({
          name: \`\${s.name} 교역상\`,
          race: 'human',
          role: 'merchant',
          subClass: '특산품 상인',
          faction: 'kingdom',
          homeId: s.id,
          x: sx + (Math.random() - 0.5) * 4,
          y: sy + (Math.random() - 0.5) * 4,
          hp: 120, maxHp: 120, atk: 10, gold: 400
        });
      }
    }`;

code = code.slice(0, popEndIdx) + loreonKingdomAnd300Pop + code.slice(popEndIdx + popEndTarget.length);

fs.writeFileSync('fantasy_world/js/entities.js', code);
console.log('Successfully patched entities.js!');
