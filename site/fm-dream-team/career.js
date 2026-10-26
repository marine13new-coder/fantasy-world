// ============================================================================
// Kickru-Grade Football Career & Living World Simulation Engine (career.js)
// 1. Time Progression & Dynamic League Calendar (2024 -> 2025 -> 2026 ...)
// 2. Realistic Player Aging & Physical Decline Curves
// 3. Veteran Retirement & Hall of Fame Ceremonies (Headlines & Legends log)
// 4. Procedural Regens & Wonderkid Newgen Factory (Localized Names & Traits)
// 5. Kickru-style "From Bench to Ballon d'Or" Player Career & Story Events
// 6. Luxury Lifestyle & Assets Shop (Supercars, Mansions, Private Jets)
// 7. Full Manager Mode League Standings (EPL, K-League, J1, MLS, La Liga, etc.)
// ============================================================================

class CareerEngine {
    constructor() {
        this.currentYear = 2024;
        this.currentSeason = "2024/25";
        this.currentRound = 1;
        this.totalRounds = 38;
        
        // Mode: 'player' (Kickru 'Bench to Ballon d'Or') or 'manager' (Club Director)
        this.mode = 'player';

        // Player Career Profile (Kickru style)
        this.playerProfile = this.createDefaultPlayerProfile();

        // Living World State
        this.leagueStandings = {};
        this.retiredLegends = [];
        this.newsFeed = [];
        this.seasonHistory = [];

        // Initialize living league tables
        this.initLeagueTables();
    }

    // Default Player Profile: 17yo Korean Wonderkid Prospect
    createDefaultPlayerProfile() {
        return {
            name: "이유찬",
            englishName: "Lee Yu-chan",
            nation: "대한민국",
            flag: "🇰🇷",
            age: 17,
            birthYear: 2007,
            pos: "ST",
            style: "컴플리트 포워드 (Complete Forward)",
            clubId: "ulsan",
            clubName: "울산 HD FC",
            ovr: 64,
            ca: 130,
            pa: 188, // Wonderkid ceiling!
            stats: {
                finishing: 13,
                passing: 10,
                dribbling: 12,
                firstTouch: 11,
                technique: 12,
                pace: 14,
                acceleration: 14,
                stamina: 12,
                strength: 10,
                vision: 11,
                composure: 11,
                decisions: 10
            },
            // Career Life Metrics (Kickru style)
            managerTrust: 45, // 0~100 (needs 70+ for starter, 40+ for bench)
            fanPopularity: 30, // 0~100
            teamMorale: 80,   // 0~100
            weeklyWage: 25,   // in 10,000 KRW or thousands GBP (25만원/주)
            bankBalance: 120, // Accumulated wealth
            fameLevel: "유망주 벤치워머",
            militaryExempt: false, // Military service status (Korean drama)
            hasServedMilitary: false,
            
            // Career Milestones & Records
            careerStats: {
                appearances: 0,
                goals: 0,
                assists: 0,
                trophies: 0,
                ballonDor: 0,
                motm: 0,
                intlCaps: 0,
                intlGoals: 0
            },
            seasonStats: {
                appearances: 0,
                goals: 0,
                assists: 0,
                avgRating: 6.5
            },
            
            // Personal Assets owned (Kickru Luxury Shop)
            ownedAssets: [],

            // Match status for current round
            matchStatus: "BENCH", // 'STARTER', 'SUB_IN', 'BENCH', 'RESERVE', 'INJURED'
            injuryWeeks: 0
        };
    }

    // Setup standings for every active league
    initLeagueTables() {
        const leagues = ["epl", "laliga", "bundesliga", "seriea", "kleague", "jleague", "mls"];
        leagues.forEach(lId => {
            const leagueClubs = CLUBS.filter(c => c.league === lId);
            this.leagueStandings[lId] = leagueClubs.map(c => ({
                clubId: c.id,
                name: c.name,
                emblem: c.emblem,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                points: 0
            }));
        });
    }

    // Advance 1 Round (Weekly Calendar Tick)
    advanceRound(onEventTriggered = null) {
        if (this.currentRound >= this.totalRounds) {
            return this.endSeasonTransition();
        }

        this.currentRound++;

        // 1. Simulate League Round for all leagues
        this.simulateLeagueRound();

        // 2. If in Player Career, resolve training & match performance
        let matchResult = null;
        if (this.mode === 'player') {
            matchResult = this.simulatePlayerMatchDay();
        }

        // 3. Trigger Kickru Random Story Event (approx 35% chance per round)
        let storyEvent = null;
        if (Math.random() < 0.38) {
            storyEvent = this.generateRandomStoryEvent();
        }

        return {
            round: this.currentRound,
            year: this.currentYear,
            season: this.currentSeason,
            matchResult: matchResult,
            storyEvent: storyEvent
        };
    }

