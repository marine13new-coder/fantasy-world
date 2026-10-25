import os

with open('topdown_b64.txt', 'r', encoding='utf-8') as f:
    topdown_b64 = f.read().strip()

html_code = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>감스트의 상동호수공원 질주! (Gamst Lake Park Run - Bright Top-Down HD)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Jua&family=Do+Hyeon&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }
    body {
      background: #87ceeb;
      background: radial-gradient(circle at 50% 20%, #b8e2f2 0%, #70b4d4 60%, #468ca8 100%);
      color: #222;
      font-family: 'Jua', sans-serif;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
    }
    #arcade-wrapper {
      position: relative;
      padding: 16px;
      background: linear-gradient(145deg, #ffffff, #dbeef5);
      border-radius: 26px;
      box-shadow: 0 20px 50px rgba(0, 70, 110, 0.35), 0 0 25px rgba(255, 140, 0, 0.4);
      border: 5px solid #ff7700;
    }
    #game-container {
      position: relative;
      width: 480px;
      height: 760px;
      max-width: 95vw;
      max-height: 92vh;
      background: #68c374;
      border-radius: 16px;
      overflow: hidden;
      border: 3px solid #ffaa00;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }

    /* Top HUD: Sunny Modern Arcade Theme */
    .hud {
      position: absolute;
      top: 14px;
      left: 14px;
      right: 14px;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
      z-index: 20;
    }
    .hud-card {
      background: rgba(255, 255, 255, 0.92);
      border: 3px solid #ff8800;
      border-radius: 12px;
      padding: 8px 14px;
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
    }
    .hud-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      color: #e65c00;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .hud-val {
      font-size: 20px;
      font-family: 'Do Hyeon', sans-serif;
      color: #1a1a1a;
      letter-spacing: 1px;
    }
    .hp-bar-bg {
      width: 120px;
      height: 12px;
      background: #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
      margin-top: 3px;
      border: 1.5px solid #ff3b30;
    }
    .hp-bar-fill {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #ff3b30, #ff9500, #34c759);
      box-shadow: 0 0 6px #34c759;
      transition: width 0.12s ease;
    }
    .boost-bar-bg {
      width: 120px;
      height: 8px;
      background: #d8edf8;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 4px;
      border: 1.5px solid #007aff;
    }
    .boost-bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #007aff, #00c7be);
      box-shadow: 0 0 6px #00c7be;
    }

    /* Distance Track Bar */
    .dist-bar-wrap {
      position: absolute;
      bottom: 22px;
      left: 25px;
      right: 25px;
      height: 20px;
      background: rgba(255, 255, 255, 0.94);
      border: 3px solid #ff7700;
      border-radius: 10px;
      z-index: 20;
      pointer-events: none;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .dist-bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #ff9500, #ffcc00, #34c759);
    }
    .dist-text {
      position: absolute;
      width: 100%;
      text-align: center;
      top: -22px;
      font-size: 13px;
      color: #8b3e00;
      text-shadow: 1px 1px 0px #fff;
      font-weight: bold;
    }

    /* Overlays */
    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 40;
      padding: 24px;
      text-align: center;
    }
    .overlay.hidden {
      display: none;
    }
    .btn {
      margin-top: 20px;
      background: linear-gradient(135deg, #ff8800, #ff4400);
      color: #fff;
      font-family: 'Do Hyeon', sans-serif;
      font-size: 26px;
      padding: 12px 36px;
      border: 3px solid #ffcc00;
      border-radius: 40px;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(255, 102, 0, 0.45);
      transition: transform 0.1s;
    }
    .btn:hover {
      transform: scale(1.05);
    }
    .btn:active {
      transform: scale(0.96);
    }

    /* Memes Shout Bubbles */
    .shout-bubble {
      position: absolute;
      background: #ffffff;
      color: #111;
      padding: 7px 15px;
      border-radius: 16px;
      font-weight: bold;
      font-size: 15px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      pointer-events: none;
      transform: translate(-50%, -100%);
      white-space: nowrap;
      z-index: 30;
      animation: popFade 1.35s forwards ease-out;
      border: 3px solid #ff6600;
    }
    @keyframes popFade {
      0% { opacity: 0; transform: translate(-50%, -70%) scale(0.6); }
      20% { opacity: 1; transform: translate(-50%, -110%) scale(1.1); }
      80% { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%, -160%) scale(0.9); }
    }

    /* Mobile Controls */
    .mobile-controls {
      position: absolute;
      bottom: 54px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 22;
      pointer-events: none;
    }
    .touch-btn {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.7);
      border: 3px solid #ff8800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #ff6600;
      font-weight: bold;
      pointer-events: auto;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      backdrop-filter: blur(4px);
    }
    .touch-btn:active {
      background: #ff8800;
      color: #fff;
      transform: scale(0.93);
    }
  </style>
