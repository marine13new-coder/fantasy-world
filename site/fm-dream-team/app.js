// FM Dream Team Master Application Controller
// Handles Squad Management, Scouting, Tactics Board, Live Matches, and LocalStorage

class App {
    constructor() {
        this.pitchCanvas = null;
        this.matchEngine = null;
        this.currentTab = 'tactics';
        this.selectedPlayerForDetail = null;
        this.swapSlotA = null; // for drag/click player swap
        this.selectedOpponentId = 'mancity';

        // Load or initialize My Club
        this.myClub = this.loadMyClub();
    }

    init() {
        // Initialize 2D Pitch Canvas
        this.pitchCanvas = new PitchCanvas('livePitchCanvas');

        // Setup DOM event listeners
        this.setupNavigation();
        this.setupTacticsUI();
        this.setupScoutingUI();
        this.setupClubCustomizerUI();
        this.setupMatchCenterUI();
        this.setupTournamentUI();

        // Initial Renders
        this.renderSquadTactics();
        this.renderScoutingList();
        this.renderClubCustomizer();
        this.updateHeaderClubBadge();

        // Handle Audio Unlock on user interaction
        document.body.addEventListener('click', () => sounds.init(), { once: true });
    }

    // Default or Saved Club State
    loadMyClub() {
        const saved = localStorage.getItem('fm_dream_club_data');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }

        // Default Dream Squad
        const defaultStarters = [
            'liverpool_alisson',
            'liverpool_trent',
            'bayern_kimminjae',
            'liverpool_vandijk',
            'mancity_gvardiol',
            'mancity_rodri',
            'mancity_debruyne',
            'real_bellingham',
            'leg_messi',
            'tottenham_son',
            'mancity_haaland'
        ];

        const defaultBench = [
            'kor_chohyunwoo',
            'real_rudiger',
            'bayern_kimmich',
            'psg_leekangin',
            'real_vinicius',
            'arsenal_saka',
            'bayern_kane'
        ];

