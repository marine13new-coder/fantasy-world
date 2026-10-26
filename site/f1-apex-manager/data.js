// ============================================================================
// F1 MANAGER & 3D GRAND PRIX SIMULATOR - AUTHENTIC 24-CIRCUIT GEOMETRY,
// REGIONAL BIOME SCENERY, CAR TUNING TELEMETRY & FIA CHAMPIONSHIP DATABASE
// ============================================================================

window.F1Data = {
    // Race Distance Presets (Default = FULL 100% Real FIA Laps!)
    raceFormats: {
        FULL:   { id: 'FULL',   label: 'FULL GP (100% 실제 랩수)', scale: 1.00, wearMult: 1.0,  fuelMult: 1.0,  desc: '실제 FIA F1 그랑프리 규정과 100% 동일한 실제 바퀴수(44~78 Laps) 정규 레이스' },
        HALF:   { id: 'HALF',   label: 'HALF GP (50% 거리)',      scale: 0.50, wearMult: 1.75, fuelMult: 1.75, desc: '실제 바퀴수의 50%를 주행하며 1~2스톱 언더컷 전략이 압축된 레이스' },
        SPRINT: { id: 'SPRINT', label: 'SPRINT (25% 거리)',       scale: 0.25, wearMult: 2.8,  fuelMult: 2.8,  desc: '실제 바퀴수의 25%(12~20 Laps)로 진행되는 공식 스프린트 레이스' },
        QUICK:  { id: 'QUICK',  label: 'QUICK RACE (5 Laps)',     scale: 0.0,  fixedLaps: 5, wearMult: 5.0, fuelMult: 5.0, desc: '빠른 주행 테스트 및 단기 승부를 위한 5랩 레이스' }
    },

    // Default Car Setup & Tuning Parameters (Testable in R&D Shakedown Bench)
    defaultTuning: {
        frontWingAngle: 6,     // 1 (Low Drag) ~ 11 (Max Downforce)
        rearWingAngle: 6,      // 1 (Monza Spec) ~ 11 (Monaco Spec)
        suspensionStiffness: 6,// 1 (Soft Kerb Riding) ~ 10 (Stiff Responsive)
        brakeBias: 56,         // 50% ~ 62% Frontward
        diffEntry: 65,         // 50% ~ 100% Differential Lock
        tirePressurePsi: 22.5  // 20.0 ~ 25.0 PSI
    },

    // 10 Official Formula 1 Constructors
    teams: [
        {
            id: 'ferrari',
            name: 'Scuderia Ferrari HP',
            shortName: 'Ferrari',
            code: 'FER',
            country: 'ITA',
            hq: 'Maranello, Italy',
            principal: 'Fred Vasseur',
            powerUnit: 'Ferrari 066/12',
            primaryColor: '#E8002D',
            secondaryColor: '#FFF200',
            carHex: 0xd4001a,
            wingHex: 0x111111,
            haloHex: 0x111111,
            budget: 145000000,
            prestige: 99,
            specs: { aero: 95, powertrain: 96, chassis: 94, durability: 92 },
            facilities: { windTunnel: 5, cfd: 4, simulator: 5, pitCrew: 94 },
            sponsors: {
                title: { name: 'HP Enterprise', perRace: 4500000, targetPos: 2, bonus: 2200000 },
                partners: [
                    { name: 'Shell V-Power', perRace: 1400000 },
                    { name: 'UniCredit', perRace: 1100000 },
                    { name: 'Puma Motorsport', perRace: 850000 }
                ]
            }
        },
        {
            id: 'redbull',
            name: 'Oracle Red Bull Racing',
            shortName: 'Red Bull Racing',
            code: 'RBR',
            country: 'AUT',
            hq: 'Milton Keynes, UK',
            principal: 'Christian Horner',
            powerUnit: 'Honda RBPT',
            primaryColor: '#3671C6',
            secondaryColor: '#EF1A2D',
            carHex: 0x0a1338,
            wingHex: 0xef1a2d,
            haloHex: 0x0a1338,
            budget: 145000000,
            prestige: 98,
            specs: { aero: 96, powertrain: 96, chassis: 94, durability: 92 },
            facilities: { windTunnel: 5, cfd: 5, simulator: 5, pitCrew: 97 },
            sponsors: {
                title: { name: 'Oracle Cloud', perRace: 4400000, targetPos: 2, bonus: 2100000 },
                partners: [
                    { name: 'Tag Heuer', perRace: 1200000 },
                    { name: 'Mobil 1', perRace: 1050000 },
                    { name: 'Visa', perRace: 900000 }
                ]
            }
        },
        {
            id: 'mclaren',
            name: 'McLaren Formula 1 Team',
            shortName: 'McLaren',
            code: 'MCL',
            country: 'GBR',
            hq: 'Woking, UK',
            principal: 'Andrea Stella',
            powerUnit: 'Mercedes-AMG M15',
            primaryColor: '#FF8000',
            secondaryColor: '#00C8FF',
            carHex: 0xff7700,
            wingHex: 0x16181d,
            haloHex: 0x16181d,
            budget: 143000000,
            prestige: 97,
            specs: { aero: 97, powertrain: 95, chassis: 96, durability: 94 },
            facilities: { windTunnel: 5, cfd: 5, simulator: 5, pitCrew: 96 },
            sponsors: {
                title: { name: 'Mastercard & OKX', perRace: 4200000, targetPos: 2, bonus: 2000000 },
                partners: [
                    { name: 'Google Chrome', perRace: 1350000 },
                    { name: 'Dell Technologies', perRace: 950000 },
                    { name: 'Monster Energy', perRace: 800000 }
                ]
            }
        },
        {
            id: 'mercedes',
            name: 'Mercedes-AMG PETRONAS F1',
            shortName: 'Mercedes',
            code: 'MER',
            country: 'GER',
            hq: 'Brackley, UK',
            principal: 'Toto Wolff',
            powerUnit: 'Mercedes-AMG M15',
            primaryColor: '#27F4D2',
            secondaryColor: '#C0C0C0',
            carHex: 0x111720,
            wingHex: 0x00d2be,
            haloHex: 0xc0c0c0,
            budget: 141000000,
            prestige: 95,
            specs: { aero: 93, powertrain: 95, chassis: 93, durability: 95 },
            facilities: { windTunnel: 5, cfd: 4, simulator: 5, pitCrew: 94 },
            sponsors: {
                title: { name: 'PETRONAS Syntium', perRace: 4000000, targetPos: 3, bonus: 1700000 },
                partners: [
                    { name: 'INEOS', perRace: 1300000 },
                    { name: 'SAP', perRace: 950000 },
                    { name: 'IWC Schaffhausen', perRace: 750000 }
                ]
            }
        },
        {
            id: 'astonmartin',
            name: 'Aston Martin Aramco F1',
            shortName: 'Aston Martin',
            code: 'AMR',
            country: 'GBR',
            hq: 'Silverstone, UK',
            principal: 'Andy Cowell',
            powerUnit: 'Mercedes-AMG M15',
            primaryColor: '#229971',
            secondaryColor: '#CEDC00',
            carHex: 0x00594f,
            wingHex: 0xcedc00,
            haloHex: 0x00594f,
            budget: 136000000,
            prestige: 87,
            specs: { aero: 88, powertrain: 93, chassis: 87, durability: 90 },
            facilities: { windTunnel: 5, cfd: 4, simulator: 4, pitCrew: 89 },
            sponsors: {
                title: { name: 'Aramco', perRace: 3600000, targetPos: 5, bonus: 1300000 },
                partners: [
                    { name: 'Cognizant', perRace: 1050000 },
                    { name: 'Valvoline', perRace: 800000 }
                ]
            }
        },
        {
            id: 'williams',
            name: 'Atlassian Williams Racing',
            shortName: 'Williams',
            code: 'WIL',
            country: 'GBR',
            hq: 'Grove, UK',
            principal: 'James Vowles',
            powerUnit: 'Mercedes-AMG M15',
            primaryColor: '#64C4FF',
            secondaryColor: '#005AFF',
            carHex: 0x0046ad,
            wingHex: 0x00a0de,
            haloHex: 0x0046ad,
            budget: 126000000,
            prestige: 85,
            specs: { aero: 85, powertrain: 93, chassis: 86, durability: 88 },
            facilities: { windTunnel: 3, cfd: 4, simulator: 3, pitCrew: 87 },
            sponsors: {
                title: { name: 'Atlassian & Komatsu', perRace: 2800000, targetPos: 7, bonus: 1100000 },
                partners: [
                    { name: 'Duracell', perRace: 850000 },
                    { name: 'Gulf Oil', perRace: 750000 }
                ]
            }
        },
        {
            id: 'alpine',
            name: 'BWT Alpine F1 Team',
            shortName: 'Alpine',
            code: 'ALP',
            country: 'FRA',
            hq: 'Enstone, UK',
            principal: 'Oliver Oakes',
            powerUnit: 'Renault E-Tech',
            primaryColor: '#0093CC',
            secondaryColor: '#FF87BC',
            carHex: 0x0055b3,
            wingHex: 0xff4da6,
            haloHex: 0x111111,
            budget: 124000000,
            prestige: 81,
            specs: { aero: 85, powertrain: 84, chassis: 85, durability: 85 },
            facilities: { windTunnel: 3, cfd: 3, simulator: 3, pitCrew: 85 },
            sponsors: {
                title: { name: 'BWT Water', perRace: 2600000, targetPos: 8, bonus: 950000 },
                partners: [
                    { name: 'Castrol', perRace: 800000 },
                    { name: 'Eni', perRace: 650000 }
                ]
            }
        },
        {
            id: 'rb',
            name: 'Visa Cash App Racing Bulls',
            shortName: 'Racing Bulls',
            code: 'RB',
            country: 'ITA',
            hq: 'Faenza, Italy',
            principal: 'Laurent Mekies',
            powerUnit: 'Honda RBPT',
            primaryColor: '#6692FF',
            secondaryColor: '#FFFFFF',
            carHex: 0x1634cb,
            wingHex: 0xffffff,
            haloHex: 0xff0040,
            budget: 120000000,
            prestige: 79,
            specs: { aero: 84, powertrain: 93, chassis: 84, durability: 86 },
            facilities: { windTunnel: 3, cfd: 3, simulator: 3, pitCrew: 85 },
            sponsors: {
                title: { name: 'Visa Cash App', perRace: 2450000, targetPos: 8, bonus: 900000 },
                partners: [
                    { name: 'Hugo Boss', perRace: 720000 },
                    { name: 'Tudor', perRace: 600000 }
                ]
            }
        },
        {
            id: 'haas',
            name: 'MoneyGram Haas F1 Team',
            shortName: 'Haas',
            code: 'HAA',
            country: 'USA',
            hq: 'Kannapolis, USA',
            principal: 'Ayao Komatsu',
            powerUnit: 'Ferrari 066/12',
            primaryColor: '#B6BABD',
            secondaryColor: '#E6002B',
            carHex: 0x1a1c20,
            wingHex: 0xe6002b,
            haloHex: 0xffffff,
            budget: 118000000,
            prestige: 76,
            specs: { aero: 83, powertrain: 94, chassis: 83, durability: 86 },
            facilities: { windTunnel: 3, cfd: 3, simulator: 3, pitCrew: 82 },
            sponsors: {
                title: { name: 'MoneyGram & Toyota Gazoo', perRace: 2350000, targetPos: 9, bonus: 850000 },
                partners: [
                    { name: 'Haas Automation', perRace: 700000 },
                    { name: 'Chipotle', perRace: 550000 }
                ]
            }
        },
        {
            id: 'sauber',
            name: 'Stake F1 Team Kick Sauber',
            shortName: 'Kick Sauber',
            code: 'SAU',
            country: 'SUI',
            hq: 'Hinwil, Switzerland',
            principal: 'Mattia Binotto',
            powerUnit: 'Ferrari 066/12',
            primaryColor: '#52E252',
            secondaryColor: '#090D16',
            carHex: 0x11151c,
            wingHex: 0x00ff44,
            haloHex: 0x00ff44,
            budget: 118000000,
            prestige: 77,
            specs: { aero: 81, powertrain: 90, chassis: 82, durability: 84 },
            facilities: { windTunnel: 3, cfd: 3, simulator: 3, pitCrew: 80 },
            sponsors: {
                title: { name: 'Stake & Audi Sport', perRace: 2300000, targetPos: 10, bonus: 900000 },
                partners: [
                    { name: 'Kick Streaming', perRace: 750000 },
                    { name: 'Pirelli Partner', perRace: 500000 }
                ]
            }
        }
    ],

    // 20 Official Grid Drivers + 6 Reserve/Free Agent Drivers
    drivers: [
        { id: 'leclerc', name: 'Charles Leclerc', korName: '샤를 르클레르', code: 'LEC', number: 16, teamId: 'ferrari', role: 1, nat: 'MON', age: 27, ovr: 95, pace: 98, racecraft: 94, consistency: 92, tireMgmt: 92, wetSkill: 93, salary: 1550000 },
        { id: 'hamilton', name: 'Lewis Hamilton', korName: '루이스 해밀턴', code: 'HAM', number: 44, teamId: 'ferrari', role: 2, nat: 'GBR', age: 40, ovr: 94, pace: 93, racecraft: 96, consistency: 95, tireMgmt: 97, wetSkill: 97, salary: 1750000 },
        { id: 'verstappen', name: 'Max Verstappen', korName: '막스 베르스타펜', code: 'VER', number: 1, teamId: 'redbull', role: 1, nat: 'NED', age: 27, ovr: 98, pace: 99, racecraft: 97, consistency: 97, tireMgmt: 96, wetSkill: 98, salary: 1900000 },
        { id: 'lawson', name: 'Liam Lawson', korName: '리암 로슨', code: 'LAW', number: 30, teamId: 'redbull', role: 2, nat: 'NZL', age: 23, ovr: 84, pace: 85, racecraft: 86, consistency: 82, tireMgmt: 82, wetSkill: 84, salary: 360000 },
        { id: 'norris', name: 'Lando Norris', korName: '랜도 노리스', code: 'NOR', number: 4, teamId: 'mclaren', role: 1, nat: 'GBR', age: 25, ovr: 95, pace: 96, racecraft: 93, consistency: 94, tireMgmt: 95, wetSkill: 95, salary: 1400000 },
        { id: 'piastri', name: 'Oscar Piastri', korName: '오스카 피아스트리', code: 'PIA', number: 81, teamId: 'mclaren', role: 2, nat: 'AUS', age: 24, ovr: 93, pace: 94, racecraft: 94, consistency: 94, tireMgmt: 91, wetSkill: 91, salary: 1050000 },
        { id: 'russell', name: 'George Russell', korName: '조지 러셀', code: 'RUS', number: 63, teamId: 'mercedes', role: 1, nat: 'GBR', age: 27, ovr: 92, pace: 94, racecraft: 91, consistency: 91, tireMgmt: 91, wetSkill: 92, salary: 1150000 },
        { id: 'antonelli', name: 'Kimi Antonelli', korName: '키미 안토넬리', code: 'ANT', number: 12, teamId: 'mercedes', role: 2, nat: 'ITA', age: 18, ovr: 84, pace: 88, racecraft: 83, consistency: 80, tireMgmt: 81, wetSkill: 85, salary: 300000 },
        { id: 'alonso', name: 'Fernando Alonso', korName: '페르난도 알론소', code: 'ALO', number: 14, teamId: 'astonmartin', role: 1, nat: 'ESP', age: 43, ovr: 91, pace: 90, racecraft: 96, consistency: 95, tireMgmt: 94, wetSkill: 95, salary: 1150000 },
        { id: 'stroll', name: 'Lance Stroll', korName: '랜스 스트롤', code: 'STR', number: 18, teamId: 'astonmartin', role: 2, nat: 'CAN', age: 26, ovr: 80, pace: 80, racecraft: 81, consistency: 77, tireMgmt: 81, wetSkill: 86, salary: 320000 },
        { id: 'sainz', name: 'Carlos Sainz', korName: '카를로스 사인츠', code: 'SAI', number: 55, teamId: 'williams', role: 1, nat: 'ESP', age: 30, ovr: 91, pace: 91, racecraft: 92, consistency: 93, tireMgmt: 91, wetSkill: 90, salary: 980000 },
        { id: 'albon', name: 'Alexander Albon', korName: '알렉산더 알본', code: 'ALB', number: 23, teamId: 'williams', role: 2, nat: 'THA', age: 29, ovr: 87, pace: 88, racecraft: 87, consistency: 87, tireMgmt: 88, wetSkill: 86, salary: 620000 },
        { id: 'gasly', name: 'Pierre Gasly', korName: '피에르 가슬리', code: 'GAS', number: 10, teamId: 'alpine', role: 1, nat: 'FRA', age: 29, ovr: 87, pace: 88, racecraft: 87, consistency: 86, tireMgmt: 86, wetSkill: 88, salary: 650000 },
        { id: 'doohan', name: 'Jack Doohan', korName: '잭 두한', code: 'DOO', number: 7, teamId: 'alpine', role: 2, nat: 'AUS', age: 22, ovr: 79, pace: 81, racecraft: 79, consistency: 78, tireMgmt: 78, wetSkill: 79, salary: 210000 },
        { id: 'tsunoda', name: 'Yuki Tsunoda', korName: '츠노다 유키', code: 'TSU', number: 22, teamId: 'rb', role: 1, nat: 'JPN', age: 24, ovr: 86, pace: 87, racecraft: 85, consistency: 83, tireMgmt: 84, wetSkill: 84, salary: 480000 },
        { id: 'hadjar', name: 'Isack Hadjar', korName: '아이작 하자르', code: 'HAD', number: 6, teamId: 'rb', role: 2, nat: 'FRA', age: 20, ovr: 80, pace: 83, racecraft: 80, consistency: 77, tireMgmt: 78, wetSkill: 79, salary: 200000 },
        { id: 'ocon', name: 'Esteban Ocon', korName: '에스테반 오콘', code: 'OCO', number: 31, teamId: 'haas', role: 1, nat: 'FRA', age: 28, ovr: 86, pace: 86, racecraft: 87, consistency: 84, tireMgmt: 86, wetSkill: 88, salary: 550000 },
        { id: 'bearman', name: 'Oliver Bearman', korName: '올리버 베어먼', code: 'BEA', number: 87, teamId: 'haas', role: 2, nat: 'GBR', age: 19, ovr: 82, pace: 84, racecraft: 83, consistency: 80, tireMgmt: 79, wetSkill: 81, salary: 240000 },
        { id: 'hulkenberg', name: 'Nico Hulkenberg', korName: '니코 휠켄베르크', code: 'HUL', number: 27, teamId: 'sauber', role: 1, nat: 'GER', age: 37, ovr: 86, pace: 88, racecraft: 85, consistency: 88, tireMgmt: 85, wetSkill: 87, salary: 580000 },
        { id: 'bortoleto', name: 'Gabriel Bortoleto', korName: '가브리엘 보르톨레토', code: 'BOR', number: 5, teamId: 'sauber', role: 2, nat: 'BRA', age: 20, ovr: 81, pace: 83, racecraft: 82, consistency: 81, tireMgmt: 80, wetSkill: 80, salary: 220000 },
        // Reserve & FA Pool
        { id: 'perez', name: 'Sergio Perez', korName: '세르히오 페레즈', code: 'PER', number: 11, teamId: null, role: 0, nat: 'MEX', age: 35, ovr: 86, pace: 84, racecraft: 88, consistency: 86, tireMgmt: 92, wetSkill: 83, salary: 720000 },
        { id: 'bottas', name: 'Valtteri Bottas', korName: '발테리 보타스', code: 'BOT', number: 77, teamId: null, role: 0, nat: 'FIN', age: 35, ovr: 85, pace: 87, racecraft: 83, consistency: 89, tireMgmt: 85, wetSkill: 82, salary: 520000 },
        { id: 'colapinto', name: 'Franco Colapinto', korName: '프랑코 콜라핀토', code: 'COL', number: 43, teamId: null, role: 0, nat: 'ARG', age: 21, ovr: 83, pace: 85, racecraft: 84, consistency: 81, tireMgmt: 81, wetSkill: 82, salary: 270000 },
        { id: 'ricciardo', name: 'Daniel Ricciardo', korName: '다니엘 리카도', code: 'RIC', number: 3, teamId: null, role: 0, nat: 'AUS', age: 35, ovr: 84, pace: 83, racecraft: 87, consistency: 85, tireMgmt: 84, wetSkill: 84, salary: 500000 },
        { id: 'magnussen', name: 'Kevin Magnussen', korName: '케빈 마그누센', code: 'MAG', number: 20, teamId: null, role: 0, nat: 'DEN', age: 32, ovr: 83, pace: 83, racecraft: 88, consistency: 79, tireMgmt: 81, wetSkill: 85, salary: 420000 },
        { id: 'kangmin', name: 'Minsu Kang', korName: '강민수 (KOR 루키)', code: 'KAN', number: 99, teamId: null, role: 0, nat: 'KOR', age: 19, ovr: 86, pace: 89, racecraft: 86, consistency: 84, tireMgmt: 84, wetSkill: 88, salary: 320000 }
    ],

    // 24 Authentic FIA Formula 1 Circuits with Distinctive Track Silhouettes, Biomes & Official Laps
    circuits: [
        {
            id: 'australia', round: 1, code: 'AUS', name: '호주 그랑프리 (멜버른 앨버트 파크)', engName: 'Australian Grand Prix', location: 'Melbourne',
            realLaps: 58, baseLapTime: 79.8, lengthKm: 5.278, biome: 'PARK_LAKE', timeOfDay: 'day', skyColor: 0x1e3a8a, groundColor: 0x142e1b,
            rainChance: 0.18, tireWearRate: 1.05, aeroWeight: 0.52, powerWeight: 0.48, pitLossSec: 21.5,
            drsZones: [[0.0, 0.12], [0.24, 0.36], [0.68, 0.81]],
            // Albert Park: Lake in the center, fast back lakeside curve, chicane T9-T10, tight T11-T13
            waypoints: [
                [-80,-210], [120,-210], [185,-185], [160,-135], [220,-90], [275,-10],
                [260,95], [175,165], [60,145], [-40,165], [-170,195], [-265,150],
                [-245,50], [-280,-20], [-240,-145], [-210,-195]
            ]
        },
        {
            id: 'china', round: 2, code: 'CHN', name: '중국 그랑프리 (상하이 인터내셔널)', engName: 'Chinese Grand Prix', location: 'Shanghai',
            realLaps: 56, baseLapTime: 93.6, lengthKm: 5.451, biome: 'MODERN_AUTODROME', timeOfDay: 'day', skyColor: 0x334155, groundColor: 0x1b2620,
            rainChance: 0.25, tireWearRate: 1.32, aeroWeight: 0.55, powerWeight: 0.45, pitLossSec: 23.0,
            drsZones: [[0.0, 0.14], [0.62, 0.86]],
            // Shanghai 'Shang' character silhouette: Snail Turn 1-3 spiral + 1.2km back straight + hairpin T14
            waypoints: [
                [-120,-220], [160,-220], [230,-170], [210,-90], [130,-75], [95,-125],
                [60,-95], [75,-20], [185,10], [260,80], [210,165], [120,130],
                [80,210], [-260,210], [-280,145], [-175,115], [-200,-180]
            ]
        },
        {
            id: 'japan', round: 3, code: 'JPN', name: '일본 그랑프리 (스즈카 서킷)', engName: 'Japanese Grand Prix', location: 'Suzuka',
            realLaps: 53, baseLapTime: 89.5, lengthKm: 5.807, biome: 'SUZUKA_PARK', timeOfDay: 'day', skyColor: 0x1d4ed8, groundColor: 0x123019,
            rainChance: 0.35, tireWearRate: 1.35, aeroWeight: 0.72, powerWeight: 0.28, pitLossSec: 22.5,
            drsZones: [[0.0, 0.14]],
            // Suzuka Figure-8 layout with S-Curves, Degner, Hairpin, Spoon, 130R, Casio Triangle
            waypoints: [
                [-60,-230], [170,-230], [250,-175], [190,-105], [240,-55], [165,-5],
                [215,50], [130,90], [35,20], [-65,95], [-125,35], [-240,145],
                [-285,210], [-210,245], [-85,175], [35,10], [-145,-155], [-175,-205]
            ]
        },
        {
            id: 'bahrain', round: 4, code: 'BHR', name: '바레인 그랑프리 (사키르 사막 나이트)', engName: 'Bahrain Grand Prix', location: 'Sakhir',
            realLaps: 57, baseLapTime: 91.4, lengthKm: 5.412, biome: 'DESERT_NIGHT', timeOfDay: 'night', skyColor: 0x050814, groundColor: 0x332617,
            rainChance: 0.04, tireWearRate: 1.38, aeroWeight: 0.45, powerWeight: 0.55, pitLossSec: 23.2,
            drsZones: [[0.0, 0.15], [0.32, 0.46], [0.62, 0.78]],
            // Sakhir: Long main straight, sharp T1-T2, straight to T4, inner technical hairpin T8-T10, back straight T11-T14
            waypoints: [
                [-140,-240], [220,-240], [255,-195], [185,-165], [205,-40], [140,30],
                [45,-10], [-25,-95], [-80,-65], [-15,120], [195,185], [245,235],
                [145,255], [-215,235], [-250,165], [-220,-200]
            ]
        },
        {
            id: 'saudi', round: 5, code: 'KSA', name: '사우디아라비아 그랑프리 (제다 홍해 야간)', engName: 'Saudi Arabian Grand Prix', location: 'Jeddah',
            realLaps: 50, baseLapTime: 88.2, lengthKm: 6.174, biome: 'NEON_CITY_NIGHT', timeOfDay: 'night', skyColor: 0x040711, groundColor: 0x0f1624,
            rainChance: 0.02, tireWearRate: 0.92, aeroWeight: 0.35, powerWeight: 0.65, pitLossSec: 20.8,
            drsZones: [[0.0, 0.16], [0.42, 0.56], [0.74, 0.90]],
            // Jeddah Corniche: Long narrow ribbon along the Red Sea coastline
            waypoints: [
                [-240,-95], [40,-105], [180,-80], [285,-45], [310,15], [245,45],
                [115,35], [-15,55], [-145,40], [-285,75], [-315,20], [-290,-55]
            ]
        },
        {
            id: 'miami', round: 6, code: 'MIA', name: '마이애미 그랑프리 (하드록 스타디움)', engName: 'Miami Grand Prix', location: 'Miami',
            realLaps: 57, baseLapTime: 89.7, lengthKm: 5.412, biome: 'HARBOR_PALM', timeOfDay: 'day', skyColor: 0x0284c7, groundColor: 0x122b2e,
            rainChance: 0.22, tireWearRate: 1.10, aeroWeight: 0.48, powerWeight: 0.52, pitLossSec: 21.8,
            drsZones: [[0.0, 0.13], [0.38, 0.54], [0.72, 0.89]],
            waypoints: [
                [-80,-160], [150,-160], [245,-110], [285,-20], [220,75], [85,60],
                [-35,95], [-195,165], [-295,125], [-275,35], [-165,15], [-265,-110]
            ]
        },
        {
            id: 'imola', round: 7, code: 'IMO', name: '에밀리아 로마냐 그랑프리 (이몰라)', engName: 'Emilia Romagna Grand Prix', location: 'Imola',
            realLaps: 63, baseLapTime: 75.8, lengthKm: 4.909, biome: 'FOREST_HILLS', timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x15331b,
            rainChance: 0.28, tireWearRate: 1.05, aeroWeight: 0.64, powerWeight: 0.36, pitLossSec: 24.5,
            drsZones: [[0.0, 0.16]],
            // Imola: Tamburello, Villeneuve, Tosa hairpin, Piratella, Acque Minerali, Variante Alta, Rivazza
            waypoints: [
                [-60,-150], [140,-135], [245,-85], [285,-15], [235,65], [140,85],
                [65,145], [15,90], [-75,130], [-215,155], [-285,85], [-245,-35], [-185,-135]
            ]
        },
        {
            id: 'monaco', round: 8, code: 'MON', name: '모나코 그랑프리 (몬테카를로 항구 시가지)', engName: 'Monaco Grand Prix', location: 'Monte Carlo',
            realLaps: 78, baseLapTime: 71.4, lengthKm: 3.337, biome: 'HARBOR_CITY', timeOfDay: 'day', skyColor: 0x0284c7, groundColor: 0x162233,
            rainChance: 0.20, tireWearRate: 0.72, aeroWeight: 0.88, powerWeight: 0.12, pitLossSec: 19.8,
            drsZones: [[0.0, 0.11]],
            // Monaco: Sainte Devote, Beau Rivage, Casino, Fairmont Hairpin, Tunnel, Nouvelle Chicane, Swimming Pool, Rascasse
            waypoints: [
                [-95,-175], [75,-170], [115,-125], [215,-55], [255,20], [195,85],
                [140,45], [175,125], [235,175], [95,195], [-35,155], [-95,165],
                [-175,95], [-155,15], [-215,-45], [-195,-145]
            ]
        },
        {
            id: 'spain', round: 9, code: 'ESP', name: '스페인 그랑프리 (바르셀로나-카탈루냐)', engName: 'Spanish Grand Prix', location: 'Barcelona',
            realLaps: 66, baseLapTime: 76.5, lengthKm: 4.657, biome: 'MODERN_AUTODROME', timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x1f361d,
            rainChance: 0.14, tireWearRate: 1.36, aeroWeight: 0.68, powerWeight: 0.32, pitLossSec: 22.0,
            drsZones: [[0.0, 0.17], [0.56, 0.70]],
            waypoints: [
                [-120,-220], [210,-220], [235,-150], [160,-105], [240,-20], [185,75],
                [65,40], [35,120], [170,185], [-195,205], [-245,135], [-175,45],
                [-235,-65], [-210,-195]
            ]
        },
        {
            id: 'canada', round: 10, code: 'CAN', name: '캐나다 그랑프리 (몬트리올 질 빌뇌브)', engName: 'Canadian Grand Prix', location: 'Montreal',
            realLaps: 70, baseLapTime: 73.1, lengthKm: 4.361, biome: 'PARK_LAKE', timeOfDay: 'day', skyColor: 0x3b82f6, groundColor: 0x122e1f,
            rainChance: 0.38, tireWearRate: 0.95, aeroWeight: 0.38, powerWeight: 0.62, pitLossSec: 19.2,
            drsZones: [[0.0, 0.14], [0.64, 0.86]],
            // Ile Notre-Dame Island: Long narrow island circuit with Epingle Hairpin & Wall of Champions chicane
            waypoints: [
                [-110,-135], [140,-130], [195,-95], [145,-50], [70,-55], [-40,-25],
                [-165,15], [-265,65], [-245,135], [-115,125], [195,110], [265,75],
                [215,-85], [165,-125]
            ]
        },
        {
            id: 'austria', round: 11, code: 'AUT', name: '오스트리아 그랑프리 (슈필베르크 레드불 링)', engName: 'Austrian Grand Prix', location: 'Spielberg',
            realLaps: 71, baseLapTime: 65.8, lengthKm: 4.318, biome: 'ALPINE_MOUNTAIN', timeOfDay: 'day', skyColor: 0x1d4ed8, groundColor: 0x11361b,
            rainChance: 0.32, tireWearRate: 1.12, aeroWeight: 0.42, powerWeight: 0.58, pitLossSec: 20.5,
            drsZones: [[0.0, 0.16], [0.22, 0.38], [0.44, 0.58]],
            // Red Bull Ring: 3 long straights + uphill T3 hairpin + infield double left-hander + Rindt/Red Bull Mobile corners
            waypoints: [
                [-120,-210], [210,-210], [235,-120], [95,140], [35,165], [-25,55],
                [-95,35], [-135,145], [-235,165], [-245,-85], [-205,-195]
            ]
        },
        {
            id: 'silverstone', round: 12, code: 'GBR', name: '영국 그랑프리 (실버스톤 서킷)', engName: 'British Grand Prix', location: 'Silverstone',
            realLaps: 52, baseLapTime: 87.2, lengthKm: 5.891, biome: 'MODERN_AUTODROME', timeOfDay: 'day', skyColor: 0x475569, groundColor: 0x14301a,
            rainChance: 0.42, tireWearRate: 1.32, aeroWeight: 0.68, powerWeight: 0.32, pitLossSec: 20.2,
            drsZones: [[0.18, 0.32], [0.60, 0.76]],
            // Silverstone: Abbey, Village loop, Wellington Straight, Brooklands/Luffield, Copse, Maggotts-Becketts-Chapel, Hangar Straight, Stowe, Vale/Club
            waypoints: [
                [-70,-245], [140,-240], [195,-175], [95,-120], [145,-55], [25,-15],
                [175,95], [260,55], [275,-35], [225,-105], [265,-165], [215,-225],
                [-140,185], [-235,235], [-275,135], [-195,25], [-235,-155]
            ]
        },
        {
            id: 'spa', round: 13, code: 'BEL', name: '벨기에 그랑프리 (스파-프랑코르샹)', engName: 'Belgian Grand Prix', location: 'Spa-Francorchamps',
            realLaps: 44, baseLapTime: 104.5, lengthKm: 7.004, biome: 'FOREST_HILLS', timeOfDay: 'day', skyColor: 0x334155, groundColor: 0x0d2614,
            rainChance: 0.48, tireWearRate: 1.25, aeroWeight: 0.50, powerWeight: 0.50, pitLossSec: 23.0,
            drsZones: [[0.14, 0.32], [0.85, 0.99]],
            // Spa-Francorchamps: La Source hairpin, Eau Rouge/Raidillon, Kemmel Straight, Les Combes, Pouhon, Blanchimont, Bus Stop Chicane
            waypoints: [
                [-180,-195], [-265,-235], [-235,-140], [-145,-65], [165,-235], [255,-185],
                [215,-95], [115,-85], [195,20], [275,95], [185,215], [45,195],
                [-75,105], [-165,35], [-145,-125]
            ]
        },
        {
            id: 'hungary', round: 14, code: 'HUN', name: '헝가리 그랑프리 (부다페스트 헝가로링)', engName: 'Hungarian Grand Prix', location: 'Budapest',
            realLaps: 70, baseLapTime: 76.9, lengthKm: 4.381, biome: 'FOREST_HILLS', timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x1d361b,
            rainChance: 0.20, tireWearRate: 1.18, aeroWeight: 0.80, powerWeight: 0.20, pitLossSec: 21.0,
            drsZones: [[0.0, 0.15], [0.18, 0.29]],
            waypoints: [
                [-90,-220], [195,-220], [225,-150], [110,-95], [195,-15], [155,75],
                [55,45], [-15,115], [95,185], [-165,215], [-235,135], [-145,45],
                [-225,-45], [-205,-195]
            ]
        },
        {
            id: 'zandvoort', round: 15, code: 'NED', name: '네덜란드 그랑프리 (잔드보르트 해안 사구)', engName: 'Dutch Grand Prix', location: 'Zandvoort',
            realLaps: 72, baseLapTime: 71.2, lengthKm: 4.259, biome: 'COASTAL_DUNES', timeOfDay: 'day', skyColor: 0x0284c7, groundColor: 0x2e2a1d,
            rainChance: 0.35, tireWearRate: 1.28, aeroWeight: 0.74, powerWeight: 0.26, pitLossSec: 19.5,
            drsZones: [[0.0, 0.14], [0.76, 0.90]],
            waypoints: [
                [-85,-215], [185,-215], [225,-145], [115,-85], [65,-140], [15,-55],
                [175,25], [235,125], [125,215], [-35,165], [-115,215], [-225,135],
                [-195,-85], [-175,-195]
            ]
        },
        {
            id: 'monza', round: 16, code: 'ITA', name: '이탈리아 그랑프리 (몬차 국립 서킷)', engName: 'Italian Grand Prix', location: 'Monza',
            realLaps: 53, baseLapTime: 80.1, lengthKm: 5.793, biome: 'FOREST_HILLS', timeOfDay: 'day', skyColor: 0x1d4ed8, groundColor: 0x143318,
            rainChance: 0.12, tireWearRate: 0.92, aeroWeight: 0.15, powerWeight: 0.85, pitLossSec: 24.0,
            drsZones: [[0.0, 0.19], [0.54, 0.72]],
            // Iconic Monza "Boot/Pistol" shape: Main Straight -> Rettifilo -> Curva Grande -> Lesmo 1 & 2 -> Ascari -> Back Straight -> Parabolica
            waypoints: [
                [-140,-250], [230,-250], [250,-225], [275,-120], [230,45], [215,195],
                [135,235], [85,155], [40,15], [15,-25], [-35,10], [-195,185],
                [-265,145], [-245,-195], [-210,-245]
            ]
        },
        {
            id: 'baku', round: 17, code: 'AZE', name: '아제르바이잔 그랑프리 (바쿠 성벽 시가지)', engName: 'Azerbaijan Grand Prix', location: 'Baku',
            realLaps: 51, baseLapTime: 102.8, lengthKm: 6.003, biome: 'HARBOR_CITY', timeOfDay: 'day', skyColor: 0x0284c7, groundColor: 0x1b212c,
            rainChance: 0.06, tireWearRate: 0.98, aeroWeight: 0.25, powerWeight: 0.75, pitLossSec: 20.5,
            drsZones: [[0.0, 0.24], [0.29, 0.41]],
            // Baku: 2.2km straight + 90-degree grid blocks + narrow Old Town Castle section
            waypoints: [
                [-180,-230], [265,-230], [265,-115], [95,-115], [95,-25], [235,-25],
                [235,95], [135,155], [45,115], [-35,175], [-165,215], [-275,145],
                [-215,15], [-275,-195]
            ]
        },
        {
            id: 'singapore', round: 18, code: 'SIN', name: '싱가포르 그랑프리 (마리나 베이 야간)', engName: 'Singapore Grand Prix', location: 'Marina Bay',
            realLaps: 62, baseLapTime: 90.8, lengthKm: 4.940, biome: 'NEON_CITY_NIGHT', timeOfDay: 'night', skyColor: 0x030712, groundColor: 0x0b111e,
            rainChance: 0.30, tireWearRate: 1.16, aeroWeight: 0.78, powerWeight: 0.22, pitLossSec: 28.0,
            drsZones: [[0.0, 0.13], [0.46, 0.59], [0.74, 0.85]],
            waypoints: [
                [-80,-225], [165,-225], [215,-165], [145,-115], [235,-15], [215,145],
                [95,185], [35,95], [-65,125], [-145,215], [-245,155], [-215,-25],
                [-255,-145], [-175,-215]
            ]
        },
        {
            id: 'austin', round: 19, code: 'USA', name: '미국 그랑프리 (오스틴 COTA)', engName: 'United States Grand Prix', location: 'Austin',
            realLaps: 56, baseLapTime: 95.4, lengthKm: 5.513, biome: 'MODERN_AUTODROME', timeOfDay: 'day', skyColor: 0x1d4ed8, groundColor: 0x22301b,
            rainChance: 0.15, tireWearRate: 1.30, aeroWeight: 0.60, powerWeight: 0.40, pitLossSec: 20.8,
            drsZones: [[0.0, 0.12], [0.50, 0.70]],
            // COTA: Uphill Turn 1 hairpin, Maggotts-inspired Esses, long back straight to Turn 11 hairpin, stadium section
            waypoints: [
                [-110,-225], [185,-245], [145,-165], [195,-95], [135,-35], [215,35],
                [285,155], [255,215], [-185,165], [-145,75], [-45,65], [-35,-15],
                [-135,-35], [-235,-145], [-195,-215]
            ]
        },
        {
            id: 'mexico', round: 20, code: 'MEX', name: '멕시코시티 그랑프리 (에르마노스 로드리게스)', engName: 'Mexico City Grand Prix', location: 'Mexico City',
            realLaps: 71, baseLapTime: 77.6, lengthKm: 4.304, biome: 'MODERN_AUTODROME', timeOfDay: 'day', skyColor: 0x0284c7, groundColor: 0x1b301e,
            rainChance: 0.16, tireWearRate: 1.05, aeroWeight: 0.58, powerWeight: 0.42, pitLossSec: 22.2,
            drsZones: [[0.0, 0.21], [0.34, 0.48]],
            // Mexico: 1.2km main straight, T1-T3 chicane, straight to T4-T6 stadium loop, Esses, Foro Sol Baseball Stadium
            waypoints: [
                [-160,-235], [255,-235], [255,-165], [195,-145], [165,35], [235,95],
                [175,165], [75,95], [15,155], [-65,115], [-145,195], [-245,125],
                [-185,25], [-245,-45], [-235,-215]
            ]
        },
        {
            id: 'interlagos', round: 21, code: 'BRA', name: '상파울루 그랑프리 (인테르라고스)', engName: 'São Paulo Grand Prix', location: 'Interlagos',
            realLaps: 71, baseLapTime: 70.9, lengthKm: 4.309, biome: 'PARK_LAKE', timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x19381b,
            rainChance: 0.46, tireWearRate: 1.18, aeroWeight: 0.55, powerWeight: 0.45, pitLossSec: 20.5,
            drsZones: [[0.0, 0.16], [0.26, 0.44]],
            // Interlagos: Senna S, Curva do Sol, Reta Oposta, Descida do Lago, Ferradura, Pinheirinho, Bico de Pato, Junção, Subida dos Boxes
            waypoints: [
                [-95,-215], [175,-215], [195,-145], [125,-115], [215,-25], [185,155],
                [65,185], [35,65], [-45,15], [-85,95], [-15,145], [-95,215],
                [-225,165], [-245,15], [-185,-165]
            ]
        },
        {
            id: 'lasvegas', round: 22, code: 'LVG', name: '라스베이거스 그랑프리 (스트립 네온 야간)', engName: 'Las Vegas Grand Prix', location: 'Las Vegas',
            realLaps: 50, baseLapTime: 93.2, lengthKm: 6.201, biome: 'NEON_CITY_NIGHT', timeOfDay: 'night', skyColor: 0x04060e, groundColor: 0x0e1017,
            rainChance: 0.04, tireWearRate: 0.90, aeroWeight: 0.22, powerWeight: 0.78, pitLossSec: 21.0,
            drsZones: [[0.0, 0.14], [0.50, 0.80]],
            // Las Vegas Strip: Sphere loop T5-T9 + 1.9km full-throttle Strip straight T12-T14
            waypoints: [
                [-95,-195], [155,-195], [215,-145], [145,-85], [215,-25], [265,65],
                [215,165], [95,185], [15,125], [-265,125], [-285,35], [-245,-145]
            ]
        },
        {
            id: 'qatar', round: 23, code: 'QAT', name: '카타르 그랑프리 (루사일 사막 나이트)', engName: 'Qatar Grand Prix', location: 'Lusail',
            realLaps: 57, baseLapTime: 82.4, lengthKm: 5.419, biome: 'DESERT_NIGHT', timeOfDay: 'night', skyColor: 0x050814, groundColor: 0x2c2216,
            rainChance: 0.02, tireWearRate: 1.42, aeroWeight: 0.68, powerWeight: 0.32, pitLossSec: 24.5,
            drsZones: [[0.0, 0.18]],
            waypoints: [
                [-120,-235], [225,-235], [255,-145], [145,-75], [235,15], [195,115],
                [65,65], [15,145], [135,215], [-45,235], [-165,125], [-245,175],
                [-265,35], [-185,-65], [-225,-195]
            ]
        },
        {
            id: 'abudhabi', round: 24, code: 'ABU', name: '아부다비 그랑프리 (야스 마리나 피날레)', engName: 'Abu Dhabi Grand Prix', location: 'Yas Marina',
            realLaps: 58, baseLapTime: 84.6, lengthKm: 5.281, biome: 'HARBOR_CITY', timeOfDay: 'sunset', skyColor: 0x1e1b4b, groundColor: 0x19202b,
            rainChance: 0.02, tireWearRate: 1.12, aeroWeight: 0.55, powerWeight: 0.45, pitLossSec: 21.5,
            drsZones: [[0.24, 0.44], [0.49, 0.66]],
            // Yas Marina: North Hairpin T5 -> Two long back straights -> W Hotel Marina section
            waypoints: [
                [-65,-215], [135,-215], [175,-135], [245,-95], [275,-25], [235,25],
                [-165,45], [-255,65], [-225,165], [45,195], [95,135], [185,155],
                [165,225], [-95,215], [-165,-145]
            ]
        }
    ],

    // 5 Official Pirelli Tire Compounds
    tireCompounds: {
        SOFT:   { id: 'SOFT',   name: 'Soft (C5)',         short: 'S', color: '#E10600', hex: 0xe10600, paceDelta: -0.65, baseWearPerLap: 2.35, optimalTemp: 102, wetGrip: 0.35 },
        MEDIUM: { id: 'MEDIUM', name: 'Medium (C3)',       short: 'M', color: '#FFD100', hex: 0xffd100, paceDelta: 0.00,  baseWearPerLap: 1.45, optimalTemp: 96,  wetGrip: 0.38 },
        HARD:   { id: 'HARD',   name: 'Hard (C1)',         short: 'H', color: '#F0F4F8', hex: 0xf0f4f8, paceDelta: +0.55, baseWearPerLap: 0.92, optimalTemp: 90,  wetGrip: 0.34 },
        INTER:  { id: 'INTER',  name: 'Intermediate',      short: 'I', color: '#00D65B', hex: 0x00d65b, paceDelta: +2.80, baseWearPerLap: 1.40, optimalTemp: 75,  wetGrip: 0.94 },
        WET:    { id: 'WET',    name: 'Full Wet (Extreme)', short: 'W', color: '#0088FF', hex: 0x0088ff, paceDelta: +5.40, baseWearPerLap: 1.10, optimalTemp: 62,  wetGrip: 1.00 }
    },

    // R&D Engineering Tree
    rdTree: {
        aero: {
            name: 'Aerodynamics (공력 설계부)',
            code: 'AERO',
            color: '#00D2BE',
            upgrades: [
                { level: 1, name: 'Front Wing Endplate Outwash Spec', cost: 4500000, gain: 2, desc: '프론트 윙 엔드플레이트 와류 제어 (+2 AERO, 코너 최고속도 +3km/h)' },
                { level: 2, name: 'Venturi Floor Edge Wing Spec-B', cost: 7200000, gain: 3, desc: '언더플로어 벤투리 터널 다운포스 증대 (+3 AERO, 고속 코너 그립 향상)' },
                { level: 3, name: 'Deep Undercut Sidepod Packaging', cost: 11000000, gain: 3, desc: '사이드포드 공기저항 계수 감소 (+3 AERO, 직선 드래그 -4%)' },
                { level: 4, name: 'Low-Drag Beam Wing & Diffuser', cost: 15500000, gain: 4, desc: 'DRS 개방 시 직선 최고속도 및 리어 안정성 (+4 AERO)' },
                { level: 5, name: 'Aero Elasticity Spec-Final', cost: 22000000, gain: 5, desc: '고속 플렉시 윙 밸런스 완성 (+5 AERO)' }
            ]
        },
        powertrain: {
            name: 'Power Unit & ERS (파워유닛 연구부)',
            code: 'POWR',
            color: '#FF8000',
            upgrades: [
                { level: 1, name: 'MGU-K Deployment Calibration', cost: 4800000, gain: 2, desc: '하이브리드 전기모터 출력 전개 최적화 (+2 POWR)' },
                { level: 2, name: 'High-Density ES Battery Cell', cost: 7600000, gain: 3, desc: '랩당 배터리 회생 충전 효율 15% 향상 (+3 POWR)' },
                { level: 3, name: 'Turbo Plenum Cooling Architecture', cost: 11500000, gain: 3, desc: '열효율 개선 및 직선 구간 가속력 증가 (+3 POWR)' },
                { level: 4, name: 'Synthetic E-Fuel Combustion Map', cost: 16000000, gain: 4, desc: '퀄리파잉 및 오버테이크 출력 모드 강화 (+4 POWR)' },
                { level: 5, name: 'Works Spec Phase-5 ICE Package', cost: 23000000, gain: 5, desc: '챔피언십 사양 궁극 파워유닛 (+5 POWR)' }
            ]
        },
        chassis: {
            name: 'Chassis & Suspension (섀시/서스펜션)',
            code: 'CHAS',
            color: '#3671C6',
            upgrades: [
                { level: 1, name: 'Carbon Wishbone Weight Reduction', cost: 4200000, gain: 2, desc: '차량 중량 798kg 미니멈 달성 (+2 CHAS)' },
                { level: 2, name: 'Anti-Dive Suspension Kinematics', cost: 6900000, gain: 3, desc: '브레이킹 피칭 억제 및 타이어 마모 -8% (+3 CHAS)' },
                { level: 3, name: 'Rear Tire Thermal Duct Routing', cost: 10500000, gain: 3, desc: '리어 타이어 열화(Blistering) 억제 (+3 CHAS)' },
                { level: 4, name: 'Monocoque Torsional Rigidity Spec', cost: 14800000, gain: 4, desc: '고속 연석 공략 응답성 극대화 (+4 CHAS)' },
                { level: 5, name: 'Zero-Blister Tyre Preservation Spec', cost: 20500000, gain: 5, desc: '원스톱 장기 스틴트 마스터 섀시 (+5 CHAS)' }
            ]
        },
        durability: {
            name: 'Operations & Pit Stop (내구/피트스톱)',
            code: 'DURA',
            color: '#E8002D',
            upgrades: [
                { level: 1, name: 'Seamless Shift Gearbox Sealing', cost: 3800000, gain: 2, desc: '기어박스 신뢰도 향상 및 충돌 파손 저항 (+2 DURA)' },
                { level: 2, name: 'Automated Laser Wheel Gun System', cost: 6400000, gain: 3, desc: '피트스톱 정지 시간 -0.25초 단축 (+3 DURA)' },
                { level: 3, name: 'Carbon-Carbon Brake Cooling Spec', cost: 9800000, gain: 3, desc: '브레이크 락업 및 스핀 확률 감소 (+3 DURA)' },
                { level: 4, name: 'Pit Crew Biomechanics Sync', cost: 13800000, gain: 4, desc: '1.9초대 칼같은 피트스톱 및 윙 교체 시간 단축 (+4 DURA)' },
                { level: 5, name: 'Zero-Fault Race Operations Spec', cost: 19000000, gain: 5, desc: '최고 수준의 레이스 오퍼레이션 완성 (+5 DURA)' }
            ]
        }
    },

    pointsTable: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
};
