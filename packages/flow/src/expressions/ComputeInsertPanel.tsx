// Side panel of the compute form's text mode: three sources of fragments
// (operations by family, references, named examples). Each source is a
// descriptor that lists groups of pickable fragments; one renderer draws any
// source, and picking inserts the fragment at the caret.

import { useMemo, useState, type ReactNode } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { SegmentedControl, TextField } from '@datatechsolutions/tympan'
import { fill } from '../internal/labels'
import { EXPRESSION_FAMILIES, pickerEntries, prettyJson, seedOperation, type ExpressionCatalog, type OperationNode } from './model'

export interface InsertExample {
  id: string
  expression: OperationNode
}

export interface InsertPanelWords {
  referencePanel: string
  operations: string
  references: string
  examples: string
  searchOperations: string
  noOperations: string
  familyCount: string
  exampleNames: Record<string, string>
  familyNames?: Record<string, string>
}

type SourceId = 'operations' | 'references' | 'examples'

interface Pick {
  key: string
  face: ReactNode
  fragment: string
}

interface PickGroup {
  key: string
  title?: string
  picks: Pick[]
}

const asCode = (text: string) => (
  <code className="ty-compute__ref" dir="ltr">
    {text}
  </code>
)

interface SourceInput {
  catalog: ExpressionCatalog | undefined
  refs: readonly string[]
  examples: readonly InsertExample[]
  words: InsertPanelWords
  locale: string
  query: string
}

/** Each source turns the panel's inputs into titled groups of picks. */
const SOURCES: Record<SourceId, (i: SourceInput) => PickGroup[]> = {
  operations: ({ catalog, words, locale, query }) => {
    const needle = query.trim().toLocaleLowerCase(locale)
    const entries = pickerEntries(catalog, 'expression')
    const groups: PickGroup[] = []
    for (const family of EXPRESSION_FAMILIES) {
      const picks = entries
        .filter((e) => e.family === family && (needle === '' || e.id.toLocaleLowerCase(locale).includes(needle)))
        .map((e) => ({ key: e.id, face: asCode(e.id), fragment: JSON.stringify(seedOperation(e)) }))
      if (picks.length) groups.push({ key: family, title: fill(words.familyCount, { family: words.familyNames?.[family] ?? family, count: picks.length }, locale), picks })
    }
    return groups
  },
  references: ({ refs, words }) => [{ key: 'refs', title: words.references, picks: refs.map((r) => ({ key: r, face: asCode(r), fragment: JSON.stringify({ ref: r }) })) }],
  examples: ({ examples, words }) => [
    { key: 'examples', title: words.examples, picks: examples.map((x) => ({ key: x.id, face: words.exampleNames[x.id] ?? x.id, fragment: prettyJson(x.expression) })) },
  ],
}

export function ComputeInsertPanel(props: { catalog: ExpressionCatalog | undefined; refs: readonly string[]; examples: readonly InsertExample[]; words: InsertPanelWords; locale: string; onPick: (fragment: string) => void }) {
  const { words, onPick } = props
  const [source, setSource] = useState<SourceId>('operations')
  const [query, setQuery] = useState('')
  const groups = useMemo(() => SOURCES[source]({ ...props, query }), [source, props, query])
  const titledAsSection = source === 'operations'

  return (
    <div className="ty-expr-form__panel">
      <SegmentedControl
        label={words.referencePanel}
        size="compact"
        value={source}
        onChange={(v) => setSource(v as SourceId)}
        options={(Object.keys(SOURCES) as SourceId[]).map((id) => ({ value: id, label: words[id] }))}
      />
      {source === 'operations' ? <TextField mode="search" label={words.searchOperations} value={query} onChange={setQuery} /> : null}
      {source === 'operations' && groups.length === 0 ? (
        <p className="ty-expr__hint" role="status">
          {words.noOperations}
        </p>
      ) : null}
      {groups.map((group) => {
        const list = (
          <ul className="ty-expr-form__insert-list" {...(titledAsSection ? {} : { 'aria-label': group.title })}>
            {group.picks.map((pick) => (
              <li key={pick.key}>
                <AriaButton className="ty-expr-form__insert" onPress={() => onPick(pick.fragment)}>
                  {pick.face}
                </AriaButton>
              </li>
            ))}
          </ul>
        )
        return titledAsSection ? (
          <section key={group.key} className="ty-expr-form__family" aria-label={group.title}>
            <h4 className="ty-expr-form__family-title">{group.title}</h4>
            {list}
          </section>
        ) : (
          <div key={group.key}>{list}</div>
        )
      })}
    </div>
  )
}
