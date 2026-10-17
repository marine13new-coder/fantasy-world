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
  { id: 'dragon_crown', slot: 'helmet', name: '정복자의 황금 용관', icon: '👑', atk: 30, hp: 120, desc: '천공의 비룡을 제압한 대영웅의 관. 명성치 획득량이 증폭됩니다.' }
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
      bar.classList.remove('hidden');
      const nameEl = document.getElementById('bossName');
      const iconEl = document.getElementById('bossIcon');
      const subEl = document.getElementById('bossSubtitle');
      const fillEl = document.getElementById('bossHpFill');
      if (nameEl) nameEl.textContent = this.activeBoss.name;
      if (iconEl) iconEl.textContent = this.activeBoss.icon;
      if (subEl) subEl.textContent = this.activeBoss.subtitle;
      if (fillEl) {
        const pct = Math.max(0, Math.min(100, Math.round((this.activeBoss.hp / this.activeBoss.maxHp) * 100)));
        fillEl.style.width = `${pct}%`;
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

    this.updateCombo(dt);
    this.updateStructures(dt);
    this.updateCompanions(dt);
    this.updateBoss(dt);
    this.updateFishing(dt);
    this.updateCataclysm(dt, worldTime);

    if (this.em.player) {
      this.checkTreasureInteraction(this.em.player);
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

    // 체력 회복
    const heal = Math.round(p.maxHp * 0.4);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    if (typeof audioMgr !== 'undefined') audioMgr.playCookSizzle();
    this.em.addEffect(p.x, p.y, 3.5, '#f97316', 0.8);
    this.em.addFloatingText(p.x, p.y - 1.6, `🔥 모닥불 휴식 (+${heal} HP 회복)`, '#4ade80', 2.2);
    this.em.log('quest', `🔥 [${p.name}]이(가) 야외 모닥불 곁에서 따뜻하게 휴식하며 체력을 보충했습니다.`, p.x, p.y);
    return true;
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

window.RPGSystemsManager = RPGSystemsManager;
window.STRUCTURE_DEFS = STRUCTURE_DEFS;
window.LEGENDARY_ITEMS = LEGENDARY_ITEMS;
window.CRAFTING_RECIPES = CRAFTING_RECIPES;
