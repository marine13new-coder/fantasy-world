// Architecture Derby Football Simulation Engine
class MatchEngine {
    constructor(homeTeam, awayTeam, options = {}) {
        this.homeTeam = JSON.parse(JSON.stringify(homeTeam));
        this.awayTeam = JSON.parse(JSON.stringify(awayTeam));
        this.options = Object.assign({
            speed: 1, // 1x, 2x, 5x, or 0 (instant)
            onMinute: null,
            onEvent: null,
            onGoal: null,
            onSkill: null,
            onComplete: null,
            pitchCanvas: null
        }, options);

        this.minute = 0;
        this.homeScore = 0;
        this.awayScore = 0;
        this.events = [];
        this.scorers = [];
        this.stats = {
            home: { shots: 0, shotsOnTarget: 0, passes: 0, passSuccess: 0, saves: 0, fouls: 0, possession: 50 },
            away: { shots: 0, shotsOnTarget: 0, passes: 0, passSuccess: 0, saves: 0, fouls: 0, possession: 50 }
        };
        this.timer = null;
        this.isFinished = false;

        this.applyManagerBuffs(this.homeTeam);
        this.applyManagerBuffs(this.awayTeam);
        this.initPlayerRatings();
    }

    applyManagerBuffs(team) {
        const mgr = team.manager;
        const buffs = {
            'corbusier': { PAS: 6, STR: 4 },
            'hadid': { SPD: 7, TEC: 5 },
            'gaudi': { POW: 6, MNT: 8 },
            'ando': { STR: 8, MNT: 6 },
            'wright': { STR: 5, PAS: 7 },
            'koolhaas': { TEC: 6, SPD: 5 },
            'mies': { STR: 8, PAS: 6 },
            'aalto': { TEC: 7, PAS: 6 },
            'kahn': { STR: 9, MNT: 7 },
            'gehry': { TEC: 8, POW: 6 },
            'foster': { SPD: 8, PAS: 6 },
            'piano': { PAS: 8, TEC: 6 },
            'niemeyer': { SPD: 8, TEC: 7 },
            'gropius': { MNT: 8, STR: 6 },
            'pei': { POW: 7, TEC: 7 },
            'tange': { POW: 8, STR: 6 },
            'calatrava': { POW: 8, SPD: 7 },
            'zumthor': { MNT: 9, STR: 7 },
            'hdm': { TEC: 8, SPD: 7 },
            'nouvel': { TEC: 8, POW: 7 },
            'kim': { MNT: 9, STR: 7 }
        };

        const currentBuff = buffs[mgr.id] || { STR: 3, PAS: 3 };
        team.startingXI.forEach(b => {
            b.buffedStats = { ...b.stats };
            for (const [statKey, bonus] of Object.entries(currentBuff)) {
                b.buffedStats[statKey] = Math.min(99, (b.buffedStats[statKey] || 75) + bonus);
            }
        });
    }

    initPlayerRatings() {
        const initList = (list) => {
            list.forEach(p => {
                p.matchRating = 6.0;
                p.matchStats = { goals: 0, assists: 0, shots: 0, saves: 0, tackles: 0, keyPasses: 0 };
            });
        };
        initList(this.homeTeam.startingXI);
        initList(this.awayTeam.startingXI);
    }

    calculateTeamPower(team) {
        const atts = team.startingXI.filter(p => p.position === 'FW');
        const mids = team.startingXI.filter(p => p.position === 'MF');
        const defs = team.startingXI.filter(p => p.position === 'DF' || p.position === 'GK');

        const avg = (arr, key) => arr.length ? arr.reduce((s, x) => s + x.buffedStats[key], 0) / arr.length : 75;

        const attPower = (avg(atts, 'POW') * 0.5 + avg(atts, 'TEC') * 0.3 + avg(atts, 'SPD') * 0.2);
        const midPower = (avg(mids, 'PAS') * 0.5 + avg(mids, 'TEC') * 0.3 + avg(mids, 'MNT') * 0.2);
        const defPower = (avg(defs, 'STR') * 0.5 + avg(defs, 'MNT') * 0.3 + avg(defs, 'SPD') * 0.2);

        return { attPower, midPower, defPower, overall: (attPower + midPower + defPower) / 3 };
    }

