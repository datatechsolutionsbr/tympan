import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderRtl } from '../../../test/rtl'
import { ThemeScope } from '../../internal/ThemeScope'
import { Calendar } from './Calendar'

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d)
const range = (sy: number, sm: number, sd: number, ey: number, em: number, ed: number) => ({
  start: day(sy, sm, sd),
  end: day(ey, em, ed),
})
const sameDay = (a: Date | null | undefined, y: number, m: number, d: number) =>
  !!a && a.getFullYear() === y && a.getMonth() === m - 1 && a.getDate() === d

function grid() {
  return screen.getByRole('grid')
}

describe('Calendar', () => {
  it('moves focus by week with ArrowDown', async () => {
    render(<Calendar label="Book" value={day(2026, 3, 10)} onChange={() => {}} locale="en-US" />)
    await userEvent.click(within(grid()).getByRole('button', { name: /March 10/ }))
    expect(document.activeElement).toHaveTextContent(/^10$/)
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveTextContent(/^17$/)
  })

  it('moves focus to the month end with PageDown and reads the heading', async () => {
    render(<Calendar label="Later" value={day(2026, 1, 31)} onChange={() => {}} locale="en-US" />)
    await userEvent.click(within(grid()).getByRole('button', { name: /January 31/ }))
    await userEvent.keyboard('{PageDown}')
    expect(document.activeElement).toHaveTextContent(/^28$/)
    expect(screen.getByText('February 2026')).toBeVisible()
  })

  it('swaps an earlier end into a 2-to-5 range', async () => {
    const onChange = vi.fn()
    render(
      <Calendar label="Stay" mode="range" value={null} focusedValue={day(2026, 3, 1)} onChange={onChange} locale="en-US" />,
    )
    await userEvent.click(within(grid()).getByRole('button', { name: /March 5, 2026/ }))
    await userEvent.click(within(grid()).getByRole('button', { name: /March 2, 2026/ }))
    const reported = onChange.mock.calls.at(-1)![0] as { start: Date; end: Date }
    expect(sameDay(reported.start, 2026, 3, 2)).toBe(true)
    expect(sameDay(reported.end, 2026, 3, 5)).toBe(true)
  })

  it('cancels a pending range start on Escape', async () => {
    const onChange = vi.fn()
    render(
      <Calendar label="Stay" mode="range" value={null} focusedValue={day(2026, 3, 1)} onChange={onChange} locale="en-US" />,
    )
    await userEvent.click(within(grid()).getByRole('button', { name: /March 5, 2026/ }))
    await userEvent.keyboard('{Escape}')
    const selected = within(grid()).getAllByRole('gridcell').filter((c) => c.getAttribute('aria-selected') === 'true')
    expect(selected).toHaveLength(0)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps Sundays unselectable and announced as unavailable', async () => {
    const onChange = vi.fn()
    render(
      <Calendar
        label="Visit"
        value={day(2026, 3, 10)}
        onChange={onChange}
        isDateUnavailable={(d) => d.getDay() === 0}
        locale="en-US"
      />,
    )
    const sunday = within(grid()).getByRole('button', { name: /Sunday, March 8/ })
    expect(sunday).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(sunday)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('marks a range over an unavailable day invalid and shows the error', () => {
    render(
      <Calendar
        label="Stay"
        mode="range"
        value={range(2026, 3, 6, 2026, 3, 12)}
        onChange={() => {}}
        isDateUnavailable={(d) => d.getDay() === 0}
        errorMessage="Pick weekdays only."
        locale="en-US"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Pick weekdays only.')
    expect(within(grid()).getAllByRole('gridcell').filter((c) => c.getAttribute('aria-selected') === 'true').length).toBeGreaterThan(0)
  })

  it('shows two consecutive months and pages by the set, or by one with pageBehavior single', async () => {
    render(<Calendar label="Report" value={day(2026, 3, 10)} onChange={() => {}} visibleMonths={2} locale="en-US" />)
    expect(screen.getAllByRole('grid')).toHaveLength(2)
    expect(screen.getByText(/March 2026\s*–\s*April/)).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /Next month, May 2026/ }))
    expect(screen.getByText(/May 2026\s*–\s*June/)).toBeVisible()
  })

  it('pages a two-month set by one month with pageBehavior single', async () => {
    render(
      <Calendar label="Report 2" value={day(2026, 3, 10)} onChange={() => {}} visibleMonths={2} pageBehavior="single" locale="en-US" />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Next month, April 2026/ }))
    expect(screen.getByText(/April 2026\s*–\s*May/)).toBeVisible()
  })

  it('disables Next while the maxValue month is visible', () => {
    render(<Calendar label="Cutoff" value={day(2026, 4, 10)} onChange={() => {}} maxValue={day(2026, 4, 30)} locale="en-US" />)
    expect(screen.getByRole('button', { name: /Next month/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Previous month/ })).not.toBeDisabled()
  })

  it('jumps by picker and keeps focus in the year picker', async () => {
    render(<Calendar label="Archive" value={day(2026, 3, 10)} onChange={() => {}} headerMode="pickers" locale="en-US" />)
    // The trigger's name is the picked value ("2026"); the "Year" accessible
    // label only shows as a suffix in jsdom's name computation.
    await userEvent.click(screen.getByRole('button', { name: /Year/ }))
    await userEvent.click(within(screen.getByRole('listbox')).getByText('2030'))
    expect(within(grid()).getByRole('button', { name: /March 10, 2030/ })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /Year/ })).toHaveFocus())
  })

  it('renders a non-interactive week-number column', () => {
    render(<Calendar label="Plan" value={day(2026, 3, 10)} onChange={() => {}} showWeekNumbers locale="en-US" />)
    const weeks = document.querySelectorAll('.ty-calendar__week')
    expect(weeks.length).toBeGreaterThanOrEqual(5)
    for (const w of weeks) {
      expect(w.tagName).not.toBe('BUTTON')
      expect(w.getAttribute('role')).not.toBe('button')
    }
  })

  it('follows the Portuguese locale for weekday names and week start', () => {
    const { container } = render(<Calendar label="Prazo" value={day(2026, 3, 10)} onChange={() => {}} locale="pt-BR" />)
    // Weekday names are in the DOM; react-aria marks the header row
    // aria-hidden (the names are already part of each day cell's label).
    const weekdays = [...container.querySelectorAll('.ty-calendar__weekday')].map((el) => el.textContent)
    expect(weekdays).toHaveLength(7)
    expect(weekdays[0]).toMatch(/dom/i)
    expect(within(grid()).getByRole('button', { name: /domingo, 1 de março/ })).toBeInTheDocument()
  })

  it('keeps day cells at the touch target, hides outside days on request and honours forced colours', () => {
    const css = cssOf('components/calendar/Calendar.css')
    expect(mediaBlock(css, /\(pointer:\s*coarse\)/)).toMatch(/var\(--ty-control-target\)/)
    expect(css).toMatch(/:not\(\[data-outside-days\]\) \.ty-calendar__day\[data-outside-month\]/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/GrayText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <Calendar label={`Book ${scheme}`} value={day(2026, 3, 10)} onChange={() => {}} showWeekNumbers footer={<span>GMT+1</span>} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })

  it('renders mirrored navigation in right-to-left and passes axe', async () => {
    const { container } = renderRtl(<Calendar label="الحجز" value={day(2026, 9, 20)} onChange={() => {}} />)
    for (const svg of container.querySelectorAll('svg.ty-icon')) {
      if (svg.classList.contains('lucide-chevron-left') || svg.classList.contains('lucide-chevron-right')) {
        expect(svg).toHaveClass('ty-mirror-rtl')
      }
    }
    await expectNoAxeViolations(container)
  })
})
