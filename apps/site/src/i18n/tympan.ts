// The library's own copy (drawer close, skip link, search clear, …) in the site's language: catalogue keys
// "tympan.<path>" become TympanProvider icuMessages (function entries take {0}, {1}, … positionally).
import type { Catalogo } from './I18n'

type Arvore = { [k: string]: string | Arvore }

export function mensagensTympan(catalogo: Catalogo): Arvore {
  const out: Arvore = {}
  for (const [chave, valor] of Object.entries(catalogo)) {
    if (!chave.startsWith('tympan.')) continue
    const partes = chave.slice(7).split('.')
    let no = out
    partes.forEach((p, i) => {
      if (i === partes.length - 1) no[p] = valor
      else no = (no[p] ??= {}) as Arvore
    })
  }
  return out
}
