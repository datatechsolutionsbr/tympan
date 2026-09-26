import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { SectionHeading } from './SectionHeading'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('SectionHeading', () => {
  it('renders an h3 with level 3', () => {
    render(<SectionHeading title="Members" level={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Members' })).toBeInTheDocument()
  })

  it('places trailing controls after the heading in tab order', async () => {
    render(
      <>
        <button type="button">Before</button>
        <SectionHeading title="Members" trailing={<button type="button">Invite</button>} />
      </>,
    )
    const heading = screen.getByRole('heading', { name: 'Members' })
    const invite = screen.getByRole('button', { name: 'Invite' })
    expect(heading.compareDocumentPosition(invite) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await userEvent.tab()
    await userEvent.tab()
    expect(invite).toHaveFocus()
  })

  it('names an enclosing section through its id', () => {
    render(
      <section aria-labelledby="members-h">
        <SectionHeading id="members-h" title="Members" />
      </section>,
    )
    expect(screen.getByRole('region', { name: 'Members' })).toBeInTheDocument()
  })

  it('renders the subtitle as text, not a heading', () => {
    render(<SectionHeading title="Members" subtitle="3 people, 1 agent" />)
    const subtitle = screen.getByText('3 people, 1 agent')
    expect(subtitle.tagName).toBe('P')
    expect(screen.getAllByRole('heading')).toHaveLength(1)
  })

  it('wraps the trailing slot in a narrow container', () => {
    expect(cssOf('components/section-heading/SectionHeading.css')).toMatch(/\.ty-section-heading__row\s*\{[^}]*flex-wrap:\s*wrap/)
  })

  it('has no axe violations', async () => {
    const { container } = render(<SectionHeading title="Agents" subtitle="Keys and models" trailing={<button type="button">New agent</button>} />)
    await expectNoAxeViolations(container)
  })
})

describe('SectionHeading in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<SectionHeading title="التحقق" level={3} subtitle="٣ من ٣" />)
    expect(rtlDom.screen.getByRole('heading', { name: 'التحقق' })).toBeInTheDocument()
    await axeRtl(container)
  })
})
