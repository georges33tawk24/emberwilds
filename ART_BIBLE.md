# EMBERWILDS Art Bible — the "No-Neon" law

Every asset in this game is authored against this document. If it doesn't
match, it doesn't ship.

## The core rule

Light in the Emberwilds is **natural and warm**: sunlight, torchlight, amber
lanterns, moonlight. When something glows (embers, magma, the Rust's cores) it
glows like **fire or hot metal**, never like an LED.

**Banned outright:** electric cyan, hot magenta, acid/laser green, saturated
glowing rim-lights, and any "80s arcade neon" or synthwave look.

## Master palette

All pixel art uses single-character codes into this ~26-color palette
(`src/gfx/palette.ts` is the single source of truth):

| Code | Hex | Role |
|---|---|---|
| K | `#2A1F1B` | darkest warm — outlines (never pure black) |
| B | `#4A362B` | dark brown |
| b | `#7A5A3E` | mid brown |
| t | `#B58B5E` | tan |
| c | `#E6C79A` | cream |
| W | `#F7E6C4` | warm white |
| G | `#3E5A2E` | dark green |
| g | `#5F7D34` | olive |
| l | `#8FA84A` | light green |
| y | `#C2C56B` | wheat |
| D | `#F2B98C` | dawn peach |
| e | `#E8846B` | dawn coral |
| A | `#A9C6D6` | day blue (muted) |
| a | `#DCEAF0` | day pale |
| p | `#7E6A9E` | dusk violet (muted) |
| P | `#C88BA0` | dusk rose |
| I | `#243049` | night indigo |
| i | `#3C5068` | night slate |
| O | `#F2A03D` | amber — fire, UI highlights |
| o | `#E8622C` | ember orange |
| R | `#C7402B` | fire red — Sorrel's fur |
| d | `#8A2F22` | deep red shadow |
| S | `#5A5450` | Rust iron |
| s | `#7C7A72` | Rust light iron |
| v | `#8FA39B` | Rust verdigris |
| x | `#B0663F` | Rust oxide |

The foliage ramp is sage → olive → wheat, **never acid**. The sky colors are
muted; night is deep indigo, not black, never electric blue. The Rust's four
colors are the only cold entries and they are deliberately desaturated and
dead — its only "glow" is sullen molten orange (`o`), like cooling slag.

## Rendering rules

- **Internal resolution 480×270**, integer-scaled. Nearest-neighbor, no
  sub-pixel smear (`pixelArt`, `roundPixels`, no antialias).
- **Base tile 16×16.** Sorrel is 24×28. Enemies 14–18px wide.
- **Key light from the upper-left**, always: lighter tones up-left, shadow
  tones down-right, on every sprite and tile.
- **Selective outlining:** characters and interactive objects get a 1px `K`
  outline (a dark *warm* brown, not pure black). Terrain interiors and
  background elements stay outline-light so the foreground pops.
- **Interior tiles recede:** buried earth/stone tiles are low-contrast so
  characters and pickups read instantly.
- **Layered parallax** with atmospheric desaturation: farther silhouettes are
  lighter and cooler; near layers darker and warmer.
- **Ambient life on every screen:** drifting leaves, dust on landings, gem
  sparkles, flickering beacon flames.

## Animation budgets

Idle 4f (breathing + scarf/ear secondary motion) · run 6f · jump/fall distinct
single poses · glide 2f · pound 2f · skid, hurt 1f · shoot 2f. Enemies 1–2f
per state with a clear **telegraph pose** before any attack. Squash & stretch
is applied procedurally at render (land squash, jump stretch) — keep authored
frames volume-consistent.

## Asset pipeline

Pixel data lives as palette-coded string rows in `src/gfx/data/*.ts`, baked
into packed canvas atlases at boot (`src/gfx/textures.ts`). All rows of a
frame are exactly the frame width; only palette codes and `.` (transparent)
are legal — validated in CI. Naming: `group.frameIndex` (e.g. `run.3`,
`beetle_walk.1`, `grass_top.2`).
