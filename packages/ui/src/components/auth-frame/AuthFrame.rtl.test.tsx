import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { AuthFrame } from './AuthFrame'
import { BrandMark } from '../brand-mark/BrandMark'

describe('AuthFrame in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<AuthFrame mainLabel="تسجيل الدخول" mark={<BrandMark />} brandPanel={{ mark: <BrandMark showWordmark={false} />, title: 'الدليل قبل الرأي', subtitle: 'منضدة هادئة', figures: [{ value: '٩٤', label: 'حالة' }] }}><h1>تسجيل الدخول</h1></AuthFrame>)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.textContent).toContain('تسجيل الدخول')
    await expectNoAxeViolations(document.body, ['region'])
  })
})
