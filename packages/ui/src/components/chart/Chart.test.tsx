import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { Chart, estimateTickWidth, valueAxisLayout, type ChartFigure } from './Chart'
import { niceTicks } from './chartMath'
import { toPlot } from './plot'

const line: ChartFigure = {
  form: 'trend',
  heading: 'Cases by stage',
  reading: 'Stages 3 and 4 add up to 37 of 94 cases.',
  across: { field: 'x', caption: 'Year' },
  up: { caption: 'Cases', unit: 'cases' },
  layers: [{ field: 'Stage 3' }, { field: 'Stage 4', projected: true, tone: 'categorical-4' }],
  records: [
    { x: '2022', 'Stage 3': 4, 'Stage 4': 1 },
    { x: '2023', 'Stage 3': 9, 'Stage 4': 6 },
    { x: '2024', 'Stage 3': 14, 'Stage 4': 12 },
    { x: '2025', 'Stage 3': 20, 'Stage 4': 17 },
  ],
}

describe('Chart', () => {
  it('names the figure by the title and draws one legend entry per series and one mark per datum', () => {
    const { container } = render(<Chart figure={line} />)
    const figure = screen.getByRole('figure', { name: 'Cases by stage' })
    expect(within(figure).getAllByRole('listitem')).toHaveLength(2)
    for (const name of ['Stage 3', 'Stage 4']) {
      expect(container.querySelectorAll(`g[data-series="${name}"] .ty-chart__mark`)).toHaveLength(4)
    }
    expect(screen.getByText(line.reading!)).toBeInTheDocument()
    expect(container.querySelector('.ty-chart__legend-item[data-dashed]')).not.toBeNull()
  })

  it('draws histogram bins without gaps', () => {
    const { container } = render(
      <Chart figure={{ ...line, form: 'bins', layers: [{ field: 'Stage 3' }] }} />,
    )
    const bins = [...container.querySelectorAll('rect.ty-chart__bar')]
    expect(bins).toHaveLength(4)
    for (let i = 1; i < bins.length; i++) {
      const prev = bins[i - 1]!
      const end = Number(prev.getAttribute('x')) + Number(prev.getAttribute('width'))
      expect(Number(bins[i]!.getAttribute('x'))).toBeCloseTo(end, 6)
    }
  })

  it('draws grouped bars with a gap between groups', () => {
    const { container } = render(<Chart figure={{ ...line, form: 'columns' }} />)
    const first = container.querySelectorAll('g[data-series="Stage 4"] rect')[0]!
    const next = container.querySelectorAll('g[data-series="Stage 3"] rect')[1]!
    expect(Number(next.getAttribute('x'))).toBeGreaterThan(Number(first.getAttribute('x')) + Number(first.getAttribute('width')))
  })

  it('announces the third category after two presses of Right', async () => {
    render(<Chart figure={line} />)
    const plot = screen.getByRole('group', { name: 'Cases by stage' })
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    plot.focus()
    expect(plot).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('status')).toHaveTextContent('2024, Stage 3: 14 cases')
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('status')).toHaveTextContent('2024, Stage 4: 12 cases')
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('status')).toHaveTextContent('2025')
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('shows a readout when a point is tapped', () => {
    const { container } = render(<Chart figure={line} />)
    const svg = container.querySelector('svg.ty-chart__svg')!
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 360, right: 640, bottom: 360, x: 0, y: 0, toJSON() {} })
    fireEvent.pointerDown(svg, { clientX: 60, clientY: 200 })
    expect(container.querySelector('.ty-chart__readout')).toHaveTextContent('2022')
  })

  it('switches to a table with one column per series and one row per datum', async () => {
    render(<Chart figure={line} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Table' }))
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
    expect(within(table).getAllByRole('row')).toHaveLength(5)
  })

  it('shows an empty message and no axes without data', () => {
    const { container } = render(<Chart figure={{ ...line, records: [] }} />)
    expect(screen.getByText('No data to plot')).toBeInTheDocument()
    expect(container.querySelector('svg.ty-chart__svg')).toBeNull()
  })

  it('treats "n/a" as a missing value: a gap in the line, no mark', () => {
    const figure: ChartFigure = { ...line, layers: [{ field: 'Stage 3' }], records: line.records.map((r, i) => (i === 1 ? { ...r, 'Stage 3': 'n/a' } : r)) }
    const { container } = render(<Chart figure={figure} />)
    expect(container.querySelectorAll('.ty-chart__mark')).toHaveLength(3)
    expect(container.querySelectorAll('.ty-chart__line')).toHaveLength(2)
  })

  it('places an annotation only at an existing category', () => {
    const { container } = render(
      <Chart figure={{ ...line, notes: [{ at: '2024', text: 'Rule v2' }, { at: '1999', text: 'Nowhere' }] }} />,
    )
    const marks = container.querySelectorAll('.ty-chart__annotation')
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveAttribute('data-category', '2024')
    expect(marks[0]).toHaveTextContent('Rule v2')
  })

  it('is one image when not interactive', () => {
    render(<Chart figure={line} interactive={false} />)
    expect(screen.getByRole('img', { name: 'Cases by stage' })).toBeInTheDocument()
  })

  it('computes domains and ticks', () => {
    expect(toPlot({ ...line, up: { bounds: [0, 50] } }).span).toEqual([0, 50])
    expect(toPlot({ ...line, records: [] }).span).toEqual([0, 1])
    const flat = toPlot({ ...line, layers: [{ field: 'a' }], records: [{ x: 1, a: 5 }, { x: 2, a: 5 }] }).span
    expect(5 - flat[0]).toBeCloseTo(flat[1] - 5)
    expect(niceTicks([0, 100], 5)).toEqual([0, 25, 50, 75, 100])
  })

  it('uses system colours and no animation', () => {
    const css = cssOf('components/chart/Chart.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
  })

  it('has no axe violations in chart and table views, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <Chart figure={line} />
            <Chart figure={{ ...line, form: 'columns', heading: 'Bars' }} defaultFace="table" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('Chart value axis with a long unit', () => {
  /** Left edge of the plot, read from the baseline (LTR). */
  const plotStart = (container: HTMLElement) => Number(container.querySelector('.ty-chart__baseline')!.getAttribute('x1'))
  const ticks = (container: HTMLElement) => Array.from(container.querySelectorAll('.ty-chart__axes > g > text.ty-chart__tick'), (t) => t.textContent ?? '')

  it('widens the gutter so every tick label with its unit fits beside the axis', () => {
    const short = render(<Chart figure={line} />)
    const narrow = plotStart(short.container)
    short.unmount()
    const { container } = render(<Chart figure={{ ...line, up: { caption: 'Cases', unit: 'thousand people' } }} />)
    const wide = plotStart(container)
    expect(wide).toBeGreaterThan(narrow)
    // Tick labels end 8 units before the plot and must start inside the drawing.
    for (const label of ticks(container)) {
      expect(label).toContain('thousand people')
      expect(wide - 8 - estimateTickWidth(label)).toBeGreaterThanOrEqual(0)
    }
  })

  it('moves a unit too long for the gutter to one caption above the axis, never clipped', () => {
    const unit = 'registered public-service conversations per thousand residents'
    const { container } = render(<Chart figure={{ ...line, up: { caption: 'Cases', unit } }} />)
    const caption = container.querySelector('.ty-chart__unit')
    expect(caption?.textContent).toBe(unit)
    for (const label of ticks(container)) {
      expect(label).not.toContain(unit)
      expect(plotStart(container) - 8 - estimateTickWidth(label)).toBeGreaterThanOrEqual(0)
    }
    // The table view still carries the unit with each value.
    fireEvent.click(screen.getByRole('radio', { name: /table/i }))
    expect(screen.getAllByText(new RegExp(unit)).length).toBeGreaterThan(1)
  })

  it('keeps the default gutter for short labels', () => {
    const layout = valueAxisLayout([0, 10, 20], { withUnit: (v) => `${v} cases`, bare: String }, true)
    expect(layout).toMatchObject({ gutter: Math.max(52, estimateTickWidth('20 cases') + 14), unitCaption: false })
    expect(valueAxisLayout([0, 5], { withUnit: String, bare: String }, false).gutter).toBe(52)
  })
})
