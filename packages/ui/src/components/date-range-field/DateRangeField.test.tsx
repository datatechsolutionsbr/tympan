import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderRtl } from '../../../test/rtl'
import { setViewportWidth } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { DateRangeField, type DateRangeFieldValue } from './DateRangeField'

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d)
const rangeValue = (sy: number, sm: number, sd: number, ey: number, em: number, ed: number): DateRangeFieldValue => ({
  start: day(sy, sm, sd),
  end: day(ey, em, ed),
})
const sameDay = (a: Date | null | undefined, y: number, m: number, d: number) =>
  !!a && a.getFullYear() === y && a.getMonth() === m - 1 && a.getDate() === d

// jsdom has no contenteditable support; react-aria date segments rely on
// beforeinput events, which userEvent only dispatches to editable elements.
Object.defineProperty(HTMLElement.prototype, 'isContentEditable', {
  configurable: true,
  get(this: HTMLElement) {
    return this.getAttribute('contenteditable') === 'true'
  },
})

describe('DateRangeField', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('types start and end dates into the segments', async () => {
    const onChange = vi.fn()
    function Harness() {
      const [value, setValue] = useState<DateRangeFieldValue | null>(null)
      return (
        <DateRangeField
          label="Period"
          value={value}
          onChange={(next) => {
            setValue(next)
            onChange(next)
          }}
          locale="en-GB"
        />
      )
    }
    render(<Harness />)
    const startDay = document.querySelector('.ty-date-range-field__segment[data-type="day"]')!
    expect(startDay).toBeTruthy()
    await userEvent.type(startDay, '01032026')
    // Completing the start date moves focus into the end input.
    const inputs = document.querySelectorAll('.ty-date-range-field__input')
    expect(inputs[1]!.contains(document.activeElement)).toBe(true)
    await userEvent.type(document.activeElement as HTMLElement, '05032026')
    await waitFor(() => {
      const reported = onChange.mock.calls.at(-1)?.[0] as DateRangeFieldValue | undefined
      expect(reported?.start && sameDay(reported.start, 2026, 3, 1)).toBe(true)
      expect(reported?.end && sameDay(reported.end, 2026, 3, 5)).toBe(true)
    })
  })

  it('reports end-before-start as invalid with the computed message', () => {
    render(<DateRangeField label="Period" value={rangeValue(2026, 3, 10, 2026, 3, 5)} onChange={() => {}} locale="en-US" />)
    expect(screen.getByText(/end date is before the start date/i)).toBeVisible()
    expect(document.querySelector('.ty-date-range-field')).toHaveAttribute('data-invalid', 'true')
  })

  it('reports a range longer than maxDays as invalid', () => {
    render(<DateRangeField label="Window" value={rangeValue(2026, 1, 1, 2026, 2, 9)} onChange={() => {}} maxDays={31} locale="en-US" />)
    expect(screen.getByText(/longer than 31 days/i)).toBeVisible()
  })

  it('commits two picks in immediate mode and closes the popover', async () => {
    const onChange = vi.fn()
    render(
      <DateRangeField label="Period" value={rangeValue(2026, 3, 1, 2026, 3, 2)} onChange={onChange} visibleMonths={1} locale="en-US" />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Period/ }))
    const grid = await screen.findByRole('grid')
    await userEvent.click(within(grid).getByRole('button', { name: /March 10/ }))
    await userEvent.click(within(grid).getByRole('button', { name: /March 12/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const reported = onChange.mock.calls.at(-1)![0] as DateRangeFieldValue
    expect(sameDay(reported.start, 2026, 3, 10)).toBe(true)
    expect(sameDay(reported.end, 2026, 3, 12)).toBe(true)
  })

  it('keeps a draft in apply mode and restores it on Cancel', async () => {
    const onChange = vi.fn()
    const original = rangeValue(2026, 3, 2, 2026, 3, 4)
    render(
      <DateRangeField label="Period" value={original} onChange={onChange} confirmation="apply" visibleMonths={1} locale="en-US" />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Period/ }))
    const grid = await screen.findByRole('grid')
    await userEvent.click(within(grid).getByRole('button', { name: /March 10/ }))
    await userEvent.click(within(grid).getByRole('button', { name: /March 12/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(onChange).not.toHaveBeenCalled()
  })

  it('applies a preset relative to today', async () => {
    const onChange = vi.fn()
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
    render(
      <DateRangeField
        label="Period"
        value={null}
        onChange={onChange}
        presets={[{ id: 'last-7', label: 'Last 7 days', range: { start, end: today } }]}
        visibleMonths={1}
        locale="en-US"
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Period/ }))
    await screen.findByRole('grid')
    await userEvent.click(screen.getByRole('button', { name: 'Last 7 days' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const reported = onChange.mock.calls.at(-1)![0] as DateRangeFieldValue
    expect(sameDay(reported.end, today.getFullYear(), today.getMonth() + 1, today.getDate())).toBe(true)
    expect(sameDay(reported.start, start.getFullYear(), start.getMonth() + 1, start.getDate())).toBe(true)
  })

  it('returns focus to the calendar button on Escape', async () => {
    render(<DateRangeField label="Period" value={null} onChange={() => {}} locale="en-US" />)
    const trigger = screen.getByRole('button', { name: /Period/ })
    await userEvent.click(trigger)
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('submits both dates in ISO format through named inputs', () => {
    render(
      <DateRangeField label="Period" value={rangeValue(2026, 3, 1, 2026, 3, 12)} onChange={() => {}} startName="from" endName="to" locale="en-US" />,
    )
    expect(document.querySelector('input[name="from"]')).toHaveValue('2026-03-01')
    expect(document.querySelector('input[name="to"]')).toHaveValue('2026-03-12')
  })

  it('opens one month as a tray on a narrow viewport', async () => {
    setViewportWidth(400)
    render(<DateRangeField label="Period" value={null} onChange={() => {}} locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /Period/ }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.closest('[data-presentation]')).toHaveAttribute('data-presentation', 'tray')
    expect(screen.getAllByRole('grid')).toHaveLength(1)
    expect(screen.queryByText(/–\s*\w+ 2026/)).toBeNull()
  })

  it('keeps hit areas, tray chips and forced-colour borders in the stylesheet', () => {
    const css = cssOf('components/date-range-field/DateRangeField.css')
    expect(css).toMatch(/var\(--ty-control-target\)/)
    expect(css).toMatch(/\[data-presentation='tray'\] \.ty-date-range-field__presets/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/0s/)
  })

  it('has no axe violations, closed and open, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <DateRangeField label={`Period ${scheme}`} value={rangeValue(2026, 3, 1, 2026, 3, 12)} onChange={() => {}} hint="Reporting window." />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
    await userEvent.click(screen.getByRole('button', { name: /Period light/ }))
    await expectNoAxeViolations(document.body)
  })

  it('renders and passes axe in right-to-left', async () => {
    const { container } = renderRtl(<DateRangeField label="الفترة" value={rangeValue(2026, 9, 1, 2026, 9, 12)} onChange={() => {}} />)
    await expectNoAxeViolations(container)
    await userEvent.click(screen.getByRole('button', { name: /الفترة/ }))
    await screen.findByRole('dialog')
    await expectNoAxeViolations(document.body)
  })
})
