// 2D Tactical Pitch Canvas Renderer & Autonomous Football AI Engine for Architects FC
class PitchCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        // Player entities
        this.homePlayers = [];
        this.awayPlayers = [];

        // Realistic Ball with 3D coordinates & state machine
        this.ball = {
            x: 0.5,
            y: 0.5,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            targetX: 0.5,
            targetY: 0.5,
            carrier: null, // reference to current possessor player
            carrierTeam: null, // 'home' | 'away'
            state: 'POSSESSED', // 'POSSESSED' | 'IN_FLIGHT' | 'SHOT' | 'LOOSE' | 'GOAL'
            passTarget: null,
            trail: []
        };

        // Match state & simulation controls
        this.isPlaying = false;
        this.simSpeed = 1; // 1x, 2x, 5x
        this.homeColor = '#1e5fad';
        this.awayColor = '#b83280';
        this.passTrail = [];
        this.particles = [];
        this.specialAura = null;
        this.animationId = null;
        this.lastAiTick = 0;
        this.lastDribbleTick = 0;

        // Pitch dimensions cache
        this.pitchBounds = { padX: 25, padY: 20, width: 750, height: 460 };

        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.startLoop();
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * (window.devicePixelRatio || 1);
        this.canvas.height = rect.height * (window.devicePixelRatio || 1);
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.pitchBounds = {
            padX: 25 * (w / 800),
            padY: 20 * (h / 500),
            width: w - 50 * (w / 800),
            height: h - 40 * (h / 500)
        };
    }

    startLoop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        const loop = (timestamp) => {
            this.update(timestamp);
            this.render();
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }

    // Set Teams & Formations with rich AI profiles
    setTeamPositions(homePositions, awayPositions, homeColor, awayColor) {
        this.homeColor = homeColor || '#1e5fad';
        this.awayColor = awayColor || '#b83280';

        const createPlayerEntity = (p, team, idx) => {
            const isHome = team === 'home';
            return {
                id: p.id || `${team}-${idx}`,
                team: team,
                idx: idx,
                name: p.name || `선수 ${idx + 1}`,
                pos: p.pos || 'MF',
                countryFlag: p.countryFlag || '',
                num: p.num || idx + 1,
                ovr: p.ovr || 88,
                stats: p.stats || { STR: 85, TEC: 85, SPD: 85, PAS: 85, POW: 85, MNT: 85 },
                baseX: p.x,
                baseY: p.y,
                x: p.x,
                y: p.y,
                vx: 0,
                vy: 0,
                angle: isHome ? 0 : Math.PI,
                state: 'IDLE', // 'IDLE', 'DRIBBLE', 'SUPPORT', 'RUN_IN_BEHIND', 'PRESS', 'DIVING', 'CELEBRATE'
                targetX: p.x,
                targetY: p.y,
                color: isHome ? this.homeColor : this.awayColor,
                stamina: 100,
                hasBall: false,
                diveProgress: 0
            };
        };

        this.homePlayers = homePositions.map((p, idx) => createPlayerEntity(p, 'home', idx));
        this.awayPlayers = awayPositions.map((p, idx) => createPlayerEntity(p, 'away', idx));

        // Place ball at midfield with home center midfielder
        this.resetKickoff('home');
    }

    resetKickoff(kickoffTeam = 'home') {
        const teamPlayers = kickoffTeam === 'home' ? this.homePlayers : this.awayPlayers;
        const cm = teamPlayers.find(p => p.pos === 'MF') || teamPlayers[Math.min(5, teamPlayers.length - 1)];

        this.homePlayers.forEach(p => {
            p.x = p.baseX;
            p.y = p.baseY;
            p.targetX = p.baseX;
            p.targetY = p.baseY;
            p.vx = 0;
            p.vy = 0;
            p.hasBall = false;
            p.state = 'IDLE';
        });

        this.awayPlayers.forEach(p => {
            p.x = p.baseX;
            p.y = p.baseY;
            p.targetX = p.baseX;
            p.targetY = p.baseY;
            p.vx = 0;
            p.vy = 0;
            p.hasBall = false;
            p.state = 'IDLE';
        });

        if (cm) {
            cm.x = kickoffTeam === 'home' ? 0.48 : 0.52;
            cm.y = 0.5;
            this.setPossession(cm);
        } else {
            this.ball.x = 0.5;
            this.ball.y = 0.5;
            this.ball.state = 'LOOSE';
            this.ball.carrier = null;
        }
    }

    setPossession(player) {
        if (!player) return;
        // Strip possession from all
        this.homePlayers.forEach(p => p.hasBall = false);
        this.awayPlayers.forEach(p => p.hasBall = false);

        player.hasBall = true;
        this.ball.carrier = player;
        this.ball.carrierTeam = player.team;
        this.ball.state = 'POSSESSED';
        this.ball.x = player.x + Math.cos(player.angle) * 0.018;
        this.ball.y = player.y + Math.sin(player.angle) * 0.018;
        this.ball.z = 0;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.passTarget = null;
    }

    // Execute realistic pass from one player to another
    passBall(fromPlayer, toPlayer, isThroughBall = false) {
        if (!fromPlayer || !toPlayer) return;

        fromPlayer.hasBall = false;
        this.ball.carrier = null;
        this.ball.state = 'IN_FLIGHT';
        this.ball.passTarget = toPlayer;

        // Aim ahead of player if through ball
        const leadDist = isThroughBall ? 0.045 : 0.01;
        const forwardDir = toPlayer.team === 'home' ? 1 : -1;
        const targetX = Math.max(0.05, Math.min(0.95, toPlayer.x + forwardDir * leadDist));
        const targetY = toPlayer.y;

        const dx = targetX - fromPlayer.x;
        const dy = targetY - fromPlayer.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const passSpeed = (0.016 + (fromPlayer.stats.PAS / 100) * 0.014) * (this.simSpeed || 1);

        this.ball.vx = (dx / dist) * passSpeed;
        this.ball.vy = (dy / dist) * passSpeed;
        this.ball.vz = isThroughBall ? 1.5 : 0;

        fromPlayer.angle = Math.atan2(dy, dx);

        // Add visual pass trail
        this.passTrail.push({
            startX: fromPlayer.x,
            startY: fromPlayer.y,
            endX: targetX,
            endY: targetY,
            alpha: 1.0,
            isShot: false
        });

        if (typeof sounds !== 'undefined' && sounds.playKick) {
            sounds.playKick();
        }
    }

    // Execute rocket shot towards goal
    shootBall(shooter, isGoal = false, goalkeeper = null, skill = null) {
        if (!shooter) return;

        shooter.hasBall = false;
        this.ball.carrier = null;
        this.ball.state = 'SHOT';
        this.ball.passTarget = null;

        const isHome = shooter.team === 'home';
        const goalX = isHome ? 0.98 : 0.02;
        // Aim for top/bottom corner
        const cornerAim = Math.random() < 0.5 ? 0.44 : 0.56;
        const goalY = isGoal ? cornerAim : (Math.random() < 0.5 ? 0.38 : 0.62);

        const dx = goalX - shooter.x;
        const dy = goalY - shooter.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const shotSpeed = (0.026 + (shooter.stats.POW / 100) * 0.02) * (this.simSpeed || 1);

        this.ball.vx = (dx / dist) * shotSpeed;
        this.ball.vy = (dy / dist) * shotSpeed;
        this.ball.vz = 2.0;

        shooter.angle = Math.atan2(dy, dx);

        this.passTrail.push({
            startX: shooter.x,
            startY: shooter.y,
            endX: goalX,
            endY: goalY,
            alpha: 1.0,
            isShot: true
        });

        if (skill) {
            this.triggerAura(shooter.x, shooter.y, isHome ? '#c8ff00' : '#e5c158');
        }

        if (typeof sounds !== 'undefined' && sounds.playKick) {
            sounds.playKick();
        }

        // Trigger Goalkeeper diving animation
        if (goalkeeper) {
            goalkeeper.state = 'DIVING';
            goalkeeper.diveProgress = 1.0;
            goalkeeper.targetY = goalY;
        }
    }

    // Dynamic AI Update Loop (Runs at 60 FPS)
    update(timestamp) {
        const now = timestamp || Date.now();
        const dt = (now - this.lastAiTick) || 16;
        const speedMultiplier = this.simSpeed || 1;

        // 1. BALL PHYSICS & TRAJECTORY UPDATE
        if (this.ball.state === 'POSSESSED' && this.ball.carrier) {
            const p = this.ball.carrier;
            // Dribbling micro-bobbing at player's feet
            const bobbing = Math.sin(now * 0.015) * 0.003;
            this.ball.x = p.x + Math.cos(p.angle) * 0.018;
            this.ball.y = p.y + Math.sin(p.angle) * 0.018 + bobbing;
            this.ball.z = 0;
            this.ball.vx = p.vx;
            this.ball.vy = p.vy;
        } else if (this.ball.state === 'IN_FLIGHT' || this.ball.state === 'SHOT' || this.ball.state === 'LOOSE') {
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;

            // Deceleration friction
            this.ball.vx *= 0.985;
            this.ball.vy *= 0.985;

            // Height curve
            if (this.ball.vz > 0) {
                this.ball.z += this.ball.vz * 0.4;
                this.ball.vz -= 0.1;
                if (this.ball.z <= 0) this.ball.z = 0;
            }

            // Check if ball reached receiver or interceptor
            const allPlayers = [...this.homePlayers, ...this.awayPlayers];
            for (const p of allPlayers) {
                const dist = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
                const isTarget = this.ball.passTarget && this.ball.passTarget.id === p.id;
                const catchRadius = p.pos === 'GK' ? 0.038 : 0.024;

                if (dist < catchRadius && this.ball.z < 2) {
                    // Receiver traps or interceptor tackles!
                    this.setPossession(p);
                    break;
                }
            }

            // Check goal boundaries
            if (this.ball.x >= 0.98 && this.ball.y >= 0.42 && this.ball.y <= 0.58) {
                // Home Goal Scored!
                this.ball.state = 'GOAL';
                this.triggerGoalExplosion(true);
            } else if (this.ball.x <= 0.02 && this.ball.y >= 0.42 && this.ball.y <= 0.58) {
                // Away Goal Scored!
                this.ball.state = 'GOAL';
                this.triggerGoalExplosion(false);
            }

            // Out of bounds reflection/damping
            if (this.ball.x < 0.02 || this.ball.x > 0.98) this.ball.vx *= -0.5;
            if (this.ball.y < 0.04 || this.ball.y > 0.96) this.ball.vy *= -0.5;
        }

        // 2. AUTONOMOUS PLAYER AI TICK (Every ~120ms or frame throttled)
        if (now - this.lastAiTick > (100 / speedMultiplier)) {
            this.lastAiTick = now;
            this.updatePlayerAI();
        }

        // 3. SMOOTH KINEMATICS & PLAYER MOVEMENT
        const updatePlayerPhysics = (p) => {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.hypot(dx, dy);

            // Movement speed based on SPD stat
            const baseSpd = (0.0022 + (p.stats.SPD / 100) * 0.002) * speedMultiplier;
            const accel = dist > 0.1 ? baseSpd * 1.4 : baseSpd;

            if (dist > 0.005) {
                p.vx = (dx / dist) * accel;
                p.vy = (dy / dist) * accel;
                p.x += p.vx;
                p.y += p.vy;
                p.angle = Math.atan2(dy, dx);
            } else {
                p.vx *= 0.6;
                p.vy *= 0.6;
            }

            // Clamp inside pitch boundaries
            p.x = Math.max(0.04, Math.min(0.96, p.x));
            p.y = Math.max(0.06, Math.min(0.94, p.y));

            // Goalkeeper diving recovery
            if (p.diveProgress > 0) {
                p.diveProgress -= 0.04;
                if (p.diveProgress <= 0) p.state = 'IDLE';
            }
        };

        this.homePlayers.forEach(updatePlayerPhysics);
        this.awayPlayers.forEach(updatePlayerPhysics);

        // 4. UPDATE VISUAL FX TRAILS & PARTICLES
        for (let i = this.passTrail.length - 1; i >= 0; i--) {
            this.passTrail[i].alpha -= 0.03 * speedMultiplier;
            if (this.passTrail[i].alpha <= 0) this.passTrail.splice(i, 1);
        }

        if (this.specialAura) {
            this.specialAura.radius += 2 * speedMultiplier;
            this.specialAura.alpha -= 0.035 * speedMultiplier;
            if (this.specialAura.alpha <= 0) this.specialAura = null;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx * speedMultiplier;
            pt.y += pt.vy * speedMultiplier;
            pt.life -= pt.decay * speedMultiplier;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }
    }

    // Player AI Decision Matrix (Football Manager / FIFA 2D Match Engine)
    updatePlayerAI() {
        const carrier = this.ball.carrier;
        const attackingTeam = carrier ? (carrier.team === 'home' ? this.homePlayers : this.awayPlayers) : null;
        const defendingTeam = carrier ? (carrier.team === 'home' ? this.awayPlayers : this.homePlayers) : null;

        // If no carrier, nearest players rush toward the loose ball
        if (!carrier) {
            const findNearest = (list) => {
                let nearest = null;
                let minDist = 999;
                list.forEach(p => {
                    const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
                    if (d < minDist) { minDist = d; nearest = p; }
                });
                return nearest;
            };
            const nearHome = findNearest(this.homePlayers);
            const nearAway = findNearest(this.awayPlayers);
            if (nearHome) { nearHome.targetX = this.ball.x; nearHome.targetY = this.ball.y; }
            if (nearAway) { nearAway.targetX = this.ball.x; nearAway.targetY = this.ball.y; }
            return;
        }

        const isHomeAttacking = carrier.team === 'home';
        const opponentGoalX = isHomeAttacking ? 0.98 : 0.02;
        const ownGoalX = isHomeAttacking ? 0.02 : 0.98;

        // --- A. CARRIER AI (DRIBBLE, PASS, SHOOT) ---
        const distToGoal = Math.abs(opponentGoalX - carrier.x);

        // 1. Decision: Shoot if in shooting range (< 0.28 from goal)
        if (distToGoal < 0.26 && Math.random() < 0.32) {
            const gk = defendingTeam.find(p => p.pos === 'GK');
            const isGoal = Math.random() < 0.45;
            this.shootBall(carrier, isGoal, gk, carrier.ovr > 92);
            return;
        }

        // 2. Decision: Pass to an open teammate making a run
        const teammates = attackingTeam.filter(p => p.id !== carrier.id);
        const openTeammates = teammates.filter(p => {
            const distFromCarrier = Math.hypot(p.x - carrier.x, p.y - carrier.y);
            const isForward = isHomeAttacking ? (p.x > carrier.x) : (p.x < carrier.x);
            return distFromCarrier > 0.08 && distFromCarrier < 0.42 && (isForward || Math.random() < 0.2);
        });

        if (openTeammates.length > 0 && Math.random() < 0.42) {
            // Pick teammate with best tactical position
            openTeammates.sort((a, b) => {
                const distA = Math.abs(opponentGoalX - a.x);
                const distB = Math.abs(opponentGoalX - b.x);
                return distA - distB;
            });
            const targetTeammate = openTeammates[0];
            const isThrough = targetTeammate.pos === 'FW' && Math.random() < 0.5;
            this.passBall(carrier, targetTeammate, isThrough);
            return;
        }

        // 3. Otherwise: Dribble forward into open space
        const forwardStep = isHomeAttacking ? 0.06 : -0.06;
        const flankStep = (Math.random() - 0.5) * 0.04;
        carrier.targetX = Math.max(0.06, Math.min(0.94, carrier.x + forwardStep));
        carrier.targetY = Math.max(0.12, Math.min(0.88, carrier.y + flankStep));
        carrier.state = 'DRIBBLE';

        // --- B. ATTACKING OFF-THE-BALL AI (RUNS & SUPPORT) ---
        teammates.forEach(p => {
            if (p.pos === 'FW') {
                // Strikers & Wingers make penetrating forward runs behind defenders
                const runDepth = isHomeAttacking ? (carrier.x + 0.12 + Math.random() * 0.1) : (carrier.x - 0.12 - Math.random() * 0.1);
                p.targetX = Math.max(0.08, Math.min(0.92, runDepth));
                p.targetY = p.baseY + (Math.sin(Date.now() * 0.002 + p.idx) * 0.08);
                p.state = 'RUN_IN_BEHIND';
            } else if (p.pos === 'MF') {
                // Midfielders support carrier to form passing triangle
                const supportX = carrier.x + (isHomeAttacking ? 0.04 : -0.04);
                p.targetX = Math.max(0.15, Math.min(0.85, supportX + (p.baseX - 0.5) * 0.2));
                p.targetY = p.baseY + (carrier.y - p.baseY) * 0.35;
                p.state = 'SUPPORT';
            } else if (p.pos === 'DF') {
                // Defensive line pushes up to halfway line to maintain compact team shape
                const compactX = isHomeAttacking ? Math.min(0.55, carrier.x * 0.6) : Math.max(0.45, 1 - (1 - carrier.x) * 0.6);
                p.targetX = compactX;
                p.targetY = p.baseY;
                p.state = 'IDLE';
            }
        });

        // --- C. DEFENSIVE AI (PRESSING & MARKING) ---
        // 1. Nearest defender actively rushes to press and tackle the ball carrier
        let nearestDefender = null;
        let minDefDist = 999;
        defendingTeam.forEach(p => {
            if (p.pos !== 'GK') {
                const dist = Math.hypot(p.x - carrier.x, p.y - carrier.y);
                if (dist < minDefDist) {
                    minDefDist = dist;
                    nearestDefender = p;
                }
            }
        });

        if (nearestDefender) {
            nearestDefender.targetX = carrier.x;
            nearestDefender.targetY = carrier.y;
            nearestDefender.state = 'PRESS';

            // Attempt Tackle if within close range
            if (minDefDist < 0.025) {
                const defPower = (nearestDefender.stats.STR + nearestDefender.stats.MNT) / 2;
                const attPower = (carrier.stats.TEC + carrier.stats.SPD) / 2;
                if (Math.random() * defPower > Math.random() * attPower * 0.9) {
                    // Tackle successful! Turnover!
                    this.setPossession(nearestDefender);
                    return;
                }
            }
        }

        // 2. Other defenders track runs and keep defensive line
        defendingTeam.forEach(p => {
            if (p.id !== (nearestDefender ? nearestDefender.id : '')) {
                if (p.pos === 'GK') {
                    // Goalkeeper positions along bisector angle to the ball
                    p.targetX = isHomeAttacking ? 0.94 : 0.06;
                    p.targetY = 0.44 + (carrier.y - 0.5) * 0.28;
                } else if (p.pos === 'DF') {
                    // Maintain defensive depth between carrier and own goal
                    const defLineX = isHomeAttacking ? Math.max(0.68, carrier.x + 0.08) : Math.min(0.32, carrier.x - 0.08);
                    p.targetX = defLineX;
                    p.targetY = p.baseY + (carrier.y - p.baseY) * 0.2;
                } else {
                    // Midfielders track back to protect defensive zone
                    p.targetX = carrier.x + (isHomeAttacking ? 0.06 : -0.06);
                    p.targetY = p.baseY;
                }
            }
        });
    }

    // High-energy particle auras for skill activations
    triggerAura(x, y, color = '#c8ff00') {
        this.specialAura = { x, y, radius: 10, maxRadius: 55, alpha: 1.0, color };
        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 3.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed * 0.003,
                vy: Math.sin(angle) * speed * 0.003,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                color: color,
                size: 2.5 + Math.random() * 3.5
            });
        }
    }

    // Goal celebration fireworks explosion
    triggerGoalExplosion(isHomeGoal) {
        const gx = isHomeGoal ? 0.96 : 0.04;
        const gy = 0.5;
        for (let i = 0; i < 70; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 5.5;
            this.particles.push({
                x: gx, y: gy,
                vx: Math.cos(angle) * speed * 0.004,
                vy: Math.sin(angle) * speed * 0.004,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.02,
                color: ['#c8ff00', '#e5c158', '#00f0ff', '#ffffff', '#ff3366'][Math.floor(Math.random() * 5)],
                size: 3 + Math.random() * 5
            });
        }

        // Celebrate: Scorer runs towards corner flag
        const team = isHomeGoal ? this.homePlayers : this.awayPlayers;
        const scorer = this.ball.carrier || team.find(p => p.pos === 'FW') || team[0];
        if (scorer) {
            scorer.targetX = isHomeGoal ? 0.95 : 0.05;
            scorer.targetY = 0.12;
            scorer.state = 'CELEBRATE';
        }
    }

    // Compatibility method for legacy external calls
    moveBall(tx, ty, isShot = false, isPass = false) {
        if (isShot) {
            const attacker = (this.homePlayers.find(p => p.hasBall) || this.awayPlayers.find(p => p.hasBall)) || this.homePlayers[0];
            const gk = (attacker.team === 'home' ? this.awayPlayers : this.homePlayers).find(p => p.pos === 'GK');
            this.shootBall(attacker, Math.random() < 0.5, gk);
        } else {
            this.ball.x = tx;
            this.ball.y = ty;
        }
    }

    // RENDER CANVAS (EA SPORTS FC / FIFA ONLINE 4 BROADCAST AESTHETICS)
    render() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const { padX, padY, width: pitchW, height: pitchH } = this.pitchBounds;

        ctx.clearRect(0, 0, w, h);

        // 1. Stadium Grass Pitch with Horizontal Mow Stripes
        const stripeCount = 12;
        const stripeH = pitchH / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#163b21' : '#1c4929';
            ctx.fillRect(padX, padY + i * stripeH, pitchW, stripeH);
        }

        // 2. Pristine White Stadium Chalk Markings
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = Math.max(1.5, 2 * (w / 800));

        // Outer touchlines
        ctx.strokeRect(padX, padY, pitchW, pitchH);

        // Halfway line
        ctx.beginPath();
        ctx.moveTo(padX + pitchW / 2, padY);
        ctx.lineTo(padX + pitchW / 2, padY + pitchH);
        ctx.stroke();

        // Center circle & spot
        const centerR = pitchH * 0.18;
        ctx.beginPath();
        ctx.arc(padX + pitchW / 2, padY + pitchH / 2, centerR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(padX + pitchW / 2, padY + pitchH / 2, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Left Penalty Box & 6-yard box
        const penW = pitchW * 0.16;
        const penH = pitchH * 0.52;
        ctx.strokeRect(padX, padY + (pitchH - penH) / 2, penW, penH);

        const sixW = pitchW * 0.055;
        const sixH = pitchH * 0.28;
        ctx.strokeRect(padX, padY + (pitchH - sixH) / 2, sixW, sixH);

        // Left Penalty Spot & Arc
        ctx.beginPath();
        ctx.arc(padX + penW * 0.72, padY + pitchH / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Right Penalty Box & 6-yard box
        ctx.strokeRect(padX + pitchW - penW, padY + (pitchH - penH) / 2, penW, penH);
        ctx.strokeRect(padX + pitchW - sixW, padY + (pitchH - sixH) / 2, sixW, sixH);

        // Right Penalty Spot & Arc
        ctx.beginPath();
        ctx.arc(padX + pitchW - penW * 0.72, padY + pitchH / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // 3D Goals & Netting
        const netDepth = 14 * (w / 800);
        const goalH = pitchH * 0.22;
        // Left Net
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(padX - netDepth, padY + (pitchH - goalH) / 2, netDepth, goalH);
        ctx.strokeRect(padX - netDepth, padY + (pitchH - goalH) / 2, netDepth, goalH);
        // Right Net
        ctx.fillRect(padX + pitchW, padY + (pitchH - goalH) / 2, netDepth, goalH);
        ctx.strokeRect(padX + pitchW, padY + (pitchH - goalH) / 2, netDepth, goalH);

        // Corner Arcs
        const cornerR = 10 * (w / 800);
        ctx.beginPath(); ctx.arc(padX, padY, cornerR, 0, Math.PI * 0.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(padX, padY + pitchH, cornerR, Math.PI * 1.5, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(padX + pitchW, padY, cornerR, Math.PI * 0.5, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(padX + pitchW, padY + pitchH, cornerR, Math.PI, Math.PI * 1.5); ctx.stroke();
        ctx.restore();

        // 3. Render Dynamic Pass Trails
        this.passTrail.forEach(trail => {
            ctx.save();
            ctx.strokeStyle = trail.isShot ? `rgba(255, 60, 0, ${trail.alpha})` : `rgba(200, 255, 0, ${trail.alpha})`;
            ctx.lineWidth = trail.isShot ? 3.5 : 2;
            ctx.setLineDash(trail.isShot ? [] : [6, 4]);
            ctx.beginPath();
            ctx.moveTo(padX + trail.startX * pitchW, padY + trail.startY * pitchH);
            ctx.lineTo(padX + trail.endX * pitchW, padY + trail.endY * pitchH);
            ctx.stroke();
            ctx.restore();
        });

        // 4. Render Aura
        if (this.specialAura) {
            ctx.save();
            ctx.beginPath();
            const ax = padX + this.specialAura.x * pitchW;
            const ay = padY + this.specialAura.y * pitchH;
            ctx.arc(ax, ay, this.specialAura.radius, 0, Math.PI * 2);
            ctx.strokeStyle = this.specialAura.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = this.specialAura.alpha;
            ctx.shadowColor = this.specialAura.color;
            ctx.shadowBlur = 16;
            ctx.stroke();
            ctx.restore();
        }

        // 5. Render Fireworks / Confetti Particles
        this.particles.forEach(pt => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(padX + pt.x * pitchW, padY + pt.y * pitchH, pt.size, 0, Math.PI * 2);
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = Math.max(0, pt.life);
            ctx.fill();
            ctx.restore();
        });

        // 6. DRAW ALL 22 PLAYERS WITH DIRECTION ARROWS & FC ONLINE CURSOR
        const drawPlayer = (p) => {
            const px = padX + p.x * pitchW;
            const py = padY + p.y * pitchH;
            const radius = 12 * (w / 800);
            const isCarrier = p.hasBall;

            ctx.save();

            // A. Active Carrier FIFA Volt Ring & Cursor
            if (isCarrier) {
                // Expanding pulse ring
                ctx.beginPath();
                ctx.arc(px, py, radius + 5, 0, Math.PI * 2);
                ctx.strokeStyle = '#c8ff00';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#c8ff00';
                ctx.shadowBlur = 14;
                ctx.stroke();

                // FIFA Online Floating Triangle Cursor above player's head (▼)
                const cursorY = py - radius - 12;
                ctx.beginPath();
                ctx.moveTo(px, cursorY + 6);
                ctx.lineTo(px - 5, cursorY);
                ctx.lineTo(px + 5, cursorY);
                ctx.closePath();
                ctx.fillStyle = '#c8ff00';
                ctx.shadowColor = '#c8ff00';
                ctx.shadowBlur = 8;
                ctx.fill();
            }

            // B. Movement Facing Direction Cone/Notch
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(p.angle);
            ctx.beginPath();
            ctx.moveTo(radius + 4, 0);
            ctx.lineTo(radius - 2, -3.5);
            ctx.lineTo(radius - 2, 3.5);
            ctx.closePath();
            ctx.fillStyle = isCarrier ? '#c8ff00' : 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
            ctx.restore();

            // C. Player Disk Outer Border
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fillStyle = p.pos === 'GK' ? '#ffd700' : p.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // D. Player Jersey Number or Position
            ctx.fillStyle = p.pos === 'GK' ? '#0a0d14' : '#ffffff';
            ctx.font = `800 ${Math.max(9, Math.round(10.5 * (w / 800)))}px 'Oswald', 'Pretendard', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.num || p.pos, px, py);

            // E. Building Name Tag with Country Flag
            const shortName = p.name ? (p.name.length > 5 ? p.name.substring(0, 4) + '..' : p.name) : '';
            const flag = p.countryFlag ? p.countryFlag + ' ' : '';
            const tagText = flag + shortName;

            ctx.font = `600 ${Math.max(8, Math.round(9 * (w / 800)))}px 'Pretendard', sans-serif`;
            const textMetrics = ctx.measureText(tagText);
            const tagW = textMetrics.width + 8;
            const tagH = 14 * (h / 500);

            // Semi-transparent pill backing
            ctx.fillStyle = 'rgba(6, 9, 15, 0.78)';
            ctx.beginPath();
            ctx.roundRect(px - tagW / 2, py + radius + 4, tagW, tagH, 3);
            ctx.fill();

            // Text
            ctx.fillStyle = isCarrier ? '#c8ff00' : '#ffffff';
            ctx.fillText(tagText, px, py + radius + 11);

            ctx.restore();
        };

        this.awayPlayers.forEach(p => drawPlayer(p));
        this.homePlayers.forEach(p => drawPlayer(p));

        // 7. DRAW 3D SOCCER BALL WITH TURF SHADOW
        const bx = padX + this.ball.x * pitchW;
        const by = padY + this.ball.y * pitchH;
        const bz = this.ball.z || 0;
        const ballR = 5.5 * (w / 800);

        ctx.save();
        // Ground Shadow
        ctx.beginPath();
        ctx.ellipse(bx, by + bz * 0.8, ballR * (1 + bz * 0.05), ballR * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.15, 0.45 - bz * 0.03)})`;
        ctx.fill();

        // Elevated Ball Sphere
        const ballDrawY = by - bz;
        ctx.beginPath();
        ctx.arc(bx, ballDrawY, ballR, 0, Math.PI * 2);
        const ballGrad = ctx.createRadialGradient(bx - ballR * 0.3, ballDrawY - ballR * 0.3, ballR * 0.1, bx, ballDrawY, ballR);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.8, '#e0e0e0');
        ballGrad.addColorStop(1, '#9e9e9e');
        ctx.fillStyle = ballGrad;
        ctx.fill();
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pentagon details
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(bx, ballDrawY, ballR * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Ball Glow if Shot
        if (this.ball.state === 'SHOT') {
            ctx.beginPath();
            ctx.arc(bx, ballDrawY, ballR + 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 80, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    }
}
