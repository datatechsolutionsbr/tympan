import { useId, type ReactNode } from 'react'
import { Heading } from 'react-aria-components'
import { cx } from '../../internal/cx'

export interface BrandFigure {
  value: string
  label: string
}

export interface BrandPanelProps {
  mark: ReactNode
  title: string
  subtitle: string
  figures?: readonly BrandFigure[]
  footnote?: string
  /** Heading level of the title: one below the page h1. */
  titleLevel?: 2 | 3
  className?: string
}

/**
 * Informative half-screen panel beside an auth form (spec:
 * wave-2/brand-panel.md). Parts render in a fixed order; empty ones drop out.
 */
export function BrandPanel(props: BrandPanelProps) {
  const headId = `ty-brand-panel-${useId().replace(/:/g, '')}`
  const figures = props.figures ?? []

  const parts: Array<ReactNode> = [
    <div key="decor" className="ty-brand-panel__decor" aria-hidden="true" />,
    <div key="mark" className="ty-brand-panel__mark">
      {props.mark}
    </div>,
    <div key="headline" className="ty-brand-panel__headline">
      <Heading level={props.titleLevel ?? 2} id={headId} className="ty-brand-panel__title">
        {props.title}
      </Heading>
      <p className="ty-brand-panel__subtitle">{props.subtitle}</p>
    </div>,
    figures.length > 0 && (
      <ul key="figures" className="ty-brand-panel__figures">
        {figures.map((figure, n) => (
          <li key={n + figure.label} className="ty-brand-panel__figure">
            <span className="ty-brand-panel__value">{figure.value}</span> <span className="ty-brand-panel__caption">{figure.label}</span>
          </li>
        ))}
      </ul>
    ),
    props.footnote && (
      <p key="footnote" className="ty-brand-panel__footnote">
        {props.footnote}
      </p>
    ),
  ]

  return (
    <aside aria-labelledby={headId} className={cx('ty-brand-panel', props.className)}>
      {parts}
    </aside>
  )
}
