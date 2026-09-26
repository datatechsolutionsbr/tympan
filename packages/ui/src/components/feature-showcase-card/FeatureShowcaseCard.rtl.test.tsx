import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { FeatureShowcaseCard, FeatureShowcaseMosaic } from './FeatureShowcaseCard'

describe('FeatureShowcaseCard in right-to-left locales', () => {
  it('renders inside an Arabic (ar-EG) right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<FeatureShowcaseMosaic><FeatureShowcaseCard media={<span>صورة</span>} kicker="الإصدارات" title="مجمّدة وقابلة للتحقق" description="كل إصدار موقّع." href="#/e" /></FeatureShowcaseMosaic>, 'ar-EG')
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.querySelector('a')).not.toBeNull()
    await expectNoAxeViolations(container)
  })
})
