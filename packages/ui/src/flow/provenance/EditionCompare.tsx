// EditionCompare ("Comparar edições"): what changed between two frozen
// editions, item by item. Each change carries an icon, a word and a line
// style, so the kind of change never rests on colour.

import { useMemo, useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '../../index'
import { ActorMark } from './ProvenanceNode'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import type { EditionChange, EditionComparison } from './proofTypes'

export type EditionFilter = 'all' | EditionChange

export interface EditionCompareLabels {
  title: string
  summary: string
  filter: string
  all: string
  item: string
  valueIn: string
  change: string
  who: string
  notPresent: string
  unknownActor: string
  noRows: string
  selected: string
  before: string
  after: string
  pickRow: string
  changes: Record<EditionChange, string>
  counts: Record<EditionChange, string>
  /** Words under the big numbers ("values altered"). */
  stats: Record<EditionChange | 'hashes', string>
  valueHead: string
  openInGraph: string
  requestReview: string
}

export const editionCompareLabels = defineLabels<EditionCompareLabels>('EditionCompare', {
  en: {
    title: 'Compare editions',
    summary: '{a} compared with {b}',
    filter: 'Show',
    all: 'All',
    item: 'Item',
    valueIn: 'Value in {edition}',
    change: 'Change',
    who: 'Who',
    notPresent: 'not present',
    unknownActor: 'not recorded',
    noRows: 'No change of this kind between the two editions.',
    selected: 'Selected change',
    before: 'Before · {edition}',
    after: 'After · {edition}',
    pickRow: 'Choose a row to compare its values side by side.',
    stats: { altered: 'values altered', new: 'new records', removed: 'removed', hashes: 'divergent hashes' },
    valueHead: '{edition}',
    openInGraph: 'See in the graph',
    requestReview: 'Ask for a review',
    changes: { altered: 'altered', new: 'new', removed: 'removed' },
    counts: {
      altered: '{n, plural, =0 {nothing altered} one {# altered} other {# altered}}',
      new: '{n, plural, =0 {nothing new} one {# new} other {# new}}',
      removed: '{n, plural, =0 {nothing removed} one {# removed} other {# removed}}',
    },
  },
  'pt-BR': {
    title: 'Comparar edições',
    summary: '{a} comparada com {b}',
    filter: 'Mostrar',
    all: 'Todas',
    item: 'Item',
    valueIn: 'Valor em {edition}',
    change: 'Mudança',
    who: 'Quem',
    notPresent: 'não consta',
    unknownActor: 'não registrado',
    noRows: 'Nenhuma mudança deste tipo entre as duas edições.',
    selected: 'Mudança selecionada',
    before: 'Antes · {edition}',
    after: 'Depois · {edition}',
    pickRow: 'Escolha uma linha para comparar os valores lado a lado.',
    stats: { altered: 'valores alterados', new: 'registros novos', removed: 'removidos', hashes: 'hashes divergentes' },
    valueHead: '{edition}',
    openInGraph: 'Ver no grafo',
    requestReview: 'Pedir revisão',
    changes: { altered: 'alterado', new: 'novo', removed: 'removido' },
    counts: {
      altered: '{n, plural, =0 {nenhum alterado} one {# alterado} other {# alterados}}',
      new: '{n, plural, =0 {nenhum novo} one {# novo} other {# novos}}',
      removed: '{n, plural, =0 {nenhum removido} one {# removido} other {# removidos}}',
    },
  },
  es: {
    title: 'Comparar ediciones',
    summary: '{a} comparada con {b}',
    filter: 'Mostrar',
    all: 'Todos',
    item: 'Elemento',
    valueIn: 'Valor en {edition}',
    change: 'Cambio',
    who: 'Quién',
    notPresent: 'no consta',
    unknownActor: 'no registrado',
    noRows: 'No hay cambios de este tipo entre las dos ediciones.',
    selected: 'Cambio seleccionado',
    before: 'Antes · {edition}',
    after: 'Después · {edition}',
    pickRow: 'Elija una fila para comparar sus valores lado a lado.',
    stats: { altered: 'valores modificados', new: 'registros nuevos', removed: 'eliminados', hashes: 'hashes divergentes' },
    valueHead: '{edition}',
    openInGraph: 'Ver en el grafo',
    requestReview: 'Pedir revisión',
    changes: { altered: 'modificado', new: 'nuevo', removed: 'eliminado' },
    counts: {
      altered: '{n, plural, =0 {ninguno modificado} one {# modificado} other {# modificados}}',
      new: '{n, plural, =0 {ninguno nuevo} one {# nuevo} other {# nuevos}}',
      removed: '{n, plural, =0 {ninguno eliminado} one {# eliminado} other {# eliminados}}',
    },
  },
})

export const defaultEditionCompareLabels = editionCompareLabels.bundles.en

export interface EditionCompareProps {
  comparison: EditionComparison
  /** Controlled change filter. */
  filter?: EditionFilter
  defaultFilter?: EditionFilter
  onFilterChange?: (f: EditionFilter) => void
  selectedItemId?: string | null
  /** Row selected at first when the selection is not controlled. */
  defaultSelectedItemId?: string | null
  onSelectItem?: (itemId: string) => void
  /** "See in the graph" on the selected change. */
  onOpenInGraph?: (itemId: string) => void
  /** "Ask for a review" on the selected change. */
  onRequestReview?: (itemId: string) => void
  labels?: Partial<EditionCompareLabels>
  className?: string
}

const KINDS: EditionChange[] = ['altered', 'new', 'removed']

export function EditionCompare({ comparison, filter, defaultFilter = 'all', onFilterChange, selectedItemId, defaultSelectedItemId = null, onSelectItem, onOpenInGraph, onRequestReview, labels, className }: EditionCompareProps) {
  const [ownSelected, setOwnSelected] = useState<string | null>(defaultSelectedItemId)
  const selectedId = selectedItemId !== undefined ? selectedItemId : ownSelected
  const select = (id: string) => {
    setOwnSelected(id)
    onSelectItem?.(id)
  }
  const l = useLabels(editionCompareLabels, labels)
  const { locale } = useFlowLocale()
  const [shown, setShown] = useControllable<EditionFilter>(filter, defaultFilter, onFilterChange)
  const counts = useMemo(() => {
    const c: Record<EditionChange, number> = { altered: 0, new: 0, removed: 0 }
    for (const r of comparison.rows) c[r.change]++
    return c
  }, [comparison.rows])
  const rows = shown === 'all' ? comparison.rows : comparison.rows.filter((r) => r.change === shown)
  const { a, b } = comparison
  const current = selectedId ? (comparison.rows.find((r) => r.itemId === selectedId) ?? null) : null

  const value = (v: string | undefined) =>
    v === undefined ? (
      <span className="ty-diff__absent">{l.notPresent}</span>
    ) : (
      <code className="ty-diff__value" dir="ltr">
        {v}
      </code>
    )

  const swatch = (k: EditionChange) => (
    <span className="ty-diff__change" data-change={k}>
      <span className="ty-diff__swatch" aria-hidden="true" />
      <span>{l.changes[k]}</span>
    </span>
  )
  const num = (n: number) => new Intl.NumberFormat(locale).format(n)

  return (
    <section className={['ty-diff', className].filter(Boolean).join(' ')} aria-label={l.title}>
      <p className="ty-visually-hidden">{fill(l.summary, { a: a.label, b: b.label }, locale)}</p>
      <div className="ty-diff__stats" role="group" aria-label={l.filter}>
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            className="ty-diff__stat"
            data-change={k}
            aria-pressed={shown === k}
            aria-label={fill(l.counts[k], { n: counts[k] }, locale)}
            onClick={() => setShown(shown === k ? 'all' : k)}
          >
            <span className="ty-diff__stat-number" aria-hidden="true">
              {num(counts[k])}
            </span>
            <span className="ty-diff__stat-word" aria-hidden="true">
              {l.stats[k]}
            </span>
          </button>
        ))}
        {comparison.divergentHashes !== undefined ? (
          <div className="ty-diff__stat" data-static="true">
            <span className="ty-diff__stat-number">{typeof comparison.divergentHashes === 'number' ? num(comparison.divergentHashes) : comparison.divergentHashes}</span>
            <span className="ty-diff__stat-word">{l.stats.hashes}</span>
          </div>
        ) : null}
      </div>
      {rows.length ? (
        <div className="ty-diff__scroll" role="region" aria-label={fill(l.summary, { a: a.label, b: b.label }, locale)} tabIndex={0}>
          <table className="ty-diff__table">
            <thead>
              <tr>
                <th scope="col">{l.item}</th>
                <th scope="col">
                  <span className="ty-visually-hidden">{fill(l.valueIn, { edition: a.label }, locale)}</span>
                  <span aria-hidden="true">{a.label}</span>
                </th>
                <th scope="col">
                  <span className="ty-visually-hidden">{fill(l.valueIn, { edition: b.label }, locale)}</span>
                  <span aria-hidden="true">{b.label}</span>
                </th>
                <th scope="col">{l.change}</th>
                <th scope="col">{l.who}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.itemId} data-change={r.change} data-selected={selectedId === r.itemId || undefined} onClick={() => select(r.itemId)}>
                  <th scope="row" className="ty-diff__item">
                    <button
                      type="button"
                      className="ty-diff__pick"
                      aria-pressed={selectedId === r.itemId}
                      onClick={(e) => {
                        e.stopPropagation()
                        select(r.itemId)
                      }}
                    >
                      {r.label}
                    </button>
                  </th>
                  <td>{value(r.a)}</td>
                  <td>{value(r.b)}</td>
                  <td>{swatch(r.change)}</td>
                  <td>{r.who ? <ActorMark actor={r.who} /> : <span className="ty-diff__absent">{l.unknownActor}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="ty-diff__empty">{l.noRows}</p>
      )}
      <h3 className="ty-diff__eyebrow">{l.selected}</h3>
      <div className="ty-diff__cards" aria-label={l.selected} role="group" aria-live="polite">
        {current ? (
          (['a', 'b'] as const).map((side) => {
            const note = side === 'a' ? current.aNote : current.bNote
            return (
              <article key={side} className="ty-diff__card" data-side={side} data-change={current.change}>
                <p className="ty-diff__card-edition">{fill(side === 'a' ? l.before : l.after, { edition: side === 'a' ? a.label : b.label }, locale)}</p>
                <p className="ty-diff__card-value">
                  <span className="ty-diff__card-label">{current.label}</span> = {value(current[side])}
                </p>
                {note ? <p className="ty-diff__card-note">{note}</p> : null}
                {side === 'b' && (onOpenInGraph || onRequestReview) ? (
                  <div className="ty-diff__card-actions">
                    {onOpenInGraph ? (
                      <Button variant="secondary" leadingIcon={<Share2 />} onPress={() => onOpenInGraph(current.itemId)}>
                        {l.openInGraph}
                      </Button>
                    ) : null}
                    {onRequestReview ? (
                      <Button variant="quiet" onPress={() => onRequestReview(current.itemId)}>
                        {l.requestReview}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })
        ) : (
          <p className="ty-diff__empty">{l.pickRow}</p>
        )}
      </div>
    </section>
  )
}
