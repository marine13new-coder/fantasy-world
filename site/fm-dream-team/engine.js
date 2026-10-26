// Realistic Football Match Simulation Engine with FM Attribute Physics
// Simulates 90-minute real-time/fast-forward matches with tactical AI, xG, and commentary

class MatchEngine {
    constructor(homeTeam, awayTeam, options = {}) {
        this.homeTeam = JSON.parse(JSON.stringify(homeTeam));
        this.awayTeam = JSON.parse(JSON.stringify(awayTeam));
        this.options = Object.assign({
            speed: 1, // 1, 2, 5, or 0 (instant)
            onMinute: null,
            onEvent: null,
            onGoal: null,
            onHighlight: null,
            onComplete: null,
            pitchCanvas: null
        }, options);

        this.minute = 0;
        this.addedTimeFirstHalf = 2;
        this.addedTimeSecondHalf = 4;
        this.currentHalf = 1; // 1 or 2
        this.homeScore = 0;
        this.awayScore = 0;
        this.events = [];
        this.scorers = []; // { player, team, minute, assist, isPenalty, xG }
        this.isFinished = false;
        this.isPaused = false;
        this.timer = null;

        // In-match user tactical orders
        this.homeMentality = homeTeam.mentality || 'Balanced'; // 'UltraAttacking', 'Attacking', 'Balanced', 'Defensive', 'Bus'
        this.homePressing = homeTeam.pressing || 'Normal'; // 'High', 'Normal', 'Low'

        // Detailed Match Stats
        this.stats = {
            home: {
                shots: 0,
                shotsOnTarget: 0,
                xG: 0.0,
                passes: 0,
                passSuccess: 0,
                tackles: 0,
                fouls: 0,
                corners: 0,
                offsides: 0,
                yellowCards: 0,
                redCards: 0,
                possession: 50
            },
            away: {
                shots: 0,
                shotsOnTarget: 0,
                xG: 0.0,
                passes: 0,
                passSuccess: 0,
                tackles: 0,
                fouls: 0,
                corners: 0,
                offsides: 0,
                yellowCards: 0,
                redCards: 0,
                possession: 50
            }
        };

        this.initPlayers();
    }

    initPlayers() {
        const initList = (team) => {
            team.startingXI.forEach((p, idx) => {
                p.matchRating = 6.0;
                p.matchStats = { goals: 0, assists: 0, shots: 0, shotsOnTarget: 0, tackles: 0, saves: 0, keyPasses: 0, xG: 0 };
                p.currentStamina = 100;
                p.isYellow = false;
                p.isRed = false;
                p.teamSide = team.isHome ? 'home' : 'away';
            });
            if (team.bench) {
                team.bench.forEach(p => {
                    p.matchRating = 6.0;
                    p.matchStats = { goals: 0, assists: 0, shots: 0, shotsOnTarget: 0, tackles: 0, saves: 0, keyPasses: 0, xG: 0 };
                    p.currentStamina = 100;
                    p.isYellow = false;
                    p.isRed = false;
                    p.teamSide = team.isHome ? 'home' : 'away';
                });
            }
        };
        this.homeTeam.isHome = true;
        this.awayTeam.isHome = false;
        initList(this.homeTeam);
        initList(this.awayTeam);
    }

    start() {
        if (this.options.pitchCanvas) {
            this.options.pitchCanvas.simSpeed = this.options.speed || 1;
        }
        this.addCommentary(0, 'WHISTLE', `주심의 힘찬 휘슬과 함께 경기가 시작됩니다! [${this.homeTeam.name}] vs [${this.awayTeam.name}]의 치열한 격돌!`);
        sounds.playWhistle('short');

        if (this.options.speed === 0) {
            this.simulateFullMatchInstantly();
        } else {
            this.tick();
        }
    }

    setSpeed(newSpeed) {
        this.options.speed = newSpeed;
        if (this.options.pitchCanvas) {
            this.options.pitchCanvas.simSpeed = newSpeed;
        }
        if (newSpeed === 0 && !this.isFinished) {
            if (this.timer) clearTimeout(this.timer);
            this.simulateFullMatchInstantly();
        }
    }

    pause() {
        this.isPaused = true;
        if (this.timer) clearTimeout(this.timer);
    }

    resume() {
        if (!this.isFinished && this.isPaused) {
            this.isPaused = false;
            this.tick();
        }
    }

