import { render, screen } from '@testing-library/react'
import { values } from '@datatechsolutions/tympan-tokens/values'
import { describe, expect, it } from 'vitest'
import { setMedia } from '../../../test/media'
import * as motion from './motion'

describe('MotionFoundation', () => {
  it('collapses a transition to zero under reduced motion', () => {
    setMedia({ reducedMotion: true })
    const t = motion.resolveTransition({ durationMs: 240, ease: motion.ease.points.enter, delayMs: 30 })
    expect(t.durationMs).toBe(0)
    expect(t.delayMs).toBe(0)
    setMedia({ reducedMotion: false })
    expect(motion.resolveTransition({ durationMs: 240, ease: motion.ease.points.enter }).durationMs).toBe(240)
  })

  it('answers false without a window-level media query API', () => {
    const saved = window.matchMedia
    // Simulate a server-like environment for the query.
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: undefined })
    expect(motion.prefersReducedMotion()).toBe(false)
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: saved })
  })

  it('keeps every JS token equal to its CSS counterpart', () => {
    const base = values.base
    expect(`${motion.duration.ms.instant}ms`).toBe(base['--ty-dur-instant'])
    expect(`${motion.duration.ms.quick}ms`).toBe(base['--ty-dur-quick'])
    expect(`${motion.duration.ms.base}ms`).toBe(base['--ty-dur-base'])
    const norm = (s: string) => s.replace(/\s+/g, '')
    expect(norm(motion.ease.css.enter)).toBe(norm(base['--ty-ease']))
    expect(norm(motion.ease.css.exit)).toBe(norm(base['--ty-ease-out']))
    expect(motion.duration.s.base).toBe(0.24)
  })

  it('has reduced preset variants without translate or scale', () => {
    for (const entry of Object.values(motion.motionPresets)) {
      const text = JSON.stringify(entry.reduced)
      expect(text).not.toMatch(/translate|scale/)
      expect(entry.reduced.transition.durationMs).toBe(0)
    }
    expect(JSON.stringify(motion.motionPresets)).not.toMatch(/scale|spring/)
  })

  it('exposes exactly the §2.7 steps plus the decorativeMotion flag', () => {
    expect(Object.keys(motion.duration.ms)).toEqual(['instant', 'quick', 'base'])
    expect(Object.keys(motion.ease.points)).toEqual(['enter', 'exit'])
    expect(motion.DECORATIVE_MOTION_DEFAULT).toBe(false)
    expect(Object.keys(motion).some((k) => /spring|stagger/i.test(k))).toBe(false)
  })

  it('reads the decorativeMotion switch from context', () => {
    function Probe() {
      return <output>{String(motion.useDecorativeMotion())}</output>
    }
    const { rerender } = render(<Probe />)
    expect(screen.getByRole('status')).toHaveTextContent('false')
    rerender(
      <motion.DecorativeMotion enabled>
        <Probe />
      </motion.DecorativeMotion>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('true')
  })
})

describe('motion presets in right-to-left pages', () => {
  it('slideFromEnd enters from the inline end in both directions', async () => {
    const { getPreset } = await import('./motion')
    const ltr = getPreset('slideFromEnd', false, 'ltr')
    const rtl = getPreset('slideFromEnd', false, 'rtl')
    expect(ltr.from.translate).toBe('var(--ty-motion-end-offset, 16px) 0')
    expect(rtl.from.translate).toBe('calc(-1 * var(--ty-motion-end-offset, 16px)) 0')
    expect(getPreset('slideFromBottom', false, 'rtl').from.translate).toBe('0 16px')
  })
})
