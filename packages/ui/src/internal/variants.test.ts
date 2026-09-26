import { describe, expect, it } from 'vitest'
import { variants } from './variants'

describe('variants()', () => {
  const button = variants({ variant: ['primary', 'secondary'], size: ['compact', 'regular'] } as const, { variant: 'secondary', size: 'regular' })

  it('applies defaults and returns data attributes', () => {
    expect(button.attributes({ variant: 'primary' })).toEqual({ 'data-variant': 'primary', 'data-size': 'regular' })
  })

  it('rejects unknown values', () => {
    expect(() => button.resolve({ size: 'huge' as 'compact' })).toThrow(/Unknown size "huge"/)
  })
})
