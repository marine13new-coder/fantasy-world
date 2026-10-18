// ============================================================================
// audio.js - Web Audio API 레트로 RPG 사운드 신디사이저 (Zero External File Dependencies)
// ============================================================================

class RetroAudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (typeof ctx.createGain !== 'function' || typeof ctx.createOscillator !== 'function') {
        return;
      }
      this.ctx = ctx;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime || 0);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      this.ctx = null;
      this.masterGain = null;
      this.initialized = false;
      console.warn('Web Audio initialization failed:', e);
    }
  }

  ensureReady() {
    if (this.muted) return false;
    if (!this.initialized) this.init();
    if (!this.initialized || !this.ctx || !this.masterGain) return false;
    if (this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
      this.ctx.resume();
    }
    return true;
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.18, this.ctx.currentTime);
    }
    if (!this.muted && !this.bgmPlaying) {
      this.startBGM('peaceful');
    }
    return this.muted;
  }

  // 1. 검 휘두르기 / 물리 타격 (Metallic Slash)
  playSword() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // 2. 마법 벼락 / 천공의 심판 (Magic Thunder Strike)
  playMagic() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;

    // 고주파 스파크
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.28);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.31);
  }

  // 3. 골드 / 보물 획득 짤랑거림 (Coin Chime)
  playCoin() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;

    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.08;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.16);
    });
  }

  // 4. 의뢰 완수 / 레벨업 팡파르 (Fanfare)
  playFanfare() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.1;
      const dur = idx === notes.length - 1 ? 0.45 : 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + dur + 0.02);
    });
  }

  // 5. 드래곤 포효 (Dragon Roar)
  playRoar() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.linearRampToValueAtTime(260, t + 0.2);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.65);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.68);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  // 6. 건축 망치질 (Building Hammer Thud)
  playBuild() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.14);

    gain.gain.setValueAtTime(0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 7. 물살 & 출항 (Ship Sail Splash)
  playSplash() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.25);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  // 8. 월드 보스 레이드 경보 (Boss Alarm Horn)
  playBossHorn() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t); // A2
    osc.frequency.setValueAtTime(110, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(82.4, t + 0.9); // E2

    gain.gain.setValueAtTime(0.48, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.0);
  }

  // 9. 선풍참 연속 회전 베기 (Whirlwind Slash)
  playWhirlwind() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const nt = t + i * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500 + i * 80, nt);
      osc.frequency.exponentialRampToValueAtTime(120, nt + 0.1);
      gain.gain.setValueAtTime(0.28, nt);
      gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(nt);
      osc.stop(nt + 0.11);
    }
  }

  // 10. 빙결 서리 폭풍 (Frost Nova)
  playFrost() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    [1200, 1500, 1850].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const nt = t + idx * 0.06;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, nt);
      osc.frequency.exponentialRampToValueAtTime(400, nt + 0.22);
      gain.gain.setValueAtTime(0.25, nt);
      gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(nt);
      osc.stop(nt + 0.24);
    });
  }

  // 11. 화염 메테오 폭격 (Meteor Strike)
  playMeteor() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.55);
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  // 12. 함대 함포 일제 사격 (Broadside Cannons)
  playCannon() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const nt = t + i * 0.07;
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, nt);
      osc.frequency.exponentialRampToValueAtTime(30, nt + 0.25);
      gain.gain.setValueAtTime(0.38, nt);
      gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(nt);
      osc.stop(nt + 0.3);
    }
  }

  // 13. 낚시 입질 & 건져올리기 (Fishing Splash)
  playFish() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // 14. 고대 마법 포탈 순간이동 (Portal Warp)
  playTeleport() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.45);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.52);
  }

  // 15. 천벌 뇌우 낙뢰 (Thunder Crash)
  playThunder() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.48);
  }

  // 16. 발소리 (Footstep on grass/stone/water/snow)
  playFootstep(surface = 'grass') {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    let freq = 160;
    if (surface === 'stone') freq = 240;
    else if (surface === 'water') freq = 420;
    else if (surface === 'snow') freq = 120;

    osc.type = surface === 'water' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.05);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // 17. 악어 턱 스냅 & 맹수 포효 (Croc Snap / Beast Bite)
  playCrocSnap() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.14);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 18. 늑대 하울링 (Wolf Howl)
  playWolfHowl() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.25);
    osc.frequency.exponentialRampToValueAtTime(330, t + 0.6);
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.68);
  }

  // 19. 주점 주사위 굴리기 (Dice Roll Rattle)
  playDiceRoll() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const dt = t + i * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380 + Math.random() * 200, dt);
      osc.frequency.exponentialRampToValueAtTime(80, dt + 0.03);
      gain.gain.setValueAtTime(0.2, dt);
      gain.gain.exponentialRampToValueAtTime(0.001, dt + 0.035);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(dt);
      osc.stop(dt + 0.04);
    }
  }

  // 20. 캠프파이어 요리 지글지글 (Cooking Sizzle)
  playCookSizzle() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const dt = t + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 600, dt);
      osc.frequency.exponentialRampToValueAtTime(200, dt + 0.05);
      gain.gain.setValueAtTime(0.12, dt);
      gain.gain.exponentialRampToValueAtTime(0.001, dt + 0.055);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(dt);
      osc.stop(dt + 0.06);
    }
  }

  // 21. 레벨업 팡파르 (Level Up Victory Fanfare)
  playLevelUp() {
    if (!this.ensureReady()) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const nt = t + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, nt);
      gain.gain.setValueAtTime(0.3, nt);
      gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(nt);
      osc.stop(nt + 0.3);
    });
  }

  // ==========================================================================
  // 절차적 16비트 레트로 BGM 신디사이저 (Procedural Retro Chiptune BGM Engine)
  // ==========================================================================
  startBGM(mood = 'peaceful') {
    if (this.bgmPlaying) return;
    if (!this.ensureReady()) return;
    this.bgmPlaying = true;
    this.bgmMood = mood;
    this.bgmStep = 0;

    // 감미로운 펜타토닉 음계 (C4, D4, E4, G4, A4, C5, D5, E5)
    this.peacefulScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    this.battleScale = [130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08, 261.63];

    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || this.muted || !this.ctx) return;
      this.tickBGM();
    }, 240); // 125 BPM
  }

  tickBGM() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const t = this.ctx.currentTime;
    const step = this.bgmStep % 16;
    this.bgmStep++;

    const isBattle = (this.bgmMood === 'battle');
    const scale = isBattle ? this.battleScale : this.peacefulScale;

    // 1. 베이스 아르페지오 (Bass Pulse)
    if (step % 2 === 0) {
      const rootIdx = isBattle ? ((step < 8) ? 0 : 3) : ((step < 4) ? 0 : (step < 8 ? 4 : (step < 12 ? 3 : 1)));
      const baseFreq = scale[rootIdx % scale.length] * (isBattle ? 1.0 : 0.5);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isBattle ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);

      gain.gain.setValueAtTime(isBattle ? 0.08 : 0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.38);
    }

    // 2. 멜로디 리드 (Melodic Lead Note)
    if (step % 2 === 1 || (step % 4 === 0 && Math.random() < 0.6)) {
      const noteIdx = Math.floor(Math.random() * scale.length);
      const noteFreq = scale[noteIdx] * (isBattle ? 2.0 : 1.0);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, t);

      gain.gain.setValueAtTime(0.045, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  setBGMMood(mood) {
    this.bgmMood = mood;
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.RetroAudioSystem = RetroAudioSystem;
window.audioMgr = new RetroAudioSystem();
