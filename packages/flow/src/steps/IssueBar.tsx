// IssueBar: a strip at the top of the canvas while any link carries a shape
// its receiving step does not take. It names the first problem and offers its
// repair in one press (insert a bridging step, or remove the link).

import { TriangleAlert, Wrench } from 'lucide-react'
import { Button } from '@fakhir/design-system'
import { fill, useFlowLocale } from '../internal/labels'
import { shapeList } from './shapes'
import { useSteps } from './StepsContext'
import type { WiringIssue } from './wiring'

export interface IssueBarProps {
  issues: readonly WiringIssue[]
  nameOf: (nodeId: string) => string
  locked?: boolean
  onRepair: (issue: WiringIssue) => void
  /** Moves to the step with the problem. */
  onShow?: (nodeId: string) => void
}

export function IssueBar({ issues, nameOf, locked, onRepair, onShow }: IssueBarProps) {
  const rt = useSteps()
  const w = rt.words
  const { locale } = useFlowLocale()
  const first = issues[0]
  if (!first) return <p className="fk-visually-hidden" role="status" />
  const names = { from: nameOf(first.sourceId), to: nameOf(first.nodeId) }
  const detail = fill(w.mismatch, { expects: shapeList(first.expects, rt.shapes), gets: first.gets ? rt.shapes[first.gets] : w.nothing }, locale)
  const fix =
    first.repair.kind === 'insert'
      ? fill(w.fixInsert, { step: rt.byId.get(first.repair.stepId)?.name ?? first.repair.stepId, ...names }, locale)
      : fill(w.fixUnlink, names, locale)
  return (
    <div className="fk-issue-bar" data-fk-surface-chrome="">
      <p className="fk-issue-bar__text" role="status">
        <TriangleAlert aria-hidden="true" focusable="false" />
        <span>
          <strong>{fill(w.issueCount, { count: issues.length }, locale)}</strong>{' '}
          {onShow ? (
            <button type="button" className="fk-issue-bar__link" onClick={() => onShow(first.nodeId)}>
              {names.to}
            </button>
          ) : (
            names.to
          )}
          {': '}
          {detail}
        </span>
      </p>
      {!locked ? (
        <Button variant="secondary" size="compact" leadingIcon={<Wrench />} onPress={() => onRepair(first)}>
          {fix}
        </Button>
      ) : null}
    </div>
  )
}
