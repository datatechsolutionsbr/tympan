// axe-core on the rendered spread, in every preset (colour contrast is
// checked by the token tests: jsdom has no layout).
import { render } from '@testing-library/react'
import { describe, it } from 'vitest'
import { PRINT_PRESET_NAMES } from '@datatechsolutions/tympan-tokens'
import { LivroPrint } from '../src/index.ts'
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