</head>
<body>

<div id="arcade-wrapper">
  <div id="game-container">
    <canvas id="gameCanvas" width="480" height="760"></canvas>

    <!-- Top HUD -->
    <div class="hud">
      <div class="hud-card">
        <div class="hud-title">BIKE HP</div>
        <div class="hp-bar-bg">
          <div id="hp-bar" class="hp-bar-fill"></div>
        </div>
        <div class="hud-title" style="margin-top:6px; color:#007aff;">NITRO BOOST</div>
        <div class="boost-bar-bg">
          <div id="boost-bar" class="boost-bar-fill"></div>
        </div>
      </div>
      <div class="hud-card" style="text-align: right;">
        <div class="hud-title">STAR BALLOON (별풍선)</div>
        <div id="score-text" class="hud-val">0 P</div>
        <div id="speed-text" style="font-size: 13px; color: #ff6600; margin-top: 2px; font-weight: bold;">60 km/h</div>
      </div>
    </div>

    <!-- Distance Bar -->
    <div class="dist-bar-wrap">
      <div id="dist-text" class="dist-text">상동호수공원까지 남은 거리: 2,500m</div>
      <div id="dist-bar" class="dist-bar-fill"></div>
    </div>

    <!-- Mobile Buttons -->
    <div class="mobile-controls">
      <div class="touch-btn" id="btn-left">◀</div>
      <div class="touch-btn" id="btn-boost" style="width: 58px; height: 58px; font-size: 13px; border-color: #007aff; color: #007aff;">부스터</div>
      <div class="touch-btn" id="btn-right">▶</div>
    </div>

    <!-- Start Overlay -->
    <div id="start-overlay" class="overlay">
      <h1 style="font-size: 36px; color: #ff6600; text-shadow: 1px 1px 2px rgba(0,0,0,0.15); margin-bottom: 6px;">감스트의<br>상동호수공원 질주!</h1>
      <p style="font-family:'Press Start 2P'; font-size: 9px; color: #0088cc; margin-bottom: 14px;">TOP-DOWN SUNNY PARK EDITION</p>
      <p style="font-size: 15px; color: #444; margin-bottom: 14px; line-height: 1.6;">
        맑고 화창한 부천의 낮! 불꽃 셔츠를 입은 감스트가<br>
        바이크를 타고 <strong>부천 상동호수공원</strong>으로 출격합니다!<br><br>
        <span style="color: #ff5500; font-weight: bold;">🕹️ [A]/[D] or 좌우키: 차선 이동<br>
        [Space] or [W]: 니트로 부스터 가속!</span>
      </p>
      <canvas id="preview-canvas" width="80" height="120" style="width: 80px; height: 120px; image-rendering: pixelated; border: 3px solid #ff7700; border-radius: 12px; background: #68c374; box-shadow: 0 4px 10px rgba(0,0,0,0.15);"></canvas>
      <button id="start-btn" class="btn">출발하기 (인직 GO!)</button>
    </div>

    <!-- Game Over Overlay -->
    <div id="gameover-overlay" class="overlay hidden">
      <h2 style="font-size: 38px; color: #ff3b30; margin-bottom: 8px;">사고 발생!!</h2>
      <p id="gameover-reason" style="font-size: 18px; color: #333; margin-bottom: 12px;">"인직아 멈춰!! 이게 왜 박아?!!"</p>
      <p style="font-size: 20px; color: #ff8800; margin-bottom: 20px;">최종 별풍선 도네: <span id="final-score">0</span> P</p>
      <button id="restart-btn" class="btn">다시 달리기</button>
    </div>

    <!-- Victory Overlay -->
    <div id="victory-overlay" class="overlay hidden">
      <h1 style="font-size: 36px; color: #28a745; margin-bottom: 8px;">🎉 상동호수공원 도착!! 🎉</h1>
      <p style="font-size: 16px; color: #333; margin-bottom: 14px; line-height: 1.6;">
        화창한 날씨 속 상동호수공원에 입성 성공!<br>
        호수를 바라보며 전설의 <strong>관제탑 댄스</strong> 작렬!<br>
        <strong style="color: #ff4400; font-size: 18px;">"포... 포... 포우우우우우우우-!!"</strong>
      </p>
      <p style="font-size: 22px; color: #e65100; margin-bottom: 20px;">최종 팬클럽 도네: <span id="victory-score">0</span> P</p>
      <button id="victory-restart-btn" class="btn">한 번 더 질주!</button>
    </div>

    <div id="shout-container"></div>
  </div>
