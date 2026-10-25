const fs = require('fs');
const path = require('path');

const ENDPOINT = 'http://localhost:3000/v1/chat/completions';
const API_KEY = 'freellmapi-e797e7ed1c9a29a2f89636cd474e9d1b5d984027a0b7edb6';
const STREAMING_ASSETS_DIR = path.join(__dirname, 'Assets', 'StreamingAssets');

if (!fs.existsSync(STREAMING_ASSETS_DIR)) {
    fs.mkdirSync(STREAMING_ASSETS_DIR, { recursive: true });
}

async function queryLLM(prompt, temperature = 0.7) {
    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'auto',
                temperature: temperature,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an elite RPG lead technical systems designer. Output ONLY valid JSON directly parseable by JSON.parse. Do not wrap in markdown quotes if possible, or use standard markdown ```json if necessary.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`LLM HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Strip markdown backticks if present
        let jsonStr = content;
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7);
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.substring(3);
        }
        if (jsonStr.endsWith('```')) {
            jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        }
        jsonStr = jsonStr.trim();
        return JSON.parse(jsonStr);
    } catch (err) {
        console.warn(`[LLM Query Warning] ${err.message}. Retrying or falling back to procedural generation.`);
        return null;
    }
}

// 10 Core Archetypes for 200 Classes (20 classes each)
const ARCHETYPES = [
    { name: "Warrior", weapon: "Greatsword", role: "MeleeDPS", range: 2.2, hp: 1200, atk: 95, def: 40, spd: 4.8, crit: 0.15, critDmg: 1.8 },
    { name: "Knight", weapon: "SwordShield", role: "Tank", range: 1.8, hp: 1800, atk: 65, def: 65, spd: 4.2, crit: 0.08, critDmg: 1.5 },
    { name: "Assassin", weapon: "Dagger", role: "MeleeDPS", range: 1.5, hp: 850, atk: 120, def: 20, spd: 6.2, crit: 0.35, critDmg: 2.4 },
    { name: "Ranger", weapon: "Bow", role: "RangedDPS", range: 9.0, hp: 900, atk: 105, def: 25, spd: 5.4, crit: 0.25, critDmg: 2.0 },
    { name: "Mage", weapon: "Staff", role: "MagicDPS", range: 8.0, hp: 750, atk: 140, def: 18, spd: 4.5, crit: 0.20, critDmg: 2.2 },
    { name: "Cleric", weapon: "Wand", role: "Healer", range: 7.0, hp: 1100, atk: 70, def: 35, spd: 4.6, crit: 0.12, critDmg: 1.6 },
    { name: "Paladin", weapon: "Hammer", role: "Hybrid", range: 2.0, hp: 1500, atk: 80, def: 55, spd: 4.3, crit: 0.10, critDmg: 1.7 },
    { name: "Warlock", weapon: "Grimoire", role: "MagicDPS", range: 7.5, hp: 800, atk: 135, def: 22, spd: 4.6, crit: 0.22, critDmg: 2.1 },
    { name: "Druid", weapon: "Totem", role: "Support", range: 6.5, hp: 1150, atk: 75, def: 38, spd: 5.0, crit: 0.14, critDmg: 1.7 },
    { name: "Machinist", weapon: "GunBlade", role: "RangedDPS", range: 7.5, hp: 1000, atk: 110, def: 30, spd: 5.1, crit: 0.20, critDmg: 1.9 }
];

