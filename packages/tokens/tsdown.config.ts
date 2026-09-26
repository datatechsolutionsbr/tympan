import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  dts: true,
  sourcemap: true,
  // scripts/build.mjs writes tokens.css, values.js and dtcg/ into dist first.
  clean: false,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
})
