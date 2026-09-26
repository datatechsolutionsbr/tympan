import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { workspaceResolve } from '../../vitest.shared.ts'

export default defineConfig({
  plugins: [react()],
  ...workspaceResolve,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
    css: false,
    testTimeout: 20000,
  },
})
