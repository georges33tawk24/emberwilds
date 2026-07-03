/**
 * Ochre Canyon enemy skins — same group keys and frame sizes as the forest
 * set so the engine swaps sheets by theme. Rock-crab (walker), dust-hare
 * (hopper), buzzard (flyer/diver), tumbleburr (armored roller). Warm desert
 * palette, facing right, feet on the bottom row.
 */

// rock-crab, 16×12 — a squat crab under a layered slickrock slab shell
const CRAB_0 = [
  '................',
  '..KKKKKKKKKKK...',
  '.KtttccttttbK...',
  '.KxbttttbbxxK...',
  '.KKxxbbxxxbKK...',
  'KKKKKKKKKKKKKK..',
  'K.KbK.KbK.KbK...',
  'K.KbK.KbK.KbK...',
  '..bK...bK..bK...',
  '.bK....Kb...Kb..',
  '.K......K....K..',
  '................',
];

const CRAB_1 = [
  '................',
  '..KKKKKKKKKKK...',
  '.KtttccttttbK...',
  '.KxbttttbbxxK...',
  '.KKxxbbxxxbKK...',
  'KKKKKKKKKKKKKK..',
  '.KbK.KbK.KbK.K..',
  '.KbK.KbK.KbK.K..',
  '.Kb...Kb...bK...',
  'Kb.....bK...bK..',
  'K.......K....K..',
  '................',
];

const CRAB_FLAT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..KKKKKKKKKKK...',
  '.KtccttttbbxK...',
  'KKxbttbbxxxbKK..',
  'KKKKKKKKKKKKKK..',
  '.K.K..K.K..K.K..',
  '................',
];

// dust-hare, 16×14 — sandy desert hare, ears folded, coiled to spring
const HARE_SIT = [
  '................',
  '.....K..........',
  '....KtK...KKK...',
  '....KtK..KttK...',
  '....KtKKKKtcK...',
  '...KKttttttcK...',
  '..KtWtttttccK...',
  '..KtWKttttcbK...',
  '..KtttttttbbK...',
  '..KtWWWWWttbK...',
  '..KttWWWtttbK...',
  '...KttttttbK....',
  '...KbK...KbK....',
  '...KK.....KK....',
];

const HARE_LEAP = [
  '.............K..',
  '............KtK.',
  '...........KtK..',
  'K.........KtcK..',
  '.KK.....KKKtcK..',
  '..KttttttttccK..',
  '.KtWttttttcccK..',
  'KtWKttttttccbK..',
  'KttttttttttbbK..',
  '.KtWWWWWWtttbK..',
  '..KKttttttbbK...',
  '..KbK...KbK.....',
  '.KbK.....KbK....',
  '.KK.......KK....',
];

// buzzard, 18×16 — dark vulture, bald head, wings up/down
const BUZZ_0 = [
  '..................',
  'KK..............KK',
  'KBKK..........KKBK',
  'KBBBKK..KKK..KKBBK',
  '.KBBBBKKPPPKKBBBK.',
  '..KKBBKePePeKBBK..',
  '....KKBWWWWWBKK...',
  '.....KBePePeBK....',
  '.....KBBBBBBBK....',
  '.....KBbBBbBbK....',
  '.....KBBBBBBBK....',
  '......KBbBBbK.....',
  '.......KBBBK......',
  '.......KKbKK......',
  '........K.K.......',
  '..................',
];

const BUZZ_1 = [
  '..................',
  '..................',
  '.........KKK......',
  '........KPPPK.....',
  '.......KePePeK....',
  '......KBWWWWWBK...',
  '...KKKBePePeBKKK..',
  'KKBBBBBBBBBBBBBBBK',
  '.KBBBBBbBBbBbBBBK.',
  '..KKBBBBBBBBBBKK..',
  '....KKBbBBbKKK....',
  '......KBBBK.......',
  '.......KBBK.......',
  '.......KKbKK......',
  '........K.K.......',
  '..................',
];

const BUZZ_DIVE = [
  '..................',
  '......KKPPPKK.....',
  '.....KBBPPPBBK....',
  '....KBBBePeBBBK...',
  '...KBBBWWWWWBBBK..',
  '...KBBePPPePBBBK..',
  '....KBBBBBBBBBK...',
  '.....KBBbBBbBK....',
  '......KBBBBBK.....',
  '......KBbBBBK.....',
  '.......KBBBK......',
  '.......KBBBK......',
  '........KBK.......',
  '........KBK.......',
  '.........K........',
  '..................',
];

// tumbleburr, 14×14 — a rolling tumbleweed tangle of dry thorns
const TUMBLE_0 = [
  '...c..K.c.....',
  '.c.KKtytK..c..',
  '..KtybbytK.K..',
  'c.KybttbbyK.c.',
  '.KtbtyybtybK..',
  'KytbyttbytybK.',
  '.KbyttbbtytbK.',
  'KytbyttbytbyK.',
  '.KtbtyybttbK..',
  'c.KybttbbyK.c.',
  '..KKtyybtKK...',
  '.c..KKtKK..c..',
  '...c..K..c....',
  '..............',
];

const TUMBLE_1 = [
  '..c...K..c....',
  '.c.KKtytKK.c..',
  '..KtbyybtK.K..',
  '.cKybttybyK.c.',
  'KtbtyybttybK..',
  '.KybttbyttbyK.',
  'KytbyttbbytbK.',
  '.KbtyybttbyK..',
  'KytbttyybtbK..',
  '.cKybttbbyKc..',
  '..KKtyybtKK...',
  '.c.KKtKKK.c...',
  '..c..K...c....',
  '..............',
];

export const ENEMY_FRAMES_CANYON: Record<string, string[][]> = {
  beetle_walk: [CRAB_0, CRAB_1],
  beetle_flat: [CRAB_FLAT],
  toad_sit: [HARE_SIT],
  toad_leap: [HARE_LEAP],
  owl_fly: [BUZZ_0, BUZZ_1],
  owl_dive: [BUZZ_DIVE],
  burr_roll: [TUMBLE_0, TUMBLE_1],
};
