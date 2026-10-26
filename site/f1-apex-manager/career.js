// =========================================================================
// F1 APEX MOTORSPORT MANAGER - TEAM PRINCIPAL & CAREER LOGIC
// Handles 10-Round Season Calendar, R&D Tech Tree, Driver Market,
// Qualifying Q1/Q2/Q3 Simulator, FIA Points, Sponsors & LocalStorage Save
// =========================================================================

class F1CareerManager {
    constructor() {
        this.saveKey = 'F1_APEX_MANAGER_SAVE_V1';
        this.state = null;
        this.initOrLoad();
    }

    initOrLoad() {
        const saved = localStorage.getItem(this.saveKey);
        if (saved) {
            try {
                this.state = JSON.parse(saved);
                this.syncStateWithDatabase();
                return;
            } catch (e) {
                console.warn('Save data corrupted, creating fresh season.');
            }
        }
        this.createNewCareer('ferrari');
    }

    createNewCareer(selectedTeamId = 'ferrari') {
        const teamsCopy = JSON.parse(JSON.stringify(window.F1Data.teams));
        const driversCopy = JSON.parse(JSON.stringify(window.F1Data.drivers));

        const rdProgress = {};
        teamsCopy.forEach(t => {
            rdProgress[t.id] = {
                aero: 0,
                powertrain: 0,
                chassis: 0,
                durability: 0
            };
        });

        this.state = {
            seasonYear: 2025,
            currentRoundIndex: 0, // 0 to 9 (10 iconic GPs)
            playerTeamId: selectedTeamId,
            teams: teamsCopy,
            drivers: driversCopy,
            rdProgress,
            constructorPoints: {},
            raceHistory: [],
            qualifyingGrid: null,
            startingTires: {},
            selectedLaps: 5,
            driveControlMode: 'MANUAL', // 'MANUAL' (Drive + Pit Wall) or 'DIRECTOR' (Pit Wall Only)
            inboxMessages: [
                {
                    id: 1,
                    sender: 'FIA 레이스 디렉터',
                    title: '2025 FIA 포뮬러 원 월드 챔피언십 개막 안내',
                    date: 'Round 1 바레인 GP 앞두고',
                    body: '신임 팀 프린시펄 취임을 환영합니다! 사키르 야간 서킷에서 개막전이 펼쳐집니다. R&D 센터에서 첫 기술 업그레이드를 검토하고 예선(Qualifying)에 돌입하십시오.'
                },
                {
                    id: 2,
                    sender: '수석 테크니컬 디렉터',
                    title: '풍동(Wind Tunnel) 및 CFD 할당량 보고',
                    date: '기술부 브리핑',
                    body: '현재 예산 상한제(Cost Cap) 여유 자금이 확보되어 있습니다. 에어로다이내믹 또는 파워트레인 부서에 즉각 투자하면 이번 주말 그랑프리부터 랩타임 단축 효과를 볼 수 있습니다.'
                }
            ]
        };

        teamsCopy.forEach(t => {
            this.state.constructorPoints[t.id] = { points: 0, wins: 0, podiums: 0 };
        });

        this.save();
    }

    syncStateWithDatabase() {
        // Ensure any newly added properties exist
        if (!this.state.selectedLaps) this.state.selectedLaps = 5;
        if (!this.state.driveControlMode) this.state.driveControlMode = 'MANUAL';
        if (!this.state.startingTires) this.state.startingTires = {};
    }