        return {
            name: '골든 갤럭시 FC',
            shortName: 'GGF',
            emblem: '👑',
            color1: '#0ea5e9',
            color2: '#f59e0b',
            stadium: '갤럭시 스타디움',
            formation: '4-3-3',
            mentality: 'Attacking',
            pressing: 'High',
            budget: 500, // Millions EUR
            starters: defaultStarters,
            bench: defaultBench
        };
    }

    saveMyClub() {
        localStorage.setItem('fm_dream_club_data', JSON.stringify(this.myClub));
        this.updateHeaderClubBadge();
    }

    updateHeaderClubBadge() {
        const logoEl = document.getElementById('headerClubLogo');
        const nameEl = document.getElementById('headerClubName');
        const badgeEl = document.getElementById('headerClubBadge');
        if (logoEl) logoEl.textContent = this.myClub.emblem || '👑';
        if (nameEl) nameEl.textContent = this.myClub.name || '내 드림팀';
        if (badgeEl) {
            badgeEl.style.backgroundColor = this.myClub.color1;
            badgeEl.style.borderColor = this.myClub.color2;
        }
    }

    // Tab Navigation
    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-tab-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.tab;
                this.switchTab(target);
                sounds.playClick();
            });
        });
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));

        if (tabId === 'tactics') {
            this.renderSquadTactics();
        } else if (tabId === 'scouting') {
            this.renderScoutingList();
        } else if (tabId === 'club') {
            this.renderClubCustomizer();
        } else if (tabId === 'match') {
            this.renderMatchPreScreen();
        }
    }

    // ----------------------------------------------------
    // TAB 1: SQUAD & TACTICS BOARD
    // ----------------------------------------------------
    setupTacticsUI() {
        const formationSelect = document.getElementById('tacticsFormationSelect');
        if (formationSelect) {
            formationSelect.value = this.myClub.formation || '4-3-3';
            formationSelect.addEventListener('change', (e) => {
                this.myClub.formation = e.target.value;
                this.saveMyClub();
                this.renderSquadTactics();
                sounds.playClick();
            });
        }

        const mentalitySelect = document.getElementById('tacticsMentalitySelect');
        if (mentalitySelect) {
            mentalitySelect.value = this.myClub.mentality || 'Attacking';
            mentalitySelect.addEventListener('change', (e) => {
                this.myClub.mentality = e.target.value;
                this.saveMyClub();
            });
        }

        const pressingSelect = document.getElementById('tacticsPressingSelect');
        if (pressingSelect) {
            pressingSelect.value = this.myClub.pressing || 'High';
            pressingSelect.addEventListener('change', (e) => {
                this.myClub.pressing = e.target.value;
                this.saveMyClub();
            });
        }

        const autoPickBtn = document.getElementById('tacticsAutoPickBtn');
        if (autoPickBtn) {
            autoPickBtn.addEventListener('click', () => {
                this.autoOptimizeBest11();
                sounds.playClick();
            });
        }

        const healAllBtn = document.getElementById('tacticsHealAllBtn');
        if (healAllBtn) {
            healAllBtn.addEventListener('click', () => {
                this.healSquadStamina();
                sounds.playClick();
            });
        }
    }

    renderSquadTactics() {
        const pitchSlotsContainer = document.getElementById('tacticsPitchSlots');
        const benchSlotsContainer = document.getElementById('tacticsBenchSlots');
        if (!pitchSlotsContainer) return;

        pitchSlotsContainer.innerHTML = '';
        if (benchSlotsContainer) benchSlotsContainer.innerHTML = '';

        const formation = this.myClub.formation || '4-3-3';
        const coords = this.pitchCanvas.getFormationCoordinates(formation, true);

        // Render 11 Starting Slots on Pitch
        this.myClub.starters.forEach((pid, idx) => {
            const player = PLAYER_MAP[pid] || PLAYERS[0];
            const coord = coords[idx] || { x: 0.2, y: 0.5, pos: player.pos };

            const slot = document.createElement('div');
            slot.className = 'tactics-player-node';
            slot.style.left = `${coord.x * 100}%`;
            slot.style.top = `${coord.y * 100}%`;
            slot.dataset.slotType = 'starter';
            slot.dataset.slotIndex = idx;
            slot.dataset.playerId = player.id;

            slot.innerHTML = `
                <div class="node-jersey" style="background:${this.myClub.color1}; border-color:${this.myClub.color2};">
                    <span class="node-num">${idx + 1}</span>
                </div>
                <div class="node-info">
                    <span class="node-pos">${player.pos}</span>
                    <span class="node-ovr">${player.ovr}</span>
                    <span class="node-name">${player.koreanName || player.name}</span>
                </div>
            `;

            slot.addEventListener('click', () => this.handleSlotClick('starter', idx, player));
            pitchSlotsContainer.appendChild(slot);
        });

        // Render Bench Slots
        if (benchSlotsContainer) {
            this.myClub.bench.forEach((pid, idx) => {
                const player = PLAYER_MAP[pid] || PLAYERS[0];
                const card = document.createElement('div');
                card.className = 'bench-player-card';
                card.dataset.slotType = 'bench';
                card.dataset.slotIndex = idx;
                card.dataset.playerId = player.id;

                card.innerHTML = `
                    <div class="bench-pos-badge">${player.pos}</div>
                    <div class="bench-ovr-badge">${player.ovr}</div>
                    <div class="bench-name">${player.flag} ${player.koreanName || player.name}</div>
                    <button class="bench-detail-btn" title="FM 능력치 보기">📋</button>
                `;

                card.addEventListener('click', (e) => {
                    if (e.target.classList.contains('bench-detail-btn')) {
                        this.openPlayerDetailModal(player);
                    } else {
                        this.handleSlotClick('bench', idx, player);
                    }
                });

                benchSlotsContainer.appendChild(card);
            });
        }

        // Update Squad Analytics Panel
        this.updateSquadSummaryStats();
    }

    handleSlotClick(slotType, slotIndex, player) {
        if (!this.swapSlotA) {
            // Select first player to swap
            this.swapSlotA = { slotType, slotIndex, player };
            document.querySelectorAll('.tactics-player-node, .bench-player-card').forEach(el => {
                if (el.dataset.slotType === slotType && parseInt(el.dataset.slotIndex) === slotIndex) {
                    el.classList.add('selected-for-swap');
                }
            });
            sounds.playClick();
        } else {
            // Swap with second player
            const a = this.swapSlotA;
            const b = { slotType, slotIndex, player };

            if (a.slotType === 'starter' && b.slotType === 'starter') {
                const temp = this.myClub.starters[a.slotIndex];
                this.myClub.starters[a.slotIndex] = this.myClub.starters[b.slotIndex];
                this.myClub.starters[b.slotIndex] = temp;
            } else if (a.slotType === 'starter' && b.slotType === 'bench') {
                const temp = this.myClub.starters[a.slotIndex];
                this.myClub.starters[a.slotIndex] = this.myClub.bench[b.slotIndex];
                this.myClub.bench[b.slotIndex] = temp;
            } else if (a.slotType === 'bench' && b.slotType === 'starter') {
                const temp = this.myClub.bench[a.slotIndex];
                this.myClub.bench[a.slotIndex] = this.myClub.starters[b.slotIndex];
                this.myClub.starters[b.slotIndex] = temp;
            } else if (a.slotType === 'bench' && b.slotType === 'bench') {
                const temp = this.myClub.bench[a.slotIndex];
                this.myClub.bench[a.slotIndex] = this.myClub.bench[b.slotIndex];
                this.myClub.bench[b.slotIndex] = temp;
            }

            this.swapSlotA = null;
            document.querySelectorAll('.selected-for-swap').forEach(el => el.classList.remove('selected-for-swap'));
            this.saveMyClub();
            this.renderSquadTactics();
            sounds.playWhistle('short');
        }
    }

    autoOptimizeBest11() {
        // Collect all owned players
        const allOwnedIds = [...this.myClub.starters, ...this.myClub.bench];
        const allOwned = allOwnedIds.map(id => PLAYER_MAP[id]).filter(Boolean);

        // Sort by OVR descending
        allOwned.sort((a, b) => b.ovr - a.ovr);

        const newStarters = [];
        const usedIds = new Set();

        // 1. Pick Best GK
        const bestGk = allOwned.find(p => p.pos === 'GK');
        if (bestGk) {
            newStarters.push(bestGk.id);
            usedIds.add(bestGk.id);
        }

        // 2. Pick remaining best field players
        for (const p of allOwned) {
            if (newStarters.length >= 11) break;
            if (!usedIds.has(p.id) && p.pos !== 'GK') {
                newStarters.push(p.id);
                usedIds.add(p.id);
            }
        }

        // Fill bench
        const newBench = [];
        for (const p of allOwned) {
            if (newBench.length >= 7) break;
            if (!usedIds.has(p.id)) {
                newBench.push(p.id);
                usedIds.add(p.id);
            }
        }

        this.myClub.starters = newStarters;
        this.myClub.bench = newBench;
        this.saveMyClub();
        this.renderSquadTactics();
        alert('✨ [AI 베스트 11 자동 편성 완료] 능력치(OVR) 기반 최적의 선발 명단이 배치되었습니다!');
    }

    healSquadStamina() {
        alert('💚 [선수단 컨디션 회복] 모든 선수의 피로도가 100% 최상으로 회복되었습니다!');
    }

    updateSquadSummaryStats() {
        const starters = this.myClub.starters.map(id => PLAYER_MAP[id]).filter(Boolean);
        const avgOvr = Math.round(starters.reduce((s, p) => s + p.ovr, 0) / (starters.length || 1));

        const att = starters.filter(p => ['ST', 'LW', 'RW'].includes(p.pos));
        const mid = starters.filter(p => ['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(p.pos));
        const def = starters.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.pos));

        const avg = (list) => list.length ? Math.round(list.reduce((s, p) => s + p.ovr, 0) / list.length) : 80;

        const ovrEl = document.getElementById('squadAvgOvr');
        const attEl = document.getElementById('squadAvgAtt');
        const midEl = document.getElementById('squadAvgMid');
        const defEl = document.getElementById('squadAvgDef');

        if (ovrEl) ovrEl.textContent = avgOvr;
        if (attEl) attEl.textContent = avg(att);
        if (midEl) midEl.textContent = avg(mid);
        if (defEl) defEl.textContent = avg(def);
    }

    // ----------------------------------------------------
    // TAB 2: SCOUTING & TRANSFER MARKET
    // ----------------------------------------------------
    setupScoutingUI() {
        const searchInput = document.getElementById('scoutSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderScoutingList());
        }

        const leagueSelect = document.getElementById('scoutLeagueFilter');
        if (leagueSelect) {
            leagueSelect.addEventListener('change', () => this.renderScoutingList());
        }

        const posSelect = document.getElementById('scoutPosFilter');
        if (posSelect) {
            posSelect.addEventListener('change', () => this.renderScoutingList());
        }

        const statFilter = document.getElementById('scoutStatFilter');
        if (statFilter) {
            statFilter.addEventListener('change', () => this.renderScoutingList());
        }
    }

    renderScoutingList() {
        const listContainer = document.getElementById('scoutingPlayerGrid');
        if (!listContainer) return;

        const query = (document.getElementById('scoutSearchInput')?.value || '').toLowerCase().trim();
        const league = document.getElementById('scoutLeagueFilter')?.value || 'all';
        const pos = document.getElementById('scoutPosFilter')?.value || 'all';
        const statReq = document.getElementById('scoutStatFilter')?.value || 'none';

        const myPlayerIds = new Set([...this.myClub.starters, ...this.myClub.bench]);

        const filtered = PLAYERS.filter(p => {
            // Text search
            if (query) {
                const matchName = (p.name || '').toLowerCase().includes(query);
                const matchKor = (p.koreanName || '').toLowerCase().includes(query);
                const matchTeam = (p.team || '').toLowerCase().includes(query);
                const matchNat = (p.nation || '').toLowerCase().includes(query);
                if (!matchName && !matchKor && !matchTeam && !matchNat) return false;
            }

            // League filter
            if (league !== 'all' && p.league !== league) return false;

            // Position filter
            if (pos !== 'all') {
                if (pos === 'FW' && !['ST', 'LW', 'RW'].includes(p.pos)) return false;
                if (pos === 'MF' && !['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(p.pos)) return false;
                if (pos === 'DF' && !['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.pos)) return false;
                if (pos === 'GK' && p.pos !== 'GK') return false;
                if (!['FW', 'MF', 'DF', 'GK'].includes(pos) && p.pos !== pos) return false;
            }

            // Stat Requirements (FM 16+)
            if (statReq === 'fin16' && (p.stats.finishing || 0) < 16) return false;
            if (statReq === 'pac17' && (p.stats.pace || 0) < 17) return false;
            if (statReq === 'pas17' && (p.stats.passing || 0) < 17) return false;
            if (statReq === 'tac17' && (p.stats.tackling || 0) < 17) return false;
            if (statReq === 'vis17' && (p.stats.vision || 0) < 17) return false;

            return true;
        });

        listContainer.innerHTML = '';

        const countBadge = document.getElementById('scoutResultCount');
        if (countBadge) countBadge.textContent = `${filtered.length}명의 슈퍼스타 검색됨`;

        filtered.slice(0, 80).forEach(player => {
            const isOwned = myPlayerIds.has(player.id);
            const card = document.createElement('div');
            card.className = `scout-card ${isOwned ? 'owned-card' : ''}`;

            // Key FM Stat Badge preview
            let keyStatLabel = '골결';
            let keyStatVal = player.stats.finishing;
            if (player.pos === 'GK') { keyStatLabel = '반사'; keyStatVal = player.stats.reflexes; }
            else if (['CB', 'LB', 'RB'].includes(player.pos)) { keyStatLabel = '태클'; keyStatVal = player.stats.tackling; }
            else if (['CM', 'CAM', 'CDM'].includes(player.pos)) { keyStatLabel = '패스'; keyStatVal = player.stats.passing; }
            else if (['LW', 'RW'].includes(player.pos)) { keyStatLabel = '주력'; keyStatVal = player.stats.pace; }

            const getStatColorClass = (val) => {
                if (val >= 16) return 'stat-elite';
                if (val >= 13) return 'stat-good';
                if (val >= 9) return 'stat-mid';
                return 'stat-low';
            };

            card.innerHTML = `
                <div class="scout-card-header">
                    <span class="scout-pos-tag ${player.pos}">${player.pos}</span>
                    <span class="scout-ovr-tag">${player.ovr}</span>
                </div>
                <div class="scout-player-main">
                    <div class="scout-flag-name">
                        <span class="flag-icon">${player.flag}</span>
                        <div class="name-box">
                            <span class="korean-name">${player.koreanName || player.name}</span>
                            <span class="eng-name">${player.name}</span>
                        </div>
                    </div>
                    <div class="scout-team-text">소속: ${player.team}</div>
                </div>
                <div class="scout-stats-row">
                    <div class="mini-stat"><span>주력</span> <b class="${getStatColorClass(player.stats.pace)}">${player.stats.pace}</b></div>
                    <div class="mini-stat"><span>${keyStatLabel}</span> <b class="${getStatColorClass(keyStatVal)}">${keyStatVal}</b></div>
                    <div class="mini-stat"><span>시야</span> <b class="${getStatColorClass(player.stats.vision)}">${player.stats.vision}</b></div>
                    <div class="mini-stat"><span>판단</span> <b class="${getStatColorClass(player.stats.decisions)}">${player.stats.decisions}</b></div>
                </div>
                <div class="scout-card-actions">
                    <button class="view-fm-btn">FM 스탯표</button>
                    ${isOwned 
                        ? `<button class="release-btn">방출</button>`
                        : `<button class="sign-btn">영입 (€${player.value}M)</button>`
                    }
                </div>
            `;

            // Action triggers
            card.querySelector('.view-fm-btn').addEventListener('click', () => {
                this.openPlayerDetailModal(player);
                sounds.playClick();
            });

            const signBtn = card.querySelector('.sign-btn');
            if (signBtn) {
                signBtn.addEventListener('click', () => {
                    this.signPlayer(player);
                    sounds.playWhistle('short');
                });
            }

            const releaseBtn = card.querySelector('.release-btn');
            if (releaseBtn) {
                releaseBtn.addEventListener('click', () => {
                    this.releasePlayer(player);
                    sounds.playClick();
                });
            }

            listContainer.appendChild(card);
        });
    }

    signPlayer(player) {
        if (this.myClub.starters.length + this.myClub.bench.length >= 25) {
            alert('⚠️ 스쿼드 인원 제한(최대 25명)을 초과했습니다. 기존 선수를 먼저 방출해 주세요!');
            return;
        }

        // Add to bench
        this.myClub.bench.push(player.id);
        this.saveMyClub();
        this.renderScoutingList();
        this.renderSquadTactics();
        alert(`🎉 [영입 성공!] ${player.flag} ${player.koreanName || player.name} 선수가 [${this.myClub.name}]의 후보 명단에 합류했습니다!`);
    }

    releasePlayer(player) {
        if (this.myClub.starters.length <= 11 && this.myClub.starters.includes(player.id)) {
            alert('⚠️ 선발 11명 선수는 바로 방출할 수 없습니다. 다른 선수와 교체 후 방출해주세요!');
            return;
        }

        this.myClub.starters = this.myClub.starters.filter(id => id !== player.id);
        this.myClub.bench = this.myClub.bench.filter(id => id !== player.id);
        this.saveMyClub();
        this.renderScoutingList();
        this.renderSquadTactics();
        alert(`👋 [방출 완료] ${player.koreanName || player.name} 선수가 자유 계약으로 방출되었습니다.`);
    }

    // Detailed FM Profile Modal
    openPlayerDetailModal(player) {
        const modal = document.getElementById('playerDetailModal');
        if (!modal) return;

        const s = player.stats;
        const color = (val) => {
            if (val >= 16) return 'stat-elite';
            if (val >= 13) return 'stat-good';
            if (val >= 9) return 'stat-mid';
            return 'stat-low';
        };

        document.getElementById('modalPlayerName').textContent = `${player.flag} ${player.koreanName || player.name} (${player.name})`;
        document.getElementById('modalPlayerMeta').textContent = `${player.pos} · OVR ${player.ovr} · CA ${player.ca} / PA ${player.pa} · 나이 ${player.age}세 · ${player.team} · 주발: ${player.foot === 'Both' ? '양발' : (player.foot === 'Left' ? '왼발' : '오른발')} · 신장 ${player.height}cm / 체중 ${player.weight}kg`;

        // Fill Technical Grid
        const techHtml = `
            <div class="fm-stat-item"><span>골 결정력 (Finishing)</span><b class="${color(s.finishing)}">${s.finishing}</b></div>
            <div class="fm-stat-item"><span>패스 (Passing)</span><b class="${color(s.passing)}">${s.passing}</b></div>
            <div class="fm-stat-item"><span>드리블 (Dribbling)</span><b class="${color(s.dribbling)}">${s.dribbling}</b></div>
            <div class="fm-stat-item"><span>퍼스트 터치 (First Touch)</span><b class="${color(s.firstTouch)}">${s.firstTouch}</b></div>
            <div class="fm-stat-item"><span>개인기 (Technique)</span><b class="${color(s.technique)}">${s.technique}</b></div>
            <div class="fm-stat-item"><span>태클 (Tackling)</span><b class="${color(s.tackling)}">${s.tackling}</b></div>
            <div class="fm-stat-item"><span>대인 마크 (Marking)</span><b class="${color(s.marking)}">${s.marking}</b></div>
            <div class="fm-stat-item"><span>헤더 (Heading)</span><b class="${color(s.heading)}">${s.heading}</b></div>
            <div class="fm-stat-item"><span>중거리 슛 (Long Shots)</span><b class="${color(s.longShots)}">${s.longShots}</b></div>
            <div class="fm-stat-item"><span>크로스 (Crossing)</span><b class="${color(s.crossing)}">${s.crossing}</b></div>
            <div class="fm-stat-item"><span>프리킥 (Free Kicks)</span><b class="${color(s.freeKicks)}">${s.freeKicks}</b></div>
        `;
        document.getElementById('modalTechStats').innerHTML = techHtml;

        // Fill Mental Grid
        const mentalHtml = `
            <div class="fm-stat-item"><span>시야 (Vision)</span><b class="${color(s.vision)}">${s.vision}</b></div>
            <div class="fm-stat-item"><span>판단력 (Decisions)</span><b class="${color(s.decisions)}">${s.decisions}</b></div>
            <div class="fm-stat-item"><span>수비위치선정 (Positioning)</span><b class="${color(s.positioning)}">${s.positioning}</b></div>
            <div class="fm-stat-item"><span>예측력 (Anticipation)</span><b class="${color(s.anticipation)}">${s.anticipation}</b></div>
            <div class="fm-stat-item"><span>침착성 (Composure)</span><b class="${color(s.composure)}">${s.composure}</b></div>
            <div class="fm-stat-item"><span>승부욕 (Determination)</span><b class="${color(s.determination)}">${s.determination}</b></div>
            <div class="fm-stat-item"><span>팀워크 (Teamwork)</span><b class="${color(s.teamwork)}">${s.teamwork}</b></div>
            <div class="fm-stat-item"><span>활동량 (Work Rate)</span><b class="${color(s.workRate)}">${s.workRate}</b></div>
            <div class="fm-stat-item"><span>오프 더 볼 (Off The Ball)</span><b class="${color(s.offTheBall)}">${s.offTheBall}</b></div>
            <div class="fm-stat-item"><span>대담성 (Bravery)</span><b class="${color(s.bravery)}">${s.bravery}</b></div>
        `;
        document.getElementById('modalMentalStats').innerHTML = mentalHtml;

        // Fill Physical & GK Grid
        const physicalHtml = `
            <div class="fm-stat-item"><span>주력 (Pace)</span><b class="${color(s.pace)}">${s.pace}</b></div>
            <div class="fm-stat-item"><span>순간속도 (Acceleration)</span><b class="${color(s.acceleration)}">${s.acceleration}</b></div>
            <div class="fm-stat-item"><span>지구력 (Stamina)</span><b class="${color(s.stamina)}">${s.stamina}</b></div>
            <div class="fm-stat-item"><span>몸싸움 (Strength)</span><b class="${color(s.strength)}">${s.strength}</b></div>
            <div class="fm-stat-item"><span>민첩성 (Agility)</span><b class="${color(s.agility)}">${s.agility}</b></div>
            <div class="fm-stat-item"><span>점프거리 (Jumping)</span><b class="${color(s.jumping)}">${s.jumping}</b></div>
            <div class="fm-stat-item"><span>균형감각 (Balance)</span><b class="${color(s.balance)}">${s.balance}</b></div>
            ${player.pos === 'GK' ? `
                <div class="fm-stat-item" style="border-top:1px dashed #334155; margin-top:6px; padding-top:6px;"><span>반사신경 (Reflexes)</span><b class="${color(s.reflexes)}">${s.reflexes}</b></div>
                <div class="fm-stat-item"><span>1대1 방어 (1 on 1)</span><b class="${color(s.oneOnOnes)}">${s.oneOnOnes}</b></div>
                <div class="fm-stat-item"><span>핸들링 (Handling)</span><b class="${color(s.handling)}">${s.handling}</b></div>
                <div class="fm-stat-item"><span>공중장악 (Aerial)</span><b class="${color(s.aerial)}">${s.aerial}</b></div>
            ` : ''}
        `;
        document.getElementById('modalPhysicalStats').innerHTML = physicalHtml;

        // Player Traits
        const traitsHtml = (player.traits || ['기본기 탄탄']).map(t => `<span class="trait-tag">⚡ ${t}</span>`).join(' ');
        document.getElementById('modalTraitsBox').innerHTML = traitsHtml;

        modal.classList.add('open');
    }

    closePlayerDetailModal() {
        const modal = document.getElementById('playerDetailModal');
        if (modal) modal.classList.remove('open');
    }

    // ----------------------------------------------------
    // TAB 3: CLUB CUSTOMIZER
    // ----------------------------------------------------
    setupClubCustomizerUI() {
        const nameInput = document.getElementById('clubNameInput');
        if (nameInput) {
            nameInput.value = this.myClub.name;
            nameInput.addEventListener('input', (e) => {
                this.myClub.name = e.target.value;
                this.saveMyClub();
            });
        }

        const shortInput = document.getElementById('clubShortNameInput');
        if (shortInput) {
            shortInput.value = this.myClub.shortName;
            shortInput.addEventListener('input', (e) => {
                this.myClub.shortName = e.target.value.toUpperCase();
                this.saveMyClub();
            });
        }

        const stadiumInput = document.getElementById('clubStadiumInput');
        if (stadiumInput) {
            stadiumInput.value = this.myClub.stadium;
            stadiumInput.addEventListener('input', (e) => {
                this.myClub.stadium = e.target.value;
                this.saveMyClub();
            });
        }

        const color1Input = document.getElementById('clubColor1Input');
        if (color1Input) {
            color1Input.value = this.myClub.color1;
            color1Input.addEventListener('input', (e) => {
                this.myClub.color1 = e.target.value;
                this.saveMyClub();
                this.renderSquadTactics();
            });
        }

        const color2Input = document.getElementById('clubColor2Input');
        if (color2Input) {
            color2Input.value = this.myClub.color2;
            color2Input.addEventListener('input', (e) => {
                this.myClub.color2 = e.target.value;
                this.saveMyClub();
                this.renderSquadTactics();
            });
        }

        const emblemButtons = document.querySelectorAll('.emblem-option-btn');
        emblemButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.myClub.emblem = btn.textContent.trim();
                emblemButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.saveMyClub();
                sounds.playClick();
            });
        });
    }

    renderClubCustomizer() {
        const previewLogo = document.getElementById('clubCustomPreviewLogo');
        const previewName = document.getElementById('clubCustomPreviewName');
        const previewStad = document.getElementById('clubCustomPreviewStadium');
        if (previewLogo) previewLogo.textContent = this.myClub.emblem;
        if (previewName) previewName.textContent = this.myClub.name;
        if (previewStad) previewStad.textContent = `홈구장: ${this.myClub.stadium}`;
    }

    // ----------------------------------------------------
    // TAB 4: MATCH CENTER
    // ----------------------------------------------------
    setupMatchCenterUI() {
        const opponentSelect = document.getElementById('matchOpponentSelect');
        if (opponentSelect) {
            opponentSelect.innerHTML = CLUBS.map(c => `
                <option value="${c.id}">${c.emblem} ${c.name} (${c.league.toUpperCase()})</option>
            `).join('');

            opponentSelect.value = this.selectedOpponentId;
            opponentSelect.addEventListener('change', (e) => {
                this.selectedOpponentId = e.target.value;
                this.renderMatchPreScreen();
                sounds.playClick();
            });
        }

        const startMatchBtn = document.getElementById('startMatchBtn');
        if (startMatchBtn) {
            startMatchBtn.addEventListener('click', () => {
                this.startLiveMatch();
            });
        }

        // Speed buttons
        document.querySelectorAll('.match-speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const spd = parseInt(btn.dataset.speed);
                document.querySelectorAll('.match-speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (this.matchEngine) this.matchEngine.setSpeed(spd);
                sounds.playClick();
            });
        });

        // Tactical Shouts
        document.querySelectorAll('.shout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const shout = btn.dataset.shout;
                this.handleTacticalShout(shout);
                sounds.playClick();
            });
        });
    }

    renderMatchPreScreen() {
        const oppClub = CLUB_MAP[this.selectedOpponentId] || CLUBS[0];

        const homeName = document.getElementById('preMatchHomeName');
        const homeEmblem = document.getElementById('preMatchHomeEmblem');
        const awayName = document.getElementById('preMatchAwayName');
        const awayEmblem = document.getElementById('preMatchAwayEmblem');
        const venueText = document.getElementById('preMatchVenue');

        if (homeName) homeName.textContent = this.myClub.name;
        if (homeEmblem) homeEmblem.textContent = this.myClub.emblem;
        if (awayName) awayName.textContent = oppClub.name;
        if (awayEmblem) awayEmblem.textContent = oppClub.emblem;
        if (venueText) venueText.textContent = `경기장: ${this.myClub.stadium} (홈 경기)`;

        // Hide live scoreboard & live commentary initially, show kickoff block
        document.getElementById('matchPreScreen').style.display = 'block';
        document.getElementById('matchLiveScreen').style.display = 'none';
        document.getElementById('matchReportScreen').style.display = 'none';
    }

    startLiveMatch() {
        const oppClub = CLUB_MAP[this.selectedOpponentId] || CLUBS[0];

        // Prepare Real Squad for Opponent
        const oppStarters = (oppClub.starters || []).map(id => PLAYER_MAP[id]).filter(Boolean);
        const oppBench = (oppClub.bench || []).map(id => PLAYER_MAP[id]).filter(Boolean);

        const myStarters = this.myClub.starters.map(id => PLAYER_MAP[id]).filter(Boolean);
        const myBench = this.myClub.bench.map(id => PLAYER_MAP[id]).filter(Boolean);

        const homeTeam = {
            name: this.myClub.name,
            color1: this.myClub.color1,
            color2: this.myClub.color2,
            formation: this.myClub.formation || '4-3-3',
            mentality: this.myClub.mentality || 'Attacking',
            pressing: this.myClub.pressing || 'High',
            startingXI: myStarters,
            bench: myBench
        };

        const awayTeam = {
            name: oppClub.name,
            color1: oppClub.color1,
            color2: oppClub.color2,
            formation: oppClub.formation || '4-3-3',
            mentality: 'Balanced',
            pressing: 'Normal',
            startingXI: oppStarters,
            bench: oppBench
        };

        // Switch to Live Match UI
        document.getElementById('matchPreScreen').style.display = 'none';
        document.getElementById('matchLiveScreen').style.display = 'block';
        document.getElementById('matchReportScreen').style.display = 'none';

        // Clear commentary
        const commFeed = document.getElementById('liveCommentaryFeed');
        if (commFeed) commFeed.innerHTML = '';

        // Sync 2D Canvas Teams & Formations
        this.pitchCanvas.syncTeamFormation(homeTeam, awayTeam);

        // Instantiate Engine
        this.matchEngine = new MatchEngine(homeTeam, awayTeam, {
            speed: 1,
            pitchCanvas: this.pitchCanvas,
            onMinute: (min, hScore, aScore, stats) => this.onMatchMinuteUpdate(min, hScore, aScore, stats),
            onEvent: (ev) => this.onMatchEventCommentary(ev),
            onComplete: (result) => this.onMatchCompleted(result)
        });

        // Set live header labels
        document.getElementById('liveHomeName').textContent = homeTeam.name;
        document.getElementById('liveAwayName').textContent = awayTeam.name;
        document.getElementById('liveScoreText').textContent = '0 - 0';
        document.getElementById('liveClockText').textContent = "00:00 (전반)";

        this.matchEngine.start();
    }

    onMatchMinuteUpdate(min, hScore, aScore, stats) {
        const scoreText = document.getElementById('liveScoreText');
        const clockText = document.getElementById('liveClockText');
        if (scoreText) scoreText.textContent = `${hScore} - ${aScore}`;
        if (clockText) {
            const halfStr = min <= 45 ? '전반' : '후반';
            clockText.textContent = `${min}' (${halfStr})`;
        }

        // Update Live Stats Bars
        document.getElementById('livePossessionBar').style.width = `${stats.home.possession}%`;
        document.getElementById('liveHomePossText').textContent = `${stats.home.possession}%`;
        document.getElementById('liveAwayPossText').textContent = `${stats.away.possession}%`;

        document.getElementById('liveHomeShots').textContent = stats.home.shots;
        document.getElementById('liveAwayShots').textContent = stats.away.shots;
        document.getElementById('liveHomeSOT').textContent = stats.home.shotsOnTarget;
        document.getElementById('liveAwaySOT').textContent = stats.away.shotsOnTarget;
        document.getElementById('liveHomexG').textContent = stats.home.xG.toFixed(2);
        document.getElementById('liveAwayxG').textContent = stats.away.xG.toFixed(2);
    }

    onMatchEventCommentary(ev) {
        const commFeed = document.getElementById('liveCommentaryFeed');
        if (!commFeed) return;

        const item = document.createElement('div');
        item.className = `comm-item comm-type-${ev.type.toLowerCase()}`;
        item.innerHTML = `
            <span class="comm-min">${ev.minute}'</span>
            <span class="comm-text">${ev.text}</span>
        `;
        commFeed.prepend(item);
    }

    handleTacticalShout(shout) {
        if (!this.matchEngine) return;
        if (shout === 'press') {
            this.matchEngine.setHomeTactics(null, 'High');
        } else if (shout === 'attack') {
            this.matchEngine.setHomeTactics('UltraAttacking', null);
        } else if (shout === 'tempo') {
            this.matchEngine.setHomeTactics('Balanced', 'Normal');
        } else if (shout === 'defense') {
            this.matchEngine.setHomeTactics('Bus', 'Low');
        }
    }

    onMatchCompleted(res) {
        document.getElementById('matchLiveScreen').style.display = 'none';
        const rep = document.getElementById('matchReportScreen');
        rep.style.display = 'block';

        document.getElementById('reportScoreText').textContent = `${res.homeScore} : ${res.awayScore}`;
        document.getElementById('reportHomeName').textContent = res.homeTeam.name;
        document.getElementById('reportAwayName').textContent = res.awayTeam.name;

        // MOM Showcase
        const mom = res.mom;
        const momCard = document.getElementById('reportMomCard');
        if (momCard && mom) {
            momCard.innerHTML = `
                <div class="mom-trophy">🏆 MAN OF THE MATCH</div>
                <div class="mom-avatar">${mom.flag || '⭐'}</div>
                <div class="mom-name">${mom.koreanName || mom.name}</div>
                <div class="mom-rating">매치 평점: <b>${mom.finalRating || 8.5}</b> / 10.0</div>
                <div class="mom-stats">골: ${mom.matchStats.goals} | 도움: ${mom.matchStats.assists} | 태클: ${mom.matchStats.tackles} | 세이브: ${mom.matchStats.saves}</div>
            `;
        }

        // Scorers summary list
        const scorersList = document.getElementById('reportScorersList');
        if (scorersList) {
            if (res.scorers.length === 0) {
                scorersList.innerHTML = '<div style="color:#94a3b8; text-align:center;">득점자 없음 (0:0 무승부)</div>';
            } else {
                scorersList.innerHTML = res.scorers.map(sc => `
                    <div class="report-scorer-item">
                        <span>⚽ ${sc.minute}' <b>${sc.scorerName}</b> (${sc.teamName})</span>
                        <span style="color:#64748b; font-size:0.85rem;">${sc.assistName ? '도움: ' + sc.assistName : '단독 득점'} · xG ${sc.xG.toFixed(2)}</span>
                    </div>
                `).join('');
            }
        }

        // Return button
        const returnBtn = document.getElementById('reportReturnBtn');
        if (returnBtn) {
            returnBtn.onclick = () => {
                this.renderMatchPreScreen();
                sounds.playClick();
            };
        }
    }

    // ----------------------------------------------------
    // TAB 5: WORLD TOURNAMENT (CHAMPIONS CUP)
    // ----------------------------------------------------
    setupTournamentUI() {
        const startTournBtn = document.getElementById('startTournamentBtn');
        if (startTournBtn) {
            startTournBtn.addEventListener('click', () => {
                alert('🏆 [챔피언스 컵 토너먼트 시작!] 8강전 상대로 맨체스터 시티가 배정되었습니다! 매치 센터에서 즉시 맞붙어 승리하세요!');
                this.selectedOpponentId = 'mancity';
                this.switchTab('match');
            });
        }
    }
}

// Global App Instance
let app = null;
window.addEventListener('DOMContentLoaded', () => {
    app = new App();
    app.init();
});
