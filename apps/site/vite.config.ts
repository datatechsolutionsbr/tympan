import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'
import { printThemeFontUrls } from '@datatechsolutions/tympan-tokens'
// The init script only, from source (the package entry would load every component into the config).
import { themeInitScript } from '../../packages/ui/src/internal/theme.tsx'

/** localStorage key of the shell's theme, mode and density (ThemeProvider storageKey). */
export const SITE_THEME_KEY = 'ty-site-tema'

export default defineConfig({
  root: import.meta.dirname,
  // Relative asset paths and hash routes: the build folder works from any path (and as a claude.ai artifact).
  base: './',
  plugins: [
    react(),
    {
      name: 'ty-site-theme-init',
      // The stored theme is applied before first paint (no flash of the wrong theme).
      transformIndexHtml: (html) =>
        html.replace('</head>', `<script>${themeInitScript(SITE_THEME_KEY, {}, { fonts: printThemeFontUrls })}</script>\n  </head>`),
    },
  ],
  resolve: { conditions: ['tympan-source', ...defaultClientConditions] },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 2500, assetsInlineLimit: 0 },
  server: { host: '127.0.0.1', port: 3410, strictPort: true },
  preview: { host: '127.0.0.1', port: 3411, strictPort: true },
})
