import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { PullToRefresh, type PullToRefreshHandle } from './PullToRefresh'

const css = cssOf('components/pull-to-refresh/PullToRefresh.css')

function pull(el: HTMLElement, dy: number) {
  fireEvent.touchStart(el, { touches: [{ clientX: 10, clientY: 10 }] })
  fireEvent.touchMove(el, { touches: [{ clientX: 10, clientY: 10 + dy / 2 }] })
  fireEvent.touchMove(el, { touches: [{ clientX: 10, clientY: 10 + dy }] })
  fireEvent.touchEnd(el, { touches: [] })
}

function deferred() {
  let resolve!: () => void
  let reject!: (e: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const region = (c: HTMLElement) => c.querySelector<HTMLElement>('.ty-pull')!

describe('PullToRefresh', () => {
  it('refreshes once past the threshold and stays busy until it resolves', async () => {
    const d = deferred()
    const onRefresh = vi.fn(() => d.promise)
    const { container } = render(<PullToRefresh onRefresh={onRefresh}>List</PullToRefresh>)
    act(() => pull(region(container), 200))
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(region(container)).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Refreshing')
    await act(async () => d.resolve())
    expect(region(container)).not.toHaveAttribute('aria-busy')
  })

  it('does nothing below the threshold and hides the indicator', () => {
    const onRefresh = vi.fn(() => Promise.resolve())
    const { container } = render(<PullToRefresh onRefresh={onRefresh}>List</PullToRefresh>)
    act(() => pull(region(container), 30))
    expect(onRefresh).not.toHaveBeenCalled()
    expect(container.querySelector('.ty-pull__indicator')).not.toHaveAttribute('data-visible')
  })

  it('does not start when the container is scrolled down', () => {
    const onRefresh = vi.fn(() => Promise.resolve())
    const { container } = render(<PullToRefresh onRefresh={onRefresh}>List</PullToRefresh>)
    region(container).scrollTop = 120
    act(() => pull(region(container), 200))
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('does not call twice while a refresh is in progress', async () => {
    const d = deferred()
    const onRefresh = vi.fn(() => d.promise)
    const { container } = render(<PullToRefresh onRefresh={onRefresh}>List</PullToRefresh>)
    act(() => pull(region(container), 200))
    act(() => pull(region(container), 200))
    expect(onRefresh).toHaveBeenCalledTimes(1)
    await act(async () => d.resolve())
  })

  it('clears the busy state when onRefresh rejects', async () => {
    const { container } = render(<PullToRefresh onRefresh={() => Promise.reject(new Error('offline'))}>List</PullToRefresh>)
    await act(async () => pull(region(container), 200))
    await waitFor(() => expect(region(container)).not.toHaveAttribute('aria-busy'))
  })

  it('runs the same states from a Refresh button through refresh()', async () => {
    const d = deferred()
    const ref = createRef<PullToRefreshHandle>()
    const { container } = render(
      <>
        <button type="button" onClick={() => void ref.current?.refresh()}>
          Refresh
        </button>
        <PullToRefresh ref={ref} onRefresh={() => d.promise}>
          List
        </PullToRefresh>
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(region(container)).toHaveAttribute('aria-busy', 'true')
    await act(async () => d.resolve())
    expect(region(container)).not.toHaveAttribute('aria-busy')
  })

  it('does not slide content under reduced motion; forced colours use CanvasText', () => {
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/translate:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const d = deferred()
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <PullToRefresh onRefresh={() => d.promise} indicator={scheme === 'dark' ? 'dots' : 'ring'}>
              <p>Items</p>
            </PullToRefresh>
          </ThemeScope>
        ))}
      </>,
    )
    act(() => pull(container.querySelector<HTMLElement>('.ty-pull')!, 200))
    await expectNoAxeViolations(container)
    await act(async () => d.resolve())
  })
})
