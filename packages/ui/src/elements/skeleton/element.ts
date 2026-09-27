import { TyElement } from '../base.ts'
import { skeletonDefinition } from './definition.ts'

const NAMED_WIDTHS = new Set(['short', 'medium', 'long', 'full'])
/** Widths of stacked lines, the React Skeleton's `lineCycle`; the last line is always short. */
const LINE_CYCLE = ['long', 'full', 'medium']

function el(tag: string, className: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

const repetitions = (count: number | undefined, fallback: number): number => Math.max(0, Math.floor(count ?? fallback))

/**
 * `<ty-skeleton>`. All presentation: the stylesheet draws and pulses the
 * blocks (stopping under reduced motion), and the anatomy — rendered by the
 * host framework or built from plain HTML — carries the single block, the
 * first stacked line and the announcement. The element adds what the
 * declarative anatomy cannot: it repeats stacked lines beyond the first,
 * resolves a custom CSS `width` (`data-width="custom"` plus an inline size)
 * and composes the `preset`s (stats, cards, section-heading, filters,
 * analysis), which repeat per `count`/`columns`.
 *
 * Composition fills containers the anatomy rendered empty or with one
 * template block; the anatomy's own nodes are reused, never moved or
 * replaced, so a framework-rendered tree keeps its nodes. Everything the
 * element composes is inside the `aria-hidden` content: the only announced
 * part is the optional visually-hidden status.
 */
export class TySkeletonElement extends TyElement {
  static override definition = skeletonDefinition

  override sync(): void {
    super.sync()
    const root = this.anatomyRoot()
    if (!root) return
    const props = this.props
    const preset = props.preset ? String(props.preset) : undefined
    if (preset) {
      const container = root.querySelector('.ty-skeleton-preset')
      // The container's children are all the element's; recompose freely.
      if (container) container.replaceChildren(...this.#preset(preset, num(props.count), num(props.columns)))
      return
    }
    const width = props.width ? String(props.width) : undefined
    const shape = String(props.shape)
    if (shape === 'line' || shape === 'heading') {
      const container = root.querySelector('.ty-skeleton-lines')
      if (!container) return
      const lines = repetitions(num(props.lines), 1) || 1
      if (lines > 1) this.#fillLines(container, lines)
      else {
        // One line: the anatomy's block stays (a framework owns it); drop
        // only the lines the element added.
        while (container.children.length > 1) container.lastElementChild!.remove()
        const block = container.firstElementChild
        if (block instanceof HTMLElement) this.#customWidth(block, width)
      }
    } else {
      const block = root.querySelector('.ty-skeleton-content > .ty-skeleton')
      if (block instanceof HTMLElement) this.#customWidth(block, width)
    }
  }

  /** A custom CSS width on an anatomy-rendered block; named widths stay `data-width` only. */
  #customWidth(block: HTMLElement, width: string | undefined): void {
    if (width && !NAMED_WIDTHS.has(width)) {
      block.setAttribute('data-width', 'custom')
      block.style.inlineSize = width
    } else if (block.style.inlineSize) {
      block.style.inlineSize = ''
    }
  }

  /** `lines` blocks in the container, reusing the anatomy's first block. */
  #fillLines(container: Element, lines: number): void {
    for (let i = 0; i < lines; i++) {
      const width = i === lines - 1 ? 'short' : LINE_CYCLE[i % LINE_CYCLE.length]!
      let block = container.children[i]
      if (!(block instanceof HTMLElement) || !block.classList.contains('ty-skeleton')) {
        block = el('span', 'ty-skeleton')
        container.append(block)
      }
      block.setAttribute('data-shape', 'line')
      block.setAttribute('data-width', width)
      if (block instanceof HTMLElement) block.style.inlineSize = ''
    }
    while (container.children.length > lines) container.lastElementChild!.remove()
  }

  #lines(lines: number): HTMLElement {
    const container = el('span', 'ty-skeleton-lines')
    this.#fillLines(container, lines)
    return container
  }

  /** A composed block (the React Skeleton's `Block`: full width when unset). */
  #block(shape: string, width = 'full'): HTMLElement {
    const block = el('span', 'ty-skeleton', { 'data-shape': shape })
    if (NAMED_WIDTHS.has(width)) block.setAttribute('data-width', width)
    else {
      block.setAttribute('data-width', 'custom')
      block.style.inlineSize = width
    }
    return block
  }

  #grid(kind: string, columns: number): HTMLElement {
    const grid = el('span', 'ty-skeleton-grid', { 'data-preset': kind })
    grid.style.setProperty('--ty-skeleton-columns', String(columns))
    return grid
  }

  /** The preset's subtree, mirroring the React Skeleton's `Preset`. */
  #preset(preset: string, count: number | undefined, columns: number | undefined): HTMLElement[] {
    switch (preset) {
      case 'stats': {
        const n = repetitions(count, 4)
        const grid = this.#grid('stats', columns ?? n)
        for (let i = 0; i < n; i++) {
          const tile = el('span', 'ty-skeleton-tile', { 'data-part': 'stat' })
          tile.append(this.#block('circle'), this.#block('heading', 'medium'), this.#block('line', 'short'))
          grid.append(tile)
        }
        return [grid]
      }
      case 'cards': {
        const n = repetitions(count, 6)
        const grid = this.#grid('cards', columns ?? 3)
        for (let i = 0; i < n; i++) {
          const tile = el('span', 'ty-skeleton-tile', { 'data-part': 'card' })
          tile.append(this.#block('heading', 'long'), this.#lines(2), this.#block('line', 'short'))
          grid.append(tile)
        }
        return [grid]
      }
      case 'section-heading': {
        const row = el('span', 'ty-skeleton-row', { 'data-preset': 'section-heading' })
        const lines = el('span', 'ty-skeleton-lines')
        lines.append(this.#block('heading', 'medium'), this.#block('line', 'long'))
        row.append(this.#block('circle'), lines)
        return [row]
      }
      case 'filters': {
        const n = repetitions(count, 5)
        const row = el('span', 'ty-skeleton-row', { 'data-preset': 'filters' })
        for (let i = 0; i < n; i++) row.append(el('span', 'ty-skeleton ty-skeleton--pill', { 'data-shape': 'pill' }))
        return [row]
      }
      case 'analysis': {
        const n = repetitions(count, 3)
        const tile = el('span', 'ty-skeleton-tile', { 'data-preset': 'analysis' })
        tile.append(this.#block('heading', 'medium'))
        for (let i = 0; i < n; i++) {
          const row = el('span', 'ty-skeleton-row', { 'data-part': 'item' })
          row.append(this.#block('circle'), this.#lines(2))
          tile.append(row)
        }
        return [tile]
      }
      default:
        console.warn(`ty-skeleton: unknown preset "${preset}".`)
        return []
    }
  }
}

function num(value: unknown): number | undefined {
  if (value === undefined || value === false || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}
