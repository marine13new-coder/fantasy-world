const fs = require('fs');
const path = require('path');

const classes = JSON.parse(fs.readFileSync('SeamlessPixelRPG/Assets/StreamingAssets/ClassData.json', 'utf8'));
const skills = JSON.parse(fs.readFileSync('SeamlessPixelRPG/Assets/StreamingAssets/SkillTree.json', 'utf8'));
const boss = JSON.parse(fs.readFileSync('SeamlessPixelRPG/Assets/StreamingAssets/RaidBoss.json', 'utf8'));
const nemesis = JSON.parse(fs.readFileSync('SeamlessPixelRPG/Assets/StreamingAssets/NemesisData.json', 'utf8'));
const weather = JSON.parse(fs.readFileSync('SeamlessPixelRPG/Assets/StreamingAssets/WeatherSynergy.json', 'utf8'));
const town = JSON.parse(fs.readFileSync('SeamlessPixelRPG/Assets/StreamingAssets/TownCrafting.json', 'utf8'));
const rift = JSON.parse(fs.readFileSync('SeamlessPixelRPG/Assets/StreamingAssets/RiftChimera.json', 'utf8'));

const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>Seamless Open-World Pixel RPG - Steam Master Edition</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
  body {
    background-color: #030406;
    color: #e2dcc8;
    font-family: 'Consolas', 'Courier New', monospace;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
  }
  #gameContainer {
    position: relative;
    width: 1260px;
    height: 760px;
    max-width: 98vw;
    max-height: 96vh;
    aspect-ratio: 1260 / 760;
    background: #08090d;
    border: 3px solid #55442b;
    box-shadow: 0 0 60px rgba(0,0,0,0.98), 0 0 25px rgba(214, 48, 49, 0.4);
    overflow: hidden;
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
  .hud-panel {
    position: absolute;
    background: linear-gradient(180deg, rgba(16, 18, 26, 0.94), rgba(8, 9, 14, 0.96));
    border: 2px solid #6b5536;
    padding: 10px 14px;
    border-radius: 4px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.9), inset 0 0 8px rgba(197, 160, 89, 0.15);
    pointer-events: auto;
  }
  #playerHUD { top: 12px; left: 12px; width: 340px; }
  #bossHUD { top: 12px; left: 50%; transform: translateX(-50%); width: 530px; text-align: center; }
  #partyHUD { top: 12px; right: 12px; width: 310px; }
  #weatherNemesisHUD { top: 220px; right: 12px; width: 310px; }
  #inventoryHUD { bottom: 48px; right: 12px; width: 310px; padding: 8px 12px; }
  #guideHUD {
    bottom: 10px; left: 12px; right: 12px;
    text-align: center; font-size: 13px; color: #ffd32a;
    padding: 7px; letter-spacing: 0.5px;
    border-color: #7d5a2d;
  }
  .bar-container {
    width: 100%; height: 15px; background: #14171d;
    border: 1px solid #4a3e2a; border-radius: 2px;
    margin: 4px 0 8px 0; overflow: hidden; position: relative;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
  }
  .bar-fill { height: 100%; transition: width 0.1s linear; }
  .hp-fill { background: linear-gradient(90deg, #10ac84, #1dd1a1); }
  .boss-hp-fill { background: linear-gradient(90deg, #b71515, #ff3838); }
  .bar-text {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    font-size: 10px; font-weight: bold; display: flex;
    align-items: center; justify-content: center; color: #fff;
    text-shadow: 1px 1px 3px #000;
  }
  .class-title { font-size: 14px; font-weight: bold; color: #ffd32a; margin-bottom: 2px; text-shadow: 0 0 6px rgba(255, 211, 42, 0.4); }
  .btn-row { display: flex; gap: 5px; margin-top: 6px; }
  .game-btn {
    flex: 1; background: linear-gradient(180deg, #3d2f1c, #22190d); border: 1px solid #c5a059;
    color: #f5f0dc; padding: 5px 6px; font-size: 11px;
    cursor: pointer; font-family: inherit; font-weight: bold;
    border-radius: 3px; transition: all 0.15s;
    box-shadow: 0 2px 5px rgba(0,0,0,0.6);
  }
  .game-btn:hover { background: #5a4427; color: #fff; border-color: #ffd700; transform: translateY(-1px); }
  .game-btn:active { transform: translateY(1px); }
  .skill-slot { font-size: 11px; margin: 3px 0; display: flex; justify-content: space-between; color: #d0c8b0; }
  .skill-ready { color: #2ed573; font-weight: bold; text-shadow: 0 0 4px #2ed573; }
  .skill-cd { color: #ff6b6b; }
  .merc-item { font-size: 11px; margin-bottom: 6px; border-bottom: 1px dashed #3a2e1d; padding-bottom: 4px; }
  .telegraph-warning {
    position: absolute; top: 96px; left: 50%;
    transform: translateX(-50%); color: #ff3838; font-size: 21px;
    font-weight: bold; text-shadow: 0 0 12px #ff0000; display: none;
    animation: blink 0.2s infinite alternate;
  }
  @keyframes blink { from { opacity: 0.25; } to { opacity: 1; } }
</style>
</head>
<body>

<div id="gameContainer">
  <canvas id="gameCanvas" width="1260" height="760"></canvas>

  <div id="playerHUD" class="hud-panel">
    <div class="class-title" id="playerClassName">👑 CLASS: 수습 Warrior</div>
    <div style="font-size: 11px; color: #b2bec3;" id="playerArchetype">Role: MeleeDPS | Weapon: Greatsword</div>
    <div class="bar-container">
      <div class="bar-fill hp-fill" id="playerHPBar" style="width: 100%;"></div>
      <div class="bar-text" id="playerHPText">1200 / 1200</div>
    </div>
    <div style="font-size: 11px; color: #c5a059;">Class ID: <span id="classIdSpan">1</span> / 200 (Hot-Swap: [ / ] / Tab)</div>
    <div class="btn-row">
      <button class="game-btn" onclick="prevClass()">◀ Prev</button>
      <button class="game-btn" onclick="nextClass()">Next ▶</button>
      <button class="game-btn" onclick="randomClass()">🎲 Random</button>
      <button class="game-btn" style="border-color:#ff00ff; color:#ff9ff3;" onclick="triggerChimera()">🌀 Chimera</button>
    </div>
    <div style="font-size: 11px; font-weight: bold; color: #c5a059; margin-top: 6px;">ACTIVE SKILLS (Weather Synergized):</div>
    <div id="skillSlotList"></div>
    <div style="font-size: 11px; margin-top:5px; display:flex; justify-content:space-between; border-top:1px dashed #3a2e1d; padding-top:4px;">
      <span>💨 <strong id="dashStatusText" style="color:#2ed573;">[Space] 회피 가능</strong></span>
      <span>🧪 <strong id="potionCountText" style="color:#2ed573;">[H] 물약: 3/3</strong></span>
    </div>
    <div class="btn-row" style="margin-top:6px;">
      <button class="game-btn" id="townUpgradeBtn" style="background:#222f3e;" onclick="upgradeTown()">🏛️ [영지 재건] 룬대장간 T2 해금</button>
      <button class="game-btn" style="background:#2c3e50; max-width:80px;" id="audioToggleBtn" onclick="toggleAudio()">🔊 SOUND</button>
    </div>
  </div>

  <div id="bossHUD" class="hud-panel">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="font-size: 15px; font-weight: bold; color: #ff4757; text-shadow: 0 0 8px #ff4757; flex:1;" id="bossName">⚔️ 황혼의 파멸룡 발라카스 - PHASE 1 ⚔️</div>
      <button class="game-btn" style="max-width:110px; padding:3px 6px; font-size:10px; background:#4a0808;" onclick="reSummonBoss()">⚔️ 보스 재소환</button>
    </div>
    <div class="bar-container" style="height: 18px; margin-top: 6px;">
      <div class="bar-fill boss-hp-fill" id="bossHPBar" style="width: 100%;"></div>
      <div class="bar-text" id="bossHPText">65000 / 65000 (100%)</div>
    </div>
  </div>

  <div id="telegraphWarning" class="telegraph-warning">⚠️ MASSIVE TELEGRAPH WARNING! EVADE! ⚠️</div>

  <div id="partyHUD" class="hud-panel">
    <div style="font-size: 13px; font-weight: bold; color: #ffd32a; margin-bottom: 4px;">🛡️ MERCENARY PARTY (3 SLOTS)</div>
    <div id="mercPartyList"></div>
    <div style="font-size:10px; color:#c5a059; margin-top:5px; border-top:1px dashed #443725; padding-top:4px;">전술 지휘: [1] 일점사 | [2] 수호방벽 | [3] 산개</div>
    <div class="btn-row" style="margin-top:4px;">
      <button class="game-btn" onclick="orderMercenaries('focus')">⚔️ [1] 집중</button>
      <button class="game-btn" onclick="orderMercenaries('guard')">🛡️ [2] 방벽</button>
      <button class="game-btn" onclick="orderMercenaries('scatter')">💨 [3] 산개</button>
    </div>
  </div>

  <div id="weatherNemesisHUD" class="hud-panel">
    <div style="font-size: 12px; font-weight: bold; color: #00d2d3;" id="weatherTitle">🌦️ WEATHER: Heavy Rain</div>
    <div style="font-size: 10px; color: #c8d6e5; margin-bottom: 6px;" id="weatherDesc">화염 대미지 50% 반감, 번개 전도 및 빙결 범위 45% 증가</div>
    <div style="border-top: 1px dashed #443725; padding-top: 4px;">
      <div style="font-size: 11px; font-weight: bold; color: #ff6b6b;">💀 NEMESIS & GRUDGE:</div>
      <div style="font-size: 10px; color: #ff9ff3;" id="nemesisStatusText">추적 중: 영혼 분쇄자 (장비 강탈 대기)</div>
    </div>
    <div class="btn-row">
      <button class="game-btn" onclick="toggleWeather()">🌦️ 날씨 전환</button>
      <button class="game-btn" onclick="triggerMercenaryBetrayal()">🗡️ 용병 난입</button>
      <button class="game-btn" id="riftZoneBtn" style="border-color:#a29bfe; color:#dcdde1; background:#341f97;" onclick="interactRift()">🌀 [F] 균열 진입</button>
    </div>
  </div>

  <div id="inventoryHUD" class="hud-panel">
    <div style="font-size: 11px; font-weight: bold; color: #ffd32a; margin-bottom: 4px;">💰 LOOT & ENHANCE (Persistent):</div>
    <div style="font-size: 10px; color: #dcdde1; display:flex; justify-content:space-between;">
      <span>🪙 <strong id="goldCount" style="color:#ffd32a;">1200</strong></span>
      <span>💎 <strong id="gemCount" style="color:#54a0ff;">15</strong></span>
      <span>🐉 <strong id="scaleCount" style="color:#ff6b6b;">5</strong></span>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; border-top:1px dashed #443725; padding-top:4px;">
      <span id="weaponLevelText" style="font-size:10px; font-weight:bold; color:#00f2fe;">+0 룬 대검</span>
      <button class="game-btn" style="max-width:115px; padding:3px 6px; font-size:10px; background:#4b3820;" onclick="upgradeEquipment()">⚔️ 장비 제련(+25%)</button>
    </div>
  </div>

  <div id="guideHUD" class="hud-panel">
    🕹️ <strong>컨트롤:</strong> [WASD] 이동 | [Space] 무적 회피 | [마우스 조준 & 좌클릭 3단 콤보] | [Q/E/R] 날씨 스킬 | [H] 물약 (+45% HP) | [1/2/3] 용병 지휘 | [F] 차원 균열 | [Tab] 200 직업
  </div>
</div>

<script>
const CLASSDATA = ${JSON.stringify(classes)};
const SKILLDATA = ${JSON.stringify(skills)};
const BOSSDATA = ${JSON.stringify(boss)};
const NEMESISDATA = ${JSON.stringify(nemesis)};
const WEATHERDATA = ${JSON.stringify(weather)};
const TOWNDATA = ${JSON.stringify(town)};
const RIFTDATA = ${JSON.stringify(rift)};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const skillMap = {};
SKILLDATA.forEach(s => skillMap[s.id] = s);

// ==========================================
// 🎵 PROCEDURAL WEB AUDIO SYNTHESIZER
// ==========================================
let audioCtx = null;
let audioEnabled = true;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

const SoundEngine = {
  playSlash: function() {
    if (!audioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.14);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.14);
  },
  playHitCrunch: function(isCrit) {
    if (!audioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = isCrit ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(isCrit ? 180 : 120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(isCrit ? 0.35 : 0.22, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.12);
  },
  playDragonRoar: function() {
    if (!audioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(95, audioCtx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.8);
  },
  playHeal: function() {
    if (!audioEnabled || !audioCtx) return;
    const freqs = [523.25, 659.25, 783.99]; // C-E-G Chord
    freqs.forEach((f, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, audioCtx.currentTime + idx * 0.06);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.06 + 0.3);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.06);
      osc.stop(audioCtx.currentTime + idx * 0.06 + 0.3);
    });
  },
  playLoot: function() {
    if (!audioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, audioCtx.currentTime); // High B
    osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.07); // High E
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
  },
  playLevelUp: function() {
    if (!audioEnabled || !audioCtx) return;
    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((f, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, audioCtx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.08 + 0.35);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.08);
      osc.stop(audioCtx.currentTime + idx * 0.08 + 0.35);
    });
  },
  playDash: function() {
    if (!audioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.18);
  },
  playThunder: function() {
    if (!audioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + 0.65);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.65);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.65);
  },
  playPotion: function() {
    if (!audioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(920, audioCtx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
  },
  playWarp: function() {
    if (!audioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.45);
  }
};

function toggleAudio() {
  initAudio();
  audioEnabled = !audioEnabled;
  document.getElementById('audioToggleBtn').innerText = audioEnabled ? '🔊 SOUND' : '🔇 MUTED';
}

// ==========================================
// 💎 PERSISTENT SAVE/LOAD & LOOT SYSTEM
// ==========================================
let currentClassIdx = 0;
let inventory = {
  gold: 1200,
  gems: 15,
  scales: 5,
  weaponLevel: 0
};

const WEAPON_COLORS = ['#00f2fe', '#00ff88', '#ffd700', '#a29bfe', '#ff3838', '#ff9f43'];
const WEAPON_NAMES = [
  '+0 룬 대검',
  '+1 룬 대검 (+25%)',
  '+2 축복받은 룬 대검 (+50%)',
  '+3 비전 파멸검 (+75%)',
  '+4 용살자의 대검 (+100%)',
  '+5 신성 태양광선 대검 (+125%)'
];

function loadSavedGame() {
  try {
    const raw = localStorage.getItem('SeamlessPixelRPG_Save');
    if (raw) {
      const parsed = JSON.parse(raw);
      inventory = parsed.inventory || inventory;
      if (inventory.weaponLevel === undefined) inventory.weaponLevel = 0;
      currentClassIdx = parsed.currentClassIdx || 0;
    }
  } catch(e) {}
}

function saveGame() {
  try {
    localStorage.setItem('SeamlessPixelRPG_Save', JSON.stringify({
      inventory: inventory,
      currentClassIdx: currentClassIdx
    }));
  } catch(e) {}
}

loadSavedGame();

// Active Dropped Loot in World
let droppedLoot = [];
function spawnLootGem(x, y, type = "gold") {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * 45 + 15;
  droppedLoot.push({
    x: x, y: y,
    targetX: x + Math.cos(angle) * dist,
    targetY: y + Math.sin(angle) * dist,
    type: type,
    color: type === "gold" ? "#ffd32a" : (type === "gem" ? "#54a0ff" : "#ff6b6b"),
    life: 30.0,
    landed: false
  });
}

// Tween & Juice Engine
let screenShake = 0;
let hitStopTimer = 0;
let flashColor = null;
let flashAlpha = 0;
let floatingNumbers = [];
let pixelShards = [];

// Weather
let weatherIdx = 1;
let currentWeather = WEATHERDATA.weathers[weatherIdx];
const rainDrops = [];
for (let i = 0; i < 80; i++) {
  rainDrops.push({ x: Math.random() * 1400, y: Math.random() * 800, len: Math.random() * 16 + 10, speed: Math.random() * 300 + 450 });
}

// Camera & OpenWorld Chunk
const CHUNK_SIZE = 200;
const camera = { x: 0, y: 0 };

// Player State
let playerClass = CLASSDATA[currentClassIdx];
let player = {
  x: 0, y: 150,
  hp: playerClass.baseStats.maxHP,
  maxHP: playerClass.baseStats.maxHP,
  speed: playerClass.baseStats.moveSpeed * 34,
  skills: [],
  squashX: 1.0, squashY: 1.0,
  walkTimer: 0,
  isAttacking: false,
  attackSwingTimer: 0
};

// 3 Mercenaries
const mercenaries = [
  { role: "Tank", classData: CLASSDATA[20], x: -60, y: 180, hp: 1800, maxHP: 1800, color: "#10ac84", state: "Guarding", skills: [], tauntTimer: 0, walkTimer: 0 },
  { role: "Healer", classData: CLASSDATA[100], x: -80, y: 220, hp: 1100, maxHP: 1100, color: "#feca57", state: "Supporting", skills: [], walkTimer: 0 },
  { role: "DPS", classData: CLASSDATA[80], x: 80, y: 220, hp: 750, maxHP: 750, color: "#5f27cd", state: "Attacking", skills: [], walkTimer: 0 }
];

// Giant Boss (Twilight Dragon Valakas)
let bossState = {
  x: 0, y: -160,
  hp: BOSSDATA.maxHP,
  maxHP: BOSSDATA.maxHP,
  phase: 1,
  state: "Idle",
  nextPatternTimer: 2.0,
  activeTelegraph: null,
  patternTimer: 0,
  isNemesis: false,
  title: BOSSDATA.bossName,
  squashX: 1.0, squashY: 1.0,
  breathCharge: 0
};

// Dimensional Rift Portal
const riftPortal = { x: 210, y: -70, radius: 48, angle: 0 };
let activeAssassin = null;

// Town Ruin Buildings
const townBuildings = [
  { name: "룬 대장간", x: -260, y: -20, tier: 1, color: "#8395a7" },
  { name: "비전 마법탑", x: -260, y: 90, tier: 1, color: "#5f27cd" }
];

// 🏛️ HD-2D Gothic Ruin Monoliths (Stone Pillars with Ancient Glyphs)
const ruinPillars = [
  { x: -180, y: -90, w: 34, h: 68, runeColor: "#00d2d3" },
  { x: 180, y: -90, w: 34, h: 68, runeColor: "#00d2d3" },
  { x: -180, y: 110, w: 34, h: 68, runeColor: "#ffd32a" },
  { x: 180, y: 110, w: 34, h: 68, runeColor: "#ffd32a" }
];

// 💧 Dynamic Water Puddles & Rippling
const waterPuddles = [
  { x: -80, y: 35, rx: 58, ry: 24 },
  { x: 110, y: 75, rx: 72, ry: 28 },
  { x: -70, y: -130, rx: 52, ry: 22 },
  { x: 130, y: -120, rx: 46, ry: 20 }
];
let waterRipples = [];
function spawnRipple(x, y) {
  waterRipples.push({ x, y, r: 3, maxR: 26, alpha: 0.75 });
}

// 🌋 Ground Scorch Marks & Magma Fissures
let groundScorches = [];
function spawnScorchFissure(startX, startY, dirX, dirY, length = 75, width = 12) {
  groundScorches.push({
    x1: startX, y1: startY,
    x2: startX + dirX * length, y2: startY + dirY * length,
    width: width,
    life: 9.0, maxLife: 9.0
  });
}

// ⚔️ 3-Hit Combat Combo & Mercenary Tactical Command State
let comboStep = 0;
let comboTimer = 0;
let holyShieldTimer = 0;
let mercenaryBuffTimer = 0;
let mercenaryCommand = 'normal';

// 💨 Dodge Roll & I-Frame Dash State
let dashCooldown = 0;
let dashTimer = 0;
let dashDirX = 0;
let dashDirY = 0;
let playerAfterimages = [];

// 🧪 Health Potion Flask System
let potionCharges = 3;
const maxPotionCharges = 3;

// 🌀 Procedural Rift Dungeon & Zone Transition
let currentZone = "OpenWorld"; // "OpenWorld" | "RiftDungeon"
let savedOpenWorldPos = { x: 0, y: 150 };
let fieldMonsters = [];
let riftMonsters = [];
let riftChimeraBoss = null;

// ⚡ Dynamic Weather Lightning Strikes
let lightningTimer = 6.0;
let activeLightningBolts = [];

// 🌌 Ambient Floating Embers & Dust Motes
let ambientMotes = [];
for (let i = 0; i < 40; i++) {
  ambientMotes.push({
    x: (Math.random() - 0.5) * 1300,
    y: (Math.random() - 0.5) * 800,
    vy: -Math.random() * 25 - 12,
    vx: (Math.random() - 0.5) * 16,
    size: Math.random() * 3 + 1.5,
    alpha: Math.random() * 0.7 + 0.3
  });
}

// Projectiles & AoEs
let activeProjectiles = [];
let activeAoEs = [];

// Input state
const keys = {};
let mousePos = { x: 0, y: 0 };

window.addEventListener('keydown', e => {
  initAudio();
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Tab' || e.key === ']') { e.preventDefault(); nextClass(); }
  if (e.key === '[') { e.preventDefault(); prevClass(); }
  if (e.code === 'Space') { e.preventDefault(); triggerDodgeRoll(); }
  if (e.key.toLowerCase() === 'h') { e.preventDefault(); useHealthPotion(); }
  if (e.key.toLowerCase() === 'f') { e.preventDefault(); interactRift(); }
  if (e.key.toLowerCase() === 'q') castPlayerSkill(1);
  if (e.key.toLowerCase() === 'e') castPlayerSkill(2);
  if (e.key.toLowerCase() === 'r') castPlayerSkill(3);
  if (e.key === '1') orderMercenaries('focus');
  if (e.key === '2') orderMercenaries('guard');
  if (e.key === '3') orderMercenaries('scatter');
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mousePos.x = (e.clientX - rect.left) * scaleX;
  mousePos.y = (e.clientY - rect.top) * scaleY;
});
canvas.addEventListener('mousedown', e => {
  initAudio();
  if (e.button === 0) castPlayerSkill(0);
});

// Mobile & Tablet Touch Support
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  initAudio();
  if (e.touches.length > 0) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePos.x = (e.touches[0].clientX - rect.left) * scaleX;
    mousePos.y = (e.touches[0].clientY - rect.top) * scaleY;
    castPlayerSkill(0);
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (e.touches.length > 0) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePos.x = (e.touches[0].clientX - rect.left) * scaleX;
    mousePos.y = (e.touches[0].clientY - rect.top) * scaleY;
  }
}, { passive: true });

function applyClass(idx) {
  currentClassIdx = (idx + CLASSDATA.length) % CLASSDATA.length;
  playerClass = CLASSDATA[currentClassIdx];
  player.maxHP = playerClass.baseStats.maxHP;
  player.hp = player.maxHP;
  player.speed = playerClass.baseStats.moveSpeed * 34;

  player.skills = (playerClass.availableSkillIds || [1, 2, 3, 4]).map(id => {
    const raw = skillMap[id] || SKILLDATA[0];
    return { ...raw, cdRemaining: 0 };
  });

  flashScreen('#1dd1a1', 0.25);
  doHitStop(0.04);
  saveGame();
  updateHUD();
}

function nextClass() { applyClass(currentClassIdx + 1); }
function prevClass() { applyClass(currentClassIdx - 1); }
function randomClass() { applyClass(Math.floor(Math.random() * CLASSDATA.length)); }

function triggerChimera() {
  initAudio();
  const c1 = CLASSDATA[Math.floor(Math.random() * CLASSDATA.length)];
  const c2 = CLASSDATA[Math.floor(Math.random() * CLASSDATA.length)];
  const c3 = CLASSDATA[Math.floor(Math.random() * CLASSDATA.length)];

  playerClass = {
    ...playerClass,
    className: "【키메라】 " + (c1.subCategory || c1.className) + "+" + (c2.subCategory || c2.className) + "+" + (c3.subCategory || c3.className),
    archetype: "ChimeraFusion",
    weaponType: "카오스 블레이드 (Chaos Blade)"
  };
  player.maxHP = Math.round(c1.baseStats.maxHP * 0.6 + c2.baseStats.maxHP * 0.25 + c3.baseStats.maxHP * 0.25);
  player.hp = player.maxHP;

  // Hybridize skills from the 3 fused classes!
  const s0 = skillMap[c1.availableSkillIds[0]] || SKILLDATA[0];
  const s1 = skillMap[c2.availableSkillIds[Math.min(1, c2.availableSkillIds.length - 1)]] || SKILLDATA[1];
  const s2 = skillMap[c3.availableSkillIds[Math.min(2, c3.availableSkillIds.length - 1)]] || SKILLDATA[2];
  const s3 = {
    id: 9999,
    skillName: "초융합: 카오스 차원폭발",
    element: "Dark",
    skillType: "AoEZone",
    damageMultiplier: 4.8,
    cooldown: 8.0,
    particleColor: "#ff00ff"
  };
  player.skills = [s0, s1, s2, s3].map(s => ({ ...s, cdRemaining: 0 }));

  SoundEngine.playLevelUp();
  flashScreen('#9b59b6', 0.6);
  doShake(14);
  spawnShards(player.x, player.y, '#ff00ff', 35);
  addDamageText(player.x, player.y - 30, "CHIMERA FUSION!", true, '#ff00ff');
  updateHUD();
}

function toggleWeather() {
  initAudio();
  weatherIdx = (weatherIdx + 1) % WEATHERDATA.weathers.length;
  currentWeather = WEATHERDATA.weathers[weatherIdx];
  SoundEngine.playSlash();
  flashScreen(currentWeather.ambientColor, 0.3);
  doShake(4);
  updateHUD();
}

function triggerMercenaryBetrayal() {
  initAudio();
  const b = NEMESISDATA.betrayedMercenaries[Math.floor(Math.random() * NEMESISDATA.betrayedMercenaries.length)];
  activeAssassin = {
    x: player.x + (Math.random() > 0.5 ? 180 : -180),
    y: player.y + 120,
    hp: 1500, maxHP: 1500,
    speed: 175,
    name: "암살자 [" + b.grudgeType + "]"
  };
  document.getElementById('nemesisStatusText').innerText = "난입: " + b.ambushDialogue;
  SoundEngine.playDragonRoar();
  flashScreen('#c0392b', 0.45);
  doShake(8);
}

let townTier = 1;
const HIDDEN_SKILLS = [
  {
    id: 9901,
    skillName: "고대 룬 파쇄검 (Rune Cleave)",
    element: "Physical",
    skillType: "GroundSlam",
    damageMultiplier: 3.4,
    cooldown: 5.0,
    areaRadius: 110,
    castTime: 0.1,
    hitStopDuration: 0.12,
    shakeIntensity: 1.0,
    particleColor: "#ffd32a"
  },
  {
    id: 9902,
    skillName: "비전 차원 왜곡 (Arcane Warp)",
    element: "Lightning",
    skillType: "DashStun",
    damageMultiplier: 4.2,
    cooldown: 6.5,
    range: 160,
    castTime: 0.05,
    hitStopDuration: 0.14,
    shakeIntensity: 1.2,
    particleColor: "#a29bfe"
  },
  {
    id: 9903,
    skillName: "대천사의 성역 (Seraphim Aura)",
    element: "Holy",
    skillType: "HealAura",
    damageMultiplier: 3.0,
    healMultiplier: 2.2,
    cooldown: 8.0,
    areaRadius: 180,
    castTime: 0.15,
    hitStopDuration: 0.1,
    shakeIntensity: 0.8,
    particleColor: "#2ed573"
  }
];

function upgradeTown() {
  initAudio();
  if (inventory.gold >= 300) {
    inventory.gold -= 300;
    townTier++;
    townBuildings.forEach(b => {
      b.tier = townTier;
      b.color = townTier >= 3 ? "#e67e22" : "#f39c12";
    });

    const newSkill = HIDDEN_SKILLS[(townTier - 2) % HIDDEN_SKILLS.length];
    if (player.skills.length >= 4) {
      player.skills[3] = { ...newSkill, cdRemaining: 0 };
    } else {
      player.skills.push({ ...newSkill, cdRemaining: 0 });
    }

    SoundEngine.playLevelUp();
    spawnShards(player.x, player.y, '#f1c40f', 30);
    addDamageText(player.x, player.y - 25, "TOWN TIER " + townTier + "! " + newSkill.skillName + " 해금!", true, '#f1c40f');
    document.getElementById('townUpgradeBtn').innerText = "🏛️ [영지 재건] T" + (townTier + 1) + " 업그레이드";
    saveGame();
    updateHUD();
  } else {
    addDamageText(player.x, player.y - 20, "골드 부족! (필요: 300G)", false, '#e74c3c');
  }
}

function upgradeEquipment() {
  initAudio();
  if (inventory.weaponLevel >= 5) {
    addDamageText(player.x, player.y - 20, "최대 제련 레벨 도달 (+5 MAX)!", true, '#ffd700');
    return;
  }
  const costGold = (inventory.weaponLevel + 1) * 200;
  const costScales = inventory.weaponLevel + 1;
  if (inventory.gold >= costGold && inventory.scales >= costScales) {
    inventory.gold -= costGold;
    inventory.scales -= costScales;
    inventory.weaponLevel++;
    SoundEngine.playLevelUp();
    flashScreen(WEAPON_COLORS[inventory.weaponLevel], 0.5);
    doShake(10);
    spawnShards(player.x, player.y, WEAPON_COLORS[inventory.weaponLevel], 35);
    addDamageText(player.x, player.y - 30, WEAPON_NAMES[inventory.weaponLevel] + " 제련 성공!", true, WEAPON_COLORS[inventory.weaponLevel]);
    saveGame();
    updateHUD();
  } else {
    addDamageText(player.x, player.y - 20, "재료 부족! (필요: " + costGold + "G + " + costScales + "비늘)", false, '#e74c3c');
  }
}

function orderMercenaries(order) {
  initAudio();
  mercenaryCommand = order;
  if (order === 'focus') {
    mercenaryBuffTimer = 6.0;
    SoundEngine.playSlash();
    flashScreen('#ff4757', 0.25);
    doShake(5);
    addDamageText(player.x, player.y - 30, "⚔️ 전술: 전 용병 보스 일점사!", true, '#ff4757');
    mercenaries.forEach(m => {
      if (m.hp > 0) {
        m.state = "FOCUSING!";
        spawnShards(m.x, m.y, '#ff4757', 10);
      }
    });
  } else if (order === 'guard') {
    holyShieldTimer = 4.5;
    SoundEngine.playHeal();
    flashScreen('#ffd700', 0.35);
    doShake(6);
    addDamageText(player.x, player.y - 30, "🛡️ 전술: 수호 방벽 전개! (-65% 피해)", true, '#ffd700');
    mercenaries.forEach(m => {
      if (m.hp > 0) {
        m.state = "GUARDING!";
        spawnShards(m.x, m.y, '#ffd700', 12);
      }
    });
  } else if (order === 'scatter') {
    mercenaryBuffTimer = 4.0;
    SoundEngine.playSlash();
    flashScreen('#00d2d3', 0.25);
    doShake(4);
    addDamageText(player.x, player.y - 30, "💨 전술: 전 용병 긴급 산개 회피!", true, '#00d2d3');
    mercenaries.forEach(m => {
      if (m.hp > 0) {
        m.state = "SCATTER!";
        const angle = Math.random() * Math.PI * 2;
        m.x += Math.cos(angle) * 85;
        m.y += Math.sin(angle) * 85;
        spawnShards(m.x, m.y, '#00d2d3', 10);
      }
    });
  }
  updateHUD();
}

function triggerDodgeRoll() {
  if (player.isDead || dashCooldown > 0) return;
  initAudio();
  dashCooldown = 1.0;
  dashTimer = 0.28;

  let mx = 0, my = 0;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;

  if (mx === 0 && my === 0) {
    const worldMouseX = mousePos.x - canvas.width / 2 + camera.x;
    const worldMouseY = mousePos.y - canvas.height / 2 + camera.y;
    mx = worldMouseX - player.x;
    my = worldMouseY - player.y;
  }
  const len = Math.hypot(mx, my) || 1;
  dashDirX = mx / len;
  dashDirY = my / len;

  SoundEngine.playDash();
  doShake(5);
  doSquash(player, 1.45, 0.65);
  spawnShards(player.x, player.y, '#00ffff', 14);

  playerAfterimages.push({ x: player.x, y: player.y, alpha: 0.85, color: '#00f2fe' });
  addDamageText(player.x, player.y - 18, "DODGE ROLL!", false, '#00f2fe');
  updateHUD();
}

function useHealthPotion() {
  if (player.isDead || potionCharges <= 0 || player.hp >= player.maxHP) return;
  initAudio();
  potionCharges--;
  const healAmt = Math.round(player.maxHP * 0.45);
  player.hp = Math.min(player.maxHP, player.hp + healAmt);
  SoundEngine.playPotion();
  flashScreen('#2ecc71', 0.3);
  doShake(4);
  spawnShards(player.x, player.y, '#2ecc71', 25);
  addDamageText(player.x, player.y - 25, "+" + healAmt + " HP (POTION)", false, '#2ecc71');
  updateHUD();
}

function interactRift() {
  initAudio();
  if (currentZone === "OpenWorld") {
    const distToPortal = Math.hypot(player.x - riftPortal.x, player.y - riftPortal.y);
    if (distToPortal > 160) {
      addDamageText(player.x, player.y - 20, "차원 균열 포털로 이동하세요!", false, '#ff7675');
      return;
    }
    currentZone = "RiftDungeon";
    savedOpenWorldPos = { x: player.x, y: player.y };
    player.x = 0;
    player.y = 120;
    SoundEngine.playWarp();
    flashScreen('#8e44ad', 0.7);
    doShake(20);
    spawnRiftDungeonMonsters();
    addDamageText(player.x, player.y - 30, "ENTERED ABYSSAL RIFT!", true, '#e056fd');
    const riftBtn = document.getElementById('riftZoneBtn');
    if (riftBtn) riftBtn.innerText = "🌀 [F] 균열 퇴장";
    document.getElementById('nemesisStatusText').innerText = "차원 균열 심층: 차원 키메라 엘리트를 섬멸하십시오!";
  } else {
    currentZone = "OpenWorld";
    player.x = savedOpenWorldPos.x;
    player.y = savedOpenWorldPos.y;
    potionCharges = maxPotionCharges; // Refill potions!
    inventory.gold += 400;
    inventory.gems += 2;
    inventory.scales += 1;
    SoundEngine.playWarp();
    flashScreen('#10ac84', 0.55);
    doShake(14);
    addDamageText(player.x, player.y - 30, "RIFT CLEARED! (+400G, +2GEM, +1SCALE)", true, '#ffd700');
    const riftBtn = document.getElementById('riftZoneBtn');
    if (riftBtn) riftBtn.innerText = "🌀 [F] 균열 진입";
    document.getElementById('nemesisStatusText').innerText = "오픈월드로 귀환했습니다. 성소의 축복으로 물약이 완충되었습니다.";
    saveGame();
  }
  updateHUD();
}

function spawnFieldMonsters() {
  fieldMonsters = [
    { id: 1, name: "해골 척후병", x: -210, y: 30, hp: 450, maxHP: 450, speed: 105, color: "#dcdde1", type: "Skeleton", attackTimer: 0, walkTimer: 0 },
    { id: 2, name: "해골 전사", x: -160, y: -45, hp: 550, maxHP: 550, speed: 95, color: "#bdc3c7", type: "Skeleton", attackTimer: 0, walkTimer: 0 },
    { id: 3, name: "심연의 도깨비불", x: 160, y: 55, hp: 320, maxHP: 320, speed: 135, color: "#9b59b6", type: "Wisp", attackTimer: 0, walkTimer: 0 },
    { id: 4, name: "타락한 골렘", x: 210, y: -40, hp: 850, maxHP: 850, speed: 75, color: "#7f8c8d", type: "Golem", attackTimer: 0, walkTimer: 0 }
  ];
}

function spawnRiftDungeonMonsters() {
  riftMonsters = [
    { id: 101, name: "공허의 망령", x: -90, y: -30, hp: 600, maxHP: 600, speed: 130, color: "#a29bfe", type: "Wisp", attackTimer: 0, walkTimer: 0 },
    { id: 102, name: "공허의 망령", x: 90, y: -30, hp: 600, maxHP: 600, speed: 130, color: "#a29bfe", type: "Wisp", attackTimer: 0, walkTimer: 0 },
    { id: 103, name: "균열 추적자", x: -120, y: 40, hp: 800, maxHP: 800, speed: 110, color: "#fd79a8", type: "Skeleton", attackTimer: 0, walkTimer: 0 },
    { id: 104, name: "균열 추적자", x: 120, y: 40, hp: 800, maxHP: 800, speed: 110, color: "#fd79a8", type: "Skeleton", attackTimer: 0, walkTimer: 0 },
    { id: 999, name: "차원 포식자 키메라", x: 0, y: -70, hp: 12500, maxHP: 12500, speed: 120, color: "#e056fd", type: "ChimeraBoss", isBoss: true, attackTimer: 0, walkTimer: 0 }
  ];
}

spawnFieldMonsters();

function spawnLightningStrike(x, y) {
  SoundEngine.playThunder();
  flashScreen('#ffffff', 0.75);
  doShake(18);
  spawnScorchFissure(x, y, 0, 1, 35, 14);
  spawnShards(x, y, '#00ffff', 25);

  const segments = [];
  let currX = x;
  let currY = y - 420;
  while (currY < y) {
    segments.push({ x: currX, y: currY });
    currY += Math.random() * 40 + 25;
    currX += (Math.random() - 0.5) * 45;
  }
  segments.push({ x, y });
  activeLightningBolts.push({ segments, life: 0.22 });

  if (Math.hypot(player.x - x, player.y - y) < 65 && dashTimer <= 0) {
    damagePlayer(110, "Lightning");
  }
  if (bossState.hp > 0 && Math.hypot(bossState.x - x, bossState.y - y) < 130) {
    bossState.hp = Math.max(0, bossState.hp - 750);
    addDamageText(bossState.x, bossState.y, "LIGHTNING 750!", true, '#00ffff');
    SoundEngine.playHitCrunch(true);
  }
}

function reSummonBoss() {
  initAudio();
  bossState.x = 0;
  bossState.y = -220;
  bossState.hp = BOSSDATA.baseStats.maxHP || 65000;
  bossState.maxHP = BOSSDATA.baseStats.maxHP || 65000;
  bossState.isNemesis = false;
  bossState.isDead = false;
  bossState.phase = 1;
  bossState.title = BOSSDATA.bossName;
  bossState.state = "Idle";
  bossState.activeTelegraph = null;
  bossState.breathCharge = 0;
  SoundEngine.playDragonRoar();
  flashScreen('#ff4757', 0.6);
  doShake(15);
  addDamageText(bossState.x, bossState.y, "VALAKAS RE-SUMMONED!", true, '#ff4757');
  document.getElementById('nemesisStatusText').innerText = "보스가 새로운 상태로 재소환되었습니다.";
  updateHUD();
}

mercenaries.forEach(m => {
  m.skills = (m.classData.availableSkillIds || [1, 2, 3, 4]).map(id => {
    const raw = skillMap[id] || SKILLDATA[0];
    return { ...raw, cdRemaining: 0 };
  });
});
applyClass(currentClassIdx);

// Juice Utilities
function doShake(amt) { screenShake = Math.max(screenShake, amt); }
function doHitStop(duration = 0.08) { hitStopTimer = duration; }
function flashScreen(color, alpha = 0.4) { flashColor = color; flashAlpha = alpha; }
function doSquash(obj, sx, sy) { obj.squashX = sx; obj.squashY = sy; }

function spawnShards(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 240 + 80;
    pixelShards.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      color, size: Math.random() * 5 + 3, life: Math.random() * 0.4 + 0.3
    });
  }
}
function addDamageText(x, y, dmg, isCrit = false, color = '#ffffff') {
  floatingNumbers.push({
    x: x + (Math.random() * 20 - 10), y: y - 24,
    text: (isCrit ? "CRIT! " : "") + dmg, color: isCrit ? "#ff3838" : color,
    size: isCrit ? 24 : 14, life: 0.85
  });
}

