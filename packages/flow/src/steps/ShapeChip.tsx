// Shape chips: a data shape as glyph + word on its tone (never colour alone),
// and the "takes → gives" line of a step.

import { ArrowRight } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { SHAPE_LOOK, type DataShape, type ShapeWords } from './shapes'
import type { StepEditorWords } from './stepLabels'

export interface ShapeChipProps extends HTMLAttributes<HTMLSpanElement> {
  shapes: readonly DataShape[]
  words: ShapeWords
}

/** One chip; several accepted shapes share it ("records / table"). */
export function ShapeChip({ shapes, words, className, ...rest }: ShapeChipProps) {
  const first = shapes[0]
  const tone = shapes.length === 1 && first ? SHAPE_LOOK[first].tone : 'neutral'
  return (
    <span {...rest} className={['fk-shape-chip', className].filter(Boolean).join(' ')} data-tone={tone} data-shapes={shapes.join(' ')} data-several={shapes.length > 1 ? 'true' : undefined}>
      {shapes.map((s, i) => {
        const Glyph = SHAPE_LOOK[s].icon
        return (
          <span key={s} className="fk-shape-chip__part" data-tone={SHAPE_LOOK[s].tone}>
            {i > 0 ? <span className="fk-shape-chip__or">/</span> : null}
            <Glyph aria-hidden="true" focusable="false" />
            {words[s]}
          </span>
        )
      })}
    </span>
  )
}

/** "records → table": what a step takes and gives. */
export function ShapeFlow({ inputs, output, words, labels }: { inputs: ReadonlyArray<readonly DataShape[]>; output: DataShape | null; words: ShapeWords; labels: Pick<StepEditorWords, 'inputs' | 'output' | 'nothing'> }) {
  return (
    <span className="fk-shape-flow">
      {inputs.length ? (
        <>
          <span className="fk-visually-hidden">{labels.inputs}: </span>
          {inputs.map((accepts, i) => (
            <ShapeChip key={i} shapes={accepts} words={words} />
          ))}
          <ArrowRight className="fk-shape-flow__arrow" aria-hidden="true" focusable="false" />
        </>
      ) : null}
      <span className="fk-visually-hidden">{labels.output}: </span>
      {output ? <ShapeChip shapes={[output]} words={words} /> : <span className="fk-shape-flow__none">{labels.nothing}</span>}
    </span>
  )
}
