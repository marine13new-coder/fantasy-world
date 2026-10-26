// ============================================================================
// F1 MANAGER & 3D GRAND PRIX SIMULATOR - REALISTIC PHYSICS, COLLISION DAMAGE,
// SPIN/DNF, PIT LANE ENTRY/BOX STOP, IDEAL RACING LINE & REGIONAL BIOME ENGINE
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

        // Modes & Settings
        this.cameraMode = 'CHASE';        // 'CHASE', 'COCKPIT', 'TV_HELI'
        this.driveControlMode = 'MANUAL'; // 'MANUAL' (Player drives followed car) or 'PITWALL' (Full AI + Strategy commands)
        this.raceFormat = 'FULL';         // 'FULL' (100% Real FIA Laps), 'HALF', 'SPRINT', 'QUICK'
        this.isTestTrackMode = false;     // Shakedown Bench Mode (1 Car Telemetry Testing)

        // Race State
        this.isRunning = false;
        this.racePhase = 'PRE_RACE'; // 'COUNTDOWN', 'RACING', 'FINISHED'
        this.timeScale = 1.0;        // 0, 1, 2, 4, 8
        this.totalLaps = 57;
        this.raceElapsedTime = 0;

        // Track Status & Weather
        this.trackFlag = 'GREEN';    // 'GREEN', 'YELLOW', 'VSC', 'SC'
        this.flagTimer = 0;
        this.weather = 'DRY';        // 'DRY', 'INTER_RAIN', 'HEAVY_RAIN'
        this.trackWater = 0.0;
        this.trackTemp = 35.0;

        // Keyboard Inputs
        this.keys = { up: false, down: false, left: false, right: false, ers: false };

        // Callbacks
        this.onTelemetryTick = null;
        this.onRaceEventLog = null;
        this.onRaceCompleted = null;

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
                this.scene.background = new THREE.Color(0x0b0f17);
                this.scene.fog = new THREE.FogExp2(0x0b0f17, 0.0010);

                this.camera = new THREE.PerspectiveCamera(60, w / h, 0.4, 2600);
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
            // Ignore shortcuts if typing in an input
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
                    this.cycleCameraMode();
                    break;
                case 'KeyB':
                    if (this.followedCar && this.followedCar.isPlayerTeam) {
                        this.togglePitCall(this.followedCar.driver.id);
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
            const apexSide = Math.sign(signedTurn); // +1 or -1
            let idealLateral = 0;
            if (curvature > 0.14) {
                idealLateral = -apexSide * Math.min(6.2, curvature * 11.0); // Clip inside apex
            } else if (aheadDiff > 0.18) {
                idealLateral = apexSide * 4.5; // Set up wide on entry
            }

            // Ideal Speed at this point (km/h)
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
        this.timeScale = 1.0;
        this.raceElapsedTime = 0;
        this.trackFlag = 'GREEN';
        this.flagTimer = 0;
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

    // Build Track Ribbon + Ideal Racing Line Chevrons + Pit Lane + Regional Biome Scenery
    build3DEnvironmentAndBiome() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        const skyHex = this.weather !== 'DRY' ? 0x18202c : this.circuit.skyColor;
        this.scene.background = new THREE.Color(skyHex);
        this.scene.fog = new THREE.FogExp2(skyHex, this.weather === 'HEAVY_RAIN' ? 0.0018 : 0.00085);

        const amb = new THREE.AmbientLight(0xffffff, this.circuit.timeOfDay === 'night' ? 0.65 : 0.80);
        this.scene.add(amb);

        const sun = new THREE.DirectionalLight(
            this.circuit.timeOfDay === 'sunset' ? 0xffa86b : 0xfff8eb,
            this.circuit.timeOfDay === 'night' ? 0.95 : 1.25
        );
        sun.position.set(180, 310, 150);
        sun.castShadow = true;
        this.scene.add(sun);

        // Ground Terrain Plane
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(2800, 2800),
            new THREE.MeshStandardMaterial({ color: this.circuit.groundColor, roughness: 0.90 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.18;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const n = this.trackPoints2D.length;
        const halfW = 10.5;
        const kerbW = 1.7;

        const roadPos = [];
        const roadIdx = [];
        const kerbPos = [];
        const kerbCol = [];
        const kerbIdx = [];
        const linePos = [];
        const lineCol = [];
        const lineIdx = [];

        for (let i = 0; i <= n; i++) {
            const p = this.trackPoints2D[i % n];
            const lx = p.x + p.nx * halfW;
            const lz = p.z + p.nz * halfW;
            const rx = p.x - p.nx * halfW;
            const rz = p.z - p.nz * halfW;

            roadPos.push(lx, 0.02, lz, rx, 0.02, rz);

            // FIA Kerbs
            const lkx = p.x + p.nx * (halfW + kerbW);
            const lkz = p.z + p.nz * (halfW + kerbW);
            const rkx = p.x - p.nx * (halfW + kerbW);
            const rkz = p.z - p.nz * (halfW + kerbW);

            kerbPos.push(lkx, 0.05, lkz, lx, 0.04, lz, rx, 0.04, rz, rkx, 0.05, rkz);
            const isRed = (i % 2 === 0);
            const c = isRed ? [0.88, 0.06, 0.08] : [0.95, 0.96, 0.98];
            for (let k = 0; k < 4; k++) kerbCol.push(c[0], c[1], c[2]);

            // Dynamic Ideal Racing Line Ribbon (Green = Full Throttle, Yellow = Lift, Red = Heavy Braking Zone)
            const ilx = p.x + p.nx * (p.idealLateral + 0.55);
            const ilz = p.z + p.nz * (p.idealLateral + 0.55);
            const irx = p.x + p.nx * (p.idealLateral - 0.55);
            const irz = p.z + p.nz * (p.idealLateral - 0.55);
            linePos.push(ilx, 0.045, ilz, irx, 0.045, irz);

            let lc = [0.0, 0.9, 0.4]; // Green full throttle
            if (p.aheadCurvature > 0.22 || p.curvature > 0.24) {
                lc = [0.95, 0.12, 0.12]; // Red heavy braking zone
            } else if (p.aheadCurvature > 0.12 || p.curvature > 0.13) {
                lc = [0.98, 0.80, 0.08]; // Yellow medium speed apex
            }
            lineCol.push(lc[0], lc[1], lc[2], lc[0], lc[1], lc[2]);

            if (i < n) {
                const rb = i * 2;
                roadIdx.push(rb, rb + 1, rb + 2, rb + 1, rb + 3, rb + 2);
                lineIdx.push(rb, rb + 1, rb + 2, rb + 1, rb + 3, rb + 2);
                const kb = i * 4;
                kerbIdx.push(kb, kb + 1, kb + 4, kb + 1, kb + 5, kb + 4);
                kerbIdx.push(kb + 2, kb + 3, kb + 6, kb + 3, kb + 7, kb + 6);
            }
        }

        // Asphalt Mesh
        const roadGeo = new THREE.BufferGeometry();
        roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
        roadGeo.setIndex(roadIdx);
        roadGeo.computeVertexNormals();
        const roadMesh = new THREE.Mesh(
            roadGeo,
            new THREE.MeshStandardMaterial({
                color: 0x1b1f28,
                roughness: this.weather === 'DRY' ? 0.76 : 0.22,
                metalness: this.weather === 'DRY' ? 0.12 : 0.55
            })
        );
        roadMesh.receiveShadow = true;
        this.scene.add(roadMesh);

        // Ideal Racing Line Mesh
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
        lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineCol, 3));
        lineGeo.setIndex(lineIdx);
        const lineMesh = new THREE.Mesh(
            lineGeo,
            new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 })
        );
        this.scene.add(lineMesh);

        // Kerbs Mesh
        const kerbGeo = new THREE.BufferGeometry();
        kerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(kerbPos, 3));
        kerbGeo.setAttribute('color', new THREE.Float32BufferAttribute(kerbCol, 3));
        kerbGeo.setIndex(kerbIdx);
        kerbGeo.computeVertexNormals();
        this.scene.add(new THREE.Mesh(kerbGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })));

        // Dedicated Pit Lane Asphalt Strip alongside Start/Finish Straight (t = 0.94 -> 0.06)
        this.buildPitLaneAndGarages(halfW);

        // Regional Biome Landmarks & Trackside Environment
        this.buildRegionalBiomeScenery(halfW);

        this.particleGroup3D = new THREE.Group();
        this.scene.add(this.particleGroup3D);
    }

    buildPitLaneAndGarages(halfW) {
        const s0 = this.trackPoints2D[0];
        const angle = Math.atan2(s0.tx, s0.tz);
        const gantry = new THREE.Group();
        gantry.position.set(s0.x, 0, s0.z);
        gantry.rotation.y = angle;

        // Start/Finish Checkered Line
        const startLine = new THREE.Mesh(
            new THREE.PlaneGeometry(halfW * 2, 3.2),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.y = 0.06;
        gantry.add(startLine);

        // Pit Lane Road Surface
        const pitRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(8.5, 115),
            new THREE.MeshStandardMaterial({ color: 0x252c3d, roughness: 0.65 })
        );
        pitRoad.rotation.x = -Math.PI / 2;
        pitRoad.position.set(-(halfW + 5.8), 0.03, -12);
        gantry.add(pitRoad);

        // Pit Wall Barrier separating Track and Pit Lane
        const pitWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1.4, 96),
            new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
        );
        pitWall.position.set(-(halfW + 1.4), 0.7, -12);
        gantry.add(pitWall);

        // 10 Constructor Pit Boxes & Garages Building
        const pitBldg = new THREE.Mesh(
            new THREE.BoxGeometry(12, 11, 102),
            new THREE.MeshStandardMaterial({ color: 0x131824, roughness: 0.35 })
        );
        pitBldg.position.set(-(halfW + 16), 5.5, -12);
        gantry.add(pitBldg);

        // Team Color Garage Bays + Pit Stop Box Markings
        window.F1Data.teams.forEach((t, idx) => {
            const zPos = -54 + idx * 9.5;
            const bay = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 3.6, 7.8),
                new THREE.MeshBasicMaterial({ color: t.carHex })
            );
            bay.position.set(-(halfW + 9.8), 2.2, zPos);
            gantry.add(bay);

            const boxMark = new THREE.Mesh(
                new THREE.PlaneGeometry(3.6, 5.8),
                new THREE.MeshBasicMaterial({ color: t.wingHex })
            );
            boxMark.rotation.x = -Math.PI / 2;
            boxMark.position.set(-(halfW + 6.2), 0.05, zPos);
            gantry.add(boxMark);
        });

        // Overhead Start Gantry Bridge
        const arch = new THREE.Mesh(
            new THREE.BoxGeometry((halfW + 2.5) * 2, 1.6, 1.6),
            new THREE.MeshStandardMaterial({ color: 0xe10600 })
        );
        arch.position.set(0, 9.0, 0);
        gantry.add(arch);

        const pL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 9.2, 1.1), new THREE.MeshStandardMaterial({ color: 0x111827 }));
        pL.position.set(halfW + 2, 4.6, 0);
        const pR = pL.clone();
        pR.position.set(-(halfW + 2), 4.6, 0);
        gantry.add(pL, pR);

        this.scene.add(gantry);
    }

    buildRegionalBiomeScenery(halfW) {
        const biome = this.circuit.biome || 'MODERN_AUTODROME';
        const n = this.trackPoints2D.length;

        const poleGeo = new THREE.CylinderGeometry(0.22, 0.32, 15, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const headGeo = new THREE.BoxGeometry(2.2, 0.5, 1.0);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
        const standGeo = new THREE.BoxGeometry(11, 7.5, 34);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

        // Trackside Lamps, Grandstands & Biome Trees/Buildings
        for (let i = 20; i < n - 20; i += 14) {
            const p = this.trackPoints2D[i];
            const ang = Math.atan2(p.tx, p.tz);
            const side = (i % 28 === 0) ? 1 : -1;

            // Floodlights
            const poleGrp = new THREE.Group();
            poleGrp.position.set(p.x + p.nx * side * (halfW + 5.2), 0, p.z + p.nz * side * (halfW + 5.2));
            poleGrp.rotation.y = ang;
            const pm = new THREE.Mesh(poleGeo, poleMat);
            pm.position.y = 7.5;
            const hm = new THREE.Mesh(headGeo, headMat);
            hm.position.set(-side * 0.9, 15, 0);
            poleGrp.add(pm, hm);
            this.scene.add(poleGrp);

            // Grandstands
            if (i % 56 === 28) {
                const st = new THREE.Mesh(standGeo, standMat);
                st.position.set(p.x + p.nx * (halfW + 16), 3.75, p.z + p.nz * (halfW + 16));
                st.rotation.y = ang;
                this.scene.add(st);
            }

            // Biome-specific props along outer perimeter
            const propDist = halfW + 26 + (i % 3) * 9;
            const px = p.x + p.nx * side * propDist;
            const pz = p.z + p.nz * side * propDist;

            if (biome === 'FOREST_HILLS' || biome === 'PARK_LAKE' || biome === 'ALPINE_MOUNTAIN' || biome === 'SUZUKA_PARK') {
                // Pine / Cypress Trees
                const treeGrp = new THREE.Group();
                treeGrp.position.set(px, 0, pz);
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 3, 6), new THREE.MeshStandardMaterial({ color: 0x452719 }));
                trunk.position.y = 1.5;
                const foliage = new THREE.Mesh(new THREE.ConeGeometry(3.2, 9.5, 7), new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 }));
                foliage.position.y = 7.0;
                treeGrp.add(trunk, foliage);
                this.scene.add(treeGrp);
            } else if (biome === 'NEON_CITY_NIGHT' || biome === 'HARBOR_CITY') {
                // Illuminated Skyscrapers / Street Buildings
                const bH = 22 + (i % 5) * 12;
                const bldg = new THREE.Mesh(
                    new THREE.BoxGeometry(14, bH, 14),
                    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.3 })
                );
                bldg.position.set(px, bH / 2, pz);
                this.scene.add(bldg);

                const neonStrip = new THREE.Mesh(
                    new THREE.BoxGeometry(14.3, 1.2, 14.3),
                    new THREE.MeshBasicMaterial({ color: (i % 28 === 0) ? 0x00f0ff : 0xe10600 })
                );
                neonStrip.position.set(px, bH - 3, pz);
                this.scene.add(neonStrip);
            } else if (biome === 'DESERT_NIGHT' || biome === 'HARBOR_PALM') {
                // Palm Trees & Sand Dunes
                const palm = new THREE.Group();
                palm.position.set(px, 0, pz);
                const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 8.5, 6), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
                trunk.position.y = 4.25;
                const crown = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 6), new THREE.MeshStandardMaterial({ color: 0x15803d }));
                crown.scale.set(1.6, 0.45, 1.6);
                crown.position.y = 8.5;
                palm.add(trunk, crown);
                this.scene.add(palm);
            }
        }

        // Special Centerpiece Landmarks per Biome
        if (biome === 'PARK_LAKE' || biome === 'HARBOR_CITY' || biome === 'HARBOR_PALM') {
            const water = new THREE.Mesh(
                new THREE.CylinderGeometry(95, 95, 0.2, 32),
                new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.65 })
            );
            water.position.set(0, -0.05, 0);
            this.scene.add(water);
        } else if (biome === 'SUZUKA_PARK') {
            // Iconic Suzuka Ferris Wheel
            const wheel = new THREE.Mesh(
                new THREE.TorusGeometry(32, 1.2, 8, 24),
                new THREE.MeshBasicMaterial({ color: 0x22c55e })
            );
            wheel.position.set(-40, 36, 60);
            this.scene.add(wheel);
        } else if (biome === 'ALPINE_MOUNTAIN') {
            // Distant Alpine Mountain Peaks
            for (let m = 0; m < 8; m++) {
                const ang = (m / 8) * Math.PI * 2;
                const mtn = new THREE.Mesh(
                    new THREE.ConeGeometry(95, 140, 6),
                    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
                );
                mtn.position.set(Math.cos(ang) * 520, 68, Math.sin(ang) * 520);
                this.scene.add(mtn);
            }
        }
    }

    create3DCarMesh(team, driver, tireCompoundKey) {
        if (!this.hasWebGL) return null;
        const grp = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: team.carHex, metalness: 0.5, roughness: 0.25 });
        const wingMat = new THREE.MeshStandardMaterial({ color: team.wingHex, metalness: 0.35, roughness: 0.35 });
        const carbonMat = new THREE.MeshStandardMaterial({ color: 0x12141a, roughness: 0.6 });

        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 4.9), carbonMat);
        floor.position.set(0, 0.16, 0);
        grp.add(floor);

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.45, 3.8), bodyMat);
        body.position.set(0, 0.42, -0.1);
        grp.add(body);

        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 1.55), bodyMat);
        nose.position.set(0, 0.29, 2.15);
        nose.rotation.x = 0.08;
        grp.add(nose);

        const podGeo = new THREE.BoxGeometry(0.52, 0.38, 2.1);
        const lPod = new THREE.Mesh(podGeo, bodyMat);
        lPod.position.set(0.62, 0.38, -0.15);
        const rPod = lPod.clone();
        rPod.position.x = -0.62;
        grp.add(lPod, rPod);

        const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 1.4), bodyMat);
        airbox.position.set(0, 0.80, -0.55);
        grp.add(airbox);

        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.20, 10, 10),
            new THREE.MeshStandardMaterial({ color: driver.role === 1 ? 0xffffff : 0xffd100 })
        );
        helmet.position.set(0, 0.72, 0.24);
        grp.add(helmet);

        const fWing = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.08, 0.50), wingMat);
        fWing.position.set(0, 0.16, 2.70);
        grp.add(fWing);

        const rSupport = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.54, 0.42), carbonMat);
        rSupport.position.set(0, 0.60, -2.26);
        grp.add(rSupport);

        const drsFlap = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.08, 0.35), wingMat);
        drsFlap.position.set(0, 0.92, -2.30);
        grp.add(drsFlap);

        const ersMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const ersLed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.08), ersMat);
        ersLed.position.set(0, 0.35, -2.46);
        grp.add(ersLed);

        const compInfo = window.F1Data.tireCompounds[tireCompoundKey] || window.F1Data.tireCompounds.MEDIUM;
        const ringMat = new THREE.MeshBasicMaterial({ color: compInfo.hex });
        const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.36, 14);
        tireGeo.rotateZ(Math.PI / 2);
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x151619, roughness: 0.85 });
        const ringGeo = new THREE.TorusGeometry(0.24, 0.032, 6, 16);
        ringGeo.rotateY(Math.PI / 2);

        const wheels = [];
        [[0.92, 0.35, 1.62], [-0.92, 0.35, 1.62], [0.94, 0.36, -1.62], [-0.94, 0.36, -1.62]].forEach(pos => {
            const wg = new THREE.Group();
            wg.position.set(pos[0], pos[1], pos[2]);
            wg.add(new THREE.Mesh(tireGeo, tireMat));
            const rm = new THREE.Mesh(ringGeo, ringMat);
            rm.position.x = pos[0] > 0 ? 0.19 : -0.19;
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
                frontWingHealth: 100.0, // Below 75% loses cornering speed; repaired in Pit Stop
                chassisHealth: 100.0,   // 0% = Terminal Crash DNF
                engineHealth: 100.0,    // 0% = Mechanical Failure DNF
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

                paceMode: 'BALANCED', // 'ATTACK', 'BALANCED', 'CONSERVE'
                ersBattery: 100.0,
                ersMode: 'BALANCED',  // 'OVERTAKE', 'BALANCED', 'HARVEST'
                drsEligible: false,
                drsActive: false,

                // Pit Stop State Machine ('NONE', 'ENTERING', 'BOX_STOPPED', 'EXITING')
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

    updateSimulation(rawDt) {
        if (this.timeScale === 0) return;
        const dt = rawDt * this.timeScale;

        if (this.racePhase === 'RACING') {
            this.raceElapsedTime += dt;
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

        if (this.trackFlag !== 'GREEN') {
            this.flagTimer -= dt;
            if (this.flagTimer <= 0) {
                this.trackFlag = 'GREEN';
                this.emitEventLog('RACE CONTROL', '🟢 GREEN FLAG! 트랙 잔해 정리가 완료되어 레이스가 정상 재개됩니다!');
            }
        }
    }

    triggerSafetyCar(type = 'VSC', reason = '') {
        this.trackFlag = type;
        this.flagTimer = 26.0;
        this.emitEventLog('RACE CONTROL', `🟡 ${type === 'SC' ? 'SAFETY CAR DEPLOYED' : 'VIRTUAL SAFETY CAR (VSC)'}! ${reason} 전 구간 추월 금지 및 감속! 지금 피트인하면 시간 손실을 크게 아낄 수 있습니다!`);
    }

    isInsideDrsZone(t) {
        return this.circuit.drsZones.some(z => t >= z[0] && t <= z[1]);
    }

    // Check Wheel-to-Wheel Collisions, Front Wing Damage, Spins & Terminal DNFs
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

                // Close wheel-to-wheel contact box
                if (lapDiff < 0.0026 && latDiff < 1.75 && c1.collisionCooldown <= 0 && c2.collisionCooldown <= 0) {
                    const relSpeed = Math.abs(c1.speedKmh - c2.speedKmh) + Math.abs(c1.lateralVelocity - c2.lateralVelocity) * 15;
                    const pushDir = c1.lateralOffset >= c2.lateralOffset ? 1 : -1;
                    c1.lateralOffset += pushDir * 0.9;
                    c2.lateralOffset -= pushDir * 0.9;
                    c1.collisionCooldown = 2.2;
                    c2.collisionCooldown = 2.2;

                    const trailingCar = c1.totalDistance < c2.totalDistance ? c1 : c2;
                    const leadingCar = trailingCar === c1 ? c2 : c1;

                    // Apply Front Wing & Chassis Damage
                    const wingDmg = Math.min(45, 10 + relSpeed * 0.45);
                    trailingCar.frontWingHealth = Math.max(0, trailingCar.frontWingHealth - wingDmg);
                    trailingCar.chassisHealth = Math.max(0, trailingCar.chassisHealth - wingDmg * 0.5);
                    leadingCar.chassisHealth = Math.max(0, leadingCar.chassisHealth - wingDmg * 0.35);

                    trailingCar.speedKmh *= 0.82;
                    this.spawnImpactParticles(trailingCar.worldX, trailingCar.worldZ, 0xffaa00, 14);

                    if (trailingCar === this.followedCar || leadingCar === this.followedCar) {
                        window.f1Audio.playCrashImpact(0.75);
                    }

                    // Check if collision caused a Spin or Terminal DNF
                    if (trailingCar.chassisHealth <= 12 || (relSpeed > 52 && Math.random() < 0.25)) {
                        this.retireCar(trailingCar, 'COLLISION DAMAGE (충돌 파손 리타이어)');
                    } else if (relSpeed > 26 && Math.random() < 0.35) {
                        trailingCar.spinTimer = 1.6;
                        window.f1Audio.playTireScreech();
                        this.emitEventLog(trailingCar.driver.code, `💥 ${leadingCar.driver.code} 차량과 휠투휠 충돌로 스핀 및 프론트 윙 파손(잔여 ${Math.round(trailingCar.frontWingHealth)}%)!`);
                        if (trailingCar.frontWingHealth < 65) {
                            trailingCar.pitRequested = true;
                        }
                    } else if (trailingCar.isPlayerTeam || leadingCar.isPlayerTeam) {
                        this.emitEventLog(trailingCar.driver.code, `⚠️ ${leadingCar.driver.code}와 접촉! 프론트 윙 내구도 ${Math.round(trailingCar.frontWingHealth)}% (피트인 시 수리 가능)`);
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
        car.lateralOffset = 11.2; // Parked safely off-track
        this.spawnImpactParticles(car.worldX, car.worldZ, 0xef4444, 22);
        this.emitEventLog('RACE CONTROL', `🔴 RETIRED (DNF): #${car.driver.number} ${car.driver.korName} (${car.driver.code}) — 사유: ${reason}`);
        this.triggerSafetyCar('SC', `${car.driver.code} 리타이어 구난 작업!`);
    }

    updateAllCarsPhysics(dt) {
        let activeCount = 0;

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

            // 2. Handle Pit Lane State Machine ('ENTERING' -> 'BOX_STOPPED' -> 'EXITING')
            if (car.inPitLane) {
                this.updateCarPitStopSequence(car, dt);
                continue;
            }

            // 3. Check Pit Entry Trigger near end of lap (t > 0.96)
            if (car.pitRequested && car.lapProgress > 0.955 && car.lap < this.totalLaps) {
                car.inPitLane = true;
                car.pitState = 'ENTERING';
                car.pitTimer = 1.4; // Drive into pit box
                if (car.isPlayerTeam) {
                    this.emitEventLog(car.driver.code, `🔧 피트 레인 진입 (80km/h 리미터 작동). 피트크루 타이어 및 프론트 윙 대기 완료!`);
                }
                continue;
            }

            const sample = this.sampleTrackAt(car.lapProgress);
            const curvature = sample.curvature;
            const comp = window.F1Data.tireCompounds[car.tireCompound] || window.F1Data.tireCompounds.MEDIUM;

            // Tuning & Engineering Spec Modifiers
            let aeroSpec = car.team.specs.aero;
            let powerSpec = car.team.specs.powertrain;
            let chasSpec = car.team.specs.chassis;

            if (car.isPlayerTeam && this.playerTuning) {
                const wingAvg = (this.playerTuning.frontWingAngle + this.playerTuning.rearWingAngle) * 0.5; // 1..11 (6 neutral)
                aeroSpec = Math.min(105, Math.max(70, aeroSpec + (wingAvg - 6) * 1.4));
                powerSpec = Math.min(105, Math.max(70, powerSpec - (wingAvg - 6) * 1.1));
            }

            // Front Wing Damage Penalty on Cornering Downforce
            const wingDamagePenalty = car.frontWingHealth < 85 ? ((100 - car.frontWingHealth) * 0.35) : 0;
            const aeroFactor = 0.89 + ((aeroSpec - wingDamagePenalty) / 100) * 0.16;
            const powerFactor = 0.90 + (powerSpec / 100) * 0.15;
            const driverFactor = 0.91 + (car.driver.pace / 100) * 0.12;

            // Tire Compound Grip & Weather Matching
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

            // Severe Tire Puncture / Cliff below 15%
            if (car.tireHealth < 32) {
                compoundGrip *= (0.80 + (car.tireHealth / 32) * 0.20);
            }

            // Pace Mode & ERS Multipliers
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

            // DRS & Slipstream
            const inDrs = this.isInsideDrsZone(car.lapProgress);
            car.drsEligible = inDrs && (this.isTestTrackMode || (car.position > 1 && car.intervalAhead <= 1.0)) && this.weather === 'DRY' && this.trackFlag === 'GREEN';
            if (!inDrs || this.weather !== 'DRY' || this.trackFlag !== 'GREEN') {
                car.drsActive = false;
            } else if (car.drsEligible && (this.driveControlMode === 'PITWALL' || car !== this.followedCar)) {
                car.drsActive = true;
            }

            const slipstreamBoost = (!this.isTestTrackMode && car.position > 1 && car.intervalAhead < 0.85 && curvature < 0.15) ? 1.020 : 1.0;
            const drsBoost = car.drsActive ? 1.046 : 1.0;

            const cornerSlowdown = Math.min(0.72, Math.max(curvature, sample.aheadCurvature * 0.75) * 1.38);
            const idealCornerSpeed = 342 * (1.0 - cornerSlowdown * (1.06 / aeroFactor));
            let targetSpeed = idealCornerSpeed * powerFactor * driverFactor * compoundGrip * paceMult * ersMult * slipstreamBoost * drsBoost;

            if (this.trackFlag === 'VSC') targetSpeed = Math.min(targetSpeed, 185);
            if (this.trackFlag === 'SC') targetSpeed = Math.min(targetSpeed, 155);

            // Manual Driving Gameplay vs AI Racing Line
            const isManualCar = (this.driveControlMode === 'MANUAL' && car === this.followedCar && car.isPlayerTeam);
            if (isManualCar) {
                this.updateManualPlayerDriving(car, sample, targetSpeed, dt);
            } else {
                this.updateAiCraftAndLine(car, sample, targetSpeed, dt);
            }

            // Gear & RPM Calculation
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

    // Engaging Manual Driving Physics: Braking Point Reward, Apex Bonus, Kerb Rumble & Off-track Gravel Penalty
    updateManualPlayerDriving(car, sample, aiBaseTargetSpeed, dt) {
        // Steering Left / Right with smooth momentum
        const steerInput = (this.keys.left ? 1 : 0) - (this.keys.right ? 1 : 0);
        if (steerInput !== 0) {
            car.lateralVelocity += steerInput * 28.0 * dt;
        } else {
            // Subtle assist toward ideal racing line if player isn't actively steering
            const lineDiff = sample.idealLateral - car.lateralOffset;
            car.lateralVelocity += lineDiff * 2.2 * dt;
        }
        car.lateralVelocity *= Math.pow(0.08, dt);
        car.lateralOffset = Math.max(-10.2, Math.min(10.2, car.lateralOffset + car.lateralVelocity * dt));

        // Distance from Ideal Apex Line (0 = dead on racing line)
        const distFromIdealLine = Math.abs(car.lateralOffset - sample.idealLateral);
        const apexAccuracyBonus = distFromIdealLine < 1.8 ? 1.022 : (distFromIdealLine > 4.8 ? 0.955 : 1.0);

        let manualTargetSpeed = aiBaseTargetSpeed * apexAccuracyBonus;
        if (this.keys.up) {
            manualTargetSpeed *= 1.032; // Player manual throttle push bonus
            car.throttle = 1.0;
            car.brake = 0.0;
        } else if (this.keys.down) {
            manualTargetSpeed *= 0.65;  // Heavy manual braking for hairpins
            car.throttle = 0.0;
            car.brake = 1.0;
        } else {
            car.throttle = manualTargetSpeed >= car.speedKmh ? 0.85 : 0.15;
            car.brake = manualTargetSpeed < car.speedKmh - 18 ? 0.8 : 0.0;
        }

        // Off-Track Gravel / Grass Penalty & Spin Risk if wide > 8.6m
        if (Math.abs(car.lateralOffset) > 8.6) {
            manualTargetSpeed *= 0.76;
            if (sample.curvature > 0.22 && car.speedKmh > 210 && Math.random() < 0.025) {
                car.spinTimer = 1.4;
                window.f1Audio.playTireScreech();
                this.emitEventLog(car.driver.code, `⚠️ 코너 오버스피드 연석 이탈로 스핀 발생! 브레이킹 포인트를 지키십시오!`);
            }
        }

        const rate = manualTargetSpeed > car.speedKmh ? 94 : 175;
        car.speedKmh += Math.sign(manualTargetSpeed - car.speedKmh) * Math.min(Math.abs(manualTargetSpeed - car.speedKmh), rate * dt);
        car.speedKmh = Math.max(68, Math.min(368, car.speedKmh));
    }

    // Authentic AI Racecraft: Follows Ideal Racing Line, Defends Inside, Dives Down Inside on Overtakes
    updateAiCraftAndLine(car, sample, targetSpeed, dt) {
        let desiredLat = sample.idealLateral;

        // Check nearby cars ahead for slipstream & overtaking divebomb
        for (let j = 0; j < this.cars.length; j++) {
            const other = this.cars[j];
            if (other === car || other.finished || other.dnf || other.inPitLane) continue;
            const distAhead = other.totalDistance - car.totalDistance;
            if (distAhead > 0 && distAhead < 0.016) {
                if (Math.abs(other.lateralOffset - desiredLat) < 2.3) {
                    // Pull out to inside or outside lane to overtake
                    desiredLat = other.lateralOffset > 0 ? Math.max(-6.2, other.lateralOffset - 3.6) : Math.min(6.2, other.lateralOffset + 3.6);
                }
                break;
            }
        }

        car.targetLateral = desiredLat;
        car.lateralOffset += (car.targetLateral - car.lateralOffset) * Math.min(1, dt * 4.8);

        const rate = targetSpeed > car.speedKmh ? 88 : 165;
        car.throttle = targetSpeed >= car.speedKmh ? 1.0 : 0.12;
        car.brake = targetSpeed < car.speedKmh - 15 ? 1.0 : 0.0;
        car.speedKmh += Math.sign(targetSpeed - car.speedKmh) * Math.min(Math.abs(targetSpeed - car.speedKmh), rate * dt);
        car.speedKmh = Math.max(72, Math.min(364, car.speedKmh));

        // Rare AI Lockup / Mechanical Failure Realism
        if (!this.isTestTrackMode && Math.random() < 0.000018 * this.timeScale) {
            if (car.tireHealth < 25 || this.trackWater > 0.5) {
                car.spinTimer = 1.4;
                this.emitEventLog('RACE CONTROL', `🟡 YELLOW FLAG: ${car.driver.korName} (${car.driver.code}) 코너 브레이크 락업 스핀!`);
            }
        }
    }

    // Pit Lane 3-Stage Sequence: Entering (80km/h) -> Stationary Box Tire/Wing Service (2.1s) -> Exiting
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
                // Fit new tires + repair front wing
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

        // Repair damaged front wing immediately
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

        if (this.cameraMode === 'CHASE') {
            this.camera.position.set(
                fc.worldX - s.tx * 11.2,
                4.1,
                fc.worldZ - s.tz * 11.2
            );
            this.camera.lookAt(fc.worldX + s.tx * 15, 1.0, fc.worldZ + s.tz * 15);
        } else if (this.cameraMode === 'COCKPIT') {
            this.camera.position.set(
                fc.worldX + s.tx * 0.25,
                1.22,
                fc.worldZ + s.tz * 0.25
            );
            this.camera.lookAt(fc.worldX + s.tx * 32, 0.85, fc.worldZ + s.tz * 32);
        } else {
            this.camera.position.set(
                fc.worldX - s.tx * 28 + 22,
                38,
                fc.worldZ - s.tz * 28 + 18
            );
            this.camera.lookAt(fc.worldX + s.tx * 6, 0, fc.worldZ + s.tz * 6);
        }
    }

    renderFallback2DTrackCamera() {
        const ctx = this.fallbackCtx;
        const w = this.fallbackCanvas.width;
        const h = this.fallbackCanvas.height;
        const fc = this.followedCar || this.cars[0];
        if (!fc || !this.trackPoints2D.length) return;

        ctx.fillStyle = '#0c1017';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(2.8, 2.8);
        ctx.translate(-fc.worldX, -fc.worldZ);

        // Draw Track Asphalt
        ctx.beginPath();
        this.trackPoints2D.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.z);
            else ctx.lineTo(p.x, p.z);
        });
        ctx.closePath();
        ctx.lineWidth = 22;
        ctx.strokeStyle = '#252b37';
        ctx.stroke();

        ctx.lineWidth = 18;
        ctx.strokeStyle = '#181c24';
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
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = 'rgba(34,197,94,0.6)';
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

    // Render Authentic Circuit Silhouette + DRS Zones + Ideal Line + 20 Live Car Dots
    render2DCircuitMap() {
        const ctx = this.map2dCtx;
        const canvas = this.map2dCanvas;
        if (!ctx || !canvas || !this.trackPoints2D.length) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const b = this.bounds2D;
        const spanX = Math.max(200, b.maxX - b.minX);
        const spanZ = Math.max(200, b.maxZ - b.minZ);
        const midX = (b.minX + b.maxX) * 0.5;
        const midZ = (b.minZ + b.maxZ) * 0.5;

        const pad = 24;
        const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanZ);
        const cx = w * 0.5;
        const cy = h * 0.5;

        // Track Outer Border
        ctx.beginPath();
        this.trackPoints2D.forEach((p, idx) => {
            const sx = cx + (p.x - midX) * scale;
            const sy = cy + (p.z - midZ) * scale;
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.lineWidth = 7.0;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.stroke();

        // Track Inner Surface
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = this.trackFlag === 'GREEN' ? '#334155' : '#facc15';
        ctx.stroke();

        // Highlight DRS Zones in Green on the 2D Map
        this.circuit.drsZones.forEach(zone => {
            ctx.beginPath();
            const startIdx = Math.floor(zone[0] * this.trackPoints2D.length);
            const endIdx = Math.floor(zone[1] * this.trackPoints2D.length);
            for (let i = startIdx; i <= endIdx; i++) {
                const p = this.trackPoints2D[i % this.trackPoints2D.length];
                const sx = cx + (p.x - midX) * scale;
                const sy = cy + (p.z - midZ) * scale;
                if (i === startIdx) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = '#22c55e';
            ctx.stroke();
        });

        // Start/Finish Checkered Marker
        const s0 = this.trackPoints2D[0];
        ctx.fillStyle = '#e10600';
        ctx.fillRect(cx + (s0.x - midX) * scale - 4, cy + (s0.z - midZ) * scale - 4, 8, 8);

        // Draw All Cars
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
        const order = ['CHASE', 'COCKPIT', 'TV_HELI'];
        this.cameraMode = order[(order.indexOf(this.cameraMode) + 1) % order.length];
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

    getSnapshot() {
        const sorted = [...this.cars].sort((a, b) => a.position - b.position);
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
            standings: sorted,
            playerCar1: this.playerCar1,
            playerCar2: this.playerCar2,
            followedCar: this.followedCar
        };
    }
}

window.F1LiveRaceEngine = F1LiveRaceEngine;
