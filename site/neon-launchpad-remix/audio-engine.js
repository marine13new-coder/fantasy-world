// ============================================================================
// NEON PULSE // STUDIO WEB AUDIO SYNTH, SAMPLER, SERUM-2 & DJ FX ENGINE
// Zero-dependency procedural studio audio + MP3/WAV Auto-Chopper + WAV Exporter
// ============================================================================

class NeonAudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;

    // Mixer Channel Volumes (8 Faders like M-Audio CODE 61)
    this.channelVolumes = {
      kick: 0.95,
      drums: 0.88,
      bass: 0.90,
      vocal: 0.88,
      synth: 0.85,
      fx: 0.80,
      reverb: 0.28,
      master: 0.90
    };
    this.channelMutes = {
      kick: false,
      drums: false,
      bass: false,
      vocal: false,
      synth: false,
      fx: false
    };

    // Performance FX State
    this.sidechainAmount = 0.72; // Club pump ducking
    this.djFilterValue = 0.5;    // 0.0 = Lowpass 150Hz, 0.5 = Neutral, 1.0 = Highpass 2500Hz
    this.activeFX = new Set();
    this.tapeStopRate = 1.0;

    // Serum 2 Live Synth State
    this.currentPatch = window.NEON_PRESETS.serumPatches[0];
    this.synthParams = { ...this.currentPatch };
    this.activeSynthVoices = new Map(); // code -> voice object
    this.lastSynthFreq = null;

    // Custom User Sample Buffer (for Auto-Chop 16 Pads)
    this.customAudioBuffer = null;
    this.customSampleName = null;
    this.padCustomBuffers = new Array(16).fill(null);

    // Master Recording
    this.isRecordingMaster = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];

    // Real-time Metering per channel
    this.channelPeaks = {
      kick: 0, drums: 0, bass: 0, vocal: 0, synth: 0, fx: 0, reverb: 0, master: 0
    };
  }

  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx({ latencyHint: 'interactive' });

    // Master Chain: Buses -> Sidechain -> DJ Filter -> Crusher/Drive -> Master Gain -> Limiter -> Analyser -> Destination
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.channelVolumes.master;

    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -3.0;
    this.masterLimiter.knee.value = 6.0;
    this.masterLimiter.ratio.value = 16.0;
    this.masterLimiter.attack.value = 0.002;
    this.masterLimiter.release.value = 0.08;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // DJ Bi-Directional Filter (LPF + HPF in series)
    this.lpfNode = this.ctx.createBiquadFilter();
    this.lpfNode.type = 'lowpass';
    this.lpfNode.frequency.value = 20000;
    this.lpfNode.Q.value = 2.2;

    this.hpfNode = this.ctx.createBiquadFilter();
    this.hpfNode.type = 'highpass';
    this.hpfNode.frequency.value = 20;
    this.hpfNode.Q.value = 2.0;

    // Master Saturation / Bitcrusher Shaper
    this.driveNode = this.ctx.createWaveShaper();
    this.driveNode.curve = this._makeDistortionCurve(15);
    this.driveNode.oversample = '2x';

    // Sidechain Ducking Bus (Bass, Synth, Vocal, FX pass through this)
    this.sidechainBus = this.ctx.createGain();
    this.sidechainBus.gain.value = 1.0;

    // Drum Bus (Bypasses sidechain ducking so kicks/snares punch through)
    this.kickBus = this.ctx.createGain();
    this.drumsBus = this.ctx.createGain();
    this.bassBus = this.ctx.createGain();
    this.vocalBus = this.ctx.createGain();
    this.synthBus = this.ctx.createGain();
    this.fxBus = this.ctx.createGain();

    this._syncBusGains();

    // Stereo Reverb & Ping-Pong Delay Send
    this.reverbSend = this.ctx.createGain();
    this.reverbSend.gain.value = this.channelVolumes.reverb;
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = this._createImpulseResponse(1.8, 2.6);

    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 60 / 130 * 0.75; // Dotted 8th
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.32;
    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'bandpass';
    this.delayFilter.frequency.value = 1600;

    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);

    // Connect Buses
    this.kickBus.connect(this.lpfNode);
    this.drumsBus.connect(this.lpfNode);

    this.bassBus.connect(this.sidechainBus);
    this.vocalBus.connect(this.sidechainBus);
    this.synthBus.connect(this.sidechainBus);
    this.fxBus.connect(this.sidechainBus);

    // Send Vocal, Synth & FX to Reverb/Delay
    this.vocalBus.connect(this.reverbSend);
    this.synthBus.connect(this.reverbSend);
    this.fxBus.connect(this.reverbSend);
    this.drumsBus.connect(this.reverbSend);

    this.reverbSend.connect(this.convolver);
    this.reverbSend.connect(this.delayNode);
    this.convolver.connect(this.sidechainBus);
    this.delayNode.connect(this.sidechainBus);

    this.sidechainBus.connect(this.lpfNode);
    this.lpfNode.connect(this.hpfNode);
    this.hpfNode.connect(this.driveNode);
    this.driveNode.connect(this.masterGain);
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Master Recording Stream Destination
    if (this.ctx.createMediaStreamDestination) {
      this.recordDest = this.ctx.createMediaStreamDestination();
      this.masterLimiter.connect(this.recordDest);
    }

    // Shared Noise Buffer for Snares/Hats/Claps/Risers
    this.noiseBuffer = this._createNoiseBuffer(2.0);

    this.isInitialized = true;
  }

  _syncBusGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.kickBus.gain.setTargetAtTime(this.channelMutes.kick ? 0 : this.channelVolumes.kick, now, 0.01);
    this.drumsBus.gain.setTargetAtTime(this.channelMutes.drums ? 0 : this.channelVolumes.drums, now, 0.01);
    this.bassBus.gain.setTargetAtTime(this.channelMutes.bass ? 0 : this.channelVolumes.bass, now, 0.01);
    this.vocalBus.gain.setTargetAtTime(this.channelMutes.vocal ? 0 : this.channelVolumes.vocal, now, 0.01);
    this.synthBus.gain.setTargetAtTime(this.channelMutes.synth ? 0 : this.channelVolumes.synth, now, 0.01);
    this.fxBus.gain.setTargetAtTime(this.channelMutes.fx ? 0 : this.channelVolumes.fx, now, 0.01);
    this.reverbSend.gain.setTargetAtTime(this.channelVolumes.reverb, now, 0.01);
    this.masterGain.gain.setTargetAtTime(this.channelVolumes.master, now, 0.01);
  }

  setChannelVolume(ch, val) {
    this.channelVolumes[ch] = Math.max(0, Math.min(1.2, val));
    this._syncBusGains();
  }

  toggleChannelMute(ch) {
    this.channelMutes[ch] = !this.channelMutes[ch];
    this._syncBusGains();
    return this.channelMutes[ch];
  }

  // Trigger Sidechain Pump when Kick or 808 hits
  triggerSidechain(now = this.ctx.currentTime) {
    if (!this.ctx || this.sidechainAmount <= 0.02) return;
    const duckFloor = Math.max(0.08, 1.0 - this.sidechainAmount * 0.88);
    const gain = this.sidechainBus.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(1.0, now);
    gain.linearRampToValueAtTime(duckFloor, now + 0.008);
    gain.exponentialRampToValueAtTime(1.0, now + 0.19);
  }

  // Set Bi-Directional DJ Filter (0.0 = Deep LPF, 0.5 = Bypass, 1.0 = High HPF)
  setDJFilter(normVal, resonanceBoost = 0) {
    this.djFilterValue = Math.max(0, Math.min(1, normVal));
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.djFilterValue < 0.48) {
      const t = this.djFilterValue / 0.48; // 0 -> 1
      const freq = 140 * Math.pow(20000 / 140, t);
      this.lpfNode.frequency.setTargetAtTime(freq, now, 0.015);
      this.lpfNode.Q.setTargetAtTime(3.5 + resonanceBoost * 5, now, 0.015);
      this.hpfNode.frequency.setTargetAtTime(20, now, 0.015);
    } else if (this.djFilterValue > 0.52) {
      const t = (this.djFilterValue - 0.52) / 0.48; // 0 -> 1
      const freq = 20 * Math.pow(3800 / 20, t);
      this.hpfNode.frequency.setTargetAtTime(freq, now, 0.015);
      this.hpfNode.Q.setTargetAtTime(3.2 + resonanceBoost * 5, now, 0.015);
      this.lpfNode.frequency.setTargetAtTime(20000, now, 0.015);
    } else {
      this.lpfNode.frequency.setTargetAtTime(20000, now, 0.015);
      this.lpfNode.Q.setTargetAtTime(1.0, now, 0.015);
      this.hpfNode.frequency.setTargetAtTime(20, now, 0.015);
      this.hpfNode.Q.setTargetAtTime(1.0, now, 0.015);
    }
  }

  setBitcrush(enabled) {
    if (!this.ctx) return;
    this.driveNode.curve = enabled
      ? this._makeBitcrushCurve(5, 120)
      : this._makeDistortionCurve(15);
  }

  // Trigger one of the 16 Launchpad Pads!
  triggerPad(padIndex, padDef, velocity = 1.0, timeOffset = 0) {
    this.init();
    const now = this.ctx.currentTime + timeOffset;

    // Update channel peak meter for visual feedback
    const chMap = {
      kick: 'kick',
      drum: 'drums',
      perc: 'drums',
      hat: 'drums',
      bass: 'bass',
      vocal: 'vocal',
      synth: 'synth',
      fx: 'fx'
    };
    const meterCh = chMap[padDef.category] || 'drums';
    this.channelPeaks[meterCh] = Math.min(1.0, velocity);
    this.channelPeaks.master = Math.min(1.0, velocity * 0.95);

    // Check if user loaded a custom sliced sample onto this pad
    if (this.customAudioBuffer && padDef.customSlice) {
      this._playCustomSlice(padDef.customSlice, velocity, now);
      return;
    }

    switch (padDef.synthType) {
      case 'drum_kick':
        this._playKick(padDef, velocity, now);
        break;
      case 'drum_808':
        this._play808(padDef, velocity, now);
        break;
      case 'drum_snare':
        this._playSnare(padDef, velocity, now);
        break;
      case 'drum_clap':
        this._playClap(padDef, velocity, now);
        break;
      case 'drum_rim':
        this._playRim(padDef, velocity, now);
        break;
      case 'perc_squeak':
        this._playJerseySqueak(padDef, velocity, now);
        break;
      case 'drum_closedhat':
        this._playHiHat(false, padDef.decay || 0.05, velocity, now);
        break;
      case 'drum_openhat':
        this._playHiHat(true, padDef.decay || 0.35, velocity, now);
        break;
      case 'drum_hatroll':
        this._playHatRoll(padDef.count || 4, padDef.speed || 0.05, velocity, now);
        break;
      case 'serum_splash':
      case 'serum_splash_glide':
        this._playSerumSplashBass(padDef, velocity, now);
        break;
      case 'bass_reese':
        this._playReeseBass(padDef, velocity, now);
        break;
      case 'bass_organ':
        this._playOrganBass(padDef, velocity, now);
        break;
      case 'chord_stab':
        this._playChordStab(padDef, velocity, now);
        break;
      case 'vocal_neon':
      case 'vocal_a2o':
      case 'vocal_yup':
        this._playVocalChop(padDef, velocity, now);
        break;
      case 'fx_laser':
        this._playLaserFX(padDef, velocity, now);
        break;
      case 'fx_rewind':
        this._playRewindFX(padDef, velocity, now);
        break;
      default:
        this._playKick(padDef, velocity, now);
    }
  }

  // --- DRUM & 808 SYNTHESIZERS ---
  _playKick(def, vel, now) {
    const osc = this.ctx.createOscillator();
    const clickOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const clickGain = this.ctx.createGain();

    osc.type = 'sine';
    const startF = def.startFreq || 165;
    const endF = def.endFreq || 42;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(endF, now + 0.065);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.28);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vel * 1.15, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

    // Transient punch click
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(950, now);
    clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.018);
    clickGain.gain.setValueAtTime(vel * 0.55, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    clickOsc.connect(clickGain);
    gain.connect(this.kickBus);
    clickGain.connect(this.kickBus);

    osc.start(now);
    clickOsc.start(now);
    osc.stop(now + 0.32);
    clickOsc.stop(now + 0.025);

    if (def.sidechain) this.triggerSidechain(now);
  }

  _play808(def, vel, now) {
    const freq = this._midiToFreq(def.pitch || 36);
    const decay = def.decay || 0.75;

    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const shaper = this.ctx.createWaveShaper();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    sub.type = 'sine';

    // 808 Pitch Envelope drop
    osc.frequency.setValueAtTime(freq * 2.4, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.045);
    sub.frequency.setValueAtTime(freq * 2.0, now);
    sub.frequency.exponentialRampToValueAtTime(freq, now + 0.045);

    shaper.curve = this._makeDistortionCurve((def.drive || 0.5) * 90);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.exponentialRampToValueAtTime(190, now + decay * 0.8);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vel * 0.95, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(shaper);
    sub.connect(shaper);
    shaper.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassBus);

    osc.start(now);
    sub.start(now);
    osc.stop(now + decay + 0.04);
    sub.stop(now + decay + 0.04);

    if (def.sidechain) this.triggerSidechain(now);
  }

  _playSnare(def, vel, now) {
    // Body oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    const tone = def.tone || 210;
    osc.frequency.setValueAtTime(tone * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(tone * 0.7, now + 0.09);

    oscGain.gain.setValueAtTime(vel * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    // Crisp Noise Snap
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1100, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vel * (def.snap || 0.9), now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);

    osc.connect(oscGain);
    oscGain.connect(this.drumsBus);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.drumsBus);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.16);
    noise.stop(now + 0.23);
  }

  _playClap(def, vel, now) {
    // Multi-burst 909/Trap Clap
    const offsets = [0, 0.011, 0.022, 0.034];
    offsets.forEach((off, idx) => {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1450;
      filter.Q.value = 1.6;

      const gain = this.ctx.createGain();
      const t = now + off;
      const dur = idx === offsets.length - 1 ? 0.22 : 0.018;
      gain.gain.setValueAtTime(vel * 0.75, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.drumsBus);

      noise.start(t);
      noise.stop(t + dur + 0.01);
    });
  }

  _playRim(def, vel, now) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const tone = def.tone || 450;
    osc1.type = 'triangle';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(tone, now);
    osc2.frequency.setValueAtTime(tone * 2.35, now);

    filter.type = 'bandpass';
    filter.frequency.value = tone * 1.8;
    filter.Q.value = 4.5;

    gain.gain.setValueAtTime(vel * 0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumsBus);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.07);
    osc2.stop(now + 0.07);
  }

  // Iconic Jersey Club Bed Squeak Percussion
  _playJerseySqueak(def, vel, now) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const basePitch = def.pitch || 820;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(basePitch * 0.72, now);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 1.45, now + 0.075);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 0.9, now + 0.14);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(basePitch * 1.3, now);
    filter.Q.value = 9.0;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vel * 0.7, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumsBus);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  _playHiHat(isOpen, decay, vel, now, pitchScale = 1.0) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.playbackRate.value = pitchScale;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = isOpen ? 6200 : 8000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vel * (isOpen ? 0.55 : 0.65), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumsBus);

    noise.start(now);
    noise.stop(now + decay + 0.01);
  }

  _playHatRoll(count, speed, vel, now) {
    for (let i = 0; i < count; i++) {
      // Pitch-descending Trap Hi-Hat Roll!
      const pitchScale = 1.15 - (i / count) * 0.32;
      const hitVel = vel * (0.95 - (i / count) * 0.25);
      this._playHiHat(false, speed * 0.85, hitVel, now + i * speed, pitchScale);
    }
  }

  // --- SERUM 2 `110_Splash_Bass_Mod_Square` PAD & SYNTH ENGINE ---
  _playSerumSplashBass(def, vel, now) {
    const dur = def.duration || 0.45;
    const freq = this._midiToFreq(def.pitch || 36);
    const endFreq = def.glideTo ? this._midiToFreq(def.glideTo) : freq;

    const oscA = this.ctx.createOscillator(); // Mod Square
    const oscB = this.ctx.createOscillator(); // Detuned Saw
    const subOsc = this.ctx.createOscillator(); // -1 Oct Sub
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    const filter = this.ctx.createBiquadFilter();
    const shaper = this.ctx.createWaveShaper();
    const amp = this.ctx.createGain();

    oscA.type = 'square';
    oscB.type = 'sawtooth';
    subOsc.type = 'sine';

    oscA.frequency.setValueAtTime(freq, now);
    oscB.frequency.setValueAtTime(freq, now);
    oscB.detune.value = 16;
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    if (def.glideTo) {
      oscA.frequency.exponentialRampToValueAtTime(endFreq, now + dur * 0.75);
      oscB.frequency.exponentialRampToValueAtTime(endFreq, now + dur * 0.75);
      subOsc.frequency.exponentialRampToValueAtTime(endFreq * 0.5, now + dur * 0.75);
    }

    // LFO -> Filter Cutoff ("Splash Bass Mod Square" Wobble!)
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(def.lfoRate || this.synthParams.lfoRate || 6.5, now);
    lfoGain.gain.setValueAtTime(this.synthParams.lfoDepth || 1100, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(def.cutoff || this.synthParams.cutoff || 1600, now);
    filter.Q.setValueAtTime(this.synthParams.resonance || 6.5, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    shaper.curve = this._makeDistortionCurve(45);

    amp.gain.setValueAtTime(0.001, now);
    amp.gain.linearRampToValueAtTime(vel * 0.75, now + 0.01);
    amp.gain.setValueAtTime(vel * 0.7, now + dur * 0.75);
    amp.gain.exponentialRampToValueAtTime(0.001, now + dur);

    oscA.connect(filter);
    oscB.connect(filter);
    subOsc.connect(filter);
    filter.connect(shaper);
    shaper.connect(amp);
    amp.connect(this.bassBus);

    oscA.start(now);
    oscB.start(now);
    subOsc.start(now);
    lfo.start(now);

    const stopTime = now + dur + 0.02;
    oscA.stop(stopTime);
    oscB.stop(stopTime);
    subOsc.stop(stopTime);
    lfo.stop(stopTime);
  }

  _playReeseBass(def, vel, now) {
    const dur = def.duration || 0.55;
    const freq = this._midiToFreq(def.pitch || 41);
    const detunes = [-26, 0, 26];
    const filter = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(def.cutoff || 1050, now);
    filter.Q.value = 4.2;

    amp.gain.setValueAtTime(0.001, now);
    amp.gain.linearRampToValueAtTime(vel * 0.7, now + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.001, now + dur);

    detunes.forEach(d => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.value = d;
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    });

    filter.connect(amp);
    amp.connect(this.bassBus);
  }

  _playOrganBass(def, vel, now) {
    const dur = def.duration || 0.35;
    const freq = this._midiToFreq(def.pitch || 48);
    // Classic M1 Organ Bass: Fundamental + 5th + Octave
    const ratios = [1, 1.498, 2];
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(0.001, now);
    amp.gain.linearRampToValueAtTime(vel * 0.75, now + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.001, now + dur);

    ratios.forEach((r, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * r, now);
      const g = this.ctx.createGain();
      g.gain.value = idx === 0 ? 0.65 : 0.35;
      osc.connect(g);
      g.connect(amp);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    });

    amp.connect(this.bassBus);
  }

  _playChordStab(def, vel, now) {
    const notes = def.notes || [60, 63, 67, 70, 74];
    const dur = def.duration || 0.52;
    const filter = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5200, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + dur);
    filter.Q.value = 3.0;

    amp.gain.setValueAtTime(0.001, now);
    amp.gain.linearRampToValueAtTime(vel * 0.6, now + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.001, now + dur);

    notes.forEach(midi => {
      [-11, 11].forEach(det => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(this._midiToFreq(midi), now);
        osc.detune.value = det;
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + dur + 0.02);
      });
    });

    filter.connect(amp);
    amp.connect(this.synthBus);
  }

  // --- FORMANT VOCAL CHOP SYNTHESIZER ("NEON!", "A-2-O!", "BEYOND YUP!") ---
  _playVocalChop(def, vel, now) {
    const dur = def.duration || 0.42;
    const baseFreq = this._midiToFreq((def.pitch || 60) + 12);
    const [f1Start, f2Start] = def.formant || [800, 1600];

    // Glottal Pulse Sawtooth + Square carrier
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';

    // Vocal Pitch Articulation (K-Pop Hyperpop Vocal Chop Scoop & Stutter)
    if (def.synthType === 'vocal_neon') {
      // "NE - ON!" two-syllable formant morph
      osc1.frequency.setValueAtTime(baseFreq * 0.92, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.045);
      osc1.frequency.setValueAtTime(baseFreq * 1.122, now + dur * 0.48); // Step up a whole tone on "-ON!"
      osc2.frequency.setValueAtTime(baseFreq * 0.92, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.045);
      osc2.frequency.setValueAtTime(baseFreq * 1.122, now + dur * 0.48);
    } else if (def.synthType === 'vocal_a2o') {
      // "A - 2 - O!" 3-chop rhythm
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.setValueAtTime(baseFreq * 1.189, now + dur * 0.33);
      osc1.frequency.setValueAtTime(baseFreq * 0.89, now + dur * 0.66);
      osc2.frequency.setValueAtTime(baseFreq, now);
      osc2.frequency.setValueAtTime(baseFreq * 1.189, now + dur * 0.33);
      osc2.frequency.setValueAtTime(baseFreq * 0.89, now + dur * 0.66);
    } else {
      // "BEYOND YUP!" rising pitch glide
      osc1.frequency.setValueAtTime(baseFreq * 0.84, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.26, now + dur * 0.85);
      osc2.frequency.setValueAtTime(baseFreq * 0.84, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.26, now + dur * 0.85);
    }
    osc2.detune.value = 9;

    // Dual Parallel Formant Filters (Vowel Cavity Simulation)
    const formant1 = this.ctx.createBiquadFilter();
    const formant2 = this.ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant2.type = 'bandpass';
    formant1.Q.value = 6.5;
    formant2.Q.value = 8.0;

    formant1.frequency.setValueAtTime(f1Start, now);
    formant1.frequency.exponentialRampToValueAtTime(f1Start * 0.72, now + dur);
    formant2.frequency.setValueAtTime(f2Start, now);
    formant2.frequency.exponentialRampToValueAtTime(f2Start * 1.28, now + dur);

    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(0.001, now);
    amp.gain.linearRampToValueAtTime(vel * 0.85, now + 0.012);
    if (def.synthType === 'vocal_a2o') {
      // Gate articulation between syllables
      amp.gain.setValueAtTime(vel * 0.15, now + dur * 0.30);
      amp.gain.linearRampToValueAtTime(vel * 0.85, now + dur * 0.34);
      amp.gain.setValueAtTime(vel * 0.15, now + dur * 0.63);
      amp.gain.linearRampToValueAtTime(vel * 0.85, now + dur * 0.67);
    }
    amp.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc1.connect(formant1);
    osc2.connect(formant1);
    osc1.connect(formant2);
    osc2.connect(formant2);

    formant1.connect(amp);
    formant2.connect(amp);
    amp.connect(this.vocalBus);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.02);
    osc2.stop(now + dur + 0.02);
  }

  _playLaserFX(def, vel, now) {
    const dur = def.duration || 0.5;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1850, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(2400, now + dur);

    gain.gain.setValueAtTime(vel * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.fxBus);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  _playRewindFX(def, vel, now) {
    const dur = def.duration || 0.5;
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + dur);
    filter.Q.value = 4.0;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(2600, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxBus);

    osc.start(now);
    noise.start(now);
    osc.stop(now + dur + 0.02);
    noise.stop(now + dur + 0.02);
  }

  // --- RIGHT-HAND SERUM 2 WAVETABLE KEYBOARD SYNTH (Sustained or Sequenced) ---
  noteOnSynth(voiceId, midiNote, velocity = 0.9) {
    this.init();
    if (this.activeSynthVoices.has(voiceId)) {
      this.noteOffSynth(voiceId);
    }

    const now = this.ctx.currentTime;
    const p = this.synthParams;
    const targetMidi = midiNote + (p.octaveOffset || 0) * 12;
    const targetFreq = this._midiToFreq(targetMidi);
    const startFreq = (this.lastSynthFreq && p.glide > 0.01) ? this.lastSynthFreq : targetFreq;
    this.lastSynthFreq = targetFreq;

    const oscA = this.ctx.createOscillator();
    const oscB = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const subGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const shaper = this.ctx.createWaveShaper();
    const amp = this.ctx.createGain();

    oscA.type = p.oscA || 'square';
    oscB.type = p.oscB || 'sawtooth';
    subOsc.type = 'sine';

    oscA.frequency.setValueAtTime(startFreq, now);
    oscB.frequency.setValueAtTime(startFreq, now);
    subOsc.frequency.setValueAtTime(startFreq * 0.5, now);

    if (startFreq !== targetFreq) {
      oscA.frequency.exponentialRampToValueAtTime(targetFreq, now + (p.glide || 0.04));
      oscB.frequency.exponentialRampToValueAtTime(targetFreq, now + (p.glide || 0.04));
      subOsc.frequency.exponentialRampToValueAtTime(targetFreq * 0.5, now + (p.glide || 0.04));
    }

    oscB.detune.value = p.detune || 15;
    subGain.gain.value = p.subOsc ?? 0.6;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(p.cutoff || 1650, now);
    filter.Q.setValueAtTime(p.resonance || 6.0, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(p.lfoRate || 6.5, now);
    lfoGain.gain.setValueAtTime(p.lfoDepth || 1000, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    shaper.curve = this._makeDistortionCurve((p.drive || 0.5) * 80);

    amp.gain.setValueAtTime(0.001, now);
    amp.gain.linearRampToValueAtTime(velocity * 0.65, now + (p.attack || 0.008));

    oscA.connect(filter);
    oscB.connect(filter);
    subOsc.connect(subGain);
    subGain.connect(filter);

    filter.connect(shaper);
    shaper.connect(amp);
    amp.connect(this.synthBus);

    oscA.start(now);
    oscB.start(now);
    subOsc.start(now);
    lfo.start(now);

    this.channelPeaks.synth = Math.min(1.0, velocity);
    this.channelPeaks.master = Math.min(1.0, velocity * 0.9);

    this.activeSynthVoices.set(voiceId, {
      oscA, oscB, subOsc, lfo, filter, lfoGain, amp, midiNote
    });
  }

  noteOffSynth(voiceId) {
    const voice = this.activeSynthVoices.get(voiceId);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    const rel = this.synthParams.release || 0.22;
    voice.amp.gain.cancelScheduledValues(now);
    voice.amp.gain.setValueAtTime(Math.max(0.001, voice.amp.gain.value), now);
    voice.amp.gain.exponentialRampToValueAtTime(0.0001, now + rel);

    const stopAt = now + rel + 0.02;
    try {
      voice.oscA.stop(stopAt);
      voice.oscB.stop(stopAt);
      voice.subOsc.stop(stopAt);
      voice.lfo.stop(stopAt);
    } catch (e) {}

    this.activeSynthVoices.delete(voiceId);
  }

  playSynthNoteTimed(midiNote, durationSec = 0.25, velocity = 0.85) {
    const id = 'seq_' + midiNote + '_' + Math.random();
    this.noteOnSynth(id, midiNote, velocity);
    setTimeout(() => this.noteOffSynth(id), durationSec * 1000);
  }

  updateSerumParam(param, value) {
    this.synthParams[param] = value;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.activeSynthVoices.forEach(v => {
      if (param === 'cutoff') v.filter.frequency.setTargetAtTime(value, now, 0.015);
      if (param === 'resonance') v.filter.Q.setTargetAtTime(value, now, 0.015);
      if (param === 'lfoRate') v.lfo.frequency.setTargetAtTime(value, now, 0.015);
      if (param === 'lfoDepth') v.lfoGain.gain.setTargetAtTime(value, now, 0.015);
      if (param === 'detune') v.oscB.detune.setTargetAtTime(value, now, 0.015);
    });
  }

  loadSerumPatch(patchObj) {
    this.currentPatch = patchObj;
    this.synthParams = { ...patchObj };
  }

  // --- CUSTOM AUDIO FILE / MICROPHONE AUTO-CHOPPER (16 PADS) ---
  async loadCustomAudioFile(file) {
    this.init();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.customAudioBuffer = audioBuffer;
    this.customSampleName = file.name.replace(/\.[^/.]+$/, '');
    return this._createAutoChopSlices(audioBuffer);
  }

  _createAutoChopSlices(audioBuffer) {
    const duration = audioBuffer.duration;
    const sliceLen = duration / 16;
    const slices = [];
    for (let i = 0; i < 16; i++) {
      slices.push({
        index: i,
        start: i * sliceLen,
        duration: Math.min(sliceLen, 2.5),
        pitchRate: 1.0
      });
    }
    return slices;
  }

  _playCustomSlice(slice, vel, now) {
    if (!this.customAudioBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.customAudioBuffer;
    src.playbackRate.value = slice.pitchRate || 1.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vel, now + 0.006);
    gain.gain.setValueAtTime(vel, now + Math.max(0.02, slice.duration - 0.03));
    gain.gain.exponentialRampToValueAtTime(0.001, now + slice.duration);

    src.connect(gain);
    gain.connect(this.vocalBus);
    src.start(now, slice.start, slice.duration);
  }

  // --- MASTER AUDIO RECORDER ---
  startMasterRecord() {
    this.init();
    if (!this.recordDest || this.isRecordingMaster) return false;
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.recordDest.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.start();
    this.isRecordingMaster = true;
    return true;
  }

  stopMasterRecord(callback) {
    if (!this.mediaRecorder || !this.isRecordingMaster) return;
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      this.isRecordingMaster = false;
      if (callback) callback(url, blob);
    };
    this.mediaRecorder.stop();
  }

  // --- UTILITIES ---
  _midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  _createNoiseBuffer(seconds) {
    const len = this.ctx.sampleRate * seconds;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  _createImpulseResponse(duration, decay) {
    const len = this.ctx.sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return impulse;
  }

  _makeDistortionCurve(amount = 20) {
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  _makeBitcrushCurve(bits = 4, normFreq = 100) {
    const n = 4096;
    const curve = new Float32Array(n);
    const steps = Math.pow(2, bits);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.round(x * steps) / steps;
    }
    return curve;
  }
}

window.NeonAudioEngine = NeonAudioEngine;
