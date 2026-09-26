import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { EdgeSwipeBack } from './EdgeSwipeBack'

const css = cssOf('components/edge-swipe-back/EdgeSwipeBack.css')

function gesture(x0: number, dx: number, dy = 0, lift = true) {
  act(() => {
    fireEvent.touchStart(window, { touches: [{ clientX: x0, clientY: 300 }] })
    fireEvent.touchMove(window, { touches: [{ clientX: x0 + dx / 2, clientY: 300 + dy / 2 }] })
    fireEvent.touchMove(window, { touches: [{ clientX: x0 + dx, clientY: 300 + dy }] })
    if (lift) fireEvent.touchEnd(window, { touches: [] })
  })
}

afterEach(() => {
  document.documentElement.removeAttribute('dir')
})

describe('EdgeSwipeBack', () => {
  it('goes back once after a horizontal swipe from the edge past the commit distance', () => {
    const onBack = vi.fn()
    render(<EdgeSwipeBack onBack={onBack} />)
    gesture(5, 140)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('does nothing for a mostly vertical movement', () => {
    const onBack = vi.fn()
    render(<EdgeSwipeBack onBack={onBack} />)
    gesture(5, 40, 200)
    expect(onBack).not.toHaveBeenCalled()
  })

  it('shows no cue for a touch starting outside the zone', () => {
    const onBack = vi.fn()
    const { container } = render(<EdgeSwipeBack onBack={onBack} />)
    gesture(200, 60, 0, false)
    expect(container.querySelector('.ty-edge-back')).toBeNull()
    gesture(5, 60, 0, false)
    expect(container.querySelector('.ty-edge-back')).toHaveAttribute('aria-hidden', 'true')
    act(() => void fireEvent.touchEnd(window, { touches: [] }))
    expect(onBack).not.toHaveBeenCalled()
  })

  it('attaches no listeners when disabled', () => {
    const add = vi.spyOn(window, 'addEventListener')
    render(<EdgeSwipeBack enabled={false} onBack={() => {}} />)
    expect(add.mock.calls.filter(([type]) => String(type).startsWith('touch'))).toHaveLength(0)
    add.mockRestore()
  })

  it('uses only the right edge in right-to-left documents', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const onBack = vi.fn()
    render(<EdgeSwipeBack onBack={onBack} />)
    gesture(5, 140)
    expect(onBack).not.toHaveBeenCalled()
    gesture(window.innerWidth - 5, -140)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('appears without sliding under reduced motion; forced colours drawn in CanvasText', () => {
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/translate:\s*0 -50%/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations with the cue visible, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <EdgeSwipeBack onBack={() => {}}>
              <p>Page</p>
            </EdgeSwipeBack>
          </ThemeScope>
        ))}
      </>,
    )
    gesture(5, 60, 0, false)
    await expectNoAxeViolations(container)
  })
})
