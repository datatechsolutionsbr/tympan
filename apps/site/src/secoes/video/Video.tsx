import type { Navegar } from '../../App'
import { Moldura } from '../../Moldura'
import type { RotaDe } from '../../rotas'
export function Video(_: { rota: RotaDe<'video'>; ir: Navegar }) {
  return <Moldura secao="video">…</Moldura>
}
