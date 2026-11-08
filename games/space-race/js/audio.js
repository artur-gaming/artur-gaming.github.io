// js/audio.js - Sega Arcade FM/PSG Synthesizer for Space Race
class RetroAudio {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.35;
        this.musicVolume = 0.25;
        this.sfxVolume = 0.4;
        this.isMuted = false;
        this.bgmPlaying = false;
        this.bgmStep = 0;
        this.bgmTimer = null;
        this.synthVoice = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        }
    }

    // --- Sound Effects ---

    playLaser(level = 1) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Level-dependent frequencies and wave shapes
        if (level === 1) {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
            gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.13);
        } else if (level === 2) {
            // Dual cannon punch
            [660, 990].forEach(freq => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'square';
                o.frequency.setValueAtTime(freq, now);
                o.frequency.exponentialRampToValueAtTime(80, now + 0.14);
                g.gain.setValueAtTime(this.sfxVolume * 0.25, now);
                g.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
                o.connect(g);
                g.connect(this.masterGain);
                o.start(now);
                o.stop(now + 0.15);
            });
        } else if (level === 3) {
            // Triple spread harmonic
            [550, 825, 1100].forEach((freq, idx) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(freq, now + idx * 0.01);
                o.frequency.exponentialRampToValueAtTime(120, now + 0.16);
                g.gain.setValueAtTime(this.sfxVolume * 0.2, now + idx * 0.01);
                g.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
                o.connect(g);
                g.connect(this.masterGain);
                o.start(now + idx * 0.01);
                o.stop(now + 0.17);
            });
        } else {
            // Burst Hyper Cannon
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(1200, now);
            o.frequency.linearRampToValueAtTime(300, now + 0.08);
            g.gain.setValueAtTime(this.sfxVolume * 0.5, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            o.connect(g);
            g.connect(this.masterGain);
            o.start(now);
            o.stop(now + 0.09);
        }
    }

    playStarlinkLaunch() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.08);
        osc.frequency.linearRampToValueAtTime(200, now + 0.2);

        gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.21);
    }

    playImpact() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Metallic clatter + buzz
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.15);

        gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.16);

        // White noise impact burst
        this.playNoise(0.12, 600, 0.4);
    }

    playExplosion(large = false) {
        if (!this.ctx || this.isMuted) return;
        const duration = large ? 0.6 : 0.35;
        this.playNoise(duration, large ? 250 : 450, large ? 0.6 : 0.35);

        // Sub-bass thump
        const now = this.ctx.currentTime;
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(large ? 120 : 90, now);
        sub.frequency.exponentialRampToValueAtTime(30, now + duration);

        subGain.gain.setValueAtTime(this.sfxVolume * (large ? 0.6 : 0.4), now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(now);
        sub.stop(now + duration + 0.05);
    }

    playNoise(duration, cutoffFreq = 400, volume = 0.3) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * (i / bufferSize));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoffFreq, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.sfxVolume * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + duration);
    }

    playUpgrade() {
        if (!this.ctx || this.isMuted) return;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.045);
            gain.gain.setValueAtTime(this.sfxVolume * 0.3, now + idx * 0.045);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.045 + 0.1);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.045);
            osc.stop(now + idx * 0.045 + 0.12);
        });
    }

    playDockingRepair() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        // Warm harmonic repair sweep
        const freqs = [392.00, 523.25, 659.25, 783.99];
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.08);
            osc.frequency.linearRampToValueAtTime(f * 1.5, now + i * 0.08 + 0.4);
            gain.gain.setValueAtTime(this.sfxVolume * 0.25, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.42);
        });
    }

    playAlarm() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.12);
        osc.frequency.linearRampToValueAtTime(800, now + 0.24);

        gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.26);
    }

    playStageClear() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const fanfare = [
            { f: 523.25, d: 0.15 }, // C5
            { f: 587.33, d: 0.15 }, // D5
            { f: 659.25, d: 0.15 }, // E5
            { f: 783.99, d: 0.25 }, // G5
            { f: 659.25, d: 0.15 }, // E5
            { f: 1046.50, d: 0.5 }  // C6
        ];
        let t = now;
        fanfare.forEach(item => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(item.f, t);
            gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + item.d);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + item.d + 0.05);
            t += item.d;
        });
    }

    playGameOver() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const notes = [440, 415.3, 392, 349.2, 329.6, 261.6];
        let t = now;
        notes.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(this.sfxVolume * 0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.23);
            t += 0.2;
        });
    }

    // --- Voice Synthesizer / Robotic Announcer ---
    speak(text) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && !this.isMuted) {
            try {
                window.speechSynthesis.cancel();
                const utter = new SpeechSynthesisUtterance(text);
                utter.rate = 1.15;
                utter.pitch = 0.9;
                utter.volume = this.sfxVolume * 1.2;
                window.speechSynthesis.speak(utter);
            } catch (e) {
                // Ignore speech synthesis failures
            }
        }
    }

    // --- Sega 80s Arcade Chiptune BGM Engine ---
    startBGM() {
        if (this.bgmPlaying || !this.ctx) return;
        this.bgmPlaying = true;
        this.bgmStep = 0;

        // 135 BPM 16th note timing = ~111ms per step
        const stepTime = 110;

        // Classic Sega Arcade bassline pattern (Outrun / Space Harrier style)
        // Root: A minor -> F -> G -> E
        const bassNotes = [
            // A minor bar
            110, 110, 220, 110,  110, 220, 110, 164.8,
            110, 110, 220, 110,  130.8, 146.8, 164.8, 196,
            // F bar
            87.3, 87.3, 174.6, 87.3, 87.3, 174.6, 87.3, 130.8,
            87.3, 87.3, 174.6, 87.3, 130.8, 146.8, 174.6, 196,
            // G bar
            98, 98, 196, 98, 98, 196, 98, 146.8,
            98, 98, 196, 98, 146.8, 164.8, 196, 220,
            // E bar
            82.4, 82.4, 164.8, 82.4, 82.4, 164.8, 82.4, 123.5,
            82.4, 82.4, 164.8, 82.4, 123.5, 146.8, 164.8, 196
        ];

        // Lead arpeggios that play on top
        const leadArp = [
            440, 523.25, 659.25, 880,  659.25, 523.25, 440, 659.25,
            523.25, 659.25, 880, 1046.5, 880, 659.25, 523.25, 440,
            349.2, 440, 523.25, 698.46, 523.25, 440, 349.2, 523.25,
            440, 523.25, 698.46, 880,   698.46, 523.25, 440, 349.2,
            392, 493.88, 587.33, 783.99, 587.33, 493.88, 392, 587.33,
            493.88, 587.33, 783.99, 987.77, 783.99, 587.33, 493.88, 392,
            329.63, 415.3, 493.88, 659.25, 493.88, 415.3, 329.63, 493.88,
            415.3, 493.88, 659.25, 830.61, 659.25, 493.88, 415.3, 329.63
        ];

        const tick = () => {
            if (!this.bgmPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;
            const currentStep = this.bgmStep % bassNotes.length;

            if (!this.isMuted) {
                // Play Bass Note
                const bassFreq = bassNotes[currentStep];
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sawtooth';
                bOsc.frequency.setValueAtTime(bassFreq, now);

                const bFilter = this.ctx.createBiquadFilter();
                bFilter.type = 'lowpass';
                bFilter.frequency.setValueAtTime(800, now);
                bFilter.frequency.exponentialRampToValueAtTime(150, now + 0.1);

                bGain.gain.setValueAtTime(this.musicVolume * 0.35, now);
                bGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

                bOsc.connect(bFilter);
                bFilter.connect(bGain);
                bGain.connect(this.masterGain);
                bOsc.start(now);
                bOsc.stop(now + 0.11);

                // Play Drum Kick / Snare
                if (currentStep % 4 === 0) {
                    // Kick
                    const kick = this.ctx.createOscillator();
                    const kGain = this.ctx.createGain();
                    kick.type = 'sine';
                    kick.frequency.setValueAtTime(120, now);
                    kick.frequency.exponentialRampToValueAtTime(30, now + 0.08);
                    kGain.gain.setValueAtTime(this.musicVolume * 0.45, now);
                    kGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                    kick.connect(kGain);
                    kGain.connect(this.masterGain);
                    kick.start(now);
                    kick.stop(now + 0.09);
                } else if (currentStep % 4 === 2) {
                    // Snare
                    this.playNoise(0.07, 1800, this.musicVolume * 0.3);
                }

                // Hi-Hat on every offbeat
                if (currentStep % 2 === 1) {
                    this.playNoise(0.025, 4500, this.musicVolume * 0.12);
                }

                // Lead Arpeggio
                if ((Math.floor(this.bgmStep / 64) % 2) === 1 || (currentStep % 4 === 0)) {
                    const leadFreq = leadArp[currentStep];
                    const lOsc = this.ctx.createOscillator();
                    const lGain = this.ctx.createGain();
                    lOsc.type = 'square';
                    lOsc.frequency.setValueAtTime(leadFreq, now);

                    lGain.gain.setValueAtTime(this.musicVolume * 0.16, now);
                    lGain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);

                    lOsc.connect(lGain);
                    lGain.connect(this.masterGain);
                    lOsc.start(now);
                    lOsc.stop(now + 0.095);
                }
            }

            this.bgmStep++;
            this.bgmTimer = setTimeout(tick, stepTime);
        };

        tick();
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

window.RetroAudio = RetroAudio;
