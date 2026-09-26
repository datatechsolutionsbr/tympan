// Data shapes that travel between research steps. Every shape has a word, a
// glyph and a tone, so a port chip never relies on colour alone.

import { ChartColumn, Hash, Rows3, Split, Table2 } from 'lucide-react'
import type { IconComponent } from '@fakhir/design-system'
import { defineLabels } from '../internal/labels'

export type DataShape = 'records' | 'table' | 'number' | 'chart' | 'decision'

export const DATA_SHAPES: readonly DataShape[] = ['records', 'table', 'number', 'chart', 'decision']

export type ShapeWords = Record<DataShape, string>

export const shapeWords = defineLabels<ShapeWords>('dataShapes', {
  en: { records: 'records', table: 'table', number: 'number', chart: 'chart', decision: 'decision' },
  'pt-BR': { records: 'registros', table: 'tabela', number: 'número', chart: 'gráfico', decision: 'decisão' },
  es: { records: 'registros', table: 'tabla', number: 'número', chart: 'gráfico', decision: 'decisión' },
})

/** Glyph and categorical tone of each shape. */
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
