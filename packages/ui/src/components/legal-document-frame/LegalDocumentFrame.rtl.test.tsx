import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { LegalDocumentFrame } from './LegalDocumentFrame'

describe('LegalDocumentFrame in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<LegalDocumentFrame title="سياسة الخصوصية" updatedAt="٢٠ سبتمبر"><h2>حماية البيانات</h2><p>نص.</p></LegalDocumentFrame>)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(document.getElementById('حماية-البيانات')).not.toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })
})
