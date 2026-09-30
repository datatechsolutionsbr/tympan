import { describe, expect, it } from 'vitest'
import { ESTILO_BASE, formatarRota, lerRota, segmentos, teclaDeTroca, vizinho, type Rota } from '../src/routes'

describe('routes', () => {
  it('reads each section, with defaults for missing segments', () => {
    expect(lerRota('')).toEqual({ secao: 'home' })
    expect(lerRota('#/')).toEqual({ secao: 'home' })
    expect(lerRota('#/nada/aqui')).toEqual({ secao: 'home' })
    expect(lerRota('#/components/forms-a')).toEqual({ secao: 'components', pagina: 'forms-a' })
    expect(lerRota('#/themes')).toEqual({ secao: 'themes', tema: 'tympan', modo: 'um', b: 'tympan' })
    expect(lerRota('#/book')).toEqual({ secao: 'book', estilo: 'jornal', grafico: 'study', pb: false, modo: 'um', b: ESTILO_BASE })
    expect(lerRota('#/video/print-cordel')).toEqual({ secao: 'video', tema: 'print-cordel' })
    expect(lerRota('#/install')).toEqual({ secao: 'install' })
  })

  it('strips a known locale segment and writes the active one in links', () => {
    expect(segmentos('#/ja/book/suico')).toEqual({ locale: 'ja', partes: ['book', 'suico'] })
    expect(segmentos('#/xx/book')).toEqual({ partes: ['xx', 'book'] })
    expect(lerRota('#/ar/book/suico/barras/pb/comparar/cordel')).toEqual({ secao: 'book', estilo: 'suico', grafico: 'barras', pb: true, modo: 'comparar', b: 'cordel' })
    expect(formatarRota({ secao: 'home' }, 'ja')).toBe('#/ja')
    expect(formatarRota({ secao: 'install' }, 'pt-BR')).toBe('#/pt-BR/install')
  })

  it('never writes a query string, and drops trailing defaults', () => {
    const r = lerRota('#/book/cordel')
    expect(formatarRota(r)).toBe('#/book/cordel')
    expect(formatarRota({ ...r, pb: true } as Rota)).toBe('#/book/cordel/study/pb')
    expect(formatarRota({ ...r, modo: 'antes' } as Rota)).toBe('#/book/cordel/study/cor/antes')
    expect(formatarRota({ ...r, modo: 'antes', b: 'suico' } as Rota)).toBe('#/book/cordel/study/cor/antes/suico')
    expect(formatarRota({ ...r, b: 'suico' } as Rota)).toBe('#/book/cordel')
    for (const h of ['#/book/cordel/barras/pb/gallery', '#/themes/print-riso/comparar/neutral', '#/components/core']) expect(formatarRota(lerRota(h))).toBe(h)
    expect(formatarRota(lerRota('#/pt-BR/book/cordel'), 'pt-BR')).not.toContain('?')
  })

  it('opens renamed style ids and falls back for unknown values', () => {
    expect(lerRota('#/book/nao-existe')).toMatchObject({ estilo: 'jornal' })
    expect(lerRota('#/book/jornal/qualquer')).toMatchObject({ grafico: 'study' })
    expect(lerRota('#/book/jornal/study/cor/xyz')).toMatchObject({ modo: 'um' })
  })

  it('reads the spread of the whole-book mode from the last segment', () => {
    const r = lerRota('#/book/riso/study/cor/completo/parte')
    expect(r).toMatchObject({ modo: 'completo', dupla: 'parte' })
    expect(formatarRota(r)).toBe('#/book/riso/study/cor/completo/parte')
  })

  it('steps through a list with wrap-around', () => {
    expect(vizinho(['a', 'b', 'c'], 'c', 1)).toBe('a')
    expect(vizinho(['a', 'b', 'c'], 'a', -1)).toBe('c')
    expect(vizinho(['a', 'b', 'c'], 'x', 1)).toBe('a')
    expect(vizinho([], 'x', 1)).toBe('x')
  })

  it('ignores arrow keys typed in fields and composite widgets', () => {
    const input = document.createElement('input')
    const radio = document.createElement('div')
    radio.setAttribute('role', 'radiogroup')
    const inner = document.createElement('span')
    radio.append(inner)
    expect(teclaDeTroca(input)).toBe(false)
    expect(teclaDeTroca(inner)).toBe(false)
    expect(teclaDeTroca(document.body)).toBe(true)
    expect(teclaDeTroca(null)).toBe(true)
  })
})
