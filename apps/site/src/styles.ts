// What the site says about a book style: the neutral label and a short neutral description of the look
// (fonts, palette, chart, corners). The preset's `referencia` (which names publications and people) is
// never shown on the site.
import { printPresets, type PrintPresetName, type PrintStyle } from './tokens'

/** First family of a CSS font stack: `"Source Serif 4", Georgia, serif` → `Source Serif 4`. */
export function familia(pilha: string): string {
  const primeira = pilha.split(',')[0]?.trim() ?? ''
  return primeira.replace(/^["']|["']$/g, '') || pilha
}

const RENDERIZADOR: Record<PrintStyle['chart'], string> = {
  limpo: 'traço limpo',
  mao: 'traço à mão',
  isotype: 'pictogramas',
  gravura: 'gravura',
  prancheta: 'desenho técnico',
  aquarela: 'aquarela',
  riso: 'risografia',
  pontos: 'pontos',
}

const TEXTURA: Record<PrintStyle['papel']['textura'], string> = {
  nenhuma: 'papel liso',
  grao: 'papel com grão',
  pauta: 'papel pautado',
  milimetrado: 'papel milimetrado',
  fibra: 'papel com fibra',
}

export const rotuloRenderizador = (s: PrintStyle) => RENDERIZADOR[s.grafico] ?? s.grafico
export const rotuloTextura = (s: PrintStyle) => TEXTURA[s.papel.textura] ?? s.papel.textura

/** Short neutral description: fonts, paper, accent, chart and corners. */
export function descricaoEstilo(s: PrintStyle): string {
  const titulo = familia(s.fontes.titulo)
  const corpo = familia(s.fontes.corpo)
  const fontes = titulo === corpo ? `Títulos e texto em ${titulo}` : `Títulos em ${titulo}, texto em ${corpo}`
  const cantos = s.raio > 0 ? `cantos de ${String(s.raio).replace('.', ',')} mm` : 'cantos retos'
  return `${fontes}; ${rotuloTextura(s)} ${s.cor.papel} e destaque ${s.cor.destaque}; gráfico em ${rotuloRenderizador(s)}, ${cantos}.`
}

export const estilo = (id: PrintPresetName): PrintStyle => printPresets[id]

/** Colours shown as chips in the style sheet (hex, in the preset's order). */
export function paleta(s: PrintStyle): Array<{ nome: string; cor: string }> {
  const c = s.cor
  return [
    { nome: 'papel', cor: c.papel },
    { nome: 'tinta', cor: c.tinta },
    { nome: 'tinta 2', cor: c.tinta2 },
    { nome: 'tinta 3', cor: c.tinta3 },
    { nome: 'linha', cor: c.linha },
    { nome: 'destaque', cor: c.destaque },
    { nome: 'destaque 2', cor: c.destaque2 },
    { nome: 'marca-texto', cor: c.marcaTexto },
    { nome: 'contexto', cor: c.contexto },
  ]
}

/** Id of the UI theme derived from a book style. */
export const temaDoEstilo = (id: string) => `print-${id}`

/** Swatch of a style in lists: paper, ink and accent (the accent falls back to destaque 2 when it is the ink). */
export function amostra(s: PrintStyle): { papel: string; tinta: string; destaque: string } {
  const destaque = s.cor.destaque.toLowerCase() === s.cor.tinta.toLowerCase() ? s.cor.destaque2 : s.cor.destaque
  return { papel: s.cor.papel, tinta: s.cor.tinta, destaque }
}

/** Case- and accent-insensitive search over label, id and fonts (never the `referencia`). */
export function filtrarEstilos(ids: readonly PrintPresetName[], busca: string): PrintPresetName[] {
  const norm = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
  const q = norm(busca.trim())
  if (!q) return [...ids]
  return ids.filter((id) => {
    const s = printPresets[id]
    return norm(`${s.label} ${id} ${familia(s.fontes.titulo)} ${familia(s.fontes.corpo)}`).includes(q)
  })
}
