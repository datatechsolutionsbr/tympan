import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pencil, Trash2 } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { SwipeRow, type SwipeAction, type SwipeRowProps } from './SwipeRow'

const css = cssOf('components/swipe-row/SwipeRow.css')

function setup(extra: Partial<SwipeRowProps> = {}) {
  const edit = vi.fn()
  const remove = vi.fn()
  const archive = vi.fn()
  const leading: SwipeAction[] = [{ label: 'Edit', icon: <Pencil />, tone: 'neutral', onAction: edit }]
  const trailing: SwipeAction[] = [
    { label: 'Archive', tone: 'pending', onAction: archive },
    { label: 'Delete', icon: <Trash2 />, tone: 'danger', onAction: remove, undoable: true },
  ]
  const utils = render(
    <SwipeRow label="Boti" leadingActions={leading} trailingActions={trailing} {...extra}>
      <span>Boti, Argentina</span>
    </SwipeRow>,
  )
  const surface = utils.container.querySelector<HTMLElement>('.ty-swipe-row__surface')!
  surface.getBoundingClientRect = () => ({ width: 400, height: 56, top: 0, left: 0, right: 400, bottom: 56 }) as DOMRect
  const row = utils.container.querySelector<HTMLElement>('.ty-swipe-row')!
  return { ...utils, surface, row, edit, remove, archive }
}

function swipe(el: HTMLElement, dx: number, dy = 0) {
  fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 20 }] })
  fireEvent.touchMove(el, { touches: [{ clientX: 200 + dx / 2, clientY: 20 + dy / 2 }] })
  fireEvent.touchMove(el, { touches: [{ clientX: 200 + dx, clientY: 20 + dy }] })
  fireEvent.touchEnd(el, { touches: [] })
}

describe('SwipeRow', () => {
  it('lists every action from the actions menu button, by keyboard', async () => {
    setup()
    await userEvent.tab()
    const button = screen.getByRole('button', { name: 'Actions for Boti' })
    expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const items = await screen.findAllByRole('menuitem')
    expect(items.map((i) => i.textContent)).toEqual(['Edit', 'Archive', 'Delete'])
  })

  it('reveals the side past half an action width and makes it focusable', () => {
    const { surface, row } = setup({ fullSwipe: false })
    const trailing = row.querySelector('[data-side="trailing"]')!
    expect(trailing).toHaveAttribute('aria-hidden', 'true')
    swipe(surface, -60)
    expect(row).toHaveAttribute('data-reveal', 'trailing')
    expect(trailing).not.toHaveAttribute('aria-hidden')
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument()
  })

  it('returns to rest after a small swipe', () => {
    const { surface, row } = setup()
    swipe(surface, -20)
    expect(row).toHaveAttribute('data-reveal', 'none')
  })

  it('fires the first action of the side once on a full swipe', () => {
    const { surface, edit } = setup()
    swipe(surface, 300)
    expect(edit).toHaveBeenCalledTimes(1)
  })

  it('asks for confirmation before a destructive full swipe without undo', async () => {
    const remove = vi.fn()
    const confirm = vi.fn(() => Promise.resolve(true))
    const { container } = render(
      <SwipeRow label="Row" trailingActions={[{ label: 'Delete', tone: 'danger', onAction: remove }]} confirm={confirm}>
        x
      </SwipeRow>,
    )
    const surface = container.querySelector<HTMLElement>('.ty-swipe-row__surface')!
    surface.getBoundingClientRect = () => ({ width: 400 }) as DOMRect
    await act(async () => swipe(surface, -300))
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    expect(confirm).toHaveBeenCalledTimes(1)
  })

  it('closes a revealed row on Escape and returns focus to the row', async () => {
    const { surface, row } = setup({ fullSwipe: false })
    swipe(surface, -60)
    screen.getByRole('button', { name: 'Archive' }).focus()
    await userEvent.keyboard('{Escape}')
    expect(row).toHaveAttribute('data-reveal', 'none')
    expect(surface).toHaveFocus()
  })

  it('ignores a mostly vertical drag', () => {
    const { surface, row } = setup()
    swipe(surface, -30, 120)
    expect(row).toHaveAttribute('data-reveal', 'none')
    expect(row).not.toHaveAttribute('data-dragging')
    expect(css).toMatch(/touch-action:\s*pan-y/)
  })

  it('snaps without transitions under reduced motion; no pixel-valued props', () => {
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/ButtonText/)
    expect(css).toMatch(/\.ty-swipe-row__action\s*\{[^}]*min-inline-size:\s*var\(--ty-control-target\)/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <SwipeRow label={`Row ${scheme}`} trailingActions={[{ label: 'Delete', tone: 'danger', onAction: () => {} }]}>
              <span>Row {scheme}</span>
            </SwipeRow>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
