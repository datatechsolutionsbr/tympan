// `<ty-toast>` (spec: wave-1/toast.md): the self-rendering region element —
// queue, history, live-region politeness, auto-dismiss timers, keyboard and
// the imperative API the generated wrappers reach through the host ref.
// Self-contained: imports the element directly (the barrel does not list it
// yet) and registers it with defineTympanElement.
//
// The haptics block runs first: the element's gesture gate is module-level,
// and the behaviour tests below dispatch gestures (keydown, pointerdown).
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { TyToastElement } from '../../src/elements/toast/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'

defineTympanElement(TyToastElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

const toastElement = (attrs = '') => html(`<ty-toast${attrs ? ` ${attrs}` : ''}></ty-toast>`).querySelector('ty-toast') as TyToastElement

const toast = (title: string) => screen.getByText(title).closest('.ty-toast') as HTMLElement

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false })
})

afterEach(() => {
  document.body.replaceChildren()
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
  vi.useRealTimers()
})

describe('<ty-toast> haptics', () => {
  let vibrate: ReturnType<typeof vi.fn>
  beforeEach(() => {
    vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate })
  })
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'vibrate')
  })

  it('never vibrates for a toast shown before any user gesture', () => {
    const t = toastElement()
    t.success('Saved')
    expect(toast('Saved')).toBeInTheDocument()
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('vibrates lightly on arrival after a user gesture', () => {
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    const t = toastElement()
    t.success('Saved')
    expect(vibrate).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledWith(8)
  })
})

