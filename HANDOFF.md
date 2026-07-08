# EMBERWILDS — Developer Handoff & Mission Brief

You are taking over **EMBERWILDS**, a production-grade 2D web action-platformer.
Read this entire document before touching code. It is the single source of truth
for *what the project is*, *the quality bar you must hold*, *how the codebase
works*, *how to verify and ship*, and *what to build next*. Treat it as binding.

---

## 0. Your role and the quality bar (NON-NEGOTIABLE)

You are a senior game developer shipping a **commercial-quality** title. The owner
holds every change to this standard — apply it to your own work *before* showing it:

> **"Would this feel complete if it shipped in a commercial game? Does it look
> polished? Does it behave naturally? Are there missing animations, visual
> effects, interactions, transitions, or feedback?"**

Concretely, this means:

- **Handcrafted, not generated-looking.** Environments, levels, and layouts must
  read as deliberately designed by a human — natural terrain, intentional pacing,
  no flat repetitive corridors, no obviously procedural filler.
- **Assets high-quality and consistent.** Sprites, tiles, particles, lighting, and
  VFX share one cohesive art language (see the palette rules below). Nothing
  placeholder ships.
- **Juice everywhere.** Every action a player takes gets feedback: screenshake,
  hitstop, squash/stretch, particles, sound, camera work, transitions. Silence or
  a static response on jump/land/stomp/hit/pickup/death/phase-change is a bug.
- **Proactively find and fix rough edges.** Do not wait to be told. When you touch
  an area, leave it better: missing animation, awkward transition, inconsistent
  UI, unclear state — fix it as part of the work.
- **Continuously review prior work and improve it.** Earlier code/levels are not
  frozen. If something falls short of the bar, raise it.
- **Every feature production-ready.** No "good enough for now." If you can't finish
  it to the bar this session, scope it down to something you *can* finish to the bar.
- **Mobile is a first-class platform**, not a scaled-down desktop. Full-screen fill
  on every aspect ratio, no black bars/wasted space, controls sized and placed for
  thumbs, every on-screen element useful and consistent.
- **Water and environmental systems must feel physical.** Animated surfaces,
  objects sitting *inside* water (not replacing it), splashes/ripples on entry,
  submerged tinting/transparency, believable depth and render order.

When in doubt, choose the more polished, more complete option. Cost/effort is not
the constraint — quality is the goal.

---

## 1. What EMBERWILDS is

A warm, hand-crafted momentum platformer. A quick red fox named **Sorrel** runs,
jumps, stomps, glides, and fires a spring-loaded slingblaster through sunlit
wilds being drained of warmth by the industrial **Rust**. Three worlds are live;
the full design targets 6 worlds / ~30 levels / 6 bosses.

**Art direction — the "No-Neon Bible":** a warm, desaturated palette. Light is
sun, fire, and amber. **Banned:** electric cyan, hot magenta, acid green, LED
glow. The Rust (antagonist tech) is the only "cold" set and it is deliberately
dead/desaturated. All colors live in `src/gfx/palette.ts` (~26 codes). Every
sprite/tile/UI element is authored against these codes — do not introduce raw
hex outside the palette.

**Full original design spec:** `~/Downloads/EMBERWILDS-BUILD-PROMPT.md` (33 KB).
Read it for the world/mechanic/boss roadmap (§17 lists what remains).

---

## 2. Tech stack & how to run it

- **Phaser 4** + **TypeScript (strict)** + **Vite**. Node ≥ 22 (`.node-version`
  pins 22.12.0 for CI).
- Repo root: `/Users/user/Pictures/webgame` (a git repo).

```bash
npm install
npm run dev        # vite dev server — open the printed localhost URL
npm run build      # tsc --noEmit && vite build → /dist (gitignored)
npm run preview    # serve the production build
npm test           # vitest run — MUST stay green (currently 144 passing, 15 skipped)
```

---

## 3. Architecture & the non-obvious patterns (read before editing)

