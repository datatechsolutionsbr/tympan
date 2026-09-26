import { useId, type ReactNode } from 'react'
import { Heading as AriaHeading } from 'react-aria-components'
import { cx } from '../../internal/cx'
import type { IconComponent } from '../../internal/types'

export interface SectionHeadingProps {
  title: string
  /** Heading level; level 2 uses the h2 style, 3 and 4 the h3 style. */
  level?: 2 | 3 | 4
  /** One line of meta text; not a heading. */
  subtitle?: string
  icon?: IconComponent
  /** Section actions, a count, a toggle or a link; follows the title in DOM order. */
  trailing?: ReactNode
  /** Extra content under the heading row. */
  children?: ReactNode
  /** Heading id, for `aria-labelledby` on the enclosing section. */
  id?: string
  /** Truncate the title to one line (full text as tooltip); wraps by default. */
  truncate?: boolean
  className?: string
}

/** Heads a section inside a page or a sheet (spec: wave-1/section-heading.md). */
export function SectionHeading({ title, level = 2, subtitle, icon: Icon, trailing, children, id, truncate = false, className }: SectionHeadingProps) {
  const generated = `fk-section-heading-${useId().replace(/:/g, '')}`
  const headingId = id ?? generated
  return (
    <div className={cx('fk-section-heading', className)} data-level={level}>
      <div className="fk-section-heading__row">
        {Icon ? <Icon className="fk-icon fk-section-heading__icon" aria-hidden="true" focusable="false" /> : null}
        <div className="fk-section-heading__text">
          <AriaHeading
            level={level}
            id={headingId}
            className="fk-section-heading__title"
            data-truncate={truncate || undefined}
            title={truncate ? title : undefined}
          >
            {title}
          </AriaHeading>
          {subtitle ? <p className="fk-section-heading__subtitle">{subtitle}</p> : null}
        </div>
        {trailing != null ? <div className="fk-section-heading__trailing">{trailing}</div> : null}
      </div>
      {children != null ? <div className="fk-section-heading__extra">{children}</div> : null}
    </div>
  )
}
