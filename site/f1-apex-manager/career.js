// ============================================================================
// F1 MANAGER & 3D GRAND PRIX SIMULATOR - SEASON CAREER, CAR TUNING,
// SAVE SLOTS (1~3) & JSON FILE EXPORT/IMPORT SYSTEM
// ============================================================================

class F1SeasonCareer {
    constructor() {
        this.saveKey = 'F1_WORLD_CHAMPIONSHIP_SAVE_V3';
        this.slotPrefix = 'F1_SAVE_SLOT_';
        this.state = null;
        this.loadOrCreate();
    }

    hasExistingSave() {
        return !!localStorage.getItem(this.saveKey);
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
        this.startNewSeason('ferrari', 'FULL');
    }

    ensureFields() {
        if (!this.state.raceFormat) this.state.raceFormat = 'FULL';
        if (!this.state.driveControlMode) this.state.driveControlMode = 'MANUAL';
        if (!this.state.startingTires) this.state.startingTires = {};
        if (!this.state.driverRoundResults) this.state.driverRoundResults = {};
        if (!this.state.tuning) {
            this.state.tuning = JSON.parse(JSON.stringify(window.F1Data.defaultTuning));
        }
    }

    startNewSeason(teamId = 'ferrari', raceFormat = 'FULL') {
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
            raceFormat: raceFormat || 'FULL', // Default 100% Real FIA Laps
            driveControlMode: 'MANUAL',
            tuning: JSON.parse(JSON.stringify(window.F1Data.defaultTuning)),
            teams,
            drivers,
            rdLevels,
            constructorStats,
            driverRoundResults,
            qualifyingOrder: null,
            startingTires: {},
            completedRounds: [],
            lastSavedAt: new Date().toLocaleString('ko-KR')
        };

