import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { inRtl } from '../../../test/rtl-b'
import { ReportView } from './ReportView'

describe('ReportView in right-to-left locales', () => {
  it('formats KPIs in the locale, mirrors the trend glyph, writes the empty-value word and passes axe', async () => {
    const { container } = inRtl(
      <ReportView
        report={{
          title: 'تقرير',
          kpis: [{ label: 'الحالات', value: 94, delta: 4 }],
          table: { title: 'جدول', columns: [{ key: 'a', label: 'أ' }], rows: [{ a: null }] },
        }}
      />,
      'ar-EG',
    )
    expect(container.textContent).toContain(new Intl.NumberFormat('ar-EG').format(94))
    expect(container.querySelector('.ty-report__kpi .ty-mirror-rtl')).not.toBeNull()
    expect(screen.getByText('no value')).toBeInTheDocument()
    expect(container.textContent).not.toContain('–')
    await expectNoAxeViolations(container)
  })
})
