// EMBERWILDS — RIMEFELL: a crystalline music-box piece in E minor, 100 bpm,
// 128 steps (8 bars). The lead is a short-gated high square — bell strikes,
// not sustained notes — over slow chord tones and a soft, walking triangle.
// Harmony: Em-C-G-D | Em-C-Am-B7; the B7 bar's D# is the cold glint that
// pulls the loop home.

const L1 = [76, 0, 79, 0, 83, 0, 88, 0, 0, 0, 83, 0, 79, 0, 0, 0]; // Em bells up: E5 G5 B5 E6, B5 G5
const L2 = [72, 0, 76, 0, 79, 0, 84, 0, 0, 0, 79, 0, 76, 0, 0, 0]; // C bells: C5 E5 G5 C6, G5 E5
const L3 = [86, 0, 0, 0, 83, 0, 79, 0, 81, 0, 83, 0, 79, 0, 0, 0]; // G: D6 B5 G5 A5 B5 G5
const L4 = [78, 0, 81, 0, 74, 0, 0, 0, 78, 0, 74, 0, 69, 0, 0, 0]; // D half close: F#5 A5 D5 F#5 D5 A4
const L5 = [88, 0, 0, 0, 86, 0, 83, 0, 79, 0, 83, 0, 88, 0, 0, 0]; // lift: E6 D6 B5 G5 B5 E6
const L6 = [84, 0, 83, 0, 81, 0, 79, 0, 0, 0, 76, 0, 79, 0, 81, 0]; // C falling: C6 B5 A5 G5, E5 G5 A5
const L7 = [81, 0, 84, 0, 88, 0, 84, 0, 81, 0, 0, 0, 76, 0, 81, 0]; // Am: A5 C6 E6 C6 A5, E5 A5
const L8 = [83, 0, 0, 0, 78, 0, 75, 0, 71, 0, 75, 0, 71, 0, 0, 0]; // B7 glint: B5 F#5 D#5 B4 D#5 B4

const H1 = [64, 0, 0, 0, 71, 0, 0, 0, 0, 0, 67, 0, 64, 0, 0, 0]; // Em tones
const H2 = [64, 0, 0, 0, 72, 0, 0, 0, 0, 0, 67, 0, 64, 0, 0, 0]; // C tones
const H3 = [62, 0, 0, 0, 71, 0, 0, 0, 67, 0, 0, 0, 62, 0, 0, 0]; // G tones
const H4 = [66, 0, 0, 0, 69, 0, 0, 0, 62, 0, 0, 0, 57, 0, 0, 0]; // D tones
const H5 = [64, 0, 0, 0, 71, 0, 0, 0, 0, 0, 67, 0, 64, 0, 0, 0];
const H6 = [72, 0, 0, 0, 67, 0, 0, 0, 64, 0, 0, 0, 60, 0, 0, 0]; // C descending
const H7 = [69, 0, 0, 0, 72, 0, 0, 0, 64, 0, 0, 0, 60, 0, 0, 0]; // Am tones
const H8 = [71, 0, 0, 0, 66, 0, 0, 0, 63, 0, 0, 0, 59, 0, 0, 0]; // B7 tones

// soft walking triangle — root, answering fifth, never hurried
const BEm = [40, 0, 0, 0, 0, 0, 47, 0, 0, 0, 40, 0, 47, 0, 0, 0];
const BC = [36, 0, 0, 0, 0, 0, 43, 0, 0, 0, 36, 0, 43, 0, 0, 0];
const BG = [43, 0, 0, 0, 0, 0, 50, 0, 0, 0, 43, 0, 38, 0, 0, 0];
const BD = [38, 0, 0, 0, 0, 0, 45, 0, 0, 0, 38, 0, 45, 0, 0, 0];
const BAm = [45, 0, 0, 0, 0, 0, 52, 0, 0, 0, 45, 0, 40, 0, 0, 0];
const BB = [35, 0, 0, 0, 0, 0, 42, 0, 0, 0, 47, 0, 51, 0, 0, 0];

// brushed, sparse — snowfall percussion
const P = [40, 0, 0, 0, 0, 0, 90, 0, 0, 0, 0, 0, 90, 0, 0, 0];
const P8 = [40, 0, 0, 0, 0, 0, 90, 0, 70, 0, 0, 90, 0, 90, 0, 90];

export const RIME_SONG = {
  bpm: 100,
  length: 128,
  tracks: [
    {
      wave: 'square',
      volume: 0.42,
      gate: 0.28,
      notes: [...L1, ...L2, ...L3, ...L4, ...L5, ...L6, ...L7, ...L8],
    },
    {
      wave: 'square',
      volume: 0.16,
      gate: 0.6,
      notes: [...H1, ...H2, ...H3, ...H4, ...H5, ...H6, ...H7, ...H8],
    },
    {
      wave: 'triangle',
      volume: 0.55,
      gate: 0.8,
      notes: [...BEm, ...BC, ...BG, ...BD, ...BEm, ...BC, ...BAm, ...BB],
    },
    {
      wave: 'noise',
      volume: 0.12,
      gate: 0.1,
      notes: [...P, ...P, ...P, ...P, ...P, ...P, ...P, ...P8],
    },
  ],
};
