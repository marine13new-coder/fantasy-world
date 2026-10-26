// ============================================================================
// F1 MANAGER & 3D GRAND PRIX SIMULATOR (engine3d.js)
// - Unmistakable Bright 3D Track Floor, Grass Verge, Serrated Kerbs, 3D Sponsor
//   Barrier Walls (Rolex / Louis Vuitton / Pirelli / Aramco / Monaco Guardrails),
//   3-Tier Armco Rails, Curved Steel Catch Fences & Monaco Covered Tunnel
// - T-Cam Onboard View (Halo + Front Wing + Suspension + Mirrors), Chase, Cockpit, TV
// - Hard-Body Car-to-Car & Barrier Physics (Zero Pass-Through), Pro AI Racecraft,
//   3D Safety Car, Red Flag Standing Restart, 5s Flashback & Sector 1/2/3 2D Map
// ============================================================================

class F1LiveRaceEngine {
    constructor(viewport3dId, map2dCanvasId) {
        this.viewport3dEl = document.getElementById(viewport3dId);
        this.map2dCanvas = document.getElementById(map2dCanvasId);
        this.map2dCtx = this.map2dCanvas ? this.map2dCanvas.getContext('2d') : null;

        this.hasWebGL = false;
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.fallbackCanvas = null;
        this.fallbackCtx = null;

        this.circuit = null;
        this.trackPoints2D = [];     // 640 high-res points with ideal racing line & target speed
        this.trackLengthMeters = 5400;
        this.bounds2D = { minX: -300, maxX: 300, minZ: -300, maxZ: 300 };

        this.cars = [];
        this.playerCar1 = null;
        this.playerCar2 = null;
        this.followedCar = null;

        // Visual Particle Systems (Sparks, Debris, Tire Smoke)
        this.particles = [];
        this.particleGroup3D = null;
        this.safetyCar3D = null;
        this.safetyCarProgress = 0;
        this.racingLineMesh = null;

        // Modes & Settings
        this.cameraMode = 'CHASE';        // 'CHASE', 'T_CAM', 'COCKPIT', 'TV_HELI'
        this.driveControlMode = 'MANUAL'; // 'MANUAL' or 'PITWALL'
        this.raceFormat = 'FULL';         // 'FULL', 'HALF', 'SPRINT', 'QUICK'
        this.isTestTrackMode = false;
        this.showRacingLine = true;
        this.sceneryDensity = 'HIGH';     // 'HIGH', 'MEDIUM'

        // Team Orders & Flashback History
        this.teamOrderMode = 'FREE';      // 'FREE', 'HOLD', 'SWAP'
        this.flashbackHistory = [];
        this.flashbackRecordTimer = 0;

        // Race State
        this.isRunning = false;
        this.racePhase = 'PRE_RACE';      // 'COUNTDOWN', 'RACING', 'RED_FLAG_PAUSED', 'FINISHED'
        this.timeScale = 1.0;             // 0, 1, 2, 4, 8
        this.totalLaps = 57;
        this.raceElapsedTime = 0;

        // Track Status & Weather
        this.trackFlag = 'GREEN';         // 'GREEN', 'YELLOW', 'VSC', 'SC', 'RED'
        this.flagTimer = 0;
        this.weather = 'DRY';             // 'DRY', 'INTER_RAIN', 'HEAVY_RAIN'
        this.trackWater = 0.0;
        this.trackTemp = 35.0;

        // Keyboard Inputs
        this.keys = { up: false, down: false, left: false, right: false, ers: false };

        // Callbacks
        this.onTelemetryTick = null;
        this.onRaceEventLog = null;
        this.onRaceCompleted = null;
        this.onRedFlagTriggered = null;

        this.lastTimestamp = performance.now();
        this.uiTickTimer = 0;

        this.initRenderers();
        this.bindControls();
        this.startMainLoop();
    }

    initRenderers() {
        if (window.THREE && this.viewport3dEl) {
            try {
                const w = Math.max(640, this.viewport3dEl.clientWidth || 960);
                const h = Math.max(420, this.viewport3dEl.clientHeight || 540);

                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0x386898);

                this.camera = new THREE.PerspectiveCamera(58, w / h, 0.35, 3200);
                this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
                this.renderer.setSize(w, h);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                this.renderer.shadowMap.enabled = true;

                this.viewport3dEl.innerHTML = '';
                this.viewport3dEl.appendChild(this.renderer.domElement);
                this.hasWebGL = true;
            } catch (err) {
                console.warn('WebGL unavailable, activating 2D Telemetry Track Camera fallback:', err);
                this.hasWebGL = false;
            }
        }

        if (!this.hasWebGL && this.viewport3dEl) {
            this.fallbackCanvas = document.createElement('canvas');
            this.fallbackCanvas.style.width = '100%';
            this.fallbackCanvas.style.height = '100%';
            this.fallbackCanvas.style.display = 'block';
            this.viewport3dEl.innerHTML = '';
            this.viewport3dEl.appendChild(this.fallbackCanvas);
            this.fallbackCtx = this.fallbackCanvas.getContext('2d');
        }

