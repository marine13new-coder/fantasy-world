// ============================================================================
// entities.js - 다양한 종족(인간, 엘프, 드워프, 수인족, 원소 드래곤) 및 야생 동물 생태계 AI
// ============================================================================

const NAMES_BY_RACE = {
  human: [
    '아르투르', '레오나르드', '엘레나', '카르소', '베른하르트', '세라피나', '로데릭', '실비아',
    '가웨인', '아이리스', '하인리히', '마르코', '벨라', '오스왈드', '클라라', '단테', '에드워드'
  ],
  elf: [
    '실바나', '루시엘', '일리디아', '에올라스', '세레나', '페이드', '알레리아', '셀레스트',
    '실피드', '탈라사', '나이아드', '아에린', '발라렌'
  ],
  dwarf: [
    '토린', '발린', '드왈린', '김리', '다인', '브로크', '신드리', '바린',
    '그롬', '두르간', '보르', '카르둠'
  ],
  beastkin: [
    '파티마', '하산', '라시드', '나디아', '샤자드', '자파르', '칼리프', '바시르',
    '아미르', '사미라', '야스민', '타리크'
  ],
  dragon: [
    '화염룡 이그니스', '빙결룡 글라키에스', '뇌룡 볼타', '에메랄드 웜 실바누스', '고대룡 카이저'
  ]
};

const ROLE_CONFIG = {
  player:       { label: '플레이어 영웅', category: 'adventurer', icon: '🌟', color: '#facc15', speed: 2.35 },
  king:         { label: '통치자 / 국왕', category: 'soldier', icon: '👑', color: '#facc15', speed: 1.0 },
  soldier:      { label: '수비병 / 기사단', category: 'soldier', icon: '🛡️', color: '#3b82f6', speed: 1.55 },
  royal_guard:  { label: '왕실 근위대', category: 'soldier', icon: '⚜️', color: '#60a5fa', speed: 1.65 },
  navy:         { label: '왕립 해군 함대', category: 'soldier', icon: '🚢', color: '#38bdf8', speed: 1.80 },
  merchant:     { label: '육상 대상인 (마차)', category: 'merchant', icon: '🐎', color: '#f59e0b', speed: 1.40 },
  sea_merchant: { label: '해상 무역범선', category: 'merchant', icon: '⛵', color: '#fbbf24', speed: 1.75 },
  mercenary:    { label: '용병 단원', category: 'adventurer', icon: '🗡️', color: '#f43f5e', speed: 1.70 },
  adventurer:   { label: '모험가 / 영웅', category: 'adventurer', icon: '⚔️', color: '#a855f7', speed: 1.75 },
  farmer:       { label: '농부 / 약초사', category: 'farmer', icon: '🌾', color: '#84cc16', speed: 1.25 },
  fisherman:    { label: '어부', category: 'fisherman', icon: '🎣', color: '#06b6d4', speed: 1.25 },
  miner:        { label: '광부', category: 'miner', icon: '⛏️', color: '#94a3b8', speed: 1.25 },
  blacksmith:   { label: '룬 대장장이', category: 'miner', icon: '⚒️', color: '#fb923c', speed: 1.20 },
  animal:       { label: '야생 동물 / 가축', category: 'animal', icon: '🐾', color: '#10b981', speed: 1.20 },
  dragon:       { label: '고대 드래곤', category: 'monster', icon: '🐉', color: '#dc2626', speed: 1.90 },
  monster:      { label: '몬스터 / 해적', category: 'monster', icon: '👹', color: '#ef4444', speed: 1.45 }
};

const GOODS_KR = {
  wheat:   '🌾 밀',
  fish:    '🐟 생선',
  ore:     '⛏️ 광석',
  weapons: '⚔️ 강철무기',
  herbs:   '🌿 세계수약초',
  gems:    '💎 보석/진주',
  spices:  '🌶️ 황금향신료'
};

const RACE_LABELS = {
  human:    '인간',
  elf:      '엘프',
  dwarf:    '드워프',
  beastkin: '수인족',
  dragon:   '고대 드래곤',
  animal:   '야생 동물',
  orc:      '오크',
  goblin:   '고블린',
  undead:   '언데드'
};

let NEXT_ENTITY_ID = 1;

// ============================================================================
// 왕국 의뢰소 & 현상금 퀘스트 시스템 (Quest & Bounty System)
// ============================================================================
class QuestSystem {
  constructor(world, em) {
    this.world = world;
    this.em = em;
    this.activeQuest = null;
    this.completedCount = 0;
    this.questTypes = ['bounty', 'trade', 'scout', 'gather'];
    this.generateNewQuest();
  }

  generateNewQuest() {
    const sMap = this.world.settlementMap;
    const settlements = Object.values(sMap);
    const friendlySettlements = settlements.filter(s => s.faction !== 'monster');

    const type = this.questTypes[Math.floor(Math.random() * this.questTypes.length)];
    let q = null;

    if (type === 'bounty') {
      const targets = [
        { name: '화염룡 이그니스', loc: sMap.volcano_isle || { x: 390, y: 285 }, desc: '남방 화산섬에서 대륙을 위협하는 고대 화염룡을 토벌하십시오.', icon: '🐉', gold: 3500, fame: 80 },
        { name: '검은수염 해적 제독', loc: sMap.pirate_cove || { x: 195, y: 235 }, desc: '해적 소굴에 진입하여 약탈 선단을 지휘하는 해적 제독을 격침하십시오.', icon: '🏴‍☠️', gold: 2600, fame: 60 },
        { name: '오크 대군주 그롬쉬', loc: sMap.orc_stronghold || { x: 265, y: 72 }, desc: '오크 요새의 전쟁군주를 쓰러뜨려 왕국 북방 국경을 수호하십시오.', icon: '👹', gold: 2200, fame: 55 },
        { name: '스켈레톤 리치 아자젤', loc: sMap.obsidian_necropolis || { x: 420, y: 55 }, desc: '흑암 네크로폴리스의 사령술사를 처단하여 언데드 군단을 잠재우십시오.', icon: '💀', gold: 2800, fame: 70 }
      ];
      const t = targets[Math.floor(Math.random() * targets.length)];
      q = {
        id: 'q_' + Date.now(),
        type: 'bounty',
        category: '토벌',
        title: `${t.name} 토벌`,
        targetName: t.name,
        targetX: t.loc.x,
        targetY: t.loc.y,
        progress: 0,
        maxProgress: 1,
        desc: t.desc,
        goldReward: t.gold,
        fameReward: t.fame,
        icon: t.icon
      };
    } else if (type === 'trade') {
      const origin = friendlySettlements[Math.floor(Math.random() * friendlySettlements.length)];
      let dest = friendlySettlements[Math.floor(Math.random() * friendlySettlements.length)];
      while (dest.id === origin.id && friendlySettlements.length > 1) {
        dest = friendlySettlements[Math.floor(Math.random() * friendlySettlements.length)];
      }
      const goods = ['🌾 황금 밀알', '💎 심해 진주', '🌿 세계수 비약', '🌶️ 황금 향신료', '⚔️ 미스릴 무기'];
      const good = goods[Math.floor(Math.random() * goods.length)];
      q = {
        id: 'q_' + Date.now(),
        type: 'trade',
        category: '무역',
        title: `${dest.name} 특산품 수송`,
        targetName: dest.name,
        targetX: dest.x,
        targetY: dest.y,
        originName: origin.name,
        progress: 0,
        maxProgress: 1,
        desc: `[${origin.name}]에서 조달한 ${good}을 [${dest.name}] 시장으로 안전하게 수송하십시오.`,
        goldReward: 2000 + Math.floor(Math.random() * 800),
        fameReward: 45,
        icon: '⛵'
      };
    } else if (type === 'scout') {
      const scouts = [
        { name: '천공 용의 고원', loc: sMap.sky_dragon_eyrie || { x: 425, y: 175 }, desc: '구름 위 떠있는 고대 드래곤 둥지를 비행 탐색하여 룬 제단을 확인하십시오.', icon: '☁️', gold: 1800, fame: 50 },
        { name: '스핑크스 피라미드', loc: sMap.sphinx_pyramid || { x: 310, y: 255 }, desc: '사막 한가운데 자리잡은 미지의 황금 피라미드 유적을 정찰하십시오.', icon: '🏛️', gold: 1600, fame: 40 },
        { name: '론 비컨 고도 등대', loc: sMap.lone_beacon || { x: 455, y: 215 }, desc: '대해양 동단 고도에 위치한 전설의 등대 불빛을 확인하십시오.', icon: '🗼', gold: 1900, fame: 50 },
        { name: '요정의 숲 세계수 성소', loc: sMap.fairy_glade || { x: 145, y: 245 }, desc: '엘프 연합 영지 깊숙한 곳의 신비로운 세계수 성소를 순례하십시오.', icon: '🧚', gold: 1500, fame: 35 }
      ];
      const t = scouts[Math.floor(Math.random() * scouts.length)];
      q = {
        id: 'q_' + Date.now(),
        type: 'scout',
        category: '탐사',
        title: `${t.name} 정찰`,
        targetName: t.name,
        targetX: t.loc.x,
        targetY: t.loc.y,
        progress: 0,
        maxProgress: 1,
        desc: t.desc,
        goldReward: t.gold,
        fameReward: t.fame,
        icon: t.icon
      };
    } else {
      const dest = friendlySettlements[Math.floor(Math.random() * friendlySettlements.length)];
      q = {
        id: 'q_' + Date.now(),
        type: 'gather',
        category: '보급',
        title: `${dest.name} 긴급 보급 의뢰`,
        targetName: dest.name,
        targetX: dest.x,
        targetY: dest.y,
        progress: 0,
        maxProgress: 1,
        desc: `전쟁과 무역으로 소진된 식량과 비약을 [${dest.name}] 수비대에 지원하십시오.`,
        goldReward: 1500 + Math.floor(Math.random() * 500),
        fameReward: 35,
        icon: '📦'
      };
    }

    this.activeQuest = q;
    return q;
  }

  update(dt, player) {
    if (!this.activeQuest || !player) return;
    const q = this.activeQuest;
    const dist = Math.hypot(player.x - q.targetX, player.y - q.targetY);

    if (q.type === 'bounty') {
      if (dist < 6.5) {
        q.progress = Math.min(q.maxProgress, q.progress + dt * 0.45);
        if (q.progress >= q.maxProgress) {
          this.completeQuest(player);
        }
      }
    } else {
      if (dist < 5.0) {
        q.progress = q.maxProgress;
        this.completeQuest(player);
      }
    }
  }

  completeQuest(player) {
    if (!this.activeQuest) return;
    const q = this.activeQuest;
    this.completedCount++;

    player.gold += q.goldReward;
    player.fame = (player.fame || 0) + q.fameReward;
    player.atk += 3;
    player.maxHp += 25;
    player.hp = player.maxHp;

    this.em.addEffect(player.x, player.y, 8.5, '#facc15', 1.6);
    this.em.addFloatingText(player.x, player.y - 1.8, `🎉 의뢰 완료! +${q.goldReward}G · 명성+${q.fameReward}`, '#fde047', 2.8);
    this.em.addFloatingText(player.x, player.y - 2.8, `⚔️ 영웅 능력치 강화! (공격력+3, 체력+25)`, '#4ade80', 2.8);

    this.em.log('quest', `🏆 [의뢰 완료] '${q.title}' 완수! (+${q.goldReward}G, 명성 +${q.fameReward})`, player.x, player.y);

    const nextQ = this.generateNewQuest();
    this.em.log('quest', `📜 새로운 왕국 의뢰 발령: ${nextQ.title}`, player.x, player.y);
  }
}

class EntityManager {
  constructor(world, onEventLog) {
    this.world = world;
    this.onEventLog = onEventLog || (() => {});
    this.entities = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.specialEffects = [];
    this.activeBattles = 0;
    this.player = null;
    this.questSystem = new QuestSystem(this.world, this);
    this.rpgManager = (typeof RPGSystemsManager !== 'undefined') ? new RPGSystemsManager(this.world, this) : null;
  }

  log(type, text, x, y) {
    this.onEventLog({ type, text, x, y, time: Date.now() });
  }

  addFloatingText(x, y, text, color = '#ffffff', duration = 1.6) {
    if (this.floatingTexts.length > 240) this.floatingTexts.shift();
    this.floatingTexts.push({ x, y, text, color, age: 0, duration });
  }

  addEffect(x, y, radius, color = '#facc15', duration = 0.7) {
    this.specialEffects.push({ x, y, radius, color, age: 0, duration });
  }

  pickName(race = 'human') {
    const list = NAMES_BY_RACE[race] || NAMES_BY_RACE.human;
    return list[Math.floor(Math.random() * list.length)];
  }

