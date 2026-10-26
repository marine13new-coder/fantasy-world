// ============================================================================
// F1 MANAGER & LIVE TELEMETRY SIMULATOR - AUTHENTIC FIA DATA & 24-RACE CALENDAR
// 10 Constructors, 26 Drivers, 24 Official Grand Prix Circuits (Full Laps),
// 5 Pirelli Compounds, 4 Race Distances, Realistic SVG Circuit Coordinates
// ============================================================================

window.F1Data = {
    // Race Distance Presets
    raceFormats: {
        SPRINT: { id: 'SPRINT', label: 'SPRINT (25% 거리)', scale: 0.25, wearMult: 2.6, fuelMult: 2.6, desc: '실제 그랑프리의 25% 랩 수로 압축된 고속 전술 레이스' },
        HALF:   { id: 'HALF',   label: 'STANDARD (50% 거리)', scale: 0.50, wearMult: 1.5, fuelMult: 1.5, desc: '1~2스톱 언더컷/오버컷 전략이 가장 치열한 50% 레이스' },
        FULL:   { id: 'FULL',   label: 'FULL GP (100% 실제 랩수)', scale: 1.00, wearMult: 0.85, fuelMult: 1.0, desc: '실제 FIA F1 규정과 100% 동일한 풀 랩수(50~78랩) 하드코어 그랑프리' },
        QUICK:  { id: 'QUICK',  label: 'SHAKEDOWN (5 Laps)', scale: 0.0, fixedLaps: 5, wearMult: 5.5, fuelMult: 5.5, desc: '즉각적인 승부와 테스트를 위한 5랩 초단기 결전' }
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
            specs: { aero: 95, powertrain: 96, chassis: 94, durability: 91 },
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
            specs: { aero: 96, powertrain: 96, chassis: 93, durability: 92 },
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
            specs: { aero: 92, powertrain: 95, chassis: 93, durability: 95 },
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
        // Ferrari
        { id: 'leclerc', name: 'Charles Leclerc', korName: '샤를 르클레르', code: 'LEC', number: 16, teamId: 'ferrari', role: 1, nat: 'MON', age: 27, ovr: 95, pace: 98, racecraft: 94, consistency: 92, tireMgmt: 92, wetSkill: 93, salary: 1550000 },
        { id: 'hamilton', name: 'Lewis Hamilton', korName: '루이스 해밀턴', code: 'HAM', number: 44, teamId: 'ferrari', role: 2, nat: 'GBR', age: 40, ovr: 94, pace: 93, racecraft: 96, consistency: 95, tireMgmt: 97, wetSkill: 97, salary: 1750000 },

        // Red Bull
        { id: 'verstappen', name: 'Max Verstappen', korName: '막스 베르스타펜', code: 'VER', number: 1, teamId: 'redbull', role: 1, nat: 'NED', age: 27, ovr: 98, pace: 99, racecraft: 97, consistency: 97, tireMgmt: 96, wetSkill: 98, salary: 1900000 },
        { id: 'lawson', name: 'Liam Lawson', korName: '리암 로슨', code: 'LAW', number: 30, teamId: 'redbull', role: 2, nat: 'NZL', age: 23, ovr: 84, pace: 85, racecraft: 86, consistency: 82, tireMgmt: 82, wetSkill: 84, salary: 360000 },

        // McLaren
        { id: 'norris', name: 'Lando Norris', korName: '랜도 노리스', code: 'NOR', number: 4, teamId: 'mclaren', role: 1, nat: 'GBR', age: 25, ovr: 95, pace: 96, racecraft: 93, consistency: 94, tireMgmt: 95, wetSkill: 95, salary: 1400000 },
        { id: 'piastri', name: 'Oscar Piastri', korName: '오스카 피아스트리', code: 'PIA', number: 81, teamId: 'mclaren', role: 2, nat: 'AUS', age: 24, ovr: 93, pace: 94, racecraft: 94, consistency: 94, tireMgmt: 91, wetSkill: 91, salary: 1050000 },

        // Mercedes
        { id: 'russell', name: 'George Russell', korName: '조지 러셀', code: 'RUS', number: 63, teamId: 'mercedes', role: 1, nat: 'GBR', age: 27, ovr: 92, pace: 94, racecraft: 91, consistency: 91, tireMgmt: 91, wetSkill: 92, salary: 1150000 },
        { id: 'antonelli', name: 'Kimi Antonelli', korName: '키미 안토넬리', code: 'ANT', number: 12, teamId: 'mercedes', role: 2, nat: 'ITA', age: 18, ovr: 84, pace: 88, racecraft: 83, consistency: 80, tireMgmt: 81, wetSkill: 85, salary: 300000 },

        // Aston Martin
        { id: 'alonso', name: 'Fernando Alonso', korName: '페르난도 알론소', code: 'ALO', number: 14, teamId: 'astonmartin', role: 1, nat: 'ESP', age: 43, ovr: 91, pace: 90, racecraft: 96, consistency: 95, tireMgmt: 94, wetSkill: 95, salary: 1150000 },
        { id: 'stroll', name: 'Lance Stroll', korName: '랜스 스트롤', code: 'STR', number: 18, teamId: 'astonmartin', role: 2, nat: 'CAN', age: 26, ovr: 80, pace: 80, racecraft: 81, consistency: 77, tireMgmt: 81, wetSkill: 86, salary: 320000 },

        // Williams
        { id: 'sainz', name: 'Carlos Sainz', korName: '카를로스 사인츠', code: 'SAI', number: 55, teamId: 'williams', role: 1, nat: 'ESP', age: 30, ovr: 91, pace: 91, racecraft: 92, consistency: 93, tireMgmt: 91, wetSkill: 90, salary: 980000 },
        { id: 'albon', name: 'Alexander Albon', korName: '알렉산더 알본', code: 'ALB', number: 23, teamId: 'williams', role: 2, nat: 'THA', age: 29, ovr: 87, pace: 88, racecraft: 87, consistency: 87, tireMgmt: 88, wetSkill: 86, salary: 620000 },

        // Alpine
        { id: 'gasly', name: 'Pierre Gasly', korName: '피에르 가슬리', code: 'GAS', number: 10, teamId: 'alpine', role: 1, nat: 'FRA', age: 29, ovr: 87, pace: 88, racecraft: 87, consistency: 86, tireMgmt: 86, wetSkill: 88, salary: 650000 },
        { id: 'doohan', name: 'Jack Doohan', korName: '잭 두한', code: 'DOO', number: 7, teamId: 'alpine', role: 2, nat: 'AUS', age: 22, ovr: 79, pace: 81, racecraft: 79, consistency: 78, tireMgmt: 78, wetSkill: 79, salary: 210000 },

        // Racing Bulls
        { id: 'tsunoda', name: 'Yuki Tsunoda', korName: '츠노다 유키', code: 'TSU', number: 22, teamId: 'rb', role: 1, nat: 'JPN', age: 24, ovr: 86, pace: 87, racecraft: 85, consistency: 83, tireMgmt: 84, wetSkill: 84, salary: 480000 },
        { id: 'hadjar', name: 'Isack Hadjar', korName: '아이작 하자르', code: 'HAD', number: 6, teamId: 'rb', role: 2, nat: 'FRA', age: 20, ovr: 80, pace: 83, racecraft: 80, consistency: 77, tireMgmt: 78, wetSkill: 79, salary: 200000 },

        // Haas
        { id: 'ocon', name: 'Esteban Ocon', korName: '에스테반 오콘', code: 'OCO', number: 31, teamId: 'haas', role: 1, nat: 'FRA', age: 28, ovr: 86, pace: 86, racecraft: 87, consistency: 84, tireMgmt: 86, wetSkill: 88, salary: 550000 },
        { id: 'bearman', name: 'Oliver Bearman', korName: '올리버 베어먼', code: 'BEA', number: 87, teamId: 'haas', role: 2, nat: 'GBR', age: 19, ovr: 82, pace: 84, racecraft: 83, consistency: 80, tireMgmt: 79, wetSkill: 81, salary: 240000 },

        // Kick Sauber
        { id: 'hulkenberg', name: 'Nico Hulkenberg', korName: '니코 휠켄베르크', code: 'HUL', number: 27, teamId: 'sauber', role: 1, nat: 'GER', age: 37, ovr: 86, pace: 88, racecraft: 85, consistency: 88, tireMgmt: 85, wetSkill: 87, salary: 580000 },
        { id: 'bortoleto', name: 'Gabriel Bortoleto', korName: '가브리엘 보르톨레토', code: 'BOR', number: 5, teamId: 'sauber', role: 2, nat: 'BRA', age: 20, ovr: 81, pace: 83, racecraft: 82, consistency: 81, tireMgmt: 80, wetSkill: 80, salary: 220000 },

        // Free Agents / Reserve Drivers
        { id: 'perez', name: 'Sergio Perez', korName: '세르히오 페레즈', code: 'PER', number: 11, teamId: null, role: 0, nat: 'MEX', age: 35, ovr: 86, pace: 84, racecraft: 88, consistency: 86, tireMgmt: 92, wetSkill: 83, salary: 720000 },
        { id: 'bottas', name: 'Valtteri Bottas', korName: '발테리 보타스', code: 'BOT', number: 77, teamId: null, role: 0, nat: 'FIN', age: 35, ovr: 85, pace: 87, racecraft: 83, consistency: 89, tireMgmt: 85, wetSkill: 82, salary: 520000 },
        { id: 'colapinto', name: 'Franco Colapinto', korName: '프랑코 콜라핀토', code: 'COL', number: 43, teamId: null, role: 0, nat: 'ARG', age: 21, ovr: 83, pace: 85, racecraft: 84, consistency: 81, tireMgmt: 81, wetSkill: 82, salary: 270000 },
        { id: 'ricciardo', name: 'Daniel Ricciardo', korName: '다니엘 리카도', code: 'RIC', number: 3, teamId: null, role: 0, nat: 'AUS', age: 35, ovr: 84, pace: 83, racecraft: 87, consistency: 85, tireMgmt: 84, wetSkill: 84, salary: 500000 },
        { id: 'magnussen', name: 'Kevin Magnussen', korName: '케빈 마그누센', code: 'MAG', number: 20, teamId: null, role: 0, nat: 'DEN', age: 32, ovr: 83, pace: 83, racecraft: 88, consistency: 79, tireMgmt: 81, wetSkill: 85, salary: 420000 },
        { id: 'kangmin', name: 'Minsu Kang', korName: '강민수 (KOR 루키)', code: 'KAN', number: 99, teamId: null, role: 0, nat: 'KOR', age: 19, ovr: 86, pace: 89, racecraft: 86, consistency: 84, tireMgmt: 84, wetSkill: 88, salary: 320000 }
    ],

    // 24 Official FIA Formula 1 World Championship Calendar Circuits with Authentic Laps & Track Geometries
    circuits: [
        {
            id: 'australia', round: 1, code: 'AUS', name: '호주 그랑프리 (멜버른 알버트 파크)', engName: 'Australian Grand Prix', location: 'Melbourne',
            realLaps: 58, baseLapTime: 79.8, lengthKm: 5.278, timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x16301b,
            rainChance: 0.18, tireWearRate: 1.05, aeroWeight: 0.52, powerWeight: 0.48, pitLossSec: 21.5,
            drsZones: [[0.0, 0.12], [0.24, 0.36], [0.68, 0.81]],
            waypoints: [[0,-250],[190,-245],[255,-175],[240,-60],[160,-20],[220,85],[250,190],[140,255],[-30,240],[-180,220],[-255,120],[-230,-30],[-160,-150],[-200,-240]]
        },
        {
            id: 'china', round: 2, code: 'CHN', name: '중국 그랑프리 (상하이 인터내셔널)', engName: 'Chinese Grand Prix', location: 'Shanghai',
            realLaps: 56, baseLapTime: 93.6, lengthKm: 5.451, timeOfDay: 'day', skyColor: 0x3b82f6, groundColor: 0x1e293b,
            rainChance: 0.25, tireWearRate: 1.32, aeroWeight: 0.55, powerWeight: 0.45, pitLossSec: 23.0,
            drsZones: [[0.0, 0.14], [0.62, 0.84]],
            waypoints: [[0,-260],[220,-260],[260,-150],[140,-80],[70,-130],[50,-30],[190,40],[250,170],[110,250],[-220,250],[-260,140],[-170,10],[-230,-140],[-210,-250]]
        },
        {
            id: 'japan', round: 3, code: 'JPN', name: '일본 그랑프리 (스즈카 서킷)', engName: 'Japanese Grand Prix', location: 'Suzuka',
            realLaps: 53, baseLapTime: 89.5, lengthKm: 5.807, timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x14331b,
            rainChance: 0.35, tireWearRate: 1.35, aeroWeight: 0.72, powerWeight: 0.28, pitLossSec: 22.5,
            drsZones: [[0.0, 0.14]],
            waypoints: [[0,-270],[190,-260],[265,-150],[170,-40],[255,75],[210,220],[50,260],[-80,140],[-200,230],[-270,90],[-210,-80],[-240,-220]]
        },
        {
            id: 'bahrain', round: 4, code: 'BHR', name: '바레인 그랑프리 (사키르 인터내셔널)', engName: 'Bahrain Grand Prix', location: 'Sakhir',
            realLaps: 57, baseLapTime: 91.4, lengthKm: 5.412, timeOfDay: 'night', skyColor: 0x050814, groundColor: 0x2b2318,
            rainChance: 0.04, tireWearRate: 1.38, aeroWeight: 0.45, powerWeight: 0.55, pitLossSec: 23.2,
            drsZones: [[0.0, 0.14], [0.35, 0.47], [0.60, 0.74]],
            waypoints: [[0,-260],[210,-260],[260,-210],[210,-120],[90,-80],[40,10],[150,90],[240,180],[170,260],[-80,250],[-230,190],[-260,40],[-190,-140],[-230,-240]]
        },
        {
            id: 'saudi', round: 5, code: 'KSA', name: '사우디아라비아 그랑프리 (제다 코니쉬)', engName: 'Saudi Arabian Grand Prix', location: 'Jeddah',
            realLaps: 50, baseLapTime: 88.2, lengthKm: 6.174, timeOfDay: 'night', skyColor: 0x040711, groundColor: 0x161922,
            rainChance: 0.02, tireWearRate: 0.92, aeroWeight: 0.35, powerWeight: 0.65, pitLossSec: 20.8,
            drsZones: [[0.0, 0.15], [0.42, 0.55], [0.75, 0.90]],
            waypoints: [[-20,-290],[260,-280],[295,-180],[210,-60],[275,90],[250,240],[90,280],[-140,240],[-280,170],[-260,10],[-210,-120],[-270,-250]]
        },
        {
            id: 'miami', round: 6, code: 'MIA', name: '마이애미 그랑프리 (오토드롬 인터내셔널)', engName: 'Miami Grand Prix', location: 'Miami',
            realLaps: 57, baseLapTime: 89.7, lengthKm: 5.412, timeOfDay: 'day', skyColor: 0x0ea5e9, groundColor: 0x132a2e,
            rainChance: 0.22, tireWearRate: 1.10, aeroWeight: 0.48, powerWeight: 0.52, pitLossSec: 21.8,
            drsZones: [[0.0, 0.13], [0.38, 0.54], [0.74, 0.89]],
            waypoints: [[0,-255],[235,-250],[275,-140],[190,-30],[250,110],[180,240],[-60,255],[-245,220],[-270,80],[-180,-40],[-240,-180]]
        },
        {
            id: 'imola', round: 7, code: 'IMO', name: '에밀리아 로마냐 그랑프리 (이몰라)', engName: 'Emilia Romagna Grand Prix', location: 'Imola',
            realLaps: 63, baseLapTime: 75.8, lengthKm: 4.909, timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x16361c,
            rainChance: 0.28, tireWearRate: 1.05, aeroWeight: 0.64, powerWeight: 0.36, pitLossSec: 24.5,
            drsZones: [[0.0, 0.16]],
            waypoints: [[0,-240],[220,-230],[260,-110],[190,30],[220,170],[90,245],[-90,230],[-230,150],[-250,-20],[-180,-150],[-210,-230]]
        },
        {
            id: 'monaco', round: 8, code: 'MON', name: '모나코 그랑프리 (몬테카를로 시가지)', engName: 'Monaco Grand Prix', location: 'Monte Carlo',
            realLaps: 78, baseLapTime: 71.4, lengthKm: 3.337, timeOfDay: 'day', skyColor: 0x0284c7, groundColor: 0x1e293b,
            rainChance: 0.20, tireWearRate: 0.72, aeroWeight: 0.88, powerWeight: 0.12, pitLossSec: 19.8,
            drsZones: [[0.0, 0.11]],
            waypoints: [[0,-220],[160,-210],[220,-130],[180,-30],[80,-20],[40,40],[120,110],[190,190],[60,230],[-110,210],[-210,120],[-180,-20],[-120,-120],[-170,-210]]
        },
        {
            id: 'spain', round: 9, code: 'ESP', name: '스페인 그랑프리 (바르셀로나-카탈루냐)', engName: 'Spanish Grand Prix', location: 'Barcelona',
            realLaps: 66, baseLapTime: 76.5, lengthKm: 4.657, timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x1f361d,
            rainChance: 0.14, tireWearRate: 1.36, aeroWeight: 0.68, powerWeight: 0.32, pitLossSec: 22.0,
            drsZones: [[0.0, 0.16], [0.56, 0.69]],
            waypoints: [[0,-250],[230,-250],[260,-140],[170,-40],[245,80],[210,220],[50,250],[-140,230],[-250,120],[-220,-60],[-200,-230]]
        },
        {
            id: 'canada', round: 10, code: 'CAN', name: '캐나다 그랑프리 (몬트리올 질 빌뇌브)', engName: 'Canadian Grand Prix', location: 'Montreal',
            realLaps: 70, baseLapTime: 73.1, lengthKm: 4.361, timeOfDay: 'day', skyColor: 0x3b82f6, groundColor: 0x143322,
            rainChance: 0.38, tireWearRate: 0.95, aeroWeight: 0.38, powerWeight: 0.62, pitLossSec: 19.2,
            drsZones: [[0.0, 0.14], [0.68, 0.86]],
            waypoints: [[0,-250],[230,-240],[270,-120],[210,40],[250,190],[120,250],[-160,240],[-265,140],[-240,-60],[-190,-220]]
        },
        {
            id: 'austria', round: 11, code: 'AUT', name: '오스트리아 그랑프리 (레드불 링)', engName: 'Austrian Grand Prix', location: 'Spielberg',
            realLaps: 71, baseLapTime: 65.8, lengthKm: 4.318, timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x12381c,
            rainChance: 0.32, tireWearRate: 1.12, aeroWeight: 0.42, powerWeight: 0.58, pitLossSec: 20.5,
            drsZones: [[0.0, 0.16], [0.22, 0.38], [0.44, 0.58]],
            waypoints: [[0,-230],[220,-225],[250,-60],[160,120],[60,80],[-20,190],[-180,220],[-245,60],[-210,-180]]
        },
        {
            id: 'silverstone', round: 12, code: 'GBR', name: '영국 그랑프리 (실버스톤 서킷)', engName: 'British Grand Prix', location: 'Silverstone',
            realLaps: 52, baseLapTime: 87.2, lengthKm: 5.891, timeOfDay: 'day', skyColor: 0x475569, groundColor: 0x14331b,
            rainChance: 0.42, tireWearRate: 1.32, aeroWeight: 0.68, powerWeight: 0.32, pitLossSec: 20.2,
            drsZones: [[0.22, 0.36], [0.64, 0.79]],
            waypoints: [[0,-280],[230,-270],[280,-150],[220,-20],[270,110],[200,250],[30,270],[-90,180],[-180,240],[-270,120],[-240,-60],[-160,-180],[-190,-260]]
        },
        {
            id: 'spa', round: 13, code: 'BEL', name: '벨기에 그랑프리 (스파-프랑코르샹)', engName: 'Belgian Grand Prix', location: 'Spa-Francorchamps',
            realLaps: 44, baseLapTime: 104.5, lengthKm: 7.004, timeOfDay: 'day', skyColor: 0x334155, groundColor: 0x0f2917,
            rainChance: 0.48, tireWearRate: 1.25, aeroWeight: 0.50, powerWeight: 0.50, pitLossSec: 23.0,
            drsZones: [[0.14, 0.32], [0.85, 0.99]],
            waypoints: [[0,-300],[180,-290],[290,-160],[310,40],[210,220],[60,290],[-70,210],[-170,270],[-290,150],[-260,-40],[-190,-170],[-220,-280]]
        },
        {
            id: 'hungary', round: 14, code: 'HUN', name: '헝가리 그랑프리 (헝가로링)', engName: 'Hungarian Grand Prix', location: 'Budapest',
            realLaps: 70, baseLapTime: 76.9, lengthKm: 4.381, timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x1e381d,
            rainChance: 0.20, tireWearRate: 1.18, aeroWeight: 0.80, powerWeight: 0.20, pitLossSec: 21.0,
            drsZones: [[0.0, 0.15], [0.18, 0.29]],
            waypoints: [[0,-240],[200,-235],[240,-110],[130,-30],[220,70],[180,210],[30,240],[-100,150],[-210,210],[-245,70],[-180,-80],[-210,-220]]
        },
        {
            id: 'zandvoort', round: 15, code: 'NED', name: '네덜란드 그랑프리 (잔드보르트 서킷)', engName: 'Dutch Grand Prix', location: 'Zandvoort',
            realLaps: 72, baseLapTime: 71.2, lengthKm: 4.259, timeOfDay: 'day', skyColor: 0x0284c7, groundColor: 0x2b291e,
            rainChance: 0.35, tireWearRate: 1.28, aeroWeight: 0.74, powerWeight: 0.26, pitLossSec: 19.5,
            drsZones: [[0.0, 0.14], [0.76, 0.90]],
            waypoints: [[0,-235],[195,-230],[240,-100],[150,10],[220,140],[100,235],[-80,220],[-220,130],[-235,-40],[-175,-195]]
        },
        {
            id: 'monza', round: 16, code: 'ITA', name: '이탈리아 그랑프리 (몬차 국립 서킷)', engName: 'Italian Grand Prix', location: 'Monza',
            realLaps: 53, baseLapTime: 80.1, lengthKm: 5.793, timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x1b3b1f,
            rainChance: 0.12, tireWearRate: 0.92, aeroWeight: 0.18, powerWeight: 0.82, pitLossSec: 24.0,
            drsZones: [[0.0, 0.18], [0.55, 0.72]],
            waypoints: [[-40,-290],[250,-290],[290,-210],[260,-40],[230,170],[150,270],[-120,260],[-270,180],[-280,-80],[-240,-270]]
        },
        {
            id: 'baku', round: 17, code: 'AZE', name: '아제르바이잔 그랑프리 (바쿠 시가지)', engName: 'Azerbaijan Grand Prix', location: 'Baku',
            realLaps: 51, baseLapTime: 102.8, lengthKm: 6.003, timeOfDay: 'day', skyColor: 0x0284c7, groundColor: 0x1e2430,
            rainChance: 0.06, tireWearRate: 0.98, aeroWeight: 0.28, powerWeight: 0.72, pitLossSec: 20.5,
            drsZones: [[0.0, 0.22], [0.27, 0.39]],
            waypoints: [[-60,-290],[270,-290],[290,-160],[160,-150],[150,-20],[270,30],[260,230],[70,270],[-150,250],[-280,140],[-285,-180],[-220,-285]]
        },
        {
            id: 'singapore', round: 18, code: 'SIN', name: '싱가포르 그랑프리 (마리나 베이 야간)', engName: 'Singapore Grand Prix', location: 'Marina Bay',
            realLaps: 62, baseLapTime: 90.8, lengthKm: 4.940, timeOfDay: 'night', skyColor: 0x030712, groundColor: 0x0f172a,
            rainChance: 0.30, tireWearRate: 1.16, aeroWeight: 0.78, powerWeight: 0.22, pitLossSec: 28.0,
            drsZones: [[0.0, 0.13], [0.46, 0.59], [0.74, 0.85]],
            waypoints: [[0,-250],[200,-240],[240,-120],[140,-50],[230,40],[210,190],[80,250],[-60,170],[-180,240],[-250,110],[-190,-30],[-240,-170],[-150,-240]]
        },
        {
            id: 'austin', round: 19, code: 'USA', name: '미국 그랑프리 (COTA 오스틴)', engName: 'United States Grand Prix', location: 'Austin',
            realLaps: 56, baseLapTime: 95.4, lengthKm: 5.513, timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x24331c,
            rainChance: 0.15, tireWearRate: 1.30, aeroWeight: 0.60, powerWeight: 0.40, pitLossSec: 20.8,
            drsZones: [[0.0, 0.12], [0.52, 0.70]],
            waypoints: [[0,-265],[210,-255],[270,-130],[170,-20],[255,120],[190,255],[-80,250],[-260,180],[-240,20],[-150,-80],[-230,-220]]
        },
        {
            id: 'mexico', round: 20, code: 'MEX', name: '멕시코시티 그랑프리 (에르마노스 로드리게스)', engName: 'Mexico City Grand Prix', location: 'Mexico City',
            realLaps: 71, baseLapTime: 77.6, lengthKm: 4.304, timeOfDay: 'day', skyColor: 0x0284c7, groundColor: 0x1c3320,
            rainChance: 0.16, tireWearRate: 1.05, aeroWeight: 0.58, powerWeight: 0.42, pitLossSec: 22.2,
            drsZones: [[0.0, 0.19], [0.34, 0.48]],
            waypoints: [[-30,-250],[245,-250],[265,-120],[170,10],[235,160],[110,245],[-90,220],[-230,130],[-245,-90],[-195,-240]]
        },
        {
            id: 'interlagos', round: 21, code: 'BRA', name: '상파울루 그랑프리 (인테르라고스)', engName: 'São Paulo Grand Prix', location: 'Interlagos',
            realLaps: 71, baseLapTime: 70.9, lengthKm: 4.309, timeOfDay: 'day', skyColor: 0x2563eb, groundColor: 0x1c3d1e,
            rainChance: 0.46, tireWearRate: 1.18, aeroWeight: 0.55, powerWeight: 0.45, pitLossSec: 20.5,
            drsZones: [[0.0, 0.16], [0.28, 0.43]],
            waypoints: [[0,-240],[210,-230],[240,-90],[160,40],[60,10],[20,110],[140,200],[30,250],[-170,210],[-240,60],[-190,-140]]
        },
        {
            id: 'lasvegas', round: 22, code: 'LVG', name: '라스베이거스 그랑프리 (스트립 야간)', engName: 'Las Vegas Grand Prix', location: 'Las Vegas',
            realLaps: 50, baseLapTime: 93.2, lengthKm: 6.201, timeOfDay: 'night', skyColor: 0x04060e, groundColor: 0x11131a,
            rainChance: 0.04, tireWearRate: 0.90, aeroWeight: 0.25, powerWeight: 0.75, pitLossSec: 21.0,
            drsZones: [[0.0, 0.13], [0.52, 0.78]],
            waypoints: [[-20,-280],[240,-270],[280,-140],[220,10],[260,170],[140,270],[-180,260],[-290,180],[-280,-120],[-210,-260]]
        },
        {
            id: 'qatar', round: 23, code: 'QAT', name: '카타르 그랑프리 (루사일 인터내셔널)', engName: 'Qatar Grand Prix', location: 'Lusail',
            realLaps: 57, baseLapTime: 82.4, lengthKm: 5.419, timeOfDay: 'night', skyColor: 0x050814, groundColor: 0x292116,
            rainChance: 0.02, tireWearRate: 1.42, aeroWeight: 0.68, powerWeight: 0.32, pitLossSec: 24.5,
            drsZones: [[0.0, 0.17]],
            waypoints: [[0,-260],[230,-255],[265,-120],[180,0],[255,130],[170,250],[0,260],[-120,150],[-230,220],[-265,60],[-200,-90],[-230,-240]]
        },
        {
            id: 'abudhabi', round: 24, code: 'ABU', name: '아부다비 그랑프리 (야스 마리나 피날레)', engName: 'Abu Dhabi Grand Prix', location: 'Yas Marina',
            realLaps: 58, baseLapTime: 84.6, lengthKm: 5.281, timeOfDay: 'sunset', skyColor: 0x1e1b4b, groundColor: 0x1f242d,
            rainChance: 0.02, tireWearRate: 1.12, aeroWeight: 0.55, powerWeight: 0.45, pitLossSec: 21.5,
            drsZones: [[0.25, 0.44], [0.49, 0.65]],
            waypoints: [[0,-260],[210,-250],[270,-110],[250,120],[150,250],[-20,260],[-110,160],[-220,220],[-270,70],[-210,-110],[-230,-230]]
        }
    ],

    // 5 Official Pirelli Tire Compounds
    tireCompounds: {
        SOFT:   { id: 'SOFT',   name: 'Soft (C5)',         short: 'S', color: '#E10600', hex: 0xe10600, paceDelta: -0.65, baseWearPerLap: 3.1, optimalTemp: 102, wetGrip: 0.35 },
        MEDIUM: { id: 'MEDIUM', name: 'Medium (C3)',       short: 'M', color: '#FFD100', hex: 0xffd100, paceDelta: 0.00,  baseWearPerLap: 1.85, optimalTemp: 96,  wetGrip: 0.38 },
        HARD:   { id: 'HARD',   name: 'Hard (C1)',         short: 'H', color: '#F0F4F8', hex: 0xf0f4f8, paceDelta: +0.55, baseWearPerLap: 1.15, optimalTemp: 90,  wetGrip: 0.34 },
        INTER:  { id: 'INTER',  name: 'Intermediate',      short: 'I', color: '#00D65B', hex: 0x00d65b, paceDelta: +2.80, baseWearPerLap: 1.70, optimalTemp: 75,  wetGrip: 0.94 },
        WET:    { id: 'WET',    name: 'Full Wet (Extreme)', short: 'W', color: '#0088FF', hex: 0x0088ff, paceDelta: +5.40, baseWearPerLap: 1.30, optimalTemp: 62,  wetGrip: 1.00 }
    },

    // R&D Engineering Tree
    rdTree: {
        aero: {
            name: 'Aerodynamics (공력 설계부)',
            code: 'AERO',
            color: '#00D2BE',
            upgrades: [
                { level: 1, name: 'Front Wing Endplate Outwash Spec', cost: 4500000, gain: 2, desc: '프론트 윙 엔드플레이트 와류 제어 (+2 AERO)' },
                { level: 2, name: 'Venturi Floor Edge Wing Spec-B', cost: 7200000, gain: 3, desc: '언더플로어 벤투리 터널 다운포스 증대 (+3 AERO)' },
                { level: 3, name: 'Deep Undercut Sidepod Packaging', cost: 11000000, gain: 3, desc: '사이드포드 공기저항 계수 감소 (+3 AERO)' },
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
                { level: 1, name: 'Seamless Shift Gearbox Sealing', cost: 3800000, gain: 2, desc: '기어박스 신뢰도 향상 (+2 DURA)' },
                { level: 2, name: 'Automated Laser Wheel Gun System', cost: 6400000, gain: 3, desc: '피트스톱 정지 시간 -0.25초 단축 (+3 DURA)' },
                { level: 3, name: 'Carbon-Carbon Brake Cooling Spec', cost: 9800000, gain: 3, desc: '브레이크 락업 및 실수율 감소 (+3 DURA)' },
                { level: 4, name: 'Pit Crew Biomechanics Sync', cost: 13800000, gain: 4, desc: '1.9초대 칼같은 더블 스택 피트스톱 (+4 DURA)' },
                { level: 5, name: 'Zero-Fault Race Operations Spec', cost: 19000000, gain: 5, desc: '최고 수준의 레이스 오퍼레이션 완성 (+5 DURA)' }
            ]
        }
    },

    pointsTable: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
};