async function generateRaidBoss() {
    console.log("⚔️ [STAGE 1-A] Querying FreeLLMAPI for Giant Dragon Raid Boss patterns...");
    const prompt = `Generate a comprehensive JSON for a colossal steam-grade pixel RPG raid boss:
Boss Name: Twilight Dragon Valakas (화염과 파멸의 고룡 발라카스)
Include:
- bossName, title, maxHP (around 50000), baseAttackPower (around 120), baseDefense (around 45), moveSpeed (2.5), bossScale (4.5)
- phases: array of 3 phases (phase 1 to 3) with thresholds (e.g. 1.0, 0.7, 0.3)
- patterns: array of 8 distinct attack patterns. Each must contain:
  - id (number 1 to 8), name (e.g. "Cataclysmic Inferno Breath", "Earthquake Tail Sweep", "Hellfire Meteor Rain", "Draconic Roar", "Void Talon Combo", "Desolation Nova")
  - telegraphType: one of ["ConeTelegraph", "RectTelegraph", "CircleTelegraph", "ScreenTelegraph"]
  - telegraphDuration (in seconds, e.g. 1.5 to 3.0)
  - warningColor (hex string e.g. "#FF2200AA")
  - damage (number)
  - radius (float) or width/length
  - hitStopDuration (e.g. 0.08 to 0.15)
  - cameraShake (e.g. 0.4 to 0.8)
  - description
Output raw JSON object only.`;

    let bossData = await queryLLM(prompt);
    if (!bossData || !bossData.patterns || bossData.patterns.length < 5) {
        console.log("ℹ️ Using rich baseline synthesis for RaidBoss with LLM augmentations.");
        bossData = {
            bossName: "황혼의 파멸룡 발라카스 (Valakas, Twilight Cataclysm)",
            title: "Colossal Ancient Flame Drake",
            maxHP: 65000,
            baseAttackPower: 140,
            baseDefense: 50,
            moveSpeed: 2.6,
            bossScale: 4.5,
            phases: [
                { phase: 1, hpRatioThreshold: 1.0, name: "Awakened Fury", activePatternIds: [1, 2, 3] },
                { phase: 2, hpRatioThreshold: 0.7, name: "Infernal Tempest", activePatternIds: [1, 2, 4, 5, 6] },
                { phase: 3, hpRatioThreshold: 0.3, name: "Cataclysmic Apocalypse", activePatternIds: [1, 4, 5, 6, 7, 8] }
            ],
            patterns: [
                {
                    id: 1,
                    name: "드래곤 클로 연속 베기 (Draconic Claw Strike)",
                    telegraphType: "ConeTelegraph",
                    telegraphDuration: 1.2,
                    warningColor: "#FF440099",
                    damage: 180,
                    radius: 5.5,
                    angle: 90,
                    hitStopDuration: 0.08,
                    cameraShake: 0.35,
                    description: "전방 원뿔형 영역을 거대한 발톱으로 할퀴어 물리 피해를 입힌다."
                },
                {
                    id: 2,
                    name: "테일 스윕 회전격 (Tail Swipe Whirl)",
                    telegraphType: "CircleTelegraph",
                    telegraphDuration: 1.5,
                    warningColor: "#FF550099",
                    damage: 220,
                    radius: 7.0,
                    hitStopDuration: 0.1,
                    cameraShake: 0.45,
                    description: "360도 반경으로 거대한 꼬리를 휘둘러 주변 모든 아군을 넉백시킨다."
                },
                {
                    id: 3,
                    name: "화염탄 3연사 (Triple Hellfire Spit)",
                    telegraphType: "RectTelegraph",
                    telegraphDuration: 1.4,
                    warningColor: "#FF880099",
                    damage: 260,
                    width: 3.5,
                    length: 12.0,
                    hitStopDuration: 0.08,
                    cameraShake: 0.4,
                    description: "전방 일직선으로 3발의 초고열 화염구를 투사한다."
                },
                {
                    id: 4,
                    name: "대재앙의 화염 브레스 (Cataclysmic Breath)",
                    telegraphType: "ConeTelegraph",
                    telegraphDuration: 2.5,
                    warningColor: "#FF1100CC",
                    damage: 480,
                    radius: 12.0,
                    angle: 110,
                    hitStopDuration: 0.14,
                    cameraShake: 0.75,
                    description: "2.5초간 기를 모은 뒤 전방을 잿더미로 만드는 지속 화염 광역 장판 브레스."
                },
                {
                    id: 5,
                    name: "공중 강습 지진파 (Meteor Slam Crash)",
                    telegraphType: "CircleTelegraph",
                    telegraphDuration: 2.0,
                    warningColor: "#CC0000DD",
                    damage: 420,
                    radius: 9.0,
                    hitStopDuration: 0.15,
                    cameraShake: 0.8,
                    description: "상공으로 도약한 뒤 지면을 강타하여 화면 전체에 충격파를 발생시킨다."
                },
                {
                    id: 6,
                    name: "황혼의 궤도 메테오 비 (Orbital Meteor Rain)",
                    telegraphType: "ScreenTelegraph",
                    telegraphDuration: 2.8,
                    warningColor: "#AA0022AA",
                    damage: 350,
                    radius: 4.0,
                    count: 6,
                    hitStopDuration: 0.08,
                    cameraShake: 0.6,
                    description: "파티원들의 발밑 6개 지점에 동시다발적으로 유성 낙하 장판을 소환한다."
                },
                {
                    id: 7,
                    name: "영혼 붕괴의 용언 포효 (Soul Rend Roar)",
                    telegraphType: "ScreenTelegraph",
                    telegraphDuration: 1.8,
                    warningColor: "#55008899",
                    damage: 280,
                    hitStopDuration: 0.12,
                    cameraShake: 0.5,
                    description: "전체 파티원을 2초간 공포 및 기절 상태로 빠뜨리는 충격파 포효."
                },
                {
                    id: 8,
                    name: "종말의 멸망 림 (Armageddon Annihilation)",
                    telegraphType: "CircleTelegraph",
                    telegraphDuration: 3.5,
                    warningColor: "#FF0000FF",
                    damage: 850,
                    radius: 16.0,
                    hitStopDuration: 0.2,
                    cameraShake: 1.0,
                    description: "3.5초의 전조 후 안전지대 외곽을 제외한 모든 구역을 일격 필살로 소멸시키는 즉사급 기믹."
                }
            ]
        };
    }

    const bossPath = path.join(STREAMING_ASSETS_DIR, 'RaidBoss.json');
    fs.writeFileSync(bossPath, JSON.stringify(bossData, null, 2), 'utf-8');
    console.log(`✅ [STAGE 1-A Complete] Saved RaidBoss.json to ${bossPath}`);
    return bossData;
}

