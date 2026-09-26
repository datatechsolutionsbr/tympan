import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { renderWithProvider } from '../../test/render'
import { formatValue, ReportView, validateReport, type ReportSpec } from './ReportView'

const spec: ReportSpec = {
  title: 'Edition 2026-09-20',
  subtitle: 'Cases by stage',
  sections: [
    { type: 'figures', title: 'Totals', data: { items: [{ label: 'Cases', value: 94 }, { label: 'Proved', value: 0.62, format: 'percent' }] } },
    { type: 'bar', title: 'By stage', data: { rows: [{ stage: '1', cases: 18, proved: 10 }, { stage: '3', cases: 20, proved: 12 }], x: 'stage', y: ['cases', 'proved'] } },
    { type: 'table', title: 'Records', data: { rows: [{ id: 'ae-tamm-4-0', stage: 4 }], columns: [{ key: 'id', label: 'Record' }, { key: 'stage', label: 'Stage', format: 'number' }] } },
    { type: 'markdown', data: { body: 'Stages 3 and 4 add up to **37** cases.' } },
    { type: 'note', title: 'Unknown', data: {} },
  ],
}

describe('ReportView', () => {
  it('renders every section with a chart summary, a legend in words and a data-table toggle', async () => {
    const { container } = render(<ReportView spec={spec} locale="en" />)
    expect(screen.getByRole('heading', { name: 'Edition 2026-09-20' })).toBeInTheDocument()
    expect(screen.getByText('62%')).toBeInTheDocument()
    const chart = screen.getByRole('figure', { name: /By stage/ })
    expect(screen.getByRole('img', { name: 'Bar chart of cases, proved by stage, 2 rows' })).toBeInTheDocument()
    expect(chart.querySelectorAll('.fk-flow-report__legend-item')).toHaveLength(2)
    const toggle = screen.getByRole('button', { name: 'Show data table' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Show chart' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'By stage' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Records' })).toHaveAttribute('tabindex', '0')
    expect(container.querySelector('strong')).toHaveTextContent('37')
    expect(screen.getByText('This section has no content to show.')).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('formats with the provider locale and needs a currency code for currency', () => {
    renderWithProvider(<ReportView spec={{ sections: [{ type: 'figures', data: { items: [{ label: 'Cost', value: 1234.5, format: 'currency' }] } }] }} currency="BRL" />, { locale: 'pt-BR' })
    expect(screen.getByText(/R\$\s?1\.234,50/)).toBeInTheDocument()
    expect(formatValue(1234.5, 'currency', 'en')).toBe('1,234.50')
    expect(formatValue(25, 'percent', 'en')).toBe('25%')
  })

  it('reports structural problems', () => {
    expect(validateReport(null)).toEqual([{ path: '', message: 'not an object' }])
    expect(validateReport({ sections: [{ data: {} }] })).toEqual([{ path: 'sections.0.type', message: 'missing' }])
    expect(validateReport(spec)).toEqual([])
  })

  it('keeps series distinguishable without colour and draws in system colours when forced', () => {
    const css = cssOf('report/report.css')
    expect(css).toMatch(/\.fk-flow-report__line\[data-series='1'\]\s*\{[^}]*stroke-dasharray/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/CanvasText/)
    expect(css).not.toMatch(/#[0-9a-f]{3,6}\b/i)
  })
})
