import { describe, expect, it } from 'vitest'
import { formatAddress, formatDateTime, formatMoney, formatPercent } from './formatters'

// Expected strings come from Intl itself, so the tests pin the library to the
// platform's locale data instead of to a copy of it.
describe('Formatters in right-to-left and non-Latin locales', () => {
  it('money: ar-EG digits, he-IL shekel, hi-IN grouping, ja-JP yen without decimals', () => {
    expect(formatMoney(1234.5, 'EGP', 'ar-EG')).toBe(new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(1234.5))
    expect(formatMoney(1234.5, 'EGP', 'ar-EG')).toMatch(/[٠-٩]/)
    expect(formatMoney(99, 'ILS', 'he-IL')).toBe(new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(99))
    expect(formatMoney(1234567, 'INR', 'hi-IN')).toBe(new Intl.NumberFormat('hi-IN', { style: 'currency', currency: 'INR' }).format(1234567))
    expect(formatMoney(1500, 'JPY', 'ja-JP')).toBe(new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(1500))
  })

  it('percent keeps the sign rule and the locale digits', () => {
    const ar = formatPercent(12.5, 'ar-EG')
    expect(ar).toMatch(/[٠-٩]/)
    expect(formatPercent(0, 'he-IL')).not.toMatch(/[+−-]/)
    expect(formatPercent(-3, 'hi-IN')).toMatch(/3/)
  })

  it('dates in ja-JP and ar-EG', () => {
    expect(formatDateTime('2026-09-20T14:02:00Z', { locale: 'ja-JP' })).toMatch(/2026/)
    expect(formatDateTime('2026-09-20T14:02:00Z', { locale: 'ar-EG' })).toMatch(/[٠-٩]/)
  })

  it('unknown-country addresses join with the locale list separator (Arabic comma)', () => {
    expect(formatAddress({ line1: 'شارع التحرير', city: 'القاهرة' }, 'ZZ', 'ar')).toBe(new Intl.ListFormat('ar', { type: 'unit', style: 'short' }).format(['شارع التحرير', 'القاهرة']))
  })
})
