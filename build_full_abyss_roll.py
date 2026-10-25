# -*- coding: utf-8 -*-
"""
Abyss Roll: Blood Casino - Complete Commercial Roguelike Web Client Generator
Generates a standalone, dependency-free 9:16 mobile casino roguelike.
"""

HTML_CONTENT = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>어비스 롤: 피의 카지노 (Abyss Roll: Blood Casino) - Commercial 2.0</title>
<style>
  :root {
    --bg-dark: #050608;
    --panel-bg: #0d0f17;
    --border-gold: #c5a059;
    --crimson: #8b0000;
    --blood-red: #ff2222;
    --bone-white: #e2dcc8;
    --safe-gold: #ffd700;
    --joker-purple: #9b59b6;
    --foil-cyan: #00ffff;
    --poly-orange: #ff7700;
    --fever-glow: #ff3300;
    --neon-blue: #00bfff;
    --neon-green: #2ecc71;
  }
  * { box-sizing: border-box; user-select: none; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body {
    background-color: var(--bg-dark);
    color: var(--bone-white);
    font-family: 'Cinzel', 'Noto Serif KR', serif, -apple-system, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    overflow: hidden;
  }
  #mobile-viewport {
    width: 100vw;
    max-width: 440px;
    height: 100vh;
    max-height: 920px;
    background: radial-gradient(circle at 50% 20%, #1c2033 0%, #06070a 100%);
    border: 2px solid #2a2015;
    box-shadow: 0 0 60px rgba(0,0,0,0.98), inset 0 0 30px rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  /* 네온 아케이드 레트로 CRT 스캔라인 */
  #crt-scanlines {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 90;
    opacity: 0.45;
    transition: opacity 0.3s;
  }

  /* 상단 내비바 & 설정 바 */
  #top-utility-bar {
    height: 28px;
    background: #090b10;
    border-bottom: 1px solid #221c15;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    font-size: 11px;
    color: #887a6b;
    z-index: 10;
  }
  .util-btn {
    background: #151822;
    border: 1px solid #332d22;
    color: var(--bone-white);
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 10px;
    cursor: pointer;
  }
  .util-btn:active { background: #252b3d; }

  /* 조커 렐릭 슬롯 & 골드 & 안테 바 */
  #relic-joker-bar {
    height: 52px;
    background: rgba(10, 11, 16, 0.98);
    border-bottom: 1px solid #33291d;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    z-index: 5;
  }
  .relic-slots { display: flex; gap: 5px; }
  .relic-card {
    width: 38px;
    height: 44px;
    background: #191c28;
    border: 1px solid var(--joker-purple);
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(155, 89, 182, 0.3);
    position: relative;
    transition: transform 0.12s, box-shadow 0.12s;
  }
  .relic-card:active { transform: scale(1.15); }
  .relic-card.foil {
    border-color: var(--foil-cyan);
    box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);
    background: linear-gradient(135deg, #102a3a 0%, #191c28 100%);
  }
  .relic-card.polychrome {
    border-color: var(--poly-orange);
    box-shadow: 0 0 14px rgba(255, 119, 0, 0.7);
    background: linear-gradient(135deg, #3a1510 0%, #191c28 100%);
  }
  .relic-card.negative {
    border-color: #fff;
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.8);
    background: #000;
  }
  .relic-card .relic-badge {
    position: absolute;
    bottom: 1px;
    font-size: 8px;
    color: var(--safe-gold);
    font-weight: 900;
  }
  .meta-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  .gold-coin-display {
    font-size: 12px;
    color: var(--safe-gold);
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 3px;
    background: rgba(0,0,0,0.6);
    padding: 2px 7px;
    border-radius: 10px;
    border: 1px solid #443;
  }
  .ante-display {
    font-size: 10px;
    color: #3498db;
    font-weight: 900;
    letter-spacing: 0.5px;
  }

  /* 던전 전투 아레나 (28%) */
  #top-battle-view {
    height: 27%;
    position: relative;
    border-bottom: 2px solid #2d261e;
    display: flex;
    flex-direction: column;
    padding: 4px 10px;
    background: linear-gradient(180deg, rgba(35,10,10,0.45) 0%, rgba(10,12,18,0.9) 100%);
  }
  .header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: var(--border-gold);
    letter-spacing: 1px;
    text-shadow: 0 1px 3px #000;
    margin-bottom: 2px;
  }
  .boss-blind-tag {
    background: rgba(139, 0, 0, 0.85);
    color: #ffcccc;
    border: 1px solid #ff4444;
    padding: 1px 6px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 900;
    margin-left: 5px;
  }
  .torch-gauge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: #ffd700;
    background: rgba(0,0,0,0.5);
    padding: 2px 6px;
    border-radius: 10px;
    border: 1px solid #665;
    cursor: pointer;
  }
  .stage-arena {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }
  .party-row, .monster-row {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  .entity-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 60px;
  }
  .entity-avatar {
    font-size: 26px;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.9));
    transition: transform 0.15s;
  }
  .entity-unit.boss .entity-avatar {
    font-size: 34px;
    filter: drop-shadow(0 0 10px rgba(255, 34, 34, 0.8));
    animation: bossFloat 2s infinite ease-in-out alternate;
  }
  @keyframes bossFloat {
    0% { transform: translateY(0); }
    100% { transform: translateY(-4px); }
  }
  .entity-name {
    font-size: 9px;
    color: #bbb;
    white-space: nowrap;
  }
  .hp-bar-outer {
    width: 48px;
    height: 5px;
    background: #2a1111;
    border: 1px solid #4a1515;
    border-radius: 3px;
    overflow: hidden;
  }
  .hp-bar-inner {
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, #ff2222, #8b0000);
    transition: width 0.3s ease-out;
  }
  .stress-bar-outer {
    width: 48px;
    height: 3px;
    background: #111a2a;
    border: 1px solid #1c2b44;
    border-radius: 2px;
    overflow: hidden;
  }
  .stress-bar-inner {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #3498db, #9b59b6);
    transition: width 0.3s ease-out;
  }

  /* 중단: 발라트로 수학 스코어링 & 족보 & 주사위 트레이 (40%) */
  #middle-casino-board {
    height: 40%;
    background: radial-gradient(circle at 50% 50%, #151a29 0%, #080a10 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 6px 10px;
    position: relative;
    box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
    transition: background 0.3s;
  }
  #middle-casino-board.fever-mode {
    background: radial-gradient(circle at 50% 50%, #4a1200 0%, #150502 100%);
    box-shadow: inset 0 0 35px rgba(255, 68, 0, 0.8);
  }

  /* 포커 족보 뱃지 (Full House, Flush, Yahtzee 등) */
  .poker-hand-badge {
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid var(--border-gold);
    border-radius: 12px;
    padding: 3px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 0 10px rgba(197, 160, 89, 0.25);
  }
  .hand-title {
    font-size: 11px;
    color: var(--safe-gold);
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .hand-level {
    font-size: 9px;
    background: #8b0000;
    color: #fff;
    padding: 1px 4px;
    border-radius: 4px;
  }
  .hand-bonus-val {
    font-size: 10px;
    color: var(--bone-white);
  }

  /* 발라트로 수식 박스 (CHIPS x MULT = POT) */
  .balatro-score-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(5, 7, 12, 0.85);
    border: 1px solid #332d22;
    border-radius: 8px;
    padding: 6px 10px;
  }
  .math-chips {
    font-size: 17px;
    color: var(--neon-blue);
    font-weight: 900;
    text-shadow: 0 0 10px rgba(0, 191, 255, 0.7);
  }
  .math-operator {
    font-size: 16px;
    color: #887a6b;
    margin: 0 4px;
  }
  .math-mult {
    font-size: 17px;
    color: var(--blood-red);
    font-weight: 900;
    text-shadow: 0 0 10px rgba(255, 34, 34, 0.7);
  }
  .pot-info {
    text-align: right;
  }
  .pot-val {
    font-size: 20px;
    color: var(--safe-gold);
    font-weight: 900;
    text-shadow: 0 0 14px rgba(255, 215, 0, 0.8);
    transition: transform 0.15s;
  }
  .bust-warning {
    font-size: 9px;
    color: #e74c3c;
    margin-top: 1px;
  }

  /* 주사위 트레이 (4-5 슬롯) */
  .dice-tray {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin: 4px 0;
  }
  .dice-slot {
    width: 68px;
    height: 74px;
    background: linear-gradient(145deg, #1f2537, #0e121d);
    border: 2px solid #3d3526;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    box-shadow: 0 4px 10px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.1);
    transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  }
  .dice-slot:active { transform: scale(0.94); }
  .dice-slot.held {
    border-color: var(--safe-gold);
    box-shadow: 0 0 14px rgba(255, 215, 0, 0.7), inset 0 0 8px rgba(255, 215, 0, 0.3);
    background: linear-gradient(145deg, #2b2b1a, #151508);
  }
  .dice-slot.held::after {
    content: "HOLD";
    position: absolute;
    top: -6px;
    background: var(--safe-gold);
    color: #000;
    font-size: 8px;
    font-weight: 900;
    padding: 1px 5px;
    border-radius: 4px;
  }
  .dice-slot.cursed {
    border-color: #ff0055;
    box-shadow: 0 0 14px rgba(255, 0, 85, 0.8);
    background: linear-gradient(145deg, #3a0010, #150005);
  }
  .dice-slot.cursed::after {
    content: "봉인";
    position: absolute;
    top: -6px;
    background: #ff0055;
    color: #fff;
    font-size: 8px;
    font-weight: 900;
    padding: 1px 5px;
    border-radius: 4px;
  }
  .dice-value {
    font-size: 28px;
    font-weight: 900;
    color: var(--bone-white);
    text-shadow: 0 2px 4px rgba(0,0,0,0.9);
    transition: transform 0.2s;
  }
  .dice-slot.rolling .dice-value {
    animation: diceSpin 0.35s ease-in-out infinite;
  }
  @keyframes diceSpin {
    0% { transform: rotate(0deg) scale(0.8); opacity: 0.5; }
    50% { transform: rotate(180deg) scale(1.1); opacity: 1; }
    100% { transform: rotate(360deg) scale(0.8); opacity: 0.5; }
  }
  .dice-type-tag {
    font-size: 8px;
    color: #999;
    margin-top: 2px;
    text-align: center;
    white-space: nowrap;
  }
  .dice-sticker-icon {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 10px;
  }

  .combat-log-ticker {
    background: rgba(0, 0, 0, 0.6);
    border-left: 3px solid var(--border-gold);
    padding: 4px 8px;
    font-size: 10px;
    color: #c0b8ac;
    height: 28px;
    display: flex;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 하단: 원핸드 컨트롤러 (29%) */
  #bottom-tactics-bar {
    height: 29%;
    background: #090a10;
    border-top: 1px solid #2d261e;
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    gap: 6px;
  }
  .gamble-actions-row {
    display: flex;
    gap: 8px;
    flex: 1;
  }
  .btn-gamble-push {
    flex: 1.1;
    background: linear-gradient(135deg, #8b0000 0%, #4a0000 100%);
    border: 2px solid #ff4444;
    border-radius: 8px;
    color: #fff;
    font-weight: 900;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(139, 0, 0, 0.6);
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .btn-gamble-push:active {
    transform: scale(0.97);
    box-shadow: 0 0 20px rgba(255, 34, 34, 0.9);
  }
  .btn-gamble-bank {
    flex: 1;
    background: linear-gradient(135deg, #c5a059 0%, #7d6534 100%);
    border: 2px solid var(--safe-gold);
    border-radius: 8px;
    color: #000;
    font-weight: 900;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(197, 160, 89, 0.5);
    transition: transform 0.1s;
  }
  .btn-gamble-bank:active {
    transform: scale(0.97);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.9);
  }
  .sub-actions-row {
    display: flex;
    gap: 6px;
    height: 40px;
  }
  .tactics-btn {
    flex: 1;
    background: #191c28;
    border: 1px solid #3a3224;
    border-radius: 6px;
    color: var(--bone-white);
    font-size: 11px;
    font-weight: bold;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.1s;
  }
  .tactics-btn:active { background: #282e42; }

  /* 모달 공통 스타일 */
  .game-modal {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(4, 5, 8, 0.95);
    z-index: 200;
    display: none;
    flex-direction: column;
    padding: 16px;
    backdrop-filter: blur(4px);
    overflow-y: auto;
  }
  .modal-header {
    font-size: 16px;
    font-weight: 900;
    color: var(--safe-gold);
    text-align: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #332d22;
  }
  .modal-close-btn {
    margin-top: 12px;
    background: #2a2015;
    border: 1px solid var(--border-gold);
    color: var(--bone-white);
    padding: 10px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    text-align: center;
  }

  /* 상점 상품 리스트 */
  .shop-items-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .shop-card {
    background: #111420;
    border: 1px solid #332b20;
    border-radius: 6px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .shop-card-title { font-size: 11px; font-weight: bold; color: var(--safe-gold); }
  .shop-card-desc { font-size: 9px; color: #a09789; margin: 4px 0; }
  .shop-card-price { font-size: 11px; color: #ffd700; font-weight: 900; margin-bottom: 6px; }
  .btn-buy {
    background: #8b0000;
    border: 1px solid #ff4444;
    color: #fff;
    padding: 5px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    cursor: pointer;
  }

  /* 부스터 팩 개봉 카드 3선택 컨테이너 */
  .booster-pack-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
  }
  .pack-choice-card {
    background: linear-gradient(135deg, #1c2033, #0f121d);
    border: 2px solid var(--safe-gold);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.6);
    transition: transform 0.15s, border-color 0.15s;
  }
  .pack-choice-card:active {
    transform: scale(0.98);
    border-color: #fff;
  }
  .pack-card-info h4 { font-size: 12px; color: var(--safe-gold); margin-bottom: 2px; }
  .pack-card-info p { font-size: 10px; color: #ccc; }

  /* 타격 컷인 오버레이 */
  #cutin-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.85);
    z-index: 150;
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    pointer-events: none;
  }
  .cutin-clash {
    display: flex;
    align-items: center;
    gap: 30px;
    position: relative;
  }
  .cutin-char { font-size: 70px; filter: drop-shadow(0 0 15px rgba(255, 34, 34, 0.9)); }
  .slash-fx {
    position: absolute;
    width: 260px;
    height: 6px;
    background: linear-gradient(90deg, transparent, #fff, var(--blood-red), transparent);
    transform: rotate(-35deg) scaleX(0);
    transition: transform 0.12s ease-out;
    box-shadow: 0 0 25px var(--blood-red);
  }
  .cutin-dmg-text {
    font-size: 38px;
    font-weight: 900;
    color: var(--safe-gold);
    text-shadow: 0 0 20px #ff2222;
    margin-top: 15px;
    text-align: center;
    transform: scale(0.5);
    transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  /* 777 피버 & 안내 배너 */
  #fever-banner {
    position: absolute;
    top: 45%; left: 50%; transform: translate(-50%, -50%) scale(0.8);
    background: linear-gradient(135deg, #ff5500 0%, #aa0000 100%);
    color: #fff;
    padding: 14px 22px;
    border-radius: 12px;
    border: 3px solid var(--safe-gold);
    font-size: 24px;
    font-weight: 900;
    text-align: center;
    box-shadow: 0 0 35px rgba(255, 85, 0, 0.9);
    display: none;
    z-index: 280;
    animation: pulse 0.5s infinite alternate;
  }
  @keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(0.95); }
    100% { transform: translate(-50%, -50%) scale(1.08); }
  }
  #sticker-banner {
    position: absolute;
    top: 36px; left: 50%; transform: translateX(-50%);
    background: rgba(197, 160, 89, 0.95);
    color: #000;
    padding: 5px 12px;
    border-radius: 16px;
    font-size: 10px;
    font-weight: 900;
    box-shadow: 0 0 15px rgba(255,215,0,0.8);
    display: none;
    z-index: 300;
  }

  /* 코인 샤워 파티클 */
  #coin-rain-container {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    z-index: 250;
    overflow: hidden;
  }
  .gold-coin-particle {
    position: absolute;
    font-size: 20px;
    animation: fall linear forwards;
  }
  @keyframes fall {
    0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(920px) rotate(720deg); opacity: 0; }
  }

  /* 진동 화면 효과 */
  .bust-screen-shake {
    animation: shake 0.35s cubic-bezier(.36,.07,.19,.97) both;
  }
  @keyframes shake {
    10%, 90% { transform: translate3d(-3px, 0, 0); }
    20%, 80% { transform: translate3d(5px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
    40%, 60% { transform: translate3d(6px, 0, 0); }
  }

  /* 고품질 고딕 일러스트 SVG 스타일 */
  .unit-svg {
    width: 48px;
    height: 48px;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.9));
    transition: transform 0.2s ease-out;
  }
  .unit-svg:hover { transform: scale(1.08) translateY(-2px); }
  .boss-svg {
    width: 62px;
    height: 62px;
    filter: drop-shadow(0 0 12px rgba(255, 34, 0, 0.7));
    animation: bossPulse 2s infinite ease-in-out alternate;
  }
  @keyframes bossPulse {
    0% { transform: scale(0.96) translateY(0); filter: drop-shadow(0 0 10px rgba(255, 34, 0, 0.6)); }
    100% { transform: scale(1.04) translateY(-3px); filter: drop-shadow(0 0 18px rgba(255, 80, 0, 0.9)); }
  }
  .relic-svg {
    width: 26px;
    height: 32px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
  }

  /* 카지노 펠트 테이블 백그라운드 */
  #top-battle-view {
    background: radial-gradient(circle at 50% 20%, #2b0e0e 0%, #0c080b 100%),
                repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 8px);
    border-bottom: 3px solid #3d2d1e;
    box-shadow: inset 0 -10px 20px rgba(0,0,0,0.8);
  }
  #middle-casino-board {
    background: radial-gradient(circle at 50% 40%, #17231c 0%, #070e0a 100%);
    border-top: 1px solid #233b2a;
    border-bottom: 2px solid #3d2d1e;
  }

  /* 3D 엠보싱 주사위 큐브 */
  .dice-slot {
    width: 72px;
    height: 78px;
    background: linear-gradient(145deg, #242938, #10131d);
    border: 2px solid #54442e;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.6);
  }
  .dice-value {
    font-family: 'Cinzel', 'Noto Serif KR', serif;
    font-size: 32px;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 0 10px rgba(255,215,0,0.8), 0 3px 6px #000;
  }


  /* 4대 영웅 고유 액티브 스킬 버튼 */
  .hero-skill-btn {
    margin-top: 3px;
    width: 52px;
    height: 18px;
    background: linear-gradient(135deg, #1f2736, #101520);
    border: 1px solid var(--border-gold);
    border-radius: 4px;
    color: var(--safe-gold);
    font-size: 8px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.8);
    transition: transform 0.1s, background 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .hero-skill-btn:active { transform: scale(0.92); }
  .hero-skill-btn.cooldown {
    opacity: 0.4;
    filter: grayscale(1);
    cursor: not-allowed;
    border-color: #555;
    color: #888;
  }

  /* 튜토리얼 퀵 가이드 모달 */
  .tutorial-step-card {
    background: #111420;
    border: 1px solid #3d3122;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .tutorial-step-icon {
    font-size: 28px;
    width: 44px;
    height: 44px;
    background: #1c2233;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--safe-gold);
  }
  .tutorial-step-text h4 { font-size: 12px; color: var(--safe-gold); margin-bottom: 2px; }
  .tutorial-step-text p { font-size: 10px; color: #b8b0a2; line-height: 1.4; }

  /* BUST 악마의 계약 부활 모달 */
  #revive-modal {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(10, 0, 0, 0.96);
    z-index: 290;
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 24px;
    backdrop-filter: blur(6px);
  }
  .revive-skull {
    font-size: 64px;
    animation: skullPulse 1.2s infinite ease-in-out alternate;
    filter: drop-shadow(0 0 20px #ff0033);
  }
  @keyframes skullPulse {
    0% { transform: scale(0.9); }
    100% { transform: scale(1.1); }
  }

</style>
</head>
<body>

<div id="mobile-viewport">
  <div id="crt-scanlines"></div>
  <div id="coin-rain-container"></div>
  <div id="sticker-banner">✨ 알림</div>
  <div id="fever-banner">🎰 777 FEVER! 🎰<br><span style="font-size: 14px; color: var(--safe-gold);">배율 X5.0 즉시 폭발!</span></div>

  <!-- 최상단 유틸리티 & 설정 바 -->
  <div id="top-utility-bar">
    <div>⚔️ ABYSS ROLL v2.0</div>
    <div style="display: flex; gap: 4px;">
      <button class="util-btn" onclick="openTutorialModal()">❓ 가이드</button>
      <button class="util-btn" id="btn-audio" onclick="toggleAudio()">🔊 소리 ON</button>
      <button class="util-btn" id="btn-speed" onclick="toggleSpeed()">⚡ 1X</button>
      <button class="util-btn" onclick="openHallOfFame()">🏆 랭킹</button>
    </div>
  </div>

  <!-- 상단 1: 5대 포일/폴리크롬 조커 슬롯 & 골드 & 안테 바 -->
  <div id="relic-joker-bar">
    <div class="relic-slots">
      <div class="relic-card foil" id="joker-0" onclick="inspectJoker(0)" title="블러드 칩스: +30 Chips">
        <svg viewBox="0 0 32 40" class="relic-svg">
  <defs>
    <radialGradient id="bloodGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff3333"/>
      <stop offset="80%" stop-color="#880000"/>
      <stop offset="100%" stop-color="#330000"/>
    </radialGradient>
  </defs>
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#141824" stroke="#00ffff" stroke-width="1.5"/>
  <circle cx="16" cy="18" r="9" fill="url(#bloodGlow)" stroke="#ff7777" stroke-width="1"/>
  <path d="M16 12 Q 13 17 13 20 A 3 3 0 0 0 19 20 Q 19 17 16 12 Z" fill="#ffffff"/>
</svg>
        <div class="relic-badge">+30</div>
      </div>
      <div class="relic-card polychrome" id="joker-1" onclick="inspectJoker(1)" title="황금 배율: X1.5 Mult">
        <svg viewBox="0 0 32 40" class="relic-svg">
  <defs>
    <linearGradient id="polyGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff275"/>
      <stop offset="50%" stop-color="#ff7700"/>
      <stop offset="100%" stop-color="#aa0055"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#1c1624" stroke="#ff7700" stroke-width="1.5"/>
  <!-- Ornate Golden Crown -->
  <polygon points="7,24 10,14 16,19 22,14 25,24" fill="url(#polyGold)" stroke="#ffd700" stroke-width="1"/>
  <rect x="7" y="24" width="18" height="3" fill="#ffd700"/>
  <circle cx="16" cy="10" r="2" fill="#00ffff"/>
</svg>
        <div class="relic-badge">X1.5</div>
      </div>
      <div class="relic-card" id="joker-2" onclick="inspectJoker(2)" title="불사조 보험: 자멸 1회 무효">
        <svg viewBox="0 0 32 40" class="relic-svg">
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#182218" stroke="#ffd700" stroke-width="1.5"/>
  <path d="M8 12 L 24 12 L 22 24 L 16 28 L 10 24 Z" fill="#992200" stroke="#ffd700" stroke-width="1"/>
  <!-- Phoenix Wings -->
  <path d="M10 16 Q 16 22 22 16 M 16 14 L 16 24" stroke="#ffd700" stroke-width="1.5" fill="none"/>
</svg>
        <div class="relic-badge">SHLD</div>
      </div>
      <div class="relic-card negative" id="joker-3" onclick="inspectJoker(3)" title="네거티브 심연 악마: 조커 슬롯 확장">
        <svg viewBox="0 0 32 40" class="relic-svg">
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#08080c" stroke="#ffffff" stroke-width="1.5"/>
  <!-- Horned Demon Skull -->
  <path d="M9 16 Q 6 8 4 6 Q 10 10 12 14" fill="#fff"/>
  <path d="M23 16 Q 26 8 28 6 Q 22 10 20 14" fill="#fff"/>
  <ellipse cx="16" cy="20" rx="6" ry="7" fill="#fff"/>
  <circle cx="14" cy="19" r="1.5" fill="#000"/>
  <circle cx="18" cy="19" r="1.5" fill="#000"/>
  <polygon points="15,23 16,24 17,23" fill="#000"/>
</svg>
        <div class="relic-badge">+1SLT</div>
      </div>
      <div class="relic-card" id="joker-4" onclick="inspectJoker(4)" style="opacity: 0.3;">
        <svg viewBox="0 0 32 40" class="relic-svg">
  <rect x="2" y="2" width="28" height="36" rx="3" fill="#0c0e14" stroke="#332a20" stroke-width="1"/>
  <!-- Lock -->
  <rect x="11" y="18" width="10" height="9" rx="2" fill="#554433"/>
  <path d="M13 18 L 13 14 A 3 3 0 0 1 19 14 L 19 18" stroke="#554433" stroke-width="2" fill="none"/>
</svg>
      </div>
    </div>
    <div class="meta-stats">
      <div class="gold-coin-display">
        <span>🪙</span>
        <span id="gold-val">750G</span>
      </div>
      <div class="ante-display" id="ante-info">ANTE 1/8</div>
    </div>
  </div>

  <!-- 상단 2: 던전 전투 아레나 -->
  <div id="top-battle-view">
    <div class="header-bar">
      <div>
        <span id="floor-title">DEPTHS 1 : CRYPT CASINO</span>
        <span class="boss-blind-tag" id="blind-tag">보스: 화염 골렘</span>
      </div>
      <div class="torch-gauge" onclick="lightTorch()">
        <span>🔥 횃불</span>
        <span id="torch-val">100%</span>
      </div>
    </div>

    <div class="stage-arena">
      <!-- 4인 아군 파티 (고품질 다크 판타지 고딕 벡터 일러스트) -->
      <div class="party-row" id="hero-party">
        <div class="entity-unit hero" id="hero-0">
          <div class="entity-avatar"><svg viewBox="0 0 64 64" class="unit-svg">
  <defs>
    <linearGradient id="crusaderSteel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9aaec4"/>
      <stop offset="50%" stop-color="#4a5d73"/>
      <stop offset="100%" stop-color="#1f2733"/>
    </linearGradient>
    <linearGradient id="crusaderGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe066"/>
      <stop offset="60%" stop-color="#c59b27"/>
      <stop offset="100%" stop-color="#5a4209"/>
    </linearGradient>
  </defs>
  <!-- Cape / Cloak -->
  <path d="M12 40 Q 6 58 10 64 L 54 64 Q 58 58 52 40 Z" fill="#661111" stroke="#220000" stroke-width="1.5"/>
  <!-- Pauldrons -->
  <path d="M6 34 Q 4 22 18 20 L 24 32 L 10 42 Z" fill="url(#crusaderSteel)" stroke="#111" stroke-width="1.5"/>
  <path d="M58 34 Q 60 22 46 20 L 40 32 L 54 42 Z" fill="url(#crusaderSteel)" stroke="#111" stroke-width="1.5"/>
  <!-- Torso Plate & Red Cross -->
  <path d="M18 28 L 46 28 L 42 54 L 22 54 Z" fill="url(#crusaderSteel)" stroke="#0e131a" stroke-width="2"/>
  <rect x="29" y="30" width="6" height="20" fill="#cc1111"/>
  <rect x="22" y="36" width="20" height="6" fill="#cc1111"/>
  <!-- Great Helm -->
  <path d="M20 10 L 44 10 L 46 32 L 32 40 L 18 32 Z" fill="url(#crusaderSteel)" stroke="#000" stroke-width="2"/>
  <path d="M30 14 L 34 14 L 34 36 L 30 36 Z" fill="url(#crusaderGold)"/>
  <path d="M22 22 L 42 22 L 42 26 L 22 26 Z" fill="url(#crusaderGold)"/>
  <!-- Glowing Eye Slits -->
  <rect x="23" y="23" width="7" height="2" fill="#00ffff" style="filter:drop-shadow(0 0 4px #00ffff);"/>
  <rect x="34" y="23" width="7" height="2" fill="#00ffff" style="filter:drop-shadow(0 0 4px #00ffff);"/>
  <!-- Crest Crown -->
  <polygon points="26,6 32,1 38,6 32,8" fill="url(#crusaderGold)" stroke="#222"/>
</svg></div>
          <div class="entity-name">성기사</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-0"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-0"></div></div>
          <button class="hero-skill-btn" id="h-skill-0" onclick="useHeroSkill(0)">🛡️ 가호</button>
        </div>
        <div class="entity-unit hero" id="hero-1">
          <div class="entity-avatar"><svg viewBox="0 0 64 64" class="unit-svg">
  <defs>
    <linearGradient id="barbSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b88360"/>
      <stop offset="100%" stop-color="#6e462e"/>
    </linearGradient>
    <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0e6d2"/>
      <stop offset="70%" stop-color="#8a7962"/>
      <stop offset="100%" stop-color="#2a2218"/>
    </linearGradient>
  </defs>
  <!-- Fur Mantle -->
  <path d="M10 32 Q 4 52 14 62 L 50 62 Q 60 52 54 32 Z" fill="#3a2f26" stroke="#16120e" stroke-width="2"/>
  <!-- Massive Shoulders & War Paint -->
  <path d="M12 28 Q 32 36 52 28 L 48 50 L 16 50 Z" fill="url(#barbSkin)" stroke="#2b1a10" stroke-width="2"/>
  <path d="M20 32 L 28 46 L 24 48 L 18 34 Z" fill="#990000"/>
  <path d="M44 32 L 36 46 L 40 48 L 46 34 Z" fill="#990000"/>
  <!-- Horned Helmet -->
  <!-- Left Horn -->
  <path d="M18 18 Q 4 10 2 0 Q 14 6 22 14 Z" fill="url(#hornGrad)" stroke="#111" stroke-width="1.5"/>
  <!-- Right Horn -->
  <path d="M46 18 Q 60 10 62 0 Q 50 6 42 14 Z" fill="url(#hornGrad)" stroke="#111" stroke-width="1.5"/>
  <!-- Iron Nose Guard Helm -->
  <path d="M20 12 L 44 12 L 45 28 L 36 28 L 34 38 L 30 38 L 28 28 L 19 28 Z" fill="#4a5057" stroke="#111" stroke-width="2"/>
  <!-- Glowing Blood Eyes -->
  <circle cx="25" cy="24" r="2.5" fill="#ff2200" style="filter:drop-shadow(0 0 3px #ff2200);"/>
  <circle cx="39" cy="24" r="2.5" fill="#ff2200" style="filter:drop-shadow(0 0 3px #ff2200);"/>
</svg></div>
          <div class="entity-name">야만용사</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-1"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-1"></div></div>
          <button class="hero-skill-btn" id="h-skill-1" onclick="useHeroSkill(1)">🪓 함성</button>
        </div>
        <div class="entity-unit hero" id="hero-2">
          <div class="entity-avatar"><svg viewBox="0 0 64 64" class="unit-svg">
  <defs>
    <linearGradient id="leatherCoat" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a3f35"/>
      <stop offset="100%" stop-color="#1f1a16"/>
    </linearGradient>
  </defs>
  <!-- Longcoat & Scarf -->
  <path d="M14 36 L 6 64 L 58 64 L 50 36 Z" fill="url(#leatherCoat)" stroke="#110d0a" stroke-width="2"/>
  <!-- Red Bandana Mask -->
  <path d="M22 26 L 42 26 L 46 44 L 32 52 L 18 44 Z" fill="#881111" stroke="#330000" stroke-width="1.5"/>
  <path d="M28 32 L 36 32 L 32 40 Z" fill="#aa2222"/>
  <!-- Tricorne Hat -->
  <path d="M6 16 Q 32 4 58 16 Q 44 24 32 20 Q 20 24 6 16 Z" fill="#18181c" stroke="#000" stroke-width="2"/>
  <path d="M20 16 Q 32 8 44 16 L 40 6 Q 32 4 24 6 Z" fill="#2c2c36"/>
  <!-- Shadowed Eyes under brim -->
  <ellipse cx="26" cy="22" rx="3" ry="1.5" fill="#ffd700" style="filter:drop-shadow(0 0 3px #ffd700);"/>
  <ellipse cx="38" cy="22" rx="3" ry="1.5" fill="#ffd700" style="filter:drop-shadow(0 0 3px #ffd700);"/>
</svg></div>
          <div class="entity-name">노상강도</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-2"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-2"></div></div>
          <button class="hero-skill-btn" id="h-skill-2" onclick="useHeroSkill(2)">🏹 사격</button>
        </div>
        <div class="entity-unit hero" id="hero-3">
          <div class="entity-avatar"><svg viewBox="0 0 64 64" class="unit-svg">
  <defs>
    <linearGradient id="voidPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#aa44ff"/>
      <stop offset="100%" stop-color="#330066"/>
    </linearGradient>
    <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff00ea"/>
      <stop offset="50%" stop-color="#9900ff"/>
      <stop offset="100%" stop-color="#000"/>
    </radialGradient>
  </defs>
  <!-- Dark Cult Robes -->
  <path d="M12 36 L 4 64 L 60 64 L 52 36 Z" fill="#1e182e" stroke="#0b0812" stroke-width="2"/>
  <!-- Mystical Turban -->
  <ellipse cx="32" cy="18" rx="16" ry="12" fill="#2d2244" stroke="#0f0b17" stroke-width="2"/>
  <!-- Elder Eye Gem in Forehead -->
  <path d="M27 16 Q 32 11 37 16 Q 32 21 27 16 Z" fill="#00ffcc" stroke="#003322" stroke-width="1"/>
  <circle cx="32" cy="16" r="2" fill="#ff0055"/>
  <!-- Bone Mask / Beard -->
  <path d="M24 24 L 40 24 L 38 38 L 32 44 L 26 38 Z" fill="#d8cfbe" stroke="#3d3528" stroke-width="1.5"/>
  <!-- Void Skull / Orb floating in hand -->
  <circle cx="48" cy="46" r="9" fill="url(#orbGlow)" stroke="#ff77ff" stroke-width="1" style="filter:drop-shadow(0 0 8px #aa00ff);"/>
  <!-- Glowing Occult Runes -->
  <circle cx="28" cy="30" r="1.5" fill="#00ffcc"/>
  <circle cx="36" cy="30" r="1.5" fill="#00ffcc"/>
</svg></div>
          <div class="entity-name">신비학자</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="h-hp-3"></div></div>
          <div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-3"></div></div>
          <button class="hero-skill-btn" id="h-skill-3" onclick="useHeroSkill(3)">🔮 의식</button>
        </div>
      </div>

      <!-- 보스 블라인드 몬스터 라인업 (고품질 다크 고딕 보스 & 하수인) -->
      <div class="monster-row" id="monster-party">
        <div class="entity-unit monster boss" id="mon-0">
          <div class="entity-avatar" id="boss-avatar"><svg viewBox="0 0 80 80" class="boss-svg">
  <defs>
    <linearGradient id="magmaRock" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3d2a24"/>
      <stop offset="50%" stop-color="#1f1410"/>
      <stop offset="100%" stop-color="#0a0503"/>
    </linearGradient>
    <linearGradient id="lavaVein" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffff00"/>
      <stop offset="30%" stop-color="#ff6600"/>
      <stop offset="100%" stop-color="#cc0000"/>
    </linearGradient>
  </defs>
  <!-- Stone Body Silhouette -->
  <polygon points="10,48 24,20 56,20 70,48 58,74 22,74" fill="url(#magmaRock)" stroke="#110905" stroke-width="3"/>
  <!-- Spiked Stone Shoulders -->
  <polygon points="4,32 18,18 26,34" fill="url(#magmaRock)" stroke="#111" stroke-width="2"/>
  <polygon points="76,32 62,18 54,34" fill="url(#magmaRock)" stroke="#111" stroke-width="2"/>
  <!-- Molten Lava Cracks -->
  <path d="M24 22 L 32 38 L 28 54 L 40 68" stroke="url(#lavaVein)" stroke-width="3.5" fill="none" style="filter:drop-shadow(0 0 6px #ff4400);"/>
  <path d="M56 22 L 48 38 L 52 54 L 42 68" stroke="url(#lavaVein)" stroke-width="3.5" fill="none" style="filter:drop-shadow(0 0 6px #ff4400);"/>
  <path d="M32 38 L 48 38" stroke="url(#lavaVein)" stroke-width="3" fill="none"/>
  <!-- Giant Glowing Magma Eyes -->
  <polygon points="26,30 36,32 32,38" fill="#ffff33" style="filter:drop-shadow(0 0 8px #ff5500);"/>
  <polygon points="54,30 44,32 48,38" fill="#ffff33" style="filter:drop-shadow(0 0 8px #ff5500);"/>
  <!-- Jagged Lava Maw -->
  <polygon points="28,48 34,54 40,48 46,54 52,48 48,58 32,58" fill="#ff3300" stroke="#ffaa00" stroke-width="1.5" style="filter:drop-shadow(0 0 8px #ff2200);"/>
  <!-- Lava Core Crest -->
  <polygon points="34,14 40,4 46,14" fill="#ffaa00" style="filter:drop-shadow(0 0 6px #ffff00);"/>
</svg></div>
          <div class="entity-name" id="boss-name">화염 골렘</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="m-hp-0"></div></div>
        </div>
        <div class="entity-unit monster" id="mon-1">
          <div class="entity-avatar"><svg viewBox="0 0 64 64" class="unit-svg">
  <!-- Ghostly Shroud -->
  <path d="M16 20 Q 32 6 48 20 L 52 58 Q 42 64 32 56 Q 22 64 12 58 Z" fill="#1b2828" stroke="#0d1717" stroke-width="2"/>
  <!-- Skeletal Face Mask -->
  <ellipse cx="32" cy="24" rx="10" ry="12" fill="#d9e0db" stroke="#1c2620" stroke-width="1.5"/>
  <!-- Hollow Ghostly Cyan Eyes -->
  <circle cx="28" cy="22" r="3.5" fill="#00ffff" style="filter:drop-shadow(0 0 6px #00ffff);"/>
  <circle cx="36" cy="22" r="3.5" fill="#00ffff" style="filter:drop-shadow(0 0 6px #00ffff);"/>
  <path d="M28 30 L 36 30" stroke="#111" stroke-width="2"/>
  <!-- Cursed Grimoire -->
  <polygon points="20,44 44,44 42,56 18,56" fill="#4a1515" stroke="#ff4444" stroke-width="1"/>
</svg></div>
          <div class="entity-name">망령 사제</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="m-hp-1"></div></div>
        </div>
        <div class="entity-unit monster" id="mon-2">
          <div class="entity-avatar"><svg viewBox="0 0 64 64" class="unit-svg">
  <!-- Beast Body -->
  <path d="M8 44 Q 18 20 44 26 L 58 46 L 46 56 L 16 56 Z" fill="#211c19" stroke="#0a0807" stroke-width="2"/>
  <!-- Ribcage Exposed Bone -->
  <path d="M26 34 L 32 44 M 34 32 L 40 42 M 42 34 L 46 44" stroke="#e0d5c1" stroke-width="2"/>
  <!-- Snarling Wolf Head -->
  <polygon points="40,24 58,16 62,32 48,36" fill="#302621" stroke="#0a0807" stroke-width="2"/>
  <!-- Piercing Crimson Eyes -->
  <circle cx="50" cy="22" r="2.5" fill="#ff0033" style="filter:drop-shadow(0 0 5px #ff0033);"/>
  <!-- Sharp Fangs with Blood -->
  <polygon points="56,32 58,38 60,32" fill="#fff"/>
  <polygon points="52,34 54,39 56,34" fill="#ff2222"/>
</svg></div>
          <div class="entity-name">지옥견</div>
          <div class="hp-bar-outer"><div class="hp-bar-inner" id="m-hp-2"></div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 중단: 발라트로 수학 스코어링 & 족보 & 주사위 트레이 -->
  <div id="middle-casino-board">
    <!-- 발라트로 족보 뱃지 -->
    <div class="poker-hand-badge" id="hand-badge">
      <div class="hand-title">
        <span id="hand-name">원 페어</span>
        <span class="hand-level" id="hand-lvl">Lv.1</span>
      </div>
      <div class="hand-bonus-val" id="hand-stats">+10 CHIPS × 1.5 MULT</div>
    </div>

    <!-- 발라트로 수식 디스플레이 -->
    <div class="balatro-score-box">
      <div>
        <span class="math-chips" id="math-chips">38 CHIPS</span>
        <span class="math-operator">×</span>
        <span class="math-mult" id="math-mult">X2 MULT</span>
        <div class="bust-warning" id="bust-label">⚠️ 주사위 [1, 2] 나오면 자멸!</div>
      </div>
      <div class="pot-info">
        <div style="font-size: 9px; color: #a89f91;">현재 화력 POT</div>
        <div class="pot-val" id="pot-display">76 POT</div>
      </div>
    </div>

    <!-- 주사위 4개 트레이 -->
    <div class="dice-tray">
      <div class="dice-slot" id="slot-0" onclick="toggleHold(0)">
        <div class="dice-value" id="dval-0">-</div>
        <div class="dice-type-tag" id="dtag-0">D6 뼈 (흡혈)</div>
        <div class="dice-sticker-icon" id="dsticker-0">🩸</div>
      </div>
      <div class="dice-slot" id="slot-1" onclick="toggleHold(1)">
        <div class="dice-value" id="dval-1">-</div>
        <div class="dice-type-tag" id="dtag-1">D6 뼈 (스턴)</div>
        <div class="dice-sticker-icon" id="dsticker-1">⚡</div>
      </div>
      <div class="dice-slot" id="slot-2" onclick="toggleHold(2)">
        <div class="dice-value" id="dval-2">-</div>
        <div class="dice-type-tag" id="dtag-2">D8 황동</div>
        <div class="dice-sticker-icon" id="dsticker-2"></div>
      </div>
      <div class="dice-slot" id="slot-3" onclick="toggleHold(3)">
        <div class="dice-value" id="dval-3">-</div>
        <div class="dice-type-tag" id="dtag-3">D20 황금</div>
        <div class="dice-sticker-icon" id="dsticker-3">⭐</div>
      </div>
    </div>

    <div class="combat-log-ticker" id="log-ticker">
      🎲 ANTE 1 보스 블라인드 [화염 골렘] 등장! 주사위를 던져 배율을 증폭하세요!
    </div>
  </div>

  <!-- 하단: 원핸드 컨트롤러 -->
  <div id="bottom-tactics-bar">
    <div class="gamble-actions-row">
      <button class="btn-gamble-push" id="btn-push" onclick="pushDoubleDown()">
        <span>🔥 묻고 더블로! (X2 MULT)</span>
        <span style="font-size: 10px; font-weight: normal; opacity: 0.9;">배율 2배 곱연산 & 자멸 리스크</span>
      </button>
      <button class="btn-gamble-bank" id="btn-bank" onclick="bankAndStrike()">
        <span>💰 멈추고 타격!</span>
        <span style="font-size: 10px; font-weight: normal; opacity: 0.9;">현재 화력 전액 일격 발사</span>
      </button>
    </div>

    <div class="sub-actions-row">
      <button class="tactics-btn" onclick="initialRoll()">
        <span>🎲 주사위 투척</span>
      </button>
      <button class="tactics-btn" onclick="rerollUnlocked()">
        <span>🔄 리롤 (<span id="reroll-count">2</span>)</span>
      </button>
      <button class="tactics-btn" onclick="openShop()">
        <span>🛒 암시장 상점</span>
      </button>
      <button class="tactics-btn" onclick="openPackModal('celestial')">
        <span>🪐 천체 팩</span>
      </button>
    </div>
  </div>

  <!-- 암시장 상점 모달 -->
  <div class="game-modal" id="shop-modal">
    <div class="modal-header">🩸 심연의 암시장 (Black Market)</div>
    <div class="shop-items-grid">
      <div class="shop-card">
        <div class="shop-card-title">🃏 광대 조커 팩</div>
        <div class="shop-card-desc">3장의 조커 렐릭 중 1개 선택 획득</div>
        <div class="shop-card-price">140G</div>
        <button class="btn-buy" onclick="buyItem('buffoon_pack', 140)">개봉하기</button>
      </div>
      <div class="shop-card">
        <div class="shop-card-title">🪐 천체 행성 팩</div>
        <div class="shop-card-desc">포커 족보 칩스/배율 영구 레벨업</div>
        <div class="shop-card-price">110G</div>
        <button class="btn-buy" onclick="buyItem('celestial_pack', 110)">개봉하기</button>
      </div>
      <div class="shop-card">
        <div class="shop-card-title">🔮 점술 타로 팩</div>
        <div class="shop-card-desc">신비한 타로 아르카나 카드로 주사위/골드/체력 강화</div>
        <div class="shop-card-price">95G</div>
        <button class="btn-buy" onclick="buyItem('tarot_pack', 95)">개봉하기</button>
      </div>
      <div class="shop-card">
        <div class="shop-card-title">🛡️ 불사조 보험 계약</div>
        <div class="shop-card-desc">자멸(BUST) 1회 완전 무효 방어</div>
        <div class="shop-card-price">100G</div>
        <button class="btn-buy" onclick="buyItem('bust_shield', 100)">구매하기</button>
      </div>
      <div class="shop-card">
        <div class="shop-card-title">✨ D20 황금 주사위</div>
        <div class="shop-card-desc">2번 슬롯을 20면체 황금 주사위로 승급</div>
        <div class="shop-card-price">150G</div>
        <button class="btn-buy" onclick="buyItem('upgrade_d20', 150)">구매하기</button>
      </div>
      <div class="shop-card">
        <div class="shop-card-title">🩸 피의 성배 (리롤 +3)</div>
        <div class="shop-card-desc">전투 중 무료 리롤 3회 충전</div>
        <div class="shop-card-price">80G</div>
        <button class="btn-buy" onclick="buyItem('extra_rerolls', 80)">구매하기</button>
      </div>
      <div class="shop-card">
        <div class="shop-card-title">⚡ 번개 스턴 스티커</div>
        <div class="shop-card-desc">주사위에 확정 기절 스티커 각인</div>
        <div class="shop-card-price">90G</div>
        <button class="btn-buy" onclick="buyItem('stun_sticker', 90)">구매하기</button>
      </div>
    </div>
    <div class="modal-close-btn" onclick="closeShop()">던전으로 복귀</div>
  </div>

  <!-- 부스터 팩 선택 모달 -->
  <div class="game-modal" id="pack-modal">
    <div class="modal-header" id="pack-modal-title">🃏 부스터 팩 개봉</div>
    <div style="font-size: 11px; text-align: center; color: #a89f91; margin-bottom: 8px;">획득할 카드를 1장 선택하세요</div>
    <div class="booster-pack-cards" id="pack-cards-container">
      <!-- 동적 주입 -->
    </div>
    <div class="modal-close-btn" onclick="closePackModal()">건너뛰기</div>
  </div>

  <!-- 명예의 전당 (Leaderboard) 모달 -->
  <div class="game-modal" id="hall-of-fame-modal">
    <div class="modal-header">🏆 심연의 명예의 전당</div>
    <div style="font-size: 11px; color: #bbb; line-height: 1.6; margin-bottom: 12px;" id="hall-stats">
      <!-- 동적 주입 -->
    </div>
    <div class="modal-close-btn" onclick="closeHallOfFame()">닫기</div>
  </div>

  <!-- 승리 / 게임 오버 모달 -->
  <div class="game-modal" id="endgame-modal">
    <div class="modal-header" id="endgame-title">🏆 ANTE 8 클리어! 심연 정복!</div>
    <div style="font-size: 12px; color: #ccc; line-height: 1.8; margin-bottom: 15px; text-align: center;" id="endgame-desc">
      축하합니다! 당신은 피의 카지노 모든 심연 보스를 격파했습니다!
    </div>
    <button class="btn-gamble-push" style="height: 48px; width: 100%; margin-bottom: 8px;" onclick="enterEndlessMode()">
      🔥 무한 심연 모드 (Endless) 계속하기
    </button>
    <button class="btn-gamble-bank" style="height: 44px; width: 100%;" onclick="restartNewRun()">
      🔄 새로운 런 시작하기
    </button>
  </div>

  
  <!-- 초보자 3초 룰 퀵 튜토리얼 모달 -->
  <div class="game-modal" id="tutorial-modal">
    <div class="modal-header">🎲 3초 퀵 가이드 : 피의 카지노 룰</div>
    <div class="tutorial-step-card">
      <div class="tutorial-step-icon">🎲</div>
      <div class="tutorial-step-text">
        <h4>1단계: 주사위 투척 & 족보 완성</h4>
        <p>4개의 주사위를 던져 발라트로 족보(야추, 풀하우스, 포카드)를 완성하고 기본 칩스를 만듭니다.</p>
      </div>
    </div>
    <div class="tutorial-step-card">
      <div class="tutorial-step-icon">🔥</div>
      <div class="tutorial-step-text">
        <h4>2단계: 묻고 더블로! (배율 폭발)</h4>
        <p>배율을 2배, 4배, 8배로 튀기세요! 단, 배율이 높아질수록 주사위 1~3 자멸(BUST) 확률이 증가합니다.</p>
      </div>
    </div>
    <div class="tutorial-step-card">
      <div class="tutorial-step-icon">💰</div>
      <div class="tutorial-step-text">
        <h4>3단계: 멈추고 타격! & 암시장</h4>
        <p>탐욕을 제어하고 일격을 발사해 보스를 격파하세요! 획득한 골드로 조커와 타로 팩을 구매합니다.</p>
      </div>
    </div>
    <button class="btn-gamble-push" style="height: 44px; width: 100%; margin-top: 10px;" onclick="closeTutorialModal()">
      ⚔️ 심연의 카지노 입장하기
    </button>
  </div>

  <!-- BUST 악마의 계약 (부활 & 판돈 복구) 모달 -->
  <div id="revive-modal">
    <div class="revive-skull">💀</div>
    <div style="font-size: 18px; font-weight: 900; color: #ff3333; margin: 12px 0 6px 0; text-align: center;">
      탐욕의 파멸! BUST 발생!
    </div>
    <div style="font-size: 11px; color: #ccc; text-align: center; margin-bottom: 20px; line-height: 1.6;">
      심연의 악마가 제안합니다.<br>
      잃어버린 <b id="lost-pot-display" style="color: #ffd700; font-size: 14px;">0 POT</b> 화력을 전액 복구하고 도박을 계속하시겠습니까?
    </div>
    <button class="btn-gamble-push" style="height: 50px; width: 100%; margin-bottom: 10px;" onclick="acceptReviveDeal()">
      📺 영혼의 계약 (판돈 100% 즉시 복구)
    </button>
    <button class="btn-gamble-bank" style="height: 42px; width: 100%; background: #222; border-color: #555; color: #aaa;" onclick="declineReviveDeal()">
      파멸을 받아들이고 턴 넘기기
    </button>
  </div>

  <!-- 타격 컷인 오버레이 -->
  <div id="cutin-overlay">
    <div class="cutin-clash">
      <div class="cutin-char" id="cutin-attacker">🛡️</div>
      <div class="slash-fx" id="slash-fx"></div>
      <div class="cutin-char" id="cutin-target">👹</div>
    </div>
    <div class="cutin-dmg-text" id="cutin-dmg">CRITICAL!<br>-360</div>
  </div>
</div>

<script>
// Web Audio 신디사이저 엔진 & BGM 오실레이터
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
let isAudioMuted = false;
let gameSpeed = 1.0;
let bgmOsc1 = null, bgmOsc2 = null, bgmGain = null;

function initAudio() {
  if (!actx) {
    actx = new AudioCtx();
    startProceduralBgm();
  }
  if (actx.state === 'suspended') {
    actx.resume();
  }
}

function startProceduralBgm() {
  if (!actx || bgmOsc1) return;
  try {
    bgmGain = actx.createGain();
    bgmGain.gain.setValueAtTime(isAudioMuted ? 0 : 0.04, actx.currentTime);
    bgmGain.connect(actx.destination);

    // D minor drone: D2 (73.42Hz) & A2 (110Hz)
    bgmOsc1 = actx.createOscillator();
    bgmOsc1.type = 'triangle';
    bgmOsc1.frequency.setValueAtTime(73.42, actx.currentTime);
    bgmOsc1.connect(bgmGain);
    bgmOsc1.start();

    bgmOsc2 = actx.createOscillator();
    bgmOsc2.type = 'sine';
    bgmOsc2.frequency.setValueAtTime(110.0, actx.currentTime);
    bgmOsc2.connect(bgmGain);
    bgmOsc2.start();
  } catch(e) {}
}

function playTone(freq, duration, type = 'sine', vol = 0.4) {
  if (isAudioMuted) return;
  initAudio();
  try {
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, actx.currentTime);
    gain.gain.setValueAtTime(vol, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + (duration / gameSpeed));
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + (duration / gameSpeed));
  } catch(e) {}
}

function playDiceSound() {
  playTone(520, 0.07, 'triangle', 0.35);
  setTimeout(() => playTone(680, 0.08, 'triangle', 0.35), 40 / gameSpeed);
}

function playHeavySlashSound() {
  initAudio();
  if (isAudioMuted) return;
  try {
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, actx.currentTime + (0.28 / gameSpeed));
    gain.gain.setValueAtTime(0.6, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + (0.28 / gameSpeed));
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + (0.28 / gameSpeed));
  } catch(e) {}
}

function playBustSound() {
  playTone(180, 0.45, 'sawtooth', 0.6);
  setTimeout(() => playTone(120, 0.5, 'square', 0.5), 100 / gameSpeed);
}

function playCoinSound() {
  playTone(987, 0.1, 'sine', 0.4);
  setTimeout(() => playTone(1318, 0.15, 'sine', 0.4), 80 / gameSpeed);
}

function triggerHaptic(type) {
  if (!navigator.vibrate) return;
  try {
    if (type === 'roll') navigator.vibrate(25);
    else if (type === 'push') navigator.vibrate([35, 20, 55]);
    else if (type === 'bust') navigator.vibrate([90, 40, 90, 40, 150]);
    else if (type === 'crit') navigator.vibrate([100, 30, 80]);
    else if (type === 'coin') navigator.vibrate([15, 10, 20]);
  } catch(e) {}
}

function playHandFanfare(hand) {
  if (isAudioMuted) return;
  initAudio();
  if (hand === '야추 (5 of a Kind)') {
    [523, 659, 783, 1046, 1318].forEach((f, i) => setTimeout(() => playTone(f, 0.15, 'triangle', 0.5), (i * 70) / gameSpeed));
  } else if (hand === '포카드 (4 of a Kind)' || hand === '풀하우스 (Full House)') {
    [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.12, 'sine', 0.45), (i * 80) / gameSpeed));
  } else if (hand === '스트레이트 (Straight)' || hand === '트리플 (3 of a Kind)') {
    [392, 523, 659].forEach((f, i) => setTimeout(() => playTone(f, 0.1, 'sine', 0.4), (i * 90) / gameSpeed));
  } else {
    playTone(440, 0.08, 'sine', 0.3);
  }
}


function toggleAudio() {
  initAudio();
  isAudioMuted = !isAudioMuted;
  document.getElementById('btn-audio').innerText = isAudioMuted ? '🔇 소리 OFF' : '🔊 소리 ON';
  if (bgmGain) {
    bgmGain.gain.setValueAtTime(isAudioMuted ? 0 : 0.04, actx.currentTime);
  }
}

function toggleSpeed() {
  if (gameSpeed === 1.0) {
    gameSpeed = 2.0;
    document.getElementById('btn-speed').innerText = '⚡ 2X';
  } else {
    gameSpeed = 1.0;
    document.getElementById('btn-speed').innerText = '⚡ 1X';
  }
}

// ----------------------------------------------------
// 게임 상태 & 발라트로 수학 모델
// ----------------------------------------------------
let gold = 750;
let currentAnte = 1;
let rerollsLeft = 2;
let torch = 100;
let handsLeft = 4; // 바늘 군주 기믹 등에서 사용
let maxSinglePot = 0;
let totalDamageDealt = 0;

let baseChips = 0;
let currentMult = 1;
let currentPot = 0;
let extraJokerMult = 1.5; // 황금 조커
let foilBonusChips = 30;  // 블러드 칩스
let hasBustShield = true;  // 불사조 보험
let cursedSlotIndex = 0;   // 보스 저주 슬롯

let diceSides = [6, 6, 8, 20];
let diceValues = [3, 4, 5, 12];
let heldSlots = [false, false, false, false];
let diceStickers = ['흡혈', '스턴', '', '황금'];

// 발라트로 포커 족보 레벨 & 기본 스탯
const handBook = {
  '야추 (5 of a Kind)': { lvl: 1, baseChips: 100, baseMult: 8, chipGrowth: 30, multGrowth: 2 },
  '포카드 (4 of a Kind)': { lvl: 1, baseChips: 70, baseMult: 6, chipGrowth: 25, multGrowth: 1.5 },
  '풀하우스 (Full House)': { lvl: 1, baseChips: 50, baseMult: 5, chipGrowth: 20, multGrowth: 1 },
  '스트레이트 (Straight)': { lvl: 1, baseChips: 40, baseMult: 4, chipGrowth: 15, multGrowth: 1 },
  '트리플 (3 of a Kind)': { lvl: 1, baseChips: 30, baseMult: 3, chipGrowth: 12, multGrowth: 0.8 },
  '투 페어 (Two Pair)': { lvl: 1, baseChips: 20, baseMult: 2, chipGrowth: 10, multGrowth: 0.5 },
  '원 페어 (One Pair)': { lvl: 1, baseChips: 12, baseMult: 1.5, chipGrowth: 8, multGrowth: 0.4 },
  '하이 다이스 (High Die)': { lvl: 1, baseChips: 8, baseMult: 1.0, chipGrowth: 5, multGrowth: 0.2 }
};
let currentDetectedHand = '하이 다이스 (High Die)';

// 파티 & 보스 블라인드 정의 (Ante 1 to 8)
const BOSS_BLINDS = [
  { ante: 1, name: '화염 골렘', icon: '👹', hp: 350, desc: '주사위 1개 봉인' },
  { ante: 2, name: '갈고리 사냥꾼', icon: '🪝', hp: 600, desc: '리롤 시 주사위 1개 버림' },
  { ante: 3, name: '바늘 군주', icon: '🪡', hp: 900, desc: '단 2회의 기회만 허용' },
  { ante: 4, name: '성벽 거수', icon: '🗿', hp: 1600, desc: '초고체력 벽돌 몬스터' },
  { ante: 5, name: '감시자의 눈', icon: '👁️', hp: 2400, desc: '이전 족보 재사용 불가' },
  { ante: 6, name: '부패의 손', icon: '🖐️', hp: 3500, desc: '족보 레벨 다운그레이드' },
  { ante: 7, name: '탐욕의 황소', icon: '🐂', hp: 5000, desc: '자멸 시 골드 50% 강탈' },
  { ante: 8, name: '심연의 지배자', icon: '👑', hp: 8000, desc: '최종 결전! 모든 저주 복합' }
];

let heroes = [
  { name: '성기사', maxHp: 130, hp: 130, stress: 0, icon: '🛡️' },
  { name: '야만용사', maxHp: 110, hp: 110, stress: 15, icon: '🪓' },
  { name: '노상강도', maxHp: 95, hp: 95, stress: 10, icon: '🏹' },
  { name: '신비학자', maxHp: 85, hp: 85, stress: 5, icon: '🔮' }
];

let monsters = [];

// ----------------------------------------------------
// 포커 족보 판정 알고리즘 (Balatro Poker Engine)
// ----------------------------------------------------
function evaluateDiceHand(values) {
  const counts = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const freq = Object.values(counts).sort((a, b) => b - a);

  // 스트레이트 판별 (정렬 후 연속 여부)
  const sortedUniq = Array.from(new Set(values)).sort((a, b) => a - b);
  let isStraight = false;
  if (sortedUniq.length >= 4) {
    if (sortedUniq[3] - sortedUniq[0] === 3) isStraight = true;
  }

  if (freq[0] >= 5) return '야추 (5 of a Kind)';
  if (freq[0] === 4) return '포카드 (4 of a Kind)';
  if (freq[0] === 3 && freq[1] >= 2) return '풀하우스 (Full House)';
  if (isStraight) return '스트레이트 (Straight)';
  if (freq[0] === 3) return '트리플 (3 of a Kind)';
  if (freq[0] === 2 && freq[1] === 2) return '투 페어 (Two Pair)';
  if (freq[0] === 2) return '원 페어 (One Pair)';
  return '하이 다이스 (High Die)';
}

// ----------------------------------------------------
// 전투 및 주사위 루프
// ----------------------------------------------------
function initialRoll() {
  initAudio();
  playDiceSound();
  triggerHaptic('roll');

  // 주사위 롤링 텀블링 애니메이션
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById(`slot-${i}`);
    el.classList.add('rolling');
    let tumbleCount = 0;
    const interval = setInterval(() => {
      document.getElementById(`dval-${i}`).innerText = Math.floor(Math.random() * diceSides[i]) + 1;
      tumbleCount++;
      if (tumbleCount > 5) {
        clearInterval(interval);
        document.getElementById(`dval-${i}`).innerText = diceValues[i];
        el.classList.remove('rolling');
      }
    }, 40 / gameSpeed);
  }

  let luckyCount = 0;
  for (let i = 0; i < 4; i++) {
    diceValues[i] = Math.floor(Math.random() * diceSides[i]) + 1;
    if (diceValues[i] >= 7) luckyCount++;
  }

  setTimeout(() => {
    currentDetectedHand = evaluateDiceHand(diceValues);
    applyHandScore();
    playHandFanfare(currentDetectedHand);

    if (luckyCount >= 2) {
      triggerFeverTime();
    } else {
      setLog(`🎲 [${currentDetectedHand}] 감지! 화력: ${currentPot} POT! 묻고 더블로!`);
    }
  }, 220 / gameSpeed);
}

