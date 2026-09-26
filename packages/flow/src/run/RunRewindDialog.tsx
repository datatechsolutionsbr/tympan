// RunRewindDialog: the dialog around rewindPlan.ts. It asks for the last
// step to keep and an optional reason, previews what is reused and what runs
// again, and sends the fork request. The rules live in rewindPlan.ts.

import type { ReactNode } from 'react'
import { History, RotateCw, type LucideIcon } from 'lucide-react'
import { Button, InlineNotice, NativeSelect, TextField } from '@datatechsolutions/tympan'
import { SectionedModal } from '../internal/SectionedModal'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useRewindPlan, type RewindNode } from './rewindPlan'
import { ShortId } from './ShortId'

export { splitAtCut, canCutAt, type RewindNode } from './rewindPlan'

export interface RunRewindDialogLabels {
  title: string
  subtitle: string
  picker: string
  reason: string
  reasonPlaceholder: string
  keptHeading: string
  rerunHeading: string
  none: string
  noEligible: string
  counts: string
  run: string
  cancel: string
  confirm: string
  confirming: string
}

export const runRewindDialogLabels = defineLabels<RunRewindDialogLabels>('run-rewind-dialog', {
  en: {
    title: 'Rewind and run again',
    subtitle: 'Choose the last step to keep. Every step after it runs again with the current flow.',
    picker: 'Keep results up to',
    reason: 'Reason (optional)',
    reasonPlaceholder: 'What is being corrected',
    keptHeading: '{count, plural, one {Kept from this run: # step} other {Kept from this run: # steps}}',
    rerunHeading: '{count, plural, one {Will run again: # step} other {Will run again: # steps}}',
    none: 'none',
    noEligible: 'No step of this run completed, so there is nothing to keep. Start a new run instead.',
    counts: '{kept} kept, {rerun} will run again',
    run: 'Run',
    cancel: 'Cancel',
    confirm: 'Rewind',
    confirming: 'Rewinding',
  },
  'pt-BR': {
    title: 'Voltar e executar de novo',
    subtitle: 'Escolha o último passo a manter. Todos os passos seguintes rodam de novo com o fluxo atual.',
    picker: 'Manter resultados até',
    reason: 'Motivo (opcional)',
    reasonPlaceholder: 'O que está sendo corrigido',
    keptHeading: '{count, plural, one {Mantido desta execução: # passo} other {Mantidos desta execução: # passos}}',
    rerunHeading: '{count, plural, one {Roda de novo: # passo} other {Rodam de novo: # passos}}',
    none: 'nenhum',
    noEligible: 'Nenhum passo desta execução foi concluído, então não há o que manter. Inicie uma nova execução.',
    counts: '{kept} mantidos, {rerun} rodam de novo',
    run: 'Execução',
    cancel: 'Cancelar',
    confirm: 'Voltar',
    confirming: 'Voltando',
  },
  es: {
    title: 'Retroceder y ejecutar de nuevo',
    subtitle: 'Elija el último paso que se conserva. Todos los pasos siguientes se ejecutan de nuevo con el flujo actual.',
    picker: 'Conservar resultados hasta',
    reason: 'Motivo (opcional)',
    reasonPlaceholder: 'Qué se está corrigiendo',
    keptHeading: '{count, plural, one {Conservado de esta ejecución: # paso} other {Conservados de esta ejecución: # pasos}}',
    rerunHeading: '{count, plural, one {Se ejecuta de nuevo: # paso} other {Se ejecutan de nuevo: # pasos}}',
    none: 'ninguno',
    noEligible: 'Ningún paso de esta ejecución terminó, así que no hay nada que conservar. Inicie una nueva ejecución.',
    counts: '{kept} conservados, {rerun} se ejecutan de nuevo',
    run: 'Ejecución',
    cancel: 'Cancelar',
    confirm: 'Retroceder',
    confirming: 'Retrocediendo',
  },
})
export const defaultRunRewindDialogLabels: RunRewindDialogLabels = runRewindDialogLabels.bundles.en

export interface RunRewindDialogProps {
  open: boolean
  onClose: () => void
  runId: string
  nodes: readonly RewindNode[]
  initialNodeId?: string
  onRewind: (input: { resetToNode: string; reason?: string }) => Promise<void>
  labels?: Partial<RunRewindDialogLabels>
}

