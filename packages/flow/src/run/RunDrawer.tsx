// RunDrawer: the docked, full run view. Live run and history in tabs; a run
// shows metrics, token usage, tools called and a per-node breakdown. Non-modal
// complementary landmark: the canvas stays usable.

import { useEffect, useId, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, CircleAlert, Minimize2, Workflow } from 'lucide-react'
import { Button, Spinner, TabPanel, Tabs } from '@fakhir/ui'
import { DockedPanel } from '../internal/DockedPanel'
import { formatDateTime, formatDuration, formatNumber } from '../internal/format'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import { useFlowEditorState } from '../state/editorState'
import { NON_EXECUTABLE_KINDS } from './RunPanel'
import { RunStatusMark, runWordLabels, runWordOf, type RunWordLabels } from './RunStatusMark'
import { countTools, prettyValue, sumTokens, useRunHistory, useTransition } from './runData'
import type { LoadRuns, RunNodeResult, RunSummary } from './types'

export interface RunDrawerLabels {
  title: string
  close: string
  tabs: string
  live: string
  history: string
  idleHint: string
  back: string
  totalDuration: string
  nodeCount: string
  succeeded: string
  errors: string
  errorsTerm: string
  tokens: string
  tokensIn: string
  tokensOut: string
  tokensTotal: string
  tokensNotReported: string
  tools: string
  toolCalls: string
  toolsNotReported: string
  nodes: string
  output: string
  notReported: string
  loading: string
  loadError: string
  retry: string
  empty: string
  runRow: string
  compact: string
  statusChanged: string
}

export const runDrawerLabels = defineLabels<RunDrawerLabels>('run-drawer', {
  en: {
    title: 'Run details',
    close: 'Close run details',
    tabs: 'Run views',
    live: 'Live',
    history: 'History',
    idleHint: 'Start a run to follow it here, step by step.',
    back: 'Back to runs',
    totalDuration: 'Total duration',
    nodeCount: 'Steps',
    succeeded: 'Succeeded',
    errors: '{count, plural, =0 {No errors} one {# error} other {# errors}}',
    errorsTerm: 'Errors',
    tokens: 'Model tokens',
    tokensIn: 'Input',
    tokensOut: 'Output',
    tokensTotal: 'Total',
    tokensNotReported: 'Token usage was not reported.',
    tools: 'Tools called',
    toolCalls: '{count, plural, one {# call} other {# calls}}',
    toolsNotReported: 'No tool calls were reported.',
    nodes: 'Steps of this run',
    output: 'Output of {node}',
    notReported: 'not reported',
    loading: 'Loading runs',
    loadError: 'Runs could not be loaded: {message}',
    retry: 'Try again',
    empty: 'This flow has not been run yet.',
    runRow: 'Run started {time}',
    compact: 'Switch to compact view',
    statusChanged: 'Run {status}',
  },
  'pt-BR': {
    title: 'Detalhes da execução',
    close: 'Fechar detalhes da execução',
    tabs: 'Visões da execução',
    live: 'Ao vivo',
    history: 'Histórico',
    idleHint: 'Inicie uma execução para acompanhá-la aqui, passo a passo.',
    back: 'Voltar às execuções',
    totalDuration: 'Duração total',
    nodeCount: 'Passos',
    succeeded: 'Concluídos',
    errors: '{count, plural, =0 {Nenhum erro} one {# erro} other {# erros}}',
    errorsTerm: 'Erros',
    tokens: 'Tokens do modelo',
    tokensIn: 'Entrada',
    tokensOut: 'Saída',
    tokensTotal: 'Total',
    tokensNotReported: 'O uso de tokens não foi informado.',
    tools: 'Ferramentas chamadas',
    toolCalls: '{count, plural, one {# chamada} other {# chamadas}}',
    toolsNotReported: 'Nenhuma chamada de ferramenta foi informada.',
    nodes: 'Passos desta execução',
    output: 'Saída de {node}',
    notReported: 'não informado',
    loading: 'Carregando execuções',
    loadError: 'Não foi possível carregar as execuções: {message}',
    retry: 'Tentar de novo',
    empty: 'Este fluxo ainda não foi executado.',
    runRow: 'Execução iniciada {time}',
    compact: 'Mudar para a visão compacta',
    statusChanged: 'Execução {status}',
  },
  es: {
    title: 'Detalles de la ejecución',
    close: 'Cerrar detalles de la ejecución',
    tabs: 'Vistas de la ejecución',
    live: 'En vivo',
    history: 'Historial',
    idleHint: 'Inicie una ejecución para seguirla aquí, paso a paso.',
    back: 'Volver a las ejecuciones',
    totalDuration: 'Duración total',
    nodeCount: 'Pasos',
    succeeded: 'Completados',
    errors: '{count, plural, =0 {Sin errores} one {# error} other {# errores}}',
    errorsTerm: 'Errores',
    tokens: 'Tokens del modelo',
    tokensIn: 'Entrada',
    tokensOut: 'Salida',
    tokensTotal: 'Total',
    tokensNotReported: 'No se informó el uso de tokens.',
    tools: 'Herramientas llamadas',
    toolCalls: '{count, plural, one {# llamada} other {# llamadas}}',
    toolsNotReported: 'No se informaron llamadas a herramientas.',
    nodes: 'Pasos de esta ejecución',
    output: 'Salida de {node}',
    notReported: 'no informado',
    loading: 'Cargando ejecuciones',
    loadError: 'No se pudieron cargar las ejecuciones: {message}',
    retry: 'Reintentar',
    empty: 'Este flujo aún no se ha ejecutado.',
    runRow: 'Ejecución iniciada {time}',
    compact: 'Cambiar a la vista compacta',
    statusChanged: 'Ejecución {status}',
  },
})
export const defaultRunDrawerLabels: RunDrawerLabels = runDrawerLabels.bundles.en

