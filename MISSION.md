# MISSION.md — The EMBERWILDS Expansion Directive

This is the binding work order for the next phase of EMBERWILDS. It supersedes
the priority list in HANDOFF.md §9 (everything else in HANDOFF.md — architecture,
patterns, quality bar, Definition of Done — still applies in full). Work the
phases in order. Do not start a phase until the previous one is verified,
committed, and pushed.

The owner's intent, verbatim in spirit: **this game must be BIG — a real story
across many worlds, maps at least as big as Super Mario maps, and every screen
built to the standard of a AAA game-dev company.** Not a demo that ends with a
boss after four maps. Take inspiration from Super Mario Bros (readable, honest
platforming; secrets; pacing) and Jazz Jackrabbit 2 (speed, sprawl, run-and-gun,
routes stacked on routes) — the two games this project is built on.

---

## PHASE 0 — Mobile screen fill + scrollable menus (BLOCKING, do first)

A real-device screenshot (iPhone, landscape, notched) shows the game does NOT
fill the screen:

- **Dead black column on the LEFT edge** — the canvas starts to the right of
  the notch; the HUD hearts render inset from the physical screen edge.
- **Black strip along the BOTTOM** — the canvas does not reach the bottom edge
  (home-indicator inset region left unpainted).
- **Right side** — touch buttons sit correctly but the canvas behind them ends
  before the screen edge on some aspects.

