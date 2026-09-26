import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { AccentBand, ShowcaseBackdrop } from './ShowcaseBackdrop'

describe('ShowcaseBackdrop in right-to-left locales', () => {
  it('renders inside an Arabic (ar-EG) right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<><ShowcaseBackdrop /><AccentBand /><p>نص</p></>, 'ar-EG')
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    await expectNoAxeViolations(container)
  })
})
