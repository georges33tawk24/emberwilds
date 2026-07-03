/**
 * Chiptune sequencer data format.
 *
 * A Song is a loop of `length` sixteenth-note steps. Each track holds one
 * voice; `notes[i]` is a MIDI note number (60 = middle C) sounding at step i,
 * or 0 for a rest. Percussion tracks use wave 'noise' where the note number
 * only selects the noise color (higher = brighter/shorter).
 */
export interface SongTrack {
  wave: 'square' | 'triangle' | 'sawtooth' | 'noise';
  /** 0..1 relative mix for this track */
  volume: number;
  /** length must equal Song.length; 0 = rest */
  notes: number[];
  /** note length as a fraction of one step (0.15 = staccato, 0.9 = legato) */
  gate?: number;
}

export interface Song {
  bpm: number;
  /** total steps in the loop (sixteenth notes) */
  length: number;
  tracks: SongTrack[];
}
