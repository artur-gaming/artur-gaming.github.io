// Web Audio API procedural sound system for WWII 3D Flight Combat
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.engineGain = null;
    this.isMuted = false;
    this.initialized = false;

    // Engine sound nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineOsc3 = null;
    this.engineFilter = null;
    this.propellerNoise = null;
    this.propellerFilter = null;
    this.propellerGain = null;

    // Siren node
    this.sirenOsc = null;
    this.sirenGain = null;

    // Alarm
    this.alarmOsc = null;
    this.alarmGain = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Engine bus
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.initEngineSound();
      this.initSiren();
      this.initNoiseBuffers();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  initNoiseBuffers() {
    if (!this.ctx) return;
    // Pre-allocate gunshot noise buffer once
    const gunSize = Math.floor(this.ctx.sampleRate * 0.1);
    this.gunNoiseBuffer = this.ctx.createBuffer(1, gunSize, this.ctx.sampleRate);
    const gunData = this.gunNoiseBuffer.getChannelData(0);
    for (let i = 0; i < gunSize; i++) {
      gunData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (gunSize * 0.25));
    }

    // Pre-allocate explosion noise buffer once
    const expSize = Math.floor(this.ctx.sampleRate * 1.4);
    this.explosionNoiseBuffer = this.ctx.createBuffer(1, expSize, this.ctx.sampleRate);
    const expData = this.explosionNoiseBuffer.getChannelData(0);
    for (let i = 0; i < expSize; i++) {
      expData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / expSize, 1.8);
    }
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initEngineSound() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Rolls-Royce Merlin V12 synthesis:
    // Fundamental cylinder firing rate: ~55Hz (idle) to ~140Hz (full throttle)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(55, now);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(110, now);

    this.engineOsc3 = this.ctx.createOscillator();
    this.engineOsc3.type = 'sawtooth';
    this.engineOsc3.frequency.setValueAtTime(27.5, now); // Deep sub rumble

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(350, now);
    this.engineFilter.Q.setValueAtTime(2.5, now);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineOsc3.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineOsc3.start();

    // Propeller airflow noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.propellerNoise = this.ctx.createBufferSource();
    this.propellerNoise.buffer = noiseBuffer;
    this.propellerNoise.loop = true;

    this.propellerFilter = this.ctx.createBiquadFilter();
    this.propellerFilter.type = 'bandpass';
    this.propellerFilter.frequency.setValueAtTime(200, now);
    this.propellerFilter.Q.setValueAtTime(1.0, now);

    this.propellerGain = this.ctx.createGain();
    this.propellerGain.gain.setValueAtTime(0.08, now);

    this.propellerNoise.connect(this.propellerFilter);
    this.propellerFilter.connect(this.propellerGain);
    this.propellerGain.connect(this.engineGain);
    this.propellerNoise.start();
  }

  updateEngine(throttle, isBoosting) {
    if (!this.initialized || !this.engineOsc1 || this.isMuted) return;
    const now = this.ctx.currentTime;
    const t = Math.max(0, Math.min(1, throttle));

    // Base pitch depends on throttle
    let baseFreq = 50 + t * 65;
    if (isBoosting) baseFreq += 25;

    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.02, now, 0.08);
    this.engineOsc3.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);

    const filterFreq = 260 + t * 450 + (isBoosting ? 250 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.1);

    const volume = 0.25 + t * 0.25 + (isBoosting ? 0.15 : 0);
    this.engineGain.gain.setTargetAtTime(volume, now, 0.1);

    if (this.propellerFilter) {
      this.propellerFilter.frequency.setTargetAtTime(150 + t * 300, now, 0.1);
      this.propellerGain.gain.setTargetAtTime(0.04 + t * 0.1, now, 0.1);
    }
  }

  stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }

  initSiren() {
    if (!this.ctx) return;
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'sawtooth';
    this.sirenOsc.frequency.setValueAtTime(600, this.ctx.currentTime);

    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0, this.ctx.currentTime);

    const sirenFilter = this.ctx.createBiquadFilter();
    sirenFilter.type = 'bandpass';
    sirenFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    sirenFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.sirenOsc.connect(sirenFilter);
    sirenFilter.connect(this.sirenGain);
    this.sirenGain.connect(this.sfxGain);
    this.sirenOsc.start();
  }

  playStukaSiren(intensity) {
    if (!this.initialized || !this.sirenGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, intensity));
    const freq = 450 + clamped * 550;
    this.sirenOsc.frequency.setTargetAtTime(freq, now, 0.15);
    this.sirenGain.gain.setTargetAtTime(clamped * 0.35, now, 0.15);
  }

  stopStukaSiren() {
    if (this.sirenGain && this.ctx) {
      this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }

  playGunfire(isHispanoCannon = false) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Shot click & mechanical transient
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = isHispanoCannon ? 'sawtooth' : 'triangle';

    const startFreq = isHispanoCannon ? 260 : 180;
    osc.frequency.setValueAtTime(startFreq + (Math.random() * 20 - 10), now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    oscGain.gain.setValueAtTime(isHispanoCannon ? 0.6 : 0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);

    // Gunshot noise burst (reusing pre-allocated buffer)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.gunNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isHispanoCannon ? 600 : 1200, now);
    filter.Q.setValueAtTime(1.8, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isHispanoCannon ? 0.7 : 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noiseSource.start(now);
  }

  playHitSound() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Metallic ding / ricochet
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const pitch = 1400 + Math.random() * 600;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playExplosion(isLarge = false) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = isLarge ? 1.6 : 1.0;

    // Sub rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isLarge ? 90 : 120, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + duration * 0.6);

    subGain.gain.setValueAtTime(0.8, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + duration);

    // Fiery noise blast (reusing pre-allocated buffer)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.explosionNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + duration * 0.8);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isLarge ? 0.9 : 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noiseSource.start(now);
  }

  playRadioChatter() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Radio click / squelch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1200, now + 0.04);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playVictoryBeep() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.3, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.4);
    });
  }

  playBombDrop() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Characteristic falling bomb whistle (descending sine pitch)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 1.1);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  playMissileLaunch() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Rocket booster motor roar (filtered noise burst)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.22));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.4);
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noiseSource.start(now);

    // Rocket whoosh tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

    oscGain.gain.setValueAtTime(0.18, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playMissileLock() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // High-pitched lock-on tone beep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1350, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playUpgradeSound() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.25, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.25);
    });
  }

  playNukeSiren() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Fast oscillating nuclear / air raid siren
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.4);
    osc.frequency.linearRampToValueAtTime(440, now + 0.8);
    osc.frequency.linearRampToValueAtTime(880, now + 1.2);
    osc.frequency.linearRampToValueAtTime(350, now + 1.6);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.85);
  }

  playNuclearDetonation() {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Deep infrasound sub-bass shockwave rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(22, now + 2.5);

    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 3.3);

    // 2. High-power explosive noise burst with long sweeping resonance
    const node = this.ctx.createBufferSource();
    node.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(75, now + 3.0);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    node.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    node.start(now);
    node.stop(now + 3.5);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

window.soundSystem = new SoundSystem();
