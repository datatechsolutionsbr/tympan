import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ToastProvider, useToast, type ToastApi, type ToastProviderProps } from './Toast'

import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

function setup(props: Omit<ToastProviderProps, 'children'> = {}) {
  let api!: ToastApi
  function Grab() {
    api = useToast()
    return <button type="button">Outside</button>
  }
  const utils = render(
    <ToastProvider {...props}>
      <Grab />
    </ToastProvider>,
  )
  return { ...utils, api: () => api }
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('success shows in a polite live region and joins the history', () => {
    const { api } = setup()
    act(() => {
      api().success('Saved')
    })
    const title = screen.getByText('Saved')
    expect(title.closest('[aria-live="polite"]')).not.toBeNull()
    expect(api().history[0]?.title).toBe('Saved')
  })

  it('error is assertive and stays until dismissed', () => {
    const { api } = setup()
    act(() => {
      api().error('Failed')
    })
    expect(screen.getByText('Failed').closest('[aria-live="assertive"]')).toHaveAttribute('role', 'alert')
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('an info toast disappears after its duration and calls onDismiss', () => {
    const onDismiss = vi.fn()
    const { api } = setup({ onDismiss })
    let id = ''
    act(() => {
      id = api().info('Synced')
    })
    act(() => {
      vi.advanceTimersByTime(5001)
    })
    expect(screen.queryByText('Synced')).toBeNull()
    expect(onDismiss).toHaveBeenCalledWith(id)
  })

  it('pauses while hovered and resumes when the pointer leaves', () => {
    const { api, container } = setup()
    act(() => {
      api().info('Hover me')
    })
    const region = document.querySelector('.fk-toast-region')!
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    fireEvent.pointerEnter(region)
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByText('Hover me')).toBeInTheDocument()
    fireEvent.pointerLeave(region)
    act(() => {
      vi.advanceTimersByTime(1900)
    })
    expect(screen.getByText('Hover me')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.queryByText('Hover me')).toBeNull()
    expect(container).toBeTruthy()
  })

  it('pauses while the window is hidden', () => {
    const { api } = setup()
    act(() => {
      api().info('Hidden')
    })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
      vi.advanceTimersByTime(20_000)
    })
    expect(screen.getByText('Hidden')).toBeInTheDocument()
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
      vi.advanceTimersByTime(5001)
    })
    expect(screen.queryByText('Hidden')).toBeNull()
  })

  it('shows three of four toasts and the fourth after one is dismissed', () => {
    const { api } = setup({ maxVisible: 3 })
    act(() => {
      ;['One', 'Two', 'Three', 'Four'].forEach((t) => api().warning(t, { duration: 'persistent' }))
    })
    expect(screen.getAllByRole('group')).toHaveLength(3)
    expect(screen.queryByText('Four')).toBeNull()
    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss notification' })[0]!)
    })
    expect(screen.getByText('Four')).toBeInTheDocument()
  })

  it('Escape on a focused toast dismisses it', () => {
    const { api } = setup()
    act(() => {
      api().error('Escape me')
    })
    const toast = screen.getByRole('group', { name: 'Escape me' })
    act(() => toast.focus())
    fireEvent.keyDown(toast, { key: 'Escape' })
    expect(screen.queryByText('Escape me')).toBeNull()
  })

  it('throws a descriptive error outside the provider', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/)
    err.mockRestore()
  })

  it('replaces a toast shown again with the same id', () => {
    const { api } = setup()
    act(() => {
      api().info('Uploading 1 of 3', { id: 'upload' })
      api().info('Uploading 2 of 3', { id: 'upload' })
    })
    expect(screen.getAllByRole('group')).toHaveLength(1)
    expect(screen.getByText('Uploading 2 of 3')).toBeInTheDocument()
  })

  it('does not auto-dismiss toasts with an action', () => {
    const onUndo = vi.fn()
    const { api } = setup()
    act(() => {
      api().success('Deleted', { action: { label: 'Undo', onPress: onUndo } })
    })
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('is a region landmark named "Notifications" reachable with F6', () => {
    const { api } = setup()
    act(() => {
      api().error('Reach me')
    })
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeInTheDocument()
    screen.getByRole('button', { name: 'Outside' }).focus()
    fireEvent.keyDown(document, { key: 'F6' })
    expect(screen.getByRole('group', { name: 'Reach me' })).toHaveFocus()
  })

  it('returns focus to where it was when the last focused toast closes', () => {
    const { api } = setup()
    act(() => {
      api().error('Last')
    })
    const outside = screen.getByRole('button', { name: 'Outside' })
    outside.focus()
    fireEvent.keyDown(document, { key: 'F6' })
    fireEvent.keyDown(screen.getByRole('group', { name: 'Last' }), { key: 'Escape' })
    act(() => {
      vi.runAllTimers()
    })
    expect(outside).toHaveFocus()
  })

  it('fades only under reduced motion and keeps a border in forced colours', () => {
    const css = cssOf('components/toast/Toast.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation-name:\s*fk-toast-fade/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations', async () => {
    vi.useRealTimers()
    const { api, container } = setup()
    act(() => {
      api().success('Saved', { message: 'Source stored.' })
      api().error('Failed', { action: { label: 'Retry', onPress: () => {} } })
    })
    await expectNoAxeViolations(container.ownerDocument.body)
  })
})

describe('Toast in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    function Trigger() {
      const toast = useToast()
      return <button type="button" onClick={() => toast.success('تم حفظ المصدر')}>احفظ</button>
    }
    const { container } = renderRtl(<ToastProvider><Trigger /></ToastProvider>)
    await rtlUser.click(rtlDom.screen.getByRole('button', { name: 'احفظ' }))
    expect(await rtlDom.screen.findByText('تم حفظ المصدر')).toBeInTheDocument()
    await axeRtl(container)
  })
})