function applyHandScore() {
  const handData = handBook[currentDetectedHand];
  const handChips = handData.baseChips + ((handData.lvl - 1) * handData.chipGrowth);
  const handMult = handData.baseMult + ((handData.lvl - 1) * handData.multGrowth);

  let diceSum = diceValues.reduce((a, b) => a + b, 0);
  baseChips = diceSum + handChips + foilBonusChips;
  currentMult = Math.round(handMult * 10) / 10;
  currentPot = Math.round(baseChips * currentMult * extraJokerMult);

  document.getElementById('hand-name').innerText = currentDetectedHand;
  document.getElementById('hand-lvl').innerText = `Lv.${handData.lvl}`;
  document.getElementById('hand-stats').innerText = `+${handChips} CHIPS × ${handMult.toFixed(1)} MULT`;
  updateBalatroUI();
}

function toggleHold(idx) {
  initAudio();
  if (idx === cursedSlotIndex) {
    setLog('⚠️ 보스의 저주로 인해 이 주사위 슬롯은 잠겨 있습니다!');
    return;
  }
  heldSlots[idx] = !heldSlots[idx];
  const el = document.getElementById(`slot-${idx}`);
  if (heldSlots[idx]) {
    el.classList.add('held');
  } else {
    el.classList.remove('held');
  }
  playTone(440, 0.05, 'sine', 0.2);
}

