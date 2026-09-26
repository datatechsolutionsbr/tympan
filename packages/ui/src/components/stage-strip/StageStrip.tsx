import { ArrowRight, CircleCheck, CircleDot, Circle, TriangleAlert } from 'lucide-react'
import { Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'
import type { StageStatus } from '../../internal/messages/shell'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'

export type { StageStatus } from '../../internal/messages/shell'

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

const GLYPH: Record<StageStatus, IconComponent> = {
  done: CircleCheck,
  current: CircleDot,
  upcoming: Circle,
  attention: TriangleAlert,
}

/** Research pipeline from search to manuscript (spec: wave-4/stage-strip.md). */
export function StageStrip({ stages, label, title, className }: StageStripProps) {
  const words = useMessages().stageStrip.status
  const last = stages.length - 1
  return (
    <div className={cx('fk-stage-strip', className)}>
      {title ? <p className="fk-stage-strip__title">{title}</p> : null}
      <ol className="fk-stage-strip__list" aria-label={label}>
        {stages.map((stage, index) => {
          const Glyph = GLYPH[stage.status]
          const name = stage.href ? (
            <AriaLink className="fk-stage-strip__name" href={stage.href}>
              {stage.label}
            </AriaLink>
          ) : (
            <span className="fk-stage-strip__name">{stage.label}</span>
          )
          return (
            <li key={stage.id} className="fk-stage-strip__stage" data-status={stage.status} aria-current={stage.status === 'current' ? 'step' : undefined}>
              <div className="fk-stage-strip__card">
                {name}
                <span className="fk-stage-strip__status">
                  <Glyph className="fk-icon" aria-hidden="true" focusable="false" />
                  {words[stage.status]}
                </span>
                {stage.figures?.length ? (
                  <span className="fk-stage-strip__figures">
                    {stage.figures.map((figure) => (
                      <span key={figure}>{figure}</span>
                    ))}
                  </span>
                ) : null}
              </div>
              {index < last ? <ArrowRight className="fk-icon fk-stage-strip__arrow fk-mirror-rtl" aria-hidden="true" focusable="false" /> : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
