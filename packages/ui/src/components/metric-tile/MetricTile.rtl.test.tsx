import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { MetricTile } from './MetricTile'

describe('MetricTile in right-to-left locales', () => {
  it('formats the trend in the locale and passes axe', async () => {
    const { container } = inRtl(<MetricTile title="السجلات" value={94} trend={{ value: 10.5 }} />, 'ar-EG')
    expect(container.textContent).toMatch(/[٠-٩]/)
    await expectNoAxeViolations(container)
  })
})