function rerollUnlocked() {
  initAudio();
  if (rerollsLeft <= 0) {
    setLog('⚠️ 남은 리롤 횟수가 없습니다!');
    return;
  }
  rerollsLeft--;
  document.getElementById('reroll-count').innerText = rerollsLeft;
  playDiceSound();

  // Ante 2 '갈고리 사냥꾼' 기믹: 리롤할 때마다 무작위 1개 주사위 값 1로 추락
  if (currentAnte === 2) {
    const unheld = [0, 1, 2, 3].filter(i => !heldSlots[i]);
    if (unheld.length > 0) {
      const dropIdx = unheld[Math.floor(Math.random() * unheld.length)];
      diceValues[dropIdx] = 1;
      setLog(`🪝 [갈고리 저주!] ${dropIdx+1}번 주사위가 1로 파괴되었습니다!`);
    }
  }

  for (let i = 0; i < 4; i++) {
    if (!heldSlots[i] && i !== cursedSlotIndex) {
      diceValues[i] = Math.floor(Math.random() * diceSides[i]) + 1;
      document.getElementById(`dval-${i}`).innerText = diceValues[i];
    }
  }

  currentDetectedHand = evaluateDiceHand(diceValues);
  applyHandScore();
  setLog(`🔄 리롤 완료! 족보: [${currentDetectedHand}] -> 화력 ${currentPot} POT`);
}


