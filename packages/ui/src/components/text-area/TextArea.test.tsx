import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Field } from '../field/Field'
import { TextArea } from './TextArea'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('TextArea', () => {
  it('uses the label as the accessible name', () => {
    render(<TextArea label="Notes" />)
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument()
  })

  it('inserts a newline on Enter and never submits', async () => {
    const onSubmit = vi.fn((e: { preventDefault(): void }) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <TextArea label="Notes" />
      </form>,
    )
    const area = screen.getByRole('textbox', { name: 'Notes' })
    await userEvent.type(area, 'one{Enter}two')
    expect(area).toHaveValue('one\ntwo')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('grows up to maxRows and then scrolls', async () => {
    const { container } = render(<TextArea label="Log" autoGrow maxRows={6} />)
    const area = screen.getByRole('textbox', { name: 'Log' })
    await userEvent.type(area, Array.from({ length: 10 }, (_, i) => `line ${i}`).join('{Enter}'))
    expect(area).toHaveAttribute('rows', '6')
    expect(container.querySelector('.ty-text-area')).toHaveAttribute('data-scrolling', 'true')
  })

  it('marks errors invalid and describes them', () => {
    render(<TextArea label="Abstract" errorMessage="Too long" />)
    const area = screen.getByRole('textbox', { name: 'Abstract' })
    expect(area).toHaveAttribute('aria-invalid', 'true')
    expect(area).toHaveAccessibleDescription('Too long')
  })

  it('is targeted by a surrounding Field label without an explicit id', () => {
    render(
      <Field label="Summary" hint="Two sentences">
        <TextArea />
      </Field>,
    )
    const area = screen.getByRole('textbox', { name: 'Summary' })
    expect(screen.getByText('Summary').closest('label')).toHaveAttribute('for', area.id)
    expect(area).toHaveAccessibleDescription('Two sentences')
  })

  it('uses the mono family when monospace', () => {
    const { container } = render(<TextArea label="JSON" monospace />)
    expect(container.querySelector('.ty-text-area')).toHaveAttribute('data-monospace', 'true')
    expect(cssOf('components/text-area/TextArea.css')).toMatch(/\[data-monospace\] \.ty-text-area__input\s*\{[^}]*font-family:\s*var\(--ty-font-mono\)/)
  })

  it('counts characters and flags the over-limit state', async () => {
    render(<TextArea label="Bio" maxLength={3} showCounter />)
    const area = screen.getByRole('textbox', { name: 'Bio' })
    await userEvent.type(area, 'abcd')
    expect(area).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/4 of 3 characters/)).toBeInTheDocument()
  })

  it('declares reduced motion and forced colours rules', () => {
    const css = cssOf('components/text-area/TextArea.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/FieldText/)
    expect(css).toMatch(/min-block-size:\s*var\(--ty-control-target\)/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <TextArea label="Notes" hint="Optional" />
        <TextArea label="Error" errorMessage="Required" />
        <TextArea accessibleLabel="Unlabelled" readOnly defaultValue="x" />
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('TextArea in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<TextArea label="الاقتباس" showCounter maxLength={10} defaultValue="نص" />)
    expect(rtlDom.screen.getByRole('textbox', { name: 'الاقتباس' })).toHaveValue('نص')
    await axeRtl(container)
  })
})
