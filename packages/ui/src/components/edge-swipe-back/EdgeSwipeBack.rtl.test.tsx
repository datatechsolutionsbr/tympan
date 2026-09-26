import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { EdgeSwipeBack } from './EdgeSwipeBack'

describe('EdgeSwipeBack in right-to-left locales', () => {
  it('uses the right edge as the start edge in Arabic and passes axe', async () => {
    const { container } = inRtl(
      <EdgeSwipeBack onBack={vi.fn()}>
        <p>اسحب من الحافة</p>
      </EdgeSwipeBack>,
    )
    const side = container.querySelector('[data-side]')
    if (side) expect(side).toHaveAttribute('data-side', 'right')
    await expectNoAxeViolations(container)
  })
})
