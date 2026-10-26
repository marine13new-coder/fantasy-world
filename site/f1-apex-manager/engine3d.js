// ============================================================================
// F1 MANAGER & LIVE TELEMETRY SIMULATOR - DUAL RENDERING & AI RACE ENGINE
// 1. Live 3D Onboard / Chase / TV Broadcast Viewport (Three.js + 2D Fallback)
// 2. Live 2D Pit-Wall Telemetry Circuit Map (Interactive HTML5 Canvas)
// 3. Autonomous 20-Car AI Strategist (Undercut, Overcut, Slipstream, DRS, SC)
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

        // Fallback 2D Onboard Canvas if WebGL is unavailable
        this.fallbackCanvas = null;
        this.fallbackCtx = null;

        this.circuit = null;
        this.trackPoints2D = [];     // High-res sampled 2D spline points [{x, z, tx, tz, nx, nz, curvature}]
        this.trackLengthMeters = 5400;

        this.cars = [];
        this.playerCar1 = null;
        this.playerCar2 = null;
        this.followedCar = null;

        // Modes
        this.cameraMode = 'CHASE';        // 'CHASE', 'COCKPIT', 'TV_HELI'
        this.driveControlMode = 'MANUAL'; // 'MANUAL' (Player drives followed car) or 'PITWALL' (Full AI + Strategy commands)
        this.raceFormat = 'SPRINT';       // 'QUICK', 'SPRINT', 'HALF', 'FULL'

        // Race State
        this.isRunning = false;
        this.racePhase = 'PRE_RACE'; // 'COUNTDOWN', 'RACING', 'FINISHED'
        this.timeScale = 1.0;        // 0, 1, 2, 4, 8
        this.totalLaps = 15;
        this.raceElapsedTime = 0;

        // Track Status & Weather
        this.trackFlag = 'GREEN';    // 'GREEN', 'YELLOW', 'VSC', 'SC'
        this.flagTimer = 0;
        this.weather = 'DRY';        // 'DRY', 'INTER_RAIN', 'HEAVY_RAIN'
        this.trackWater = 0.0;       // 0.0 to 1.0
        this.trackTemp = 34.0;

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
        // 1. Try initializing Three.js WebGLRenderer
        if (window.THREE && this.viewport3dEl) {
            try {
                const w = Math.max(640, this.viewport3dEl.clientWidth || 960);
                const h = Math.max(420, this.viewport3dEl.clientHeight || 540);

                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0x0b0f17);
                this.scene.fog = new THREE.FogExp2(0x0b0f17, 0.0012);

                this.camera = new THREE.PerspectiveCamera(60, w / h, 0.4, 2400);
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

        // If Three.js or WebGL failed, create a crisp 2D Trackside Camera Canvas inside viewport3dEl
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
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': this.keys.up = true; break;
                case 'KeyS': case 'ArrowDown': this.keys.down = true; break;
                case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
                case 'Space':
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

        // Allow clicking on a car dot in the 2D Track Map to focus camera on that car
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

    // Pure math Catmull-Rom spline sampler so physics works identically with or without Three.js
    buildSplineTable(waypoints) {
        const n = waypoints.length;
        const totalSamples = 600;
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

        for (let i = 0; i < totalSamples; i++) {
            const u = (i / totalSamples) * n;
            const seg = Math.floor(u) % n;
            const localT = u - Math.floor(u);

            const p0 = waypoints[(seg - 1 + n) % n];
            const p1 = waypoints[seg];
            const p2 = waypoints[(seg + 1) % n];
            const p3 = waypoints[(seg + 2) % n];

            pts.push(getCatmullRomPoint(p0, p1, p2, p3, localT));
        }

        // Compute tangents, normals, and curvature at each sample
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
            const a1 = Math.atan2(pt.z - prev2.z, pt.x - prev2.x);
            const a2 = Math.atan2(next2.z - pt.z, next2.x - pt.x);
            let diff = Math.abs(a2 - a1);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;

            return {
                t: i / totalSamples,
                x: pt.x,
                z: pt.z,
                tx,
                tz,
                nx,
                nz,
                curvature: diff // 0 = straight, 0.5+ = tight hairpin
            };
        });
    }

    sampleTrackAt(normalizedT) {
        const total = this.trackPoints2D.length;
        if (!total) return { x: 0, z: 0, tx: 0, tz: 1, nx: -1, nz: 0, curvature: 0 };
        const t = ((normalizedT % 1) + 1) % 1;
        const exactIdx = t * total;
        const idx0 = Math.floor(exactIdx) % total;
        const idx1 = (idx0 + 1) % total;
        const frac = exactIdx - Math.floor(exactIdx);

        const p0 = this.trackPoints2D[idx0];
        const p1 = this.trackPoints2D[idx1];

        return {
            x: p0.x + (p1.x - p0.x) * frac,
            z: p0.z + (p1.z - p0.z) * frac,
            tx: p0.tx + (p1.tx - p0.tx) * frac,
            tz: p0.tz + (p1.tz - p0.tz) * frac,
            nx: p0.nx + (p1.nx - p0.nx) * frac,
            nz: p0.nz + (p1.nz - p0.nz) * frac,
            curvature: p0.curvature
        };
    }

    // Initialize Grand Prix Weekend Session
    setupGrandPrix(circuitData, gridOrder, playerTeamId, options = {}) {
        this.circuit = circuitData;
        this.raceFormat = options.raceFormat || 'SPRINT';
        const fmt = window.F1Data.raceFormats[this.raceFormat] || window.F1Data.raceFormats.SPRINT;

        this.totalLaps = fmt.fixedLaps ? fmt.fixedLaps : Math.max(5, Math.round(circuitData.realLaps * fmt.scale));
        this.wearMultiplierFormat = fmt.wearMult;
        this.fuelMultiplierFormat = fmt.fuelMult;

        this.driveControlMode = options.driveControlMode || 'MANUAL';
        this.timeScale = 1.0;
        this.raceElapsedTime = 0;
        this.trackFlag = 'GREEN';
        this.flagTimer = 0;
        this.trackLengthMeters = circuitData.lengthKm * 1000;

        // Initial Weather Roll
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

        this.buildSplineTable(circuitData.waypoints);

        if (this.hasWebGL) {
            this.build3DEnvironment();
        }

        this.spawn20Cars(gridOrder, playerTeamId, options.startingTires || {});
        this.resizeViewports();

        this.isRunning = true;
        this.startLightsOutCountdown();
    }

    build3DEnvironment() {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        const skyHex = this.weather !== 'DRY' ? 0x1a2230 : this.circuit.skyColor;
        this.scene.background = new THREE.Color(skyHex);
        this.scene.fog = new THREE.FogExp2(skyHex, this.weather === 'HEAVY_RAIN' ? 0.0020 : 0.0010);

        const amb = new THREE.AmbientLight(0xffffff, this.circuit.timeOfDay === 'night' ? 0.62 : 0.78);
        this.scene.add(amb);

        const sun = new THREE.DirectionalLight(0xfff8eb, this.circuit.timeOfDay === 'night' ? 0.9 : 1.2);
        sun.position.set(160, 280, 140);
        sun.castShadow = true;
        this.scene.add(sun);

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(2400, 2400),
            new THREE.MeshStandardMaterial({ color: this.circuit.groundColor, roughness: 0.92 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.15;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Build Road & Red/White FIA Kerbs Ribbon from trackPoints2D
        const n = this.trackPoints2D.length;
        const halfW = 10.0;
        const kerbW = 1.6;

        const roadPos = [];
        const roadIdx = [];
        const kerbPos = [];
        const kerbCol = [];
        const kerbIdx = [];

        for (let i = 0; i <= n; i++) {
            const p = this.trackPoints2D[i % n];
            const lx = p.x + p.nx * halfW;
            const lz = p.z + p.nz * halfW;
            const rx = p.x - p.nx * halfW;
            const rz = p.z - p.nz * halfW;

            roadPos.push(lx, 0.02, lz, rx, 0.02, rz);

            const lkx = p.x + p.nx * (halfW + kerbW);
            const lkz = p.z + p.nz * (halfW + kerbW);
            const rkx = p.x - p.nx * (halfW + kerbW);
            const rkz = p.z - p.nz * (halfW + kerbW);

            kerbPos.push(lkx, 0.05, lkz, lx, 0.04, lz, rx, 0.04, rz, rkx, 0.05, rkz);
            const isRed = (i % 2 === 0);
            const c = isRed ? [0.88, 0.06, 0.08] : [0.95, 0.96, 0.98];
            for (let k = 0; k < 4; k++) kerbCol.push(c[0], c[1], c[2]);

            if (i < n) {
                const rb = i * 2;
                roadIdx.push(rb, rb + 1, rb + 2, rb + 1, rb + 3, rb + 2);
                const kb = i * 4;
                kerbIdx.push(kb, kb + 1, kb + 4, kb + 1, kb + 5, kb + 4);
                kerbIdx.push(kb + 2, kb + 3, kb + 6, kb + 3, kb + 7, kb + 6);
            }
        }

        const roadGeo = new THREE.BufferGeometry();
        roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
        roadGeo.setIndex(roadIdx);
        roadGeo.computeVertexNormals();
        const roadMesh = new THREE.Mesh(
            roadGeo,
            new THREE.MeshStandardMaterial({
                color: 0x1d212a,
                roughness: this.weather === 'DRY' ? 0.78 : 0.25,
                metalness: this.weather === 'DRY' ? 0.10 : 0.50
            })
        );
        roadMesh.receiveShadow = true;
        this.scene.add(roadMesh);

        const kerbGeo = new THREE.BufferGeometry();
        kerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(kerbPos, 3));
        kerbGeo.setAttribute('color', new THREE.Float32BufferAttribute(kerbCol, 3));
        kerbGeo.setIndex(kerbIdx);
        kerbGeo.computeVertexNormals();
        const kerbMesh = new THREE.Mesh(kerbGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }));
        this.scene.add(kerbMesh);

        // Start/Finish Gantry & Pit Complex at t = 0
        const s0 = this.trackPoints2D[0];
        const angle = Math.atan2(s0.tx, s0.tz);
        const gantry = new THREE.Group();
        gantry.position.set(s0.x, 0, s0.z);
        gantry.rotation.y = angle;

        const startLine = new THREE.Mesh(
            new THREE.PlaneGeometry(halfW * 2, 3.0),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.y = 0.06;
        gantry.add(startLine);

        const arch = new THREE.Mesh(
            new THREE.BoxGeometry((halfW + 2.5) * 2, 1.5, 1.5),
            new THREE.MeshStandardMaterial({ color: 0xe10600 })
        );
        arch.position.set(0, 8.8, 0);
        gantry.add(arch);

        const pL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 9, 1.1), new THREE.MeshStandardMaterial({ color: 0x111827 }));
        pL.position.set(halfW + 2, 4.5, 0);
        const pR = pL.clone();
        pR.position.set(-(halfW + 2), 4.5, 0);
        gantry.add(pL, pR);

        const pitBldg = new THREE.Mesh(
            new THREE.BoxGeometry(11, 10, 86),
            new THREE.MeshStandardMaterial({ color: 0x161d2a, roughness: 0.4 })
        );
        pitBldg.position.set(-(halfW + 12), 5, -16);
        gantry.add(pitBldg);

        this.scene.add(gantry);

        // Floodlight Poles & Grandstands along track
        const poleGeo = new THREE.CylinderGeometry(0.22, 0.32, 15, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const headGeo = new THREE.BoxGeometry(2.2, 0.5, 1.0);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
        const standGeo = new THREE.BoxGeometry(10, 6.5, 32);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x263147 });

        for (let i = 0; i < n; i += 15) {
            const p = this.trackPoints2D[i];
            const ang = Math.atan2(p.tx, p.tz);
            const side = (i % 30 === 0) ? 1 : -1;

            const poleGrp = new THREE.Group();
            poleGrp.position.set(p.x + p.nx * side * (halfW + 5), 0, p.z + p.nz * side * (halfW + 5));
            poleGrp.rotation.y = ang;
            const pm = new THREE.Mesh(poleGeo, poleMat);
            pm.position.y = 7.5;
            const hm = new THREE.Mesh(headGeo, headMat);
            hm.position.set(-side * 0.9, 15, 0);
            poleGrp.add(pm, hm);
            this.scene.add(poleGrp);

            if (i % 60 === 30) {
                const st = new THREE.Mesh(standGeo, standMat);
                st.position.set(p.x + p.nx * (halfW + 15), 3.25, p.z + p.nz * (halfW + 15));
                st.rotation.y = ang;
                this.scene.add(st);
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
        return { mesh: grp, drsFlap, ersMat, ringMat, wheels };
    }

    // Smart AI Initial Stint Strategy Planner for each of the 20 Cars
    planAiStintStrategy(driver, gridIndex) {
        if (this.weather === 'HEAVY_RAIN') {
            return { startTire: 'WET', nextTire: 'INTER', plannedPitLap: Math.round(this.totalLaps * 0.55) };
        }
        if (this.weather === 'INTER_RAIN') {
            return { startTire: 'INTER', nextTire: 'MEDIUM', plannedPitLap: Math.round(this.totalLaps * 0.50) };
        }
        // Dry race strategy diversity:
        // Front runners (P1~P8) start on Soft or Medium for track position; Midfielders try Overcut on Medium/Hard
        if (gridIndex < 6) {
            return {
                startTire: 'SOFT',
                nextTire: this.totalLaps >= 20 ? 'HARD' : 'MEDIUM',
                plannedPitLap: Math.max(2, Math.round(this.totalLaps * 0.38))
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
                plannedPitLap: Math.max(3, Math.round(this.totalLaps * 0.66))
            };
        }
    }

    spawn20Cars(gridOrder, playerTeamId, customStartTires) {
        this.cars = [];
        this.playerCar1 = null;
        this.playerCar2 = null;

        gridOrder.forEach((driver, idx) => {
            const team = window.F1Data.teams.find(t => t.id === driver.teamId) || window.F1Data.teams[0];
            const isPlayerTeam = (driver.teamId === playerTeamId);
            const aiPlan = this.planAiStintStrategy(driver, idx);
            const startTire = customStartTires[driver.id] || aiPlan.startTire;

            const startProgress = -((idx + 1) * 0.0046);
            const lateral = (idx % 2 === 0) ? -2.8 : 2.8;

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

                // Physics & Telemetry
                speedKmh: 0,
                rpm: 4200,
                gear: 1,
                throttle: 0,
                brake: 0,
                lateralOffset: lateral,
                targetLateral: lateral,
                worldX: 0,
                worldZ: 0,
                headingAngle: 0,

                // Tires, Fuel & Strategy
                tireCompound: startTire,
                tireHealth: 100.0,
                tireTemp: 90.0,
                tireAgeLaps: 0,
                stintHistory: [startTire],
                fuelKg: +(this.totalLaps * (1.75 / this.fuelMultiplierFormat)).toFixed(1),

                paceMode: 'BALANCED', // 'ATTACK', 'BALANCED', 'CONSERVE'
                ersBattery: 100.0,
                ersMode: 'BALANCED',  // 'OVERTAKE', 'BALANCED', 'HARVEST'
                drsEligible: false,
                drsActive: false,

                // Pit Stop & AI Strategy Brain
                pitRequested: false,
                nextPitTire: aiPlan.nextTire,
                plannedPitLap: aiPlan.plannedPitLap,
                inPitLane: false,
                pitTimer: 0,
                pitStops: 0,

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
                }, 700);
                window.f1Audio.playStartLight(true);
                window.f1Audio.startEngineSound();
                this.racePhase = 'RACING';
                this.emitEventLog('RACE CONTROL', `🟢 LIGHTS OUT! ${this.circuit.name} (${this.totalLaps} Laps) 결선 스타트!`);
            }
        }, 620);
    }

    emitEventLog(tag, message) {
        window.f1Audio.playRadioBeep();
        if (typeof this.onRaceEventLog === 'function') {
            this.onRaceEventLog(tag, message);
        }
    }

    updateSimulation(rawDt) {
        if (this.timeScale === 0) return;
        const dt = rawDt * this.timeScale;

        if (this.racePhase === 'RACING') {
            this.raceElapsedTime += dt;
            this.updateWeatherAndTrackState(dt);
            this.updateAllCarsPhysics(dt);
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

        // Handle VSC / Safety Car countdown
        if (this.trackFlag !== 'GREEN') {
            this.flagTimer -= dt;
            if (this.flagTimer <= 0) {
                this.trackFlag = 'GREEN';
                this.emitEventLog('RACE CONTROL', '🟢 GREEN FLAG! 세이프티카 구간이 해제되었습니다. 레이스 재개!');
            }
        }
    }

    triggerSafetyCar(type = 'VSC') {
        this.trackFlag = type;
        this.flagTimer = 28.0;
        this.emitEventLog('RACE CONTROL', `🟡 ${type === 'SC' ? 'SAFETY CAR DEPLOYED' : 'VIRTUAL SAFETY CAR (VSC)'}! 전 구간 추월 금지 및 델타 속도 제한! 피트스톱 손실 시간이 줄어드는 절호의 찬스입니다!`);
    }

    isInsideDrsZone(t) {
        return this.circuit.drsZones.some(z => t >= z[0] && t <= z[1]);
    }

    updateAllCarsPhysics(dt) {
        let allFinished = true;

        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            if (car.finished) continue;
            allFinished = false;

            car.currentLapTime += dt;

            // 1. Pit Lane Execution
            if (car.inPitLane) {
                car.speedKmh = 80;
                car.rpm = 5900;
                car.gear = 2;
                car.pitTimer -= dt;
                if (car.pitTimer <= 0) {
                    car.inPitLane = false;
                    car.pitRequested = false;
                    car.tireCompound = car.nextPitTire;
                    car.tireHealth = 100.0;
                    car.tireTemp = 86.0;
                    car.tireAgeLaps = 0;
                    car.pitStops++;
                    car.stintHistory.push(car.tireCompound);

                    const compInfo = window.F1Data.tireCompounds[car.tireCompound];
                    if (car.visual3D && car.visual3D.ringMat && compInfo) {
                        car.visual3D.ringMat.color.setHex(compInfo.hex);
                    }
                    if (car.isPlayerTeam) {
                        window.f1Audio.playPitWheelGun();
                        this.emitEventLog(car.driver.code, `🔧 피트스톱 완료! [${compInfo.name}] 새 타이어 장착 후 트랙 복귀!`);
                    }
                }
            }

            const sample = this.sampleTrackAt(car.lapProgress);
            const curvature = sample.curvature;
            const comp = window.F1Data.tireCompounds[car.tireCompound] || window.F1Data.tireCompounds.MEDIUM;

            // Car Engineering & Driver Skill Factors
            const aeroFactor = 0.89 + (car.team.specs.aero / 100) * 0.15;
            const powerFactor = 0.90 + (car.team.specs.powertrain / 100) * 0.14;
            const driverFactor = 0.91 + (car.driver.pace / 100) * 0.12;

            // Tire Compound Grip Delta (Soft fastest, Hard slowest, Wet/Inter weather dependent)
            let compoundGrip = 1.0 - (comp.paceDelta * 0.011);
            if (this.trackWater > 0.18) {
                if (car.tireCompound === 'SOFT' || car.tireCompound === 'MEDIUM' || car.tireCompound === 'HARD') {
                    compoundGrip *= (1.0 - this.trackWater * 0.42);
                } else if (car.tireCompound === 'INTER') {
                    compoundGrip = this.trackWater > 0.62 ? 0.94 : 1.035;
                } else if (car.tireCompound === 'WET') {
                    compoundGrip = this.trackWater > 0.52 ? 1.045 : 0.95;
                }
            } else if (car.tireCompound === 'INTER' || car.tireCompound === 'WET') {
                compoundGrip *= 0.87;
            }

            // Tire Degradation Cliff (< 32% wear)
            if (car.tireHealth < 32) {
                compoundGrip *= (0.83 + (car.tireHealth / 32) * 0.17);
            }

            // Pace Command Multipliers
            let paceMult = 1.0;
            let wearMult = 1.0;
            if (car.paceMode === 'ATTACK') {
                paceMult = 1.024;
                wearMult = 1.36;
            } else if (car.paceMode === 'CONSERVE') {
                paceMult = 0.978;
                wearMult = 0.66;
            }

            // ERS Deployment
            let ersMult = 1.0;
            if (car.ersMode === 'OVERTAKE' && car.ersBattery > 2 && curvature < 0.20) {
                ersMult = 1.035;
                car.ersBattery = Math.max(0, car.ersBattery - dt * 6.2);
            } else if (car.ersMode === 'HARVEST' || curvature > 0.24) {
                ersMult = car.ersMode === 'HARVEST' ? 0.985 : 1.0;
                car.ersBattery = Math.min(100, car.ersBattery + dt * 4.4);
            } else if (curvature < 0.12 && car.ersBattery > 25) {
                ersMult = 1.012;
                car.ersBattery = Math.max(0, car.ersBattery - dt * 1.6);
            }

            // DRS Zone Activation & Slipstream (Tow)
            const inDrs = this.isInsideDrsZone(car.lapProgress);
            car.drsEligible = inDrs && car.position > 1 && car.intervalAhead <= 1.0 && this.weather === 'DRY' && this.trackFlag === 'GREEN';
            if (!inDrs || this.weather !== 'DRY' || this.trackFlag !== 'GREEN') {
                car.drsActive = false;
            } else if (car.drsEligible && (this.driveControlMode === 'PITWALL' || car !== this.followedCar)) {
                car.drsActive = true;
            }

            const slipstreamBoost = (car.position > 1 && car.intervalAhead < 0.85 && curvature < 0.15) ? 1.018 : 1.0;
            const drsBoost = car.drsActive ? 1.044 : 1.0;

            // Cornering Speed vs Straight Top Speed
            const cornerBrakeFactor = Math.min(0.70, curvature * 1.38);
            const baseSpeed = 340 * (1.0 - cornerBrakeFactor * (1.06 / aeroFactor));
            let targetSpeed = baseSpeed * powerFactor * driverFactor * compoundGrip * paceMult * ersMult * slipstreamBoost * drsBoost;

            // Safety Car / VSC Speed Cap
            if (this.trackFlag === 'VSC') targetSpeed = Math.min(targetSpeed, 185);
            if (this.trackFlag === 'SC') targetSpeed = Math.min(targetSpeed, 155);

            // Manual Keyboard Controls if Player is manually driving the followed car
            const isManualCar = (this.driveControlMode === 'MANUAL' && car === this.followedCar && car.isPlayerTeam);
            if (isManualCar && !car.inPitLane) {
                if (this.keys.up) targetSpeed *= 1.028;
                if (this.keys.down) targetSpeed *= 0.72;
                if (this.keys.left) car.targetLateral = Math.min(6.8, car.lateralOffset + 9.5 * dt);
                if (this.keys.right) car.targetLateral = Math.max(-6.8, car.lateralOffset - 9.5 * dt);
            } else if (!car.inPitLane) {
                this.updateAiOvertakeLine(car);
            }

            if (!car.inPitLane) {
                const rate = targetSpeed > car.speedKmh ? 88 : 165;
                car.throttle = targetSpeed >= car.speedKmh ? 1.0 : 0.12;
                car.brake = targetSpeed < car.speedKmh - 15 ? 1.0 : 0.0;
                car.speedKmh += Math.sign(targetSpeed - car.speedKmh) * Math.min(Math.abs(targetSpeed - car.speedKmh), rate * dt);
                car.speedKmh = Math.max(72, Math.min(364, car.speedKmh));
            }

            // Gear & RPM
            const prevGear = car.gear;
            car.gear = Math.max(1, Math.min(8, Math.floor((car.speedKmh / 348) * 8) + 1));
            if (car === this.followedCar && car.gear !== prevGear && this.timeScale === 1) {
                window.f1Audio.playGearShift(car.gear > prevGear);
            }
            const gMin = (car.gear - 1) * 42;
            car.rpm = Math.round(9200 + Math.max(0, Math.min(1, (car.speedKmh - gMin) / 48)) * 5600);

            // Advance along circuit spline
            // Scaled so 1 lap takes realistic accelerated time (~22~28 sec at 1x) while reporting authentic lap times
            const lapAdvance = ((car.speedKmh * 0.27778) / 1450) * dt;
            car.lapProgress += lapAdvance;
            car.totalDistance += lapAdvance;
            car.lateralOffset += (car.targetLateral - car.lateralOffset) * Math.min(1, dt * 5.5);

            // Tire Wear & Fuel Burn
            const chasSave = 1.14 - (car.team.specs.chassis / 100) * 0.24;
            const drvSave = 1.12 - (car.driver.tireMgmt / 100) * 0.22;
            const wearPerLapActual = comp.baseWearPerLap * this.circuit.tireWearRate * this.wearMultiplierFormat * wearMult * chasSave * drvSave;
            car.tireHealth = Math.max(0, car.tireHealth - wearPerLapActual * lapAdvance);
            car.fuelKg = Math.max(0.2, car.fuelKg - 1.65 * lapAdvance);

            const targetTemp = comp.optimalTemp + (car.paceMode === 'ATTACK' ? 8 : (car.paceMode === 'CONSERVE' ? -6 : 0)) - (this.trackWater * 22);
            car.tireTemp += (targetTemp - car.tireTemp) * dt * 0.6;

            // Check Lap Completion
            if (car.lapProgress >= 1.0) {
                car.lapProgress -= 1.0;
                car.tireAgeLaps++;

                // Authentic Scaled Lap Time in Seconds (e.g., 89.412s)
                const speedRatio = 235 / Math.max(150, car.speedKmh);
                const simulatedLapSec = +(this.circuit.baseLapTime * (0.97 + (100 - car.team.specs.aero) * 0.0015) * (0.98 + (100 - car.tireHealth) * 0.0005) + (Math.random() - 0.5) * 0.28).toFixed(3);
                car.lastLapTime = simulatedLapSec;
                if (simulatedLapSec < car.bestLapTime) {
                    car.bestLapTime = simulatedLapSec;
                }
                car.currentLapTime = 0;

                // Execute Pit Stop if requested
                if (car.pitRequested && car.lap < this.totalLaps) {
                    car.inPitLane = true;
                    const pitBonus = (car.team.specs.durability - 80) * 0.04;
                    car.pitTimer = Math.max(2.0, 3.6 - pitBonus);
                }

                // Autonomous AI Strategist Evaluation at Lap Crossing
                if (!car.isPlayerTeam && car.lap < this.totalLaps) {
                    this.evaluateAutonomousAiPitStrategy(car);
                } else if (car.isPlayerTeam && car.tireHealth < 30 && !car.pitRequested && car.lap < this.totalLaps) {
                    this.emitEventLog(car.driver.code, `⚠️ 타이어 수명이 ${Math.round(car.tireHealth)}%로 떨어졌습니다! 언더컷 방어를 위해 [BOX 피트인]을 권장합니다.`);
                }

                if (car.lap >= this.totalLaps) {
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

        this.syncCarWorldCoordinates(dt);

        const playerDone = this.cars.filter(c => c.isPlayerTeam).every(c => c.finished);
        if (allFinished || playerDone) {
            this.completeRaceSession();
        }
    }

    updateAiOvertakeLine(car) {
        let line = Math.sin(car.lapProgress * Math.PI * 6) * 2.2;
        for (let j = 0; j < this.cars.length; j++) {
            const other = this.cars[j];
            if (other === car || other.finished) continue;
            const dDiff = other.totalDistance - car.totalDistance;
            if (dDiff > 0 && dDiff < 0.018 && Math.abs(other.lateralOffset - car.lateralOffset) < 2.2) {
                line = other.lateralOffset > 0 ? -3.8 : 3.8;
                break;
            }
        }
        car.targetLateral = line;
    }

    // Intelligent AI Pit Wall Strategy (Undercut, Overcut, Weather Crossover, Safety Car Cheap Stop)
    evaluateAutonomousAiPitStrategy(car) {
        if (car.pitRequested) return;
        const lapsRemaining = this.totalLaps - car.lap;
        if (lapsRemaining <= 1) return;

        // 1. Weather Crossover Check
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

        // 2. VSC / Safety Car "Cheap Pit Stop" Opportunity
        if (this.trackFlag !== 'GREEN' && car.tireHealth < 62 && lapsRemaining >= 3) {
            car.pitRequested = true;
            car.nextPitTire = lapsRemaining <= Math.round(this.totalLaps * 0.35) ? 'SOFT' : 'HARD';
            return;
        }

        // 3. Undercut Trigger (Stuck behind car within 1.4s with worn tires around pit window)
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
            const lat = car.inPitLane ? -13.5 : car.lateralOffset;

            car.worldX = s.x + s.nx * lat;
            car.worldZ = s.z + s.nz * lat;
            car.headingAngle = Math.atan2(s.tx, s.tz);

            if (this.hasWebGL && car.visual3D) {
                car.visual3D.mesh.position.set(car.worldX, 0, car.worldZ);
                car.visual3D.mesh.rotation.y = car.headingAngle;
                car.visual3D.drsFlap.rotation.x = car.drsActive ? -0.42 : 0.0;
                car.visual3D.ersMat.color.setHex(car.ersMode === 'OVERTAKE' ? 0x00ff66 : 0xff0033);
                const wSpin = (car.speedKmh * 0.12) * dt;
                car.visual3D.wheels.forEach(w => { w.rotation.x += wSpin; });
            }
        }
    }

    computeLeaderboardAndIntervals() {
        const sorted = [...this.cars].sort((a, b) => {
            if (a.finished && b.finished) return a.finishTime - b.finishTime;
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.totalDistance - a.totalDistance;
        });

        const leader = sorted[0];
        sorted.forEach((car, idx) => {
            car.position = idx + 1;
            if (idx === 0) {
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
                fc.worldX - s.tx * 11.5,
                4.2,
                fc.worldZ - s.tz * 11.5
            );
            this.camera.lookAt(fc.worldX + s.tx * 14, 1.0, fc.worldZ + s.tz * 14);
        } else if (this.cameraMode === 'COCKPIT') {
            this.camera.position.set(
                fc.worldX + s.tx * 0.2,
                1.25,
                fc.worldZ + s.tz * 0.2
            );
            this.camera.lookAt(fc.worldX + s.tx * 30, 0.9, fc.worldZ + s.tz * 30);
        } else {
            // TV_HELI
            this.camera.position.set(
                fc.worldX - s.tx * 28 + 22,
                36,
                fc.worldZ - s.tz * 28 + 18
            );
            this.camera.lookAt(fc.worldX + s.tx * 6, 0, fc.worldZ + s.tz * 6);
        }
    }

    // Crisp 2D Close-Up Follow Camera if WebGL is disabled in browser
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
        const zoom = 2.6;
        ctx.scale(zoom, zoom);
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

        // Draw Cars
        this.cars.forEach(c => {
            ctx.save();
            ctx.translate(c.worldX, c.worldZ);
            ctx.rotate(-c.headingAngle);
            ctx.fillStyle = c.team.primaryColor;
            ctx.fillRect(-1.2, -2.6, 2.4, 5.2);
            ctx.restore();
        });

        ctx.restore();
    }

    // Render Live 2D Pit Wall Circuit Telemetry Map (Always visible in HUD)
    render2DCircuitMap() {
        const ctx = this.map2dCtx;
        const canvas = this.map2dCanvas;
        if (!ctx || !canvas || !this.trackPoints2D.length) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const pad = 22;
        const scaleX = (w - pad * 2) / 620;
        const scaleY = (h - pad * 2) / 620;
        const scale = Math.min(scaleX, scaleY);
        const cx = w / 2;
        const cy = h / 2;

        // Track Outline
        ctx.beginPath();
        this.trackPoints2D.forEach((p, idx) => {
            const sx = cx + p.x * scale;
            const sy = cy + p.z * scale;
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.lineWidth = 6.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.stroke();

        ctx.lineWidth = 3.2;
        ctx.strokeStyle = this.trackFlag === 'GREEN' ? '#475569' : '#facc15';
        ctx.stroke();

        // Start/Finish Line Marker
        const s0 = this.trackPoints2D[0];
        ctx.fillStyle = '#e10600';
        ctx.fillRect(cx + s0.x * scale - 4, cy + s0.z * scale - 4, 8, 8);

        // Draw All 20 Cars on Telemetry Map
        for (let i = this.cars.length - 1; i >= 0; i--) {
            const c = this.cars[i];
            const sx = cx + c.worldX * scale;
            const sy = cy + c.worldZ * scale;
            c.mapScreenX = sx;
            c.mapScreenY = sy;

            const isFollowed = (c === this.followedCar);
            const radius = isFollowed ? 6.5 : (c.isPlayerTeam ? 5.5 : 4.0);

            ctx.beginPath();
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.fillStyle = c.team.primaryColor;
            ctx.fill();
            ctx.lineWidth = isFollowed ? 2.2 : 1.0;
            ctx.strokeStyle = isFollowed ? '#ffffff' : '#090b10';
            ctx.stroke();

            if (c.isPlayerTeam || isFollowed || c.position <= 3) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px "JetBrains Mono", monospace';
                ctx.fillText(c.driver.code, sx + 7, sy + 3);
            }
        }
    }

    // Player & Pit Wall Controls API
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
        if (!car || car.finished) return;
        car.pitRequested = !car.pitRequested;
        if (car.pitRequested) {
            this.emitEventLog(car.driver.code, `📻 BOX, BOX! 이번 랩 종료 시 피트인하여 [${window.F1Data.tireCompounds[car.nextPitTire].name}]로 교체합니다.`);
        } else {
            this.emitEventLog(car.driver.code, `📻 STAY OUT! 피트인 호출을 취소합니다.`);
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
