import { Ellipsis } from 'lucide-react'
import { useState, type MouseEvent, type ReactNode } from 'react'
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMenuRequest } from '../../internal/overlays-nav/hold'
import { cappedCount } from '../../internal/overlays-nav/state'
import { useMessages } from '../../internal/provider'
import { ActionMenu } from '../action-menu/ActionMenu'
import { Avatar } from '../avatar/Avatar'
import { Button } from '../button/Button'
import { Separator } from '../separator/Separator'

export interface LauncherShortcut {
  label: string
  href?: string
  onPress?: () => void
  icon?: ReactNode
}

export interface LauncherTile {
  id: string
  label: string
  href: string
  icon: ReactNode
  description?: string
  count?: number
  alertCount?: number
  shortcuts?: LauncherShortcut[]
  onPress?: () => void
}

export interface LauncherPerson {
  name?: string
  email?: string
  pictureUrl?: string
  roleLabel?: string
}

export interface AppLauncherGridProps {
  pages: LauncherTile[]
  actions?: LauncherTile[]
  /** Preferred order of page ids; unknown ids go last. */
  order?: string[]
  actionsLabel?: string
  /** Data for the tile whose id is `profile`. */
  person?: LauncherPerson
  /** False shows a neutral placeholder in the profile tile. */
  ready?: boolean
  onOpen?: (tile: LauncherTile) => void
  onPrefetch?: (href: string) => void
  className?: string
}

/** Stable sort by the position of each id in `order`; unlisted ids keep their order after. */
export function orderTiles(tiles: LauncherTile[], order?: string[]): LauncherTile[] {
  if (!order?.length) return tiles
  const rank = new Map(order.map((id, i) => [id, i]))
  return tiles
    .map((tile, i) => ({ tile, key: rank.get(tile.id) ?? order.length + i }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.tile)
}

const withModifier = (e: MouseEvent) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0

interface TileViewProps {
  tile: LauncherTile
  kind: 'page' | 'action'
  person?: LauncherPerson
  ready: boolean
  onOpen?: (tile: LauncherTile) => void
  onPrefetch?: (href: string) => void
}

function TileFace({ tile, person, ready }: Pick<TileViewProps, 'tile' | 'person' | 'ready'>) {
  const m = useMessages().appLauncher
  if (tile.id === 'profile' && person !== undefined) {
    if (!ready) {
      return (
        <span className="fk-launcher__face" data-placeholder="true">
          <span className="fk-launcher__icon fk-launcher__icon--ghost" aria-hidden="true" />
          <span className="fk-visually-hidden">{m.profileLoading}</span>
        </span>
      )
    }
    const initial = (person.name ?? person.email ?? '?').trim().charAt(0).toLocaleUpperCase()
    return (
      <span className="fk-launcher__face">
        <Avatar src={person.pictureUrl} fallbackText={initial} decorative size="large" />
        {person.roleLabel ? <span className="fk-launcher__role">{person.roleLabel}</span> : null}
      </span>
    )
  }
  return (
    <span className="fk-launcher__icon" aria-hidden="true">
      {tile.icon}
    </span>
  )
}

function Tile(props: TileViewProps) {
  const m = useMessages().appLauncher
  const { tile } = props
  const [menuOpen, setMenuOpen] = useState(false)
  const shortcuts = tile.shortcuts ?? []
  const request = useMenuRequest(() => shortcuts.length && setMenuOpen(true), { touchOnly: true })
  let name = tile.label
  if (tile.count) name = m.withCount(name, tile.count)
  if (tile.alertCount) name = m.withAlerts(name, tile.alertCount)

  const body = (
    <>
      <TileFace tile={tile} person={props.person} ready={props.ready} />
      <span className="fk-launcher__text" aria-hidden="true">
        <span className="fk-launcher__name">{tile.label}</span>
        {tile.description ? <span className="fk-launcher__description">{tile.description}</span> : null}
      </span>
      {tile.count || tile.alertCount ? (
        <span className="fk-launcher__badge" data-alert={tile.alertCount ? true : undefined} aria-hidden="true">
          {cappedCount((tile.alertCount || tile.count) ?? 0)}
        </span>
      ) : null}
    </>
  )

  const hover = props.onPrefetch ? () => props.onPrefetch?.(tile.href) : undefined
  let control: ReactNode
  if (props.kind === 'action') {
    control = (
      <AriaButton className="fk-launcher__tile" aria-label={name} onPress={() => (tile.onPress ? tile.onPress() : props.onOpen?.(tile))} onHoverStart={hover} onFocus={hover}>
        {body}
      </AriaButton>
    )
  } else if (tile.onPress || props.onOpen) {
    // Host-decided opening: a real link (new tab still works) whose plain click is handed over.
    const hand = (e: MouseEvent<HTMLAnchorElement>) => {
      if (withModifier(e) || request.consumed()) return
      e.preventDefault()
      if (tile.onPress) tile.onPress()
      else props.onOpen?.(tile)
    }
    control = (
      <a className="fk-launcher__tile" href={tile.href} aria-label={name} onClick={hand} onMouseEnter={hover} onFocus={hover}>
        {body}
      </a>
    )
  } else {
    control = (
      <AriaLink className="fk-launcher__tile" href={tile.href} aria-label={name} onHoverStart={hover} onFocus={hover}>
        {body}
      </AriaLink>
    )
  }

  return (
    <li className="fk-launcher__cell" {...(shortcuts.length ? request.props : {})}>
      {control}
      {shortcuts.length ? (
        <div className="fk-launcher__more">
          <ActionMenu
            label={m.shortcuts(tile.label)}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            items={shortcuts.map((s, i) => ({ id: String(i), label: s.label, href: s.href }))}
            onAction={(id) => shortcuts[Number(id)]?.onPress?.()}
            trigger={<Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={m.more(tile.label)} leadingIcon={<Ellipsis />} />}
          />
        </div>
      ) : null}
    </li>
  )
}

/** Home-screen grid of areas and account actions (spec: wave-2/app-launcher-grid.md). */
export function AppLauncherGrid(props: AppLauncherGridProps) {
  const m = useMessages().appLauncher
  const ready = props.ready ?? true
  const pages = orderTiles(props.pages, props.order)
  const actions = props.actions ?? []
  const shared = { person: props.person, ready, onOpen: props.onOpen, onPrefetch: props.onPrefetch }
  return (
    <div className={cx('fk-launcher', props.className)}>
      <ul className="fk-launcher__grid">
        {pages.map((t) => (
          <Tile key={t.id} tile={t} kind="page" {...shared} />
        ))}
      </ul>
      {actions.length ? (
        <>
          <Separator caption={props.actionsLabel ?? m.actions} />
          <ul className="fk-launcher__grid" data-group="actions">
            {actions.map((t) => (
              <Tile key={t.id} tile={t} kind="action" {...shared} />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
