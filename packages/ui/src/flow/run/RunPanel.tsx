// RunPanel: docked progress of the flow in the editor, one row per executable
// node, with Run and Stop.

import { useId } from 'react'
import { Play, Square } from 'lucide-react'
import { Button } from '../../index'
import { DockedPanel } from '../internal/DockedPanel'
import { formatDuration } from '../internal/format'
import { defineLabels, useFlowLocale, useLabels } from '../internal/labels'
import { useFlowEditorState } from '../state/editorState'
import { RunStatusMark, type RunWordLabels } from './RunStatusMark'

export interface RunPanelLabels {
  title: string
  running: string
  run: string
  stop: string
  close: string
  empty: string
  noStart: string
  noEnd: string
}

export const runPanelLabels = defineLabels<RunPanelLabels>('run-panel', {
  en: {
    title: 'Run',
    running: 'Running',
    run: 'Run',
    stop: 'Stop',
    close: 'Close run panel',
    empty: 'This flow has no steps to run yet.',
    noStart: 'Add and configure a start step to run this flow.',
    noEnd: 'Add an end step to run this flow.',
  },
  'pt-BR': {
    title: 'Execução',
    running: 'Em execução',
    run: 'Executar',
    stop: 'Parar',
    close: 'Fechar painel de execução',
    empty: 'Este fluxo ainda não tem passos para executar.',
    noStart: 'Adicione e configure um passo de início para executar este fluxo.',
    noEnd: 'Adicione um passo de fim para executar este fluxo.',
  },
  es: {
    title: 'Ejecución',
    running: 'En ejecución',
    run: 'Ejecutar',
    stop: 'Detener',
    close: 'Cerrar panel de ejecución',
    empty: 'Este flujo aún no tiene pasos para ejecutar.',
    noStart: 'Agregue y configure un paso de inicio para ejecutar este flujo.',
    noEnd: 'Agregue un paso de fin para ejecutar este flujo.',
  },
})
export const defaultRunPanelLabels: RunPanelLabels = runPanelLabels.bundles.en

/** Kinds that never run and never get a row. */
export const NON_EXECUTABLE_KINDS: readonly string[] = ['note', 'group']
const START_KINDS = ['start']
const END_KINDS = ['end', 'answer']

export interface RunPanelProps {
  open: boolean
  onClose: () => void
  onRun: () => void
  onStop: () => void
  labels?: Partial<RunPanelLabels>
  statusLabels?: Partial<RunWordLabels>
}

export function RunPanel({ open, onClose, onRun, onStop, labels, statusLabels }: RunPanelProps) {
  if (!open) return null
  return <RunPanelBody onClose={onClose} onRun={onRun} onStop={onStop} labels={labels} statusLabels={statusLabels} />
}

function RunPanelBody({ onClose, onRun, onStop, labels, statusLabels }: Omit<RunPanelProps, 'open'>) {
  const l = useLabels(runPanelLabels, labels)
  const { locale } = useFlowLocale()
  const hintId = useId()
  const nodes = useFlowEditorState((s) => s.nodes)
  const isRunning = useFlowEditorState((s) => s.isRunning)
  const results = useFlowEditorState((s) => s.nodeResults)

  const rows = nodes.filter((n) => !NON_EXECUTABLE_KINDS.includes(n.kind))
  const hasStart = nodes.some((n) => START_KINDS.includes(n.kind))
  const hasEnd = nodes.some((n) => END_KINDS.includes(n.kind))
  const blocker = !hasStart ? l.noStart : !hasEnd ? l.noEnd : null

  const action = isRunning ? (
    <Button variant="danger" size="compact" leadingIcon={<Square />} onPress={onStop}>
      {l.stop}
    </Button>
  ) : (
    <Button variant="primary" size="compact" leadingIcon={<Play />} disabled={!!blocker} focusableWhenDisabled onPress={onRun}>
      {l.run}
    </Button>
  )

  return (
    <DockedPanel title={l.title} edge="bottom" onClose={onClose} closeLabel={l.close} actions={action} className="ty-run-panel" data={{ 'data-running': isRunning ? 'true' : undefined }}>
      <div role="status" aria-live="polite" className={isRunning ? 'ty-run-panel__running' : 'ty-visually-hidden'}>
        {isRunning ? <RunStatusMark status="running" labels={{ ...statusLabels, running: l.running }} /> : ''}
      </div>
      {blocker && !isRunning ? (
        <p id={hintId} className="ty-run-panel__hint">
          {blocker}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="ty-run-empty">{l.empty}</p>
      ) : (
        <ul className="ty-run-rows" aria-label={l.title}>
          {rows.map((n) => {
            const r = results[n.id]
            const errorId = `${hintId}-${n.id}-error`
            const label = typeof n.data.label === 'string' && n.data.label ? n.data.label : n.id
            return (
              <li key={n.id} className="ty-run-row" data-status={r?.status ?? 'idle'} aria-describedby={r?.error ? errorId : undefined}>
                <RunStatusMark status={r?.status ?? 'pending'} labels={statusLabels} />
                <span className="ty-run-row__label">{label}</span>
                <span className="ty-run-row__kind">{n.kind}</span>
                {r?.durationMs !== undefined ? <span className="ty-run-row__duration">{formatDuration(r.durationMs, locale)}</span> : null}
                {r?.error ? (
                  <span id={errorId} className="ty-run-row__error">
                    {r.error}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </DockedPanel>
  )
}
