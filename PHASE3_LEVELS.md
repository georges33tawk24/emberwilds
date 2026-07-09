# PHASE 3 — THE LEVEL REVAMP (worlds 2–6)

**Mission:** rebuild the remaining 20 non-boss levels so every level plays like
a Jazz Jackrabbit 2 / Super Mario Bros map — full-height, three-lane, paced,
secret-rich. **World 1 is DONE and is the exemplar** (commit `d059695`,
`scripts/buildThornwood.mjs`). Copy its pattern, world by world, one commit per
world. This file is self-contained; trust it over stale sections of HANDOFF §9.

## The bar (all seven, every non-boss level)

1. **Three lanes, full height.** Ground road / one-way mid lane / sky lane,
   stacked across the whole midsection, weaving and reconnecting every 30–50
   tiles. Levels are ~42–44 rows; the camera shows ~22 — use two screens of
   height. The old maps' sin was action crammed into the bottom third.
2. **Kishotenketsu pacing:** teach one idea safely → develop → twist (combine
   with the world gimmick) → celebration/payoff before the beacon. Write the
   beats into the header comment (CONCEPT/SETPIECE/PACING/ROUTES/TOKENS).
3. **Flow:** long sight lines, spring/slope chains that keep momentum, no
   dead-stop walls on the main route. Gems are breadcrumbs on jump arcs and
   route entrances, never random piles.
4. **One dominating setpiece** per level, named in the header (W1: THE SUNROOT
   CANOPY / THE RIDGE ROAD / THE OWL LINE).
5. **Secrets:** keep every C-lid cellar (and its Keeper's Lantern where one
   lives — see below); add at least one more hidden pocket. Each of the 4
   tokens demands a distinct skill (route mastery / pound / glide / nerve).
6. **Gimmick escalation** within each world of five: level 1 teaches pure,
   2–3 develop, 4 combines with an earlier world's mechanic, 5 is the exam.
7. **Enemies are tempo,** punctuating jumps and guarding rewards.

## The proven workflow (do NOT hand-edit the level .ts files)

1. Edit the world's generator: `scripts/buildCanyon.mjs`, `buildMossgrave.mjs`,
   `buildCinder.mjs`, `buildRimefell.mjs`, `buildFoundry.mjs`. The brushes and
   validator live in `scripts/levelBuilder.mjs`.
2. `node scripts/build<World>.mjs` — iterate until every level prints PASS.
   The validator BFS-checks P→F and P→K reachability with the real movement
   model: **jump 4 up / 6 across (only 3 across when climbing >2), springs and
   water lift 8, fall any depth with ±3 drift, pits ≤5 wide.**
3. `npm test` — the lint suite re-checks everything plus lantern rules.
4. Browser-verify (see recipe), screenshot each setpiece.
5. One commit per world, message in the style of `d059695`.

### Builder gotchas that already bit once
- `onFloor(x, ch)` snaps to the TOPMOST standable tile in the column — a
  gallery/canopy pad above the floor will steal the placement. Use explicit
  `set(x, y, ch)` when anything hangs overhead (this misplaced a checkpoint).
- A spring launches from the cell the player STANDS in; the caught ledge must
  be ≤8 rows above that stand cell (a crown ledge at 9+ silently fails BFS).
- `gems()/gemArc()` happily overwrite an entity placed earlier in the same
  cell (this silently deleted a token). Place tokens/lanterns AFTER gems.
- Gem budget is 40–90 per level; the validator prints the count.
- Boss arenas (`boss: true`) are out of scope — don't touch them.

### Keeper's Lanterns (lint-enforced)
Exactly **six** `L` lanterns campaign-wide, ≤1 per level, none in boss arenas,
each must be pound-reachable (the lint models `C` lids as open). They live in
cellars. When you rebuild a level that had one, keep a lantern in the new
cellar — find them with `grep -l "L" src/data/levels/*.ts` before rebuilding,
or run `npm test` and read the failure.

