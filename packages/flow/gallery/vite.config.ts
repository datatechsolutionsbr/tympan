import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'
import { themeInitScript } from '../../ui/src/internal/theme.tsx'

export const GALLERY_STORAGE_KEY = 'ty-flow-gallery-theme'

export default defineConfig({
  root: import.meta.dirname,
  base: './',
  plugins: [
    react(),
    {
      name: 'ty-theme-init',
      transformIndexHtml: (html) => html.replace('</head>', `<script>${themeInitScript(GALLERY_STORAGE_KEY)}</script>\n  </head>`),
    },
  ],
  resolve: { conditions: ['tympan-source', ...defaultClientConditions] },
  ssr: { resolve: { conditions: ['tympan-source'] } },
  build: { outDir: '../dist-gallery', emptyOutDir: true, chunkSizeWarningLimit: 2000 },
  server: { port: 3320 },
})
