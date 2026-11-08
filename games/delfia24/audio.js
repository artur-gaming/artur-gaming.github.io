/**
 * Audio Manager - Web Audio API procedural sound engine
 * Generuje realistyczne efekty morskie (wiatr, fale, łopot żagli, klikanie kabestanów)
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Źródła ciągłe
    this.windNode = null;
    this.windGain = null;
    this.windFilter = null;

    this.waterNode = null;
    this.waterGain = null;

    this.luffNode = null;
    this.luffGain = null;

    this.lastClickTime = 0;
  }

  init() {
    if (this.isInitialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.setupWind();
    this.setupWater();
    this.setupLuffing();
    this.isInitialized = true;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx) {
      if (this.isMuted) {
        this.ctx.suspend();
      } else {
        this.ctx.resume();
      }
    }
    return !this.isMuted;
  }

  // Szum wiatru (różowy szum + filtr dolnoprzepustowy)
  setupWind() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = noiseBuffer;
    this.windNode.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 450;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.08;

    this.windNode.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    this.windNode.start(0);
  }

  // Szum wody opływającej kadłub
  setupWater() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.05;
    }

    this.waterNode = this.ctx.createBufferSource();
    this.waterNode.buffer = noiseBuffer;
    this.waterNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 320;
    filter.Q.value = 1.2;

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.value = 0.05;

    this.waterNode.connect(filter);
    filter.connect(this.waterGain);
    this.waterGain.connect(this.ctx.destination);
    this.waterNode.start(0);
  }

  // Łopot żagli (gdy żagiel trzepocze przy złym kącie)
  setupLuffing() {
    const bufferSize = this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08;
    }

    this.luffNode = this.ctx.createBufferSource();
    this.luffNode.buffer = noiseBuffer;
    this.luffNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 180;
    filter.Q.value = 3.0;

    // Modulator amplitudy (trzepotanie)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 7.5; // Hz

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain.gain);

    this.luffGain = this.ctx.createGain();
    this.luffGain.gain.value = 0.0;

    this.luffNode.connect(filter);
    filter.connect(this.luffGain);
    this.luffGain.connect(this.ctx.destination);

    lfo.start(0);
    this.luffNode.start(0);
  }

  // Aktualizacja parametrów dynamicznych
  update(boatSpeed, apparentWindSpeed, luffingAmount) {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Wiatr rośnie z prędkością wiatru pozornego
    const targetWindGain = Math.min(0.28, 0.04 + (apparentWindSpeed / 28) * 0.18);
    this.windGain.gain.setTargetAtTime(targetWindGain, now, 0.1);
    this.windFilter.frequency.setTargetAtTime(300 + apparentWindSpeed * 28, now, 0.1);

    // Szum wody zależny od prędkości jachtu
    const targetWaterGain = Math.min(0.22, (boatSpeed / 8) * 0.16);
    this.waterGain.gain.setTargetAtTime(targetWaterGain, now, 0.1);

    // Łopot żagli
    const targetLuffGain = Math.min(0.3, luffingAmount * 0.25);
    this.luffGain.gain.setTargetAtTime(targetLuffGain, now, 0.05);
  }

  // Klikanie kabestanu przy wybieraniu szotów (klawisz S)
  playWinchClick() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastClickTime < 60) return; // Ograniczenie częstotliwości
    this.lastClickTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // Dźwięk luzowania szota (szelest liny)
  playEaseSound() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastClickTime < 110) return;
    this.lastClickTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320 + Math.random() * 40, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Sukces (melodyjny dzwonek jachtowy)
  playSuccess() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  }

  // Porażka / Koniec czasu (niski brzęczyk)
  playFailure() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.85);
  }
}

window.AudioManager = AudioManager;
