import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { CurrencyField, type CurrencyFieldProps } from './CurrencyField'

function Controlled(props: Omit<CurrencyFieldProps, 'value' | 'label'> & { initial?: string; spy?: (v: string) => void }) {
  const { initial = '', spy, ...rest } = props
  const [value, setValue] = useState(initial)
  return (
    <CurrencyField
      {...rest}
      label="Amount"
      value={value}
      onValueChange={(v) => {
        spy?.(v)
        setValue(v)
      }}
    />
  )
}

describe('CurrencyField', () => {
  it('groups while typing in pt-BR and reports the canonical value', async () => {
    const spy = vi.fn()
    render(<Controlled locale="pt-BR" spy={spy} />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    await userEvent.type(input, '1500000,5')
    expect(input).toHaveValue('1.500.000,5')
    expect(spy).toHaveBeenLastCalledWith('1500000.5')
  })

  it('shows the same canonical value with en-US separators', () => {
    render(<CurrencyField label="Amount" value="1500000.5" locale="en-US" />)
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('1,500,000.5')
  })

  it('accepts integers only when decimals is 0', async () => {
    const spy = vi.fn()
    render(<Controlled locale="pt-BR" decimals={0} spy={spy} />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    await userEvent.type(input, '12,34')
    expect(spy).toHaveBeenLastCalledWith('1234')
    expect(input).toHaveAttribute('inputmode', 'numeric')
  })

  it('ignores a third fraction digit', async () => {
    const spy = vi.fn()
    render(<Controlled locale="en-US" spy={spy} />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    await userEvent.type(input, '3.149')
    expect(input).toHaveValue('3.14')
    expect(spy).toHaveBeenLastCalledWith('3.14')
    expect(input).toHaveAttribute('inputmode', 'decimal')
  })

  it('drops leading zeros and non-digits', async () => {
    const spy = vi.fn()
    render(<Controlled locale="en-US" spy={spy} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '007a')
    expect(spy).toHaveBeenLastCalledWith('7')
  })

  it('keeps the caret after the inserted digit when regrouping', async () => {
    render(<Controlled locale="en-US" initial="1234" />)
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement
    expect(input).toHaveValue('1,234')
    // Caret after the fourth digit ("1,234|"), then after the second digit ("1,2|34").
    await userEvent.type(input, '5', { initialSelectionStart: 5, initialSelectionEnd: 5 })
    expect(input).toHaveValue('12,345')
    expect(input.selectionStart).toBe(6)
    await userEvent.type(input, '9', { initialSelectionStart: 3, initialSelectionEnd: 3 })
    expect(input).toHaveValue('129,345')
    expect(input.value.slice(0, input.selectionStart!)).toBe('129')
  })

  it('changing locale changes only the display', () => {
    const spy = vi.fn()
    const { rerender } = render(<CurrencyField label="Amount" value="1234.5" locale="pt-BR" onValueChange={spy} />)
    expect(screen.getByRole('textbox')).toHaveValue('1.234,5')
    rerender(<CurrencyField label="Amount" value="1234.5" locale="en-US" onValueChange={spy} />)
    expect(screen.getByRole('textbox')).toHaveValue('1,234.5')
    expect(spy).not.toHaveBeenCalled()
  })

  it('conveys the currency to assistive technology', () => {
    render(<CurrencyField label="Amount" value="10" currency="BRL" locale="en-US" />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    expect(input).toHaveAccessibleDescription(/Brazilian real/i)
  })

  it('is invalid and described by the error', () => {
    render(<CurrencyField label="Amount" value="" error="Required" hint="In reais" />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Required/)
  })

  it('uses tabular numerals, no arrow stepping and system colours in forced colours', async () => {
    const spy = vi.fn()
    render(<Controlled locale="en-US" initial="5" spy={spy} />)
    await userEvent.type(screen.getByRole('textbox'), '{ArrowUp}{ArrowDown}')
    expect(spy).not.toHaveBeenCalled()
    const css = cssOf('components/currency-field/CurrencyField.css')
    expect(css).toMatch(/tabular-nums/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/FieldText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <CurrencyField label={`Budget ${scheme}`} value="1500" currency="BRL" locale="pt-BR" hint="Total" />
            <CurrencyField label={`Count ${scheme}`} value="" decimals={0} size="display" error="Required" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
