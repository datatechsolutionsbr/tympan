import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'

export default defineConfig({
  root: import.meta.dirname,
  base: './',
  plugins: [react()],
  resolve: { conditions: ['tympan-source', ...defaultClientConditions] },
  build: { outDir: '../dist-gallery', emptyOutDir: true, chunkSizeWarningLimit: 3000 },
  server: { port: 3330 },
  preview: { port: 3331 },
})
