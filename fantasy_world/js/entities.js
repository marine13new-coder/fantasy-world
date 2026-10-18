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
  commander:    { label: '기사단 총사령관', category: 'soldier', icon: '⚔️', color: '#dc2626', speed: 1.65 },
  duchess:      { label: '제국 여공작', category: 'soldier', icon: '👑', color: '#facc15', speed: 1.55 },
  ranger:       { label: '왕립 순찰대 궁수', category: 'adventurer', icon: '🏹', color: '#16a34a', speed: 1.80 },
  mage:         { label: '왕립 비전 마도사', category: 'adventurer', icon: '🔮', color: '#38bdf8', speed: 1.55 },
  wolfrider:    { label: '늑대 기병', category: 'soldier', icon: '🐺', color: '#64748b', speed: 2.10 },
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
        { name: '천공 용의 고원', loc: sMap.dragon_eyrie || { x: 90, y: 270 }, desc: '구름 위 떠있는 고대 드래곤 둥지를 비행 탐색하여 룬 제단을 확인하십시오.', icon: '☁️', gold: 1800, fame: 50 },
        { name: '스핑크스 피라미드', loc: sMap.sphinx_pyramid || { x: 58, y: 245 }, desc: '사막 한가운데 자리잡은 미지의 황금 피라미드 유적을 정찰하십시오.', icon: '🏛️', gold: 1600, fame: 40 },
        { name: '론 비컨 고도 등대', loc: sMap.lone_beacon || { x: 162, y: 145 }, desc: '황금해협 북단 고도에 위치한 전설의 등대 불빛을 확인하십시오.', icon: '🗼', gold: 1900, fame: 50 },
        { name: '요정의 숲 세계수 성소', loc: sMap.fairy_glade || { x: 55, y: 65 }, desc: '엘프 연합 영지 깊숙한 곳의 신비로운 세계수 성소를 순례하십시오.', icon: '🧚', gold: 1500, fame: 35 }
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

  onMonsterSlain(monster) {
    if (!this.activeQuest) return;
    const q = this.activeQuest;
    if (q.type === 'bounty') {
      q.progress = Math.min(q.maxProgress, q.progress + 0.35);
      if (q.progress >= q.maxProgress && this.em.player) {
        this.completeQuest(this.em.player);
      }
    }
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

// ============================================================================
// 고성능 공간 분할 그리드 (Spatial Partitioning Grid) - O(N^2) 병목 제거 & 60 FPS 보장
// ============================================================================
class SpatialGrid {
  constructor(cellSize = 16) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(cx, cy) {
    return (cx << 16) ^ (cy & 0xffff);
  }

  insert(entity) {
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const k = this._key(cx, cy);
    let list = this.cells.get(k);
    if (!list) {
      list = [];
      this.cells.set(k, list);
    }
    list.push(entity);
  }

  query(x, y, radius, filterFn) {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    const results = [];
    const r2 = radius * radius;

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const list = this.cells.get(this._key(cx, cy));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const e = list[i];
            const dx = e.x - x;
            const dy = e.y - y;
            if (dx * dx + dy * dy <= r2) {
              if (!filterFn || filterFn(e)) {
                results.push(e);
              }
            }
          }
        }
      }
    }
    return results;
  }

  findNearest(x, y, radius, filterFn) {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    let nearest = null;
    let minDist2 = radius * radius;

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const list = this.cells.get(this._key(cx, cy));
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const e = list[i];
            const dx = e.x - x;
            const dy = e.y - y;
            const d2 = dx * dx + dy * dy;
            if (d2 < minDist2) {
              if (!filterFn || filterFn(e)) {
                minDist2 = d2;
                nearest = e;
              }
            }
          }
        }
      }
    }
    return nearest;
  }
}

class EntityManager {
  constructor(world, onEventLog) {
    this.world = world;
    this.onEventLog = onEventLog || (() => {});
    this.entities = [];
    this.spatialGrid = new SpatialGrid(48);
    this.simFrame = 0;
    this.projectiles = [];
    this.floatingTexts = [];
    this.specialEffects = [];
    this.sparkParticles = [];
    this.waterRipples = [];
    this.ghostTrails = [];
    this.droppedLoot = [];
    this.hazardZones = [];
    this.footprints = [];
    this.shockwaves = [];
    this.slashArcs = [];
    this.bloodDecals = [];
    this.grassLeaves = [];
    this.deadRemains = [];
    this.dustPuffs = [];
    this.waterWakes = [];
    this.shadowDecoys = [];
    this.groundFissures = [];
    this.falcon = { active: false, x: 0, y: 0, altitude: 28, angle: 0, wingCycle: 0, state: 'orbit', target: null, diveCooldown: 0 };
    this.witchTimeTimer = 0;
    this.witchTimeScale = 0.22;
    this.initFireflies();
    this.activeBattles = 0;
    this.player = null;
    this.pet = null;
    this.questSystem = new QuestSystem(this.world, this);
    this.rpgManager = (typeof RPGSystemsManager !== 'undefined') ? new RPGSystemsManager(this.world, this) : null;

    // 동적 대륙 월드 이벤트 시스템
    this.worldEvents = [
      { id: 'blood_moon', title: '🩸 붉은 달의 밤 (Blood Moon)', desc: '몬스터가 사나워지며 처치 시 EXP와 전리품이 2배로 폭증합니다!', buff: 'blood_moon', duration: 75, icon: '🩸' },
      { id: 'gold_rush', title: '🪙 황금 고블린 대탈출 (Treasure Rush)', desc: '전 대륙에 미확인 황금 보물상자와 황금 광맥이 대량 발견되었습니다!', buff: 'gold_rush', duration: 75, icon: '🪙' },
      { id: 'fair_wind', title: '🌊 대양 순풍의 축복 (Fair Winds)', desc: '대양의 모든 무역선과 플레이어 선박 항해 속도가 2배로 증가합니다!', buff: 'fair_wind', duration: 75, icon: '🌊' },
      { id: 'tree_bloom', title: '✨ 세계수의 대각성 (World Tree Bloom)', desc: '약초 채집량 2배 증가 및 주민과 플레이어 생명력이 초당 지속 회복됩니다!', buff: 'tree_bloom', duration: 75, icon: '✨' }
    ];
    this.activeWorldEvent = this.worldEvents[0];
    this.worldEventTimer = 75;
  }

  log(type, text, x, y) {
    this.onEventLog({ type, text, x, y, time: Date.now() });
  }

  // 💎 필드 전리품 드롭 (Loot Drop with Vacuum Magnet)
  spawnLootDrop(x, y, loot) {
    if (!this.droppedLoot) this.droppedLoot = [];
    if (this.droppedLoot.length > 150) this.droppedLoot.shift();
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 1.6;
    this.droppedLoot.push({
      id: 'loot_' + Date.now() + '_' + Math.random(),
      x: x + (Math.random() - 0.5) * 0.4,
      y: y + (Math.random() - 0.5) * 0.4,
      vx: Math.cos(angle) * speed,
      vy: -2.4 - Math.random() * 1.2, // 공중으로 튀어오름
      bounceY: 0,
      itemType: loot.itemType || 'gold',
      name: loot.name || '골드',
      icon: loot.icon || '🪙',
      gold: loot.gold || 0,
      exp: loot.exp || 0,
      resourceKey: loot.resourceKey || null,
      resourceCount: loot.resourceCount || 0,
      color: loot.color || '#facc15',
      age: 0,
      duration: 55.0
    });
  }

  // ⚠️ 보스/엘리트 공격 전조 위험 장판 (Telegraphed Hazard Zone)
  addHazardZone(x, y, radius, timer = 1.3, damage = 85, name = '폭발', color = '#ef4444') {
    if (!this.hazardZones) this.hazardZones = [];
    if (this.hazardZones.length > 30) this.hazardZones.shift();
    this.hazardZones.push({
      id: 'hz_' + Date.now() + '_' + Math.random(),
      x,
      y,
      radius,
      timer,
      maxTimer: timer,
      damage,
      name,
      color
    });
  }

  addWaterRipple(x, y) {
    if (!this.waterRipples) this.waterRipples = [];
    if (this.waterRipples.length > 90) this.waterRipples.shift();
    this.waterRipples.push({ x, y, radius: 2.5, maxRadius: 15, age: 0, duration: 0.85 });
  }

  // 🌋 대지 파쇄 균열 및 마그마 단층 파괴흔 (Ground Sunder Fissures & Molten Scars)
  addGroundFissure(x, y, angle, length = 3.5, color = '#f97316') {
    if (!this.groundFissures) this.groundFissures = [];
    if (this.groundFissures.length > 80) this.groundFissures.shift();
    // 세부 지그재그 균열 정점 생성 (Jagged crack points)
    const points = [{ dx: 0, dy: 0 }];
    const steps = 6;
    const stepLen = length / steps;
    let currX = 0, currY = 0;
    for (let i = 1; i <= steps; i++) {
      const stepAngle = angle + (Math.random() - 0.5) * 0.7;
      currX += Math.cos(stepAngle) * stepLen;
      currY += Math.sin(stepAngle) * stepLen;
      points.push({ dx: currX, dy: currY, jitter: (Math.random() - 0.5) * 0.25 });
    }
    this.groundFissures.push({
      x, y, angle, length, color,
      points,
      age: 0,
      duration: 5.5,
      width: 0.22 + Math.random() * 0.12
    });
  }

  updateGroundFissures(dt) {
    if (!this.groundFissures || this.groundFissures.length === 0) return;
    for (let i = this.groundFissures.length - 1; i >= 0; i--) {
      this.groundFissures[i].age += dt;
      if (this.groundFissures[i].age >= this.groundFissures[i].duration) {
        this.groundFissures.splice(i, 1);
      }
    }
  }

  // 👣 동적 발자국 & 수면 항적 생성 (Dynamic Footprints & Foaming Wakes)
  addFootprint(x, y, angle, type, tile) {
    if (!this.footprints) this.footprints = [];
    if (this.footprints.length > 100) this.footprints.shift();
    this.footstepCounter = (this.footstepCounter || 0) + 1;
    this.footprints.push({
      x, y, angle, type, tile,
      age: 0,
      duration: type === 'wake' ? 2.8 : 4.5,
      side: this.footstepCounter % 2
    });
  }

  // 🌿 상호작용형 픽셀 풀잎 및 꽃잎/단풍 파티클 (Interactive Foliage & Petals)
  addGrassDebris(x, y, tile = 1) {
    if (!this.grassLeaves) this.grassLeaves = [];
    if (this.grassLeaves.length > 110) this.grassLeaves.shift();

    let primaryColor = '#4ade80';
    let secondaryColor = '#16a34a';

    // 꽃밭 초원 (Meadow) -> 핑크/라벤더 꽃잎 흩날림
    if (tile === 2) {
      primaryColor = Math.random() < 0.5 ? '#f472b6' : '#fb7185';
      secondaryColor = '#fde047';
    } else if (tile === 24) { // 단풍 숲 -> 단풍 낙엽
      primaryColor = '#ea580c';
      secondaryColor = '#dc2626';
    } else if (tile === 11 || tile === 12) { // 설산/툰드라 -> 눈꽃 파편
      primaryColor = '#f8fafc';
      secondaryColor = '#e0f2fe';
    }

    for (let i = 0; i < 2; i++) {
      this.grassLeaves.push({
        x: x + (Math.random() - 0.5) * 0.75,
        y: y + (Math.random() - 0.5) * 0.75,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.8 - Math.random() * 1.0,
        color: Math.random() < 0.5 ? primaryColor : secondaryColor,
        age: 0,
        duration: 0.75 + Math.random() * 0.5,
        size: 1.8 + Math.random() * 1.5
      });
    }
  }

  // ✨ 야간 발광 반딧불이 군집 초기화 (Nighttime Fireflies)
  initFireflies() {
    this.fireflies = [];
    const p = this.player;
    const cx = p ? p.x : 1920;
    const cy = p ? p.y : 1200;
    for (let i = 0; i < 55; i++) {
      this.fireflies.push({
        x: cx + (Math.random() - 0.5) * 50,
        y: cy + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: 1.5 + Math.random() * 1.5,
        color: Math.random() < 0.65 ? '#fde047' : '#86efac',
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // 💨 회피 롤 착지 및 질주 시 픽셀 모래먼지/눈보라 파티클 (Dynamic Dust Puffs)
  addDustPuff(x, y, count = 4, color = null) {
    if (!this.dustPuffs) this.dustPuffs = [];
    if (this.dustPuffs.length > 90) this.dustPuffs.splice(0, count);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.5 + Math.random() * 1.2;
      this.dustPuffs.push({
        x: x + (Math.random() - 0.5) * 0.4,
        y: y + (Math.random() - 0.5) * 0.4,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.4,
        color: color || (Math.random() < 0.5 ? '#fde68a' : '#d97706'),
        age: 0,
        duration: 0.45 + Math.random() * 0.25,
        size: 2.0 + Math.random() * 2.5
      });
    }
  }

  // 💥 [10.6] 넉백 이동 및 벽/지형 충돌 판정 (Wall Slam Impact & Stun Physics)
  applyKnockbackWithWallImpact(ent, kx, ky, dmgBase = 20) {
    if (!ent || ent.hp <= 0) return;
    const steps = 4;
    const dx = kx / steps;
    const dy = ky / steps;
    let hitWall = false;

    for (let s = 0; s < steps; s++) {
      const nextX = ent.x + dx;
      const nextY = ent.y + dy;
      if (this.world && !this.world.isWalkable(Math.floor(nextX), Math.floor(nextY))) {
        hitWall = true;
        break;
      }
      ent.x = nextX;
      ent.y = nextY;
    }

    if (hitWall) {
      // 🧱 벽 충돌 추가 데미지 (+45%) 및 기절(Stun) & 충돌 파티클
      const wallDmg = Math.max(8, Math.round(dmgBase * 0.45));
      ent.hp -= wallDmg;
      ent.hitTimer = 0.35;
      ent.stunTimer = Math.max(ent.stunTimer || 0, 1.0); // 1.0초 무방비 기절
      this.addHitSparks(ent.x, ent.y, '#f59e0b', 14);
      this.addDustPuff(ent.x, ent.y, 10);
      this.addShockwave(ent.x, ent.y, 2.2, '#f59e0b', 0.35);
      this.addFloatingText(ent.x, ent.y - 1.2, `💥 WALL IMPACT! -${wallDmg} (STUN!)`, '#fbbf24', 1.4);
      if (this.camera) this.camera.shake = Math.min(16, (this.camera.shake || 0) + 5);
      if (typeof audioMgr !== 'undefined' && audioMgr.playHit) audioMgr.playHit();
    }
  }

  // 👥 그림자 분신 (Shadow Decoy) 소환
  spawnShadowDecoy(x, y, facing) {
    if (!this.shadowDecoys) this.shadowDecoys = [];
    if (this.shadowDecoys.length > 8) this.shadowDecoys.shift();
    this.shadowDecoys.push({
      x,
      y,
      facing,
      age: 0,
      duration: 0.75,
      slashed: false
    });
  }

  // 📜 고대 유물 보물지도 생성 (Ancient Treasure Map - Reachable Exploration Range)
  generateTreasureMap(p) {
    if (!p) p = this.spawnOrGetPlayer();
    if (p.treasureMap) return;
    const w = (this.world && this.world.width) ? this.world.width : 3840;
    const h = (this.world && this.world.height) ? this.world.height : 2400;

    // 플레이어 기준 60~150타일 반경 내 걸어서 갈 수 있는 유효한 육지 탐색
    let targetX = Math.round(p.x + 75);
    let targetY = Math.round(p.y + 55);
    for (let attempts = 0; attempts < 30; attempts++) {
      const dist = 60 + Math.random() * 90;
      const ang = Math.random() * Math.PI * 2;
      const tx = Math.floor(p.x + Math.cos(ang) * dist);
      const ty = Math.floor(p.y + Math.sin(ang) * dist);
      if (tx >= 40 && tx < w - 40 && ty >= 40 && ty < h - 40) {
        if (this.world && this.world.isWalkable && this.world.isWalkable(tx, ty)) {
          targetX = tx;
          targetY = ty;
          break;
        }
      }
    }

    p.treasureMap = { x: targetX, y: targetY, title: '📜 잃어버린 황혼의 고대 보물지도', discovered: false };
    this.addFloatingText(p.x, p.y - 1.8, `📜 [보물지도 획득!] 좌표 (X: ${targetX}, Y: ${targetY})`, '#facc15', 2.8);
    this.log('event', `📜 [고대 보물지도]가 발견되었습니다! 숨겨진 좌표 [X: ${targetX}, Y: ${targetY}] 부근에서 발굴할 수 있습니다.`, p.x, p.y);
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
  }

  // ⛏️ 보물 발굴 판정
  checkExcavationTrigger(p) {
    if (!p) p = this.spawnOrGetPlayer();
    if (!p.treasureMap) return false;
    const dist = Math.hypot(p.x - p.treasureMap.x, p.y - p.treasureMap.y);
    if (dist <= 4.2) {
      this.excavateTreasure(p);
      return true;
    }
    return false;
  }

  // 👑 고대 전설 유물 발굴 (Excavation Sequence)
  excavateTreasure(p) {
    if (!p || !p.treasureMap) return;
    const tm = p.treasureMap;
    p.treasureMap = null;

    if (this.camera) {
      this.camera.screenFreeze = 0.12;
      this.camera.shake = 16.0;
      this.camera.zoomPulse = 1.35;
    }

    this.addShockwave(tm.x, tm.y, 6.0, '#facc15', 0.65);
    this.addHitSparks(tm.x, tm.y, '#fde047', 25);
    this.addEffect(tm.x, tm.y, 5.0, '#ca8a04', 0.8);
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();

    const bonusGold = 2500;
    p.gold = (p.gold || 0) + bonusGold;
    p.atk = (p.atk || 25) + 15;
    p.maxHp = (p.maxHp || 450) + 120;
    p.hp = p.maxHp;
    this.gainPlayerExp(300);

    this.spawnLootDrop(tm.x, tm.y, { itemType: 'gold', name: '고대 황금 유물함', icon: '👑', gold: bonusGold, color: '#facc15' });
    this.spawnLootDrop(tm.x + 0.4, tm.y, { itemType: 'gem', name: '태고의 비전 수정', icon: '💎', resourceKey: 'gems', resourceCount: 6, color: '#c084fc' });

    this.addFloatingText(p.x, p.y - 2.0, `👑 [전설 유물 발굴 완료!] (+${bonusGold}G, 영구 공격력+15, HP+120)`, '#facc15', 3.0);
    this.log('event', `👑 플레이어가 [${tm.title}]의 고대 유물을 발굴했습니다! (+${bonusGold}G, 공격력 +15, 최대체력 +120 영구 강화)`, p.x, p.y);
  }

  // 🌊 [2.5] 선박 & 수영 픽셀 V자 물보라 항적 (Dynamic Water Wakes)
  addWaterWake(x, y, angle, scale = 1.0) {
    if (!this.waterWakes) this.waterWakes = [];
    if (this.waterWakes.length > 70) this.waterWakes.shift();
    this.waterWakes.push({
      x, y, angle, scale,
      age: 0,
      duration: 1.2 + scale * 0.3
    });
  }

  updateWaterWakes(dt) {
    if (!this.waterWakes || this.waterWakes.length === 0) return;
    for (let i = this.waterWakes.length - 1; i >= 0; i--) {
      const w = this.waterWakes[i];
      w.age += dt;
      if (w.age >= w.duration) {
        this.waterWakes.splice(i, 1);
      }
    }
  }

  // 🏹 [원거리 전투 모드] 엘븐 롱보우 / 근접 성검 실시간 무기 스왑
  playerToggleWeaponMode(p) {
    if (!p) p = this.spawnOrGetPlayer();
    p.weaponMode = (p.weaponMode === 'ranged') ? 'melee' : 'ranged';
    if (typeof audioMgr !== 'undefined' && audioMgr.playEquip) {
      audioMgr.playEquip();
    }
    if (p.weaponMode === 'ranged') {
      this.addFloatingText(p.x, p.y - 1.6, '🏹 [원거리 모드: 엘븐 롱보우] 관통 사격 준비! (사거리 18타일)', '#38bdf8', 2.0);
      this.log('event', '🏹 영웅이 [원거리 무기: 엘븐 롱보우]를 쥐었습니다. 멀리서 저격하면 최대 2.2배 치명타가 발동합니다!', p.x, p.y);
    } else {
      this.addFloatingText(p.x, p.y - 1.6, '⚔️ [근접 모드: 엑스칼리버] 삼단 콤보 & 에어본 슬램!', '#facc15', 2.0);
      this.log('event', '⚔️ 영웅이 [근접 무기: 성검]을 쥐었습니다. 3단 콤보 연격 및 공중 띄우기를 구사할 수 있습니다.', p.x, p.y);
    }
    this.addEffect(p.x, p.y, 2.8, p.weaponMode === 'ranged' ? '#38bdf8' : '#facc15', 0.4);
    if (typeof updateWeaponModeUI === 'function') updateWeaponModeUI();
  }

  // 🏹 엘븐 롱보우 정밀 관통 화살 발사
  shootPlayerArrow(p, targetX, targetY) {
    if (!p) p = this.spawnOrGetPlayer();
    if (p.bowCooldown > 0) return false;
    p.bowCooldown = 0.35;
    p.bowDrawTimer = 0.25;

    let dx = (typeof targetX === 'number') ? (targetX - p.x) : 0;
    let dy = (typeof targetY === 'number') ? (targetY - p.y) : 0;
    if (dx === 0 && dy === 0) {
      if (p.facing === 'left') dx = -1;
      else if (p.facing === 'right') dx = 1;
      else if (p.facing === 'up') dy = -1;
      else dy = 1;
    }
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const speed = 22.0;

    p.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');

    this.projectiles.push({
      x: p.x + nx * 0.9,
      y: p.y + ny * 0.9,
      vx: nx * speed,
      vy: ny * speed,
      angle: Math.atan2(ny, nx),
      color: '#facc15',
      damage: Math.round((p.atk || 25) * 1.7),
      pierce: 2,
      originX: p.x,
      originY: p.y,
      life: 0.95,
      isArrow: true,
      sender: p
    });

    if (typeof audioMgr !== 'undefined') audioMgr.playShoot();
    this.addSlashArc(p.x + nx * 0.9, p.y + ny * 0.9, 1.2, Math.atan2(ny, nx) - 0.4, Math.atan2(ny, nx) + 0.4, '#38bdf8', 0.15);
    return true;
  }

  // ⚡ 불릿 타임 (Witch Time / Bullet Time) 시공간 감속 발동
  triggerWitchTime(duration = 0.85, scale = 0.22) {
    this.witchTimeTimer = duration;
    this.witchTimeScale = scale;
    if (this.camera) {
      this.camera.screenFreeze = 0.06;
      this.camera.zoomPulse = 1.25;
      this.camera.shake = Math.min(18, (this.camera.shake || 0) + 6.0);
    }
  }

  // 🛡️ 방패 돌진 & 가드 브레이크 (Shield Bash & Guard Break)
  playerShieldBash(p) {
    if (!p) p = this.spawnOrGetPlayer();
    if (p.shieldBashCooldown > 0 || p.isDashing || p.isShip) return false;

    p.shieldBashCooldown = 1.35;
    p.isDashing = true;
    p.dashTimer = 0.18;
    p.dashDuration = 0.18;

    let fx = 0, fy = 0;
    if (p.facing === 'left') fx = -1;
    else if (p.facing === 'right') fx = 1;
    else if (p.facing === 'up') fy = -1;
    else fy = 1;

    p.dashVx = fx * 14.0;
    p.dashVy = fy * 14.0;

    // 전방 원뿔 범위 내 적 충격 & 가드 브레이크
    const bashX = p.x + fx * 1.6;
    const bashY = p.y + fy * 1.6;
    const targets = this.spatialGrid
      ? this.spatialGrid.query(bashX, bashY, 2.0, other => other !== p && other.hp > 0 && this.isHostile(p, other))
      : this.entities.filter(other => other !== p && other.hp > 0 && this.isHostile(p, other) && Math.hypot(other.x - bashX, other.y - bashY) <= 2.0);

    for (const ent of targets) {
      const dmg = Math.round((p.atk || 25) * 1.65);
      ent.hp -= dmg;
      ent.hitTimer = 0.35;
      ent.stunTimer = 1.6; // 1.6초 무방비 기절 (Guard Break)
      ent.x += fx * 2.2;
      ent.y += fy * 2.2;
      this.addHitSparks(ent.x, ent.y, '#38bdf8', 14);
      this.addBloodDecal(ent.x, ent.y, '#dc2626', 1.8, ent.hp <= 0 ? 5 : 2);
      this.addFloatingText(ent.x, ent.y - 1.2, `💥 SHIELD BASH! -${dmg} (기절)`, '#38bdf8', 1.6);
    }

    this.addShockwave(bashX, bashY, 3.8, '#38bdf8', 0.4);
    this.addSlashArc(bashX, bashY, 2.4, Math.atan2(fy, fx) - 0.7, Math.atan2(fy, fx) + 0.7, '#ffffff', 0.25);
    if (typeof audioMgr !== 'undefined' && audioMgr.playShieldBlock) audioMgr.playShieldBlock();
    if (this.camera) this.camera.shake = Math.min(15, (this.camera.shake || 0) + 7);
    return true;
  }

  // ⚡ 기 모으기 차징 어택 (Charge Attack: Whirlwind Cleave & Solar Piercing Beam)
  startPlayerCharge(p) {
    if (!p) p = this.spawnOrGetPlayer();
    if (p.isDashing || p.isAttacking || p.attackCooldown > 0) return;
    p.isCharging = true;
    p.chargeTime = 0;
    p.chargeMaxReached = false;
  }

  updatePlayerCharge(p, dt) {
    if (!p || !p.isCharging) return;
    p.chargeTime += dt;

    // 기 모으는 파티클 수렴
    const auraColor = (p.weaponMode === 'ranged') ? '#38bdf8' : '#facc15';
    if (Math.random() < 0.65) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 1.2 + Math.random() * 0.8;
      this.sparkParticles.push({
        x: p.x + Math.cos(ang) * dist,
        y: p.y + Math.sin(ang) * dist,
        vx: -Math.cos(ang) * 4.5,
        vy: -Math.sin(ang) * 4.5,
        color: auraColor,
        size: 2.2,
        age: 0,
        duration: 0.28
      });
    }

    // 최대 충전 도달 (0.85초)
    if (p.chargeTime >= 0.85 && !p.chargeMaxReached) {
      p.chargeMaxReached = true;
      this.addFloatingText(p.x, p.y - 1.8, '⚡ [MAX OVERCHARGE!]', '#fde047', 1.2);
      this.addShockwave(p.x, p.y, 3.2, '#fde047', 0.35);
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    }
  }

  releasePlayerCharge(p, targetX = null, targetY = null) {
    if (!p || !p.isCharging) return false;
    const ct = p.chargeTime;
    p.isCharging = false;
    const isMax = p.chargeMaxReached || ct >= 0.85;
    p.chargeMaxReached = false;
    p.chargeTime = 0;

    // 0.35초 미만은 일반 공격으로 전환
    if (ct < 0.35) {
      if (p.weaponMode === 'ranged') {
        return this.shootPlayerArrow(p, targetX, targetY);
      } else {
        return this.playerPerformAttack(p);
      }
    }

    // 🌟 차징 특수 공격 발동!
    if (p.weaponMode === 'ranged') {
      // ⚡ 태양의 관통 광선화살 (Solar Piercing Beam Arrow)
      let dx = (typeof targetX === 'number') ? (targetX - p.x) : 0;
      let dy = (typeof targetY === 'number') ? (targetY - p.y) : 0;
      if (dx === 0 && dy === 0) {
        if (p.facing === 'left') dx = -1;
        else if (p.facing === 'right') dx = 1;
        else if (p.facing === 'up') dy = -1;
        else dy = 1;
      }
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      const mult = isMax ? 4.2 : 2.5;
      const dmg = Math.round((p.atk || 25) * mult);

      this.projectiles.push({
        x: p.x + nx * 1.0,
        y: p.y + ny * 1.0,
        vx: nx * 32.0,
        vy: ny * 32.0,
        angle: Math.atan2(ny, nx),
        color: '#f59e0b',
        damage: dmg,
        pierce: 99, // 무한 관통
        originX: p.x,
        originY: p.y,
        life: 0.95,
        isArrow: true,
        isSolarBeam: true,
        sender: p
      });

      this.addShockwave(p.x, p.y, 4.2, '#f59e0b', 0.45);
      this.addSlashArc(p.x, p.y, 3.0, Math.atan2(ny, nx) - 0.6, Math.atan2(ny, nx) + 0.6, '#fde047', 0.25);
      this.addFloatingText(p.x, p.y - 1.8, `⚡ [태양의 관통광선!] x${mult.toFixed(1)}`, '#f59e0b', 1.8);
      if (this.camera) this.camera.shake = Math.min(18, (this.camera.shake || 0) + 8);
      if (typeof audioMgr !== 'undefined') audioMgr.playShoot();
      return true;
    } else {
      // 🌪️ 황금 대폭풍 대회전베기 (Great Whirlwind Cleave) & 🌋 대지 파쇄 분쇄격 (Ground Sunder Fissure)
      const mult = isMax ? 4.5 : 2.8;
      const dmg = Math.round((p.atk || 25) * mult);
      const cleaveRadius = isMax ? 5.2 : 3.8;

      p.isAttacking = true;
      p.attackAnimTimer = 0.35;
      p.attackCooldown = 0.55;

      const targets = this.spatialGrid
        ? this.spatialGrid.query(p.x, p.y, cleaveRadius, other => other !== p && other.hp > 0 && this.isHostile(p, other))
        : this.entities.filter(other => other !== p && other.hp > 0 && this.isHostile(p, other) && Math.hypot(other.x - p.x, other.y - p.y) <= cleaveRadius);

      for (const ent of targets) {
        ent.hp -= dmg;
        ent.hitTimer = 0.35;
        ent.stunTimer = 1.4;
        const kAng = Math.atan2(ent.y - p.y, ent.x - p.x);
        const knockDist = isMax ? 3.6 : 2.6;
        this.applyKnockbackWithWallImpact(ent, Math.cos(kAng) * knockDist, Math.sin(kAng) * knockDist, dmg);
        this.addHitSparks(ent.x, ent.y, '#fde047', 16);
        this.addBloodDecal(ent.x, ent.y, '#dc2626', 2.2, ent.hp <= 0 ? 6 : 2);
        this.addFloatingText(ent.x, ent.y - 1.2, `💥 CRIT x${mult.toFixed(1)} -${dmg}`, '#fde047', 1.5);

        if (ent.hp <= 0) {
          p.kills = (p.kills || 0) + 1;
          this.addDeadRemains(ent.x, ent.y, ent.monsterType || ent.role, ent.scale);
          this.gainPlayerExp(ent.role === 'dragon' ? 180 : 70);
          this.spawnLootDrop(ent.x, ent.y, { itemType: 'gold', name: '골드 주머니', icon: '🪙', gold: ent.gold || 60, color: '#facc15' });
        }
      }

      // 🌋 대지 파쇄 균열 데칼 방사
      if (isMax) {
        for (let i = 0; i < 8; i++) {
          const fAng = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
          this.addGroundFissure(p.x, p.y, fAng, 4.2 + Math.random() * 1.5, '#f97316');
        }
        if (this.camera) this.camera.cinematicBarsTimer = 0.65;
      } else {
        const baseAng = p.dir === 1 ? 0 : p.dir === 3 ? Math.PI : p.dir === 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        this.addGroundFissure(p.x, p.y, baseAng, 3.2, '#fbbf24');
        this.addGroundFissure(p.x, p.y, baseAng - 0.45, 2.8, '#f97316');
        this.addGroundFissure(p.x, p.y, baseAng + 0.45, 2.8, '#f97316');
      }

      this.addShockwave(p.x, p.y, cleaveRadius, '#facc15', 0.5);
      this.addSlashArc(p.x, p.y, cleaveRadius, 0, Math.PI * 2, '#fde047', 0.38);
      this.addFloatingText(p.x, p.y - 2.0, isMax ? `🌋 [초토화 대지파쇄!] (${targets.length}기 분쇄)` : `🌪️ [대폭풍 대회전베기!] (${targets.length}기 분쇄)`, '#facc15', 2.0);

      if (this.camera) {
        this.camera.shake = Math.min(22, (this.camera.shake || 0) + (isMax ? 16 : 10));
        this.camera.screenFreeze = isMax ? 0.12 : 0.08;
      }
      if (typeof audioMgr !== 'undefined') audioMgr.playSword();
      return true;
    }
  }

  // 🦅 상공 정찰매 사역마 동료 토글 (Spirit Falcon Scouting Companion)
  toggleFalconCompanion() {
    const p = this.spawnOrGetPlayer();
    if (!this.falcon) {
      this.falcon = { active: false, x: p.x, y: p.y, altitude: 28, angle: 0, wingCycle: 0, state: 'orbit', target: null, diveCooldown: 0 };
    }
    this.falcon.active = !this.falcon.active;
    if (this.falcon.active) {
      this.falcon.x = p.x;
      this.falcon.y = p.y - 4;
      this.falcon.angle = 0;
      this.falcon.diveCooldown = 2.0;
      this.addFloatingText(p.x, p.y - 2.2, '🦅 [수호 정찰매: 솔개] 상공 정찰 출격!', '#facc15', 2.4);
      this.log('quest', '🦅 영웅의 [수호 정찰매: 솔개]가 창공으로 비상했습니다! 주변 14타일 내 몬스터를 탐지하여 급강하 발톱 강습을 가합니다.', p.x, p.y);
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    } else {
      this.addFloatingText(p.x, p.y - 1.8, '🦅 [정찰매 회귀] 휴식 중', '#94a3b8', 1.5);
    }
  }

  updateFalcon(dt) {
    if (!this.falcon || !this.falcon.active) return;
    const f = this.falcon;
    const p = this.player;
    if (!p) return;

    f.wingCycle += dt * 10;
    if (f.diveCooldown > 0) f.diveCooldown -= dt;

    if (f.state === 'dive' && f.target && f.target.hp > 0) {
      // 적을 향해 초음속 급강하 타격 (34타일/초 & 공기역학 돌풍 잔상)
      const dx = f.target.x - f.x;
      const dy = f.target.y - f.y;
      const dist = Math.hypot(dx, dy);
      if (Math.random() < 0.45) {
        this.addHitSparks(f.x, f.y, '#bae6fd', 2);
      }
      if (dist < 1.0) {
        // 적중!
        const dmg = Math.round((p.atk || 25) * 1.85);
        f.target.hp -= dmg;
        f.target.hitTimer = 0.28;
        f.target.stunTimer = 1.8; // 1.8초 기절
        this.addShockwave(f.target.x, f.target.y, 2.5, '#fde047', 0.28);
        this.addHitSparks(f.target.x, f.target.y, '#facc15', 16);
        this.addFloatingText(f.target.x, f.target.y - 1.2, `🦅 강습 탈론! -${dmg} (1.8s 기절)`, '#facc15', 1.4);
        if (Math.random() < 0.5) {
          this.spawnLootDrop(f.target.x, f.target.y, { itemType: 'gold', name: '약탈 금화', icon: '🪙', gold: 35, color: '#facc15' });
        }
        f.state = 'ascend';
        f.diveCooldown = 4.5;
      } else {
        f.x += (dx / dist) * dt * 34;
        f.y += (dy / dist) * dt * 34;
      }
    } else if (f.state === 'ascend') {
      // 상공 원형 궤도로 복귀
      const targetOrbitX = p.x + Math.cos(f.angle) * 6.5;
      const targetOrbitY = p.y + Math.sin(f.angle) * 4.5;
      const dx = targetOrbitX - f.x;
      const dy = targetOrbitY - f.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1.0) {
        f.state = 'orbit';
      } else {
        f.x += (dx / dist) * dt * 18;
        f.y += (dy / dist) * dt * 18;
      }
    } else {
      // 플레이어 상공 부드러운 원형 선회 궤적
      f.angle += dt * 1.6;
      const orbitX = p.x + Math.cos(f.angle) * 6.5;
      const orbitY = p.y + Math.sin(f.angle) * 4.5;
      f.x += (orbitX - f.x) * 0.12;
      f.y += (orbitY - f.y) * 0.12;

      // 쿨다운 완료 시 인근 적 포착 및 급강하 트리거
      if (f.diveCooldown <= 0) {
        const nearestHostile = this.spatialGrid
          ? this.spatialGrid.findNearest(p.x, p.y, 13.0, other => other !== p && other.faction === 'monster' && other.hp > 0)
          : this.entities.find(other => other !== p && other.faction === 'monster' && other.hp > 0 && Math.hypot(other.x - p.x, other.y - p.y) <= 13.0);
        if (nearestHostile) {
          f.target = nearestHostile;
          f.state = 'dive';
          this.addFloatingText(f.x, f.y - 1.5, '🦅 급강하 기습!', '#fde047', 1.0);
        }
      }
    }
  }

  // 💀 영구 지속 전사자 유골 잔해 데칼 (Persistent Skeletal Remains & Carcasses)
  addDeadRemains(x, y, monsterType = 'skeleton', scale = 1.0) {
    if (!this.deadRemains) this.deadRemains = [];
    if (this.deadRemains.length > 80) this.deadRemains.shift();
    this.deadRemains.push({
      x: x + (Math.random() - 0.5) * 0.4,
      y: y + (Math.random() - 0.5) * 0.4,
      monsterType,
      scale,
      angle: (Math.random() - 0.5) * 0.6,
      age: 0,
      duration: 50.0 + Math.random() * 30.0
    });
  }

  // 🩸 다크 판타지 전투 혈흔 및 그을음 지면 데칼 (Persistent Ground Blood & Scorch Decals)
  addBloodDecal(x, y, color = '#991b1b', size = 2.4, count = 3) {
    if (!this.bloodDecals) this.bloodDecals = [];
    if (this.bloodDecals.length > 220) {
      this.bloodDecals.splice(0, count);
    }
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 1.5;
      const offsetY = (Math.random() - 0.5) * 1.5;
      const radius = size * (0.6 + Math.random() * 0.7);
      this.bloodDecals.push({
        x: x + offsetX,
        y: y + offsetY,
        radius,
        color,
        age: 0,
        duration: 35.0 + Math.random() * 25.0, // 35~60초간 바닥에 지속되며 서서히 어둡게 마름
        shape: Math.floor(Math.random() * 3)
      });
    }
  }

