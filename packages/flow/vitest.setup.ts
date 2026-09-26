import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { installMediaQueryMock, resetMediaQueries } from './test/media'

installMediaQueryMock()

beforeEach(() => {
  resetMediaQueries()
})

afterEach(() => {
  cleanup()
})

// jsdom has no layout. The canvas reads sizes from node data first and only
// refines them with ResizeObserver when it exists, so a stub is enough.
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function setPointerCapture() {}
  Element.prototype.releasePointerCapture = function releasePointerCapture() {}
  Element.prototype.hasPointerCapture = function hasPointerCapture() {
    return false
  }
}
