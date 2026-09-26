import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { RuledGrid, RuledGridCell, RuledGridRow } from './RuledGrid'

describe('RuledGrid in right-to-left locales', () => {
  it('renders inside an Arabic (ar-EG) right-to-left subtree and passes axe', async () => {
    const { container } = inRtl(<RuledGrid marks><RuledGridRow as="ul" columns={2}><RuledGridCell as="li">٩٤</RuledGridCell><RuledGridCell as="li">٥١٢</RuledGridCell></RuledGridRow></RuledGrid>, 'ar-EG')
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull()
    expect(container.querySelectorAll('li')).toHaveLength(2)
    await expectNoAxeViolations(container)
  })
})
