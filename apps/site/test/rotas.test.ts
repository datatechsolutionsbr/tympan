import { describe, expect, it } from 'vitest'
import { ESTILO_BASE, formatarRota, lerRota, segmentos, teclaDeTroca, vizinho, type Rota } from '../src/rotas'

describe('routes', () => {
  it('reads each section, with defaults for missing segments', () => {
    expect(lerRota('')).toEqual({ secao: 'inicio' })
    expect(lerRota('#/')).toEqual({ secao: 'inicio' })
    expect(lerRota('#/nada/aqui')).toEqual({ secao: 'inicio' })
    expect(lerRota('#/componentes/forms-a')).toEqual({ secao: 'componentes', pagina: 'forms-a' })
    expect(lerRota('#/temas')).toEqual({ secao: 'temas', tema: 'tympan', modo: 'um', b: 'tympan' })
    expect(lerRota('#/livro')).toEqual({ secao: 'livro', estilo: 'jornal', grafico: 'estudo', pb: false, modo: 'um', b: ESTILO_BASE })
    expect(lerRota('#/video/print-cordel')).toEqual({ secao: 'video', tema: 'print-cordel' })
    expect(lerRota('#/instalar')).toEqual({ secao: 'instalar' })
  })

  it('strips a known locale segment and writes the active one in links', () => {
    expect(segmentos('#/ja/livro/suico')).toEqual({ locale: 'ja', partes: ['livro', 'suico'] })
    expect(segmentos('#/xx/livro')).toEqual({ partes: ['xx', 'livro'] })
    expect(lerRota('#/ar/livro/suico/barras/pb/comparar/cordel')).toEqual({ secao: 'livro', estilo: 'suico', grafico: 'barras', pb: true, modo: 'comparar', b: 'cordel' })
    expect(formatarRota({ secao: 'inicio' }, 'ja')).toBe('#/ja')
    expect(formatarRota({ secao: 'instalar' }, 'pt-BR')).toBe('#/pt-BR/instalar')
  })

  it('never writes a query string, and drops trailing defaults', () => {
    const r = lerRota('#/livro/cordel')
    expect(formatarRota(r)).toBe('#/livro/cordel')
    expect(formatarRota({ ...r, pb: true } as Rota)).toBe('#/livro/cordel/estudo/pb')
    expect(formatarRota({ ...r, modo: 'antes' } as Rota)).toBe('#/livro/cordel/estudo/cor/antes')
    expect(formatarRota({ ...r, modo: 'antes', b: 'suico' } as Rota)).toBe('#/livro/cordel/estudo/cor/antes/suico')
    expect(formatarRota({ ...r, b: 'suico' } as Rota)).toBe('#/livro/cordel')
    for (const h of ['#/livro/cordel/barras/pb/galeria', '#/temas/print-riso/comparar/neutral', '#/componentes/core']) expect(formatarRota(lerRota(h))).toBe(h)
    expect(formatarRota(lerRota('#/pt-BR/livro/cordel'), 'pt-BR')).not.toContain('?')
  })

  it('opens renamed style ids and falls back for unknown values', () => {
    expect(lerRota('#/livro/nao-existe')).toMatchObject({ estilo: 'jornal' })
    expect(lerRota('#/livro/jornal/qualquer')).toMatchObject({ grafico: 'estudo' })
    expect(lerRota('#/livro/jornal/estudo/cor/xyz')).toMatchObject({ modo: 'um' })
  })

  it('reads the spread of the whole-book mode from the last segment', () => {
    const r = lerRota('#/livro/riso/estudo/cor/completo/parte')
    expect(r).toMatchObject({ modo: 'completo', dupla: 'parte' })
    expect(formatarRota(r)).toBe('#/livro/riso/estudo/cor/completo/parte')
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
