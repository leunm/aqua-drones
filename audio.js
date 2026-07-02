class SoundManager {
    constructor() {
        this.ctx = null;
        this.chargeOsc = null;
        this.chargeGain = null;
        this.enabled = true;
        this.noiseBuffer = null;
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.noiseBuffer = this.createNoiseBuffer();
            }
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playStart() {
        this.resume();
        if (!this.ctx || !this.enabled) return;

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now + index * 0.08);
            gain.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.15);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + index * 0.08);
            osc.stop(now + index * 0.08 + 0.2);
        });
    }

    startCharge() {
        this.resume();
        if (!this.ctx || !this.enabled || this.chargeOsc) return;

        const now = this.ctx.currentTime;
        this.chargeOsc = this.ctx.createOscillator();
        this.chargeGain = this.ctx.createGain();

        this.chargeOsc.type = 'sine';
        this.chargeOsc.frequency.setValueAtTime(150, now);
        
        this.chargeGain.gain.setValueAtTime(0, now);
        this.chargeGain.gain.linearRampToValueAtTime(0.1, now + 0.2);

        this.chargeOsc.connect(this.chargeGain);
        this.chargeGain.connect(this.ctx.destination);
        this.chargeOsc.start(now);
    }

    updateCharge(level) {
        if (!this.ctx || !this.chargeOsc || !this.chargeGain) return;
        const now = this.ctx.currentTime;
        // Level is 0 to 1
        // Slide frequency from 150Hz to 600Hz
        const targetFreq = 150 + level * 450;
        this.chargeOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
        
        // Add a slight vibrato or volume variation to make it sound energetic
        const volume = 0.08 + level * 0.07;
        this.chargeGain.gain.setTargetAtTime(volume, now, 0.05);
    }

    stopCharge() {
        if (!this.ctx || !this.chargeOsc) return;
        const now = this.ctx.currentTime;
        try {
            this.chargeGain.gain.setValueAtTime(this.chargeGain.gain.value, now);
            this.chargeGain.gain.linearRampToValueAtTime(0, now + 0.05);
            this.chargeOsc.stop(now + 0.06);
        } catch (e) {
            // Safe fallback
        }
        this.chargeOsc = null;
        this.chargeGain = null;
    }

    playShoot(chargeLevel) {
        this.resume();
        if (!this.ctx || !this.enabled) return;

        const now = this.ctx.currentTime;
        const duration = 0.15 + chargeLevel * 0.25;
        
        // Use noise for the splash/water hiss
        if (this.noiseBuffer) {
            const noiseNode = this.ctx.createBufferSource();
            noiseNode.buffer = this.noiseBuffer;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            // Start filter high and drop it
            noiseFilter.frequency.setValueAtTime(1000 + chargeLevel * 3000, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(200, now + duration);
            noiseFilter.Q.setValueAtTime(3.0, now);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.2 + chargeLevel * 0.25, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noiseNode.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noiseNode.start(now);
            noiseNode.stop(now + duration);
        }

        // Add a clean pitch sweep tone for punch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + chargeLevel * 200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + duration);

        gain.gain.setValueAtTime(0.15 + chargeLevel * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    playHit() {
        this.resume();
        if (!this.ctx || !this.enabled) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playBossHit() {
        this.resume();
        if (!this.ctx || !this.enabled) return;

        const now = this.ctx.currentTime;
        
        // Deep bubble splash + low thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.12);

        // Lowpass filter for metallic thud
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);

        // Extra noise hiss for splash splash
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            
            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(800, now);
            
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.15, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noise.start(now);
            noise.stop(now + 0.1);
        }
    }

    playExplode() {
        this.resume();
        if (!this.ctx || !this.enabled) return;

        const now = this.ctx.currentTime;
        const duration = 0.5;

        // Bass rumble
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + duration);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);

        // Noise blast
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + duration);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.35, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noise.start(now);
            noise.stop(now + duration);
        }
    }

    playGameOver() {
        this.resume();
        if (!this.ctx || !this.enabled) return;

        const now = this.ctx.currentTime;
        const notes = [392.00, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + index * 0.15);
            osc.frequency.linearRampToValueAtTime(freq * 0.9, now + index * 0.15 + 0.25);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, now + index * 0.15);

            gain.gain.setValueAtTime(0, now + index * 0.15);
            gain.gain.linearRampToValueAtTime(0.12, now + index * 0.15 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.35);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + index * 0.15);
            osc.stop(now + index * 0.15 + 0.4);
        });
    }
}

// Export singleton instance or register globally
window.sounds = new SoundManager();
