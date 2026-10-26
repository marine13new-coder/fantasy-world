// ============================================================================
// Kickru-Grade Football Career & Living World Simulation Engine (career.js)
// 1. Time Progression & Dynamic League Calendar (2024 -> 2025 -> 2026 ...)
// 2. Realistic Player Aging, Youth Growth & Physical Decline Curves
// 3. Veteran Retirement & Automatic Squad Replenishment (Never leaves clubs short)
// 4. Procedural Regens & Wonderkid Newgen Factory (Localized Names & Traits)
// 5. Kickru-style "From Bench to Ballon d'Or" Custom Player Career & Transfers
// 6. Luxury Lifestyle & Assets Shop (Supercars, Mansions, Private Jets)
// 7. Full 9-League Standings (K League 1, EPL, La Liga, Bundesliga, Serie A, Ligue 1, Europe, J1, MLS)
// ============================================================================

class CareerEngine {
    constructor() {
        this.currentYear = 2024;
        this.currentSeason = "2024/25";
        this.currentRound = 1;
        this.totalRounds = 38;

        this.mode = 'player';
        this.playerProfile = this.createDefaultPlayerProfile();

        this.leagueStandings = {};
        this.retiredLegends = [];
        this.newsFeed = [];
        this.seasonHistory = [];

        this.initLeagueTables();
        this.syncUserPlayerIntoClubSquad();
    }

