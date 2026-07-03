// EMBERWILDS — OCHRE CANYON: sun-baked mesa run, A minor with a dorian F# tang.
// 126 bpm, 128 steps (8 bars). Harmony rides the Andalusian cadence Am-G-F-E
// (i-VII-VI-V), one chord per bar, cadencing on E at bars 4 and 8.
//
// Lead motif: dotted-gallop call on A4 with a bold octave leap to A5 (bar 1),
// answered by a descending dorian phrase in bar 2 (G-F#-E-D-B). Bars 3-4
// sequence the call over F and half-cadence on E with a G# twang. Bars 5-6
// lift the whole idea up: the call restated from A5 peaks on E6, answered a
// third higher; bar 7 drives eighth-note F-lydian-ish arpeggios into the
// bar-8 full cadence (B5-G#5-E5) that resolves to A on the loop.

const L1 = [69, 0, 0, 69, 81, 0, 0, 0, 79, 0, 81, 0, 76, 0, 0, 0]; // call: A4..A4 -> A5 leap, G5 A5 E5
const L2 = [79, 0, 0, 78, 76, 0, 74, 0, 71, 0, 74, 0, 71, 0, 0, 0]; // answer: G5 F#5 E5 D5 B4 D5 B4
const L3 = [77, 0, 0, 77, 81, 0, 0, 0, 79, 0, 77, 0, 76, 0, 0, 0]; // call over F: F5 F5 A5, G5 F5 E5
const L4 = [74, 0, 71, 0, 76, 0, 0, 0, 80, 0, 0, 0, 76, 0, 0, 0]; // half cadence: D5 B4 E5 G#5 E5
const L5 = [81, 0, 0, 81, 84, 0, 0, 0, 88, 0, 84, 0, 81, 0, 0, 0]; // lift: A5 A5 C6, peak E6 C6 A5
const L6 = [86, 0, 0, 83, 81, 0, 79, 0, 78, 0, 79, 0, 74, 0, 0, 0]; // lift answer: D6 B5 A5 G5 F#5 G5 D5
const L7 = [77, 0, 79, 0, 81, 0, 84, 0, 81, 0, 84, 0, 86, 0, 84, 0]; // drive: F5 G5 A5 C6 A5 C6 D6 C6
const L8 = [83, 0, 0, 83, 80, 0, 76, 0, 80, 0, 0, 0, 71, 0, 76, 0]; // cadence: B5 B5 G#5 E5 G#5, B4 E5 -> A

const H1 = [0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0]; // sparse C5 under the leap
const H2 = [76, 0, 0, 74, 72, 0, 71, 0, 67, 0, 71, 0, 67, 0, 0, 0]; // parallel thirds under answer
const H3 = [69, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0]; // A4 / C5 touches over F
const H4 = [68, 0, 0, 0, 0, 0, 0, 0, 68, 0, 0, 0, 71, 0, 0, 0]; // held G#4 tension (E7 twang)
const H5 = [0, 0, 0, 0, 0, 0, 0, 0, 84, 0, 81, 0, 76, 0, 0, 0]; // thirds under the E6 peak
const H6 = [83, 0, 0, 79, 78, 0, 76, 0, 74, 0, 76, 0, 71, 0, 0, 0]; // parallel thirds, F#5 dorian color
const H7 = [65, 0, 0, 0, 0, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0]; // low F4 / A4 pulses
const H8 = [80, 0, 0, 80, 0, 0, 0, 0, 68, 0, 0, 0, 64, 0, 0, 0]; // G#5 thirds, then G#4-E4 settle

// Triangle gallop: root-root-fifth eighths with a 16th push at each bar's end.
const BAm = [45, 0, 45, 0, 52, 0, 45, 0, 45, 0, 52, 0, 45, 0, 45, 45];
const BG = [43, 0, 43, 0, 50, 0, 43, 0, 43, 0, 50, 0, 43, 0, 43, 43];
const BF = [41, 0, 41, 0, 48, 0, 41, 0, 41, 0, 48, 0, 41, 0, 41, 41];
const BE4 = [40, 0, 40, 0, 47, 0, 40, 0, 40, 0, 47, 0, 43, 0, 44, 44]; // walk-up G2 G#2 -> A2
const BE8 = [40, 0, 40, 0, 47, 0, 40, 0, 52, 0, 47, 0, 44, 0, 40, 40]; // E7 arp descent into loop

// Train beat: kick(40) on 1+3, snare(70) on 2+4, hats(90) on offbeat eighths.
const P = [40, 0, 90, 0, 70, 0, 90, 0, 40, 0, 90, 0, 70, 0, 90, 0];
const P8 = [40, 0, 90, 0, 70, 0, 90, 0, 40, 0, 70, 70, 70, 0, 70, 90]; // bar-8 snare fill

export const CANYON_SONG = {
  bpm: 126,
  length: 128,
  tracks: [
    {
      wave: 'square',
      volume: 0.5,
      gate: 0.5,
      notes: [...L1, ...L2, ...L3, ...L4, ...L5, ...L6, ...L7, ...L8],
    },
    {
      wave: 'square',
      volume: 0.2,
      gate: 0.45,
      notes: [...H1, ...H2, ...H3, ...H4, ...H5, ...H6, ...H7, ...H8],
    },
    {
      wave: 'triangle',
      volume: 0.6,
      gate: 0.75,
      notes: [...BAm, ...BG, ...BF, ...BE4, ...BAm, ...BG, ...BF, ...BE8],
    },
    {
      wave: 'noise',
      volume: 0.2,
      gate: 0.12,
      notes: [...P, ...P, ...P, ...P, ...P, ...P, ...P, ...P8],
    },
  ],
};
