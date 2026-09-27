// Per-viewer conveniences in localStorage (favourites, zoom, last choices). Every access is wrapped in
// try/catch: private windows and blocked storage must not break the page.
import { useCallback, useState } from 'react'

const PREFIXO = 'ty-site:'

export function lerLocal<T>(chave: string, padrao: T): T {
  try {
    const v = localStorage.getItem(PREFIXO + chave)
    return v ? (JSON.parse(v) as T) : padrao
  } catch {
    return padrao
  }
}

export function guardarLocal(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor))
  } catch {
    /* no storage: the choice lasts for this visit only */
  }
}

export function useLocal<T>(chave: string, padrao: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => lerLocal(chave, padrao))
  const set = useCallback(
    (x: T) => {
      setV(x)
      guardarLocal(chave, x)
    },
    [chave],
  )
  return [v, set]
}

/** Adds or removes an id, keeping the order in which favourites were added. */
export function alternarFavorito(lista: readonly string[], id: string): string[] {
  return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]
}

/** Favourites list hook (ids), stored under `chave`. */
export function useFavoritos(chave: string): [string[], (id: string) => void] {
  const [favs, setFavs] = useLocal<string[]>(chave, [])
  return [favs, (id: string) => setFavs(alternarFavorito(favs, id))]
}