    start() {
        if (this.options.pitchCanvas) {
            this.options.pitchCanvas.simSpeed = this.options.speed || 1;
        }
        this.addCommentary(0, 'WHISTLE', `경기가 시작되었습니다! ${this.homeTeam.manager.name}의 [${this.homeTeam.name}] vs ${this.awayTeam.manager.name}의 [${this.awayTeam.name}] 대격돌!`);
        sounds.playWhistle(false);

        if (this.options.speed === 0) {
            // Instant simulation
            while (this.minute < 90) {
                this.step();
            }
            this.finishMatch();
        } else {
            this.runNextTick();
        }
    }

    runNextTick() {
        if (this.isFinished) return;

        const interval = Math.max(30, 260 / (this.options.speed || 1));
        this.timer = setTimeout(() => {
            this.step();
            if (this.minute < 90) {
                this.runNextTick();
            } else {
                this.finishMatch();
            }
        }, interval);
    }

    setSpeed(speed) {
        this.options.speed = speed;
        if (this.options.pitchCanvas) {
            this.options.pitchCanvas.simSpeed = speed;
        }
        if (speed === 0 && !this.isFinished) {
            clearTimeout(this.timer);
            while (this.minute < 90) {
                this.step();
            }
            this.finishMatch();
        }
    }

    step() {
        this.minute += 1;
        if (this.options.onMinute) {
            this.options.onMinute(this.minute);
        }

        // Half time whistle
        if (this.minute === 45) {
            this.addCommentary(45, 'HALF_TIME', `전반전 종료! 현재 스코어 [${this.homeScore} - ${this.awayScore}]. 양 팀 감독이 라커룸에서 건축적 전술을 재정비합니다.`);
            sounds.playWhistle(true);
            return;
        }

        // Midfield battle and possession update
        const homePwr = this.calculateTeamPower(this.homeTeam);
        const awayPwr = this.calculateTeamPower(this.awayTeam);
        const midDiff = homePwr.midPower - awayPwr.midPower;
        const homePossessionBias = 0.5 + (midDiff * 0.005);
        const isHomeAttacking = Math.random() < homePossessionBias;

        if (isHomeAttacking) {
            this.stats.home.passes += Math.floor(Math.random() * 4) + 1;
            this.stats.home.passSuccess += Math.floor(Math.random() * 3) + 1;
        } else {
            this.stats.away.passes += Math.floor(Math.random() * 4) + 1;
            this.stats.away.passSuccess += Math.floor(Math.random() * 3) + 1;
        }

        // Update overall possession percentage
        const totalPasses = (this.stats.home.passes + this.stats.away.passes) || 1;
        this.stats.home.possession = Math.round((this.stats.home.passes / totalPasses) * 100);
        this.stats.away.possession = 100 - this.stats.home.possession;

        // Chance creation probability (approx every 4~7 minutes)
        if (Math.random() < 0.24) {
            this.simulateChance(isHomeAttacking, homePwr, awayPwr);
        }
    }

