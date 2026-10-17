// ============================================================================
// rpg_systems.js - 영지 건축, 호위 용병단, 월드 보스 레이드, 장비 및 보물상자 시스템
// ============================================================================

const STRUCTURE_DEFS = {
  tower: {
    name: '아처 방어 감시탑',
    icon: '🗼',
    cost: 350,
    maxHp: 450,
    desc: '접근하는 적 몬스터를 자동 탐색하여 유도 화살을 발사하는 방어 타워',
    w: 2, h: 2,
    color: '#475569',
    roofColor: '#dc2626'
  },
  dock: {
    name: '무역 선착장 (부두)',
    icon: '⚓',
    cost: 500,
    maxHp: 380,
    desc: '해안가에 설치하여 상선들의 정박지로 활용. 주기적으로 무역 관세(150G) 수입 발생',
    w: 3, h: 2,
    color: '#78350f',
    roofColor: '#38bdf8'
  },
  citadel: {
    name: '영지 왕실 성채 (본부)',
    icon: '🏰',
    cost: 1000,
    maxHp: 900,
    desc: '내 영지의 사령부. 성채를 수호하는 정예 근위병 2명이 자동 스폰되어 순찰',
    w: 4, h: 3,
    color: '#334155',
    roofColor: '#facc15'
  },
  farm: {
    name: '대농장 & 풍차',
    icon: '🌾',
    cost: 250,
    maxHp: 300,
    desc: '주변 아군에게 지속 체력 재생(+5/s) 오라를 부여하고 주기적으로 식량 생산',
    w: 3, h: 3,
    color: '#65a30d',
    roofColor: '#fef08a'
  }
};

const LEGENDARY_ITEMS = [
  { id: 'excalibur', slot: 'weapon', name: '아테리아의 룬 성검', icon: '⚔️', atk: 55, hp: 60, desc: '고대 왕국의 마법이 깃든 성검. 공격 시 벼락이 방출됩니다.' },
  { id: 'aegis', slot: 'shield', name: '용비늘 이지스 방패', icon: '🛡️', atk: 10, hp: 160, desc: '고대 드래곤의 비늘로 벼려낸 불멸의 방패. 받는 피해를 크게 경감합니다.' },
  { id: 'mithril_armor', slot: 'armor', name: '왕실 미스릴 판금갑옷', icon: '🦺', atk: 15, hp: 200, desc: '드워프 명장이 제련한 미스릴 갑주. 최대 생명력이 대폭 증가합니다.' },
  { id: 'ocean_heart', slot: 'relic', name: '대양의 심장 심해진주', icon: '💎', atk: 20, hp: 80, desc: '바다의 여신 탈라사의 축복. 항해 속도와 무역 이윤이 증가합니다.' },
  { id: 'dragon_crown', slot: 'helmet', name: '정복자의 황금 용관', icon: '👑', atk: 30, hp: 120, desc: '천공의 비룡을 제압한 대영웅의 관. 명성치 획득량이 증폭됩니다.' },
  { id: 'frostmourne_glacial_blade', slot: 'weapon', name: '서리고룡의 영구빙하 마검', icon: '❄️', atk: 62, hp: 140, desc: '혹한의 만년빙하에서 벼려낸 서리고룡의 마검. 타격 시 서리 파편이 폭발하며 적을 동결시킵니다.' }
];

const DUNGEONS = [
  {
    id: 'dungeon_necropolis',
    name: '네크로폴리스 고대 카타콤',
    icon: '💀',
    levelReq: 5,
    x: 1450, y: 480,
    color: '#a855f7',
    desc: '고대 왕국의 타락한 고위 사제와 언데드 군단이 잠들어 있는 지하 묘실. 3층 심연에 리치 로드가 도사립니다.',
    bossName: '심연의 리치 로드 발라자르',
    bossHp: 2400,
    bossAtk: 45,
    relicReward: {
      id: 'relic_soul_gem',
      slot: 'relic',
      name: '네크로맨서의 영혼 보옥',
      icon: '🔮',
      atk: 32,
      hp: 120,
      desc: '모든 공격 시 피해량의 15% 생명력을 흡수하는 고대 암흑 보옥.'
    },
    goldReward: 3500,
    fameReward: 80
  },
  {
    id: 'dungeon_balrog',
    name: '발록의 심연 용암 미궁',
    icon: '🌋',
    levelReq: 8,
    x: 380, y: 1850,
    color: '#ef4444',
    desc: '화산섬 지하 마그마가 끓어넘치는 심연의 동굴. 태고의 화염 악마 발록이 깨어나 불길을 내뿜습니다.',
    bossName: '태고의 화염 마신 발록',
    bossHp: 3200,
    bossAtk: 58,
    relicReward: {
      id: 'relic_balrog_heart',
      slot: 'relic',
      name: '발록의 지옥불 심장',
      icon: '❤️‍🔥',
      atk: 45,
      hp: 180,
      desc: '주변 4.5타일 내 모든 적에게 초당 22의 화염 연소 피해를 입히는 영구 오라.'
    },
    goldReward: 5000,
    fameReward: 100
  },
  {
    id: 'dungeon_atlantis',
    name: '침몰도시 아틀란티스 해저 신전',
    icon: '🔱',
    levelReq: 10,
    x: 3100, y: 2250,
    color: '#06b6d4',
    desc: '대양 깊은 해저에 가라앉은 초고대 문명의 신전. 바다의 지배자 해신 포세이돈 골렘이 유적을 수호합니다.',
    bossName: '심해의 티탄 포세이돈 골렘',
    bossHp: 3800,
    bossAtk: 52,
    relicReward: {
      id: 'relic_abyssal_trident',
      slot: 'weapon',
      name: '아비스 트라이던트 삼지창',
      icon: '🔱',
      atk: 40,
      hp: 220,
      desc: '3단 콤보 피니셔 시 전방에 거대한 해일 폭풍을 발사하여 180의 광역 수격 피해를 입힙니다.'
    },
    goldReward: 6000,
    fameReward: 120
  },
  {
    id: 'dungeon_frost_wyrm',
    name: '서리고룡의 영구빙하 묘실',
    icon: '❄️',
    levelReq: 12,
    x: 960, y: 160,
    color: '#38bdf8',
    desc: '혹한의 만년빙하 정상에 군림하는 태고의 서리고룡 신드라고사의 거처. 영하 50도의 절대영도 눈보라가 몰아칩니다.',
    bossName: '만년빙룡 신드라고사 (Sindragosa)',
    bossHp: 4500,
    bossAtk: 68,
    relicReward: {
      id: 'relic_glacial_heart',
      slot: 'relic',
      name: '서리고룡의 만년빙정 심장',
      icon: '💎',
      atk: 50,
      hp: 240,
      desc: '피격 시 주변 모든 적에게 혹한의 동결 냉기를 폭발시켜 이동속도를 50% 둔화시킵니다.'
    },
    goldReward: 7500,
    fameReward: 150
  }
];

const MERCENARY_CLASSES = [
  {
    id: 'paladin',
    name: '근위 성전사 가웨인',
    role: 'soldier',
    icon: '🛡️',
    color: '#3b82f6',
    hp: 650,
    atk: 28,
    cost: 300,
    desc: '단단한 성기사 판금 갑주와 신성 방패로 적의 공격을 온몸으로 막아내는 수호자.'
  },
  {
    id: 'ranger',
    name: '엘븐 윈드레인저 실바나',
    role: 'archer',
    icon: '🏹',
    color: '#22c55e',
    hp: 420,
    atk: 46,
    cost: 450,
    desc: '세계수의 축복을 받은 엘프 명궁. 9타일 초장거리에서 관통 바람 화살을 연사합니다.'
  },
  {
    id: 'sorceress',
    name: '아케인 소서리스 이클립스',
    role: 'mage',
    icon: '🧙',
    color: '#a855f7',
    hp: 380,
    atk: 54,
    cost: 600,
    desc: '별빛 비전 마법사. 다중 체인 라이트닝으로 몬스터 무리를 일망타진합니다.'
  },
  {
    id: 'assassin',
    name: '그림자 어쌔신 발터',
    role: 'wolfrider',
    icon: '🗡️',
    color: '#e11d48',
    hp: 460,
    atk: 62,
    cost: 700,
    desc: '어둠의 길드 암살자. 적 배후로 순간이동하여 2.5배 치명타 출혈 일격을 가합니다.'
  }
];

const AWAKENING_CLASSES = [
  {
    id: 'blademaster',
    name: '소드마스터',
    title: '무극의 검성 (Blademaster)',
    icon: '⚔️',
    color: '#f59e0b',
    levelReq: 5,
    desc: '검의 극의를 터득한 대검호. 3단 콤보 피니셔가 주변에 3중 십자 검기를 방출하며 적을 찢어발깁니다.',
    perks: ['근접 치명타 확률 +25%', '기본 공격력 +35', '피니셔 검기 범위 +40%'],
    skillName: '천공 멸신 검무 (Omnislash)',
    skillDesc: 'G키 시전: 8.5타일 내 모든 적에게 잔상으로 고속 텔레포트하며 8연속 참격(각 280 피해) 및 3중 충격파 폭발!',
    skillCd: 18.0
  },
  {
    id: 'archmage',
    name: '대현자 아크메이지',
    title: '태고의 비전 마도사 (Archmage)',
    icon: '🔮',
    color: '#a855f7',
    levelReq: 5,
    desc: '고대 원소의 심연을 깨우친 마도사. 모든 마법 쿨다운이 40% 단축되며 일반 공격에 비전 유도탄이 방출됩니다.',
    perks: ['모든 스킬 쿨다운 40% 단축', '마법 공격력 +45', '공격 시 비전 유도탄 발사'],
    skillName: '시공간 초신성 붕괴 (Supernova)',
    skillDesc: 'G키 시전: 거대 차원 블랙홀 초신성을 소환하여 주변 적들을 강제 흡인 후 초극대 360 피해 + 2.5초 완전 빙결!',
    skillCd: 22.0
  },
  {
    id: 'skyhunter',
    name: '천공의 스카이 헌터',
    title: '신궁의 질풍 저격수 (Sky Hunter)',
    icon: '🏹',
    color: '#10b981',
    levelReq: 5,
    desc: '바람의 정령과 교감하는 대륙 최고의 명사수. 모든 지형 이동속도 +30% 및 사격 공격이 지형과 적들을 관통합니다.',
    perks: ['영구 이동속도 +30%', '회피 확률 +20%', '공격 시 3발의 유도 바람화살 추가'],
    skillName: '태양의 유성 화살비 (Rain of Solar Arrows)',
    skillDesc: 'G키 시전: 창공으로 황금 태양화살을 발사하여 6초간 화면 전역에 24발의 유성 화살 폭격(각 180 피해)!',
    skillCd: 20.0
  }
];

const RUNESTONES = [
  {
    id: 'rune_ignis',
    name: '이그니스 화룡의 룬',
    element: 'fire',
    icon: '🔥',
    color: '#ef4444',
    bonusText: '공격력 +28 & 적 타격 시 화염 폭발 + 5초간 지속 화상 화염 피해',
    desc: '붉은 용의 심장에서 추출된 불꽃의 정수. 무기에 깃들어 타격 시 맹렬한 화염 폭발을 일으킵니다.'
  },
  {
    id: 'rune_glacies',
    name: '글라키에스 절대영도의 룬',
    element: 'ice',
    icon: '❄️',
    color: '#38bdf8',
    bonusText: '방어력 +22 & 타격 시 서리 충격 방출 및 2초간 적 이동/공격 완전 동결',
    desc: '영구 동토의 고대 빙하핵에서 벼려낸 룬. 공격 시 적의 관절과 혈류를 즉시 얼려버립니다.'
  },
  {
    id: 'rune_fulgur',
    name: '풀구르 천벌 벼락의 룬',
    element: 'lightning',
    icon: '⚡',
    color: '#eab308',
    bonusText: '치명타 +18% & 타격 시 연쇄 번개가 발동하여 주변 최대 3명의 적을 연쇄 감전 타격',
    desc: '천공의 폭풍 구름에서 벼락을 봉인한 룬. 전격이 연쇄되어 다수의 적을 순식간에 섬멸합니다.'
  },
  {
    id: 'rune_terra',
    name: '테라 대지 생명력의 룬',
    element: 'earth',
    icon: '🌿',
    color: '#22c55e',
    bonusText: '최대 체력 +180 & 타격 시 피해량의 35%를 생명력으로 즉시 흡수(뱀파이어릭)',
    desc: '대지의 여신이 깃든 에메랄드 룬. 적의 생기를 흡수하여 전투 중 끊임없이 플레이어를 치유합니다.'
  },
  {
    id: 'rune_solaris',
    name: '솔라리스 태양왕 신성의 룬',
    element: 'holy',
    icon: '☀️',
    color: '#f59e0b',
    bonusText: '모든 속성 +20 & 타격 시 황금빛 태양 충격파를 폭발시켜 주변 적 1.5초 기절 스턴',
    desc: '태양의 신성한 광휘가 각인된 전설의 룬. 어둠을 몰아내고 거대한 파동으로 적들을 무력화합니다.'
  }
];

