// ============================================================================
// Broadcast-Grade 2D Tactical Football Engine & Interactive Match Simulator (pitch.js)
// - Stadium Floodlights, Mowed Turf, Penalty Arcs, 3D Goal Nets with Ripple
// - Directional Player Arrows, Stamina Bars, Pass Trajectory Lines, Shot Comet Trails
// - Real-Time User Commands: PASS_TO_ME, SHOOT, THROUGH_PASS, DRIBBLE_PRESS & Tactical Mentality
// ============================================================================

class PitchCanvas {
    constructor(canvasId) {
        this.canvas = typeof document !== 'undefined' ? document.getElementById(canvasId) : null;
        this.ctx = (this.canvas && this.canvas.getContext) ? this.canvas.getContext('2d') : null;

        this.homePlayers = [];
        this.awayPlayers = [];
        this.allPlayers = [];

        this.ball = {
            x: 0.5,
            y: 0.5,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            carrier: null,
            lastCarrier: null,
            state: 'KICKOFF', // 'KICKOFF', 'DRIBBLE', 'PASS', 'SHOT', 'LOOSE', 'GOAL', 'SAVED'
            passStartX: 0.5,
            passStartY: 0.5,
            passTarget: null,
            targetX: 0.5,
            targetY: 0.5,
            shotTargetY: 0.5,
            shotResult: null,
            shotStriker: null,
            trail: []
        };

        this.homeColor1 = '#0284c7';
        this.homeColor2 = '#ffffff';
        this.awayColor1 = '#ef4444';
        this.awayColor2 = '#ffffff';
        this.homeName = 'HOME';
        this.awayName = 'AWAY';

        this.simSpeed = 1;
        this.isMatchActive = false;
        this.tacticalMentality = 'BALANCED'; // 'BALANCED', 'ATTACK', 'GEGENPRESS', 'TIKITAKA', 'COUNTER'
        this.pitchBounds = { x: 30, y: 24, width: 840, height: 492 };
        this.actionPopup = null;
        this.goalCelebration = null;
        this.tackleRings = [];
        this.netRipple = { side: null, timer: 0 };

        this.onMatchEvent = null;
        this.matchMinute = 0;
        this.homePossessionTicks = 50;
        this.awayPossessionTicks = 50;

        if (this.canvas && typeof window !== 'undefined') {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.startLoop();
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect ? this.canvas.getBoundingClientRect() : { width: 880, height: 520 };
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

        const width = (rect.width > 50) ? rect.width : (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 880) || 880;
        const height = (rect.height > 50) ? rect.height : 520;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const padX = Math.max(24, 34 * (w / 900));
        const padY = Math.max(22, 30 * (h / 540));

        this.pitchBounds = {
            x: padX,
            y: padY,
            width: w - padX * 2,
            height: h - padY * 2
        };
    }

    startLoop() {
        if (typeof requestAnimationFrame === 'undefined') return;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        const loop = (ts) => {
            this.update(ts || Date.now());
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
        this.homeName = homeTeam.name || 'HOME';
        this.awayName = awayTeam.name || 'AWAY';

        const homeCoords = this.getFormationCoords(homeTeam.formation || '4-3-3', true);
        const awayCoords = this.getFormationCoords(awayTeam.formation || '4-3-3', false);

        this.homePlayers = (homeTeam.startingXI || []).map((p, idx) => {
            const c = homeCoords[idx] || { x: 0.2, y: 0.5, pos: p.pos };
            return {
                id: p.id,
                name: p.koreanName || p.name,
                koreanName: p.koreanName || p.name,
                pos: p.pos || c.pos,
                num: p.num || (idx + 1),
                team: 'home',
                stats: p.stats || { finishing: 14, passing: 14, dribbling: 14, pace: 14, tackling: 14, reflexes: 14 },
                ovr: p.ovr || 75,
                isPlayerCharacter: !!p.isPlayerCharacter,
                stamina: 100,
                facingAngle: 0,
                speedBoostTimer: 0,
                baseX: c.x,
                baseY: c.y,
                x: c.x,
                y: c.y,
                vx: 0,
                vy: 0,
                targetX: c.x,
                targetY: c.y,
                isGK: (p.pos || c.pos) === 'GK' || idx === 0
            };
        });

        this.awayPlayers = (awayTeam.startingXI || []).map((p, idx) => {
            const c = awayCoords[idx] || { x: 0.8, y: 0.5, pos: p.pos };
            return {
                id: p.id,
                name: p.koreanName || p.name,
                koreanName: p.koreanName || p.name,
                pos: p.pos || c.pos,
                num: p.num || (idx + 1),
                team: 'away',
                stats: p.stats || { finishing: 14, passing: 14, dribbling: 14, pace: 14, tackling: 14, reflexes: 14 },
                ovr: p.ovr || 75,
                isPlayerCharacter: false,
                stamina: 100,
                facingAngle: Math.PI,
                speedBoostTimer: 0,
                baseX: c.x,
                baseY: c.y,
                x: c.x,
                y: c.y,
                vx: 0,
                vy: 0,
                targetX: c.x,
                targetY: c.y,
                isGK: (p.pos || c.pos) === 'GK' || idx === 0
            };
        });

        this.allPlayers = [...this.homePlayers, ...this.awayPlayers];
        this.homePossessionTicks = 50;
        this.awayPossessionTicks = 50;
        this.resetKickoff(true);
        this.isMatchActive = true;
    }

    getUserCareerPlayerOnPitch() {
        return this.homePlayers.find(p => p.isPlayerCharacter) || this.homePlayers[9] || this.homePlayers[this.homePlayers.length - 1];
    }

    // ========================================================================
    // INTERACTIVE USER COMMANDS DURING LIVE 2D MATCH
    // ========================================================================
    setTacticalMentality(mode) {
        this.tacticalMentality = mode;
        const labels = {
            'ATTACK': '🔥 전원 공격 (라인 올림 + 적극 슈팅)',
            'GEGENPRESS': '⚡ 게겐프레싱 (전방 압박 + 즉시 탈취)',
            'TIKITAKA': '🧠 티키타카 (짧은 패스 점유율 극대화)',
            'COUNTER': '🛡️ 선수비 역습 (수비 블록 + 롱패스 카운터)',
            'BALANCED': '⚖️ 밸런스 전술'
        };
        this.showActionPopup(labels[mode] || mode, 0.5, 0.14, '#38bdf8');
        if (this.onMatchEvent) {
            this.onMatchEvent('TACTIC', { mode, label: labels[mode] || mode, minute: this.matchMinute });
        }
    }

    triggerUserCommand(cmd) {
        if (!this.isMatchActive || this.allPlayers.length === 0) return { success: false };
        const me = this.getUserCareerPlayerOnPitch();
        const carrier = this.ball.carrier;

        if (cmd === 'PASS_TO_ME') {
            if (!me) return { success: false };
            // If away team has ball, attempt quick interception first or pass when home has ball
            if (carrier && carrier.team === 'home' && carrier !== me) {
                this.executePassToTarget(carrier, me, '🎯 내 선수에게 집중 패스!');
                return { success: true, action: 'PASS_TO_ME', target: me.name };
            } else if (carrier === me) {
                me.speedBoostTimer = 90;
                this.showActionPopup(`⚡ ★ ${me.name} 온더볼 돌파!`, me.x, me.y, '#f59e0b');
                return { success: true, action: 'ALREADY_HAS_BALL', target: me.name };
            } else {
                // Force home midfielder to intercept and pass to ME
                const mid = this.homePlayers.find(p => !p.isGK && p !== me) || this.homePlayers[5];
                if (mid) {
                    this.ball.carrier = mid;
                    this.ball.x = mid.x;
                    this.ball.y = mid.y;
                    this.executePassToTarget(mid, me, '⚡ 인터셉트 후 ★내 선수 연결!');
                }
                return { success: true, action: 'INTERCEPT_AND_PASS', target: me.name };
            }
        }

        if (cmd === 'SHOOT') {
            const shooter = (carrier && carrier.team === 'home') ? carrier : (me || this.homePlayers[9]);
            if (!shooter) return { success: false };
            // Move shooter into dangerous zone if too far back
            if (shooter.x < 0.62) {
                shooter.x = 0.74;
                this.ball.x = shooter.x;
                this.ball.y = shooter.y;
            }
            this.executeShot(shooter, true);
            return { success: true, action: 'SHOOT', shooter: shooter.name };
        }

        if (cmd === 'THROUGH_PASS') {
            const passer = (carrier && carrier.team === 'home') ? carrier : (this.homePlayers[6] || this.homePlayers[5]);
            const target = (me && me !== passer) ? me : (this.homePlayers[9] || this.homePlayers[10]);
            if (!passer || !target) return { success: false };

            // Push target into space behind defense
            target.x = Math.min(0.88, Math.max(0.68, target.x + 0.14));
            target.speedBoostTimer = 100;
            this.executePassToTarget(passer, target, `⚡ 대지를 가르는 킬패스! → ${target.name}`);
            return { success: true, action: 'THROUGH_PASS', target: target.name };
        }

        if (cmd === 'DRIBBLE_PRESS') {
            if (carrier && carrier.team === 'home') {
                carrier.speedBoostTimer = 120;
                const boostX = Math.min(0.92, carrier.x + 0.08);
                carrier.x = boostX;
                this.ball.x = carrier.x + 0.015;
                this.showActionPopup(`💨 폭발적인 드리블 돌파! (${carrier.name})`, carrier.x, carrier.y, '#10b981');
                if (typeof sounds !== 'undefined' && sounds.playKick) sounds.playKick(0.9);
                return { success: true, action: 'DRIBBLE', player: carrier.name };
            } else {
                // Gegenpress turnover!
                const presser = me || this.homePlayers[5] || this.homePlayers[9];
                if (presser) {
                    presser.x = this.ball.x;
                    presser.y = this.ball.y;
                    this.ball.carrier = presser;
                    this.ball.state = 'DRIBBLE';
                    this.tackleRings.push({ x: presser.x, y: presser.y, radius: 4, alpha: 1.0, color: '#10b981' });
                    this.showActionPopup(`🔥 강력한 압박 볼 탈취! (${presser.name})`, presser.x, presser.y, '#10b981');
                    if (typeof sounds !== 'undefined' && sounds.playKick) sounds.playKick(1.0);
                    return { success: true, action: 'PRESS_WIN', player: presser.name };
                }
            }
        }

        return { success: false };
    }

    resetKickoff(isHomeKickoff = true) {
        this.ball.x = 0.5;
        this.ball.y = 0.5;
        this.ball.z = 0;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.vz = 0;
        this.ball.trail = [];
        this.ball.state = 'DRIBBLE';

        this.allPlayers.forEach(p => {
            p.x = p.baseX;
            p.y = p.baseY;
            p.targetX = p.baseX;
            p.targetY = p.baseY;
        });

        const kickingTeam = isHomeKickoff ? this.homePlayers : this.awayPlayers;
        const striker = kickingTeam.find(p => p.isPlayerCharacter) || kickingTeam.find(p => p.pos === 'ST') || kickingTeam[kickingTeam.length - 1];
        if (striker) {
            striker.x = 0.5;
            striker.y = 0.5;
            this.ball.carrier = striker;
        }
    }

    showActionPopup(text, x, y, color = '#ffd700') {
        this.actionPopup = { text, x, y, life: 1.15, color };
    }

    update(ts) {
        if (!this.isMatchActive || this.allPlayers.length === 0) return;

        const dt = (1 / 60) * Math.min(3.5, Math.max(0.5, this.simSpeed));

        // Update tackle rings & goal net ripple
        this.tackleRings.forEach(r => {
            r.radius += 35 * dt;
            r.alpha -= 1.8 * dt;
        });
        this.tackleRings = this.tackleRings.filter(r => r.alpha > 0);
        if (this.netRipple.timer > 0) this.netRipple.timer -= dt * 60;

        // Tactical modifiers for Home team
        const isAttackMode = this.tacticalMentality === 'ATTACK';
        const isGegenMode = this.tacticalMentality === 'GEGENPRESS';
        const isTikiTaka = this.tacticalMentality === 'TIKITAKA';
        const isCounter = this.tacticalMentality === 'COUNTER';

        // 1. UPDATE BALL & POSSESSION STATE
        if (this.ball.state === 'DRIBBLE' && this.ball.carrier) {
            const carrier = this.ball.carrier;
            const isHome = carrier.team === 'home';
            if (isHome) this.homePossessionTicks += 1;
            else this.awayPossessionTicks += 1;

            const goalX = isHome ? 0.96 : 0.04;
            const dirX = isHome ? 1 : -1;

            if (carrier.speedBoostTimer > 0) carrier.speedBoostTimer--;
            const boostMult = carrier.speedBoostTimer > 0 ? 1.55 : 1.0;

            const dribbleStat = (carrier.stats && carrier.stats.dribbling) || 14;
            const dribbleSpeed = (0.095 + (dribbleStat / 20) * 0.055) * boostMult * dt;
            const prevX = carrier.x;
            const prevY = carrier.y;

            carrier.x += dirX * dribbleSpeed;
            carrier.y += (Math.sin(ts * 0.0035 + carrier.num) * 0.028) * dt;
            carrier.x = Math.max(0.04, Math.min(0.96, carrier.x));
            carrier.y = Math.max(0.06, Math.min(0.94, carrier.y));
            carrier.facingAngle = Math.atan2(carrier.y - prevY, carrier.x - prevX);
            carrier.stamina = Math.max(25, carrier.stamina - 0.015 * dt * 60);

            this.ball.x = carrier.x + dirX * 0.014;
            this.ball.y = carrier.y;
            this.ball.z = 0;

            // Record gentle ball trail
            this.ball.trail.push({ x: this.ball.x, y: this.ball.y, life: 0.4, color: isHome ? '#38bdf8' : '#f87171' });
            if (this.ball.trail.length > 10) this.ball.trail.shift();

            const distToGoal = Math.abs(carrier.x - goalX);
            const inBoxAngle = Math.abs(carrier.y - 0.5) < 0.28;
            const shootChance = (isHome && isAttackMode) ? 0.038 : 0.022;
            const passChance = (isHome && isTikiTaka) ? 0.055 : 0.030;

            if (distToGoal < 0.31 && inBoxAngle && Math.random() < shootChance) {
                this.executeShot(carrier, false);
            } else if (Math.random() < passChance) {
                this.executePass(carrier);
            }

            // Nearest defender pressing & tackling
            const opponentTeam = isHome ? this.awayPlayers : this.homePlayers;
            const pressRadius = (!isHome && isGegenMode) ? 0.25 : 0.18;

            opponentTeam.forEach(def => {
                if (def.isGK) return;
                const dx = def.x - carrier.x;
                const dy = def.y - carrier.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < pressRadius && dist > 0.001) {
                    const paceStat = (def.stats && def.stats.pace) || 14;
                    const pressSpeed = (0.115 + (paceStat / 20) * 0.045) * ((!isHome && isGegenMode) ? 1.25 : 1.0) * dt;
                    def.x -= (dx / dist) * pressSpeed;
                    def.y -= (dy / dist) * pressSpeed;
                    def.facingAngle = Math.atan2(-dy, -dx);

                    if (dist < 0.036) {
                        this.attemptTackle(def, carrier);
                    }
                }
            });

        } else if (this.ball.state === 'PASS') {
            const dx = this.ball.targetX - this.ball.x;
            const dy = this.ball.targetY - this.ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            this.ball.trail.push({ x: this.ball.x, y: this.ball.y, life: 0.7, color: '#38bdf8' });
            if (this.ball.trail.length > 14) this.ball.trail.shift();

            if (dist < 0.032 || !this.ball.passTarget) {
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
            const dx = this.ball.targetX - this.ball.x;
            const dy = this.ball.targetY - this.ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            this.ball.trail.push({ x: this.ball.x, y: this.ball.y, life: 1.0, color: '#f59e0b' });
            if (this.ball.trail.length > 18) this.ball.trail.shift();

            if (dist > 0.001) {
                this.ball.x += (dx / dist) * this.ball.vx * dt;
                this.ball.y += (dy / dist) * this.ball.vy * dt;
            }

            if (this.ball.z > 0 || this.ball.vz !== 0) {
                this.ball.z += this.ball.vz * dt;
                this.ball.vz -= 0.6 * dt;
                if (this.ball.z < 0) this.ball.z = 0;
            }

            const isHomeShot = this.ball.shotStriker ? this.ball.shotStriker.team === 'home' : true;
            const oppGK = (isHomeShot ? this.awayPlayers : this.homePlayers).find(p => p.isGK);
            if (oppGK) {
                oppGK.y += (this.ball.shotTargetY - oppGK.y) * 0.18;
            }

            if (Math.abs(this.ball.x - this.ball.targetX) < 0.035) {
                if (this.ball.shotResult === 'GOAL') {
                    this.resolveGoal();
                } else if (this.ball.shotResult === 'SAVE') {
                    this.resolveSave(oppGK);
                } else {
                    this.resolveMiss();
                }
            }
        } else if (this.ball.state === 'LOOSE') {
            // Closest outfield player claims loose ball
            let closest = null;
            let minDist = 999;
            this.allPlayers.forEach(p => {
                if (p.isGK) return;
                const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
                if (d < minDist) {
                    minDist = d;
                    closest = p;
                }
            });
            if (closest) {
                this.ball.carrier = closest;
                this.ball.state = 'DRIBBLE';
            }
        }

        // Decay trail life
        this.ball.trail.forEach(t => { t.life -= 2.2 * dt; });
        this.ball.trail = this.ball.trail.filter(t => t.life > 0);

        // 2. TEAMMATES SUPPORTING RUNS & FORMATION SHIFT
        this.allPlayers.forEach(p => {
            if (p === this.ball.carrier) return;

            let targetX = p.baseX;
            let targetY = p.baseY;
            const isHome = p.team === 'home';

            if (this.ball.carrier) {
                const teamHasBall = p.team === this.ball.carrier.team;
                const dirX = isHome ? 1 : -1;

                if (teamHasBall) {
                    const attackPush = (isHome && isAttackMode) ? 0.08 : 0.0;
                    if (['ST', 'CF', 'LW', 'RW'].includes(p.pos) || p.isPlayerCharacter) {
                        targetX = Math.max(0.12, Math.min(0.92, this.ball.x + dirX * (0.16 + attackPush)));
                        targetY = p.baseY + Math.sin(ts * 0.0025 + p.num) * 0.055;
                    } else if (['CM', 'CAM', 'CDM', 'RM', 'LM'].includes(p.pos)) {
                        targetX = Math.max(0.10, Math.min(0.88, this.ball.x - dirX * 0.06 + dirX * attackPush));
                        targetY = p.baseY;
                    }
                } else {
                    const counterRetreat = (isHome && isCounter) ? -0.06 : 0.0;
                    targetX = Math.max(0.05, Math.min(0.95, p.baseX * 0.72 + (isHome ? 0.08 : 0.92) * 0.28 + counterRetreat));
                }
            }

            const dx = targetX - p.x;
            const dy = targetY - p.y;
            if (Math.hypot(dx, dy) > 0.002) {
                p.facingAngle = Math.atan2(dy, dx);
            }
            p.x += dx * 0.035 * dt * 60;
            p.y += dy * 0.035 * dt * 60;
        });

        // 3. UPDATE POPUPS & CELEBRATION
        if (this.actionPopup) {
            this.actionPopup.life -= 0.02 * dt * 60;
            this.actionPopup.y -= 0.0008;
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

    executePassToTarget(carrier, target, popupText = null) {
        if (!carrier || !target || carrier === target) return;
        this.ball.passStartX = carrier.x;
        this.ball.passStartY = carrier.y;
        this.ball.carrier = null;
        this.ball.passTarget = target;
        this.ball.targetX = target.x;
        this.ball.targetY = target.y;
        this.ball.vx = 0.52;
        this.ball.vy = 0.52;
        this.ball.state = 'PASS';
        if (popupText) this.showActionPopup(popupText, carrier.x, carrier.y, '#38bdf8');
        if (typeof sounds !== 'undefined' && sounds.playKick) sounds.playKick(0.8);
    }

    executePass(carrier) {
        const teamPlayers = carrier.team === 'home' ? this.homePlayers : this.awayPlayers;
        const dirX = carrier.team === 'home' ? 1 : -1;

        // Prioritize passing to user's career player (★ ME) 40% of the time if on home team
        const me = carrier.team === 'home' ? this.getUserCareerPlayerOnPitch() : null;
        if (me && me !== carrier && Math.random() < 0.42) {
            this.executePassToTarget(carrier, me);
            return;
        }

        const forwardTeammates = teamPlayers.filter(p => p !== carrier && !p.isGK && (p.x * dirX >= (carrier.x * dirX - 0.05)));
        const target = (forwardTeammates.length > 0)
            ? forwardTeammates[Math.floor(Math.random() * forwardTeammates.length)]
            : teamPlayers.find(p => p !== carrier && !p.isGK);

        if (!target || target === carrier) return;
        this.executePassToTarget(carrier, target);
    }

    executeShot(striker, isUserCommanded = false) {
        if (!striker) return;
        const isHome = striker.team === 'home';
        const goalX = isHome ? 0.98 : 0.02;
        const targetY = 0.43 + (Math.random() * 0.14);

        this.ball.carrier = null;
        this.ball.shotStriker = striker;
        this.ball.targetX = goalX;
        this.ball.targetY = targetY;
        this.ball.shotTargetY = targetY;
        this.ball.vx = 0.72;
        this.ball.vy = 0.72;
        this.ball.vz = 0.26;
        this.ball.state = 'SHOT';

        if (typeof sounds !== 'undefined' && sounds.playKick) sounds.playKick(1.2);
        this.showActionPopup(
            isUserCommanded ? `🚀 지시 슈팅 작렬! (${striker.name})` : `💥 강슛! ${striker.name}`,
            striker.x,
            striker.y,
            '#f59e0b'
        );

        const sFin = (striker.stats && striker.stats.finishing) || 15;
        const sPow = (striker.stats && striker.stats.longShots) || 15;
        const oppGK = (isHome ? this.awayPlayers : this.homePlayers).find(p => p.isGK);
        const gkRef = (oppGK && oppGK.stats && oppGK.stats.reflexes) ? oppGK.stats.reflexes : 15;

        const commandBonus = isUserCommanded ? 0.14 : 0.0;
        const goalRoll = Math.random();
        const goalThreshold = ((sFin * 0.45 + sPow * 0.25) / (sFin * 0.4 + gkRef * 0.48 + 4.5)) + commandBonus;

        if (goalRoll < goalThreshold) {
            this.ball.shotResult = 'GOAL';
        } else if (goalRoll < goalThreshold + 0.36) {
            this.ball.shotResult = 'SAVE';
        } else {
            this.ball.shotResult = 'MISS';
        }
    }

    resolveGoal() {
        this.ball.state = 'GOAL';
        this.ball.vx = 0;
        this.ball.vy = 0;
        if (typeof sounds !== 'undefined') {
            if (sounds.playGoalRoar) sounds.playGoalRoar();
            if (sounds.playWhistle) sounds.playWhistle('short');
        }

        const striker = this.ball.shotStriker || this.homePlayers[9] || this.homePlayers[0];
        const isHome = striker ? striker.team === 'home' : true;
        this.netRipple = { side: isHome ? 'right' : 'left', timer: 90 };

        const particles = [];
        for (let i = 0; i < 85; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 0.002 + Math.random() * 0.007;
            particles.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: ['#ffd700', '#38bdf8', '#f43f5e', '#ffffff', '#10b981'][Math.floor(Math.random() * 5)],
                life: 1.0
            });
        }

        this.goalCelebration = {
            scorer: striker || { name: '선수' },
            isHome: isHome,
            timer: 145,
            particles: particles
        };

        if (this.onMatchEvent) {
            this.onMatchEvent('GOAL', { striker: striker || { name: '선수' }, isHome, minute: this.matchMinute });
        }
    }

    resolveSave(gk) {
        this.ball.state = 'SAVED';
        if (typeof sounds !== 'undefined') {
            if (sounds.playPostHit) sounds.playPostHit();
            if (sounds.playGroan) sounds.playGroan();
        }

        const gkName = gk ? gk.name : '골키퍼';
        this.showActionPopup(`🧤 슈퍼 세이브! (${gkName})`, this.ball.x, this.ball.y, '#00f0ff');

        setTimeout(() => {
            if (gk) {
                this.ball.carrier = gk;
                this.ball.state = 'DRIBBLE';
            } else {
                this.ball.state = 'LOOSE';
            }
        }, 450);

        if (this.onMatchEvent) {
            this.onMatchEvent('SAVE', { gk, striker: this.ball.shotStriker, minute: this.matchMinute });
        }
    }

    resolveMiss() {
        this.ball.state = 'LOOSE';
        if (typeof sounds !== 'undefined' && sounds.playGroan) sounds.playGroan();
        this.showActionPopup('아쉽게 빗나감!', this.ball.x, this.ball.y, '#94a3b8');

        setTimeout(() => {
            const isHome = this.ball.shotStriker ? this.ball.shotStriker.team === 'home' : true;
            this.resetKickoff(!isHome);
        }, 650);
    }

    attemptTackle(def, carrier) {
        const dTac = (def.stats && def.stats.tackling) || 14;
        const cDri = (carrier.stats && carrier.stats.dribbling) || 15;
        const tackleChance = dTac / (dTac + cDri * 0.9);

        if (Math.random() < tackleChance * 0.45) {
            this.ball.carrier = def;
            this.ball.state = 'DRIBBLE';
            this.tackleRings.push({ x: def.x, y: def.y, radius: 3, alpha: 0.9, color: '#10b981' });
            this.showActionPopup(`🛡️ 깔끔한 태클! (${def.name})`, def.x, def.y, '#10b981');
            if (typeof sounds !== 'undefined' && sounds.playKick) sounds.playKick(0.8);
        }
    }

    // ========================================================================
    // BROADCAST-GRADE 2D CANVAS RENDERING
    // ========================================================================
    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const b = this.pitchBounds;

        ctx.clearRect(0, 0, w, h);

        // 1. STADIUM SURROUND & MOWED TURF STRIPES
        ctx.fillStyle = '#07140c';
        ctx.fillRect(0, 0, w, h);

        const stripeCount = 16;
        const stripeW = b.width / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#134620' : '#185427';
            ctx.fillRect(b.x + i * stripeW, b.y, stripeW, b.height);
        }

        // Subtle horizontal mower weave
        ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
        for (let j = 0; j < 8; j += 2) {
            ctx.fillRect(b.x, b.y + (b.height / 8) * j, b.width, b.height / 8);
        }

        // Stadium Floodlight Radial Vignette
        const grad = ctx.createRadialGradient(w / 2, h / 2, b.height * 0.2, w / 2, h / 2, w * 0.65);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
        grad.addColorStop(1, 'rgba(2, 6, 23, 0.38)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 2. CRISP WHITE PITCH MARKINGS
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.86)';
        ctx.lineWidth = Math.max(2, 2.4 * (w / 900));

        ctx.strokeRect(b.x, b.y, b.width, b.height);

        const midX = b.x + b.width / 2;
        const midY = b.y + b.height / 2;
        ctx.beginPath();
        ctx.moveTo(midX, b.y);
        ctx.lineTo(midX, b.y + b.height);
        ctx.stroke();

        // Center Circle & Spot
        const cr = b.height * 0.175;
        ctx.beginPath();
        ctx.arc(midX, midY, cr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(midX, midY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Penalty Boxes & Penalty Arcs
        const boxW = b.width * 0.155;
        const boxH = b.height * 0.45;
        const boxY = b.y + (b.height - boxH) / 2;
        ctx.strokeRect(b.x, boxY, boxW, boxH);
        ctx.strokeRect(b.x + b.width - boxW, boxY, boxW, boxH);

        // Penalty Spots & D-Arcs
        const penSpotLeftX = b.x + boxW * 0.72;
        const penSpotRightX = b.x + b.width - boxW * 0.72;
        ctx.beginPath();
        ctx.arc(penSpotLeftX, midY, 3.5, 0, Math.PI * 2);
        ctx.arc(penSpotRightX, midY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(penSpotLeftX, midY, cr * 0.68, -0.92, 0.92);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(penSpotRightX, midY, cr * 0.68, Math.PI - 0.92, Math.PI + 0.92);
        ctx.stroke();

        // 6-Yard Goal Areas
        const sBoxW = b.width * 0.055;
        const sBoxH = b.height * 0.22;
        const sBoxY = b.y + (b.height - sBoxH) / 2;
        ctx.strokeRect(b.x, sBoxY, sBoxW, sBoxH);
        ctx.strokeRect(b.x + b.width - sBoxW, sBoxY, sBoxW, sBoxH);

        // 3D Goal Nets with Ripple Effect
        const gW = Math.max(14, 18 * (w / 900));
        const gH = b.height * 0.18;
        const gY = b.y + (b.height - gH) / 2;
        const leftRipple = (this.netRipple.side === 'left' && this.netRipple.timer > 0) ? Math.sin(this.netRipple.timer * 0.6) * 5 : 0;
        const rightRipple = (this.netRipple.side === 'right' && this.netRipple.timer > 0) ? Math.sin(this.netRipple.timer * 0.6) * 5 : 0;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(b.x - gW - leftRipple, gY, gW + leftRipple, gH);
        ctx.fillRect(b.x + b.width, gY, gW + rightRipple, gH);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(b.x - gW - leftRipple, gY, gW + leftRipple, gH);
        ctx.strokeRect(b.x + b.width, gY, gW + rightRipple, gH);

        // 3. PASS TRAJECTORY VECTOR LINE & TACKLE SHOCKWAVES
        if (this.ball.state === 'PASS' && this.ball.passTarget) {
            const sx = b.x + this.ball.x * b.width;
            const sy = b.y + this.ball.y * b.height;
            const tx = b.x + this.ball.targetX * b.width;
            const ty = b.y + this.ball.targetY * b.height;

            ctx.save();
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            // Target reception ring
            ctx.setLineDash([]);
            ctx.strokeStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(tx, ty, 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        this.tackleRings.forEach(r => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, r.alpha);
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(b.x + r.x * b.width, b.y + r.y * b.height, r.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });

        // 4. RENDER ALL 22 PLAYERS
        const radius = Math.max(10.5, 13.5 * (w / 900));

        this.allPlayers.forEach(p => {
            const px = b.x + p.x * b.width;
            const py = b.y + p.y * b.height;
            const isHome = p.team === 'home';
            const col1 = isHome ? this.homeColor1 : this.awayColor1;
            const col2 = isHome ? this.homeColor2 : this.awayColor2;

            const isUserPlayer = p.isPlayerCharacter || (typeof window !== 'undefined' && window.app && window.app.career && (p.name === window.app.career.playerProfile.name || p.koreanName === window.app.career.playerProfile.name));

            // Ball carrier pulsing ring
            if (p === this.ball.carrier) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(px, py, radius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }

            // User Career Player ★ ME Golden Halo
            if (isUserPlayer) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.arc(px, py, radius + 8, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#f59e0b';
                ctx.font = `900 ${Math.round(radius * 0.85)}px Pretendard, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('★ ME', px, py - radius - 16);
            }

            // Directional Facing Arrow Indicator
            const angle = p.facingAngle || (isHome ? 0 : Math.PI);
            const arrowDist = radius + 4;
            const ax = px + Math.cos(angle) * arrowDist;
            const ay = py + Math.sin(angle) * arrowDist;
            ctx.fillStyle = isUserPlayer ? '#f59e0b' : col2;
            ctx.beginPath();
            ctx.arc(ax, ay, 2.8, 0, Math.PI * 2);
            ctx.fill();

            // Ground shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
            ctx.beginPath();
            ctx.ellipse(px, py + radius * 0.82, radius * 0.85, radius * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();

            // Player Kit Circle
            ctx.fillStyle = col1;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = isUserPlayer ? '#fde047' : col2;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Jersey Number
            ctx.fillStyle = col2;
            ctx.font = `900 ${Math.round(radius * 0.82)}px Pretendard, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.num, px, py);

            // Stamina Bar under player
            const barW = radius * 1.5;
            const barH = 3;
            const stamPct = Math.max(0.2, (p.stamina || 100) / 100);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.fillRect(px - barW / 2, py + radius + 3, barW, barH);
            ctx.fillStyle = stamPct > 0.5 ? '#10b981' : '#f59e0b';
            ctx.fillRect(px - barW / 2, py + radius + 3, barW * stamPct, barH);

            // Player Name & OVR Tag
            ctx.fillStyle = isUserPlayer ? '#fef08a' : '#ffffff';
            ctx.font = `800 ${Math.round(radius * 0.74)}px Pretendard, sans-serif`;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            const cleanName = (p.koreanName || p.name || '').replace(/\[.*?\]/g, '').trim();
            const displayName = cleanName.length > 5 ? cleanName.slice(0, 5) : cleanName;
            ctx.fillText(`${isUserPlayer ? '★' : ''}${displayName}`, px, py - radius - 5);
            ctx.shadowBlur = 0;
        });

        // 5. RENDER BALL COMET TRAIL & 3D BALL
        this.ball.trail.forEach((t, idx) => {
            const tx = b.x + t.x * b.width;
            const ty = b.y + t.y * b.height;
            ctx.save();
            ctx.globalAlpha = Math.max(0, t.life * 0.55);
            ctx.fillStyle = t.color || '#38bdf8';
            ctx.beginPath();
            ctx.arc(tx, ty, Math.max(2, (idx / this.ball.trail.length) * 6), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        const bx = b.x + this.ball.x * b.width;
        const by = b.y + this.ball.y * b.height;
        const ballR = Math.max(5.5, 6.8 * (w / 900));
        const shadowOffset = (this.ball.z || 0) * 22;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
        ctx.beginPath();
        ctx.ellipse(bx, by + shadowOffset, ballR * 1.3, ballR * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by - shadowOffset, ballR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // 6. TOP BROADCAST HUD: POSSESSION & TACTICAL MENTALITY PILL
        const totalPoss = Math.max(1, this.homePossessionTicks + this.awayPossessionTicks);
        const homePossPct = Math.round((this.homePossessionTicks / totalPoss) * 100);
        const awayPossPct = 100 - homePossPct;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.fillRect(b.x + 8, 4, 230, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px Pretendard, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`점유율 ${homePossPct}% : ${awayPossPct}% | 전술: ${this.tacticalMentality}`, b.x + 14, 15);

        // 7. ACTION POPUP BUBBLE
        if (this.actionPopup) {
            const popX = b.x + this.actionPopup.x * b.width;
            const popY = Math.max(b.y + 24, b.y + this.actionPopup.y * b.height - 26);
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, this.actionPopup.life));
            ctx.font = 'bold 13px Pretendard, sans-serif';
            const txtW = ctx.measureText(this.actionPopup.text).width + 24;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.strokeStyle = this.actionPopup.color;
            ctx.lineWidth = 2;
            ctx.fillRect(popX - txtW / 2, popY - 15, txtW, 28);
            ctx.strokeRect(popX - txtW / 2, popY - 15, txtW, 28);

            ctx.fillStyle = this.actionPopup.color;
            ctx.textAlign = 'center';
            ctx.fillText(this.actionPopup.text, popX, popY + 3);
            ctx.restore();
        }

        // 8. GOAL CELEBRATION OVERLAY & PARTICLES
        if (this.goalCelebration) {
            this.goalCelebration.particles.forEach(pt => {
                ctx.fillStyle = pt.color;
                ctx.globalAlpha = Math.max(0, pt.life);
                ctx.beginPath();
                ctx.arc(b.x + pt.x * b.width, b.y + pt.y * b.height, 4.2, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            const bannerW = Math.min(480, w * 0.72);
            const bannerH = 68;
            const banX = (w - bannerW) / 2;
            const banY = b.y + 24;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
            ctx.fillRect(banX, banY, bannerW, bannerH);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(banX, banY, bannerW, bannerH);

            ctx.fillStyle = '#ffd700';
            ctx.font = '900 24px Pretendard, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⚽ GOOOOALLL! ${this.goalCelebration.scorer.name}!`, w / 2, banY + 41);
        }
    }
}

if (typeof window !== 'undefined') {
    window.PitchCanvas = PitchCanvas;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PitchCanvas };
}
