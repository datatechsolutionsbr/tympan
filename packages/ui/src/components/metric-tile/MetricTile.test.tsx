import { render, screen } from '@testing-library/react'
import { CircleAlert } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { MetricTile } from './MetricTile'

describe('MetricTile', () => {
  it('names the group by the title and shows the value with tabular numerals', () => {
    render(<MetricTile title="Records" value={94} />)
    const group = screen.getByRole('group', { name: 'Records' })
    expect(group).toHaveTextContent('94')
    expect(cssOf('components/metric-tile/MetricTile.css')).toMatch(/\.fk-metric-tile__value\s*\{[^}]*tabular-nums/)
  })

  it('shows "+10.5%" with an upward indicator for a positive trend', () => {
    const { container } = render(<MetricTile title="Coverage" value="81%" trend={{ value: 10.5, label: 'vs last month' }} />)
    expect(screen.getByText('+10.5%')).toBeInTheDocument()
    expect(container.querySelector('.fk-delta')).toHaveAttribute('data-trend', 'up')
    expect(container.querySelector('.fk-delta')).toHaveTextContent(/^up/)
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('shows a downward indicator and the negative value', () => {
    const { container } = render(<MetricTile title="Coverage" value="81%" trend={{ value: -5.2 }} />)
    expect(container.querySelector('.fk-delta')).toHaveAttribute('data-trend', 'down')
    expect(screen.getByText('−5.2%')).toBeInTheDocument()
  })

  it('shows a neutral indicator for zero', () => {
    const { container } = render(<MetricTile title="Coverage" value="81%" trend={{ value: 0 }} />)
    expect(container.querySelector('.fk-delta')).toHaveAttribute('data-sentiment', 'neutral')
  })

  it('uses a custom trend format', () => {
    render(<MetricTile title="Runs" value={3} trend={{ value: 2, format: (n) => `${n} more` }} />)
    expect(screen.getByText('2 more')).toBeInTheDocument()
  })

  it('tints the icon badge with the danger tone, with no hover-only styling', () => {
    const { container } = render(<MetricTile title="Failures" value={2} tone="danger" icon={<CircleAlert />} />)
    expect(container.querySelector('.fk-metric-tile')).toHaveAttribute('data-tone', 'danger')
    const css = cssOf('components/metric-tile/MetricTile.css')
    expect(css).toMatch(/data-tone='danger'\]\s*\{[^}]*--fk-danger-soft/)
    expect(css).not.toMatch(/:hover|data-hovered/)
  })

  it('never overflows: long values wrap', () => {
    render(<MetricTile title="Hash" value="sha256:9f2c8e1a77b04c5d9e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0" />)
    const css = cssOf('components/metric-tile/MetricTile.css')
    expect(css).toMatch(/\.fk-metric-tile__value\s*\{[^}]*overflow-wrap:\s*anywhere/)
    expect(css).toMatch(/\.fk-metric-tile\s*\{[^}]*min-inline-size:\s*0/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            {(['neutral', 'success', 'warning', 'danger'] as const).map((t) => (
              <MetricTile key={t} title={t} value={12} tone={t} icon={<CircleAlert />} subtitle="Edition 2026-09-20" trend={{ value: 3 }} />
            ))}
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
