import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { Button } from '../button/Button'
import { Popover } from './Popover'

import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('Popover', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders the info trigger with its label and collapsed state', () => {
    render(
      <Popover triggerLabel="About this score" title="Score">
        Explains the score.
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: 'About this score' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens a panel labelled by the title and expands the trigger', async () => {
    render(
      <Popover triggerLabel="About this score" title="Score">
        Explains the score.
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: 'About this score' })
    await userEvent.click(trigger)
    expect(await screen.findByRole('dialog', { name: 'Score' })).toBeVisible()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    render(
      <Popover triggerLabel="About" title="Score">
        Explains.
      </Popover>,
    )
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('button', { name: 'About' })).toHaveFocus())
  })

  it('calls onOpenChange(false) on an outside click', async () => {
    const onOpenChange = vi.fn()
    render(
      <>
        <Popover triggerLabel="About" title="Score" onOpenChange={onOpenChange}>
          Explains.
        </Popover>
        <p>Outside</p>
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'About' }))
    await screen.findByRole('dialog')
    await userEvent.click(document.body)
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false))
  })

  it('flips below the trigger when there is no room above', async () => {
    const rect = (top: number, h: number, w = 100) =>
      ({ x: 100, y: top, top, left: 100, right: 100 + w, bottom: top + h, width: w, height: h, toJSON: () => ({}) }) as DOMRect
    const size = (el: HTMLElement) =>
      el.classList.contains('fk-popover') ? { w: 200, h: 120 } : el.classList.contains('fk-button') ? { w: 32, h: 32 } : { w: 1024, h: 768 }
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const { w, h } = size(this)
      return this.classList.contains('fk-button') ? rect(4, h, w) : rect(0, h, w)
    })
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return size(this).w
    })
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return size(this).h
    })
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return size(this).h
    })
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(768)
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1024)
    render(
      <Popover triggerLabel="About" title="Score" placement="top" defaultOpen>
        Explains.
      </Popover>,
    )
    const dialog = await screen.findByRole('dialog')
    const panel = dialog.closest('.fk-popover') as HTMLElement
    await waitFor(() => expect(panel).toHaveAttribute('data-placement', 'bottom'))
  })

  it('shows without interaction when controlled open', async () => {
    render(
      <Popover trigger={<Button>Brand</Button>} title="Brand menu" open>
        <a href="/a">Home</a>
      </Popover>,
    )
    expect(await screen.findByRole('dialog', { name: 'Brand menu' })).toBeInTheDocument()
  })

  it('closes when Tab leaves the panel', async () => {
    const onOpenChange = vi.fn()
    render(
      <>
        <Popover trigger={<Button>Filters</Button>} title="Filters" onOpenChange={onOpenChange}>
          <button type="button">Apply</button>
        </Popover>
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await screen.findByRole('dialog')
    const apply = screen.getByRole('button', { name: 'Apply' })
    apply.focus()
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    apply.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false))
    outside.remove()
  })

  it('has reduced-motion and forced-colours rules and a 44 px trigger hit area', () => {
    const css = cssOf('components/popover/Popover.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
    expect(cssOf('components/button/Button.css')).toMatch(/max\(100%,\s*var\(--fk-control-target\)\)/)
  })

  it('has no axe violations when open', async () => {
    render(
      <Popover triggerLabel="About this score" title="Score" defaultOpen>
        Explains the score.
      </Popover>,
    )
    await screen.findByRole('dialog')
    await expectNoAxeViolations(document.body)
  })
})

describe('Popover in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    renderRtl(<Popover triggerLabel="حول هذه النتيجة" title="نتيجة الإثبات"><p>نص</p></Popover>)
    await rtlUser.click(rtlDom.screen.getByRole('button', { name: 'حول هذه النتيجة' }))
    expect(await rtlDom.screen.findByRole('dialog')).toBeInTheDocument()
    await axeRtl(document.body)
  })
})
