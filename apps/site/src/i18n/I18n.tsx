// Site copy: flat per-locale ICU catalogues in ./mensagens/<code>.json (pt-BR is the source; every catalogue
// has exactly its keys, see test/i18n.test.ts). The active catalogue is loaded on demand; numbers go
// through Intl with the active locale.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { formatMessage, type MessageParams } from '@datatechsolutions/tympan'
import { guardarLocal, lerLocal } from '../local'
import fonte from './mensagens/pt-BR.json'
import { direcao, escolherLocale, LOCALE_FONTE, urlFontesDoScript } from './locales'

export type Catalogo = Record<string, string>
export type Chave = keyof typeof fonte

const carregadores = import.meta.glob<Catalogo>(['./mensagens/*.json', '!./mensagens/pt-BR.json'], { import: 'default' })

export async function carregarCatalogo(code: string): Promise<Catalogo> {
  if (code === LOCALE_FONTE) return fonte
  const f = carregadores[`./mensagens/${code}.json`]
  return f ? f() : fonte
}

export interface I18n {
  locale: string
  dir: 'ltr' | 'rtl'
  t: (chave: Chave, params?: MessageParams) => string
  /** Has the key (for optional per-id entries such as style labels). */
  tem: (chave: string) => boolean
  /** Looks up a dynamic key (built at runtime), falling back to `padrao`. */
  td: (chave: string, padrao: string, params?: MessageParams) => string
  n: (valor: number, opcoes?: Intl.NumberFormatOptions) => string
  setLocale: (code: string) => void
  catalogo: Catalogo
}

const Ctx = createContext<I18n | null>(null)

export function useI18n(): I18n {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n outside I18nProvider')
  return v
}

/** Locale segment at the start of the hash (#/ja/livro/…), if any. */
export const localeDoHash = (hash: string): string | null => hash.replace(/^#\/?/, '').split(/[/?]/)[0] || null

export function localeInicial(): string {
  return escolherLocale({
    hash: typeof location === 'undefined' ? null : localeDoHash(location.hash),
    guardado: lerLocal<string | null>('locale', null),
    navegador: typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language],
  })
}

export function criarI18n(locale: string, catalogo: Catalogo, setLocale: (c: string) => void): I18n {
  const nf = new Map<string, Intl.NumberFormat>()
  const achar = (chave: string) => catalogo[chave] ?? (fonte as Catalogo)[chave]
  return {
    locale,
    dir: direcao(locale),
    catalogo,
    t: (chave, params) => formatMessage(achar(chave) ?? chave, params, locale),
    tem: (chave) => achar(chave) !== undefined,
    td: (chave, padrao, params) => formatMessage(achar(chave) ?? padrao, params, locale),
    n: (valor, opcoes) => {
      const k = JSON.stringify(opcoes ?? {})
      let f = nf.get(k)
      if (!f) nf.set(k, (f = new Intl.NumberFormat(locale, opcoes)))
      return f.format(valor)
    },
    setLocale,
  }
}

export function I18nProvider({ inicial, catalogoInicial, children }: { inicial: string; catalogoInicial: Catalogo; children: ReactNode }) {
  const [estado, setEstado] = useState({ locale: inicial, catalogo: catalogoInicial })
  const setLocale = useCallback((code: string) => {
    guardarLocal('locale', code)
    void carregarCatalogo(code).then((catalogo) => setEstado({ locale: code, catalogo }))
  }, [])

  // The locale of a hash that names one (#/ar/…) wins, including on back/forward.
  useEffect(() => {
    const on = () => {
      const h = localeDoHash(location.hash)
      const c = h ? escolherLocale({ hash: h }) : null
      if (c && h === c && c !== estado.locale) setLocale(c)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [estado.locale, setLocale])

  // <html lang dir>, and the script fonts of the active locale (only while it is active).
  useEffect(() => {
    const el = document.documentElement
    el.lang = estado.locale
    el.dir = direcao(estado.locale)
    const url = urlFontesDoScript(estado.locale)
    document.querySelectorAll('link[data-ty-site-fontes-script]').forEach((l) => {
      if (l.getAttribute('href') !== url) l.remove()
    })
    if (url && !document.querySelector(`link[data-ty-site-fontes-script][href="${url}"]`)) {
      const l = document.createElement('link')
      l.rel = 'stylesheet'
      l.href = url
      l.setAttribute('data-ty-site-fontes-script', '')
      document.head.appendChild(l)
    }
  }, [estado.locale])

  const valor = useMemo(() => criarI18n(estado.locale, estado.catalogo, setLocale), [estado, setLocale])
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}
