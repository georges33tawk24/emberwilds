/**
 * Web Audio engine — synthesized SFX + chiptune sequencer (spec §10).
 * Bus layout: master → { music, sfx }. Volumes persist via settings.
 * The context unlocks on first user gesture; music ducks on tab blur.
 */
import type { Song } from './songTypes';
import type { Settings } from '../systems/save';

type SfxName =
  | 'jump' | 'land' | 'shoot' | 'charge' | 'stomp' | 'pound' | 'spring'
  | 'hurt' | 'die' | 'gem' | 'berry' | 'token' | 'checkpoint' | 'goal'
  | 'enemyDie' | 'break' | 'walljump' | 'menuMove' | 'menuSelect' | 'pause';

function midiToHz(n: number): number {
  return 440 * Math.pow(2, (n - 69) / 12);
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private noiseBuf!: AudioBuffer;

  private song: Song | null = null;
  private songStep = 0;
  private nextStepTime = 0;
  private schedTimer: ReturnType<typeof setInterval> | null = null;
  private gemChain = 0;
  private gemChainAt = 0;

  private settings: Settings = {
    musicVol: 0.8, sfxVol: 0.9, masterVol: 0.9, screenShake: true, flashReduction: false, speedrunTimer: false, ghostRacer: true, assistMode: false,
  };

  applySettings(s: Settings): void {
    this.settings = s;
    if (!this.ctx) return;
    this.master.gain.value = s.masterVol;
    this.musicBus.gain.value = s.musicVol * 0.5;
    this.sfxBus.gain.value = s.sfxVol;
  }

  /** Must be called from a user-gesture call stack at least once. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.musicBus = this.ctx.createGain();
    this.sfxBus = this.ctx.createGain();
    this.musicBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.applySettings(this.settings);

    // 1s of white noise, reused by all noise voices
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    let seed = 22222;
    for (let i = 0; i < len; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (seed / 0x40000000) - 1;
    }

    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  get unlocked(): boolean {
    return this.ctx !== null;
  }

  // ---------------------------------------------------------------- music

  playSong(song: Song): void {
    if (this.song === song) return;
    this.stopSong();
    this.song = song;
    if (!this.ctx) return;
    this.songStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.06;
    this.schedTimer = setInterval(() => this.schedule(), 25);
  }

  stopSong(): void {
    if (this.schedTimer !== null) clearInterval(this.schedTimer);
    this.schedTimer = null;
    this.song = null;
  }

  /** Called when the context unlocks late — restart the pending song. */
  resumePendingSong(song: Song): void {
    if (!this.schedTimer && this.ctx) {
      this.song = null;
      this.playSong(song);
    }
  }

  private schedule(): void {
    if (!this.ctx || !this.song) return;
    const stepDur = 60 / this.song.bpm / 4; // sixteenth
    while (this.nextStepTime < this.ctx.currentTime + 0.12) {
      const s = this.song;
      for (const track of s.tracks) {
        const note = track.notes[this.songStep % s.length];
        if (note > 0) {
          const gate = (track.gate ?? 0.6) * stepDur;
          if (track.wave === 'noise') this.noiseVoice(note, this.nextStepTime, gate, track.volume, this.musicBus);
          else this.toneVoice(track.wave, midiToHz(note), this.nextStepTime, gate, track.volume * 0.16, this.musicBus);
        }
      }
      this.nextStepTime += stepDur;
      this.songStep++;
    }
  }

  private toneVoice(
    wave: OscillatorType, freq: number, when: number, dur: number, vol: number,
    bus: AudioNode, slideTo = 0,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, when);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, when + dur);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.005);
    gain.gain.setValueAtTime(vol, when + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private noiseVoice(note: number, when: number, dur: number, vol: number, bus: AudioNode): void {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    // higher "note" = brighter, shorter noise (hat vs kick)
    const bright = note > 64;
    filter.type = bright ? 'highpass' : 'lowpass';
    filter.frequency.value = bright ? 5000 : 300;
    const gain = this.ctx.createGain();
    const d = bright ? Math.min(dur, 0.05) : Math.min(dur, 0.1);
    gain.gain.setValueAtTime(vol * 0.5, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + d);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    src.start(when, Math.random() * 0.5, d + 0.02);
  }

  // ----------------------------------------------------------------- sfx

  sfx(name: SfxName): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bus = this.sfxBus;
    switch (name) {
      case 'jump':
        this.sweep('square', 300, 620, t, 0.12, 0.16);
        break;
      case 'land':
        this.noiseHit(t, 0.06, 0.12, 400);
        break;
      case 'shoot':
        this.sweep('square', 900, 500, t, 0.07, 0.1);
        break;
      case 'charge':
        this.sweep('square', 400, 1000, t, 0.2, 0.14);
        this.sweep('square', 200, 500, t, 0.2, 0.1);
        break;
      case 'stomp':
        this.sweep('square', 500, 200, t, 0.1, 0.18);
        this.noiseHit(t, 0.05, 0.1, 600);
        break;
      case 'pound':
        this.sweep('square', 250, 60, t, 0.18, 0.22);
        this.noiseHit(t, 0.14, 0.2, 200);
        break;
      case 'spring':
        this.sweep('square', 350, 1100, t, 0.18, 0.16);
        break;
      case 'walljump':
        this.sweep('square', 400, 750, t, 0.09, 0.12);
        break;
      case 'hurt':
        this.sweep('sawtooth', 350, 120, t, 0.22, 0.2);
        break;
      case 'die':
        this.sweep('sawtooth', 400, 60, t, 0.6, 0.2);
        this.noiseHit(t + 0.1, 0.3, 0.12, 250);
        break;
      case 'gem': {
        // rising pitch on chains (resets after a moment)
        const now = performance.now();
        if (now - this.gemChainAt > 900) this.gemChain = 0;
        this.gemChainAt = now;
        const step = Math.min(this.gemChain++, 11);
        const f = midiToHz(81 + step);
        this.blip('square', f, t, 0.07, 0.12);
        this.blip('square', f * 2, t + 0.03, 0.06, 0.06);
        break;
      }
      case 'berry':
        this.blip('triangle', 520, t, 0.09, 0.2);
        this.blip('triangle', 780, t + 0.08, 0.12, 0.2);
        break;
      case 'token':
        [72, 76, 79, 84].forEach((n, i) => this.blip('square', midiToHz(n), t + i * 0.09, 0.12, 0.16));
        break;
      case 'checkpoint':
        [67, 74].forEach((n, i) => this.blip('triangle', midiToHz(n), t + i * 0.08, 0.14, 0.2));
        break;
      case 'goal':
        [67, 71, 74, 79, 83, 86].forEach((n, i) => this.blip('square', midiToHz(n), t + i * 0.11, 0.18, 0.15));
        break;
      case 'enemyDie':
        this.sweep('square', 600, 150, t, 0.14, 0.15);
        break;
      case 'break':
        this.noiseHit(t, 0.16, 0.2, 350);
        break;
      case 'menuMove':
        this.blip('square', 660, t, 0.04, 0.08);
        break;
      case 'menuSelect':
        this.blip('square', 660, t, 0.05, 0.1);
        this.blip('square', 990, t + 0.05, 0.07, 0.1);
        break;
      case 'pause':
        this.blip('square', 440, t, 0.06, 0.1);
        this.blip('square', 330, t + 0.06, 0.08, 0.1);
        break;
    }
  }

  private sweep(wave: OscillatorType, from: number, to: number, when: number, dur: number, vol: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, when);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 20), when + dur);
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private blip(wave: OscillatorType, freq: number, when: number, dur: number, vol: number): void {
    this.toneVoice(wave, freq, when, dur, vol, this.sfxBus);
  }

  private noiseHit(when: number, dur: number, vol: number, cutoff: number): void {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    src.start(when, Math.random() * 0.5, dur + 0.02);
  }
}

/** Module singleton — scenes import this directly. */
export const audio = new AudioEngine();