  spawnInitialPopulation() {
    const sMap = this.world.settlementMap;

    // 1. 각 종족별 통치자 군주들
    // 인간 국왕
    this.createEntity({
      name: '국왕 아서스 3세',
      race: 'human',
      role: 'king',
      subClass: '아테리아 왕국 국왕',
      faction: 'kingdom',
      homeId: 'solaris',
      x: sMap.solaris.x,
      y: sMap.solaris.y - 4,
      hp: 420, maxHp: 420, atk: 32, gold: 6500,
      thought: '👑 왕도와 대륙 전체의 번영을 살피는 중'
    });

    // 드워프 대왕
    this.createEntity({
      name: '토린 스톤브레이커 대왕',
      race: 'dwarf',
      role: 'king',
      subClass: '드워프 광산 왕국 군주',
      customIcon: '👑',
      faction: 'kingdom',
      homeId: 'ironforge',
      x: sMap.ironforge.x,
      y: sMap.ironforge.y - 3,
      hp: 480, maxHp: 480, atk: 38, gold: 8000, scale: 1.15,
      thought: '⚒️ 드워프 대용광로와 황금광맥을 시찰하는 중'
    });

    // 하이엘프 여왕
    this.createEntity({
      name: '요정여왕 실바나',
      race: 'elf',
      role: 'king',
      subClass: '세계수 이그드라실의 수호자',
      customIcon: '🌸',
      faction: 'kingdom',
      homeId: 'elvenheim',
      x: sMap.elvenheim.x,
      y: sMap.elvenheim.y - 2,
      hp: 390, maxHp: 390, atk: 35, ranged: true, projColor: '#2dd4bf', gold: 5200,
      thought: '🌸 세계수의 영기와 정령들의 노래를 듣는 중'
    });

    // 사막 수인족 술탄
    this.createEntity({
      name: '황금술탄 알라딘',
      race: 'beastkin',
      role: 'king',
      subClass: '사막 오아시스 제국의 술탄',
      customIcon: '🕌',
      faction: 'kingdom',
      homeId: 'mirage_oasis',
      x: sMap.mirage_oasis.x,
      y: sMap.mirage_oasis.y - 2,
      hp: 390, maxHp: 390, atk: 33, gold: 7500,
      thought: '🕌 미라주 바자르의 황금 향신료 교역을 총괄하는 중'
    });

    // 2. 왕궁 근위대 (인간 기사 8명)
    for (let i = 0; i < 8; i++) {
      this.createEntity({
        name: `근위기사 ${this.pickName('human')}`,
        race: 'human',
        role: 'royal_guard',
        faction: 'kingdom',
        homeId: 'solaris',
        x: sMap.solaris.x + (Math.random() - 0.5) * 14,
        y: sMap.solaris.y + (Math.random() - 0.5) * 14,
        hp: 230, maxHp: 230, atk: 25, gold: 140
      });
    }

    // 3. 종족별 특화 수비병 & 주민
    // (A) 드워프 왕국 아이언포지 (드워프 전사 8명, 채굴사 8명, 룬 대장장이 4명)
    for (let i = 0; i < 8; i++) {
      this.createEntity({
        name: `드워프 철갑병 ${this.pickName('dwarf')}`,
        race: 'dwarf',
        role: 'soldier',
        subClass: '드워프 방패병',
        customIcon: '🛡️',
        faction: 'kingdom',
        homeId: 'ironforge',
        x: sMap.ironforge.x + (Math.random() - 0.5) * 10,
        y: sMap.ironforge.y + (Math.random() - 0.5) * 10,
        hp: 260, maxHp: 260, atk: 24, gold: 90, scale: 1.05
      });
    }
    for (let i = 0; i < 8; i++) {
      this.createEntity({
        name: `드워프 채굴사 ${this.pickName('dwarf')}`,
        race: 'dwarf',
        role: 'miner',
        subClass: '드워프 광부',
        customIcon: '⛏️',
        faction: 'kingdom',
        homeId: 'ironforge',
        x: sMap.ironforge.x + (Math.random() - 0.5) * 8,
        y: sMap.ironforge.y - 3 + (Math.random() - 0.5) * 5,
        hp: 150, maxHp: 150, atk: 15, gold: 75
      });
    }
    for (let i = 0; i < 4; i++) {
      this.createEntity({
        name: `룬 대장장이 ${this.pickName('dwarf')}`,
        race: 'dwarf',
        role: 'blacksmith',
        subClass: '드워프 룬 장인',
        customIcon: '⚒️',
        faction: 'kingdom',
        homeId: 'ironforge',
        x: sMap.ironforge.x + (Math.random() - 0.5) * 5,
        y: sMap.ironforge.y + (Math.random() - 0.5) * 4,
        hp: 165, maxHp: 165, atk: 18, gold: 130
      });
    }

    // (B) 엘프 성소 엘븐하임 & 실버리프 호수 (엘프 레인저 10명, 약초사 8명)
    for (let i = 0; i < 6; i++) {
      this.createEntity({
        name: `엘프 바람궁수 ${this.pickName('elf')}`,
        race: 'elf',
        role: 'soldier',
        subClass: '엘프 순찰대',
        customIcon: '🏹',
        ranged: true,
        projColor: '#2dd4bf',
        faction: 'kingdom',
        homeId: 'elvenheim',
        x: sMap.elvenheim.x + (Math.random() - 0.5) * 8,
        y: sMap.elvenheim.y + (Math.random() - 0.5) * 8,
        hp: 175, maxHp: 175, atk: 22, gold: 85
      });
    }
    for (let i = 0; i < 4; i++) {
      this.createEntity({
        name: `우드엘프 레인저 ${this.pickName('elf')}`,
        race: 'elf',
        role: 'soldier',
        subClass: '호수숲 수호자',
        customIcon: '🏹',
        ranged: true,
        projColor: '#4ade80',
        faction: 'kingdom',
        homeId: 'silverleaf',
        x: sMap.silverleaf.x + (Math.random() - 0.5) * 8,
        y: sMap.silverleaf.y + (Math.random() - 0.5) * 8,
        hp: 170, maxHp: 170, atk: 21, gold: 75
      });
    }
    for (let i = 0; i < 6; i++) {
      this.createEntity({
        name: `엘프 약초사 ${this.pickName('elf')}`,
        race: 'elf',
        role: 'farmer',
        subClass: '세계수 약초사',
        customIcon: '🌿',
        faction: 'kingdom',
        homeId: 'elvenheim',
        x: sMap.elvenheim.x - 6 + (Math.random() - 0.5) * 6,
        y: sMap.elvenheim.y + 6 + (Math.random() - 0.5) * 4,
        hp: 110, maxHp: 110, atk: 9, gold: 70
      });
    }

    // (C) 사막 수인족 미라주 오아시스 (수인 샴쉬르 전사 6명, 향신료 농부 5명, 사막 상인 4명)
    for (let i = 0; i < 6; i++) {
      this.createEntity({
        name: `사막 수인전사 ${this.pickName('beastkin')}`,
        race: 'beastkin',
        role: 'soldier',
        subClass: '수인 샴쉬르 수호자',
        customIcon: '🗡️',
        faction: 'kingdom',
        homeId: 'mirage_oasis',
        x: sMap.mirage_oasis.x + (Math.random() - 0.5) * 8,
        y: sMap.mirage_oasis.y + (Math.random() - 0.5) * 8,
        hp: 185, maxHp: 185, atk: 23, gold: 85
      });
    }
    for (let i = 0; i < 5; i++) {
      this.createEntity({
        name: `수인 재배사 ${this.pickName('beastkin')}`,
        race: 'beastkin',
        role: 'farmer',
        subClass: '향신료 농부',
        customIcon: '🌶️',
        faction: 'kingdom',
        homeId: 'mirage_oasis',
        x: sMap.mirage_oasis.x - 6 + (Math.random() - 0.5) * 6,
        y: sMap.mirage_oasis.y - 5 + (Math.random() - 0.5) * 4,
        hp: 105, maxHp: 105, atk: 9, gold: 75
      });
    }

    // (D) 인간 왕국 본토 수비병 & 농부 & 어부
    const humanTowns = ['solaris', 'goldenwheat', 'bluewave', 'valor_fort', 'oakwood', 'windmill_valley', 'st_mare', 'crystal_falls', 'valkyrie_gate'];
    for (const tid of humanTowns) {
      const town = sMap[tid];
      if (!town) continue;
      const count = (tid === 'valor_fort' || tid === 'valkyrie_gate') ? 8 : (tid === 'solaris' ? 6 : 4);
      for (let i = 0; i < count; i++) {
        this.createEntity({
          name: `${town.name} 수비병 ${this.pickName('human')}`,
          race: 'human',
          role: 'soldier',
          faction: 'kingdom',
          homeId: tid,
          patrolRoad: i % 2 === 0,
          x: town.x + (Math.random() - 0.5) * 8,
          y: town.y + (Math.random() - 0.5) * 8,
          hp: 180, maxHp: 180, atk: 20, gold: 75
        });
      }
    }
    // 황금밀 대농장 농부
    for (let i = 0; i < 12; i++) {
      this.createEntity({
        name: `밀농부 ${this.pickName('human')}`,
        race: 'human',
        role: 'farmer',
        faction: 'kingdom',
        homeId: 'goldenwheat',
        x: sMap.goldenwheat.x + (Math.random() - 0.5) * 14,
        y: sMap.goldenwheat.y + (Math.random() - 0.5) * 14,
        hp: 95, maxHp: 95, atk: 6, gold: 50
      });
    }
    // 윈드밀 계곡 제분사 & 과수원 농부
    for (let i = 0; i < 6; i++) {
      this.createEntity({
        name: `윈드밀 제분사 ${this.pickName('human')}`,
        race: 'human',
        role: 'farmer',
        customIcon: '💨',
        faction: 'kingdom',
        homeId: 'windmill_valley',
        x: sMap.windmill_valley.x + (Math.random() - 0.5) * 8,
        y: sMap.windmill_valley.y + (Math.random() - 0.5) * 8,
        hp: 100, maxHp: 100, atk: 7, gold: 60
      });
    }
    // 오크우드 숲 벌목꾼 & 사냥꾼
    for (let i = 0; i < 6; i++) {
      this.createEntity({
        name: `오크우드 벌목꾼 ${this.pickName('human')}`,
        race: 'human',
        role: 'farmer',
        customIcon: '🪓',
        subClass: '숲 벌목꾼',
        faction: 'kingdom',
        homeId: 'oakwood',
        x: sMap.oakwood.x + (Math.random() - 0.5) * 8,
        y: sMap.oakwood.y + (Math.random() - 0.5) * 8,
        hp: 130, maxHp: 130, atk: 14, gold: 65
      });
    }
    // 크리스탈폴 아케인 학탑 마법사
    for (let i = 0; i < 5; i++) {
      this.createEntity({
        name: `비전 마법사 ${this.pickName('elf')}`,
        race: 'elf',
        role: 'soldier',
        customIcon: '🔮',
        subClass: '크리스탈폴 아케인 마도사',
        ranged: true,
        projColor: '#c084fc',
        faction: 'kingdom',
        homeId: 'crystal_falls',
        x: sMap.crystal_falls.x + (Math.random() - 0.5) * 6,
        y: sMap.crystal_falls.y + (Math.random() - 0.5) * 6,
        hp: 160, maxHp: 160, atk: 28, gold: 120
      });
    }
    // 푸른파도 & 세인트 마레 바다어부
    for (let i = 0; i < 10; i++) {
      this.createEntity({
        name: `대양어부 ${this.pickName('human')}`,
        race: 'human',
        role: 'fisherman',
        faction: 'kingdom',
        homeId: 'bluewave',
        x: sMap.bluewave.x + (Math.random() - 0.5) * 8,
        y: sMap.bluewave.y + (Math.random() - 0.5) * 8,
        hp: 95, maxHp: 95, atk: 7, gold: 55
      });
    }
    for (let i = 0; i < 6; i++) {
      this.createEntity({
        name: `남해 참치어부 ${this.pickName('human')}`,
        race: 'human',
        role: 'fisherman',
        faction: 'kingdom',
        homeId: 'st_mare',
        x: sMap.st_mare.x + (Math.random() - 0.5) * 8,
        y: sMap.st_mare.y + (Math.random() - 0.5) * 8,
        hp: 105, maxHp: 105, atk: 8, gold: 65
      });
    }
    for (let i = 0; i < 5; i++) {
      this.createEntity({
        name: `호수어부 ${this.pickName('human')}`,
        race: 'human',
        role: 'fisherman',
        faction: 'kingdom',
        homeId: 'silverleaf',
        x: sMap.silverleaf.x + (Math.random() - 0.5) * 6,
        y: sMap.silverleaf.y - 4 + (Math.random() - 0.5) * 4,
        hp: 95, maxHp: 95, atk: 7, gold: 50
      });
    }
    // 신대륙 달빛 요정 정원 & 스핑크스 피라미드 & 베두인 캠프 & 세이렌 산호섬 & 외로운 등대
    for (let i = 0; i < 4; i++) {
      this.createEntity({
        name: `달빛 드루이드 ${this.pickName('elf')}`,
        race: 'elf',
        role: 'soldier',
        customIcon: '🌙',
        subClass: '달빛 요정 정원 수호자',
        ranged: true,
        projColor: '#c084fc',
        faction: 'kingdom',
        homeId: 'fairy_glade',
        x: sMap.fairy_glade.x + (Math.random() - 0.5) * 6,
        y: sMap.fairy_glade.y + (Math.random() - 0.5) * 6,
        hp: 170, maxHp: 170, atk: 24, gold: 95
      });
    }
    for (let i = 0; i < 4; i++) {
      this.createEntity({
        name: `베두인 전갈유목민 ${this.pickName('beastkin')}`,
        race: 'beastkin',
        role: 'soldier',
        customIcon: '🎪',
        subClass: '사막 전갈 수호대',
        faction: 'kingdom',
        homeId: 'bedouin_camp',
        x: sMap.bedouin_camp.x + (Math.random() - 0.5) * 6,
        y: sMap.bedouin_camp.y + (Math.random() - 0.5) * 6,
        hp: 180, maxHp: 180, atk: 22, gold: 80
      });
    }
    for (let i = 0; i < 3; i++) {
      this.createEntity({
        name: `세이렌 바다정령`,
        race: 'elf',
        role: 'soldier',
        customIcon: '🧜‍♀️',
        subClass: '산호초 정령',
        ranged: true,
        projColor: '#38bdf8',
        isShip: true,
        faction: 'neutral',
        homeId: 'siren_coral',
        x: sMap.siren_coral.x + (Math.random() - 0.5) * 8,
        y: sMap.siren_coral.y + (Math.random() - 0.5) * 8,
        hp: 200, maxHp: 200, atk: 22, gold: 110
      });
    }
    this.createEntity({
      name: '외로운 등대지기 톰',
      race: 'human',
      role: 'soldier',
      customIcon: '🗼',
      subClass: '대양 등대 관리자',
      faction: 'kingdom',
      homeId: 'lone_beacon',
      x: sMap.lone_beacon.x,
      y: sMap.lone_beacon.y,
      hp: 160, maxHp: 160, atk: 15, gold: 120
    });

    // 4. 육상 무역 마차 (16팀) & 호위 용병
    for (let i = 0; i < 16; i++) {
      const townIds = ['solaris', 'goldenwheat', 'bluewave', 'ironforge', 'silverleaf', 'valor_fort', 'oakwood', 'windmill_valley', 'st_mare', 'crystal_falls', 'valkyrie_gate'];
      const startTownId = townIds[i % townIds.length];
      const startTown = sMap[startTownId];
      const merchant = this.createEntity({
        name: `육상상단 ${this.pickName('human')}`,
        race: 'human',
        role: 'merchant',
        faction: 'kingdom',
        homeId: startTownId,
        hasWagon: true,
        x: startTown.x + (Math.random() - 0.5) * 6,
        y: startTown.y + (Math.random() - 0.5) * 6,
        hp: 140, maxHp: 140, atk: 9, gold: 350
      });

      this.createEntity({
        name: `호위용병 ${this.pickName(i % 2 === 0 ? 'dwarf' : 'human')}`,
        race: i % 2 === 0 ? 'dwarf' : 'human',
        role: 'mercenary',
        subClass: '상단 호위무사',
        faction: 'kingdom',
        homeId: startTownId,
        guardTargetId: merchant.id,
        x: merchant.x + 1.2,
        y: merchant.y + 1.2,
        hp: 190, maxHp: 190, atk: 21, gold: 95
      });
    }

    // 5. 대해양 무역 범선 (14척) & 해군 전열함 (10척)
    const ports = ['bluewave', 'elvenheim', 'mirage_oasis', 'st_mare', 'siren_coral', 'lone_beacon'];
    for (let i = 0; i < 14; i++) {
      const portId = ports[i % ports.length];
      const pTown = sMap[portId];
      const race = portId === 'elvenheim' ? 'elf' : (portId === 'mirage_oasis' ? 'beastkin' : 'human');
      this.createEntity({
        name: `무역범선 ${this.pickName(race)}호`,
        race,
        role: 'sea_merchant',
        subClass: '대양 무역 갤리온',
        isShip: true,
        faction: 'kingdom',
        homeId: portId,
        x: (pTown.portWaterX || pTown.x) + (Math.random() - 0.5) * 8,
        y: (pTown.portWaterY || pTown.y) + (Math.random() - 0.5) * 8,
        hp: 250, maxHp: 250, atk: 18, ranged: true, projColor: '#fde047',
        scale: 1.35,
        gold: 600
      });
    }
    for (let i = 0; i < 10; i++) {
      const portId = ports[i % ports.length];
      const pTown = sMap[portId];
      this.createEntity({
        name: `왕립해군 전열함 ${i + 1}호`,
        race: 'human',
        role: 'navy',
        subClass: '왕립 해군 구축함',
        isShip: true,
        ranged: true,
        projColor: '#38bdf8',
        faction: 'kingdom',
        homeId: portId,
        x: (pTown.portWaterX || pTown.x) + (Math.random() - 0.5) * 12,
        y: (pTown.portWaterY || pTown.y) + (Math.random() - 0.5) * 12,
        hp: 340, maxHp: 340, atk: 29,
        scale: 1.45,
        gold: 250
      });
    }

    // 6. 종족별 모험가 파티 (32명)
    const advTemplates = [
      { subClass: '인간 소드마스터', race: 'human', atk: 26, hp: 220, ranged: false, projColor: '#60a5fa' },
      { subClass: '엘프 아크메이지', race: 'elf', atk: 30, hp: 160, ranged: true,  projColor: '#f97316' },
      { subClass: '엘프 정령궁수', race: 'elf', atk: 24, hp: 170, ranged: true, projColor: '#2dd4bf' },
      { subClass: '드워프 광전사', race: 'dwarf', atk: 28, hp: 260, ranged: false, projColor: '#fb923c' },
      { subClass: '수인 섀도우블레이드', race: 'beastkin', atk: 27, hp: 180, ranged: false, projColor: '#eab308' },
      { subClass: '성전사 팔라딘', race: 'human', atk: 23, hp: 250, ranged: false, projColor: '#facc15' }
    ];
    for (let i = 0; i < 32; i++) {
      const tpl = advTemplates[i % advTemplates.length];
      const baseTowns = ['solaris', 'valor_fort', 'elvenheim', 'mirage_oasis', 'ironforge', 'crystal_falls', 'oakwood', 'valkyrie_gate'];
      const baseTownId = baseTowns[i % baseTowns.length];
      const baseTown = sMap[baseTownId];
      this.createEntity({
        name: `${tpl.subClass} ${this.pickName(tpl.race)}`,
        race: tpl.race,
        role: 'adventurer',
        subClass: tpl.subClass,
        ranged: tpl.ranged,
        projColor: tpl.projColor,
        faction: 'kingdom',
        homeId: baseTownId,
        x: baseTown.x + (Math.random() - 0.5) * 10,
        y: baseTown.y + (Math.random() - 0.5) * 10,
        hp: tpl.hp, maxHp: tpl.hp, atk: tpl.atk, gold: 150,
        level: 1 + (i % 6)
      });
    }

    // 7. 🐾 야생 동물 생태계 (총 120마리 이상 방목!)
    this.spawnWildlifeEcosystem();

    // 8. 🐉 원소 드래곤 종족 다양화 & 몬스터 군락 스폰
    this.spawnDragonsAndLairs();
  }

