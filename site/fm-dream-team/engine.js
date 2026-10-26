// Match Engine & Broadcast Coordinator
// Manages 90-minute time progression, detailed commentary, xG, cards, and synchronizes with 2D PitchCanvas

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
                p.matchRating = 6.0;
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
                if (data.isHome) this.homeScore++;
                else this.awayScore++;

                const striker = data.striker;
                striker.matchRating = Math.min(10.0, (striker.matchRating || 6.0) + 1.0);
                this.scorers.push({
                    scorerName: striker.name,
                    minute: this.minute,
                    teamName: data.isHome ? this.homeTeam.name : this.awayTeam.name,
                    isHome: data.isHome,
                    xG: 0.45
                });

                const scoreStr = `[${this.homeTeam.name} ${this.homeScore} : ${this.awayScore} ${this.awayTeam.name}]`;
                this.addCommentary(this.minute, 'GOAL', `⚽ GOOOOALLL! ${striker.name}의 통렬한 슈팅이 골망을 흔듭니다! ${scoreStr}`);

                if (this.options.onMinute) {
                    this.options.onMinute(this.minute, this.homeScore, this.awayScore, this.stats);
                }
            } else if (type === 'SAVE') {
                const gk = data.gk;
                if (gk) gk.matchRating = Math.min(10.0, (gk.matchRating || 6.0) + 0.4);
                this.addCommentary(this.minute, 'SAVE', `🧤 [슈퍼 세이브!] ${gk ? gk.name : '골키퍼'}의 신들린 다이빙 선방으로 실점 위기를 넘깁니다!`);
            }
        };
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

        // Half-time
        if (this.minute === 45) {
            this.addCommentary(45, 'HALF_TIME', `전반전 종료 휘슬! 전반 스코어: [${this.homeTeam.name} ${this.homeScore} : ${this.awayScore} ${this.awayTeam.name}]`);
            if (typeof sounds !== 'undefined' && sounds.playWhistle) sounds.playWhistle('long');
        }

        // Full-time
        if (this.minute >= 90) {
            this.finishMatch();
            return;
        }

        // Periodic commentary & background event simulation
        if (this.minute % 8 === 0 && Math.random() < 0.6) {
            this.simulateMidfieldPasses();
        }

        if (this.options.onMinute) {
            this.options.onMinute(this.minute, this.homeScore, this.awayScore, this.stats);
        }

        const interval = Math.max(30, 400 / (this.options.speed || 1));
        this.timer = setTimeout(() => this.tick(), interval);
    }

    simulateMidfieldPasses() {
        const isHome = Math.random() < 0.5;
        const team = isHome ? this.homeTeam : this.awayTeam;
        const star = team.startingXI[Math.floor(Math.random() * team.startingXI.length)];
        this.stats.home.passes += Math.floor(Math.random() * 4 + 2);
        this.stats.away.passes += Math.floor(Math.random() * 4 + 2);

        const actions = [
            `중원에서 ${star.name} 선수가 매끄러운 턴 동작으로 볼을 전개합니다.`,
            `${team.name}의 빌드업이 정교하게 진행되며 상대 진영으로 전진합니다.`,
            `${star.name}의 정확한 롱패스가 측면 공간으로 연결됩니다!`
        ];
        this.addCommentary(this.minute, 'PLAY', actions[Math.floor(Math.random() * actions.length)]);
    }

    simulateFullMatchInstantly() {
        while (this.minute < 90) {
            this.minute += 2;
            if (Math.random() < 0.12) {
                const isHome = Math.random() < 0.52;
                const team = isHome ? this.homeTeam : this.awayTeam;
                const striker = team.startingXI[Math.floor(Math.random() * team.startingXI.length)];
                if (isHome) this.homeScore++;
                else this.awayScore++;
                this.scorers.push({
                    scorerName: striker.name,
                    minute: this.minute,
                    teamName: team.name,
                    isHome: isHome,
                    xG: 0.42
                });
                this.addCommentary(this.minute, 'GOAL', `⚽ GOOOOALLL! ${striker.name}의 슈팅이 골문으로 빨려 들어갑니다! [${this.homeScore}:${this.awayScore}]`);
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

        // Calculate MOM
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
