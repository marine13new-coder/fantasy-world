// Architects FC - FIFA Online Edition Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Current Base Year for building age calculation
    const CURRENT_YEAR = 2026;

    // Helper: Calculate building age from completion year to 2026
    function getBuildingAge(year) {
        if (!year) return 50;
        const age = CURRENT_YEAR - year;
        return age <= 0 ? 1 : age;
    }

    // Application State
    const state = {
        homeManager: MANAGERS_DATA[0], // Le Corbusier
        awayManager: MANAGERS_DATA[1], // Zaha Hadid
        currentFormation: '4-3-3',
        startingXI: [],
        bench: [],
        pitchCanvas: null,
        activeMatch: null,
        selectedBuildingForDetail: null,
        selectedEnhanceBuilding: null,
        clubCoins: 125000,
        // Player Swap State
        swapTargetIndex: null,
        swapScope: 'bench', // 'bench' or 'all'
        swapFilterPos: 'all',
        swapSort: 'ovr_desc',
        swapSearch: '',
        // Codex Filter
        codexFilter: {
            manager: 'all',
            position: 'all',
            tier: 'all',
            search: ''
        }
    };

    // Formations Definition
    const FORMATIONS = {
        '4-3-3': {
            name: '4-3-3 (공격적 날개 전술)',
            rows: [
                { pos: 'FW', slots: ['LW', 'ST', 'RW'] },
                { pos: 'MF', slots: ['LCM', 'CM', 'RCM'] },
                { pos: 'DF', slots: ['LB', 'LCB', 'RCB', 'RB'] },
                { pos: 'GK', slots: ['GK'] }
            ]
        },
        '4-2-3-1': {
            name: '4-2-3-1 (밸런스형 현대 축구)',
            rows: [
                { pos: 'FW', slots: ['ST'] },
                { pos: 'MF', slots: ['LAM', 'CAM', 'RAM'] },
                { pos: 'MF', slots: ['LDM', 'RDM'] },
                { pos: 'DF', slots: ['LB', 'LCB', 'RCB', 'RB'] },
                { pos: 'GK', slots: ['GK'] }
            ]
        },
        '3-5-2': {
            name: '3-5-2 (중원 장악형 기동 전술)',
            rows: [
                { pos: 'FW', slots: ['LS', 'RS'] },
                { pos: 'MF', slots: ['LM', 'LCM', 'CM', 'RCM', 'RM'] },
                { pos: 'DF', slots: ['LCB', 'CB', 'RCB'] },
                { pos: 'GK', slots: ['GK'] }
            ]
        },
        '4-4-2': {
            name: '4-4-2 (정통 프레리 클래식)',
            rows: [
                { pos: 'FW', slots: ['LS', 'RS'] },
                { pos: 'MF', slots: ['LM', 'LCM', 'RCM', 'RM'] },
                { pos: 'DF', slots: ['LB', 'LCB', 'RCB', 'RB'] },
                { pos: 'GK', slots: ['GK'] }
            ]
        },
        '5-3-2': {
            name: '5-3-2 (콘크리트 카테나치오)',
            rows: [
                { pos: 'FW', slots: ['LS', 'RS'] },
                { pos: 'MF', slots: ['LCM', 'CM', 'RCM'] },
                { pos: 'DF', slots: ['LWB', 'LCB', 'CB', 'RCB', 'RWB'] },
                { pos: 'GK', slots: ['GK'] }
            ]
        }
    };

    // Helper: Format BP Value to Korean notation
    function formatBP(num) {
        if (!num || isNaN(num)) num = 10000000000;
        if (num >= 1000000000000) {
            const jo = Math.floor(num / 1000000000000);
            const eok = Math.floor((num % 1000000000000) / 100000000);
            return eok > 0 ? `${jo}조 ${eok.toLocaleString()}억 BP` : `${jo}조 BP`;
        } else if (num >= 100000000) {
            const eok = Math.floor(num / 100000000);
            return `${eok.toLocaleString()}억 BP`;
        }
        return `${num.toLocaleString()} BP`;
    }

    // Helper: Grade class and name
    function getGradeInfo(enhancement = 1) {
        if (enhancement >= 8) return { cls: 'grade-gold', type: 'gold', name: `${enhancement}강 (금카)` };
        if (enhancement >= 5) return { cls: 'grade-silver', type: 'silver', name: `${enhancement}강 (은카)` };
        return { cls: 'grade-bronze', type: 'bronze', name: `${enhancement}강 (동카)` };
    }

    // Helper: Create authentic FIFA FUT Card HTML with Age and Salary
    function createFutCardHtml(b, customClass = '') {
        const tier = (b.cardTier || 'ICON').toLowerCase();
        const gradeInfo = getGradeInfo(b.enhancement || 1);
        const stars = '★'.repeat(b.skillMoves || 5);
        const fallbackImg = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80';
        const age = getBuildingAge(b.year);

        return `
            <div class="fut-card tier-${tier} ${customClass}" data-id="${b.id}">
                <!-- Card Ribbon -->
                <div class="card-tier-ribbon">
                    <span class="ribbon-text">${b.cardTier || 'ICON'} CLASS</span>
                    <span class="ribbon-stars">${stars}</span>
                </div>

                <!-- Top Header: OVR, Position, Country Flags & Salary -->
                <div class="card-top-header">
                    <div class="card-ovr-box">
                        <span class="card-ovr-num">${b.ovr}</span>
                        <span class="card-pos-badge pos-${b.position.toLowerCase()}">${b.position}</span>
                    </div>
                    <div class="card-flags-column">
                        <div class="card-salary-badge" title="선수 급여">
                            <span class="lbl">급여</span> ${b.salary || 22}
                        </div>
                        <span class="card-flag-pill" title="건축가 출신국: ${b.architectTrait || b.architectNationality}">
                            👔 ${b.architectNationalityFlag || '🌐'} ${b.architectNationality || b.architectTrait || ''}
                        </span>
                        <span class="card-flag-pill" title="건축물 위치국: ${b.locationTrait || b.country}">
                            📍 ${b.countryFlag || '🌐'} ${b.country || b.city}
                        </span>
                    </div>
                </div>

                <!-- Building Photo with Architect Watermark & Grade Badge -->
                <div class="card-photo-wrapper">
                    <img src="${b.imageUrl || fallbackImg}" 
                         alt="${b.name}" 
                         class="building-photo" 
                         loading="lazy" 
                         onerror="this.onerror=null; this.src='${fallbackImg}'">
                    <div class="photo-gradient-overlay"></div>
                    
                    <div class="card-architect-watermark" title="감독: ${b.managerName}">
                        <img src="${b.managerImageUrl || ''}" class="arch-mini-avatar" onerror="this.style.display='none'">
                        <span class="arch-watermark-name">${b.managerName}</span>
                    </div>

                    <div class="card-enhancement-badge ${gradeInfo.cls}">
                        +${b.enhancement || 1}
                    </div>
                </div>

                <!-- Card Nameplate with Completion Year and Age -->
                <div class="card-nameplate">
                    <div class="card-name-ko">${b.name}</div>
                    <div class="card-name-sub">${b.originalName} · 🏛️ ${b.year}년 완공 (${age}세)</div>
                </div>

                <!-- FIFA 6 Key Stats Grid -->
                <div class="card-fifa-stats">
                    <div class="stat-col">
                        <div class="stat-row"><span class="stat-k">PAC</span><span class="stat-v">${b.stats.SPD}</span></div>
                        <div class="stat-row"><span class="stat-k">SHO</span><span class="stat-v">${b.stats.POW}</span></div>
                        <div class="stat-row"><span class="stat-k">PAS</span><span class="stat-v">${b.stats.PAS}</span></div>
                    </div>
                    <div class="stat-col">
                        <div class="stat-row"><span class="stat-k">DRI</span><span class="stat-v">${b.stats.TEC}</span></div>
                        <div class="stat-row"><span class="stat-k">DEF</span><span class="stat-v">${b.stats.STR}</span></div>
                        <div class="stat-row"><span class="stat-k">PHY</span><span class="stat-v">${b.stats.MNT}</span></div>
                    </div>
                </div>

                <!-- Card Footer Foil & BP Value -->
                <div class="card-footer-foil">
                    <span class="card-value-bp">${formatBP(b.valueBP)}</span>
                    <span class="card-synergy-tag">${b.chemGroup || '현대 모더니즘'}</span>
                </div>
            </div>
        `;
    }

    // Attach 3D interactive tilt effect on cards
    function attach3DTilt(cardElement) {
        cardElement.addEventListener('mousemove', (e) => {
            const rect = cardElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            cardElement.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        cardElement.addEventListener('mouseleave', () => {
            cardElement.style.transform = '';
        });
    }

    // Initialize Canvas
    state.pitchCanvas = new PitchCanvas('pitchCanvas');

    // Tab Navigation
    const navBtns = document.querySelectorAll('.nav-tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sounds.playClick();
            navBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetTab = btn.getAttribute('data-tab');
            document.getElementById(targetTab).classList.add('active');

            if (targetTab === 'tab-match' && state.pitchCanvas) {
                setTimeout(() => state.pitchCanvas.resize(), 100);
            }
            if (targetTab === 'tab-enhance') {
                renderEnhancementLab();
            }
        });
    });

    // Sound Toggle
    const soundBtn = document.getElementById('soundToggleBtn');
    soundBtn.addEventListener('click', () => {
        const isMuted = sounds.toggleMute();
        soundBtn.innerHTML = isMuted ? '🔇' : '🔊';
    });

    // Squad Builder: Automatic best XI for a manager
    function autoBuildSquad(manager, formationKey) {
        const formation = FORMATIONS[formationKey];
        const allBuildings = [...manager.buildings].sort((a, b) => b.ovr - a.ovr);

        const neededPositions = [];
        formation.rows.forEach(r => {
            r.slots.forEach(slot => {
                let generalPos = 'MF';
                if (slot.includes('GK')) generalPos = 'GK';
                else if (slot.includes('B') || slot.includes('CB') || slot.includes('WB')) generalPos = 'DF';
                else if (slot.includes('ST') || slot.includes('S') || slot.includes('W')) generalPos = 'FW';
                neededPositions.push({ slot, generalPos });
            });
        });

        const selected = [];
        const usedIds = new Set();

        neededPositions.forEach(slotInfo => {
            const match = allBuildings.find(b => !usedIds.has(b.id) && b.position === slotInfo.generalPos);
            if (match) {
                selected.push({ ...match, assignedSlot: slotInfo.slot, targetPos: slotInfo.generalPos });
                usedIds.add(match.id);
            } else {
                const fallback = allBuildings.find(b => !usedIds.has(b.id));
                if (fallback) {
                    selected.push({ ...fallback, assignedSlot: slotInfo.slot, targetPos: slotInfo.generalPos });
                    usedIds.add(fallback.id);
                }
            }
        });

        const bench = allBuildings.filter(b => !usedIds.has(b.id));
        return { startingXI: selected, bench: bench };
    }

    function setHomeManager(mgr) {
        state.homeManager = mgr;
        state.currentFormation = mgr.defaultFormation || '4-3-3';
        document.getElementById('formationSelect').value = state.currentFormation;

        const squad = autoBuildSquad(mgr, state.currentFormation);
        state.startingXI = squad.startingXI;
        state.bench = squad.bench;

        renderManagerSelector();
        renderSquadPitch();
        renderBench();
        updateTeamPowerGauges();
        updateMatchTeamDisplay();
        updateTotalClubValue();
    }

    function updateTotalClubValue() {
        const allSquad = [...state.startingXI, ...state.bench];
        const totalBP = allSquad.reduce((sum, b) => sum + (b.valueBP || 10000000000), 0);
        const bpEl = document.getElementById('clubBpValue');
        if (bpEl) {
            bpEl.innerText = formatBP(totalBP);
        }

        // Calculate Total Salary (Cap 250)
        const totalSalary = state.startingXI.reduce((sum, b) => sum + (b.salary || 22), 0);
        const salaryEl = document.getElementById('squadSalaryNum');
        const salaryBar = document.getElementById('salaryBarFill');
        if (salaryEl) salaryEl.innerText = totalSalary;
        if (salaryBar) {
            const pct = Math.min(100, Math.round((totalSalary / 250) * 100));
            salaryBar.style.width = `${pct}%`;
            salaryBar.style.backgroundColor = totalSalary > 250 ? '#ea2b4b' : 'var(--fc-volt)';
        }
    }

    // 1. Manager Selector in Locker Room
    function renderManagerSelector() {
        const container = document.getElementById('managerListContainer');
        container.innerHTML = '';

        MANAGERS_DATA.forEach(mgr => {
            const isSelected = mgr.id === state.homeManager.id;
            const card = document.createElement('div');
            card.className = `manager-btn-card ${isSelected ? 'active' : ''}`;
            card.innerHTML = `
                <div class="mgr-avatar" style="background: ${mgr.badgeBg}; overflow: hidden; padding: 0;">
                    <img src="${mgr.imageUrl || ''}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=''; this.innerText='🏛️'">
                </div>
                <div class="mgr-info">
                    <h4>${mgr.name} <span style="font-size: 13px;">${mgr.nationalityFlag || ''}</span></h4>
                    <p>${mgr.nationalityFlag || ''} ${mgr.nationality} · ${mgr.buildings.length}개 건축물</p>
                    <div class="mgr-buff-badge">⚡ ${mgr.tacticalTrait}</div>
                </div>
            `;
            card.addEventListener('click', () => {
                sounds.playClick();
                setHomeManager(mgr);
            });
            container.appendChild(card);
        });

        const detailBox = document.getElementById('managerDetailBox');
        detailBox.innerHTML = `
            <h5>${state.homeManager.name} 감독의 건축 & 축구 철학</h5>
            <p>"${state.homeManager.quote}"</p>
            <div style="margin-top: 8px; font-size: 11px; color: var(--fc-gold); font-weight: 700;">
                스쿼드 패시브: ${state.homeManager.buff}
            </div>
        `;
    }

    // 2. Render Tactical Pitch Board with Mini FUT Cards (Clicking opens Player Swap!)
    function renderSquadPitch() {
        const formation = FORMATIONS[state.currentFormation];
        const pitchField = document.getElementById('tacticalPitchField');
        pitchField.innerHTML = `
            <div class="pitch-lines-overlay">
                <div class="pitch-half-line"></div>
                <div class="pitch-center-circle"></div>
            </div>
        `;

        // Render Active Chemistry / Team Color
        const teamColorActiveText = document.getElementById('teamColorActiveText');
        const teamColorTagsWrap = document.getElementById('teamColorTagsWrap');
        if (teamColorActiveText && teamColorTagsWrap) {
            teamColorTagsWrap.innerHTML = '';
            
            const countryCounts = {};
            state.startingXI.forEach(p => {
                const c = p.country || '글로벌';
                countryCounts[c] = (countryCounts[c] || 0) + 1;
            });

            const topCountries = Object.entries(countryCounts).sort((a,b) => b[1] - a[1]);
            const primaryGroup = state.homeManager.chemGroup || '모더니즘';

            teamColorActiveText.innerText = `${state.homeManager.name} 사단 [${primaryGroup}] 활성화 (전체 능력치 +3)`;

            topCountries.slice(0, 3).forEach(([country, count]) => {
                const tag = document.createElement('span');
                tag.className = 'teamcolor-tag';
                tag.innerText = `🌐 ${country} ${count}명 적용`;
                teamColorTagsWrap.appendChild(tag);
            });

            const chemTag = document.createElement('span');
            chemTag.className = 'teamcolor-tag';
            chemTag.style.borderColor = 'var(--fc-volt)';
            chemTag.style.color = 'var(--fc-volt)';
            chemTag.innerText = `✨ ${primaryGroup} 특성화`;
            teamColorTagsWrap.appendChild(chemTag);
        }

        let playerIdx = 0;
        formation.rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'pitch-row';

            row.slots.forEach(slot => {
                const player = state.startingXI[playerIdx];
                const currentIndex = playerIdx;
                playerIdx++;
                if (!player) return;

                const gradeInfo = getGradeInfo(player.enhancement || 1);
                const age = getBuildingAge(player.year);

                const slotCard = document.createElement('div');
                slotCard.className = 'pitch-starting-card';
                slotCard.setAttribute('data-slot-idx', currentIndex);
                slotCard.title = `클릭하여 [${slot}] 선수 교체하기`;
                slotCard.innerHTML = `
                    <div class="pitch-starting-top">
                        <span class="pitch-starting-ovr">${player.ovr}</span>
                        <span class="pitch-starting-pos pos-${player.position.toLowerCase()}">${slot}</span>
                        <span style="font-family: var(--font-num); color: var(--fc-volt); font-size: 12px; font-weight: 700;">${player.salary || 22}</span>
                    </div>
                    <img src="${player.imageUrl || ''}" class="pitch-starting-photo" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80'">
                    <div class="pitch-starting-name">${player.name}</div>
                    <div class="pitch-card-age">${age}세 (${player.year})</div>
                    <div class="pitch-starting-grade ${gradeInfo.type}">+${player.enhancement || 1}</div>
                `;

                // Click opens Player Swap Modal for custom squad building!
                slotCard.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    openPlayerSwapModal(currentIndex);
                });

                rowEl.appendChild(slotCard);
            });

            pitchField.appendChild(rowEl);
        });
    }

    // 3. Render Bench (with Age, Salary & Promote Button)
    function renderBench() {
        const benchList = document.getElementById('benchListContainer');
        benchList.innerHTML = '';

        state.bench.forEach((b, idx) => {
            const item = document.createElement('div');
            item.className = 'bench-item-card';
            const age = getBuildingAge(b.year);

            item.innerHTML = `
                <div class="bench-item-left">
                    <span class="pos-tag ${b.position.toLowerCase()}">${b.position}</span>
                    <div class="bench-title">
                        <h5>
                            ${b.countryFlag || '🌐'} ${b.name} 
                            <span style="color: var(--fc-gold); font-size: 11px;">+${b.enhancement || 1}</span>
                            <span class="bench-age-tag">${age}세</span>
                        </h5>
                        <p>${b.country || b.city} (${b.year}년 완공) · 급여 ${b.salary || 22}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="bench-item-ovr">${b.ovr}</span>
                    <button class="swap-action-btn bench-promote-btn" style="padding: 3px 8px; font-size: 11px;" title="선발 라인업과 교체">선발</button>
                </div>
            `;

            // Click row to view detail
            item.addEventListener('click', () => {
                sounds.playClick();
                openBuildingDetailModal(b);
            });

            // Click "선발" button to open swap into matching position slot
            const promoteBtn = item.querySelector('.bench-promote-btn');
            promoteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sounds.playClick();
                // Find matching slot in startingXI, or default slot 0
                let targetSlotIdx = state.startingXI.findIndex(p => p.position === b.position);
                if (targetSlotIdx === -1) targetSlotIdx = 0;
                openPlayerSwapModal(targetSlotIdx);
            });

            benchList.appendChild(item);
        });
    }

    // 4. Update Power Gauges & Squad Average Age
    function updateTeamPowerGauges() {
        const atts = state.startingXI.filter(p => p.position === 'FW');
        const mids = state.startingXI.filter(p => p.position === 'MF');
        const defs = state.startingXI.filter(p => p.position === 'DF' || p.position === 'GK');

        const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, x) => s + x.stats[key], 0) / arr.length) : 75;

        const attVal = Math.round(avg(atts, 'POW') * 0.5 + avg(atts, 'TEC') * 0.3 + avg(atts, 'SPD') * 0.2);
        const midVal = Math.round(avg(mids, 'PAS') * 0.5 + avg(mids, 'TEC') * 0.3 + avg(mids, 'MNT') * 0.2);
        const defVal = Math.round(avg(defs, 'STR') * 0.5 + avg(defs, 'MNT') * 0.3 + avg(defs, 'SPD') * 0.2);
        const overall = Math.round((attVal + midVal + defVal) / 3);

        document.getElementById('attPowerVal').innerText = attVal;
        document.getElementById('midPowerVal').innerText = midVal;
        document.getElementById('defPowerVal').innerText = defVal;
        document.getElementById('ovrPowerVal').innerText = overall;

        // Calculate Squad Average Age
        const avgAge = state.startingXI.length 
            ? Math.round(state.startingXI.reduce((sum, p) => sum + getBuildingAge(p.year), 0) / state.startingXI.length * 10) / 10
            : 0;
        const avgAgeEl = document.getElementById('avgAgeVal');
        if (avgAgeEl) avgAgeEl.innerText = `${avgAge}세`;

        // Calculate Squad Total Salary
        const totalSalary = state.startingXI.reduce((sum, b) => sum + (b.salary || 22), 0);
        const totalSalEl = document.getElementById('totalSalaryVal');
        if (totalSalEl) {
            totalSalEl.innerText = `${totalSalary} / 250`;
            totalSalEl.style.color = totalSalary > 250 ? '#ea2b4b' : 'var(--fc-volt)';
        }
    }

    // Formation Dropdown
    document.getElementById('formationSelect').addEventListener('change', (e) => {
        state.currentFormation = e.target.value;
        const squad = autoBuildSquad(state.homeManager, state.currentFormation);
        state.startingXI = squad.startingXI;
        state.bench = squad.bench;
        renderSquadPitch();
        renderBench();
        updateTeamPowerGauges();
        updateTotalClubValue();
    });

    // Auto Best XI Button
    document.getElementById('autoBestXIBtn').addEventListener('click', () => {
        sounds.playClick();
        const squad = autoBuildSquad(state.homeManager, state.currentFormation);
        state.startingXI = squad.startingXI;
        state.bench = squad.bench;
        renderSquadPitch();
        renderBench();
        updateTeamPowerGauges();
        updateTotalClubValue();
    });

    // Reset Squad Button (기본 스쿼드로 복원)
    const resetSquadBtn = document.getElementById('resetSquadBtn');
    if (resetSquadBtn) {
        resetSquadBtn.addEventListener('click', () => {
            sounds.playClick();
            const squad = autoBuildSquad(state.homeManager, state.homeManager.defaultFormation || '4-3-3');
            state.startingXI = squad.startingXI;
            state.bench = squad.bench;
            renderSquadPitch();
            renderBench();
            updateTeamPowerGauges();
            updateTotalClubValue();
            alert(`[${state.homeManager.name}] 감독의 기본 스쿼드로 복원되었습니다!`);
        });
    }

    // 5. PLAYER SWAP DRAWER & CUSTOM SQUAD BUILDER
    function openPlayerSwapModal(slotIndex) {
        state.swapTargetIndex = slotIndex;
        const current = state.startingXI[slotIndex];
        if (!current) return;

        const modal = document.getElementById('playerSwapModal');
        const slotTag = document.getElementById('swapTargetSlotName');
        slotTag.innerText = `${current.assignedSlot || current.position}`;
        slotTag.className = `pos-tag ${current.position.toLowerCase()}`;

        // Render current player box
        const targetBox = document.getElementById('swapTargetPlayerBox');
        const currentAge = getBuildingAge(current.year);
        targetBox.innerHTML = `
            <div class="swap-target-left">
                <img src="${current.imageUrl || ''}" class="swap-target-photo">
                <div>
                    <div style="font-size: 11px; color: var(--fc-volt); font-weight: 800;">현재 선발 선수</div>
                    <h4 style="font-size: 15px; font-weight: 800;">${current.name} (+${current.enhancement || 1})</h4>
                    <p style="font-size: 11px; color: var(--fc-text-sub);">
                        ${current.year}년 완공 (${currentAge}세) · 급여 ${current.salary || 22} · ${current.countryFlag || ''} ${current.city}
                    </p>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-family: var(--font-num); font-size: 26px; font-weight: 700; color: #fff;">OVR ${current.ovr}</div>
                <button id="viewCurrentDetailBtn" class="btn-secondary" style="font-size: 11px; padding: 3px 8px; margin-top: 4px;">상세보기</button>
            </div>
        `;

        document.getElementById('viewCurrentDetailBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            openBuildingDetailModal(current);
        });

        renderSwapCandidates();
        modal.classList.add('show');
    }

    function renderSwapCandidates() {
        const container = document.getElementById('swapCandidatesList');
        if (!container) return;
        container.innerHTML = '';

        const currentTarget = state.startingXI[state.swapTargetIndex];
        const usedIds = new Set(state.startingXI.map(p => p.id));
        if (currentTarget) usedIds.delete(currentTarget.id); // allow current

        // Gather Candidate Pool
        let pool = [];
        if (state.swapScope === 'bench') {
            pool = state.bench.filter(b => !usedIds.has(b.id));
        } else {
            // All 525 buildings across all managers!
            MANAGERS_DATA.forEach(m => {
                m.buildings.forEach(b => {
                    if (!usedIds.has(b.id)) {
                        pool.push({ ...b, managerName: m.name });
                    }
                });
            });
        }

        // Filter Position
        if (state.swapFilterPos !== 'all') {
            pool = pool.filter(b => b.position === state.swapFilterPos);
        }

        // Search Query
        if (state.swapSearch) {
            const q = state.swapSearch.toLowerCase();
            pool = pool.filter(b => 
                b.name.toLowerCase().includes(q) || 
                b.originalName.toLowerCase().includes(q) || 
                b.city.toLowerCase().includes(q) ||
                (b.managerName && b.managerName.toLowerCase().includes(q))
            );
        }

        // Sort
        pool.sort((a, b) => {
            if (state.swapSort === 'ovr_desc') return b.ovr - a.ovr;
            if (state.swapSort === 'age_desc') return a.year - b.year; // older completion year = higher age
            if (state.swapSort === 'age_asc') return b.year - a.year;  // newer completion year = lower age
            if (state.swapSort === 'salary_asc') return (a.salary || 22) - (b.salary || 22);
            return b.ovr - a.ovr;
        });

        if (pool.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--fc-text-sub);">교체 가능한 건축물이 없습니다.</div>`;
            return;
        }

        pool.forEach(b => {
            const item = document.createElement('div');
            item.className = 'swap-candidate-item';
            const age = getBuildingAge(b.year);
            const ovrDiff = b.ovr - (currentTarget ? currentTarget.ovr : 0);
            const ovrDiffText = ovrDiff > 0 ? `+${ovrDiff}` : (ovrDiff < 0 ? `${ovrDiff}` : '0');
            const ovrDiffColor = ovrDiff > 0 ? '#c8ff00' : (ovrDiff < 0 ? '#ea2b4b' : '#92a0b3');

            item.innerHTML = `
                <div class="swap-candidate-left">
                    <img src="${b.imageUrl || ''}" class="swap-candidate-photo" onerror="this.src='https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80'">
                    <div class="swap-candidate-info">
                        <h5>
                            <span class="pos-tag ${b.position.toLowerCase()}">${b.position}</span>
                            ${b.name}
                            <span style="font-size: 11px; color: var(--fc-gold);">+${b.enhancement || 1}</span>
                            <span class="bench-age-tag">${age}세 (${b.year}년)</span>
                        </h5>
                        <p>${b.countryFlag || '🌐'} ${b.country || b.city} · 급여 ${b.salary || 22} · ${b.managerName || b.architectTrait || ''}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="text-align: right;">
                        <span style="font-family: var(--font-num); font-size: 20px; font-weight: 700; color: #fff;">${b.ovr}</span>
                        <div style="font-size: 10px; font-weight: 800; color: ${ovrDiffColor};">(${ovrDiffText})</div>
                    </div>
                    <button class="swap-action-btn do-swap-btn">교체 (SWAP)</button>
                </div>
            `;

            // Execute Swap
            item.querySelector('.do-swap-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                sounds.playClick();
                executePlayerSwap(b);
            });

            container.appendChild(item);
        });
    }

    function executePlayerSwap(newPlayer) {
        if (state.swapTargetIndex === null) return;
        const current = state.startingXI[state.swapTargetIndex];
        if (!current) return;

        // Place new player into target slot with slot metadata
        state.startingXI[state.swapTargetIndex] = {
            ...newPlayer,
            assignedSlot: current.assignedSlot,
            targetPos: current.targetPos
        };

        // Manage bench: replace or add current
        const benchIdx = state.bench.findIndex(b => b.id === newPlayer.id);
        if (benchIdx !== -1) {
            state.bench[benchIdx] = current;
        } else {
            // New player came from all-stars
            if (!state.bench.some(b => b.id === current.id)) {
                state.bench.push(current);
            }
        }

        // Close swap modal and refresh
        document.getElementById('playerSwapModal').classList.remove('show');
        renderSquadPitch();
        renderBench();
        updateTeamPowerGauges();
        updateTotalClubValue();
    }

    // Swap Modal Listeners
    document.getElementById('swapModalCloseBtn').addEventListener('click', () => {
        document.getElementById('playerSwapModal').classList.remove('show');
    });

    document.getElementById('scopeBenchBtn').addEventListener('click', () => {
        sounds.playClick();
        document.getElementById('scopeBenchBtn').classList.add('active');
        document.getElementById('scopeAllBtn').classList.remove('active');
        state.swapScope = 'bench';
        renderSwapCandidates();
    });

    document.getElementById('scopeAllBtn').addEventListener('click', () => {
        sounds.playClick();
        document.getElementById('scopeAllBtn').classList.add('active');
        document.getElementById('scopeBenchBtn').classList.remove('active');
        state.swapScope = 'all';
        renderSwapCandidates();
    });

    document.getElementById('swapSearchInput').addEventListener('input', (e) => {
        state.swapSearch = e.target.value.trim();
        renderSwapCandidates();
    });

    document.querySelectorAll('#swapPosFilters .filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            sounds.playClick();
            document.querySelectorAll('#swapPosFilters .filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.swapFilterPos = btn.getAttribute('data-pos');
            renderSwapCandidates();
        });
    });

    document.getElementById('swapSortSelect').addEventListener('change', (e) => {
        state.swapSort = e.target.value;
        renderSwapCandidates();
    });

    // 6. Codex Manager Filters
    function renderCodexManagerFilters() {
        const container = document.getElementById('codexManagerFilterGroup');
        if (!container) return;
        container.innerHTML = '';

        const allBtn = document.createElement('button');
        allBtn.className = 'filter-pill active';
        allBtn.setAttribute('data-mgr', 'all');
        allBtn.innerText = '전체 감독 (21명)';
        allBtn.addEventListener('click', () => {
            sounds.playClick();
            container.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            state.codexFilter.manager = 'all';
            renderCodex();
        });
        container.appendChild(allBtn);

        MANAGERS_DATA.forEach(mgr => {
            const btn = document.createElement('button');
            btn.className = 'filter-pill';
            btn.setAttribute('data-mgr', mgr.id);
            btn.innerText = `${mgr.nationalityFlag || ''} ${mgr.name}`;
            btn.addEventListener('click', () => {
                sounds.playClick();
                container.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.codexFilter.manager = mgr.id;
                renderCodex();
            });
            container.appendChild(btn);
        });
    }

    function renderGuideManagers() {
        const container = document.getElementById('managerGuideGrid');
        if (!container) return;
        container.innerHTML = '';

        MANAGERS_DATA.forEach(mgr => {
            const item = document.createElement('div');
            item.className = 'mgr-guide-item';
            item.style.borderLeftColor = mgr.badgeColor || '#00f0ff';
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <img src="${mgr.imageUrl || ''}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid gold;">
                    <div>
                        <h4>${mgr.nationalityFlag} ${mgr.name} (${mgr.nativeName})</h4>
                        <p style="color: var(--fc-volt); font-weight: 700; font-size: 11px;">${mgr.nationality} · ${mgr.title}</p>
                    </div>
                </div>
                <p><strong>철학</strong>: "${mgr.quote}"</p>
                <p style="margin-top: 4px;"><strong>전술</strong>: ${mgr.style} (버프: ${mgr.buff})</p>
            `;
            container.appendChild(item);
        });
    }

    // 7. Architectural Codex (FUT Card Gallery)
    function renderCodex() {
        const grid = document.getElementById('codexGrid');
        grid.innerHTML = '';

        let filtered = [];
        MANAGERS_DATA.forEach(mgr => {
            if (state.codexFilter.manager !== 'all' && mgr.id !== state.codexFilter.manager) return;
            mgr.buildings.forEach(b => {
                if (state.codexFilter.position !== 'all' && b.position !== state.codexFilter.position) return;
                if (state.codexFilter.search) {
                    const q = state.codexFilter.search.toLowerCase();
                    const match = b.name.toLowerCase().includes(q) ||
                                  b.originalName.toLowerCase().includes(q) ||
                                  b.city.toLowerCase().includes(q) ||
                                  (b.country && b.country.toLowerCase().includes(q)) ||
                                  mgr.name.toLowerCase().includes(q);
                    if (!match) return;
                }
                filtered.push({ ...b, architectName: mgr.name });
            });
        });

        document.getElementById('codexCountBadge').innerText = `${filtered.length}개 건축물`;

        filtered.forEach(b => {
            const cardWrap = document.createElement('div');
            cardWrap.innerHTML = createFutCardHtml(b);
            const cardEl = cardWrap.firstElementChild;
            attach3DTilt(cardEl);

            cardEl.addEventListener('click', () => {
                sounds.playClick();
                openBuildingDetailModal(b);
            });

            grid.appendChild(cardEl);
        });
    }

    // Codex Filters Listeners
    document.getElementById('codexSearchInput').addEventListener('input', (e) => {
        state.codexFilter.search = e.target.value.trim();
        renderCodex();
    });

    document.querySelectorAll('.filter-pill[data-pos]').forEach(btn => {
        btn.addEventListener('click', () => {
            sounds.playClick();
            document.querySelectorAll('.filter-pill[data-pos]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.codexFilter.position = btn.getAttribute('data-pos');
            renderCodex();
        });
    });

    // 8. Building Detail Modal with Radar Chart
    function openBuildingDetailModal(b) {
        state.selectedBuildingForDetail = b;
        const modal = document.getElementById('buildingDetailModal');
        const age = getBuildingAge(b.year);

        document.getElementById('modalBuildingName').innerText = `${b.name} (+${b.enhancement || 1})`;
        document.getElementById('modalBuildingSub').innerText = `${b.originalName} · ${b.city} (${b.year}년 준공 · ${age}세) · 급여 ${b.salary || 22}`;
        document.getElementById('modalOvrVal').innerText = b.ovr;
        document.getElementById('modalPosVal').innerText = b.position;
        document.getElementById('modalRoleBadge').innerText = b.role;

        const archCountryEl = document.getElementById('modalArchitectCountry');
        if (archCountryEl) {
            archCountryEl.innerText = b.architectTrait || `${state.homeManager.nationalityFlag} ${state.homeManager.nationality}`;
        }
        const bldgCountryEl = document.getElementById('modalBuildingCountry');
        if (bldgCountryEl) {
            bldgCountryEl.innerText = `${b.countryFlag || '🌐'} ${b.country || b.city} (${b.city})`;
        }
        const synergyEl = document.getElementById('modalCountrySynergy');
        if (synergyEl) {
            synergyEl.innerText = b.nationalSynergy 
                ? `🌐 ${b.nationalSynergy} (완공 후 ${age}년 역사성 보유)` 
                : `🌐 글로벌 마스터피스 (완공 후 ${age}년 역사성 보유)`;
        }

        document.getElementById('modalSkillName').innerText = `✨ 고유 스킬: ${b.skill.name}`;
        document.getElementById('modalSkillDesc').innerText = `${b.skill.description} (발동 확률: ${Math.round(b.skill.rate * 100)}%)`;
        document.getElementById('modalDescText').innerText = b.desc;

        modal.classList.add('show');
        renderRadarChart(b.stats);
    }

    function renderRadarChart(stats) {
        const canvas = document.getElementById('radarCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(cx, cy) - 25;
        const keys = ['STR', 'TEC', 'SPD', 'PAS', 'POW', 'MNT'];
        const labels = ['구조(STR)', '예술(TEC)', '기동(SPD)', '연계(PAS)', '파워(POW)', '멘탈(MNT)'];
        const numPoints = keys.length;

        // Draw web rings
        ctx.strokeStyle = '#273448';
        ctx.lineWidth = 1;
        for (let ring = 1; ring <= 4; ring++) {
            const curR = (r / 4) * ring;
            ctx.beginPath();
            for (let i = 0; i < numPoints; i++) {
                const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
                const x = cx + Math.cos(angle) * curR;
                const y = cy + Math.sin(angle) * curR;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw spokes
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            ctx.stroke();

            const lx = cx + Math.cos(angle) * (r + 16);
            const ly = cy + Math.sin(angle) * (r + 16);
            ctx.fillStyle = '#8c9ba5';
            ctx.font = 'bold 9px Pretendard, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[i], lx, ly);
        }

        // Draw stat polygon
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
            const val = stats[keys[i]] || 50;
            const norm = val / 100;
            const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
            const x = cx + Math.cos(angle) * (r * norm);
            const y = cy + Math.sin(angle) * (r * norm);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(200, 255, 0, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#c8ff00';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    document.getElementById('modalCloseBtn').addEventListener('click', () => {
        document.getElementById('buildingDetailModal').classList.remove('show');
    });

    // 9. CARD ENHANCEMENT LAB
    function renderEnhancementLab() {
        const rosterGrid = document.getElementById('enhanceRosterGrid');
        if (!rosterGrid) return;
        rosterGrid.innerHTML = '';

        const clubBuildings = [...state.startingXI, ...state.bench];

        if (!state.selectedEnhanceBuilding && clubBuildings.length > 0) {
            state.selectedEnhanceBuilding = clubBuildings[0];
        }

        updateEnhancePedestal();

        clubBuildings.forEach(b => {
            const isTarget = state.selectedEnhanceBuilding && state.selectedEnhanceBuilding.id === b.id;
            const cardWrap = document.createElement('div');
            cardWrap.innerHTML = createFutCardHtml(b, isTarget ? 'active-enhance-card' : '');
            const cardEl = cardWrap.firstElementChild;
            cardEl.style.transform = 'scale(0.85)';
            cardEl.style.transformOrigin = 'top center';
            cardEl.style.cursor = 'pointer';

            cardEl.addEventListener('click', () => {
                sounds.playClick();
                state.selectedEnhanceBuilding = b;
                updateEnhancePedestal();
            });

            rosterGrid.appendChild(cardEl);
        });
    }

    function updateEnhancePedestal() {
        const slot = document.getElementById('enhanceTargetSlot');
        const b = state.selectedEnhanceBuilding;
        if (!slot || !b) return;

        slot.innerHTML = createFutCardHtml(b);
        const cardEl = slot.firstElementChild;
        attach3DTilt(cardEl);

        const curGrade = b.enhancement || 1;
        const curInfo = getGradeInfo(curGrade);
        const nextGrade = curGrade + 1;
        const nextInfo = getGradeInfo(nextGrade);

        const probMap = { 1: 90, 2: 80, 3: 70, 4: 60, 5: 45, 6: 35, 7: 25, 8: 18, 9: 10 };
        const prob = probMap[curGrade] || 10;
        const cost = (curGrade * 2000000000);

        document.getElementById('enhanceCurrentGrade').innerText = curInfo.name;
        document.getElementById('enhanceTargetGrade').innerText = `${nextInfo.name} (전 능력치 +2)`;
        document.getElementById('enhanceProbText').innerText = `${prob}%`;
        document.getElementById('enhanceRateFill').style.width = `${prob}%`;
        document.getElementById('enhanceCostText').innerText = formatBP(cost);
        document.getElementById('enhanceResultMsg').innerText = '';
    }

    const doEnhanceBtn = document.getElementById('doEnhanceBtn');
    if (doEnhanceBtn) {
        doEnhanceBtn.addEventListener('click', () => {
            const b = state.selectedEnhanceBuilding;
            if (!b) return;

            const curGrade = b.enhancement || 1;
            if (curGrade >= 10) {
                alert('이미 최대 강화 단계(+10 금카)에 도달했습니다!');
                return;
            }

            sounds.playEnhanceCharge();
            doEnhanceBtn.disabled = true;
            doEnhanceBtn.innerText = '⚡ 강화 중... (TENSION RISING)';
            const resultMsg = document.getElementById('enhanceResultMsg');
            resultMsg.innerText = '게이지 충전 중...';
            resultMsg.style.color = '#ffd700';

            setTimeout(() => {
                doEnhanceBtn.disabled = false;
                doEnhanceBtn.innerText = '⚡ 강화 시도하기 (ENHANCE)';

                const probMap = { 1: 90, 2: 80, 3: 70, 4: 60, 5: 45, 6: 35, 7: 25, 8: 18, 9: 10 };
                const prob = probMap[curGrade] || 10;
                const roll = Math.random() * 100;

                if (roll <= prob) {
                    b.enhancement = curGrade + 1;
                    b.ovr = Math.min(99, b.ovr + 1);
                    for (const k of ['STR', 'TEC', 'SPD', 'PAS', 'POW', 'MNT']) {
                        b.stats[k] = Math.min(99, b.stats[k] + 2);
                    }
                    b.valueBP = Math.round(b.valueBP * 2.2);

                    sounds.playEnhanceSuccess();
                    resultMsg.innerText = `🎉 축하합니다! 강화 성공! [${b.name}] +${b.enhancement} 달성!`;
                    resultMsg.style.color = '#00ffaa';
                } else {
                    sounds.playEnhanceFail();
                    resultMsg.innerText = `💥 강화 실패... 강화 등급이 유지되었습니다.`;
                    resultMsg.style.color = '#ea2b4b';
                }

                updateEnhancePedestal();
                renderSquadPitch();
                renderBench();
                updateTeamPowerGauges();
                updateTotalClubValue();
                renderCodex();
            }, 1200);
        });
    }

    // 10. WALKOUT PACK OPENING CEREMONY & 10-PACK MULTI-OPENING
    let activeWalkoutTimeouts = [];
    let currentPackOpener = null;

    function triggerWalkout(card, reopenCallback = null) {
        currentPackOpener = reopenCallback;
        const overlay = document.getElementById('walkoutStageOverlay');
        const stepCountry = document.getElementById('walkoutStepCountry');
        const stepPosition = document.getElementById('walkoutStepPosition');
        const stepArch = document.getElementById('walkoutStepArchitect');
        const stepCard = document.getElementById('walkoutStepCard');
        const cardBox = document.getElementById('walkoutCardContainer');
        const skipBtn = document.getElementById('walkoutSkipBtn');

        // Clear previous timeouts
        activeWalkoutTimeouts.forEach(t => clearTimeout(t));
        activeWalkoutTimeouts = [];

        [stepCountry, stepPosition, stepArch, stepCard].forEach(s => s.classList.remove('show'));
        overlay.classList.add('active');

        // Fill Data with robust fallbacks
        const flag = card.managerNationalityFlag || card.countryFlag || '🌐';
        const countryName = card.country || card.managerNationality || card.architectTrait || '세계적인 건축가';
        document.getElementById('walkoutCountryFlag').innerText = flag;
        document.getElementById('walkoutCountryName').innerText = countryName;
        document.getElementById('walkoutPositionText').innerText = card.position;
        document.getElementById('walkoutPositionSub').innerText = card.role || `${card.position} 포지션`;
        document.getElementById('walkoutArchPhoto').src = card.managerImageUrl || card.imageUrl || '';
        document.getElementById('walkoutArchName').innerText = card.managerName || '마스터 아키텍트';
        document.getElementById('walkoutArchSub').innerText = card.architectTrait || `${card.city || ''} 랜드마크 설계자`;

        cardBox.innerHTML = createFutCardHtml(card);
        if (cardBox.firstElementChild) attach3DTilt(cardBox.firstElementChild);

        // Immediate Skip Function
        const doSkip = () => {
            activeWalkoutTimeouts.forEach(t => clearTimeout(t));
            activeWalkoutTimeouts = [];
            [stepCountry, stepPosition, stepArch].forEach(s => s.classList.remove('show'));
            stepCard.classList.add('show');
            if (typeof sounds !== 'undefined' && sounds.playWalkoutExplosion) {
                sounds.playWalkoutExplosion();
            }
        };

        if (skipBtn) skipBtn.onclick = (e) => { e.stopPropagation(); doSkip(); };
        overlay.onclick = (e) => {
            if (e.target === overlay || e.target.classList.contains('stage-spotlight-left') || e.target.classList.contains('stage-spotlight-right')) {
                if (!stepCard.classList.contains('show')) doSkip();
            }
        };

        // Sequence Animations
        if (typeof sounds !== 'undefined' && sounds.playWalkoutBoom) sounds.playWalkoutBoom();

        activeWalkoutTimeouts.push(setTimeout(() => {
            stepCountry.classList.add('show');
            if (typeof sounds !== 'undefined' && sounds.playWalkoutBoom) sounds.playWalkoutBoom();
        }, 500));

        activeWalkoutTimeouts.push(setTimeout(() => {
            stepCountry.classList.remove('show');
            stepPosition.classList.add('show');
            if (typeof sounds !== 'undefined' && sounds.playWalkoutBoom) sounds.playWalkoutBoom();
        }, 1600));

        activeWalkoutTimeouts.push(setTimeout(() => {
            stepPosition.classList.remove('show');
            stepArch.classList.add('show');
            if (typeof sounds !== 'undefined' && sounds.playWalkoutBoom) sounds.playWalkoutBoom();
        }, 2700));

        activeWalkoutTimeouts.push(setTimeout(() => {
            stepArch.classList.remove('show');
            stepCard.classList.add('show');
            if (typeof sounds !== 'undefined' && sounds.playWalkoutExplosion) sounds.playWalkoutExplosion();
        }, 3800));

        // Action 1: Claim to Bench
        document.getElementById('walkoutConfirmBtn').onclick = (e) => {
            e.stopPropagation();
            if (typeof sounds !== 'undefined' && sounds.playClick) sounds.playClick();
            overlay.classList.remove('active');
            state.bench.unshift(card);
            renderBench();
            updateTotalClubValue();
            alert(`[${card.name}]을(를) 구단 라커룸(후보 명단)에 등록했습니다!`);
        };

        // Action 2: Equip directly to Starting XI
        const equipBtn = document.getElementById('walkoutEquipBtn');
        if (equipBtn) {
            equipBtn.onclick = (e) => {
                e.stopPropagation();
                if (typeof sounds !== 'undefined' && sounds.playClick) sounds.playClick();
                overlay.classList.remove('active');

                // Find matching position or replace slot with lowest OVR
                let targetIdx = state.startingXI.findIndex(p => p.position === card.position);
                if (targetIdx === -1) {
                    targetIdx = 0;
                    let lowestOvr = 999;
                    state.startingXI.forEach((p, i) => {
                        if (p.ovr < lowestOvr) { lowestOvr = p.ovr; targetIdx = i; }
                    });
                }

                const replaced = state.startingXI[targetIdx];
                state.startingXI[targetIdx] = card;
                if (replaced) state.bench.unshift(replaced);

                renderSquad();
                renderBench();
                updateTotalClubValue();
                alert(`[${card.name}]이(가) [${replaced ? replaced.name : '선발'}] 대신 선발 스쿼드에 즉시 투입되었습니다!`);
            };
        }

        // Action 3: Re-open Pack
        const reopenBtn = document.getElementById('walkoutReopenBtn');
        if (reopenBtn) {
            reopenBtn.onclick = (e) => {
                e.stopPropagation();
                if (typeof sounds !== 'undefined' && sounds.playClick) sounds.playClick();
                overlay.classList.remove('active');
                state.bench.unshift(card);
                renderBench();
                updateTotalClubValue();
                if (currentPackOpener) currentPackOpener();
            };
        }
    }

    // 10-Pack Multi-Opening Handler (FC Online Multi-Pack Homage)
    function openMultiPack(packType) {
        const modal = document.getElementById('multiPackModal');
        const grid = document.getElementById('multiPackGrid');
        const title = document.getElementById('multiPackTitle');
        const highestOvrEl = document.getElementById('multiPackHighestOvr');
        const totalValEl = document.getElementById('multiPackTotalValue');

        const allBuildings = [];
        MANAGERS_DATA.forEach(m => m.buildings.forEach(b => allBuildings.push(b)));

        let pool = allBuildings;
        let packName = '10연속 선수팩';
        if (packType === 'icon') {
            pool = allBuildings.filter(b => b.ovr >= 93);
            packName = '[ICON] 거장 21인 마스터 10연속 팩';
        } else if (packType === 'toty') {
            pool = allBuildings.filter(b => b.ovr >= 91);
            packName = '[TOTY] 월드 베스트 10연속 팩';
        } else if (packType === 'heritage') {
            pool = allBuildings.filter(b => b.ovr >= 88);
            packName = '[HERITAGE] 근현대 황금세대 10연속 팩';
        } else if (packType === 'free') {
            pool = allBuildings;
            packName = '[행운] 일일 무료 10연속 팩';
        } else {
            pool = allBuildings;
            packName = '[ALL-STAR] 525개 건축물 10연속 팩';
        }

        title.innerText = packName;

        // Sample 10 items
        const drawnCards = [];
        for (let i = 0; i < 10; i++) {
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            drawnCards.push({ ...chosen, enhancement: 1 });
        }

        grid.innerHTML = '';
        let maxOvr = 0;
        let sumValue = 0;

        drawnCards.forEach((c, idx) => {
            if (c.ovr > maxOvr) maxOvr = c.ovr;
            sumValue += (c.valueBP || 5000000000);

            const slot = document.createElement('div');
            slot.className = 'multi-pack-slot';
            slot.innerHTML = `
                <div class="multi-pack-inner" id="multiSlotInner_${idx}">
                    <div class="multi-card-back">
                        <div class="shield-icon">🏛️</div>
                        <div class="shield-text">${c.cardTier || 'ICON'} CLASS</div>
                        <div style="font-size: 11px; color: var(--fc-volt); margin-top: 6px;">클릭하여 오픈</div>
                    </div>
                    <div class="multi-card-front" style="display: flex; justify-content: center; transform: scale(0.82); transform-origin: top center;">
                        ${createFutCardHtml(c)}
                    </div>
                </div>
            `;

            slot.addEventListener('click', () => {
                const inner = document.getElementById(`multiSlotInner_${idx}`);
                if (!inner.classList.contains('flipped')) {
                    if (typeof sounds !== 'undefined' && sounds.playWalkoutBoom) sounds.playWalkoutBoom();
                    inner.classList.add('flipped');
                }
            });

            grid.appendChild(slot);
        });

        highestOvrEl.innerText = `${maxOvr}`;
        totalValEl.innerText = `${(sumValue / 100000000).toLocaleString()}억 BP`;

        modal.classList.add('active');

        // Reveal All Button
        document.getElementById('multiPackRevealAllBtn').onclick = () => {
            if (typeof sounds !== 'undefined' && sounds.playWalkoutExplosion) sounds.playWalkoutExplosion();
            drawnCards.forEach((_, idx) => {
                const inner = document.getElementById(`multiSlotInner_${idx}`);
                if (inner) inner.classList.add('flipped');
            });
        };

        // Close & Claim All Button
        const claimHandler = () => {
            if (typeof sounds !== 'undefined' && sounds.playClick) sounds.playClick();
            modal.classList.remove('active');
            drawnCards.forEach(c => state.bench.unshift(c));
            renderBench();
            updateTotalClubValue();
            alert(`총 10장의 건축물이 구단 라커룸(후보 명단)에 성공적으로 등록되었습니다!`);
        };

        document.getElementById('multiPackClaimAllBtn').onclick = claimHandler;
        document.getElementById('multiPackCloseBtn').onclick = () => modal.classList.remove('active');
    }

    // Attach listeners to pack open buttons and pack card containers
    const openPackByType = (packType, count = 1) => {
        if (typeof sounds !== 'undefined' && sounds.playClick) sounds.playClick();
        if (count === 10) {
            openMultiPack(packType);
            return;
        }

        const allBuildings = [];
        MANAGERS_DATA.forEach(m => m.buildings.forEach(b => allBuildings.push(b)));

        let pool = allBuildings;
        if (packType === 'icon') {
            pool = allBuildings.filter(b => b.ovr >= 93);
        } else if (packType === 'toty') {
            pool = allBuildings.filter(b => b.ovr >= 91);
        } else if (packType === 'heritage') {
            pool = allBuildings.filter(b => b.ovr >= 88);
        } else if (packType === 'free') {
            pool = allBuildings;
        } else {
            pool = allBuildings;
        }

        const chosen = pool[Math.floor(Math.random() * pool.length)];
        triggerWalkout({ ...chosen, enhancement: 1 }, () => openPackByType(packType, 1));
    };

    document.querySelectorAll('.pack-open-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const packType = btn.getAttribute('data-pack');
            const count = parseInt(btn.getAttribute('data-count') || '1', 10);
            openPackByType(packType, count);
        });
    });

    document.querySelectorAll('.pack-box-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.pack-open-btn')) return; // handled by button
            const packType = card.getAttribute('data-pack');
            openPackByType(packType, 1);
        });
    });

    // 11. Match View Setup & Match Simulator
    function updateMatchTeamDisplay() {
        document.getElementById('homeTeamName').innerText = `${state.homeManager.nationalityFlag || ''} ${state.homeManager.name} FC`;
        document.getElementById('homeManagerTitle').innerText = `${state.homeManager.nationality} · ${state.homeManager.title}`;
        document.getElementById('homeScoreBadge').innerText = '0';

        document.getElementById('awayTeamName').innerText = `${state.awayManager.nationalityFlag || ''} ${state.awayManager.name} FC`;
        document.getElementById('awayManagerTitle').innerText = `${state.awayManager.nationality} · ${state.awayManager.title}`;
        document.getElementById('awayScoreBadge').innerText = '0';
        document.getElementById('matchMinutePill').innerText = "00' KICK OFF";

        setupMatchPitchPositions();
    }

    function setupMatchPitchPositions() {
        if (!state.pitchCanvas) return;

        const homePositions = [];
        const homeFormation = FORMATIONS[state.currentFormation];
        let pIdx = 0;

        const rowXCoordsHome = [0.42, 0.28, 0.16, 0.06];
        homeFormation.rows.forEach((row, rIdx) => {
            const x = rowXCoordsHome[rIdx] || 0.25;
            const count = row.slots.length;
            row.slots.forEach((slot, sIdx) => {
                const y = (sIdx + 1) / (count + 1);
                const player = state.startingXI[pIdx] || { name: 'Player', position: 'MF' };
                pIdx++;
                homePositions.push({
                    x, y,
                    ...player,
                    name: player.name,
                    pos: player.position,
                    countryFlag: player.countryFlag || '',
                    num: pIdx
                });
            });
        });

        const awaySquad = autoBuildSquad(state.awayManager, state.awayManager.defaultFormation || '4-3-3');
        const awayFormation = FORMATIONS[state.awayManager.defaultFormation || '4-3-3'];
        const awayPositions = [];
        let aIdx = 0;
        const rowXCoordsAway = [0.58, 0.72, 0.84, 0.94];

        awayFormation.rows.forEach((row, rIdx) => {
            const x = rowXCoordsAway[rIdx] || 0.75;
            const count = row.slots.length;
            row.slots.forEach((slot, sIdx) => {
                const y = (sIdx + 1) / (count + 1);
                const player = awaySquad.startingXI[aIdx] || { name: 'Opponent', position: 'MF' };
                aIdx++;
                awayPositions.push({
                    x, y,
                    ...player,
                    name: player.name,
                    pos: player.position,
                    countryFlag: player.countryFlag || '',
                    num: aIdx
                });
            });
        });

        state.pitchCanvas.setTeamPositions(
            homePositions,
            awayPositions,
            state.homeManager.badgeColor || '#2b5c8f',
            state.awayManager.badgeColor || '#a83279'
        );
    }

    const awaySelect = document.getElementById('opponentSelect');
    MANAGERS_DATA.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.innerText = `${m.name} (${m.nationality})`;
        if (m.id === state.awayManager.id) opt.selected = true;
        awaySelect.appendChild(opt);
    });

    awaySelect.addEventListener('change', (e) => {
        const found = MANAGERS_DATA.find(m => m.id === e.target.value);
        if (found) {
            state.awayManager = found;
            updateMatchTeamDisplay();
        }
    });

    // Match Start / Simulation
    const startMatchBtn = document.getElementById('startMatchBtn');
    const commentaryList = document.getElementById('commentaryList');
    const skillCutin = document.getElementById('skillCutinBanner');
    const goalPopup = document.getElementById('goalCelebrationPopup');

    function startNewMatch(speed = 1) {
        if (state.activeMatch && !state.activeMatch.isFinished) {
            clearTimeout(state.activeMatch.timer);
        }

        commentaryList.innerHTML = '';
        document.getElementById('homeScoreBadge').innerText = '0';
        document.getElementById('awayScoreBadge').innerText = '0';

        const awaySquad = autoBuildSquad(state.awayManager, state.awayManager.defaultFormation || '4-3-3');

        const homeTeamData = {
            name: `${state.homeManager.name} FC`,
            manager: state.homeManager,
            startingXI: state.startingXI
        };
        const awayTeamData = {
            name: `${state.awayManager.name} FC`,
            manager: state.awayManager,
            startingXI: awaySquad.startingXI
        };

        setupMatchPitchPositions();

        state.activeMatch = new MatchEngine(homeTeamData, awayTeamData, {
            speed: speed,
            pitchCanvas: state.pitchCanvas,
            onMinute: (min) => {
                document.getElementById('matchMinutePill').innerText = `${min < 10 ? '0' + min : min}' PLAYING`;
                if (state.activeMatch) {
                    const posHome = state.activeMatch.stats.home.possession;
                    const posAway = state.activeMatch.stats.away.possession;
                    document.getElementById('possessionBarHome').style.width = `${posHome}%`;
                    document.getElementById('possessionBarAway').style.width = `${posAway}%`;
                    document.getElementById('homePossessionLabel').innerText = `점유율 ${posHome}%`;
                    document.getElementById('awayPossessionLabel').innerText = `점유율 ${posAway}%`;
                }
            },
            onEvent: (ev) => {
                const item = document.createElement('div');
                item.className = `comment-item ${ev.type.toLowerCase()}`;
                item.innerHTML = `<span class="comment-min-badge">${ev.minute}'</span>${ev.text}`;
                commentaryList.prepend(item);
            },
            onGoal: (data) => {
                document.getElementById('homeScoreBadge').innerText = data.homeScore;
                document.getElementById('awayScoreBadge').innerText = data.awayScore;

                if (goalPopup && data.player) {
                    document.getElementById('goalPhotoImg').src = data.player.imageUrl || '';
                    document.getElementById('goalPlayerName').innerText = `${data.player.name} (+${data.player.enhancement || 1})`;
                    document.getElementById('goalMinuteText').innerText = `${data.minute}' GOAL! (OVR ${data.player.ovr})`;
                    document.getElementById('goalSkillTag').innerText = data.player.skill ? `✨ [비기: ${data.player.skill.name}]` : '';
                    goalPopup.classList.add('show');
                    setTimeout(() => goalPopup.classList.remove('show'), 3000);
                }
            },
            onSkill: (player, skill) => {
                document.getElementById('skillPlayerName').innerText = `${player.name} - ${skill.name}`;
                document.getElementById('skillEffectDesc').innerText = skill.description;
                skillCutin.classList.add('show');
                setTimeout(() => skillCutin.classList.remove('show'), 2200);
            },
            onComplete: (res) => {
                document.getElementById('matchMinutePill').innerText = "90' FULL TIME";
                openMatchResultModal(res);
            }
        });

        state.activeMatch.start();
    }

    startMatchBtn.addEventListener('click', () => {
        sounds.playClick();
        startNewMatch(1);
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sounds.playClick();
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const spd = parseFloat(btn.getAttribute('data-speed'));
            if (state.activeMatch) {
                state.activeMatch.setSpeed(spd);
            }
        });
    });

    document.getElementById('skipMatchBtn').addEventListener('click', () => {
        sounds.playClick();
        if (state.activeMatch) {
            state.activeMatch.setSpeed(0);
        } else {
            startNewMatch(0);
        }
    });

    // Match Result Modal
    function openMatchResultModal(res) {
        const modal = document.getElementById('matchResultModal');
        document.getElementById('resultFinalScore').innerText = `${res.homeScore} : ${res.awayScore}`;
        document.getElementById('resultHomeTeam').innerText = res.homeTeam.name;
        document.getElementById('resultAwayTeam').innerText = res.awayTeam.name;

        document.getElementById('momName').innerText = `${res.mom.name} (평점 ${res.mom.matchRating})`;
        document.getElementById('momDesc').innerText = `${res.mom.city} · ${res.mom.role} - 오늘 경기에서 결정적 활약!`;

        document.getElementById('statPossession').innerText = `${res.stats.home.possession}% - ${res.stats.away.possession}%`;
        document.getElementById('statShots').innerText = `${res.stats.home.shots} - ${res.stats.away.shots}`;
        document.getElementById('statShotsOnTarget').innerText = `${res.stats.home.shotsOnTarget} - ${res.stats.away.shotsOnTarget}`;
        document.getElementById('statSaves').innerText = `${res.stats.home.saves} - ${res.stats.away.saves}`;

        modal.classList.add('show');
    }

    document.getElementById('resultCloseBtn').addEventListener('click', () => {
        document.getElementById('matchResultModal').classList.remove('show');
    });

    document.getElementById('rematchBtn').addEventListener('click', () => {
        document.getElementById('matchResultModal').classList.remove('show');
        startNewMatch(1);
    });

    // Initial Setup
    setHomeManager(MANAGERS_DATA[0]);
    renderCodexManagerFilters();
    renderCodex();
    renderGuideManagers();
});
