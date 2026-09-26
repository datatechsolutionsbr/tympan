import { useId, type ReactNode } from 'react'
import { Heading as AriaHeading } from 'react-aria-components'
import { cx } from '../../internal/cx'

export type ShowcaseAlign = 'start' | 'center'

export interface ShowcaseHeadingProps {
  /** Document outline level of the title. */
  level?: 1 | 2 | 3
  /** Short topic line above the title (outside the heading element). */
  kicker?: string
  /** Reading paragraph under the title. */
  lead?: ReactNode
  align?: ShowcaseAlign
  /** Id of the title, for `aria-labelledby` on the enclosing section. */
  id?: string
  className?: string
  /** Title text. */
  children: ReactNode
}

/** Topic line of a public page block; eyebrow step in the accent colour (§2.2, §2.3). */
export function Kicker(props: { children: ReactNode; className?: string }) {
  return <p className={cx('fk-kicker', props.className)}>{props.children}</p>
}

export interface LeadProps {
  children: ReactNode
  /** Element; a paragraph by default. */
  as?: 'p' | 'div'
  className?: string
}

/** Reading paragraph of a public page block, body-lg on the reading measure. */
export function Lead(props: LeadProps) {
  const Tag = props.as ?? 'p'
  return <Tag className={cx('fk-lead', props.className)}>{props.children}</Tag>
}

/**
 * Opening text block of a public page: kicker, display title, lead
 * (spec: wave-4/showcase-heading.md). Without kicker and lead only the
 * heading element is produced.
 */
export function ShowcaseHeading(props: ShowcaseHeadingProps) {
  const auto = useId()
  const align = props.align ?? 'start'
  const bare = props.kicker === undefined && props.lead == null
  const title = (
    <AriaHeading
      level={props.level ?? 1}
      id={props.id ?? `fk-showcase-${auto.replace(/:/g, '')}`}
      className={cx('fk-showcase-heading__title', bare && props.className)}
      data-align={bare ? align : undefined}
    >
      {props.children}
    </AriaHeading>
  )
  if (bare) return title
  return (
    <div className={cx('fk-showcase-heading', props.className)} data-align={align}>
      {props.kicker !== undefined && <Kicker>{props.kicker}</Kicker>}
      {title}
      {props.lead != null && <Lead>{props.lead}</Lead>}
    </div>
  )
}
