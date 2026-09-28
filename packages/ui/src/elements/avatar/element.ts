import { TyElement } from '../base.ts'
import { avatarDefinition } from './definition.ts'

/** The first `count` user-perceived characters (grapheme clusters), so marks and emoji stay whole. */
function leadingGraphemes(text: string, count: number): string {
  const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter
  if (!Segmenter) return Array.from(text).slice(0, count).join('')
  let out = ''
  let taken = 0
  for (const { segment } of new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) {
    if (taken === count) break
    out += segment
    taken += 1
  }
  return out
}

/**
 * `<ty-avatar>`. The anatomy (the frame with its picture and fallback, or a
 * link/button control around it) is purely presentational; the element adds
 * what load state and naming need (spec: wave-1/avatar.md):
 *
 * - **Image failure** — an `error` from the picture swaps it for the
 *   fallback (both are always rendered; `hidden` picks the visible one),
 *   drops `data-image`, and a static frame takes `role="img"` with the
 *   name, exactly as if no `src` were given. A new `src` resets.
 * - **Naming** — a pressable control is named from `action-label` with
 *   `{name}` filled in ("Open profile of {name}"); the frame inside stays
 *   `aria-hidden`, so the initials are never read as letters.
 * - **Initials** — the fallback text is kept to two grapheme clusters.
 */
export class TyAvatarElement extends TyElement {
  static override definition = avatarDefinition

  /** The src whose picture failed to load; a different src resets. */
  #failedFor: string | null = null

  #onError = (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLImageElement) || !this.contains(target)) return
    this.#failedFor = target.getAttribute('src')
    this.#applyImageState()
  }

  /** Picture vs fallback, `data-image`, and the static frame's img role after a failure. */
  #applyImageState = () => {
    const src = this.getAttribute('src')
    const failed = src !== null && src === this.#failedFor
    const decorative = this.hasAttribute('decorative')
    const pressable = this.hasAttribute('pressable') || this.hasAttribute('href')
    for (const frame of this.querySelectorAll('.ty-avatar')) {
      const image = frame.querySelector('img')
      if (image) {
        image.toggleAttribute('hidden', failed)
        // The anatomy leaves `alt` out only when there is no name to give.
        if (!image.hasAttribute('alt')) image.setAttribute('alt', '')
      }
      frame.querySelector('.ty-avatar__fallback')?.toggleAttribute('hidden', src !== null && !failed)
      frame.toggleAttribute('data-image', src !== null && !failed)
      if (!decorative && !pressable && (src === null || failed)) {
        frame.setAttribute('role', 'img')
        const name = this.getAttribute('name')
        if (name) frame.setAttribute('aria-label', name)
      } else if (src !== null && !failed) {
        frame.removeAttribute('role')
        frame.removeAttribute('aria-label')
      }
    }
  }

  /** The control's accessible name: the action label with the name filled in. */
  #applyLabel = () => {
    const control = this.querySelector('.ty-avatar-control')
    if (!control) return
    const label = String(this.props.actionLabel ?? '')
      .replaceAll('{name}', this.getAttribute('name') ?? '')
      .trim()
    if (label) control.setAttribute('aria-label', label)
    else control.removeAttribute('aria-label')
  }

  /** Initials are one or two grapheme clusters, however long the attribute. */
  #applyInitials = () => {
    const text = this.getAttribute('fallback-text')
    if (text === null) return
    const short = leadingGraphemes(text, 2)
    for (const initials of this.querySelectorAll('.ty-avatar__initials')) {
      if (initials.textContent !== short) initials.textContent = short
    }
  }

  protected override connected(): void {
    if (!this.hasAttribute('decorative') && !this.hasAttribute('name')) {
      console.warn('<ty-avatar>: `name` is required unless `decorative`.')
    }
    this.addEventListener('error', this.#onError, { capture: true })
    this.#applyImageState()
    this.#applyLabel()
    this.#applyInitials()
  }

  protected override disconnected(): void {
    this.removeEventListener('error', this.#onError, { capture: true })
  }

  protected override changed(): void {
    if (!this.isConnected) return
    this.#applyImageState()
    this.#applyLabel()
    this.#applyInitials()
  }
}
