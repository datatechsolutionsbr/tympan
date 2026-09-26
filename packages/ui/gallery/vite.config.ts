import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'
import { themeInitScript } from '../src/internal/theme.tsx'

export const GALLERY_STORAGE_KEY = 'fk-gallery-theme'

export default defineConfig({
  root: import.meta.dirname,
  base: './',
  plugins: [
    react(),
    {
      name: 'fk-theme-init',
      // The SPA pattern documented in the README: set the stored theme before first paint.
      transformIndexHtml: (html) => html.replace('</head>', `<script>${themeInitScript(GALLERY_STORAGE_KEY)}</script>\n  </head>`),
    },
  ],
  resolve: { conditions: ['fakhir-source', ...defaultClientConditions] },
  build: { outDir: '../dist-gallery', emptyOutDir: true, chunkSizeWarningLimit: 1200 },
  server: { port: 3310 },
})
