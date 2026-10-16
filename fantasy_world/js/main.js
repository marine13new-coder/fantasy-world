// ============================================================================
// main.js - 메인 시뮬레이션 루프, 자유 카메라 컨트롤, UI 인터랙션, 이벤트 피드
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

  // 1. 월드 및 엔티티 매니저 초기화
  const world = generateWorld();
  const eventLogs = [];

  const entityMgr = new EntityManager(world, (logItem) => {
    eventLogs.unshift(logItem);
    if (eventLogs.length > 40) eventLogs.pop();
    renderEventLogUI();
  });
  entityMgr.spawnInitialPopulation();

  const renderer = new WorldRenderer(canvas, minimapCanvas, world, entityMgr);

  // 2. 카메라 & 월드 시간 상태
  const camera = {
    x: world.settlementMap.solaris.x,
    y: world.settlementMap.solaris.y,
    zoom: 0.9,
    minZoom: 0.18,
    maxZoom: 2.5,
    followEntity: null
  };

  const worldTime = {
    day: 1,
    seasonIndex: 0,
    seasons: ['봄', '여름', '가을', '겨울'],
    hour: 8,
    minute: 0,
    speed: 1,
    weather: 'clear', // 'clear', 'cloudy', 'rain'
    weatherTimer: 35
  };

  let filterCategory = 'all';
  let selectedItem = null; // { type: 'entity' | 'settlement', data: ... }

  // 초기 환영 로그
  entityMgr.log('quest', '👑 아테리아 대륙의 새로운 아침이 밝았습니다. 왕도와 각 마을의 상인·농부·어부·모험가들이 일과를 시작합니다!', camera.x, camera.y);
  entityMgr.log('trade', '🐎 왕도 솔라리스와 황금밀 마을, 푸른파도 항구, 아이언포지 광산 간 무역 마차 운행이 개시되었습니다.', 96, 110);
  entityMgr.log('battle', '⚔️ 동부 발로르 변경 요새의 용병단과 모험가들이 오크 요새 및 고블린 군락 토벌에 나섰습니다.', 154, 116);

  // 3. 좌측 거점 이동 버튼 생성
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

  // 대륙 전체 지도 보기 버튼
  document.getElementById('btnZoomContinent').addEventListener('click', () => {
    stopFollow();
    smoothMoveCamera(WORLD_SIZE / 2, WORLD_SIZE / 2, 0.22);
  });

  // 4. 필터 칩 바인딩
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterCategory = chip.dataset.filter;
    });
  });

  // 무역 중인 상인 따라가기 버튼
  document.getElementById('btnFindRandomMerchant').addEventListener('click', () => {
    const merchants = entityMgr.entities.filter(e => e.role === 'merchant');
    if (merchants.length > 0) {
      const pick = merchants[Math.floor(Math.random() * merchants.length)];
      selectedItem = { type: 'entity', data: pick };
      startFollow(pick);
      camera.zoom = Math.max(camera.zoom, 1.15);
      updateInspectorUI();
    }
  });

  // 현재 전투 현장으로 이동 버튼
  document.getElementById('btnFindBattle').addEventListener('click', () => {
    const fighters = entityMgr.entities.filter(e => e.state === 'combat' && e.faction === 'kingdom');
    if (fighters.length > 0) {
      const pick = fighters[Math.floor(Math.random() * fighters.length)];
      selectedItem = { type: 'entity', data: pick };
      startFollow(pick);
      camera.zoom = Math.max(camera.zoom, 1.2);
      updateInspectorUI();
    } else {
      // 전투가 없으면 변경 요새나 오크 전선으로 이동
      const orc = world.settlementMap.orc_stronghold;
      stopFollow();
      smoothMoveCamera((orc.x + 154) / 2, (orc.y + 116) / 2, 0.95);
    }
  });

  // 5. 배속 조절 버튼
  let prevNonZeroSpeed = 1;
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const spd = Number(btn.dataset.speed);
      setWorldSpeed(spd);
    });
  });

  function setWorldSpeed(spd) {
    if (spd > 0) prevNonZeroSpeed = spd;
    worldTime.speed = spd;
    document.querySelectorAll('.speed-btn').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.speed) === spd);
    });
  }

  // 6. 카메라 추적 제어
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

  // 7. 마우스 드래그, 휠 줌, 클릭 선택 이벤트
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) > 4) {
      dragMoved = true;
      stopFollow();
    }
    camera.x -= dx / (TILE_SIZE * camera.zoom);
    camera.y -= dy / (TILE_SIZE * camera.zoom);
    camera.x = Math.max(0, Math.min(WORLD_SIZE, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_SIZE, camera.y));
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

    // 마우스 커서 위치 기준 줌 보정
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

  // 미니맵 클릭/드래그 카메라 이동
  let miniDragging = false;
  function moveCameraFromMinimap(e) {
    const rect = minimapCanvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * WORLD_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * WORLD_SIZE;
    stopFollow();
    camera.x = Math.max(0, Math.min(WORLD_SIZE, mx));
    camera.y = Math.max(0, Math.min(WORLD_SIZE, my));
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

  // 키보드 단축키 (WASD, 화살표, Space, M, ESC)
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      setWorldSpeed(worldTime.speed === 0 ? prevNonZeroSpeed : 0);
    } else if (e.code === 'KeyM') {
      stopFollow();
      smoothMoveCamera(WORLD_SIZE / 2, WORLD_SIZE / 2, 0.22);
    } else if (e.code === 'Escape') {
      stopFollow();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // 캔버스 클릭 시 NPC 또는 거점 선택
  function handleCanvasClick(clientX, clientY) {
    const wx = camera.x + (clientX - canvas.width / 2) / (TILE_SIZE * camera.zoom);
    const wy = camera.y + (clientY - canvas.height / 2) / (TILE_SIZE * camera.zoom);

    // 1. 가장 가까운 엔티티 검사
    let pickedEntity = null;
    let minEntDist = 2.2 / Math.max(0.4, Math.min(1.2, camera.zoom));
    for (const ent of entityMgr.entities) {
      if (filterCategory !== 'all' && ent.category !== filterCategory) continue;
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

    // 2. 거점 클릭 검사
    for (const s of world.settlements) {
      if (Math.hypot(s.x - wx, s.y - wy) <= s.radius) {
        selectedItem = { type: 'settlement', data: s };
        updateInspectorUI();
        return;
      }
    }
  }

  // 8. UI 업데이트 함수들
  function renderEventLogUI() {
    const container = document.getElementById('eventLogList');
    container.innerHTML = eventLogs.slice(0, 22).map((item, idx) => `
      <div class="log-item ${item.type}" data-idx="${idx}">
        <span class="log-time">[${String(worldTime.hour).padStart(2, '0')}:${String(Math.floor(worldTime.minute)).padStart(2, '0')}]</span>
        ${item.text}
      </div>
    `).join('');

    container.querySelectorAll('.log-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = eventLogs[Number(el.dataset.idx)];
        if (item && item.x != null) {
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
      titleEl.textContent = '👤 인물 / 개체 상세 정보';

      const hpPct = Math.max(0, Math.min(100, Math.round((e.hp / e.maxHp) * 100)));
      const home = world.settlementMap[e.homeId];
      const invItems = Object.entries(e.inventory || {})
        .filter(([, count]) => count > 0)
        .map(([k, count]) => `<span class="inv-tag">${GOODS_KR[k] || k}: ${count}</span>`)
        .join('');

      contentEl.innerHTML = `
        <div class="detail-header">
          <div class="detail-avatar">${e.icon}</div>
          <div>
            <div class="detail-name">${e.name}</div>
            <div class="detail-role">${e.subClass} · Lv.${e.level} (${e.faction === 'monster' ? '몬스터 군단' : '아테리아 왕국'})</div>
          </div>
        </div>
        <div class="bar-row">
          <div class="bar-label">
            <span>생명력 (HP)</span>
            <strong>${Math.ceil(e.hp)} / ${e.maxHp}</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${hpPct}%; background:${e.faction === 'monster' ? '#ef4444' : '#22c55e'};"></div>
          </div>
        </div>
        <div style="margin: 6px 0; padding: 6px 8px; background: rgba(250, 204, 21, 0.1); border-left: 3px solid #facc15; border-radius: 4px; color: #fef08a; font-size: 11.5px;">
          ${e.thought}
        </div>
        <div class="detail-grid">
          <div class="detail-kv"><span>소속 거점</span><strong>${home ? home.name : '-'}</strong></div>
          <div class="detail-kv"><span>보유 골드</span><strong style="color:#facc15;">🪙 ${e.gold} G</strong></div>
          <div class="detail-kv"><span>전투 공격력</span><strong>⚔️ ${e.atk}</strong></div>
          <div class="detail-kv"><span>처치(토벌) 수</span><strong>🏆 ${e.kills}회</strong></div>
        </div>
        <div style="margin-top:7px; font-size:11px; color:#94a3b8;">보유 물자 및 전리품:</div>
        <div class="inv-tags">
          ${invItems || '<span class="inv-tag" style="color:#64748b;">보유 물품 없음</span>'}
        </div>
      `;
    } else if (selectedItem.type === 'settlement') {
      const s = selectedItem.data;
      btnFollowTarget.classList.add('hidden');
      titleEl.textContent = '🏰 거점 / 영지 상세 정보';

      const citizens = entityMgr.entities.filter(e => e.homeId === s.id).length;
      const stockTags = Object.entries(s.stocks || {})
        .map(([k, v]) => `<span class="inv-tag">${GOODS_KR[k]}: <strong>${v}</strong> (${s.prices?.[k] || '-'}G)</span>`)
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
          <div class="detail-kv"><span>소속 주민/병력</span><strong>👥 ${citizens}명</strong></div>
        </div>
        ${stockTags ? `
          <div style="margin-top:7px; font-size:11px; color:#94a3b8;">비축 교역 물자 (시세):</div>
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
          <span title="광석">⛏️${s.stocks.ore || 0}</span>
          <span title="무기">⚔️${s.stocks.weapons || 0}</span>
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
      rain:   { icon: '🌧️', text: '봄비 내림' }
    };
    const wInfo = weatherMap[worldTime.weather] || weatherMap.clear;
    document.getElementById('weatherIcon').textContent = wInfo.icon;
    document.getElementById('weatherText').textContent = wInfo.text;

    const npcs = entityMgr.entities.filter(e => e.faction === 'kingdom');
    const caravans = entityMgr.entities.filter(e => e.role === 'merchant');
    const monsters = entityMgr.entities.filter(e => e.faction === 'monster');
    const entityGold = entityMgr.entities.reduce((acc, e) => acc + (e.gold || 0), 0);
    const townGold = world.settlements.reduce((acc, s) => acc + (s.gold || 0), 0);

    document.getElementById('statNpcCount').textContent = npcs.length;
    document.getElementById('statCaravanCount').textContent = caravans.length;
    document.getElementById('statMonsterCount').textContent = monsters.length;
    document.getElementById('statBattleCount').textContent = entityMgr.activeBattles;
    document.getElementById('statTotalGold').textContent = (entityGold + townGold).toLocaleString();
  }

  // 초기 UI 렌더링
  renderEventLogUI();
  updateEconomyTableUI();
  updateTopHudUI();

  // 9. 메인 애니메이션 & 시뮬레이션 루프
  let lastTime = performance.now();
  let uiTick = 0;

  function loop(now) {
    const rawDt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    // 키보드 카메라 이동 처리
    const panSpeed = (28 / camera.zoom) * rawDt;
    if (keys['KeyW'] || keys['ArrowUp']) { stopFollow(); camera.y -= panSpeed; }
    if (keys['KeyS'] || keys['ArrowDown']) { stopFollow(); camera.y += panSpeed; }
    if (keys['KeyA'] || keys['ArrowLeft']) { stopFollow(); camera.x -= panSpeed; }
    if (keys['KeyD'] || keys['ArrowRight']) { stopFollow(); camera.x += panSpeed; }

    camera.x = Math.max(0, Math.min(WORLD_SIZE, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_SIZE, camera.y));

    // 시뮬레이션 시간 진행
    const simDt = rawDt * worldTime.speed;
    if (simDt > 0) {
      worldTime.minute += simDt * 8; // 1초당 게임 내 8분 진행 (1배속 기준)
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

      // 날씨 변화
      worldTime.weatherTimer -= simDt;
      if (worldTime.weatherTimer <= 0) {
        worldTime.weatherTimer = 45 + Math.random() * 40;
        const r = Math.random();
        worldTime.weather = r < 0.65 ? 'clear' : (r < 0.85 ? 'cloudy' : 'rain');
      }

      entityMgr.update(simDt, worldTime);
    }

    // 카메라 추적 대상이 있으면 부드럽게 따라가기
    if (camera.followEntity) {
      camera.x += (camera.followEntity.x - camera.x) * 0.15;
      camera.y += (camera.followEntity.y - camera.y) * 0.15;
    }

    // 월드 렌더링
    renderer.render(camera, worldTime, filterCategory, selectedItem, now / 1000);

    // 주기적 UI 갱신 (0.3초 마다)
    uiTick += rawDt;
    if (uiTick > 0.3) {
      uiTick = 0;
      updateTopHudUI();
      updateEconomyTableUI();
      if (selectedItem) updateInspectorUI();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
