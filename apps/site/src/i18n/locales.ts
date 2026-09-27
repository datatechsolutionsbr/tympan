// The site's languages: the same set as Astrlabe's web UI (astrlabe-web-i18n catalogues/locales.json).
// pt-BR is the source catalogue. Pure helpers, tested in test/i18n.test.ts.

export interface LocaleInfo {
  code: string
  primarySubtag: string
  nativeName: string
  rtl: boolean
}

export const LOCALES: readonly LocaleInfo[] = [
  { code: 'en', primarySubtag: 'en', nativeName: 'English', rtl: false },
  { code: 'pt-BR', primarySubtag: 'pt', nativeName: 'Português (Brasil)', rtl: false },
  { code: 'es', primarySubtag: 'es', nativeName: 'Español', rtl: false },
  { code: 'fr', primarySubtag: 'fr', nativeName: 'Français', rtl: false },
  { code: 'de', primarySubtag: 'de', nativeName: 'Deutsch', rtl: false },
  { code: 'it', primarySubtag: 'it', nativeName: 'Italiano', rtl: false },
  { code: 'ja', primarySubtag: 'ja', nativeName: '日本語', rtl: false },
  { code: 'ko', primarySubtag: 'ko', nativeName: '한국어', rtl: false },
  { code: 'zh-CN', primarySubtag: 'zh', nativeName: '简体中文', rtl: false },
  { code: 'ru', primarySubtag: 'ru', nativeName: 'Русский', rtl: false },
  { code: 'hi', primarySubtag: 'hi', nativeName: 'हिन्दी', rtl: false },
  { code: 'ar', primarySubtag: 'ar', nativeName: 'العربية', rtl: true },
  { code: 'nl', primarySubtag: 'nl', nativeName: 'Nederlands', rtl: false },
  { code: 'pl', primarySubtag: 'pl', nativeName: 'Polski', rtl: false },
  { code: 'tr', primarySubtag: 'tr', nativeName: 'Türkçe', rtl: false },
]

export const LOCALE_CODES: readonly string[] = LOCALES.map((l) => l.code)
export const LOCALE_FONTE = 'pt-BR'
export const LOCALE_PADRAO = 'en'

/** The supported code for a tag, matched exactly (case-insensitive) or else by primary subtag. */
export function casarLocale(tag: string | null | undefined): string | undefined {
  if (!tag) return undefined
  const t = tag.trim().replace('_', '-').toLowerCase()
  const exato = LOCALES.find((l) => l.code.toLowerCase() === t)
  if (exato) return exato.code
  const primario = t.split('-')[0]
  return LOCALES.find((l) => l.primarySubtag === primario)?.code
}

/**
 * Initial locale: the hash segment, then the stored choice, then the browser's languages (full tag, then
 * primary subtag: pt-PT → pt-BR, zh-TW → zh-CN), else English.
 */
export function escolherLocale(opcoes: { hash?: string | null; guardado?: string | null; navegador?: readonly string[] }): string {
  return (
    casarLocale(opcoes.hash) ??
    casarLocale(opcoes.guardado) ??
    (opcoes.navegador ?? []).map(casarLocale).find(Boolean) ??
    LOCALE_PADRAO
  )
}

export const infoLocale = (code: string): LocaleInfo => LOCALES.find((l) => l.code === code) ?? LOCALES[0]!
export const direcao = (code: string): 'rtl' | 'ltr' => (infoLocale(code).rtl ? 'rtl' : 'ltr')

/**
 * Google Fonts families for scripts the base faces (Source Serif 4, IBM Plex) do not cover, loaded only
 * while that locale is active. Cyrillic and Latin are covered by the base faces.
 */
export const FONTES_DO_SCRIPT: Readonly<Record<string, string>> = {
  ar: 'Noto+Naskh+Arabic:wght@400;600&family=Noto+Sans+Arabic:wght@400;500;600',
  hi: 'Noto+Serif+Devanagari:wght@400;600&family=Noto+Sans+Devanagari:wght@400;500;600',
  ja: 'Noto+Serif+JP:wght@400;600&family=Noto+Sans+JP:wght@400;500;600',
  ko: 'Noto+Serif+KR:wght@400;600&family=Noto+Sans+KR:wght@400;500;600',
  'zh-CN': 'Noto+Serif+SC:wght@400;600&family=Noto+Sans+SC:wght@400;500;600',
}

export function urlFontesDoScript(code: string): string | null {
  const f = FONTES_DO_SCRIPT[code]
  return f ? `https://fonts.googleapis.com/css2?family=${f}&display=swap` : null
}
