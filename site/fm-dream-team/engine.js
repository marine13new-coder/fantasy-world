// ============================================================================
// Match Engine & Broadcast Coordinator (engine.js)
// - Manages 90-minute clock, commentary, xG, player ratings & user live commands
// ============================================================================

class MatchEngine {
    constructor(homeTeam, awayTeam, options = {}) {
        this.homeTeam = JSON.parse(JSON.stringify(homeTeam));
        this.awayTeam = JSON.parse(JSON.stringify(awayTeam));

        const resolveStartingXI = (team) => {
            if (!team.startingXI && team.starters) {
                team.startingXI = team.starters.map(id => {
                    if (typeof id === 'string') return (typeof PLAYER_MAP !== 'undefined' && PLAYER_MAP[id]) ? JSON.parse(JSON.stringify(PLAYER_MAP[id])) : { name: id, ovr: 75, pos: 'MF' };
                    return id;
                });
            }
            if (!team.startingXI) team.startingXI = [];
        };
        resolveStartingXI(this.homeTeam);
        resolveStartingXI(this.awayTeam);
        this.options = Object.assign({
            speed: 1,
            onMinute: null,
            onEvent: null,
            onGoal: null,
            onComplete: null,
            pitchCanvas: null
        }, options);

        this.minute = 0;
        this.homeScore = 0;
        this.awayScore = 0;
        this.events = [];
        this.scorers = [];
        this.isFinished = false;
        this.isPaused = false;
        this.timer = null;

        this.stats = {
            home: { shots: 0, shotsOnTarget: 0, xG: 0.0, possession: 50, passes: 0, tackles: 0, fouls: 0 },
            away: { shots: 0, shotsOnTarget: 0, xG: 0.0, possession: 50, passes: 0, tackles: 0, fouls: 0 }
        };

        this.initPlayerRatings();
        this.setupPitchListener();
    }

    initPlayerRatings() {
        const initList = (list) => {
            list.forEach(p => {
                p.matchRating = 6.2;
                p.matchStats = { goals: 0, assists: 0, shots: 0, saves: 0, tackles: 0 };
            });
        };
        initList(this.homeTeam.startingXI);
        initList(this.awayTeam.startingXI);
    }

    setupPitchListener() {
        if (!this.options.pitchCanvas) return;
        this.options.pitchCanvas.onMatchEvent = (type, data) => {
            if (type === 'GOAL') {
                if (data.isHome) {
                    this.homeScore++;
                    this.stats.home.shots++;
                    this.stats.home.shotsOnTarget++;
                    this.stats.home.xG = parseFloat((this.stats.home.xG + 0.42).toFixed(2));
                } else {
                    this.awayScore++;
                    this.stats.away.shots++;
                    this.stats.away.shotsOnTarget++;
                    this.stats.away.xG = parseFloat((this.stats.away.xG + 0.42).toFixed(2));
                }

                const striker = data.striker;
                striker.matchRating = Math.min(10.0, (striker.matchRating || 6.2) + 1.2);
                this.scorers.push({
                    scorerName: striker.name,
                    minute: this.minute || 1,
                    teamName: data.isHome ? this.homeTeam.name : this.awayTeam.name,
                    isHome: data.isHome,
                    xG: 0.45
                });

                const scoreStr = `[${this.homeTeam.name} ${this.homeScore} : ${this.awayScore} ${this.awayTeam.name}]`;
                this.addCommentary(this.minute || 1, 'GOAL', `⚽ GOOOOALLL! ${striker.name} 선수의 환상적인 피니시가 골망을 흔듭니다! ${scoreStr}`);

                if (this.options.onMinute) {
                    this.options.onMinute(this.minute, this.homeScore, this.awayScore, this.stats);
                }
            } else if (type === 'SAVE') {
                const gk = data.gk;
                if (gk) gk.matchRating = Math.min(10.0, (gk.matchRating || 6.2) + 0.45);
                this.addCommentary(this.minute || 1, 'SAVE', `🧤 [슈퍼 세이브!] ${gk ? gk.name : '골키퍼'} 선수의 동물적인 반사신경 선방!`);
            } else if (type === 'TACTIC') {
                this.addCommentary(this.minute || 1, 'PLAY', `📋 [벤치 전술 지시] ${this.homeTeam.name} 벤치에서 [${data.label}] 전술을 지시합니다!`);
            }
        };
    }

    triggerUserCommand(cmd) {
        if (!this.options.pitchCanvas || this.isFinished) return { success: false };
        const res = this.options.pitchCanvas.triggerUserCommand(cmd);
        if (res && res.success) {
            if (cmd === 'PASS_TO_ME') {
                this.addCommentary(this.minute || 1, 'PLAY', `🎯 [콜 플레이] 동료가 ★ ${res.target} 선수에게 집중 패스를 연결합니다!`);
            } else if (cmd === 'SHOOT') {
                this.addCommentary(this.minute || 1, 'PLAY', `💥 [슈팅 지시!] ${res.shooter} 선수가 지체 없이 골문을 향해 강력한 슛을 날립니다!`);
            } else if (cmd === 'THROUGH_PASS') {
                this.addCommentary(this.minute || 1, 'PLAY', `⚡ [킬패스 지시!] 수비 라인 뒷공간을 허무는 날카로운 스루패스가 ${res.target}에게 향합니다!`);
            } else if (cmd === 'DRIBBLE_PRESS') {
                if (res.action === 'DRIBBLE') {
                    this.addCommentary(this.minute || 1, 'PLAY', `💨 [드리블 돌파!] ${res.player} 선수가 폭발적인 가속도로 수비수를 제쳐냅니다!`);
                } else {
                    this.addCommentary(this.minute || 1, 'PLAY', `🔥 [강력한 압박!] ${res.player} 선수가 거친 전방 압박으로 상대의 공을 뺏어냅니다!`);
                }
            }
        }
        return res;
    }