    // Simulate matchday for all active leagues
    simulateLeagueRound() {
        for (const lId in this.leagueStandings) {
            const table = this.leagueStandings[lId];
            if (table.length < 2) continue;

            // Pair up clubs randomly for this round
            const shuffled = [...table].sort(() => Math.random() - 0.5);
            for (let i = 0; i < shuffled.length - 1; i += 2) {
                const home = shuffled[i];
                const away = shuffled[i + 1];

                const homeClub = CLUB_MAP[home.clubId] || { reputation: 80 };
                const awayClub = CLUB_MAP[away.clubId] || { reputation: 80 };

                // Goals biased by club reputation + home advantage
                const homeRep = (homeClub.reputation || 80) + 4;
                const awayRep = (awayClub.reputation || 80);

                let homeGoals = Math.floor(Math.random() * (homeRep > awayRep ? 4 : 3));
                let awayGoals = Math.floor(Math.random() * (awayRep > homeRep ? 4 : 3));
                if (Math.random() < 0.2) homeGoals++;

                // Update Home
                home.played++;
                home.gf += homeGoals;
                home.ga += awayGoals;
                home.gd = home.gf - home.ga;

                // Update Away
                away.played++;
                away.gf += awayGoals;
                away.ga += homeGoals;
                away.gd = away.gf - away.ga;

                if (homeGoals > awayGoals) {
                    home.won++;
                    home.points += 3;
                    away.lost++;
                } else if (homeGoals < awayGoals) {
                    away.won++;
                    away.points += 3;
                    home.lost++;
                } else {
                    home.drawn++;
                    home.points += 1;
                    away.drawn++;
                    away.points += 1;
                }
            }

            // Re-sort league table: Points -> GD -> GF
            table.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
        }
    }

    // Simulate player's match participation and personal performance
    simulatePlayerMatchDay() {
        const p = this.playerProfile;

        // Check injury
        if (p.injuryWeeks > 0) {
            p.injuryWeeks--;
            return {
                status: "부상 결장",
                desc: `부상 재활 중 (${p.injuryWeeks}주 남음)`
            };
        }

        // Determine Match Role based on Manager Trust and OVR
        let role = "BENCH";
        if (p.managerTrust >= 65 && p.ovr >= 70) {
            role = "STARTER";
        } else if (p.managerTrust >= 40) {
            role = Math.random() < 0.6 ? "SUB_IN" : "BENCH";
        } else {
            role = Math.random() < 0.3 ? "SUB_IN" : "RESERVE";
        }

        p.matchStatus = role;

        // Base wage deposit
        p.bankBalance += p.weeklyWage;

        if (role === "RESERVE") {
            return {
                status: "명단 제외",
                desc: "이번 라운드 경기 명단에서 제외되어 관중석에서 경기를 지켜보았습니다."
            };
        }

        if (role === "BENCH") {
            return {
                status: "벤치 대기",
                desc: "후보 선수 명단에 이름을 올렸으나 교체 투입 기회를 잡지 못했습니다."
            };
        }

        // Played in Match! (Starter or Sub)
        const mins = role === "STARTER" ? Math.floor(Math.random() * 20 + 70) : Math.floor(Math.random() * 25 + 15);
        p.careerStats.appearances++;
        p.seasonStats.appearances++;

        // Calculate goals & assists chance based on OVR, Position, and minutes
        const finishingRate = (p.stats.finishing + (p.stats.dribbling / 2)) / 30;
        let goals = 0;
        let assists = 0;

        if (p.pos === "ST" || p.pos === "LW" || p.pos === "RW") {
            if (Math.random() < finishingRate * (mins / 90) * 0.75) goals++;
            if (Math.random() < 0.15 && goals === 1) goals++; // Brace
            if (Math.random() < 0.35 * (mins / 90)) assists++;
        } else if (p.pos === "CAM" || p.pos === "CM") {
            if (Math.random() < 0.4 * (mins / 90)) assists++;
            if (Math.random() < 0.3 * (mins / 90)) goals++;
        } else { // DF or GK
            if (Math.random() < 0.08) goals++;
        }

        p.careerStats.goals += goals;
        p.careerStats.assists += assists;
        p.seasonStats.goals += goals;
        p.seasonStats.assists += assists;

        // Match rating
        let rating = 6.2 + (goals * 1.3) + (assists * 0.7) + (Math.random() * 0.8 - 0.4);
        rating = Math.min(10.0, Math.max(5.5, parseFloat(rating.toFixed(1))));

        if (rating >= 8.5) {
            p.careerStats.motm++;
            p.managerTrust = Math.min(100, p.managerTrust + 4);
            p.fanPopularity = Math.min(100, p.fanPopularity + 5);
        } else if (rating >= 7.0) {
            p.managerTrust = Math.min(100, p.managerTrust + 2);
            p.fanPopularity = Math.min(100, p.fanPopularity + 2);
        } else {
            p.managerTrust = Math.max(10, p.managerTrust - 1);
        }

        // Growth from match experience
        this.applyMatchGrowth(p, mins, rating);

        return {
            status: role === "STARTER" ? `선발 출전 (${mins}분)` : `교체 출전 (${mins}분)`,
            mins: mins,
            goals: goals,
            assists: assists,
            rating: rating,
            motm: rating >= 8.5,
            desc: goals > 0 
                ? `⚽ ${goals}골${assists > 0 ? ` ${assists}도움` : ''} 폭발! 평점 ${rating}점으로 팀의 영웅이 되었습니다!` 
                : (assists > 0 ? `🎯 절묘한 어시스트 기록! 평점 ${rating}점 활약.` : `평점 ${rating}점을 기록하며 성실하게 경기를 소화했습니다.`)
        };
    }

