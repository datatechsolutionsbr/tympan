import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderWithProvider } from '../../../test/render'
import { messagesPtBR } from '../../internal/messages'
import { TympanProvider } from '../../internal/provider'
import {
  formatAddress,
  formatDateTime,
  formatMoney,
  formatPercent,
  getCountry,
  listCountries,
  registerCountry,
  resetCountries,
  toneForStatus,
  useFormatters,
} from './formatters'

afterEach(() => resetCountries())

describe('Formatters', () => {
  it('formats Brazilian real with comma decimals', () => {
    const s = formatMoney(1234.5, 'BRL', 'pt-BR')
    expect(s).toMatch(/R\$/)
    expect(s).toMatch(/1\.234,50/)
  })

  it('returns the placeholder for null and invalid input', () => {
    expect(formatMoney(null, 'BRL')).toBe('not informed')
    expect(formatPercent(undefined, 'en-US', { placeholder: 'n/a' })).toBe('n/a')
    expect(formatDateTime('not a date')).toBe('not informed')
  })

  it('shows the sign except for zero', () => {
    expect(formatPercent(12.5, 'en-US')).toBe('+12.50%')
    expect(formatPercent(0, 'en-US')).toBe('0.00%')
    expect(formatPercent(-3, 'en-US')).toBe('-3.00%')
  })

  it('formats { value: iso } like the plain string', () => {
    const iso = '2026-09-20T14:02:00Z'
    expect(formatDateTime({ value: iso }, { timeZone: 'UTC' })).toBe(formatDateTime(iso, { timeZone: 'UTC' }))
    expect(formatDateTime(iso, { timeZone: 'UTC', withTimeZone: true })).toMatch(/UTC/)
  })

  it('never leaves doubled separators for empty fields', () => {
    registerCountry({
      code: 'ZZ',
      locale: { default: 'en-US' },
      currency: { code: 'USD' },
      address: { template: ['{street}, {number}, {complement}', '{city} / {region}', ['postalCode', 'country']] },
    })
    const text = formatAddress({ street: 'Rua A', number: '', complement: 'ap 2', city: 'São Paulo', region: '', postalCode: '01000-000' }, 'ZZ')
    expect(text).not.toMatch(/,\s*,/)
    expect(text).toBe('Rua A, ap 2\nSão Paulo\n01000-000')
    expect(formatAddress({ a: 'x', b: '', c: 'y' }, 'QQ')).toBe('x, y')
  })

  it('maps statuses to semantic tones', () => {
    expect(toneForStatus('rejected')).toBe('negative')
    expect(toneForStatus('Approved')).toBe('positive')
    expect(toneForStatus('in review')).toBe('pending')
    expect(toneForStatus('whatever')).toBe('neutral')
  })

  it('validates and lists registered countries', () => {
    expect(() => registerCountry({ code: 'brazil', locale: { default: 'pt-BR' }, currency: { code: 'BRL' } })).toThrow(/code/)
    expect(() => registerCountry({ code: 'BR', locale: { default: 'pt-BR' }, currency: { code: 'R$' } })).toThrow(/currency/)
    registerCountry({ code: 'BR', locale: { default: 'pt-BR' }, currency: { code: 'BRL' } })
    expect(getCountry('br')?.currency.code).toBe('BRL')
    expect(listCountries()).toHaveLength(1)
  })

  it('binds locale and the catalogue placeholder in the hook', () => {
    const { result } = renderHook(() => useFormatters(), {
      wrapper: ({ children }) => (
        <TympanProvider baseMessages={messagesPtBR} locale="pt-BR">
          {children}
        </TympanProvider>
      ),
    })
    expect(result.current.money(null, 'BRL')).toBe('não informado')
    expect(result.current.percent(12.5)).toMatch(/12,50/)
    void renderWithProvider
  })
})
