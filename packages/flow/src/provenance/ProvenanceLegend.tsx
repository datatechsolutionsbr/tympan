// Key to the graph's two visual codes, each spelled out in words: how a line
// is drawn tells the PROV relation, how a card's border is drawn tells the
// proof state (design direction §2.11, §3.13). It sits in the graph's tool
// row ('inline') or in a canvas corner ('panel').

import type { ReactNode } from 'react'
import { ProofBadge } from '@fakhir/design-system'
import type { ProvenanceLabels } from './labels'
import { PROOF_KEYS, PROV_RELATIONS, type ProofKey, type ProvRelation } from './model'

export interface ProvenanceLegendProps {
  labels: ProvenanceLabels
  /** Proof states to explain (for example only those present in the view). */
  states?: readonly ProofKey[]
  /** Relations to explain; all four by default. */
  relations?: readonly ProvRelation[]
  variant?: 'inline' | 'panel'
}

interface KeyGroup {
  heading: string
  entries: Array<{ id: string; sample: ReactNode; word: ReactNode }>
}

function relationSample(r: ProvRelation) {
  return (
    <svg className="fk-prov-legend__line" data-relation={r} viewBox="0 0 32 8" aria-hidden="true" focusable="false">
      <line x1="1" y1="4" x2="31" y2="4" />
    </svg>
  )
}

function proofSample(k: ProofKey) {
  return <span className="fk-prov-legend__swatch" data-proof-state={k.replace('_', '-')} aria-hidden="true" />
}

export function ProvenanceLegend({ labels: l, states = PROOF_KEYS, relations = PROV_RELATIONS, variant = 'panel' }: ProvenanceLegendProps) {
  const groups: KeyGroup[] = [
    {
      heading: l.relationLegend,
      entries: relations.map((r) => ({ id: r, sample: relationSample(r), word: <span className="fk-prov-legend__word">{l.relations[r]}</span> })),
    },
    {
      heading: l.legend,
      entries: states.map((k) => ({ id: k, sample: proofSample(k), word: <ProofBadge state={k === 'none' ? null : k} size="inline" label={l.proof[k]} /> })),
    },
  ]
  return (
    <section className="fk-prov-legend" data-variant={variant} aria-label={l.legend} data-fk-surface-chrome="">
      {groups.map((g) => (
        <div key={g.heading} className="fk-prov-legend__group">
          <h3 className="fk-prov-legend__title">{g.heading}</h3>
          <ul className="fk-prov-legend__list">
            {g.entries.map((e) => (
              <li key={e.id} className="fk-prov-legend__row">
                {e.sample}
                {e.word}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
