import { ChevronDown, LogOut, Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, UserRound, X } from 'lucide-react'
import { useId, useState, type MouseEvent, type ReactNode } from 'react'
import {
  Button as AriaButton,
  Dialog,
  Header,
  Link as AriaLink,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Modal,
  ModalOverlay,
  Popover,
  Tooltip,
  TooltipTrigger,
  type Key,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { breakpoints, useMediaQuery } from '../../internal/media'
import { browserPath } from '../../internal/overlays-nav/state'
import { useMessages } from '../../internal/provider'
import { ActionMenu } from '../action-menu/ActionMenu'
import { AppLauncherGrid } from '../app-launcher-grid/AppLauncherGrid'
import { Avatar } from '../avatar/Avatar'
import { Button } from '../button/Button'
import { NavigationFlyout } from '../navigation-flyout/NavigationFlyout'
import { activeEntryId, buildFlyoutDestinations, buildLauncherTiles, filterByPermission, type NavEntry } from './builders'

export * from './builders'

export type AppNavigationLayout = 'sidebar' | 'rail' | 'topbar' | 'floating'
type Copy = ReturnType<typeof useMessages>['appNavigation']

export interface AppNavigationAccount {
  name?: string
  initial?: string
  pictureUrl?: string
  onProfile: () => void
  onSignOut: () => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  locale?: string
  /** Choices for the language section (value is a BCP 47 tag). */
  locales?: Array<{ value: string; label: string }>
  onLocaleChange?: (locale: string) => void
}

export interface AppNavigationProps {
  entries: NavEntry[]
  layout?: AppNavigationLayout
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  pathname?: string
  /** Hands navigation to the host; without it links use the router adapter. */
  onNavigate?: (href: string) => void
  onPrefetch?: (href: string) => void
  /** Granted permissions; `undefined` grants all. */
  permissions?: string[]
  brand?: ReactNode
  scopeSwitcher?: ReactNode
  footer?: ReactNode
  account?: AppNavigationAccount
  flyout?: { open: boolean; onOpenChange: (open: boolean) => void }
  launcher?: boolean
  /** Screen title of the compact mobile bar. */
  title?: ReactNode
  labels?: Partial<Omit<Copy, 'pending' | 'submenu'>>
  className?: string
}

interface EntryContext {
  activeId?: string
  iconOnly: boolean
  copy: Copy
  onNavigate?: (href: string) => void
  onPrefetch?: (href: string) => void
  /** Called after an entry is chosen (closes the mobile drawer). */
  onChosen?: () => void
}

const plain = (e: MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && e.button === 0

function EntryRow({ entry, ctx }: { entry: NavEntry; ctx: EntryContext }) {
  const active = entry.id === ctx.activeId
  const pending = entry.count && entry.count > 0 ? entry.count : 0
  const name = pending ? ctx.copy.pending(entry.label, pending) : entry.label
  const warm = ctx.onPrefetch ? () => ctx.onPrefetch?.(entry.href) : undefined
  const face = (
    <>
      <span className="ty-app-nav__icon" aria-hidden="true">
        {entry.icon}
      </span>
      {ctx.iconOnly ? null : (
        <span className="ty-app-nav__label" aria-hidden={pending ? true : undefined}>
          {entry.label}
        </span>
      )}
      {pending && !ctx.iconOnly ? (
        <span className="ty-app-nav__count" aria-hidden="true">
          {pending}
        </span>
      ) : null}
    </>
  )
  const shared = {
    className: 'ty-app-nav__link',
    'aria-current': active ? ('page' as const) : undefined,
    'aria-label': ctx.iconOnly || pending ? name : undefined,
    'data-active': active || undefined,
  }
  let link: ReactNode
  if (entry.onPress || ctx.onNavigate) {
    const hand = (e: MouseEvent<HTMLAnchorElement>) => {
      if (!plain(e)) return
      e.preventDefault()
      if (entry.onPress) entry.onPress()
      else ctx.onNavigate?.(entry.href)
      ctx.onChosen?.()
    }
    link = (
      <a {...shared} href={entry.href} onClick={hand} onMouseEnter={warm} onFocus={warm}>
        {face}
      </a>
    )
  } else {
    link = (
      <AriaLink {...shared} href={entry.href} onPress={ctx.onChosen} onHoverStart={warm} onFocus={warm}>
        {face}
      </AriaLink>
    )
  }
  if (ctx.iconOnly) {
    link = (
      <TooltipTrigger delay={300}>
        {link}
        <Tooltip className="ty-app-nav__tip" placement="end" offset={8}>
          {name}
        </Tooltip>
      </TooltipTrigger>
    )
  }
  return (
    <li className="ty-app-nav__row">
      {link}
      {entry.menu?.length && !ctx.iconOnly ? (
        <ActionMenu
          label={ctx.copy.submenu(entry.label)}
          items={entry.menu.map((m) => ({ id: m.id, label: m.label, href: m.href }))}
          onAction={(id) => entry.menu?.find((m) => m.id === id)?.onPress?.()}
          trigger={<Button variant="quiet" size="compact" iconOnly accessibleLabel={ctx.copy.submenu(entry.label)} leadingIcon={<ChevronDown />} />}
        />
      ) : null}
    </li>
  )
}

/** Entries in their groups; group names label the lists (not interactive). */
function EntryGroups({ entries, ctx }: { entries: NavEntry[]; ctx: EntryContext }) {
  const baseId = useId()
  const order: Array<string | undefined> = []
  for (const e of entries) if (!order.includes(e.group)) order.push(e.group)
  return (
    <>
      {order.map((group, i) => {
        const labelId = `${baseId}-g${i}`
        return (
          <div key={group ?? `ungrouped-${i}`} className="ty-app-nav__group">
            {group ? (
              <p id={labelId} className="ty-app-nav__group-name" data-hidden={ctx.iconOnly || undefined}>
                {group}
              </p>
            ) : null}
            <ul className="ty-app-nav__list" aria-labelledby={group ? labelId : undefined}>
              {entries
                .filter((e) => e.group === group)
                .map((e) => (
                  <EntryRow key={e.id} entry={e} ctx={ctx} />
                ))}
            </ul>
          </div>
        )
      })}
    </>
  )
}

function AccountMenu({ account, copy, iconOnly }: { account: AppNavigationAccount; copy: Copy; iconOnly?: boolean }) {
  const letter = account.initial ?? account.name?.trim().charAt(0).toLocaleUpperCase() ?? ''
  const pick = (key: Key) => {
    if (key === 'profile') account.onProfile()
    else if (key === 'sign-out') account.onSignOut()
  }
  return (
    <MenuTrigger>
      <AriaButton className="ty-app-nav__account" aria-label={account.name ? `${copy.account}: ${account.name}` : copy.account}>
        {letter || account.pictureUrl ? <Avatar src={account.pictureUrl} fallbackText={letter} size="small" decorative /> : <UserRound aria-hidden="true" />}
        {iconOnly || !account.name ? null : (
          <span className="ty-app-nav__account-name" aria-hidden="true">
            {account.name}
          </span>
        )}
      </AriaButton>
      <Popover className="ty-app-nav__menu-popover" placement="top start" offset={8}>
        <Menu className="ty-app-nav__menu" aria-label={copy.account} onAction={pick}>
          <MenuItem id="profile" className="ty-app-nav__menu-item" textValue={copy.profile}>
            <UserRound aria-hidden="true" className="ty-app-nav__menu-icon" />
            {copy.profile}
          </MenuItem>
          <MenuSection
            className="ty-app-nav__menu-section"
            selectionMode="single"
            selectedKeys={[account.theme]}
            onSelectionChange={(keys) => {
              const next = [...(keys as Set<Key>)][0]
              if (next === 'light' || next === 'dark') account.onThemeChange(next)
            }}
          >
            <Header className="ty-app-nav__menu-heading">{copy.theme}</Header>
            <MenuItem id="light" className="ty-app-nav__menu-item" textValue={copy.themeLight}>
              <span className="ty-app-nav__radio" aria-hidden="true" />
              {copy.themeLight}
            </MenuItem>
            <MenuItem id="dark" className="ty-app-nav__menu-item" textValue={copy.themeDark}>
              <span className="ty-app-nav__radio" aria-hidden="true" />
              {copy.themeDark}
            </MenuItem>
          </MenuSection>
          {account.locales?.length ? (
            <MenuSection
              className="ty-app-nav__menu-section"
              selectionMode="single"
              selectedKeys={account.locale ? [account.locale] : []}
              onSelectionChange={(keys) => {
                const next = [...(keys as Set<Key>)][0]
                if (next !== undefined) account.onLocaleChange?.(String(next))
              }}
            >
              <Header className="ty-app-nav__menu-heading">{copy.language}</Header>
              {account.locales.map((l) => (
                <MenuItem key={l.value} id={l.value} className="ty-app-nav__menu-item" textValue={l.label}>
                  <span className="ty-app-nav__radio" aria-hidden="true" />
                  <span lang={l.value}>{l.label}</span>
                </MenuItem>
              ))}
            </MenuSection>
          ) : null}
          <MenuItem id="sign-out" className="ty-app-nav__menu-item" data-tone="danger" textValue={copy.signOut}>
            <LogOut aria-hidden="true" className="ty-app-nav__menu-icon" />
            {copy.signOut}
          </MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}

/**
 * Primary navigation from one list of entries, in the presentation the shell
 * needs (spec: wave-2/app-navigation.md).
 */
export function AppNavigation(props: AppNavigationProps) {
  const base = useMessages().appNavigation
  const copy: Copy = { ...base, ...props.labels }
  const desktop = useMediaQuery(`(min-width: ${breakpoints.lg}px)`, true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navId = useId()
  const layout = props.layout ?? 'sidebar'
  const entries = filterByPermission(props.entries, props.permissions)
  const activeId = activeEntryId(entries, props.pathname ?? browserPath())
  const sideLike = layout === 'sidebar' || layout === 'rail'
  const collapsed = layout === 'rail' || (props.collapsed ?? false)
  const ctx: EntryContext = { activeId, iconOnly: false, copy, onNavigate: props.onNavigate, onPrefetch: props.onPrefetch }

  const extras = (
    <>
      {props.flyout ? (
        <NavigationFlyout
          open={props.flyout.open}
          onOpenChange={props.flyout.onOpenChange}
          destinations={buildFlyoutDestinations(entries)}
          currentPath={props.pathname}
          onNavigate={props.onNavigate}
        />
      ) : null}
      {props.launcher ? (
        <AppLauncherGrid pages={buildLauncherTiles(entries)} onOpen={props.onNavigate ? (t) => props.onNavigate?.(t.href) : undefined} onPrefetch={props.onPrefetch} />
      ) : null}
    </>
  )

  // Below 1024 the side presentations become a compact bar with a drawer.
  if (sideLike && !desktop) {
    return (
      <div className={cx('ty-app-nav', props.className)} data-layout="drawer">
        <div className="ty-app-nav__bar">
          <Button
            variant="quiet"
            iconOnly
            accessibleLabel={copy.openMenu}
            leadingIcon={<MenuIcon />}
            aria-expanded={drawerOpen}
            aria-controls={drawerOpen ? navId : undefined}
            onPress={() => setDrawerOpen(true)}
          />
          {props.title ? <span className="ty-app-nav__screen">{props.title}</span> : null}
          {props.account ? <AccountMenu account={props.account} copy={copy} iconOnly /> : null}
        </div>
        <ModalOverlay isOpen={drawerOpen} onOpenChange={setDrawerOpen} isDismissable className="ty-app-nav__scrim">
          <Modal className="ty-app-nav__drawer">
            <Dialog className="ty-app-nav__drawer-dialog" aria-label={copy.landmark}>
              <div className="ty-app-nav__drawer-head">
                {props.brand}
                <Button variant="quiet" iconOnly accessibleLabel={copy.closeMenu} leadingIcon={<X />} onPress={() => setDrawerOpen(false)} />
              </div>
              {props.scopeSwitcher}
              <nav id={navId} aria-label={copy.landmark} className="ty-app-nav__nav">
                <EntryGroups entries={entries} ctx={{ ...ctx, onChosen: () => setDrawerOpen(false) }} />
              </nav>
              {props.footer ? <div className="ty-app-nav__footer">{props.footer}</div> : null}
            </Dialog>
          </Modal>
        </ModalOverlay>
        {extras}
      </div>
    )
  }

  if (layout === 'topbar' || layout === 'floating') {
    const iconOnly = layout === 'floating'
    return (
      <div className={cx('ty-app-nav', props.className)} data-layout={layout}>
        {layout === 'topbar' && props.brand ? <div className="ty-app-nav__brand">{props.brand}</div> : null}
        <nav aria-label={copy.landmark} className="ty-app-nav__nav">
          <ul className="ty-app-nav__list">
            {entries.map((e) => (
              <EntryRow key={e.id} entry={e} ctx={{ ...ctx, iconOnly }} />
            ))}
          </ul>
        </nav>
        {props.account ? <AccountMenu account={props.account} copy={copy} iconOnly={iconOnly} /> : null}
        {extras}
      </div>
    )
  }

  return (
    <div className={cx('ty-app-nav', props.className)} data-layout="sidebar" data-collapsed={collapsed || undefined}>
      {props.brand ? <div className="ty-app-nav__brand">{props.brand}</div> : null}
      {props.scopeSwitcher && !collapsed ? <div className="ty-app-nav__scope">{props.scopeSwitcher}</div> : null}
      <nav id={navId} aria-label={copy.landmark} className="ty-app-nav__nav">
        <EntryGroups entries={entries} ctx={{ ...ctx, iconOnly: collapsed }} />
      </nav>
      {props.footer && !collapsed ? <div className="ty-app-nav__footer">{props.footer}</div> : null}
      <div className="ty-app-nav__end">
        {props.account ? <AccountMenu account={props.account} copy={copy} iconOnly={collapsed} /> : null}
        {props.onCollapsedChange && layout === 'sidebar' ? (
          <Button
            variant="quiet"
            iconOnly
            accessibleLabel={collapsed ? copy.expand : copy.collapse}
            leadingIcon={collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            aria-expanded={!collapsed}
            aria-controls={navId}
            onPress={() => props.onCollapsedChange?.(!collapsed)}
          />
        ) : null}
      </div>
      {extras}
    </div>
  )
}
