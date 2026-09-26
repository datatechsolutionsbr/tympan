import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { DeltaIndicator } from './DeltaIndicator'

describe('DeltaIndicator in right-to-left locales', () => {
  it('mirrors the sideways glyph, formats with Arabic-Indic digits (ar-EG) and passes axe', async () => {
    const { container } = inRtl(
      <>
        <DeltaIndicator value={12.5} />
        <DeltaIndicator value={-3} unit="number" appearance="pill" />
      </>,
      'ar-EG',
    )
    for (const glyph of container.querySelectorAll('.fk-delta__glyph')) expect(glyph).toHaveClass('fk-mirror-rtl')
    expect(container.textContent).toMatch(/[٠-٩]/)
    await expectNoAxeViolations(container)
  })
})
