import { fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { SwipeRow } from './SwipeRow'

function swipe(el: HTMLElement, dx: number) {
  fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 20 }] })
  fireEvent.touchMove(el, { touches: [{ clientX: 200 + dx / 2, clientY: 20 }] })
  fireEvent.touchMove(el, { touches: [{ clientX: 200 + dx, clientY: 20 }] })
  fireEvent.touchEnd(el, { touches: [] })
}

describe('SwipeRow in right-to-left locales', () => {
  it('reads a swipe towards the left as "forward" (leading side) and passes axe', async () => {
    const lead = vi.fn()
    const trail = vi.fn()
    const { container } = inRtl(
      <SwipeRow label="بوتي" leadingActions={[{ label: 'تعديل', tone: 'neutral', onAction: lead }]} trailingActions={[{ label: 'أرشفة', tone: 'pending', onAction: trail }]}>
        <span>بوتي، الأرجنتين</span>
      </SwipeRow>,
    )
    const surface = container.querySelector<HTMLElement>('.ty-swipe-row__surface')!
    surface.getBoundingClientRect = () => ({ width: 400, height: 56, top: 0, left: 0, right: 400, bottom: 56 }) as DOMRect
    expect(container.querySelector('.ty-swipe-row')).toHaveAttribute('data-dir', 'rtl')
    swipe(surface, -300)
    expect(lead).toHaveBeenCalledTimes(1)
    expect(trail).not.toHaveBeenCalled()
    await expectNoAxeViolations(container)
  })
})