    createDefaultPlayerProfile() {
        return {
            id: "my_career_player",
            name: "이유찬",
            englishName: "Lee Yu-chan",
            nation: "대한민국",
            flag: "🇰🇷",
            age: 17,
            birthYear: 2007,
            pos: "ST",
            style: "컴플리트 포워드",
            clubId: "ulsan",
            clubName: "울산 HD FC",
            ovr: 68,
            ca: 138,
            pa: 192,
            stats: {
                finishing: 14,
                passing: 12,
                dribbling: 14,
                firstTouch: 13,
                technique: 14,
                longShots: 13,
                pace: 15,
                acceleration: 15,
                stamina: 13,
                strength: 12,
                vision: 12,
                composure: 13,
                decisions: 12,
                positioning: 13,
                anticipation: 13,
                teamwork: 14,
                jumping: 12,
                reflexes: 2,
                tackling: 6
            },
            managerTrust: 65,
            fanPopularity: 35,
            teamMorale: 82,
            weeklyWage: 35,
            bankBalance: 300,
            fameLevel: "슈퍼 루키 유망주",
            militaryExempt: false,
            hasServedMilitary: false,
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
                avgRating: 6.8
            },
            ownedAssets: [],
            matchStatus: "STARTER",
            injuryWeeks: 0
        };
    }

    // Customize career player (Name, Nation, Position, Style, Starting Club)
    customizePlayerProfile({ name, englishName, nation, pos, style, clubId }) {
        const p = this.playerProfile;
        if (name && name.trim()) p.name = name.trim();
        if (englishName && englishName.trim()) p.englishName = englishName.trim();
        if (nation) {
            p.nation = nation;
            const flagMap = { "대한민국": "🇰🇷", "일본": "🇯🇵", "잉글랜드": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "스페인": "🇪🇸", "독일": "🇩🇪", "브라질": "🇧🇷", "프랑스": "🇫🇷", "미국": "🇺🇸" };
            p.flag = flagMap[nation] || "🌍";
        }
        if (pos) p.pos = pos;
        if (style) p.style = style;
        if (clubId && typeof CLUB_MAP !== 'undefined' && CLUB_MAP[clubId]) {
            p.clubId = clubId;
            p.clubName = CLUB_MAP[clubId].name;
        }
        this.syncUserPlayerIntoClubSquad();
        return p;
    }

    // Ensure user's career player is registered in PLAYER_MAP and their club's squad
    syncUserPlayerIntoClubSquad() {
        if (typeof PLAYER_MAP === 'undefined' || typeof CLUB_MAP === 'undefined') return;
        const p = this.playerProfile;
        const playerRecord = {
            id: "my_career_player",
            name: p.englishName || p.name,
            koreanName: p.name,
            engName: p.englishName || p.name,
            team: p.clubName,
            club: p.clubName,
            clubId: p.clubId,
            league: (CLUB_MAP[p.clubId] && CLUB_MAP[p.clubId].league) || "kleague",
            nation: p.nation,
            flag: p.flag,
            age: p.age,
            pos: p.pos,
            posList: [p.pos],
            ovr: p.ovr,
            pot: Math.min(99, Math.round(p.pa / 2.02)),
            ca: p.ca,
            pa: p.pa,
            foot: "양발",
            height: "183cm",
            value: `€${Math.max(1, Math.round((p.ovr - 58) * 2.5))}M`,
            wage: `${p.weeklyWage}만`,
            isPlayerCharacter: true,
            isHistorical: false,
            retired: false,
            stats: p.stats,
            traits: ["★ 내 커리어 선수", p.style, "원더키드"]
        };
        PLAYER_MAP["my_career_player"] = playerRecord;
        const existingIdx = PLAYERS.findIndex(x => x.id === "my_career_player");
        if (existingIdx >= 0) {
            PLAYERS[existingIdx] = playerRecord;
        } else {
            PLAYERS.unshift(playerRecord);
        }

        const club = CLUB_MAP[p.clubId];
        if (club) {
            if (!club.starters.includes("my_career_player") && !club.bench.includes("my_career_player")) {
                if (p.managerTrust >= 60) {
                    club.starters[club.starters.length - 1] = "my_career_player";
                } else {
                    club.bench.unshift("my_career_player");
                }
            }
        }
    }

    // Generate Realistic Agent Transfer Offers based on Player OVR
    getTransferOffers() {
        const p = this.playerProfile;
        const allValidClubs = CLUBS.filter(c =>
            c.id !== p.clubId &&
            !c.isHistoricalTeam &&
            c.league !== 'legends' &&
            c.league !== 'national'
        );

        // Filter clubs appropriate for player's current OVR (+10 reach)
        const targetRepMin = Math.max(70, p.ovr - 6);
        const targetRepMax = Math.min(99, p.ovr + 14);
        let candidates = allValidClubs.filter(c => c.reputation >= targetRepMin && c.reputation <= targetRepMax);
        if (candidates.length < 4) candidates = allValidClubs;

        const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, 4);
        return shuffled.map(c => {
            const wageOffer = Math.max(p.weeklyWage + 20, Math.round((c.reputation - 60) * (p.ovr / 35) * 8));
            const signingBonus = Math.round(wageOffer * 6);
            const roleOffer = p.ovr >= (c.reputation - 6) ? "핵심 주전 (STARTER 보장)" : "로테이션 & 유망주 조커";
            return {
                clubId: c.id,
                clubName: c.name,
                emblem: c.emblem,
                league: c.league,
                reputation: c.reputation,
                weeklyWage: wageOffer,
                signingBonus: signingBonus,
                roleOffer: roleOffer
            };
        });
    }

    transferPlayerToClub(offer) {
        const p = this.playerProfile;
        const oldClub = CLUB_MAP[p.clubId];
        if (oldClub) {
            oldClub.starters = oldClub.starters.filter(id => id !== "my_career_player");
            oldClub.bench = oldClub.bench.filter(id => id !== "my_career_player");
            this.ensureClubSquadSize(oldClub);
        }

        const newClub = CLUB_MAP[offer.clubId];
        if (!newClub) return { success: false, message: "구단 정보를 찾을 수 없습니다." };

        p.clubId = newClub.id;
        p.clubName = newClub.name;
        p.weeklyWage = offer.weeklyWage;
        p.bankBalance += offer.signingBonus;
        p.managerTrust = offer.roleOffer.includes("주전") ? 78 : 55;
        p.fanPopularity = Math.min(100, p.fanPopularity + 10);
        p.fameLevel = `${newClub.name} 신입 스타`;

        // Insert into new club starters
        newClub.starters = newClub.starters.filter(id => id !== "my_career_player");
        newClub.bench = newClub.bench.filter(id => id !== "my_career_player");
        newClub.starters[newClub.starters.length - 1] = "my_career_player";

        this.syncUserPlayerIntoClubSquad();
        return {
            success: true,
            message: `✈️ [공식 오피셜] ${p.name} 선수, ${newClub.emblem} ${newClub.name} 전격 이적! (주급 ${offer.weeklyWage.toLocaleString()}만원 / 계약금 ${offer.signingBonus.toLocaleString()}만원 수령)`
        };
    }

    initLeagueTables() {
        const leagues = ["kleague", "epl", "laliga", "bundesliga", "seriea", "ligue1", "europe", "jleague", "mls"];
        leagues.forEach(lId => {
            const leagueClubs = CLUBS.filter(c => c.league === lId && !c.isHistoricalTeam);
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

    advanceRound() {
        if (this.currentRound >= this.totalRounds) {
            return this.endSeasonTransition();
        }

        this.currentRound++;
        this.simulateLeagueRound();

        let matchResult = null;
        if (this.mode === 'player') {
            matchResult = this.simulatePlayerMatchDay();
        }

        let storyEvent = null;
        if (Math.random() < 0.35) {
            storyEvent = this.generateRandomStoryEvent();
        }

        this.syncUserPlayerIntoClubSquad();

        return {
            round: this.currentRound,
            year: this.currentYear,
            season: this.currentSeason,
            matchResult: matchResult,
            storyEvent: storyEvent
        };
    }

    simulateLeagueRound() {
        for (const lId in this.leagueStandings) {
            const table = this.leagueStandings[lId];
            if (!table || table.length < 2) continue;

            const shuffled = [...table].sort(() => Math.random() - 0.5);
            for (let i = 0; i < shuffled.length - 1; i += 2) {
                const home = shuffled[i];
                const away = shuffled[i + 1];

                const homeClub = CLUB_MAP[home.clubId] || { reputation: 78 };
                const awayClub = CLUB_MAP[away.clubId] || { reputation: 78 };

                const homeRep = (homeClub.reputation || 78) + 3;
                const awayRep = (awayClub.reputation || 78);

                let homeGoals = Math.floor(Math.random() * (homeRep > awayRep ? 4 : 3));
                let awayGoals = Math.floor(Math.random() * (awayRep > homeRep ? 4 : 3));
                if (Math.random() < 0.18) homeGoals++;

                home.played++;
                home.gf += homeGoals;
                home.ga += awayGoals;
                home.gd = home.gf - home.ga;

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

            table.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
        }
    }

    simulatePlayerMatchDay() {
        const p = this.playerProfile;

        if (p.injuryWeeks > 0) {
            p.injuryWeeks--;
            return {
                status: "부상 결장",
                desc: `부상 재활 중 (${p.injuryWeeks}주 남음)`
            };
        }

        let role = "BENCH";
        if (p.managerTrust >= 60 || p.ovr >= 72) {
            role = "STARTER";
        } else if (p.managerTrust >= 38) {
            role = Math.random() < 0.7 ? "SUB_IN" : "BENCH";
        } else {
            role = Math.random() < 0.4 ? "SUB_IN" : "BENCH";
        }

        p.matchStatus = role;
        p.bankBalance += p.weeklyWage;

        if (role === "BENCH") {
            p.managerTrust = Math.min(100, p.managerTrust + 2);
            return {
                status: "벤치 대기",
                desc: "교체 명단에서 대기하며 다음 경기 출전 기회를 노렸습니다."
            };
        }

        const mins = role === "STARTER" ? Math.floor(Math.random() * 20 + 70) : Math.floor(Math.random() * 25 + 18);
        p.careerStats.appearances++;
        p.seasonStats.appearances++;

        const finishingRate = ((p.stats.finishing || 13) + ((p.stats.dribbling || 13) / 2)) / 28;
        let goals = 0;
        let assists = 0;

        if (["ST", "CF", "LW", "RW"].includes(p.pos)) {
            if (Math.random() < finishingRate * (mins / 90) * 0.78) goals++;
            if (Math.random() < 0.18 && goals === 1) goals++;
            if (Math.random() < 0.36 * (mins / 90)) assists++;
        } else if (["CAM", "CM", "CDM", "RM", "LM"].includes(p.pos)) {
            if (Math.random() < 0.42 * (mins / 90)) assists++;
            if (Math.random() < 0.32 * (mins / 90)) goals++;
        } else {
            if (Math.random() < 0.10) goals++;
            if (Math.random() < 0.15) assists++;
        }

        p.careerStats.goals += goals;
        p.careerStats.assists += assists;
        p.seasonStats.goals += goals;
        p.seasonStats.assists += assists;

        let rating = 6.4 + (goals * 1.3) + (assists * 0.75) + (Math.random() * 0.8 - 0.3);
        rating = Math.min(10.0, Math.max(5.6, parseFloat(rating.toFixed(1))));

        if (rating >= 8.4) {
            p.careerStats.motm++;
            p.managerTrust = Math.min(100, p.managerTrust + 4);
            p.fanPopularity = Math.min(100, p.fanPopularity + 5);
        } else if (rating >= 7.0) {
            p.managerTrust = Math.min(100, p.managerTrust + 2);
            p.fanPopularity = Math.min(100, p.fanPopularity + 2);
        }

        this.applyMatchGrowth(p, mins, rating);

        return {
            status: role === "STARTER" ? `선발 출전 (${mins}분)` : `교체 출전 (${mins}분)`,
            mins: mins,
            goals: goals,
            assists: assists,
            rating: rating,
            motm: rating >= 8.4,
            desc: goals > 0
                ? `⚽ ${goals}골${assists > 0 ? ` ${assists}도움` : ''} 작렬! 평점 ${rating}점 맹활약!`
                : (assists > 0 ? `🎯 날카로운 도움 기록! 평점 ${rating}점.` : `평점 ${rating}점으로 준수한 활약을 펼쳤습니다.`)
        };
    }

    applyMatchGrowth(p, mins, rating) {
        if (p.age > 31) return;
        const growthFactor = (p.pa - p.ca) / 100 * (mins / 90) * (rating / 6.8);
        if (growthFactor > 0.08 && Math.random() < 0.45) {
            const statKeys = Object.keys(p.stats);
            const picked = statKeys[Math.floor(Math.random() * statKeys.length)];
            if (p.stats[picked] < 20) {
                p.stats[picked] = Math.min(20, p.stats[picked] + 1);
            }
            p.ca = Math.min(p.pa, p.ca + 1);
            p.ovr = Math.min(99, Math.max(p.ovr, Math.floor(p.ca / 2.02)));
        }
    }

    trainPlayer(focusType) {
        const p = this.playerProfile;
        let msg = "";

        if (focusType === "finishing") {
            p.stats.finishing = Math.min(20, (p.stats.finishing || 13) + 1);
            p.stats.composure = Math.min(20, (p.stats.composure || 12) + 1);
            msg = "🎯 골 결정력 & 슈팅 특훈 완료! 슈팅 정확도와 침착성이 상승했습니다.";
        } else if (focusType === "playmaking") {
            p.stats.passing = Math.min(20, (p.stats.passing || 12) + 1);
            p.stats.vision = Math.min(20, (p.stats.vision || 12) + 1);
            msg = "🧠 패스 & 시야 훈련 완료! 대지를 가르는 킬패스 능력이 향상되었습니다.";
        } else if (focusType === "dribble") {
            p.stats.dribbling = Math.min(20, (p.stats.dribbling || 13) + 1);
            p.stats.technique = Math.min(20, (p.stats.technique || 13) + 1);
            msg = "⚡ 개인기 & 탈압박 훈련 완료! 드리블 돌파력이 한층 날카로워졌습니다.";
        } else if (focusType === "physical") {
            p.stats.pace = Math.min(20, (p.stats.pace || 14) + 1);
            p.stats.stamina = Math.min(20, (p.stats.stamina || 13) + 1);
            p.stats.strength = Math.min(20, (p.stats.strength || 12) + 1);
            msg = "🏋️ 피지컬 벌크업 훈련 완료! 순간속도와 몸싸움 경합 능력이 강화되었습니다.";
        }

        p.ca = Math.min(p.pa, p.ca + 2);
        p.ovr = Math.min(99, Math.max(p.ovr + 1, Math.floor(p.ca / 2.02)));
        p.managerTrust = Math.min(100, p.managerTrust + 4);
        this.syncUserPlayerIntoClubSquad();

        return { success: true, message: msg, newOvr: p.ovr };
    }

    generateRandomStoryEvent() {
        const p = this.playerProfile;
        const events = [
            {
                id: "locker_senior",
                title: "라커룸 베테랑 선배의 조언과 신경전",
                category: "라커룸",
                desc: "훈련 종료 후 팀의 주장 선배가 다가와 당신의 플레이 템포와 포지셔닝에 대해 진지하게 조언합니다.",
                choices: [
                    {
                        text: "선배의 노하우를 노트에 적으며 겸손하게 배운다.",
                        effect: "팀 케미스트리 상승 (+10), 위치선정 및 시야 향상 (+1)",
                        apply: () => { p.teamMorale = Math.min(100, p.teamMorale + 10); p.stats.vision = Math.min(20, (p.stats.vision || 12) + 1); }
                    },
                    {
                        text: "미니게임 1대1 대결을 신청해 실력으로 증명해 보인다.",
                        effect: "드리블 및 침착성 상승 (+1), 감독 신뢰도 (+5)",
                        apply: () => { p.stats.dribbling = Math.min(20, (p.stats.dribbling || 13) + 1); p.managerTrust = Math.min(100, p.managerTrust + 5); }
                    },
                    {
                        text: "훈련장에 밤늦게까지 남아 추가 슈팅 500개를 차고 퇴근한다.",
                        effect: "골 결정력 상승 (+1), 감독 신뢰도 대폭 상승 (+8)",
                        apply: () => { p.stats.finishing = Math.min(20, (p.stats.finishing || 13) + 1); p.managerTrust = Math.min(100, p.managerTrust + 8); }
                    }
                ]
            },
            {
                id: "manager_interview",
                title: "감독실 호출: 빅매치 선발 출전 면담",
                category: "감독 면담",
                desc: "감독이 전술 보드를 가리키며 묻습니다. '이번 라운드 라이벌전에서 너를 핵심 공격 자원으로 기용하려 한다. 자신 있나?'",
                choices: [
                    {
                        text: "'제게 공만 연결해 주시면 무조건 골망을 흔들겠습니다!'",
                        effect: "감독 신뢰도 상승 (+12), 공격 본능 각성",
                        apply: () => { p.managerTrust = Math.min(100, p.managerTrust + 12); }
                    },
                    {
                        text: "'전방 압박과 수비 가담까지 90분 내내 미친 듯이 뛰겠습니다!'",
                        effect: "감독 신뢰도 (+10), 스태미너 및 팀 사기 상승 (+8)",
                        apply: () => { p.managerTrust = Math.min(100, p.managerTrust + 10); p.teamMorale = Math.min(100, p.teamMorale + 8); }
                    }
                ]
            },
            {
                id: "big_club_scout",
                title: "유럽 명문 구단 수석 스카우트의 방문",
                category: "이적 루머",
                desc: "유럽 빅리그 스카우트가 VIP석에서 당신의 경기를 채점하며 에이전트에게 영입 의사를 타진했습니다.",
                choices: [
                    {
                        text: "에이전트에게 유럽 진출 및 연봉 협상을 적극 추진하라고 지시한다.",
                        effect: "몸값 및 주급 2배 인상! 유럽 이적 레이더망 등재",
                        apply: () => { p.weeklyWage = Math.floor(p.weeklyWage * 2.0); p.fameLevel = "유럽 스카우트 표적"; }
                    },
                    {
                        text: "현 소속팀과 재계약을 체결하며 구단 레전드 대우와 보너스를 챙긴다.",
                        effect: "재계약 보너스 +3,000만원, 팬덤 인기 급상승 (+15)",
                        apply: () => { p.bankBalance += 3000; p.fanPopularity = Math.min(100, p.fanPopularity + 15); }
                    }
                ]
            },
            {
                id: "korean_military",
                title: "아시안게임 / 국제대회 국가대표 최종 발탁",
                category: "국가대표",
                desc: "국가대표팀 최종 엔트리에 발탁되었습니다! 결승전에서 우승을 차지하면 병역 특례와 세계적인 명성을 얻게 됩니다.",
                choices: [
                    {
                        text: "결승전 클러치 결승골을 터뜨리며 금메달과 우승컵을 들어올린다!",
                        effect: "🥇 금메달 & 병역 특례 달성! 트로피 +1, 포상금 +5,000만원",
                        apply: () => {
                            p.militaryExempt = true;
                            p.fanPopularity = Math.min(100, p.fanPopularity + 25);
                            p.careerStats.trophies++;
                            p.careerStats.intlCaps += 6;
                            p.careerStats.intlGoals += 4;
                            p.bankBalance += 5000;
                            p.fameLevel = "국민 축구 영웅";
                        }
                    },
                    {
                        text: "안정적인 경기 운영으로 대표팀의 무실점 우승에 기여한다.",
                        effect: "🥇 병역 특례 달성! 능력치(패스/시야) +1 성장",
                        apply: () => {
                            p.militaryExempt = true;
                            p.careerStats.trophies++;
                            p.stats.passing = Math.min(20, (p.stats.passing || 12) + 1);
                        }
                    }
                ]
            },
            {
                id: "luxury_endorsement",
                title: "글로벌 스포츠 브랜드 시그니처 모델 계약",
                category: "스폰서십",
                desc: "나이키/아디다스 본사에서 당신만을 위한 황금빛 시그니처 축구화 제작과 거액의 스폰서 계약을 제안했습니다.",
                choices: [
                    {
                        text: "글로벌 메인 모델 계약 체결! 광고 모델료 즉시 수령.",
                        effect: "💰 자산 +6,000만원, 팬덤 인기도 상승 (+10)",
                        apply: () => { p.bankBalance += 6000; p.fanPopularity = Math.min(100, p.fanPopularity + 10); }
                    },
                    {
                        text: "스폰서십 수익 일부를 유소년 축구 발전 기금으로 기부한다.",
                        effect: "💰 자산 +3,000만원, 팬덤 인기도 폭발 (+20), 멘탈 성장",
                        apply: () => { p.bankBalance += 3000; p.fanPopularity = Math.min(100, p.fanPopularity + 20); }
                    }
                ]
            }
        ];

        return events[Math.floor(Math.random() * events.length)];
    }

    getShopCatalog() {
        return [
            { id: "rolex", name: "롤렉스 데이토나 플래티넘", category: "시계", cost: 2000, fameBonus: 6, icon: "⌚", desc: "프로 데뷔 성공을 상징하는 하이엔드 크로노그래프" },
            { id: "porsche", name: "포르쉐 911 GT3 RS", category: "슈퍼카", cost: 25000, fameBonus: 15, icon: "🏎️", desc: "클럽하우스 출퇴근 시 모든 시선을 집중시키는 스포츠카" },
            { id: "ferrari", name: "페라리 SF90 스파이더", category: "슈퍼카", cost: 45000, fameBonus: 25, icon: "🚗", desc: "1,000마력의 사운드를 자랑하는 월드클래스 공격수의 애마" },
            { id: "gangnam_apt", name: "청담동 한강뷰 하이엔드 펜트하우스", category: "부동산", cost: 95000, fameBonus: 40, icon: "🏙️", desc: "개인 헬스장과 수영장이 완비된 최고급 펜트하우스" },
            { id: "london_mansion", name: "유럽 빅클럽 대저택 (런던/마드리드)", category: "부동산", cost: 180000, fameBonus: 65, icon: "🏰", desc: "전용 천연잔디 미니구장이 포함된 유럽 슈퍼스타 대저택" },
            { id: "private_jet", name: "걸프스트림 G700 개인 전용기", category: "전용기", cost: 500000, fameBonus: 100, icon: "✈️", desc: "발롱도르 시상식과 대륙간 원정을 오가는 최상위 럭셔리" }
        ];
    }

    buyAsset(assetId) {
        const catalog = this.getShopCatalog();
        const asset = catalog.find(a => a.id === assetId);
        const p = this.playerProfile;

        if (!asset) return { success: false, message: "존재하지 않는 상품입니다." };
        if (p.bankBalance < asset.cost) {
            return { success: false, message: `잔액이 부족합니다! (필요: ${asset.cost.toLocaleString()}만원 / 보유: ${p.bankBalance.toLocaleString()}만원)` };
        }
        if (p.ownedAssets.includes(assetId)) {
            return { success: false, message: "이미 보유하고 있는 자산입니다!" };
        }

        p.bankBalance -= asset.cost;
        p.ownedAssets.push(assetId);
        p.fanPopularity = Math.min(100, p.fanPopularity + asset.fameBonus);

        return {
            success: true,
            message: `🎉 [${asset.name}] 구매 완료! 명성과 팬덤 인기가 대폭 상승했습니다!`,
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

        const seasonSummary = this.calculateSeasonAwards(endYear);
        const retirementNews = this.processLivingWorldAging();
        const newgenNews = this.generateSeasonalNewgens();

        // Ensure every non-historical club has 11 active starters + bench
        CLUBS.forEach(c => {
            if (!c.isHistoricalTeam && c.league !== 'legends') {
                this.ensureClubSquadSize(c);
            }
        });

        this.initLeagueTables();
        this.syncUserPlayerIntoClubSquad();

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

    // STRICT: Only active, non-retired, non-historical club players can win Ballon d'Or!
    calculateSeasonAwards(year) {
        const eligible = PLAYERS.filter(p =>
            !p.retired &&
            !p.isHistorical &&
            !p.isNationalRep &&
            p.league !== 'legends' &&
            p.league !== 'national'
        ).sort((a, b) => b.ovr - a.ovr);

        const topPool = eligible.slice(0, 6);
        const winner = topPool.length > 0
            ? topPool[Math.floor(Math.random() * topPool.length)]
            : { koreanName: "로드리", team: "맨체스터 시티", ovr: 91 };

        const p = this.playerProfile;
        let pWonBallon = false;
        if (p.ovr >= 86 && (p.seasonStats.goals + p.seasonStats.assists >= 28 || p.ovr >= 91)) {
            p.careerStats.ballonDor++;
            p.careerStats.trophies++;
            pWonBallon = true;
        }

        p.seasonStats = { appearances: 0, goals: 0, assists: 0, avgRating: 6.8 };

        return {
            year: year,
            ballonDor: pWonBallon
                ? `★ ${p.name} (${p.clubName} / OVR ${p.ovr})`
                : `${winner.koreanName || winner.name} (${winner.team || winner.club} / OVR ${winner.ovr})`,
            pWonBallon: pWonBallon
        };
    }

    processLivingWorldAging() {
        const retirementAnnouncements = [];

        const myP = this.playerProfile;
        myP.age++;
        if (myP.age <= 24) {
            myP.ca = Math.min(myP.pa, myP.ca + 3);
            myP.ovr = Math.min(99, Math.max(myP.ovr + 1, Math.floor(myP.ca / 2.02)));
        } else if (myP.age >= 33) {
            myP.stats.pace = Math.max(8, (myP.stats.pace || 14) - 1);
            myP.stats.stamina = Math.max(8, (myP.stats.stamina || 13) - 1);
        }

        PLAYERS.forEach(p => {
            if (p.id === "my_career_player") return;
            if (p.retired || p.isHistorical || p.league === 'legends') return;

            p.age++;

            // Youth & Wonderkid Growth (16 ~ 23)
            if (p.age <= 23) {
                const maxOvr = p.pot || (p.pa ? Math.floor(p.pa / 2.02) : 88);
                if (p.ovr < maxOvr) {
                    const growth = p.isWonderkid ? Math.floor(Math.random() * 3 + 2) : Math.floor(Math.random() * 2 + 1);
                    p.ovr = Math.min(96, Math.min(maxOvr, p.ovr + growth));
                    p.ca = Math.round(p.ovr * 2.05);
                    p.stats = make_stats(p.ovr, p.pos);
                }
            }
            // Prime Years (24 ~ 29)
            else if (p.age <= 29 && Math.random() < 0.25) {
                const maxOvr = p.pot || p.ovr;
                if (p.ovr < maxOvr) {
                    p.ovr = Math.min(96, p.ovr + 1);
                    p.stats = make_stats(p.ovr, p.pos);
                }
            }
            // Veteran Decline (33+)
            else if (p.age >= 33) {
                const decline = Math.floor(Math.random() * 2 + 1);
                p.ovr = Math.max(64, p.ovr - decline);
                if (p.stats) {
                    p.stats.pace = Math.max(6, (p.stats.pace || 12) - 1);
                    p.stats.stamina = Math.max(6, (p.stats.stamina || 12) - 1);
                }
            }

            // Retirement Check (34+)
            let retireChance = 0;
            if (p.age === 34) retireChance = 0.12;
            else if (p.age === 35) retireChance = 0.28;
            else if (p.age === 36) retireChance = 0.52;
            else if (p.age === 37) retireChance = 0.78;
            else if (p.age >= 38) retireChance = 0.94;

            if (Math.random() < retireChance) {
                p.retired = true;
                this.retiredLegends.unshift({
                    name: p.koreanName || p.name,
                    finalClub: p.team || p.club,
                    age: p.age,
                    peakOvr: p.ovr,
                    year: this.currentYear
                });

                // Remove retired player from club starters/bench
                const club = CLUB_MAP[p.clubId];
                if (club) {
                    club.starters = club.starters.filter(id => id !== p.id);
                    club.bench = club.bench.filter(id => id !== p.id);
                }

                if (p.ovr >= 76 || p.age >= 36) {
                    retirementAnnouncements.push(`👑 [공식 은퇴] ${p.koreanName || p.name} (${p.team || p.club}, ${p.age}세) 선수가 정든 그라운드를 떠납니다.`);
                }
            }
        });

        return retirementAnnouncements;
    }

    createSingleNewgenForClub(c, forcedPos = null, index = 0) {
        const positions = ["ST", "LW", "RW", "CAM", "CM", "CDM", "CB", "LB", "RB", "GK"];
        const pos = forcedPos || positions[Math.floor(Math.random() * positions.length)];

        const pool = NEWGEN_NAME_POOLS[c.league] || NEWGEN_NAME_POOLS["kleague"] || NEWGEN_NAME_POOLS["대한민국"];
        const nation = pool ? pool.nation : "대한민국";
        const flag = pool ? pool.flag : "🇰🇷";
        const famList = (pool && (pool.family || pool.first)) || ["김", "이", "박"];
        const givList = (pool && (pool.given || pool.last)) || ["민준", "서준", "지훈"];

        const fam = famList[Math.floor(Math.random() * famList.length)];
        const giv = givList[Math.floor(Math.random() * givList.length)];

        let kName = "";
        let eName = "";
        if (nation === "대한민국") {
            kName = `${fam}${giv}`;
            eName = `${fam} ${giv}`;
        } else {
            kName = `${fam} ${giv}`;
            eName = `${fam} ${giv}`;
        }

        const isWonderkid = Math.random() < 0.14;
        const clubRep = c.reputation || 76;
        const baseOvr = Math.max(62, Math.min(76, Math.round(clubRep * 0.82)));
        const startingOvr = isWonderkid
            ? Math.min(82, baseOvr + Math.floor(Math.random() * 6 + 4))
            : baseOvr + Math.floor(Math.random() * 5 - 2);
        const pot = isWonderkid
            ? Math.floor(Math.random() * 8 + 88)
            : Math.min(89, startingOvr + Math.floor(Math.random() * 10 + 6));
        const ca = Math.round(startingOvr * 2.05);
        const pa = Math.round(pot * 2.05);

        const newgenId = `newgen_${this.currentYear}_${c.id}_${index}_${Math.floor(Math.random() * 10000)}`;
        const tagPrefix = isWonderkid ? "[✨원더키드]" : "[생성]";

        const newgenObj = {
            id: newgenId,
            name: eName,
            engName: eName,
            koreanName: `${kName} ${tagPrefix}`,
            team: c.name,
            club: c.name,
            clubId: c.id,
            league: c.league,
            nation: nation,
            flag: flag,
            age: Math.floor(Math.random() * 3 + 16),
            pos: pos,
            posGroup: pos === "GK" ? "GK" : (["CB", "LB", "RB", "LWB", "RWB"].includes(pos) ? "DF" : (["ST", "CF", "LW", "RW"].includes(pos) ? "FW" : "MF")),
            posList: [pos],
            foot: Math.random() < 0.28 ? "왼발" : "오른발",
            height: `${Math.floor(Math.random() * 18 + 174)}cm`,
            ovr: startingOvr,
            pot: pot,
            ca: ca,
            pa: pa,
            value: `€${Math.max(1, Math.round((startingOvr - 58) * 1.8))}M`,
            wage: `€${Math.max(5, Math.round((startingOvr - 58) * 3))}K/w`,
            isNewgen: true,
            isWonderkid: isWonderkid,
            isHistorical: false,
            retired: false,
            intakeYear: this.currentYear,
            stats: make_stats(startingOvr, pos),
            traits: isWonderkid ? ["✨ 원더키드 (생성선수)", "폭발적인 성장세"] : ["🌱 유스 아카데미 콜업 (생성선수)"]
        };

        PLAYERS.push(newgenObj);
        PLAYER_MAP[newgenId] = newgenObj;
        return newgenObj;
    }

    ensureClubSquadSize(c) {
        if (!c || c.isHistoricalTeam || c.league === 'legends') return;

        // Filter out any retired or missing IDs
        c.starters = (c.starters || []).filter(id => PLAYER_MAP[id] && !PLAYER_MAP[id].retired);
        c.bench = (c.bench || []).filter(id => PLAYER_MAP[id] && !PLAYER_MAP[id].retired);

        // Promote from bench to starters until 11 starters
        while (c.starters.length < 11 && c.bench.length > 0) {
            c.starters.push(c.bench.shift());
        }

        // If still under 11 starters, generate Newgens directly into starters
        while (c.starters.length < 11) {
            const neededPos = c.starters.length === 0 ? "GK" : null;
            const ng = this.createSingleNewgenForClub(c, neededPos, c.starters.length);
            c.starters.push(ng.id);
        }

        // Ensure at least 3 bench players
        while (c.bench.length < 3) {
            const ng = this.createSingleNewgenForClub(c, null, 20 + c.bench.length);
            c.bench.push(ng.id);
        }
    }

    generateSeasonalNewgens() {
        const newgenHeadlines = [];

        CLUBS.forEach(c => {
            if (c.isHistoricalTeam || c.league === 'legends' || c.league === 'national') return;

            const count = Math.random() < 0.55 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                const newgenObj = this.createSingleNewgenForClub(c, null, i);
                c.bench.push(newgenObj.id);

                if (newgenObj.isWonderkid) {
                    newgenHeadlines.push(`✨ [원더키드 탄생] ${c.name} 아카데미에서 괴물 생성선수 ${newgenObj.koreanName} (${newgenObj.pos}, ${newgenObj.age}세, OVR ${newgenObj.ovr} / POT ${newgenObj.pot}) 선수가 프로 데뷔했습니다!`);
                }
            }
            this.ensureClubSquadSize(c);
        });

        return newgenHeadlines;
    }
}

if (typeof window !== 'undefined') {
    window.CareerEngine = CareerEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CareerEngine };
}
