// IssueBar: a strip at the top of the canvas while any link carries a shape
// its receiving step does not take. It says which step expects what and
// receives what, and offers the repair in one press: swap the step for one of
// the same kind that takes what arrives, insert a bridging step, or unlink.

import { TriangleAlert } from 'lucide-react'
import { Button } from '@datatechsolutions/tympan'
import { fill, useFlowLocale } from '../internal/labels'
import { ShapeChip } from './ShapeChip'
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
  if (!first) return <p className="ty-visually-hidden" role="status" />
  const names = { from: nameOf(first.sourceId), to: nameOf(first.nodeId) }
  const stepName = (id: string) => rt.byId.get(id)?.name ?? id
  const fix =
    first.repair.kind === 'replace'
      ? fill(w.fixReplace, { step: stepName(first.repair.stepId) }, locale)
      : first.repair.kind === 'insert'
        ? fill(w.fixInsert, { step: stepName(first.repair.stepId), ...names }, locale)
        : fill(w.fixUnlink, names, locale)
  return (
    <div className="ty-issue-bar" data-ty-surface-chrome="">
      <TriangleAlert className="ty-issue-bar__icon" aria-hidden="true" focusable="false" />
      <p className="ty-issue-bar__text" role="status">
        <strong>{fill(w.issueCount, { count: issues.length }, locale)}:</strong>{' '}
        {onShow ? (
          <button type="button" className="ty-issue-bar__link" onClick={() => onShow(first.nodeId)}>
            {fill(w.issueSentence, { to: names.to }, locale)}
          </button>
        ) : (
          fill(w.issueSentence, { to: names.to }, locale)
        )}{' '}
        <ShapeChip shapes={first.expects} words={rt.shapes} /> {w.andGets}{' '}
        {first.gets ? <ShapeChip shapes={[first.gets]} words={rt.shapes} /> : w.nothing}.
      </p>
      {!locked ? (
        <Button className="ty-issue-bar__fix" variant="secondary" size="compact" onPress={() => onRepair(first)}>
          {fix}
        </Button>
      ) : null}
    </div>
  )
}
