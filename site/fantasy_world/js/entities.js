// ============================================================================
// entities.js - NPC(왕족, 병사, 상인, 호위용병, 모험가, 농부, 어부, 광부, 대장장이) 및 몬스터 AI
// ============================================================================

const HUMAN_NAMES = [
  '아르투르', '레오나르드', '엘레나', '카르소', '베른하르트', '세라피나', '로데릭', '실비아',
  '가웨인', '아이리스', '하인리히', '마르코', '벨라', '오스왈드', '클라라', '단테',
  '레이놀즈', '프레이야', '토르발드', '길버트', '세실리아', '지크프리트', '로렌초', '한스',
  '그레고리', '루시아', '발렌타인', '빅토르', '아델하이트', '에드워드', '올리버', '테오도르'
];

const ROLE_CONFIG = {
  king:        { label: '국왕 / 왕족', category: 'soldier', icon: '👑', color: '#facc15', speed: 1.0 },
  soldier:     { label: '왕국 수비병', category: 'soldier', icon: '🛡️', color: '#3b82f6', speed: 1.55 },
  royal_guard: { label: '왕궁 근위대', category: 'soldier', icon: '⚜️', color: '#60a5fa', speed: 1.65 },
  merchant:    { label: '대상인 (마차)', category: 'merchant', icon: '🐎', color: '#f59e0b', speed: 1.35 },
  mercenary:   { label: '용병 단원', category: 'adventurer', icon: '🗡️', color: '#f43f5e', speed: 1.70 },
  adventurer:  { label: '모험가', category: 'adventurer', icon: '⚔️', color: '#a855f7', speed: 1.75 },
  farmer:      { label: '농부', category: 'farmer', icon: '🌾', color: '#84cc16', speed: 1.25 },
  fisherman:   { label: '어부', category: 'fisherman', icon: '🎣', color: '#06b6d4', speed: 1.25 },
  miner:       { label: '광부', category: 'miner', icon: '⛏️', color: '#94a3b8', speed: 1.25 },
  blacksmith:  { label: '대장장이', category: 'miner', icon: '⚒️', color: '#fb923c', speed: 1.20 },
  monster:     { label: '몬스터', category: 'monster', icon: '👹', color: '#ef4444', speed: 1.40 }
};

const GOODS_KR = {
  wheat: '🌾 밀',
  fish: '🐟 생선',
  ore: '⛏️ 광석',
  weapons: '⚔️ 강철무기',
  herbs: '🌿 약초',
  gems: '💎 보석/진주'
};

let NEXT_ENTITY_ID = 1;

class EntityManager {
  constructor(world, onEventLog) {
    this.world = world;
    this.onEventLog = onEventLog || (() => {});
    this.entities = [];
    this.projectiles = [];   // 화살, 파이어볼, 마법 탄환
    this.floatingTexts = []; // 데미지, 골드 획득, 대사 팝업
    this.activeBattles = 0;
  }

  log(type, text, x, y) {
    this.onEventLog({ type, text, x, y, time: Date.now() });
  }

