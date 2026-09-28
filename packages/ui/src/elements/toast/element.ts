import { TyElement } from '../base.ts'
import { toastDefinition } from './definition.ts'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

/** Options of `show()` and the tone shortcuts — the React ToastOptions. */
export interface ToastOptions {
  tone?: ToastTone
  title: string
  message?: string
  /** One optional action, such as "Undo"; makes the toast persistent by default (WCAG 2.2.1). */
  action?: { label: string; onPress?: () => void }
  /** Auto-dismiss time in ms, or persistent. Errors and toasts with actions default to persistent. */
  duration?: number | 'persistent'
  /** A later call with the same id replaces this toast in place. */
  id?: string
}

/** A queued or past toast (the React ToastRecord). */
export interface ToastRecord {
  id: string
  tone: ToastTone
  title: string
  message?: string
  action?: { label: string; onPress?: () => void }
  duration: number | 'persistent'
  createdAt: number
}

type ShortcutOptions = Omit<ToastOptions, 'title' | 'tone'>

interface TimerEntry {
  handle?: ReturnType<typeof setTimeout>
  remaining: number
  startedAt: number
}

/** Default auto-dismiss times (ms) per tone; errors never auto-dismiss. */
const DURATIONS: Record<ToastTone, number | 'persistent'> = {
  success: 5000,
  info: 5000,
  warning: 8000,
  error: 'persistent',
}

const SVG = 'http://www.w3.org/2000/svg'

let counter = 0

function el(tag: string, className: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

/** A decorative 24px lucide glyph (ISC, THIRD_PARTY_NOTICES). */
function glyphIcon(className: string, children: ReadonlyArray<readonly [string, Record<string, string>]>): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('class', className)
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  for (const [tag, attrs] of children) {
    const node = document.createElementNS(SVG, tag)
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
    svg.append(node)
  }
  return svg
}

