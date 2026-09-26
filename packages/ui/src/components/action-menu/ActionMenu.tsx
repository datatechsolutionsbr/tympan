import { Ellipsis } from 'lucide-react'
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import {
  Header,
  Keyboard,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Popover,
  Separator,
  Text,
  type Key,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'
import { Button } from '../button/Button'

export interface ActionMenuItem {
  type?: 'item'
  id: string
  label: string
  icon?: IconComponent
  tone?: 'default' | 'danger'
  disabled?: boolean
  shortcut?: string
  /** Makes the item a link (navigates through the router adapter). */
  href?: string
}
export interface ActionMenuSeparator {
  type: 'separator'
  id?: string
}
export interface ActionMenuSection {
  type: 'section'
  id: string
  title: string
  items: ActionMenuItem[]
}
export type ActionMenuEntry = ActionMenuItem | ActionMenuSeparator | ActionMenuSection

export interface ActionMenuPosition {
  x: number
  y: number
}

export interface ActionMenuProps {
  items: ActionMenuEntry[]
  onAction: (id: string) => void
  /** Accessible name of the menu. */
  label: string
  /** `trigger`: opens from a button; `context`: opens at a pointer position over `trigger`. */
  mode?: 'trigger' | 'context'
  /** Trigger mode: the button. Context mode: the target that receives the context request. */
  trigger?: ReactNode
  /** Context mode: viewport point (controlled). */
  position?: ActionMenuPosition
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const GUTTER = 8
const LONG_PRESS_MS = 500

function collectDisabled(items: ActionMenuEntry[]): string[] {
  const out: string[] = []
  for (const e of items) {
    if (e.type === 'section') out.push(...collectDisabled(e.items))
    else if (e.type !== 'separator' && e.disabled) out.push(e.id)
  }
  return out
}

function renderItem(item: ActionMenuItem) {
  const Icon = item.icon
  return (
    <MenuItem
      key={item.id}
      id={item.id}
      textValue={item.label}
      href={item.href}
      className="fk-action-menu__item"
      data-tone={item.tone ?? 'default'}
    >
      {Icon ? <Icon className="fk-icon fk-action-menu__icon" aria-hidden="true" focusable="false" /> : null}
      <Text slot="label" className="fk-action-menu__label">
        {item.label}
      </Text>
      {item.shortcut ? <Keyboard className="fk-action-menu__shortcut">{item.shortcut}</Keyboard> : null}
    </MenuItem>
  )
}

function renderEntries(items: ActionMenuEntry[]) {
  return items.map((entry, i) => {
    if (entry.type === 'separator') return <Separator key={entry.id ?? `separator-${i}`} className="fk-action-menu__separator" />
    if (entry.type === 'section') {
      return (
        <MenuSection key={entry.id} id={entry.id} className="fk-action-menu__section">
          <Header className="fk-action-menu__section-title">{entry.title}</Header>
          {entry.items.map(renderItem)}
        </MenuSection>
      )
    }
    return renderItem(entry)
  })
}

/** Clamps a point so a box of `width` x `height` stays inside the viewport. */
export function clampToViewport(point: ActionMenuPosition, width: number, height: number): ActionMenuPosition {
  const vw = typeof window !== 'undefined' ? window.innerWidth : width
  const vh = typeof window !== 'undefined' ? window.innerHeight : height
  return {
    x: Math.max(GUTTER, Math.min(point.x, vw - width - GUTTER)),
    y: Math.max(GUTTER, Math.min(point.y, vh - height - GUTTER)),
  }
}

/** Commands from a trigger button or at a pointer position (spec: wave-1/action-menu.md). */
export function ActionMenu(props: ActionMenuProps) {
  const { items, onAction, label, mode = 'trigger', trigger, className } = props
  const messages = useMessages()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(props.defaultOpen ?? false)
  const isOpen = props.open ?? uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (props.open === undefined) setUncontrolledOpen(next)
    props.onOpenChange?.(next)
  }
  const labelId = useId()
  const disabledKeys = collectDisabled(items)
  const handleAction = (key: Key) => {
    if (disabledKeys.includes(String(key))) return
    onAction(String(key))
  }

  const menu = (
    <Menu
      aria-labelledby={labelId}
      className="fk-action-menu__menu"
      disabledKeys={disabledKeys}
      onAction={handleAction}
      shouldFocusWrap
      {...(mode === 'context' ? { autoFocus: 'first' as const, onClose: () => setOpen(false) } : {})}
    >
      {renderEntries(items)}
    </Menu>
  )

  if (mode === 'trigger') {
    return (
      <MenuTrigger isOpen={isOpen} onOpenChange={setOpen}>
        {trigger ?? <Button iconOnly accessibleLabel={messages.moreActions} leadingIcon={<Ellipsis />} variant="quiet" />}
        <Popover className={cx('fk-action-menu', className)} placement="bottom end" offset={8}>
          <span id={labelId} className="fk-visually-hidden">
            {label}
          </span>
          {menu}
        </Popover>
      </MenuTrigger>
    )
  }

  return (
    <ContextActionMenu {...props} isOpen={isOpen} setOpen={setOpen} menu={menu} labelId={labelId} className={className}>
      {trigger}
    </ContextActionMenu>
  )
}

interface ContextInternalProps extends ActionMenuProps {
  isOpen: boolean
  setOpen: (open: boolean) => void
  menu: ReactNode
  labelId: string
  children: ReactNode
}

function ContextActionMenu({ isOpen, setOpen, menu, labelId, label, children, className, position }: ContextInternalProps) {
  const targetRef = useRef<HTMLSpanElement>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const originRef = useRef<HTMLElement | null>(null)
  const longPress = useRef<number | undefined>(undefined)
  const [point, setPoint] = useState<ActionMenuPosition>(position ?? { x: 0, y: 0 })
  const [clamped, setClamped] = useState<ActionMenuPosition>(point)
  const effective = position ?? point

  const openAt = (p: ActionMenuPosition) => {
    const active = document.activeElement
    originRef.current = active instanceof HTMLElement && active !== document.body ? active : targetRef.current
    setPoint(p)
    setOpen(true)
  }

  const onContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault()
    openAt({ x: e.clientX, y: e.clientY })
  }
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') {
      e.preventDefault()
      const el = (e.target as HTMLElement) ?? targetRef.current
      const rect = el.getBoundingClientRect()
      openAt({ x: rect.left, y: rect.bottom })
    }
  }
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'touch') return
    const { clientX, clientY } = e
    window.clearTimeout(longPress.current)
    longPress.current = window.setTimeout(() => openAt({ x: clientX, y: clientY }), LONG_PRESS_MS)
  }
  const cancelLongPress = () => window.clearTimeout(longPress.current)

  useLayoutEffect(() => {
    if (!isOpen) return
    const el = popoverRef.current
    const rect = el?.getBoundingClientRect()
    setClamped(clampToViewport(effective, rect?.width ?? 0, rect?.height ?? 0))
  }, [isOpen, effective.x, effective.y])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      const origin = originRef.current
      requestAnimationFrame(() => {
        if (origin && (document.activeElement === document.body || document.activeElement === null)) origin.focus()
      })
    }
  }

  return (
    <>
      <span
        ref={targetRef}
        className="fk-action-menu__target"
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onPointerMove={cancelLongPress}
      >
        {children}
      </span>
      <span
        ref={anchorRef}
        aria-hidden="true"
        className="fk-action-menu__anchor"
        style={{ position: 'fixed', left: effective.x, top: effective.y, width: 0, height: 0 }}
      />
      <Popover
        ref={popoverRef}
        triggerRef={anchorRef}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        placement="bottom start"
        offset={0}
        className={cx('fk-action-menu', className)}
        data-mode="context"
        style={{ position: 'fixed', left: clamped.x, top: clamped.y }}
      >
        <span id={labelId} className="fk-visually-hidden">
          {label}
        </span>
        {menu}
      </Popover>
    </>
  )
}
