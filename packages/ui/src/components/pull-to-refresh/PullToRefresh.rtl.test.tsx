import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { PullToRefresh } from './PullToRefresh'

describe('PullToRefresh in right-to-left locales', () => {
  it('renders Arabic content and passes axe', async () => {
    const { container } = inRtl(
      <PullToRefresh onRefresh={async () => {}}>
        <p>قائمة الحالات</p>
      </PullToRefresh>,
    )
    expect(container.textContent).toContain('قائمة الحالات')
    await expectNoAxeViolations(container)
  })
})
