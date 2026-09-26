import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { InsightCard } from './InsightCard'

describe('InsightCard in right-to-left locales', () => {
  it('renders with an Arabic delta and passes axe', async () => {
    const { container } = inRtl(
      <InsightCard actor={{ kind: 'agent', name: 'stage-coder' }} title="مرحلة الحالة" value="٤" delta={{ value: 1, unit: 'number' }} actions={[{ id: 'a', label: 'قبول' }]} onAction={() => {}} />,
    )
    expect(container.textContent).toMatch(/[٠-٩]/)
    await expectNoAxeViolations(container)
  })
})