class RPGSystemsManager {
  constructor(world, entityMgr) {
    this.world = world;
    this.em = entityMgr;

    // 1. 플레이어 건축 구조물 목록
    this.structures = [];

    // 2. 동료 호위 용병단
    this.companions = [];
    this.companionsActive = false;

    // 3. 월드 보스 레이드
    this.activeBoss = null;
    this.bossTimer = 180; // 3분마다 보스 출현

    // 4. 필드 보물상자
    this.treasureChests = [];

    // 5. 플레이어 장비
    this.equipment = {
      weapon: LEGENDARY_ITEMS[0],
      shield: LEGENDARY_ITEMS[1],
      armor: null,
      helmet: null,
      relic: null
    };

    // 건축 모드 상태
    this.isBuildModeActive = false;
    this.selectedBuildType = 'tower';

    // 6. 콤보 연계 시스템
    this.comboCount = 0;
    this.comboTimer = 0;

    // 7. 4대 원소 극대 궁극기 쿨다운 (1~4번 키)
    this.skills = {
      whirlwind: { cd: 0, maxCd: 6.0, name: '질풍의 회오리', key: '1' },
      frostNova: { cd: 0, maxCd: 10.0, name: '혹한의 서리폭풍', key: '2' },
      meteor: { cd: 0, maxCd: 18.0, name: '멸망의 메테오', key: '3' },
      barrage: { cd: 0, maxCd: 12.0, name: '전방위 일제포격', key: '4' }
    };

    // 8. 낚시 미니게임 상태 (J 키)
    this.fishing = {
      active: false,
      timer: 0,
      bite: false,
      biteTimer: 0,
      bobberX: 0,
      bobberY: 0
    };

    // 9. 날씨 천벌 낙뢰 타이머
    this.cataclysmTimer = 12.0;

    // 10. 🏛️ 고대 시련의 사당 & 영구 유물 특성 시스템 (Ancient Shrines & Relic Traits)
    this.ancientShrines = [
      {
        id: 'shrine_flame',
        name: '불꽃의 시련 성소',
        element: 'flame',
        x: 420, y: 1740,
        color: '#f97316',
        icon: '🔥',
        traitId: 'flame_brand',
        traitName: '화염의 각인',
        traitDesc: '모든 공격 시 대상에게 4초간 화염(Burn) 도트 피해를 부여합니다.',
        cleared: false,
        activeTrial: false,
        guardians: [],
        guardiansLeft: 0
      },
      {
        id: 'shrine_frost',
        name: '혹한의 시련 성소',
        element: 'frost',
        x: 1980, y: 180,
        color: '#38bdf8',
        icon: '❄️',
        traitId: 'frost_aegis',
        traitName: '혹한의 방벽',
        traitDesc: '적에게 피격 시 공격자를 1.8초간 완전히 빙결(Freeze) 상태로 동결시킵니다.',
        cleared: false,
        activeTrial: false,
        guardians: [],
        guardiansLeft: 0
      },
      {
        id: 'shrine_storm',
        name: '폭풍의 시련 성소',
        element: 'storm',
        x: 3120, y: 840,
        color: '#a855f7',
        icon: '⚡',
        traitId: 'windstrider',
        traitName: '질풍의 도약',
        traitDesc: '영구 이동속도 +25% 및 닷지 롤(Space) 회피 쿨다운이 35% 단축됩니다.',
        cleared: false,
        activeTrial: false,
        guardians: [],
        guardiansLeft: 0
      },
      {
        id: 'shrine_earth',
        name: '대지의 시련 성소',
        element: 'earth',
        x: 1420, y: 1350,
        color: '#22c55e',
        icon: '🌿',
        traitId: 'earth_vitality',
        traitName: '대지의 축복',
        traitDesc: '영구 최대 체력 +150 및 2초마다 12HP씩 생명력이 지속 자동 재생됩니다.',
        cleared: false,
        activeTrial: false,
        guardians: [],
        guardiansLeft: 0
      },
      {
        id: 'shrine_sun',
        name: '태양왕의 성소',
        element: 'sun',
        x: 1960, y: 1380,
        color: '#facc15',
        icon: '👑',
        traitId: 'solar_aura',
        traitName: '태양왕의 패기',
        traitDesc: '영구 기본 공격력 +25 및 3단 콤보 피니셔의 참격 범위가 45% 극대화됩니다.',
        cleared: false,
        activeTrial: false,
        guardians: [],
        guardiansLeft: 0
      },
      {
        id: 'shrine_abyss_tide',
        name: '심해 파도의 성소',
        element: 'tide',
        x: 720, y: 920,
        color: '#06b6d4',
        icon: '🔱',
        traitId: 'tide_sovereign',
        traitName: '해신의 가호',
        traitDesc: '영구 수면/수상 이동속도 +50% 및 기본 공격력 +20 상승.',
        cleared: false,
        activeTrial: false,
        guardians: [],
        guardiansLeft: 0
      },
      {
        id: 'shrine_sky_aether',
        name: '천공 에테르 성소',
        element: 'aether',
        x: 1920, y: 360,
        color: '#c084fc',
        icon: '🌌',
        traitId: 'aether_wings',
        traitName: '에테르 천공의 날개',
        traitDesc: '영구 이동속도 +30% 및 쾌도난마 대시 찌르기 공격력 +40% 극대화.',
        cleared: false,
        activeTrial: false,
        guardians: [],
        guardiansLeft: 0
      }
    ];
    this.unlockedTraits = [];

    // 11. ⚡ 대륙 긴급 돌발 이벤트 시스템 (Dynamic Continental World Events)
    this.worldEventTimer = 75.0; // 75초 후 첫 이벤트 발생
    this.activeContinentalEvent = null;

    // 12. 🏰 왕국 요새 & 도시 주둔군 감시탑 자동 방어 시스템
    this.garrisonDefenseTimer = 1.6;

    // 13. 💀 고대 심연 던전 카타콤 원정 시스템 (Ancient Dungeon Catacombs)
    this.dungeons = DUNGEONS;
    this.activeDungeon = null;

    // 14. 🍻 용병 길드 주점 & 동료 육성 시스템 (Tavern Mercenaries)
    this.mercenaries = MERCENARY_CLASSES;
    this.recruitedMercenaryIds = ['paladin'];

    // 15. ✨ 영웅 2차 각성 / 마스터리 전직 시스템 (Hero Awakening & Mastery)
    this.awakeningClasses = AWAKENING_CLASSES;
    this.awakening = null;
    this.awakeningSkillCd = 0;

    // 16. ⚡ 룬 인챈트 제련 시스템 (Runeforge Enchantment System)
    this.runestones = RUNESTONES;
    this.enchantedRunes = {
      weapon: 'rune_ignis',
      shield: 'rune_terra',
      armor: 'rune_glacies'
    };
    this.runeInventory = ['rune_ignis', 'rune_glacies', 'rune_fulgur', 'rune_terra', 'rune_solaris'];

    // 17. 🏟️ 발로르 왕국 콜로세움 투기장 시스템 (Balor Colosseum Gladiator Tournament)
    this.colosseum = {
      active: false,
      wave: 0,
      maxWaves: 5,
      monsters: [],
      timer: 0,
      cleared: false,
      title: null
    };

    // 18. 🏛️ 고대 잊혀진 대륙 실록 & 5대 석판 모놀리스 (Ancient Codex & Monoliths)
    this.monoliths = [
      {
        id: 'monolith_solaria',
        name: '태양왕 솔라리스의 건국 석비',
        title: '제1장: 태고의 빛과 황금 제국의 개창',
        icon: '☀️',
        color: '#f59e0b',
        x: 1910, y: 1180,
        lore: '천공에서 떨어진 5개의 태양 파편이 대륙의 심장을 꿰뚫었을 때, 초대 신왕 솔라리우스는 불멸의 룬스톤을 벼려내어 혼돈의 마수들을 봉인하고 영원한 태양의 제국을 세웠다.',
        blessingText: '영구 최대 체력 +120 & 방어력 +15 영구 각인',
        unlocked: false,
        applyBlessing(p) { p.maxHp += 120; p.hp += 120; }
      },
      {
        id: 'monolith_sylvania',
        name: '실바니아 세계수의 신록 비문',
        title: '제2장: 대수목의 눈물과 비전의 정령',
        icon: '🌿',
        color: '#22c55e',
        x: 535, y: 665,
        lore: '대륙 서쪽 끝자락에 뿌리내린 세계수 유그드라는 숲의 모든 생명과 마나를 순환시키는 대지의 심장이다. 숲을 지키는 요정왕은 자연의 질서를 어지럽히는 자에게 가혹한 심판을 내린다.',
        blessingText: '영구 이동속도 +15% & 쿨다운 10% 영구 단축',
        unlocked: false,
        applyBlessing(p) { p.speed = (p.speed || 2.0) + 0.3; }
      },
      {
        id: 'monolith_northfell',
        name: '노스펠 서리거인의 빙하 룬비',
        title: '제3장: 만년설의 심연과 서리거인의 맹세',
        icon: '❄️',
        color: '#38bdf8',
        x: 1905, y: 245,
        lore: '얼어붙은 북방의 설원은 신들의 전쟁 당시 얼음 거인 위미르가 흘린 피가 굳어 형성된 불모의 빙하 지대이다. 극한의 추위를 견뎌낸 자만이 서리의 절대영도를 통제할 수 있다.',
        blessingText: '공격 시 20% 확률로 적을 2초간 오한(속도 -50%) 동결',
        unlocked: false,
        applyBlessing(p) { p.frostAura = true; }
      },
      {
        id: 'monolith_draconia',
        name: '드라코니아 고룡왕 흑요석 오벨리스크',
        title: '제4장: 대지옥의 용염과 불멸의 고룡',
        icon: '🐉',
        color: '#ef4444',
        x: 1945, y: 2155,
        lore: '남방의 용골 화산 지대는 용들의 시조 바하무트가 잠들어 있는 불꽃의 성지다. 용의 피를 이어받은 전사는 어떤 맹렬한 화염 속에서도 타오르는 투기를 잃지 않는다.',
        blessingText: '영구 기본 공격력 +30 & 화염 저항력 대폭 상승',
        unlocked: false,
        applyBlessing(p) { p.atk += 30; }
      },
      {
        id: 'monolith_abyss',
        name: '심연 탈라사의 해양 조개 석판',
        title: '제5장: 대서해의 비밀과 가라앉은 아틀란티스',
        icon: '🐚',
        color: '#06b6d4',
        x: 1535, y: 1245,
        lore: '심해의 어둠 속에는 고대 해양 제국의 거대한 신전이 잠들어 있다. 바다의 여신 탈라사의 목소리를 들을 수 있는 항해사는 거친 폭풍우 속에서도 배를 잃지 아니하리라.',
        blessingText: '항해 속도 +40% & 해양 낚시 대물 확률 2배 영구 각인',
        unlocked: false,
        applyBlessing(p) { p.shipSpeedMult = (p.shipSpeedMult || 1.0) * 1.4; }
      }
    ];

    // 19. 📜 대륙 현상금 사냥꾼 길드 & 수배령 (Bounty Hunter Guild)
    this.bountyHunterRank = '수습 사냥꾼 (Novice)';
    this.bounties = [
      {
        id: 'bounty_necro_dragon',
        name: '재앙의 네크로 드래곤 칼리스타',
        title: '고대 북방의 시체룡',
        rank: 'S-Rank',
        color: '#a855f7',
        icon: '💀',
        rewardGold: 2500,
        rewardExp: 800,
        rewardItem: '고대 네크로 용골 목걸이 (ATK +35, HP +150)',
        x: 1880, y: 220,
        region: '북부 노스펠 만년설 고원',
        desc: '서리 성채 북방 고분을 배회하며 망자들의 뼈를 집어삼키는 사룡왕. 광역 암흑 브레스 시전.',
        active: false,
        cleared: false,
        targetEnt: null
      },
      {
        id: 'bounty_orc_warlord',
        name: '피에 굶주린 오크 대족장 그롬마쉬',
        title: '붉은 암석의 약탈자',
        rank: 'A-Rank',
        color: '#dc2626',
        icon: '👹',
        rewardGold: 1600,
        rewardExp: 500,
        rewardItem: '족장의 피의 토끼발 (치명타 +15%)',
        x: 580, y: 720,
        region: '서부 실바니아 협곡 협로',
        desc: '상단을 습격하고 왕국 수비대를 학살한 흉포한 오크 대족장. 거대한 양손 전투도끼를 휘두름.',
        active: false,
        cleared: false,
        targetEnt: null
      },
      {
        id: 'bounty_abyss_witch',
        name: '심연의 맹독 세이렌 마녀 탈라사',
        title: '산호 환초의 저주',
        rank: 'A-Rank',
        color: '#06b6d4',
        icon: '🧜‍♀️',
        rewardGold: 1800,
        rewardExp: 600,
        rewardItem: '심해 세이렌의 진주환 (초당 재생 +10)',
        x: 1480, y: 1320,
        region: '남해 해골초 산호 암초',
        desc: '선원들을 유혹하여 난파시키고 배를 침몰시키는 심해의 바다 마녀. 맹독 해일을 방출.',
        active: false,
        cleared: false,
        targetEnt: null
      },
      {
        id: 'bounty_shadow_jade',
        name: '황혼의 그림자 암살단장 제이드',
        title: '보이지 않는 비수',
        rank: 'B-Rank',
        color: '#475569',
        icon: '🥷',
        rewardGold: 1200,
        rewardExp: 400,
        rewardItem: '그림자 비전 망토 (회피율 +25%)',
        x: 1860, y: 1120,
        region: '중앙 제국 북부 암석 지대',
        desc: '왕실 귀족들을 암살하고 어둠 속에 숨은 암살자 길드의 수장. 그림자 은신과 기습 투척검 사용.',
        active: false,
        cleared: false,
        targetEnt: null
      }
    ];

    // 20. 🧪 퀵 포션 벨트 단축 슬롯 (Quick Potion Belt Slots)
    this.quickBelt = {
      health: {
        id: 'potion_hp',
        name: '고대 생명수 물약',
        icon: '🧪',
        key: 'H',
        cd: 0,
        maxCd: 12.0,
        desc: '체력 350 즉시 회복'
      },
      swift: {
        id: 'potion_swift',
        name: '질풍의 신속 영약',
        icon: '⚡',
        key: '5',
        cd: 0,
        maxCd: 25.0,
        desc: '15초간 이동속도 +50% 및 회피율 +25%'
      },
      berserk: {
        id: 'potion_berserk',
        name: '버서커 분노 비약',
        icon: '🔥',
        key: '6',
        cd: 0,
        maxCd: 30.0,
        desc: '15초간 공격력 +35% 및 치명타율 +30%'
      }
    };

    this.initTreasureChests();
  }

  // ==========================================================================
  // A. 필드 보물상자 초기화
  // ==========================================================================
  initTreasureChests() {
    const spots = [
      { x: 388, y: 280, name: '화산섬의 불꽃 보물함' },
      { x: 198, y: 232, name: '해적 선장의 비밀 궤짝' },
      { x: 422, y: 58, name: '네크로폴리스의 저주받은 함' },
      { x: 312, y: 258, name: '피라미드 파라오의 황금상자' },
      { x: 428, y: 172, name: '천공 용의 고원 유물상자' },
      { x: 456, y: 218, name: '론 비컨 등대의 난파선 궤짝' },
      { x: 142, y: 248, name: '세계수 신록의 보물상자' },
      { x: 268, y: 76, name: '오크 약탈품 상자' },
      { x: 238, y: 285, name: '산호 환초의 인어 조개함' },
      { x: 95, y: 235, name: '신대륙 서부 미개척 유적함' }
    ];

    spots.forEach((sp, idx) => {
      this.treasureChests.push({
        id: 'chest_' + idx,
        x: sp.x,
        y: sp.y,
        name: sp.name,
        opened: false,
        icon: '📦',
        gold: 800 + Math.floor(Math.random() * 800),
        item: LEGENDARY_ITEMS[idx % LEGENDARY_ITEMS.length]
      });
    });
  }

  // ==========================================================================
  // B. 나만의 영지 건축 시스템
  // ==========================================================================
  canPlaceStructure(type, tx, ty) {
    const p = this.em.player;
    const def = STRUCTURE_DEFS[type];
    if (!p || !def) return { ok: false, reason: '유효하지 않은 구조물입니다.' };
    if (p.gold < def.cost) return { ok: false, reason: `골드가 부족합니다! (필요: ${def.cost}G / 보유: ${p.gold}G)` };

    // 타일 유효성 및 경계
    if (tx < 4 || tx > this.world.width - 5 || ty < 4 || ty > this.world.height - 5) {
      return { ok: false, reason: '월드 경계 근처에는 건설할 수 없습니다.' };
    }

    const tile = this.world.getTile(tx, ty);

    // 부두는 물/모래/해변에만 설치 가능
    if (type === 'dock') {
      const isWaterSide = (tile === TILE.WATER || tile === TILE.DEEP_WATER || tile === TILE.SAND || tile === TILE.DOCK);
      if (!isWaterSide) return { ok: false, reason: '선착장(부두)은 해안가나 얕은 물가에만 건설할 수 있습니다.' };
    } else {
      // 육상 건물은 물이나 용암 위에 설치 불가
      if (tile === TILE.DEEP_WATER || tile === TILE.WATER || tile === TILE.LAVA || tile === TILE.MOUNTAIN_HIGH) {
        return { ok: false, reason: '물속, 용암, 험준한 산악에는 건설할 수 없습니다.' };
      }
    }

    // 기존 구조물과 겹침 체크
    for (const s of this.structures) {
      if (Math.hypot(s.x - tx, s.y - ty) < 3.2) {
        return { ok: false, reason: '이미 다른 구조물이 인근에 자리잡고 있습니다.' };
      }
    }

    return { ok: true };
  }

  placeStructure(type, tx, ty) {
    const check = this.canPlaceStructure(type, tx, ty);
    if (!check.ok) {
      this.em.addFloatingText(tx, ty - 1.2, `⚠️ ${check.reason}`, '#f87171', 2.0);
      return false;
    }

    const p = this.em.player;
    const def = STRUCTURE_DEFS[type];
    p.gold -= def.cost;

    const struct = {
      id: 'struct_' + Date.now(),
      type: type,
      name: `내 영지 ${def.name}`,
      x: tx,
      y: ty,
      w: def.w,
      h: def.h,
      hp: def.maxHp,
      maxHp: def.maxHp,
      color: def.color,
      roofColor: def.roofColor,
      icon: def.icon,
      cooldown: 0,
      createdAt: Date.now()
    };

    this.structures.push(struct);

    // 사운드 & 파티클
    if (window.audioMgr) window.audioMgr.playBuild();
    this.em.addEffect(tx, ty, 6.0, '#facc15', 1.2);
    this.em.addFloatingText(tx, ty - 1.8, `🔨 [${def.name}] 건설 완료! (-${def.cost}G)`, '#4ade80', 2.4);
    this.em.log('trade', `🏰 플레이어가 [${tx}, ${ty}] 위치에 '${def.name}'을(를) 완공했습니다!`, tx, ty);

    // 성채 완공 시 즉시 근위병 스폰
    if (type === 'citadel') {
      this.spawnCitadelGuards(tx, ty);
    }

    return true;
  }

  spawnCitadelGuards(cx, cy) {
    for (let i = 0; i < 2; i++) {
      this.em.createEntity({
        name: `영지 친위 기사 ${i + 1}호`,
        race: 'human',
        role: 'soldier',
        subClass: '플레이어 영지 근위병',
        customIcon: '🛡️',
        faction: 'kingdom',
        homeId: 'solaris',
        x: cx + (i === 0 ? -1.5 : 1.5),
        y: cy + 1.5,
        hp: 350, maxHp: 350, atk: 36, gold: 120,
        thought: '🏰 플레이어 영주의 성채를 경비하는 중'
      });
    }
  }

  updateStructures(dt) {
    for (const s of this.structures) {
      s.cooldown -= dt;

      // 1. 아처 방어 타워: 주변 몬스터 탐색 후 원거리 사격
      if (s.type === 'tower' && s.cooldown <= 0) {
        const target = this.em.spatialGrid
          ? this.em.spatialGrid.findNearest(s.x, s.y, 8.5, e => e.faction === 'monster' && e.hp > 0)
          : null;
        const minDist = target ? Math.hypot(target.x - s.x, target.y - s.y) : 999;
        if (target) {
          s.cooldown = 1.1; // 1.1초 주기
          const dmg = 38 + Math.floor(Math.random() * 15);
          target.hp -= dmg;
          const angle = Math.atan2(target.y - s.y, target.x - s.x);
          this.em.projectiles.push({
            x: s.x,
            y: s.y,
            vx: Math.cos(angle) * 20,
            vy: Math.sin(angle) * 20,
            color: '#38bdf8',
            life: minDist / 20
          });
          this.em.addFloatingText(target.x, target.y - 0.8, `🏹-${dmg}`, '#38bdf8', 0.9);
          if (target.hp <= 0 && this.em.player) {
            this.em.player.gold += target.gold;
            this.em.addFloatingText(s.x, s.y - 1.2, `타워 방어 성공! +${target.gold}G`, '#4ade80', 1.4);
          }
        }
      }

      // 2. 무역 선착장: 25초마다 상선 관세 160G 상납
      if (s.type === 'dock' && s.cooldown <= 0) {
        s.cooldown = 25.0;
        if (this.em.player) {
          this.em.player.gold += 160;
          this.em.addEffect(s.x, s.y, 3.5, '#f59e0b', 0.8);
          this.em.addFloatingText(s.x, s.y - 1.5, `⚓ 무역 선착장 관세 수입 +160G!`, '#fbbf24', 2.0);
        }
      }

      // 3. 대농장: 5타일 내 플레이어 초당 체력 회복
      if (s.type === 'farm') {
        const p = this.em.player;
        if (p && Math.hypot(p.x - s.x, p.y - s.y) < 6.5) {
          if (p.hp < p.maxHp) {
            p.hp = Math.min(p.maxHp, p.hp + dt * 12);
          }
        }
      }
    }
  }

  // ==========================================================================
  // C. 동료 호위 용병단 (Companions Squad System)
  // ==========================================================================
  toggleCompanions() {
    this.companionsActive = !this.companionsActive;
    const p = this.em.player;
    if (!p) return;

    if (this.companionsActive) {
      if (this.companions.length === 0) {
        // 3인 호위 분대 생성
        const paladin = this.em.createEntity({
          name: '근위 성전사 가웨인',
          race: 'human',
          role: 'soldier',
          subClass: '플레이어 수호 성전사',
          customIcon: '🛡️',
          faction: 'kingdom',
          homeId: 'solaris',
          x: p.x - 1.2,
          y: p.y + 1.2,
          hp: 420, maxHp: 420, atk: 38, gold: 50,
          thought: '🛡️ 영주님의 곁을 밀착 호위 중'
        });

        const ranger = this.em.createEntity({
          name: '엘프 명사수 일리디아',
          race: 'elf',
          role: 'adventurer',
          subClass: '바람의 정예 궁수',
          customIcon: '🏹',
          faction: 'kingdom',
          homeId: 'elvenheim',
          ranged: true,
          projColor: '#4ade80',
          x: p.x + 1.2,
          y: p.y + 1.2,
          hp: 310, maxHp: 310, atk: 44, gold: 50,
          thought: '🏹 전방의 적을 저격 조준 중'
        });

        const drake = this.em.createEntity({
          name: '아기 비룡 피코',
          race: 'dragon',
          role: 'dragon',
          subClass: '수호 아기 드래곤',
          dragonType: 'fire',
          customIcon: '🐉',
          faction: 'kingdom',
          homeId: 'sky_dragon_eyrie',
          scale: 0.75,
          ranged: true,
          projColor: '#f97316',
          x: p.x,
          y: p.y - 1.5,
          hp: 280, maxHp: 280, atk: 35, gold: 0,
          thought: '🐉 플레이어 주위를 선회 비행 중'
        });

        this.companions = [paladin, ranger, drake];
      }

      this.companions.forEach(c => {
        c.hp = c.maxHp;
        c.x = p.x;
        c.y = p.y;
      });

      if (window.audioMgr) window.audioMgr.playFanfare();
      this.em.addEffect(p.x, p.y, 6.0, '#38bdf8', 1.0);
      this.em.addFloatingText(p.x, p.y - 1.8, '⚔️ 정예 호위 용병단 (3인) 소집 완료!', '#38bdf8', 2.2);
      this.em.log('quest', '👥 플레이어가 정예 호위 용병단(성전사·엘프궁수·아기비룡)을 소집했습니다!', p.x, p.y);
    } else {
      this.em.addFloatingText(p.x, p.y - 1.4, '👥 호위 용병단 대기/해산', '#94a3b8', 1.6);
      // 안전한 위치로 숨김 처리
      this.companions.forEach(c => {
        c.x = -100;
        c.y = -100;
      });
    }
  }