function damagePlayer(damage, attackerName = "Boss") {
  if (player.isDead) return;
  if (dashTimer > 0) {
    addDamageText(player.x, player.y - 12, "DODGED (I-FRAME)!", false, '#00ffff');
    spawnShards(player.x, player.y, '#00ffff', 4);
    return;
  }
  if (holyShieldTimer > 0) {
    damage = Math.round(damage * 0.35); // 65% barrier reduction!
    spawnShards(player.x, player.y, '#ffd700', 8);
    addDamageText(player.x, player.y - 12, "BARRIER (-65%)", false, '#ffd700');
  }
  player.hp = Math.max(0, player.hp - damage);
  doShake(Math.min(16, damage * 0.08 + 4));
  SoundEngine.playHitCrunch(false);
  doSquash(player, 0.72, 1.38);
  addDamageText(player.x, player.y, damage, false, '#ff4757');

  if (player.hp <= 0) {
    playerDeath(attackerName);
  }
}

function playerDeath(attackerName) {
  if (player.isDead) return;
  player.isDead = true;
  player.hp = 0;
  SoundEngine.playHitCrunch(true);
  flashScreen('#c0392b', 0.85);
  doShake(25);
  spawnShards(player.x, player.y, '#ff4757', 35);
  addDamageText(player.x, player.y - 30, "YOU DIED!", true, '#ff0000');

  // Nemesis Evolution & Weapon Theft
  if (bossState && !bossState.isNemesis) {
    bossState.isNemesis = true;
    const title = NEMESISDATA.nemesisTitles[Math.floor(Math.random() * NEMESISDATA.nemesisTitles.length)];
    bossState.title = "👑 [NEMESIS 진화] " + title + " 발라카스";
    bossState.maxHP = Math.round(bossState.maxHP * 1.4);
    bossState.hp = bossState.maxHP;
    const taunt = NEMESISDATA.deathDialogueTrees[Math.floor(Math.random() * NEMESISDATA.deathDialogueTrees.length)];
    document.getElementById('nemesisStatusText').innerText = '👑 [장비 강탈] 보스: "' + taunt + '" (플레이어의 무기를 강탈했습니다!)';
  } else if (activeAssassin) {
    document.getElementById('nemesisStatusText').innerText = "🗡️ [원한 성취] 암살자가 플레이어를 쓰러뜨리고 장비를 탈취했습니다!";
  }

  // Respawn at Town after 2.5s
  setTimeout(() => {
    player.x = 0;
    player.y = 120;
    player.hp = player.maxHP;
    player.isDead = false;
    SoundEngine.playHeal();
    flashScreen('#2ed573', 0.5);
    addDamageText(player.x, player.y - 20, "RESPAWNED AT TOWN!", true, '#2ed573');
    mercenaries.forEach(m => {
      m.x = player.x + (Math.random() * 40 - 20);
      m.y = player.y + (Math.random() * 40 - 20);
      m.hp = m.maxHP;
      m.state = "Following";
    });
    updateHUD();
  }, 2500);
}

