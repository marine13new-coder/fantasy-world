// =========================================================================
// F1 APEX MOTORSPORT MANAGER - 3D GRAND PRIX CIRCUIT & PHYSICS ENGINE
// Built with Three.js: CatmullRom Spline Track, Red/White FIA Kerbs,
// 20 Ground-Effect F1 Cars, DRS Rear Flap, ERS Glow, Pit Lane, Dynamic Rain
// =========================================================================

class F1Race3DEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.circuit = null;
        this.trackCurve = null;
        this.trackLengthWorld = 1800;
        this.sampledPoints = [];

        this.cars = [];            // 20 Car simulation + 3D Group objects
        this.playerCar = null;     // Car #1 of player's team (or selected driver)
        this.teammateCar = null;   // Car #2 of player's team
        this.followedCar = null;   // Currently watched car in TV/Cockpit cam

        // Camera Modes: 'CHASE' (T-Cam/Rear Chase), 'COCKPIT' (Halo Driver View), 'HELI' (TV Broadcast Helicopter), 'ORBIT' (Trackside Overview)
        this.cameraMode = 'CHASE';
        this.driveControlMode = 'MANUAL'; // 'MANUAL' (Player drives Car 1 + Pit Wall) or 'DIRECTOR' (Full AI Pit Wall Manager)

        // Race State
        this.isRunning = false;
        this.racePhase = 'IDLE'; // 'COUNTDOWN', 'RACING', 'FINISHED'
        this.timeScale = 1.0;    // 0 (Pause), 1x, 2x, 4x
        this.totalLaps = 5;
        this.raceElapsedTime = 0;
        this.safetyCarState = 'GREEN'; // 'GREEN', 'VSC', 'SC'
        this.safetyCarTimer = 0;

        // Weather State
        this.weather = 'DRY';      // 'DRY', 'LIGHT_RAIN', 'HEAVY_RAIN'
        this.trackWater = 0.0;     // 0.0 (Bone dry) to 1.0 (Monsoon)
        this.rainDrops = null;

        // Player Input State (WASD / Arrow Keys + Space ERS + Shift DRS)
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            ers: false,
            drs: false
        };

        // Callbacks to UI
        this.onTelemetryUpdate = null;
        this.onRadioMessage = null;
        this.onRaceFinished = null;

        this.lastFrameTime = performance.now();
        this.uiUpdateAccumulator = 0;

        this.initThree();
        this.bindInputs();
    }

    initThree() {
        if (!this.container) return;
        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b101d);
        this.scene.fog = new THREE.FogExp2(0x0b101d, 0.0012);

        this.camera = new THREE.PerspectiveCamera(62, w / h, 0.4, 2500);
        this.camera.position.set(0, 45, -290);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => this.handleResize());

        // Start animation loop
        const animate = (now) => {
            requestAnimationFrame(animate);
            const rawDt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
            this.lastFrameTime = now;
            if (this.isRunning) {
                this.update(rawDt);
                this.renderer.render(this.scene, this.camera);
            }
        };
        requestAnimationFrame(animate);
    }

    handleResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    bindInputs() {
        window.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.up = true; break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.down = true; break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = true; break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = true; break;
                case 'Space':
                    this.keys.ers = true;
                    if (this.playerCar && this.driveControlMode === 'MANUAL') {
                        this.playerCar.ersMode = 'OVERTAKE';
                    }
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyE':
                    this.togglePlayerDRS();
                    break;
                case 'KeyC':
                    this.cycleCameraMode();
                    break;
                case 'KeyB':
                    if (this.playerCar) {
                        this.requestPitStop(this.playerCar.driver.id, this.playerCar.nextPitTire || 'MEDIUM');
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.up = false; break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.down = false; break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = false; break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = false; break;
                case 'Space':
                    this.keys.ers = false;
                    if (this.playerCar && this.driveControlMode === 'MANUAL' && this.playerCar.ersMode === 'OVERTAKE') {
                        this.playerCar.ersMode = 'BALANCED';
                    }
                    break;
            }
        });
    }

    // Build Procedural 3D Grand Prix Circuit + Environment + 20 F1 Cars
    setupGrandPrix(circuitData, gridOrder, playerTeamId, options = {}) {
        this.circuit = circuitData;
        this.totalLaps = options.laps || circuitData.laps || 5;
        this.driveControlMode = options.driveControlMode || 'MANUAL';
        this.timeScale = 1.0;
        this.raceElapsedTime = 0;
        this.safetyCarState = 'GREEN';
        this.safetyCarTimer = 0;

        // Clear existing scene objects
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        // Initial Weather Roll
        const roll = Math.random();
        if (roll < circuitData.rainChance * 0.45) {
            this.weather = 'HEAVY_RAIN';
            this.trackWater = 0.68;
        } else if (roll < circuitData.rainChance) {
            this.weather = 'LIGHT_RAIN';
            this.trackWater = 0.32;
        } else {
            this.weather = 'DRY';
            this.trackWater = 0.0;
        }

        // Sky & Lighting
        const skyHex = this.weather !== 'DRY' ? 0x1e293b : circuitData.skyColor;
        this.scene.background = new THREE.Color(skyHex);
        this.scene.fog = new THREE.FogExp2(skyHex, this.weather === 'HEAVY_RAIN' ? 0.0022 : 0.0011);

        const ambient = new THREE.AmbientLight(0xffffff, circuitData.timeOfDay === 'night' ? 0.55 : 0.72);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(
            circuitData.timeOfDay === 'sunset' ? 0xffb478 : 0xfff8e7,
            circuitData.timeOfDay === 'night' ? 0.85 : 1.15
        );
        dirLight.position.set(160, 260, 120);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 10;
        dirLight.shadow.camera.far = 900;
        const d = 380;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        this.scene.add(dirLight);

        // Ground Plane
        const groundGeo = new THREE.PlaneGeometry(2400, 2400);
        const groundMat = new THREE.MeshStandardMaterial({
            color: circuitData.groundColor,
            roughness: 0.92,
            metalness: 0.05
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.15;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Build CatmullRom Closed Circuit Curve
        const pts = circuitData.waypoints.map(p => new THREE.Vector3(p[0], 0, p[1]));
        this.trackCurve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.45);
        this.trackLengthWorld = this.trackCurve.getLength();

        this.buildTrackMesh();
        this.buildRainSystem();
        this.spawnCarsOnGrid(gridOrder, playerTeamId, options.startingTires || {});

        this.handleResize();
        this.isRunning = true;
        this.startCountdownSequence();
    }

    buildTrackMesh() {
        const segments = 480;
        const trackHalfWidth = 9.5; // 19m wide FIA Grade 1 track
        const kerbWidth = 1.6;

        const roadPositions = [];
        const roadUvs = [];
        const roadIndices = [];

        const kerbPositions = [];
        const kerbColors = [];
        const kerbIndices = [];

        this.sampledPoints = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const pt = this.trackCurve.getPointAt(t);
            const tangent = this.trackCurve.getTangentAt(t).normalize();
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            if (i < segments) {
                this.sampledPoints.push({ t, pt, tangent, normal });
            }

            const leftEdge = pt.clone().addScaledVector(normal, trackHalfWidth);
            const rightEdge = pt.clone().addScaledVector(normal, -trackHalfWidth);

            roadPositions.push(leftEdge.x, 0.02, leftEdge.z);
            roadPositions.push(rightEdge.x, 0.02, rightEdge.z);
            roadUvs.push(0, t * 80);
            roadUvs.push(1, t * 80);

            // Red & White FIA Kerbs along both sides
            const leftKerbOuter = pt.clone().addScaledVector(normal, trackHalfWidth + kerbWidth);
            const rightKerbOuter = pt.clone().addScaledVector(normal, -(trackHalfWidth + kerbWidth));

            kerbPositions.push(
                leftKerbOuter.x, 0.05, leftKerbOuter.z,
                leftEdge.x, 0.04, leftEdge.z,
                rightEdge.x, 0.04, rightEdge.z,
                rightKerbOuter.x, 0.05, rightKerbOuter.z
            );

            const isRed = (i % 2 === 0);
            const c = isRed ? [0.92, 0.12, 0.16] : [0.96, 0.96, 0.98];
            for (let k = 0; k < 4; k++) {
                kerbColors.push(c[0], c[1], c[2]);
            }

            if (i < segments) {
                const rBase = i * 2;
                roadIndices.push(rBase, rBase + 1, rBase + 2);
                roadIndices.push(rBase + 1, rBase + 3, rBase + 2);

                const kBase = i * 4;
                // Left kerb
                kerbIndices.push(kBase, kBase + 1, kBase + 4);
                kerbIndices.push(kBase + 1, kBase + 5, kBase + 4);
                // Right kerb
                kerbIndices.push(kBase + 2, kBase + 3, kBase + 6);
                kerbIndices.push(kBase + 3, kBase + 7, kBase + 6);
            }
        }

        // Asphalt Mesh
        const roadGeo = new THREE.BufferGeometry();
        roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
        roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
        roadGeo.setIndex(roadIndices);
        roadGeo.computeVertexNormals();

        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x1e222a,
            roughness: this.weather === 'DRY' ? 0.78 : 0.25,
            metalness: this.weather === 'DRY' ? 0.1 : 0.55
        });
        this.roadMat = roadMat;
        const roadMesh = new THREE.Mesh(roadGeo, roadMat);
        roadMesh.receiveShadow = true;
        this.scene.add(roadMesh);

        // Kerbs Mesh
        const kerbGeo = new THREE.BufferGeometry();
        kerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(kerbPositions, 3));
        kerbGeo.setAttribute('color', new THREE.Float32BufferAttribute(kerbColors, 3));
        kerbGeo.setIndex(kerbIndices);
        kerbGeo.computeVertexNormals();

        const kerbMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
        const kerbMesh = new THREE.Mesh(kerbGeo, kerbMat);
        kerbMesh.receiveShadow = true;
        this.scene.add(kerbMesh);

        // Start/Finish Gantry & Checkered Line at t = 0
        this.buildStartFinishGantry(trackHalfWidth);

        // Trackside Grandstands, Floodlights, Trees & Pit Building
        this.buildTracksideScenery(trackHalfWidth);
    }

    buildStartFinishGantry(trackHalfWidth) {
        const startPt = this.trackCurve.getPointAt(0);
        const startTan = this.trackCurve.getTangentAt(0).normalize();
        const startNorm = new THREE.Vector3(-startTan.z, 0, startTan.x).normalize();
        const angle = Math.atan2(startTan.x, startTan.z);

        const gantryGroup = new THREE.Group();
        gantryGroup.position.copy(startPt);
        gantryGroup.rotation.y = angle;

        // Checkered Start Line
        const lineGeo = new THREE.PlaneGeometry(trackHalfWidth * 2, 3.2);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        lineMesh.rotation.x = -Math.PI / 2;
        lineMesh.position.y = 0.06;
        gantryGroup.add(lineMesh);

        // Overhead Bridge Pillars
        const pillarGeo = new THREE.BoxGeometry(1.2, 9.5, 1.2);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.6, roughness: 0.3 });

        const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
        leftPillar.position.set(trackHalfWidth + 2.2, 4.75, 0);
        gantryGroup.add(leftPillar);

        const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
        rightPillar.position.set(-(trackHalfWidth + 2.2), 4.75, 0);
        gantryGroup.add(rightPillar);

        // Overhead Banner Beam
        const beamGeo = new THREE.BoxGeometry((trackHalfWidth + 2.5) * 2, 1.8, 1.6);
        const beamMat = new THREE.MeshStandardMaterial({ color: 0xe10600, roughness: 0.35 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 9.0, 0);
        gantryGroup.add(beam);

        // Pit Garages Complex parallel to Start/Finish Straight (t = 0.95 to 0.04)
        const pitBuildingGeo = new THREE.BoxGeometry(12, 11, 88);
        const pitBuildingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.4 });
        const pitBuilding = new THREE.Mesh(pitBuildingGeo, pitBuildingMat);
        pitBuilding.position.set(-(trackHalfWidth + 13), 5.5, -18);
        pitBuilding.castShadow = true;
        gantryGroup.add(pitBuilding);

        // Glowing Pit Garage Windows
        const glassGeo = new THREE.BoxGeometry(0.4, 3.5, 82);
        const glassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(-(trackHalfWidth + 6.9), 7.2, -18);
        gantryGroup.add(glass);

        this.scene.add(gantryGroup);
    }

    buildTracksideScenery(trackHalfWidth) {
        const isNight = this.circuit.timeOfDay === 'night' || this.circuit.timeOfDay === 'sunset';
        const poleGeo = new THREE.CylinderGeometry(0.25, 0.35, 16, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const bulbGeo = new THREE.BoxGeometry(2.4, 0.6, 1.2);
        const bulbMat = new THREE.MeshBasicMaterial({ color: isNight ? 0xfffbeb : 0x94a3b8 });

        const standGeo = new THREE.BoxGeometry(10, 7, 34);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

        for (let i = 0; i < this.sampledPoints.length; i += 12) {
            const sample = this.sampledPoints[i];
            const angle = Math.atan2(sample.tangent.x, sample.tangent.z);

            // Floodlight poles around the circuit
            const lightGroup = new THREE.Group();
            const offsetSide = (i % 24 === 0) ? 1 : -1;
            lightGroup.position.copy(sample.pt).addScaledVector(sample.normal, offsetSide * (trackHalfWidth + 5.5));
            lightGroup.rotation.y = angle;

            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 8;
            lightGroup.add(pole);

            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.position.set(-offsetSide * 1.0, 16, 0);
            lightGroup.add(bulb);
            this.scene.add(lightGroup);

            // Grandstands at key corners
            if (i % 48 === 24) {
                const stand = new THREE.Mesh(standGeo, standMat);
                stand.position.copy(sample.pt).addScaledVector(sample.normal, (trackHalfWidth + 16));
                stand.position.y = 3.5;
                stand.rotation.y = angle;
                stand.castShadow = true;
                this.scene.add(stand);
            }

            // DRS Zone Green Boards
            this.circuit.drsZones.forEach(zone => {
                if (Math.abs(sample.t - zone[0]) < 0.012) {
                    const drsSign = new THREE.Mesh(
                        new THREE.BoxGeometry(2.4, 1.4, 0.3),
                        new THREE.MeshBasicMaterial({ color: 0x22c55e })
                    );
                    drsSign.position.copy(sample.pt).addScaledVector(sample.normal, trackHalfWidth + 3.2);
                    drsSign.position.y = 2.2;
                    drsSign.rotation.y = angle;
                    this.scene.add(drsSign);
                }
            });
        }
    }

    buildRainSystem() {
        const rainCount = 2200;
        const positions = new Float32Array(rainCount * 3);
        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 220;
            positions[i * 3 + 1] = Math.random() * 60;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
        }
        const rainGeo = new THREE.BufferGeometry();
        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const rainMat = new THREE.PointsMaterial({
            color: 0x93c5fd,
            size: 0.45,
            transparent: true,
            opacity: this.weather === 'DRY' ? 0.0 : (this.weather === 'HEAVY_RAIN' ? 0.75 : 0.42)
        });
        this.rainDrops = new THREE.Points(rainGeo, rainMat);
        this.scene.add(this.rainDrops);
    }

    // Create Detailed Procedural 3D Ground-Effect F1 Car Mesh
    createF1CarMesh(team, driver, tireCompoundKey) {
        const carGroup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: team.carHex,
            metalness: 0.55,
            roughness: 0.25
        });
        const wingMat = new THREE.MeshStandardMaterial({
            color: team.wingHex,
            metalness: 0.4,
            roughness: 0.35
        });
        const carbonMat = new THREE.MeshStandardMaterial({
            color: 0x111318,
            metalness: 0.3,
            roughness: 0.6
        });

        // 1. Venturi Underfloor Plank
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 4.9), carbonMat);
        floor.position.set(0, 0.16, 0);
        floor.castShadow = true;
        carGroup.add(floor);

        // 2. Main Monocoque & Engine Cover Fuselage
        const fuselage = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.46, 3.8), bodyMat);
        fuselage.position.set(0, 0.42, -0.1);
        fuselage.castShadow = true;
        carGroup.add(fuselage);

        // 3. Tapered Nose Cone
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 1.55), bodyMat);
        nose.position.set(0, 0.30, 2.15);
        nose.rotation.x = 0.08;
        carGroup.add(nose);

        // 4. Sculpted Aerodynamic Sidepods (Left & Right)
        const sidepodGeo = new THREE.BoxGeometry(0.52, 0.38, 2.15);
        const leftPod = new THREE.Mesh(sidepodGeo, bodyMat);
        leftPod.position.set(0.64, 0.38, -0.15);
        carGroup.add(leftPod);

        const rightPod = new THREE.Mesh(sidepodGeo, bodyMat);
        rightPod.position.set(-0.64, 0.38, -0.15);
        carGroup.add(rightPod);

        // 5. Shark Fin & Airbox Intake + T-Cam
        const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 1.45), bodyMat);
        airbox.position.set(0, 0.82, -0.55);
        carGroup.add(airbox);

        const tCamMat = new THREE.MeshBasicMaterial({ color: driver.role === 2 ? 0xfacc15 : 0x111111 });
        const tCam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.18), tCamMat);
        tCam.position.set(0, 1.08, -0.25);
        carGroup.add(tCam);

        // 6. Driver Helmet + Titanium Halo Cockpit Protection
        const helmetMat = new THREE.MeshStandardMaterial({
            color: driver.role === 1 ? 0xffffff : 0xfacc15,
            roughness: 0.2,
            metalness: 0.4
        });
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 12), helmetMat);
        helmet.position.set(0, 0.72, 0.25);
        carGroup.add(helmet);

        const haloMat = new THREE.MeshStandardMaterial({ color: team.haloHex, roughness: 0.3, metalness: 0.6 });
        const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.045, 8, 16, Math.PI), haloMat);
        haloRing.rotation.x = Math.PI / 2 + 0.18;
        haloRing.rotation.z = Math.PI;
        haloRing.position.set(0, 0.78, 0.32);
        carGroup.add(haloRing);

        // 7. Multi-Element Front Wing + Endplates
        const frontWing = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.08, 0.52), wingMat);
        frontWing.position.set(0, 0.16, 2.72);
        carGroup.add(frontWing);

        // 8. Rear Wing Assembly + Animated DRS Flap
        const rearSupport = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.45), carbonMat);
        rearSupport.position.set(0, 0.62, -2.28);
        carGroup.add(rearSupport);

        const drsFlap = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.08, 0.36), wingMat);
        drsFlap.position.set(0, 0.94, -2.32);
        carGroup.add(drsFlap);

        // 9. Rear Rain / ERS Harvesting LED Tail Light
        const ersLightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const ersLight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.08), ersLightMat);
        ersLight.position.set(0, 0.36, -2.48);
        carGroup.add(ersLight);

        // 10. 4 Pirelli 18-inch Wheels with Color-Coded Sidewall Rings
        const wheelPositions = [
            [0.92, 0.36, 1.65],  // FL
            [-0.92, 0.36, 1.65], // FR
            [0.94, 0.38, -1.65], // RL
            [-0.94, 0.38, -1.65] // RR
        ];
        const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.38, 16);
        tireGeo.rotateZ(Math.PI / 2);
        const tireRubberMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.85 });

        const compoundInfo = window.F1Data.tireCompounds[tireCompoundKey] || window.F1Data.tireCompounds.MEDIUM;
        const ringGeo = new THREE.TorusGeometry(0.25, 0.032, 8, 20);
        ringGeo.rotateY(Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: compoundInfo.hex });

        const wheels = [];
        const sidewallRings = [];

        wheelPositions.forEach((pos, idx) => {
            const wGroup = new THREE.Group();
            wGroup.position.set(pos[0], pos[1], pos[2]);

            const tireMesh = new THREE.Mesh(tireGeo, tireRubberMat);
            tireMesh.castShadow = true;
            wGroup.add(tireMesh);

            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.x = pos[0] > 0 ? 0.195 : -0.195;
            wGroup.add(ringMesh);
            sidewallRings.push(ringMesh);

            carGroup.add(wGroup);
            wheels.push(wGroup);
        });

        return {
            mesh: carGroup,
            drsFlap,
            ersLightMat,
            wheels,
            sidewallRings,
            ringMat
        };
    }

    spawnCarsOnGrid(gridOrder, playerTeamId, startingTires) {
        this.cars = [];
        this.playerCar = null;
        this.teammateCar = null;

        gridOrder.forEach((driver, index) => {
            const team = window.F1Data.teams.find(t => t.id === driver.teamId) || window.F1Data.teams[0];
            const isPlayerTeam = (driver.teamId === playerTeamId);

            // Auto-select wet tires if race starts in rain unless overridden
            let defaultTire = (index < 10) ? 'SOFT' : 'MEDIUM';
            if (this.weather === 'HEAVY_RAIN') defaultTire = 'WET';
            else if (this.weather === 'LIGHT_RAIN') defaultTire = 'INTER';

            const tireKey = startingTires[driver.id] || defaultTire;
            const visual = this.createF1CarMesh(team, driver, tireKey);

            // Grid Stagger: 2-by-2 starting slots behind the start line
            const startLapProgress = -((index + 1) * 0.0048);
            const gridLateral = (index % 2 === 0) ? -2.6 : 2.6;

            const carObj = {
                driver,
                team,
                isPlayerTeam,
                isPlayerControlled: isPlayerTeam && driver.role === 1,
                gridPosition: index + 1,
                position: index + 1,
                lap: 1,
                lapProgress: (1 + startLapProgress) % 1,
                totalDistanceScore: startLapProgress, // Monotonic race distance

                // Physics & Telemetry
                speedKmh: 0,
                rpm: 4200,
                gear: 1,
                throttle: 0,
                brake: 0,
                lateralOffset: gridLateral,
                targetLateralOffset: gridLateral,

                // Strategy & Resource Systems
                tireCompound: tireKey,
                tireHealth: 100.0,
                tireTemp: 88.0,
                paceMode: 'STANDARD',  // 'PUSH' (Attack), 'STANDARD' (Balanced), 'CONSERVE' (Save Tires)
                ersBattery: 100.0,
                ersMode: 'BALANCED',   // 'OVERTAKE', 'BALANCED', 'HARVEST'
                drsEligible: false,
                drsActive: false,

                // Pit Stop State
                pitRequested: false,
                nextPitTire: 'HARD',
                inPitLane: false,
                pitStopTimer: 0,
                pitStopsCount: 0,

                // Timing
                currentLapTime: 0,
                lastLapTime: 0,
                bestLapTime: 999.9,
                gapToLeader: 0,
                intervalAhead: 0,
                finished: false,
                finishTime: 0,

                // 3D Visuals
                visual
            };

            this.scene.add(visual.mesh);
            this.cars.push(carObj);

            if (isPlayerTeam && driver.role === 1) {
                this.playerCar = carObj;
            } else if (isPlayerTeam && driver.role === 2) {
                this.teammateCar = carObj;
            }
        });

        if (!this.playerCar && this.cars.length > 0) {
            this.playerCar = this.cars[0];
        }
        this.followedCar = this.playerCar;
        this.updateCarTransforms(0.016);
        this.updateCamera(0.016);
    }

    startCountdownSequence() {
        this.racePhase = 'COUNTDOWN';
        this.countdownStep = 0;
        const lightBanner = document.getElementById('fiaStartLightsOverlay');
        if (lightBanner) {
            lightBanner.style.display = 'flex';
            document.querySelectorAll('.fia-red-light').forEach(el => el.classList.remove('lit'));
        }

        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = setInterval(() => {
            this.countdownStep++;
            if (this.countdownStep <= 5) {
                const bulb = document.getElementById(`fiaLight${this.countdownStep}`);
                if (bulb) bulb.classList.add('lit');
                window.f1Audio.playStartLight(false);
            } else {
                clearInterval(this.countdownInterval);
                document.querySelectorAll('.fia-red-light').forEach(el => el.classList.remove('lit'));
                setTimeout(() => {
                    if (lightBanner) lightBanner.style.display = 'none';
                }, 900);
                window.f1Audio.playStartLight(true);
                window.f1Audio.startEngineSound();
                this.racePhase = 'RACING';
                this.emitRadio(
                    this.playerCar ? this.playerCar.driver.code : 'ENG',
                    'LIGHTS OUT AND AWAY WE GO! 초반 코너 타이어 온도와 ERS 배터리를 관리하라!'
                );
            }
        }, 680);
    }

    emitRadio(senderCode, text) {
        window.f1Audio.playRadioBeep();
        if (typeof this.onRadioMessage === 'function') {
            this.onRadioMessage(senderCode, text);
        }
    }

    togglePlayerDRS() {
        if (!this.playerCar) return;
        if (this.playerCar.drsEligible && this.weather === 'DRY') {
            this.playerCar.drsActive = !this.playerCar.drsActive;
            if (this.playerCar.drsActive) window.f1Audio.playDrsBeep();
        }
    }

    cycleCameraMode() {
        const modes = ['CHASE', 'COCKPIT', 'HELI', 'ORBIT'];
        const idx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
        this.cameraMode = modes[idx];
        return this.cameraMode;
    }

    setCameraMode(mode) {
        this.cameraMode = mode;
    }

    setFollowedDriver(driverId) {
        const found = this.cars.find(c => c.driver.id === driverId);
        if (found) this.followedCar = found;
    }

    requestPitStop(driverId, targetCompound) {
        const car = this.cars.find(c => c.driver.id === driverId);
        if (!car || car.finished) return;
        car.pitRequested = !car.pitRequested;
        if (targetCompound) car.nextPitTire = targetCompound;

        if (car.pitRequested) {
            this.emitRadio(
                car.driver.code,
                `Box, Box! 이번 랩 종료 시 피트인하여 [${window.F1Data.tireCompounds[car.nextPitTire].name}] 타이어로 교체합니다.`
            );
        } else {
            this.emitRadio(car.driver.code, 'Stay out, Stay out! 피트인 호출을 취소하고 트랙에 남습니다.');
        }
    }

    setCarPaceAndErs(driverId, paceMode, ersMode) {
        const car = this.cars.find(c => c.driver.id === driverId);
        if (!car) return;
        if (paceMode) car.paceMode = paceMode;
        if (ersMode) car.ersMode = ersMode;
    }

    // Dynamic Weather Evolution
    triggerWeatherChange(newWeather) {
        if (this.weather === newWeather) return;
        this.weather = newWeather;
        if (newWeather === 'DRY') {
            this.emitRadio('METEO', '기상 레이더 업데이트: 비가 그치고 레코드 라인이 빠르게 마르고 있습니다. 슬릭 타이어 전환을 검토하십시오!');
        } else if (newWeather === 'LIGHT_RAIN') {
            this.emitRadio('METEO', '기상청 특보: 서킷 전역에 비가 내리기 시작했습니다! 인터미디어트(Green) 타이어 교체를 권장합니다!');
        } else if (newWeather === 'HEAVY_RAIN') {
            this.emitRadio('METEO', '폭우 경보 발령! 노면 수막 현상이 심각합니다. 풀 웨트(Blue) 타이어가 필수적입니다!');
        }
    }

    // Main Physics & AI Simulation Loop
    update(rawDt) {
        if (this.timeScale === 0) return;
        const dt = rawDt * this.timeScale;

        if (this.racePhase === 'RACING') {
            this.raceElapsedTime += dt;
            this.updateWeatherDynamics(dt);
            this.updateCarsPhysics(dt);
            this.sortStandingsAndGaps();
        } else {
            this.updateCarTransforms(rawDt);
        }

        this.updateCamera(rawDt);

        // Update Engine Synthesizer for followed car
        if (this.followedCar && this.racePhase === 'RACING') {
            window.f1Audio.updateEngineRPM(
                this.followedCar.rpm,
                this.followedCar.throttle,
                this.cameraMode === 'COCKPIT' || this.cameraMode === 'CHASE',
                this.timeScale
            );
        }

        // Throttled UI Telemetry Push (12Hz)
        this.uiUpdateAccumulator += rawDt;
        if (this.uiUpdateAccumulator >= 0.085) {
            this.uiUpdateAccumulator = 0;
            if (typeof this.onTelemetryUpdate === 'function') {
                this.onTelemetryUpdate(this.getRaceSnapshot());
            }
        }
    }

    updateWeatherDynamics(dt) {
        if (this.weather === 'HEAVY_RAIN') {
            this.trackWater = Math.min(1.0, this.trackWater + dt * 0.025);
        } else if (this.weather === 'LIGHT_RAIN') {
            const target = 0.38;
            this.trackWater += (target - this.trackWater) * dt * 0.08;
        } else {
            this.trackWater = Math.max(0.0, this.trackWater - dt * 0.022);
        }

        // Random mid-race weather shift on circuits with rainChance
        if (Math.random() < 0.0005 * this.circuit.rainChance * this.timeScale) {
            const states = ['DRY', 'LIGHT_RAIN', 'HEAVY_RAIN'];
            const next = states[Math.floor(Math.random() * states.length)];
            this.triggerWeatherChange(next);
        }

        if (this.rainDrops && this.followedCar) {
            this.rainDrops.material.opacity = this.weather === 'DRY' ? 0.0 : (this.weather === 'HEAVY_RAIN' ? 0.8 : 0.45);
            if (this.weather !== 'DRY') {
                this.rainDrops.position.x = this.followedCar.visual.mesh.position.x;
                this.rainDrops.position.z = this.followedCar.visual.mesh.position.z;
                const posAttr = this.rainDrops.geometry.attributes.position;
                for (let i = 0; i < posAttr.count; i++) {
                    let y = posAttr.getY(i) - 48 * dt;
                    if (y < 0) y = 55;
                    posAttr.setY(i, y);
                }
                posAttr.needsUpdate = true;
            }
        }
    }

    getTrackCurvatureAt(t) {
        const t1 = (t - 0.012 + 1) % 1;
        const t2 = (t + 0.012) % 1;
        const tan1 = this.trackCurve.getTangentAt(t1);
        const tan2 = this.trackCurve.getTangentAt(t2);
        return tan1.angleTo(tan2); // Radians of corner sharpness (0 = straight, 0.45+ = hairpin)
    }

    isInsideDrsZone(t) {
        return this.circuit.drsZones.some(z => t >= z[0] && t <= z[1]);
    }

    updateCarsPhysics(dt) {
        let allFinished = true;

        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            if (car.finished) continue;
            allFinished = false;

            car.currentLapTime += dt;

            // 1. Check Pit Stop State
            if (car.inPitLane) {
                car.speedKmh = 80; // FIA 80km/h Pit Lane Speed Limiter
                car.rpm = 5800;
                car.gear = 2;
                car.pitStopTimer -= dt;
                if (car.pitStopTimer <= 0) {
                    // Complete Tire Change
                    car.inPitLane = false;
                    car.pitRequested = false;
                    car.tireCompound = car.nextPitTire;
                    car.tireHealth = 100.0;
                    car.tireTemp = 85.0;
                    car.pitStopsCount++;

                    const newComp = window.F1Data.tireCompounds[car.tireCompound];
                    if (newComp && car.visual && car.visual.ringMat) {
                        car.visual.ringMat.color.setHex(newComp.hex);
                    }
                    if (car.isPlayerTeam) {
                        window.f1Audio.playPitWheelGun();
                        this.emitRadio(
                            car.driver.code,
                            `피트스톱 완료! (2.2초) [${newComp.name}] 장착, 그린 트랙 합류!`
                        );
                    }
                }
            }

            // 2. Corner Curvature & Car Performance Envelope
            const t = ((car.lapProgress % 1) + 1) % 1;
            const curvature = this.getTrackCurvatureAt(t);
            const compound = window.F1Data.tireCompounds[car.tireCompound] || window.F1Data.tireCompounds.MEDIUM;

            // Spec multipliers (Aero 80~100, Power 80~100, Driver Pace 78~99)
            const aeroFactor = 0.88 + (car.team.specs.aero / 100) * 0.16;
            const powerFactor = 0.89 + (car.team.specs.powertrain / 100) * 0.16;
            const driverFactor = 0.90 + (car.driver.pace / 100) * 0.13;

            // Tire Grip & Weather Matching Penalty
            let tireGrip = compound.paceBonus;
            if (this.trackWater > 0.18) {
                // Wet surface: Slicks lose massive grip, Inter/Wet shine
                if (car.tireCompound === 'SOFT' || car.tireCompound === 'MEDIUM' || car.tireCompound === 'HARD') {
                    tireGrip *= (1.0 - this.trackWater * 0.42);
                } else if (car.tireCompound === 'INTER') {
                    tireGrip = this.trackWater > 0.62 ? 0.94 : 1.03;
                } else if (car.tireCompound === 'WET') {
                    tireGrip = this.trackWater > 0.55 ? 1.04 : 0.95;
                }
            } else {
                // Bone dry track: Inter/Wet overheat and lose pace
                if (car.tireCompound === 'INTER' || car.tireCompound === 'WET') {
                    tireGrip *= 0.88;
                }
            }

            // Tire Wear Cliff below 30%
            if (car.tireHealth < 35) {
                tireGrip *= (0.84 + (car.tireHealth / 35) * 0.16);
            }

            // Pace Strategy Modifier
            let paceMultiplier = 1.0;
            let wearMultiplier = 1.0;
            if (car.paceMode === 'PUSH') {
                paceMultiplier = 1.024;
                wearMultiplier = 1.38;
            } else if (car.paceMode === 'CONSERVE') {
                paceMultiplier = 0.978;
                wearMultiplier = 0.65;
            }

            // ERS Deployment & Harvesting
            let ersBoost = 1.0;
            if (car.ersMode === 'OVERTAKE' && car.ersBattery > 2.0 && curvature < 0.18) {
                ersBoost = 1.036;
                car.ersBattery = Math.max(0, car.ersBattery - dt * 6.8);
            } else if (car.ersMode === 'HARVEST' || curvature > 0.22) {
                ersBoost = car.ersMode === 'HARVEST' ? 0.985 : 1.0;
                car.ersBattery = Math.min(100, car.ersBattery + dt * 4.5);
            } else {
                // Balanced
                if (curvature < 0.10 && car.ersBattery > 25) {
                    ersBoost = 1.012;
                    car.ersBattery = Math.max(0, car.ersBattery - dt * 1.8);
                }
            }

            // DRS Eligibility & Boost (+14 km/h on DRS zones when gap < 1.0s)
            const inDrsZone = this.isInsideDrsZone(t);
            car.drsEligible = inDrsZone && (car.position > 1 && car.intervalAhead <= 1.05) && this.weather === 'DRY';
            if (!inDrsZone || this.weather !== 'DRY') {
                car.drsActive = false;
            } else if (car.drsEligible && (!car.isPlayerControlled || this.driveControlMode === 'DIRECTOR')) {
                car.drsActive = true; // AI & Pit Wall auto-activate DRS when eligible
            }
            const drsBoost = car.drsActive ? 1.045 : 1.0;

            // Target Optimal Speed at Current Track Point (105 km/h hairpin -> 352 km/h straight)
            const cornerSlowdown = Math.min(0.68, curvature * 1.45);
            const baseCornerSpeed = 338 * (1.0 - cornerSlowdown * (1.08 / aeroFactor));
            let targetSpeedKmh = baseCornerSpeed * powerFactor * driverFactor * tireGrip * paceMultiplier * ersBoost * drsBoost;

            // Manual Keyboard Controls Override for Player Car #1
            if (car.isPlayerControlled && this.driveControlMode === 'MANUAL' && !car.inPitLane) {
                if (this.keys.up) {
                    targetSpeedKmh *= 1.028; // Full manual push
                } else if (this.keys.down) {
                    targetSpeedKmh *= 0.72;  // Manual heavy braking
                }

                // Steering A / D
                if (this.keys.left) {
                    car.targetLateralOffset = Math.min(6.8, car.lateralOffset + 9.5 * dt);
                } else if (this.keys.right) {
                    car.targetLateralOffset = Math.max(-6.8, car.lateralOffset - 9.5 * dt);
                }
                // Off-line kerb penalty if cornering too fast while wide
                if (Math.abs(car.lateralOffset) > 5.8 && curvature > 0.22) {
                    targetSpeedKmh *= 0.94;
                }
            } else if (!car.inPitLane) {
                // AI Overtaking & Racing Line Weaving
                this.updateAiRacingLine(car, dt, curvature);
            }

            if (!car.inPitLane) {
                const accelRate = (targetSpeedKmh > car.speedKmh) ? 85 : 155;
                car.throttle = targetSpeedKmh > car.speedKmh ? 1.0 : 0.15;
                car.brake = targetSpeedKmh < car.speedKmh - 15 ? 1.0 : 0.0;
                car.speedKmh += Math.sign(targetSpeedKmh - car.speedKmh) * Math.min(Math.abs(targetSpeedKmh - car.speedKmh), accelRate * dt);
                car.speedKmh = Math.max(75, Math.min(362, car.speedKmh));
            }

            // Compute Gear (1~8) & RPM (8500~15000)
            const prevGear = car.gear;
            car.gear = Math.max(1, Math.min(8, Math.floor((car.speedKmh / 345) * 8) + 1));
            if (car === this.followedCar && car.gear !== prevGear && this.timeScale === 1) {
                window.f1Audio.playGearShift(car.gear > prevGear);
            }
            const gearMinSpeed = (car.gear - 1) * 42;
            const gearRatio = Math.max(0, Math.min(1, (car.speedKmh - gearMinSpeed) / 48));
            car.rpm = Math.round(9200 + gearRatio * 5600);

            // Advance Car Along Spline
            const lapDelta = ((car.speedKmh * 0.27778) / this.trackLengthWorld) * dt * 1.55;
            const prevProgress = car.lapProgress;
            car.lapProgress += lapDelta;
            car.totalDistanceScore += lapDelta;

            // Smooth Lateral Movement
            car.lateralOffset += (car.targetLateralOffset - car.lateralOffset) * Math.min(1, dt * 5.5);

            // Continuous Tire Degradation & Temperature
            const chassisFactor = 1.15 - (car.team.specs.chassis / 100) * 0.25;
            const driverTireFactor = 1.12 - (car.driver.tireMgmt / 100) * 0.22;
            const wearPerSec = (compound.wearPerLap / 68) * this.circuit.tireWearRate * wearMultiplier * chassisFactor * driverTireFactor;
            car.tireHealth = Math.max(0, car.tireHealth - wearPerSec * dt);

            const targetTemp = (car.paceMode === 'PUSH' ? 108 : (car.paceMode === 'CONSERVE' ? 86 : 96)) - (this.trackWater * 25);
            car.tireTemp += (targetTemp - car.tireTemp) * dt * 0.5;

            // Check Lap Crossing (prevProgress < 1 && car.lapProgress >= 1)
            if (car.lapProgress >= 1.0) {
                car.lapProgress -= 1.0;

                // Record Lap Time
                if (car.lap >= 1) {
                    car.lastLapTime = car.currentLapTime;
                    if (car.lastLapTime < car.bestLapTime && car.lastLapTime > 25) {
                        car.bestLapTime = car.lastLapTime;
                    }
                }
                car.currentLapTime = 0;

                // Enter Pit Lane if requested and not final lap
                if (car.pitRequested && car.lap < this.totalLaps) {
                    car.inPitLane = true;
                    const pitCrewBonus = (car.team.specs.durability - 80) * 0.04;
                    car.pitStopTimer = Math.max(1.9, 3.4 - pitCrewBonus);
                }

                // AI Automatic Pit Strategy Evaluation at end of lap
                if (!car.isPlayerTeam && car.lap < this.totalLaps) {
                    this.evaluateAiPitStrategy(car);
                } else if (car.isPlayerTeam && car.tireHealth < 28 && !car.pitRequested && car.lap < this.totalLaps) {
                    this.emitRadio(
                        car.driver.code,
                        `타이어 수명이 ${Math.round(car.tireHealth)}%로 한계에 도달했습니다! 지금 즉시 [BOX 피트인] 명령을 내려주세요!`
                    );
                }

                if (car.lap >= this.totalLaps) {
                    car.finished = true;
                    car.finishTime = this.raceElapsedTime;
                    if (car === this.playerCar) {
                        this.emitRadio(car.driver.code, `체커기 통과! P${car.position} 피니시! 위대한 레이스였습니다!`);
                    }
                } else {
                    car.lap++;
                }
            }
        }

        this.updateCarTransforms(dt);

        // If Player's both cars finished or all cars finished, complete the Grand Prix
        const playerCarsFinished = this.cars.filter(c => c.isPlayerTeam).every(c => c.finished);
        if (allFinished || playerCarsFinished) {
            this.finishGrandPrixInstant();
        }
    }

    updateAiRacingLine(car, dt, curvature) {
        // Default ideal racing line shifts from outside to apex
        let idealOffset = Math.sin(car.lapProgress * Math.PI * 8) * 2.2;

        // Check if blocked by a slower car immediately ahead
        for (let j = 0; j < this.cars.length; j++) {
            const other = this.cars[j];
            if (other === car || other.finished) continue;
            const distDiff = other.totalDistanceScore - car.totalDistanceScore;
            if (distDiff > 0 && distDiff < 0.018 && Math.abs(other.lateralOffset - car.lateralOffset) < 2.2) {
                // Pull out to slipstream & overtake
                idealOffset = other.lateralOffset > 0 ? -3.8 : 3.8;
                break;
            }
        }
        car.targetLateralOffset = idealOffset;
    }

    evaluateAiPitStrategy(car) {
        if (car.pitRequested) return;
        const needWet = this.trackWater > 0.52 && car.tireCompound !== 'WET';
        const needInter = this.trackWater > 0.20 && this.trackWater <= 0.52 && car.tireCompound !== 'INTER';
        const needSlick = this.trackWater < 0.14 && (car.tireCompound === 'INTER' || car.tireCompound === 'WET');

        if (needWet) {
            car.pitRequested = true;
            car.nextPitTire = 'WET';
        } else if (needInter) {
            car.pitRequested = true;
            car.nextPitTire = 'INTER';
        } else if (needSlick) {
            car.pitRequested = true;
            car.nextPitTire = (this.totalLaps - car.lap <= 2) ? 'SOFT' : 'MEDIUM';
        } else if (car.tireHealth < 32) {
            car.pitRequested = true;
            car.nextPitTire = (this.totalLaps - car.lap <= 2) ? 'SOFT' : 'HARD';
        }
    }

    updateCarTransforms(dt) {
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            const t = ((car.lapProgress % 1) + 1) % 1;
            const pt = this.trackCurve.getPointAt(t);
            const tangent = this.trackCurve.getTangentAt(t).normalize();
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            const lateral = car.inPitLane ? -(9.5 + 4.2) : car.lateralOffset;
            const worldPos = pt.clone().addScaledVector(normal, lateral);

            car.visual.mesh.position.copy(worldPos);
            const lookTarget = worldPos.clone().add(tangent);
            car.visual.mesh.lookAt(lookTarget);

            // Spin 4 Pirelli wheels
            const wheelRot = (car.speedKmh * 0.12) * dt;
            car.visual.wheels.forEach(w => {
                w.rotation.x += wheelRot;
            });

            // Animate DRS Rear Wing Flap
            car.visual.drsFlap.rotation.x = car.drsActive ? -0.42 : 0.0;

            // Animate ERS Tail Light (Green when Overtake active, Red blinking when Harvesting/Wet)
            if (car.ersMode === 'OVERTAKE') {
                car.visual.ersLightMat.color.setHex(0x00ff66);
            } else {
                car.visual.ersLightMat.color.setHex(0xff0033);
            }
        }
    }

    sortStandingsAndGaps() {
        const sorted = [...this.cars].sort((a, b) => {
            if (a.finished && b.finished) return a.finishTime - b.finishTime;
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.totalDistanceScore - a.totalDistanceScore;
        });

        const leader = sorted[0];
        sorted.forEach((car, idx) => {
            car.position = idx + 1;
            if (idx === 0) {
                car.gapToLeader = 0;
                car.intervalAhead = 0;
            } else {
                const ahead = sorted[idx - 1];
                const distToLeader = Math.max(0, leader.totalDistanceScore - car.totalDistanceScore);
                const distToAhead = Math.max(0, ahead.totalDistanceScore - car.totalDistanceScore);
                car.gapToLeader = +(distToLeader * (this.circuit.baseLapTime * 0.55)).toFixed(3);
                car.intervalAhead = +(distToAhead * (this.circuit.baseLapTime * 0.55)).toFixed(3);
            }
        });
    }

    updateCamera(dt) {
        if (!this.followedCar || !this.followedCar.visual) return;
        const targetMesh = this.followedCar.visual.mesh;
        const carPos = targetMesh.position.clone();

        const t = ((this.followedCar.lapProgress % 1) + 1) % 1;
        const tangent = this.trackCurve.getTangentAt(t).normalize();

        if (this.cameraMode === 'CHASE') {
            // F1 Broadcast Dynamic Chase Camera
            const desiredCamPos = carPos.clone()
                .addScaledVector(tangent, -11.5)
                .add(new THREE.Vector3(0, 4.2, 0));
            this.camera.position.lerp(desiredCamPos, Math.min(1, dt * 10));
            const lookAtPos = carPos.clone().addScaledVector(tangent, 12).add(new THREE.Vector3(0, 1.0, 0));
            this.camera.lookAt(lookAtPos);
        } else if (this.cameraMode === 'COCKPIT') {
            // Onboard T-Cam / Halo Cockpit View
            const cockpitPos = carPos.clone()
                .addScaledVector(tangent, 0.15)
                .add(new THREE.Vector3(0, 1.22, 0));
            this.camera.position.copy(cockpitPos);
            const lookAhead = carPos.clone().addScaledVector(tangent, 32).add(new THREE.Vector3(0, 0.85, 0));
            this.camera.lookAt(lookAhead);
        } else if (this.cameraMode === 'HELI') {
            // TV Helicopter Tracking Shot
            const heliPos = carPos.clone()
                .addScaledVector(tangent, -28)
                .add(new THREE.Vector3(24, 34, 18));
            this.camera.position.lerp(heliPos, Math.min(1, dt * 4.5));
            this.camera.lookAt(carPos.clone().addScaledVector(tangent, 6));
        } else if (this.cameraMode === 'ORBIT') {
            // High-altitude Pit Wall Tactical Overview
            const angle = performance.now() * 0.00015;
            this.camera.position.set(Math.cos(angle) * 340, 230, Math.sin(angle) * 340);
            this.camera.lookAt(0, 0, 0);
        }
    }

    finishGrandPrixInstant() {
        if (this.racePhase === 'FINISHED') return;
        this.racePhase = 'FINISHED';
        window.f1Audio.stopEngineSound();

        // Simulate remaining cars to completion
        this.sortStandingsAndGaps();
        const results = [...this.cars].sort((a, b) => a.position - b.position);
        if (typeof this.onRaceFinished === 'function') {
            this.onRaceFinished(results);
        }
    }

    getRaceSnapshot() {
        const sorted = [...this.cars].sort((a, b) => a.position - b.position);
        const leaderLap = sorted.length > 0 ? sorted[0].lap : 1;
        return {
            phase: this.racePhase,
            lap: leaderLap,
            totalLaps: this.totalLaps,
            weather: this.weather,
            trackWater: Math.round(this.trackWater * 100),
            timeScale: this.timeScale,
            cameraMode: this.cameraMode,
            driveControlMode: this.driveControlMode,
            standings: sorted,
            playerCar: this.playerCar,
            teammateCar: this.teammateCar,
            followedCar: this.followedCar
        };
    }
}

window.F1Race3DEngine = F1Race3DEngine;
