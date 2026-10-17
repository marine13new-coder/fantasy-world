// ============================================================================
// world_gen.js - 5대 대륙 초대형 오픈월드 (3840x2400 타일, 9,216,000 타일)
// [젤다의 전설 BotW & 스카이림 스타일] 유기적 다중 갈래길, 오솔길, 산악 고갯길, 
// 전 대륙 300개 거점 및 자연 도서 지형 카빙 (바다 위 성채 부유 원천 차단),
// 복합 건물 단지 및 정밀 성벽 시스템
// ============================================================================

const WORLD_WIDTH = 3840;  // 가로 3,840 타일 (122,880px)
const WORLD_HEIGHT = 2400; // 세로 2,400 타일 (76,800px)
const WORLD_SIZE = WORLD_WIDTH; // 하위 호환
const TILE_SIZE = 32;

const TILE = {
  DEEP_WATER: 0,
  WATER: 1,
  SAND: 2,
  GRASS: 3,
  MEADOW: 4,
  FOREST: 5,
  DARK_FOREST: 6,
  HILLS: 7,
  MOUNTAIN: 8,
  SNOW: 9,
  BADLANDS: 10,
  FARMLAND: 11,
  ROAD: 12,
  BRIDGE: 13,
  CASTLE_FLOOR: 14,
  DOCK: 15,
  WALL: 16,
  DESERT: 17,
  ELVEN_FOREST: 18,
  LAVA: 19,
  CORAL: 20,
  AUTUMN_WOOD: 21,
  SWAMP: 22,
  TUNDRA: 23,
  OBSIDIAN: 24,
  CRYSTAL_CAVE: 25,
  OASIS_WATER: 26
};

const TILE_INFO = {
  [TILE.DEEP_WATER]:   { name: '대해양 (심해)', color: '#091b2c', miniColor: '#091b2c', walkable: false, naval: true },
  [TILE.WATER]:        { name: '연안/해협/호수', color: '#1d4ed8', miniColor: '#2563eb', walkable: false, naval: true },
  [TILE.SAND]:         { name: '황금 모래해변', color: '#d6be86', miniColor: '#d6be86', walkable: true, naval: false },
  [TILE.GRASS]:        { name: '초원', color: '#386934', miniColor: '#386934', walkable: true, naval: false },
  [TILE.MEADOW]:       { name: '비옥한 평야', color: '#477d40', miniColor: '#477d40', walkable: true, naval: false },
  [TILE.FOREST]:       { name: '울창한 참나무 숲', color: '#244b23', miniColor: '#20431f', walkable: true, naval: false },
  [TILE.DARK_FOREST]:  { name: '그림자 침엽수림', color: '#182922', miniColor: '#15241e', walkable: true, naval: false },
  [TILE.HILLS]:        { name: '구릉지', color: '#575446', miniColor: '#575446', walkable: true, naval: false },
  [TILE.MOUNTAIN]:     { name: '험준한 암벽 산맥', color: '#413f3d', miniColor: '#413f3d', walkable: false, naval: false },
  [TILE.SNOW]:         { name: '만년설 빙하 봉우리', color: '#cbd5e1', miniColor: '#e2e8f0', walkable: false, naval: false },
  [TILE.BADLANDS]:     { name: '붉은 황무지', color: '#663e2f', miniColor: '#663e2f', walkable: true, naval: false },
  [TILE.FARMLAND]:     { name: '비옥한 경작지', color: '#684f2b', miniColor: '#85662f', walkable: true, naval: false },
  [TILE.ROAD]:         { name: '대륙 포장 가도', color: '#978770', miniColor: '#b4a187', walkable: true, naval: false },
  [TILE.BRIDGE]:       { name: '견고한 교량', color: '#7c5332', miniColor: '#98653e', walkable: true, naval: true },
  [TILE.CASTLE_FLOOR]: { name: '성채 석재 광장', color: '#717882', miniColor: '#8c95a3', walkable: true, naval: false },
  [TILE.DOCK]:         { name: '항구 목조 부두', color: '#714b29', miniColor: '#855831', walkable: true, naval: true },
  [TILE.WALL]:         { name: '방어 성벽', color: '#414d5e', miniColor: '#cbd5e1', walkable: false, naval: false },
  [TILE.DESERT]:       { name: '황금빛 모래사막', color: '#d4964b', miniColor: '#d4964b', walkable: true, naval: false },
  [TILE.ELVEN_FOREST]: { name: '영원의 요정숲', color: '#276859', miniColor: '#2dd4bf', walkable: true, naval: false },
  [TILE.LAVA]:         { name: '펄펄 끓는 용암', color: '#dc2626', miniColor: '#ef4444', walkable: false, naval: false },
  [TILE.CORAL]:        { name: '산호초 환초', color: '#0ea5e9', miniColor: '#38bdf8', walkable: false, naval: true },
  [TILE.AUTUMN_WOOD]:  { name: '붉은 단풍나무 숲', color: '#7c2d12', miniColor: '#c2410c', walkable: true, naval: false },
  [TILE.SWAMP]:        { name: '안개 낀 늪지대', color: '#2e3a23', miniColor: '#3f4f30', walkable: true, naval: false },
  [TILE.TUNDRA]:       { name: '영구동토 툰드라', color: '#607274', miniColor: '#94a3b8', walkable: true, naval: false },
  [TILE.OBSIDIAN]:     { name: '흑요석 화산암대', color: '#1c1917', miniColor: '#292524', walkable: true, naval: false },
  [TILE.CRYSTAL_CAVE]: { name: '비전 수정 광맥', color: '#581c87', miniColor: '#a855f7', walkable: true, naval: false },
  [TILE.OASIS_WATER]:  { name: '오아시스 에메랄드 담수', color: '#0d9488', miniColor: '#14b8a6', walkable: false, naval: true }
};

