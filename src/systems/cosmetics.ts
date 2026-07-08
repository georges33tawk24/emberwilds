/**
 * Cosmetics — THE WARDROBE's stock (GROWTH_ROADMAP Phase 3; strictly
 * cosmetic, never pay-to-win: everything is bought with gems earned in
 * play). Three slots:
 *
 *   character — Sorrel's fur, recolored inside the No-Neon palette
 *   scarf     — the signature scarf (the glide is scarf-borne, so this IS
 *               the "glider" skin)
 *   hat       — a little cap, stamped onto every frame at bake time
 *
 * The styled sheet is rebuilt from PLAYER_FRAMES by pure code-remaps + the
 * hat stamp, then registered as its own texture ('player-styled') — the
 * base art is never mutated.
 */
import { PLAYER_FRAMES } from '../gfx/data/playerSprites';
import type { StyleData } from './save';

export type CosmeticKind = 'character' | 'scarf' | 'hat';

export interface Cosmetic {
  id: string;
  kind: CosmeticKind;
  name: string;
  desc: string;
  cost: number;
  /** palette-code remap applied to every frame (characters/scarves) */
  remap?: Record<string, string>;
}

/**
 * Character fur: Sorrel's body is R (fire red) shaded d (deep red).
 * Scarves: the scarf body is O (amber); its o accents stay for warmth.
 * All targets are existing palette codes — the No-Neon law holds.
 */
export const COSMETICS: Cosmetic[] = [
  // -- characters ------------------------------------------------------------
  { id: 'fox_snow', kind: 'character', name: 'SNOWPAW', desc: 'A FOX OF THE RIMEFELL', cost: 600, remap: { R: 'c', d: 't' } },
  { id: 'fox_ash', kind: 'character', name: 'CINDERTAIL', desc: 'ASH-GREY, EMBER-EYED', cost: 600, remap: { R: 's', d: 'S' } },
  { id: 'fox_dusk', kind: 'character', name: 'DUSKRUNNER', desc: 'THE VIOLET HOUR, RUNNING', cost: 900, remap: { R: 'p', d: 'i' } },
  { id: 'fox_ember', kind: 'character', name: 'EMBERBORN', desc: 'THE HEART MADE FUR', cost: 1200, remap: { R: 'o', d: 'R' } },
  // -- scarves (the glider) ----------------------------------------------------
  { id: 'scarf_sage', kind: 'scarf', name: 'SAGE SCARF', desc: 'WOVEN IN THE THORNWOOD', cost: 250, remap: { O: 'g' } },
  { id: 'scarf_frost', kind: 'scarf', name: 'FROST SCARF', desc: 'SPUN FROM RIME', cost: 250, remap: { O: 'A' } },
  { id: 'scarf_rose', kind: 'scarf', name: 'ROSE SCARF', desc: 'DYED AT DUSK', cost: 250, remap: { O: 'P' } },
  { id: 'scarf_gold', kind: 'scarf', name: 'HARVEST SCARF', desc: 'CUT FROM THE LAST SHEAF', cost: 400, remap: { O: 'y' } },
  // -- the hat -------------------------------------------------------------------
  { id: 'hat_cap', kind: 'hat', name: 'EMBER CAP', desc: 'A LITTLE LEATHER CAP', cost: 500 },
];

export function cosmeticById(id: string | null): Cosmetic | null {
  return COSMETICS.find((c) => c.id === id) ?? null;
}

/** The texture key every fox sprite uses; rebuilt when style changes. */
export const PLAYER_TEX = 'player-styled';

/** Stamp the little cap onto one frame (rows are already cloned). The crown
 *  is found per frame so the cap rides the head through every animation. */
function stampCap(rows: string[]): string[] {
  // the crown: the first row that reads as the HEAD — a solid span of 5..11
  // pixels in the middle columns. Narrower is ear tips; wider is the glide
  // scarf canopy (which flies ABOVE the head and must not wear the cap).
  let crown = -1;
  for (let y = 2; y < rows.length; y++) {
    let n = 0;
    for (let x = 6; x <= 18; x++) if (rows[y][x] !== '.') n++;
    if (n >= 5 && n <= 11) { crown = y; break; }
  }
  if (crown < 2) return rows;
  // center of that span
  let lo = 18, hi = 6;
  for (let x = 6; x <= 18; x++) {
    if (rows[crown][x] !== '.') { lo = Math.min(lo, x); hi = Math.max(hi, x); }
  }
  const cx = Math.round((lo + hi) / 2);
  const put = (y: number, x: number, ch: string): void => {
    if (y < 0 || y >= rows.length || x < 0 || x >= rows[y].length) return;
    rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  };
  // dome above the crown, amber band on it
  for (let dx = -2; dx <= 2; dx++) put(crown - 1, cx + dx, dx === -2 || dx === 2 ? 'K' : 'b');
  put(crown - 2, cx - 1, 'K');
  put(crown - 2, cx, 'b');
  put(crown - 2, cx + 1, 'K');
  for (let dx = -2; dx <= 2; dx++) put(crown, cx + dx, dx === -2 || dx === 2 ? 'K' : 'O');
  return rows;
}

/** Build the styled frame set for the current wardrobe selection. */
export function buildStyledFrames(style: StyleData): Record<string, string[][]> {
  const remap: Record<string, string> = {
    ...(cosmeticById(style.character)?.remap ?? {}),
    ...(cosmeticById(style.scarf)?.remap ?? {}),
  };
  const hat = style.hat !== null;
  const out: Record<string, string[][]> = {};
  for (const [group, frames] of Object.entries(PLAYER_FRAMES)) {
    out[group] = frames.map((frame) => {
      let rows = frame.map((row) => [...row].map((ch) => remap[ch] ?? ch).join(''));
      if (hat) rows = stampCap(rows);
      return rows;
    });
  }
  return out;
}