  // 🐾 야생 동물 생태계 생성
  spawnWildlifeEcosystem() {
    const sMap = this.world.settlementMap;

    const animalSpawns = [
      // 🦌 사슴 (실버리프 호수 숲 및 오크우드)
      { type: 'deer', icon: '🦌', name: '야생 백록', count: 18, x: sMap.silverleaf.x + 12, y: sMap.silverleaf.y - 12, radius: 24, hp: 60, speed: 1.45 },
      // 🐇 들토끼 (황금밀 농촌 평야 & 윈드밀 계곡)
      { type: 'rabbit', icon: '🐇', name: '들토끼', count: 16, x: sMap.goldenwheat.x - 10, y: sMap.goldenwheat.y + 10, radius: 20, hp: 30, speed: 1.55 },
      // 🐄 젖소 (황금밀 대농장 목장)
      { type: 'cow', icon: '🐄', name: '젖소', count: 10, x: sMap.goldenwheat.x + 12, y: sMap.goldenwheat.y - 8, radius: 10, hp: 120, speed: 0.8 },
      // 🐑 양 (평원 목초지)
      { type: 'sheep', icon: '🐑', name: '목초지 양', count: 12, x: sMap.goldenwheat.x - 16, y: sMap.goldenwheat.y - 14, radius: 12, hp: 50, speed: 0.9 },
      // 🐻 불곰 (북부 산맥 & 오크우드 숲)
      { type: 'bear', icon: '🐻', name: '갈색 불곰', count: 8, x: sMap.oakwood.x + 14, y: sMap.oakwood.y + 12, radius: 18, hp: 180, speed: 1.25, isPredator: true },
      // 🐐 산양 (북부 험준한 바위산 & 천공 고원)
      { type: 'goat', icon: '🐐', name: '바위 산양', count: 12, x: sMap.ironforge.x + 16, y: sMap.ironforge.y - 12, radius: 16, hp: 70, speed: 1.35 },
      // 🐬 대양 돌고래 (대해양 항로 & 세이렌 산호섬)
      { type: 'dolphin', icon: '🐬', name: '대양 돌고래', count: 20, x: 145, y: 160, radius: 55, hp: 90, speed: 1.65, isAquatic: true },
      // 🐢 거대 바다거북 (신대륙 산호초 근해)
      { type: 'turtle', icon: '🐢', name: '거대 바다거북', count: 10, x: sMap.siren_coral.x + 10, y: sMap.siren_coral.y + 8, radius: 22, hp: 160, speed: 0.75, isAquatic: true },
      // 🐪 사막 낙타 (미라주 오아시스 & 베두인 캠프)
      { type: 'camel', icon: '🐪', name: '사막 낙타', count: 14, x: sMap.mirage_oasis.x - 14, y: sMap.mirage_oasis.y - 14, radius: 24, hp: 130, speed: 1.15 }
    ];

    for (const sp of animalSpawns) {
      for (let i = 0; i < sp.count; i++) {
        const ax = sp.x + (Math.random() - 0.5) * sp.radius * 2;
        const ay = sp.y + (Math.random() - 0.5) * sp.radius * 2;
        this.createEntity({
          name: sp.name,
          race: 'animal',
          role: 'animal',
          subClass: sp.isAquatic ? '해양 생물' : (sp.isPredator ? '야생 맹수' : '초식 동물'),
          animalType: sp.type,
          customIcon: sp.icon,
          isAquatic: !!sp.isAquatic,
          isShip: !!sp.isAquatic,
          isPredator: !!sp.isPredator,
          faction: 'neutral',
          x: Math.max(4, Math.min(WORLD_WIDTH - 4, ax)),
          y: Math.max(4, Math.min(WORLD_HEIGHT - 4, ay)),
          hp: sp.hp,
          maxHp: sp.hp,
          atk: sp.isPredator ? 18 : 2,
          speed: sp.speed,
          gold: 5,
          scale: sp.type === 'bear' ? 1.25 : (sp.type === 'rabbit' ? 0.75 : 1.0),
          thought: sp.isAquatic ? '🐬 푸른 바다를 가르며 유영하는 중' : '🌿 평화롭게 풀을 뜯는 중'
        });
      }
    }
  }

  // 🐉 원소 드래곤 종족 다양화 & 던전 몬스터
  spawnDragonsAndLairs() {
    const sMap = this.world.settlementMap;

    // 1. 고대 화염 에인션트 드래곤 (화산 군도 정상)
    this.createEntity({
      name: '화염룡 이그니스 (에인션트 드래곤)',
      race: 'dragon',
      role: 'dragon',
      dragonType: 'fire',
      subClass: '고대 화염 고룡',
      customIcon: '🐉',
      faction: 'monster',
      homeId: 'volcano_isle',
      ranged: true,
      projColor: '#f97316',
      x: sMap.volcano_isle.x,
      y: sMap.volcano_isle.y + 1,
      hp: 680, maxHp: 680, atk: 46, gold: 350, scale: 1.85,
      thought: '🔥 용암 분화구 상공을 선회하며 화염 브레스를 머금는 중'
    });

    // 2. 빙결 프로스트 드레이크 (극서부 천공 용의 둥지 고원)
    this.createEntity({
      name: '빙결룡 글라키에스 (천공 고룡)',
      race: 'dragon',
      role: 'dragon',
      dragonType: 'frost',
      subClass: '빙결 냉기 고룡',
      customIcon: '🐉',
      faction: 'monster',
      homeId: 'dragon_eyrie',
      ranged: true,
      projColor: '#38bdf8',
      x: sMap.dragon_eyrie.x,
      y: sMap.dragon_eyrie.y,
      hp: 620, maxHp: 620, atk: 43, gold: 320, scale: 1.75,
      thought: '❄️ 구름 위 천공 절벽에서 매서운 눈보라 브레스를 뿜는 중'
    });

    // 3. 대해양 폭풍 뇌룡 (남부 대해양 산호초 해역)
    this.createEntity({
      name: '폭풍뇌룡 볼타 (대양 해룡)',
      race: 'dragon',
      role: 'dragon',
      dragonType: 'thunder',
      subClass: '대해양 뇌전 해룡',
      customIcon: '🐉',
      faction: 'monster',
      homeId: 'siren_coral',
      isShip: true,
      ranged: true,
      projColor: '#facc15',
      x: sMap.siren_coral.x + 12,
      y: sMap.siren_coral.y - 15,
      hp: 550, maxHp: 550, atk: 40, gold: 300, scale: 1.70,
      thought: '⚡ 폭풍우를 몰고 다니며 뇌전 브레스를 방전하는 중'
    });

    // 4. 숲의 에메랄드 와이번 (오크우드 깊은 숲)
    this.createEntity({
      name: '에메랄드 와이번 실바누스',
      race: 'dragon',
      role: 'dragon',
      dragonType: 'poison',
      subClass: '오크우드 맹독 고룡',
      customIcon: '🐉',
      faction: 'monster',
      homeId: 'oakwood',
      ranged: true,
      projColor: '#22c55e',
      x: sMap.oakwood.x + 8,
      y: sMap.oakwood.y + 10,
      hp: 490, maxHp: 490, atk: 37, gold: 260, scale: 1.65,
      thought: '🌲 고목 참나무 상공에서 독성 숨결을 뿜어내는 중'
    });

    // 일반 몬스터들 스폰
    this.spawnMonstersForLair('goblin_camp', 16);
    this.spawnMonstersForLair('orc_stronghold', 16);
    this.spawnMonstersForLair('obsidian_necropolis', 14);
    this.spawnMonstersForLair('pirate_cove', 14);
    this.spawnMonstersForLair('volcano_isle', 8);
  }

