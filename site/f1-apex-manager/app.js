// =========================================================================
// F1 APEX MOTORSPORT MANAGER & 3D GRAND PRIX SIMULATOR - UI CONTROLLER
// Connects F1CareerManager, F1Race3DEngine, Pit Wall Strategy & Broadcast HUD
// =========================================================================

class F1AppController {
    constructor() {
        this.career = window.f1Career;
        this.raceEngine = null;
        this.qualiSetup = 'BALANCED';
        this.activeTab = 'hq';

        this.init();
    }

    init() {
        this.bindTabNavigation();
        this.bindHeaderButtons();
        this.renderAllTabs();

        // Initialize 3D Race Engine
        this.raceEngine = new window.F1Race3DEngine('race3dCanvasContainer');
        this.raceEngine.onTelemetryUpdate = (snapshot) => this.updateRaceBroadcastHUD(snapshot);
        this.raceEngine.onRadioMessage = (code, msg) => this.appendTeamRadioMessage(code, msg);
        this.raceEngine.onRaceFinished = (results) => this.handleGrandPrixFinished(results);
    }

    bindTabNavigation() {
        const btns = document.querySelectorAll('.f1-tab-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                window.f1Audio.playUiClick(false);
                const tabId = btn.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.f1-tab-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.f1-tab-panel').forEach(p => {
            p.classList.toggle('active', p.id === `tab-${tabId}`);
        });

