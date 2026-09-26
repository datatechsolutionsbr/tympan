import { Children, type ReactNode } from 'react'
import { Heading as AriaHeading, Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'
import type { IconComponent } from '../../internal/types'

export interface FeatureTileProps {
  /** Lucide icon, drawn on the shared accent badge. */
  icon: IconComponent
  title: string
  description: ReactNode
  headingLevel?: 2 | 3 | 4
  surface?: 'none' | 'raised'
  /** Optional link; the title becomes the link and its hit area covers the tile. */
  href?: string
  className?: string
}

/** Compact capability block for public pages (spec: wave-4/feature-tile.md). */
export function FeatureTile(props: FeatureTileProps) {
  const Glyph = props.icon
  const heading = props.href ? (
    <AriaLink href={props.href} className="fk-feature-tile__link">
      {props.title}
    </AriaLink>
  ) : (
    props.title
  )
  return (
    <div className={cx('fk-feature-tile', props.className)} data-surface={props.surface ?? 'none'} data-linked={props.href ? true : undefined}>
      <span className="fk-feature-tile__badge" aria-hidden="true">
        <Glyph className="fk-icon" aria-hidden="true" focusable="false" />
      </span>
      <AriaHeading level={props.headingLevel ?? 3} className="fk-feature-tile__title">
        {heading}
      </AriaHeading>
      <div className="fk-feature-tile__description">{props.description}</div>
    </div>
  )
}

/** List of FeatureTiles: one column, two from 640 px, three from 1024 px. */
export function FeatureTileGrid(props: { children: ReactNode; className?: string }) {
  return (
    <ul className={cx('fk-feature-tile-grid', props.className)}>
      {Children.toArray(props.children).map((tile, i) => (
        <li key={i} className="fk-feature-tile-grid__item">
          {tile}
        </li>
      ))}
    </ul>
  )
}
