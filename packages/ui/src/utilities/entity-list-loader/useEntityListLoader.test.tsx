import { act, renderHook, waitFor } from '@testing-library/react'
import { forwardRef, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { RouterAdapterProvider, type RouteAnchorProps, type NavigationAdapter } from '../router-adapter/RouterAdapter'
import { useEntityListLoader } from './useEntityListLoader'

const Link = forwardRef<HTMLAnchorElement, RouteAnchorProps>((p, ref) => <a ref={ref} {...p} />)
const adapterAt = (locationKey: string): NavigationAdapter => ({
  pathname: '/list',
  locationKey,
  navigate: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  prefetch: () => {},
  Link,
})

describe('useEntityListLoader', () => {
  it('loads two items and stops loading', async () => {
    const { result } = renderHook(() => useEntityListLoader(() => Promise.resolve([1, 2])))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toEqual([1, 2])
  })

  it('refetches when the location key changes', async () => {
    const fetcher = vi.fn(() => Promise.resolve(['a']))
    let key = 'k1'
    const wrapper = ({ children }: { children: ReactNode }) => <RouterAdapterProvider adapter={adapterAt(key)}>{children}</RouterAdapterProvider>
    const { result, rerender } = renderHook(() => useEntityListLoader(fetcher), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    key = 'k2'
    rerender()
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  })

  it('does not fetch with a null key and is not stuck loading', () => {
    const fetcher = vi.fn(() => Promise.resolve([]))
    const { result } = renderHook(() => useEntityListLoader(fetcher, { revalidationKey: null }))
    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('wraps a string rejection into an Error and keeps items', async () => {
    const { result } = renderHook(() => useEntityListLoader(() => Promise.reject('offline'), { initial: ['kept'] }))
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
    expect(result.current.error?.message).toBe('offline')
    expect(result.current.items).toEqual(['kept'])
  })

  it('ignores a response arriving after unmount', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    let resolve!: (v: number[]) => void
    const { unmount } = renderHook(() => useEntityListLoader(() => new Promise<number[]>((r) => (resolve = r))))
    unmount()
    await act(async () => resolve([1]))
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('clears the error when refresh succeeds, and treats null as empty', async () => {
    let fail = true
    const { result } = renderHook(() => useEntityListLoader(() => (fail ? Promise.reject(new Error('x')) : Promise.resolve(null))))
    await waitFor(() => expect(result.current.error).not.toBeNull())
    fail = false
    await act(() => result.current.refresh())
    expect(result.current.error).toBeNull()
    expect(result.current.items).toEqual([])
  })

  it('uses the latest inline fetcher without looping', async () => {
    let calls = 0
    const { result, rerender } = renderHook(({ v }) => useEntityListLoader(() => (calls++, Promise.resolve([v]))), { initialProps: { v: 'first' } })
    await waitFor(() => expect(result.current.loading).toBe(false))
    rerender({ v: 'second' })
    await act(() => result.current.refresh())
    expect(result.current.items).toEqual(['second'])
    expect(calls).toBe(2)
  })
})