This is exactly the class of bug HANDOFF.md §0 calls out ("full-screen fill on
every aspect ratio, no black bars") — it regressed or was never true on real
notched hardware. Investigate and fix for real:

1. **Audit the full sizing chain:** `index.html` (viewport meta already has
   `viewport-fit=cover`; check the `#app` flex-centering and `html/body` 100%
   sizing vs iOS `100dvh/100svh` behavior), `src/main.ts` (boot + resize/refit
   logic — what dimensions it reads, `window.inner*` vs `visualViewport`, and
   whether it refires after Safari's chrome collapses / orientation settles),
   `src/gfx/viewport.ts` (`widthForAspect` clamps: `VIEW_W_MIN 512` /
   `VIEW_W_MAX 1120` — verify a 19.5:9 through 21:9 phone lands inside, and that
   `Scale.FIT` gets an internal aspect that EXACTLY matches the visible window,
   or it will letterbox).
2. **Safe-area handling must be deliberate:** the canvas must paint edge to
   edge (under the notch and home indicator), while HUD/touch controls keep an
   inset via `env(safe-area-inset-*)` so nothing important hides under hardware.
   Canvas fills 100% of pixels; UI respects safe areas. Both, not either.
3. **iOS Safari specifics:** test the resize path on orientation change, on
   browser-chrome collapse, and in installed-PWA standalone mode. A
   one-time-at-boot read is not enough; refit on `visualViewport` resize.
4. **Scrollable menus:** menus/screens whose content can exceed the viewport on
   mobile (pause menu `src/scenes/PauseScene.ts`, shop `ShopScene.ts`, and any
   settings/level lists) must support touch-drag scrolling (with momentum and
   edge clamping) and mouse wheel on desktop. Nothing may be unreachable on any
   supported aspect ratio. Remember the hard rule: raw `touch*` events via
   `src/systems/touch.ts`, NEVER pointer events over the canvas (iOS kills them).
5. **Verify like it's shipping:** browser-preview at multiple exact device
   viewports (390×844, 430×932, 360×800 — landscape), screenshot each at DPR 1,
   confirm zero unpainted pixels and reachable menu items. State what you
   observed, never what you expect.

**Done when:** every aspect from 4:3 tablet to 21:9 phone shows zero black
bars, HUD/controls sit inside safe areas, menus scroll on touch, tests green,
tsc clean, build passes, committed + pushed.

---

## PHASE 1 — The story spine (the game becomes a journey)

EMBERWILDS gets a real narrative arc, told in-game with the storybook warmth of
the art bible — not a wall of text:

- **The premise (already canon):** the Rust, an industrial clockwork blight
  commanded by **Baron Coglar**, is draining the Emberwilds of warmth. Sorrel
  relights the Warmth Beacons world by world and carries the fight to Coglar's
  Foundry.
- **Deliverables:**
  1. **Opening sequence** on New Game — a short, skippable, fully art-directed
     intro (parallax vignettes + bitmap-font narration beats) that sets the
     stakes: the wilds dimming, the first beacon dying, Sorrel setting out.
  2. **World interstitials** — a narrative beat when entering each new world
     (one screen, one strong image, a few lines) and after each boss falls
     (the world's warmth visibly returns — palette-shift payoff on the map).
  3. **World-map storytelling** — cleared worlds visibly warm up on the hub map;
     the path toward the Foundry grows darker/rustier as you approach.
  4. **A true finale** (replaces the current "boss 3 → back to Title" gap):
     beating the last boss triggers a real ending — warmth floods back, a
     celebration sequence, stats (tokens/gems/time/100%), full credits roll,
     then Title. This must feel like finishing a commercial game.
- Keep all narrative text in one data module (localization-ready string table,
  per the spec §14).

---

## PHASE 2 — Map & visual revamp: every level a Super-Mario-sized sprawl, every screen a painting

This phase is a full revamp of the EXISTING game — layouts AND look — to the
new bar, so the old worlds are indistinguishable in quality from the new ones.

### 2A — Map scale-up

Current levels are ~100–250 tiles wide and mostly linear. That is below the
bar. New standard, enforced going forward (update `tests/levelLint.test.ts`
minimums as levels are upgraded):

- **Size floor:** standard levels **≥ 220 tiles wide** (SMB 1-1 is ~211 — we do
  not ship smaller than Mario), flagship levels 300–400+. Height **≥ 40 tiles**
  with real vertical layering (current 24-tall levels read as corridors).
- **Three-route anatomy** (JJ2 sprawl, per spec §6): a safe low road, a fast
  high road that rewards momentum, and hidden secret routes. Every level.
- **Bonus & secret rooms:** each level carries at least one secret room
  (off-path, discovered by curiosity — cracked walls to ground-pound, hidden
  springs, behind-waterfall gaps) and Worlds 2+ get occasional bonus challenge
  rooms (gem showers, timed token dashes). Skill-gate token routes behind
  glide/wall-jump — the lint explicitly allows unreachable-by-BFS tokens.
- **Intentional pacing:** intro→teach→develop→twist→test inside every level; a
  mid-level checkpoint placed after the halfway climax; distinct setpieces per
  level so no two maps feel alike (different silhouettes, different verticality,
  different mechanic emphasis — never copy-paste corridors).
- **Rework the existing 13 levels to this bar** (Worlds 1–2 first — they are
  the most linear), then hold every new level to it.
- **Authoring workflow stays:** Node generator script whose `validate()`
  mirrors the lint; iterate to OK; then write the `.ts`. Carve air pits AFTER
  filling soil.

### 2B — Visual overhaul: "retro, but lavish"

Owner directive: keep the warm 16-bit language but push the execution to the
level of the best modern pixel-art games (Celeste / Owlboy / Blasphemous —
retro resolution, lavish craft). Same palette law, far richer screens:

- **Tilesets deepened:** interior texture variation (no flat fill regions),
  edge details (grass tufts, hanging roots, moss drips, erosion), decorative
  prop sets per world (mushrooms, stones, ruins fragments, signposts), and
  **animated tiles** — swaying grass/vines, flickering torches, dripping
  water, shimmering waterfalls.
- **Animation budgets raised to spec (ART_BIBLE §budgets are the FLOOR):**
  Sorrel idle with breathing + scarf/ear secondary motion, 8f run, distinct
  jump/apex/fall poses, land squash, victory pose; every enemy gets a clear
  telegraph pose and death animation. Nothing pops in/out without a frame.
- **Light & atmosphere:** day-part tinting per level (dawn/day/dusk/night
  sub-palettes), soft light shafts in forests/ruins, fireflies at dusk, dust
  motes in light, a **contact shadow under every actor**, subtle vignette.
  All warm/natural — the No-Neon law stands.
- **Parallax to 4–6 layers** per world with aerial perspective (far = lighter
  + cooler, near = darker + warmer) plus a foreground occluder layer (grass
  blades, branches, hanging chains in the Foundry) drifting past the camera.
- **Weather & ambient life per world:** drifting leaves (Thornwood), heat
  shimmer + dust devils (Canyon), mist + drips (Mossgrave), fog banks (Fen),
  falling snow + wind streaks (Rimefell), sparks + smoke (Foundry). Every
  screen has motion that says the world is alive.
- **UI as part of the storybook:** animated level-intro title cards, iris/wipe
  transitions everywhere, HUD values that pulse/pop on change, gem pickups
  arcing into the counter.
- **Apply it retroactively:** Thornwood, Canyon, and Mossgrave assets get the
  same overhaul as the new worlds — the first screen of the game must look as
  good as the last.

---

## PHASE 3 — Worlds 4–6: the journey to the Foundry

Build the back half of the game per the original spec (§6/§7 of
`~/Downloads/EMBERWILDS-BUILD-PROMPT.md`):

1. **World 4 — Fen Hollow** (misty marsh): hazard timing, verticality, lifts,
   gas-bloaters/leapers/dragonflies, mud geysers. New mechanic seeds: moving
   platforms / lift timing.
2. **World 5 — Rimefell** (snowfield): ice physics (low-friction ground),
   wind gusts, fragile/cracking ice, freeze-platforming synergy with Frostbloom.
3. **World 6 — Coglar Foundry** (the Rust's heart): conveyors, piston crushers,
   everything-combined remix levels, the coldest palette in the game (iron +
   sullen molten orange — still zero neon).
- **Each world:** theme-registry entry, bespoke tileset + 4 re-skinned enemy
  archetypes + 1 world-unique enemy, original song (distinct musical identity),
  parallax set with aerial perspective, 4–5 levels to the Phase 2 size bar,
  and a boss (below).
- **Three new bosses, mechanics distinct from charge (Rustjaw) and leap-slam
  (Warden):** e.g. a Fen boss about platform-denial from below, a Rimefell
  boss demanding freeze-platforming under wind, and **Baron Coglar himself** —
  a multi-stage clockwork-walker finale that remixes earlier mechanics and ends
  with the warmth-floods-back payoff into the Phase 1 ending. Config-driven via
  `BOSS_CONFIGS` where possible; telegraphed, fair, no health sponges.

---

## PHASE 4 — Systems depth (mechanics, power-ups, music, juice)

- **New mechanics** introduced world by world (one per world, taught safely
  then remixed): e.g. moving platforms/lifts (W4), ice + wind (W5),
  conveyors/pistons/magnets (W6). Each needs sim-pure implementation +
  tests + level integration.
- **Power-up roster grows** beyond scatter/ember/frost/gale where it serves
  platforming-combat interplay (spec §4 candidates: Bouncenut ricochet for
  around-corner switches, Cinder burn that opens vine paths / lights torches).
  Every power-up must matter for MOVEMENT and PUZZLES, not just damage.
- **Music:** every world gets an original track with a real hook; boss themes;
  title theme; world-clear sting; finale/credits piece. Dynamic intensity
  (add layers near danger/bosses) if the Web Audio engine allows it cleanly.
- **Juice audit per spec §11:** hitstop, trauma shake, squash/stretch,
  particles, camera craft, transitions between EVERY scene (no hard cuts),
  animated HUD value changes, ambient life on every screen. Anything static is
  a bug.

---

## STANDING RULES (apply to every phase)

- **Quality bar:** HANDOFF.md §0 verbatim — "would this feel complete if it
  shipped in a commercial game?" Handcrafted, not generated-looking. When in
  doubt, the more polished option wins. Cost is not the constraint.
- **Definition of Done per change:** tests green · `tsc --noEmit` clean ·
  build passes · **verified in-browser with screenshots** · self-reviewed
  against the bar · committed with a clear message + co-author trailer · pushed
  (auto-deploys to emberwilds.fun).
- **Architecture is law:** deterministic 120 Hz Phaser-free sim, pixel art as
  palette-coded strings (equal row widths!), ASCII levels + lint, water as
  regions, config-driven bosses, `VIEW.w` read at runtime, raw touch events
  only. The No-Neon palette is non-negotiable.
- **Ship in slices:** each phase lands as a series of complete, pushed,
  playable increments — never a long-lived broken tree.
- **Keep the docs true:** update HANDOFF.md, README.md, and this file's
  checkboxes as reality changes. Big fan-outs hit session limits — keep
  workflow agent counts modest (≤6) and validate on-disk state after failures.

## PROGRESS

- [ ] Phase 0 — mobile full-screen fill + scrollable menus
- [ ] Phase 1 — story spine (intro, interstitials, map warmth, true finale)
- [ ] Phase 2 — full revamp of W1–W3: ≥220×40 multi-route sprawls + visual overhaul (2A layouts, 2B art)
- [ ] Phase 3 — Worlds 4–6 + three new bosses + Coglar finale fight
- [ ] Phase 4 — mechanics/power-ups/music/juice depth pass