    setTacticalMentality(mode) {
        if (!this.options.pitchCanvas || this.isFinished) return;
        this.options.pitchCanvas.setTacticalMentality(mode);
    }

    start() {
        if (this.options.pitchCanvas) {
            this.options.pitchCanvas.simSpeed = this.options.speed || 1;
            this.options.pitchCanvas.resize();
        }
        this.addCommentary(0, 'WHISTLE', `주심의 킥오프 휘슬과 함께 경기가 시작됩니다! [${this.homeTeam.name}] vs [${this.awayTeam.name}] 격돌!`);
        if (typeof sounds !== 'undefined' && sounds.playWhistle) sounds.playWhistle('short');

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

    tick() {
        if (this.isFinished || this.isPaused) return;

        this.minute++;
        if (this.options.pitchCanvas) {
            this.options.pitchCanvas.matchMinute = this.minute;
        }

        if (this.minute === 45) {
            this.addCommentary(45, 'HALF_TIME', `전반전 종료 휘슬! 전반 스코어: [${this.homeTeam.name} ${this.homeScore} : ${this.awayScore} ${this.awayTeam.name}]`);
            if (typeof sounds !== 'undefined' && sounds.playWhistle) sounds.playWhistle('long');
        }

        if (this.minute >= 90) {
            this.finishMatch();
            return;
        }

        if (this.minute % 8 === 0 && Math.random() < 0.65) {
            this.simulateMidfieldPasses();
        }

        if (this.options.onMinute) {
            this.options.onMinute(this.minute, this.homeScore, this.awayScore, this.stats);
        }

        const interval = Math.max(30, 380 / (this.options.speed || 1));
        this.timer = setTimeout(() => this.tick(), interval);
    }

    simulateMidfieldPasses() {
        const isHome = Math.random() < 0.52;
        const team = isHome ? this.homeTeam : this.awayTeam;
        const star = team.startingXI[Math.floor(Math.random() * team.startingXI.length)] || { name: '미드필더' };
        this.stats.home.passes += Math.floor(Math.random() * 4 + 2);
        this.stats.away.passes += Math.floor(Math.random() * 4 + 2);

        const actions = [
            `중원에서 ${star.koreanName || star.name} 선수가 탈압박 이후 침착하게 볼을 배급합니다.`,
            `${team.name}의 패스 워크가 살아나며 상대 수비 간격을 벌려놓습니다.`,
            `${star.koreanName || star.name} 선수의 감각적인 전진 패스가 공격 진영으로 투입됩니다!`
        ];
        this.addCommentary(this.minute, 'PLAY', actions[Math.floor(Math.random() * actions.length)]);
    }

    simulateFullMatchInstantly() {
        while (this.minute < 90) {
            this.minute += 2;
            if (Math.random() < 0.12) {
                const isHome = Math.random() < 0.54;
                const team = isHome ? this.homeTeam : this.awayTeam;
                const striker = team.startingXI.find(p => p.isPlayerCharacter) || team.startingXI[Math.floor(Math.random() * team.startingXI.length)] || { name: '공격수' };
                const sName = striker.koreanName || striker.name;
                if (isHome) this.homeScore++;
                else this.awayScore++;
                striker.matchRating = Math.min(10.0, (striker.matchRating || 6.5) + 1.2);
                this.scorers.push({
                    scorerName: sName,
                    minute: this.minute,
                    teamName: team.name,
                    isHome: isHome,
                    xG: 0.42
                });
                this.addCommentary(this.minute, 'GOAL', `⚽ GOOOOALLL! ${sName} 선수의 슈팅이 골문 구석에 꽂힙니다! [${this.homeScore}:${this.awayScore}]`);
            }
        }
        this.finishMatch();
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
        if (typeof sounds !== 'undefined' && sounds.playWhistle) sounds.playWhistle('triple');
        this.addCommentary(90, 'WHISTLE', `경기 종료 휘슬! 최종 스코어: [${this.homeTeam.name} ${this.homeScore} : ${this.awayScore} ${this.awayTeam.name}]`);

        let mom = null;
        let highest = -1;
        const all = [...this.homeTeam.startingXI, ...this.awayTeam.startingXI];
        all.forEach(p => {
            p.finalRating = parseFloat((p.matchRating || 6.5).toFixed(1));
            if (p.finalRating > highest) {
                highest = p.finalRating;
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
                mom: mom || all[0],
                events: this.events
            });
        }
    }
}

if (typeof window !== 'undefined') {
    window.MatchEngine = MatchEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MatchEngine };
}