    setHomeTactics(mentality, pressing) {
        if (mentality) this.homeMentality = mentality;
        if (pressing) this.homePressing = pressing;
        this.addCommentary(this.minute, 'TACTIC', `📋 감독 지시 변경: 전술 성향 [${this.getMentalityName(this.homeMentality)}], 압박 [${this.getPressingName(this.homePressing)}]!`);
    }

    getMentalityName(m) {
        switch(m) {
            case 'UltraAttacking': return '파상공격 (All-Out Attack)';
            case 'Attacking': return '공격적 (Attacking)';
            case 'Defensive': return '수비적 (Defensive)';
            case 'Bus': return '극단적 텐백 (Park the Bus)';
            default: return '균형 유지 (Balanced)';
        }
    }

    getPressingName(p) {
        switch(p) {
            case 'High': return '게겐프레싱 전방압박';
            case 'Low': return '하프라인 지역방어';
            default: return '보통 압박';
        }
    }

    // Substitute in match
    substitute(outPlayerId, inPlayerId, isHome = true) {
        const team = isHome ? this.homeTeam : this.awayTeam;
        const outIdx = team.startingXI.findIndex(p => p.id === outPlayerId);
        const inIdx = team.bench ? team.bench.findIndex(p => p.id === inPlayerId) : -1;

        if (outIdx >= 0 && inIdx >= 0) {
            const outP = team.startingXI[outIdx];
            const inP = team.bench[inIdx];
            team.startingXI[outIdx] = inP;
            team.bench[inIdx] = outP;

            this.addCommentary(this.minute, 'SUB', `🔄 [선수 교체] ${team.name}: ${outP.koreanName || outP.name} OUT ➡️ ${inP.koreanName || inP.name} IN 투입!`);
            sounds.playWhistle('short');

            if (this.options.pitchCanvas) {
                this.options.pitchCanvas.syncTeamFormation(this.homeTeam, this.awayTeam);
            }
            return true;
        }
        return false;
    }

    tick() {
        if (this.isFinished || this.isPaused) return;

        this.minute++;
        this.simulateMinute(this.minute);

        if (this.options.onMinute) {
            this.options.onMinute(this.minute, this.homeScore, this.awayScore, this.stats);
        }

        // Half-time whistle
        if (this.minute === 45 + this.addedTimeFirstHalf && this.currentHalf === 1) {
            this.currentHalf = 2;
            this.addCommentary(this.minute, 'HALF_TIME', `전반전 종료 휘슬이 울립니다! 현재 스코어: [${this.homeTeam.name} ${this.homeScore} - ${this.awayScore} ${this.awayTeam.name}]`);
            sounds.playWhistle('long');
            // Recover some stamina
            this.homeTeam.startingXI.forEach(p => p.currentStamina = Math.min(100, p.currentStamina + 10));
            this.awayTeam.startingXI.forEach(p => p.currentStamina = Math.min(100, p.currentStamina + 10));
        }

        // Full-time whistle
        if (this.minute >= 90 + this.addedTimeSecondHalf) {
            this.finishMatch();
            return;
        }

        const interval = Math.max(30, 450 / (this.options.speed || 1));
        this.timer = setTimeout(() => this.tick(), interval);
    }

    simulateFullMatchInstantly() {
        while (this.minute < 90 + this.addedTimeSecondHalf) {
            this.minute++;
            this.simulateMinute(this.minute);
            if (this.minute === 45) {
                this.currentHalf = 2;
            }
        }
        this.finishMatch();
    }