  updateCompanions(dt) {
    if (!this.companionsActive || !this.em.player) return;
    const p = this.em.player;

    const offsets = [
      { dx: -1.8, dy: 1.5 },
      { dx: 1.8, dy: 1.5 },
      { dx: 0, dy: -2.0 }
    ];

    this.companions.forEach((c, idx) => {
      if (c.hp <= 0) {
        c.hp = c.maxHp; // 용병 불사 회복
      }

      // 플레이어 상태와 동기화 (말 탑승, 비행 등)
      c.isShip = p.isShip;
      if (c.role !== 'dragon') {
        c.mount = p.mount;
        c.isFlying = p.isFlying;
      }

      const tx = p.x + offsets[idx].dx;
      const ty = p.y + offsets[idx].dy;
      const dist = Math.hypot(tx - c.x, ty - c.y);

      if (dist > 18) {
        c.x = tx;
        c.y = ty;
      } else if (dist > 1.2) {
        const step = (p.speed * 1.15) * dt * 3.2;
        c.x += ((tx - c.x) / dist) * Math.min(dist, step);
        c.y += ((ty - c.y) / dist) * Math.min(dist, step);
      }

      // 플레이어 주변 적 협공
      if (c.attackCooldown <= 0) {
        const enemy = this.em.spatialGrid
          ? this.em.spatialGrid.findNearest(c.x, c.y, 7.5, other => other.faction === 'monster' && other.hp > 0)
          : null;
        const minDist = enemy ? Math.hypot(enemy.x - c.x, enemy.y - c.y) : 999;
        if (enemy) {
          c.attackCooldown = 0.9;
          const dmg = Math.round(c.atk * (0.8 + Math.random() * 0.4));
          enemy.hp -= dmg;
          const angle = Math.atan2(enemy.y - c.y, enemy.x - c.x);
          this.em.projectiles.push({
            x: c.x,
            y: c.y,
            vx: Math.cos(angle) * 19,
            vy: Math.sin(angle) * 19,
            color: c.projColor || '#fbbf24',
            life: minDist / 19
          });
          this.em.addFloatingText(enemy.x, enemy.y - 0.7, `-${dmg}`, '#fbbf24', 0.85);
          if (enemy.hp <= 0) {
            p.kills++;
            p.gold += enemy.gold;
          }
        }
      }
    });
  }

  // ==========================================================================
  // D. 월드 보스 레이드 시스템 (World Boss Raid)
  // ==========================================================================
  triggerBossRaid(specificType = null) {
    if (this.activeBoss && this.activeBoss.hp > 0) return;

    const bossTypes = ['kraken', 'ignis', 'lich'];
    const pick = specificType || bossTypes[Math.floor(Math.random() * bossTypes.length)];

    let boss = null;
    if (pick === 'kraken') {
      boss = {
        type: 'kraken',
        name: '심연의 대양 군주 크라켄',
        icon: '🐙',
        subtitle: '대해양 침몰선 해역에 출현한 고대 해수',
        x: 275,
        y: 195,
        hp: 2400,
        maxHp: 2400,
        atk: 65,
        goldReward: 3500,
        fameReward: 120,
        scale: 2.2,
        isShip: true,
        faction: 'monster'
      };
    } else if (pick === 'ignis') {
      boss = {
        type: 'ignis',
        name: '화염의 지배자 고대룡 이그니스',
        icon: '🌋',
        subtitle: '남방 화산섬에서 날아오른 세계 종말의 화룡',
        x: 395,
        y: 275,
        hp: 3000,
        maxHp: 3000,
        atk: 78,
        goldReward: 4500,
        fameReward: 160,
        scale: 2.4,
        isShip: false,
        faction: 'monster'
      };
    } else {
      boss = {
        type: 'lich',
        name: '흑암 네크로폴리스 사령관 아자젤',
        icon: '💀',
        subtitle: '죽은 자들의 군단을 이끌고 북방 요새를 침공하는 사령왕',
        x: 415,
        y: 65,
        hp: 2200,
        maxHp: 2200,
        atk: 60,
        goldReward: 3000,
        fameReward: 100,
        scale: 2.0,
        isShip: false,
        faction: 'monster'
      };
    }

    this.activeBoss = boss;

    // 보스 엔티티로 월드에 추가
    this.activeBossEntity = this.em.createEntity({
      name: boss.name,
      race: boss.type === 'ignis' ? 'dragon' : 'monster',
      role: boss.type === 'ignis' ? 'dragon' : 'monster',
      subClass: '월드 레이드 보스',
      dragonType: boss.type === 'ignis' ? 'fire' : null,
      customIcon: boss.icon,
      faction: 'monster',
      homeId: 'solaris',
      x: boss.x,
      y: boss.y,
      hp: boss.hp,
      maxHp: boss.maxHp,
      atk: boss.atk,
      gold: boss.goldReward,
      scale: boss.scale,
      isShip: boss.isShip,
      ranged: true,
      projColor: '#ef4444',
      thought: `🚨 ${boss.subtitle}`
    });

    if (window.audioMgr) window.audioMgr.playBossHorn();
    this.em.addEffect(boss.x, boss.y, 14, '#ef4444', 2.0);
    this.em.log('battle', `🚨 [월드 레이드 발생] '${boss.name}'이(가) 출현했습니다! 대륙 전체에 비상 경보 발령!`, boss.x, boss.y);

    this.updateBossUI();
  }

  updateBoss(dt) {
    this.bossTimer -= dt;
    if (this.bossTimer <= 0 && (!this.activeBoss || this.activeBoss.hp <= 0)) {
      this.bossTimer = 220; // 3.5분 주기
      this.triggerBossRaid();
    }

    if (this.activeBoss && this.activeBossEntity) {
      this.activeBoss.hp = this.activeBossEntity.hp;

      // 보스 스킬 공격 (전조 경고 장판 Telegraphed Hazard Zone)
      if (Math.random() < 0.04 && this.activeBoss.hp > 0 && this.em.player) {
        const p = this.em.player;
        const targetX = p.x + (Math.random() - 0.5) * 2.5;
        const targetY = p.y + (Math.random() - 0.5) * 2.5;
        this.em.addHazardZone(targetX, targetY, 3.5, 1.25, 95, `[${this.activeBoss.name}] 멸망의 강타`, '#ef4444');
        this.em.addFloatingText(this.activeBossEntity.x, this.activeBossEntity.y - 1.8, '⚠️ 보스 특수기 시전! 회피하세요!', '#ef4444', 1.2);
        if (typeof audioMgr !== 'undefined') audioMgr.playBossHorn();
      }

      // 보스 처치 체크
      if (this.activeBoss.hp <= 0) {
        this.onBossDefeated();
      } else {
        this.updateBossUI();
      }
    }
  }

  onBossDefeated() {
    if (!this.activeBoss) return;
    const b = this.activeBoss;
    const p = this.em.player;

    if (p) {
      p.gold += b.goldReward;
      p.fame = (p.fame || 0) + b.fameReward;
      p.atk += 8;
      p.maxHp += 80;
      p.hp = p.maxHp;

      // 보스 처치 보상 전설 상자 스폰
      this.treasureChests.push({
        id: 'boss_chest_' + Date.now(),
        x: this.activeBossEntity ? this.activeBossEntity.x : p.x,
        y: this.activeBossEntity ? this.activeBossEntity.y : p.y,
        name: `👑 [${b.name}] 전설의 전리품 상자`,
        opened: false,
        icon: '👑',
        gold: 2500,
        item: LEGENDARY_ITEMS[Math.floor(Math.random() * LEGENDARY_ITEMS.length)]
      });
    }

    if (window.audioMgr) window.audioMgr.playFanfare();
    if (window.renderer) {
      window.renderer.screenFlashTimer = 0.15;
      window.renderer.screenFlashColor = '#fef08a';
    }
    this.em.addEffect(p ? p.x : b.x, p ? p.y : b.y, 16, '#facc15', 2.5);
    this.em.addFloatingText(p ? p.x : b.x, (p ? p.y : b.y) - 2.5, `🏆 레이드 보스 [${b.name}] 격퇴!`, '#fde047', 3.5);
    this.em.log('battle', `🎉 [보스 토벌] 위대한 영웅들이 '${b.name}'을(를) 격퇴하여 평화를 되찾았습니다! (+${b.goldReward}G, 명성 +${b.fameReward})`, b.x, b.y);

    this.activeBoss = null;
    this.activeBossEntity = null;
    this.hideBossUI();
  }

  updateBossUI() {
    const bar = document.getElementById('bossBarContainer');
    if (!bar) return;
    if (this.activeBoss && this.activeBoss.hp > 0) {
      const boss = this.activeBoss;

      // 🚨 [보스 2페이즈 광폭화 시스템 - Phase 2 Enrage Trigger]
      if (boss.hp <= boss.maxHp * 0.5 && !boss.phase2) {
        boss.phase2 = true;
        boss.scale = (boss.scale || 1.3) * 1.25;
        boss.atk = Math.round((boss.atk || 28) * 1.35);
        boss.speed = (boss.speed || 1.8) * 1.3;
        boss.attackCooldown = 0.45;

        if (this.em) {
          if (typeof audioMgr !== 'undefined' && audioMgr.playRoar) audioMgr.playRoar();
          this.em.addShockwave(boss.x, boss.y, 6.5, '#ef4444', 0.65);
          this.em.addHitSparks(boss.x, boss.y, '#f87171', 28);
          this.em.addHitSparks(boss.x, boss.y, '#facc15', 20);
          this.em.addFloatingText(boss.x, boss.y - 2.2, '🚨 [PHASE 2 ENRAGE] 보스 광폭화 돌입! (공격력·이속 폭증)', '#ef4444', 3.0);
          if (this.em.camera) {
            this.em.camera.shake = 18;
            this.em.camera.screenFreeze = 0.08;
          }
        }
      }

      bar.classList.remove('hidden');
      const nameEl = document.getElementById('bossName');
      const iconEl = document.getElementById('bossIcon');
      const subEl = document.getElementById('bossSubtitle');
      const fillEl = document.getElementById('bossHpFill');
      if (nameEl) nameEl.textContent = boss.phase2 ? `🔥 [광폭화] ${boss.name}` : boss.name;
      if (iconEl) iconEl.textContent = boss.icon;
      if (subEl) subEl.textContent = boss.phase2 ? `⚡ 2페이즈 각성 상태! 폭풍 공격 주의` : boss.subtitle;
      if (fillEl) {
        const pct = Math.max(0, Math.min(100, Math.round((boss.hp / boss.maxHp) * 100)));
        fillEl.style.width = `${pct}%`;
        fillEl.style.backgroundColor = boss.phase2 ? '#dc2626' : '#f97316';
      }
    } else {
      bar.classList.add('hidden');
    }
  }

  hideBossUI() {
    const bar = document.getElementById('bossBarContainer');
    if (bar) bar.classList.add('hidden');
  }

  // ==========================================================================
  // E. 보물상자 상호작용
  // ==========================================================================
  checkTreasureInteraction(player) {
    if (!player) return;
    for (const chest of this.treasureChests) {
      if (chest.opened) continue;
      const dist = Math.hypot(chest.x - player.x, chest.y - player.y);
      if (dist < 3.2) {
        chest.opened = true;
        player.gold += chest.gold;
        if (chest.item) {
          this.equipment[chest.item.slot] = chest.item;
          player.atk += chest.item.atk || 0;
          player.maxHp += chest.item.hp || 0;
          player.hp = Math.min(player.maxHp, player.hp + (chest.item.hp || 0));
        }

        if (window.audioMgr) window.audioMgr.playCoin();
        this.em.addEffect(chest.x, chest.y, 5.0, '#facc15', 1.2);
        this.em.addFloatingText(chest.x, chest.y - 1.5, `🎁 [${chest.name}] 개봉! +${chest.gold}G & [${chest.item ? chest.item.name : '희귀 보물'}] 획득!`, '#fde047', 3.0);
        this.em.log('quest', `💎 플레이어가 숨겨진 보물 '${chest.name}'을(를) 발견하여 개봉했습니다! (+${chest.gold}G)`, chest.x, chest.y);
      }
    }
  }

  // ==========================================================================
  // F. 콤보 연계 시스템 (Combo System)
  // ==========================================================================
  addCombo(hits = 1) {
    this.comboCount += hits;
    this.comboTimer = 3.8;
    const mult = 1.0 + Math.min(1.5, this.comboCount * 0.05);

    if (this.comboCount > 0 && this.comboCount % 5 === 0) {
      const p = this.em.player;
      if (p) {
        this.em.addFloatingText(p.x, p.y - 2.0, `🔥 ${this.comboCount} COMBO! (+${Math.round((mult - 1) * 100)}% 공격력)`, '#f97316', 1.8);
        this.em.addEffect(p.x, p.y, 2.5, '#f97316', 0.5);
      }
    }
    return mult;
  }

