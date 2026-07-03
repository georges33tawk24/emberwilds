# Credits & Licensing

## EMBERWILDS

Design, code, pixel art, music, and sound: authored for this project.

Every asset in this repository is original work created for EMBERWILDS:

- **Pixel art** — hand-authored as palette-coded pixel data in
  `src/gfx/data/*.ts`, baked to texture atlases at runtime. No third-party
  sprites, no ripped assets.
- **Font** — the 4×6 bitmap UI font in `src/gfx/data/fontData.ts` is original.
- **Music** — the chiptune scores in `src/audio/songs.ts` are original
  compositions, performed by the in-repo Web Audio sequencer.
- **Sound effects** — synthesized procedurally at runtime
  (`src/audio/engine.ts`). No samples.

## Third-party software (code dependencies, not shipped assets)

| Package | License | Use |
|---|---|---|
| [Phaser 4](https://phaser.io) | MIT | game framework / renderer |
| [TypeScript](https://www.typescriptlang.org) | Apache-2.0 | language |
| [Vite](https://vite.dev) | MIT | build tool |
| [Vitest](https://vitest.dev) | MIT | test runner |

No Nintendo or Jazz Jackrabbit IP — characters, names, levels, music, or
sprites — is referenced or reused. Genre "feel" targets only.