export type RunDrawerTab = 'live' | 'history'

export interface RunDrawerProps {
  open: boolean
  onClose: () => void
  flowId: string
  isRunning: boolean
  /** Engine status of the current run; normalised to idle, running, completed or failed. */
  runStatus: string
  loadRuns: LoadRuns
  labels?: Partial<RunDrawerLabels>
  statusLabels?: Partial<RunWordLabels>
  tab?: RunDrawerTab
  onTabChange?: (tab: RunDrawerTab) => void
  selectedRunId?: string | null
  onSelectedRunChange?: (id: string | null) => void
  /** Node whose output is expanded (the failing node on a failed run). */
  selectedNodeId?: string | null
  onSelectedNodeChange?: (id: string | null) => void
  /** Shows the "compact view" control that switches to RunPreviewPanel. */
  onCompact?: () => void
  returnFocusTo?: HTMLElement | null
}

export function RunDrawer(props: RunDrawerProps) {
  if (!props.open) return null
  return <DrawerBody {...props} />
}

function drawerWord(status: string, isRunning: boolean): 'idle' | 'running' | 'completed' | 'failed' {
  if (isRunning) return 'running'
  const w = runWordOf(status)
  return w === 'running' || w === 'completed' || w === 'failed' ? w : 'idle'
}