    // Apply attribute growth from match experience
    applyMatchGrowth(p, mins, rating) {
        if (p.age > 30) return; // Veteran decline phase handled separately

        const growthFactor = (p.pa - p.ca) / 100 * (mins / 90) * (rating / 7);
        if (growthFactor > 0.1 && Math.random() < 0.4) {
            const statKeys = Object.keys(p.stats);
            const picked = statKeys[Math.floor(Math.random() * statKeys.length)];
            if (p.stats[picked] < 20) {
                p.stats[picked] = Math.min(20, p.stats[picked] + 1);
                p.ca = Math.min(p.pa, p.ca + 1);
                // Recalculate OVR
                p.ovr = Math.min(99, Math.floor(p.ca / 2.05));
            }
        }
    }

    // Training Routine (User picks training focus)
    trainPlayer(focusType) {
        const p = this.playerProfile;
        let msg = "";

        if (focusType === "finishing") {
            p.stats.finishing = Math.min(20, p.stats.finishing + 1);
            msg = "🎯 골 결정력 특훈 완료! 슈팅 감각이 대폭 날카로워졌습니다.";
        } else if (focusType === "playmaking") {
            p.stats.passing = Math.min(20, p.stats.passing + 1);
            p.stats.vision = Math.min(20, p.stats.vision + 1);
            msg = "🧠 패스 및 시야 훈련 완료! 빌드업 조율 능력이 향상되었습니다.";
        } else if (focusType === "dribble") {
            p.stats.dribbling = Math.min(20, p.stats.dribbling + 1);
            p.stats.technique = Math.min(20, p.stats.technique + 1);
            msg = "⚡ 탈압박 및 개인기 훈련 완료! 볼 컨트롤이 정교해졌습니다.";
        } else if (focusType === "physical") {
            p.stats.pace = Math.min(20, p.stats.pace + 1);
            p.stats.stamina = Math.min(20, p.stats.stamina + 1);
            p.stats.strength = Math.min(20, p.stats.strength + 1);
            msg = "🏋️ 피지컬 벌크업 훈련 완료! 스프린트와 몸싸움이 강화되었습니다.";
        }

        p.ca = Math.min(p.pa, p.ca + 1);
        p.ovr = Math.min(99, Math.floor(p.ca / 2.05));
        p.managerTrust = Math.min(100, p.managerTrust + 3);

        return { success: true, message: msg, newOvr: p.ovr };
    }

