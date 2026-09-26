// RouterAdapter (spec: wave-2/router-adapter.md).
//
// The host installs one navigation adapter at the root. Everything the
// library needs from routing goes through a small `Navigator` object built
// from that adapter, or from the browser's own location and history when no
// adapter is installed (stories, tests, isolated use). The same adapter also
// feeds React Aria's RouterProvider, so RAC links and menu items follow it.
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

export type RouteAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }
export type RouteAnchor = ForwardRefExoticComponent<RouteAnchorProps & RefAttributes<HTMLAnchorElement>>

/** What the host supplies (field names fixed by the spec). */
export interface NavigationAdapter {
  pathname: string
  navigate: (href: string) => void
  replace: (href: string) => void
  back: () => void
  forward: () => void
  prefetch: (href: string) => void
  Link: RouteAnchor
  locationKey?: string
}

/** What `useRouter()` hands to components. */
export interface NavigationCommands {
  push: (href: string) => void
  replace: (href: string) => void
  back: () => void
  forward: () => void
  refresh: () => void
  prefetch: (href: string) => void
}

/** Plain anchor used when no adapter is present. */
export const FallbackAnchor: RouteAnchor = forwardRef<HTMLAnchorElement, RouteAnchorProps>(function FallbackAnchor(props, ref) {
  return <a ref={ref} {...props} />
})

/** One place that answers every routing question, whatever the source. */
interface Navigator {
  commands: NavigationCommands
  where(): string
  stamp(): string
  anchor: RouteAnchor
}

const hasWindow = () => typeof window !== 'undefined'
const ignore = () => {}

function fromWindow(): Navigator {
  const step = (delta: number) => () => {
    if (hasWindow()) window.history.go(delta)
  }
  const where = () => (hasWindow() ? window.location.pathname : '/')
  return {
    commands: {
      push: (href) => hasWindow() && window.location.assign(href),
      replace: (href) => hasWindow() && window.location.replace(href),
      back: step(-1),
      forward: step(1),
      refresh: () => hasWindow() && window.location.reload(),
      prefetch: ignore,
    },
    where,
    stamp: where,
    anchor: FallbackAnchor,
  }
}

function fromAdapter(source: NavigationAdapter): Navigator {
  return {
    commands: {
      push: source.navigate,
      replace: source.replace,
      back: source.back,
      forward: source.forward,
      // Re-enter the current route through the adapter.
      refresh: () => source.replace(source.pathname),
      prefetch: source.prefetch,
    },
    where: () => source.pathname,
    stamp: () => source.locationKey ?? source.pathname,
    anchor: source.Link,
  }
}

const Installed = createContext<NavigationAdapter | null>(null)

export function RouterAdapterProvider({ adapter, children }: { adapter: NavigationAdapter; children: ReactNode }) {
  const go = (href: string, opts?: { replace?: boolean }) => (opts?.replace ? adapter.replace : adapter.navigate)(href)
  return (
    <Installed.Provider value={adapter}>
      <RouterProvider navigate={go}>{children}</RouterProvider>
    </Installed.Provider>
  )
}

/** The adapter in scope, or null. */
export function useRouterAdapter(): NavigationAdapter | null {
  return useContext(Installed)
}

function useNavigator(): Navigator {
  const source = useContext(Installed)
  return useMemo(() => (source ? fromAdapter(source) : fromWindow()), [source])
}

export function useRouter(): NavigationCommands {
  return useNavigator().commands
}

export function usePathname(): string {
  return useNavigator().where()
}

export function useLink(): RouteAnchor {
  return useNavigator().anchor
}

/** Changes on every navigation: the adapter key, else the pathname. */
export function useLocationKey(): string {
  return useNavigator().stamp()
}
