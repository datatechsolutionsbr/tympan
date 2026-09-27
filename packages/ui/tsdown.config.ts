import { defineConfig } from 'tsdown'

export default defineConfig({
  // One entry per subpath: the flow canvas (@datatechsolutions/tympan/flow) and
  // generated avatars (/avatars) sit apart from the components, so hosts that
  // do not import them never load them or their optional peer dependencies.
  entry: { index: 'src/index.ts', flow: 'src/flow/index.ts', avatars: 'src/avatars/index.ts' },
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  dts: { tsconfig: 'tsconfig.build.json' },
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  clean: true,
  external: [/^react/, /^react-aria/, /^react-aria-components/, /^lucide-react/, /^@datatechsolutions\/tympan-tokens/, /^d3-geo/, /^@internationalized\//, /^@dagrejs\//, /^@dicebear\//],
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // Components use React context and effects: client modules for RSC hosts.
  banner: { js: '"use client";' },
})
