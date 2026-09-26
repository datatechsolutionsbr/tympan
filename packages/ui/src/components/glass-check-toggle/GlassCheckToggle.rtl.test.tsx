import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { GlassCheckToggle } from './GlassCheckToggle'

describe('GlassCheckToggle in right-to-left locales', () => {
  it('renders when enabled and passes axe', async () => {
    const { container } = inRtl(<GlassCheckToggle enabled label="فحص الزجاج" />)
    expect(container.textContent).toContain('فحص الزجاج')
    await expectNoAxeViolations(container)
  })
})
