import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { LiveReportView } from './LiveReportView'

describe('LiveReportView in right-to-left locales', () => {
  it('renders a finished run in an Arabic subtree and passes axe', async () => {
    const open = vi.fn(() => () => {})
    const { container } = inRtl(<LiveReportView flowId="f" runId="r" openStream={open as never} initialStatus="COMPLETED" initialReport={{ title: 'التقرير النهائي', recommendation: 'تم.' }} />)
    expect(container.textContent).toContain('التقرير النهائي')
    expect(open).not.toHaveBeenCalled()
    await expectNoAxeViolations(container)
  })
})
