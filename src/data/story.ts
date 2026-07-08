/**
 * All narrative text in one table — the single place story copy lives, kept
 * localization-ready (spec §14): scenes render these strings verbatim and
 * never hard-code prose. The 4×6 font has no apostrophe or colon — copy is
 * written without them.
 *
 * Canon: the Emberwilds run warm on the EMBER HEART, kept by PIP — a small
 * ember-sprite, its last keeper. BARON COGLAR seizes the Heart and takes Pip;
 * the wilds begin to rust and cool. Each world's boss holds a recovered SHARD.
 * The finale (World 6, Coglar Foundry) is a rescue AND a relighting.
 */

export interface IntroBeat {
  /** narration lines, revealed one at a time */
  lines: string[];
}

export const STORY = {
  intro: [
    {
      lines: ['THE WILDS RAN WARM ON ONE SMALL FLAME -', 'THE EMBER HEART, KEPT BY PIP,', 'ITS LAST LITTLE KEEPER.'],
    },
    {
      lines: ['THEN THE BARON CAME.', 'COGLAR TOOK THE HEART.', 'HE TOOK PIP.'],
    },
    {
      lines: ['THE WILDS BEGAN TO RUST AND COOL.', 'BUT ONE QUICK FOX', 'RAN TOWARD THE DARK.'],
    },
  ] satisfies IntroBeat[],

  /** shown once, on first entry into each world (keyed by theme) */
  worldEntry: {
    thornwood: ['SUNLIT WOODS, GROWING DIM.', 'RELIGHT THE BEACONS.'],
    canyon: ['THE RUST CRAWLS UP THE MESAS.', 'RUN FAST. RUN WARM.'],
    mossgrave: ['DROWNED HALLS, COLD AND GREEN.', 'A SHARD LIES DEEP BELOW.'],
    cinder: ['ASH FALLS LIKE SNOW UP HERE.', 'THE FOUNDRY SMOKE IS CLOSE NOW.'],
    rimefell: ['REAL SNOW NOW. COLD THAT BELONGS.', 'DO NOT STOP MOVING.'],
    foundry: ['THE HEART OF THE RUST.', 'PIP IS HERE. SO IS THE BARON.'],
  } as Record<string, string[]>,

  /** boss-level clear beat (replaces the standard tally header) */
  bossFall: {
    title: 'A SHARD RECLAIMED!',
    lines: ['A PIECE OF THE EMBER HEART, BURNING AGAIN.', 'SOMEWHERE FAR AWAY, PIP FELT IT.'],
  },

  /** finale after the last existing boss — swaps to the rescue when World 6 ships */
  finale: {
    title: 'THE BEACONS BURN AGAIN',
    lines: [
      'WARMTH FLOODS BACK ACROSS THE WILDS.',
      'BUT THE TRAIL OF SHARDS LEADS ON -',
      'TO THE FOUNDRY. TO THE BARON HIMSELF.',
      'PIP IS WAITING.',
    ],
    continues: 'THE JOURNEY CONTINUES...',
  },

  credits: [
    ['EMBERWILDS', 'O', 3],
    ['', 'W', 1],
    ['A WARM LITTLE ACTION PLATFORMER', 'c', 1],
    ['', 'W', 1],
    ['DESIGN, CODE, PIXEL ART', 't', 1],
    ['MUSIC AND SOUND', 't', 1],
    ['MADE FOR THIS GAME', 'W', 1],
    ['', 'W', 1],
    ['BUILT WITH PHASER', 't', 1],
    ['EVERY SPRITE, TILE AND NOTE', 't', 1],
    ['AUTHORED AS CODE', 't', 1],
    ['', 'W', 1],
    ['SORREL WILL RETURN', 'O', 2],
    ['', 'W', 1],
    ['THANK YOU FOR PLAYING', 'W', 2],
  ] as [string, string, number][],
} as const;
