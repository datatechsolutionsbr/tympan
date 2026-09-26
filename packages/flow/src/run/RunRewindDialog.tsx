// RunRewindDialog: starts a corrected run from a finished step of an earlier
// one. Recorded outputs up to and including the chosen step are reused;
// every later step runs again. Only finished steps can be chosen.

import { useEffect, useReducer, type ComponentType, type SVGProps } from 'react'
import { History, RotateCw } from 'lucide-react'
import { Button, InlineNotice, NativeSelect, TextField } from '@fakhir/design-system'
import { SectionedModal } from '../internal/SectionedModal'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { normaliseStatus } from './lineage'
import { ShortId } from './ShortId'

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

export interface RewindNode {
  nodeId: string
  nodeKind: string
  status: string
}

export interface RunRewindDialogProps {
  open: boolean
  onClose: () => void
  runId: string
  nodes: readonly RewindNode[]
  initialNodeId?: string
  onRewind: (input: { resetToNode: string; reason?: string }) => Promise<void>
  labels?: Partial<RunRewindDialogLabels>
}

const finished = (step: RewindNode) => normaliseStatus(step.status) === 'completed'

/** Reused = finished steps at or before the chosen step; again = every step after it, whatever its state. */
export function splitAtCut(steps: readonly RewindNode[], cut: string | null): { kept: RewindNode[]; rerun: RewindNode[] } {
  const position = steps.findIndex((s) => s.nodeId === cut)
  return position < 0 ? { kept: [], rerun: [...steps] } : { kept: steps.slice(0, position + 1).filter(finished), rerun: steps.slice(position + 1) }
}

interface Plan {
  cut: string | null
  note: string
  sending: boolean
  failure: string | null
  /** Counts sentence for the polite region, set when the person changes the cut. */
  spoken: string
}

type PlanChange = Partial<Plan>
const revise = (plan: Plan, change: PlanChange): Plan => ({ ...plan, ...change })
const FRESH: Plan = { cut: null, note: '', sending: false, failure: null, spoken: '' }

function StepGroup({ id, heading, Icon, steps, emptyWord }: { id: string; heading: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; steps: RewindNode[]; emptyWord: string }) {
  return (
    <section className="fk-run-rewind__list" aria-labelledby={id}>
      <h3 id={id} className="fk-run-section__title">
        <Icon aria-hidden="true" focusable="false" className="fk-run-rewind__icon" />
        {heading}
      </h3>
      {steps.length === 0 ? (
        <p className="fk-run-hint">{emptyWord}</p>
      ) : (
        <ul aria-labelledby={id} className="fk-run-rewind__items">
          {steps.map((s) => (
            <li key={s.nodeId}>
              <code className="fk-run-mono">{s.nodeId}</code> <span className="fk-run-row__kind">{s.nodeKind}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function RunRewindDialog({ open, onClose, runId, nodes, initialNodeId, onRewind, labels }: RunRewindDialogProps) {
  const l = useLabels(runRewindDialogLabels, labels)
  const { locale } = useFlowLocale()
  const choosable = nodes.filter(finished)
  const [plan, change] = useReducer(revise, FRESH)

  // Every opening starts over, at the requested step when it can be chosen.
  useEffect(() => {
    if (!open) return
    const wanted = choosable.find((s) => s.nodeId === initialNodeId) ?? choosable[0]
    change({ ...FRESH, cut: wanted?.nodeId ?? null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { kept, rerun } = splitAtCut(nodes, plan.cut)

  const pick = (cut: string) => {
    const preview = splitAtCut(nodes, cut)
    change({ cut, spoken: fill(l.counts, { kept: preview.kept.length, rerun: preview.rerun.length }, locale) })
  }

  const go = async () => {
    if (!plan.cut) return
    change({ sending: true, failure: null })
    const note = plan.note.trim()
    try {
      await onRewind(note ? { resetToNode: plan.cut, reason: note } : { resetToNode: plan.cut })
      change({ sending: false })
      onClose()
    } catch (why) {
      change({ sending: false, failure: why instanceof Error ? why.message : String(why) })
    }
  }

  const body =
    choosable.length === 0 ? (
      <InlineNotice tone="warning">{l.noEligible}</InlineNotice>
    ) : (
      <div className="fk-run-form">
        {plan.failure && (
          <InlineNotice tone="danger" urgency="assertive">
            {plan.failure}
          </InlineNotice>
        )}
        <NativeSelect label={l.picker} options={choosable.map((s) => ({ value: s.nodeId, label: `${s.nodeId}, ${s.nodeKind}` }))} value={plan.cut ?? ''} onChange={pick} />
        <TextField label={l.reason} placeholder={l.reasonPlaceholder} value={plan.note} onChange={(note) => change({ note })} />
        <div className="fk-run-rewind__preview">
          <StepGroup id="fk-rewind-kept" heading={fill(l.keptHeading, { count: kept.length }, locale)} Icon={History} steps={kept} emptyWord={l.none} />
          <StepGroup id="fk-rewind-rerun" heading={fill(l.rerunHeading, { count: rerun.length }, locale)} Icon={RotateCw} steps={rerun} emptyWord={l.none} />
        </div>
        <p className="fk-visually-hidden" role="status" aria-live="polite">
          {plan.spoken}
        </p>
      </div>
    )

  return (
    <SectionedModal
      isOpen={open}
      onOpenChange={(stillOpen) => {
        if (!stillOpen && !plan.sending) onClose()
      }}
      title={l.title}
      subtitle={l.subtitle}
      tone="warning"
      width="wide"
      busy={plan.sending}
      className="fk-run-rewind"
      footer={
        <div className="fk-run-dialog-footer">
          <span className="fk-run-dialog-footer__ids">
            <ShortId id={runId} label={l.run} />
          </span>
          <Button variant="quiet" onPress={onClose} disabled={plan.sending}>
            {l.cancel}
          </Button>
          {choosable.length > 0 && (
            <Button variant="primary" onPress={() => void go()} disabled={!plan.cut} busy={plan.sending} busyLabel={l.confirming}>
              {l.confirm}
            </Button>
          )}
        </div>
      }
    >
      {body}
    </SectionedModal>
  )
}
