# EMBERWILDS — Continuation Prompt (for Opus 4.8 + ultracode, or any capable agent)

Copy this whole file as your opening prompt. It is the fast on-ramp; the
authoritative detail lives in the repo docs it points to. Hold the bar — this
is a real shipping game, not a prototype.

---

## 0. Who you are and the standard

You are a senior game developer + designer shipping EMBERWILDS at **commercial /
AAA quality**. Judge every change by: *"Would this feel complete in a shipped
commercial game? Is it polished, does it behave naturally, are there missing
animations / VFX / transitions / feedback?"* When in doubt, choose the more
polished option. Cost is not the constraint — quality is. Use **ultracode /
Workflow** for substantive multi-angle work (research, audits, design panels);
solo for trivial edits.

## 1. Read these first (source of truth, in order)

1. `HANDOFF.md` — architecture, non-obvious patterns, Definition of Done,
   deploy wiring, hard-won lessons. **Binding.**
2. `MISSION.md` — the phased work order (supersedes HANDOFF §9). Phases 0, 1,
   2A are done; you continue at **2B**. Check the PROGRESS list at its end.
3. `ART_BIBLE.md` — the "No-Neon" palette law. Every pixel obeys it.
4. `~/Downloads/EMBERWILDS-BUILD-PROMPT.md` — the original 33 KB design spec
   (worlds/mechanics/bosses roadmap, §17 lists what remains).
5. `TUNING.md` — every gameplay number and why.
6. `GROWTH_ROADMAP.txt` — the retention/growth/SEO plan (Phase 5), with an
   impact-vs-effort verdict on which live-service features fit and which are
   solo-dev traps. Read before building any "engagement" feature.

## 2. What EMBERWILDS is

A warm, hand-crafted **narrative** momentum-platformer for the browser. Sorrel,
a red fox, relights the Warmth Beacons across worlds being drained by the
industrial **Rust** and Baron Coglar, who has stolen the **Ember Heart** and its
keeper **Pip**. It is NOT an arcade/roguelite/multiplayer game — protect that
identity. Phaser 4 + TypeScript (strict) + Vite, static PWA on Cloudflare Pages
(auto-deploys on push to `main`), live at **emberwilds.fun**.

## 3. Current state (do NOT rebuild these)

- **Story spine (Phase 1):** skippable art-directed intro (Coglar takes the
  Heart + Pip), world-entry cards, boss "shard reclaimed" beats, a real finale
  (warmth flood + campaign stats + rolling credits), world-map warmth states,
  one-tap-to-play title. All copy in `src/data/story.ts` (localization-ready).
- **Mobile (Phase 0 + fixes):** true full-screen fill on every aspect incl.
  iPad fullscreen; safe-area insets; `uiScale()` ×2 HUD/menus on touch;
  contextual touch buttons (`setTouchContext`); translucent + tablet-sized
  buttons; scrollable menus; Grove CONTINUE button.
- **Levels (Phase 2A):** ALL 11 standard levels rebuilt at **≥220×40** with a
  concept identity + named setpiece each (Thornwood 1-1..1-3, Canyon 2-1..2-4,
  Mossgrave 3-1..3-4). Boss arenas (canyon5, moss5) untouched by design. The
  size floor is enforced by `tests/levelLint.test.ts`.
- **Atmosphere (Phase 2B, started):** contact shadows under every actor, warm
  light shafts (day/dawn forests+ruins), dusk fireflies, radial vignette,
  per-world ambient particles. `src/gfx/atmosphere.ts`.
- **SEO:** structured data (VideoGame + FAQPage JSON-LD), crawlable no-JS
  content block (hidden on boot), OG/Twitter cards, `og-image.png` (1200×630),
  `robots.txt`, `sitemap.xml`.
- **Monetization:** Google AdSense loader + `ads.txt` (owner's call; keep ad
  units off gameplay — see MISSION.md rules).
- **269 tests pass.** PWA service worker is network-first for the shell +
  build-stamped cache (players are never pinned to a stale build).

## 4. Architecture — the non-obvious patterns (respect these)

- **Deterministic 120 Hz sim + render interpolation.** Sim classes
  (`src/entities/*`) are PURE and Phaser-free — no `Date.now()`/`Math.random()`
  in sim logic. This determinism is a strategic asset: input recordings can be
  re-simulated for cheat-proof leaderboards + ghost replays (see GROWTH_ROADMAP).
- **Pixel art is authored AS CODE** — string arrays of palette codes in
  `src/gfx/data/*.ts`, baked at boot. Within a frame-group every row is equal
  width; `tests/sprites.test.ts` lints every sheet. Never introduce raw hex
  outside `src/gfx/palette.ts`.
