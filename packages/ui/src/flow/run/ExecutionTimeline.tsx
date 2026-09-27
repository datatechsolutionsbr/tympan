// ExecutionTimeline: a run step by step. A listbox of steps (status, timing)
// beside an inspector for the selected step: facts, model usage, model and tool
// calls, inputs, outputs and error.

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { ListBox, ListBoxItem } from 'react-aria-components'
import { ActorChip, Button, Tag, useMediaQuery } from '../../index'
import { formatDateTime, formatDuration, formatNumber } from '../internal/format'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import { RunStatusMark, type RunWordLabels } from './RunStatusMark'
import { prettyValue } from './runData'
import type { RunActor } from './types'

export type TimelineStatus = 'completed' | 'running' | 'failed' | 'pending' | 'skipped'

export interface ModelCall {
  sequence?: number
  turn: number
  agent?: string
  tokensIn?: number
  tokensOut?: number
  cacheRead?: number
  cacheWrite?: number
  cost?: number
  timeToFirstTokenMs?: number
  durationMs?: number
  stopReason?: string
  input?: unknown
  output?: unknown
}

export interface ToolCall {
  sequence?: number
  status: string
  tool: string
  turn?: number
  durationMs?: number
}

export interface StepMetrics {
  provider?: string
  model?: string
  tokensIn?: number
  tokensOut?: number
  cost?: number
  /** ISO 4217 code for the cost; plain number when absent. */
  currency?: string
}

export interface TimelineEntry {
  nodeId: string
  nodeKind: string
  status: TimelineStatus
  startedAt?: string | null
  completedAt?: string | null
  durationMs?: number | null
  inputs?: unknown
  outputs?: unknown
  error?: string | null
  metrics?: StepMetrics
  modelCalls?: ModelCall[]
  toolCalls?: ToolCall[]
  restored?: boolean
  /** Agent (or person, system) that produced this step (§2.11). */
  actor?: RunActor
}

export type AuditEvent =
  | ({ kind: 'model-call'; nodeId: string; sequence: number } & Omit<ModelCall, 'sequence'>)
  | ({ kind: 'tool-call'; nodeId: string; sequence: number } & Omit<ToolCall, 'sequence'>)
  | { kind: string; nodeId?: string; sequence?: number; [k: string]: unknown }

/**
 * New entries with model-call and tool-call events attached to their node in
 * sequence order. Unknown nodes and other event kinds are ignored; entries
 * that gain nothing stay the same objects; with nothing to attach the input
 * list itself is returned.
 */
export function attachAuditEvents(entries: readonly TimelineEntry[], events: readonly AuditEvent[]): readonly TimelineEntry[] {
  const known = new Set(entries.map((e) => e.nodeId))
  const byNode = new Map<string, { model: ModelCall[]; tool: ToolCall[] }>()
  const sorted = events
    .filter((e) => (e.kind === 'model-call' || e.kind === 'tool-call') && typeof e.nodeId === 'string' && known.has(e.nodeId))
    .slice()
    .sort((a, b) => Number(a.sequence ?? 0) - Number(b.sequence ?? 0))
  if (!sorted.length) return entries
  for (const e of sorted) {
    const { kind, nodeId, ...rest } = e as { kind: string; nodeId: string } & Record<string, unknown>
    if (!byNode.has(nodeId)) byNode.set(nodeId, { model: [], tool: [] })
    const bucket = byNode.get(nodeId)!
    if (kind === 'model-call') bucket.model.push(rest as unknown as ModelCall)
    else bucket.tool.push(rest as unknown as ToolCall)
  }
  return entries.map((entry) => {
    const add = byNode.get(entry.nodeId)
    if (!add) return entry
    return {
      ...entry,
      ...(add.model.length ? { modelCalls: [...(entry.modelCalls ?? []), ...add.model] } : {}),
      ...(add.tool.length ? { toolCalls: [...(entry.toolCalls ?? []), ...add.tool] } : {}),
    }
  })
}

export interface TimelineLabels {
  steps: string
  empty: string
  details: string
  restored: string
  started: string
  finished: string
  duration: string
  status: string
  notReported: string
  metrics: string
  model: string
  tokens: string
  tokensTerm: string
  cost: string
  error: string
  modelCalls: string
  toolCalls: string
  modelCallSummary: string
  cache: string
  firstToken: string
  stopReason: string
  modelInput: string
  modelOutput: string
  toolCallSummary: string
  inputs: string
  outputs: string
  backToSteps: string
  stepName: string
  selected: string
}

