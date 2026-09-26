import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  dts: { tsconfig: 'tsconfig.build.json' },
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  clean: true,
  external: [/^react/, /^react-aria-components/, /^lucide-react/, /^@datatechsolutions\//, /^@dagrejs\//],
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // Canvas components hold state and effects: client modules for RSC hosts.
  banner: { js: '"use client";' },
})
