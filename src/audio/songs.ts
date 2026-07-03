// EMBERWILDS chiptune score — warm storybook forest, G major throughout.
// Songs are step-sequenced in sixteenth notes; 0 = rest, otherwise MIDI pitch.

// ---------------------------------------------------------------------------
// THORNWOOD_SONG — 112bpm, 8 bars (128 steps), I-IV-vi-V in G (G / C / Em / D)
// Lead: rising-arpeggio hook (G B D ~ E D B), sequenced up a 4th over C,
// developed over Em, half cadence on D (bar 4), octave lift bars 5-6 peaking
// on D6, descending V-bar turnaround (bar 8) that resolves on the loop.
// ---------------------------------------------------------------------------
export const THORNWOOD_SONG = {
  bpm: 112,
  length: 128,
  tracks: [
    {
      // lead square — the hummable tune
      wave: 'square',
      volume: 0.5,
      gate: 0.55,
      notes: [
        // bar 1 (G): hook — G4 B4 D5 . E5 D5 B4
        67, 0, 71, 0, 74, 0, 0, 0, 76, 0, 74, 0, 71, 0, 0, 0,
        // bar 2 (C): hook up a 4th — C5 E5 G5 . E5 D5 C5 D5
        72, 0, 76, 0, 79, 0, 0, 0, 76, 0, 74, 0, 72, 0, 74, 0,
        // bar 3 (Em): answer — B4 D5 E5 . G5 F#5 E5 D5
        71, 0, 74, 0, 76, 0, 0, 0, 79, 0, 78, 0, 76, 0, 74, 0,
        // bar 4 (D): half cadence + pickup — D5 . A4 B4 A4 . D5 E5
        74, 0, 0, 0, 69, 0, 71, 0, 69, 0, 0, 0, 74, 0, 76, 0,
        // bar 5 (G): lift — G5 . D5 G5 A5 . G5 A5
        79, 0, 0, 0, 74, 0, 79, 0, 81, 0, 0, 0, 79, 0, 81, 0,
        // bar 6 (C): peak — B5 A5 G5 . D6! C6 B5 A5
        83, 0, 81, 0, 79, 0, 0, 0, 86, 0, 84, 0, 83, 0, 81, 0,
        // bar 7 (Em): settle — G5 E5 D5 E5 B4 . E5 G5
        79, 0, 76, 0, 74, 0, 76, 0, 71, 0, 0, 0, 76, 0, 79, 0,
        // bar 8 (D): cadence run — F#5 E5 D5 C5 B4 A4 D5 (resolves to G on loop)
        78, 0, 76, 0, 74, 0, 72, 0, 71, 0, 69, 0, 74, 0, 0, 0,
      ],
    },
    {
      // harmony square — sparse thirds/sixths under the downbeats
      wave: 'square',
      volume: 0.22,
      gate: 0.5,
      notes: [
        // bar 1 (G): B3 under G4, G4 under E5
        59, 0, 0, 0, 0, 0, 0, 0, 67, 0, 0, 0, 0, 0, 0, 0,
        // bar 2 (C): E4 under C5, G4 under E5
        64, 0, 0, 0, 0, 0, 0, 0, 67, 0, 0, 0, 0, 0, 0, 0,
        // bar 3 (Em): D4 under B4 (Em7 color), E5 under G5
        62, 0, 0, 0, 0, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0,
        // bar 4 (D): F#4 under D5, then tacet
        66, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // bar 5 (G): B4 under G5, D5 under A5
        71, 0, 0, 0, 0, 0, 0, 0, 74, 0, 0, 0, 0, 0, 0, 0,
        // bar 6 (C): G5 under B5, tacet at the peak
        79, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // bar 7 (Em): E5 under G5, G4 under B4
        76, 0, 0, 0, 0, 0, 0, 0, 67, 0, 0, 0, 0, 0, 0, 0,
        // bar 8 (D): A4 under F#5, D4 under B4
        69, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    {
      // triangle bass — root/fifth per bar, walking pickups at bar ends
      wave: 'triangle',
      volume: 0.6,
      gate: 0.8,
      notes: [
        // bar 1 (G): G2/D3, B2 walks to C
        43, 0, 0, 0, 50, 0, 0, 0, 43, 0, 43, 0, 50, 0, 47, 0,
        // bar 2 (C): C3/G2, A2 walks toward Em
        48, 0, 0, 0, 43, 0, 0, 0, 48, 0, 48, 0, 43, 0, 45, 0,
        // bar 3 (Em): E2/B2, A2 walks toward D
        40, 0, 0, 0, 47, 0, 0, 0, 40, 0, 40, 0, 47, 0, 45, 0,
        // bar 4 (D): D3/A2, F#2 walks up to G
        50, 0, 0, 0, 45, 0, 0, 0, 50, 0, 50, 0, 45, 0, 42, 0,
        // bar 5 (G)
        43, 0, 0, 0, 50, 0, 0, 0, 43, 0, 43, 0, 50, 0, 47, 0,
        // bar 6 (C)
        48, 0, 0, 0, 43, 0, 0, 0, 48, 0, 48, 0, 43, 0, 45, 0,
        // bar 7 (Em)
        40, 0, 0, 0, 47, 0, 0, 0, 40, 0, 40, 0, 47, 0, 45, 0,
        // bar 8 (D): F#2 leads home to G on the loop
        50, 0, 0, 0, 45, 0, 0, 0, 50, 0, 50, 0, 45, 0, 42, 0,
      ],
    },
    {
      // noise percussion — kick on beats, hats offbeat, fills at phrase ends
      wave: 'noise',
      volume: 0.18,
      gate: 0.15,
      notes: [
        // bar 1: steady
        40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0,
        // bar 2: extra hat
        40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 90,
        // bar 3: steady
        40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0,
        // bar 4: rising fill into the lift
        40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 90, 40, 60, 75, 90,
        // bar 5: steady
        40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0,
        // bar 6: extra hat
        40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 90,
        // bar 7: steady
        40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 0,
        // bar 8: rising fill into the loop
        40, 0, 90, 0, 40, 0, 90, 0, 40, 0, 90, 90, 40, 60, 75, 90,
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// TITLE_SONG — 92bpm, 4 bars (64 steps): dawn over the forest.
// G / C / Em / D->G. Triangle lead floats up the tonic triad, answers over C,
// reaches G5-F#5 at the end of bar 3, and sighs back down to G4 as the bass
// resolves D -> G. Sustained square pad hums the chord thirds. No percussion.
// ---------------------------------------------------------------------------
export const TITLE_SONG = {
  bpm: 92,
  length: 64,
  tracks: [
    {
      // triangle lead — gentle, wondrous
      wave: 'triangle',
      volume: 0.5,
      gate: 0.7,
      notes: [
        // bar 1 (G): G4 B4 D5 B4 A4
        67, 0, 0, 0, 71, 0, 0, 0, 74, 0, 0, 0, 71, 0, 69, 0,
        // bar 2 (C): C5 E5 D5 C5 G4
        72, 0, 0, 0, 76, 0, 74, 0, 72, 0, 0, 0, 67, 0, 0, 0,
        // bar 3 (Em): E5 D5 B4 D5 G5 F#5 — the wonder lift
        76, 0, 0, 0, 74, 0, 71, 0, 74, 0, 0, 0, 79, 0, 78, 0,
        // bar 4 (D -> G): E5 D5 B4 A4 G4, rest — full cadence home
        76, 0, 74, 0, 71, 0, 69, 0, 67, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    {
      // soft square pad — sustained chord thirds
      wave: 'square',
      volume: 0.15,
      gate: 0.9,
      notes: [
        // bar 1 (G): B3
        59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59,
        // bar 2 (C): E4
        64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64,
        // bar 3 (Em): G3
        55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55,
        // bar 4 (D -> G): F#4 then B3
        66, 66, 66, 66, 66, 66, 66, 66, 59, 59, 59, 59, 59, 59, 59, 59,
      ],
    },
    {
      // triangle bass — slow half-note roots and fifths
      wave: 'triangle',
      volume: 0.5,
      gate: 0.9,
      notes: [
        // bar 1 (G): G2, D3
        43, 0, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0,
        // bar 2 (C): C3, G2
        48, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0,
        // bar 3 (Em): E2, B2
        40, 0, 0, 0, 0, 0, 0, 0, 47, 0, 0, 0, 0, 0, 0, 0,
        // bar 4 (D -> G): D3 resolving to G2
        50, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
  ],
};