function damageAssassin(damage, isCrit, color) {
  if (!activeAssassin) return;
  activeAssassin.hp -= damage;
  addDamageText(activeAssassin.x, activeAssassin.y - 12, damage, isCrit, color || '#ff5252');
  spawnShards(activeAssassin.x, activeAssassin.y, '#ff5252', 8);
  SoundEngine.playHitCrunch(isCrit);
  if (activeAssassin.hp <= 0) {
    SoundEngine.playLevelUp();
    addDamageText(activeAssassin.x, activeAssassin.y - 25, "ASSASSIN SLAIN!", true, '#ffd700');
    flashScreen('#2ecc71', 0.4);
    for (let i = 0; i < 8; i++) spawnLootGem(activeAssassin.x, activeAssassin.y, "gold");
    for (let i = 0; i < 2; i++) spawnLootGem(activeAssassin.x, activeAssassin.y, "gem");
    document.getElementById('nemesisStatusText').innerText = "배반 암살자를 처치하여 복수를 완료했습니다!";
    activeAssassin = null;
  }
}

function castPlayerSkill(slotIdx) {
  if (player.isDead || !player.skills[slotIdx] || player.skills[slotIdx].cdRemaining > 0) return;
  const sk = player.skills[slotIdx];
  sk.cdRemaining = sk.cooldown;

  const worldMouseX = mousePos.x - canvas.width / 2 + camera.x;
  const worldMouseY = mousePos.y - canvas.height / 2 + camera.y;
  const dirX = worldMouseX - player.x;
  const dirY = worldMouseY - player.y;
  const len = Math.hypot(dirX, dirY) || 1;

  let comboMult = 1.0;
  let forceCrit = false;

  if (slotIdx === 0) {
    if (comboTimer <= 0) comboStep = 0;
    comboTimer = 0.95;

    if (comboStep === 0) {
      comboMult = 1.0;
      player.attackSwingTimer = 0.18;
      SoundEngine.playSlash();
      addDamageText(player.x, player.y - 18, "COMBO I", false, WEAPON_COLORS[inventory.weaponLevel]);
    } else if (comboStep === 1) {
      comboMult = 1.45;
      player.attackSwingTimer = 0.24;
      SoundEngine.playSlash();
      addDamageText(player.x, player.y - 18, "COMBO II", false, '#ffd700');
    } else {
      comboMult = 2.6;
      forceCrit = true;
      player.attackSwingTimer = 0.34;
      SoundEngine.playHitCrunch(true);
      doShake(15);
      doHitStop(0.12);
      spawnScorchFissure(player.x, player.y, dirX / len, dirY / len, 95, 14);
      addDamageText(player.x, player.y - 24, "CRUSH FINISHER!", true, '#ff3838');
    }
    comboStep = (comboStep + 1) % 3;
  } else {
    player.attackSwingTimer = 0.22;
    SoundEngine.playSlash();
  }

  doSquash(player, 1.35, 0.7);
  executeSkill(player, sk, dirX / len, dirY / len, worldMouseX, worldMouseY, true, comboMult, forceCrit);
}

