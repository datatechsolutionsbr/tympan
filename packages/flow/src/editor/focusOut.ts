const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Focuses the first tabbable element after `container` in document order (never traps focus). */
export function focusAfter(container: Element | null): boolean {
  if (!container) return false
  const all = [...document.querySelectorAll<HTMLElement>(TABBABLE)]
  const next = all.find((el) => !container.contains(el) && container.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
  if (next) {
    next.focus()
    return true
  }
  return false
}

/** Focuses the canvas's exit target (the tool bar), else the next element after the canvas. */
export function leaveCanvas(scope: Element | null): void {
  const exit = scope?.querySelector<HTMLElement>('[data-fk-canvas-exit] button, [data-fk-canvas-exit] [tabindex]')
  if (exit) {
    exit.focus()
    return
  }
  focusAfter(scope)
}
