import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'
import { printThemeFontUrls } from '../../tokens/src/print-themes.ts'
import { themeInitScript } from '../src/internal/theme.tsx'

export const GALLERY_STORAGE_KEY = 'ty-gallery-theme'

export default defineConfig({
  root: import.meta.dirname,
  base: './',
  plugins: [
    react(),
    {
      name: 'ty-theme-init',
      // The SPA pattern documented in the README: set the stored theme before first paint.
      transformIndexHtml: (html) => html.replace('</head>', `<script>${themeInitScript(GALLERY_STORAGE_KEY, {}, { fonts: printThemeFontUrls })}</script>\n  </head>`),
    },
  ],
  resolve: { conditions: ['tympan-source', ...defaultClientConditions] },
  build: { outDir: '../dist-gallery', emptyOutDir: true, chunkSizeWarningLimit: 1200 },
  server: { port: 3310 },
})
