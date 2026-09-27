import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Check } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { ThemeScope } from '../../internal/ThemeScope'
import { InsightCard, type InsightCardProps } from './InsightCard'

const base: InsightCardProps = {
  actor: { kind: 'agent', name: 'stage-coder', agentKey: 'ak_12' },
  title: 'Days above the limit, Centro station',
  value: '4 Executes services',
  measures: [
    { id: 'conf', label: 'Confidence', value: '82 %', meter: 0.82 },
    { id: 'cov', label: 'Sources read', value: '6 of 6' },
  ],
  actions: [
    { id: 'accept', label: 'Accept', emphasis: 'primary', icon: <Check /> },
    { id: 'dismiss', label: 'Dismiss', emphasis: 'quiet' },
  ],
}

describe('InsightCard', () => {
  it('shows the agent with a square avatar and the word agent', () => {
    const { container } = render(<InsightCard {...base} />)
    expect(container.querySelector('.ty-avatar')).toHaveAttribute('data-kind', 'agent')
    const article = screen.getByRole('article', { name: base.title })
    expect(article).toHaveAccessibleDescription('Proposed by stage-coder, agent')
  })

  it('disables every action while the pressed one is pending', async () => {
    let settle!: () => void
    const onAction = vi.fn(() => new Promise<void>((r) => (settle = r)))
    render(<InsightCard {...base} onAction={onAction} />)
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(onAction).toHaveBeenCalledWith('accept')
    expect(screen.getByRole('button', { name: 'Working' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeDisabled()
    await act(async () => settle())
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeEnabled()
  })

  it('shows an error notice and re-enables the actions when the promise rejects', async () => {
    const onAction = vi.fn(() => Promise.reject(new Error('Conflict: someone else answered.')))
    render(<InsightCard {...base} onAction={onAction} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(await screen.findByText('Conflict: someone else answered.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled()
  })

  it('replaces the actions with the focused, announced outcome', async () => {
    const { rerender } = render(<InsightCard {...base} />)
    rerender(<InsightCard {...base} outcome={{ text: 'Accepted by Júlia on 23 Sep.' }} />)
    const outcome = screen.getByRole('status')
    expect(outcome).toHaveTextContent('Accepted by Júlia on 23 Sep.')
    await waitFor(() => expect(outcome).toHaveFocus())
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
  })

  it('writes the meter value as its value text', () => {
    render(<InsightCard {...base} />)
    expect(screen.getByRole('progressbar', { name: 'Confidence' })).toHaveAttribute('aria-valuetext', '82 %')
  })

  it('keeps only the first primary action and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(
      <InsightCard
        {...base}
        actions={[
          { id: 'a', label: 'Accept', emphasis: 'primary' },
          { id: 'b', label: 'Adjust', emphasis: 'primary' },
        ]}
      />,
    )
    const buttons = container.querySelectorAll('.ty-insight-card__actions .ty-button')
    expect(buttons[0]).toHaveAttribute('data-variant', 'primary')
    expect(buttons[1]).toHaveAttribute('data-variant', 'secondary')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('primary'))
    warn.mockRestore()
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <InsightCard
              {...base}
              title={`${base.title} ${s}`}
              delta={{ value: 1, unit: 'number' }}
              proofState="pending"
              footnote={{ text: 'Rule stage-rule-v2 applied', href: '#/rules' }}
            />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