  addFloatingText(x, y, text, color = '#ffffff', duration = 1.6) {
    if (this.floatingTexts.length > 180) this.floatingTexts.shift();
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      age: 0,
      duration
    });
  }

  spawnInitialPopulation() {
    const sMap = this.world.settlementMap;

    // 1. 왕도 솔라리스: 국왕 1명, 왕궁 근위대 10명, 수비병 8명
    this.createEntity({
      name: '국왕 아서스 3세',
      role: 'king',
      faction: 'kingdom',
      homeId: 'solaris',
      x: sMap.solaris.x,
      y: sMap.solaris.y - 4,
      hp: 350, maxHp: 350, atk: 28, gold: 5000,
      thought: '왕국의 번영과 평화를 살피는 중'
    });

    for (let i = 0; i < 10; i++) {
      this.createEntity({
        name: `근위기사 ${this.pickName()}`,
        role: 'royal_guard',
        faction: 'kingdom',
        homeId: 'solaris',
        x: sMap.solaris.x + (Math.random() - 0.5) * 14,
        y: sMap.solaris.y + (Math.random() - 0.5) * 14,
        hp: 210, maxHp: 210, atk: 22, gold: 120
      });
    }

    // 2. 각 왕국 거점별 수비병 & 가도 순찰병 배치
    const kingdomTowns = ['solaris', 'goldenwheat', 'bluewave', 'ironforge', 'silverleaf', 'valor_fort'];
    for (const townId of kingdomTowns) {
      const town = sMap[townId];
      const count = townId === 'valor_fort' ? 12 : 6;
      for (let i = 0; i < count; i++) {
        this.createEntity({
          name: `${town.name.split(' ')[0]} 수비병 ${this.pickName()}`,
          role: 'soldier',
          faction: 'kingdom',
          homeId: townId,
          patrolRoad: i % 2 === 0,
          x: town.x + (Math.random() - 0.5) * 10,
          y: town.y + (Math.random() - 0.5) * 10,
          hp: 160, maxHp: 160, atk: 17, gold: 65
        });
      }
    }

    // 3. 농부 (황금밀 농촌마을 16명, 실버리프 4명)
    for (let i = 0; i < 16; i++) {
      const home = sMap.goldenwheat;
      this.createEntity({
        name: `농부 ${this.pickName()}`,
        role: 'farmer',
        faction: 'kingdom',
        homeId: 'goldenwheat',
        x: home.x + (Math.random() - 0.5) * 16,
        y: home.y + (Math.random() - 0.5) * 14,
        hp: 90, maxHp: 90, atk: 6, gold: 45
      });
    }
    for (let i = 0; i < 4; i++) {
      const home = sMap.silverleaf;
      this.createEntity({
        name: `약초농부 ${this.pickName()}`,
        role: 'farmer',
        faction: 'kingdom',
        homeId: 'silverleaf',
        x: home.x + (Math.random() - 0.5) * 8,
        y: home.y + (Math.random() - 0.5) * 8,
        hp: 90, maxHp: 90, atk: 6, gold: 50
      });
    }

    // 4. 어부 (푸른파도 항구 12명, 실버리프 호수마을 6명)
    for (let i = 0; i < 12; i++) {
      const spot = this.world.fishingSpots[i % this.world.fishingSpots.length];
      this.createEntity({
        name: `바다어부 ${this.pickName()}`,
        role: 'fisherman',
        faction: 'kingdom',
        homeId: 'bluewave',
        spotIndex: i % this.world.fishingSpots.length,
        x: sMap.bluewave.x + (Math.random() - 0.5) * 8,
        y: sMap.bluewave.y + (Math.random() - 0.5) * 8,
        hp: 95, maxHp: 95, atk: 7, gold: 55
      });
    }
    for (let i = 0; i < 6; i++) {
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

    // 5. 광부 (아이언포지 10명) & 대장장이 (4명)
    for (let i = 0; i < 10; i++) {
      this.createEntity({
        name: `광부 ${this.pickName()}`,
        role: 'miner',
        faction: 'kingdom',
        homeId: 'ironforge',
        x: sMap.ironforge.x + (Math.random() - 0.5) * 10,
        y: sMap.ironforge.y - 3 + (Math.random() - 0.5) * 6,
        hp: 120, maxHp: 120, atk: 11, gold: 60
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
        hp: 140, maxHp: 140, atk: 15, gold: 110
      });
    }

    // 6. 무역 상인 (마차 행렬 14팀) & 각 상인을 호위하는 계약 용병
    for (let i = 0; i < 14; i++) {
      const startTownId = kingdomTowns[i % kingdomTowns.length];
      const startTown = sMap[startTownId];
      const merchant = this.createEntity({
        name: `대상인 ${this.pickName()}`,
        role: 'merchant',
        faction: 'kingdom',
        homeId: startTownId,
        hasWagon: true,
        x: startTown.x + (Math.random() - 0.5) * 6,
        y: startTown.y + (Math.random() - 0.5) * 6,
        hp: 130, maxHp: 130, atk: 8, gold: 320
      });

      // 상인 마다 호위 용병 1명씩 배치
      this.createEntity({
        name: `호위용병 ${this.pickName()}`,
        role: 'mercenary',
        subClass: '상단 호위무사',
        faction: 'kingdom',
        homeId: startTownId,
        guardTargetId: merchant.id,
        x: merchant.x + 1.2,
        y: merchant.y + 1.2,
        hp: 175, maxHp: 175, atk: 19, gold: 90
      });
    }

    // 7. 모험가 파티 & 자유 용병단 (총 22명: 전사, 마법사, 궁수, 성기사)
    const classes = [
      { subClass: '소드마스터', atk: 24, hp: 200, ranged: false, projColor: '#60a5fa' },
      { subClass: '아크메이지', atk: 27, hp: 145, ranged: true,  projColor: '#f97316' },
      { subClass: '엘프 레인저', atk: 21, hp: 155, ranged: true, projColor: '#4ade80' },
      { subClass: '성전사 팔라딘', atk: 20, hp: 230, ranged: false, projColor: '#facc15' }
    ];

    for (let i = 0; i < 22; i++) {
      const cls = classes[i % classes.length];
      const baseTownId = i % 2 === 0 ? 'solaris' : 'valor_fort';
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
        hp: cls.hp, maxHp: cls.hp, atk: cls.atk, gold: 120,
        level: 1 + (i % 5)
      });
    }

    // 8. 몬스터 군락 초기 스폰
    this.spawnMonstersForLair('goblin_camp', 16);
    this.spawnMonstersForLair('orc_stronghold', 16);
    this.spawnMonstersForLair('dragon_ruins', 12);
  }

  spawnMonstersForLair(lairId, count) {
    const lair = this.world.settlementMap[lairId];
    if (!lair) return;

    const templates = {
      goblin_camp: [
        { name: '고블린 약탈꾼', monsterType: 'goblin', icon: '👺', hp: 85, atk: 12, gold: 18, scale: 0.9 },
        { name: '고블린 궁수', monsterType: 'goblin_archer', icon: '🏹', hp: 70, atk: 14, gold: 22, ranged: true, projColor: '#a3e635', scale: 0.9 },
        { name: '그림자 늑대', monsterType: 'wolf', icon: '🐺', hp: 95, atk: 15, gold: 20, scale: 0.95 }
      ],
      orc_stronghold: [
        { name: '오크 전사', monsterType: 'orc', icon: '👹', hp: 165, atk: 20, gold: 35, scale: 1.15 },
        { name: '오크 광전사', monsterType: 'orc_berserker', icon: '🪓', hp: 210, atk: 25, gold: 50, scale: 1.25 },
        { name: '오크 주술사', monsterType: 'orc_shaman', icon: '🔮', hp: 130, atk: 22, gold: 45, ranged: true, projColor: '#c084fc', scale: 1.05 }
      ],
      dragon_ruins: [
        { name: '고대 해골기사', monsterType: 'skeleton', icon: '💀', hp: 190, atk: 23, gold: 55, scale: 1.1 },
        { name: '심연의 망령마법사', monsterType: 'lich', icon: '👻', hp: 160, atk: 28, gold: 70, ranged: true, projColor: '#38bdf8', scale: 1.15 },
        { name: '레드 와이번 (보스)', monsterType: 'dragon', icon: '🐉', hp: 520, atk: 38, gold: 250, ranged: true, projColor: '#ef4444', scale: 1.65 }
      ]
    };

    const list = templates[lairId] || templates.goblin_camp;
    for (let i = 0; i < count; i++) {
      // 드래곤은 둥지당 최대 2마리만 유지
      let tpl = list[i % list.length];
      if (tpl.monsterType === 'dragon' && i > 1) {
        tpl = list[0];
      }
      this.createEntity({
        name: tpl.name,
        role: 'monster',
        monsterType: tpl.monsterType,
        customIcon: tpl.icon,
        ranged: !!tpl.ranged,
        projColor: tpl.projColor || '#ef4444',
        scale: tpl.scale || 1.0,
        faction: 'monster',
        homeId: lairId,
        x: lair.x + (Math.random() - 0.5) * 18,
        y: lair.y + (Math.random() - 0.5) * 18,
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
      ranged: !!opts.ranged,
      projColor: opts.projColor || '#f97316',
      hasWagon: !!opts.hasWagon,
      guardTargetId: opts.guardTargetId || null,
      patrolRoad: !!opts.patrolRoad,
      spotIndex: opts.spotIndex ?? null,
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
        gems: 0
      },
      tradeRoute: null, // { fromId, toId, good, amount }
      combatTarget: null,
      fishingLine: null // { wx, wy }
    };
    this.entities.push(ent);
    return ent;
  }

  update(dt, worldTime) {
    const isNight = worldTime.hour >= 21 || worldTime.hour < 5;
    let battleCount = 0;

    // 몬스터 개체수 유지 (토벌된 경우 일정 주기로 보충)
    if (Math.random() < dt * 0.12) {
      const monsters = this.entities.filter(e => e.faction === 'monster');
      if (monsters.length < 38) {
        const lairs = ['goblin_camp', 'orc_stronghold', 'dragon_ruins'];
        const pickLair = lairs[Math.floor(Math.random() * lairs.length)];
        this.spawnMonstersForLair(pickLair, 2);
      }
    }

    // 농작물 자연 성장
    for (const plot of this.world.farmPlots) {
      if (plot.growth < 100) {
        plot.growth = Math.min(100, plot.growth + dt * (isNight ? 0.5 : 1.8));
      }
    }

    // 각 엔티티 업데이트
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

      // 체력 자연 회복 (비전투 시)
      if (!e.combatTarget && e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + dt * 2.5);
      }

      // 1. 전투 감지 로직
      const engaged = this.checkAndRunCombat(e, dt);
      if (engaged) {
        battleCount++;
        continue;
      }

      // 2. 직업별 자율 행동 AI
      switch (e.role) {
        case 'king':
          this.updateKingAI(e, dt, isNight);
          break;
        case 'royal_guard':
        case 'soldier':
          this.updateSoldierAI(e, dt, isNight);
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
        case 'mercenary':
        case 'adventurer':
          this.updateAdventurerAI(e, dt, isNight);
          break;
        case 'monster':
          this.updateMonsterAI(e, dt, isNight);
          break;
      }

      // 3. 목표 지점으로 이동
      this.moveTowardTarget(e, dt);
    }

    this.activeBattles = Math.ceil(battleCount / 2);

    // 투사체 업데이트
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 플로팅 텍스트 업데이트
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.age += dt;
      ft.y -= dt * 0.9;
      if (ft.age >= ft.duration) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // 전투 탐지 및 교전 수행
  checkAndRunCombat(e, dt) {
    // 비전투 민간인(농부, 어부, 광부, 상인)은 몬스터가 아주 가까우면 도망치거나 호위병에 의존
    const isCivilian = (e.role === 'farmer' || e.role === 'fisherman' || e.role === 'miner' || e.role === 'merchant' || e.role === 'blacksmith');
    const detectRange = isCivilian ? 6.5 : 11.5;

    // 기존 타겟 유효성 확인
    if (e.combatTarget) {
      if (e.combatTarget.hp <= 0 || Math.hypot(e.combatTarget.x - e.x, e.combatTarget.y - e.y) > 16) {
        e.combatTarget = null;
      }
    }

    // 적 탐색
    if (!e.combatTarget && Math.random() < 0.35) {
      let nearest = null;
      let minDist = detectRange;
      for (const other of this.entities) {
        if (other === e || other.hp <= 0 || other.faction === e.faction) continue;
        const d = Math.hypot(other.x - e.x, other.y - e.y);
        if (d < minDist) {
          minDist = d;
          nearest = other;
        }
      }
      if (nearest) {
        e.combatTarget = nearest;
      }
    }

    if (!e.combatTarget) return false;

    const target = e.combatTarget;
    e.fishingLine = null;

    // 민간인은 가까운 경비대/성 쪽으로 대피
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

    // 상인은 목적지로 빠르게 돌파 시도
    if (e.role === 'merchant') {
      e.thought = `⚠️ ${target.name} 습격! 호위병에게 보호받는 중!`;
      this.moveTowardTarget(e, dt * 1.15);
      return true;
    }

    // 전투원(병사, 근위대, 용병, 모험가, 몬스터) 교전
    e.state = 'combat';
    e.thought = `⚔️ ${target.name}와(과) 교전 중!`;

    const dist = Math.hypot(target.x - e.x, target.y - e.y);
    const attackRange = e.ranged ? 6.5 : 1.7;

    if (dist > attackRange) {
      e.targetX = target.x;
      e.targetY = target.y;
      this.moveTowardTarget(e, dt * 1.2);
    } else if (e.attackCooldown <= 0) {
      e.attackCooldown = 0.85 + Math.random() * 0.35;
      const dmg = Math.max(4, Math.round(e.atk * (0.85 + Math.random() * 0.35)));
      target.hp -= dmg;
      target.combatTarget = e;

      if (e.ranged) {
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
        const reward = Math.max(10, Math.round(target.gold * 0.6));
        e.gold += reward;
        if (e.faction === 'kingdom' && target.faction === 'monster') {
          e.inventory.gems = (e.inventory.gems || 0) + 1;
          this.addFloatingText(e.x, e.y - 1.2, `+${reward}G 마석 획득!`, '#fde047', 1.5);
          if (target.monsterType === 'dragon' || Math.random() < 0.25) {
            this.log('battle', `⚔️ [${e.name}]이(가) ${target.name}을(를) 토벌하고 현상금 ${reward}G를 획득했습니다!`, e.x, e.y);
          }
        }
        e.combatTarget = null;
      }
    }
    return true;
  }

  handleEntityDeath(e) {
    if (e.faction === 'kingdom') {
      // 왕국 주민/영웅은 사망 시 성소/여관에서 부활하여 생태계 유지
      const home = this.world.settlementMap[e.homeId] || this.world.settlementMap.solaris;
      e.hp = e.maxHp;
      e.x = home.x + (Math.random() - 0.5) * 4;
      e.y = home.y + (Math.random() - 0.5) * 4;
      e.targetX = e.x;
      e.targetY = e.y;
      e.combatTarget = null;
      e.thought = '🏥 치료소에서 회복 후 복귀 중';
      this.entities.push(e); // 재등록
    }
  }

  // 국왕 AI
  updateKingAI(e, dt, isNight) {
    const cap = this.world.settlementMap.solaris;
    if (e.stateTimer <= 0) {
      e.stateTimer = 4 + Math.random() * 4;
      if (isNight) {
        e.targetX = cap.x;
        e.targetY = cap.y - 7;
        e.state = 'resting';
        e.thought = '👑 솔라리스 왕궁 침전에서 휴식 중';
      } else {
        const spots = [
          { x: cap.x, y: cap.y - 4, msg: '👑 왕궁 발코니에서 백성들을 굽어보는 중' },
          { x: cap.x - 4, y: cap.y + 2, msg: '👑 중앙 대시장의 상단 교역 현황 시찰 중' },
          { x: cap.x + 5, y: cap.y - 3, msg: '👑 근위대장에게 변경 방어 보고를 받는 중' }
        ];
        const pick = spots[Math.floor(Math.random() * spots.length)];
        e.targetX = pick.x;
        e.targetY = pick.y;
        e.state = 'patrol';
        e.thought = pick.msg;
      }
    }
  }

  // 병사 & 왕궁 근위대 AI
  updateSoldierAI(e, dt, isNight) {
    const home = this.world.settlementMap[e.homeId] || this.world.settlementMap.solaris;
    if (e.stateTimer <= 0) {
      e.stateTimer = 3.5 + Math.random() * 4;
      if (e.patrolRoad && e.role === 'soldier') {
        // 인접 왕국 거점 가도 순찰
        const links = this.world.roadLinks.filter(([a, b]) => a === e.homeId || b === e.homeId);
        if (links.length > 0) {
          const pair = links[Math.floor(Math.random() * links.length)];
          const otherId = pair[0] === e.homeId ? pair[1] : pair[0];
          const other = this.world.settlementMap[otherId];
          // 몬스터 본거지 너무 깊숙이는 가지 않고 길목까지만 순찰
          const ratio = other.faction === 'monster' ? 0.55 : (0.3 + Math.random() * 0.5);
          e.targetX = home.x + (other.x - home.x) * ratio + (Math.random() - 0.5) * 4;
          e.targetY = home.y + (other.y - home.y) * ratio + (Math.random() - 0.5) * 4;
          e.state = 'patrol';
          e.thought = `🛡️ ${home.name} ↔ ${other.name} 가도 치안 순찰 중`;
          return;
        }
      }
      // 거점 성문 및 외곽 순찰
      const angle = Math.random() * Math.PI * 2;
      const dist = 4 + Math.random() * (home.radius - 2);
      e.targetX = home.x + Math.cos(angle) * dist;
      e.targetY = home.y + Math.sin(angle) * dist;
      e.state = 'patrol';
      e.thought = `🛡️ ${home.name} 성곽 및 시장 경비 중`;
    }
  }

  // 농부 AI (밭으로 이동 -> 경작/수확 -> 마을 창고에 납품 및 골드 획득)
  updateFarmerAI(e, dt, isNight) {
    const home = this.world.settlementMap[e.homeId];
    if (isNight) {
      e.targetX = home.x + 3;
      e.targetY = home.y;
      e.state = 'resting';
      e.thought = '💤 하루 농사를 마치고 오두막에서 휴식 중';
      return;
    }

    const totalCarried = e.inventory.wheat + e.inventory.herbs;
    if (totalCarried >= 4) {
      // 수확물을 장터/창고에 납품하러 이동
      e.targetX = home.x;
      e.targetY = home.y;
      e.state = 'delivering';
      e.thought = `🌾 수확한 작물(${totalCarried}개)을 곡물창고로 운반 중`;

      if (Math.hypot(e.x - home.x, e.y - home.y) < 3.0) {
        const earned = e.inventory.wheat * 8 + e.inventory.herbs * 10;
        home.stocks.wheat = (home.stocks.wheat || 0) + e.inventory.wheat;
        home.stocks.herbs = (home.stocks.herbs || 0) + e.inventory.herbs;
        e.gold += earned;
        this.addFloatingText(e.x, e.y - 1, `+${earned}G 수확 납품`, '#a3e635', 1.4);
        e.inventory.wheat = 0;
        e.inventory.herbs = 0;
        e.stateTimer = 1.0;
      }
      return;
    }

    // 경작할 밭 선택
    if (!e.assignedPlot || Math.random() < 0.02) {
      const plots = this.world.farmPlots;
      if (plots.length > 0) {
        e.assignedPlot = plots[Math.floor(Math.random() * plots.length)];
      }
    }

    if (e.assignedPlot) {
      const p = e.assignedPlot;
      e.targetX = p.x;
      e.targetY = p.y;
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < 1.5) {
        e.state = 'farming';
        p.growth = Math.min(100, p.growth + dt * 18);
        e.thought = `🌾 ${p.cropType}밭 김매기 및 수확 중 (${Math.floor(p.growth)}%)`;
        if (p.growth >= 100) {
          p.growth = 15;
          if (p.cropType === '약초' || e.homeId === 'silverleaf') {
            e.inventory.herbs++;
          } else {
            e.inventory.wheat++;
          }
          this.addFloatingText(e.x, e.y - 0.8, `+1 ${p.cropType}`, '#facc15', 1.1);
          e.assignedPlot = null;
        }
      } else {
        e.state = 'walking';
        e.thought = `🌾 ${p.cropType} 경작지로 이동 중`;
      }
    }
  }

  // 어부 AI (부두/배로 이동 -> 낚싯대 드리우기 -> 생선/진주 낚시 -> 수산시장 판매)
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
      e.thought = `🐟 갓 잡은 생선(${e.inventory.fish}마리)을 수산시장에 파는 중`;

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

    // 내 홈 거점의 낚시 포인트 찾기
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
      const dist = Math.hypot(e.x - sp.x, e.y - sp.y);
      if (dist < 1.2) {
        e.state = 'fishing';
        e.fishingLine = { wx: sp.waterX, wy: sp.waterY };
        e.thought = sp.isBoat ? '🚣 고기잡이배 위에서 바다 낚시 중' : '🎣 부두에서 낚싯대를 드리우고 입질 대기 중';
        if (e.stateTimer <= 0) {
          e.stateTimer = 3.2 + Math.random() * 2.5;
          if (Math.random() < 0.14) {
            e.inventory.gems++;
            this.addFloatingText(e.x, e.y - 1, '🦪 희귀 진주 낚음!', '#f472b6', 1.4);
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

  // 광부 AI
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

  // 대장장이 AI (광석을 무기로 제련)
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

  // 상인 & 무역 마차 AI (도시 간 특산물 매입 -> 가도 이동 -> 고가 매각)
  updateMerchantAI(e, dt, isNight) {
    const sMap = this.world.settlementMap;
    const kingdomTowns = ['solaris', 'goldenwheat', 'bluewave', 'ironforge', 'silverleaf', 'valor_fort'];

    // 현재 무역 경로가 없으면 새 무역 계약 수립
    if (!e.tradeRoute) {
      // 가장 가까운 왕국 거점 찾기
      let curTown = sMap[e.homeId];
      let minDist = 999;
      for (const tid of kingdomTowns) {
        const t = sMap[tid];
        const d = Math.hypot(t.x - e.x, t.y - e.y);
        if (d < minDist) {
          minDist = d;
          curTown = t;
        }
      }

      // 이 거점의 특산물 선택
      let bestGood = 'wheat';
      if (curTown.id === 'goldenwheat') bestGood = 'wheat';
      else if (curTown.id === 'bluewave') bestGood = 'fish';
      else if (curTown.id === 'ironforge') bestGood = (curTown.stocks.weapons > 15 ? 'weapons' : 'ore');
      else if (curTown.id === 'silverleaf') bestGood = 'herbs';
      else if (curTown.id === 'solaris') bestGood = 'gems';
      else bestGood = 'weapons';

      // 목적지 선택 (현재 거점이 아닌 곳 중 수요가 높은 곳, 특히 왕도 솔라리스 선호)
      const candidates = kingdomTowns.filter(id => id !== curTown.id);
      const destId = (curTown.id !== 'solaris' && Math.random() < 0.55)
        ? 'solaris'
        : candidates[Math.floor(Math.random() * candidates.length)];

      const buyAmount = 10 + Math.floor(Math.random() * 12);
      if ((curTown.stocks[bestGood] || 0) >= 5) {
        curTown.stocks[bestGood] = Math.max(2, curTown.stocks[bestGood] - buyAmount);
      }
      e.inventory[bestGood] = (e.inventory[bestGood] || 0) + buyAmount;

      e.tradeRoute = {
        fromId: curTown.id,
        toId: destId,
        good: bestGood,
        amount: buyAmount
      };
    }

    const dest = sMap[e.tradeRoute.toId];
    e.targetX = dest.x;
    e.targetY = dest.y;
    e.state = 'trading';
    e.thought = `🐎 [${dest.name}] 행 무역마차: ${GOODS_KR[e.tradeRoute.good]} ${e.tradeRoute.amount}개 운송 중`;

    // 목적지 도착 시 매각 및 수익 정산
    if (Math.hypot(e.x - dest.x, e.y - dest.y) < 4.0) {
      const { good, amount, fromId } = e.tradeRoute;
      const fromTown = sMap[fromId];
      const unitPrice = (dest.prices && dest.prices[good]) ? dest.prices[good] : 22;
      const revenue = amount * unitPrice;

      dest.stocks[good] = (dest.stocks[good] || 0) + amount;
      e.inventory[good] = 0;
      e.gold += Math.round(revenue * 0.45);
      dest.gold += Math.round(revenue * 0.55);

      this.addFloatingText(e.x, e.y - 1.2, `🪙 무역 타결 +${revenue}G!`, '#facc15', 1.7);
      this.log(
        'trade',
        `🐎 [${e.name}] 상단이 ${fromTown.name}의 ${GOODS_KR[good]} ${amount}단위를 [${dest.name}]에 매각하여 ${revenue}G 거래 성사!`,
        e.x,
        e.y
      );

      e.homeId = dest.id;
      e.tradeRoute = null;
      e.stateTimer = 2.5;
    }
  }

  // 모험가 & 용병 AI (상단 호위 또는 몬스터 군락 원정 토벌)
  updateAdventurerAI(e, dt, isNight) {
    // 1. 특정 상인을 호위하는 계약 용병인 경우
    if (e.guardTargetId) {
      const merchant = this.entities.find(m => m.id === e.guardTargetId);
      if (merchant) {
        const angle = (e.id % 6) * (Math.PI / 3);
        e.targetX = merchant.x + Math.cos(angle) * 2.2;
        e.targetY = merchant.y + Math.sin(angle) * 2.2;
        e.state = 'escorting';
        e.thought = `🗡️ [${merchant.name}]의 무역 마차 근접 호위 중`;
        return;
      } else {
        e.guardTargetId = null;
      }
    }

    const home = this.world.settlementMap[e.homeId] || this.world.settlementMap.valor_fort;

    // 체력이 낮거나 전리품이 많으면 귀환하여 정비
    if (e.hp < e.maxHp * 0.45 || (e.inventory.gems || 0) >= 3) {
      e.targetX = home.x;
      e.targetY = home.y;
      e.state = 'returning';
      e.thought = `🍺 [${home.name}] 길드/여관으로 귀환하여 전리품 정산 및 휴식 중`;

      if (Math.hypot(e.x - home.x, e.y - home.y) < 3.5) {
        e.hp = e.maxHp;
        if (e.inventory.gems > 0) {
          const bounty = e.inventory.gems * 55;
          e.gold += bounty;
          home.stocks.gems = (home.stocks.gems || 0) + e.inventory.gems;
          this.addFloatingText(e.x, e.y - 1.1, `+${bounty}G 토벌 보수!`, '#c084fc', 1.4);
          e.inventory.gems = 0;
        }
        // 무기가 있으면 공격력 강화
        if ((home.stocks.weapons || 0) > 5 && e.gold >= 80) {
          home.stocks.weapons--;
          e.gold -= 60;
          e.atk += 2;
          e.level++;
        }
      }
      return;
    }

    // 원정 목표 설정 (몬스터 군락지 3곳 중 한 곳으로 출정)
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
      e.thought = `⚔️ [${targetLair.name}] 토벌 의뢰 수행 중 (Lv.${e.level})`;
    }
  }

  // 몬스터 AI (군락 주변 배회 및 가도/마을 습격)
  updateMonsterAI(e, dt, isNight) {
    const lair = this.world.settlementMap[e.homeId];
    if (!lair) return;

    if (e.stateTimer <= 0) {
      e.stateTimer = 4 + Math.random() * 5;
      // 밤이거나 일정 확률로 인근 가도/요새 쪽으로 약탈 진출
      if (e.monsterType !== 'dragon' && Math.random() < (isNight ? 0.55 : 0.30)) {
        let raidTarget = this.world.settlementMap.valor_fort;
        if (e.homeId === 'goblin_camp') {
          raidTarget = Math.random() < 0.5 ? this.world.settlementMap.goldenwheat : this.world.settlementMap.valor_fort;
        } else if (e.homeId === 'dragon_ruins') {
          raidTarget = this.world.settlementMap.ironforge;
        }
        // 가도 중간 지점이나 마을 외곽까지 진출
        const ratio = 0.45 + Math.random() * 0.35;
        e.targetX = lair.x + (raidTarget.x - lair.x) * ratio + (Math.random() - 0.5) * 8;
        e.targetY = lair.y + (raidTarget.y - lair.y) * ratio + (Math.random() - 0.5) * 8;
        e.state = 'raiding';
        e.thought = `👹 [${raidTarget.name}] 방면 가도 약탈 및 습격 중!`;
      } else {
        // 군락지 주변 영역 배회
        const angle = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 11;
        e.targetX = lair.x + Math.cos(angle) * r;
        e.targetY = lair.y + Math.sin(angle) * r;
        e.state = 'roaming';
        e.thought = `👹 [${lair.name}] 영역 경계 및 배회 중`;
      }
    }
  }

  // 지형 및 도로 가중치를 반영한 이동 처리
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
      terrainMult = 1.35; // 가도 위에서는 이동 속도 증가
    } else if (curTile === TILE.FOREST || curTile === TILE.DARK_FOREST || curTile === TILE.HILLS) {
      terrainMult = 0.82;
    }

    const step = Math.min(dist, e.speed * terrainMult * dt * 2.5);
    const nx = e.x + (dx / dist) * step;
    const ny = e.y + (dy / dist) * step;

    // 어부의 배나 드래곤을 제외하면 심해/산맥 우회
    const nextTile = this.world.getTile(Math.floor(nx), Math.floor(ny));
    const canPass = this.world.isWalkable(Math.floor(nx), Math.floor(ny)) ||
                    e.role === 'fisherman' ||
                    e.monsterType === 'dragon';

    if (canPass) {
      e.vx = (dx / dist) * e.speed;
      e.vy = (dy / dist) * e.speed;
      e.x = Math.max(2, Math.min(WORLD_SIZE - 3, nx));
      e.y = Math.max(2, Math.min(WORLD_SIZE - 3, ny));
    } else {
      // 장애물 우회 슬라이딩
      const altX = e.x + (dx / dist) * step;
      const altY = e.y + (dy / dist) * step;
      if (this.world.isWalkable(Math.floor(altX), Math.floor(e.y))) {
        e.x = altX;
      } else if (this.world.isWalkable(Math.floor(e.x), Math.floor(altY))) {
        e.y = altY;
      } else {
        // 강제 이동 보정 (강/산맥에 끼임 방지)
        e.x = nx;
        e.y = ny;
      }
    }
  }
}

window. ROLE_CONFIG = ROLE_CONFIG;
window.GOODS_KR = GOODS_KR;
window.EntityManager = EntityManager;
