// ============================================================================
// F1 MANAGER & FIA PIT WALL TELEMETRY UI CONTROLLER (app.js)
// Auto-launches Live Grand Prix on load, binds Pit Wall controls, Q1/Q2/Q3,
// 24-Race Calendar, R&D Engineering, and Driver Contract Market.
// ============================================================================

class F1ManagerApp {
    constructor() {
        this.career = window.f1Career;
        this.engine = null;
        this.activeView = 'race';
        this.qualiSetupMode = 'BALANCED';

        this.init();
    }

    init() {
        this.bindNavigation();
        this.bindTopBarActions();

        // Create Dual 3D + 2D Telemetry Race Engine
        this.engine = new window.F1LiveRaceEngine('race3dViewport', 'circuitMap2dCanvas');
        this.engine.onTelemetryTick = (snap) => this.updateLiveTelemetryHUD(snap);
        this.engine.onRaceEventLog = (tag, msg) => this.appendRadioLog(tag, msg);
        this.engine.onRaceCompleted = (ordered) => this.showPostRaceClassification(ordered);

        this.refreshAllViews();

        // Immediately start the current Grand Prix in the active Live Race view so the user sees live driving right away!
        this.launchLiveGrandPrix();
    }

    bindNavigation() {
        document.querySelectorAll('.fia-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                window.f1Audio.playUiClick(false);
                const view = btn.getAttribute('data-view');
                this.switchView(view);
            });
        });
    }

    switchView(viewName) {
        this.activeView = viewName;
        document.querySelectorAll('.fia-nav-item').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-view') === viewName);
        });
        document.querySelectorAll('.fia-view').forEach(v => {
            v.classList.toggle('active', v.id === `view-${viewName}`);
        });

        if (viewName === 'race') {
            setTimeout(() => this.engine.resizeViewports(), 40);
            if (!this.engine.isRunning || this.engine.racePhase === 'FINISHED') {
                this.launchLiveGrandPrix();
            }
        } else {
            window.f1Audio.stopEngineSound();
            this.refreshAllViews();
        }
    }

    bindTopBarActions() {
        const pickerBtn = document.getElementById('openTeamPickerBtn');
        if (pickerBtn) {
            pickerBtn.addEventListener('click', () => {
                window.f1Audio.playUiClick(false);
                this.openTeamPickerModal();
            });
        }

        const audioBtn = document.getElementById('topAudioBtn');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                const muted = window.f1Audio.toggleMute();
                audioBtn.textContent = muted ? 'AUDIO: MUTE' : 'AUDIO: ON';
            });
        }
    }

    notify(text) {
        let box = document.getElementById('fiaToastBanner');
        if (!box) {
            box = document.createElement('div');
            box.id = 'fiaToastBanner';
            box.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:500;background:#0D1017;border:1px solid #323B52;border-left:4px solid #E10600;color:#fff;padding:10px 16px;font-family:var(--font-UI);font-size:12px;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,0.9);transition:opacity 0.2s;';
            document.body.appendChild(box);
        }
        box.textContent = text;
        box.style.opacity = '1';
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => { box.style.opacity = '0'; }, 3000);
    }

    refreshAllViews() {
        this.renderTopBar();
        this.renderWeekendView();
        this.renderStandingsView();
        this.renderEngineeringView();
        this.renderContractsView();
    }

    renderTopBar() {
        const team = this.career.getPlayerTeam();
        const circuit = this.career.getCurrentCircuit();
        const s = this.career.state;

        document.getElementById('topRoundBadge').textContent =
            `${s.seasonYear} R${String(circuit.round).padStart(2, '0')}/24 • ${circuit.code}`;
        document.getElementById('topBudgetBadge').textContent =
            `COST CAP: $${(team.budget / 1e6).toFixed(2)}M`;
        document.getElementById('topTeamDot').style.background = team.primaryColor;
        document.getElementById('topTeamName').textContent = team.name;
    }

    // =========================================================================
    // VIEW 1: LIVE GRAND PRIX & PIT WALL TELEMETRY
    // =========================================================================
    launchLiveGrandPrix() {
        const circuit = this.career.getCurrentCircuit();
        const gridOrder = this.career.getStartingGridDrivers();

        document.getElementById('rcGpCode').textContent = `R${String(circuit.round).padStart(2, '0')} ${circuit.code}`;
        document.getElementById('pwCircuitMapTitle').textContent = `${circuit.location.toUpperCase()} GPS TELEMETRY`;
        document.getElementById('liveRadioList').innerHTML = '';

        this.engine.setupGrandPrix(
            circuit,
            gridOrder,
            this.career.state.playerTeamId,
            {
                raceFormat: this.career.state.raceFormat || 'SPRINT',
                driveControlMode: this.career.state.driveControlMode || 'MANUAL',
                startingTires: this.career.state.startingTires || {}
            }
        );

        this.appendRadioLog('RACE ENGINEER', `${circuit.name} 그리드 정렬 완료. 타이어 온도와 ERS 전개 모드를 점검하십시오.`);
        this.syncDriveModeButton();
    }

    updateLiveTelemetryHUD(snap) {
        // 1. Race Control Header
        document.getElementById('rcLapCounter').textContent = `LAP ${snap.lap} / ${snap.totalLaps}`;
        const flagEl = document.getElementById('rcFlagBadge');
        if (flagEl) {
            flagEl.textContent = snap.trackFlag;
            flagEl.className = 'rc-flag-badge' + (snap.trackFlag !== 'GREEN' ? ' vsc' : '');
        }
        document.getElementById('rcWeatherText').textContent =
            `${snap.weather} • TRACK ${snap.trackTemp}°C • WATER ${snap.trackWater}%`;

        // 2. Left FIA 20-Car Timing Tower
        const towerEl = document.getElementById('liveTimingRows');
        if (towerEl) {
            towerEl.innerHTML = snap.standings.map(c => {
                const comp = window.F1Data.tireCompounds[c.tireCompound] || window.F1Data.tireCompounds.MEDIUM;
                const isWatched = (snap.followedCar && snap.followedCar.driver.id === c.driver.id);
                const gapTxt = c.position === 1 ? 'LEADER' : (c.inPitLane ? 'IN PIT' : `+${c.intervalAhead.toFixed(1)}s`);
                const wearCol = c.tireHealth > 60 ? '#22C55E' : (c.tireHealth > 32 ? '#FACC15' : '#EF4444');
                return `
                    <div class="tower-row ${c.isPlayerTeam ? 'is-player' : ''} ${isWatched ? 'is-watched' : ''}"
                         onclick="window.F1App.focusDriverCamera('${c.driver.id}')">
                        <span class="tr-pos">${c.position}</span>
                        <span class="tr-bar" style="background:${c.team.primaryColor};"></span>
                        <span class="tr-code">${c.driver.code}</span>
                        <span class="tr-gap" style="${c.inPitLane ? 'color:#FFD100;font-weight:800;' : ''}">${gapTxt}</span>
                        <span class="tr-tire" style="border-color:${comp.color};color:${comp.color};">${comp.short}</span>
                        <span class="tr-wear" style="color:${wearCol};">${Math.round(c.tireHealth)}%</span>
                        <span class="tr-pits">${c.pitStops}P</span>
                    </div>
                `;
            }).join('');
        }

        // 3. Right Pit Wall Driver Strategy Boxes
        this.renderPitWallDriverBox('pwDriverBox1', snap.playerCar1);
        this.renderPitWallDriverBox('pwDriverBox2', snap.playerCar2);

        // 4. Bottom Center Telemetry Pod
        const fc = snap.followedCar || snap.playerCar1;
        if (fc) {
            document.getElementById('podSpeed').textContent = Math.round(fc.speedKmh);
            document.getElementById('podRpm').textContent = fc.rpm;
            document.getElementById('podGear').textContent = fc.inPitLane ? 'P' : fc.gear;
            document.getElementById('podErsPct').textContent = `${Math.round(fc.ersBattery)}%`;
            document.getElementById('podErsFill').style.width = `${fc.ersBattery}%`;
            document.getElementById('podWatchedLabel').textContent =
                `ONBOARD: #${fc.driver.number} ${fc.driver.code} (P${fc.position} • ${fc.tireAgeLaps}L TIRES)`;

            const drsBtn = document.getElementById('podDrsBtn');
            if (drsBtn) {
                drsBtn.className = 'tp-drs-badge' + (fc.drsActive ? ' open' : (fc.drsEligible ? ' ready' : ''));
                drsBtn.textContent = fc.drsActive ? 'DRS OPEN' : (fc.drsEligible ? 'DRS AVAILABLE [SHIFT]' : 'DRS LOCKED');
            }

            const leds = document.querySelectorAll('#revLightsBar .rev-led');
            const litCount = Math.round(((fc.rpm - 9000) / 5800) * 15);
            leds.forEach((el, idx) => {
                el.className = 'rev-led';
                if (idx < litCount) {
                    el.classList.add(idx < 5 ? 'g' : (idx < 10 ? 'r' : 'b'));
                }
            });
        }
    }

    renderPitWallDriverBox(elId, car) {
        const el = document.getElementById(elId);
        if (!el || !car) return;
        const comp = window.F1Data.tireCompounds[car.tireCompound];
        const wearCol = car.tireHealth > 60 ? '#22C55E' : (car.tireHealth > 32 ? '#FACC15' : '#EF4444');

        el.innerHTML = `
            <div class="pw-drv-top">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="background:${car.team.primaryColor};color:#fff;font-family:var(--font-Telemetry);font-size:10px;font-weight:800;padding:1px 5px;">P${car.position}</span>
                    <span style="font-weight:800;font-size:12px;">#${car.driver.number} ${car.driver.korName}</span>
                </div>
                <span style="font-family:var(--font-Telemetry);font-size:10px;color:${wearCol};font-weight:700;">
                    ${comp.short} ${Math.round(car.tireHealth)}% (${car.tireAgeLaps}L) • ${Math.round(car.tireTemp)}°C
                </span>
            </div>

            <div class="pw-cmd-grid">
                <button class="pw-cmd-btn ${car.paceMode === 'ATTACK' ? 'active-attack' : ''}"
                        onclick="window.F1App.setDriverCmd('${car.driver.id}','ATTACK',null)">PACE: ATTACK</button>
                <button class="pw-cmd-btn ${car.paceMode === 'BALANCED' ? 'active-bal' : ''}"
                        onclick="window.F1App.setDriverCmd('${car.driver.id}','BALANCED',null)">PACE: BALANCED</button>
                <button class="pw-cmd-btn ${car.paceMode === 'CONSERVE' ? 'active-save' : ''}"
                        onclick="window.F1App.setDriverCmd('${car.driver.id}','CONSERVE',null)">PACE: CONSERVE</button>
            </div>

            <div class="pw-cmd-grid">
                <button class="pw-cmd-btn ${car.ersMode === 'OVERTAKE' ? 'active-attack' : ''}"
                        onclick="window.F1App.setDriverCmd('${car.driver.id}',null,'OVERTAKE')">ERS: OVERTAKE</button>
                <button class="pw-cmd-btn ${car.ersMode === 'BALANCED' ? 'active-bal' : ''}"
                        onclick="window.F1App.setDriverCmd('${car.driver.id}',null,'BALANCED')">ERS: AUTO</button>
                <button class="pw-cmd-btn ${car.ersMode === 'HARVEST' ? 'active-save' : ''}"
                        onclick="window.F1App.setDriverCmd('${car.driver.id}',null,'HARVEST')">ERS: HARVEST</button>
            </div>

            <div class="pw-compound-bar">
                ${['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'].map(k => {
                    const tc = window.F1Data.tireCompounds[k];
                    return `
                        <button class="pw-comp-btn ${car.nextPitTire === k ? 'selected' : ''}"
                                style="border-bottom:2px solid ${tc.color};"
                                onclick="window.F1App.setPitCompound('${car.driver.id}','${k}')">
                            ${tc.short}
                        </button>
                    `;
                }).join('')}
            </div>

            <button class="pw-box-btn ${car.pitRequested ? 'called' : ''}"
                    onclick="window.F1App.toggleBoxCall('${car.driver.id}')">
                ${car.inPitLane ? 'IN PIT LANE — CHANGING TYRES...' : (car.pitRequested ? 'BOX THIS LAP (CLICK TO CANCEL)' : `BOX THIS LAP → FIT ${car.nextPitTire}`)}
            </button>
        `;
    }

    focusDriverCamera(driverId) {
        window.f1Audio.playUiClick(false);
        this.engine.setFollowedDriver(driverId);
    }

    setDriverCmd(driverId, pace, ers) {
        window.f1Audio.playUiClick(false);
        this.engine.setCarCommands(driverId, pace, ers);
    }

    setPitCompound(driverId, compKey) {
        window.f1Audio.playUiClick(false);
        this.engine.setNextPitCompound(driverId, compKey);
    }

    toggleBoxCall(driverId) {
        this.engine.togglePitCall(driverId);
    }

    setSimSpeed(spd, btn) {
        window.f1Audio.playUiClick(false);
        this.engine.timeScale = spd;
        document.querySelectorAll('[data-sim-speed]').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    }

    cycleCamera() {
        window.f1Audio.playUiClick(false);
        const m = this.engine.cycleCameraMode();
        document.getElementById('rcCamBtn').textContent = `CAM: ${m} [C]`;
    }

    toggleDriveControlMode() {
        window.f1Audio.playUiClick(false);
        this.engine.driveControlMode = this.engine.driveControlMode === 'MANUAL' ? 'PITWALL' : 'MANUAL';
        this.career.state.driveControlMode = this.engine.driveControlMode;
        this.career.save();
        this.syncDriveModeButton();
    }

    syncDriveModeButton() {
        const btn = document.getElementById('rcControlModeBtn');
        if (!btn) return;
        const isManual = this.engine.driveControlMode === 'MANUAL';
        btn.textContent = isManual ? 'MODE: MANUAL DRIVE' : 'MODE: AI PIT WALL';
        btn.classList.toggle('active', isManual);
    }

    cycleWeatherLive() {
        const states = ['DRY', 'INTER_RAIN', 'HEAVY_RAIN'];
        const next = states[(states.indexOf(this.engine.weather) + 1) % states.length];
        this.engine.weather = next;
        this.appendRadioLog('METEO FRANCE', `기상 레이더 변화: [${next}] 상태로 전환되었습니다. 타이어 크로스오버 타이밍을 계산하십시오!`);
    }

    triggerVscLive() {
        this.engine.triggerSafetyCar('VSC');
    }

    manualDrsClick() {
        this.engine.manualToggleDrs();
    }

    finishRaceNow() {
        window.f1Audio.playUiClick(true);
        this.engine.completeRaceSession();
    }

    appendRadioLog(tag, msg) {
        const list = document.getElementById('liveRadioList');
        if (!list) return;
        const row = document.createElement('div');
        row.style.cssText = 'padding:4px 6px;background:#121620;border-left:2px solid #E10600;color:#E2E8F0;';
        row.innerHTML = `<span style="font-family:var(--font-Telemetry);font-weight:800;color:#FFD100;">[${tag}]</span> ${msg}`;
        list.prepend(row);
    }

    // =========================================================================
    // VIEW 2: RACE WEEKEND PREP, DISTANCE FORMAT & QUALIFYING
    // =========================================================================
    renderWeekendView() {
        const circuit = this.career.getCurrentCircuit();
        const team = this.career.getPlayerTeam();
        const drivers = this.career.getTeamDrivers(team.id);
        const curFmt = this.career.state.raceFormat || 'SPRINT';

        const briefEl = document.getElementById('weekendGpBriefingPanel');
        if (briefEl) {
            briefEl.innerHTML = `
                <div class="fia-panel-head">
                    <div>
                        <div style="font-family:var(--font-Telemetry);font-size:11px;color:#E10600;font-weight:800;">ROUND ${circuit.round} OF 24 • ${circuit.location.toUpperCase()}</div>
                        <div class="fia-panel-title" style="font-size:20px;">${circuit.name}</div>
                    </div>
                    <span style="font-family:var(--font-Telemetry);font-size:12px;color:#94A3B8;">
                        FULL DISTANCE: ${circuit.realLaps} LAPS (${circuit.lengthKm} KM)
                    </span>
                </div>

                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
                    <div style="background:#0D1017;padding:10px;border:1px solid var(--border-subtle);">
                        <div style="font-size:10px;color:#64748B;">OFFICIAL LAPS</div>
                        <div style="font-family:var(--font-Telemetry);font-size:16px;font-weight:800;margin-top:2px;">${circuit.realLaps} LAPS</div>
                    </div>
                    <div style="background:#0D1017;padding:10px;border:1px solid var(--border-subtle);">
                        <div style="font-size:10px;color:#64748B;">TYRE ABRASION</div>
                        <div style="font-family:var(--font-Telemetry);font-size:16px;font-weight:800;color:#FFD100;margin-top:2px;">x${circuit.tireWearRate.toFixed(2)}</div>
                    </div>
                    <div style="background:#0D1017;padding:10px;border:1px solid var(--border-subtle);">
                        <div style="font-size:10px;color:#64748B;">RAIN PROBABILITY</div>
                        <div style="font-family:var(--font-Telemetry);font-size:16px;font-weight:800;color:#38BDF8;margin-top:2px;">${Math.round(circuit.rainChance * 100)}%</div>
                    </div>
                    <div style="background:#0D1017;padding:10px;border:1px solid var(--border-subtle);">
                        <div style="font-size:10px;color:#64748B;">PIT LANE LOSS</div>
                        <div style="font-family:var(--font-Telemetry);font-size:16px;font-weight:800;color:#22C55E;margin-top:2px;">${circuit.pitLossSec}s</div>
                    </div>
                </div>

                <div style="margin-bottom:14px;">
                    <div style="font-family:var(--font-Telemetry);font-size:11px;color:#94A3B8;margin-bottom:6px;">SELECT GRAND PRIX DISTANCE FORMAT (실제 경기 바퀴수 비율 선택):</div>
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                        ${Object.keys(window.F1Data.raceFormats).map(fk => {
                            const f = window.F1Data.raceFormats[fk];
                            const lapsCount = f.fixedLaps ? f.fixedLaps : Math.max(5, Math.round(circuit.realLaps * f.scale));
                            return `
                                <button class="fia-btn-slate ${curFmt === fk ? 'active' : ''}"
                                        onclick="window.F1App.selectRaceFormat('${fk}')">
                                    <div>${f.label}</div>
                                    <div style="font-family:var(--font-Telemetry);font-size:11px;color:#FFD100;margin-top:2px;">${lapsCount} LAPS</div>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        const carsEl = document.getElementById('weekendTeamCarsPanel');
        if (carsEl) {
            carsEl.innerHTML = `
                <div class="fia-panel-head">
                    <span class="fia-panel-title">${team.name} — STARTING TYRE ALLOCATION</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    ${drivers.map(d => {
                        const selTire = this.career.state.startingTires[d.id] || 'SOFT';
                        return `
                            <div style="background:#0D1017;border:1px solid var(--border-subtle);border-left:3px solid ${team.primaryColor};padding:12px;">
                                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                                    <strong style="font-size:14px;">#${d.number} ${d.korName} (${d.code})</strong>
                                    <span style="font-family:var(--font-Telemetry);color:#22C55E;font-weight:800;">OVR ${d.ovr}</span>
                                </div>
                                <div style="font-size:11px;color:#94A3B8;margin-bottom:8px;">
                                    PACE ${d.pace} • RACECRAFT ${d.racecraft} • TYRE MGMT ${d.tireMgmt} • WET ${d.wetSkill}
                                </div>
                                <div style="font-family:var(--font-Telemetry);font-size:10px;color:#64748B;margin-bottom:4px;">STARTING COMPOUND:</div>
                                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;">
                                    ${Object.keys(window.F1Data.tireCompounds).map(tk => {
                                        const tc = window.F1Data.tireCompounds[tk];
                                        return `
                                            <button class="pw-comp-btn ${selTire === tk ? 'selected' : ''}"
                                                    style="border-bottom:2px solid ${tc.color};padding:5px 0;"
                                                    onclick="window.F1App.setDriverStartCompound('${d.id}','${tk}')">
                                                ${tc.short}
                                            </button>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        this.renderQualifyingResultsTable();
    }

    selectRaceFormat(fmtKey) {
        window.f1Audio.playUiClick(false);
        this.career.state.raceFormat = fmtKey;
        this.career.save();
        this.renderWeekendView();
    }

    setDriverStartCompound(driverId, compKey) {
        window.f1Audio.playUiClick(false);
        this.career.state.startingTires[driverId] = compKey;
        this.career.save();
        this.renderWeekendView();
    }

    runQualifyingShootout() {
        window.f1Audio.playUiClick(true);
        const rows = this.career.simulateQualifying(this.qualiSetupMode);
        this.renderQualifyingResultsTable();
        this.notify(`Q3 POLE POSITION: ${rows[0].driver.korName} (${rows[0].formattedTime})`);
    }

    renderQualifyingResultsTable() {
        const wrap = document.getElementById('weekendQualiTableWrap');
        if (!wrap) return;
        const qOrder = this.career.state.qualifyingOrder;
        if (!qOrder) {
            wrap.innerHTML = `<div style="padding:32px;text-align:center;color:#64748B;">상단 [RUN QUALIFYING] 버튼을 눌러 20대 그리드 예선 타임어택을 진행하거나, [START GRAND PRIX]로 즉시 출발하십시오.</div>`;
            return;
        }

        wrap.innerHTML = `
            <table class="fia-data-table">
                <thead>
                    <tr>
                        <th>GRID</th>
                        <th>DRIVER</th>
                        <th>CONSTRUCTOR</th>
                        <th>SESSION</th>
                        <th>TIME</th>
                        <th>DELTA</th>
                    </tr>
                </thead>
                <tbody>
                    ${qOrder.map(r => {
                        const isMine = r.team.id === this.career.state.playerTeamId;
                        return `
                            <tr class="${isMine ? 'highlight-team' : ''}">
                                <td style="font-family:var(--font-Telemetry);font-weight:800;">P${r.gridPos}</td>
                                <td><strong>${r.driver.korName}</strong> <span style="color:#64748B;font-family:var(--font-Telemetry);">${r.driver.code}</span></td>
                                <td><span style="display:inline-block;width:3px;height:12px;background:${r.team.primaryColor};margin-right:6px;vertical-align:middle;"></span>${r.team.shortName}</td>
                                <td style="font-family:var(--font-Telemetry);color:${r.sessionEliminated === 'Q3' ? '#22C55E' : '#94A3B8'};">${r.sessionEliminated}</td>
                                <td style="font-family:var(--font-Telemetry);">${r.formattedTime}</td>
                                <td style="font-family:var(--font-Telemetry);color:${r.gridPos === 1 ? '#A855F7' : '#94A3B8'};">${r.gapStr}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    startGrandPrixFromWeekend() {
        window.f1Audio.playUiClick(true);
        this.switchView('race');
        this.launchLiveGrandPrix();
    }

    // =========================================================================
    // VIEW 3: 24-RACE SEASON CALENDAR & FIA STANDINGS
    // =========================================================================
    renderStandingsView() {
        const wdcTable = document.getElementById('standingsWdcTable');
        if (wdcTable) {
            const sortedDrv = [...this.career.state.drivers]
                .filter(d => d.teamId !== null || d.points > 0)
                .sort((a, b) => b.points - a.points || b.wins - a.wins || b.ovr - a.ovr);

            wdcTable.innerHTML = `
                <thead>
                    <tr>
                        <th>POS</th>
                        <th>DRIVER</th>
                        <th>TEAM</th>
                        <th>WINS</th>
                        <th>PODIUMS</th>
                        <th>POLES</th>
                        <th>PTS</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedDrv.map((d, i) => {
                        const t = this.career.getTeam(d.teamId);
                        const isMine = d.teamId === this.career.state.playerTeamId;
                        return `
                            <tr class="${isMine ? 'highlight-team' : ''}">
                                <td style="font-family:var(--font-Telemetry);font-weight:800;">${i + 1}</td>
                                <td><strong>${d.korName}</strong> <span style="font-family:var(--font-Telemetry);color:#64748B;">${d.code}</span></td>
                                <td>${t ? `<span style="display:inline-block;width:3px;height:12px;background:${t.primaryColor};margin-right:6px;vertical-align:middle;"></span>${t.shortName}` : 'FA'}</td>
                                <td style="font-family:var(--font-Telemetry);">${d.wins}</td>
                                <td style="font-family:var(--font-Telemetry);">${d.podiums}</td>
                                <td style="font-family:var(--font-Telemetry);">${d.poles || 0}</td>
                                <td style="font-family:var(--font-Telemetry);font-weight:800;color:#FFD100;">${d.points}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
        }

        const wccTable = document.getElementById('standingsWccTable');
        if (wccTable) {
            const sortedTeams = [...this.career.state.teams].sort((a, b) => {
                const pa = this.career.state.constructorStats[a.id]?.points || 0;
                const pb = this.career.state.constructorStats[b.id]?.points || 0;
                return pb - pa || b.prestige - a.prestige;
            });

            wccTable.innerHTML = `
                <thead>
                    <tr>
                        <th>POS</th>
                        <th>CONSTRUCTOR</th>
                        <th>POWER UNIT</th>
                        <th>SPEC (AER/PWR/CHA/DUR)</th>
                        <th>WINS</th>
                        <th>PTS</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedTeams.map((t, i) => {
                        const st = this.career.state.constructorStats[t.id] || { points: 0, wins: 0 };
                        const isMine = t.id === this.career.state.playerTeamId;
                        return `
                            <tr class="${isMine ? 'highlight-team' : ''}">
                                <td style="font-family:var(--font-Telemetry);font-weight:800;">${i + 1}</td>
                                <td><span style="display:inline-block;width:3px;height:12px;background:${t.primaryColor};margin-right:6px;vertical-align:middle;"></span><strong>${t.name}</strong></td>
                                <td style="color:#94A3B8;">${t.powerUnit}</td>
                                <td style="font-family:var(--font-Telemetry);">${t.specs.aero}/${t.specs.powertrain}/${t.specs.chassis}/${t.specs.durability}</td>
                                <td style="font-family:var(--font-Telemetry);">${st.wins}</td>
                                <td style="font-family:var(--font-Telemetry);font-weight:800;color:#FFD100;">${st.points}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
        }

        const calGrid = document.getElementById('seasonCalendarGrid');
        if (calGrid) {
            const curIdx = this.career.state.currentRoundIndex;
            calGrid.innerHTML = window.F1Data.circuits.map((c, idx) => {
                const isCur = idx === curIdx;
                const done = this.career.state.completedRounds.find(r => r.round === c.round);
                return `
                    <div style="background:#0D1017;border:1px solid ${isCur ? '#E10600' : 'var(--border-subtle)'};padding:12px;cursor:pointer;"
                         onclick="window.F1App.jumpToCircuitRound(${idx})">
                        <div style="display:flex;justify-content:space-between;font-family:var(--font-Telemetry);font-size:10px;color:${isCur ? '#E10600' : '#64748B'};margin-bottom:4px;">
                            <span>R${String(c.round).padStart(2, '0')} • ${c.code}</span>
                            <span>${c.realLaps} LAPS (${c.lengthKm}KM)</span>
                        </div>
                        <div style="font-weight:800;font-size:13px;margin-bottom:6px;">${c.name}</div>
                        ${done ? `
                            <div style="font-family:var(--font-Telemetry);font-size:11px;color:#22C55E;">
                                WINNER: ${done.winnerName} (${done.winnerCode}) • TEAM P${done.playerBestPos}
                            </div>
                        ` : `
                            <div style="font-family:var(--font-Telemetry);font-size:10px;color:#94A3B8;">
                                AERO ${Math.round(c.aeroWeight * 100)}% • POWER ${Math.round(c.powerWeight * 100)}% • RAIN ${Math.round(c.rainChance * 100)}%
                            </div>
                        `}
                    </div>
                `;
            }).join('');
        }
    }

    jumpToCircuitRound(roundIdx) {
        window.f1Audio.playUiClick(false);
        this.career.state.currentRoundIndex = roundIdx;
        this.career.state.qualifyingOrder = null;
        this.career.save();
        this.refreshAllViews();
        const c = this.career.getCurrentCircuit();
        this.notify(`선택된 그랑프리: R${c.round} ${c.name} (${c.realLaps} Laps)`);
    }

    // =========================================================================
    // VIEW 4: R&D ENGINEERING
    // =========================================================================
    renderEngineeringView() {
        const team = this.career.getPlayerTeam();
        const levels = this.career.state.rdLevels[team.id] || { aero: 0, powertrain: 0, chassis: 0, durability: 0 };

        document.getElementById('engBudgetLabel').textContent = `AVAILABLE COST CAP: $${(team.budget / 1e6).toFixed(2)}M`;

        const grid = document.getElementById('engineeringDeptsGrid');
        if (!grid) return;

        grid.innerHTML = Object.keys(window.F1Data.rdTree).map(key => {
            const dept = window.F1Data.rdTree[key];
            const lvl = levels[key] || 0;
            const nextUpg = dept.upgrades[lvl];

            return `
                <div class="fia-panel" style="border-top:3px solid ${dept.color};">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <span style="font-family:var(--font-Broadcast);font-size:15px;font-weight:800;">${dept.name}</span>
                        <span style="font-family:var(--font-Telemetry);font-weight:800;color:${dept.color};">${team.specs[key]}/100</span>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
                        ${dept.upgrades.map((u, idx) => {
                            const done = idx < lvl;
                            return `
                                <div style="background:#0D1017;border:1px solid ${done ? dept.color : 'var(--border-subtle)'};padding:8px;">
                                    <div style="display:flex;justify-content:space-between;font-family:var(--font-Telemetry);font-size:11px;font-weight:700;">
                                        <span>SPEC ${u.level}: ${u.name}</span>
                                        <span style="color:${done ? '#22C55E' : '#FFD100'};">${done ? 'INSTALLED' : '$' + (u.cost / 1e6).toFixed(1) + 'M'}</span>
                                    </div>
                                    <div style="font-size:11px;color:#94A3B8;margin-top:2px;">${u.desc}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    ${nextUpg ? `
                        <button class="fia-btn-red" style="width:100%;" onclick="window.F1App.developRdPart('${key}')">
                            DEVELOP SPEC ${nextUpg.level} ($${(nextUpg.cost / 1e6).toFixed(1)}M)
                        </button>
                    ` : `
                        <button class="fia-btn-slate" style="width:100%;opacity:0.5;" disabled>MAX SPECIFICATION REACHED</button>
                    `}
                </div>
            `;
        }).join('');
    }

    developRdPart(deptKey) {
        const res = this.career.developUpgrade(deptKey);
        this.notify(res.msg);
        this.refreshAllViews();
    }

    // =========================================================================
    // VIEW 5: DRIVER CONTRACTS & FINANCE
    // =========================================================================
    renderContractsView() {
        const team = this.career.getPlayerTeam();
        const myDrivers = this.career.getTeamDrivers(team.id);

        const myPanel = document.getElementById('contractsMyDriversPanel');
        if (myPanel) {
            myPanel.innerHTML = `
                <div class="fia-panel-head">
                    <span class="fia-panel-title">${team.name} — CONTRACTED DRIVERS</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                    ${myDrivers.map(d => `
                        <div style="background:#0D1017;border:1px solid var(--border-subtle);border-left:3px solid ${team.primaryColor};padding:12px;display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <div style="font-family:var(--font-Telemetry);font-size:10px;color:#64748B;">CAR #${d.role} SEAT • ${d.nat}</div>
                                <div style="font-size:15px;font-weight:800;">#${d.number} ${d.korName} (${d.name})</div>
                                <div style="font-family:var(--font-Telemetry);font-size:11px;color:#94A3B8;margin-top:3px;">
                                    PACE ${d.pace} • RACECRAFT ${d.racecraft} • TYRE ${d.tireMgmt} • WET ${d.wetSkill}
                                </div>
                            </div>
                            <div style="text-align:right;font-family:var(--font-Telemetry);">
                                <div style="font-size:16px;font-weight:800;color:#22C55E;">OVR ${d.ovr}</div>
                                <div style="font-size:11px;color:#FFD100;">$${(d.salary / 1000).toFixed(0)}K / GP</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const spPanel = document.getElementById('contractsSponsorsPanel');
        if (spPanel) {
            const sp = team.sponsors;
            spPanel.innerHTML = `
                <div class="fia-panel-head">
                    <span class="fia-panel-title">TITLE SPONSOR &amp; COMMERCIAL AGREEMENTS</span>
                    <button class="fia-btn-slate" style="padding:4px 10px;font-size:11px;" onclick="window.F1App.resetFullSeason()">RESET 2025 SEASON</button>
                </div>
                <div style="background:#0D1017;border:1px solid var(--border-strong);padding:12px;margin-bottom:10px;">
                    <div style="font-family:var(--font-Telemetry);font-size:10px;color:#E10600;">PRIMARY TITLE PARTNER</div>
                    <div style="font-size:16px;font-weight:800;margin:3px 0;">${sp.title.name}</div>
                    <div style="font-family:var(--font-Telemetry);font-size:11px;color:#94A3B8;">
                        BASE PAYOUT: <span style="color:#22C55E;">+$${(sp.title.perRace / 1e6).toFixed(2)}M/GP</span> •
                        TARGET BONUS (TOP ${sp.title.targetPos}): <span style="color:#FFD100;">+$${(sp.title.bonus / 1e6).toFixed(2)}M</span>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                    ${sp.partners.map(p => `
                        <div style="background:#0D1017;border:1px solid var(--border-subtle);padding:8px;">
                            <div style="font-weight:700;font-size:12px;">${p.name}</div>
                            <div style="font-family:var(--font-Telemetry);font-size:11px;color:#22C55E;">+$${(p.perRace / 1e6).toFixed(2)}M/GP</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const mktTable = document.getElementById('contractsMarketTable');
        if (mktTable) {
            const pool = [...this.career.state.drivers]
                .filter(d => d.teamId !== team.id)
                .sort((a, b) => b.ovr - a.ovr);

            mktTable.innerHTML = `
                <thead>
                    <tr>
                        <th>DRIVER</th>
                        <th>CURRENT TEAM</th>
                        <th>AGE</th>
                        <th>OVR</th>
                        <th>PACE / CRAFT / TYRE / WET</th>
                        <th>BUYOUT CLAUSE</th>
                        <th>SIGN TO SEAT</th>
                    </tr>
                </thead>
                <tbody>
                    ${pool.map(d => {
                        const ct = d.teamId ? this.career.getTeam(d.teamId) : null;
                        const fee = d.teamId ? d.salary * 5 : d.salary * 2;
                        return `
                            <tr>
                                <td><strong>#${d.number} ${d.korName}</strong> <span style="font-family:var(--font-Telemetry);color:#64748B;">${d.code}</span></td>
                                <td>${ct ? `<span style="display:inline-block;width:3px;height:12px;background:${ct.primaryColor};margin-right:6px;vertical-align:middle;"></span>${ct.shortName}` : '<span style="color:#22C55E;font-weight:700;">FREE AGENT</span>'}</td>
                                <td style="font-family:var(--font-Telemetry);">${d.age}</td>
                                <td style="font-family:var(--font-Telemetry);font-weight:800;color:#22C55E;">${d.ovr}</td>
                                <td style="font-family:var(--font-Telemetry);">${d.pace} / ${d.racecraft} / ${d.tireMgmt} / ${d.wetSkill}</td>
                                <td style="font-family:var(--font-Telemetry);color:#FFD100;">$${(fee / 1e6).toFixed(2)}M</td>
                                <td>
                                    <button class="rc-btn" onclick="window.F1App.signDriverContract('${d.id}',1)">SIGN CAR #1</button>
                                    <button class="rc-btn" onclick="window.F1App.signDriverContract('${d.id}',2)">SIGN CAR #2</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
        }
    }

    signDriverContract(driverId, role) {
        const res = this.career.signDriver(driverId, role);
        this.notify(res.msg);
        this.refreshAllViews();
    }

    // =========================================================================
    // MODALS: TEAM PICKER & POST-RACE CLASSIFICATION
    // =========================================================================
    openTeamPickerModal() {
        const modal = document.getElementById('teamPickerModal');
        const grid = document.getElementById('teamPickerGrid');
        if (!modal || !grid) return;

        grid.innerHTML = this.career.state.teams.map(t => {
            const drvs = this.career.getTeamDrivers(t.id);
            const isCur = t.id === this.career.state.playerTeamId;
            return `
                <div style="background:#0D1017;border:1px solid ${isCur ? '#E10600' : 'var(--border-subtle)'};border-left:4px solid ${t.primaryColor};padding:12px;cursor:pointer;"
                     onclick="window.F1App.switchConstructorTeam('${t.id}')">
                    <div style="display:flex;justify-content:space-between;">
                        <strong style="font-size:14px;">${t.name}</strong>
                        <span style="font-family:var(--font-Telemetry);color:#10B981;">$${(t.budget / 1e6).toFixed(1)}M</span>
                    </div>
                    <div style="font-family:var(--font-Telemetry);font-size:11px;color:#94A3B8;margin:4px 0;">
                        PU: ${t.powerUnit} • AERO ${t.specs.aero} / POWR ${t.specs.powertrain} / CHAS ${t.specs.chassis}
                    </div>
                    <div style="font-size:12px;color:#FFD100;font-weight:700;">
                        ${drvs.map(d => `#${d.number} ${d.korName} (${d.ovr})`).join(' & ')}
                    </div>
                </div>
            `;
        }).join('');

        modal.style.display = 'flex';
    }

    switchConstructorTeam(teamId) {
        window.f1Audio.playUiClick(true);
        this.career.setPlayerTeam(teamId);
        document.getElementById('teamPickerModal').style.display = 'none';
        this.refreshAllViews();
        if (this.activeView === 'race') {
            this.launchLiveGrandPrix();
        }
        this.notify(`TEAM PRINCIPAL APPOINTED: ${this.career.getPlayerTeam().name}`);
    }

    showPostRaceClassification(orderedCars) {
        const report = this.career.recordGrandPrixClassification(orderedCars);
        this.refreshAllViews();

        const modal = document.getElementById('postRaceClassificationModal');
        const body = document.getElementById('postRaceClassificationBody');
        if (!modal || !body) return;

        body.innerHTML = `
            <div class="fia-panel-head">
                <div>
                    <div style="font-family:var(--font-Telemetry);font-size:11px;color:#E10600;">FIA OFFICIAL RACE CLASSIFICATION</div>
                    <div class="fia-panel-title" style="font-size:20px;">${report.circuit.name} — FINAL RESULTS</div>
                </div>
                <div style="text-align:right;font-family:var(--font-Telemetry);">
                    <div style="color:#22C55E;font-size:15px;font-weight:800;">NET REVENUE: +$${(report.netProfit / 1e6).toFixed(2)}M</div>
                    <div style="font-size:11px;color:#94A3B8;">TEAM POINTS EARNED: +${report.playerPtsEarned} PTS</div>
                </div>
            </div>

            <div style="max-height:420px;overflow-y:auto;margin-bottom:16px;">
                <table class="fia-data-table">
                    <thead>
                        <tr>
                            <th>POS</th>
                            <th>DRIVER</th>
                            <th>CONSTRUCTOR</th>
                            <th>GRID</th>
                            <th>STINTS / PITS</th>
                            <th>BEST LAP</th>
                            <th>GAP</th>
                            <th>PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.classification.map(r => {
                            const isMine = r.teamId === this.career.state.playerTeamId;
                            return `
                                <tr class="${isMine ? 'highlight-team' : ''}">
                                    <td style="font-family:var(--font-Telemetry);font-weight:800;">P${r.pos}</td>
                                    <td>
                                        <strong>${r.korName}</strong>
                                        <span style="font-family:var(--font-Telemetry);color:#64748B;">${r.code}</span>
                                        ${r.isFL ? '<span style="background:#A855F7;color:#fff;font-family:var(--font-Telemetry);font-size:9px;padding:1px 4px;margin-left:4px;">FL +1</span>' : ''}
                                    </td>
                                    <td><span style="display:inline-block;width:3px;height:12px;background:${r.teamColor};margin-right:6px;vertical-align:middle;"></span>${r.teamName}</td>
                                    <td style="font-family:var(--font-Telemetry);">P${r.gridPos}</td>
                                    <td style="font-family:var(--font-Telemetry);">${r.stints.map(s => s[0]).join('→')} (${r.pits})</td>
                                    <td style="font-family:var(--font-Telemetry);">${r.bestLapStr}</td>
                                    <td style="font-family:var(--font-Telemetry);">${r.gapStr}</td>
                                    <td style="font-family:var(--font-Telemetry);font-weight:800;color:#FFD100;">${r.pts > 0 ? '+' + r.pts : '0'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;">
                <button class="fia-btn-slate" onclick="document.getElementById('postRaceClassificationModal').style.display='none';window.F1App.switchView('standings');">
                    VIEW 24-RACE STANDINGS
                </button>
                <button class="fia-btn-red" onclick="document.getElementById('postRaceClassificationModal').style.display='none';window.F1App.launchLiveGrandPrix();">
                    PROCEED TO NEXT GRAND PRIX →
                </button>
            </div>
        `;

        modal.style.display = 'flex';
    }

    resetFullSeason() {
        this.career.startNewSeason(this.career.state.playerTeamId);
        this.refreshAllViews();
        this.notify('2025 FIA Formula 1 World Championship 24-Race Season Reset.');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.F1App = new F1ManagerApp();
});
