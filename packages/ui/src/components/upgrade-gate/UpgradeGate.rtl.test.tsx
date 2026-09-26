import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { UpgradeGate } from './UpgradeGate'

describe('UpgradeGate in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<UpgradeGate onViewPlans={() => {}} onSignOut={() => {}} />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })
})
