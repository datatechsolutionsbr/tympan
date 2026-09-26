import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { ProfileSummary } from './ProfileSummary'

describe('ProfileSummary in right-to-left locales', () => {
  it('shows a Hebrew name and passes axe', async () => {
    const { container } = inRtl(<ProfileSummary name="נטליה מסקיטה" role="בעלים" />, 'he')
    expect(container.textContent).toContain('נטליה מסקיטה')
    await expectNoAxeViolations(container)
  })
})