function executeSkill(source, skill, dirX, dirY, targetX, targetY, isPlayer, comboMult = 1.0, forceCrit = false) {
  const isCrit = forceCrit || (Math.random() < 0.22);
  let weaponBoost = isPlayer ? (1 + (inventory.weaponLevel || 0) * 0.25) : 1.0;
  let baseDmg = (source.classData ? source.classData.baseStats.attackPower * skill.damageMultiplier : 95 * skill.damageMultiplier) * comboMult * weaponBoost;

  const mult = currentWeather.elementalMultipliers[skill.element] || 1.0;
  let dmg = Math.round(baseDmg * mult * (isCrit ? 1.8 : 1));

  if (skill.skillType === "MeleeSlash" || skill.skillType === "GroundSlam") {
    doHitStop(skill.hitStopDuration || 0.08);
    doShake(skill.shakeIntensity * 16 || 6);
    SoundEngine.playHitCrunch(isCrit);
    spawnShards(source.x + dirX * 45, source.y + dirY * 45, skill.particleColor || '#ffd700', 18);

    const distToBoss = Math.hypot(bossState.x - source.x, bossState.y - source.y);
    if (distToBoss < 140) {
      bossState.hp = Math.max(0, bossState.hp - dmg);
      doSquash(bossState, 1.25, 0.8);
      addDamageText(bossState.x, bossState.y, dmg, isCrit, skill.particleColor);

      // Chance to drop loot gems on hit
      if (Math.random() < 0.35) spawnLootGem(bossState.x, bossState.y, "gold");
      if (Math.random() < 0.15) spawnLootGem(bossState.x, bossState.y, "gem");
    }

    if (activeAssassin) {
      const distAss = Math.hypot(activeAssassin.x - source.x, activeAssassin.y - source.y);
      if (distAss < 95) damageAssassin(dmg, isCrit, skill.particleColor);
    }
  } else if (skill.skillType === "DashStun") {
    source.x += dirX * 95;
    source.y += dirY * 95;
    doShake(8);
    doHitStop(0.1);
    SoundEngine.playHitCrunch(true);
    spawnShards(source.x, source.y, skill.particleColor || '#00ffff', 22);

    const distToBoss = Math.hypot(bossState.x - source.x, bossState.y - source.y);
    if (distToBoss < 130) {
      bossState.hp = Math.max(0, bossState.hp - dmg);
      doSquash(bossState, 1.3, 0.7);
      addDamageText(bossState.x, bossState.y, dmg, isCrit, '#00ffff');
      spawnLootGem(bossState.x, bossState.y, "gem");
    }

    if (activeAssassin) {
      const distAss = Math.hypot(activeAssassin.x - source.x, activeAssassin.y - source.y);
      if (distAss < 95) damageAssassin(dmg, isCrit, '#00ffff');
    }
  } else if (skill.skillType === "Projectile" || skill.skillType === "PiercingBeam") {
    activeProjectiles.push({
      x: source.x, y: source.y,
      vx: dirX * 440, vy: dirY * 440,
      damage: dmg,
      color: skill.particleColor || '#ff9f43',
      isCrit: isCrit,
      life: 2.0, radius: 9
    });
  } else if (skill.skillType === "AoEZone") {
    const aoeRadius = currentWeather.name === "Rain" ? 100 : 72;
    activeAoEs.push({
      x: targetX, y: targetY,
      radius: aoeRadius,
      damage: Math.round(dmg * 0.35),
      color: skill.particleColor || '#8e44ad',
      life: 3.0, tickTimer: 0.5
    });
  } else if (skill.skillType === "HealAura") {
    SoundEngine.playHeal();
    const healAmt = Math.round(dmg * 0.8 + 80);
    player.hp = Math.min(player.maxHP, player.hp + healAmt);
    mercenaries.forEach(m => m.hp = Math.min(m.maxHP, m.hp + healAmt));
    spawnShards(source.x, source.y, '#2ecc71', 22);
    addDamageText(source.x, source.y, healAmt, false, '#2ecc71');
  } else if (skill.skillType === "TauntRoar" || skill.skillType === "Buff") {
    doShake(6);
    SoundEngine.playDragonRoar();
    spawnShards(source.x, source.y, '#f1c40f', 16);
    addDamageText(source.x, source.y - 15, "TAUNT ROAR!", true, '#f1c40f');
  }
}