    // ========================================================================
    // KICKRU-STYLE STORY EVENTS & DIALOGUES
    // ========================================================================
    generateRandomStoryEvent() {
        const p = this.playerProfile;
        const events = [
            {
                id: "locker_senior",
                title: "락커룸 선배의 텃세",
                category: "락커룸",
                desc: "훈련 종료 후 베테랑 고참 선수가 다가와 당신의 거만한 플레이 스타일을 지적하며 기강을 잡으려 합니다.",
                choices: [
                    {
                        text: "공손히 고개를 숙이며 선배의 조언에 감사하다고 답한다.",
                        effect: "팀 케미스트리 상승 (+10), 자신감 소폭 감소 (-2)",
                        apply: () => { p.teamMorale = Math.min(100, p.teamMorale + 10); }
                    },
                    {
                        text: "내일 1대1 미니게임 연습에서 실력으로 눌러주겠다고 당돌하게 맞받아친다.",
                        effect: "자신감 및 멘탈 폭발 (+3), 선배와의 관계 냉각",
                        apply: () => { p.stats.composure = Math.min(20, p.stats.composure + 1); p.teamMorale = Math.max(30, p.teamMorale - 5); }
                    },
                    {
                        text: "묵묵히 라커룸을 청소하며 행동으로 팀에 헌신한다.",
                        effect: "감독 신뢰도 상승 (+5), 프로 의식 향상",
                        apply: () => { p.managerTrust = Math.min(100, p.managerTrust + 5); }
                    }
                ]
            },
            {
                id: "manager_interview",
                title: "감독실 호출: 후반전 특급 조커 지시",
                category: "감독 면담",
                desc: "감독이 당신을 감독실로 불러 전술판을 보여주며 묻습니다. '이번 경기 후반 20분 승부처에 너를 투입하려 한다. 준비되었나?'",
                choices: [
                    {
                        text: "'팀을 위해 벤치에서 모든 에너지를 쏟아붓겠습니다!'",
                        effect: "감독 신뢰도 대폭 상승 (+10), 선발 출전 기회 증가",
                        apply: () => { p.managerTrust = Math.min(100, p.managerTrust + 10); }
                    },
                    {
                        text: "'조커가 아니라 선발 공격수로 뛰어 승리를 가져오고 싶습니다.'",
                        effect: "당돌한 야망! 팬 인기 상승 (+5), 감독의 호기심 자극",
                        apply: () => { p.fanPopularity = Math.min(100, p.fanPopularity + 5); }
                    },
                    {
                        text: "'상대 수비수의 뒷공간을 집중 분석하고 있었습니다. 결승골로 보답하겠습니다.'",
                        effect: "오프더볼 및 시야 상승 (+1), 골 결정력 집중",
                        apply: () => { p.stats.vision = Math.min(20, p.stats.vision + 1); }
                    }
                ]
            },
            {
                id: "media_spotlight",
                title: "경기 후 언론사 단독 인터뷰",
                category: "미디어",
                desc: "당신의 최근 활약에 매료된 유력 축구 기자가 마이크를 들이댑니다. '차세대 국대 에이스라는 평가에 대해 어떻게 생각하십니까?'",
                choices: [
                    {
                        text: "'아직 배울 점이 많은 막내입니다. 손흥민 선배님의 발끝을 따라가고 싶을 뿐입니다.'",
                        effect: "겸손한 태도로 전국적인 팬덤 호감도 급상승 (+10)",
                        apply: () => { p.fanPopularity = Math.min(100, p.fanPopularity + 10); }
                    },
                    {
                        text: "'제 시대가 올 것입니다. 다음 경기에서 제가 왜 특별한지 직접 증명하겠습니다.'",
                        effect: "슈퍼스타 기질! 유명세 폭발 (+15), 실점 시 비판 위험",
                        apply: () => { p.fanPopularity = Math.min(100, p.fanPopularity + 15); p.fameLevel = "언론의 총아"; }
                    },
                    {
                        text: "'팀의 승점 3점이 가장 중요합니다. 개인 기록에는 관심 없습니다.'",
                        effect: "라커룸 지지도 상승 (+8), 프로페셔널 칭호 획득",
                        apply: () => { p.teamMorale = Math.min(100, p.teamMorale + 8); }
                    }
                ]
            },
            {
                id: "big_club_scout",
                title: "유럽 빅클럽 스카우트의 비밀 접촉",
                category: "이적 루머",
                desc: "경기장에 프리미어리그 빅클럽의 수석 스카우트가 방문하여 당신의 에이전트에게 은밀히 거액의 제안서를 건넸습니다.",
                choices: [
                    {
                        text: "꿈의 무대 유럽 진출을 위해 당장 협상 테이블을 차리라고 지시한다.",
                        effect: "이적 협상 시작! 주급 3배 인상 오퍼 타진",
                        apply: () => { p.weeklyWage = Math.floor(p.weeklyWage * 2.5); p.fameLevel = "유럽 레이더망 포착"; }
                    },
                    {
                        text: "아직은 소속팀에서 확실한 주전으로 성장한 뒤 이적하겠다고 정중히 고사한다.",
                        effect: "소속 구단 보드진 및 팬들의 열광적 지지 (+15)",
                        apply: () => { p.managerTrust = Math.min(100, p.managerTrust + 12); p.fanPopularity = Math.min(100, p.fanPopularity + 10); }
                    },
                    {
                        text: "계약서에 막대한 바이아웃 조항과 출전 시간 보장 옵션을 요구한다.",
                        effect: "영리한 계약 전략, 몸값 및 명성 상승",
                        apply: () => { p.weeklyWage = Math.floor(p.weeklyWage * 1.8); }
                    }
                ]
            },
            {
                id: "korean_military",
                title: "대한민국 병역 이슈: 아시안게임 대표팀 최종 발탁",
                category: "국가대표 / 병역",
                desc: "황선홍호 / 대표팀 명단에 깜짝 발탁되었습니다! 이번 대회에서 금메달을 획득하면 병역 특례(예술체육요원)를 받게 됩니다.",
                choices: [
                    {
                        text: "태극마크를 가슴에 품고 혼신의 힘을 다해 결승전 결승골을 터뜨린다!",
                        effect: "🥇 아시안게임 금메달 획득! [병역 면제] 쾌거, 국민 영웅 등극 (+25)",
                        apply: () => { 
                            p.militaryExempt = true; 
                            p.fanPopularity = Math.min(100, p.fanPopularity + 25);
                            p.careerStats.trophies++;
                            p.careerStats.intlCaps += 5;
                            p.careerStats.intlGoals += 3;
                            p.fameLevel = "국민 영웅 유망주";
                        }
                    },
                    {
                        text: "대회 중 햄스트링 부상으로 결장, 팀은 아쉽게 은메달에 그친다.",
                        effect: "병역 연기 후 상무 입대 준비 필요, 재활 기간 3주",
                        apply: () => { p.injuryWeeks = 3; }
                    }
                ]
            },
            {
                id: "luxury_endorsement",
                title: "글로벌 스포츠 브랜드(나이키/아디다스) 스폰서십 제안",
                category: "광고 스폰서",
                desc: "당신의 폭발적인 인기를 알아본 글로벌 스포츠 브랜드에서 시그니처 축구화 계약과 계약금 5,000만원을 제시했습니다.",
                choices: [
                    {
                        text: "단독 모델 계약 체결! 계약금을 즉시 수령한다.",
                        effect: "💰 자산 +5,000만원, 브랜드 파워 상승",
                        apply: () => { p.bankBalance += 5000; p.fanPopularity = Math.min(100, p.fanPopularity + 8); }
                    },
                    {
                        text: "축구에만 집중하기 위해 광고 촬영을 거절하고 훈련장으로 향한다.",
                        effect: "축구 도사 모드! 능력치 전체 소폭 보너스",
                        apply: () => { p.stats.technique = Math.min(20, p.stats.technique + 1); }
                    }
                ]
            }
        ];

        return events[Math.floor(Math.random() * events.length)];
    }

