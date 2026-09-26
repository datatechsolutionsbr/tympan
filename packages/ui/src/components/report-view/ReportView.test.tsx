import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { ThemeScope } from '../../internal/ThemeScope'
import { ReportView, validateReport, type Report } from './ReportView'

const full: Report = {
  title: 'Count by stage',
  subtitle: 'Run 2026-09-20 14:02',
  kpis: [
    { label: 'Cases', value: 94, delta: 4, tone: 'positive' },
    { label: 'Stage 4', value: 17, unit: 'cases' },
  ],
  charts: [
    { type: 'bar', title: 'Cases per stage', xAxis: { key: 'x' }, yAxis: {}, series: [{ name: 'Cases' }], data: [{ x: '1', Cases: 18 }, { x: '2', Cases: 20 }] },
  ],
  table: {
    title: 'Budget by country',
    columns: [
      { key: 'country', label: 'Country' },
      { key: 'budget', label: 'Budget', type: 'currency' },
      { key: 'share', label: 'Share', type: 'percent' },
    ],
    rows: [
      { country: 'Brazil', budget: 1234.5, share: 12.5 },
      { country: 'Estonia', budget: null, share: 3 },
    ],
  },
  recommendation: 'Verify the 12 pending claims of table 2 first.',
  sections: [
    { kind: 'narrative', title: 'Summary', text: 'Stages 3 and 4 add up to 37 cases.', actor: { kind: 'agent', name: 'stage-counter' }, durationSeconds: 3.4 },
    { kind: 'lifecycle', title: 'Steps', steps: [{ label: 'Load', state: 'complete' }, { label: 'Count', state: 'current' }, { label: 'Publish', state: 'upcoming' }] },
    { kind: 'receipt', title: 'Costs', currency: 'BRL', items: [{ description: 'Tokens', quantity: 2, unitPrice: 10 }], total: 20 },
    { kind: 'approval', title: 'Approval', decision: 'approved', by: 'Author', reason: 'Matches the edition.' },
    { kind: 'document', title: 'Document', identifier: 'ed-2026-09-20', href: '#doc' },
    { kind: 'feed', title: 'Log', entries: [{ at: '14:02', text: 'Started' }, { at: '14:03', text: 'Failed step', tone: 'danger' }] },
    { kind: 'score', title: 'Confidence', label: 'Confidence', score: 82, bucket: 'high' },
    { kind: 'note', tone: 'warning', text: 'Two sources are archived copies.' },
    { kind: 'markdown', title: 'Notes', markdown: 'First paragraph.\n\nSecond paragraph.' },
    { kind: 'regionMap', title: 'Where', items: [{ code: 'SP', label: 'São Paulo' }] },
  ],
  meta: { 'Generated at': '2026-09-20 14:02', Source: 'edition 2026-09-20' },
}

describe('validateReport', () => {
  it('returns one empty issue for a report with only a title', () => {
    expect(validateReport({ title: 'x' })).toEqual([{ code: 'empty' }])
  })

  it('reports a chart whose series is not a list, without throwing', () => {
    expect(validateReport({ title: 'x', charts: [{ series: [{ name: 'a' }] }, { series: 'nope' }] })).toEqual([{ code: 'chartSeriesMissing', index: 1 }])
  })

  it('reports an undeclared column key once', () => {
    const issues = validateReport({ title: 'x', table: { columns: [{ key: 'a', label: 'A' }], rows: [{ a: 1, b: 2 }, { a: 3, b: 4 }] } })
    expect(issues).toEqual([{ code: 'tableColumnMissing', key: 'b' }])
  })

  it('tolerates arbitrary JSON', () => {
    for (const junk of [null, 3, 'text', [], { charts: 'x', table: 7, sections: {} }, { table: { rows: [null, 1] } }]) {
      expect(() => validateReport(junk)).not.toThrow()
    }
  })

  it('accepts a valid report', () => {
    expect(validateReport(full)).toEqual([])
  })
})

describe('ReportView', () => {
  it('renders a region named by the title with KPIs, chart, table, recommendation, sections and footer', () => {
    render(<ReportView report={full} />)
    const region = screen.getByRole('region', { name: 'Count by stage' })
    expect(within(region).getByRole('heading', { level: 2, name: 'Count by stage' })).toBeInTheDocument()
    expect(within(region).getByRole('figure', { name: 'Cases per stage' })).toBeInTheDocument()
    expect(within(region).getByRole('note', { name: 'Recommendation' })).toHaveTextContent('12 pending claims')
    expect(within(region).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toContain('Summary')
    expect(within(region).getByText('agent')).toBeInTheDocument()
    expect(within(region).getByRole('meter', { name: 'Confidence' })).toHaveAttribute('value', '82')
    expect(within(region).getByText('Second paragraph.')).toBeInTheDocument()
    expect(within(region).getByText('edition 2026-09-20')).toBeInTheDocument()
    expect(within(region).getByText('current').closest('li')).toHaveAttribute('aria-current', 'step')
  })

  it('shows empty cells as a dash with a hidden "no value"', () => {
    render(<ReportView report={full} currency="BRL" />)
    const table = screen.getByRole('table', { name: 'Budget by country' })
    expect(within(table).getByText('no value')).toHaveClass('fk-visually-hidden')
  })

  it('renders an unknown section kind as a neutral note', () => {
    render(<ReportView report={{ title: 'R', sections: [{ kind: 'hologram', payload: 1 }] }} />)
    expect(screen.getByText('Section of an unknown kind (hologram)')).toBeInTheDocument()
    expect(screen.getByText(/"payload": 1/)).toBeInTheDocument()
  })

  it('shows an inputRequest read-only without renderInputRequest, and the host form with it', () => {
    const report: Report = { title: 'R', sections: [{ kind: 'inputRequest', prompt: 'Confirm the stage rule', fields: [{ name: 'rule', label: 'Stage rule' }] }] }
    const { unmount } = render(<ReportView report={report} />)
    expect(screen.getByText('Confirm the stage rule')).toBeInTheDocument()
    expect(screen.getByText('Stage rule')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
    unmount()
    render(<ReportView report={report} renderInputRequest={() => <input aria-label="Stage rule" />} />)
    expect(screen.getByRole('textbox', { name: 'Stage rule' })).toBeInTheDocument()
  })

  it('formats currency columns with the pt-BR locale', () => {
    renderWithProvider(<ReportView report={full} currency="BRL" />, { locale: 'pt-BR' })
    const expected = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(1234.5)
    expect(expected).toMatch(/1\.234,50/)
    expect(screen.getByRole('table', { name: 'Budget by country' }).textContent).toContain(expected)
  })

  it('shows an empty state for an empty report', () => {
    render(<ReportView report={{ title: 'Nothing' }} />)
    expect(screen.getByText('This report is empty')).toBeInTheDocument()
  })

  it('reflows the KPI row and draws section borders in forced colours', () => {
    const css = cssOf('components/report-view/ReportView.css')
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/\.fk-report__kpis[^}]*minmax\(0, 1fr\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <ReportView report={{ ...full, title: `Report ${s}`, charts: [{ ...full.charts![0]!, title: `Chart ${s}` }] }} currency="BRL" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
