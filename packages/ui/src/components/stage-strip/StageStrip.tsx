import { ArrowRight, CircleCheck, CircleDot, Circle, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'
import type { StageStatus } from '../../internal/messages/shell'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'

export type { StageStatus } from '../../internal/messages/shell'

/** One step of the research pipeline (spec: wave-4/stage-strip.md). */
export interface Stage {
  id: string
  label: string
  href?: string
  status: StageStatus
  /** One or two short figures ("14 sources", "2 sessions"). */
  figures?: string[]
}

export interface StageStripProps {
  stages: Stage[]
  /** Name of the list. */
  label: string
  /** Optional visible title above the strip. */
  title?: string
  className?: string
}

/** How each status looks and what it means for assistive technology. */
const LOOK: { [K in StageStatus]: { glyph: IconComponent; step?: 'step' } } = {
  done: { glyph: CircleCheck },
  current: { glyph: CircleDot, step: 'step' },
  upcoming: { glyph: Circle },
  attention: { glyph: TriangleAlert },
}

function Title({ to, children }: { to?: string; children: string }) {
  // Content text keeps its own direction inside a frame of the other direction.
  return to ? (
    <AriaLink className="fk-stage-strip__name" href={to} dir="auto">
      {children}
    </AriaLink>
  ) : (
    <span className="fk-stage-strip__name" dir="auto">
      {children}
    </span>
  )
}

function Connector() {
  return <ArrowRight className="fk-icon fk-stage-strip__arrow fk-mirror-rtl" aria-hidden="true" focusable="false" />
}

function Cell({ stage, word }: { stage: Stage; word: string }) {
  const Glyph = LOOK[stage.status].glyph
  const numbers: ReactNode = stage.figures?.length ? (
    <span className="fk-stage-strip__figures">
      {stage.figures.map((line, n) => (
        <span key={n} dir="auto">
          {line}
        </span>
      ))}
    </span>
  ) : null
  return (
    <div className="fk-stage-strip__card">
      <Title to={stage.href}>{stage.label}</Title>
      <span className="fk-stage-strip__status">
        <Glyph className="fk-icon" aria-hidden="true" focusable="false" />
        {word}
      </span>
      {numbers}
    </div>
  )
}

/** Research pipeline from search to manuscript, joined by arrows. */
export function StageStrip(props: StageStripProps) {
  const statusWords = useMessages().stageStrip.status
  const count = props.stages.length
  const items = props.stages.map((stage, position) => (
    <li key={stage.id} className="fk-stage-strip__stage" data-status={stage.status} aria-current={LOOK[stage.status].step}>
      <Cell stage={stage} word={statusWords[stage.status]} />
      {position + 1 < count ? <Connector /> : null}
    </li>
  ))
  return (
    <div className={cx('fk-stage-strip', props.className)}>
      {props.title ? (
        <p className="fk-stage-strip__title" dir="auto">
          {props.title}
        </p>
      ) : null}
      <ol className="fk-stage-strip__list" aria-label={props.label}>
        {items}
      </ol>
    </div>
  )
}
