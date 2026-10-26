// Web Audio API Procedural Sound Engine for FM Dream Team
// No external audio files required - 100% self-contained synthesized sounds

class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.crowdGain = null;
        this.crowdSource = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // 1. Referee Whistle
    playWhistle(type = 'short') {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = type === 'triple' ? 1.2 : (type === 'long' ? 0.7 : 0.25);

        const playTone = (start, dur) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(2600, start);
            osc.frequency.exponentialRampToValueAtTime(2400, start + dur);

            // Modulation for realistic pea whistle trill
            const modOsc = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            modOsc.frequency.value = 35;
            modGain.gain.value = 180;
            modOsc.connect(osc.frequency);
            modOsc.start(start);
            modOsc.stop(start + dur);

            filter.type = 'bandpass';
            filter.frequency.value = 2500;
            filter.Q.value = 5;

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(start + dur);
        };

        if (type === 'triple') {
            playTone(now, 0.22);
            playTone(now + 0.3, 0.22);
            playTone(now + 0.6, 0.55);
        } else if (type === 'double') {
            playTone(now, 0.18);
            playTone(now + 0.24, 0.35);
        } else {
            playTone(now, duration);
        }
    }

    // 2. Ball Kick Impact
    playKick(power = 1.0) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const startFreq = 180 * Math.min(1.4, Math.max(0.7, power));
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

        gain.gain.setValueAtTime(0.35 * power, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    // 3. Post / Crossbar Metallic Thump
    playPostHit() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
    }

    // 4. Goal Cheer (Roaring crowd synthesis with filtered noise)
    playGoalRoar() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * 2.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.Q.value = 1.2;

        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.45, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 2.5);
    }

    // 5. Near miss groan ("Aaaah")
    playGroan() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.6);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.75);
    }

    // 6. UI click / tact sound
    playClick() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }
}

const sounds = new SoundManager();
