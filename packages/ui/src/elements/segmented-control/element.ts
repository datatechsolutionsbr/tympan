import { TyElement } from '../base.ts'
import { segmentedControlDefinition } from './definition.ts'

const SVG = 'http://www.w3.org/2000/svg'

/** One segment of the control: a string option is both value and label. */
interface Segment {
  value: string
  label: string
  /** The `d` of a 24×24 stroke path (lucide style). */
  icon?: string
}

/**
 * `<ty-segmented-control>`. The track (the labelled radio group with its
 * size, width and disabled states) is the anatomy, rendered by the host
 * framework or built from plain HTML; the element composes the segments from
 * the `options` JSON — a dynamic repetition the declarative anatomy cannot
 * express, the skeleton-preset pattern — and adds the behaviour (spec:
 * wave-1/segmented-control.md):
 *
 * - **Selection** — a press selects the segment; selecting the selected one
 *   again does nothing. With `value` the control is controlled: the element
 *   only emits `ty-change` and the host answers with a new `value`. Without
 *   it the element keeps the selection (starting at `default-value`, else
 *   the first option) and mirrors it into the `value` attribute.
 * - **Keyboard** — one tab stop (the selected segment); the arrow keys move
 *   the selection and the focus, wrapping, Left/Right following the reading
 *   direction; Home/End jump to the ends.
 *
 * The composed segments are the element's own (the anatomy has no children),
 * so they are recomposed freely; nodes keyed by `data-value` are reused, so
 * a framework-rendered tree keeps a focused segment across re-renders.
 */
export class TySegmentedControlElement extends TyElement {
  static override definition = segmentedControlDefinition

  /** Controlled from birth: `value` present when the element connected. */
  #controlled = false

  override sync(): void {
    // The base patch pass prunes what the anatomy does not list — the
    // composed segments — so the focus a keyboard move just landed is
    // captured here and restored once the segments are recomposed.
    const active = document.activeElement
    const refocus =
      active instanceof HTMLElement && this.contains(active) ? active.getAttribute('data-value') : null
    super.sync()
    this.#compose()
    if (refocus !== null) {
      const now = document.activeElement
      const stillOnSegment = now instanceof Element && now.closest('.ty-segmented-control__segment') !== null
      if (!stillOnSegment) this.#segmentFor(refocus)?.focus()
    }
  }

