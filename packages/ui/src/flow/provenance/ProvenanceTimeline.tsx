// ProvenanceTimeline ("Linha do tempo"): the same provenance items laid out
// by who acted and when. One lane per actor; events sit on one shared time
// axis that runs in the reading direction. Each lane is a list of event
// buttons in time order; arrow keys move along a lane (Left/Right, mirrored
// in RTL) and between lanes (Up/Down).

import { useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { ProofPill, ActorMark } from './ProvenanceNode'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import type { ProvActor, ProvItem } from './model'

export interface ProvenanceTimelineLabels {
  title: string
  axis: string
  undated: string
  noItems: string
  agentWord: string
  systemWord: string
  personWord: string
  laneName: string
  event: string
  detail: string
  noSelection: string
  when: string
  kindWord: string
  proofWord: string
  ids: string
  kinds: Record<string, string>
  proof: Record<'proved' | 'pending' | 'refuted' | 'not_disclosed' | 'none', string>
}

const kindsEn = { query: 'query', retrieval: 'retrieval', source: 'source', assertion: 'assertion', record: 'record', verification: 'verification', analysis: 'analysis', edition: 'edition', manuscript: 'manuscript sentence' }

export const provenanceTimelineLabels = defineLabels<ProvenanceTimelineLabels>('ProvenanceTimeline', {
  en: {
    title: 'Timeline',
    axis: 'Time',
    undated: 'Without a date',
    noItems: 'Nothing to place on the timeline.',
    agentWord: 'agent',
    systemWord: 'system',
    personWord: 'person',
    laneName: '{name}, {kind}, {count, plural, one {# event} other {# events}}',
    event: '{kind}: {title}, {proof}, {time}',
    detail: 'Selected event',
    noSelection: 'Choose an event to see its details.',
    when: 'When',
    kindWord: 'Kind',
    proofWord: 'Proof',
    ids: 'Identifiers',
    kinds: kindsEn,
    proof: { proved: 'proved', pending: 'pending', refuted: 'refuted', not_disclosed: 'not disclosed', none: 'no proof' },
  },
  'pt-BR': {
    title: 'Linha do tempo',
    axis: 'Tempo',
    undated: 'Sem data',
    noItems: 'Nada para pôr na linha do tempo.',
    agentWord: 'agente',
    systemWord: 'sistema',
    personWord: 'pessoa',
    laneName: '{name}, {kind}, {count, plural, one {# evento} other {# eventos}}',
    event: '{kind}: {title}, {proof}, {time}',
    detail: 'Evento selecionado',
    noSelection: 'Escolha um evento para ver os detalhes.',
    when: 'Quando',
    kindWord: 'Tipo',
    proofWord: 'Prova',
    ids: 'Identificadores',
    kinds: { query: 'busca', retrieval: 'leitura', source: 'fonte', assertion: 'afirmação', record: 'registro', verification: 'verificação', analysis: 'análise', edition: 'edição', manuscript: 'frase do manuscrito' },
    proof: { proved: 'provada', pending: 'pendente', refuted: 'refutada', not_disclosed: 'não informada', none: 'sem prova' },
  },
  es: {
    title: 'Línea de tiempo',
    axis: 'Tiempo',
    undated: 'Sin fecha',
    noItems: 'No hay nada que poner en la línea de tiempo.',
    agentWord: 'agente',
    systemWord: 'sistema',
    personWord: 'persona',
    laneName: '{name}, {kind}, {count, plural, one {# evento} other {# eventos}}',
    event: '{kind}: {title}, {proof}, {time}',
    detail: 'Evento seleccionado',
    noSelection: 'Elija un evento para ver sus detalles.',
    when: 'Cuándo',
    kindWord: 'Tipo',
    proofWord: 'Prueba',
    ids: 'Identificadores',
    kinds: { query: 'búsqueda', retrieval: 'lectura', source: 'fuente', assertion: 'afirmación', record: 'registro', verification: 'verificación', analysis: 'análisis', edition: 'edición', manuscript: 'frase del manuscrito' },
    proof: { proved: 'probada', pending: 'pendiente', refuted: 'refutada', not_disclosed: 'no informada', none: 'sin prueba' },
  },
})

export const defaultProvenanceTimelineLabels = provenanceTimelineLabels.bundles.en

export interface ProvenanceTimelineProps {
  items: readonly ProvItem[]
  selectedId?: string | null
  defaultSelectedId?: string | null
  onSelect?: (id: string) => void
  labels?: Partial<ProvenanceTimelineLabels>
  /** Words for a time (axis ticks and the detail panel); Intl dates by default. */
  formatTime?: (time: number, use: 'tick' | 'detail') => string
  /** Actions under the selected event (for example "See the answer"). */
  renderDetailActions?: (item: ProvItem) => ReactNode
  className?: string
}

interface Lane {
  key: string
  actor: ProvActor | null
  dated: Array<{ item: ProvItem; time: number }>
  undated: ProvItem[]
}

const ROW_HEIGHT = 40
const MAX_TICKS = 8

function laneKey(a: ProvActor | undefined): string {
  return a ? `${a.kind}:${a.id ?? a.name}` : 'unattributed'
}

export function ProvenanceTimeline({ items, selectedId: selectedProp, defaultSelectedId = null, onSelect, labels, formatTime, renderDetailActions, className }: ProvenanceTimelineProps) {
  const l = useLabels(provenanceTimelineLabels, labels)
  const [selectedId, setSelected] = useControllable<string | null>(selectedProp, defaultSelectedId, (id) => {
    if (id) onSelect?.(id)
  })
  const { locale, rtl } = useFlowLocale()
  const rootRef = useRef<HTMLElement>(null)

  const { lanes, min, max } = useMemo(() => {
    const byKey = new Map<string, Lane>()
    let lo = Infinity
    let hi = -Infinity
    for (const item of items) {
      const key = laneKey(item.actor)
      if (!byKey.has(key)) byKey.set(key, { key, actor: item.actor ?? null, dated: [], undated: [] })
      const lane = byKey.get(key)!
      const t = item.at ? Date.parse(item.at) : NaN
      if (Number.isFinite(t)) {
        lane.dated.push({ item, time: t })
        lo = Math.min(lo, t)
        hi = Math.max(hi, t)
      } else lane.undated.push(item)
    }
    for (const lane of byKey.values()) lane.dated.sort((a, b) => a.time - b.time)
    // Lanes in order of their first act, undated-only lanes last.
    const ordered = [...byKey.values()].sort((a, b) => (a.dated[0]?.time ?? Infinity) - (b.dated[0]?.time ?? Infinity))
    return { lanes: ordered, min: lo, max: hi }
  }, [items])

  const span = Number.isFinite(min) && max > min ? max - min : 0
  // Events keep a margin at both ends of the axis so none hangs over the edge.
  const at = (t: number) => (span ? 6 + ((t - min) / span) * 76 : 40)
  /** Stack events that are close in time into rows so their labels never overlap. */
  const rowsOf = (dated: ReadonlyArray<{ item: ProvItem; time: number }>) => {
    const ends: number[] = []
    return dated.map(({ time }) => {
      const x = at(time)
      let row = ends.findIndex((end) => x - end >= 20)
      if (row < 0) row = ends.length
      ends[row] = x
      return row
    })
  }
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale])
  const timeFmt = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }), [locale])
  // Ticks where something happened (distinct dates), thinned to a few.
  const ticks = useMemo(() => {
    const all = [...new Set(lanes.flatMap((ln) => ln.dated.map((d) => d.time)))].sort((a, b) => a - b)
    // Keep ticks far enough apart that their words never touch.
    const kept: number[] = []
    for (const t of all) if (!kept.length || at(t) - at(kept[kept.length - 1]!) >= 11) kept.push(t)
    return kept.slice(0, MAX_TICKS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes, min, span])
  const tickWord = (t: number) => (formatTime ? formatTime(t, 'tick') : dateFmt.format(t))
  const detailWord = (t: number) => (formatTime ? formatTime(t, 'detail') : timeFmt.format(t))

  const selected = selectedId ? (items.find((i) => i.id === selectedId) ?? null) : null
  const kindWord = (k: string) => l.kinds[k] ?? k
  const actorWord = (a: ProvActor | null) => (!a ? l.systemWord : a.kind === 'agent' ? l.agentWord : a.kind === 'system' ? l.systemWord : l.personWord)

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.dataset.tyProvTimelineEvent === undefined) return
    const root = rootRef.current
    if (!root) return
    const lanesEls = [...root.querySelectorAll<HTMLElement>('[data-ty-prov-timeline-lane]')]
    const laneEl = target.closest<HTMLElement>('[data-ty-prov-timeline-lane]')
    const laneIdx = laneEl ? lanesEls.indexOf(laneEl) : -1
    const inLane = laneEl ? [...laneEl.querySelectorAll<HTMLElement>('[data-ty-prov-timeline-event]')] : []
    const idx = inLane.indexOf(target)
    const forwardKey = rtl ? 'ArrowLeft' : 'ArrowRight'
    const backKey = rtl ? 'ArrowRight' : 'ArrowLeft'
    let next: HTMLElement | undefined
    if (e.key === forwardKey) next = inLane[idx + 1]
    else if (e.key === backKey) next = inLane[idx - 1]
    else if (e.key === 'Home') next = inLane[0]
    else if (e.key === 'End') next = inLane[inLane.length - 1]
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const other = lanesEls[laneIdx + (e.key === 'ArrowDown' ? 1 : -1)]
      if (other) {
        // Nearest event in time on the other lane.
        const t = Number(target.dataset.tyTime ?? NaN)
        const candidates = [...other.querySelectorAll<HTMLElement>('[data-ty-prov-timeline-event]')]
        next = candidates.reduce<HTMLElement | undefined>((best, c) => {
          if (!best) return c
          const d = Math.abs(Number(c.dataset.tyTime ?? NaN) - t)
          const bd = Math.abs(Number(best.dataset.tyTime ?? NaN) - t)
          return Number.isFinite(d) && (!Number.isFinite(bd) || d < bd) ? c : best
        }, undefined)
      }
    } else return
    e.preventDefault()
    next?.focus()
  }

  const eventButton = (item: ProvItem, time: number | null, row = 0) => {
    const proofKey = item.proofState ?? 'none'
    const name = fill(l.event, { kind: kindWord(item.kind), title: item.title, proof: l.proof[proofKey], time: time === null ? l.undated : detailWord(time) }, locale)
    return (
      <li key={item.id} className="ty-prov-timeline__slot" data-row={row} style={time === null ? undefined : { insetInlineStart: `${at(time)}%`, insetBlockStart: `${8 + row * ROW_HEIGHT}px` }}>
        <button
          type="button"
          className="ty-prov-timeline__event"
          data-ty-prov-timeline-event=""
          data-ty-time={time ?? ''}
          data-selected={selectedId === item.id || undefined}
          aria-pressed={selectedId === item.id}
          aria-label={name}
          title={item.title}
          onClick={() => setSelected(item.id)}
        >
          <span className="ty-prov-timeline__dot" aria-hidden="true" />
          <span className="ty-prov-timeline__title" aria-hidden="true" dir="auto">
            {item.title}
          </span>
        </button>
      </li>
    )
  }

  if (!items.length) {
    return (
      <section className={['ty-prov-timeline', className].filter(Boolean).join(' ')} aria-label={l.title}>
        <p className="ty-prov-timeline__empty">{l.noItems}</p>
      </section>
    )
  }

  return (
    <section ref={rootRef} className={['ty-prov-timeline', className].filter(Boolean).join(' ')} aria-label={l.title} onKeyDown={onKeyDown}>
      <div className="ty-prov-timeline__lanes">
      {ticks.length ? (
        <div className="ty-prov-timeline__axis" aria-label={l.axis} role="group">
          <span className="ty-prov-timeline__axis-gutter" aria-hidden="true" />
          <ol className="ty-prov-timeline__ticks">
            {ticks.map((t, i) => (
              <li key={i} className="ty-prov-timeline__tick" style={{ insetInlineStart: `${at(t)}%` }}>
                <time dateTime={new Date(t).toISOString()}>{tickWord(t)}</time>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {lanes.map((lane) => {
        const headingId = `ty-prov-timeline-${lane.key.replace(/[^\w-]/g, '_')}`
        const rows = rowsOf(lane.dated)
        const rowCount = Math.max(1, ...rows.map((r) => r + 1))
        const count = lane.dated.length + lane.undated.length
        return (
          <div key={lane.key} className="ty-prov-timeline__lane" data-ty-prov-timeline-lane="" data-actor-kind={lane.actor?.kind ?? 'system'}>
            <h3 className="ty-prov-timeline__lane-head" id={headingId}>
              <span className="ty-visually-hidden">{fill(l.laneName, { name: lane.actor?.name ?? l.systemWord, kind: actorWord(lane.actor), count }, locale)}</span>
              <span aria-hidden="true" className="ty-prov-timeline__actor">
                <ActorMark actor={lane.actor ?? { kind: 'system', name: l.systemWord }} />
              </span>
            </h3>
            <ol className="ty-prov-timeline__track" aria-labelledby={headingId} style={{ minBlockSize: `${Math.max(112, 28 + rowCount * ROW_HEIGHT)}px` }}>
              {lane.dated.map(({ item, time }, i) => eventButton(item, time, rows[i]))}
            </ol>
            {lane.undated.length ? (
              <div className="ty-prov-timeline__undated">
                <p className="ty-prov-timeline__undated-title">{l.undated}</p>
                <ul className="ty-prov-timeline__undated-list">{lane.undated.map((item) => eventButton(item, null))}</ul>
              </div>
            ) : null}
          </div>
        )
      })}
      </div>
      <aside className="ty-prov-timeline__detail" aria-label={l.detail} aria-live="polite">
        <span className="ty-prov-timeline__eyebrow">{l.detail}</span>
        {selected ? (
          <>
            <h3 className="ty-prov-timeline__detail-title" dir="auto">
              {selected.title}
            </h3>
            {selected.actor ? <ActorMark actor={selected.actor} /> : null}
            <dl className="ty-prov-timeline__facts">
              <div>
                <dt>{l.when}</dt>
                <dd data-mono="true">{selected.at && Number.isFinite(Date.parse(selected.at)) ? <time dateTime={selected.at}>{detailWord(Date.parse(selected.at))}</time> : l.undated}</dd>
              </div>
              <div>
                <dt>{l.kindWord}</dt>
                <dd>{kindWord(selected.kind)}</dd>
              </div>
              <div>
                <dt>{l.proofWord}</dt>
                <dd>
                  <ProofPill state={selected.proofState ?? 'none'} word={l.proof[selected.proofState ?? 'none']} size="small" />
                </dd>
              </div>
              {(selected.meta ?? []).map((m, i) => (
                <div key={m}>
                  <dt>{i === 0 ? l.ids : ''}</dt>
                  <dd data-mono="true" dir="ltr">
                    <code>{m}</code>
                  </dd>
                </div>
              ))}
              {(selected.details ?? []).map((d) => (
                <div key={d.label}>
                  <dt>{d.label}</dt>
                  <dd data-mono={d.mono ? 'true' : undefined} dir={d.mono ? 'ltr' : 'auto'}>
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>
            {renderDetailActions ? <div className="ty-prov-timeline__actions">{renderDetailActions(selected)}</div> : null}
          </>
        ) : (
          <p className="ty-prov-timeline__detail-empty">{l.noSelection}</p>
        )}
      </aside>
    </section>
  )
}
