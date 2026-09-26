import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { MonthField } from './MonthField'

const months = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03']

describe('MonthField', () => {
  it('shows the placeholder without a value', () => {
    render(<MonthField label="Period" value="" onChange={() => {}} availableMonths={months} />)
    expect(screen.getByRole('button', { name: 'Period, Select a month' })).toHaveTextContent('Select a month')
  })

  it('shows the localised month and year', () => {
    render(<MonthField label="Period" value="2026-03" onChange={() => {}} availableMonths={months} locale="en-US" />)
    expect(screen.getByRole('button', { name: 'Period, March 2026' })).toBeInTheDocument()
  })

  it('opens on the newest data year with months without data disabled', async () => {
    render(<MonthField label="Period" value="" onChange={() => {}} availableMonths={months} locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /Period/ }))
    expect(screen.getByText('2026', { selector: '.fk-fb-stepper__heading' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /April 2026/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('row', { name: /February 2026/ })).not.toHaveAttribute('aria-disabled')
  })

  it('reports a chosen month and closes with focus back on the trigger', async () => {
    const onChange = vi.fn()
    render(<MonthField label="Period" value="2026-03" onChange={onChange} availableMonths={months} locale="en-US" />)
    const trigger = screen.getByRole('button', { name: /Period/ })
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('row', { name: /January 2026/ }))
    expect(onChange).toHaveBeenCalledWith('2026-01')
    expect(screen.queryByRole('grid')).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('disables Previous year on the oldest data year', async () => {
    render(<MonthField label="Period" value="2025-12" onChange={() => {}} availableMonths={months} locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /Period/ }))
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next year' })).toBeEnabled()
    expect(screen.getByRole('group', { name: 'Years with data' })).toBeInTheDocument()
  })

  it('shows no year chips when data covers one year', async () => {
    render(<MonthField label="Period" value="" onChange={() => {}} availableMonths={['2026-01', '2026-02']} />)
    await userEvent.click(screen.getByRole('button', { name: /Period/ }))
    expect(screen.queryByRole('group', { name: 'Years with data' })).toBeNull()
  })

  it('changes year with PageUp and PageDown inside the grid', async () => {
    render(<MonthField label="Period" value="2026-03" onChange={() => {}} availableMonths={months} locale="en-US" />)
    await userEvent.click(screen.getByRole('button', { name: /Period/ }))
    screen.getByRole('row', { name: /March 2026/ }).focus()
    await userEvent.keyboard('{PageUp}')
    expect(screen.getByRole('row', { name: /March 2025/ })).toBeInTheDocument()
  })

  it('accepts custom trigger content and an embedded trigger', () => {
    render(<MonthField label="Period" value="2026-03" onChange={() => {}} availableMonths={months} locale="en-US" embedded triggerContent={<strong>Mar</strong>} />)
    const trigger = screen.getByRole('button', { name: 'Period, March 2026' })
    expect(trigger).toHaveTextContent('Mar')
    expect(trigger).toHaveAttribute('data-embedded', 'true')
  })

  it('uses system highlight for the selection and GrayText for unavailable months', () => {
    const forced = mediaBlock(cssOf('internal/forms-b/forms-b.css'), /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/\.fk-fb-months__cell\[data-selected\][^{]*\{[^}]*Highlight/)
    expect(forced).toMatch(/GrayText/)
  })

  it('has no axe violations, closed and open, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <MonthField label={`Period ${scheme}`} value="2026-03" onChange={() => {}} availableMonths={months} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
    await userEvent.click(screen.getByRole('button', { name: /Period light/ }))
    await expectNoAxeViolations(document.body)
  })
})
