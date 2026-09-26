// RouterAdapter (spec: wave-2/router-adapter.md). The host hands one adapter
// to the root; every library component navigates through it. The same adapter
// drives React Aria's RouterProvider, so RAC links and menu items follow it.
// Without an adapter, browser location and history are used.
import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type AnchorHTMLAttributes,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import { RouterProvider } from 'react-aria-components'

export type AdapterLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }
export type AdapterLink = ForwardRefExoticComponent<AdapterLinkProps & RefAttributes<HTMLAnchorElement>>

export interface RouterAdapterValue {
  pathname: string
  navigate: (href: string) => void
  replace: (href: string) => void
  back: () => void
  forward: () => void
  prefetch: (href: string) => void
  Link: AdapterLink
  locationKey?: string
}

export interface RouterApi {
  push: (href: string) => void
  replace: (href: string) => void
  back: () => void
  forward: () => void
  refresh: () => void
  prefetch: (href: string) => void
}

const AdapterContext = createContext<RouterAdapterValue | null>(null)

/** Plain anchor used when no adapter is present (stories, tests, isolation). */
export const PlainLink: AdapterLink = forwardRef<HTMLAnchorElement, AdapterLinkProps>(function PlainLink(props, ref) {
  return <a ref={ref} {...props} />
})

const browser = {
  path: () => (typeof window === 'undefined' ? '/' : window.location.pathname),
  go(href: string, mode: 'push' | 'replace') {
    if (typeof window === 'undefined') return
    if (mode === 'replace') window.location.replace(href)
    else window.location.assign(href)
  },
  history(step: -1 | 1) {
    if (typeof window !== 'undefined') window.history.go(step)
  },
  reload() {
    if (typeof window !== 'undefined') window.location.reload()
  },
}

export function RouterAdapterProvider({ adapter, children }: { adapter: RouterAdapterValue; children: ReactNode }) {
  return (
    <AdapterContext.Provider value={adapter}>
      <RouterProvider navigate={(href, options) => (options?.replace ? adapter.replace(href) : adapter.navigate(href))}>
        {children}
      </RouterProvider>
    </AdapterContext.Provider>
  )
}

/** The adapter in scope, or null. */
export function useRouterAdapter(): RouterAdapterValue | null {
  return useContext(AdapterContext)
}

export function useRouter(): RouterApi {
  const a = useContext(AdapterContext)
  return useMemo<RouterApi>(() => {
    if (!a) {
      return {
        push: (h) => browser.go(h, 'push'),
        replace: (h) => browser.go(h, 'replace'),
        back: () => browser.history(-1),
        forward: () => browser.history(1),
        refresh: browser.reload,
        prefetch: () => {},
      }
    }
    return {
      push: a.navigate,
      replace: a.replace,
      back: a.back,
      forward: a.forward,
      // "Refresh" re-enters the current route through the adapter.
      refresh: () => a.replace(a.pathname),
      prefetch: a.prefetch,
    }
  }, [a])
}

export function usePathname(): string {
  return useContext(AdapterContext)?.pathname ?? browser.path()
}

export function useLink(): AdapterLink {
  return useContext(AdapterContext)?.Link ?? PlainLink
}

/** Changes on every navigation: the adapter key, else the pathname. */
export function useLocationKey(): string {
  const a = useContext(AdapterContext)
  return a ? (a.locationKey ?? a.pathname) : browser.path()
}
