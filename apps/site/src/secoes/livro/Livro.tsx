import type { Navegar } from '../../App'
import { Moldura } from '../../Moldura'
import type { RotaDe } from '../../rotas'
export function Livro(_: { rota: RotaDe<'livro'>; ir: Navegar }) {
  return <Moldura secao="livro">…</Moldura>
}
