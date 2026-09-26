// Data shapes that travel between research steps. Every shape has a word, a
// glyph and a tone, so a port chip never relies on colour alone.

import { ChartColumn, Hash, Rows3, Split, Table2 } from 'lucide-react'
import type { IconComponent } from '@datatechsolutions/tympan'
import { defineLabels, fill } from '../internal/labels'

export type DataShape = 'records' | 'table' | 'number' | 'chart' | 'decision'

export const DATA_SHAPES: readonly DataShape[] = ['records', 'table', 'number', 'chart', 'decision']

export type ShapeWords = Record<DataShape, string>

export const shapeWords = defineLabels<ShapeWords>('dataShapes', {
  en: { records: 'records', table: 'table', number: 'number', chart: 'chart', decision: 'decision' },
  'pt-BR': { records: 'registros', table: 'tabela', number: 'número', chart: 'gráfico', decision: 'decisão' },
  es: { records: 'registros', table: 'tabla', number: 'número', chart: 'gráfico', decision: 'decisión' },
})

/** Glyph of each shape (lists and menus; the chips carry the word only). */
export const SHAPE_LOOK: Readonly<Record<DataShape, { icon: IconComponent; tone: string }>> = Object.freeze({
  records: { icon: Rows3, tone: 'categorical-1' },
  table: { icon: Table2, tone: 'categorical-3' },
  number: { icon: Hash, tone: 'categorical-5' },
  chart: { icon: ChartColumn, tone: 'categorical-6' },
  decision: { icon: Split, tone: 'categorical-7' },
})

/** "records / table": the shapes one input accepts, in the reader's words. */
export function shapeList(shapes: readonly DataShape[], words: ShapeWords): string {
  return shapes.map((s) => words[s]).join(' / ')
}

/** Counted shapes ("1 table · 2 charts"), one ICU message per shape. */
export const shapeCountWords = defineLabels<ShapeWords>('dataShapeCounts', {
  en: { records: '{n, plural, one {# record set} other {# record sets}}', table: '{n, plural, one {# table} other {# tables}}', number: '{n, plural, one {# number} other {# numbers}}', chart: '{n, plural, one {# chart} other {# charts}}', decision: '{n, plural, one {# decision} other {# decisions}}' },
  'pt-BR': { records: '{n, plural, one {# conjunto de registros} other {# conjuntos de registros}}', table: '{n, plural, one {# tabela} other {# tabelas}}', number: '{n, plural, one {# número} other {# números}}', chart: '{n, plural, one {# gráfico} other {# gráficos}}', decision: '{n, plural, one {# decisão} other {# decisões}}' },
  es: { records: '{n, plural, one {# conjunto de registros} other {# conjuntos de registros}}', table: '{n, plural, one {# tabla} other {# tablas}}', number: '{n, plural, one {# número} other {# números}}', chart: '{n, plural, one {# gráfico} other {# gráficos}}', decision: '{n, plural, one {# decisión} other {# decisiones}}' },
})

/** "1 table · 1 chart" for a list of output shapes, in shape order. */
export function shapeCounts(shapes: readonly DataShape[], words: ShapeWords, locale: string): string {
  return DATA_SHAPES.filter((s) => shapes.includes(s))
    .map((s) => fill(words[s], { n: shapes.filter((x) => x === s).length }, locale))
    .join(' · ')
}