        window.addEventListener('resize', () => this.resizeViewports());
        setTimeout(() => this.resizeViewports(), 60);
    }

    resizeViewports() {
        if (this.viewport3dEl) {
            const rect = this.viewport3dEl.getBoundingClientRect();
            const w = Math.max(480, rect.width || 900);
            const h = Math.max(360, rect.height || 520);

            if (this.hasWebGL && this.renderer && this.camera) {
                this.camera.aspect = w / h;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(w, h);
            } else if (this.fallbackCanvas) {
                const dpr = window.devicePixelRatio || 1;
                this.fallbackCanvas.width = w * dpr;
                this.fallbackCanvas.height = h * dpr;
            }
        }

        if (this.map2dCanvas) {
            const rect2 = this.map2dCanvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const mw = Math.max(240, rect2.width || 300);
            const mh = Math.max(190, rect2.height || 220);
            this.map2dCanvas.width = mw * dpr;
            this.map2dCanvas.height = mh * dpr;
        }
    }

    bindControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': this.keys.up = true; break;
                case 'KeyS': case 'ArrowDown': this.keys.down = true; break;
                case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
                case 'Space':
                    e.preventDefault();
                    this.keys.ers = true;
                    if (this.followedCar && this.followedCar.isPlayerTeam) {
                        this.followedCar.ersMode = 'OVERTAKE';
                    }
                    break;
                case 'ShiftLeft': case 'ShiftRight':
                    this.manualToggleDrs();
                    break;
                case 'KeyC':
                    if (window.F1App && typeof window.F1App.cycleCamera === 'function') {
                        window.F1App.cycleCamera();
                    } else {
                        this.cycleCameraMode();
                    }
                    break;
                case 'KeyB':
                    if (this.followedCar && this.followedCar.isPlayerTeam) {
                        this.togglePitCall(this.followedCar.driver.id);
                    }
                    break;
                case 'KeyR':
                    if (window.F1App && typeof window.F1App.triggerFlashbackLive === 'function') {
                        window.F1App.triggerFlashbackLive();
                    } else {
                        this.triggerFlashback();
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': this.keys.up = false; break;
                case 'KeyS': case 'ArrowDown': this.keys.down = false; break;
                case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
                case 'Space':
                    this.keys.ers = false;
                    if (this.followedCar && this.followedCar.isPlayerTeam && this.followedCar.ersMode === 'OVERTAKE') {
                        this.followedCar.ersMode = 'BALANCED';
                    }
                    break;
            }
        });

        if (this.map2dCanvas) {
            this.map2dCanvas.addEventListener('click', (e) => {
                if (!this.cars.length) return;
                const rect = this.map2dCanvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                const clickX = (e.clientX - rect.left) * dpr;
                const clickY = (e.clientY - rect.top) * dpr;

                let closestCar = null;
                let minDist = 28 * dpr;
                this.cars.forEach(c => {
                    if (c.mapScreenX !== undefined) {
                        const dist = Math.hypot(c.mapScreenX - clickX, c.mapScreenY - clickY);
                        if (dist < minDist) {
                            minDist = dist;
                            closestCar = c;
                        }
                    }
                });
                if (closestCar) {
                    this.setFollowedDriver(closestCar.driver.id);
                }
            });
        }
    }

    startMainLoop() {
        const tick = (now) => {
            requestAnimationFrame(tick);
            const rawDt = Math.min(0.05, (now - this.lastTimestamp) / 1000);
            this.lastTimestamp = now;

            if (this.isRunning && this.circuit) {
                this.updateSimulation(rawDt);
                this.renderScene();
                this.render2DCircuitMap();
            }
        };
        requestAnimationFrame(tick);
    }

    // Build High-Resolution Spline + Ideal Racing Line Offset + Dynamic Braking/Apex/Exit Speeds
    buildSplineTable(waypoints) {
        const n = waypoints.length;
        const totalSamples = 640;
        const pts = [];

        const getCatmullRomPoint = (p0, p1, p2, p3, t) => {
            const t2 = t * t;
            const t3 = t2 * t;
            const x = 0.5 * (
                (2 * p1[0]) +
                (-p0[0] + p2[0]) * t +
                (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
            );
            const z = 0.5 * (
                (2 * p1[1]) +
                (-p0[1] + p2[1]) * t +
                (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
            );
            return { x, z };
        };

        let minX = 9999, maxX = -9999, minZ = 9999, maxZ = -9999;

        for (let i = 0; i < totalSamples; i++) {
            const u = (i / totalSamples) * n;
            const seg = Math.floor(u) % n;
            const localT = u - Math.floor(u);

            const p0 = waypoints[(seg - 1 + n) % n];
            const p1 = waypoints[seg];
            const p2 = waypoints[(seg + 1) % n];
            const p3 = waypoints[(seg + 2) % n];

            const pt = getCatmullRomPoint(p0, p1, p2, p3, localT);
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.z < minZ) minZ = pt.z;
            if (pt.z > maxZ) maxZ = pt.z;
            pts.push(pt);
        }

        this.bounds2D = { minX, maxX, minZ, maxZ };

        // Compute Tangents, Normals, Signed Curvature, and Ideal Racing Line Lateral Offset
        this.trackPoints2D = pts.map((pt, i) => {
            const prev = pts[(i - 3 + totalSamples) % totalSamples];
            const next = pts[(i + 3) % totalSamples];
            const dx = next.x - prev.x;
            const dz = next.z - prev.z;
            const len = Math.hypot(dx, dz) || 1;
            const tx = dx / len;
            const tz = dz / len;
            const nx = -tz;
            const nz = tx;

            const prev2 = pts[(i - 10 + totalSamples) % totalSamples];
            const next2 = pts[(i + 10) % totalSamples];
            const v1x = pt.x - prev2.x;
            const v1z = pt.z - prev2.z;
            const v2x = next2.x - pt.x;
            const v2z = next2.z - pt.z;
            const a1 = Math.atan2(v1z, v1x);
            const a2 = Math.atan2(v2z, v2x);
            let signedTurn = a2 - a1;
            while (signedTurn > Math.PI) signedTurn -= 2 * Math.PI;
            while (signedTurn < -Math.PI) signedTurn += 2 * Math.PI;

            const curvature = Math.abs(signedTurn);

            // Look ahead 14 samples to detect upcoming braking zone
            const aheadPt = pts[(i + 14) % totalSamples];
            const aheadNext = pts[(i + 24) % totalSamples];
            const aAhead = Math.atan2(aheadNext.z - aheadPt.z, aheadNext.x - aheadPt.x);
            let aheadDiff = Math.abs(aAhead - a2);
            if (aheadDiff > Math.PI) aheadDiff = 2 * Math.PI - aheadDiff;

            // Ideal Racing Line Offset: Swing wide before turn, clip inside apex at corner
            const apexSide = Math.sign(signedTurn);
            let idealLateral = 0;
            if (curvature > 0.14) {
                idealLateral = -apexSide * Math.min(6.2, curvature * 11.0);
            } else if (aheadDiff > 0.18) {
                idealLateral = apexSide * 4.5;
            }

            const cornerReduction = Math.min(0.72, Math.max(curvature, aheadDiff * 0.82) * 1.38);
            const idealSpeedKmh = Math.round(338 * (1.0 - cornerReduction));

            return {
                t: i / totalSamples,
                x: pt.x,
                z: pt.z,
                tx,
                tz,
                nx,
                nz,
                signedTurn,
                curvature,
                aheadCurvature: aheadDiff,
                idealLateral,
                idealSpeedKmh
            };
        });
    }

    sampleTrackAt(normalizedT) {
        const total = this.trackPoints2D.length;
        if (!total) return { x: 0, z: 0, tx: 0, tz: 1, nx: -1, nz: 0, curvature: 0, aheadCurvature: 0, idealLateral: 0, idealSpeedKmh: 280 };
        const t = ((normalizedT % 1) + 1) % 1;
        const exactIdx = t * total;
        const idx0 = Math.floor(exactIdx) % total;
        const idx1 = (idx0 + 1) % total;
        const frac = exactIdx - Math.floor(exactIdx);

        const p0 = this.trackPoints2D[idx0];
        const p1 = this.trackPoints2D[idx1];

        return {
            t,
            x: p0.x + (p1.x - p0.x) * frac,
            z: p0.z + (p1.z - p0.z) * frac,
            tx: p0.tx + (p1.tx - p0.tx) * frac,
            tz: p0.tz + (p1.tz - p0.tz) * frac,
            nx: p0.nx + (p1.nx - p0.nx) * frac,
            nz: p0.nz + (p1.nz - p0.nz) * frac,
            curvature: p0.curvature + (p1.curvature - p0.curvature) * frac,
            aheadCurvature: p0.aheadCurvature,
            idealLateral: p0.idealLateral + (p1.idealLateral - p0.idealLateral) * frac,
            idealSpeedKmh: p0.idealSpeedKmh + (p1.idealSpeedKmh - p0.idealSpeedKmh) * frac
        };
    }

    // Launch Grand Prix or Shakedown Test Track Session
    setupGrandPrix(circuitData, gridOrder, playerTeamId, options = {}) {
        this.circuit = circuitData;
        this.isTestTrackMode = !!options.isTestTrackMode;
        this.raceFormat = options.raceFormat || 'FULL';
        const fmt = window.F1Data.raceFormats[this.raceFormat] || window.F1Data.raceFormats.FULL;

        if (this.isTestTrackMode) {
            this.totalLaps = 99;
            this.wearMultiplierFormat = 1.0;
            this.fuelMultiplierFormat = 1.0;
        } else {
            this.totalLaps = fmt.fixedLaps ? fmt.fixedLaps : Math.max(5, Math.round(circuitData.realLaps * fmt.scale));
            this.wearMultiplierFormat = fmt.wearMult;
            this.fuelMultiplierFormat = fmt.fuelMult;
        }

        this.driveControlMode = options.driveControlMode || 'MANUAL';
        this.playerTuning = options.tuning || JSON.parse(JSON.stringify(window.F1Data.defaultTuning));
        this.timeScale = options.startPaused ? 0 : 1.0;
        this.raceElapsedTime = 0;
        this.trackFlag = 'GREEN';
        this.flagTimer = 0;
        this.teamOrderMode = 'FREE';
        this.flashbackHistory = [];
        this.flashbackRecordTimer = 0;
        this.trackLengthMeters = circuitData.lengthKm * 1000;
        this.particles = [];

        // Initial Weather Roll
        if (options.forceWeather) {
            this.weather = options.forceWeather;
            this.trackWater = this.weather === 'HEAVY_RAIN' ? 0.72 : (this.weather === 'INTER_RAIN' ? 0.35 : 0.0);
        } else {
            const roll = Math.random();
            if (roll < circuitData.rainChance * 0.4) {
                this.weather = 'HEAVY_RAIN';
                this.trackWater = 0.70;
                this.trackTemp = 21.0;
            } else if (roll < circuitData.rainChance) {
                this.weather = 'INTER_RAIN';
                this.trackWater = 0.35;
                this.trackTemp = 24.5;
            } else {
                this.weather = 'DRY';
                this.trackWater = 0.0;
                this.trackTemp = circuitData.timeOfDay === 'night' ? 27.0 : 38.0;
            }
        }

        this.buildSplineTable(circuitData.waypoints);

        if (this.hasWebGL) {
            this.build3DEnvironmentAndBiome();
        }

        this.spawnCars(gridOrder, playerTeamId, options.startingTires || {});
        this.resizeViewports();

        this.isRunning = true;
        if (this.isTestTrackMode) {
            this.racePhase = 'RACING';
            window.f1Audio.startEngineSound();
            this.emitEventLog('SHAKEDOWN BENCH', `🔬 ${circuitData.name} 성능 테스트 트랙 주행 시작! 우측 상단이나 R&D 탭에서 윙 각도/서스펜션/타이어 공기압을 조절하며 한계 주행을 테스트하세요.`);
        } else {
            this.startLightsOutCountdown();
        }
    }

    // =========================================================================
    // PROCEDURAL HIGH-CONTRAST TEXTURES FOR TRACK FLOOR, BARRIERS & CATCH FENCES
    // =========================================================================
    createProceduralAsphaltTexture() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d');

        // Bright, unmistakable daytime racing tarmac grey (matching uploaded Images 3, 4, 5)
        ctx.fillStyle = '#525d70';
        ctx.fillRect(0, 0, 512, 512);

        // High-frequency asphalt aggregate grain
        for (let i = 0; i < 4200; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            ctx.fillStyle = (i % 2 === 0) ? 'rgba(255,255,255,0.09)' : 'rgba(15,20,28,0.14)';
            ctx.fillRect(x, y, 2, 3);
        }

        // Dark twin rubber tire skid grooves along racing lane
        const g1 = ctx.createLinearGradient(90, 0, 422, 0);
        g1.addColorStop(0.0, 'rgba(20,24,32,0)');
        g1.addColorStop(0.25, 'rgba(22,26,35,0.42)');
        g1.addColorStop(0.50, 'rgba(30,35,46,0.22)');
        g1.addColorStop(0.75, 'rgba(22,26,35,0.42)');
        g1.addColorStop(1.0, 'rgba(20,24,32,0)');
        ctx.fillStyle = g1;
        ctx.fillRect(90, 0, 332, 512);

        // Crisp Solid White FIA Track-Limit Edge Lines (Left & Right)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 0, 18, 512);
        ctx.fillRect(484, 0, 18, 512);

        // Yellow Pit/Marshal Inner Edge Line (like Image 3 & 4)
        ctx.fillStyle = '#facc15';
        ctx.fillRect(32, 0, 6, 512);

        // Subtle longitudinal asphalt seam & dashed grid marker
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        for (let y = 0; y < 512; y += 64) {
            ctx.fillRect(254, y + 10, 4, 28);
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 120);
        return tex;
    }

    createProceduralBarrierTexture() {
        const c = document.createElement('canvas');
        c.width = 1024;
        c.height = 128;
        const ctx = c.getContext('2d');

        const theme = this.circuit.barrierTheme || 'ROLEX_GREEN';
        let bg = '#006039';
        let fg = '#ffd100';
        let label = 'ROLEX   •   FORMULA 1   •   PIRELLI   •   ARAMCO   •   DHL';

        if (theme === 'LV_PURPLE_AUS') {
            bg = '#3b1d5e';
            fg = '#ffffff';
            label = 'LOUIS VUITTON   •   FORMULA 1   •   ROLEX   •   PIRELLI';
        } else if (theme === 'MONACO_ARMCO') {
            bg = '#b91c1c';
            fg = '#ffffff';
            label = 'MONACO GRAND PRIX   •   TAG Heuer   •   ROLEX   •   PIRELLI';
        } else if (theme === 'ARAMCO_BLUE') {
            bg = '#0284c7';
            fg = '#34d399';
            label = 'aramco   •   FORMULA 1   •   PIRELLI   •   DHL   •   ROLEX';
        } else if (theme === 'PIRELLI_YELLOW') {
            bg = '#facc15';
            fg = '#dc2626';
            label = 'PIRELLI   •   P ZERO   •   FORMULA 1   •   ROLEX   •   DHL';
        }

        // Top Sponsor Advertising Banner Half
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1024, 76);

        // For Monaco street barriers, draw iconic red & white alternating blocks at the top edge
        if (theme === 'MONACO_ARMCO') {
            for (let x = 0; x < 1024; x += 128) {
                ctx.fillStyle = (x / 128) % 2 === 0 ? '#dc2626' : '#f8fafc';
                ctx.fillRect(x, 0, 128, 20);
            }
        } else {
            ctx.fillStyle = fg;
            ctx.fillRect(0, 0, 1024, 8);
        }

        ctx.fillStyle = fg;
        ctx.font = '900 32px "Barlow Condensed", "Inter", sans-serif';
        ctx.fillText(label, 24, 54);

        // Bottom 3-Tier Silver Corrugated Steel Armco Guardrail (matching Images 3 & 4)
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 76, 1024, 52);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, 76, 1024, 5);
        ctx.fillRect(0, 93, 1024, 5);
        ctx.fillRect(0, 110, 1024, 5);
        ctx.fillRect(0, 124, 1024, 4);

        // Vertical Armco bolt posts every 64px
        ctx.fillStyle = '#334155';
        for (let x = 0; x < 1024; x += 64) {
            ctx.fillRect(x, 76, 6, 52);
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(95, 1);
        return tex;
    }

    createCatchFenceTexture() {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 128;
        const ctx = c.getContext('2d');

        ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
        ctx.fillRect(0, 0, 256, 128);

        // Chain-link wire mesh grid
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
        ctx.lineWidth = 1.5;
        for (let x = 0; x <= 256; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 128);
            ctx.stroke();
        }
        for (let y = 0; y <= 128; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(256, y);
            ctx.stroke();
        }

        // Thick steel vertical posts & top horizontal cable bar
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(0, 0, 256, 8);
        ctx.fillRect(0, 58, 256, 4);
        for (let x = 0; x < 256; x += 64) {
            ctx.fillRect(x, 0, 7, 128);
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(160, 1);
        return tex;
    }

    createCrowdTexture() {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 128;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 256, 128);

        const colors = ['#ef4444', '#facc15', '#38bdf8', '#ffffff', '#f97316', '#22c55e', '#a855f7'];
        for (let y = 8; y < 120; y += 10) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(0, y + 6, 256, 3);
            for (let x = 4; x < 252; x += 6) {
                ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillRect(x, y, 4, 6);
            }
        }
        return new THREE.CanvasTexture(c);
    }

    // =========================================================================
    // BUILD 3D TRACK FLOOR, KERBS, GRASS VERGE, SPONSOR WALLS, CATCH FENCES & BIOME
    // =========================================================================
    build3DEnvironmentAndBiome() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        const isNight = this.circuit.timeOfDay === 'night';
        const skyHex = this.weather !== 'DRY'
            ? 0x475569
            : (isNight ? 0x0b1325 : (this.circuit.skyColor || 0x38bdf8));
        this.scene.background = new THREE.Color(skyHex);
        this.scene.fog = new THREE.FogExp2(skyHex, this.weather === 'HEAVY_RAIN' ? 0.0011 : 0.00042);

        // Bright hemisphere + directional lighting so track floor & walls are 100% crisp
        const hemi = new THREE.HemisphereLight(0xffffff, 0x64748b, isNight ? 0.92 : 1.15);
        this.scene.add(hemi);

        const sun = new THREE.DirectionalLight(
            this.circuit.timeOfDay === 'sunset' ? 0xffb478 : 0xfffbeb,
            isNight ? 1.10 : 1.35
        );
        sun.position.set(220, 380, 180);
        sun.castShadow = true;
        this.scene.add(sun);

        // 1. Base World Terrain Plane
        const groundColor = this.circuit.isStreetCircuit
            ? 0x334155
            : (this.circuit.groundColor || 0x2d5a27);
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(3600, 3600),
            new THREE.MeshLambertMaterial({ color: groundColor })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.15;
        this.scene.add(ground);

        const n = this.trackPoints2D.length;
        const halfW = this.circuit.isStreetCircuit ? 9.6 : 10.8;
        const kerbW = 1.85;
        // Street circuits (Monaco, Singapore, Vegas, Jeddah, Baku) have tight walls right at the kerbs!
        // Park/Autodrome circuits have a lush green grass run-off verge between the kerbs and the barrier walls (matching Images 3, 4, 5).
        const wallOffset = this.circuit.isStreetCircuit ? (halfW + kerbW + 0.35) : (halfW + kerbW + 3.2);
        const wallHeight = 1.45;
        const fenceHeight = 3.55;

        const vergePos = [];
        const vergeIdx = [];

        const roadPos = [];
        const roadUv = [];
        const roadIdx = [];

        const kerbPos = [];
        const kerbCol = [];
        const kerbIdx = [];

        const linePos = [];
        const lineCol = [];
        const lineIdx = [];

        const wallPos = [];
        const wallUv = [];
        const wallIdx = [];

        const fencePos = [];
        const fenceUv = [];
        const fenceIdx = [];

        const kc = this.circuit.kerbColors || [0xe10600, 0xf8fafc];
        const kerbC1 = new THREE.Color(kc[0]);
        const kerbC2 = new THREE.Color(kc[1]);

        let cumDist = 0;

        for (let i = 0; i <= n; i++) {
            const p = this.trackPoints2D[i % n];
            if (i > 0) {
                const prev = this.trackPoints2D[(i - 1) % n];
                cumDist += Math.hypot(p.x - prev.x, p.z - prev.z);
            }
            const uCoord = i / n;

            // Grass / Concrete Run-off Verge Ribbon under track & barriers
            const vOut = wallOffset + 4.5;
            vergePos.push(
                p.x + p.nx * vOut, 0.01, p.z + p.nz * vOut,
                p.x - p.nx * vOut, 0.01, p.z - p.nz * vOut
            );

            // Asphalt Road Surface (elevated at y = 0.05 so it never Z-fights with ground)
            const lx = p.x + p.nx * halfW;
            const lz = p.z + p.nz * halfW;
            const rx = p.x - p.nx * halfW;
            const rz = p.z - p.nz * halfW;

            roadPos.push(lx, 0.05, lz, rx, 0.05, rz);
            roadUv.push(0, uCoord, 1, uCoord);

            // Raised 3D FIA Serrated Kerbs (y = 0.06 -> 0.14)
            const lkx = p.x + p.nx * (halfW + kerbW);
            const lkz = p.z + p.nz * (halfW + kerbW);
            const rkx = p.x - p.nx * (halfW + kerbW);
            const rkz = p.z - p.nz * (halfW + kerbW);

            kerbPos.push(lkx, 0.13, lkz, lx, 0.06, lz, rx, 0.06, rz, rkx, 0.13, rkz);
            const c = (i % 2 === 0) ? kerbC1 : kerbC2;
            for (let k = 0; k < 4; k++) kerbCol.push(c.r, c.g, c.b);

            // 3D Ideal Racing Line Chevron Ribbon (like Image 5)
            const ilx = p.x + p.nx * (p.idealLateral + 0.80);
            const ilz = p.z + p.nz * (p.idealLateral + 0.80);
            const irx = p.x + p.nx * (p.idealLateral - 0.80);
            const irz = p.z + p.nz * (p.idealLateral - 0.80);
            linePos.push(ilx, 0.08, ilz, irx, 0.08, irz);

            const isChevronGap = (i % 3 === 0);
            let lc = isChevronGap ? [0.0, 0.95, 0.88] : [0.0, 0.85, 0.45]; // Cyan/Green full throttle
            if (p.aheadCurvature > 0.21 || p.curvature > 0.23) {
                lc = isChevronGap ? [1.0, 0.25, 0.15] : [0.92, 0.06, 0.06]; // Red heavy braking zone
            } else if (p.aheadCurvature > 0.12 || p.curvature > 0.13) {
                lc = [1.0, 0.82, 0.06]; // Yellow medium apex
            }
            lineCol.push(lc[0], lc[1], lc[2], lc[0], lc[1], lc[2]);

            // Left & Right 3D Trackside Sponsor Barrier Walls + Armco Guardrails
            const wlx = p.x + p.nx * wallOffset;
            const wlz = p.z + p.nz * wallOffset;
            const wrx = p.x - p.nx * wallOffset;
            const wrz = p.z - p.nz * wallOffset;

            wallPos.push(
                wlx, 0.02, wlz,
                wlx, wallHeight, wlz,
                wrx, 0.02, wrz,
                wrx, wallHeight, wrz
            );
            wallUv.push(uCoord, 0, uCoord, 1, uCoord, 0, uCoord, 1);

            // Tall Curved Steel Debris Catch Fences above the barriers (Images 3, 4, 5)
            // Overhang slightly inward toward track (+0.45m) like real FIA catch fencing
            const flx = p.x + p.nx * (wallOffset - 0.35);
            const flz = p.z + p.nz * (wallOffset - 0.35);
            const frx = p.x - p.nx * (wallOffset - 0.35);
            const frz = p.z - p.nz * (wallOffset - 0.35);

            fencePos.push(
                wlx, wallHeight, wlz,
                flx, wallHeight + fenceHeight, flz,
                wrx, wallHeight, wrz,
                frx, wallHeight + fenceHeight, frz
            );
            fenceUv.push(uCoord, 0, uCoord, 1, uCoord, 0, uCoord, 1);

            if (i < n) {
                const rb = i * 2;
                vergeIdx.push(rb, rb + 1, rb + 2, rb + 1, rb + 3, rb + 2);
                roadIdx.push(rb, rb + 1, rb + 2, rb + 1, rb + 3, rb + 2);
                lineIdx.push(rb, rb + 1, rb + 2, rb + 1, rb + 3, rb + 2);

                const kb = i * 4;
                kerbIdx.push(kb, kb + 1, kb + 4, kb + 1, kb + 5, kb + 4);
                kerbIdx.push(kb + 2, kb + 3, kb + 6, kb + 3, kb + 7, kb + 6);

                const wb = i * 4;
                // Left wall & Right wall
                wallIdx.push(wb, wb + 1, wb + 4, wb + 1, wb + 5, wb + 4);
                wallIdx.push(wb + 2, wb + 6, wb + 3, wb + 3, wb + 6, wb + 7);

                // Left catch fence & Right catch fence
                fenceIdx.push(wb, wb + 1, wb + 4, wb + 1, wb + 5, wb + 4);
                fenceIdx.push(wb + 2, wb + 6, wb + 3, wb + 3, wb + 6, wb + 7);
            }
        }

        // 2. Grass / Run-off Verge Mesh
        const vergeGeo = new THREE.BufferGeometry();
        vergeGeo.setAttribute('position', new THREE.Float32BufferAttribute(vergePos, 3));
        vergeGeo.setIndex(vergeIdx);
        vergeGeo.computeVertexNormals();
        const vergeColor = this.circuit.isStreetCircuit ? 0x64748b : 0x3b7a2e;
        const vergeMesh = new THREE.Mesh(
            vergeGeo,
            new THREE.MeshLambertMaterial({ color: vergeColor, side: THREE.DoubleSide })
        );
        this.scene.add(vergeMesh);

        // 3. Unmistakable Bright Asphalt Track Floor Mesh
        const roadGeo = new THREE.BufferGeometry();
        roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
        roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUv, 2));
        roadGeo.setIndex(roadIdx);
        roadGeo.computeVertexNormals();
        const asphaltTex = this.createProceduralAsphaltTexture();
        const roadMesh = new THREE.Mesh(
            roadGeo,
            new THREE.MeshLambertMaterial({
                map: asphaltTex,
                color: this.weather === 'DRY' ? 0xffffff : 0xcbd5e1,
                emissive: 0x161b24,
                side: THREE.DoubleSide
            })
        );
        roadMesh.receiveShadow = true;
        this.scene.add(roadMesh);

        // 4. Raised 3D FIA Kerbs Mesh
        const kerbGeo = new THREE.BufferGeometry();
        kerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(kerbPos, 3));
        kerbGeo.setAttribute('color', new THREE.Float32BufferAttribute(kerbCol, 3));
        kerbGeo.setIndex(kerbIdx);
        kerbGeo.computeVertexNormals();
        this.scene.add(new THREE.Mesh(
            kerbGeo,
            new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
        ));

        // 5. Ideal Racing Line Chevron Ribbon Mesh
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
        lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineCol, 3));
        lineGeo.setIndex(lineIdx);
        this.racingLineMesh = new THREE.Mesh(
            lineGeo,
            new THREE.MeshBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.78,
                side: THREE.DoubleSide
            })
        );
        this.racingLineMesh.visible = this.showRacingLine;
        this.scene.add(this.racingLineMesh);

        // 6. 3D Trackside Sponsor Barrier Walls + 3-Tier Silver Armco Guardrails
        const wallGeo = new THREE.BufferGeometry();
        wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallPos, 3));
        wallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wallUv, 2));
        wallGeo.setIndex(wallIdx);
        wallGeo.computeVertexNormals();
        const barrierTex = this.createProceduralBarrierTexture();
        const wallMesh = new THREE.Mesh(
            wallGeo,
            new THREE.MeshLambertMaterial({
                map: barrierTex,
                emissive: 0x141820,
                side: THREE.DoubleSide
            })
        );
        this.scene.add(wallMesh);

        // 7. Curved Steel Debris Catch Fences above Barriers
        const fenceGeo = new THREE.BufferGeometry();
        fenceGeo.setAttribute('position', new THREE.Float32BufferAttribute(fencePos, 3));
        fenceGeo.setAttribute('uv', new THREE.Float32BufferAttribute(fenceUv, 2));
        fenceGeo.setIndex(fenceIdx);
        const fenceTex = this.createCatchFenceTexture();
        const fenceMesh = new THREE.Mesh(
            fenceGeo,
            new THREE.MeshBasicMaterial({
                map: fenceTex,
                transparent: true,
                opacity: 0.82,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        this.scene.add(fenceMesh);

        // 8. Monaco Tunnel / Circuit Overpass Tunnel (if circuit.tunnelZone is defined)
        if (this.circuit.tunnelZone && Array.isArray(this.circuit.tunnelZone)) {
            this.buildMonacoTunnel3D(this.circuit.tunnelZone, wallOffset);
        }

        // 9. Pit Lane, Garages, Start Gantry & Overhead Sponsor Bridges
        this.buildPitLaneAndGarages(halfW, wallOffset);

        // 10. Regional Biome Landmarks, Grandstands, Paddock Tents & Braking Boards
        this.buildRegionalBiomeScenery(halfW, wallOffset);

        // 11. 3D Safety Car Mesh (parked at pit exit until SC deployed)
        this.create3DSafetyCarMesh();

        this.particleGroup3D = new THREE.Group();
        this.scene.add(this.particleGroup3D);
    }

    // Build Iconic Monaco Sector 2 Covered Concrete Tunnel (Turn 9 Portier -> Nouvelle Chicane)
    buildMonacoTunnel3D(tunnelZone, wallOffset) {
        const n = this.trackPoints2D.length;
        const startIdx = Math.floor(tunnelZone[0] * n);
        const endIdx = Math.floor(tunnelZone[1] * n);
        const tunnelW = wallOffset + 1.2;
        const tunnelH = 7.4;

        const tPos = [];
        const tIdx = [];
        let vertCount = 0;

        for (let i = startIdx; i <= endIdx; i++) {
            const p = this.trackPoints2D[i % n];
            const lx = p.x + p.nx * tunnelW;
            const lz = p.z + p.nz * tunnelW;
            const rx = p.x - p.nx * tunnelW;
            const rz = p.z - p.nz * tunnelW;

            // Left outer wall base, Left roof, Right roof, Right outer wall base
            tPos.push(
                lx, 0, lz,
                lx, tunnelH, lz,
                rx, tunnelH, rz,
                rx, 0, rz
            );

            if (i < endIdx) {
                const b = vertCount * 4;
                // Left tunnel wall
                tIdx.push(b, b + 1, b + 4, b + 1, b + 5, b + 4);
                // Concrete ceiling roof
                tIdx.push(b + 1, b + 2, b + 5, b + 2, b + 6, b + 5);
                // Right tunnel wall
                tIdx.push(b + 2, b + 3, b + 6, b + 3, b + 7, b + 6);
            }
            vertCount++;

            // Glowing warm tunnel ceiling light strips every 3 samples
            if (i % 3 === 0) {
                const strip = new THREE.Mesh(
                    new THREE.BoxGeometry(tunnelW * 1.4, 0.25, 1.4),
                    new THREE.MeshBasicMaterial({ color: 0xfef08a })
                );
                strip.position.set(p.x, tunnelH - 0.25, p.z);
                strip.rotation.y = Math.atan2(p.tx, p.tz);
                this.scene.add(strip);
            }
        }

        const tGeo = new THREE.BufferGeometry();
        tGeo.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3));
        tGeo.setIndex(tIdx);
        tGeo.computeVertexNormals();

        const tunnelMesh = new THREE.Mesh(
            tGeo,
            new THREE.MeshLambertMaterial({ color: 0x334155, side: THREE.DoubleSide })
        );
        this.scene.add(tunnelMesh);

        // Monte Carlo Hotel/Building block above the tunnel roof
        const midIdx = Math.floor((startIdx + endIdx) * 0.5);
        const mp = this.trackPoints2D[midIdx % n];
        const roofBldg = new THREE.Mesh(
            new THREE.BoxGeometry(tunnelW * 2.2, 16, 48),
            new THREE.MeshLambertMaterial({ color: 0xe2e8f0 })
        );
        roofBldg.position.set(mp.x, tunnelH + 8, mp.z);
        roofBldg.rotation.y = Math.atan2(mp.tx, mp.tz);
        this.scene.add(roofBldg);
    }

    buildPitLaneAndGarages(halfW, wallOffset) {
        const s0 = this.trackPoints2D[0];
        const angle = Math.atan2(s0.tx, s0.tz);
        const gantry = new THREE.Group();
        gantry.position.set(s0.x, 0, s0.z);
        gantry.rotation.y = angle;

        // Start/Finish Checkered Line & Grid Boxes
        const startLine = new THREE.Mesh(
            new THREE.PlaneGeometry(halfW * 2, 3.6),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        );
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.y = 0.09;
        gantry.add(startLine);

        // Pit Lane Road Surface
        const pitRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(9.0, 120),
            new THREE.MeshLambertMaterial({ color: 0x3b4454, side: THREE.DoubleSide })
        );
        pitRoad.rotation.x = -Math.PI / 2;
        pitRoad.position.set(-(wallOffset + 6.2), 0.04, -12);
        gantry.add(pitRoad);

        // 10 Constructor Pit Boxes & Modern Glass Garages Building
        const pitBldg = new THREE.Mesh(
            new THREE.BoxGeometry(13, 12, 108),
            new THREE.MeshLambertMaterial({ color: 0x1e293b })
        );
        pitBldg.position.set(-(wallOffset + 16.5), 6.0, -12);
        gantry.add(pitBldg);

        // White Upper Hospitality Terrace Roof on Pit Building
        const pitRoof = new THREE.Mesh(
            new THREE.BoxGeometry(14.5, 1.4, 112),
            new THREE.MeshLambertMaterial({ color: 0xf8fafc })
        );
        pitRoof.position.set(-(wallOffset + 16.5), 12.6, -12);
        gantry.add(pitRoof);

        window.F1Data.teams.forEach((t, idx) => {
            const zPos = -54 + idx * 9.8;
            const bay = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 4.0, 8.2),
                new THREE.MeshBasicMaterial({ color: t.carHex })
            );
            bay.position.set(-(wallOffset + 9.8), 2.4, zPos);
            gantry.add(bay);

            const boxMark = new THREE.Mesh(
                new THREE.PlaneGeometry(4.0, 6.2),
                new THREE.MeshBasicMaterial({ color: t.wingHex, side: THREE.DoubleSide })
            );
            boxMark.rotation.x = -Math.PI / 2;
            boxMark.position.set(-(wallOffset + 5.8), 0.07, zPos);
            gantry.add(boxMark);
        });

        // Overhead Start/Finish Gantry Bridge with 5 Red Light Pods
        const bridgeSpan = (wallOffset + 2.2) * 2;
        const arch = new THREE.Mesh(
            new THREE.BoxGeometry(bridgeSpan, 2.2, 2.0),
            new THREE.MeshLambertMaterial({ color: 0xe10600 })
        );
        arch.position.set(0, 9.2, 0);
        gantry.add(arch);

        const pL = new THREE.Mesh(new THREE.BoxGeometry(1.3, 9.6, 1.3), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
        pL.position.set(wallOffset + 1.8, 4.8, 0);
        const pR = pL.clone();
        pR.position.set(-(wallOffset + 1.8), 4.8, 0);
        gantry.add(pL, pR);

        this.scene.add(gantry);
    }

    buildRegionalBiomeScenery(halfW, wallOffset) {
        const biome = this.circuit.biome || 'MODERN_AUTODROME';
        const n = this.trackPoints2D.length;
        const step = this.sceneryDensity === 'MEDIUM' ? 20 : 12;

        const crowdTex = this.createCrowdTexture();
        const crowdMat = new THREE.MeshLambertMaterial({ map: crowdTex });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
        const frameMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const tentMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });

        // 1. Place Overhead Sponsor Bridges (ROLEX / ARAMCO / PIRELLI) at 3 sector splits
        [Math.floor(n * 0.33), Math.floor(n * 0.66)].forEach((bIdx, k) => {
            const p = this.trackPoints2D[bIdx];
            const ang = Math.atan2(p.tx, p.tz);
            const brGrp = new THREE.Group();
            brGrp.position.set(p.x, 0, p.z);
            brGrp.rotation.y = ang;

            const span = (wallOffset + 2.0) * 2;
            const beam = new THREE.Mesh(
                new THREE.BoxGeometry(span, 2.0, 2.2),
                new THREE.MeshLambertMaterial({ color: k === 0 ? 0x006039 : 0x0284c7 })
            );
            beam.position.y = 8.8;
            const colL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9.0, 1.2), frameMat);
            colL.position.set(wallOffset + 1.5, 4.5, 0);
            const colR = colL.clone();
            colR.position.x = -(wallOffset + 1.5);
            brGrp.add(beam, colL, colR);
            this.scene.add(brGrp);
        });

        // 2. Trackside Grandstands, White Paddock Tents, Jumbotrons, Lamps & Braking Marker Boards
        for (let i = 16; i < n - 16; i += step) {
            const p = this.trackPoints2D[i];
            const ang = Math.atan2(p.tx, p.tz);
            const side = (i % (step * 2) === 0) ? 1 : -1;

            // Braking Marker Boards (150m / 100m / 50m) before heavy corners (like Image 5)
            if (p.aheadCurvature > 0.20) {
                const brkBoard = new THREE.Mesh(
                    new THREE.BoxGeometry(1.8, 1.2, 0.2),
                    new THREE.MeshBasicMaterial({ color: 0xf8fafc })
                );
                const bx = p.x + p.nx * (wallOffset - 0.8);
                const bz = p.z + p.nz * (wallOffset - 0.8);
                brkBoard.position.set(bx, 1.8, bz);
                brkBoard.rotation.y = ang;
                this.scene.add(brkBoard);
            }

            // Trackside Floodlight / Speaker Poles right behind the catch fence
            const poleGrp = new THREE.Group();
            poleGrp.position.set(
                p.x + p.nx * side * (wallOffset + 2.4),
                0,
                p.z + p.nz * side * (wallOffset + 2.4)
            );
            poleGrp.rotation.y = ang;
            const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 14, 6), frameMat);
            pm.position.y = 7.0;
            const hm = new THREE.Mesh(
                new THREE.BoxGeometry(2.4, 0.6, 1.1),
                new THREE.MeshBasicMaterial({ color: 0xfffbeb })
            );
            hm.position.set(-side * 1.0, 14.0, 0);
            poleGrp.add(pm, hm);
            this.scene.add(poleGrp);

            // Roofed Multi-Tier Spectator Grandstands with Crowd & Canopy (matching Images 3 & 4)
            if (i % (step * 3) === 0) {
                const gsGrp = new THREE.Group();
                const gsDist = wallOffset + 12.5;
                gsGrp.position.set(p.x + p.nx * side * gsDist, 0, p.z + p.nz * side * gsDist);
                gsGrp.rotation.y = ang + (side < 0 ? Math.PI : 0);

                const base = new THREE.Mesh(new THREE.BoxGeometry(11, 7.5, 36), crowdMat);
                base.position.y = 3.75;
                const canopy = new THREE.Mesh(new THREE.BoxGeometry(13, 0.7, 38), roofMat);
                canopy.position.set(-1.0, 9.2, 0);
                canopy.rotation.z = -0.12;
                const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9.2, 36), frameMat);
                backWall.position.set(5.2, 4.6, 0);

                gsGrp.add(base, canopy, backWall);
                this.scene.add(gsGrp);
            }

            // White Peaked Paddock Hospitality Tents & Jumbotron Screens (matching Image 5)
            if (i % (step * 4) === step) {
                const tentGrp = new THREE.Group();
                const tDist = wallOffset + 11.0;
                tentGrp.position.set(p.x - p.nx * side * tDist, 0, p.z - p.nz * side * tDist);
                tentGrp.rotation.y = ang;

                const tBase = new THREE.Mesh(new THREE.BoxGeometry(8, 3.8, 12), tentMat);
                tBase.position.y = 1.9;
                const tPeak = new THREE.Mesh(new THREE.ConeGeometry(6.8, 3.5, 4), roofMat);
                tPeak.position.y = 5.55;
                tPeak.rotation.y = Math.PI / 4;
                tentGrp.add(tBase, tPeak);
                this.scene.add(tentGrp);
            }

            // Biome-Specific Perimeter Scenery (Trees, Skyscrapers, Apartments, Dunes)
            const propDist = wallOffset + 25 + (i % 3) * 8;
            const px = p.x + p.nx * side * propDist;
            const pz = p.z + p.nz * side * propDist;

            if (biome === 'HARBOR_CITY') {
                // Monaco / Monte Carlo Terraced Cream & Terracotta Hillside Apartments
                const bH = 24 + (i % 4) * 10;
                const apt = new THREE.Mesh(
                    new THREE.BoxGeometry(16, bH, 18),
                    new THREE.MeshLambertMaterial({ color: (i % 2 === 0) ? 0xfef3c7 : 0xfed7aa })
                );
                apt.position.set(px, bH / 2, pz);
                apt.rotation.y = ang;
                const terraRoof = new THREE.Mesh(
                    new THREE.BoxGeometry(16.6, 1.4, 18.6),
                    new THREE.MeshLambertMaterial({ color: 0xc2410c })
                );
                terraRoof.position.set(px, bH + 0.7, pz);
                terraRoof.rotation.y = ang;
                this.scene.add(apt, terraRoof);
            } else if (biome === 'NEON_CITY_NIGHT' || biome === 'HARBOR_PALM') {
                // Illuminated Glass Skyscrapers & Neon Strips
                const bH = 28 + (i % 5) * 14;
                const bldg = new THREE.Mesh(
                    new THREE.BoxGeometry(16, bH, 16),
                    new THREE.MeshLambertMaterial({ color: 0x1e293b })
                );
                bldg.position.set(px, bH / 2, pz);
                this.scene.add(bldg);

                const neon = new THREE.Mesh(
                    new THREE.BoxGeometry(16.4, 1.4, 16.4),
                    new THREE.MeshBasicMaterial({ color: (i % 24 === 0) ? 0x00f0ff : 0xe10600 })
                );
                neon.position.set(px, bH - 3, pz);
                this.scene.add(neon);
            } else if (biome === 'DESERT_NIGHT') {
                // Palm Trees & Desert Dunes
                const palm = new THREE.Group();
                palm.position.set(px, 0, pz);
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 9, 6), new THREE.MeshLambertMaterial({ color: 0x78350f }));
                trunk.position.y = 4.5;
                const crown = new THREE.Mesh(new THREE.SphereGeometry(3.0, 8, 6), new THREE.MeshLambertMaterial({ color: 0x15803d }));
                crown.scale.set(1.7, 0.42, 1.7);
                crown.position.y = 9.0;
                palm.add(trunk, crown);
                this.scene.add(palm);
            } else {
                // Lush Park / Forest Trees + Distant City Skyline on PARK_LAKE (Image 4)
                const treeGrp = new THREE.Group();
                treeGrp.position.set(px, 0, pz);
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 3.4, 6), new THREE.MeshLambertMaterial({ color: 0x5c4033 }));
                trunk.position.y = 1.7;
                const foliage = new THREE.Mesh(
                    new THREE.SphereGeometry(4.2, 8, 8),
                    new THREE.MeshLambertMaterial({ color: (i % 2 === 0) ? 0x15803d : 0x166534 })
                );
                foliage.position.y = 6.2;
                treeGrp.add(trunk, foliage);
                this.scene.add(treeGrp);
            }
        }

        // 3. Iconic Regional Centerpiece Landmarks
        if (biome === 'HARBOR_CITY') {
            // Monte Carlo Mediterranean Yacht Harbor + 3D Luxury Superyachts moored beside Sector 2/3!
            const harborWater = new THREE.Mesh(
                new THREE.PlaneGeometry(240, 210),
                new THREE.MeshLambertMaterial({ color: 0x0284c7, side: THREE.DoubleSide })
            );
            harborWater.rotation.x = -Math.PI / 2;
            harborWater.position.set(45, 0.02, 75);
            this.scene.add(harborWater);

            // Spawn 8 3D Luxury Yachts in Monte Carlo Harbor
            for (let y = 0; y < 8; y++) {
                const yacht = new THREE.Group();
                yacht.position.set(-10 + (y % 4) * 34, 0.2, 42 + Math.floor(y / 4) * 38);
                yacht.rotation.y = 0.35;
                const hull = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.4, 18), roofMat);
                hull.position.y = 1.2;
                const deck = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.0, 11), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
                deck.position.set(0, 3.2, -1);
                const glass = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.9, 9), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
                glass.position.set(0, 3.3, -1);
                yacht.add(hull, deck, glass);
                this.scene.add(yacht);
            }
        } else if (biome === 'PARK_LAKE') {
            // Melbourne Albert Park / Montreal Lake + Glass Skyline Towers (matching Image 4)
            const lake = new THREE.Mesh(
                new THREE.CylinderGeometry(115, 115, 0.2, 36),
                new THREE.MeshLambertMaterial({ color: 0x0369a1 })
            );
            lake.position.set(0, 0.01, 10);
            this.scene.add(lake);

            for (let s = 0; s < 12; s++) {
                const ang = (s / 12) * Math.PI * 2;
                const h = 55 + (s % 4) * 22;
                const tower = new THREE.Mesh(
                    new THREE.BoxGeometry(26, h, 26),
                    new THREE.MeshLambertMaterial({ color: 0x475569 })
                );
                tower.position.set(Math.cos(ang) * 440, h / 2, Math.sin(ang) * 440);
                this.scene.add(tower);
            }
        } else if (biome === 'SUZUKA_PARK') {
            // Iconic Suzuka Giant Ferris Wheel
            const wheelGrp = new THREE.Group();
            wheelGrp.position.set(-45, 38, 65);
            const rim = new THREE.Mesh(
                new THREE.TorusGeometry(32, 1.4, 10, 28),
                new THREE.MeshBasicMaterial({ color: 0x22c55e })
            );
            const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 44, 6), roofMat);
            legL.position.set(-8, -18, 4);
            legL.rotation.z = -0.22;
            const legR = legL.clone();
            legR.position.set(8, -18, -4);
            legR.rotation.z = 0.22;
            wheelGrp.add(rim, legL, legR);
            this.scene.add(wheelGrp);
        } else if (biome === 'NEON_CITY_NIGHT') {
            // Las Vegas Glowing Exosphere Landmark
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(38, 24, 24),
                new THREE.MeshBasicMaterial({ color: 0xf97316 })
            );
            sphere.position.set(45, 34, 10);
            this.scene.add(sphere);
        } else if (biome === 'ALPINE_MOUNTAIN' || biome === 'FOREST_HILLS') {
            // Surrounding Mountain Peaks
            for (let m = 0; m < 10; m++) {
                const ang = (m / 10) * Math.PI * 2;
                const mtn = new THREE.Mesh(
                    new THREE.ConeGeometry(110, 165, 6),
                    new THREE.MeshLambertMaterial({ color: 0x334155 })
                );
                mtn.position.set(Math.cos(ang) * 560, 80, Math.sin(ang) * 560);
                this.scene.add(mtn);
            }
        }
    }

    create3DSafetyCarMesh() {
        if (!this.hasWebGL) return;
        const sc = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.92, 0.65, 4.5),
            new THREE.MeshLambertMaterial({ color: 0x10b981 })
        );
        body.position.y = 0.55;
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.60, 0.50, 2.1),
            new THREE.MeshLambertMaterial({ color: 0x0f172a })
        );
        cabin.position.set(0, 1.05, -0.2);
        const lightBar = new THREE.Mesh(
            new THREE.BoxGeometry(1.35, 0.16, 0.32),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        lightBar.position.set(0, 1.38, -0.1);
        sc.add(body, cabin, lightBar);
        sc.visible = false;
        this.scene.add(sc);
        this.safetyCar3D = sc;
    }

    // Detailed F1 2025 Car Mesh including Halo, Front Wing Endplates, Suspension Wishbones & Side Mirrors (for T-Cam View!)
    create3DCarMesh(team, driver, tireCompoundKey) {
        if (!this.hasWebGL) return null;
        const grp = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: team.carHex, metalness: 0.45, roughness: 0.25 });
        const wingMat = new THREE.MeshStandardMaterial({ color: team.wingHex, metalness: 0.30, roughness: 0.35 });
        const carbonMat = new THREE.MeshLambertMaterial({ color: 0x14171f });

        // Underfloor Plank & Diffuser
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.08, 4.95), carbonMat);
        floor.position.set(0, 0.16, 0);
        grp.add(floor);

        // Main Monocoque & Engine Cover
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.46, 3.85), bodyMat);
        body.position.set(0, 0.43, -0.1);
        grp.add(body);

        // Sloped Front Nose Cone (visible in T-Cam / Cockpit view)
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 1.75), bodyMat);
        nose.position.set(0, 0.30, 2.15);
        nose.rotation.x = 0.09;
        grp.add(nose);

        // Sculpted Sidepods
        const podGeo = new THREE.BoxGeometry(0.54, 0.38, 2.15);
        const lPod = new THREE.Mesh(podGeo, bodyMat);
        lPod.position.set(0.63, 0.38, -0.15);
        const rPod = lPod.clone();
        rPod.position.x = -0.63;
        grp.add(lPod, rPod);

        // Side Mirrors (Left & Right)
        const mirGeo = new THREE.BoxGeometry(0.22, 0.10, 0.14);
        const lMir = new THREE.Mesh(mirGeo, wingMat);
        lMir.position.set(0.68, 0.66, 0.58);
        const rMir = lMir.clone();
        rMir.position.x = -0.68;
        grp.add(lMir, rMir);

        // Roll Hoop Airbox & T-Cam Mount
        const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.44, 1.45), bodyMat);
        airbox.position.set(0, 0.80, -0.55);
        grp.add(airbox);

        // Titanium Halo Cockpit Protection Bar (central pillar + curved hoop visible in T-Cam & Cockpit)
        const haloPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.42, 8), carbonMat);
        haloPillar.position.set(0, 0.72, 0.72);
        haloPillar.rotation.x = -0.45;
        const haloArc = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 8, 16, Math.PI), carbonMat);
        haloArc.rotation.x = Math.PI / 2;
        haloArc.position.set(0, 0.82, 0.34);
        grp.add(haloPillar, haloArc);

        // Driver Helmet
        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.20, 12, 12),
            new THREE.MeshStandardMaterial({ color: driver.role === 1 ? 0xffffff : 0xffd100, roughness: 0.2 })
        );
        helmet.position.set(0, 0.72, 0.24);
        grp.add(helmet);

        // Multi-element Front Wing + Endplates
        const fWing = new THREE.Group();
        const fwMain = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.08, 0.52), wingMat);
        fwMain.position.set(0, 0.16, 2.72);
        const fwEndL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.58), wingMat);
        fwEndL.position.set(0.96, 0.26, 2.70);
        const fwEndR = fwEndL.clone();
        fwEndR.position.x = -0.96;
        fWing.add(fwMain, fwEndL, fwEndR);
        grp.add(fWing);

        // Front Suspension Carbon Wishbones (connecting nose to front wheels, clearly visible in T-Cam!)
        const wishL = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.08), carbonMat);
        wishL.position.set(0.52, 0.36, 1.62);
        const wishR = wishL.clone();
        wishR.position.x = -0.52;
        grp.add(wishL, wishR);

        // Rear Wing & Active DRS Flap
        const rSupport = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.54, 0.42), carbonMat);
        rSupport.position.set(0, 0.60, -2.26);
        grp.add(rSupport);

        const drsFlap = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.08, 0.35), wingMat);
        drsFlap.position.set(0, 0.92, -2.30);
        grp.add(drsFlap);

        // Rear Rain / ERS Deployment Light
        const ersMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const ersLed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.08), ersMat);
        ersLed.position.set(0, 0.35, -2.46);
        grp.add(ersLed);

        // 18-Inch Pirelli Wheels & Color-Coded Sidewall Rings
        const compInfo = window.F1Data.tireCompounds[tireCompoundKey] || window.F1Data.tireCompounds.MEDIUM;
        const ringMat = new THREE.MeshBasicMaterial({ color: compInfo.hex });
        const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.38, 16);
        tireGeo.rotateZ(Math.PI / 2);
        const tireMat = new THREE.MeshLambertMaterial({ color: 0x171920 });
        const ringGeo = new THREE.TorusGeometry(0.24, 0.035, 6, 18);
        ringGeo.rotateY(Math.PI / 2);

        const wheels = [];
        [[0.92, 0.36, 1.62], [-0.92, 0.36, 1.62], [0.94, 0.36, -1.62], [-0.94, 0.36, -1.62]].forEach(pos => {
            const wg = new THREE.Group();
            wg.position.set(pos[0], pos[1], pos[2]);
            wg.add(new THREE.Mesh(tireGeo, tireMat));
            const rm = new THREE.Mesh(ringGeo, ringMat);
            rm.position.x = pos[0] > 0 ? 0.195 : -0.195;
            wg.add(rm);
            grp.add(wg);
            wheels.push(wg);
        });

        this.scene.add(grp);
        return { mesh: grp, fWing, drsFlap, ersMat, ringMat, wheels };
    }

    planAiStintStrategy(driver, gridIndex) {
        if (this.weather === 'HEAVY_RAIN') {
            return { startTire: 'WET', nextTire: 'INTER', plannedPitLap: Math.round(this.totalLaps * 0.55) };
        }
        if (this.weather === 'INTER_RAIN') {
            return { startTire: 'INTER', nextTire: 'MEDIUM', plannedPitLap: Math.round(this.totalLaps * 0.50) };
        }
        if (gridIndex < 6) {
            return {
                startTire: 'SOFT',
                nextTire: this.totalLaps >= 20 ? 'HARD' : 'MEDIUM',
                plannedPitLap: Math.max(2, Math.round(this.totalLaps * 0.36))
            };
        } else if (gridIndex < 14) {
            return {
                startTire: 'MEDIUM',
                nextTire: 'HARD',
                plannedPitLap: Math.max(3, Math.round(this.totalLaps * 0.52))
            };
        } else {
            return {
                startTire: 'HARD',
                nextTire: 'SOFT',
                plannedPitLap: Math.max(3, Math.round(this.totalLaps * 0.65))
            };
        }
    }

    spawnCars(gridOrder, playerTeamId, customStartTires) {
        this.cars = [];
        this.playerCar1 = null;
        this.playerCar2 = null;

        const listToSpawn = this.isTestTrackMode
            ? gridOrder.filter(d => d.teamId === playerTeamId).slice(0, 1)
            : gridOrder;

        listToSpawn.forEach((driver, idx) => {
            const team = window.F1Data.teams.find(t => t.id === driver.teamId) || window.F1Data.teams[0];
            const isPlayerTeam = (driver.teamId === playerTeamId);
            const aiPlan = this.planAiStintStrategy(driver, idx);
            const startTire = customStartTires[driver.id] || aiPlan.startTire;

            const startProgress = -((idx + 1) * 0.0046);
            const lateral = this.isTestTrackMode ? 0 : ((idx % 2 === 0) ? -2.8 : 2.8);

            const visual3D = this.create3DCarMesh(team, driver, startTire);

            const car = {
                driver,
                team,
                isPlayerTeam,
                gridPosition: idx + 1,
                position: idx + 1,
                lap: 1,
                lapProgress: (1 + startProgress) % 1,
                totalDistance: startProgress,

                // Physics & Dynamics
                speedKmh: 0,
                rpm: 4200,
                gear: 1,
                throttle: 0,
                brake: 0,
                lateralOffset: lateral,
                lateralVelocity: 0,
                targetLateral: lateral,
                worldX: 0,
                worldZ: 0,
                headingAngle: 0,
                spinAngle: 0,
                spinTimer: 0,

                // Damage & Reliability State
                frontWingHealth: 100.0,
                chassisHealth: 100.0,
                engineHealth: 100.0,
                dnf: false,
                dnfReason: '',
                collisionCooldown: 0,

                // Tires, Fuel & Strategy
                tireCompound: startTire,
                tireHealth: 100.0,
                tireTemp: 90.0,
                tireAgeLaps: 0,
                stintHistory: [startTire],
                fuelKg: +(this.totalLaps * (1.72 / this.fuelMultiplierFormat)).toFixed(1),

                paceMode: 'BALANCED',
                ersBattery: 100.0,
                ersMode: 'BALANCED',
                drsEligible: false,
                drsActive: false,

                // Pit Stop State Machine
                pitRequested: false,
                nextPitTire: aiPlan.nextTire,
                plannedPitLap: aiPlan.plannedPitLap,
                inPitLane: false,
                pitState: 'NONE',
                pitTimer: 0,
                pitStops: 0,
                lastPitDuration: 0,

                // Lap Timing & Sectors
                currentLapTime: 0,
                lastLapTime: 0,
                bestLapTime: 999.9,
                gapToLeader: 0,
                intervalAhead: 0,
                finished: false,
                finishTime: 0,

                visual3D
            };

            this.cars.push(car);
            if (isPlayerTeam && driver.role === 1) this.playerCar1 = car;
            if (isPlayerTeam && driver.role === 2) this.playerCar2 = car;
        });

        this.followedCar = this.playerCar1 || this.cars[0];
        this.syncCarWorldCoordinates(0.016);
    }

    startLightsOutCountdown() {
        this.racePhase = 'COUNTDOWN';
        this.countdownStep = 0;
        const overlay = document.getElementById('fiaStartGantryModal');
        if (overlay) {
            overlay.style.display = 'flex';
            document.querySelectorAll('.fia-gantry-bulb').forEach(b => b.classList.remove('on'));
        }

        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = setInterval(() => {
            if (this.timeScale === 0) return; // Hold countdown while paused on Main Menu
            this.countdownStep++;
            if (this.countdownStep <= 5) {
                const bulb = document.getElementById(`gantryBulb${this.countdownStep}`);
                if (bulb) bulb.classList.add('on');
                window.f1Audio.playStartLight(false);
            } else {
                clearInterval(this.countdownInterval);
                document.querySelectorAll('.fia-gantry-bulb').forEach(b => b.classList.remove('on'));
                setTimeout(() => {
                    if (overlay) overlay.style.display = 'none';
                }, 650);
                window.f1Audio.playStartLight(true);
                window.f1Audio.startEngineSound();
                this.racePhase = 'RACING';
                this.emitEventLog('RACE CONTROL', `🟢 LIGHTS OUT AND AWAY WE GO! ${this.circuit.name} (${this.totalLaps} Laps) 스타트!`);
            }
        }, 600);
    }

    emitEventLog(tag, message) {
        window.f1Audio.playRadioBeep();
        if (typeof this.onRaceEventLog === 'function') {
            this.onRaceEventLog(tag, message);
        }
    }

    spawnImpactParticles(worldX, worldZ, colorHex = 0xffaa00, count = 12) {
        for (let i = 0; i < count; i++) {
            const p = {
                x: worldX,
                y: 0.4,
                z: worldZ,
                vx: (Math.random() - 0.5) * 18,
                vy: 2 + Math.random() * 8,
                vz: (Math.random() - 0.5) * 18,
                life: 0.55 + Math.random() * 0.35,
                colorHex,
                mesh: null
            };
            if (this.hasWebGL && this.particleGroup3D) {
                const m = new THREE.Mesh(
                    new THREE.BoxGeometry(0.22, 0.22, 0.22),
                    new THREE.MeshBasicMaterial({ color: colorHex })
                );
                m.position.set(p.x, p.y, p.z);
                this.particleGroup3D.add(m);
                p.mesh = m;
            }
            this.particles.push(p);
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                if (p.mesh && this.particleGroup3D) this.particleGroup3D.remove(p.mesh);
                this.particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y = Math.max(0.05, p.y + p.vy * dt);
            p.vy -= 19.6 * dt;
            p.z += p.vz * dt;
            if (p.mesh) p.mesh.position.set(p.x, p.y, p.z);
        }
    }

    // Record 5-second Flashback ring buffer
    recordFlashbackSnapshot(dt) {
        this.flashbackRecordTimer += dt;
        if (this.flashbackRecordTimer < 0.5) return;
        this.flashbackRecordTimer = 0;

        const snap = {
            raceElapsedTime: this.raceElapsedTime,
            trackFlag: this.trackFlag,
            flagTimer: this.flagTimer,
            cars: this.cars.map(c => ({
                id: c.driver.id,
                lap: c.lap,
                lapProgress: c.lapProgress,
                totalDistance: c.totalDistance,
                speedKmh: c.speedKmh,
                lateralOffset: c.lateralOffset,
                lateralVelocity: c.lateralVelocity,
                spinTimer: c.spinTimer,
                spinAngle: c.spinAngle,
                frontWingHealth: c.frontWingHealth,
                chassisHealth: c.chassisHealth,
                tireHealth: c.tireHealth,
                tireCompound: c.tireCompound,
                ersBattery: c.ersBattery,
                dnf: c.dnf,
                dnfReason: c.dnfReason
            }))
        };
        this.flashbackHistory.push(snap);
        if (this.flashbackHistory.length > 14) {
            this.flashbackHistory.shift();
        }
    }

    triggerFlashback() {
        if (this.flashbackHistory.length < 2) return false;
        const targetSnap = this.flashbackHistory[0];
        this.flashbackHistory = [];
        this.raceElapsedTime = targetSnap.raceElapsedTime;
        this.trackFlag = 'GREEN';
        this.flagTimer = 0;

        targetSnap.cars.forEach(saved => {
            const car = this.cars.find(c => c.driver.id === saved.id);
            if (!car) return;
            car.lap = saved.lap;
            car.lapProgress = saved.lapProgress;
            car.totalDistance = saved.totalDistance;
            car.speedKmh = saved.speedKmh;
            car.lateralOffset = saved.lateralOffset;
            car.lateralVelocity = saved.lateralVelocity;
            car.spinTimer = 0;
            car.spinAngle = 0;
            car.frontWingHealth = saved.frontWingHealth;
            car.chassisHealth = saved.chassisHealth;
            car.tireHealth = saved.tireHealth;
            car.tireCompound = saved.tireCompound;
            car.ersBattery = saved.ersBattery;
            car.dnf = saved.dnf;
            car.dnfReason = saved.dnfReason;
            car.collisionCooldown = 1.5;
        });

        this.syncCarWorldCoordinates(0.016);
        this.computeLeaderboardAndIntervals();
        this.emitEventLog('FLASHBACK', '⏪ 시점을 5초 전으로 되감았습니다! 브레이킹과 라인을 다시 공략하십시오.');
        return true;
    }

    updateSimulation(rawDt) {
        if (this.timeScale === 0 || this.racePhase === 'RED_FLAG_PAUSED') {
            this.syncCarWorldCoordinates(0.016);
            return;
        }
        const dt = rawDt * this.timeScale;

        if (this.racePhase === 'RACING') {
            this.raceElapsedTime += dt;
            this.recordFlashbackSnapshot(dt);
            this.updateWeatherAndTrackState(dt);
            this.updateAllCarsPhysics(dt);
            if (!this.isTestTrackMode) {
                this.detectAndResolveCollisions(dt);
            }
            this.updateParticles(dt);
            this.computeLeaderboardAndIntervals();
        } else {
            this.syncCarWorldCoordinates(rawDt);
        }

        if (this.followedCar && this.racePhase === 'RACING') {
            window.f1Audio.updateEngineRPM(
                this.followedCar.rpm,
                this.followedCar.throttle,
                this.cameraMode !== 'TV_HELI',
                this.timeScale
            );
        }

        this.uiTickTimer += rawDt;
        if (this.uiTickTimer >= 0.08) {
            this.uiTickTimer = 0;
            if (typeof this.onTelemetryTick === 'function') {
                this.onTelemetryTick(this.getSnapshot());
            }
        }
    }

    updateWeatherAndTrackState(dt) {
        if (this.weather === 'HEAVY_RAIN') {
            this.trackWater = Math.min(1.0, this.trackWater + dt * 0.022);
        } else if (this.weather === 'INTER_RAIN') {
            this.trackWater += (0.38 - this.trackWater) * dt * 0.06;
        } else {
            this.trackWater = Math.max(0.0, this.trackWater - dt * 0.020);
        }

        if (this.trackFlag !== 'GREEN' && this.trackFlag !== 'RED') {
            this.flagTimer -= dt;
            if (this.safetyCar3D) {
                if (this.trackFlag === 'SC') {
                    this.safetyCar3D.visible = true;
                    const leader = this.cars.find(c => c.position === 1 && !c.dnf) || this.cars[0];
                    if (leader) {
                        this.safetyCarProgress = (leader.lapProgress + 0.012) % 1;
                        const scPt = this.sampleTrackAt(this.safetyCarProgress);
                        this.safetyCar3D.position.set(scPt.x, 0, scPt.z);
                        this.safetyCar3D.rotation.y = Math.atan2(scPt.tx, scPt.tz);
                    }
                } else {
                    this.safetyCar3D.visible = false;
                }
            }
            if (this.flagTimer <= 0) {
                this.trackFlag = 'GREEN';
                if (this.safetyCar3D) this.safetyCar3D.visible = false;
                this.emitEventLog('RACE CONTROL', '🟢 SAFETY CAR IN THIS LAP — GREEN FLAG! 레이스가 정상 재개됩니다!');
            }
        }
    }

    triggerSafetyCar(type = 'SC', reason = '') {
        this.trackFlag = type;
        this.flagTimer = 26.0;
        this.emitEventLog('RACE CONTROL', `🟡 ${type === 'SC' ? 'SAFETY CAR DEPLOYED' : 'VIRTUAL SAFETY CAR (VSC)'}! ${reason} 전 구간 추월 금지 및 대열 정렬!`);
    }

    triggerRedFlag(reason = '대형 충돌 사고 및 배리어 수리') {
        if (this.racePhase === 'FINISHED' || this.racePhase === 'RED_FLAG_PAUSED') return;
        this.trackFlag = 'RED';
        this.racePhase = 'RED_FLAG_PAUSED';
        window.f1Audio.stopEngineSound();
        this.computeLeaderboardAndIntervals();

        // Repair front wings in Parc Fermé under Red Flag rules
        this.cars.forEach(c => {
            if (!c.dnf) {
                c.frontWingHealth = 100.0;
                c.speedKmh = 0;
                c.rpm = 4200;
            }
        });

        const leader = this.cars.find(c => c.position === 1) || this.cars[0];
        this.emitEventLog('RACE CONTROL', `🔴 RED FLAG — SESSION SUSPENDED! 사유: ${reason}`);
        if (typeof this.onRedFlagTriggered === 'function') {
            this.onRedFlagTriggered(reason, leader ? leader.lap : 1, this.totalLaps);
        }
    }

    resumeFromRedFlag(tire1, tire2) {
        if (this.playerCar1 && !this.playerCar1.dnf && tire1) {
            this.playerCar1.tireCompound = tire1;
            this.playerCar1.tireHealth = 100.0;
            const cInfo = window.F1Data.tireCompounds[tire1];
            if (this.playerCar1.visual3D && cInfo) this.playerCar1.visual3D.ringMat.color.setHex(cInfo.hex);
        }
        if (this.playerCar2 && !this.playerCar2.dnf && tire2) {
            this.playerCar2.tireCompound = tire2;
            this.playerCar2.tireHealth = 100.0;
            const cInfo = window.F1Data.tireCompounds[tire2];
            if (this.playerCar2.visual3D && cInfo) this.playerCar2.visual3D.ringMat.color.setHex(cInfo.hex);
        }

        // Line up all active cars on the starting grid in current P1..P20 order for Standing Restart
        const activeSorted = [...this.cars].filter(c => !c.dnf).sort((a, b) => a.position - b.position);
        const leaderLap = activeSorted.length ? activeSorted[0].lap : 1;

        activeSorted.forEach((c, idx) => {
            c.lap = leaderLap;
            const gridOffset = -((idx + 1) * 0.0044);
            c.lapProgress = (1 + gridOffset) % 1;
            c.totalDistance = (leaderLap - 1) + gridOffset;
            c.lateralOffset = (idx % 2 === 0) ? -2.8 : 2.8;
            c.lateralVelocity = 0;
            c.speedKmh = 0;
            c.inPitLane = false;
            c.pitState = 'NONE';
            if (!c.isPlayerTeam) {
                c.tireHealth = 100.0;
            }
        });

        this.trackFlag = 'GREEN';
        this.syncCarWorldCoordinates(0.016);
        this.startLightsOutCountdown();
    }

    setTeamOrder(mode) {
        this.teamOrderMode = mode;
        if (mode === 'SWAP' && this.playerCar1 && this.playerCar2 && !this.playerCar1.dnf && !this.playerCar2.dnf) {
            this.emitEventLog('TEAM ORDER', `📻 MULTI-21 발령! 팀메이트 간 포지션 스왑(양보) 지시가 전달되었습니다.`);
        } else if (mode === 'HOLD') {
            this.emitEventLog('TEAM ORDER', `📻 HOLD POSITIONS! 팀메이트 간 무리한 배틀을 금지하고 현재 순위를 유지합니다.`);
        } else {
            this.emitEventLog('TEAM ORDER', `📻 FREE TO RACE! 두 드라이버에게 자율 경쟁이 허용되었습니다.`);
        }
    }

    setRacingLineVisible(visible) {
        this.showRacingLine = !!visible;
        if (this.racingLineMesh) {
            this.racingLineMesh.visible = this.showRacingLine;
        }
    }

    isInsideDrsZone(t) {
        return this.circuit.drsZones.some(z => t >= z[0] && t <= z[1]);
    }

    // Hard-Body Car-to-Car Collision Resolution (Zero Pass-Through!), Front Wing Damage, Spins & DNFs
    detectAndResolveCollisions(dt) {
        for (let i = 0; i < this.cars.length; i++) {
            const c1 = this.cars[i];
            if (c1.finished || c1.dnf || c1.inPitLane) continue;
            if (c1.collisionCooldown > 0) c1.collisionCooldown = Math.max(0, c1.collisionCooldown - dt);

            for (let j = i + 1; j < this.cars.length; j++) {
                const c2 = this.cars[j];
                if (c2.finished || c2.dnf || c2.inPitLane) continue;

                let lapDiff = Math.abs(c1.lapProgress - c2.lapProgress);
                if (lapDiff > 0.5) lapDiff = 1.0 - lapDiff;

                const latDiff = Math.abs(c1.lateralOffset - c2.lateralOffset);
                const minLongitudinalGap = 0.0031; // ~5m car length
                const minLateralGap = 2.05;        // ~2m car width

                // Hard-body physical separation so cars NEVER pass through each other
                if (lapDiff < minLongitudinalGap && latDiff < minLateralGap) {
                    const trailingCar = c1.totalDistance <= c2.totalDistance ? c1 : c2;
                    const leadingCar = trailingCar === c1 ? c2 : c1;

                    if (latDiff < 1.45) {
                        // Nose-to-gearbox longitudinal block: clamp trailing car behind leading car
                        const allowedDist = leadingCar.totalDistance - minLongitudinalGap;
                        if (trailingCar.totalDistance > allowedDist) {
                            trailingCar.totalDistance = allowedDist;
                            trailingCar.lapProgress = ((allowedDist % 1) + 1) % 1;
                            trailingCar.speedKmh = Math.min(trailingCar.speedKmh, leadingCar.speedKmh * 0.96);
                        }
                    } else {
                        // Side-by-side wheel-to-wheel rub: push laterally apart
                        const overlap = (minLateralGap - latDiff) * 0.55;
                        const pushDir = c1.lateralOffset >= c2.lateralOffset ? 1 : -1;
                        c1.lateralOffset += pushDir * overlap;
                        c2.lateralOffset -= pushDir * overlap;
                    }

                    if (c1.collisionCooldown <= 0 && c2.collisionCooldown <= 0) {
                        const relSpeed = Math.abs(c1.speedKmh - c2.speedKmh) + Math.abs(c1.lateralVelocity - c2.lateralVelocity) * 14;
                        c1.collisionCooldown = 1.8;
                        c2.collisionCooldown = 1.8;

                        if (relSpeed > 14) {
                            const wingDmg = Math.min(42, 6 + relSpeed * 0.42);
                            trailingCar.frontWingHealth = Math.max(0, trailingCar.frontWingHealth - wingDmg);
                            trailingCar.chassisHealth = Math.max(0, trailingCar.chassisHealth - wingDmg * 0.45);
                            leadingCar.chassisHealth = Math.max(0, leadingCar.chassisHealth - wingDmg * 0.25);

                            this.spawnImpactParticles(trailingCar.worldX, trailingCar.worldZ, 0xffaa00, 14);
                            if (trailingCar === this.followedCar || leadingCar === this.followedCar) {
                                window.f1Audio.playCrashImpact(0.75);
                            }

                            if (trailingCar.chassisHealth <= 10 || (relSpeed > 56 && Math.random() < 0.24)) {
                                this.retireCar(trailingCar, 'COLLISION DAMAGE (충돌 파손 리타이어)');
                            } else if (relSpeed > 28 && Math.random() < 0.30) {
                                trailingCar.spinTimer = 1.5;
                                window.f1Audio.playTireScreech();
                                this.emitEventLog(trailingCar.driver.code, `💥 ${leadingCar.driver.code} 차량과 휠투휠 충돌로 스핀 및 프론트 윙 손상(잔여 ${Math.round(trailingCar.frontWingHealth)}%)!`);
                                if (trailingCar.frontWingHealth < 65) trailingCar.pitRequested = true;
                            } else if (trailingCar.isPlayerTeam || leadingCar.isPlayerTeam) {
                                this.emitEventLog(trailingCar.driver.code, `⚠️ ${leadingCar.driver.code}와 휠투휠 접촉! 프론트 윙 ${Math.round(trailingCar.frontWingHealth)}%`);
                            }
                        }
                    }
                }
            }
        }
    }

    retireCar(car, reason) {
        if (car.dnf || car.finished) return;
        car.dnf = true;
        car.dnfReason = reason;
        car.speedKmh = 0;
        car.rpm = 0;
        car.lateralOffset = 11.2;
        this.spawnImpactParticles(car.worldX, car.worldZ, 0xef4444, 24);
        this.emitEventLog('RACE CONTROL', `🔴 RETIRED (DNF): #${car.driver.number} ${car.driver.korName} (${car.driver.code}) — 사유: ${reason}`);

        const totalDnfs = this.cars.filter(c => c.dnf).length;
        if (totalDnfs >= 2 && Math.random() < 0.45) {
            this.triggerRedFlag(`${car.driver.code} 대형 사고로 인한 방호벽 복구 및 잔해 청소`);
        } else {
            this.triggerSafetyCar('SC', `${car.driver.code} 리타이어 구난 작업!`);
        }
    }

    updateAllCarsPhysics(dt) {
        let activeCount = 0;

        // Handle Team Orders Swap if active
        if (this.teamOrderMode === 'SWAP' && this.playerCar1 && this.playerCar2 && !this.playerCar1.dnf && !this.playerCar2.dnf) {
            const dDiff = Math.abs(this.playerCar1.totalDistance - this.playerCar2.totalDistance);
            if (dDiff < 0.018) {
                const leadP = this.playerCar1.totalDistance > this.playerCar2.totalDistance ? this.playerCar1 : this.playerCar2;
                leadP.speedKmh *= 0.92;
                leadP.lateralOffset = 4.5;
            }
        }

        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            if (car.finished || car.dnf) continue;
            activeCount++;

            car.currentLapTime += dt;

            // 1. Handle Spin Recovery State
            if (car.spinTimer > 0) {
                car.spinTimer -= dt;
                car.spinAngle += dt * 11.5;
                car.speedKmh = Math.max(45, car.speedKmh - 140 * dt);
                if (car.spinTimer <= 0) {
                    car.spinAngle = 0;
                }
                this.advanceCarAlongSpline(car, dt);
                continue;
            }

            // 2. Handle Pit Lane State Machine
            if (car.inPitLane) {
                this.updateCarPitStopSequence(car, dt);
                continue;
            }

            // 3. Check Pit Entry Trigger near end of lap (t > 0.955)
            if (car.pitRequested && car.lapProgress > 0.955 && car.lap < this.totalLaps) {
                car.inPitLane = true;
                car.pitState = 'ENTERING';
                car.pitTimer = 1.4;
                if (car.isPlayerTeam) {
                    this.emitEventLog(car.driver.code, `🔧 피트 레인 진입 (80km/h 리미터 작동). 피트크루 타이어 및 프론트 윙 대기 완료!`);
                }
                continue;
            }

            const sample = this.sampleTrackAt(car.lapProgress);
            const curvature = sample.curvature;
            const comp = window.F1Data.tireCompounds[car.tireCompound] || window.F1Data.tireCompounds.MEDIUM;

            let aeroSpec = car.team.specs.aero;
            let powerSpec = car.team.specs.powertrain;
            let chasSpec = car.team.specs.chassis;

            if (car.isPlayerTeam && this.playerTuning) {
                const wingAvg = (this.playerTuning.frontWingAngle + this.playerTuning.rearWingAngle) * 0.5;
                aeroSpec = Math.min(105, Math.max(70, aeroSpec + (wingAvg - 6) * 1.4));
                powerSpec = Math.min(105, Math.max(70, powerSpec - (wingAvg - 6) * 1.1));
            }

            const wingDamagePenalty = car.frontWingHealth < 85 ? ((100 - car.frontWingHealth) * 0.35) : 0;
            const aeroFactor = 0.89 + ((aeroSpec - wingDamagePenalty) / 100) * 0.16;
            const powerFactor = 0.90 + (powerSpec / 100) * 0.15;
            const driverFactor = 0.91 + (car.driver.pace / 100) * 0.12;

            let compoundGrip = 1.0 - (comp.paceDelta * 0.011);
            if (this.trackWater > 0.18) {
                if (car.tireCompound === 'SOFT' || car.tireCompound === 'MEDIUM' || car.tireCompound === 'HARD') {
                    compoundGrip *= (1.0 - this.trackWater * 0.44);
                } else if (car.tireCompound === 'INTER') {
                    compoundGrip = this.trackWater > 0.62 ? 0.94 : 1.035;
                } else if (car.tireCompound === 'WET') {
                    compoundGrip = this.trackWater > 0.52 ? 1.045 : 0.95;
                }
            } else if (car.tireCompound === 'INTER' || car.tireCompound === 'WET') {
                compoundGrip *= 0.87;
            }

            if (car.tireHealth < 32) {
                compoundGrip *= (0.80 + (car.tireHealth / 32) * 0.20);
            }

            let paceMult = 1.0;
            let wearMult = 1.0;
            if (car.paceMode === 'ATTACK') {
                paceMult = 1.025;
                wearMult = 1.38;
            } else if (car.paceMode === 'CONSERVE') {
                paceMult = 0.978;
                wearMult = 0.65;
            }

            let ersMult = 1.0;
            if (car.ersMode === 'OVERTAKE' && car.ersBattery > 2 && curvature < 0.20) {
                ersMult = 1.038;
                car.ersBattery = Math.max(0, car.ersBattery - dt * 6.4);
            } else if (car.ersMode === 'HARVEST' || curvature > 0.22) {
                ersMult = car.ersMode === 'HARVEST' ? 0.985 : 1.0;
                car.ersBattery = Math.min(100, car.ersBattery + dt * 4.6);
            } else if (curvature < 0.12 && car.ersBattery > 25) {
                ersMult = 1.012;
                car.ersBattery = Math.max(0, car.ersBattery - dt * 1.6);
            }

            const inDrs = this.isInsideDrsZone(car.lapProgress);
            car.drsEligible = inDrs && (this.isTestTrackMode || (car.position > 1 && car.intervalAhead <= 1.0)) && this.weather === 'DRY' && this.trackFlag === 'GREEN';
            if (!inDrs || this.weather !== 'DRY' || this.trackFlag !== 'GREEN') {
                car.drsActive = false;
            } else if (car.drsEligible && (this.driveControlMode === 'PITWALL' || car !== this.followedCar)) {
                car.drsActive = true;
            }

            const slipstreamBoost = (!this.isTestTrackMode && car.position > 1 && car.intervalAhead < 0.85 && curvature < 0.15) ? 1.022 : 1.0;
            const drsBoost = car.drsActive ? 1.046 : 1.0;

            const cornerSlowdown = Math.min(0.72, Math.max(curvature, sample.aheadCurvature * 0.75) * 1.38);
            const idealCornerSpeed = 342 * (1.0 - cornerSlowdown * (1.06 / aeroFactor));
            let targetSpeed = idealCornerSpeed * powerFactor * driverFactor * compoundGrip * paceMult * ersMult * slipstreamBoost * drsBoost;

            if (this.trackFlag === 'VSC') targetSpeed = Math.min(targetSpeed, 185);
            if (this.trackFlag === 'SC') targetSpeed = Math.min(targetSpeed, 155);

            const isManualCar = (this.driveControlMode === 'MANUAL' && car === this.followedCar && car.isPlayerTeam);
            if (isManualCar) {
                this.updateManualPlayerDriving(car, sample, targetSpeed, dt);
            } else {
                this.updateAiCraftAndLine(car, sample, targetSpeed, dt);
            }

            const prevGear = car.gear;
            car.gear = Math.max(1, Math.min(8, Math.floor((car.speedKmh / 348) * 8) + 1));
            if (car === this.followedCar && car.gear !== prevGear && this.timeScale === 1) {
                window.f1Audio.playGearShift(car.gear > prevGear);
            }
            const gMin = (car.gear - 1) * 42;
            car.rpm = Math.round(9200 + Math.max(0, Math.min(1, (car.speedKmh - gMin) / 48)) * 5600);

            this.advanceCarAlongSpline(car, dt, wearMult, chasSpec, comp);
        }

        this.syncCarWorldCoordinates(dt);

        if (!this.isTestTrackMode) {
            const playerCars = this.cars.filter(c => c.isPlayerTeam);
            const playerDone = playerCars.length > 0 && playerCars.every(c => c.finished || c.dnf);
            if (activeCount === 0 || playerDone) {
                this.completeRaceSession();
            }
        }
    }

    // Manual Driving Physics + Trackside Barrier Scrape/Impact Physics
    updateManualPlayerDriving(car, sample, aiBaseTargetSpeed, dt) {
        const steerInput = (this.keys.left ? 1 : 0) - (this.keys.right ? 1 : 0);
        if (steerInput !== 0) {
            car.lateralVelocity += steerInput * 28.0 * dt;
        } else {
            const lineDiff = sample.idealLateral - car.lateralOffset;
            car.lateralVelocity += lineDiff * 2.2 * dt;
        }
        car.lateralVelocity *= Math.pow(0.08, dt);
        car.lateralOffset += car.lateralVelocity * dt;

        // Hard Wall / Barrier Boundary Bounce & Sparks
        const wallLimit = this.circuit.isStreetCircuit ? 9.4 : 11.2;
        if (Math.abs(car.lateralOffset) > wallLimit) {
            car.lateralOffset = Math.sign(car.lateralOffset) * wallLimit;
            car.lateralVelocity = -car.lateralVelocity * 0.45;
            car.speedKmh *= 0.88;
            if (car.collisionCooldown <= 0) {
                car.collisionCooldown = 1.0;
                car.frontWingHealth = Math.max(0, car.frontWingHealth - 8);
                this.spawnImpactParticles(car.worldX, car.worldZ, 0xffaa00, 10);
                window.f1Audio.playCrashImpact(0.5);
                this.emitEventLog(car.driver.code, `💥 트랙 방호벽(Barrier) 접촉! 프론트 윙 내구도 ${Math.round(car.frontWingHealth)}%`);
            }
        }

        const distFromIdealLine = Math.abs(car.lateralOffset - sample.idealLateral);
        const apexAccuracyBonus = distFromIdealLine < 1.8 ? 1.022 : (distFromIdealLine > 4.8 ? 0.955 : 1.0);

        let manualTargetSpeed = aiBaseTargetSpeed * apexAccuracyBonus;
        if (this.keys.up) {
            manualTargetSpeed *= 1.032;
            car.throttle = 1.0;
            car.brake = 0.0;
        } else if (this.keys.down) {
            manualTargetSpeed *= 0.65;
            car.throttle = 0.0;
            car.brake = 1.0;
        } else {
            car.throttle = manualTargetSpeed >= car.speedKmh ? 0.85 : 0.15;
            car.brake = manualTargetSpeed < car.speedKmh - 18 ? 0.8 : 0.0;
        }

        if (!this.circuit.isStreetCircuit && Math.abs(car.lateralOffset) > 8.8) {
            manualTargetSpeed *= 0.78;
        }

        const rate = manualTargetSpeed > car.speedKmh ? 94 : 175;
        car.speedKmh += Math.sign(manualTargetSpeed - car.speedKmh) * Math.min(Math.abs(manualTargetSpeed - car.speedKmh), rate * dt);
        car.speedKmh = Math.max(68, Math.min(368, car.speedKmh));
    }

    // Pro AI Racecraft: Slipstream Pull-Out, Inside Defensive Line, Late-Braking Divebomb & Side-by-Side Space
    updateAiCraftAndLine(car, sample, targetSpeed, dt) {
        let desiredLat = sample.idealLateral;
        const apexSide = Math.sign(sample.signedTurn || 1);

        let carAheadClose = null;
        let carBehindClose = null;
        let carAlongside = null;

        for (let j = 0; j < this.cars.length; j++) {
            const other = this.cars[j];
            if (other === car || other.finished || other.dnf || other.inPitLane) continue;
            const dDiff = other.totalDistance - car.totalDistance;
            if (Math.abs(dDiff) < 0.0034 && Math.abs(other.lateralOffset - car.lateralOffset) < 3.2) {
                carAlongside = other;
            } else if (dDiff > 0 && dDiff < 0.020) {
                if (!carAheadClose || dDiff < (carAheadClose.totalDistance - car.totalDistance)) {
                    carAheadClose = other;
                }
            } else if (dDiff < 0 && dDiff > -0.012) {
                carBehindClose = other;
            }
        }

        if (carAlongside) {
            // Leave racing room when side-by-side (All the time you have to leave a space!)
            const sepDir = car.lateralOffset >= carAlongside.lateralOffset ? 1 : -1;
            desiredLat = carAlongside.lateralOffset + sepDir * 2.55;
        } else if (carAheadClose) {
            const distAhead = carAheadClose.totalDistance - car.totalDistance;
            if (distAhead < 0.009) {
                // Pull out of slipstream to inside or outside overtaking lane
                const insideCandidate = -apexSide * 4.2;
                if (Math.abs(carAheadClose.lateralOffset - insideCandidate) > 2.2) {
                    desiredLat = insideCandidate;
                } else {
                    desiredLat = carAheadClose.lateralOffset > 0 ? carAheadClose.lateralOffset - 3.6 : carAheadClose.lateralOffset + 3.6;
                }
                if (sample.aheadCurvature > 0.16 && car.driver.racecraft >= 88) {
                    targetSpeed *= 1.018; // Late-braking overtake divebomb
                }
            } else {
                // Tuck into slipstream draft on straight
                if (sample.curvature < 0.10) {
                    desiredLat = carAheadClose.lateralOffset;
                }
            }
        } else if (carBehindClose && sample.aheadCurvature > 0.15 && car.driver.racecraft >= 85) {
            // Defend the inside line approaching braking zone
            desiredLat = -apexSide * 3.8;
        }

        const maxTrackLat = this.circuit.isStreetCircuit ? 7.6 : 8.5;
        car.targetLateral = Math.max(-maxTrackLat, Math.min(maxTrackLat, desiredLat));
        car.lateralOffset += (car.targetLateral - car.lateralOffset) * Math.min(1, dt * 5.2);

        const rate = targetSpeed > car.speedKmh ? 88 : 165;
        car.throttle = targetSpeed >= car.speedKmh ? 1.0 : 0.12;
        car.brake = targetSpeed < car.speedKmh - 15 ? 1.0 : 0.0;
        car.speedKmh += Math.sign(targetSpeed - car.speedKmh) * Math.min(Math.abs(targetSpeed - car.speedKmh), rate * dt);
        car.speedKmh = Math.max(72, Math.min(364, car.speedKmh));
    }

    updateCarPitStopSequence(car, dt) {
        if (car.pitState === 'ENTERING') {
            car.speedKmh = 80;
            car.rpm = 5800;
            car.gear = 2;
            car.pitTimer -= dt;
            car.lapProgress = (car.lapProgress + 0.006 * dt) % 1;
            car.totalDistance += 0.006 * dt;
            if (car.pitTimer <= 0) {
                car.pitState = 'BOX_STOPPED';
                const crewBonus = (car.team.specs.durability - 80) * 0.035;
                const wingRepairTime = car.frontWingHealth < 85 ? 2.8 : 0.0;
                car.lastPitDuration = +(Math.max(1.95, 2.65 - crewBonus + (Math.random() - 0.5) * 0.25) + wingRepairTime).toFixed(2);
                car.pitTimer = car.lastPitDuration;
                if (car.isPlayerTeam) {
                    window.f1Audio.playPitWheelGun();
                }
            }
        } else if (car.pitState === 'BOX_STOPPED') {
            car.speedKmh = 0;
            car.rpm = 4100;
            car.gear = 1;
            car.pitTimer -= dt;
            if (car.pitTimer <= 0) {
                car.tireCompound = car.nextPitTire;
                car.tireHealth = 100.0;
                car.tireTemp = 86.0;
                car.tireAgeLaps = 0;
                car.frontWingHealth = 100.0;
                car.pitStops++;
                car.stintHistory.push(car.tireCompound);
                car.pitRequested = false;

                const compInfo = window.F1Data.tireCompounds[car.tireCompound];
                if (car.visual3D && car.visual3D.ringMat && compInfo) {
                    car.visual3D.ringMat.color.setHex(compInfo.hex);
                }
                car.pitState = 'EXITING';
                car.pitTimer = 1.1;
                if (car.isPlayerTeam) {
                    this.emitEventLog(car.driver.code, `🟢 피트스톱 정지 시간 ${car.lastPitDuration}초! [${compInfo.name}] 장착 및 윙 점검 완료, 트랙 합류!`);
                }
            }
        } else if (car.pitState === 'EXITING') {
            car.speedKmh = 80;
            car.rpm = 6200;
            car.gear = 2;
            car.pitTimer -= dt;
            car.lapProgress = (car.lapProgress + 0.008 * dt) % 1;
            car.totalDistance += 0.008 * dt;
            if (car.pitTimer <= 0) {
                car.inPitLane = false;
                car.pitState = 'NONE';
            }
        }
    }

    advanceCarAlongSpline(car, dt, wearMult = 1.0, chasSpec = 90, comp = window.F1Data.tireCompounds.MEDIUM) {
        const lapAdvance = ((car.speedKmh * 0.27778) / 1450) * dt;
        car.lapProgress += lapAdvance;
        car.totalDistance += lapAdvance;

        const chasSave = 1.14 - (chasSpec / 100) * 0.24;
        const drvSave = 1.12 - (car.driver.tireMgmt / 100) * 0.22;
        const wearPerLapActual = comp.baseWearPerLap * this.circuit.tireWearRate * this.wearMultiplierFormat * wearMult * chasSave * drvSave;
        car.tireHealth = Math.max(0, car.tireHealth - wearPerLapActual * lapAdvance);
        car.fuelKg = Math.max(0.2, car.fuelKg - 1.65 * lapAdvance);

        const targetTemp = comp.optimalTemp + (car.paceMode === 'ATTACK' ? 8 : (car.paceMode === 'CONSERVE' ? -6 : 0)) - (this.trackWater * 22);
        car.tireTemp += (targetTemp - car.tireTemp) * dt * 0.6;

        if (car.lapProgress >= 1.0) {
            car.lapProgress -= 1.0;
            car.tireAgeLaps++;

            const simulatedLapSec = +(this.circuit.baseLapTime * (0.97 + (100 - car.team.specs.aero) * 0.0015) * (0.98 + (100 - car.tireHealth) * 0.0005) + (Math.random() - 0.5) * 0.26).toFixed(3);
            car.lastLapTime = simulatedLapSec;
            if (simulatedLapSec < car.bestLapTime) {
                car.bestLapTime = simulatedLapSec;
            }
            car.currentLapTime = 0;

            if (!this.isTestTrackMode && !car.isPlayerTeam && car.lap < this.totalLaps) {
                this.evaluateAutonomousAiPitStrategy(car);
            } else if (!this.isTestTrackMode && car.isPlayerTeam && (car.tireHealth < 30 || car.frontWingHealth < 70) && !car.pitRequested && car.lap < this.totalLaps) {
                this.emitEventLog(car.driver.code, `⚠️ 타이어 수명(${Math.round(car.tireHealth)}%) 또는 프론트 윙(${Math.round(car.frontWingHealth)}%) 점검 필요! [BOX THIS LAP] 호출을 권장합니다.`);
            }

            if (!this.isTestTrackMode && car.lap >= this.totalLaps) {
                car.finished = true;
                car.finishTime = this.raceElapsedTime;
                if (car.isPlayerTeam) {
                    this.emitEventLog(car.driver.code, `🏁 체커기 통과! P${car.position} 완주!`);
                }
            } else {
                car.lap++;
            }
        }
    }

    evaluateAutonomousAiPitStrategy(car) {
        if (car.pitRequested) return;
        const lapsRemaining = this.totalLaps - car.lap;
        if (lapsRemaining <= 1) return;

        if (car.frontWingHealth < 68) {
            car.pitRequested = true;
            car.nextPitTire = lapsRemaining <= Math.round(this.totalLaps * 0.30) ? 'SOFT' : 'HARD';
            return;
        }

        if (this.trackWater > 0.55 && car.tireCompound !== 'WET') {
            car.pitRequested = true;
            car.nextPitTire = 'WET';
            return;
        }
        if (this.trackWater > 0.22 && this.trackWater <= 0.55 && car.tireCompound !== 'INTER') {
            car.pitRequested = true;
            car.nextPitTire = 'INTER';
            return;
        }
        if (this.trackWater < 0.14 && (car.tireCompound === 'INTER' || car.tireCompound === 'WET')) {
            car.pitRequested = true;
            car.nextPitTire = lapsRemaining <= Math.round(this.totalLaps * 0.32) ? 'SOFT' : 'MEDIUM';
            return;
        }

        if (this.trackFlag !== 'GREEN' && car.tireHealth < 62 && lapsRemaining >= 3) {
            car.pitRequested = true;
            car.nextPitTire = lapsRemaining <= Math.round(this.totalLaps * 0.35) ? 'SOFT' : 'HARD';
            return;
        }

        const inPitWindow = Math.abs(car.lap - car.plannedPitLap) <= 2;
        if ((inPitWindow && car.intervalAhead > 0.3 && car.intervalAhead < 1.4 && car.tireHealth < 58) || car.tireHealth < 33) {
            car.pitRequested = true;
            if (lapsRemaining <= Math.round(this.totalLaps * 0.30)) {
                car.nextPitTire = 'SOFT';
            } else if (car.tireCompound === 'SOFT') {
                car.nextPitTire = 'HARD';
            } else {
                car.nextPitTire = 'MEDIUM';
            }
        }
    }

    syncCarWorldCoordinates(dt) {
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            const s = this.sampleTrackAt(car.lapProgress);
            const lat = car.inPitLane ? -16.0 : car.lateralOffset;

            car.worldX = s.x + s.nx * lat;
            car.worldZ = s.z + s.nz * lat;
            car.headingAngle = Math.atan2(s.tx, s.tz) + (car.spinAngle || 0);

            if (this.hasWebGL && car.visual3D) {
                car.visual3D.mesh.position.set(car.worldX, 0, car.worldZ);
                car.visual3D.mesh.rotation.y = car.headingAngle;
                car.visual3D.drsFlap.rotation.x = car.drsActive ? -0.42 : 0.0;
                car.visual3D.fWing.visible = !car.dnf;
                car.visual3D.ersMat.color.setHex(car.ersMode === 'OVERTAKE' ? 0x00ff66 : 0xff0033);
                const wSpin = (car.speedKmh * 0.12) * dt;
                car.visual3D.wheels.forEach(w => { w.rotation.x += wSpin; });
            }
        }
    }

    computeLeaderboardAndIntervals() {
        const sorted = [...this.cars].sort((a, b) => {
            if (a.dnf && !b.dnf) return 1;
            if (!a.dnf && b.dnf) return -1;
            if (a.finished && b.finished) return a.finishTime - b.finishTime;
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.totalDistance - a.totalDistance;
        });

        const leader = sorted[0];
        sorted.forEach((car, idx) => {
            car.position = idx + 1;
            if (idx === 0 || car.dnf) {
                car.gapToLeader = 0;
                car.intervalAhead = 0;
            } else {
                const ahead = sorted[idx - 1];
                car.gapToLeader = +((leader.totalDistance - car.totalDistance) * (this.circuit.baseLapTime * 0.62)).toFixed(3);
                car.intervalAhead = +((ahead.totalDistance - car.totalDistance) * (this.circuit.baseLapTime * 0.62)).toFixed(3);
            }
        });
    }

    renderScene() {
        if (this.hasWebGL && this.renderer && this.scene && this.camera) {
            this.update3DCamera();
            this.renderer.render(this.scene, this.camera);
        } else if (this.fallbackCtx && this.fallbackCanvas) {
            this.renderFallback2DTrackCamera();
        }
    }

    update3DCamera() {
        const fc = this.followedCar || this.cars[0];
        if (!fc) return;
        const s = this.sampleTrackAt(fc.lapProgress);
        const dirX = Math.sin(fc.headingAngle);
        const dirZ = Math.cos(fc.headingAngle);

        if (this.cameraMode === 'CHASE') {
            this.camera.position.set(
                fc.worldX - dirX * 9.8,
                3.6,
                fc.worldZ - dirZ * 9.8
            );
            this.camera.lookAt(fc.worldX + dirX * 16, 0.9, fc.worldZ + dirZ * 16);
        } else if (this.cameraMode === 'T_CAM') {
            // Broadcast T-Cam Onboard View (matching Image 5): mounted above roll-hoop looking over Halo, nose, front wheels & track!
            this.camera.position.set(
                fc.worldX - dirX * 0.35,
                1.36,
                fc.worldZ - dirZ * 0.35
            );
            this.camera.lookAt(fc.worldX + dirX * 26, 0.45, fc.worldZ + dirZ * 26);
        } else if (this.cameraMode === 'COCKPIT') {
            // Helmet Eye-Level Cockpit View
            this.camera.position.set(
                fc.worldX + dirX * 0.18,
                0.96,
                fc.worldZ + dirZ * 0.18
            );
            this.camera.lookAt(fc.worldX + dirX * 28, 0.62, fc.worldZ + dirZ * 28);
        } else {
            // TV Helicopter Broadcast View
            this.camera.position.set(
                fc.worldX - s.tx * 28 + 20,
                34,
                fc.worldZ - s.tz * 28 + 16
            );
            this.camera.lookAt(fc.worldX + s.tx * 8, 0, fc.worldZ + s.tz * 8);
        }
    }

    renderFallback2DTrackCamera() {
        const ctx = this.fallbackCtx;
        const w = this.fallbackCanvas.width;
        const h = this.fallbackCanvas.height;
        const fc = this.followedCar || this.cars[0];
        if (!fc || !this.trackPoints2D.length) return;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(2.8, 2.8);
        ctx.translate(-fc.worldX, -fc.worldZ);

        // Draw Barrier Walls
        ctx.beginPath();
        this.trackPoints2D.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.z);
            else ctx.lineTo(p.x, p.z);
        });
        ctx.closePath();
        ctx.lineWidth = 26;
        ctx.strokeStyle = '#e10600';
        ctx.stroke();

        // Draw Bright Grey Track Asphalt
        ctx.lineWidth = 21;
        ctx.strokeStyle = '#525d70';
        ctx.stroke();

        // Draw Ideal Racing Line
        ctx.beginPath();
        this.trackPoints2D.forEach((p, idx) => {
            const lx = p.x + p.nx * p.idealLateral;
            const lz = p.z + p.nz * p.idealLateral;
            if (idx === 0) ctx.moveTo(lx, lz);
            else ctx.lineTo(lx, lz);
        });
        ctx.closePath();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = 'rgba(34,197,94,0.8)';
        ctx.stroke();

        this.cars.forEach(c => {
            ctx.save();
            ctx.translate(c.worldX, c.worldZ);
            ctx.rotate(-c.headingAngle);
            ctx.fillStyle = c.dnf ? '#475569' : c.team.primaryColor;
            ctx.fillRect(-1.2, -2.6, 2.4, 5.2);
            ctx.restore();
        });

        ctx.restore();
    }

    // Official F1 Broadcast 2D Circuit Map: Sector 1 (Pink), Sector 2 (Yellow), Sector 3 (Blue) + Turn Numbers (matching Image 1!)
    render2DCircuitMap() {
        const ctx = this.map2dCtx;
        const canvas = this.map2dCanvas;
        if (!ctx || !canvas || !this.trackPoints2D.length) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const b = this.bounds2D;
        const spanX = Math.max(180, b.maxX - b.minX);
        const spanZ = Math.max(180, b.maxZ - b.minZ);
        const midX = (b.minX + b.maxX) * 0.5;
        const midZ = (b.minZ + b.maxZ) * 0.5;

        const pad = 26;
        const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanZ);
        const cx = w * 0.5;
        const cy = h * 0.5;
        const total = this.trackPoints2D.length;

        // 1. Track White Outer Outline
        ctx.beginPath();
        this.trackPoints2D.forEach((p, idx) => {
            const sx = cx + (p.x - midX) * scale;
            const sy = cy + (p.z - midZ) * scale;
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.lineWidth = 8.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.stroke();

        // 2. Draw Sector 1 (Pink/Red #ec4899), Sector 2 (Yellow #facc15), Sector 3 (Cyan/Blue #06b6d4) like Image 1
        const sectors = [
            { start: 0, end: Math.floor(total * 0.33), color: '#f43f5e' },
            { start: Math.floor(total * 0.33), end: Math.floor(total * 0.67), color: '#facc15' },
            { start: Math.floor(total * 0.67), end: total, color: '#06b6d4' }
        ];
        sectors.forEach(sec => {
            ctx.beginPath();
            for (let i = sec.start; i <= sec.end; i++) {
                const p = this.trackPoints2D[i % total];
                const sx = cx + (p.x - midX) * scale;
                const sy = cy + (p.z - midZ) * scale;
                if (i === sec.start) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            ctx.lineWidth = 4.2;
            ctx.strokeStyle = this.trackFlag === 'RED' ? '#ef4444' : sec.color;
            ctx.stroke();
        });

        // 3. Highlight DRS Zones in Bright Green Outer Band
        this.circuit.drsZones.forEach(zone => {
            ctx.beginPath();
            const startIdx = Math.floor(zone[0] * total);
            const endIdx = Math.floor(zone[1] * total);
            for (let i = startIdx; i <= endIdx; i++) {
                const p = this.trackPoints2D[i % total];
                const sx = cx + (p.x + p.nx * 14 - midX) * scale;
                const sy = cy + (p.z + p.nz * 14 - midZ) * scale;
                if (i === startIdx) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#22c55e';
            ctx.stroke();
        });

        // 4. Turn Number Badges (T1, T6, T10, T15) around the silhouette
        [
            { idx: Math.floor(total * 0.08), label: '1' },
            { idx: Math.floor(total * 0.28), label: '6' },
            { idx: Math.floor(total * 0.52), label: '10' },
            { idx: Math.floor(total * 0.78), label: '15' }
        ].forEach(tn => {
            const p = this.trackPoints2D[tn.idx % total];
            const bx = cx + (p.x + p.nx * 24 - midX) * scale;
            const by = cy + (p.z + p.nz * 24 - midZ) * scale;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tn.label, bx, by);
        });
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // 5. Start/Finish Checkered Line Marker
        const s0 = this.trackPoints2D[0];
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx + (s0.x - midX) * scale - 5, cy + (s0.z - midZ) * scale - 5, 10, 10);
        ctx.strokeStyle = '#e10600';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx + (s0.x - midX) * scale - 5, cy + (s0.z - midZ) * scale - 5, 10, 10);

        // 6. Draw All 20 Live Cars
        for (let i = this.cars.length - 1; i >= 0; i--) {
            const c = this.cars[i];
            const sx = cx + (c.worldX - midX) * scale;
            const sy = cy + (c.worldZ - midZ) * scale;
            c.mapScreenX = sx;
            c.mapScreenY = sy;

            const isFollowed = (c === this.followedCar);
            const radius = isFollowed ? 6.5 : (c.isPlayerTeam ? 5.5 : 4.0);

            ctx.beginPath();
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.fillStyle = c.dnf ? '#64748b' : c.team.primaryColor;
            ctx.fill();
            ctx.lineWidth = isFollowed ? 2.2 : 1.0;
            ctx.strokeStyle = isFollowed ? '#ffffff' : '#090b10';
            ctx.stroke();

            if (c.isPlayerTeam || isFollowed || c.position <= 3) {
                ctx.fillStyle = c.dnf ? '#ef4444' : '#ffffff';
                ctx.font = 'bold 9px "JetBrains Mono", monospace';
                ctx.fillText(c.dnf ? `${c.driver.code}(DNF)` : c.driver.code, sx + 7, sy + 3);
            }
        }
    }

    // Controls API
    cycleCameraMode() {
        const order = ['CHASE', 'T_CAM', 'COCKPIT', 'TV_HELI'];
        this.cameraMode = order[(order.indexOf(this.cameraMode) + 1) % order.length];
        return this.cameraMode;
    }

    setCameraMode(mode) {
        if (['CHASE', 'T_CAM', 'COCKPIT', 'TV_HELI'].includes(mode)) {
            this.cameraMode = mode;
        }
        return this.cameraMode;
    }

    setFollowedDriver(driverId) {
        const found = this.cars.find(c => c.driver.id === driverId);
        if (found) this.followedCar = found;
    }

    setCarCommands(driverId, paceMode, ersMode) {
        const car = this.cars.find(c => c.driver.id === driverId);
        if (!car) return;
        if (paceMode) car.paceMode = paceMode;
        if (ersMode) car.ersMode = ersMode;
    }

    setNextPitCompound(driverId, compoundKey) {
        const car = this.cars.find(c => c.driver.id === driverId);
        if (car) car.nextPitTire = compoundKey;
    }

    togglePitCall(driverId) {
        const car = this.cars.find(c => c.driver.id === driverId);
        if (!car || car.finished || car.dnf) return;
        car.pitRequested = !car.pitRequested;
        if (car.pitRequested) {
            this.emitEventLog(car.driver.code, `📻 BOX, BOX! 이번 랩 종료 시 피트인하여 [${window.F1Data.tireCompounds[car.nextPitTire].name}] 장착 및 프론트 윙 점검을 수행합니다.`);
        } else {
            this.emitEventLog(car.driver.code, `📻 STAY OUT! 피트인 호출을 취소하고 트랙에 남습니다.`);
        }
    }

    manualToggleDrs() {
        if (!this.followedCar) return;
        if (this.followedCar.drsEligible) {
            this.followedCar.drsActive = !this.followedCar.drsActive;
            if (this.followedCar.drsActive) window.f1Audio.playDrsBeep();
        }
    }

    completeRaceSession() {
        if (this.racePhase === 'FINISHED') return;
        this.racePhase = 'FINISHED';
        window.f1Audio.stopEngineSound();
        this.computeLeaderboardAndIntervals();
        const ordered = [...this.cars].sort((a, b) => a.position - b.position);
        if (typeof this.onRaceCompleted === 'function') {
            this.onRaceCompleted(ordered);
        }
    }

    computeProximityForCar(targetCar) {
        const prox = { left: false, right: false, aheadClose: false, rear: false };
        if (!targetCar || targetCar.dnf) return prox;
        for (let i = 0; i < this.cars.length; i++) {
            const other = this.cars[i];
            if (other === targetCar || other.dnf || other.inPitLane) continue;
            const dDiff = other.totalDistance - targetCar.totalDistance;
            const latDiff = other.lateralOffset - targetCar.lateralOffset;
            if (Math.abs(dDiff) < 0.0042) {
                if (latDiff > 0.5 && latDiff < 4.5) prox.left = true;
                if (latDiff < -0.5 && latDiff > -4.5) prox.right = true;
            }
            if (dDiff > 0 && dDiff < 0.011 && Math.abs(latDiff) < 2.6) prox.aheadClose = true;
            if (dDiff < 0 && dDiff > -0.009 && Math.abs(latDiff) < 2.8) prox.rear = true;
        }
        return prox;
    }

    getSnapshot() {
        const sorted = [...this.cars].sort((a, b) => a.position - b.position);
        const fc = this.followedCar || this.playerCar1 || sorted[0];
        return {
            phase: this.racePhase,
            isTestTrackMode: this.isTestTrackMode,
            lap: sorted.length ? sorted[0].lap : 1,
            totalLaps: this.totalLaps,
            trackFlag: this.trackFlag,
            weather: this.weather,
            trackWater: Math.round(this.trackWater * 100),
            trackTemp: Math.round(this.trackTemp),
            timeScale: this.timeScale,
            cameraMode: this.cameraMode,
            driveControlMode: this.driveControlMode,
            teamOrderMode: this.teamOrderMode,
            proximity: this.computeProximityForCar(fc),
            standings: sorted,
            playerCar1: this.playerCar1,
            playerCar2: this.playerCar2,
            followedCar: fc
        };
    }
}

window.F1LiveRaceEngine = F1LiveRaceEngine;
