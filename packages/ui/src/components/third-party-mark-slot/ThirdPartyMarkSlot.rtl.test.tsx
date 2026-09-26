import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { ThirdPartyMarkSlot } from './ThirdPartyMarkSlot'

describe('ThirdPartyMarkSlot in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<ThirdPartyMarkSlot markKey="postgres" name="قاعدة بيانات" category="datasource" />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.textContent).toContain('قاعدة بيانات')
    await expectNoAxeViolations(document.body, ['region'])
  })
})