    // ========================================================================
    // KICKRU LUXURY ASSETS SHOP
    // ========================================================================
    getShopCatalog() {
        return [
            { id: "rolex", name: "롤렉스 서브마리너 데이트", category: "시계", cost: 2000, fameBonus: 5, icon: "⌚", desc: "영앤리치 축구선수의 필수 아이템" },
            { id: "porsche", name: "포르쉐 911 GT3 RS", category: "슈퍼카", cost: 25000, fameBonus: 15, icon: "🏎️", desc: "훈련장 출퇴근용 최고의 스포츠카" },
            { id: "ferrari", name: "페라리 F8 스파이더", category: "슈퍼카", cost: 45000, fameBonus: 25, icon: "🚗", desc: "강렬한 배기음으로 시선을 사로잡는 슈퍼카" },
            { id: "gangnam_apt", name: "청담동 최고급 한강뷰 펜트하우스", category: "부동산", cost: 95000, fameBonus: 40, icon: "🏙️", desc: "서울 한강이 한눈에 내려다보이는 초호화 저택" },
            { id: "london_mansion", name: "런던 켄싱턴 대저택", category: "부동산", cost: 180000, fameBonus: 60, icon: "🏰", desc: "프리미어리그 빅클럽 스타들의 성지" },
            { id: "private_jet", name: "걸프스트림 G650 개인 전용기", category: "전용기", cost: 500000, fameBonus: 100, icon: "✈️", desc: "호날두와 메시처럼 전 세계를 누비는 최상위 럭셔리" }
        ];
    }

    buyAsset(assetId) {
        const catalog = this.getShopCatalog();
        const asset = catalog.find(a => a.id === assetId);
        const p = this.playerProfile;

        if (!asset) return { success: false, message: "존재하지 않는 상품입니다." };
        if (p.bankBalance < asset.cost) {
            return { success: false, message: `잔액이 부족합니다! (필요: ${(asset.cost).toLocaleString()}만원 / 보유: ${p.bankBalance.toLocaleString()}만원)` };
        }
        if (p.ownedAssets.includes(assetId)) {
            return { success: false, message: "이미 소유하고 있는 자산입니다!" };
        }

        p.bankBalance -= asset.cost;
        p.ownedAssets.push(assetId);
        p.fanPopularity = Math.min(100, p.fanPopularity + asset.fameBonus);

        return {
            success: true,
            message: `🎉 [${asset.name}] 구매 완료! 팬 인기와 명성이 대폭 상승했습니다!`,
            asset: asset
        };
    }

