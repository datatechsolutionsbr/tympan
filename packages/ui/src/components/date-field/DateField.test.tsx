import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { DateField } from './DateField'
import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const sameDay = (a: Date, y: number, m: number, d: number) => a.getFullYear() === y && a.getMonth() === m - 1 && a.getDate() === d

function grid() {
  return screen.getByRole('grid')
}

describe('DateField', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens on the month of the value with that day selected', async () => {
    render(<DateField label="Launch" value={new Date(2026, 2, 10)} onChange={() => {}} locale="en-US" />)
    expect(screen.getByRole('button', { name: /Launch March 10, 2026/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Launch/ }))
    expect(screen.getByRole('button', { name: /March 2026/ })).toBeInTheDocument()
    const selected = within(grid()).getAllByRole('gridcell').filter((c) => c.getAttribute('aria-selected') === 'true')
    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveTextContent('10')
  })

  it('reports a chosen day and closes, returning focus to the trigger', async () => {
    const onChange = vi.fn()
    render(<DateField label="Launch" value={new Date(2026, 2, 10)} onChange={onChange} locale="en-US" />)
    const trigger = screen.getByRole('button', { name: /Launch/ })
    await userEvent.click(trigger)
    await userEvent.click(within(grid()).getByText('17'))
    expect(sameDay(onChange.mock.calls[0]![0], 2026, 3, 17)).toBe(true)
    expect(screen.queryByRole('grid')).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('moves focus across month boundaries with ArrowRight', async () => {
    render(<DateField label="Launch" value={new Date(2026, 2, 31)} onChange={() => {}} locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /Launch/ }))
    expect(document.activeElement).toHaveTextContent('31')
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toHaveTextContent(/^1$/)
    expect(screen.getByRole('button', { name: /April 2026/ })).toBeInTheDocument()
  })

  it('disables future days and months with disallowFuture', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 15, 12))
    render(<DateField label="Seen" value={null} onChange={() => {}} disallowFuture locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /Seen/ }))
    const day20 = within(grid()).getByText('20').closest('[role="button"], [aria-disabled]')!
    expect(day20).toHaveAttribute('aria-disabled', 'true')
    expect(within(grid()).getByText('14').closest('[role="button"]')).not.toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByRole('button', { name: /September 2026, choose month/ }))
    expect(screen.getByRole('row', { name: /October 2026/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('row', { name: /August 2026/ })).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('button', { name: 'Next year' })).toBeDisabled()
  })

  it('switches to a chosen month from the month view', async () => {
    render(<DateField label="Launch" value={new Date(2026, 2, 10)} onChange={() => {}} locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /Launch/ }))
    await userEvent.click(screen.getByRole('button', { name: /March 2026, choose month/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Previous year' }))
    await userEvent.click(screen.getByRole('row', { name: /July 2025/ }))
    expect(screen.getByRole('button', { name: /July 2025/ })).toBeInTheDocument()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('reports today from the shortcut, disabled when today is out of range', async () => {
    const onChange = vi.fn()
    const { unmount } = render(<DateField label="Launch" value={null} onChange={onChange} locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /Launch/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Today' }))
    const now = new Date()
    expect(sameDay(onChange.mock.calls[0]![0], now.getFullYear(), now.getMonth() + 1, now.getDate())).toBe(true)
    unmount()
    render(<DateField label="Old" value={null} onChange={() => {}} maxValue={new Date(2000, 0, 1)} locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /Old/ }))
    expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled()
  })

  it('resets the view to the value month on reopen', async () => {
    render(<DateField label="Launch" value={new Date(2026, 2, 10)} onChange={() => {}} locale="en-US" />)
    const trigger = screen.getByRole('button', { name: /Launch/ })
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByRole('button', { name: /April 2026/ })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(trigger)
    expect(screen.getByRole('button', { name: /March 2026/ })).toBeInTheDocument()
  })

  it('shows the placeholder and error wiring', () => {
    render(<DateField label="Launch" value={null} onChange={() => {}} errorText="Choose a date." />)
    const trigger = screen.getByRole('button', { name: /Launch Select a date/ })
    expect(trigger).toHaveAccessibleDescription(/Choose a date\./)
    expect(trigger).toHaveAttribute('data-invalid', 'true')
  })

  it('keeps 44 px cells on touch, highlights the selection in forced colours and fades only', () => {
    const css = cssOf('components/date-field/DateField.css')
    expect(mediaBlock(css, /\(pointer:\s*coarse\)/)).toMatch(/var\(--fk-control-target\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    const shared = cssOf('internal/forms-b/forms-b.css')
    expect(mediaBlock(shared, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(shared).toMatch(/\[data-presentation='tray'\]/)
  })

  it('has no axe violations, closed and open, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <DateField label={`Launch ${scheme}`} value={new Date(2026, 2, 10)} onChange={() => {}} hint="Day it went live." />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
    await userEvent.click(screen.getByRole('button', { name: /Launch light/ }))
    await expectNoAxeViolations(document.body)
  })
})

describe('DateField in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<DateField label="تاريخ الاسترجاع" value={new Date(2026, 8, 20)} onChange={() => {}} />)
    await rtlUser.click(rtlDom.screen.getByRole('button', { name: /تاريخ الاسترجاع/ }))
    const dialog = await rtlDom.screen.findByRole('dialog')
    // Previous/next month chevrons mirror in right-to-left.
    for (const svg of dialog.querySelectorAll('svg.fk-icon')) if (svg.classList.contains('lucide-chevron-left') || svg.classList.contains('lucide-chevron-right')) expect(svg).toHaveClass('fk-mirror-rtl')
    await axeRtl(container)
  })
})
