import { defineConfig } from 'tsdown'

export default defineConfig({
  // Two entries: the flow canvas is a subpath (@datatechsolutions/tympan/flow), so
  // hosts that only use the components never load it or its layout dependency.
  entry: { index: 'src/index.ts', flow: 'src/flow/index.ts' },
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  dts: { tsconfig: 'tsconfig.build.json' },
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  clean: true,
  external: [/^react/, /^react-aria/, /^react-aria-components/, /^lucide-react/, /^@datatechsolutions\/tympan-tokens/, /^d3-geo/, /^@internationalized\//, /^@dagrejs\//],
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // Components use React context and effects: client modules for RSC hosts.
  banner: { js: '"use client";' },
})