        this.save();
    }

    save() {
        try {
            this.state.lastSavedAt = new Date().toLocaleString('ko-KR');
            localStorage.setItem(this.saveKey, JSON.stringify(this.state));
        } catch (e) {}
    }

    // Save/Load to 3 Named LocalStorage Slots
    saveToSlot(slotNum = 1) {
        this.save();
        try {
            localStorage.setItem(`${this.slotPrefix}${slotNum}`, JSON.stringify(this.state));
            return { ok: true, msg: `슬롯 #${slotNum}에 현재 시즌 데이터가 저장되었습니다. (${this.state.lastSavedAt})` };
        } catch (e) {
            return { ok: false, msg: '슬롯 저장 실패' };
        }
    }

    loadFromSlot(slotNum = 1) {
        const raw = localStorage.getItem(`${this.slotPrefix}${slotNum}`);
        if (!raw) return { ok: false, msg: `슬롯 #${slotNum}에 저장된 데이터가 없습니다.` };
        try {
            this.state = JSON.parse(raw);
            this.ensureFields();
            this.save();
            return { ok: true, msg: `슬롯 #${slotNum} 데이터를 성공적으로 불러왔습니다!` };
        } catch (e) {
            return { ok: false, msg: '슬롯 데이터 파싱 오류' };
        }
    }

    getSlotMeta(slotNum = 1) {
        const raw = localStorage.getItem(`${this.slotPrefix}${slotNum}`);
        if (!raw) return null;
        try {
            const d = JSON.parse(raw);
            const team = d.teams.find(t => t.id === d.playerTeamId);
            const circuit = window.F1Data.circuits[Math.min(d.currentRoundIndex || 0, 23)];
            return {
                slotNum,
                teamName: team ? team.name : d.playerTeamId,
                seasonYear: d.seasonYear,
                roundStr: `R${circuit.round}/24 ${circuit.name}`,
                budgetStr: team ? `$${(team.budget / 1e6).toFixed(1)}M` : '',
                savedAt: d.lastSavedAt || '-'
            };
        } catch (e) {
            return null;
        }
    }

    // Export Save State as Downloadable .json File
    exportSaveToFile() {
        this.save();
        const team = this.getPlayerTeam();
        const c = this.getCurrentCircuit();
        const filename = `F1_Save_${this.state.seasonYear}_R${c.round}_${team.code}.json`;
        const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return filename;
    }

    // Import Save State from Uploaded .json File
    importSaveFromJsonString(jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            if (!parsed || !parsed.teams || !parsed.drivers) {
                return { ok: false, msg: '유효하지 않은 F1 세이브 파일입니다.' };
            }
            this.state = parsed;
            this.ensureFields();
            this.save();
            return { ok: true, msg: `세이브 파일 로드 완료! (${this.getPlayerTeam().name} • R${this.getCurrentCircuit().round})` };
        } catch (e) {
            return { ok: false, msg: '세이브 파일 JSON 형식이 올바르지 않습니다.' };
        }
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

    // Calculate Dynamic Dyno & Wind Tunnel Performance Preview for R&D Shakedown Bench
    computeDynoTelemetry(circuit = this.getCurrentCircuit(), compoundKey = 'SOFT') {
        const team = this.getPlayerTeam();
        const t = this.state.tuning || window.F1Data.defaultTuning;
        const comp = window.F1Data.tireCompounds[compoundKey] || window.F1Data.tireCompounds.SOFT;

        const wingAvg = (t.frontWingAngle + t.rearWingAngle) * 0.5; // 1..11 (6 neutral)
        const effAero = Math.min(105, Math.max(70, team.specs.aero + (wingAvg - 6) * 1.5));
        const effPower = Math.min(105, Math.max(70, team.specs.powertrain - (wingAvg - 6) * 1.2));

        const topSpeedKmh = +(334 + (effPower - 85) * 1.25 - (wingAvg - 6) * 1.8).toFixed(1);
        const topSpeedDrsKmh = +(topSpeedKmh + 14.5).toFixed(1);
        const corneringG = +(4.2 + (effAero - 80) * 0.055 + (t.suspensionStiffness - 5) * 0.03).toFixed(2);
        const zeroTo200Sec = +(4.45 - (effPower - 85) * 0.025).toFixed(2);
        const braking100To0Meters = +(29.5 - (effAero - 85) * 0.12 - Math.abs(57 - t.brakeBias) * 0.15).toFixed(1);

        // Ideal Wing angle for current circuit
        const idealWingForCircuit = +(2 + circuit.aeroWeight * 9).toFixed(1);
        const wingMismatchPenalty = Math.abs(wingAvg - idealWingForCircuit) * 0.09;

        const predictedLapSec = +(
            circuit.baseLapTime +
            (96 - team.specs.aero) * 0.09 +
            (96 - team.specs.powertrain) * 0.08 +
            comp.paceDelta +
            wingMismatchPenalty
        ).toFixed(3);

        const wearPerLapPct = +(
            comp.baseWearPerLap *
            circuit.tireWearRate *
            (1.12 - (team.specs.chassis / 100) * 0.22) *
            (1.0 + (t.suspensionStiffness - 5) * 0.025 + Math.abs(t.tirePressurePsi - 22.5) * 0.04)
        ).toFixed(2);

        const estimatedStintLaps = Math.max(5, Math.floor(72 / wearPerLapPct));

        return {
            effAero: Math.round(effAero),
            effPower: Math.round(effPower),
            topSpeedKmh,
            topSpeedDrsKmh,
            corneringG,
            zeroTo200Sec,
            braking100To0Meters,
            idealWingForCircuit,
            predictedLapSec,
            predictedLapStr: this.formatLapTime(predictedLapSec),
            wearPerLapPct,
            estimatedStintLaps
        };
    }

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
                const dyno = this.computeDynoTelemetry(circuit, 'SOFT');
                const wingAvg = (this.state.tuning.frontWingAngle + this.state.tuning.rearWingAngle) * 0.5;
                setupBonus = -Math.max(-0.25, 0.25 - Math.abs(wingAvg - dyno.idealWingForCircuit) * 0.08);
                if (setupMode === 'QUALIFYING_TRIM') setupBonus -= 0.15;
            }

            const delta = (118 - carScore) * 0.082 + (100 - drvScore) * 0.044;
            const rng = (Math.random() - 0.5) * 0.28;
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

    recordGrandPrixClassification(orderedCars) {
        const circuit = this.getCurrentCircuit();
        const ptsTable = window.F1Data.pointsTable;

        let fastestCar = null;
        orderedCars.forEach(c => {
            if (!c.dnf && (!fastestCar || c.bestLapTime < fastestCar.bestLapTime)) fastestCar = c;
        });

        const classification = [];
        let playerPtsEarned = 0;
        let playerBestPos = 20;

        orderedCars.forEach((car, idx) => {
            const pos = idx + 1;
            const drv = this.state.drivers.find(d => d.id === car.driver.id);
            let pts = (!car.dnf && pos <= 10) ? ptsTable[pos - 1] : 0;
            const isFL = (!car.dnf && fastestCar && fastestCar.driver.id === car.driver.id && pos <= 10);
            if (isFL) {
                pts += 1;
                if (drv) drv.fastestLaps = (drv.fastestLaps || 0) + 1;
            }

            if (drv) {
                drv.points += pts;
                if (!car.dnf && pos === 1) drv.wins++;
                if (!car.dnf && pos <= 3) drv.podiums++;
                if (!this.state.driverRoundResults[drv.id]) this.state.driverRoundResults[drv.id] = {};
                this.state.driverRoundResults[drv.id][circuit.round] = { pos: car.dnf ? 'DNF' : pos, pts, isFL };
            }

            const cStat = this.state.constructorStats[car.team.id];
            if (cStat) {
                cStat.points += pts;
                if (!car.dnf && pos === 1) cStat.wins++;
                if (!car.dnf && pos <= 3) cStat.podiums++;
            }

            if (car.team.id === this.state.playerTeamId) {
                playerPtsEarned += pts;
                if (!car.dnf && pos < playerBestPos) playerBestPos = pos;
            }

            classification.push({
                pos: car.dnf ? 'DNF' : pos,
                driverId: car.driver.id,
                code: car.driver.code,
                name: car.driver.name,
                korName: car.driver.korName,
                teamId: car.team.id,
                teamName: car.team.shortName,
                teamColor: car.team.primaryColor,
                gridPos: car.gridPosition,
                stints: car.stintHistory,
                pits: car.pitStops,
                bestLapStr: car.dnf ? '-' : this.formatLapTime(car.bestLapTime < 400 ? car.bestLapTime : circuit.baseLapTime + idx * 0.25),
                gapStr: car.dnf ? `DNF (${car.dnfReason})` : (pos === 1 ? 'WINNER' : `+${car.gapToLeader.toFixed(3)}s`),
                pts,
                isFL
            });
        });

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
