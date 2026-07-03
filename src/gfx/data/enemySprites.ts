/**
 * Thornwood enemies — warm-bodied woodland critters, facing right, feet on
 * the bottom row. Every silhouette telegraphs its counter: beetles squash,
 * toads leap, owls dive, thorn-burrs bristle "do not stomp".
 */

// amber-shelled beetle, 16×12 — walk shuffle
const BEETLE_0 = [
  '................',
  '.....KKKKKK.....',
  '...KKOOOOOOKK...',
  '..KOOWOOOOoOOK..',
  '..KOOOOOOOOoOK..',
  '.KOOOOOOOOOooOK.',
  '.KOoOOOOOOoooOK.',
  '.KKoooOOooooKKK.',
  '..KKKooooKKKKWK.',
  '..KbKKKKKKbKKK..',
  '.KbK.KbK.KbK....',
  '.KK..KK..KK.....',
];

const BEETLE_1 = [
  '................',
  '.....KKKKKK.....',
  '...KKOOOOOOKK...',
  '..KOOWOOOOoOOK..',
  '..KOOOOOOOOoOK..',
  '.KOOOOOOOOOooOK.',
  '.KOoOOOOOOoooOK.',
  '.KKoooOOooooKKK.',
  '..KKKooooKKKKWK.',
  '..KKbKKKKbKKKK..',
  '..KbK..KbK.KbK..',
  '..KK...KK...KK..',
];

const BEETLE_FLAT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..KKKKKKKKKKK...',
  '.KOOoOOOOooOOK..',
  'KKoooooooooooKK.',
  '.KKKKKKKKKKKKK..',
];

// mossy hop-toad, 16×14
const TOAD_SIT = [
  '................',
  '................',
  '................',
  '................',
  '...KK....KK.....',
  '..KWWK..KWWK....',
  '..KWKK..KWKK....',
  '.KggggggggggK...',
  'KgglgggggglggK..',
  'KglyyyyyyyylgK..',
  'KgyyyyyyyyyygK..',
  'KggyyyyyyyyggKK.',
  '.KgggKKKKgggKgK.',
  '..KKKK..KKKKKK..',
];

const TOAD_LEAP = [
  '................',
  '...KK....KK.....',
  '..KWWK..KWWK....',
  '..KWKK..KWKK....',
  '.KggggggggggK...',
  'KgglgggggglggK..',
  'KglyyyyyyyylgKK.',
  'KgyyyyyyyyyygKgK',
  'KggyyyyyyyyggKgK',
  '.KggggggggggKK..',
  '..KggK..KggK....',
  '..KgK....KgK....',
  '.KgK......KgK...',
  '.KK........KK...',
];

// tawny owl, 18×16 — fly (wings up / down) and dive
const OWL_FLY_0 = [
  '..................',
  'KK..............KK',
  'KbKK..........KKbK',
  'KbbbKK..KKK..KKbbK',
  '.KbbbbKKtttKKbbbK.',
  '..KKbbKtttttKbbK..',
  '....KKtWtttWtKK...',
  '.....KtWKttWKtK...',
  '.....KttttttttK...',
  '.....KtcKccKctK...',
  '.....KtcccccctK...',
  '......KtcccctK....',
  '.......KccccK.....',
  '.......KKttKK.....',
  '........KK.KK.....',
  '..................',
];

const OWL_FLY_1 = [
  '..................',
  '..................',
  '..................',
  '........KKK.......',
  '.......KtttK......',
  '......KtttttK.....',
  '.....KKtWtttWtKK..',
  '..KKKKtWKttWKtKKKK',
  'KKbbbbtttttttbbbbK',
  '.KbbbbtcKccKcbbbK.',
  '..KKbbtcccccbbKK..',
  '....KKtcccctKK....',
  '......KccccK......',
  '.......KKttKK.....',
  '........KK.KK.....',
  '..................',
];

const OWL_DIVE = [
  '..................',
  '..................',
  '.....KKtttKK......',
  '....KbbtttbbK.....',
  '...KbbbtttbbbK....',
  '..KbbbtttttbbbK...',
  '..KbbtWtttWtbbK...',
  '...KKtWKttWKtKK...',
  '.....KttttttttK...',
  '.....KtcKccKctK...',
  '......KtcccctK....',
  '......KccccccK....',
  '.......KccccK.....',
  '.......KttttK.....',
  '........KKKK......',
  '.........KK.......',
];

// thorn-burr, 14×14 — armored rolling seed ball, spikes all around
const BURR_0 = [
  '......K.......',
  '..K...Kt..K...',
  '..tK.KGGK.tK..',
  '...KGGggGGK...',
  '.KKGggggggGKK.',
  'KttGgglgggGttK',
  '..KGglllggGK..',
  'KttGggllggGttK',
  '.KKGggggggGKK.',
  '...KGGggGGK...',
  '..tK.KGGK.tK..',
  '..K...Kt..K...',
  '......K.......',
  '..............',
];

const BURR_1 = [
  '......K.......',
  '...K..Kt.K....',
  '..tK.KGGKtK...',
  '...KGGggGGK...',
  '.KKGggggggGKK.',
  'KttGgglggGGttK',
  '..KGgllgggGK..',
  'KttGgllgggGttK',
  '.KKGggggggGKK.',
  '...KGGggGGK...',
  '...tKKGGK.tK..',
  '...K..Kt..K...',
  '......K.......',
  '..............',
];

export const ENEMY_FRAMES: Record<string, string[][]> = {
  beetle_walk: [BEETLE_0, BEETLE_1],
  beetle_flat: [BEETLE_FLAT],
  toad_sit: [TOAD_SIT],
  toad_leap: [TOAD_LEAP],
  owl_fly: [OWL_FLY_0, OWL_FLY_1],
  owl_dive: [OWL_DIVE],
  burr_roll: [BURR_0, BURR_1],
};
