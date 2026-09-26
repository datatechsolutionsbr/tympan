import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { BadgeCheck } from 'lucide-react'
import { FeatureTile, FeatureTileGrid } from './FeatureTile'

describe('FeatureTile in right-to-left locales', () => {
  it('renders inside an Arabic (ar-EG) right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<FeatureTileGrid><FeatureTile icon={BadgeCheck} title="حالات الإثبات" description="دائمًا بكلمة." href="#/p" /></FeatureTileGrid>, 'ar-EG')
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.querySelector('a')).not.toBeNull()
    await expectNoAxeViolations(container)
  })
})
