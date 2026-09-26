// Routing bridge (spec: wave-2/router-adapter.md; names renamed in
// implementation, see the spec's note).
//
// A host plugs its router in once, as a `RouteHost`. Components ask a
// `Routes` object for the current path, a visit key, an anchor component and
// the moves (open, swap, back, on, reload, warm). Without a host, a browser
// implementation answers from `location` and `history`. The host also drives
// React Aria's RouterProvider, so RAC links and menu items route through it.
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

export type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }
export type AnchorComponent = ForwardRefExoticComponent<AnchorProps & RefAttributes<HTMLAnchorElement>>

/** What the host router provides. */
export interface RouteHost {
  /** Current path. */
  path: string
  /** Go to `href`; `swap` replaces the current history entry. */
  go: (href: string, how?: { swap?: boolean }) => void
  /** Move through history: -1 back, 1 forward. */
  step: (by: -1 | 1) => void
  /** Warm a route (may do nothing). */
  warm: (href: string) => void
  /** The router's link; must render a real `<a href>`. */
  Anchor: AnchorComponent
  /** Changes on every visit; the path when absent. */
  visit?: string
}

/** Moves available to components. */
export interface RouteMoves {
  open: (href: string) => void
  swap: (href: string) => void
  goBack: () => void
  goOn: () => void
  reload: () => void
  warm: (href: string) => void
}

/** Plain anchor, used without a host. */
export const PlainAnchor: AnchorComponent = forwardRef<HTMLAnchorElement, AnchorProps>(function PlainAnchor(props, ref) {
  return <a ref={ref} {...props} />
})

abstract class Routes {
  abstract readonly path: string
  abstract readonly visit: string
  abstract readonly Anchor: AnchorComponent
  protected abstract to(href: string, swap: boolean): void
  protected abstract walk(by: -1 | 1): void
  protected abstract again(): void
  protected abstract preload(href: string): void

  readonly moves: RouteMoves = {
    open: (href) => this.to(href, false),
    swap: (href) => this.to(href, true),
    goBack: () => this.walk(-1),
    goOn: () => this.walk(1),
    reload: () => this.again(),
    warm: (href) => this.preload(href),
  }
}

class BrowserRoutes extends Routes {
  readonly Anchor = PlainAnchor
  get path() {
    return typeof window === 'undefined' ? '/' : window.location.pathname
  }
  get visit() {
    return this.path
  }
  protected to(href: string, swap: boolean) {
    if (typeof window === 'undefined') return
    if (swap) window.location.replace(href)
    else window.location.assign(href)
  }
  protected walk(by: -1 | 1) {
    if (typeof window !== 'undefined') window.history.go(by)
  }
  protected again() {
    if (typeof window !== 'undefined') window.location.reload()
  }
  protected preload() {}
}

class HostRoutes extends Routes {
  constructor(private readonly host: RouteHost) {
    super()
  }
  get Anchor() {
    return this.host.Anchor
  }
  get path() {
    return this.host.path
  }
  get visit() {
    return this.host.visit ?? this.host.path
  }
  protected to(href: string, swap: boolean) {
    this.host.go(href, swap ? { swap: true } : undefined)
  }
  protected walk(by: -1 | 1) {
    this.host.step(by)
  }
  // Re-enter the current route through the host.
  protected again() {
    this.host.go(this.host.path, { swap: true })
  }
  protected preload(href: string) {
    this.host.warm(href)
  }
}

const HostSlot = createContext<RouteHost | null>(null)
const browser = new BrowserRoutes()

export function RoutingProvider({ host, children }: { host: RouteHost; children: ReactNode }) {
  return (
    <HostSlot.Provider value={host}>
      <RouterProvider navigate={(href, options) => host.go(href, options?.replace ? { swap: true } : undefined)}>{children}</RouterProvider>
    </HostSlot.Provider>
  )
}

/** The installed host, or null. */
export function useRouteHost(): RouteHost | null {
  return useContext(HostSlot)
}

function useRoutes(): Routes {
  const host = useContext(HostSlot)
  return useMemo(() => (host ? new HostRoutes(host) : browser), [host])
}

export const useRouting = (): RouteMoves => useRoutes().moves
export const useCurrentPath = (): string => useRoutes().path
export const useRouteAnchor = (): AnchorComponent => useRoutes().Anchor
/** Changes on every visit: the host's visit key, else the path. */
export const useVisitKey = (): string => useRoutes().visit
