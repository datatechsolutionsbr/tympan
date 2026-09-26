import { describe, expect, it } from 'vitest'
import { createLoaderPresets, loaderToneColour, loaderToneNames, type LoaderTone } from './LoaderPresets'

describe('LoaderPresets', () => {
  it('always holds the default preset', () => {
    expect(createLoaderPresets([]).ids()).toEqual(['default'])
    expect(createLoaderPresets([]).resolve('default')?.tone).toBe('accent')
  })

  it('throws a descriptive error for duplicate ids', () => {
    const p = { id: 'x', mark: null, tone: 'accent' as const }
    expect(() => createLoaderPresets([p, p])).toThrow(/"x" is used twice/)
  })

  it('throws for a tone that is not a tone name', () => {
    expect(() => createLoaderPresets([{ id: 'x', mark: null, tone: 'violet' as LoaderTone }])).toThrow(/not a tone name/)
  })

  it('maps every tone to a token reference, never a literal colour', () => {
    for (const tone of loaderToneNames) expect(loaderToneColour(tone)).toMatch(/^var\(--ty-[\w-]+\)$/)
  })
})