// Boss AI & Nemesis Evolution
function updateBoss(dt) {
  if (bossState.hp <= 0) {
    if (!bossState.isNemesis) {
      bossState.isNemesis = true;
      bossState.hp = 35000;
      bossState.maxHP = 35000;
      bossState.title = "👑 [NEMESIS 진화] " + NEMESISDATA.nemesisTitles[0] + " 발라카스";
      SoundEngine.playDragonRoar();
      flashScreen('#8e44ad', 0.8);
      doShake(20);
      document.getElementById('nemesisStatusText').innerText = "보스가 플레이어 장비를 강탈해 네메시스로 진화했습니다!";
      for(let i=0; i<6; i++) spawnLootGem(bossState.x, bossState.y, "scale");
    } else if (!bossState.isDead) {
      bossState.isDead = true;
      bossState.hp = 0;
      SoundEngine.playLevelUp();
      flashScreen('#ffd700', 0.9);
      doShake(25);
      document.getElementById('nemesisStatusText').innerText = "🎉 [레이드 토벌 성공] 고룡 발라카스를 완전히 격파했습니다!";
      addDamageText(bossState.x, bossState.y - 40, "VICTORY! VALAKAS SLAIN!", true, '#ffd700');
      for (let i = 0; i < 24; i++) {
        const type = i % 3 === 0 ? "scale" : (i % 2 === 0 ? "gem" : "gold");
        spawnLootGem(bossState.x + (Math.random() * 90 - 45), bossState.y + (Math.random() * 90 - 45), type);
      }
    }
    return;
  }

  const hpRatio = bossState.hp / bossState.maxHP;
  if (hpRatio <= 0.3 && bossState.phase < 3) {
    bossState.phase = 3; flashScreen('#ff0000', 0.8); doShake(18); SoundEngine.playDragonRoar();
  } else if (hpRatio <= 0.7 && bossState.phase < 2) {
    bossState.phase = 2; flashScreen('#ff4400', 0.6); doShake(12); SoundEngine.playDragonRoar();
  }

  if (bossState.state === "Idle") {
    bossState.nextPatternTimer -= dt;
    if (bossState.nextPatternTimer <= 0) triggerBossPattern();
  } else if (bossState.state === "Telegraph") {
    bossState.patternTimer -= dt;
    bossState.breathCharge = 1.0 - (bossState.patternTimer / (bossState.currentPattern.telegraphDuration || 1.8));
    if (bossState.patternTimer <= 0) executeBossAttack();
  }
}

function triggerBossPattern() {
  const pList = BOSSDATA.patterns;
  const pattern = pList[Math.floor(Math.random() * pList.length)];
  bossState.currentPattern = pattern;
  bossState.state = "Telegraph";
  bossState.patternTimer = pattern.telegraphDuration || 1.8;
  bossState.breathCharge = 0;
  SoundEngine.playDragonRoar();

  bossState.activeTelegraph = {
    type: pattern.telegraphType,
    x: bossState.x, y: bossState.y + 65,
    radius: (pattern.radius || 8) * 12,
    width: (pattern.width || 4) * 12, length: (pattern.length || 14) * 12
  };
  document.getElementById('telegraphWarning').style.display = 'block';
}

function executeBossAttack() {
  const p = bossState.currentPattern;
  bossState.state = "Idle";
  bossState.nextPatternTimer = Math.random() * 1.5 + 2.0;
  bossState.activeTelegraph = null;
  bossState.breathCharge = 0;
  document.getElementById('telegraphWarning').style.display = 'none';

  doShake((p.cameraShake || 0.5) * 22);
  doHitStop(p.hitStopDuration || 0.1);
  SoundEngine.playHitCrunch(true);
  flashScreen('#ff2200', 0.45);
  spawnShards(bossState.x, bossState.y + 65, '#ff3300', 40);

  const distPlayer = Math.hypot(player.x - bossState.x, player.y - (bossState.y + 65));
  if (distPlayer < (p.radius || 8) * 12) {
    damagePlayer(p.damage || 150, "Valakas");
  }

  mercenaries.forEach(m => {
    if (m.hp <= 0) return;
    const distMerc = Math.hypot(m.x - bossState.x, m.y - (bossState.y + 65));
    if (distMerc < (p.radius || 8) * 12) {
      m.hp = Math.max(0, m.hp - (p.damage || 150));
      addDamageText(m.x, m.y, p.damage || 150, false, '#ff0000');
      if (m.hp <= 0) {
        m.state = "Downed (부상)";
        m.downedTimer = 0;
      }
    }
  });
}

// Mercenary AI (Formation & Evade)
function updateMercenaries(dt) {
  mercenaries.forEach((m, idx) => {
    if (m.hp <= 0) {
      m.state = "Downed (부상)";
      m.downedTimer = (m.downedTimer || 0) + dt;
      if (m.downedTimer >= 7.0) {
        m.hp = Math.round(m.maxHP * 0.45);
        m.state = "Recovered";
        m.downedTimer = 0;
        addDamageText(m.x, m.y - 15, "REVIVED!", false, '#2ecc71');
        SoundEngine.playHeal();
      }
      return;
    }

    if (bossState.activeTelegraph) {
      m.state = "EVADING!";
      const tel = bossState.activeTelegraph;
      const dx = m.x - tel.x; const dy = m.y - tel.y;
      const dist = Math.hypot(dx, dy) || 1;
      m.x += (dx / dist) * 170 * dt;
      m.y += (dy / dist) * 170 * dt;
      m.walkTimer += dt * 14;
      return;
    }

    if (m.role === "Healer") {
      let lowAlly = player.hp < player.maxHP * 0.6 ? player : null;
      if (!lowAlly) lowAlly = mercenaries.find(o => o.hp < o.maxHP * 0.6);
      if (lowAlly && m.skills[0] && m.skills[0].cdRemaining <= 0) {
        executeSkill(m, m.skills[0], 0, 0, lowAlly.x, lowAlly.y, false);
        m.skills[0].cdRemaining = m.skills[0].cooldown;
      }
    } else if (m.role === "Tank" && m.skills[0] && m.skills[0].cdRemaining <= 0) {
      m.tauntTimer -= dt;
      if (m.tauntTimer <= 0) {
        m.tauntTimer = 6.0;
        executeSkill(m, m.skills[0], 0, -1, bossState.x, bossState.y, false);
        m.skills[0].cdRemaining = m.skills[0].cooldown;
      }
    } else if (m.role === "DPS" && m.skills[0] && m.skills[0].cdRemaining <= 0) {
      const dx = bossState.x - m.x; const dy = bossState.y - m.y;
      const len = Math.hypot(dx, dy) || 1;
      executeSkill(m, m.skills[0], dx / len, dy / len, bossState.x, bossState.y, false);
      m.skills[0].cdRemaining = m.skills[0].cooldown;
    }

    const targetOffsets = [{ x: -50, y: -25 }, { x: -65, y: 45 }, { x: 65, y: 45 }];
    const tx = player.x + targetOffsets[idx].x;
    const ty = player.y + targetOffsets[idx].y;
    const distToTarget = Math.hypot(tx - m.x, ty - m.y);

    if (distToTarget > 6) {
      m.x += (tx - m.x) * 4.5 * dt;
      m.y += (ty - m.y) * 4.5 * dt;
      m.walkTimer += dt * 12;
    }

    m.skills.forEach(s => s.cdRemaining = Math.max(0, s.cdRemaining - dt));
  });
}

function updateAssassin(dt) {
  if (!activeAssassin) return;
  if (player.isDead) return;
  const dx = player.x - activeAssassin.x;
  const dy = player.y - activeAssassin.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 38) {
    activeAssassin.x += (dx / dist) * activeAssassin.speed * dt;
    activeAssassin.y += (dy / dist) * activeAssassin.speed * dt;
  } else {
    damagePlayer(Math.round(180 * dt), "Revenge Mercenary");
    if (Math.random() < 0.1) spawnShards(player.x, player.y, '#e74c3c', 4);
  }
}

// Magnet Looting Update
function updateLoot(dt) {
  droppedLoot.forEach(gem => {
    // Land animation
    if (!gem.landed) {
      gem.x += (gem.targetX - gem.x) * 8 * dt;
      gem.y += (gem.targetY - gem.y) * 8 * dt;
      if (Math.hypot(gem.targetX - gem.x, gem.targetY - gem.y) < 2) gem.landed = true;
    }

    // Magnet to player
    const distToPlayer = Math.hypot(player.x - gem.x, player.y - gem.y);
    if (distToPlayer < 110) {
      gem.x += (player.x - gem.x) * 10 * dt;
      gem.y += (player.y - gem.y) * 10 * dt;

      if (distToPlayer < 20) {
        gem.life = -1;
        SoundEngine.playLoot();
        if (gem.type === "gold") {
          inventory.gold += 35;
          addDamageText(gem.x, gem.y, "+35G", false, '#ffd32a');
        } else if (gem.type === "gem") {
          inventory.gems += 1;
          addDamageText(gem.x, gem.y, "+1 GEM", false, '#54a0ff');
        } else {
          inventory.scales += 1;
          addDamageText(gem.x, gem.y, "+1 SCALE", false, '#ff6b6b');
        }
        saveGame();
      }
    }
  });
  droppedLoot = droppedLoot.filter(g => g.life > 0);
}

