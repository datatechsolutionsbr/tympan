import { Bell, LogOut, UserRound } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Dialog, Heading, Link as AriaLink, Modal, ModalOverlay } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { bestMatch, browserPath, cappedCount } from '../../internal/overlays-nav/state'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { Switch } from '../switch/Switch'
import { TextField } from '../text-field/TextField'

export interface FlyoutDestination {
  id: string
  label: string
  subtitle?: string
  href: string
  icon: ReactNode
  onPress?: () => void
}

export interface FlyoutQuickActions {
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  onNotifications?: () => void
  unseenCount?: number
  onProfile: () => void
  personName?: string
  personInitial?: string
  onSignOut: () => void
}

export interface NavigationFlyoutLabels {
  search?: string
  noResults?: string
  notifications?: string
  theme?: string
  profile?: string
  signOut?: string
}

export interface NavigationFlyoutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  destinations: FlyoutDestination[]
  currentPath?: string
  onNavigate?: (href: string) => void
  searchable?: boolean
  quickActions?: FlyoutQuickActions
  labels?: NavigationFlyoutLabels
  className?: string
}

/** Case- and accent-insensitive containment on label or subtitle. */
export function filterDestinations(list: FlyoutDestination[], query: string): FlyoutDestination[] {
  const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()
  const q = fold(query.trim())
  if (!q) return list
  return list.filter((d) => fold(d.label).includes(q) || (d.subtitle !== undefined && fold(d.subtitle).includes(q)))
}

const plainClick = (e: MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && e.button === 0

/** "All destinations" panel dropped from the top bar (spec: wave-2/navigation-flyout.md). */
export function NavigationFlyout(props: NavigationFlyoutProps) {
  const copy = useMessages().navigationFlyout
  const t = { ...copy, ...props.labels }
  const titleId = useId()
  const [query, setQuery] = useState('')
  const searchable = props.searchable ?? true
  const shown = useMemo(() => filterDestinations(props.destinations, query), [props.destinations, query])
  const here = props.currentPath ?? browserPath()
  const currentHref = bestMatch(here, props.destinations.map((d) => d.href))
  const currentRef = useRef<HTMLAnchorElement | null>(null)
  const close = () => props.onOpenChange(false)

  useEffect(() => {
    if (!props.open) {
      setQuery('')
      return
    }
    if (searchable) return
    const frame = requestAnimationFrame(() => currentRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [props.open, searchable])

  /** Close first, then act (the spec's order for every choice). */
  const thenClose = (act: () => void) => () => {
    close()
    act()
  }

  const tile = (d: FlyoutDestination) => {
    const current = d.href === currentHref
    const inner = (
      <>
        <span className="fk-flyout__tile-icon" aria-hidden="true">
          {d.icon}
        </span>
        <span className="fk-flyout__tile-text">
          <span className="fk-flyout__tile-label">{d.label}</span>
          {d.subtitle ? <span className="fk-flyout__tile-sub">{d.subtitle}</span> : null}
        </span>
      </>
    )
    const common = {
      className: 'fk-flyout__tile',
      'aria-current': current ? ('page' as const) : undefined,
      'data-current': current || undefined,
      ref: current ? currentRef : undefined,
    }
    if (d.onPress || props.onNavigate) {
      const hand = (e: MouseEvent<HTMLAnchorElement>) => {
        if (!plainClick(e)) return
        e.preventDefault()
        close()
        if (d.onPress) d.onPress()
        else props.onNavigate?.(d.href)
      }
      return (
        <a {...common} href={d.href} onClick={hand}>
          {inner}
        </a>
      )
    }
    return (
      <AriaLink {...common} href={d.href} onPress={close}>
        {inner}
      </AriaLink>
    )
  }

  const qa = props.quickActions
  return (
    <ModalOverlay isOpen={props.open} onOpenChange={props.onOpenChange} isDismissable className="fk-flyout__backdrop">
      <Modal className={cx('fk-flyout', props.className)}>
        <Dialog className="fk-flyout__dialog" aria-labelledby={props.title ? titleId : undefined} aria-label={props.title ? undefined : copy.title}>
          {props.title ? (
            <Heading slot="title" id={titleId} level={2} className="fk-flyout__title">
              {props.title}
            </Heading>
          ) : null}
          {searchable ? (
            <div className="fk-flyout__search">
              <TextField mode="search" accessibleLabel={t.search} placeholder={t.search} value={query} onChange={setQuery} autoFocus />
              <span role="status" className="fk-visually-hidden">
                {query.trim() ? copy.count(shown.length) : ''}
              </span>
            </div>
          ) : null}
          <nav aria-label={copy.destinations} className="fk-flyout__nav">
            {shown.length ? (
              <ul className="fk-flyout__grid">
                {shown.map((d) => (
                  <li key={d.id}>{tile(d)}</li>
                ))}
              </ul>
            ) : (
              <p className="fk-flyout__empty">{t.noResults}</p>
            )}
          </nav>
          {qa ? (
            <div className="fk-flyout__quick">
              {qa.onNotifications ? (
                <Button
                  variant="quiet"
                  leadingIcon={<Bell />}
                  onPress={thenClose(qa.onNotifications)}
                  accessibleLabel={qa.unseenCount ? `${t.notifications}, ${copy.unseen(qa.unseenCount)}` : undefined}
                >
                  {t.notifications}
                  {qa.unseenCount ? (
                    <span className="fk-flyout__count" aria-hidden="true">
                      {cappedCount(qa.unseenCount)}
                    </span>
                  ) : null}
                </Button>
              ) : null}
              <Switch label={t.theme ?? copy.darkTheme} isSelected={qa.theme === 'dark'} onChange={(dark) => qa.onThemeChange(dark ? 'dark' : 'light')} />
              <Button
                variant="quiet"
                leadingIcon={qa.personInitial ? <span className="fk-flyout__initial">{qa.personInitial}</span> : <UserRound />}
                onPress={thenClose(qa.onProfile)}
              >
                {qa.personName ?? t.profile}
              </Button>
              <Button variant="danger" leadingIcon={<LogOut />} onPress={thenClose(qa.onSignOut)}>
                {t.signOut}
              </Button>
            </div>
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
