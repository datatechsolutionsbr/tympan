// SwipeRow (spec: wave-2/swipe-row.md). A row whose actions are revealed by a
// horizontal swipe on touch screens, and always reachable from an actions
// menu button (WCAG 2.5.1: the gesture is only a shortcut).
import { Archive, Ellipsis, Pencil, Star, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type TouchEvent } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useReducedMotion } from '../../internal/media'
import { beginTrack, advanceTrack, firstTouch, type Track } from '../../internal/platform/touchTrack'
import { useMessages } from '../../internal/provider'
import { playHaptic } from '../../utilities/haptics/haptics'
import { ActionMenu, type ActionMenuItem } from '../action-menu/ActionMenu'
import { Button } from '../button/Button'

export type SwipeTone = 'neutral' | 'danger' | 'pending' | 'positive'
export type SwipeSide = 'none' | 'leading' | 'trailing'

export interface SwipeAction {
  label: string
  icon?: ReactNode
  tone: SwipeTone
  onAction: () => void
  /** The host offers undo, so a destructive full swipe needs no confirmation. */
  undoable?: boolean
}

export interface SwipeRowProps {
  children: ReactNode
  /** Name of the row, used in the actions button name ("Actions for …"). */
  label: string
  leadingActions?: SwipeAction[]
  trailingActions?: SwipeAction[]
  fullSwipe?: boolean
  /** Fraction of the row width past which the first action of a side fires. */
  fullSwipeFraction?: number
  /** Fraction of the row width the revealed actions occupy. */
  revealFraction?: number
  onRevealChange?: (side: SwipeSide) => void
  /**
   * Asked before a destructive full swipe fires (for example ConfirmService's
   * confirm). Without it, and without `undoable`, a destructive full swipe
   * only reveals the actions.
   */
  confirm?: (action: SwipeAction) => boolean | Promise<boolean>
  className?: string
}

/** Localised preset actions: delete (danger), archive (pending), edit and favourite (neutral). */
export function useSwipeActionPresets() {
  const w = useMessages().swipeRow
  return useMemo(
    () => ({
      delete: (onAction: () => void, extra: Partial<SwipeAction> = {}): SwipeAction => ({ label: w.delete, icon: <Trash2 />, tone: 'danger', onAction, ...extra }),
      archive: (onAction: () => void, extra: Partial<SwipeAction> = {}): SwipeAction => ({ label: w.archive, icon: <Archive />, tone: 'pending', onAction, ...extra }),
      edit: (onAction: () => void, extra: Partial<SwipeAction> = {}): SwipeAction => ({ label: w.edit, icon: <Pencil />, tone: 'neutral', onAction, ...extra }),
      favourite: (onAction: () => void, extra: Partial<SwipeAction> = {}): SwipeAction => ({ label: w.favourite, icon: <Star />, tone: 'neutral', onAction, ...extra }),
    }),
    [w],
  )
}

