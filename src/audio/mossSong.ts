/**
 * Mossgrave Ruins theme — slow, ancient, mysterious. A haunting D-minor line
 * over a deep root-fifth bass and a soft chord pad; sparse, cavernous
 * percussion. Warm and melodic, never harsh (spec §10).
 */
export const MOSS_SONG = {
  bpm: 96,
  length: 64,
  tracks: [
    {
      // haunting lead (soft triangle), lots of space
      wave: 'triangle',
      volume: 0.5,
      gate: 0.7,
      notes: [
        74, 0, 0, 72, 0, 0, 70, 0, 69, 0, 0, 67, 0, 65, 0, 0,
        65, 0, 67, 0, 69, 0, 0, 70, 0, 69, 0, 67, 0, 0, 65, 0,
        62, 0, 0, 65, 0, 69, 0, 0, 74, 0, 72, 0, 70, 0, 0, 0,
        69, 0, 0, 67, 65, 0, 64, 0, 62, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    {
      // soft chord pad (quiet square stabs at bar/half-bar)
      wave: 'square',
      volume: 0.13,
      gate: 0.9,
      notes: [
        62, 0, 0, 0, 0, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0,
        58, 0, 0, 0, 0, 0, 0, 0, 65, 0, 0, 0, 0, 0, 0, 0,
        65, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0,
        69, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    {
      // deep root-fifth bass, one chord per bar: Dm - Bb - F - A
      wave: 'triangle',
      volume: 0.6,
      gate: 0.85,
      notes: [
        38, 0, 45, 0, 38, 0, 45, 0, 38, 0, 45, 0, 38, 0, 45, 0,
        34, 0, 41, 0, 34, 0, 41, 0, 34, 0, 41, 0, 34, 0, 41, 0,
        41, 0, 48, 0, 41, 0, 48, 0, 41, 0, 48, 0, 41, 0, 48, 0,
        33, 0, 40, 0, 33, 0, 40, 0, 33, 0, 40, 0, 45, 0, 40, 0,
      ],
    },
    {
      // cavernous percussion — low pulse + sparse drips
      wave: 'noise',
      volume: 0.16,
      gate: 0.12,
      notes: [
        40, 0, 0, 0, 92, 0, 0, 0, 40, 0, 0, 0, 92, 0, 90, 0,
        40, 0, 0, 0, 92, 0, 0, 0, 40, 0, 0, 0, 92, 0, 90, 0,
        40, 0, 0, 0, 92, 0, 0, 0, 40, 0, 0, 0, 92, 0, 90, 0,
        40, 0, 0, 0, 92, 0, 0, 0, 40, 0, 90, 0, 92, 0, 90, 0,
      ],
    },
  ],
};
