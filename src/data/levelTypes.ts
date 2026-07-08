/**
 * Level authoring format — ASCII grids, parsed data-driven at load.
 *
 * TILE characters (become collision + rendered terrain):
 *   '.'  empty air
 *   '#'  earth (grass-topped where exposed; autotiled at render)
 *   'X'  stone block (solid, never breaks)
 *   '='  one-way wooden platform (jump through from below, stand on top)
 *   'C'  cracked block (breaks under a ground-pound)
 *   '^'  spikes (hazard, sits on the tile floor)
 *   'w'  water (passable; the player swims through it)
 *   'D'  locked door (solid until opened with a key)
 *   'H'  switch gate (solid until its switch is struck)
 *   'I'  ice block (solid; slippery top — momentum carries)
 *   '<'  conveyor belt, leftward (solid; the surface drags riders left)
 *   '>'  conveyor belt, rightward
 *
 * ENTITY characters (extracted from the grid at parse time; the tile
 * underneath becomes '.'):
 *   'P'  player start (exactly one per level)
 *   'K'  checkpoint post
 *   'F'  the Warmth Beacon — level goal (exactly one)
 *   'S'  spring pad
 *   'E'  beetle    (walker: patrols, turns at ledges/walls, stompable)
 *   'T'  hop-toad  (hops toward the player when near, stompable)
 *   'O'  owl       (flies a sine path; dives when the player is below)
 *   'A'  thorn-burr(armored: spiky, cannot be stomped, shoot it)
 *   '*'  gem (currency)
 *   'B'  berry (heals one heart)
 *   'M'  Ember Token (exactly 4 per level, hidden/skill-gated)
 *   'W'  Scatterburr weapon pickup (spread shot for the rest of the level)
 *   'e'  Ember flower (fire transformation: piercing burn shots)
 *   'z'  Frostbloom (ice transformation: freeze enemies into platforms)
 *   'h'  Gale seed (helicopter transformation: mid-air hover/climb)
 *   'j'  key (opens the next locked door 'D' on contact)
 *   'n'  switch (struck by a shot or a stomp; opens all gates 'H')
 *
 * Per-world enemy re-skins reuse the E/T/O/A archetypes (see the theme
 * registry): Mossgrave dresses them as moss-crawler / cave-hopper / bat /
 * moss-golem.
 */
export interface LevelEntity {
  type: string;
  /** tile coords */
  tx: number;
  ty: number;
}

export interface LevelDef {
  /** Display name shown on the intro card. */
  name: string;
  /** World key, e.g. 'thornwood'. Drives palette/parallax. */
  theme: string;
  /** ASCII rows. All rows must be the same length. */
  rows: string[];
  /** Ambient hint for the backdrop: 'day' | 'dawn' | 'dusk'. */
  daypart: 'day' | 'dawn' | 'dusk';
  /** Boss arena: 'Y' spawns the boss; clear triggers on its defeat. */
  boss?: boolean;
  /**
   * Water bodies as inclusive tile rects [x0, y0, x1, y1]. Water is a rendered
   * + physics REGION layered behind gameplay, not a tile — so gems, enemies,
   * and the player sit naturally *inside* it rather than replacing tiles.
   */
  water?: [number, number, number, number][];
}

export const TILE = 16;

export type Solidity =
  | 'empty' | 'solid' | 'oneway' | 'spike' | 'crack' | 'water' | 'door' | 'gate' | 'ice'
  | 'beltL' | 'beltR';

export const TILE_SOLIDITY: Readonly<Record<string, Solidity>> = {
  '.': 'empty',
  '#': 'solid',
  X: 'solid',
  '=': 'oneway',
  C: 'crack',
  '^': 'spike',
  w: 'water',
  D: 'door',
  H: 'gate',
  // 'I' ice block (Rimefell): solid in every collision sense, but ground
  // friction/accel drop hard while standing on it — momentum carries
  I: 'ice',
  // conveyor belts (Coglar Foundry): solid; the top surface drags riders
  '<': 'beltL',
  '>': 'beltR',
};

export const ENTITY_CHARS = new Set([
  'P', 'K', 'F', 'S', 'E', 'T', 'O', 'A', '*', 'B', 'M', 'W', 'e', 'z', 'h', 'Y',
  'j', 'n',
]);

/** Power-up pickup chars → the transformation they grant. */
export const POWER_PICKUPS: Readonly<Record<string, string>> = {
  W: 'scatter',
  e: 'ember',
  z: 'frost',
  h: 'gale',
};
