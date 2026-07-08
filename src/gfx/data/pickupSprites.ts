// EMBERWILDS — pickup & FX sprites
// Hand-placed 16-bit pixel data. One char per pixel, '.' = transparent.
// Palette codes (master): K B b t c W | G g l y | D e A a p P I i | O o R d | S s v x
// Key light from upper-left. K outlines on interactive pickups only
// (gem/berry/heart/token); FX sprites stay soft and outline-free.

export const PICKUP_FRAMES = {
  // ── gem: 8x8, 4 frames ────────────────────────────────────────────
  // Warm amber gem. O facets, o shadow down-right, single W glint that
  // orbits the facets: top-left -> top-right -> bottom-right -> mid-left.
  gem: [
    [
      "..KKKK..",
      ".KWOOOK.",
      "KOOOOOoK",
      "KOOOOooK",
      ".KOOooK.",
      "..KOoK..",
      "...KK...",
      "........",
    ],
    [
      "..KKKK..",
      ".KOOOWK.",
      "KOOOOOoK",
      "KOOOOooK",
      ".KOOooK.",
      "..KOoK..",
      "...KK...",
      "........",
    ],
    [
      "..KKKK..",
      ".KOOOOK.",
      "KOOOOOoK",
      "KOOOOooK",
      ".KOOoWK.",
      "..KOoK..",
      "...KK...",
      "........",
    ],
    [
      "..KKKK..",
      ".KOOOOK.",
      "KOOOOOoK",
      "KWOOOooK",
      ".KOOooK.",
      "..KOoK..",
      "...KK...",
      "........",
    ],
  ],

  // ── berry: 8x8, 1 frame ───────────────────────────────────────────
  // Plump fire-red berry, W shine up-left, d shadow down-right, g leaf.
  berry: [
    [
      "....gg..",
      "...Kg...",
      "..KKKK..",
      ".KWRRRK.",
      "KRWRRRdK",
      "KRRRRddK",
      ".KRRddK.",
      "..KKKK..",
    ],
  ],

  // ── heart: 8x8, 1 frame ───────────────────────────────────────────
  // HUD heart, R fill, o shadow lobe, 2px W glint up-left, K outline.
  heart: [
    [
      ".KK..KK.",
      "KWRKKRoK",
      "KWRRRRoK",
      "KRRRRooK",
      ".KRRooK.",
      "..KRoK..",
      "...KK...",
      "........",
    ],
  ],

  // ── heart_empty: 8x8, 1 frame ─────────────────────────────────────
  // Spent heart: same K outline, hollow dark-brown interior.
  heart_empty: [
    [
      ".KK..KK.",
      "KBBKKBBK",
      "KBBBBBBK",
      "KBBBBBBK",
      ".KBBBBK.",
      "..KBBK..",
      "...KK...",
      "........",
    ],
  ],

  // ── token: 12x12, 2 frames ────────────────────────────────────────
  // The Ember Token. Ancient amber coin, o shading crescent down-right,
  // deep-red ember rune (leaning flame) struck into the face.
  // W glint alternates corners: frame 0 up-left rim, frame 1 down-right rim.
  token: [
    [
      "....KKKK....",
      "..KKOOOOKK..",
      ".KWWOOOOOoK.",
      ".KWOOOdOOoK.",
      "KOOOOddOOOoK",
      "KOOOddddOOoK",
      "KOOOddddOOoK",
      "KOOOOddOOooK",
      "KOOOOOOOoooK",
      ".KOOOOOoooK.",
      "..KKooooKK..",
      "....KKKK....",
    ],
    [
      "....KKKK....",
      "..KKOOOOKK..",
      ".KOOOOOOOoK.",
      ".KOOOOdOOoK.",
      "KOOOOddOOOoK",
      "KOOOddddOOoK",
      "KOOOddddOOoK",
      "KOOOOddOOooK",
      "KOOOOOOOoWWK",
      ".KOOOOOooWK.",
      "..KKooooKK..",
      "....KKKK....",
    ],
  ],

  // ── lantern: 12x12, 2 frames ──────────────────────────────────────
  // The Keeper's Lantern (hidden lore relic). Wood-brown cap and base,
  // K frame, amber glass with a cream flame. Frame 1: the flame flickers
  // taller and the glass glints on the other side.
  lantern: [
    [
      "....KbbK....",
      "....K..K....",
      "...KKKKKK...",
      "..KbbbbbbK..",
      ".KOOOOOOOoK.",
      ".KOOWWOOOoK.",
      ".KOWWWWOOoK.",
      ".KOOWWOOOoK.",
      ".KOOOOOOOoK.",
      "..KbbbbbbK..",
      "...KbbbbK...",
      "....KKKK....",
    ],
    [
      "....KbbK....",
      "....K..K....",
      "...KKKKKK...",
      "..KbbbbbbK..",
      ".KOOOWWOOoK.",
      ".KOOWWWOOoK.",
      ".KOOWWWWOoK.",
      ".KOOOWWOWoK.",
      ".KOOOOOOOoK.",
      "..KbbbbbbK..",
      "...KbbbbK...",
      "....KKKK....",
    ],
  ],

  // ── pellet: 6x6, 2 frames ─────────────────────────────────────────
  // Slingblast seed shot. Tan seed, cream light up-left, wheat spin
  // streaks. Frame 1: seed rotated upright, streaks on the other diagonal.
  pellet: [
    [
      "......",
      ".yy...",
      "..cct.",
      "..ttt.",
      "....yy",
      "......",
    ],
    [
      "....yy",
      "..cc..",
      "..ct..",
      "..tt..",
      "yy....",
      "......",
    ],
  ],

  // ── charge: 10x10, 2 frames ───────────────────────────────────────
  // Charged piercing shot flying right. W-hot core, O flame sheath,
  // o embers trailing off the left edge. Frame 1 flickers the tail.
  charge: [
    [
      "..........",
      "..........",
      "....oOO...",
      "..oOOWWWO.",
      ".ooOWWWWWO",
      "..oOOWWWO.",
      "....oOO...",
      "..........",
      "..........",
      "..........",
    ],
    [
      "..........",
      "..........",
      "...oOOO...",
      ".ooOOWWWO.",
      "..oOWWWWWO",
      ".ooOOWWWO.",
      "...oOOO...",
      "..........",
      "..........",
      "..........",
    ],
  ],

  // ── spark: 5x5, 3 frames ──────────────────────────────────────────
  // Impact burst: hot W star -> expanding hollow O cross -> fading o motes.
  spark: [
    [
      ".....",
      "..W..",
      ".WWW.",
      "..W..",
      ".....",
    ],
    [
      "..O..",
      "..O..",
      "OO.OO",
      "..O..",
      "..O..",
    ],
    [
      "..o..",
      ".....",
      "o...o",
      ".....",
      "..o..",
    ],
  ],

  // ── leaf: 6x6, 2 frames ───────────────────────────────────────────
  // Ambient drifting leaf, wheat edge catching the light, olive-lit body.
  // Two flutter poses: tilted, then flattened out.
  leaf: [
    [
      "......",
      "..yy..",
      ".ylly.",
      ".lly..",
      "..l...",
      "......",
    ],
    [
      "......",
      "......",
      ".yyy..",
      "..lll.",
      "....l.",
      "......",
    ],
  ],

  // ── dust: 6x6, 3 frames ───────────────────────────────────────────
  // Landing dust puff: dense cream/tan blob at the feet, then splitting
  // outward, then dissolving into stray motes.
  dust: [
    [
      "......",
      "......",
      "......",
      "..cc..",
      ".cttc.",
      "..tt..",
    ],
    [
      "......",
      "......",
      ".cc.c.",
      "c....c",
      ".t..t.",
      "......",
    ],
    [
      "......",
      ".c..c.",
      "......",
      "t....t",
      "......",
      "......",
    ],
  ],
};