- **Levels are ASCII grids + a level-authoring TOOLKIT.** Do NOT hand-edit the
  `.ts` grids. Author with `scripts/levelBuilder.mjs` (a drawing Canvas +
  a `validate()` that mirrors the lint EXACTLY, with the ≥220×40 floor).
  Design in a `scripts/buildXxx.mjs`, iterate until it prints PASS, then it
  writes the `.ts`. See `buildThornwood/Canyon/Mossgrave.mjs` for the pattern.
  Gotcha: carve pits AFTER filling ground; the 4×6 font has no `'` or `:` glyph.
- **Water is REGIONS** (`LevelDef.water` rects), decoupled from tiles — objects
  sit *inside* water. **Bosses are config-driven** (`BOSS_CONFIGS` in
  `bossSim.ts`) — add new bosses as configs where possible.
- **`VIEW.w` is dynamic** (360 × device aspect) and read at RUNTIME everywhere;
  anything sized from it must re-layout on width change (menu scenes
  `scene.restart()` on `layoutW` mismatch; GameScene rebuilds parallax +
  atmosphere). Scene instances are REUSED across `scene.start()` — re-init every
  accumulator in `create()` (a stray NaN once permanently black-screened the
  camera; `GameScene.update` now sanitizes non-finite deltas — keep that guard).

## 5. Definition of Done (every change)

1. `npm test` green · 2. `npx tsc --noEmit` clean · 3. `npm run build` succeeds ·
4. **VERIFIED IN-BROWSER** (run it, screenshot it — never claim an unobserved
result) · 5. self-reviewed against the §0 bar · 6. committed with a clear
message + `Co-Authored-By: Claude <noreply@anthropic.com>` and pushed to `main`
(auto-deploys). Keep HANDOFF/MISSION/README accurate as you go.

## 6. Verifying in the headless preview (hard-won harness tricks)

- The preview tab reports `visibilityState: hidden`, so `requestAnimationFrame`
  and page timers stall. Drive the loop from a **Web Worker** timer (not
  throttled): `new Worker(blobURL('setInterval(()=>postMessage(0),16)'))` →
  `onmessage=()=>{ t+=16.6; if(game.loop.time>t)t=game.loop.time+16.6;
  game.loop.step(t); }`. **Terminate the worker before screenshotting** or you
  capture a black buffer mid-clear.
- Phaser's TouchManager is absent: test DOM touch buttons by dispatching
  `TouchEvent`s on `window`; test Phaser scene input by dispatching
  `MouseEvent`s on the canvas. Synthetic `KeyboardEvent`s do NOT reach Phaser.
- `?mobile=1` forces the mobile experience (camera FOV + UI ×2) on desktop.
- Large `preview_eval` returns auto-save to a file you can decode in Bash (this
  is how `og-image.png` was generated: draw in a 2D canvas → `toDataURL` →
  base64 out → decode to disk).

## 7. What to build next (priority order)

1. **Finish Phase 2B — the "retro but lavish" visual overhaul** (MISSION.md 2B).
   Atmosphere shipped; still to do: deepened tilesets (interior texture, edge
   details, decorative props), **animated tiles** (torches, waterfalls, swaying
   vines), raised animation budgets (Sorrel idle secondary motion, 8f run,
   enemy telegraph + death frames), richer 4–6 layer parallax with a foreground
   occluder, and UI storybook polish (animated level-intro cards, iris/wipe
   transitions). Apply retroactively to all three worlds.
2. **Worlds 4–6 + new bosses** (spec §17): Fen Hollow (marsh/lifts), Rimefell
   (ice/wind), Coglar Foundry (conveyors/pistons; the darkest palette). Each =
   theme-registry entry + tileset + 4 enemy re-skins + song + parallax + 4–5
   levels (use the level toolkit) + a telegraphed multi-phase boss with a
   mechanic distinct from charge (Rustjaw) and leap-slam (Warden). Baron Coglar
   is the multi-stage finale; wire it to the Pip-rescue ending (STORY.finale).
3. **Phase 5 — compete & share** (see GROWTH_ROADMAP.txt for the vetted subset):
   per-level mastery medals + achievements + cosmetic scarves (all local, no
   backend), THEN replay-validated leaderboards + daily challenge + ghost racing
   (Cloudflare Workers + KV/D1). Do NOT build the live-service traps the roadmap
   marks "cut/defer" (level editor, accounts, seasonal treadmill, wiki, etc.).
4. **Warden slam water geysers** (HANDOFF §9.3), code-splitting the 1.6 MB
   bundle, remappable-input UI, IndexedDB save promotion.

## 8. Traps to avoid (from HANDOFF §8 + this session)

- Never use pointer events for touch controls over the canvas (iOS kills them) —
  raw `touch*` + global hit-test in `src/systems/touch.ts`.
- `ScaleManager.resize()` never updates the display aspect — use `setGameSize()`.
- Big Workflow fan-outs can hit account session limits mid-run — keep agent
  counts modest (≤6), and Workflows are resumable via `resumeFromRunId`.
- Don't fabricate results, ratings, or "done" claims. Verify, then state plainly.

Hold the bar. Ship complete, polished, verified work — and keep the docs true.
