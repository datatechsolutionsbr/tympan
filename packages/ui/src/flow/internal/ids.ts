let counter = 0

/** A new unique id with a readable prefix (`node-3f9c…`). */
export function createId(prefix = 'id'): string {
  const c = globalThis.crypto
  const random = c && typeof c.randomUUID === 'function' ? c.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
  counter = (counter + 1) % 1_000_000
  return `${prefix}-${random}${counter.toString(36)}`
}
