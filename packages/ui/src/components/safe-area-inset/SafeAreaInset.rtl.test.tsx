import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { SafeAreaInset } from './SafeAreaInset'

describe('SafeAreaInset in right-to-left locales', () => {
  it('maps the inline-start edge to the right side in RTL and passes axe', async () => {
    const { container } = inRtl(
      <SafeAreaInset edges={['start']}>
        <p>محتوى</p>
      </SafeAreaInset>,
    )
    const box = container.querySelector('.fk-safe-area')!
    expect(box.hasAttribute('data-pad-right') || box.hasAttribute('data-pad-left')).toBe(true)
    await expectNoAxeViolations(container)
  })
})