function ActionStrip({ side, actions, open, onPick }: { side: 'leading' | 'trailing'; actions: SwipeAction[]; open: boolean; onPick: (a: SwipeAction) => void }) {
  if (actions.length === 0) return null
  return (
    <div className="fk-swipe-row__actions" data-side={side} aria-hidden={!open || undefined} inert={!open || undefined}>
      {actions.map((action) => (
        <button key={action.label} type="button" className="fk-swipe-row__action" data-tone={action.tone} tabIndex={open ? undefined : -1} onClick={() => onPick(action)}>
          {action.icon ? (
            <span className="fk-swipe-row__action-icon" aria-hidden="true">
              {action.icon}
            </span>
          ) : null}
          <span className="fk-swipe-row__action-word">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

export function SwipeRow(props: SwipeRowProps) {
  const { leadingActions = [], trailingActions = [], fullSwipe = true, fullSwipeFraction = 0.6, revealFraction = 0.4 } = props
  const copy = useMessages().swipeRow
  const rtl = useLocale().direction === 'rtl'
  const reduced = useReducedMotion()
  const [side, setSide] = useState<SwipeSide>('none')
  const [drag, setDragState] = useState<number | null>(null)
  const dragNow = useRef<number | null>(null)
  const setDrag = (v: number | null) => {
    dragNow.current = v
    setDragState(v)
  }
  const track = useRef<Track | null>(null)
  const width = useRef(0)
  const armed = useRef(false)
  const surface = useRef<HTMLDivElement>(null)

  const changeSide = (next: SwipeSide) => {
    setSide(next)
    if (next !== side) props.onRevealChange?.(next)
  }

  const commit = (action: SwipeAction) => {
    action.onAction()
    changeSide('none')
  }

  const fullSwipeFire = async (action: SwipeAction, towards: 'leading' | 'trailing') => {
    if (action.tone === 'danger' && !action.undoable) {
      if (!props.confirm) return changeSide(towards)
      const ok = await props.confirm(action)
      if (!ok) return changeSide('none')
    }
    commit(action)
  }

  // Positive distance along the reading direction reveals the leading side.
  const along = (dx: number) => (rtl ? -dx : dx)

  const onTouchStart = (e: TouchEvent) => {
    const t = firstTouch(e.touches)
    if (!t || e.touches.length > 1) return
    track.current = beginTrack(t)
    width.current = surface.current?.getBoundingClientRect().width || surface.current?.offsetWidth || 0
    armed.current = false
  }

  const onTouchMove = (e: TouchEvent) => {
    const t = firstTouch(e.touches)
    if (!t || !track.current) return
    const next = advanceTrack(track.current, t)
    track.current = next
    if (next.axis === 'y') {
      // Vertical intent: the list scrolls and the row stays put.
      track.current = null
      setDrag(null)
      return
    }
    if (next.axis !== 'x') return
    const base = side === 'leading' ? width.current * revealFraction : side === 'trailing' ? -width.current * revealFraction : 0
    let offset = base + along(next.dx)
    if (offset > 0 && leadingActions.length === 0) offset = 0
    if (offset < 0 && trailingActions.length === 0) offset = 0
    offset = Math.max(-width.current, Math.min(width.current, offset))
    const past = fullSwipe && width.current > 0 && Math.abs(offset) >= width.current * fullSwipeFraction
    if (past && !armed.current) playHaptic('impact')
    armed.current = past
    setDrag(offset)
  }

  const onTouchEnd = () => {
    const offset = dragNow.current
    track.current = null
    setDrag(null)
    if (offset === null) return
    const towards: 'leading' | 'trailing' = offset > 0 ? 'leading' : 'trailing'
    const pool = towards === 'leading' ? leadingActions : trailingActions
    const w = width.current
    if (armed.current && pool[0]) {
      armed.current = false
      void fullSwipeFire(pool[0], towards)
      return
    }
    const revealAt = (w * revealFraction) / Math.max(1, pool.length) / 2
    changeSide(Math.abs(offset) >= revealAt && pool.length > 0 ? towards : 'none')
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && side !== 'none') {
      e.stopPropagation()
      changeSide('none')
      surface.current?.focus()
    }
  }

  const menuItems: ActionMenuItem[] = [...leadingActions, ...trailingActions].map((a, i) => ({
    id: String(i),
    label: a.label,
    tone: a.tone === 'danger' ? 'danger' : 'default',
  }))
  const everyAction = [...leadingActions, ...trailingActions]

  // The drag variable is physical (left/right), the offset logical.
  const offsetValue = drag !== null ? `${rtl ? -drag : drag}px` : undefined
  return (
    <div
      className={cx('fk-swipe-row', props.className)}
      data-reveal={side}
      data-dragging={drag !== null || undefined}
      data-reduced={reduced || undefined}
      data-dir={rtl ? 'rtl' : 'ltr'}
      data-armed={drag !== null && armed.current ? true : undefined}
      onKeyDown={onKeyDown}
      style={{ '--fk-swipe-reveal': `${revealFraction * 100}%`, ...(offsetValue ? { '--fk-swipe-drag': offsetValue } : {}) } as React.CSSProperties}
    >
      <ActionStrip side="leading" actions={leadingActions} open={side === 'leading'} onPick={commit} />
      <ActionStrip side="trailing" actions={trailingActions} open={side === 'trailing'} onPick={commit} />
      <div
        ref={surface}
        className="fk-swipe-row__surface"
        tabIndex={-1}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div className="fk-swipe-row__content">{props.children}</div>
        {everyAction.length > 0 ? (
          <ActionMenu
            label={copy.actionsFor(props.label)}
            items={menuItems}
            onAction={(id) => everyAction[Number(id)]?.onAction()}
            trigger={<Button variant="quiet" iconOnly accessibleLabel={copy.actionsFor(props.label)} leadingIcon={<Ellipsis />} className="fk-swipe-row__menu" />}
          />
        ) : null}
      </div>
    </div>
  )
}
