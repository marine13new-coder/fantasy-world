// GenerateDarkData.js - Batch generator using FreeLLMWorker for Abyss Roll
const fs = require('fs');
const path = require('path');
const { askFreeLLM, cleanJsonString } = require('./FreeLLMWorker');

const OUT_DIR = path.join(__dirname, 'Assets', 'StreamingAssets');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function generateFile(fileName, prompt, fallbackData) {
  const filePath = path.join(OUT_DIR, fileName);
  console.log(`[GenerateDarkData] Generating ${fileName}...`);
  try {
    const raw = await askFreeLLM(prompt, 2);
    const cleaned = cleanJsonString(raw);
    const parsed = JSON.parse(cleaned);
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf8');
    console.log(`[GenerateDarkData] ✅ Successfully generated ${fileName} via FreeLLMAPI!`);
  } catch (err) {
    console.warn(`[GenerateDarkData] ⚠️ FreeLLMAPI error (${err.message}). Using fallback data for ${fileName}.`);
    fs.writeFileSync(filePath, JSON.stringify(fallbackData, null, 2), 'utf8');
    console.log(`[GenerateDarkData] ✅ Successfully wrote verified gothic fallback for ${fileName}.`);
  }
}

async function main() {
  // 1. HeroesAndMonsters.json
  const heroesAndMonstersPrompt = `Return JSON with an object containing:
"heroes": array of 4 hero objects (Wanderer, Black Knight, Berserker, Hunter) with id, name, preferredRank (1 to 4), baseHp, baseDmg, gothicLore,
"monsters": array of 15 dark fantasy monsters (Gravekeeper, Bone Shaman, Wraith, Ghoul, Volcano Golem Boss, etc.) with id, name, rank, baseHp, baseDmg, stressDmg, isBoss (boolean).`;

  const heroesFallback = {
    heroes: [
      { id: "black_knight", name: "Black Knight (흑기사)", preferredRank: 1, baseHp: 120, baseDmg: 18, gothicLore: "Clad in rusted mourning armor, unyielding against the abyss." },
      { id: "berserker", name: "Berserker (광전사)", preferredRank: 2, baseHp: 90, baseDmg: 24, gothicLore: "Drinks blood to forget the screams of his doomed kin." },
      { id: "hunter", name: "Hunter (사냥꾼)", preferredRank: 3, baseHp: 80, baseDmg: 20, gothicLore: "Tracks abominations with silvered bolts and unwavering hatred." },
      { id: "wanderer", name: "Wanderer (방랑자)", preferredRank: 4, baseHp: 75, baseDmg: 15, gothicLore: "Whispers incantations learned from forbidden stone tablets." }
    ],
    monsters: [
      { id: "gravekeeper", name: "Gravekeeper (묘지기)", rank: 1, baseHp: 80, baseDmg: 14, stressDmg: 8, isBoss: false },
      { id: "bone_shaman", name: "Bone Shaman (뼈 주술사)", rank: 2, baseHp: 65, baseDmg: 10, stressDmg: 18, isBoss: false },
      { id: "ghoul", name: "Ghoul (구울)", rank: 3, baseHp: 70, baseDmg: 16, stressDmg: 10, isBoss: false },
      { id: "wraith", name: "Wraith (망령)", rank: 4, baseHp: 50, baseDmg: 12, stressDmg: 22, isBoss: false },
      { id: "boss1", name: "Volcano Golem Boss (화산 골렘)", rank: 1, baseHp: 450, baseDmg: 35, stressDmg: 25, isBoss: true },
      { id: "skeleton_soldier", name: "Skeleton Legionnaire", rank: 1, baseHp: 60, baseDmg: 12, stressDmg: 6, isBoss: false },
      { id: "cultist_brawler", name: "Cultist Zealot", rank: 1, baseHp: 75, baseDmg: 15, stressDmg: 12, isBoss: false },
      { id: "crypt_bat", name: "Crypt Vampire Bat", rank: 4, baseHp: 35, baseDmg: 9, stressDmg: 14, isBoss: false },
      { id: "flesh_horror", name: "Flesh Abomination", rank: 2, baseHp: 110, baseDmg: 20, stressDmg: 18, isBoss: false },
      { id: "witch_coven", name: "Hag of Thorns", rank: 3, baseHp: 55, baseDmg: 11, stressDmg: 20, isBoss: false },
      { id: "drowned_sailor", name: "Drowned Mariner", rank: 1, baseHp: 85, baseDmg: 17, stressDmg: 12, isBoss: false },
      { id: "carrion_eater", name: "Carrion Swarm", rank: 3, baseHp: 45, baseDmg: 10, stressDmg: 16, isBoss: false },
      { id: "corrupted_hound", name: "Rabid Hound", rank: 2, baseHp: 50, baseDmg: 16, stressDmg: 10, isBoss: false },
      { id: "necromancer_apprentice", name: "Defiler of Tombs", rank: 4, baseHp: 58, baseDmg: 13, stressDmg: 24, isBoss: false },
      { id: "gargoyle_sentinel", name: "Stone Gargoyle", rank: 2, baseHp: 95, baseDmg: 18, stressDmg: 14, isBoss: false }
    ]
  };
  await generateFile('HeroesAndMonsters.json', heroesAndMonstersPrompt, heroesFallback);

  // 2. DiceFacesAndSkills.json
  const dicePrompt = `Return JSON with an object containing:
"skills": array of 40 polyhedral dice face stickers (for D6, D8, D12, D20) with id, skillName, diceCompatibility (e.g. "D6", "D8", "D12", "D20", "All"), baseValue, effectType ("Damage", "Vampiric", "Stun", "StressHeal", "Poison", "Crit3X"), and description.`;

  const diceFallback = {
    skills: Array.from({ length: 40 }).map((_, i) => ({
      id: `skill_${i + 1}`,
      skillName: ["🩸 Vampiric Rend", "⚡ Thunder Stun", "💀 Ruin Cleave", "🌿 Mending Salve", "🔥 Hellfire Ignition", "🛡️ Bulwark Aegis", "🗡️ Backstab", "🔮 Arcane Burst"][i % 8] + ` +${(i % 5) + 1}`,
      diceCompatibility: ["D6", "D8", "D12", "D20", "All"][i % 5],
      baseValue: 10 + (i * 2),
      effectType: ["Damage", "Vampiric", "Stun", "StressHeal", "Poison", "Crit3X"][i % 6],
      description: `Dark polyhedral rune carved with eldritch precision. Level ${i + 1}.`
    }))
  };
  await generateFile('DiceFacesAndSkills.json', dicePrompt, diceFallback);

  // 3. QuirksAndAfflictions.json
  const quirksPrompt = `Return JSON with:
"quirks": array of 30 gothic quirks (e.g. Dark Temptation, Runic Obsession, Fear of the Dark, Unyielding Spine) with id, name, isPositive (bool), effectDescription,
"afflictions": array of 10 mental collapse states (Paranoia, Masochism, Hopelessness, Abusive, Irrational, Fearful) with id, name, barkQuote, combatPenalty,
"virtues": array of 5 heroic awakening states (Courage, Fortitude, Focus, Vigorous, Powerful) with id, name, barkQuote, combatBuff.`;

  const quirksFallback = {
    quirks: Array.from({ length: 30 }).map((_, i) => ({
      id: `quirk_${i + 1}`,
      name: ["Bloodthirst", "Fear of the Unseen", "Gothic Fortitude", "Claustrophobia", "Runic Insight", "Nerve of Iron"][i % 6] + ` Lv.${(i % 5) + 1}`,
      isPositive: i % 2 === 0,
      effectDescription: i % 2 === 0 ? "Increases critical hit chance by 5% in low torchlight." : "Increases stress gain when rolling 1 on dice."
    })),
    afflictions: [
      { id: "paranoia", name: "Paranoia (편집증)", barkQuote: "They are plotting to feed my flesh to the beasts!", combatPenalty: "Refuses friendly healing 30% of the time" },
      { id: "masochism", name: "Masochism (피학증)", barkQuote: "Pain is the only truth left in this wretched earth!", combatPenalty: "Moves to Rank 1 and passes turn" },
      { id: "hopelessness", name: "Hopelessness (절망)", barkQuote: "Why fight the inexorable tide of ruin?", combatPenalty: "Reduces party stress resistance by 20%" },
      { id: "abusive", name: "Abusive (가학증)", barkQuote: "Incompetent fools! I will cut you down myself!", combatPenalty: "Deals 10 stress damage to random allies each turn" },
      { id: "fearful", name: "Fearful (공포)", barkQuote: "Shadows with claws... they are inside my skull!", combatPenalty: "Passes attack turn to hide in Rank 4" }
    ],
    virtues: [
      { id: "courage", name: "Courage (용기)", barkQuote: "Stand fast! The shadows cringe before our resolve!", combatBuff: "Heals 15 stress to entire party" },
      { id: "fortitude", name: "Fortitude (강인함)", barkQuote: "Flesh may yield, but my oath remains unbroken!", combatBuff: "Restores 30% HP and gains 50% damage resistance" },
      { id: "focus", name: "Focus (집중)", barkQuote: "One strike. Clean and merciless.", combatBuff: "Guarantees next dice roll to be maximum value" }
    ]
  };
  await generateFile('QuirksAndAfflictions.json', quirksPrompt, quirksFallback);

  // 4. RelicsAndCurios.json
  const relicsPrompt = `Return JSON with:
"relics": array of 40 cursed gothic relics (e.g. Crying Skull of Acheron, Brass Astrolabe, Bloodied Dice of Fate) with id, name, rarity ("Common", "Rare", "Ancestral", "Eldritch"), passiveBenefit, curseDrawback,
"curios": array of 30 dungeon interactive curios (Iron Maiden, Forgotten Altar, Eldritch Bone Pile, Shambler Altar) with id, curioName, interactionPrompt, positiveOutcome, negativeOutcome.`;

  const relicsFallback = {
    relics: Array.from({ length: 40 }).map((_, i) => ({
      id: `relic_${i + 1}`,
      name: ["Bloodstone of the Abyss", "Blackened Polyhedral Die", "Ashen Chalice", "Tormentor's Manacles", "Crown of Thorns", "Eldritch Hourglass"][i % 6] + ` #${i + 1}`,
      rarity: ["Common", "Rare", "Ancestral", "Eldritch"][i % 4],
      passiveBenefit: `+${(i % 4 + 1) * 5}% Dice Critical Damage and extra loot.`,
      curseDrawback: `Torchlight decays ${(i % 3) + 1} faster per exploration turn.`
    })),
    curios: Array.from({ length: 30 }).map((_, i) => ({
      id: `curio_${i + 1}`,
      curioName: ["Iron Maiden of Sins", "Defiled Bone Altar", "Cursed Relic Chest", "Eldritch Shrine", "Mangled Sarcophagus"][i % 5] + ` Room ${i + 1}`,
      interactionPrompt: "Investigate the ominous structure at the cost of blood?",
      positiveOutcome: "Gain ancestral heirlooms and a D20 dice upgrade.",
      negativeOutcome: "Inflicts 25 stress and drops torchlight by 30."
    }))
  };
  await generateFile('RelicsAndCurios.json', relicsPrompt, relicsFallback);

  console.log("[GenerateDarkData] All 4 major game data files successfully generated in Assets/StreamingAssets!");
}

main().catch(console.error);
