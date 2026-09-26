import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { Chart, type ChartFigure } from './Chart'

const figure: ChartFigure = {
  form: 'columns',
  heading: 'الحالات حسب السنة',
  across: { field: 'x' },
  up: { unit: 'حالة' },
  layers: [{ field: 'المرحلة ٣' }],
  records: [
    { x: '2022', 'المرحلة ٣': 4 },
    { x: '2023', 'المرحلة ٣': 9 },
    { x: '2024', 'المرحلة ٣': 14 },
  ],
}

describe('Chart in right-to-left locales', () => {
  it('runs categories from the inline start (right) and puts the value axis on the right', () => {
    const { container } = inRtl(<Chart figure={figure} />, 'ar-EG')
    expect(container.querySelector('.ty-chart')).toHaveAttribute('data-direction', 'rtl')
    const bars = [...container.querySelectorAll<SVGRectElement>('.ty-chart__bar')].map((b) => Number(b.getAttribute('x')))
    expect(bars[0]).toBeGreaterThan(bars[1]!)
    expect(bars[1]).toBeGreaterThan(bars[2]!)
    const tick = container.querySelector('.ty-chart__axes text')!
    expect(Number(tick.getAttribute('x'))).toBeGreaterThan(560)
    expect(tick.textContent).toMatch(/[٠-٩]/)
  })

  it('moves to the next category with Left Arrow and passes axe', async () => {
    const { container } = inRtl(<Chart figure={figure} />, 'ar-EG')
    act(() => screen.getByRole('group', { name: figure.heading }).focus())
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('status')).toHaveTextContent('2023')
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('status')).toHaveTextContent('2022')
    await expectNoAxeViolations(container)
  })
})