### Browser verification recipe (the preview tab is HIDDEN — RAF freezes)
```js
// window.__game exists in dev builds only
const g = window.__game;
window.__steps = n => { let t = performance.now();
  for (let i = 0; i < n; i++) { t += 16.7; g.loop.step(t); } };
__steps(30);                                   // pump the frozen loop
g.scene.getScene('Title').scene.start('Game', { levelIndex: N }); __steps(60);
const gs = g.scene.getScene('Game');
// hide the level-intro card (it never dismisses without input):
for (const ch of gs.children.list)
  if (ch.depth >= 80 && ch.scrollFactorX === 0) ch.setVisible(false);
// teleport: player.x/y are GETTERS — write to player.body
const b = gs.player.body; b.x = TX*16; b.y = TY*16; b.vx = 0; b.vy = 0;
__steps(8); // camera follows; screenshot now
```
Dev server: `npm run dev` (`.claude/launch.json` has configs). `localStorage.clear()`
before and after so test saves don't linger.

## Per-world direction (seeds, not straitjackets)

- **W2 Canyon (canyon1–4 + boss):** gimmick is springs/updrafts and open air.
  Sky lane = mesa-top wind road; mid = rope-bridge one-ways; secrets in dune
  hollows. Combine-with: W1 canopy weaving in canyon4.
- **W3 Mossgrave (moss1–4 + boss):** SWIM. Three lanes become rafters / water
  line / drowned floor — the water IS the mid lane. Secrets behind waterfalls
  and under flagstones. Combine-with: springs under water (8-lift chains).
- **W4 Cinderpeaks (cinder1–4 + boss):** VENTS. Vent chains as vertical
  arteries between lanes; sky lane is the ashen rafter road. Combine-with:
  swim (cooled pools) in cinder4.
- **W5 Rimefell (rime1–4 + boss):** SLIDE. Momentum lanes — iced terraces
  stacked three deep, gaps only speed crosses. Combine-with: vents (geyser
  updrafts through ice shafts) in rime4.
- **W6 Foundry (foundry1–4 + boss):** BELTS. Belt lanes running opposite
  directions stacked vertically; the sky lane is the return line. Combine-with:
  ice (frozen slag) in foundry4. Hardest world — commit gaps everywhere.

## After ALL five worlds — do not skip

1. `node scripts/genMinTimes.mjs` — regenerates the per-level physical
   minimum-time floors that feed the anti-cheat in
   `backend/leaderboard/worker.mjs` (see `backend/leaderboard/DEPLOY.md`).
2. **STOP and ask the user** before deploying the worker: existing leaderboard
   times and ghost recordings were set on the OLD maps. Wiping vs versioning
   the boards is the user's call.
3. Full `npm test`, full boot-sweep (every level loads), then commit.

## Repo logistics

- TWO clones of `github.com/georges33tawk24/emberwilds`:
  `~/Pictures/webgame` (SSH, work here) and `~/Pictures/emberwilds` (HTTPS).
  Cross-remotes exist (`ember`/`webgame`). **`git fetch` + fast-forward BOTH
  before starting**, or sessions diverge (it happened; it was painful).
- Pushing `main` auto-deploys to emberwilds.fun via Cloudflare Pages. Push
  only with the user's explicit go-ahead.
- Status: W1 rebuilt (`d059695`) ✅ · in-canvas name entry (`d69a18f`) ✅ ·
  lethal pits engine-wide (`180b6e6`) ✅ · W2–W6 rebuilt/hardened
  (`e1405d2`..`66f6b2a`) ✅ · min-time floors regenerated in worker source
  (`d4730d8`) ✅ · **REMAINING: user decisions only** — wipe-or-keep the
  leaderboards, then push main (auto-deploys the site) + `wrangler deploy`
  the worker from `backend/leaderboard/` so floors land with the new maps.
