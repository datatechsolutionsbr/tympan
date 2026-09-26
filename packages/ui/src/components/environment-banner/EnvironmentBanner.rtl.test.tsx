import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { EnvironmentBanner } from './EnvironmentBanner'

describe('EnvironmentBanner in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<EnvironmentBanner environment="development" facts={{ appName: 'platform', port: 3200 }} />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.textContent).toMatch(/3200|٣٢٠٠/)
    await expectNoAxeViolations(document.body, ['region'])
  })
})
