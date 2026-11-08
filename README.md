# reproductions

Browser-runnable bug reproductions, published at https://issueset.github.io/reproductions/.

Each `YYYY-MM-DD-<name>/` directory is a standalone Vite project:

- `src/index.html` is the Vite entry page, with its scripts and styles in `src/`.
- `vite.config.js` sets `root: 'src'`, `base: './'`, and `build.outDir: '../dist'`.
- `dist/` is the build output. It is committed, so GitHub Pages serves it directly.
- `index.html` redirects to `./dist/`, so the URL works without `dist/`.

Add a reproduction:

1. Copy an existing directory and rename it `YYYY-MM-DD-<name>/`.
2. Run `pnpm install && pnpm run build` inside it, and commit `dist/`.
3. Run `node scripts/index.mjs` to regenerate the root `index.html`.
