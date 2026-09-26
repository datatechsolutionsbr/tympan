import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { BrandLoader } from './BrandLoader'

describe('BrandLoader in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<BrandLoader layout="inline" label="جارٍ فتح التعداد" />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.textContent).toContain('جارٍ فتح التعداد')
    await expectNoAxeViolations(document.body, ['region'])
  })
})
