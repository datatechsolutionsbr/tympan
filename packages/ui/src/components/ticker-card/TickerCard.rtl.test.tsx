import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { TickerCard } from './TickerCard'

describe('TickerCard in right-to-left locales', () => {
  it('renders the rows in a right-to-left context and passes axe', async () => {
    const { container } = inRtl(
      <TickerCard title="الشفافية" entries={[{ id: 'ee', name: 'Bürokratt', value: '٠٫٨١', change: { value: '+٠٫٠٤', direction: 'up', sentiment: 'positive' } }]} />,
    )
    expect(container.querySelectorAll('li')).toHaveLength(1)
    await expectNoAxeViolations(container)
  })
})
