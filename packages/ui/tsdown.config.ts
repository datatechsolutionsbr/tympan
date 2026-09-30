import { defineConfig } from 'tsdown'

export default defineConfig({
  // One entry per subpath: the flow canvas (@datatechsolutions/tympan/flow) and
  // generated avatars (/avatars) and flags (/flags) sit apart from the
  // components, so hosts that do not import them never load them or their
  // optional peer dependencies. The custom elements are subpaths too:
  // @datatechsolutions/tympan/elements (the elements, no React) and
  // /elements/react (the generated wrappers).
  entry: { index: 'src/index.ts', flow: 'src/flow/index.ts', avatars: 'src/avatars/index.ts', flags: 'src/flags/index.ts', elements: 'src/elements/index.ts', 'elements-react': 'src/elements/react/index.ts' },
  format: ['esm'],
  platform: 'neutral',
  target: 'es2022',
  dts: { tsconfig: 'tsconfig.build.json' },
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  clean: true,
  external: [/^react/, /^react-aria/, /^react-aria-components/, /^lucide-react/, /^@datatechsolutions\/tympan-tokens/, /^d3-geo/, /^@internationalized\//, /^@dagrejs\//, /^@dicebear\//],
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // One lazily loaded chunk per flag and aspect, filed as dist/flags/<aspect>/<code>-<hash>.js.
  outputOptions: {
    chunkFileNames: (chunk) => {
      const flag = /[\\/]flags[\\/]art[\\/](4x3|1x1)[\\/]/.exec(chunk.facadeModuleId ?? '')
      return flag ? `flags/${flag[1]}/[name]-[hash].js` : '[name]-[hash].js'
    },
  },
  // Components use React context and effects: client modules for RSC hosts.
  banner: { js: '"use client";' },
})
