import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { forwardRef, type ReactNode } from 'react'
import { Link as AriaLink } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { PlainAnchor, RoutingProvider, useCurrentPath, useRouteAnchor, useRouting, useVisitKey, type AnchorProps, type RouteHost } from './Routing'

function makeHost(patch: Partial<RouteHost> = {}): RouteHost {
  const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>((p, ref) => <a ref={ref} data-router="yes" {...p} />)
  return { path: '/projects', go: vi.fn(), step: vi.fn(), warm: vi.fn(), Anchor, ...patch }
}

const within = (host: RouteHost) =>
  function W({ children }: { children: ReactNode }) {
    return <RoutingProvider host={host}>{children}</RoutingProvider>
  }

describe('Routing', () => {
  it('open goes through the host', () => {
    const host = makeHost()
    const { result } = renderHook(() => useRouting(), { wrapper: within(host) })
    result.current.open('/x')
    expect(host.go).toHaveBeenCalledWith('/x', undefined)
    result.current.swap('/y')
    expect(host.go).toHaveBeenLastCalledWith('/y', { swap: true })
    result.current.goBack()
    result.current.goOn()
    expect(host.step).toHaveBeenNthCalledWith(1, -1)
    expect(host.step).toHaveBeenNthCalledWith(2, 1)
    result.current.reload()
    expect(host.go).toHaveBeenLastCalledWith('/projects', { swap: true })
    result.current.warm('/z')
    expect(host.warm).toHaveBeenCalledWith('/z')
  })

  it('falls back to the browser path and a plain anchor', () => {
    const { result } = renderHook(() => ({ path: useCurrentPath(), Anchor: useRouteAnchor() }))
    expect(result.current.path).toBe(window.location.pathname)
    expect(result.current.Anchor).toBe(PlainAnchor)
    const A = result.current.Anchor
    render(<A href="/a">A</A>)
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '/a')
  })

  it('uses the path as visit key when the host has none', () => {
    const { result } = renderHook(() => useVisitKey(), { wrapper: within(makeHost()) })
    expect(result.current).toBe('/projects')
    const keyed = renderHook(() => useVisitKey(), { wrapper: within(makeHost({ visit: 'k7' })) })
    expect(keyed.result.current).toBe('k7')
  })

  it('routes React Aria links through the host', async () => {
    const host = makeHost()
    render(
      <RoutingProvider host={host}>
        <AriaLink href="/sources">Sources</AriaLink>
      </RoutingProvider>,
    )
    await userEvent.click(screen.getByRole('link', { name: 'Sources' }))
    expect(host.go).toHaveBeenCalledWith('/sources', undefined)
  })

  it('exposes the host anchor component', () => {
    const host = makeHost()
    const { result } = renderHook(() => useRouteAnchor(), { wrapper: within(host) })
    expect(result.current).toBe(host.Anchor)
  })
})
