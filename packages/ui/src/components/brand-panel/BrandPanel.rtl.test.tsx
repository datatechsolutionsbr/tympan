import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { BrandMark } from '../brand-mark/BrandMark'
import { BrandPanel } from './BrandPanel'

describe('BrandPanel in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<BrandPanel mark={<BrandMark />} title="الدليل قبل الرأي" subtitle="منضدة هادئة" figures={[{ value: '٩٤', label: 'حالة' }]} />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })
})
