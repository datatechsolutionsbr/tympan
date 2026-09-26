import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { TimeField } from './TimeField'

const open = async (name: RegExp) => userEvent.click(screen.getByRole('button', { name }))

describe('TimeField', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows two-digit hours and minutes on the trigger', () => {
    render(<TimeField label="Retrieved at" value={{ hours: 9, minutes: 5 }} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Retrieved at 09:05' })).toBeInTheDocument()
  })

  it('opens with a 00:00 draft and focus in hours', async () => {
    render(<TimeField label="Retrieved at" value={null} onChange={() => {}} />)
    await open(/Retrieved at/)
    const hours = screen.getByRole('spinbutton', { name: 'Hours' })
    expect(hours).toHaveValue('00')
    expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveValue('00')
    await waitFor(() => expect(hours).toHaveFocus())
  })

  it('clamps hours to 23 and minutes to 59, ignoring letters', async () => {
    const onChange = vi.fn()
    render(<TimeField label="Retrieved at" value={null} onChange={onChange} />)
    await open(/Retrieved at/)
    const hours = screen.getByRole('spinbutton', { name: 'Hours' })
    const minutes = screen.getByRole('spinbutton', { name: 'Minutes' })
    await userEvent.clear(hours)
    await userEvent.type(hours, '30')
    expect(hours).toHaveAttribute('aria-valuenow', '23')
    await userEvent.clear(minutes)
    await userEvent.type(minutes, 'a7x5')
    expect(minutes).toHaveAttribute('aria-valuenow', '59')
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith({ hours: 23, minutes: 59 })
  })

  it('confirms with Enter in minutes and closes', async () => {
    const onChange = vi.fn()
    render(<TimeField label="Retrieved at" value={{ hours: 8, minutes: 0 }} onChange={onChange} />)
    await open(/Retrieved at/)
    const minutes = screen.getByRole('spinbutton', { name: 'Minutes' })
    await userEvent.clear(minutes)
    await userEvent.type(minutes, '15{Enter}')
    expect(onChange).toHaveBeenCalledWith({ hours: 8, minutes: 15 })
    expect(screen.queryByRole('spinbutton')).toBeNull()
  })

  it('steps with the arrow keys using minuteStep', async () => {
    const onChange = vi.fn()
    render(<TimeField label="Retrieved at" value={{ hours: 8, minutes: 0 }} onChange={onChange} minuteStep={15} />)
    await open(/Retrieved at/)
    screen.getByRole('spinbutton', { name: 'Minutes' }).focus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{Enter}')
    expect(onChange).toHaveBeenCalledWith({ hours: 8, minutes: 30 })
  })

  it('blocks a future time on today with a message', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 20, 10, 0))
    const onChange = vi.fn()
    render(<TimeField label="Retrieved at" value={null} onChange={onChange} disallowFuture referenceDate={new Date(2026, 8, 20)} />)
    await open(/Retrieved at/)
    const hours = screen.getByRole('spinbutton', { name: 'Hours' })
    await userEvent.clear(hours)
    await userEvent.type(hours, '11')
    const confirm = screen.getByRole('button', { name: 'Confirm' })
    await userEvent.click(confirm)
    await userEvent.type(hours, '{Enter}')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText(/still in the future/)).toBeInTheDocument()
    expect(confirm).toHaveAccessibleDescription(/still in the future/)
  })

  it('allows future times on another day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 20, 10, 0))
    const onChange = vi.fn()
    render(<TimeField label="Retrieved at" value={null} onChange={onChange} disallowFuture referenceDate={new Date(2026, 8, 19)} />)
    await open(/Retrieved at/)
    const hours = screen.getByRole('spinbutton', { name: 'Hours' })
    await userEvent.clear(hours)
    await userEvent.type(hours, '22{Enter}')
    expect(onChange).toHaveBeenCalledWith({ hours: 22, minutes: 0 })
  })

  it('discards the draft on Escape', async () => {
    const onChange = vi.fn()
    render(<TimeField label="Retrieved at" value={{ hours: 8, minutes: 0 }} onChange={onChange} />)
    await open(/Retrieved at/)
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Hours' }), '5')
    await userEvent.keyboard('{Escape}')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Retrieved at 08:00' })).toBeInTheDocument()
  })

  it('requests a numeric keypad and highlights focus in forced colours', async () => {
    render(<TimeField label="Retrieved at" value={null} onChange={() => {}} />)
    await open(/Retrieved at/)
    expect(screen.getByRole('spinbutton', { name: 'Hours' })).toHaveAttribute('inputmode', 'numeric')
    expect(mediaBlock(cssOf('components/time-field/TimeField.css'), /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, closed and open, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <TimeField label={`Time ${scheme}`} value={{ hours: 9, minutes: 5 }} onChange={() => {}} errorText="Required" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
    await open(/Time light/)
    await expectNoAxeViolations(document.body)
  })
})
