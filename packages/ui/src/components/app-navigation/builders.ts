// Pure converters from one list of navigation entries to each presentation
// the shell needs: floating-bar actions, launcher tiles, flyout destinations,
// plus the permission filter every presentation applies first.
import type { ReactNode } from 'react'
import type { LauncherTile } from '../app-launcher-grid/AppLauncherGrid'
import type { FlyoutDestination } from '../navigation-flyout/NavigationFlyout'
import { bestMatch } from '../../internal/overlays-nav/state'

export interface NavMenuEntry {
  id: string
  label: string
  href?: string
  onPress?: () => void
}

export interface NavEntry {
  id: string
  label: string
  href: string
  icon: ReactNode
  description?: string
  /** Group heading (for example a research stage). */
  group?: string
  /** Pending items for this person; shown only when > 0. */
  count?: number
  /** Entry is shown only when this permission is granted. */
  permission?: string
  menu?: NavMenuEntry[]
  onPress?: () => void
}

/**
 * Generic action item consumed by bar-like presentations (the shell's dock,
 * a mobile tab bar): plain data, no rendering decisions.
 */
export interface NavAction {
  id: string
  label: string
  icon?: ReactNode
  href?: string
  onPress?: () => void
  group?: string
  permission?: string
  /** Pending count for a badge. */
  badge?: number
  /** True for the entry matching the current location. */
  active?: boolean
}

/** Keeps entries without a permission and those whose permission is granted. `undefined` grants all. */
export function filterByPermission<T extends { permission?: string }>(items: readonly T[], permissions?: readonly string[]): T[] {
  if (permissions === undefined) return [...items]
  const granted = new Set(permissions)
  return items.filter((item) => item.permission === undefined || granted.has(item.permission))
}

/** The id of the entry that holds `pathname` (longest matching href wins). */
export function activeEntryId(entries: readonly NavEntry[], pathname: string | undefined): string | undefined {
  const href = bestMatch(pathname, entries.map((e) => e.href))
  return href === undefined ? undefined : entries.find((e) => e.href === href)?.id
}

export interface FloatingActionOptions {
  pathname?: string
  permissions?: readonly string[]
  /** Leading home action. */
  home?: { label: string; href: string; icon?: ReactNode }
  /** Trailing account action. */
  account?: { label: string; icon?: ReactNode; onPress: () => void }
}

export function buildFloatingActions(entries: readonly NavEntry[], options: FloatingActionOptions = {}): NavAction[] {
  const visible = filterByPermission(entries, options.permissions)
  const hrefs = [...visible.map((e) => e.href), ...(options.home ? [options.home.href] : [])]
  const current = bestMatch(options.pathname, hrefs)
  const out: NavAction[] = []
  if (options.home) out.push({ id: 'home', label: options.home.label, icon: options.home.icon, href: options.home.href, active: current === options.home.href })
  for (const e of visible) {
    out.push({
      id: e.id,
      label: e.label,
      icon: e.icon,
      href: e.href,
      onPress: e.onPress,
      group: e.group,
      permission: e.permission,
      badge: e.count && e.count > 0 ? e.count : undefined,
      active: current === e.href,
    })
  }
  if (options.account) out.push({ id: 'account', label: options.account.label, icon: options.account.icon, onPress: options.account.onPress, group: 'account' })
  return out
}

export function buildLauncherTiles(entries: readonly NavEntry[], permissions?: readonly string[]): LauncherTile[] {
  return filterByPermission(entries, permissions).map((e) => ({
    id: e.id,
    label: e.label,
    href: e.href,
    icon: e.icon,
    description: e.description,
    count: e.count,
    onPress: e.onPress,
    shortcuts: e.menu?.map((s) => ({ label: s.label, href: s.href, onPress: s.onPress })),
  }))
}

export function buildFlyoutDestinations(entries: readonly NavEntry[], permissions?: readonly string[]): FlyoutDestination[] {
  return filterByPermission(entries, permissions).map((e) => ({
    id: e.id,
    label: e.label,
    subtitle: e.description,
    href: e.href,
    icon: e.icon,
    onPress: e.onPress,
  }))
}
