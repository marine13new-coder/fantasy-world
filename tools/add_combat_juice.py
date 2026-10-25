# -*- coding: utf-8 -*-
import os

builder_path = r"c:\Users\임종서\Desktop\auto gnimag\build_full_abyss_roll.py"
with open(builder_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add CSS for Floating Damage, Hit Flash, and Boss Enrage
combat_juice_css = """
  /* 데미지 플로팅 텍스트 & 피격 플래시 & 분노 모드 */
  .floating-damage {
    position: absolute;
    font-size: 20px;
    font-weight: 900;
    color: #ff3333;
    text-shadow: 0 0 8px #000, 0 0 15px rgba(255, 0, 0, 0.8);
    pointer-events: none;
    z-index: 220;
    animation: floatUp 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
  }
  .floating-damage.crit {
    font-size: 26px;
    color: #ffd700;
    text-shadow: 0 0 10px #ff3300, 0 0 20px rgba(255, 215, 0, 0.9);
  }
  @keyframes floatUp {
    0% { transform: translateY(0) scale(0.6); opacity: 0; }
    20% { transform: translateY(-12px) scale(1.3); opacity: 1; }
    80% { transform: translateY(-30px) scale(1.0); opacity: 1; }
    100% { transform: translateY(-45px) scale(0.8); opacity: 0; }
  }

  /* 피격 화이트/레드 플래시 */
  .hit-flash {
    filter: brightness(3.5) saturate(2) drop-shadow(0 0 15px #ff2222) !important;
    transform: scale(0.92) !important;
    transition: filter 0.08s, transform 0.08s;
  }

  /* 보스 분노 모드 (Enrage) */
  .boss-enraged .boss-svg {
    filter: drop-shadow(0 0 22px #ff0000) drop-shadow(0 0 35px #ff5500) !important;
    animation: bossEnragePulse 0.8s infinite ease-in-out alternate !important;
  }
  @keyframes bossEnragePulse {
    0% { transform: scale(1.0) translateY(0); }
    100% { transform: scale(1.12) translateY(-5px); }
  }
"""

assert '</style>' in code, "style tag not found"
code = code.replace('</style>', combat_juice_css + '\n</style>')

# 2. Add JS functions for Floating Damage, Hit Flash, and Boss Enrage
combat_juice_js = """
// ----------------------------------------------------
// 플로팅 데미지 텍스트 & 피격 연출 (Combat Juice)
// ----------------------------------------------------
function spawnFloatingDamage(targetEl, amount, isCrit) {
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const parentRect = document.getElementById('mobile-viewport').getBoundingClientRect();

  const dmgEl = document.createElement('div');
  dmgEl.className = 'floating-damage' + (isCrit ? ' crit' : '');
  dmgEl.innerText = isCrit ? `🔥 -${amount}` : `-${amount}`;
  dmgEl.style.left = `${rect.left - parentRect.left + (rect.width / 4)}px`;
  dmgEl.style.top = `${rect.top - parentRect.top - 10}px`;

  document.getElementById('mobile-viewport').appendChild(dmgEl);
  setTimeout(() => dmgEl.remove(), 800);
}

function flashTarget(targetEl) {
  if (!targetEl) return;
  targetEl.classList.add('hit-flash');
  setTimeout(() => targetEl.classList.remove('hit-flash'), 120 / gameSpeed);
}

function checkBossEnrage() {
  const boss = monsters[0];
  const bossEl = document.getElementById('mon-0');
  if (boss && bossEl) {
    if (boss.hp > 0 && boss.hp <= boss.maxHp * 0.4) {
      if (!bossEl.classList.contains('boss-enraged')) {
        bossEl.classList.add('boss-enraged');
        showBanner('🔥 [보스 분노!] 체력 40% 이하 격노 발동!');
        setLog(`🔥 [보스 분노!] ${boss.name}의 안광이 붉게 타오르며 광폭화 상태에 돌입했습니다!`);
        playTone(150, 0.4, 'sawtooth', 0.6);
      }
    } else {
      bossEl.classList.remove('boss-enraged');
    }
  }
}
"""

assert 'function bankAndStrike() {' in code, "bankAndStrike not found"
code = code.replace('function bankAndStrike() {', combat_juice_js + '\nfunction bankAndStrike() {')

# 3. Hook spawnFloatingDamage and flashTarget into bankAndStrike callback
old_strike_hit = """    target.hp = Math.max(0, target.hp - finalDmg);
    updateEntityUI();"""

new_strike_hit = """    target.hp = Math.max(0, target.hp - finalDmg);
    updateEntityUI();
    const monEl = document.getElementById('mon-0');
    flashTarget(monEl);
    spawnFloatingDamage(monEl, finalDmg, multSnapshot >= 4);
    checkBossEnrage();"""

assert old_strike_hit in code, "old_strike_hit not found"
code = code.replace(old_strike_hit, new_strike_hit)

# 4. Also flash hero on enemyTurn
old_hero_hit = """  targetHero.hp = Math.max(0, targetHero.hp - dmg);
  targetHero.stress = Math.min(100, targetHero.stress + 10);
  playHeavySlashSound();
  updateEntityUI();"""

new_hero_hit = """  targetHero.hp = Math.max(0, targetHero.hp - dmg);
  targetHero.stress = Math.min(100, targetHero.stress + 10);
  playHeavySlashSound();
  updateEntityUI();
  const heroEl = document.getElementById(`hero-${heroes.indexOf(targetHero)}`);
  flashTarget(heroEl);
  spawnFloatingDamage(heroEl, dmg, false);"""

assert old_hero_hit in code, "old_hero_hit not found"
code = code.replace(old_hero_hit, new_hero_hit)

# 5. Heartbeat audio escalation when currentMult >= 4
old_double_sound = """  currentMult *= 2;
  currentPot = Math.round(baseChips * currentMult * extraJokerMult);
  if (currentPot > maxSinglePot) maxSinglePot = currentPot;

  updateBalatroUI();
  playCoinSound();
  triggerHaptic('push');"""

new_double_sound = """  currentMult *= 2;
  currentPot = Math.round(baseChips * currentMult * extraJokerMult);
  if (currentPot > maxSinglePot) maxSinglePot = currentPot;

  updateBalatroUI();
  playCoinSound();
  triggerHaptic('push');

  // 고배율 도박 긴장감 심장박동 사운드
  if (currentMult >= 4 && bgmOsc1) {
    try {
      bgmOsc1.frequency.setValueAtTime(73.42 * 1.5, actx.currentTime);
      playTone(90, 0.15, 'square', 0.5);
      setTimeout(() => playTone(80, 0.2, 'square', 0.5), 180 / gameSpeed);
    } catch(e) {}
  }"""

assert old_double_sound in code, "old_double_sound not found"
code = code.replace(old_double_sound, new_double_sound)

with open(builder_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Combat juice (Floating Damage, Hit Flash, Boss Enrage, Heartbeat Escalation) injected successfully!")
