// =========================================================================
// F1 APEX MOTORSPORT MANAGER & 3D GRAND PRIX SIMULATOR - DATA & DATABASE
// =========================================================================

window.F1Data = {
    // 10 Constructors (2025/26 Grid + Authentic Performance & Livery Colors)
    teams: [
        {
            id: 'redbull',
            name: 'Oracle Red Bull Racing',
            shortName: 'Red Bull',
            code: 'RBR',
            country: '🇦🇹 오스트리아',
            principal: '크리스티안 호너',
            engine: 'Honda RBPT',
            primaryColor: '#0600ef',
            secondaryColor: '#ef1a2d',
            accentColor: '#ffd700',
            carHex: 0x0a1142,
            wingHex: 0xef1a2d,
            haloHex: 0x0a1142,
            budget: 145000000, // $145M Cost Cap
            prestige: 98,
            specs: {
                aero: 95,       // Downforce & cornering
                powertrain: 96, // Top speed & acceleration
                chassis: 93,    // Tire wear & weight
                durability: 91  // Reliability & ERS cooling
            },
            facilities: {
                windTunnel: 5,
                cfd: 5,
                simulator: 5,
                pitCrew: 96
            },
            sponsors: {
                title: { name: 'Oracle Cloud', payoutPerRace: 4200000, bonusTarget: 3, bonusAmount: 1800000 },
                secondary: [
                    { name: 'Bybit', payoutPerRace: 1200000 },
                    { name: 'Tag Heuer', payoutPerRace: 950000 },
                    { name: 'Mobil 1', payoutPerRace: 850000 }
                ]
            },
            desc: '최강의 에어로다이내믹 효율과 직선 가속력을 자랑하는 디펜딩 챔피언 컨스트럭터.'
        },
        {
            id: 'ferrari',
            name: 'Scuderia Ferrari HP',
            shortName: 'Ferrari',
            code: 'FER',
            country: '🇮🇹 이탈리아',
            principal: '프레데릭 바수르',
            engine: 'Ferrari 066/12',
            primaryColor: '#dc0000',
            secondaryColor: '#fff200',
            accentColor: '#ffffff',
            carHex: 0xd40000,
            wingHex: 0x111111,
            haloHex: 0x111111,
            budget: 145000000,
            prestige: 99,
            specs: {
                aero: 94,
                powertrain: 96,
                chassis: 94,
                durability: 90
            },
            facilities: {
                windTunnel: 5,
                cfd: 4,
                simulator: 5,
                pitCrew: 93
            },
            sponsors: {
                title: { name: 'HP Enterprise', payoutPerRace: 4500000, bonusTarget: 2, bonusAmount: 2000000 },
                secondary: [
                    { name: 'Shell V-Power', payoutPerRace: 1400000 },
                    { name: 'Santander', payoutPerRace: 1100000 },
                    { name: 'Puma Motorsport', payoutPerRace: 800000 }
                ]
            },
            desc: '마라넬로의 자존심. 르클레르와 해밀턴이라는 역사상 가장 화려한 슈퍼스타 듀오를 보유한 명문.'
        },
        {
            id: 'mclaren',
            name: 'McLaren Formula 1 Team',
            shortName: 'McLaren',
            code: 'MCL',
            country: '🇬🇧 영국',
            principal: '안드레아 스텔라',
            engine: 'Mercedes-AMG M15',
            primaryColor: '#ff8000',
            secondaryColor: '#111111',
            accentColor: '#00c8ff',
            carHex: 0xff7700,
            wingHex: 0x18181b,
            haloHex: 0x18181b,
            budget: 142000000,
            prestige: 96,
            specs: {
                aero: 96,
                powertrain: 94,
                chassis: 95,
                durability: 93
            },
            facilities: {
                windTunnel: 5,
                cfd: 5,
                simulator: 4,
                pitCrew: 95
            },
            sponsors: {
                title: { name: 'Mastercard & OKX', payoutPerRace: 3900000, bonusTarget: 3, bonusAmount: 1600000 },
                secondary: [
                    { name: 'Google Chrome', payoutPerRace: 1300000 },
                    { name: 'Dell Technologies', payoutPerRace: 950000 },
                    { name: 'Monster Energy', payoutPerRace: 750000 }
                ]
            },
            desc: '파파야 오렌지 돌풍! 가장 완벽한 고속 코너링 밸런스와 타이어 관리 능력을 갖춘 컨스트럭터 챔피언.'
        },
        {
            id: 'mercedes',
            name: 'Mercedes-AMG PETRONAS F1',
            shortName: 'Mercedes',
            code: 'MER',
            country: '🇩🇪 독일',
            principal: '토토 볼프',
            engine: 'Mercedes-AMG M15',
            primaryColor: '#00d2be',
            secondaryColor: '#111827',
            accentColor: '#c0c0c0',
            carHex: 0x101820,
            wingHex: 0x00d2be,
            haloHex: 0xc0c0c0,
            budget: 140000000,
            prestige: 95,
            specs: {
                aero: 91,
                powertrain: 95,
                chassis: 92,
                durability: 95
            },
            facilities: {
                windTunnel: 5,
                cfd: 4,
                simulator: 5,
                pitCrew: 94
            },
            sponsors: {
                title: { name: 'PETRONAS Syntium', payoutPerRace: 4000000, bonusTarget: 4, bonusAmount: 1500000 },
                secondary: [
                    { name: 'INEOS', payoutPerRace: 1250000 },
                    { name: 'TeamViewer', payoutPerRace: 900000 },
                    { name: 'IWC Schaffhausen', payoutPerRace: 700000 }
                ]
            },
            desc: '실버 애로우의 부활을 노리는 브래클리 군단. 조지 러셀과 천재 루키 안토넬리의 신구 조화.'
        },
        {
            id: 'astonmartin',
            name: 'Aston Martin Aramco F1',
            shortName: 'Aston Martin',
            code: 'AMR',
            country: '🇬🇧 영국',
            principal: '마이크 크랙',
            engine: 'Mercedes-AMG M15',
            primaryColor: '#006f62',
            secondaryColor: '#cedc00',
            accentColor: '#ffffff',
            carHex: 0x00594f,
            wingHex: 0xcedc00,
            haloHex: 0x00594f,
            budget: 136000000,
            prestige: 86,
            specs: {
                aero: 87,
                powertrain: 92,
                chassis: 86,
                durability: 90
            },
            facilities: {
                windTunnel: 5,
                cfd: 4,
                simulator: 4,
                pitCrew: 88
            },
            sponsors: {
                title: { name: 'Aramco Racing', payoutPerRace: 3500000, bonusTarget: 6, bonusAmount: 1200000 },
                secondary: [
                    { name: 'Cognizant', payoutPerRace: 1000000 },
                    { name: 'Valvoline', payoutPerRace: 750000 }
                ]
            },
            desc: '실버스톤 최신예 풍동 시설과 아드리안 뉴이의 합류로 도약을 준비하는 브리티시 레이싱 그린.'
        },
        {
            id: 'alpine',
            name: 'BWT Alpine F1 Team',
            shortName: 'Alpine',
            code: 'ALP',
            country: '🇫🇷 프랑스',
            principal: '올리버 오크스',
            engine: 'Renault E-Tech',
            primaryColor: '#0090ff',
            secondaryColor: '#ff66b2',
            accentColor: '#ffffff',
            carHex: 0x0055b3,
            wingHex: 0xff4da6,
            haloHex: 0x111111,
            budget: 125000000,
            prestige: 80,
            specs: {
                aero: 84,
                powertrain: 83,
                chassis: 85,
                durability: 84
            },
            facilities: {
                windTunnel: 3,
                cfd: 3,
                simulator: 3,
                pitCrew: 85
            },
            sponsors: {
                title: { name: 'BWT Water', payoutPerRace: 2600000, bonusTarget: 8, bonusAmount: 900000 },
                secondary: [
                    { name: 'Castrol Edge', payoutPerRace: 800000 },
                    { name: 'MSV Crypto', payoutPerRace: 600000 }
                ]
            },
            desc: '프랑스 엔스톤의 중위권 강자. 파워유닛의 열세를 섀시 경량화와 과감한 전략으로 극복한다.'
        },
        {
            id: 'williams',
            name: 'Williams Racing',
            shortName: 'Williams',
            code: 'WIL',
            country: '🇬🇧 영국',
            principal: '제임스 바울스',
            engine: 'Mercedes-AMG M15',
            primaryColor: '#005aff',
            secondaryColor: '#00a0de',
            accentColor: '#ffffff',
            carHex: 0x0046ad,
            wingHex: 0x00a0de,
            haloHex: 0x0046ad,
            budget: 122000000,
            prestige: 84,
            specs: {
                aero: 83,
                powertrain: 92,
                chassis: 84,
                durability: 87
            },
            facilities: {
                windTunnel: 3,
                cfd: 4,
                simulator: 3,
                pitCrew: 86
            },
            sponsors: {
                title: { name: 'Atlassian & Komatsu', payoutPerRace: 2500000, bonusTarget: 8, bonusAmount: 950000 },
                secondary: [
                    { name: 'Duracell', payoutPerRace: 850000 },
                    { name: 'Gulf Oil', payoutPerRace: 700000 }
                ]
            },
            desc: '알본과 사인츠라는 최정상급 드라이버 라인업을 구축하며 과거 명가의 영광을 되찾고 있는 그로브 팀.'
        },
        {
            id: 'rb',
            name: 'Visa Cash App Racing Bulls',
            shortName: 'Racing Bulls',
            code: 'VCARB',
            country: '🇮🇹 이탈리아',
            principal: '로랑 메키스',
            engine: 'Honda RBPT',
            primaryColor: '#1634cb',
            secondaryColor: '#ffffff',
            accentColor: '#ff0040',
            carHex: 0x1634cb,
            wingHex: 0xffffff,
            haloHex: 0xff0040,
            budget: 118000000,
            prestige: 78,
            specs: {
                aero: 84,
                powertrain: 93,
                chassis: 83,
                durability: 86
            },
            facilities: {
                windTunnel: 3,
                cfd: 3,
                simulator: 3,
                pitCrew: 84
            },
            sponsors: {
                title: { name: 'Visa Cash App', payoutPerRace: 2400000, bonusTarget: 9, bonusAmount: 850000 },
                secondary: [
                    { name: 'Hugo Boss', payoutPerRace: 700000 },
                    { name: 'Orlen', payoutPerRace: 550000 }
                ]
            },
            desc: '이탈리아 파엔차에 기반을 둔 레드불 패밀리 팀. 날카로운 중속 코너링과 공격적인 언더컷 전략이 특징.'
        },
        {
            id: 'haas',
            name: 'MoneyGram Haas F1 Team',
            shortName: 'Haas',
            code: 'HAA',
            country: '🇺🇸 미국',
            principal: '아야오 코마츠',
            engine: 'Ferrari 066/12',
            primaryColor: '#e6002b',
            secondaryColor: '#1f2937',
            accentColor: '#ffffff',
            carHex: 0x18181b,
            wingHex: 0xe6002b,
            haloHex: 0xffffff,
            budget: 115000000,
            prestige: 75,
            specs: {
                aero: 82,
                powertrain: 93,
                chassis: 82,
                durability: 85
            },
            facilities: {
                windTunnel: 3,
                cfd: 3,
                simulator: 2,
                pitCrew: 81
            },
            sponsors: {
                title: { name: 'MoneyGram & Toyota Gazoo', payoutPerRace: 2300000, bonusTarget: 9, bonusAmount: 800000 },
                secondary: [
                    { name: 'Haas Automation', payoutPerRace: 650000 },
                    { name: 'Chipotle', payoutPerRace: 500000 }
                ]
            },
            desc: '실용주의 엔지니어링과 토요타 가주 레이싱 기술 제휴로 중위권 반란을 일으키는 미국 F1 팀.'
        },
        {
            id: 'sauber',
            name: 'Stake F1 Team Kick Sauber (Audi)',
            shortName: 'Kick Sauber',
            code: 'SAU',
            country: '🇨🇭 스위스',
            principal: '마티아 비노토',
            engine: 'Ferrari / Audi Dev',
            primaryColor: '#52e252',
            secondaryColor: '#090d16',
            accentColor: '#ffffff',
            carHex: 0x11151c,
            wingHex: 0x00ff44,
            haloHex: 0x00ff44,
            budget: 116000000,
            prestige: 76,
            specs: {
                aero: 80,
                powertrain: 89,
                chassis: 81,
                durability: 83
            },
            facilities: {
                windTunnel: 3,
                cfd: 3,
                simulator: 3,
                pitCrew: 79
            },
            sponsors: {
                title: { name: 'Stake & Kick Streaming', payoutPerRace: 2200000, bonusTarget: 10, bonusAmount: 900000 },
                secondary: [
                    { name: 'Audi Sport', payoutPerRace: 750000 },
                    { name: 'Pirelli Partner', payoutPerRace: 450000 }
                ]
            },
            desc: '아우디 팩토리 워크스 전환을 앞두고 대대적인 R&D 투자를 감행 중인 스위스 힌빌 팀.'
        }
    ],

    // 20 Active Grid Drivers + 6 Reserve/Market Drivers
    drivers: [
        // Red Bull
        { id: 'verstappen', name: '막스 베르스타펜', engName: 'Max Verstappen', code: 'VER', number: 1, teamId: 'redbull', role: 1, country: '🇳🇱', age: 27, ovr: 97, pace: 98, racecraft: 97, awareness: 93, tireMgmt: 96, wetSkill: 98, salary: 1850000, contractYears: 3, morale: 95, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'lawson', name: '리암 로슨', engName: 'Liam Lawson', code: 'LAW', number: 30, teamId: 'redbull', role: 2, country: '🇳🇿', age: 23, ovr: 84, pace: 85, racecraft: 86, awareness: 82, tireMgmt: 82, wetSkill: 84, salary: 350000, contractYears: 2, morale: 88, points: 0, wins: 0, podiums: 0, poles: 0 },

        // Ferrari
        { id: 'leclerc', name: '샤를 르클레르', engName: 'Charles Leclerc', code: 'LEC', number: 16, teamId: 'ferrari', role: 1, country: '🇲🇨', age: 27, ovr: 95, pace: 98, racecraft: 94, awareness: 93, tireMgmt: 92, wetSkill: 92, salary: 1500000, contractYears: 4, morale: 94, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'hamilton', name: '루이스 해밀턴', engName: 'Lewis Hamilton', code: 'HAM', number: 44, teamId: 'ferrari', role: 2, country: '🇬🇧', age: 40, ovr: 94, pace: 93, racecraft: 96, awareness: 95, tireMgmt: 97, wetSkill: 97, salary: 1750000, contractYears: 2, morale: 96, points: 0, wins: 0, podiums: 0, poles: 0 },

        // McLaren
        { id: 'norris', name: '랜도 노리스', engName: 'Lando Norris', code: 'NOR', number: 4, teamId: 'mclaren', role: 1, country: '🇬🇧', age: 25, ovr: 95, pace: 96, racecraft: 93, awareness: 94, tireMgmt: 95, wetSkill: 95, salary: 1350000, contractYears: 3, morale: 95, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'piastri', name: '오스카 피아스트리', engName: 'Oscar Piastri', code: 'PIA', number: 81, teamId: 'mclaren', role: 2, country: '🇦🇺', age: 24, ovr: 92, pace: 93, racecraft: 94, awareness: 93, tireMgmt: 90, wetSkill: 91, salary: 950000, contractYears: 3, morale: 93, points: 0, wins: 0, podiums: 0, poles: 0 },

        // Mercedes
        { id: 'russell', name: '조지 러셀', engName: 'George Russell', code: 'RUS', number: 63, teamId: 'mercedes', role: 1, country: '🇬🇧', age: 27, ovr: 92, pace: 94, racecraft: 91, awareness: 90, tireMgmt: 91, wetSkill: 92, salary: 1100000, contractYears: 2, morale: 91, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'antonelli', name: '키미 안토넬리', engName: 'Kimi Antonelli', code: 'ANT', number: 12, teamId: 'mercedes', role: 2, country: '🇮🇹', age: 18, ovr: 83, pace: 88, racecraft: 82, awareness: 79, tireMgmt: 80, wetSkill: 85, salary: 280000, contractYears: 3, morale: 92, points: 0, wins: 0, podiums: 0, poles: 0 },

        // Aston Martin
        { id: 'alonso', name: '페르난도 알론소', engName: 'Fernando Alonso', code: 'ALO', number: 14, teamId: 'astonmartin', role: 1, country: '🇪🇸', age: 43, ovr: 91, pace: 90, racecraft: 96, awareness: 95, tireMgmt: 94, wetSkill: 95, salary: 1150000, contractYears: 2, morale: 87, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'stroll', name: '랜스 스트롤', engName: 'Lance Stroll', code: 'STR', number: 18, teamId: 'astonmartin', role: 2, country: '🇨🇦', age: 26, ovr: 80, pace: 80, racecraft: 81, awareness: 77, tireMgmt: 81, wetSkill: 86, salary: 320000, contractYears: 3, morale: 82, points: 0, wins: 0, podiums: 0, poles: 0 },

        // Alpine
        { id: 'gasly', name: '피에르 가슬리', engName: 'Pierre Gasly', code: 'GAS', number: 10, teamId: 'alpine', role: 1, country: '🇫🇷', age: 29, ovr: 87, pace: 88, racecraft: 87, awareness: 86, tireMgmt: 86, wetSkill: 88, salary: 650000, contractYears: 2, morale: 85, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'doohan', name: '잭 두한', engName: 'Jack Doohan', code: 'DOO', number: 7, teamId: 'alpine', role: 2, country: '🇦🇺', age: 22, ovr: 79, pace: 81, racecraft: 79, awareness: 78, tireMgmt: 78, wetSkill: 79, salary: 200000, contractYears: 1, morale: 84, points: 0, wins: 0, podiums: 0, poles: 0 },

        // Williams
        { id: 'sainz', name: '카를로스 사인츠', engName: 'Carlos Sainz', code: 'SAI', number: 55, teamId: 'williams', role: 1, country: '🇪🇸', age: 30, ovr: 91, pace: 91, racecraft: 92, awareness: 93, tireMgmt: 91, wetSkill: 90, salary: 980000, contractYears: 2, morale: 90, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'albon', name: '알렉산더 알본', engName: 'Alexander Albon', code: 'ALB', number: 23, teamId: 'williams', role: 2, country: '🇹🇭', age: 29, ovr: 87, pace: 88, racecraft: 87, awareness: 87, tireMgmt: 88, wetSkill: 86, salary: 620000, contractYears: 2, morale: 89, points: 0, wins: 0, podiums: 0, poles: 0 },

        // Racing Bulls
        { id: 'tsunoda', name: '츠노다 유키', engName: 'Yuki Tsunoda', code: 'TSU', number: 22, teamId: 'rb', role: 1, country: '🇯🇵', age: 24, ovr: 85, pace: 87, racecraft: 85, awareness: 82, tireMgmt: 83, wetSkill: 84, salary: 450000, contractYears: 1, morale: 85, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'hadjar', name: '아이작 하자르', engName: 'Isack Hadjar', code: 'HAD', number: 6, teamId: 'rb', role: 2, country: '🇫🇷', age: 20, ovr: 79, pace: 82, racecraft: 80, awareness: 76, tireMgmt: 77, wetSkill: 79, salary: 190000, contractYears: 2, morale: 86, points: 0, wins: 0, podiums: 0, poles: 0 },

        // Haas
        { id: 'ocon', name: '에스테반 오콘', engName: 'Esteban Ocon', code: 'OCO', number: 31, teamId: 'haas', role: 1, country: '🇫🇷', age: 28, ovr: 86, pace: 86, racecraft: 87, awareness: 83, tireMgmt: 86, wetSkill: 88, salary: 550000, contractYears: 2, morale: 86, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'bearman', name: '올리버 베어먼', engName: 'Oliver Bearman', code: 'BEA', number: 87, teamId: 'haas', role: 2, country: '🇬🇧', age: 19, ovr: 81, pace: 84, racecraft: 82, awareness: 80, tireMgmt: 79, wetSkill: 81, salary: 230000, contractYears: 2, morale: 90, points: 0, wins: 0, podiums: 0, poles: 0 },

        // Kick Sauber
        { id: 'hulkenberg', name: '니코 휠켄베르크', engName: 'Nico Hulkenberg', code: 'HUL', number: 27, teamId: 'sauber', role: 1, country: '🇩🇪', age: 37, ovr: 86, pace: 88, racecraft: 85, awareness: 88, tireMgmt: 85, wetSkill: 87, salary: 580000, contractYears: 2, morale: 85, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'bortoleto', name: '가브리엘 보르톨레토', engName: 'Gabriel Bortoleto', code: 'BOR', number: 5, teamId: 'sauber', role: 2, country: '🇧🇷', age: 20, ovr: 81, pace: 83, racecraft: 82, awareness: 81, tireMgmt: 80, wetSkill: 80, salary: 220000, contractYears: 2, morale: 89, points: 0, wins: 0, podiums: 0, poles: 0 },

        // Free Agents & Reserve Market Stars
        { id: 'perez', name: '세르히오 페레즈', engName: 'Sergio Perez', code: 'PER', number: 11, teamId: null, role: 0, country: '🇲🇽', age: 35, ovr: 86, pace: 84, racecraft: 88, awareness: 86, tireMgmt: 92, wetSkill: 83, salary: 720000, contractYears: 0, morale: 80, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'bottas', name: '발테리 보타스', engName: 'Valtteri Bottas', code: 'BOT', number: 77, teamId: null, role: 0, country: '🇫🇮', age: 35, ovr: 85, pace: 87, racecraft: 83, awareness: 89, tireMgmt: 85, wetSkill: 82, salary: 520000, contractYears: 0, morale: 82, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'colapinto', name: '프랑코 콜라핀토', engName: 'Franco Colapinto', code: 'COL', number: 43, teamId: null, role: 0, country: '🇦🇷', age: 21, ovr: 82, pace: 84, racecraft: 83, awareness: 80, tireMgmt: 81, wetSkill: 82, salary: 260000, contractYears: 0, morale: 92, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'ricciardo', name: '다니엘 리카도', engName: 'Daniel Ricciardo', code: 'RIC', number: 3, teamId: null, role: 0, country: '🇦🇺', age: 35, ovr: 84, pace: 83, racecraft: 87, awareness: 86, tireMgmt: 84, wetSkill: 84, salary: 500000, contractYears: 0, morale: 85, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'magnussen', name: '케빈 마그누센', engName: 'Kevin Magnussen', code: 'MAG', number: 20, teamId: null, role: 0, country: '🇩🇰', age: 32, ovr: 83, pace: 83, racecraft: 88, awareness: 78, tireMgmt: 81, wetSkill: 85, salary: 420000, contractYears: 0, morale: 83, points: 0, wins: 0, podiums: 0, poles: 0 },
        { id: 'kangmin', name: '강민수 (K-Wonderkid)', engName: 'Minsu Kang', code: 'KAN', number: 99, teamId: null, role: 0, country: '🇰🇷', age: 19, ovr: 85, pace: 89, racecraft: 86, awareness: 84, tireMgmt: 83, wetSkill: 88, salary: 310000, contractYears: 0, morale: 98, points: 0, wins: 0, podiums: 0, poles: 0 }
    ],

    // 10 Iconic Grand Prix Calendar Circuits (Procedural 3D Spline Control Points + Environment)
    circuits: [
        {
            id: 'bahrain',
            round: 1,
            name: '바레인 인터내셔널 서킷',
            engName: 'Bahrain International GP',
            country: '🇧🇭 바레인 사키르',
            laps: 5, // Scaled for dynamic high-intensity gameplay (configurable 3/5/10 laps)
            realLaps: 57,
            baseLapTime: 91.4,
            lengthKm: 5.412,
            timeOfDay: 'night',
            skyColor: 0x050814,
            groundColor: 0x2b2318,
            rainChance: 0.05,
            tireWearRate: 1.35, // High rear thermal degradation
            aeroImportance: 0.45,
            powerImportance: 0.55,
            drsZones: [[0.0, 0.14], [0.58, 0.72]],
            desc: '사막의 밤을 가르는 개막전. 긴 직선 구간과 급격한 브레이킹 존이 많아 ERS 전개와 리어 타이어 열관리가 승부를 가른다.',
            // Normalized control points around a ~650x650m scaled 3D world loop
            waypoints: [
                [0, -260], [210, -260], [260, -210], [210, -120],
                [90, -80], [40, 10], [150, 90], [240, 180],
                [170, 260], [-80, 250], [-230, 190], [-260, 40],
                [-190, -140], [-230, -240]
            ]
        },
        {
            id: 'monaco',
            round: 2,
            name: '모나코 시가지 서킷',
            engName: 'Circuit de Monaco GP',
            country: '🇲🇨 모나코 몬테카를로',
            laps: 5,
            realLaps: 78,
            baseLapTime: 71.8,
            lengthKm: 3.337,
            timeOfDay: 'day',
            skyColor: 0x3b82f6,
            groundColor: 0x1e293b,
            rainChance: 0.20,
            tireWearRate: 0.75,
            aeroImportance: 0.85,
            powerImportance: 0.15,
            drsZones: [[0.0, 0.11]],
            desc: 'F1의 보석. 좁고 굽이치는 가드레일 시가지 트랙으로 추월이 극도로 어려우며 최대 다운포스 세팅과 예선 그리드가 절대적이다.',
            waypoints: [
                [0, -220], [160, -210], [220, -130], [180, -30],
                [80, -20], [40, 40], [120, 110], [190, 190],
                [60, 230], [-110, 210], [-210, 120], [-180, -20],
                [-120, -120], [-170, -210]
            ]
        },
        {
            id: 'silverstone',
            round: 3,
            name: '실버스톤 서킷',
            engName: 'British Grand Prix (Silverstone)',
            country: '🇬🇧 영국 노샘프턴셔',
            laps: 5,
            realLaps: 52,
            baseLapTime: 87.2,
            lengthKm: 5.891,
            timeOfDay: 'day',
            skyColor: 0x475569,
            groundColor: 0x14331b,
            rainChance: 0.42,
            tireWearRate: 1.25,
            aeroImportance: 0.65,
            powerImportance: 0.35,
            drsZones: [[0.22, 0.36], [0.64, 0.79]],
            desc: '모터스포츠의 발상지. 매고츠-베케츠-채플로 이어지는 초고속 연속 코너에서 공력 성능의 진가가 드러나며 변덕스러운 영국 날씨가 변수다.',
            waypoints: [
                [0, -280], [230, -270], [280, -150], [220, -20],
                [270, 110], [200, 250], [30, 270], [-90, 180],
                [-180, 240], [-270, 120], [-240, -60], [-160, -180],
                [-190, -260]
            ]
        },
        {
            id: 'spa',
            round: 4,
            name: '스파-프랑코르샹 서킷',
            engName: 'Belgian Grand Prix (Spa)',
            country: '🇧🇪 벨기에 아르덴',
            laps: 5,
            realLaps: 44,
            baseLapTime: 104.5,
            lengthKm: 7.004,
            timeOfDay: 'day',
            skyColor: 0x334155,
            groundColor: 0x0f2917,
            rainChance: 0.48,
            tireWearRate: 1.20,
            aeroImportance: 0.50,
            powerImportance: 0.50,
            drsZones: [[0.14, 0.32], [0.85, 0.99]],
            desc: '오 루즈와 라디용에 이어지는 켐멜 스트레이트가 압권인 드라이버들의 성지. 아르덴 숲의 국지성 폭우를 대비한 기상 레이더 주시가 필수.',
            waypoints: [
                [0, -300], [180, -290], [290, -160], [310, 40],
                [210, 220], [60, 290], [-70, 210], [-170, 270],
                [-290, 150], [-260, -40], [-190, -170], [-220, -280]
            ]
        },
        {
            id: 'monza',
            round: 5,
            name: '몬차 국립 서킷',
            engName: 'Italian Grand Prix (Monza)',
            country: '🇮🇹 이탈리아 몬차',
            laps: 5,
            realLaps: 53,
            baseLapTime: 80.1,
            lengthKm: 5.793,
            timeOfDay: 'day',
            skyColor: 0x2563eb,
            groundColor: 0x1b3b1f,
            rainChance: 0.12,
            tireWearRate: 0.95,
            aeroImportance: 0.20,
            powerImportance: 0.80,
            drsZones: [[0.0, 0.18], [0.55, 0.72]],
            desc: '스피드의 사원(Temple of Speed). 랩의 80%를 풀 스로틀로 주파하며 로우 다운포스 세팅과 슬립스트림 + DRS 열차 싸움이 치열하다.',
            waypoints: [
                [-40, -290], [250, -290], [290, -210], [260, -40],
                [230, 170], [150, 270], [-120, 260], [-270, 180],
                [-280, -80], [-240, -270]
            ]
        },
        {
            id: 'singapore',
            round: 6,
            name: '마리나 베이 시가지 서킷',
            engName: 'Singapore Night Grand Prix',
            country: '🇸🇬 싱가포르 마리나베이',
            laps: 5,
            realLaps: 62,
            baseLapTime: 90.8,
            lengthKm: 4.940,
            timeOfDay: 'night',
            skyColor: 0x030712,
            groundColor: 0x0f172a,
            rainChance: 0.30,
            tireWearRate: 1.15,
            aeroImportance: 0.78,
            powerImportance: 0.22,
            drsZones: [[0.0, 0.13], [0.46, 0.59]],
            desc: '화려한 네온 야경 속 세이프티카 출동 확률 100%에 육박하는 극한의 시가지 나이트 레이스.',
            waypoints: [
                [0, -250], [200, -240], [240, -120], [140, -50],
                [230, 40], [210, 190], [80, 250], [-60, 170],
                [-180, 240], [-250, 110], [-190, -30], [-240, -170],
                [-150, -240]
            ]
        },
        {
            id: 'suzuka',
            round: 7,
            name: '스즈카 인터내셔널 서킷',
            engName: 'Japanese Grand Prix (Suzuka)',
            country: '🇯🇵 일본 미에현 스즈카',
            laps: 5,
            realLaps: 53,
            baseLapTime: 89.5,
            lengthKm: 5.807,
            timeOfDay: 'day',
            skyColor: 0x38bdf8,
            groundColor: 0x163820,
            rainChance: 0.35,
            tireWearRate: 1.30,
            aeroImportance: 0.70,
            powerImportance: 0.30,
            drsZones: [[0.0, 0.14]],
            desc: '섹터 1 S자 커브와 130R 초고속 코너가 드라이버의 한계를 시험하는 테크니컬 서킷의 교과서.',
            waypoints: [
                [0, -270], [190, -260], [260, -150], [170, -40],
                [250, 70], [210, 220], [50, 260], [-80, 140],
                [-200, 230], [-270, 90], [-210, -80], [-240, -220]
            ]
        },
        {
            id: 'interlagos',
            round: 8,
            name: '인테르라고스 서킷',
            engName: 'São Paulo Grand Prix (Brazil)',
            country: '🇧🇷 브라질 상파울루',
            laps: 5,
            realLaps: 71,
            baseLapTime: 70.9,
            lengthKm: 4.309,
            timeOfDay: 'day',
            skyColor: 0x2563eb,
            groundColor: 0x1c3d1e,
            rainChance: 0.45,
            tireWearRate: 1.15,
            aeroImportance: 0.55,
            powerImportance: 0.45,
            drsZones: [[0.0, 0.16], [0.28, 0.43]],
            desc: '세나 S 커브와 긴 오르막 직선이 공존하는 드라마의 산실. 짧은 랩타임 속에서 쉴 새 없는 배틀이 펼쳐진다.',
            waypoints: [
                [0, -240], [210, -230], [240, -90], [160, 40],
                [60, 10], [20, 110], [140, 200], [30, 250],
                [-170, 210], [-240, 60], [-190, -140]
            ]
        },
        {
            id: 'lasvegas',
            round: 9,
            name: '라스베이거스 스트립 서킷',
            engName: 'Las Vegas Strip Grand Prix',
            country: '🇺🇸 미국 네바다 라스베이거스',
            laps: 5,
            realLaps: 50,
            baseLapTime: 93.2,
            lengthKm: 6.201,
            timeOfDay: 'night',
            skyColor: 0x04060e,
            groundColor: 0x11131a,
            rainChance: 0.05,
            tireWearRate: 0.90,
            aeroImportance: 0.30,
            powerImportance: 0.70,
            drsZones: [[0.0, 0.13], [0.52, 0.78]],
            desc: '라스베이거스 스트립 야경을 시속 350km/h로 질주하는 초고속 야간 시가지 서킷. 차가운 노면에서 타이어 예열이 핵심이다.',
            waypoints: [
                [-20, -280], [240, -270], [280, -140], [220, 10],
                [260, 170], [140, 270], [-180, 260], [-290, 180],
                [-280, -120], [-210, -260]
            ]
        },
        {
            id: 'abudhabi',
            round: 10,
            name: '야스 마리나 서킷',
            engName: 'Abu Dhabi Finale Grand Prix',
            country: '🇦🇪 UAE 아부다비',
            laps: 5,
            realLaps: 58,
            baseLapTime: 84.6,
            lengthKm: 5.281,
            timeOfDay: 'sunset',
            skyColor: 0x1e1b4b,
            groundColor: 0x1f242d,
            rainChance: 0.02,
            tireWearRate: 1.10,
            aeroImportance: 0.55,
            powerImportance: 0.45,
            drsZones: [[0.25, 0.44], [0.49, 0.65]],
            desc: '월드 챔피언이 결정되는 시즌 최종전. 2개의 연속 DRS 스트레이트와 호텔 밑을 지나는 테크니컬 섹터 3가 조화를 이룬다.',
            waypoints: [
                [0, -260], [210, -250], [270, -110], [250, 120],
                [150, 250], [-20, 260], [-110, 160], [-220, 220],
                [-270, 70], [-210, -110], [-230, -230]
            ]
        }
    ],

    // 5 Official Pirelli Tire Compounds
    tireCompounds: {
        SOFT: {
            id: 'SOFT',
            name: '소프트 (Soft C5)',
            short: 'S',
            color: '#ef4444',
            hex: 0xef4444,
            paceBonus: 1.028,     // Fastest grip on dry
            wearPerLap: 14.5,     // High wear
            optimalTemp: [95, 110],
            wetGrip: 0.40,
            desc: '최고의 접지력과 랩타임을 제공하지만 수명이 짧아 공격적인 언더컷이나 예선에 적합합니다.'
        },
        MEDIUM: {
            id: 'MEDIUM',
            name: '미디엄 (Medium C3)',
            short: 'M',
            color: '#facc15',
            hex: 0xfacc15,
            paceBonus: 1.000,     // Balanced baseline
            wearPerLap: 9.2,
            optimalTemp: [90, 105],
            wetGrip: 0.42,
            desc: '속도와 내구성의 완벽한 균형. 대부분의 그랑프리에서 메인 스틴트를 담당하는 표준 컴파운드.'
        },
        HARD: {
            id: 'HARD',
            name: '하드 (Hard C1)',
            short: 'H',
            color: '#f8fafc',
            hex: 0xf8fafc,
            paceBonus: 0.978,     // Slower warmup & grip
            wearPerLap: 5.8,      // Long stint durability
            optimalTemp: [85, 100],
            wetGrip: 0.38,
            desc: '마모도가 가장 낮아 원스톱(1-Stop) 장기 스틴트 전략에 필수적인 고내구 컴파운드.'
        },
        INTER: {
            id: 'INTER',
            name: '인터미디어트 (Intermediate)',
            short: 'I',
            color: '#22c55e',
            hex: 0x22c55e,
            paceBonus: 0.935,
            wearPerLap: 8.5,
            optimalTemp: [65, 85],
            wetGrip: 0.92,
            desc: '노면 수막(10%~55%)이 형성된 약한 비/젖은 노면에서 압도적인 그립을 발휘합니다.'
        },
        WET: {
            id: 'WET',
            name: '풀 웨트 (Full Wet)',
            short: 'W',
            color: '#3b82f6',
            hex: 0x3b82f6,
            paceBonus: 0.885,
            wearPerLap: 6.5,
            optimalTemp: [55, 75],
            wetGrip: 1.00,
            desc: '폭우(수막 55% 이상) 상황에서 초당 85리터의 물을 배수하여 하이드로플레이닝 스핀을 방지합니다.'
        }
    },

    // R&D Tech Tree Nodes (4 Departments x 5 Tiers)
    rdTree: {
        aero: {
            name: '에어로다이내믹 (공력부)',
            icon: '🌪️',
            color: '#38bdf8',
            desc: '코너링 한계 속도와 DRS 직선 효율을 극대화합니다.',
            upgrades: [
                { level: 1, name: '카본 프론트 윙 플랩 최적화', cost: 4500000, gain: 2, desc: '저속 코너 프론트 그립 +2 증가' },
                { level: 2, name: '벤투리 언더플로어 보텍스 터널', cost: 7200000, gain: 3, desc: '그라운드 이펙트 다운포스 +3 증가' },
                { level: 3, name: '언더컷 사이드포드 패키징', cost: 11000000, gain: 3, desc: '공기저항 감소 및 중고속 코너링 +3' },
                { level: 4, name: '빔 윙 & 디퓨저 스톨 제어', cost: 15500000, gain: 4, desc: '고속 안정성 및 DRS 효율 +4 증가' },
                { level: 5, name: '액티브 에어로 플렉시 윙 마스터피스', cost: 22000000, gain: 5, desc: '에어로다이내믹 궁극 진화 (+5)' }
            ]
        },
        powertrain: {
            name: '파워유닛 & ERS (동력부)',
            icon: '⚡',
            color: '#f59e0b',
            desc: '직선 최고 속도와 MGU-K 하이브리드 배터리 회생/출력 효율을 강화합니다.',
            upgrades: [
                { level: 1, name: '터보차저 인터쿨러 맵핑', cost: 4800000, gain: 2, desc: '가속 응답성 및 파워트레인 +2' },
                { level: 2, name: 'MGU-K 고밀도 리튬배터리 셀', cost: 7600000, gain: 3, desc: 'ERS 배터리 회생량 +15% 및 파워 +3' },
                { level: 3, name: '초고압 직분사 연소실 개량', cost: 11500000, gain: 3, desc: '직선 구간 최고속도 +4km/h 및 파워 +3' },
                { level: 4, name: 'e-연료 합성 윤활 아키텍처', cost: 16000000, gain: 4, desc: '오버테이크 모드 출력 지속시간 +4' },
                { level: 5, name: '하이퍼 MGU-H/K 통합 맵핑', cost: 23000000, gain: 5, desc: '파워유닛 궁극 출력 달성 (+5)' }
            ]
        },
        chassis: {
            name: '섀시 & 서스펜션 (차체부)',
            icon: '🛞',
            color: '#10b981',
            desc: '차량 중량을 줄이고 피렐리 타이어 마모율과 연석 충격 흡수를 개선합니다.',
            upgrades: [
                { level: 1, name: '티타늄 위시본 경량화', cost: 4200000, gain: 2, desc: '차량 최소중량 감량 및 섀시 +2' },
                { level: 2, name: '푸시로드/풀로드 지오메트리 재설계', cost: 6900000, gain: 3, desc: '타이어 마모율 -6% 감소 및 섀시 +3' },
                { level: 3, name: '카본 모노코크 강성 밸런싱', cost: 10500000, gain: 3, desc: '연석(Kerb) 돌파 안정성 및 섀시 +3' },
                { level: 4, name: '브레이크 덕트 열관리 시스템', cost: 14800000, gain: 4, desc: '타이어 과열 방지 및 섀시 +4' },
                { level: 5, name: '제로-웨이트 울트라 카본 섀시', cost: 20500000, gain: 5, desc: '타이어 수명 극대화 및 섀시 (+5)' }
            ]
        },
        durability: {
            name: '내구성 & 피트스톱 (신뢰부)',
            icon: '🔧',
            color: '#a855f7',
            desc: '기계적 고장률을 낮추고 휠건 피트크루의 2초대 칼같은 피트스톱을 완성합니다.',
            upgrades: [
                { level: 1, name: '하이드롤릭 기어박스 실링', cost: 3800000, gain: 2, desc: '기어박스 트러블 방지 및 내구성 +2' },
                { level: 2, name: '자동화 레이저 휠건 도입', cost: 6400000, gain: 3, desc: '평균 피트스톱 시간 -0.25초 단축' },
                { level: 3, name: '세라믹 카본 브레이크 로터', cost: 9800000, gain: 3, desc: '브레이크 페이드 방지 및 내구성 +3' },
                { level: 4, name: '피트크루 바이오메카닉 훈련', cost: 13800000, gain: 4, desc: '피트스톱 실수율 80% 감소 및 1.9초대 진입' },
                { level: 5, name: '완전 무결점 팩토리 QC 공정', cost: 19000000, gain: 5, desc: '최고 수준의 신뢰도 및 피트스톱 (+5)' }
            ]
        }
    },

    // FIA Points System (Top 10 + Fastest Lap)
    pointsTable: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
};
