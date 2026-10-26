// ============================================================================
// F1 MANAGER & LIVE TELEMETRY SIMULATOR - 24-RACE SEASON & CAREER CONTROLLER
// Full 24-Round FIA Championship, Round-by-Round Points Matrix, Q1/Q2/Q3,
// R&D Wind Tunnel Engineering, Driver Contracts & Cost Cap Ledger
// ============================================================================

class F1SeasonCareer {
    constructor() {
        this.saveKey = 'F1_WORLD_CHAMPIONSHIP_SAVE_V2';
        this.state = null;
        this.loadOrCreate();
    }

    loadOrCreate() {
        const raw = localStorage.getItem(this.saveKey);
        if (raw) {
            try {
                this.state = JSON.parse(raw);
                if (this.state && this.state.teams && this.state.drivers) {
                    this.ensureFields();
                    return;
                }
            } catch (e) {}
        }
        this.startNewSeason('ferrari');
    }

    ensureFields() {
        if (!this.state.raceFormat) this.state.raceFormat = 'SPRINT';
        if (!this.state.driveControlMode) this.state.driveControlMode = 'MANUAL';
        if (!this.state.startingTires) this.state.startingTires = {};
        if (!this.state.driverRoundResults) this.state.driverRoundResults = {};
    }

    startNewSeason(teamId = 'ferrari') {
        const teams = JSON.parse(JSON.stringify(window.F1Data.teams));
        const drivers = JSON.parse(JSON.stringify(window.F1Data.drivers));

        drivers.forEach(d => {
            d.points = 0;
            d.wins = 0;
            d.podiums = 0;
            d.poles = 0;
            d.fastestLaps = 0;
        });

        const rdLevels = {};
        const constructorStats = {};
        teams.forEach(t => {
            rdLevels[t.id] = { aero: 0, powertrain: 0, chassis: 0, durability: 0 };
            constructorStats[t.id] = { points: 0, wins: 0, podiums: 0 };
        });

        const driverRoundResults = {};
        drivers.forEach(d => { driverRoundResults[d.id] = {}; });

        this.state = {
            seasonYear: 2025,
            currentRoundIndex: 0, // 0..23 (24 Official Grands Prix)
            playerTeamId: teamId,
            raceFormat: 'SPRINT', // 'QUICK' (5L), 'SPRINT' (25%), 'HALF' (50%), 'FULL' (100% Real Laps)
            driveControlMode: 'MANUAL',
            teams,
            drivers,
            rdLevels,
            constructorStats,
            driverRoundResults,
            qualifyingOrder: null,
            startingTires: {},
            completedRounds: [],
            financeLog: []
        };

        this.save();
    }

