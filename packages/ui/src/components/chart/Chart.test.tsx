import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { Chart, type ChartSpec } from './Chart'
import { niceTicks, valueDomain } from './chartMath'

const line: ChartSpec = {
  type: 'line',
  title: 'Cases by stage',
  finding: 'Stages 3 and 4 add up to 37 of 94 cases.',
  xAxis: { key: 'x', label: 'Year' },
  yAxis: { label: 'Cases', unit: 'cases' },
  series: [{ name: 'Stage 3' }, { name: 'Stage 4', dashed: true, colorToken: 'categorical-4' }],
  data: [
    { x: '2022', 'Stage 3': 4, 'Stage 4': 1 },
    { x: '2023', 'Stage 3': 9, 'Stage 4': 6 },
    { x: '2024', 'Stage 3': 14, 'Stage 4': 12 },
    { x: '2025', 'Stage 3': 20, 'Stage 4': 17 },
  ],
}

describe('Chart', () => {
  it('names the figure by the title and draws one legend entry per series and one mark per datum', () => {
    const { container } = render(<Chart spec={line} />)
    const figure = screen.getByRole('figure', { name: 'Cases by stage' })
    expect(within(figure).getAllByRole('listitem')).toHaveLength(2)
    for (const name of ['Stage 3', 'Stage 4']) {
      expect(container.querySelectorAll(`g[data-series="${name}"] .fk-chart__mark`)).toHaveLength(4)
    }
    expect(screen.getByText(line.finding!)).toBeInTheDocument()
    expect(container.querySelector('.fk-chart__legend-item[data-dashed]')).not.toBeNull()
  })

  it('draws histogram bins without gaps', () => {
    const { container } = render(
      <Chart spec={{ ...line, type: 'histogram', series: [{ name: 'Stage 3' }] }} />,
    )
    const bins = [...container.querySelectorAll('rect.fk-chart__bar')]
    expect(bins).toHaveLength(4)
    for (let i = 1; i < bins.length; i++) {
      const prev = bins[i - 1]!
      const end = Number(prev.getAttribute('x')) + Number(prev.getAttribute('width'))
      expect(Number(bins[i]!.getAttribute('x'))).toBeCloseTo(end, 6)
    }
  })

  it('draws grouped bars with a gap between groups', () => {
    const { container } = render(<Chart spec={{ ...line, type: 'bar' }} />)
    const first = container.querySelectorAll('g[data-series="Stage 4"] rect')[0]!
    const next = container.querySelectorAll('g[data-series="Stage 3"] rect')[1]!
    expect(Number(next.getAttribute('x'))).toBeGreaterThan(Number(first.getAttribute('x')) + Number(first.getAttribute('width')))
  })

  it('announces the third category after two presses of Right', async () => {
    render(<Chart spec={line} />)
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
    const { container } = render(<Chart spec={line} />)
    const svg = container.querySelector('svg.fk-chart__svg')!
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 360, right: 640, bottom: 360, x: 0, y: 0, toJSON() {} })
    fireEvent.pointerDown(svg, { clientX: 60, clientY: 200 })
    expect(container.querySelector('.fk-chart__readout')).toHaveTextContent('2022')
  })

  it('switches to a table with one column per series and one row per datum', async () => {
    render(<Chart spec={line} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Table' }))
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
    expect(within(table).getAllByRole('row')).toHaveLength(5)
  })

  it('shows an empty message and no axes without data', () => {
    const { container } = render(<Chart spec={{ ...line, data: [] }} />)
    expect(screen.getByText('No data to plot')).toBeInTheDocument()
    expect(container.querySelector('svg.fk-chart__svg')).toBeNull()
  })

  it('treats "n/a" as a missing value: a gap in the line, no mark', () => {
    const spec: ChartSpec = { ...line, series: [{ name: 'Stage 3' }], data: line.data.map((r, i) => (i === 1 ? { ...r, 'Stage 3': 'n/a' } : r)) }
    const { container } = render(<Chart spec={spec} />)
    expect(container.querySelectorAll('.fk-chart__mark')).toHaveLength(3)
    expect(container.querySelectorAll('.fk-chart__line')).toHaveLength(2)
  })

  it('places an annotation only at an existing category', () => {
    const { container } = render(
      <Chart spec={{ ...line, annotations: [{ x: '2024', label: 'Rule v2' }, { x: '1999', label: 'Nowhere' }] }} />,
    )
    const marks = container.querySelectorAll('.fk-chart__annotation')
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveAttribute('data-category', '2024')
    expect(marks[0]).toHaveTextContent('Rule v2')
  })

  it('is one image when not interactive', () => {
    render(<Chart spec={line} interactive={false} />)
    expect(screen.getByRole('img', { name: 'Cases by stage' })).toBeInTheDocument()
  })

  it('computes domains and ticks', () => {
    expect(valueDomain({ ...line, yAxis: { domain: [0, 50] } })).toEqual([0, 50])
    expect(valueDomain({ ...line, data: [] })).toEqual([0, 1])
    const flat = valueDomain({ ...line, series: [{ name: 'a' }], data: [{ x: 1, a: 5 }, { x: 2, a: 5 }] })
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
            <Chart spec={line} />
            <Chart spec={{ ...line, type: 'bar', title: 'Bars' }} defaultView="table" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
