import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatMessage } from '@datatechsolutions/tympan'
import { casarLocale, direcao, escolherLocale, LOCALE_CODES, urlFontesDoScript } from '../src/i18n/locales'

const pasta = join(import.meta.dirname, '../src/i18n/mensagens')
const ler = (f: string) => JSON.parse(readFileSync(join(pasta, f), 'utf8')) as Record<string, string>
const fonte = ler('pt-BR.json')
const nomes = (s: string) => new Set([...s.matchAll(/\{\s*([\w-]+)\s*[,}]/g)].map((m) => m[1]))

describe('catalogues', () => {
  it('has one catalogue per supported locale', () => {
    expect(readdirSync(pasta).map((f) => f.replace('.json', '')).sort()).toEqual([...LOCALE_CODES].sort())
  })

  for (const code of LOCALE_CODES.filter((c) => c !== 'pt-BR')) {
    it(`${code} has exactly the pt-BR keys, and only its placeholders`, () => {
      const c = ler(`${code}.json`)
      expect(Object.keys(c).sort()).toEqual(Object.keys(fonte).sort())
      for (const [k, v] of Object.entries(c)) {
        expect(typeof v, k).toBe('string')
        expect(v.trim(), k).not.toBe('')
        for (const n of nomes(v)) expect(nomes(fonte[k]!).has(n), `${code} ${k}: {${n}}`).toBe(true)
      }
    })

    it(`${code} messages all parse as ICU`, () => {
      const c = ler(`${code}.json`)
      const params = { n: 3, total: 9, '0': 2, q: 'x', estilo: 'x', letra: 'A', mm: 1.5, atual: '0:01', fonte: 'x', titulo: 'x', corpo: 'x', papel: 'x', corPapel: '#fff', destaque: '#000', render: 'x', cantos: 'x', fontes: 'x' }
      for (const [k, v] of Object.entries(c)) {
        const out = formatMessage(v, params, code)
        expect(out, `${code} ${k}`).not.toMatch(/\{\s*[\w-]+\s*,\s*(plural|number|select)/)
      }
    })
  }
})

describe('locale choice', () => {
  it('matches full tags, then the primary subtag', () => {
    expect(casarLocale('pt-BR')).toBe('pt-BR')
    expect(casarLocale('pt-PT')).toBe('pt-BR')
    expect(casarLocale('zh-TW')).toBe('zh-CN')
    expect(casarLocale('en_GB')).toBe('en')
    expect(casarLocale('sv')).toBeUndefined()
  })

  it('prefers the hash, then the stored choice, then the browser, else English', () => {
    expect(escolherLocale({ hash: 'ja', guardado: 'fr', navegador: ['de'] })).toBe('ja')
    expect(escolherLocale({ hash: 'livro', guardado: 'fr', navegador: ['de'] })).toBe('fr')
    expect(escolherLocale({ navegador: ['sv-SE', 'nl-BE'] })).toBe('nl')
    expect(escolherLocale({ navegador: ['sv'] })).toBe('en')
  })

  it('knows the reading direction and the script fonts', () => {
    expect(direcao('ar')).toBe('rtl')
    expect(direcao('ja')).toBe('ltr')
    expect(urlFontesDoScript('hi')).toContain('fonts.googleapis.com')
    expect(urlFontesDoScript('fr')).toBeNull()
  })
})
