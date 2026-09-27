import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom lacks these browser APIs the site uses for layout and lazy mounting.
class Observador {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.ResizeObserver ??= Observador as unknown as typeof ResizeObserver
globalThis.IntersectionObserver ??= Observador as unknown as typeof IntersectionObserver
window.matchMedia ??= ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia
window.scrollTo = (() => {}) as typeof window.scrollTo
Element.prototype.scrollIntoView ??= function () {}

afterEach(() => {
  cleanup()
})
