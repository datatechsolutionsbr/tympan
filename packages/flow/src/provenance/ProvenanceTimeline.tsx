// ProvenanceTimeline ("Linha do tempo"): the same provenance items laid out
// by who acted and when. One lane per actor; events sit on one shared time
// axis that runs in the reading direction. Each lane is a list of event
// buttons in time order; arrow keys move along a lane (Left/Right, mirrored
// in RTL) and between lanes (Up/Down).

import { useMemo, useRef, type KeyboardEvent } from 'react'
import { Server } from 'lucide-react'
import { ActorChip, ProofBadge } from '@fakhir/design-system'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import type { ProvActor, ProvActorKind, ProvItem } from './model'

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
  className?: string
}

interface Lane {
  key: string
  actor: ProvActor | null
  dated: Array<{ item: ProvItem; time: number }>
  undated: ProvItem[]
}

const TICKS = 4

function laneKey(a: ProvActor | undefined): string {
  return a ? `${a.kind}:${a.id ?? a.name}` : 'unattributed'
}

function chipKind(k: ProvActorKind): 'person' | 'agent' | 'system' {
  return k
}

export function ProvenanceTimeline({ items, selectedId: selectedProp, defaultSelectedId = null, onSelect, labels, className }: ProvenanceTimelineProps) {
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
  const at = (t: number) => (span ? ((t - min) / span) * 100 : 50)
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale])
  const timeFmt = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }), [locale])
  const ticks = Number.isFinite(min) ? Array.from({ length: span ? TICKS + 1 : 1 }, (_, i) => (span ? min + (span * i) / TICKS : min)) : []

  const selected = selectedId ? (items.find((i) => i.id === selectedId) ?? null) : null
  const kindWord = (k: string) => l.kinds[k] ?? k
  const actorWord = (a: ProvActor | null) => (!a ? l.systemWord : a.kind === 'agent' ? l.agentWord : a.kind === 'system' ? l.systemWord : l.personWord)

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.dataset.fkProvTimelineEvent === undefined) return
    const root = rootRef.current
    if (!root) return
    const lanesEls = [...root.querySelectorAll<HTMLElement>('[data-fk-prov-timeline-lane]')]
    const laneEl = target.closest<HTMLElement>('[data-fk-prov-timeline-lane]')
    const laneIdx = laneEl ? lanesEls.indexOf(laneEl) : -1
    const inLane = laneEl ? [...laneEl.querySelectorAll<HTMLElement>('[data-fk-prov-timeline-event]')] : []
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
        const t = Number(target.dataset.fkTime ?? NaN)
        const candidates = [...other.querySelectorAll<HTMLElement>('[data-fk-prov-timeline-event]')]
        next = candidates.reduce<HTMLElement | undefined>((best, c) => {
          if (!best) return c
          const d = Math.abs(Number(c.dataset.fkTime ?? NaN) - t)
          const bd = Math.abs(Number(best.dataset.fkTime ?? NaN) - t)
          return Number.isFinite(d) && (!Number.isFinite(bd) || d < bd) ? c : best
        }, undefined)
      }
    } else return
    e.preventDefault()
    next?.focus()
  }

  const eventButton = (item: ProvItem, time: number | null) => {
    const proofKey = item.proofState ?? 'none'
    const name = fill(l.event, { kind: kindWord(item.kind), title: item.title, proof: l.proof[proofKey], time: time === null ? l.undated : timeFmt.format(time) }, locale)
    return (
      <li key={item.id} className="fk-prov-timeline__slot" style={time === null ? undefined : { insetInlineStart: `${at(time)}%` }}>
        <button
          type="button"
          className="fk-prov-timeline__event"
          data-fk-prov-timeline-event=""
          data-fk-time={time ?? ''}
          data-selected={selectedId === item.id || undefined}
          aria-pressed={selectedId === item.id}
          aria-label={name}
          title={item.title}
          onClick={() => setSelected(item.id)}
        >
          <span className="fk-prov-timeline__kind" aria-hidden="true">
            {kindWord(item.kind)}
          </span>
          <span className="fk-prov-timeline__title" aria-hidden="true">
            {item.title}
          </span>
          <span aria-hidden="true">
            <ProofBadge state={item.proofState ?? null} size="compact" label={l.proof[proofKey]} />
          </span>
        </button>
      </li>
    )
  }

  if (!items.length) {
    return (
      <section className={['fk-prov-timeline', className].filter(Boolean).join(' ')} aria-label={l.title}>
        <p className="fk-prov-timeline__empty">{l.noItems}</p>
      </section>
    )
  }

  return (
    <section ref={rootRef} className={['fk-prov-timeline', className].filter(Boolean).join(' ')} aria-label={l.title} onKeyDown={onKeyDown}>
      <div className="fk-prov-timeline__lanes">
      {ticks.length ? (
        <div className="fk-prov-timeline__axis" aria-label={l.axis} role="group">
          <span className="fk-prov-timeline__axis-gutter" aria-hidden="true" />
          <ol className="fk-prov-timeline__ticks">
            {ticks.map((t, i) => (
              <li key={i} className="fk-prov-timeline__tick" style={{ insetInlineStart: `${at(t)}%` }}>
                <time dateTime={new Date(t).toISOString()}>{dateFmt.format(t)}</time>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {lanes.map((lane) => {
        const headingId = `fk-prov-timeline-${lane.key.replace(/[^\w-]/g, '_')}`
        const count = lane.dated.length + lane.undated.length
        return (
          <div key={lane.key} className="fk-prov-timeline__lane" data-fk-prov-timeline-lane="" data-actor-kind={lane.actor?.kind ?? 'system'}>
            <h3 className="fk-prov-timeline__lane-head" id={headingId}>
              <span className="fk-visually-hidden">{fill(l.laneName, { name: lane.actor?.name ?? l.systemWord, kind: actorWord(lane.actor), count }, locale)}</span>
              <span aria-hidden="true" className="fk-prov-timeline__actor">
                {lane.actor && lane.actor.kind !== 'system' ? (
                  <ActorChip kind={chipKind(lane.actor.kind)} name={lane.actor.name} compact />
                ) : (
                  <span className="fk-prov-timeline__system">
                    <Server focusable="false" />
                    <span>{l.systemWord}</span>
                    {lane.actor ? <code dir="ltr">{lane.actor.name}</code> : null}
                  </span>
                )}
              </span>
            </h3>
            <ol className="fk-prov-timeline__track" aria-labelledby={headingId}>
              {lane.dated.map(({ item, time }) => eventButton(item, time))}
            </ol>
            {lane.undated.length ? (
              <div className="fk-prov-timeline__undated">
                <p className="fk-prov-timeline__undated-title">{l.undated}</p>
                <ul className="fk-prov-timeline__undated-list">{lane.undated.map((item) => eventButton(item, null))}</ul>
              </div>
            ) : null}
          </div>
        )
      })}
      </div>
      <aside className="fk-prov-timeline__detail" aria-label={l.detail} aria-live="polite">
        {selected ? (
          <>
            <p className="fk-prov-timeline__detail-kind">{kindWord(selected.kind)}</p>
            <h3 className="fk-prov-timeline__detail-title">{selected.title}</h3>
            <ProofBadge state={selected.proofState ?? null} size="inline" label={l.proof[selected.proofState ?? 'none']} />
            <dl className="fk-prov-timeline__detail-facts">
              {selected.actor ? (
                <div>
                  <dt className="fk-visually-hidden">{actorWord(selected.actor)}</dt>
                  <dd>
                    <ActorChip kind={chipKind(selected.actor.kind)} name={selected.actor.name} compact />
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>{l.when}</dt>
                <dd>{selected.at && Number.isFinite(Date.parse(selected.at)) ? <time dateTime={selected.at}>{timeFmt.format(Date.parse(selected.at))}</time> : l.undated}</dd>
              </div>
            </dl>
            {selected.meta?.length ? (
              <ul className="fk-prov-timeline__detail-meta">
                {selected.meta.map((m) => (
                  <li key={m}>
                    <code dir="ltr">{m}</code>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="fk-prov-timeline__detail-empty">{l.noSelection}</p>
        )}
      </aside>
    </section>
  )
}
