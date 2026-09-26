import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ListBox, ListBoxItem, type Key } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { requestHaptic } from '../../internal/haptics'
import { prefersReducedMotion } from '../../internal/media'

export type WheelOption = string | { value: string; label: string }

export interface WheelPickerProps {
  options: WheelOption[]
  value: string
  onChange: (value: string) => void
  label: string
  /** Odd number of rows visible at once. */
  visibleRows?: number
  disabled?: boolean
  className?: string
  /** Relative width inside a WheelPickerGroup. */
  share?: number
  /** Shows the label as a caption above the wheel. */
  showLabel?: boolean
}

interface Row {
  id: string
  text: string
}

const toRows = (options: WheelOption[]): Row[] => options.map((o) => (typeof o === 'string' ? { id: o, text: o } : { id: o.value, text: o.label }))
const SETTLE_MS = 120
const DEFAULT_ROW = 44

/** Pointer-drag scrolling for mouse and pen; touch scrolls natively. */
function useDragScroll(list: React.RefObject<HTMLElement | null>) {
  const moved = useRef(false)
  useEffect(() => {
    const el = list.current
    if (!el) return
    let start: { y: number; top: number } | null = null
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      start = { y: e.clientY, top: el.scrollTop }
      moved.current = false
    }
    const move = (e: PointerEvent) => {
      if (!start) return
      const dy = e.clientY - start.y
      if (Math.abs(dy) > 4) moved.current = true
      if (moved.current) el.scrollTop = start.top - dy
    }
    const up = () => {
      start = null
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [list])
  /** True once, right after a drag ended (the following tap is ignored). */
  return () => {
    const was = moved.current
    moved.current = false
    return was
  }
}

/**
 * One wheel: a listbox whose selected option sits in the centre band
 * (spec: wave-2/wheel-picker.md).
 */
export function WheelPicker(props: WheelPickerProps) {
  const rows = useMemo(() => toRows(props.options), [props.options])
  const visible = Math.max(3, (props.visibleRows ?? 5) | 1)
  const listRef = useRef<HTMLDivElement>(null)
  const index = rows.findIndex((r) => r.id === props.value)
  const [centre, setCentre] = useState(Math.max(0, index))
  const programmatic = useRef(false)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const endedDrag = useDragScroll(listRef)
  const { onChange } = props

  const rowHeight = () => {
    const item = listRef.current?.querySelector<HTMLElement>('[role="option"]')
    return item?.offsetHeight || DEFAULT_ROW
  }

  // Bring the value's row to the band whenever the value changes.
  useEffect(() => {
    const el = listRef.current
    const target = Math.max(0, index)
    setCentre(target)
    if (!el) return
    programmatic.current = true
    const top = target * rowHeight()
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'instant' : 'smooth'
    if (typeof el.scrollTo === 'function') el.scrollTo({ top, behavior })
    else el.scrollTop = top
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      programmatic.current = false
    }, 400)
  }, [index])

  // User scrolling: tick on every row that crosses the band, report on settle.
  const onScroll = useCallback(() => {
    const el = listRef.current
    if (!el) return
    const at = Math.min(rows.length - 1, Math.max(0, Math.round(el.scrollTop / rowHeight())))
    setCentre((prev) => {
      if (prev !== at && !programmatic.current) requestHaptic('light')
      return at
    })
    if (programmatic.current) return
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const row = rows[at]
      if (row && row.id !== props.value) {
        requestHaptic('light')
        onChange(row.id)
      }
    }, SETTLE_MS)
  }, [rows, props.value, onChange])

  useEffect(() => {
    const el = listRef.current
    el?.addEventListener('scroll', onScroll, { passive: true })
    return () => el?.removeEventListener('scroll', onScroll)
  }, [onScroll])
  useEffect(() => () => clearTimeout(settleTimer.current), [])

  const choose = (keys: 'all' | Set<Key>) => {
    if (keys === 'all' || endedDrag()) return
    const [key] = [...keys]
    if (key != null && String(key) !== props.value) onChange(String(key))
  }

  // PageUp/PageDown move by the number of visible rows.
  const pageKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'PageUp' && e.key !== 'PageDown') return
    e.preventDefault()
    e.stopPropagation()
    const from = Math.max(0, index)
    const to = Math.min(rows.length - 1, Math.max(0, from + (e.key === 'PageUp' ? -visible : visible)))
    const row = rows[to]
    if (row && row.id !== props.value) onChange(row.id)
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(String(row?.id ?? ''))}"]`)?.focus())
  }

  const style = { '--fk-wheel-rows': visible, '--fk-wheel-share': props.share ?? 1 } as CSSProperties
  return (
    <div className={cx('fk-wheel', props.className)} style={style} data-disabled={props.disabled || undefined} onKeyDownCapture={pageKeys}>
      {props.showLabel ? (
        <span className="fk-wheel__caption" aria-hidden="true">
          {props.label}
        </span>
      ) : null}
      <div className="fk-wheel__viewport">
        <span className="fk-wheel__band" aria-hidden="true" />
        <ListBox
          ref={listRef}
          aria-label={props.label}
          className="fk-wheel__list"
          items={rows}
          selectionMode="single"
          selectionBehavior="replace"
          disallowEmptySelection
          shouldFocusWrap={false}
          selectedKeys={index >= 0 ? [props.value] : []}
          onSelectionChange={choose}
          disabledKeys={props.disabled ? rows.map((r) => r.id) : undefined}
        >
          {(row) => (
            <ListBoxItem id={row.id} textValue={row.text} className="fk-wheel__row" data-distance={Math.min(3, Math.abs(rows.indexOf(row) - centre))}>
              {row.text}
            </ListBoxItem>
          )}
        </ListBox>
      </div>
    </div>
  )
}

export type WheelColumn = Omit<WheelPickerProps, 'visibleRows' | 'disabled' | 'className' | 'showLabel'>

export interface WheelPickerGroupProps {
  columns: WheelColumn[]
  /** Name of the whole group. */
  label: string
  visibleRows?: number
  disabled?: boolean
  className?: string
}

/** Several wheels side by side for compound values (day, month, year). */
export function WheelPickerGroup({ columns, label, visibleRows, disabled, className }: WheelPickerGroupProps) {
  return (
    <div role="group" aria-label={label} className={cx('fk-wheel-group', className)}>
      {columns.map((column) => (
        <WheelPicker key={column.label} {...column} visibleRows={visibleRows} disabled={disabled} showLabel />
      ))}
    </div>
  )
}