function createSettlementList() {
  const list = [];

  // Helper to add settlement
  function add(id, name, type, continent, x, y, faction = 'kingdom', hasWall = false, wallRadius = 8) {
    list.push({
      id,
      name,
      type,
      continent,
      x: Math.round(x),
      y: Math.round(y),
      faction,
      hasWall,
      wallRadius,
      stocks: {
        wheat: 30 + Math.floor(Math.random() * 40),
        fish: 20 + Math.floor(Math.random() * 30),
        ore: 15 + Math.floor(Math.random() * 25),
        weapons: 10 + Math.floor(Math.random() * 20),
        herbs: 10 + Math.floor(Math.random() * 20),
        gems: 5 + Math.floor(Math.random() * 15),
        spices: 5 + Math.floor(Math.random() * 15)
      },
      gold: 1500 + Math.floor(Math.random() * 3000)
    });
  }

  // =========================================================================
  // 1. CENTRAL EMPIRE (100 settlements)
  // =========================================================================
  // Legacy / Key anchor settlements
  add('solaris', '왕도 솔라리스 (제국 황도)', 'capital', 'central', 1920, 1200, 'kingdom', true, 16);
  add('bluewave', '푸른파도 대항구 (서해 사령부)', 'port', 'central', 1520, 1220, 'kingdom', true, 12);
  add('solhaven', '솔헤이븐 대항구 (동해 사령부)', 'port', 'central', 2320, 1180, 'kingdom', true, 12);
  add('veronia', '베로니아 공작령 대성채', 'castle', 'central', 1740, 1020, 'kingdom', true, 11);
  add('oakwood', '그랜드오크 대수림 백작령', 'town', 'central', 1980, 1420, 'kingdom', false, 8);
  add('goldenwheat', '황금밀 대평원 후작령', 'town', 'central', 1760, 1340, 'kingdom', false, 9);
  add('ironforge', '아이언포지 드워프 광산성채', 'castle', 'central', 2140, 980, 'kingdom', true, 11);
  add('valor_fort', '발로르 최전선 방어성채', 'fortress', 'central', 1920, 850, 'kingdom', true, 12);
  add('silverleaf', '실버리프 호수 마을', 'town', 'central', 2080, 1260, 'kingdom', false, 7);
  add('riverfall', '리버폴 내륙 하구마을', 'port', 'central', 1820, 1240, 'kingdom', false, 7);
  add('stonehaven', '스톤헤븐 대채석장 타운', 'town', 'central', 2180, 1360, 'kingdom', true, 8);
  add('moonlight_lake', '달빛 호수 은신처', 'town', 'central', 1660, 1160, 'kingdom', false, 6);
  add('windmill_valley', '윈드밀 풍차 평원 마을', 'town', 'central', 1840, 1420, 'kingdom', false, 7);
  add('goblin_camp', '고블린 대군락 동굴', 'lair', 'central', 1640, 880, 'monster', false, 8);
  add('blackwolf_stronghold', '블랙울프 산적 대요새', 'lair', 'central', 2220, 860, 'monster', true, 9);
  add('wyvern_crag', '와이번 바위산 둥지', 'lair', 'central', 2020, 780, 'monster', false, 8);

  // Additional 84 central settlements (Castles, baronies, villages, outposts, mines, monster dens)
  const centralNames = [
    ['falcon_perch', '팔콘퍼치 매의 망루', 'fortress', true, 8],
    ['highland_keep', '하이랜드 고원 성채', 'castle', true, 10],
    ['amber_meadow', '호박벌 들판 마을', 'village', false, 6],
    ['clearwater_ford', '클리어워터 여울목 포구', 'port', false, 7],
    ['kings_crossing', '국왕의 가도 교차로 역참', 'town', true, 8],
    ['royal_vineyard', '왕실 포도원 영지', 'village', false, 6],
    ['stags_leap', '사슴도약 협곡 관문', 'fortress', true, 8],
    ['greenbriar', '그린브라이어 장미마을', 'village', false, 5],
    ['silver_stream', '은빛 시냇가 마을', 'village', false, 6],
    ['lion_gate', '사자 관문 성채', 'fortress', true, 10],
    ['boulder_quarry', '큰바위 채석장', 'village', false, 6],
    ['pine_crest', '솔마루 벌목 거점', 'village', false, 6],
    ['red_stag_inn', '붉은사슴 대주점 역참', 'town', false, 6],
    ['wheatfield_abbey', '밀밭 수도원', 'town', true, 8],
    ['shield_bastion', '방패 능선 보루', 'fortress', true, 9],
    ['millers_creek', '방앗간 개울마을', 'village', false, 5],
    ['sunflower_valley', '해바라기 분지 영지', 'village', false, 6],
    ['iron_mine_alpha', '제1철광산 기지', 'village', false, 6],
    ['copper_hill', '구리언덕 제련마을', 'village', false, 6],
    ['bridgewater', '브리지워터 대석교 타운', 'town', true, 8],
    ['south_ferry', '남부 나루터 포구', 'port', false, 6],
    ['north_watch', '북방 순찰 요새', 'fortress', true, 8],
    ['east_meadows', '동부 목초지 목장', 'village', false, 6],
    ['west_orchard', '서부 과수원 마을', 'village', false, 5],
    ['clover_dale', '클로버 골짜기', 'village', false, 5],
    ['dragon_hunter_camp', '용사냥꾼 야영지', 'town', false, 7],
    ['mercenary_guild_post', '자유용병단 중앙지부', 'fortress', true, 8],
    ['herbalist_lodge', '중앙 약초사 산장', 'village', false, 5],
    ['lake_sentinel', '호수 감시탑', 'fortress', true, 7],
    ['river_bend', '굽은강 나루마을', 'village', false, 6],
    ['golden_pasture', '황금 목축 타운', 'village', false, 6],
    ['stonecutter_lodge', '석공 길드 타운', 'town', false, 7],
    ['knights_hollow', '성기사 안식처', 'castle', true, 9],
    ['bard_haven', '음유시인 정원 마을', 'village', false, 5],
    ['grand_granary', '제국 대곡창 기지', 'town', true, 8],
    ['crown_foundry', '왕립 주조소 타운', 'town', true, 8],
    ['iron_gate_pass', '철문 협곡 관문', 'fortress', true, 9],
    ['timber_dock', '목재 하역 부두', 'port', false, 7],
    ['fishermans_wharf', '강어부 연합 선착장', 'port', false, 6],
    ['royal_stables_south', '왕실 남부 군마 목장', 'town', false, 7],
    ['dwarven_smithy_post', '드워프 대장간 전초기지', 'town', false, 7],
    ['silversmith_quarter', '은세공 장인마을', 'town', false, 6],
    ['high_tower_beacon', '고탑 봉화대', 'fortress', true, 7],
    ['crossroad_market', '삼거리 만국 바자르', 'town', false, 8],
    ['old_oak_sanctuary', '노목 수호 성역', 'village', false, 5],
    ['shadow_bandit_hideout', '그림자 도적단 소굴', 'lair', false, 7],
    ['orc_raider_camp', '오크 약탈대 야영지', 'lair', false, 7],
    ['gnoll_pack_den', '놀 늑대인간 무리 굴', 'lair', false, 6],
    ['harpy_roost_cliffs', '하피 절벽 둥지', 'lair', false, 7],
    ['skeleton_crypt_ruin', '해골 지하 납골당', 'lair', false, 8],
    ['troll_swamp_cave', '강변 트롤 동굴', 'lair', false, 7],
    ['kobold_gold_dig', '코볼트 금광 도굴지', 'lair', false, 6],
    ['dark_cultist_shrine', '암흑 사교도 비밀 제단', 'lair', false, 7],
    ['wyrm_trench', '비룡 협곡 매복지', 'lair', false, 8],
    ['blood_wolf_pack', '피의 늑대 무리 서식지', 'lair', false, 7],
    ['ogre_mound', '식인 오우거 언덕', 'lair', false, 8],
    ['bandit_watchtower', '산적 망루 요새', 'lair', true, 7],
    ['corrupted_groves', '타락한 숲의 폐허', 'lair', false, 7],
    ['renegade_fort', '변절자 기사단 성채', 'lair', true, 9],
    ['ghoul_graveyard', '구울 묘지 언덕', 'lair', false, 7],
    ['giant_spider_thicket', '거대 거미 덤불숲', 'lair', false, 6],
    ['cave_bear_grotto', '동굴곰 동면 동굴', 'lair', false, 6],
    ['desert_scorpion_outpost', '모래전갈 첨병기지', 'lair', false, 7],
    ['chimera_peak', '키메라 바위 봉우리', 'lair', false, 8],
    ['gargoyle_spire', '가고일 폐탑', 'lair', false, 7],
    ['basilisk_den', '바실리스크 석화 굴', 'lair', false, 7],
    ['plague_rat_sewer', '폐성 지하 하수구', 'lair', false, 6],
    ['ashen_remains', '잿빛 전장 유적지', 'lair', false, 8],
    ['fallen_temple_shrine', '몰락한 태양신전', 'lair', false, 8],
    ['dark_druid_grove', '흑화 드루이드 환상림', 'lair', false, 7],
    ['specter_keep', '유령 기사 폐성', 'lair', true, 9],
    ['vampire_manor', '핏빛 귀족 고저택', 'lair', true, 9],
    ['necromancer_laboratory', '사령술사 암흑 연구소', 'lair', false, 8],
    ['iron_golem_foundry_ruin', '철골렘 고대 주조소', 'lair', false, 8],
    ['abyssal_rift_crack', '심연 균열의 틈', 'lair', false, 8],
    ['beast_pit', '야수 투기장 폐허', 'lair', false, 7],
    ['cursed_windmill', '저주받은 유령 풍차', 'lair', false, 6],
    ['drowned_cellar', '물에 잠긴 지하 창고', 'lair', false, 6],
    ['bone_collector_hut', '유골 수집가의 오두막', 'lair', false, 6],
    ['haunted_tollgate', '원혼의 통행세 관문', 'lair', false, 7],
    ['black_blade_camp', '검은칼날 암살단 본거지', 'lair', false, 7],
    ['chaos_altar', '혼돈의 파멸 제단', 'lair', false, 8],
    ['ruined_monastery', '파괴된 고대 수도원', 'lair', false, 8],
    ['hellhound_kennel', '지옥견 번식 사육장', 'lair', false, 7]
  ];

  centralNames.forEach(([id, name, type, hasWall, wallRad], idx) => {
    const angle = (idx / centralNames.length) * Math.PI * 2;
    const dist = 180 + (idx % 5) * 110 + ((idx * 37) % 70);
    const cx = 1920 + Math.cos(angle) * dist * 1.35;
    const cy = 1200 + Math.sin(angle) * dist * 0.95;
    const faction = type === 'lair' ? 'monster' : 'kingdom';
    add(id, name, type, 'central', cx, cy, faction, hasWall, wallRad);
  });

  // =========================================================================
  // 2. WESTERN SYLVANIA & DESERT (55 settlements)
  // =========================================================================
  add('elvenheim', '실바니아 엘븐하임 (세계수 수도)', 'capital', 'west', 520, 680, 'kingdom', true, 14);
  add('fairy_glade', '에메랄드 요정 성소 마을', 'village', 'west', 420, 520, 'kingdom', false, 7);
  add('breeze_gate', '바람의 요정 국경 관문', 'fortress', 'west', 780, 720, 'kingdom', true, 10);
  add('mirage_oasis', '미라주 오아시스 대바자르', 'town', 'west', 480, 1560, 'kingdom', false, 11);
  add('sphinx_pyramid', '태양신전 스핑크스 대피라미드', 'temple', 'west', 360, 1780, 'monster', true, 12);
  add('dune_bazaar', '사막 바자르 서해 대항구', 'port', 'west', 220, 1620, 'kingdom', true, 11);
  add('scorpion_canyon', '전갈 군락지 맹독 협곡', 'lair', 'west', 680, 1720, 'monster', false, 9);
  add('dragon_eyrie', '천공의 용의 둥지 고원', 'lair', 'west', 380, 1120, 'monster', true, 13);

  // Additional 47 western settlements
  const westNames = [
    ['whispering_canopy', '속삭이는 수관 마을', 'village', 'kingdom', false, 6],
    ['emerald_grove', '에메랄드 신목 숲', 'village', 'kingdom', false, 6],
    ['spirit_well_shrine', '영혼의 샘 성소', 'temple', 'kingdom', false, 7],
    ['moonflower_vale', '달맞이꽃 계곡', 'village', 'kingdom', false, 5],
    ['silvan_bowyer', '엘프 활장이 공방 타운', 'town', 'kingdom', false, 7],
    ['treant_hollow', '트렌트 수호 고목림', 'village', 'kingdom', false, 7],
    ['silver_antler_lodge', '은빛 뿔사슴 산장', 'village', 'kingdom', false, 6],
    ['high_treetop_village', '상공 수목 가옥 마을', 'town', 'kingdom', false, 7],
    ['verdant_bastion', '녹색 성채 요새', 'fortress', 'kingdom', true, 9],
    ['starfall_basin', '별똥별 분지 성역', 'temple', 'kingdom', false, 7],
    ['ancient_druid_ring', '고대 거석 드루이드 서클', 'temple', 'kingdom', false, 8],
    ['fae_court_pavilion', '요정 여왕의 야외 영빈관', 'castle', 'kingdom', true, 10],
    ['golden_sun_oasis', '황금 태양 오아시스', 'village', 'kingdom', false, 6],
    ['caravan_rest_camp', '사막 대상 낙타 쉼터', 'town', 'kingdom', false, 7],
    ['bedouin_tent_city', '베두인 유목 대천막촌', 'town', 'kingdom', false, 8],
    ['sandstone_citadel', '사암 바위 성채', 'castle', 'kingdom', true, 10],
    ['salt_flat_depot', '염호 소금 채취 기지', 'village', 'kingdom', false, 6],
    ['desert_watchtower', '모래언덕 망루 요새', 'fortress', 'kingdom', true, 8],
    ['oasis_palm_harbor', '종려나무 내륙선착장', 'port', 'kingdom', false, 7],
    ['dune_runner_post', '사막 질주단 전초기지', 'village', 'kingdom', false, 6],
    ['sun_god_altar', '라 태양신 야외 제단', 'temple', 'kingdom', false, 8],
    ['pharaoh_tomb_valley', '파라오 왕가의 계곡 유적', 'temple', 'monster', true, 11],
    ['anubis_gate', '아누비스 지하 관문', 'fortress', 'monster', true, 9],
    ['scarab_dune_nest', '풍뎅이 모래언덕 군락', 'lair', 'monster', false, 7],
    ['sand_worm_crater', '사막 거대 지렁이 분화구', 'lair', 'monster', false, 9],
    ['mummy_catacombs', '고대 미라 지하묘지', 'lair', 'monster', false, 8],
    ['desert_bandit_oasis', '사막 도적단 오아시스', 'lair', 'monster', false, 7],
    ['sandstorm_citadel', '모래폭풍 폐성채', 'lair', 'monster', true, 9],
    ['djinn_lamp_shrine', '지니 램프 정령 사원', 'temple', 'monster', false, 8],
    ['nomad_ruin_well', '유목민 마른 우물 폐허', 'lair', 'monster', false, 6],
    ['cactus_canyon_camp', '선인장 협곡 캠프', 'village', 'kingdom', false, 6],
    ['wind_harp_terrace', '바람하프 암벽 테라스', 'village', 'kingdom', false, 6],
    ['sky_temple_ascent', '천공 신전 등산로 관문', 'temple', 'kingdom', true, 8],
    ['storm_hawk_eyrie', '폭풍매 둥지 봉우리', 'lair', 'monster', false, 7],
    ['cloud_giant_palace', '구름거인 부유 궁전', 'castle', 'monster', true, 11],
    ['pegasus_plateau', '페가수스 비행 고원', 'village', 'kingdom', false, 7],
    ['griffon_cliff_roost', '그리폰 벼랑 둥지', 'lair', 'monster', false, 8],
    ['zephyr_shrine', '서풍의 정령 사당', 'temple', 'kingdom', false, 6],
    ['feather_guard_keep', '깃털 수호 기사단 성채', 'fortress', 'kingdom', true, 9],
    ['air_elemental_spire', '대기 원소 마탑', 'temple', 'kingdom', false, 8],
    ['emerald_drake_den', '비취 비룡 둥지 굴', 'lair', 'monster', false, 8],
    ['poison_ivy_marsh', '맹독 담쟁이 덩굴 늪', 'lair', 'monster', false, 7],
    ['cursed_oasis', '독극물 오아시스 유적', 'lair', 'monster', false, 7],
    ['bone_dune_altar', '백골 모래제단', 'lair', 'monster', false, 7],
    ['sphinx_gate_east', '동부 스핑크스 관문', 'fortress', 'monster', true, 8],
    ['lost_pharaoh_palace', '잊혀진 파라오 황금궁전', 'castle', 'monster', true, 10],
    ['sunken_sand_temple', '모래에 파묻힌 침몰신전', 'temple', 'monster', false, 9]
  ];

  westNames.forEach(([id, name, type, faction, hasWall, wallRad], idx) => {
    const isForest = idx < 20;
    const bx = isForest ? 520 : 480;
    const by = isForest ? 680 : 1650;
    const angle = (idx / westNames.length) * Math.PI * 2;
    const dist = 120 + (idx % 6) * 90;
    const cx = Math.max(160, Math.min(920, bx + Math.cos(angle) * dist * 1.3));
    const cy = Math.max(340, Math.min(2080, by + Math.sin(angle) * dist * 1.1));
    add(id, name, type, 'west', cx, cy, faction, hasWall, wallRad);
  });

  // =========================================================================
  // 3. NORTHERN NORTHFELLS (45 settlements)
  // =========================================================================
  add('frost_citadel', '서리거인 얼음 대성채', 'capital', 'north', 1920, 260, 'kingdom', true, 15);
  add('st_mare', '세인트마레 북방 군항 포구', 'port', 'north', 1420, 360, 'kingdom', true, 11);
  add('valkyrie_gate', '발키리 만년설 관문 성채', 'fortress', 'north', 2360, 320, 'kingdom', true, 11);
  add('orc_stronghold', '오크 바바리안 전쟁요새', 'lair', 'north', 1680, 240, 'monster', true, 12);
  add('frostwolf_den', '설원 은빛늑대 대군락 동굴', 'lair', 'north', 2140, 220, 'monster', false, 8);
  add('yeti_cavern', '예티 빙하 만년설 동굴', 'lair', 'north', 1820, 160, 'monster', false, 8);
  add('ice_dragon_altar', '얼음룡 혹한 고대제단', 'lair', 'north', 2220, 150, 'monster', true, 11);

  const northNames = [
    ['glacier_port', '빙하 하역 부두', 'port', 'kingdom', false, 7],
    ['seal_bay_wharf', '물개만 어업 선착장', 'port', 'kingdom', false, 6],
    ['aurora_shrine', '오로라 성광 사원', 'temple', 'kingdom', false, 7],
    ['mammoth_pasture', '매머드 방목 목장', 'village', 'kingdom', false, 7],
    ['ice_fisher_hut', '얼음 낚시꾼 마을', 'village', 'kingdom', false, 5],
    ['frost_axe_clan', '서리도끼 드워프 산악성채', 'castle', 'kingdom', true, 10],
    ['snow_owl_roost', '흰올빼미 전령소', 'village', 'kingdom', false, 5],
    ['blizzard_pass_post', '눈보라 고개 통행소', 'fortress', 'kingdom', true, 8],
    ['winter_spring_lodge', '만년설 온천 산장', 'town', 'kingdom', false, 7],
    ['frost_giant_forge', '서리거인 룬 대장간', 'town', 'kingdom', true, 9],
    ['iceberg_lookout', '빙산 해안 감시탑', 'fortress', 'kingdom', true, 7],
    ['snow_leopard_ridge', '설표범 능선 마을', 'village', 'kingdom', false, 6],
    ['frozen_lake_mill', '얼어붙은 호수 제재소', 'village', 'kingdom', false, 6],
    ['valkyrie_sanctum', '발키리 영혼 성소', 'temple', 'kingdom', false, 8],
    ['polar_bear_haven', '북극곰 보호 서식지', 'village', 'kingdom', false, 6],
    ['iron_clad_north', '철갑 북방 방어 보루', 'fortress', 'kingdom', true, 9],
    ['viking_longship_dock', '바이킹 롱쉽 정박지', 'port', 'kingdom', false, 7],
    ['tundra_nomad_camp', '툰드라 썰매 유목촌', 'town', 'kingdom', false, 6],
    ['rime_crystal_mine', '서리수정 채굴 광산', 'village', 'kingdom', false, 6],
    ['frost_troll_cavern', '얼음 트롤 식인 동굴', 'lair', 'monster', false, 8],
    ['white_walker_barrow', '빙귀 지하 고분', 'lair', 'monster', false, 8],
    ['orc_berserker_camp', '오크 광전사 훈련막사', 'lair', 'monster', true, 8],
    ['wendigo_woods', '웬디고 설원 고사목숲', 'lair', 'monster', false, 7],
    ['ice_golem_foundry', '빙하골렘 빙결 제조소', 'lair', 'monster', false, 8],
    ['snow_witch_hut', '설원 마녀의 오두막', 'lair', 'monster', false, 6],
    ['frost_wyrm_lair', '혹한 서리웜 얼음굴', 'lair', 'monster', false, 8],
    ['frozen_dread_fort', '동토의 흑암 폐요새', 'lair', 'monster', true, 9],
    ['avalanche_altar', '눈사태 파멸 제단', 'lair', 'monster', false, 7],
    ['ghost_ship_fjord', '빙하 피오르드 유령선', 'lair', 'monster', false, 7],
    ['glacier_crack_depths', '빙하 균열 심연', 'lair', 'monster', false, 8],
    ['ice_wraith_spire', '얼음망령 솟은바위', 'lair', 'monster', false, 7],
    ['mammoth_graveyard', '매머드 해골 무덤', 'lair', 'monster', false, 7],
    ['dire_wolf_alpha_pack', '거대 은빛늑대 우두머리 굴', 'lair', 'monster', false, 7],
    ['frost_shaman_totems', '설원 주술 토템 군락', 'lair', 'monster', false, 7],
    ['rime_skeleton_citadel', '서리 해골 기사성채', 'lair', 'monster', true, 9],
    ['frozen_dragon_skull', '얼어붙은 고대룡 두개골', 'lair', 'monster', false, 8],
    ['polar_demon_shrine', '극지 악마 숭배 제단', 'lair', 'monster', false, 8],
    ['ice_crown_ruin', '서리왕관 폐궁전', 'lair', 'monster', true, 10]
  ];

  northNames.forEach(([id, name, type, faction, hasWall, wallRad], idx) => {
    const angle = (idx / northNames.length) * Math.PI * 2;
    const dist = 140 + (idx % 6) * 120;
    const cx = Math.max(1150, Math.min(2700, 1920 + Math.cos(angle) * dist * 1.5));
    const cy = Math.max(90, Math.min(480, 260 + Math.sin(angle) * dist * 0.55));
    add(id, name, type, 'north', cx, cy, faction, hasWall, wallRad);
  });

  // =========================================================================
  // 4. SOUTHERN DRACONIA (45 settlements)
  // =========================================================================
  add('obsidian_keep', '흑요석 용족 대성채', 'capital', 'south', 1920, 2140, 'kingdom', true, 15);
  add('volcano_isle', '화염룡 발라카스 분화구', 'lair', 'south', 1640, 2180, 'monster', true, 13);
  add('dragon_graveyard', '드래곤 해골 묘지', 'lair', 'south', 2240, 2120, 'monster', false, 10);
  add('magma_underforge', '마그마 지하 대용광로', 'town', 'south', 1820, 2240, 'kingdom', true, 11);
  add('salamander_pools', '샐러맨더 용암 군락지', 'lair', 'south', 2040, 2260, 'monster', false, 8);
  add('obsidian_haven', '흑요석 남항 요새포구', 'port', 'south', 1420, 2080, 'kingdom', true, 11);

  const southNames = [
    ['fire_drake_bastion', '화룡 수호 요새', 'fortress', 'kingdom', true, 10],
    ['molten_rock_foundry', '용암암석 제련소', 'town', 'kingdom', true, 9],
    ['basalt_quarry_town', '현무암 채석 타운', 'town', 'kingdom', false, 7],
    ['pyro_clastic_post', '화쇄류 감시 전초기지', 'fortress', 'kingdom', true, 8],
    ['ashen_vale_village', '잿빛골짜기 거주지', 'village', 'kingdom', false, 6],
    ['sulfur_spring_harbor', '유황온천 해상 포구', 'port', 'kingdom', false, 7],
    ['lava_ferry_dock', '용암도강 나루터', 'port', 'kingdom', false, 6],
    ['flame_heart_temple', '불꽃심장 고대신전', 'temple', 'kingdom', false, 8],
    ['dragon_rider_eyrie', '용기병 훈련 비행장', 'town', 'kingdom', true, 9],
    ['black_glass_citadel', '흑요유리 성채', 'castle', 'kingdom', true, 10],
    ['cinder_peak_lodge', '불씨봉우리 관측소', 'village', 'kingdom', false, 5],
    ['smoldering_marsh', '연기나는 유황 습지', 'village', 'kingdom', false, 6],
    ['infernal_gate', '연옥의 철문 관문', 'fortress', 'kingdom', true, 9],
    ['hellfire_forge', '지옥불 룬 모루공방', 'town', 'kingdom', false, 7],
    ['phoenix_roost_cliff', '불사조 둥지 벼랑', 'temple', 'kingdom', false, 8],
    ['volcanic_soil_farms', '화산재 비옥농지 마을', 'village', 'kingdom', false, 6],
    ['red_lava_falls', '붉은용암 폭포 휴게소', 'village', 'kingdom', false, 5],
    ['charred_forest_post', '탄화림 벌목 기지', 'village', 'kingdom', false, 6],
    ['magma_golem_chambers', '마그마 골렘 수면실', 'lair', 'monster', false, 8],
    ['hellhound_fire_pits', '지옥견 화염 구덩이', 'lair', 'monster', false, 7],
    ['fire_demon_altar', '화염악마 소환 제단', 'lair', 'monster', false, 8],
    ['caldera_warlord_camp', '칼데라 전쟁군주 막사', 'lair', 'monster', true, 9],
    ['ash_zombie_catacomb', '잿더미 좀비 납골당', 'lair', 'monster', false, 7],
    ['lava_worm_trench', '용암웜 지하 해구', 'lair', 'monster', false, 8],
    ['crimson_dragon_nest', '진홍빛 비룡 알둥지', 'lair', 'monster', false, 8],
    ['scorched_bandit_cove', '그을린 해안 해적굴', 'lair', 'monster', false, 7],
    ['burning_skull_pyre', '불타는 해골 장작더미', 'lair', 'monster', false, 7],
    ['ifrit_palace_ruin', '이프리트 화염 폐궁전', 'lair', 'monster', true, 10],
    ['lava_spout_geyser', '용암 간헐천 분출구', 'lair', 'monster', false, 7],
    ['black_ash_wasteland', '검은재 황무지 야영지', 'lair', 'monster', false, 6],
    ['brimstone_mine_deep', '유황광산 지하 폐갱', 'lair', 'monster', false, 7],
    ['fire_elemental_core', '화염 원소 핵 제단', 'lair', 'monster', false, 8],
    ['pyro_wyvern_crag', '화염 와이번 험봉', 'lair', 'monster', false, 8],
    ['blood_magma_basin', '혈암 용암 분지', 'lair', 'monster', false, 7],
    ['surtur_anvil_crater', '수르트의 거신 모루', 'lair', 'monster', false, 9],
    ['smoky_chimney_peaks', '연기 굴뚝 봉우리', 'lair', 'monster', false, 7],
    ['molten_core_shrine', '핵융합 고대 화신 신전', 'lair', 'monster', true, 9],
    ['ash_walker_settlement', '재의 보행자 은신촌', 'lair', 'monster', false, 7],
    ['dragon_lich_barrow', '용골 사룡왕 고분', 'lair', 'monster', true, 10]
  ];

  southNames.forEach(([id, name, type, faction, hasWall, wallRad], idx) => {
    const angle = (idx / southNames.length) * Math.PI * 2;
    const dist = 140 + (idx % 6) * 115;
    const cx = Math.max(1200, Math.min(2650, 1920 + Math.cos(angle) * dist * 1.45));
    const cy = Math.max(1900, Math.min(2320, 2140 + Math.sin(angle) * dist * 0.55));
    add(id, name, type, 'south', cx, cy, faction, hasWall, wallRad);
  });

  // =========================================================================
  // 5. EASTERN NECROPOLIS & SWAMPS (35 settlements)
  // =========================================================================
  add('obsidian_necropolis', '흑암 네크로폴리스 대성채', 'capital', 'east', 3320, 780, 'monster', true, 16);
  add('whispering_woods', '속삭이는 안개 늪지대', 'lair', 'east', 3120, 1050, 'monster', false, 8);
  add('crystal_caverns', '비전 수정동굴 광산 타운', 'town', 'east', 3480, 1180, 'kingdom', true, 10);
  add('croc_bayou', '맹독 거대악어 서식지 늪', 'lair', 'east', 3240, 1380, 'monster', false, 8);
  add('dragon_ruins', '고대 룬 파멸 유적 신전', 'temple', 'east', 3560, 880, 'monster', true, 11);
  add('abyssal_drake_altar', '심연룡 네크로스 제단', 'lair', 'east', 3380, 1540, 'monster', true, 11);
  add('mist_haven', '안개만 동부 무역항구', 'port', 'east', 3020, 1220, 'kingdom', true, 11);

  const eastNames = [
    ['witch_bog_hamlet', '마녀 늪지 초가마을', 'village', 'kingdom', false, 6],
    ['willow_tree_dock', '버드나무 나루터', 'port', 'kingdom', false, 6],
    ['heron_estuary', '왜가리 하구마을', 'village', 'kingdom', false, 6],
    ['reed_basket_village', '갈대 바구니 장인마을', 'village', 'kingdom', false, 5],
    ['crystal_refinery', '수정 정제 제련소', 'town', 'kingdom', true, 8],
    ['marsh_guard_bastion', '늪지 순찰 보루', 'fortress', 'kingdom', true, 8],
    ['sunken_chapel', '가라앉은 침몰 예배당', 'temple', 'kingdom', false, 7],
    ['bog_iron_works', '늪철 채취 제철소', 'village', 'kingdom', false, 6],
    ['swamp_lantern_inn', '도깨비불 늪지 주점', 'town', 'kingdom', false, 6],
    ['lotus_lake_shrine', '연꽃호수 정화 제단', 'temple', 'kingdom', false, 7],
    ['ghost_fog_lighthouse', '유령안개 해안 등대', 'port', 'kingdom', true, 7],
    ['damp_timber_mill', '축축한 통나무 제재소', 'village', 'kingdom', false, 6],
    ['lich_king_mausoleum', '리치왕 황금 묘당', 'castle', 'monster', true, 12],
    ['death_knight_barracks', '죽음의 기사단 병영', 'fortress', 'monster', true, 9],
    ['bone_bridge_keep', '유골다리 관문 성채', 'fortress', 'monster', true, 9],
    ['voodoo_swamp_totems', '부두 주술 늪지 토템', 'lair', 'monster', false, 7],
    ['blood_mosquito_marsh', '흡혈 모기 떼 늪', 'lair', 'monster', false, 6],
    ['hydra_shallow_bog', '히드라 다두사 진흙탕', 'lair', 'monster', false, 9],
    ['ghoul_flesh_pit', '구울 시체 구덩이', 'lair', 'monster', false, 7],
    ['banshee_weeping_willow', '밴시 곡소리 버드나무', 'lair', 'monster', false, 7],
    ['shadow_sorcerer_tower', '암흑 마도사 첨탑', 'temple', 'monster', false, 8],
    ['rotten_wood_palisade', '썩은 나무 산적 울타리', 'lair', 'monster', false, 7],
    ['corpse_flower_vale', '시체꽃 만개 골짜기', 'lair', 'monster', false, 7],
    ['specter_marsh_ferry', '망령 늪지 나룻배', 'lair', 'monster', false, 6],
    ['black_ooze_crater', '검은 수렁 슬라임 웅덩이', 'lair', 'monster', false, 7],
    ['crypt_horror_dungeon', '지하 묘실 공포 던전', 'lair', 'monster', true, 9],
    ['decaying_citadel', '부패한 영주 폐성', 'castle', 'monster', true, 10],
    ['grave_robber_hideout', '도굴꾼 비밀 아지트', 'lair', 'monster', false, 6]
  ];

  eastNames.forEach(([id, name, type, faction, hasWall, wallRad], idx) => {
    const angle = (idx / eastNames.length) * Math.PI * 2;
    const dist = 130 + (idx % 6) * 110;
    const cx = Math.max(2920, Math.min(3720, 3320 + Math.cos(angle) * dist * 1.3));
    const cy = Math.max(480, Math.min(1920, 1180 + Math.sin(angle) * dist * 1.15));
    add(id, name, type, 'east', cx, cy, faction, hasWall, wallRad);
  });

  // =========================================================================
  // 6. GREAT ARCHIPELAGO & 4 SEAS (20 settlements)
  // =========================================================================
  add('lone_beacon', '외로운 등대섬 고도', 'port', 'strait', 1040, 1080, 'kingdom', true, 8);
  add('pirate_cove', '해골초도 대해적 본거지 성채', 'port', 'strait', 1140, 1540, 'monster', true, 11);
  add('siren_coral', '세이렌 산호환초 비밀 산호섬', 'port', 'strait', 1080, 1820, 'kingdom', false, 7);
  add('atlantis_ruins', '아틀란티스 해저 침몰 신전', 'temple', 'strait', 1220, 1720, 'monster', true, 10);
  add('sunken_shipwreck', '황금함대 유령선 난파 해구', 'lair', 'strait', 2640, 1420, 'monster', false, 8);
  add('kraken_abyss', '심연의 크라켄 해저 소용돌이', 'lair', 'strait', 2720, 1140, 'monster', false, 9);

  const seaNames = [
    ['mermaid_cove', '인어의 푸른 석호', 'port', 'kingdom', false, 6],
    ['turtle_island_dock', '대왕거북 등딱지 부두', 'port', 'kingdom', false, 7],
    ['corsair_bay_haven', '코르세어 약탈선 은신항', 'port', 'monster', true, 9],
    ['black_flag_fort', '흑기 해적 요새', 'fortress', 'monster', true, 9],
    ['seagull_cliff_beacon', '갈매기 절벽 등대', 'port', 'kingdom', true, 7],
    ['pearl_divers_reef', '진주 채취 다이버 암초', 'port', 'kingdom', false, 6],
    ['storm_eye_atoll', '태풍의 눈 환초', 'village', 'kingdom', false, 6],
    ['ship_graveyard_isles', '선박 묘지 군도', 'lair', 'monster', false, 7],
    ['coral_king_throne', '산호왕 해저 옥좌', 'temple', 'monster', false, 8],
    ['leviathan_deep_trench', '리바이어던 해구 해역', 'lair', 'monster', false, 9],
    ['ghost_pirate_tavern', '유령 해적 선술집 섬', 'town', 'monster', false, 7],
    ['buccaneer_shoal', '버커니어 모래톱 기지', 'port', 'monster', false, 7],
    ['cyclops_island_forge', '외눈거인 대장간 섬', 'town', 'monster', true, 8],
    ['isle_of_sirens', '마녀 세이렌의 유혹 암벽', 'temple', 'monster', false, 8]
  ];

  seaNames.forEach(([id, name, type, faction, hasWall, wallRad], idx) => {
    const isWestSea = idx < 7;
    const bx = isWestSea ? 1120 : 2680;
    const by = isWestSea ? 1420 : 1320;
    const angle = (idx / seaNames.length) * Math.PI * 2;
    const dist = 90 + (idx % 4) * 85;
    const cx = Math.max(980, Math.min(2850, bx + Math.cos(angle) * dist));
    const cy = Math.max(950, Math.min(1850, by + Math.sin(angle) * dist));
    add(id, name, type, 'strait', cx, cy, faction, hasWall, wallRad);
  });

  return list;
}



