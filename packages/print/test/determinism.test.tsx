// @vitest-environment node
// Server rendering is deterministic: the same book renders to the same bytes
// (rough.js seeds are fixed, ids come from useId, no Math.random or dates).
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PRINT_PRESET_NAMES } from '@datatechsolutions/tympan-tokens'
import { PrintBook } from '../src/index.ts'
import { DuplaEstudo, GRAFICO_DO_ESTUDO } from '../gallery/src/study.tsx'

describe('deterministic output', () => {
  for (const estilo of PRINT_PRESET_NAMES) {
    it(estilo, () => {
      const livro = (pb: boolean) => (
        <PrintBook estilo={estilo} pb={pb}>
          <DuplaEstudo grafico={GRAFICO_DO_ESTUDO[estilo] ?? 'halteres'} />
          <DuplaEstudo grafico="halteres" />
        </PrintBook>
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
