export class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, endFreq, duration, type = 'sine', volume = 0.12) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  shoot(level = 1) {
    this.playTone(720 + level * 90, 180, 0.11, 'sawtooth', 0.08);
  }

  enemyShoot() {
    this.playTone(320, 110, 0.18, 'square', 0.06);
  }

  explosion() {
    this.playTone(140, 32, 0.35, 'sawtooth', 0.16);
  }

  dash() {
    this.playTone(260, 880, 0.18, 'triangle', 0.12);
  }

  jump() {
    this.playTone(220, 520, 0.16, 'sine', 0.1);
  }

  pickup() {
    this.playTone(520, 1040, 0.22, 'sine', 0.12);
  }

  hit() {
    this.playTone(160, 70, 0.12, 'square', 0.12);
  }
      }
