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
        let target = null;
        let minDist = 8.5;
        for (const e of this.em.entities) {
          if (e.faction === 'monster' && e.hp > 0) {
            const d = Math.hypot(e.x - s.x, e.y - s.y);
            if (d < minDist) {
              minDist = d;
              target = e;
            }
          }
        }
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
        let enemy = null;
        let minDist = 7.5;
        for (const other of this.em.entities) {
          if (other.faction === 'monster' && other.hp > 0) {
            const ed = Math.hypot(other.x - c.x, other.y - c.y);
            if (ed < minDist) {
              minDist = ed;
              enemy = other;
            }
          }
        }
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

      // 보스 스킬 공격 (주변 충격파)
      if (Math.random() < 0.05 && this.activeBoss.hp > 0) {
        this.em.addEffect(this.activeBossEntity.x, this.activeBossEntity.y, 9.0, '#ef4444', 0.8);
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

  update(dt) {
    this.updateStructures(dt);
    this.updateCompanions(dt);
    this.updateBoss(dt);
    if (this.em.player) {
      this.checkTreasureInteraction(this.em.player);
    }
  }
}

window.RPGSystemsManager = RPGSystemsManager;
window.STRUCTURE_DEFS = STRUCTURE_DEFS;
window.LEGENDARY_ITEMS = LEGENDARY_ITEMS;