  // 플레이어 소환
  spawnOrGetPlayer() {
    if (this.player && this.player.hp > 0) return this.player;
    const cap = this.world.settlementMap.solaris;
    this.player = this.createEntity({
      name: '플레이어 (대모험가)',
      race: 'human',
      role: 'player',
      subClass: '자유 항해사 & 영웅',
      customIcon: '🌟',
      faction: 'kingdom',
      homeId: 'solaris',
      ranged: true,
      projColor: '#facc15',
      x: cap.x,
      y: cap.y + 2,
      hp: 520, maxHp: 520, atk: 44, gold: 1200, level: 5, scale: 1.35,
      thought: '🕹️ 직접 조작 중 (WASD 이동 / Space 탈것 / 우클릭 이동·공격 / Q·E·F 스킬)'
    });
    this.player.mount = 'horse';
    this.player.isFlying = false;
    this.player.fame = 0;
    this.player.icon = '🏇';
    this.player.speed = 2.65;
    this.addEffect(this.player.x, this.player.y, 5, '#facc15', 1.0);
    this.log('quest', '🌟 플레이어 영웅이 아테리아 대륙에 강림했습니다! (백마 탑승)', this.player.x, this.player.y);
    return this.player;
  }

  togglePlayerMount() {
    const p = this.spawnOrGetPlayer();
    if (p.isShip) {
      this.addFloatingText(p.x, p.y - 1.2, '⚓ 바다 위에서는 항해 중입니다! 부두(DOCK)나 모래 해변(SAND)으로 전진해 상륙하세요.', '#f87171', 1.8);
      return;
    }

    if (p.mount === 'horse') {
      // 백마 -> 비룡
      p.mount = 'dragon';
      p.isFlying = true;
      p.speed = 3.65;
      p.icon = '🐉';
      if (typeof audioMgr !== 'undefined') audioMgr.playRoar();
      this.addEffect(p.x, p.y, 6.0, '#ef4444', 0.8);
      this.addFloatingText(p.x, p.y - 1.6, '🐉 고대 비룡 탑승! 구름 위로 날아오릅니다 (전 지형 자유 비행)', '#f87171', 2.2);
      this.log('quest', '🐉 플레이어가 고대 비룡을 타고 창공으로 날아올랐습니다!', p.x, p.y);
    } else if (p.mount === 'dragon') {
      // 비룡 -> 도보 (착륙 지형 검사)
      const tx = Math.floor(p.x);
      const ty = Math.floor(p.y);
      const tile = this.world.getTile(tx, ty);
      if (tile === TILE.DEEP_WATER || tile === TILE.WATER || tile === TILE.LAVA || tile === TILE.MOUNTAIN_HIGH) {
        this.addFloatingText(p.x, p.y - 1.2, '⚠️ 물/용암/높은 산 위에서는 착륙할 수 없습니다! 안전한 평지로 날아가세요.', '#f87171', 1.8);
        return;
      }
      p.mount = 'none';
      p.isFlying = false;
      p.speed = 1.95;
      p.icon = '🌟';
      this.addEffect(p.x, p.y, 3.0, '#94a3b8', 0.6);
      this.addFloatingText(p.x, p.y - 1.2, '🚶 도보 모드로 전환했습니다.', '#cbd5e1', 1.5);
      this.log('quest', '🚶 플레이어가 지상에 착륙하여 도보로 걷습니다.', p.x, p.y);
    } else {
      // 도보 -> 백마
      p.mount = 'horse';
      p.isFlying = false;
      p.speed = 2.65;
      p.icon = '🏇';
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
      this.addEffect(p.x, p.y, 4.0, '#facc15', 0.6);
      this.addFloatingText(p.x, p.y - 1.2, '🏇 왕실 백마에 탑승했습니다! (육상 질주)', '#fde047', 1.6);
      this.log('quest', '🏇 플레이어가 왕실 백마에 올라타 질주합니다.', p.x, p.y);
    }
  }

  triggerPlayerSkill(skillKey) {
    const p = this.spawnOrGetPlayer();
    if (skillKey === 'SPACE' || skillKey === 'R' || skillKey === 'mount') {
      this.togglePlayerMount();
      return;
    }

    if (skillKey === 'B' || skillKey === 'build') {
      if (this.rpgManager) {
        this.rpgManager.isBuildModeActive = !this.rpgManager.isBuildModeActive;
      }
      return;
    }

    if (skillKey === 'C' || skillKey === 'companion') {
      if (this.rpgManager) {
        this.rpgManager.toggleCompanions();
      }
      return;
    }

    if (skillKey === '1' || skillKey === 'whirlwind') {
      if (this.rpgManager) this.rpgManager.castWhirlwind();
      return;
    }

    if (skillKey === '2' || skillKey === 'frost') {
      if (this.rpgManager) this.rpgManager.castFrostNova();
      return;
    }

    if (skillKey === '3' || skillKey === 'meteor') {
      if (this.rpgManager) this.rpgManager.castMeteorStrike();
      return;
    }

    if (skillKey === '4' || skillKey === 'barrage') {
      if (this.rpgManager) this.rpgManager.castUltimateBarrage();
      return;
    }

    if (skillKey === 'J' || skillKey === 'fish') {
      if (this.rpgManager) this.rpgManager.toggleFishing();
      return;
    }

    if (skillKey === 'Q') {
      if (typeof audioMgr !== 'undefined') audioMgr.playMagic();
      this.addEffect(p.x, p.y, 11, '#f97316', 0.85);
      let hitCount = 0;
      for (const other of this.entities) {
        if (other.faction === 'monster' && other.hp > 0) {
          const d = Math.hypot(other.x - p.x, other.y - p.y);
          if (d <= 12) {
            const dmg = Math.round(p.atk * 2.4);
            other.hp -= dmg;
            hitCount++;
            this.addFloatingText(other.x, other.y - 1, `⚡-${dmg}`, '#facc15', 1.2);
            if (other.hp <= 0) {
              p.kills++;
              p.gold += other.gold;
              p.inventory.gems = (p.inventory.gems || 0) + 1;
            }
          }
        }
      }
      this.addFloatingText(p.x, p.y - 1.5, hitCount > 0 ? `⚡ 천공의 심판! (${hitCount}기 타격)` : '⚡ 천공의 심판!', '#fde047', 1.4);
    } else if (skillKey === 'E') {
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
      p.boostTimer = 6.0;
      p.hp = Math.min(p.maxHp, p.hp + 150);
      this.addEffect(p.x, p.y, 4.5, '#38bdf8', 0.7);
      this.addFloatingText(p.x, p.y - 1.4, '💨 질주 가속 & 생명력 회복!', '#38bdf8', 1.4);
    } else if (skillKey === 'F') {
      this.interactWithNearestSettlement();
    }
  }

  interactWithNearestSettlement() {
    const p = this.spawnOrGetPlayer();
    let nearestTown = null;
    let minDist = 18;
    for (const s of this.world.settlements) {
      if (s.faction === 'kingdom') {
        const d = Math.hypot(s.x - p.x, s.y - p.y);
        if (d < minDist) {
          minDist = d;
          nearestTown = s;
        }
      }
    }
    if (nearestTown) {
      const invGain = (p.inventory.gems || 0) * 80 + (p.inventory.spices || 0) * 90;
      p.inventory.gems = 0;
      p.inventory.spices = 0;
      const tradeProfit = 280 + invGain;
      p.gold += tradeProfit;
      p.level++;
      p.maxHp += 40;
      p.hp = p.maxHp;
      p.atk += 6;
      p.fame = (p.fame || 0) + 10;
      this.addEffect(p.x, p.y, 6.0, '#4ade80', 1.0);
      this.addFloatingText(p.x, p.y - 1.5, `🪙 [${nearestTown.name}] 교역 +${tradeProfit}G & 무기 강화 (Lv.${p.level})`, '#4ade80', 2.0);
      this.log('trade', `🌟 플레이어가 [${nearestTown.name}]에서 특산물 매각 및 무기 강화를 완료했습니다! (Lv.${p.level}, 공격력 ${p.atk})`, p.x, p.y);
    } else {
      this.addFloatingText(p.x, p.y - 1.4, '⚠️ 인근 왕국 도시나 항구 근처에서 상호작용 가능합니다', '#fca5a5', 1.4);
    }
  }

  dispatchTradeFleet() {
    const sMap = this.world.settlementMap;
    const ports = ['bluewave', 'elvenheim', 'mirage_oasis'];
    for (const pid of ports) {
      const pTown = sMap[pid];
      const ship = this.createEntity({
        name: `왕실 특무범선 ${this.pickName('human')}호`,
        race: 'human',
        role: 'sea_merchant',
        subClass: '왕실 황금 무역선단',
        isShip: true,
        faction: 'kingdom',
        homeId: pid,
        x: pTown.portWaterX + (Math.random() - 0.5) * 4,
        y: pTown.portWaterY + (Math.random() - 0.5) * 4,
        hp: 280, maxHp: 280, atk: 22, ranged: true, projColor: '#fde047',
        scale: 1.45,
        gold: 800
      });
      this.addEffect(ship.x, ship.y, 4.5, '#facc15', 0.8);
    }
    this.log('trade', '⛵ 왕실 칙령으로 푸른파도 대항구·엘븐하임·미라주 오아시스에서 특별 황금 무역선단이 일제히 출항했습니다!', sMap.bluewave.portWaterX, sMap.bluewave.portWaterY);
  }

  dispatchCrusade() {
    const sMap = this.world.settlementMap;
    const fort = sMap.valor_fort;
    const port = sMap.bluewave;

    for (let i = 0; i < 4; i++) {
      const crusader = this.createEntity({
        name: `왕립 성전사 ${this.pickName('human')}`,
        race: 'human',
        role: 'adventurer',
        subClass: '왕국 원정 성기사단',
        ranged: i % 2 === 0,
        projColor: '#facc15',
        faction: 'kingdom',
        homeId: 'valor_fort',
        x: fort.x + (Math.random() - 0.5) * 5,
        y: fort.y + (Math.random() - 0.5) * 5,
        hp: 280, maxHp: 280, atk: 30, gold: 200, level: 5
      });
      crusader.questTargetId = i % 2 === 0 ? 'orc_stronghold' : 'dragon_ruins';
    }

    for (let i = 0; i < 3; i++) {
      this.createEntity({
        name: `해군 기함 아테리아 ${i + 1}호`,
        race: 'human',
        role: 'navy',
        subClass: '왕립 해군 기함',
        isShip: true,
        ranged: true,
        projColor: '#38bdf8',
        faction: 'kingdom',
        homeId: 'bluewave',
        x: port.portWaterX + (Math.random() - 0.5) * 5,
        y: port.portWaterY + (Math.random() - 0.5) * 5,
        hp: 360, maxHp: 360, atk: 34, scale: 1.55, gold: 300
      });
    }

    this.addEffect(fort.x, fort.y, 7, '#60a5fa', 0.9);
    this.log('battle', '🛡️ 국왕의 출정 명령으로 발로르 요새의 성전사 군단과 푸른파도 대항구의 해군 기함이 적 본거지로 진격합니다!', fort.x, fort.y);
  }

