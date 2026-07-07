/**
 * THE CINDERPEAKS enemy cast (World 4) — the E/T/O/A archetypes dressed for
 * the ash: things of fused slag and foundry cast-offs, iron greys with ember
 * light in the seams (No-Neon: every glow is fire, never LED).
 *
 *   E  SLAG CRAWLER — a low louse of fused slag plates, embers between them
 *   T  SOOT IMP     — a round little climber of packed soot, ash-tuft ears
 *   O  ASH KITE     — a ragged bird of torn sheet-metal riding the updrafts
 *   A  CLINKER BURR — a rolling clinker ball, cracks glowing from inside
 *
 * Same frame keys and dimensions as every world's enemy sheet.
 */

const CRAWLER_0 = [
  '................',
  '....KKKKKKKK....',
  '..KKssssssssKK..',
  '.KssSSdSSSSSssK.',
  '.KsSSSoSSSdSSsK.',
  'KKSSdSSSoSSSdSKK',
  'KKKKKKKKKKKKKKKK',
  'K.KsK.KsK.KsK.K.',
  '..KsK..KsK..KsK.',
  '..K.K..K.K..K.K.',
  '..K....K.....K..',
  '................',
];
const CRAWLER_1 = [
  '................',
  '....KKKKKKKK....',
  '..KKssssssssKK..',
  '.KssSSoSSSSSssK.',
  '.KsSSSdSSSoSSsK.',
  'KKSSoSSSdSSSoSKK',
  'KKKKKKKKKKKKKKKK',
  '.K.KsK.KsK.KsK.K',
  '.KsK..KsK..KsK..',
  '.K.K..K.K..K.K..',
  '..K.....K....K..',
  '................',
];
const CRAWLER_FLAT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.KKKKKKKKKKKKKK.',
  'KssSSdSoSSdSSssK',
  'KKKKKKKKKKKKKKKK',
  '................',
];

const IMP_SIT = [
  '................',
  '......s..s......',
  '.....KsKKsK.....',
  '....KSSSSSSK....',
  '...KSSSSSSSSK...',
  '..KSSoKSSoKSSK..',
  '..KSSSSSSSSSSK..',
  '..KSdSSSSSSdSK..',
  '..KSSSSSSSSSSK..',
  '...KSSSSSSSSK...',
  '...KSSKKKKSSK...',
  '....KSSSSSSK....',
  '....KsK..KsK....',
  '....KK....KK....',
];
const IMP_LEAP = [
  '..K..........K..',
  '..KsK......KsK..',
  '...KsK.ss.KsK...',
  '....KSKssKSK....',
  '....KSSSSSSK....',
  '...KSoKSSoKSK...',
  '...KSSSSSSSSK...',
  '...KSdSSSSdSK...',
  '...KSSSSSSSSK...',
  '....KSSSSSSK....',
  '....KSSSSSSK....',
  '.....KSSSSK.....',
  '....KsK..KsK....',
  '...KK......KK...',
];

const KITE_0 = [
  '..................',
  'KK..............KK',
  'KSKK..........KKSK',
  'KSSSKK..KKK..KKSSK',
  '.KSSSSKKxxxKKSSSK.',
  '..KKSSKoxoxoKSSK..',
  '....KKSsssssSKK...',
  '.....KSoSSSoSK....',
  '.....KSSSSSSSK....',
  '.....KSvSSvSSK....',
  '.....KSSSSSSSK....',
  '......KSvSSvK.....',
  '.......KSSSK......',
  '.......KKxKK......',
  '........K.K.......',
  '..................',
];
const KITE_1 = [
  '..................',
  '..................',
  '..................',
  '.KK............KK.',
  '.KSKK........KKSK.',
  '.KSSSKK.KKK.KKSSK.',
  '..KSSSSKxxxKSSSK..',
  '...KKSSoxoxoSSKK..',
  '....KKSsssssSKK...',
  '.....KSoSSSoSK....',
  '.....KSSSSSSSK....',
  '......KSvSSvK.....',
  '.......KSSSK......',
  '.......KKxKK......',
  '........K.K.......',
  '..................',
];
const KITE_DIVE = [
  '..................',
  '.......KKKK.......',
  '......KSSSSK......',
  '......KSooSK......',
  '.....KKSSSSKK.....',
  '....KSKSSSSKSK....',
  '...KSSKSssSKSSK...',
  '..KSSK.KssK.KSSK..',
  '..KKK..KSSK..KKK..',
  '.......KSSK.......',
  '.......KSvK.......',
  '.......KSSK.......',
  '........KxK.......',
  '........KKK.......',
  '.........K........',
  '..................',
];

const BURR_0 = [
  '...o...K..o...',
  '.o.KKKSKSKK...',
  '..KKSSdSSKK...',
  '.KSSKSSSKSSK..',
  '.KSdSSoSSSdK..',
  'KSSSoSSSoSSSK.',
  'KSdSSSKSSSdSK.',
  'KSSSoSSSoSSSK.',
  '.KSdSSoSSdSK..',
  '.KSSKSSSKSSK..',
  '..KKSSdSSKK...',
  '.o..KKSKK..o..',
  '...o..K..o....',
  '..............',
];
const BURR_1 = [
  '...o..K...o...',
  '...KKSKSKK..o.',
  '..KKSSoSSKK...',
  '.KSSKSSSKSSK..',
  '.KSoSSdSSSoK..',
  'KSSSdSSSdSSSK.',
  'KSoSSSKSSSoSK.',
  'KSSSdSSSdSSSK.',
  '.KSoSSdSSoSK..',
  '.KSSKSSSKSSK..',
  '..KKSSoSSKK...',
  '....KKSKK.o...',
  '..o...K...o...',
  '..............',
];

export const ENEMY_FRAMES_ASH: Record<string, string[][]> = {
  beetle_walk: [CRAWLER_0, CRAWLER_1],
  beetle_flat: [CRAWLER_FLAT],
  toad_sit: [IMP_SIT],
  toad_leap: [IMP_LEAP],
  owl_fly: [KITE_0, KITE_1],
  owl_dive: [KITE_DIVE],
  burr_roll: [BURR_0, BURR_1],
};
