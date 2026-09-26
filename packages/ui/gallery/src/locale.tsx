// Gallery locale, direction and pseudo-localization (applied to <html>).
import { createContext, useContext, useEffect, useState } from 'react'

export const GALLERY_LOCALES = [
  { tag: 'pt-BR', name: 'Português (Brasil)' },
  { tag: 'en', name: 'English' },
  { tag: 'es', name: 'Español' },
  { tag: 'ar', name: 'العربية' },
  { tag: 'he', name: 'עברית' },
  { tag: 'ja', name: '日本語' },
  { tag: 'hi', name: 'हिन्दी' },
  { tag: 'ru', name: 'Русский' },
] as const

const RTL = new Set(['ar', 'he', 'fa', 'ur'])

export function directionOf(tag: string): 'ltr' | 'rtl' {
  return RTL.has(tag.split('-')[0]!) ? 'rtl' : 'ltr'
}

export interface GalleryLocale {
  locale: string
  setLocale: (tag: string) => void
  pseudo: boolean
  setPseudo: (on: boolean) => void
}

export const GalleryLocaleContext = createContext<GalleryLocale>({ locale: 'en', setLocale: () => {}, pseudo: false, setPseudo: () => {} })
export const useGalleryLocale = () => useContext(GalleryLocaleContext)

const KEY = 'fk-gallery-locale'

export function useGalleryLocaleState(): GalleryLocale {
  const [state, setState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '') as { locale: string; pseudo: boolean }
    } catch {
      return { locale: 'en', pseudo: false }
    }
  })
  useEffect(() => {
    document.documentElement.lang = state.locale
    document.documentElement.dir = directionOf(state.locale)
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable */
    }
  }, [state])
  return {
    locale: state.locale,
    setLocale: (locale) => setState((s) => ({ ...s, locale })),
    pseudo: state.pseudo,
    setPseudo: (pseudo) => setState((s) => ({ ...s, pseudo })),
  }
}
