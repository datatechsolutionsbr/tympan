import { defineConfig } from 'tsdown'

// The standalone custom-element bundle for hosts outside npm: every
// dependency inlined, registers the elements on load.
export default defineConfig({
  entry: { 'elements.bundle': 'src/elements/register.ts' },
  format: ['esm'],
  platform: 'browser',
  target: 'es2022',
  dts: false,
  tsconfig: 'tsconfig.build.json',
  sourcemap: false,
  clean: false,
  minify: true,
  noExternal: [/.*/],
  outExtensions: () => ({ js: '.js' }),
})
