import { describe, expect, it } from 'vitest'
import { compileIcuMessages } from '../../internal/icuCatalogue'
import { defaultMessages } from '../../internal/messages'
import { formatMessage } from './icu'

describe('ICU messages with positional (numeric) arguments', () => {
  it('substitutes {0} and {1}', () => {
    expect(formatMessage('{0} de {1}', { 0: 3, 1: 5 }, 'pt-BR')).toBe('3 de 5')
  })

  it('selects plural forms on {0} with # in the locale', () => {
    const msg = '{0, plural, one {# pendente} other {# pendentes}}'
    expect(formatMessage(msg, { 0: 1 }, 'pt-BR')).toBe('1 pendente')
    expect(formatMessage(msg, { 0: 1200 }, 'pt-BR')).toBe('1.200 pendentes')
  })

  it('uses Arabic plural categories (zero, two, few, many)', () => {
    const msg = '{0, plural, zero {لا شيء} one {واحد} two {اثنان} few {# قليلة} many {# كثيرة} other {# أخرى}}'
    expect(formatMessage(msg, { 0: 0 }, 'ar')).toBe('لا شيء')
    expect(formatMessage(msg, { 0: 2 }, 'ar')).toBe('اثنان')
    expect(formatMessage(msg, { 0: 3 }, 'ar')).toMatch(/قليلة$/)
    expect(formatMessage(msg, { 0: 11 }, 'ar')).toMatch(/كثيرة$/)
  })

  it('selects on {1} and formats {0, number} with the locale digits', () => {
    expect(formatMessage('{1, select, agent {agente} other {pessoa}}', { 1: 'agent' }, 'pt-BR')).toBe('agente')
    expect(formatMessage('{0, number}', { 0: 1234 }, 'ar-EG')).toBe(new Intl.NumberFormat('ar-EG').format(1234))
  })

  it('compiles catalogue overrides whose defaults are functions into positional ICU calls', () => {
    const compiled = compileIcuMessages(
      { pagination: { range: '{0}–{1} / {2, number}' }, tag: { remove: 'إزالة {0}' } },
      defaultMessages,
      'ar-EG',
    ) as { pagination: { range: (a: number, b: number, c: number) => string }; tag: { remove: (t: string) => string } }
    expect(compiled.pagination.range(1, 50, 1200)).toBe(`1–50 / ${new Intl.NumberFormat('ar-EG').format(1200)}`)
    expect(compiled.tag.remove('بوتي')).toBe('إزالة بوتي')
  })
})
