// ============================================================================
// FM Dream Club & Kickru Master Application Controller (app.js)
// - 10 Global Leagues, 78 Authentic Clubs, 960+ Real Players & Procedural Newgens
// - Interactive 2D Match Console, Squad Builder, Scouting Recruitment & Career Mode
// ============================================================================

var App = (typeof window !== 'undefined' ? window : global).App = class App {
    constructor() {
        this.pitchCanvas = null;
        this.matchEngine = null;
        this.currentTab = 'playerCareer';
        this.selectedLeagueId = 'kleague';
        this.swapSlotA = null;
        this.tacticsSwapSlotA = null;
        this.currentDetailPlayerId = null;

        this.career = new CareerEngine();

        this.activeClubId = (typeof localStorage !== 'undefined' && localStorage.getItem('fm_active_club_id')) || 'ulsan';
        if (this.activeClubId !== 'custom' && typeof CLUB_MAP !== 'undefined' && !CLUB_MAP[this.activeClubId]) {
            this.activeClubId = 'ulsan';
        }
        this.myClub = this.loadClub(this.activeClubId);
        this.currentOpponent = this.pickNextRoundOpponent();
    }

    init() {
        if (typeof document === 'undefined') return;

        this.pitchCanvas = new PitchCanvas('livePitchCanvas');

        this.setupNavigation();
        this.setupCareerUI();
        this.setupLeagueUI();
        this.setupShopUI();
        this.setupTacticsUI();
        this.setupScoutingUI();

        this.renderPlayerCareer();
        this.renderCareerSquad();
        this.renderLeagueStandings(this.selectedLeagueId);
        this.renderShopCatalog();
        this.renderHallOfFame();
        this.renderStandaloneTactics();
        this.renderScoutingList();
        this.updateHeaderClubBadge();

        if (typeof sounds !== 'undefined') {
            document.body.addEventListener('click', () => sounds.init(), { once: true });
        }

        setTimeout(() => {
            if (this.pitchCanvas) this.pitchCanvas.resize();
        }, 100);
    }

    loadClub(clubId) {
        if (clubId === 'custom') {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('fm_custom_club_data');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (parsed && Array.isArray(parsed.starters) && parsed.starters.every(id => PLAYER_MAP[id])) {
                            return parsed;
                        }
                    } catch (e) {}
                }
            }
            return {
                id: 'custom',
                name: '나만의 드림 클럽',
                shortName: 'DRM',
                league: 'epl',
                emblem: '👑',
                color1: '#0284c7',
                color2: '#f59e0b',
                stadium: '드림 아레나',
                formation: '4-3-3',
                starters: ['liv_alisson', 'liv_trent', 'bayern_kimminjae', 'liv_vandijk', 'mancity_gvardiol', 'mancity_rodri', 'mancity_debruyne', 'real_bellingham', 'psg_leekangin', 'tottenham_son', 'mancity_haaland'],
                bench: ['kor_chohyunwoo', 'real_mbappe', 'real_vinicius', 'bayern_kane', 'leg_messi']
            };
        }

        const realClub = (typeof CLUB_MAP !== 'undefined' && CLUB_MAP[clubId]) || CLUBS[0];
        const starters = [...(realClub.starters || [])];
        const bench = [...(realClub.bench || [])];

        // Ensure user career player is present if this is their club
        const myP = this.career ? this.career.playerProfile : null;
        if (myP && myP.clubId === realClub.id) {
            if (!starters.includes('my_career_player') && !bench.includes('my_career_player')) {
                if (myP.managerTrust >= 60) {
                    starters[starters.length - 1] = 'my_career_player';
                } else {
                    bench.unshift('my_career_player');
                }
            }
        }

        return {
            id: realClub.id,
            name: realClub.name,
            shortName: realClub.shortName,
            league: realClub.league,
            emblem: realClub.emblem,
            color1: realClub.color1,
            color2: realClub.color2,
            stadium: realClub.stadium,
            formation: realClub.formation || '4-3-3',
            starters: starters,
            bench: bench
        };
    }

    saveCurrentClub() {
        if (typeof CLUB_MAP !== 'undefined' && CLUB_MAP[this.myClub.id]) {
            CLUB_MAP[this.myClub.id].starters = [...this.myClub.starters];
            CLUB_MAP[this.myClub.id].bench = [...this.myClub.bench];
            CLUB_MAP[this.myClub.id].formation = this.myClub.formation;
        }
        if (typeof localStorage !== 'undefined') {
            if (this.myClub.id === 'custom') {
                localStorage.setItem('fm_custom_club_data', JSON.stringify(this.myClub));
            }
            localStorage.setItem('fm_active_club_id', this.activeClubId);
        }
        this.updateHeaderClubBadge();
    }

    pickNextRoundOpponent() {
        const myLeague = this.myClub.league || 'kleague';
        const leagueClubs = CLUBS.filter(c => c.league === myLeague && c.id !== this.myClub.id && !c.isHistoricalTeam);
        if (leagueClubs.length > 0) {
            return leagueClubs[Math.floor(Math.random() * leagueClubs.length)];
        }
        return CLUBS.find(c => c.id !== this.myClub.id && !c.isHistoricalTeam) || CLUBS[1];
    }

    updateHeaderClubBadge() {
        if (typeof document === 'undefined') return;
        const logoEl = document.getElementById('headerClubLogo');
        const nameEl = document.getElementById('headerClubName');
        const badgeEl = document.getElementById('headerClubBadge');
        if (logoEl) logoEl.textContent = this.myClub.emblem || '⚽';
        if (nameEl) nameEl.textContent = this.myClub.name || '선택된 팀';
        if (badgeEl) {
            badgeEl.style.backgroundColor = this.myClub.color1;
            badgeEl.style.borderColor = this.myClub.color2;
        }

        const seasonBadge = document.getElementById('currentSeasonBadge');
        if (seasonBadge) {
            seasonBadge.textContent = `${this.career.currentSeason} 시즌 (${this.career.currentRound}R)`;
        }
    }

    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-tab-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.tab;
                this.switchTab(target);
                if (typeof sounds !== 'undefined') sounds.playClick();
            });
        });
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));

        if (tabId === 'playerCareer') {
            this.renderPlayerCareer();
            this.renderCareerSquad();
        } else if (tabId === 'tactics') {
            this.renderStandaloneTactics();
        } else if (tabId === 'league') {
            this.renderLeagueStandings(this.selectedLeagueId);
        } else if (tabId === 'scouting') {
            this.renderScoutingList();
        } else if (tabId === 'shop') {
            this.renderShopCatalog();
        } else if (tabId === 'hallOfFame') {
            this.renderHallOfFame();
        }
    }

    // ========================================================================
    // 1. KICKRU PLAYER CAREER, CUSTOMIZATION, AGENT TRANSFERS & LIVE 2D MATCH
    // ========================================================================
    setupCareerUI() {
        const kickoffBtn = document.getElementById('careerKickoffMatchBtn');
        if (kickoffBtn) kickoffBtn.addEventListener('click', () => this.startCareerLiveMatch());

        const trainBtn = document.getElementById('careerDoTrainBtn');
        if (trainBtn) trainBtn.addEventListener('click', () => this.trainCareerPlayer());

        const simSeasonBtn = document.getElementById('careerSimSeasonBtn');
        if (simSeasonBtn) simSeasonBtn.addEventListener('click', () => this.simulateCareerSeason());

        const returnBtn = document.getElementById('careerReturnBtn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                document.getElementById('careerMatchReportCard').style.display = 'none';
                document.getElementById('liveMatchContainer').style.display = 'none';
                if (typeof sounds !== 'undefined') sounds.playClick();
                this.renderPlayerCareer();
                this.renderCareerSquad();
            });
        }

        // Live Match Interactive Command Buttons (PASS_TO_ME, SHOOT, THROUGH_PASS, DRIBBLE_PRESS)
        const cmdBtns = document.querySelectorAll('.live-cmd-btn');
        cmdBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd;
                if (this.matchEngine) {
                    this.matchEngine.triggerUserCommand(cmd);
                }
            });
        });

        // Live Match Tactical Mentality Buttons
        const tacticBtns = document.querySelectorAll('.live-tactic-btn');
        tacticBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tacticBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.tactic;
                if (this.matchEngine) {
                    this.matchEngine.setTacticalMentality(mode);
                }
                if (typeof sounds !== 'undefined') sounds.playClick();
            });
        });

        // Match Speed Buttons
        const speedBtns = document.querySelectorAll('#liveMatchContainer .match-speed-btn');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                speedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const spd = parseInt(btn.dataset.speed);
                if (spd === 0) {
                    if (this.matchEngine) this.matchEngine.simulateFullMatchInstantly();
                } else {
                    if (this.matchEngine) this.matchEngine.setSpeed(spd);
                }
                if (typeof sounds !== 'undefined') sounds.playClick();
            });
        });

        // Club Switcher in Career Mode
        const clubSelect = document.getElementById('careerClubSelector');
        if (clubSelect) {
            this.populateClubSelector(clubSelect, true);
            clubSelect.value = this.activeClubId;
            clubSelect.addEventListener('change', (e) => {
                this.switchActiveClub(e.target.value);
            });
        }

        // Formation Select in Career Mode
        const formSelect = document.getElementById('careerFormationSelect');
        if (formSelect) {
            formSelect.value = this.myClub.formation || '4-3-3';
            formSelect.addEventListener('change', (e) => {
                this.myClub.formation = e.target.value;
                const tacForm = document.getElementById('tacticsFormationSelect');
                if (tacForm) tacForm.value = e.target.value;
                this.saveCurrentClub();
                this.renderCareerSquad();
                this.renderStandaloneTactics();
                if (typeof sounds !== 'undefined') sounds.playClick();
            });
        }

        const autoBtn = document.getElementById('careerAutoPickBtn');
        if (autoBtn) {
            autoBtn.addEventListener('click', () => {
                this.autoPickBestXI();
                this.renderCareerSquad();
                this.renderStandaloneTactics();
                if (typeof sounds !== 'undefined') sounds.playWhistle('short');
            });
        }

        // Custom Player Modal Setup
        const customBtn = document.getElementById('careerCustomizeBtn');
        const customModal = document.getElementById('customPlayerModal');
        const closeCustomBtn = document.getElementById('closeCustomPlayerBtn');
        const saveCustomBtn = document.getElementById('saveCustomPlayerBtn');
        const customClubSelect = document.getElementById('customClubSelect');

        if (customClubSelect) {
            this.populateClubSelector(customClubSelect, false);
        }

        if (customBtn && customModal) {
            customBtn.addEventListener('click', () => {
                const p = this.career.playerProfile;
                document.getElementById('customNameInput').value = p.name;
                document.getElementById('customNationSelect').value = p.nation;
                document.getElementById('customPosSelect').value = p.pos;
                document.getElementById('customStyleSelect').value = p.style;
                if (customClubSelect) customClubSelect.value = p.clubId;
                customModal.style.display = 'flex';
                if (typeof sounds !== 'undefined') sounds.playClick();
            });
        }
        if (closeCustomBtn && customModal) {
            closeCustomBtn.addEventListener('click', () => { customModal.style.display = 'none'; });
        }
        if (saveCustomBtn && customModal) {
            saveCustomBtn.addEventListener('click', () => {
                const name = document.getElementById('customNameInput').value;
                const nation = document.getElementById('customNationSelect').value;
                const pos = document.getElementById('customPosSelect').value;
                const style = document.getElementById('customStyleSelect').value;
                const clubId = customClubSelect ? customClubSelect.value : this.activeClubId;

                this.career.customizePlayerProfile({ name, nation, pos, style, clubId });
                this.switchActiveClub(clubId);
                customModal.style.display = 'none';
                if (typeof sounds !== 'undefined') sounds.playWhistle('short');
            });
        }

        // Agent Transfer Offers Modal Setup
        const transferBtn = document.getElementById('careerTransferOfferBtn');
        const transferModal = document.getElementById('transferOffersModal');
        const closeTransferBtn = document.getElementById('closeTransferModalBtn');

        if (transferBtn && transferModal) {
            transferBtn.addEventListener('click', () => {
                this.openTransferOffersModal();
            });
        }
        if (closeTransferBtn && transferModal) {
            closeTransferBtn.addEventListener('click', () => { transferModal.style.display = 'none'; });
        }
    }

    populateClubSelector(selectEl, includeCustom = true) {
        if (!selectEl) return;
        const customOpt = includeCustom ? `<option value="custom">👑 [나만의 커스텀 드림팀]</option>` : '';
        const clubOpts = CLUBS.filter(c => !c.isHistoricalTeam && c.league !== 'legends').map(c =>
            `<option value="${c.id}">${c.emblem} ${c.name} (${c.shortName})</option>`
        ).join('');
        selectEl.innerHTML = customOpt + clubOpts;
    }

    switchActiveClub(newClubId) {
        this.activeClubId = newClubId;
        this.myClub = this.loadClub(this.activeClubId);
        if (newClubId !== 'custom') {
            this.career.playerProfile.clubId = this.myClub.id;
            this.career.playerProfile.clubName = this.myClub.name;
            this.career.syncUserPlayerIntoClubSquad();
            this.myClub = this.loadClub(this.activeClubId);
        }
        this.currentOpponent = this.pickNextRoundOpponent();
        this.saveCurrentClub();

        if (typeof document !== 'undefined') {
            const cSel1 = document.getElementById('careerClubSelector');
            const cSel2 = document.getElementById('activeClubSelect');
            if (cSel1) cSel1.value = this.activeClubId;
            if (cSel2) cSel2.value = this.activeClubId;
        }

        this.renderPlayerCareer();
        this.renderCareerSquad();
        this.renderStandaloneTactics();
        if (typeof sounds !== 'undefined') sounds.playWhistle('short');
    }

    openTransferOffersModal() {
        const modal = document.getElementById('transferOffersModal');
        const listEl = document.getElementById('transferOffersList');
        if (!modal || !listEl) return;

        const offers = this.career.getTransferOffers();
        listEl.innerHTML = '';

        offers.forEach(offer => {
            const btn = document.createElement('button');
            btn.className = 'story-choice-btn';
            btn.innerHTML = `
                <div class="choice-text">${offer.emblem} ${offer.clubName} (구단 명성 ${offer.reputation})</div>
                <div class="choice-effect">💰 주급 ${offer.weeklyWage.toLocaleString()}만원 • 계약금 ${offer.signingBonus.toLocaleString()}만원 • ${offer.roleOffer}</div>
            `;
            btn.addEventListener('click', () => {
                const res = this.career.transferPlayerToClub(offer);
                modal.style.display = 'none';
                this.switchActiveClub(offer.clubId);

                const newsFeed = document.getElementById('careerNewsFeed');
                if (newsFeed) {
                    const item = document.createElement('div');
                    item.style.padding = '10px';
                    item.style.background = 'rgba(16, 185, 129, 0.15)';
                    item.style.border = '1px solid #10b981';
                    item.style.borderRadius = '8px';
                    item.style.fontSize = '0.84rem';
                    item.innerHTML = `<b style="color:#10b981;">${res.message}</b>`;
                    newsFeed.insertBefore(item, newsFeed.firstChild);
                }
            });
            listEl.appendChild(btn);
        });

        modal.style.display = 'flex';
        if (typeof sounds !== 'undefined') sounds.playClick();
    }

    renderPlayerCareer() {
        if (typeof document === 'undefined') return;
        const p = this.career.playerProfile;

        document.getElementById('careerPlayerName').textContent = p.name;
        document.getElementById('careerPlayerOvr').textContent = `OVR ${p.ovr}`;
        document.getElementById('careerPlayerNation').textContent = `${p.flag} ${p.nation}`;
        document.getElementById('careerPlayerAge').textContent = `${p.age}세 (${p.birthYear}년생)`;
        document.getElementById('careerPlayerPos').textContent = p.pos;
        document.getElementById('careerPlayerStyle').textContent = p.style;
        document.getElementById('careerPlayerClub').textContent = p.clubName;

        document.getElementById('careerWeeklyWage').textContent = p.weeklyWage.toLocaleString();
        document.getElementById('careerBankBalance').textContent = p.bankBalance.toLocaleString();

        const milEl = document.getElementById('careerMilitaryStatus');
        if (milEl) {
            milEl.innerHTML = p.militaryExempt
                ? '<span style="color:#10b981; font-weight:800;">🥇 병역 면제 (체육요원 특례 달성)</span>'
                : '🎖️ 병역: 미필 (아시안게임 금메달 시 면제)';
        }

        document.getElementById('careerTrustVal').textContent = `${p.managerTrust}%`;
        document.getElementById('careerFameVal').textContent = `${p.fanPopularity}%`;
        document.getElementById('careerFameTitle').textContent = p.fameLevel;
        document.getElementById('careerMoraleVal').textContent = `${p.teamMorale}%`;
        document.getElementById('careerPaVal').textContent = `${p.pa}`;
        document.getElementById('careerGoalsVal').textContent = `${p.careerStats.goals}골 ${p.careerStats.assists}도움`;
        document.getElementById('careerAppsVal').textContent = `총 ${p.careerStats.appearances}경기 출전`;
        document.getElementById('careerTrophiesVal').textContent = `🏆 ${p.careerStats.trophies} / 🥇 ${p.careerStats.ballonDor}`;

        const roleStatusEl = document.getElementById('careerMatchRoleStatus');
        if (roleStatusEl) {
            if (p.managerTrust >= 60 || p.ovr >= 72) {
                roleStatusEl.innerHTML = '<span style="color:#10b981; font-weight:800;">주전 선발 (STARTER)</span>';
            } else if (p.managerTrust >= 38) {
                roleStatusEl.innerHTML = '<span style="color:#f59e0b; font-weight:800;">후반 조커 (SUB IN)</span>';
            } else {
                roleStatusEl.innerHTML = '<span style="color:#94a3b8;">후보 벤치 (BENCH)</span>';
            }
        }

        this.updateHeaderClubBadge();
    }

    // ========================================================================
    // SQUAD BUILDER & LINEUP BOARD (스쿼드 꾸리기)
    // ========================================================================
    renderCareerSquad() {
        if (typeof document === 'undefined') return;
        this.renderCareerPitchSlots();
        this.renderCareerBenchSlots();
        this.updateSquadAnalytics();
    }

    renderCareerPitchSlots() {
        const container = document.getElementById('careerPitchSlots');
        if (!container) return;
        container.innerHTML = '';

        const formation = this.myClub.formation || '4-3-3';
        const coords = this.getFormationCoordinates(formation);
        const myP = this.career.playerProfile;

        this.myClub.starters.slice(0, 11).forEach((pId, idx) => {
            const player = PLAYER_MAP[pId] || { name: '선수', koreanName: '선수', ovr: 75, pos: 'MF' };
            const coord = coords[idx] || { x: 50, y: 50 };
            const isMe = (pId === 'my_career_player' || player.isPlayerCharacter || player.name === myP.name || player.koreanName === myP.name);

            const node = document.createElement('div');
            node.className = `player-pitch-node ${this.swapSlotA === idx ? 'selected-swap' : ''} ${isMe ? 'user-player-node' : ''}`;
            node.style.left = `${coord.x}%`;
            node.style.top = `${coord.y}%`;

            const displayOvr = isMe ? myP.ovr : player.ovr;
            const ovrClass = displayOvr >= 85 ? 'ovr-world-class' : (displayOvr >= 78 ? 'ovr-elite' : 'ovr-regular');

            node.innerHTML = `
                <div class="node-token" style="background:${isMe ? '#f59e0b' : (this.myClub.color1 || '#0284c7')}; border-color:${isMe ? '#ffffff' : (this.myClub.color2 || '#ffffff')};">
                    ${isMe ? '★' : (player.pos || 'MF')}
                </div>
                <div class="node-name" style="${isMe ? 'color:#fef08a; font-weight:900;' : ''}">${isMe ? `★ ${myP.name}` : (player.koreanName || player.name)}</div>
                <div class="node-ovr-tag ${ovrClass}">${displayOvr}</div>
            `;

            node.addEventListener('click', () => this.handleCareerSquadClick(idx));
            container.appendChild(node);
        });
    }

    renderCareerBenchSlots() {
        const container = document.getElementById('careerBenchSlots');
        if (!container) return;
        container.innerHTML = '';

        const myP = this.career.playerProfile;

        this.myClub.bench.forEach((pId, idx) => {
            const player = PLAYER_MAP[pId] || { name: '후보', koreanName: '후보', ovr: 70, pos: 'SUB' };
            const isMe = (pId === 'my_career_player' || player.isPlayerCharacter || player.name === myP.name || player.koreanName === myP.name);
            const isSelected = this.swapSlotA === (idx + 100);
            const displayOvr = isMe ? myP.ovr : player.ovr;

            const card = document.createElement('div');
            card.className = `bench-item-card ${isSelected ? 'selected-swap' : ''} ${isMe ? 'user-player-bench' : ''}`;
            card.style.border = isMe ? '2px solid #f59e0b' : '';
            card.style.background = isMe ? 'rgba(245, 158, 11, 0.2)' : '';

            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-weight:800; font-size:0.75rem; color:${isMe ? '#f59e0b' : '#94a3b8'}; width:28px;">
                        ${isMe ? '★' : player.pos}
                    </span>
                    <span style="font-weight:800; font-size:0.85rem; color:#ffffff;">
                        ${isMe ? `★ ${myP.name} (내 선수)` : (player.koreanName || player.name)}
                    </span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span class="node-ovr-tag ${displayOvr >= 85 ? 'ovr-world-class' : 'ovr-elite'}">
                        ${displayOvr}
                    </span>
                </div>
            `;

            card.addEventListener('click', () => this.handleCareerSquadClick(idx + 100));
            container.appendChild(card);
        });
    }

    handleCareerSquadClick(slotIndex) {
        if (typeof sounds !== 'undefined') sounds.playClick();
        if (this.swapSlotA === null) {
            this.swapSlotA = slotIndex;
            this.renderCareerSquad();
            this.renderStandaloneTactics();
        } else {
            const slotA = this.swapSlotA;
            const slotB = slotIndex;
            this.swapSlotA = null;

            if (slotA !== slotB) {
                const getRef = (s) => (s < 100 ? { arr: this.myClub.starters, idx: s } : { arr: this.myClub.bench, idx: s - 100 });
                const refA = getRef(slotA);
                const refB = getRef(slotB);

                const temp = refA.arr[refA.idx];
                refA.arr[refA.idx] = refB.arr[refB.idx];
                refB.arr[refB.idx] = temp;

                this.saveCurrentClub();
                if (typeof sounds !== 'undefined') sounds.playWhistle('short');
            }
            this.renderCareerSquad();
            this.renderStandaloneTactics();
        }
    }

    // Sign any player from Scouting directly into user's active squad!
    signPlayerToMySquad(playerId) {
        const p = PLAYER_MAP[playerId];
        if (!p) return { success: false };

        if (this.myClub.starters.includes(playerId) || this.myClub.bench.includes(playerId)) {
            return { success: false, message: `이미 [${this.myClub.name}] 스쿼드에 소속된 선수입니다!` };
        }

        // Put into starters if higher OVR than lowest non-GK starter, else bench
        this.myClub.bench.unshift(playerId);
        this.saveCurrentClub();
        this.renderCareerSquad();
        this.renderStandaloneTactics();

        if (typeof sounds !== 'undefined') sounds.playWhistle('short');
        return {
            success: true,
            message: `🎉 [${p.koreanName || p.name} (OVR ${p.ovr})] 선수를 [${this.myClub.name}] 스쿼드에 전격 영입했습니다! 스쿼드 보드에서 선발로 배치해 보세요!`
        };
    }

    updateSquadAnalytics() {
        if (typeof document === 'undefined') return;
        const starters = this.myClub.starters.slice(0, 11).map(id => PLAYER_MAP[id]).filter(Boolean);
        if (starters.length === 0) return;

        const avg = (arr) => arr.length ? Math.round(arr.reduce((s, x) => s + (x.ovr || 75), 0) / arr.length) : 78;
        const fw = starters.filter(p => ['ST', 'CF', 'LW', 'RW', 'FW'].includes(p.pos));
        const mf = starters.filter(p => ['CAM', 'CM', 'CDM', 'RM', 'LM', 'MF'].includes(p.pos));
        const df = starters.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DF', 'GK'].includes(p.pos));

        const ovrEl = document.getElementById('squadAvgOvr');
        const attEl = document.getElementById('squadAvgAtt');
        const midEl = document.getElementById('squadAvgMid');
        const defEl = document.getElementById('squadAvgDef');

        const teamAvg = avg(starters);
        if (ovrEl) ovrEl.textContent = teamAvg;
        if (attEl) attEl.textContent = fw.length ? avg(fw) : teamAvg;
        if (midEl) midEl.textContent = mf.length ? avg(mf) : teamAvg;
        if (defEl) defEl.textContent = df.length ? avg(df) : teamAvg;
    }

    // ========================================================================
    // START 2D LIVE MATCH (플레이해보고 / 게임 상황 보기)
    // ========================================================================
    startCareerLiveMatch() {
        if (typeof sounds !== 'undefined') sounds.playWhistle('short');

        const opp = this.currentOpponent || this.pickNextRoundOpponent();

        const matchContainer = document.getElementById('liveMatchContainer');
        if (matchContainer) {
            matchContainer.style.display = 'block';
            document.getElementById('careerMatchReportCard').style.display = 'none';
            if (matchContainer.scrollIntoView) matchContainer.scrollIntoView({ behavior: 'smooth' });
        }

        document.getElementById('liveHomeEmblem').textContent = this.myClub.emblem || '⚽';
        document.getElementById('liveHomeName').textContent = this.myClub.name;
        document.getElementById('liveAwayEmblem').textContent = opp.emblem || '⚽';
        document.getElementById('liveAwayName').textContent = opp.name;
        document.getElementById('liveScoreText').textContent = '0 - 0';
        document.getElementById('liveClockText').textContent = '00:00 (전반)';
        document.getElementById('liveCommentaryFeed').innerHTML = '';

        const myP = this.career.playerProfile;
        const homeStarters = this.myClub.starters.slice(0, 11).map((id, idx) => {
            if (id === 'my_career_player' || id === myP.name) {
                return {
                    id: 'my_career_player',
                    name: myP.name,
                    koreanName: myP.name,
                    ovr: myP.ovr,
                    pos: myP.pos,
                    num: 10,
                    isPlayerCharacter: true,
                    stats: myP.stats
                };
            }
            const p = PLAYER_MAP[id] || { name: '선수', koreanName: '선수', ovr: 75, pos: 'MF' };
            return {
                id: p.id,
                name: p.koreanName || p.name,
                koreanName: p.koreanName || p.name,
                ovr: p.ovr,
                pos: p.pos,
                num: idx + 1,
                isPlayerCharacter: !!p.isPlayerCharacter,
                stats: p.stats
            };
        });

        // Guarantee ★ ME is on the pitch during live matches so user can always control & watch them!
        if (!homeStarters.some(p => p.isPlayerCharacter)) {
            homeStarters[homeStarters.length - 1] = {
                id: 'my_career_player',
                name: myP.name,
                koreanName: myP.name,
                ovr: myP.ovr,
                pos: myP.pos,
                num: 10,
                isPlayerCharacter: true,
                stats: myP.stats
            };
        }

        const awayStarters = (opp.starters || []).slice(0, 11).map((id, idx) => {
            const p = PLAYER_MAP[id] || { name: '상대선수', koreanName: '상대선수', ovr: 75, pos: 'MF' };
            return {
                id: p.id,
                name: p.koreanName || p.name,
                koreanName: p.koreanName || p.name,
                ovr: p.ovr,
                pos: p.pos,
                num: idx + 1,
                stats: p.stats
            };
        });

        const homeTeam = {
            name: this.myClub.name,
            color1: this.myClub.color1 || '#0284c7',
            color2: this.myClub.color2 || '#ffffff',
            formation: this.myClub.formation || '4-3-3',
            startingXI: homeStarters
        };

        const awayTeam = {
            name: opp.name,
            color1: opp.color1 || '#ef4444',
            color2: opp.color2 || '#ffffff',
            formation: opp.formation || '4-3-3',
            startingXI: awayStarters
        };

        if (this.pitchCanvas) {
            this.pitchCanvas.resize();
            this.pitchCanvas.syncTeamFormation(homeTeam, awayTeam);
        }

        this.matchEngine = new MatchEngine(homeTeam, awayTeam, {
            speed: 1,
            pitchCanvas: this.pitchCanvas,
            onMinute: (min, hScore, aScore) => {
                document.getElementById('liveScoreText').textContent = `${hScore} - ${aScore}`;
                document.getElementById('liveClockText').textContent = `${min}' (${min <= 45 ? '전반' : '후반'})`;
            },
            onEvent: (ev) => {
                const item = document.createElement('div');
                item.className = `comm-item comm-type-${ev.type.toLowerCase()}`;
                item.innerHTML = `<span class="comm-minute">${ev.minute}'</span> <span class="comm-text">${ev.text}</span>`;
                const feed = document.getElementById('liveCommentaryFeed');
                if (feed) {
                    feed.appendChild(item);
                    feed.scrollTop = feed.scrollHeight;
                }
            },
            onComplete: (summary) => {
                this.handleCareerMatchCompletion(summary);
            }
        });

        this.matchEngine.start();
    }

    handleCareerMatchCompletion(summary) {
        const reportCard = document.getElementById('careerMatchReportCard');
        if (reportCard) {
            reportCard.style.display = 'block';
            if (reportCard.scrollIntoView) reportCard.scrollIntoView({ behavior: 'smooth' });
        }

        document.getElementById('reportHomeName').textContent = summary.homeTeam.name;
        document.getElementById('reportAwayName').textContent = summary.awayTeam.name;
        document.getElementById('reportScoreText').textContent = `${summary.homeScore} - ${summary.awayScore}`;

        const mom = summary.mom;
        const momCard = document.getElementById('reportMomCard');
        if (mom && momCard) {
            momCard.innerHTML = `
                <div style="font-size:0.8rem; font-weight:800; color:#f59e0b; margin-bottom:4px;">🎖️ MAN OF THE MATCH (경기 최우수 선수)</div>
                <div style="font-size:1.3rem; font-weight:900; color:#ffffff;">${mom.koreanName || mom.name}</div>
                <div style="font-size:0.85rem; color:#38bdf8; margin-top:2px;">경기 평점: ${mom.finalRating || 8.5}점</div>
            `;
        }

        const scorersList = document.getElementById('reportScorersList');
        if (scorersList) {
            scorersList.innerHTML = summary.scorers.length ? summary.scorers.map(s => `
                <div style="font-size:0.85rem; padding:4px 0; border-bottom:1px solid rgba(51,65,85,0.3);">
                    ⚽ <b>${s.scorerName}</b> (${s.teamName}) - ${s.minute}'
                </div>
            `).join('') : '<div style="color:#64748b; font-size:0.85rem;">득점 없음</div>';
        }

        const res = this.career.advanceRound();

        const myP = this.career.playerProfile;
        const userGoalsInMatch = summary.scorers.filter(s => s.scorerName && s.scorerName.includes(myP.name)).length;
        if (userGoalsInMatch > 0) {
            myP.careerStats.goals += userGoalsInMatch;
            myP.seasonStats.goals += userGoalsInMatch;
        }

        const feed = document.getElementById('careerMatchLogFeed');
        if (feed) {
            const item = document.createElement('div');
            item.style.padding = '10px 12px';
            item.style.background = 'rgba(30, 41, 59, 0.6)';
            item.style.borderLeft = summary.homeScore > summary.awayScore ? '4px solid #10b981' : '4px solid #f59e0b';
            item.style.borderRadius = '6px';
            item.style.fontSize = '0.85rem';
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="font-weight:800; color:#ffffff;">[${this.career.currentSeason} ${this.career.currentRound}R] ${summary.homeTeam.name} ${summary.homeScore} : ${summary.awayScore} ${summary.awayTeam.name}</span>
                    <span style="color:#f59e0b; font-weight:800;">MOM: ${mom ? (mom.koreanName || mom.name) : '선수'}</span>
                </div>
                <div style="color:#cbd5e1;">2D 실시간 매치 종료. 경기 결과 및 활약도가 리그 순위표와 커리어 스탯에 반영되었습니다.</div>
            `;
            feed.insertBefore(item, feed.firstChild);
        }

        this.currentOpponent = this.pickNextRoundOpponent();
        this.renderPlayerCareer();
        this.renderLeagueStandings(this.selectedLeagueId);

        if (res && res.storyEvent) {
            setTimeout(() => this.openStoryModal(res.storyEvent), 400);
        } else if (res && res.isSeasonEnd) {
            setTimeout(() => this.handleSeasonEndNotification(res), 400);
        }
    }

    trainCareerPlayer() {
        const focus = document.getElementById('careerTrainSelect').value;
        const res = this.career.trainPlayer(focus);
        if (typeof sounds !== 'undefined') sounds.playWhistle('short');
        if (typeof alert !== 'undefined') alert(res.message);
        this.renderPlayerCareer();
        this.renderCareerSquad();
        this.renderStandaloneTactics();
    }

    simulateCareerSeason() {
        let endRes = null;
        while (this.career.currentRound <= this.career.totalRounds) {
            const res = this.career.advanceRound();
            if (res && res.isSeasonEnd) {
                endRes = res;
                break;
            }
        }
        if (!endRes) {
            endRes = this.career.endSeasonTransition();
        }
        this.myClub = this.loadClub(this.activeClubId);
        this.handleSeasonEndNotification(endRes);
    }

    handleSeasonEndNotification(endRes) {
        if (typeof sounds !== 'undefined') sounds.playWhistle('triple');
        this.renderPlayerCareer();
        this.renderCareerSquad();
        this.renderStandaloneTactics();
        this.renderHallOfFame();
        this.renderLeagueStandings(this.selectedLeagueId);
        this.renderScoutingList();

        const newsFeed = document.getElementById('careerNewsFeed');
        if (newsFeed) {
            const item = document.createElement('div');
            item.style.padding = '10px';
            item.style.background = 'rgba(245, 158, 11, 0.15)';
            item.style.border = '1px solid #f59e0b';
            item.style.borderRadius = '8px';
            item.style.fontSize = '0.85rem';
            item.innerHTML = `
                <div style="font-weight:800; color:#f59e0b; margin-bottom:4px;">🏆 [시즌 종료 리포트] ${endRes.newSeason} 시즌 개막</div>
                <div style="color:#ffffff;">🥇 올해의 발롱도르 수상자: <b>${endRes.summary.ballonDor}</b></div>
                <div style="font-size:0.78rem; color:#94a3b8; margin-top:4px;">
                    베테랑 은퇴: ${endRes.retirements.length}명 / 신규 생성선수 & 원더키드: 대거 콜업 완료
                </div>
            `;
            newsFeed.insertBefore(item, newsFeed.firstChild);
        }
    }

    openStoryModal(ev) {
        if (typeof sounds !== 'undefined') sounds.playWhistle('short');
        const modal = document.getElementById('storyEventModal');
        if (!modal) return;
        document.getElementById('storyModalCategory').textContent = `[${ev.category}]`;
        document.getElementById('storyModalTitle').textContent = ev.title;
        document.getElementById('storyModalDesc').textContent = ev.desc;

        const choicesWrap = document.getElementById('storyModalChoices');
        choicesWrap.innerHTML = '';

        ev.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'story-choice-btn';
            btn.innerHTML = `
                <div class="choice-text">👉 ${choice.text}</div>
                <div class="choice-effect">${choice.effect}</div>
            `;
            btn.addEventListener('click', () => {
                choice.apply();
                if (typeof sounds !== 'undefined') sounds.playClick();
                modal.style.display = 'none';
                this.renderPlayerCareer();
                this.renderCareerSquad();

                const newsFeed = document.getElementById('careerNewsFeed');
                if (newsFeed) {
                    const item = document.createElement('div');
                    item.style.padding = '8px 10px';
                    item.style.background = 'rgba(30, 41, 59, 0.6)';
                    item.style.borderRadius = '6px';
                    item.style.fontSize = '0.8rem';
                    item.innerHTML = `<b>[${ev.title}]</b> ${choice.effect}`;
                    newsFeed.insertBefore(item, newsFeed.firstChild);
                }
            });
            choicesWrap.appendChild(btn);
        });

        modal.style.display = 'flex';
    }

    // ========================================================================
    // 2. LEAGUE STANDINGS UI
    // ========================================================================
    setupLeagueUI() {
        const btns = document.querySelectorAll('#leagueTabButtons button');
        btns.forEach(b => {
            b.addEventListener('click', () => {
                btns.forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                this.selectedLeagueId = b.dataset.league;
                this.renderLeagueStandings(this.selectedLeagueId);
                if (typeof sounds !== 'undefined') sounds.playClick();
            });
        });
    }

    renderLeagueStandings(leagueId) {
        if (typeof document === 'undefined') return;
        const tbody = document.getElementById('leagueTableBody');
        if (!tbody) return;

        const table = this.career.leagueStandings[leagueId] || [];
        tbody.innerHTML = '';

        table.forEach((row, idx) => {
            const tr = document.createElement('tr');
            const rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : ''));
            tr.innerHTML = `
                <td><span class="rank-badge ${rankClass}">${idx + 1}</span></td>
                <td class="team-cell">
                    <span>${row.emblem || '🛡️'}</span>
                    <span>${row.name}</span>
                </td>
                <td>${row.played}</td>
                <td>${row.won}</td>
                <td>${row.drawn}</td>
                <td>${row.lost}</td>
                <td>${row.gf}</td>
                <td>${row.ga}</td>
                <td style="color:${row.gd > 0 ? '#10b981' : (row.gd < 0 ? '#ef4444' : '#94a3b8')}; font-weight:700;">
                    ${row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td style="font-weight:900; color:#f59e0b; font-size:1rem;">${row.points}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ========================================================================
    // 3. LUXURY ASSET SHOP UI
    // ========================================================================
    setupShopUI() {}

    renderShopCatalog() {
        if (typeof document === 'undefined') return;
        const grid = document.getElementById('shopCatalogGrid');
        if (!grid) return;

        const balanceEl = document.getElementById('shopBankBalanceDisplay');
        if (balanceEl) balanceEl.textContent = this.career.playerProfile.bankBalance.toLocaleString();

        const catalog = this.career.getShopCatalog();
        const p = this.career.playerProfile;

        grid.innerHTML = '';

        catalog.forEach(item => {
            const isOwned = p.ownedAssets.includes(item.id);
            const canAfford = p.bankBalance >= item.cost;

            const card = document.createElement('div');
            card.className = `shop-card ${isOwned ? 'owned' : ''}`;
            card.innerHTML = `
                <div class="shop-icon">${item.icon}</div>
                <div class="shop-title">${item.name}</div>
                <div class="shop-cost">${item.cost.toLocaleString()}만원</div>
                <div class="shop-desc">${item.desc} (명성 +${item.fameBonus})</div>
                <button class="shop-buy-btn ${isOwned || !canAfford ? 'disabled' : ''}" ${isOwned || !canAfford ? 'disabled' : ''}>
                    ${isOwned ? '✅ 보유 중' : (canAfford ? '💳 즉시 구매' : '잔액 부족')}
                </button>
            `;

            const btn = card.querySelector('.shop-buy-btn');
            if (!isOwned && canAfford) {
                btn.addEventListener('click', () => {
                    const res = this.career.buyAsset(item.id);
                    if (res.success) {
                        if (typeof sounds !== 'undefined') sounds.playWhistle('short');
                        if (typeof alert !== 'undefined') alert(res.message);
                        this.renderShopCatalog();
                        this.renderPlayerCareer();
                    }
                });
            }

            grid.appendChild(card);
        });
    }

    // ========================================================================
    // 4. HALL OF FAME & RETIREMENT MEMORIAL
    // ========================================================================
    renderHallOfFame() {
        if (typeof document === 'undefined') return;
        const retireList = document.getElementById('hofRetireesList');
        if (retireList) {
            retireList.innerHTML = '';
            if (this.career.retiredLegends.length === 0) {
                retireList.innerHTML = '<div style="color:#64748b; font-size:0.85rem; padding:20px 0; text-align:center;">시즌이 경과하면 베테랑 선수들의 공식 은퇴 기록이 등재됩니다.</div>';
            } else {
                this.career.retiredLegends.slice(0, 40).forEach(r => {
                    const item = document.createElement('div');
                    item.style.padding = '8px 12px';
                    item.style.background = 'rgba(30, 41, 59, 0.6)';
                    item.style.borderRadius = '8px';
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.style.alignItems = 'center';
                    item.innerHTML = `
                        <div>
                            <span style="font-weight:800; color:#ffffff;">${r.name}</span>
                            <span style="font-size:0.75rem; color:#94a3b8; margin-left:6px;">(${r.finalClub})</span>
                        </div>
                        <div style="font-size:0.8rem; color:#f59e0b;">
                            ${r.age}세 은퇴 (${r.year}년)
                        </div>
                    `;
                    retireList.appendChild(item);
                });
            }
        }

        const bList = document.getElementById('hofBallonDorList');
        if (bList) {
            bList.innerHTML = `
                <div style="padding:10px; background:rgba(30,41,59,0.5); border-radius:8px; margin-bottom:8px;">
                    <div style="font-weight:800; color:#f59e0b;">2024년 발롱도르 수상자</div>
                    <div style="font-size:0.85rem; color:#cbd5e1;">로드리 (맨체스터 시티 / 스페인)</div>
                </div>
            `;
            this.career.seasonHistory.forEach(s => {
                const item = document.createElement('div');
                item.style.padding = '10px';
                item.style.background = 'rgba(30,41,59,0.5)';
                item.style.borderRadius = '8px';
                item.style.marginBottom = '8px';
                item.innerHTML = `
                    <div style="font-weight:800; color:#f59e0b;">${s.season} 시즌 발롱도르</div>
                    <div style="font-size:0.85rem; color:#cbd5e1;">${s.ballonDor}</div>
                `;
                bList.appendChild(item);
            });
        }
    }

    // ========================================================================
    // 5. STANDALONE TACTICS TAB
    // ========================================================================
    setupTacticsUI() {
        const selector = document.getElementById('activeClubSelect');
        if (selector) {
            this.populateClubSelector(selector, true);
            selector.value = this.activeClubId;
            selector.addEventListener('change', (e) => {
                this.switchActiveClub(e.target.value);
            });
        }

        const formSelect = document.getElementById('tacticsFormationSelect');
        if (formSelect) {
            formSelect.value = this.myClub.formation || '4-3-3';
            formSelect.addEventListener('change', (e) => {
                this.myClub.formation = e.target.value;
                const cForm = document.getElementById('careerFormationSelect');
                if (cForm) cForm.value = e.target.value;
                this.saveCurrentClub();
                this.renderStandaloneTactics();
                this.renderCareerSquad();
                if (typeof sounds !== 'undefined') sounds.playClick();
            });
        }

        const autoBtn = document.getElementById('tacticsAutoPickBtn');
        if (autoBtn) {
            autoBtn.addEventListener('click', () => {
                this.autoPickBestXI();
                this.renderStandaloneTactics();
                this.renderCareerSquad();
                if (typeof sounds !== 'undefined') sounds.playWhistle('short');
            });
        }
    }

    autoPickBestXI() {
        const allIds = [...new Set([...this.myClub.starters, ...this.myClub.bench])];
        const allPlayers = allIds.map(id => PLAYER_MAP[id]).filter(Boolean);

        // Keep 1 GK first, then best 10 outfield players
        const gks = allPlayers.filter(p => p.pos === 'GK').sort((a, b) => b.ovr - a.ovr);
        const outfield = allPlayers.filter(p => p.pos !== 'GK').sort((a, b) => b.ovr - a.ovr);

        const bestGK = gks[0] || outfield.shift();
        const remainingPool = [...outfield, ...gks.slice(1)];

        const newStarters = [bestGK, ...remainingPool.slice(0, 10)].filter(Boolean).map(p => p.id);
        const newBench = remainingPool.slice(10).map(p => p.id);

        this.myClub.starters = newStarters;
        this.myClub.bench = newBench;
        this.saveCurrentClub();
    }

    renderStandaloneTactics() {
        if (typeof document === 'undefined') return;
        this.updateSquadAnalytics();

        const container = document.getElementById('tacticsPitchSlots');
        if (!container) return;
        container.innerHTML = '';

        const formation = this.myClub.formation || '4-3-3';
        const coords = this.getFormationCoordinates(formation);
        const myP = this.career.playerProfile;

        this.myClub.starters.slice(0, 11).forEach((pId, idx) => {
            const player = PLAYER_MAP[pId] || { name: '선수', koreanName: '선수', ovr: 75, pos: 'MF' };
            const coord = coords[idx] || { x: 50, y: 50 };
            const isMe = (pId === 'my_career_player' || player.isPlayerCharacter);
            const displayOvr = isMe ? myP.ovr : player.ovr;

            const node = document.createElement('div');
            node.className = `player-pitch-node ${this.swapSlotA === idx ? 'selected-swap' : ''}`;
            node.style.left = `${coord.x}%`;
            node.style.top = `${coord.y}%`;

            const ovrClass = displayOvr >= 85 ? 'ovr-world-class' : (displayOvr >= 78 ? 'ovr-elite' : 'ovr-regular');

            node.innerHTML = `
                <div class="node-token" style="background:${isMe ? '#f59e0b' : (this.myClub.color1 || '#0284c7')}; border-color:${this.myClub.color2 || '#ffffff'};">
                    ${isMe ? '★' : (player.pos || 'MF')}
                </div>
                <div class="node-name">${isMe ? `★ ${myP.name}` : (player.koreanName || player.name)}</div>
                <div class="node-ovr-tag ${ovrClass}">${displayOvr}</div>
            `;
            node.addEventListener('click', () => this.handleCareerSquadClick(idx));
            container.appendChild(node);
        });

        const benchContainer = document.getElementById('tacticsBenchSlots');
        if (benchContainer) {
            benchContainer.innerHTML = '';
            this.myClub.bench.forEach((pId, idx) => {
                const player = PLAYER_MAP[pId] || { name: '후보', koreanName: '후보', ovr: 70, pos: 'SUB' };
                const isMe = (pId === 'my_career_player' || player.isPlayerCharacter);
                const displayOvr = isMe ? myP.ovr : player.ovr;
                const isSelected = this.swapSlotA === (idx + 100);

                const card = document.createElement('div');
                card.className = `bench-item-card ${isSelected ? 'selected-swap' : ''}`;
                card.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:800; font-size:0.75rem; color:#94a3b8; width:28px;">${isMe ? '★' : player.pos}</span>
                        <span style="font-weight:800; font-size:0.85rem; color:#ffffff;">${isMe ? `★ ${myP.name}` : (player.koreanName || player.name)}</span>
                    </div>
                    <span class="node-ovr-tag ${displayOvr >= 85 ? 'ovr-world-class' : 'ovr-elite'}">${displayOvr}</span>
                `;
                card.addEventListener('click', () => this.handleCareerSquadClick(idx + 100));
                benchContainer.appendChild(card);
            });
        }
    }

    getFormationCoordinates(formation) {
        if (formation === '4-2-3-1') {
            return [
                { x: 50, y: 88 },
                { x: 15, y: 72 }, { x: 38, y: 74 }, { x: 62, y: 74 }, { x: 85, y: 72 },
                { x: 35, y: 56 }, { x: 65, y: 56 },
                { x: 18, y: 38 }, { x: 50, y: 36 }, { x: 82, y: 38 },
                { x: 50, y: 18 }
            ];
        } else if (formation === '4-4-2') {
            return [
                { x: 50, y: 88 },
                { x: 15, y: 72 }, { x: 38, y: 74 }, { x: 62, y: 74 }, { x: 85, y: 72 },
                { x: 15, y: 48 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 85, y: 48 },
                { x: 38, y: 20 }, { x: 62, y: 20 }
            ];
        } else if (formation === '3-5-2') {
            return [
                { x: 50, y: 88 },
                { x: 25, y: 74 }, { x: 50, y: 76 }, { x: 75, y: 74 },
                { x: 12, y: 50 }, { x: 35, y: 54 }, { x: 50, y: 46 }, { x: 65, y: 54 }, { x: 88, y: 50 },
                { x: 38, y: 20 }, { x: 62, y: 20 }
            ];
        }
        return [
            { x: 50, y: 88 },
            { x: 15, y: 72 }, { x: 38, y: 74 }, { x: 62, y: 74 }, { x: 85, y: 72 },
            { x: 28, y: 52 }, { x: 50, y: 54 }, { x: 72, y: 52 },
            { x: 18, y: 25 }, { x: 50, y: 18 }, { x: 82, y: 25 }
        ];
    }

    // ========================================================================
    // 6. SCOUTING, NEWGEN FILTER & 1-CLICK SQUAD RECRUITMENT
    // ========================================================================
    setupScoutingUI() {
        const searchInput = document.getElementById('scoutSearchInput');
        const leagueFilter = document.getElementById('scoutLeagueFilter');
        const posFilter = document.getElementById('scoutPosFilter');
        const typeFilter = document.getElementById('scoutTypeFilter');

        const trigger = () => this.renderScoutingList();
        if (searchInput) searchInput.addEventListener('input', trigger);
        if (leagueFilter) leagueFilter.addEventListener('change', trigger);
        if (posFilter) posFilter.addEventListener('change', trigger);
        if (typeFilter) typeFilter.addEventListener('change', trigger);

        const modalSignBtn = document.getElementById('modalSignPlayerBtn');
        if (modalSignBtn) {
            modalSignBtn.addEventListener('click', () => {
                if (!this.currentDetailPlayerId) return;
                const res = this.signPlayerToMySquad(this.currentDetailPlayerId);
                if (typeof alert !== 'undefined' && res.message) alert(res.message);
                this.closePlayerDetailModal();
                this.renderScoutingList();
            });
        }
    }

    renderScoutingList() {
        if (typeof document === 'undefined') return;
        const grid = document.getElementById('scoutingPlayerGrid');
        if (!grid) return;

        const query = (document.getElementById('scoutSearchInput')?.value || '').trim().toLowerCase();
        const league = document.getElementById('scoutLeagueFilter')?.value || 'all';
        const pos = document.getElementById('scoutPosFilter')?.value || 'all';
        const pType = document.getElementById('scoutTypeFilter')?.value || 'all';

        let list = PLAYERS.filter(p => league === 'legends' ? p.league === 'legends' : !p.retired);

        if (league !== 'all') {
            list = list.filter(p => p.league === league);
        }

        if (pos !== 'all') {
            if (pos === 'FW') list = list.filter(p => ['ST', 'LW', 'RW', 'CF'].includes(p.pos));
            else if (pos === 'MF') list = list.filter(p => ['CAM', 'CM', 'CDM', 'RM', 'LM'].includes(p.pos));
            else if (pos === 'DF') list = list.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.pos));
            else if (pos === 'GK') list = list.filter(p => p.pos === 'GK');
        }

        if (pType === 'newgen') {
            list = list.filter(p => p.isNewgen);
        } else if (pType === 'wonderkid') {
            list = list.filter(p => p.isWonderkid || (p.age <= 21 && (p.pot >= 85 || p.pa >= 170)));
        }

        if (query) {
            list = list.filter(p =>
                (p.koreanName && p.koreanName.toLowerCase().includes(query)) ||
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.team && p.team.toLowerCase().includes(query))
            );
        }

        list.sort((a, b) => b.ovr - a.ovr);

        const countEl = document.getElementById('scoutResultCount');
        if (countEl) countEl.textContent = `검색 결과: 총 ${list.length}명 등록됨`;

        grid.innerHTML = '';
        list.slice(0, 72).forEach(p => {
            const inMySquad = this.myClub.starters.includes(p.id) || this.myClub.bench.includes(p.id);
            const card = document.createElement('div');
            card.className = 'scout-card';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="font-weight:900; font-size:1.05rem; color:#ffffff;">
                            ${p.koreanName || p.name}
                        </div>
                        <div style="font-size:0.75rem; color:#94a3b8;">${p.name} • ${p.flag} ${p.nation}</div>
                    </div>
                    <div class="node-ovr-tag ${p.ovr >= 85 ? 'ovr-world-class' : (p.ovr >= 78 ? 'ovr-elite' : 'ovr-regular')}">
                        ${p.ovr}
                    </div>
                </div>

                <div style="margin:10px 0; font-size:0.82rem; color:#cbd5e1; display:flex; justify-content:space-between;">
                    <span>소속: <b>${p.team || p.club}</b></span>
                    <span style="color:#38bdf8; font-weight:800;">${p.pos} (${p.age}세)</span>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; border-top:1px solid rgba(51,65,85,0.4); padding-top:8px; gap:6px;">
                    <button class="action-btn-secondary scout-detail-btn" style="padding:5px 10px; font-size:0.74rem;">
                        📊 FM 상세 스탯
                    </button>
                    <button class="sign-squad-btn" style="${inMySquad ? 'background:#334155; border-color:#475569; color:#94a3b8;' : ''}">
                        ${inMySquad ? '✅ 내 스쿼드 소속' : '➕ 내 스쿼드에 영입'}
                    </button>
                </div>
            `;

            card.querySelector('.scout-detail-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openPlayerDetailModal(p.id);
            });

            card.querySelector('.sign-squad-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (inMySquad) return;
                const res = this.signPlayerToMySquad(p.id);
                if (typeof alert !== 'undefined' && res.message) alert(res.message);
                this.renderScoutingList();
            });

            card.addEventListener('click', () => this.openPlayerDetailModal(p.id));
            grid.appendChild(card);
        });
    }

    openPlayerDetailModal(playerId) {
        const p = PLAYER_MAP[playerId];
        if (!p) return;
        this.currentDetailPlayerId = playerId;

        document.getElementById('modalPlayerName').textContent = `${p.koreanName || p.name} (${p.name})`;
        document.getElementById('modalPlayerMeta').textContent = `${p.flag} ${p.nation} • ${p.team || p.club} • ${p.pos} • ${p.age}세 • OVR ${p.ovr} (POT ${p.pot || p.ovr})`;

        const renderStatGroup = (containerId, statsList) => {
            const el = document.getElementById(containerId);
            if (!el) return;
            el.innerHTML = statsList.map(([key, label]) => {
                const val = (p.stats && p.stats[key]) || 10;
                const color = val >= 16 ? '#10b981' : (val >= 12 ? '#38bdf8' : '#94a3b8');
                return `
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; padding:3px 0; border-bottom:1px solid rgba(51,65,85,0.2);">
                        <span style="color:#cbd5e1;">${label}</span>
                        <span style="font-weight:900; color:${color}; font-family:var(--font-mono);">${val}</span>
                    </div>
                `;
            }).join('');
        };

        renderStatGroup('modalTechStats', [
            ['finishing', '골 결정력'], ['passing', '패스'], ['dribbling', '드리블'],
            ['firstTouch', '첫 터치'], ['technique', '개인기'], ['longShots', '중거리슛']
        ]);

        renderStatGroup('modalMentalStats', [
            ['vision', '시야'], ['decisions', '판단력'], ['positioning', '위치선정'],
            ['anticipation', '예측력'], ['composure', '침착성'], ['teamwork', '팀워크']
        ]);

        renderStatGroup('modalPhysicalStats', [
            ['pace', '순간속도'], ['acceleration', '가속도'], ['stamina', '스태미너'],
            ['strength', '몸싸움'], ['jumping', '점프력'], ['reflexes', '반사신경(GK)']
        ]);

        const traitsBox = document.getElementById('modalTraitsBox');
        if (traitsBox) {
            traitsBox.innerHTML = (p.traits && p.traits.length ? p.traits : ['밸런스형 플레이어']).map(t => `
                <span style="background:rgba(2,132,199,0.2); color:#38bdf8; border:1px solid #0284c7; padding:2px 8px; border-radius:6px; font-size:0.75rem; font-weight:700; margin-right:6px; display:inline-block; margin-bottom:4px;">
                    ${t}
                </span>
            `).join('');
        }

        document.getElementById('playerDetailModal').style.display = 'flex';
        if (typeof sounds !== 'undefined') sounds.playClick();
    }

    closePlayerDetailModal() {
        document.getElementById('playerDetailModal').style.display = 'none';
    }
};

if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('DOMContentLoaded', () => {
        window.app = new window.App();
        window.app.init();
    });
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App };
}
