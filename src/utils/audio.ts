class SoundManager {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = true;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Click / UI tap
  public playButtonClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // Slot ticking
  public playSpinTick() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350 + Math.random() * 80, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  }

  // Reel Stop Lock
  public playSlotStop() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  // Draft Acquired Fanfare
  public playDraftAcquired() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.35);
    });
  }

  // Skip swoosh
  public playSkip() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // Lightning Electric Buzz ⚡ "ビリリリリッ！" "バチバチッ！" (Sharp, short, high-voltage electric crackle & buzz)
  public playLightningElectricBuzz() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.55;

    // 1. High-voltage Fast Electric Carrier (Frequency-Modulated Sawtooth + Square)
    const carrierOsc = ctx.createOscillator();
    const modOsc = ctx.createOscillator();
    const modGain = ctx.createGain();
    const carrierGain = ctx.createGain();

    carrierOsc.type = 'sawtooth';
    carrierOsc.frequency.setValueAtTime(220, now);
    carrierOsc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    carrierOsc.frequency.exponentialRampToValueAtTime(110, now + duration);

    // Rapid 95Hz modulation for aggressive "zz-zz-zz-zzzt!" electric crackle
    modOsc.type = 'square';
    modOsc.frequency.setValueAtTime(95, now);
    modOsc.frequency.linearRampToValueAtTime(140, now + 0.15);
    modGain.gain.setValueAtTime(180, now);
    modGain.gain.exponentialRampToValueAtTime(15, now + duration);

    modOsc.connect(modGain);
    modGain.connect(carrierOsc.frequency);

    // Instant attack for immediate punch with visual lightning flash
    carrierGain.gain.setValueAtTime(0.45, now);
    carrierGain.gain.exponentialRampToValueAtTime(0.25, now + 0.12);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Resonant bandpass filter for metallic electric arc sensation
    const bandFilter = ctx.createBiquadFilter();
    bandFilter.type = 'bandpass';
    bandFilter.frequency.setValueAtTime(3200, now);
    bandFilter.frequency.linearRampToValueAtTime(1800, now + duration);
    bandFilter.Q.setValueAtTime(5.5, now);

    carrierOsc.connect(carrierGain);
    carrierGain.connect(bandFilter);
    bandFilter.connect(ctx.destination);

    // 2. High-Frequency Sparking Noise (Batched intermittent electrical discharges "バチバチッ！")
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Denser sparks in the first 250ms
      const t = i / ctx.sampleRate;
      const threshold = t < 0.25 ? 0.72 : 0.90;
      const spark = Math.random() > threshold ? (Math.random() * 2 - 1) : 0;
      data[i] = spark * (Math.random() > 0.5 ? 1 : -1);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(4000, now);
    noiseFilter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.2, now + 0.15);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 3. Sharp Electrical Snap Transient (Pop on strike instant)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(450, now);
    snapOsc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    snapGain.gain.setValueAtTime(0.55, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);

    // Start nodes simultaneously
    carrierOsc.start(now);
    modOsc.start(now);
    noise.start(now);
    snapOsc.start(now);

    carrierOsc.stop(now + duration);
    modOsc.stop(now + duration);
    noise.stop(now + duration);
    snapOsc.stop(now + 0.18);
  }

  // Thunder Crack ⚡
  public playThunderStrike() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // White noise blast for thunder clap
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.7);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Deep sub bass boom
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(140, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.9);

    subGain.gain.setValueAtTime(0.35, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    noise.start();
    subOsc.start();
    noise.stop(ctx.currentTime + 0.8);
    subOsc.stop(ctx.currentTime + 0.9);
  }

  // Black Ball Rising Sci-Fi Aura & Bass Drop
  public playBlackBallAura() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 1.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  }

  // Golden Lightning Rain & Massive Thunder (Extremely Rare Luxury Sensation)
  public playGoldenLightning() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 1.2;

    // 1. Triple Cascading Electric Arcs (Continuous Golden Lightning Roar)
    [240, 480, 960].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      osc.frequency.exponentialRampToValueAtTime(1400, now + idx * 0.08 + 0.3);
      osc.frequency.exponentialRampToValueAtTime(80, now + duration);

      mod.type = 'square';
      mod.frequency.setValueAtTime(110 + idx * 30, now);
      modGain.gain.setValueAtTime(220, now);
      modGain.gain.exponentialRampToValueAtTime(10, now + duration);

      mod.connect(modGain);
      modGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.35, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, now);
      filter.Q.setValueAtTime(4.0, now);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      mod.start(now + idx * 0.08);
      osc.stop(now + duration);
      mod.stop(now + duration);
    });

    // 2. Heavy Golden Sub Rumble & Thunder Claps
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(3500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(60, now + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  // Golden Ballon d'Or Supreme Grand Fanfare (Triumphant Brass & Harp Chimes)
  public playGoldenFanfare() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Majestic Royal Chord Progression (D major / F# / A / D / F# high)
    const royalNotes = [
      { freq: 293.66, time: 0.00, dur: 0.8 }, // D4
      { freq: 369.99, time: 0.08, dur: 0.8 }, // F#4
      { freq: 440.00, time: 0.16, dur: 0.9 }, // A4
      { freq: 587.33, time: 0.26, dur: 1.1 }, // D5
      { freq: 739.99, time: 0.38, dur: 1.3 }, // F#5
      { freq: 880.00, time: 0.50, dur: 1.5 }, // A5
      { freq: 1174.66, time: 0.62, dur: 1.8 }, // D6 supreme
    ];

    royalNotes.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(item.freq, now + item.time);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(item.freq * 3.5, now + item.time);
      filter.frequency.exponentialRampToValueAtTime(item.freq * 1.5, now + item.time + item.dur);

      gain.gain.setValueAtTime(0, now + item.time);
      gain.gain.setValueAtTime(0.28, now + item.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.time + item.dur);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now + item.time);
      osc.stop(now + item.time + item.dur);
    });

    // Shimmering Golden Chime Arpeggio
    const sparkles = [1318.5, 1567.98, 1760.0, 2093.0, 2349.32, 2793.83];
    sparkles.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.3 + idx * 0.06);

      gain.gain.setValueAtTime(0, now + 0.3 + idx * 0.06);
      gain.gain.setValueAtTime(0.18, now + 0.3 + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + idx * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.3 + idx * 0.06);
      osc.stop(now + 0.3 + idx * 0.06 + 0.4);
    });
  }

  // Best XI Full Victory Fanfare
  public playVictory() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C major triumph
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 1.2);
    });
  }

  // Alias for team completion fanfare
  public playTeamCompleted() {
    this.playVictory();
  }

  // Card Flip / Interaction
  public playCardFlip() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  // Error / Invalid placement sound
  public playError() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }
}

export const soundManager = new SoundManager();
