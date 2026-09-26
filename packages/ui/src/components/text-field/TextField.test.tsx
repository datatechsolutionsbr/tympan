import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { TextField } from './TextField'

describe('TextField', () => {
  it('uses the label as the accessible name', () => {
    render(<TextField label="Name" />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
  })

  it('uses accessibleLabel when there is no visible label', () => {
    render(<TextField accessibleLabel="Filter" />)
    expect(screen.getByRole('textbox', { name: 'Filter' })).toBeInTheDocument()
  })

  it('marks errors invalid and describes the message', () => {
    render(<TextField label="Email" hint="Work address" errorMessage="Enter a valid email" />)
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Enter a valid email'))
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Work address'))
  })

  it('clears with Escape in search mode and fires onClear', async () => {
    const onClear = vi.fn()
    render(<TextField mode="search" label="Search" defaultValue="tamm" onClear={onClear} />)
    const input = screen.getByRole('searchbox', { name: 'Search' })
    await userEvent.click(input)
    await userEvent.keyboard('{Escape}')
    expect(input).toHaveValue('')
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('returns focus to the input after the clear action (search and plain)', async () => {
    const onClear = vi.fn()
    render(
      <>
        <TextField mode="search" label="Search" defaultValue="abc" />
        <TextField label="Code" clearable defaultValue="xyz" onClear={onClear} />
      </>,
    )
    const [clearSearch, clearCode] = screen.getAllByRole('button', { name: 'Clear' })
    await userEvent.click(clearSearch!)
    expect(screen.getByRole('searchbox')).toHaveFocus()
    expect(screen.getByRole('searchbox')).toHaveValue('')
    await userEvent.click(clearCode!)
    const code = screen.getByRole('textbox', { name: 'Code' })
    expect(code).toHaveFocus()
    expect(code).toHaveValue('')
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('reveals and hides the password with a pressed toggle', async () => {
    const { container } = render(<TextField mode="password" label="Password" defaultValue="secret" />)
    const input = container.querySelector('input')!
    expect(input).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    const hide = screen.getByRole('button', { name: 'Hide password' })
    expect(hide).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(hide)
    expect(input).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('reports over-limit as invalid and says so in the counter text', async () => {
    render(<TextField label="Code" maxLength={10} showCounter />)
    const input = screen.getByRole('textbox', { name: 'Code' })
    await userEvent.type(input, 'abcdefghijk')
    expect(input).toHaveValue('abcdefghijk')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/11 of 10 characters, 1 over the limit/)).toBeInTheDocument()
  })

  it('lets read-only text be selected but not edited', async () => {
    render(<TextField label="Key" readOnly defaultValue="k-123" />)
    const input = screen.getByRole('textbox', { name: 'Key' })
    await userEvent.click(input)
    expect(input).toHaveFocus()
    await userEvent.type(input, 'x')
    expect(input).toHaveValue('k-123')
    expect(input).toHaveAttribute('readonly')
  })

  it('shows a success message only when there is no error', () => {
    const { rerender } = render(<TextField label="Slug" successMessage="Available" />)
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Available')
    rerender(<TextField label="Slug" successMessage="Available" errorMessage="Taken" />)
    expect(screen.queryByText('Available')).not.toBeInTheDocument()
  })

  it('calls onChange with the string value (controlled)', async () => {
    const onChange = vi.fn()
    render(<TextField label="Title" value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('keeps 44 px hit areas on trailing actions and 16 px text on touch', () => {
    const css = cssOf('components/text-field/TextField.css')
    expect(css).toMatch(/\.fk-text-field__action::before\s*\{[^}]*inline-size:\s*max\(100%,\s*var\(--fk-control-target\)\)/)
    expect(mediaBlock(css, /\(pointer:\s*coarse\)/)).toMatch(/font-size:\s*var\(--fk-font-size-body-lg\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/FieldText/)
  })

  it('has no axe violations in every mode with and without errors', async () => {
    const { container } = render(
      <>
        <TextField label="Plain" hint="Help" />
        <TextField label="Plain error" errorMessage="Required" />
        <TextField mode="search" label="Search" defaultValue="x" />
        <TextField mode="search" label="Search error" errorMessage="Too short" />
        <TextField mode="password" label="Password" />
        <TextField mode="password" label="Password error" errorMessage="Too weak" />
        <TextField label="Counter" maxLength={5} showCounter defaultValue="abcdef" />
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
