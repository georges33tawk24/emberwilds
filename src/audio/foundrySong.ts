// EMBERWILDS — COGLAR FOUNDRY: the Rust's heart. F minor, 116 bpm, 128 steps
// (8 bars) — a relentless machine: hammering bass ostinato in constant
// eighths, a stabbing two-note lead figure like an alarm, and a percussion
// line that never stops working. Harmony: Fm-Fm-Db-C | Fm-Ab-Db-C, the C
// major bars snarling with the E natural.

const L1 = [77, 0, 0, 0, 80, 0, 77, 0, 0, 0, 84, 0, 80, 0, 77, 0]; // stab: F5 Ab5 F5, C6 Ab5 F5
const L2 = [77, 0, 0, 0, 80, 0, 84, 0, 85, 0, 84, 0, 80, 0, 77, 0]; // rise: F5 Ab5 C6 Db6 C6 Ab5 F5
const L3 = [73, 0, 0, 0, 77, 0, 73, 0, 0, 0, 80, 0, 77, 0, 73, 0]; // Db: Db5 F5 Db5, Ab5 F5 Db5
const L4 = [72, 0, 76, 0, 79, 0, 76, 0, 72, 0, 0, 0, 67, 0, 72, 0]; // C snarl: C5 E5 G5 E5 C5, G4 C5
const L5 = [89, 0, 0, 0, 88, 0, 84, 0, 80, 0, 84, 0, 88, 0, 0, 0]; // lift: F6 E6 C6 Ab5 C6 E6
const L6 = [80, 0, 84, 0, 87, 0, 84, 0, 80, 0, 77, 0, 80, 0, 84, 0]; // Ab: Ab5 C6 Eb6 C6 Ab5 F5 Ab5 C6
const L7 = [85, 0, 84, 0, 80, 0, 77, 0, 73, 0, 77, 0, 80, 0, 84, 0]; // Db run down and up
const L8 = [84, 0, 0, 0, 79, 0, 76, 0, 72, 0, 76, 0, 79, 0, 83, 0]; // C: C6 G5 E5 C5 E5 G5 B5 -> F

const H1 = [0, 0, 65, 0, 0, 0, 65, 0, 0, 0, 68, 0, 0, 0, 65, 0]; // F4/Ab4 anvil answers
const H2 = [0, 0, 65, 0, 0, 0, 68, 0, 0, 0, 72, 0, 68, 0, 65, 0];
const H3 = [0, 0, 61, 0, 0, 0, 65, 0, 0, 0, 68, 0, 65, 0, 61, 0]; // Db4 F4 Ab4
const H4 = [0, 0, 64, 0, 0, 0, 67, 0, 0, 0, 64, 0, 60, 0, 64, 0]; // E4 G4 C4
const H5 = [0, 0, 77, 0, 0, 0, 76, 0, 0, 0, 72, 0, 68, 0, 72, 0];
const H6 = [0, 0, 68, 0, 0, 0, 72, 0, 0, 0, 75, 0, 72, 0, 68, 0]; // Ab4 C5 Eb5
const H7 = [0, 0, 73, 0, 0, 0, 68, 0, 0, 0, 65, 0, 68, 0, 73, 0];
const H8 = [0, 0, 72, 0, 0, 0, 67, 0, 0, 0, 64, 0, 67, 0, 71, 0];

// the machine: constant eighth-note ostinato, root hammering with a fifth
// kick on the back half of every bar
const BFm = [41, 0, 41, 0, 41, 0, 48, 0, 41, 0, 41, 0, 48, 0, 41, 41];
const BDb = [37, 0, 37, 0, 37, 0, 44, 0, 37, 0, 37, 0, 44, 0, 37, 37];
const BC = [36, 0, 36, 0, 36, 0, 43, 0, 36, 0, 36, 0, 43, 0, 35, 36];
const BAb = [44, 0, 44, 0, 44, 0, 51, 0, 44, 0, 44, 0, 51, 0, 44, 44];

// the works: kick, offbeat hats, snare on 2+4 with a grinding 16th push
const P = [40, 0, 90, 0, 70, 0, 90, 0, 40, 0, 90, 0, 70, 0, 90, 90];
const P8 = [40, 0, 90, 0, 70, 0, 70, 0, 40, 40, 70, 70, 70, 0, 70, 90];

export const FOUNDRY_SONG = {
  bpm: 116,
  length: 128,
  tracks: [
    {
      wave: 'square',
      volume: 0.48,
      gate: 0.4,
      notes: [...L1, ...L2, ...L3, ...L4, ...L5, ...L6, ...L7, ...L8],
    },
    {
      wave: 'square',
      volume: 0.2,
      gate: 0.3,
      notes: [...H1, ...H2, ...H3, ...H4, ...H5, ...H6, ...H7, ...H8],
    },
    {
      wave: 'triangle',
      volume: 0.62,
      gate: 0.7,
      notes: [...BFm, ...BFm, ...BDb, ...BC, ...BFm, ...BAb, ...BDb, ...BC],
    },
    {
      wave: 'noise',
      volume: 0.22,
      gate: 0.11,
      notes: [...P, ...P, ...P, ...P, ...P, ...P, ...P, ...P8],
    },
  ],
};