/** The tone icons Toast.tsx composes from lucide-react. */
const TONE_ICONS: Record<ToastTone, () => SVGSVGElement> = {
  success: () => glyphIcon('ty-toast__icon', [['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'm16 9-5.5 5.5L8 12' }]]),
  error: () =>
    glyphIcon('ty-toast__icon', [
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['line', { x1: '12', x2: '12', y1: '8', y2: '12' }],
      ['line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }],
    ]),
  warning: () =>
    glyphIcon('ty-toast__icon', [
      ['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }],
      ['path', { d: 'M12 9v4' }],
      ['path', { d: 'M12 17h.01' }],
    ]),
  info: () => glyphIcon('ty-toast__icon', [['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'M12 16v-4' }], ['path', { d: 'M12 8h.01' }]]),
}

const closeIcon = () => glyphIcon('ty-icon', [['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]])

/**
 * Arrival tick (the Haptics utility): silent without the Vibration API,
 * under reduced motion and before the page has had a user gesture.
 */

// Browsers ignore navigator.vibrate before a user gesture; where the User
// Activation API is missing, a first pointer, touch or key press opens the gate.
let gestureSeen = false
const GESTURES = ['pointerdown', 'touchstart', 'keydown', 'mousedown'] as const

function onGesture(): void {
  gestureSeen = true
  for (const type of GESTURES) window.removeEventListener(type, onGesture, true)
}

if (typeof window !== 'undefined') {
  for (const type of GESTURES) window.addEventListener(type, onGesture, { capture: true, passive: true })
}

function arrivalHaptic(): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
    const activated = activation && typeof activation.hasBeenActive === 'boolean' ? activation.hasBeenActive || gestureSeen : gestureSeen
    if (!activated) return
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    navigator.vibrate(8)
  } catch {
    /* unsupported */
  }
}

function num(value: unknown): number | undefined {
  if (value === undefined || value === false || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

/**
 * `<ty-toast>`. Self-rendering: the element owns its whole subtree — the
 * fixed region landmark, its two live-region lists (assertive `role="alert"`
 * for errors, polite `role="status"` for the rest; live regions are not
 * nested) and the toasts themselves. Frameworks render an empty host and
 * drive the element through the imperative API, the spec's hook:
 *
 * - `show(options)` queues a toast (tone default `info`; duration default
 *   tone-dependent — 5 s success/info, 8 s warning — or persistent for
 *   errors and toasts with an action). A call with an existing `id` replaces
 *   the toast in place. Returns the id.
 * - `success` / `error` / `warning` / `info(title, options)` shortcuts.
 * - `dismiss(id)` removes a toast and emits `ty-toast-dismiss`.
 * - `history` is the past toasts, newest first, capped at `history-limit`.
 *
 * At most `max-visible` toasts show; the rest wait in the queue. The
 * auto-dismiss timer pauses while the pointer is over the region, focus is
 * inside it or the window is hidden. A toast never takes focus when shown;
 * F6 moves focus into the region and back out, Escape inside a focused toast
 * dismisses it, and when the last toast closes while focused, focus returns
 * to where it was. A touch swipe toward the edge dismisses (never the only
 * way: the dismiss button and Escape always work).
 */
export class TyToastElement extends TyElement {
  static override definition = toastDefinition

  #queue: ToastRecord[] = []
  #history: ToastRecord[] = []
  #timers = new Map<string, TimerEntry>()
  #pauseReasons = new Set<string>()
  #region: HTMLElement | null = null
  #assertive: HTMLElement | null = null
  #polite: HTMLElement | null = null
  /** Visible toasts by id, for keyed reuse across renders (focus survives a queue change). */
  #items = new Map<string, { node: HTMLElement; record: ToastRecord }>()
  #returnFocus: HTMLElement | null = null
  #documentListeners: AbortController | null = null

  /** Queue a toast (or replace it, on an existing `id`); returns the id. */
  show(options: ToastOptions): string {
    const tone = options.tone ?? 'info'
    const id = options.id ?? `ty-toast-${++counter}`
    const duration = options.duration ?? (options.action ? 'persistent' : DURATIONS[tone])
    const record: ToastRecord = {
      id,
      tone,
      title: options.title,
      message: options.message,
      action: options.action,
      duration,
      createdAt: Date.now(),
    }
    this.#clearTimer(id)
    this.#queue = this.#queue.some((t) => t.id === id) ? this.#queue.map((t) => (t.id === id ? record : t)) : [...this.#queue, record]
    const limit = num(this.props.historyLimit) ?? 50
    this.#history = [record, ...this.#history.filter((t) => t.id !== id)].slice(0, Math.max(0, limit))
    // Silent before any user gesture (a toast can appear on its own).
    arrivalHaptic()
    this.#render()
    return id
  }

  success(title: string, options: ShortcutOptions = {}): string {
    return this.show({ ...options, title, tone: 'success' })
  }

  error(title: string, options: ShortcutOptions = {}): string {
    return this.show({ ...options, title, tone: 'error' })
  }

  warning(title: string, options: ShortcutOptions = {}): string {
    return this.show({ ...options, title, tone: 'warning' })
  }

  info(title: string, options: ShortcutOptions = {}): string {
    return this.show({ ...options, title, tone: 'info' })
  }

  /** Remove a toast (no-op for an unknown id) and announce the dismissal. */
  dismiss(id: string): void {
    if (!this.#queue.some((t) => t.id === id)) return
    this.#clearTimer(id)
    const focusedInside = !!this.#region && this.#region.contains(document.activeElement)
    const last = this.#visible().length === 1
    this.#queue = this.#queue.filter((t) => t.id !== id)
    this.emit('ty-toast-dismiss', { id })
    this.#render()
    // When the last toast closes while focused, focus returns to where it
    // was before entering the region (after the removal has settled).
    if (focusedInside && last) {
      const target = this.#returnFocus
      setTimeout(() => {
        if (target?.isConnected) target.focus()
      }, 0)
    }
  }

  /** Past toasts, newest first (feeds the notification history). */
  get history(): readonly ToastRecord[] {
    return this.#history
  }

  protected override connected(): void {
    const region = el('section', 'ty-toast-region')
    const assertive = el('div', 'ty-toast-region__list', { role: 'alert', 'aria-live': 'assertive', 'aria-atomic': 'false' })
    const polite = el('div', 'ty-toast-region__list', { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'false' })
    region.append(assertive, polite)
    this.replaceChildren(region)
    this.#region = region
    this.#assertive = assertive
    this.#polite = polite
    this.#items.clear()

    region.addEventListener('pointerenter', this.#onPointerEnter)
    region.addEventListener('pointerleave', this.#onPointerLeave)
    region.addEventListener('focusin', this.#onFocusIn)
    region.addEventListener('focusout', this.#onFocusOut)

    const controller = new AbortController()
    this.#documentListeners = controller
    document.addEventListener('keydown', this.#onDocumentKeydown, { signal: controller.signal })
    document.addEventListener('visibilitychange', this.#onVisibilityChange, { signal: controller.signal })

    this.#render()
  }

  protected override disconnected(): void {
    this.#documentListeners?.abort()
    this.#documentListeners = null
    for (const entry of this.#timers.values()) if (entry.handle) clearTimeout(entry.handle)
    this.#timers.clear()
    this.#pauseReasons.clear()
    this.#region = null
    this.#assertive = null
    this.#polite = null
    this.#items.clear()
    this.#returnFocus = null
  }

  protected override changed(): void {
    if (this.isConnected) this.#render()
  }

  #visible(): ToastRecord[] {
    return this.#queue.slice(0, Math.max(0, num(this.props.maxVisible) ?? 3))
  }

  /** Bring the region's attributes and the visible toasts in step with the props and the queue. */
  #render(): void {
    const region = this.#region
    if (!region) return
    const props = this.props
    region.setAttribute('aria-label', String(props.regionLabel))
    region.setAttribute('data-placement', String(props.placement))
    const dismissLabel = String(props.dismissLabel)

    const visible = this.#visible()
    // Arm the timers of newly visible, non-persistent toasts.
    for (const t of visible) {
      if (t.duration !== 'persistent' && !this.#timers.has(t.id)) this.#arm(t.id, t.duration)
    }

    const seen = new Set<string>()
    for (const record of visible) {
      seen.add(record.id)
      let item = this.#items.get(record.id)
      if (item && item.record !== record) {
        // Replaced in place (a show() with the same id): rebuild the node,
        // keeping focus if the old one held it.
        const hadFocus = item.node.contains(document.activeElement)
        const node = this.#build(record)
        item.node.replaceWith(node)
        item = { node, record }
        this.#items.set(record.id, item)
        if (hadFocus) node.focus()
      } else if (!item) {
        item = { node: this.#build(record), record }
        this.#items.set(record.id, item)
      }
      const dismiss = item.node.querySelector('.ty-toast__dismiss')
      if (dismiss) {
        dismiss.setAttribute('aria-label', dismissLabel)
        dismiss.setAttribute('title', dismissLabel)
      }
      // Appending moves the node; iterating the queue in order keeps each
      // list's order (errors in the assertive list, the rest in the polite).
      ;(record.tone === 'error' ? this.#assertive : this.#polite)!.append(item.node)
    }
    for (const [id, item] of [...this.#items]) {
      if (!seen.has(id)) {
        item.node.remove()
        this.#items.delete(id)
      }
    }
  }

  /** A toast: tone icon, title, optional message, optional action, dismiss button (Toast.tsx's ToastItem). */
  #build(record: ToastRecord): HTMLElement {
    const item = el('div', 'ty-toast', {
      'data-tone': record.tone,
      tabindex: '0',
      role: 'group',
      'aria-labelledby': `${record.id}-title`,
    })
    if (record.message) item.setAttribute('aria-describedby', `${record.id}-message`)
    item.append(TONE_ICONS[record.tone]())

    const body = el('div', 'ty-toast__body')
    const title = el('p', 'ty-toast__title', { id: `${record.id}-title` })
    title.textContent = record.title
    body.append(title)
    if (record.message) {
      const message = el('p', 'ty-toast__message', { id: `${record.id}-message` })
      message.textContent = record.message
      body.append(message)
    }
    if (record.action) {
      const actions = el('div', 'ty-toast__actions')
      const button = el('button', 'ty-button', { type: 'button', 'data-variant': 'secondary', 'data-size': 'compact' })
      const label = el('span', 'ty-button__label')
      label.textContent = record.action.label
      button.append(label)
      button.addEventListener('click', () => {
        record.action?.onPress?.()
        this.emit('ty-toast-action', { id: record.id })
        this.dismiss(record.id)
      })
      actions.append(button)
      body.append(actions)
    }

    const dismissLabel = String(this.props.dismissLabel)
    const dismiss = el('button', 'ty-button ty-toast__dismiss', {
      type: 'button',
      'data-variant': 'quiet',
      'data-size': 'compact',
      'data-icon-only': '',
      'aria-label': dismissLabel,
      title: dismissLabel,
    })
    const iconWrap = el('span', 'ty-button__icon', { 'aria-hidden': 'true' })
    iconWrap.append(closeIcon())
    dismiss.append(iconWrap)
    dismiss.addEventListener('click', () => this.dismiss(record.id))

    item.append(body, dismiss)

    item.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key !== 'Escape') return
      event.stopPropagation()
      this.dismiss(record.id)
    })

    // A touch swipe toward the edge dismisses (never the only way).
    let swipe: { x: number; id: number } | null = null
    let offset = 0
    item.addEventListener('pointerdown', (event) => {
      const e = event as PointerEvent
      if (e.pointerType === 'touch') swipe = { x: e.clientX, id: e.pointerId }
    })
    item.addEventListener('pointermove', (event) => {
      const e = event as PointerEvent
      if (swipe && swipe.id === e.pointerId) {
        offset = Math.max(0, e.clientX - swipe.x)
        item.style.transform = offset ? `translateX(${offset}px)` : ''
      }
    })
    const endSwipe = () => {
      if (swipe && offset > 80) this.dismiss(record.id)
      swipe = null
      offset = 0
      item.style.transform = ''
    }
    item.addEventListener('pointerup', endSwipe)
    item.addEventListener('pointercancel', endSwipe)

    return item
  }

  #clearTimer(id: string): void {
    const entry = this.#timers.get(id)
    if (entry?.handle) clearTimeout(entry.handle)
    this.#timers.delete(id)
  }

  #arm(id: string, ms: number): void {
    const entry: TimerEntry = { remaining: ms, startedAt: Date.now() }
    if (this.#pauseReasons.size === 0) entry.handle = setTimeout(() => this.dismiss(id), ms)
    this.#timers.set(id, entry)
  }

  #pause(reason: string): void {
    const wasRunning = this.#pauseReasons.size === 0
    this.#pauseReasons.add(reason)
    if (!wasRunning) return
    for (const entry of this.#timers.values()) {
      if (entry.handle) {
        clearTimeout(entry.handle)
        entry.handle = undefined
        entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt))
      }
    }
  }

  #resume(reason: string): void {
    if (!this.#pauseReasons.delete(reason) || this.#pauseReasons.size > 0) return
    for (const [id, entry] of this.#timers) {
      entry.startedAt = Date.now()
      entry.handle = setTimeout(() => this.dismiss(id), entry.remaining)
    }
  }

  #onPointerEnter = (): void => this.#pause('hover')

  #onPointerLeave = (): void => this.#resume('hover')

  #onFocusIn = (event: FocusEvent): void => {
    if (this.#region?.contains(event.relatedTarget as Node | null)) return
    if (event.relatedTarget instanceof HTMLElement) this.#returnFocus = event.relatedTarget
    this.#pause('focus')
  }

  #onFocusOut = (event: FocusEvent): void => {
    if (!this.#region?.contains(event.relatedTarget as Node | null)) this.#resume('focus')
  }

  /** F6 moves focus to the region (and back out of it). */
  #onDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'F6' || !this.#region) return
    const region = this.#region
    if (region.contains(document.activeElement)) {
      this.#returnFocus?.focus()
    } else if (region.querySelector('.ty-toast')) {
      event.preventDefault()
      this.#returnFocus = document.activeElement as HTMLElement | null
      region.querySelector<HTMLElement>('.ty-toast')?.focus()
    }
  }

  /** The auto-dismiss timer pauses while the window is hidden. */
  #onVisibilityChange = (): void => {
    if (document.hidden) this.#pause('hidden')
    else this.#resume('hidden')
  }
}