  protected override connected(): void {
    this.#controlled = this.hasAttribute('value')
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeydown)
  }

  protected override disconnected(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeydown)
  }

  /** The parsed `options` JSON; an invalid value warns and renders nothing. */
  #options(): Segment[] {
    const raw = this.getAttribute('options')
    if (!raw) return []
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('not an array')
      return parsed.flatMap((entry): Segment[] => {
        if (typeof entry === 'string') return entry ? [{ value: entry, label: entry }] : []
        if (entry && typeof entry === 'object') {
          const { value, label, icon } = entry as Segment
          if (typeof value === 'string' && value && typeof label === 'string') {
            return [{ value, label, ...(typeof icon === 'string' ? { icon } : {}) }]
          }
        }
        return []
      })
    } catch {
      console.warn('<ty-segmented-control>: options must be a JSON array of strings or { "value", "label", "icon"? } objects.')
      return []
    }
  }

  /** The selected value: the controlled `value`, else `default-value`, else the first option. */
  #current(options: Segment[]): string {
    return this.getAttribute('value') ?? this.getAttribute('default-value') ?? options[0]?.value ?? ''
  }

  #segmentFor(value: string): HTMLElement | null {
    return this.querySelector(`.ty-segmented-control__segment[data-value="${CSS.escape(value)}"]`)
  }

  /**
   * Select `next`: emit `ty-change` on a real change only. Uncontrolled, the
   * element mirrors the selection into `value` (which re-renders through the
   * attribute change); controlled, the host answers the event. `moveFocus`
   * (the arrow keys) lands the focus after any re-render.
   */
  #commit(next: string, moveFocus = false): void {
    if (this.hasAttribute('disabled')) return
    const options = this.#options()
    if (!options.some((o) => o.value === next)) return
    if (next !== this.#current(options)) {
      // A short tick on touch devices, the React component's requestHaptic('light'); called from a user gesture.
      try {
        ;(navigator as Navigator & { vibrate?: (pattern: number) => boolean }).vibrate?.(8)
      } catch {
        /* unsupported */
      }
      // Uncontrolled (no `value` at birth): mirror freely — a one-shot
      // mirror would freeze the selection after the first keyboard move.
      // Controlled: the host answers ty-change by writing the attribute.
      if (!this.#controlled) this.setAttribute('value', next)
      this.emit('ty-change', { value: next })
    }
    if (moveFocus) this.#segmentFor(next)?.focus()
  }

  #onClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return
    const segment = event.target.closest('.ty-segmented-control__segment')
    if (!segment || !this.contains(segment)) return
    const value = segment.getAttribute('data-value')
    if (value !== null) this.#commit(value)
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (this.hasAttribute('disabled')) return
    if (!(event.target instanceof Element) || !event.target.closest('.ty-segmented-control__segment')) return
    const options = this.#options()
    if (!options.length) return
    const rtl = this.#rtl()
    let delta: number | null = null
    switch (event.key) {
      case 'ArrowRight':
        delta = rtl ? -1 : 1
        break
      case 'ArrowLeft':
        delta = rtl ? 1 : -1
        break
      case 'ArrowDown':
        delta = 1
        break
      case 'ArrowUp':
        delta = -1
        break
    }
    const current = this.#current(options)
    const from = Math.max(0, options.findIndex((o) => o.value === current))
    let to: number
    if (event.key === 'Home') to = 0
    else if (event.key === 'End') to = options.length - 1
    else if (delta !== null) to = (from + delta + options.length) % options.length
    else return
    event.preventDefault()
    this.#commit(options[to]!.value, true)
  }

  /** The reading direction, from a `dir` attribute up the tree or the computed style. */
  #rtl(): boolean {
    const dir = this.closest('[dir]')?.getAttribute('dir') ?? document.documentElement.getAttribute('dir')
    if (dir) return dir.toLowerCase() === 'rtl'
    return getComputedStyle(this).direction === 'rtl'
  }

  /** Compose the segments into the track, reusing the nodes keyed by `data-value`. */
  #compose(): void {
    const root = this.anatomyRoot()
    if (!root) return
    const options = this.#options()
    const current = this.#current(options)
    const disabled = this.hasAttribute('disabled')
    const iconOnly = this.hasAttribute('icon-only')
    const stretched = this.hasAttribute('full-width')
    const used = new Set<Element>()
    const wanted: HTMLElement[] = []
    for (const option of options) {
      const existing = Array.from(root.children).find((c) => !used.has(c) && c.getAttribute('data-value') === option.value)
      const segment = existing instanceof HTMLElement ? existing : this.#segment()
      used.add(segment)
      this.#syncSegment(segment, option, current === option.value, disabled, iconOnly, stretched)
      wanted.push(segment)
    }
    wanted.forEach((segment, index) => {
      if (root.children[index] !== segment) root.insertBefore(segment, root.children[index] ?? null)
    })
    while (root.children.length > wanted.length) root.lastElementChild!.remove()
  }

  #segment(): HTMLElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.setAttribute('role', 'radio')
    button.className = 'ty-segmented-control__segment'
    return button
  }

  /** Bring one segment in step, touching only what changed (a focused segment keeps focus). */
  #syncSegment(segment: HTMLElement, option: Segment, selected: boolean, disabled: boolean, iconOnly: boolean, stretched: boolean): void {
    segment.setAttribute('data-value', option.value)
    segment.setAttribute('aria-checked', String(selected))
    segment.toggleAttribute('data-selected', selected)
    if (disabled) {
      segment.setAttribute('disabled', '')
      segment.setAttribute('data-disabled', '')
      segment.tabIndex = -1
    } else {
      segment.removeAttribute('disabled')
      segment.removeAttribute('data-disabled')
      segment.tabIndex = selected ? 0 : -1
    }
    if (stretched) segment.setAttribute('title', option.label)
    else segment.removeAttribute('title')
    if (iconOnly) segment.setAttribute('aria-label', option.label)
    else segment.removeAttribute('aria-label')

    let icon = segment.querySelector(':scope > svg.ty-icon')
    if (option.icon) {
      if (!icon) {
        icon = document.createElementNS(SVG, 'svg')
        icon.setAttribute('class', 'ty-icon')
        icon.setAttribute('viewBox', '0 0 24 24')
        icon.setAttribute('fill', 'none')
        icon.setAttribute('stroke', 'currentColor')
        icon.setAttribute('stroke-width', '2')
        icon.setAttribute('stroke-linecap', 'round')
        icon.setAttribute('stroke-linejoin', 'round')
        icon.setAttribute('aria-hidden', 'true')
        icon.setAttribute('focusable', 'false')
        icon.append(document.createElementNS(SVG, 'path'))
        segment.prepend(icon)
      }
      const path = icon.querySelector('path')!
      if (path.getAttribute('d') !== option.icon) path.setAttribute('d', option.icon)
    } else icon?.remove()

    let label = segment.querySelector(':scope > span')
    if (!label) {
      label = document.createElement('span')
      segment.append(label)
    }
    const labelClass = iconOnly ? 'ty-visually-hidden' : 'ty-segmented-control__label'
    if (label.getAttribute('class') !== labelClass) label.setAttribute('class', labelClass)
    if (label.textContent !== option.label) label.textContent = option.label
  }
}
