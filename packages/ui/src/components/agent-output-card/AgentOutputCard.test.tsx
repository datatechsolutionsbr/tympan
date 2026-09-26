import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { AgentOutputCard } from './AgentOutputCard'

const long = 'The agent read fourteen sources and coded the stage of every record. '.repeat(12)

describe('AgentOutputCard', () => {
  it('is an article named by the agent, with the word "agent" and a completed mark in text', () => {
    const { container } = render(<AgentOutputCard agentName="Coder" duration="3.4 s" output="Done." />)
    const card = screen.getByRole('article', { name: 'Coder' })
    expect(card).toHaveTextContent('agent')
    expect(container.querySelector('.fk-avatar')).toHaveAttribute('data-kind', 'agent')
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(container.querySelector('[data-outcome="completed"] svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('clamps a long output to maxLines while the full text stays reachable via onOpen', () => {
    const { container } = render(<AgentOutputCard agentName="Coder" duration="1 s" output={long} maxLines={4} onOpen={() => {}} />)
    const excerpt = container.querySelector('.fk-agent-output__excerpt') as HTMLElement
    expect(excerpt.style.getPropertyValue('--fk-agent-output-lines')).toBe('4')
    expect(cssOf('components/agent-output-card/AgentOutputCard.css')).toMatch(/-webkit-line-clamp:\s*var\(--fk-agent-output-lines/)
    expect(screen.getByRole('button', { name: /Coder/ })).toBeInTheDocument()
  })

  it('has exactly one tab stop and Enter calls onOpen', async () => {
    const onOpen = vi.fn()
    render(
      <>
        <AgentOutputCard agentName="Coder" agentKey="ak_1" duration="1 s" output="ok" onOpen={onOpen} />
        <button>after</button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: /Coder/ })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledTimes(1)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  it('uses no font size below the 12 px meta step', () => {
    const css = cssOf('components/agent-output-card/AgentOutputCard.css')
    const sizes = [...css.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1])
    for (const s of sizes) expect(s).toMatch(/--fk-font-size-(meta|body|label)/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <AgentOutputCard agentName="stage-counter" agentKey="ak_91" duration="3.4 s" output={long} />
            <AgentOutputCard agentName="linker" duration="0.2 s" outcome="failed" output="Timed out." onOpen={() => {}} />
            <AgentOutputCard agentName="notary" duration="…" outcome="pending" output="Waiting." />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
