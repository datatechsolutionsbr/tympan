import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Bot } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { messagesPtBR } from '../../internal/messages'
import { ThemeScope } from '../../internal/ThemeScope'
import { RecordActions, RecordCard } from './RecordCard'

describe('RecordCard', () => {
  it('reads the localised "active" word for state=true', () => {
    renderWithProvider(
      <ul>
        <RecordCard title="limit-counter" state />
      </ul>,
      { baseMessages: messagesPtBR },
    )
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('calls onOpen once on Enter', async () => {
    const onOpen = vi.fn()
    render(<RecordCard standalone title="Harbour" onOpen={onOpen} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Harbour' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('does not open when a footer delete button is activated', async () => {
    const onOpen = vi.fn()
    const onDelete = vi.fn()
    render(
      <RecordCard
        standalone
        title="Harbour"
        onOpen={onOpen}
        footer={<RecordActions recordTitle="Harbour" editLabel="Edit" deleteLabel="Delete" onEdit={() => {}} onDelete={onDelete} />}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete Harbour' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('asks before deleting and does nothing when cancelled', async () => {
    const onDelete = vi.fn()
    render(
      <RecordActions recordTitle="Harbour" editLabel="Edit" deleteLabel="Delete" onEdit={() => {}} onDelete={onDelete} confirmDeleteTitle="Delete Harbour?" />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete Harbour' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Delete Harbour?')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('disables the actions while a delete promise is pending', async () => {
    let settle!: () => void
    const onDelete = vi.fn(() => new Promise<void>((r) => (settle = r)))
    render(<RecordActions recordTitle="Harbour" editLabel="Edit" deleteLabel="Delete" onEdit={() => {}} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete Harbour' }))
    expect(screen.getByRole('button', { name: /Edit/ })).toBeDisabled()
    settle()
    await waitFor(() => expect(screen.getByRole('button', { name: /Edit/ })).toBeEnabled())
  })

  it('has no required-parent violation in a list, nor standalone', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <ul className="ty-list">
              <RecordCard title="limit-counter" secondary="ak_91" leading={<Bot />} state accent={3}>
                Model nova-lite
              </RecordCard>
              <RecordCard title="linker" state={false} onOpen={() => {}} footer={<RecordActions recordTitle="linker" editLabel="Edit" deleteLabel="Delete" onEdit={() => {}} onDelete={() => {}} />} />
            </ul>
            <RecordCard standalone title={`Alone ${s}`} />
          </ThemeScope>
        ))}
      </>,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    await expectNoAxeViolations(container)
  })

  it('truncates a long title and keeps the full title for assistive technology', () => {
    const long = 'Estudo de qualidade do ar urbano de Vila Aurora, edição de setembro de 2026'
    render(<RecordCard standalone title={long} />)
    expect(screen.getByRole('article', { name: long })).toBeInTheDocument()
    expect(screen.getByText(long)).toHaveAttribute('title', long)
    expect(cssOf('components/record-card/RecordCard.css')).toMatch(/\.ty-record-card__title\s*\{[^}]*text-overflow:\s*ellipsis/)
  })

  it('hides the decorative strip in forced colours and has no transition under reduced motion', () => {
    const css = cssOf('components/record-card/RecordCard.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/data-accent\]::before\s*\{[^}]*display:\s*none/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(css).not.toMatch(/translate|scale\(/)
  })
})
