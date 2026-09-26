import { defaultClientConditions, defaultServerConditions } from 'vite'
import type { UserConfig } from 'vitest/config'

/**
 * Resolve sibling workspace packages to their TypeScript sources (the
 * `fakhir-source` export condition) so tests never depend on a prior build.
 */
export const workspaceResolve: Pick<UserConfig, 'resolve' | 'ssr'> = {
  resolve: { conditions: ['fakhir-source', ...defaultClientConditions] },
  ssr: { resolve: { conditions: ['fakhir-source', ...defaultServerConditions] } },
}