    save() {
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(this.state));
        } catch (e) {}
    }

    changePlayerTeam(teamId) {
        const exists = this.state.teams.find(t => t.id === teamId);
        if (!exists) return false;
        this.state.playerTeamId = teamId;
        this.state.qualifyingGrid = null;
        this.addInboxMessage(
            '구단 이사회 (Board of Directors)',
            `${exists.name} 팀 프린시펄 부임 공식 발표`,
            `오늘부로 당신은 ${exists.name}의 전권을 쥔 총감독(Team Principal)으로 부임했습니다. 컨스트럭터 및 드라이버 월드 챔피언십 트로피를 가져오십시오!`
        );
        this.save();
        return true;
    }

    getPlayerTeam() {
        return this.state.teams.find(t => t.id === this.state.playerTeamId) || this.state.teams[0];
    }

    getTeamById(teamId) {
        return this.state.teams.find(t => t.id === teamId);
    }

    getTeamDrivers(teamId) {
        return this.state.drivers
            .filter(d => d.teamId === teamId)
            .sort((a, b) => a.role - b.role);
    }

    getActiveGridDrivers() {
        return this.state.drivers.filter(d => d.teamId !== null);
    }

    getFreeAgentDrivers() {
        return this.state.drivers.filter(d => d.teamId === null).sort((a, b) => b.ovr - a.ovr);
    }

    getCurrentCircuit() {
        const idx = Math.min(this.state.currentRoundIndex, window.F1Data.circuits.length - 1);
        return window.F1Data.circuits[idx];
    }

    addInboxMessage(sender, title, body) {
        const circuit = this.getCurrentCircuit();
        this.state.inboxMessages.unshift({
            id: Date.now() + Math.random(),
            sender,
            title,
            date: `${this.state.seasonYear} R${circuit.round} ${circuit.shortName || circuit.name}`,
            body
        });
        if (this.state.inboxMessages.length > 25) {
            this.state.inboxMessages.pop();
        }
    }

    // R&D Department Upgrade Purchase
    purchaseRdUpgrade(branchKey) {
        const team = this.getPlayerTeam();
        const currentLvl = this.state.rdProgress[team.id][branchKey] || 0;
        const branchData = window.F1Data.rdTree[branchKey];
        if (!branchData || currentLvl >= branchData.upgrades.length) {
            return { ok: false, msg: '이미 최고 등급(Tier 5) 마스터피스 기술에 도달했습니다!' };
        }

        const nextUpgrade = branchData.upgrades[currentLvl];
        if (team.budget < nextUpgrade.cost) {
            return { ok: false, msg: `예산(Cost Cap)이 부족합니다! 필요 자금: $${(nextUpgrade.cost / 1000000).toFixed(1)}M` };
        }

        team.budget -= nextUpgrade.cost;
        this.state.rdProgress[team.id][branchKey] = currentLvl + 1;
        team.specs[branchKey] = Math.min(100, team.specs[branchKey] + nextUpgrade.gain);

        window.f1Audio.playUiClick(true);
        this.addInboxMessage(
            'R&D 팩토리 엔지니어링',
            `[${nextUpgrade.name}] 파츠 개발 및 풍동 검증 완료!`,
            `${team.shortName} 차량의 ${branchData.name} 스펙이 +${nextUpgrade.gain} 상승하여 [${team.specs[branchKey]}]에 도달했습니다!`
        );
        this.save();
        return { ok: true, msg: `[${nextUpgrade.name}] 개발 완료! (${branchData.name} +${nextUpgrade.gain})` };
    }

    // Facility Upgrade (Wind Tunnel, CFD, Simulator, Pit Crew)
    upgradeFacility(facilityKey) {
        const team = this.getPlayerTeam();
        if (facilityKey === 'pitCrew') {
            const cost = 5500000;
            if (team.facilities.pitCrew >= 99) return { ok: false, msg: '피트크루 숙련도가 이미 세계 최고(99)입니다!' };
            if (team.budget < cost) return { ok: false, msg: '예산이 부족합니다 ($5.5M 필요).' };
            team.budget -= cost;
            team.facilities.pitCrew = Math.min(99, team.facilities.pitCrew + 2);
            team.specs.durability = Math.min(100, team.specs.durability + 1);
            window.f1Audio.playUiClick(true);
            this.save();
            return { ok: true, msg: `피트크루 휠건 훈련 완료! 숙련도 ${team.facilities.pitCrew} 달성!` };
        }

        const curLvl = team.facilities[facilityKey] || 1;
        if (curLvl >= 5) return { ok: false, msg: '이미 최고 레벨(Lv.5) 시설입니다!' };
        const cost = curLvl * 6000000;
        if (team.budget < cost) return { ok: false, msg: `예산이 부족합니다 ($${(cost / 1e6).toFixed(1)}M 필요).` };

        team.budget -= cost;
        team.facilities[facilityKey] = curLvl + 1;
        team. specs.aero = Math.min(100, team.specs.aero + 1);
        team.specs.chassis = Math.min(100, team.specs.chassis + 1);
        window.f1Audio.playUiClick(true);
        this.save();
        return { ok: true, msg: `팩토리 시설 레벨 ${curLvl + 1} 증축 완료! 전 부서 효율 상승!` };
    }

    // Driver Contract & Transfer Negotiation (Sign Free Agent or Poach Rival Driver)
    signDriverToSeat(targetDriverId, seatRole = 2) {
        const team = this.getPlayerTeam();
        const targetDriver = this.state.drivers.find(d => d.id === targetDriverId);
        if (!targetDriver) return { ok: false, msg: '드라이버를 찾을 수 없습니다.' };
        if (targetDriver.teamId === team.id) return { ok: false, msg: '이미 우리 팀 소속 드라이버입니다.' };

        const currentDrivers = this.getTeamDrivers(team.id);
        const outgoingDriver = currentDrivers.find(d => d.role === seatRole) || currentDrivers[currentDrivers.length - 1];

        // Calculate buyout fee if poaching from another team
        const buyoutCost = targetDriver.teamId ? targetDriver.salary * 6 : targetDriver.salary * 2;
        if (team.budget < buyoutCost) {
            return {
                ok: false,
                msg: `바이아웃 및 계약금($${(buyoutCost / 1000000).toFixed(2)}M)이 부족합니다!`
            };
        }

        team.budget -= buyoutCost;
        const previousTeamId = targetDriver.teamId;

        // Swap seats cleanly so all 10 teams always have 2 drivers
        if (outgoingDriver) {
            outgoingDriver.teamId = previousTeamId;
            outgoingDriver.role = previousTeamId ? targetDriver.role : 0;
        }

        targetDriver.teamId = team.id;
        targetDriver.role = seatRole;
        targetDriver.morale = 96;
        this.state.qualifyingGrid = null;

        window.f1Audio.playUiClick(true);
        this.addInboxMessage(
            '드라이버 계약 부서',
            `🚨 블록버스터 영입: ${targetDriver.name} (${targetDriver.code}) 합류!`,
            `${team.name}가 $${(buyoutCost / 1000000).toFixed(2)}M의 바이아웃 계약금으로 ${targetDriver.name}(OVR ${targetDriver.ovr})을 Car #${seatRole} 시트에 전격 영입했습니다!`
        );
        this.save();
        return {
            ok: true,
            msg: `${targetDriver.name} 영입 완료! (${outgoingDriver ? outgoingDriver.name + ' 교체' : '시트 배정'})`
        };
    }

    // Simulate Qualifying Session (Q1 / Q2 / Q3 Flying Lap Shootout)
    runQualifyingSession(playerFlyingLapSetup = 'BALANCED') {
        const circuit = this.getCurrentCircuit();
        const activeDrivers = this.getActiveGridDrivers();

        const results = activeDrivers.map(driver => {
            const team = this.getTeamById(driver.teamId);
            const aeroWeight = circuit.aeroImportance;
            const powerWeight = circuit.powerImportance;

            const carPerf =
                team.specs.aero * aeroWeight +
                team.specs.powertrain * powerWeight +
                team.specs.chassis * 0.25;

            const driverQualiSkill = driver.pace * 0.75 + driver.awareness * 0.25;

            // Player setup risk/reward bonus
            let setupDelta = 0;
            if (driver.teamId === this.state.playerTeamId) {
                if (playerFlyingLapSetup === 'MAX_ATTACK') {
                    // High risk: can gain -0.35s or make a small lockup (+0.25s)
                    setupDelta = (Math.random() < 0.72) ? -0.32 : 0.22;
                } else if (playerFlyingLapSetup === 'LOW_DRAG') {
                    setupDelta = circuit.powerImportance >= 0.5 ? -0.24 : 0.08;
                } else if (playerFlyingLapSetup === 'HIGH_DOWNFORCE') {
                    setupDelta = circuit.aeroImportance >= 0.55 ? -0.24 : 0.08;
                }
            }

            // Calculate simulated flying lap time in seconds
            const perfPenalty = (120 - carPerf) * 0.085 + (100 - driverQualiSkill) * 0.045;
            const randomVariance = (Math.random() - 0.5) * 0.34;
            const lapTime = +(circuit.baseLapTime + perfPenalty + setupDelta + randomVariance).toFixed(3);

            return {
                driverId: driver.id,
                driver,
                team,
                lapTime,
                sector1: +(lapTime * 0.31 + (Math.random() - 0.5) * 0.05).toFixed(3),
                sector2: +(lapTime * 0.38 + (Math.random() - 0.5) * 0.05).toFixed(3),
                sector3: +(lapTime * 0.31).toFixed(3)
            };
        });

        results.sort((a, b) => a.lapTime - b.lapTime);
        const poleTime = results[0].lapTime;
        results.forEach((r, idx) => {
            r.gridPos = idx + 1;
            r.gapToPole = idx === 0 ? 'POLE' : `+${(r.lapTime - poleTime).toFixed(3)}s`;
        });

        // Award Pole Position stat
        const poleDriver = this.state.drivers.find(d => d.id === results[0].driverId);
        if (poleDriver) poleDriver.poles = (poleDriver.poles || 0) + 1;

        this.state.qualifyingGrid = results;

        // Default starting tires
        this.state.startingTires = {};
        results.forEach((r, idx) => {
            this.state.startingTires[r.driverId] = idx < 10 ? 'SOFT' : 'MEDIUM';
        });

        this.save();
        return results;
    }

    getOrderedStartingGridDrivers() {
        if (this.state.qualifyingGrid && this.state.qualifyingGrid.length === 20) {
            return this.state.qualifyingGrid.map(q => this.state.drivers.find(d => d.id === q.driverId)).filter(Boolean);
        }
        // If player skipped Qualifying, order by combined Car + Driver rating
        const active = this.getActiveGridDrivers();
        return active.sort((a, b) => {
            const ta = this.getTeamById(a.teamId);
            const tb = this.getTeamById(b.teamId);
            const scoreA = (ta.specs.aero + ta.specs.powertrain) * 0.5 + a.ovr;
            const scoreB = (tb.specs.aero + tb.specs.powertrain) * 0.5 + b.ovr;
            return scoreB - scoreA;
        });
    }

    // Process Grand Prix Classification, FIA Points, Prize Money & AI R&D Progression
    processRaceResults(orderedCars) {
        const circuit = this.getCurrentCircuit();
        const pointsTable = window.F1Data.pointsTable;

        // Determine Fastest Lap winner inside Top 10
        let fastestCar = null;
        orderedCars.forEach(c => {
            if (!fastestCar || c.bestLapTime < fastestCar.bestLapTime) {
                fastestCar = c;
            }
        });

        const summaryRows = [];
        let playerTeamPointsThisRace = 0;
        let bestPlayerFinish = 20;

        orderedCars.forEach((car, idx) => {
            const pos = idx + 1;
            const dRecord = this.state.drivers.find(d => d.id === car.driver.id);
            let pts = pos <= 10 ? pointsTable[pos - 1] : 0;
            const hasFastestLap = (fastestCar && fastestCar.driver.id === car.driver.id && pos <= 10);
            if (hasFastestLap) pts += 1;

            if (dRecord) {
                dRecord.points += pts;
                if (pos === 1) dRecord.wins++;
                if (pos <= 3) dRecord.podiums++;
            }

            const cStats = this.state.constructorPoints[car.team.id];
            if (cStats) {
                cStats.points += pts;
                if (pos === 1) cStats.wins++;
                if (pos <= 3) cStats.podiums++;
            }

            if (car.team.id === this.state.playerTeamId) {
                playerTeamPointsThisRace += pts;
                if (pos < bestPlayerFinish) bestPlayerFinish = pos;
            }

            summaryRows.push({
                position: pos,
                driverId: car.driver.id,
                driverName: car.driver.name,
                driverCode: car.driver.code,
                teamId: car.team.id,
                teamName: car.team.shortName,
                teamColor: car.team.primaryColor,
                gridPosition: car.gridPosition,
                tireCompound: car.tireCompound,
                pitStops: car.pitStopsCount,
                bestLap: car.bestLapTime < 900 ? `${car.bestLapTime.toFixed(3)}s` : `${(circuit.baseLapTime + idx * 0.25).toFixed(3)}s`,
                gap: pos === 1 ? 'WINNER' : `+${car.gapToLeader.toFixed(3)}s`,
                points: pts,
                hasFastestLap
            });
        });

        // Sponsor & FIA Prize Payout Calculation for Player Team
        const playerTeam = this.getPlayerTeam();
        const titleSponsor = playerTeam.sponsors.title;
        let baseSponsorIncome = titleSponsor.payoutPerRace;
        playerTeam.sponsors.secondary.forEach(s => { baseSponsorIncome += s.payoutPerRace; });

        const goalAchieved = bestPlayerFinish <= titleSponsor.bonusTarget;
        const sponsorBonus = goalAchieved ? titleSponsor.bonusAmount : 0;
        const pointsPrize = playerTeamPointsThisRace * 180000;

        const driverSalaries = this.getTeamDrivers(playerTeam.id).reduce((acc, d) => acc + d.salary, 0);
        const netRevenue = baseSponsorIncome + sponsorBonus + pointsPrize - driverSalaries;
        playerTeam.budget += netRevenue;

        // AI Teams also upgrade their cars slightly between rounds
        this.state.teams.forEach(t => {
            if (t.id !== this.state.playerTeamId && Math.random() < 0.45) {
                const keys = ['aero', 'powertrain', 'chassis', 'durability'];
                const k = keys[Math.floor(Math.random() * keys.length)];
                t.specs[k] = Math.min(99, t.specs[k] + 1);
            }
        });

        // Save Race History
        this.state.raceHistory.push({
            round: circuit.round,
            circuitName: circuit.name,
            winnerName: summaryRows[0].driverName,
            winnerTeam: summaryRows[0].teamName,
            playerPoints: playerTeamPointsThisRace,
            bestPlayerFinish,
            netRevenue
        });

        this.addInboxMessage(
            '재무 & 스폰서십 본부',
            `R${circuit.round} ${circuit.name} 정산 및 스폰서 보너스 입금`,
            `이번 그랑프리에서 ${playerTeam.shortName}는 최고 P${bestPlayerFinish} 피니시(${playerTeamPointsThisRace} pts)를 기록했습니다. 스폰서 수익 및 FIA 포인트 배당금 합산 순수익 +$${(netRevenue / 1000000).toFixed(2)}M가 구단 예산에 반영되었습니다.`
        );

        // Advance Calendar Round
        this.state.qualifyingGrid = null;
        if (this.state.currentRoundIndex < window.F1Data.circuits.length - 1) {
            this.state.currentRoundIndex++;
        } else {
            // Season Finale Completed -> Roll over to new season!
            this.completeSeasonAndRollOver();
        }

        this.save();

        return {
            circuit,
            summaryRows,
            playerTeamPointsThisRace,
            bestPlayerFinish,
            goalAchieved,
            baseSponsorIncome,
            sponsorBonus,
            pointsPrize,
            driverSalaries,
            netRevenue
        };
    }

    completeSeasonAndRollOver() {
        const sortedDrivers = [...this.state.drivers].sort((a, b) => b.points - a.points);
        const champDriver = sortedDrivers[0];
        this.state.seasonYear++;
        this.state.currentRoundIndex = 0;

        this.addInboxMessage(
            '🏆 FIA 월드 모터스포츠 평의회',
            `${this.state.seasonYear - 1} 시즌 월드 챔피언십 최종 결과 & 신시즌 개막!`,
            `드라이버 월드 챔피언에 [${champDriver.name} (${champDriver.points} pts)]가 등극했습니다! FIA 챔피언십 상금이 지급되었으며 ${this.state.seasonYear} 신규 시즌 캘린더가 시작됩니다.`
        );

        // Reset seasonal points while keeping R&D specs and career wins
        this.state.drivers.forEach(d => { d.points = 0; });
        Object.keys(this.state.constructorPoints).forEach(tid => {
            this.state.constructorPoints[tid].points = 0;
        });
    }
}

window.f1Career = new F1CareerManager();