// Main Game Loop
let lastTime = performance.now();
function gameLoop(now) {
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (dt > 0.1) dt = 0.1;

  if (hitStopTimer > 0) {
    hitStopTimer -= dt;
    render();
    requestAnimationFrame(gameLoop);
    return;
  }

  // Elastic Squash return (Tween)
  player.squashX += (1.0 - player.squashX) * 14 * dt;
  player.squashY += (1.0 - player.squashY) * 14 * dt;
  bossState.squashX += (1.0 - bossState.squashX) * 9 * dt;
  bossState.squashY += (1.0 - bossState.squashY) * 9 * dt;

  if (player.attackSwingTimer > 0) player.attackSwingTimer -= dt;

  // Player Movement (WASD)
  if (!player.isDead) {
    let moveX = 0, moveY = 0;
    if (keys['w'] || keys['arrowup']) moveY -= 1;
    if (keys['s'] || keys['arrowdown']) moveY += 1;
    if (keys['a'] || keys['arrowleft']) moveX -= 1;
    if (keys['d'] || keys['arrowright']) moveX += 1;

    const moveLen = Math.hypot(moveX, moveY);
    if (moveLen > 0) {
      player.x += (moveX / moveLen) * player.speed * dt;
      player.y += (moveY / moveLen) * player.speed * dt;
      player.walkTimer += dt * 14;

      // Ripple effects when splashing in puddles
      waterPuddles.forEach(pad => {
        if (Math.hypot(player.x - pad.x, player.y - pad.y) < pad.rx) {
          if (Math.random() < 0.22) spawnRipple(player.x, player.y);
        }
      });
    } else {
      player.walkTimer = 0;
    }
  } else {
    player.walkTimer = 0;
  }

  // Dodge Roll Movement (I-Frame Dash)
  if (dashTimer > 0) {
    dashTimer -= dt;
    player.x += dashDirX * 380 * dt;
    player.y += dashDirY * 380 * dt;
    if (Math.random() < 0.35) {
      playerAfterimages.push({ x: player.x, y: player.y, alpha: 0.7, color: '#00f2fe' });
    }
  }
  if (dashCooldown > 0) dashCooldown -= dt;
  playerAfterimages.forEach(ai => { ai.alpha -= dt * 2.8; });
  playerAfterimages = playerAfterimages.filter(ai => ai.alpha > 0);

  // Dynamic Weather Lightning Strikes
  if (currentZone === "OpenWorld" && (currentWeather.name === "Rain" || currentWeather.name === "Thunderstorm")) {
    lightningTimer -= dt;
    if (lightningTimer <= 0) {
      lightningTimer = Math.random() * 8 + 6;
      const lx = player.x + (Math.random() - 0.5) * 340;
      const ly = player.y + (Math.random() - 0.5) * 240;
      spawnLightningStrike(lx, ly);
    }
  }
  activeLightningBolts.forEach(lb => { lb.life -= dt; });
  activeLightningBolts = activeLightningBolts.filter(lb => lb.life > 0);

  // Ambient Particles (Dust/Embers)
  ambientMotes.forEach(m => {
    m.y += m.vy * dt;
    m.x += m.vx * dt;
    if (m.y < -380) m.y = 380;
    if (m.x < -600) m.x = 600;
    if (m.x > 600) m.x = -600;
  });

  // Monsters Update (Roaming Mobs & Rift Boss)
  const currentMonsterList = currentZone === "OpenWorld" ? fieldMonsters : riftMonsters;
  currentMonsterList.forEach(mon => {
    if (mon.hp <= 0) return;
    const dx = player.x - mon.x;
    const dy = player.y - mon.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 260 && dist > 34) {
      mon.x += (dx / dist) * mon.speed * dt;
      mon.y += (dy / dist) * mon.speed * dt;
      mon.walkTimer = (mon.walkTimer || 0) + dt * 10;
    } else if (dist <= 34) {
      mon.attackTimer = (mon.attackTimer || 0) - dt;
      if (mon.attackTimer <= 0) {
        mon.attackTimer = mon.isBoss ? 1.4 : 1.8;
        damagePlayer(mon.isBoss ? 95 : 35, mon.name);
        SoundEngine.playHitCrunch(false);
      }
    }
  });

  // Tactical & Combo Timers
  comboTimer = Math.max(0, comboTimer - dt);
  holyShieldTimer = Math.max(0, holyShieldTimer - dt);
  mercenaryBuffTimer = Math.max(0, mercenaryBuffTimer - dt);

  // Water Ripples Animation
  waterRipples.forEach(r => {
    r.r += 24 * dt;
    r.alpha -= 0.8 * dt;
  });
  waterRipples = waterRipples.filter(r => r.alpha > 0);

  // Magma Scorches Fade
  groundScorches.forEach(s => { s.life -= dt; });
  groundScorches = groundScorches.filter(s => s.life > 0);

  // Camera Follow
  camera.x += (player.x - camera.x) * 6 * dt;
  camera.y += (player.y - camera.y) * 6 * dt;

  // Rain Drops Animation
  if (currentWeather.name === "Rain" || currentWeather.name === "Thunderstorm") {
    rainDrops.forEach(r => {
      r.y += r.speed * dt;
      r.x -= 80 * dt;
      if (r.y > 800) { r.y = -20; r.x = Math.random() * 1400; }
    });
  }

  if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 35);
  if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - dt * 2.5);

  player.skills.forEach(s => s.cdRemaining = Math.max(0, s.cdRemaining - dt));

  // Projectiles
  activeProjectiles.forEach(p => {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (currentZone === "OpenWorld" && Math.hypot(p.x - bossState.x, p.y - bossState.y) < 115) {
      bossState.hp = Math.max(0, bossState.hp - p.damage);
      addDamageText(bossState.x, bossState.y, p.damage, p.isCrit, p.color);
      spawnShards(p.x, p.y, p.color, 14);
      SoundEngine.playHitCrunch(p.isCrit);
      doHitStop(0.06);
      p.life = -1;
    } else if (activeAssassin && Math.hypot(p.x - activeAssassin.x, p.y - activeAssassin.y) < 38) {
      damageAssassin(p.damage, p.isCrit, p.color);
      p.life = -1;
    } else {
      const currentList = currentZone === "OpenWorld" ? fieldMonsters : riftMonsters;
      for (let mon of currentList) {
        if (mon.hp > 0 && Math.hypot(p.x - mon.x, p.y - mon.y) < (mon.isBoss ? 55 : 24)) {
          mon.hp -= p.damage;
          addDamageText(mon.x, mon.y - 12, p.damage, p.isCrit, p.color);
          spawnShards(mon.x, mon.y, p.color, 8);
          SoundEngine.playHitCrunch(p.isCrit);
          if (mon.hp <= 0) {
            addDamageText(mon.x, mon.y - 20, "SLAIN!", true, '#ffd700');
            spawnLootGem(mon.x, mon.y, "gold");
            if (mon.isBoss) { spawnLootGem(mon.x, mon.y, "gem"); spawnLootGem(mon.x, mon.y, "scale"); }
          }
          p.life = -1;
          break;
        }
      }
    }
  });
  activeProjectiles = activeProjectiles.filter(p => p.life > 0);

  // AoEs
  activeAoEs.forEach(a => {
    a.life -= dt; a.tickTimer -= dt;
    if (a.tickTimer <= 0) {
      a.tickTimer = 0.5;
      if (Math.hypot(a.x - bossState.x, a.y - bossState.y) < a.radius + 85) {
        bossState.hp = Math.max(0, bossState.hp - a.damage);
        addDamageText(bossState.x, bossState.y, a.damage, false, a.color);
        spawnShards(a.x, a.y, a.color, 6);
      }
      if (activeAssassin && Math.hypot(a.x - activeAssassin.x, a.y - activeAssassin.y) < a.radius + 25) {
        damageAssassin(a.damage, false, a.color);
      }
    }
  });
  activeAoEs = activeAoEs.filter(a => a.life > 0);

  pixelShards.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; });
  pixelShards = pixelShards.filter(s => s.life > 0);
  floatingNumbers.forEach(fn => { fn.y -= 35 * dt; fn.life -= dt; });
  floatingNumbers = floatingNumbers.filter(fn => fn.life > 0);

  updateBoss(dt);
  updateMercenaries(dt);
  updateAssassin(dt);
  updateLoot(dt);
  updateHUD();

  render();
  requestAnimationFrame(gameLoop);
}

// ==========================================
// 🎨 PROCEDURAL PIXEL ART RENDERER
// ==========================================

function drawPixelHero(ctx, x, y, walkTimer, swingTimer, aimAngle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(player.squashX, player.squashY);

  if (player.isDead) {
    ctx.rotate(Math.PI / 2); // Fallen to the ground
    ctx.globalAlpha = 0.75;
  }

  const bounce = player.isDead ? 0 : Math.sin(walkTimer) * 3;
  const legOffset = player.isDead ? 0 : Math.sin(walkTimer) * 4;

  // 1. Soft Dynamic Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Animated Flowing Red Cape (3-layer shading)
  ctx.fillStyle = '#5c0915';
  ctx.fillRect(-13, -6 + bounce, 26, 22);
  ctx.fillStyle = '#9e1424';
  ctx.fillRect(-11, -4 + bounce, 22, 20);
  ctx.fillStyle = '#d63031';
  ctx.fillRect(-9, 0 + bounce, 18, 16);
  // Cape wave edge
  const capeWave = Math.sin(walkTimer * 1.5) * 3;
  ctx.fillStyle = '#ff7675';
  ctx.fillRect(-9 + capeWave, 14 + bounce, 18, 3);

  // 3. Knight Legs & Steel Sabatons (Boots)
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(-8 - legOffset, 8 + bounce, 6, 12);
  ctx.fillRect(2 + legOffset, 8 + bounce, 6, 12);
  ctx.fillStyle = '#485460';
  ctx.fillRect(-9 - legOffset, 16 + bounce, 8, 5);
  ctx.fillRect(1 + legOffset, 16 + bounce, 8, 5);

  // 4. Steel Cuirass (Breastplate) with Gold Filigree
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(-9, -14 + bounce, 18, 22);
  ctx.fillStyle = '#57606f';
  ctx.fillRect(-7, -12 + bounce, 14, 18);
  ctx.fillStyle = '#747d8c';
  ctx.fillRect(-5, -10 + bounce, 10, 8);
  // Golden Crest / Trim
  ctx.fillStyle = '#ffd32a';
  ctx.fillRect(-3, -8 + bounce, 6, 12);
  ctx.fillRect(-6, -4 + bounce, 12, 3);

  // 5. Great Helm (Helmet) with Plume & Cyan Visor Glow
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(-8, -28 + bounce, 16, 15);
  ctx.fillStyle = '#57606f';
  ctx.fillRect(-6, -26 + bounce, 12, 11);
  ctx.fillStyle = '#a4b0be';
  ctx.fillRect(-5, -24 + bounce, 10, 3);
  // Visor Slit Glowing Cyan
  const visorPulse = 0.8 + Math.sin(performance.now() * 0.006) * 0.2;
  ctx.fillStyle = 'rgba(0, 230, 240, ' + visorPulse + ')';
  ctx.fillRect(-5, -20 + bounce, 10, 3);
  // Crimson Feathered Plume
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-2, -34 + bounce, 4, 7);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(-1, -36 + bounce, 2, 4);

  // 6. Two-Handed Claymore / Greatsword (Aimed at Mouse)
  ctx.save();
  ctx.rotate(aimAngle);

  const wpColor = WEAPON_COLORS[inventory.weaponLevel || 0];

  // Claymore Blade & Crossguard
  ctx.fillStyle = '#dcdde1';
  ctx.fillRect(12, -3, 34, 6);
  ctx.fillStyle = '#f5f6fa';
  ctx.fillRect(16, -2, 28, 4);
  // Golden Pommel & Crossguard
  ctx.fillStyle = '#e1b12c';
  ctx.fillRect(10, -9, 4, 18);
  ctx.fillRect(6, -2, 4, 4);
  // Runic Fuller Glow (Color scales with weapon enhancement tier!)
  ctx.fillStyle = wpColor;
  ctx.fillRect(20, -1, 18, 2);

  // Weapon Glow aura
  ctx.fillStyle = wpColor;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(14, -4, 32, 8);
  ctx.globalAlpha = 1.0;

  // Slash Arc Visual & Sparks
  if (swingTimer > 0) {
    const swingProgress = Math.min(1.0, swingTimer / 0.18);
    ctx.strokeStyle = wpColor;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, 52, -0.85, 0.85);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 0, 50, -0.75, 0.75);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