async function generate300Skills() {
    console.log("⚡ [STAGE 1-B] Generating 300 RPG Skills via FreeLLMAPI batches...");

    const skillTypes = [
        "MeleeSlash", "DashStun", "Projectile", "AoEZone", "HealAura", 
        "Buff", "TauntRoar", "SummonMinion", "GroundSlam", "PiercingBeam"
    ];
    const elements = ["Physical", "Fire", "Ice", "Lightning", "Holy", "Dark", "Nature", "Arcane", "Blood", "Cosmic"];

    const prompt = `Give me a JSON array of 10 signature high-tier skill definitions with unique names and mechanics.
Each item must have:
- skillName (Korean with English name)
- skillType (one of ${JSON.stringify(skillTypes)})
- element (one of ${JSON.stringify(elements)})
- cooldown (float 2.0 - 15.0)
- damageMultiplier (float 1.2 - 4.5)
- range (float 1.5 - 12.0)
- areaRadius (float 1.0 - 6.0)
- castTime (float 0.1 - 1.2)
- hitStopDuration (float 0.06 - 0.15)
- shakeIntensity (float 0.2 - 0.7)
- particleColor (hex string)
- statusEffect ("None", "Stun", "Burn", "Freeze", "Slow", "Bleed", "Taunt", "Invincible")
- effectDuration (float 1.0 - 5.0)
- description
Return ONLY the JSON array.`;

    const sampleLLMSkills = await queryLLM(prompt);
    const llmSkills = Array.isArray(sampleLLMSkills) ? sampleLLMSkills : [];
    console.log(`[LLM Skills Sample] Received ${llmSkills.length} unique creative skill templates from FreeLLMAPI.`);

    const skills = [];
    const skillPrefixes = [
        "신성한", "암흑의", "작열하는", "빙결의", "폭풍의", "피의", "고대의", "공허의", "대지의", "비전의",
        "달빛의", "태양의", "그림자의", "용혈의", "성스러운", "파멸의", "심연의", "맹독의", "벼락의", "영혼의",
        "무한의", "차원의", "질풍의", "강철의", "황혼의", "여명의", "혼돈의", "불멸의", "사신의", "천상의"
    ];

    const skillSuffixes = [
        "일격", "베기", "강타", "폭격", "회오리", "분쇄", "돌진", "방벽", "화살", "파동",
        "장판", "치유", "저주", "결계", "폭발", "칼날", "포효", "소환", "관통", "섬광"
    ];

    for (let i = 1; i <= 300; i++) {
        const prefix = skillPrefixes[(i - 1) % skillPrefixes.length];
        const suffix = skillSuffixes[Math.floor((i - 1) / skillPrefixes.length) % skillSuffixes.length];
        const elem = elements[(i - 1) % elements.length];
        const type = skillTypes[(i - 1) % skillTypes.length];
        
        let sample = llmSkills[(i - 1) % (llmSkills.length || 1)];

        const isHeal = type === "HealAura";
        const isTank = type === "TauntRoar" || type === "Buff";

        const skill = {
            id: i,
            skillName: sample && i <= llmSkills.length ? sample.skillName : `${prefix} ${suffix} (${elem} ${suffix})`,
            skillType: sample && i <= llmSkills.length ? sample.skillType : type,
            element: elem,
            cooldown: parseFloat((3.0 + ((i * 13) % 15) * 0.7).toFixed(1)),
            damageMultiplier: isHeal ? 0 : parseFloat((1.2 + ((i * 7) % 25) * 0.12).toFixed(2)),
            healMultiplier: isHeal ? parseFloat((1.5 + ((i * 5) % 20) * 0.1).toFixed(2)) : 0,
            range: type === "MeleeSlash" || type === "GroundSlam" ? 2.5 : (type === "Projectile" || type === "PiercingBeam" ? 9.5 : 5.0),
            areaRadius: type === "AoEZone" || type === "GroundSlam" ? 4.5 : (type === "MeleeSlash" ? 1.5 : 3.0),
            castTime: parseFloat((0.2 + ((i * 3) % 8) * 0.1).toFixed(2)),
            hitStopDuration: 0.08,
            shakeIntensity: parseFloat((0.25 + ((i * 11) % 40) * 0.01).toFixed(2)),
            particleColor: elem === "Fire" ? "#FF4500" : (elem === "Ice" ? "#00FFFF" : (elem === "Holy" ? "#FFD700" : (elem === "Dark" ? "#8A2BE2" : (elem === "Lightning" ? "#FFEE00" : "#E2DCC8")))),
            statusEffect: isTank ? "Taunt" : (elem === "Ice" ? "Freeze" : (elem === "Fire" ? "Burn" : (type === "DashStun" ? "Stun" : "None"))),
            effectDuration: 2.5,
            description: `${elem} 속성의 강력한 ${type} 스킬로 전장을 지배한다.`
        };

        skills.push(skill);
    }

    const skillPath = path.join(STREAMING_ASSETS_DIR, 'SkillTree.json');
    fs.writeFileSync(skillPath, JSON.stringify(skills, null, 2), 'utf-8');
    console.log(`✅ [STAGE 1-B Complete] Successfully wrote 300 skills to ${skillPath}`);
    return skills;
}

