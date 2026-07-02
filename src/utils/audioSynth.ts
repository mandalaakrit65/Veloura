/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer to play high-fidelity premium ambient lofi music completely offline
// for pre-loaded sample tracks in Veloura.
class AmbientSynth {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private intervalId: any = null;
  private currentBeat = 0;
  private tempo = 80; // BPM
  private currentProgress = 0;
  private duration = 155;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private nodes: AudioNode[] = [];
  private speed = 1.0;
  private masterVolume: GainNode | null = null;
  private volumeLevel = 0.8;
  private eqFilters: BiquadFilterNode[] = [];
  private eqGains: number[] = [0, 0, 0, 0, 0];

  constructor() {}

  init() {
    if (this.ctx) return;
    // Standard AudioContext initialization
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  start(songId: string, startProgress: number, onTimeUpdate: (time: number) => void) {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.stop();
    this.isRunning = true;
    this.currentProgress = startProgress;
    this.onTimeUpdate = onTimeUpdate;

    // Determine melody based on song ID
    const chords = this.getChordsForSong(songId);
    const stepDuration = (60 / this.tempo) / 2; // Eighth note duration

    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.setValueAtTime(this.volumeLevel, this.ctx.currentTime);
    this.createFilters();

    const scheduler = () => {
      if (!this.ctx || !this.isRunning) return;
      
      const timeToNextBeat = stepDuration / this.speed;
      
      // Play a beat and notes every step
      this.playSynthStep(chords, this.currentBeat, this.ctx.currentTime);
      
      this.currentProgress += timeToNextBeat;
      this.currentBeat = (this.currentBeat + 1) % 16;
      
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.currentProgress);
      }

      this.intervalId = setTimeout(scheduler, timeToNextBeat * 1000);
    };

    scheduler();
  }

  pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.nodes.forEach(n => {
      try {
        (n as any).stop?.();
        n.disconnect();
      } catch (e) {}
    });
    this.nodes = [];
  }

  setVolume(vol: number) {
    this.volumeLevel = vol;
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  setSpeed(rate: number) {
    this.speed = rate;
  }

  setEqGains(gains: number[]) {
    this.eqGains = [...gains];
    if (this.ctx) {
      this.eqFilters.forEach((filter, i) => {
        if (i < gains.length) {
          filter.gain.setValueAtTime(gains[i], this.ctx.currentTime);
        }
      });
    }
  }

  private createFilters() {
    if (!this.ctx || !this.masterVolume) return;

    // Clean up old filters first if any
    this.eqFilters.forEach(f => {
      try { f.disconnect(); } catch (e) {}
    });
    this.eqFilters = [];

    const freqs = [60, 230, 910, 4000, 14000];
    const types: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];

    let lastNode: AudioNode = this.masterVolume;

    for (let i = 0; i < freqs.length; i++) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = types[i];
      filter.frequency.setValueAtTime(freqs[i], this.ctx.currentTime);
      filter.gain.setValueAtTime(this.eqGains[i], this.ctx.currentTime);
      if (types[i] === 'peaking') {
        filter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      }

      lastNode.connect(filter);
      lastNode = filter;
      this.eqFilters.push(filter);
    }

    lastNode.connect(this.ctx.destination);
  }

  private getChordsForSong(songId: string): number[][] {
    // Return lists of midi notes
    switch (songId) {
      case 'sample_telepathia':
        // Smooth Fmaj7 - G6 - Em7 - Am7 (Kali Uchis vibe)
        return [
          [53, 57, 60, 64], // Fmaj7
          [55, 59, 62, 66], // G6
          [52, 55, 59, 62], // Em7
          [57, 60, 64, 67]  // Am7
        ];
      case 'sample_cherry':
        // Melancholic Lana vibe: Dm - Am - C - G
        return [
          [50, 53, 57, 62], // Dm
          [45, 48, 52, 57], // Am
          [48, 52, 55, 60], // C
          [43, 47, 50, 55]  // G
        ];
      case 'sample_star_shopping':
        // Emo Lil Peep vibe: F#m - E - D - A
        return [
          [54, 57, 61, 66], // F#m
          [52, 56, 59, 64], // E
          [50, 54, 57, 62], // D
          [49, 52, 56, 61]  // A
        ];
      default:
        // Elegant R&B groove
        return [
          [53, 57, 60, 64],
          [57, 60, 64, 67],
          [50, 53, 57, 60],
          [55, 59, 62, 65]
        ];
    }
  }

  private playSynthStep(chords: number[][], beat: number, time: number) {
    if (!this.ctx || !this.masterVolume) return;

    const chordIndex = Math.floor(beat / 4) % chords.length;
    const currentChord = chords[chordIndex];
    
    // Smooth Lofi Sub Bass on beat 0 and 8
    if (beat === 0 || beat === 8) {
      const bassNode = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      
      bassNode.type = 'triangle';
      const mNote = currentChord[0] - 12; // An octave lower
      bassNode.frequency.setValueAtTime(this.midiToFreq(mNote), time);
      
      bassGain.gain.setValueAtTime(0.3, time);
      bassGain.gain.exponentialRampToValueAtTime(0.01, time + 1.2);
      
      bassNode.connect(bassGain);
      bassGain.connect(this.masterVolume);
      
      bassNode.start(time);
      bassNode.stop(time + 1.2);
    }

    // Soothing EP Pad Arpeggio
    if (beat % 2 === 0) {
      const padNode = this.ctx.createOscillator();
      const padGain = this.ctx.createGain();
      
      padNode.type = 'sine';
      // Pick notes in chord based on beat
      const noteIndex = (beat / 2) % currentChord.length;
      const mNote = currentChord[noteIndex] + 12; // An octave higher for sweet bells
      padNode.frequency.setValueAtTime(this.midiToFreq(mNote), time);
      
      padGain.gain.setValueAtTime(0.12, time);
      padGain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
      
      padNode.connect(padGain);
      padGain.connect(this.masterVolume);
      
      padNode.start(time);
      padNode.stop(time + 0.8);
    }

    // Lofi Rimshot on beat 4 and 12
    if (beat === 4 || beat === 12) {
      const snareOsc = this.ctx.createOscillator();
      const snareGain = this.ctx.createGain();
      
      snareOsc.type = 'sine';
      snareOsc.frequency.setValueAtTime(220, time);
      snareOsc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
      
      snareGain.gain.setValueAtTime(0.15, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      
      snareOsc.connect(snareGain);
      snareGain.connect(this.masterVolume);
      
      snareOsc.start(time);
      snareOsc.stop(time + 0.08);
    }

    // Delicate Hi-hat on odd beats
    if (beat % 2 !== 0) {
      // White noise hihat simulation
      const bufferSize = this.ctx.sampleRate * 0.03;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(8000, time);
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.02, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      
      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterVolume);
      
      noiseNode.start(time);
      noiseNode.stop(time + 0.03);
    }
  }

  private midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }
}

export const synthPlayer = new AmbientSynth();
