// ============================================================================
// NEON PULSE // STUDIO PAD & REMIX WORKSTATION (Aynn / CODE-61 / Serum 2 Edition)
// Data-Driven Presets: Pad Kits, Serum 2 Synth Patches, & Remix Pattern Scenes
// ============================================================================

window.NEON_PRESETS = {
  // 4x4 Left-Hand Launchpad Key Mapping (Standard QWERTY 4x4 Grid)
  padKeys: [
    // Row 1 (Top - Vocal Chops & FX)
    { index: 0, key: '1', code: 'Digit1', row: 0, col: 0 },
    { index: 1, key: '2', code: 'Digit2', row: 0, col: 1 },
    { index: 2, key: '3', code: 'Digit3', row: 0, col: 2 },
    { index: 3, key: '4', code: 'Digit4', row: 0, col: 3 },
    // Row 2 (Bass & Synth Chops)
    { index: 4, key: 'Q', code: 'KeyQ', row: 1, col: 0 },
    { index: 5, key: 'W', code: 'KeyW', row: 1, col: 1 },
    { index: 6, key: 'E', code: 'KeyE', row: 1, col: 2 },
    { index: 7, key: 'R', code: 'KeyR', row: 1, col: 3 },
    // Row 3 (Snares, Claps & Percs)
    { index: 8, key: 'A', code: 'KeyA', row: 2, col: 0 },
    { index: 9, key: 'S', code: 'KeyS', row: 2, col: 1 },
    { index: 10, key: 'D', code: 'KeyD', row: 2, col: 2 },
    { index: 11, key: 'F', code: 'KeyF', row: 2, col: 3 },
    // Row 4 (Bottom - Kicks, 808s & Hats)
    { index: 12, key: 'Z', code: 'KeyZ', row: 3, col: 0 },
    { index: 13, key: 'X', code: 'KeyX', row: 3, col: 1 },
    { index: 14, key: 'C', code: 'KeyC', row: 3, col: 2 },
    { index: 15, key: 'V', code: 'KeyV', row: 3, col: 3 }
  ],

  // Right-Hand CODE-61 Synth Keyboard Mapping (Playable simultaneously with Left-Hand Pads!)
  synthKeys: [
    { note: 'C3', midi: 48, key: 'N', code: 'KeyN', isBlack: false, label: 'C' },
    { note: 'C#3', midi: 49, key: 'J', code: 'KeyJ', isBlack: true, label: 'C#' },
    { note: 'D3', midi: 50, key: 'M', code: 'KeyM', isBlack: false, label: 'D' },
    { note: 'Eb3', midi: 51, key: 'K', code: 'KeyK', isBlack: true, label: 'Eb' },
    { note: 'E3', midi: 52, key: ',', code: 'Comma', isBlack: false, label: 'E' },
    { note: 'F3', midi: 53, key: '.', code: 'Period', isBlack: false, label: 'F' },
    { note: 'F#3', midi: 54, key: ';', code: 'Semicolon', isBlack: true, label: 'F#' },
    { note: 'G3', midi: 55, key: '/', code: 'Slash', isBlack: false, label: 'G' },
    // Upper row right-hand lead/bass keys (Easy 1-row scale or chromatic)
    { note: 'G#3', midi: 56, key: 'U', code: 'KeyU', isBlack: true, label: 'Ab' },
    { note: 'A3', midi: 57, key: 'I', code: 'KeyI', isBlack: false, label: 'A' },
    { note: 'Bb3', midi: 58, key: 'O', code: 'KeyO', isBlack: true, label: 'Bb' },
    { note: 'B3', midi: 59, key: 'P', code: 'KeyP', isBlack: false, label: 'B' },
    { note: 'C4', midi: 60, key: '[', code: 'BracketLeft', isBlack: false, label: 'C4' },
    { note: 'Eb4', midi: 63, key: ']', code: 'BracketRight', isBlack: true, label: 'Eb4' },
    { note: 'F4', midi: 65, key: '\\', code: 'Backslash', isBlack: false, label: 'F4' }
  ],

  // Live DJ Performance FX Keys (Number row 5-0 & Function buttons)
  fxKeys: [
    { id: 'stutter8', name: 'BEAT REPEAT 1/8', sub: '홀드: 1/8 비트 리피트', key: '5', code: 'Digit5', color: '#00f0ff' },
    { id: 'stutter16', name: 'DRILL STUTTER 1/16', sub: '홀드: 1/16 글리치 롤', key: '6', code: 'Digit6', color: '#ff007f' },
    { id: 'lowpass', name: 'UNDERWATER LPF', sub: '홀드: 로우패스 먹먹한 필터', key: '7', code: 'Digit7', color: '#38bdf8' },
    { id: 'highpass', name: 'BUILD-UP HPF', sub: '홀드: 하이패스 빌드업', key: '8', code: 'Digit8', color: '#f59e0b' },
    { id: 'tapestop', name: 'VINYL TAPE STOP', sub: '홀드: 테이프 정지 드롭', key: '9', code: 'Digit9', color: '#ef4444' },
    { id: 'crush', name: 'Y2K BITCRUSHER', sub: '홀드: 8비트 디스토션', key: '0', code: 'Digit0', color: '#a855f7' }
  ],

  // 5 Complete Producer Kits (16 Pads each)
  kits: {
    neon_aynn: {
      id: 'neon_aynn',
      name: '🔥 NEON - A2O LITE (Aynn Remix Kit)',
      bpm: 130,
      rootNote: 'C Minor',
      desc: '유튜브 NEON STUDIO NEON 리믹스 감성! Serum 2 110_Splash_Bass_Mod_Square 워블 베이스 & 보컬 찹 패드',
      pads: [
        // Row 1: Vocal Chops & FX (Keys: 1, 2, 3, 4)
        { name: 'VOX "NEON!"', sub: 'Vocal Hook Chop 1', category: 'vocal', color: '#ff007f', synthType: 'vocal_neon', pitch: 60, formant: [800, 1450], duration: 0.42 },
        { name: 'VOX "A-2-O"', sub: 'Vocal Hook Chop 2', category: 'vocal', color: '#ff007f', synthType: 'vocal_a2o', pitch: 63, formant: [650, 1900], duration: 0.38 },
        { name: 'VOX "BEYOND YUP"', sub: 'Pitch Stutter Vox', category: 'vocal', color: '#ff007f', synthType: 'vocal_yup', pitch: 67, formant: [950, 2200], duration: 0.45 },
        { name: 'HYPER LASER ZAP', sub: 'Dem Jointz Riser FX', category: 'fx', color: '#ffd166', synthType: 'fx_laser', pitch: 72, duration: 0.55 },

        // Row 2: Serum 2 Splash Bass & Chords (Keys: Q, W, E, R)
        { name: 'SPLASH BASS C1', sub: 'Serum Mod Square C', category: 'bass', color: '#00f0ff', synthType: 'serum_splash', pitch: 36, lfoRate: 6.5, cutoff: 1400, duration: 0.45 },
        { name: 'SPLASH BASS Eb1', sub: 'Serum Mod Square Eb', category: 'bass', color: '#00f0ff', synthType: 'serum_splash', pitch: 39, lfoRate: 8.6, cutoff: 1850, duration: 0.45 },
        { name: 'SPLASH BASS F1', sub: 'Serum Wobble F->G', category: 'bass', color: '#00f0ff', synthType: 'serum_splash_glide', pitch: 41, glideTo: 43, lfoRate: 13.0, cutoff: 2100, duration: 0.48 },
        { name: 'NEON CHORD STAB', sub: 'SuperSaw Cm9 Stab', category: 'synth', color: '#a855f7', synthType: 'chord_stab', notes: [60, 63, 67, 70, 74], duration: 0.52 },

        // Row 3: Snares, Claps & Percs (Keys: A, S, D, F)
        { name: 'CRISP SNARE', sub: 'K-Pop Layered Snare', category: 'drum', color: '#10b981', synthType: 'drum_snare', tone: 210, snap: 0.9 },
        { name: 'STADIUM CLAP', sub: 'Wide Trap Clap', category: 'drum', color: '#10b981', synthType: 'drum_clap', spread: 0.85 },
        { name: 'JERSEY SQUEAK', sub: 'Club Bed Squeak Perc', category: 'perc', color: '#f59e0b', synthType: 'perc_squeak', pitch: 820 },
        { name: 'OPEN HI-HAT', sub: 'Metallic Shimmer OH', category: 'hat', color: '#38bdf8', synthType: 'drum_openhat', decay: 0.36 },

        // Row 4: Kicks, 808s & Hats (Keys: Z, X, C, V)
        { name: 'PUNCH KICK', sub: 'Hard Sidechain Kick', category: 'kick', color: '#ffffff', synthType: 'drum_kick', startFreq: 165, endFreq: 42, punch: 1.0, sidechain: true },
        { name: '808 SUB BOOM', sub: 'Distorted 808 C1', category: 'kick', color: '#ef4444', synthType: 'drum_808', pitch: 36, drive: 0.55, decay: 0.75, sidechain: true },
        { name: 'CLOSED HAT', sub: 'Tight Crisp CH', category: 'hat', color: '#38bdf8', synthType: 'drum_closedhat', decay: 0.055 },
        { name: 'HAT ROLL 1/32', sub: 'Auto Trap Roll', category: 'hat', color: '#00f0ff', synthType: 'drum_hatroll', count: 4, speed: 0.055 }
      ]
    },

    cyber_ukg: {
      id: 'cyber_ukg',
      name: '⚡ CYBER UK GARAGE / 2-STEP (134 BPM)',
      bpm: 134,
      rootNote: 'F Minor',
      desc: '영국 UK 개러지 셔플 비트, 딥 리스 베이스(Reese Bass), 몽환적인 R&B 보컬 찹과 루즈한 림샷',
      pads: [
        { name: 'UKG VOX "FEEL"', sub: 'Formant Vocal Slice', category: 'vocal', color: '#ff007f', synthType: 'vocal_neon', pitch: 65, formant: [720, 1650], duration: 0.4 },
        { name: 'UKG VOX "LIGHT"', sub: 'High Pitch Chop', category: 'vocal', color: '#ff007f', synthType: 'vocal_yup', pitch: 68, formant: [900, 2350], duration: 0.35 },
        { name: 'SIREN DUB FX', sub: 'UK Dub Delay Siren', category: 'fx', color: '#ffd166', synthType: 'fx_laser', pitch: 77, duration: 0.6 },
        { name: 'VINYL REWIND', sub: 'Spinback Transition', category: 'fx', color: '#ffd166', synthType: 'fx_rewind', duration: 0.5 },

        { name: 'REESE BASS F1', sub: 'Detuned Neuro Reese', category: 'bass', color: '#00f0ff', synthType: 'bass_reese', pitch: 41, cutoff: 950, duration: 0.55 },
        { name: 'WOBBLE WARP Ab1', sub: 'UKG LFO Bass Ab', category: 'bass', color: '#00f0ff', synthType: 'serum_splash', pitch: 44, lfoRate: 9.0, cutoff: 1650, duration: 0.45 },
        { name: 'ORGAN BASS C2', sub: 'Classic M1 Organ Bass', category: 'bass', color: '#00f0ff', synthType: 'bass_organ', pitch: 48, duration: 0.35 },
        { name: 'RHODES Fm9', sub: 'Warm Electric Piano', category: 'synth', color: '#a855f7', synthType: 'chord_stab', notes: [65, 68, 72, 75, 79], duration: 0.6 },

        { name: 'UKG RIMSHOT', sub: 'Woody Garage Rim', category: 'drum', color: '#10b981', synthType: 'drum_rim', tone: 420 },
        { name: 'GHOST SNARE', sub: 'Tight Crispy Snare', category: 'drum', color: '#10b981', synthType: 'drum_snare', tone: 245, snap: 0.75 },
        { name: 'SHAKER GROOVE', sub: 'Swing Perc Hit', category: 'perc', color: '#f59e0b', synthType: 'drum_closedhat', decay: 0.09 },
        { name: '909 OPEN HAT', sub: 'Classic House OH', category: 'hat', color: '#38bdf8', synthType: 'drum_openhat', decay: 0.42 },

        { name: '2-STEP KICK', sub: 'Punchy Garage Kick', category: 'kick', color: '#ffffff', synthType: 'drum_kick', startFreq: 150, endFreq: 46, punch: 0.95, sidechain: true },
        { name: 'SUB DROP 808', sub: 'Deep Sine Sub F1', category: 'kick', color: '#ef4444', synthType: 'drum_808', pitch: 41, drive: 0.3, decay: 0.8, sidechain: true },
        { name: 'SKIPPY HAT', sub: 'Short Metallic Tick', category: 'hat', color: '#38bdf8', synthType: 'drum_closedhat', decay: 0.04 },
        { name: 'TRIPLET ROLL', sub: '3x Garage Hat Skip', category: 'hat', color: '#00f0ff', synthType: 'drum_hatroll', count: 3, speed: 0.068 }
      ]
    },

    jersey_drill: {
      id: 'jersey_drill',
      name: '💎 JERSEY CLUB & K-DRILL (140 BPM)',
      bpm: 140,
      rootNote: 'G# Minor',
      desc: '바운시한 저지 클럽 킥 트리플렛 + 삐걱거리는 침대 스프링 퍼커션 + 슬라이딩 드릴 808 베이스',
      pads: [
        { name: 'CHANT "HEY!"', sub: 'Jersey Crowd Chant', category: 'vocal', color: '#ff007f', synthType: 'vocal_a2o', pitch: 64, formant: [750, 1750], duration: 0.28 },
        { name: 'CHOP "WATCH ME"', sub: 'Pitched Vocal Hook', category: 'vocal', color: '#ff007f', synthType: 'vocal_yup', pitch: 68, formant: [880, 2100], duration: 0.38 },
        { name: 'DRILL FX RELOAD', sub: 'Metallic Click FX', category: 'fx', color: '#ffd166', synthType: 'drum_rim', tone: 680 },
        { name: 'SIREN WHOOP', sub: 'Club Police Whoop', category: 'fx', color: '#ffd166', synthType: 'fx_laser', pitch: 68, duration: 0.48 },

        { name: '808 SLIDE HIGH', sub: 'Drill Octave Glide', category: 'bass', color: '#00f0ff', synthType: 'serum_splash_glide', pitch: 39, glideTo: 51, lfoRate: 2.0, cutoff: 1100, duration: 0.55 },
        { name: '808 SLIDE LOW', sub: 'Dark Drill Sub G#', category: 'bass', color: '#00f0ff', synthType: 'drum_808', pitch: 32, drive: 0.7, decay: 0.85, sidechain: true },
        { name: 'BRASS STAB', sub: 'Aggressive Horn Hit', category: 'synth', color: '#a855f7', synthType: 'serum_splash', pitch: 44, lfoRate: 1.5, cutoff: 2400, duration: 0.4 },
        { name: 'DARK PAD G#m', sub: 'Cinematic Drill Chord', category: 'synth', color: '#a855f7', synthType: 'chord_stab', notes: [56, 59, 63, 66, 70], duration: 0.65 },

        { name: 'DRILL SNARE', sub: 'Counter-Snare Snap', category: 'drum', color: '#10b981', synthType: 'drum_snare', tone: 260, snap: 0.95 },
        { name: 'CLUB CLAP', sub: 'Jersey Party Clap', category: 'drum', color: '#10b981', synthType: 'drum_clap', spread: 0.95 },
        { name: 'BED SQUEAK HI', sub: 'Classic Jersey Squeak', category: 'perc', color: '#f59e0b', synthType: 'perc_squeak', pitch: 960 },
        { name: 'STOMP IMPACT', sub: 'Heavy Room Stomp', category: 'perc', color: '#f59e0b', synthType: 'drum_kick', startFreq: 190, endFreq: 55, punch: 1.2, sidechain: true },

        { name: 'JERSEY KICK', sub: 'Bouncy Club Kick', category: 'kick', color: '#ffffff', synthType: 'drum_kick', startFreq: 175, endFreq: 48, punch: 1.1, sidechain: true },
        { name: 'DRILL 808 KICK', sub: 'clipped 808 Thump', category: 'kick', color: '#ef4444', synthType: 'drum_808', pitch: 39, drive: 0.65, decay: 0.65, sidechain: true },
        { name: 'DRILL COUNTER HAT', sub: 'Sharp Drill Tick', category: 'hat', color: '#38bdf8', synthType: 'drum_closedhat', decay: 0.045 },
        { name: 'GLITCH ROLL 1/64', sub: 'Ultra Fast Hat Buzz', category: 'hat', color: '#00f0ff', synthType: 'drum_hatroll', count: 6, speed: 0.038 }
      ]
    },

    y2k_dnb: {
      id: 'y2k_dnb',
      name: '🎹 Y2K LIQUID D&B / NEW-GEN (160 BPM)',
      bpm: 160,
      rootNote: 'C Minor',
      desc: '빠른 160 BPM 아멘 브레이크비츠 드럼 앤 베이스, 청량한 Y2K 신스 플럭과 몽환적 코드 패드',
      pads: [
        { name: 'Y2K VOX "SPARKLE"', sub: 'Airy Vocal Chop', category: 'vocal', color: '#ff007f', synthType: 'vocal_neon', pitch: 72, formant: [920, 2400], duration: 0.35 },
        { name: 'Y2K VOX "DREAM"', sub: 'Soft Formant Vox', category: 'vocal', color: '#ff007f', synthType: 'vocal_a2o', pitch: 67, formant: [700, 1800], duration: 0.45 },
        { name: 'STAR CHIME FX', sub: 'Crystal Arpeggio FX', category: 'fx', color: '#ffd166', synthType: 'fx_laser', pitch: 84, duration: 0.5 },
        { name: 'BREAK CRASH', sub: 'Jungle Splash Cymbal', category: 'hat', color: '#ffd166', synthType: 'drum_openhat', decay: 0.65 },

        { name: 'LIQUID SUB C1', sub: 'Warm Sine Sub Bass', category: 'bass', color: '#00f0ff', synthType: 'drum_808', pitch: 36, drive: 0.2, decay: 0.7, sidechain: true },
        { name: 'REESE GLIDE Eb1', sub: 'D&B Rolling Reese', category: 'bass', color: '#00f0ff', synthType: 'bass_reese', pitch: 39, cutoff: 1200, duration: 0.5 },
        { name: 'DREAM CHORD Cm9', sub: 'Lush Y2K Epiano', category: 'synth', color: '#a855f7', synthType: 'chord_stab', notes: [60, 63, 67, 70, 74], duration: 0.6 },
        { name: 'DREAM CHORD AbM7', sub: 'Nostalgic Pad Stab', category: 'synth', color: '#a855f7', synthType: 'chord_stab', notes: [56, 60, 63, 67, 70], duration: 0.6 },

        { name: 'AMEN SNARE 1', sub: 'Classic Jungle Snare', category: 'drum', color: '#10b981', synthType: 'drum_snare', tone: 255, snap: 0.92 },
        { name: 'AMEN GHOST SNARE', sub: 'Breakbeat Shuffle', category: 'drum', color: '#10b981', synthType: 'drum_rim', tone: 360 },
        { name: 'TAMBOURINE HIT', sub: 'High Break Shimmer', category: 'perc', color: '#f59e0b', synthType: 'drum_openhat', decay: 0.14 },
        { name: 'FAST RIDE', sub: 'Liquid Ride Cymbal', category: 'hat', color: '#38bdf8', synthType: 'drum_openhat', decay: 0.28 },

        { name: 'JUNGLE KICK', sub: 'Tight Breakbeat Kick', category: 'kick', color: '#ffffff', synthType: 'drum_kick', startFreq: 160, endFreq: 52, punch: 0.95, sidechain: true },
        { name: '808 ROLL BASS', sub: 'Bouncy Low End', category: 'kick', color: '#ef4444', synthType: 'drum_808', pitch: 41, drive: 0.4, decay: 0.5, sidechain: true },
        { name: 'BREAK CLOSED HAT', sub: 'Crisp 160 BPM Hat', category: 'hat', color: '#38bdf8', synthType: 'drum_closedhat', decay: 0.04 },
        { name: 'AMEN ROLL 4X', sub: 'Breakbeat Drum Roll', category: 'hat', color: '#00f0ff', synthType: 'drum_hatroll', count: 4, speed: 0.042 }
      ]
    }
  },

  // Serum 2 Style Dual-Oscillator Wavetable Patches (Right-Hand Synth Keyboard)
  serumPatches: [
    {
      id: 'splash_bass_mod_square',
      name: '110_Splash_Bass_Mod_Square (Aynn Video Patch)',
      oscA: 'square',
      oscB: 'sawtooth',
      detune: 14,
      subOsc: 0.65,
      cutoff: 1650,
      resonance: 6.5,
      lfoRate: 6.5,     // Hz wobble
      lfoDepth: 1100,   // Filter mod depth
      drive: 0.55,
      attack: 0.008,
      release: 0.22,
      glide: 0.045,
      octaveOffset: -1,
      color: '#00f0ff'
    },
    {
      id: 'neon_hyper_lead',
      name: 'NEON Hyperpop SuperSaw Lead',
      oscA: 'sawtooth',
      oscB: 'sawtooth',
      detune: 28,
      subOsc: 0.25,
      cutoff: 4200,
      resonance: 3.5,
      lfoRate: 4.5,
      lfoDepth: 600,
      drive: 0.35,
      attack: 0.01,
      release: 0.32,
      glide: 0.03,
      octaveOffset: 0,
      color: '#ff007f'
    },
    {
      id: 'zalpha_fm_pluck',
      name: 'Zalpha Pop Metallic FM Pluck',
      oscA: 'triangle',
      oscB: 'square',
      detune: 8,
      subOsc: 0.4,
      cutoff: 2800,
      resonance: 8.0,
      lfoRate: 12.0,
      lfoDepth: 950,
      drive: 0.4,
      attack: 0.004,
      release: 0.18,
      glide: 0.01,
      octaveOffset: 0,
      color: '#ffd166'
    },
    {
      id: 'reese_sub_terror',
      name: 'Dirty Neuro Reese Bass',
      oscA: 'sawtooth',
      oscB: 'square',
      detune: 35,
      subOsc: 0.85,
      cutoff: 880,
      resonance: 5.2,
      lfoRate: 3.2,
      lfoDepth: 720,
      drive: 0.72,
      attack: 0.02,
      release: 0.38,
      glide: 0.08,
      octaveOffset: -1,
      color: '#10b981'
    },
    {
      id: 'acid_303_squelch',
      name: 'Cyber Acid 303 Squelch',
      oscA: 'sawtooth',
      oscB: 'square',
      detune: 4,
      subOsc: 0.3,
      cutoff: 1100,
      resonance: 14.5,
      lfoRate: 8.0,
      lfoDepth: 1600,
      drive: 0.65,
      attack: 0.005,
      release: 0.16,
      glide: 0.06,
      octaveOffset: -1,
      color: '#a855f7'
    }
  ],

  // 5 Pre-Programmed 16-Step Remix Scenes (Each pad has a 16-step array: 0=off, 1=normal, 2=2x roll, 3=3x roll, 4=4x roll)
  scenes: [
    {
      id: 'scene_drop',
      name: 'SCENE 1 // AYNN NEON MAIN DROP',
      badge: 'MAIN REMIX',
      steps: {
        // Row 1: Vocal Chops & FX
        0:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0], // VOX "NEON!"
        1:  [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], // VOX "A-2-O"
        2:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0], // VOX "BEYOND YUP"
        3:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1], // HYPER LASER
        // Row 2: Serum 2 Splash Bass & Chords
        4:  [1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,0,0], // SPLASH BASS C1
        5:  [0,0,0,0, 0,0,1,0, 0,0,0,1, 0,0,0,0], // SPLASH BASS Eb1
        6:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,1,0,1], // SPLASH BASS F1
        7:  [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], // NEON CHORD STAB
        // Row 3: Snares, Claps & Percs
        8:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], // CRISP SNARE
        9:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1], // STADIUM CLAP
        10: [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,0], // JERSEY SQUEAK
        11: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], // OPEN HI-HAT
        // Row 4: Kicks, 808s & Hats
        12: [1,0,0,0, 0,0,1,0, 1,0,0,1, 0,0,0,0], // PUNCH KICK
        13: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], // 808 SUB BOOM
        14: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,0,0], // CLOSED HAT
        15: [0,0,0,0, 0,0,0,2, 0,0,0,0, 0,0,3,4]  // HAT ROLL 1/32
      },
      synthMelody: [
        { step: 0, midi: 48, len: 2 },
        { step: 3, midi: 51, len: 2 },
        { step: 6, midi: 55, len: 2 },
        { step: 8, midi: 48, len: 2 },
        { step: 11, midi: 53, len: 2 },
        { step: 14, midi: 55, len: 2 }
      ]
    },
    {
      id: 'scene_intro',
      name: 'SCENE 2 // VOCAL CHOP & SYNTH INTRO',
      badge: 'INTRO / VERSE',
      steps: {
        0:  [1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        1:  [0,0,0,0, 0,0,1,0, 0,0,0,1, 0,0,0,0],
        2:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,1,0],
        3:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        4:  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        5:  [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        6:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
        7:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
        8:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        9:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        10: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        11: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
        12: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        13: [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        14: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        15: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,2]
      },
      synthMelody: [
        { step: 0, midi: 60, len: 3 },
        { step: 4, midi: 63, len: 3 },
        { step: 8, midi: 67, len: 3 },
        { step: 12, midi: 65, len: 3 }
      ]
    },
    {
      id: 'scene_jersey',
      name: 'SCENE 3 // JERSEY CLUB BOUNCE FLIP',
      badge: 'JERSEY CLUB',
      steps: {
        0:  [1,0,0,0, 1,0,0,0, 1,0,0,1, 0,1,0,0],
        1:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,1,0],
        2:  [0,0,1,0, 0,0,1,0, 0,0,0,0, 0,0,0,2],
        3:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
        4:  [1,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,0,0],
        5:  [0,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0],
        6:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,1,0,0],
        7:  [1,0,0,0, 1,0,0,0, 1,0,0,1, 0,1,0,0],
        8:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        9:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        10: [0,0,1,0, 0,0,1,0, 0,1,0,0, 1,0,1,0], // Jersey Bed Squeak bounce!
        11: [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,1,0],
        // Classic Jersey Club 5-kick triplet pattern: 0, 4, 8, 11, 14
        12: [1,0,0,0, 1,0,0,0, 1,0,0,1, 0,0,1,0],
        13: [1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0],
        14: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        15: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,3]
      },
      synthMelody: [
        { step: 0, midi: 48, len: 2 },
        { step: 4, midi: 48, len: 2 },
        { step: 8, midi: 51, len: 2 },
        { step: 11, midi: 53, len: 2 },
        { step: 14, midi: 55, len: 2 }
      ]
    },
    {
      id: 'scene_buildup',
      name: 'SCENE 4 // HYPER TRAP RISER BUILD-UP',
      badge: 'BUILD-UP',
      steps: {
        0:  [1,0,1,0, 1,0,1,0, 1,1,1,1, 2,2,2,2],
        1:  [0,0,0,0, 0,0,0,0, 1,0,1,0, 1,1,1,1],
        2:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,1,2,3],
        3:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 1,0,1,1],
        4:  [1,0,0,0, 1,0,0,0, 1,0,1,0, 1,1,1,1],
        5:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        6:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,1,0],
        7:  [1,0,0,0, 1,0,0,0, 1,0,1,0, 1,1,1,1],
        8:  [1,0,0,0, 1,0,0,0, 1,0,1,0, 1,1,2,3], // Snare build-up roll!
        9:  [0,0,0,0, 1,0,0,0, 1,0,1,0, 1,1,1,1],
        10: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        11: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        12: [1,0,0,0, 1,0,0,0, 1,0,1,0, 1,1,1,1],
        13: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        14: [1,1,1,1, 1,1,1,1, 1,1,1,1, 0,0,0,0],
        15: [0,0,0,0, 0,0,0,0, 2,2,2,2, 3,3,4,4]
      },
      synthMelody: []
    },
    {
      id: 'scene_blank',
      name: 'SCENE 5 // EMPTY CANVAS (직접 비트 찍기)',
      badge: 'FREESTYLE',
      steps: {
        0:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        1:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        2:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        3:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        4:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        5:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        6:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        7:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        8:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        9:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        10: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        11: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        12: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        13: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        14: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        15: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]
      },
      synthMelody: []
    }
  ]
};