// ----------------------------------------------------
// 4대 영웅 고유 액티브 스킬 시스템
// ----------------------------------------------------
let heroSkillCooldowns = [0, 0, 0, 0];
let heroSkillMaxCD = [3, 2, 2, 1];
let isCrusaderShieldActive = false;
let highwaymanCritNext = false;
let lastBustedPot = 0;

function useHeroSkill(idx) {
  initAudio();
  if (heroSkillCooldowns[idx] > 0) {
    setLog(`⚠️ [${heroes[idx].name}] 스킬 쿨다운 중입니다! (${heroSkillCooldowns[idx]}턴 남음)`);
    return;
  }

  heroSkillCooldowns[idx] = heroSkillMaxCD[idx];
  updateHeroSkillUI();

  if (idx === 0) {
    // 성기사: 신의 가호 (BUST 1회 완전 방어)
    isCrusaderShieldActive = true;
    playTone(880, 0.25, 'triangle', 0.5);
    triggerHaptic('push');
    showBanner('🛡️ 성기사의 신의 가호! 다음 BUST 무효화!');
    setLog('🛡️ [성기사: 신의 가호] 이번 턴 자멸(BUST)을 무효화하는 성스러운 방패를 둘렀습니다!');
  } else if (idx === 1) {
    // 야만용사: 피의 함성 (기본 칩스 +40 즉시 추가)
    baseChips += 40;
    currentPot = Math.round(baseChips * currentMult * extraJokerMult);
    updateBalatroUI();
    playTone(110, 0.35, 'sawtooth', 0.6);
    triggerHaptic('push');
    showBanner('🪓 야만용사의 피의 함성! 기본 칩스 +40!');
    setLog('🪓 [야만용사: 피의 함성] 전투의 함성으로 기본 칩스 +40을 폭발시켰습니다!');
  } else if (idx === 2) {
    // 노상강도: 급소 사격 (다음 타격 배율 치명타 X1.5 영구 곱연산)
    highwaymanCritNext = true;
    extraJokerMult *= 1.5;
    currentPot = Math.round(baseChips * currentMult * extraJokerMult);
    updateBalatroUI();
    playTone(1200, 0.1, 'sine', 0.5);
    setTimeout(() => playTone(300, 0.2, 'square', 0.5), 60);
    triggerHaptic('push');
    showBanner('🏹 노상강도의 급소 사격! 치명타 X1.5 장전!');
    setLog('🏹 [노상강도: 급소 사격] 탄환에 치명타 화약을 장전하여 배율을 X1.5 증폭했습니다!');
  } else if (idx === 3) {
    // 신비학자: 혼돈의 의식 (스트레스 +15 대신 리롤 +2 충전)
    heroes[3].stress = Math.min(100, heroes[3].stress + 15);
    rerollsLeft += 2;
    document.getElementById('reroll-count').innerText = rerollsLeft;
    updateEntityUI();
    playTone(666, 0.3, 'sine', 0.5);
    triggerHaptic('roll');
    showBanner('🔮 신비학자의 의식! 리롤 +2회 즉시 충전!');
    setLog('🔮 [신비학자: 혼돈의 의식] 어둠과 거래하여 스트레스 대가로 리롤 2회를 충전했습니다!');
  }
}

