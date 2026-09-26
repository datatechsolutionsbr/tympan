import type { ReactNode } from 'react'
import { Separator as AriaSeparator } from 'react-aria-components'
import { cx } from '../../internal/cx'

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  /** Line strength: `--fk-line` or the fainter `--fk-line-soft`. */
  emphasis?: 'regular' | 'soft'
  /** Short text centred on the rule, such as "or". */
  caption?: ReactNode
  /** Exposes the separator role; decorative otherwise. */
  semantic?: boolean
  /** Margin step from the spacing scale. */
  spacing?: 'none' | 'regular' | 'roomy'
  className?: string
}

const Stroke = () => <span className="fk-separator__line" aria-hidden="true" />

/** Thin rule between groups of content (spec: wave-1/separator.md). */
export function Separator(props: SeparatorProps) {
  const orientation = props.orientation ?? 'horizontal'
  const shared = {
    'data-orientation': orientation,
    'data-emphasis': props.emphasis ?? 'regular',
    'data-spacing': props.spacing ?? 'regular',
  }
  const captioned = props.caption !== undefined && props.caption !== null

  // Three renderings: captioned (text stays readable, strokes are decoration),
  // semantic (separator role) and purely decorative.
  if (captioned) {
    return (
      <div {...shared} className={cx('fk-separator', 'fk-separator--captioned', props.className)}>
        <Stroke />
        <span className="fk-separator__caption">{props.caption}</span>
        <Stroke />
      </div>
    )
  }
  return props.semantic ? (
    <AriaSeparator {...shared} elementType="div" orientation={orientation} className={cx('fk-separator', props.className)} />
  ) : (
    <div {...shared} className={cx('fk-separator', props.className)} aria-hidden="true" />
  )
}