    simulateMinute(min) {
        // 1. Deplete stamina slightly
        const staminaDrain = this.homePressing === 'High' ? 0.35 : 0.22;
        this.homeTeam.startingXI.forEach(p => {
            const res = (p.stats.stamina || 15) / 20;
            p.currentStamina = Math.max(25, p.currentStamina - staminaDrain * (1.3 - res * 0.5));
        });
        this.awayTeam.startingXI.forEach(p => {
            const res = (p.stats.stamina || 15) / 20;
            p.currentStamina = Math.max(25, p.currentStamina - 0.25 * (1.3 - res * 0.5));
        });

        // 2. Midfield Battle & Possession Momentum
        const getMidfieldScore = (team, isHome) => {
            const mids = team.startingXI.filter(p => ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p.pos));
            const avgPas = mids.reduce((s, p) => s + p.stats.passing, 0) / (mids.length || 1);
            const avgVis = mids.reduce((s, p) => s + p.stats.vision, 0) / (mids.length || 1);
            const avgWrk = mids.reduce((s, p) => s + p.stats.workRate, 0) / (mids.length || 1);
            const avgTac = mids.reduce((s, p) => s + p.stats.tackling, 0) / (mids.length || 1);

            let score = (avgPas * 0.35) + (avgVis * 0.25) + (avgWrk * 0.25) + (avgTac * 0.15);
            if (isHome) {
                if (this.homeMentality === 'UltraAttacking') score += 1.5;
                if (this.homeMentality === 'Bus') score -= 2.0;
                if (this.homePressing === 'High') score += 1.2;
            }
            return score;
        };

        const homeMid = getMidfieldScore(this.homeTeam, true);
        const awayMid = getMidfieldScore(this.awayTeam, false);
        const totalMid = homeMid + awayMid;
        const homePossessionChance = homeMid / totalMid;

        // Dynamic possession drifting
        const targetHomePoss = Math.round(homePossessionChance * 100);
        this.stats.home.possession = Math.round(this.stats.home.possession * 0.95 + targetHomePoss * 0.05);
        this.stats.away.possession = 100 - this.stats.home.possession;

        // Passes increment
        this.stats.home.passes += Math.floor(Math.random() * 4 + (this.stats.home.possession / 20));
        this.stats.home.passSuccess += Math.floor(Math.random() * 3 + (this.stats.home.possession / 22));
        this.stats.away.passes += Math.floor(Math.random() * 4 + (this.stats.away.possession / 20));
        this.stats.away.passSuccess += Math.floor(Math.random() * 3 + (this.stats.away.possession / 22));