export const timelineLabels = defineLabels<TimelineLabels>('execution-timeline', {
  en: {
    steps: 'Steps',
    empty: 'This run has no steps to show.',
    details: 'Details of {node}',
    restored: 'restored',
    started: 'Started',
    finished: 'Finished',
    duration: 'Duration',
    status: 'Status',
    notReported: 'not reported',
    metrics: 'Model usage',
    model: 'Model',
    tokens: '{input} in, {output} out',
    tokensTerm: 'Tokens',
    cost: 'Cost',
    error: 'Error',
    modelCalls: 'Model calls',
    toolCalls: 'Tool calls',
    modelCallSummary: 'Turn {turn}',
    cache: 'cache {read} read, {write} written',
    firstToken: 'first token {time}',
    stopReason: 'stop: {reason}',
    modelInput: 'Model input',
    modelOutput: 'Model output',
    toolCallSummary: '{tool}, turn {turn}',
    inputs: 'Inputs',
    outputs: 'Outputs',
    backToSteps: 'Back to steps',
    stepName: 'Step {ordinal}: {node}, {kind}',
    selected: 'Showing {node}',
  },
  'pt-BR': {
    steps: 'Passos',
    empty: 'Esta execução não tem passos para mostrar.',
    details: 'Detalhes de {node}',
    restored: 'reaproveitado',
    started: 'Início',
    finished: 'Fim',
    duration: 'Duração',
    status: 'Estado',
    notReported: 'não informado',
    metrics: 'Uso do modelo',
    model: 'Modelo',
    tokens: '{input} de entrada, {output} de saída',
    tokensTerm: 'Tokens',
    cost: 'Custo',
    error: 'Erro',
    modelCalls: 'Chamadas ao modelo',
    toolCalls: 'Chamadas de ferramenta',
    modelCallSummary: 'Turno {turn}',
    cache: 'cache {read} lidos, {write} gravados',
    firstToken: 'primeiro token {time}',
    stopReason: 'parada: {reason}',
    modelInput: 'Entrada do modelo',
    modelOutput: 'Saída do modelo',
    toolCallSummary: '{tool}, turno {turn}',
    inputs: 'Entradas',
    outputs: 'Saídas',
    backToSteps: 'Voltar aos passos',
    stepName: 'Passo {ordinal}: {node}, {kind}',
    selected: 'Mostrando {node}',
  },
  es: {
    steps: 'Pasos',
    empty: 'Esta ejecución no tiene pasos para mostrar.',
    details: 'Detalles de {node}',
    restored: 'restaurado',
    started: 'Inicio',
    finished: 'Fin',
    duration: 'Duración',
    status: 'Estado',
    notReported: 'no informado',
    metrics: 'Uso del modelo',
    model: 'Modelo',
    tokens: '{input} de entrada, {output} de salida',
    tokensTerm: 'Tokens',
    cost: 'Costo',
    error: 'Error',
    modelCalls: 'Llamadas al modelo',
    toolCalls: 'Llamadas a herramientas',
    modelCallSummary: 'Turno {turn}',
    cache: 'caché {read} leídos, {write} escritos',
    firstToken: 'primer token {time}',
    stopReason: 'parada: {reason}',
    modelInput: 'Entrada del modelo',
    modelOutput: 'Salida del modelo',
    toolCallSummary: '{tool}, turno {turn}',
    inputs: 'Entradas',
    outputs: 'Salidas',
    backToSteps: 'Volver a los pasos',
    stepName: 'Paso {ordinal}: {node}, {kind}',
    selected: 'Mostrando {node}',
  },
})
export const defaultTimelineLabels: TimelineLabels = timelineLabels.bundles.en

export interface ExecutionTimelineProps {
  entries: readonly TimelineEntry[]
  selectedNodeId?: string
  onSelect?: (nodeId: string) => void
  inspectorActions?: (entry: TimelineEntry) => ReactNode
  labels?: Partial<TimelineLabels>
  statusLabels?: Partial<RunWordLabels>
  /** Hides the restored Tag when false (the spec: omitting the label hides it). */
  showRestored?: boolean
}

/** Default selection: the first failed step, else the first step. */
export function defaultTimelineSelection(entries: readonly TimelineEntry[]): string | undefined {
  return (entries.find((e) => e.status === 'failed') ?? entries[0])?.nodeId
}

