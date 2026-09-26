import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { StatTile } from './StatTile'

describe('StatTile in right-to-left locales', () => {
  it('uses the Arabic catalogue fallback words and passes axe', async () => {
    const { container } = inRtl(<StatTile value="١٢" label="بانتظاري" tone="attention" filtered onPress={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(container.querySelector('[dir="rtl"]')).toBeTruthy()
    await expectNoAxeViolations(container)
  })
})