  updateCombo(dt) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        if (this.comboCount >= 8 && this.em.player) {
          this.em.addFloatingText(this.em.player.x, this.em.player.y - 1.2, `콤보 종료 (최종: ${this.comboCount}타)`, '#94a3b8', 1.2);
        }
        this.comboCount = 0;
      }
    }
  }

  // ==========================================================================
  // G. 4대 원소 극대 궁극기 (Ultimate Elemental Skills)
  // ==========================================================================
  castWhirlwind() {
    const p = this.em.player;
    if (!p) return;
    if (this.skills.whirlwind.cd > 0) {
      this.em.addFloatingText(p.x, p.y - 1.2, `⏳ 질풍의 회오리검 쿨다운 (${Math.ceil(this.skills.whirlwind.cd)}초)`, '#94a3b8', 1.0);
      return;
    }
    this.skills.whirlwind.cd = this.skills.whirlwind.maxCd;

    if (typeof audioMgr !== 'undefined') audioMgr.playWhirlwind();
    this.em.addEffect(p.x, p.y, 6.0, '#38bdf8', 0.9);
    if (this.em.camera) this.em.camera.shake = Math.min(18, (this.em.camera.shake || 0) + 8);

    let hits = 0;
    const dmgMult = this.addCombo(2);
    const baseDmg = Math.round((65 + p.atk * 1.6) * dmgMult);

    const targets = this.em.spatialGrid
      ? this.em.spatialGrid.query(p.x, p.y, 5.8, other => other.hp > 0 && (other.faction === 'monster' || other === this.activeBoss))
      : this.em.entities.filter(other => other.hp > 0 && (other.faction === 'monster' || other === this.activeBoss) && Math.hypot(other.x - p.x, other.y - p.y) <= 5.8);

    for (const other of targets) {
      hits++;
      other.hp -= baseDmg;
      other.combatTarget = p;
      this.em.rallyNearbyAllies(other, p, 10.0);
      this.em.addHitSparks(other.x, other.y, '#38bdf8', 6);
      // 넉백 효과
      const ang = Math.atan2(other.y - p.y, other.x - p.x);
      other.x += Math.cos(ang) * 1.5;
      other.y += Math.sin(ang) * 1.5;
      this.em.addFloatingText(other.x, other.y - 1.0, `🌪️-${baseDmg}`, '#38bdf8', 1.1);
      if (other.hp <= 0) {
        p.kills = (p.kills || 0) + 1;
        p.gold += (other.gold || 50);
        this.addCombo(2);
      }
    }
    this.em.addFloatingText(p.x, p.y - 1.8, `🌪️ [1번] 질풍의 회오리검! (${hits}기 타격)`, '#38bdf8', 1.8);
  }

  castFrostNova() {
    const p = this.em.player;
    if (!p) return;
    if (this.skills.frostNova.cd > 0) {
      this.em.addFloatingText(p.x, p.y - 1.2, `⏳ 혹한의 서리폭풍 쿨다운 (${Math.ceil(this.skills.frostNova.cd)}초)`, '#94a3b8', 1.0);
      return;
    }
    this.skills.frostNova.cd = this.skills.frostNova.maxCd;

    if (typeof audioMgr !== 'undefined') audioMgr.playFrost();
    this.em.addEffect(p.x, p.y, 7.5, '#a5f3fc', 1.2);
    if (this.em.camera) this.em.camera.shake = Math.min(18, (this.em.camera.shake || 0) + 7);

    let hits = 0;
    const dmgMult = this.addCombo(2);
    const baseDmg = Math.round((50 + p.atk * 1.3) * dmgMult);

    const targets = this.em.spatialGrid
      ? this.em.spatialGrid.query(p.x, p.y, 7.2, other => other.hp > 0 && (other.faction === 'monster' || other === this.activeBoss))
      : this.em.entities.filter(other => other.hp > 0 && (other.faction === 'monster' || other === this.activeBoss) && Math.hypot(other.x - p.x, other.y - p.y) <= 7.2);

    for (const other of targets) {
      hits++;
      other.hp -= baseDmg;
      other.combatTarget = p;
      this.em.rallyNearbyAllies(other, p, 10.0);
      other.state = 'frozen';
      other.stateTimer = 4.0;
      this.em.addHitSparks(other.x, other.y, '#a5f3fc', 6);
      this.em.addFloatingText(other.x, other.y - 1.0, `❄️-${baseDmg} [동결 4초]`, '#a5f3fc', 1.4);
      if (other.hp <= 0) {
        p.kills = (p.kills || 0) + 1;
        p.gold += (other.gold || 50);
        this.addCombo(2);
      }
    }
    this.em.addFloatingText(p.x, p.y - 1.8, `❄️ [2번] 혹한의 프로스트 노바! (${hits}기 동결)`, '#7dd3fc', 2.0);
  }

  castMeteorStrike() {
    const p = this.em.player;
    if (!p) return;
    if (this.skills.meteor.cd > 0) {
      this.em.addFloatingText(p.x, p.y - 1.2, `⏳ 멸망의 메테오 쿨다운 (${Math.ceil(this.skills.meteor.cd)}초)`, '#94a3b8', 1.0);
      return;
    }
    this.skills.meteor.cd = this.skills.meteor.maxCd;

    // 플레이어 전방 6타일 위치 타격
    const dirX = p.vx !== 0 ? Math.sign(p.vx) : 1;
    const dirY = p.vy !== 0 ? Math.sign(p.vy) : 0;
    const targetX = Math.max(3, Math.min(this.world.width - 4, p.x + dirX * 6));
    const targetY = Math.max(3, Math.min(this.world.height - 4, p.y + dirY * 6));

    if (typeof audioMgr !== 'undefined') audioMgr.playMeteor();
    this.em.addEffect(targetX, targetY, 8.5, '#ef4444', 1.6);
    this.em.addEffect(targetX, targetY, 4.5, '#fbbf24', 1.2);
    if (this.em.camera) this.em.camera.shake = Math.min(28, (this.em.camera.shake || 0) + 18);

    let hits = 0;
    const dmgMult = this.addCombo(3);
    const baseDmg = Math.round((220 + p.atk * 3.2) * dmgMult);

    const targets = this.em.spatialGrid
      ? this.em.spatialGrid.query(targetX, targetY, 7.0, other => other.hp > 0 && (other.faction === 'monster' || other === this.activeBoss))
      : this.em.entities.filter(other => other.hp > 0 && (other.faction === 'monster' || other === this.activeBoss) && Math.hypot(other.x - targetX, other.y - targetY) <= 7.0);

    for (const other of targets) {
      hits++;
      other.hp -= baseDmg;
      other.combatTarget = p;
      this.em.rallyNearbyAllies(other, p, 10.0);
      this.em.addHitSparks(other.x, other.y, '#f87171', 12);
      this.em.addFloatingText(other.x, other.y - 1.2, `☄️-${baseDmg} [치명타!]`, '#f87171', 1.6);
      if (other.hp <= 0) {
        p.kills = (p.kills || 0) + 1;
        p.gold += (other.gold || 120);
        this.addCombo(3);
      }
    }
    this.em.addFloatingText(p.x, p.y - 2.2, `☄️ [3번] 멸망의 메테오 스트라이크 작렬! (${hits}기 섬멸)`, '#ef4444', 2.4);
    this.em.log('battle', `☄️ 플레이어가 고대 메테오 스트라이크를 낙하시켜 주변을 초토화했습니다! (${hits}기 타격)`, targetX, targetY);
  }

  castUltimateBarrage() {
    const p = this.em.player;
    if (!p) return;
    if (this.skills.barrage.cd > 0) {
      this.em.addFloatingText(p.x, p.y - 1.2, `⏳ 전방위 일제포격 쿨다운 (${Math.ceil(this.skills.barrage.cd)}초)`, '#94a3b8', 1.0);
      return;
    }
    this.skills.barrage.cd = this.skills.barrage.maxCd;

    if (typeof audioMgr !== 'undefined') audioMgr.playCannon();
    this.em.addEffect(p.x, p.y, 4.0, '#f97316', 0.8);
    if (this.em.camera) this.em.camera.shake = Math.min(20, (this.em.camera.shake || 0) + 10);

    const projectileCount = 12;
    const dmgMult = this.addCombo(2);
    const bulletDmg = Math.round((75 + p.atk * 1.1) * dmgMult);

    for (let i = 0; i < projectileCount; i++) {
      const angle = (Math.PI * 2 / projectileCount) * i;
      const vx = Math.cos(angle) * 22;
      const vy = Math.sin(angle) * 22;

      this.em.projectiles.push({
        x: p.x,
        y: p.y,
        vx: vx,
        vy: vy,
        color: '#f97316',
        life: 0.85
      });
    }

    let hits = 0;
    const targets = this.em.spatialGrid
      ? this.em.spatialGrid.query(p.x, p.y, 9.0, other => other.hp > 0 && (other.faction === 'monster' || other === this.activeBoss))
      : this.em.entities.filter(other => other.hp > 0 && (other.faction === 'monster' || other === this.activeBoss) && Math.hypot(other.x - p.x, other.y - p.y) <= 9.0);

    for (const other of targets) {
      hits++;
      other.hp -= bulletDmg;
      other.combatTarget = p;
      this.em.rallyNearbyAllies(other, p, 10.0);
      this.em.addFloatingText(other.x, other.y - 1.0, `💣-${bulletDmg}`, '#fb923c', 1.2);
      if (other.hp <= 0) {
        p.kills = (p.kills || 0) + 1;
        p.gold += (other.gold || 60);
        this.addCombo(2);
      }
    }
    this.em.addFloatingText(p.x, p.y - 1.8, `💣 [4번] 360도 전방위 일제 함포/포격 사격! (${hits}기 피격)`, '#fb923c', 2.0);
  }

  // ==========================================================================
  // H. 낚시 미니게임 (Interactive Fishing System)
  // ==========================================================================
  toggleFishing() {
    const p = this.em.player;
    if (!p) return;

    // 만약 이미 낚시 중이라면 낚아채기 시도
    if (this.fishing.active) {
      this.reelInFish();
      return;
    }

    // 플레이어가 물가나 배 위에 있는지 검사
    const tx = Math.floor(p.x);
    const ty = Math.floor(p.y);
    const tile = this.world.getTile(tx, ty);

    let canFish = p.isShip || (tile === TILE.DOCK || tile === TILE.WATER || tile === TILE.DEEP_WATER);
    let waterX = p.x + 2;
    let waterY = p.y;

    if (!canFish) {
      // 인근 3타일 내 물이 있는지 탐색
      for (let dx = -2; dx <= 2 && !canFish; dx++) {
        for (let dy = -2; dy <= 2 && !canFish; dy++) {
          const t = this.world.getTile(tx + dx, ty + dy);
          if (t === TILE.WATER || t === TILE.DEEP_WATER || t === TILE.DOCK) {
            canFish = true;
            waterX = tx + dx + 0.5;
            waterY = ty + dy + 0.5;
          }
        }
      }
    }

    if (!canFish) {
      this.em.addFloatingText(p.x, p.y - 1.2, '⚠️ 낚시는 강가, 바닷가, 부두 또는 선박 위에서만 가능합니다!', '#f87171', 1.8);
      return;
    }

    // 낚시 개시
    this.fishing.active = true;
    this.fishing.timer = 1.8 + Math.random() * 2.8;
    this.fishing.bite = false;
    this.fishing.biteTimer = 0;
    this.fishing.bobberX = waterX;
    this.fishing.bobberY = waterY;

    if (typeof audioMgr !== 'undefined') audioMgr.playSplash();
    this.em.addEffect(waterX, waterY, 1.5, '#38bdf8', 0.8);
    this.em.addFloatingText(p.x, p.y - 1.5, '🎣 낚싯대를 드리웠습니다... (물결 요동 시 [J]를 누르세요!)', '#38bdf8', 2.5);
    p.fishingLine = { wx: waterX, wy: waterY };
  }

  reelInFish() {
    const p = this.em.player;
    if (!p || !this.fishing.active) return;

    if (this.fishing.bite) {
      // 물고기 낚아채기 성공!
      if (typeof audioMgr !== 'undefined') audioMgr.playFish();
      this.em.addEffect(this.fishing.bobberX, this.fishing.bobberY, 3.5, '#38bdf8', 1.0);

      const roll = Math.random();
      let fishName = '🐟 신선한 대양 은연어';
      let goldGain = 140;
      let extraText = '+140G & HP 120 회복';

      if (roll < 0.12) {
        fishName = '🦑 심해 아기 크라켄의 촉수';
        goldGain = 1200;
        p.atk += 4;
        extraText = '+1200G & 영구 공격력 +4 강화!';
      } else if (roll < 0.35) {
        fishName = '🦪 신비한 흑진주 대왕조개';
        goldGain = 500;
        p.inventory.gems = (p.inventory.gems || 0) + 2;
        extraText = '+500G & 심해 진주 2개 획득!';
      } else if (roll < 0.65) {
        fishName = '🐠 심해 발광 장어';
        goldGain = 280;
        extraText = '+280G & 낚시 숙련도 상승';
      }

      p.gold += goldGain;
      p.hp = Math.min(p.maxHp, p.hp + 120);

      this.em.addFloatingText(p.x, p.y - 1.8, `🎉 대박! [${fishName}] 낚음! (${extraText})`, '#4ade80', 2.8);
      this.em.log('trade', `🎣 플레이어가 바다 낚시로 '${fishName}'을(를) 낚아 올렸습니다! (${extraText})`, p.x, p.y);
    } else {
      // 너무 일찍 당김
      this.em.addFloatingText(p.x, p.y - 1.2, '💨 너무 일찍 당겨 물고기가 놀라 도망쳤습니다!', '#94a3b8', 1.5);
    }

    this.fishing.active = false;
    this.fishing.bite = false;
    p.fishingLine = null;
  }

  updateFishing(dt) {
    if (!this.fishing.active) return;
    const p = this.em.player;
    if (!p) {
      this.fishing.active = false;
      return;
    }

    // 플레이어가 낚시 지점에서 너무 멀리 이동하면 자동 취소
    const dist = Math.hypot(p.x - this.fishing.bobberX, p.y - this.fishing.bobberY);
    if (dist > 5.5) {
      this.fishing.active = false;
      this.fishing.bite = false;
      p.fishingLine = null;
      this.em.addFloatingText(p.x, p.y - 1.0, '낚싯줄이 팽팽해져 회수했습니다.', '#94a3b8', 1.2);
      return;
    }

    if (!this.fishing.bite) {
      this.fishing.timer -= dt;
      if (this.fishing.timer <= 0) {
        this.fishing.bite = true;
        this.fishing.biteTimer = 3.2; // 3.2초 동안 기회 제공
        if (typeof audioMgr !== 'undefined') audioMgr.playSplash();
        this.em.addEffect(this.fishing.bobberX, this.fishing.bobberY, 2.8, '#f43f5e', 1.0);
        this.em.addFloatingText(p.x, p.y - 1.8, '❗❗ 입질이 왔습니다! 지금 [J] 키를 누르세요!', '#f43f5e', 2.2);
      }
    } else {
      this.fishing.biteTimer -= dt;
      if (this.fishing.biteTimer <= 0) {
        // 입질 시간 초과 -> 물고기 도주
        this.fishing.active = false;
        this.fishing.bite = false;
        p.fishingLine = null;
        this.em.addFloatingText(p.x, p.y - 1.2, '💨 물고기가 미끼만 채가고 도망쳤습니다...', '#94a3b8', 1.5);
      }
    }
  }

  // ==========================================================================
  // I. 순간이동 포탈 (Fast Travel Portal)
  // ==========================================================================
  teleportTo(settlementId) {
    const p = this.em.player;
    const s = this.world.settlementMap[settlementId];
    if (!p || !s) return;

    if (typeof audioMgr !== 'undefined') audioMgr.playTeleport();

    // 출발지 이펙트
    this.em.addEffect(p.x, p.y, 6.0, '#a855f7', 1.2);

    // 대상 좌표 (배 탑승 중이고 항구면 portWater 좌표 이용)
    const targetX = (p.isShip && s.portWaterX) ? s.portWaterX : s.x;
    const targetY = (p.isShip && s.portWaterY) ? s.portWaterY : s.y;

    p.x = targetX;
    p.y = targetY;
    p.targetX = targetX;
    p.targetY = targetY;

    // 동료들도 같이 순간이동
    if (this.companionsActive) {
      this.companions.forEach(c => {
        c.x = targetX + (Math.random() - 0.5) * 2;
        c.y = targetY + (Math.random() - 0.5) * 2;
        c.targetX = c.x;
        c.targetY = c.y;
      });
    }

    // 도착지 이펙트
    this.em.addEffect(targetX, targetY, 6.0, '#a855f7', 1.2);
    this.em.addFloatingText(targetX, targetY - 1.8, `🌀 [${s.name}] 순간이동 완료!`, '#c084fc', 2.4);
    this.em.log('quest', `🌀 플레이어가 고대 차원문을 통해 [${s.name}]으로 순간이동했습니다!`, targetX, targetY);
  }

  // ==========================================================================
  // J. 날씨 천벌 낙뢰 (Cataclysm Lightning)
  // ==========================================================================
  updateCataclysm(dt, worldTime) {
    this.cataclysmTimer -= dt;
    if (this.cataclysmTimer <= 0) {
      this.cataclysmTimer = 14.0 + Math.random() * 12.0;

      const p = this.em.player;
      if (!p) return;

      // 플레이어 화면 근처에서 번개 발생
      const lx = Math.max(4, Math.min(this.world.width - 5, p.x + (Math.random() - 0.5) * 28));
      const ly = Math.max(4, Math.min(this.world.height - 5, p.y + (Math.random() - 0.5) * 28));

      if (typeof audioMgr !== 'undefined') audioMgr.playThunder();
      this.em.addEffect(lx, ly, 6.0, '#facc15', 0.8);
      this.em.addEffect(lx, ly, 3.0, '#ffffff', 0.5);

      // 번개 직격 타격 (몬스터에게 대미지 - SpatialGrid O(1) 초고속 조회)
      const struck = this.em.spatialGrid
        ? this.em.spatialGrid.query(lx, ly, 4.5, ent => ent.hp > 0 && ent.faction === 'monster')
        : this.em.entities.filter(ent => ent.hp > 0 && ent.faction === 'monster' && Math.hypot(ent.x - lx, ent.y - ly) < 4.5);
      for (const ent of struck) {
        ent.hp -= 90;
        this.em.addFloatingText(ent.x, ent.y - 1.0, `⚡ 천벌-90`, '#facc15', 1.2);
      }
    }
  }

  // ==========================================================================
  // K. 대장간 룬 제련 & 연금술 제작 시스템 (Crafting System)
  // ==========================================================================
  craftItem(recipeId) {
    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
    const p = this.em.player;
    if (!recipe || !p) return false;

    // 필요 골드 확인
    if (recipe.req.gold && p.gold < recipe.req.gold) {
      this.em.addFloatingText(p.x, p.y - 1.2, `⚠️ 골드가 부족합니다! (${recipe.req.gold}G 필요)`, '#f87171', 1.8);
      return false;
    }
    // 필요 원자재 확인
    for (const [res, count] of Object.entries(recipe.req)) {
      if (res === 'gold') continue;
      if ((p.inventory[res] || 0) < count) {
        const resName = (typeof GOODS_KR !== 'undefined' && GOODS_KR[res]) ? GOODS_KR[res] : res;
        this.em.addFloatingText(p.x, p.y - 1.2, `⚠️ 재료 부족: ${resName} ${count}개 필요! (보유: ${p.inventory[res] || 0})`, '#f87171', 1.8);
        return false;
      }
    }

    // 자원 소모
    if (recipe.req.gold) p.gold -= recipe.req.gold;
    for (const [res, count] of Object.entries(recipe.req)) {
      if (res === 'gold') continue;
      p.inventory[res] -= count;
    }

    // 아이템 효과 적용
    recipe.apply(p, this);
    this.em.gainPlayerExp(80);

    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    this.em.addEffect(p.x, p.y, 6.0, '#facc15', 1.2);
    this.em.addFloatingText(p.x, p.y - 1.8, `🔨 [${recipe.name}] 제작 완료! (+80 EXP)`, '#4ade80', 2.5);
    this.em.log('trade', `🔨 플레이어가 대장간에서 전설의 장비 [${recipe.name}]을(를) 완벽히 제련·제작했습니다!`, p.x, p.y);
    return true;
  }

  // ==========================================================================
  // L. 캐릭터 스탯 포인트 투자 (Stat Allocation)
  // ==========================================================================
  allocateStat(statKey) {
    const p = this.em.player;
    if (!p) return false;
    if ((p.statPoints || 0) <= 0) {
      this.em.addFloatingText(p.x, p.y - 1.0, '⚠️ 남은 스탯 포인트가 없습니다. 레벨업 시 획득 가능합니다.', '#f87171', 1.5);
      return false;
    }

    p.statPoints--;
    p.stats = p.stats || { str: 10, vit: 10, agi: 10, int: 10 };
    p.stats[statKey] = (p.stats[statKey] || 10) + 1;

    let statName = '';
    if (statKey === 'str') {
      p.atk += 3;
      statName = '힘(STR) +1 -> 공격력 +3 증가';
    } else if (statKey === 'vit') {
      p.maxHp += 30;
      p.hp += 30;
      statName = '체력(VIT) +1 -> 최대 생명력 +30 증가';
    } else if (statKey === 'agi') {
      p.speed += 0.08;
      statName = '민첩(AGI) +1 -> 이동속도 +0.08 증가';
    } else if (statKey === 'int') {
      p.atk += 2;
      p.maxHp += 15;
      statName = '지능(INT) +1 -> 주문력 & 생명력 증가';
    }

    if (typeof audioMgr !== 'undefined') audioMgr.playMagic();
    this.em.addEffect(p.x, p.y, 3.5, '#38bdf8', 0.8);
    this.em.addFloatingText(p.x, p.y - 1.5, `💪 [스탯 강화] ${statName}`, '#38bdf8', 1.8);
    return true;
  }

  update(dt, worldTime) {
    // 쿨다운 갱신
    if (this.skills.whirlwind.cd > 0) this.skills.whirlwind.cd -= dt;
    if (this.skills.frostNova.cd > 0) this.skills.frostNova.cd -= dt;
    if (this.skills.meteor.cd > 0) this.skills.meteor.cd -= dt;
    if (this.skills.barrage.cd > 0) this.skills.barrage.cd -= dt;
    if (this.awakeningSkillCd > 0) this.awakeningSkillCd -= dt;

    this.updateCombo(dt);
    this.updateStructures(dt);
    this.updateCompanions(dt);
    this.updateBoss(dt);
    this.updateFishing(dt);
    this.updateCataclysm(dt, worldTime);
    this.updateShrines(dt);
    this.updateContinentalEvents(dt);
    this.updateSettlementGarrisonDefense(dt);
    this.updateColosseum(dt);
    this.updateQuickBelt(dt);

    if (this.em.player) {
      this.checkTreasureInteraction(this.em.player);
      this.checkMonolithInteraction(this.em.player);

      // 🌿 영구 특성: 대지의 축복 (Earth Vitality) 2.2초마다 지속 체력 재생
      if (this.hasTrait('earth_vitality')) {
        this.regenTimer = (this.regenTimer || 0) + dt;
        if (this.regenTimer >= 2.2) {
          this.regenTimer = 0;
          if (this.em.player.hp < this.em.player.maxHp) {
            this.em.player.hp = Math.min(this.em.player.maxHp, this.em.player.hp + 14);
            this.em.addFloatingText(this.em.player.x, this.em.player.y - 1.2, '+14 HP 🌿', '#4ade80', 0.8);
          }
        }
      }
    }
  }

  // ==========================================================================
  // L. 주점 주사위 도박 미니게임 (Tavern Dice Gambling)
  // ==========================================================================
  playTavernDice(bet = 50) {
    const p = this.em.player;
    if (!p) return false;
    if (p.gold < bet) {
      this.em.addFloatingText(p.x, p.y - 1.2, `⚠️ 판돈이 부족합니다! (${bet}G 필요)`, '#f87171', 1.8);
      return false;
    }

    if (typeof audioMgr !== 'undefined') audioMgr.playDiceRoll();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const playerTotal = d1 + d2;

    const op1 = Math.floor(Math.random() * 6) + 1;
    const op2 = Math.floor(Math.random() * 6) + 1;
    const opponentTotal = op1 + op2;

    if (playerTotal > opponentTotal) {
      const winnings = bet * 2;
      p.gold += bet;
      this.em.addFloatingText(p.x, p.y - 1.8, `🎲 주사위 대승! [${playerTotal} vs ${opponentTotal}] (+${winnings}G)`, '#4ade80', 2.5);
      this.em.addEffect(p.x, p.y, 4.0, '#facc15', 0.8);
      if (typeof audioMgr !== 'undefined') audioMgr.playCoin();
      this.em.log('trade', `🎲 [${p.name}]이(가) 주점에서 주사위 승부로 ${winnings}G 거액을 획득했습니다! (${playerTotal} > ${opponentTotal})`, p.x, p.y);
    } else if (playerTotal === opponentTotal) {
      this.em.addFloatingText(p.x, p.y - 1.5, `🎲 무승부! [${playerTotal} vs ${opponentTotal}] (판돈 환급)`, '#94a3b8', 2.0);
    } else {
      p.gold -= bet;
      this.em.addFloatingText(p.x, p.y - 1.5, `🎲 주사위 패배... [${playerTotal} vs ${opponentTotal}] (-${bet}G)`, '#f87171', 2.0);
      this.em.log('trade', `🎲 [${p.name}]이(가) 주점 주사위 내기에서 ${bet}G를 잃었습니다. (${playerTotal} < ${opponentTotal})`, p.x, p.y);
    }
    return true;
  }

  // ==========================================================================
  // M. 모닥불 휴식 & 야외 요리 시스템 (Campfire Cooking & Rest)
  // ==========================================================================
  interactCampfire(p) {
    if (!p) p = this.em.player;
    if (!p) return false;

    // 🏕️ 모닥불 요리 & 휴식 모션 활성화 (2.2초 동안 꼬치구이 애니메이션 및 지글거리는 연기)
    p.isCooking = true;
    p.cookingTimer = 2.2;

    // 즉시 기본 체력 40% 회복
    const heal = Math.round(p.maxHp * 0.4);

    // 🍖 [포만감(Well-Fed) 강화 버프]: 120초간 최대 HP +25%, 이동 속도 +15%, 초당 지속 재생
    p.wellFedTimer = 120;
    if (!p.baseMaxHp) p.baseMaxHp = p.maxHp;
    const hpBonus = Math.round(p.baseMaxHp * 0.25);
    p.wellFedHpBonus = hpBonus;
    p.maxHp = p.baseMaxHp + hpBonus;
    p.hp = Math.min(p.maxHp, p.hp + heal + hpBonus);

    if (typeof audioMgr !== 'undefined') {
      audioMgr.playCookSizzle();
      if (audioMgr.playLevelUp) audioMgr.playLevelUp();
    }
    this.em.addEffect(p.x, p.y, 4.0, '#f97316', 0.9);
    this.em.addShockwave(p.x, p.y, 3.2, '#f59e0b', 0.4);
    this.em.addHitSparks(p.x, p.y, '#fde047', 16);
    this.em.addFloatingText(p.x, p.y - 1.8, '🍖 [WELL-FED BUFF] HP+25% · 속도+15% (120초)!', '#facc15', 2.8);
    this.em.addFloatingText(p.x, p.y - 1.1, `🔥 모닥불 직화 구이 (+${heal} HP 회복)`, '#4ade80', 2.0);
    this.em.log('quest', `🍖 [${p.name}]이(가) 모닥불에서 꼬치 요리를 즐겨 120초 동안 [포만감(Well-Fed)] 강화 버프를 획득했습니다!`, p.x, p.y);
    return true;
  }

  // ==========================================================================
  // N. 고대 시련의 사당 & 영구 유물 특성 시스템 (Ancient Shrines & Relic Trials)
  // ==========================================================================
  hasTrait(traitId) {
    return this.unlockedTraits && this.unlockedTraits.includes(traitId);
  }

  checkNearbyShrine(player) {
    if (!player || !this.ancientShrines) return null;
    for (const sh of this.ancientShrines) {
      if (Math.hypot(sh.x - player.x, sh.y - player.y) <= 4.8) {
        return sh;
      }
    }
    return null;
  }

  startShrineTrial(shrineId) {
    const shrine = this.ancientShrines.find(s => s.id === shrineId);
    if (!shrine) return;
    if (shrine.cleared) {
      this.em.addFloatingText(shrine.x, shrine.y - 1.5, `✨ [${shrine.name}] 이미 시련을 극복한 성소입니다. (특성 활성 중)`, '#fde047', 1.8);
      return;
    }
    if (shrine.activeTrial) {
      this.em.addFloatingText(shrine.x, shrine.y - 1.5, '⚠️ 성소의 시련이 이미 진행 중입니다! 수호령을 격퇴하세요!', '#f87171', 1.8);
      return;
    }

    shrine.activeTrial = true;
    shrine.guardiansLeft = 3;
    shrine.guardians = [];

    // 시련 개방 연출
    if (window.audioMgr) window.audioMgr.playFanfare();
    if (window.renderer) {
      window.renderer.screenFlashTimer = 0.15;
      window.renderer.screenFlashColor = shrine.color;
    }
    this.em.addEffect(shrine.x, shrine.y, 14.0, shrine.color, 1.8);
    this.em.addFloatingText(shrine.x, shrine.y - 2.2, `🏛️ [${shrine.name}] 고대 봉인 해제! 수호령 3기 격퇴 시련 개시!`, shrine.color, 3.0);
    this.em.log('quest', `🏛️ 플레이어가 [${shrine.name}]의 봉인을 깨뜨리고 고대 시련에 도전합니다!`, shrine.x, shrine.y);

    // 수호령 3기 스폰
    const p = this.em.player;
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i;
      const gx = shrine.x + Math.cos(angle) * 3.5;
      const gy = shrine.y + Math.sin(angle) * 3.5;
      const guardian = this.em.createEntity({
        name: `고대 ${shrine.name} 수호령 ${i + 1}호`,
        race: 'monster',
        role: 'monster',
        monsterType: 'shrine_guardian',
        customIcon: shrine.icon,
        faction: 'monster',
        homeId: 'shrine',
        x: gx,
        y: gy,
        hp: 420,
        maxHp: 420,
        atk: 32,
        gold: 150,
        scale: 1.4,
        projColor: shrine.color,
        thought: `🏛️ [${shrine.name}]의 신성한 성역을 수호 중!`
      });
      guardian.shrineId = shrine.id;
      guardian.combatTarget = p;
      shrine.guardians.push(guardian);
      this.em.addEffect(gx, gy, 4.0, shrine.color, 0.8);
    }
  }

  updateShrines(dt) {
    if (!this.ancientShrines) return;
    for (const sh of this.ancientShrines) {
      if (sh.activeTrial && !sh.cleared) {
        let alive = 0;
        for (const g of sh.guardians) {
          if (g && g.hp > 0) alive++;
        }
        sh.guardiansLeft = alive;
        if (alive <= 0) {
          this.completeShrineTrial(sh);
        }
      }
    }
  }

  completeShrineTrial(shrine) {
    shrine.activeTrial = false;
    shrine.cleared = true;
    if (!this.unlockedTraits.includes(shrine.traitId)) {
      this.unlockedTraits.push(shrine.traitId);
    }

    const p = this.em.player;
    if (p) {
      p.gold += 1500;
      p.fame = (p.fame || 0) + 100;
      if (shrine.traitId === 'earth_vitality') {
        p.maxHp += 150;
        p.hp = p.maxHp;
      } else if (shrine.traitId === 'solar_aura') {
        p.atk += 25;
      } else if (shrine.traitId === 'windstrider') {
        p.speed += 0.4;
      } else if (shrine.traitId === 'tide_sovereign') {
        p.atk += 20;
        p.speed += 0.35;
      } else if (shrine.traitId === 'aether_wings') {
        p.speed += 0.5;
        p.atk += 22;
      }
    }

    if (window.audioMgr) window.audioMgr.playFanfare();
    if (window.renderer) {
      window.renderer.screenFlashTimer = 0.25;
      window.renderer.screenFlashColor = '#facc15';
    }
    this.em.addEffect(shrine.x, shrine.y, 20.0, '#facc15', 3.0);
    this.em.addFloatingText(shrine.x, shrine.y - 3.0, `🌟 [${shrine.name}] 시련 완수! [${shrine.traitName}] 영구 특성 획득! (+1500G, 명성+100)`, '#fde047', 4.5);
    this.em.log('quest', `👑 플레이어가 [${shrine.name}]의 시련을 극복하고 전설의 고대 유물 특성 '${shrine.traitName}'을(를) 영구 각성했습니다!`, shrine.x, shrine.y);
  }

  // ==========================================================================
  // J. 대륙 긴급 돌발 이벤트 시스템 (Dynamic Continental World Events)
  // ==========================================================================
  updateContinentalEvents(dt) {
    if (this.activeContinentalEvent) {
      const evt = this.activeContinentalEvent;
      evt.timer -= dt;

      // 생존한 침공 몬스터 수 체크
      if (evt.monsters && evt.monsters.length > 0) {
        evt.monstersLeft = evt.monsters.filter(m => m.hp > 0).length;
      }

      this.updateContinentalEventUI();

      // 승리 조건: 모든 침공 몬스터 처치 (또는 축제 시간 만료)
      if (evt.type === 'golden_harvest') {
        if (evt.timer <= 0) {
          this.completeContinentalEvent(true);
        }
      } else {
        if (evt.monstersLeft === 0) {
          this.completeContinentalEvent(true);
        } else if (evt.timer <= 0) {
          this.completeContinentalEvent(false); // 시간 초과 실패
        }
      }
    } else {
      this.hideContinentalEventUI();
      this.worldEventTimer -= dt;
      if (this.worldEventTimer <= 0) {
        this.triggerRandomContinentalEvent();
      }
    }
  }

  triggerRandomContinentalEvent() {
    this.worldEventTimer = 140.0; // 다음 이벤트까지 140초
    const types = ['pirate_raid', 'void_rift', 'golden_harvest', 'caravan_escort'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const sMap = this.world.settlementMap || {};

    if (chosenType === 'pirate_raid') {
      const loc = sMap.bluewave || { x: 1950, y: 1680 };
      const eventMonsters = [];
      // 해적 습격대 4명 소환
      for (let i = 0; i < 4; i++) {
        const ox = (Math.random() - 0.5) * 6;
        const oy = (Math.random() - 0.5) * 6;
        const pMonster = this.em.spawnMonsterAt(loc.x + ox, loc.y + oy, 'orc');
        if (pMonster) {
          pMonster.name = i === 0 ? '🏴‍☠️ 캡틴 블랙비어드' : '🏴‍☠️ 검은돛 해적 약탈자';
          pMonster.maxHp = i === 0 ? 650 : 280;
          pMonster.hp = pMonster.maxHp;
          pMonster.atk = i === 0 ? 32 : 18;
          pMonster.gold = i === 0 ? 800 : 200;
          pMonster.color = '#7f1d1d';
          eventMonsters.push(pMonster);
        }
      }
      this.activeContinentalEvent = {
        type: 'pirate_raid',
        name: '🏴‍☠️ 푸른파도 항구 해적 함대 기습',
        desc: '악명 높은 캡틴 블랙비어드의 해적 함대가 항구를 포격하고 있습니다! 해적단을 섬멸하십시오.',
        icon: '🏴‍☠️',
        x: loc.x,
        y: loc.y,
        timer: 110.0,
        maxTimer: 110.0,
        monsters: eventMonsters,
        monstersLeft: eventMonsters.length
      };
      if (typeof audioMgr !== 'undefined') audioMgr.playBossHorn();
      this.em.addFloatingText(loc.x, loc.y - 2, '🏴‍☠️ 긴급: 푸른파도 항구 해적 습격 발생!', '#f87171', 3.0);
      this.em.log('battle', '🏴‍☠️ [대륙 긴급 이벤트] 푸른파도 항구에 해적 대함대가 출현하여 항구를 포격하기 시작했습니다!', loc.x, loc.y);
    } else if (chosenType === 'void_rift') {
      const loc = { x: 2600, y: 1550 };
      const eventMonsters = [];
      // 공허의 네더 마수 4명 소환
      for (let i = 0; i < 4; i++) {
        const ox = (Math.random() - 0.5) * 6;
        const oy = (Math.random() - 0.5) * 6;
        const pMonster = this.em.spawnMonsterAt(loc.x + ox, loc.y + oy, 'lich');
        if (pMonster) {
          pMonster.name = i === 0 ? '🌋 차원의 네더 보이드로드' : '🔮 공허의 차원망령';
          pMonster.maxHp = i === 0 ? 750 : 310;
          pMonster.hp = pMonster.maxHp;
          pMonster.atk = i === 0 ? 35 : 20;
          pMonster.gold = i === 0 ? 950 : 250;
          pMonster.color = '#7e22ce';
          eventMonsters.push(pMonster);
        }
      }
      this.activeContinentalEvent = {
        type: 'void_rift',
        name: '🌋 공허의 네더 균열 침공',
        desc: '차원의 틈새가 벌어져 보이드로드와 네더 군단이 침공했습니다! 균열 군주를 처단하십시오.',
        icon: '🌋',
        x: loc.x,
        y: loc.y,
        timer: 110.0,
        maxTimer: 110.0,
        monsters: eventMonsters,
        monstersLeft: eventMonsters.length
      };
      if (typeof audioMgr !== 'undefined') audioMgr.playBossHorn();
      this.em.addEffect(loc.x, loc.y, 8.0, '#a855f7', 1.2);
      this.em.addFloatingText(loc.x, loc.y - 2, '🌋 긴급: 공허의 네더 차원 균열 개방!', '#c084fc', 3.0);
      this.em.log('battle', '🌋 [대륙 긴급 이벤트] 대륙 동부 황무지에 공허의 네더 차원 균열이 열려 마수가 쏟아져 나옵니다!', loc.x, loc.y);
    } else if (chosenType === 'caravan_escort') {
      const loc = { x: 1980, y: 1520 };
      const eventMonsters = [];
      for (let i = 0; i < 5; i++) {
        const ox = (Math.random() - 0.5) * 8;
        const oy = (Math.random() - 0.5) * 8;
        const pMonster = this.em.spawnMonsterAt(loc.x + ox, loc.y + oy, 'orc');
        if (pMonster) {
          pMonster.name = i === 0 ? '⚔️ 붉은두건 산적두목 바르가스' : '🗡️ 붉은두건 도적 약탈병';
          pMonster.maxHp = i === 0 ? 820 : 320;
          pMonster.hp = pMonster.maxHp;
          pMonster.atk = i === 0 ? 38 : 22;
          pMonster.gold = i === 0 ? 1100 : 250;
          pMonster.color = '#dc2626';
          eventMonsters.push(pMonster);
        }
      }
      this.activeContinentalEvent = {
        type: 'caravan_escort',
        name: '👑 왕실 황금 무역 상단 호위 & 산적단 기습',
        desc: '왕도와 대항구를 오가는 왕실 황금 상단이 산적단의 매복 기습을 받았습니다! 상단을 구출하십시오.',
        icon: '👑',
        x: loc.x,
        y: loc.y,
        timer: 110.0,
        maxTimer: 110.0,
        monsters: eventMonsters,
        monstersLeft: eventMonsters.length
      };
      if (typeof audioMgr !== 'undefined') audioMgr.playBossHorn();
      this.em.addEffect(loc.x, loc.y, 8.0, '#f59e0b', 1.2);
      this.em.addFloatingText(loc.x, loc.y - 2, '👑 긴급: 왕실 황금 상단 산적 매복 기습 발생!', '#f59e0b', 3.0);
      this.em.log('battle', '👑 [대륙 긴급 이벤트] 대륙 황금 대로에서 왕실 황금 무역 상단이 붉은두건 산적단의 기습을 당했습니다!', loc.x, loc.y);
    } else {
      // golden_harvest
      const loc = sMap.solaris || { x: 1960, y: 1400 };
      this.activeContinentalEvent = {
        type: 'golden_harvest',
        name: '🌾 천상 대풍년 & 황금 유성우',
        desc: '대륙 전역에 황금 유성우가 내리며 대풍년 축제가 시작됩니다! (이동속도 +35% & 2배 무역 이윤)',
        icon: '🌾',
        x: loc.x,
        y: loc.y,
        timer: 80.0,
        maxTimer: 80.0,
        monsters: [],
        monstersLeft: 0
      };
      if (this.em.player) {
        this.em.player.boostTimer = Math.max(this.em.player.boostTimer || 0, 75.0);
      }
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
      this.em.addEffect(loc.x, loc.y, 10.0, '#facc15', 1.2);
      this.em.addFloatingText(loc.x, loc.y - 2, '✨ 축복: 대륙 천상 대풍년 축제 개막!', '#fde047', 3.0);
      this.em.log('harvest', '🌾 [대륙 긴급 이벤트] 여신의 황금 유성우 축복으로 전 대륙에 대풍년 축제가 열렸습니다!', loc.x, loc.y);
    }
  }

  completeContinentalEvent(success) {
    if (!this.activeContinentalEvent) return;
    const evt = this.activeContinentalEvent;
    const p = this.em.player;

    if (success) {
      if (p) {
        const rewardGold = evt.type === 'golden_harvest' ? 1200 : (evt.type === 'caravan_escort' ? 2500 : 2000);
        const rewardFame = evt.type === 'caravan_escort' ? 95 : 60;
        p.gold += rewardGold;
        p.fame = (p.fame || 0) + rewardFame;
        if (this.em.addFloatingText) {
          this.em.addFloatingText(p.x, p.y - 2, `🎉 대륙 이벤트 승리! +${rewardGold}G / +${rewardFame} 명성`, '#4ade80', 2.8);
        }
      }
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
      this.em.log('quest', `🏆 [대륙 이벤트 완료] [${evt.name}]을 완벽하게 진압/달성하여 왕국의 명성을 드높였습니다!`, evt.x, evt.y);
    } else {
      this.em.log('quest', `⚠️ [대륙 이벤트 종료] [${evt.name}] 제한 시간이 만료되어 적들이 퇴각했습니다.`, evt.x, evt.y);
    }

    this.hideContinentalEventUI();
    this.activeContinentalEvent = null;
  }

  updateContinentalEventUI() {
    const banner = document.getElementById('worldEventBanner');
    if (!banner) return;
    if (this.activeContinentalEvent && this.activeContinentalEvent.timer > 0) {
      banner.classList.remove('hidden');
      const iconEl = document.getElementById('eventIcon');
      const nameEl = document.getElementById('eventName');
      const descEl = document.getElementById('eventDesc');
      const timerEl = document.getElementById('eventTimer');

      const evt = this.activeContinentalEvent;
      if (iconEl) iconEl.textContent = evt.icon || '⚡';
      if (nameEl) nameEl.textContent = evt.name;
      if (descEl) {
        if (evt.type === 'golden_harvest') {
          descEl.textContent = `축복 지속 시간: 잔여 ${Math.ceil(evt.timer)}초 (전 대륙 무역 이윤 2배 & 이동속도 +35%)`;
        } else {
          descEl.textContent = `${evt.desc} [잔여 적: ${evt.monstersLeft || 0}마리]`;
        }
      }
      if (timerEl) timerEl.textContent = `⏱️ ${Math.ceil(evt.timer)}s`;
    } else {
      banner.classList.add('hidden');
    }
  }

  hideContinentalEventUI() {
    const banner = document.getElementById('worldEventBanner');
    if (banner) banner.classList.add('hidden');
  }

  // ==========================================================================
  // K. 왕국 요새 & 도시 주둔군 감시탑 자동 방어 사격 (Settlement Garrison Defense)
  // ==========================================================================
  updateSettlementGarrisonDefense(dt) {
    this.garrisonDefenseTimer -= dt;
    if (this.garrisonDefenseTimer > 0) return;
    this.garrisonDefenseTimer = 1.6;

    if (!this.world || !this.world.settlements) return;

    for (const s of this.world.settlements) {
      if (s.faction !== 'kingdom' && s.faction !== 'allied') continue;

      // 주둔지 중심 반경 9.5 타일 내 침공 몬스터 탐색
      const target = this.em.spatialGrid
        ? this.em.spatialGrid.findNearest(s.x, s.y, 9.5, e => e.faction === 'monster' && e.hp > 0)
        : null;

      if (target) {
        const dist = Math.hypot(target.x - s.x, target.y - s.y);
        const dmg = 42 + Math.floor(Math.random() * 18);
        target.hp -= dmg;
        const angle = Math.atan2(target.y - s.y, target.x - s.x);

        // 방어 성벽 화살 투사체 발사
        this.em.projectiles.push({
          x: s.x,
          y: s.y,
          vx: Math.cos(angle) * 22,
          vy: Math.sin(angle) * 22,
          color: '#facc15',
          life: dist / 22
        });

        this.em.addFloatingText(target.x, target.y - 0.8, `🏹-${dmg} (성벽 경비대)`, '#facc15', 1.0);

        if (target.hp <= 0 && this.em.player) {
          this.em.player.gold += Math.floor(target.gold * 0.5);
          this.em.addFloatingText(s.x, s.y - 1.2, `🛡️ [${s.name}] 경비대 요격 성공!`, '#60a5fa', 1.6);
        }
        break; // 프레임당 거점별 1발씩 집중
      }
    }
  }

  // ==========================================================================
  // L. 고대 심연 던전 카타콤 원정 시스템 (Ancient Dungeon Expeditions)
  // ==========================================================================
  checkNearbyDungeon(player) {
    if (!player || !this.dungeons) return null;
    return this.dungeons.find(dg => Math.hypot(dg.x - player.x, dg.y - player.y) <= 4.5);
  }

  enterDungeonExpedition(dungeonId) {
    const dg = this.dungeons.find(d => d.id === dungeonId);
    const p = this.em.player;
    if (!dg || !p) return false;

    if (p.level < dg.levelReq) {
      this.em.addFloatingText(p.x, p.y - 1.5, `⚠️ 입장 불가: 권장 레벨 Lv.${dg.levelReq} 이상 필요!`, '#f87171', 2.0);
      return false;
    }

    this.activeDungeon = dg;
    dg.active = true;

    // 플레이어를 던전 포탈 입구로 정렬
    p.x = dg.x;
    p.y = dg.y + 2.5;
    p.targetX = p.x;
    p.targetY = p.y;

    // 던전 보스 및 엘리트 수호병 4마리 스폰
    const mobType = dg.id === 'dungeon_necropolis' ? 'skeleton' : (dg.id === 'dungeon_balrog' ? 'dragonkin' : 'golem');
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const sx = dg.x + Math.cos(angle) * 3.5;
      const sy = dg.y + Math.sin(angle) * 3.5;
      const mob = this.em.spawnMonsterAt(sx, sy, mobType);
      if (mob) {
        mob.name = `${dg.name} 심연 수호병`;
        mob.maxHp = 350;
        mob.hp = mob.maxHp;
        mob.atk = 24;
        mob.color = dg.color;
      }
    }

    // 전설 던전 보스 스폰
    const boss = this.em.spawnMonsterAt(dg.x, dg.y - 1.5, dg.id === 'dungeon_balrog' ? 'dragonkin' : 'lich');
    if (boss) {
      boss.name = dg.bossName;
      boss.maxHp = dg.bossHp;
      boss.hp = dg.bossHp;
      boss.atk = dg.bossAtk;
      boss.scale = 1.6;
      boss.color = dg.color;
      boss.isDungeonBoss = true;
      boss.dungeonId = dg.id;
      boss.gold = dg.goldReward;
      dg.bossEntity = boss;
    }

    if (typeof audioMgr !== 'undefined') audioMgr.playBossHorn();
    if (window.renderer) {
      window.renderer.screenFlashTimer = 0.3;
      window.renderer.screenFlashColor = dg.color;
    }
    this.em.addEffect(dg.x, dg.y, 16.0, dg.color, 1.8);
    this.em.addFloatingText(dg.x, dg.y - 2.5, `⚔️ [${dg.name}] 심연 보스전 돌입!`, dg.color, 3.2);
    this.em.log('battle', `💀 [던전 원정 개시] 플레이어가 [${dg.name}]에 진입하여 [${dg.bossName}]과의 사투를 시작했습니다!`, dg.x, dg.y);
    return true;
  }

  checkDungeonBossDefeat(monster) {
    if (!monster || !monster.isDungeonBoss || !monster.dungeonId) return;
    const dg = this.dungeons.find(d => d.id === monster.dungeonId);
    if (!dg) return;

    dg.cleared = true;
    this.activeDungeon = null;
    const p = this.em.player;

    if (p) {
      p.gold += dg.goldReward;
      p.fame = (p.fame || 0) + dg.fameReward;
      // 유물 보상 자동 지급
      if (dg.relicReward) {
        const slot = dg.relicReward.slot || 'relic';
        this.equipment[slot] = dg.relicReward;
        this.recalculateEquipmentStats();
        this.em.addFloatingText(p.x, p.y - 2.5, `👑 신화 유물 획득: [${dg.relicReward.name}]! (+${dg.goldReward}G / 명성+${dg.fameReward})`, '#facc15', 4.0);
      }
    }

    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    if (window.renderer) {
      window.renderer.screenFlashTimer = 0.4;
      window.renderer.screenFlashColor = '#facc15';
    }
    this.em.addEffect(dg.x, dg.y, 22.0, '#facc15', 3.0);
    this.em.log('quest', `🏆 [던전 토벌 완료] [${dg.name}]의 군주 [${dg.bossName}]을 격파하고 전설의 유물 [${dg.relicReward.name}]을 차지했습니다!`, dg.x, dg.y);
  }

  // ==========================================================================
  // M. 용병 길드 주점 & 동료 특수 클래스 고용 (Mercenary Guild Tavern)
  // ==========================================================================
  recruitMercenary(classId) {
    const p = this.em.player;
    const merc = this.mercenaries.find(m => m.id === classId);
    if (!p || !merc) return { ok: false, reason: '유효하지 않은 용병입니다.' };

    if (!this.recruitedMercenaryIds.includes(classId)) {
      if (p.gold < merc.cost) {
        return { ok: false, reason: `골드가 부족합니다! (필요: ${merc.cost}G / 보유: ${p.gold}G)` };
      }
      p.gold -= merc.cost;
      this.recruitedMercenaryIds.push(classId);
    }

    // 동료 스쿼드 갱신
    this.rebuildCompanionSquad();
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    this.em.addFloatingText(p.x, p.y - 1.5, `👥 [${merc.name}] 호위단 합류 완료!`, merc.color, 2.2);
    this.em.log('trade', `🍺 [용병 길드 고용] 플레이어가 주점에서 [${merc.name}]을 영입하여 호위 분대에 배치했습니다.`, p.x, p.y);
    return { ok: true, name: merc.name };
  }

  rebuildCompanionSquad() {
    const p = this.em.player;
    if (!p) return;

    // 기존 동료 위치 재구성
    this.companions = [];
    this.recruitedMercenaryIds.forEach((id, idx) => {
      const def = this.mercenaries.find(m => m.id === id);
      if (!def) return;
      const angle = (idx / this.recruitedMercenaryIds.length) * Math.PI * 2;
      const comp = this.em.createEntity({
        name: def.name,
        race: 'human',
        role: def.role,
        subClass: def.name,
        customIcon: def.icon,
        faction: 'kingdom',
        homeId: 'solaris',
        x: p.x + Math.cos(angle) * 2,
        y: p.y + Math.sin(angle) * 2,
        speed: 2.7,
        maxHp: def.hp,
        hp: def.hp,
        atk: def.atk,
        color: def.color,
        isCompanion: true
      });
      this.companions.push(comp);
    });
    this.companionsActive = true;
  }

  // ==========================================================================
  // 15. ✨ 영웅 2차 각성 및 마스터리 전직 시스템
  // ==========================================================================
  selectAwakening(classId) {
    const p = this.em.player;
    if (!p) return { ok: false, msg: '플레이어를 찾을 수 없습니다.' };
    const awk = AWAKENING_CLASSES.find(c => c.id === classId);
    if (!awk) return { ok: false, msg: '존재하지 않는 각성 클래스입니다.' };

    const oldAwakening = this.awakening;
    if (oldAwakening) {
      if (oldAwakening.id === 'blademaster') {
        p.atk -= 35;
      } else if (oldAwakening.id === 'archmage') {
        p.atk -= 45;
      } else if (oldAwakening.id === 'skyhunter') {
        p.speed -= 0.6;
        p.atk -= 30;
      }
    }

    this.awakening = awk;
    if (awk.id === 'blademaster') {
      p.atk += 35;
    } else if (awk.id === 'archmage') {
      p.atk += 45;
    } else if (awk.id === 'skyhunter') {
      p.speed += 0.6;
      p.atk += 30;
    }

    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    this.em.addEffect(p.x, p.y, 8.0, awk.color, 1.8);
    this.em.addShockwave(p.x, p.y, 7.5, awk.color, 0.7);
    this.em.addHitSparks(p.x, p.y, '#ffffff', 18);
    this.em.addFloatingText(p.x, p.y - 2.0, `✨ [영웅 2차 각성] ${awk.title} 달성!`, awk.color, 3.0);
    this.em.log('quest', `✨ [영웅 2차 각성] 플레이어가 [${awk.title}]으로 전직하여 강력한 각성 오라와 각성기(G키)를 획득했습니다!`, p.x, p.y);

    return { ok: true, class: awk };
  }

  castAwakeningSkill() {
    const p = this.em.player;
    if (!p || !this.awakening) return;
    if (this.awakeningSkillCd > 0) {
      this.em.addFloatingText(p.x, p.y - 1.2, `⏳ 각성기 쿨다운 (${this.awakeningSkillCd.toFixed(1)}초)`, '#94a3b8', 1.0);
      return;
    }

    const awk = this.awakening;
    const maxCd = awk.id === 'archmage' ? awk.skillCd * 0.6 : awk.skillCd;
    this.awakeningSkillCd = maxCd;

    if (awk.id === 'blademaster') {
      const targets = this.em.spatialGrid
        ? this.em.spatialGrid.query(p.x, p.y, 8.5, ent => ent !== p && ent.hp > 0 && this.em.isHostile(p, ent))
        : this.em.entities.filter(ent => ent !== p && ent.hp > 0 && this.em.isHostile(p, ent) && Math.hypot(ent.x - p.x, ent.y - p.y) <= 8.5);

      if (typeof audioMgr !== 'undefined') audioMgr.playWhirlwind();
      this.em.addShockwave(p.x, p.y, 7.0, '#f59e0b', 0.6);
      this.em.addFloatingText(p.x, p.y - 2.2, '⚔️ [천공 멸신 검무: 8연속 참격!]', '#f59e0b', 2.0);

      const slashTargets = targets.slice(0, 8);
      slashTargets.forEach((t, idx) => {
        setTimeout(() => {
          if (!t || t.hp <= 0) return;
          const dmg = Math.round(p.atk * 2.8 + 120);
          t.hp -= dmg;
          t.hitTimer = 0.35;
          this.em.addEffect(t.x, t.y, 3.2, '#facc15', 0.4);
          this.em.addHitSparks(t.x, t.y, '#f59e0b', 10);
          this.em.addShockwave(t.x, t.y, 3.5, '#f59e0b', 0.35);
          this.em.addFloatingText(t.x, t.y - 1.0, `💥 멸신참! -${dmg}`, '#fde047', 1.2);
          if (t.hp <= 0 && this.checkDungeonBossDefeat) this.checkDungeonBossDefeat(t);
        }, idx * 65);
      });

      if (this.em.camera) this.em.camera.shake = 16;
    } else if (awk.id === 'archmage') {
      if (typeof audioMgr !== 'undefined') audioMgr.playMeteor();
      this.em.addShockwave(p.x, p.y, 9.5, '#a855f7', 0.8);
      this.em.addShockwave(p.x, p.y, 6.0, '#c084fc', 0.5);
      this.em.addEffect(p.x, p.y, 8.5, '#7e22ce', 1.4);
      this.em.addFloatingText(p.x, p.y - 2.2, '🔮 [시공간 왜곡 초신성 대폭발!]', '#c084fc', 2.2);

      const targets = this.em.spatialGrid
        ? this.em.spatialGrid.query(p.x, p.y, 9.5, ent => ent !== p && ent.hp > 0 && this.em.isHostile(p, ent))
        : this.em.entities.filter(ent => ent !== p && ent.hp > 0 && this.em.isHostile(p, ent) && Math.hypot(ent.x - p.x, ent.y - p.y) <= 9.5);

      targets.forEach(t => {
        const dx = p.x - t.x;
        const dy = p.y - t.y;
        const d = Math.hypot(dx, dy) || 1;
        t.x += (dx / d) * 2.2;
        t.y += (dy / d) * 2.2;
        const dmg = Math.round(p.atk * 3.4 + 160);
        t.hp -= dmg;
        t.frozenTimer = 2.5;
        t.hitTimer = 0.35;
        this.em.addHitSparks(t.x, t.y, '#e9d5ff', 8);
        this.em.addFloatingText(t.x, t.y - 1.0, `❄️ 초신성 붕괴! -${dmg} (빙결)`, '#e9d5ff', 1.5);
        if (t.hp <= 0 && this.checkDungeonBossDefeat) this.checkDungeonBossDefeat(t);
      });

      if (this.em.camera) this.em.camera.shake = 18;
    } else if (awk.id === 'skyhunter') {
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
      this.em.addShockwave(p.x, p.y, 8.0, '#10b981', 0.65);
      this.em.addFloatingText(p.x, p.y - 2.2, '🏹 [태양의 유성 화살 폭격 개시!]', '#34d399', 2.2);

      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          if (!p) return;
          const ox = (Math.random() - 0.5) * 16;
          const oy = (Math.random() - 0.5) * 16;
          const ax = p.x + ox;
          const ay = p.y + oy;
          this.em.addEffect(ax, ay, 2.5, '#facc15', 0.4);
          this.em.addShockwave(ax, ay, 2.8, '#34d399', 0.3);
          this.em.addHitSparks(ax, ay, '#fef08a', 6);

          const hitTargets = this.em.spatialGrid
            ? this.em.spatialGrid.query(ax, ay, 2.5, ent => ent !== p && ent.hp > 0 && this.em.isHostile(p, ent))
            : [];
          hitTargets.forEach(t => {
            const dmg = Math.round(p.atk * 1.6 + 60);
            t.hp -= dmg;
            t.hitTimer = 0.2;
            this.em.addFloatingText(t.x, t.y - 0.8, `🏹-${dmg}`, '#34d399', 0.9);
            if (t.hp <= 0 && this.checkDungeonBossDefeat) this.checkDungeonBossDefeat(t);
          });
        }, i * 90);
      }

      if (this.em.camera) this.em.camera.shake = 12;
    }
  }

  // ==========================================================================
  // P. ⚡ 룬 제련 & 인챈트 시스템 (Runeforge Enchantment System)
  // ==========================================================================
  socketRune(slot, runeId) {
    if (!['weapon', 'shield', 'armor'].includes(slot)) return false;
    const rune = this.runestones.find(r => r.id === runeId);
    if (!rune) return false;

    this.enchantedRunes[slot] = runeId;
    const p = this.em.player;
    if (p) {
      this.em.addEffect(p.x, p.y, 4.0, rune.color, 0.8);
      this.em.addShockwave(p.x, p.y, 3.5, rune.color, 0.5);
      this.em.addFloatingText(p.x, p.y - 1.5, `⚡ [${rune.name}] 각인 완료!`, rune.color, 1.8);
    }
    if (typeof audioMgr !== 'undefined' && audioMgr.playCraft) audioMgr.playCraft();
    this.em.log('quest', `⚡ [룬 제련소] ${slot.toUpperCase()} 슬롯에 [${rune.name}] 인챈트 룬이 각인되었습니다!`);
    return true;
  }

  unsocketRune(slot) {
    if (!this.enchantedRunes[slot]) return false;
    this.enchantedRunes[slot] = null;
    const p = this.em.player;
    if (p) {
      this.em.addFloatingText(p.x, p.y - 1.2, `💨 룬 해제 완료`, '#94a3b8', 1.0);
    }
    return true;
  }

  // ==========================================================================
  // Q. 🏟️ 발로르 왕국 콜로세움 투기장 시스템 (Balor Colosseum Gladiator Tournament)
  // ==========================================================================
  startColosseumTournament() {
    const p = this.em.player;
    if (!p) return;

    if (this.colosseum.active) {
      this.em.addFloatingText(p.x, p.y - 1.5, '⚠️ 투기장 전투가 이미 진행 중입니다!', '#f87171', 1.5);
      return;
    }

    // 경기장으로 순간이동 (솔라리스 대도시 아레나 광장 부근 x: 1935, y: 1205)
    p.x = 1935;
    p.y = 1205;
    p.targetX = p.x;
    p.targetY = p.y;
    if (this.companionsActive && this.companions) {
      this.companions.forEach(c => {
        c.x = p.x + (Math.random() - 0.5) * 3;
        c.y = p.y + (Math.random() - 0.5) * 3;
        c.targetX = c.x;
        c.targetY = c.y;
      });
    }

    this.colosseum.active = true;
    this.colosseum.wave = 0;
    this.colosseum.monsters = [];
    this.colosseum.timer = 0;
    this.colosseum.cleared = false;

    this.em.addEffect(p.x, p.y, 6.0, '#f59e0b', 1.2);
    this.em.addShockwave(p.x, p.y, 5.0, '#ef4444', 0.8);
    this.em.addFloatingText(p.x, p.y - 2.0, '🏟️ [발로르 콜로세움] 투기장 개막! 1라운드 진입!', '#fbbf24', 2.5);
    this.em.log('boss', '🏟️ [왕국 콜로세움] 발로르 투기장 서바이벌 토너먼트가 개막되었습니다! 영광의 챔피언에 도전하십시오!');

    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();

    this.startColosseumWave(1);
  }

  startColosseumWave(waveNum) {
    const p = this.em.player;
    if (!p || !this.colosseum.active) return;

    this.colosseum.wave = waveNum;
    this.colosseum.monsters = [];

    const waveConfigs = [
      {
        title: '제 1라운드: 야만의 검투사 & 군견',
        mobs: [
          { type: 'gladiator', name: '야만의 검투사', hp: 450, atk: 28, speed: 2.1, color: '#b45309' },
          { type: 'gladiator', name: '야만의 검투사', hp: 450, atk: 28, speed: 2.1, color: '#b45309' },
          { type: 'hound', name: '투기장 전투군견', hp: 280, atk: 22, speed: 3.0, color: '#78350f' },
          { type: 'hound', name: '투기장 전투군견', hp: 280, atk: 22, speed: 3.0, color: '#78350f' }
        ]
      },
      {
        title: '제 2라운드: 화염의 마도 결투사단',
        mobs: [
          { type: 'firemage', name: '화염 마도사', hp: 600, atk: 35, speed: 1.8, color: '#dc2626' },
          { type: 'gladiator', name: '오크 챔피언', hp: 750, atk: 36, speed: 2.2, color: '#15803d' },
          { type: 'gladiator', name: '오크 챔피언', hp: 750, atk: 36, speed: 2.2, color: '#15803d' }
        ]
      },
      {
        title: '제 3라운드: 지하감옥 무쇠 골렘 & 암살자',
        mobs: [
          { type: 'golem', name: '투기장 무쇠 골렘', hp: 1600, atk: 48, speed: 1.3, color: '#475569' },
          { type: 'assassin', name: '그림자 암살자', hp: 520, atk: 42, speed: 3.2, color: '#6b21a8' },
          { type: 'assassin', name: '그림자 암살자', hp: 520, atk: 42, speed: 3.2, color: '#6b21a8' }
        ]
      },
      {
        title: '제 4라운드: 심연의 네크로맨서 & 망령 군단',
        mobs: [
          { type: 'lich', name: '심연의 리치 소환사', hp: 1800, atk: 52, speed: 1.7, color: '#9333ea' },
          { type: 'spectre', name: '저주받은 망령 기사', hp: 700, atk: 38, speed: 2.4, color: '#38bdf8' },
          { type: 'spectre', name: '저주받은 망령 기사', hp: 700, atk: 38, speed: 2.4, color: '#38bdf8' },
          { type: 'spectre', name: '저주받은 망령 기사', hp: 700, atk: 38, speed: 2.4, color: '#38bdf8' }
        ]
      },
      {
        title: '최종 결전: 멸망의 검성 챔피언 발로르',
        mobs: [
          { type: 'champion', name: '검성 챔피언 발로르', hp: 3500, atk: 68, speed: 2.6, color: '#e11d48', isColosseumBoss: true }
        ]
      }
    ];

    const currentCfg = waveConfigs[waveNum - 1];
    if (!currentCfg) return;

    this.em.addFloatingText(p.x, p.y - 2.2, `⚔️ ${currentCfg.title}!`, '#f43f5e', 3.0);
    this.em.log('boss', `🏟️ [콜로세움 Wave ${waveNum}/5] ${currentCfg.title} 전투가 시작되었습니다!`);

    currentCfg.mobs.forEach((mDef, idx) => {
      const angle = (idx / currentCfg.mobs.length) * Math.PI * 2;
      const spawnDist = 7.0 + Math.random() * 2.5;
      const sx = p.x + Math.cos(angle) * spawnDist;
      const sy = p.y + Math.sin(angle) * spawnDist;

      const ent = this.em.spawnMonster('orc', sx, sy);
      if (ent) {
        ent.name = mDef.name;
        ent.maxHp = mDef.hp;
        ent.hp = mDef.hp;
        ent.atk = mDef.atk;
        ent.speed = mDef.speed;
        ent.color = mDef.color;
        ent.isColosseumMob = true;
        ent.colosseumWave = waveNum;
        if (mDef.isColosseumBoss) {
          ent.isColosseumBoss = true;
          ent.radius = 1.4;
        }
        this.colosseum.monsters.push(ent);
        this.em.addEffect(sx, sy, 3.5, '#ef4444', 0.6);
        this.em.addHitSparks(sx, sy, '#f59e0b', 8);
      }
    });
  }

  checkColosseumProgress(deadMob) {
    if (!this.colosseum.active || !deadMob.isColosseumMob) return;

    this.colosseum.monsters = this.colosseum.monsters.filter(m => m !== deadMob && m.hp > 0);

    // 잔여 몬스터 확인
    if (this.colosseum.monsters.length === 0) {
      const p = this.em.player;
      if (this.colosseum.wave < this.colosseum.maxWaves) {
        const nextWave = this.colosseum.wave + 1;
        this.em.addFloatingText(p.x, p.y - 1.8, `🎉 Wave ${this.colosseum.wave} 돌파 성공! 3초 후 다음 라운드!`, '#22c55e', 2.8);
        if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();

        setTimeout(() => {
          if (this.colosseum.active) {
            this.startColosseumWave(nextWave);
          }
        }, 3000);
      } else {
        // 최종 라운드 클리어! 챔피언 등극!
        this.colosseum.active = false;
        this.colosseum.cleared = true;
        this.colosseum.title = '투기장의 무패 챔피언';

        if (p) {
          p.gold = (p.gold || 0) + 2000;
          p.maxHp += 150;
          p.hp = p.maxHp;
          p.atk += 20;

          // 보상 룬 지급
          if (!this.runeInventory.includes('rune_solaris')) this.runeInventory.push('rune_solaris');
          if (!this.runeInventory.includes('rune_fulgur')) this.runeInventory.push('rune_fulgur');

          this.em.addEffect(p.x, p.y, 8.0, '#facc15', 1.8);
          this.em.addShockwave(p.x, p.y, 7.0, '#f59e0b', 1.2);
          this.em.addFloatingText(p.x, p.y - 2.5, '🏆 [콜로세움 제패] 투기장 무패 챔피언 등극!! (+2000G, 영구 스탯 대폭 상승)', '#fbbf24', 4.0);
          this.em.log('boss', '👑 [콜로세움 정복] 플레이어가 발로르 콜로세움 5개 라운드를 모두 정복하고 대륙 투기장의 전설적 챔피언에 올랐습니다! (+2000G, HP+150, ATK+20, 태양/뇌전 룬 획득)');
          if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
        }
      }
    }
  }

  updateColosseum(dt) {
    if (!this.colosseum.active) return;
    const p = this.em.player;
    if (!p || p.hp <= 0) {
      // 패배 시 투기장 종료
      this.colosseum.active = false;
      this.colosseum.monsters = [];
      this.em.log('boss', '💀 [콜로세움 패배] 플레이어가 투기장 전투 도중 쓰러져 경기가 중단되었습니다.');
      return;
    }

    // 보스 특수 스킬 (발로르 검풍)
    if (this.colosseum.wave === 5) {
      this.colosseum.timer += dt;
      if (this.colosseum.timer >= 4.5) {
        this.colosseum.timer = 0;
        const boss = this.colosseum.monsters.find(m => m.isColosseumBoss && m.hp > 0);
        if (boss) {
          this.em.addShockwave(boss.x, boss.y, 5.0, '#e11d48', 0.6);
          this.em.addFloatingText(boss.x, boss.y - 1.5, '💥 멸망의 검성 회전참격!', '#f43f5e', 1.5);
          if (typeof audioMgr !== 'undefined') audioMgr.playSlash();
          const dist = Math.hypot(p.x - boss.x, p.y - boss.y);
          if (dist < 4.5) {
            p.hp -= 45;
            p.hitTimer = 0.3;
            this.em.addFloatingText(p.x, p.y - 1.0, '💥 -45', '#ef4444', 1.2);
          }
        }
      }
    }
  }

  // ==========================================================================
  // R. 🧪 퀵 포션 벨트 단축 사용 시스템 (Quick Potion Belt)
  // ==========================================================================
  useQuickPotion(type) {
    const p = this.em.player;
    if (!p || p.hp <= 0) return false;
    const item = this.quickBelt[type];
    if (!item) return false;

    if (item.cd > 0) {
      this.em.addFloatingText(p.x, p.y - 1.2, `⏳ [${item.name}] 쿨다운 중 (${item.cd.toFixed(1)}s)`, '#94a3b8', 1.0);
      return false;
    }

    if (type === 'health') {
      p.hp = Math.min(p.maxHp, p.hp + 350);
      item.cd = item.maxCd;
      this.em.addEffect(p.x, p.y, 4.0, '#4ade80', 0.6);
      this.em.addHitSparks(p.x, p.y, '#86efac', 8);
      this.em.addFloatingText(p.x, p.y - 1.5, `🧪 +350 HP 회복!`, '#22c55e', 1.5);
      if (typeof audioMgr !== 'undefined') audioMgr.playPotionDrink();
      return true;
    } else if (type === 'swift') {
      item.cd = item.maxCd;
      p.speed = (p.speed || 2.0) + 0.8;
      p.dodgeChance = (p.dodgeChance || 0) + 0.25;
      this.em.addEffect(p.x, p.y, 4.5, '#38bdf8', 0.8);
      this.em.addShockwave(p.x, p.y, 3.5, '#0ea5e9', 0.4);
      this.em.addFloatingText(p.x, p.y - 1.6, `⚡ 질풍의 신속 발동! (+50% 속도)`, '#38bdf8', 2.0);
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
      setTimeout(() => {
        p.speed = Math.max(1.8, p.speed - 0.8);
        p.dodgeChance = Math.max(0, (p.dodgeChance || 0) - 0.25);
      }, 15000);
      return true;
    } else if (type === 'berserk') {
      item.cd = item.maxCd;
      p.atk += 35;
      p.critBonus = (p.critBonus || 0) + 0.3;
      this.em.addEffect(p.x, p.y, 5.0, '#ef4444', 0.8);
      this.em.addShockwave(p.x, p.y, 4.0, '#f97316', 0.5);
      this.em.addFloatingText(p.x, p.y - 1.6, `🔥 버서커 광폭화 돌입! (+35 ATK)`, '#ef4444', 2.0);
      if (typeof audioMgr !== 'undefined') audioMgr.playSlash();
      setTimeout(() => {
        p.atk = Math.max(20, p.atk - 35);
        p.critBonus = Math.max(0, (p.critBonus || 0) - 0.3);
      }, 15000);
      return true;
    }
    return false;
  }

  updateQuickBelt(dt) {
    if (!this.quickBelt) return;
    for (const k in this.quickBelt) {
      if (this.quickBelt[k].cd > 0) {
        this.quickBelt[k].cd = Math.max(0, this.quickBelt[k].cd - dt);
      }
    }
  }

  // ==========================================================================
  // S. 🏛️ 고대 석판 모놀리스 판독 & 대륙 실록 도감 (Ancient Monolith & Codex)
  // ==========================================================================
  inspectMonolith(monolithId) {
    const p = this.em.player;
    if (!p) return false;
    const m = this.monoliths.find(mono => mono.id === monolithId);
    if (!m) return false;

    if (m.unlocked) {
      this.em.addFloatingText(p.x, p.y - 1.5, `📖 [${m.name}] 이미 판독된 석비입니다.`, '#94a3b8', 1.2);
      return false;
    }

    m.unlocked = true;
    if (m.applyBlessing) m.applyBlessing(p);
    this.em.gainPlayerExp(300);

    this.em.addEffect(m.x, m.y, 6.0, m.color, 1.2);
    this.em.addShockwave(m.x, m.y, 5.0, m.color, 0.8);
    this.em.addHitSparks(m.x, m.y, '#fef08a', 12);
    this.em.addFloatingText(p.x, p.y - 2.0, `✨ [${m.name}] 판독 완료! (+300 EXP, 영구 축복)`, m.color, 3.0);
    this.em.log('quest', `🏛️ [고대 실록] 플레이어가 [${m.name}]을 판독하고 대륙의 잊혀진 역사를 해금했습니다! (${m.blessingText})`);

    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    return true;
  }

  checkMonolithInteraction(player) {
    if (!player || !this.monoliths) return;
    for (const m of this.monoliths) {
      const dist = Math.hypot(player.x - m.x, player.y - m.y);
      if (dist < 3.2 && !m.unlocked) {
        player.nearMonolith = m;
        return;
      }
    }
    player.nearMonolith = null;
  }

  // ==========================================================================
  // T. 📜 대륙 현상금 수배소 길드 시스템 (Bounty Hunter Guild)
  // ==========================================================================
  acceptBounty(bountyId) {
    const p = this.em.player;
    if (!p) return false;
    const b = this.bounties.find(item => item.id === bountyId);
    if (!b) return false;

    if (b.cleared) {
      this.em.addFloatingText(p.x, p.y - 1.2, '🏆 이미 토벌 완료된 현상금 수배자입니다.', '#4ade80', 1.2);
      return false;
    }

    b.active = true;

    // 해당 위치에 보스 몬스터 소환
    const bossType = b.id === 'bounty_necro_dragon' ? 'dragon' : 'orc';
    const ent = this.em.spawnMonster(bossType, b.x, b.y);
    if (ent) {
      ent.name = b.name;
      ent.maxHp = b.rank === 'S-Rank' ? 3800 : (b.rank === 'A-Rank' ? 2400 : 1500);
      ent.hp = ent.maxHp;
      ent.atk = b.rank === 'S-Rank' ? 65 : (b.rank === 'A-Rank' ? 45 : 32);
      ent.color = b.color;
      ent.isBountyBoss = true;
      ent.bountyId = b.id;
      ent.scale = 1.35;
      b.targetEnt = ent;
    }

    this.em.addEffect(p.x, p.y, 5.0, b.color, 0.8);
    this.em.addFloatingText(p.x, p.y - 1.8, `📜 [${b.name}] 수배령 추적 개시!`, b.color, 2.5);
    this.em.log('boss', `📜 [현상금 수배령] [${b.name}] (${b.rank})의 추적이 시작되었습니다! (${b.region})`);
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    return true;
  }

  checkBountyDefeat(deadEnt) {
    if (!deadEnt || !deadEnt.isBountyBoss || !deadEnt.bountyId) return;
    const b = this.bounties.find(item => item.id === deadEnt.bountyId);
    if (!b || b.cleared) return;

    b.cleared = true;
    b.active = false;

    const p = this.em.player;
    if (p) {
      p.gold = (p.gold || 0) + b.rewardGold;
      this.em.gainPlayerExp(b.rewardExp);

      // 랭크 승급 확인
      const clearedCount = this.bounties.filter(item => item.cleared).length;
      if (clearedCount >= 4) {
        this.bountyHunterRank = '전설의 대륙 집행관 (Legendary Arbiter)';
      } else if (clearedCount >= 2) {
        this.bountyHunterRank = '베테랑 현상금 사냥꾼 (Veteran Hunter)';
      }

      this.em.addEffect(deadEnt.x, deadEnt.y, 8.0, '#facc15', 1.8);
      this.em.addShockwave(deadEnt.x, deadEnt.y, 6.0, '#f59e0b', 1.0);
      this.em.addFloatingText(p.x, p.y - 2.5, `🏆 [수배령 토벌] ${b.name} 처치 완료! (+${b.rewardGold}G)`, '#fbbf24', 3.5);
      this.em.log('boss', `🏆 [수배령 제패] 플레이어가 대륙의 거악 [${b.name}]을 토벌하고 보상금 ${b.rewardGold}G 및 [${b.rewardItem}]을 획득했습니다! (현재 칭호: ${this.bountyHunterRank})`);
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    }
  }
}