    // ========================================================================
    // END OF SEASON: AGING, RETIREMENTS, NEWGENS & BALLON D'OR
    // ========================================================================
    endSeasonTransition() {
        const endYear = this.currentYear;
        const newYear = endYear + 1;
        this.currentYear = newYear;
        this.currentSeason = `${newYear}/${(newYear + 1).toString().slice(2)}`;
        this.currentRound = 1;

        // 1. Process League Winners & Awards
        const seasonSummary = this.calculateSeasonAwards(endYear);

        // 2. Process Aging for all 400+ real players & playerProfile
        const retirementNews = this.processLivingWorldAging();

        // 3. Generate New Generation (Regens & Wonderkids) to refill squads
        const newgenNews = this.generateSeasonalNewgens();

        // 4. Reset League Tables for the New Season
        this.initLeagueTables();

        // 5. Store Season in History
        this.seasonHistory.unshift({
            season: `${endYear}/${(endYear + 1).toString().slice(2)}`,
            ballonDor: seasonSummary.ballonDor,
            retirements: retirementNews,
            newgens: newgenNews
        });

        return {
            isSeasonEnd: true,
            newSeason: this.currentSeason,
            summary: seasonSummary,
            retirements: retirementNews,
            newgens: newgenNews
        };
    }

    // Calculate Ballon d'Or and League Champions
    calculateSeasonAwards(year) {
        // Find highest rated active players for Ballon d'Or
        const eligible = [...PLAYERS].filter(p => !p.retired).sort((a, b) => b.ovr - a.ovr);
        const winner = eligible[0] || { koreanName: "엘링 홀란드", team: "맨체스터 시티", ovr: 91 };

        // If playerProfile had a godly season, they can win Ballon d'Or!
        const p = this.playerProfile;
        let pWonBallon = false;
        if (p.ovr >= 89 && p.seasonStats.goals + p.seasonStats.assists >= 40) {
            p.careerStats.ballonDor++;
            pWonBallon = true;
        }

        // Reset season stats for player profile
        p.seasonStats = { appearances: 0, goals: 0, assists: 0, avgRating: 6.5 };

        return {
            year: year,
            ballonDor: pWonBallon ? `${p.koreanName} (${p.clubName})` : `${winner.koreanName} (${winner.team})`,
            pWonBallon: pWonBallon
        };
    }

    // Player Aging & Retirement System (Zero-compromise realism)
    processLivingWorldAging() {
        const retirementAnnouncements = [];

        // 1. Player Profile aging
        const myP = this.playerProfile;
        myP.age++;
        if (myP.age >= 31) {
            // Physical decline
            myP.stats.pace = Math.max(8, myP.stats.pace - 1);
            myP.stats.stamina = Math.max(8, myP.stats.stamina - 1);
        }

        // 2. All 400+ world players aging
        PLAYERS.forEach(p => {
            if (p.retired) return;

            p.age++;

            // Youth Growth (16 ~ 22)
            if (p.age <= 22) {
                const growth = Math.floor(Math.random() * 3 + 1);
                p.ovr = Math.min(p.pa ? Math.floor(p.pa / 2.05) : 95, p.ovr + growth);
            }
            // Veteran Decline (33+)
            else if (p.age >= 33) {
                const decline = Math.floor(Math.random() * 2 + 1);
                p.ovr = Math.max(65, p.ovr - decline);
                if (p.stats) {
                    p.stats.pace = Math.max(5, (p.stats.pace || 14) - 2);
                    p.stats.stamina = Math.max(5, (p.stats.stamina || 14) - 2);
                }
            }

            // Retirement Check (34+)
            let retireChance = 0;
            if (p.age === 34) retireChance = 0.15;
            else if (p.age === 35) retireChance = 0.30;
            else if (p.age === 36) retireChance = 0.55;
            else if (p.age === 37) retireChance = 0.80;
            else if (p.age >= 38) retireChance = 0.95;

            if (Math.random() < retireChance) {
                p.retired = true;
                this.retiredLegends.push({
                    name: p.koreanName || p.name,
                    finalClub: p.team,
                    age: p.age,
                    peakOvr: p.ovr,
                    year: this.currentYear
                });

                if (p.ovr >= 80 || p.age >= 37) {
                    retirementAnnouncements.push(`👑 [전설의 은퇴] ${p.koreanName} (${p.team}, ${p.age}세) 선수가 현역 공식 은퇴를 선언했습니다.`);
                }
            }
        });

        return retirementAnnouncements;
    }