  castDivineBlessing() {
    for (const plot of this.world.farmPlots) {
      plot.growth = 100;
    }
    for (const s of this.world.settlements) {
      if (s.faction === 'kingdom') {
        s.gold += 1000;
        s.stocks.wheat = (s.stocks.wheat || 0) + 25;
        s.stocks.fish = (s.stocks.fish || 0) + 20;
        s.stocks.spices = (s.stocks.spices || 0) + 15;
        this.addEffect(s.x, s.y, 9, '#fde047', 1.1);
      }
    }
    for (const e of this.entities) {
      if (e.faction === 'kingdom') e.hp = e.maxHp;
    }
    this.log('harvest', '✨ 여신의 축복이 대륙과 바다 너머 신대륙에 내려 모든 농작물이 즉시 만개하고 왕국 전체가 치유되었습니다!', this.world.settlementMap.solaris.x, this.world.settlementMap.solaris.y);
  }

  spawnMonstersForLair(lairId, count) {
    const lair = this.world.settlementMap[lairId];
    if (!lair) return;

    const templates = {
      goblin_camp: [
        { name: '고블린 약탈꾼', race: 'goblin', monsterType: 'goblin', icon: '👺', hp: 90, atk: 13, gold: 20, scale: 0.9 },
        { name: '고블린 덫사냥꾼', race: 'goblin', monsterType: 'goblin_archer', icon: '🏹', hp: 75, atk: 15, gold: 24, ranged: true, projColor: '#a3e635', scale: 0.9 },
        { name: '그림자 늑대', race: 'monster', monsterType: 'wolf', icon: '🐺', hp: 100, atk: 16, gold: 22, scale: 0.95 }
      ],
      orc_stronghold: [
        { name: '오크 전사', race: 'orc', monsterType: 'orc', icon: '👹', hp: 175, atk: 21, gold: 40, scale: 1.15 },
        { name: '오크 광전사', race: 'orc', monsterType: 'orc_berserker', icon: '🪓', hp: 220, atk: 26, gold: 55, scale: 1.25 },
        { name: '오크 샤먼', race: 'orc', monsterType: 'orc_shaman', icon: '🔮', hp: 140, atk: 23, gold: 48, ranged: true, projColor: '#c084fc', scale: 1.05 }
      ],
      obsidian_necropolis: [
        { name: '망령 흑기사', race: 'undead', monsterType: 'death_knight', icon: '💀', hp: 280, atk: 28, gold: 120, ranged: false, scale: 1.25 },
        { name: '해골 궁수', race: 'undead', monsterType: 'skeleton_archer', icon: '🏹', hp: 140, atk: 22, gold: 60, ranged: true, projColor: '#a855f7', scale: 1.05 },
        { name: '강령술 리치 군주', race: 'undead', monsterType: 'lich', icon: '👻', hp: 380, atk: 35, gold: 240, ranged: true, projColor: '#c084fc', scale: 1.4 }
      ],
      dragon_eyrie: [
        { name: '새끼 빙결 드래곤', race: 'dragon', monsterType: 'wyvern', icon: '🐉', hp: 320, atk: 28, gold: 150, ranged: true, projColor: '#38bdf8', scale: 1.3 },
        { name: '천공 바위 가고일', race: 'monster', monsterType: 'gargoyle', icon: '🗿', hp: 240, atk: 24, gold: 80, ranged: false, scale: 1.15 }
      ],
      pirate_cove: [
        { name: '블랙비어드 해적선', race: 'human', monsterType: 'pirate_ship', icon: '🏴‍☠️', hp: 230, atk: 22, gold: 90, isShip: true, ranged: true, projColor: '#f97316', scale: 1.35 },
        { name: '해골단 쾌속약탈선', race: 'human', monsterType: 'pirate_raider', icon: '☠️', hp: 180, atk: 19, gold: 70, isShip: true, ranged: true, projColor: '#ef4444', scale: 1.2 }
      ],
      volcano_isle: [
        { name: '심해 괴수 크라켄', race: 'monster', monsterType: 'kraken', icon: '🦑', hp: 480, atk: 35, gold: 220, isShip: true, ranged: true, projColor: '#a855f7', scale: 1.6 },
        { name: '바다 해룡 서펜트', race: 'monster', monsterType: 'sea_serpent', icon: '🐍', hp: 260, atk: 26, gold: 110, isShip: true, ranged: true, projColor: '#38bdf8', scale: 1.35 },
        { name: '흑요석 화염골렘', race: 'monster', monsterType: 'lava_golem', icon: '🌋', hp: 310, atk: 30, gold: 130, isShip: false, ranged: true, projColor: '#ef4444', scale: 1.4 }
      ]
    };

    const list = templates[lairId] || templates.goblin_camp;
    for (let i = 0; i < count; i++) {
      let tpl = list[i % list.length];
      const spawnX = tpl.isShip && lair.portWaterX ? lair.portWaterX : lair.x;
      const spawnY = tpl.isShip && lair.portWaterY ? lair.portWaterY : lair.y;

      this.createEntity({
        name: tpl.name,
        race: tpl.race || 'monster',
        role: 'monster',
        monsterType: tpl.monsterType,
        customIcon: tpl.icon,
        isShip: !!tpl.isShip,
        ranged: !!tpl.ranged,
        projColor: tpl.projColor || '#ef4444',
        scale: tpl.scale || 1.0,
        faction: 'monster',
        homeId: lairId,
        x: spawnX + (Math.random() - 0.5) * 16,
        y: spawnY + (Math.random() - 0.5) * 16,
        hp: tpl.hp,
        maxHp: tpl.hp,
        atk: tpl.atk,
        gold: tpl.gold
      });
    }
  }

  createEntity(opts) {
    const cfg = ROLE_CONFIG[opts.role] || ROLE_CONFIG.soldier;
    const ent = {
      id: NEXT_ENTITY_ID++,
      name: opts.name,
      race: opts.race || 'human',
      role: opts.role,
      subClass: opts.subClass || cfg.label,
      category: cfg.category,
      icon: opts.customIcon || cfg.icon,
      color: cfg.color,
      faction: opts.faction || 'kingdom',
      homeId: opts.homeId || 'solaris',
      x: opts.x,
      y: opts.y,
      vx: 0,
      vy: 0,
      targetX: opts.x,
      targetY: opts.y,
      speed: opts.speed || cfg.speed,
      hp: opts.hp || 100,
      maxHp: opts.maxHp || 100,
      atk: opts.atk || 10,
      gold: opts.gold ?? 50,
      level: opts.level || 1,
      kills: 0,
      scale: opts.scale || 1.0,
      isShip: !!opts.isShip,
      isAquatic: !!opts.isAquatic,
      isPredator: !!opts.isPredator,
      animalType: opts.animalType || null,
      dragonType: opts.dragonType || null,
      ranged: !!opts.ranged,
      projColor: opts.projColor || '#f97316',
      hasWagon: !!opts.hasWagon,
      guardTargetId: opts.guardTargetId || null,
      patrolRoad: !!opts.patrolRoad,
      boostTimer: 0,
      wingsPhase: Math.random() * Math.PI * 2,
      state: 'idle',
      thought: opts.thought || '주변을 살피는 중',
      stateTimer: Math.random() * 2,
      attackCooldown: 0,
      animPhase: Math.random() * Math.PI * 2,
      inventory: {
        wheat: 0,
        fish: 0,
        ore: 0,
        weapons: 0,
        herbs: 0,
        gems: 0,
        spices: 0
      },
      tradeRoute: null,
      combatTarget: null,
      fishingLine: null
    };
    this.entities.push(ent);
    return ent;
  }

  update(dt, worldTime, playerInput) {
    const isNight = worldTime.hour >= 21 || worldTime.hour < 5;
    let battleCount = 0;

    // 왕국 의뢰 및 현상금 퀘스트 진행도 갱신
    if (this.questSystem && this.player) {
      this.questSystem.update(dt, this.player);
    }

    // 영지 건축 타워 방어, 호위 용병단, 월드 보스 레이드, 보물상자 상호작용 갱신
    if (this.rpgManager) {
      this.rpgManager.update(dt, worldTime);
    }

    // 농작물 성장
    for (const plot of this.world.farmPlots) {
      if (plot.growth < 100) {
        plot.growth = Math.min(100, plot.growth + dt * (isNight ? 0.6 : 1.9));
      }
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.hp <= 0) {
        const shouldRemove = this.handleEntityDeath(e);
        if (shouldRemove) {
          this.entities.splice(i, 1);
        }
        continue;
      }

      e.animPhase += dt * 6;
      e.wingsPhase += dt * 8;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      if (e.stateTimer > 0) e.stateTimer -= dt;
      if (e.boostTimer > 0) e.boostTimer -= dt;

      if (!e.combatTarget && e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + dt * 3.0);
      }

      // 플레이어 조작
      if (e.role === 'player') {
        this.updatePlayerControl(e, dt, playerInput);
        continue;
      }

      // 🐾 야생 동물 AI
      if (e.role === 'animal') {
        this.updateAnimalAI(e, dt);
        this.moveTowardTarget(e, dt);
        continue;
      }

      // 🐉 고대 드래곤 AI
      if (e.role === 'dragon') {
        this.updateDragonAI(e, dt);
        this.moveTowardTarget(e, dt);
        continue;
      }

      // 전투 감지
      const engaged = this.checkAndRunCombat(e, dt);
      if (engaged) {
        battleCount++;
        continue;
      }

      // 직업별 AI
      switch (e.role) {
        case 'king':
          this.updateKingAI(e, dt, isNight);
          break;
        case 'royal_guard':
        case 'soldier':
          this.updateSoldierAI(e, dt, isNight);
          break;
        case 'navy':
          this.updateNavyAI(e, dt);
          break;
        case 'farmer':
          this.updateFarmerAI(e, dt, isNight);
          break;
        case 'fisherman':
          this.updateFishermanAI(e, dt, isNight);
          break;
        case 'miner':
          this.updateMinerAI(e, dt, isNight);
          break;
        case 'blacksmith':
          this.updateBlacksmithAI(e, dt, isNight);
          break;
        case 'merchant':
          this.updateMerchantAI(e, dt, isNight);
          break;
        case 'sea_merchant':
          this.updateSeaMerchantAI(e, dt);
          break;
        case 'mercenary':
        case 'adventurer':
          this.updateAdventurerAI(e, dt, isNight);
          break;
        case 'monster':
          this.updateMonsterAI(e, dt, isNight);
          break;
      }

