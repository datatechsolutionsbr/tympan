// Shape chips: a data shape as glyph + word on its tone (never colour alone),
// and the "takes → gives" line of a step.

import { ArrowRight } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import type { DataShape, ShapeWords } from './shapes'
import type { StepEditorWords } from './stepLabels'

export interface ShapeChipProps extends HTMLAttributes<HTMLSpanElement> {
  shapes: readonly DataShape[]
  words: ShapeWords
}

/** One outlined chip in the shape's colour; several accepted shapes share it ("records / table"). */
export function ShapeChip({ shapes, words, className, ...rest }: ShapeChipProps) {
  return (
    <span {...rest} className={['fk-shape-chip', className].filter(Boolean).join(' ')} data-shape={shapes.length === 1 ? shapes[0] : 'several'}>
      {shapes.map((s, i) => (
        <span key={s} className="fk-shape-chip__word" data-shape={s}>
          {i > 0 ? '/' : ''}
          {words[s]}
        </span>
      ))}
    </span>
  )
}

/** "records → table" (or "start → records" for a source step). */
export function ShapeFlow({ inputs, output, words, labels, bare = false }: { inputs: ReadonlyArray<readonly DataShape[]>; output: DataShape | null; words: ShapeWords; labels: Pick<StepEditorWords, 'inputs' | 'output' | 'nothing' | 'origin'>; bare?: boolean }) {
  // Inputs taking the same shapes show once ("table" for a join of two tables).
  const distinct = inputs.filter((a, i) => inputs.findIndex((b) => b.join() === a.join()) === i)
  return (
    <span className="fk-shape-flow">
      <span className="fk-visually-hidden">{labels.inputs}: </span>
      {distinct.length ? distinct.map((accepts, i) => <ShapeChip key={i} shapes={accepts} words={words} />) : <span className={bare ? 'fk-visually-hidden' : 'fk-shape-flow__origin'}>{labels.origin}</span>}
      <ArrowRight className="fk-shape-flow__arrow" aria-hidden="true" focusable="false" />
      <span className="fk-visually-hidden">{labels.output}: </span>
      {output ? <ShapeChip shapes={[output]} words={words} /> : <span className="fk-shape-flow__none">{labels.nothing}</span>}
    </span>
  )
}
