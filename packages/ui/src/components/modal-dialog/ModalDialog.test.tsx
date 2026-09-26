import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Button } from '../button/Button'
import { ModalDialog, type ModalDialogProps } from './ModalDialog'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

function Harness(props: Partial<ModalDialogProps> & { onChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onPress={() => setOpen(true)}>Open</Button>
      <ModalDialog
        title="Delete source"
        description="This cannot be undone."
        {...props}
        isOpen={open}
        onOpenChange={(o) => {
          props.onChange?.(o)
          setOpen(o)
        }}
        actions={
          props.actions ?? (
            <>
              <Button>Cancel</Button>
              <Button variant="danger">Delete</Button>
            </>
          )
        }
      >
        {props.children ?? <input aria-label="Reason" />}
      </ModalDialog>
    </>
  )
}

describe('ModalDialog', () => {
  it('renders nothing when closed', () => {
    render(<ModalDialog isOpen={false} onOpenChange={() => {}} title="Hidden" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('moves focus inside and is named by the title', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete source' })
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(trigger)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    expect(onChange).toHaveBeenCalledWith(false)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('wraps focus from the last control to the first with Tab', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await screen.findByRole('dialog')
    screen.getByRole('button', { name: 'Delete' }).focus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('does not close an alertdialog on backdrop press', async () => {
    const onChange = vi.fn()
    render(<Harness role="alertdialog" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(dialog.closest('.fk-modal-dialog__backdrop') as HTMLElement)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('closes a dialog on backdrop press', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(dialog.closest('.fk-modal-dialog__backdrop') as HTMLElement)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('stays open on Escape while busy', async () => {
    const onOpenChange = vi.fn()
    render(<ModalDialog isOpen busy onOpenChange={onOpenChange} title="Saving" />)
    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('[aria-busy="true"]')).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('runs an action handler without closing', async () => {
    const onDelete = vi.fn()
    render(<Harness actions={<Button onPress={onDelete}>Delete</Button>} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('keeps title and actions outside the scrolling body', async () => {
    render(
      <Harness>
        <div style={{ height: 3000 }}>Long body</div>
      </Harness>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = await screen.findByRole('dialog')
    const body = dialog.querySelector('.fk-modal-dialog__body') as HTMLElement
    expect(body).toHaveTextContent('Long body')
    expect(body.contains(screen.getByRole('heading', { name: 'Delete source' }))).toBe(false)
    expect(body.contains(screen.getByRole('button', { name: 'Delete' }))).toBe(false)
    expect(cssOf('components/modal-dialog/ModalDialog.css')).toMatch(/\.fk-modal-dialog__body\s*\{[^}]*overflow:\s*auto/)
  })

  it('can focus the title on open', async () => {
    render(<ModalDialog isOpen onOpenChange={() => {}} title="Read me" initialFocus="title" />)
    const heading = await screen.findByRole('heading', { name: 'Read me' })
    await waitFor(() => expect(heading).toHaveFocus())
  })

  it('fades only under reduced motion and draws a border in forced colours', () => {
    const css = cssOf('components/modal-dialog/ModalDialog.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/fk-modal-fade/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations when open', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await screen.findByRole('dialog')
    await expectNoAxeViolations(document.body)
  })
})

describe('ModalDialog in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    renderRtl(<ModalDialog isOpen onOpenChange={() => {}} title="تجميد الإصدار" actions={<button type="button">إلغاء</button>}><p>نص</p></ModalDialog>)
    expect(await rtlDom.screen.findByRole('dialog', { name: 'تجميد الإصدار' })).toBeInTheDocument()
    await axeRtl(document.body)
  })
})
