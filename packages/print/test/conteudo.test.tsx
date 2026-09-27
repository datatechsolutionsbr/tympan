// @vitest-environment node
// A real book's content folder (livro.json + capitulos/): every panel of every
// chapter renders in every preset, and no prop of the JSON is ignored.
// Set BRASIL_REAL_CONTEUDO to the absolute path of the conteudo folder; the
// suite is skipped without it (CI has no access to the book repository).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PRINT_PRESET_NAMES } from '@datatechsolutions/tympan-tokens'
import { CapituloConteudo, LivroConteudo, LivroPrint, NoConteudo, propsDesconhecidas, type CapituloJson, type LivroJson, type NoJson } from '../src/index.ts'

const pasta = process.env.BRASIL_REAL_CONTEUDO
const disponivel = Boolean(pasta && existsSync(join(pasta, 'livro.json')))

function carregar() {
  const livro = JSON.parse(readFileSync(join(pasta!, 'livro.json'), 'utf8')) as LivroJson
  const capitulos: Record<string, CapituloJson> = {}
  for (const arq of readdirSync(join(pasta!, 'capitulos')).filter((f) => f.endsWith('.json'))) {
    const c = JSON.parse(readFileSync(join(pasta!, 'capitulos', arq), 'utf8')) as CapituloJson
    capitulos[c.id] = c
  }
  return { livro, capitulos }
}

function nos(cap: CapituloJson): Array<{ onde: string; no: NoJson }> {
  return cap.duplas.flatMap((d) => d.paginas.flatMap((p) => p.paineis.map((no, i) => ({ onde: `${cap.id} ${d.numero} ${p.lado} #${i} ${no.tipo}`, no }))))
}

describe.skipIf(!disponivel)('brasil-real content', () => {
  const { livro, capitulos } = disponivel ? carregar() : { livro: null, capitulos: {} as Record<string, CapituloJson> }

  it('every chapter of livro.json exists', () => {
    for (const id of livro!.capitulos) expect(capitulos[id], id).toBeDefined()
  })

  it('no prop of any panel is ignored', () => {
    const ignoradas = Object.values(capitulos).flatMap((c) => nos(c).flatMap(({ onde, no }) => propsDesconhecidas(no).map((p) => `${onde}: ${p}`)))
    expect(ignoradas).toEqual([])
  })

  for (const estilo of PRINT_PRESET_NAMES) {
    it(`${estilo}: every panel of every chapter renders`, () => {
      for (const cap of Object.values(capitulos)) {
        for (const { onde, no } of nos(cap)) {
          let html = ''
          expect(() => {
            html = renderToStaticMarkup(
              <LivroPrint estilo={estilo} incluirCss={false} carregarFontes={false}>
                <NoConteudo no={no} />
              </LivroPrint>,
            )
          }, onde).not.toThrow()
          expect(html, onde).not.toMatch(/NaN|Infinity|>undefined</)
        }
        expect(renderToStaticMarkup(<LivroPrint estilo={estilo} incluirCss={false} carregarFontes={false}><CapituloConteudo capitulo={cap} /></LivroPrint>).length).toBeGreaterThan(500)
      }
    })
  }

  it('the whole book renders from livro.json, deterministically', () => {
    const a = renderToStaticMarkup(<LivroConteudo livro={livro!} capitulos={capitulos} />)
    const b = renderToStaticMarkup(<LivroConteudo livro={livro!} capitulos={capitulos} />)
    expect(a).toBe(b)
    expect(a).toContain(`data-ty-print-style="${livro!.estilo}"`)
  })
})
