import { TyElement } from '../base.ts'
import { notificationCenterDefinition } from './definition.ts'

/** One history entry, as the `notices` JSON carries it. */
export interface Notice {
  id: string
  tone: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  createdAt: number
}

/** Elements that may take keyboard focus inside the dialog. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Marker of the elements this element made inert (a host's own inert is left alone). */
const INERT_MARK = 'data-ty-notification-center-inert'

const SVG_NS = 'http://www.w3.org/2000/svg'

const TONES = new Set(['success', 'error', 'warning', 'info'])

/** Tone word prop per tone. */
const TONE_PROP = { success: 'toneSuccess', error: 'toneError', warning: 'toneWarning', info: 'toneInfo' } as const

type Paths = ReadonlyArray<readonly [string, Record<string, string>]>

/** Tone glyphs (lucide circle-check, circle-alert, triangle-alert, info). */
const TONE_PATHS: Record<Notice['tone'], Paths> = {
  success: [
    ['path', { d: 'M21.801 10A10 10 0 1 1 17 3.335' }],
    ['path', { d: 'm9 11 3 3L22 4' }],
  ],
  error: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['line', { x1: '12', x2: '12', y1: '8', y2: '12' }],
    ['line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }],
  ],
  warning: [
    ['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' }],
    ['path', { d: 'M12 9v4' }],
    ['path', { d: 'M12 17h.01' }],
  ],
  info: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M12 16v-4' }],
    ['path', { d: 'M12 8h.01' }],
  ],
}

/** The dismiss X (lucide `x`). */
const X_PATHS: Paths = [
  ['path', { d: 'M18 6 6 18' }],
  ['path', { d: 'm6 6 12 12' }],
]

/** Open drawers share one page scroll lock; the last one to close releases it. */
let scrollLocks = 0

const lockScroll = () => {
  if (++scrollLocks === 1) document.documentElement.setAttribute('data-ty-notification-center-open', '')
}
const unlockScroll = () => {
  if (scrollLocks > 0 && --scrollLocks === 0) document.documentElement.removeAttribute('data-ty-notification-center-open')
}

