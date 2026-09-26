import { ChevronDown, Ellipsis } from 'lucide-react'
import {
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { mergeProps, useButton, useLink, useLongPress } from 'react-aria'
import { Menu, MenuItem, Popover, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { inertProps } from '../../internal/inert'
import { breakpoints, useMinWidth, useReducedMotion } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import { useLocaleText } from '../../internal/speech'
import { useAppFrame } from '../app-frame/frameContext'
import { Button } from '../button/Button'
import { ModalDialog } from '../modal-dialog/ModalDialog'
import {
  ariaShortcut,
  chordMatches,
  effectiveEdge,
  isHorizontal,
  moveIndex,
  parseChord,
  planBar,
  slotsAlong,
  stepFor,
  TAB_BAR_SLOTS,
  type BarEdge,
  type BarKind,
  type Placed,
} from './barModel'

export type { BarEdge } from './barModel'

export interface ActionBarConfirm {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
}

export interface ActionBarMenuEntry {
  id: string
  label: string
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  href?: string
  tone?: 'neutral' | 'danger'
  /** Asks before `onMenuAction` runs (destructive entries). */
  confirm?: ActionBarConfirm
}

export interface ActionBarItem {
  id: string
  label: string
  /** Icon component or element, rendered decoratively. */
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }> | ReactNode
  href?: string
  onPress?: () => void
  active?: boolean
  count?: number
  menu?: ActionBarMenuEntry[]
  /** Own shortcut (registered by the host), exposed with aria-keyshortcuts and in the tooltip. */
  shortcut?: string
  /** Contextual toggle state (aria-pressed), e.g. a canvas mode; destinations use `active`. */
  pressed?: boolean
  /** Contextual items of different groups are divided by a separator. */
  group?: string
}

export interface FloatingActionBarProps {
  destinations: ActionBarItem[]
  contextual?: ActionBarItem[]
  /** Edge on wide screens; below 1024 px the bar is always at the bottom. */
  edge?: BarEdge
  /** `viewport` pins to the window; `container` to the nearest positioned ancestor (the research sheet). */
  anchor?: 'viewport' | 'container'
  /** Below 768 px: keep the floating bar or become a full-width bottom tab bar. */
  narrowVariant?: 'bar' | 'tabbar'
  autoHide?: boolean
  /** Inactivity (ms) before an auto-hiding bar fades out. */
  hideAfter?: number
  /** Defaults to true while both lists are empty. */
  loading?: boolean
  /** Chord that moves focus into the bar; null disables it. */
  focusShortcut?: string | null
  label?: string
  labels?: Partial<{ more: string; openMenu: (item: string) => string; count: (n: number) => string; loading: string }>
  onMenuAction?: (itemId: string, entryId: string) => void
  /** Confirmation service; defaults to a built-in alert dialog. */
  requestConfirm?: (options: ActionBarConfirm) => Promise<boolean>
  id?: string
  className?: string
}

/** Default focus chord, documented in the README. */
export const ACTION_BAR_SHORTCUT = 'Alt+Shift+D'

/* ------------------------------------------------------------------------ */

function renderGlyph(icon: ActionBarItem['icon'], className: string): ReactNode {
  if (icon == null) return null
  if (isValidElement(icon)) return <span className={className} aria-hidden="true">{icon}</span>
  const Glyph = icon as ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  return (
    <span className={className} aria-hidden="true">
      <Glyph className="fk-icon" aria-hidden="true" />
    </span>
  )
}

function useWindowLength(horizontal: boolean): number {
  const read = () => (typeof window === 'undefined' ? 0 : horizontal ? window.innerWidth : window.innerHeight)
  const [length, setLength] = useState(read)
  // Breakpoint hooks re-render on media changes; the listener covers free resizing.
  useEffect(() => {
    const onResize = () => setLength(read())
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizontal])
  return length
}

/** Publishes the bar thickness on the root so frames and pages pad their content. */
function usePublishedInset(ref: RefObject<HTMLElement | null>, edge: BarEdge, tabBar: boolean, active: boolean) {
  useLayoutEffect(() => {
    if (!active || typeof document === 'undefined') return
    const root = document.documentElement
    const name = `--fk-action-bar-inset-${edge}`
    const rect = ref.current?.getBoundingClientRect()
    const measured = rect ? (isHorizontal(edge) ? rect.height : rect.width) : 0
    const thickness = Math.round((measured || 56) + (tabBar ? 0 : 24))
    root.style.setProperty(name, tabBar ? `calc(${thickness}px + env(safe-area-inset-bottom, 0px))` : `${thickness}px`)
    return () => {
      root.style.removeProperty(name)
    }
  }, [ref, edge, tabBar, active])
}

/* ------------------------------------------------------------------------ */

interface SlotProps {
  placed: Placed<ActionBarItem>
  index: number
  tabbable: boolean
  tabBar: boolean
  menuOpen: boolean
  onOpenMenu: (id: string, from: HTMLElement) => void
  onFocusIndex: (index: number) => void
  registerRef: (index: number, el: HTMLElement | null) => void
  nameOf: (item: ActionBarItem) => string
  numberText: (n: number) => string
  capText: string
  chevronName: (item: ActionBarItem) => string
}

function useItemSemantics(item: ActionBarItem, kind: BarKind, ref: RefObject<HTMLElement | null>) {
  // Destinations are links (router aware through RAC's RouterProvider); contextual items are buttons.
  const asLink = kind === 'destination' && !!item.href
  const link = useLink({ href: item.href ?? '#', onPress: item.onPress, elementType: 'a', isDisabled: !asLink }, ref as RefObject<HTMLAnchorElement>)
  const button = useButton({ onPress: item.onPress, elementType: 'button', isDisabled: asLink }, ref as RefObject<HTMLButtonElement>)
  return asLink ? { props: link.linkProps, as: 'a' as const } : { props: button.buttonProps, as: 'button' as const }
}

function BarSlot(props: SlotProps) {
  const { placed, index, tabbable, tabBar, menuOpen } = props
  const { item, kind } = placed
  const control = useRef<HTMLElement | null>(null)
  const [tip, setTip] = useState<'hidden' | 'shown' | 'dismissed'>('hidden')
  const semantics = useItemSemantics(item, kind, control)
  const hasMenu = !!item.menu?.length
  const { longPressProps } = useLongPress({
    isDisabled: !hasMenu,
    accessibilityDescription: undefined,
    onLongPress: () => control.current && props.onOpenMenu(item.id, control.current),
  })

  const attach = (el: HTMLElement | null) => {
    control.current = el
    props.registerRef(index, el)
  }
  const Tag = semantics.as
  const shortcutText = item.shortcut ? ariaShortcut(item.shortcut) : undefined
  const count = item.count && item.count > 0 ? item.count : 0

  return (
    <div
      className="fk-action-bar__slot"
      data-kind={kind}
      onPointerEnter={() => setTip((t) => (t === 'dismissed' ? t : 'shown'))}
      onPointerLeave={() => setTip('hidden')}
    >
      <Tag
        {...mergeProps(semantics.props, hasMenu ? longPressProps : {}, {
          onFocus: (e: React.FocusEvent<HTMLElement>) => {
            props.onFocusIndex(index)
            if (e.currentTarget.matches(':focus-visible')) setTip((t) => (t === 'dismissed' ? t : 'shown'))
          },
          onBlur: () => setTip('hidden'),
          onKeyDownCapture: (e: ReactKeyboardEvent) => {
            if (e.key === 'Escape' && tip === 'shown') {
              setTip('dismissed')
              e.stopPropagation()
            }
          },
          onContextMenu: (e: React.MouseEvent) => {
            if (!hasMenu) return
            e.preventDefault()
            props.onOpenMenu(item.id, e.currentTarget as HTMLElement)
          },
        })}
        ref={attach as never}
        className="fk-action-bar__item"
        tabIndex={tabbable ? 0 : -1}
        data-bar-index={index}
        data-active={item.active || (kind === 'contextual' && item.pressed) || undefined}
        aria-current={kind === 'destination' && item.active ? 'page' : undefined}
        aria-pressed={kind === 'contextual' && item.pressed !== undefined ? item.pressed : undefined}
        aria-label={props.nameOf(item)}
        aria-keyshortcuts={shortcutText}
        aria-haspopup={hasMenu ? 'menu' : undefined}
        aria-expanded={hasMenu ? menuOpen : undefined}
      >
        {renderGlyph(item.icon, 'fk-action-bar__glyph')}
        {tabBar ? <span className="fk-action-bar__caption" aria-hidden="true">{item.label}</span> : null}
        {count ? (
          <span className="fk-action-bar__count" aria-hidden="true">
            {count > 99 ? props.capText : props.numberText(count)}
          </span>
        ) : null}
      </Tag>
      {hasMenu && !tabBar ? (
        <button
          type="button"
          tabIndex={-1}
          className="fk-action-bar__chevron"
          aria-label={props.chevronName(item)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => control.current && props.onOpenMenu(item.id, control.current)}
        >
          <ChevronDown className="fk-icon fk-mirror-rtl" aria-hidden="true" />
        </button>
      ) : null}
      {tip === 'shown' && !tabBar ? (
        <span className="fk-action-bar__tip" role="tooltip">
          {item.label}
          {shortcutText ? <kbd className="fk-action-bar__kbd">{item.shortcut}</kbd> : null}
        </span>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------------ */

interface OpenMenu {
  owner: string
  trigger: HTMLElement
}

function MenuLayer(props: {
  open: OpenMenu | null
  entries: Array<{ id: string; label: string; href?: string; tone?: string; icon?: ActionBarMenuEntry['icon'] }>
  placement: 'top' | 'bottom' | 'start' | 'end'
  label: string
  onAction: (entryId: string) => void
  onClose: () => void
}) {
  const triggerRef = useRef<HTMLElement | null>(props.open?.trigger ?? null)
  triggerRef.current = props.open?.trigger ?? null
  if (!props.open) return null
  return (
    <Popover
      className="fk-action-bar__popover"
      triggerRef={triggerRef}
      isOpen
      onOpenChange={(next) => !next && props.onClose()}
      placement={props.placement}
      offset={8}
    >
      <Menu className="fk-action-bar__menu" aria-label={props.label} autoFocus="first" onAction={(key) => props.onAction(String(key))}>
        {props.entries.map((entry) => (
          <MenuItem key={entry.id} id={entry.id} href={entry.href} className="fk-action-bar__entry" data-tone={entry.tone ?? 'neutral'} textValue={entry.label}>
            {entry.icon ? renderGlyph(entry.icon, 'fk-action-bar__entry-glyph') : null}
            <span>{entry.label}</span>
          </MenuItem>
        ))}
      </Menu>
    </Popover>
  )
}

function useBuiltInConfirm() {
  const [pending, setPending] = useState<{ options: ActionBarConfirm; settle: (ok: boolean) => void } | null>(null)
  const ask = useCallback((options: ActionBarConfirm) => new Promise<boolean>((settle) => setPending({ options, settle })), [])
  const close = (ok: boolean) => {
    pending?.settle(ok)
    setPending(null)
  }
  return { ask, pending, close }
}

/* ------------------------------------------------------------------------ */

const MORE_ID = '__fk-more__'
const ALL_SECTIONS_ID = '__fk-all-sections__'

/**
 * Floating bar of destinations and contextual actions with a full keyboard
 * path, item menus and overflow (spec: wave-4/floating-action-bar.md).
 */
export function FloatingActionBar(props: FloatingActionBarProps) {
  const m = useMessages().actionBar
  const text = { ...m, ...props.labels }
  // Inside the research shell, the tab bar's "more" menu can open the rail drawer.
  const host = useAppFrame()
  const { direction } = useLocale()
  const wide = useMinWidth(breakpoints.lg)
  const narrow = !useMinWidth(breakpoints.md)
  const reducedMotion = useReducedMotion()
  const barId = props.id ?? 'fk-action-bar'

  const destinations = props.destinations
  const contextual = props.contextual ?? []
  const loading = props.loading ?? (destinations.length === 0 && contextual.length === 0)
  const edge = effectiveEdge(props.edge ?? 'start', wide)
  const tabBar = narrow && props.narrowVariant === 'tabbar'
  const horizontal = isHorizontal(edge)
  const length = useWindowLength(horizontal)

  const plan = useMemo(() => {
    // A tab bar holds at most TAB_BAR_SLOTS items; the next slot is "more".
    const total = destinations.length + contextual.length
    const slots = tabBar ? (total <= TAB_BAR_SLOTS ? TAB_BAR_SLOTS : TAB_BAR_SLOTS + 1) : slotsAlong(length)
    return planBar(destinations, contextual, slots)
  }, [destinations, contextual, length, tabBar])
  const showMore = plan.overflow.length > 0 || (tabBar && !!host.openNavigation)

  // Roving focus over the visible items plus "more".
  const refs = useRef<Array<HTMLElement | null>>([])
  const count = plan.shown.length + (showMore ? 1 : 0)
  const activeIndex = Math.max(0, plan.shown.findIndex((p) => p.item.active))
  const [rover, setRover] = useState(activeIndex)
  const roverIndex = rover < count ? rover : activeIndex

  const barRef = useRef<HTMLElement | null>(null)
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const [hidden, setHidden] = useState(false)
  const confirm = useBuiltInConfirm()
  const requestConfirm = props.requestConfirm ?? confirm.ask

  const focusAt = (index: number) => {
    setRover(index)
    refs.current[index]?.focus()
  }

  // Auto-hide: never with focus inside, a menu open, or reduced motion.
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const canHide = !!props.autoHide && !reducedMotion
  const poke = useCallback(() => {
    setHidden(false)
    clearTimeout(hideTimer.current)
    if (!canHide) return
    hideTimer.current = setTimeout(() => {
      const bar = barRef.current
      if (bar && bar.contains(document.activeElement)) return
      setHidden(true)
    }, props.hideAfter ?? 4000)
  }, [canHide, props.hideAfter])
  useEffect(() => {
    poke()
    return () => clearTimeout(hideTimer.current)
  }, [poke])
  useEffect(() => {
    if (openMenu) {
      clearTimeout(hideTimer.current)
      setHidden(false)
    } else poke()
  }, [openMenu, poke])
  useEffect(() => {
    if (!canHide) return
    // Pointer near the bar's edge reveals it.
    const near = (e: PointerEvent) => {
      const w = window.innerWidth
      const h = window.innerHeight
      const distance = { bottom: h - e.clientY, top: e.clientY, start: direction === 'rtl' ? w - e.clientX : e.clientX, end: direction === 'rtl' ? e.clientX : w - e.clientX }[edge]
      if (distance < 72) poke()
    }
    window.addEventListener('pointermove', near)
    return () => window.removeEventListener('pointermove', near)
  }, [canHide, edge, direction, poke])

  // Focus shortcut: reveal, remember where focus was, land on the active item.
  useEffect(() => {
    if (props.focusShortcut === null) return
    const chord = parseChord(props.focusShortcut ?? ACTION_BAR_SHORTCUT)
    const onKey = (e: KeyboardEvent) => {
      if (!chordMatches(e, chord)) return
      e.preventDefault()
      const current = document.activeElement as HTMLElement | null
      if (current && !barRef.current?.contains(current)) returnTo.current = current
      setHidden(false)
      requestAnimationFrame(() => focusAt(activeIndex))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.focusShortcut, activeIndex])

  usePublishedInset(barRef, edge, tabBar, !loading)

  const speech = useLocaleText()
  const nameOf = (item: ActionBarItem) => (item.count && item.count > 0 ? speech.join(item.label, text.count(item.count)) : item.label)
  const itemById = (id: string) => [...plan.shown, ...plan.overflow].find((p) => p.item.id === id)?.item

  const openMenuOf = (id: string, trigger: HTMLElement) => {
    if (id !== MORE_ID && !itemById(id)?.menu?.length) return
    setOpenMenu({ owner: id, trigger })
  }
  const closeMenu = () => {
    const trigger = openMenu?.trigger
    setOpenMenu(null)
    if (trigger) requestAnimationFrame(() => trigger.focus())
  }

  const onToolbarKey = (e: ReactKeyboardEvent<HTMLElement>) => {
    const origin = (e.target as HTMLElement).closest<HTMLElement>('[data-bar-index]')
    if (!origin) return
    const index = Number(origin.dataset.barIndex)
    if ((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu') {
      e.preventDefault()
      const owner = index === plan.shown.length ? MORE_ID : plan.shown[index]?.item.id
      if (owner) openMenuOf(owner, origin)
      return
    }
    if (e.key === 'Escape') {
      if (returnTo.current) {
        e.preventDefault()
        const back = returnTo.current
        returnTo.current = null
        back.focus()
      }
      return
    }
    const step = stepFor(e.key, edge, direction === 'rtl')
    if (!step) return
    e.preventDefault()
    if (step === 'menu') {
      const owner = index === plan.shown.length ? MORE_ID : plan.shown[index]?.item.id
      if (owner) openMenuOf(owner, origin)
      return
    }
    focusAt(moveIndex(index, count, step))
  }

  const runEntry = async (owner: string, entryId: string) => {
    if (owner === MORE_ID) {
      setOpenMenu(null)
      if (entryId === ALL_SECTIONS_ID) return host.openNavigation?.()
      const target = plan.overflow.find((p) => p.item.id === entryId)?.item
      target?.onPress?.()
      return
    }
    const entry = itemById(owner)?.menu?.find((x) => x.id === entryId)
    closeMenu()
    if (!entry || entry.href) return
    if (entry.confirm && !(await requestConfirm(entry.confirm))) return
    props.onMenuAction?.(owner, entryId)
  }

  const menuEntries =
    openMenu?.owner === MORE_ID
      ? [
          ...plan.overflow.map((p) => ({ id: p.item.id, label: nameOf(p.item), href: p.item.href, icon: typeof p.item.icon === 'function' ? (p.item.icon as ActionBarMenuEntry['icon']) : undefined })),
          ...(tabBar && host.openNavigation ? [{ id: ALL_SECTIONS_ID, label: text.allSections }] : []),
        ]
      : (openMenu && itemById(openMenu.owner)?.menu) || []
  const menuOwnerLabel = openMenu?.owner === MORE_ID ? text.more : (openMenu && itemById(openMenu.owner)?.label) || ''

  const common = {
    id: barId,
    'aria-label': props.label ?? text.label,
    'data-edge': edge,
    'data-anchor': props.anchor ?? 'viewport',
    'data-variant': tabBar ? 'tabbar' : 'bar',
    'data-orientation': horizontal ? 'horizontal' : 'vertical',
  }

  if (loading) {
    return (
      <nav {...common} className={cx('fk-action-bar', props.className)} aria-busy="true" data-loading="">
        <span role="status" className="fk-visually-hidden">
          {text.loading}
        </span>
        <span className="fk-action-bar__ghosts" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="fk-action-bar__ghost" />
          ))}
        </span>
      </nav>
    )
  }

  const firstContextual = plan.shown.findIndex((p) => p.kind === 'contextual')
  /** A separator opens the contextual run and each new contextual group. */
  const startsGroup = (index: number) => {
    if (index === 0) return false
    if (index === firstContextual) return true
    const here = plan.shown[index]!
    const before = plan.shown[index - 1]!
    return here.kind === 'contextual' && before.kind === 'contextual' && here.item.group !== undefined && before.item.group !== undefined && here.item.group !== before.item.group
  }
  const placement = ({ bottom: 'top', top: 'bottom', start: 'end', end: 'start' } as const)[edge]

  return (
    <>
      <nav
        {...common}
        ref={barRef as RefObject<HTMLElement>}
        className={cx('fk-action-bar', props.className)}
        data-hidden={hidden || undefined}
        {...inertProps(hidden)}
        tabIndex={-1}
        onFocus={(e) => {
          // Skip-link arrival on the landmark forwards focus to the active item.
          if (e.target === e.currentTarget) focusAt(activeIndex)
          poke()
        }}
        onPointerMove={poke}
      >
        <div
          role="toolbar"
          aria-label={props.label ?? text.label}
          aria-orientation={horizontal ? 'horizontal' : 'vertical'}
          className="fk-action-bar__track"
          onKeyDown={onToolbarKey}
        >
          {plan.shown.map((placed, index) => (
            <FragmentWithSeparator key={placed.item.id} before={startsGroup(index)} horizontal={horizontal}>
              <BarSlot
                placed={placed}
                index={index}
                tabbable={index === roverIndex}
                tabBar={tabBar}
                menuOpen={openMenu?.owner === placed.item.id}
                onOpenMenu={openMenuOf}
                onFocusIndex={setRover}
                registerRef={(i, el) => (refs.current[i] = el)}
                nameOf={nameOf}
                numberText={speech.number}
                capText={text.capped(speech.number(99))}
                chevronName={(item) => text.openMenu(item.label)}
              />
            </FragmentWithSeparator>
          ))}
          {showMore ? (
            <MoreSlot
              index={plan.shown.length}
              tabbable={roverIndex === plan.shown.length}
              label={text.more}
              tabBar={tabBar}
              open={openMenu?.owner === MORE_ID}
              registerRef={(el) => (refs.current[plan.shown.length] = el)}
              onFocusIndex={setRover}
              onOpen={(el) => openMenuOf(MORE_ID, el)}
            />
          ) : null}
        </div>
      </nav>
      <MenuLayer
        open={openMenu}
        entries={menuEntries}
        placement={placement}
        label={menuOwnerLabel}
        onAction={(entryId) => openMenu && void runEntry(openMenu.owner, entryId)}
        onClose={closeMenu}
      />
      {confirm.pending ? (
        <ModalDialog
          isOpen
          role="alertdialog"
          onOpenChange={(open) => !open && confirm.close(false)}
          title={confirm.pending.options.title}
          description={confirm.pending.options.message}
          actions={
            <>
              <Button autoFocus onPress={() => confirm.close(false)}>
                {confirm.pending.options.cancelLabel ?? text.cancel}
              </Button>
              <Button variant="danger" onPress={() => confirm.close(true)}>
                {confirm.pending.options.confirmLabel ?? text.confirm}
              </Button>
            </>
          }
        />
      ) : null}
    </>
  )
}

function FragmentWithSeparator({ before, horizontal, children }: { before: boolean; horizontal: boolean; children: ReactNode }) {
  return (
    <>
      {before ? <span role="separator" aria-orientation={horizontal ? 'vertical' : 'horizontal'} className="fk-action-bar__separator" /> : null}
      {children}
    </>
  )
}

function MoreSlot(props: {
  index: number
  tabbable: boolean
  label: string
  tabBar: boolean
  open: boolean
  registerRef: (el: HTMLElement | null) => void
  onFocusIndex: (index: number) => void
  onOpen: (el: HTMLElement) => void
}) {
  const ref = useRef<HTMLButtonElement | null>(null)
  const { buttonProps } = useButton({ onPress: () => ref.current && props.onOpen(ref.current), elementType: 'button' }, ref)
  return (
    <div className="fk-action-bar__slot" data-kind="more">
      <button
        {...mergeProps(buttonProps, { onFocus: () => props.onFocusIndex(props.index) })}
        ref={(el) => {
          ref.current = el
          props.registerRef(el)
        }}
        className="fk-action-bar__item"
        tabIndex={props.tabbable ? 0 : -1}
        data-bar-index={props.index}
        aria-label={props.label}
        aria-haspopup="menu"
        aria-expanded={props.open}
      >
        <span className="fk-action-bar__glyph" aria-hidden="true">
          <Ellipsis className="fk-icon" aria-hidden="true" />
        </span>
        {props.tabBar ? <span className="fk-action-bar__caption" aria-hidden="true">{props.label}</span> : null}
      </button>
    </div>
  )
}
