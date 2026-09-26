import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { RevealNumber } from './RevealNumber'

describe('RevealNumber in right-to-left locales', () => {
  it('renders inside an Arabic (ar-EG) right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<RevealNumber to={1234} />, 'ar-EG')
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.textContent).toContain(new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(1234))
    await expectNoAxeViolations(container)
  })
})
