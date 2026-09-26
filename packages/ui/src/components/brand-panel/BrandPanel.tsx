import { useId, type ReactNode } from 'react'

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

function FigureTiles({ figures }: { figures: readonly BrandFigure[] }) {
  if (figures.length === 0) return null
  return (
    <ul className="fk-brand-panel__figures">
      {figures.map((f, n) => (
        <li key={`${n}-${f.label}`} className="fk-brand-panel__figure">
          <span className="fk-brand-panel__value">{f.value}</span> <span className="fk-brand-panel__caption">{f.label}</span>
        </li>
      ))}
    </ul>
  )
}

/** Informative half-screen panel beside an auth form (spec: wave-2/brand-panel.md). */
export function BrandPanel(props: BrandPanelProps) {
  const titleId = `fk-brand-panel-${useId().replace(/:/g, '')}`
  const Title = props.titleLevel === 3 ? 'h3' : 'h2'
  return (
    <aside className={['fk-brand-panel', props.className].filter(Boolean).join(' ')} aria-labelledby={titleId}>
      <div className="fk-brand-panel__decor" aria-hidden="true" />
      <div className="fk-brand-panel__mark">{props.mark}</div>
      <div className="fk-brand-panel__headline">
        <Title id={titleId} className="fk-brand-panel__title">
          {props.title}
        </Title>
        <p className="fk-brand-panel__subtitle">{props.subtitle}</p>
      </div>
      <FigureTiles figures={props.figures ?? []} />
      {props.footnote ? <p className="fk-brand-panel__footnote">{props.footnote}</p> : null}
    </aside>
  )
}
