/**
 * Web Audio API synthesizer for classic 8-bit arcade sound effects
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Check localStorage for saved sound preference
    const saved = localStorage.getItem('retrovault_sound_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('retrovault_sound_enabled', String(this.enabled));
    if (this.enabled) {
      this.playBeep(440, 0.08, 'square');
    }
    return this.enabled;
  }

  public playBeep(freq: number, duration: number = 0.08, type: OscillatorType = 'square', vol: number = 0.15) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio playback failed silently
    }
  }

  // Coin collected sound: high two-tone chime
  public playCoin() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // AudioContext muted or interrupted
    }
  }

  // Jump sound: rapid upward frequency glide
  public playJump() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // AudioContext muted or interrupted
    }
  }

  // Hit / Stomp sound: sharp noise click into low thump
  public playHit() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // AudioContext muted or interrupted
    }
  }

  // Brick shatter or explode
  public playExplode() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // AudioContext muted or interrupted
    }
  }

  // Powerup fanfare
  public playPowerup() {
    if (!this.enabled) return;
    const notes = [330, 392, 659, 523, 587, 784];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.08, 'triangle', 0.15);
      }, idx * 60);
    });
  }

  // Line clear in Tetris
  public playClear() {
    if (!this.enabled) return;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.1, 'sine', 0.2);
      }, idx * 45);
    });
  }

  // Game over melancholic cadence
  public playGameOver() {
    if (!this.enabled) return;
    const notes = [440, 415, 392, 349];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.2, 'sawtooth', 0.18);
      }, idx * 120);
    });
  }

  // Paddle bounce in Arkanoid / Bounce Ball
  public playPaddleBounce(pitchOffset: number = 0) {
    this.playBeep(320 + pitchOffset, 0.06, 'triangle', 0.18);
  }

  // Brick hit
  public playBrickBounce() {
    this.playBeep(520, 0.04, 'square', 0.12);
  }

  // Laser shot
  public playLaser() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // AudioContext muted or interrupted
    }
  }
}

export const sound = new SoundEngine();
