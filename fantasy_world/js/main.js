// ============================================================================
// main.js - 메인 시뮬레이션 루프, 플레이어 직접 조작(RPG/항해 모드), 군주 칙령, UI 인터랙션
// ============================================================================

function startFantasyWorld() {
  const canvas = document.getElementById('worldCanvas');
  const minimapCanvas = document.getElementById('minimapCanvas');
  if (!canvas || !minimapCanvas) return;

  let renderer = null;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    if (renderer) {
      renderer.dpr = dpr;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.imageSmoothingEnabled = false;
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = (clientX - rect.left) - rect.width / 2;
    const sy = (clientY - rect.top) - rect.height / 2;
    return {
      x: camera.x + sx / (TILE_SIZE * camera.zoom),
      y: camera.y + sy / (TILE_SIZE * camera.zoom)
    };
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 첫 사용자 상호작용 시 오디오 자동 해제
  const unlockAudio = () => {
    if (typeof audioMgr !== 'undefined') {
      audioMgr.resume();
      if (!audioMgr.muted && !audioMgr.bgmPlaying) {
        audioMgr.startBGM('peaceful');
      }
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  // 1. 월드 및 시뮬레이션 상태 초기화
  const world = generateWorld();
  const eventLogs = [];

  const worldTime = {
    day: 1,
    seasonIndex: 0,
    seasons: ['봄', '여름', '가을', '겨울'],
    hour: 8,
    minute: 0,
    speed: 1,
    weather: 'clear',
    weatherTimer: 35
  };

  let camera = null;

  const entityMgr = new EntityManager(world, (logItem) => {
    eventLogs.unshift(logItem);
    if (eventLogs.length > 40) eventLogs.pop();
    renderEventLogUI();
  });
  entityMgr.spawnInitialPopulation();

  // 플레이어 캐릭터 생성
  const player = entityMgr.spawnOrGetPlayer();

  renderer = new WorldRenderer(canvas, minimapCanvas, world, entityMgr);
  window.renderer = renderer;

  // 2. 카메라 및 시뮬레이션 상태
  let isPlayerControlActive = true;

  camera = {
    x: player.x,
    y: player.y,
    zoom: 0.95,
    minZoom: 0.10,
    maxZoom: 2.8,
    followEntity: player,
    shake: 0
  };
  entityMgr.camera = camera;

  let filterCategory = 'all';
  let selectedItem = { type: 'entity', data: player };

  // 초기 안내 로그
  entityMgr.log('quest', '👑 960×600 초대형 판타지 오픈월드 대제국과 4대 대륙·해양 신대륙이 정식 개방되었습니다!', camera.x, camera.y);
  entityMgr.log('trade', '⛵ 푸른파도 대항구 ↔ 엘븐하임 ↔ 미라주 사막 ↔ 세이렌 산호섬 50대 거점 무역로가 연결되었습니다.', 480, 300);
  entityMgr.log('battle', '🐉 서부 천공의 용의 둥지와 대해양 해골초도 해적선단이 대륙 각지를 위협하고 있습니다.', 90, 270);

  // 3. 거점 리스트 버튼 동적 생성 및 대륙 분류
  function getSettlementContinent(s) {
    if (s.continent) return s.continent;
    const straitIds = ['lone_beacon', 'beacon_island', 'pirate_cove', 'siren_coral', 'siren_reef', 'atlantis_ruins', 'sunken_shipwreck'];
    if (straitIds.includes(s.id)) return 'strait';
    if (s.x < 240) return 'west';
    if (s.x > 700) return 'east';
    if (s.y < 160) return 'north';
    if (s.y > 440) return 'south';
    return 'central';
  }

  const regionListEl = document.getElementById('regionList');
  for (const s of world.settlements) {
    const btn = document.createElement('button');
    btn.className = 'region-btn' + (s.danger ? ' danger' : '');
    btn.dataset.continent = getSettlementContinent(s);
    btn.innerHTML = `<span>${s.icon}</span> <span>${s.name}</span>`;
    btn.addEventListener('click', () => {
      stopFollow();
      smoothMoveCamera(s.x, s.y, 1.05);
      selectedItem = { type: 'settlement', data: s };
      updateInspectorUI();
    });
    regionListEl.appendChild(btn);
  }

  // 대륙별 필터 탭 바인딩
  const continentTabs = document.querySelectorAll('#continentTabs .c-tab');
  continentTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      continentTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.continent;
      document.querySelectorAll('#regionList .region-btn').forEach(btn => {
        if (target === 'all' || btn.dataset.continent === target) {
          btn.style.display = '';
        } else {
          btn.style.display = 'none';
        }
      });
    });
  });

  // 좌/우 사이드바 토글 픽셀 버튼 바인딩
  const btnToggleLeftSidebar = document.getElementById('btnToggleLeftSidebar');
  const leftSidebar = document.getElementById('leftSidebar');
  if (btnToggleLeftSidebar && leftSidebar) {
    btnToggleLeftSidebar.addEventListener('click', () => {
      leftSidebar.classList.toggle('collapsed');
      const isCol = leftSidebar.classList.contains('collapsed');
      btnToggleLeftSidebar.classList.toggle('collapsed', isCol);
      btnToggleLeftSidebar.textContent = isCol ? '▶' : '◀';
    });
  }

  const btnToggleRightSidebar = document.getElementById('btnToggleRightSidebar');
  const rightSidebar = document.getElementById('rightSidebar');
  if (btnToggleRightSidebar && rightSidebar) {
    btnToggleRightSidebar.addEventListener('click', () => {
      rightSidebar.classList.toggle('collapsed');
      const isCol = rightSidebar.classList.contains('collapsed');
      btnToggleRightSidebar.classList.toggle('collapsed', isCol);
      btnToggleRightSidebar.textContent = isCol ? '◀' : '▶';
    });
  }

  // 대륙 & 대해양 전체 지도 보기
  document.getElementById('btnZoomContinent').addEventListener('click', () => {
    stopFollow();
    smoothMoveCamera(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 0.13);
  });

  // 4. 필터 칩 바인딩
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterCategory = chip.dataset.filter;
    });
  });

  // 무역 상단/선단 추적
  document.getElementById('btnFindRandomMerchant').addEventListener('click', () => {
    const merchants = entityMgr.entities.filter(e => e.role === 'merchant' || e.role === 'sea_merchant');
    if (merchants.length > 0) {
      const pick = merchants[Math.floor(Math.random() * merchants.length)];
      selectedItem = { type: 'entity', data: pick };
      startFollow(pick);
      camera.zoom = Math.max(camera.zoom, 1.15);
      updateInspectorUI();
    }
  });

  // 전투 현장 이동
  document.getElementById('btnFindBattle').addEventListener('click', () => {
    const fighters = entityMgr.entities.filter(e => e.state === 'combat' && e.faction === 'kingdom');
    if (fighters.length > 0) {
      const pick = fighters[Math.floor(Math.random() * fighters.length)];
      selectedItem = { type: 'entity', data: pick };
      startFollow(pick);
      camera.zoom = Math.max(camera.zoom, 1.2);
      updateInspectorUI();
    } else {
      const pirate = world.settlementMap.pirate_cove;
      stopFollow();
      smoothMoveCamera(pirate.x, pirate.y, 0.95);
    }
  });

  // 5. 배속 조절
  let prevNonZeroSpeed = 1;
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setWorldSpeed(Number(btn.dataset.speed));
    });
  });

  function setWorldSpeed(spd) {
    if (spd > 0) prevNonZeroSpeed = spd;
    worldTime.speed = spd;
    document.querySelectorAll('.speed-btn').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.speed) === spd);
    });
  }

  // 6. 플레이어 컨트롤 및 스킬 바인딩
  const btnTogglePlayer = document.getElementById('btnTogglePlayer');
  const heroStatusText = document.getElementById('heroStatusText');

  function updatePlayerControlUI() {
    btnTogglePlayer.classList.toggle('active', isPlayerControlActive);
    heroStatusText.textContent = isPlayerControlActive
      ? '직접 조작 중 (WASD / 마우스 클릭 이동 / Space 탈것)'
      : '자유 관찰 모드 (P 키로 영웅 조작 전환)';
  }

  btnTogglePlayer.addEventListener('click', () => {
    isPlayerControlActive = !isPlayerControlActive;
    if (isPlayerControlActive) {
      startFollow(player);
      camera.zoom = Math.max(camera.zoom, 1.1);
      selectedItem = { type: 'entity', data: player };
      updateInspectorUI();
    }
    updatePlayerControlUI();
  });

  document.getElementById('btnSkillQ').addEventListener('click', () => entityMgr.triggerPlayerSkill('Q'));
  document.getElementById('btnSkillE').addEventListener('click', () => entityMgr.triggerPlayerSkill('E'));
  document.getElementById('btnSkillF').addEventListener('click', () => entityMgr.triggerPlayerSkill('F'));

  const btnSkill1 = document.getElementById('btnSkill1');
  if (btnSkill1) btnSkill1.addEventListener('click', () => entityMgr.triggerPlayerSkill('1'));
  const btnSkill2 = document.getElementById('btnSkill2');
  if (btnSkill2) btnSkill2.addEventListener('click', () => entityMgr.triggerPlayerSkill('2'));
  const btnSkill3 = document.getElementById('btnSkill3');
  if (btnSkill3) btnSkill3.addEventListener('click', () => entityMgr.triggerPlayerSkill('3'));
  const btnSkill4 = document.getElementById('btnSkill4');
  if (btnSkill4) btnSkill4.addEventListener('click', () => entityMgr.triggerPlayerSkill('4'));
  const btnSkillJ = document.getElementById('btnSkillJ');
  if (btnSkillJ) btnSkillJ.addEventListener('click', () => entityMgr.triggerPlayerSkill('J'));

  // 3단 콤보 공격 & 기 모으기 차징 강공격 버튼
  const btnSkillAttack = document.getElementById('btnSkillAttack');
  if (btnSkillAttack) {
    let attackPressedTime = 0;
    btnSkillAttack.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      attackPressedTime = Date.now();
      entityMgr.startPlayerCharge(player);
    });
    btnSkillAttack.addEventListener('pointerup', (e) => {
      e.preventDefault();
      entityMgr.releasePlayerCharge(player);
    });
    btnSkillAttack.addEventListener('click', (e) => {
      e.preventDefault();
      if (Date.now() - attackPressedTime < 350) {
        if (player.weaponMode === 'ranged') entityMgr.shootPlayerArrow(player);
        else entityMgr.playerPerformAttack(player);
      }
    });
  }

  const btnSkillParry = document.getElementById('btnSkillParry');
  if (btnSkillParry) {
    btnSkillParry.addEventListener('click', () => {
      entityMgr.triggerPlayerSkill('parry');
    });
  }

  const btnDodgeRoll = document.getElementById('btnDodgeRoll');
  if (btnDodgeRoll) {
    btnDodgeRoll.addEventListener('click', () => {
      entityMgr.playerDodgeRoll();
    });
  }

  const btnSkillPotion = document.getElementById('btnSkillPotion');
  if (btnSkillPotion) {
    btnSkillPotion.addEventListener('click', () => {
      entityMgr.triggerPlayerSkill('H');
    });
  }

  // 전투 3대 태세 전환 (맹공 / 수호 / 균형)
  const btnToggleStance = document.getElementById('btnToggleStance');
  const stanceIconEl = document.getElementById('stanceIcon');
  const stanceNameEl = document.getElementById('stanceName');

  function updateCombatStanceUI() {
    if (!stanceIconEl || !stanceNameEl) return;
    const st = player.combatStance || 'balanced';
    if (st === 'berserk') {
      stanceIconEl.textContent = '🔥';
      stanceNameEl.textContent = '맹공태세';
      if (btnToggleStance) btnToggleStance.style.borderColor = '#ef4444';
    } else if (st === 'guardian') {
      stanceIconEl.textContent = '🛡️';
      stanceNameEl.textContent = '수호태세';
      if (btnToggleStance) btnToggleStance.style.borderColor = '#38bdf8';
    } else {
      stanceIconEl.textContent = '⚡';
      stanceNameEl.textContent = '균형태세';
      if (btnToggleStance) btnToggleStance.style.borderColor = '#eab308';
    }
  }

  if (btnToggleStance) {
    btnToggleStance.addEventListener('click', () => {
      entityMgr.triggerPlayerSkill('stance');
      updateCombatStanceUI();
    });
  }

  // 🏹 실시간 무기 교체 (Tab)
  const btnToggleWeaponMode = document.getElementById('btnToggleWeaponMode');
  const weaponModeIconEl = document.getElementById('weaponModeIcon');
  const weaponModeNameEl = document.getElementById('weaponModeName');

  function updateWeaponModeUI() {
    if (!weaponModeIconEl || !weaponModeNameEl) return;
    const isRanged = player && player.weaponMode === 'ranged';
    weaponModeIconEl.textContent = isRanged ? '🏹' : '⚔️';
    weaponModeNameEl.textContent = isRanged ? '엘븐보우' : '근접성검';
    if (btnToggleWeaponMode) btnToggleWeaponMode.style.borderColor = isRanged ? '#38bdf8' : '#facc15';
  }
  window.updateWeaponModeUI = updateWeaponModeUI;

  if (btnToggleWeaponMode) {
    btnToggleWeaponMode.addEventListener('click', () => {
      entityMgr.playerToggleWeaponMode();
      updateWeaponModeUI();
    });
  }

  // 🦅 수호 정찰매 솔개 출격 (V)
  const btnToggleFalcon = document.getElementById('btnToggleFalcon');
  if (btnToggleFalcon) {
    btnToggleFalcon.addEventListener('click', () => {
      entityMgr.toggleFalconCompanion();
    });
  }

  // 각성 초필살기 (신벌의 천벌)
  const btnUltimateSkill = document.getElementById('btnUltimateSkill');
  if (btnUltimateSkill) {
    btnUltimateSkill.addEventListener('click', () => {
      entityMgr.triggerPlayerSkill('ultimate');
    });
  }

  // 탈것 변경 버튼
  const btnToggleMount = document.getElementById('btnToggleMount');
  const mountIconEl = document.getElementById('mountIcon');
  const mountNameEl = document.getElementById('mountName');

  btnToggleMount.addEventListener('click', () => {
    entityMgr.togglePlayerMount();
    updateMountUI();
  });

  function updateMountUI() {
    if (!mountIconEl || !mountNameEl) return;
    if (player.isShip) {
      mountIconEl.textContent = '⛵';
      mountNameEl.textContent = '특무범선';
    } else if (player.isFlying && player.mount === 'dragon') {
      mountIconEl.textContent = '🐉';
      mountNameEl.textContent = '고대비룡';
    } else if (player.mount === 'wolf') {
      mountIconEl.textContent = '🐺';
      mountNameEl.textContent = '섀도우울프';
    } else if (player.mount === 'horse') {
      mountIconEl.textContent = '🏇';
      mountNameEl.textContent = '왕실백마';
    } else {
      mountIconEl.textContent = '🚶';
      mountNameEl.textContent = '도보탐험';
    }
  }

  // 퀘스트 HUD 컨트롤
  const questCategoryEl = document.getElementById('questCategory');
  const questTitleEl = document.getElementById('questTitle');
  const questDescEl = document.getElementById('questDesc');
  const questProgressBarFill = document.getElementById('questProgressBarFill');
  const questProgressText = document.getElementById('questProgressText');
  const questDistanceEl = document.getElementById('questDistance');
  const questRewardEl = document.getElementById('questReward');
  const btnNewQuest = document.getElementById('btnNewQuest');
  const btnToggleQuestHud = document.getElementById('btnToggleQuestHud');
  const questBodyEl = document.getElementById('questBody');

  btnToggleQuestHud.addEventListener('click', () => {
    questBodyEl.classList.toggle('collapsed');
    btnToggleQuestHud.textContent = questBodyEl.classList.contains('collapsed') ? '➕' : '➖';
  });

  btnNewQuest.addEventListener('click', () => {
    if (entityMgr.questSystem) {
      entityMgr.questSystem.generateNewQuest();
      updateQuestHudUI();
    }
  });

  function updateQuestHudUI() {
    if (!entityMgr.questSystem || !entityMgr.questSystem.activeQuest) return;
    const q = entityMgr.questSystem.activeQuest;
    if (questCategoryEl) questCategoryEl.textContent = q.category;
    if (questTitleEl) questTitleEl.textContent = q.title;
    if (questDescEl) questDescEl.textContent = q.desc;

    const progPct = Math.min(100, Math.round((q.progress / q.maxProgress) * 100));
    if (questProgressBarFill) questProgressBarFill.style.width = `${progPct}%`;
    if (questProgressText) questProgressText.textContent = `${progPct}%`;

    const distTiles = Math.hypot(q.targetX - player.x, q.targetY - player.y);
    const distMeters = Math.round(distTiles * 10);
    const dx = q.targetX - player.x;
    const dy = q.targetY - player.y;
    let dir = '';
    if (dy < -4) dir += '북';
    if (dy > 4) dir += '남';
    if (dx > 4) dir += '동';
    if (dx < -4) dir += '서';
    if (!dir) dir = '근접';
    if (questDistanceEl) questDistanceEl.textContent = `🧭 ${distMeters}m ${dir}쪽 (${q.targetName})`;
    if (questRewardEl) questRewardEl.textContent = `💰 +${q.goldReward.toLocaleString()} G · 🌟 명성 +${q.fameReward}`;
  }

  // 정착지 상호작용 프롬프트 배너
  const settlementPromptEl = document.getElementById('settlementPrompt');
  const promptSettlementNameEl = document.getElementById('promptSettlementName');
  const btnInteractSettlement = document.getElementById('btnInteractSettlement');

  btnInteractSettlement.addEventListener('click', () => {
    entityMgr.interactWithNearestSettlement();
  });

  function updateSettlementPromptUI() {
    let nearest = null;
    let minDist = 7.5;
    for (const s of world.settlements) {
      if (s.faction === 'kingdom') {
        const d = Math.hypot(s.x - player.x, s.y - player.y);
        if (d < minDist) {
          minDist = d;
          nearest = s;
        }
      }
    }
    if (nearest) {
      settlementPromptEl.classList.remove('hidden');
      promptSettlementNameEl.textContent = `${nearest.name}`;
    } else {
      settlementPromptEl.classList.add('hidden');
    }
  }

  // 사운드 토글
  const btnToggleAudio = document.getElementById('btnToggleAudio');
  if (btnToggleAudio) {
    btnToggleAudio.addEventListener('click', () => {
      if (typeof audioMgr !== 'undefined') {
        const isMuted = audioMgr.toggleMute();
        btnToggleAudio.textContent = isMuted ? '🔇' : '🔊';
      }
    });
  }

  // 영지 건축 모드 & 팔레트
  const btnToggleBuild = document.getElementById('btnToggleBuild');
  const buildPaletteEl = document.getElementById('buildPalette');
  const btnCloseBuild = document.getElementById('btnCloseBuild');

  if (btnToggleBuild) {
    btnToggleBuild.addEventListener('click', () => {
      if (entityMgr.rpgManager) {
        entityMgr.rpgManager.isBuildModeActive = !entityMgr.rpgManager.isBuildModeActive;
        if (buildPaletteEl) buildPaletteEl.classList.toggle('hidden', !entityMgr.rpgManager.isBuildModeActive);
        btnToggleBuild.classList.toggle('active', entityMgr.rpgManager.isBuildModeActive);
        if (entityMgr.rpgManager.isBuildModeActive && typeof audioMgr !== 'undefined') audioMgr.playBuild();
      }
    });
  }

  if (btnCloseBuild) {
    btnCloseBuild.addEventListener('click', () => {
      if (entityMgr.rpgManager) {
        entityMgr.rpgManager.isBuildModeActive = false;
        if (buildPaletteEl) buildPaletteEl.classList.add('hidden');
        if (btnToggleBuild) btnToggleBuild.classList.remove('active');
      }
    });
  }

  document.querySelectorAll('.build-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.build-opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (entityMgr.rpgManager) {
        entityMgr.rpgManager.selectedBuildType = btn.dataset.type;
        if (typeof audioMgr !== 'undefined') audioMgr.playBuild();
      }
    });
  });

  // 호위 용병단 소집
  const btnToggleCompanions = document.getElementById('btnToggleCompanions');
  if (btnToggleCompanions) {
    btnToggleCompanions.addEventListener('click', () => {
      if (entityMgr.rpgManager) {
        entityMgr.rpgManager.toggleCompanions();
        btnToggleCompanions.classList.toggle('active', entityMgr.rpgManager.companionsActive);
      }
    });
  }

  // 장비 & 인벤토리 모달
  const btnToggleInventory = document.getElementById('btnToggleInventory');
  const inventoryModalEl = document.getElementById('inventoryModal');
  const btnCloseInventory = document.getElementById('btnCloseInventory');

  function updateInventoryUI() {
    if (!entityMgr.rpgManager || !inventoryModalEl || inventoryModalEl.classList.contains('hidden')) return;
    const rpg = entityMgr.rpgManager;
    const p = player;

    const atkEl = document.getElementById('statHeroAtk');
    const hpEl = document.getElementById('statHeroHp');
    const spdEl = document.getElementById('statHeroSpd');
    const fameEl = document.getElementById('statHeroFame');
    const goldEl = document.getElementById('statHeroGold');
    const killsEl = document.getElementById('statHeroKills');

    if (atkEl) atkEl.textContent = p.atk;
    if (hpEl) hpEl.textContent = `${Math.round(p.hp)} / ${p.maxHp}`;
    if (spdEl) spdEl.textContent = `${p.speed.toFixed(2)}x (${p.mount === 'dragon' ? '비룡비행' : (p.mount === 'horse' ? '백마' : (p.isShip ? '항해' : '도보'))})`;
    if (fameEl) fameEl.textContent = p.fame || 0;
    if (goldEl) goldEl.textContent = `${p.gold.toLocaleString()} G`;
    if (killsEl) killsEl.textContent = p.kills || 0;

    const slotWeaponName = document.getElementById('slotWeaponName');
    const slotShieldName = document.getElementById('slotShieldName');
    const slotArmorName = document.getElementById('slotArmorName');
    const slotRelicName = document.getElementById('slotRelicName');
    const slotWeaponIcon = document.getElementById('slotWeaponIcon');
    const slotShieldIcon = document.getElementById('slotShieldIcon');
    const slotArmorIcon = document.getElementById('slotArmorIcon');
    const slotRelicIcon = document.getElementById('slotRelicIcon');

    if (slotWeaponName) slotWeaponName.textContent = rpg.equipment.weapon ? rpg.equipment.weapon.name : '장착 안됨';
    if (slotShieldName) slotShieldName.textContent = rpg.equipment.shield ? rpg.equipment.shield.name : '장착 안됨';
    if (slotArmorName) slotArmorName.textContent = rpg.equipment.armor ? rpg.equipment.armor.name : '장착 안됨';
    if (slotRelicName) slotRelicName.textContent = rpg.equipment.relic ? rpg.equipment.relic.name : '장착 안됨';

    if (window.PixelItems) {
      if (slotWeaponIcon) slotWeaponIcon.innerHTML = `<img class="pixel-item-icon" src="${PixelItems.getDataUrl(rpg.equipment.weapon ? rpg.equipment.weapon.id : 'sword_steel')}" alt="무기">`;
      if (slotShieldIcon) slotShieldIcon.innerHTML = `<img class="pixel-item-icon" src="${PixelItems.getDataUrl(rpg.equipment.shield ? rpg.equipment.shield.id : 'shield_iron')}" alt="방패">`;
      if (slotArmorIcon) slotArmorIcon.innerHTML = `<img class="pixel-item-icon" src="${PixelItems.getDataUrl(rpg.equipment.armor ? rpg.equipment.armor.id : 'armor_plate')}" alt="갑옷">`;
      if (slotRelicIcon) slotRelicIcon.innerHTML = `<img class="pixel-item-icon" src="${PixelItems.getDataUrl(rpg.equipment.relic ? rpg.equipment.relic.id : 'crown_royal')}" alt="유물">`;
    }

    const grid = document.getElementById('backpackGrid');
    if (grid) {
      grid.innerHTML = '';
      const items = [
        { key: 'gem', icon: '💎', name: '심해 보석', count: p.inventory.gems || 0 },
        { key: 'spices', icon: '🌶️', name: '황금 향신료', count: p.inventory.spices || 0 },
        { key: 'wheat', icon: '🌾', name: '황금 밀', count: p.inventory.wheat || 0 },
        { key: 'ore', icon: '⛏️', name: '미스릴 원석', count: p.inventory.ore || 0 },
        { key: 'herbs', icon: '🌿', name: '세계수 약초', count: p.inventory.herbs || 0 },
        { key: 'weapons', icon: '⚔️', name: '여분 무기', count: p.inventory.weapons || 0 },
        { key: 'wood', icon: '🪵', name: '고목 목재', count: p.inventory.wood || 0 },
        { key: 'fish', icon: '🐟', name: '원양 생선', count: p.inventory.fish || 0 }
      ];
      items.forEach(it => {
        const div = document.createElement('div');
        div.className = 'backpack-item';
        const iconHtml = window.PixelItems
          ? `<img class="pixel-item-icon" src="${PixelItems.getDataUrl(it.key)}" alt="${it.name}">`
          : `<span>${it.icon}</span>`;
        div.innerHTML = `${iconHtml} <span>${it.name}: <strong>${it.count}</strong></span>`;
        grid.appendChild(div);
      });
    }
  }

  function toggleInventory() {
    if (!inventoryModalEl) return;
    const isHidden = inventoryModalEl.classList.contains('hidden');
    inventoryModalEl.classList.toggle('hidden', !isHidden);
    if (isHidden) {
      updateInventoryUI();
      if (typeof audioMgr !== 'undefined') audioMgr.playCoin();
    }
  }

  if (btnToggleInventory) btnToggleInventory.addEventListener('click', toggleInventory);
  if (btnCloseInventory) {
    btnCloseInventory.addEventListener('click', (e) => {
      e.stopPropagation();
      if (inventoryModalEl) inventoryModalEl.classList.add('hidden');
    });
  }
  if (inventoryModalEl) {
    inventoryModalEl.addEventListener('click', (e) => {
      if (e.target === inventoryModalEl) {
        inventoryModalEl.classList.add('hidden');
      }
    });
  }

  // 대장간 & 연금술 제작 모달
  const craftingModalEl = document.getElementById('craftingModal');
  const btnCloseCrafting = document.getElementById('btnCloseCrafting');
  const btnSkillK = document.getElementById('btnSkillK');

  function updateCraftingUI() {
    if (!craftingModalEl || craftingModalEl.classList.contains('hidden')) return;
    const listEl = document.getElementById('craftingRecipesList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const recipes = (typeof CRAFTING_RECIPES !== 'undefined') ? CRAFTING_RECIPES : [];
    const p = player;

    recipes.forEach(r => {
      const item = document.createElement('div');
      item.className = 'crafting-recipe-item';

      let reqsHtml = '';
      let canCraft = true;

      // 골드
      if (r.req.gold) {
        const has = p.gold >= r.req.gold;
        if (!has) canCraft = false;
        reqsHtml += `<span class="req-tag ${has ? 'ready' : 'lack'}">🪙 ${r.req.gold}G (${p.gold.toLocaleString()}G)</span>`;
      }

      // 원자재
      for (const [res, count] of Object.entries(r.req)) {
        if (res === 'gold') continue;
        const cur = p.inventory[res] || 0;
        const has = cur >= count;
        if (!has) canCraft = false;
        const resLabel = (typeof GOODS_KR !== 'undefined' && GOODS_KR[res]) ? GOODS_KR[res] : res;
        reqsHtml += `<span class="req-tag ${has ? 'ready' : 'lack'}">${resLabel} ${count}개 (보유: ${cur})</span>`;
      }

      const itemIconHtml = window.PixelItems
        ? `<img class="pixel-item-icon recipe-pixel-icon" src="${PixelItems.getDataUrl(r.id)}" alt="${r.name}">`
        : `<span class="recipe-icon">${r.icon}</span>`;

      item.innerHTML = `
        <div class="recipe-left">
          ${itemIconHtml}
          <div class="recipe-details">
            <span class="recipe-name">${r.name}</span>
            <span class="recipe-desc">${r.desc}</span>
            <div class="recipe-reqs">${reqsHtml}</div>
          </div>
        </div>
        <button class="btn-craft" data-recipe="${r.id}" ${canCraft ? '' : 'style="opacity:0.5;"'}>제작 (Craft)</button>
      `;

      const btn = item.querySelector('.btn-craft');
      btn.addEventListener('click', () => {
        if (entityMgr.rpgManager) {
          entityMgr.rpgManager.craftItem(r.id);
          updateCraftingUI();
          updateInventoryUI();
        }
      });

      listEl.appendChild(item);
    });
  }

  function toggleCrafting() {
    if (!craftingModalEl) return;
    const isHidden = craftingModalEl.classList.contains('hidden');
    craftingModalEl.classList.toggle('hidden', !isHidden);
    if (isHidden) {
      updateCraftingUI();
      if (typeof audioMgr !== 'undefined') audioMgr.playCoin();
    }
  }

  if (btnSkillK) btnSkillK.addEventListener('click', toggleCrafting);
  if (btnCloseCrafting) {
    btnCloseCrafting.addEventListener('click', (e) => {
      e.stopPropagation();
      if (craftingModalEl) craftingModalEl.classList.add('hidden');
    });
  }
  if (craftingModalEl) {
    craftingModalEl.addEventListener('click', (e) => {
      if (e.target === craftingModalEl) craftingModalEl.classList.add('hidden');
    });
  }

  // 캐릭터 스탯 강화 모달
  const statsModalEl = document.getElementById('statsModal');
  const btnCloseStatsModal = document.getElementById('btnCloseStatsModal');
  const btnSkillU = document.getElementById('btnSkillU');

  function updateStatsModalUI() {
    if (!statsModalEl || statsModalEl.classList.contains('hidden')) return;
    const p = player;
    p.stats = p.stats || { str: 10, vit: 10, agi: 10, int: 10 };

    const ptsEl = document.getElementById('modalStatPoints');
    if (ptsEl) ptsEl.textContent = `${p.statPoints || 0} P`;

    const strEl = document.getElementById('statValStr');
    const vitEl = document.getElementById('statValVit');
    const agiEl = document.getElementById('statValAgi');
    const intEl = document.getElementById('statValInt');

    if (strEl) strEl.textContent = p.stats.str || 10;
    if (vitEl) vitEl.textContent = p.stats.vit || 10;
    if (agiEl) agiEl.textContent = p.stats.agi || 10;
    if (intEl) intEl.textContent = p.stats.int || 10;

    const plusBtns = statsModalEl.querySelectorAll('.btn-alloc-plus');
    plusBtns.forEach(btn => {
      btn.style.opacity = (p.statPoints || 0) > 0 ? '1' : '0.4';
    });

    // 🏛️ 고대 성소 영구 유물 특성 목록 렌더링
    const traitsGridEl = document.getElementById('ancientTraitsGrid');
    if (traitsGridEl && entityMgr && entityMgr.rpgManager && entityMgr.rpgManager.ancientShrines) {
      const rpg = entityMgr.rpgManager;
      traitsGridEl.innerHTML = rpg.ancientShrines.map(shrine => {
        const isUnlocked = rpg.hasTrait(shrine.traitId);
        return `
          <div class="trait-card ${isUnlocked ? 'unlocked' : ''}">
            <div class="trait-icon-box">${shrine.icon}</div>
            <div class="trait-info">
              <div class="trait-header-line">
                <span class="trait-name">${shrine.traitName}</span>
                <span class="trait-status-badge">${isUnlocked ? '✓ 각성 완료' : '🔒 봉인됨'}</span>
              </div>
              <div class="trait-desc">${shrine.traitDesc}</div>
              <div class="trait-shrine-source">🏛️ 성소: ${shrine.name} [좌표: ${shrine.x}, ${shrine.y}]</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function toggleStatsModal() {
    if (!statsModalEl) return;
    const isHidden = statsModalEl.classList.contains('hidden');
    statsModalEl.classList.toggle('hidden', !isHidden);
    if (isHidden) {
      updateStatsModalUI();
      if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
    }
  }

  if (btnSkillU) btnSkillU.addEventListener('click', toggleStatsModal);
  if (btnCloseStatsModal) {
    btnCloseStatsModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (statsModalEl) statsModalEl.classList.add('hidden');
    });
  }
  if (statsModalEl) {
    statsModalEl.addEventListener('click', (e) => {
      if (e.target === statsModalEl) statsModalEl.classList.add('hidden');
    });
  }

  // 스탯 + 버튼 클릭 핸들러
  if (statsModalEl) {
    const allocBtns = statsModalEl.querySelectorAll('.btn-alloc-plus');
    allocBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const statKey = btn.getAttribute('data-stat');
        if (entityMgr.rpgManager && statKey) {
          entityMgr.rpgManager.allocateStat(statKey);
          updateStatsModalUI();
          updateInventoryUI();
        }
      });
    });
  }

  // 수호 펫 토글 버튼
  const btnSkillT = document.getElementById('btnSkillT');
  if (btnSkillT) {
    btnSkillT.addEventListener('click', () => {
      entityMgr.togglePetCompanion();
    });
  }

  // ==========================================================================
  // 고대 심연 던전 모달 & 원정 컨트롤러
  // ==========================================================================
  const dungeonModalEl = document.getElementById('dungeonModal');
  const btnCloseDungeonModal = document.getElementById('btnCloseDungeonModal');
  const btnStartDungeonExpedition = document.getElementById('btnStartDungeonExpedition');
  const btnOpenDungeon = document.getElementById('btnOpenDungeon');
  let currentViewingDungeon = null;

  window.openDungeonModal = function(dungeon) {
    if (!dungeonModalEl) return;
    const rpg = entityMgr.rpgManager;
    const dg = dungeon || (rpg && rpg.dungeons ? rpg.dungeons[0] : null);
    if (!dg) return;
    currentViewingDungeon = dg;

    const titleEl = document.getElementById('dungeonModalTitle');
    const descEl = document.getElementById('dungeonModalDesc');
    const lvlEl = document.getElementById('dungeonModalLevel');
    const bossEl = document.getElementById('dungeonModalBoss');
    const relicEl = document.getElementById('dungeonModalRelic');
    const iconEl = document.getElementById('dungeonBannerIcon');

    if (titleEl) titleEl.textContent = dg.name;
    if (descEl) descEl.textContent = dg.desc;
    if (lvlEl) lvlEl.textContent = `Lv. ${dg.levelReq}+`;
    if (bossEl) bossEl.textContent = dg.bossName;
    if (relicEl) relicEl.textContent = `${dg.relicReward.icon} ${dg.relicReward.name}`;
    if (iconEl) iconEl.textContent = dg.icon;

    dungeonModalEl.classList.remove('hidden');
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
  };

  if (btnCloseDungeonModal) {
    btnCloseDungeonModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dungeonModalEl) dungeonModalEl.classList.add('hidden');
    });
  }
  if (dungeonModalEl) {
    dungeonModalEl.addEventListener('click', (e) => {
      if (e.target === dungeonModalEl) dungeonModalEl.classList.add('hidden');
    });
  }
  if (btnStartDungeonExpedition) {
    btnStartDungeonExpedition.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentViewingDungeon && entityMgr.rpgManager) {
        entityMgr.rpgManager.enterDungeonExpedition(currentViewingDungeon.id);
        if (dungeonModalEl) dungeonModalEl.classList.add('hidden');
      }
    });
  }
  if (btnOpenDungeon) {
    btnOpenDungeon.addEventListener('click', () => {
      const rpg = entityMgr.rpgManager;
      if (!rpg || !rpg.dungeons) return;
      const nearest = rpg.checkNearbyDungeon(player) || rpg.dungeons[0];
      window.openDungeonModal(nearest);
    });
  }

  // ==========================================================================
  // 용병 길드 주점 모달 & 고용 컨트롤러
  // ==========================================================================
  const tavernModalEl = document.getElementById('tavernModal');
  const btnCloseTavernModal = document.getElementById('btnCloseTavernModal');

  window.openTavernModal = function() {
    if (!tavernModalEl) return;
    const rpg = entityMgr.rpgManager;
    if (!rpg || !rpg.mercenaries) return;

    const gridEl = document.getElementById('mercenaryCardsGrid');
    if (gridEl) {
      gridEl.innerHTML = rpg.mercenaries.map(m => {
        const isHired = rpg.recruitedMercenaryIds.includes(m.id);
        return `
          <div class="merc-card">
            <div class="merc-card-header">
              <div class="merc-icon-box" style="border: 1px solid ${m.color}66">${m.icon}</div>
              <div class="merc-header-text">
                <span class="merc-name" style="color: ${m.color}">${m.name}</span>
                <span class="merc-stats">체력: ${m.hp} | 공격력: ${m.atk}</span>
              </div>
            </div>
            <div class="merc-desc">${m.desc}</div>
            <div class="merc-action-row">
              <button class="btn-recruit-merc ${isHired ? 'hired' : ''}" data-class="${m.id}">
                ${isHired ? '✓ 출격 호위 중' : `💰 ${m.cost}G 고용`}
              </button>
            </div>
          </div>
        `;
      }).join('');

      const hireBtns = gridEl.querySelectorAll('.btn-recruit-merc:not(.hired)');
      hireBtns.forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const cid = b.getAttribute('data-class');
          if (cid && rpg) {
            const res = rpg.recruitMercenary(cid);
            if (res.ok) {
              window.openTavernModal();
            }
          }
        });
      });
    }

    tavernModalEl.classList.remove('hidden');
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
  };

  if (btnCloseTavernModal) {
    btnCloseTavernModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tavernModalEl) tavernModalEl.classList.add('hidden');
    });
  }
  if (tavernModalEl) {
    tavernModalEl.addEventListener('click', (e) => {
      if (e.target === tavernModalEl) tavernModalEl.classList.add('hidden');
    });
  }

  // C키 용병 버튼 우클릭 시 주점 모달 열기
  if (btnToggleCompanions) {
    btnToggleCompanions.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      window.openTavernModal();
    });
  }

  // ==========================================================================
  // 영웅 2차 각성 & 마스터리 전직 컨트롤러
  // ==========================================================================
  const awakeningModalEl = document.getElementById('awakeningModal');
  const btnCloseAwakeningModal = document.getElementById('btnCloseAwakeningModal');
  const btnOpenAwakening = document.getElementById('btnOpenAwakening');

  window.openAwakeningModal = function() {
    if (!awakeningModalEl) return;
    const rpg = entityMgr.rpgManager;
    if (!rpg || !rpg.awakeningClasses) return;

    const gridEl = document.getElementById('awakeningCardsGrid');
    if (gridEl) {
      gridEl.innerHTML = rpg.awakeningClasses.map(awk => {
        const isCurrent = rpg.awakening && rpg.awakening.id === awk.id;
        const perksHtml = awk.perks.map(p => `<span class="awk-perk-item">✓ ${p}</span>`).join('');
        return `
          <div class="awk-card ${isCurrent ? 'selected' : ''}" style="border-top: 3px solid ${awk.color}">
            <div class="awk-header">
              <div class="awk-icon-box" style="border: 1px solid ${awk.color}66">${awk.icon}</div>
              <div class="awk-name-block">
                <span class="awk-name" style="color: ${awk.color}">${awk.name}</span>
                <span class="awk-title">${awk.title}</span>
              </div>
            </div>
            <div class="awk-desc">${awk.desc}</div>
            <div class="awk-perks-box">
              ${perksHtml}
            </div>
            <div class="awk-skill-box">
              <span class="awk-skill-name">⚡ 각성기: ${awk.skillName}</span>
              <span class="awk-skill-desc">${awk.skillDesc}</span>
            </div>
            <button class="btn-awaken ${isCurrent ? 'current' : ''}" data-awk="${awk.id}">
              ${isCurrent ? '✓ 현재 각성 클래스' : `✨ ${awk.name}으로 각성하기`}
            </button>
          </div>
        `;
      }).join('');

      const awkBtns = gridEl.querySelectorAll('.btn-awaken:not(.current)');
      awkBtns.forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          const cid = b.getAttribute('data-awk');
          if (cid && rpg) {
            const res = rpg.selectAwakening(cid);
            if (res.ok) {
              window.openAwakeningModal();
              if (btnOpenAwakening) {
                btnOpenAwakening.classList.add('active');
                const nameEl = btnOpenAwakening.querySelector('.skill-name');
                if (nameEl) nameEl.textContent = res.class.name;
              }
            }
          }
        });
      });
    }

    awakeningModalEl.classList.remove('hidden');
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
  };

  if (btnCloseAwakeningModal) {
    btnCloseAwakeningModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (awakeningModalEl) awakeningModalEl.classList.add('hidden');
    });
  }
  if (awakeningModalEl) {
    awakeningModalEl.addEventListener('click', (e) => {
      if (e.target === awakeningModalEl) awakeningModalEl.classList.add('hidden');
    });
  }
  if (btnOpenAwakening) {
    btnOpenAwakening.addEventListener('click', () => {
      window.openAwakeningModal();
    });
  }

  // ==========================================================================
  // ⚡ 룬 제련소 & 인챈트 컨트롤러
  // ==========================================================================
  const runeforgeModalEl = document.getElementById('runeforgeModal');
  const btnCloseRuneforgeModal = document.getElementById('btnCloseRuneforgeModal');
  const btnOpenRuneforge = document.getElementById('btnOpenRuneforge');

  window.openRuneforgeModal = function() {
    if (!runeforgeModalEl) return;
    const rpg = entityMgr.rpgManager;
    if (!rpg || !rpg.runestones) return;

    // 장착된 슬롯 렌더링
    const slotsEl = document.getElementById('runeSocketSlots');
    if (slotsEl) {
      const slotTypes = [
        { key: 'weapon', label: '무기 룬 슬롯 (Weapon)', icon: '⚔️' },
        { key: 'shield', label: '방패 룬 슬롯 (Shield)', icon: '🛡️' },
        { key: 'armor', label: '갑옷 룬 슬롯 (Armor)', icon: '🦺' }
      ];

      slotsEl.innerHTML = slotTypes.map(st => {
        const runeId = rpg.enchantedRunes ? rpg.enchantedRunes[st.key] : null;
        const rune = runeId ? rpg.runestones.find(r => r.id === runeId) : null;
        if (rune) {
          return `
            <div class="rune-slot-card filled">
              <div class="rune-slot-info">
                <div class="rune-slot-icon" style="box-shadow: 0 0 10px ${rune.color}66">${rune.icon}</div>
                <div class="rune-slot-text">
                  <span class="rune-slot-name" style="color: ${rune.color}">${st.label}: ${rune.name}</span>
                  <span class="rune-slot-bonus">${rune.bonusText}</span>
                </div>
              </div>
              <button class="btn-rune-action danger" data-slot="${st.key}" data-action="unsocket">해제</button>
            </div>
          `;
        } else {
          return `
            <div class="rune-slot-card">
              <div class="rune-slot-info">
                <div class="rune-slot-icon">${st.icon}</div>
                <div class="rune-slot-text">
                  <span class="rune-slot-name">${st.label} (비어있음)</span>
                  <span class="rune-slot-bonus">보관함에서 룬을 선택하여 장착하십시오.</span>
                </div>
              </div>
              <span style="font-size: 11px; color: #64748b;">미장착</span>
            </div>
          `;
        }
      }).join('');

      slotsEl.querySelectorAll('.btn-rune-action[data-action="unsocket"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const s = e.target.getAttribute('data-slot');
          if (s && rpg) {
            rpg.unsocketRune(s);
            window.openRuneforgeModal();
          }
        });
      });
    }

    // 보유 룬 보관함 렌더링
    const invEl = document.getElementById('runeInventoryList');
    if (invEl) {
      invEl.innerHTML = rpg.runestones.map(r => {
        return `
          <div class="rune-inv-card">
            <div class="rune-slot-info">
              <div class="rune-slot-icon">${r.icon}</div>
              <div class="rune-slot-text">
                <span class="rune-slot-name" style="color: ${r.color}">${r.name}</span>
                <span class="rune-slot-bonus">${r.bonusText}</span>
              </div>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn-rune-action" data-rune="${r.id}" data-slot="weapon" title="무기에 장착">⚔️ 무기</button>
              <button class="btn-rune-action" data-rune="${r.id}" data-slot="shield" title="방패에 장착">🛡️ 방패</button>
              <button class="btn-rune-action" data-rune="${r.id}" data-slot="armor" title="갑옷에 장착">🦺 갑옷</button>
            </div>
          </div>
        `;
      }).join('');

      invEl.querySelectorAll('.btn-rune-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const rid = e.target.getAttribute('data-rune');
          const s = e.target.getAttribute('data-slot');
          if (rid && s && rpg) {
            rpg.socketRune(s, rid);
            window.openRuneforgeModal();
          }
        });
      });
    }

    runeforgeModalEl.classList.remove('hidden');
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
  };

  if (btnCloseRuneforgeModal) {
    btnCloseRuneforgeModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (runeforgeModalEl) runeforgeModalEl.classList.add('hidden');
    });
  }
  if (runeforgeModalEl) {
    runeforgeModalEl.addEventListener('click', (e) => {
      if (e.target === runeforgeModalEl) runeforgeModalEl.classList.add('hidden');
    });
  }
  if (btnOpenRuneforge) {
    btnOpenRuneforge.addEventListener('click', () => {
      window.openRuneforgeModal();
    });
  }

  // ==========================================================================
  // 🏟️ 발로르 왕국 투기장 컨트롤러
  // ==========================================================================
  const colosseumModalEl = document.getElementById('colosseumModal');
  const btnCloseColosseumModal = document.getElementById('btnCloseColosseumModal');
  const btnOpenColosseum = document.getElementById('btnOpenColosseum');
  const btnEnterColosseum = document.getElementById('btnEnterColosseum');

  window.openColosseumModal = function() {
    if (!colosseumModalEl) return;
    const rpg = entityMgr.rpgManager;
    if (!rpg) return;

    const statusCard = document.getElementById('colosseumStatusCard');
    if (statusCard) {
      const col = rpg.colosseum || {};
      const statusTitle = col.active ? `⚔️ 현재 제 ${col.wave}/5 라운드 교전 진행 중!` : (col.cleared ? '🏆 투기장 5라운드 완전 제패! (무패 챔피언)' : '🛡️ 투기장 도전 대기 상태');
      const waveNames = ['1.야만검투사', '2.화염마도사', '3.무쇠골렘', '4.심연리치', '5.검성발로르'];
      
      const waveStepsHtml = waveNames.map((wn, idx) => {
        const wNum = idx + 1;
        let cls = '';
        if (col.active && col.wave === wNum) cls = 'current';
        else if (col.cleared || (col.active && col.wave > wNum)) cls = 'cleared';
        return `<div class="colosseum-wave-step ${cls}">${wn}</div>`;
      }).join('');

      statusCard.innerHTML = `
        <div style="font-size: 14px; font-weight: 800; color: #fca5a5;">${statusTitle}</div>
        <div class="colosseum-wave-list">${waveStepsHtml}</div>
        <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
          • 장소: 황도 솔라리스 대경기장 광장 (X: 1935, Y: 1205)<br>
          • 보상: 2000 골드, 최대 생명력 +150, 공격력 +20, 태양왕 룬 & 풀구르 번개 룬 영구 획득!
        </div>
      `;
    }

    colosseumModalEl.classList.remove('hidden');
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
  };

  if (btnCloseColosseumModal) {
    btnCloseColosseumModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (colosseumModalEl) colosseumModalEl.classList.add('hidden');
    });
  }
  if (colosseumModalEl) {
    colosseumModalEl.addEventListener('click', (e) => {
      if (e.target === colosseumModalEl) colosseumModalEl.classList.add('hidden');
    });
  }
  if (btnOpenColosseum) {
    btnOpenColosseum.addEventListener('click', () => {
      window.openColosseumModal();
    });
  }
  if (btnEnterColosseum) {
    btnEnterColosseum.addEventListener('click', () => {
      if (colosseumModalEl) colosseumModalEl.classList.add('hidden');
      const rpg = entityMgr.rpgManager;
      if (rpg && rpg.startColosseumTournament) {
        rpg.startColosseumTournament();
      }
    });
  }

  // ==========================================================================
  // 🗺️ 판타시아 대륙 전도 & 거점 순간이동 컨트롤러
  // ==========================================================================
  const worldMapModalEl = document.getElementById('worldMapModal');
  const btnCloseWorldMapModal = document.getElementById('btnCloseWorldMapModal');
  const btnOpenWorldMap = document.getElementById('btnOpenWorldMap');

  window.openWorldMapModal = function() {
    if (!worldMapModalEl) return;
    const rpg = entityMgr.rpgManager;
    const gridEl = document.getElementById('worldMapSettlementsGrid');
    if (gridEl && world.settlementList) {
      // 주요 수도, 항구, 대성채, 천공 군도, 심연 성채, 해저 아틀란티스, 명계 제국, 성운 비전 고원, 공허 심연, 위그드라실, 크로노스 시계탑 필터
      const keySettlements = world.settlementList.filter(s => 
        s.type === 'capital' || s.type === 'port' || s.type === 'fortress' || s.hasWall || s.continent === 'sky' || s.continent === 'south_abyss' || s.continent === 'abyss_ocean' || s.continent === 'underworld' || s.continent === 'astral' || s.continent === 'atlantis' || s.continent === 'void' || s.continent === 'yggdrasil' || s.continent === 'chrono'
      ).slice(0, 140);

      gridEl.innerHTML = keySettlements.map(s => {
        let icon = '🏘️';
        if (s.continent === 'sky') icon = '🌌';
        else if (s.continent === 'south_abyss') icon = '🌋';
        else if (s.continent === 'abyss_ocean' || s.continent === 'atlantis') icon = '🔱';
        else if (s.continent === 'underworld') icon = '💀';
        else if (s.continent === 'astral') icon = '🔮';
        else if (s.continent === 'void') icon = '🌀';
        else if (s.continent === 'yggdrasil') icon = '🌲';
        else if (s.continent === 'chrono') icon = '⏳';
        else if (s.type === 'capital') icon = '👑';
        else if (s.type === 'port') icon = '⚓';
        else if (s.type === 'fortress') icon = '🏰';

        let regionName = '중앙 제국';
        if (s.continent === 'sky') regionName = '🌌 천공의 부유 군도';
        else if (s.continent === 'south_abyss') regionName = '🌋 심연의 심층 단층';
        else if (s.continent === 'abyss_ocean' || s.continent === 'atlantis') regionName = '🔱 심해 아틀란티스 신전 & 산호 해구';
        else if (s.continent === 'underworld') regionName = '💀 태고의 칼데라 & 명계 제국';
        else if (s.continent === 'astral') regionName = '🔮 성운 비전 고원 & 차원 균열';
        else if (s.continent === 'void') regionName = '🌀 태고의 공허 심연 & 성운 파쇄 군도';
        else if (s.continent === 'yggdrasil') regionName = '🌲 세계수 위그드라실 천공 수관림';
        else if (s.continent === 'chrono') regionName = '⏳ 크로노스 시공간 시계탑 & 유성우 천문대';
        else if (s.continent === 'west') regionName = '서부 실바니아';
        else if (s.continent === 'north') regionName = '북부 노스펠';
        else if (s.continent === 'south') regionName = '남부 드라코니아';

        return `
          <div class="map-settlement-card">
            <div class="map-settlement-info">
              <span class="map-settlement-icon">${icon}</span>
              <div class="map-settlement-details">
                <span class="map-settlement-name">${s.name}</span>
                <span class="map-settlement-sub">${regionName} (X:${s.x}, Y:${s.y})</span>
              </div>
            </div>
            <button class="btn-teleport-node" data-settlement="${s.id}">🌀 이동</button>
          </div>
        `;
      }).join('');

      gridEl.querySelectorAll('.btn-teleport-node').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sid = e.target.getAttribute('data-settlement');
          if (sid && rpg && rpg.teleportTo) {
            rpg.teleportTo(sid);
            if (worldMapModalEl) worldMapModalEl.classList.add('hidden');
          }
        });
      });
    }

    worldMapModalEl.classList.remove('hidden');
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
  };

  if (btnCloseWorldMapModal) {
    btnCloseWorldMapModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (worldMapModalEl) worldMapModalEl.classList.add('hidden');
    });
  }
  if (worldMapModalEl) {
    worldMapModalEl.addEventListener('click', (e) => {
      if (e.target === worldMapModalEl) worldMapModalEl.classList.add('hidden');
    });
  }
  if (btnOpenWorldMap) {
    btnOpenWorldMap.addEventListener('click', () => {
      window.openWorldMapModal();
    });
  }

  // 🧪 퀵 포션 벨트 버튼 리스너
  const btnSkillPotionSwift = document.getElementById('btnSkillPotionSwift');
  if (btnSkillPotionSwift) {
    btnSkillPotionSwift.addEventListener('click', () => {
      entityMgr.triggerPlayerSkill('5');
    });
  }
  const btnSkillPotionBerserk = document.getElementById('btnSkillPotionBerserk');
  if (btnSkillPotionBerserk) {
    btnSkillPotionBerserk.addEventListener('click', () => {
      entityMgr.triggerPlayerSkill('6');
    });
  }

  // ==========================================================================
  // 📜 대륙 현상금 수배소 컨트롤러
  // ==========================================================================
  const bountyModalEl = document.getElementById('bountyModal');
  const btnCloseBountyModal = document.getElementById('btnCloseBountyModal');
  const btnOpenBounty = document.getElementById('btnOpenBounty');

  window.openBountyModal = function() {
    if (!bountyModalEl) return;
    const rpg = entityMgr.rpgManager;
    if (!rpg || !rpg.bounties) return;

    const rankBarEl = document.getElementById('bountyRankBar');
    if (rankBarEl) {
      const clearedCount = rpg.bounties.filter(b => b.cleared).length;
      rankBarEl.innerHTML = `
        <span>🎖️ 현재 사냥꾼 등급: <strong style="color: #facc15;">${rpg.bountyHunterRank}</strong></span>
        <span>토벌 실적: ${clearedCount} / ${rpg.bounties.length} 완료</span>
      `;
    }

    const gridEl = document.getElementById('bountyCardsGrid');
    if (gridEl) {
      gridEl.innerHTML = rpg.bounties.map(b => {
        let btnText = '📜 수배령 수락 & 추적';
        let btnClass = 'btn-bounty-action';
        if (b.cleared) {
          btnText = '🏆 토벌 완료 (보상 수령됨)';
          btnClass = 'btn-bounty-action cleared';
        } else if (b.active) {
          btnText = '🎯 추적 중 (위치: ' + b.region + ')';
          btnClass = 'btn-bounty-action active';
        }

        return `
          <div class="bounty-poster-card ${b.cleared ? 'cleared' : ''}" style="border-top: 3px solid ${b.color}">
            <div class="bounty-poster-header">
              <span class="bounty-target-rank" style="background: ${b.color}">${b.rank}</span>
              <span style="font-size: 20px;">${b.icon}</span>
            </div>
            <div class="bounty-target-name">${b.name}</div>
            <div style="font-size: 11px; color: #94a3b8;">출몰지: ${b.region} (X: ${b.x}, Y: ${b.y})</div>
            <div class="bounty-target-desc">${b.desc}</div>
            <div class="bounty-reward-box">
              <span>💰 현상금: <strong>${b.rewardGold} G</strong> (+${b.rewardExp} EXP)</span>
              <span>🎁 특별 보상: ${b.rewardItem}</span>
            </div>
            <button class="${btnClass}" data-bounty="${b.id}" ${b.cleared ? 'disabled' : ''}>${btnText}</button>
          </div>
        `;
      }).join('');

      gridEl.querySelectorAll('.btn-bounty-action:not(.cleared)').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const bid = e.target.getAttribute('data-bounty');
          if (bid && rpg) {
            rpg.acceptBounty(bid);
            window.openBountyModal();
          }
        });
      });
    }

    bountyModalEl.classList.remove('hidden');
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
  };

  if (btnCloseBountyModal) {
    btnCloseBountyModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (bountyModalEl) bountyModalEl.classList.add('hidden');
    });
  }
  if (bountyModalEl) {
    bountyModalEl.addEventListener('click', (e) => {
      if (e.target === bountyModalEl) bountyModalEl.classList.add('hidden');
    });
  }
  if (btnOpenBounty) {
    btnOpenBounty.addEventListener('click', () => {
      window.openBountyModal();
    });
  }

  // ==========================================================================
  // 📖 고대 잊혀진 대륙 실록 도감 컨트롤러
  // ==========================================================================
  const codexModalEl = document.getElementById('codexModal');
  const btnCloseCodexModal = document.getElementById('btnCloseCodexModal');
  const btnOpenCodex = document.getElementById('btnOpenCodex');

  window.openCodexModal = function() {
    if (!codexModalEl) return;
    const rpg = entityMgr.rpgManager;
    if (!rpg || !rpg.monoliths) return;

    const listEl = document.getElementById('codexChaptersList');
    if (listEl) {
      listEl.innerHTML = rpg.monoliths.map(m => {
        const isUnlocked = m.unlocked;
        return `
          <div class="codex-chapter-card ${isUnlocked ? 'unlocked' : ''}">
            <div class="codex-chapter-header">
              <span class="codex-chapter-title" style="color: ${isUnlocked ? m.color : '#94a3b8'}">
                ${m.icon} ${m.title} - [${m.name}]
              </span>
              <span style="font-size: 11px; font-weight: 700; color: ${isUnlocked ? '#4ade80' : '#64748b'}">
                ${isUnlocked ? '✓ 판독 완료' : '🔒 미발견 (위치: X:' + m.x + ', Y:' + m.y + ')'}
              </span>
            </div>
            <div class="codex-chapter-lore">
              ${isUnlocked ? m.lore : '고대 석판이 아직 판독되지 않았습니다. 해당 대륙의 유적지로 향하여 석비를 직접 판독하십시오.'}
            </div>
            <div class="codex-blessing-tag">
              영구 축복 각인: ${m.blessingText} ${isUnlocked ? '(활성화됨)' : '(미해금)'}
            </div>
          </div>
        `;
      }).join('');
    }

    codexModalEl.classList.remove('hidden');
    if (typeof audioMgr !== 'undefined') audioMgr.playFanfare();
  };

  if (btnCloseCodexModal) {
    btnCloseCodexModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (codexModalEl) codexModalEl.classList.add('hidden');
    });
  }
  if (codexModalEl) {
    codexModalEl.addEventListener('click', (e) => {
      if (e.target === codexModalEl) codexModalEl.classList.add('hidden');
    });
  }
  if (btnOpenCodex) {
    btnOpenCodex.addEventListener('click', () => {
      window.openCodexModal();
    });
  }

  // 전체화면 및 시네마틱 모드
  const btnToggleFullscreen = document.getElementById('btnToggleFullscreen');
  if (btnToggleFullscreen) {
    btnToggleFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });
  }

  const btnToggleCinematic = document.getElementById('btnToggleCinematic');
  if (btnToggleCinematic) {
    btnToggleCinematic.addEventListener('click', () => {
      document.body.classList.toggle('cinematic-mode');
    });
  }

  // 동적 월드 이벤트 & 나침반 & 영웅 미니 바 업데이트 함수
  function updateWorldEventUI() {
    const ev = entityMgr.activeWorldEvent;
    if (!ev) return;
    const iconEl = document.getElementById('worldEventIcon');
    const titleEl = document.getElementById('worldEventTitle');
    const descEl = document.getElementById('worldEventDesc');
    const timerEl = document.getElementById('worldEventTimerText');
    if (iconEl) iconEl.textContent = ev.icon;
    if (titleEl) titleEl.textContent = ev.title;
    if (descEl) descEl.textContent = ev.desc;
    if (timerEl) timerEl.textContent = `${Math.ceil(entityMgr.worldEventTimer)}s`;
  }

  function updateNavCompassUI() {
    const p = player;
    if (!p) return;
    let target = null;
    let targetName = '목표 지점';

    if (entityMgr.rpgManager && entityMgr.rpgManager.activeContinentalEvent) {
      const evt = entityMgr.rpgManager.activeContinentalEvent;
      target = { x: evt.x, y: evt.y };
      targetName = `[긴급] ${evt.name}`;
    } else if (entityMgr.questSystem && entityMgr.questSystem.activeQuest) {
      const q = entityMgr.questSystem.activeQuest;
      target = q.targetLocation || (q.targetSettlement ? world.settlementMap[q.targetSettlement] : null);
      targetName = q.title;
    } else if (selectedItem && selectedItem.data && (selectedItem.data.x !== undefined)) {
      target = selectedItem.data;
      targetName = selectedItem.data.name || '선택 지점';
    } else {
      target = world.settlementMap.solaris;
      targetName = '솔라리스 왕도';
    }

    if (!target) return;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const needleEl = document.getElementById('compassNeedle');
    if (needleEl) {
      needleEl.style.transform = `rotate(${Math.round((angle * 180 / Math.PI) + 90)}deg)`;
    }
    const nameEl = document.getElementById('compassTargetName');
    const distEl = document.getElementById('compassTargetDist');
    if (nameEl) nameEl.textContent = targetName.length > 10 ? targetName.slice(0, 10) + '...' : targetName;
    if (distEl) distEl.textContent = `${Math.round(dist * 10)}m`;
  }

  function updateHeroBarsUI() {
    const p = player;
    if (!p) return;
    const lvlEl = document.getElementById('heroLevelBadge');
    const hpFill = document.getElementById('dockHeroHpFill');
    const expFill = document.getElementById('dockHeroExpFill');

    if (lvlEl) lvlEl.textContent = `Lv. ${p.level || 5}`;
    if (hpFill) {
      const hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
      hpFill.style.width = `${hpPct}%`;
    }
    if (expFill) {
      const expPct = Math.max(0, Math.min(100, ((p.exp || 0) / (p.maxExp || 120)) * 100));
      expFill.style.width = `${expPct}%`;
    }
    updateSkillCooldownsUI();
  }

  function updateSkillCooldownsUI() {
    const p = player;
    if (!p) return;
    const rpg = entityMgr.rpgManager;

    // 회피 롤 (Space)
    const dodgeBtn = document.getElementById('btnDodgeRoll');
    if (dodgeBtn) {
      dodgeBtn.style.opacity = p.dodgeCooldown > 0 ? '0.5' : '1.0';
    }

    // 회복 물약 (H)
    const potBtn = document.getElementById('btnSkillPotion');
    if (potBtn) {
      potBtn.style.opacity = p.potionCooldown > 0 ? '0.5' : '1.0';
    }

    // 공격 스킬 1~4
    if (rpg && rpg.skills) {
      const s1 = document.getElementById('btnSkill1');
      if (s1 && rpg.skills.whirlwind) {
        s1.style.opacity = rpg.skills.whirlwind.cd > 0 ? '0.5' : '1.0';
      }
      const s2 = document.getElementById('btnSkill2');
      if (s2 && rpg.skills.frostNova) {
        s2.style.opacity = rpg.skills.frostNova.cd > 0 ? '0.5' : '1.0';
      }
      const s3 = document.getElementById('btnSkill3');
      if (s3 && rpg.skills.meteor) {
        s3.style.opacity = rpg.skills.meteor.cd > 0 ? '0.5' : '1.0';
      }
      const s4 = document.getElementById('btnSkill4');
      if (s4 && rpg.skills.barrage) {
        s4.style.opacity = rpg.skills.barrage.cd > 0 ? '0.5' : '1.0';
      }
    }

    // 각성 초필살기 (X) 게이지 & 레디 상태
    const ultBtn = document.getElementById('btnUltimateSkill');
    const ultFill = document.getElementById('ultimateGaugeFill');
    if (ultFill) {
      ultFill.style.width = `${p.awakeningGauge || 0}%`;
    }
    if (ultBtn) {
      if ((p.awakeningGauge || 0) >= 100) {
        ultBtn.classList.add('ready');
      } else {
        ultBtn.classList.remove('ready');
      }
    }
  }

  // 군주 칙령 토글 팝업 바인딩
  const btnToggleRulerMenu = document.getElementById('btnToggleRulerMenu');
  const rulerMenuPopup = document.getElementById('rulerMenuPopup');
  if (btnToggleRulerMenu && rulerMenuPopup) {
    btnToggleRulerMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      rulerMenuPopup.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!rulerMenuPopup.contains(e.target) && e.target !== btnToggleRulerMenu) {
        rulerMenuPopup.classList.add('hidden');
      }
    });
  }

  function closeRulerPopup() {
    if (rulerMenuPopup) rulerMenuPopup.classList.add('hidden');
  }

  const btnDispatchFleet = document.getElementById('btnDispatchFleet');
  if (btnDispatchFleet) {
    btnDispatchFleet.addEventListener('click', () => {
      closeRulerPopup();
      entityMgr.dispatchTradeFleet();
    });
  }

  const btnDispatchCrusade = document.getElementById('btnDispatchCrusade');
  if (btnDispatchCrusade) {
    btnDispatchCrusade.addEventListener('click', () => {
      closeRulerPopup();
      entityMgr.dispatchCrusade();
    });
  }

  const btnCastBlessing = document.getElementById('btnCastBlessing');
  if (btnCastBlessing) {
    btnCastBlessing.addEventListener('click', () => {
      closeRulerPopup();
      entityMgr.castDivineBlessing();
    });
  }

  // 7. 카메라 추적 제어
  const followBanner = document.getElementById('followBanner');
  const followBannerText = document.getElementById('followBannerText');
  const btnFollowTarget = document.getElementById('btnFollowTarget');

  function startFollow(ent) {
    camera.followEntity = ent;
    followBanner.classList.remove('hidden');
    followBannerText.textContent = `🎥 추적 중: ${ent.icon} ${ent.name} (${ent.subClass})`;
  }

  function stopFollow() {
    camera.followEntity = null;
    followBanner.classList.add('hidden');
  }

  document.getElementById('btnStopFollow').addEventListener('click', stopFollow);
  btnFollowTarget.addEventListener('click', () => {
    if (selectedItem && selectedItem.type === 'entity') {
      startFollow(selectedItem.data);
    }
  });

  function smoothMoveCamera(tx, ty, targetZoom = null) {
    camera.x = tx;
    camera.y = ty;
    if (targetZoom !== null) camera.zoom = targetZoom;
    document.getElementById('zoomLevelText').textContent = `줌: ${camera.zoom.toFixed(2)}x`;
  }

  // 8. 마우스 및 키보드 입력 제어
  const keys = {};
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // 우클릭 메뉴 차단
    if (player) {
      // 🛡️ 우클릭: 적이 인근(5.0타일)에 있거나 교전 중일 때 방패 가드 & 퍼펙트 패링 우선 발동!
      const nearestHostile = entityMgr.spatialGrid
        ? entityMgr.spatialGrid.findNearest(player.x, player.y, 5.0, other => other !== player && other.hp > 0 && entityMgr.isHostile(player, other))
        : null;
      if (nearestHostile || player.state === 'combat' || player.combatTarget) {
        entityMgr.playerPerformParry(player);
        return;
      }

      // 평시 우클릭: 지정 위치로 플레이어 자동 이동
      const wPos = screenToWorld(e.clientX, e.clientY);
      isPlayerControlActive = true;
      updatePlayerControlUI();
      startFollow(player);
      player.targetX = Math.max(2, Math.min(WORLD_WIDTH - 3, wPos.x));
      player.targetY = Math.max(2, Math.min(WORLD_HEIGHT - 3, wPos.y));
      player.isMovingToTarget = true;
      entityMgr.addEffect(player.targetX, player.targetY, 1.8, '#facc15', 0.45);
    }
  });

  // 모바일 / 태블릿 터치로 플레이어 이동 및 타겟팅
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      const touch = e.touches[0];
      const wPos = screenToWorld(touch.clientX, touch.clientY);
      if (player) {
        isPlayerControlActive = true;
        updatePlayerControlUI();
        startFollow(player);
        player.targetX = Math.max(2, Math.min(WORLD_WIDTH - 3, wPos.x));
        player.targetY = Math.max(2, Math.min(WORLD_HEIGHT - 3, wPos.y));
        player.isMovingToTarget = true;
        entityMgr.addEffect(player.targetX, player.targetY, 1.8, '#facc15', 0.45);
      }
    }
  }, { passive: true });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      isDragging = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) > 4) {
      dragMoved = true;
      if (camera.followEntity !== player) stopFollow();
    }
    camera.x -= dx / (TILE_SIZE * camera.zoom);
    camera.y -= dy / (TILE_SIZE * camera.zoom);
    camera.x = Math.max(0, Math.min(WORLD_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT, camera.y));
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  canvas.addEventListener('mousemove', (e) => {
    const wPos = screenToWorld(e.clientX, e.clientY);
    renderer.mouseWorldTile = { x: Math.floor(wPos.x), y: Math.floor(wPos.y) };
  });

  window.addEventListener('mouseup', (e) => {
    if (isDragging && !dragMoved && e.target === canvas) {
      handleCanvasClick(e.clientX, e.clientY);
    }
    isDragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.14 : 0.88;
    const nextZoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom * zoomFactor));

    if (!camera.followEntity) {
      const before = screenToWorld(e.clientX, e.clientY);
      camera.zoom = nextZoom;
      const after = screenToWorld(e.clientX, e.clientY);
      camera.x += (before.x - after.x);
      camera.y += (before.y - after.y);
    } else {
      camera.zoom = nextZoom;
    }

    document.getElementById('zoomLevelText').textContent = `줌: ${camera.zoom.toFixed(2)}x`;
  }, { passive: false });

  // 미니맵 클릭/드래그 이동
  let miniDragging = false;
  function moveCameraFromMinimap(e) {
    const rect = minimapCanvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * WORLD_WIDTH;
    const my = ((e.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
    stopFollow();
    camera.x = Math.max(0, Math.min(WORLD_WIDTH, mx));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT, my));
  }
  minimapCanvas.addEventListener('mousedown', (e) => {
    miniDragging = true;
    moveCameraFromMinimap(e);
  });
  window.addEventListener('mousemove', (e) => {
    if (miniDragging) moveCameraFromMinimap(e);
  });
  window.addEventListener('mouseup', () => {
    miniDragging = false;
  });

  // 키보드 단축키
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'Digit1') {
      entityMgr.triggerPlayerSkill('1');
    } else if (e.code === 'Digit2') {
      entityMgr.triggerPlayerSkill('2');
    } else if (e.code === 'Digit3') {
      entityMgr.triggerPlayerSkill('3');
    } else if (e.code === 'Digit4') {
      entityMgr.triggerPlayerSkill('4');
    } else if (e.code === 'KeyJ') {
      if (!e.repeat) {
        entityMgr.startPlayerCharge(player);
      }
    } else if (e.code === 'KeyQ') {
      entityMgr.triggerPlayerSkill('Q');
    } else if (e.code === 'KeyE') {
      entityMgr.triggerPlayerSkill('E');
    } else if (e.code === 'KeyF') {
      entityMgr.triggerPlayerSkill('F');
    } else if (e.code === 'KeyZ') {
      entityMgr.triggerPlayerSkill('parry');
    } else if (e.code === 'KeyV') {
      entityMgr.triggerPlayerSkill('falcon');
    } else if (e.code === 'KeyX') {
      entityMgr.triggerPlayerSkill('ultimate');
    } else if (e.code === 'Tab') {
      e.preventDefault();
      entityMgr.triggerPlayerSkill('weaponSwap');
    } else if (e.code === 'KeyG') {
      if (entityMgr.rpgManager && entityMgr.rpgManager.awakening) {
        entityMgr.triggerPlayerSkill('G');
      } else {
        if (typeof window.openAwakeningModal === 'function') window.openAwakeningModal();
      }
    } else if (e.code === 'KeyR') {
      entityMgr.togglePlayerMount();
      updateMountUI();
    } else if (e.code === 'KeyB') {
      if (btnToggleBuild) btnToggleBuild.click();
    } else if (e.code === 'KeyC') {
      if (btnToggleCompanions) btnToggleCompanions.click();
    } else if (e.code === 'KeyI') {
      toggleInventory();
    } else if (e.code === 'KeyK') {
      toggleCrafting();
    } else if (e.code === 'KeyU') {
      toggleStatsModal();
    } else if (e.code === 'KeyT') {
      entityMgr.togglePetCompanion();
    } else if (e.code === 'BracketLeft') {
      if (btnToggleLeftSidebar) btnToggleLeftSidebar.click();
    } else if (e.code === 'BracketRight' || e.code === 'Backquote') {
      if (btnToggleRightSidebar) btnToggleRightSidebar.click();
    } else if (e.code === 'KeyH') {
      entityMgr.triggerPlayerSkill('H');
    } else if (e.code === 'KeyY') {
      document.body.classList.toggle('cinematic-mode');
    } else if (e.code === 'F11') {
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    } else if (e.code === 'KeyP') {
      isPlayerControlActive = !isPlayerControlActive;
      if (isPlayerControlActive) startFollow(player);
      updatePlayerControlUI();
    } else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      e.preventDefault();
      if (isPlayerControlActive) {
        entityMgr.playerDodgeRoll();
      } else {
        setWorldSpeed(worldTime.speed === 0 ? prevNonZeroSpeed : 0);
      }
    } else if (e.code === 'KeyM') {
      if (typeof window.openWorldMapModal === 'function') {
        if (worldMapModalEl && !worldMapModalEl.classList.contains('hidden')) {
          worldMapModalEl.classList.add('hidden');
        } else {
          window.openWorldMapModal();
        }
      }
    } else if (e.code === 'KeyZ') {
      if (typeof window.openRuneforgeModal === 'function') {
        if (runeforgeModalEl && !runeforgeModalEl.classList.contains('hidden')) {
          runeforgeModalEl.classList.add('hidden');
        } else {
          window.openRuneforgeModal();
        }
      }
    } else if (e.code === 'KeyV') {
      if (typeof window.openColosseumModal === 'function') {
        if (colosseumModalEl && !colosseumModalEl.classList.contains('hidden')) {
          colosseumModalEl.classList.add('hidden');
        } else {
          window.openColosseumModal();
        }
      }
    } else if (e.code === 'Digit5') {
      entityMgr.triggerPlayerSkill('5');
    } else if (e.code === 'Digit6') {
      entityMgr.triggerPlayerSkill('6');
    } else if (e.code === 'KeyN') {
      if (typeof window.openBountyModal === 'function') {
        if (bountyModalEl && !bountyModalEl.classList.contains('hidden')) {
          bountyModalEl.classList.add('hidden');
        } else {
          window.openBountyModal();
        }
      }
    } else if (e.code === 'KeyL') {
      if (typeof window.openCodexModal === 'function') {
        if (codexModalEl && !codexModalEl.classList.contains('hidden')) {
          codexModalEl.classList.add('hidden');
        } else {
          window.openCodexModal();
        }
      }
    } else if (e.code === 'KeyO') {
      if (btnOpenDungeon) btnOpenDungeon.click();
    } else if (e.code === 'Escape') {
      stopFollow();
      if (inventoryModalEl) inventoryModalEl.classList.add('hidden');
      if (craftingModalEl) craftingModalEl.classList.add('hidden');
      if (statsModalEl) statsModalEl.classList.add('hidden');
      if (dungeonModalEl) dungeonModalEl.classList.add('hidden');
      if (tavernModalEl) tavernModalEl.classList.add('hidden');
      if (awakeningModalEl) awakeningModalEl.classList.add('hidden');
      if (runeforgeModalEl) runeforgeModalEl.classList.add('hidden');
      if (colosseumModalEl) colosseumModalEl.classList.add('hidden');
      if (worldMapModalEl) worldMapModalEl.classList.add('hidden');
      if (bountyModalEl) bountyModalEl.classList.add('hidden');
      if (codexModalEl) codexModalEl.classList.add('hidden');
      if (buildPaletteEl) buildPaletteEl.classList.add('hidden');
      if (entityMgr.rpgManager) entityMgr.rpgManager.isBuildModeActive = false;
      if (btnToggleBuild) btnToggleBuild.classList.remove('active');
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'KeyJ') {
      entityMgr.releasePlayerCharge(player);
    }
  });

  // 클릭 시 대상 선택 및 건축 배치
  function handleCanvasClick(clientX, clientY) {
    if (typeof audioMgr !== 'undefined') audioMgr.resume();
    const wPos = screenToWorld(clientX, clientY);
    const wx = wPos.x;
    const wy = wPos.y;

    // 건축 모드 활성화 시 클릭한 지점에 구조물 배치
    if (entityMgr.rpgManager && entityMgr.rpgManager.isBuildModeActive) {
      const bTx = Math.floor(wx);
      const bTy = Math.floor(wy);
      entityMgr.rpgManager.placeStructure(entityMgr.rpgManager.selectedBuildType, bTx, bTy);
      return;
    }

    let pickedEntity = null;
    let minEntDist = 2.4 / Math.max(0.4, Math.min(1.2, camera.zoom));
    for (const ent of entityMgr.entities) {
      if (filterCategory !== 'all') {
        const match = (filterCategory === 'animal' && ent.role === 'animal') ||
                      (filterCategory === 'dragon' && ent.role === 'dragon') ||
                      (filterCategory === 'elf' && ent.race === 'elf') ||
                      (filterCategory === 'dwarf' && ent.race === 'dwarf') ||
                      (filterCategory === 'beastkin' && ent.race === 'beastkin') ||
                      (ent.category === filterCategory || ent.role === filterCategory) ||
                      (ent.role === 'player');
        if (!match) continue;
      }
      const d = Math.hypot(ent.x - wx, ent.y - wy);
      if (d < minEntDist) {
        minEntDist = d;
        pickedEntity = ent;
      }
    }

    if (pickedEntity) {
      selectedItem = { type: 'entity', data: pickedEntity };
      updateInspectorUI();

      // ⚔️ 플레이어 직접 인터랙션: 적 클릭 시 타겟팅 공격, 우호 NPC 클릭 시 전용 대화 & 보상 수령
      if (player && pickedEntity !== player) {
        const distToPlayer = Math.hypot(pickedEntity.x - player.x, pickedEntity.y - player.y);
        if (entityMgr.isHostile(player, pickedEntity)) {
          entityMgr.playerAttackTarget(pickedEntity);
          return;
        }
        if (pickedEntity.faction === 'kingdom' && distToPlayer <= 4.5) {
          entityMgr.interactWithNPC(player, pickedEntity);
          return;
        }
      }
      return;
    }

    for (const s of world.settlements) {
      if (Math.hypot(s.x - wx, s.y - wy) <= 3.2) {
        selectedItem = { type: 'settlement', data: s };
        updateInspectorUI();
        return;
      }
    }

    // 🌟 [젤다 BotW & 스카이림 스타일 완전 자유 이동 - 클릭 이동]
    // 들판, 초원, 숲, 도로, 해변 어디를 클릭하든 영웅이 즉각 그 위치로 이동!
    if (player) {
      isPlayerControlActive = true;
      updatePlayerControlUI();
      startFollow(player);
      player.targetX = Math.max(2, Math.min(WORLD_WIDTH - 3, wx));
      player.targetY = Math.max(2, Math.min(WORLD_HEIGHT - 3, wy));
      player.isMovingToTarget = true;
      entityMgr.addEffect(player.targetX, player.targetY, 1.8, '#facc15', 0.45);
      return;
    }
  }

  // 9. UI 업데이트
  function renderEventLogUI() {
    const container = document.getElementById('eventLogList');
    if (!container) return;
    const h = (typeof worldTime !== 'undefined' && worldTime) ? worldTime.hour : 8;
    const m = (typeof worldTime !== 'undefined' && worldTime) ? Math.floor(worldTime.minute) : 0;
    container.innerHTML = eventLogs.slice(0, 22).map((item, idx) => `
      <div class="log-item ${item.type}" data-idx="${idx}">
        <span class="log-time">[${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}]</span>
        ${item.text}
      </div>
    `).join('');

    container.querySelectorAll('.log-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = eventLogs[Number(el.dataset.idx)];
        if (item && item.x != null && camera) {
          stopFollow();
          smoothMoveCamera(item.x, item.y, Math.max(camera.zoom, 1.05));
        }
      });
    });
  }

  function updateInspectorUI() {
    const titleEl = document.getElementById('inspectorTitle');
    const contentEl = document.getElementById('inspectorContent');

    if (!selectedItem) {
      btnFollowTarget.classList.add('hidden');
      return;
    }

    if (selectedItem.type === 'entity') {
      const e = selectedItem.data;
      btnFollowTarget.classList.remove('hidden');
      titleEl.textContent = e.role === 'player'
        ? '🌟 플레이어 영웅 상태창'
        : (e.role === 'animal' ? '🐾 야생 동물 정보' : (e.role === 'dragon' ? '🐉 고대 드래곤 정보' : '👤 개체 상세 정보'));

      const hpPct = Math.max(0, Math.min(100, Math.round((e.hp / e.maxHp) * 100)));
      const home = world.settlementMap[e.homeId];
      const invItems = Object.entries(e.inventory || {})
        .filter(([, count]) => count > 0)
        .map(([k, count]) => `<span class="inv-tag">${GOODS_KR[k] || k}: ${count}</span>`)
        .join('');

      const raceName = RACE_LABELS[e.race] || '인간';
      const factionName = e.faction === 'monster' ? '몬스터/해적' : (e.faction === 'neutral' ? '중립 생태계' : '아테리아 연합');

      contentEl.innerHTML = `
        <div class="detail-header">
          <div class="detail-avatar">${e.icon}</div>
          <div>
            <div class="detail-name">${e.name}</div>
            <div class="detail-role">[${raceName}] ${e.subClass} · Lv.${e.level} (${factionName})</div>
          </div>
        </div>
        <div class="bar-row">
          <div class="bar-label">
            <span>생명력 (HP)</span>
            <strong>${Math.ceil(e.hp)} / ${e.maxHp}</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${hpPct}%; background:${e.faction === 'monster' ? '#ef4444' : (e.role === 'player' ? '#facc15' : (e.role === 'animal' ? '#10b981' : '#22c55e'))};"></div>
          </div>
        </div>
        <div style="margin: 6px 0; padding: 6px 8px; background: rgba(250, 204, 21, 0.1); border-left: 3px solid #facc15; border-radius: 4px; color: #fef08a; font-size: 11.5px;">
          ${e.thought}
        </div>
        <div class="detail-grid">
          <div class="detail-kv"><span>종족</span><strong>${raceName}</strong></div>
          <div class="detail-kv"><span>소속/서식지</span><strong>${home ? home.name : (e.role === 'animal' ? '대자연' : '방랑')}</strong></div>
          <div class="detail-kv"><span>보유 골드</span><strong style="color:#facc15;">🪙 ${e.gold.toLocaleString()} G</strong></div>
          <div class="detail-kv"><span>전투력(공격력)</span><strong>⚔️ ${e.atk}</strong></div>
        </div>
        ${invItems ? `
          <div style="margin-top:7px; font-size:11px; color:#94a3b8;">보유 물자 및 교역품:</div>
          <div class="inv-tags">${invItems}</div>
        ` : ''}
      `;
    } else if (selectedItem.type === 'settlement') {
      const s = selectedItem.data;
      btnFollowTarget.classList.add('hidden');
      titleEl.textContent = '🏰 거점 / 항구 상세 정보';

      const citizens = entityMgr.entities.filter(e => e.homeId === s.id).length;
      const stockTags = Object.entries(s.stocks || {})
        .map(([k, v]) => `<span class="inv-tag">${GOODS_KR[k] || k}: <strong>${v}</strong> (${s.prices?.[k] || '-'}G)</span>`)
        .join('');

      contentEl.innerHTML = `
        <div class="detail-header">
          <div class="detail-avatar">${s.icon}</div>
          <div>
            <div class="detail-name">${s.name}</div>
            <div class="detail-role">${s.subtitle}</div>
          </div>
        </div>
        <p style="font-size:11.5px; color:#cbd5e1; margin-bottom:8px;">${s.description}</p>
        <div class="detail-grid">
          <div class="detail-kv"><span>영지 금고</span><strong style="color:#facc15;">🪙 ${s.gold.toLocaleString()} G</strong></div>
          <div class="detail-kv"><span>상주 주민/함선</span><strong>👥 ${citizens}명</strong></div>
        </div>
        ${stockTags ? `
          <div style="margin-top:7px; font-size:11px; color:#94a3b8;">특산물 비축량 & 현지 시세:</div>
          <div class="inv-tags">${stockTags}</div>
        ` : ''}
        <div style="margin-top: 10px;">
          <button id="btnTeleportToSettlement" class="hud-btn" style="width:100%; justify-content:center; background:rgba(168, 85, 247, 0.22); border-color:#a855f7; color:#f3e8ff;">
            🌀 [${s.name}] 순간이동 차원문 열기
          </button>
        </div>
      `;

      const btnTeleport = document.getElementById('btnTeleportToSettlement');
      if (btnTeleport) {
        btnTeleport.addEventListener('click', () => {
          if (entityMgr.rpgManager) {
            entityMgr.rpgManager.teleportTo(s.id);
            startFollow(player);
          }
        });
      }
    }
  }

  function updateEconomyTableUI() {
    const container = document.getElementById('economyTableContainer');
    const kingdomTowns = world.settlements.filter(s => s.faction === 'kingdom');
    container.innerHTML = kingdomTowns.map(s => `
      <div class="econ-row" data-id="${s.id}">
        <span class="econ-name">${s.icon} ${s.name}</span>
        <div class="econ-stocks">
          <span title="밀">🌾${s.stocks.wheat || 0}</span>
          <span title="생선">🐟${s.stocks.fish || 0}</span>
          <span title="향신료">🌶️${s.stocks.spices || 0}</span>
          <span title="보석">💎${s.stocks.gems || 0}</span>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.econ-row').forEach(row => {
      row.addEventListener('click', () => {
        const s = world.settlementMap[row.dataset.id];
        if (s) {
          stopFollow();
          smoothMoveCamera(s.x, s.y, 1.05);
          selectedItem = { type: 'settlement', data: s };
          updateInspectorUI();
        }
      });
    });
  }

  function updateTopHudUI() {
    const h = worldTime.hour;
    let period = '낮';
    let icon = '☀️';
    if (h >= 21 || h < 5) { period = '심야'; icon = '🌙'; }
    else if (h >= 5 && h < 8) { period = '새벽'; icon = '🌅'; }
    else if (h >= 18 && h < 21) { period = '황혼'; icon = '🌇'; }

    document.getElementById('dayNightIcon').textContent = icon;
    document.getElementById('worldDateText').textContent =
      `제 1년 ${worldTime.seasons[worldTime.seasonIndex]} · ${worldTime.day}일차`;
    document.getElementById('worldClockText').textContent =
      `${String(h).padStart(2, '0')}:${String(Math.floor(worldTime.minute)).padStart(2, '0')} (${period})`;

    const weatherMap = {
      clear:  { icon: '🌤️', text: '맑음' },
      cloudy: { icon: '⛅', text: '구름 조금' },
      rain:   { icon: '🌧️', text: '대양의 비' }
    };
    const wInfo = weatherMap[worldTime.weather] || weatherMap.clear;
    document.getElementById('weatherIcon').textContent = wInfo.icon;
    document.getElementById('weatherText').textContent = wInfo.text;

    let animalCount = 0;
    let npcCount = 0;
    let caravanCount = 0;
    let monsterCount = 0;
    let entityGold = 0;
    const ents = entityMgr.entities;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.role === 'animal') animalCount++;
      if (e.faction === 'kingdom') npcCount++;
      if (e.role === 'merchant' || e.role === 'sea_merchant') caravanCount++;
      if (e.faction === 'monster') monsterCount++;
      entityGold += (e.gold || 0);
    }
    const townGold = world.settlements.reduce((acc, s) => acc + (s.gold || 0), 0);

    const elAnimal = document.getElementById('statAnimalCount');
    if (elAnimal) elAnimal.textContent = animalCount;
    document.getElementById('statNpcCount').textContent = npcCount;
    document.getElementById('statCaravanCount').textContent = caravanCount;
    document.getElementById('statMonsterCount').textContent = monsterCount;
    document.getElementById('statBattleCount').textContent = entityMgr.activeBattles;
    document.getElementById('statTotalGold').textContent = (entityGold + townGold).toLocaleString();
  }

  renderEventLogUI();
  updateEconomyTableUI();
  updateTopHudUI();
  updatePlayerControlUI();

  // 10. 메인 루프
  let lastTime = performance.now();
  let uiTick = 0;

  function loop(now) {
    const rawDt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    // 플레이어 입력 벡터 계산
    const playerInput = { dx: 0, dy: 0 };
    if (isPlayerControlActive) {
      if (keys['KeyW'] || keys['ArrowUp']) playerInput.dy -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) playerInput.dy += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) playerInput.dx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) playerInput.dx += 1;
    } else {
      // 자유 카메라 이동
      const panSpeed = (32 / camera.zoom) * rawDt;
      if (keys['KeyW'] || keys['ArrowUp']) { stopFollow(); camera.y -= panSpeed; }
      if (keys['KeyS'] || keys['ArrowDown']) { stopFollow(); camera.y += panSpeed; }
      if (keys['KeyA'] || keys['ArrowLeft']) { stopFollow(); camera.x -= panSpeed; }
      if (keys['KeyD'] || keys['ArrowRight']) { stopFollow(); camera.x += panSpeed; }
    }

    camera.x = Math.max(0, Math.min(WORLD_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT, camera.y));

    // 시뮬레이션 시간 진행 (타격 정지 피격 스톱: camera.screenFreeze, 불릿타임 저스트 회피 시간왜곡: entityMgr.bulletTimeTimer)
    let simDt = rawDt * worldTime.speed;
    if (camera.screenFreeze > 0) {
      camera.screenFreeze -= rawDt;
      simDt = 0;
    } else if (entityMgr && entityMgr.bulletTimeTimer > 0) {
      entityMgr.bulletTimeTimer -= rawDt;
      simDt *= 0.28; // 극적인 1/4 슬로우모션 연출!
    }
    if (simDt > 0) {
      worldTime.minute += simDt * 8;
      if (worldTime.minute >= 60) {
        worldTime.minute -= 60;
        worldTime.hour++;
        if (worldTime.hour >= 24) {
          worldTime.hour = 0;
          worldTime.day++;
          if (worldTime.day % 10 === 0) {
            worldTime.seasonIndex = (worldTime.seasonIndex + 1) % 4;
          }
        }
      }

      worldTime.weatherTimer -= simDt;
      if (worldTime.weatherTimer <= 0) {
        worldTime.weatherTimer = 45 + Math.random() * 40;
        const r = Math.random();
        worldTime.weather = r < 0.65 ? 'clear' : (r < 0.85 ? 'cloudy' : 'rain');
      }

      entityMgr.update(simDt, worldTime, playerInput);
    }

    // 카메라 추적 (플레이어 조작 중에는 프레임레이트 독립적 지수 보간 팔로우 - Butter Smooth Camera)
    if (camera.followEntity) {
      const followLerp = 1 - Math.exp(-12.5 * rawDt);
      camera.x += (camera.followEntity.x - camera.x) * followLerp;
      camera.y += (camera.followEntity.y - camera.y) * followLerp;
    }

    // 카메라 셰이크 & 줌 펄스 감쇠 (Smooth Screen Shake & Lens Punch Decay)
    if (camera.shake > 0) {
      camera.shake = Math.max(0, camera.shake - rawDt * 22);
    }
    if (camera.zoomPulse > 0) {
      camera.zoomPulse = Math.max(0, camera.zoomPulse - rawDt * 4.0);
    }
    if (camera.cinematicBarsTimer > 0) {
      camera.cinematicBarsTimer = Math.max(0, camera.cinematicBarsTimer - rawDt);
    }

    renderer.render(camera, worldTime, filterCategory, selectedItem, now / 1000);

    uiTick += rawDt;
    if (uiTick > 0.25) {
      uiTick = 0;
      updateTopHudUI();
      updateEconomyTableUI();
      updateQuestHudUI();
      updateSettlementPromptUI();
      updateMountUI();
      updateWorldEventUI();
      updateNavCompassUI();
      updateHeroBarsUI();
      if (craftingModalEl && !craftingModalEl.classList.contains('hidden')) updateCraftingUI();
      if (statsModalEl && !statsModalEl.classList.contains('hidden')) updateStatsModalUI();
      if (selectedItem) updateInspectorUI();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

// 브라우저 DOM 준비 상태에 따른 즉각 실행 보장 (ReadyState Guard)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startFantasyWorld);
} else {
  startFantasyWorld();
}