    simulateChance(isHome, homePwr, awayPwr) {
        const attackTeam = isHome ? this.homeTeam : this.awayTeam;
        const defendTeam = isHome ? this.awayTeam : this.homeTeam;
        const attStats = isHome ? this.stats.home : this.stats.away;
        const defStats = isHome ? this.stats.away : this.stats.home;

        const forwards = attackTeam.startingXI.filter(p => p.position === 'FW');
        const midfielders = attackTeam.startingXI.filter(p => p.position === 'MF');
        const defenders = defendTeam.startingXI.filter(p => p.position === 'DF');
        const goalkeepers = defendTeam.startingXI.filter(p => p.position === 'GK');

        const attacker = forwards.length ? forwards[Math.floor(Math.random() * forwards.length)] : attackTeam.startingXI[0];
        const playmaker = midfielders.length ? midfielders[Math.floor(Math.random() * midfielders.length)] : attacker;
        const defender = defenders.length ? defenders[Math.floor(Math.random() * defenders.length)] : defendTeam.startingXI[1];
        const goalkeeper = goalkeepers.length ? goalkeepers[0] : defendTeam.startingXI[0];

        // Coordinate with PitchCanvas Player AI Entities
        const pc = this.options.pitchCanvas;
        let attackerEntity = null;
        let playmakerEntity = null;
        let gkEntity = null;
        if (pc) {
            const teamEntities = isHome ? pc.homePlayers : pc.awayPlayers;
            const oppEntities = isHome ? pc.awayPlayers : pc.homePlayers;
            attackerEntity = teamEntities.find(p => p.name === attacker.name) || teamEntities.find(p => p.pos === 'FW') || teamEntities[0];
            playmakerEntity = teamEntities.find(p => p.name === playmaker.name) || teamEntities.find(p => p.pos === 'MF') || teamEntities[1];
            gkEntity = oppEntities.find(p => p.pos === 'GK') || oppEntities[0];

            if (playmakerEntity && attackerEntity && playmakerEntity.id !== attackerEntity.id) {
                pc.passBall(playmakerEntity, attackerEntity, true);
            }
        }

        // Check for Special Skill Activation
        let skillTriggered = false;
        let skillBonus = 0;
        if (Math.random() < (attacker.skill.rate || 0.3)) {
            skillTriggered = true;
            skillBonus = 20;
            if (pc && attackerEntity) {
                pc.triggerAura(attackerEntity.x, attackerEntity.y, isHome ? '#c8ff00' : '#e5c158');
            }
            sounds.playSkill();
            if (this.options.onSkill) {
                this.options.onSkill(attacker, attacker.skill);
            }
            this.addCommentary(
                this.minute,
                'SKILL',
                `✨ [스킬 발동!] ${attacker.name}의 고유 비기 『${attacker.skill.name}』! ${attacker.skill.description}!`
            );
        }

        // Attacking roll vs Defending roll
        attStats.shots += 1;
        attacker.matchStats.shots += 1;
        sounds.playKick();

        const attackScore = (attacker.buffedStats.POW * 0.4 + attacker.buffedStats.TEC * 0.3 + playmaker.buffedStats.PAS * 0.3) + skillBonus + (Math.random() * 25 - 12);
        const defenseScore = (defender.buffedStats.STR * 0.4 + goalkeeper.buffedStats.STR * 0.4 + goalkeeper.buffedStats.MNT * 0.2) + (Math.random() * 25 - 12);

        if (attackScore > defenseScore + 8) {
            // GOAL!
            attStats.shotsOnTarget += 1;
            attacker.matchStats.goals += 1;
            playmaker.matchStats.keyPasses += 1;
            attacker.matchRating += 1.2;
            playmaker.matchRating += 0.5;

            if (isHome) {
                this.homeScore += 1;
            } else {
                this.awayScore += 1;
            }

            if (pc && attackerEntity) {
                pc.shootBall(attackerEntity, true, gkEntity, skillTriggered ? attacker.skill : null);
            }

            this.scorers.push({
                minute: this.minute,
                player: attacker.name,
                team: attackTeam.name,
                isHome: isHome,
                skill: skillTriggered ? attacker.skill.name : null
            });

            if (this.options.onGoal) {
                this.options.onGoal({
                    minute: this.minute,
                    player: attacker,
                    isHome: isHome,
                    homeScore: this.homeScore,
                    awayScore: this.awayScore
                });
            }

            const goalComments = [
                `⚽ GOOOOAL!! ${attacker.name}의 믿을 수 없는 궤적의 원더골! ${attackTeam.manager.name} 감독의 건축 철학이 피치 위에 완벽히 구현됩니다! (스코어: ${this.homeScore} - ${this.awayScore})`,
                `⚽ 골망이 찢어집니다! ${attacker.name}! 완벽한 구조적 밸런스로 골문 구석을 갈라놓았습니다! (스코어: ${this.homeScore} - ${this.awayScore})`,
                `⚽ 원더풀 슛! ${playmaker.name}의 설계도면 같은 패스를 받은 ${attacker.name}의 환상적인 마무리! (스코어: ${this.homeScore} - ${this.awayScore})`
            ];
            this.addCommentary(this.minute, 'GOAL', goalComments[Math.floor(Math.random() * goalComments.length)]);
        } else if (attackScore > defenseScore - 6) {
            // Shot on target, saved by Goalkeeper!
            attStats.shotsOnTarget += 1;
            defStats.saves += 1;
            goalkeeper.matchStats.saves += 1;
            goalkeeper.matchRating += 0.6;
            sounds.playSave();

            if (pc && attackerEntity) {
                pc.shootBall(attackerEntity, false, gkEntity, skillTriggered ? attacker.skill : null);
            }

            const saveComments = [
                `🧤 슈퍼세이브! ${goalkeeper.name}이(가) 몸을 날려 ${attacker.name}의 결정적 슈팅을 쳐냅니다! 철벽 방어!`,
                `🧤 ${goalkeeper.name}의 환상적인 반사신경! 골라인을 통과하기 직전의 공을 쳐내며 위기를 탈출합니다!`,
                `🛡️ ${attacker.name}의 날카로운 슈팅이었으나 ${defender.name}과 ${goalkeeper.name}의 완벽한 협동 수비로 굴절됩니다!`
            ];
            this.addCommentary(this.minute, 'SAVE', saveComments[Math.floor(Math.random() * saveComments.length)]);
        } else {
            // Shot blocked or off target
            defender.matchStats.tackles += 1;
            defender.matchRating += 0.3;

            if (pc && attackerEntity) {
                pc.shootBall(attackerEntity, false, null, null);
            }

            const missComments = [
                `🧱 ${defender.name}의 견고한 육탄 방어벽에 가로막히는 ${attacker.name}의 슈팅!`,
                `💨 ${attacker.name}의 슛이 크로스바 위로 살짝 벗어납니다. 아쉬운 기회!`,
                `⚔️ ${defender.name}이(가) 한 치의 오차도 없는 깔끔한 태클로 역습의 싹을 잘라냅니다!`
            ];
            this.addCommentary(this.minute, 'DEFENSE', missComments[Math.floor(Math.random() * missComments.length)]);
        }
    }