const CRAFTING_RECIPES = [
  {
    id: 'excalibur',
    name: '아테리아의 룬 성검',
    icon: '⚔️',
    slot: 'weapon',
    desc: '고대 왕국의 마법이 깃든 성검. 공격력 +55, 체력 +60 강화!',
    req: { ore: 8, gems: 3, gold: 450 },
    apply(p, rpg) {
      rpg.equipment.weapon = LEGENDARY_ITEMS[0];
      p.atk += 25;
      p.maxHp += 60;
      p.hp = Math.min(p.maxHp, p.hp + 60);
    }
  },
  {
    id: 'aegis_shield',
    name: '용비늘 이지스 방패',
    icon: '🛡️',
    slot: 'shield',
    desc: '고대 드래곤의 비늘로 벼려낸 불멸의 방패. 체력 +160, 받는 피해 대폭 경감!',
    req: { ore: 10, wood: 8, gold: 400 },
    apply(p, rpg) {
      rpg.equipment.shield = LEGENDARY_ITEMS[1];
      p.maxHp += 160;
      p.hp = Math.min(p.maxHp, p.hp + 160);
      p.atk += 10;
    }
  },
  {
    id: 'galleon_engine',
    name: '초고속 룬 추진 범선',
    icon: '⛵',
    slot: 'ship',
    desc: '심해 아틀란티스 기술이 접목된 룬 추진기. 해상 항해 속도 50% 영구 상승!',
    req: { wood: 15, ore: 6, gold: 500 },
    apply(p, rpg) {
      p.shipSpeedMult = (p.shipSpeedMult || 1.0) * 1.5;
    }
  },
  {
    id: 'immortality_elixir',
    name: '세계수의 불로불사 영약',
    icon: '🧪',
    slot: 'potion',
    desc: '신비한 세계수 약초 추출물. 최대 생명력 +200 & 영구 공격력 +15 증가!',
    req: { herbs: 10, gems: 2, gold: 350 },
    apply(p, rpg) {
      p.maxHp += 200;
      p.hp = p.maxHp;
      p.atk += 15;
    }
  },
  {
    id: 'roast_fish',
    name: '모닥불 생선 구이',
    icon: '🐟',
    slot: 'food',
    desc: '노릇노릇하게 구워낸 모닥불 생선 요리. 체력 250 즉시 회복!',
    req: { fish: 2, wood: 1, gold: 20 },
    apply(p, rpg) {
      p.hp = Math.min(p.maxHp, p.hp + 250);
      if (typeof audioMgr !== 'undefined') audioMgr.playCookSizzle();
    }
  },
  {
    id: 'hunter_stew',
    name: '약초 사냥꾼 스튜',
    icon: '🍲',
    slot: 'food',
    desc: '원기를 북돋는 영양 스튜. 체력 150 회복 및 이동속도 +0.5(60초간)!',
    req: { herbs: 3, spices: 1, gold: 30 },
    apply(p, rpg) {
      p.hp = Math.min(p.maxHp, p.hp + 150);
      p.speed = (p.speed || 2.0) + 0.5;
      setTimeout(() => { p.speed = Math.max(1.8, p.speed - 0.5); }, 60000);
      if (typeof audioMgr !== 'undefined') audioMgr.playCookSizzle();
    }
  },
  {
    id: 'dragon_steak',
    name: '용고기 특상 바베큐',
    icon: '🥩',
    slot: 'food',
    desc: '드래곤의 마력이 농축된 특제 스테이크. 공격력 +25 버프(90초간 지속)!',
    req: { gems: 1, spices: 2, gold: 100 },
    apply(p, rpg) {
      p.atk += 25;
      setTimeout(() => { p.atk = Math.max(20, p.atk - 25); }, 90000);
      if (typeof audioMgr !== 'undefined') audioMgr.playCookSizzle();
    }
  }
];

