import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { createContext, Suspense, useContext, useId, type ReactNode } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { breakpoints, useMinWidth } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { PageLoadingState } from '../skeleton/Skeleton'
import { SkipLink } from '../skip-link/SkipLink'

export type AppFrameWidth = 'reading' | 'data' | 'full'

interface FrameState {
  /** True when the navigation shows as the icon rail. */
  navCollapsed: boolean
  /** Where the navigation currently renders. */
  navPlacement: 'column' | 'drawer'
}

const FrameContext = createContext<FrameState>({ navCollapsed: false, navPlacement: 'column' })

/** Navigation state for items rendered inside the frame (rail labels, tooltips). */
export function useAppFrame(): FrameState {
  return useContext(FrameContext)
}

/**
 * Label of a navigation item. In the collapsed rail it is visually hidden but
 * stays the item's accessible name (and the host may add a tooltip).
 */
export function FrameNavLabel({ children }: { children: ReactNode }) {
  const { navCollapsed, navPlacement } = useAppFrame()
  return <span className={navCollapsed && navPlacement === 'column' ? 'fk-visually-hidden' : 'fk-app-frame__nav-label'}>{children}</span>
}

export interface AppFrameProps {
  navigation: ReactNode
  topBar?: ReactNode
  children: ReactNode
  width?: AppFrameWidth
  aside?: ReactNode
  /** Accessible name of the aside (its title). */
  asideLabel?: string
  asideOpen?: boolean
  onAsideOpenChange?: (open: boolean) => void
  navCollapsed?: boolean
  onNavCollapsedChange?: (collapsed: boolean) => void
  navOpen?: boolean
  onNavOpenChange?: (open: boolean) => void
  /** Text of the route-loading fallback. */
  loadingLabel?: string
  /** Slot for the route progress indicator (RouteProgress, wave 2). */
  progress?: ReactNode
  sessionGuard?: ReactNode
  initializers?: ReactNode
  overlays?: ReactNode
  /** Calm two-orb ambient backdrop behind the glass (§2.5). */
  ambient?: boolean
  mainId?: string
  /** Mark the main region busy (e.g. while a route loads outside Suspense). */
  busy?: boolean
  className?: string
}

/** Outer frame of every authenticated screen (spec: wave-1/app-frame.md). */
export function AppFrame({
  navigation,
  topBar,
  children,
  width = 'reading',
  aside,
  asideLabel,
  asideOpen = false,
  onAsideOpenChange,
  navCollapsed = false,
  onNavCollapsedChange,
  navOpen = false,
  onNavOpenChange,
  loadingLabel,
  progress,
  sessionGuard,
  initializers,
  overlays,
  ambient = false,
  mainId = 'main-content',
  busy = false,
  className,
}: AppFrameProps) {
  const m = useMessages()
  const desktop = useMinWidth(breakpoints.lg)
  const wide = useMinWidth(breakpoints.xl)
  const navId = useId()
  const asideTitleId = useId()
  const label = loadingLabel ?? m.frame.loadingPage
  const collapsed = desktop && navCollapsed
  const state: FrameState = { navCollapsed: collapsed, navPlacement: desktop ? 'column' : 'drawer' }

  const asidePlacement = !aside || !asideOpen ? 'closed' : wide ? 'column' : desktop ? 'overlay' : 'sheet'
  const closeAside = () => onAsideOpenChange?.(false)

  const navLandmark = (
    <nav id={navId} className="fk-app-frame__nav" aria-label={m.frame.navigation}>
      {navigation}
    </nav>
  )

  return (
    <FrameContext.Provider value={state}>
      {sessionGuard}
      {initializers}
      <div
        className={cx('fk-app-frame', className)}
        data-nav={desktop ? (collapsed ? 'rail' : 'column') : 'drawer'}
        data-aside={asidePlacement}
        data-width={width}
      >
        <SkipLink targetId={mainId} />
        {ambient ? (
          <div className="fk-app-frame__ambient" aria-hidden="true">
            <span className="fk-app-frame__orb fk-app-frame__orb--top" />
            <span className="fk-app-frame__orb fk-app-frame__orb--bottom" />
          </div>
        ) : null}
        {progress ? <div className="fk-app-frame__progress">{progress}</div> : null}

        {/* Desktop: the navigation column comes first, matching the visual order (left column, then top bar). */}
        {desktop ? (
          <div className="fk-app-frame__side">
            {navLandmark}
            {onNavCollapsedChange ? (
              <div className="fk-app-frame__side-footer">
                <Button
                  variant="quiet"
                  iconOnly
                  accessibleLabel={collapsed ? m.frame.expandNavigation : m.frame.collapseNavigation}
                  leadingIcon={collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                  onPress={() => onNavCollapsedChange(!collapsed)}
                  aria-expanded={!collapsed}
                  aria-controls={navId}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <header className="fk-app-frame__top">
          {!desktop ? (
            <Button
              variant="quiet"
              iconOnly
              accessibleLabel={m.frame.openNavigation}
              leadingIcon={<Menu />}
              onPress={() => onNavOpenChange?.(true)}
              aria-expanded={navOpen}
              aria-controls={navOpen ? navId : undefined}
              className="fk-app-frame__menu-button"
            />
          ) : null}
          <div className="fk-app-frame__top-content">{topBar}</div>
        </header>

        {!desktop ? (
          <ModalOverlay
            className="fk-app-frame__overlay"
            isOpen={navOpen}
            onOpenChange={(open) => onNavOpenChange?.(open)}
            isDismissable
          >
            <Modal className="fk-app-frame__drawer" data-placement="start">
              <Dialog className="fk-app-frame__drawer-dialog" aria-label={m.frame.navigation}>
                <div className="fk-app-frame__drawer-head">
                  <Button
                    variant="quiet"
                    iconOnly
                    accessibleLabel={m.frame.closeNavigation}
                    leadingIcon={<X />}
                    onPress={() => onNavOpenChange?.(false)}
                  />
                </div>
                {navLandmark}
              </Dialog>
            </Modal>
          </ModalOverlay>
        ) : null}

        <main id={mainId} tabIndex={-1} className="fk-app-frame__main" aria-busy={busy || undefined}>
          <div className="fk-app-frame__content">
            <Suspense fallback={<PageLoadingState label={label} />}>{children}</Suspense>
          </div>
        </main>

        {asidePlacement === 'column' ? (
          <aside className="fk-app-frame__aside" aria-label={asideLabel}>
            {aside}
          </aside>
        ) : null}
        {asidePlacement === 'overlay' || asidePlacement === 'sheet' ? (
          <ModalOverlay className="fk-app-frame__overlay" isOpen onOpenChange={(open) => !open && closeAside()} isDismissable>
            <Modal className="fk-app-frame__aside-modal" data-placement={asidePlacement === 'overlay' ? 'end' : 'bottom'}>
              <Dialog className="fk-app-frame__drawer-dialog" aria-labelledby={asideLabel ? asideTitleId : undefined}>
                <div className="fk-app-frame__drawer-head">
                  {asideLabel ? (
                    <Heading slot="title" id={asideTitleId} className="fk-app-frame__aside-title">
                      {asideLabel}
                    </Heading>
                  ) : null}
                  <Button variant="quiet" iconOnly accessibleLabel={m.frame.closePanel} leadingIcon={<X />} onPress={closeAside} />
                </div>
                <div className="fk-app-frame__aside-body">{aside}</div>
              </Dialog>
            </Modal>
          </ModalOverlay>
        ) : null}
      </div>
      {overlays}
    </FrameContext.Provider>
  )
}
