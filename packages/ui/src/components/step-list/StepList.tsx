import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export type StepStatus = 'complete' | 'current' | 'upcoming'

export interface StepListStep {
  id: string
  name: string
  description?: string
  icon?: ReactNode
  href?: string
  status?: StepStatus
}

export interface StepListProps {
  steps: StepListStep[]
  /** Zero-based current step; overrides per-step statuses. */
  currentIndex?: number
  /** Accessible name of the navigation. */
  label: string
  appearance?: 'markers' | 'bar'
  onStepSelect?: (index: number) => void
  /** Also lets people select upcoming steps. */
  allowForward?: boolean
  className?: string
}

interface Resolved {
  step: StepListStep
  index: number
  status: StepStatus
  selectable: boolean
}

/** Works out every step's status once; `currentIndex` wins over declared statuses. */
function resolveSteps(props: StepListProps): Resolved[] {
  const { steps, currentIndex, onStepSelect, allowForward = false } = props
  const declaredCurrent = steps.findIndex((s) => s.status === 'current')
  const pivot = currentIndex ?? (declaredCurrent >= 0 ? declaredCurrent : undefined)
  return steps.map((step, index) => {
    let status: StepStatus
    if (currentIndex !== undefined || step.status === undefined) {
      status = pivot === undefined ? 'upcoming' : index < pivot ? 'complete' : index === pivot ? 'current' : 'upcoming'
    } else status = step.status
    const selectable = !!onStepSelect && (status === 'complete' || (allowForward && status === 'upcoming'))
    return { step, index, status, selectable }
  })
}

function Marker({ entry }: { entry: Resolved }) {
  const face = entry.status === 'complete' ? <Check aria-hidden="true" focusable="false" /> : (entry.step.icon ?? entry.index + 1)
  return (
    <span className="ty-step-list__marker" aria-hidden="true">
      {face}
    </span>
  )
}

/** Progress through ordered steps, optionally navigable (spec: wave-2/step-list.md). */
export function StepList(props: StepListProps) {
  const m = useMessages().stepList
  const entries = resolveSteps(props)
  const total = entries.length
  const current = entries.find((e) => e.status === 'current')

  const describe = (e: Resolved) => `${m.position(e.index + 1, total)}, ${e.step.name}, ${m.status[e.status]}`

  const body = (e: Resolved) => (
    <>
      <Marker entry={e} />
      <span className="ty-step-list__text" aria-hidden={e.selectable || undefined}>
        <span className="ty-step-list__eyebrow">{m.position(e.index + 1, total)}</span>
        <span className="ty-step-list__name">{e.step.name}</span>
        {e.step.description ? <span className="ty-step-list__description">{e.step.description}</span> : null}
      </span>
    </>
  )

  const cell = (e: Resolved) => {
    const shared = { className: 'ty-step-list__target', 'aria-label': describe(e), onPress: () => props.onStepSelect?.(e.index) }
    if (e.selectable && e.step.href) return <AriaLink {...shared} href={e.step.href}>{body(e)}</AriaLink>
    if (e.selectable) return <AriaButton {...shared}>{body(e)}</AriaButton>
    return (
      <span className="ty-step-list__target" data-static="true">
        <span className="ty-visually-hidden">{describe(e)}</span>
        <span aria-hidden="true" className="ty-step-list__static">
          {body(e)}
        </span>
      </span>
    )
  }

  return (
    <nav className={cx('ty-step-list', props.className)} aria-label={props.label} data-appearance={props.appearance ?? 'markers'}>
      <ol className="ty-step-list__list">
        {entries.map((e) => (
          <li
            key={e.step.id}
            className="ty-step-list__step"
            data-status={e.status}
            data-selectable={e.selectable || undefined}
            aria-current={e.status === 'current' ? 'step' : undefined}
          >
            {cell(e)}
          </li>
        ))}
      </ol>
      {current ? (
        <p className="ty-step-list__now" aria-hidden="true">
          {current.step.name}
        </p>
      ) : null}
    </nav>
  )
}