  addFloatingText(x, y, text, color = '#ffffff', duration = 1.6) {
    if (this.floatingTexts.length > 240) this.floatingTexts.shift();
    this.floatingTexts.push({ x, y, text, color, age: 0, duration });
  }

  addEffect(x, y, radius, color = '#facc15', duration = 0.7) {
    this.specialEffects.push({ x, y, radius, color, age: 0, duration });
  }

  // 💥 방사형 충격파 (Expanding Radial Shockwave)
  addShockwave(x, y, maxRadius = 5.0, color = '#facc15', duration = 0.55) {
    if (!this.shockwaves) this.shockwaves = [];
    if (this.shockwaves.length > 40) this.shockwaves.shift();
    this.shockwaves.push({ x, y, maxRadius, color, age: 0, duration });
  }

  // ⚔️ 무기 궤적 슬래시 리본 아크 (Weapon Slash Arc Trail)
  addSlashArc(x, y, radius = 2.4, startAngle = 0, endAngle = Math.PI, color = '#facc15', duration = 0.22) {
    if (!this.slashArcs) this.slashArcs = [];
    if (this.slashArcs.length > 30) this.slashArcs.shift();
    this.slashArcs.push({ x, y, radius, startAngle, endAngle, color, age: 0, duration });
  }

  // 💥 정밀 픽셀 히트 스파크 (Hit Sparks)
  addHitSparks(x, y, color = '#facc15', count = 7) {
    if (!this.sparkParticles) this.sparkParticles = [];
    if (this.sparkParticles.length > 300) this.sparkParticles.splice(0, count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      this.sparkParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color,
        size: Math.random() > 0.5 ? 2.5 : 1.5,
        age: 0,
        duration: 0.28 + Math.random() * 0.22
      });
    }
  }

  // 💥 정밀 방향성 타격 파편 & 스파크 비산 (Directional Hit Splatter Burst)
  addDirectionalHitBurst(x, y, dirAngle, color = '#facc15', count = 10) {
    if (!this.sparkParticles) this.sparkParticles = [];
    if (this.sparkParticles.length > 300) this.sparkParticles.splice(0, count);
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.3;
      const angle = dirAngle + spread;
      const speed = 2.5 + Math.random() * 5.5;
      this.sparkParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        color,
        size: Math.random() > 0.4 ? 2.8 : 1.8,
        age: 0,
        duration: 0.30 + Math.random() * 0.25
      });
    }
  }

  // 🌟 레벨업 & 보물상자 황금 축하 스타버스트 (Level-Up Starburst)
  addLevelUpBurst(x, y) {
    if (!this.sparkParticles) this.sparkParticles = [];
    const colors = ['#fde047', '#facc15', '#ffffff', '#38bdf8', '#c084fc', '#f472b6'];
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 / 28) * i + Math.random() * 0.2;
      const speed = 2.5 + Math.random() * 5.0;
      this.sparkParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        color: colors[i % colors.length],
        size: 3,
        age: 0,
        duration: 0.65 + Math.random() * 0.35
      });
    }
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
    // (A) 드워프 왕국 아이언포지 (드워프 전사 14명, 채굴사 12명, 룬 대장장이 6명)
    for (let i = 0; i < 14; i++) {
      this.createEntity({
        name: `드워프 철갑병 ${this.pickName('dwarf')}`,
        race: 'dwarf',
        role: 'soldier',
        subClass: '드워프 방패병',
        customIcon: '🛡️',
        faction: 'kingdom',
        homeId: 'ironforge',
        x: sMap.ironforge.x + (Math.random() - 0.5) * 12,
        y: sMap.ironforge.y + (Math.random() - 0.5) * 12,
        hp: 260, maxHp: 260, atk: 24, gold: 90, scale: 1.05
      });
    }
    for (let i = 0; i < 12; i++) {
      this.createEntity({
        name: `드워프 채굴사 ${this.pickName('dwarf')}`,
        race: 'dwarf',
        role: 'miner',
        subClass: '드워프 광부',
        customIcon: '⛏️',
        faction: 'kingdom',
        homeId: 'ironforge',
        x: sMap.ironforge.x + (Math.random() - 0.5) * 10,
        y: sMap.ironforge.y - 3 + (Math.random() - 0.5) * 6,
        hp: 150, maxHp: 150, atk: 15, gold: 75
      });
    }
    for (let i = 0; i < 6; i++) {
      this.createEntity({
        name: `룬 대장장이 ${this.pickName('dwarf')}`,
        race: 'dwarf',
        role: 'blacksmith',
        subClass: '드워프 룬 장인',
        customIcon: '⚒️',
        faction: 'kingdom',
        homeId: 'ironforge',
        x: sMap.ironforge.x + (Math.random() - 0.5) * 6,
        y: sMap.ironforge.y + (Math.random() - 0.5) * 5,
        hp: 165, maxHp: 165, atk: 18, gold: 130
      });
    }

    // (B) 엘프 성소 엘븐하임 & 실버리프 호수 (엘프 레인저 18명, 약초사 14명)
    for (let i = 0; i < 10; i++) {
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
        x: sMap.elvenheim.x + (Math.random() - 0.5) * 10,
        y: sMap.elvenheim.y + (Math.random() - 0.5) * 10,
        hp: 175, maxHp: 175, atk: 22, gold: 85
      });
    }
    for (let i = 0; i < 8; i++) {
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
        x: sMap.silverleaf.x + (Math.random() - 0.5) * 10,
        y: sMap.silverleaf.y + (Math.random() - 0.5) * 10,
        hp: 170, maxHp: 170, atk: 21, gold: 75
      });
    }
    for (let i = 0; i < 10; i++) {
      this.createEntity({
        name: `엘프 약초사 ${this.pickName('elf')}`,
        race: 'elf',
        role: 'farmer',
        subClass: '세계수 약초사',
        customIcon: '🌿',
        faction: 'kingdom',
        homeId: 'elvenheim',
        x: sMap.elvenheim.x - 6 + (Math.random() - 0.5) * 8,
        y: sMap.elvenheim.y + 6 + (Math.random() - 0.5) * 6,
        hp: 110, maxHp: 110, atk: 9, gold: 70
      });
    }

    // (C) 사막 수인족 미라주 오아시스 (수인 샴쉬르 전사 12명, 향신료 농부 8명)
    for (let i = 0; i < 12; i++) {
      this.createEntity({
        name: `사막 수인전사 ${this.pickName('beastkin')}`,
        race: 'beastkin',
        role: 'soldier',
        subClass: '수인 샴쉬르 수호자',
        customIcon: '🗡️',
        faction: 'kingdom',
        homeId: 'mirage_oasis',
        x: sMap.mirage_oasis.x + (Math.random() - 0.5) * 10,
        y: sMap.mirage_oasis.y + (Math.random() - 0.5) * 10,
        hp: 185, maxHp: 185, atk: 23, gold: 85
      });
    }
    for (let i = 0; i < 8; i++) {
      this.createEntity({
        name: `수인 재배사 ${this.pickName('beastkin')}`,
        race: 'beastkin',
        role: 'farmer',
        subClass: '향신료 농부',
        customIcon: '🌶️',
        faction: 'kingdom',
        homeId: 'mirage_oasis',
        x: sMap.mirage_oasis.x - 6 + (Math.random() - 0.5) * 8,
        y: sMap.mirage_oasis.y - 5 + (Math.random() - 0.5) * 6,
        hp: 105, maxHp: 105, atk: 9, gold: 75
      });
    }

    // (D) 인간 왕국 본토 수비병 & 농부 & 어부
    const humanTowns = ['solaris', 'goldenwheat', 'bluewave', 'valor_fort', 'oakwood', 'windmill_valley', 'st_mare', 'solhaven', 'valkyrie_gate'];
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
        subClass: '비전 수정동굴 아케인 마도사',
        ranged: true,
        projColor: '#c084fc',
        faction: 'kingdom',
        homeId: 'crystal_caverns',
        x: sMap.crystal_caverns.x + (Math.random() - 0.5) * 6,
        y: sMap.crystal_caverns.y + (Math.random() - 0.5) * 6,
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
        homeId: 'dune_bazaar',
        x: sMap.dune_bazaar.x + (Math.random() - 0.5) * 6,
        y: sMap.dune_bazaar.y + (Math.random() - 0.5) * 6,
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

    // 4. 육상 무역 마차 (24팀) & 호위 용병
    for (let i = 0; i < 24; i++) {
      const townIds = ['solaris', 'goldenwheat', 'bluewave', 'ironforge', 'silverleaf', 'valor_fort', 'oakwood', 'windmill_valley', 'st_mare', 'solhaven', 'valkyrie_gate'];
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

    // 5. 대해양 무역 범선 (22척) & 해군 전열함 (16척)
    const ports = ['bluewave', 'elvenheim', 'mirage_oasis', 'st_mare', 'siren_coral', 'lone_beacon'];
    for (let i = 0; i < 22; i++) {
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
    for (let i = 0; i < 16; i++) {
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

    // 6. 종족별 모험가 파티 (48명)
    const advTemplates = [
      { subClass: '인간 소드마스터', race: 'human', atk: 26, hp: 220, ranged: false, projColor: '#60a5fa' },
      { subClass: '엘프 아크메이지', race: 'elf', atk: 30, hp: 160, ranged: true,  projColor: '#f97316' },
      { subClass: '엘프 정령궁수', race: 'elf', atk: 24, hp: 170, ranged: true, projColor: '#2dd4bf' },
      { subClass: '드워프 광전사', race: 'dwarf', atk: 28, hp: 260, ranged: false, projColor: '#fb923c' },
      { subClass: '수인 섀도우블레이드', race: 'beastkin', atk: 27, hp: 180, ranged: false, projColor: '#eab308' },
      { subClass: '성전사 팔라딘', race: 'human', atk: 23, hp: 250, ranged: false, projColor: '#facc15' }
    ];
    for (let i = 0; i < 48; i++) {
      const tpl = advTemplates[i % advTemplates.length];
      const baseTowns = ['solaris', 'valor_fort', 'elvenheim', 'mirage_oasis', 'ironforge', 'solhaven', 'oakwood', 'valkyrie_gate'];
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
      { type: 'deer', icon: '🦌', name: '야생 백록', count: 28, x: sMap.silverleaf.x + 12, y: sMap.silverleaf.y - 12, radius: 30, hp: 60, speed: 1.45 },
      // 🐇 들토끼 (황금밀 농촌 평야 & 윈드밀 계곡)
      { type: 'rabbit', icon: '🐇', name: '들토끼', count: 26, x: sMap.goldenwheat.x - 10, y: sMap.goldenwheat.y + 10, radius: 26, hp: 30, speed: 1.55 },
      // 🐄 젖소 (황금밀 대농장 목장)
      { type: 'cow', icon: '🐄', name: '젖소', count: 18, x: sMap.goldenwheat.x + 12, y: sMap.goldenwheat.y - 8, radius: 14, hp: 120, speed: 0.8 },
      // 🐑 양 (평원 목초지)
      { type: 'sheep', icon: '🐑', name: '목초지 양', count: 20, x: sMap.goldenwheat.x - 16, y: sMap.goldenwheat.y - 14, radius: 16, hp: 50, speed: 0.9 },
      // 🐻 불곰 (북부 산맥 & 오크우드 숲)
      { type: 'bear', icon: '🐻', name: '갈색 불곰', count: 16, x: sMap.oakwood.x + 14, y: sMap.oakwood.y + 12, radius: 22, hp: 180, speed: 1.25, isPredator: true },
      // 🐐 산양 (북부 험준한 바위산 & 천공 고원)
      { type: 'goat', icon: '🐐', name: '바위 산양', count: 18, x: sMap.ironforge.x + 16, y: sMap.ironforge.y - 12, radius: 20, hp: 70, speed: 1.35 },
      // 🐬 대양 돌고래 (대해양 항로 & 세이렌 산호섬)
      { type: 'dolphin', icon: '🐬', name: '대양 돌고래', count: 32, x: 220, y: 220, radius: 70, hp: 90, speed: 1.65, isAquatic: true },
      // 🐢 거대 바다거북 (신대륙 산호초 근해)
      { type: 'turtle', icon: '🐢', name: '거대 바다거북', count: 18, x: sMap.siren_coral.x + 10, y: sMap.siren_coral.y + 8, radius: 28, hp: 160, speed: 0.75, isAquatic: true },
      // 🐪 사막 낙타 (미라주 오아시스 & 베두인 캠프)
      { type: 'camel', icon: '🐪', name: '사막 낙타', count: 22, x: sMap.mirage_oasis.x - 14, y: sMap.mirage_oasis.y - 14, radius: 30, hp: 130, speed: 1.15 },
      // 🐺 북방 설원 늑대 (노스펠름 영구동토 & 발키리 설산)
      { type: 'wolf', icon: '🐺', name: '설원 은빛늑대', count: 18, x: sMap.valkyrie_gate.x - 15, y: sMap.valkyrie_gate.y + 10, radius: 25, hp: 140, speed: 1.45, isPredator: true },
      // 🐊 늪지대 악어 (동부 안개 늪지대)
      { type: 'croc', icon: '🐊', name: '늪지대 맹독악어', count: 16, x: sMap.whispering_woods.x + 18, y: sMap.whispering_woods.y + 15, radius: 24, hp: 170, speed: 1.15, isPredator: true },
      // 🦂 사막 거대전갈 (서남 미라주 사막 모래언덕)
      { type: 'scorpion', icon: '🦂', name: '사막 거대전갈', count: 18, x: sMap.sphinx_pyramid.x - 12, y: sMap.sphinx_pyramid.y - 12, radius: 26, hp: 130, speed: 1.25, isPredator: true },
      // 🦎 화산 샐러맨더 (남부 드라코니아 흑요석 용암대)
      { type: 'salamander', icon: '🦎', name: '흑요석 불꽃도마뱀', count: 16, x: sMap.volcano_isle.x + 14, y: sMap.volcano_isle.y + 12, radius: 22, hp: 150, speed: 1.2, isPredator: true },
      // 🐔 귀여운 암탉 (황금밀 대평원 농가 & 솔라리스 근교)
      { type: 'chicken', icon: '🐔', name: '시골 암탉', count: 48, x: sMap.goldenwheat.x - 3, y: sMap.goldenwheat.y + 4, radius: 20, hp: 35, speed: 0.95 },
      { type: 'chicken', icon: '🐔', name: '왕실 백색토종닭', count: 32, x: sMap.solaris.x + 8, y: sMap.solaris.y + 10, radius: 16, hp: 35, speed: 0.95 },
      { type: 'chicken', icon: '🐔', name: '오크우드 방목닭', count: 24, x: sMap.oakwood.x - 5, y: sMap.oakwood.y + 5, radius: 14, hp: 35, speed: 0.95 }
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

    // 5. 🐉 용족 성역 수호병 & 드라고니안 전사단 (Dragonkin Warriors)
    const dragonkinSpawns = [
      { name: '드라고니안 용혈 전사', loc: sMap.dragon_eyrie, sub: '천공 화염 용기병', type: 'fire', color: '#f97316' },
      { name: '드라고니안 서리 수호병', loc: sMap.ice_dragon_altar, sub: '천공 빙룡 수호자', type: 'frost', color: '#38bdf8' },
      { name: '드라고니안 뇌전 주술사', loc: sMap.dragon_ruins, sub: '고대 뇌룡 사제', type: 'thunder', color: '#facc15' },
      { name: '드라고니안 흑암 척후병', loc: sMap.dragon_graveyard, sub: '용골 암영 파수병', type: 'shadow', color: '#c084fc' }
    ];
    for (const dk of dragonkinSpawns) {
      if (!dk.loc) continue;
      for (let i = 0; i < 8; i++) {
        this.createEntity({
          name: `${dk.name} ${i + 1}`,
          race: 'dragonkin',
          role: 'soldier',
          dragonType: dk.type,
          subClass: dk.sub,
          customIcon: '🐲',
          faction: 'neutral',
          homeId: dk.loc.id,
          ranged: true,
          projColor: dk.color,
          x: dk.loc.x + (Math.random() - 0.5) * 8,
          y: dk.loc.y + (Math.random() - 0.5) * 8,
          hp: 340, maxHp: 340, atk: 32, gold: 180, scale: 1.25,
          thought: `🐲 고대 용족의 영지를 수호하며 비룡의 비상을 보좌하는 중`
        });
      }
    }

    // 5대 대륙 고유 몬스터 생태계 스폰 (전 대륙 몬스터 거점 활성화 - 1,000+ 개체수 확장)
    this.spawnMonstersForLair('goblin_camp', 24);
    this.spawnMonstersForLair('orc_stronghold', 24);
    this.spawnMonstersForLair('obsidian_necropolis', 22);
    this.spawnMonstersForLair('pyramid_tomb', 20);
    this.spawnMonstersForLair('pirate_cove', 22);
    this.spawnMonstersForLair('volcano_isle', 18);
    this.spawnMonstersForLair('molten_forge', 18);
    this.spawnMonstersForLair('glacier_camp', 18);
    this.spawnMonstersForLair('whispering_grove', 18);
    this.spawnMonstersForLair('dragon_eyrie', 18);
    this.spawnMonstersForLair('frost_citadel', 20);
    this.spawnMonstersForLair('dragon_ruins', 18);
    this.spawnMonstersForLair('dragon_graveyard', 18);

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
            name: `${mname} ${i + 1}`,
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
          name: `${s.name} ${leaderTitle}`,
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
            name: `${s.name} ${isRanger ? '왕립 순찰대' : '성채 수비병'} ${g + 1}`,
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
          name: `${s.name} 교역상`,
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
    }

    // 주요 도시 및 성역에 고유 NPC (사제, 방랑 상인, 성전 십자군) 스폰
    const sol = sMap.solaris;
    if (sol) {
      this.createEntity({
        name: '대주교 발레리우스',
        race: 'human',
        role: 'priest',
        subClass: '루미나스 대성당 수석 사제',
        customIcon: '✨',
        faction: 'kingdom',
        homeId: 'solaris',
        x: sol.x + 2,
        y: sol.y - 3,
        hp: 250, maxHp: 250, atk: 15, gold: 500, scale: 1.15,
        thought: '✝️ 대성당에서 왕국의 평화와 모험가의 무운을 축복하는 중'
      });
      this.createEntity({
        name: '방랑 대상인 마르코',
        race: 'human',
        role: 'merchant',
        subClass: '대륙 횡단 거상',
        customIcon: '🎒',
        faction: 'kingdom',
        homeId: 'solaris',
        x: sol.x - 3,
        y: sol.y + 2,
        hp: 200, maxHp: 200, atk: 12, gold: 1500, scale: 1.15,
        thought: '🎒 5대 대륙 특산품과 전설의 보물들을 짊어지고 거래처를 물색하는 중'
      });
      this.createEntity({
        name: '성전 기사단장 가웨인',
        race: 'human',
        role: 'crusader',
        subClass: '태양의 십자군 사령관',
        customIcon: '🛡️',
        faction: 'kingdom',
        homeId: 'solaris',
        x: sol.x + 4,
        y: sol.y + 1,
        hp: 420, maxHp: 420, atk: 35, gold: 800, scale: 1.25,
        thought: '🛡️ 성스러운 십자가 문양의 갑주를 빛내며 왕국을 수호하는 중'
      });
    }
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
    this.player.exp = 0;
    this.player.maxExp = 120;
    this.player.statPoints = 3;
    this.player.stats = { str: 10, vit: 10, agi: 10, int: 10 };
    this.player.awakeningGauge = 0; // 0 ~ 100%
    this.player.combatStance = 'balanced'; // 'balanced' | 'berserk' | 'guardian'
    if (!this.player.inventory.wood) this.player.inventory.wood = 8;
    if (!this.player.inventory.ore) this.player.inventory.ore = 6;
    if (!this.player.inventory.herbs) this.player.inventory.herbs = 5;
    this.addEffect(this.player.x, this.player.y, 5, '#facc15', 1.0);
    this.log('quest', '🌟 플레이어 영웅이 아테리아 대륙에 강림했습니다! (백마 탑승 · 레벨 5)', this.player.x, this.player.y);
    return this.player;
  }

  gainPlayerExp(amount) {
    const p = this.player;
    if (!p) return;
    if (this.activeWorldEvent && this.activeWorldEvent.buff === 'blood_moon') {
      amount *= 2;
    }
    p.exp = (p.exp || 0) + amount;
    this.addFloatingText(p.x, p.y - 1.2, `+${amount} EXP`, '#38bdf8', 1.2);
    while (p.exp >= (p.maxExp || 100)) {
      p.exp -= (p.maxExp || 100);
      p.level = (p.level || 1) + 1;
      p.maxExp = Math.round((p.maxExp || 100) * 1.35 + 30);
      p.statPoints = (p.statPoints || 0) + 3;
      p.maxHp += 30;
      p.hp = p.maxHp;
      p.atk += 3;
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
      this.addEffect(p.x, p.y, 8.0, '#facc15', 1.5);
      this.addFloatingText(p.x, p.y - 2.2, `🎉 LEVEL UP! Lv.${p.level} 달성! (스탯 포인트 +3 [U])`, '#fde047', 2.8);
      this.log('quest', `🌟 플레이어가 레벨 ${p.level}에 도달했습니다! 능력치 강화 포인트 +3P 획득 [U]`, p.x, p.y);
    }
  }

  gatherNearestResource() {
    const p = this.spawnOrGetPlayer();
    const nodes = this.world.resourceNodes || [];
    let bestNode = null;
    let minDist = 4.2;

    for (const node of nodes) {
      const d = Math.hypot(node.x - p.x, node.y - p.y);
      if (d < minDist && node.amount > 0) {
        minDist = d;
        bestNode = node;
      }
    }

    if (bestNode) {
      bestNode.amount--;
      const resKey = bestNode.resource;
      const count = (this.activeWorldEvent && this.activeWorldEvent.buff === 'tree_bloom' && resKey === 'herbs') ? 2 : 1;
      
      if (resKey === 'gold') {
        const gGain = 80;
        p.gold += gGain;
        this.addFloatingText(p.x, p.y - 1.4, `⛏️ 황금 광맥 채광 성공! +${gGain}G`, '#facc15', 1.8);
      } else {
        p.inventory[resKey] = (p.inventory[resKey] || 0) + count;
        const icon = GOODS_KR[resKey] || resKey;
        this.addFloatingText(p.x, p.y - 1.4, `🌿 [${bestNode.name}] 채집 완료! +${count} ${icon}`, '#4ade80', 1.8);
      }

      this.addEffect(bestNode.x, bestNode.y, 2.5, '#4ade80', 0.6);
      if (typeof audioMgr !== 'undefined') audioMgr.playMagic();
      this.gainPlayerExp(30);

      if (bestNode.amount <= 0) {
        bestNode.respawn = 45; // 45초 후 재생성
        this.addFloatingText(bestNode.x, bestNode.y - 0.8, '노드 고갈 (45초 후 재생성)', '#94a3b8', 1.4);
      }
      return true;
    } else {
      // 일반 지형 채집 (숲/산맥/물가)
      const tx = Math.floor(p.x);
      const ty = Math.floor(p.y);
      const tile = this.world.getTile(tx, ty);
      if (tile === TILE.FOREST || tile === TILE.AUTUMN_WOOD || tile === TILE.MEADOW) {
        p.inventory.wood = (p.inventory.wood || 0) + 1;
        this.addFloatingText(p.x, p.y - 1.3, '🌲 원목 벌목 완료! (+1 목재)', '#84cc16', 1.5);
        this.addEffect(p.x, p.y, 2.0, '#84cc16', 0.5);
        this.gainPlayerExp(15);
        return true;
      } else if (tile === TILE.MOUNTAIN || tile === TILE.HILLS) {
        p.inventory.ore = (p.inventory.ore || 0) + 1;
        this.addFloatingText(p.x, p.y - 1.3, '⛏️ 암석 채광 완료! (+1 광석)', '#94a3b8', 1.5);
        this.addEffect(p.x, p.y, 2.0, '#94a3b8', 0.5);
        this.gainPlayerExp(15);
        return true;
      }
      return false;
    }
  }

  togglePetCompanion() {
    const p = this.spawnOrGetPlayer();
    if (!this.pet) {
      this.pet = {
        active: false,
        name: '아기 수호 비룡 샬롯',
        icon: '🐲',
        x: p.x + 1.5,
        y: p.y - 1.5,
        targetX: p.x + 1.5,
        targetY: p.y - 1.5,
        speed: 3.5,
        sparkleTimer: 0
      };
    }
    this.pet.active = !this.pet.active;
    if (this.pet.active) {
      this.pet.x = p.x + 1.5;
      this.pet.y = p.y - 1.5;
      p.atk += 15;
      p.speed += 0.2;
      this.addEffect(this.pet.x, this.pet.y, 4.0, '#ec4899', 1.0);
      this.addFloatingText(p.x, p.y - 1.8, '🐲 [아기 수호 비룡] 소환! (공격력+15, 이속+0.2, 자동 보물상자 수집 오라)', '#f472b6', 2.4);
      this.log('quest', '🐲 플레이어가 전설의 수호 펫 [아기 비룡 샬롯]을 소환하여 동행합니다!', p.x, p.y);
      if (typeof audioMgr !== 'undefined') audioMgr.playRoar();
    } else {
      p.atk = Math.max(10, p.atk - 15);
      p.speed = Math.max(1.5, p.speed - 0.2);
      this.addFloatingText(p.x, p.y - 1.2, '🐲 수호 펫을 휴식시켰습니다.', '#cbd5e1', 1.5);
    }
  }

  togglePlayerMount() {
    const p = this.spawnOrGetPlayer();
    if (p.isShip) {
      this.addFloatingText(p.x, p.y - 1.2, '⚓ 바다 위에서는 항해 중입니다! 부두(DOCK)나 모래 해변(SAND)으로 전진해 상륙하세요.', '#f87171', 1.8);
      return;
    }

    if (p.mount === 'horse') {
      // 백마 -> 섀도우 울프
      p.mount = 'wolf';
      p.isFlying = false;
      p.speed = 3.15;
      p.icon = '🐺';
      if (typeof audioMgr !== 'undefined' && audioMgr.playWolfHowl) audioMgr.playWolfHowl();
      this.addEffect(p.x, p.y, 4.5, '#c084fc', 0.8);
      this.addFloatingText(p.x, p.y - 1.5, '🐺 펜리르 섀도우 울프 탑승! (이동속도 +60% / 그림자 질주)', '#c084fc', 2.0);
      this.log('quest', '🐺 플레이어가 전설의 펜리르 섀도우 울프에 탑승하여 질주합니다!', p.x, p.y);
    } else if (p.mount === 'wolf') {
      // 섀도우 울프 -> 비룡
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

    if (skillKey === 'T' || skillKey === 'pet') {
      this.togglePetCompanion();
      return;
    }

    if (skillKey === 'K' || skillKey === 'craft') {
      const modal = document.getElementById('craftingModal');
      if (modal) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden') && typeof updateCraftingUI === 'function') updateCraftingUI();
      }
      return;
    }

    if (skillKey === 'U' || skillKey === 'stats') {
      const modal = document.getElementById('statsModal');
      if (modal) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden') && typeof updateStatsModalUI === 'function') updateStatsModalUI();
      }
      return;
    }

    if (skillKey === 'H' || skillKey === 'potion') {
      if (this.rpgManager && this.rpgManager.useQuickPotion) {
        this.rpgManager.useQuickPotion('health');
      } else {
        this.useHealthPotion(p);
      }
      return;
    }

    if (skillKey === '5') {
      if (this.rpgManager && this.rpgManager.useQuickPotion) {
        this.rpgManager.useQuickPotion('swift');
      }
      return;
    }

    if (skillKey === '6') {
      if (this.rpgManager && this.rpgManager.useQuickPotion) {
        this.rpgManager.useQuickPotion('berserk');
      }
      return;
    }

    if (skillKey === 'Z' || skillKey === 'parry' || skillKey === 'block') {
      this.playerPerformParry(p);
      return;
    }

    if (skillKey === 'stance') {
      this.playerToggleStance(p);
      return;
    }

    if (skillKey === 'weaponSwap' || skillKey === 'weapon' || skillKey === 'Tab' || skillKey === 'TAB') {
      this.playerToggleWeaponMode(p);
      return;
    }

    if (skillKey === 'falcon' || skillKey === 'V' || skillKey === 'KeyV') {
      this.toggleFalconCompanion();
      return;
    }

    if (skillKey === 'X' || skillKey === 'ultimate') {
      this.playerCastUltimate(p);
      return;
    }

    if (skillKey === 'Q') {
      if (typeof audioMgr !== 'undefined') audioMgr.playMagic();
      this.addEffect(p.x, p.y, 11, '#f97316', 0.85);
      let hitCount = 0;
      const targets = this.spatialGrid
        ? this.spatialGrid.query(p.x, p.y, 12, other => other.faction === 'monster' && other.hp > 0)
        : this.entities.filter(other => other.faction === 'monster' && other.hp > 0 && Math.hypot(other.x - p.x, other.y - p.y) <= 12);
      for (const other of targets) {
        const dmg = Math.round(p.atk * 2.4);
        other.hp -= dmg;
        other.hitTimer = 0.25;
        other.combatTarget = p;
        this.rallyNearbyAllies(other, p, 10.0);
        hitCount++;
        this.addFloatingText(other.x, other.y - 1, `⚡-${dmg}`, '#facc15', 1.2);
        if (other.hp <= 0) {
          p.kills++;
          p.gold += other.gold;
          p.inventory.gems = (p.inventory.gems || 0) + 1;
          this.gainPlayerExp(45);
        }
      }
      this.addFloatingText(p.x, p.y - 1.5, hitCount > 0 ? `⚡ 천공의 심판! (${hitCount}기 타격)` : '⚡ 천공의 심판!', '#fde047', 1.4);
    } else if (skillKey === 'E') {
      // 0순위: 처형 피니셔 (Glory Kill / Execution Finisher)
      if (this.checkExecutionTrigger(p)) {
        return;
      }
      // 0.5순위: 📜 고대 유물 보물 발굴 (Excavation)
      if (this.checkExcavationTrigger(p)) {
        return;
      }
      // 1순위: 고대 석판 모놀리스 판독
      if (p.nearMonolith && this.rpgManager && this.rpgManager.inspectMonolith) {
        this.rpgManager.inspectMonolith(p.nearMonolith.id);
        return;
      }
      // 인근 NPC와 대화 우선, 다음으로 자원 채집, 없으면 질주 가속
      const talked = this.interactWithNearestNPC(p);
      if (!talked) {
        const gathered = this.gatherNearestResource();
        if (!gathered) {
          if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
          p.boostTimer = 6.0;
          p.hp = Math.min(p.maxHp, p.hp + 150);
          this.addEffect(p.x, p.y, 4.5, '#38bdf8', 0.7);
          this.addFloatingText(p.x, p.y - 1.4, '💨 질주 가속 & 생명력 회복!', '#38bdf8', 1.4);
        }
      }
    } else if (skillKey === 'F') {
      // 0순위: 인근 고대 시련의 사당 상호작용
      if (this.rpgManager) {
        const shrine = this.rpgManager.checkNearbyShrine(p);
        if (shrine) {
          this.rpgManager.startShrineTrial(shrine.id);
          return;
        }

        const dungeon = this.rpgManager.checkNearbyDungeon(p);
        if (dungeon) {
          if (typeof window.openDungeonModal === 'function') {
            window.openDungeonModal(dungeon);
          } else {
            this.rpgManager.enterDungeonExpedition(dungeon.id);
          }
          return;
        }
      }
      // 1순위: 근접 NPC와의 전용 상호작용 및 보상 대화
      const talked = this.interactWithNearestNPC(p);
      if (!talked) {
        // 2순위: 인근 모닥불(Campfire) 휴식 및 요리 버프
        const camp = this.checkNearbyCampfire(p);
        // 3순위: 인근 거점 도시/항구 교역 및 강화
        if (!camp) {
          this.interactWithNearestSettlement();
        }
      }
    } else if (skillKey === 'J' || skillKey === 'attack') {
      this.playerPerformAttack(p);
    } else if (skillKey === 'SPACE' || skillKey === 'dodge' || skillKey === 'dash') {
      this.playerDodgeRoll(p);
    } else if (skillKey === 'G' || skillKey === 'awakening') {
      if (this.rpgManager) {
        if (this.rpgManager.awakening) {
          this.rpgManager.castAwakeningSkill();
        } else if (typeof window.openAwakeningModal === 'function') {
          window.openAwakeningModal();
        }
      }
    } else if (skillKey === 'Z' || skillKey === 'enchant') {
      if (typeof window.openRuneforgeModal === 'function') {
        window.openRuneforgeModal();
      }
    } else if (skillKey === 'V' || skillKey === 'colosseum') {
      if (typeof window.openColosseumModal === 'function') {
        window.openColosseumModal();
      }
    } else if (skillKey === 'M' || skillKey === 'map') {
      if (typeof window.openWorldMapModal === 'function') {
        window.openWorldMapModal();
      }
    }
  }

  // 💨 플레이어 회피 롤 / 대시 (Dodge Roll / Dash - 무적 회피 & 잔상 & 먼지 파티클)
  playerDodgeRoll(p) {
    if (!p) p = this.spawnOrGetPlayer();
    if (p.dodgeCooldown > 0 || p.isDashing || p.isShip) return;

    const hasWindstrider = this.rpgManager && this.rpgManager.hasTrait('windstrider');
    p.dodgeCooldown = hasWindstrider ? 0.62 : 0.95;
    p.isDashing = true;
    p.dashTimer = 0.28;
    p.dashDuration = 0.28;
    p.invulnerableTimer = 0.32;
    p.invulnerable = true;

    // 대시 방향 결정: 입력 방향 우선, 없으면 바라보는 방향
    let dx = p.vx !== 0 ? Math.sign(p.vx) : 0;
    let dy = p.vy !== 0 ? Math.sign(p.vy) : 0;
    if (dx === 0 && dy === 0) {
      if (p.facing === 'left') dx = -1;
      else if (p.facing === 'right') dx = 1;
      else if (p.facing === 'up') dy = -1;
      else dy = 1;
    }
    const len = Math.hypot(dx, dy) || 1;
    const dashSpeed = p.speed * 2.8;
    p.dashVx = (dx / len) * dashSpeed;
    p.dashVy = (dy / len) * dashSpeed;

    if (typeof audioMgr !== 'undefined') audioMgr.playWhirlwind();
    this.addEffect(p.x, p.y, 2.8, '#38bdf8', 0.4);
    this.addShockwave(p.x, p.y, 2.6, '#38bdf8', 0.32);
    this.addHitSparks(p.x, p.y, '#bae6fd', 8);
    this.addDustPuff(p.x, p.y, 6);
    this.addFloatingText(p.x, p.y - 1.2, '💨 닷지 롤 (무적 회피!)', '#38bdf8', 0.9);

    // 잔상 이펙트 등록
    if (!this.ghostTrails) this.ghostTrails = [];
    for (let i = 0; i < 4; i++) {
      this.ghostTrails.push({
        x: p.x - (dx / len) * (i * 0.4),
        y: p.y - (dy / len) * (i * 0.4),
        facing: p.facing,
        color: '#38bdf8',
        age: 0,
        duration: 0.35 + i * 0.08
      });
    }

    // 👥 그림자 분신 (Shadow Decoy) 소환 (0.2초 후 환영검무 광역 참격 자동 발동)
    this.spawnShadowDecoy(p.x, p.y, p.facing);
  }

  // 🧪 즉시 생명력 회복 물약 (Quick Health Potion - H키)
  useHealthPotion(p) {
    if (!p) p = this.spawnOrGetPlayer();
    if (p.potionCooldown > 0) {
      this.addFloatingText(p.x, p.y - 1.0, `⏳ 물약 쿨다운 (${p.potionCooldown.toFixed(1)}초)`, '#94a3b8', 0.8);
      return;
    }
    const potCount = p.inventory.potions || 0;
    if (potCount <= 0 && p.gold < 80) {
      this.addFloatingText(p.x, p.y - 1.0, '⚠️ 회복 물약이 부족합니다! (상점에서 80G로 구매 가능)', '#f87171', 1.4);
      return;
    }
    if (potCount > 0) {
      p.inventory.potions--;
    } else {
      p.gold -= 80;
    }
    p.potionCooldown = 3.5;
    const healAmount = Math.round(p.maxHp * 0.45 + 100);
    p.hp = Math.min(p.maxHp, p.hp + healAmount);
    if (typeof audioMgr !== 'undefined') audioMgr.playPotion();
    this.addEffect(p.x, p.y, 4.5, '#4ade80', 0.8);
    this.addHitSparks(p.x, p.y, '#86efac', 10);
    this.addFloatingText(p.x, p.y - 1.5, `🧪 생명력 회복! (+${healAmount} HP ❤️)`, '#4ade80', 2.0);
  }

  // 🌲 필드 지형/자원 노드 수동 채집 (나무 벌목 / 암석 채광)
  tryHarvestFieldObject(p) {
    const tx = Math.floor(p.x);
    const ty = Math.floor(p.y);
    const tile = this.world.getTile(tx, ty);

    // 인근 2.2타일 내 자원 노드 검사
    if (this.world.resourceNodes) {
      for (const node of this.world.resourceNodes) {
        if (Math.hypot(node.x - p.x, node.y - p.y) <= 2.4 && node.amount > 0) {
          node.amount--;
          node.shakeTimer = 0.35;
          const isTree = (node.type === 'tree');
          if (isTree) {
            this.spawnLootDrop(node.x, node.y, { itemType: 'wood', name: '단단한 통나무', icon: '🪵', resourceKey: 'wood', resourceCount: 1, exp: 25, color: '#84cc16' });
            this.addHitSparks(node.x, node.y, '#84cc16', 7);
          } else {
            this.spawnLootDrop(node.x, node.y, { itemType: 'ore', name: '반짝이는 광석', icon: '⛏️', resourceKey: 'ore', resourceCount: 1, exp: 25, color: '#facc15' });
            this.addHitSparks(node.x, node.y, '#facc15', 8);
          }
          return true;
        }
      }
    }

    // 일반 지형 타일 벌목/채광
    if (tile === TILE.FOREST || tile === TILE.AUTUMN_WOOD || tile === TILE.MEADOW) {
      this.spawnLootDrop(p.x, p.y, { itemType: 'wood', name: '원목 목재', icon: '🪵', resourceKey: 'wood', resourceCount: 1, exp: 15, color: '#84cc16' });
      this.addHitSparks(p.x, p.y, '#84cc16', 6);
      return true;
    } else if (tile === TILE.MOUNTAIN || tile === TILE.HILLS) {
      this.spawnLootDrop(p.x, p.y, { itemType: 'ore', name: '천연 암석 광석', icon: '⛏️', resourceKey: 'ore', resourceCount: 1, exp: 15, color: '#94a3b8' });
      this.addHitSparks(p.x, p.y, '#94a3b8', 6);
      return true;
    }
    return false;
  }

  // 🛡️ 방패 가드 & 퍼펙트 패링 시스템 (Shield Guard & Perfect Parry Riposte)
  playerPerformParry(p) {
    if (!p) p = this.spawnOrGetPlayer();

    // 이동 중일 경우 전방 돌진 방패 강타 (Shield Bash) 발동!
    if (Math.hypot(p.vx || 0, p.vy || 0) > 0.08) {
      return this.playerShieldBash(p);
    }

    if (p.parryCooldown > 0) {
      this.addFloatingText(p.x, p.y - 1.2, `🛡️ 패링 쿨다운 (${p.parryCooldown.toFixed(1)}s)`, '#94a3b8', 0.8);
      return false;
    }

    p.isParrying = true;
    // 수호 태세일 경우 패링 판정 시간을 0.35초로 대폭 완화!
    p.parryTimer = (p.combatStance === 'guardian') ? 0.35 : 0.22;
    p.parryCooldown = (p.combatStance === 'guardian') ? 1.2 : 1.6;
    p.shieldBlockTimer = 0.65;

    this.addSlashArc(p.x, p.y, 2.2, 0, Math.PI * 2, '#38bdf8', 0.22);
    this.addFloatingText(p.x, p.y - 1.2, p.combatStance === 'guardian' ? '🛡️ [수호 패링 가드] 판정 대폭 강화!' : '🛡️ 방패 가드 자세!', '#38bdf8', 0.8);
    if (typeof audioMgr !== 'undefined' && audioMgr.playShieldBlock) {
      audioMgr.playShieldBlock();
    }
    return true;
  }

  // ⚡ 퍼펙트 패링 성공: 공격자 2.4초 스턴 + 320% 크리티컬 리포스트 반격 버프 + 각성 게이지 +22%
  triggerPlayerParrySuccess(attacker) {
    const p = this.player;
    if (!p) return;

    p.isParrying = false;
    p.parryTimer = 0;
    p.riposteReady = true;
    p.riposteTimer = 4.5; // 4.5초간 반격 버프 유지
    p.awakeningGauge = Math.min(100, (p.awakeningGauge || 0) + 22.0);

    if (attacker) {
      attacker.stunTimer = 2.4;
      attacker.vx = 0;
      attacker.vy = 0;
      const kAng = Math.atan2(attacker.y - p.y, attacker.x - p.x);
      attacker.x += Math.cos(kAng) * 1.6;
      attacker.y += Math.sin(kAng) * 1.6;
      this.addFloatingText(attacker.x, attacker.y - 1.6, '💫 [STUNNED!] 2.4초 무방비', '#fde047', 2.0);
      this.addHitSparks(attacker.x, attacker.y, '#fde047', 12);
    }

    // 💥 [저스트 가드 반격 폭발] 주변 5타일 모든 적 광역 넉백 & 스턴
    const nearby = this.spatialGrid
      ? this.spatialGrid.query(p.x, p.y, 5.0, other => other !== p && other.hp > 0 && this.isHostile(p, other))
      : this.entities.filter(other => other !== p && other.hp > 0 && this.isHostile(p, other) && Math.hypot(other.x - p.x, other.y - p.y) <= 5.0);

    for (const ent of nearby) {
      if (ent !== attacker) {
        ent.stunTimer = 1.2;
        const eAng = Math.atan2(ent.y - p.y, ent.x - p.x);
        ent.x += Math.cos(eAng) * 1.8;
        ent.y += Math.sin(eAng) * 1.8;
      }
    }
    p.attackCooldown = 0; // 즉각 반격 태세 개방!

    this.addShockwave(p.x, p.y, 5.2, '#38bdf8', 0.6);
    this.addShockwave(p.x, p.y, 4.2, '#facc15', 0.55);
    this.addShockwave(p.x, p.y, 3.2, '#ffffff', 0.4);
    this.addHitSparks(p.x, p.y, '#ffffff', 22);
    this.addFloatingText(p.x, p.y - 2.0, `⚡ [PERFECT PARRY!] 320% 리포스트 반격! (각성 +22% -> ${Math.floor(p.awakeningGauge)}%)`, '#facc15', 2.2);

    if (this.camera) {
      this.camera.screenFreeze = 0.12;
      this.camera.shake = 11;
      this.camera.zoomPulse = 1.0;
    }
    if (window.renderer) {
      window.renderer.screenFlashTimer = 0.08;
      window.renderer.screenFlashColor = '#ffffff';
    }
  }

  // ⚔️ 3대 전투 태세 전환 시스템 (Combat Stance Switch: 맹공 / 수호 / 균형)
  playerToggleStance(p) {
    if (!p) p = this.spawnOrGetPlayer();
    if (!p.combatStance) p.combatStance = 'balanced';

    if (p.combatStance === 'balanced') {
      p.combatStance = 'berserk';
      this.addFloatingText(p.x, p.y - 1.8, '🔥 [맹공 태세!] 공격력+45%, 치명타+30% (피격+20%)', '#ef4444', 2.2);
      this.addShockwave(p.x, p.y, 4.2, '#ef4444', 0.4);
      this.addHitSparks(p.x, p.y, '#f97316', 14);
    } else if (p.combatStance === 'berserk') {
      p.combatStance = 'guardian';
      this.addFloatingText(p.x, p.y - 1.8, '🛡️ [수호 태세!] 받는피해-55%, 패링판정 대폭완화 (이동-15%)', '#38bdf8', 2.2);
      this.addShockwave(p.x, p.y, 4.2, '#38bdf8', 0.4);
      this.addHitSparks(p.x, p.y, '#38bdf8', 14);
    } else {
      p.combatStance = 'balanced';
      this.addFloatingText(p.x, p.y - 1.8, '⚡ [균형 태세!] 표준 밸런스 & 초당 지속회복 2배', '#facc15', 2.2);
      this.addShockwave(p.x, p.y, 4.2, '#facc15', 0.4);
      this.addHitSparks(p.x, p.y, '#fde047', 14);
    }

    if (typeof audioMgr !== 'undefined' && audioMgr.playSword) {
      audioMgr.playSword();
    }
    return p.combatStance;
  }

  // 💥 초필살기 궁극기: 신벌의 천벌 (Ultimate Limit Break: Heavenly Wrath)
  playerCastUltimate(p) {
    if (!p) p = this.spawnOrGetPlayer();
    if ((p.awakeningGauge || 0) < 100) {
      const cur = Math.floor(p.awakeningGauge || 0);
      this.addFloatingText(p.x, p.y - 1.2, `⚠️ 각성 게이지 충전 필요! (${cur}% / 100%)`, '#94a3b8', 1.0);
      return false;
    }

    p.awakeningGauge = 0;

    // 시네마틱 스크린 프리즈 & 번개 플래시
    if (this.camera) {
      this.camera.screenFreeze = 0.16;
      this.camera.shake = 26;
      this.camera.zoomPulse = 2.0;
    }
    if (window.renderer) {
      window.renderer.screenFlashTimer = 0.18;
      window.renderer.screenFlashColor = '#fef08a';
    }
    if (typeof audioMgr !== 'undefined') {
      if (audioMgr.playMagic) audioMgr.playMagic();
      if (audioMgr.playWhirlwind) audioMgr.playWhirlwind();
    }

    this.addFloatingText(p.x, p.y - 2.4, '💥 [신벌의 천벌! ULTIMATE WRATH!]', '#fde047', 3.0);
    this.addShockwave(p.x, p.y, 10.0, '#facc15', 0.9);
    this.addShockwave(p.x, p.y, 15.0, '#ffffff', 1.2);
    this.addHitSparks(p.x, p.y, '#ffffff', 40);

    // 7줄기의 거대한 신성 번개 기둥 & 운석 강타
    const hostiles = this.spatialGrid
      ? this.spatialGrid.query(p.x, p.y, 16.0, other => other !== p && other.hp > 0 && this.isHostile(p, other))
      : this.entities.filter(other => other !== p && other.hp > 0 && this.isHostile(p, other) && Math.hypot(other.x - p.x, other.y - p.y) <= 16.0);

    let killed = 0;
    for (const target of hostiles) {
      const dmg = Math.round(520 + Math.random() * 220);
      target.hp -= dmg;
      target.hitTimer = 0.45;
      target.stunTimer = 2.8;

      this.addSlashArc(target.x, target.y, 3.8, 0, Math.PI * 2, '#facc15', 0.4);
      this.addShockwave(target.x, target.y, 4.5, '#ef4444', 0.55);
      this.addHitSparks(target.x, target.y, '#facc15', 18);
      this.addBloodDecal(target.x, target.y, '#991b1b', 3.0, 6);
      this.addFloatingText(target.x, target.y - 1.2, `⚡-${dmg} [신벌]`, '#fde047', 1.8);

      if (target.hp <= 0) {
        killed++;
        p.kills = (p.kills || 0) + 1;
        this.gainPlayerExp(target.role === 'dragon' ? 240 : 100);
        this.spawnLootDrop(target.x, target.y, { itemType: 'gold', name: '골드 주머니', icon: '🪙', gold: (target.gold || 50) * 2, color: '#facc15' });
        this.spawnLootDrop(target.x + 0.3, target.y, { itemType: 'gem', name: '마정석', icon: '💎', resourceKey: 'gems', resourceCount: 2, color: '#c084fc' });
      }
    }

    this.log('battle', `💥 [초필살기] 영웅이 신벌의 천벌을 강림시켜 반경 적 ${hostiles.length}기에 파멸적 심판을 내렸습니다! (처치 ${killed}기)`, p.x, p.y);
    return true;
  }

  // 💀 적 처형 가능(Execution / Glory Kill) 상태 판정 (체력 22% 이하 엘리트/보스/강적)
  checkEnemyExecutable(e) {
    if (!e || e.faction !== 'monster' || e.hp <= 0 || !e.maxHp) return;
    if ((e.hp / e.maxHp) <= 0.22 && (e.isElite || e.isBoss || e.maxHp >= 100)) {
      e.canExecute = true;
    } else {
      e.canExecute = false;
    }
  }

  // 💀 인근 처형 대상 탐색 및 처형 트리거
  checkExecutionTrigger(p) {
    if (!p) p = this.spawnOrGetPlayer();
    const nearestExecutable = this.spatialGrid
      ? this.spatialGrid.findNearest(p.x, p.y, 4.2, other => other !== p && other.hp > 0 && other.canExecute && this.isHostile(p, other))
      : this.entities.find(other => other !== p && other.hp > 0 && other.canExecute && this.isHostile(p, other) && Math.hypot(other.x - p.x, other.y - p.y) <= 4.2);
    if (nearestExecutable) {
      this.executeEnemy(p, nearestExecutable);
      return true;
    }
    return false;
  }

  // ⚡ 시네마틱 일격처형 (Cinematic Execution Finisher)
  executeEnemy(p, target) {
    if (!target || target.hp <= 0) return;

    // 1. 적 전방으로 즉각 런지 질주
    const kAng = Math.atan2(target.y - p.y, target.x - p.x);
    p.x = target.x - Math.cos(kAng) * 0.9;
    p.y = target.y - Math.sin(kAng) * 0.9;
    p.facing = Math.cos(kAng) < 0 ? 'left' : 'right';
    p.attackAnimTimer = 0.35;
    p.isAttacking = true;

    // 2. 극적인 카메라 슬로우모션 프리즈 & 줌 쇼크
    if (this.camera) {
      this.camera.screenFreeze = 0.12;
      this.camera.shake = 18.0;
      this.camera.zoomPulse = 1.35;
      this.camera.cinematicBarsTimer = 0.85;
    }

    // 3. 거대 X자 크림슨 참격검기 & 피보라 파티클
    this.addSlashArc(target.x, target.y, 4.5, -Math.PI * 0.75, Math.PI * 0.75, '#dc2626', 0.45);
    this.addSlashArc(target.x, target.y, 4.5, Math.PI * 0.25, Math.PI * 1.25, '#f87171', 0.45);
    this.addShockwave(target.x, target.y, 5.0, '#ef4444', 0.6);
    this.addHitSparks(target.x, target.y, '#f87171', 28);
    this.addHitSparks(target.x, target.y, '#facc15', 20);
    this.addBloodDecal(target.x, target.y, '#991b1b', target.isBoss ? 4.8 : 3.0, 4);

    if (typeof audioMgr !== 'undefined') {
      audioMgr.playSword();
      audioMgr.playFanfare();
    }

    // 4. 즉사 치명타 및 대량 골드/EXP/각성 게이지 분출
    target.hp = 0;
    target.canExecute = false;
    p.kills = (p.kills || 0) + 1;
    const bonusGold = (target.isBoss ? 800 : (target.isElite ? 280 : 90));
    p.gold = (p.gold || 0) + bonusGold;
    p.awakeningGauge = Math.min(100, (p.awakeningGauge || 0) + 35); // 초필살기 게이지 35% 즉시 충전!
    this.gainPlayerExp(target.isBoss ? 350 : 120);

    this.spawnLootDrop(target.x, target.y, { itemType: 'gold', name: '처형 전리품', icon: '🪙', gold: bonusGold, color: '#facc15' });
    this.spawnLootDrop(target.x + 0.3, target.y, { itemType: 'gem', name: '영혼 파편', icon: '💎', resourceKey: 'gems', resourceCount: 3, color: '#c084fc' });

    this.addFloatingText(target.x, target.y - 1.5, `💀 EXECUTION! 처형 완료! (+${bonusGold}G)`, '#f87171', 2.5);
    this.log('battle', `⚔️ 플레이어가 [${target.name}]을(를) 화려한 처형 피니셔로 단칼에 베어 넘겼습니다! (+${bonusGold}G, 각성 게이지 +35%)`, target.x, target.y);

    if (this.questSystem && this.questSystem.onMonsterSlain) {
      this.questSystem.onMonsterSlain(target);
    }
  }

  // ⚡ 쾌도난마 대시 찌르기 (Dash Thrust Piercing Cleave - 회피 질주 중 공격 연계)
  playerPerformDashThrust(p, target) {
    if (!p) p = this.spawnOrGetPlayer();
    p.isDashing = false; // 대시 모멘텀을 찌르기로 전환
    p.isAttacking = true;
    p.attackAnimTimer = 0.32;
    p.attackCooldown = 0.38;

    let dirX = (p.dashVx && p.dashVx !== 0) ? Math.sign(p.dashVx) : (p.facing === 'left' ? -1 : (p.facing === 'right' ? 1 : 0));
    let dirY = (p.dashVy && p.dashVy !== 0) ? Math.sign(p.dashVy) : (p.facing === 'up' ? -1 : (p.facing === 'down' ? 1 : 0));
    if (dirX === 0 && dirY === 0) dirX = 1;
    const len = Math.hypot(dirX, dirY) || 1;
    const nx = dirX / len;
    const ny = dirY / len;
    const thrustAngle = Math.atan2(ny, nx);

    // 전방으로 추가 돌진
    p.x += nx * 1.35;
    p.y += ny * 1.35;

    if (typeof audioMgr !== 'undefined') audioMgr.playSword();
    this.addEffect(p.x, p.y, 3.2, '#38bdf8', 0.35);
    this.addShockwave(p.x, p.y, 3.5, '#38bdf8', 0.38);
    this.addSlashArc(p.x, p.y, 3.6, thrustAngle - 0.45, thrustAngle + 0.45, '#38bdf8', 0.28);
    this.addDustPuff(p.x, p.y, 6);
    this.addHitSparks(p.x + nx * 1.2, p.y + ny * 1.2, '#bae6fd', 14);

    if (this.camera) {
      this.camera.shake = 8.5;
      this.camera.zoomPulse = 0.6;
    }

    const thrustDist = 4.2;
    const thrustDmg = Math.round((p.atk || 25) * 2.45 * (1.1 + Math.random() * 0.25));

    // 직선 관통 경로상의 모든 적 타격 (Piercing Line Attack)
    const targets = this.spatialGrid
      ? this.spatialGrid.query(p.x, p.y, thrustDist, other => other !== p && other.hp > 0 && this.isHostile(p, other))
      : this.entities.filter(other => other !== p && other.hp > 0 && this.isHostile(p, other));

    for (const ent of targets) {
      const ex = ent.x - p.x;
      const ey = ent.y - p.y;
      const proj = ex * nx + ey * ny;
      if (proj >= -0.5 && proj <= thrustDist) {
        const perpDist = Math.abs(ex * (-ny) + ey * nx);
        if (perpDist <= 1.4) {
          ent.hp -= thrustDmg;
          ent.hitTimer = 0.32;
          this.checkEnemyExecutable(ent);
          ent.combatTarget = p;
          ent.x += nx * 1.2 + (-ny) * (Math.random() - 0.5) * 0.8;
          ent.y += ny * 1.2 + nx * (Math.random() - 0.5) * 0.8;
          this.addHitSparks(ent.x, ent.y, '#38bdf8', 10);
        }
      }
    }

    this.addFloatingText(p.x, p.y - 1.4, `⚡ [DASH THRUST!] -${thrustDmg} (쾌도 찌르기)`, '#38bdf8', 1.3);
    return true;
  }

  // ⚡ 공중 연격 & 투구 깨기 (Aerial Helm Breaker Downward Slam)
  playerPerformHelmBreaker(p, target) {
    if (!p) p = this.spawnOrGetPlayer();
    p.isAttacking = true;
    p.attackAnimTimer = 0.38;
    p.attackCooldown = 0.45;
    p.airborneTimer = 0.38;
    p.airborneHeight = 20;

    // 공중 도약 후 수직 파멸 강타
    const slamDmg = Math.round((p.atk || 25) * 2.85 * (1.1 + Math.random() * 0.25));
    target.airborneTimer = 0;
    target.airborneHeight = 0;
    target.hp -= slamDmg;
    target.hitTimer = 0.40;
    target.stunTimer = 1.6; // 지면에 처박히며 1.6초 무방비 기절

    // 지면 크레이터 균열 & 충격파 & 검기 파편 & 대지 단층
    this.addGroundFissure(target.x, target.y, 0, 3.4, '#ef4444');
    this.addGroundFissure(target.x, target.y, Math.PI * 0.5, 3.4, '#ef4444');
    this.addGroundFissure(target.x, target.y, Math.PI, 3.4, '#ef4444');
    this.addGroundFissure(target.x, target.y, -Math.PI * 0.5, 3.4, '#ef4444');
    this.addShockwave(target.x, target.y, 4.8, '#facc15', 0.55);
    this.addSlashArc(target.x, target.y, 3.5, -Math.PI * 0.5, Math.PI * 0.5, '#ffffff', 0.35);
    this.addHitSparks(target.x, target.y, '#fde047', 24);
    this.addBloodDecal(target.x, target.y, '#991b1b', 2.8, target.hp <= 0 ? 6 : 3);
    this.addFloatingText(target.x, target.y - 1.5, `⚡ [HELM BREAKER!] -${slamDmg} (투구깨기)`, '#fde047', 1.8);

    if (this.camera) {
      this.camera.shake = 18;
      this.camera.screenFreeze = 0.08;
      this.camera.zoomPulse = 1.25;
      this.camera.cinematicBarsTimer = 0.65;
    }
    if (window.renderer) {
      window.renderer.screenFlashTimer = 0.08;
      window.renderer.screenFlashColor = '#fef08a';
    }
    if (typeof audioMgr !== 'undefined') {
      audioMgr.playSword();
      audioMgr.playMeteor();
    }

    if (target.hp <= 0) {
      p.kills = (p.kills || 0) + 1;
      this.addDeadRemains(target.x, target.y, target.monsterType || target.role, target.scale);
      this.gainPlayerExp(target.role === 'dragon' ? 180 : 70);
      this.spawnLootDrop(target.x, target.y, { itemType: 'gold', name: '골드 주머니', icon: '🪙', gold: target.gold || 60, color: '#facc15' });
    }
    return true;
  }

  // ⚔️ 3단 연속 콤보 공격 시스템 (1타 신속베기 -> 2타 어퍼크로스 -> 3타 360도 회전베기 피니셔)
  playerPerformAttack(p, target = null) {
    if (!p) p = this.spawnOrGetPlayer();
    if (p.attackCooldown > 0) return;

    // 0순위: 인근 처형 가능 대상(canExecute)이 있을 시 즉시 일격처형(Glory Kill) 발동
    if (this.checkExecutionTrigger(p)) {
      return;
    }

    // 0.3순위: 대시 롤(회피) 중 공격 입력 시 쾌도난마 대시 찌르기 (Dash Thrust Piercing Cleave)
    if (p.isDashing) {
      return this.playerPerformDashThrust(p, target);
    }

    // 0.5순위: 대상이 공중에 떠있는 경우(Airborne) 즉시 공중 연격 헬름 브레이커 발동!
    if (target && target.airborneTimer > 0) {
      return this.playerPerformHelmBreaker(p, target);
    }

    const now = Date.now();
    if (!p.lastAttackTime || (now - p.lastAttackTime > 1150)) {
      p.comboStep = 1;
    } else {
      p.comboStep = (p.comboStep % 4) + 1;
    }
    p.lastAttackTime = now;
    p.isAttacking = true;
    p.attackAnimTimer = 0.28;

    // 타겟이 없으면 전방 또는 반경 4.8타일 내 가장 가까운 적 선별 (SpatialGrid로 O(1) 초고속 조회)
    if (!target) {
      target = this.spatialGrid
        ? this.spatialGrid.findNearest(p.x, p.y, 4.8, other => other !== p && other.hp > 0 && this.isHostile(p, other))
        : null;
    }
    const angle = target
      ? Math.atan2(target.y - p.y, target.x - p.x)
      : (p.facing === 'left' ? Math.PI : (p.facing === 'up' ? -Math.PI / 2 : (p.facing === 'down' ? Math.PI / 2 : 0)));

    let comboMultiplier = 1.0;
    let cdTime = 0.28;
    let effectColor = '#38bdf8';
    let comboText = '⚔️ 1타 [신속 쾌도 수평베기]';

    let justDodgeBonus = 1.0;
    if (p.justDodgeEmpowered) {
      justDodgeBonus = 2.0;
      p.justDodgeEmpowered = false;
      this.addFloatingText(p.x, p.y - 1.8, '⚡ [불릿 타임 카운터 일격! x2.0]', '#38bdf8', 2.0);
      this.addShockwave(p.x, p.y, 4.2, '#38bdf8', 0.4);
      if (window.renderer) {
        window.renderer.screenFlashTimer = 0.08;
        window.renderer.screenFlashColor = '#38bdf8';
      }
    }

    if (p.comboStep === 1) {
      comboMultiplier = 1.0;
      cdTime = 0.26;
      effectColor = '#38bdf8';
      comboText = '⚔️ 1타 [신속 쾌도 수평베기]';
      if (typeof audioMgr !== 'undefined') audioMgr.playSword();
      p.x += Math.cos(angle) * 0.22;
      p.y += Math.sin(angle) * 0.22;
      if (this.camera) {
        this.camera.shake = Math.min(6, (this.camera.shake || 0) + 2.5);
        this.camera.zoomPulse = 0.02;
      }
    } else if (p.comboStep === 2) {
      comboMultiplier = 1.45;
      cdTime = 0.30;
      effectColor = '#818cf8';
      comboText = '⚡ 2타 [대각 상승 뇌전베기!]';
      if (typeof audioMgr !== 'undefined') audioMgr.playSword();
      p.x += Math.cos(angle) * 0.35;
      p.y += Math.sin(angle) * 0.35;
      if (this.camera) {
        this.camera.shake = Math.min(10, (this.camera.shake || 0) + 5.0);
        this.camera.zoomPulse = 0.04;
      }
      if (target) {
        target.y -= 0.35; // 에어본 띄우기
        this.addHitSparks(target.x, target.y, '#818cf8', 10);
      }
    } else if (p.comboStep === 3) {
      comboMultiplier = 2.0;
      cdTime = 0.36;
      effectColor = '#facc15';
      comboText = '🌪️ 3타 [360도 대회전 회오리!]';
      if (typeof audioMgr !== 'undefined') audioMgr.playWhirlwind();
      this.addDustPuff(p.x, p.y, 8);
      if (this.camera) {
        this.camera.shake = Math.min(15, (this.camera.shake || 0) + 8.0);
        this.camera.zoomPulse = 0.06;
      }
    } else if (p.comboStep === 4) {
      comboMultiplier = 3.2;
      cdTime = 0.52;
      effectColor = '#ef4444';
      comboText = '☄️ 4타 궁극 피니셔 [극의: 유성 쌍룡 십자참격!]';
      if (typeof audioMgr !== 'undefined') {
        audioMgr.playWhirlwind();
        audioMgr.playSword();
      }
      p.x += Math.cos(angle) * 0.45;
      p.y += Math.sin(angle) * 0.45;
      this.addDustPuff(p.x, p.y, 14);
      this.addGroundFissure(p.x, p.y, angle - 0.45, 3.8, '#ef4444');
      this.addGroundFissure(p.x, p.y, angle + 0.45, 3.8, '#f59e0b');
      if (window.renderer) {
        window.renderer.screenFlashTimer = 0.10;
        window.renderer.screenFlashColor = '#fef08a';
      }
      if (this.camera) {
        this.camera.shake = Math.min(26, (this.camera.shake || 0) + 16);
        this.camera.zoomPulse = 0.10;
        this.camera.screenFreeze = 0.09;
        this.camera.cinematicBarsTimer = 0.45;
      }
    } else {
      if (typeof audioMgr !== 'undefined') audioMgr.playSword();
    }

    p.attackCooldown = cdTime;

    const slashX = p.x + Math.cos(angle) * 1.2;
    const slashY = p.y + Math.sin(angle) * 1.2;

    // ⚔️ 무기 궤적 슬래시 리본 아크
    const arcSpread = p.comboStep === 3 ? Math.PI * 2 : (p.comboStep === 2 ? 1.75 : 1.45);
    const arcStart = angle - arcSpread / 2;
    const arcEnd = angle + arcSpread / 2;
    this.addSlashArc(p.x, p.y, p.comboStep === 3 ? 3.8 : 2.4, arcStart, arcEnd, effectColor, 0.24);

    // ⚔️ [10.6] 2연격 이상 공격 또는 저스트 회피 카운터 시 전방으로 음속 픽셀 참격 검기(Sonic Crescent Blade Wave) 사출!
    if (p.comboStep >= 2 || justDodgeBonus > 1.0) {
      const isEmpowered = (p.comboStep === 3 || justDodgeBonus > 1.0);
      const waveSpeed = isEmpowered ? 20.0 : 15.0;
      const waveDmg = Math.round((p.atk || 25) * (isEmpowered ? 1.75 : 1.2) * (justDodgeBonus > 1.0 ? 1.35 : 1.0));
      this.projectiles.push({
        x: p.x + Math.cos(angle) * 1.1,
        y: p.y + Math.sin(angle) * 1.1,
        vx: Math.cos(angle) * waveSpeed,
        vy: Math.sin(angle) * waveSpeed,
        angle: angle,
        damage: waveDmg,
        pierce: isEmpowered ? 4 : 2,
        originX: p.x,
        originY: p.y,
        life: 0.75,
        isBladeWave: true,
        comboStep: p.comboStep,
        isEmpowered: isEmpowered,
        sender: p
      });
      this.addSlashArc(p.x + Math.cos(angle) * 0.8, p.y + Math.sin(angle) * 0.8, 2.6, angle - 0.7, angle + 0.7, isEmpowered ? '#fbbf24' : '#38bdf8', 0.22);
    }

    // 💥 3단계 피니셔: 주변 360도 모든 적 광역 타격 및 넉백
    if (p.comboStep === 3) {
      const hasSolar = this.rpgManager && this.rpgManager.hasTrait('solar_aura');
      const aoeRadius = hasSolar ? 6.2 : 4.2;
      this.addEffect(p.x, p.y, aoeRadius * 0.9, '#facc15', 0.45);
      this.addShockwave(p.x, p.y, aoeRadius, '#facc15', 0.55);
      if (this.rpgManager && this.rpgManager.awakening && this.rpgManager.awakening.id === 'blademaster') {
        this.addShockwave(p.x, p.y, aoeRadius * 1.35, '#f59e0b', 0.65);
        this.addFloatingText(p.x, p.y - 1.8, '⚔️ 소드마스터 삼단 십자검기 폭발!', '#f59e0b', 1.5);
      }
      if (this.camera) {
        this.camera.shake = Math.min(22, (this.camera.shake || 0) + 7.5);
        this.camera.screenFreeze = 0.065;
        this.camera.zoomPulse = 1.0;
      }

      const aoeTargets = this.spatialGrid
        ? this.spatialGrid.query(p.x, p.y, aoeRadius, other => other !== p && other.hp > 0 && this.isHostile(p, other))
        : this.entities.filter(other => other !== p && other.hp > 0 && this.isHostile(p, other) && Math.hypot(other.x - p.x, other.y - p.y) <= aoeRadius);

      let hits = 0;
      for (const ent of aoeTargets) {
        hits++;
        let mult = 1.0;
        if (this.rpgManager) mult = this.rpgManager.addCombo(1);
        const dmg = Math.round(p.atk * comboMultiplier * mult * justDodgeBonus * (1.1 + Math.random() * 0.3));
        const isCrit = (justDodgeBonus > 1.0) || Math.random() < 0.35;
        const finalDmg = isCrit ? Math.round(dmg * 1.5) : dmg;

        // 화염의 각인 특성
        if (this.rpgManager && this.rpgManager.hasTrait('flame_brand')) {
          ent.burningTimer = 4.0;
        }

        ent.hp -= finalDmg;
        ent.hitTimer = 0.28;
        this.checkEnemyExecutable(ent);
        ent.combatTarget = p;
        this.rallyNearbyAllies(ent, p, 11.0);

        // 넉백 & 벽쿵 충돌 판정 (Wall Slam Impact & Stun)
        const kAng = Math.atan2(ent.y - p.y, ent.x - p.x);
        this.applyKnockbackWithWallImpact(ent, Math.cos(kAng) * 2.2, Math.sin(kAng) * 2.2, finalDmg);

        this.addHitSparks(ent.x, ent.y, isCrit ? '#facc15' : '#f97316', 10);
        this.addDirectionalHitBurst(ent.x, ent.y, kAng, isCrit ? '#fde047' : '#f97316', isCrit ? 16 : 10);
        this.addFloatingText(ent.x, ent.y - 1.0, isCrit ? `💥 CRIT! -${finalDmg}` : `⚔️-${finalDmg}`, isCrit ? '#fde047' : '#f97316', 1.2);

        if (ent.hp <= 0) {
          p.kills = (p.kills || 0) + 1;
          this.addDeadRemains(ent.x, ent.y, ent.monsterType || ent.role, ent.scale);
          p.killstreak = (p.killstreak || 0) + 1;
          p.killstreakTimer = 5.5;
          if (p.killstreak === 3) {
            this.addFloatingText(p.x, p.y - 2.0, '🔥 TRIPLE KILL! (광폭화 발동)', '#f97316', 1.8);
          } else if (p.killstreak === 5) {
            this.addFloatingText(p.x, p.y - 2.2, '⚡ RAMPAGE! 광란의 연쇄 학살! (공속+35%)', '#facc15', 2.0);
          } else if (p.killstreak >= 8) {
            this.addFloatingText(p.x, p.y - 2.4, '👑 GODLIKE! 신의 경지 피버 돌입!', '#ef4444', 2.2);
          }
          this.gainPlayerExp(ent.role === 'dragon' ? 180 : 70);
          if (this.questSystem && this.questSystem.onMonsterSlain) {
            this.questSystem.onMonsterSlain(ent);
          }
          // 💎 물리 전리품 드롭
          this.spawnLootDrop(ent.x, ent.y, { itemType: 'gold', name: '골드 주머니', icon: '🪙', gold: ent.gold || 50, color: '#facc15' });
          if (ent.role === 'dragon') {
            this.spawnLootDrop(ent.x + 0.4, ent.y, { itemType: 'gem', name: '용의 마정석', icon: '💎', resourceKey: 'gems', resourceCount: 2, color: '#c084fc' });
            this.spawnLootDrop(ent.x - 0.4, ent.y, { itemType: 'potion', name: '영약', icon: '🧪', resourceKey: 'potions', resourceCount: 1, color: '#f43f5e' });
          } else if (Math.random() < 0.45) {
            this.spawnLootDrop(ent.x + 0.3, ent.y, { itemType: 'food', name: '야생 고기', icon: '🥩', resourceKey: 'food', resourceCount: 1, color: '#f87171' });
          }
        }
      }
      if (window.renderer) {
        window.renderer.screenFlashTimer = 0.08;
        window.renderer.screenFlashColor = '#fef08a';
      }
      this.addFloatingText(p.x, p.y - 1.8, `🔥 [피니셔 작렬!] (${hits}기 타격)`, '#facc15', 1.4);
      return;
    }

    // 1타 or 2타 단일/전방 타격
    this.addEffect(slashX, slashY, 2.4, effectColor, 0.3);

    if (target) {
      let comboMult = 1.0;
      if (this.rpgManager) {
        comboMult = this.rpgManager.addCombo(1);
      }

      let riposteMult = 1.0;
      if (p.riposteReady) {
        riposteMult = 3.6;
        p.riposteReady = false;
        p.riposteTimer = 0;
        this.addFloatingText(p.x, p.y - 1.8, '⚡ [CRITICAL RIPOSTE EXECUTION! x3.6]', '#fde047', 2.2);
        this.addShockwave(slashX, slashY, 5.5, '#ffffff', 0.50);
        this.addSlashArc(target.x, target.y, 4.2, -Math.PI * 0.75, Math.PI * 0.75, '#fde047', 0.45);
        this.addSlashArc(target.x, target.y, 4.2, Math.PI * 0.25, Math.PI * 1.25, '#ef4444', 0.45);
        this.addHitSparks(target.x, target.y, '#fde047', 24);
        this.addHitSparks(target.x, target.y, '#ef4444', 16);
        if (this.camera) {
          this.camera.screenFreeze = 0.12;
          this.camera.shake = 18;
          this.camera.zoomPulse = 1.35;
          this.camera.cinematicBarsTimer = 0.65;
        }
        if (typeof window !== 'undefined' && window.renderer) {
          window.renderer.screenFlashTimer = 0.08;
          window.renderer.screenFlashColor = '#ffffff';
        }
        if (typeof audioMgr !== 'undefined') {
          audioMgr.playSword();
          if (audioMgr.playFanfare) audioMgr.playFanfare();
        }
      }

      // ⚔️ 전투 태세에 따른 배율 적용 (Berserk: ATK+45%, Crit+30% / Guardian: ATK-10% / Balanced: 1.0)
      let stanceDmgMult = 1.0;
      let stanceCritBonus = 0;
      if (p.combatStance === 'berserk') {
        stanceDmgMult = 1.45;
        stanceCritBonus = 0.30;
      } else if (p.combatStance === 'guardian') {
        stanceDmgMult = 0.90;
      }

      const isCrit = (riposteMult > 1.0) || (justDodgeBonus > 1.0) || (Math.random() < (0.25 + stanceCritBonus));
      const baseDmg = Math.round(p.atk * comboMultiplier * comboMult * riposteMult * stanceDmgMult * justDodgeBonus * (1.0 + Math.random() * 0.3));
      const dmg = isCrit ? Math.round(baseDmg * 1.5) : baseDmg;

      // 💥 공격 적중 시 각성 게이지 축적 (+3.5%)
      p.awakeningGauge = Math.min(100, (p.awakeningGauge || 0) + 3.5);

      if (isCrit && window.renderer) {
        window.renderer.screenFlashTimer = 0.05;
        window.renderer.screenFlashColor = '#ffffff';
      }

      // 화염의 각인 특성
      if (this.rpgManager && this.rpgManager.hasTrait('flame_brand')) {
        target.burningTimer = 4.0;
      }

      target.hp -= dmg;
      target.hitTimer = 0.25;
      this.checkEnemyExecutable(target);

      // 🌀 2타 어퍼 크로스: 공중 띄우기 (Airborne Launch)
      if (p.comboStep === 2) {
        target.airborneHeight = 16 * (target.scale || 1.0);
        target.airborneTimer = 0.45;
        this.addFloatingText(target.x, target.y - 1.6, '🌀 AIRBORNE! 공중 띄우기!', '#38bdf8', 1.2);
      }

      // 🩸 다크 판타지 전투 혈흔 / 체액 지면 데칼 생성
      const bloodColor = (target.role === 'dragon' || (target.name && target.name.includes('용')) || target.monsterType === 'fire_drake') ? '#f97316'
        : (target.monsterType === 'kraken' || target.monsterType === 'abyss_witch') ? '#8b5cf6'
        : (target.race === 'orc' || target.monsterType === 'orc') ? '#15803d'
        : (target.monsterType === 'golem' || target.monsterType === 'skeleton') ? '#64748b'
        : '#dc2626';
      this.addBloodDecal(target.x, target.y, bloodColor, 2.2, target.hp <= 0 ? 6 : 2);

      this.addHitSparks(target.x, target.y, isCrit ? '#facc15' : effectColor, 8);
      if (this.camera) {
        this.camera.shake = Math.min(18, (this.camera.shake || 0) + (isCrit ? 6 : 3.5));
        if (isCrit || p.comboStage === 3) {
          this.camera.screenFreeze = 0.055;
          this.camera.zoomPulse = 1.0;
        }
      }

      target.combatTarget = p;
      this.rallyNearbyAllies(target, p, 11.0);

      // 넉백 & 벽쿵 충돌 판정 (Wall Slam Impact & Stun)
      const kAng = Math.atan2(target.y - p.y, target.x - p.x);
      const knockDist = p.comboStep === 2 ? 1.5 : 0.85;
      this.applyKnockbackWithWallImpact(target, Math.cos(kAng) * knockDist, Math.sin(kAng) * knockDist, dmg);
      this.addDirectionalHitBurst(target.x, target.y, kAng, isCrit ? '#fde047' : effectColor, isCrit ? 14 : 9);

      this.addFloatingText(target.x, target.y - 0.9, isCrit ? `💥 CRIT! -${dmg}` : `-${dmg}`, isCrit ? '#fde047' : effectColor, 1.0);

      // ⚡ 룬 인챈트 효과 발동
      this.triggerRuneProc(p, target, slashX, slashY, dmg);

      if (target.hp <= 0) {
        p.kills = (p.kills || 0) + 1;
        this.addDeadRemains(target.x, target.y, target.monsterType || target.role, target.scale);
        p.killstreak = (p.killstreak || 0) + 1;
        p.killstreakTimer = 5.5;
        if (p.killstreak === 3) {
          this.addFloatingText(p.x, p.y - 2.0, '🔥 TRIPLE KILL! (광폭화 발동)', '#f97316', 1.8);
        } else if (p.killstreak === 5) {
          this.addFloatingText(p.x, p.y - 2.2, '⚡ RAMPAGE! 광란의 연쇄 학살! (공속+35%)', '#facc15', 2.0);
        } else if (p.killstreak >= 8) {
          this.addFloatingText(p.x, p.y - 2.4, '👑 GODLIKE! 신의 경지 피버 돌입!', '#ef4444', 2.2);
        }
        this.gainPlayerExp(target.role === 'dragon' ? 180 : 70);
        if (this.rpgManager) this.rpgManager.addCombo(2);
        if (this.questSystem && this.questSystem.onMonsterSlain) {
          this.questSystem.onMonsterSlain(target);
        }
        if (this.rpgManager && this.rpgManager.checkDungeonBossDefeat) {
          this.rpgManager.checkDungeonBossDefeat(target);
        }
        if (this.rpgManager && this.rpgManager.checkColosseumProgress) {
          this.rpgManager.checkColosseumProgress(target);
        }
        if (this.rpgManager && this.rpgManager.checkBountyDefeat) {
          this.rpgManager.checkBountyDefeat(target);
        }
        // 💎 물리 전리품 드롭
        this.spawnLootDrop(target.x, target.y, { itemType: 'gold', name: '골드 주머니', icon: '🪙', gold: target.gold || 50, color: '#facc15' });
        if (target.role === 'dragon') {
          this.spawnLootDrop(target.x + 0.4, target.y, { itemType: 'gem', name: '용의 마정석', icon: '💎', resourceKey: 'gems', resourceCount: 2, color: '#c084fc' });
          this.spawnLootDrop(target.x - 0.4, target.y, { itemType: 'potion', name: '영약', icon: '🧪', resourceKey: 'potions', resourceCount: 1, color: '#f43f5e' });
        } else if (Math.random() < 0.45) {
          this.spawnLootDrop(target.x + 0.3, target.y, { itemType: 'food', name: '야생 고기', icon: '🥩', resourceKey: 'food', resourceCount: 1, color: '#f87171' });
        }
      }
    } else {
      // 적이 없으면 필드 채집 시도 (벌목/채광)
      const gathered = this.tryHarvestFieldObject(p);
      if (!gathered) {
        this.addFloatingText(slashX, slashY - 0.5, comboText, '#94a3b8', 0.6);
      }
    }
  }

  // ⚡ 무기 룬 인챈트 원소 발동 헬퍼 (Runestone Elemental Proc)
  triggerRuneProc(p, target, slashX, slashY, dmg) {
    if (!this.rpgManager || !this.rpgManager.enchantedRunes || !this.rpgManager.enchantedRunes.weapon) return;
    const rId = this.rpgManager.enchantedRunes.weapon;

    if (rId === 'rune_fulgur') {
      const chainTargets = this.spatialGrid
        ? this.spatialGrid.query(p.x, p.y, 6.0, ent => ent !== p && ent !== target && ent.hp > 0 && this.isHostile(p, ent)).slice(0, 3)
        : [];
      chainTargets.forEach(ct => {
        ct.hp -= 95;
        ct.hitTimer = 0.25;
        this.addEffect(ct.x, ct.y, 2.0, '#facc15', 0.25);
        this.addHitSparks(ct.x, ct.y, '#fef08a', 6);
        this.addFloatingText(ct.x, ct.y - 1.0, '⚡ 뇌전 -95', '#fde047', 1.0);
        if (ct.hp <= 0 && this.rpgManager.checkColosseumProgress) this.rpgManager.checkColosseumProgress(ct);
      });
    } else if (rId === 'rune_ignis') {
      if (target) {
        target.burningTimer = 4.0;
        this.addHitSparks(target.x, target.y, '#f97316', 8);
        this.addFloatingText(target.x, target.y - 1.4, '🔥 화염 폭발!', '#f97316', 1.0);
      }
    } else if (rId === 'rune_glacies') {
      if (target) {
        target.frozenTimer = 1.8;
        this.addHitSparks(target.x, target.y, '#38bdf8', 8);
        this.addFloatingText(target.x, target.y - 1.4, '❄️ 빙결!', '#38bdf8', 1.0);
      }
    } else if (rId === 'rune_terra') {
      const heal = Math.round(dmg * 0.18 + 14);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      this.addFloatingText(p.x, p.y - 1.4, `+${heal} HP 🌿 [흡혈]`, '#4ade80', 1.0);
    } else if (rId === 'rune_solaris') {
      this.addShockwave(slashX, slashY, 3.8, '#facc15', 0.35);
      this.addFloatingText(p.x, p.y - 1.4, '👑 태양의 섬광!', '#facc15', 1.0);
    }
  }

  // 🎯 특정 대상 공격 지명
  playerAttackTarget(target) {
    const p = this.spawnOrGetPlayer();
    if (!p || !target || target.hp <= 0) return;
    p.combatTarget = target;
    const d = Math.hypot(target.x - p.x, target.y - p.y);
    if (p.weaponMode === 'ranged') {
      if (d <= 18.0) {
        this.shootPlayerArrow(p, target.x, target.y);
        return;
      }
    }
    if (d <= 4.2) {
      this.playerPerformAttack(p, target);
    } else {
      p.targetX = target.x;
      p.targetY = target.y;
      this.addFloatingText(p.x, p.y - 1.1, `🎯 [${target.name}] 타겟 추격 돌격!`, '#f87171', 1.2);
    }
  }

  // 💬 인근 NPC 탐색 및 상호작용 트리거
  interactWithNearestNPC(p) {
    if (!p) p = this.spawnOrGetPlayer();
    const nearest = this.spatialGrid
      ? this.spatialGrid.findNearest(p.x, p.y, 4.2, other => other !== p && other.hp > 0 && other.faction === 'kingdom')
      : null;
    if (nearest) {
      this.interactWithNPC(p, nearest);
      return true;
    }
    return false;
  }

  // 🗣️ 직업/종족별 고유 상호작용 및 보답 시스템
  interactWithNPC(p, npc) {
    if (!p || !npc) return;
    const dx = p.x - npc.x;
    const dy = p.y - npc.y;
    if (Math.abs(dy) > Math.abs(dx)) {
      npc.facing = dy > 0 ? 'down' : 'up';
      p.facing = dy > 0 ? 'up' : 'down';
    } else {
      npc.facing = dx > 0 ? 'right' : 'left';
      p.facing = dx > 0 ? 'left' : 'right';
    }

    npc.talkingTimer = 4.5;
    this.addEffect(npc.x, npc.y, 4.0, '#38bdf8', 0.8);
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();

    if (npc.role === 'king') {
      const bounty = 600;
      p.gold += bounty;
      p.fame = (p.fame || 0) + 15;
      p.maxHp += 30;
      p.hp = p.maxHp;
      npc.thought = `👑 "대륙의 영웅이여! 왕실의 영광과 함께하길." (+${bounty}G, 명성+15)`;
      this.addFloatingText(npc.x, npc.y - 1.3, `👑 국왕의 칙령 포상 (+${bounty}G, 생명력+30)`, '#facc15', 2.2);
      this.log('event', `👑 [${npc.name}] 국왕이 플레이어에게 하사금 ${bounty}G와 왕실 칭호를 수여했습니다!`, npc.x, npc.y);
    } else if (npc.subClass && (npc.subClass.includes('사제') || npc.subClass.includes('성기사') || npc.subClass.includes('신관') || npc.role === 'priest')) {
      p.hp = p.maxHp;
      p.boostTimer = 18.0;
      npc.thought = `✨ "빛의 가호가 그대를 감싸 안을지어다." (체력 100% 완전 회복)`;
      this.addFloatingText(p.x, p.y - 1.3, '✨ 신성한 대치유! (HP 완전 회복 & 보호막)', '#38bdf8', 2.2);
      this.addEffect(p.x, p.y, 6.0, '#e0f2fe', 1.0);
    } else if (npc.role === 'blacksmith') {
      p.atk += 4;
      npc.thought = `⚒️ "크하하! 이 숫돌 맛을 보게나. 칼날이 바위도 베겠어!" (+4 영구 공격력)`;
      this.addFloatingText(p.x, p.y - 1.3, '⚒️ 드워프 명검 단조 (+4 영구 공격력 강화!)', '#fb923c', 2.2);
      this.addEffect(p.x, p.y, 4.0, '#f97316', 0.7);
    } else if (npc.role === 'adventurer' || npc.role === 'mercenary') {
      npc.guardTargetId = p.id;
      npc.thought = `🗡️ "대장! 당신의 칼이 되어 함께 싸우겠소!" (파티원 합류)`;
      this.addFloatingText(npc.x, npc.y - 1.3, `🤝 [${npc.name}] 파티 합류! (호위 및 공동 전투)`, '#a855f7', 2.2);
      this.log('event', `🤝 모험가 [${npc.name}]이(가) 플레이어의 파티원으로 합류하여 함께 전투에 나섭니다!`, npc.x, npc.y);
    } else if (npc.role === 'merchant' || npc.role === 'sea_merchant') {
      const tradeGain = 250 + (p.inventory.gems || 0) * 85 + (p.inventory.spices || 0) * 95;
      p.gold += tradeGain;
      p.inventory.gems = 0;
      p.inventory.spices = 0;
      p.inventory.wheat = (p.inventory.wheat || 0) + 3;
      npc.thought = `💰 "좋은 거래였습니다! 여행용 비상식량 3포대도 덤으로 드립니다." (+${tradeGain}G)`;
      this.addFloatingText(npc.x, npc.y - 1.3, `💰 상단 직거래 완료 (+${tradeGain}G & 비상식량)`, '#fde047', 2.2);
    } else if (npc.race === 'elf') {
      p.boostTimer = 25.0;
      p.speed = Math.min(2.5, p.speed * 1.15);
      npc.thought = `🌿 "바람의 정령이 당신의 발걸음에 날개를 달아줄 것입니다." (신속 비약)`;
      this.addFloatingText(p.x, p.y - 1.3, '🌿 요정의 신속 비약 활성화! (+이동속도 가속 25초)', '#4ade80', 2.2);
    } else if (npc.role === 'soldier' || npc.role === 'royal_guard') {
      p.gold += 80;
      npc.thought = `🛡️ "경례! 관할 구역 치안 이상 무! 전선 몬스터 토벌에 감사드립니다." (+80G)`;
      this.addFloatingText(npc.x, npc.y - 1.3, `🛡️ 수비대 전선 첩보 및 지원금 (+80G)`, '#60a5fa', 2.0);
    } else if (npc.role === 'bard' || (npc.subClass && npc.subClass.includes('바드')) || (npc.name && (npc.name.includes('바드') || npc.name.includes('음유시인')))) {
      if (this.rpgManager) {
        const bet = Math.min(30, Math.max(10, p.gold));
        if (p.gold >= 10) {
          this.rpgManager.playTavernDice(bet);
          npc.thought = `🎲 "하하! 주점 주사위 한 판 어떠신가? 운명의 여신을 시험해보게!"`;
        } else {
          npc.thought = `🍺 "판돈(10G)이 부족하구려! 주점의 에일 맥주 한 잔 마시며 쉬게나."`;
          p.hp = Math.min(p.maxHp, p.hp + 50);
          this.addFloatingText(p.x, p.y - 1.2, '🍺 에일 맥주 휴식 (HP +50)', '#fde047', 1.8);
        }
      }
    } else {
      p.hp = Math.min(p.maxHp, p.hp + 60);
      p.inventory.wheat = (p.inventory.wheat || 0) + 2;
      npc.thought = `🍞 "용사님! 늘 지켜주셔서 감사해요. 따뜻한 빵과 음료를 드세요."`;
      this.addFloatingText(p.x, p.y - 1.3, '🍞 주민의 따뜻한 보답 (체력 +60 회복 & 식량)', '#fcd34d', 2.0);
    }
  }

  // 🔥 인근 모닥불(Campfire) 탐색 및 휴식/요리
  checkNearbyCampfire(p) {
    if (!p) p = this.spawnOrGetPlayer();
    const px = Math.round(p.x);
    const py = Math.round(p.y);
    const w = this.world.width;
    const h = this.world.height;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = px + dx;
        const ty = py + dy;
        if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
          if (this.world.deco && this.world.deco[ty * w + tx] === 12) {
            if (this.rpgManager) {
              return this.rpgManager.interactCampfire(p);
            }
          }
        }
      }
    }
    return false;
  }

  interactWithNearestSettlement() {
    const p = this.spawnOrGetPlayer();
    let nearestTown = null;
    let minDist = 22;
    for (const s of this.world.settlements) {
      if (s.faction !== 'monster') {
        const d = Math.hypot(s.x - p.x, s.y - p.y);
        if (d < minDist) {
          minDist = d;
          nearestTown = s;
        }
      }
    }
    if (nearestTown) {
      if (typeof window.openTownDialogModal === 'function') {
        window.openTownDialogModal(nearestTown);
      } else {
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
      }
    } else {
      this.addFloatingText(p.x, p.y - 1.4, '⚠️ 인근 거점 도시나 항구 근처에서 상호작용 가능합니다', '#fca5a5', 1.4);
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
        { name: '오크 주술샤먼', race: 'orc', monsterType: 'orc_shaman', icon: '🔮', hp: 140, atk: 23, gold: 48, ranged: true, projColor: '#c084fc', scale: 1.05 }
      ],
      obsidian_necropolis: [
        { name: '망령 흑기사', race: 'undead', monsterType: 'reaper', icon: '💀', hp: 280, atk: 28, gold: 120, ranged: false, scale: 1.25 },
        { name: '해골 궁수', race: 'undead', monsterType: 'skeleton_archer', icon: '🏹', hp: 140, atk: 22, gold: 60, ranged: true, projColor: '#a855f7', scale: 1.05 },
        { name: '고대 스켈레톤 병사', race: 'undead', monsterType: 'skeleton', icon: '💀', hp: 160, atk: 20, gold: 50, ranged: false, scale: 1.1 },
        { name: '강령술 리치 군주', race: 'undead', monsterType: 'lich', icon: '👻', hp: 380, atk: 35, gold: 240, ranged: true, projColor: '#c084fc', scale: 1.4 }
      ],
      pyramid_tomb: [
        { name: '고대 파라오 미라', race: 'undead', monsterType: 'mummy', icon: '📜', hp: 250, atk: 25, gold: 110, scale: 1.15 },
        { name: '사막 맹독 전갈', race: 'monster', monsterType: 'scorpion', icon: '🦂', hp: 190, atk: 23, gold: 80, scale: 1.2 },
        { name: '사막 모래 리치', race: 'undead', monsterType: 'lich', icon: '👻', hp: 340, atk: 32, gold: 190, ranged: true, projColor: '#facc15', scale: 1.35 }
      ],
      glacier_camp: [
        { name: '혹한의 설원 예티', race: 'monster', monsterType: 'yeti', icon: '🦍', hp: 360, atk: 33, gold: 170, scale: 1.35 },
        { name: '만년설 얼음골렘', race: 'monster', monsterType: 'ice_golem', icon: '🧊', hp: 320, atk: 29, gold: 140, scale: 1.3 },
        { name: '은빛 서리 늑대', race: 'animal', monsterType: 'wolf_frost', icon: '🐺', hp: 160, atk: 22, gold: 65, scale: 1.05 }
      ],
      whispering_grove: [
        { name: '숲의 고대 거신 트렌트', race: 'monster', monsterType: 'treant', icon: '🌲', hp: 420, atk: 31, gold: 200, scale: 1.4 },
        { name: '폭풍 바람 하피', race: 'monster', monsterType: 'harpy', icon: '🦅', hp: 180, atk: 24, gold: 85, ranged: true, projColor: '#38bdf8', scale: 1.1 },
        { name: '원시림 맹독 슬라임', race: 'monster', monsterType: 'slime', icon: '🧪', hp: 130, atk: 18, gold: 40, scale: 1.0 }
      ],
      dragon_eyrie: [
        { name: '천공 화염 용족전사', race: 'dragonkin', monsterType: 'dragonkin', icon: '🐲', hp: 340, atk: 32, gold: 160, ranged: true, projColor: '#f97316', scale: 1.25 },
        { name: '지옥 헬하운드', race: 'monster', monsterType: 'hellhound', icon: '🐕‍🦺', hp: 220, atk: 27, gold: 95, scale: 1.1 },
        { name: '암벽 가고일', race: 'monster', monsterType: 'harpy', icon: '🗿', hp: 240, atk: 24, gold: 80, ranged: false, scale: 1.15 }
      ],
      pirate_cove: [
        { name: '블랙비어드 대해적 선장', race: 'human', monsterType: 'pirate_captain', icon: '🏴‍☠️', hp: 290, atk: 29, gold: 180, scale: 1.25 },
        { name: '바다 칼잡이 해적', race: 'human', monsterType: 'pirate_captain', icon: '⚔️', hp: 180, atk: 20, gold: 75, scale: 1.05 },
        { name: '해골단 쾌속약탈선', race: 'human', monsterType: 'pirate_raider', icon: '☠️', hp: 220, atk: 22, gold: 90, isShip: true, ranged: true, projColor: '#ef4444', scale: 1.25 }
      ],
      volcano_isle: [
        { name: '흑요석 화염골렘', race: 'monster', monsterType: 'fire_golem', icon: '🌋', hp: 350, atk: 33, gold: 160, isShip: false, scale: 1.4 },
        { name: '지옥 불꽃사냥개', race: 'monster', monsterType: 'hellhound', icon: '🐕‍🦺', hp: 230, atk: 28, gold: 100, scale: 1.15 },
        { name: '화염 용족 전사', race: 'dragonkin', monsterType: 'dragonkin', icon: '🐲', hp: 320, atk: 30, gold: 140, scale: 1.25 }
      ],
      molten_forge: [
        { name: '용암 거신 골렘', race: 'monster', monsterType: 'fire_golem', icon: '🌋', hp: 380, atk: 35, gold: 190, scale: 1.45 },
        { name: '불타는 지옥견', race: 'monster', monsterType: 'hellhound', icon: '🔥', hp: 240, atk: 29, gold: 110, scale: 1.15 }
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
      facing: opts.facing || 'down',
      hitTimer: 0,
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

    // 👹 정예 챔피언 몬스터 생성 (Elite Champion Monsters with Affixes)
    if ((ent.category === 'monster' || ent.role === 'monster') && !opts.isBoss && !opts.isBountyTarget && Math.random() < 0.25) {
      ent.isElite = true;
      const affixes = [
        { id: 'swift', label: '⚡[신속의]', speedMult: 1.45, atkMult: 1.15, aura: '#38bdf8' },
        { id: 'ironclad', label: '🛡️[철벽의]', hpMult: 2.2, aura: '#94a3b8' },
        { id: 'volatile', label: '💥[폭렬의]', hpMult: 1.35, onDeathExplode: true, aura: '#ef4444' },
        { id: 'glacial', label: '❄️[혹한의]', chills: true, hpMult: 1.45, aura: '#67e8f9' }
      ];
      const aff = affixes[Math.floor(Math.random() * affixes.length)];
      ent.eliteAffix = aff.id;
      ent.eliteLabel = aff.label;
      ent.eliteAura = aff.aura;
      ent.name = `${aff.label} ${ent.name}`;
      if (aff.speedMult) ent.speed *= aff.speedMult;
      if (aff.hpMult) {
        ent.maxHp = Math.round(ent.maxHp * aff.hpMult);
        ent.hp = ent.maxHp;
      }
      if (aff.atkMult) ent.atk = Math.round(ent.atk * aff.atkMult);
      ent.scale = (ent.scale || 1.0) * 1.25;
      ent.gold = Math.round((ent.gold || 50) * 2.8);
    }

    this.entities.push(ent);
    return ent;
  }

  rebuildSpatialGrid() {
    this.spatialGrid.clear();
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (ent.hp > 0) this.spatialGrid.insert(ent);
    }
  }

  update(dt, worldTime, playerInput) {
    const isNight = worldTime.hour >= 21 || worldTime.hour < 5;
    let battleCount = 0;

    // ⚡ 고성능 공간 그리드 재구축 (Spatial Grid Rebuild) - O(N) 1회 실행 (~0.5ms)
    this.simFrame = (this.simFrame || 0) + 1;
    this.rebuildSpatialGrid();

    const camX = this.camera ? this.camera.x : (this.player ? this.player.x : 480);
    const camY = this.camera ? this.camera.y : (this.player ? this.player.y : 300);
    const lodDist2 = 85 * 85;

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

    // 동적 월드 이벤트 로테이션
    this.worldEventTimer -= dt;
    if (this.worldEventTimer <= 0) {
      const curIdx = this.worldEvents.indexOf(this.activeWorldEvent);
      const nextIdx = (curIdx + 1) % this.worldEvents.length;
      this.activeWorldEvent = this.worldEvents[nextIdx];
      this.worldEventTimer = this.activeWorldEvent.duration;
      this.log('quest', `📢 [월드 이벤트] ${this.activeWorldEvent.title} 발령! ${this.activeWorldEvent.desc}`, this.player ? this.player.x : 200, this.player ? this.player.y : 150);
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    }

    // 자원 노드 리스폰 & 피격 흔들림 타이머 진행
    if (this.world.resourceNodes) {
      for (const node of this.world.resourceNodes) {
        if (node.shakeTimer > 0) node.shakeTimer -= dt;
        if (node.amount <= 0 && node.respawn > 0) {
          node.respawn -= dt;
          if (node.respawn <= 0) {
            node.amount = node.maxAmount || 5;
          }
        }
      }
    }

    // 펫 컴패니언 비행 추적 및 보물상자 오토루팅
    if (this.pet && this.pet.active && this.player) {
      const p = this.player;
      const angle = (Date.now() / 600) % (Math.PI * 2);
      this.pet.targetX = p.x + Math.cos(angle) * 1.8;
      this.pet.targetY = p.y + Math.sin(angle) * 1.8;
      const pdx = this.pet.targetX - this.pet.x;
      const pdy = this.pet.targetY - this.pet.y;
      this.pet.x += pdx * dt * 4.0;
      this.pet.y += pdy * dt * 4.0;

      // 펫 주변 보물상자 오토루팅
      if (this.rpgManager && this.rpgManager.treasureChests) {
        for (const chest of this.rpgManager.treasureChests) {
          if (!chest.opened && Math.hypot(chest.x - this.pet.x, chest.y - this.pet.y) < 2.8) {
            this.rpgManager.openTreasureChest(chest, p);
            this.addFloatingText(this.pet.x, this.pet.y - 1.0, '🐲 펫이 보물상자를 획득했습니다!', '#f472b6', 1.5);
          }
        }
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
      if (e.hitTimer > 0) e.hitTimer -= dt;
      if (e.stateTimer > 0) e.stateTimer -= dt;
      if (e.boostTimer > 0) e.boostTimer -= dt;
      if (e.talkingTimer > 0) e.talkingTimer -= dt;
      if (e.satiatedTimer > 0) e.satiatedTimer -= dt;

      // 🔥 상태이상: 화상 (Burning)
      if (e.burningTimer > 0) {
        e.burningTimer -= dt;
        e.burnTick = (e.burnTick || 0) + dt;
        if (e.burnTick >= 0.5) {
          e.burnTick = 0;
          const burnDmg = Math.max(6, Math.round(e.maxHp * 0.025 + 8));
          e.hp -= burnDmg;
          e.hitTimer = 0.22;
          this.addFloatingText(e.x, e.y - 0.9, `🔥-${burnDmg}`, '#f97316', 0.8);
          this.addHitSparks(e.x, e.y, '#f97316', 4);
        }
      }

      // ❄️ 상태이상: 빙결 (Frozen)
      if (e.frozenTimer > 0) {
        e.frozenTimer -= dt;
        e.vx = 0;
        e.vy = 0;
        continue;
      }

      // 💫 상태이상: 기절 (Stun)
      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        e.vx = 0;
        e.vy = 0;
        continue;
      }

      // 🔥 보스 & 고대 드래곤 광폭화 모드 (Boss Enrage Mode at HP <= 35%)
      if ((e.isBoss || e.role === 'dragon' || e.isBountyTarget) && e.hp > 0) {
        if (!e.isEnraged && e.hp <= e.maxHp * 0.35) {
          e.isEnraged = true;
          e.atk = Math.round(e.atk * 1.35);
          e.speed = (e.speed || 1.6) * 1.25;
          this.addFloatingText(e.x, e.y - 2.2, `🔥 [광폭화/ENRAGED!] 공격력 +35%, 폭주!`, '#ef4444', 3.0);
          this.addShockwave(e.x, e.y, 6.0, '#ef4444', 0.8);
          this.addHitSparks(e.x, e.y, '#f97316', 16);
          const nearPlayer = this.player && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 35;
          if (nearPlayer) {
            if (this.camera) {
              this.camera.shake = 16;
              this.camera.screenFreeze = 0.08;
            }
            if (window.renderer) {
              window.renderer.screenFlashTimer = 0.12;
              window.renderer.screenFlashColor = '#ef4444';
            }
          }
        }
        if (e.isEnraged && Math.random() < 0.22) {
          this.sparkParticles.push({
            x: e.x + (Math.random() - 0.5) * 1.8,
            y: e.y + (Math.random() - 0.5) * 1.8,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -2.0 - Math.random() * 2.0,
            color: Math.random() < 0.5 ? '#ef4444' : '#f97316',
            size: 2.5,
            age: 0,
            duration: 0.45
          });
        }
      }

      if (!e.combatTarget && e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + dt * 3.0);
      }

      // ⚡ 3단계 시뮬레이션 LOD (3-Tier Simulation Level of Detail)
      // 근거리(<=55타일): 매 프레임 / 중거리(<=150타일): 4프레임당 1회 / 원거리(>150타일): 16프레임당 1회 연산
      let stepDt = dt;
      if (e.role !== 'player' && !e.isBoss) {
        const d2 = (e.x - camX) * (e.x - camX) + (e.y - camY) * (e.y - camY);
        if (d2 > 22500) { // > 150 tiles
          if (((i + this.simFrame) & 15) !== 0) continue;
          stepDt = Math.min(0.25, dt * 16);
        } else if (d2 > 3025) { // > 55 tiles
          if (((i + this.simFrame) & 3) !== 0) continue;
          stepDt = Math.min(0.10, dt * 4);
        }
      }

      // 플레이어 조작
      if (e.role === 'player') {
        this.updatePlayerControl(e, dt, playerInput);
        continue;
      }

      // 🐾 야생 동물 AI
      if (e.role === 'animal') {
        this.updateAnimalAI(e, stepDt);
        this.moveTowardTarget(e, stepDt);
        continue;
      }

      // 🐉 고대 드래곤 AI
      if (e.role === 'dragon') {
        this.updateDragonAI(e, stepDt);
        this.moveTowardTarget(e, stepDt);
        continue;
      }

      // 전투 감지
      const engaged = this.checkAndRunCombat(e, stepDt);
      if (engaged) {
        battleCount++;
        continue;
      }

      // 직업별 AI
      switch (e.role) {
        case 'king':
          this.updateKingAI(e, stepDt, isNight);
          break;
        case 'royal_guard':
        case 'soldier':
          this.updateSoldierAI(e, stepDt, isNight);
          break;
        case 'navy':
          this.updateNavyAI(e, stepDt);
          break;
        case 'farmer':
          this.updateFarmerAI(e, stepDt, isNight);
          break;
        case 'fisherman':
          this.updateFishermanAI(e, stepDt, isNight);
          break;
        case 'miner':
          this.updateMinerAI(e, stepDt, isNight);
          break;
        case 'blacksmith':
          this.updateBlacksmithAI(e, stepDt, isNight);
          break;
        case 'merchant':
          this.updateMerchantAI(e, stepDt, isNight);
          break;
        case 'sea_merchant':
          this.updateSeaMerchantAI(e, stepDt);
          break;
        case 'mercenary':
        case 'adventurer':
          this.updateAdventurerAI(e, stepDt, isNight);
          break;
        case 'monster':
          this.updateMonsterAI(e, stepDt, isNight);
          break;
      }

      if (e.airborneTimer > 0) {
        e.airborneTimer -= dt;
        e.airborneHeight = Math.max(0, (e.airborneTimer / 0.45) * 16 * (e.scale || 1.0));
        if (e.airborneTimer <= 0) e.airborneHeight = 0;
      }

      this.moveTowardTarget(e, stepDt);
    }

    this.activeBattles = Math.ceil(battleCount / 2);

    // 💬 왕국 주민/병사/모험가 간 자연스러운 소셜 대화 & 경례 인터랙션 주기적 체크
    this.npcSocialTimer = (this.npcSocialTimer || 0) + dt;
    if (this.npcSocialTimer >= 1.6) {
      this.npcSocialTimer = 0;
      this.checkNPCSocialInteractions();
    }

    // 🎵 상황 적응형 다이내믹 BGM (전투 vs 평화 테마)
    this.bgmCheckTimer = (this.bgmCheckTimer || 0) + dt;
    if (this.bgmCheckTimer >= 0.8) {
      this.bgmCheckTimer = 0;
      if (typeof audioMgr !== 'undefined') {
        const p = this.player;
        const inBattle = p && (p.state === 'combat' || (p.combatTarget && p.combatTarget.hp > 0));
        audioMgr.setBGMMood(inBattle ? 'battle' : 'peaceful');
      }
    }

    // 투사체 업데이트 및 관통 화살 충돌 판정
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // 🛡️ 적 투사체에 대한 플레이어 상호작용 (패링 튕겨내기 / 회피 / 피격)
      if (this.player && p.sender !== this.player && p.life > 0) {
        const distToPlayer = Math.hypot(p.x - this.player.x, p.y - this.player.y);

        // 🛡️ [투사체 튕겨내기 패링 물리 - Deflect Parrying]
        if (distToPlayer <= 1.4 && this.player.isParrying && this.player.parryTimer > 0) {
          p.sender = this.player;
          p.isDeflected = true;
          p.isArrow = true;
          p.vx = -p.vx * 1.8;
          p.vy = -p.vy * 1.8;
          p.angle = Math.atan2(p.vy, p.vx);
          p.originX = this.player.x;
          p.originY = this.player.y;
          p.damage = Math.round((this.player.atk || 30) * 2.5);
          p.life = 2.4;
          p.hitList = new Set();
          p.color = '#38bdf8';

          if (typeof audioMgr !== 'undefined') {
            audioMgr.playParry();
            audioMgr.playHit();
          }
          this.addShockwave(p.x, p.y, 3.2, '#38bdf8', 0.35);
          this.addHitSparks(p.x, p.y, '#fde047', 18);
          this.addFloatingText(this.player.x, this.player.y - 1.4, '🛡️⚡ REFLECT PARRY! (x2.5)', '#fde047', 1.6);
          if (this.camera) this.camera.shake = Math.min(18, (this.camera.shake || 0) + 6.0);
          this.player.awakeningGauge = Math.min(100, (this.player.awakeningGauge || 0) + 15.0);
          continue;
        }

        // 패링되지 않고 플레이어에게 직격한 적 투사체
        if (distToPlayer <= 0.65) {
          if (this.player.invulnerable || this.player.isDashing) {
            this.addFloatingText(this.player.x, this.player.y - 1.0, '💨 DODGE!', '#38bdf8', 0.8);
          } else {
            let dmg = p.damage || Math.round(15 + Math.random() * 12);
            if (this.player.combatStance === 'guardian') {
              dmg = Math.max(1, Math.round(dmg * 0.45));
            }
            if (this.player.shieldBlockTimer > 0) {
              dmg = Math.max(1, Math.round(dmg * 0.30));
              this.addFloatingText(this.player.x, this.player.y - 1.2, '🛡️ [방패 가드 -70%]', '#38bdf8', 1.0);
            }
            this.player.hp = Math.max(0, this.player.hp - dmg);
            this.player.hitTimer = 0.25;
            this.addFloatingText(this.player.x, this.player.y - 0.8, `💥-${dmg}`, '#ef4444', 1.0);
            this.addHitSparks(this.player.x, this.player.y, '#ef4444', 8);
            if (this.camera) this.camera.shake = Math.min(14, (this.camera.shake || 0) + 3.5);
          }
          p.life = 0;
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // 🏹 화살 / ⚔️ 음속 픽셀 검기(Blade Wave) 충돌 판정
      if ((p.isArrow || p.isBladeWave) && p.life > 0) {
        const hitRadius = p.isBladeWave ? 1.4 : 0.95;
        const hits = this.spatialGrid
          ? this.spatialGrid.query(p.x, p.y, hitRadius, e => e !== p.sender && (e.faction === 'monster' || e.role === 'dragon' || e.isHostile) && e.hp > 0)
          : this.entities.filter(e => e !== p.sender && (e.faction === 'monster' || e.role === 'dragon') && e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) <= hitRadius);

        p.hitList = p.hitList || new Set();
        for (const ent of hits) {
          if (p.hitList.has(ent)) continue;
          p.hitList.add(ent);

          let finalDmg = p.damage;
          const kAng = p.angle || Math.atan2(p.vy, p.vx);

          if (p.isBladeWave) {
            ent.hp -= finalDmg;
            ent.hitTimer = 0.30;
            ent.combatTarget = p.sender || this.player;

            // 넉백 및 벽 충돌 물리 적용
            const knockDist = p.isEmpowered ? 1.8 : 1.2;
            this.applyKnockbackWithWallImpact(ent, Math.cos(kAng) * knockDist, Math.sin(kAng) * knockDist, finalDmg);

            // 검기 충돌 시각 효과
            const waveCol = p.isEmpowered ? '#fbbf24' : '#38bdf8';
            this.addFloatingText(ent.x, ent.y - 1.0, p.isEmpowered ? `⚡ 황금 대검기! -${finalDmg}` : `⚔️ 검기 참격 -${finalDmg}`, waveCol, 1.2);
            this.addHitSparks(ent.x, ent.y, waveCol, p.isEmpowered ? 16 : 10);
            this.addShockwave(ent.x, ent.y, p.isEmpowered ? 3.2 : 2.0, waveCol, 0.35);
            if (this.camera) this.camera.shake = Math.min(16, (this.camera.shake || 0) + (p.isEmpowered ? 6 : 3.5));
            if (typeof audioMgr !== 'undefined' && audioMgr.playSword) audioMgr.playSword();
          } else {
            // 사거리 6.5타일 이상에서 적중 시 🎯 SNIPER CRIT (2.2배 대미지)
            const distFromOrigin = Math.hypot(p.x - p.originX, p.y - p.originY);
            const isSniperCrit = distFromOrigin >= 6.5;
            finalDmg = isSniperCrit ? Math.round(p.damage * 2.2) : p.damage;

            ent.hp -= finalDmg;
            ent.hitTimer = 0.28;
            ent.combatTarget = p.sender || this.player;

            // 넉백 (벽쿵 적용)
            const knockDist = isSniperCrit ? 1.2 : 0.6;
            this.applyKnockbackWithWallImpact(ent, Math.cos(kAng) * knockDist, Math.sin(kAng) * knockDist, finalDmg);

            // 이펙트 및 플로팅 텍스트
            if (isSniperCrit) {
              this.addFloatingText(ent.x, ent.y - 1.2, `🎯 SNIPER CRIT! x2.2 -${finalDmg}`, '#fde047', 1.5);
              this.addHitSparks(ent.x, ent.y, '#facc15', 16);
              this.addShockwave(ent.x, ent.y, 2.8, '#facc15', 0.3);
              if (this.camera) this.camera.shake = Math.min(15, (this.camera.shake || 0) + 4.5);
            } else {
              this.addFloatingText(ent.x, ent.y - 0.9, `🏹 -${finalDmg}`, '#38bdf8', 1.0);
              this.addHitSparks(ent.x, ent.y, '#38bdf8', 8);
            }
          }
          this.addBloodDecal(ent.x, ent.y, '#dc2626', 1.8, ent.hp <= 0 ? 5 : 2);

          // 사망 처리
          if (ent.hp <= 0 && p.sender && p.sender.role === 'player') {
            const player = p.sender;
            player.kills = (player.kills || 0) + 1;
            this.addDeadRemains(ent.x, ent.y, ent.monsterType || ent.role, ent.scale);
            player.killstreak = (player.killstreak || 0) + 1;
            player.killstreakTimer = 5.5;
            this.gainPlayerExp(ent.role === 'dragon' ? 180 : 70);
            if (this.questSystem && this.questSystem.onMonsterSlain) {
              this.questSystem.onMonsterSlain(ent);
            }
            this.spawnLootDrop(ent.x, ent.y, { itemType: 'gold', name: '골드 주머니', icon: '🪙', gold: ent.gold || 50, color: '#facc15' });
          }

          p.pierce = (p.pierce || 1) - 1;
          if (p.pierce <= 0) {
            p.life = 0;
            break;
          }
        }
      }

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

    // 💥 방사형 충격파 (Expanding Radial Shockwaves) 업데이트
    if (this.shockwaves && this.shockwaves.length > 0) {
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.age += dt;
        if (sw.age >= sw.duration) this.shockwaves.splice(i, 1);
      }
    }

    // ⚔️ 무기 궤적 슬래시 리본 아크 업데이트
    if (this.slashArcs && this.slashArcs.length > 0) {
      for (let i = this.slashArcs.length - 1; i >= 0; i--) {
        const arc = this.slashArcs[i];
        arc.age += dt;
        if (arc.age >= arc.duration) this.slashArcs.splice(i, 1);
      }
    }

    // 💥 픽셀 히트 스파크 & 스타버스트 파티클 업데이트
    if (this.sparkParticles) {
      for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
        const sp = this.sparkParticles[i];
        sp.age += dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += dt * 3.5; // 미세 중력 가속도
        if (sp.age >= sp.duration) this.sparkParticles.splice(i, 1);
      }
    }

    // 🌿 픽셀 풀잎 잔디 파티클 (Grass Debris) 업데이트
    if (this.grassLeaves) {
      for (let i = this.grassLeaves.length - 1; i >= 0; i--) {
        const gl = this.grassLeaves[i];
        gl.age += dt;
        gl.x += gl.vx * dt;
        gl.y += gl.vy * dt;
        gl.vy += dt * 2.2;
        if (gl.age >= gl.duration) this.grassLeaves.splice(i, 1);
      }
    }

    // 💨 회피 롤 모래먼지 (Dust Puffs) 업데이트
    if (this.dustPuffs) {
      for (let i = this.dustPuffs.length - 1; i >= 0; i--) {
        const dp = this.dustPuffs[i];
        dp.age += dt;
        dp.x += dp.vx * dt;
        dp.y += dp.vy * dt;
        dp.size += dt * 3.5;
        if (dp.age >= dp.duration) this.dustPuffs.splice(i, 1);
      }
    }

    // 🌊 수면 파문 링 (Water Wading Ripples) 업데이트
    if (this.waterRipples) {
      for (let i = this.waterRipples.length - 1; i >= 0; i--) {
        const wr = this.waterRipples[i];
        wr.age += dt;
        wr.radius += dt * 14;
        if (wr.age >= wr.duration) this.waterRipples.splice(i, 1);
      }
    }

    // 💨 대시 잔상 (Dash Ghost Trails) 업데이트
    if (this.ghostTrails) {
      for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
        const gt = this.ghostTrails[i];
        gt.age += dt;
        if (gt.age >= gt.duration) this.ghostTrails.splice(i, 1);
      }
    }

    // 👥 그림자 분신 (Shadow Decoy) 업데이트 & 환영검무 참격 (Shadow Cleave)
    if (this.shadowDecoys && this.shadowDecoys.length > 0) {
      for (let i = this.shadowDecoys.length - 1; i >= 0; i--) {
        const sd = this.shadowDecoys[i];
        sd.age += dt;
        if (!sd.slashed && sd.age >= 0.20) {
          sd.slashed = true;
          if (typeof audioMgr !== 'undefined') audioMgr.playWhirlwind();
          this.addShockwave(sd.x, sd.y, 2.6, '#c084fc', 0.32);
          this.addHitSparks(sd.x, sd.y, '#e879f9', 14);
          this.addFloatingText(sd.x, sd.y - 1.2, '👥 SHADOW CLEAVE! x1.4', '#c084fc', 1.3);

          const dmg = Math.round((this.player ? this.player.atk : 25) * 1.4);
          const enemies = this.spatialGrid
            ? this.spatialGrid.query(sd.x, sd.y, 2.2, e => (e.faction === 'monster' || e.role === 'dragon' || e.isHostile) && e.hp > 0)
            : this.entities.filter(e => (e.faction === 'monster' || e.role === 'dragon') && e.hp > 0 && Math.hypot(e.x - sd.x, e.y - sd.y) <= 2.2);

          for (const ent of enemies) {
            ent.hp -= dmg;
            ent.hitTimer = 0.28;
            ent.combatTarget = this.player;
            this.addFloatingText(ent.x, ent.y - 0.8, `🗡️-${dmg}`, '#c084fc', 1.0);
            this.addHitSparks(ent.x, ent.y, '#c084fc', 8);
            this.addBloodDecal(ent.x, ent.y, '#dc2626', 1.5, 2);
            if (ent.hp <= 0 && this.player) {
              this.player.kills = (this.player.kills || 0) + 1;
              this.addDeadRemains(ent.x, ent.y, ent.monsterType || ent.role, ent.scale);
              this.gainPlayerExp(ent.role === 'dragon' ? 180 : 70);
              this.spawnLootDrop(ent.x, ent.y, { itemType: 'gold', name: '골드 주머니', icon: '🪙', gold: ent.gold || 50, color: '#facc15' });
            }
          }
        }
        if (sd.age >= sd.duration) {
          this.shadowDecoys.splice(i, 1);
        }
      }
    }

    // 💀 영구 지속 유골 잔해 데칼 업데이트
    if (this.deadRemains) {
      for (let i = this.deadRemains.length - 1; i >= 0; i--) {
        const dr = this.deadRemains[i];
        dr.age += dt;
        if (dr.age >= dr.duration) this.deadRemains.splice(i, 1);
      }
    }

    // ✨ 야간 발광 반딧불이 군집 업데이트 (플레이어 주변 부드러운 순환)
    if (this.fireflies) {
      const p = this.player;
      const refX = p ? p.x : 1920;
      const refY = p ? p.y : 1200;
      for (let i = 0; i < this.fireflies.length; i++) {
        const ff = this.fireflies[i];
        ff.x += ff.vx * dt;
        ff.y += ff.vy * dt;
        if (ff.x - refX > 40) ff.x = refX - 40;
        else if (ff.x - refX < -40) ff.x = refX + 40;
        if (ff.y - refY > 28) ff.y = refY - 28;
        else if (ff.y - refY < -28) ff.y = refY + 28;
      }
    }

    // 💎 필드 전리품 물리 & 자석 흡수 (Vacuum Magnet Pickup)
    if (this.droppedLoot) {
      const p = this.player;
      for (let i = this.droppedLoot.length - 1; i >= 0; i--) {
        const item = this.droppedLoot[i];
        item.age += dt;

        // 바운스 물리
        if (item.vy < 3.0) {
          item.vy += dt * 7.5;
          item.bounceY += item.vy * dt * 4.0;
          if (item.bounceY >= 0) {
            item.bounceY = 0;
            item.vy = 0;
            item.vx *= 0.5;
          }
        }

        // 플레이어 자석 흡수 (반경 3.4타일 내 진입 시 플레이어로 고속 이동)
        if (p) {
          const dx = p.x - item.x;
          const dy = p.y - item.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 3.4) {
            const pullSpeed = (12.0 / Math.max(0.4, dist)) * dt;
            item.x += (dx / dist) * Math.min(dist, pullSpeed);
            item.y += (dy / dist) * Math.min(dist, pullSpeed);

            // 흡수 완료
            if (dist < 0.65) {
              if (item.gold > 0) {
                p.gold += item.gold;
                if (typeof audioMgr !== 'undefined') audioMgr.playCoin();
                this.addFloatingText(p.x, p.y - 1.2, `+${item.gold}G 🪙`, '#fde047', 1.0);
              }
              if (item.exp > 0) {
                this.gainPlayerExp(item.exp);
              }
              if (item.resourceKey) {
                p.inventory[item.resourceKey] = (p.inventory[item.resourceKey] || 0) + (item.resourceCount || 1);
                this.addFloatingText(p.x, p.y - 1.2, `${item.icon} +${item.resourceCount || 1} ${item.name}`, '#4ade80', 1.2);
                if (typeof audioMgr !== 'undefined') audioMgr.playCoin();
              }
              this.addHitSparks(item.x, item.y, item.color, 6);
              this.droppedLoot.splice(i, 1);
              continue;
            }
          }
        }

        if (item.age >= item.duration) {
          this.droppedLoot.splice(i, 1);
        }
      }
    }

    // ⚠️ 보스 공격 위험 장판 (Hazard Zones) 업데이트 및 기폭
    if (this.hazardZones) {
      const p = this.player;
      for (let i = this.hazardZones.length - 1; i >= 0; i--) {
        const hz = this.hazardZones[i];
        hz.timer -= dt;
        if (hz.timer <= 0) {
          // 기폭! (Detonation)
          this.addEffect(hz.x, hz.y, hz.radius * 1.2, hz.color, 0.7);
          this.addHitSparks(hz.x, hz.y, hz.color, 14);
          const distToPlayer = p ? Math.hypot(p.x - hz.x, p.y - hz.y) : 999;
          if (distToPlayer < 28) {
            if (typeof audioMgr !== 'undefined') audioMgr.playMeteor();
            if (this.camera) this.camera.shake = Math.min(22, (this.camera.shake || 0) + 9);
          }

          // 범위 내 플레이어 및 아군 피해 (닷지 롤 무적 상태면 회피!)
          if (p && distToPlayer <= hz.radius) {
            if (p.invulnerable || p.isDashing) {
              this.triggerWitchTime(1.0, 0.22);
              p.awakeningGauge = Math.min(100, (p.awakeningGauge || 0) + 30);
              p.attackCooldown = 0;
              p.justDodgeEmpowered = true; // 다음 공격 치명타 확정 & 참격파 강화
              this.addFloatingText(p.x, p.y - 1.6, '⚡ [JUST DODGE!] 초감각 불릿 타임 (공격 즉시 리셋!)', '#38bdf8', 2.2);
              this.addShockwave(p.x, p.y, 4.8, '#38bdf8', 0.45);
              this.addHitSparks(p.x, p.y, '#ffffff', 24);
              if (this.camera) {
                this.camera.screenFreeze = 0.07;
                this.camera.zoomPulse = 1.3;
                this.camera.shake = 14;
                this.camera.cinematicBarsTimer = 0.55;
              }
              if (window.renderer) {
                window.renderer.screenFlashTimer = 0.09;
                window.renderer.screenFlashColor = '#38bdf8';
              }
              if (typeof audioMgr !== 'undefined') {
                if (audioMgr.playParry) audioMgr.playParry();
                if (audioMgr.playWhirlwind) audioMgr.playWhirlwind();
              }
            } else {
              p.hp -= hz.damage;
              p.hitTimer = 0.35;
              this.addFloatingText(p.x, p.y - 1.2, `💥-${hz.damage} [장판 피격!]`, '#ef4444', 1.5);
              if (this.camera) this.camera.shake = Math.min(22, (this.camera.shake || 0) + 9);
            }
          }

          // 범위 내 일반 몬스터/동물/기사 피해
          const affected = this.spatialGrid
            ? this.spatialGrid.query(hz.x, hz.y, hz.radius, ent => ent !== p && ent.hp > 0)
            : this.entities.filter(ent => ent !== p && ent.hp > 0 && Math.hypot(ent.x - hz.x, ent.y - hz.y) <= hz.radius);
          for (const ent of affected) {
            ent.hp -= hz.damage;
            ent.hitTimer = 0.25;
            this.addFloatingText(ent.x, ent.y - 1.0, `💥-${hz.damage}`, '#ef4444', 1.0);
          }

          this.hazardZones.splice(i, 1);
        }
      }
    }

    // 👣 동적 지형 발자국 및 항적 수명 관리
    if (this.footprints && this.footprints.length > 0) {
      for (let i = this.footprints.length - 1; i >= 0; i--) {
        this.footprints[i].age += dt;
        if (this.footprints[i].age >= this.footprints[i].duration) {
          this.footprints.splice(i, 1);
        }
      }
    }

    // 🩸 다크 판타지 전투 혈흔 및 데칼 수명 관리
    if (this.bloodDecals && this.bloodDecals.length > 0) {
      for (let i = this.bloodDecals.length - 1; i >= 0; i--) {
        this.bloodDecals[i].age += dt;
        if (this.bloodDecals[i].age >= this.bloodDecals[i].duration) {
          this.bloodDecals.splice(i, 1);
        }
      }
    }

    // 🌊 선박 및 수영 V자 물보라 항적 업데이트
    this.updateWaterWakes(dt);

    // 🌋 대지 파쇄 균열 및 단층 분쇄흔 수명 관리
    this.updateGroundFissures(dt);

    // 🦅 상공 정찰매 사역마 AI 업데이트
    this.updateFalcon(dt);
  }

  // 🐾 야생 동물 생태계 AI (포식자 사냥 추적 및 초식 동물 무리 도주 시스템)
  updateAnimalAI(e, dt) {
    // A. 포식자 (늑대, 호랑이, 곰, 랩터, 사자, 상어 등)
    if (e.isPredator) {
      if (e.satiatedTimer > 0) {
        // 배부른 상태: 여유롭게 영역 순찰
        if (e.stateTimer <= 0) {
          e.stateTimer = 4.5 + Math.random() * 4;
          const ang = Math.random() * Math.PI * 2;
          e.targetX = Math.max(3, Math.min(WORLD_WIDTH - 4, e.x + Math.cos(ang) * 7));
          e.targetY = Math.max(3, Math.min(WORLD_HEIGHT - 4, e.y + Math.sin(ang) * 7));
          e.state = 'resting';
          e.thought = '🍖 식사 후 든든하게 낮잠 및 영역 산책 중';
        }
        return;
      }

      // 사냥감 탐색 (반경 14타일 이내 비포식자 초식 동물 또는 사냥 대상)
      const prey = this.spatialGrid
        ? this.spatialGrid.findNearest(e.x, e.y, 14.0, other => other !== e && other.hp > 0 && other.role === 'animal' && !other.isPredator && e.isAquatic === other.isAquatic)
        : null;
      const minPreyD = prey ? Math.hypot(prey.x - e.x, prey.y - e.y) : 999;

      if (prey) {
        e.targetX = prey.x;
        e.targetY = prey.y;
        const cdx = prey.x - e.x;
        const cdy = prey.y - e.y;
        if (Math.abs(cdy) > Math.abs(cdx)) {
          e.facing = cdy > 0 ? 'down' : 'up';
        } else {
          e.facing = cdx > 0 ? 'right' : 'left';
        }

        if (minPreyD > 4.5) {
          // 살금살금 은신 추적 모드
          e.state = 'stalking';
          e.thought = `🐾 [${prey.name}] 조용히 풍하에서 추적 중... (${Math.round(minPreyD)}m)`;
          this.moveTowardTarget(e, dt * 1.05);
        } else if (minPreyD > 1.4) {
          // 전력 질주 기습 덮치기 모드!
          e.state = 'hunting';
          e.thought = `⚡ [${prey.name}] 향해 발톱을 드러내고 전력 질주 돌진!`;
          this.moveTowardTarget(e, dt * 1.55);
        } else {
          // 물어뜯기 공격!
          if (e.attackCooldown <= 0) {
            e.attackCooldown = 0.9;
            const dmg = Math.max(8, Math.round(e.atk * (0.9 + Math.random() * 0.3)));
            prey.hp -= dmg;
            prey.hitTimer = 0.25;
            this.addFloatingText(prey.x, prey.y - 0.7, `-🐾${dmg}`, '#ef4444', 0.8);
            this.addHitSparks(prey.x, prey.y, '#ef4444', 6);
            if (typeof audioMgr !== 'undefined' && this.player && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 22) {
              if (e.animalType === 'croc' || (e.name && e.name.includes('악어'))) audioMgr.playCrocSnap();
              else if (e.animalType === 'wolf' || (e.name && e.name.includes('늑대'))) audioMgr.playWolfHowl();
              else audioMgr.playSword();
            }

            if (prey.hp <= 0) {
              e.satiatedTimer = 9.0;
              e.hp = Math.min(e.maxHp, e.hp + 50);
              e.kills = (e.kills || 0) + 1;
              e.state = 'feeding';
              e.thought = `🍖 [${prey.name}] 사냥 성공! 배부르게 식사 중`;
              this.addFloatingText(e.x, e.y - 1.1, '🍖 포식 완료!', '#4ade80', 1.5);
            }
          }
        }
        return;
      }
    }

    // B. 초식/평화 동물 (사슴, 토끼, 양, 소, 말, 돌고래 등)
    // 인근에 포식자/몬스터/위협이 접근하면 필사적으로 무리 지어 도망 (SpatialGrid로 O(1) 초고속 감지)
    const threat = this.spatialGrid
      ? this.spatialGrid.findNearest(e.x, e.y, 9.0, other => {
          if (other === e || other.hp <= 0) return false;
          const isThreat = other.isPredator || other.faction === 'monster' || (other.role === 'player' && Math.hypot(other.x - e.x, other.y - e.y) < 3.2);
          if (!isThreat) return false;
          if (e.isAquatic !== other.isAquatic && !other.isFlying) return false;
          return true;
        })
      : null;

    if (threat) {
      // 위협 반대 방향으로 질주
      const angle = Math.atan2(e.y - threat.y, e.x - threat.x);
      e.targetX = Math.max(3, Math.min(WORLD_WIDTH - 4, e.x + Math.cos(angle) * 11));
      e.targetY = Math.max(3, Math.min(WORLD_HEIGHT - 4, e.y + Math.sin(angle) * 11));
      e.thought = `⚠️ ${threat.name}의 습격을 피해 필사적으로 전력 질주 도망 중!`;
      e.state = 'fleeing';
      this.moveTowardTarget(e, dt * 1.45);

      // 주변 같은 무리 동물들에게도 위험 경보 전파!
      const mates = this.spatialGrid
        ? this.spatialGrid.query(e.x, e.y, 5.5, mate => mate !== e && mate.role === 'animal' && !mate.isPredator)
        : [];
      for (const mate of mates) {
        mate.state = 'fleeing';
        mate.targetX = e.targetX + (Math.random() - 0.5) * 3;
        mate.targetY = e.targetY + (Math.random() - 0.5) * 3;
        mate.thought = `⚠️ 무리의 경보에 호응하여 함께 대피 중!`;
      }
      return;
    }

    // 평화로운 자연 생태 활동 (풀 뜯기, 시냇가 물 마시기, 무리 유영)
    if (e.stateTimer <= 0) {
      e.stateTimer = 4.0 + Math.random() * 5.0;
      const r = Math.random();
      if (e.animalType === 'dolphin') {
        const angle = Math.random() * Math.PI * 2;
        e.targetX = Math.max(85, Math.min(160, e.x + Math.cos(angle) * 16));
        e.targetY = Math.max(40, Math.min(180, e.y + Math.sin(angle) * 16));
        e.thought = '🐬 청명한 파도를 가르며 무리와 도약 유영 중!';
      } else if (e.animalType === 'deer') {
        const angle = Math.random() * Math.PI * 2;
        e.targetX = e.x + Math.cos(angle) * 8;
        e.targetY = e.y + Math.sin(angle) * 8;
        e.thought = r < 0.6 ? '🌿 고요한 숲속 그늘에서 풀을 뜯는 중' : '💧 맑은 시냇가에서 경계하며 목을 축이는 중';
      } else if (e.animalType === 'rabbit') {
        const angle = Math.random() * Math.PI * 2;
        e.targetX = e.x + Math.cos(angle) * 6;
        e.targetY = e.y + Math.sin(angle) * 6;
        e.thought = '🐇 들판의 클로버를 뜯으며 깡충깡충 뛰어다니는 중';
      } else if (e.animalType === 'bear') {
        const angle = Math.random() * Math.PI * 2;
        e.targetX = e.x + Math.cos(angle) * 9;
        e.targetY = e.y + Math.sin(angle) * 9;
        e.thought = '🐻 산악 숲에서 영역을 순찰하며 어슬렁거리는 중';
      } else if (e.animalType === 'chicken') {
        const isSleeping = Math.random() < 0.35;
        e.isSleeping = isSleeping;
        if (isSleeping) {
          e.state = 'sleeping';
          e.thought = '💤 짚단 둥지에서 고요히 낮잠 자는 중 (Zzz...)';
          e.vx = 0;
          e.vy = 0;
        } else {
          e.state = 'roaming';
          const angle = Math.random() * Math.PI * 2;
          e.targetX = e.x + Math.cos(angle) * 3.5;
          e.targetY = e.y + Math.sin(angle) * 3.5;
          e.thought = '🐔 마당에서 모이를 쪼며 꼬꼬댁거리는 중';
        }
      } else {
        const angle = Math.random() * Math.PI * 2;
        e.targetX = e.x + Math.cos(angle) * 6;
        e.targetY = e.y + Math.sin(angle) * 6;
        e.thought = '🌿 한가롭게 들판에서 동료들과 쉬는 중';
      }
    }
  }

  // 🐉 고대 드래곤 AI
  updateDragonAI(e, dt) {
    // 근처에 인간이나 적이 오면 위엄 넘치는 브레스 공격! (SpatialGrid O(1) 초고속 조회)
    const target = this.spatialGrid
      ? this.spatialGrid.findNearest(e.x, e.y, 14, other => other.faction === 'kingdom' && other.hp > 0)
      : null;
    const minD = target ? Math.hypot(target.x - e.x, target.y - e.y) : 999;

    if (target) {
      e.targetX = target.x;
      e.targetY = target.y;
      e.thought = `🐉 [${target.name}]을(를) 향해 파괴적인 브레스 방출!`;

      // ⚠️ 드래곤 지면 융해 대재앙 전조 장판 시전
      if (!e.dragonHazardCd || e.dragonHazardCd <= 0) {
        e.dragonHazardCd = 3.6;
        this.addHazardZone(target.x, target.y, 4.0, 1.25, Math.round(e.atk * 1.6), '🐉 고대 드래곤 겁화 맹폭', '#f97316');
        this.addFloatingText(e.x, e.y - 2.0, '🔥 [드래곤 겁화 장판 충전!]', '#ef4444', 1.6);
      }
      if (e.dragonHazardCd > 0) e.dragonHazardCd -= dt;

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
            color: e.projColor || '#f97316',
            life: Math.max(0.8, minD / 20),
            sender: e,
            damage: 28,
            target: target,
            isHostileProj: true
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

    // 1. 드래곤 & 비행 상태는 모든 지형 통과 가능
    if (e.role === 'dragon' || e.isFlying) return true;

    // 2. 해상 선박 & 수중 생물: 바다, 강, 부두, 교량 밑, 산호초만 항해 가능
    if (e.isShip || e.isAquatic) {
      if (tile === TILE.DEEP_WATER || tile === TILE.WATER || tile === TILE.DOCK || tile === TILE.BRIDGE || tile === TILE.CORAL) {
        return true;
      }
      if (tile === TILE.SAND) return true; // 해변 접안
      return false;
    }

    // 3. 🌟 플레이어 영웅: [젤다 BotW & 스카이림 스타일 완전 자유 탐험]
    // 깊은 바다(DEEP_WATER), 수직 암벽 절벽(MOUNTAIN), 용암(LAVA)을 제외한 모든 지형을 자유자재로 횡단!
    // 잔디밭(GRASS), 꽃밭 초원(MEADOW), 울창한 숲(FOREST/DARK_FOREST/ELVEN_FOREST), 언덕(HILLS), 만년설(SNOW), 모래사막(DESERT/SAND), 늪지(SWAMP), 툰드라(TUNDRA), 황무지(BADLANDS) 100% 자유 보행!
    // 성벽(WALL)도 기어오르기(Climbing)로 자유 횡단!
    // 얕은 강(WATER)도 여울목 도하(Wading)로 자유 횡단!
    if (e.role === 'player') {
      if (tile === TILE.DEEP_WATER || tile === TILE.MOUNTAIN || tile === TILE.LAVA) {
        return false;
      }
      return true;
    }

    // 4. 일반 육상 유닛 (NPC, 병사, 상인, 동물, 몬스터)
    if (tile === TILE.BRIDGE || tile === TILE.DOCK || tile === TILE.WALL) return true;
    if (tile === TILE.DEEP_WATER || tile === TILE.WATER || tile === TILE.MOUNTAIN || tile === TILE.LAVA) {
      return false;
    }
    return true;
  }

  updatePlayerControl(p, dt, playerInput) {
    // 쿨다운 및 타이머 갱신
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.attackAnimTimer > 0) {
      p.attackAnimTimer -= dt;
      if (p.attackAnimTimer <= 0) p.isAttacking = false;
    }
    if (p.dodgeCooldown > 0) p.dodgeCooldown -= dt;
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer -= dt;
      if (p.invulnerableTimer <= 0) p.invulnerable = false;
    }
    if (p.hitTimer > 0) p.hitTimer -= dt;
    if (p.boostTimer > 0) p.boostTimer -= dt;
    if (p.potionCooldown > 0) p.potionCooldown -= dt;
    if (p.parryCooldown > 0) p.parryCooldown -= dt;
    if (p.parryTimer > 0) {
      p.parryTimer -= dt;
      if (p.parryTimer <= 0) p.isParrying = false;
    }
    if (p.shieldBlockTimer > 0) p.shieldBlockTimer -= dt;
    if (p.riposteTimer > 0) {
      p.riposteTimer -= dt;
      if (p.riposteTimer <= 0) p.riposteReady = false;
    }
    if (p.killstreakTimer > 0) {
      p.killstreakTimer -= dt;
      if (p.killstreakTimer <= 0) p.killstreak = 0;
    }
    if (p.bowCooldown > 0) p.bowCooldown -= dt;
    if (p.bowDrawTimer > 0) p.bowDrawTimer -= dt;
    if (p.shieldBashCooldown > 0) p.shieldBashCooldown -= dt;
    this.updatePlayerCharge(p, dt);

    // 🏕️ 모닥불 요리 모션 타이머
    if (p.isCooking) {
      p.cookingTimer = (p.cookingTimer || 0) - dt;
      if (p.cookingTimer <= 0) p.isCooking = false;
    }

    // 🍖 [포만감(Well-Fed)] 지속 재생 및 버프 만료 관리
    if (p.wellFedTimer > 0) {
      p.wellFedTimer -= dt;
      p.wellFedRegenTimer = (p.wellFedRegenTimer || 0) + dt;
      if (p.wellFedRegenTimer >= 1.0) {
        p.wellFedRegenTimer = 0;
        if (p.hp < p.maxHp) {
          const regen = Math.max(1, Math.round(p.maxHp * 0.015));
          p.hp = Math.min(p.maxHp, p.hp + regen);
          this.addHitSparks(p.x, p.y, '#86efac', 3);
        }
      }
      if (p.wellFedTimer <= 0) {
        if (p.wellFedHpBonus) {
          p.maxHp = Math.max(100, p.maxHp - p.wellFedHpBonus);
          p.hp = Math.min(p.maxHp, p.hp);
          p.wellFedHpBonus = 0;
        }
        this.addFloatingText(p.x, p.y - 1.2, '🍖 포만감 버프가 만료되었습니다.', '#94a3b8', 1.5);
      }
    }

    // 💨 대시 / 닷지 롤 진행 중 (초고속 이동 & 지면 먼지)
    if (p.isDashing) {
      p.dashTimer -= dt;
      p.x += p.dashVx * dt;
      p.y += p.dashVy * dt;
      p.x = Math.max(2, Math.min(WORLD_WIDTH - 3, p.x));
      p.y = Math.max(2, Math.min(WORLD_HEIGHT - 3, p.y));
      if (Math.random() < 0.55) {
        this.addHitSparks(p.x, p.y + 0.3, '#cbd5e1', 2);
      }
      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
      return;
    }

    const curTx = Math.floor(p.x);
    const curTy = Math.floor(p.y);
    const curTile = this.world.getTile(curTx, curTy);

    // 🌊 수면/선박 이동 시 파문 및 V자 물보라 항적 생성
    if ((curTile === TILE.WATER || curTile === TILE.DOCK || p.isShip) && (p.vx !== 0 || p.vy !== 0)) {
      if (Math.random() < 0.28) {
        this.addWaterRipple(p.x, p.y);
      }
      p.waterWakeDist = (p.waterWakeDist || 0) + Math.hypot(p.vx, p.vy) * dt;
      if (p.waterWakeDist >= 0.5) {
        p.waterWakeDist = 0;
        this.addWaterWake(p.x, p.y, Math.atan2(p.vy, p.vx), p.isShip ? 1.6 : 0.85);
      }
    }

    // 👣 동적 발자국 / 항적 시스템 (Footprints & Ship Wakes)
    if (p.vx !== 0 || p.vy !== 0) {
      p.footstepDist = (p.footstepDist || 0) + Math.hypot(p.vx, p.vy) * dt;
      if (p.footstepDist >= 0.72) {
        p.footstepDist = 0;
        this.addFootprint(p.x, p.y, Math.atan2(p.vy, p.vx), p.isShip ? 'wake' : (p.mount || 'human'), curTile);
        if (curTile === 1 || curTile === 2 || curTile === 3 || curTile === 24 || curTile === 11 || curTile === 12) {
          this.addGrassDebris(p.x, p.y, curTile);
        }
        // 💨 모래/흙길 달리기 먼지 파티클 & 물 첨벙거림 (Dynamic Footstep Kick-up Particles)
        if (curTile === 1 || p.isShip) {
          if (!this.waterRipples) this.waterRipples = [];
          if (this.waterRipples.length < 30) {
            this.waterRipples.push({ x: p.x, y: p.y, age: 0, duration: 0.45, radius: 2.2 });
          }
        } else if (curTile === 2 || curTile === 17) {
          // 🏜️ 황금 사구 & 신기루 사막 모래 튀김 (Sand Spray)
          this.addDustPuff(p.x, p.y + 0.15, 2, '#fde68a');
        } else if (curTile === 9 || curTile === 23) {
          // ❄️ 만년설원 & 툰드라 서리 눈먼지 튀김 (Snow Powder Spray)
          this.addDustPuff(p.x, p.y + 0.15, 2, '#ffffff');
        } else if (curTile === 10 || curTile === 12 || curTile === 11) {
          // 흙길 / 황무지 / 경작지 흙먼지 (Dirt Puff)
          this.addDustPuff(p.x, p.y + 0.2, 1, '#d97706');
        }
      }
    }

    const boostMult = (p.boostTimer > 0 ? 1.85 : 1.0) * (p.wellFedTimer > 0 ? 1.15 : 1.0);

    const tryMove = (mx, my) => {
      const nx = p.x + mx;
      const ny = p.y + my;
      const nTx = Math.floor(nx);
      const nTy = Math.floor(ny);
      const nTile = this.world.getTile(nTx, nTy);

      // A. 배를 탄 상태에서 육지로 진입 시 자동 하선
      if (p.isShip) {
        const isNavalArea = (nTile === TILE.DEEP_WATER || nTile === TILE.WATER || nTile === TILE.DOCK || nTile === TILE.BRIDGE || nTile === TILE.CORAL);
        if (isNavalArea) {
          p.x = nx;
          p.y = ny;
          return true;
        }
        if (nTile !== TILE.MOUNTAIN && nTile !== TILE.LAVA) {
          p.x = nx;
          p.y = ny;
          p.isShip = false;
          p.icon = p.mount === 'horse' ? '🏇' : '🌟';
          this.addFloatingText(p.x, p.y - 1.2, '🏇 육지에 상륙했습니다!', '#fde047', 1.5);
          return true;
        }
        return false;
      }

      // B. 육상 도보/말 상태에서 깊은 바다로 진입 시 자동 승선
      if (nTile === TILE.DEEP_WATER) {
        p.x = nx;
        p.y = ny;
        p.isShip = true;
        p.icon = '⛵';
        this.addFloatingText(p.x, p.y - 1.2, '⛵ [특무범선] 대양으로 출항합니다!', '#38bdf8', 1.5);
        return true;
      }

      // 얕은 물(WATER): 강 건너기/여울목 도하
      if (nTile === TILE.WATER) {
        p.x = nx;
        p.y = ny;
        if (Math.random() < 0.2) {
          this.addEffect(p.x, p.y, 0.45, '#bae6fd', 0.2);
        }
        return true;
      }

      // 산맥/용암 외 모든 지형 통과 (성벽, 잔디, 초원, 숲 등)
      if (this.canEntityTraverse(p, nTx, nTy)) {
        p.x = nx;
        p.y = ny;
        return true;
      }
      return false;
    };

    if (playerInput && (playerInput.dx !== 0 || playerInput.dy !== 0)) {
      p.isMovingToTarget = false;
      if (Math.abs(playerInput.dy) > Math.abs(playerInput.dx)) {
        p.facing = playerInput.dy > 0 ? 'down' : 'up';
      } else {
        p.facing = playerInput.dx > 0 ? 'right' : 'left';
      }
      const len = Math.hypot(playerInput.dx, playerInput.dy) || 1;
      const step = p.speed * boostMult * dt * 3.2;
      const moveX = (playerInput.dx / len) * step;
      const moveY = (playerInput.dy / len) * step;

      p.vx = (playerInput.dx / len) * p.speed;
      p.vy = (playerInput.dy / len) * p.speed;

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
        let moved = tryMove(moveX, moveY);
        if (!moved) {
          if (tryMove(moveX, 0)) moved = true;
          else if (tryMove(0, moveY)) moved = true;
        }
        if (moved) {
          p.footstepTimer = (p.footstepTimer || 0) + dt;
          if (p.footstepTimer >= (p.mount === 'horse' ? 0.22 : 0.34)) {
            p.footstepTimer = 0;
            if (typeof audioMgr !== 'undefined') {
              const surface = p.isShip ? 'water' :
                (curTile === TILE.SNOW || curTile === TILE.TUNDRA ? 'snow' :
                (curTile === TILE.SAND || curTile === TILE.DESERT ? 'sand' : 'grass'));
              audioMgr.playFootstep(surface);
            }
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
          : (p.mount === 'wolf'
            ? '🐺 펜리르 섀도우 울프로 대륙 질주 중! (Space:비룡비행)'
            : (p.mount === 'horse'
              ? '🏇 왕실 백마를 타고 대륙 질주 중! (Space:섀도우울프)'
              : '🚶 도보로 대륙 탐험 중 (Space:백마탑승)')));
    } else if (p.isMovingToTarget) {
      // 🌟 마우스 좌클릭/우클릭 및 터치 목표 지점 추적 이동 (Click-to-Move)
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.3) {
        p.isMovingToTarget = false;
        p.vx = 0;
        p.vy = 0;
      } else {
        const step = Math.min(dist, p.speed * boostMult * dt * 3.2);
        const mx = (dx / dist) * step;
        const my = (dy / dist) * step;
        p.vx = (dx / dist) * p.speed;
        p.vy = (dy / dist) * p.speed;

        if (Math.abs(p.vy) > Math.abs(p.vx) && Math.abs(p.vy) > 0.05) {
          p.facing = p.vy > 0 ? 'down' : 'up';
        } else if (Math.abs(p.vx) > 0.05) {
          p.facing = p.vx > 0 ? 'right' : 'left';
        }

        if (p.isFlying) {
          p.x = Math.max(2, Math.min(WORLD_WIDTH - 3, p.x + mx));
          p.y = Math.max(2, Math.min(WORLD_HEIGHT - 3, p.y + my));
        } else {
          let moved = tryMove(mx, my);
          if (!moved) {
            if (tryMove(mx, 0)) moved = true;
            else if (tryMove(0, my)) moved = true;
            else p.isMovingToTarget = false;
          }
        }
      }
    } else {
      p.vx = 0;
      p.vy = 0;
    }

    if (p.attackCooldown <= 0) {
      const nearest = this.spatialGrid
        ? this.spatialGrid.findNearest(p.x, p.y, 8.5, other => other.faction === 'monster' && other.hp > 0)
        : null;
      const minDist = nearest ? Math.hypot(nearest.x - p.x, nearest.y - p.y) : 999;
      if (nearest) {
        const cdx = nearest.x - p.x;
        const cdy = nearest.y - p.y;
        if (Math.abs(cdy) > Math.abs(cdx)) {
          p.facing = cdy > 0 ? 'down' : 'up';
        } else {
          p.facing = cdx > 0 ? 'right' : 'left';
        }
        p.attackCooldown = 0.65;
        let comboMult = 1.0;
        if (this.rpgManager) {
          comboMult = this.rpgManager.addCombo(1);
        }
        if (typeof audioMgr !== 'undefined') audioMgr.playSword();
        const dmg = Math.round(p.atk * comboMult * (0.9 + Math.random() * 0.3));
        nearest.hp -= dmg;
        nearest.hitTimer = 0.25;

        // 💥 핵심: 플레이어 사격/타격 즉시 몬스터가 플레이어를 표적으로 반격 & 무리 지원 요청!
        nearest.combatTarget = p;
        this.rallyNearbyAllies(nearest, p, 10.0);

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
          this.gainPlayerExp(nearest.role === 'dragon' ? 120 : 50);
          if (this.rpgManager) {
            this.rpgManager.addCombo(2);
          }
          this.addFloatingText(p.x, p.y - 1.2, `+${nearest.gold}G 토벌 성공!`, '#4ade80', 1.4);
        }
      }
    }
  }

  // ⚔️ 적대 관계(Hostility) 판별 매트릭스
  isHostile(a, b) {
    if (!a || !b || a === b || a.hp <= 0 || b.hp <= 0) return false;

    // A. 플레이어와 대상의 관계
    if (a.role === 'player') {
      return b.faction === 'monster' || b.isPredator;
    }
    if (b.role === 'player') {
      return a.faction === 'monster' || (a.isPredator && a.combatTarget === b);
    }

    // B. 비전투 민간인(농부, 어부, 광부, 대장장이, 상인)은 먼저 공격하지 않음
    const aIsCivilian = (a.role === 'farmer' || a.role === 'fisherman' || a.role === 'miner' || a.role === 'merchant' || a.role === 'blacksmith');
    if (aIsCivilian) return false;

    // C. 야생 동물
    if (a.role === 'animal') {
      if (a.isPredator) {
        if (b.role === 'animal' && !b.isPredator) return true;
        if (a.combatTarget === b) return true;
      }
      return false;
    }

    // D. 왕국 전투원 (군사, 근위병, 해군, 모험가, 용병)
    if (a.faction === 'kingdom') {
      if (b.faction === 'monster') return true;
      // 시민이나 플레이어를 공격 중인 맹수
      if (b.isPredator && b.combatTarget && (b.combatTarget.faction === 'kingdom' || b.combatTarget.role === 'player')) return true;
      if (a.combatTarget === b) return true;
      return false;
    }

    // E. 드래곤
    if (a.role === 'dragon') {
      if (b.faction === 'monster') return true;
      if (a.combatTarget === b) return true;
      return false;
    }

    // F. 몬스터 진영 (고블린, 오크, 해적, 언데드 등)
    if (a.faction === 'monster') {
      // 왕국 전체 공격
      if (b.faction === 'kingdom') return true;
      // 동물 사냥
      if (b.role === 'animal' && Math.random() < 0.25) return true;
      // 몬스터 파벌 간 라이벌 분쟁 (흑요석 네크로폴리스 언데드 vs 오크/고블린/해적)
      if (b.faction === 'monster') {
        const aIsUndead = (a.homeId === 'obsidian_necropolis' || a.subClass === '사령술사' || a.subClass === '해골병사' || a.subClass === '데스나이트');
        const bIsUndead = (b.homeId === 'obsidian_necropolis' || b.subClass === '사령술사' || b.subClass === '해골병사' || b.subClass === '데스나이트');
        if (aIsUndead !== bIsUndead) return true;
        if (a.isShip !== b.isShip && (a.homeId === 'pirate_cove' || b.homeId === 'pirate_cove')) return true;
      }
      if (a.combatTarget === b) return true;
      return false;
    }

    return false;
  }

  // 🚨 시민 위협 시 인근 왕국 군사/경비대/모험가 긴급 구원 요청 (Civic Defense - SpatialGrid O(1) 고속 전파)
  alertCivicDefense(victim, attacker, radius = 18.0) {
    if (!victim || !attacker || attacker.hp <= 0) return;
    let responders = 0;
    const candidates = this.spatialGrid
      ? this.spatialGrid.query(victim.x, victim.y, radius, other => {
          if (other === victim || other.hp <= 0 || other.faction !== 'kingdom') return false;
          const isCombatant = (other.role === 'soldier' || other.role === 'royal_guard' || other.role === 'mercenary' || other.role === 'adventurer' || other.role === 'navy');
          if (!isCombatant) return false;
          if (victim.isShip !== other.isShip) return false;
          return true;
        })
      : [];
    for (const other of candidates) {
      const d = Math.hypot(other.x - victim.x, other.y - victim.y);
      if (!other.combatTarget || Math.hypot(other.combatTarget.x - other.x, other.combatTarget.y - other.y) > d) {
        other.combatTarget = attacker;
        other.state = 'combat';
        other.targetX = attacker.x;
        other.targetY = attacker.y;
        other.thought = `🛡️ [${victim.name}] 구출을 위해 긴급 방어 출격!`;
        responders++;
      }
    }
    if (responders > 0 && Math.random() < 0.35) {
      this.addFloatingText(victim.x, victim.y - 1.2, '🚨 도와주세요! 경비병님!', '#ef4444', 1.4);
    }
  }

  // 📢 몬스터/경비병의 주변 동료 집단 결집 (Rallying Call - SpatialGrid O(1) 지원)
  rallyNearbyAllies(leader, target, radius = 12.0) {
    if (!leader || !target || target.hp <= 0) return;
    const allies = this.spatialGrid
      ? this.spatialGrid.query(leader.x, leader.y, radius, ally => {
          if (ally === leader || ally.hp <= 0 || ally.combatTarget) return false;
          return ally.faction === leader.faction && ally.homeId === leader.homeId && ally.isShip === leader.isShip;
        })
      : [];
    for (const ally of allies) {
      ally.combatTarget = target;
      ally.state = 'combat';
      ally.targetX = target.x;
      ally.targetY = target.y;
      ally.thought = ally.faction === 'monster'
        ? `👹 [${leader.name}]의 전투 포효에 호응하여 집단 기습!`
        : `⚔️ 전우 [${leader.name}]를 지원하여 일제 돌격!`;
    }
  }

  // 💬 우호 NPC 간 자연스러운 소셜 인터랙션 (인사, 경례, 대화 말풍선)
  checkNPCSocialInteractions() {
    const candidates = this.entities.filter(e => e.faction === 'kingdom' && e.role !== 'player' && e.hp > 0 && e.state !== 'combat' && (!e.talkingTimer || e.talkingTimer <= 0));
    if (candidates.length < 2) return;

    for (let i = 0; i < Math.min(20, candidates.length); i++) {
      const a = candidates[Math.floor(Math.random() * candidates.length)];
      for (const b of candidates) {
        if (a === b || a.isShip !== b.isShip) continue;
        const dx = b.x - a.x;
        if (Math.abs(dx) > 2.6) continue;
        const dy = b.y - a.y;
        if (Math.abs(dy) > 2.6) continue;
        const d = Math.hypot(dx, dy);
        if (d <= 2.6) {
          if (Math.abs(dy) > Math.abs(dx)) {
            a.facing = dy > 0 ? 'down' : 'up';
            b.facing = dy > 0 ? 'up' : 'down';
          } else {
            a.facing = dx > 0 ? 'right' : 'left';
            b.facing = dx > 0 ? 'left' : 'right';
          }
          a.talkingTimer = 3.5;
          b.talkingTimer = 3.5;

          let bubbleA = '💬 좋은 날씨군요!';
          let bubbleB = '💬 늘 건강하십시오!';
          if (a.role === 'soldier' && b.role === 'soldier') {
            bubbleA = '🛡️ 충성! 가도 경계 이상 무!';
            bubbleB = '🛡️ 교대 때까지 힘내세!';
          } else if (a.role === 'farmer' && b.role === 'merchant') {
            bubbleA = '🌾 올해 황금 밀 품질이 최상이오!';
            bubbleB = '💰 왕도 시장에서 최고가로 사겠소!';
          } else if (a.role === 'adventurer' && b.role === 'blacksmith') {
            bubbleA = '⚒️ 대장장이님, 검 날이 여전히 예리합니다!';
            bubbleB = '🔥 드워프의 명품 룬 검이지! 무사히 다녀오게.';
          } else if (a.role === 'soldier' || b.role === 'soldier') {
            bubbleA = '🛡️ 안심하십시오, 왕실 군대가 지킵니다.';
            bubbleB = '🙏 항상 고생 많으십니다!';
          } else if (a.race === 'elf' || b.race === 'elf') {
            bubbleA = '🌿 자연의 정령들이 평안을 전합니다.';
            bubbleB = '✨ 엘프의 지혜에 감사드립니다.';
          }

          a.thought = bubbleA;
          b.thought = bubbleB;
          this.addFloatingText(a.x, a.y - 0.9, '💬', '#bae6fd', 1.8);
          return;
        }
      }
    }
  }

  // ⚔️ 통합 전투 판정 및 교전 실행 루프
  checkAndRunCombat(e, dt) {
    const isCivilian = (e.role === 'farmer' || e.role === 'fisherman' || e.role === 'miner' || e.role === 'merchant' || e.role === 'blacksmith');
    const detectRange = isCivilian ? 7.0 : 13.0;

    if (e.combatTarget) {
      if (e.combatTarget.hp <= 0 || Math.hypot(e.combatTarget.x - e.x, e.combatTarget.y - e.y) > 20) {
        e.combatTarget = null;
      }
    }

    if (!e.combatTarget && Math.random() < 0.4) {
      const nearest = this.spatialGrid
        ? this.spatialGrid.findNearest(e.x, e.y, detectRange, other => {
            if (other === e || other.hp <= 0) return false;
            if (e.isShip !== other.isShip && !e.isFlying && !other.isFlying) return false;
            return this.isHostile(e, other);
          })
        : null;
      if (nearest) e.combatTarget = nearest;
    }

    if (!e.combatTarget) return false;
    const target = e.combatTarget;
    e.fishingLine = null;

    if (isCivilian && e.role !== 'merchant') {
      this.alertCivicDefense(e, target, 18.0);
      const home = this.world.settlementMap[e.homeId];
      if (home) {
        e.targetX = home.x;
        e.targetY = home.y;
        e.state = 'fleeing';
        e.thought = `🚨 ${target.name}에게서 대피 중! (수비대 긴급 구원 요청)`;
        this.moveTowardTarget(e, dt * 1.35);
        return true;
      }
    }

    if (e.role === 'merchant') {
      this.alertCivicDefense(e, target, 18.0);
      e.thought = `⚠️ ${target.name} 습격! 호위병에게 보호받는 중!`;
      this.moveTowardTarget(e, dt * 1.2);
      return true;
    }

    e.state = 'combat';
    e.thought = e.isShip
      ? `💣 ${target.name}와(과) 해상 포격전 교전 중!`
      : `⚔️ ${target.name}와(과) 교전 중!`;

    const dist = Math.hypot(target.x - e.x, target.y - e.y);
    const attackRange = (e.ranged || e.isShip) ? 7.5 : 1.8;

    const cdx = target.x - e.x;
    const cdy = target.y - e.y;
    if (Math.abs(cdy) > Math.abs(cdx)) {
      e.facing = cdy > 0 ? 'down' : 'up';
      target.facing = cdy > 0 ? 'up' : 'down';
    } else {
      e.facing = cdx > 0 ? 'right' : 'left';
      target.facing = cdx > 0 ? 'left' : 'right';
    }

    if (dist > attackRange) {
      e.targetX = target.x;
      e.targetY = target.y;
      this.moveTowardTarget(e, dt * 1.25);
    } else if (e.attackCooldown <= 0) {
      e.attackCooldown = 0.85 + Math.random() * 0.35;

      // ⚠️ 보스 및 엘리트 몬스터의 전조 위험 장판 스킬 시전
      if ((e.isBoss || e.isElite || e.scale >= 1.4) && (!e.hazardCd || e.hazardCd <= 0)) {
        e.hazardCd = 4.2 + Math.random() * 2.0;
        const hRad = e.isBoss ? 3.6 : 2.6;
        const hDmg = Math.round(e.atk * 1.5);
        const hCol = e.isEnraged ? '#ef4444' : (e.eliteAffix === 'glacial' ? '#38bdf8' : '#f59e0b');
        const hName = e.name ? `[${e.name}] 멸망 강타` : '엘리트 강타';
        this.addHazardZone(target.x, target.y, hRad, 1.25, hDmg, hName, hCol);
        this.addFloatingText(e.x, e.y - 1.8, '⚠️ [위험 장판 충전 중!]', '#facc15', 1.4);
      }
      if (e.hazardCd > 0) e.hazardCd -= dt;

      // 🛡️ 플레이어 퍼펙트 패링 감지! (0.22초 내 완벽한 타이밍에 공격 방어)
      if (target === this.player && this.player.isParrying && this.player.parryTimer > 0) {
        this.triggerPlayerParrySuccess(e);
        return true;
      }

      // 일반 방패 블록 (parryTimer는 끝났으나 shieldBlockTimer 유지 중인 가드 상태 -> 데미지 70% 차단)
      let dmg = Math.max(5, Math.round(e.atk * (0.85 + Math.random() * 0.35)));

      // 🛡️ 플레이어 피격 시 태세 보정 및 각성 게이지 충전
      if (target === this.player) {
        if (target.combatStance === 'guardian') {
          dmg = Math.max(1, Math.round(dmg * 0.45)); // 수호 태세: 받는 피해 55% 경감!
        } else if (target.combatStance === 'berserk') {
          dmg = Math.round(dmg * 1.20); // 맹공 태세: 받는 피해 20% 증가
        }

        if (this.player.shieldBlockTimer > 0) {
          dmg = Math.max(1, Math.round(dmg * 0.30));
          this.addFloatingText(target.x, target.y - 1.4, '🛡️ [방패 가드 -70%]', '#38bdf8', 1.0);
          this.addHitSparks(target.x, target.y, '#38bdf8', 6);
        }

        // 플레이어 피격 시 각성 분노 게이지 충전 (+6%)
        this.player.awakeningGauge = Math.min(100, (this.player.awakeningGauge || 0) + 6.0);
      }

      // ❄️ 엘리트 [혹한의] 몬스터 공격 피격 시 플레이어 둔화
      if (e.isElite && e.eliteAffix === 'glacial' && target === this.player) {
        target.speed = Math.max(1.3, (target.speed || 2.4) * 0.7);
        this.addFloatingText(target.x, target.y - 1.6, '❄️ [혹한 둔화 -30%]', '#67e8f9', 1.2);
      }

      target.hp -= dmg;
      target.combatTarget = e;
      target.hitTimer = 0.25;

      // 🩸 다크 판타지 전투 혈흔 지면 데칼 생성
      const bloodColor = (target.role === 'dragon' || (target.name && target.name.includes('용'))) ? '#f97316'
        : (target.faction === 'monster') ? '#991b1b' : '#dc2626';
      this.addBloodDecal(target.x, target.y, bloodColor, 2.0, target.hp <= 0 ? 5 : 2);

      // ❄️ 혹한의 방벽 (Frost Aegis) 영구 특성: 플레이어 피격 시 공격자 즉시 1.8초 동결
      if (target === this.player && this.rpgManager && this.rpgManager.hasTrait('frost_aegis')) {
        e.frozenTimer = 1.8;
        this.addFloatingText(e.x, e.y - 1.2, '❄️ [혹한의 방벽] 공격자 1.8초 동결!', '#38bdf8', 1.4);
        this.addHitSparks(e.x, e.y, '#bae6fd', 8);
      }

      const isPlayerFight = (e === this.player || target === this.player);
      this.addHitSparks(target.x, target.y, e.faction === 'kingdom' ? '#fde047' : '#ef4444', isPlayerFight ? 8 : 4);
      if (isPlayerFight && this.camera) {
        this.camera.shake = Math.min(16, (this.camera.shake || 0) + 3.5);
      }

      // 동료 무리 결집
      this.rallyNearbyAllies(e, target, 10.0);

      if (e.ranged || e.isShip) {
        const angle = Math.atan2(target.y - e.y, target.x - e.x);
        this.projectiles.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(angle) * 18,
          vy: Math.sin(angle) * 18,
          color: e.projColor || (e.faction === 'kingdom' ? '#facc15' : '#ef4444'),
          life: Math.max(0.6, dist / 18),
          sender: e,
          damage: dmg,
          target: target,
          isHostileProj: true
        });
      }

      this.addFloatingText(target.x, target.y - 0.8, `-${dmg}`, e.faction === 'kingdom' ? '#facc15' : '#ef4444', 0.9);

      if (target.hp <= 0) {
        e.kills++;
        const reward = Math.max(12, Math.round(target.gold * 0.65));
        e.gold += reward;
        if (this.rpgManager && this.rpgManager.checkDungeonBossDefeat) {
          this.rpgManager.checkDungeonBossDefeat(target);
        }
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
    if (e.isElite && e.eliteAffix === 'volatile') {
      this.addShockwave(e.x, e.y, 5.0, '#ef4444', 0.55);
      this.addHazardZone(e.x, e.y, 4.0, 0.35, 110, '💥 폭렬 자폭', '#ef4444');
      this.addHitSparks(e.x, e.y, '#f97316', 22);
      this.addFloatingText(e.x, e.y - 1.2, '💥 [폭렬 자폭 발동!]', '#ef4444', 1.8);
    }

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
          if (other) {
            const ratio = other.faction === 'monster' ? 0.55 : (0.3 + Math.random() * 0.5);
            e.targetX = home.x + (other.x - home.x) * ratio + (Math.random() - 0.5) * 4;
            e.targetY = home.y + (other.y - home.y) * ratio + (Math.random() - 0.5) * 4;
            e.state = 'patrol';
            e.thought = `🛡️ ${home.name} ↔ ${other.name} 가도 순찰 중`;
            return;
          }
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
    const mainlandTowns = ['solaris', 'goldenwheat', 'bluewave', 'ironforge', 'silverleaf', 'valor_fort', 'oakwood', 'windmill_valley', 'st_mare', 'solhaven', 'valkyrie_gate'];

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
      else if (curTown.id === 'bluewave' || curTown.id === 'st_mare' || curTown.id === 'solhaven') bestGood = (curTown.stocks.spices > 8 ? 'spices' : 'fish');
      else if (curTown.id === 'ironforge' || curTown.id === 'valkyrie_gate') bestGood = (curTown.stocks.weapons > 15 ? 'weapons' : 'ore');
      else if (curTown.id === 'silverleaf') bestGood = 'herbs';
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
      const leader = this.entities.find(m => m.id === e.guardTargetId);
      if (leader && leader.hp > 0) {
        if (leader.combatTarget && (!e.combatTarget || e.combatTarget.hp <= 0)) {
          e.combatTarget = leader.combatTarget;
        }
        const angle = (e.id % 6) * (Math.PI / 3);
        e.targetX = leader.x + Math.cos(angle) * 2.2;
        e.targetY = leader.y + Math.sin(angle) * 2.2;
        e.state = 'escorting';
        e.thought = `🗡️ [${leader.name}] 호위 및 공동 전투 중`;
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

    if (Math.abs(e.vy) > Math.abs(e.vx) && Math.abs(e.vy) > 0.05) {
      e.facing = e.vy > 0 ? 'down' : 'up';
    } else if (Math.abs(e.vx) > 0.05) {
      e.facing = e.vx > 0 ? 'right' : 'left';
    }

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
