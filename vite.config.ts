import { defineConfig } from 'vite';

export default defineConfig({
  // relative base so the build runs from any static host path
  // (root domain, GitHub Pages subpath, or itch.io zip)
  base: './',
  plugins: [],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Split the bundle so the browser downloads in parallel and — the real
        // win — caches the big, rarely-changing pieces across deploys:
        //   • vendor-phaser: the ~1.3 MB engine. Never changes between game
        //     updates, so returning players re-download only the game chunk.
        //   • gamedata: the hand-authored pixel-art sheets + ASCII levels
        //     (static string arrays). Changes far less often than scene logic.
        //   • index: the actual game code (scenes, systems) — the small chunk
        //     that changes almost every deploy.
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'vendor-phaser';
          if (id.includes('/src/gfx/data/') || id.includes('/src/data/levels/')) return 'gamedata';
          return undefined;
        },
      },
    },
  },
});
