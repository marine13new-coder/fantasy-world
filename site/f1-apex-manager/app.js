// ============================================================================
// F1 MANAGER & FIA PIT WALL TELEMETRY UI CONTROLLER (app.js)
// Zero-lag static DOM Pit-Wall controls, Main Menu, Save/Load Slots + File I/O,
// Dyno & Wind Tunnel Equipment Test Bench, and 24-Race Full Season Controller
// ============================================================================

class F1ManagerApp {
    constructor() {
        this.career = window.f1Career;
        this.engine = null;
        this.activeView = 'race';
        this.qualiSetupMode = 'BALANCED';
        this.dynoTireCompound = 'SOFT';
        this.newCareerSelectedTeam = this.career.state.playerTeamId || 'ferrari';
        this.newCareerSelectedFormat = this.career.state.raceFormat || 'FULL';

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
        this.engine.onRedFlagTriggered = (reason, curLap, totalLaps) => this.showRedFlagGarageModal(reason, curLap, totalLaps);

        this.redFlagTire1 = 'SOFT';
        this.redFlagTire2 = 'MEDIUM';

        this.refreshAllViews();

        // Start live race in background immediately so 3D track is always rendered and alive
        this.launchLiveGrandPrix(false);
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
                this.launchLiveGrandPrix(false);
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
            box.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:600;background:#0D1017;border:1px solid #323B52;border-left:4px solid #E10600;color:#fff;padding:10px 16px;font-family:var(--font-UI);font-size:12px;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,0.9);transition:opacity 0.2s;';
            document.body.appendChild(box);
        }
        box.textContent = text;
        box.style.opacity = '1';
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => { box.style.opacity = '0'; }, 3200);
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
            `${s.seasonYear} R${String(circuit.round).padStart(2, '0')}/24 • ${circuit.code} (${circuit.realLaps}L)`;
        document.getElementById('topBudgetBadge').textContent =
            `COST CAP: $${(team.budget / 1e6).toFixed(2)}M`;
        document.getElementById('topTeamDot').style.background = team.primaryColor;
        document.getElementById('topTeamName').textContent = team.name;
    }

    // =========================================================================
    // MAIN MENU & SAVE / LOAD SYSTEM (3 SLOTS + JSON EXPORT/IMPORT)
    // =========================================================================
    openMainMenu() {
        window.f1Audio.playUiClick(false);
        if (this.engine && this.engine.isRunning) {
            this.engine.timeScale = 0;
        }
        this.renderMainMenuContent();
        document.getElementById('fiaMainMenuScreen').style.display = 'flex';
    }

    openSaveLoadModal() {
        this.openMainMenu();
    }

    closeMainMenuAndResume() {
        window.f1Audio.playUiClick(false);
        document.getElementById('fiaMainMenuScreen').style.display = 'none';
        if (this.engine && this.activeView === 'race' && this.engine.timeScale === 0) {
            this.engine.timeScale = 1;
            document.querySelectorAll('[data-sim-speed]').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-sim-speed') === '1');
            });
        }
    }

    renderMainMenuContent() {
        const ctrlEl = document.getElementById('mainMenuNewCareerControls');
        if (ctrlEl) {
            ctrlEl.innerHTML = `
                <div style="margin-bottom:10px;">
                    <div style="font-family:var(--font-Telemetry);font-size:10px;color:#64748B;margin-bottom:4px;">1. SELECT CONSTRUCTOR TEAM:</div>
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;max-height:210px;overflow-y:auto;">
                        ${window.F1Data.teams.map(t => `
                            <div style="background:#141824;border:1px solid ${this.newCareerSelectedTeam === t.id ? '#E10600' : 'var(--border-subtle)'};border-left:4px solid ${t.primaryColor};padding:7px 10px;cursor:pointer;"
                                 onclick="window.F1App.selectNewCareerTeam('${t.id}')">
                                <div style="font-weight:800;font-size:12px;">${t.name}</div>
                                <div style="font-family:var(--font-Telemetry);font-size:10px;color:#94A3B8;">AERO ${t.specs.aero} • POWR ${t.specs.powertrain}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="margin-bottom:12px;">
                    <div style="font-family:var(--font-Telemetry);font-size:10px;color:#64748B;margin-bottom:4px;">2. SELECT RACE DISTANCE FORMAT:</div>
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
                        ${Object.keys(window.F1Data.raceFormats).map(fk => {
                            const f = window.F1Data.raceFormats[fk];
                            return `
                                <button class="fia-btn-slate ${this.newCareerSelectedFormat === fk ? 'active' : ''}"
                                        style="padding:6px 4px;font-size:10px;"
                                        onclick="window.F1App.selectNewCareerFormat('${fk}')">
                                    ${f.id}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>

                <button class="fia-btn-red" style="width:100%;" onclick="window.F1App.startFreshCareerFromMenu()">
                    START NEW 2025 CHAMPIONSHIP SEASON (처음부터 새로 시작)
                </button>
            `;
        }

        const slotsEl = document.getElementById('mainMenuSaveSlotsArea');
        if (slotsEl) {
            slotsEl.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
                    ${[1, 2, 3].map(slotNum => {
                        const meta = this.career.getSlotMeta(slotNum);
                        return `
                            <div style="background:#141824;border:1px solid var(--border-subtle);padding:10px 12px;display:flex;justify-content:space-between;align-items:center;">
                                <div>
                                    <div style="font-family:var(--font-Telemetry);font-size:11px;color:#FFD100;font-weight:800;">SAVE SLOT #${slotNum}</div>
                                    ${meta ? `
                                        <div style="font-weight:700;font-size:12px;color:#fff;">${meta.teamName} • ${meta.roundStr}</div>
                                        <div style="font-family:var(--font-Telemetry);font-size:10px;color:#94A3B8;">${meta.budgetStr} • 저장시각: ${meta.savedAt}</div>
                                    ` : `
                                        <div style="font-size:11px;color:#64748B;">비어 있는 슬롯 (Empty Slot)</div>
                                    `}
                                </div>
                                <div style="display:flex;gap:6px;">
                                    <button class="fia-btn-slate" style="padding:5px 10px;font-size:11px;border-color:#22C55E;color:#22C55E;"
                                            onclick="window.F1App.saveCareerSlot(${slotNum})">SAVE</button>
                                    <button class="fia-btn-slate" style="padding:5px 10px;font-size:11px;${meta ? 'border-color:#38BDF8;color:#38BDF8;' : 'opacity:0.4;'}"
                                            ${meta ? '' : 'disabled'}
                                            onclick="window.F1App.loadCareerSlot(${slotNum})">LOAD</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="border-top:1px solid var(--border-subtle);padding-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button class="fia-btn-slate" style="border-color:#FFD100;color:#FFD100;" onclick="window.F1App.exportSaveFile()">
                        EXPORT SAVE FILE (.JSON 다운로드)
                    </button>
                    <button class="fia-btn-slate" style="border-color:#38BDF8;color:#38BDF8;" onclick="document.getElementById('saveFileInput').click()">
                        IMPORT SAVE FILE (.JSON 불러오기)
                    </button>
                </div>
            `;
        }
    }

    selectNewCareerTeam(teamId) {
        window.f1Audio.playUiClick(false);
        this.newCareerSelectedTeam = teamId;
        this.renderMainMenuContent();
    }

    selectNewCareerFormat(fmtKey) {
        window.f1Audio.playUiClick(false);
        this.newCareerSelectedFormat = fmtKey;
        this.renderMainMenuContent();
    }

    startFreshCareerFromMenu() {
        window.f1Audio.playUiClick(true);
        this.career.startNewSeason(this.newCareerSelectedTeam, this.newCareerSelectedFormat);
        document.getElementById('fiaMainMenuScreen').style.display = 'none';
        this.refreshAllViews();
        this.switchView('race');
        this.launchLiveGrandPrix(false);
        this.notify(`새 시즌 개막! ${this.career.getPlayerTeam().name} (${this.newCareerSelectedFormat} 거리 포맷)`);
    }

    saveCareerSlot(slotNum) {
        window.f1Audio.playUiClick(true);
        const res = this.career.saveToSlot(slotNum);
        this.renderMainMenuContent();
        this.notify(res.msg);
    }

    loadCareerSlot(slotNum) {
        window.f1Audio.playUiClick(true);
        const res = this.career.loadFromSlot(slotNum);
        if (res.ok) {
            document.getElementById('fiaMainMenuScreen').style.display = 'none';
            this.refreshAllViews();
            this.launchLiveGrandPrix(false);
        }
        this.notify(res.msg);
    }

    exportSaveFile() {
        window.f1Audio.playUiClick(true);
        const fname = this.career.exportSaveToFile();
        this.notify(`세이브 파일 다운로드 완료: ${fname}`);
    }

    handleSaveFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const res = this.career.importSaveFromJsonString(e.target.result);
            this.notify(res.msg);
            if (res.ok) {
                document.getElementById('fiaMainMenuScreen').style.display = 'none';
                this.refreshAllViews();
                this.launchLiveGrandPrix(false);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // =========================================================================
    // VIEW 1: LIVE GRAND PRIX & PIT WALL TELEMETRY (STATIC BUTTONS, ZERO CLICK LOSS)
    // =========================================================================
    launchLiveGrandPrix(isTestMode = false) {
        const circuit = this.career.getCurrentCircuit();
        const gridOrder = this.career.getStartingGridDrivers();

        document.getElementById('rcGpCode').textContent = isTestMode
            ? `TEST • ${circuit.code}`
            : `R${String(circuit.round).padStart(2, '0')} ${circuit.code}`;
        document.getElementById('pwCircuitMapTitle').textContent = `${circuit.location.toUpperCase()} (${circuit.realLaps}L CIRCUIT)`;
        document.getElementById('liveRadioList').innerHTML = '';

        this.engine.setupGrandPrix(
            circuit,
            gridOrder,
            this.career.state.playerTeamId,
            {
                isTestTrackMode: isTestMode,
                raceFormat: this.career.state.raceFormat || 'FULL',
                driveControlMode: this.career.state.driveControlMode || 'MANUAL',
                startingTires: this.career.state.startingTires || {},
                tuning: this.career.state.tuning
            }
        );

        // Build static Pit Wall Driver Control Cards once per race so button clicks NEVER fail!
        this.buildStaticPitWallDriverBox('pwDriverBox1', this.engine.playerCar1);
        this.buildStaticPitWallDriverBox('pwDriverBox2', this.engine.playerCar2);
        this.buildStaticTimingTowerRows(this.engine.getSnapshot().standings);

        this.appendRadioLog('RACE ENGINEER', `${circuit.name} (${this.engine.totalLaps} Laps) 세션 시작. 트랙 위의 초록/노랑/빨강 레코드 라인을 따라 브레이킹과 에이펙스를 공략하십시오.`);
        this.syncDriveModeButton();
    }

    buildStaticTimingTowerRows(standings) {
        const towerEl = document.getElementById('liveTimingRows');
        if (!towerEl) return;
        towerEl.innerHTML = standings.map((_, idx) => `
            <div class="tower-row" id="towerSlot_${idx}" data-driver-id="" onclick="window.F1App.onTowerRowClick(this)">
                <span class="tr-pos" id="tsPos_${idx}">${idx + 1}</span>
                <span class="tr-bar" id="tsBar_${idx}"></span>
                <span class="tr-code" id="tsCode_${idx}">---</span>
                <span class="tr-gap" id="tsGap_${idx}">-</span>
                <span class="tr-tire" id="tsTire_${idx}">S</span>
                <span class="tr-wear" id="tsWear_${idx}">100%</span>
                <span class="tr-pits" id="tsPits_${idx}">0P</span>
            </div>
        `).join('');
    }

    onTowerRowClick(rowEl) {
        const drvId = rowEl.getAttribute('data-driver-id');
        if (drvId) {
            this.focusDriverCamera(drvId);
        }
    }

    // Build static DOM structure for Pit Wall Strategy Box once; update only classes & text on tick
    buildStaticPitWallDriverBox(elId, car) {
        const el = document.getElementById(elId);
        if (!el) return;
        if (!car) {
            el.style.display = 'none';
            return;
        }
        el.style.display = 'block';
        const dId = car.driver.id;

        el.innerHTML = `
            <div class="pw-drv-top">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span id="${elId}_pos" style="background:${car.team.primaryColor};color:#fff;font-family:var(--font-Telemetry);font-size:10px;font-weight:800;padding:1px 5px;">P${car.position}</span>
                    <span style="font-weight:800;font-size:12px;cursor:pointer;" onclick="window.F1App.focusDriverCamera('${dId}')">#${car.driver.number} ${car.driver.korName}</span>
                </div>
                <span id="${elId}_telemetry" style="font-family:var(--font-Telemetry);font-size:10px;font-weight:700;">
                    S 100% • WING 100%
                </span>
            </div>

            <div class="pw-cmd-grid">
                <button id="${elId}_pace_ATTACK" class="pw-cmd-btn" onclick="window.F1App.setDriverCmd('${dId}','ATTACK',null)">PACE: ATTACK</button>
                <button id="${elId}_pace_BALANCED" class="pw-cmd-btn" onclick="window.F1App.setDriverCmd('${dId}','BALANCED',null)">PACE: BALANCED</button>
                <button id="${elId}_pace_CONSERVE" class="pw-cmd-btn" onclick="window.F1App.setDriverCmd('${dId}','CONSERVE',null)">PACE: CONSERVE</button>
            </div>

            <div class="pw-cmd-grid">
                <button id="${elId}_ers_OVERTAKE" class="pw-cmd-btn" onclick="window.F1App.setDriverCmd('${dId}',null,'OVERTAKE')">ERS: OVERTAKE</button>
                <button id="${elId}_ers_BALANCED" class="pw-cmd-btn" onclick="window.F1App.setDriverCmd('${dId}',null,'BALANCED')">ERS: AUTO</button>
                <button id="${elId}_ers_HARVEST" class="pw-cmd-btn" onclick="window.F1App.setDriverCmd('${dId}',null,'HARVEST')">ERS: HARVEST</button>
            </div>

            <div class="pw-compound-bar">
                ${['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'].map(k => {
                    const tc = window.F1Data.tireCompounds[k];
                    return `
                        <button id="${elId}_comp_${k}" class="pw-comp-btn"
                                style="border-bottom:2px solid ${tc.color};"
                                onclick="window.F1App.setPitCompound('${dId}','${k}')">
                            ${tc.short}
                        </button>
                    `;
                }).join('')}
            </div>

            <button id="${elId}_boxBtn" class="pw-box-btn" onclick="window.F1App.toggleBoxCall('${dId}')">
                BOX THIS LAP
            </button>
        `;
    }

    updateStaticPitWallDriverBox(elId, car) {
        if (!car) return;
        const posEl = document.getElementById(`${elId}_pos`);
        const telEl = document.getElementById(`${elId}_telemetry`);
        if (!posEl || !telEl) return;

        const comp = window.F1Data.tireCompounds[car.tireCompound];
        const wearCol = car.tireHealth > 60 ? '#22C55E' : (car.tireHealth > 32 ? '#FACC15' : '#EF4444');
        posEl.textContent = car.dnf ? 'DNF' : `P${car.position}`;
        telEl.style.color = wearCol;
        telEl.textContent = `${comp.short} ${Math.round(car.tireHealth)}% • WING ${Math.round(car.frontWingHealth)}%`;

        ['ATTACK', 'BALANCED', 'CONSERVE'].forEach(pm => {
            const btn = document.getElementById(`${elId}_pace_${pm}`);
            if (btn) {
                const cls = pm === 'ATTACK' ? 'active-attack' : (pm === 'BALANCED' ? 'active-bal' : 'active-save');
                btn.className = 'pw-cmd-btn' + (car.paceMode === pm ? ` ${cls}` : '');
            }
        });

        ['OVERTAKE', 'BALANCED', 'HARVEST'].forEach(em => {
            const btn = document.getElementById(`${elId}_ers_${em}`);
            if (btn) {
                const cls = em === 'OVERTAKE' ? 'active-attack' : (em === 'BALANCED' ? 'active-bal' : 'active-save');
                btn.className = 'pw-cmd-btn' + (car.ersMode === em ? ` ${cls}` : '');
            }
        });

        ['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'].forEach(k => {
            const btn = document.getElementById(`${elId}_comp_${k}`);
            if (btn) {
                btn.className = 'pw-comp-btn' + (car.nextPitTire === k ? ' selected' : '');
            }
        });

        const boxBtn = document.getElementById(`${elId}_boxBtn`);
        if (boxBtn) {
            boxBtn.className = 'pw-box-btn' + (car.pitRequested ? ' called' : '');
            if (car.dnf) {
                boxBtn.textContent = `RETIRED (${car.dnfReason})`;
            } else if (car.inPitLane) {
                boxBtn.textContent = `IN PIT LANE (${car.pitState})...`;
            } else if (car.pitRequested) {
                boxBtn.textContent = `BOX THIS LAP → ${car.nextPitTire} (CANCEL)`;
            } else {
                boxBtn.textContent = `BOX THIS LAP → FIT ${car.nextPitTire}`;
            }
        }
    }

    updateLiveTelemetryHUD(snap) {
        document.getElementById('rcLapCounter').textContent = snap.isTestTrackMode
            ? `TEST LAP ${snap.lap}`
            : `LAP ${snap.lap} / ${snap.totalLaps}`;
        const flagEl = document.getElementById('rcFlagBadge');
        if (flagEl) {
            flagEl.textContent = snap.trackFlag === 'RED' ? 'RED FLAG' : (snap.trackFlag === 'SC' ? 'SAFETY CAR' : snap.trackFlag);
            flagEl.className = 'rc-flag-badge' + (snap.trackFlag === 'RED' ? ' red' : (snap.trackFlag !== 'GREEN' ? ' vsc' : ''));
        }
        document.getElementById('rcWeatherText').textContent =
            `${snap.weather} • TRACK ${snap.trackTemp}°C • WATER ${snap.trackWater}%`;

        // Update Static Timing Tower Slots (No DOM destruction!)
        snap.standings.forEach((c, idx) => {
            const rowEl = document.getElementById(`towerSlot_${idx}`);
            if (!rowEl) return;
            const comp = window.F1Data.tireCompounds[c.tireCompound] || window.F1Data.tireCompounds.MEDIUM;
            const isWatched = (snap.followedCar && snap.followedCar.driver.id === c.driver.id);
            const gapTxt = c.dnf ? 'DNF' : (c.position === 1 ? 'LEADER' : (c.inPitLane ? 'IN PIT' : `+${c.intervalAhead.toFixed(1)}s`));
            const wearCol = c.tireHealth > 60 ? '#22C55E' : (c.tireHealth > 32 ? '#FACC15' : '#EF4444');

            rowEl.setAttribute('data-driver-id', c.driver.id);
            rowEl.className = `tower-row${c.isPlayerTeam ? ' is-player' : ''}${isWatched ? ' is-watched' : ''}`;

            document.getElementById(`tsPos_${idx}`).textContent = c.dnf ? 'OUT' : c.position;
            document.getElementById(`tsBar_${idx}`).style.background = c.team.primaryColor;
            document.getElementById(`tsCode_${idx}`).textContent = c.driver.code;
            const gapEl = document.getElementById(`tsGap_${idx}`);
            gapEl.textContent = gapTxt;
            gapEl.style.color = c.dnf ? '#EF4444' : (c.inPitLane ? '#FFD100' : '#94A3B8');

            const tireEl = document.getElementById(`tsTire_${idx}`);
            tireEl.textContent = comp.short;
            tireEl.style.borderColor = comp.color;
            tireEl.style.color = comp.color;

            const wearEl = document.getElementById(`tsWear_${idx}`);
            wearEl.textContent = `${Math.round(c.tireHealth)}%`;
            wearEl.style.color = wearCol;

            document.getElementById(`tsPits_${idx}`).textContent = `${c.pitStops}P`;
        });

        // Update Static Pit Wall Driver Cards
        this.updateStaticPitWallDriverBox('pwDriverBox1', snap.playerCar1);
        this.updateStaticPitWallDriverBox('pwDriverBox2', snap.playerCar2);

        // Update Team Orders Buttons
        const toMode = snap.teamOrderMode || 'FREE';
        const toStatusEl = document.getElementById('pwTeamOrderStatus');
        if (toStatusEl) {
            toStatusEl.textContent = toMode === 'SWAP' ? 'MULTI-21 SWAP' : (toMode === 'HOLD' ? 'HOLD STATION' : 'FREE TO RACE');
            toStatusEl.style.color = toMode === 'SWAP' ? '#EF4444' : (toMode === 'HOLD' ? '#38BDF8' : '#22C55E');
        }
        ['FREE', 'HOLD', 'SWAP'].forEach(m => {
            const b = document.getElementById(`toBtn_${m}`);
            if (b) {
                const cls = m === 'SWAP' ? 'active-attack' : (m === 'HOLD' ? 'active-bal' : 'active-save');
                b.className = 'pw-cmd-btn' + (toMode === m ? ` ${cls}` : '');
            }
        });

        // Update 360° Proximity Radar Indicators
        if (snap.proximity) {
            const pL = document.getElementById('proxLeft');
            const pA = document.getElementById('proxAhead');
            const pR = document.getElementById('proxRear');
            const pRt = document.getElementById('proxRight');
            if (pL) {
                pL.className = 'prox-pill' + (snap.proximity.left ? ' danger' : '');
                pL.textContent = snap.proximity.left ? '◀ CAR LEFT!' : '◀ LEFT CLEAR';
            }
            if (pA) {
                pA.className = 'prox-pill' + (snap.proximity.aheadClose ? ' warn' : '');
                pA.textContent = snap.proximity.aheadClose ? '▲ SLIPSTREAM / CLOSE' : '▲ AHEAD CLEAR';
            }
            if (pR) {
                pR.className = 'prox-pill' + (snap.proximity.rear ? ' warn' : '');
                pR.textContent = snap.proximity.rear ? '▼ RIVAL ATTACKING!' : '▼ REAR CLEAR';
            }
            if (pRt) {
                pRt.className = 'prox-pill' + (snap.proximity.right ? ' danger' : '');
                pRt.textContent = snap.proximity.right ? 'CAR RIGHT! ▶' : 'RIGHT CLEAR ▶';
            }
        }

        // Update Bottom Center Telemetry Pod
        const fc = snap.followedCar || snap.playerCar1;
        if (fc) {
            document.getElementById('podSpeed').textContent = Math.round(fc.speedKmh);
            document.getElementById('podRpm').textContent = fc.rpm;
            document.getElementById('podGear').textContent = fc.inPitLane ? 'P' : fc.gear;
            document.getElementById('podErsPct').textContent = `ERS ${Math.round(fc.ersBattery)}% • WING ${Math.round(fc.frontWingHealth)}%`;
            document.getElementById('podErsFill').style.width = `${fc.ersBattery}%`;
            document.getElementById('podWatchedLabel').textContent =
                `ONBOARD: #${fc.driver.number} ${fc.driver.code} (P${fc.position} • BEST ${this.career.formatLapTime(fc.bestLapTime)})`;

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

    focusDriverCamera(driverId) {
        window.f1Audio.playUiClick(false);
        this.engine.setFollowedDriver(driverId);
    }

    setDriverCmd(driverId, pace, ers) {
        window.f1Audio.playUiClick(false);
        this.engine.setCarCommands(driverId, pace, ers);
        this.updateLiveTelemetryHUD(this.engine.getSnapshot());
    }

    setTeamOrder(mode) {
        window.f1Audio.playUiClick(true);
        this.engine.setTeamOrder(mode);
        this.updateLiveTelemetryHUD(this.engine.getSnapshot());
    }

    setPitCompound(driverId, compKey) {
        window.f1Audio.playUiClick(false);
        this.engine.setNextPitCompound(driverId, compKey);
        this.updateLiveTelemetryHUD(this.engine.getSnapshot());
    }

    toggleBoxCall(driverId) {
        this.engine.togglePitCall(driverId);
        this.updateLiveTelemetryHUD(this.engine.getSnapshot());
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
        this.appendRadioLog('METEO FRANCE', `기상 레이더 업데이트: [${next}] 상태로 전환되었습니다.`);
    }

    triggerFlashbackLive() {
        window.f1Audio.playUiClick(true);
        const ok = this.engine.triggerFlashback();
        if (ok) {
            this.notify('⏪ FLASHBACK: 주행 시점을 5초 전으로 되감았습니다!');
        } else {
            this.notify('아직 되감기할 이전 주행 스냅샷이 부족합니다 (최소 2초 주행 후 사용 가능).');
        }
    }

    triggerVscLive() {
        window.f1Audio.playUiClick(true);
        const nextType = this.engine.trackFlag === 'SC' ? 'VSC' : 'SC';
        this.engine.triggerSafetyCar(nextType, '트랙 위 카본 데브리 수거 및 세이프티카 선도 주행!');
        this.notify(`🟡 ${nextType === 'SC' ? 'SAFETY CAR 출동! 선두에 실제 세이프티카가 배치되었습니다.' : 'VIRTUAL SAFETY CAR 발령!'}`);
    }

    triggerRedFlagLive() {
        window.f1Audio.playUiClick(true);
        this.engine.triggerRedFlag('레이스 디렉터 적기(RED FLAG) 발령 — 트랙 배리어 점검 및 전 차량 그리드 정렬');
    }

    showRedFlagGarageModal(reason, curLap, totalLaps) {
        const modal = document.getElementById('redFlagGarageModal');
        const body = document.getElementById('redFlagGarageBody');
        if (!modal || !body) return;

        const c1 = this.engine.playerCar1;
        const c2 = this.engine.playerCar2;
        if (c1) this.redFlagTire1 = c1.tireCompound;
        if (c2) this.redFlagTire2 = c2.tireCompound;

        this.renderRedFlagGarageContent(reason, curLap, totalLaps);
        modal.style.display = 'flex';
    }

    renderRedFlagGarageContent(reason, curLap, totalLaps) {
        const body = document.getElementById('redFlagGarageBody');
        if (!body) return;
        const c1 = this.engine.playerCar1;
        const c2 = this.engine.playerCar2;

        const renderCarBox = (car, slotNum, selectedTire) => {
            if (!car) return '';
            return `
                <div style="background:#0D1017;border:1px solid var(--border-strong);border-left:4px solid ${car.team.primaryColor};padding:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <strong style="font-size:15px;">P${car.position} • #${car.driver.number} ${car.driver.korName} (${car.driver.code})</strong>
                        <span style="font-family:var(--font-Telemetry);font-size:11px;color:#22C55E;font-weight:800;">
                            ${car.dnf ? 'RETIRED (DNF)' : 'WING REPAIRED 100%'}
                        </span>
                    </div>
                    <div style="font-size:11px;color:#94A3B8;margin-bottom:10px;">
                        레드플래그 규정(Article 57.4)에 따라 피트스톱 시간 손실 없이 새 타이어 세트로 무료 교체할 수 있습니다:
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">
                        ${Object.keys(window.F1Data.tireCompounds).map(tk => {
                            const tc = window.F1Data.tireCompounds[tk];
                            const isSel = selectedTire === tk;
                            return `
                                <button class="pw-comp-btn ${isSel ? 'selected' : ''}"
                                        style="border-bottom:3px solid ${tc.color};padding:8px 0;font-size:11px;${isSel ? 'outline:2px solid #fff;' : ''}"
                                        onclick="window.F1App.selectRedFlagTire(${slotNum}, '${tk}')">
                                    <div>${tc.short}</div>
                                    <div style="font-size:9px;color:#94A3B8;">100% NEW</div>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        };

        body.innerHTML = `
            <div class="fia-panel-head" style="border-bottom:2px solid #EF4444;">
                <div>
                    <div style="font-family:var(--font-Telemetry);font-size:11px;color:#EF4444;font-weight:800;">FIA RACE CONTROL — SESSION SUSPENDED</div>
                    <div class="fia-panel-title" style="font-size:22px;color:#EF4444;">🔴 RED FLAG — PARC FERMÉ &amp; STANDING RESTART</div>
                </div>
                <span style="font-family:var(--font-Telemetry);font-size:13px;color:#FFD100;font-weight:800;">
                    LAP ${curLap} / ${totalLaps} • WEATHER: ${this.engine.weather}
                </span>
            </div>

            <div style="background:rgba(239,68,68,0.12);border:1px solid #EF4444;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#FCA5A5;">
                <strong>적기 발령 사유:</strong> ${reason}<br>
                모든 생존 차량이 현재 순위대로 스타트/피니시 그리드에 재정렬되었으며, 파손된 프론트 윙이 100% 수리되었습니다. 재출발에 사용할 타이어 컴파운드를 선택하십시오.
            </div>

            <div class="mgmt-grid-2" style="margin-bottom:18px;">
                ${renderCarBox(c1, 1, this.redFlagTire1)}
                ${renderCarBox(c2, 2, this.redFlagTire2)}
            </div>

            <button class="fia-btn-red" style="width:100%;font-size:16px;padding:12px;" onclick="window.F1App.confirmRedFlagRestart()">
                🟢 PROCEED TO STANDING RESTART (5 RED LIGHTS 그리드 재출발)
            </button>
        `;
    }

    selectRedFlagTire(slotNum, compKey) {
        window.f1Audio.playUiClick(false);
        if (slotNum === 1) this.redFlagTire1 = compKey;
        else this.redFlagTire2 = compKey;
        const snap = this.engine.getSnapshot();
        this.renderRedFlagGarageContent('트랙 정비 완료 대기 중', snap.lap, snap.totalLaps);
    }

    confirmRedFlagRestart() {
        window.f1Audio.playUiClick(true);
        document.getElementById('redFlagGarageModal').style.display = 'none';
        this.engine.resumeFromRedFlag(this.redFlagTire1, this.redFlagTire2);
    }

    manualDrsClick() {
        this.engine.manualToggleDrs();
    }

    finishRaceNow() {
        window.f1Audio.playUiClick(true);
        if (this.engine.isTestTrackMode) {
            this.switchView('engineering');
            this.notify('성능 테스트 트랙 주행을 종료하고 R&D 연구소로 복귀했습니다.');
        } else {
            this.engine.completeRaceSession();
        }
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
        const curFmt = this.career.state.raceFormat || 'FULL';

        const briefEl = document.getElementById('weekendGpBriefingPanel');
        if (briefEl) {
            briefEl.innerHTML = `
                <div class="fia-panel-head">
                    <div>
                        <div style="font-family:var(--font-Telemetry);font-size:11px;color:#E10600;font-weight:800;">ROUND ${circuit.round} OF 24 • ${circuit.location.toUpperCase()} (${circuit.biome})</div>
                        <div class="fia-panel-title" style="font-size:20px;">${circuit.name}</div>
                    </div>
                    <span style="font-family:var(--font-Telemetry);font-size:12px;color:#FFD100;font-weight:800;">
                        OFFICIAL FIA DISTANCE: ${circuit.realLaps} LAPS (${circuit.lengthKm} KM)
                    </span>
                </div>

                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
                    <div style="background:#0D1017;padding:10px;border:1px solid var(--border-subtle);">
                        <div style="font-size:10px;color:#64748B;">100% REAL LAPS</div>
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
                    <div style="font-family:var(--font-Telemetry);font-size:11px;color:#94A3B8;margin-bottom:6px;">SELECT GRAND PRIX DISTANCE FORMAT (실제 경기 바퀴수 선택 — 기본 100% 실제 랩수):</div>
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
                        ${Object.keys(window.F1Data.raceFormats).map(fk => {
                            const f = window.F1Data.raceFormats[fk];
                            const lapsCount = f.fixedLaps ? f.fixedLaps : Math.max(5, Math.round(circuit.realLaps * f.scale));
                            return `
                                <button class="fia-btn-slate ${curFmt === fk ? 'active' : ''}"
                                        onclick="window.F1App.selectRaceFormat('${fk}')">
                                    <div>${f.label}</div>
                                    <div style="font-family:var(--font-Telemetry);font-size:12px;color:#FFD100;margin-top:3px;">${lapsCount} LAPS</div>
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
        this.notify(`레이스 거리 포맷이 [${window.F1Data.raceFormats[fmtKey].label}]로 변경되었습니다.`);
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
        this.launchLiveGrandPrix(false);
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
                            <span>R${String(c.round).padStart(2, '0')} • ${c.code} (${c.biome})</span>
                            <span style="color:#FFD100;font-weight:800;">${c.realLaps} LAPS (${c.lengthKm}KM)</span>
                        </div>
                        <div style="font-weight:800;font-size:13px;margin-bottom:6px;">${c.name}</div>
                        ${done ? `
                            <div style="font-family:var(--font-Telemetry);font-size:11px;color:#22C55E;">
                                WINNER: ${done.winnerName} (${done.winnerCode}) • TEAM P${done.playerBestPos}
                            </div>
                        ` : `
                            <div style="font-family:var(--font-Telemetry);font-size:10px;color:#94A3B8;">
                                AERO ${Math.round(c.aeroWeight * 100)}% • POWER ${Math.round(c.powerWeight * 100)}% • DRS ${c.drsZones.length} ZONES
                            </div>
                        `}
                    </div>
                `;
            }).join('');
        }
    }

    jumpToCircuitRound(roundIdx) {
        window.f1Audio.playUiClick(true);
        this.career.state.currentRoundIndex = roundIdx;
        this.career.state.qualifyingOrder = null;
        this.career.save();
        this.refreshAllViews();
        const c = this.career.getCurrentCircuit();
        this.notify(`선택된 그랑프리: R${c.round} ${c.name} (실제 ${c.realLaps} Laps)`);
    }

    // =========================================================================
    // VIEW 4: R&D ENGINEERING + EQUIPMENT / TIRE DYNO TEST BENCH
    // =========================================================================
    renderEngineeringView() {
        const team = this.career.getPlayerTeam();
        const circuit = this.career.getCurrentCircuit();
        const levels = this.career.state.rdLevels[team.id] || { aero: 0, powertrain: 0, chassis: 0, durability: 0 };
        const tuning = this.career.state.tuning || window.F1Data.defaultTuning;
        const dyno = this.career.computeDynoTelemetry(circuit, this.dynoTireCompound);

        document.getElementById('engBudgetLabel').textContent = `COST CAP: $${(team.budget / 1e6).toFixed(2)}M`;

        const benchEl = document.getElementById('dynoTestBenchContainer');
        if (benchEl) {
            benchEl.innerHTML = `
                <!-- Left: Mechanical & Aero Setup Sliders -->
                <div style="background:#0D1017;border:1px solid var(--border-subtle);padding:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <span style="font-family:var(--font-Broadcast);font-size:14px;font-weight:800;color:#FFD100;">MECHANICAL &amp; AERO SETUP TUNING (기계/윙/타이어 셋업)</span>
                        <span style="font-family:var(--font-Telemetry);font-size:10px;color:#22C55E;">${circuit.code} 권장 윙 각도: ${dyno.idealWingForCircuit}</span>
                    </div>

                    <div class="tuning-slider-row">
                        <div class="tuning-slider-label">
                            <span>FRONT WING ANGLE (프론트 윙 각도: 직선속도 ↔ 코너그립)</span>
                            <strong style="color:#fff;">LEVEL ${tuning.frontWingAngle} / 11</strong>
                        </div>
                        <input type="range" min="1" max="11" step="1" value="${tuning.frontWingAngle}" class="tuning-range"
                               oninput="window.F1App.updateTuningParam('frontWingAngle', this.value)">
                    </div>

                    <div class="tuning-slider-row">
                        <div class="tuning-slider-label">
                            <span>REAR WING ANGLE (리어 윙 &amp; DRS 드래그 밸런스)</span>
                            <strong style="color:#fff;">LEVEL ${tuning.rearWingAngle} / 11</strong>
                        </div>
                        <input type="range" min="1" max="11" step="1" value="${tuning.rearWingAngle}" class="tuning-range"
                               oninput="window.F1App.updateTuningParam('rearWingAngle', this.value)">
                    </div>

                    <div class="tuning-slider-row">
                        <div class="tuning-slider-label">
                            <span>SUSPENSION STIFFNESS (서스펜션 강성: 연석 흡수 ↔ 응답성)</span>
                            <strong style="color:#fff;">LEVEL ${tuning.suspensionStiffness} / 10</strong>
                        </div>
                        <input type="range" min="1" max="10" step="1" value="${tuning.suspensionStiffness}" class="tuning-range"
                               oninput="window.F1App.updateTuningParam('suspensionStiffness', this.value)">
                    </div>

                    <div class="tuning-slider-row">
                        <div class="tuning-slider-label">
                            <span>BRAKE BIAS (브레이크 밸런스: 50% Rear ↔ 62% Front)</span>
                            <strong style="color:#fff;">${tuning.brakeBias}% FRONT</strong>
                        </div>
                        <input type="range" min="50" max="62" step="1" value="${tuning.brakeBias}" class="tuning-range"
                               oninput="window.F1App.updateTuningParam('brakeBias', this.value)">
                    </div>

                    <div class="tuning-slider-row" style="margin-bottom:0;">
                        <div class="tuning-slider-label">
                            <span>TYRE PRESSURE PSI (피렐리 타이어 공기압: 온도/마모 제어)</span>
                            <strong style="color:#fff;">${tuning.tirePressurePsi} PSI</strong>
                        </div>
                        <input type="range" min="20.0" max="25.0" step="0.5" value="${tuning.tirePressurePsi}" class="tuning-range"
                               oninput="window.F1App.updateTuningParam('tirePressurePsi', this.value)">
                    </div>
                </div>

                <!-- Right: Live Wind Tunnel & Tire Compound Dyno Output -->
                <div style="background:#0D1017;border:1px solid var(--border-subtle);padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
                    <div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                            <span style="font-family:var(--font-Broadcast);font-size:14px;font-weight:800;color:#38BDF8;">LIVE DYNO &amp; TYRE COMPOUND BENCHMARK</span>
                            <div style="display:flex;gap:4px;">
                                ${['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'].map(tk => {
                                    const tc = window.F1Data.tireCompounds[tk];
                                    return `
                                        <button class="pw-comp-btn ${this.dynoTireCompound === tk ? 'selected' : ''}"
                                                style="border-bottom:2px solid ${tc.color};padding:3px 7px;"
                                                onclick="window.F1App.selectDynoCompound('${tk}')">${tc.short}</button>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
                            <div style="background:#141824;padding:10px;border:1px solid var(--border-subtle);">
                                <div style="font-size:10px;color:#64748B;">TOP SPEED (DRS OPEN)</div>
                                <div style="font-family:var(--font-Telemetry);font-size:16px;font-weight:800;color:#22C55E;">${dyno.topSpeedDrsKmh} KM/H</div>
                                <div style="font-family:var(--font-Telemetry);font-size:10px;color:#94A3B8;">NO DRS: ${dyno.topSpeedKmh} KM/H</div>
                            </div>
                            <div style="background:#141824;padding:10px;border:1px solid var(--border-subtle);">
                                <div style="font-size:10px;color:#64748B;">MAX CORNERING FORCE</div>
                                <div style="font-family:var(--font-Telemetry);font-size:16px;font-weight:800;color:#38BDF8;">${dyno.corneringG} G</div>
                                <div style="font-family:var(--font-Telemetry);font-size:10px;color:#94A3B8;">0-200 KM/H: ${dyno.zeroTo200Sec}s</div>
                            </div>
                            <div style="background:#141824;padding:10px;border:1px solid var(--border-subtle);">
                                <div style="font-size:10px;color:#64748B;">100-0 BRAKING DIST</div>
                                <div style="font-family:var(--font-Telemetry);font-size:16px;font-weight:800;color:#FFD100;">${dyno.braking100To0Meters} M</div>
                                <div style="font-family:var(--font-Telemetry);font-size:10px;color:#94A3B8;">EFF AERO/PWR: ${dyno.effAero}/${dyno.effPower}</div>
                            </div>
                        </div>

                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                            <div style="background:#141824;padding:10px;border-left:3px solid #A855F7;">
                                <div style="font-size:10px;color:#94A3B8;">PREDICTED ${circuit.code} QUALI LAP (${this.dynoTireCompound})</div>
                                <div style="font-family:var(--font-Telemetry);font-size:18px;font-weight:800;color:#fff;margin-top:2px;">${dyno.predictedLapStr}</div>
                            </div>
                            <div style="background:#141824;padding:10px;border-left:3px solid #E10600;">
                                <div style="font-size:10px;color:#94A3B8;">ESTIMATED TYRE WEAR &amp; STINT LIFE</div>
                                <div style="font-family:var(--font-Telemetry);font-size:15px;font-weight:800;color:#FFD100;margin-top:2px;">${dyno.wearPerLapPct}% / LAP (약 ${dyno.estimatedStintLaps} LAPS)</div>
                            </div>
                        </div>
                    </div>

                    <div style="font-size:11px;color:#94A3B8;margin-top:10px;">
                        * 슬라이더를 조절하면 즉시 위 다이노 시뮬레이션 수치가 갱신되며, 우측 상단 <b>[LAUNCH 3D SHAKEDOWN TEST TRACK]</b>을 누르면 현재 셋업과 타이어로 서킷을 단독 주행하며 테스트할 수 있습니다.
                    </div>
                </div>
            `;
        }

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

    updateTuningParam(key, val) {
        if (!this.career.state.tuning) {
            this.career.state.tuning = JSON.parse(JSON.stringify(window.F1Data.defaultTuning));
        }
        this.career.state.tuning[key] = parseFloat(val);
        this.career.save();
        if (this.engine) {
            this.engine.playerTuning = this.career.state.tuning;
        }
        this.renderEngineeringView();
    }

    selectDynoCompound(compKey) {
        window.f1Audio.playUiClick(false);
        this.dynoTireCompound = compKey;
        this.renderEngineeringView();
    }

    launchShakedownTestTrack() {
        window.f1Audio.playUiClick(true);
        const drivers = this.career.getTeamDrivers(this.career.state.playerTeamId);
        if (drivers.length) {
            this.career.state.startingTires[drivers[0].id] = this.dynoTireCompound;
        }
        this.switchView('race');
        this.launchLiveGrandPrix(true);
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
                    <button class="fia-btn-slate" style="padding:4px 10px;font-size:11px;" onclick="window.F1App.openMainMenu()">MAIN MENU / SAVE &amp; RESET</button>
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
            this.launchLiveGrandPrix(false);
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
                            <th>STATUS / GAP</th>
                            <th>PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.classification.map(r => {
                            const isMine = r.teamId === this.career.state.playerTeamId;
                            return `
                                <tr class="${isMine ? 'highlight-team' : ''}">
                                    <td style="font-family:var(--font-Telemetry);font-weight:800;color:${r.pos === 'DNF' ? '#EF4444' : '#fff'};">${r.pos === 'DNF' ? 'DNF' : 'P' + r.pos}</td>
                                    <td>
                                        <strong>${r.korName}</strong>
                                        <span style="font-family:var(--font-Telemetry);color:#64748B;">${r.code}</span>
                                        ${r.isFL ? '<span style="background:#A855F7;color:#fff;font-family:var(--font-Telemetry);font-size:9px;padding:1px 4px;margin-left:4px;">FL +1</span>' : ''}
                                    </td>
                                    <td><span style="display:inline-block;width:3px;height:12px;background:${r.teamColor};margin-right:6px;vertical-align:middle;"></span>${r.teamName}</td>
                                    <td style="font-family:var(--font-Telemetry);">P${r.gridPos}</td>
                                    <td style="font-family:var(--font-Telemetry);">${r.stints.map(s => s[0]).join('→')} (${r.pits})</td>
                                    <td style="font-family:var(--font-Telemetry);">${r.bestLapStr}</td>
                                    <td style="font-family:var(--font-Telemetry);color:${r.pos === 'DNF' ? '#EF4444' : '#94A3B8'};">${r.gapStr}</td>
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
                <button class="fia-btn-red" onclick="document.getElementById('postRaceClassificationModal').style.display='none';window.F1App.launchLiveGrandPrix(false);">
                    PROCEED TO NEXT GRAND PRIX →
                </button>
            </div>
        `;

        modal.style.display = 'flex';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.F1App = new F1ManagerApp();
});