        // 3. Chance Creation Probability (Every minute ~15% chance of an attacking opportunity)
        const chanceRoll = Math.random();
        if (chanceRoll < 0.16) {
            const attackingHome = Math.random() < homePossessionChance;
            this.generateAttackEvent(attackingHome);
        } else if (chanceRoll < 0.22) {
            // General midfield action/foul
            this.generateMidfieldAction();
        }
    }

    generateAttackEvent(isHome) {
        const attTeam = isHome ? this.homeTeam : this.awayTeam;
        const defTeam = isHome ? this.awayTeam : this.homeTeam;
        const attStats = isHome ? this.stats.home : this.stats.away;
        const defStats = isHome ? this.stats.away : this.stats.home;

        // Select attacking player (forwards or attacking mids preferred)
        const attackers = attTeam.startingXI.filter(p => ['ST', 'LW', 'RW', 'CAM'].includes(p.pos));
        const striker = attackers.length > 0 ? attackers[Math.floor(Math.random() * attackers.length)] : attTeam.startingXI[10];

        // Select potential assister
        const playmakers = attTeam.startingXI.filter(p => p.id !== striker.id && ['CAM', 'CM', 'LW', 'RW', 'LB', 'RB'].includes(p.pos));
        const assister = playmakers.length > 0 ? playmakers[Math.floor(Math.random() * playmakers.length)] : null;

        // Select defending players & GK
        const defenders = defTeam.startingXI.filter(p => ['CB', 'LB', 'RB', 'CDM'].includes(p.pos));
        const defender = defenders.length > 0 ? defenders[Math.floor(Math.random() * defenders.length)] : defTeam.startingXI[2];
        const gk = defTeam.startingXI.find(p => p.pos === 'GK') || defTeam.startingXI[0];

        // Types of attack
        const attackTypes = ['THROUGH_BALL', 'WING_CROSS', 'CUT_IN_FINESSE', 'LONG_RANGE_ROCKET', 'SET_PIECE'];
        const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];

        // Compute base attack quality vs defense resistance
        const sFin = striker.stats.finishing || 15;
        const sOtb = striker.stats.offTheBall || 15;
        const sPac = striker.stats.pace || 15;
        const sCmp = striker.stats.composure || 15;

        const dTac = defender.stats.tackling || 15;
        const dPos = defender.stats.positioning || 15;
        const dSpd = defender.stats.pace || 15;

        const gkRef = gk.stats.reflexes || 16;
        const gkOne = gk.stats.oneOnOnes || 16;

        // Step 1: Did defender intercept or tackle?
        const defSuccessChance = (dTac * 0.4 + dPos * 0.35 + dSpd * 0.25) / (sOtb * 0.4 + sPac * 0.35 + sCmp * 0.25 + 10);
        if (Math.random() < (defSuccessChance * 0.55)) {
            // Tackle / Interception made!
            defStats.tackles++;
            defender.matchRating = Math.min(10.0, defender.matchRating + 0.15);
            defender.matchStats.tackles++;
            const defName = defender.koreanName || defender.name;
            const attName = striker.koreanName || striker.name;
            this.addCommentary(this.minute, 'DEFENSE', `🛡️ [결정적 차단] ${defTeam.name}의 ${defName} 선수가 박스 앞 침투하던 ${attName}의 볼을 완벽한 슬라이딩 태클로 걷어냅니다!`);
            return;
        }

        // Step 2: Shot Occurs!
        attStats.shots++;
        striker.matchStats.shots++;

        // Base xG estimation based on attack type and stats
        let xG = 0.08;
        if (attackType === 'THROUGH_BALL') xG = 0.38 + (sFin / 100);
        else if (attackType === 'WING_CROSS') xG = 0.22 + (striker.stats.heading / 100);
        else if (attackType === 'CUT_IN_FINESSE') xG = 0.18 + (striker.stats.technique / 100);
        else if (attackType === 'LONG_RANGE_ROCKET') xG = 0.07 + (striker.stats.longShots / 100);
        else if (attackType === 'SET_PIECE') xG = 0.25 + (striker.stats.heading / 100);

        xG = Math.min(0.85, Math.max(0.04, xG));
        attStats.xG = parseFloat((attStats.xG + xG).toFixed(2));
        striker.matchStats.xG = parseFloat((striker.matchStats.xG + xG).toFixed(2));

        // Trigger Canvas Visual FX if available
        if (this.options.pitchCanvas) {
            this.options.pitchCanvas.triggerShotAnimation(isHome, attackType, striker, gk);
        }

        // Shot On Target Check
        const shotOnTargetChance = (striker.stats.technique * 0.5 + striker.stats.composure * 0.3 + striker.stats.finishing * 0.2) / 22;
        const isOnTarget = Math.random() < shotOnTargetChance;

        const strikerName = striker.koreanName || striker.name;
        const assisterName = assister ? (assister.koreanName || assister.name) : null;
        const gkName = gk.koreanName || gk.name;

        if (!isOnTarget) {
            // Miss / Woodwork
            const isWoodwork = Math.random() < 0.25;
            if (isWoodwork) {
                sounds.playPostHit();
                this.addCommentary(this.minute, 'WOODWORK', `💥 [골대 강타!!] ${attTeam.name} ${strikerName}의 통렬한 슈팅이 크로스바를 강하게 때리고 튕겨 나옵니다! 관중석 탄식! (xG: ${xG.toFixed(2)})`);
            } else {
                sounds.playGroan();
                this.addCommentary(this.minute, 'SHOT_MISS', `⚡ ${attTeam.name} ${strikerName}의 회심의 슈팅, 골문 살짝 벗어납니다! (xG: ${xG.toFixed(2)})`);
            }
            return;
        }

        // It is ON TARGET!
        attStats.shotsOnTarget++;
        striker.matchStats.shotsOnTarget++;

        // GK Save vs Goal Calculation
        const saveScore = (gkRef * 0.45) + (gkOne * 0.35) + ((gk.stats.positioning || 16) * 0.20);
        const shotScore = (sFin * 0.45) + (sCmp * 0.35) + ((striker.stats.technique || 15) * 0.20) + (xG * 15);

        const goalProbability = shotScore / (shotScore + saveScore * 0.85);

        if (Math.random() < goalProbability) {
            // 🔥 GOAL SCORED!
            if (isHome) this.homeScore++;
            else this.awayScore++;

            striker.matchStats.goals++;
            striker.matchRating = Math.min(10.0, striker.matchRating + 0.85);

            if (assister) {
                assister.matchStats.assists++;
                assister.matchStats.keyPasses++;
                assister.matchRating = Math.min(10.0, assister.matchRating + 0.45);
            }

            gk.matchRating = Math.max(4.0, gk.matchRating - 0.25);

            const scoreStr = `[${this.homeTeam.name} ${this.homeScore} - ${this.awayScore} ${this.awayTeam.name}]`;
            let goalText = `⚽ GOOOOOAAALLLLL!! ${attTeam.name}의 ${strikerName} 득점 작렬! `;
            if (assisterName) {
                goalText += `${assisterName}의 칼날 같은 패스를 받아 골망을 찢을 듯이 꽂아 넣습니다! ${scoreStr} (xG: ${xG.toFixed(2)})`;
            } else {
                goalText += `단독 환상적인 드리블 돌파 후 골문 구석으로 꽂아 넣습니다! ${scoreStr} (xG: ${xG.toFixed(2)})`;
            }

            this.scorers.push({
                player: striker,
                scorerName: strikerName,
                teamName: attTeam.name,
                isHome: isHome,
                minute: this.minute,
                assistName: assisterName,
                xG: xG
            });

            this.addCommentary(this.minute, 'GOAL', goalText);
            sounds.playGoalRoar();
            sounds.playWhistle('short');

            if (this.options.onGoal) {
                this.options.onGoal(striker, attTeam, this.minute, this.homeScore, this.awayScore);
            }
            if (this.options.pitchCanvas) {
                this.options.pitchCanvas.triggerGoalCelebration(striker, attTeam);
            }
        } else {
            // 🧤 SUPER SAVE BY GOALKEEPER!
            gk.matchStats.saves++;
            gk.matchRating = Math.min(10.0, gk.matchRating + 0.35);
            sounds.playKick(1.2);
            sounds.playGroan();
            attStats.corners++;

            this.addCommentary(this.minute, 'SAVE', `🧤 [슈퍼 세이브!] ${defTeam.name} ${gkName} 수문장의 신들린 동물적 다이빙 선방! ${strikerName}의 결정적 유효슈팅을 쳐내며 코너킥으로 연결합니다!`);
        }
    }

    generateMidfieldAction() {
        const isFoul = Math.random() < 0.3;
        if (isFoul) {
            const isHomeFouled = Math.random() < 0.5;
            const foulTeam = isHomeFouled ? this.awayTeam : this.homeTeam;
            const foulStats = isHomeFouled ? this.stats.away : this.stats.home;
            foulStats.fouls++;

            const player = foulTeam.startingXI[Math.floor(Math.random() * foulTeam.startingXI.length)];
            const isYellow = Math.random() < 0.18 && !player.isYellow;

            if (isYellow) {
                player.isYellow = true;
                foulStats.yellowCards++;
                player.matchRating = Math.max(3.5, player.matchRating - 0.3);
                sounds.playWhistle('double');
                this.addCommentary(this.minute, 'CARD', `🟨 [경고] 주심이 거친 태클을 범한 ${foulTeam.name}의 ${player.koreanName || player.name}에게 옐로카드를 꺼내 듭니다!`);
            } else {
                sounds.playWhistle('short');
            }
        }
    }

    addCommentary(minute, type, text) {
        const ev = { minute, type, text, id: Date.now() + Math.random() };
        this.events.unshift(ev);
        if (this.options.onEvent) {
            this.options.onEvent(ev);
        }
    }

    finishMatch() {
        this.isFinished = true;
        if (this.timer) clearTimeout(this.timer);

        sounds.playWhistle('triple');
        this.addCommentary(this.minute, 'WHISTLE', `경기 종료 휘슬! 최종 스코어: [${this.homeTeam.name} ${this.homeScore} : ${this.awayScore} ${this.awayTeam.name}]`);

        // Determine Man of the Match (MOM)
        let mom = null;
        let highestRating = -1;
        const allPlayers = [...this.homeTeam.startingXI, ...this.awayTeam.startingXI];
        allPlayers.forEach(p => {
            // Round rating to 1 decimal place
            p.finalRating = parseFloat(p.matchRating.toFixed(1));
            if (p.finalRating > highestRating) {
                highestRating = p.finalRating;
                mom = p;
            }
        });

        if (this.options.onComplete) {
            this.options.onComplete({
                homeTeam: this.homeTeam,
                awayTeam: this.awayTeam,
                homeScore: this.homeScore,
                awayScore: this.awayScore,
                stats: this.stats,
                scorers: this.scorers,
                mom: mom,
                events: this.events
            });
        }
    }
}

if (typeof window !== 'undefined') {
    window.MatchEngine = MatchEngine;
}