function drawPixelMercenary(ctx, m) {
  ctx.save();
  ctx.translate(m.x, m.y);

  if (m.hp <= 0) {
    ctx.rotate(0.35); // Kneeling downed posture
    ctx.globalAlpha = 0.65;
  }

  const bounce = m.hp <= 0 ? 0 : Math.sin(m.walkTimer) * 2.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (m.role === "Tank") {
    // Paladin: Emerald & Gold Bulwark Plate
    ctx.fillStyle = '#1b3c2e';
    ctx.fillRect(-10, -14 + bounce, 20, 24);
    ctx.fillStyle = '#10ac84';
    ctx.fillRect(-8, -12 + bounce, 16, 20);
    ctx.fillStyle = '#ffd32a';
    ctx.fillRect(-6, -6 + bounce, 12, 4);
    // Helmet
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(-8, -26 + bounce, 16, 14);
    ctx.fillStyle = '#2ed573';
    ctx.fillRect(-5, -20 + bounce, 10, 3);
    // Tower Shield with Golden Cross
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(8, -18 + bounce, 12, 28);
    ctx.fillStyle = '#10ac84';
    ctx.fillRect(10, -15 + bounce, 8, 22);
    ctx.fillStyle = '#ffd32a';
    ctx.fillRect(13, -12 + bounce, 2, 16);
    ctx.fillRect(11, -8 + bounce, 6, 2);
  } else if (m.role === "Healer") {
    // High Priestess: Holy White & Gold Robes
    ctx.fillStyle = '#dfe4ea';
    ctx.fillRect(-9, -14 + bounce, 18, 25);
    ctx.fillStyle = '#f1f2f6';
    ctx.fillRect(-7, -12 + bounce, 14, 21);
    ctx.fillStyle = '#feca57';
    ctx.fillRect(-5, -10 + bounce, 10, 4);
    // Cowl & Halo
    ctx.strokeStyle = 'rgba(254, 202, 87, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -26 + bounce, 11, 0, Math.PI * 2);
    ctx.stroke();
    // Priest Staff with Glowing Emerald Crystal
    ctx.fillStyle = '#834c24';
    ctx.fillRect(9, -28 + bounce, 3, 38);
    ctx.fillStyle = '#2ed573';
    ctx.beginPath();
    ctx.arc(10.5, -30 + bounce, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Astral Mage: Starry Purple Robes & Orbiting Arcane Orbs
    ctx.fillStyle = '#241242';
    ctx.fillRect(-8, -14 + bounce, 16, 25);
    ctx.fillStyle = '#5f27cd';
    ctx.fillRect(-6, -11 + bounce, 12, 20);
    // Pointed Wizard Hood
    ctx.fillStyle = '#341f97';
    ctx.beginPath();
    ctx.moveTo(-12, -22 + bounce);
    ctx.lineTo(12, -22 + bounce);
    ctx.lineTo(0, -42 + bounce);
    ctx.fill();
    // 3 Orbiting Arcane Motes
    const orbitTime = performance.now() * 0.005;
    for (let o = 0; o < 3; o++) {
      const ang = orbitTime + (o * Math.PI * 2 / 3);
      const ox = Math.cos(ang) * 18;
      const oy = Math.sin(ang) * 8 - 14 + bounce;
      ctx.fillStyle = o === 0 ? '#ff9ff3' : (o === 1 ? '#00d2d3' : '#ffd32a');
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = m.hp <= 0 ? '#ff4757' : '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  const label = m.hp <= 0 ? "⚠️ DOWNED (" + Math.max(0, Math.ceil(7.0 - (m.downedTimer || 0))) + "s)" : m.role;
  ctx.fillText(label, 0, -34);
  ctx.restore();
}

function drawGiantDragonValakas(ctx, boss) {
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.scale(boss.squashX, boss.squashY);

  const flap = Math.sin(performance.now() * 0.005) * 22;
  const breathe = Math.sin(performance.now() * 0.003) * 4;

  // 1. Massive Colossal Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.ellipse(0, 75, 140, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  const isNem = boss.isNemesis;
  const wingBase = isNem ? '#1f0426' : '#350507';
  const wingMid = isNem ? '#500e61' : '#730b10';
  const wingWeb = isNem ? '#8e24aa' : '#b71540';
  const bodyDark = isNem ? '#2c0438' : '#4a080c';
  const bodyPlate = isNem ? '#4a155c' : '#781218';
  const bodyHigh = isNem ? '#8e24aa' : '#c0392b';

  // 2. Colossal Dragon Wings (Outer Membrane)
  // Left Wing
  ctx.fillStyle = wingBase;
  ctx.beginPath();
  ctx.moveTo(-45, -25);
  ctx.lineTo(-240, -110 + flap);
  ctx.lineTo(-190, -10 + flap * 0.6);
  ctx.lineTo(-140, 50);
  ctx.lineTo(-50, 25);
  ctx.closePath();
  ctx.fill();

  // Right Wing
  ctx.beginPath();
  ctx.moveTo(45, -25);
  ctx.lineTo(240, -110 + flap);
  ctx.lineTo(190, -10 + flap * 0.6);
  ctx.lineTo(140, 50);
  ctx.lineTo(50, 25);
  ctx.closePath();
  ctx.fill();

  // Wing Webbing Shading (Vibrant Inner Crimson/Violet)
  ctx.fillStyle = wingMid;
  ctx.beginPath();
  ctx.moveTo(-40, -18);
  ctx.lineTo(-210, -90 + flap);
  ctx.lineTo(-165, -5 + flap * 0.5);
  ctx.lineTo(-120, 38);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(40, -18);
  ctx.lineTo(210, -90 + flap);
  ctx.lineTo(165, -5 + flap * 0.5);
  ctx.lineTo(120, 38);
  ctx.closePath();
  ctx.fill();

  // Wing Bone Ribs & Claws
  ctx.strokeStyle = wingWeb;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-45, -25); ctx.lineTo(-240, -110 + flap);
  ctx.moveTo(-45, -10); ctx.lineTo(-190, -10 + flap * 0.6);
  ctx.moveTo(45, -25); ctx.lineTo(240, -110 + flap);
  ctx.moveTo(45, -10); ctx.lineTo(190, -10 + flap * 0.6);
  ctx.stroke();

  // Wing Talons (Sharp Bone Spikes)
  ctx.fillStyle = '#f5f6fa';
  ctx.fillRect(-243, -113 + flap, 7, 7);
  ctx.fillRect(237, -113 + flap, 7, 7);

  // 3. Serrated Spinal Ridges / Tail Base
  ctx.fillStyle = '#1e272e';
  for (let spine = -4; spine <= 4; spine++) {
    ctx.fillRect(spine * 16 - 3, -65 + Math.abs(spine) * 4, 6, 12);
  }

  // 4. Main Torso Armor & Scaled Plates
  ctx.fillStyle = bodyDark;
  ctx.fillRect(-85, -60, 170, 130 + breathe);
  ctx.fillStyle = bodyPlate;
  ctx.fillRect(-65, -45, 130, 105 + breathe);
  ctx.fillStyle = bodyHigh;
  ctx.fillRect(-45, -30, 90, 80 + breathe);

  // 5. Pulsating Molten Magma Core (Chest)
  const chargeMult = boss.breathCharge || 0;
  const coreScale = 32 + Math.sin(performance.now() * 0.008) * 4 + chargeMult * 22;
  const coreGrad = ctx.createRadialGradient(0, 8, 4, 0, 8, coreScale);
  if (isNem) {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#00ffff');
    coreGrad.addColorStop(0.7, '#a29bfe');
    coreGrad.addColorStop(1, 'rgba(108, 92, 231, 0)');
  } else {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.25, '#fed330');
    coreGrad.addColorStop(0.65, '#ff4757');
    coreGrad.addColorStop(1, 'rgba(235, 47, 6, 0)');
  }
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 8, coreScale, 0, Math.PI * 2);
  ctx.fill();

  // 6. Massive Dragon Head & Horns
  ctx.fillStyle = bodyDark;
  ctx.fillRect(-50, 48, 100, 50);

  // Curving Demon Horns
  ctx.fillStyle = '#1e272e';
  // Outer Horns
  ctx.beginPath();
  ctx.moveTo(-45, 52); ctx.lineTo(-100, 15); ctx.lineTo(-35, 62); ctx.fill();
  ctx.moveTo(45, 52); ctx.lineTo(100, 15); ctx.lineTo(35, 62); ctx.fill();
  // Inner Horns
  ctx.beginPath();
  ctx.moveTo(-25, 50); ctx.lineTo(-65, 2); ctx.lineTo(-18, 58); ctx.fill();
  ctx.moveTo(25, 50); ctx.lineTo(65, 2); ctx.lineTo(18, 58); ctx.fill();

  // Jagged White Teeth & Jaws
  ctx.fillStyle = '#f1f2f6';
  ctx.fillRect(-38, 92, 8, 14);
  ctx.fillRect(-22, 92, 8, 10);
  ctx.fillRect(-6, 92, 8, 8);
  ctx.fillRect(10, 92, 8, 10);
  ctx.fillRect(26, 92, 8, 14);

  // Glowing Dragon Eyes (Amber / Radiant Cyan)
  const eyeColor = isNem ? '#00f2fe' : '#ffd32a';
  ctx.fillStyle = eyeColor;
  ctx.fillRect(-32, 62, 20, 10);
  ctx.fillRect(12, 62, 20, 10);
  // Slit Pupil
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(-23, 63, 4, 8);
  ctx.fillRect(21, 63, 4, 8);

  // If Nemesis: Stolen Golden Crown
  if (isNem) {
    ctx.fillStyle = '#ffd32a';
    ctx.beginPath();
    ctx.moveTo(-32, 46);
    ctx.lineTo(-32, 22);
    ctx.lineTo(-18, 34);
    ctx.lineTo(0, 16);
    ctx.lineTo(18, 34);
    ctx.lineTo(32, 22);
    ctx.lineTo(32, 46);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function render() {
  ctx.save();

  let shakeX = (Math.random() * 2 - 1) * screenShake;
  let shakeY = (Math.random() * 2 - 1) * screenShake;
  ctx.translate(canvas.width / 2 - camera.x + shakeX, canvas.height / 2 - camera.y + shakeY);

  // 1. Terrain & World Rendering
  if (currentZone === "OpenWorld") {
    // Detailed Gothic Dungeon Chunks with Flagstone Mortar
    const minChunkX = Math.floor((camera.x - canvas.width / 2) / CHUNK_SIZE) - 1;
    const maxChunkX = Math.floor((camera.x + canvas.width / 2) / CHUNK_SIZE) + 1;
    const minChunkY = Math.floor((camera.y - canvas.height / 2) / CHUNK_SIZE) - 1;
    const maxChunkY = Math.floor((camera.y + canvas.height / 2) / CHUNK_SIZE) + 1;

    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        const chunkWorldX = cx * CHUNK_SIZE;
        const chunkWorldY = cy * CHUNK_SIZE;

        const isEven = (Math.abs(cx) + Math.abs(cy)) % 2 === 0;
        ctx.fillStyle = isEven ? '#12151d' : '#0d0f17';
        ctx.fillRect(chunkWorldX, chunkWorldY, CHUNK_SIZE, CHUNK_SIZE);

        // Flagstone pavers & mortar lines (4x4 subdivided blocks)
        const paverSize = CHUNK_SIZE / 4;
        ctx.strokeStyle = '#08090d';
        ctx.lineWidth = 1.5;
        for (let px = 0; px < 4; px++) {
          for (let py = 0; py < 4; py++) {
            const bx = chunkWorldX + px * paverSize;
            const by = chunkWorldY + py * paverSize;
            ctx.strokeRect(bx, by, paverSize, paverSize);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
            ctx.fillRect(bx + 1, by + 1, paverSize - 2, 1.5);
            ctx.fillRect(bx + 1, by + 1, 1.5, paverSize - 2);

            const hash = Math.abs((cx * 37 + cy * 17 + px * 7 + py * 13) % 100);
            if (hash < 12) {
              ctx.fillStyle = 'rgba(16, 172, 132, 0.12)';
              ctx.fillRect(bx + 6, by + 6, 14, 10);
            } else if (hash > 88) {
              ctx.fillStyle = 'rgba(235, 47, 6, 0.12)';
              ctx.fillRect(bx + 8, by + 10, 18, 2.5);
            }
          }
        }
      }
    }

    // 1.5. Dynamic Water Puddles & Rippling
    waterPuddles.forEach(pad => {
      ctx.fillStyle = 'rgba(28, 45, 68, 0.45)';
      ctx.beginPath();
      ctx.ellipse(pad.x, pad.y, pad.rx, pad.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 180, 240, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.ellipse(pad.x - pad.rx * 0.25, pad.y - pad.ry * 0.25, pad.rx * 0.45, pad.ry * 0.35, -0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    waterRipples.forEach(r => {
      ctx.strokeStyle = 'rgba(130, 200, 255, ' + r.alpha + ')';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 1.6. Magma Fissures & Scorch Marks
    groundScorches.forEach(s => {
      const alpha = Math.min(1.0, s.life / 2.0);
      ctx.strokeStyle = 'rgba(255, 71, 87, ' + (alpha * 0.85) + ')';
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 211, 42, ' + (alpha * 0.9) + ')';
      ctx.lineWidth = s.width * 0.45;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    });

    // 1.7. 🏛️ Gothic Ruin Monoliths
    ruinPillars.forEach(p => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(p.x + 18, p.y + 24, 28, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1c1f2b';
      ctx.fillRect(p.x - 17, p.y - 28, 34, 56);
      ctx.fillStyle = '#2d3345';
      ctx.fillRect(p.x - 14, p.y - 25, 28, 50);
      ctx.fillStyle = '#485460';
      ctx.fillRect(p.x - 12, p.y - 23, 8, 46);

      ctx.fillStyle = p.runeColor;
      ctx.fillRect(p.x - 3, p.y - 12, 6, 4);
      ctx.fillRect(p.x - 1, p.y - 4, 2, 14);
      ctx.fillRect(p.x - 4, p.y + 12, 8, 3);

      ctx.fillStyle = '#1e272e';
      ctx.fillRect(p.x - 18, p.y - 34, 36, 8);
      const flameFlicker = Math.sin(performance.now() * 0.01 + p.x) * 3;
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 40 + flameFlicker, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd32a';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 39 + flameFlicker, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Town Ruin Buildings
    townBuildings.forEach(b => {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(b.x - 34, b.y - 28, 68, 68);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - 30, b.y - 30, 60, 60);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(b.x - 24, b.y - 24, 48, 48);
      ctx.fillStyle = '#d63031';
      ctx.fillRect(b.x - 12, b.y - 36, 24, 8);

      ctx.fillStyle = '#ffd32a';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.name + ' [T' + b.tier + ']', b.x, b.y - 42);
    });

    // 3. Dimensional Rift Portal
    riftPortal.angle += 0.04;
    ctx.save();
    ctx.translate(riftPortal.x, riftPortal.y);
    ctx.rotate(riftPortal.angle);
    ctx.fillStyle = 'rgba(113, 88, 226, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, riftPortal.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a29bfe';
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let arm = 0; arm < 4; arm++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#e056fd';
      ctx.fillRect(10, -3, 24, 6);
    }
    ctx.restore();
    ctx.fillStyle = '#ff7979';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("🌀 차원 균열 (Rift Portal) [F]", riftPortal.x, riftPortal.y - 56);
  } else {
    // 🌌 Abyssal Void Island (Rift Dungeon)
    ctx.fillStyle = '#06050b';
    ctx.fillRect(camera.x - canvas.width, camera.y - canvas.height, canvas.width * 2, canvas.height * 2);

    // Floating Void Island Platform
    ctx.fillStyle = '#130d24';
    ctx.beginPath();
    ctx.ellipse(0, 0, 480, 310, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5f27cd';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Cosmic Fissures on Void Stone
    ctx.strokeStyle = '#a29bfe';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-160, -50); ctx.lineTo(-50, 15); ctx.lineTo(60, -30); ctx.lineTo(170, 40);
    ctx.moveTo(-80, 70); ctx.lineTo(20, 30); ctx.lineTo(110, 95);
    ctx.stroke();

    // Return Shrine Portal (Back to Open World)
    ctx.save();
    ctx.translate(0, -170);
    ctx.rotate(-performance.now() * 0.0035);
    ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2ed573';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#2ed573';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("🌀 오픈월드 귀환 성소 [F]", 0, -220);
  }

  // 3.5. Draw Roaming Mobs / Rift Chimera Boss
  const activeMons = currentZone === "OpenWorld" ? fieldMonsters : riftMonsters;
  activeMons.forEach(mon => {
    if (mon.hp <= 0) return;
    ctx.save();
    ctx.translate(mon.x, mon.y);

    // Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 12, mon.isBoss ? 32 : 12, mon.isBoss ? 12 : 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const bounce = Math.sin((mon.walkTimer || 0) * 1.5) * 2;

    if (mon.isBoss) {
      // Chimera Boss: 3-Headed Beast with Multi-Element Auras
      ctx.fillStyle = '#48185c';
      ctx.fillRect(-28, -26 + bounce, 56, 42);
      ctx.fillStyle = '#8e24aa';
      ctx.fillRect(-22, -22 + bounce, 44, 34);

      // 3 Glowing Head Cores (Fire Dragon, Frost Serpent, Holy Lion)
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(-24, -36 + bounce, 12, 12);
      ctx.fillStyle = '#00d2d3';
      ctx.fillRect(-6, -42 + bounce, 12, 12);
      ctx.fillStyle = '#ffd32a';
      ctx.fillRect(12, -36 + bounce, 12, 12);
    } else if (mon.type === "Skeleton") {
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-6, -10 + bounce, 12, 18);
      ctx.fillStyle = mon.color;
      ctx.fillRect(-5, -20 + bounce, 10, 9);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(-3, -17 + bounce, 2, 2);
      ctx.fillRect(1, -17 + bounce, 2, 2);
      ctx.fillStyle = '#dcdde1';
      ctx.fillRect(7, -14 + bounce, 3, 16);
    } else {
      // Wisp / Floating Void Skull
      ctx.fillStyle = mon.color;
      ctx.beginPath();
      ctx.arc(0, -6 + bounce, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -6 + bounce, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Monster HP Bar
    const hpRatio = Math.max(0, mon.hp / mon.maxHP);
    const barW = mon.isBoss ? 64 : 26;
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(-barW / 2, -32, barW, 4);
    ctx.fillStyle = mon.isBoss ? '#e056fd' : '#ff4757';
    ctx.fillRect(-barW / 2, -32, barW * hpRatio, 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(mon.name, 0, -36);
    ctx.restore();
  });

  // 4. Telegraph Warning Floor
  if (bossState.activeTelegraph) {
    const tel = bossState.activeTelegraph;
    ctx.fillStyle = 'rgba(255, 56, 56, 0.38)';
    ctx.strokeStyle = '#ff3838';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tel.x, tel.y, tel.radius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.strokeStyle = '#ff9f43';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(tel.x, tel.y, tel.radius * (0.4 + (bossState.breathCharge || 0) * 0.6), 0, Math.PI * 2);
    ctx.stroke();
  }

  // 5. AoE Zones
  activeAoEs.forEach(a => {
    ctx.fillStyle = a.color + '44';
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  });

  // 6. Draw Dropped Loot Gems (Faceted Diamond Shading)
  droppedLoot.forEach(gem => {
    ctx.save();
    const bob = Math.sin(performance.now() * 0.008 + gem.x) * 4;
    const gx = gem.x;
    const gy = gem.y + bob;

    // Gem drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(gx, gy + 8, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Diamond polygon
    ctx.fillStyle = gem.color;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 6);
    ctx.lineTo(gx + 6, gy);
    ctx.lineTo(gx, gy + 7);
    ctx.lineTo(gx - 6, gy);
    ctx.closePath();
    ctx.fill();

    // Top-left facet reflection
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(gx, gy - 6);
    ctx.lineTo(gx + 3, gy);
    ctx.lineTo(gx, gy - 1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  });

  // 7. Draw Giant Boss
  if (currentZone === "OpenWorld" && bossState.hp > 0) {
    drawGiantDragonValakas(ctx, bossState);
  }

  // 8. Draw Mercenaries
  mercenaries.forEach(m => drawPixelMercenary(ctx, m));

  // 9. Draw Assassin
  if (activeAssassin) {
    ctx.save();
    ctx.translate(activeAssassin.x, activeAssassin.y);
    ctx.fillStyle = '#2c2c54';
    ctx.fillRect(-8, -12, 16, 24);
    ctx.fillStyle = '#ff5252';
    ctx.fillRect(-6, -22, 12, 10);
    ctx.fillStyle = '#ff5252';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("배반 암살자", 0, -28);
    ctx.restore();
  }

  // 9.5. Draw Player Dash Afterimages
  playerAfterimages.forEach(ai => {
    ctx.save();
    ctx.translate(ai.x, ai.y);
    ctx.globalAlpha = ai.alpha * 0.45;
    ctx.fillStyle = ai.color;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-8, -26, 16, 36);
    ctx.restore();
  });

  // 10. Draw Player Hero
  const mouseWorldX = mousePos.x - canvas.width / 2 + camera.x;
  const mouseWorldY = mousePos.y - canvas.height / 2 + camera.y;
  const aimAngle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
  drawPixelHero(ctx, player.x, player.y, player.walkTimer, player.attackSwingTimer, aimAngle);

  // 10.5. Holy Protective Barrier Dome
  if (holyShieldTimer > 0) {
    const pulse = Math.sin(performance.now() * 0.008) * 4;
    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 115 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
    ctx.fill();

    const shieldAng = performance.now() * 0.0025;
    for (let g = 0; g < 6; g++) {
      const a = shieldAng + (g * Math.PI / 3);
      const gx = player.x + Math.cos(a) * (115 + pulse);
      const gy = player.y + Math.sin(a) * (115 + pulse);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx - 3, gy - 3, 6, 6);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(gx - 2, gy - 2, 4, 4);
    }
    ctx.restore();
  }

  // 11. Projectiles, Shards, Floating Numbers
  activeProjectiles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  });
  pixelShards.forEach(s => {
    ctx.fillStyle = s.color; ctx.fillRect(s.x, s.y, s.size, s.size);
  });
  floatingNumbers.forEach(fn => {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold ' + fn.size + 'px Consolas';
    ctx.textAlign = 'center';
    ctx.fillText(fn.text, fn.x + 1, fn.y + 1);
    ctx.fillStyle = fn.color;
    ctx.fillText(fn.text, fn.x, fn.y);
  });

  // 12. Dynamic HD-2D Lighting Glows
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // Player torchlight / cyan aura
  const pGlow = ctx.createRadialGradient(player.x, player.y, 8, player.x, player.y, 180);
  pGlow.addColorStop(0, 'rgba(0, 210, 211, 0.16)');
  pGlow.addColorStop(0.6, 'rgba(254, 202, 87, 0.05)');
  pGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = pGlow;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 180, 0, Math.PI * 2);
  ctx.fill();

  // Dragon Molten Core Glow
  if (bossState.hp > 0) {
    const bGlow = ctx.createRadialGradient(bossState.x, bossState.y + 10, 15, bossState.x, bossState.y + 10, 240);
    if (bossState.isNemesis) {
      bGlow.addColorStop(0, 'rgba(162, 155, 254, 0.28)');
      bGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      bGlow.addColorStop(0, 'rgba(255, 71, 87, 0.28)');
      bGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = bGlow;
    ctx.beginPath();
    ctx.arc(bossState.x, bossState.y + 10, 240, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 13. Tactical FoV Lighting Mask
  ctx.save();
  ctx.fillStyle = 'rgba(2, 3, 6, 0.48)';
  ctx.beginPath();
  ctx.rect(camera.x - canvas.width, camera.y - canvas.height, canvas.width * 2, canvas.height * 2);
  ctx.arc(player.x, player.y, 250, aimAngle - 0.82, aimAngle + 0.82, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 14. Weather Rain Streaks
  if (currentWeather.name === "Rain" || currentWeather.name === "Thunderstorm") {
    ctx.strokeStyle = 'rgba(120, 180, 240, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    rainDrops.forEach(r => {
      ctx.moveTo(r.x + camera.x - canvas.width / 2, r.y + camera.y - canvas.height / 2);
      ctx.lineTo(r.x + camera.x - canvas.width / 2 - 4, r.y + camera.y - canvas.height / 2 + r.len);
    });
    ctx.stroke();
  }

  ctx.restore();

  // Screen Flash
  if (flashAlpha > 0.01 && flashColor) {
    ctx.fillStyle = flashColor;
    ctx.globalAlpha = flashAlpha;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
  }
}

function updateHUD() {
  document.getElementById('playerClassName').innerText = '👑 CLASS: ' + playerClass.className;
  document.getElementById('playerArchetype').innerText = 'Role: ' + playerClass.archetype + ' | Weapon: ' + (playerClass.weaponType || 'Greatsword');
  document.getElementById('classIdSpan').innerText = playerClass.id || 1;

  const playerRatio = Math.max(0, player.hp / player.maxHP);
  document.getElementById('playerHPBar').style.width = (playerRatio * 100) + '%';
  document.getElementById('playerHPText').innerText = Math.round(player.hp) + ' / ' + player.maxHP;

  const bossRatio = Math.max(0, bossState.hp / bossState.maxHP);
  document.getElementById('bossHPBar').style.width = (bossRatio * 100) + '%';
  document.getElementById('bossHPText').innerText = bossState.hp + ' / ' + bossState.maxHP + ' (' + Math.round(bossRatio * 100) + '%)';
  document.getElementById('bossName').innerText = '⚔️ ' + bossState.title + ' - PHASE ' + bossState.phase + ' ⚔️';

  const keysLabel = ['L-Click', 'Q', 'E', 'R'];
  const skillListHtml = player.skills.map((s, i) => {
    const isReady = s.cdRemaining <= 0;
    const mult = currentWeather.elementalMultipliers[s.element] || 1.0;
    const bonusText = mult > 1.0 ? ' <span style="color:#2ed573;">+' + Math.round((mult-1)*100) + '%</span>' : (mult < 1.0 ? ' <span style="color:#ff4757;">' + Math.round((mult-1)*100) + '%</span>' : '');
    const statusText = isReady ? '<span class="skill-ready">[READY]</span>' : '<span class="skill-cd">(' + s.cdRemaining.toFixed(1) + 's)</span>';
    return '<div class="skill-slot"><span>[' + keysLabel[i] + '] ' + s.skillName.substring(0, 14) + ' (' + s.element + bonusText + ')</span>' + statusText + '</div>';
  }).join('');
  document.getElementById('skillSlotList').innerHTML = skillListHtml;

  const mercListHtml = mercenaries.map((m, i) => {
    const hpRatio = Math.max(0, m.hp / m.maxHP);
    return '<div class="merc-item">' +
      '<div style="display:flex; justify-content:space-between; font-weight:bold; color:' + m.color + ';">' +
      '<span>Slot ' + (i+1) + ': ' + m.classData.className.substring(0, 14) + '</span>' +
      '<span>[' + m.role + ']</span>' +
      '</div>' +
      '<div class="bar-container" style="height:8px; margin:2px 0;">' +
      '<div class="bar-fill hp-fill" style="width:' + (hpRatio * 100) + '%;"></div>' +
      '</div>' +
      '<div style="font-size:10px; color:#aaa;">State: <strong>' + m.state + '</strong></div>' +
      '</div>';
  }).join('');
  document.getElementById('mercPartyList').innerHTML = mercListHtml;

  document.getElementById('weatherTitle').innerText = '🌦️ WEATHER: ' + currentWeather.displayName;
  document.getElementById('weatherDesc').innerText = currentWeather.specialEffects;

  document.getElementById('goldCount').innerText = inventory.gold;
  document.getElementById('gemCount').innerText = inventory.gems;
  document.getElementById('scaleCount').innerText = inventory.scales;

  const wpLvl = inventory.weaponLevel || 0;
  const wpEl = document.getElementById('weaponLevelText');
  if (wpEl) {
    wpEl.innerText = WEAPON_NAMES[wpLvl];
    wpEl.style.color = WEAPON_COLORS[wpLvl];
  }
}

requestAnimationFrame(gameLoop);
</script>
</body>
</html>
`;

fs.writeFileSync('SeamlessPixelRPG/pixel_rpg_playable_test.html', htmlContent, 'utf-8');
console.log('✨ Steam Master Edition with Procedural Audio & Persistent Loot built successfully!');