    // Procedural Regens & Wonderkids Generator
    generateSeasonalNewgens() {
        const newgenHeadlines = [];
        const positions = ["ST", "LW", "RW", "CAM", "CM", "CDM", "CB", "LB", "RB", "GK"];

        CLUBS.forEach(c => {
            // Generate 1-2 new youth academy graduates per club
            const count = Math.random() < 0.6 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                const pos = positions[Math.floor(Math.random() * positions.length)];
                
                // Determine nationality based on league
                let nation = "대한민국";
                let flag = "🇰🇷";
                if (c.league === "jleague") { nation = "일본"; flag = "🇯🇵"; }
                else if (c.league === "epl") { nation = "잉글랜드"; flag = "🏴󠁧󠁢󠁥󠁮󠁧󠁿"; }
                else if (c.league === "laliga") { nation = "스페인"; flag = "🇪🇸"; }
                else if (c.league === "bundesliga") { nation = "독일"; flag = "🇩🇪"; }
                else if (c.league === "seriea") { nation = "이탈리아"; flag = "🇮🇹"; }
                else if (c.league === "ligue1") { nation = "프랑스"; flag = "🇫🇷"; }
                else if (c.league === "mls") { nation = "미국"; flag = "🇺🇸"; }

                const pool = NEWGEN_NAME_POOLS[nation] || NEWGEN_NAME_POOLS["대한민국"];
                const fam = pool.family[Math.floor(Math.random() * pool.family.length)];
                const giv = pool.given[Math.floor(Math.random() * pool.given.length)];
                
                let kName = "";
                let eName = "";
                if (nation === "대한민국") {
                    kName = `${fam}${giv}`;
                    eName = `${giv} ${fam}`;
                } else if (nation === "일본") {
                    kName = `${fam} ${giv}`;
                    eName = `${giv} ${fam}`;
                } else {
                    kName = `${giv} ${fam}`;
                    eName = `${giv} ${fam}`;
                }

                // Wonderkid roll (approx 8% chance)
                const isWonderkid = Math.random() < 0.08;
                const startingOvr = isWonderkid ? Math.floor(Math.random() * 6 + 72) : Math.floor(Math.random() * 8 + 62);
                const pa = isWonderkid ? Math.floor(Math.random() * 15 + 180) : Math.floor(Math.random() * 25 + 140);
                const ca = int(startingOvr * 2.05);

                const newgenId = `newgen_${this.currentYear}_${c.id}_${i}_${Math.floor(Math.random()*1000)}`;
                const newgenObj = {
                    id: newgenId,
                    name: eName,
                    koreanName: kName,
                    team: c.name,
                    clubId: c.id,
                    league: c.league,
                    nation: nation,
                    flag: flag,
                    age: Math.floor(Math.random() * 3 + 16), // 16~18 years old
                    pos: pos,
                    posList: [pos],
                    foot: Math.random() < 0.3 ? "Left" : "Right",
                    height: Math.floor(Math.random() * 20 + 175),
                    weight: Math.floor(Math.random() * 18 + 68),
                    ovr: startingOvr,
                    ca: ca,
                    pa: pa,
                    value: Math.max(1, int((startingOvr - 55) * 2)),
                    wage: Math.max(5, int((startingOvr - 55) * 4)),
                    isNewgen: true,
                    isWonderkid: isWonderkid,
                    intakeYear: this.currentYear,
                    stats: make_stats(startingOvr, pos),
                    traits: isWonderkid ? ["🌟 괴물 신인 (Wonderkid)", "특급 유망주"] : ["유스 아카데미 졸업생"]
                };

                PLAYERS.push(newgenObj);
                PLAYER_MAP[newgenId] = newgenObj;
                c.bench.push(newgenId);

                if (isWonderkid) {
                    newgenHeadlines.push(`✨ [원더키드 탄생] ${c.name} 유스팀에서 괴물 신인 ${kName} (${pos}, ${newgenObj.age}세, 잠재력 ${pa})이 1군으로 전격 콜업되었습니다!`);
                }
            }
        });

        return newgenHeadlines;
    }
}

