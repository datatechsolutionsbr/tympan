// Behaviour of <ty-currency-field> (spec: wave-2/currency-field.md): live
// grouping in the locale's separators, canonical reporting, the caret, the
// currency's accessible note and the standard field wiring.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { renderElement } from '../../src/elements/anatomy'
import { currencyFieldDefinition } from '../../src/elements/currency-field/definition'
import { TyCurrencyFieldElement } from '../../src/elements/currency-field/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf } from '../css'

defineTympanElement(TyCurrencyFieldElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

const changes = (host: Element) => {
  const seen: string[] = []
  host.addEventListener('ty-value-change', (event) => seen.push((event as CustomEvent<{ value: string }>).detail.value))
  return seen
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('<ty-currency-field>', () => {
  it('groups in pt-BR as the person types and reports the canonical value', async () => {
    const host = html('<ty-currency-field locale="pt-BR"><span slot="label">Preço</span></ty-currency-field>').querySelector('ty-currency-field')!
    const seen = changes(host)
    const field = screen.getByRole('textbox', { name: 'Preço' })
    await userEvent.type(field, '1500000,5')
    expect(field).toHaveValue('1.500.000,5')
    expect(seen.at(-1)).toBe('1500000.5')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('renders an existing canonical value grouped in en-US', () => {
    html('<ty-currency-field locale="en-US" value="1500000.5"><span slot="label">Amount</span></ty-currency-field>')
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('1,500,000.5')
  })

  it('ignores the decimal separator when decimals is 0', async () => {
    const host = html('<ty-currency-field locale="pt-BR" decimals="0"><span slot="label">Quantidade</span></ty-currency-field>').querySelector('ty-currency-field')!
    const seen = changes(host)
    const field = screen.getByRole('textbox', { name: 'Quantidade' })
    await userEvent.type(field, '12,34')
    expect(field).toHaveValue('1.234')
    expect(seen.at(-1)).toBe('1234')
    expect(field).toHaveAttribute('inputmode', 'numeric')
  })

  it('drops fraction digits beyond decimals', async () => {
    const host = html('<ty-currency-field locale="pt-BR" decimals="2"><span slot="label">Valor</span></ty-currency-field>').querySelector('ty-currency-field')!
    const seen = changes(host)
    const field = screen.getByRole('textbox', { name: 'Valor' }) as HTMLInputElement
    await userEvent.type(field, '1,234')
    expect(field).toHaveValue('1,23')
    expect(seen.at(-1)).toBe('1.23')
  })

  it('keeps the caret after the inserted digit when regrouping', async () => {
    html('<ty-currency-field locale="pt-BR" value="1500"><span slot="label">Valor</span></ty-currency-field>')
    const field = screen.getByRole('textbox', { name: 'Valor' }) as HTMLInputElement
    expect(field).toHaveValue('1.500')
    field.focus()
    field.setSelectionRange(1, 1)
    await userEvent.keyboard('2')
    expect(field).toHaveValue('12.500')
    expect(field.selectionStart).toBe(2)
    expect(field.selectionEnd).toBe(2)
  })

  it('asks for a decimal mobile keyboard while decimals are allowed', () => {
    html('<ty-currency-field locale="en-US"><span slot="label">Amount</span></ty-currency-field>')
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveAttribute('inputmode', 'decimal')
  })

  it('shows the currency symbol visually and names the currency to assistive technology', async () => {
    html('<ty-currency-field locale="en-US" currency="BRL"><span slot="label">Amount</span></ty-currency-field>')
    const field = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement
    expect(field).toHaveAccessibleDescription(/Currency: Brazilian real/i)
    const symbol = document.querySelector('.ty-currency-field__symbol')!
    expect(symbol).toHaveTextContent('R$')
    expect(symbol).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('translates the currency note through currency-label and joins it with the hint', () => {
    html('<ty-currency-field locale="pt-BR" currency="BRL" currency-label="Moeda: {currency}"><span slot="label">Preço</span><span slot="hint">Em reais</span></ty-currency-field>')
    const field = screen.getByRole('textbox', { name: 'Preço' })
    expect(field).toHaveAccessibleDescription(/Em reais Moeda: real brasileiro/i)
  })

  it('an error invalidates the field and describes it', async () => {
    const host = html('<ty-currency-field value="12" required><span slot="label">Amount</span><span slot="error">Required</span></ty-currency-field>').querySelector('ty-currency-field')!
    const field = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Required')
    expect(host.querySelector('.ty-currency-field')).toHaveAttribute('data-invalid')
    const icon = host.querySelector('.ty-fb-line[data-line="error"] svg')!
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('mirrors the value attribute in without disturbing what was typed, and a locale change only re-formats', async () => {
    const host = html('<ty-currency-field locale="pt-BR" value=""><span slot="label">Preço</span></ty-currency-field>').querySelector('ty-currency-field')!
    const field = screen.getByRole('textbox', { name: 'Preço' }) as HTMLInputElement
    await userEvent.type(field, '12,')
    expect(field).toHaveValue('12,')
    // The controlled echo keeps the trailing decimal mark and the caret.
    host.setAttribute('value', '12')
    expect(field).toHaveValue('12,')
    expect(field.selectionStart).toBe(3)
    // A different canonical value wins and is grouped.
    host.setAttribute('value', '1500000.5')
    expect(field).toHaveValue('1.500.000,5')
    // Changing the locale changes only the display, never the canonical value.
    host.setAttribute('locale', 'en-US')
    expect(field).toHaveValue('1,500,000.5')
    expect(host.getAttribute('value')).toBe('1500000.5')
  })

  it('seeds an uncontrolled field from default-value and a form reset returns to it', async () => {
    const container = html('<form><ty-currency-field locale="en-US" name="price" default-value="1500.5"><span slot="label">Price</span></ty-currency-field><button type="reset">Reset</button></form>')
    const field = screen.getByRole('textbox', { name: 'Price' })
    expect(field).toHaveValue('1,500.5')
    await userEvent.clear(field)
    expect(field).toHaveValue('')
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(field).toHaveValue('1,500.5')
    expect(new FormData(container.querySelector('form')!).get('price')).toBe('1,500.5')
  })

  it('follows attribute changes from plain HTML (size, invalid, disabled, read-only)', () => {
    const host = html('<ty-currency-field locale="en-US"><span slot="label">Amount</span></ty-currency-field>').querySelector('ty-currency-field')!
    const root = host.querySelector('.ty-currency-field')!
    const field = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement
    expect(root).toHaveAttribute('data-size', 'medium')
    host.setAttribute('size', 'display')
    expect(root).toHaveAttribute('data-size', 'display')
    host.setAttribute('invalid', '')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(root).toHaveAttribute('data-invalid')
    host.removeAttribute('invalid')
    expect(field).not.toHaveAttribute('aria-invalid')
    host.setAttribute('disabled', '')
    expect(field).toBeDisabled()
    expect(root).toHaveAttribute('data-disabled')
    host.removeAttribute('disabled')
    host.setAttribute('read-only', '')
    expect(field).toHaveAttribute('readonly')
    expect(root).toHaveAttribute('data-readonly')
  })

  it('styles the disabled input keyed on the native state, with tabular numerals and forced colours', () => {
    const css = cssOf('components/currency-field/CurrencyField.css')
    expect(css).toMatch(/\.ty-currency-field__input:disabled[^{]*\{[^}]*opacity/)
    expect(css).toMatch(/\.ty-currency-field__input[^{]*\{[^}]*font-variant-numeric:\s*tabular-nums/)
    expect(css).toMatch(/@media \(forced-colors: active\)/)
  })

  it('has no accessibility violations across its states', async () => {
    html(
      '<ty-currency-field locale="pt-BR" currency="BRL" value="99.9"><span slot="label">Preço</span><span slot="hint">Em reais</span></ty-currency-field>' +
        '<ty-currency-field locale="en-US" value="12" invalid accessible-label="Amount"></ty-currency-field>' +
        '<ty-currency-field locale="en-US" disabled accessible-label="Archived amount"></ty-currency-field>',
    )
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('works the same in right-to-left documents', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const host = html('<ty-currency-field locale="pt-BR"><span slot="label">السعر</span></ty-currency-field>').querySelector('ty-currency-field')!
    const seen = changes(host)
    const field = screen.getByRole('textbox', { name: 'السعر' })
    await userEvent.type(field, '1500,5')
    expect(field).toHaveValue('1.500,5')
    expect(seen.at(-1)).toBe('1500.5')
    document.documentElement.removeAttribute('dir')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('ignores edits while an input method composes and reformats once at compositionend', async () => {
    const host = html('<ty-currency-field locale="en-US"><span slot="label">Amount</span></ty-currency-field>').querySelector('ty-currency-field')!
    const seen = changes(host)
    const field = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement as HTMLInputElement
    field.focus()
    field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    field.value = '12'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    expect(seen).toHaveLength(0)
    field.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    expect(seen).toEqual(['12'])
    expect(field).toHaveValue('12')
  })

  it('renders every example of the definition (the fixture path of the generator)', () => {
    for (const example of currencyFieldDefinition.examples) {
      const markup = renderElement(currencyFieldDefinition, example.props, example.slots, 'i')
      expect(markup).toContain('<ty-currency-field')
      expect(markup).toContain('ty-currency-field__input')
    }
    // The currency examples carry the symbol hook and the hidden note's id.
    const brl = renderElement(currencyFieldDefinition, currencyFieldDefinition.examples[1]!.props, currencyFieldDefinition.examples[1]!.slots, 'i')
    expect(brl).toContain('ty-currency-field__symbol')
    expect(brl).toContain('id="i-currency"')
    expect(brl).toContain('aria-describedby="i-hint i-currency"')
  })
})
