import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { ContactChannelCard, ContactOfficeCard, ContactSection } from './ContactCard'

describe('ContactCard in right-to-left locales', () => {
  it('keeps e-mail and phone readable inside RTL text and passes axe', async () => {
    const { container } = inRtl(
      <ContactSection title="اتصل بنا" subtitle="اكتب إلى الفريق" headingLevel={2}>
        <ContactChannelCard purposeLabel="شراكات بحثية" email="research@example.org" phone="+55 11 3091-1000" headingLevel={3} />
        <ContactOfficeCard city="القاهرة" addressLines={['شارع التحرير ١']} headingLevel={3} />
      </ContactSection>,
    )
    expect(container.querySelector('a[href^="mailto:"]')).toBeTruthy()
    await expectNoAxeViolations(container)
  })
})
