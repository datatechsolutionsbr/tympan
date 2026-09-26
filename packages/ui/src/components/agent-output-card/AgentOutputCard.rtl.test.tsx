import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { AgentOutputCard } from './AgentOutputCard'

describe('AgentOutputCard in right-to-left locales', () => {
  it('renders Arabic output and passes axe', async () => {
    const { container } = inRtl(<AgentOutputCard agentName="stage-counter" duration="٣٫٤ ث" output="المراحل ٣ و٤ تضم ٣٧ حالة من ٩٤." onOpen={() => {}} />)
    expect(container.textContent).toContain('المراحل')
    await expectNoAxeViolations(container)
  })
})