      this.moveTowardTarget(e, dt);
    }

    this.activeBattles = Math.ceil(battleCount / 2);

    // 투사체 업데이트
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.projectiles.splice(i, 1);
    }

    // 플로팅 텍스트 업데이트
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.age += dt;
      ft.y -= dt * 0.9;
      if (ft.age >= ft.duration) this.floatingTexts.splice(i, 1);
    }

    // 특수 이펙트 업데이트
    for (let i = this.specialEffects.length - 1; i >= 0; i--) {
      const fx = this.specialEffects[i];
      fx.age += dt;
      if (fx.age >= fx.duration) this.specialEffects.splice(i, 1);
    }
  }

  // 🐾 야생 동물 AI
  updateAnimalAI(e, dt) {
    // 포식자나 사냥꾼이 가까이 오면 도망침
    if (!e.isPredator && Math.random() < 0.25) {
      let threat = null;
      let minD = 5.5;
      for (const other of this.entities) {
        if (other.faction === 'monster' || other.isPredator || other.role === 'player') {
          const dx = other.x - e.x;
          if (Math.abs(dx) > minD) continue;
          const dy = other.y - e.y;
          if (Math.abs(dy) > minD) continue;
          const d = Math.hypot(dx, dy);
          if (d < minD) {
            minD = d;
            threat = other;
          }
        }
      }
      if (threat) {
        // 반대 방향으로 질주
        const angle = Math.atan2(e.y - threat.y, e.x - threat.x);
        e.targetX = Math.max(4, Math.min(WORLD_WIDTH - 4, e.x + Math.cos(angle) * 12));
        e.targetY = Math.max(4, Math.min(WORLD_HEIGHT - 4, e.y + Math.sin(angle) * 12));
        e.thought = `⚠️ ${threat.name}을(를) 피해 재빠르게 도망치는 중!`;
        e.state = 'fleeing';
        return;
      }
    }

    if (e.stateTimer <= 0) {
      e.stateTimer = 4 + Math.random() * 5;
      const r = Math.random();
      if (e.animalType === 'dolphin') {
        // 돌고래는 바다 위를 힘차게 회유
        const angle = Math.random() * Math.PI * 2;
        e.targetX = Math.max(85, Math.min(160, e.x + Math.cos(angle) * 15));
        e.targetY = Math.max(40, Math.min(180, e.y + Math.sin(angle) * 15));
        e.thought = '🐬 파도를 가르며 힘차게 도약 중!';
      } else if (e.animalType === 'deer') {
        const angle = Math.random() * Math.PI * 2;
        e.targetX = e.x + Math.cos(angle) * 8;
        e.targetY = e.y + Math.sin(angle) * 8;
        e.thought = r < 0.6 ? '🌿 고요한 숲속에서 풀을 뜯는 중' : '💧 맑은 시냇가에서 목을 축이는 중';
      } else if (e.animalType === 'rabbit') {
        const angle = Math.random() * Math.PI * 2;
        e.targetX = e.x + Math.cos(angle) * 6;
        e.targetY = e.y + Math.sin(angle) * 6;
        e.thought = '🐇 들판을 깡충깡충 뛰어다니는 중';
      } else if (e.animalType === 'bear') {
        const angle = Math.random() * Math.PI * 2;
        e.targetX = e.x + Math.cos(angle) * 9;
        e.targetY = e.y + Math.sin(angle) * 9;
        e.thought = '🐻 산악 숲에서 영역을 순찰하며 어슬렁거리는 중';
      } else {
        const angle = Math.random() * Math.PI * 2;
        e.targetX = e.x + Math.cos(angle) * 6;
        e.targetY = e.y + Math.sin(angle) * 6;
        e.thought = '🌿 한가롭게 들판에서 쉬는 중';
      }
    }
  }

  // 🐉 고대 드래곤 AI
  updateDragonAI(e, dt) {
    // 근처에 인간이나 적이 오면 위엄 넘치는 브레스 공격!
    let target = null;
    let minD = 14;
    for (const other of this.entities) {
      if (other.faction === 'kingdom' && other.hp > 0) {
        const dx = other.x - e.x;
        if (Math.abs(dx) > minD) continue;
        const dy = other.y - e.y;
        if (Math.abs(dy) > minD) continue;
        const d = Math.hypot(dx, dy);
        if (d < minD) {
          minD = d;
          target = other;
        }
      }
    }

    if (target) {
      e.targetX = target.x;
      e.targetY = target.y;
      e.thought = `🐉 [${target.name}]을(를) 향해 파괴적인 브레스 방출!`;
      if (e.attackCooldown <= 0) {
        e.attackCooldown = 1.35;
        const dmg = Math.round(e.atk * 1.3);
        target.hp -= dmg;
        this.addFloatingText(target.x, target.y - 1.2, `💥-${dmg}`, '#ef4444', 1.2);

        // 화려한 원소 브레스 투사체 폭격
        const angle = Math.atan2(target.y - e.y, target.x - e.x);
        for (let b = -2; b <= 2; b++) {
          this.projectiles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle + b * 0.15) * 20,
            vy: Math.sin(angle + b * 0.15) * 20,
            color: e.projColor,
            life: minD / 20
          });
        }
        this.addEffect(e.x, e.y, 4, e.projColor, 0.6);
      }
      return;
    }

    // 비전투 시 웅장하게 상공 순회
    if (e.stateTimer <= 0) {
      e.stateTimer = 5 + Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 16;
      const home = this.world.settlementMap[e.homeId] || { x: e.x, y: e.y };
      e.targetX = home.x + Math.cos(angle) * r;
      e.targetY = home.y + Math.sin(angle) * r;
      e.thought = `🐉 거대한 날갯짓으로 상공을 선회하며 영역을 감시 중 (${e.subClass})`;
    }
  }

  canEntityTraverse(e, tx, ty) {
    if (tx < 1 || tx >= this.world.width - 1 || ty < 1 || ty >= this.world.height - 1) return false;
    const tile = this.world.getTile(tx, ty);

    // 1. 드래곤은 비행 생물이므로 모든 지형 통과 가능
    if (e.role === 'dragon') return true;

    // 2. 해상 선박 & 수중 생물: 바다, 강, 부두, 교량 밑, 산호초만 항해 가능
    if (e.isShip || e.isAquatic) {
      if (tile === TILE.DEEP_WATER || tile === TILE.WATER || tile === TILE.DOCK || tile === TILE.BRIDGE || tile === TILE.CORAL) {
        return true;
      }
      if (tile === TILE.SAND) return true; // 해변 접안
      return false; // 육지로는 절대 진입 불가!
    }

    // 3. 육상 유닛: 사람은 바다, 강, 산맥, 용암, 성벽 진입 불가!
    if (tile === TILE.BRIDGE || tile === TILE.DOCK) return true;
    if (tile === TILE.DEEP_WATER || tile === TILE.WATER || tile === TILE.MOUNTAIN || tile === TILE.SNOW || tile === TILE.WALL || tile === TILE.LAVA) {
      return false;
    }
    return true;
  }

  updatePlayerControl(p, dt, playerInput) {
    const curTx = Math.floor(p.x);
    const curTy = Math.floor(p.y);
    const curTile = this.world.getTile(curTx, curTy);

    const boostMult = p.boostTimer > 0 ? 1.85 : 1.0;

    if (playerInput && (playerInput.dx !== 0 || playerInput.dy !== 0)) {
      const len = Math.hypot(playerInput.dx, playerInput.dy) || 1;
      const step = p.speed * boostMult * dt * 3.2;
      const moveX = (playerInput.dx / len) * step;
      const moveY = (playerInput.dy / len) * step;

      p.vx = (playerInput.dx / len) * p.speed;
      p.vy = (playerInput.dy / len) * p.speed;

      const tryMove = (mx, my) => {
        const nx = p.x + mx;
        const ny = p.y + my;
        const nTx = Math.floor(nx);
        const nTy = Math.floor(ny);
        const nTile = this.world.getTile(nTx, nTy);

        // A. 배를 탄 상태
        if (p.isShip) {
          const isNavalArea = (nTile === TILE.DEEP_WATER || nTile === TILE.WATER || nTile === TILE.DOCK || nTile === TILE.BRIDGE || nTile === TILE.CORAL);
          if (isNavalArea) {
            p.x = nx;
            p.y = ny;
            return true;
          }
          // 해변(SAND)이나 부두(DOCK)로 전진하면 육지로 상륙!
          if (nTile === TILE.SAND || nTile === TILE.DOCK) {
            p.x = nx;
            p.y = ny;
            p.isShip = false;
            p.icon = '🌟';
            this.addFloatingText(p.x, p.y - 1.2, '🏇 육지에 상륙했습니다! (백마 탑승)', '#fde047', 1.5);
            return true;
          }
          if (Math.random() < 0.04) {
            this.addFloatingText(p.x, p.y - 1.0, '⚓ 배는 육지로 올라갈 수 없습니다! 부두나 해변에 정박하세요', '#f87171', 1.2);
          }
          return false;
        }

        // B. 육상 도보/말 상태
        const isWater = (nTile === TILE.WATER || nTile === TILE.DEEP_WATER);
        if (isWater) {
          // 부두나 해변에서 물로 나아가는 경우 배로 승선!
          if (curTile === TILE.DOCK || curTile === TILE.SAND) {
            p.x = nx;
            p.y = ny;
            p.isShip = true;
            p.icon = '⛵';
            this.addFloatingText(p.x, p.y - 1.2, '⛵ [특무범선] 승선 완료! 출항합니다', '#38bdf8', 1.5);
            return true;
          }
          if (Math.random() < 0.04) {
            this.addFloatingText(p.x, p.y - 1.0, '🌊 깊은 물입니다! 부두나 해변에서 배를 타거나 다리를 건너세요', '#60a5fa', 1.2);
          }
          return false;
        }

        // 산맥, 절벽, 성벽, 용암 통과 불가
        if (this.canEntityTraverse(p, nTx, nTy)) {
          p.x = nx;
          p.y = ny;
          return true;
        }
        return false;
      };

      // 비룡 비행 모드 또는 육/해상 지형 이동
      if (p.isFlying) {
        p.x = Math.max(2, Math.min(WORLD_WIDTH - 3, p.x + moveX));
        p.y = Math.max(2, Math.min(WORLD_HEIGHT - 3, p.y + moveY));
        p.animPhase = (p.animPhase || 0) + dt * 7;
        if (Math.random() < 0.12) {
          this.addEffect(p.x, p.y, 0.7, '#f97316', 0.25);
        }
      } else {
        // 대각선 이동 시도 -> 실패 시 X 단독 또는 Y 단독 슬라이딩 이동
        if (!tryMove(moveX, moveY)) {
          if (!tryMove(moveX, 0)) {
            tryMove(0, moveY);
          }
        }
      }

      p.x = Math.max(2, Math.min(WORLD_WIDTH - 3, p.x));
      p.y = Math.max(2, Math.min(WORLD_HEIGHT - 3, p.y));
      p.targetX = p.x;
      p.targetY = p.y;
      p.thought = p.isFlying
        ? '🐉 고대 비룡을 타고 창공 비행 중! (Space:착륙 / WASD:비행)'
        : (p.isShip
          ? '⛵ 전용 범선으로 대해양 및 군도 항해 중!'
          : (p.mount === 'horse'
            ? '🏇 왕실 백마를 타고 대륙 질주 중! (Space:비룡비행)'
            : '🚶 도보로 대륙 탐험 중 (Space:백마탑승)'));
    } else {
      this.moveTowardTarget(p, dt * boostMult);
    }

    if (p.attackCooldown <= 0) {
      let nearest = null;
      let minDist = 8.5;
      for (const other of this.entities) {
        if (other.faction === 'monster' && other.hp > 0) {
          const dx = other.x - p.x;
          if (Math.abs(dx) > minDist) continue;
          const dy = other.y - p.y;
          if (Math.abs(dy) > minDist) continue;
          const d = Math.hypot(dx, dy);
          if (d < minDist) {
            minDist = d;
            nearest = other;
          }
        }
      }
      if (nearest) {
        p.attackCooldown = 0.65;
        let comboMult = 1.0;
        if (this.rpgManager) {
          comboMult = this.rpgManager.addCombo(1);
        }
        if (typeof audioMgr !== 'undefined') audioMgr.playSword();
        const dmg = Math.round(p.atk * comboMult * (0.9 + Math.random() * 0.3));
        nearest.hp -= dmg;
        const angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
        this.projectiles.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * 22,
          vy: Math.sin(angle) * 22,
          color: '#facc15',
          life: minDist / 22
        });
        this.addFloatingText(nearest.x, nearest.y - 0.8, `-${dmg}`, '#fde047', 0.9);
        if (nearest.hp <= 0) {
          p.kills++;
          p.gold += nearest.gold;
          p.inventory.gems = (p.inventory.gems || 0) + 1;
          if (this.rpgManager) {
            this.rpgManager.addCombo(2);
          }
          this.addFloatingText(p.x, p.y - 1.2, `+${nearest.gold}G 토벌 성공!`, '#4ade80', 1.4);
        }
      }
    }
  }

  checkAndRunCombat(e, dt) {
    const isCivilian = (e.role === 'farmer' || e.role === 'fisherman' || e.role === 'miner' || e.role === 'merchant' || e.role === 'blacksmith');
    const detectRange = isCivilian ? 6.5 : 12.5;

    if (e.combatTarget) {
      if (e.combatTarget.hp <= 0 || Math.hypot(e.combatTarget.x - e.x, e.combatTarget.y - e.y) > 17) {
        e.combatTarget = null;
      }
    }

    if (!e.combatTarget && Math.random() < 0.35) {
      let nearest = null;
      let minDist = detectRange;
      for (const other of this.entities) {
        if (other === e || other.hp <= 0 || other.faction === e.faction || other.faction === 'neutral') continue;
        if (e.isShip !== other.isShip) continue;
        const dx = other.x - e.x;
        if (Math.abs(dx) > minDist) continue;
        const dy = other.y - e.y;
        if (Math.abs(dy) > minDist) continue;
        const d = Math.hypot(dx, dy);
        if (d < minDist) {
          minDist = d;
          nearest = other;
        }
      }
      if (nearest) e.combatTarget = nearest;
    }

    if (!e.combatTarget) return false;
    const target = e.combatTarget;
    e.fishingLine = null;

    if (isCivilian && e.role !== 'merchant') {
      const home = this.world.settlementMap[e.homeId];
      if (home) {
        e.targetX = home.x;
        e.targetY = home.y;
        e.state = 'fleeing';
        e.thought = `⚠️ ${target.name}에게서 대피 중!`;
        this.moveTowardTarget(e, dt * 1.25);
        return true;
      }
    }

    if (e.role === 'merchant') {
      e.thought = `⚠️ ${target.name} 습격! 호위병에게 보호받는 중!`;
      this.moveTowardTarget(e, dt * 1.15);
      return true;
    }

    e.state = 'combat';
    e.thought = e.isShip
      ? `💣 ${target.name}와(과) 해상 포격전 교전 중!`
      : `⚔️ ${target.name}와(과) 교전 중!`;

    const dist = Math.hypot(target.x - e.x, target.y - e.y);
    const attackRange = (e.ranged || e.isShip) ? 7.5 : 1.8;

    if (dist > attackRange) {
      e.targetX = target.x;
      e.targetY = target.y;
      this.moveTowardTarget(e, dt * 1.2);
    } else if (e.attackCooldown <= 0) {
      e.attackCooldown = 0.85 + Math.random() * 0.35;
      const dmg = Math.max(4, Math.round(e.atk * (0.85 + Math.random() * 0.35)));
      target.hp -= dmg;
      target.combatTarget = e;

      if (e.ranged || e.isShip) {
        const angle = Math.atan2(target.y - e.y, target.x - e.x);
        this.projectiles.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(angle) * 18,
          vy: Math.sin(angle) * 18,
          color: e.projColor,
          life: dist / 18
        });
      }

      this.addFloatingText(target.x, target.y - 0.8, `-${dmg}`, e.faction === 'kingdom' ? '#facc15' : '#ef4444', 0.9);

      if (target.hp <= 0) {
        e.kills++;
        const reward = Math.max(12, Math.round(target.gold * 0.65));
        e.gold += reward;
        if (e.faction === 'kingdom' && target.faction === 'monster') {
          e.inventory.gems = (e.inventory.gems || 0) + 1;
          this.addFloatingText(e.x, e.y - 1.2, `+${reward}G 전리품!`, '#fde047', 1.5);
          if (target.role === 'dragon' || target.monsterType === 'kraken' || target.isShip || Math.random() < 0.25) {
            this.log('battle', `⚔️ [${e.name}]이(가) ${target.name}을(를) 격파하고 현상금 ${reward}G를 획득했습니다!`, e.x, e.y);
          }
        }
        e.combatTarget = null;
      }
    }
    return true;
  }

  handleEntityDeath(e) {
    if (e.faction === 'kingdom') {
      const home = this.world.settlementMap[e.homeId] || this.world.settlementMap.solaris;
      e.hp = e.maxHp;
      e.x = (e.isShip && home.portWaterX ? home.portWaterX : home.x) + (Math.random() - 0.5) * 4;
      e.y = (e.isShip && home.portWaterY ? home.portWaterY : home.y) + (Math.random() - 0.5) * 4;
      e.targetX = e.x;
      e.targetY = e.y;
      e.combatTarget = null;
      e.thought = e.isShip ? '⚓ 조선소에서 선체 수리 후 재출항' : '🏥 치료소에서 회복 후 복귀 중';
      return false; // 왕국 주민/영웅은 마을에서 부활하여 존속
    }
    return true; // 몬스터/해적은 사망 시 배열에서 제거
  }

  updateKingAI(e, dt, isNight) {
    const home = this.world.settlementMap[e.homeId] || this.world.settlementMap.solaris;
    if (e.stateTimer <= 0) {
      e.stateTimer = 4 + Math.random() * 4;
      e.targetX = home.x + (Math.random() - 0.5) * 8;
      e.targetY = home.y + (Math.random() - 0.5) * 8;
      e.state = isNight ? 'resting' : 'patrol';
      e.thought = isNight
        ? `${e.icon} [${home.name}] 궁전에서 휴식 중`
        : `${e.icon} [${home.name}] 영지와 교역 시장을 시찰하는 중 (${RACE_LABELS[e.race]})`;
    }
  }

  updateSoldierAI(e, dt, isNight) {
    const home = this.world.settlementMap[e.homeId] || this.world.settlementMap.solaris;
    if (e.stateTimer <= 0) {
      e.stateTimer = 3.5 + Math.random() * 4;
      if (e.patrolRoad && e.role === 'soldier') {
        const links = this.world.roadLinks.filter(([a, b]) => a === e.homeId || b === e.homeId);
        if (links.length > 0) {
          const pair = links[Math.floor(Math.random() * links.length)];
          const otherId = pair[0] === e.homeId ? pair[1] : pair[0];
          const other = this.world.settlementMap[otherId];
          const ratio = other.faction === 'monster' ? 0.55 : (0.3 + Math.random() * 0.5);
          e.targetX = home.x + (other.x - home.x) * ratio + (Math.random() - 0.5) * 4;
          e.targetY = home.y + (other.y - home.y) * ratio + (Math.random() - 0.5) * 4;
          e.state = 'patrol';
          e.thought = `🛡️ ${home.name} ↔ ${other.name} 가도 순찰 중`;
          return;
        }
      }
      const angle = Math.random() * Math.PI * 2;
      const dist = 4 + Math.random() * (home.radius - 2);
      e.targetX = home.x + Math.cos(angle) * dist;
      e.targetY = home.y + Math.sin(angle) * dist;
      e.state = 'patrol';
      e.thought = `🛡️ [${home.name}] 경계 및 치안 유지 중 (${e.subClass})`;
    }
  }

  updateNavyAI(e, dt) {
    if (e.stateTimer <= 0) {
      e.stateTimer = 5 + Math.random() * 5;
      const waypoints = [
        { x: this.world.settlementMap.bluewave.portWaterX, y: this.world.settlementMap.bluewave.portWaterY, name: '푸른파도 연안' },
        { x: this.world.settlementMap.elvenheim.portWaterX, y: this.world.settlementMap.elvenheim.portWaterY, name: '엘븐하임 북서 해협' },
        { x: this.world.settlementMap.mirage_oasis.portWaterX, y: this.world.settlementMap.mirage_oasis.portWaterY, name: '미라주 남서 해협' },
        { x: 96, y: 126, name: '해골초도 해적 해역' },
        { x: 102, y: 52, name: '화산 군도 근해' }
      ];
      const pick = waypoints[Math.floor(Math.random() * waypoints.length)];
      e.targetX = pick.x + (Math.random() - 0.5) * 14;
      e.targetY = pick.y + (Math.random() - 0.5) * 14;
      e.state = 'patrol';
      e.thought = `🚢 [${pick.name}] 해상 무역로 초계 및 해적 소탕 항해 중`;
    }
  }

  updateFarmerAI(e, dt, isNight) {
    const home = this.world.settlementMap[e.homeId];
    if (isNight) {
      e.targetX = home.x + 3;
      e.targetY = home.y;
      e.state = 'resting';
      e.thought = '💤 하루 일과를 마치고 숙소에서 휴식 중';
      return;
    }

    const totalCarried = (e.inventory.wheat || 0) + (e.inventory.herbs || 0) + (e.inventory.spices || 0);
    if (totalCarried >= 4) {
      e.targetX = home.x;
      e.targetY = home.y;
      e.state = 'delivering';
      e.thought = `🌾 수확한 특산물(${totalCarried}개)을 시장/창고에 납품 중`;

      if (Math.hypot(e.x - home.x, e.y - home.y) < 3.5) {
        const earned = (e.inventory.wheat || 0) * 8 + (e.inventory.herbs || 0) * 12 + (e.inventory.spices || 0) * 18;
        home.stocks.wheat = (home.stocks.wheat || 0) + (e.inventory.wheat || 0);
        home.stocks.herbs = (home.stocks.herbs || 0) + (e.inventory.herbs || 0);
        home.stocks.spices = (home.stocks.spices || 0) + (e.inventory.spices || 0);
        e.gold += earned;
        this.addFloatingText(e.x, e.y - 1, `+${earned}G 수확 납품`, '#a3e635', 1.4);
        e.inventory.wheat = 0;
        e.inventory.herbs = 0;
        e.inventory.spices = 0;
        e.stateTimer = 1.0;
      }
      return;
    }

    if (!e.assignedPlot || Math.random() < 0.02) {
      const myPlots = this.world.farmPlots.filter(p => p.settlementId === e.homeId);
      const pool = myPlots.length > 0 ? myPlots : this.world.farmPlots;
      if (pool.length > 0) {
        e.assignedPlot = pool[Math.floor(Math.random() * pool.length)];
      }
    }

    if (e.assignedPlot) {
      const p = e.assignedPlot;
      e.targetX = p.x;
      e.targetY = p.y;
      if (Math.hypot(e.x - p.x, e.y - p.y) < 1.6) {
        e.state = 'farming';
        p.growth = Math.min(100, p.growth + dt * 18);
        e.thought = `🌾 ${p.cropType} 경작 및 수확 중 (${Math.floor(p.growth)}%)`;
        if (p.growth >= 100) {
          p.growth = 15;
          if (p.cropType === '향신료') e.inventory.spices = (e.inventory.spices || 0) + 1;
          else if (p.cropType === '약초') e.inventory.herbs = (e.inventory.herbs || 0) + 1;
          else e.inventory.wheat = (e.inventory.wheat || 0) + 1;
          this.addFloatingText(e.x, e.y - 0.8, `+1 ${p.cropType}`, '#facc15', 1.1);
          e.assignedPlot = null;
        }
      } else {
        e.state = 'walking';
        e.thought = `🌾 ${p.cropType} 농장으로 이동 중`;
      }
    }
  }

  updateFishermanAI(e, dt, isNight) {
    const home = this.world.settlementMap[e.homeId];
    if (isNight) {
      e.fishingLine = null;
      e.targetX = home.x + 2;
      e.targetY = home.y;
      e.state = 'resting';
      e.thought = '💤 어부 조합 숙소에서 그물 손질 및 휴식 중';
      return;
    }

    if (e.inventory.fish + e.inventory.gems >= 4) {
      e.fishingLine = null;
      e.targetX = home.x + 1;
      e.targetY = home.y;
      e.state = 'delivering';
      e.thought = `🐟 갓 잡은 생선(${e.inventory.fish}마리)을 수산시장에 판매 중`;

      if (Math.hypot(e.x - home.x, e.y - home.y) < 3.5) {
        const earned = e.inventory.fish * 9 + e.inventory.gems * 45;
        home.stocks.fish = (home.stocks.fish || 0) + e.inventory.fish;
        home.stocks.gems = (home.stocks.gems || 0) + e.inventory.gems;
        e.gold += earned;
        this.addFloatingText(e.x, e.y - 1, `+${earned}G 어획물 판매`, '#38bdf8', 1.4);
        e.inventory.fish = 0;
        e.inventory.gems = 0;
      }
      return;
    }

    if (!e.fishingSpot) {
      const spots = this.world.fishingSpots.filter(s => s.settlementId === e.homeId);
      if (spots.length > 0) e.fishingSpot = spots[Math.floor(Math.random() * spots.length)];
    }

    if (e.fishingSpot) {
      const sp = e.fishingSpot;
      e.targetX = sp.x;
      e.targetY = sp.y;
      if (Math.hypot(e.x - sp.x, e.y - sp.y) < 1.2) {
        e.state = 'fishing';
        e.fishingLine = { wx: sp.waterX, wy: sp.waterY };
        e.thought = sp.isBoat ? '🚣 고기잡이배 위에서 바다 낚시 중' : '🎣 부두에서 낚싯대를 드리우고 입질 대기 중';
        if (e.stateTimer <= 0) {
          e.stateTimer = 3.2 + Math.random() * 2.5;
          if (Math.random() < 0.15) {
            e.inventory.gems++;
            this.addFloatingText(e.x, e.y - 1, '🦪 심해 진주 낚음!', '#f472b6', 1.4);
          } else {
            e.inventory.fish++;
            this.addFloatingText(e.x, e.y - 0.9, '🐟 싱싱한 월척!', '#38bdf8', 1.1);
          }
        }
      } else {
        e.fishingLine = null;
        e.state = 'walking';
        e.thought = '🎣 낚시터 부두로 이동 중';
      }
    }
  }

  updateMinerAI(e, dt, isNight) {
    const home = this.world.settlementMap[e.homeId];
    if (isNight) {
      e.targetX = home.x;
      e.targetY = home.y + 2;
      e.state = 'resting';
      e.thought = '💤 광산 숙소에서 휴식 중';
      return;
    }

    if (e.inventory.ore + e.inventory.gems >= 4) {
      e.targetX = home.x;
      e.targetY = home.y;
      e.state = 'delivering';
      e.thought = `⛏️ 채굴한 광석(${e.inventory.ore}개)을 용광로로 운반 중`;

      if (Math.hypot(e.x - home.x, e.y - home.y) < 3.0) {
        const earned = e.inventory.ore * 11 + e.inventory.gems * 40;
        home.stocks.ore = (home.stocks.ore || 0) + e.inventory.ore;
        home.stocks.gems = (home.stocks.gems || 0) + e.inventory.gems;
        e.gold += earned;
        this.addFloatingText(e.x, e.y - 1, `+${earned}G 광석 납품`, '#fb923c', 1.3);
        e.inventory.ore = 0;
        e.inventory.gems = 0;
      }
      return;
    }

    if (!e.mineNode) {
      const nodes = this.world.mineNodes;
      e.mineNode = nodes[Math.floor(Math.random() * nodes.length)];
    }

    if (e.mineNode) {
      e.targetX = e.mineNode.x;
      e.targetY = e.mineNode.y;
      if (Math.hypot(e.x - e.mineNode.x, e.y - e.mineNode.y) < 1.5) {
        e.state = 'mining';
        e.thought = `⛏️ 드워프식 망치질로 ${e.mineNode.oreType} 채굴 중`;
        if (e.stateTimer <= 0) {
          e.stateTimer = 2.8 + Math.random() * 2;
          if (e.mineNode.oreType === '마정석') {
            e.inventory.gems++;
            this.addFloatingText(e.x, e.y - 0.9, '💎 마정석 채굴!', '#c084fc', 1.2);
          } else {
            e.inventory.ore++;
            this.addFloatingText(e.x, e.y - 0.9, `⛏️ ${e.mineNode.oreType} +1`, '#cbd5e1', 1.1);
          }
        }
      } else {
        e.state = 'walking';
        e.thought = `⛏️ ${e.mineNode.oreType} 광산으로 이동 중`;
      }
    }
  }

  updateBlacksmithAI(e, dt, isNight) {
    const home = this.world.settlementMap[e.homeId];
    e.targetX = home.x;
    e.targetY = home.y;
    e.state = 'smithing';
    e.thought = '⚒️ 드워프 대용광로에서 룬 마법 무기와 강철 갑옷 단조 중';

    if (e.stateTimer <= 0) {
      e.stateTimer = 4.5 + Math.random() * 2;
      if ((home.stocks.ore || 0) >= 2) {
        home.stocks.ore -= 2;
        home.stocks.weapons = (home.stocks.weapons || 0) + 1;
        e.gold += 25;
        this.addFloatingText(e.x, e.y - 1.0, '⚔️ 명품 강철검 완성!', '#fb923c', 1.3);
      }
    }
  }

  updateMerchantAI(e, dt, isNight) {
    const sMap = this.world.settlementMap;
    const mainlandTowns = ['solaris', 'goldenwheat', 'bluewave', 'ironforge', 'silverleaf', 'valor_fort', 'oakwood', 'windmill_valley', 'st_mare', 'crystal_falls', 'valkyrie_gate'];

    if (!e.tradeRoute) {
      let curTown = sMap[e.homeId] || sMap.solaris;
      let minDist = 999;
      for (const tid of mainlandTowns) {
        const t = sMap[tid];
        if (!t) continue;
        const d = Math.hypot(t.x - e.x, t.y - e.y);
        if (d < minDist) {
          minDist = d;
          curTown = t;
        }
      }

      let bestGood = 'wheat';
      if (curTown.id === 'goldenwheat' || curTown.id === 'windmill_valley') bestGood = 'wheat';
      else if (curTown.id === 'bluewave' || curTown.id === 'st_mare') bestGood = (curTown.stocks.spices > 8 ? 'spices' : 'fish');
      else if (curTown.id === 'ironforge' || curTown.id === 'valkyrie_gate') bestGood = (curTown.stocks.weapons > 15 ? 'weapons' : 'ore');
      else if (curTown.id === 'silverleaf' || curTown.id === 'crystal_falls') bestGood = 'herbs';
      else if (curTown.id === 'solaris') bestGood = 'gems';
      else bestGood = 'weapons';

      const candidates = mainlandTowns.filter(id => id !== curTown.id);
      const destId = (curTown.id !== 'solaris' && Math.random() < 0.45)
        ? 'solaris'
        : candidates[Math.floor(Math.random() * candidates.length)];

      const buyAmount = 10 + Math.floor(Math.random() * 12);
      if ((curTown.stocks[bestGood] || 0) >= 5) {
        curTown.stocks[bestGood] = Math.max(2, curTown.stocks[bestGood] - buyAmount);
      }
      e.inventory[bestGood] = (e.inventory[bestGood] || 0) + buyAmount;

      e.tradeRoute = { fromId: curTown.id, toId: destId, good: bestGood, amount: buyAmount };
    }

    const dest = sMap[e.tradeRoute.toId];
    e.targetX = dest.x;
    e.targetY = dest.y;
    e.state = 'trading';
    e.thought = `🐎 [${dest.name}] 행 무역마차: ${GOODS_KR[e.tradeRoute.good]} ${e.tradeRoute.amount}개 운송 중`;

    if (Math.hypot(e.x - dest.x, e.y - dest.y) < 4.0) {
      const { good, amount, fromId } = e.tradeRoute;
      const fromTown = sMap[fromId];
      const unitPrice = (dest.prices && dest.prices[good]) ? dest.prices[good] : 24;
      const revenue = amount * unitPrice;

      dest.stocks[good] = (dest.stocks[good] || 0) + amount;
      e.inventory[good] = 0;
      e.gold += Math.round(revenue * 0.45);
      dest.gold += Math.round(revenue * 0.55);

      this.addFloatingText(e.x, e.y - 1.2, `🪙 육상무역 +${revenue}G!`, '#facc15', 1.7);
      this.log(
        'trade',
        `🐎 [${e.name}] 마차가 ${fromTown.name}의 ${GOODS_KR[good]} ${amount}단위를 [${dest.name}]에 매각하여 ${revenue}G 수익 달성!`,
        e.x,
        e.y
      );

      e.homeId = dest.id;
      e.tradeRoute = null;
      e.stateTimer = 2.0;
    }
  }

  updateSeaMerchantAI(e, dt) {
    const sMap = this.world.settlementMap;
    const ports = ['bluewave', 'elvenheim', 'mirage_oasis', 'st_mare', 'siren_coral', 'lone_beacon'];

    if (!e.tradeRoute) {
      let curPort = sMap[e.homeId] || sMap.bluewave;
      if (!ports.includes(curPort.id)) curPort = sMap.bluewave;

      let bestGood = 'fish';
      if (curPort.id === 'mirage_oasis') bestGood = 'spices';
      else if (curPort.id === 'elvenheim' || curPort.id === 'siren_coral') bestGood = 'gems';
      else bestGood = 'weapons';

      const destCandidates = ports.filter(id => id !== curPort.id);
      const destId = destCandidates[Math.floor(Math.random() * destCandidates.length)];
      const buyAmount = 14 + Math.floor(Math.random() * 14);

      if ((curPort.stocks[bestGood] || 0) >= 6) {
        curPort.stocks[bestGood] = Math.max(4, curPort.stocks[bestGood] - buyAmount);
      }
      e.inventory[bestGood] = (e.inventory[bestGood] || 0) + buyAmount;

      e.tradeRoute = { fromId: curPort.id, toId: destId, good: bestGood, amount: buyAmount };
    }

    const dest = sMap[e.tradeRoute.toId];
    const targetPx = dest.portWaterX || dest.x;
    const targetPy = dest.portWaterY || dest.y;
    e.targetX = targetPx;
    e.targetY = targetPy;
    e.state = 'sailing';
    e.thought = `⛵ [${dest.name}] 행 대양 무역선: ${GOODS_KR[e.tradeRoute.good]} ${e.tradeRoute.amount}상자 항해 운송 중`;

    if (Math.hypot(e.x - targetPx, e.y - targetPy) < 4.5) {
      const { good, amount, fromId } = e.tradeRoute;
      const fromPort = sMap[fromId];
      const unitPrice = (dest.prices && dest.prices[good]) ? dest.prices[good] : 45;
      const revenue = amount * unitPrice;

      dest.stocks[good] = (dest.stocks[good] || 0) + amount;
      e.inventory[good] = 0;
      e.gold += Math.round(revenue * 0.5);
      dest.gold += Math.round(revenue * 0.5);

      this.addFloatingText(e.x, e.y - 1.4, `⛵ 해상교역 대박 +${revenue}G!`, '#fde047', 1.9);
      this.log(
        'trade',
        `⛵ [${e.name}]이(가) 바다 건너 [${fromPort.name}]산 ${GOODS_KR[good]} ${amount}상자를 [${dest.name}]에 입항·매각하여 ${revenue}G 거액 달성!`,
        e.x,
        e.y
      );

      e.homeId = dest.id;
      e.tradeRoute = null;
      e.stateTimer = 2.5;
    }
  }

  updateAdventurerAI(e, dt, isNight) {
    if (e.guardTargetId) {
      const merchant = this.entities.find(m => m.id === e.guardTargetId);
      if (merchant) {
        const angle = (e.id % 6) * (Math.PI / 3);
        e.targetX = merchant.x + Math.cos(angle) * 2.2;
        e.targetY = merchant.y + Math.sin(angle) * 2.2;
        e.state = 'escorting';
        e.thought = `🗡️ [${merchant.name}] 근접 호위 중`;
        return;
      } else {
        e.guardTargetId = null;
      }
    }

    const home = this.world.settlementMap[e.homeId] || this.world.settlementMap.valor_fort;

    if (e.hp < e.maxHp * 0.45 || (e.inventory.gems || 0) >= 3) {
      e.targetX = home.x;
      e.targetY = home.y;
      e.state = 'returning';
      e.thought = `🍺 [${home.name}] 길드/여관으로 귀환하여 전리품 정산 및 휴식 중 (${RACE_LABELS[e.race]})`;

      if (Math.hypot(e.x - home.x, e.y - home.y) < 3.5) {
        e.hp = e.maxHp;
        if (e.inventory.gems > 0) {
          const bounty = e.inventory.gems * 60;
          e.gold += bounty;
          home.stocks.gems = (home.stocks.gems || 0) + e.inventory.gems;
          this.addFloatingText(e.x, e.y - 1.1, `+${bounty}G 토벌 보수!`, '#c084fc', 1.4);
          e.inventory.gems = 0;
        }
        if ((home.stocks.weapons || 0) > 5 && e.gold >= 80) {
          home.stocks.weapons--;
          e.gold -= 60;
          e.atk += 2;
          e.level++;
        }
      }
      return;
    }

    if (e.stateTimer <= 0 || !e.questTargetId) {
      e.stateTimer = 8 + Math.random() * 6;
      const lairs = ['goblin_camp', 'orc_stronghold', 'dragon_ruins', 'volcano_isle'];
      e.questTargetId = lairs[e.id % lairs.length];
    }

    const targetLair = this.world.settlementMap[e.questTargetId];
    if (targetLair) {
      e.targetX = targetLair.x + (Math.sin(e.id) * 6);
      e.targetY = targetLair.y + (Math.cos(e.id) * 6);
      e.state = 'questing';
      e.thought = `⚔️ [${targetLair.name}] 원정 토벌 중 (Lv.${e.level} ${e.subClass})`;
    }
  }

  updateMonsterAI(e, dt, isNight) {
    const lair = this.world.settlementMap[e.homeId];
    if (!lair) return;

    if (e.stateTimer <= 0) {
      e.stateTimer = 4 + Math.random() * 5;

      if (e.isShip) {
        const seaTargets = [
          { x: 112, y: 135, msg: '🏴‍☠️ 남서 황금향신료 해상 무역로 매복 중!' },
          { x: 105, y: 85,  msg: '🏴‍☠️ 북서 요정항로 무역선 사냥 중!' },
          { x: lair.portWaterX || lair.x, y: lair.portWaterY || lair.y, msg: `🏴‍☠️ [${lair.name}] 근해 초계 중` }
        ];
        const pick = seaTargets[Math.floor(Math.random() * seaTargets.length)];
        e.targetX = pick.x + (Math.random() - 0.5) * 18;
        e.targetY = pick.y + (Math.random() - 0.5) * 18;
        e.state = 'raiding';
        e.thought = pick.msg;
        return;
      }

      if (Math.random() < (isNight ? 0.55 : 0.30)) {
        let raidTarget = this.world.settlementMap.valor_fort;
        if (e.homeId === 'goblin_camp') {
          raidTarget = Math.random() < 0.5 ? this.world.settlementMap.goldenwheat : this.world.settlementMap.valor_fort;
        } else if (e.homeId === 'dragon_ruins') {
          raidTarget = this.world.settlementMap.ironforge;
        }
        const ratio = 0.45 + Math.random() * 0.35;
        e.targetX = lair.x + (raidTarget.x - lair.x) * ratio + (Math.random() - 0.5) * 8;
        e.targetY = lair.y + (raidTarget.y - lair.y) * ratio + (Math.random() - 0.5) * 8;
        e.state = 'raiding';
        e.thought = `👹 [${raidTarget.name}] 방면 가도 약탈 및 습격 중!`;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 11;
        e.targetX = lair.x + Math.cos(angle) * r;
        e.targetY = lair.y + Math.sin(angle) * r;
        e.state = 'roaming';
        e.thought = `👹 [${lair.name}] 영역 경계 및 배회 중`;
      }
    }
  }

  moveTowardTarget(e, dt) {
    const dx = e.targetX - e.x;
    const dy = e.targetY - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.15) {
      e.vx = 0;
      e.vy = 0;
      return;
    }

    const curTile = this.world.getTile(Math.floor(e.x), Math.floor(e.y));
    let terrainMult = 1.0;
    if (curTile === TILE.ROAD || curTile === TILE.BRIDGE || curTile === TILE.CASTLE_FLOOR) {
      terrainMult = 1.35;
    } else if (curTile === TILE.DEEP_WATER && e.isShip) {
      terrainMult = 1.30;
    }

    const step = Math.min(dist, e.speed * terrainMult * dt * 2.5);
    const moveX = (dx / dist) * step;
    const moveY = (dy / dist) * step;

    e.vx = (dx / dist) * e.speed;
    e.vy = (dy / dist) * e.speed;

    const tryMove = (mx, my) => {
      const nx = e.x + mx;
      const ny = e.y + my;
      const nTx = Math.floor(nx);
      const nTy = Math.floor(ny);
      if (this.canEntityTraverse(e, nTx, nTy)) {
        e.x = Math.max(2, Math.min(WORLD_WIDTH - 3, nx));
        e.y = Math.max(2, Math.min(WORLD_HEIGHT - 3, ny));
        return true;
      }
      return false;
    };

    if (!tryMove(moveX, moveY)) {
      if (!tryMove(moveX, 0)) {
        tryMove(0, moveY);
      }
    }
  }
}

window.NAMES_BY_RACE = NAMES_BY_RACE;
window.ROLE_CONFIG = ROLE_CONFIG;
window.GOODS_KR = GOODS_KR;
window.RACE_LABELS = RACE_LABELS;
window.EntityManager = EntityManager;
