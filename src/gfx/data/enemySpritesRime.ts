/**
 * RIMEFELL enemy cast (World 5) — the E/T/O/A archetypes as snowfield fauna:
 * warm little bodies against the cold (cream and warm-white fur, ember-dark
 * noses; only the hailstone is ice itself).
 *
 *   E  DRIFT VOLE  — a round fluffed vole plowing through the powder
 *   T  POWDER PIKA — a big-eared hopper, crouch-and-spring
 *   O  FROST OWL   — a pale hunter with horn tufts, silent glide
 *   A  HAILSTONE   — a rolling ball of rime ice, cracks glowing cold
 *
 * Same frame keys and dimensions as every world's enemy sheet.
 */

const VOLE_0 = [
  '................',
  '....KKKKKKK.....',
  '..KKWWWWWWWKK...',
  '.KWWcWWWWWWWWK..',
  'KdKWWWWWWcWWWWK.',
  'KKWWcWWWWWWWWWK.',
  '.KWWWWWcWWWWWKK.',
  '.KKWWWWWWWWWKK..',
  '..KscK..KscK....',
  '..KKK...KKK.....',
  '................',
  '................',
];
const VOLE_1 = [
  '................',
  '....KKKKKKK.....',
  '..KKWWWWWWWKK...',
  '.KWWWWcWWWWWWK..',
  'KdKWWWWWWWWcWWK.',
  'KKWWWWWcWWWWWWK.',
  '.KWWcWWWWWcWWKK.',
  '.KKWWWWWWWWWKK..',
  '...KscK.KscK....',
  '...KKK..KKK.....',
  '................',
  '................',
];
const VOLE_FLAT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.KKKKKKKKKKKKK..',
  'KWWcWWWWWcWWWWK.',
  'KKKKKKKKKKKKKKK.',
  '................',
  '................',
];

const PIKA_SIT = [
  '................',
  '....KK...KK.....',
  '...KcsK.KcsK....',
  '...KcsK.KcsK....',
  '....KcKKKcK.....',
  '...KKcccccKK....',
  '..KccWccccccK...',
  '..KcWKcccKccK...',
  '..KccccccccsK...',
  '..KcWWWWWccsK...',
  '..KccWWWcccsK...',
  '...KccccccsK....',
  '...KsK...KsK....',
  '...KK.....KK....',
];
const PIKA_LEAP = [
  '....KK...KK.....',
  '...KcsK.KcsK....',
  '...KcsK.KcsK....',
  '....KcKKKcK.....',
  '...KKcccccKK....',
  '..KccWccccccK...',
  '..KcWKcccKccK...',
  '..KccccccccsK...',
  '..KcWWWWWccsK...',
  '..KccWWWcccsK...',
  '...KcccccccK....',
  '....KccccsK.....',
  '...KsK...KsK....',
  '..KK.......KK...',
];

const OWL_0 = [
  '..................',
  'KK..............KK',
  'KWKK..........KKWK',
  'KWWWKK..KKK..KKWWK',
  '.KWWWWKKcWcKKWWWK.',
  '..KKWWKdWcWdKWWK..',
  '....KKWcccccWKK...',
  '.....KWdWWWdWK....',
  '.....KWWWWWWWK....',
  '.....KWiWWiWWK....',
  '.....KWWWWWWWK....',
  '......KWiWWiK.....',
  '.......KWWWK......',
  '.......KKsKK......',
  '........K.K.......',
  '..................',
];
const OWL_1 = [
  '..................',
  '..................',
  '..................',
  '.KK............KK.',
  '.KWKK........KKWK.',
  '.KWWWKK.KKK.KKWWK.',
  '..KWWWWKcWcKWWWK..',
  '...KKWWdWcWdWWKK..',
  '....KKWcccccWKK...',
  '.....KWdWWWdWK....',
  '.....KWWWWWWWK....',
  '......KWiWWiK.....',
  '.......KWWWK......',
  '.......KKsKK......',
  '........K.K.......',
  '..................',
];
const OWL_DIVE = [
  '..................',
  '.......KKKK.......',
  '......KWWWWK......',
  '......KWddWK......',
  '.....KKWWWWKK.....',
  '....KWKWWWWKWK....',
  '...KWWKWccWKWWK...',
  '..KWWK.KccK.KWWK..',
  '..KKK..KWWK..KKK..',
  '.......KWWK.......',
  '.......KWiK.......',
  '.......KWWK.......',
  '........KsK.......',
  '........KKK.......',
  '.........K........',
  '..................',
];

const HAIL_0 = [
  '...W...i..W...',
  '.W.KKKAKAKK...',
  '..KKAAiAAKK...',
  '.KAAKAAAKAAK..',
  '.KAiAAWAAAiK..',
  'KAAAWAAAWAAAK.',
  'KAiAAAKAAAiAK.',
  'KAAAWAAAWAAAK.',
  '.KAiAAWAAiAK..',
  '.KAAKAAAKAAK..',
  '..KKAAiAAKK...',
  '.W..KKAKK..W..',
  '...W..i..W....',
  '..............',
];
const HAIL_1 = [
  '...W..i...W...',
  '...KKAKAKK..W.',
  '..KKAAWAAKK...',
  '.KAAKAAAKAAK..',
  '.KAWAAiAAAWK..',
  'KAAAiAAAiAAAK.',
  'KAWAAAKAAAWAK.',
  'KAAAiAAAiAAAK.',
  '.KAWAAiAAWAK..',
  '.KAAKAAAKAAK..',
  '..KKAAWAAKK...',
  '....KKAKK.W...',
  '..W...i...W...',
  '..............',
];

export const ENEMY_FRAMES_RIME: Record<string, string[][]> = {
  beetle_walk: [VOLE_0, VOLE_1],
  beetle_flat: [VOLE_FLAT],
  toad_sit: [PIKA_SIT],
  toad_leap: [PIKA_LEAP],
  owl_fly: [OWL_0, OWL_1],
  owl_dive: [OWL_DIVE],
  burr_roll: [HAIL_0, HAIL_1],
};
