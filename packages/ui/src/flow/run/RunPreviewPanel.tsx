// RunPreviewPanel: the compact floating run view. Live node results while a
// run executes, then the recent history with drill-down to one node's output.

import { useEffect, useRef, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { Button, Spinner } from '../../index'
import { DockedPanel } from '../internal/DockedPanel'
import { formatDateTime, formatDuration } from '../internal/format'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import { useFlowEditorState } from '../state/editorState'
import { NON_EXECUTABLE_KINDS } from './RunPanel'
import { RunStatusMark, runWordOf, type RunWordLabels } from './RunStatusMark'
import { prettyValue, useRunHistory, useTransition } from './runData'
import type { LoadRuns, RunNodeResult } from './types'

export interface RunPreviewPanelLabels {
  title: string
  close: string
  live: string
  history: string
  liveSummary: string
  nodeDetail: string
  closeDetail: string
  outputs: string
  duration: string
  notReported: string
  empty: string
  loading: string
  error: string
  retry: string
  expand: string
  runRow: string
}

export const runPreviewPanelLabels = defineLabels<RunPreviewPanelLabels>('run-preview-panel', {
  en: {
    title: 'Run preview',
    close: 'Close run preview',
    live: 'Live results',
    history: 'Recent runs',
    liveSummary: '{done} of {total} steps finished',
    nodeDetail: 'Result of {node}',
    closeDetail: 'Close result',
    outputs: 'Outputs',
    duration: 'Duration',
    notReported: 'not reported',
    empty: 'This flow has not been run yet.',
    loading: 'Loading runs',
    error: 'Runs could not be loaded: {message}',
    retry: 'Try again',
    expand: 'Open full run details',
    runRow: 'Run started {time}',
  },
  'pt-BR': {
    title: 'Prévia da execução',
    close: 'Fechar prévia da execução',
    live: 'Resultados ao vivo',
    history: 'Execuções recentes',
    liveSummary: '{done} de {total} passos concluídos',
    nodeDetail: 'Resultado de {node}',
    closeDetail: 'Fechar resultado',
    outputs: 'Saídas',
    duration: 'Duração',
    notReported: 'não informado',
    empty: 'Este fluxo ainda não foi executado.',
    loading: 'Carregando execuções',
    error: 'Não foi possível carregar as execuções: {message}',
    retry: 'Tentar de novo',
    expand: 'Abrir detalhes completos',
    runRow: 'Execução iniciada {time}',
  },
  es: {
    title: 'Vista previa de la ejecución',
    close: 'Cerrar vista previa de la ejecución',
    live: 'Resultados en vivo',
    history: 'Ejecuciones recientes',
    liveSummary: '{done} de {total} pasos terminados',
    nodeDetail: 'Resultado de {node}',
    closeDetail: 'Cerrar resultado',
    outputs: 'Salidas',
    duration: 'Duración',
    notReported: 'no informado',
    empty: 'Este flujo aún no se ha ejecutado.',
    loading: 'Cargando ejecuciones',
    error: 'No se pudieron cargar las ejecuciones: {message}',
    retry: 'Reintentar',
    expand: 'Abrir detalles completos',
    runRow: 'Ejecución iniciada {time}',
  },
})
export const defaultRunPreviewPanelLabels: RunPreviewPanelLabels = runPreviewPanelLabels.bundles.en

export interface RunPreviewPanelProps {
  open: boolean
  onClose: () => void
  flowId: string
  loadRuns: LoadRuns
  labels?: Partial<RunPreviewPanelLabels>
  statusLabels?: Partial<RunWordLabels>
  /** Selected run (null: live results). Shared with RunDrawer through RunViews. */
  selectedRunId?: string | null
  onSelectedRunChange?: (id: string | null) => void
  selectedNodeId?: string | null
  onSelectedNodeChange?: (id: string | null) => void
  /** Shows the "expand" control that switches to the drawer. */
  onExpand?: () => void
  returnFocusTo?: HTMLElement | null
}

export function RunPreviewPanel(props: RunPreviewPanelProps) {
  if (!props.open) return null
  return <PreviewBody {...props} />
}

function PreviewBody(props: RunPreviewPanelProps) {
  const { onClose, flowId, loadRuns, labels, statusLabels, onExpand, returnFocusTo } = props
  const l = useLabels(runPreviewPanelLabels, labels)
  const { locale } = useFlowLocale()
  const [runId, setRunId] = useControllable<string | null>(props.selectedRunId, null, props.onSelectedRunChange)
  const [nodeId, setNodeId] = useControllable<string | null>(props.selectedNodeId, null, props.onSelectedNodeChange)
  const isRunning = useFlowEditorState((s) => s.isRunning)
  const nodes = useFlowEditorState((s) => s.nodes)
  const results = useFlowEditorState((s) => s.nodeResults)
  const [finished, setFinished] = useState(0)
  useTransition(isRunning, true, false, () => setFinished((f) => f + 1))
  const history = useRunHistory(flowId, loadRuns, true, finished)
  const detailHeading = useRef<HTMLHeadingElement>(null)
  const rowRefs = useRef(new Map<string, HTMLButtonElement>())

  const live: RunNodeResult[] = nodes
    .filter((n) => !NON_EXECUTABLE_KINDS.includes(n.kind) && results[n.id])
    .map((n) => {
      const r = results[n.id]!
      return { nodeId: n.id, label: typeof n.data.label === 'string' ? n.data.label : undefined, kind: n.kind, status: r.status, ...(r.durationMs !== undefined ? { durationMs: r.durationMs } : {}), ...(r.error ? { error: r.error } : {}), outputs: r.data }
    })
  const selectedRun = runId ? history.runs.find((r) => r.id === runId) : undefined
  const detail: RunNodeResult | undefined = nodeId ? (selectedRun ? selectedRun.nodeResults?.find((n) => n.nodeId === nodeId) : live.find((n) => n.nodeId === nodeId)) : undefined

  useEffect(() => {
    if (detail) detailHeading.current?.focus()
    // Only when the selected node changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  const dur = (ms?: number) => (ms === undefined ? l.notReported : formatDuration(ms, locale))
  const doneCount = live.filter((r) => r.status === 'success' || r.status === 'error').length

  const closeDetail = () => {
    const back = nodeId ? rowRefs.current.get(`${runId ?? 'live'}:${nodeId}`) : null
    setNodeId(null)
    requestAnimationFrame(() => back?.focus())
  }

  const nodeRow = (scope: string, r: RunNodeResult) => (
    <li key={r.nodeId}>
      <button
        type="button"
        className="ty-run-item"
        ref={(el) => {
          if (el) rowRefs.current.set(`${scope}:${r.nodeId}`, el)
        }}
        data-selected={nodeId === r.nodeId || undefined}
        onClick={() => setNodeId(r.nodeId)}
      >
        <RunStatusMark status={r.status} labels={statusLabels} />
        <span className="ty-run-item__name">{r.label ?? r.nodeId}</span>
        <span className="ty-run-item__meta">{dur(r.durationMs)}</span>
      </button>
    </li>
  )

  return (
    <DockedPanel
      title={l.title}
      edge="float"
      onClose={onClose}
      closeLabel={l.close}
      returnFocusTo={returnFocusTo ?? null}
      className="ty-run-preview"
      actions={
        onExpand ? (
          <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={l.expand} leadingIcon={<Maximize2 />} onPress={onExpand} className="ty-run-switch" />
        ) : null
      }
    >
      {isRunning ? (
        <section className="ty-run-section" aria-label={l.live}>
          <h3 className="ty-run-section__title">{l.live}</h3>
          <p className="ty-visually-hidden" role="status" aria-live="polite">
            {fill(l.liveSummary, { done: doneCount, total: nodes.filter((n) => !NON_EXECUTABLE_KINDS.includes(n.kind)).length }, locale)}
          </p>
          <ul className="ty-run-items">{live.map((r) => nodeRow('live', r))}</ul>
        </section>
      ) : null}

      {detail ? (
        <section className="ty-run-detail" aria-labelledby="ty-run-preview-detail">
          <div className="ty-run-detail__head">
            <h3 id="ty-run-preview-detail" ref={detailHeading} tabIndex={-1} className="ty-run-section__title">
              {fill(l.nodeDetail, { node: detail.label ?? detail.nodeId })}
            </h3>
            <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={l.closeDetail} leadingIcon={<X />} onPress={closeDetail} />
          </div>
          <dl className="ty-run-facts">
            <div>
              <dt>{l.duration}</dt>
              <dd>{dur(detail.durationMs)}</dd>
            </div>
          </dl>
          <RunStatusMark status={detail.status} labels={statusLabels} />
          {detail.error ? <p className="ty-run-error">{detail.error}</p> : null}
          <h4 className="ty-run-subtitle">{l.outputs}</h4>
          <pre className="ty-run-output" tabIndex={0} aria-label={l.outputs}>
            {detail.outputs === undefined ? l.notReported : prettyValue(detail.outputs)}
          </pre>
        </section>
      ) : null}

      <section className="ty-run-section" aria-label={l.history} aria-busy={history.state === 'loading' || undefined}>
        <h3 className="ty-run-section__title">{l.history}</h3>
        {history.state === 'loading' ? (
          <p role="status" className="ty-run-loading">
            <Spinner size="small" label={l.loading} showLabel />
          </p>
        ) : history.state === 'error' ? (
          <div className="ty-run-load-error" role="alert">
            <p>{fill(l.error, { message: history.error ?? '' })}</p>
            <Button size="compact" onPress={history.retry}>
              {l.retry}
            </Button>
          </div>
        ) : history.runs.length === 0 && history.state === 'ready' ? (
          <p className="ty-run-empty">{l.empty}</p>
        ) : (
          <ul className="ty-run-items">
            {history.runs.map((run) => {
              const expanded = runId === run.id
              return (
                <li key={run.id} className="ty-run-history-item">
                  <button
                    type="button"
                    className="ty-run-item"
                    aria-expanded={expanded}
                    aria-controls={`ty-run-${run.id}`}
                    data-status={runWordOf(run.status)}
                    onClick={() => {
                      setRunId(expanded ? null : run.id)
                      setNodeId(null)
                    }}
                  >
                    <RunStatusMark status={run.status} labels={statusLabels} />
                    <span className="ty-run-item__name">{fill(l.runRow, { time: formatDateTime(run.startedAt, locale) })}</span>
                    <span className="ty-run-item__meta">{dur(run.durationMs)}</span>
                  </button>
                  {expanded ? (
                    <ul id={`ty-run-${run.id}`} className="ty-run-items ty-run-items--nested">
                      {(run.nodeResults ?? []).map((r) => nodeRow(run.id, r))}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </DockedPanel>
  )
}
