// ============================================================================
// main.js - 메인 시뮬레이션 루프, 플레이어 직접 조작(RPG/항해 모드), 군주 칙령, UI 인터랙션
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('worldCanvas');
  const minimapCanvas = document.getElementById('minimapCanvas');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

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

  const renderer = new WorldRenderer(canvas, minimapCanvas, world, entityMgr);

  // 2. 카메라 및 시뮬레이션 상태
  let isPlayerControlActive = true;

  camera = {
    x: player.x,
    y: player.y,
    zoom: 0.95,
    minZoom: 0.10,
    maxZoom: 2.8,
    followEntity: player
  };

  let filterCategory = 'all';
  let selectedItem = { type: 'entity', data: player };

  // 초기 안내 로그
  entityMgr.log('quest', '👑 480×320 초대형 오픈월드 대륙과 바다 너머 4개 신대륙이 정식 개방되었습니다!', camera.x, camera.y);
  entityMgr.log('trade', '⛵ 푸른파도 대항구 ↔ 엘븐하임 ↔ 미라주 사막 ↔ 세이렌 산호섬 대양 무역항로가 연결되었습니다.', 235, 195);
  entityMgr.log('battle', '🐉 서부 천공의 용의 둥지와 대해양 해골초도 해적선단이 대륙 각지를 위협하고 있습니다.', 35, 135);

  // 3. 거점 리스트 버튼 동적 생성
  const regionListEl = document.getElementById('regionList');
  for (const s of world.settlements) {
    const btn = document.createElement('button');
    btn.className = 'region-btn' + (s.danger ? ' danger' : '');
    btn.innerHTML = `<span>${s.icon}</span> <span>${s.name}</span>`;
    btn.addEventListener('click', () => {
      stopFollow();
      smoothMoveCamera(s.x, s.y, 1.05);
      selectedItem = { type: 'settlement', data: s };
      updateInspectorUI();
    });
    regionListEl.appendChild(btn);
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
      ? '직접 조작 중 (WASD / 우클릭)'
      : '자유 관찰 모드 (P 키로 전환)';
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

  // 군주 칙령 바인딩
  document.getElementById('btnDispatchFleet').addEventListener('click', () => entityMgr.dispatchTradeFleet());
  document.getElementById('btnDispatchCrusade').addEventListener('click', () => entityMgr.dispatchCrusade());
  document.getElementById('btnCastBlessing').addEventListener('click', () => entityMgr.castDivineBlessing());

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
    // 우클릭으로 플레이어 이동 또는 타겟팅
    const wx = camera.x + (e.clientX - canvas.width / 2) / (TILE_SIZE * camera.zoom);
    const wy = camera.y + (e.clientY - canvas.height / 2) / (TILE_SIZE * camera.zoom);
    player.targetX = Math.max(2, Math.min(WORLD_WIDTH - 3, wx));
    player.targetY = Math.max(2, Math.min(WORLD_HEIGHT - 3, wy));
    entityMgr.addEffect(player.targetX, player.targetY, 1.8, '#facc15', 0.45);
  });

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
      const wxBefore = camera.x + (e.clientX - canvas.width / 2) / (TILE_SIZE * camera.zoom);
      const wyBefore = camera.y + (e.clientY - canvas.height / 2) / (TILE_SIZE * camera.zoom);
      camera.zoom = nextZoom;
      const wxAfter = camera.x + (e.clientX - canvas.width / 2) / (TILE_SIZE * camera.zoom);
      const wyAfter = camera.y + (e.clientY - canvas.height / 2) / (TILE_SIZE * camera.zoom);
      camera.x += (wxBefore - wxAfter);
      camera.y += (wyBefore - wyAfter);
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

    if (e.code === 'KeyQ') {
      entityMgr.triggerPlayerSkill('Q');
    } else if (e.code === 'KeyE') {
      entityMgr.triggerPlayerSkill('E');
    } else if (e.code === 'KeyF') {
      entityMgr.triggerPlayerSkill('F');
    } else if (e.code === 'KeyR') {
      entityMgr.togglePlayerMount();
      updateMountUI();
    } else if (e.code === 'KeyP') {
      isPlayerControlActive = !isPlayerControlActive;
      if (isPlayerControlActive) startFollow(player);
      updatePlayerControlUI();
    } else if (e.code === 'Space') {
      e.preventDefault();
      if (isPlayerControlActive) {
        entityMgr.togglePlayerMount();
        updateMountUI();
      } else {
        setWorldSpeed(worldTime.speed === 0 ? prevNonZeroSpeed : 0);
      }
    } else if (e.code === 'KeyM') {
      stopFollow();
      smoothMoveCamera(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 0.18);
    } else if (e.code === 'Escape') {
      stopFollow();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // 클릭 시 대상 선택
  function handleCanvasClick(clientX, clientY) {
    const wx = camera.x + (clientX - canvas.width / 2) / (TILE_SIZE * camera.zoom);
    const wy = camera.y + (clientY - canvas.height / 2) / (TILE_SIZE * camera.zoom);

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
      return;
    }

    for (const s of world.settlements) {
      if (Math.hypot(s.x - wx, s.y - wy) <= s.radius) {
        selectedItem = { type: 'settlement', data: s };
        updateInspectorUI();
        return;
      }
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
      `;
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

    // 시뮬레이션 시간 진행
    const simDt = rawDt * worldTime.speed;
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

    // 카메라 추적 (플레이어 조작 중에는 플레이어를 부드럽게 팔로우)
    if (camera.followEntity) {
      camera.x += (camera.followEntity.x - camera.x) * 0.15;
      camera.y += (camera.followEntity.y - camera.y) * 0.15;
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
      if (selectedItem) updateInspectorUI();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
