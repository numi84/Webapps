export class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.audioContext = null;

        // Initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    // Play a tone with specific frequency and duration
    playTone(frequency, duration = 0.1, type = 'sine', volume = 1.0) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(this.volume * volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.audioContext.currentTime + duration
        );

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Play a chord (multiple frequencies)
    playChord(frequencies, duration = 0.2, type = 'sine', volume = 1.0) {
        frequencies.forEach(freq => {
            this.playTone(freq, duration, type, volume * 0.6);
        });
    }

    // Sound effects
    playPaddleHit() {
        this.playTone(440, 0.05, 'square', 0.5);
    }

    playBlockHit(colorIndex = 0) {
        // Different pitches for different colored blocks
        const baseFreq = 200 + (colorIndex * 50);
        this.playTone(baseFreq, 0.1, 'square', 0.6);
    }

    playBlockDestroy() {
        // Ascending notes
        this.playTone(400, 0.05, 'square', 0.4);
        setTimeout(() => this.playTone(600, 0.05, 'square', 0.4), 30);
        setTimeout(() => this.playTone(800, 0.08, 'sine', 0.4), 60);
    }

    playPowerupDrop() {
        this.playChord([523.25, 659.25, 783.99], 0.15, 'sine', 0.3);
    }

    playPowerupCollect() {
        // Ascending arpeggio
        this.playTone(523.25, 0.08, 'sine', 0.5);
        setTimeout(() => this.playTone(659.25, 0.08, 'sine', 0.5), 50);
        setTimeout(() => this.playTone(783.99, 0.1, 'sine', 0.5), 100);
        setTimeout(() => this.playTone(1046.5, 0.12, 'sine', 0.5), 150);
    }

    playLaserShoot() {
        this.playTone(800, 0.05, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(600, 0.05, 'sawtooth', 0.3), 30);
    }

    playExplosion() {
        // White noise burst
        if (!this.enabled || !this.audioContext) return;

        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        gainNode.gain.setValueAtTime(this.volume * 0.6, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        noise.start();
        noise.stop(this.audioContext.currentTime + 0.3);
    }

    playLoseLife() {
        // Descending sad trombone
        this.playTone(392, 0.15, 'triangle', 0.6);
        setTimeout(() => this.playTone(349.23, 0.15, 'triangle', 0.6), 100);
        setTimeout(() => this.playTone(293.66, 0.2, 'triangle', 0.6), 200);
    }

    playLevelComplete() {
        // Victory fanfare
        const melody = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
        melody.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.6), i * 80);
        });
    }

    playGameOver() {
        // Descending chromatic scale
        const notes = [880, 830.61, 783.99, 739.99, 698.46, 659.25, 622.25];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.5), i * 100);
        });
    }

    playWallBounce() {
        this.playTone(300, 0.03, 'square', 0.3);
    }

    playCombo(comboCount) {
        const baseFreq = 400 + (comboCount * 50);
        this.playTone(baseFreq, 0.08, 'sine', Math.min(0.8, 0.3 + comboCount * 0.05));
    }

    // Enable/disable sound
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
