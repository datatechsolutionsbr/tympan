import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { inRtl } from '../../../test/rtl-b'
import { RouteProgress } from './RouteProgress'

const cssText = () => cssOf('components/route-progress/RouteProgress.css')

describe('RouteProgress in right-to-left locales', () => {
  it('renders inside an Arabic right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<RouteProgress pending label="جارٍ التحميل" />)
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(cssText()).toMatch(/\[dir='rtl'\] \.fk-route-progress__bar\s*\{[^}]*transform-origin:\s*right/)
    await expectNoAxeViolations(document.body, ['region'])
  })
})
