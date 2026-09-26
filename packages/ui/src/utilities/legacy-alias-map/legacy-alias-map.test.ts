// Decision record check (spec: wave-4/legacy-alias-map.md): no legacy alias
// concept is exported, motion exposes only the §2.7 steps plus the
// decorativeMotion flag, and SwipeRow has no pixel-valued properties.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as library from '../../index'
import { duration, ease } from '../motion-foundation/motion'

const here = dirname(fileURLToPath(import.meta.url))

/** Concepts, not names: duration aliases, spring and stagger presets, platform colour sets, lift presets. */
const LEGACY_CONCEPTS: RegExp[] = [
  /spring/i,
  /stagger/i,
  /^durations(Reduced)?$/i,
  /^easings$/i,
  /reduced(Durations|Presets|Variants)/i,
  /^ios/i,
  /systemColou?rs?$/i,
  /^card(Hover|Press|Lift)/i,
  /^(createMotionProps|getVariants)$/i,
  /^pageControl/i,
  /^swipe(Threshold|Constants?|Limits?)$/i,
  /notificationBanner/i,
  /^(slideUp|slideDown|slideRight|fadeScale|buttonPress)$/i,
]

describe('LegacyAliasMap', () => {
  it('exports none of the old alias concepts', () => {
    const offenders = Object.keys(library).filter((name) => LEGACY_CONCEPTS.some((re) => re.test(name)))
    expect(offenders).toEqual([])
  })

  it('motion exposes exactly the §2.7 tokens plus decorativeMotion', () => {
    expect(Object.keys(duration.ms)).toEqual(['instant', 'quick', 'base'])
    expect(Object.keys(ease.points)).toEqual(['enter', 'exit'])
    expect('DECORATIVE_MOTION_DEFAULT' in library ? (library as Record<string, unknown>).DECORATIVE_MOTION_DEFAULT : false).toBe(false)
  })

  it('SwipeRow has no property expressed in pixels', () => {
    const source = readFileSync(join(here, '../../components/swipe-row/SwipeRow.tsx'), 'utf8')
    const props = /export interface SwipeRowProps \{([\s\S]*?)\n\}/.exec(source)![1]!
    expect(props).not.toMatch(/\b\w*(Px|Pixels?|threshold)\??:/i)
    expect(props).toMatch(/fullSwipeFraction\?: number/)
    expect(props).toMatch(/revealFraction\?: number/)
  })

  it('the decision record names concepts, not old export names', () => {
    const doc = readFileSync(join(here, 'LEGACY-ALIASES.md'), 'utf8')
    expect(doc).toMatch(/ships no aliases/)
    // No camelCase export-like identifiers other than the new API's.
    const identifiers = [...doc.matchAll(/`([a-z]+[A-Z]\w*)`/g)].map((m) => m[1])
    expect(identifiers.every((id) => ['fullSwipeFraction', 'revealFraction', 'resolveTransition', 'decorativeMotion', 'slideFromBottom', 'slideFromEnd', 'fadeIn', 'getPreset', 'motionPresets'].some((ok) => id!.startsWith(ok)))).toBe(true)
  })
})
