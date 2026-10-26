// 2D Tactical Football Pitch Canvas Renderer & Autonomous AI Movement
// Renders 22 players with kit colors, jersey numbers, ball physics, pass vectors, and goal VFX

class PitchCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        this.homePlayers = [];
        this.awayPlayers = [];

        this.ball = {
            x: 0.5,
            y: 0.5,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            targetX: 0.5,
            targetY: 0.5,
            trail: []
        };

        this.homeColor1 = '#6CABDD';
        this.homeColor2 = '#1C2C5B';
        this.awayColor1 = '#EF0107';
        this.awayColor2 = '#FFFFFF';

        this.simSpeed = 1;
        this.particles = [];
        this.celebrationAura = null;
        this.shotStreak = null;
        this.animationId = null;

        this.pitchBounds = { x: 30, y: 20, width: 740, height: 460 };

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
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.pitchBounds = {
            x: 25 * (w / 800),
            y: 20 * (h / 500),
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

    // Formation coordinate templates (Normalized 0.0 to 1.0)
    getFormationCoordinates(formation, isHome) {
        // Home plays left-to-right (0.05 to 0.48), Away plays right-to-left (0.95 to 0.52)
        const mirror = (x) => isHome ? x : (1.0 - x);

        const coords = {
            '4-3-3': [
                { x: mirror(0.06), y: 0.50, pos: 'GK' },
                { x: mirror(0.20), y: 0.82, pos: 'RB' },
                { x: mirror(0.18), y: 0.62, pos: 'CB' },
                { x: mirror(0.18), y: 0.38, pos: 'CB' },
                { x: mirror(0.20), y: 0.18, pos: 'LB' },
                { x: mirror(0.30), y: 0.50, pos: 'CDM' },
                { x: mirror(0.36), y: 0.70, pos: 'CM' },
                { x: mirror(0.36), y: 0.30, pos: 'CM' },
                { x: mirror(0.44), y: 0.82, pos: 'RW' },
                { x: mirror(0.47), y: 0.50, pos: 'ST' },
                { x: mirror(0.44), y: 0.18, pos: 'LW' }
            ],
            '4-2-3-1': [
                { x: mirror(0.06), y: 0.50, pos: 'GK' },
                { x: mirror(0.20), y: 0.82, pos: 'RB' },
                { x: mirror(0.18), y: 0.62, pos: 'CB' },
                { x: mirror(0.18), y: 0.38, pos: 'CB' },
                { x: mirror(0.20), y: 0.18, pos: 'LB' },
                { x: mirror(0.28), y: 0.62, pos: 'CDM' },
                { x: mirror(0.28), y: 0.38, pos: 'CDM' },
                { x: mirror(0.38), y: 0.50, pos: 'CAM' },
                { x: mirror(0.42), y: 0.82, pos: 'RW' },
                { x: mirror(0.47), y: 0.50, pos: 'ST' },
                { x: mirror(0.42), y: 0.18, pos: 'LW' }
            ],
            '4-4-2': [
                { x: mirror(0.06), y: 0.50, pos: 'GK' },
                { x: mirror(0.20), y: 0.82, pos: 'RB' },
                { x: mirror(0.18), y: 0.62, pos: 'CB' },
                { x: mirror(0.18), y: 0.38, pos: 'CB' },
                { x: mirror(0.20), y: 0.18, pos: 'LB' },
                { x: mirror(0.32), y: 0.82, pos: 'RM' },
                { x: mirror(0.32), y: 0.60, pos: 'CM' },
                { x: mirror(0.32), y: 0.40, pos: 'CM' },
                { x: mirror(0.32), y: 0.18, pos: 'LM' },
                { x: mirror(0.46), y: 0.60, pos: 'ST' },
                { x: mirror(0.46), y: 0.40, pos: 'ST' }
            ],
            '3-5-2': [
                { x: mirror(0.06), y: 0.50, pos: 'GK' },
                { x: mirror(0.18), y: 0.72, pos: 'CB' },
                { x: mirror(0.17), y: 0.50, pos: 'CB' },
                { x: mirror(0.18), y: 0.28, pos: 'CB' },
                { x: mirror(0.30), y: 0.88, pos: 'RWB' },
                { x: mirror(0.28), y: 0.50, pos: 'CDM' },
                { x: mirror(0.30), y: 0.12, pos: 'LWB' },
                { x: mirror(0.36), y: 0.64, pos: 'CM' },
                { x: mirror(0.36), y: 0.36, pos: 'CM' },
                { x: mirror(0.46), y: 0.60, pos: 'ST' },
                { x: mirror(0.46), y: 0.40, pos: 'ST' }
            ]
        };

        return coords[formation] || coords['4-3-3'];
    }

    syncTeamFormation(homeTeam, awayTeam) {
        this.homeColor1 = homeTeam.color1 || '#6CABDD';
        this.homeColor2 = homeTeam.color2 || '#1C2C5B';
        this.awayColor1 = awayTeam.color1 || '#EF0107';
        this.awayColor2 = awayTeam.color2 || '#FFFFFF';

        const homeCoords = this.getFormationCoordinates(homeTeam.formation || '4-3-3', true);
        const awayCoords = this.getFormationCoordinates(awayTeam.formation || '4-3-3', false);

        this.homePlayers = (homeTeam.startingXI || []).map((p, idx) => {
            const c = homeCoords[idx] || { x: 0.2, y: 0.5, pos: p.pos };
            return {
                id: p.id,
                name: p.koreanName || p.name,
                pos: p.pos,
                num: idx + 1,
                team: 'home',
                baseX: c.x,
                baseY: c.y,
                x: c.x,
                y: c.y,
                vx: 0,
                vy: 0,
                rating: p.matchRating || 6.0
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
                baseX: c.x,
                baseY: c.y,
                x: c.x,
                y: c.y,
                vx: 0,
                vy: 0,
                rating: p.matchRating || 6.0
            };
        });
    }

    triggerShotAnimation(isHome, attackType, striker, gk) {
        const targetX = isHome ? 0.96 : 0.04;
        const targetY = 0.42 + (Math.random() * 0.16);

        this.shotStreak = {
            startX: this.ball.x,
            startY: this.ball.y,
            targetX: targetX,
            targetY: targetY,
            progress: 0,
            color: isHome ? '#ffd166' : '#ff4757',
            strikerName: striker.koreanName || striker.name
        };

        this.ball.targetX = targetX;
        this.ball.targetY = targetY;
        this.ball.vz = 0.4;
    }

    triggerGoalCelebration(scorer, team) {
        this.celebrationAura = {
            name: scorer.koreanName || scorer.name,
            team: team.name,
            timer: 180, // frames
            particles: []
        };

        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.celebrationAura.particles.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: Math.cos(angle) * speed * 0.003,
                vy: Math.sin(angle) * speed * 0.003,
                color: ['#ffd700', '#ff4757', '#00f0ff', '#ffffff', '#2ed573'][Math.floor(Math.random() * 5)],
                life: 1.0,
                decay: 0.01 + Math.random() * 0.015
            });
        }
    }

    update(timestamp) {
        // Natural ball drift towards play zone
        const ballEase = 0.03 * this.simSpeed;
        this.ball.x += (this.ball.targetX - this.ball.x) * ballEase;
        this.ball.y += (this.ball.targetY - this.ball.y) * ballEase;

        // Ball gravity/bounce
        if (this.ball.z > 0 || this.ball.vz !== 0) {
            this.ball.z += this.ball.vz;
            this.ball.vz -= 0.03;
            if (this.ball.z <= 0) {
                this.ball.z = 0;
                this.ball.vz = -this.ball.vz * 0.45;
                if (Math.abs(this.ball.vz) < 0.05) this.ball.vz = 0;
            }
        }

        // Random organic ball drift across midfield
        if (Math.random() < 0.02 * this.simSpeed) {
            this.ball.targetX = 0.25 + Math.random() * 0.50;
            this.ball.targetY = 0.15 + Math.random() * 0.70;
        }

        // Animate players dynamically drifting with ball
        const updatePlayerList = (list) => {
            list.forEach(p => {
                // Attracted slightly to ball location based on position
                let pullFactor = 0.22;
                if (p.pos === 'GK') pullFactor = 0.05;
                else if (p.pos === 'CB') pullFactor = 0.12;

                const desiredX = p.baseX * (1 - pullFactor) + this.ball.x * pullFactor;
                const desiredY = p.baseY * (1 - pullFactor) + this.ball.y * pullFactor;

                p.x += (desiredX - p.x) * 0.04 * this.simSpeed;
                p.y += (desiredY - p.y) * 0.04 * this.simSpeed;
            });
        };

        updatePlayerList(this.homePlayers);
        updatePlayerList(this.awayPlayers);

        // Update celebration particles
        if (this.celebrationAura) {
            this.celebrationAura.timer -= this.simSpeed;
            this.celebrationAura.particles.forEach(pt => {
                pt.x += pt.vx * this.simSpeed;
                pt.y += pt.vy * this.simSpeed;
                pt.life -= pt.decay * this.simSpeed;
            });
            this.celebrationAura.particles = this.celebrationAura.particles.filter(pt => pt.life > 0);
            if (this.celebrationAura.timer <= 0) {
                this.celebrationAura = null;
            }
        }
    }

    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const b = this.pitchBounds;

        // 1. Draw Pitch Grass with Alternating Lawn Stripes
        ctx.fillStyle = '#1e3a1e';
        ctx.fillRect(0, 0, w, h);

        const stripeCount = 14;
        const stripeWidth = b.width / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#1b4d24' : '#225d2c';
            ctx.fillRect(b.x + i * stripeWidth, b.y, stripeWidth, b.height);
        }

        // 2. Pitch Boundary and White Markings
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = Math.max(2, 2.5 * (w / 800));

        // Touchline
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // Halfway Line
        const midX = b.x + b.width / 2;
        ctx.beginPath();
        ctx.moveTo(midX, b.y);
        ctx.lineTo(midX, b.y + b.height);
        ctx.stroke();

        // Center Circle & Center Spot
        const centerRadius = b.height * 0.18;
        ctx.beginPath();
        ctx.arc(midX, b.y + b.height / 2, centerRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(midX, b.y + b.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Penalty Boxes
        const boxWidth = b.width * 0.16;
        const boxHeight = b.height * 0.44;
        const boxY = b.y + (b.height - boxHeight) / 2;

        // Home (Left) Box
        ctx.strokeRect(b.x, boxY, boxWidth, boxHeight);
        // Away (Right) Box
        ctx.strokeRect(b.x + b.width - boxWidth, boxY, boxWidth, boxHeight);

        // 6-yard boxes
        const smallBoxWidth = b.width * 0.06;
        const smallBoxHeight = b.height * 0.22;
        const smallBoxY = b.y + (b.height - smallBoxHeight) / 2;
        ctx.strokeRect(b.x, smallBoxY, smallBoxWidth, smallBoxHeight);
        ctx.strokeRect(b.x + b.width - smallBoxWidth, smallBoxY, smallBoxWidth, smallBoxHeight);

        // Penalty spots
        ctx.beginPath();
        ctx.arc(b.x + boxWidth * 0.7, b.y + b.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x + b.width - boxWidth * 0.7, b.y + b.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Goals (Nets)
        const goalWidth = 10;
        const goalHeight = b.height * 0.16;
        const goalY = b.y + (b.height - goalHeight) / 2;
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(b.x - goalWidth, goalY, goalWidth, goalHeight);
        ctx.strokeRect(b.x + b.width, goalY, goalWidth, goalHeight);

        // 3. Render Players
        const drawPlayer = (p, color1, color2) => {
            const px = b.x + p.x * b.width;
            const py = b.y + p.y * b.height;
            const radius = Math.max(9, 11 * (w / 800));

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(px, py + radius + 1, radius * 0.9, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Kit Circle Body
            ctx.fillStyle = color1;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();

            // Jersey border
            ctx.strokeStyle = color2;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Jersey Number
            ctx.fillStyle = color2;
            ctx.font = `bold ${Math.round(radius * 0.9)}px Pretendard, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.num || '', px, py);

            // Player Surname Tag
            ctx.fillStyle = '#ffffff';
            ctx.font = `600 ${Math.round(radius * 0.75)}px Pretendard, sans-serif`;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            const displayName = p.name.length > 5 ? p.name.slice(0, 4) + '..' : p.name;
            ctx.fillText(displayName, px, py - radius - 4);
            ctx.shadowBlur = 0;
        };

        // Render Home & Away Teams
        this.homePlayers.forEach(p => drawPlayer(p, this.homeColor1, this.homeColor2));
        this.awayPlayers.forEach(p => drawPlayer(p, this.awayColor1, this.awayColor2));

        // 4. Render Ball
        const bx = b.x + this.ball.x * b.width;
        const by = b.y + this.ball.y * b.height;
        const ballRadius = Math.max(5, 6 * (w / 800));
        const shadowOffset = (this.ball.z || 0) * 15;

        // Ball Shadow on turf
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(bx, by + shadowOffset, ballRadius * 1.2, ballRadius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball 3D Sphere
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by - shadowOffset, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 5. Celebration Banner / Particles
        if (this.celebrationAura) {
            this.celebrationAura.particles.forEach(pt => {
                ctx.fillStyle = pt.color;
                ctx.globalAlpha = Math.max(0, pt.life);
                ctx.beginPath();
                ctx.arc(b.x + pt.x * b.width, b.y + pt.y * b.height, 4, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            // Flashy Goal Banner
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            const bannerW = Math.min(380, w * 0.6);
            const bannerH = 50;
            ctx.fillRect((w - bannerW) / 2, b.y + 20, bannerW, bannerH);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect((w - bannerW) / 2, b.y + 20, bannerW, bannerH);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 20px Pretendard, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⚽ GOAL! ${this.celebrationAura.name}`, w / 2, b.y + 52);
        }
    }
}
