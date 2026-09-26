import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { forwardRef, type ReactNode } from 'react'
import { Link as AriaLink } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { FallbackAnchor, RouterAdapterProvider, useLink, useLocationKey, usePathname, useRouter, type RouteAnchorProps, type NavigationAdapter } from './RouterAdapter'

function makeAdapter(patch: Partial<NavigationAdapter> = {}): NavigationAdapter {
  const Link = forwardRef<HTMLAnchorElement, RouteAnchorProps>((p, ref) => <a ref={ref} data-router="yes" {...p} />)
  return {
    pathname: '/projects',
    navigate: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    Link,
    ...patch,
  }
}

const wrap = (adapter: NavigationAdapter) =>
  function W({ children }: { children: ReactNode }) {
    return <RouterAdapterProvider adapter={adapter}>{children}</RouterAdapterProvider>
  }

describe('RouterAdapter', () => {
  it('push goes through the adapter navigate', () => {
    const adapter = makeAdapter()
    const { result } = renderHook(() => useRouter(), { wrapper: wrap(adapter) })
    result.current.push('/x')
    expect(adapter.navigate).toHaveBeenCalledWith('/x')
  })

  it('falls back to the browser path and a plain anchor', () => {
    const { result } = renderHook(() => ({ path: usePathname(), Link: useLink() }))
    expect(result.current.path).toBe(window.location.pathname)
    expect(result.current.Link).toBe(FallbackAnchor)
    const L = result.current.Link
    render(<L href="/a">A</L>)
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '/a')
  })

  it('uses the pathname as location key when the adapter has none', () => {
    const { result, rerender } = renderHook(() => useLocationKey(), { wrapper: wrap(makeAdapter()) })
    expect(result.current).toBe('/projects')
    rerender()
    const keyed = renderHook(() => useLocationKey(), { wrapper: wrap(makeAdapter({ locationKey: 'k7' })) })
    expect(keyed.result.current).toBe('k7')
  })

  it('routes React Aria links through the adapter', async () => {
    const adapter = makeAdapter()
    render(
      <RouterAdapterProvider adapter={adapter}>
        <AriaLink href="/sources">Sources</AriaLink>
      </RouterAdapterProvider>,
    )
    await userEvent.click(screen.getByRole('link', { name: 'Sources' }))
    expect(adapter.navigate).toHaveBeenCalledWith('/sources')
  })

  it('exposes the adapter link component', () => {
    const adapter = makeAdapter()
    const { result } = renderHook(() => useLink(), { wrapper: wrap(adapter) })
    expect(result.current).toBe(adapter.Link)
  })
})
