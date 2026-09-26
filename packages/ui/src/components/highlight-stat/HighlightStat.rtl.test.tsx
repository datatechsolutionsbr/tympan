import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { HighlightStat } from './HighlightStat'

describe('HighlightStat in right-to-left locales', () => {
  it('renders inside an Arabic (ar-EG) right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<HighlightStat value={512} label="ادعاءات مثبتة" />, 'ar-EG')
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.textContent).toContain(new Intl.NumberFormat('ar-EG').format(512))
    await expectNoAxeViolations(container)
  })
})
