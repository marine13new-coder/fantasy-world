// =========================================================================
// F1 APEX MOTORSPORT MANAGER - PROCEDURAL WEB AUDIO ENGINE
// Zero external asset dependency. Synthesizes V6 Hybrid Turbo RPM, ERS, DRS,
// Tire screech, Pneumatic Pit Wheel Guns, Start Lights & Team Radio Beeps.
// =========================================================================

class F1AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.turboOsc = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.isEngineRunning = false;
        this.muted = false;

        // Multi-Channel Volume Controls (0.0 ~ 1.0)
        this.masterVolume = 0.80;
        this.engineVolume = 0.85;
        this.sfxVolume = 0.90;
        this.loadSavedVolumes();
    }

    loadSavedVolumes() {
        try {
            const raw = localStorage.getItem('f1_apex_audio_settings_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed.masterVolume === 'number') this.masterVolume = parsed.masterVolume;
                if (typeof parsed.engineVolume === 'number') this.engineVolume = parsed.engineVolume;
                if (typeof parsed.sfxVolume === 'number') this.sfxVolume = parsed.sfxVolume;
                if (typeof parsed.muted === 'boolean') this.muted = parsed.muted;
            }
        } catch (e) {}
    }

    saveVolumes() {
        try {
            localStorage.setItem('f1_apex_audio_settings_v1', JSON.stringify({
                masterVolume: this.masterVolume,
                engineVolume: this.engineVolume,
                sfxVolume: this.sfxVolume,
                muted: this.muted
            }));
        } catch (e) {}
    }

    setVolumes({ master, engine, sfx }) {
        this.init();
        if (typeof master === 'number') this.masterVolume = Math.max(0, Math.min(1, master));
        if (typeof engine === 'number') this.engineVolume = Math.max(0, Math.min(1, engine));
        if (typeof sfx === 'number') this.sfxVolume = Math.max(0, Math.min(1, sfx));
        if (this.masterGain && this.ctx) {
            const targetMaster = this.muted ? 0 : (this.masterVolume * 0.45);
            this.masterGain.gain.setTargetAtTime(targetMaster, this.ctx.currentTime, 0.03);
        }
        this.saveVolumes();
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            const targetMaster = this.muted ? 0 : (this.masterVolume * 0.45);
            this.masterGain.gain.setValueAtTime(targetMaster, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.init();
        this.muted = !this.muted;
        if (this.masterGain) {
            const targetMaster = this.muted ? 0 : (this.masterVolume * 0.45);
            this.masterGain.gain.setValueAtTime(targetMaster, this.ctx.currentTime);
        }
        this.saveVolumes();
        return this.muted;
    }

    // Continuous V6 1.6L Turbo Hybrid Engine Drone (modulated by RPM 4000~15000 & Throttle)
    startEngineSound() {
        this.init();
        if (this.isEngineRunning || !this.ctx) return;
        const now = this.ctx.currentTime;

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.08, now);

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(650, now);
        this.engineFilter.Q.setValueAtTime(3.2, now);

        // Primary V6 cylinder firing harmonic
        this.engineOsc1 = this.ctx.createOscillator();
        this.engineOsc1.type = 'sawtooth';
        this.engineOsc1.frequency.setValueAtTime(110, now);

        // Secondary exhaust sub-harmonic
        this.engineOsc2 = this.ctx.createOscillator();
        this.engineOsc2.type = 'triangle';
        this.engineOsc2.frequency.setValueAtTime(55, now);

        // MGU-H Turbocharger high-pitched whistle
        this.turboOsc = this.ctx.createOscillator();
        this.turboOsc.type = 'sine';
        this.turboOsc.frequency.setValueAtTime(1200, now);
        this.turboGain = this.ctx.createGain();
        this.turboGain.gain.setValueAtTime(0.015, now);

        this.engineOsc1.connect(this.engineFilter);
        this.engineOsc2.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        this.turboOsc.connect(this.turboGain);
        this.turboGain.connect(this.masterGain);

        this.engineOsc1.start(now);
        this.engineOsc2.start(now);
        this.turboOsc.start(now);

        this.isEngineRunning = true;
    }

    updateEngineRPM(rpm, throttle = 0.5, isPlayerMode = true, timeScale = 1) {
        if (!this.isEngineRunning || !this.ctx || this.muted) return;
        if (timeScale === 0) {
            this.engineGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
            return;
        }
        const now = this.ctx.currentTime;
        const clampedRpm = Math.max(4000, Math.min(15200, rpm));
        const baseFreq = (clampedRpm / 60) * 1.5; // 6-cylinder 4-stroke harmonic

        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);
        this.turboOsc.frequency.setTargetAtTime(900 + (clampedRpm - 4000) * 0.22, now, 0.04);

        const cutoff = 380 + (clampedRpm / 15000) * 1600 + throttle * 450;
        this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.04);

        // Softer volume in Pit Wall camera vs Cockpit/Chase camera, scaled by engineVolume
        const engScale = this.engineVolume;
        const targetVol = (isPlayerMode ? (0.09 + throttle * 0.08) : 0.045) * engScale;
        this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
        this.turboGain.gain.setTargetAtTime((isPlayerMode ? (0.012 + throttle * 0.018) : 0.006) * engScale, now, 0.05);
    }

    stopEngineSound() {
        if (!this.isEngineRunning || !this.ctx) return;
        try {
            this.engineOsc1.stop();
            this.engineOsc2.stop();
            this.turboOsc.stop();
        } catch (e) {}
        this.isEngineRunning = false;
    }

    // Gear Shift Pop (Seamless Gearbox Ignition Cut)
    playGearShift(isUp = true) {
        this.init();
        if (!this.ctx || this.muted || this.engineVolume <= 0.01) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isUp ? 190 : 280, t);
        osc.frequency.exponentialRampToValueAtTime(isUp ? 75 : 150, t + 0.055);
        gain.gain.setValueAtTime(0.18 * this.engineVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.065);
    }

    // FIA Start Red Light Beep (5 Red Lights -> Lights Out High Tone)
    playStartLight(isLightsOut = false) {
        this.init();
        if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(isLightsOut ? 1046.5 : 523.25, t);
        gain.gain.setValueAtTime(0.28 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (isLightsOut ? 0.55 : 0.22));
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + (isLightsOut ? 0.56 : 0.24));
    }

    // F1 Official Team Radio Two-Tone Beep ("Beep-Boop")
    playRadioBeep() {
        this.init();
        if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;
        const t = this.ctx.currentTime;
        [1480, 1975].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + idx * 0.075);
            gain.gain.setValueAtTime(0.24 * this.sfxVolume, t + idx * 0.075);
            gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.075 + 0.07);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t + idx * 0.075);
            osc.stop(t + idx * 0.075 + 0.075);
        });
    }

    // DRS Activation Beep in Helmet
    playDrsBeep() {
        this.init();
        if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, t);
        gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // Pit Stop Pneumatic Wheel Gun Sound ("Zzzzt-Zzzzt!")
    playPitWheelGun() {
        this.init();
        if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;
        const t = this.ctx.currentTime;
        [0, 0.18, 0.36].forEach((offset) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(620, t + offset);
            osc.frequency.linearRampToValueAtTime(1450, t + offset + 0.12);
            gain.gain.setValueAtTime(0.22 * this.sfxVolume, t + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.14);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t + offset);
            osc.stop(t + offset + 0.15);
        });
    }

    // UI Click / R&D Upgrade Chime
    playUiClick(isUpgrade = false) {
        this.init();
        if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;
        const t = this.ctx.currentTime;
        const notes = isUpgrade ? [523.25, 659.25, 783.99, 1046.5] : [880];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + i * 0.06);
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.18);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t + i * 0.06);
            osc.stop(t + i * 0.06 + 0.2);
        });
    }

    // Carbon-Fiber Crash & Collision Impact Sound
    playCrashImpact(severity = 0.6) {
        this.init();
        if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;
        const t = this.ctx.currentTime;

        // Low thump
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(135, t);
        osc.frequency.exponentialRampToValueAtTime(28, t + 0.35);
        gain.gain.setValueAtTime(Math.min(0.45, 0.2 + severity * 0.25) * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.4);

        // Carbon debris noise burst
        const bufSize = Math.floor(this.ctx.sampleRate * 0.28);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.35));
        }
        const noise = this.createBufferSource ? this.createBufferSource() : this.ctx.createBufferSource();
        noise.buffer = buf;
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.28 * this.sfxVolume, t);
        noise.connect(ng);
        ng.connect(this.masterGain);
        noise.start(t);
    }

    // Tire Lockup / Spin Screech Sound
    playTireScreech() {
        this.init();
        if (!this.ctx || this.muted || this.sfxVolume <= 0.01) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1180, t);
        osc.frequency.linearRampToValueAtTime(920, t + 0.26);
        gain.gain.setValueAtTime(0.14 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
    }
}

window.f1Audio = new F1AudioEngine();