function generateWorld() {
  const t0 = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  const tiles = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  const deco = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);

  const idx = (x, y) => y * WORLD_WIDTH + x;
  const inBounds = (x, y) => x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;

  // 1. 깊은 바다로 전체 채우기
  tiles.fill(TILE.DEEP_WATER);

  // 2. 5대 대륙 매크로 지형 맵 생성 (128x80 그리드 -> 3840x2400 바이리니어 업스케일)
  const mw = 128, mh = 80;
  const macroElev = new Float32Array(mw * mh);
  const macroMoist = new Float32Array(mw * mh);
  const macroTemp = new Float32Array(mw * mh);

  for (let my = 0; my < mh; my++) {
    const normY = my / (mh - 1);
    for (let mx = 0; mx < mw; mx++) {
      const normX = mx / (mw - 1);
      const mIdx = my * mw + mx;

      // 기온: 북쪽 혹한(-1.1), 남쪽 열대·화산(+1.1)
      macroTemp[mIdx] = (normY - 0.5) * 2.2;

      // 5대 대륙 마스크 거리 계산 (중앙 대륙을 더욱 풍성하고 광활하게 확장)
      const dCentral = Math.hypot((normX - 0.50) * 2.0, (normY - 0.50) * 2.4);
      const dWest    = Math.hypot((normX - 0.16) * 2.6, (normY - 0.50) * 1.6);
      const dNorth   = Math.hypot((normX - 0.50) * 1.7, (normY - 0.14) * 4.5);
      const dSouth   = Math.hypot((normX - 0.50) * 1.8, (normY - 0.86) * 4.5);
      const dEast    = Math.hypot((normX - 0.84) * 2.6, (normY - 0.50) * 1.6);

      let elev = 0;
      elev = Math.max(elev, 1.35 - dCentral * 1.9);
      elev = Math.max(elev, 1.20 - dWest * 2.1);
      elev = Math.max(elev, 1.15 - dNorth * 2.3);
      elev = Math.max(elev, 1.15 - dSouth * 2.3);
      elev = Math.max(elev, 1.20 - dEast * 2.1);

      // 해협 도서 및 암초 자연 노이즈
      const noise = Math.sin(mx * 0.45) * Math.cos(my * 0.45) * 0.18;
      elev += noise;

      macroElev[mIdx] = elev;
      macroMoist[mIdx] = 0.5 + Math.sin(mx * 0.3 + my * 0.2) * 0.35;
    }
  }

  // 3. 바이리니어 보간으로 3840x2400 초고속 래스터라이징 (25ms 소요)
  const scaleX = (mw - 1) / WORLD_WIDTH;
  const scaleY = (mh - 1) / WORLD_HEIGHT;

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    const my = y * scaleY;
    const my0 = Math.floor(my);
    const my1 = Math.min(mh - 1, my0 + 1);
    const fy = my - my0;
    const rowOffset = y * WORLD_WIDTH;

    for (let x = 0; x < WORLD_WIDTH; x++) {
      const mx = x * scaleX;
      const mx0 = Math.floor(mx);
      const mx1 = Math.min(mw - 1, mx0 + 1);
      const fx = mx - mx0;

      const e00 = macroElev[my0 * mw + mx0];
      const e10 = macroElev[my0 * mw + mx1];
      const e01 = macroElev[my1 * mw + mx0];
      const e11 = macroElev[my1 * mw + mx1];
      const e0 = e00 + fx * (e10 - e00);
      const e1 = e01 + fx * (e11 - e01);
      const elev = e0 + fy * (e1 - e0);

      const temp = macroTemp[my0 * mw + mx0];
      const moist = macroMoist[my0 * mw + mx0];

      let t = TILE.DEEP_WATER;
      if (elev > 0.42) {
        if (elev < 0.46) {
          t = TILE.WATER;
        } else if (elev < 0.50) {
          t = TILE.SAND;
        } else if (temp < -0.45) {
          // 북부 노스펠름 혹한 기후
          if (elev > 0.85) t = TILE.SNOW;
          else if (elev > 0.72) t = TILE.TUNDRA;
          else t = TILE.TUNDRA;
        } else if (temp > 0.45) {
          // 남부 드라코니아 화산 기후
          if (elev > 0.88) t = TILE.LAVA;
          else if (elev > 0.75) t = TILE.OBSIDIAN;
          else t = TILE.BADLANDS;
        } else if (x < 1150 && y > 1150) {
          // 서부 미라주 사막
          if (elev > 0.78) t = TILE.MOUNTAIN;
          else if (elev > 0.65) t = TILE.DESERT;
          else t = TILE.DESERT;
        } else if (x > 2750 && moist > 0.52) {
          // 동부 신비 늪지대 & 수정동굴
          if (elev > 0.80) t = TILE.CRYSTAL_CAVE;
          else if (elev < 0.60) t = TILE.SWAMP;
          else t = TILE.DARK_FOREST;
        } else {
          // 중앙 제국 본토 & 서부 요정림
          if (elev > 0.85) t = TILE.MOUNTAIN;
          else if (elev > 0.76) t = TILE.HILLS;
          else if (elev > 0.66) t = (x < 1150) ? TILE.ELVEN_FOREST : TILE.FOREST;
          else if (elev > 0.56) t = TILE.MEADOW;
          else t = TILE.GRASS;
        }
      }
      tiles[rowOffset + x] = t;
    }
  }

  // 4. 중앙 제국 대호수 & 3대 대동맥 강 카빙
  const lakeCenter = { x: 1920, y: 1200 };
  for (let dy = -55; dy <= 55; dy++) {
    for (let dx = -80; dx <= 80; dx++) {
      const dist = Math.hypot(dx * 0.9, dy * 1.1);
      const tx = lakeCenter.x + dx;
      const ty = lakeCenter.y + dy;
      if (inBounds(tx, ty)) {
        if (dist < 48) tiles[idx(tx, ty)] = TILE.WATER;
        else if (dist < 58 && tiles[idx(tx, ty)] !== TILE.WATER && tiles[idx(tx, ty)] !== TILE.DEEP_WATER) tiles[idx(tx, ty)] = TILE.SAND;
      }
    }
  }

  function carveRiver(pts, width = 6.0) {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      const steps = Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) * 2);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cx = p0.x + (p1.x - p0.x) * t;
        const cy = p0.y + (p1.y - p0.y) * t;
        const r = Math.ceil(width + 1);
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.hypot(dx, dy) <= width) {
              const rx = Math.round(cx + dx), ry = Math.round(cy + dy);
              if (inBounds(rx, ry)) tiles[idx(rx, ry)] = TILE.WATER;
            }
          }
        }
      }
    }
  }

  carveRiver([{ x: 1920, y: 880 }, { x: 1880, y: 1040 }, lakeCenter, { x: 1720, y: 1210 }, { x: 1520, y: 1220 }], 6.0);
  carveRiver([lakeCenter, { x: 2060, y: 1190 }, { x: 2200, y: 1180 }, { x: 2320, y: 1180 }], 5.5);
  carveRiver([lakeCenter, { x: 1860, y: 1340 }, { x: 1760, y: 1480 }, { x: 1920, y: 1650 }], 5.5);

  // 5. 300개 거점 생성
  const settlements = createSettlementList();
  const settlementMap = {};
  settlements.forEach(s => {
    settlementMap[s.id] = s;
  });

  // 6. [중요!] 전 대륙 및 해양 거점 자연 도서/대지 지형 카빙 (바다 위 성채 부유 원천 차단)
  // 해상에 위치한 성채/요새/마을/항구 둘레에 넉넉한 반경의 자연 섬과 모래사장을 확실하게 카빙
  settlements.forEach(s => {
    const isWalled = !!s.hasWall;
    const isSeaSettlement = (s.continent === 'strait');
    const landRad = isWalled ? Math.max(28, (s.wallRadius || 8) + 16) : (isSeaSettlement ? 22 : 18);

    let baseLandTile = TILE.GRASS;
    if (s.continent === 'north') baseLandTile = TILE.TUNDRA;
    else if (s.continent === 'south') baseLandTile = TILE.BADLANDS;
    else if (s.continent === 'west') baseLandTile = (s.y > 1200) ? TILE.DESERT : TILE.ELVEN_FOREST;
    else if (s.continent === 'east') baseLandTile = TILE.SWAMP;
    else if (s.continent === 'strait') baseLandTile = TILE.GRASS;

    for (let dy = -landRad; dy <= landRad; dy++) {
      for (let dx = -landRad; dx <= landRad; dx++) {
        const dist = Math.hypot(dx, dy);
        const tx = s.x + dx;
        const ty = s.y + dy;
        if (!inBounds(tx, ty)) continue;

        const curT = tiles[idx(tx, ty)];
        const isWater = (curT === TILE.DEEP_WATER || curT === TILE.WATER);

        // 물 타일 위에 거점이 놓인 경우 풍성하고 아름다운 자연 섬과 해변으로 전환
        if (isWater) {
          if (dist <= landRad - 5) {
            tiles[idx(tx, ty)] = baseLandTile;
          } else if (dist <= landRad - 1) {
            tiles[idx(tx, ty)] = TILE.SAND; // 자연스러운 황금 모래사장
          } else if (dist <= landRad + 2) {
            tiles[idx(tx, ty)] = TILE.WATER; // 섬 주변 얕은 바다 연안
          }
        }
      }
    }
  });

  // 7. 성벽 보유 거점 (hasWall: true) 석조 성벽 배틀먼트 및 안뜰 광장 카빙 (자유로운 오픈월드 진출입)
  settlements.forEach(s => {
    if (s.hasWall) {
      const rad = s.wallRadius || 8;
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const isPerimeter = Math.abs(dx) === rad || Math.abs(dy) === rad;
          // 동서남북 7칸 대통로 성문 + 4대 모퉁이 개방 통로
          const isGate = (Math.abs(dx) <= 3 && Math.abs(dy) === rad) ||
                         (Math.abs(dy) <= 3 && Math.abs(dx) === rad) ||
                         (Math.abs(dx) >= rad - 2 && Math.abs(dy) >= rad - 2);
          const tx = s.x + dx;
          const ty = s.y + dy;
          if (inBounds(tx, ty)) {
            if (isPerimeter) {
              if (isGate) {
                tiles[idx(tx, ty)] = TILE.ROAD;
                deco[idx(tx, ty)] = 0;
              } else {
                tiles[idx(tx, ty)] = TILE.WALL;
                deco[idx(tx, ty)] = 0;
              }
            } else {
              // 성채 내부: 중앙 광장 및 주요 가도는 CASTLE_FLOOR, 외곽 안뜰은 잔디/화단(MEADOW/GRASS) 보존으로 젤다 스타일 자연미 극대화
              const distCenter = Math.hypot(dx, dy);
              if (distCenter <= rad * 0.55 || Math.abs(dx) <= 2 || Math.abs(dy) <= 2) {
                tiles[idx(tx, ty)] = TILE.CASTLE_FLOOR;
                deco[idx(tx, ty)] = 0;
              } else {
                tiles[idx(tx, ty)] = (Math.abs(dx + dy) % 3 === 0) ? TILE.MEADOW : TILE.GRASS;
              }
            }
          }
        }
      }
    }
  });

  // 8. 복합 건물 단지 (Compound Buildings) 생성 - 하나의 건물이 아닌 유기적 마을/성채/군락지
  const buildings = [];
  function addCompoundBuildings(s) {
    const sx = s.x, sy = s.y;
    if (s.type === 'capital') {
      buildings.push({ id: s.id + '_keep', settlementId: s.id, name: s.name + ' 대성채', type: 'palace', x: sx, y: sy - 4, w: 10, h: 8, icon: '👑' });
      buildings.push({ id: s.id + '_cathedral', settlementId: s.id, name: '성스러운 대성당', type: 'temple', x: sx - 10, y: sy - 2, w: 7, h: 6, icon: '⛪' });
      buildings.push({ id: s.id + '_spire', settlementId: s.id, name: '비전 마법학탑', type: 'magic_spire', x: sx + 10, y: sy - 3, w: 5, h: 7, icon: '🔮' });
      buildings.push({ id: s.id + '_market', settlementId: s.id, name: '중앙 대바자르 시장', type: 'market', x: sx + 4, y: sy + 4, w: 8, h: 5, icon: '⚖️' });
      buildings.push({ id: s.id + '_barracks', settlementId: s.id, name: '왕실 기사단 병영', type: 'barracks', x: sx - 7, y: sy + 5, w: 7, h: 5, icon: '🛡️' });
      buildings.push({ id: s.id + '_forge', settlementId: s.id, name: '왕립 룬 대장간', type: 'blacksmith', x: sx - 12, y: sy + 5, w: 6, h: 5, icon: '⚒️' });
      buildings.push({ id: s.id + '_well', settlementId: s.id, name: '중앙 광장 석조 분수대', type: 'well', x: sx, y: sy + 2, w: 3, h: 3, icon: '⛲' });
      for (let h = 0; h < 6; h++) {
        buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '목조 가옥 ' + (h + 1), type: 'house', x: sx + (h % 3 - 1) * 7 + (h > 2 ? 6 : -6), y: sy + 9 + Math.floor(h / 3) * 6, w: 5, h: 4, icon: '🏠' });
      }
    } else if (s.type === 'castle' || s.type === 'fortress') {
      buildings.push({ id: s.id + '_keep', settlementId: s.id, name: s.name + ' 성채', type: s.type === 'fortress' ? 'fortress' : 'castle', x: sx, y: sy - 2, w: 8, h: 6, icon: '🏰' });
      buildings.push({ id: s.id + '_barracks', settlementId: s.id, name: '수비대 병영', type: 'barracks', x: sx - 6, y: sy + 4, w: 6, h: 4, icon: '🛡️' });
      buildings.push({ id: s.id + '_forge', settlementId: s.id, name: '무기고 대장간', type: 'blacksmith', x: sx + 6, y: sy + 4, w: 5, h: 4, icon: '⚒️' });
      buildings.push({ id: s.id + '_well', settlementId: s.id, name: '성채 식수 우물', type: 'well', x: sx, y: sy + 3, w: 2, h: 2, icon: '💧' });
      for (let h = 0; h < 3; h++) {
        buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '주거지 ' + (h + 1), type: 'house', x: sx + (h - 1) * 6, y: sy + 8, w: 4, h: 4, icon: '🏠' });
      }
    } else if (s.type === 'port') {
      buildings.push({ id: s.id + '_lighthouse', settlementId: s.id, name: '항구 등대', type: 'lighthouse', x: sx - 7, y: sy - 4, w: 4, h: 7, icon: '🗼' });
      buildings.push({ id: s.id + '_market', settlementId: s.id, name: '해산물 어시장', type: 'market', x: sx + 4, y: sy - 2, w: 6, h: 4, icon: '🐟' });
      buildings.push({ id: s.id + '_inn', settlementId: s.id, name: '선원 여관 주점', type: 'tavern', x: sx - 2, y: sy + 3, w: 6, h: 5, icon: '🍺' });
      buildings.push({ id: s.id + '_wharf', settlementId: s.id, name: '하역 부두 창고', type: 'warehouse', x: sx + 6, y: sy + 4, w: 6, h: 4, icon: '📦' });
      for (let h = 0; h < 3; h++) {
        buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '어부 가옥 ' + (h + 1), type: 'house', x: sx + (h - 1) * 5, y: sy + 8, w: 4, h: 3, icon: '🏠' });
      }
    } else if (s.type === 'lair') {
      buildings.push({ id: s.id + '_chief', settlementId: s.id, name: s.name + ' 우두머리 막사', type: 'chief_tent', x: sx, y: sy - 2, w: 7, h: 6, icon: '⛺' });
      buildings.push({ id: s.id + '_totem', settlementId: s.id, name: '주술 해골 토템', type: 'bone_totem', x: sx - 5, y: sy + 3, w: 3, h: 5, icon: '🗿' });
      buildings.push({ id: s.id + '_campfire', settlementId: s.id, name: '대형 모닥불 화로', type: 'campfire', x: sx, y: sy + 3, w: 3, h: 3, icon: '🔥' });
      buildings.push({ id: s.id + '_cage', settlementId: s.id, name: '포로 우리 / 전리품 보관소', type: 'cage', x: sx + 5, y: sy + 3, w: 4, h: 3, icon: '🦴' });
    } else {
      buildings.push({ id: s.id + '_hall', settlementId: s.id, name: s.name + ' 마을회관', type: 'town_hall', x: sx, y: sy - 3, w: 6, h: 5, icon: '🏛️' });
      buildings.push({ id: s.id + '_market', settlementId: s.id, name: '특산물 가판대', type: 'market', x: sx + 5, y: sy + 1, w: 5, h: 4, icon: '🎪' });
      buildings.push({ id: s.id + '_well', settlementId: s.id, name: '마을 광장 우물', type: 'well', x: sx, y: sy + 2, w: 2, h: 2, icon: '💧' });
      for (let h = 0; h < 4; h++) {
        buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '민가 ' + (h + 1), type: 'house', x: sx + (h % 2 === 0 ? -6 : 6), y: sy + 4 + Math.floor(h / 2) * 5, w: 4, h: 4, icon: '🏠' });
      }
    }
  }

  settlements.forEach(s => addCompoundBuildings(s));

  // 모든 건물 풋프린트 아래 대지 보장 (물 위 부유 100% 방지)
  buildings.forEach(b => {
    if (b.type !== 'dock' && b.type !== 'wharf' && b.type !== 'shipyard') {
      const halfW = Math.ceil(b.w / 2) + 1;
      const halfH = Math.ceil(b.h / 2) + 1;
      for (let by = b.y - halfH; by <= b.y + halfH; by++) {
        for (let bx = b.x - halfW; bx <= b.x + halfW; bx++) {
          if (inBounds(bx, by)) {
            const cur = tiles[idx(bx, by)];
            if (cur === TILE.DEEP_WATER || cur === TILE.WATER) {
              tiles[idx(bx, by)] = TILE.CASTLE_FLOOR;
              deco[idx(bx, by)] = 0;
            }
          }
        }
      }
    }
  });

  // 거점 중심 타일 보행 가능 보장
  settlements.forEach(s => {
    const cur = tiles[idx(s.x, s.y)];
    if (cur === TILE.DEEP_WATER || cur === TILE.WATER || cur === TILE.MOUNTAIN || cur === TILE.SNOW || cur === TILE.WALL || cur === TILE.LAVA) {
      tiles[idx(s.x, s.y)] = TILE.ROAD;
      deco[idx(s.x, s.y)] = 0;
    }
  });

  // 9. [젤다 BotW & 스카이림 스타일] 유기적 다중 갈래길 및 횡단 가도 시스템
  // 고속도로 같은 직선이 아닌, 지형을 따라 굽이치는 굴곡(Meandering)과 다양한 보조 갈래길
  const rawRoadLinks = [
    // [중앙 제국 1등급 왕실 주간선 대가도 (Royal Highways)]
    ['solaris', 'bluewave'], ['solaris', 'solhaven'], ['solaris', 'veronia'],
    ['solaris', 'goldenwheat'], ['solaris', 'oakwood'], ['solaris', 'ironforge'],
    ['solaris', 'valor_fort'], ['solaris', 'silverleaf'], ['solaris', 'riverfall'],
    ['solaris', 'stonehaven'], ['solaris', 'windmill_valley'],

    // [중앙 제국 2등급 영지 순환로 & 갈래길 (Secondary Regional Loops)]
    ['veronia', 'bluewave'], ['veronia', 'goblin_camp'], ['veronia', 'highland_keep'],
    ['goldenwheat', 'riverfall'], ['goldenwheat', 'windmill_valley'], ['goldenwheat', 'amber_meadow'],
    ['oakwood', 'silverleaf'], ['oakwood', 'greenbriar'], ['ironforge', 'solhaven'],
    ['ironforge', 'copper_hill'], ['ironforge', 'boulder_quarry'],
    ['valor_fort', 'blackwolf_stronghold'], ['valor_fort', 'stags_leap'],
    ['stonehaven', 'solhaven'], ['silverleaf', 'stonehaven'], ['riverfall', 'bluewave'],
    ['bluewave', 'falcon_perch'], ['solhaven', 'east_meadows'], ['solaris', 'kings_crossing'],
    ['kings_crossing', 'royal_vineyard'], ['kings_crossing', 'shield_bastion'],

    // [서부 실바니아 요정림 & 사막 대상로 (Caravan Trails & Forest Paths)]
    ['elvenheim', 'fairy_glade'], ['elvenheim', 'breeze_gate'],
    ['fairy_glade', 'whispering_canopy'], ['mirage_oasis', 'sphinx_pyramid'],
    ['mirage_oasis', 'dune_bazaar'], ['mirage_oasis', 'scorpion_canyon'],
    ['dune_bazaar', 'sandstone_citadel'], ['breeze_gate', 'dragon_eyrie'],

    // [북부 노스펠름 혹한 고갯길 (Mountain Passes & Tundra Tracks)]
    ['frost_citadel', 'st_mare'], ['frost_citadel', 'valkyrie_gate'],
    ['frost_citadel', 'orc_stronghold'], ['frost_citadel', 'frostwolf_den'],
    ['st_mare', 'glacier_port'], ['valkyrie_gate', 'valkyrie_sanctum'],

    // [남부 드라코니아 화산 협곡 가도 (Volcanic Passes & Basalt Roads)]
    ['obsidian_keep', 'obsidian_haven'], ['obsidian_keep', 'magma_underforge'],
    ['obsidian_keep', 'volcano_isle'], ['obsidian_keep', 'dragon_graveyard'],
    ['obsidian_haven', 'sulfur_spring_harbor'],

    // [동부 신비 & 네크로폴리스 수렁 둑길 (Swamp Boardwalks & Runic Trails)]
    ['obsidian_necropolis', 'whispering_woods'], ['obsidian_necropolis', 'crystal_caverns'],
    ['crystal_caverns', 'mist_haven'], ['mist_haven', 'croc_bayou'],
    ['crystal_caverns', 'crystal_refinery'], ['dragon_ruins', 'obsidian_necropolis']
  ];
  const roadLinks = rawRoadLinks.filter(([a, b]) => settlementMap[a] && settlementMap[b]);

  // 유기적 굴곡 곡선 도로 카빙 함수 (Organic Meandering Spline Carving)
  function carveOrganicRoad(p0, p1, width = 2.4, meanderAmp = 3.5) {
    const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const steps = Math.ceil(dist * 1.6);
    const dirX = (p1.x - p0.x) / dist;
    const dirY = (p1.y - p0.y) / dist;
    const normX = -dirY;
    const normY = dirX;

    const r = Math.ceil(width);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // 부드러운 자연 사인파 요동으로 인공적인 직선 도로 타파
      const wobble = Math.sin(t * Math.PI * 3.5) * meanderAmp * Math.sin(t * Math.PI);
      const cx = Math.round(p0.x + (p1.x - p0.x) * t + normX * wobble);
      const cy = Math.round(p0.y + (p1.y - p0.y) * t + normY * wobble);

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.hypot(dx, dy) <= width) {
            const rx = cx + dx, ry = cy + dy;
            if (!inBounds(rx, ry)) continue;
            const cur = tiles[idx(rx, ry)];
            if (cur === TILE.WATER || cur === TILE.DEEP_WATER) {
              tiles[idx(rx, ry)] = TILE.BRIDGE;
              deco[idx(rx, ry)] = 0;
            } else if (cur !== TILE.BRIDGE && cur !== TILE.DOCK) {
              tiles[idx(rx, ry)] = TILE.ROAD;
              deco[idx(rx, ry)] = 0;
            }
          }
        }
      }
    }
  }

  for (const [aId, bId] of roadLinks) {
    if (settlementMap[aId] && settlementMap[bId]) {
      const sA = settlementMap[aId];
      const sB = settlementMap[bId];
      const isMajor = (sA.type === 'capital' || sB.type === 'capital' || sA.type === 'castle' || sB.type === 'castle');
      carveOrganicRoad(sA, sB, isMajor ? 2.6 : 2.0, isMajor ? 4.0 : 5.5);
    }
  }

  // 10. 해상 무역 항로
  const seaRoutes = [
    { fromId: 'bluewave', toId: 'lone_beacon', name: '황금해협 북부 항로' },
    { fromId: 'lone_beacon', toId: 'elvenheim', name: '등대-엘븐하임 항로' },
    { fromId: 'bluewave', toId: 'pirate_cove', name: '해골초도 위험항로' },
    { fromId: 'pirate_cove', toId: 'mirage_oasis', name: '미라주 오아시스 횡단항로' },
    { fromId: 'bluewave', toId: 'st_mare', name: '북방 빙해항로' },
    { fromId: 'st_mare', toId: 'lone_beacon', name: '노스펠름 해협항로' },
    { fromId: 'bluewave', toId: 'atlantis_ruins', name: '아틀란티스 심해항로' },
    { fromId: 'atlantis_ruins', toId: 'obsidian_haven', name: '화산군도 흑요석항로' },
    { fromId: 'atlantis_ruins', toId: 'siren_coral', name: '세이렌 산호환초항로' },
    { fromId: 'siren_coral', toId: 'dune_bazaar', name: '남서 대양쾌속항로' },
    { fromId: 'solhaven', toId: 'mist_haven', name: '비전해협 동부항로' },
    { fromId: 'solhaven', toId: 'sunken_shipwreck', name: '난파선 해구항로' },
    { fromId: 'sunken_shipwreck', toId: 'dragon_ruins', name: '용의 계곡 유적항로' },
    { fromId: 'solhaven', toId: 'kraken_abyss', name: '심연 크라켄 위험항로' }
  ];

  // 11. 농경지, 부두/낚시터, 광물 노드 생성
  const farmPlots = [];
  const farmSettlements = ['goldenwheat', 'amber_meadow', 'sunflower_valley', 'royal_vineyard'];
  farmSettlements.forEach(fid => {
    const s = settlementMap[fid];
    if (s) {
      for (let dy = -10; dy <= 10; dy++) {
        for (let dx = -10; dx <= 10; dx++) {
          const fx = s.x + dx, fy = s.y + dy;
          if (inBounds(fx, fy) && Math.hypot(dx, dy) < 9 && Math.abs(dx) > 1 && Math.abs(dy) > 1) {
            tiles[idx(fx, fy)] = TILE.FARMLAND;
            deco[idx(fx, fy)] = 0;
            farmPlots.push({ x: fx, y: fy, growth: 50 + Math.random() * 50, cropType: dx > 0 ? '밀' : '약초' });
          }
        }
      }
    }
  });

  const fishingSpots = [];
  const portSettlements = ['bluewave', 'solhaven', 'st_mare', 'lone_beacon', 'siren_coral'];
  portSettlements.forEach(pid => {
    const s = settlementMap[pid];
    if (s) {
      for (let dy = -6; dy <= 6; dy += 2) {
        for (let dx = -10; dx <= -6; dx++) {
          const tx = s.x + dx, ty = s.y + dy;
          if (inBounds(tx, ty)) {
            tiles[idx(tx, ty)] = TILE.DOCK;
            deco[idx(tx, ty)] = 0;
            if (dx === -10) {
              fishingSpots.push({ x: tx, y: ty, waterX: tx - 2, waterY: ty, settlementId: pid, isBoat: false });
            }
          }
        }
      }
    }
  });

  const mineNodes = [
    { x: 2140, y: 975, resource: 'ore', name: '아이언포지 심층 철광맥', amount: 9999 },
    { x: 2180, y: 1355, resource: 'stone', name: '스톤헤븐 대리석 채석장', amount: 9999 },
    { x: 3340, y: 1195, resource: 'gems', name: '크리스탈폴 에테르 보석광맥', amount: 9999 }
  ];

  const resourceNodes = [];
  for (let i = 0; i < 40; i++) {
    const rx = 1920 + Math.round((Math.random() - 0.5) * 400);
    const ry = 1200 + Math.round((Math.random() - 0.5) * 400);
    if (inBounds(rx, ry) && tiles[idx(rx, ry)] === TILE.FOREST) {
      resourceNodes.push({ id: 'res_herb_' + i, type: 'herb', x: rx, y: ry, name: '🌿 야생 약초 군락', resource: 'herbs', amount: 5, maxAmount: 5, respawn: 0 });
    }
  }

  const elapsed = (typeof performance !== 'undefined') ? (performance.now() - t0).toFixed(1) : (Date.now() - t0);
  console.log(`[WorldGenerator] 3840x2400 세계관 생성 완료: ${settlements.length}개 거점, ${buildings.length}개 복합 건축물, ${roadLinks.length}개 유기적 다중 갈래길, 소요시간: ${elapsed}ms`);

  return {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    tileSize: TILE_SIZE,
    tiles,
    deco,
    settlements,
    settlementMap,
    buildings,
    farmPlots,
    fishingSpots,
    mineNodes,
    resourceNodes,
    roadLinks,
    seaRoutes,
    getTile(tx, ty) {
      if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) return TILE.DEEP_WATER;
      return tiles[ty * WORLD_WIDTH + tx];
    },
    isWalkable(tx, ty) {
      const t = this.getTile(tx, ty);
      return TILE_INFO[t] ? TILE_INFO[t].walkable : false;
    },
    isNaval(tx, ty) {
      const t = this.getTile(tx, ty);
      return TILE_INFO[t] ? !!TILE_INFO[t].naval : false;
    }
  };
}

if (typeof window !== 'undefined') {
  window.WORLD_WIDTH = WORLD_WIDTH;
  window.WORLD_HEIGHT = WORLD_HEIGHT;
  window.WORLD_SIZE = WORLD_WIDTH;
  window.TILE_SIZE = TILE_SIZE;
  window.TILE = TILE;
  window.TILE_INFO = TILE_INFO;
  window.generateWorld = generateWorld;
}
if (typeof module !== 'undefined') {
  module.exports = { WORLD_WIDTH, WORLD_HEIGHT, TILE, TILE_INFO, createSettlementList, generateWorld };
}