    addCommentary(minute, type, text) {
        const ev = { minute, type, text, timestamp: Date.now() };
        this.events.unshift(ev); // newest first
        if (this.options.onEvent) {
            this.options.onEvent(ev);
        }
    }

    finishMatch() {
        this.isFinished = true;
        this.addCommentary(90, 'FULL_TIME', `경기 종료 휘슬! 최종 스코어 [${this.homeScore} : ${this.awayScore}]! 양 팀의 모든 건축물이 온 힘을 다해 싸웠습니다.`);
        sounds.playWhistle(true);

        // Select Building of the Match (MOM)
        const allPlayers = [...this.homeTeam.startingXI, ...this.awayTeam.startingXI];
        allPlayers.forEach(p => {
            p.matchRating = Math.min(10.0, Math.max(5.5, Number((p.matchRating + (p.matchStats.goals * 1.5) + (p.matchStats.saves * 0.4)).toFixed(1))));
        });

        allPlayers.sort((a, b) => b.matchRating - a.matchRating);
        const mom = allPlayers[0];

        const matchResult = {
            homeTeam: this.homeTeam,
            awayTeam: this.awayTeam,
            homeScore: this.homeScore,
            awayScore: this.awayScore,
            scorers: this.scorers,
            stats: this.stats,
            events: this.events,
            mom: mom,
            winner: this.homeScore > this.awayScore ? 'home' : (this.homeScore < this.awayScore ? 'away' : 'draw')
        };

        if (this.options.onComplete) {
            this.options.onComplete(matchResult);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MatchEngine };
}

