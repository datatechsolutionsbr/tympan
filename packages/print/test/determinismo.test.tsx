// @vitest-environment node
// Server rendering is deterministic: the same book renders to the same bytes
// (rough.js seeds are fixed, ids come from useId, no Math.random or dates).
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PRINT_PRESET_NAMES } from '@datatechsolutions/tympan-tokens'
import { LivroPrint } from '../src/index.ts'
import { DuplaFpm, GRAFICO_DO_ESTUDO } from '../gallery/src/fpm.tsx'

describe('deterministic output', () => {
  for (const estilo of PRINT_PRESET_NAMES) {
    it(estilo, () => {
      const livro = (pb: boolean) => (
        <LivroPrint estilo={estilo} pb={pb}>
          <DuplaFpm grafico={GRAFICO_DO_ESTUDO[estilo] ?? 'halteres'} />
          <DuplaFpm grafico="halteres" />
        </LivroPrint>
      )
      for (const pb of [false, true]) {
        const a = renderToStaticMarkup(livro(pb))
        const b = renderToStaticMarkup(livro(pb))
        expect(a).toBe(b)
        expect(a).not.toMatch(/NaN|undefined|Infinity/)
      }
    })
  }
})