function DrawerBody(props: RunDrawerProps) {
  const { onClose, flowId, isRunning, runStatus, loadRuns, labels, statusLabels, onCompact, returnFocusTo } = props
  const l = useLabels(runDrawerLabels, labels)
  const words = useLabels(runWordLabels, statusLabels)
  const { locale } = useFlowLocale()
  const [tab, setTab] = useControllable<RunDrawerTab>(props.tab, 'live', props.onTabChange)
  const [runId, setRunId] = useControllable<string | null>(props.selectedRunId, null, props.onSelectedRunChange)
  const [expandedNode, setExpandedNode] = useControllable<string | null>(props.selectedNodeId, null, props.onSelectedNodeChange)
  const nodes = useFlowEditorState((s) => s.nodes)
  const results = useFlowEditorState((s) => s.nodeResults)
  const history = useRunHistory(flowId, loadRuns, tab === 'history')
  const rowRefs = useRef(new Map<string, HTMLButtonElement>())
  const lastSelected = useRef<string | null>(null)
  const word = drawerWord(runStatus, isRunning)
  const [announcement, setAnnouncement] = useState('')

  // A new run takes the drawer to Live and clears any history selection.
  useTransition(isRunning, false, true, () => {
    setTab('live')
    setRunId(null)
  })
  const firstWord = useRef(true)
  useEffect(() => {
    if (firstWord.current) {
      firstWord.current = false
      return
    }
    setAnnouncement(fill(l.statusChanged, { status: words[word] }, locale))
    // Announce status changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word])

  const liveRows: RunNodeResult[] = nodes
    .filter((n) => !NON_EXECUTABLE_KINDS.includes(n.kind) && results[n.id])
    .map((n) => {
      const r = results[n.id]!
      return { nodeId: n.id, label: typeof n.data.label === 'string' ? n.data.label : undefined, kind: n.kind, status: r.status, ...(r.durationMs !== undefined ? { durationMs: r.durationMs } : {}), ...(r.error ? { error: r.error } : {}), outputs: r.data }
    })
  const selectedRun = runId ? history.runs.find((r) => r.id === runId) : undefined
  const back = () => {
    const target = lastSelected.current
    setRunId(null)
    requestAnimationFrame(() => (target ? rowRefs.current.get(target)?.focus() : undefined))
  }

  return (
    <DockedPanel
      title={l.title}
      landmark="complementary"
      edge="end"
      icon={<Workflow />}
      onClose={onClose}
      closeLabel={l.close}
      returnFocusTo={returnFocusTo ?? null}
      className="fk-run-drawer"
      data={{ 'data-status': word }}
      actions={
        <>
          <RunStatusMark status={word} labels={statusLabels} className="fk-run-drawer__status" />
          {onCompact ? <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={l.compact} leadingIcon={<Minimize2 />} onPress={onCompact} className="fk-run-switch" /> : null}
        </>
      }
    >
      <p className="fk-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
      <Tabs label={l.tabs} tabs={[{ id: 'live', label: l.live }, { id: 'history', label: l.history }]} selectedKey={tab} onSelectionChange={(k) => setTab(k as RunDrawerTab)}>
        <TabPanel id="live">
          {liveRows.length === 0 && !isRunning ? (
            <p className="fk-run-empty">{l.idleHint}</p>
          ) : (
            <RunDetail rows={liveRows} total={undefined} failed={word === 'failed'} labels={l} statusLabels={statusLabels} locale={locale} expanded={expandedNode} onExpanded={setExpandedNode} />
          )}
        </TabPanel>
        <TabPanel id="history">
          {selectedRun ? (
            <div className="fk-run-drawer__run">
              <Button variant="quiet" size="compact" leadingIcon={<ArrowLeft className="fk-run-mirror" />} onPress={back}>
                {l.back}
              </Button>
              <RunDetail
                rows={selectedRun.nodeResults ?? []}
                total={selectedRun.durationMs}
                failed={runWordOf(selectedRun.status) === 'failed'}
                labels={l}
                statusLabels={statusLabels}
                locale={locale}
                expanded={expandedNode}
                onExpanded={setExpandedNode}
              />
            </div>
          ) : (
            <HistoryList
              history={history}
              labels={l}
              statusLabels={statusLabels}
              locale={locale}
              rowRefs={rowRefs.current}
              onSelect={(run) => {
                lastSelected.current = run.id
                setRunId(run.id)
              }}
            />
          )}
        </TabPanel>
      </Tabs>
    </DockedPanel>
  )
}

function HistoryList({
  history,
  labels: l,
  statusLabels,
  locale,
  rowRefs,
  onSelect,
}: {
  history: ReturnType<typeof useRunHistory>
  labels: RunDrawerLabels
  statusLabels?: Partial<RunWordLabels>
  locale: string
  rowRefs: Map<string, HTMLButtonElement>
  onSelect: (run: RunSummary) => void
}) {
  if (history.state === 'loading' || history.state === 'idle') {
    return (
      <div aria-busy="true" role="status" className="fk-run-loading">
        <Spinner size="small" label={l.loading} showLabel />
      </div>
    )
  }
  if (history.state === 'error') {
    return (
      <div className="fk-run-load-error" role="alert">
        <p>{fill(l.loadError, { message: history.error ?? '' }, locale)}</p>
        <Button size="compact" onPress={history.retry}>
          {l.retry}
        </Button>
      </div>
    )
  }
  if (!history.runs.length) return <p className="fk-run-empty">{l.empty}</p>
  return (
    <ul className="fk-run-items">
      {history.runs.map((run) => (
        <li key={run.id}>
          <button
            type="button"
            className="fk-run-item"
            data-status={runWordOf(run.status)}
            ref={(el) => {
              if (el) rowRefs.set(run.id, el)
            }}
            onClick={() => onSelect(run)}
          >
            <RunStatusMark status={run.status} labels={statusLabels} />
            <span className="fk-run-item__name">{fill(l.runRow, { time: formatDateTime(run.startedAt, locale) }, locale)}</span>
            <span className="fk-run-item__meta">{run.durationMs === undefined ? l.notReported : formatDuration(run.durationMs, locale)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function RunDetail({
  rows,
  total,
  failed,
  labels: l,
  statusLabels,
  locale,
  expanded,
  onExpanded,
}: {
  rows: readonly RunNodeResult[]
  total: number | undefined
  failed: boolean
  labels: RunDrawerLabels
  statusLabels?: Partial<RunWordLabels>
  locale: string
  expanded: string | null
  onExpanded: (id: string | null) => void
}) {
  const baseId = useId()
  const succeeded = rows.filter((r) => runWordOf(r.status) === 'completed').length
  const errorCount = rows.filter((r) => runWordOf(r.status) === 'failed').length
  const totalMs = total ?? rows.reduce((sum, r) => sum + (r.durationMs ?? 0), 0)
  const outputs = rows.map((r) => r.outputs)
  const tokens = sumTokens(outputs)
  const tools = countTools(outputs)
  const firstFailing = rows.find((r) => runWordOf(r.status) === 'failed')?.nodeId ?? null
  // A failed run opens with the failing node expanded.
  const [autoOpened, setAutoOpened] = useState(false)
  useEffect(() => {
    if (failed && firstFailing && !autoOpened && expanded === null) {
      setAutoOpened(true)
      onExpanded(firstFailing)
    }
  }, [failed, firstFailing, autoOpened, expanded, onExpanded])
  const num = (v: number) => formatNumber(v, locale)

  return (
    <div className="fk-run-detail" data-failed={failed || undefined}>
      {failed ? <div className="fk-run-detail__band" aria-hidden="true" /> : null}
      <dl className="fk-run-metrics">
        <div className="fk-run-metric">
          <dt>{l.totalDuration}</dt>
          <dd>{formatDuration(totalMs, locale)}</dd>
        </div>
        <div className="fk-run-metric">
          <dt>{l.nodeCount}</dt>
          <dd>{num(rows.length)}</dd>
        </div>
        <div className="fk-run-metric">
          <dt>{l.succeeded}</dt>
          <dd>{num(succeeded)}</dd>
        </div>
        <div className="fk-run-metric" data-tone={errorCount > 0 ? 'danger' : undefined}>
          <dt className="fk-visually-hidden">{l.errorsTerm}</dt>
          <dd className="fk-run-metric__errors">
            {errorCount > 0 ? <CircleAlert aria-hidden="true" focusable="false" /> : null}
            {fill(l.errors, { count: errorCount }, locale)}
          </dd>
        </div>
      </dl>

      <section className="fk-run-section" aria-labelledby={`${baseId}-tokens`}>
        <h3 id={`${baseId}-tokens`} className="fk-run-section__title">
          {l.tokens}
        </h3>
        {tokens ? (
          <dl className="fk-run-facts" data-testid="run-tokens">
            <div>
              <dt>{l.tokensIn}</dt>
              <dd>{num(tokens.input)}</dd>
            </div>
            <div>
              <dt>{l.tokensOut}</dt>
              <dd>{num(tokens.output)}</dd>
            </div>
            <div>
              <dt>{l.tokensTotal}</dt>
              <dd>{num(tokens.total)}</dd>
            </div>
          </dl>
        ) : (
          <p className="fk-run-hint">{l.tokensNotReported}</p>
        )}
      </section>

      <section className="fk-run-section" aria-labelledby={`${baseId}-tools`}>
        <h3 id={`${baseId}-tools`} className="fk-run-section__title">
          {l.tools}
        </h3>
        {tools ? (
          <ul className="fk-run-tools">
            {tools.map((t) => (
              <li key={t.name}>
                <code className="fk-run-mono">{t.name}</code> <span>{fill(l.toolCalls, { count: t.count }, locale)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="fk-run-hint">{l.toolsNotReported}</p>
        )}
      </section>

      <section className="fk-run-section" aria-labelledby={`${baseId}-nodes`}>
        <h3 id={`${baseId}-nodes`} className="fk-run-section__title">
          {l.nodes}
        </h3>
        <ul className="fk-run-rows">
          {rows.map((r) => {
            const open = expanded === r.nodeId
            const panelId = `${baseId}-${r.nodeId}`
            return (
              <li key={r.nodeId} className="fk-run-row" data-status={runWordOf(r.status)}>
                <button type="button" className="fk-run-row__toggle" aria-expanded={open} aria-controls={panelId} onClick={() => onExpanded(open ? null : r.nodeId)}>
                  <ChevronRight className="fk-run-row__chevron fk-run-mirror" aria-hidden="true" focusable="false" />
                  <RunStatusMark status={r.status} labels={statusLabels} />
                  <span className="fk-run-row__label">{r.label ?? r.nodeId}</span>
                  {r.kind ? <span className="fk-run-row__kind">{r.kind}</span> : null}
                  <span className="fk-run-row__duration">{r.durationMs === undefined ? l.notReported : formatDuration(r.durationMs, locale)}</span>
                </button>
                {r.error ? <p className="fk-run-row__error">{r.error}</p> : null}
                {open ? (
                  <pre id={panelId} className="fk-run-output" tabIndex={0} aria-label={fill(l.output, { node: r.label ?? r.nodeId }, locale)}>
                    {r.outputs === undefined ? l.notReported : prettyValue(r.outputs)}
                  </pre>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
