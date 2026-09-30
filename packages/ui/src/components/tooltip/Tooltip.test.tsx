import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Trash2 } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { Button as RacButton } from 'react-aria-components'
import { ModalDialog } from '../modal-dialog/ModalDialog'
import { Tooltip } from './Tooltip'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderRtl } from '../../../test/rtl'

/**
 * Icon-only trigger; `name` omitted is exactly the `role="label"` use case.
 * A RAC Button (not a plain <button>): the trigger props arrive through
 * FocusableContext and only RAC components consume them, and the rest spread
 * forwards the cloned aria-labelledby of `role="label"`.
 */
function IconButton({ name, onPress, ...rest }: { name?: string; onPress?: () => void } & React.ComponentProps<typeof RacButton>) {
  return (
    <RacButton aria-label={name} onPress={onPress} {...rest}>
      <Trash2 aria-hidden="true" focusable="false" />
    </RacButton>
  )
}

const rect = (x: number, y: number, w: number, h: number) => ({
  value: () => ({ x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h, toJSON: () => ({}) }),
})

describe('Tooltip', () => {
  it('opens on keyboard focus and describes the trigger', async () => {
    render(
      <Tooltip content="Delete">
        <IconButton name="Delete row" />
      </Tooltip>,
    )
    await userEvent.tab()
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Delete row' })).toHaveAccessibleDescription('Delete')
  })

  it('names the trigger while closed when role is label', () => {
    render(
      <Tooltip content="Delete" role="label">
        <IconButton />
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAccessibleName('Delete')
  })

  it('closes on Escape and keeps focus on the trigger', async () => {
    render(
      <Tooltip content="Delete">
        <IconButton name="Delete row" />
      </Tooltip>,
    )
    const trigger = screen.getByRole('button')
    trigger.focus()
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument())
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('Escape inside a dialog closes only the tooltip', async () => {
    render(
      <ModalDialog isOpen onOpenChange={() => {}} title="Confirm">
        <Tooltip content="Delete">
          <IconButton name="Delete row" />
        </Tooltip>
      </ModalDialog>,
    )
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    const trigger = screen.getByRole('button', { name: 'Delete row' })
    trigger.focus()
    // The modal hides portaled siblings (aria-hide-outside), so the open
    // tooltip only matches with hidden: true.
    await waitFor(() => expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument())
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens on hover and stays open while the pointer moves onto the bubble', async () => {
    render(
      <Tooltip content="Delete">
        <IconButton name="Delete row" />
      </Tooltip>,
    )
    const trigger = screen.getByRole('button')
    Object.defineProperty(trigger, 'getBoundingClientRect', rect(8, 8, 32, 32))
    // Prime the shared virtual pointer: the first hover of a session does not
    // open a react-aria tooltip on its own.
    await userEvent.hover(document.body)
    await userEvent.hover(trigger)
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument())
    const bubble = screen.getByRole('tooltip')
    Object.defineProperty(bubble, 'getBoundingClientRect', rect(8, -20, 60, 24))
    await userEvent.hover(bubble)
    await new Promise((r) => setTimeout(r, 60))
    expect(bubble).toBeInTheDocument()
  })

  it('opens the next adjacent trigger without the warm-up delay', async () => {
    render(
      <div>
        <Tooltip content="One">
          <IconButton name="First" />
        </Tooltip>
        <Tooltip content="Two">
          <IconButton name="Second" />
        </Tooltip>
      </div>,
    )
    const [first, second] = screen.getAllByRole('button')
    const firstButton = first!
    const secondButton = second!
    Object.defineProperty(firstButton, 'getBoundingClientRect', rect(0, 0, 32, 32))
    Object.defineProperty(secondButton, 'getBoundingClientRect', rect(40, 0, 32, 32))
    await userEvent.hover(firstButton)
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument())
    await userEvent.unhover(firstButton)
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
    await userEvent.hover(secondButton)
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument(), { timeout: 150 })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('never opens when disabled', async () => {
    render(
      <Tooltip content="Delete" disabled>
        <IconButton name="Delete row" />
      </Tooltip>,
    )
    const trigger = screen.getByRole('button')
    await userEvent.hover(trigger)
    trigger.focus()
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('runs the action on a touch tap without opening the tooltip', async () => {
    const onPress = vi.fn()
    render(
      <Tooltip content="Delete">
        <IconButton name="Delete row" onPress={onPress} />
      </Tooltip>,
    )
    await userEvent.pointer({ keys: '[TouchA>][/TouchA]', target: screen.getByRole('button') })
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('supports the controlled open pair', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Tooltip content="Delete" open onOpenChange={onOpenChange}>
        <IconButton name="Delete row" />
      </Tooltip>,
    )
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    rerender(
      <Tooltip content="Delete" open={false} onOpenChange={onOpenChange}>
        <IconButton name="Delete row" />
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('has no axe violations, open, with a named Button trigger', async () => {
    const { container } = render(
      <Tooltip content="Delete the selected rows" role="label" open>
        <IconButton />
      </Tooltip>,
    )
    expect(screen.getByRole('button', { name: 'Delete the selected rows' })).toBeInTheDocument()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await axeRtl(container)
  })

  it('animates opacity only, and nothing under reduced motion', () => {
    const css = cssOf('components/tooltip/Tooltip.css')
    expect(css).toMatch(/@keyframes ty-tooltip-fade\s*\{[^}]*opacity:\s*0/)
    expect(css).not.toMatch(/ty-tooltip-fade\s*\{[^}]*transform/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })
})

describe('Tooltip in right-to-left (ar)', () => {
  it('opens on focus and passes axe', async () => {
    const { container } = renderRtl(
      <Tooltip content="احذف" placement="end">
        <IconButton name="حذف الصف" />
      </Tooltip>,
    )
    const trigger = rtlDom.screen.getByRole('button')
    // Keyboard focus: react-aria does not open a tooltip on programmatic
    // focus while the interaction modality is still "pointer".
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    await rtlDom.waitFor(() => expect(rtlDom.screen.getByRole('tooltip')).toBeInTheDocument())
    expect(trigger).toHaveAccessibleDescription('احذف')
    await axeRtl(container)
  })
})
