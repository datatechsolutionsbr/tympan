import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { Kicker, ShowcaseHeading } from './ShowcaseHeading'

describe('ShowcaseHeading in right-to-left locales', () => {
  it('renders inside an Arabic (ar-EG) right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<><ShowcaseHeading level={2} kicker="بحث عام" lead="تعداد عالمي لمساعدي الذكاء الاصطناعي الحكومية.">تعداد الذكاء الاصطناعي الحكومي</ShowcaseHeading><Kicker>مستقل</Kicker></>, 'ar-EG')
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.querySelector('h2')!.textContent).toContain('تعداد')
    await expectNoAxeViolations(container)
  })
})
