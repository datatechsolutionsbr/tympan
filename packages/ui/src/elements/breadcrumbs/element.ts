import { TyElement } from '../base.ts'
import { breadcrumbsDefinition } from './definition.ts'

interface BreadcrumbItem {
  label: string
  href: string
}

type Entry = { kind: 'item'; item: BreadcrumbItem; index: number } | { kind: 'overflow'; items: BreadcrumbItem[] }

/** The trail entries with the middle collapsed into one overflow (the React Breadcrumbs' `visibleEntries`). */
function visibleEntries(items: BreadcrumbItem[], maxVisible?: number): Entry[] {
  const all: Entry[] = items.map((item, index) => ({ kind: 'item', item, index }))
  if (!maxVisible || items.length <= maxVisible || maxVisible < 2) return all
  const tail = maxVisible - 1
  return [all[0]!, { kind: 'overflow', items: items.slice(1, items.length - tail) }, ...all.slice(items.length - tail)]
}

/** Parses the JSON `items` attribute; malformed data warns and renders an empty trail. */
function parseItems(raw: string | null): BreadcrumbItem[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    return parsed.filter(
      (entry): entry is BreadcrumbItem =>
        typeof entry === 'object' && entry !== null && typeof (entry as BreadcrumbItem).label === 'string' && typeof (entry as BreadcrumbItem).href === 'string',
    )
  } catch {
    console.warn('ty-breadcrumbs: `items` is not a JSON array of { label, href }.')
    return []
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg'

function el(tag: string, className: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag)
  if (className) node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

/** A decorative 24px icon (lucide strokes, ISC, THIRD_PARTY_NOTICES). */
function icon(className: string, glyphs: Array<[tag: string, attrs: Record<string, string>]>): SVGSVGElement {
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
  for (const [tag, attrs] of glyphs) {
    const glyph = document.createElementNS(SVG_NS, tag)
    for (const [name, value] of Object.entries(attrs)) glyph.setAttribute(name, value)
    svg.append(glyph)
  }
  return svg
}

const separatorIcon = () => icon('ty-icon ty-mirror-rtl ty-breadcrumbs__separator', [['path', { d: 'm9 18 6-6-6-6' }]])
const backIcon = () => icon('ty-icon ty-mirror-rtl', [['path', { d: 'm12 19-7-7 7-7' }], ['path', { d: 'M19 12H5' }]])
const ellipsisIcon = () =>
  icon('ty-icon', [
    ['circle', { cx: '12', cy: '12', r: '1' }],
    ['circle', { cx: '19', cy: '12', r: '1' }],
    ['circle', { cx: '5', cy: '12', r: '1' }],
  ])

/**
 * `<ty-breadcrumbs>`. The host framework renders the anatomy (the labelled
 * navigation landmark, the trail's list, the compact bar with its slots)
 * and the stylesheet paints it; the element composes what the declarative
 * anatomy cannot express — the skeleton preset precedent: composition fills
 * containers the anatomy rendered empty, and everything composed is
 * recomposed wholesale on change, never moving a node the framework owns.
 *
 * - **Trail** — the `items` (a JSON attribute) become the ordered list: a
 *   subtle link per ancestor, the current page as static text marked
 *   `aria-current="page"`, decorative chevrons between entries, and the
 *   middle collapsed into a native `<details>` overflow menu past
 *   `maxVisible` (the first and the last `maxVisible - 1` stay visible).
 * - **Compact bar** — a single back link to the parent (or to `rootHref`
 *   with one item), named from the `backLabel` template ("Back to
 *   {parent}"), and the current label as the centred title.
 * - **Mode** — `auto` resolves live against the 640 px breakpoint (§2.8):
 *   the resolved mode lands on `data-mode` and the unused container is
 *   `hidden`.
 * - **Navigation** — activating any composed link emits a cancelable
 *   `ty-navigate` with the href: a host with a client-side router prevents
 *   the default and navigates through its adapter; uncanceled, the native
 *   anchor navigates.
 *
 * The first composition runs after the first paint, so the upgrade never
 * rewrites the rendered anatomy (see <ty-text-field>); attribute changes
 * compose at once.
 */
export class TyBreadcrumbsElement extends TyElement {
  static override definition = breadcrumbsDefinition

  /** False until the first paint: nothing is composed during the upgrade the parity renderers compare. */
  #ready = false
  /** `auto` resolves against the small breakpoint (§2.8). */
  #media: MediaQueryList | null = null

  override sync(): void {
    super.sync()
    if (this.#ready) this.#compose()
  }

  protected override connected(): void {
    this.addEventListener('click', this.#onClick)
    this.#media = typeof matchMedia === 'undefined' ? null : matchMedia('(min-width: 640px)')
    this.#media?.addEventListener('change', this.#onMedia)
    requestAnimationFrame(() => {
      if (!this.isConnected) return
      this.#ready = true
      this.#compose()
    })
  }

  protected override disconnected(): void {
    this.removeEventListener('click', this.#onClick)
    this.#media?.removeEventListener('change', this.#onMedia)
    this.#media = null
  }

  #onMedia = (): void => {
    if (this.#ready) this.#compose()
  }

  /** A composed link's activation goes through the host's router adapter (`ty-navigate`, cancelable). */
  #onClick = (event: Event): void => {
    const target = event.target as Element | null
    const anchor = target && typeof target.closest === 'function' ? target.closest('a[href]') : null
    if (!anchor || !this.contains(anchor)) return
    const href = anchor.getAttribute('href')!
    if (!this.emit('ty-navigate', { href })) event.preventDefault()
  }

  #compose(): void {
    const root = this.anatomyRoot()
    if (!root) return
    const props = this.props
    const mode = String(props.mode)
    const compact = mode === 'compact' || (mode === 'auto' && !(this.#media?.matches ?? true))
    const resolved = compact ? 'compact' : 'trail'
    if (root.getAttribute('data-mode') !== resolved) root.setAttribute('data-mode', resolved)
    const list = root.querySelector('.ty-breadcrumbs__list')
    const bar = root.querySelector('.ty-breadcrumbs__bar')
    list?.toggleAttribute('hidden', compact)
    bar?.toggleAttribute('hidden', !compact)
    const items = parseItems(this.getAttribute('items'))
    if (!compact && list) this.#composeTrail(list, items)
    if (compact && bar) this.#composeBar(bar, items)
  }

  /** The ordered trail: links, the static current page, separators and the overflow menu. */
  #composeTrail(list: Element, items: BreadcrumbItem[]): void {
    const max = Number(this.props.maxVisible ?? 0)
    const entries = visibleEntries(items, max || undefined)
    const nodes: HTMLElement[] = []
    entries.forEach((entry, index) => {
      const li = el('li', 'ty-breadcrumbs__item')
      if (entry.kind === 'overflow') {
        li.append(this.#overflow(entry.items))
      } else if (entry.index === items.length - 1) {
        const current = el('span', 'ty-breadcrumbs__current', { 'aria-current': 'page', title: entry.item.label })
        current.textContent = entry.item.label
        li.append(current)
      } else {
        const link = el('a', 'ty-link ty-breadcrumbs__link', { href: entry.item.href, 'data-emphasis': 'subtle' })
        const label = el('span', 'ty-breadcrumbs__label', { title: entry.item.label })
        label.textContent = entry.item.label
        link.append(label)
        li.append(link)
      }
      if (index < entries.length - 1) li.append(separatorIcon())
      nodes.push(li)
    })
    list.replaceChildren(...nodes)
  }

  /** The collapsed middle levels: a native disclosure of links, named by `overflowLabel`. */
  #overflow(items: BreadcrumbItem[]): HTMLElement {
    const details = el('details', 'ty-breadcrumbs__overflow')
    const summary = el('summary', 'ty-breadcrumbs__overflow-toggle', { 'aria-label': String(this.props.overflowLabel) })
    summary.append(ellipsisIcon())
    const menu = el('ul', 'ty-breadcrumbs__overflow-list')
    for (const item of items) {
      const li = el('li', 'ty-breadcrumbs__overflow-item')
      const link = el('a', 'ty-link', { href: item.href, 'data-emphasis': 'subtle', title: item.label })
      link.textContent = item.label
      li.append(link)
      menu.append(li)
    }
    details.append(summary, menu)
    return details
  }

  /** The compact bar: the back link to the parent (or `rootHref` with one item) and the centred title. */
  #composeBar(bar: Element, items: BreadcrumbItem[]): void {
    const props = this.props
    const back = bar.querySelector('.ty-breadcrumbs__back')
    if (back) {
      const parent =
        items.length > 1
          ? items[items.length - 2]!
          : props.rootHref
            ? { href: String(props.rootHref), label: String(props.rootLabel ?? '') }
            : undefined
      if (!parent) back.replaceChildren()
      else {
        const name = String(props.backLabel).replaceAll('{parent}', parent.label)
        const link = el('a', 'ty-link', { href: parent.href, 'data-emphasis': 'subtle', 'data-standalone': '', 'aria-label': name })
        const label = el('span', 'ty-breadcrumbs__back-label')
        label.textContent = parent.label
        link.append(backIcon(), label)
        back.replaceChildren(link)
      }
    }
    const title = bar.querySelector('.ty-breadcrumbs__title')
    if (title) {
      const text = items[items.length - 1]?.label ?? ''
      if (title.textContent !== text) title.textContent = text
    }
  }
}
