import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Users } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { messagesPtBR } from '../../internal/messages'
import { ThemeScope } from '../../internal/ThemeScope'
import { StatTile } from './StatTile'

describe('StatTile', () => {
  it('fires onPress on Enter and exposes aria-pressed', async () => {
    const onPress = vi.fn()
    render(<StatTile value={12} label="Pending" onPress={onPress} />)
    const tile = screen.getByRole('button', { name: /Pending, 12/ })
    expect(tile).toHaveAttribute('aria-pressed', 'false')
    await userEvent.tab()
    expect(tile).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('shows a non-colour indicator when selected', () => {
    const { container } = render(<StatTile value={12} label="Pending" selected onPress={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('.fk-stat-tile__check')).not.toBeNull()
  })

  it('opens the explanation beside the tile and Esc returns focus', async () => {
    render(
      <StatTile
        value="94"
        label="Records"
        onPress={() => {}}
        explanation={{ title: 'How it is counted', body: 'Every record of the edition.', blocks: [{ label: 'Query', text: 'count(records)' }] }}
      />,
    )
    const explain = screen.getByRole('button', { name: 'How "Records" is computed' })
    expect(screen.getByRole('button', { name: /Records, 94/ })).not.toContainElement(explain)
    await userEvent.tab()
    await userEvent.tab()
    expect(explain).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('How it is counted')
    expect(dialog.querySelector('code')).toHaveTextContent('count(records)')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(explain).toHaveFocus())
  })

  it('wraps only the value in a polite atomic live region when live', () => {
    const { container, rerender } = render(<StatTile value={3} label="Open tasks" live />)
    const region = container.querySelector('[aria-live="polite"]')!
    expect(region).toHaveAttribute('aria-atomic', 'true')
    expect(region).toHaveTextContent(/^3$/)
    rerender(<StatTile value={4} label="Open tasks" live />)
    expect(region).toHaveTextContent(/^4$/)
    rerender(<StatTile value={4} label="Open tasks" />)
    expect(container.querySelector('[aria-live]')).toBeNull()
  })

  it('shows the translated "filtered" word and the attention word', () => {
    renderWithProvider(<StatTile value={7} label="Casos" filtered tone="attention" />, { baseMessages: messagesPtBR })
    expect(screen.getByText('filtrado')).toBeVisible()
    expect(screen.getByText('pede ação')).toBeInTheDocument()
    expect(screen.getByRole('group')).toHaveAccessibleName(/filtrado/)
  })

  it('draws a thicker system border when selected in forced colours and never lifts', () => {
    const css = cssOf('components/stat-tile/StatTile.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/border:\s*3px solid Highlight/)
    expect(css).not.toMatch(/translate|scale\(/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <StatTile value="512" label="Proved" icon={<Users />} qualifier="Sep" explanation={{ body: 'x' }} />
            <StatTile value="12" label="Pending" tone="attention" selected onPress={() => {}} filtered />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
