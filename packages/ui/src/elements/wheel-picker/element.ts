import { TyElement } from '../base.ts'
import { wheelPickerDefinition } from './definition.ts'

const SETTLE_MS = 120
const DEFAULT_ROW = 44

interface Row {
  id: string
  text: string
}

interface Column {
  label: string
  options: Row[]
  value: string
  share?: number
}

/** Live state of one rendered wheel. */
interface Wheel {
  column: number
  rows: Row[]
  /** The value the wheel shows (seeded from the host, moved by interaction). */
  current: string
  /** Index of the row in the band. */
  centre: number
  wheel: HTMLElement
  list: HTMLElement
  /** True while a programmatic scroll glides; its settle is not reported. */
  programmatic: boolean
  settleTimer: ReturnType<typeof setTimeout> | undefined
  programTimer: ReturnType<typeof setTimeout> | undefined
  /** True once, right after a drag ended (the following tap is ignored). */
  moved: boolean
}

function el(tag: string, className?: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag)
  if (className) node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

function rowsOf(options: unknown): Row[] {
  if (!Array.isArray(options)) return []
  const rows: Row[] = []
  for (const option of options) {
    if (typeof option === 'string') rows.push({ id: option, text: option })
    else if (option && typeof option === 'object' && 'value' in option) {
      const value = String((option as { value: unknown }).value)
      const label = (option as { label?: unknown }).label
      rows.push({ id: value, text: label === undefined || label === null ? value : String(label) })
    }
  }
  return rows.filter((row) => row.id !== '')
}

