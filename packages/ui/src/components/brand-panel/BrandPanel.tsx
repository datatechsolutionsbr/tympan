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
  const headId = `fk-brand-panel-${useId().replace(/:/g, '')}`
  const figures = props.figures ?? []

  const parts: Array<ReactNode> = [
    <div key="decor" className="fk-brand-panel__decor" aria-hidden="true" />,
    <div key="mark" className="fk-brand-panel__mark">
      {props.mark}
    </div>,
    <div key="headline" className="fk-brand-panel__headline">
      <Heading level={props.titleLevel ?? 2} id={headId} className="fk-brand-panel__title">
        {props.title}
      </Heading>
      <p className="fk-brand-panel__subtitle">{props.subtitle}</p>
    </div>,
    figures.length > 0 && (
      <ul key="figures" className="fk-brand-panel__figures">
        {figures.map((figure, n) => (
          <li key={n + figure.label} className="fk-brand-panel__figure">
            <span className="fk-brand-panel__value">{figure.value}</span> <span className="fk-brand-panel__caption">{figure.label}</span>
          </li>
        ))}
      </ul>
    ),
    props.footnote && (
      <p key="footnote" className="fk-brand-panel__footnote">
        {props.footnote}
      </p>
    ),
  ]

  return (
    <aside aria-labelledby={headId} className={cx('fk-brand-panel', props.className)}>
      {parts}
    </aside>
  )
}
