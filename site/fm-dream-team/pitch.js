// 2D Tactical Football Match Engine & Autonomous AI Simulator
// Realistic 22-player football simulation: Dribbling, Passing, Pressing, Tackles, Shots, and GK Saves

class PitchCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        this.homePlayers = [];
        this.awayPlayers = [];
        this.allPlayers = [];

        // Realistic Ball with Physics & State Machine
        this.ball = {
            x: 0.5,
            y: 0.5,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            carrier: null, // player currently possessing the ball
            lastCarrier: null,
            state: 'KICKOFF', // 'KICKOFF', 'DRIBBLE', 'PASS', 'SHOT', 'LOOSE', 'GOAL', 'SAVED'
            passTarget: null,
            targetX: 0.5,
            targetY: 0.5,
            shotTargetY: 0.5,
            shotResult: null, // 'GOAL' or 'SAVE' or 'MISS'
            shotStriker: null,
            trail: []
        };

        this.homeColor1 = '#0284c7';
        this.homeColor2 = '#ffffff';
        this.awayColor1 = '#ef4444';
        this.awayColor2 = '#ffffff';

        this.simSpeed = 1;
        this.isMatchActive = false;
        this.pitchBounds = { x: 30, y: 20, width: 840, height: 500 };
        this.actionPopup = null; // { text, x, y, life, color }
        this.goalCelebration = null; // { scorer, team, timer, particles }

        this.onMatchEvent = null; // callback to engine/app
        this.lastDribbleTime = 0;
        this.lastPassTime = 0;
        this.matchMinute = 0;

        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.startLoop();
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Ensure canvas width and height are never 0 even if loaded while hidden
        const width = (rect.width > 50) ? rect.width : (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 860) || 860;
        const height = (rect.height > 50) ? rect.height : 500;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const padX = Math.max(20, 30 * (w / 900));
        const padY = Math.max(15, 25 * (h / 540));

        this.pitchBounds = {
            x: padX,
            y: padY,
            width: w - padX * 2,
            height: h - padY * 2
        };
    }

    startLoop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        const loop = (ts) => {
            this.update(ts);
            this.render();
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }

    getFormationCoords(formation, isHome) {
        const mirror = (x) => isHome ? x : (1.0 - x);
        const coords = {
            '4-3-3': [
                { x: mirror(0.05), y: 0.50, pos: 'GK' },
                { x: mirror(0.18), y: 0.84, pos: 'RB' },
                { x: mirror(0.16), y: 0.62, pos: 'CB' },
                { x: mirror(0.16), y: 0.38, pos: 'CB' },
                { x: mirror(0.18), y: 0.16, pos: 'LB' },
                { x: mirror(0.28), y: 0.50, pos: 'CDM' },
                { x: mirror(0.35), y: 0.70, pos: 'CM' },
                { x: mirror(0.35), y: 0.30, pos: 'CM' },
                { x: mirror(0.44), y: 0.82, pos: 'RW' },
                { x: mirror(0.47), y: 0.50, pos: 'ST' },
                { x: mirror(0.44), y: 0.18, pos: 'LW' }
            ],
            '4-2-3-1': [
                { x: mirror(0.05), y: 0.50, pos: 'GK' },
                { x: mirror(0.18), y: 0.84, pos: 'RB' },
                { x: mirror(0.16), y: 0.62, pos: 'CB' },
                { x: mirror(0.16), y: 0.38, pos: 'CB' },
                { x: mirror(0.18), y: 0.16, pos: 'LB' },
                { x: mirror(0.26), y: 0.62, pos: 'CDM' },
                { x: mirror(0.26), y: 0.38, pos: 'CDM' },
                { x: mirror(0.37), y: 0.50, pos: 'CAM' },
                { x: mirror(0.43), y: 0.82, pos: 'RW' },
                { x: mirror(0.47), y: 0.50, pos: 'ST' },
                { x: mirror(0.43), y: 0.18, pos: 'LW' }
            ],
            '4-4-2': [
                { x: mirror(0.05), y: 0.50, pos: 'GK' },
                { x: mirror(0.18), y: 0.84, pos: 'RB' },
                { x: mirror(0.16), y: 0.62, pos: 'CB' },
                { x: mirror(0.16), y: 0.38, pos: 'CB' },
                { x: mirror(0.18), y: 0.16, pos: 'LB' },
                { x: mirror(0.30), y: 0.82, pos: 'RM' },
                { x: mirror(0.30), y: 0.60, pos: 'CM' },
                { x: mirror(0.30), y: 0.40, pos: 'CM' },
                { x: mirror(0.30), y: 0.18, pos: 'LM' },
                { x: mirror(0.46), y: 0.60, pos: 'ST' },
                { x: mirror(0.46), y: 0.40, pos: 'ST' }
            ],
            '3-5-2': [
                { x: mirror(0.05), y: 0.50, pos: 'GK' },
                { x: mirror(0.17), y: 0.72, pos: 'CB' },
                { x: mirror(0.16), y: 0.50, pos: 'CB' },
                { x: mirror(0.17), y: 0.28, pos: 'CB' },
                { x: mirror(0.30), y: 0.88, pos: 'RWB' },
                { x: mirror(0.27), y: 0.50, pos: 'CDM' },
                { x: mirror(0.30), y: 0.12, pos: 'LWB' },
                { x: mirror(0.35), y: 0.64, pos: 'CM' },
                { x: mirror(0.35), y: 0.36, pos: 'CM' },
                { x: mirror(0.46), y: 0.60, pos: 'ST' },
                { x: mirror(0.46), y: 0.40, pos: 'ST' }
            ]
        };
        return coords[formation] || coords['4-3-3'];
    }

    syncTeamFormation(homeTeam, awayTeam) {
        this.resize();
        this.homeColor1 = homeTeam.color1 || '#0284c7';
        this.homeColor2 = homeTeam.color2 || '#ffffff';
        this.awayColor1 = awayTeam.color1 || '#ef4444';
        this.awayColor2 = awayTeam.color2 || '#ffffff';

        const homeCoords = this.getFormationCoords(homeTeam.formation || '4-3-3', true);
        const awayCoords = this.getFormationCoords(awayTeam.formation || '4-3-3', false);

        this.homePlayers = (homeTeam.startingXI || []).map((p, idx) => {
            const c = homeCoords[idx] || { x: 0.2, y: 0.5, pos: p.pos };
            return {
                id: p.id,
                name: p.koreanName || p.name,
                pos: p.pos,
                num: idx + 1,
                team: 'home',
                stats: p.stats,
                ovr: p.ovr,
                baseX: c.x,
                baseY: c.y,
                x: c.x,
                y: c.y,
                vx: 0,
                vy: 0,
                targetX: c.x,
                targetY: c.y,
                isGK: p.pos === 'GK'
            };
        });

        this.awayPlayers = (awayTeam.startingXI || []).map((p, idx) => {
            const c = awayCoords[idx] || { x: 0.8, y: 0.5, pos: p.pos };
            return {
                id: p.id,
                name: p.koreanName || p.name,
                pos: p.pos,
                num: idx + 1,
                team: 'away',
                stats: p.stats,
                ovr: p.ovr,
                baseX: c.x,
                baseY: c.y,
                x: c.x,
                y: c.y,
                vx: 0,
                vy: 0,
                targetX: c.x,
                targetY: c.y,
                isGK: p.pos === 'GK'
            };
        });

        this.allPlayers = [...this.homePlayers, ...this.awayPlayers];

        // Place ball at center and give to home striker
        this.resetKickoff(true);
        this.isMatchActive = true;
    }

    resetKickoff(isHomeKickoff = true) {
        this.ball.x = 0.5;
        this.ball.y = 0.5;
        this.ball.z = 0;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.vz = 0;
        this.ball.state = 'DRIBBLE';

        // Reset player positions back to formation base
        this.allPlayers.forEach(p => {
            p.x = p.baseX;
            p.y = p.baseY;
            p.targetX = p.baseX;
            p.targetY = p.baseY;
        });

        const kickingTeam = isHomeKickoff ? this.homePlayers : this.awayPlayers;
        const striker = kickingTeam.find(p => p.pos === 'ST') || kickingTeam[10];
        striker.x = 0.5;
        striker.y = 0.5;
        this.ball.carrier = striker;
    }

    showActionPopup(text, x, y, color = '#ffd700') {
        this.actionPopup = { text, x, y, life: 1.0, color };
    }

    // Main Autonomous Physics & AI Update Loop
    update(ts) {
        if (!this.isMatchActive || this.allPlayers.length === 0) return;

        const dt = (1 / 60) * Math.min(3, Math.max(0.5, this.simSpeed));

        // 1. UPDATE BALL & POSSESSION STATE
        if (this.ball.state === 'DRIBBLE' && this.ball.carrier) {
            const carrier = this.ball.carrier;
            const isHome = carrier.team === 'home';
            const goalX = isHome ? 0.96 : 0.04;
            const dirX = isHome ? 1 : -1;

            // Dribble forward towards opponent goal
            const dribbleSpeed = (0.09 + (carrier.stats.dribbling / 20) * 0.05) * dt;
            carrier.x += dirX * dribbleSpeed;

            // Stay within pitch bounds
            carrier.y += (Math.sin(ts * 0.003 + carrier.num) * 0.02) * dt;
            carrier.x = Math.max(0.04, Math.min(0.96, carrier.x));
            carrier.y = Math.max(0.06, Math.min(0.94, carrier.y));

            // Ball stays glued to carrier feet
            this.ball.x = carrier.x + dirX * 0.015;
            this.ball.y = carrier.y;
            this.ball.z = 0;

            // Check if within shooting range (< 32% distance from opponent goal)
            const distToGoal = Math.abs(carrier.x - goalX);
            const inBoxAngle = Math.abs(carrier.y - 0.5) < 0.25;

            if (distToGoal < 0.30 && inBoxAngle && Math.random() < 0.02) {
                // TAKES A SHOT!
                this.executeShot(carrier);
            } else if (Math.random() < 0.03) {
                // ATTEMPT A PASS TO A TEAMMATE
                this.executePass(carrier);
            }

            // Check for nearest defender pressing & tackling
            const opponentTeam = isHome ? this.awayPlayers : this.homePlayers;
            opponentTeam.forEach(def => {
                if (def.isGK) return;
                const dx = def.x - carrier.x;
                const dy = def.y - carrier.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // If within pressing distance (0.15), defender runs at ball carrier
                if (dist < 0.18) {
                    const pressSpeed = (0.11 + (def.stats.pace / 20) * 0.04) * dt;
                    def.x -= (dx / dist) * pressSpeed;
                    def.y -= (dy / dist) * pressSpeed;

                    // Within tackle distance (0.025)
                    if (dist < 0.035) {
                        this.attemptTackle(def, carrier);
                    }
                }
            });

        } else if (this.ball.state === 'PASS') {
            // Ball rolls/flies toward pass target
            const dx = this.ball.targetX - this.ball.x;
            const dy = this.ball.targetY - this.ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.03 || !this.ball.passTarget) {
                // Pass arrived!
                if (this.ball.passTarget) {
                    this.ball.carrier = this.ball.passTarget;
                    this.ball.carrier.x = this.ball.targetX;
                    this.ball.carrier.y = this.ball.targetY;
                    this.ball.state = 'DRIBBLE';
                } else {
                    this.ball.state = 'LOOSE';
                }
            } else {
                this.ball.x += (dx / dist) * this.ball.vx * dt;
                this.ball.y += (dy / dist) * this.ball.vy * dt;
            }

        } else if (this.ball.state === 'SHOT') {
            // Ball blasted towards goal line!
            const dx = this.ball.targetX - this.ball.x;
            const dy = this.ball.targetY - this.ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            this.ball.x += (dx / dist) * this.ball.vx * dt;
            this.ball.y += (dy / dist) * this.ball.vy * dt;

            // Altitude arc for shot
            if (this.ball.z > 0 || this.ball.vz !== 0) {
                this.ball.z += this.ball.vz * dt;
                this.ball.vz -= 0.6 * dt;
                if (this.ball.z < 0) this.ball.z = 0;
            }

            // GK dive tracking
            const isHomeShot = this.ball.shotStriker ? this.ball.shotStriker.team === 'home' : true;
            const oppGK = (isHomeShot ? this.awayPlayers : this.homePlayers).find(p => p.isGK);
            if (oppGK) {
                oppGK.y += (this.ball.shotTargetY - oppGK.y) * 0.15;
            }

            // Check if crossed goal line
            if (Math.abs(this.ball.x - this.ball.targetX) < 0.03) {
                if (this.ball.shotResult === 'GOAL') {
                    this.resolveGoal();
                } else if (this.ball.shotResult === 'SAVE') {
                    this.resolveSave(oppGK);
                } else {
                    this.resolveMiss();
                }
            }
        }

        // 2. TEAMMATES SUPPORTING RUNS & FORMATION DRIFT
        this.allPlayers.forEach(p => {
            if (p === this.ball.carrier) return;

            // Attackers make forward runs when team has ball
            let targetX = p.baseX;
            let targetY = p.baseY;

            if (this.ball.carrier) {
                const teamHasBall = p.team === this.ball.carrier.team;
                const dirX = (p.team === 'home') ? 1 : -1;

                if (teamHasBall) {
                    if (p.pos === 'ST' || p.pos === 'LW' || p.pos === 'RW') {
                        // Sprint into space ahead of ball
                        targetX = Math.max(0.1, Math.min(0.92, this.ball.x + dirX * 0.15));
                        targetY = p.baseY + Math.sin(ts * 0.002 + p.num) * 0.05;
                    } else if (p.pos === 'CM' || p.pos === 'CAM') {
                        // Support from midfield
                        targetX = this.ball.x - dirX * 0.08;
                        targetY = p.baseY;
                    }
                } else {
                    // Defending: shift towards own goal and ball
                    targetX = p.baseX * 0.7 + (p.team === 'home' ? 0.08 : 0.92) * 0.3;
                }
            }

            p.x += (targetX - p.x) * 0.03 * dt * 60;
            p.y += (targetY - p.y) * 0.03 * dt * 60;
        });

        // 3. UPDATE ACTION POPUPS & CELEBRATION
        if (this.actionPopup) {
            this.actionPopup.life -= 0.02 * dt * 60;
            this.actionPopup.y -= 0.001;
            if (this.actionPopup.life <= 0) this.actionPopup = null;
        }

        if (this.goalCelebration) {
            this.goalCelebration.timer -= dt * 60;
            this.goalCelebration.particles.forEach(pt => {
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.life -= 0.015;
            });
            this.goalCelebration.particles = this.goalCelebration.particles.filter(pt => pt.life > 0);

            if (this.goalCelebration.timer <= 0) {
                this.goalCelebration = null;
                const wasHomeGoal = this.ball.shotStriker && this.ball.shotStriker.team === 'home';
                this.resetKickoff(!wasHomeGoal);
            }
        }
    }

    executePass(carrier) {
        const teamPlayers = carrier.team === 'home' ? this.homePlayers : this.awayPlayers;
        const dirX = carrier.team === 'home' ? 1 : -1;

        // Find best passing option ahead or level
        const forwardTeammates = teamPlayers.filter(p => p !== carrier && !p.isGK && (p.x * dirX >= (carrier.x * dirX - 0.05)));
        const target = (forwardTeammates.length > 0)
            ? forwardTeammates[Math.floor(Math.random() * forwardTeammates.length)]
            : teamPlayers[Math.floor(Math.random() * teamPlayers.length)];

        if (!target || target === carrier) return;

        this.ball.carrier = null;
        this.ball.passTarget = target;
        this.ball.targetX = target.x;
        this.ball.targetY = target.y;
        this.ball.vx = 0.42;
        this.ball.vy = 0.42;
        this.ball.state = 'PASS';
        sounds.playKick(0.7);
    }

    executeShot(striker) {
        const isHome = striker.team === 'home';
        const goalX = isHome ? 0.98 : 0.02;
        const targetY = 0.44 + (Math.random() * 0.12);

        this.ball.carrier = null;
        this.ball.shotStriker = striker;
        this.ball.targetX = goalX;
        this.ball.targetY = targetY;
        this.ball.shotTargetY = targetY;
        this.ball.vx = 0.65;
        this.ball.vy = 0.65;
        this.ball.vz = 0.25;
        this.ball.state = 'SHOT';

        sounds.playKick(1.2);
        this.showActionPopup(`💥 슛! ${striker.name}`, striker.x, striker.y, '#f59e0b');

        // Calculate Goal vs Save vs Miss based on striker stats vs opposing GK
        const sFin = striker.stats.finishing || 15;
        const sPow = striker.stats.longShots || 15;
        const oppGK = (isHome ? this.awayPlayers : this.homePlayers).find(p => p.isGK);
        const gkRef = oppGK ? oppGK.stats.reflexes : 16;

        const goalRoll = Math.random();
        const goalThreshold = (sFin * 0.4 + sPow * 0.2) / (sFin * 0.4 + gkRef * 0.5 + 5);

        if (goalRoll < goalThreshold) {
            this.ball.shotResult = 'GOAL';
        } else if (goalRoll < goalThreshold + 0.35) {
            this.ball.shotResult = 'SAVE';
        } else {
            this.ball.shotResult = 'MISS';
        }
    }

    resolveGoal() {
        this.ball.state = 'GOAL';
        this.ball.vx = 0;
        this.ball.vy = 0;
        sounds.playGoalRoar();
        sounds.playWhistle('short');

        const striker = this.ball.shotStriker || this.homePlayers[10];
        const isHome = striker.team === 'home';

        // Spawn celebration particles
        const particles = [];
        for (let i = 0; i < 70; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 0.002 + Math.random() * 0.006;
            particles.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: ['#ffd700', '#00f0ff', '#ff007f', '#ffffff', '#22c55e'][Math.floor(Math.random() * 5)],
                life: 1.0
            });
        }

        this.goalCelebration = {
            scorer: striker,
            isHome: isHome,
            timer: 160,
            particles: particles
        };

        if (this.onMatchEvent) {
            this.onMatchEvent('GOAL', { striker, isHome, minute: this.matchMinute });
        }
    }

    resolveSave(gk) {
        this.ball.state = 'SAVED';
        sounds.playPostHit();
        sounds.playGroan();

        const gkName = gk ? gk.name : '골키퍼';
        this.showActionPopup(`🧤 슈퍼세이브! (${gkName})`, this.ball.x, this.ball.y, '#00f0ff');

        setTimeout(() => {
            if (gk) {
                this.ball.carrier = gk;
                this.ball.state = 'DRIBBLE';
            } else {
                this.ball.state = 'LOOSE';
            }
        }, 600);

        if (this.onMatchEvent) {
            this.onMatchEvent('SAVE', { gk, striker: this.ball.shotStriker, minute: this.matchMinute });
        }
    }

    resolveMiss() {
        this.ball.state = 'LOOSE';
        sounds.playGroan();
        this.showActionPopup('빗나감!', this.ball.x, this.ball.y, '#94a3b8');

        setTimeout(() => {
            const isHome = this.ball.shotStriker ? this.ball.shotStriker.team === 'home' : true;
            this.resetKickoff(!isHome);
        }, 800);
    }

    attemptTackle(def, carrier) {
        const dTac = def.stats.tackling || 14;
        const cDri = carrier.stats.dribbling || 15;
        const tackleChance = dTac / (dTac + cDri * 0.9);

        if (Math.random() < tackleChance * 0.45) {
            // TACKLE SUCCESSFUL! Turnover!
            this.ball.carrier = def;
            this.ball.state = 'DRIBBLE';
            this.showActionPopup(`🛡️ 태클 차단! (${def.name})`, def.x, def.y, '#10b981');
            sounds.playKick(0.8);
        }
    }

    // MAIN CANVAS RENDERING LOOP
    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const b = this.pitchBounds;

        ctx.clearRect(0, 0, w, h);

        // 1. PITCH BACKGROUND & LAWN STRIPES
        ctx.fillStyle = '#0f2415';
        ctx.fillRect(0, 0, w, h);

        const stripeCount = 14;
        const stripeW = b.width / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#164821' : '#1c5728';
            ctx.fillRect(b.x + i * stripeW, b.y, stripeW, b.height);
        }

        // 2. WHITE PITCH MARKINGS
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(2, 2.5 * (w / 900));

        // Touchline
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // Halfway Line
        const midX = b.x + b.width / 2;
        ctx.beginPath();
        ctx.moveTo(midX, b.y);
        ctx.lineTo(midX, b.y + b.height);
        ctx.stroke();

        // Center Circle & Center Spot
        const cr = b.height * 0.18;
        ctx.beginPath();
        ctx.arc(midX, b.y + b.height / 2, cr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(midX, b.y + b.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Penalty Boxes
        const boxW = b.width * 0.16;
        const boxH = b.height * 0.44;
        const boxY = b.y + (b.height - boxH) / 2;

        ctx.strokeRect(b.x, boxY, boxW, boxH);
        ctx.strokeRect(b.x + b.width - boxW, boxY, boxW, boxH);

        // 6-yard boxes
        const sBoxW = b.width * 0.055;
        const sBoxH = b.height * 0.22;
        const sBoxY = b.y + (b.height - sBoxH) / 2;
        ctx.strokeRect(b.x, sBoxY, sBoxW, sBoxH);
        ctx.strokeRect(b.x + b.width - sBoxW, sBoxY, sBoxW, sBoxH);

        // Goal Nets with depth
        const gW = 12;
        const gH = b.height * 0.18;
        const gY = b.y + (b.height - gH) / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(b.x - gW, gY, gW, gH);
        ctx.fillRect(b.x + b.width, gY, gW, gH);
        ctx.strokeRect(b.x - gW, gY, gW, gH);
        ctx.strokeRect(b.x + b.width, gY, gW, gH);

        // 3. RENDER ALL PLAYERS
        const radius = Math.max(10, 13 * (w / 900));

        this.allPlayers.forEach(p => {
            const px = b.x + p.x * b.width;
            const py = b.y + p.y * b.height;
            const isHome = p.team === 'home';
            const col1 = isHome ? this.homeColor1 : this.awayColor1;
            const col2 = isHome ? this.homeColor2 : this.awayColor2;

            // Ball carrier pulsing aura ring
            if (p === this.ball.carrier) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(px, py, radius + 4, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(px, py + radius * 0.8, radius * 0.8, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Player Kit Circle
            ctx.fillStyle = col1;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = col2;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Jersey Number
            ctx.fillStyle = col2;
            ctx.font = `900 ${Math.round(radius * 0.85)}px Pretendard, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.num, px, py);

            // Name Tag & OVR
            ctx.fillStyle = '#ffffff';
            ctx.font = `700 ${Math.round(radius * 0.72)}px Pretendard, sans-serif`;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            const displayName = p.name.length > 5 ? p.name.slice(0, 4) + '..' : p.name;
            ctx.fillText(`${displayName} ${p.ovr}`, px, py - radius - 4);
            ctx.shadowBlur = 0;
        });

        // 4. RENDER BALL WITH 3D SHADOW & TRAIL
        const bx = b.x + this.ball.x * b.width;
        const by = b.y + this.ball.y * b.height;
        const ballR = Math.max(5, 6.5 * (w / 900));
        const shadowOffset = (this.ball.z || 0) * 20;

        // Ball shadow on pitch
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(bx, by + shadowOffset, ballR * 1.3, ballR * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball 3D sphere
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by - shadowOffset, ballR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 5. ACTION POPUP BUBBLE
        if (this.actionPopup) {
            const popX = b.x + this.actionPopup.x * b.width;
            const popY = b.y + this.actionPopup.y * b.height - 25;
            ctx.globalAlpha = Math.max(0, this.actionPopup.life);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = this.actionPopup.color;
            ctx.lineWidth = 2;

            const txtW = ctx.measureText(this.actionPopup.text).width + 20;
            ctx.fillRect(popX - txtW / 2, popY - 14, txtW, 28);
            ctx.strokeRect(popX - txtW / 2, popY - 14, txtW, 28);

            ctx.fillStyle = this.actionPopup.color;
            ctx.font = 'bold 13px Pretendard, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.actionPopup.text, popX, popY + 4);
            ctx.globalAlpha = 1.0;
        }

        // 6. GOAL CELEBRATION OVERLAY & PARTICLES
        if (this.goalCelebration) {
            this.goalCelebration.particles.forEach(pt => {
                ctx.fillStyle = pt.color;
                ctx.globalAlpha = Math.max(0, pt.life);
                ctx.beginPath();
                ctx.arc(b.x + pt.x * b.width, b.y + pt.y * b.height, 4, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            // Flashy Goal Banner
            const bannerW = Math.min(460, w * 0.7);
            const bannerH = 65;
            const banX = (w - bannerW) / 2;
            const banY = b.y + 25;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.fillRect(banX, banY, bannerW, bannerH);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(banX, banY, bannerW, bannerH);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Pretendard, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⚽ GOOOOALLL! ${this.goalCelebration.scorer.name}!`, w / 2, banY + 40);
        }
    }
}

if (typeof window !== 'undefined') {
    window.PitchCanvas = PitchCanvas;
}
