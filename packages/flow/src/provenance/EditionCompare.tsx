// EditionCompare ("Comparar edições"): what changed between two frozen
// editions, item by item. Each change carries an icon, a word and a line
// style, so the kind of change never rests on colour.

import { useMemo, useState } from 'react'
import { FilePlus2, FileMinus2, FilePen } from 'lucide-react'
import { ActorChip, SegmentedControl } from '@fakhir/design-system'
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
    before: 'Before, in {edition}',
    after: 'After, in {edition}',
    pickRow: 'Choose a row to compare its values side by side.',
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
    before: 'Antes, em {edition}',
    after: 'Depois, em {edition}',
    pickRow: 'Escolha uma linha para comparar os valores lado a lado.',
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
    before: 'Antes, en {edition}',
    after: 'Después, en {edition}',
    pickRow: 'Elija una fila para comparar sus valores lado a lado.',
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
  onSelectItem?: (itemId: string) => void
  labels?: Partial<EditionCompareLabels>
  className?: string
}

const CHANGE_ICON = { altered: FilePen, new: FilePlus2, removed: FileMinus2 } as const
const KINDS: EditionChange[] = ['altered', 'new', 'removed']

export function EditionCompare({ comparison, filter, defaultFilter = 'all', onFilterChange, selectedItemId, onSelectItem, labels, className }: EditionCompareProps) {
  const [ownSelected, setOwnSelected] = useState<string | null>(null)
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
      <span className="fk-diff__absent">{l.notPresent}</span>
    ) : (
      <code className="fk-diff__value" dir="ltr">
        {v}
      </code>
    )

  return (
    <section className={['fk-diff', className].filter(Boolean).join(' ')} aria-label={l.title}>
      <p className="fk-diff__summary">{fill(l.summary, { a: a.label, b: b.label }, locale)}</p>
      <ul className="fk-diff__counts">
        {KINDS.map((k) => {
          const Icon = CHANGE_ICON[k]
          return (
            <li key={k} className="fk-diff__count" data-change={k}>
              <Icon aria-hidden="true" focusable="false" />
              <span>{fill(l.counts[k], { n: counts[k] }, locale)}</span>
            </li>
          )
        })}
      </ul>
      <SegmentedControl
        label={l.filter}
        size="compact"
        value={shown}
        onChange={(v) => setShown(v as EditionFilter)}
        options={[{ value: 'all', label: l.all }, ...KINDS.map((k) => ({ value: k, label: l.changes[k] }))]}
      />
      {rows.length ? (
        <div className="fk-diff__scroll" role="region" aria-label={fill(l.summary, { a: a.label, b: b.label }, locale)} tabIndex={0}>
          <table className="fk-diff__table">
            <thead>
              <tr>
                <th scope="col">{l.item}</th>
                <th scope="col">{fill(l.valueIn, { edition: a.label }, locale)}</th>
                <th scope="col">{fill(l.valueIn, { edition: b.label }, locale)}</th>
                <th scope="col">{l.change}</th>
                <th scope="col">{l.who}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const Icon = CHANGE_ICON[r.change]
                return (
                  <tr key={r.itemId} data-change={r.change} data-selected={selectedId === r.itemId || undefined} onClick={() => select(r.itemId)}>
                    <th scope="row" className="fk-diff__item">
                      <button type="button" className="fk-diff__pick" aria-pressed={selectedId === r.itemId} onClick={(e) => {
                        e.stopPropagation()
                        select(r.itemId)
                      }}>
                        {r.label}
                      </button>
                      <code className="fk-diff__id" dir="ltr">
                        {r.itemId}
                      </code>
                    </th>
                    <td>{value(r.a)}</td>
                    <td>{value(r.b)}</td>
                    <td>
                      <span className="fk-diff__change" data-change={r.change}>
                        <Icon aria-hidden="true" focusable="false" />
                        <span>{l.changes[r.change]}</span>
                      </span>
                    </td>
                    <td>{r.who ? <ActorChip kind={r.who.kind} name={r.who.name} compact /> : <span className="fk-diff__absent">{l.unknownActor}</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="fk-diff__empty">{l.noRows}</p>
      )}
      <div className="fk-diff__cards" aria-label={l.selected} role="group" aria-live="polite">
        {current ? (
          (['a', 'b'] as const).map((side) => (
            <article key={side} className="fk-diff__card" data-side={side} data-change={current.change}>
              <p className="fk-diff__card-edition">{fill(side === 'a' ? l.before : l.after, { edition: side === 'a' ? a.label : b.label }, locale)}</p>
              <h3 className="fk-diff__card-label">{current.label}</h3>
              <p className="fk-diff__card-value">{value(current[side])}</p>
              <p className="fk-diff__change" data-change={current.change}>
                {(() => {
                  const Icon = CHANGE_ICON[current.change]
                  return <Icon aria-hidden="true" focusable="false" />
                })()}
                <span>{l.changes[current.change]}</span>
              </p>
              {current.who ? <ActorChip kind={current.who.kind} name={current.who.name} compact /> : null}
            </article>
          ))
        ) : (
          <p className="fk-diff__empty">{l.pickRow}</p>
        )}
      </div>
    </section>
  )
}