        if (tabId === 'race3d') {
            if (!this.raceEngine.isRunning || this.raceEngine.racePhase === 'IDLE' || this.raceEngine.racePhase === 'FINISHED') {
                this.launch3DGrandPrix();
            } else {
                setTimeout(() => this.raceEngine.handleResize(), 50);
            }
        } else {
            if (this.raceEngine && this.raceEngine.isRunning) {
                window.f1Audio.stopEngineSound();
            }
            this.renderAllTabs();
        }
    }

    bindHeaderButtons() {
        const teamModalBtn = document.getElementById('openTeamSelectModalBtn');
        if (teamModalBtn) {
            teamModalBtn.addEventListener('click', () => {
                window.f1Audio.playUiClick(false);
                this.openTeamSelectionModal();
            });
        }

        const muteBtn = document.getElementById('toggleAudioMuteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = window.f1Audio.toggleMute();
                muteBtn.textContent = isMuted ? '🔇 음소거됨' : '🔊 사운드';
            });
        }
    }

    showToast(msg) {
        let toast = document.getElementById('f1GlobalToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'f1GlobalToast';
            toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999;background:#0f131d;border:1px solid #00f0ff;border-left:5px solid #e10600;color:#fff;padding:13px 20px;border-radius:8px;font-weight:800;font-size:0.88rem;box-shadow:0 12px 30px rgba(0,0,0,0.85);transition:opacity 0.25s;';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.style.opacity = '0';
        }, 3200);
    }

    renderAllTabs() {
        this.renderHeaderBar();
        this.renderHqTab();
        this.renderRdTab();
        this.renderDriversTab();
        this.renderStandingsTab();
        this.renderFinanceTab();
    }

    renderHeaderBar() {
        const team = this.career.getPlayerTeam();
        const circuit = this.career.getCurrentCircuit();
        const s = this.career.state;

        document.getElementById('headerRoundBanner').textContent =
            `${s.seasonYear} FIA FORMULA 1 WORLD CHAMPIONSHIP • ROUND ${circuit.round}/10 (${circuit.name})`;
        document.getElementById('headerBudgetDisplay').textContent =
            `💰 Cost Cap: $${(team.budget / 1000000).toFixed(2)}M`;
        document.getElementById('headerTeamName').textContent = team.name;
        document.getElementById('headerTeamColorDot').style.background = team.primaryColor;
    }

    // =========================================================================
    // TAB 1: PADDOCK HQ, CIRCUIT BRIEFING & QUALIFYING SHOOTOUT
    // =========================================================================
    renderHqTab() {
        const team = this.career.getPlayerTeam();
        const drivers = this.career.getTeamDrivers(team.id);
        const circuit = this.career.getCurrentCircuit();
        const cPoints = this.career.state.constructorPoints[team.id] || { points: 0, wins: 0, podiums: 0 };

        const heroEl = document.getElementById('hqTeamHeroCard');
        if (heroEl) {
            heroEl.innerHTML = `
                <div class="f1-card-header" style="border-left:4px solid ${team.primaryColor}; padding-left:12px;">
                    <div>
                        <div style="font-size:0.75rem; color:${team.primaryColor}; font-weight:800;">${team.country} • ENGINE: ${team.engine}</div>
                        <div class="f1-card-title" style="font-size:1.3rem;">${team.name}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.75rem; color:#94a3b8;">팀 프린시펄: <b style="color:#fff;">${team.principal}</b></div>
                        <div style="font-family:var(--font-mono); font-size:0.95rem; color:#facc15; font-weight:800;">
                            시즌 ${cPoints.points} PTS • ${cPoints.wins}승 • ${cPoints.podiums}포디움
                        </div>
                    </div>
                </div>

                <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:16px;">${team.desc}</p>

                <!-- Car Performance Specs -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:16px;">
                    <div class="spec-bar-row">
                        <div class="spec-bar-label"><span>🌪️ 에어로다이내믹 (Aero)</span><span style="color:#38bdf8;">${team.specs.aero}/100</span></div>
                        <div class="spec-bar-track"><div class="spec-bar-fill" style="width:${team.specs.aero}%; background:#38bdf8;"></div></div>
                    </div>
                    <div class="spec-bar-row">
                        <div class="spec-bar-label"><span>⚡ 파워유닛 & ERS (Power)</span><span style="color:#f59e0b;">${team.specs.powertrain}/100</span></div>
                        <div class="spec-bar-track"><div class="spec-bar-fill" style="width:${team.specs.powertrain}%; background:#f59e0b;"></div></div>
                    </div>
                    <div class="spec-bar-row">
                        <div class="spec-bar-label"><span>🛞 섀시 & 타이어보존 (Chassis)</span><span style="color:#10b981;">${team.specs.chassis}/100</span></div>
                        <div class="spec-bar-track"><div class="spec-bar-fill" style="width:${team.specs.chassis}%; background:#10b981;"></div></div>
                    </div>
                    <div class="spec-bar-row">
                        <div class="spec-bar-label"><span>🔧 내구성 & 피트스톱 (Durability)</span><span style="color:#a855f7;">${team.specs.durability}/100</span></div>
                        <div class="spec-bar-track"><div class="spec-bar-fill" style="width:${team.specs.durability}%; background:#a855f7;"></div></div>
                    </div>
                </div>

                <!-- Active Duo Drivers Summary -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    ${drivers.map(d => `
                        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-line); border-left:3px solid ${team.primaryColor}; border-radius:8px; padding:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-weight:800; font-size:0.95rem;">#${d.number} ${d.name} ${d.country}</span>
                                <span style="background:rgba(0,240,255,0.14); color:#00f0ff; font-family:var(--font-mono); font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:4px;">OVR ${d.ovr}</span>
                            </div>
                            <div style="font-size:0.76rem; color:#94a3b8; margin-top:6px;">
                                페이스 ${d.pace} • 레이스크래프트 ${d.racecraft} • 타이어관리 ${d.tireMgmt} • 우천 ${d.wetSkill}
                            </div>
                            <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; font-size:0.76rem;">
                                <span style="color:#facc15; font-weight:700;">시즌 ${d.points} pts (${d.wins}승)</span>
                                <span style="color:#94a3b8;">출발 타이어:
                                    <select style="background:#0f131d; color:#fff; border:1px solid #334155; border-radius:4px; padding:2px 5px; font-size:0.72rem;"
                                        onchange="window.F1App.setDriverStartTire('${d.id}', this.value)">
                                        ${Object.keys(window.F1Data.tireCompounds).map(tk => `
                                            <option value="${tk}" ${(this.career.state.startingTires[d.id] || 'SOFT') === tk ? 'selected' : ''}>
                                                ${window.F1Data.tireCompounds[tk].name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const circuitEl = document.getElementById('hqNextCircuitCard');
        if (circuitEl) {
            circuitEl.innerHTML = `
                <div class="f1-card-header">
                    <div>
                        <div style="font-size:0.75rem; color:#e10600; font-weight:800;">NEXT GRAND PRIX • ROUND ${circuit.round} OF 10</div>
                        <div class="f1-card-title" style="font-size:1.2rem;">${circuit.country} — ${circuit.name}</div>
                    </div>
                    <span style="background:rgba(255,255,255,0.06); padding:5px 12px; border-radius:6px; font-family:var(--font-mono); font-size:0.8rem;">
                        ${circuit.lengthKm} km • DRS ${circuit.drsZones.length}구간
                    </span>
                </div>
                <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:14px;">${circuit.desc}</p>
                <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; text-align:center;">
                    <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px;">
                        <div style="font-size:0.7rem; color:#94a3b8;">강우 확률</div>
                        <div style="font-size:1.05rem; font-weight:800; color:#38bdf8; margin-top:2px;">${Math.round(circuit.rainChance * 100)}%</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px;">
                        <div style="font-size:0.7rem; color:#94a3b8;">타이어 마모도</div>
                        <div style="font-size:1.05rem; font-weight:800; color:#f59e0b; margin-top:2px;">x${circuit.tireWearRate.toFixed(2)}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px;">
                        <div style="font-size:0.7rem; color:#94a3b8;">다운포스 비중</div>
                        <div style="font-size:1.05rem; font-weight:800; color:#10b981; margin-top:2px;">${Math.round(circuit.aeroImportance * 100)}%</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px;">
                        <div style="font-size:0.7rem; color:#94a3b8;">파워유닛 비중</div>
                        <div style="font-size:1.05rem; font-weight:800; color:#a855f7; margin-top:2px;">${Math.round(circuit.powerImportance * 100)}%</div>
                    </div>
                </div>
            `;
        }

        this.renderQualifyingTable();

        // Render Inbox
        const inboxEl = document.getElementById('hqInboxList');
        if (inboxEl) {
            inboxEl.innerHTML = this.career.state.inboxMessages.map(m => `
                <div style="background:rgba(255,255,255,0.03); border-left:3px solid #e10600; padding:10px 12px; border-radius:6px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.74rem; color:#94a3b8; margin-bottom:3px;">
                        <span style="color:#00f0ff; font-weight:700;">${m.sender}</span>
                        <span>${m.date}</span>
                    </div>
                    <div style="font-weight:800; font-size:0.86rem; color:#fff; margin-bottom:3px;">${m.title}</div>
                    <div style="font-size:0.78rem; color:#cbd5e1;">${m.body}</div>
                </div>
            `).join('');
        }
    }

    selectQualiSetup(setupKey, btnEl) {
        window.f1Audio.playUiClick(false);
        this.qualiSetup = setupKey;
        document.querySelectorAll('[data-quali-setup]').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
    }

    setDriverStartTire(driverId, compoundKey) {
        this.career.state.startingTires[driverId] = compoundKey;
        this.career.save();
        this.showToast(`출발 그리드 타이어가 [${window.F1Data.tireCompounds[compoundKey].name}]로 설정되었습니다.`);
    }

    setDriveMode(mode) {
        window.f1Audio.playUiClick(false);
        this.career.state.driveControlMode = mode;
        this.career.save();
        document.getElementById('modeManualBtn').classList.toggle('active', mode === 'MANUAL');
        document.getElementById('modeDirectorBtn').classList.toggle('active', mode === 'DIRECTOR');
    }

    setRaceLaps(laps) {
        this.career.state.selectedLaps = parseInt(laps, 10) || 5;
        this.career.save();
    }

    runQualifying() {
        window.f1Audio.playUiClick(true);
        const results = this.career.runQualifyingSession(this.qualiSetup);
        const badge = document.getElementById('qualiStatusBadge');
        if (badge) {
            badge.textContent = `Q3 완료 (POLE: ${results[0].driver.code})`;
            badge.style.background = 'rgba(34,197,94,0.2)';
            badge.style.color = '#4ade80';
        }
        this.renderQualifyingTable();
        this.showToast(`예선 종료! 폴 포지션: ${results[0].driver.name} (${results[0].lapTime}s)`);
    }

    renderQualifyingTable() {
        const container = document.getElementById('qualifyingResultsContainer');
        if (!container) return;
        const qGrid = this.career.state.qualifyingGrid;
        if (!qGrid) {
            container.innerHTML = `<div style="text-align:center; padding:24px; color:#64748b; font-size:0.84rem;">아직 예선을 진행하지 않았습니다. [예선 시뮬레이션 실행]을 누르거나 곧바로 본선으로 출격하세요.</div>`;
            return;
        }

        container.innerHTML = `
            <table class="f1-table">
                <thead>
                    <tr>
                        <th>GRID</th>
                        <th>DRIVER</th>
                        <th>CONSTRUCTOR</th>
                        <th>LAP TIME</th>
                        <th>GAP</th>
                    </tr>
                </thead>
                <tbody>
                    ${qGrid.map(r => {
                        const isMyTeam = r.team.id === this.career.state.playerTeamId;
                        return `
                            <tr style="${isMyTeam ? 'background:rgba(225,6,0,0.18); font-weight:800;' : ''}">
                                <td style="font-family:var(--font-mono); color:${r.gridPos === 1 ? '#facc15' : '#cbd5e1'};">P${r.gridPos}</td>
                                <td>${r.driver.country} ${r.driver.name} <span style="color:#94a3b8; font-family:var(--font-mono);">(${r.driver.code})</span></td>
                                <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.team.primaryColor};margin-right:6px;"></span>${r.team.shortName}</td>
                                <td style="font-family:var(--font-mono);">${r.lapTime.toFixed(3)}s</td>
                                <td style="font-family:var(--font-mono); color:${r.gridPos === 1 ? '#4ade80' : '#94a3b8'};">${r.gapToPole}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    // =========================================================================
    // TAB 2: LAUNCH & CONTROL 3D GRAND PRIX RACE
    // =========================================================================
    launch3DGrandPrix() {
        window.f1Audio.init();
        const circuit = this.career.getCurrentCircuit();
        const gridDrivers = this.career.getOrderedStartingGridDrivers();

        this.switchTab('race3d');

        document.getElementById('hudCircuitTitle').textContent =
            `ROUND ${circuit.round} • ${circuit.engName.toUpperCase()}`;
        document.getElementById('hudRadioMessages').innerHTML = '';

        this.raceEngine.setupGrandPrix(
            circuit,
            gridDrivers,
            this.career.state.playerTeamId,
            {
                laps: this.career.state.selectedLaps || 5,
                driveControlMode: this.career.state.driveControlMode || 'MANUAL',
                startingTires: this.career.state.startingTires || {}
            }
        );

        this.updateDriveModeButtonUI();
    }

    updateRaceBroadcastHUD(snap) {
        // 1. Top Lap Counter & Weather Pill
        document.getElementById('hudLapCounter').textContent = `LAP ${snap.lap} / ${snap.totalLaps}`;
        const weatherEl = document.getElementById('hudWeatherPill');
        if (weatherEl) {
            const icon = snap.weather === 'DRY' ? '☀️ DRY' : (snap.weather === 'LIGHT_RAIN' ? '🌧️ INTER RAIN' : '⛈️ FULL WET MONSOON');
            weatherEl.textContent = `${icon} (수막 ${snap.trackWater}%)`;
            weatherEl.style.color = snap.weather === 'DRY' ? '#fde047' : '#38bdf8';
        }

        // 2. Left 20-Driver FIA Timing Tower
        const towerEl = document.getElementById('hudTimingTowerList');
        if (towerEl) {
            towerEl.innerHTML = snap.standings.map(c => {
                const comp = window.F1Data.tireCompounds[c.tireCompound] || window.F1Data.tireCompounds.MEDIUM;
                const isFollowed = (snap.followedCar && snap.followedCar.driver.id === c.driver.id);
                const gapStr = c.position === 1 ? 'LEADER' : (c.inPitLane ? 'IN PIT' : `+${c.intervalAhead.toFixed(1)}s`);
                const wearColor = c.tireHealth > 60 ? '#4ade80' : (c.tireHealth > 32 ? '#facc15' : '#ef4444');
                return `
                    <div class="timing-row ${c.isPlayerTeam ? 'player-car-row' : ''} ${isFollowed ? 'followed-car-row' : ''}"
                         onclick="window.F1App.selectFollowedDriver('${c.driver.id}')">
                        <span class="t-pos">${c.position}</span>
                        <span class="t-team-stripe" style="background:${c.team.primaryColor};"></span>
                        <span class="t-code">${c.driver.code}</span>
                        <span class="t-gap" style="${c.inPitLane ? 'color:#facc15;font-weight:800;' : ''}">${gapStr}</span>
                        <span class="t-tire-badge" style="border-color:${comp.color}; color:${comp.color};">${comp.short}</span>
                        <span class="t-tire-wear" style="color:${wearColor};">${Math.round(c.tireHealth)}%</span>
                    </div>
                `;
            }).join('');
        }

        // 3. Right Pit Wall Dual-Car Strategy Cards
        this.renderPitwallCarCard('pitwallCar1Card', snap.playerCar, 1);
        this.renderPitwallCarCard('pitwallCar2Card', snap.teammateCar, 2);

        // 4. Bottom Halo Telemetry HUD for currently followed car
        const fc = snap.followedCar || snap.playerCar;
        if (fc) {
            document.getElementById('hudSpeedVal').textContent = Math.round(fc.speedKmh);
            document.getElementById('hudRpmVal').textContent = fc.rpm;
            document.getElementById('hudGearVal').textContent = fc.inPitLane ? 'P' : fc.gear;
            document.getElementById('hudErsPct').textContent = `${Math.round(fc.ersBattery)}%`;
            document.getElementById('hudErsBar').style.width = `${fc.ersBattery}%`;
            document.getElementById('hudWatchedDriverLabel').textContent =
                `카메라 추적: #${fc.driver.number} ${fc.driver.name} (P${fc.position})`;

            const drsBtn = document.getElementById('hudDrsBtn');
            if (drsBtn) {
                drsBtn.className = 'drs-indicator-pill' + (fc.drsActive ? ' active' : (fc.drsEligible ? ' eligible' : ''));
                drsBtn.textContent = fc.drsActive ? 'DRS OPEN ⚡' : (fc.drsEligible ? 'DRS READY [SHIFT]' : 'DRS LOCKED');
            }

            // RPM Shift Lights (15 LEDs)
            const leds = document.querySelectorAll('#hudRpmLeds .rpm-led');
            const activeLeds = Math.round(((fc.rpm - 8800) / 6000) * 15);
            leds.forEach((led, idx) => {
                led.className = 'rpm-led';
                if (idx < activeLeds) {
                    if (idx < 5) led.classList.add('on-green');
                    else if (idx < 10) led.classList.add('on-red');
                    else led.classList.add('on-blue');
                }
            });
        }
    }

    renderPitwallCarCard(containerId, car, seatNum) {
        const el = document.getElementById(containerId);
        if (!el || !car) return;
        const comp = window.F1Data.tireCompounds[car.tireCompound];
        const wearColor = car.tireHealth > 60 ? '#4ade80' : (car.tireHealth > 32 ? '#facc15' : '#ef4444');

        el.innerHTML = `
            <div class="strat-driver-header">
                <div>
                    <span style="background:${car.team.primaryColor}; padding:2px 6px; border-radius:3px; font-family:var(--font-mono); font-size:0.72rem; font-weight:800;">P${car.position}</span>
                    <strong style="font-size:0.86rem; margin-left:4px;">#${car.driver.number} ${car.driver.name}</strong>
                </div>
                <span style="font-family:var(--font-mono); font-size:0.74rem; color:${wearColor}; font-weight:800;">
                    [${comp.short}] 수명 ${Math.round(car.tireHealth)}% • ${Math.round(car.tireTemp)}°C
                </span>
            </div>

            <!-- Pace Command -->
            <div style="font-size:0.68rem; color:#94a3b8; margin-bottom:3px;">페이스 지시 (Pace Mode):</div>
            <div class="strat-cmd-group">
                <button class="strat-btn ${car.paceMode === 'PUSH' ? 'active-push' : ''}"
                        onclick="window.F1App.setCarStrategy('${car.driver.id}', 'PUSH', null)">🔥 풀 어택</button>
                <button class="strat-btn ${car.paceMode === 'STANDARD' ? 'active-std' : ''}"
                        onclick="window.F1App.setCarStrategy('${car.driver.id}', 'STANDARD', null)">⚖️ 밸런스</button>
                <button class="strat-btn ${car.paceMode === 'CONSERVE' ? 'active-conserve' : ''}"
                        onclick="window.F1App.setCarStrategy('${car.driver.id}', 'CONSERVE', null)">🛞 타이어 보존</button>
            </div>

            <!-- ERS Deployment Command -->
            <div style="font-size:0.68rem; color:#94a3b8; margin-bottom:3px;">ERS 하이브리드 전개 (배터리 ${Math.round(car.ersBattery)}%):</div>
            <div class="strat-cmd-group">
                <button class="strat-btn ${car.ersMode === 'OVERTAKE' ? 'active-push' : ''}"
                        onclick="window.F1App.setCarStrategy('${car.driver.id}', null, 'OVERTAKE')">⚡ 오버테이크</button>
                <button class="strat-btn ${car.ersMode === 'BALANCED' ? 'active-std' : ''}"
                        onclick="window.F1App.setCarStrategy('${car.driver.id}', null, 'BALANCED')">🔋 미디엄 전개</button>
                <button class="strat-btn ${car.ersMode === 'HARVEST' ? 'active-conserve' : ''}"
                        onclick="window.F1App.setCarStrategy('${car.driver.id}', null, 'HARVEST')">♻️ 회생 충전</button>
            </div>

            <!-- Next Pit Tire Selector & BOX Button -->
            <div style="font-size:0.68rem; color:#94a3b8; margin-top:4px;">피트스톱 교체 타이어 예약:</div>
            <div class="pit-tire-row">
                ${['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'].map(tk => {
                    const tc = window.F1Data.tireCompounds[tk];
                    return `
                        <button class="pit-compound-btn ${car.nextPitTire === tk ? 'selected' : ''}"
                                style="border-bottom:3px solid ${tc.color};"
                                onclick="window.F1App.selectNextPitTire('${car.driver.id}', '${tk}')">
                            ${tc.short}
                        </button>
                    `;
                }).join('')}
            </div>

            <button class="box-call-btn ${car.pitRequested ? 'active' : ''}"
                    onclick="window.F1App.toggleBoxCall('${car.driver.id}')">
                ${car.inPitLane ? '🔧 피트크루 타이어 교체 작업중...' : (car.pitRequested ? '🚨 BOX THIS LAP (피트인 대기중 - 취소클릭)' : `📻 BOX, BOX! 피트인 호출 (${car.nextPitTire})`)}
            </button>
        `;
    }

    setCarStrategy(driverId, paceMode, ersMode) {
        window.f1Audio.playUiClick(false);
        this.raceEngine.setCarPaceAndErs(driverId, paceMode, ersMode);
    }

    selectNextPitTire(driverId, compoundKey) {
        window.f1Audio.playUiClick(false);
        const car = this.raceEngine.cars.find(c => c.driver.id === driverId);
        if (car) car.nextPitTire = compoundKey;
    }

    toggleBoxCall(driverId) {
        const car = this.raceEngine.cars.find(c => c.driver.id === driverId);
        if (!car) return;
        this.raceEngine.requestPitStop(driverId, car.nextPitTire);
    }

    selectFollowedDriver(driverId) {
        window.f1Audio.playUiClick(false);
        this.raceEngine.setFollowedDriver(driverId);
    }

    setSimSpeed(speed, btnEl) {
        window.f1Audio.playUiClick(false);
        this.raceEngine.timeScale = speed;
        document.querySelectorAll('.sim-ctrl-btn[data-speed]').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
    }

    cycleCamera() {
        window.f1Audio.playUiClick(false);
        const mode = this.raceEngine.cycleCameraMode();
        document.getElementById('hudCameraBtn').textContent = `🎥 카메라: ${mode} [C]`;
    }

    toggleInRaceDriveMode() {
        window.f1Audio.playUiClick(false);
        this.raceEngine.driveControlMode = (this.raceEngine.driveControlMode === 'MANUAL') ? 'DIRECTOR' : 'MANUAL';
        this.career.state.driveControlMode = this.raceEngine.driveControlMode;
        this.career.save();
        this.updateDriveModeButtonUI();
    }

    updateDriveModeButtonUI() {
        const btn = document.getElementById('hudDriveModeBtn');
        if (!btn) return;
        const isManual = this.raceEngine.driveControlMode === 'MANUAL';
        btn.textContent = isManual ? '🎮 수동주행 ON (WASD)' : '🎧 AI 피트월 감독모드';
        btn.classList.toggle('active', isManual);
    }

    toggleManualDrs() {
        this.raceEngine.togglePlayerDRS();
    }

    cycleWeatherDebug() {
        const order = ['DRY', 'LIGHT_RAIN', 'HEAVY_RAIN'];
        const next = order[(order.indexOf(this.raceEngine.weather) + 1) % order.length];
        this.raceEngine.triggerWeatherChange(next);
    }

    instantFinishRace() {
        window.f1Audio.playUiClick(true);
        this.raceEngine.finishGrandPrixInstant();
    }

    appendTeamRadioMessage(code, text) {
        const list = document.getElementById('hudRadioMessages');
        if (!list) return;
        const item = document.createElement('div');
        item.style.cssText = 'padding:5px 8px; background:rgba(0,240,255,0.08); border-left:2px solid #00f0ff; border-radius:4px; color:#e2e8f0;';
        item.innerHTML = `<strong style="color:#00f0ff; font-family:var(--font-mono);">[${code}]</strong> ${text}`;
        list.prepend(item);
    }

    handleGrandPrixFinished(orderedCars) {
        const settlement = this.career.processRaceResults(orderedCars);
        this.renderAllTabs();

        const modal = document.getElementById('postRaceModal');
        const content = document.getElementById('postRaceModalContent');
        if (!modal || !content) return;

        const top3 = settlement.summaryRows.slice(0, 3);
        content.innerHTML = `
            <div class="f1-card-header">
                <div>
                    <div style="font-size:0.75rem; color:#e10600; font-weight:800;">FIA OFFICIAL CLASSIFICATION</div>
                    <div class="f1-card-title" style="font-size:1.35rem;">🏁 ${settlement.circuit.name} 최종 결과 & 정산</div>
                </div>
                <div style="text-align:right; font-family:var(--font-mono);">
                    <div style="color:#4ade80; font-weight:800; font-size:1.05rem;">순수익 +$${(settlement.netRevenue / 1000000).toFixed(2)}M</div>
                    <div style="font-size:0.75rem; color:#94a3b8;">우리 구단 획득 점수: +${settlement.playerTeamPointsThisRace} PTS</div>
                </div>
            </div>

            <!-- Podium Top 3 Banner -->
            <div class="grid-3col" style="margin-bottom:18px;">
                ${top3.map((r, i) => `
                    <div style="background:rgba(255,255,255,0.04); border:1px solid ${i === 0 ? '#facc15' : 'var(--border-line)'}; border-top:4px solid ${r.teamColor}; border-radius:8px; padding:14px; text-align:center;">
                        <div style="font-size:1.5rem;">${i === 0 ? '🥇 1ST WINNER' : (i === 1 ? '🥈 2ND PODIUM' : '🥉 3RD PODIUM')}</div>
                        <div style="font-weight:900; font-size:1.1rem; margin-top:4px;">${r.driverName}</div>
                        <div style="font-size:0.8rem; color:#94a3b8;">${r.teamName} • +${r.points} PTS</div>
                    </div>
                `).join('')}
            </div>

            <!-- Full 20-Car Classification Table -->
            <div style="max-height:320px; overflow-y:auto; margin-bottom:18px;">
                <table class="f1-table">
                    <thead>
                        <tr>
                            <th>POS</th>
                            <th>DRIVER</th>
                            <th>TEAM</th>
                            <th>TIRE / PITS</th>
                            <th>BEST LAP</th>
                            <th>GAP</th>
                            <th>PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${settlement.summaryRows.map(r => {
                            const isMine = r.teamId === this.career.state.playerTeamId;
                            return `
                                <tr style="${isMine ? 'background:rgba(225,6,0,0.22); font-weight:800;' : ''}">
                                    <td style="font-family:var(--font-mono);">P${r.position}</td>
                                    <td>${r.driverName} ${r.hasFastestLap ? '<span style="background:#a855f7;color:#fff;font-size:0.65rem;padding:1px 5px;border-radius:3px;margin-left:4px;">FASTEST LAP</span>' : ''}</td>
                                    <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.teamColor};margin-right:6px;"></span>${r.teamName}</td>
                                    <td style="font-family:var(--font-mono);">${r.tireCompound} (${r.pitStops} Stop)</td>
                                    <td style="font-family:var(--font-mono);">${r.bestLap}</td>
                                    <td style="font-family:var(--font-mono);">${r.gap}</td>
                                    <td style="font-family:var(--font-mono); color:#facc15; font-weight:800;">${r.points > 0 ? '+' + r.points : '0'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button class="btn-f1-secondary" onclick="document.getElementById('postRaceModal').style.display='none'; window.F1App.switchTab('rd');">
                    🔬 R&D 연구소로 이동
                </button>
                <button class="btn-f1-primary" onclick="document.getElementById('postRaceModal').style.display='none'; window.F1App.switchTab('hq');">
                    🏢 다음 그랑프리 패독 본부로 진군 →
                </button>
            </div>
        `;
        modal.style.display = 'flex';
    }

    // =========================================================================
    // TAB 3: R&D TECH TREE & FACTORY INFRASTRUCTURE
    // =========================================================================
    renderRdTab() {
        const team = this.career.getPlayerTeam();
        const prog = this.career.state.rdProgress[team.id] || { aero: 0, powertrain: 0, chassis: 0, durability: 0 };

        const budgetLbl = document.getElementById('rdBudgetLabel');
        if (budgetLbl) budgetLbl.textContent = `가용 Cost Cap 예산: $${(team.budget / 1000000).toFixed(2)}M`;

        const grid = document.getElementById('rdBranchesGrid');
        if (grid) {
            grid.innerHTML = Object.keys(window.F1Data.rdTree).map(key => {
                const branch = window.F1Data.rdTree[key];
                const curLvl = prog[key] || 0;
                const nextNode = branch.upgrades[curLvl];

                return `
                    <div class="f1-card" style="border-top:3px solid ${branch.color};">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span style="font-size:1.02rem; font-weight:800;">${branch.icon} ${branch.name}</span>
                            <span style="font-family:var(--font-mono); color:${branch.color}; font-weight:800;">
                                SPEC ${team.specs[key]}/100
                            </span>
                        </div>
                        <p style="font-size:0.78rem; color:#94a3b8; margin-bottom:14px;">${branch.desc}</p>

                        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
                            ${branch.upgrades.map((u, idx) => {
                                const unlocked = idx < curLvl;
                                const isCurrent = idx === curLvl;
                                return `
                                    <div style="padding:8px 10px; border-radius:6px; border:1px solid ${unlocked ? branch.color : (isCurrent ? '#f8fafc' : 'rgba(255,255,255,0.06)')}; background:${unlocked ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.02)'};">
                                        <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:800;">
                                            <span>Tier ${u.level}. ${u.name}</span>
                                            <span style="color:${unlocked ? '#4ade80' : '#facc15'};">${unlocked ? '✓ 장착됨' : '$' + (u.cost / 1e6).toFixed(1) + 'M'}</span>
                                        </div>
                                        <div style="font-size:0.71rem; color:#94a3b8; margin-top:2px;">${u.desc}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        ${nextNode ? `
                            <button class="btn-f1-primary" style="width:100%;" onclick="window.F1App.buyRdUpgrade('${key}')">
                                🔬 Tier ${nextNode.level} 연구 개발 ($${(nextNode.cost / 1e6).toFixed(1)}M)
                            </button>
                        ` : `
                            <button class="btn-f1-secondary" style="width:100%; opacity:0.6;" disabled>
                                🏆 마스터피스 최종 기술 달성 완료
                            </button>
                        `}
                    </div>
                `;
            }).join('');
        }

        const facGrid = document.getElementById('facilitiesGrid');
        if (facGrid) {
            const items = [
                { key: 'windTunnel', name: '🌪️ 풍동 실험실 (Wind Tunnel)', lvl: team.facilities.windTunnel, max: 5, desc: '에어로다이내믹 및 섀시 다운포스 효율 영구 상승' },
                { key: 'cfd', name: '💻 CFD 슈퍼컴퓨터 클러스터', lvl: team.facilities.cfd, max: 5, desc: '유체역학 시뮬레이션 정밀도 및 스펙 향상' },
                { key: 'simulator', name: '🎮 드라이버 인-더-루프 시뮬레이터', lvl: team.facilities.simulator, max: 5, desc: '서킷 셋업 최적화 및 코너링 밸런스 강화' },
                { key: 'pitCrew', name: '🔧 피트크루 휠건 퍼포먼스 센터', lvl: team.facilities.pitCrew, max: 99, desc: '피트스톱 소요 시간 단축 및 언더컷 성공률 극대화' }
            ];

            facGrid.innerHTML = items.map(f => {
                const costStr = f.key === 'pitCrew' ? '$5.5M' : `$${(f.lvl * 6).toFixed(1)}M`;
                return `
                    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-line); border-radius:8px; padding:14px;">
                        <div style="font-weight:800; font-size:0.92rem; margin-bottom:6px;">${f.name}</div>
                        <div style="font-family:var(--font-mono); font-size:1.1rem; color:#00f0ff; font-weight:800; margin-bottom:6px;">
                            현재 등급: ${f.lvl} / ${f.max}
                        </div>
                        <p style="font-size:0.76rem; color:#94a3b8; margin-bottom:12px;">${f.desc}</p>
                        <button class="btn-f1-secondary" style="width:100%;" onclick="window.F1App.buyFacilityUpgrade('${f.key}')">
                            ⬆️ 시설 증축 투자 (${costStr})
                        </button>
                    </div>
                `;
            }).join('');
        }
    }

    buyRdUpgrade(branchKey) {
        const res = this.career.purchaseRdUpgrade(branchKey);
        this.showToast(res.msg);
        this.renderAllTabs();
    }

    buyFacilityUpgrade(facilityKey) {
        const res = this.career.upgradeFacility(facilityKey);
        this.showToast(res.msg);
        this.renderAllTabs();
    }

    // =========================================================================
    // TAB 4: DRIVER LINEUP & BLOCKBUSTER TRANSFER MARKET
    // =========================================================================
    renderDriversTab() {
        const team = this.career.getPlayerTeam();
        const myDrivers = this.career.getTeamDrivers(team.id);

        const myGrid = document.getElementById('myDriversGrid');
        if (myGrid) {
            myGrid.innerHTML = myDrivers.map(d => `
                <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-line); border-top:4px solid ${team.primaryColor}; border-radius:10px; padding:18px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div>
                            <span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">CAR #${d.role} OFFICIAL DRIVER</span>
                            <h3 style="font-size:1.25rem; font-weight:900;">${d.country} #${d.number} ${d.name} (${d.code})</h3>
                        </div>
                        <div style="background:rgba(0,240,255,0.15); border:1px solid #00f0ff; color:#00f0ff; font-family:var(--font-mono); font-size:1.1rem; font-weight:900; padding:6px 12px; border-radius:6px;">
                            OVR ${d.ovr}
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:8px; text-align:center; margin:12px 0;">
                        <div style="background:rgba(255,255,255,0.04); padding:8px; border-radius:6px;"><div style="font-size:0.68rem;color:#94a3b8;">페이스</div><div style="font-weight:800;color:#38bdf8;">${d.pace}</div></div>
                        <div style="background:rgba(255,255,255,0.04); padding:8px; border-radius:6px;"><div style="font-size:0.68rem;color:#94a3b8;">추월/배틀</div><div style="font-weight:800;color:#f59e0b;">${d.racecraft}</div></div>
                        <div style="background:rgba(255,255,255,0.04); padding:8px; border-radius:6px;"><div style="font-size:0.68rem;color:#94a3b8;">타이어관리</div><div style="font-weight:800;color:#10b981;">${d.tireMgmt}</div></div>
                        <div style="background:rgba(255,255,255,0.04); padding:8px; border-radius:6px;"><div style="font-size:0.68rem;color:#94a3b8;">우천주행</div><div style="font-weight:800;color:#a855f7;">${d.wetSkill}</div></div>
                        <div style="background:rgba(255,255,255,0.04); padding:8px; border-radius:6px;"><div style="font-size:0.68rem;color:#94a3b8;">레이스지능</div><div style="font-weight:800;color:#fff;">${d.awareness}</div></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#94a3b8;">
                        <span>나이: ${d.age}세 • 경기당 주급: $${(d.salary / 1000).toFixed(0)}K</span>
                        <span style="color:#facc15; font-weight:800;">시즌 ${d.points} PTS • ${d.wins}승 • ${d.podiums}포디움</span>
                    </div>
                </div>
            `).join('');
        }

        const marketTable = document.getElementById('driverMarketTable');
        if (marketTable) {
            const allTargets = [...this.career.state.drivers]
                .filter(d => d.teamId !== team.id)
                .sort((a, b) => b.ovr - a.ovr);

            marketTable.innerHTML = `
                <thead>
                    <tr>
                        <th>DRIVER</th>
                        <th>CURRENT TEAM</th>
                        <th>AGE</th>
                        <th>OVR</th>
                        <th>PACE / RACECRAFT / TIRE / WET</th>
                        <th>BUYOUT FEE</th>
                        <th>ACTION (시트 영입)</th>
                    </tr>
                </thead>
                <tbody>
                    ${allTargets.map(d => {
                        const curTeam = d.teamId ? this.career.getTeamById(d.teamId) : null;
                        const buyout = d.teamId ? d.salary * 6 : d.salary * 2;
                        return `
                            <tr>
                                <td style="font-weight:800;">${d.country} #${d.number} ${d.name} <span style="color:#94a3b8;font-family:var(--font-mono);">(${d.code})</span></td>
                                <td>${curTeam ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${curTeam.primaryColor};margin-right:6px;"></span>${curTeam.shortName}` : '<span style="color:#4ade80;font-weight:800;">FA 자유계약</span>'}</td>
                                <td>${d.age}세</td>
                                <td style="font-family:var(--font-mono); color:#00f0ff; font-weight:800;">${d.ovr}</td>
                                <td style="font-family:var(--font-mono); font-size:0.78rem;">${d.pace} / ${d.racecraft} / ${d.tireMgmt} / ${d.wetSkill}</td>
                                <td style="font-family:var(--font-mono); color:#facc15; font-weight:700;">$${(buyout / 1e6).toFixed(2)}M</td>
                                <td>
                                    <button class="btn-f1-secondary" style="padding:5px 10px; font-size:0.74rem;" onclick="window.F1App.signDriver('${d.id}', 1)">Car #1 영입</button>
                                    <button class="btn-f1-secondary" style="padding:5px 10px; font-size:0.74rem;" onclick="window.F1App.signDriver('${d.id}', 2)">Car #2 영입</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
        }
    }

    signDriver(driverId, seatRole) {
        const res = this.career.signDriverToSeat(driverId, seatRole);
        this.showToast(res.msg);
        this.renderAllTabs();
    }

    // =========================================================================
    // TAB 5: WORLD CHAMPIONSHIP STANDINGS & 10-ROUND CALENDAR
    // =========================================================================
    renderStandingsTab() {
        const wdcEl = document.getElementById('wdcTable');
        if (wdcEl) {
            const sortedDrivers = [...this.career.state.drivers]
                .filter(d => d.teamId !== null || d.points > 0)
                .sort((a, b) => b.points - a.points || b.wins - a.wins || b.ovr - a.ovr);

            wdcEl.innerHTML = `
                <thead>
                    <tr>
                        <th>POS</th>
                        <th>DRIVER</th>
                        <th>TEAM</th>
                        <th>WINS</th>
                        <th>PODIUMS</th>
                        <th>PTS</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedDrivers.map((d, idx) => {
                        const t = this.career.getTeamById(d.teamId);
                        const isMine = d.teamId === this.career.state.playerTeamId;
                        return `
                            <tr style="${isMine ? 'background:rgba(225,6,0,0.2); font-weight:800;' : ''}">
                                <td style="font-family:var(--font-mono);">${idx + 1}</td>
                                <td>${d.country} ${d.name} (${d.code})</td>
                                <td>${t ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.primaryColor};margin-right:6px;"></span>${t.shortName}` : 'FA'}</td>
                                <td style="font-family:var(--font-mono);">${d.wins}</td>
                                <td style="font-family:var(--font-mono);">${d.podiums}</td>
                                <td style="font-family:var(--font-mono); color:#facc15; font-weight:800;">${d.points}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
        }

        const wccEl = document.getElementById('wccTable');
        if (wccEl) {
            const sortedTeams = [...this.career.state.teams].sort((a, b) => {
                const pa = (this.career.state.constructorPoints[a.id]?.points || 0);
                const pb = (this.career.state.constructorPoints[b.id]?.points || 0);
                return pb - pa || b.prestige - a.prestige;
            });

            wccEl.innerHTML = `
                <thead>
                    <tr>
                        <th>POS</th>
                        <th>CONSTRUCTOR</th>
                        <th>CAR RATING (AERO/PWR/CHA)</th>
                        <th>WINS</th>
                        <th>PTS</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedTeams.map((t, idx) => {
                        const st = this.career.state.constructorPoints[t.id] || { points: 0, wins: 0 };
                        const isMine = t.id === this.career.state.playerTeamId;
                        return `
                            <tr style="${isMine ? 'background:rgba(225,6,0,0.2); font-weight:800;' : ''}">
                                <td style="font-family:var(--font-mono);">${idx + 1}</td>
                                <td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${t.primaryColor};margin-right:8px;"></span>${t.name}</td>
                                <td style="font-family:var(--font-mono); font-size:0.78rem;">${t.specs.aero} / ${t.specs.powertrain} / ${t.specs.chassis}</td>
                                <td style="font-family:var(--font-mono);">${st.wins}</td>
                                <td style="font-family:var(--font-mono); color:#00f0ff; font-weight:800;">${st.points}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
        }

        const calGrid = document.getElementById('calendarCardsGrid');
        if (calGrid) {
            const curRoundIdx = this.career.state.currentRoundIndex;
            calGrid.innerHTML = window.F1Data.circuits.map((c, idx) => {
                const isCurrent = idx === curRoundIdx;
                const isPast = idx < curRoundIdx;
                const hist = this.career.state.raceHistory.find(h => h.round === c.round);
                return `
                    <div style="background:rgba(255,255,255,0.03); border:1px solid ${isCurrent ? '#e10600' : 'var(--border-line)'}; border-radius:8px; padding:14px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.74rem; color:#94a3b8;">
                            <span style="color:${isCurrent ? '#ff4d4d' : '#94a3b8'}; font-weight:800;">ROUND ${c.round} ${isCurrent ? '• CURRENT GP' : (isPast ? '• 완주됨' : '')}</span>
                            <span>${c.lengthKm} km</span>
                        </div>
                        <div style="font-weight:800; font-size:0.98rem; margin:4px 0;">${c.country} ${c.name}</div>
                        <div style="font-size:0.76rem; color:#94a3b8;">
                            ${hist ? `🏆 우승: <b style="color:#facc15;">${hist.winnerName}</b> (우리팀 P${hist.bestPlayerFinish}, +${hist.playerPoints}pts)` : c.desc}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // =========================================================================
    // TAB 6: SPONSORS & FINANCIAL LEDGER
    // =========================================================================
    renderFinanceTab() {
        const team = this.career.getPlayerTeam();
        const sp = team.sponsors;
        const finCard = document.getElementById('financeSponsorsCard');
        if (finCard) {
            finCard.innerHTML = `
                <div class="f1-card-header">
                    <div class="f1-card-title">💼 타이틀 & 파트너 스폰서십 계약 현황</div>
                </div>
                <div style="background:rgba(225,6,0,0.12); border:1px solid var(--f1-red); border-radius:8px; padding:16px; margin-bottom:16px;">
                    <div style="font-size:0.74rem; color:#fca5a5; font-weight:800;">OFFICIAL TITLE SPONSOR</div>
                    <div style="font-size:1.3rem; font-weight:900; margin:4px 0;">${sp.title.name}</div>
                    <div style="font-size:0.84rem; color:#cbd5e1;">
                        • 그랑프리 기본 출전 배당금: <b style="color:#4ade80;">+$${(sp.title.payoutPerRace / 1e6).toFixed(2)}M / Race</b><br>
                        • 목표 순위 보너스 (P${sp.title.bonusTarget} 이내 완주 시): <b style="color:#facc15;">+$${(sp.title.bonusAmount / 1e6).toFixed(2)}M 추가 지급</b>
                    </div>
                </div>

                <div style="font-size:0.84rem; font-weight:800; margin-bottom:8px;">공식 테크니컬 파트너 스폰서</div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${sp.secondary.map(sec => `
                        <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:6px; border:1px solid var(--border-line);">
                            <span style="font-weight:700;">🤝 ${sec.name}</span>
                            <span style="font-family:var(--font-mono); color:#4ade80; font-weight:800;">+$${(sec.payoutPerRace / 1e6).toFixed(2)}M / Race</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const histEl = document.getElementById('raceHistoryList');
        if (histEl) {
            const hist = this.career.state.raceHistory;
            if (!hist || hist.length === 0) {
                histEl.innerHTML = `<div style="padding:24px; text-align:center; color:#64748b; font-size:0.84rem;">아직 완료된 그랑프리 정산 내역이 없습니다.</div>`;
            } else {
                histEl.innerHTML = hist.map(h => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.83rem;">
                        <div>
                            <strong>R${h.round}. ${h.circuitName}</strong>
                            <div style="font-size:0.74rem; color:#94a3b8;">우승: ${h.winnerName} (${h.winnerTeam}) • 우리팀 최고 P${h.bestPlayerFinish} (+${h.playerPoints} pts)</div>
                        </div>
                        <div style="font-family:var(--font-mono); color:#4ade80; font-weight:800;">
                            +$${(h.netRevenue / 1e6).toFixed(2)}M
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    // =========================================================================
    // TEAM SELECTION MODAL & SEASON RESET
    // =========================================================================
    openTeamSelectionModal() {
        const modal = document.getElementById('teamSelectModal');
        const grid = document.getElementById('modalTeamListGrid');
        if (!modal || !grid) return;

        grid.innerHTML = this.career.state.teams.map(t => {
            const drivers = this.career.getTeamDrivers(t.id);
            const isCurrent = t.id === this.career.state.playerTeamId;
            return `
                <div style="background:rgba(255,255,255,0.03); border:2px solid ${isCurrent ? '#00f0ff' : 'var(--border-line)'}; border-left:6px solid ${t.primaryColor}; border-radius:8px; padding:14px; cursor:pointer;"
                     onclick="window.F1App.selectNewConstructor('${t.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:1rem;">${t.name}</strong>
                        <span style="font-family:var(--font-mono); font-size:0.78rem; color:#34d399;">$${(t.budget / 1e6).toFixed(0)}M</span>
                    </div>
                    <div style="font-size:0.75rem; color:#94a3b8; margin:4px 0;">
                        엔진: ${t.engine} • 에어로 ${t.specs.aero} / 파워 ${t.specs.powertrain} / 섀시 ${t.specs.chassis}
                    </div>
                    <div style="font-size:0.78rem; color:#facc15; font-weight:700;">
                        드라이버: ${drivers.map(d => `${d.name}(${d.ovr})`).join(' & ')}
                    </div>
                </div>
            `;
        }).join('');

        modal.style.display = 'flex';
    }

    selectNewConstructor(teamId) {
        window.f1Audio.playUiClick(true);
        this.career.changePlayerTeam(teamId);
        document.getElementById('teamSelectModal').style.display = 'none';
        this.renderAllTabs();
        const t = this.career.getPlayerTeam();
        this.showToast(`${t.name} 총감독(Team Principal)으로 부임했습니다!`);
    }

    resetSeasonConfirm() {
        this.career.createNewCareer(this.career.state.playerTeamId);
        this.renderAllTabs();
        this.showToast('2025 신규 F1 월드 챔피언십 시즌이 초기화되었습니다!');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.F1App = new F1AppController();
});
