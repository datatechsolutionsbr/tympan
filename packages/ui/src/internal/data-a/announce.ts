// One polite live region for the whole document. Components that need to
// report a change (a counter went up, a list was cleared) write into it
// instead of each owning its own live region.

const REGION_ATTR = 'data-ty-polite-announcer'

function region(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  let node = document.querySelector<HTMLElement>(`[${REGION_ATTR}]`)
  if (!node) {
    node = document.createElement('div')
    node.setAttribute(REGION_ATTR, '')
    node.setAttribute('role', 'status')
    node.setAttribute('aria-live', 'polite')
    node.className = 'ty-visually-hidden'
    document.body.appendChild(node)
  }
  return node
}

let generation = 0

/** Sends `text` to the shared polite region. Repeating the same text re-announces it. */
export function announcePolitely(text: string): void {
  const node = region()
  if (!node) return
  const mine = ++generation
  node.textContent = ''
  // A fresh text node after clearing makes screen readers repeat identical messages.
  queueMicrotask(() => {
    if (mine === generation) node.textContent = text
  })
}

/** Test helper: the text currently in the shared region. */
export function politeAnnouncement(): string {
  return region()?.textContent ?? ''
}
