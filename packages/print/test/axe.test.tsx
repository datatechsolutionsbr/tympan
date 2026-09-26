// axe-core on the rendered spread, in every preset (colour contrast is
// checked by the token tests: jsdom has no layout).
import { render } from '@testing-library/react'
import { describe, it } from 'vitest'
import { PRINT_PRESET_NAMES } from '@datatechsolutions/tympan-tokens'
import { LivroPrint, Mapa } from '../src/index.ts'
import { DuplaFpm, GRAFICO_DO_ESTUDO } from '../gallery/src/fpm.tsx'
import { expectNoAxeViolations } from './axe.ts'

describe('no axe violations', () => {
  for (const estilo of PRINT_PRESET_NAMES) {
    it(estilo, async () => {
      const { container } = render(
        <main>
          <LivroPrint estilo={estilo}>
            <DuplaFpm grafico={GRAFICO_DO_ESTUDO[estilo] ?? 'halteres'} />
          </LivroPrint>
        </main>,
      )
      await expectNoAxeViolations(container)
    })
  }
})

describe('no axe violations: maps', () => {
  it('uf level, recorte with highlight, small multiples, in P&B', async () => {
    const { container } = render(
      <main>
        <LivroPrint estilo="jornal" pb>
          <Mapa nivel="uf" titulo="UF" alt="Minas Gerais tem mais municípios." valores={{ MG: 853, SP: 645 }} limites={[700]} />
          <Mapa titulo="Sul" alt="Recorte Sul, exemplo." recorte="Sul" exemplo destaques={['Porto Alegre/RS']} largura={60} />
          <Mapa titulo="Regiões" alt="Pequenos múltiplos, exemplo." exemplo largura={120} altura={60} multiplos={[{ titulo: 'Sul', recorte: 'Sul' }, { titulo: 'Sudeste', recorte: 'Sudeste' }]} />
        </LivroPrint>
      </main>,
    )
    await expectNoAxeViolations(container)
  })
})
