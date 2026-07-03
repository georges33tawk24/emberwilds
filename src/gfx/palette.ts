/**
 * EMBERWILDS master palette — the "No-Neon Bible" (ART_BIBLE.md §3).
 *
 * Every sprite, tile, and UI element in the game is authored against these
 * ~26 colors. Pixel data throughout /src/gfx/data uses the single-character
 * codes below; '.' is transparent.
 *
 * Temperature rule: light is sun, fire, and amber. Banned: electric cyan,
 * hot magenta, acid green, LED glow. The Rust's colors are the only "cold"
 * entries and they are deliberately desaturated and dead.
 */
export const PALETTE: Readonly<Record<string, string>> = {
  // Warm neutrals (outlines, wood, earth, parchment)
  K: '#2A1F1B', // darkest — outlines (never pure black)
  B: '#4A362B', // dark brown
  b: '#7A5A3E', // mid brown
  t: '#B58B5E', // tan
  c: '#E6C79A', // cream
  W: '#F7E6C4', // warm white

  // Foliage (sage -> olive -> wheat, never acid)
  G: '#3E5A2E',
  g: '#5F7D34',
  l: '#8FA84A',
  y: '#C2C56B',

  // Sky & atmosphere
  D: '#F2B98C', // dawn peach
  e: '#E8846B', // dawn coral
  A: '#A9C6D6', // day blue (muted)
  a: '#DCEAF0', // day pale
  p: '#7E6A9E', // dusk violet (muted)
  P: '#C88BA0', // dusk rose
  I: '#243049', // night indigo (deep, muted)
  i: '#3C5068', // night slate

  // Accent warmth (fire, embers, UI highlights, fox fur)
  O: '#F2A03D', // amber
  o: '#E8622C', // ember orange
  R: '#C7402B', // fire red
  d: '#8A2F22', // deep fox red / dried blood ember

  // The Rust (antagonist) — cold, dead iron & verdigris
  S: '#5A5450',
  s: '#7C7A72',
  v: '#8FA39B',
  x: '#B0663F', // oxide
} as const;

/** A single sprite frame: rows of palette codes, '.' = transparent. */
export type PixelFrame = string[];

/** Resolve a palette code to a CSS color, or null for transparent. */
export function colorOf(code: string): string | null {
  if (code === '.' || code === ' ') return null;
  const c = PALETTE[code];
  if (!c) throw new Error(`Unknown palette code: "${code}"`);
  return c;
}
