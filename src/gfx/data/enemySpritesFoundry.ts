/**
 * COGLAR FOUNDRY enemy cast (World 6) — the E/T/O/A archetypes as the Rust's
 * own machines: dead iron, oxide plating, one molten eye apiece. Nothing
 * here was ever alive.
 *
 *   E  GEARLOUSE   — a crawling cog, teeth for legs
 *   T  PISTON JACK — a spring-loaded cylinder that leaps at warmth
 *   O  BOLT DRONE  — a riveted orb on stubby tin wings
 *   A  GRINDWHEEL  — a rolling gear with a molten hub (armored)
 *
 * Same frame keys and dimensions as every world's enemy sheet.
 */

const LOUSE_0 = [
  '................',
  '....KKKKKKKK....',
  '..KKSSSSSSSSKK..',
  '.KSSKSSSSKSSSSK.',
  '.KSSSSoOoSSSSSK.',
  'KKSSKSSSSSKSSSKK',
  'KKKKKKKKKKKKKKKK',
  '.K.KsK.KsK.KsK..',
  '..KsK.KsK.KsK...',
  '.K.K..K.K.K.K...',
  '..K...K...K.....',
  '................',
];
const LOUSE_1 = [
  '................',
  '....KKKKKKKK....',
  '..KKSSSSSSSSKK..',
  '.KSSSSKSSSSKSSK.',
  '.KSSSSOoOSSSSSK.',
  'KKSSKSSSSSKSSSKK',
  'KKKKKKKKKKKKKKKK',
  '..KsK.KsK.KsK.K.',
  '...KsK.KsK.KsK..',
  '...K.K.K.K..K.K.',
  '.....K...K...K..',
  '................',
];
const LOUSE_FLAT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.KKKKKKKKKKKKK..',
  'KSSKSSoOoSSKSSK.',
  'KKKKKKKKKKKKKKK.',
  '................',
];

const JACK_SIT = [
  '................',
  '.....KKKKKK.....',
  '....KxxxxxxK....',
  '....KKKKKKKK....',
  '....KSSSSSSK....',
  '...KSSoOoSSSK...',
  '...KSSOWOSSSK...',
  '...KSSoOoSSSK...',
  '...KSSSSSSSSK...',
  '....KSSSSSSK....',
  '....KKKKKKKK....',
  '....KsKKKKsK....',
  '....KsK..KsK....',
  '....KKK..KKK....',
];
const JACK_LEAP = [
  '.....KKKKKK.....',
  '....KxxxxxxK....',
  '....KKKKKKKK....',
  '....KSSSSSSK....',
  '...KSSoOoSSSK...',
  '...KSSOWOSSSK...',
  '...KSSoOoSSSK...',
  '...KSSSSSSSSK...',
  '....KSSSSSSK....',
  '....KKKKKKKK....',
  '.....KsKKsK.....',
  '.....KsKKsK.....',
  '....KsK..KsK....',
  '...KKK....KKK...',
];

const DRONE_0 = [
  '..................',
  'KKK............KKK',
  'KssKK........KKssK',
  'KssssKK..KK..KssdK',
  '.KKssssKKSSKKsssK.',
  '..KKKssKSSSSKssK..',
  '.....KKSSSSSSKK...',
  '.....KSKSSSSKSK...',
  '.....KSSoOoSSSK...',
  '.....KSSOWOSSSK...',
  '.....KSSoOoSSSK...',
  '......KSSSSSSK....',
  '......KKSSSSK.....',
  '.......KKxKK......',
  '........KxK.......',
  '..................',
];
const DRONE_1 = [
  '..................',
  '..................',
  '..................',
  '.KKK..........KKK.',
  '.KssKK......KKssK.',
  '.KssssKKSSKKssssK.',
  '..KKssKSSSSKssKK..',
  '....KKSSSSSSKK....',
  '.....KSKSSSSKSK...',
  '.....KSSoOoSSSK...',
  '.....KSSOWOSSSK...',
  '.....KSSoOoSSSK...',
  '......KSSSSSSK....',
  '......KKSSSSK.....',
  '.......KKxKK......',
  '..................',
];
const DRONE_DIVE = [
  '..................',
  '.......KKKK.......',
  '......KSSSSK......',
  '......KSooSK......',
  '.....KKSSSSKK.....',
  '....KsKSSSSKsK....',
  '...KssKSooSKssK...',
  '..KssK.KSSK.KssK..',
  '..KKK..KSSK..KKK..',
  '.......KSSK.......',
  '.......KSxK.......',
  '.......KSSK.......',
  '........KxK.......',
  '........KKK.......',
  '.........K........',
  '..................',
];

const GRIND_0 = [
  '...K...K...K..',
  '..KKKSKSKKK...',
  '.KKSSSSSSSKK..',
  'KKSSKSSSKSSKK.',
  '.KSSSSSSSSSK..',
  'KSSSSoOoSSSSK.',
  'KSKSSOWOSSKSK.',
  'KSSSSoOoSSSSK.',
  '.KSSSSSSSSSK..',
  'KKSSKSSSKSSKK.',
  '.KKSSSSSSSKK..',
  '..KKKSKSKKK...',
  '...K...K...K..',
  '..............',
];
const GRIND_1 = [
  '.K...K...K....',
  '..KKKSKSKKK...',
  '.KKSKSSSKSKK..',
  'KKSSSSSSSSSKK.',
  '.KSSKSSSKSSK..',
  'KSSSSoOoSSSSK.',
  'KSKSSOWOSSKSK.',
  'KSSSSoOoSSSSK.',
  '.KSSKSSSKSSK..',
  'KKSSSSSSSSSKK.',
  '.KKSKSSSKSKK..',
  '..KKKSKSKKK...',
  '.K...K...K....',
  '..............',
];

export const ENEMY_FRAMES_FOUNDRY: Record<string, string[][]> = {
  beetle_walk: [LOUSE_0, LOUSE_1],
  beetle_flat: [LOUSE_FLAT],
  toad_sit: [JACK_SIT],
  toad_leap: [JACK_LEAP],
  owl_fly: [DRONE_0, DRONE_1],
  owl_dive: [DRONE_DIVE],
  burr_roll: [GRIND_0, GRIND_1],
};