function updateHeroSkillUI() {
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`h-skill-${i}`);
    if (!btn) continue;
    if (heroSkillCooldowns[i] > 0) {
      btn.classList.add('cooldown');
      btn.innerText = `⏳ ${heroSkillCooldowns[i]}T`;
    } else {
      btn.classList.remove('cooldown');
      const names = ['🛡️ 가호', '🪓 함성', '🏹 사격', '🔮 의식'];
      btn.innerText = names[i];
    }
  }
}

function tickCooldowns() {
  for (let i = 0; i < 4; i++) {
    if (heroSkillCooldowns[i] > 0) heroSkillCooldowns[i]--;
  }
  updateHeroSkillUI();
}

// ----------------------------------------------------
// 튜토리얼 퀵 가이드 모달 제어
// ----------------------------------------------------
function openTutorialModal() {
  initAudio();
  document.getElementById('tutorial-modal').style.display = 'flex';
}
function closeTutorialModal() {
  document.getElementById('tutorial-modal').style.display = 'none';
  try { localStorage.setItem('abyss_roll_tutorial_seen', '1'); } catch(e) {}
}

// ----------------------------------------------------
// BUST 악마의 계약 부활 BM 시스템
// ----------------------------------------------------
function promptReviveDeal(lostPot) {
  lastBustedPot = lostPot;
  document.getElementById('lost-pot-display').innerText = `${lostPot} POT`;
  document.getElementById('revive-modal').style.display = 'flex';
  playTone(200, 0.4, 'sawtooth', 0.5);
}

