import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { resetMediaQueries, installMediaQueryMock } from './test/media'

installMediaQueryMock()

beforeEach(() => {
  resetMediaQueries()
})

afterEach(() => {
  cleanup()
})

// jsdom lacks these; React Aria and our components feature-detect them.
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
