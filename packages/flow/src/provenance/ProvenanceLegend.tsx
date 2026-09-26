// Legend of proof states, fixed in the canvas's bottom start corner (§3.13):
// for each state a swatch with the node's border line style and texture, the
// icon and the word. Textures appear only here and on the nodes (§2.11).

import { ProofBadge } from '@fakhir/design-system'
import type { ProvenanceLabels } from './labels'
import { PROOF_KEYS } from './model'

export interface ProvenanceLegendProps {
  labels: ProvenanceLabels
  /** Only list these states (for example the ones present in the view). */
  states?: readonly (typeof PROOF_KEYS)[number][]
}

export function ProvenanceLegend({ labels: l, states = PROOF_KEYS }: ProvenanceLegendProps) {
  return (
    <section className="fk-prov-legend" aria-label={l.legend} data-fk-surface-chrome="">
      <h3 className="fk-prov-legend__title">{l.legend}</h3>
      <ul className="fk-prov-legend__list">
        {states.map((k) => (
          <li key={k} className="fk-prov-legend__row">
            <span className="fk-prov-legend__swatch" data-proof-state={k.replace('_', '-')} aria-hidden="true" />
            <ProofBadge state={k === 'none' ? null : k} size="inline" label={l.proof[k]} />
          </li>
        ))}
      </ul>
    </section>
  )
}