    save() {
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(this.state));
        } catch (e) {}
    }

    setPlayerTeam(teamId) {
        const found = this.state.teams.find(t => t.id === teamId);
        if (!found) return false;
        this.state.playerTeamId = teamId;
        this.state.qualifyingOrder = null;
        this.save();
        return true;
    }

    getPlayerTeam() {
        return this.state.teams.find(t => t.id === this.state.playerTeamId) || this.state.teams[0];
    }

    getTeam(teamId) {
        return this.state.teams.find(t => t.id === teamId);
    }

    getTeamDrivers(teamId) {
        return this.state.drivers.filter(d => d.teamId === teamId).sort((a, b) => a.role - b.role);
    }

    getActiveGridDrivers() {
        return this.state.drivers.filter(d => d.teamId !== null);
    }

    getCurrentCircuit() {
        const idx = Math.min(this.state.currentRoundIndex, window.F1Data.circuits.length - 1);
        return window.F1Data.circuits[idx];
    }

    formatLapTime(sec) {
        if (!sec || sec > 500) return '-';
        const mins = Math.floor(sec / 60);
        const rem = (sec - mins * 60).toFixed(3);
        return `${mins}:${rem.padStart(6, '0')}`;
    }

    // Q1 / Q2 / Q3 Qualifying Simulation
    simulateQualifying(setupMode = 'BALANCED') {
        const circuit = this.getCurrentCircuit();
        const active = this.getActiveGridDrivers();

        const rows = active.map(d => {
            const team = this.getTeam(d.teamId);
            const carScore =
                team.specs.aero * circuit.aeroWeight +
                team.specs.powertrain * circuit.powerWeight +
                team.specs.chassis * 0.25;
            const drvScore = d.pace * 0.78 + d.consistency * 0.22;

            let setupBonus = 0;
            if (d.teamId === this.state.playerTeamId) {
                if (setupMode === 'LOW_DRAG') setupBonus = circuit.powerWeight >= 0.5 ? -0.26 : 0.08;
                else if (setupMode === 'HIGH_DOWNFORCE') setupBonus = circuit.aeroWeight >= 0.55 ? -0.26 : 0.08;
                else if (setupMode === 'QUALIFYING_TRIM') setupBonus = Math.random() < 0.75 ? -0.34 : 0.20;
            }

            const delta = (118 - carScore) * 0.082 + (100 - drvScore) * 0.044;
            const rng = (Math.random() - 0.5) * 0.30;
            const qTime = +(circuit.baseLapTime + delta + setupBonus + rng).toFixed(3);

            return {
                driverId: d.id,
                driver: d,
                team,
                qTime,
                formattedTime: this.formatLapTime(qTime)
            };
        });

        rows.sort((a, b) => a.qTime - b.qTime);
        const pole = rows[0].qTime;
        rows.forEach((r, i) => {
            r.gridPos = i + 1;
            r.sessionEliminated = i < 10 ? 'Q3' : (i < 15 ? 'Q2' : 'Q1');
            r.gapStr = i === 0 ? 'POLE' : `+${(r.qTime - pole).toFixed(3)}s`;
        });

        const poleDrv = this.state.drivers.find(d => d.id === rows[0].driverId);
        if (poleDrv) poleDrv.poles = (poleDrv.poles || 0) + 1;

        this.state.qualifyingOrder = rows;
        this.save();
        return rows;
    }

    getStartingGridDrivers() {
        if (this.state.qualifyingOrder && this.state.qualifyingOrder.length === 20) {
            return this.state.qualifyingOrder
                .map(q => this.state.drivers.find(d => d.id === q.driverId))
                .filter(Boolean);
        }
        return this.getActiveGridDrivers().sort((a, b) => {
            const ta = this.getTeam(a.teamId);
            const tb = this.getTeam(b.teamId);
            const sa = (ta.specs.aero + ta.specs.powertrain) * 0.5 + a.ovr;
            const sb = (tb.specs.aero + tb.specs.powertrain) * 0.5 + b.ovr;
            return sb - sa;
        });
    }

    // R&D Engineering Upgrade
    developUpgrade(deptKey) {
        const team = this.getPlayerTeam();
        const curLvl = this.state.rdLevels[team.id][deptKey] || 0;
        const branch = window.F1Data.rdTree[deptKey];
        if (!branch || curLvl >= branch.upgrades.length) {
            return { ok: false, msg: '해당 부서는 이미 최종 사양(Spec 5) 개발을 완료했습니다.' };
        }
        const upg = branch.upgrades[curLvl];
        if (team.budget < upg.cost) {
            return { ok: false, msg: `Cost Cap 잔여 예산이 부족합니다 ($${(upg.cost / 1e6).toFixed(1)}M 필요).` };
        }

        team.budget -= upg.cost;
        this.state.rdLevels[team.id][deptKey] = curLvl + 1;
        team.specs[deptKey] = Math.min(100, team.specs[deptKey] + upg.gain);
        window.f1Audio.playUiClick(true);
        this.save();
        return { ok: true, msg: `[${upg.name}] 풍동 검증 및 차량 장착 완료! (${branch.code} +${upg.gain})` };
    }

    // Driver Contract Transfer
    signDriver(driverId, targetSeatRole = 2) {
        const team = this.getPlayerTeam();
        const target = this.state.drivers.find(d => d.id === driverId);
        if (!target || target.teamId === team.id) return { ok: false, msg: '영입할 수 없는 드라이버입니다.' };

        const buyout = target.teamId ? target.salary * 5 : target.salary * 2;
        if (team.budget < buyout) {
            return { ok: false, msg: `바이아웃 위약금($${(buyout / 1e6).toFixed(2)}M)이 부족합니다.` };
        }

        const currentPair = this.getTeamDrivers(team.id);
        const replaced = currentPair.find(d => d.role === targetSeatRole) || currentPair[currentPair.length - 1];
        const prevTeamId = target.teamId;
        const prevRole = target.role;

        if (replaced) {
            replaced.teamId = prevTeamId;
            replaced.role = prevTeamId ? prevRole : 0;
        }
        target.teamId = team.id;
        target.role = targetSeatRole;
        team.budget -= buyout;
        this.state.qualifyingOrder = null;

        window.f1Audio.playUiClick(true);
        this.save();
        return { ok: true, msg: `${target.korName} (${target.code}) Car #${targetSeatRole} 영입 완료!` };
    }

    // Record Grand Prix Results & Advance 24-Race Calendar
    recordGrandPrixClassification(orderedCars) {
        const circuit = this.getCurrentCircuit();
        const ptsTable = window.F1Data.pointsTable;

        let fastestCar = null;
        orderedCars.forEach(c => {
            if (!fastestCar || c.bestLapTime < fastestCar.bestLapTime) fastestCar = c;
        });

        const classification = [];
        let playerPtsEarned = 0;
        let playerBestPos = 20;

        orderedCars.forEach((car, idx) => {
            const pos = idx + 1;
            const drv = this.state.drivers.find(d => d.id === car.driver.id);
            let pts = pos <= 10 ? ptsTable[pos - 1] : 0;
            const isFL = (fastestCar && fastestCar.driver.id === car.driver.id && pos <= 10);
            if (isFL) {
                pts += 1;
                if (drv) drv.fastestLaps = (drv.fastestLaps || 0) + 1;
            }

            if (drv) {
                drv.points += pts;
                if (pos === 1) drv.wins++;
                if (pos <= 3) drv.podiums++;
                if (!this.state.driverRoundResults[drv.id]) this.state.driverRoundResults[drv.id] = {};
                this.state.driverRoundResults[drv.id][circuit.round] = { pos, pts, isFL };
            }

            const cStat = this.state.constructorStats[car.team.id];
            if (cStat) {
                cStat.points += pts;
                if (pos === 1) cStat.wins++;
                if (pos <= 3) cStat.podiums++;
            }

            if (car.team.id === this.state.playerTeamId) {
                playerPtsEarned += pts;
                if (pos < playerBestPos) playerBestPos = pos;
            }

            classification.push({
                pos,
                driverId: car.driver.id,
                code: car.driver.code,
                name: car.driver.name,
                korName: car.driver.korName,
                teamId: car.team.id,
                teamName: car.team.shortName,
                teamColor: car.team.primaryColor,
                gridPos: car.gridPosition,
                posDelta: car.gridPosition - pos,
                stints: car.stintHistory,
                pits: car.pitStops,
                bestLapStr: this.formatLapTime(car.bestLapTime < 400 ? car.bestLapTime : circuit.baseLapTime + idx * 0.25),
                gapStr: pos === 1 ? 'WINNER' : `+${car.gapToLeader.toFixed(3)}s`,
                pts,
                isFL
            });
        });

        // Sponsor & Prize Settlement
        const pTeam = this.getPlayerTeam();
        const titleSp = pTeam.sponsors.title;
        let baseIncome = titleSp.perRace;
        pTeam.sponsors.partners.forEach(p => { baseIncome += p.perRace; });

        const bonusHit = playerBestPos <= titleSp.targetPos;
        const bonusIncome = bonusHit ? titleSp.bonus : 0;
        const fiaPrize = playerPtsEarned * 185000;
        const wages = this.getTeamDrivers(pTeam.id).reduce((s, d) => s + d.salary, 0);
        const netProfit = baseIncome + bonusIncome + fiaPrize - wages;
        pTeam.budget += netProfit;

        // Rival AI R&D Progression
        this.state.teams.forEach(t => {
            if (t.id !== this.state.playerTeamId && Math.random() < 0.38) {
                const depts = ['aero', 'powertrain', 'chassis', 'durability'];
                const k = depts[Math.floor(Math.random() * depts.length)];
                t.specs[k] = Math.min(99, t.specs[k] + 1);
            }
        });

        this.state.completedRounds.push({
            round: circuit.round,
            code: circuit.code,
            name: circuit.name,
            winnerCode: classification[0].code,
            winnerName: classification[0].korName,
            winnerTeam: classification[0].teamName,
            winnerColor: classification[0].teamColor,
            playerBestPos,
            playerPtsEarned,
            netProfit
        });

        this.state.qualifyingOrder = null;

        if (this.state.currentRoundIndex < window.F1Data.circuits.length - 1) {
            this.state.currentRoundIndex++;
        } else {
            // Season Rollover after Round 24 Abu Dhabi
            this.state.seasonYear++;
            this.state.currentRoundIndex = 0;
            this.state.completedRounds = [];
            this.state.driverRoundResults = {};
            this.state.drivers.forEach(d => { d.points = 0; d.wins = 0; d.podiums = 0; });
            Object.keys(this.state.constructorStats).forEach(k => {
                this.state.constructorStats[k] = { points: 0, wins: 0, podiums: 0 };
            });
        }

        this.save();
        return {
            circuit,
            classification,
            playerPtsEarned,
            playerBestPos,
            bonusHit,
            baseIncome,
            bonusIncome,
            fiaPrize,
            wages,
            netProfit
        };
    }
}

window.f1Career = new F1SeasonCareer();
