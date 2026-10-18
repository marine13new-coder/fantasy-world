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
  [TILE.DEEP_WATER]:   { name: '대해양 (심해)', color: '#165e9e', miniColor: '#165e9e', walkable: false, naval: true },
  [TILE.WATER]:        { name: '연안/해협/호수', color: '#2b8bd6', miniColor: '#389ce8', walkable: false, naval: true },
  [TILE.SAND]:         { name: '황금 모래해변', color: '#f3d38c', miniColor: '#f3d38c', walkable: true, naval: false },
  [TILE.GRASS]:        { name: '비옥한 초원', color: '#4bb352', miniColor: '#4bb352', walkable: true, naval: false },
  [TILE.MEADOW]:       { name: '꽃밭 들판', color: '#58c75f', miniColor: '#58c75f', walkable: true, naval: false },
  [TILE.FOREST]:       { name: '울창한 참나무 숲', color: '#286b30', miniColor: '#286b30', walkable: true, naval: false },
  [TILE.DARK_FOREST]:  { name: '그림자 침엽수림', color: '#1a4724', miniColor: '#1a4724', walkable: true, naval: false },
  [TILE.HILLS]:        { name: '구릉지', color: '#688c53', miniColor: '#688c53', walkable: true, naval: false },
  [TILE.MOUNTAIN]:     { name: '험준한 암벽 산맥', color: '#5a6268', miniColor: '#5a6268', walkable: false, naval: false },
  [TILE.SNOW]:         { name: '만년설 봉우리', color: '#e2e8f0', miniColor: '#f1f5f9', walkable: true, naval: false },
  [TILE.BADLANDS]:     { name: '붉은 황무지', color: '#8c4e33', miniColor: '#8c4e33', walkable: true, naval: false },
  [TILE.FARMLAND]:     { name: '비옥한 경작지', color: '#a85c32', miniColor: '#b46638', walkable: true, naval: false },
  [TILE.ROAD]:         { name: '따뜻한 오솔길 가도', color: '#e5a973', miniColor: '#e5a973', walkable: true, naval: false },
  [TILE.BRIDGE]:       { name: '견고한 교량', color: '#935328', miniColor: '#a66232', walkable: true, naval: true },
  [TILE.CASTLE_FLOOR]: { name: '성채 석재 광장', color: '#88929e', miniColor: '#9ba5b2', walkable: true, naval: false },
  [TILE.DOCK]:         { name: '항구 목조 부두', color: '#875129', miniColor: '#995e32', walkable: true, naval: true },
  [TILE.WALL]:         { name: '방어 성벽', color: '#4a5568', miniColor: '#cbd5e1', walkable: true, naval: false },
  [TILE.DESERT]:       { name: '황금빛 모래사막', color: '#f0ad56', miniColor: '#f0ad56', walkable: true, naval: false },
  [TILE.ELVEN_FOREST]: { name: '영원의 요정숲', color: '#2b8a75', miniColor: '#34d399', walkable: true, naval: false },
  [TILE.LAVA]:         { name: '펄펄 끓는 용암', color: '#ef4444', miniColor: '#f97316', walkable: false, naval: false },
  [TILE.CORAL]:        { name: '산호초 환초', color: '#22d3ee', miniColor: '#38bdf8', walkable: false, naval: true },
  [TILE.AUTUMN_WOOD]:  { name: '붉은 단풍나무 숲', color: '#9a3412', miniColor: '#c2410c', walkable: true, naval: false },
  [TILE.SWAMP]:        { name: '안개 낀 늪지대', color: '#3b5235', miniColor: '#4d6945', walkable: true, naval: false },
  [TILE.TUNDRA]:       { name: '영구동토 툰드라', color: '#78909c', miniColor: '#90a4ae', walkable: true, naval: false },
  [TILE.OBSIDIAN]:     { name: '흑요석 화산암대', color: '#262626', miniColor: '#404040', walkable: true, naval: false },
  [TILE.CRYSTAL_CAVE]: { name: '비전 수정 광맥', color: '#7e22ce', miniColor: '#a855f7', walkable: true, naval: false },
  [TILE.OASIS_WATER]:  { name: '오아시스 에메랄드 담수', color: '#14b8a6', miniColor: '#2dd4bf', walkable: false, naval: true }
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

  // =========================================================================
  // 6. THE CELESTIAL SKY ARCHIPELAGO & ABYSS (천공의 부유 군도 & 심연 마그마 성소)
  // =========================================================================
  add('sky_aetheria', '천공의 대성소 에테리아 (신성 제단)', 'capital', 'sky', 1920, 360, 'celestial', true, 16);
  add('sky_starfall_keep', '성좌의 수호성채 스타폴', 'castle', 'sky', 1560, 330, 'celestial', true, 12);
  add('sky_celestial_haven', '천공의 오아시스 하이헤이븐', 'port', 'sky', 2280, 350, 'celestial', true, 12);
  add('sky_cloud_monastery', '구름바다 고요 수도원', 'town', 'sky', 1740, 260, 'celestial', false, 8);
  add('sky_void_citadel', '공허의 천공 심연요새', 'lair', 'sky', 2120, 240, 'monster', true, 11);
  add('sky_astral_observatory', '태고의 천체 관측소', 'town', 'sky', 1920, 190, 'celestial', false, 8);
  add('sky_valkyrie_eyrie', '발키리 천공 비룡 둥지', 'fortress', 'sky', 1380, 280, 'celestial', true, 9);
  add('sky_starlight_forge', '별빛 결정 주조소 타운', 'town', 'sky', 2460, 300, 'celestial', false, 8);
  add('magma_abyss_chasm', '심연 화염 열곡 드워프 용광로', 'castle', 'south', 1920, 2140, 'kingdom', true, 14);

  // =========================================================================
  // 7. THE SUNKEN ATLANTEAN ABYSS & DEEP OCEAN SHRINES (해저 아틀란티스 신전 & 심해 성소)
  // =========================================================================
  add('abyss_poseidonia', '아틀란티스 해저 수도 포세이도니아', 'capital', 'abyss_ocean', 640, 420, 'oceanic', true, 16);
  add('abyss_sunken_atlantis', '가라앉은 태고의 대신전 (포세이돈의 성역)', 'castle', 'abyss_ocean', 880, 520, 'oceanic', true, 14);
  add('abyss_kraken_depths', '크라켄의 심연 해구 요새', 'fortress', 'abyss_ocean', 480, 780, 'monster', true, 12);
  add('abyss_lumina_reef', '생체 발광 산호초 군락 성채', 'town', 'abyss_ocean', 1080, 460, 'oceanic', false, 9);
  add('abyss_tide_sanctuary', '파도소리 성역 신전', 'town', 'abyss_ocean', 720, 920, 'oceanic', false, 8);
  add('abyss_siren_grotto', '세이렌의 심해 유적 동굴', 'lair', 'abyss_ocean', 440, 560, 'monster', true, 10);

  // =========================================================================
  // 8. THE PRIMORDIAL MAGMA CALDERA & UNDERWORLD (태고의 마그마 칼데라 & 명계 제국)
  // =========================================================================
  add('underworld_styx_citadel', '명계 스틱스 흑요석 대성채', 'capital', 'underworld', 2180, 2180, 'undead', true, 16);
  add('underworld_tartarus_gate', '타르타로스 심연의 문', 'fortress', 'underworld', 1720, 2220, 'monster', true, 13);
  add('caldera_molten_spire', '용암 칼데라 화염 첨탑', 'castle', 'underworld', 2360, 2120, 'monster', true, 12);
  add('underworld_asphodel_meadows', '아스포델 망자의 안식처', 'town', 'underworld', 1540, 2160, 'undead', false, 9);
  add('caldera_fire_forge', '태고 화룡의 화염 대장간', 'town', 'underworld', 2520, 2260, 'kingdom', false, 8);
  add('underworld_crypt_pantheon', '고대 영령의 묘지 판테온', 'lair', 'underworld', 1980, 2320, 'undead', true, 11);

  // =========================================================================
  // 9. THE ARCANE CRYSTAL SPIRE PEAKS & ASTRAL RIFT (성운 비전 수정 고원 & 차원 균열)
  // =========================================================================
  add('astral_crystal_citadel', '성운 비전 수정 대성채', 'capital', 'astral', 3200, 280, 'celestial', true, 16);
  add('astral_starlight_sanctum', '별빛 성소 아케인 생텀', 'castle', 'astral', 2980, 220, 'celestial', true, 13);
  add('astral_void_gate', '공허 차원 관문 요새', 'fortress', 'astral', 3460, 340, 'monster', true, 12);
  add('astral_aurora_monastery', '오로라 설봉 수도원', 'town', 'astral', 3120, 150, 'celestial', false, 8);
  add('astral_chronos_observatory', '시간의 천체 관측소', 'town', 'astral', 3380, 210, 'celestial', false, 9);
  add('astral_gemstone_cavern', '영롱한 보석 결정 동굴', 'lair', 'astral', 3020, 390, 'monster', true, 10);

  // =========================================================================
  // 10. THE SUNKEN ATLANTEAN ABYSS & CORAL TRENCH (심해 해저 아틀란티스 신전 & 산호 해구 제국)
  // =========================================================================
  add('atlantis_sunken_pantheon', '아틀란티스 가라앉은 신전 판테온', 'capital', 'atlantis', 720, 2180, 'merfolk', true, 16);
  add('atlantis_coral_citadel', '발광 산호 대성채', 'castle', 'atlantis', 560, 2080, 'merfolk', true, 14);
  add('atlantis_leviathan_trench', '레비아탄 심해 해구 요새', 'fortress', 'atlantis', 910, 2260, 'monster', true, 12);
  add('atlantis_siren_grotto', '세이렌 유혹의 산호 동굴', 'town', 'atlantis', 640, 2290, 'merfolk', false, 8);
  add('atlantis_pearl_reef_harbor', '진주 조개초 심해 항만', 'port', 'atlantis', 840, 2060, 'merfolk', false, 9);
  add('atlantis_poseidon_trident_altar', '포세이돈 삼지창 고대 제단', 'temple', 'atlantis', 780, 2210, 'merfolk', true, 11);

  // =========================================================================
  // 11. THE PRIMORDIAL VOID ABYSS & FLOATING STAR SHARDS (태고의 공허 심연 & 성운 파쇄 군도)
  // =========================================================================
  add('void_singularity_nexus', '특이점 넥서스 코어 대성채', 'capital', 'void', 3620, 1850, 'celestial', true, 16);
  add('void_chronos_spire', '시공 왜곡의 뫼비우스 첨탑', 'castle', 'void', 3740, 1720, 'celestial', true, 14);
  add('void_astral_dredge_dock', '공허 부유선 계류 항만', 'port', 'void', 3520, 1940, 'celestial', false, 9);
  add('void_shadow_cloister', '성운 암흑 은둔 수도원', 'town', 'void', 3680, 2020, 'undead', false, 8);
  add('void_singing_meteor_crater', '노래하는 운석 충돌구', 'lair', 'void', 3550, 1760, 'monster', true, 11);
  add('void_supernova_forge', '초신성 에테르 모루 제단', 'temple', 'void', 3600, 1650, 'celestial', true, 12);

  // =========================================================================
  // 12. THE SACRED YGGDRASIL WORLD TREE & FAIRY CANOPY (성스러운 세계수 위그드라실 천공 수관림)
  // =========================================================================
  add('yggdrasil_elder_crown', '세계수 최상층 엘더 크라운 수도', 'capital', 'yggdrasil', 2650, 520, 'elf', true, 16);
  add('yggdrasil_canopy_palace', '천공 수관림 에메랄드 궁전', 'castle', 'yggdrasil', 2510, 440, 'elf', true, 14);
  add('yggdrasil_fairy_haven', '요정 날개 안식처 항만', 'port', 'yggdrasil', 2780, 610, 'elf', false, 9);
  add('yggdrasil_glowmoss_spire', '발광 이끼 비전 침엽탑', 'town', 'yggdrasil', 2610, 710, 'elf', false, 8);
  add('yggdrasil_ancient_root_burrow', '태고 뿌리 영험한 굴', 'lair', 'yggdrasil', 2450, 620, 'beastkin', true, 10);
  add('yggdrasil_life_spring_font', '생명의 영천 신성 샘터', 'temple', 'yggdrasil', 2730, 480, 'celestial', true, 12);

  // =========================================================================
  // 13. THE SUNKEN ATLANTIS & ABYSSAL MERMAID KINGDOM (심연의 아틀란티스 해저 수도 & 산호 인어 왕국)
  // =========================================================================
  add('atlantis_royal_trench', '아틀란티스 심연 해저 수도', 'capital', 'atlantis', 2050, 1720, 'elf', true, 16);
  add('atlantis_coral_pearl_sanctuary', '진주 산호초 신성 안식처', 'temple', 'atlantis', 2180, 1640, 'celestial', true, 13);
  add('atlantis_sunken_acropolis', '가라앉은 침몰 아크로폴리스', 'castle', 'atlantis', 1940, 1820, 'elf', true, 15);
  add('atlantis_thermal_vent_forge', '심해 열수구 티타늄 단층대', 'town', 'atlantis', 2110, 1850, 'dwarf', false, 9);
  add('atlantis_mermaid_song_reef', '인어의 노랫소리 비전 환초', 'port', 'atlantis', 1880, 1680, 'beastkin', false, 8);
  add('atlantis_poseidon_trident_citadel', '포세이돈 심해 삼지창 성채', 'lair', 'atlantis', 2240, 1780, 'dragon', true, 11);

  // =========================================================================
  // 14. THE CELESTIAL STARFALL & CHRONO CLOCKWORK REALM (크로노스 시공간 시계탑 & 유성우 천문대 대륙)
  // =========================================================================
  add('chrono_grand_clockwork_citadel', '크로노스 대시계탑 수도', 'capital', 'chrono', 1280, 460, 'dwarf', true, 16);
  add('chrono_starfall_observatory', '유성우 천문대 신성 돔', 'temple', 'chrono', 1420, 390, 'celestial', true, 14);
  add('chrono_astronomer_aether_haven', '성운 에테르 비행선 항만', 'port', 'chrono', 1160, 520, 'elf', false, 9);
  add('chrono_timeworn_hourglass_spire', '영겁의 모래시계 마법 첨탑', 'town', 'chrono', 1340, 590, 'human', false, 8);
  add('chrono_zodiac_sun_dial_plaza', '황도 12궁 해시계 대성채', 'castle', 'chrono', 1490, 480, 'crusader', true, 13);
  add('chrono_perpetual_motion_forge', '영구기관 비전 기어 용광로', 'lair', 'chrono', 1210, 360, 'dwarf', true, 11);

  // =========================================================================
  // 15. THE FROSTMOURNE GLACIAL SPIRE & AURORA VALKYRIE (극지방 오로라 발키리 성역 & 빙하 요새 제국)
  // =========================================================================
  add('valkyrie_aurora_throne', '발키리 오로라 천공 옥좌 수도', 'capital', 'valkyrie', 2150, 220, 'elf', true, 16);
  add('valkyrie_frostmourne_citadel', '서리한 빙하 만년설 대성채', 'castle', 'valkyrie', 2020, 160, 'crusader', true, 14);
  add('valkyrie_rime_crystal_fjord', '서리 결정 피오르드 항만', 'port', 'valkyrie', 2280, 290, 'human', false, 9);
  add('valkyrie_mammoth_tundra_camp', '고대 매머드 툰드라 부족 거점', 'town', 'valkyrie', 1940, 260, 'beastkin', false, 8);
  add('valkyrie_permafrost_ice_forge', '영구동토 비전 서리 대장간', 'lair', 'valkyrie', 2340, 180, 'dwarf', true, 11);
  add('valkyrie_borealis_monolith_shrine', '북극광 성좌 거석 신성 제단', 'temple', 'valkyrie', 2090, 310, 'celestial', true, 12);

  // =========================================================================
  // 16. THE EASTERN SAKURA JADE EMPIRE & SPIRIT BAMBOO GROVE (동방 벚꽃 옥룡 제국 & 영혼의 죽림)
  // =========================================================================
  add('sakura_jade_palace_capital', '벚꽃 옥룡 황성 수도', 'capital', 'sakura', 2950, 1420, 'human', true, 16);
  add('sakura_spirit_bamboo_temple', '영혼의 죽림 선원 신사', 'temple', 'sakura', 3080, 1340, 'elf', true, 14);
  add('sakura_floating_lotus_port', '부유하는 연꽃 다원 항만', 'port', 'sakura', 2840, 1520, 'human', false, 9);
  add('sakura_samurai_moonlit_dojo', '월하의 사무라이 도장 대성채', 'castle', 'sakura', 3160, 1490, 'crusader', true, 13);
  add('sakura_jade_waterfall_forge', '옥룡 폭포 비전 명검 대장간', 'lair', 'sakura', 3010, 1610, 'dwarf', true, 10);
  add('sakura_kitsune_spirit_shrine', '구미호 신목 영험한 여우 신사', 'town', 'sakura', 2890, 1320, 'beastkin', false, 8);
  // =========================================================================
  // 17. THE ANCIENT SANDSEA MIRAGE EMPIRE & DJINN OASIS (환영의 모래바다 신기루 제국 & 지니의 오아시스 성역)
  // =========================================================================
  add('mirage_sultan_palace_capital', '신기루 술탄 황궁 수도', 'capital', 'mirage', 3200, 1950, 'human', true, 16);
  add('djinn_sacred_oasis_font', '지니의 영험한 오아시스 영천', 'temple', 'mirage', 3080, 1890, 'celestial', true, 13);
  add('sandsea_caravan_bazaar_port', '모래바다 대상 무역 바자르 항만', 'port', 'mirage', 3340, 2010, 'human', false, 9);
  add('ancient_pharaoh_pyramid_necropolis', '고대 파라오 피라미드 네크로폴리스', 'castle', 'mirage', 3120, 2060, 'undead', true, 14);
  add('lapis_lazuli_gem_forge', '청금석 비전 보석 대장간', 'lair', 'mirage', 3280, 1860, 'dwarf', true, 10);
  add('astral_dune_sphinx_monolith', '천체 사구 스핑크스 수호 거석', 'town', 'mirage', 3390, 1920, 'beastkin', false, 8);

  // =========================================================================
  // 18. THE MOUNT OLYMPUS THUNDER PEAK & TITAN COLOSSEUM (천둥의 올림포스 제우스 판테온 & 신들의 티탄 검투장 대륙)
  // =========================================================================
  add('olympus_zeus_throne_pantheon', '올림포스 제우스 천공 옥좌 판테온', 'capital', 'olympus', 650, 190, 'celestial', true, 16);
  add('titan_colosseum_grand_arena', '티탄 천공 검투장 대투기장', 'castle', 'olympus', 520, 240, 'crusader', true, 14);
  add('pegasus_aether_skydock_port', '페가수스 에테르 비행선 계류 항만', 'port', 'olympus', 780, 220, 'human', false, 9);
  add('hephaestus_divine_thunder_forge', '헤파이토스 신성 번개 제련 대장간', 'lair', 'olympus', 710, 130, 'dwarf', true, 11);
  add('athena_wisdom_marble_academy', '아테나 지혜의 대리석 학술 아카데미', 'town', 'olympus', 580, 150, 'elf', false, 8);
  add('delphi_prophecy_oracle_spring', '델포이 신탁의 신성 샘터 성역', 'temple', 'olympus', 460, 180, 'beastkin', true, 10);

  // =========================================================================
  // 19. THE DEEP MOUNTAIN STEAMFORGE DWARVEN METROPOLIS & MAGMA CORE (태고 드워프 증기 요새 & 거신 마그마 제국)
  // =========================================================================
  add('steamforge_dwarven_high_throne', '태고 드워프 증기 황제 옥좌 대성채', 'capital', 'steamforge', 240, 480, 'dwarf', true, 16);
  add('titan_magma_smelting_foundry', '티탄 마그마 거대 제련소 & 흑요석 모루', 'castle', 'steamforge', 180, 560, 'dwarf', true, 14);
  add('aether_geothermal_drill_port', '에테르 지열 굴착 비행선 항만', 'port', 'steamforge', 310, 420, 'human', false, 9);
  add('runic_golem_assembly_sanctum', '룬 골렘 조립 신성 공방 성역', 'lair', 'steamforge', 150, 400, 'dwarf', true, 11);
  add('mithril_deep_vein_quarry', '미스릴 심층 광맥 채굴 대성채', 'town', 'steamforge', 280, 580, 'crusader', false, 8);
  add('valkyrie_brazen_bull_altar', '청동 거신 마그마 화로 제단', 'temple', 'steamforge', 210, 640, 'monster', true, 10);

  // =========================================================================
  // 20. THE ROYAL GOTHIC BLOOD ROSE CATHEDRAL & VAMPIRE CASTLEVANIA CITADEL (핏빛 장미의 고딕 뱀파이어 제국 & 월하의 야상곡 성채)
  // =========================================================================
  add('gothic_blood_rose_cathedral_capital', '핏빛 장미의 고딕 대성당 수도', 'capital', 'gothic', 2850, 1980, 'undead', true, 16);
  add('vampire_moonlit_castlevania_keep', '월하의 야상곡 캐슬바니아 성채', 'castle', 'gothic', 2740, 2040, 'undead', true, 14);
  add('nocturnal_shadow_fog_haven', '영야의 그림자 안개 항만', 'port', 'gothic', 2960, 2040, 'undead', false, 9);
  add('crypt_alchemist_blood_forge', '지하 납골당 연금술 혈액 대장간', 'lair', 'gothic', 2910, 1910, 'human', true, 10);
  add('crimson_belfry_coven_shrine', '진홍빛 종탑 마녀 집회소 신전', 'temple', 'gothic', 2780, 1920, 'elf', true, 11);
  add('weeping_willow_mausoleum', '수양버들 영혼의 묘소 거석단', 'town', 'gothic', 2850, 2090, 'undead', false, 8);

  // =========================================================================
  // 21. THE CRYSTAL PRISM ZENITH EMPIRE & FLOATING STARLIGHT CITADEL (영롱한 프리즘 수정 제국 & 별빛 마나 성채)
  // =========================================================================
  add('crystal_prism_zenith_capital', '영롱한 프리즘 수정 황제 수도', 'capital', 'crystal_zenith', 2620, 1680, 'elf', true, 16);
  add('starlight_mana_spire_citadel', '별빛 마나 첨탑 에테르 대성채', 'castle', 'crystal_zenith', 2520, 1740, 'celestial', true, 14);
  add('prismatic_aurora_skydock_port', '무지갯빛 오로라 비행선 수정 항만', 'port', 'crystal_zenith', 2740, 1720, 'human', false, 9);
  add('astral_gem_alchemist_refinery', '천상 보석 연금술 정제소 성역', 'lair', 'crystal_zenith', 2680, 1610, 'elf', true, 10);
  add('diamond_constellation_oracle_shrine', '다이아몬드 별자리 신탁 성소', 'temple', 'crystal_zenith', 2540, 1620, 'elf', true, 11);
  add('celestial_quartz_crystal_gardens', '천공 석영 수정 정원 마을', 'town', 'crystal_zenith', 2640, 1800, 'fairy', false, 8);

  // =========================================================================
  // 22. THE BLACK PEARL ABYSSAL CORSAIR ARMADA & KRAKEN CITADEL (검은 깃발 해적 연합 & 크라켄 해골 요새 제국)
  // =========================================================================
  add('corsair_black_flagship_capital', '검은 깃발 해적 연합 수도 & 드레드노트 기함 성채', 'capital', 'corsair', 1380, 1380, 'monster', true, 16);
  add('kraken_abyssal_skull_citadel', '크라켄 거수 해골 요새 성채', 'castle', 'corsair', 1280, 1440, 'monster', true, 14);
  add('tortuga_rum_bazaar_freeport', '토르투가 럼주 암시장 자유 무역항', 'port', 'corsair', 1480, 1340, 'human', false, 9);
  add('ghost_ship_armada_graveyard', '유령선 함대 난파선 묘지 은신처', 'lair', 'corsair', 1340, 1480, 'undead', true, 10);
  add('siren_coral_lagoon_sanctuary', '세이렌 산호초 만 비전 신전', 'temple', 'corsair', 1440, 1460, 'beastkin', true, 11);
  add('smugglers_tide_cavern_haven', '밀수꾼 조수 동굴 아지트 마을', 'town', 'corsair', 1320, 1320, 'human', false, 8);

  // =========================================================================
  // 23. THE CELESTIAL MOONLIT SILVER DRAGON SHRINE & KITSUNE SPIRIT REALM (달빛 은룡 천공 신사 & 구미호 영혼 제국)
  // =========================================================================
  add('moonlit_silver_dragon_capital', '달빛 은룡 천공 신사 수도', 'capital', 'spirit_shrine', 880, 680, 'dragon', true, 16);
  add('kitsune_nine_tails_sacred_citadel', '구미호 영혼 불꽃 신성 성채', 'castle', 'spirit_shrine', 780, 740, 'beastkin', true, 14);
  add('floating_lantern_tide_haven', '부유하는 연등 만조 항만', 'port', 'spirit_shrine', 980, 720, 'human', false, 9);
  add('celestial_bamboo_alchemist_refinery', '천공 영혼 대나무 연금술 공방 성역', 'lair', 'spirit_shrine', 920, 600, 'elf', true, 10);
  add('wisteria_spirit_fox_shrine', '등나무 영령 여우 신탁 성소', 'temple', 'spirit_shrine', 780, 620, 'fairy', true, 11);
  add('thousand_lotus_mirror_grove', '천 개의 연꽃 거울 호수 마을', 'town', 'spirit_shrine', 880, 770, 'human', false, 8);

  // =========================================================================
  // 24. THE PRIMEVAL EMERALD FAIRY WORLD TREE HAVEN & LUMINESCENT SPORE CITADEL (태고 요정 숲 에메랄드 거목 성소 & 발광 포자 거대 버섯 성채)
  // =========================================================================
  add('elder_fairy_world_tree_capital', '태고 요정 숲 에메랄드 거목 성소 수도', 'capital', 'fairy_grove', 1680, 1680, 'fairy', true, 16);
  add('luminescent_spore_citadel', '발광 포자 거대 버섯 성채', 'castle', 'fairy_grove', 1580, 1720, 'fairy', true, 14);
  add('sylph_wind_canopy_skydock_port', '실프 바람 수관림 비행선 항만', 'port', 'fairy_grove', 1780, 1620, 'elf', false, 9);
  add('pixie_alchemical_nectar_distillery', '픽시 비전 꽃꿀 연금술 증류소', 'lair', 'fairy_grove', 1620, 1610, 'fairy', true, 10);
  add('ancient_moss_monolith_shrine', '태고 이끼 거석단 요정 신전', 'temple', 'fairy_grove', 1740, 1740, 'elf', true, 11);
  add('glowing_firefly_hollow_village', '반딧불이 숲속 통나무 마을', 'town', 'fairy_grove', 1680, 1780, 'fairy', false, 8);

  // =========================================================================
  // 25. THE LOST GOLDEN EMPIRE OF EL DORADO & SUN SERPENT CITADEL (태양신의 황금 제국 엘도라도 & 깃털 뱀신 성채)
  // =========================================================================
  add('el_dorado_golden_sun_pyramid_capital', '엘도라도 태양신 황금 피라미드 수도', 'capital', 'el_dorado', 380, 1960, 'human', true, 17);
  add('quetzalcoatl_feathered_serpent_citadel', '케찰코아틀 깃털 뱀신 성채', 'castle', 'el_dorado', 480, 1900, 'beastkin', true, 15);
  add('golden_cenote_emerald_harbor', '성스러운 세노테 에메랄드 황금 항만', 'port', 'el_dorado', 280, 1980, 'human', false, 9);
  add('obsidian_sun_disc_alchemist_forge', '흑요석 태양원반 연금술 제련소', 'lair', 'el_dorado', 340, 2080, 'dwarf', true, 11);
  add('solar_eclipse_monolith_shrine', '개기일식 거석 제단 태양 신전', 'temple', 'el_dorado', 460, 2040, 'celestial', true, 12);
  add('jungle_golden_orchid_village', '밀림 황금 난초 원시 부족 마을', 'town', 'el_dorado', 420, 1860, 'human', false, 8);

  // =========================================================================
  // 26. THE FROST WYRM GLACIER NECROPOLIS & ICECROWN CITADEL (혹한의 서리고룡 빙하 요새 & 영구동토 네크로폴리스)
  // =========================================================================
  add('frost_wyrm_glacial_citadel', '서리고룡왕의 만년빙하 대성채', 'capital', 'frost_necropolis', 960, 160, 'undead', true, 18);
  add('lich_king_frozen_throne_sanctum', '영구동토 리치 킹의 얼어붙은 옥좌', 'castle', 'frost_necropolis', 1080, 220, 'undead', true, 16);
  add('permafrost_mammoth_bone_haven', '만년설 매머드 골각 부족 요새', 'town', 'frost_necropolis', 880, 260, 'human', true, 12);
  add('rime_alchemist_cryo_laboratory', '서리서약 연금술 한랭 연구소', 'lair', 'frost_necropolis', 1140, 140, 'elf', true, 10);
  add('sunken_iceberg_shipwreck_cove', '빙산 좌초 유령선 난파선 만', 'port', 'frost_necropolis', 910, 340, 'corsair', false, 9);
  add('aurora_borealis_valkyrie_shrine', '오로라 극광 발키리 비천 제단', 'temple', 'frost_necropolis', 1020, 80, 'celestial', true, 13);

  // =========================================================================
  // 27. THE CELESTIAL STARFORGE TITAN FOUNDRY & ZODIAC OBSERVATORY (성좌의 천체 티탄 스타포지 & 황도 12궁 혼천의)
  // =========================================================================
  add('starforge_titan_celestial_foundry', '성좌의 천체 티탄 스타포지 수도', 'capital', 'starforge', 3680, 240, 'celestial', true, 18);
  add('zodiac_armillary_astrolabe_observatory', '황도 12궁 거대 혼천의 천문대', 'castle', 'starforge', 3760, 380, 'celestial', true, 16);
  add('supernova_plasma_crucible_haven', '초신성 플라즈마 도가니 요새', 'lair', 'starforge', 3560, 180, 'dwarf', true, 12);
  add('aether_starfall_cataract_harbor', '에테르 유성우 은하 폭포 항만', 'port', 'starforge', 3540, 420, 'elf', false, 10);
  add('stellar_prism_monolith_shrine', '성간 프리즘 거석단 천체 신전', 'temple', 'starforge', 3720, 520, 'celestial', true, 13);
  add('meteor_iron_artificer_village', '운석철 비전 공학자 길드 마을', 'town', 'starforge', 3620, 320, 'human', false, 9);

  // =========================================================================
  // 28. THE PRIMEVAL GIANT HIGHLANDS OF JÖTUNHEIM (태고 거인족 요툰하임 고원 성채 & 천둥 거신 옥좌)
  // =========================================================================
  add('jotunheim_thunder_giant_citadel', '태고 거인왕의 천둥 요툰하임 대성채', 'capital', 'jotunheim', 220, 140, 'titan', true, 18);
  add('rune_colossus_cyclopean_sanctum', '룬 거신 사이클롭스 신성 거석 성소', 'castle', 'jotunheim', 320, 200, 'titan', true, 16);
  add('cloud_frost_giant_crag_haven', '구름 서리 거인 암벽 요새', 'lair', 'jotunheim', 120, 80, 'titan', true, 12);
  add('mammoth_horn_sky_fjord_port', '매머드 뿔 천공 피오르드 협만 항구', 'port', 'jotunheim', 100, 260, 'human', false, 10);
  add('ancient_dolmen_monolith_shrine', '고대 거석 돌멘 신탁 제단', 'temple', 'jotunheim', 280, 80, 'celestial', true, 13);
  add('ironwood_barbarian_clan_village', '철목 부족 바바리안 원시 부락', 'town', 'jotunheim', 240, 280, 'human', false, 9);

  // =========================================================================
  // 29. THE CELESTIAL SHANGRI-LA & THOUSAND LOTUS JADE DRAGON (상그릴라 신선 비경 & 천년 백련 옥룡 성채)
  // =========================================================================
  add('shangrila_nine_tier_jade_pagoda', '상그릴라 구층 비취 옥탑 수도', 'capital', 'shangrila', 3040, 560, 'elf', true, 18);
  add('thousand_lotus_yin_yang_sanctum', '천년 백련 태극 음양 성소', 'castle', 'shangrila', 3140, 660, 'celestial', true, 16);
  add('cloud_bamboo_hermit_retreat', '구름 죽림 신선 은둔 도원', 'lair', 'shangrila', 2920, 500, 'human', false, 11);
  add('celestial_peach_spring_harbor', '천도복숭아 영천 계류 나루터', 'port', 'shangrila', 2960, 680, 'human', false, 10);
  add('flying_sword_alchemist_pavilion', '어검 비천 연단술 정자 신전', 'temple', 'shangrila', 3180, 500, 'celestial', true, 12);
  add('misty_tea_terrace_mountain_village', '운무 백련 다원 계단식 차밭 마을', 'town', 'shangrila', 3080, 740, 'human', false, 9);

  // =========================================================================
  // 30. THE ANCIENT BABYLON ZIGGURAT & HANGING TERRACE GARDENS (태고 바빌론 에테메난키 지구라트 & 공중정원 라마수 제국)
  // =========================================================================
  add('babylon_etemenanki_ziggurat', '바빌론 에테메난키 칠층 청금석 지구라트 수도', 'capital', 'babylon', 3020, 2180, 'human', true, 18);
  add('ishtar_winged_lamassu_gate', '이슈타르 청금석 날개사자 라마수 관문 성채', 'castle', 'babylon', 2900, 2140, 'human', true, 16);
  add('hanging_gardens_terrace_palace', '유프라테스 부유 공중정원 계단식 테라스 궁전', 'palace', 'babylon', 3140, 2240, 'elf', true, 14);
  add('cuneiform_astronomer_ziggurat_observatory', '쐐기문자 점성술 점토판 천문대 신전', 'temple', 'babylon', 2840, 2280, 'human', true, 12);
  add('fertile_crescent_date_palm_oasis', '비옥한 초승달 대추야자 운하 오아시스', 'town', 'babylon', 2980, 2320, 'human', false, 10);
  add('euphrates_reed_boat_delta_harbor', '유프라테스 파피루스 갈대선 삼각주 하구 나루터', 'port', 'babylon', 3120, 2340, 'human', false, 9);

  // =========================================================================
  // 31. THE SACRED SOLAR PHOENIX & BYZANTINE BASILICA EMPIRE (신성 불사조 솔 인빅투스 황금 바실리카 & 쌍두독수리 팔라티노 제국)
  // =========================================================================
  add('sol_invictus_golden_basilica', '솔 인빅투스 황금 돔 대바실리카 수도', 'capital', 'sol_invictus', 3680, 680, 'celestial', true, 18);
  add('phoenix_flame_aether_citadel', '불사조 화염 에테르 대성채', 'castle', 'sol_invictus', 3760, 780, 'crusader', true, 16);
  add('solar_eagle_triumphal_colosseum', '태양 독수리 개선문 검투장', 'palace', 'sol_invictus', 3580, 620, 'human', true, 14);
  add('augustus_marble_pantheon_temple', '아우구스투스 대리석 판테온 신전', 'temple', 'sol_invictus', 3740, 600, 'celestial', true, 12);
  add('byzantine_silk_mosaic_bazaar', '비잔틴 비단 모자이크 길드 마을', 'town', 'sol_invictus', 3600, 760, 'human', false, 10);
  add('golden_horn_imperial_naval_harbor', '황금뿔 제국 함대 기국 군항', 'port', 'sol_invictus', 3660, 840, 'human', false, 9);

  // =========================================================================
  // 32. THE HYDROTHERMAL VOLCANIC ATOLL & OBSIDIAN LEVIATHAN (해저 화산 열수구 흑요석 레비아탄 요새 & 마그마 환초 제국)
  // =========================================================================
  add('leviathan_caldera_obsidian_citadel', '해저 칼데라 흑요석 레비아탄 수도', 'capital', 'leviathan_trench', 1020, 1940, 'undead', true, 18);
  add('hydrothermal_black_smoker_forge', '심해 열수구 흑연 굴착 대장간', 'castle', 'leviathan_trench', 1120, 1900, 'dwarf', true, 16);
  add('bioluminescent_siren_chasm_palace', '발광 산호초 세이렌 심연 궁전', 'palace', 'leviathan_trench', 940, 1880, 'beastkin', true, 14);
  add('drowned_kraken_altar_sanctum', '침몰 크라켄 뼈 제단 심해 신전', 'temple', 'leviathan_trench', 1080, 2020, 'undead', true, 12);
  add('phosphor_pearl_diver_atoll_village', '인광 진주 채취 환초 해상 가옥', 'town', 'leviathan_trench', 920, 1980, 'human', false, 10);
  add('abyssal_trench_submarine_dock', '심해 해구 룬 추진 잠수함 기지', 'port', 'leviathan_trench', 1000, 2060, 'human', false, 9);

  // =========================================================================
  // 33. THE ANCIENT PERSIAN PERSEPOLIS & WINGED SIMURGH (태고 페르시아 페르세폴리스 만국의 문 & 영조 시무르그 불멸 제국)
  // =========================================================================
  add('persepolis_apadana_citadel', '페르세폴리스 아파다나 만국의 수도', 'capital', 'persepolis', 3500, 2180, 'human', true, 18);
  add('gate_of_all_nations_gatehouse', '만국의 문 쌍익인면 황소 관문', 'castle', 'persepolis', 3420, 2120, 'crusader', true, 16);
  add('simurgh_sacred_flame_sanctum', '영조 시무르그 성화의 하오마 성소', 'palace', 'persepolis', 3600, 2140, 'celestial', true, 14);
  add('tachar_immortal_guard_fortress', '타차르 1만 불사부대 아타나토이 요새', 'temple', 'persepolis', 3540, 2260, 'crusader', true, 12);
  add('turqoise_caravan_oasis_harbor', '청록 터키석 오아시스 캐러밴 대상 마을', 'town', 'persepolis', 3380, 2240, 'human', false, 10);
  add('royal_cyrus_cylinder_treasury', '키루스 원통 칙령 왕실 칙서 보물고', 'port', 'persepolis', 3460, 2320, 'human', false, 9);

  // =========================================================================
  // 34. THE LOST SUNKEN CONTINENT OF LEMURIA & MU (태고 침몰 제국 레무리아 & 무 대륙의 산호 요새)
  // =========================================================================
  add('lemuria_sunken_jade_citadel', '레무리아 심해 청옥 대성채 수도', 'capital', 'lemuria', 180, 2220, 'celestial', true, 18);
  add('mu_crystal_pyramid_sanctum', '무 대륙 에테르 수정 피라미드 성소', 'castle', 'lemuria', 100, 2160, 'crusader', true, 16);
  add('nautilus_shell_pearl_palace', '거대 앵무조개 진주 궁전', 'palace', 'lemuria', 260, 2180, 'beastkin', true, 14);
  add('bioluminescent_angler_temple', '심해 초롱아귀 발광 신전', 'temple', 'lemuria', 140, 2300, 'undead', true, 12);
  add('sunken_chitin_coral_diver_village', '심해 갑각 산호 채취 잠수부 마을', 'town', 'lemuria', 220, 2340, 'human', false, 10);
  add('abyssal_trench_leviathan_wharf', '해구 레비아탄 심항 부두 기지', 'port', 'lemuria', 120, 2380, 'human', false, 9);

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
    else if (s.continent === 'sky') baseLandTile = TILE.MEADOW;

    for (let dy = -landRad; dy <= landRad; dy++) {
      for (let dx = -landRad; dx <= landRad; dx++) {
        const dist = Math.hypot(dx, dy);
        const tx = s.x + dx;
        const ty = s.y + dy;
        if (!inBounds(tx, ty)) continue;

        // 천공의 부유 군도 전용 지형 카빙
        if (s.continent === 'sky') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 6) ? TILE.CASTLE_FLOOR : TILE.MEADOW;
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = TILE.CORAL;
          } else if (dist <= landRad + 1) {
            tiles[idx(tx, ty)] = TILE.WATER;
          }
          continue;
        }

        // 심해 아틀란티스 해저 신전군 전용 지형 카빙
        if (s.continent === 'abyss_ocean') {
          if (dist <= landRad - 7) {
            tiles[idx(tx, ty)] = (dist <= 5) ? TILE.CASTLE_FLOOR : TILE.CRYSTAL_CAVE;
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = TILE.CORAL;
          } else if (dist <= landRad + 2) {
            tiles[idx(tx, ty)] = TILE.WATER;
          }
          continue;
        }

        // 태고의 칼데라 & 명계 제국 전용 지형 카빙
        if (s.continent === 'underworld') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 5) ? TILE.CASTLE_FLOOR : TILE.OBSIDIAN;
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.LAVA : TILE.OBSIDIAN;
          } else if (dist <= landRad + 1) {
            tiles[idx(tx, ty)] = TILE.BADLANDS;
          }
          continue;
        }

        // 성운의 비전 고원 & 차원 균열 전용 지형 카빙
        if (s.continent === 'astral') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 5) ? TILE.CASTLE_FLOOR : TILE.CRYSTAL_CAVE;
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CORAL : TILE.SNOW;
          } else if (dist <= landRad + 1) {
            tiles[idx(tx, ty)] = TILE.MOUNTAIN;
          }
          continue;
        }

        // 고대 심해 아틀란티스 신전 & 산호 해구 전용 지형 카빙
        if (s.continent === 'atlantis') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 5) ? TILE.CASTLE_FLOOR : TILE.CRYSTAL_CAVE;
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CORAL : TILE.SAND;
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.CORAL : TILE.SHALLOW_WATER;
          }
          continue;
        }

        // 태고의 공허 심연 & 성운 파쇄 군도 전용 지형 카빙
        if (s.continent === 'void') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 5) ? TILE.CASTLE_FLOOR : TILE.OBSIDIAN;
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CRYSTAL_CAVE : TILE.OBSIDIAN;
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.CORAL : TILE.DEEP_WATER;
          }
          continue;
        }

        // 성스러운 세계수 위그드라실 천공 수관림 전용 지형 카빙
        if (s.continent === 'yggdrasil') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 5) ? TILE.CASTLE_FLOOR : TILE.ELVEN_FOREST;
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CRYSTAL_CAVE : TILE.MEADOW;
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.WATER : TILE.FOREST;
          }
          continue;
        }

        // 심연의 아틀란티스 해저 수도 및 산호초 전용 지형 카빙
        if (s.continent === 'atlantis') {
          if (dist <= landRad - 7) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 가라앉은 고대 대리석 열주 바닥
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CORAL : TILE.CRYSTAL_CAVE; // 발광 산호초 & 해저 수정동굴
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.WATER : TILE.DEEP_WATER;
          }
          continue;
        }

        // 크로노스 시공간 시계탑 & 유성우 천문대 대륙 전용 지형 카빙
        if (s.continent === 'chrono') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 톱니 기어 패턴 석조 포장 도로
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CRYSTAL_CAVE : TILE.MEADOW; // 성운 별빛 초원 & 시간 수정동굴
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.ROAD : TILE.FOREST;
          }
          continue;
        }

        // 극지방 오로라 발키리 성역 및 빙하 대성채 전용 지형 카빙
        if (s.continent === 'valkyrie') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.SNOW; // 순백 만년설 바닥
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CRYSTAL_CAVE : TILE.SNOW; // 서리 크리스탈 동굴 & 설원
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.WATER : TILE.SNOW;
          }
          continue;
        }

        // 동방 벚꽃 옥룡 제국 & 영혼의 죽림 전용 지형 카빙
        if (s.continent === 'sakura') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 붉은 기와 석조 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.MEADOW : TILE.FOREST; // 벚꽃 꽃밭 초원 & 영혼의 대나무 숲
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.WATER : TILE.MEADOW;
          }
          continue;
        }

        // 환영의 모래바다 신기루 제국 & 지니의 오아시스 전용 지형 카빙
        if (s.continent === 'mirage') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 사막 궁전 황금 석조 도로 & 모자이크 바닥
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.SAND : TILE.DESERT; // 끝없는 황금 사구 & 따뜻한 사막 지대
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 4 === 0) ? TILE.WATER : TILE.SAND; // 지니의 오아시스 터키석 영천 및 모래톱
          }
          continue;
        }

        // 천둥의 올림포스 판테온 & 신들의 티탄 검투장 전용 고원 지형 카빙
        if (s.continent === 'olympus') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 신성 백옥 대리석 열주 광장 & 황금 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.SNOW : TILE.HILLS; // 올림포스 만년설 고원 & 성스러운 구릉지
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.MOUNTAIN : TILE.SNOW; // 신들의 영봉 암벽 봉우리
          }
          continue;
        }

        // 태고 드워프 증기 요새 & 거신 마그마 제국 전용 지형 카빙
        if (s.continent === 'steamforge') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 놋쇠 레일과 현무암 포장 도로
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.OBSIDIAN : TILE.BADLANDS; // 흑요석 지각 & 붉은 황무지 단층대
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.LAVA : TILE.MOUNTAIN; // 마그마 용암 개울과 험준한 암벽 산맥
          }
          continue;
        }

        // 핏빛 장미의 고딕 뱀파이어 제국 전용 지형 카빙
        if (s.continent === 'gothic') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 고딕 흑요석 슬레이트 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.DARK_FOREST : TILE.SWAMP; // 안개 낀 그림자 침엽수림 & 보랏빛 늪지
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.DEEP_WATER : TILE.DARK_FOREST;
          }
          continue;
        }

        // 영롱한 프리즘 수정 제국 & 별빛 마나 성채 전용 지형 카빙
        if (s.continent === 'crystal_zenith') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 영롱한 수정 대리석 포장 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CRYSTAL_CAVE : TILE.MEADOW; // 발광 크리스탈 수정 바위 & 마나 초원
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.WATER : TILE.CRYSTAL_CAVE; // 무지갯빛 마나 호수 & 수정 암반
          }
          continue;
        }

        // 검은 깃발 해적 연합 & 크라켄 해골 요새 제국 전용 해양 산호초 환초 카빙
        if (s.continent === 'corsair') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 흑요석 해적 데크 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.SAND : TILE.GRASS; // 야자수 열대 해변 & 산호초 환초
          } else if (dist <= landRad + 4) {
            tiles[idx(tx, ty)] = TILE.WATER; // 에메랄드 청록빛 라군 얕은 바다
          }
          continue;
        }

        // 달빛 은룡 천공 신사 & 구미호 영혼 제국 전용 신령 군도 지형 카빙
        if (s.continent === 'spirit_shrine') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 주홍빛 칠기 석조 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.ELVEN_FOREST : TILE.MEADOW; // 달빛 신령 죽림 & 영혼의 연꽃 습지
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.WATER : TILE.ELVEN_FOREST; // 맑은 거울 호수 & 연등 수로
          }
          continue;
        }

        // 태고 요정 숲 에메랄드 거목 성소 & 발광 포자 거대 버섯 성채 전용 지형 카빙
        if (s.continent === 'fairy_grove') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 에메랄드 이끼 보석 석조 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.ELVEN_FOREST : TILE.MEADOW; // 태고 에메랄드 요정림 & 신비로운 이끼 초원
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.WATER : TILE.ELVEN_FOREST; // 맑은 숲속 요정 옹달샘 & 거목 숲
          }
          continue;
        }

        // 태양신의 황금 제국 엘도라도 & 깃털 뱀신 성채 전용 지형 카빙
        if (s.continent === 'el_dorado') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 찬란한 황금 석조 포장 제단 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.ELVEN_FOREST : TILE.MEADOW; // 울창한 원시 밀림 & 황금 난초 개활지
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.WATER : TILE.SAND; // 성스러운 에메랄드 세노테 싱크홀 연못 & 백사장
          }
          continue;
        }

        // 혹한의 서리고룡 빙하 요새 & 영구동토 네크로폴리스 전용 지형 카빙
        if (s.continent === 'frost_necropolis') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.OBSIDIAN : TILE.CASTLE_FLOOR; // 칠흑의 흑요석 만년빙하 성채 바닥 및 서리 룬 도로
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.SNOW : TILE.TUNDRA; // 만년설 영구동토 빙하 및 혹한의 툰드라 대지
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.SNOW : TILE.CRYSTAL_CAVE; // 부유하는 푸른 만년빙산 조각 및 서리 결정지
          }
          continue;
        }

        // 성좌의 천체 티탄 스타포지 & 황도 12궁 혼천의 전용 지형 카빙
        if (s.continent === 'starforge') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.OBSIDIAN : TILE.CASTLE_FLOOR; // 칠흑의 우주 흑요석 기단 및 황금 성좌 룬 바닥
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CRYSTAL_CAVE : TILE.MEADOW; // 영롱한 별빛 수정 결정지 및 은하 잔디
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.OASIS_WATER : TILE.SAND; // 에테르 은하수 운하 및 백금 모래
          }
          continue;
        }

        // 태고 거인족 요툰하임 고원 성채 & 천둥 거신 옥좌 전용 지형 카빙
        if (s.continent === 'jotunheim') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 태고의 거석 석판 포장 성채 기단
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.HILLS : TILE.MOUNTAIN; // 험준한 화강암 거인 협곡 암벽 및 고원
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.WATER : TILE.SNOW; // 깊은 피오르드 협만 바다 및 만년설 능선
          }
          continue;
        }

        // 상그릴라 신선 비경 & 천년 백련 옥룡 성채 전용 지형 카빙
        if (s.continent === 'shangrila') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 백옥 판석 제단 및 비취 회랑 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.ELVEN_FOREST : TILE.MEADOW; // 울창한 청죽림 대나무숲 & 천년 도화원
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.OASIS_WATER : TILE.SAND; // 연꽃 옹달샘 호수 & 하얀 비단 백사장
          }
          continue;
        }

        // 태고 바빌론 에테메난키 지구라트 & 공중정원 라마수 제국 전용 지형 카빙
        if (s.continent === 'babylon') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 청금석 유약 벽돌 성채 바닥 및 황금 포장 도로
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.FARMLAND : TILE.MEADOW; // 비옥한 초승달 대추야자 농경지 및 공중정원 초원
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.OASIS_WATER : TILE.SAND; // 유프라테스 관개 운하 수로 및 황금 사막 모래
          }
          continue;
        }

        // 신성 불사조 솔 인빅투스 황금 바실리카 & 쌍두독수리 팔라티노 제국 전용 지형 카빙
        if (s.continent === 'sol_invictus') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 순백 대리석 포장 광장 및 황금 모자이크 보도
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.MEADOW : TILE.ELVEN_FOREST; // 성스러운 사이프러스 숲 & 황금빛 햇살 초원
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.OASIS_WATER : TILE.MEADOW; // 성스러운 대리석 분수대 연못 & 잔디
          }
          continue;
        }

        // 해저 화산 열수구 흑요석 레비아탄 요새 & 마그마 환초 제국 전용 지형 카빙
        if (s.continent === 'leviathan_trench') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.OBSIDIAN : TILE.CASTLE_FLOOR; // 칠흑의 흑요석 기단 및 굳은 마그마 암벽
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CORAL : TILE.CRYSTAL_CAVE; // 발광 산호초 군락 및 심해 수정동굴
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.OASIS_WATER : TILE.DEEP_WATER; // 청록빛 열수 웅덩이 및 심연 해구
          }
          continue;
        }

        // 태고 페르시아 페르세폴리스 만국의 문 & 영조 시무르그 불멸 제국 전용 지형 카빙
        if (s.continent === 'persepolis') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.ROAD; // 흑색 석회암 및 청록석 유약 기단 바닥
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.MEADOW : TILE.FARMLAND; // 석류와 장미의 페르시아 정원 초원 & 관개 오아시스 농원
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.OASIS_WATER : TILE.SAND; // 대리석 카나트 수로 연못 및 황금 사막 모래
          }
          continue;
        }

        // 태고 침몰 제국 레무리아 & 무 대륙의 산호 요새 전용 지형 카빙
        if (s.continent === 'lemuria') {
          if (dist <= landRad - 6) {
            tiles[idx(tx, ty)] = (dist <= 4) ? TILE.CASTLE_FLOOR : TILE.CRYSTAL_CAVE; // 심해 청옥 기단 및 에테르 수정 회랑 바닥
          } else if (dist <= landRad - 2) {
            tiles[idx(tx, ty)] = (dist % 2 === 0) ? TILE.CORAL : TILE.OBSIDIAN; // 발광 산호초 군락 및 굳은 심해 흑요석 암반
          } else if (dist <= landRad + 3) {
            tiles[idx(tx, ty)] = (dist % 3 === 0) ? TILE.OASIS_WATER : TILE.DEEP_WATER; // 청록빛 심해 산호 연못 및 대양 해구
          }
          continue;
        }

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
      buildings.push({ id: s.id + '_cabin', settlementId: s.id, name: '아늑한 통나무 오두막', type: 'cabin', x: sx - 7, y: sy + 2, w: 6, h: 5, icon: '🏡' });
      buildings.push({ id: s.id + '_market', settlementId: s.id, name: '특산물 가판대', type: 'market', x: sx + 6, y: sy + 1, w: 5, h: 4, icon: '🎪' });
      buildings.push({ id: s.id + '_well', settlementId: s.id, name: '석조 식수 우물', type: 'stone_well', x: sx - 2, y: sy + 3, w: 2, h: 2, icon: '💧' });
      buildings.push({ id: s.id + '_hay', settlementId: s.id, name: '황금 건초더미', type: 'hay_bale', x: sx - 4, y: sy + 7, w: 2, h: 2, icon: '🌾' });
      buildings.push({ id: s.id + '_anvil', settlementId: s.id, name: '마을 철제 모루', type: 'anvil', x: sx - 1, y: sy + 1, w: 2, h: 2, icon: '⚒️' });
      buildings.push({ id: s.id + '_camp', settlementId: s.id, name: '모닥불 & 통나무 스툴', type: 'campfire_stools', x: sx + 8, y: sy + 6, w: 3, h: 3, icon: '🔥' });
      buildings.push({ id: s.id + '_stump', settlementId: s.id, name: '나이테 통나무 밑동', type: 'tree_stump', x: sx + 7, y: sy + 2, w: 2, h: 2, icon: '🪵' });
      buildings.push({ id: s.id + '_log', settlementId: s.id, name: '쓰러진 목재', type: 'fallen_log', x: sx + 10, y: sy + 3, w: 3, h: 1, icon: '🪵' });
      buildings.push({ id: s.id + '_coop', settlementId: s.id, name: '목조 닭장 울타리', type: 'chicken_coop', x: sx + 5, y: sy - 4, w: 3, h: 3, icon: '🐔' });
      buildings.push({ id: s.id + '_sign', settlementId: s.id, name: '마을 방향 푯말', type: 'signpost', x: sx + 1, y: sy - 4, w: 1, h: 1, icon: '🪧' });
      for (let h = 0; h < 2; h++) {
        buildings.push({ id: s.id + '_house_' + h, settlementId: s.id, name: '민가 ' + (h + 1), type: 'house', x: sx + (h === 0 ? -6 : 6), y: sy + 8, w: 4, h: 4, icon: '🏠' });
      }
    }
  }

  settlements.forEach(s => addCompoundBuildings(s));
  buildings.forEach(b => {
    if (!b.continent && settlementMap[b.settlementId]) {
      b.continent = settlementMap[b.settlementId].continent;
    }
  });

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
    ['crystal_caverns', 'crystal_refinery'], ['dragon_ruins', 'obsidian_necropolis'],

    // [환영의 모래바다 신기루 제국 & 사구 캐러밴 비단길 (Mirage Silk Road)]
    ['mirage_sultan_palace_capital', 'djinn_sacred_oasis_font'],
    ['mirage_sultan_palace_capital', 'sandsea_caravan_bazaar_port'],
    ['mirage_sultan_palace_capital', 'ancient_pharaoh_pyramid_necropolis'],
    ['mirage_sultan_palace_capital', 'lapis_lazuli_gem_forge'],
    ['sandsea_caravan_bazaar_port', 'astral_dune_sphinx_monolith'],
    ['djinn_sacred_oasis_font', 'ancient_pharaoh_pyramid_necropolis'],

    // [천둥의 올림포스 판테온 & 신들의 황금 대로 (Olympus Divine Skyway)]
    ['olympus_zeus_throne_pantheon', 'titan_colosseum_grand_arena'],
    ['olympus_zeus_throne_pantheon', 'pegasus_aether_skydock_port'],
    ['olympus_zeus_throne_pantheon', 'hephaestus_divine_thunder_forge'],
    ['olympus_zeus_throne_pantheon', 'athena_wisdom_marble_academy'],
    ['titan_colosseum_grand_arena', 'delphi_prophecy_oracle_spring'],
    ['athena_wisdom_marble_academy', 'delphi_prophecy_oracle_spring'],

    // [태고 드워프 증기 요새 & 거신 마그마 제국 톱니 가도 (Steamforge Runic Railway)]
    ['steamforge_dwarven_high_throne', 'titan_magma_smelting_foundry'],
    ['steamforge_dwarven_high_throne', 'aether_geothermal_drill_port'],
    ['steamforge_dwarven_high_throne', 'runic_golem_assembly_sanctum'],
    ['titan_magma_smelting_foundry', 'mithril_deep_vein_quarry'],
    ['titan_magma_smelting_foundry', 'valkyrie_brazen_bull_altar'],
    ['mithril_deep_vein_quarry', 'valkyrie_brazen_bull_altar'],

    // [핏빛 장미의 고딕 뱀파이어 제국 안개 가도 (Gothic Blood Rose Highway)]
    ['gothic_blood_rose_cathedral_capital', 'vampire_moonlit_castlevania_keep'],
    ['gothic_blood_rose_cathedral_capital', 'nocturnal_shadow_fog_haven'],
    ['gothic_blood_rose_cathedral_capital', 'crypt_alchemist_blood_forge'],
    ['gothic_blood_rose_cathedral_capital', 'crimson_belfry_coven_shrine'],
    ['vampire_moonlit_castlevania_keep', 'weeping_willow_mausoleum'],
    ['crimson_belfry_coven_shrine', 'weeping_willow_mausoleum'],

    // [영롱한 프리즘 수정 제국 & 별빛 마나 성채 가도 (Prism Starlight Leyline Highway)]
    ['crystal_prism_zenith_capital', 'starlight_mana_spire_citadel'],
    ['crystal_prism_zenith_capital', 'prismatic_aurora_skydock_port'],
    ['crystal_prism_zenith_capital', 'astral_gem_alchemist_refinery'],
    ['crystal_prism_zenith_capital', 'diamond_constellation_oracle_shrine'],
    ['starlight_mana_spire_citadel', 'celestial_quartz_crystal_gardens'],
    ['diamond_constellation_oracle_shrine', 'celestial_quartz_crystal_gardens'],

    // [검은 깃발 해적 연합 & 크라켄 해골 요새 바닷길 항로 (Corsair Skull Sea Lane)]
    ['corsair_black_flagship_capital', 'kraken_abyssal_skull_citadel'],
    ['corsair_black_flagship_capital', 'tortuga_rum_bazaar_freeport'],
    ['corsair_black_flagship_capital', 'ghost_ship_armada_graveyard'],
    ['corsair_black_flagship_capital', 'siren_coral_lagoon_sanctuary'],
    ['kraken_abyssal_skull_citadel', 'smugglers_tide_cavern_haven'],
    ['siren_coral_lagoon_sanctuary', 'smugglers_tide_cavern_haven'],

    // [달빛 은룡 천공 신사 & 구미호 영혼 제국 신령 가도 (Spirit Shrine Dragon Way)]
    ['moonlit_silver_dragon_capital', 'kitsune_nine_tails_sacred_citadel'],
    ['moonlit_silver_dragon_capital', 'floating_lantern_tide_haven'],
    ['moonlit_silver_dragon_capital', 'celestial_bamboo_alchemist_refinery'],
    ['moonlit_silver_dragon_capital', 'wisteria_spirit_fox_shrine'],
    ['kitsune_nine_tails_sacred_citadel', 'thousand_lotus_mirror_grove'],
    ['wisteria_spirit_fox_shrine', 'thousand_lotus_mirror_grove'],

    // [태고 요정 숲 에메랄드 거목 성소 가도 (Emerald Fairy Grove Leyline Way)]
    ['elder_fairy_world_tree_capital', 'luminescent_spore_citadel'],
    ['elder_fairy_world_tree_capital', 'sylph_wind_canopy_skydock_port'],
    ['elder_fairy_world_tree_capital', 'pixie_alchemical_nectar_distillery'],
    ['elder_fairy_world_tree_capital', 'ancient_moss_monolith_shrine'],
    ['luminescent_spore_citadel', 'glowing_firefly_hollow_village'],
    ['ancient_moss_monolith_shrine', 'glowing_firefly_hollow_village'],

    // [태양신의 황금 제국 엘도라도 가도 (Golden Sun Serpent Leyline Highway)]
    ['el_dorado_golden_sun_pyramid_capital', 'quetzalcoatl_feathered_serpent_citadel'],
    ['el_dorado_golden_sun_pyramid_capital', 'golden_cenote_emerald_harbor'],
    ['el_dorado_golden_sun_pyramid_capital', 'obsidian_sun_disc_alchemist_forge'],
    ['el_dorado_golden_sun_pyramid_capital', 'solar_eclipse_monolith_shrine'],
    ['quetzalcoatl_feathered_serpent_citadel', 'jungle_golden_orchid_village'],
    ['solar_eclipse_monolith_shrine', 'jungle_golden_orchid_village'],

    // [혹한의 서리고룡 빙하 네크로폴리스 가도 (Permafrost Glacial Highway)]
    ['frost_wyrm_glacial_citadel', 'lich_king_frozen_throne_sanctum'],
    ['frost_wyrm_glacial_citadel', 'permafrost_mammoth_bone_haven'],
    ['frost_wyrm_glacial_citadel', 'aurora_borealis_valkyrie_shrine'],
    ['lich_king_frozen_throne_sanctum', 'rime_alchemist_cryo_laboratory'],
    ['permafrost_mammoth_bone_haven', 'sunken_iceberg_shipwreck_cove'],
    ['sunken_iceberg_shipwreck_cove', 'frost_wyrm_glacial_citadel'],
    ['permafrost_mammoth_bone_haven', 'pegasus_aether_skydock_port'],

    // [성좌의 천체 티탄 스타포지 가도 (Celestial Zodiac Starlight Highway)]
    ['starforge_titan_celestial_foundry', 'zodiac_armillary_astrolabe_observatory'],
    ['starforge_titan_celestial_foundry', 'supernova_plasma_crucible_haven'],
    ['starforge_titan_celestial_foundry', 'meteor_iron_artificer_village'],
    ['zodiac_armillary_astrolabe_observatory', 'stellar_prism_monolith_shrine'],
    ['supernova_plasma_crucible_haven', 'aether_starfall_cataract_harbor'],
    ['aether_starfall_cataract_harbor', 'meteor_iron_artificer_village'],
    ['supernova_plasma_crucible_haven', 'astral_void_gate'],

    // [태고 거인족 요툰하임 고원 가도 (Primeval Jötunheim Megalith Highway)]
    ['jotunheim_thunder_giant_citadel', 'rune_colossus_cyclopean_sanctum'],
    ['jotunheim_thunder_giant_citadel', 'cloud_frost_giant_crag_haven'],
    ['jotunheim_thunder_giant_citadel', 'ancient_dolmen_monolith_shrine'],
    ['rune_colossus_cyclopean_sanctum', 'ironwood_barbarian_clan_village'],
    ['mammoth_horn_sky_fjord_port', 'ironwood_barbarian_clan_village'],
    ['mammoth_horn_sky_fjord_port', 'jotunheim_thunder_giant_citadel'],
    ['ironwood_barbarian_clan_village', 'steamforge_dwarven_high_throne'],

    // [상그릴라 신선 비경 가도 (Shangri-La Celestial Jade Highway)]
    ['shangrila_nine_tier_jade_pagoda', 'thousand_lotus_yin_yang_sanctum'],
    ['shangrila_nine_tier_jade_pagoda', 'cloud_bamboo_hermit_retreat'],
    ['shangrila_nine_tier_jade_pagoda', 'flying_sword_alchemist_pavilion'],
    ['thousand_lotus_yin_yang_sanctum', 'misty_tea_terrace_mountain_village'],
    ['celestial_peach_spring_harbor', 'cloud_bamboo_hermit_retreat'],
    ['celestial_peach_spring_harbor', 'misty_tea_terrace_mountain_village'],
    ['cloud_bamboo_hermit_retreat', 'yggdrasil_fairy_haven'],

    // [태고 바빌론 에테메난키 지구라트 가도 (Babylon Fertile Crescent Highway)]
    ['babylon_etemenanki_ziggurat', 'ishtar_winged_lamassu_gate'],
    ['babylon_etemenanki_ziggurat', 'hanging_gardens_terrace_palace'],
    ['babylon_etemenanki_ziggurat', 'fertile_crescent_date_palm_oasis'],
    ['ishtar_winged_lamassu_gate', 'cuneiform_astronomer_ziggurat_observatory'],
    ['fertile_crescent_date_palm_oasis', 'euphrates_reed_boat_delta_harbor'],
    ['hanging_gardens_terrace_palace', 'euphrates_reed_boat_delta_harbor'],
    ['ishtar_winged_lamassu_gate', 'ancient_pharaoh_pyramid_necropolis'],

    // [신성 불사조 솔 인빅투스 황금 바실리카 가도 (Sol Invictus Imperial Sacred Highway)]
    ['sol_invictus_golden_basilica', 'phoenix_flame_aether_citadel'],
    ['sol_invictus_golden_basilica', 'solar_eagle_triumphal_colosseum'],
    ['sol_invictus_golden_basilica', 'augustus_marble_pantheon_temple'],
    ['sol_invictus_golden_basilica', 'byzantine_silk_mosaic_bazaar'],
    ['phoenix_flame_aether_citadel', 'golden_horn_imperial_naval_harbor'],
    ['byzantine_silk_mosaic_bazaar', 'golden_horn_imperial_naval_harbor'],
    ['augustus_marble_pantheon_temple', 'stellar_prism_monolith_shrine'],
    ['golden_horn_imperial_naval_harbor', 'dragon_ruins'],

    // [해저 화산 열수구 흑요석 레비아탄 가도 (Leviathan Hydrothermal Abyssal Highway)]
    ['leviathan_caldera_obsidian_citadel', 'hydrothermal_black_smoker_forge'],
    ['leviathan_caldera_obsidian_citadel', 'bioluminescent_siren_chasm_palace'],
    ['leviathan_caldera_obsidian_citadel', 'drowned_kraken_altar_sanctum'],
    ['leviathan_caldera_obsidian_citadel', 'phosphor_pearl_diver_atoll_village'],
    ['drowned_kraken_altar_sanctum', 'abyssal_trench_submarine_dock'],
    ['phosphor_pearl_diver_atoll_village', 'abyssal_trench_submarine_dock'],
    ['bioluminescent_siren_chasm_palace', 'siren_coral'],
    ['hydrothermal_black_smoker_forge', 'lava_worm_trench'],
    ['abyssal_trench_submarine_dock', 'atlantis_pearl_reef_harbor'],

    // [태고 페르시아 페르세폴리스 가도 (Persepolis Royal Road of Nations)]
    ['persepolis_apadana_citadel', 'gate_of_all_nations_gatehouse'],
    ['persepolis_apadana_citadel', 'simurgh_sacred_flame_sanctum'],
    ['persepolis_apadana_citadel', 'tachar_immortal_guard_fortress'],
    ['persepolis_apadana_citadel', 'turqoise_caravan_oasis_harbor'],
    ['tachar_immortal_guard_fortress', 'royal_cyrus_cylinder_treasury'],
    ['turqoise_caravan_oasis_harbor', 'royal_cyrus_cylinder_treasury'],
    ['gate_of_all_nations_gatehouse', 'sandsea_caravan_bazaar_port'],
    ['gate_of_all_nations_gatehouse', 'void_astral_dredge_dock'],
    ['simurgh_sacred_flame_sanctum', 'void_shadow_cloister'],

    // [태고 침몰 제국 레무리아 해로 및 심해 회랑 가도 (Lemuria Sunken Highway)]
    ['lemuria_sunken_jade_citadel', 'mu_crystal_pyramid_sanctum'],
    ['lemuria_sunken_jade_citadel', 'nautilus_shell_pearl_palace'],
    ['lemuria_sunken_jade_citadel', 'bioluminescent_angler_temple'],
    ['mu_crystal_pyramid_sanctum', 'golden_cenote_emerald_harbor'],
    ['nautilus_shell_pearl_palace', 'sunken_chitin_coral_diver_village'],
    ['bioluminescent_angler_temple', 'sunken_chitin_coral_diver_village'],
    ['bioluminescent_angler_temple', 'abyssal_trench_leviathan_wharf'],
    ['sunken_chitin_coral_diver_village', 'abyssal_trench_leviathan_wharf'],
    ['mu_crystal_pyramid_sanctum', 'obsidian_sun_disc_alchemist_forge']
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

  // 10. 🌲 [세계관 디테일 그래픽] 자연 식생 및 환경 소품 공간 그리드 생성 (High-Res Props & Spatial Chunks)
  const propChunks = {};
  const propList = [];

  function addWorldProp(px, py, propType) {
    if (!inBounds(px, py)) return;
    const tileIndex = idx(px, py);
    if (deco[tileIndex] !== 0) return; // 이미 건물이 있거나 배치된 곳 방지
    const t = tiles[tileIndex];
    if (t === TILE.WATER || t === TILE.DEEP_WATER || t === TILE.ROAD || t === TILE.BRIDGE || t === TILE.DOCK || t === TILE.WALL || t === TILE.LAVA) return;

    deco[tileIndex] = propType;
    const propItem = { x: px, y: py, type: propType };
    propList.push(propItem);

    const cx = Math.floor(px / 32);
    const cy = Math.floor(py / 32);
    const cKey = `${cx}_${cy}`;
    if (!propChunks[cKey]) propChunks[cKey] = [];
    propChunks[cKey].push(propItem);
  }

  // 바이옴별 고해상도 식생 분산 배치 (O(N) 초고속 분산 샘플링)
  for (let sy = 30; sy < WORLD_HEIGHT - 30; sy += 5) {
    for (let sx = 30; sx < WORLD_WIDTH - 30; sx += 5) {
      const jx = sx + ((sx * 17 + sy * 31) % 5);
      const jy = sy + ((sx * 23 + sy * 41) % 5);
      if (!inBounds(jx, jy)) continue;
      const t = tiles[idx(jx, jy)];
      const hash = (jx * 101 + jy * 47) & 255;

      if (t === TILE.FOREST) {
        if (hash < 140) {
          const sub = hash % 10;
          const pType = sub < 6 ? 1 : (sub < 8 ? 3 : (sub < 9 ? 13 : 4)); // 참나무, 자작나무, 산딸기, 그루터기
          addWorldProp(jx, jy, pType);
        }
      } else if (t === TILE.DARK_FOREST) {
        if (hash < 150) {
          const sub = hash % 10;
          const pType = sub < 7 ? 2 : (sub < 9 ? 8 : 5); // 침엽수, 고목, 통나무
          addWorldProp(jx, jy, pType);
        }
      } else if (t === TILE.ELVEN_FOREST) {
        if (hash < 130) {
          const pType = (hash % 10 < 7) ? 7 : 12; // 요정수, 발광 버섯
          addWorldProp(jx, jy, pType);
        }
      } else if (t === TILE.AUTUMN_WOOD) {
        if (hash < 140) {
          const pType = (hash % 10 < 8) ? 6 : 4; // 황금 단풍나무, 그루터기
          addWorldProp(jx, jy, pType);
        }
      } else if (t === TILE.SWAMP) {
        if (hash < 90) {
          const sub = hash % 10;
          const pType = sub < 5 ? 12 : (sub < 8 ? 8 : 5); // 발광 버섯, 고목, 통나무
          addWorldProp(jx, jy, pType);
        }
      } else if (t === TILE.MEADOW) {
        if (hash < 45) {
          const pType = (hash % 10 < 7) ? 13 : 1; // 산딸기 덤불, 드문 참나무
          addWorldProp(jx, jy, pType);
        }
      } else if (t === TILE.HILLS || t === TILE.BADLANDS) {
        if (hash < 25) {
          const pType = (hash % 10 < 5) ? 11 : 8; // 고대 석주 유적, 마른 고목
          addWorldProp(jx, jy, pType);
        }
      }
    }
  }

  // 11. 거점 인근 오솔길 낭만 모닥불 & 울타리 포인트 배치
  for (const s of settlements) {
    if (s.faction !== 'monster') {
      addWorldProp(s.x + 3, s.y + 2, 10); // 모닥불
      addWorldProp(s.x - 3, s.y + 3, 9);  // 목조 울타리
      addWorldProp(s.x + 4, s.y - 3, 9);
    }
  }

  const elapsed = (typeof performance !== 'undefined') ? (performance.now() - t0).toFixed(1) : (Date.now() - t0);
  console.log(`[WorldGenerator] 3840x2400 세계관 생성 완료: ${settlements.length}개 거점, ${buildings.length}개 복합 건축물, ${propList.length}개 정밀 환경소품, 소요시간: ${elapsed}ms`);

  return {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    tileSize: TILE_SIZE,
    tiles,
    deco,
    props: propList,
    propChunks,
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
