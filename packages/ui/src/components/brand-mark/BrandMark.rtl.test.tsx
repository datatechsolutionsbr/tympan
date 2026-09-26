import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { inRtl } from '../../../test/rtl-b'
import { BrandMark } from './BrandMark'

const cssText = () => cssOf('components/brand-mark/BrandMark.css')

describe('BrandMark in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<BrandMark />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(cssText()).toMatch(/letter-spacing:\s*var\(--ty-font-tracking-h1\)/)
    await expectNoAxeViolations(document.body, ['region'])
  })
})
