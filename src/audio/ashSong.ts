// EMBERWILDS — THE CINDERPEAKS: a smoldering foundry march in D minor.
// 108 bpm, 128 steps (8 bars), heavier and slower than the canyon's gallop.
// Harmony: Dm-Bb-Gm-A (i-VI-iv-V) bars 1-4; Dm-F-Gm-A bars 5-8 — the F major
// bar is the one shaft of light through the smoke before the drive home.
//
// Lead motif: a hammered march call on D5 rising to A5 (bar 1), answered by a
// falling line off Bb (bar 2). Bars 3-4 restate the call from G and half-
// cadence on A with a C# glint. Bars 5-6 lift to D6 and ease through the F
// bar; bar 7 drives stepwise eighths D6-ward; bar 8 cadences C#6-A5-E5 and
// falls to A4, resolving to D on the loop.

const L1 = [74, 0, 0, 74, 77, 0, 81, 0, 0, 0, 81, 0, 79, 0, 77, 0]; // D5 D5 F5 A5, A5 G5 F5
const L2 = [70, 0, 0, 0, 77, 0, 76, 0, 74, 0, 72, 0, 74, 0, 0, 0]; // Bb4, F5 E5 D5 C5 D5
const L3 = [79, 0, 0, 79, 82, 0, 86, 0, 0, 0, 84, 0, 82, 0, 79, 0]; // G5 G5 Bb5 D6, C6 Bb5 G5
const L4 = [81, 0, 0, 0, 76, 0, 0, 0, 73, 0, 0, 0, 69, 0, 0, 0]; // A5 E5 C#5 A4 half cadence
const L5 = [86, 0, 0, 86, 84, 0, 82, 0, 81, 0, 82, 0, 84, 0, 0, 0]; // lift: D6 D6 C6 Bb5 A5 Bb5 C6
const L6 = [81, 0, 77, 0, 84, 0, 81, 0, 0, 0, 79, 0, 77, 0, 76, 0]; // F-bar light: A5 F5 C6 A5, G5 F5 E5
const L7 = [79, 0, 81, 0, 82, 0, 84, 0, 86, 0, 84, 0, 82, 0, 81, 0]; // drive: G5 A5 Bb5 C6 D6 C6 Bb5 A5
const L8 = [85, 0, 0, 0, 81, 0, 76, 0, 73, 0, 76, 0, 69, 0, 0, 0]; // cadence: C#6 A5 E5 C#5 E5 A4

const H1 = [0, 0, 0, 0, 74, 0, 77, 0, 0, 0, 77, 0, 76, 0, 74, 0]; // thirds under the call
const H2 = [65, 0, 0, 0, 74, 0, 72, 0, 70, 0, 69, 0, 70, 0, 0, 0]; // F4 root, line under answer
const H3 = [74, 0, 0, 74, 79, 0, 82, 0, 0, 0, 79, 0, 77, 0, 74, 0]; // D5/G5 under the restatement
const H4 = [76, 0, 0, 0, 73, 0, 0, 0, 69, 0, 0, 0, 64, 0, 0, 0]; // E5 C#5 A4 E4 settle
const H5 = [0, 0, 0, 0, 81, 0, 79, 0, 77, 0, 79, 0, 81, 0, 0, 0]; // thirds under the lift
const H6 = [77, 0, 74, 0, 81, 0, 77, 0, 0, 0, 76, 0, 74, 0, 72, 0]; // F5 D5 A5 F5, E5 D5 C5
const H7 = [0, 0, 77, 0, 79, 0, 81, 0, 82, 0, 81, 0, 79, 0, 77, 0]; // parallel thirds, drive
const H8 = [81, 0, 0, 0, 76, 0, 73, 0, 69, 0, 73, 0, 64, 0, 0, 0]; // A5 E5 C#5 A4 C#5 E4

// Triangle bass: a foundry march — root hammered, fifth answering, a 16th
// anvil push at each bar's end. A2 walks chromatically (C#3) in the V bars.
const BDm = [38, 0, 0, 38, 45, 0, 38, 0, 38, 0, 45, 0, 38, 0, 38, 38];
const BBb = [34, 0, 0, 34, 41, 0, 34, 0, 34, 0, 41, 0, 34, 0, 34, 34];
const BGm = [43, 0, 0, 43, 50, 0, 43, 0, 43, 0, 50, 0, 43, 0, 43, 43];
const BA = [45, 0, 0, 45, 52, 0, 45, 0, 49, 0, 52, 0, 45, 0, 45, 45];
const BF = [41, 0, 0, 41, 48, 0, 41, 0, 41, 0, 48, 0, 41, 0, 41, 41];
const BA8 = [45, 0, 0, 45, 52, 0, 49, 0, 45, 0, 43, 0, 40, 0, 38, 38]; // walk down into the loop

// Anvil beat: kick(40) on 1+3, snare-anvil(70) on 2+4, sparse hats(90).
const P = [40, 0, 90, 0, 70, 0, 0, 0, 40, 0, 90, 0, 70, 0, 0, 90];
const P8 = [40, 0, 90, 0, 70, 0, 70, 0, 40, 0, 70, 70, 70, 0, 70, 90]; // bar-8 fill

export const ASH_SONG = {
  bpm: 108,
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
      notes: [...BDm, ...BBb, ...BGm, ...BA, ...BDm, ...BF, ...BGm, ...BA8],
    },
    {
      wave: 'noise',
      volume: 0.2,
      gate: 0.12,
      notes: [...P, ...P, ...P, ...P, ...P, ...P, ...P, ...P8],
    },
  ],
};