function el(tag: string, className: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

/** A decorative 24px icon (lucide strokes), as the definition renders the static ones. */
function icon(paths: Paths, className: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', className)
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  for (const [tag, attrs] of paths) {
    const node = document.createElementNS(SVG_NS, tag)
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
    svg.append(node)
  }
  return svg
}

/**
 * `<ty-notification-center>`. The host framework renders the anatomy (bell,
 * drawer with header, empty view, list container, polite status) from the
 * definition; the element adds what the declarative anatomy cannot (spec:
 * wave-2/notification-center.md):
 *
 * - **Composition** — the unseen CountBadge on the bell and the history
 *   entries in the list are composed from the `notices` JSON (newest
 *   first, capped at `history-limit`). A dismissal or a clear is reflected
 *   in the rendered history at once (a removed/cleared ledger, like the
 *   React provider's) and reported to the host (`ty-dismiss` / `ty-clear`),
 *   which owns the history and feeds the next `notices`.
 * - **Unseen count** — entries created since the drawer last opened; the
 *   bell's name carries it ("Notifications, 3 unread") and the badge shows
 *   it. Opening the drawer marks everything seen.
 * - **Modal behaviour** (the `<ty-modal>`/`<ty-drawer>` contract) — focus
 *   moves into the drawer on open and is trapped; Escape, the close button
 *   and a backdrop press ask to close (`ty-open-change`, `open: false`);
 *   the bell toggles (`open: true` while closed, `false` while open).
 *   Controlled: the host flips `open`. On close, focus returns to the bell.
 *   The page behind is `inert` and does not scroll while open
 *   (`data-ty-notification-center-open` on the root).
 * - **Focus after removal** — dismissing an entry moves focus to the next
 *   entry's dismiss button, else the previous one, else the drawer heading;
 *   clear all moves it to the heading. A recompose from a new `notices`
 *   (a toast arriving while the drawer is open) keeps focus on the entry
 *   it was on.
 *
 * The open animation is `data-entering`, applied after the first frame and
 * removed when it ends.
 */
export class TyNotificationCenterElement extends TyElement {
  static override definition = notificationCenterDefinition

  /** Entries dismissed here, waiting for the host's next `notices`. */
  #removed = new Set<string>()
  /** Entries created at or before this time were cleared here. */
  #clearedAt = Number.NEGATIVE_INFINITY
  /** When the drawer last opened: entries created later are unseen. */
  #seenAt = Number.NEGATIVE_INFINITY
  /** Unseen count of the previous compose (the badge flashes on a rise). */
  #lastUnseen: number | null = null
  /** The entries of the latest compose (focus keeps its entry across one). */
  #rendered: Notice[] = []
  #wasOpen = false
  #returnFocus: HTMLElement | null = null
  #inerted: Element[] = []
  #pressOnBackdrop = false
  /** Dismiss index to focus after the compose it triggered (-1: the heading). */
  #pendingFocus: number | null = null

  protected override connected(): void {
    this.addEventListener('keydown', this.#onKeydown)
    this.addEventListener('mousedown', this.#onMousedown)
    this.addEventListener('click', this.#onClick)
    if (this.props.open) this.#activate()
  }

  protected override disconnected(): void {
    this.removeEventListener('keydown', this.#onKeydown)
    this.removeEventListener('mousedown', this.#onMousedown)
    this.removeEventListener('click', this.#onClick)
    this.#deactivate(true)
  }

  protected override changed(): void {
    if (!this.isConnected) return
    if (this.props.open) this.#activate()
    else this.#deactivate(true)
  }

  override sync(): void {
    super.sync()
    if (this.anatomyRoot()) this.#compose()
  }

  // --- Data ------------------------------------------------------------

  /** The parsed `notices` JSON (malformed entries are skipped). */
  #notices(): Notice[] {
    const raw = this.getAttribute('notices')
    if (!raw) return []
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.warn('ty-notification-center: `notices` is not valid JSON.')
      return []
    }
    if (!Array.isArray(parsed)) return []
    const notices: Notice[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const { id, tone, title, message, createdAt } = item as Record<string, unknown>
      if ((typeof id !== 'string' && typeof id !== 'number') || typeof title !== 'string' || !title) continue
      notices.push({
        id: String(id),
        tone: TONES.has(String(tone)) ? (String(tone) as Notice['tone']) : 'info',
        title,
        message: typeof message === 'string' && message ? message : undefined,
        createdAt: typeof createdAt === 'number' && Number.isFinite(createdAt) ? createdAt : 0,
      })
    }
    return notices
  }

  /** The rendered history: the ledger applied, capped at `history-limit`. */
  #entries(): Notice[] {
    const raw = Number(this.props.historyLimit)
    const limit = Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 50
    return this.#notices()
      .filter((n) => n.createdAt > this.#clearedAt && !this.#removed.has(n.id))
      .slice(0, limit)
  }

  /** Entries created since the drawer last opened; none while it is open. */
  #unseen(entries: Notice[]): number {
    if (this.props.open) return 0
    return entries.filter((n) => n.createdAt > this.#seenAt).length
  }

  #unreadPhrase(count: number): string {
    return String(this.props.unreadLabel).replace('{count}', String(count))
  }

  /** Localised "5 minutes ago" style phrase (the React relativeNoticeTime). */
  #time(createdAt: number): string {
    const p = this.props
    const minutes = Math.floor(Math.max(0, Date.now() - createdAt) / 60000)
    if (minutes < 1) return String(p.timeJustNow)
    if (minutes < 60) return String(p.timeMinutesAgo).replace('{count}', String(minutes))
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return String(p.timeHoursAgo).replace('{count}', String(hours))
    return String(p.timeDaysAgo).replace('{count}', String(Math.floor(hours / 24)))
  }

  // --- Composition -------------------------------------------------------

  /** Bring the badge, the bell's name and the entries in step with `notices`. */
  #compose(): void {
    const p = this.props
    const entries = this.#entries()
    const unseen = this.#unseen(entries)
    const trigger = this.querySelector('.ty-notification-center__trigger')
    if (trigger) {
      if (p.open) trigger.setAttribute('aria-expanded', 'true')
      else trigger.removeAttribute('aria-expanded')
      const name = unseen > 0 ? `${String(p.bellLabel)}, ${this.#unreadPhrase(unseen)}` : String(p.bellLabel)
      if (trigger.getAttribute('aria-label') !== name) trigger.setAttribute('aria-label', name)
    }
    this.#composeBadge(unseen)
    const clear = this.querySelector<HTMLElement>('.ty-notification-center__clear')
    if (clear) clear.hidden = entries.length === 0
    const empty = this.querySelector<HTMLElement>('.ty-notification-center__empty')
    if (empty) empty.hidden = entries.length > 0
    const list = this.querySelector<HTMLElement>('.ty-notification-center__list')
    if (list) {
      list.hidden = entries.length === 0
      this.#fillList(list, entries)
    }
    this.#lastUnseen = unseen
  }

  /** The unseen CountBadge pinned to the bell (the React CountBadge's markup). */
  #composeBadge(unseen: number): void {
    const bell = this.querySelector('.ty-notification-center__bell')
    if (!bell) return
    let badge = bell.querySelector<HTMLElement>('.ty-count-badge')
    if (unseen <= 0) {
      badge?.remove()
      return
    }
    if (!badge) {
      badge = el('span', 'ty-count-badge', { 'data-tone': 'attention' })
      badge.append(el('span', 'ty-count-badge__value', { 'aria-hidden': 'true' }), el('span', 'ty-visually-hidden'))
      bell.append(badge)
    }
    // Locale digits and the "99+" cap are the service's formatting; the
    // attribute carries plain digits.
    badge.querySelector('.ty-count-badge__value')!.textContent = unseen > 99 ? '99+' : String(unseen)
    badge.querySelector('.ty-visually-hidden')!.textContent = this.#unreadPhrase(unseen)
    if (this.#lastUnseen !== null && unseen > this.#lastUnseen) {
      badge.setAttribute('data-changed', '')
      badge.addEventListener('animationend', () => badge.removeAttribute('data-changed'), { once: true })
    }
  }

  /** One history entry: tone glyph, tone word, title, message, time, dismiss. */
  #entry(notice: Notice): HTMLElement {
    const p = this.props
    const li = el('li', 'ty-notification-center__entry', { 'data-tone': notice.tone })
    li.append(icon(TONE_PATHS[notice.tone], 'ty-icon ty-notification-center__glyph'))
    const text = el('div', 'ty-notification-center__text')
    const tone = el('p', 'ty-notification-center__tone')
    tone.textContent = String(p[TONE_PROP[notice.tone]])
    const title = el('p', 'ty-notification-center__title')
    title.textContent = notice.title
    text.append(tone, title)
    if (notice.message) {
      const message = el('p', 'ty-notification-center__message')
      message.textContent = notice.message
      text.append(message)
    }
    const time = el('p', 'ty-notification-center__time')
    time.textContent = this.#time(notice.createdAt)
    text.append(time)
    const dismiss = el('button', 'ty-button ty-notification-center__dismiss', {
      type: 'button',
      'aria-label': String(p.dismissLabel).replace('{title}', notice.title),
      'data-variant': 'quiet',
      'data-size': 'compact',
      'data-shape': 'circle',
      'data-icon-only': '',
    })
    const wrap = el('span', 'ty-button__icon', { 'aria-hidden': 'true' })
    wrap.append(icon(X_PATHS, 'ty-icon'))
    dismiss.append(wrap)
    li.append(text, dismiss)
    return li
  }

  #dismissAt(list: Element, index: number): HTMLElement | null {
    return list.children[index]?.querySelector<HTMLElement>('.ty-notification-center__dismiss') ?? null
  }

  /** Refill the list, keeping focus on its entry (or moving it after a dismissal). */
  #fillList(list: Element, entries: Notice[]): void {
    const active = document.activeElement
    let refocus: number | null = null
    if (active && list.contains(active)) {
      const li = (active as Element).closest?.('.ty-notification-center__entry')
      const index = li ? Array.from(list.children).indexOf(li as Element) : -1
      const id = index >= 0 ? this.#rendered[index]?.id : undefined
      if (id !== undefined) {
        const next = entries.findIndex((n) => n.id === id)
        if (next >= 0) refocus = next
      }
    }
    list.replaceChildren(...entries.map((n) => this.#entry(n)))
    this.#rendered = entries
    if (this.#pendingFocus !== null) {
      const index = this.#pendingFocus
      this.#pendingFocus = null
      const target =
        index >= 0 && entries.length > 0
          ? this.#dismissAt(list, Math.min(index, entries.length - 1))
          : this.querySelector<HTMLElement>('.ty-notification-center__heading')
      target?.focus()
    } else if (refocus !== null) {
      this.#dismissAt(list, refocus)?.focus()
    }
  }

  // --- Dismiss and clear --------------------------------------------------

  /** Drop one entry from the rendered history and report it (the host owns the data). */
  #dismiss(index: number): void {
    const entry = this.#entries()[index]
    if (!entry) return
    this.#removed.add(entry.id)
    this.emit('ty-dismiss', { id: entry.id })
    this.#pendingFocus = index
    this.#compose()
  }

  /** Empty the rendered history, announce it politely and report it. */
  #clear(): void {
    this.#clearedAt = Date.now()
    this.#removed.clear()
    this.emit('ty-clear')
    this.#pendingFocus = -1
    const status = this.querySelector('.ty-notification-center__status')
    if (status) {
      // A fresh text node after clearing makes screen readers repeat identical messages.
      status.textContent = ''
      const text = String(this.props.clearedLabel)
      queueMicrotask(() => {
        status.textContent = text
      })
    }
    this.#compose()
  }

  // --- Open and close (controlled; the modal contract) --------------------

  /** Ask the host to change visibility; the host flips `open`. */
  #requestOpen(open: boolean): void {
    this.emit('ty-open-change', { open })
  }

  #dialog(): HTMLElement | null {
    return this.querySelector('.ty-notification-center__dialog')
  }

  #backdrop(): HTMLElement | null {
    return this.querySelector('.ty-notification-center__backdrop')
  }

  #tabbables(): HTMLElement[] {
    const dialog = this.#dialog()
    if (!dialog) return []
    return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((node) => !node.closest('[hidden]'))
  }

  #activate(): void {
    if (this.#wasOpen) return
    this.#wasOpen = true
    // Opening marks everything seen.
    this.#seenAt = Date.now()
    const active = document.activeElement
    this.#returnFocus = active instanceof HTMLElement && !this.contains(active) ? active : this.querySelector('.ty-notification-center__trigger')
    lockScroll()
    this.#applyInert()
    // The anatomy may land a beat after the `open` attribute (a framework
    // commits children and host attributes separately), so focus and the
    // entering animation wait a frame.
    requestAnimationFrame(() => {
      if (!this.isConnected || !this.props.open) return
      this.#focusInitial()
      for (const part of this.querySelectorAll('.ty-notification-center__backdrop, .ty-notification-center__drawer')) {
        part.setAttribute('data-entering', '')
        part.addEventListener('animationend', () => part.removeAttribute('data-entering'), { once: true })
      }
    })
  }

  #deactivate(restoreFocus: boolean): void {
    if (!this.#wasOpen) return
    this.#wasOpen = false
    unlockScroll()
    for (const element of this.#inerted) {
      if (element.getAttribute(INERT_MARK) !== null) {
        element.removeAttribute('inert')
        element.removeAttribute(INERT_MARK)
      }
    }
    this.#inerted = []
    const target = this.#returnFocus
    this.#returnFocus = null
    // Focus returns to the bell (or to what had it, if that was outside);
    // the return waits a frame, like the modal's.
    if (restoreFocus && target?.isConnected) {
      requestAnimationFrame(() => {
        if (target.isConnected) target.focus()
      })
    }
  }

  /** Everything between this element and `<body>` gets inert siblings. */
  #applyInert(): void {
    let node: Element | null = this
    while (node && node !== document.body) {
      const parent: Element | null = node.parentElement
      if (!parent) break
      for (const sibling of Array.from(parent.children)) {
        if (sibling === node || sibling.hasAttribute('inert')) continue
        sibling.setAttribute('inert', '')
        sibling.setAttribute(INERT_MARK, '')
        this.#inerted.push(sibling)
      }
      node = parent
    }
  }

  #focusInitial(): void {
    const dialog = this.#dialog()
    if (!dialog) return
    const active = document.activeElement
    if (active instanceof HTMLElement && dialog.contains(active)) return
    const heading = this.querySelector<HTMLElement>('.ty-notification-center__heading')
    ;(this.#tabbables()[0] ?? heading ?? dialog).focus()
  }

  #onKeydown = (event: Event): void => {
    const key = (event as KeyboardEvent).key
    if (key === 'Escape') {
      if ((event as KeyboardEvent).isComposing || !this.props.open) return
      event.preventDefault()
      event.stopPropagation()
      this.#requestOpen(false)
      return
    }
    if (key !== 'Tab' || !this.props.open) return
    const dialog = this.#dialog()
    if (!dialog) return
    event.preventDefault()
    event.stopPropagation()
    const tabbables = this.#tabbables()
    const backwards = (event as KeyboardEvent).shiftKey
    if (!tabbables.length) {
      dialog.focus()
      return
    }
    const current = tabbables.indexOf(document.activeElement as HTMLElement)
    const next = current === -1 ? (backwards ? tabbables.length - 1 : 0) : (current + (backwards ? -1 : 1) + tabbables.length) % tabbables.length
    tabbables[next]!.focus()
  }

  #onMousedown = (event: Event): void => {
    this.#pressOnBackdrop = event.target === this.#backdrop()
    // Keep focus inside the dialog: a press on the backdrop must not move focus to the body.
    if (this.#pressOnBackdrop) event.preventDefault()
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element | null
    if (!target || typeof target.closest !== 'function') return
    const trigger = target.closest('.ty-notification-center__trigger')
    if (trigger && this.contains(trigger)) {
      this.#requestOpen(!this.props.open)
      return
    }
    const close = target.closest('.ty-notification-center__close')
    if (close && this.contains(close)) {
      this.#requestOpen(false)
      return
    }
    const clear = target.closest('.ty-notification-center__clear')
    if (clear && this.contains(clear)) {
      this.#clear()
      return
    }
    const dismiss = target.closest('.ty-notification-center__dismiss')
    if (dismiss && this.contains(dismiss)) {
      const list = this.querySelector('.ty-notification-center__list')
      const li = dismiss.closest('.ty-notification-center__entry')
      const index = list && li ? Array.from(list.children).indexOf(li as Element) : -1
      if (index >= 0) this.#dismiss(index)
      return
    }
    if (target === this.#backdrop() && this.#pressOnBackdrop) this.#requestOpen(false)
    this.#pressOnBackdrop = false
  }
}