/** The two preview columns, described once and drawn the same way. */
const PREVIEW_COLUMNS: ReadonlyArray<{ id: string; icon: LucideIcon; heading: 'keptHeading' | 'rerunHeading'; pick: 'kept' | 'rerun' }> = [
  { id: 'ty-rewind-kept', icon: History, heading: 'keptHeading', pick: 'kept' },
  { id: 'ty-rewind-rerun', icon: RotateCw, heading: 'rerunHeading', pick: 'rerun' },
]

function stepLines(steps: readonly RewindNode[], labelledBy: string, emptyWord: string): ReactNode {
  if (!steps.length) return <p className="ty-run-hint">{emptyWord}</p>
  return (
    <ul aria-labelledby={labelledBy} className="ty-run-rewind__items">
      {steps.map(({ nodeId, nodeKind }) => (
        <li key={nodeId}>
          <code className="ty-run-mono">{nodeId}</code> <span className="ty-run-row__kind">{nodeKind}</span>
        </li>
      ))}
    </ul>
  )
}

export function RunRewindDialog(props: RunRewindDialogProps) {
  const text = useLabels(runRewindDialogLabels, props.labels)
  const { locale } = useFlowLocale()
  const { eligible, draft, act, split, moveCut } = useRewindPlan(props.open, props.nodes, props.initialNodeId)
  const sending = draft.phase.name === 'sending'
  const nothingToKeep = eligible.length === 0

  const submit = async () => {
    const cut = draft.cut
    if (!cut) return
    const reason = draft.reason.trim()
    act({ kind: 'send' })
    try {
      await props.onRewind(reason ? { resetToNode: cut, reason } : { resetToNode: cut })
      act({ kind: 'sent' })
      props.onClose()
    } catch (problem) {
      act({ kind: 'fail', message: problem instanceof Error ? problem.message : String(problem) })
    }
  }

  const preview = PREVIEW_COLUMNS.map((col) => {
    const steps = split[col.pick]
    const Icon = col.icon
    return (
      <section key={col.id} className="ty-run-rewind__list" aria-labelledby={col.id}>
        <h3 id={col.id} className="ty-run-section__title">
          <Icon aria-hidden="true" focusable="false" className="ty-run-rewind__icon" />
          {fill(text[col.heading], { count: steps.length }, locale)}
        </h3>
        {stepLines(steps, col.id, text.none)}
      </section>
    )
  })

  const form = (
    <div className="ty-run-form">
      {draft.phase.name === 'failed' ? (
        <InlineNotice tone="danger" urgency="assertive">
          {draft.phase.message}
        </InlineNotice>
      ) : null}
      <NativeSelect label={text.picker} options={eligible.map((s) => ({ value: s.nodeId, label: `${s.nodeId}, ${s.nodeKind}` }))} value={draft.cut ?? ''} onChange={moveCut} />
      <TextField label={text.reason} placeholder={text.reasonPlaceholder} value={draft.reason} onChange={(t) => act({ kind: 'reason', text: t })} />
      <div className="ty-run-rewind__preview">{preview}</div>
      <p className="ty-visually-hidden" role="status" aria-live="polite">
        {draft.echo ? fill(text.counts, draft.echo, locale) : ''}
      </p>
    </div>
  )

  const footer = (
    <div className="ty-run-dialog-footer">
      <span className="ty-run-dialog-footer__ids">
        <ShortId id={props.runId} label={text.run} />
      </span>
      <Button variant="quiet" onPress={props.onClose} disabled={sending}>
        {text.cancel}
      </Button>
      {nothingToKeep ? null : (
        <Button variant="primary" onPress={() => void submit()} disabled={!draft.cut} busy={sending} busyLabel={text.confirming}>
          {text.confirm}
        </Button>
      )}
    </div>
  )

  return (
    <SectionedModal
      isOpen={props.open}
      onOpenChange={(stays) => {
        if (!stays && !sending) props.onClose()
      }}
      title={text.title}
      subtitle={text.subtitle}
      tone="warning"
      width="wide"
      busy={sending}
      className="ty-run-rewind"
      footer={footer}
    >
      {nothingToKeep ? <InlineNotice tone="warning">{text.noEligible}</InlineNotice> : form}
    </SectionedModal>
  )
}
