// ============================================================================
// NEON PULSE // MAIN CONTROLLER, KEYBOARD LAUNCHPAD, SEQUENCER & VISUALIZER
// ============================================================================

(function () {
  const PRESETS = window.NEON_PRESETS;
  const audio = new window.NeonAudioEngine();

  // Application State
  let currentKitId = 'neon_aynn';
  let currentKit = PRESETS.kits[currentKitId];
  let currentSceneIdx = 0;
  let bpm = currentKit.bpm || 130;

  let isPlaying = false;
  let overdubEnabled = true;
  let currentStep = 0;
  let barCount = 1;
  let selectedPadIndex = 12; // Default selected track: Punch Kick
  let stepTimer = null;

  // Deep clone 16x16 step matrix for active pattern
  // Values: 0 = off, 1 = normal hit, 2 = 2x roll, 3 = 3x roll, 4 = 4x trap roll
  let patternSteps = {};
  let synthMelody = [];

  // Keyboard & FX Hold State
  const heldPadCodes = new Map(); // code -> intervalId (for Shift+Hold auto-roll)
  const heldSynthCodes = new Set();
  const activeFXIds = new Set();
  let stutterAnchorStep = 0;

  // DOM Elements
  const padMatrixEl = document.getElementById('padMatrix');
  const sequencerGridEl = document.getElementById('sequencerGrid');
  const synthKeyboardEl = document.getElementById('synthKeyboard');
  const sceneButtonsEl = document.getElementById('sceneButtonsContainer');
  const fxButtonsEl = document.getElementById('fxButtonsContainer');
  const mixerGridEl = document.getElementById('mixerGrid');
  const serumPatchSelectEl = document.getElementById('serumPatchSelect');
  const kitSelectEl = document.getElementById('kitSelect');

  const btnPlay = document.getElementById('btnPlay');
  const playIcon = document.getElementById('playIcon');
  const playText = document.getElementById('playText');
  const btnOverdub = document.getElementById('btnOverdub');
  const overdubState = document.getElementById('overdubState');
  const btnClearScene = document.getElementById('btnClearScene');
  const bpmSlider = document.getElementById('bpmSlider');
  const bpmValue = document.getElementById('bpmValue');
  const stepCounter = document.getElementById('stepCounter');

  // --- INITIALIZATION ---
  function initApp() {
    loadScene(0);
    renderSceneButtons();
    renderFXButtons();
    renderPadMatrix();
    renderSequencerGrid();
    renderSynthKeyboard();
    renderSerumPatchSelector();
    renderMixer();
    bindTopControls();
    bindSerumKnobs();
    bindXYPad();
    bindSampleDropzone();
    bindKeyboardEvents();
    startVisualizers();
  }

  function loadScene(sceneIdx) {
    currentSceneIdx = sceneIdx;
    const scene = PRESETS.scenes[sceneIdx] || PRESETS.scenes[0];
    patternSteps = {};
    for (let i = 0; i < 16; i++) {
      patternSteps[i] = scene.steps[i] ? [...scene.steps[i]] : new Array(16).fill(0);
    }
    synthMelody = scene.synthMelody ? JSON.parse(JSON.stringify(scene.synthMelody)) : [];
    renderSceneButtons();
    renderSequencerGrid();
  }

  // --- RENDER UI COMPONENTS ---
  function renderSceneButtons() {
    sceneButtonsEl.innerHTML = '';
    PRESETS.scenes.forEach((sc, idx) => {
      const btn = document.createElement('button');
      btn.className = 'scene-btn' + (idx === currentSceneIdx ? ' active' : '');
      btn.innerHTML = `<span>${sc.name}</span><span class="scene-badge">${sc.badge}</span>`;
      btn.addEventListener('click', () => {
        loadScene(idx);
      });
      sceneButtonsEl.appendChild(btn);
    });
  }

  function renderFXButtons() {
    fxButtonsEl.innerHTML = '';
    PRESETS.fxKeys.forEach(fx => {
      const btn = document.createElement('button');
      btn.className = 'fx-pad-btn';
      btn.id = 'fx_btn_' + fx.id;
      btn.title = fx.sub;
      btn.innerHTML = `<span class="kbd-tag">[${fx.key}]</span><span>${fx.name}</span>`;

      const startFX = (e) => {
        e.preventDefault();
        activatePerformanceFX(fx.id, true);
      };
      const stopFX = (e) => {
        e.preventDefault();
        activatePerformanceFX(fx.id, false);
      };
      btn.addEventListener('mousedown', startFX);
      btn.addEventListener('mouseup', stopFX);
      btn.addEventListener('mouseleave', stopFX);
      btn.addEventListener('touchstart', startFX, { passive: false });
      btn.addEventListener('touchend', stopFX);

      fxButtonsEl.appendChild(btn);
    });
  }

  function renderPadMatrix() {
    padMatrixEl.innerHTML = '';
    PRESETS.padKeys.forEach((pk, idx) => {
      const padDef = currentKit.pads[idx];
      const padEl = document.createElement('div');
      padEl.className = 'vel-pad' + (idx === selectedPadIndex ? ' selected-pad' : '');
      padEl.id = 'vel_pad_' + idx;
      padEl.style.setProperty('--pad-color', padDef.color || '#00f0ff');

      padEl.innerHTML = `
        <div class="pad-top-row">
          <span class="pad-key-badge">${pk.key}</span>
          <span class="pad-cat-dot"></span>
        </div>
        <div class="pad-bottom-info">
          <div class="pad-name">${padDef.name}</div>
          <div class="pad-sub">${padDef.sub}</div>
        </div>
      `;

      const triggerFromMouse = (e) => {
        e.preventDefault();
        const isRoll = e.shiftKey || e.button === 2;
        handlePadHit(idx, 1.0, true, isRoll);
      };
      padEl.addEventListener('mousedown', triggerFromMouse);
      padEl.addEventListener('contextmenu', e => e.preventDefault());
      padEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handlePadHit(idx, 1.0, true, false);
      }, { passive: false });

      padMatrixEl.appendChild(padEl);
    });
  }

  function renderSequencerGrid() {
    sequencerGridEl.innerHTML = '';
    // Render in logical group order: Row 4 (Kicks/Hats) -> Row 3 (Snares) -> Row 2 (Bass) -> Row 1 (Vocal Chops)
    // Or keep 0..15 matching pad index so top-to-bottom matches Row 1..Row 4!
    for (let i = 0; i < 16; i++) {
      const pk = PRESETS.padKeys[i];
      const padDef = currentKit.pads[i];
      const rowEl = document.createElement('div');
      rowEl.className = 'seq-row' + (i === selectedPadIndex ? ' active-row' : '');
      rowEl.id = 'seq_row_' + i;
      rowEl.style.setProperty('--row-color', padDef.color || '#00f0ff');

      const infoEl = document.createElement('div');
      infoEl.className = 'seq-track-info';
      infoEl.innerHTML = `
        <span class="seq-key-pill" style="border-color:${padDef.color}">${pk.key}</span>
        <span class="seq-track-name" style="color:${padDef.color}">${padDef.name}</span>
      `;
      infoEl.addEventListener('click', () => {
        selectPadTrack(i);
        handlePadHit(i, 0.95, false, false);
      });

      const stepsContainer = document.createElement('div');
      stepsContainer.className = 'seq-steps';

      for (let s = 0; s < 16; s++) {
        const val = patternSteps[i][s] || 0;
        const stepBtn = document.createElement('div');
        stepBtn.className = 'seq-step' + (val > 0 ? ' on' : '') + (isPlaying && s === currentStep ? ' playhead' : '');
        stepBtn.id = `step_${i}_${s}`;
        stepBtn.textContent = val > 1 ? `${val}x` : '';

        // Left-click: toggle on/off (or if Shift held, cycle ratchet roll 2x/3x/4x)
        stepBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (e.button === 2 || e.shiftKey) {
            // Cycle roll: 0 -> 2x -> 3x -> 4x -> 1x
            const nextRoll = val === 0 ? 2 : (val >= 4 ? 1 : val + 1);
            patternSteps[i][s] = nextRoll;
          } else {
            patternSteps[i][s] = val > 0 ? 0 : 1;
          }
          updateSingleStepDOM(i, s);
          if (patternSteps[i][s] > 0 && !isPlaying) {
            handlePadHit(i, 0.9, false, patternSteps[i][s] > 1);
          }
        });
        stepBtn.addEventListener('contextmenu', e => e.preventDefault());

        stepsContainer.appendChild(stepBtn);
      }

      rowEl.appendChild(infoEl);
      rowEl.appendChild(stepsContainer);
      sequencerGridEl.appendChild(rowEl);
    }
  }

  function updateSingleStepDOM(padIdx, stepIdx) {
    const el = document.getElementById(`step_${padIdx}_${stepIdx}`);
    if (!el) return;
    const val = patternSteps[padIdx][stepIdx] || 0;
    el.classList.toggle('on', val > 0);
    el.textContent = val > 1 ? `${val}x` : '';
  }

  function selectPadTrack(padIdx) {
    selectedPadIndex = padIdx;
    document.querySelectorAll('.vel-pad').forEach((el, idx) => {
      el.classList.toggle('selected-pad', idx === padIdx);
    });
    document.querySelectorAll('.seq-row').forEach((el, idx) => {
      el.classList.toggle('active-row', idx === padIdx);
    });
  }

  function renderSynthKeyboard() {
    synthKeyboardEl.innerHTML = '';
    PRESETS.synthKeys.forEach(sk => {
      const keyEl = document.createElement('div');
      keyEl.className = 'synth-key ' + (sk.isBlack ? 'black-key' : 'white-key');
      keyEl.id = 'synth_key_' + sk.code;
      keyEl.innerHTML = `
        <span class="k-char">[${sk.key}]</span>
        <span class="k-note">${sk.label}</span>
      `;

      const startNote = (e) => {
        e.preventDefault();
        triggerSynthKeyOn(sk);
      };
      const endNote = (e) => {
        e.preventDefault();
        triggerSynthKeyOff(sk);
      };
      keyEl.addEventListener('mousedown', startNote);
      keyEl.addEventListener('mouseup', endNote);
      keyEl.addEventListener('mouseleave', endNote);
      keyEl.addEventListener('touchstart', startNote, { passive: false });
      keyEl.addEventListener('touchend', endNote);

      synthKeyboardEl.appendChild(keyEl);
    });
  }

  function renderSerumPatchSelector() {
    serumPatchSelectEl.innerHTML = '';
    PRESETS.serumPatches.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = p.name;
      serumPatchSelectEl.appendChild(opt);
    });

    serumPatchSelectEl.addEventListener('change', (e) => {
      const patch = PRESETS.serumPatches[Number(e.target.value)];
      if (patch) {
        audio.loadSerumPatch(patch);
        syncKnobsFromPatch(patch);
        document.getElementById('oscTitleText').textContent = `OSC A+B // ${patch.name.split(' ')[0]}`;
      }
    });
  }

  function renderMixer() {
    const channels = [
      { id: 'kick', label: 'KICK', fKey: 'F1', vol: 0.95 },
      { id: 'drums', label: 'DRUMS', fKey: 'F2', vol: 0.88 },
      { id: 'bass', label: 'BASS', fKey: 'F3', vol: 0.90 },
      { id: 'vocal', label: 'VOCAL', fKey: 'F4', vol: 0.88 },
      { id: 'synth', label: 'SYNTH', fKey: 'F5', vol: 0.85 },
      { id: 'master', label: 'MASTER', fKey: 'F6', vol: 0.90 }
    ];

    mixerGridEl.innerHTML = '';
    channels.forEach(ch => {
      const strip = document.createElement('div');
      strip.className = 'mixer-strip';
      strip.innerHTML = `
        <span class="strip-label">${ch.label}</span>
        <div class="fader-track">
          <div class="led-meter-fill" id="meter_${ch.id}"></div>
          <input type="range" class="vert-fader" id="fader_${ch.id}" min="0" max="1.15" step="0.02" value="${ch.vol}" />
        </div>
        ${ch.id !== 'master'
          ? `<button class="mute-btn" id="mute_${ch.id}" title="단축키: ${ch.fKey}">MUTE (${ch.fKey})</button>`
          : `<span class="strip-label" style="color:#00ff9d;">LIMITER</span>`
        }
      `;
      mixerGridEl.appendChild(strip);

      const fader = strip.querySelector(`#fader_${ch.id}`);
      fader.addEventListener('input', (e) => {
        audio.setChannelVolume(ch.id, parseFloat(e.target.value));
      });

      const muteBtn = strip.querySelector(`#mute_${ch.id}`);
      if (muteBtn) {
        muteBtn.addEventListener('click', () => {
          toggleStemMuteUI(ch.id);
        });
      }
    });
  }

  function toggleStemMuteUI(chId) {
    const isMuted = audio.toggleChannelMute(chId);
    const btn = document.getElementById('mute_' + chId);
    if (btn) {
      btn.classList.toggle('muted', isMuted);
      btn.textContent = isMuted ? 'MUTED' : `MUTE`;
    }
  }

  // --- PAD HIT & LIVE OVERDUB LOGIC ---
  function handlePadHit(padIndex, velocity = 1.0, recordIfOverdub = true, isRoll = false) {
    const padDef = currentKit.pads[padIndex];
    if (!padDef) return;

    selectPadTrack(padIndex);

    if (isRoll) {
      // Trigger a rapid 3x/4x ratchet trap roll right now!
      const stepSec = (60 / bpm) / 4;
      for (let r = 0; r < 3; r++) {
        audio.triggerPad(padIndex, padDef, velocity * (1 - r * 0.15), r * (stepSec / 3));
      }
    } else {
      audio.triggerPad(padIndex, padDef, velocity, 0);
    }

    // Flash visual silicone pad
    const padEl = document.getElementById('vel_pad_' + padIndex);
    if (padEl) {
      padEl.classList.add('triggered');
      clearTimeout(padEl._flashTimer);
      padEl._flashTimer = setTimeout(() => {
        padEl.classList.remove('triggered');
      }, 115);
    }

    // If Sequencer is playing and LIVE OVERDUB is enabled, stamp onto current step!
    if (isPlaying && overdubEnabled && recordIfOverdub) {
      patternSteps[padIndex][currentStep] = isRoll ? 3 : 1;
      updateSingleStepDOM(padIndex, currentStep);
    }
  }

  function triggerSynthKeyOn(sk) {
    audio.noteOnSynth(sk.code, sk.midi, 0.92);
    const el = document.getElementById('synth_key_' + sk.code);
    if (el) el.classList.add('active');

    // Also record into synthMelody if overdubbing while playing
    if (isPlaying && overdubEnabled) {
      synthMelody = synthMelody.filter(n => n.step !== currentStep);
      synthMelody.push({ step: currentStep, midi: sk.midi, len: 2 });
    }
  }

  function triggerSynthKeyOff(sk) {
    audio.noteOffSynth(sk.code);
    const el = document.getElementById('synth_key_' + sk.code);
    if (el) el.classList.remove('active');
  }

  // --- SEQUENCER ENGINE (16 STEPS + RATCHET ROLLS + STUTTER FX) ---
  function togglePlay() {
    audio.init();
    isPlaying = !isPlaying;
    if (isPlaying) {
      currentStep = 0;
      barCount = 1;
      playIcon.textContent = '⏹';
      playText.textContent = 'STOP BEAT (Space)';
      btnPlay.classList.add('active-play');
      scheduleNextStep();
    } else {
      clearTimeout(stepTimer);
      playIcon.textContent = '▶';
      playText.textContent = 'PLAY BEAT (Space)';
      btnPlay.classList.remove('active-play');
      document.querySelectorAll('.seq-step.playhead').forEach(el => el.classList.remove('playhead'));
    }
  }

  function scheduleNextStep() {
    if (!isPlaying) return;

    // Handle Stutter / Beat-Repeat FX (Keys 5 & 6)
    let effectiveStep = currentStep;
    if (activeFXIds.has('stutter8')) {
      effectiveStep = stutterAnchorStep + (currentStep % 2);
    } else if (activeFXIds.has('stutter16')) {
      effectiveStep = stutterAnchorStep;
    }
    effectiveStep = effectiveStep % 16;

    // Update LCD counter
    stepCounter.textContent = `${String(barCount).padStart(2, '0')} : ${String(effectiveStep + 1).padStart(2, '0')}`;

    // Highlight playhead column
    document.querySelectorAll('.seq-step.playhead').forEach(el => el.classList.remove('playhead'));
    for (let i = 0; i < 16; i++) {
      const cell = document.getElementById(`step_${i}_${effectiveStep}`);
      if (cell) cell.classList.add('playhead');
    }

    const baseStepDurationSec = (60 / bpm) / 4; // 16th note duration
    const tapeSlowdown = activeFXIds.has('tapestop') ? 1.85 : 1.0;
    const stepDurationSec = baseStepDurationSec * tapeSlowdown;

    // Trigger all active pads on this step
    for (let padIdx = 0; padIdx < 16; padIdx++) {
      const val = patternSteps[padIdx][effectiveStep] || 0;
      if (val > 0) {
        const padDef = currentKit.pads[padIdx];
        if (val === 1) {
          audio.triggerPad(padIdx, padDef, 0.9, 0);
        } else {
          // Ratchet Roll (2x, 3x, 4x subdivisions within a single 16th step!)
          const subDur = stepDurationSec / val;
          for (let r = 0; r < val; r++) {
            audio.triggerPad(padIdx, padDef, 0.9 * (1 - r * 0.14), r * subDur);
          }
        }

        // Subtle pad flash on sequenced hit
        const padEl = document.getElementById('vel_pad_' + padIdx);
        if (padEl) {
          padEl.classList.add('triggered');
          clearTimeout(padEl._flashTimer);
          padEl._flashTimer = setTimeout(() => padEl.classList.remove('triggered'), 85);
        }
      }
    }

    // Trigger sequenced Serum 2 Synth notes if any on this step
    if (synthMelody && synthMelody.length > 0) {
      synthMelody.forEach(noteObj => {
        if (noteObj.step === effectiveStep) {
          audio.playSynthNoteTimed(noteObj.midi, stepDurationSec * (noteObj.len || 1.8), 0.78);
        }
      });
    }

    // Advance step
    currentStep = (currentStep + 1) % 16;
    if (currentStep === 0) barCount++;

    stepTimer = setTimeout(scheduleNextStep, stepDurationSec * 1000);
  }

  // --- PERFORMANCE DJ FX ACTIVATION (KEYS 5 ~ 0) ---
  function activatePerformanceFX(fxId, isActive) {
    audio.init();
    const btn = document.getElementById('fx_btn_' + fxId);
    if (btn) btn.classList.toggle('active', isActive);

    if (isActive) {
      if (!activeFXIds.has(fxId)) {
        activeFXIds.add(fxId);
        stutterAnchorStep = currentStep;
      }
    } else {
      activeFXIds.delete(fxId);
    }

    if (fxId === 'lowpass') {
      audio.setDJFilter(isActive ? 0.14 : 0.5, isActive ? 0.8 : 0);
      updateXYPuckUI(isActive ? 0.14 : 0.5, isActive ? 0.2 : 0.5);
    } else if (fxId === 'highpass') {
      audio.setDJFilter(isActive ? 0.86 : 0.5, isActive ? 0.8 : 0);
      updateXYPuckUI(isActive ? 0.86 : 0.5, isActive ? 0.2 : 0.5);
    } else if (fxId === 'crush') {
      audio.setBitcrush(isActive);
    } else if (fxId === 'stutter16' && isActive && !isPlaying) {
      // If not playing, stutter repeats the currently selected pad!
      handlePadHit(selectedPadIndex, 1.0, false, true);
    }
  }

  // --- KEYBOARD EVENT LISTENER (FULL N-KEY ROLLOVER) ---
  function bindKeyboardEvents() {
    const padByCode = new Map();
    PRESETS.padKeys.forEach(pk => padByCode.set(pk.code, pk.index));

    const synthByCode = new Map();
    PRESETS.synthKeys.forEach(sk => synthByCode.set(sk.code, sk));

    const fxByCode = new Map();
    PRESETS.fxKeys.forEach(fk => fxByCode.set(fk.code, fk.id));

    const fKeyToChannel = {
      F1: 'kick', F2: 'drums', F3: 'bass', F4: 'vocal', F5: 'synth', F6: 'fx'
    };

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      // Space: Play / Stop
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Tab: Toggle Live Overdub Recording
      if (e.code === 'Tab') {
        e.preventDefault();
        toggleOverdub();
        return;
      }

      // Backspace: Clear Scene
      if (e.code === 'Backspace') {
        e.preventDefault();
        clearCurrentPattern();
        return;
      }

      // F1~F6: Stem Mutes
      if (fKeyToChannel[e.code]) {
        e.preventDefault();
        toggleStemMuteUI(fKeyToChannel[e.code]);
        return;
      }

      // Ignore key auto-repeat for pads & synths
      if (e.repeat) return;

      // 1) Check 4x4 Launchpad Keys (1234 / QWER / ASDF / ZXCV)
      if (padByCode.has(e.code)) {
        e.preventDefault();
        const padIdx = padByCode.get(e.code);
        const isRollHold = e.shiftKey;
        handlePadHit(padIdx, 1.0, true, isRollHold);

        if (isRollHold && !heldPadCodes.has(e.code)) {
          const rollInterval = ((60 / bpm) / 4) * 500; // 32nd-note repeat while held
          const timerId = setInterval(() => {
            handlePadHit(padIdx, 0.88, true, false);
          }, rollInterval);
          heldPadCodes.set(e.code, timerId);
        }
        return;
      }

      // 2) Check Right-Hand Serum 2 Synth Keys
      if (synthByCode.has(e.code)) {
        e.preventDefault();
        const sk = synthByCode.get(e.code);
        heldSynthCodes.add(e.code);
        triggerSynthKeyOn(sk);
        return;
      }

      // 3) Check DJ Performance FX Keys (5, 6, 7, 8, 9, 0)
      if (fxByCode.has(e.code)) {
        e.preventDefault();
        activatePerformanceFX(fxByCode.get(e.code), true);
        return;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (heldPadCodes.has(e.code)) {
        clearInterval(heldPadCodes.get(e.code));
        heldPadCodes.delete(e.code);
      }

      if (synthByCode.has(e.code)) {
        heldSynthCodes.delete(e.code);
        triggerSynthKeyOff(synthByCode.get(e.code));
      }

      if (fxByCode.has(e.code)) {
        activatePerformanceFX(fxByCode.get(e.code), false);
      }
    });
  }

  // --- TOP CONTROLS, SERUM KNOBS, XY PAD & SAMPLE DROPZONE ---
  function toggleOverdub() {
    overdubEnabled = !overdubEnabled;
    btnOverdub.classList.toggle('active-rec', overdubEnabled);
    overdubState.textContent = overdubEnabled ? 'ON' : 'OFF';
  }

  function clearCurrentPattern() {
    for (let i = 0; i < 16; i++) {
      patternSteps[i].fill(0);
    }
    synthMelody = [];
    renderSequencerGrid();
  }

  function bindTopControls() {
    btnPlay.addEventListener('click', togglePlay);
    btnOverdub.addEventListener('click', toggleOverdub);
    btnClearScene.addEventListener('click', clearCurrentPattern);

    bpmSlider.addEventListener('input', (e) => {
      bpm = parseInt(e.target.value, 10);
      bpmValue.textContent = bpm;
    });

    kitSelectEl.addEventListener('change', (e) => {
      currentKitId = e.target.value;
      currentKit = PRESETS.kits[currentKitId];
      bpm = currentKit.bpm;
      bpmSlider.value = bpm;
      bpmValue.textContent = bpm;
      renderPadMatrix();
      renderSequencerGrid();
    });

    // Random AI Remix Pattern Generator
    document.getElementById('btnRandomBeat').addEventListener('click', () => {
      audio.init();
      for (let i = 0; i < 16; i++) patternSteps[i].fill(0);
      // Kick (12) & 808 (13)
      [0, 6, 8, 11, 14].forEach(s => {
        if (Math.random() > 0.2) patternSteps[12][s] = 1;
      });
      patternSteps[13][0] = 1;
      patternSteps[13][8] = 1;
      // Snare (8) & Clap (9)
      patternSteps[8][4] = 1;
      patternSteps[8][12] = 1;
      patternSteps[9][4] = 1;
      patternSteps[9][12] = 1;
      // Hi-hats (14) & Hat Rolls (15)
      for (let s = 0; s < 16; s += 2) patternSteps[14][s] = 1;
      patternSteps[15][7] = 2;
      patternSteps[15][15] = 4;
      // Serum Splash Bass (4, 5, 6) & Chops (0, 1, 2)
      for (let s = 0; s < 16; s++) {
        if (Math.random() < 0.22) patternSteps[4 + (s % 3)][s] = 1;
        if (Math.random() < 0.16) patternSteps[s % 3][s] = 1;
      }
      renderSequencerGrid();
      if (!isPlaying) togglePlay();
    });

    // YouTube Deck Toggle
    const ytDeck = document.getElementById('ytDeck');
    const btnToggleYT = document.getElementById('btnToggleYT');
    btnToggleYT.addEventListener('click', () => {
      const isOpen = ytDeck.classList.toggle('open');
      btnToggleYT.classList.toggle('yt-active', isOpen);
    });

    // Master Recorder Button
    const btnMasterRec = document.getElementById('btnMasterRec');
    btnMasterRec.addEventListener('click', () => {
      if (!audio.isRecordingMaster) {
        const started = audio.startMasterRecord();
        if (started) {
          btnMasterRec.textContent = '⏹ 녹음 중지 및 파일 저장';
          btnMasterRec.style.borderColor = '#ff2a54';
          btnMasterRec.style.color = '#ff6b88';
        }
      } else {
        audio.stopMasterRecord((url) => {
          btnMasterRec.textContent = '🎙️ 내 리믹스 녹음 (.WEBM/.WAV)';
          btnMasterRec.style.borderColor = '';
          btnMasterRec.style.color = '';
          const a = document.createElement('a');
          a.href = url;
          a.download = `NEON_Launchpad_Remix_${Date.now()}.webm`;
          a.click();
        });
      }
    });
  }

  function bindSerumKnobs() {
    const knobCutoff = document.getElementById('knobCutoff');
    const knobReso = document.getElementById('knobReso');
    const knobLfoRate = document.getElementById('knobLfoRate');
    const knobLfoDepth = document.getElementById('knobLfoDepth');
    const knobDrive = document.getElementById('knobDrive');
    const knobOctave = document.getElementById('knobOctave');

    knobCutoff.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      audio.updateSerumParam('cutoff', v);
      document.getElementById('valCutoff').textContent = `${Math.round(v)} Hz`;
    });
    knobReso.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      audio.updateSerumParam('resonance', v);
      document.getElementById('valReso').textContent = `${v} Q`;
    });
    knobLfoRate.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      audio.updateSerumParam('lfoRate', v);
      document.getElementById('valLfoRate').textContent = `${v} Hz`;
      document.getElementById('lfoHzReadout').textContent = `${v} Hz`;
    });
    knobLfoDepth.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      audio.updateSerumParam('lfoDepth', v);
      document.getElementById('valLfoDepth').textContent = `${Math.round(v)}`;
    });
    knobDrive.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      audio.updateSerumParam('drive', v);
      document.getElementById('valDrive').textContent = `${Math.round(v * 100)}%`;
    });
    knobOctave.addEventListener('input', e => {
      const v = parseInt(e.target.value, 10);
      audio.updateSerumParam('octaveOffset', v);
      document.getElementById('valOctave').textContent = `${v >= 0 ? '+' + v : v} OCT`;
    });
  }

  function syncKnobsFromPatch(p) {
    document.getElementById('knobCutoff').value = p.cutoff;
    document.getElementById('valCutoff').textContent = `${p.cutoff} Hz`;
    document.getElementById('knobReso').value = p.resonance;
    document.getElementById('valReso').textContent = `${p.resonance} Q`;
    document.getElementById('knobLfoRate').value = p.lfoRate;
    document.getElementById('valLfoRate').textContent = `${p.lfoRate} Hz`;
    document.getElementById('lfoHzReadout').textContent = `${p.lfoRate} Hz`;
    document.getElementById('knobLfoDepth').value = p.lfoDepth;
    document.getElementById('valLfoDepth').textContent = `${p.lfoDepth}`;
    document.getElementById('knobDrive').value = p.drive;
    document.getElementById('valDrive').textContent = `${Math.round(p.drive * 100)}%`;
    document.getElementById('knobOctave').value = p.octaveOffset;
    document.getElementById('valOctave').textContent = `${p.octaveOffset} OCT`;
  }

  // --- XY DJ FILTER PAD ---
  function bindXYPad() {
    const xyPad = document.getElementById('xyPad');
    let isDragging = false;

    const handleMove = (clientX, clientY) => {
      const rect = xyPad.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      audio.init();
      audio.setDJFilter(nx, 1.0 - ny);
      updateXYPuckUI(nx, ny);
    };

    xyPad.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    document.getElementById('btnResetFilter').addEventListener('click', () => {
      audio.setDJFilter(0.5, 0);
      updateXYPuckUI(0.5, 0.5);
    });

    const btnSidechain = document.getElementById('btnSidechainToggle');
    const pumpVal = document.getElementById('pumpVal');
    btnSidechain.addEventListener('click', () => {
      if (audio.sidechainAmount > 0.5) {
        audio.sidechainAmount = 0.0;
        btnSidechain.textContent = '사이드체인 펌핑: OFF';
        btnSidechain.style.color = '#94a3b8';
        pumpVal.textContent = 'OFF';
      } else {
        audio.sidechainAmount = 0.78;
        btnSidechain.textContent = '사이드체인 펌핑: 강함';
        btnSidechain.style.color = '#00ff9d';
        pumpVal.textContent = '78%';
      }
    });
  }

  function updateXYPuckUI(nx, ny) {
    const puck = document.getElementById('xyPuck');
    const readout = document.getElementById('xyReadout');
    puck.style.left = `${nx * 100}%`;
    puck.style.top = `${ny * 100}%`;
    const mode = nx < 0.45 ? 'LOW-PASS' : (nx > 0.55 ? 'HIGH-PASS' : 'BYPASS');
    readout.textContent = `${mode} (${Math.round(nx * 100)}%) · RESO ${Math.round((1 - ny) * 100)}%`;
  }

  // --- MP3/WAV DRAG & DROP AUTO-SLICER (16 PADS) ---
  function bindSampleDropzone() {
    const dropzone = document.getElementById('sampleDropzone');
    const fileInput = document.getElementById('fileInput');
    const statusText = document.getElementById('customSampleStatus');
    const btnResetKit = document.getElementById('btnResetKit');

    dropzone.addEventListener('click', (e) => {
      if (e.target === btnResetKit) return;
      fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await processCustomAudioFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await processCustomAudioFile(e.target.files[0]);
      }
    });

    btnResetKit.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.customAudioBuffer = null;
      currentKit.pads.forEach(p => delete p.customSlice);
      statusText.textContent = '여기에 오디오 파일을 드래그하거나 클릭해 업로드하면 16개 키보드 패드에 자동 분할 매핑됩니다!';
      btnResetKit.style.display = 'none';
      renderPadMatrix();
      renderSequencerGrid();
    });

    async function processCustomAudioFile(file) {
      try {
        statusText.textContent = `⏳ "${file.name}" 디코딩 및 16패드 오토 슬라이스 중...`;
        const slices = await audio.loadCustomAudioFile(file);
        slices.forEach((sl, idx) => {
          currentKit.pads[idx].customSlice = sl;
          currentKit.pads[idx].name = `CHOP #${idx + 1}`;
          currentKit.pads[idx].sub = `${sl.start.toFixed(1)}s ~ ${(sl.start + sl.duration).toFixed(1)}s`;
        });
        statusText.textContent = `✅ "${file.name}" 16패드 오토 슬라이스 완료! 키보드 [1~4/Q~R/A~F/Z~V]로 리믹스하세요!`;
        btnResetKit.style.display = 'inline-block';
        renderPadMatrix();
        renderSequencerGrid();
      } catch (err) {
        statusText.textContent = '❌ 오디오 디코딩 실패: 지원되는 MP3/WAV/OGG 파일을 선택해주세요.';
      }
    }
  }

  // --- 60FPS SERUM 2 3D WAVETABLE + LFO + LED METER VISUALIZERS ---
  function startVisualizers() {
    const wtCanvas = document.getElementById('wavetableCanvas');
    const wtCtx = wtCanvas.getContext('2d');
    const lfoCanvas = document.getElementById('lfoCanvas');
    const lfoCtx = lfoCanvas.getContext('2d');

    const timeData = new Uint8Array(1024);
    const freqData = new Uint8Array(512);
    let phase = 0;

    function drawFrame() {
      requestAnimationFrame(drawFrame);
      phase += 0.04;

      if (audio.isInitialized && audio.analyser) {
        audio.analyser.getByteTimeDomainData(timeData);
        audio.analyser.getByteFrequencyData(freqData);
      }

      // 1) Draw Serum 2 3D Layered Green/Cyan Wavetable + Spectrum
      const w = wtCanvas.width;
      const h = wtCanvas.height;
      wtCtx.fillStyle = '#040811';
      wtCtx.fillRect(0, 0, w, h);

      // Subtle grid
      wtCtx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      wtCtx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 38) {
        wtCtx.beginPath(); wtCtx.moveTo(gx, 0); wtCtx.lineTo(gx, h); wtCtx.stroke();
      }

      // Background FFT Spectrum Bars
      if (audio.isInitialized) {
        for (let i = 0; i < 48; i++) {
          const val = freqData[i * 2] / 255;
          const bh = val * (h * 0.85);
          wtCtx.fillStyle = `rgba(0, 240, 255, ${0.08 + val * 0.22})`;
          wtCtx.fillRect(i * (w / 48), h - bh, (w / 48) - 2, bh);
        }
      }

      // 3D Isometric Wavetable Slices (Exact Serum 2 green/emerald look!)
      const layers = 5;
      for (let layer = 0; layer < layers; layer++) {
        const yOffset = 22 + layer * 16;
        const alpha = 0.25 + (layer / layers) * 0.75;
        wtCtx.beginPath();
        wtCtx.strokeStyle = layer === layers - 1 ? '#00ff9d' : `rgba(0, 255, 157, ${alpha * 0.65})`;
        wtCtx.lineWidth = layer === layers - 1 ? 2.4 : 1.2;

        for (let x = 0; x < w; x += 3) {
          const normX = x / w;
          const audioSample = audio.isInitialized ? ((timeData[Math.floor(normX * 512)] - 128) / 128) : 0;
          const lfoRate = audio.synthParams.lfoRate || 6.5;
          const synthWave = Math.sin(normX * Math.PI * 4 + phase * (0.4 + layer * 0.1)) *
                            Math.cos(normX * Math.PI * lfoRate * 0.5 + phase);
          const y = yOffset + (synthWave * 14) + (audioSample * 24 * (layer / layers));
          if (x === 0) wtCtx.moveTo(x, y);
          else wtCtx.lineTo(x, y);
        }
        wtCtx.stroke();
      }

      // 2) Draw Serum 2 Blue LFO Envelope Curve
      const lw = lfoCanvas.width;
      const lh = lfoCanvas.height;
      lfoCtx.fillStyle = '#040811';
      lfoCtx.fillRect(0, 0, lw, lh);

      const lfoRate = audio.synthParams.lfoRate || 6.5;
      const cycles = Math.max(1, Math.min(6, lfoRate / 2.5));

      lfoCtx.beginPath();
      lfoCtx.moveTo(0, lh - 10);
      for (let x = 0; x <= lw; x += 2) {
        const t = x / lw;
        // Classic Serum shark-fin / sine-saw LFO shape
        const wave = (Math.sin(t * Math.PI * 2 * cycles) * 0.5 + 0.5);
        const y = lh - 14 - wave * (lh - 28);
        lfoCtx.lineTo(x, y);
      }
      lfoCtx.lineTo(lw, lh - 10);
      lfoCtx.closePath();
      lfoCtx.fillStyle = 'rgba(0, 180, 255, 0.22)';
      lfoCtx.fill();

      lfoCtx.strokeStyle = '#00f0ff';
      lfoCtx.lineWidth = 2;
      lfoCtx.stroke();

      // Moving LFO Phase Dot
      const cursorX = ((phase * lfoRate * 0.08) % 1) * lw;
      const cursorWave = (Math.sin((cursorX / lw) * Math.PI * 2 * cycles) * 0.5 + 0.5);
      const cursorY = lh - 14 - cursorWave * (lh - 28);
      lfoCtx.beginPath();
      lfoCtx.arc(cursorX, cursorY, 4.5, 0, Math.PI * 2);
      lfoCtx.fillStyle = '#ffffff';
      lfoCtx.fill();

      // 3) Decay & Update Mixer LED VU Meters
      Object.keys(audio.channelPeaks).forEach(ch => {
        audio.channelPeaks[ch] *= 0.88;
        const meterEl = document.getElementById('meter_' + ch);
        if (meterEl) {
          const isMuted = audio.channelMutes[ch];
          const pct = isMuted ? 0 : Math.min(100, audio.channelPeaks[ch] * 100);
          meterEl.style.height = `${pct}%`;
        }
      });
    }

    requestAnimationFrame(drawFrame);
  }

  initApp();
})();
