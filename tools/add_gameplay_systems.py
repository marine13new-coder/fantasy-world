# -*- coding: utf-8 -*-
import os

builder_path = r"c:\Users\임종서\Desktop\auto gnimag\build_full_abyss_roll.py"
with open(builder_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add Guide button to top-utility-bar
old_util_bar = """    <div style="display: flex; gap: 4px;">
      <button class="util-btn" id="btn-audio" onclick="toggleAudio()">🔊 소리 ON</button>
      <button class="util-btn" id="btn-speed" onclick="toggleSpeed()">⚡ 1X</button>
      <button class="util-btn" onclick="openHallOfFame()">🏆 명예의 전당</button>
    </div>"""

new_util_bar = """    <div style="display: flex; gap: 4px;">
      <button class="util-btn" onclick="openTutorialModal()">❓ 가이드</button>
      <button class="util-btn" id="btn-audio" onclick="toggleAudio()">🔊 소리 ON</button>
      <button class="util-btn" id="btn-speed" onclick="toggleSpeed()">⚡ 1X</button>
      <button class="util-btn" onclick="openHallOfFame()">🏆 랭킹</button>
    </div>"""

assert old_util_bar in code, "old_util_bar not found"
code = code.replace(old_util_bar, new_util_bar)

# 2. Add Hero Skill Buttons under each hero in hero-party
# We add skill buttons below each hero HP/Stress bar:
hero_skills_snippet = """
          <button class="hero-skill-btn" id="h-skill-0" onclick="useHeroSkill(0)">🛡️ 가호</button>
"""

# Let's inspect each hero unit and add hero-skill-btn
for idx, (s_name, s_badge) in enumerate([("가호", "🛡️"), ("함성", "🪓"), ("사격", "🏹"), ("의식", "🔮")]):
    target = f'<div class="stress-bar-outer"><div class="stress-bar-inner" id="h-st-{idx}"></div></div>'
    replacement = f'{target}\n          <button class="hero-skill-btn" id="h-skill-{idx}" onclick="useHeroSkill({idx})">{s_badge} {s_name}</button>'
    assert target in code, f"target {idx} not found"
    code = code.replace(target, replacement, 1)

# 3. Add CSS for Hero Skill Buttons, Tutorial Modal, Revive Modal
skills_css = """
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
"""
code = code.replace("</style>", skills_css + "\n</style>")

# 4. Add Tutorial Modal and Revive Modal HTML right before </div id="mobile-viewport">
modals_html = """
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
"""

assert '<!-- 타격 컷인 오버레이 -->' in code, "cutin overlay target not found"
code = code.replace('<!-- 타격 컷인 오버레이 -->', modals_html + '\n  <!-- 타격 컷인 오버레이 -->')

# 5. Add JavaScript for Hero Skills, Tutorial, and Revive
js_systems = """
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
"""

code = code.replace("function pushDoubleDown() {", js_systems + "\nfunction pushDoubleDown() {")

# Integrate Holy Shield and promptReviveDeal into pushDoubleDown
old_bust_trigger = """    setLog(`💀 [BUST!] 주사위 [${testRoll}] 자멸! ${currentPot} POT 전액 소멸! 파티 스트레스 폭증!`);
    baseChips = 0;
    currentMult = 1;
    currentPot = 0;
    updateBalatroUI();"""

new_bust_trigger = """    if (isCrusaderShieldActive) {
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
    promptReviveDeal(savePot);"""

assert old_bust_trigger in code, "old_bust_trigger not found"
code = code.replace(old_bust_trigger, new_bust_trigger)

# On turn completion or strike, tick cooldowns
assert 'totalDamageDealt += finalDmg;' in code, "totalDamageDealt target not found"
code = code.replace('totalDamageDealt += finalDmg;', 'totalDamageDealt += finalDmg;\n  tickCooldowns();')

# Check first run tutorial check in startup
init_tutorial_check = """
// 첫 실행 튜토리얼 자동 노출 체크
try {
  if (!localStorage.getItem('abyss_roll_tutorial_seen')) {
    openTutorialModal();
  }
} catch(e) {}
"""
code = code.replace("updateEntityUI();\n</script>", "updateEntityUI();\n" + init_tutorial_check + "\n</script>")

with open(builder_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Gameplay systems (Hero Skills, Tutorial, Revive Deal) successfully added to build_full_abyss_roll.py!")