**Deterministic sim + render interpolation.** Gameplay runs a fixed **120 Hz**
simulation; rendering interpolates between sim steps. The sim classes are **pure
and Phaser-free** — no rendering, no `Date.now()`/`Math.random()` in sim logic:
- `src/entities/playerSim.ts` — the fox: movement, jump/glide/stomp, combat,
  water/swim, power-ups. Takes a `PlayerConfig` (upgrades) and a `WaterQuery`.
- `src/entities/bossSim.ts` — **config-driven** bosses. `BOSS_CONFIGS` keyed by
  `variant` (`'rustjaw'` | `'warden'`). One shared state machine
  (walk → telegraph → commit → stun → recover, telegraphed attacks, 3 phases,
  clear damage windows); the *commit* differs per variant (Rustjaw charges into a
  wall; the Warden leap-slams and cracks a ground shockwave). Add new bosses as
  new configs, not new classes, where possible.
- `src/entities/enemies.ts` — enemy archetypes.
- Physics: `src/systems/physics.ts` (AABB, one-way platforms, `Solidity` =
  solid/oneway/water/door/gate/crack). `src/core/pool.ts` (object pools — the hot
  path must not allocate per frame), `src/core/rng.ts` (seeded RNG), event bus.

**Pixel art is authored AS CODE.** There is no Aseprite/Tiled. Sprites are string
arrays of single-char palette codes (`.` = transparent) in `src/gfx/data/*.ts`,
baked into canvas atlases at boot by `registerSheet` in `src/gfx/textures.ts`.
Key rule: **within one frame-group every row must be the same length**, and every
frame in a group must share dimensions (the baker reads `frames[0]` for size).
Different groups in the same sheet *can* differ in size. Validate row widths with
a script before baking (see `scratchpad` history for `checkWarden.cjs`).

**Levels are ASCII grids.** `src/data/levels/*.ts` export a `LevelDef` (rows of
chars + `theme`, `daypart`, optional `boss:true`, optional `water` rects).
`src/data/levelParser.ts` parses them. `src/data/levels/index.ts` is the ordered
level list + world labelling (`worldOf`, `levelLabel` auto-number e.g.
"MOSSGRAVE RUINS 3-5"). **Tile/entity legend** (see levelTypes/parser):
`#`/`X`/`C` solid, `=` one-way platform, `^` spike, `S` spring, `*` gem,
`B` berry (heal), `M` ember token (4 per non-boss level), `K` checkpoint,
`F` goal beacon, `P` player start, `E`/`T`/`O`/`A` enemies, `Y` boss spawn,
`j` key, `D` locked door, `n` switch, `H` gate, power-up pickups `W/e/z/h`.

**Water is REGIONS, not tiles.** `LevelDef.water` is a list of
`[x0,y0,x1,y1]` inclusive tile rects → `ParsedLevel.waterSet`. This decouples
water from the tile grid so **gems and objects sit *inside* the water** instead of
replacing tiles. `GameScene.waterAt(tx,ty)` queries the set; the player's
`checkSubmerged()` uses it; `drawWater()` animates the surface (two-wave crest,
flow bands, caustics) and tints submerged actors (`0x8fb4cc`), with splashes +
rising bubbles on entry.

**Responsive rendering.** Internal resolution is **dynamic width, fixed 360
height**: `VIEW.w = 360 × (device aspect)`, clamped, in `src/gfx/viewport.ts`.
`main.ts` sets it before game creation and refits on resize/orientation;
`Scale.FIT` fills any landscape aspect edge-to-edge with **no letterbox bars**.
**Every scene and `src/gfx/parallax.ts` reads `VIEW.w` at runtime** — never bake
the width into a module constant. Portrait phones get a rotate-to-landscape
overlay (`index.html #rotate`, gated by `@media (orientation:portrait) and
(pointer:coarse)`); `main.ts` sleeps the game loop while portrait.

**Theme registry.** `src/gfx/themes.ts` binds tileset + enemy skins + music +
parallax per world (`thornwood`/`canyon`/`mossgrave`). A new world = one registry
entry + data modules (tiles, enemy skins, song, levels).

**Scenes** (`src/scenes/`): Boot → Title → WorldMap → (Shop | Game) → Hud (overlay)
→ Pause / Clear. Save is versioned (`src/systems/save.ts`).

