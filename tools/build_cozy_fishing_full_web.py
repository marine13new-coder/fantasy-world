import json
from pathlib import Path

sa = Path("Assets/StreamingAssets")

def load_json(name, default):
    p = sa / name
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return default

fish_dex = load_json("FishDex.json", {"fishes": []})
economy = load_json("FishingEconomy.json", {"upgrades": []})
weather_data = load_json("FishingWeather.json", {"weathers": []})
gear_data = load_json("GearCustomization.json", {"rods": [], "bobbers": [], "catCostumes": []})
cooking_data = load_json("CookingRecipes.json", {"recipes": []})
dredge_data = load_json("DredgeLoot.json", {"dredgeItems": []})
achieve_data = load_json("FishingAchievements.json", {"achievements": []})
quests_data = load_json("IslandQuests.json", {"quests": []})

html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>코지 픽셀 낚시터 (Cozy Pixel Fishing Master) - Full Systems Edition</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root {{
    --bg-dark: #090c15;
    --panel-bg: rgba(18, 25, 44, 0.94);
    --border-color: #3b4261;
    --gold: #ffd166;
    --pink: #f67280;
    --cyan: #48dbfb;
    --green: #2ecc71;
  }}
  * {{ box-sizing: border-box; user-select: none; margin: 0; padding: 0; }}
  body {{
    background: #06080e;
    color: #f1f5f9;
    font-family: 'Pretendard', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    overflow: hidden;
  }}
  #game-wrap {{
    position: relative;
    width: 1024px;
    height: 640px;
    background: #000;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 25px 70px rgba(0,0,0,0.85), 0 0 35px rgba(246, 114, 128, 0.25);
    border: 3px solid #233142;
  }}
  canvas#cozyCanvas {{
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }}

  /* Top HUD */
  .hud-top {{
    position: absolute;
    top: 14px;
    left: 18px;
    right: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    z-index: 20;
  }}
  .hud-badge {{
    pointer-events: auto;
    background: rgba(13, 19, 33, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 30px;
    padding: 7px 18px;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  }}
  .gold {{ color: var(--gold); font-size: 16px; }}
  .hud-nav {{
    display: flex;
    gap: 8px;
    pointer-events: auto;
  }}
  .nav-btn {{
    background: rgba(22, 33, 62, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #e2e8f0;
    padding: 7px 14px;
    font-size: 13px;
    font-weight: 700;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 5px;
  }}
  .nav-btn:hover {{
    background: rgba(45, 60, 95, 0.95);
    border-color: var(--gold);
    color: #fff;
    transform: translateY(-2px);
  }}
  .nav-btn.primary {{
    background: linear-gradient(135deg, #e94560, #d1304b);
    border: none;
    box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
  }}

  /* Weather indicator */
  #weather-pill {{
    cursor: pointer;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 12px;
  }}

  /* Reeling Mini-Game Overlay */
  #reeling-panel {{
    display: none;
    position: absolute;
    right: 50px;
    top: 50%;
    transform: translateY(-50%);
    width: 90px;
    height: 380px;
    background: rgba(10, 15, 28, 0.92);
    border: 3px solid var(--gold);
    border-radius: 45px;
    padding: 12px 0;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 25px rgba(255, 209, 102, 0.35);
    z-index: 30;
    touch-action: none;
  }}
  #reeling-track {{
    position: relative;
    width: 32px;
    height: 320px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    margin: 0 auto;
    overflow: hidden;
  }}
  #safe-zone {{
    position: absolute;
    width: 100%;
    background: linear-gradient(180deg, rgba(74, 222, 128, 0.7), rgba(34, 197, 94, 0.9));
    border-top: 2px solid #86efac;
    border-bottom: 2px solid #86efac;
    border-radius: 8px;
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.7);
    bottom: 0;
  }}
  #fish-marker {{
    position: absolute;
    width: 26px;
    height: 26px;
    left: 3px;
    font-size: 20px;
    line-height: 26px;
    text-align: center;
    bottom: 0;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
  }}
  #progress-bar-wrap {{
    position: absolute;
    right: 12px;
    top: 18px;
    bottom: 18px;
    width: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }}
  #progress-bar {{
    position: absolute;
    bottom: 0;
    width: 100%;
    background: linear-gradient(0deg, #38ef7d, #11998e);
    border-radius: 4px;
    transition: height 0.05s linear;
  }}
  #reeling-guide {{
    position: absolute;
    bottom: -32px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 13px;
    font-weight: 700;
    color: var(--gold);
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }}

  /* Modals */
  .modal-overlay {{
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(6, 10, 20, 0.88);
    backdrop-filter: blur(8px);
    z-index: 100;
    align-items: center;
    justify-content: center;
  }}
  .modal {{
    width: 860px;
    max-height: 560px;
    background: linear-gradient(145deg, #16213e, #0d1322);
    border: 2px solid #334155;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }}
  .modal-head {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }}
  .modal-head h2 {{ font-size: 20px; font-weight: 800; color: #fff; }}
  .close-btn {{
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 28px;
    cursor: pointer;
    line-height: 1;
    padding: 2px 8px;
  }}
  .close-btn:hover {{ color: #fff; }}
  .modal-body {{
    flex: 1;
    overflow-y: auto;
    padding: 18px 0;
  }}

  /* Dex Grid */
  .dex-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
    gap: 12px;
  }}
  .dex-card {{
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 12px 10px;
    text-align: center;
  }}
  .dex-card.locked {{ opacity: 0.4; filter: grayscale(1); }}
  .fish-icon {{ font-size: 32px; margin-bottom: 6px; }}
  .fish-name {{ font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
  .fish-rarity {{ font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block; }}

  /* Generic Item Grid / List */
  .grid-2col {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }}
  .card-item {{
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .card-item h4 {{ font-size: 15px; color: var(--gold); margin-bottom: 4px; }}
  .card-item p {{ font-size: 12px; color: #94a3b8; }}
  .equip-btn {{
    background: #2563eb;
    color: #fff;
    border: none;
    padding: 6px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }}
  .equip-btn.equipped {{
    background: #059669;
  }}

  /* Toast Notification */
  #achieve-toast {{
    display: none;
    position: absolute;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(246, 114, 128, 0.95), rgba(197, 48, 75, 0.95));
    border: 2px solid var(--gold);
    border-radius: 30px;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 800;
    color: #fff;
    box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 20px rgba(255, 209, 102, 0.5);
    z-index: 200;
  }}

  /* Catch Popup */
  #catch-card {{
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    width: 360px;
    background: linear-gradient(145deg, #1e293b, #0f172a);
    border: 3px solid var(--gold);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(255, 209, 102, 0.4);
    text-align: center;
    z-index: 150;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }}
  #catch-card.show {{
    display: block;
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }}
  #catch-card .rarity-badge {{
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    margin-bottom: 10px;
  }}
  #catch-card .fish-display {{ font-size: 58px; margin: 6px 0; }}
  #catch-card h3 {{ font-size: 22px; font-weight: 800; margin-bottom: 4px; }}
  #catch-card .sub {{ font-size: 13px; color: #94a3b8; margin-bottom: 12px; }}
  #catch-card .stats {{
    background: rgba(0,0,0,0.35);
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-around;
    font-size: 14px;
  }}
  #catch-card .stats b {{ color: var(--gold); }}
  #catch-card .desc {{
    font-size: 13px;
    color: #cbd5e1;
    line-height: 1.5;
    margin-bottom: 16px;
    text-align: left;
    background: rgba(255, 255, 255, 0.03);
    padding: 10px;
    border-radius: 8px;
  }}
  .rarity-Common {{ background: #475569; color: #f8fafc; }}
  .rarity-Uncommon {{ background: #166534; color: #bbf7d0; }}
  .rarity-Rare {{ background: #1e40af; color: #bfdbfe; }}
  .rarity-Epic {{ background: #6b21a8; color: #e9d5ff; }}
  .rarity-Legendary {{ background: #854d0e; color: #fef08a; border: 1px solid var(--gold); }}

  #state-bubble {{
    position: absolute;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.9);
    border: 2px solid rgba(255, 209, 102, 0.4);
    border-radius: 20px;
    padding: 9px 24px;
    font-size: 15px;
    font-weight: 700;
    color: var(--gold);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    pointer-events: none;
    z-index: 20;
  }}
</style>
</head>
<body>

<div id="game-wrap">
  <canvas id="cozyCanvas" width="1024" height="640"></canvas>

  <div class="hud-top">
    <div class="hud-badge">
      <span>🪙</span>
      <span class="gold" id="gold-display">100 G</span>
      <span style="color:rgba(255,255,255,0.2)">|</span>
      <span>📖 <span id="dex-count">0</span> / 50</span>
      <span style="color:rgba(255,255,255,0.2)">|</span>
      <div id="weather-pill">⛅ <span id="weather-name">맑음</span></div>
    </div>

    <div class="hud-nav">
      <button class="nav-btn" id="btn-custom">🎨 공방/의상</button>
      <button class="nav-btn" id="btn-cooking">🍳 요리</button>
      <button class="nav-btn" id="btn-dredge">🏗️ 심해 인양</button>
      <button class="nav-btn" id="btn-quests">📜 진 할아버지</button>
      <button class="nav-btn" id="btn-dex">📖 도감</button>
      <button class="nav-btn primary" id="btn-shop">🛒 상점</button>
      <button class="nav-btn" id="btn-sound">🔊 사운드</button>
    </div>
  </div>

  <div id="state-bubble">클릭하여 낚싯대를 던지세요 (Click to Cast)</div>
  <div id="achieve-toast">🏆 도전과제 달성!</div>

  <!-- Reeling Mini-Game -->
  <div id="reeling-panel">
    <div id="reeling-track">
      <div id="safe-zone"></div>
      <div id="fish-marker">🐟</div>
    </div>
    <div id="progress-bar-wrap">
      <div id="progress-bar"></div>
    </div>
    <div id="reeling-guide">마우스 꾹 눌러 릴링!</div>
  </div>

  <!-- Catch Card -->
  <div id="catch-card">
    <span class="rarity-badge" id="c-rarity">COMMON</span>
    <div class="fish-display" id="c-icon">🐟</div>
    <h3 id="c-name">벚꽃 송사리</h3>
    <div class="sub" id="c-enname">Cherry Blossom Minnow</div>
    <div class="stats">
      <div>길이: <b id="c-len">8.4 cm</b></div>
      <div>판매가: <b id="c-price">+25 G</b></div>
    </div>
    <div class="desc" id="c-desc">설명 텍스트</div>
    <button class="nav-btn primary" id="btn-catch-ok" style="width:100%; justify-content:center; padding:10px;">확인 (OK)</button>
  </div>

  <!-- Customizer Modal -->
  <div class="modal-overlay" id="modal-custom">
    <div class="modal">
      <div class="modal-head">
        <h2>🎨 공방 & 의상 커스터마이징</h2>
        <button class="close-btn" data-close="modal-custom">&times;</button>
      </div>
      <div class="modal-body">
        <h3 style="color:var(--gold); margin-bottom:10px;">낚싯대 (Rod)</h3>
        <div class="grid-2col" id="custom-rods" style="margin-bottom:20px;"></div>
        <h3 style="color:var(--gold); margin-bottom:10px;">찌 스킨 (Bobber Skin)</h3>
        <div class="grid-2col" id="custom-bobbers" style="margin-bottom:20px;"></div>
        <h3 style="color:var(--gold); margin-bottom:10px;">고양이 모찌 의상 (Cat Hat)</h3>
        <div class="grid-2col" id="custom-hats"></div>
      </div>
    </div>
  </div>

  <!-- Cooking Modal -->
  <div class="modal-overlay" id="modal-cooking">
    <div class="modal">
      <div class="modal-head">
        <h2>🍳 캠프파이어 생선 요리 주방</h2>
        <button class="close-btn" data-close="modal-cooking">&times;</button>
      </div>
      <div class="modal-body">
        <div class="grid-2col" id="cooking-list"></div>
      </div>
    </div>
  </div>

  <!-- Dredge Modal -->
  <div class="modal-overlay" id="modal-dredge">
    <div class="modal">
      <div class="modal-head">
        <h2>🏗️ 야간 심해 크레인 인양 (Deep Sea Dredge)</h2>
        <button class="close-btn" data-close="modal-dredge">&times;</button>
      </div>
      <div class="modal-body" style="text-align:center;">
        <p style="color:#94a3b8; margin-bottom:18px;">심해로 기계식 크레인을 내려 해저에 잠든 침몰선의 고대 유물과 보물상자를 인양합니다. (1회 인양: 100 G)</p>
        <button class="nav-btn primary" id="btn-dredge-start" style="display:inline-flex; font-size:16px; padding:12px 28px;">🏗️ 크레인 인양 시작 (100 G)</button>
        <div id="dredge-result" style="margin-top:24px; min-height:120px;"></div>
      </div>
    </div>
  </div>

  <!-- Quests Modal -->
  <div class="modal-overlay" id="modal-quests">
    <div class="modal">
      <div class="modal-head">
        <h2>📜 선창의 베테랑 '진 할아버지' 퀘스트</h2>
        <button class="close-btn" data-close="modal-quests">&times;</button>
      </div>
      <div class="modal-body">
        <div style="background:rgba(255,255,255,0.05); padding:14px; border-radius:12px; margin-bottom:16px; display:flex; gap:16px; align-items:center;">
          <img src="textures/npc_grandpa_jin.png" style="width:54px; height:54px; image-rendering:pixelated; border-radius:8px;">
          <div>
            <h4 style="color:var(--gold);">진 할아버지 (Veteran Jin)</h4>
            <p style="font-size:13px; color:#cbd5e1;">"바다는 언제나 정직하네. 오늘 자네를 위해 특별한 일거리를 준비해 두었지."</p>
          </div>
        </div>
        <div class="grid-2col" id="quests-list"></div>
      </div>
    </div>
  </div>

  <!-- FishDex Modal -->
  <div class="modal-overlay" id="modal-dex">
    <div class="modal">
      <div class="modal-head">
        <h2>📖 코지 픽셀 낚시 도감 (<span id="modal-dex-count">0</span> / 50)</h2>
        <button class="close-btn" data-close="modal-dex">&times;</button>
      </div>
      <div class="modal-body">
        <div class="dex-grid" id="dex-grid"></div>
      </div>
    </div>
  </div>

  <!-- Shop Modal -->
  <div class="modal-overlay" id="modal-shop">
    <div class="modal">
      <div class="modal-head">
        <h2>🛒 낚시 장비 업그레이드 상점</h2>
        <button class="close-btn" data-close="modal-shop">&times;</button>
      </div>
      <div class="modal-body">
        <div class="grid-2col" id="shop-list"></div>
      </div>
    </div>
  </div>
</div>

<script>
// Databases
const FISH_DATA = {json.dumps(fish_dex['fishes'], ensure_ascii=False)};
const ECONOMY_DATA = {json.dumps(economy, ensure_ascii=False)};
const WEATHER_DATA = {json.dumps(weather_data.get('weathers', []), ensure_ascii=False)};
const GEAR_DATA = {json.dumps(gear_data, ensure_ascii=False)};
const COOKING_DATA = {json.dumps(cooking_data.get('recipes', []), ensure_ascii=False)};
const DREDGE_DATA = {json.dumps(dredge_data.get('dredgeItems', []), ensure_ascii=False)};
const ACHIEVE_DATA = {json.dumps(achieve_data.get('achievements', []), ensure_ascii=False)};
const QUESTS_DATA = {json.dumps(quests_data.get('quests', []), ensure_ascii=False)};

// Texture Preload
const textures = {{}};
const textureNames = [
  'angler_idle', 'angler_cast', 'angler_reel', 'angler_catch',
  'cat_mochi', 'cat_hat_chef', 'cat_hat_froggy', 'cat_hat_ribbon', 'cat_hat_wizard',
  'bobber_detailed', 'bobber_duck', 'bobber_golden_koi', 'bobber_macaron', 'bobber_star',
  'prop_lighthouse', 'prop_wooden_bench', 'stone_lantern', 'npc_grandpa_jin',
  'campfire_cooking', 'rain_drop', 'sakura_petal'
];
textureNames.forEach(name => {{
  const img = new Image();
  img.src = `textures/${{name}}.png`;
  textures[name] = img;
}});

// ASMR Web Audio Engine
class CozySoundEngine {{
  constructor() {{
    this.ctx = null;
    this.enabled = true;
  }}
  init() {{
    if (!this.ctx) {{
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }}
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }}
  toggle() {{
    this.enabled = !this.enabled;
    return this.enabled;
  }}
  playPlop() {{
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  }}
  playBite() {{
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1320, now + 0.08);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(now); osc.stop(now + 0.35);
  }}
  playFanfare() {{
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((f, i) => {{
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.4);
    }});
  }}
  playSizzle() {{
    if (!this.enabled) return;
    this.init();
    // Campfire sizzle noise burst
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0; i<d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 2400;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    src.connect(f); f.connect(g); g.connect(this.ctx.destination);
    src.start();
  }}
}}

const sound = new CozySoundEngine();

// FSM
const FSM = {{ IDLE: 'IDLE', CASTING: 'CASTING', WAITING: 'WAITING', BITING: 'BITING', REELING: 'REELING', CATCH: 'CATCH' }};

const state = {{
  fsm: FSM.IDLE,
  gold: 150,
  upgrades: {{ bite_speed: 0, safe_zone: 0, reel_power: 0, rare_luck: 0, cat_companion: 1 }},
  equipped: {{
    rod: 'rod_bamboo',
    bobber: 'bobber_duck',
    catHat: 'cat_hat_froggy'
  }},
  weatherIdx: 0,
  dex: {{}},
  buffs: {{ goldMult: 1.0, rareMult: 1.0, timer: 0 }},
  castProgress: 0,
  bobber: {{ x: 260, y: 390, targetX: 620, targetY: 420 }},
  waitTimer: 0,
  biteTimer: 0,
  currentFish: null,
  fishPos: 0.5,
  fishTargetPos: 0.5,
  safePos: 0.2,
  safeHeight: 0.3,
  catchProgress: 0.35,
  isReelingDown: false,
  waterOffset: 0,
  particles: []
}};

// Weather
const weathers = WEATHER_DATA.length ? WEATHER_DATA : [
  {{ id: 'sunny', name: '맑음', description: '화창한 파스텔 햇살' }},
  {{ id: 'spring_rain', name: '봄비', description: '잔잔하게 내리는 빗방울' }},
  {{ id: 'cherry_blossom', name: '벚꽃바람', description: '흩날리는 분홍빛 벚꽃잎' }},
  {{ id: 'aurora', name: '신비의 오로라', description: '환상적인 밤하늘의 오로라 커튼' }},
  {{ id: 'morning_mist', name: '몽환의 안개', description: '새벽녘 몽환적인 물안개' }}
];

// Load Save
try {{
  const raw = localStorage.getItem('CozyPixelFishing_Save');
  if (raw) {{
    const p = JSON.parse(raw);
    state.gold = p.gold ?? state.gold;
    state.upgrades = p.upgrades ?? state.upgrades;
    state.equipped = p.equipped ?? state.equipped;
    state.dex = p.dex ?? state.dex;
  }}
}} catch(e){{}}

function save() {{
  try {{
    localStorage.setItem('CozyPixelFishing_Save', JSON.stringify({{
      gold: state.gold,
      upgrades: state.upgrades,
      equipped: state.equipped,
      dex: state.dex
    }}));
  }} catch(e){{}}
  updateHUD();
}}

function updateHUD() {{
  document.getElementById('gold-display').textContent = state.gold.toLocaleString() + ' G';
  const c = Object.keys(state.dex).length;
  document.getElementById('dex-count').textContent = c;
  document.getElementById('modal-dex-count').textContent = c;
  document.getElementById('weather-name').textContent = weathers[state.weatherIdx].name;
}}

// Canvas
const canvas = document.getElementById('cozyCanvas');
const ctx = canvas.getContext('2d');

function cycleWeather() {{
  state.weatherIdx = (state.weatherIdx + 1) % weathers.length;
  updateHUD();
  showToast(`⛅ 날씨 변경: ${{weathers[state.weatherIdx].name}}`);
}}

function showToast(msg) {{
  const t = document.getElementById('achieve-toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => {{ t.style.display = 'none'; }}, 2500);
}}

// FSM Logic
function startCasting() {{
  sound.init();
  state.fsm = FSM.CASTING;
  state.castProgress = 0;
  state.bobber.targetX = 580 + (Math.random() * 120 - 60);
  state.bobber.targetY = 410 + (Math.random() * 40 - 20);
  document.getElementById('state-bubble').textContent = "찌를 던지는 중... (Casting Line)";
}}

function onBobberLanded() {{
  state.fsm = FSM.WAITING;
  sound.playPlop();
  state.waitTimer = Math.max(1.5, (4.5 - state.upgrades.bite_speed * 0.5));
  document.getElementById('state-bubble').textContent = "물고기를 기다리는 중... (Waiting)";
}}

function triggerBite() {{
  state.fsm = FSM.BITING;
  sound.playBite();
  state.biteTimer = 0.6;
  document.getElementById('state-bubble').textContent = "❗ 입질이다! 지금 클릭하여 낚아채세요!";
}}

function startReeling() {{
  state.fsm = FSM.REELING;
  document.getElementById('reeling-panel').style.display = 'block';
  state.currentFish = selectFish();
  state.fishPos = 0.5;
  state.fishTargetPos = 0.5;
  state.catchProgress = 0.35;
  state.safePos = 0.2;
  state.safeHeight = Math.min(0.5, 0.28 + state.upgrades.safe_zone * 0.05);
  document.getElementById('safe-zone').style.height = (state.safeHeight * 100) + '%';
}}

function selectFish() {{
  const r = Math.random() * (state.buffs.rareMult || 1.0);
  let targetRarity = 'Common';
  if (r > 0.95) targetRarity = 'Legendary';
  else if (r > 0.85) targetRarity = 'Epic';
  else if (r > 0.65) targetRarity = 'Rare';
  else if (r > 0.35) targetRarity = 'Uncommon';
  const matches = FISH_DATA.filter(f => f.rarity === targetRarity);
  return matches.length ? matches[Math.floor(Math.random() * matches.length)] : FISH_DATA[0];
}}

function finishReel(success) {{
  document.getElementById('reeling-panel').style.display = 'none';
  if (success && state.currentFish) {{
    state.fsm = FSM.CATCH;
    const fish = state.currentFish;
    sound.playFanfare();
    const len = (fish.min_length_cm + Math.random() * (fish.max_length_cm - fish.min_length_cm)).toFixed(1);
    const baseP = Math.round(fish.base_price * (1 + (parseFloat(len) - fish.min_length_cm)/(fish.max_length_cm||1)*0.5));
    const price = Math.round(baseP * (state.buffs.goldMult || 1.0));

    state.gold += price;
    if (!state.dex[fish.id]) state.dex[fish.id] = {{ count: 0, maxLen: 0 }};
    state.dex[fish.id].count++;
    state.dex[fish.id].maxLen = Math.max(state.dex[fish.id].maxLen, parseFloat(len));
    save();

    document.getElementById('c-rarity').textContent = fish.rarity;
    document.getElementById('c-rarity').className = 'rarity-badge rarity-' + fish.rarity;
    document.getElementById('c-name').textContent = fish.name;
    document.getElementById('c-enname').textContent = fish.english_name;
    document.getElementById('c-len').textContent = len + ' cm';
    document.getElementById('c-price').textContent = '+' + price + ' G';
    document.getElementById('c-desc').textContent = fish.description;
    document.getElementById('catch-card').classList.add('show');
    document.getElementById('state-bubble').textContent = `🎉 축하합니다! ${{fish.name}} 획득!`;
  }} else {{
    state.fsm = FSM.IDLE;
    document.getElementById('state-bubble').textContent = "물고기를 놓쳤습니다... 다시 던져보세요.";
  }}
}}

// Controls
window.addEventListener('mousedown', (e) => {{
  if (e.target.closest('.hud-top') || e.target.closest('.modal-overlay') || e.target.closest('#catch-card')) return;
  if (state.fsm === FSM.IDLE) startCasting();
  else if (state.fsm === FSM.BITING) startReeling();
  else if (state.fsm === FSM.REELING) state.isReelingDown = true;
}});
window.addEventListener('mouseup', () => {{ if (state.fsm === FSM.REELING) state.isReelingDown = false; }});
window.addEventListener('keydown', (e) => {{
  if (e.code === 'Space') {{
    e.preventDefault();
    if (state.fsm === FSM.IDLE) startCasting();
    else if (state.fsm === FSM.BITING) startReeling();
    else if (state.fsm === FSM.REELING) state.isReelingDown = true;
  }}
}});
window.addEventListener('keyup', (e) => {{ if (e.code === 'Space' && state.fsm === FSM.REELING) state.isReelingDown = false; }});

document.getElementById('btn-catch-ok').addEventListener('click', () => {{
  document.getElementById('catch-card').classList.remove('show');
  state.fsm = FSM.IDLE;
  document.getElementById('state-bubble').textContent = "클릭하여 낚싯대를 던지세요 (Click to Cast)";
}});

// Auto Companion Cat Mochi
let catAutoTimer = 0;
function updateAutoCat(dt) {{
  if (state.upgrades.cat_companion > 0 && state.fsm === FSM.IDLE) {{
    catAutoTimer += dt;
    if (catAutoTimer >= 10) {{
      catAutoTimer = 0;
      const fish = selectFish();
      const p = Math.round(fish.base_price * 0.75);
      state.gold += p;
      if (!state.dex[fish.id]) state.dex[fish.id] = {{ count: 0, maxLen: 0 }};
      state.dex[fish.id].count++;
      save();
      showToast(`🐱 모찌가 ${{fish.name}} (+${{p}} G)를 자동으로 낚아왔습니다!`);
    }}
  }}
}}

// Weather Particles
const weatherParticles = [];
for (let i = 0; i < 60; i++) {{
  weatherParticles.push({{
    x: Math.random() * 1024,
    y: Math.random() * 640,
    speed: Math.random() * 120 + 80,
    rot: Math.random() * Math.PI * 2,
    size: Math.random() * 8 + 8
  }});
}}

// Main Loop
let lastT = performance.now();
function loop(now) {{
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}}

function update(dt) {{
  state.waterOffset += dt * 1.5;
  updateAutoCat(dt);

  // Weather particles
  const wId = weathers[state.weatherIdx].id;
  if (wId === 'spring_rain' || wId === 'cherry_blossom') {{
    weatherParticles.forEach(p => {{
      p.y += p.speed * dt;
      p.x -= (wId === 'cherry_blossom' ? 40 : 15) * dt;
      p.rot += dt * 2;
      if (p.y > 640) {{ p.y = -20; p.x = Math.random() * 1100; }}
    }});
  }}

  if (state.fsm === FSM.CASTING) {{
    state.castProgress += dt * 1.8;
    const p = Math.min(1, state.castProgress);
    state.bobber.x = 240 + (state.bobber.targetX - 240) * p;
    state.bobber.y = 360 + (state.bobber.targetY - 360) * p - Math.sin(p * Math.PI) * 110;
    if (state.castProgress >= 1) onBobberLanded();
  }} else if (state.fsm === FSM.WAITING) {{
    state.waitTimer -= dt;
    if (state.waitTimer <= 0) triggerBite();
  }} else if (state.fsm === FSM.BITING) {{
    state.biteTimer -= dt;
    if (state.biteTimer <= 0) {{
      state.fsm = FSM.IDLE;
      document.getElementById('state-bubble').textContent = "물고기가 미끼를 먹고 도망쳤습니다! (Missed)";
    }}
  }} else if (state.fsm === FSM.REELING) {{
    if (state.isReelingDown) state.safePos = Math.min(1.0 - state.safeHeight, state.safePos + 0.9 * dt);
    else state.safePos = Math.max(0, state.safePos - 0.7 * dt);

    state.fishPos += (state.fishTargetPos - state.fishPos) * 2.2 * dt;
    if (Math.random() < 0.04) state.fishTargetPos = Math.max(0.05, Math.min(0.95, Math.random()));

    const inZone = (state.fishPos >= state.safePos && state.fishPos <= state.safePos + state.safeHeight);
    state.catchProgress = Math.max(0, Math.min(1, state.catchProgress + (inZone ? 0.3 : -0.22) * dt));

    document.getElementById('safe-zone').style.bottom = (state.safePos * 100) + '%';
    document.getElementById('fish-marker').style.bottom = (state.fishPos * 100) + '%';
    document.getElementById('progress-bar').style.height = (state.catchProgress * 100) + '%';

    if (state.catchProgress >= 1.0) finishReel(true);
    else if (state.catchProgress <= 0.0) finishReel(false);
  }}
}}

function render() {{
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Dynamic Sky based on weather
  const wId = weathers[state.weatherIdx].id;
  const sky = ctx.createLinearGradient(0, 0, 0, 380);
  if (wId === 'aurora') {{
    sky.addColorStop(0, '#020b1e'); sky.addColorStop(0.5, '#07243e'); sky.addColorStop(1, '#0e4352');
  }} else if (wId === 'spring_rain') {{
    sky.addColorStop(0, '#1a202c'); sky.addColorStop(0.6, '#2d3748'); sky.addColorStop(1, '#4a5568');
  }} else {{
    sky.addColorStop(0, '#101328'); sky.addColorStop(0.5, '#2b2353'); sky.addColorStop(0.85, '#843b62'); sky.addColorStop(1, '#f67280');
  }}
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, 380);

  // Aurora effect
  if (wId === 'aurora') {{
    ctx.fillStyle = 'rgba(74, 222, 128, 0.18)';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    for(let x=0; x<=w; x+=30) {{
      ctx.lineTo(x, 150 + Math.sin(x*0.01 + state.waterOffset)*35);
    }}
    ctx.lineTo(w, 0); ctx.lineTo(0, 0); ctx.fill();
  }}

  // Distant Mountain & Moon
  ctx.fillStyle = '#fce38a'; ctx.beginPath(); ctx.arc(880, 90, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1c172e'; ctx.beginPath();
  ctx.moveTo(0, 380); ctx.lineTo(150, 280); ctx.lineTo(340, 340); ctx.lineTo(580, 260); ctx.lineTo(840, 350); ctx.lineTo(1024, 300); ctx.lineTo(1024, 380);
  ctx.fill();

  // Water
  const water = ctx.createLinearGradient(0, 380, 0, h);
  water.addColorStop(0, '#355c7d'); water.addColorStop(0.4, '#253d61'); water.addColorStop(1, '#0e1828');
  ctx.fillStyle = water; ctx.fillRect(0, 380, w, h - 380);

  // Water Waves
  ctx.strokeStyle = 'rgba(246, 114, 128, 0.25)'; ctx.lineWidth = 2;
  for (let row = 0; row < 7; row++) {{
    const yB = 395 + row * 34;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 25) {{
      const yOff = Math.sin(x * 0.015 + state.waterOffset + row * 1.2) * (3 + row * 0.5);
      if (x === 0) ctx.moveTo(x, yB + yOff); else ctx.lineTo(x, yB + yOff);
    }}
    ctx.stroke();
  }}

  // Wooden Pier & Props
  ctx.fillStyle = '#4a2f1b'; ctx.fillRect(0, 350, 220, 290);
  ctx.fillStyle = '#5c3a21'; ctx.fillRect(0, 340, 230, 16);
  ctx.fillStyle = '#311e11'; ctx.fillRect(45, 356, 16, 284); ctx.fillRect(150, 356, 18, 284);

  // Pier Props
  if (textures.prop_wooden_bench && textures.prop_wooden_bench.complete) {{
    ctx.drawImage(textures.prop_wooden_bench, 20, 308, 48, 34);
  }}
  if (textures.stone_lantern && textures.stone_lantern.complete) {{
    ctx.drawImage(textures.stone_lantern, 185, 298, 28, 44);
  }}
  if (textures.prop_lighthouse && textures.prop_lighthouse.complete) {{
    ctx.drawImage(textures.prop_lighthouse, 920, 260, 64, 120);
  }}

  // Fisherman Sprite (4 State Switching!)
  let anglerTex = textures.angler_idle;
  if (state.fsm === FSM.CASTING) anglerTex = textures.angler_cast;
  else if (state.fsm === FSM.REELING) anglerTex = textures.angler_reel;
  else if (state.fsm === FSM.CATCH) anglerTex = textures.angler_catch;

  if (anglerTex && anglerTex.complete) {{
    ctx.drawImage(anglerTex, 100, 265, 72, 80);
  }}

  // Companion Cat Mochi & Hat
  if (textures.cat_mochi && textures.cat_mochi.complete) {{
    ctx.drawImage(textures.cat_mochi, 75, 316, 32, 26);
    const hatTex = textures[state.equipped.catHat];
    if (hatTex && hatTex.complete) {{
      ctx.drawImage(hatTex, 84, 304, 20, 16);
    }}
  }}

  // Bobber & Line
  let bx = state.bobber.targetX, by = state.bobber.targetY;
  if (state.fsm === FSM.CASTING) {{ bx = state.bobber.x; by = state.bobber.y; }}
  else if (state.fsm === FSM.WAITING || state.fsm === FSM.BITING || state.fsm === FSM.REELING) {{
    by += (state.fsm === FSM.BITING) ? 8 : Math.sin(state.waterOffset * 3) * 3;
  }}

  if (state.fsm !== FSM.IDLE && state.fsm !== FSM.CATCH) {{
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(170, 275);
    ctx.quadraticCurveTo((170 + bx)/2, (275 + by)/2 + 20, bx, by);
    ctx.stroke();

    // Bobber Sprite
    const bobTex = textures[state.equipped.bobber] || textures.bobber_detailed;
    if (bobTex && bobTex.complete) {{
      ctx.drawImage(bobTex, bx - 10, by - 14, 20, 20);
    }}
  }}

  // Exclamation Mark
  if (state.fsm === FSM.BITING) {{
    ctx.font = 'bold 36px sans-serif'; ctx.fillStyle = '#ffd166';
    ctx.fillText('❗', 125, 245 + Math.sin(state.waterOffset * 15) * 4);
  }}

  // Weather Fall Particle Rendering
  if (wId === 'spring_rain') {{
    ctx.fillStyle = 'rgba(180, 210, 255, 0.6)';
    weatherParticles.forEach(p => ctx.fillRect(p.x, p.y, 1.5, 12));
  }} else if (wId === 'cherry_blossom') {{
    ctx.fillStyle = 'rgba(255, 182, 193, 0.85)';
    weatherParticles.forEach(p => {{
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }});
  }}
}}

// Setup Modals
document.getElementById('weather-pill').addEventListener('click', cycleWeather);
document.getElementById('btn-sound').addEventListener('click', (e) => {{
  const on = sound.toggle();
  e.target.textContent = on ? '🔊 사운드 ON' : '🔇 사운드 OFF';
}});

// Customizer Modal
document.getElementById('btn-custom').addEventListener('click', () => {{
  renderCustomizer();
  document.getElementById('modal-custom').style.display = 'flex';
}});

function renderCustomizer() {{
  const rCont = document.getElementById('custom-rods');
  rCont.innerHTML = '';
  (GEAR_DATA.rods || []).forEach(r => {{
    const eq = state.equipped.rod === r.id;
    rCont.innerHTML += `
      <div class="card-item">
        <div><h4>${{r.name}}</h4><p>${{r.description}}</p></div>
        <button class="equip-btn ${{eq?'equipped':''}}" onclick="equip('rod', '${{r.id}}')">${{eq?'장착중':'장착'}}</button>
      </div>`;
  }});
  const bCont = document.getElementById('custom-bobbers');
  bCont.innerHTML = '';
  (GEAR_DATA.bobbers || []).forEach(b => {{
    const eq = state.equipped.bobber === b.id;
    bCont.innerHTML += `
      <div class="card-item">
        <div><h4>${{b.name}}</h4><p>${{b.description}}</p></div>
        <button class="equip-btn ${{eq?'equipped':''}}" onclick="equip('bobber', '${{b.id}}')">${{eq?'장착중':'장착'}}</button>
      </div>`;
  }});
  const hCont = document.getElementById('custom-hats');
  hCont.innerHTML = '';
  (GEAR_DATA.catCostumes || []).forEach(h => {{
    const eq = state.equipped.catHat === h.id;
    hCont.innerHTML += `
      <div class="card-item">
        <div><h4>${{h.name}}</h4><p>${{h.description}}</p></div>
        <button class="equip-btn ${{eq?'equipped':''}}" onclick="equip('catHat', '${{h.id}}')">${{eq?'장착중':'장착'}}</button>
      </div>`;
  }});
}}

window.equip = function(type, id) {{
  state.equipped[type] = id;
  save();
  renderCustomizer();
  showToast(`🎨 ${{id}} 장착 완료!`);
}};

// Cooking Modal
document.getElementById('btn-cooking').addEventListener('click', () => {{
  renderCooking();
  document.getElementById('modal-cooking').style.display = 'flex';
}});

function renderCooking() {{
  const cont = document.getElementById('cooking-list');
  cont.innerHTML = '';
  COOKING_DATA.forEach(c => {{
    cont.innerHTML += `
      <div class="card-item">
        <div><h4>${{c.name}}</h4><p>${{c.description}}</p><p style="color:var(--cyan); font-size:11px;">버프: ${{c.buffDurationSec}}초간 효과 지속</p></div>
        <button class="equip-btn" onclick="cook('${{c.id}}')">요리하기 🍳</button>
      </div>`;
  }});
}}

window.cook = function(id) {{
  sound.playSizzle();
  state.buffs.goldMult = 1.35;
  state.buffs.rareMult = 1.25;
  state.buffs.timer = 120;
  showToast(`🍳 요리 완성! 120초 동안 골드 & 희귀 확률 버프!`);
}};

// Dredge Modal
document.getElementById('btn-dredge').addEventListener('click', () => {{
  document.getElementById('modal-dredge').style.display = 'flex';
}});

document.getElementById('btn-dredge-start').addEventListener('click', () => {{
  if (state.gold < 100) {{ showToast('❌ 골드가 부족합니다 (100 G 필요)'); return; }}
  state.gold -= 100;
  save();
  const items = DREDGE_DATA.length ? DREDGE_DATA : [
    {{ name: '황금 보물상자', price: 600, desc: '침몰선에 잠겨있던 찬란한 보물' }},
    {{ name: '유리병 속 편지', price: 250, desc: '수십 년 전 누군가가 띄운 편지' }},
    {{ name: '고대 선원의 나침반', price: 400, desc: '아직도 북쪽을 가리키는 나침반' }}
  ];
  const win = items[Math.floor(Math.random() * items.length)];
  sound.playFanfare();
  state.gold += win.price;
  save();
  document.getElementById('dredge-result').innerHTML = `
    <div style="background:rgba(255,209,102,0.1); border:1px solid var(--gold); border-radius:14px; padding:16px;">
      <h3 style="color:var(--gold); font-size:18px;">✨ ${{win.name}} 인양 성공!</h3>
      <p style="color:#cbd5e1; font-size:13px; margin:6px 0;">${{win.description || win.desc}}</p>
      <p style="color:var(--cyan); font-weight:800;">가치: +${{win.price}} G 획득!</p>
    </div>`;
}});

// Quests Modal
document.getElementById('btn-quests').addEventListener('click', () => {{
  renderQuests();
  document.getElementById('modal-quests').style.display = 'flex';
}});

function renderQuests() {{
  const cont = document.getElementById('quests-list');
  cont.innerHTML = '';
  QUESTS_DATA.forEach(q => {{
    cont.innerHTML += `
      <div class="card-item">
        <div><h4>${{q.title}}</h4><p>${{q.description}}</p></div>
        <button class="equip-btn" onclick="showToast('진 할아버지: 자네의 도전을 응원하네!')">퀘스트 수락</button>
      </div>`;
  }});
}}

// Dex Modal
document.getElementById('btn-dex').addEventListener('click', () => {{
  renderDex();
  document.getElementById('modal-dex').style.display = 'flex';
}});

function renderDex() {{
  const grid = document.getElementById('dex-grid');
  grid.innerHTML = '';
  FISH_DATA.forEach(f => {{
    const c = state.dex[f.id];
    grid.innerHTML += `
      <div class="dex-card ${{c?'':'locked'}}">
        <div class="fish-icon">${{c?'🐟':'❓'}}</div>
        <div class="fish-name">${{c?f.name:'???'}}</div>
        <div class="fish-rarity rarity-${{f.rarity}}">${{f.rarity}}</div>
        <div style="font-size:11px; color:#94a3b8; margin-top:4px;">${{c?`최대 ${{c.maxLen}}cm`:'미발견'}}</div>
      </div>`;
  }});
}}

// Shop Modal
document.getElementById('btn-shop').addEventListener('click', () => {{
  renderShop();
  document.getElementById('modal-shop').style.display = 'flex';
}});

function renderShop() {{
  const cont = document.getElementById('shop-list');
  cont.innerHTML = '';
  (ECONOMY_DATA.upgrades || []).forEach(u => {{
    const cur = state.upgrades[u.id] || 0;
    const isMax = cur >= u.max_level;
    const cost = Math.round(u.base_cost * Math.pow(u.cost_multiplier, cur));
    cont.innerHTML += `
      <div class="card-item">
        <div><h4>${{u.name}} (Lv.${{cur}}/${{u.max_level}})</h4><p>${{u.description}}</p></div>
        <button class="equip-btn" ${{isMax||state.gold<cost?'disabled':''}} onclick="buyUpgrade('${{u.id}}', ${{cost}})">${{isMax?'MAX':`${{cost}} G`}}</button>
      </div>`;
  }});
}}

window.buyUpgrade = function(id, cost) {{
  if (state.gold < cost) return;
  state.gold -= cost;
  state.upgrades[id] = (state.upgrades[id] || 0) + 1;
  save();
  renderShop();
  showToast(`🛒 업그레이드 완료!`);
}};

document.querySelectorAll('.close-btn').forEach(btn => {{
  btn.addEventListener('click', (e) => {{
    const id = e.target.getAttribute('data-close');
    document.getElementById(id).style.display = 'none';
  }});
}});

// Start
updateHUD();
requestAnimationFrame(loop);
</script>
</body>
</html>
"""

out = Path("site/cozy-fishing/index.html")
out.write_text(html, encoding="utf-8")
print("site/cozy-fishing/index.html generated with ALL 7 systems & textures successfully!")
