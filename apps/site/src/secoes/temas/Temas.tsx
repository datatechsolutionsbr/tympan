import type { Navegar } from '../../App'
import { Moldura } from '../../Moldura'
import type { RotaDe } from '../../rotas'
export function Temas(_: { rota: RotaDe<'temas'>; ir: Navegar }) {
  return <Moldura secao="temas">…</Moldura>
}