function acceptReviveDeal() {
  initAudio();
  document.getElementById('revive-modal').style.display = 'none';
  showBanner('⏳ 영혼의 계약 성립 중... (3초 복구)');
  
  setTimeout(() => {
    currentPot = lastBustedPot;
    baseChips = Math.max(30, Math.round(lastBustedPot / (currentMult * extraJokerMult)));
    updateBalatroUI();
    playFeverFanfare();
    triggerHaptic('push');
    showBanner(`✨ 부활 성공! ${currentPot} POT 화력 전액 복구!`);
    setLog(`✨ [악마의 계약] 잃어버린 ${currentPot} POT 화력이 전액 복구되었습니다! 계속 배팅하세요!`);
  }, 1200 / gameSpeed);
}

function declineReviveDeal() {
  document.getElementById('revive-modal').style.display = 'none';
  setLog('💀 파멸을 겸허히 받아들였습니다. 다음 기회를 노리세요.');
}

function pushDoubleDown() {
  initAudio();
  if (baseChips <= 0) {
    initialRoll();
    return;
  }
  playDiceSound();

  // 묻고 더블로 리스크: 배율이 올라갈수록 자멸 주사위 확률 증가
  let bustThresh = currentMult <= 2 ? 1 : (currentMult <= 5 ? 2 : 3);
  let testRoll = Math.floor(Math.random() * 6) + 1;

  if (testRoll <= bustThresh) {
    if (hasBustShield) {
      hasBustShield = false;
      document.getElementById('joker-2').style.opacity = '0.3';
      playCoinSound();
      showBanner('🛡️ 불사조 보험 발동! BUST 1회 완전 방어!');
      setLog(`🛡️ [보험 발동!] 주사위 [${testRoll}] 자멸을 불사조 쉴드가 흡수했습니다!`);
      return;
    }

    playBustSound();
    triggerHaptic('bust');
    document.getElementById('mobile-viewport').classList.add('bust-screen-shake');
    setTimeout(() => document.getElementById('mobile-viewport').classList.remove('bust-screen-shake'), 400);

    // Ante 7 탐욕의 황소 기믹
    if (currentAnte === 7) {
      let lostGold = Math.floor(gold * 0.5);
      gold -= lostGold;
      document.getElementById('gold-val').innerText = `${gold}G`;
      setLog(`🐂 [황소 저주!] BUST로 골드 ${lostGold}G를 강탈당했습니다!`);
    }

    if (isCrusaderShieldActive) {
      isCrusaderShieldActive = false;
      playCoinSound();
      showBanner('🛡️ 성기사의 신의 가호 발동! BUST 1회 방어!');
      setLog(`🛡️ [신의 가호 발동!] 주사위 [${testRoll}] 자멸을 성기사의 방패가 막아냈습니다!`);
      return;
    }

    let savePot = currentPot;
    setLog(`💀 [BUST!] 주사위 [${testRoll}] 자멸! ${currentPot} POT 전액 소멸! 파티 스트레스 폭증!`);
    baseChips = 0;
    currentMult = 1;
    currentPot = 0;
    updateBalatroUI();
    promptReviveDeal(savePot);

    heroes.forEach((h, i) => {
      h.stress = Math.min(100, h.stress + 25);
      document.getElementById(`h-st-${i}`).style.width = `${h.stress}%`;
    });
    return;
  }

  currentMult *= 2;
  currentPot = Math.round(baseChips * currentMult * extraJokerMult);
  if (currentPot > maxSinglePot) maxSinglePot = currentPot;

  updateBalatroUI();
  playCoinSound();
  triggerHaptic('push');
  setLog(`🔥 [X2 MULT 돌파!] 주사위 [${testRoll}] 안착! 배율 ${currentMult}X! 화력: ${currentPot} POT!`);
}

function bankAndStrike() {
  initAudio();
  if (currentPot <= 0) {
    setLog('⚠️ 발사할 화력이 없습니다. 먼저 주사위를 굴리세요!');
    return;
  }

  triggerHaptic('crit');
  let finalDmg = currentPot;
  let multSnapshot = currentMult;
  totalDamageDealt += finalDmg;
  tickCooldowns();

  baseChips = 0;
  currentMult = 1;
  currentPot = 0;
  updateBalatroUI();

  let target = monsters.find(m => m.hp > 0);
  if (!target) return;

  triggerCutIn('🛡️', target.icon, finalDmg, multSnapshot >= 4, () => {
    target.hp = Math.max(0, target.hp - finalDmg);
    updateEntityUI();

    let rewardGold = Math.floor(Math.random() * 50) + 50;
    gold += rewardGold;
    document.getElementById('gold-val').innerText = `${gold}G`;
    playCoinSound();
    spawnCoinShower();

    setLog(`⚔️ ${multSnapshot}배수 발라트로 화력! ${target.name}에게 ${finalDmg} 피해! (+${rewardGold}G 획득)`);

    // 모든 몬스터 소탕 체크
    if (monsters.every(m => m.hp <= 0)) {
      setTimeout(() => {
        if (currentAnte >= 8) {
          triggerVictoryScreen();
        } else {
          currentAnte++;
          document.getElementById('ante-info').innerText = `ANTE ${currentAnte}/8`;
          alert(`🎉 ANTE ${currentAnte - 1} 보스 블라인드 돌파 완료!\n전리품 암시장이 열렸습니다.`);
          openShop();
          respawnMonsters();
        }
      }, 500 / gameSpeed);
    } else {
      setTimeout(enemyTurn, 600 / gameSpeed);
    }
  });
}

function enemyTurn() {
  let aliveMonsters = monsters.filter(m => m.hp > 0);
  if (aliveMonsters.length === 0) return;

  let attacker = aliveMonsters[Math.floor(Math.random() * aliveMonsters.length)];
  let aliveHeroes = heroes.filter(h => h.hp > 0);
  if (aliveHeroes.length === 0) {
    triggerGameOver();
    return;
  }

  let targetHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
  let dmg = Math.floor(Math.random() * 20) + 12 + (currentAnte * 3);
  targetHero.hp = Math.max(0, targetHero.hp - dmg);
  targetHero.stress = Math.min(100, targetHero.stress + 10);
  playHeavySlashSound();
  updateEntityUI();

  // 보스 턴에 저주 슬롯 무작위 변경
  cursedSlotIndex = Math.floor(Math.random() * 4);
  applyBossCurseVisual();

  setLog(`🩸 ${attacker.name}의 반격! ${targetHero.name}에게 ${dmg} 피해! (주사위 ${cursedSlotIndex+1}번 봉인)`);
  torch = Math.max(0, torch - 5);
  document.getElementById('torch-val').innerText = `${torch}%`;

  if (heroes.every(h => h.hp <= 0)) {
    triggerGameOver();
  }
}

function applyBossCurseVisual() {
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById(`slot-${i}`);
    if (i === cursedSlotIndex) {
      el.classList.add('cursed');
      heldSlots[i] = false;
      el.classList.remove('held');
    } else {
      el.classList.remove('cursed');
    }
  }
}

