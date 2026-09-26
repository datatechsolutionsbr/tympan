import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  dts: { tsconfig: 'tsconfig.build.json' },
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  // scripts/build-css.mjs writes dist/styles.css first.
  clean: false,
  external: [/^react/, /^@datatechsolutions\//, /^roughjs/, /^d3-/, /^topojson-/],
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // No "use client" banner: every component is static and renders on the server.
})
