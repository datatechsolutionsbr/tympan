import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { messagesPtBR } from '../../internal/messages'
import { ActorChip } from './ActorChip'

describe('ActorChip', () => {
  it('shows a person with a round initials avatar, the name and the e-mail', () => {
    const { container } = render(<ActorChip kind="user" name="Júlia Andrade" email="n@example.org" />)
    const avatar = container.querySelector('.ty-avatar')!
    expect(avatar).toHaveAttribute('data-kind', 'person')
    expect(avatar).toHaveTextContent('JA')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Júlia Andrade')).toBeInTheDocument()
    expect(screen.getByText('n@example.org')).toBeInTheDocument()
  })

  it('never identifies a person primarily with a mono id', () => {
    const { container } = render(<ActorChip kind="person" name="Ana Souza" />)
    expect(container.querySelector('code')).toBeNull()
    expect(screen.getByText('Ana Souza').closest('code')).toBeNull()
  })

  it('shows an agent with a square bot avatar, no initials and the word "agent"', () => {
    const { container } = render(<ActorChip kind="agent" name="limit-counter" agentKey="ak_91" model="nova-lite" />)
    const avatar = container.querySelector('.ty-avatar')!
    expect(avatar).toHaveAttribute('data-kind', 'agent')
    expect(avatar.querySelector('svg')).not.toBeNull()
    expect(avatar.textContent).toBe('')
    expect(screen.getByText('agent')).toBeVisible()
    expect(screen.getByText('ak_91').tagName).toBe('CODE')
    expect(screen.getByText('nova-lite').tagName).toBe('CODE')
  })

  it('keeps the word "agent" in compact mode and drops key and model', () => {
    render(<ActorChip kind="agent" name="notary" agentKey="ak_1" compact />)
    expect(screen.getByText('agent')).toBeInTheDocument()
    expect(screen.queryByText('ak_1')).toBeNull()
  })

  it('shows a system actor with no avatar, the word "system" and the rule in mono', () => {
    const { container } = render(<ActorChip kind="system" name="compile@1" />)
    expect(container.querySelector('.ty-avatar')).toBeNull()
    expect(screen.getByText('system')).toBeInTheDocument()
    expect(screen.getByText('compile@1').tagName).toBe('CODE')
  })

  it('reads the kind words from the host catalogue', () => {
    renderWithProvider(<ActorChip kind="agent" name="x" />, { baseMessages: messagesPtBR })
    expect(screen.getByText('agente')).toBeInTheDocument()
  })

  it('precedes the date in an activity row', () => {
    render(
      <p>
        <ActorChip kind="person" name="Ana" /> <time dateTime="2026-09-23">23 Sep</time>
      </p>,
    )
    const chip = screen.getByText('Ana')
    const date = screen.getByText('23 Sep')
    expect(chip.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps the agent kind marker visible in forced colours', () => {
    expect(cssOf('components/actor-chip/ActorChip.css')).toMatch(/forced-colors[\s\S]*data-kind='agent'\] \.ty-actor-chip__kind\s*\{[^}]*CanvasText/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <ul>
        <li>
          <ActorChip kind="user" name="Ana Souza" email="ana@example.org" />
        </li>
        <li>
          <ActorChip kind="agent" name="notary" model="m1" />
        </li>
        <li>
          <ActorChip kind="system" name="freeze-job" />
        </li>
        <li>
          <ActorChip kind="user" name="Bia" avatar={false} compact />
        </li>
      </ul>,
    )
    await expectNoAxeViolations(container)
  })
})
