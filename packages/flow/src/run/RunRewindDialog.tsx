// RunRewindDialog: forks a corrected re-run from a completed node. Up to and
// including that node, recorded outputs are kept; everything after runs again.

import { useEffect, useMemo, useState } from 'react'
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

const isCompleted = (n: RewindNode) => normaliseStatus(n.status) === 'completed'

/** Kept = completed nodes at or before the cut; re-execute = every node after it. */
export function splitAtCut(nodes: readonly RewindNode[], cut: string | null): { kept: RewindNode[]; rerun: RewindNode[] } {
  const at = cut ? nodes.findIndex((n) => n.nodeId === cut) : -1
  if (at < 0) return { kept: [], rerun: [...nodes] }
  return { kept: nodes.slice(0, at + 1).filter(isCompleted), rerun: nodes.slice(at + 1) }
}

export function RunRewindDialog({ open, onClose, runId, nodes, initialNodeId, onRewind, labels }: RunRewindDialogProps) {
  const l = useLabels(runRewindDialogLabels, labels)
  const { locale } = useFlowLocale()
  const eligible = useMemo(() => nodes.filter(isCompleted), [nodes])
  const [cut, setCut] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [live, setLive] = useState('')

  useEffect(() => {
    if (!open) return
    setCut(initialNodeId && eligible.some((n) => n.nodeId === initialNodeId) ? initialNodeId : (eligible[0]?.nodeId ?? null))
    setReason('')
    setError(null)
    setBusy(false)
    setLive('')
    // Re-seed on every opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { kept, rerun } = splitAtCut(nodes, cut)

  const choose = (id: string) => {
    setCut(id)
    const s = splitAtCut(nodes, id)
    setLive(fill(l.counts, { kept: s.kept.length, rerun: s.rerun.length }, locale))
  }

  const confirm = async () => {
    if (!cut) return
    setBusy(true)
    setError(null)
    try {
      const trimmed = reason.trim()
      await onRewind(trimmed ? { resetToNode: cut, reason: trimmed } : { resetToNode: cut })
      setBusy(false)
      onClose()
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const list = (items: RewindNode[], heading: string, icon: typeof History, id: string) => {
    const Icon = icon
    return (
      <section className="fk-run-rewind__list" aria-labelledby={id}>
        <h3 id={id} className="fk-run-section__title">
          <Icon aria-hidden="true" focusable="false" className="fk-run-rewind__icon" />
          {heading}
        </h3>
        {items.length ? (
          <ul aria-labelledby={id} className="fk-run-rewind__items">
            {items.map((n) => (
              <li key={n.nodeId}>
                <code className="fk-run-mono">{n.nodeId}</code> <span className="fk-run-row__kind">{n.nodeKind}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="fk-run-hint">{l.none}</p>
        )}
      </section>
    )
  }

  return (
    <SectionedModal
      isOpen={open}
      onOpenChange={(o) => {
        if (!o && !busy) onClose()
      }}
      title={l.title}
      subtitle={l.subtitle}
      tone="warning"
      width="wide"
      busy={busy}
      className="fk-run-rewind"
      footer={
        <div className="fk-run-dialog-footer">
          <span className="fk-run-dialog-footer__ids">
            <ShortId id={runId} label={l.run} />
          </span>
          <Button variant="quiet" onPress={onClose} disabled={busy}>
            {l.cancel}
          </Button>
          {eligible.length ? (
            <Button variant="primary" onPress={() => void confirm()} disabled={!cut} busy={busy} busyLabel={l.confirming}>
              {l.confirm}
            </Button>
          ) : null}
        </div>
      }
    >
      {eligible.length === 0 ? (
        <InlineNotice tone="warning">{l.noEligible}</InlineNotice>
      ) : (
        <div className="fk-run-form">
          {error ? (
            <InlineNotice tone="danger" urgency="assertive">
              {error}
            </InlineNotice>
          ) : null}
          <NativeSelect label={l.picker} options={eligible.map((n) => ({ value: n.nodeId, label: `${n.nodeId}, ${n.nodeKind}` }))} value={cut ?? ''} onChange={choose} />
          <TextField label={l.reason} placeholder={l.reasonPlaceholder} value={reason} onChange={setReason} />
          <div className="fk-run-rewind__preview">
            {list(kept, fill(l.keptHeading, { count: kept.length }, locale), History, 'fk-rewind-kept')}
            {list(rerun, fill(l.rerunHeading, { count: rerun.length }, locale), RotateCw, 'fk-rewind-rerun')}
          </div>
          <p className="fk-visually-hidden" role="status" aria-live="polite">
            {live}
          </p>
        </div>
      )}
    </SectionedModal>
  )
}
