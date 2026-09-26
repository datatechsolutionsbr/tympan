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

/** Thin rule between groups of content (spec: wave-1/separator.md). */
export function Separator({ orientation = 'horizontal', emphasis = 'regular', caption, semantic = false, spacing = 'regular', className }: SeparatorProps) {
  const data = {
    'data-orientation': orientation,
    'data-emphasis': emphasis,
    'data-spacing': spacing,
  }
  if (caption != null) {
    // A captioned rule keeps the caption readable; the line parts are decorative.
    return (
      <div className={cx('fk-separator', 'fk-separator--captioned', className)} {...data}>
        <span className="fk-separator__line" aria-hidden="true" />
        <span className="fk-separator__caption">{caption}</span>
        <span className="fk-separator__line" aria-hidden="true" />
      </div>
    )
  }
  if (semantic) {
    return <AriaSeparator elementType="div" orientation={orientation} className={cx('fk-separator', className)} {...data} />
  }
  return <div aria-hidden="true" className={cx('fk-separator', className)} {...data} />
}
