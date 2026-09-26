import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { ConsentBanner } from './ConsentBanner'

describe('ConsentBanner in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<ConsentBanner policyHref="#/privacy" storageKey={`fk-rtl-${Date.now()}`} />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })
})
