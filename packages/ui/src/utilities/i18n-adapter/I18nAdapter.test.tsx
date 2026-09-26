import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { FakhirProvider } from '../../internal/provider'
import { createFormatter, createI18nValue, I18nAdapterProvider, useFormatter, useLocale, useTranslations } from './I18nAdapter'
import { formatMessage } from './icu'

const catalogue = {
  sources: {
    count: '{n, plural, =0 {no sources} one {# source} other {# sources}}',
    broken: 'Hello {name',
    kind: '{actor, select, agent {by an agent} person {by a person} other {by the system}}',
    list: ['a', 'b'],
  },
}

const withValue = (locale = 'en') =>
  function W({ children }: { children: ReactNode }) {
    return <I18nAdapterProvider value={createI18nValue(catalogue, locale)}>{children}</I18nAdapterProvider>
  }

describe('I18nAdapter', () => {
  it('chooses singular and plural forms', () => {
    const { result } = renderHook(() => useTranslations('sources'), { wrapper: withValue() })
    expect(result.current('count', { n: 1 })).toBe('1 source')
    expect(result.current('count', { n: 2 })).toBe('2 sources')
    expect(result.current('count', { n: 0 })).toBe('no sources')
    expect(result.current('kind', { actor: 'agent' })).toBe('by an agent')
  })

  it('falls back to simple substitution for malformed messages', () => {
    expect(() => formatMessage('Hello {name', { name: 'Ana' })).not.toThrow()
    const { result } = renderHook(() => useTranslations('sources'), { wrapper: withValue() })
    expect(result.current('broken', { name: 'Ana' })).toBe('Hello {name')
    expect(formatMessage('{name} and {n, plural, one {x}}', { name: 'Ana', n: 1 })).toBe('Ana and {n, plural, one {x}}')
  })

  it('returns the inline default without a provider, else namespace.key', () => {
    const { result } = renderHook(() => useTranslations('frame'))
    expect(result.current('title', { _: 'Welcome, {who}', who: 'Ana' })).toBe('Welcome, Ana')
    expect(result.current('missing')).toBe('frame.missing')
  })

  it('keeps the translator identity across renders', () => {
    const value = createI18nValue(catalogue, 'en')
    const { result, rerender } = renderHook(() => useTranslations('sources'), {
      wrapper: ({ children }) => <I18nAdapterProvider value={value}>{children}</I18nAdapterProvider>,
    })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
    expect(result.current.raw('list')).toEqual(['a', 'b'])
  })

  it('phrases 90 minutes ago in hours', () => {
    const now = new Date('2026-09-26T12:00:00Z')
    const phrase = createFormatter('en').relativeTime(new Date(now.getTime() - 90 * 60_000), now)
    expect(phrase).toMatch(/hour/)
  })

  it('reads the locale from the adapter, else from FakhirProvider', () => {
    expect(renderHook(() => useLocale(), { wrapper: withValue('pt-BR') }).result.current).toBe('pt-BR')
    const viaFakhir = renderHook(() => useLocale(), {
      wrapper: ({ children }) => <FakhirProvider locale="de-DE">{children}</FakhirProvider>,
    })
    expect(viaFakhir.result.current).toBe('de-DE')
    const f = renderHook(() => useFormatter(), { wrapper: withValue('pt-BR') }).result.current
    expect(f.number(1234.5)).toBe('1.234,5')
  })
})
