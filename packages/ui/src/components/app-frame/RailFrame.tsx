import { Menu as MenuGlyph, X } from 'lucide-react'
import { Suspense, useMemo, type ReactNode } from 'react'
import { Dialog, Modal, ModalOverlay } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { breakpoints, useMinWidth } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { PageLoadingState } from '../skeleton/Skeleton'
import { SkipLink } from '../skip-link/SkipLink'
import type { AppFrameProps } from './AppFrame'
import { FrameContext, type FrameState } from './frameContext'

/*
 * Research shell (spec: wave-4/app-frame-rail.md): rail on the start side, the
 * page on one glass sheet with its own scroll, the dock floating at the bottom
 * of the sheet. There is no top bar and so no banner landmark.
 */

type Region = 'rail' | 'stage' | 'aside'

/** Root property the dock publishes (FloatingActionBar); the sheet pads its end by it. */
export const RAIL_DOCK_INSET_PROPERTY = '--ty-action-bar-inset-bottom'

/** The rail's stacked parts, in visual and DOM order. */
function railParts(props: AppFrameProps, navigationLabel: string): Array<[string, ReactNode]> {
  return [
    ['brand', props.brand],
    ['context', props.context],
    [
      'nav',
      <nav key="nav" className="ty-app-frame__rail-nav" aria-label={navigationLabel}>
        {props.navigation}
      </nav>,
    ],
    ['account', props.account],
  ]
}

function RailColumn({ parts }: { parts: Array<[string, ReactNode]> }) {
  return (
    <div className="ty-app-frame__rail" data-region={'rail' satisfies Region}>
      {parts.map(([slot, node]) =>
        node == null || node === false ? null : slot === 'nav' ? (
          node
        ) : (
          <div key={slot} className="ty-app-frame__rail-slot" data-slot={slot}>
            {node}
          </div>
        ),
      )}
    </div>
  )
}

export function RailFrame(props: AppFrameProps) {
  const m = useMessages()
  const wide = useMinWidth(breakpoints.md)
  const mainId = props.mainId ?? 'main-content'
  const dockId = props.dockId ?? 'ty-action-bar'
  const setOpen = (open: boolean) => props.onNavOpenChange?.(open)
  const parts = railParts(props, m.rail.label)

  const state = useMemo<FrameState>(
    () => ({
      navCollapsed: false,
      navPlacement: wide ? 'column' : 'drawer',
      layout: 'rail',
      openNavigation: wide ? undefined : () => props.onNavOpenChange?.(true),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wide, props.onNavOpenChange],
  )

  const drawer = (
    <ModalOverlay className="ty-app-frame__overlay" isOpen={!!props.navOpen} onOpenChange={setOpen} isDismissable>
      <Modal className="ty-app-frame__drawer" data-placement="start">
        <Dialog className="ty-app-frame__drawer-dialog" aria-label={m.rail.label}>
          <div className="ty-app-frame__drawer-head">
            <Button variant="quiet" iconOnly accessibleLabel={m.rail.closeNavigation} leadingIcon={<X />} onPress={() => setOpen(false)} />
          </div>
          <RailColumn parts={parts} />
        </Dialog>
      </Modal>
    </ModalOverlay>
  )

  return (
    <FrameContext.Provider value={state}>
      {props.sessionGuard}
      {props.initializers}
      <div
        className={cx('ty-app-frame', props.className)}
        data-layout="rail"
        data-nav={wide ? 'column' : 'drawer'}
        data-width={props.width ?? 'reading'}
        data-dock={props.dock ? '' : undefined}
      >
        <SkipLink targetId={mainId} />
        {props.dock ? <SkipLink targetId={dockId} label={m.actionBar.skipTo} /> : null}
        {props.ambient ? (
          <div className="ty-app-frame__ambient" aria-hidden="true">
            <span className="ty-app-frame__orb ty-app-frame__orb--top" />
            <span className="ty-app-frame__orb ty-app-frame__orb--bottom" />
          </div>
        ) : null}
        {props.progress ? <div className="ty-app-frame__progress">{props.progress}</div> : null}

        {wide ? <RailColumn parts={parts} /> : drawer}

        <div className="ty-app-frame__stage" data-region={'stage' satisfies Region}>
          <main id={mainId} tabIndex={-1} className="ty-app-frame__sheet" aria-busy={props.busy || undefined}>
            <div className="ty-app-frame__content">
              <Suspense fallback={<PageLoadingState label={props.loadingLabel ?? m.frame.loadingPage} />}>{props.children}</Suspense>
            </div>
          </main>
          {props.dock}
          {!wide && !props.dock ? (
            <Button
              className="ty-app-frame__rail-opener"
              variant="secondary"
              shape="circle"
              iconOnly
              accessibleLabel={m.rail.openNavigation}
              leadingIcon={<MenuGlyph />}
              aria-expanded={!!props.navOpen}
              onPress={() => setOpen(true)}
            />
          ) : null}
        </div>

        {props.aside ? (
          <div className="ty-app-frame__aside-slot" data-region={'aside' satisfies Region}>
            {props.aside}
          </div>
        ) : null}
      </div>
      {props.overlays}
    </FrameContext.Provider>
  )
}
