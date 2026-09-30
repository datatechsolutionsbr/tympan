// RunTimePanel: "para onde foi o tempo" — where the time of a run went. An
// optional data-derived claim line, then one row per node: state glyph and
// word, node name, duration and a proportional bar of the total run time.
// Rows that are still waiting draw a hatched bar instead of a fill, so an
// unfinished run reads differently from a fast one. Status is always an icon
// plus a word (design direction §2.3); the bar reinforces, never carries.

import { useId, type CSSProperties } from 'react'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { formatDuration, formatRelative } from '../internal/format'
import type { RunWord } from '../run/types'
import { RunStatusMark } from './RunStatusMark'

export type RunTimeNodeState = 'running' | 'waiting' | 'succeeded' | 'failed' | 'skipped'

export interface RunTimeNode {
  id: string
  name: string
  /** Node kind (kept for hosts that tint or link per kind; not rendered). */
  kind?: string
  state: RunTimeNodeState
  /** Wall time the node took; null when not reported (a still-waiting row). */
  durationMs: number | null
  /** ISO timestamp since when the node has been waiting (waiting rows). */
  waitingSince?: string | null
}

export interface RunTimeEvent {
  /** ISO timestamp of the event. */
  at: string
  text: string
}

export interface RunTimePanelLabels {
  /** Accessible name of the panel landmark. */
  title: string
  /** Word for a still-waiting row (replaces the pending word of the status mark). */
  waiting: string
  notReported: string
  /** Heading of the optional event log. */
  events: string
  /** Accessible text of a proportional bar: "{node}: {duration}, {percent}% of the run time". */
  bar: string
}

export const runTimePanelLabels = defineLabels<RunTimePanelLabels>('run-time-panel', {
  en: {
    title: 'Where the time went',
    waiting: 'waiting',
    notReported: 'not reported',
    events: 'Event log',
    bar: '{node}: {duration}, {percent}% of the run time',
  },
  'pt-BR': {
    title: 'Para onde foi o tempo',
    waiting: 'aguardando',
    notReported: 'não informado',
    events: 'Registro de eventos',
    bar: '{node}: {duration}, {percent}% do tempo de execução',
  },
  es: {
    title: 'Adónde fue el tiempo',
    waiting: 'en espera',
    notReported: 'no informado',
    events: 'Registro de eventos',
    bar: '{node}: {duration}, {percent}% del tiempo de ejecución',
  },
})

const WORD_OF: Record<RunTimeNodeState, RunWord> = {
  running: 'running',
  waiting: 'pending',
  succeeded: 'completed',
  failed: 'failed',
  skipped: 'skipped',
}

export interface RunTimePanelProps {
  nodes: RunTimeNode[]
  /** The data-derived assertion sentence ("Extrção levou 80% do tempo"). */
  claim?: string
  /** Optional event log of the run, newest last. */
  events?: RunTimeEvent[]
  labels?: Partial<RunTimePanelLabels>
  className?: string
}

export function RunTimePanel({ nodes, claim, events, labels, className }: RunTimePanelProps) {
  const l = useLabels(runTimePanelLabels, labels)
  const { locale } = useFlowLocale()
  const titleId = useId()
  const total = nodes.reduce((sum, node) => sum + (node.durationMs ?? 0), 0)
  return (
    <section className={['ty-run-time', className].filter(Boolean).join(' ')} aria-labelledby={claim ? undefined : titleId}>
      <h3 className="ty-run-time__title" id={titleId}>
        {l.title}
      </h3>
      {claim ? (
        <p className="ty-run-time__claim">
          {claim}
        </p>
      ) : null}
      <ul className="ty-run-time__rows">
        {nodes.map((node) => {
          const waiting = node.state === 'waiting'
          const duration = node.durationMs !== null && node.durationMs !== undefined ? formatDuration(node.durationMs, locale) : null
          const durationText = waiting ? (node.waitingSince ? formatRelative(node.waitingSince, locale) : l.waiting) : (duration ?? l.notReported)
          const percent = total > 0 && node.durationMs != null ? Math.max(2, Math.round((node.durationMs / total) * 100)) : 0
          const barStyle = { inlineSize: `${percent}%` } as CSSProperties
          return (
            <li key={node.id} className="ty-run-time__row" data-state={node.state} data-waiting={waiting ? '' : undefined}>
              <RunStatusMark status={WORD_OF[node.state]} labels={{ pending: l.waiting }} className="ty-run-time__state" />
              <span className="ty-run-time__name">{node.name}</span>
              <span className="ty-run-time__duration">{durationText}</span>
              <span
                className="ty-run-time__bar"
                role="img"
                aria-label={fill(l.bar, { node: node.name, duration: duration ?? durationText, percent }, locale)}
              >
                <span className="ty-run-time__fill" data-hatched={waiting ? '' : undefined} style={barStyle} />
              </span>
            </li>
          )
        })}
      </ul>
      {events?.length ? (
        <div className="ty-run-time__events">
          <h4 className="ty-run-time__events-title">{l.events}</h4>
          <ol className="ty-run-time__event-list">
            {events.map((event, i) => (
              <li key={i} className="ty-run-time__event">
                <time className="ty-run-time__event-time" dateTime={event.at}>
                  {formatRelative(event.at, locale)}
                </time>
                <span className="ty-run-time__event-text">{event.text}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