</div>

<script>
  // Top-Down Spritesheet (4 frames: Neutral, Engine Shake, Steer Left, Steer Right)
  const topdownB64 = 'data:image/png;base64,' + '""" + topdown_b64 + """';
  const topdownSheet = new Image();
  topdownSheet.src = topdownB64;

  const FRAME_WIDTH = 80;
  const FRAME_HEIGHT = 120;

  topdownSheet.onload = () => {
    const pc = document.getElementById('preview-canvas');
    if (pc) {
      const pctx = pc.getContext('2d');
      pctx.imageSmoothingEnabled = false;
      pctx.drawImage(topdownSheet, 0, 0, FRAME_WIDTH, FRAME_HEIGHT, 0, 0, 80, 120);
    }
  };

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Audio synthesis
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playSound(type) {
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.3);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.setValueAtTime(980, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
      } else if (type === 'boost') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'victory') {
        [523, 659, 783, 1046].forEach((f, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g); g.connect(audioCtx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + idx * 0.12);
          g.gain.setValueAtTime(0.2, now + idx * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);
          o.start(now + idx * 0.12); o.stop(now + idx * 0.12 + 0.3);
        });
      }
    } catch(e) {}
  }

  // Famous Gamst Memes Quotes
  const GamstMemes = [
    "포우우우우우우우-!!",
    "인직아 멈춰!! 이게 왜 박아?!",
    "감스트 감스트 감감감!",
    "관제탑 라 라 라 라라~",
    "탁구채 가져와!!",
    "빅맨 댄스 들어간다!",
    "마빡이 비트 쪼개기~",
    "별풍선 518개 감사합니다 형님!",
    "비켜라! 상동호수공원에서 방송 켠다!"
  ];

  function showShout(text, x, y) {
    const container = document.getElementById('shout-container');
    const bubble = document.createElement('div');
    bubble.className = 'shout-bubble';
    bubble.innerText = text;
    bubble.style.left = (x || canvas.width / 2) + 'px';
    bubble.style.top = (y || (canvas.height - 180)) + 'px';
    container.appendChild(bubble);
    setTimeout(() => {
      if (bubble.parentElement) bubble.parentElement.removeChild(bubble);
    }, 1350);
  }

  // Top-Down Pixel Art Drawing Primitives
  function drawPixelRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Top-Down Obstacles
  function drawTopdownBus(ctx, x, y) {
    // Top-down Bucheon Green City Bus
    // Shadow
    drawPixelRect(ctx, x - 26, y - 48, 52, 96, 'rgba(0,0,0,0.18)');
    // Main Green Roof
    drawPixelRect(ctx, x - 24, y - 46, 48, 92, '#18863b');
    drawPixelRect(ctx, x - 22, y - 44, 44, 88, '#2bb655');
    // Air conditioning unit on roof
    drawPixelRect(ctx, x - 12, y - 10, 24, 20, '#ffffff');
    drawPixelRect(ctx, x - 10, y - 8, 20, 16, '#d9e2ec');
    // Front Windshield (Bottom facing)
    drawPixelRect(ctx, x - 20, y + 30, 40, 10, '#62c2f7');
    // Rear Window (Top facing)
    drawPixelRect(ctx, x - 18, y - 42, 36, 6, '#62c2f7');
    // Bus number text indicator
    drawPixelRect(ctx, x - 8, y + 16, 16, 6, '#fff7d6');
  }

  function drawTopdownTaxi(ctx, x, y) {
    // Orange Bucheon Taxi top-down
    drawPixelRect(ctx, x - 18, y - 32, 36, 64, 'rgba(0,0,0,0.18)');
    drawPixelRect(ctx, x - 16, y - 30, 32, 60, '#ff7a00');
    drawPixelRect(ctx, x - 14, y - 28, 28, 56, '#ffa333');
    // Taxi Roof Cap
    drawPixelRect(ctx, x - 8, y - 6, 16, 12, '#33c5ff');
    drawPixelRect(ctx, x - 6, y - 4, 12, 8, '#ffffff');
    // Front windshield
    drawPixelRect(ctx, x - 12, y + 14, 24, 8, '#62c2f7');
  }

  function drawTopdownTrafficBarricade(ctx, x, y) {
    // Road barricade & cones
    drawPixelRect(ctx, x - 24, y - 8, 48, 16, 'rgba(0,0,0,0.15)');
    drawPixelRect(ctx, x - 22, y - 6, 44, 12, '#ff4500');
    // Diagonal stripes
    for (let i = -18; i < 20; i += 10) {
      drawPixelRect(ctx, x + i, y - 6, 5, 12, '#ffffff');
    }
  }

  function drawTopdownPuddle(ctx, x, y) {
    // Water puddle reflecting sunny sky
    drawPixelRect(ctx, x - 18, y - 10, 36, 20, 'rgba(0,0,0,0.08)');
    drawPixelRect(ctx, x - 16, y - 8, 32, 16, '#7cd4ff');
    drawPixelRect(ctx, x - 12, y - 5, 24, 10, '#bfeaff');
  }

  // Top-Down Items
  function drawTopdownStarBalloon(ctx, x, y) {
    // AfreecaTV Star Balloon (별풍선)
    drawPixelRect(ctx, x - 14, y - 14, 28, 28, 'rgba(255, 170, 0, 0.2)');
    drawPixelRect(ctx, x - 10, y - 10, 20, 20, '#ffcc00');
    drawPixelRect(ctx, x - 6, y - 6, 12, 12, '#ffffff');
    // Star center
    drawPixelRect(ctx, x - 3, y - 9, 6, 18, '#ff9900');
    drawPixelRect(ctx, x - 9, y - 3, 18, 6, '#ff9900');
  }

  function drawTopdownChicken(ctx, x, y) {
    // Crispy Fried Chicken Box
    drawPixelRect(ctx, x - 12, y - 10, 24, 20, '#ff3b30');
    drawPixelRect(ctx, x - 10, y - 8, 20, 16, '#ff9500');
    drawPixelRect(ctx, x - 6, y - 6, 12, 12, '#ffd60a');
  }

  function drawTopdownDrink(ctx, x, y) {
    // Energy Can
    drawPixelRect(ctx, x - 8, y - 12, 16, 24, '#007aff');
    drawPixelRect(ctx, x - 6, y - 10, 12, 20, '#5ac8fa');
    drawPixelRect(ctx, x - 4, y - 6, 8, 12, '#ffffff');
  }

  // Road & Constants
  const TOTAL_DISTANCE = 2500;
  const ROAD_LANES = [105, 195, 285, 375];

  let state = {
    running: false,
    distanceLeft: TOTAL_DISTANCE,
    score: 0,
    speed: 60,
    baseSpeed: 60,
    boostActive: false,
    boostFuel: 100,
    hp: 100,
    roadOffset: 0,
    animFrame: 0,
    animTimer: 0,
    player: {
      x: 240,
      y: 600,
      width: 80,
      height: 120,
      lean: 'neutral'
    },
    obstacles: [],
    items: [],
    particles: [],
    roadDecorations: [],
    keys: { left: false, right: false, boost: false },
    lastQuoteTime: 0
  };

  function resetGame() {
    state.running = true;
    state.distanceLeft = TOTAL_DISTANCE;
    state.score = 0;
    state.speed = 60;
    state.hp = 100;
    state.boostFuel = 100;
    state.boostActive = false;
    state.player.x = 240;
    state.player.lean = 'neutral';
    state.obstacles = [];
    state.items = [];
    state.particles = [];
    state.roadDecorations = [];

    // Roadside trees and bright modern bucheon sidewalk
    for (let i = 0; i < 18; i++) {
      state.roadDecorations.push({
        y: i * 48,
        side: i % 2 === 0 ? 'left' : 'right',
        type: i % 3 === 0 ? 'building' : 'tree'
      });
    }

    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');

    showShout('출발한다 인직이 간다!!', 240, 520);
  }

  // Key Listeners
  window.addEventListener('keydown', (e) => {
    initAudio();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') state.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') state.keys.right = true;
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') state.keys.boost = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') state.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') state.keys.right = false;
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') state.keys.boost = false;
  });

  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnBoost = document.getElementById('btn-boost');

  btnLeft.addEventListener('pointerdown', () => { initAudio(); state.keys.left = true; });
  btnLeft.addEventListener('pointerup', () => { state.keys.left = false; });
  btnLeft.addEventListener('pointerleave', () => { state.keys.left = false; });

  btnRight.addEventListener('pointerdown', () => { initAudio(); state.keys.right = true; });
  btnRight.addEventListener('pointerup', () => { state.keys.right = false; });
  btnRight.addEventListener('pointerleave', () => { state.keys.right = false; });

  btnBoost.addEventListener('pointerdown', () => { initAudio(); state.keys.boost = true; });
  btnBoost.addEventListener('pointerup', () => { state.keys.boost = false; });
  btnBoost.addEventListener('pointerleave', () => { state.keys.boost = false; });

  document.getElementById('start-btn').addEventListener('click', () => { initAudio(); resetGame(); });
  document.getElementById('restart-btn').addEventListener('click', () => { initAudio(); resetGame(); });
  document.getElementById('victory-restart-btn').addEventListener('click', () => { initAudio(); resetGame(); });

  const ObstacleTypes = [
    { name: 'slow_bus', w: 48, h: 90, drawFn: drawTopdownBus, dmg: 30 },
    { name: 'taxi', w: 34, h: 60, drawFn: drawTopdownTaxi, dmg: 20 },
    { name: 'barricade', w: 44, h: 18, drawFn: drawTopdownTrafficBarricade, dmg: 15 },
    { name: 'puddle', w: 34, h: 18, drawFn: drawTopdownPuddle, dmg: 10 }
  ];

  const ItemTypes = [
    { type: 'star', drawFn: drawTopdownStarBalloon, score: 100, boostAdd: 25 },
    { type: 'chicken', drawFn: drawTopdownChicken, score: 200, hpAdd: 30 },
    { type: 'drink', drawFn: drawTopdownDrink, score: 60, hpAdd: 15, boostAdd: 40 }
  ];

  function spawnEntities() {
    if (Math.random() < 0.045) {
      const lane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
      const type = ObstacleTypes[Math.floor(Math.random() * ObstacleTypes.length)];
      state.obstacles.push({ x: lane, y: -90, ...type });
    }

    if (Math.random() < 0.035) {
      const lane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
      const item = ItemTypes[Math.floor(Math.random() * ItemTypes.length)];
      state.items.push({ x: lane, y: -70, w: 28, h: 28, ...item });
    }
  }

  let lastTime = performance.now();
  function update(dt) {
    if (!state.running) return;

    // Animation frame timer
    state.animTimer += dt;
    if (state.animTimer > 0.07) {
      state.animTimer = 0;
      state.animFrame = (state.animFrame === 0) ? 1 : 0;
    }

    // Boost
    if (state.keys.boost && state.boostFuel > 0) {
      state.boostActive = true;
      state.speed = 120;
      state.boostFuel = Math.max(0, state.boostFuel - 26 * dt);
      if (Math.random() < 0.3) playSound('boost');

      // Flame exhaust from twin pipes
      for (let i = 0; i < 4; i++) {
        state.particles.push({
          x: state.player.x + (Math.random() > 0.5 ? -15 : 15) + (Math.random() * 6 - 3),
          y: state.player.y + 48,
          vx: (Math.random() - 0.5) * 40,
          vy: 220 + Math.random() * 80,
          life: 0.3,
          color: Math.random() > 0.4 ? '#ff3b30' : '#ffd60a',
          size: 4 + Math.floor(Math.random() * 4)
        });
      }
    } else {
      state.boostActive = false;
      state.speed = state.baseSpeed;
      state.boostFuel = Math.min(100, state.boostFuel + 8 * dt);
    }

    // Movement & lean frame
    const moveSpeed = 270;
    if (state.keys.left) {
      state.player.x -= moveSpeed * dt;
      state.player.lean = 'left';
    } else if (state.keys.right) {
      state.player.x += moveSpeed * dt;
      state.player.lean = 'right';
    } else {
      state.player.lean = 'neutral';
    }

    state.player.x = Math.max(80, Math.min(400, state.player.x));

    const distanceStep = (state.speed * 0.28) * dt * 2.5;
    state.distanceLeft = Math.max(0, state.distanceLeft - distanceStep);
    state.score += Math.floor(distanceStep * 2);

    // Gamst meme voice lines
    const nowSec = performance.now() / 1000;
    if (nowSec - state.lastQuoteTime > 5.0 && Math.random() < 0.45) {
      state.lastQuoteTime = nowSec;
      const quote = GamstMemes[Math.floor(Math.random() * GamstMemes.length)];
      showShout(quote, state.player.x, state.player.y - 45);
    }

    // Road scroll
    state.roadOffset = (state.roadOffset + state.speed * 4 * dt) % 64;

    // Roadside decorations
    for (let decor of state.roadDecorations) {
      decor.y += state.speed * 3.5 * dt;
      if (decor.y > 800) {
        decor.y = -50;
        decor.side = Math.random() > 0.5 ? 'left' : 'right';
        decor.type = (state.distanceLeft < 600) ? 'lake_tree' : (Math.random() > 0.5 ? 'tree' : 'building');
      }
    }

    spawnEntities();

    // Obstacles
    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const obs = state.obstacles[i];
      obs.y += (state.speed * 3.2 + (obs.name === 'slow_bus' ? 50 : (obs.name === 'taxi' ? 90 : 0))) * dt;

      const px = state.player.x;
      const py = state.player.y;
      if (Math.abs(px - obs.x) < (obs.w / 2 + 20) && Math.abs(py - obs.y) < (obs.h / 2 + 30)) {
        playSound('hit');
        state.hp -= obs.dmg;
        showShout('이게 왜 박아 형?? -' + obs.dmg, px, py - 35);

        for (let p = 0; p < 10; p++) {
          state.particles.push({
            x: obs.x, y: obs.y,
            vx: (Math.random() - 0.5) * 160,
            vy: (Math.random() - 0.5) * 160,
            life: 0.35,
            color: '#ff3b30',
            size: 4 + Math.random() * 4
          });
        }

        state.obstacles.splice(i, 1);
        if (state.hp <= 0) {
          triggerGameOver('오토바이 대파! 인직이가 넘어졌습니다!');
          return;
        }
        continue;
      }

      if (obs.y > 800) state.obstacles.splice(i, 1);
    }

    // Items
    for (let i = state.items.length - 1; i >= 0; i--) {
      const it = state.items[i];
      it.y += (state.speed * 3.2) * dt;

      const px = state.player.x;
      const py = state.player.y;
      if (Math.abs(px - it.x) < 32 && Math.abs(py - it.y) < 36) {
        playSound('coin');
        state.score += it.score;
        if (it.hpAdd) state.hp = Math.min(100, state.hp + it.hpAdd);
        if (it.boostAdd) state.boostFuel = Math.min(100, state.boostFuel + it.boostAdd);

        showShout('+' + it.score + ' 별풍선 획득!', px, py - 35);
        state.items.splice(i, 1);
        continue;
      }

      if (it.y > 800) state.items.splice(i, 1);
    }

    // Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    if (state.distanceLeft <= 0) triggerVictory();

    // HUD Update
    document.getElementById('hp-bar').style.width = Math.max(0, state.hp) + '%';
    document.getElementById('boost-bar').style.width = Math.max(0, state.boostFuel) + '%';
    document.getElementById('score-text').innerText = state.score.toLocaleString() + ' P';
    document.getElementById('speed-text').innerText = Math.floor(state.speed) + ' km/h';

    const prog = ((TOTAL_DISTANCE - state.distanceLeft) / TOTAL_DISTANCE) * 100;
    document.getElementById('dist-bar').style.width = prog + '%';
    document.getElementById('dist-text').innerText = '상동호수공원까지 남은 거리: ' + Math.ceil(state.distanceLeft) + 'm';
  }

  function triggerGameOver(reason) {
    state.running = false;
    playSound('hit');
    document.getElementById('gameover-reason').innerText = reason;
    document.getElementById('final-score').innerText = state.score.toLocaleString();
    document.getElementById('gameover-overlay').classList.remove('hidden');
  }

  function triggerVictory() {
    state.running = false;
    playSound('victory');
    document.getElementById('victory-score').innerText = state.score.toLocaleString();
    document.getElementById('victory-overlay').classList.remove('hidden');
    showShout('상동호수공원 도착 성공!! 관제탑 댄스!!', 240, 380);
  }

  // Draw Game
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const inLakeZone = state.distanceLeft < 600;

    // 1. Bright Sidewalk / Lake Area
    if (inLakeZone) {
      // Lush Bright Park Grass
      drawPixelRect(ctx, 0, 0, 56, canvas.height, '#48bb78');
      drawPixelRect(ctx, 424, 0, 56, canvas.height, '#48bb78');

      // Sparkling Blue Lake Waters
      drawPixelRect(ctx, 0, 0, 38, canvas.height, '#38b2ac');
      drawPixelRect(ctx, 442, 0, 38, canvas.height, '#38b2ac');

      // Water Sparkles
      for (let i = 0; i < 8; i++) {
        const ry = (i * 95 + state.roadOffset * 1.5) % canvas.height;
        drawPixelRect(ctx, 8, ry, 22, 5, '#e6fffa');
        drawPixelRect(ctx, 450, ry, 22, 5, '#e6fffa');
      }
    } else {
      // Sunny Urban Sidewalk
      drawPixelRect(ctx, 0, 0, 56, canvas.height, '#e2e8f0');
      drawPixelRect(ctx, 424, 0, 56, canvas.height, '#e2e8f0');

      // Brick paver pattern on sidewalk
      for (let i = 0; i < 20; i++) {
        const py = (i * 40 + state.roadOffset) % canvas.height;
        drawPixelRect(ctx, 4, py, 46, 2, '#cbd5e1');
        drawPixelRect(ctx, 430, py, 46, 2, '#cbd5e1');
      }

      // Yellow tactile paving / curbs
      drawPixelRect(ctx, 50, 0, 6, canvas.height, '#f6ad55');
      drawPixelRect(ctx, 424, 0, 6, canvas.height, '#f6ad55');
    }

    // 2. Crisp Asphalt Road (Bright modern gray)
    drawPixelRect(ctx, 56, 0, 368, canvas.height, '#475569');

    // 3. Crisp White Lane Markers
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([32, 24]);
    ctx.lineDashOffset = -state.roadOffset;

    [145, 240, 335].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Solid Yellow Outer Borders
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, 0); ctx.lineTo(60, canvas.height);
    ctx.moveTo(420, 0); ctx.lineTo(420, canvas.height);
    ctx.stroke();

    // 4. Roadside Scenery (Top-Down Trees / Buildings)
    for (let decor of state.roadDecorations) {
      const x = decor.side === 'left' ? 24 : 456;
      if (decor.type === 'lake_tree') {
        // Cherry Blossom Tree (Pink Top-down canopy)
        drawPixelRect(ctx, x - 16, decor.y - 16, 32, 32, '#f687b3');
        drawPixelRect(ctx, x - 12, decor.y - 12, 24, 24, '#fbb6ce');
        drawPixelRect(ctx, x - 6, decor.y - 6, 12, 12, '#fff5f7');
      } else if (decor.type === 'tree') {
        // Top-down Green Maple / Pine Tree
        drawPixelRect(ctx, x - 16, decor.y - 16, 32, 32, '#2f855a');
        drawPixelRect(ctx, x - 12, decor.y - 12, 24, 24, '#38a169');
        drawPixelRect(ctx, x - 6, decor.y - 6, 12, 12, '#68d391');
      } else {
        // Bright City Building Top
        drawPixelRect(ctx, x - 16, decor.y - 20, 32, 40, '#94a3b8');
        drawPixelRect(ctx, x - 12, decor.y - 16, 24, 32, '#cbd5e1');
        drawPixelRect(ctx, x - 6, decor.y - 8, 12, 16, '#60a5fa');
      }
    }

    // Destination Arch
    if (state.distanceLeft < 400) {
      const archY = (400 - state.distanceLeft) * 1.8;
      if (archY < canvas.height + 100) {
        drawPixelRect(ctx, 56, archY - 24, 368, 38, '#ff6600');
        drawPixelRect(ctx, 60, archY - 20, 360, 30, '#ffffff');
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 17px Jua';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 부천 상동호수공원 입구 🏆', 240, archY + 2);
      }
    }

    // 5. Draw Obstacles (Top-down)
    for (let obs of state.obstacles) {
      obs.drawFn(ctx, obs.x, obs.y);
    }

    // 6. Draw Items
    for (let it of state.items) {
      it.drawFn(ctx, it.x, it.y);
    }

    // 7. Draw Particles
    for (let p of state.particles) {
      drawPixelRect(ctx, p.x, p.y, p.size, p.size, p.color);
    }

    // 8. Draw Player: Top-Down Gamst Bike Sprite
    ctx.save();
    ctx.translate(state.player.x, state.player.y);

    // Frame determination: 0: Neutral, 1: Shake, 2: Lean Left, 3: Lean Right
    let frameIndex = 0;
    if (state.player.lean === 'left') {
      frameIndex = 2;
    } else if (state.player.lean === 'right') {
      frameIndex = 3;
    } else {
      frameIndex = state.animFrame;
    }

    if (topdownSheet.complete && topdownSheet.naturalWidth > 0) {
      const sx = frameIndex * FRAME_WIDTH;
      const sy = 0;
      const dw = 80;
      const dh = 120;
      ctx.drawImage(topdownSheet, sx, sy, FRAME_WIDTH, FRAME_HEIGHT, -dw / 2, -dh / 2, dw, dh);
    } else {
      drawPixelRect(ctx, -15, -30, 30, 60, '#ff3300');
    }

    ctx.restore();
  }

  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
</script>
</body>
</html>
"""

with open('games/gamst-lake-park/game.html', 'w', encoding='utf-8') as f:
    f.write(html_code)

print('Success: games/gamst-lake-park/game.html updated with Bright Top-Down Theme & Gamst Memes!')
