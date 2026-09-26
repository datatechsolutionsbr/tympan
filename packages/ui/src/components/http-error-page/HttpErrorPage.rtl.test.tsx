import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { HttpErrorPage } from './HttpErrorPage'

describe('HttpErrorPage in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<HttpErrorPage kind="not-found" focusHeading={false} />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })
})
