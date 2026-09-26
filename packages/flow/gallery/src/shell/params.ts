// Gallery state in the hash: #/editor?lang=pt-BR&state=picker
import { useEffect, useState } from 'react'

export function useHashParams(): URLSearchParams {
  const read = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const [params, setParams] = useState(read)
  useEffect(() => {
    const on = () => setParams(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return params
}

/** Rewrites one hash parameter (keeps the route). */
export function setHashParam(key: string, value: string | null) {
  const [route, query] = window.location.hash.split('?')
  const params = new URLSearchParams(query ?? '')
  if (value === null) params.delete(key)
  else params.set(key, value)
  const next = params.toString()
  window.location.hash = `${route}${next ? `?${next}` : ''}`
}

export const GALLERY_LOCALES = ['pt-BR', 'en', 'es', 'ar', 'ja'] as const
export const nextLocale = (current: string) => GALLERY_LOCALES[(GALLERY_LOCALES.indexOf(current as never) + 1) % GALLERY_LOCALES.length]!
