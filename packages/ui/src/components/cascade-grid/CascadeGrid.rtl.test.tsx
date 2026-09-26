import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { CascadeGrid } from './CascadeGrid'

describe('CascadeGrid in right-to-left locales', () => {
  it('keeps list semantics in Arabic and passes axe', async () => {
    const { container } = inRtl(
      <CascadeGrid role="list" aria-label="الوحدات">
        {['المصادر', 'القاعدة'].map((w) => (
          <div key={w} role="listitem">
            {w}
          </div>
        ))}
      </CascadeGrid>,
    )
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(2)
    await expectNoAxeViolations(container)
  })
})