function triggerFeverTime() {
  playFeverFanfare();
  const banner = document.getElementById('fever-banner');
  banner.style.display = 'block';
  document.getElementById('middle-casino-board').classList.add('fever-mode');

  currentMult *= 5; // 즉시 5배 폭발
  currentPot = Math.round(baseChips * currentMult * extraJokerMult);
  if (currentPot > maxSinglePot) maxSinglePot = currentPot;
  updateBalatroUI();
  setLog(`🎰 [777 FEVER!] 럭키 주사위 폭발! 배율 X5.0 즉시 뻥튀기! 화력: ${currentPot} POT!`);

  setTimeout(() => {
    banner.style.display = 'none';
    document.getElementById('middle-casino-board').classList.remove('fever-mode');
  }, 2200 / gameSpeed);
}

function triggerCutIn(attackerIcon, targetIcon, dmg, isCrit, cb) {
  playHeavySlashSound();
  const overlay = document.getElementById('cutin-overlay');
  const cutinDmg = document.getElementById('cutin-dmg');
  const slash = document.getElementById('slash-fx');

  document.getElementById('cutin-attacker').innerHTML = `<svg viewBox="0 0 64 64" class="unit-svg">
  <defs>
    <linearGradient id="crusaderSteel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9aaec4"/>
      <stop offset="50%" stop-color="#4a5d73"/>
      <stop offset="100%" stop-color="#1f2733"/>
    </linearGradient>
    <linearGradient id="crusaderGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe066"/>
      <stop offset="60%" stop-color="#c59b27"/>
      <stop offset="100%" stop-color="#5a4209"/>
    </linearGradient>
  </defs>
  <!-- Cape / Cloak -->
  <path d="M12 40 Q 6 58 10 64 L 54 64 Q 58 58 52 40 Z" fill="#661111" stroke="#220000" stroke-width="1.5"/>
  <!-- Pauldrons -->
  <path d="M6 34 Q 4 22 18 20 L 24 32 L 10 42 Z" fill="url(#crusaderSteel)" stroke="#111" stroke-width="1.5"/>
  <path d="M58 34 Q 60 22 46 20 L 40 32 L 54 42 Z" fill="url(#crusaderSteel)" stroke="#111" stroke-width="1.5"/>
  <!-- Torso Plate & Red Cross -->
  <path d="M18 28 L 46 28 L 42 54 L 22 54 Z" fill="url(#crusaderSteel)" stroke="#0e131a" stroke-width="2"/>
  <rect x="29" y="30" width="6" height="20" fill="#cc1111"/>
  <rect x="22" y="36" width="20" height="6" fill="#cc1111"/>
  <!-- Great Helm -->
  <path d="M20 10 L 44 10 L 46 32 L 32 40 L 18 32 Z" fill="url(#crusaderSteel)" stroke="#000" stroke-width="2"/>
  <path d="M30 14 L 34 14 L 34 36 L 30 36 Z" fill="url(#crusaderGold)"/>
  <path d="M22 22 L 42 22 L 42 26 L 22 26 Z" fill="url(#crusaderGold)"/>
  <!-- Glowing Eye Slits -->
  <rect x="23" y="23" width="7" height="2" fill="#00ffff" style="filter:drop-shadow(0 0 4px #00ffff);"/>
  <rect x="34" y="23" width="7" height="2" fill="#00ffff" style="filter:drop-shadow(0 0 4px #00ffff);"/>
  <!-- Crest Crown -->
  <polygon points="26,6 32,1 38,6 32,8" fill="url(#crusaderGold)" stroke="#222"/>
</svg>`;
  document.getElementById('cutin-target').innerHTML = `<svg viewBox="0 0 80 80" class="boss-svg">
  <defs>
    <linearGradient id="magmaRock" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3d2a24"/>
      <stop offset="50%" stop-color="#1f1410"/>
      <stop offset="100%" stop-color="#0a0503"/>
    </linearGradient>
    <linearGradient id="lavaVein" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffff00"/>
      <stop offset="30%" stop-color="#ff6600"/>
      <stop offset="100%" stop-color="#cc0000"/>
    </linearGradient>
  </defs>
  <!-- Stone Body Silhouette -->
  <polygon points="10,48 24,20 56,20 70,48 58,74 22,74" fill="url(#magmaRock)" stroke="#110905" stroke-width="3"/>
  <!-- Spiked Stone Shoulders -->
  <polygon points="4,32 18,18 26,34" fill="url(#magmaRock)" stroke="#111" stroke-width="2"/>
  <polygon points="76,32 62,18 54,34" fill="url(#magmaRock)" stroke="#111" stroke-width="2"/>
  <!-- Molten Lava Cracks -->
  <path d="M24 22 L 32 38 L 28 54 L 40 68" stroke="url(#lavaVein)" stroke-width="3.5" fill="none" style="filter:drop-shadow(0 0 6px #ff4400);"/>
  <path d="M56 22 L 48 38 L 52 54 L 42 68" stroke="url(#lavaVein)" stroke-width="3.5" fill="none" style="filter:drop-shadow(0 0 6px #ff4400);"/>
  <path d="M32 38 L 48 38" stroke="url(#lavaVein)" stroke-width="3" fill="none"/>
  <!-- Giant Glowing Magma Eyes -->
  <polygon points="26,30 36,32 32,38" fill="#ffff33" style="filter:drop-shadow(0 0 8px #ff5500);"/>
  <polygon points="54,30 44,32 48,38" fill="#ffff33" style="filter:drop-shadow(0 0 8px #ff5500);"/>
  <!-- Jagged Lava Maw -->
  <polygon points="28,48 34,54 40,48 46,54 52,48 48,58 32,58" fill="#ff3300" stroke="#ffaa00" stroke-width="1.5" style="filter:drop-shadow(0 0 8px #ff2200);"/>
  <!-- Lava Core Crest -->
  <polygon points="34,14 40,4 46,14" fill="#ffaa00" style="filter:drop-shadow(0 0 6px #ffff00);"/>
</svg>`;
  cutinDmg.innerHTML = isCrit ? `🔥 잭팟 치명타!<br>-${dmg}` : `-${dmg}`;

  overlay.style.display = 'flex';
  setTimeout(() => slash.style.transform = 'rotate(-35deg) scaleX(1)', 50 / gameSpeed);
  setTimeout(() => cutinDmg.style.transform = 'scale(1.2)', 100 / gameSpeed);

  setTimeout(() => {
    overlay.style.display = 'none';
    slash.style.transform = 'rotate(-35deg) scaleX(0)';
    cutinDmg.style.transform = 'scale(0.5)';
    cb();
  }, 650 / gameSpeed);
}

function updateBalatroUI() {
  document.getElementById('math-chips').innerText = `${baseChips} CHIPS`;
  document.getElementById('math-mult').innerText = `X${currentMult} MULT`;
  document.getElementById('pot-display').innerText = `${currentPot} POT`;

  let bustThresh = currentMult <= 2 ? 1 : (currentMult <= 5 ? 2 : 3);
  document.getElementById('bust-label').innerText = `⚠️ 주사위 [1 ~ ${bustThresh}] 나오면 자멸!`;
}

function updateEntityUI() {
  heroes.forEach((h, i) => {
    document.getElementById(`h-hp-${i}`).style.width = `${(h.hp / h.maxHp) * 100}%`;
    document.getElementById(`h-st-${i}`).style.width = `${h.stress}%`;
  });
  monsters.forEach((m, i) => {
    const el = document.getElementById(`m-hp-${i}`);
    if (el) el.style.width = `${Math.max(0, (m.hp / m.maxHp) * 100)}%`;
  });
}

// ----------------------------------------------------
// 상점 및 부스터 팩 시스템
// ----------------------------------------------------
function openShop() {
  initAudio();
  document.getElementById('shop-modal').style.display = 'flex';
  playCoinSound();
}

function closeShop() {
  document.getElementById('shop-modal').style.display = 'none';
}

function buyItem(itemId, price) {
  if (gold < price) {
    alert('골드가 부족합니다!');
    return;
  }
  gold -= price;
  document.getElementById('gold-val').innerText = `${gold}G`;
  playCoinSound();

  if (itemId === 'buffoon_pack') {
    closeShop();
    openPackModal('buffoon');
  } else if (itemId === 'celestial_pack') {
    closeShop();
    openPackModal('celestial');
  } else if (itemId === 'tarot_pack') {
    closeShop();
    openPackModal('tarot');
  } else if (itemId === 'bust_shield') {
    hasBustShield = true;
    document.getElementById('joker-2').style.opacity = '1';
    alert('불사조 보험 계약 체결! 다음 BUST 자멸을 1회 방어합니다!');
  } else if (itemId === 'upgrade_d20') {
    diceSides[2] = 20;
    document.getElementById('dtag-2').innerText = 'D20 황금';
    alert('2번 주사위가 20면체 황금 주사위로 승급되었습니다!');
  } else if (itemId === 'extra_rerolls') {
    rerollsLeft += 3;
    document.getElementById('reroll-count').innerText = rerollsLeft;
    alert('무료 리롤 3회가 충전되었습니다!');
  } else if (itemId === 'stun_sticker') {
    diceStickers[1] = '스턴';
    document.getElementById('dsticker-1').innerText = '⚡';
    showBanner('⚡ 2번 주사위에 기절 스티커 각인 완료!');
  }
}

// 부스터 팩 개봉 모달 (Buffoon & Celestial)
function openPackModal(type) {
  initAudio();
  const modal = document.getElementById('pack-modal');
  const title = document.getElementById('pack-modal-title');
  const container = document.getElementById('pack-cards-container');
  container.innerHTML = '';

  if (type === 'buffoon') {
    title.innerText = '🃏 광대 조커 팩 개봉';
    const jokers = [
      { name: '탐욕의 황금 주사위', desc: '주사위를 굴릴 때마다 +25G 획득', fn: () => { extraJokerMult += 0.3; showBanner('💰 탐욕의 조커 장착 (+0.3X 배율)'); } },
      { name: '피의 계약서', desc: '기본 칩스 +40 영구 보정', fn: () => { foilBonusChips += 40; showBanner('🩸 피의 계약 장착 (+40 칩스)'); } },
      { name: '심연의 복제경', desc: '5번째 조커 슬롯 개방 및 상시 1.5X 배율', fn: () => {
        document.getElementById('joker-4').innerHTML = '<span>⚡</span><div class="relic-badge">X1.5</div>';
        document.getElementById('joker-4').style.opacity = '1';
        extraJokerMult += 0.5;
        showBanner('⚡ 5번째 조커 슬롯 개방!');
      }}
    ];
    jokers.forEach(j => {
      const card = document.createElement('div');
      card.className = 'pack-choice-card';
      card.innerHTML = `<div class="pack-card-info"><h4>${j.name}</h4><p>${j.desc}</p></div><button class="btn-buy" style="padding:6px 12px;">선택</button>`;
      card.onclick = () => { j.fn(); closePackModal(); playHandFanfare('야추 (5 of a Kind)'); };
      container.appendChild(card);
    });
  } else if (type === 'tarot') {
    title.innerText = '🔮 점술 타로 팩 개봉';
    const tarots = [
      { name: '마법사 (The Magician)', desc: '2번 주사위를 즉시 D20 황금 주사위로 승급', fn: () => { diceSides[2] = 20; document.getElementById('dtag-2').innerText = 'D20 황금'; showBanner('🔮 2번 주사위가 D20으로 승급!'); } },
      { name: '광대 (The Fool)', desc: '심연의 골드 보물상자 개봉 (+200G 즉시 획득)', fn: () => { gold += 200; document.getElementById('gold-val').innerText = `${gold}G`; spawnCoinShower(); showBanner('🃏 +200G 골드 복사 획득!'); } },
      { name: '정의 (Justice)', desc: '파티 전체 체력 100% 완전 회복 및 스트레스 0 정화', fn: () => {
        heroes.forEach((h, i) => { h.hp = h.maxHp; h.stress = 0; });
        updateEntityUI();
        showBanner('⚖️ 파티 체력/스트레스 완전 회복!');
      }},
      { name: '악마 (The Devil)', desc: '상시 배율 +0.6X 영구 폭발 (파티 스트레스 +20)', fn: () => {
        extraJokerMult += 0.6;
        heroes.forEach(h => h.stress = Math.min(100, h.stress + 20));
        updateEntityUI();
        showBanner('😈 악마의 계약 체결! 배율 +0.6X 폭발!');
      }}
    ];
    tarots.forEach(t => {
      const card = document.createElement('div');
      card.className = 'pack-choice-card';
      card.innerHTML = `<div class="pack-card-info"><h4>${t.name}</h4><p>${t.desc}</p></div><button class="btn-buy" style="padding:6px 12px;">선택</button>`;
      card.onclick = () => { t.fn(); closePackModal(); playHandFanfare('포카드 (4 of a Kind)'); };
      container.appendChild(card);
    });
  } else {
    title.innerText = '🪐 천체 행성 팩 개봉';
    const planets = [
      { name: '화성 (Mars)', hand: '포카드 (4 of a Kind)', desc: '포카드 레벨업 (+25 칩스, +1.5 배율)' },
      { name: '목성 (Jupiter)', hand: '풀하우스 (Full House)', desc: '풀하우스 레벨업 (+20 칩스, +1.0 배율)' },
      { name: '해왕성 (Neptune)', hand: '스트레이트 (Straight)', desc: '스트레이트 레벨업 (+15 칩스, +1.0 배율)' }
    ];
    planets.forEach(p => {
      const card = document.createElement('div');
      card.className = 'pack-choice-card';
      card.innerHTML = `<div class="pack-card-info"><h4>${p.name}</h4><p>${p.desc}</p></div><button class="btn-buy" style="padding:6px 12px;">선택</button>`;
      card.onclick = () => {
        handBook[p.hand].lvl++;
        showBanner(`🪐 ${p.name} 흡수! [${p.hand}] Lv.${handBook[p.hand].lvl} 달성!`);
        applyHandScore();
        closePackModal();
        playHandFanfare('포카드 (4 of a Kind)');
      };
      container.appendChild(card);
    });
  }

  modal.style.display = 'flex';
  playFeverFanfare();
}