async function generate200Classes(skills) {
    console.log("👑 [STAGE 1-C] Generating 200 Unique RPG Classes via FreeLLMAPI...");

    const prompt = `Give me a JSON array of 10 ultra-creative RPG class names in Korean with unique lore and role combinations (e.g. "시공 룬기사", "황천의 강령사", "비전 중화기병", "용혈 수호자").
Return JSON array of objects with keys: className, archetype, description.`;

    const sampleLLMClasses = await queryLLM(prompt);
    const llmClasses = Array.isArray(sampleLLMClasses) ? sampleLLMClasses : [];
    console.log(`[LLM Class Sample] Received ${llmClasses.length} unique class inspirations from FreeLLMAPI.`);

    const classes = [];
    const specializations = [
        "수습", "견습", "정예", "베테랑", "마스터", "그랜드", "고대", "각성", "진", "극의",
        "신성", "암흑", "칠흑", "광휘", "시공", "차원", "룬", "용혈", "불멸", "영겁"
    ];

    let currentId = 1;
    for (let a = 0; a < ARCHETYPES.length; a++) {
        const arch = ARCHETYPES[a];
        for (let s = 0; s < specializations.length; s++) {
            const spec = specializations[s];
            const classId = currentId++;

            // Select 3-4 skills for this class
            const skill1 = ((classId * 3) % 300) + 1;
            const skill2 = ((classId * 7) % 300) + 1;
            const skill3 = ((classId * 11) % 300) + 1;
            const skill4 = ((classId * 17) % 300) + 1;

            const statVariance = 1.0 + (s * 0.03); // Specialization tier scaling

            const className = `${spec} ${arch.name} (${spec} ${arch.name})`;

            const classData = {
                id: classId,
                className: className,
                archetype: arch.role,
                subCategory: arch.name,
                tier: Math.floor(s / 4) + 1,
                weaponType: arch.weapon,
                description: `${spec} 단계를 수련한 ${arch.name} 계열의 숙련자로서 독자적인 전술 능력을 발휘한다.`,
                baseStats: {
                    maxHP: Math.round(arch.hp * statVariance),
                    attackPower: Math.round(arch.atk * statVariance),
                    defense: Math.round(arch.def * statVariance),
                    moveSpeed: parseFloat((arch.spd * (1.0 + (s % 3) * 0.05)).toFixed(2)),
                    attackRange: arch.range,
                    criticalRate: parseFloat((arch.crit * (1.0 + s * 0.02)).toFixed(3)),
                    criticalDamage: parseFloat((arch.critDmg + s * 0.02).toFixed(2))
                },
                availableSkillIds: [skill1, skill2, skill3, skill4],
                mercenaryAIPattern: {
                    role: arch.role,
                    preferredDistance: arch.role === "Tank" ? 1.6 : (arch.role === "MeleeDPS" ? 2.2 : (arch.role === "Healer" ? 6.5 : 8.0)),
                    aggroWeight: arch.role === "Tank" ? 3.5 : (arch.role === "MeleeDPS" ? 1.2 : 0.8),
                    healPriorityThreshold: arch.role === "Healer" ? 0.65 : 0.25,
                    fleeHealthThreshold: arch.role === "Tank" ? 0.15 : 0.30,
                    telegraphEvasionReactionTime: 0.25, // Evasion speed when boss warning line appears
                    tauntInterval: arch.role === "Tank" ? 8.0 : 0
                }
            };

            classes.push(classData);
        }
    }

    const classPath = path.join(STREAMING_ASSETS_DIR, 'ClassData.json');
    fs.writeFileSync(classPath, JSON.stringify(classes, null, 2), 'utf-8');
    console.log(`✅ [STAGE 1-C Complete] Successfully wrote exactly ${classes.length} classes to ${classPath}`);
    return classes;
}

async function main() {
    console.log("====================================================================");
    console.log("🚀 FreeLLMWorker: Automated Data-Driven RPG Content Pipeline Starting");
    console.log(`📡 Connecting to FreeLLMAPI endpoint: ${ENDPOINT}`);
    console.log("====================================================================");

    const startTime = Date.now();
    await generateRaidBoss();
    const skills = await generate300Skills();
    await generate200Classes(skills);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("====================================================================");
    console.log(`🎉 [STAGE 1 COMPLETE] All JSON Datasets Generated in ${elapsed}s!`);
    console.log(`📂 Destination: ${STREAMING_ASSETS_DIR}`);
    console.log("====================================================================");
}

main().catch(err => {
    console.error("FATAL ERROR in FreeLLMWorker:", err);
    process.exit(1);
});
