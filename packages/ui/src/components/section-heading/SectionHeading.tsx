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

/** Wraps an optional slot in its element, or renders nothing when the slot is empty. */
function slot(content: ReactNode, part: string) {
  return content == null ? null : <div className={`ty-section-heading__${part}`}>{content}</div>
}

function TitleBlock(p: { id: string; level: 2 | 3 | 4; title: string; subtitle?: string; clip: boolean }) {
  return (
    <div className="ty-section-heading__text">
      <AriaHeading level={p.level} id={p.id} className="ty-section-heading__title" data-truncate={p.clip || undefined} title={p.clip ? p.title : undefined}>
        {p.title}
      </AriaHeading>
      {p.subtitle ? <p className="ty-section-heading__subtitle">{p.subtitle}</p> : null}
    </div>
  )
}

/** Heads a section inside a page or a sheet (spec: wave-1/section-heading.md). */
export function SectionHeading(props: SectionHeadingProps) {
  const auto = useId()
  const level = props.level ?? 2
  const Glyph = props.icon
  return (
    <div className={cx('ty-section-heading', props.className)} data-level={level}>
      <div className="ty-section-heading__row">
        {Glyph ? <Glyph className="ty-icon ty-section-heading__icon" aria-hidden="true" focusable="false" /> : null}
        <TitleBlock
          id={props.id ?? `ty-section-heading-${auto.replace(/:/g, '')}`}
          level={level}
          title={props.title}
          subtitle={props.subtitle}
          clip={props.truncate === true}
        />
        {slot(props.trailing, 'trailing')}
      </div>
      {slot(props.children, 'extra')}
    </div>
  )
}
