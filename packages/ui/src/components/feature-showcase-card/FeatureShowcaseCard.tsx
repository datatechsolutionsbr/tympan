import { useId, type ReactNode } from 'react'
import { Heading as AriaHeading, Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'

export type FeatureCardSpan = 'narrow' | 'wide'
export type FeatureCardFade = 'top' | 'bottom'

export interface FeatureShowcaseCardProps {
  /** Content of the media area (image, capture, small diagram). */
  media: ReactNode
  /** Text alternative when the media carries information; omit for decorative media. */
  mediaAlt?: string
  kicker: string
  title: string
  description: ReactNode
  /** Edges of the media that fade into the card surface. */
  fade?: FeatureCardFade[]
  /** Whole-card link target (through the router adapter). */
  href?: string
  headingLevel?: 2 | 3 | 4
  /** Columns taken in FeatureShowcaseMosaic from 1024 px. */
  span?: FeatureCardSpan
  className?: string
}

function Media(p: { media: ReactNode; alt?: string; fade: FeatureCardFade[] }) {
  const described = p.alt !== undefined && p.alt !== ''
  return (
    <div className="fk-feature-showcase-card__media">
      <div className="fk-feature-showcase-card__frame" {...(described ? { role: 'img', 'aria-label': p.alt } : { 'aria-hidden': true })}>
        {p.media}
      </div>
      {p.fade.map((edge) => (
        <span key={edge} className="fk-feature-showcase-card__fade" data-edge={edge} aria-hidden="true" />
      ))}
    </div>
  )
}

/**
 * Large card for public pages pairing media with kicker, title and text
 * (spec: wave-4/feature-showcase-card.md). With `href` the title holds the
 * only link, stretched over the card: one tab stop named by the title.
 */
export function FeatureShowcaseCard(props: FeatureShowcaseCardProps) {
  const titleId = `fk-fsc-${useId().replace(/:/g, '')}`
  const linked = typeof props.href === 'string'
  return (
    <article
      className={cx('fk-feature-showcase-card', props.className)}
      aria-labelledby={titleId}
      data-span={props.span ?? 'narrow'}
      data-linked={linked || undefined}
    >
      <Media media={props.media} alt={props.mediaAlt} fade={props.fade ?? []} />
      <div className="fk-feature-showcase-card__body">
        <p className="fk-feature-showcase-card__kicker">{props.kicker}</p>
        <AriaHeading level={props.headingLevel ?? 3} id={titleId} className="fk-feature-showcase-card__title">
          {linked ? (
            <AriaLink href={props.href} className="fk-feature-showcase-card__link">
              {props.title}
            </AriaLink>
          ) : (
            props.title
          )}
        </AriaHeading>
        <div className="fk-feature-showcase-card__description">{props.description}</div>
      </div>
    </article>
  )
}

/** Uneven mosaic for FeatureShowcaseCards: wide = two thirds, narrow = one third from 1024 px. */
export function FeatureShowcaseMosaic(props: { children: ReactNode; className?: string }) {
  return <div className={cx('fk-feature-mosaic', props.className)}>{props.children}</div>
}