// Helper make_stats for newgens
function make_stats(ovr, pos) {
    const base = Math.max(1, Math.min(20, Math.floor(ovr * 0.2)));
    if (pos === "GK") {
        return {
            finishing: 2, passing: 8, dribbling: 3, firstTouch: 7, technique: 6,
            tackling: 3, marking: 3, heading: 4, longShots: 2, crossing: 2, freeKicks: 2,
            vision: 9, decisions: Math.min(20, base - 1), positioning: Math.min(20, base + 1), anticipation: Math.min(20, base),
            composure: Math.min(20, base), determination: 15, teamwork: 14, workRate: 14, offTheBall: 3, bravery: 16,
            pace: 10, acceleration: 10, stamina: 12, strength: 14, agility: 15, jumping: Math.min(20, base), balance: 13,
            reflexes: Math.min(20, base + 2), oneOnOnes: Math.min(20, base + 1), handling: Math.min(20, base + 1),
            aerial: Math.min(20, base), kicking: Math.min(20, base - 1), command: Math.min(20, base)
        };
    } else if (["CB", "LB", "RB", "DF"].includes(pos)) {
        return {
            finishing: 6, passing: Math.min(20, base - 3), dribbling: Math.min(20, base - 4), firstTouch: Math.min(20, base - 2), technique: Math.min(20, base - 3),
            tackling: Math.min(20, base + 2), marking: Math.min(20, base + 2), heading: Math.min(20, base + 1), longShots: 7, crossing: ["LB", "RB"].includes(pos) ? 12 : 6, freeKicks: 6,
            vision: Math.min(20, base - 3), decisions: Math.min(20, base), positioning: Math.min(20, base + 2), anticipation: Math.min(20, base + 1),
            composure: Math.min(20, base), determination: 16, teamwork: 16, workRate: 16, offTheBall: 8, bravery: 17,
            pace: Math.min(20, base + (["LB", "RB"].includes(pos) ? 2 : -1)), acceleration: Math.min(20, base), stamina: Math.min(20, base + 1),
            strength: Math.min(20, base + 2), agility: Math.min(20, base - 1), jumping: Math.min(20, base + 1), balance: Math.min(20, base),
            reflexes: 2, oneOnOnes: 2, handling: 2, aerial: 2, kicking: 3, command: 2
        };
    } else if (["CDM", "CM", "CAM", "MF"].includes(pos)) {
        return {
            finishing: Math.min(20, base - 2), passing: Math.min(20, base + 2), dribbling: Math.min(20, base + 1), firstTouch: Math.min(20, base + 2), technique: Math.min(20, base + 2),
            tackling: Math.min(20, ["CDM", "CM"].includes(pos) ? base : base - 4), marking: Math.min(20, pos === "CDM" ? base : base - 5),
            heading: 10, longShots: Math.min(20, base), crossing: Math.min(20, base - 1), freeKicks: Math.min(20, base),
            vision: Math.min(20, base + 2), decisions: Math.min(20, base + 1), positioning: Math.min(20, base), anticipation: Math.min(20, base + 1),
            composure: Math.min(20, base + 1), determination: 16, teamwork: 17, workRate: 17, offTheBall: Math.min(20, base + 1), bravery: 14,
            pace: Math.min(20, base - 1), acceleration: Math.min(20, base), stamina: Math.min(20, base + 2),
            strength: Math.min(20, base), agility: Math.min(20, base + 1), jumping: 12, balance: Math.min(20, base + 1),
            reflexes: 2, oneOnOnes: 2, handling: 2, aerial: 2, kicking: 3, command: 2
        };
    } else {
        return {
            finishing: Math.min(20, base + 2), passing: Math.min(20, base - 2), dribbling: Math.min(20, base + 2), firstTouch: Math.min(20, base + 1), technique: Math.min(20, base + 1),
            tackling: 5, marking: 4, heading: Math.min(20, pos === "ST" ? base : base - 3), longShots: Math.min(20, base), crossing: Math.min(20, ["LW", "RW"].includes(pos) ? base + 1 : base - 3), freeKicks: Math.min(20, base - 1),
            vision: Math.min(20, base - 1), decisions: Math.min(20, base), positioning: Math.min(20, base + 1), anticipation: Math.min(20, base + 2),
            composure: Math.min(20, base + 2), determination: 16, teamwork: 14, workRate: 15, offTheBall: Math.min(20, base + 2), bravery: 15,
            pace: Math.min(20, base + 2), acceleration: Math.min(20, base + 2), stamina: Math.min(20, base),
            strength: Math.min(20, pos === "ST" ? base + 1 : base - 2), agility: Math.min(20, base + 2), jumping: Math.min(20, pos === "ST" ? base : base - 2), balance: Math.min(20, base + 1),
            reflexes: 2, oneOnOnes: 2, handling: 2, aerial: 2, kicking: 3, command: 2
        };
    }
}

// Helper int
function int(val) {
    return Math.floor(val);
}

if (typeof window !== 'undefined') {
    window.CareerEngine = CareerEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CareerEngine };
}
