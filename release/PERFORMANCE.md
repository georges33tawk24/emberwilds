# Performance Audit — Emberwilds

_Static audit, 2026-07-10. Figures are from `npm run build`; the items marked
**[measure]** need a profiling run on real hardware to tick fully (blocked here
by a local dev-server fault)._

## Loading — first playable

The game downloads **only JavaScript** — there are no image, audio, or font
files to fetch (every sprite is a code array, all audio is procedural Web Audio,
the font is a code bitmap). Gzipped transfer of a cold load:

| Chunk | Raw | Gzip | Cached? |
|---|---|---|---|
| `vendor-phaser` | 1.39 MB | **370 KB** | immutable hash — cached forever after first load |
| `gamedata` (levels/sprites) | 403 KB | **26 KB** | immutable hash |
| `index` (game code) | 197 KB | **62 KB** | immutable hash |
| **Total first load** | — | **~458 KB gz** | — |

- **Code-split into 3 content-hashed chunks**, so a code change re-downloads
  only `index` (62 KB), not Phaser.
- **PWA service worker** caches the shell — repeat visits are near-instant and
  work offline.
- Phaser (370 KB gz) dominates and is the realistic floor for a Phaser game;
  it's well under portal limits and cached after the first visit.
- **[measure]** Confirm time-to-first-playable < 5s on a cold load with 3G-class
  throttling. The transfer budget (~458 KB) comfortably supports it, but the
  number should be measured.

## Runtime

- **Sim/render split** — gameplay logic lives in Phaser-free `*Sim.ts` modules;
  rendering is separate. Deterministic, allocation-conscious.
- **Object pooling** — `src/core/pool.ts` backs the churny actors (projectiles,
  particles) so the hot path doesn't allocate per spawn → fewer GC spikes.
- **Textures** — sprite sheets are baked to small canvases at boot
  (`registerSheet`), sized to the frames; no 2048/4096 megatextures.
- **DOM** — a single WebGL canvas plus a handful of control/overlay canvases.
  No per-frame DOM churn; the HUD is drawn in-canvas.
- **Audio** — synthesized on demand; nothing streamed or decoded from files.
- **[measure]** Confirm a stable 60 FPS and flat heap over a long session on a
  mid-range phone (Chrome DevTools Performance + Memory). No leak is expected
  given the pooling + sim/render split, but it should be profiled.

## Verdict

Nothing in the static picture is a portal blocker: tiny asset footprint,
cache-friendly chunking, pooled hot paths, minimal DOM. The two **[measure]**
items are confirmations, not suspected problems — run them on a device before
final sign-off.
