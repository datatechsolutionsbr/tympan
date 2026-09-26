import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { SectionedModal } from './SectionedModal'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const sections = [
  { id: 'a', label: 'General', content: <p>General content</p> },
  { id: 'b', label: 'Modules', content: <p>Modules content</p>, count: 4 },
  { id: 'c', label: 'Keys', content: <p>Keys content</p> },
]

describe('SectionedModal', () => {
  it('exposes a dialog named by the title with focus inside', async () => {
    render(
      <SectionedModal open onClose={() => {}} title="Edit source" subtitle="Changes are saved to the draft.">
        <label>
          Name <input />
        </label>
      </SectionedModal>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Edit source' })
    expect(dialog).toHaveAccessibleDescription('Changes are saved to the draft.')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus())
  })

  it('ignores Escape when not dismissible but closes from the close button', async () => {
    const onClose = vi.fn()
    render(<SectionedModal open onClose={onClose} title="Locked" dismissible={false} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('submits on Ctrl+Enter but not on Enter inside a text area', async () => {
    const onSubmit = vi.fn()
    render(
      <SectionedModal open onClose={() => {}} title="Note" onSubmit={onSubmit} formFooter={{}}>
        <label>
          Title <input />
        </label>
        <label>
          Body <textarea />
        </label>
      </SectionedModal>,
    )
    await userEvent.click(screen.getByRole('textbox', { name: 'Body' }))
    await userEvent.keyboard('{Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('textbox', { name: 'Title' }))
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not pull focus back to the first field after the person moved into the body', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    render(
      <SectionedModal open onClose={() => {}} title="Note" onSubmit={() => {}} formFooter={{}}>
        <label>
          Title <input />
        </label>
        <label>
          Body <textarea />
        </label>
      </SectionedModal>,
    )
    const body = screen.getByRole('textbox', { name: 'Body' })
    body.focus()
    // Run the pending initial-focus frame now, after the person's move.
    for (const [cb] of raf.mock.calls) cb(performance.now())
    raf.mockRestore()
    expect(body).toHaveFocus()
  })

  it('shows Save busy and disabled while pending', () => {
    render(<SectionedModal open onClose={() => {}} title="Note" onSubmit={() => {}} formFooter={{ pending: true }} />)
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toHaveAttribute('aria-busy', 'true')
    expect(save).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('shows the error as an alert in the body', () => {
    render(<SectionedModal open onClose={() => {}} title="Note" error="The server refused the change." />)
    expect(screen.getByRole('alert')).toHaveTextContent('The server refused the change.')
  })

  it('switches sections and marks the current one', async () => {
    render(<SectionedModal open onClose={() => {}} title="Settings" sections={sections} />)
    expect(screen.getByText('General content')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Settings' })
    await userEvent.click(screen.getByRole('button', { name: /Modules/ }))
    expect(screen.getByText('Modules content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Modules/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('region', { name: 'Modules' })).toBeInTheDocument()
    expect(nav).toBeInTheDocument()
  })

  it('starts on defaultSection', () => {
    render(<SectionedModal open onClose={() => {}} title="Settings" sections={sections} defaultSection="b" />)
    expect(screen.getByText('Modules content')).toBeInTheDocument()
  })

  it('names the bare layout with ariaLabel', () => {
    render(
      <SectionedModal open onClose={() => {}} ariaLabel="Preview">
        <p>Only content</p>
      </SectionedModal>,
    )
    expect(screen.getByRole('dialog', { name: 'Preview' })).toBeInTheDocument()
  })

  it('fills the screen under 640 with the footer pinned', () => {
    const narrow = mediaBlock(cssOf('components/sectioned-modal/SectionedModal.css'), /\(max-width:\s*639\.98px\)/)
    expect(narrow).toMatch(/block-size:\s*100dvh/)
    expect(narrow).toMatch(/\.ty-sectioned-modal__foot\s*\{[^}]*position:\s*sticky/)
  })

  it('has no axe violations (sectioned form with error)', async () => {
    render(
      <SectionedModal open onClose={() => {}} title="Settings" eyebrow="Project" sections={sections} onSubmit={() => {}} formFooter={{}} error="Try again." />,
    )
    await expectNoAxeViolations(document.body)
  })
})

describe('SectionedModal in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    renderRtl(<SectionedModal open onClose={() => {}} title="تحرير المصدر" size="md"><p>نص</p></SectionedModal>)
    expect(await rtlDom.screen.findByRole('dialog', { name: /تحرير المصدر/ })).toBeInTheDocument()
    await axeRtl(document.body)
  })
})