function parseJson(raw: string | undefined): unknown {
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** A light selection tick; silent without the Vibration API, under reduced motion and before any user gesture. */
function tick(): void {
  if (prefersReducedMotion()) return
  const nav = navigator as Navigator & { vibrate?: unknown; userActivation?: { hasBeenActive?: boolean } }
  if (nav.userActivation && nav.userActivation.hasBeenActive === false) return
  if (typeof nav.vibrate !== 'function') return
  try {
    ;(nav.vibrate as (p: number) => boolean).call(navigator, 8)
  } catch {
    /* unsupported */
  }
}

/**
 * `<ty-wheel-picker>`. The choices are data (`options`, or one entry per
 * wheel in `columns`), so the element owns its whole subtree — frameworks
 * render an empty host (spec: wave-2/wheel-picker.md):
 *
 * - **Structure** — each wheel is a `ty-wheel` (caption, viewport, selection
 *   band) around a scrollable `role="listbox"` of `option` rows; the
 *   stylesheet (WheelPicker.css) draws the fades, the band and the distance
 *   emphasis from the same `.ty-*` classes and `data-*` states the React
 *   component emits.
 * - **Scrolling** — touch scrolls natively (CSS scroll snap); a mouse or pen
 *   drag scrolls by pointer delta (`data-dragging` lifts the snap while
 *   dragging). Each scroll recentres the emphasis and ticks as a row crosses
 *   the band; 120 ms after the last scroll the wheel settles and reports the
 *   centred row (`ty-change`) if it changed.
 * - **Keyboard** — ArrowUp/ArrowDown move one row, PageUp/PageDown move by
 *   `visible-rows`, Home/End go to the ends and a printable character jumps
 *   to the next row whose label starts with it; each move selects at once.
 * - **Controlled value** — the wheel's value is seeded from `value` (or each
 *   column's) and follows attribute changes with an animated scroll (a jump
 *   under reduced motion; the first placement always jumps). Interaction
 *   moves the wheel itself and reports through `ty-change`.
 */
export class TyWheelPickerElement extends TyElement {
  static override definition = wheelPickerDefinition

  #wheels: Wheel[] = []
  /** Signature of the structural attributes; a change rebuilds the subtree. */
  #structure = ''
  #drags = new AbortController()

  protected override connected(): void {
    this.#render()
  }

  protected override disconnected(): void {
    for (const wheel of this.#wheels) {
      clearTimeout(wheel.settleTimer)
      clearTimeout(wheel.programTimer)
    }
    this.#wheels = []
    this.#drags.abort()
    this.#drags = new AbortController()
  }

  protected override changed(): void {
    if (!this.isConnected || !this.#wheels.length) return
    const structure = this.#structureSignature()
    if (structure !== this.#structure) {
      this.#render()
      return
    }
    // A value-only change animates the wheel to the new row (single wheel;
    // a column's value lives in `columns`, a structural change).
    const wheel = this.#wheels[0]
    if (wheel && !this.#columns()) {
      const value = String(this.props.value ?? '')
      if (value !== wheel.current) {
        wheel.current = value
        this.#place(wheel, wheel.rows.findIndex((row) => row.id === value), true)
      }
    }
  }

  #columns(): Column[] | undefined {
    const parsed = parseJson(this.getAttribute('columns') ?? undefined)
    if (!Array.isArray(parsed) || !parsed.length) return undefined
    const columns: Column[] = []
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue
      const column = entry as { label?: unknown; options?: unknown; value?: unknown; share?: unknown }
      columns.push({
        label: String(column.label ?? ''),
        options: rowsOf(column.options),
        value: column.value === undefined || column.value === null ? '' : String(column.value),
        share: typeof column.share === 'number' && Number.isFinite(column.share) ? column.share : undefined,
      })
    }
    return columns.length ? columns : undefined
  }

  #structureSignature(): string {
    const p = this.props
    return [this.getAttribute('options') ?? '', this.getAttribute('columns') ?? '', String(p.label ?? ''), String(p.visibleRows ?? ''), p.disabled ? '1' : '0', String(p.testId ?? '')].join(
      '',
    )
  }

  #visibleRows(): number {
    const raw = Number(this.props.visibleRows ?? 5)
    return Math.max(3, (Number.isFinite(raw) ? Math.floor(raw) : 5) | 1)
  }

  #render(): void {
    this.#structure = this.#structureSignature()
    for (const wheel of this.#wheels) {
      clearTimeout(wheel.settleTimer)
      clearTimeout(wheel.programTimer)
    }
    this.#wheels = []
    const visible = this.#visibleRows()
    const columns = this.#columns()
    if (columns) {
      const group = el('div', 'ty-wheel-group', { role: 'group', 'aria-label': String(this.props.label ?? '') })
      columns.forEach((column, index) => group.append(this.#wheel(column.options, column.value, column.label, index, visible, true, column.share)))
      this.replaceChildren(group)
    } else {
      const rows = rowsOf(parseJson(this.getAttribute('options') ?? undefined))
      const wheel = this.#wheel(rows, String(this.props.value ?? ''), String(this.props.label ?? ''), 0, visible, false, undefined)
      const testId = this.props.testId
      if (testId) wheel.setAttribute('data-testid', String(testId))
      this.replaceChildren(wheel)
    }
    // The first placement jumps; later moves animate.
    for (const wheel of this.#wheels) this.#place(wheel, wheel.rows.findIndex((row) => row.id === wheel.current), false)
  }

  #wheel(rows: Row[], value: string, label: string, column: number, visible: number, caption: boolean, share: number | undefined): HTMLElement {
    const disabled = Boolean(this.props.disabled)
    const wheel = el('div', 'ty-wheel')
    wheel.style.setProperty('--ty-wheel-rows', String(visible))
    wheel.style.setProperty('--ty-wheel-share', String(share ?? 1))
    if (disabled) wheel.setAttribute('data-disabled', '')
    if (caption) {
      const captionNode = el('span', 'ty-wheel__caption', { 'aria-hidden': 'true' })
      captionNode.textContent = label
      wheel.append(captionNode)
    }
    const viewport = el('div', 'ty-wheel__viewport')
    viewport.append(el('span', 'ty-wheel__band', { 'aria-hidden': 'true' }))
    const list = el('div', 'ty-wheel__list', { role: 'listbox', tabindex: '0', 'aria-label': label })
    const state: Wheel = {
      column,
      rows,
      current: value,
      centre: 0,
      wheel,
      list,
      programmatic: false,
      settleTimer: undefined,
      programTimer: undefined,
      moved: false,
    }
    rows.forEach((row, index) => {
      const option = el('div', 'ty-wheel__row', { role: 'option', id: this.#rowId(column, index), 'aria-selected': String(row.id === value) })
      if (row.id === value) option.setAttribute('data-selected', '')
      option.textContent = row.text
      list.append(option)
    })
    viewport.append(list)
    wheel.append(viewport)

    list.addEventListener('scroll', () => this.#onScroll(state), { passive: true })
    list.addEventListener('keydown', (event) => this.#onKey(state, event))
    list.addEventListener('click', (event) => this.#onTap(state, event))
    list.addEventListener('focus', () => {
      try {
        if (list.matches(':focus-visible')) list.setAttribute('data-focus-visible', '')
      } catch {
        /* jsdom */
      }
    })
    list.addEventListener('blur', () => list.removeAttribute('data-focus-visible'))
    this.#drag(state)

    this.#wheels.push(state)
    return wheel
  }

  #rowId(column: number, index: number): string {
    return `${this.instanceId}-wheel-${column}-option-${index}`
  }

  #rowHeight(state: Wheel): number {
    return state.list.querySelector<HTMLElement>('[role="option"]')?.offsetHeight || DEFAULT_ROW
  }

  /** Centre `index` (clamped; -1 centres the first row) without reporting; `animate` glides unless reduced motion. */
  #place(state: Wheel, index: number, animate: boolean): void {
    const target = Math.max(0, index)
    state.centre = target
    this.#paint(state)
    const top = target * this.#rowHeight(state)
    const behavior: ScrollBehavior = !animate || prefersReducedMotion() ? 'instant' : 'smooth'
    state.programmatic = true
    clearTimeout(state.settleTimer)
    if (typeof state.list.scrollTo === 'function') state.list.scrollTo({ top, behavior })
    else state.list.scrollTop = top
    clearTimeout(state.programTimer)
    state.programTimer = setTimeout(() => {
      state.programmatic = false
    }, 400)
  }

  /** A user's choice of `index` (never while disabled): selects, glides to the row and reports a change. */
  #choose(state: Wheel, index: number): void {
    const row = state.rows[index]
    if (!row) return
    const changed = row.id !== state.current
    state.current = row.id
    this.#place(state, index, true)
    if (changed) this.emit('ty-change', { value: row.id, column: state.column })
  }

  /** Selection and distance emphasis on the rows, the band's active descendant on the list. */
  #paint(state: Wheel): void {
    state.list.querySelectorAll<HTMLElement>('[role="option"]').forEach((option, index) => {
      const selected = state.rows[index]?.id === state.current
      option.setAttribute('aria-selected', String(selected))
      if (selected) option.setAttribute('data-selected', '')
      else option.removeAttribute('data-selected')
      option.setAttribute('data-distance', String(Math.min(3, Math.abs(index - state.centre))))
    })
    if (state.rows.length) state.list.setAttribute('aria-activedescendant', this.#rowId(state.column, state.centre))
    else state.list.removeAttribute('aria-activedescendant')
  }

  #onScroll(state: Wheel): void {
    const at = Math.min(state.rows.length - 1, Math.max(0, Math.round(state.list.scrollTop / this.#rowHeight(state))))
    if (at !== state.centre) {
      if (!state.programmatic) tick()
      state.centre = at
      this.#paint(state)
    }
    if (state.programmatic) return
    clearTimeout(state.settleTimer)
    state.settleTimer = setTimeout(() => {
      const row = state.rows[at]
      if (row && row.id !== state.current) {
        if (this.props.disabled) return
        state.current = row.id
        this.#paint(state)
        tick()
        this.emit('ty-change', { value: row.id, column: state.column })
      }
    }, SETTLE_MS)
  }

  #onTap(state: Wheel, event: Event): void {
    const option = (event.target as Element | null)?.closest?.('[role="option"]')
    if (!option || !state.list.contains(option)) return
    if (state.moved) {
      state.moved = false
      return
    }
    if (this.props.disabled) return
    const index = Array.prototype.indexOf.call(state.list.children, option)
    if (index >= 0) this.#choose(state, index)
  }

  #onKey(state: Wheel, event: KeyboardEvent): void {
    if (!state.rows.length) return
    const current = state.rows.findIndex((row) => row.id === state.current)
    const last = state.rows.length - 1
    const from = Math.max(0, current)
    let target: number | undefined
    switch (event.key) {
      case 'ArrowUp':
        target = current < 0 ? 0 : Math.max(0, from - 1)
        break
      case 'ArrowDown':
        target = current < 0 ? 0 : Math.min(last, from + 1)
        break
      case 'PageUp':
        target = Math.max(0, from - this.#visibleRows())
        break
      case 'PageDown':
        target = Math.min(last, from + this.#visibleRows())
        break
      case 'Home':
        target = 0
        break
      case 'End':
        target = last
        break
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const key = event.key.toLocaleLowerCase()
          for (let step = 1; step <= state.rows.length; step++) {
            const index = (from + step) % state.rows.length
            if (state.rows[index]!.text.toLocaleLowerCase().startsWith(key)) {
              target = index
              break
            }
          }
        }
    }
    if (target === undefined) return
    event.preventDefault()
    if (this.props.disabled) return
    if (target === current) return
    this.#choose(state, target)
  }

  /** Pointer-drag scrolling for mouse and pen; touch scrolls natively. */
  #drag(state: Wheel): void {
    let start: { y: number; top: number } | null = null
    state.list.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch') return
      start = { y: event.clientY, top: state.list.scrollTop }
      state.moved = false
    })
    window.addEventListener(
      'pointermove',
      (event) => {
        if (!start) return
        const dy = event.clientY - start.y
        if (Math.abs(dy) > 4 && !state.moved) {
          state.moved = true
          state.wheel.setAttribute('data-dragging', '')
        }
        if (state.moved) state.list.scrollTop = start.top - dy
      },
      { signal: this.#drags.signal },
    )
    window.addEventListener(
      'pointerup',
      () => {
        start = null
        state.wheel.removeAttribute('data-dragging')
      },
      { signal: this.#drags.signal },
    )
  }
}