describe('<ty-toast>', () => {
  it('is a landmark region named by region-label, with one live region per politeness', () => {
    toastElement()
    expect(screen.getByRole('region', { name: 'Notifications' })).toHaveClass('ty-toast-region')
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('success(...) shows the toast in the polite live region and joins the history', () => {
    const t = toastElement()
    const id = t.success('Saved')
    expect(id).toBeTruthy()
    const item = toast('Saved')
    expect(item).toHaveAttribute('data-tone', 'success')
    expect(screen.getByRole('status')).toContainElement(item)
    expect(item).toHaveAttribute('role', 'group')
    expect(item.querySelector('.ty-toast__icon')).not.toBeNull()
    expect(t.history[0]?.title).toBe('Saved')
    expect(t.history[0]?.id).toBe(id)
  })

  it('error(...) is announced assertively and stays until dismissed', () => {
    const t = toastElement()
    t.error('Failed')
    const item = toast('Failed')
    expect(item).toHaveAttribute('data-tone', 'error')
    expect(screen.getByRole('alert')).toContainElement(item)
    vi.advanceTimersByTime(60_000)
    expect(toast('Failed')).toBeInTheDocument()
  })

  it('an info toast disappears after its default duration, emits ty-toast-dismiss and stays in the history', () => {
    const onDismiss = vi.fn()
    const t = toastElement()
    t.addEventListener('ty-toast-dismiss', onDismiss)
    const id = t.info('Synced')
    vi.advanceTimersByTime(5001)
    expect(screen.queryByText('Synced')).toBeNull()
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect((onDismiss.mock.calls[0]![0] as CustomEvent).detail).toEqual({ id })
    expect(t.history[0]?.title).toBe('Synced')
  })

  it('a warning toast waits longer than an info toast', () => {
    const t = toastElement()
    t.warning('Careful')
    vi.advanceTimersByTime(5001)
    expect(toast('Careful')).toBeInTheDocument()
    vi.advanceTimersByTime(3000)
    expect(screen.queryByText('Careful')).toBeNull()
  })

  it('pauses the timer while hovered and resumes when the pointer leaves', () => {
    const t = toastElement()
    t.info('Hover me')
    const region = screen.getByRole('region', { name: 'Notifications' })
    vi.advanceTimersByTime(3000)
    fireEvent.pointerEnter(region)
    vi.advanceTimersByTime(10_000)
    expect(toast('Hover me')).toBeInTheDocument()
    fireEvent.pointerLeave(region)
    vi.advanceTimersByTime(1900)
    expect(toast('Hover me')).toBeInTheDocument()
    vi.advanceTimersByTime(200)
    expect(screen.queryByText('Hover me')).toBeNull()
  })

  it('pauses the timer while the window is hidden', () => {
    const t = toastElement()
    t.info('Hidden')
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(20_000)
    expect(toast('Hidden')).toBeInTheDocument()
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(5001)
    expect(screen.queryByText('Hidden')).toBeNull()
  })

  it('shows max-visible toasts; the next in the queue appears after one is dismissed', () => {
    const onDismiss = vi.fn()
    const t = toastElement('max-visible="3"')
    t.addEventListener('ty-toast-dismiss', onDismiss)
    const ids = ['One', 'Two', 'Three', 'Four'].map((title) => t.warning(title, { duration: 'persistent' }))
    expect(document.querySelectorAll('.ty-toast')).toHaveLength(3)
    expect(screen.queryByText('Four')).toBeNull()
    t.dismiss(ids[0]!)
    expect(toast('Four')).toBeInTheDocument()
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect((onDismiss.mock.calls[0]![0] as CustomEvent).detail).toEqual({ id: ids[0] })
  })

  it('the dismiss button (named by dismiss-label) dismisses its toast', () => {
    const t = toastElement('dismiss-label="Dispensar notificação" region-label="Notificações"')
    t.info('Guardado')
    expect(screen.getByRole('region', { name: 'Notificações' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar notificação' }))
    expect(screen.queryByText('Guardado')).toBeNull()
  })

  it('Escape on a focused toast dismisses it', () => {
    const t = toastElement()
    t.error('Escape me')
    const item = screen.getByRole('group', { name: 'Escape me' })
    item.focus()
    fireEvent.keyDown(item, { key: 'Escape' })
    expect(screen.queryByText('Escape me')).toBeNull()
  })

  it('dismiss of an unknown id is a no-op', () => {
    const onDismiss = vi.fn()
    const t = toastElement()
    t.addEventListener('ty-toast-dismiss', onDismiss)
    t.info('Still here')
    t.dismiss('no-such-toast')
    expect(toast('Still here')).toBeInTheDocument()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('a second show() with the same id replaces the toast in place, with the latest content', () => {
    const t = toastElement()
    t.show({ id: 'upload', title: 'Uploading 1 of 3' })
    t.show({ id: 'upload', title: 'Uploading 2 of 3', tone: 'success' })
    expect(document.querySelectorAll('.ty-toast')).toHaveLength(1)
    expect(screen.queryByText('Uploading 1 of 3')).toBeNull()
    const item = toast('Uploading 2 of 3')
    expect(item).toHaveAttribute('data-tone', 'success')
    expect(t.history).toHaveLength(1)
    expect(t.history[0]?.title).toBe('Uploading 2 of 3')
  })

  it('a toast with an action is persistent; the action runs onPress, emits ty-toast-action and dismisses', () => {
    const onPress = vi.fn()
    const onAction = vi.fn()
    const onDismiss = vi.fn()
    const t = toastElement()
    t.addEventListener('ty-toast-action', onAction)
    t.addEventListener('ty-toast-dismiss', onDismiss)
    const id = t.show({ title: 'Deleted', tone: 'success', action: { label: 'Undo', onPress } })
    vi.advanceTimersByTime(60_000)
    expect(toast('Deleted')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect((onAction.mock.calls[0]![0] as CustomEvent).detail).toEqual({ id })
    expect((onDismiss.mock.calls[0]![0] as CustomEvent).detail).toEqual({ id })
    expect(screen.queryByText('Deleted')).toBeNull()
  })

  it('F6 moves focus into the region and back out', () => {
    const host = html('<button type="button">Outside</button><ty-toast></ty-toast>')
    const t = host.querySelector('ty-toast') as TyToastElement
    t.error('Reach me')
    const outside = screen.getByRole('button', { name: 'Outside' })
    outside.focus()
    fireEvent.keyDown(document, { key: 'F6' })
    expect(screen.getByRole('group', { name: 'Reach me' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'F6' })
    expect(outside).toHaveFocus()
  })

  it('returns focus to where it was when the last focused toast closes', () => {
    const host = html('<button type="button">Outside</button><ty-toast></ty-toast>')
    const t = host.querySelector('ty-toast') as TyToastElement
    t.error('Last')
    const outside = screen.getByRole('button', { name: 'Outside' })
    outside.focus()
    fireEvent.keyDown(document, { key: 'F6' })
    fireEvent.keyDown(screen.getByRole('group', { name: 'Last' }), { key: 'Escape' })
    vi.runAllTimers()
    expect(outside).toHaveFocus()
  })

  it('a touch swipe toward the edge dismisses (and a short swipe does not)', () => {
    const t = toastElement()
    t.info('Swipe me', { duration: 'persistent' })
    const item = toast('Swipe me')
    const pointer = (type: string, x: number) => {
      const event = new Event(type, { bubbles: true })
      Object.assign(event, { pointerType: 'touch', clientX: x, pointerId: 1 })
      item.dispatchEvent(event)
    }
    pointer('pointerdown', 100)
    pointer('pointermove', 150)
    pointer('pointerup', 150)
    expect(toast('Swipe me')).toBeInTheDocument()
    pointer('pointerdown', 100)
    pointer('pointermove', 220)
    pointer('pointerup', 220)
    expect(screen.queryByText('Swipe me')).toBeNull()
  })

  it('placement and max-visible follow the attributes and properties', () => {
    const t = toastElement('placement="top-center"') as TyToastElement & { placement: string; maxVisible: number }
    const region = screen.getByRole('region', { name: 'Notifications' })
    expect(region).toHaveAttribute('data-placement', 'top-center')
    t.placement = 'bottom-center'
    expect(region).toHaveAttribute('data-placement', 'bottom-center')
    t.maxVisible = 1
    t.info('First')
    t.info('Second')
    expect(document.querySelectorAll('.ty-toast')).toHaveLength(1)
    expect(toast('First')).toBeInTheDocument()
  })

  it('the stylesheet covers every data-* state the element emits', () => {
    const css = cssOf('components/toast/Toast.css')
    for (const tone of ['success', 'warning', 'error']) {
      expect(css).toContain(`.ty-toast[data-tone='${tone}']`)
    }
    expect(css).toContain(".ty-toast-region[data-placement='top-center']")
    expect(css).toContain(".ty-toast-region[data-placement='bottom-center']")
    expect(css).toContain('.ty-toast__icon')
    expect(css).toContain('.ty-toast__actions')
    expect(css).toContain('.ty-toast__dismiss')
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/\.ty-toast-region/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation-name:\s*ty-toast-fade/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations', async () => {
    vi.useRealTimers()
    const t = toastElement()
    t.success('Saved', { message: 'Source stored.' })
    t.error('Failed', { action: { label: 'Retry', onPress: () => {} } })
    await expectNoAxeViolations(document.body)
  })
})