function closePackModal() {
  document.getElementById('pack-modal').style.display = 'none';
}

// ----------------------------------------------------
// 던전 층 및 몬스터 리스폰
// ----------------------------------------------------

function updateBossSvgAvatar(ante) {
  const el = document.getElementById('boss-avatar');
  if (ante >= 8) {
    el.innerHTML = `<svg viewBox="0 0 80 80" class="boss-svg">
  <defs>
    <linearGradient id="dragonScales" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a001a"/>
      <stop offset="50%" stop-color="#1f000b"/>
      <stop offset="100%" stop-color="#0a0003"/>
    </linearGradient>
    <linearGradient id="goldCrown" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff275"/>
      <stop offset="60%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#705307"/>
    </linearGradient>
  </defs>
  <!-- Dragon Wings / Abyssal Shroud -->
  <path d="M4 36 Q 40 6 76 36 L 68 76 Q 40 64 12 76 Z" fill="url(#dragonScales)" stroke="#000" stroke-width="2.5"/>
  <!-- Great Curved Horns -->
  <path d="M22 22 Q 2 8 0 0 Q 18 4 28 16 Z" fill="#1c0f14" stroke="#ff2255" stroke-width="1.5"/>
  <path d="M58 22 Q 78 8 80 0 Q 62 4 52 16 Z" fill="#1c0f14" stroke="#ff2255" stroke-width="1.5"/>
  <!-- Sovereign Crown -->
  <polygon points="26,16 32,4 40,12 48,4 54,16" fill="url(#goldCrown)" stroke="#3a2503" stroke-width="1.5"/>
  <!-- Dragon Skull Visage -->
  <polygon points="26,22 54,22 50,56 40,68 30,56" fill="#2b0d19" stroke="#ff0044" stroke-width="2"/>
  <!-- 3 Glowing Abyssal Eyes -->
  <ellipse cx="34" cy="34" rx="4" ry="3" fill="#ff0033" style="filter:drop-shadow(0 0 6px #ff0033);"/>
  <ellipse cx="46" cy="34" rx="4" ry="3" fill="#ff0033" style="filter:drop-shadow(0 0 6px #ff0033);"/>
  <circle cx="40" cy="26" r="3" fill="#ffd700" style="filter:drop-shadow(0 0 8px #ffd700);"/>
  <!-- Core Maw / Breath Chamber -->
  <polygon points="34,50 40,60 46,50" fill="#ff0055" style="filter:drop-shadow(0 0 10px #ff0055);"/>
</svg>`;
  } else {
    el.innerHTML = `<svg viewBox="0 0 80 80" class="boss-svg">
  <defs>
    <linearGradient id="magmaRock" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3d2a24"/>
      <stop offset="50%" stop-color="#1f1410"/>
      <stop offset="100%" stop-color="#0a0503"/>
    </linearGradient>
    <linearGradient id="lavaVein" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffff00"/>
      <stop offset="30%" stop-color="#ff6600"/>
      <stop offset="100%" stop-color="#cc0000"/>
    </linearGradient>
  </defs>
  <!-- Stone Body Silhouette -->
  <polygon points="10,48 24,20 56,20 70,48 58,74 22,74" fill="url(#magmaRock)" stroke="#110905" stroke-width="3"/>
  <!-- Spiked Stone Shoulders -->
  <polygon points="4,32 18,18 26,34" fill="url(#magmaRock)" stroke="#111" stroke-width="2"/>
  <polygon points="76,32 62,18 54,34" fill="url(#magmaRock)" stroke="#111" stroke-width="2"/>
  <!-- Molten Lava Cracks -->
  <path d="M24 22 L 32 38 L 28 54 L 40 68" stroke="url(#lavaVein)" stroke-width="3.5" fill="none" style="filter:drop-shadow(0 0 6px #ff4400);"/>
  <path d="M56 22 L 48 38 L 52 54 L 42 68" stroke="url(#lavaVein)" stroke-width="3.5" fill="none" style="filter:drop-shadow(0 0 6px #ff4400);"/>
  <path d="M32 38 L 48 38" stroke="url(#lavaVein)" stroke-width="3" fill="none"/>
  <!-- Giant Glowing Magma Eyes -->
  <polygon points="26,30 36,32 32,38" fill="#ffff33" style="filter:drop-shadow(0 0 8px #ff5500);"/>
  <polygon points="54,30 44,32 48,38" fill="#ffff33" style="filter:drop-shadow(0 0 8px #ff5500);"/>
  <!-- Jagged Lava Maw -->
  <polygon points="28,48 34,54 40,48 46,54 52,48 48,58 32,58" fill="#ff3300" stroke="#ffaa00" stroke-width="1.5" style="filter:drop-shadow(0 0 8px #ff2200);"/>
  <!-- Lava Core Crest -->
  <polygon points="34,14 40,4 46,14" fill="#ffaa00" style="filter:drop-shadow(0 0 6px #ffff00);"/>
</svg>`;
  }
}

function respawnMonsters() {
  const bossData = BOSS_BLINDS[Math.min(currentAnte - 1, BOSS_BLINDS.length - 1)];
  updateBossSvgAvatar(currentAnte);
  document.getElementById('boss-name').innerText = bossData.name;
  document.getElementById('blind-tag').innerText = `보스: ${bossData.name} (${bossData.desc})`;
  document.getElementById('floor-title').innerText = `DEPTHS ${currentAnte} : ABYSS CASINO`;

  monsters = [
    { name: `${bossData.name} (ANTE ${currentAnte})`, maxHp: bossData.hp, hp: bossData.hp, icon: bossData.icon },
    { name: '망령 사제', maxHp: 120 + (currentAnte * 40), hp: 120 + (currentAnte * 40), icon: '🧙‍♂️' },
    { name: '지옥견', maxHp: 90 + (currentAnte * 30), hp: 90 + (currentAnte * 30), icon: '🐺' }
  ];
  rerollsLeft = 2;
  document.getElementById('reroll-count').innerText = rerollsLeft;
  updateEntityUI();
}

// ----------------------------------------------------
// 엔딩 및 명예의 전당 (LocalStorage)
// ----------------------------------------------------
function triggerVictoryScreen() {
  playFeverFanfare();
  spawnCoinShower();
  saveRunRecord(true);
  const modal = document.getElementById('endgame-modal');
  document.getElementById('endgame-title').innerText = '🏆 ANTE 8 클리어! 심연 정복!';
  document.getElementById('endgame-desc').innerHTML = `
    위대한 승리자여! 당신은 8대 심연의 보스 블라인드를 전부 파괴했습니다!<br><br>
    🪙 최종 골드: <b>${gold}G</b><br>
    💥 단일 최대 POT: <b>${maxSinglePot} POT</b><br>
    ⚔️ 총 누적 타격: <b>${totalDamageDealt} 피해</b>
  `;
  modal.style.display = 'flex';
}

function triggerGameOver() {
  playBustSound();
  saveRunRecord(false);
  const modal = document.getElementById('endgame-modal');
  document.getElementById('endgame-title').innerText = '💀 파티 전멸! 심연에 굴복하다';
  document.getElementById('endgame-desc').innerHTML = `
    모든 영웅이 쓰러져 카지노의 제물이 되었습니다.<br><br>
    도달한 심연: <b>ANTE ${currentAnte}/8</b><br>
    단일 최대 POT: <b>${maxSinglePot} POT</b>
  `;
  modal.style.display = 'flex';
}

function enterEndlessMode() {
  document.getElementById('endgame-modal').style.display = 'none';
  currentAnte++;
  document.getElementById('ante-info').innerText = `ANTE ${currentAnte} (ENDLESS)`;
  respawnMonsters();
  setLog('🔥 [무한 심연 모드] 한계에 도전하세요! 몬스터 체력이 기하급수적으로 폭증합니다!');
}

function restartNewRun() {
  location.reload();
}

function saveRunRecord(isVictory) {
  try {
    let history = JSON.parse(localStorage.getItem('abyss_roll_history') || '[]');
    history.push({
      date: new Date().toLocaleDateString(),
      ante: currentAnte,
      maxPot: maxSinglePot,
      gold: gold,
      result: isVictory ? '승리 (ANTE 8+)' : '패배'
    });
    localStorage.setItem('abyss_roll_history', JSON.stringify(history.slice(-10)));
  } catch(e) {}
}

function openHallOfFame() {
  initAudio();
  const modal = document.getElementById('hall-of-fame-modal');
  const container = document.getElementById('hall-stats');
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('abyss_roll_history') || '[]');
  } catch(e) {}

  let html = `<b>최고 기록 및 최근 런 기록:</b><br>`;
  if (history.length === 0) {
    html += '<p style="color:#777; margin-top:8px;">아직 기록된 런이 없습니다. 첫 플레이를 완료하세요!</p>';
  } else {
    history.reverse().forEach((r, idx) => {
      html += `<div style="background:#151824; padding:6px; margin:4px 0; border-radius:4px; font-size:10px;">
        #${idx+1} [${r.date}] - <b>${r.result}</b> | 도달: ANTE ${r.ante} | 최대 화력: ${r.maxPot} POT | 골드: ${r.gold}G
      </div>`;
    });
  }
  container.innerHTML = html;
  modal.style.display = 'flex';
}

function closeHallOfFame() {
  document.getElementById('hall-of-fame-modal').style.display = 'none';
}

function inspectJoker(idx) {
  const titles = [
    '블러드 칩스 (Foil): 모든 주사위 기본 칩스 +30 영구 보정',
    '황금 배율 (Polychrome): 상시 화력 배율 X1.5 곱연산 적용',
    '불사조 보험: 탐욕의 BUST 자멸을 1회 완전 무효화',
    '네거티브 심연 악마: 조커 슬롯 한도를 영구 +1 확장',
    '해금된 5번째 슬롯: 광대 조커 팩에서 추가 조커 장착 가능'
  ];
  alert(`[조커 렐릭 정보]\n${titles[idx]}`);
}

function lightTorch() {
  torch = Math.min(100, torch + 25);
  document.getElementById('torch-val').innerText = `${torch}%`;
  setLog('🔥 횃불을 밝혀 칠흑의 어둠을 몰아냅니다.');
}

function spawnCoinShower() {
  const container = document.getElementById('coin-rain-container');
  for (let i = 0; i < 15; i++) {
    const coin = document.createElement('div');
    coin.className = 'gold-coin-particle';
    coin.innerText = '🪙';
    coin.style.left = `${Math.random() * 90}%`;
    coin.style.animationDuration = `${0.8 + Math.random() * 0.8}s`;
    container.appendChild(coin);
    setTimeout(() => coin.remove(), 1600);
  }
}

function showBanner(text) {
  const b = document.getElementById('sticker-banner');
  b.innerText = text;
  b.style.display = 'block';
  setTimeout(() => b.style.display = 'none', 1800);
}

function setLog(msg) {
  document.getElementById('log-ticker').innerText = msg;
}

// 게임 시작 초기화
respawnMonsters();
initialRoll();
updateEntityUI();

// 첫 실행 튜토리얼 자동 노출 체크
try {
  if (!localStorage.getItem('abyss_roll_tutorial_seen')) {
    openTutorialModal();
  }
} catch(e) {}

</script>
</body>
</html>
"""

with open(r'c:\Users\임종서\Desktop\auto gnimag\abyss_roll.html', 'w', encoding='utf-8') as f:
    f.write(HTML_CONTENT)

print("abyss_roll.html generated successfully!")