export function ExecutionTimeline({ entries, selectedNodeId, onSelect, inspectorActions, labels, statusLabels, showRestored = true }: ExecutionTimelineProps) {
  const l = useLabels(timelineLabels, labels)
  const { locale } = useFlowLocale()
  const wide = useMediaQuery('(min-width: 1024px)', true)
  const [selected, setSelected] = useControllable<string | undefined>(selectedNodeId, () => defaultTimelineSelection(entries), onSelect ? (id) => id && onSelect(id) : undefined)
  const listRef = useRef<HTMLDivElement>(null)
  const inspectorId = useId()
  const [announce, setAnnounce] = useState('')
  const first = useRef(true)
  const entry = useMemo(() => entries.find((e) => e.nodeId === selected) ?? (selectedNodeId === undefined ? entries.find((e) => e.nodeId === defaultTimelineSelection(entries)) : undefined), [entries, selected, selectedNodeId])

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (entry) setAnnounce(fill(l.selected, { node: entry.nodeId }, locale))
    // Announce changes of the selected node only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.nodeId])

  if (!entries.length) return <p className="ty-run-empty ty-timeline__empty">{l.empty}</p>

  const dur = (ms?: number | null) => (ms === null || ms === undefined ? l.notReported : formatDuration(ms, locale))
  const when = (iso?: string | null) => (iso ? formatDateTime(iso, locale, { timeStyle: 'medium' }) : l.notReported)
  const num = (n?: number) => (n === undefined ? l.notReported : formatNumber(n, locale))
  const money = (n?: number, currency?: string) => (n === undefined ? l.notReported : currency ? formatNumber(n, locale, { style: 'currency', currency, maximumFractionDigits: 4 }) : formatNumber(n, locale, { maximumFractionDigits: 6 }))

  return (
    <div className="ty-timeline" data-layout={wide ? 'columns' : 'stacked'}>
      <div className="ty-timeline__steps" ref={listRef}>
        <ListBox
          aria-label={l.steps}
          className="ty-timeline__list"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={entry ? [entry.nodeId] : []}
          onSelectionChange={(keys) => {
            const k = [...(keys as Set<string | number>)][0]
            if (k !== undefined) setSelected(String(k))
          }}
          items={entries.map((e, i) => ({ ...e, id: e.nodeId, ordinal: i + 1 }))}
        >
          {(e) => (
            <ListBoxItem id={e.nodeId} textValue={fill(l.stepName, { ordinal: e.ordinal, node: e.nodeId, kind: e.nodeKind }, locale)} className="ty-timeline__step" data-status={e.status}>
              <span className="ty-timeline__ordinal" aria-hidden="true">
                {formatNumber(e.ordinal, locale)}
              </span>
              <span className="ty-timeline__step-main">
                <span className="ty-timeline__node">
                  <code className="ty-run-mono">{e.nodeId}</code>
                  <span className="ty-run-row__kind">{e.nodeKind}</span>
                </span>
                <span className="ty-timeline__step-meta">
                  <RunStatusMark status={e.status} labels={statusLabels} />
                  <span>{dur(e.durationMs)}</span>
                  {e.startedAt ? <time dateTime={e.startedAt}>{when(e.startedAt)}</time> : null}
                </span>
              </span>
            </ListBoxItem>
          )}
        </ListBox>
      </div>
      {entry ? (
        <section id={inspectorId} className="ty-timeline__inspector" aria-label={fill(l.details, { node: entry.nodeId }, locale)}>
          {!wide ? (
            <Button
              variant="quiet"
              size="compact"
              onPress={() => listRef.current?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')?.focus()}
              className="ty-timeline__back"
            >
              {l.backToSteps}
            </Button>
          ) : null}
          <header className="ty-timeline__head">
            <h3 className="ty-run-section__title">
              <code className="ty-run-mono">{entry.nodeId}</code>
            </h3>
            {entry.restored && showRestored ? <Tag size="small">{l.restored}</Tag> : null}
            <RunStatusMark status={entry.status} labels={statusLabels} />
            {entry.actor ? <ActorChip kind={entry.actor.kind} name={entry.actor.name} {...(entry.actor.agentKey ? { agentKey: entry.actor.agentKey } : {})} {...(entry.actor.model ? { model: entry.actor.model } : {})} compact /> : null}
            {entry.startedAt ? (
              <time className="ty-timeline__time" dateTime={entry.startedAt}>
                {when(entry.startedAt)}
              </time>
            ) : null}
            {inspectorActions ? <div className="ty-timeline__actions">{inspectorActions(entry)}</div> : null}
          </header>
          <dl className="ty-run-facts">
            <div>
              <dt>{l.started}</dt>
              <dd>{when(entry.startedAt)}</dd>
            </div>
            <div>
              <dt>{l.finished}</dt>
              <dd>{when(entry.completedAt)}</dd>
            </div>
            <div>
              <dt>{l.duration}</dt>
              <dd>{dur(entry.durationMs)}</dd>
            </div>
            <div>
              <dt>{l.status}</dt>
              <dd>
                <RunStatusMark status={entry.status} labels={statusLabels} />
              </dd>
            </div>
          </dl>
          {entry.metrics ? (
            <section className="ty-run-section">
              <h4 className="ty-run-subtitle">{l.metrics}</h4>
              <dl className="ty-run-facts">
                <div>
                  <dt>{l.model}</dt>
                  <dd>
                    <code className="ty-run-mono">{[entry.metrics.provider, entry.metrics.model].filter(Boolean).join(' · ') || l.notReported}</code>
                  </dd>
                </div>
                <div>
                  <dt>{l.tokensTerm}</dt>
                  <dd>{fill(l.tokens, { input: num(entry.metrics.tokensIn), output: num(entry.metrics.tokensOut) }, locale)}</dd>
                </div>
                <div>
                  <dt>{l.cost}</dt>
                  <dd>{money(entry.metrics.cost, entry.metrics.currency)}</dd>
                </div>
              </dl>
            </section>
          ) : null}
          {entry.error ? (
            <section className="ty-run-section">
              <h4 className="ty-run-subtitle">{l.error}</h4>
              <p className="ty-run-error">{entry.error}</p>
            </section>
          ) : null}
          {entry.modelCalls?.length ? (
            <section className="ty-run-section">
              <h4 className="ty-run-subtitle">{l.modelCalls}</h4>
              {entry.modelCalls.map((c, i) => (
                <details key={i} className="ty-timeline__call">
                  <summary className="ty-timeline__call-summary">
                    {[
                      fill(l.modelCallSummary, { turn: c.turn }, locale),
                      c.agent,
                      c.tokensIn !== undefined || c.tokensOut !== undefined ? fill(l.tokens, { input: num(c.tokensIn), output: num(c.tokensOut) }, locale) : null,
                      c.cacheRead !== undefined || c.cacheWrite !== undefined ? fill(l.cache, { read: num(c.cacheRead ?? 0), write: num(c.cacheWrite ?? 0) }, locale) : null,
                      c.cost !== undefined ? money(c.cost, entry.metrics?.currency) : null,
                      c.timeToFirstTokenMs !== undefined ? fill(l.firstToken, { time: formatDuration(c.timeToFirstTokenMs, locale) }, locale) : null,
                      c.durationMs !== undefined ? formatDuration(c.durationMs, locale) : null,
                      c.stopReason ? fill(l.stopReason, { reason: c.stopReason }, locale) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </summary>
                  <h5 className="ty-run-subtitle">{l.modelInput}</h5>
                  <Transcript value={c.input} />
                  <h5 className="ty-run-subtitle">{l.modelOutput}</h5>
                  <Transcript value={c.output} />
                </details>
              ))}
            </section>
          ) : null}
          {entry.toolCalls?.length ? (
            <section className="ty-run-section">
              <h4 className="ty-run-subtitle">{l.toolCalls}</h4>
              <ul className="ty-run-rows">
                {entry.toolCalls.map((t, i) => (
                  <li key={i} className="ty-run-row">
                    <RunStatusMark status={t.status} labels={statusLabels} />
                    <span>{fill(l.toolCallSummary, { tool: t.tool, turn: t.turn ?? '' }, locale)}</span>
                    <span className="ty-run-row__duration">{dur(t.durationMs)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="ty-run-section">
            <h4 className="ty-run-subtitle">{l.inputs}</h4>
            <pre className="ty-run-output" tabIndex={0} aria-label={l.inputs}>
              {entry.inputs === undefined ? l.notReported : prettyValue(entry.inputs)}
            </pre>
            <h4 className="ty-run-subtitle">{l.outputs}</h4>
            <pre className="ty-run-output" tabIndex={0} aria-label={l.outputs}>
              {entry.outputs === undefined ? l.notReported : prettyValue(entry.outputs)}
            </pre>
          </section>
          <p className="ty-visually-hidden" role="status" aria-live="polite">
            {announce}
          </p>
        </section>
      ) : null}
    </div>
  )
}

/** Model transcript: text blocks as readable text, other blocks as structured text. */
function Transcript({ value }: { value: unknown }) {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return <p className="ty-timeline__text">{value}</p>
  if (Array.isArray(value)) {
    return (
      <div className="ty-timeline__transcript">
        {value.map((item, i) => (
          <TranscriptBlock key={i} block={item} />
        ))}
      </div>
    )
  }
  return <TranscriptBlock block={value} />
}

function TranscriptBlock({ block }: { block: unknown }) {
  if (typeof block === 'string') return <p className="ty-timeline__text">{block}</p>
  if (block && typeof block === 'object') {
    const b = block as Record<string, unknown>
    if (b.type === 'text' && typeof b.text === 'string') return <p className="ty-timeline__text">{b.text}</p>
    if ('content' in b && typeof b.role === 'string') {
      return (
        <div className="ty-timeline__message" data-role={b.role}>
          <span className="ty-timeline__role">{b.role}</span>
          <Transcript value={b.content} />
        </div>
      )
    }
  }
  return <pre className="ty-run-output">{prettyValue(block)}</pre>
}
