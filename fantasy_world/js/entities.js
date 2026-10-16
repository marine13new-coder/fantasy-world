// ============================================================================
// entities.js - 본토 & 신대륙 NPC, 해상 무역선, 해군 함대, 해적선, 크라켄 및 플레이어 영웅 제어
// ============================================================================

const HUMAN_NAMES = [
  '아르투르', '레오나르드', '엘레나', '카르소', '베른하르트', '세라피나', '로데릭', '실비아',
  '가웨인', '아이리스', '하인리히', '마르코', '벨라', '오스왈드', '클라라', '단테',
  '레이놀즈', '프레이야', '토르발드', '길버트', '세실리아', '지크프리트', '로렌초', '한스',
  '그레고리', '루시아', '발렌타인', '빅토르', '아델하이트', '에드워드', '올리버', '테오도르',
  '아리엘', '실바나', '칼리프', '자파르', '샤자드', '드레이크', '발보사'
];

const ROLE_CONFIG = {
  player:       { label: '플레이어 영웅', category: 'adventurer', icon: '🌟', color: '#facc15', speed: 2.35 },
  king:         { label: '국왕 / 통치자', category: 'soldier', icon: '👑', color: '#facc15', speed: 1.0 },
  soldier:      { label: '왕국 수비병', category: 'soldier', icon: '🛡️', color: '#3b82f6', speed: 1.55 },
  royal_guard:  { label: '왕궁 근위대', category: 'soldier', icon: '⚜️', color: '#60a5fa', speed: 1.65 },
  navy:         { label: '왕립 해군 함대', category: 'soldier', icon: '🚢', color: '#38bdf8', speed: 1.80 },
  merchant:     { label: '육상 대상인 (마차)', category: 'merchant', icon: '🐎', color: '#f59e0b', speed: 1.40 },
  sea_merchant: { label: '해상 무역범선', category: 'merchant', icon: '⛵', color: '#fbbf24', speed: 1.75 },
  mercenary:    { label: '용병 단원', category: 'adventurer', icon: '🗡️', color: '#f43f5e', speed: 1.70 },
  adventurer:   { label: '모험가', category: 'adventurer', icon: '⚔️', color: '#a855f7', speed: 1.75 },
  farmer:       { label: '농부 / 재배사', category: 'farmer', icon: '🌾', color: '#84cc16', speed: 1.25 },
  fisherman:    { label: '어부', category: 'fisherman', icon: '🎣', color: '#06b6d4', speed: 1.25 },
  miner:        { label: '광부', category: 'miner', icon: '⛏️', color: '#94a3b8', speed: 1.25 },
  blacksmith:   { label: '대장장이', category: 'miner', icon: '⚒️', color: '#fb923c', speed: 1.20 },
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

let NEXT_ENTITY_ID = 1;

class EntityManager {
  constructor(world, onEventLog) {
    this.world = world;
    this.onEventLog = onEventLog || (() => {});
    this.entities = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.specialEffects = []; // 번개, 광역 마법, 축복 파동 등 시각 이펙트
    this.activeBattles = 0;
    this.player = null;
  }

  log(type, text, x, y) {
    this.onEventLog({ type, text, x, y, time: Date.now() });
  }

  addFloatingText(x, y, text, color = '#ffffff', duration = 1.6) {
    if (this.floatingTexts.length > 220) this.floatingTexts.shift();
    this.floatingTexts.push({ x, y, text, color, age: 0, duration });
  }

  addEffect(x, y, radius, color = '#facc15', duration = 0.7) {
    this.specialEffects.push({ x, y, radius, color, age: 0, duration });
  }

  spawnInitialPopulation() {
    const sMap = this.world.settlementMap;

    // 1. 왕도 솔라리스 국왕 & 엘븐하임 여왕 & 미라주 술탄
    this.createEntity({
      name: '국왕 아서스 3세',
      role: 'king',
      faction: 'kingdom',
      homeId: 'solaris',
      x: sMap.solaris.x,
      y: sMap.solaris.y - 4,
      hp: 400, maxHp: 400, atk: 30, gold: 6000,
      thought: '👑 왕도와 바다 너머 신대륙 교역을 총괄하는 중'
    });

    this.createEntity({
      name: '요정여왕 실바나',
      role: 'king',
      customIcon: '🌸',
      faction: 'kingdom',
      homeId: 'elvenheim',
      x: sMap.elvenheim.x,
      y: sMap.elvenheim.y - 2,
      hp: 380, maxHp: 380, atk: 34, ranged: true, projColor: '#2dd4bf', gold: 4500,
      thought: '🌸 세계수의 축복으로 엘븐하임 성소를 수호하는 중'
    });

    this.createEntity({
      name: '황금술탄 알라딘',
      role: 'king',
      customIcon: '🕌',
      faction: 'kingdom',
      homeId: 'mirage_oasis',
      x: sMap.mirage_oasis.x,
      y: sMap.mirage_oasis.y - 2,
      hp: 380, maxHp: 380, atk: 32, gold: 7000,
      thought: '🕌 미라주 오아시스의 향신료와 보석 무역을 관장하는 중'
    });

    // 왕궁 근위대
    for (let i = 0; i < 8; i++) {
      this.createEntity({
        name: `근위기사 ${this.pickName()}`,
        role: 'royal_guard',
        faction: 'kingdom',
        homeId: 'solaris',
        x: sMap.solaris.x + (Math.random() - 0.5) * 14,
        y: sMap.solaris.y + (Math.random() - 0.5) * 14,
        hp: 220, maxHp: 220, atk: 24, gold: 130
      });
    }

    // 2. 본토 및 신대륙 각 거점 수비병 배치
    const allKingdomTowns = ['solaris', 'goldenwheat', 'bluewave', 'ironforge', 'silverleaf', 'valor_fort', 'elvenheim', 'mirage_oasis'];
    for (const townId of allKingdomTowns) {
      const town = sMap[townId];
      const count = townId === 'valor_fort' ? 10 : 5;
      for (let i = 0; i < count; i++) {
        const isElven = townId === 'elvenheim';
        this.createEntity({
          name: `${town.name.split(' ')[0]} 수비병 ${this.pickName()}`,
          role: 'soldier',
          subClass: isElven ? '엘프 수호궁수' : '왕국 수비병',
          ranged: isElven,
          projColor: '#2dd4bf',
          faction: 'kingdom',
          homeId: townId,
          patrolRoad: i % 2 === 0 && townId !== 'elvenheim' && townId !== 'mirage_oasis',
          x: town.x + (Math.random() - 0.5) * 10,
          y: town.y + (Math.random() - 0.5) * 10,
          hp: 170, maxHp: 170, atk: 19, gold: 75
        });
      }
    }

    // 3. 농부 (황금밀 농촌, 엘븐하임 약초원, 미라주 향신료 농장)
    for (let i = 0; i < 14; i++) {
      const home = sMap.goldenwheat;
      this.createEntity({
        name: `농부 ${this.pickName()}`,
        role: 'farmer',
        faction: 'kingdom',
        homeId: 'goldenwheat',
        x: home.x + (Math.random() - 0.5) * 16,
        y: home.y + (Math.random() - 0.5) * 14,
        hp: 95, maxHp: 95, atk: 6, gold: 50
      });
    }
    for (let i = 0; i < 5; i++) {
      const home = sMap.elvenheim;
      this.createEntity({
        name: `엘프 약초사 ${this.pickName()}`,
        role: 'farmer',
        subClass: '세계수 약초사',
        faction: 'kingdom',
        homeId: 'elvenheim',
        x: home.x - 6 + (Math.random() - 0.5) * 6,
        y: home.y + 6 + (Math.random() - 0.5) * 4,
        hp: 100, maxHp: 100, atk: 8, gold: 65
      });
    }
    for (let i = 0; i < 5; i++) {
      const home = sMap.mirage_oasis;
      this.createEntity({
        name: `향신료 재배사 ${this.pickName()}`,
        role: 'farmer',
        subClass: '오아시스 향신료 농부',
        faction: 'kingdom',
        homeId: 'mirage_oasis',
        x: home.x - 6 + (Math.random() - 0.5) * 6,
        y: home.y - 5 + (Math.random() - 0.5) * 4,
        hp: 100, maxHp: 100, atk: 8, gold: 70
      });
    }

    // 4. 어부 (푸른파도 대항구 10명, 실버리프 호수마을 5명)
    for (let i = 0; i < 10; i++) {
      this.createEntity({
        name: `바다어부 ${this.pickName()}`,
        role: 'fisherman',
        faction: 'kingdom',
        homeId: 'bluewave',
        x: sMap.bluewave.x + (Math.random() - 0.5) * 8,
        y: sMap.bluewave.y + (Math.random() - 0.5) * 8,
        hp: 95, maxHp: 95, atk: 7, gold: 55
      });
    }
    for (let i = 0; i < 5; i++) {
      this.createEntity({
        name: `호수어부 ${this.pickName()}`,
        role: 'fisherman',
        faction: 'kingdom',
        homeId: 'silverleaf',
        x: sMap.silverleaf.x + (Math.random() - 0.5) * 6,
        y: sMap.silverleaf.y - 4 + (Math.random() - 0.5) * 4,
        hp: 95, maxHp: 95, atk: 7, gold: 50
      });
    }

    // 5. 광부 (8명) & 대장장이 (4명)
    for (let i = 0; i < 8; i++) {
      this.createEntity({
        name: `광부 ${this.pickName()}`,
        role: 'miner',
        faction: 'kingdom',
        homeId: 'ironforge',
        x: sMap.ironforge.x + (Math.random() - 0.5) * 10,
        y: sMap.ironforge.y - 3 + (Math.random() - 0.5) * 6,
        hp: 125, maxHp: 125, atk: 12, gold: 65
      });
    }
    for (let i = 0; i < 4; i++) {
      this.createEntity({
        name: `대장장이 ${this.pickName()}`,
        role: 'blacksmith',
        faction: 'kingdom',
        homeId: 'ironforge',
        x: sMap.ironforge.x + (Math.random() - 0.5) * 5,
        y: sMap.ironforge.y + (Math.random() - 0.5) * 4,
        hp: 145, maxHp: 145, atk: 16, gold: 120
      });
    }

    // 6. 본토 육상 무역 마차 (12팀) & 호위 용병
    const mainlandTowns = ['solaris', 'goldenwheat', 'bluewave', 'ironforge', 'silverleaf', 'valor_fort'];
    for (let i = 0; i < 12; i++) {
      const startTownId = mainlandTowns[i % mainlandTowns.length];
      const startTown = sMap[startTownId];
      const merchant = this.createEntity({
        name: `육상상단 ${this.pickName()}`,
        role: 'merchant',
        faction: 'kingdom',
        homeId: startTownId,
        hasWagon: true,
        x: startTown.x + (Math.random() - 0.5) * 6,
        y: startTown.y + (Math.random() - 0.5) * 6,
        hp: 140, maxHp: 140, atk: 9, gold: 350
      });

      this.createEntity({
        name: `호위용병 ${this.pickName()}`,
        role: 'mercenary',
        subClass: '상단 호위무사',
        faction: 'kingdom',
        homeId: startTownId,
        guardTargetId: merchant.id,
        x: merchant.x + 1.2,
        y: merchant.y + 1.2,
        hp: 180, maxHp: 180, atk: 20, gold: 95
      });
    }

    // 7. 대해양 해상 무역 범선 (10척) & 왕립 해군 호위함대 (8척)!
    const ports = ['bluewave', 'elvenheim', 'mirage_oasis'];
    for (let i = 0; i < 10; i++) {
      const portId = ports[i % ports.length];
      const pTown = sMap[portId];
      this.createEntity({
        name: `무역범선 ${this.pickName()}호`,
        role: 'sea_merchant',
        subClass: '대양 무역 갤리온',
        isShip: true,
        faction: 'kingdom',
        homeId: portId,
        x: pTown.portWaterX + (Math.random() - 0.5) * 8,
        y: pTown.portWaterY + (Math.random() - 0.5) * 8,
        hp: 240, maxHp: 240, atk: 18, ranged: true, projColor: '#fde047',
        scale: 1.35,
        gold: 600
      });
    }

    for (let i = 0; i < 8; i++) {
      const portId = ports[i % ports.length];
      const pTown = sMap[portId];
      this.createEntity({
        name: `왕립해군 전열함 ${i + 1}호`,
        role: 'navy',
        subClass: '왕립 해군 구축함',
        isShip: true,
        ranged: true,
        projColor: '#38bdf8',
        faction: 'kingdom',
        homeId: portId,
        x: pTown.portWaterX + (Math.random() - 0.5) * 12,
        y: pTown.portWaterY + (Math.random() - 0.5) * 12,
        hp: 320, maxHp: 320, atk: 28,
        scale: 1.45,
        gold: 250
      });
    }

    // 8. 모험가 파티 & 자유 용병단 (24명)
    const classes = [
      { subClass: '소드마스터', atk: 25, hp: 210, ranged: false, projColor: '#60a5fa' },
      { subClass: '아크메이지', atk: 29, hp: 155, ranged: true,  projColor: '#f97316' },
      { subClass: '엘프 레인저', atk: 23, hp: 165, ranged: true, projColor: '#4ade80' },
      { subClass: '성전사 팔라딘', atk: 22, hp: 240, ranged: false, projColor: '#facc15' }
    ];

    for (let i = 0; i < 24; i++) {
      const cls = classes[i % classes.length];
      const baseTowns = ['solaris', 'valor_fort', 'elvenheim', 'mirage_oasis'];
      const baseTownId = baseTowns[i % baseTowns.length];
      const baseTown = sMap[baseTownId];
      const isMerc = i % 3 === 0;
      this.createEntity({
        name: `${cls.subClass} ${this.pickName()}`,
        role: isMerc ? 'mercenary' : 'adventurer',
        subClass: cls.subClass,
        ranged: cls.ranged,
        projColor: cls.projColor,
        faction: 'kingdom',
        homeId: baseTownId,
        x: baseTown.x + (Math.random() - 0.5) * 10,
        y: baseTown.y + (Math.random() - 0.5) * 10,
        hp: cls.hp, maxHp: cls.hp, atk: cls.atk, gold: 140,
        level: 1 + (i % 5)
      });
    }

    // 9. 육상 및 해양 몬스터·해적 초기 스폰
    this.spawnMonstersForLair('goblin_camp', 14);
    this.spawnMonstersForLair('orc_stronghold', 14);
    this.spawnMonstersForLair('dragon_ruins', 10);
    this.spawnMonstersForLair('pirate_cove', 12);
    this.spawnMonstersForLair('volcano_isle', 10);
  }

  // 플레이어 캐릭터 소환 또는 선택
  spawnOrGetPlayer() {
    if (this.player && this.player.hp > 0) {
      return this.player;
    }
    const cap = this.world.settlementMap.solaris;
    this.player = this.createEntity({
      name: '플레이어 (대모험가)',
      role: 'player',
      subClass: '자유 항해사 & 영웅',
      customIcon: '🌟',
      faction: 'kingdom',
      homeId: 'solaris',
      ranged: true,
      projColor: '#facc15',
      x: cap.x,
      y: cap.y + 2,
      hp: 500,
      maxHp: 500,
      atk: 42,
      gold: 1000,
      level: 5,
      scale: 1.35,
      thought: '🕹️ 직접 조작 중 (WASD 이동 / 우클릭 이동·공격 / Q·E·F 스킬)'
    });
    this.addEffect(this.player.x, this.player.y, 5, '#facc15', 1.0);
    this.log('quest', '🌟 플레이어 영웅이 아테리아 대륙에 강림했습니다! 육지와 바다 너머 신대륙을 자유롭게 모험하세요!', this.player.x, this.player.y);
    return this.player;
  }

  // 플레이어 전용 액티브 스킬 발동
  triggerPlayerSkill(skillKey) {
    const p = this.spawnOrGetPlayer();
    if (skillKey === 'Q') {
      // 천공의 심판 (주변 적 광역 마법 타격)
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
      // 질주 & 순풍 가속 + 회복
      p.boostTimer = 6.0;
      p.hp = Math.min(p.maxHp, p.hp + 150);
      this.addEffect(p.x, p.y, 4.5, '#38bdf8', 0.7);
      this.addFloatingText(p.x, p.y - 1.4, '💨 질주 가속 & 생명력 회복!', '#38bdf8', 1.4);
    } else if (skillKey === 'F') {
      // 가까운 거점과 즉시 교역 & 장비 업그레이드
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
        const tradeProfit = 250 + invGain;
        p.gold += tradeProfit;
        p.level++;
        p.maxHp += 40;
        p.hp = p.maxHp;
        p.atk += 6;
        this.addEffect(p.x, p.y, 5, '#4ade80', 0.8);
        this.addFloatingText(p.x, p.y - 1.5, `🪙 교역 +${tradeProfit}G & Lv.${p.level} 장비 강화!`, '#4ade80', 1.8);
        this.log('trade', `🌟 플레이어가 [${nearestTown.name}]에서 교역 및 장비 강화를 마쳐 Lv.${p.level}(공격력 ${p.atk})이 되었습니다!`, p.x, p.y);
      } else {
        this.addFloatingText(p.x, p.y - 1.4, '⚠️ 근처 왕국 도시/항구에서 사용 가능합니다', '#fca5a5', 1.4);
      }
    }
  }

  // 왕국 개입 명령 1: 특별 해상·육상 무역선단 일제 파견
  dispatchTradeFleet() {
    const sMap = this.world.settlementMap;
    const ports = ['bluewave', 'elvenheim', 'mirage_oasis'];
    for (const pid of ports) {
      const pTown = sMap[pid];
      const ship = this.createEntity({
        name: `왕실 특무범선 ${this.pickName()}호`,
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

  // 왕국 개입 명령 2: 성전사 대원정군 & 해군 토벌함대 파견
  dispatchCrusade() {
    const sMap = this.world.settlementMap;
    const fort = sMap.valor_fort;
    const port = sMap.bluewave;

    // 육상 성전사 4명 소집
    for (let i = 0; i < 4; i++) {
      const crusader = this.createEntity({
        name: `왕립 성전사 ${this.pickName()}`,
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

    // 해상 토벌 함대 3척 소집
    for (let i = 0; i < 3; i++) {
      this.createEntity({
        name: `해군 기함 아테리아 ${i + 1}호`,
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

  // 왕국 개입 명령 3: 대륙 축복 (전 작물 만풍년 + 전원 치유 + 번영 골드)
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
      if (e.faction === 'kingdom') {
        e.hp = e.maxHp;
      }
    }
    this.log('harvest', '✨ 여신의 축복이 대륙과 바다 너머 신대륙에 내려 모든 농작물이 즉시 만개하고 왕국 전체가 치유되었습니다!', this.world.settlementMap.solaris.x, this.world.settlementMap.solaris.y);
  }

  spawnMonstersForLair(lairId, count) {
    const lair = this.world.settlementMap[lairId];
    if (!lair) return;

    const templates = {
      goblin_camp: [
        { name: '고블린 약탈꾼', monsterType: 'goblin', icon: '👺', hp: 90, atk: 13, gold: 20, scale: 0.9 },
        { name: '고블린 궁수', monsterType: 'goblin_archer', icon: '🏹', hp: 75, atk: 15, gold: 24, ranged: true, projColor: '#a3e635', scale: 0.9 },
        { name: '그림자 늑대', monsterType: 'wolf', icon: '🐺', hp: 100, atk: 16, gold: 22, scale: 0.95 }
      ],
      orc_stronghold: [
        { name: '오크 전사', monsterType: 'orc', icon: '👹', hp: 175, atk: 21, gold: 40, scale: 1.15 },
        { name: '오크 광전사', monsterType: 'orc_berserker', icon: '🪓', hp: 220, atk: 26, gold: 55, scale: 1.25 },
        { name: '오크 주술사', monsterType: 'orc_shaman', icon: '🔮', hp: 140, atk: 23, gold: 48, ranged: true, projColor: '#c084fc', scale: 1.05 }
      ],
      dragon_ruins: [
        { name: '고대 해골기사', monsterType: 'skeleton', icon: '💀', hp: 200, atk: 24, gold: 60, scale: 1.1 },
        { name: '심연의 망령마법사', monsterType: 'lich', icon: '👻', hp: 170, atk: 29, gold: 75, ranged: true, projColor: '#38bdf8', scale: 1.15 },
        { name: '레드 와이번 (보스)', monsterType: 'dragon', icon: '🐉', hp: 560, atk: 40, gold: 280, ranged: true, projColor: '#ef4444', scale: 1.65 }
      ],
      pirate_cove: [
        { name: '블랙비어드 해적선', monsterType: 'pirate_ship', icon: '🏴‍☠️', hp: 230, atk: 22, gold: 90, isShip: true, ranged: true, projColor: '#f97316', scale: 1.35 },
        { name: '해골단 쾌속약탈선', monsterType: 'pirate_raider', icon: '☠️', hp: 180, atk: 19, gold: 70, isShip: true, ranged: true, projColor: '#ef4444', scale: 1.2 }
      ],
      volcano_isle: [
        { name: '심해 괴수 크라켄', monsterType: 'kraken', icon: '🦑', hp: 480, atk: 35, gold: 220, isShip: true, ranged: true, projColor: '#a855f7', scale: 1.6 },
        { name: '바다 해룡 서펜트', monsterType: 'sea_serpent', icon: '🐍', hp: 260, atk: 26, gold: 110, isShip: true, ranged: true, projColor: '#38bdf8', scale: 1.35 },
        { name: '흑요석 화염골렘', monsterType: 'lava_golem', icon: '🌋', hp: 310, atk: 30, gold: 130, isShip: false, ranged: true, projColor: '#ef4444', scale: 1.4 }
      ]
    };

    const list = templates[lairId] || templates.goblin_camp;
    for (let i = 0; i < count; i++) {
      let tpl = list[i % list.length];
      if ((tpl.monsterType === 'dragon' || tpl.monsterType === 'kraken') && i > 1) {
        tpl = list[1];
      }
      const spawnX = tpl.isShip && lair.portWaterX ? lair.portWaterX : lair.x;
      const spawnY = tpl.isShip && lair.portWaterY ? lair.portWaterY : lair.y;

      this.createEntity({
        name: tpl.name,
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

  pickName() {
    return HUMAN_NAMES[Math.floor(Math.random() * HUMAN_NAMES.length)];
  }

  createEntity(opts) {
    const cfg = ROLE_CONFIG[opts.role] || ROLE_CONFIG.soldier;
    const ent = {
      id: NEXT_ENTITY_ID++,
      name: opts.name,
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
      ranged: !!opts.ranged,
      projColor: opts.projColor || '#f97316',
      hasWagon: !!opts.hasWagon,
      guardTargetId: opts.guardTargetId || null,
      patrolRoad: !!opts.patrolRoad,
      boostTimer: 0,
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

    // 몬스터·해적 개체수 자동 보충
    if (Math.random() < dt * 0.16) {
      const monsters = this.entities.filter(e => e.faction === 'monster');
      if (monsters.length < 52) {
        const lairs = ['goblin_camp', 'orc_stronghold', 'dragon_ruins', 'pirate_cove', 'volcano_isle'];
        const pickLair = lairs[Math.floor(Math.random() * lairs.length)];
        this.spawnMonstersForLair(pickLair, 2);
      }
    }

    // 농작물 자연 성장
    for (const plot of this.world.farmPlots) {
      if (plot.growth < 100) {
        plot.growth = Math.min(100, plot.growth + dt * (isNight ? 0.6 : 1.9));
      }
    }

    // 엔티티 업데이트
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.hp <= 0) {
        this.handleEntityDeath(e);
        this.entities.splice(i, 1);
        continue;
      }

      e.animPhase += dt * 6;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      if (e.stateTimer > 0) e.stateTimer -= dt;
      if (e.boostTimer > 0) e.boostTimer -= dt;

      if (!e.combatTarget && e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + dt * 3.0);
      }

      // 플레이어 직접 조작 처리
      if (e.role === 'player') {
        this.updatePlayerControl(e, dt, playerInput);
        continue;
      }

      // 1. 전투 감지
      const engaged = this.checkAndRunCombat(e, dt);
      if (engaged) {
        battleCount++;
        continue;
      }

      // 2. 직업별 AI
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

  // 플레이어 캐릭터 직접 조작 & 자동 전투/항해 변신 처리
  updatePlayerControl(p, dt, playerInput) {
    const curTile = this.world.getTile(Math.floor(p.x), Math.floor(p.y));
    // 바다 위에 있으면 자동으로 전용 쾌속범선 모드로 전환!
    p.isShip = (curTile === TILE.DEEP_WATER || curTile === TILE.WATER);
    p.icon = p.isShip ? '⛵' : '🌟';

    const boostMult = p.boostTimer > 0 ? 1.85 : 1.0;

    if (playerInput && (playerInput.dx !== 0 || playerInput.dy !== 0)) {
      const len = Math.hypot(playerInput.dx, playerInput.dy) || 1;
      const step = p.speed * boostMult * dt * 3.2;
      p.vx = (playerInput.dx / len) * p.speed;
      p.vy = (playerInput.dy / len) * p.speed;
      p.x = Math.max(2, Math.min(WORLD_WIDTH - 3, p.x + (playerInput.dx / len) * step));
      p.y = Math.max(2, Math.min(WORLD_HEIGHT - 3, p.y + (playerInput.dy / len) * step));
      p.targetX = p.x;
      p.targetY = p.y;
      p.thought = p.isShip
        ? '⛵ 전용 범선으로 대해양 및 신대륙 항해 중!'
        : '🌟 대륙을 직접 탐험 중 (Q:심판 / E:질주 / F:도시교역)';
    } else {
      // 우클릭으로 지정한 목표 지점이 있으면 이동
      this.moveTowardTarget(p, dt * boostMult);
    }

    // 주변 몬스터/해적 자동 공격
    if (p.attackCooldown <= 0) {
      let nearest = null;
      let minDist = 8.5;
      for (const other of this.entities) {
        if (other.faction === 'monster' && other.hp > 0) {
          const d = Math.hypot(other.x - p.x, other.y - p.y);
          if (d < minDist) {
            minDist = d;
            nearest = other;
          }
        }
      }
      if (nearest) {
        p.attackCooldown = 0.65;
        const dmg = Math.round(p.atk * (0.9 + Math.random() * 0.3));
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
        if (other === e || other.hp <= 0 || other.faction === e.faction) continue;
        // 해상 유닛은 해상 유닛끼리, 육상 유닛은 육상 유닛끼리 주로 교전
        if (e.isShip !== other.isShip) continue;
        const d = Math.hypot(other.x - e.x, other.y - e.y);
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
          if (target.monsterType === 'dragon' || target.monsterType === 'kraken' || target.isShip || Math.random() < 0.25) {
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
      this.entities.push(e);
    }
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
        : `${e.icon} [${home.name}] 영지와 교역 시장을 시찰하는 중`;
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
      e.thought = `🛡️ ${home.name} 성곽 및 시장 경비 중`;
    }
  }

  // 왕립 해군 함대 AI (대해양 항로 순찰 & 해적선·크라켄 소탕)
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
      if (spots.length > 0) {
        e.fishingSpot = spots[Math.floor(Math.random() * spots.length)];
      }
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
        e.thought = `⛏️ ${e.mineNode.oreType} 광맥 채굴 중`;
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
    e.thought = '⚒️ 드워프 대용광로에서 강철 무기와 갑옷 단조 중';

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

  // 본토 육상 상인 AI
  updateMerchantAI(e, dt, isNight) {
    const sMap = this.world.settlementMap;
    const mainlandTowns = ['solaris', 'goldenwheat', 'bluewave', 'ironforge', 'silverleaf', 'valor_fort'];

    if (!e.tradeRoute) {
      let curTown = sMap[e.homeId] || sMap.solaris;
      let minDist = 999;
      for (const tid of mainlandTowns) {
        const t = sMap[tid];
        const d = Math.hypot(t.x - e.x, t.y - e.y);
        if (d < minDist) {
          minDist = d;
          curTown = t;
        }
      }

      let bestGood = 'wheat';
      if (curTown.id === 'goldenwheat') bestGood = 'wheat';
      else if (curTown.id === 'bluewave') bestGood = (curTown.stocks.spices > 8 ? 'spices' : 'fish');
      else if (curTown.id === 'ironforge') bestGood = (curTown.stocks.weapons > 15 ? 'weapons' : 'ore');
      else if (curTown.id === 'silverleaf') bestGood = 'herbs';
      else if (curTown.id === 'solaris') bestGood = 'gems';
      else bestGood = 'weapons';

      const candidates = mainlandTowns.filter(id => id !== curTown.id);
      const destId = (curTown.id !== 'solaris' && Math.random() < 0.55)
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

  // 대해양 해상 무역 범선 AI (푸른파도 대항구 ↔ 신대륙 엘븐하임 ↔ 황금사막 미라주 오아시스)
  updateSeaMerchantAI(e, dt) {
    const sMap = this.world.settlementMap;
    const ports = ['bluewave', 'elvenheim', 'mirage_oasis'];

    if (!e.tradeRoute) {
      let curPort = sMap[e.homeId] || sMap.bluewave;
      if (!ports.includes(curPort.id)) curPort = sMap.bluewave;

      let bestGood = 'fish';
      if (curPort.id === 'mirage_oasis') bestGood = 'spices';
      else if (curPort.id === 'elvenheim') bestGood = 'herbs';
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
    e.targetX = dest.portWaterX;
    e.targetY = dest.portWaterY;
    e.state = 'sailing';
    e.thought = `⛵ [${dest.name}] 행 대양 무역선: ${GOODS_KR[e.tradeRoute.good]} ${e.tradeRoute.amount}상자 항해 운송 중`;

    if (Math.hypot(e.x - dest.portWaterX, e.y - dest.portWaterY) < 4.5) {
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
      e.thought = `🍺 [${home.name}] 길드/여관으로 귀환하여 전리품 정산 및 휴식 중`;

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
      const lairs = ['goblin_camp', 'orc_stronghold', 'dragon_ruins'];
      e.questTargetId = lairs[e.id % lairs.length];
    }

    const targetLair = this.world.settlementMap[e.questTargetId];
    if (targetLair) {
      e.targetX = targetLair.x + (Math.sin(e.id) * 6);
      e.targetY = targetLair.y + (Math.cos(e.id) * 6);
      e.state = 'questing';
      e.thought = `⚔️ [${targetLair.name}] 원정 토벌 중 (Lv.${e.level})`;
    }
  }

  updateMonsterAI(e, dt, isNight) {
    const lair = this.world.settlementMap[e.homeId];
    if (!lair) return;

    if (e.stateTimer <= 0) {
      e.stateTimer = 4 + Math.random() * 5;

      // 해적선 및 바다 괴수는 대해양 무역 항로를 돌아다니며 약탈
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

      if (e.monsterType !== 'dragon' && Math.random() < (isNight ? 0.55 : 0.30)) {
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
      terrainMult = 1.30; // 대양 순풍 항해 보너스
    }

    const step = Math.min(dist, e.speed * terrainMult * dt * 2.5);
    const nx = e.x + (dx / dist) * step;
    const ny = e.y + (dy / dist) * step;

    e.vx = (dx / dist) * e.speed;
    e.vy = (dy / dist) * e.speed;

    // 함선은 바다로만 다니고, 육상 유닛은 육지로 다님 (플레이어는 수륙양용!)
    if (e.role === 'player' || e.isShip || this.world.isWalkable(Math.floor(nx), Math.floor(ny)) || e.role === 'fisherman' || e.monsterType === 'dragon') {
      e.x = Math.max(2, Math.min(WORLD_WIDTH - 3, nx));
      e.y = Math.max(2, Math.min(WORLD_HEIGHT - 3, ny));
    } else {
      e.x = Math.max(2, Math.min(WORLD_WIDTH - 3, nx));
      e.y = Math.max(2, Math.min(WORLD_HEIGHT - 3, ny));
    }
  }
}

window.ROLE_CONFIG = ROLE_CONFIG;
window.GOODS_KR = GOODS_KR;
window.EntityManager = EntityManager;