// ============================================================================
// 🏛️ 대륙 거점 영주·주점 비화 & 대화 살롱 데이터베이스 (Town Lore & Deep Narrative Database)
// 문학적이고 깊이 있는 대사와 독특한 방언/성격, AI 기계적 상투어를 철저히 배제한 정통 판타지 대화 시스템
// ============================================================================
const TOWN_LORE_DATABASE = {
  central: {
    npcName: '로랑 경 (Sir Laurent)',
    npcRole: '솔라리스 근위총사령관',
    icon: '👑',
    disposition: '⚔️ 왕실 칙령에 대한 긍지와 관료적 엄격함',
    quote: '"성문 통행세는 면제요. 왕실 근위대의 인장을 지녔군. 하지만 뒷골목의 밀수배들은 조심하시오. 밤마다 은괴를 실은 마차가 강을 건너고 있으니."',
    rumor: '💡 왕국 첩보: "동쪽 마나 호수 밑바닥에 고대 제국 시절 가라앉은 성유물이 잠들어 있다고 하오. 밤안개가 낄 때마다 수면 위로 푸른 도깨비불이 어른거린다더군."',
    tavernToast: '솔라리스 왕실 에일과 구운 사슴고기 파이를 대접받았습니다! 기력이 충만해집니다.',
    questTitle: '중앙 제국 관문 순찰 및 도적단 소탕',
    questDesc: '국왕의 칙령에 따라 황도 외곽 가도를 위협하는 무장 강도단을 정벌하시오.'
  },
  fairy_grove: {
    npcName: '대장로 실피엘 (Elder Sylphiel)',
    npcRole: '태고 요정 숲 에메랄드 거목 성소 대장로',
    icon: '🌿',
    disposition: '🧚 찰나의 필멸자를 관조하는 아득한 신비',
    quote: '"인간의 발소리는 유난히 조급하군요. 풀잎이 이슬을 머금는 시간조차 견디지 못하는 이들이여... 백 년 전 당신과 똑같은 눈을 한 방랑자가 저 거목 밑에 묻혔지요. 그가 남긴 낡은 은빛 검이 아직도 뿌리 사이에 잠들어 있답니다."',
    rumor: '💡 요정의 속삭임: "발광 포자 거대 버섯 성채 밑바닥엔 태고의 흙이 숨쉬고 있어요. 그 포자를 달여 마시면 시간의 흐름이 반으로 느려진다는 전설이 있지요."',
    tavernToast: '달콤한 픽시 꽃꿀술(Nectar Mead)과 발광 버섯 수프를 음미했습니다! 정신이 맑아지고 마나가 샘솟습니다.',
    questTitle: '오염된 포자 괴수 정화 의뢰',
    questDesc: '외곽 숲의 이끼 거석단 부근에서 날뛰는 변종 포자 야수를 처치하고 성역의 결계를 복원하시오.'
  },
  el_dorado: {
    npcName: '태양의 대제사장 몬테수마 (High Priest Montezuma)',
    npcRole: '엘도라도 태양 제국 최고 신관',
    icon: '☀️',
    disposition: '👑 다섯 번째 태양의 계시와 황금의 엄숙함',
    quote: '"그대들이 바다를 건너 찾아온 황금은 단순한 금속이 아니오. 그것은 하늘의 태양이 땅으로 떨어뜨린 눈물이자 굳어버린 신의 피다. 심장에 거짓이 깃든 자는 제단에 발을 들이는 순간 뱀신의 화염에 눈이 멀게 될 것이오."',
    rumor: '💡 태양 사제의 계시: "성스러운 세노테 에메랄드 싱크홀 가장 깊은 동굴에 태초의 황금 뗏목이 가라앉아 있다. 일식이 일어나는 정오에 제물을 바치면 깃털 뱀신이 직접 물 위로 솟구쳐 오를지니."',
    tavernToast: '차가운 카카오 고추 음료(Xocolatl)와 황금 옥수수 토르티야를 맛보았습니다! 전신에 태양신의 불꽃과 원기가 솟구칩니다.',
    questTitle: '밀림 흑요석 약탈자 분쇄',
    questDesc: '피라미드 외곽 밀림에서 태양신의 황금 원반을 훔쳐 달아난 약탈자 무리를 토벌하고 성물을 회수하시오.'
  },
  frost_necropolis: {
    npcName: '리치 로드 발라자르 & 서리 감시자 베르단디 (Valazar & Verdandi)',
    npcRole: '영구동토 만년빙하 네크로폴리스 고대 서리고룡 수호자',
    icon: '❄️',
    disposition: '💀 영하 50도의 침묵과 절대영도 마법의 비정함',
    quote: '"숨을 쉴 때마다 폐포가 얼어붙어 부스러지는 소리가 들리는가? 산 자들이여, 그대들이 타오르는 심장을 안고 이 얼음 무덤에 발을 디딘 순간, 이미 그 온기는 서리고룡의 첫 숨결에 저당 잡힌 것이다. 맹세를 저버리지 마라. 영하의 침묵만이 거짓을 말하지 않으니."',
    rumor: '💡 만년빙하 깊은 곳의 기록: "빙룡의 심장을 감싼 청람색 영구빙은 보통의 칼날로 쪼갤 수 없다. 오직 태양의 제단에서 벼려낸 흑요석 불꽃만이 그 얼음을 녹여 신화 시대의 용언(龍言)을 깨울 수 있지."',
    tavernToast: '영구동토 빙하 송어 회와 백년 묵은 서리이끼 증류주(Glacial Schnapps)를 들이켰습니다! 뼛속까지 찌르던 혹한이 단숨에 타오르는 얼음불꽃으로 변합니다.',
    questTitle: '만년설 고룡 능선 영혼 빙식(氷蝕) 골렘 파괴',
    questDesc: '영구동토의 냉기를 흡수해 비대해진 얼음 골렘 핵을 부수고 영구빙 파편을 회수하시오.'
  },
  gothic: {
    npcName: '밤의 대주교 발렌타인 (Archbishop Valentine)',
    npcRole: '핏빛 장미 고딕 대성당 성주',
    icon: '🦇',
    disposition: '🍷 피와 침묵을 사랑하는 탐미주의 귀족',
    quote: '"장미는 밤이 깊을수록 검붉게 타오르는 법. 낮의 태양에 눈이 먼 자들은 이곳의 고요를 모욕이라 부르더군요. 그대의 심장은 참으로 격렬하게 뛰고 있군... 아주 신선하고 향기로운 포도주 냄새가 납니다."',
    rumor: '💡 흡혈귀의 독백: "붉은 달이 차오르는 밤, 캐슬바니아 성채 종탑에 올라가 보게. 달빛을 받으면 숨겨진 보물창고로 향하는 박쥐 문양이 바닥에 드러날 테니."',
    tavernToast: '얼음처럼 차가운 붉은 포도주와 훈제 박쥐고기를 맛보았습니다. 오싹한 전율과 함께 야간 시야가 밝아집니다.',
    questTitle: '폭주한 그림자 마녀 토벌령',
    questDesc: '안개 낀 늪지대에서 영혼을 탐닉하는 타락한 마녀 집회소를 급습하여 침묵시키시오.'
  },
  corsair: {
    npcName: '애꾸눈 드레이크 선장 (Captain Drake)',
    npcRole: '검은 깃발 해적 연합 드레드노트 기함장',
    icon: '🏴‍☠️',
    disposition: '⚓ 럼주와 바다바람에 절은 호탕한 거한',
    quote: '"어이 풋내기! 뱃멀미로 창자 쏟기 싫으면 럼주 병이나 꽉 붙잡아라. 어젯밤 크라켄 해골 요새에서 조개껍질에 피로 쓴 조난 신호가 떠내려왔어. 바다 밑바닥 괴수가 슬슬 굶주렸다는 뜻이지!"',
    rumor: '💡 선술집 밀담: "토르투가 암시장 뒷골목에 가면 세이렌의 눈물로 빚은 보물 지도를 파는 노인이 있어. 절반은 가짜지만, 진짜 한 장엔 침몰선 금괴 10만 냥의 위치가 적혀 있지."',
    tavernToast: '목구멍을 태우는 75도 독한 흑럼주와 건조 오징어를 씹어 삼켰습니다! 야생의 투기가 솟구칩니다.',
    questTitle: '심연 크라켄 촉수 포획 작전',
    questDesc: '해골초도 인근 암초 해역에 닻을 내리고 출몰하는 크라켄 식인 촉수를 격퇴하시오.'
  },
  steamforge: {
    npcName: '증기 모루의 토르발드 (Torvald Ironforge)',
    npcRole: '드워프 증기 요새 수석 대장장이',
    icon: '⚙️',
    disposition: '⚒️ 쇳물과 기계 압력에 평생을 바친 완고함',
    quote: '"용광로 압력 1,800도다! 1초만 늦어도 쇳물이 식어 찌꺼기가 돼! 쓸데없는 잡담할 생각 말고, 부러진 칼이나 이리 줘봐. 진정한 드워프의 담금질이 뭔지 보여줄 테니."',
    rumor: '💡 광산 인부의 넋두리: "지하 3,000미터 마그마 갱도 밑에서 망치 소리가 들려. 우리 드워프 말고, 땅속 거신들이 아직 살아 숨쉬고 있다는 증거야."',
    tavernToast: '걸쭉한 흑맥주 한 드럼과 마그마에 구운 멧돼지 허벅지살을 뜯었습니다! 방어력과 지구력이 솟구칩니다.',
    questTitle: '폭주한 고대 룬 골렘 부품 회수',
    questDesc: '증기 누출로 오작동을 일으킨 거대 채굴 골렘의 증기 코어를 정지시키고 회수하시오.'
  },
  spirit_shrine: {
    npcName: '구미호 무녀 타마모 (Shrine Maiden Tamamo)',
    npcRole: '달빛 은룡 천공 신사 주임 무녀',
    icon: '🦊',
    disposition: '🪭 여우비처럼 가볍고 요염한 장난기',
    quote: '"달빛이 밝은 밤에는 그림자를 밟지 마시어요. 홀린 듯 거울 호수를 들여다보다간... 영영 돌아오지 못할 수도 있답니다. 후후, 제 여우비에 젖어보시겠어요?"',
    rumor: '💡 무녀의 점괘: "천 개의 연꽃 호수 한가운데에 보름달이 정확히 걸릴 때, 물밑에서 은빛 용이 숨결을 내뿜으며 소원을 들어주는 여의주를 바친다지요."',
    tavernToast: '향긋한 등나무 꽃차와 달콤한 벚꽃 찹쌀떡을 받았습니다. 심신이 평온해지고 치명타율이 상승합니다.',
    questTitle: '천공 대나무숲 악령 정화 굿판',
    questDesc: '영혼을 빼앗긴 채 죽림을 배회하는 떠돌이 원령들을 신성한 부적으로 퇴치하시오.'
  },
  crystal_zenith: {
    npcName: '대마법학자 셀레스테 (Arch-Mage Celeste)',
    npcRole: '영롱한 프리즘 제국 천문대장',
    icon: '💎',
    disposition: '🔮 별자리와 마나 굴절률에 몰두한 지성',
    quote: '"빛을 단순히 밝음으로만 보지 마십시오. 프리즘을 통과하는 순간 모든 빛은 일곱 가지 원소의 주문으로 해체됩니다. 그대의 무기에도 별빛의 마나를 주입해 드릴 수 있지요."',
    rumor: '💡 에테르 관측 기록: "북쪽 오로라와 우리 수정 첨탑의 빛이 교차하는 지점에 차원문이 열린다는 계산이 나왔습니다. 그 너머엔 순수한 마나 결정 덩어리가 떠다니지요."',
    tavernToast: '무지갯빛 에테르 스파클링 와인과 영롱한 크리스탈 사탕을 맛보았습니다. 스킬 쿨다운이 즉시 단축됩니다.',
    questTitle: '오로라 비행선 항로 마나 파편 정화',
    questDesc: '비행선 항로에 흩뿌려진 불안정한 마나 결정체들을 수거하고 공중 해류를 안정화하시오.'
  },
  olympus: {
    npcName: '천공 집행관 헤르메스 (High Arbiter Hermes)',
    npcRole: '올림포스 제우스 천공 옥좌 전령',
    icon: '⚡',
    disposition: '🏛️ 신화적 웅장함과 오만한 자긍심',
    quote: '"필멸자여. 네가 딛고 선 곳은 신들의 옥좌 아래다. 천둥이 구름 사이로 울부짖을 때, 오직 불굴의 영혼만이 티탄의 검투장으로 인도될 것이다."',
    rumor: '💡 올림포스 전설: "헤파이토스의 제련소 화로에는 벼락을 맞아도 부러지지 않는 신의 강철이 보관되어 있다. 티탄의 검투장에서 5연승을 거둔 자만이 그 쇳조각을 만질 수 있지."',
    tavernToast: '신들의 음료 암브로시아와 꿀을 바른 올리브를 하사받았습니다. 전신에 천둥의 전율이 감돕니다.',
    questTitle: '티탄의 모래사장 맹수 토벌',
    questDesc: '신들의 검투장에서 탈출한 황금 뿔의 맹수를 제압하여 올림포스의 권위를 수호하시오.'
  },
  mirage: {
    npcName: '카라반 대상 카심 (Merchant Prince Qasim)',
    npcRole: '모래바다 대상 연합 상단주',
    icon: '🕌',
    disposition: '🐪 능글맞은 장사 수완과 끝없는 탐욕',
    quote: '"모래폭풍 속에서 오아시스를 보았다고 믿지 마십시오. 그것은 목마른 자를 홀리는 지니의 눈물일 뿐입니다. 황금과 향신료만이 사막에서 배신하지 않는 유일한 진실이지요."',
    rumor: '💡 대상의 은어: "스핑크스 거석 눈동자가 붉게 물드는 석양 무렵, 모래 언덕 밑에 묻힌 천년 전 황금 궁전의 첨탑이 10초 동안 모래 위로 솟아오른다네."',
    tavernToast: '향긋한 카다멈 민트차와 대추야자 열매를 대접받았습니다. 피로가 눈 녹듯 사라지고 금화 획득량이 늘어납니다.',
    questTitle: '오아시스 도적단 약탈품 탈환',
    questDesc: '비단 상단을 습격한 사막 약탈자들의 은신처를 찾아가 빼앗긴 보물 상자를 되찾아오시오.'
  },
  sakura: {
    npcName: '낭인 무사 켄신 (Kenshin the Wanderer)',
    npcRole: '동방 벚꽃 옥룡 제국 방랑 검객',
    icon: '⛩️',
    disposition: '🗡️ 고독한 검도와 계절의 무상함',
    quote: '"벚꽃이 지는 속도는 초속 5센티미터라고 하더이다. 칼을 뽑는 속도는 그보다 천 배는 빨라야 등 뒤의 원수를 베어낼 수 있지요. 술잔이 비었구려, 벗이여."',
    rumor: '💡 낭인의 귓속말: "옥룡의 비취 사당 앞 대나무 숲에는 달빛을 베어낸다는 무명검의 파편이 꽂혀 있소. 바람이 불 때마다 검명이 울린다오."',
    tavernToast: '따스하게 데운 청주와 죽순 조림을 나누어 마셨습니다. 검끝의 감각이 면도날처럼 날카로워집니다.',
    questTitle: '대나무숲 혈투의 흔적 조사',
    questDesc: '제국을 위협하는 흑마술 닌자 결사의 정찰대를 추적하여 베어 넘기시오.'
  },
  valkyrie: {
    npcName: '방패처녀 아스트리드 (Shieldmaiden Astrid)',
    npcRole: '오로라 발키리 성역 수호전사',
    icon: '❄️',
    disposition: '🛡️ 북구 전사의 불굴의 용기와 긍지',
    quote: '"서리꽃이 피는 밤에 쓰러진 전사만이 발할라의 연회에 앉을 수 있다. 도망칠 생각이라면 네 칼을 두고 가라. 추위보다 무서운 건 명예를 잃은 자의 눈물이다."',
    rumor: '💡 빙하의 전설: "얼어붙은 고래 해골 협곡 깊은 곳에 얼음 여왕이 봉인한 영구빙하 룬석이 잠들어 있어. 만지는 자의 피를 얼려버리지만, 무기에 닿으면 절대 부러지지 않지."',
    tavernToast: '얼음 뿔잔에 담긴 독한 벌꿀술(Mead)과 훈제 연어를 씹었습니다! 혹한 속에서도 몸에 열기가 솟구칩니다.',
    questTitle: '설원 서리 거인 척후병 요격',
    questDesc: '빙하 능선을 넘어 마을을 습격하려는 서리 거인의 척후병을 격퇴하시오.'
  },
  chrono: {
    npcName: '시계태엽 학자 아치볼드 (Clockmaster Archibald)',
    npcRole: '크로노스 시공간 시계탑 수석 학사',
    icon: '⏳',
    disposition: '⚙️ 째깍거리는 톱니바퀴에 영혼을 바친 학구열',
    quote: '"초침이 세 번 째깍거리는 순간, 그대가 방금 내뱉은 숨결은 이미 과거가 됩니다. 영원을 붙잡으려는 자들은 모두 이 거대한 톱니바퀴 사이에 끼어 으깨졌지요."',
    rumor: '💡 시간 학회의 기록: "정오 12시 정각에 시계탑 첨탑의 괘종이 12번 울릴 때, 천문대의 회랑 바닥에 어제의 내가 서 있는 것을 보았다는 목격담이 있습니다."',
    tavernToast: '정확히 3분 14초간 우려낸 크로노스 홍차와 모래시계 쿠키를 즐겼습니다. 동작의 반응속도가 극대화됩니다.',
    questTitle: '뒤틀린 시간 균열 파편 봉인',
    questDesc: '시공간 누출로 과거의 망령들이 출몰하는 천문대 외곽의 시공 파편을 수거하시오.'
  },
  atlantis: {
    npcName: '심해 여사제 탈라사 (High Priestess Thalassa)',
    npcRole: '아틀란티스 가라앉은 신전 고위 사제',
    icon: '🔱',
    disposition: '🌊 침몰한 초고대 문명의 깊은 슬픔',
    quote: '"만 년 전 우리는 지상의 별을 노래했으나, 오만의 대가로 이 깊은 산호 해구 아래 잠들었지요. 지상인들이여, 그대들의 높은 탑도 언젠가 이 푸른 바다 밑으로 가라앉으리라."',
    rumor: '💡 해저 석판의 문구: "산호 참호 가장 깊은 해저 단층에 고대 조력 발전 코어가 아직 가동 중이다. 그 마력으로 바다 전체를 끓어오르게 할 수도 있지."',
    tavernToast: '빛나는 심해 플랑크톤 칵테일과 산호초 굴 요리를 맛보았습니다. 폐 속에 깊은 바다의 숨결이 스며듭니다.',
    questTitle: '심해 해저 열수구 괴수 정벌',
    questDesc: '해저 신전의 열수구를 막아선 심해 거대 아귀를 처치하고 수로의 숨통을 틔우시오.'
  },
  yggdrasil: {
    npcName: '세계수의 수호자 프레이야 (Freya of the Canopy)',
    npcRole: '위그드라실 천공 수관림 수호자',
    icon: '🌲',
    disposition: '🍃 우주의 섭리를 지탱하는 장엄함',
    quote: '"아홉 세계의 가지가 바람에 떨고 있소. 라그나로크의 뿔나팔은 아직 울리지 않았으나, 심연의 용 니드호그는 이미 밑바닥 뿌리를 갉아먹기 시작했지."',
    rumor: '💡 세계수 잎새의 기억: "가장 높은 수관 나뭇가지 끝에 맺힌 세계수의 열매를 먹은 자는 생사의 굴레를 벗어나 천공의 지혜를 얻는다고 전해지오."',
    tavernToast: '신선한 세계수 솔잎 이슬과 구운 솔방울 꿀과자를 먹었습니다. 생명력 재생력이 경이롭게 증가합니다.',
    questTitle: '세계수 뿌리 잠식 벌레 퇴치',
    questDesc: '수관림 밑동을 부식시키는 거대 독충 군락을 분쇄하고 치유의 수액을 바르시오.'
  }
};

window.TOWN_LORE_DATABASE = TOWN_LORE_DATABASE;
window.RPGSystemsManager = RPGSystemsManager;
window.STRUCTURE_DEFS = STRUCTURE_DEFS;
window.LEGENDARY_ITEMS = LEGENDARY_ITEMS;
window.CRAFTING_RECIPES = CRAFTING_RECIPES;
window.AWAKENING_CLASSES = AWAKENING_CLASSES;
window.RUNESTONES = RUNESTONES;

