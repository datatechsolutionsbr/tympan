import { describe, expect, it } from 'vitest'
import { BUILT_IN_LOCALES, builtInLabels } from '../index'

describe('builtInLabels', () => {
  it('lists every shipped label definition once, each with a complete English bundle', () => {
    const all = builtInLabels()
    const keys = all.map((d) => d.key)
    expect(keys.length).toBeGreaterThan(50)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toContain('provenance')
    for (const d of all) {
      expect(Object.keys(d.bundles.en).length).toBeGreaterThan(0)
      for (const locale of Object.keys(d.bundles)) expect(BUILT_IN_LOCALES as readonly string[]).toContain(locale)
    }
  })
})
