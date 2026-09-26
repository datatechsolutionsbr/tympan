import { forwardRef, useId, type ReactNode } from 'react'
import { Heading as AriaHeading } from 'react-aria-components'
import { cx } from '../../internal/cx'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
export type HeadingAppearance = 'display' | 'h1' | 'h2' | 'h3' | 'label'

export interface HeadingProps {
  /** Document outline level. */
  level?: HeadingLevel
  /** Visual step of §2.2, decoupled from `level`. */
  appearance?: HeadingAppearance
  /** Small uppercase label rendered before, and outside, the heading element. */
  eyebrow?: string
  /** Stable id for `aria-labelledby`. Generated when omitted. */
  id?: string
  className?: string
  children: ReactNode
}

function appearanceFor(level: HeadingLevel): HeadingAppearance {
  return level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'
}

/** Section title with independent level and visual size (spec: wave-1/heading.md). */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 1, appearance, eyebrow, id, className, children },
  ref,
) {
  const generated = useId()
  const headingId = id ?? `ty-heading-${generated.replace(/:/g, '')}`
  const heading = (
    <AriaHeading
      ref={ref}
      level={level}
      id={headingId}
      className={cx('ty-heading', !eyebrow && className)}
      data-appearance={appearance ?? appearanceFor(level)}
    >
      {children}
    </AriaHeading>
  )
  if (!eyebrow) return heading
  return (
    <div className={cx('ty-heading-group', className)}>
      <p className="ty-heading__eyebrow">{eyebrow}</p>
      {heading}
    </div>
  )
})

export type SubheadingProps = HeadingProps

/** Heading with `level` 2 and `appearance` h3 by default. */
export const Subheading = forwardRef<HTMLHeadingElement, SubheadingProps>(function Subheading(
  { level = 2, appearance = 'h3', ...rest },
  ref,
) {
  return <Heading ref={ref} level={level} appearance={appearance} {...rest} />
})
