/** Parses an ASCII LevelDef into a collision grid + entity spawn list. */
import {
  ENTITY_CHARS,
  TILE,
  TILE_SOLIDITY,
  type LevelDef,
  type LevelEntity,
  type Solidity,
} from './levelTypes';

export interface ParsedLevel {
  name: string;
  theme: string;
  daypart: LevelDef['daypart'];
  boss: boolean;
  width: number;
  height: number;
  /** tile chars after entity extraction — index [ty][tx] */
  grid: string[][];
  entities: LevelEntity[];
  playerStart: { x: number; y: number };
  gemTotal: number;
  tokenTotal: number;
}

export function parseLevel(def: LevelDef): ParsedLevel {
  const height = def.rows.length;
  const width = def.rows[0].length;
  const grid: string[][] = [];
  const entities: LevelEntity[] = [];
  let playerStart: { x: number; y: number } | null = null;
  let gemTotal = 0;
  let tokenTotal = 0;

  for (let ty = 0; ty < height; ty++) {
    const row = def.rows[ty];
    if (row.length !== width) {
      throw new Error(`Level "${def.name}": row ${ty} has width ${row.length}, expected ${width}`);
    }
    const out: string[] = [];
    for (let tx = 0; tx < width; tx++) {
      const ch = row[tx];
      if (ENTITY_CHARS.has(ch)) {
        if (ch === 'P') {
          playerStart = { x: tx * TILE + TILE / 2, y: (ty + 1) * TILE };
        } else {
          entities.push({ type: ch, tx, ty });
          if (ch === '*') gemTotal++;
          if (ch === 'M') tokenTotal++;
        }
        out.push('.');
      } else {
        if (!(ch in TILE_SOLIDITY)) {
          throw new Error(`Level "${def.name}": unknown char "${ch}" at ${tx},${ty}`);
        }
        out.push(ch);
      }
    }
    grid.push(out);
  }

  if (!playerStart) throw new Error(`Level "${def.name}": no player start 'P'`);

  return {
    name: def.name,
    theme: def.theme,
    daypart: def.daypart,
    boss: !!def.boss,
    width,
    height,
    grid,
    entities,
    playerStart,
    gemTotal,
    tokenTotal,
  };
}

/** Mutable collision view over a parsed level (crack blocks can break). */
export class TileWorld {
  constructor(readonly level: ParsedLevel) {}

  charAt(tx: number, ty: number): string {
    if (ty < 0) return '.'; // open sky above
    if (tx < 0 || tx >= this.level.width) return 'X'; // solid walls at level edges
    if (ty >= this.level.height) return 'X'; // solid floor below (pits are authored)
    return this.level.grid[ty][tx];
  }

  solidAt = (tx: number, ty: number): Solidity => {
    return TILE_SOLIDITY[this.charAt(tx, ty)] ?? 'empty';
  };

  breakCrack(tx: number, ty: number): boolean {
    if (this.charAt(tx, ty) !== 'C') return false;
    this.level.grid[ty][tx] = '.';
    return true;
  }

  /** Open a mutable tile (door/gate) — clears it to air. */
  openTile(tx: number, ty: number): void {
    if (tx >= 0 && tx < this.level.width && ty >= 0 && ty < this.level.height) {
      this.level.grid[ty][tx] = '.';
    }
  }
}
