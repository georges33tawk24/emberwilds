# EMBERWILDS

A warm, hand-crafted 2D action-platformer for the web. Sunlit forests, a quick
red fox named **Sorrel**, a spring-loaded slingblaster, and the industrial
**Rust** slowly draining the wilds of their warmth. Run, jump, stomp, glide,
ground-pound, and shoot your way across Thornwood and relight the Warmth
Beacons.

Built with **Phaser 4 + TypeScript + Vite**, simulated at a deterministic
fixed 120 Hz, rendered at a pixel-perfect 480×270 integer-scaled internal
resolution. Every sprite, tile, glyph, and note is authored in-repo as data —
no binary assets, fully license-clean.

## Run it

```bash
npm install
npm run dev      # dev server (Vite) — open the printed URL
npm run build    # typecheck + production build to /dist
npm run preview  # serve the production build
npm test         # unit tests + level lint (Vitest)
```

The production build is a static, installable **PWA** (offline-capable via
service worker). Deploy `/dist` to any static host (Vercel, Netlify, itch.io).

## Controls

| Action | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | Arrows / WASD | Left stick / D-pad | on-screen d-pad |
| Jump (hold = higher) | Z / Space / K | A | JUMP |
| Glide | press & hold Jump while falling | hold A in air | hold JUMP in air |
| Shoot (hold = charge) | X / J | B / R | FIRE |
| Ground-pound | C / L / Shift — or Down+Jump in air | LB | POUND |
| Roll | Down + direction on the ground | Down + direction | ▼ + direction |
| Drop through platform | Down + Jump on a one-way platform | Down + A | ▼ + JUMP |
| Wall jump | push into a wall, then Jump | — | into wall + JUMP |
| Pause | Esc / P | Start | II |

**Platforms.** Runs at 640×360 internal, scaled to fill the window on desktop
and mobile. On touch devices, hand-drawn pixel-art controls appear and the
camera pulls in ~22% closer for a comfortable read. Rotate to landscape on a
phone.

## Meta layer

- **World-map hub** — the level select is a walkable overworld: the fox hops
  between nodes along a winding path, each node showing its clear-state and
  ember-token progress. Gateway to the Grove.
- **The Grove (shop)** — spend ember-gems on lasting upgrades: extra max
  hearts (Heart Bloom), a mid-air **double jump** (Twinleaf), a longer, slower
  glide (Broadscarf), and a faster charge shot (Quick Ember). Upgrades persist
  in a versioned, migratable save.

## Project layout

```
src/
  core/       event bus, seeded RNG, object pools
  data/       tuning.json-equivalent (tuning.ts), level format + parser, levels
  entities/   playerSim (the character controller), enemySim, projectileSim
  systems/    physics (pixel-honest AABB vs tile grid), input map, save
  gfx/        palette, texture baking, terrain autotiler, parallax, particles,
              bitmap font, and /data — all hand-authored pixel art as code
  audio/      Web Audio engine (synth SFX + chiptune sequencer), songs
  scenes/     Boot, Title, Game, Hud, Pause, Clear
tests/        physics, player-feel, save, level lint (reachability)
```

**Design docs:** [ART_BIBLE.md](ART_BIBLE.md) (the No-Neon palette law),
[TUNING.md](TUNING.md) (every gameplay number and why),
[CREDITS.md](CREDITS.md) (licensing).

## Architecture notes

- **Deterministic sim.** Gameplay runs at a fixed 120 Hz with an accumulator;
  rendering interpolates between steps. The same inputs produce the same run
  at 60/120/144 Hz displays (covered by tests).
- **The player controller** (`src/entities/playerSim.ts`) is pure TypeScript
  with no Phaser dependency: coyote time, jump buffering, variable jump
  height, apex hang, asymmetric gravity, corner correction, wall slide/jump,
  glide, ground-pound, roll, stomp bounce, springs — all unit-tested.
- **Collision** is hand-rolled swept AABB vs. the tile grid with sub-stepping
  (no tunneling at any speed — fuzz-tested), one-way platforms, and spike
  sub-tile hitboxes.
- **Everything is data.** Sprites are palette-coded pixel strings baked to
  texture atlases at boot; levels are ASCII grids linted in CI; music is a
  step-sequenced score played by a Web Audio chiptune engine; tuning lives in
  one file.
- **Feel systems:** hitstop, trauma-based screen shake (with settings toggle),
  squash & stretch, look-ahead camera with vertical dead zone, particles,
  ambient leaves, parallax with aerial perspective.

## Status / roadmap

Two worlds are in and playable end to end:

- **World 1 — Thornwood** (3 levels): sunlit forest that teaches the moveset.
- **World 2 — Ochre Canyon** (4 levels + a boss): autumn desert mesas about
  momentum — dash straights, spring boosts, its own re-skinned enemies
  (rock-crab, dust-hare, buzzard, tumbleburr), a warm sub-palette tileset
  (spec §3), and a driving chiptune score. Ends with a boss fight.
- **World 3 — Mossgrave Ruins** (overgrown temple): introduces three new
  mechanics — **water you swim through** (buoyant physics, a repeatable
  up-stroke), **keys that open locked doors**, and **switches that drop
  barred gates**. Cool mossy-stone tileset, moss-crawler/bat/moss-golem
  enemies, and a haunting minor-key theme. Its levels are bigger (240–250
  tiles) and more handcrafted, with distinct setpieces (a flooded cloister, a
  gated bridge over a spike moat, key vaults, secret cellars).

Also: **fullscreen** (press F on desktop, or the corner button on mobile).

### Power-ups (Mario-style transformations)

Pickups transform Sorrel for the rest of a life; a hit strips the power
instead of a heart (one "free" hit). The current shot color and a HUD badge
always show what you're holding:

- **Scatterburr** — primary fire becomes a 3-pellet spread.
- **Ember flower** — piercing fire shots (double damage, punch through foes).
- **Frostbloom** — freezes enemies into **solid ice blocks you can stand on
  and hop off**, then shatter with a ground-pound. Platforming + combat in one.
- **Gale seed** — the helicopter/cape: hold jump in the air to hover and
  climb on a refilling fuel gauge.

### Boss — Old Rustjaw (Ochre Canyon 2-5)

An arena boss (spec §7): a clockwork crab-tank of the Rust, cold iron against
the warm world with a molten-orange **core weak point**. It telegraphs, then
**charges** wall to wall; over-commit it into a wall and it stuns, popping the
core open — stomp or shoot it. Three escalating phases (faster charges, then
projectile volleys), a health bar, and a golden warmth-floods-back payoff on
defeat. New worlds/bosses are a data module plus one entry in the theme
registry.

New worlds are one entry in [`src/gfx/themes.ts`](src/gfx/themes.ts) plus their
data modules — the theme registry binds tileset, enemy skins, music, parallax
style, and labels per world. Still to come per the build brief: worlds 3–6,
bosses, the world-map hub, the upgrade shop, remappable-input UI, and
localization tables — all riding on the systems already in place here.

## Deploy

`npm run build` emits a static `/dist` — deploy it to any static host.

**Cloudflare Pages (Git-connected, auto-deploys on push):**

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, and pick the `emberwilds` repo.
2. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Node version is pinned by [`.node-version`](.node-version) (22.12.0).
3. Save & Deploy. Every push to `main` rebuilds and publishes automatically to
   the project's `*.pages.dev` URL (add a custom domain in the Pages project if
   you like). No SPA `_redirects` rule is needed — the game is a single page.

**surge.sh (the original preview slice):**
`surge ./dist emberwilds.surge.sh` (a `200.html` copy of `index.html` is
included so deep links resolve).
