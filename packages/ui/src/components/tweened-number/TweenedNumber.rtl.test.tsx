import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { TweenedNumber } from './TweenedNumber'

describe('TweenedNumber in right-to-left locales', () => {
  it('formats with the locale digits (Arabic-Indic in ar-EG) and passes axe', async () => {
    const { container } = inRtl(<TweenedNumber value={1234} durationMs={0} />, 'ar-EG')
    expect(container.querySelector('.fk-tweened-number')!.textContent).toBe(new Intl.NumberFormat('ar-EG').format(1234))
    expect(container.textContent).toMatch(/[٠-٩]/)
    await expectNoAxeViolations(container)
  })

  it('keeps fixed decimals in the locale (Devanagari digits in hi-IN-u-nu-deva)', () => {
    inRtl(<TweenedNumber value={3.5} decimals={1} durationMs={0} />, 'hi-IN-u-nu-deva')
    expect(screen.getByText(new Intl.NumberFormat('hi-IN-u-nu-deva', { minimumFractionDigits: 1 }).format(3.5))).toBeInTheDocument()
  })
})
