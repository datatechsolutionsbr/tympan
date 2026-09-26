import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { messagesPtBR } from '../../internal/messages'
import { ProofBadge, type ProofState } from './ProofBadge'

import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const states: Array<[ProofState | null, string, string]> = [
  ['proved', 'proved', 'proved'],
  ['pending', 'pending', 'pending'],
  ['refuted', 'refuted', 'refuted'],
  ['not_disclosed', 'not disclosed', 'not-disclosed'],
  [null, 'no proof', 'none'],
]

describe('ProofBadge', () => {
  it.each(states)('inline %s shows an icon and the word "%s"', (state, word, attr) => {
    const { container } = render(<ProofBadge state={state} />)
    const badge = container.querySelector('.fk-proof-badge')!
    expect(badge).toHaveAttribute('data-state', attr)
    expect(badge).toHaveTextContent(word)
    expect(badge.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })

  it('compact keeps the word available to assistive tech and as tooltip', () => {
    const { container } = render(<ProofBadge state="pending" size="compact" detail="4/6" />)
    const badge = container.querySelector('.fk-proof-badge')!
    expect(badge).toHaveAttribute('title', 'pending')
    expect(screen.getByText('pending')).toHaveClass('fk-visually-hidden')
    expect(badge).toHaveTextContent('4/6')
  })

  it('interactive compact is focusable, named by the word and shows a tooltip on focus', async () => {
    render(<ProofBadge state="refuted" size="compact" interactive />)
    await userEvent.tab()
    const badge = screen.getByRole('img', { name: 'refuted' })
    expect(badge).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('refuted')
  })

  it('block shows who proved, when and the verifier rule in mono', () => {
    render(<ProofBadge state="proved" size="block" provedBy="Avaliador" at="23 Sep" rule="compile@1" />)
    expect(screen.getByText('proved')).toBeInTheDocument()
    expect(screen.getByText('by Avaliador')).toBeInTheDocument()
    expect(screen.getByText('23 Sep')).toBeInTheDocument()
    expect(screen.getByText('rule compile@1').tagName).toBe('CODE')
  })

  it('uses the words of the host catalogue', () => {
    renderWithProvider(<ProofBadge state="not_disclosed" />, { baseMessages: messagesPtBR })
    expect(screen.getByText('não informada')).toBeInTheDocument()
  })

  it('distinguishes states by border style, not colour alone, including in forced colours', () => {
    const css = cssOf('components/proof-badge/ProofBadge.css')
    expect(css).toMatch(/\[data-state='proved'\]\s*\{[^}]*1\.5px solid/)
    expect(css).toMatch(/\[data-state='pending'\]\s*\{[^}]*dashed/)
    expect(css).toMatch(/\[data-state='refuted'\]\s*\{[^}]*3px double/)
    expect(css).toMatch(/\[data-state='not-disclosed'\]\s*\{[^}]*dotted/)
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    for (const style of ['solid', 'dashed', 'double', 'dotted']) expect(forced).toContain(style)
  })

  it('inline badge uses 12 px text and a 22 px pill', () => {
    const css = cssOf('components/proof-badge/ProofBadge.css')
    expect(css).toMatch(/\[data-size='inline'\]\s*\{[^}]*block-size:\s*22px[^}]*var\(--fk-radius-pill\)[^}]*var\(--fk-font-size-meta\)/)
  })

  it('has no axe violations in every size', async () => {
    const { container } = render(
      <div>
        {states.map(([s]) => (
          <ProofBadge key={String(s)} state={s} />
        ))}
        <ProofBadge state="proved" size="compact" />
        <ProofBadge state="pending" size="compact" interactive />
        <ProofBadge state="proved" size="block" provedBy="Ana" at="today" rule="r1" />
      </div>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ProofBadge in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ProofBadge state="proved" size="block" provedBy="مراجع" rule="compile@1" />)
    expect(container.textContent).toMatch(/compile@1/)
    await axeRtl(container)
  })
})
