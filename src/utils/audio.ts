/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aviator_muted');
      this.muted = saved === 'true';
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (typeof window !== 'undefined') {
      localStorage.setItem('aviator_muted', String(m));
    }
    if (m) {
      this.stopFlightSound();
    }
  }

  isMuted() {
    return this.muted;
  }

  private flightLoopTimer: any = null;
  private flightOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private currentBar: number = 0;

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  stopFlightSound() {
    if (this.flightLoopTimer) {
      clearInterval(this.flightLoopTimer);
      this.flightLoopTimer = null;
    }
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.flightOscillators.forEach(({ osc, gain }) => {
      try {
        if (now > 0) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
          osc.stop(now + 0.12);
        } else {
          osc.stop();
        }
      } catch (err) {
        // Ignored
      }
    });
    this.flightOscillators = [];
  }

  private playFlightBar(ctx: AudioContext) {
    if (this.muted) return;
    try {
      const now = ctx.currentTime;

      // 1. DUST POPS & VINYL CRACKLE (Consistent analog tape scratch/pops from the video)
      const bufferSize = ctx.sampleRate * 2.0; // 2 seconds loop
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Continuous delicate vinyl tape hiss
        let hiss = (Math.random() * 2 - 1) * 0.006;
        // Random dust crackles/pops
        if (Math.random() < 0.00012) {
          hiss += (Math.random() * 2 - 1) * 0.35;
        }
        data[i] = hiss;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.Q.setValueAtTime(1.2, now);
      noiseFilter.frequency.setValueAtTime(2200, now); // mid-high vintage hiss peak

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.07, now + 0.15);
      noiseGain.gain.setValueAtTime(0.07, now + 1.85);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 2.0);
      this.flightOscillators.push({ osc: noiseSource as any, gain: noiseGain });

      // 2. CHORD PAD (Warm, mellow lo-fi electric chords with detuned "wow & flutter" chorus effect)
      // Eb minor 7, Ab major 7, Bb minor 7, Db major 7
      const chords = [
        [233.08, 277.18, 349.23, 415.30], // Bb minor 7: Bb3, Db4, F4, Ab4
        [155.56, 185.00, 233.08, 277.18], // Eb minor 7: Eb3, Gb3, Bb3, Db4
        [207.65, 261.63, 311.13, 389.00], // Ab major 7: Ab3, C4, Eb4, G4
        [145.43, 174.61, 207.65, 261.63]  // Db major 7: Db3, F3, Ab3, C4
      ];
      
      const currentChord = chords[this.currentBar % chords.length];

      currentChord.forEach((freq) => {
        // Double oscillators per voice slightly detuned to mimic sweet vintage turntable speed fluctuations
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);
        osc1.detune.setValueAtTime(-5, now); // Detuned down for wow & flutter chorus

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq, now);
        osc2.detune.setValueAtTime(5, now); // Detuned up for warmth

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now); // Soft warm low-pass cut

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.35);
        gain.gain.setValueAtTime(0.04, now + 1.65);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 2.0);
        osc2.start(now);
        osc2.stop(now + 2.0);

        this.flightOscillators.push({ osc: osc1, gain });
        this.flightOscillators.push({ osc: osc2, gain });
      });

      // 3. BASS DEEP PULSES (Deep, relaxing lo-fi bass hums)
      const bases = [
        [116.54, 87.31],   // Bar 0: Bb2, F2
        [77.78, 116.54],   // Bar 1: Eb2, Bb2
        [103.83, 77.78],   // Bar 2: Ab2, Eb2
        [72.71, 103.83]    // Bar 3: Db2, Ab2
      ];

      const currentBase = bases[this.currentBar % bases.length];

      // Beat 1 Bass Note
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine'; // Super warm round fundamental
        osc.frequency.setValueAtTime(currentBase[0], now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(90, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.95);

        this.flightOscillators.push({ osc, gain });
      }

      // Beat 3 Bass Note (delay = 1.0s)
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(currentBase[1], now + 1.0);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(90, now + 1.0);

        gain.gain.setValueAtTime(0, now + 1.0);
        gain.gain.linearRampToValueAtTime(0.12, now + 1.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 1.0);
        osc.stop(now + 1.95);

        this.flightOscillators.push({ osc, gain });
      }

      // 4. LO-FI RHODES MELODIC CHIMES (Soft, bell-like chimes on Beats 2 & 4 from the video)
      const chimes = [
        [698.46, 830.61], // Bar 0: F5, Ab5
        [783.99, 932.33], // Bar 1: G5, Bb5
        [622.25, 783.99], // Bar 2: Eb5, G5
        [698.46, 1046.50] // Bar 3: F5, C6
      ];
      const barChime = chimes[this.currentBar % chimes.length];

      // Beat 2 Melodic Accent (delay = 0.5s)
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(barChime[0], now + 0.5);

        gain.gain.setValueAtTime(0, now + 0.5);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.54);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 0.5);
        osc.stop(now + 1.0);

        this.flightOscillators.push({ osc, gain });
      }

      // Beat 4 Melodic Accent (delay = 1.5s)
      {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(barChime[1], now + 1.5);

        gain.gain.setValueAtTime(0, now + 1.5);
        gain.gain.linearRampToValueAtTime(0.05, now + 1.54);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.95);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 1.5);
        osc.stop(now + 2.0);

        this.flightOscillators.push({ osc, gain });
      }

      // 5. VINYL TICK/METRONOME (Quarter note micro rhythm)
      for (let beat = 0; beat < 4; beat++) {
        const beatTime = now + (beat * 0.5);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000, beatTime);
        osc.frequency.exponentialRampToValueAtTime(120, beatTime + 0.015);

        gain.gain.setValueAtTime(0, beatTime);
        gain.gain.linearRampToValueAtTime(0.014, beatTime + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, beatTime + 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(beatTime);
        osc.stop(beatTime + 0.035);

        this.flightOscillators.push({ osc, gain });
      }

    } catch (e) {
      console.warn('Audio loop playback failed', e);
    }
  }

  playFlightStart() {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Ensure any previously running loop is stopped first
    this.stopFlightSound();

    this.currentBar = 0;
    
    // Play the first bar immediately
    this.playFlightBar(ctx);

    // Schedule subsequent bars every 2.0 seconds (2000 ms)
    this.flightLoopTimer = setInterval(() => {
      if (this.muted) {
        this.stopFlightSound();
        return;
      }
      const activeCtx = this.initCtx();
      if (!activeCtx) return;
      this.currentBar++;
      this.playFlightBar(activeCtx);
    }, 2000);
  }

  playCashout() {
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primary double chime
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.connect(g1);
      g1.connect(ctx.destination);
      o1.type = 'sine';
      o1.frequency.setValueAtTime(523.25, now); // C5
      g1.gain.setValueAtTime(0.01, now);
      g1.gain.linearRampToValueAtTime(0.18, now + 0.05);
      g1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      o1.start(now);
      o1.stop(now + 0.35);

      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.connect(g2);
      g2.connect(ctx.destination);
      o2.type = 'sine';
      o2.frequency.setValueAtTime(783.99, now + 0.1); // G5
      g2.gain.setValueAtTime(0.01, now + 0.1);
      g2.gain.linearRampToValueAtTime(0.18, now + 0.15);
      g2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      o2.start(now + 0.1);
      o2.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  }

  playCrash() {
    this.stopFlightSound();
    if (this.muted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 1.0;

      // Create a master volume control specifically for the flight-away zoom
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, now);

      // Stage 1: Dynamic Vocal timbres mimicking mouth sounds ("Mmmmm" -> "EEEEE" -> "OOOOWww")
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      // Timestamps matching the video, scaled to exactly 1.0 second:
      // 0.0s - 0.25s: "Mmm" low tone buzz (120Hz -> 150Hz)
      // 0.25s - 0.65s: "EEeee" fast engine-scream zoom takeoff (150Hz -> 820Hz)
      // 0.65s - 0.95s: "Ooowww" panning doppler decay (820Hz -> 220Hz)
      osc1.frequency.setValueAtTime(120, now);
      osc1.frequency.linearRampToValueAtTime(150, now + 0.25);
      osc1.frequency.exponentialRampToValueAtTime(820, now + 0.65);
      osc1.frequency.exponentialRampToValueAtTime(220, now + 0.95);

      osc2.frequency.setValueAtTime(122, now);
      osc2.frequency.linearRampToValueAtTime(152, now + 0.25);
      osc2.frequency.exponentialRampToValueAtTime(826, now + 0.65);
      osc2.frequency.exponentialRampToValueAtTime(222, now + 0.95);

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.15, now + 0.15); // Initial chest hum
      oscGain.gain.linearRampToValueAtTime(0.28, now + 0.45); // Full energy zoom screamer
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(oscGain);
      osc2.connect(oscGain);

      // Formant filters to replicate human voice vowel filters!
      const formantFilter = ctx.createBiquadFilter();
      formantFilter.type = 'bandpass';
      formantFilter.Q.setValueAtTime(7.5, now);

      // Peak frequencies correspond to mouth vowels, scaled to 1.0s:
      // Starting closed "M" (~300Hz), widening to high "E" (~2000Hz), ending rounded "O" (~600Hz)
      formantFilter.frequency.setValueAtTime(300, now);
      formantFilter.frequency.linearRampToValueAtTime(350, now + 0.2);
      formantFilter.frequency.exponentialRampToValueAtTime(2000, now + 0.62);
      formantFilter.frequency.linearRampToValueAtTime(600, now + 0.77);
      formantFilter.frequency.exponentialRampToValueAtTime(120, now + duration);

      oscGain.connect(formantFilter);
      formantFilter.connect(mainGain);

      // Stage 2: Wind swoosh / air friction noise
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.Q.setValueAtTime(1.8, now);
      // Surge the wind filter values high, scaled to 1.0s
      noiseFilter.frequency.setValueAtTime(400, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(2900, now + 0.65);
      noiseFilter.frequency.linearRampToValueAtTime(800, now + 0.95);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.2);  // subtle sound of flight buildup
      noiseGain.gain.linearRampToValueAtTime(0.24, now + 0.62); // huge wind shear thrust explosion
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(mainGain);

      // Stage 3: Low chest base rumbling for physical power mimicking TikTok audio
      const baseSubOsc = ctx.createOscillator();
      const baseGain = ctx.createGain();
      baseSubOsc.type = 'sine';
      baseSubOsc.frequency.setValueAtTime(65, now);
      baseSubOsc.frequency.linearRampToValueAtTime(95, now + 0.3);
      baseSubOsc.frequency.exponentialRampToValueAtTime(32, now + 0.7);

      baseGain.gain.setValueAtTime(0, now);
      baseGain.gain.linearRampToValueAtTime(0.18, now + 0.25);
      baseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      baseSubOsc.connect(baseGain);
      baseGain.connect(mainGain);

      // Stereo panning - start in centre, pan far right as the plane takes off!
      let destinationNode: AudioNode = mainGain;
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(0, now);
        panner.pan.linearRampToValueAtTime(0.15, now + 0.25);
        panner.pan.linearRampToValueAtTime(0.95, now + 0.7); // Zoom off screen to the right
        mainGain.connect(panner);
        destinationNode = panner;
      }
      destinationNode.connect(ctx.destination);

      // Fade in whole mix smoothly
      mainGain.gain.setValueAtTime(0, now);
      mainGain.gain.linearRampToValueAtTime(1.0, now + 0.08);
      mainGain.gain.setValueAtTime(1.0, now + 0.67);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Start the synchronized playback nodes
      osc1.start(now);
      osc1.stop(now + duration);
      osc2.start(now);
      osc2.stop(now + duration);

      noiseSource.start(now);
      noiseSource.stop(now + duration);

      baseSubOsc.start(now);
      baseSubOsc.stop(now + duration);

    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  }
}

export const audioEngine = new AudioEngine();
