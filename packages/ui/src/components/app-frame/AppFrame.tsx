import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { Suspense, useId, type ReactNode } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { breakpoints, useMinWidth } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { PageLoadingState } from '../skeleton/Skeleton'
import { SkipLink } from '../skip-link/SkipLink'
import { FrameContext, useAppFrame, type AppFrameLayout, type FrameState } from './frameContext'
import { RailFrame } from './RailFrame'

export { useAppFrame, type AppFrameLayout, type FrameState } from './frameContext'

export type AppFrameWidth = 'reading' | 'data' | 'full'

/**
 * Label of a navigation item. In the collapsed rail it is visually hidden but
 * stays the item's accessible name (and the host may add a tooltip).
 */
export function FrameNavLabel({ children }: { children: ReactNode }) {
  const { navCollapsed, navPlacement } = useAppFrame()
  return <span className={navCollapsed && navPlacement === 'column' ? 'ty-visually-hidden' : 'ty-app-frame__nav-label'}>{children}</span>
}

export interface AppFrameProps {
  /**
   * `rail` (the research shell: rail, glass sheet, bottom dock, no top bar) or
   * `topbar` (wave 1). Defaults to `topbar` when a `topBar` is given, else `rail`.
   */
  layout?: AppFrameLayout
  /** Rail layout: brand at the top of the rail. */
  brand?: ReactNode
  /** Rail layout: context switcher (organization → project). */
  context?: ReactNode
  /** Rail layout: account slot at the bottom of the rail. */
  account?: ReactNode
  /** Rail layout: the action dock (a FloatingActionBar with `anchor="container"`). */
  dock?: ReactNode
  /** Rail layout: id of the dock landmark, for the second skip link. */
  dockId?: string
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

/**
 * Outer frame of every authenticated screen (specs: wave-1/app-frame.md and
 * wave-4/app-frame-rail.md). Chooses the layout, then renders it.
 */
export function AppFrame(props: AppFrameProps) {
  const layout = props.layout ?? (props.topBar !== undefined ? 'topbar' : 'rail')
  return layout === 'rail' ? <RailFrame {...props} /> : <TopBarFrame {...props} />
}

function TopBarFrame({
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
  const state: FrameState = { navCollapsed: collapsed, navPlacement: desktop ? 'column' : 'drawer', layout: 'topbar' }

  const asidePlacement = !aside || !asideOpen ? 'closed' : wide ? 'column' : desktop ? 'overlay' : 'sheet'
  const closeAside = () => onAsideOpenChange?.(false)

  const navLandmark = (
    <nav id={navId} className="ty-app-frame__nav" aria-label={m.frame.navigation}>
      {navigation}
    </nav>
  )

  return (
    <FrameContext.Provider value={state}>
      {sessionGuard}
      {initializers}
      <div
        className={cx('ty-app-frame', className)}
        data-nav={desktop ? (collapsed ? 'rail' : 'column') : 'drawer'}
        data-aside={asidePlacement}
        data-width={width}
      >
        <SkipLink targetId={mainId} />
        {ambient ? (
          <div className="ty-app-frame__ambient" aria-hidden="true">
            <span className="ty-app-frame__orb ty-app-frame__orb--top" />
            <span className="ty-app-frame__orb ty-app-frame__orb--bottom" />
          </div>
        ) : null}
        {progress ? <div className="ty-app-frame__progress">{progress}</div> : null}

        {/* Desktop: the navigation column comes first, matching the visual order (left column, then top bar). */}
        {desktop ? (
          <div className="ty-app-frame__side">
            {navLandmark}
            {onNavCollapsedChange ? (
              <div className="ty-app-frame__side-footer">
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

        <header className="ty-app-frame__top">
          {!desktop ? (
            <Button
              variant="quiet"
              iconOnly
              accessibleLabel={m.frame.openNavigation}
              leadingIcon={<Menu />}
              onPress={() => onNavOpenChange?.(true)}
              aria-expanded={navOpen}
              aria-controls={navOpen ? navId : undefined}
              className="ty-app-frame__menu-button"
            />
          ) : null}
          <div className="ty-app-frame__top-content">{topBar}</div>
        </header>

        {!desktop ? (
          <ModalOverlay
            className="ty-app-frame__overlay"
            isOpen={navOpen}
            onOpenChange={(open) => onNavOpenChange?.(open)}
            isDismissable
          >
            <Modal className="ty-app-frame__drawer" data-placement="start">
              <Dialog className="ty-app-frame__drawer-dialog" aria-label={m.frame.navigation}>
                <div className="ty-app-frame__drawer-head">
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

        <main id={mainId} tabIndex={-1} className="ty-app-frame__main" aria-busy={busy || undefined}>
          <div className="ty-app-frame__content">
            <Suspense fallback={<PageLoadingState label={label} />}>{children}</Suspense>
          </div>
        </main>

        {asidePlacement === 'column' ? (
          <aside className="ty-app-frame__aside" aria-label={asideLabel}>
            {aside}
          </aside>
        ) : null}
        {asidePlacement === 'overlay' || asidePlacement === 'sheet' ? (
          <ModalOverlay className="ty-app-frame__overlay" isOpen onOpenChange={(open) => !open && closeAside()} isDismissable>
            <Modal className="ty-app-frame__aside-modal" data-placement={asidePlacement === 'overlay' ? 'end' : 'bottom'}>
              <Dialog className="ty-app-frame__drawer-dialog" aria-labelledby={asideLabel ? asideTitleId : undefined}>
                <div className="ty-app-frame__drawer-head">
                  {asideLabel ? (
                    <Heading slot="title" id={asideTitleId} className="ty-app-frame__aside-title">
                      {asideLabel}
                    </Heading>
                  ) : null}
                  <Button variant="quiet" iconOnly accessibleLabel={m.frame.closePanel} leadingIcon={<X />} onPress={closeAside} />
                </div>
                <div className="ty-app-frame__aside-body">{aside}</div>
              </Dialog>
            </Modal>
          </ModalOverlay>
        ) : null}
      </div>
      {overlays}
    </FrameContext.Provider>
  )
}
