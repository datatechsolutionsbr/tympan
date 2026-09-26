import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Bot, Cpu, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ChoiceCard, ChoiceCardGroup } from './ChoiceCard'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import * as rtlDom from '@testing-library/react'
import { renderRtl } from '../../../test/rtl'

function Models({ onChange }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState('b')
  return (
    <ChoiceCardGroup
      label="Model"
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
    >
      <ChoiceCard value="a" label="Small" icon={<Cpu />} />
      <ChoiceCard value="b" label="Medium" icon={<Bot />} />
      <ChoiceCard value="c" label="Large" icon={<Sparkles />} />
      <ChoiceCard value="d" label="Huge" available={false} unavailableReason="Not offered by this provider" />
    </ChoiceCardGroup>
  )
}

describe('ChoiceCard', () => {
  it('ArrowDown on the selected second card selects the third', async () => {
    render(<Models />)
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Medium' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked()
  })

  it('an unavailable card is announced with the reason and cannot be chosen', async () => {
    const onChange = vi.fn()
    render(<Models onChange={onChange} />)
    const huge = screen.getByRole('radio', { name: 'Huge' })
    expect(huge).toBeDisabled()
    expect(huge).toHaveAccessibleDescription('Not offered by this provider')
    await userEvent.click(screen.getByText('Huge'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('a standalone unavailable card stays focusable, aria-disabled, and ignores activation', async () => {
    const onSelect = vi.fn()
    render(<ChoiceCard selected={false} onSelect={onSelect} label="Tool" available={false} unavailableReason="Needs a key" />)
    const card = screen.getByRole('button', { name: 'Tool' })
    await userEvent.tab()
    expect(card).toHaveFocus()
    expect(card).toHaveAttribute('aria-disabled', 'true')
    expect(card).toHaveAccessibleDescription('Needs a key')
    await userEvent.keyboard('{Enter}')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows the description inline and hides it (still describing) when stacked', () => {
    const { rerender } = render(<ChoiceCard selected={false} onSelect={() => {}} label="Plan" description="For teams" arrangement="inline" />)
    expect(screen.getByText('For teams')).toHaveClass('fk-choice-card__description')
    rerender(<ChoiceCard selected={false} onSelect={() => {}} label="Plan" description="For teams" arrangement="stacked" />)
    expect(screen.getByText('For teams')).toHaveClass('fk-visually-hidden')
    expect(screen.getByRole('button', { name: 'Plan' })).toHaveAccessibleDescription('For teams')
  })

  it('a selected card shows a check mark and reports pressed', async () => {
    const onSelect = vi.fn()
    const { container } = render(<ChoiceCard selected onSelect={onSelect} label="Plan" />)
    expect(screen.getByRole('button', { name: 'Plan' })).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('.fk-selected-mark')).not.toBeNull()
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('forced colours mark the selection with a Highlight border', () => {
    const css = cssOf('components/choice-card/ChoiceCard.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/\[data-selected\][^}]*Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ChoiceCardGroup label={`Model ${scheme}`} value="a" onChange={() => {}} arrangement="inline">
              <ChoiceCard value="a" label="Small" description="Fast" icon={<Cpu />} trailing={<span>recommended</span>} />
              <ChoiceCard value="b" label="Large" available={false} unavailableReason="Not offered" />
            </ChoiceCardGroup>
            <ChoiceCard selected onSelect={() => {}} label={`Toggle ${scheme}`} icon={<Bot />} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ChoiceCard in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ChoiceCard selected={false} onSelect={() => {}} label="أداة البحث" description="تفتح صفحات عامة." />)
    expect(rtlDom.screen.getByRole('button', { name: /أداة البحث/ })).toBeInTheDocument()
    await axeRtl(container)
  })
})
