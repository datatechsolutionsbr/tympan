import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { SkeletonBlock } from './SkeletonFill'

describe('SkeletonBlock in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<SkeletonBlock width="60%" />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })
})
