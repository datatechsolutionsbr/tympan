import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'
import { themeInitScript } from '../../ui/src/internal/theme.tsx'

export const GALLERY_STORAGE_KEY = 'fk-flow-gallery-theme'

export default defineConfig({
  root: import.meta.dirname,
  base: './',
  plugins: [
    react(),
    {
      name: 'fk-theme-init',
      transformIndexHtml: (html) => html.replace('</head>', `<script>${themeInitScript(GALLERY_STORAGE_KEY)}</script>\n  </head>`),
    },
  ],
  resolve: { conditions: ['fakhir-source', ...defaultClientConditions] },
  ssr: { resolve: { conditions: ['fakhir-source'] } },
  build: { outDir: '../dist-gallery', emptyOutDir: true, chunkSizeWarningLimit: 2000 },
  server: { port: 3320 },
})