---

## 4. Current state (what already exists — don't rebuild it)

- **3 worlds, 13 levels:** Thornwood (1-1…1-3), Ochre Canyon (2-1…2-4 + boss
  **2-5 "Rustjaw's Hollow"**), Mossgrave Ruins (3-1…3-4 + boss **3-5 "The
  Tidewarden's Reliquary"**).
- **2 bosses:** Old Rustjaw (charge-and-stun) and The Drowned Warden (leap-slam +
  shockwave). Both multi-phase with health bars and telegraphs.
- **Systems:** full moveset, 4 enemy archetypes (re-skinned per world),
  **Mario-style power-up transformations** (scatter/ember/frost/gale — a hit
  strips the power, not a heart; frost freezes enemies into standable platforms;
  gale = mid-air hover on a fuel gauge), **water/swim**, **keys+locked doors**,
  **switches+gates**, gems/tokens/berries/springs/checkpoints/goal beacons.
- **Meta:** world-map hub (fox hops between nodes, token pips), shop **"The Grove"**
  (spend gems on maxHearts/doubleJump/glide/charge upgrades).
- **Mobile:** real-touch controls (rocker + JUMP/FIRE/POUND + pause + fullscreen),
  full-screen fill, rotate prompt. **Per-platform camera FOV** (desktop 1.0,
  mobile 1.22 via `src/systems/platform.ts`).
- **144 tests pass**, PWA build, synth audio + 3 songs.
- **Deployed** (see §6).

---

## 5. Definition of Done (apply to EVERY change)

A change is not done until ALL of these hold:

1. `npm test` green (144+; the **level lint auto-tests every level** — see §7).
2. `npx tsc --noEmit` clean.
3. `npm run build` succeeds.
4. **Verified in the browser** — actually run it and look. Screenshot the change.
   Never claim a visual/behavioral result you haven't observed.
5. **Self-reviewed against the §0 bar** — you looked for and fixed the missing
   animation / feedback / transition, not just the happy path.
6. Committed with a clear message ending in the co-author trailer (§6), and pushed.

---

## 6. Deployment & git (already wired)

- **GitHub:** `git@github.com:georges33tawk24/emberwilds.git`, branch `main`
  (public). Auth is **SSH only** — key at `~/.ssh/id_ed25519`. There is **no `gh`
  CLI and no token** on this machine; `git push` over SSH works.
- **Cloudflare Pages** is Git-connected to that repo: build `npm run build`, output
  `dist`, Node from `.node-version`. **Every push to `main` auto-deploys.**
- **surge.sh** preview slice (still live at `emberwilds.surge.sh`), the only authed
  static-deploy CLI here:
  `npm run build && cp dist/index.html dist/200.html && surge ./dist emberwilds.surge.sh`
- Commit trailer to use:
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

---

## 7. The level lint — how to author levels that pass

`tests/levelLint.test.ts` runs on every level and enforces:
- Dimensions (≥100 wide for normal, ≥48 for boss arenas; ≥24 tall).
- Exactly **one goal `F`** and **one checkpoint `K`**; boss arenas exactly one `Y`.
- Non-boss: exactly **4 ember tokens `M`**; gem count **40–90**.
- **Ground entities** (`K F S E T A Y`) must be supported (solid within 2 tiles below).
- **Goal AND checkpoint must be reachable** under a conservative BFS movement model:
  walk ±1, jump up to **4 up / 6 across**, fall any depth (±3 drift), springs and
  **water grant 8 tiles of lift**, doors/gates assumed openable (place the key/switch
  on the path before them). Glide and wall-jumps are **not** modeled — if the lint
  passes, a mid-skill player can definitely finish.

**Only the goal and checkpoint must be reachable — tokens/secrets can be
skill-gated** behind glide/wall-jump/optional routes. Exploit this for bonus content.

**Authoring recipe (proven):** build the grid with a small Node script that has a
`validate()` mirroring the lint, iterate until it prints OK, then write the
`.ts`. Past generators live in the session scratchpad
(`genMossLevels.mjs`, `genMoss5.cjs`, `genCanyonLevels.mjs`) — copy the pattern.
Gotcha: carve air pits **after** filling soil, or they get floored over.

---

## 8. Hard-won lessons (avoid these traps)

- **NEVER use pointer events for on-screen touch controls over a Phaser canvas.**
  iOS Safari suppresses the pointer-event compat layer → dead taps on real phones.
  The controls use raw `touch*` events + a single global window hit-test
  (`src/systems/touch.ts` `installInput`). Keep it that way.
- **DPR-2 screenshot artifact:** the browser-preview screenshot tool, at
  `devicePixelRatio === 2`, renders content into a corner of an oversized canvas —
  it looks "broken" but isn't. Trust `getBoundingClientRect` for layout truth; take
  visual screenshots at a DPR-1 viewport size.
- **Sprite frame widths:** every row in a frame-group must be equal length. Bugs
  here silently corrupt the atlas. Validate widths with a script before baking.
- **Boss sheet:** all boss frames live in one `'boss'` sheet, but `registerSheet`
  sizes each group independently — variants can have their own dimensions.
- **Big subagent/Workflow fan-outs can hit account session limits** and fail
  mid-run. Keep parallel agent counts modest, or run when limits have reset.
  Workflows are resumable via `resumeFromRunId`.
- **`ScaleManager.resize()` never updates the display aspect ratio** — the
  canvas letterboxes forever after the first internal-width change. Use
  `setGameSize()` (it calls `displaySize.setAspectRatio`). Related: Phaser's
  `updateCenter` floors its margins (can expose a 1px unpainted hairline) —
  `main.ts` `coverCanvas()` re-applies exact fractional cover CSS after every
  refresh; don't remove it.
- **Nothing sized from `VIEW.w` at create-time survives a live width change**
  (rotation, URL-bar collapse). Menu scenes watch `layoutW` in `update()` and
  `scene.restart()`; GameScene rebuilds only its parallax (width is baked into
  the parallax texture keys, so rebuilds are collision-safe). Follow one of
  these two patterns in every new scene.
- **Menus must be directly tappable** — the touch rocker has no up/down, so
  d-pad-only menus are unusable on phones. Use `attachMenuTouch`
  (src/systems/menuTouch.ts): tap rows, drag to scroll, wheel on desktop. It
  rides Phaser's scene input (native touch inside), which is safe on iOS.
- **The headless browser preview freezes rAF** (`visibilityState: hidden`) —
  the game boots but `game.loop` stalls. Page timers also get throttled to
  ~1Hz, so drive the loop from a **Web Worker** (worker timers are never
  throttled): `new Worker(blobURL('setInterval(() => postMessage(0), 16)'))`
  with `onmessage = () => { t += 16.6; if (game.loop.time > t) t =
  game.loop.time + 16.6; game.loop.step(t); }` — the anchor absorbs stray rAF
  ticks that fire during screenshots (without it the loop freezes on
  zero-deltas). **Halt the worker before taking a screenshot** or the capture
  races the WebGL clear and reads a black buffer. TouchManager is absent
  (no touch support detected): test DOM touch controls by dispatching
  `TouchEvent`s on `window`, and Phaser scene input by dispatching
  `MouseEvent`s on the canvas. Synthetic `KeyboardEvent`s never reach Phaser.
  `?mobile=1` forces the mobile experience (camera FOV + UI ×2) on desktop.
- **The campaign certification sweep** (rerun after any level/engine change):
  (1) data audit — bundle `src/data/levels/index.ts` with esbuild, assert per
  level: exactly 4 tokens + 1 P/F (+1 Y for bosses), ≥1 checkpoint, gems
  40–90, ≥220×40 non-boss, no ragged rows (the levelLint tests enforce all of
  this in CI too); (2) boot sweep — over CDP, `scene.start('Game', {levelIndex:
  i})` for every i, wait ~3.5s, read a `window.__errs` collector installed
  over `window.onerror` + `console.error`, and confirm the scene is active and
  the boss (if any) is cycling. 28/28 clean as of the campaign-complete commit.
- **No preview tooling? Drive headless Chrome over raw CDP** — zero deps:
  Node ≥22 has a built-in `WebSocket`. Launch
  `"/Applications/Google Chrome.app/.../Google Chrome" --headless=new
  --remote-debugging-port=9223 --user-data-dir=<scratch>`, `PUT
  /json/new?url=about:blank` to open a tab, connect to its
  `webSocketDebuggerUrl`, then `Runtime.evaluate` (with `awaitPromise` +
  `returnByValue`) to drive the game and `Page.captureScreenshot` for proof.
  `--headless=new` pages report *visible*, so rAF runs and no worker driver is
  needed. To click UI, dispatch `MouseEvent`s on the canvas at
  `canvasRect.left + gameX / scale.gameSize.width * canvasRect.width`.
  Canvas-only rendering (e.g. the share card) can skip the browser entirely:
  feed the renderer a fake 2D ctx that records `fillRect`s into a pixel
  buffer, write a PPM, `sips -s format png` it, and inspect the image.
- **Scene instances are REUSED across scene.start()** — class-field
  initializers run ONCE. Every per-run accumulator must re-init in create()
  (a NaN that sneaks into one is otherwise permanent — the camera lookAhead
  bug). GameScene.update also sanitizes non-finite deltas before they touch
  the sim or camera; keep that guard.
- **UI scale is a contract:** the world zooms 1.22× on mobile but UI scenes
  don't — every HUD/menu/overlay multiplies its layout by
  `uiScale()` (2 on touch, keeps the 4×6 font on whole pixels). New UI must
  do the same or it ships unreadably small on phones. Touch buttons are
  contextual via `setTouchContext('game'|'map'|'clear'|'ui')` — call it in
  every new scene's create() and on any resume path.

---

## 9. What to build next (prioritized)

Do these to the §0 bar, in roughly this order. Pick one, finish it completely
(§5 Definition of Done), commit, then move on.

1. **Widen levels into multi-route sprawls (the top tracked task).** Most current
   levels are fairly linear. Rework Worlds 1–2 (and tighten World 3) into
   handcrafted multi-route maps: branching high/low paths, **bonus/secret rooms**,
   optional high-risk token routes (skill-gated behind glide/wall-jump — allowed by
   the lint), vertical variety, and a clean intro→teach→test pacing curve. This is
   content quality, not just size — every screen should feel intentional.
2. **Victory / credits finale.** Beating the final boss (moss5) currently just
   returns to the Title (see `ClearScene` `!hasNext` branch). Build a real
   commercial "you won" sequence — celebration, stats, credits, music beat — then
   Title. This is a glaring completeness gap.
3. **Warden slam VFX.** The Warden fights in a *flooded* arena; its ground slam
   should kick up water geysers/splashes (it currently only spawns skittering
   shockwave shots). Wire `spawnShockwave`/`slammed` to water-column particles.
4. **Worlds 4–6 + their bosses** (spec §17): each = new theme registry entry, new
   tileset + enemy skins + song + parallax, ~4–5 handcrafted levels, and a *new*
   telegraphed multi-phase boss with a mechanic distinct from charge and leap-slam.
5. **Per-spec remainders:** remappable-input UI, localization tables, IndexedDB
   save promotion, and code-splitting (the bundle is a single ~1.6 MB Phaser chunk).

> Note: a multi-dimension "AAA audit" workflow was started at the end of the prior
> session to produce a verified punch-list but was interrupted by an account
> session limit before finishing. Re-running that kind of review (audit each of:
> mobile/responsive, water/VFX/juice, level design, boss/combat, meta-flow/finale,
> perf/code-health → adversarially verify → prioritize) is a good way to
> re-confirm priorities before diving in — but keep the fan-out small.

---

## 10. First actions for your session

1. `npm install && npm test && npm run build` — confirm a green baseline.
2. `npm run dev`, open the game, play through a level and a boss — feel the current
   state against the §0 bar and note gaps.
3. Pick item #1 or #2 from §9, build it fully, verify in-browser, deploy, push.
4. Keep `HANDOFF.md` (this file) and the README accurate as the project evolves.

Hold the bar. Ship complete, polished work.
