import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Button } from '../button/Button'
import { Drawer, type DrawerProps } from './Drawer'

function Harness(props: Partial<DrawerProps> & { onChange?: (o: boolean) => void }) {
  const [open, setOpen] = useState(props.open ?? false)
  return (
    <>
      <Button onPress={() => setOpen(true)}>Filters</Button>
      <button type="button">Behind</button>
      <Drawer
        title="Filters"
        {...props}
        open={open}
        onOpenChange={(o) => {
          props.onChange?.(o)
          setOpen(o)
        }}
      >
        <button type="button">Apply</button>
      </Drawer>
    </>
  )
}

function pointer(target: HTMLElement, type: string, clientY: number, timeStamp: number) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, { clientY, pointerId: 1, button: 0 })
  Object.defineProperty(event, 'timeStamp', { value: timeStamp })
  fireEvent(target, event)
}

function drag(target: HTMLElement, distance: number, durationMs: number) {
  pointer(target, 'pointerdown', 100, 1000)
  pointer(target, 'pointermove', 100 + distance / 2, 1000 + durationMs / 2)
  pointer(target, 'pointerup', 100 + distance, 1000 + durationMs)
}

describe('Drawer', () => {
  it('shows a dialog named by the title with focus inside', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    const dialog = await screen.findByRole('dialog', { name: 'Filters' })
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  })

  it('closes on Escape and returns focus to the opener', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const opener = screen.getByRole('button', { name: 'Filters' })
    await userEvent.click(opener)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    expect(onChange).toHaveBeenCalledWith(false)
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('closes on backdrop press', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(dialog.closest('.fk-drawer__backdrop') as HTMLElement)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('stays open on backdrop press when not dismissible', async () => {
    const onChange = vi.fn()
    render(<Harness dismissible={false} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(dialog.closest('.fk-drawer__backdrop') as HTMLElement)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('always renders a close button that closes', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} placement="end" />)
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('closes when dragged past the threshold, and springs back before it', async () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer open title="Sheet" onOpenChange={onOpenChange}>
        Body
      </Drawer>,
    )
    const dialog = await screen.findByRole('dialog')
    const header = dialog.querySelector('.fk-drawer__header') as HTMLElement
    drag(header, 40, 1000)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect((dialog.closest('.fk-drawer') as HTMLElement).style.transform).toBe('')
    drag(header, 200, 1000)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on a fast short flick', async () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer open title="Sheet" onOpenChange={onOpenChange}>
        Body
      </Drawer>,
    )
    const dialog = await screen.findByRole('dialog')
    drag(dialog.querySelector('.fk-drawer__header') as HTMLElement, 60, 50)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('applies no translation under reduced motion', () => {
    const reduced = mediaBlock(cssOf('components/drawer/Drawer.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/animation:\s*fk-drawer-fade/)
    expect(reduced).not.toMatch(/translate/)
  })

  it('keeps elements behind unreachable and has no axe violations', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    const dialog = await screen.findByRole('dialog')
    for (let i = 0; i < 4; i++) {
      await userEvent.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
    await expectNoAxeViolations(document.body)
  })

  it('draws a system-colour border in forced colours', () => {
    expect(mediaBlock(cssOf('components/drawer/Drawer.css'), /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })
})
