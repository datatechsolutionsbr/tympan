// Filters of the provenance view, as a popover opened from the query bar
// (design direction §3.13: "Filtros" is a popover, not an empty card).

import { SlidersHorizontal } from 'lucide-react'
import { Button, Checkbox, CheckboxGroup, Popover, Switch, TextField } from '@fakhir/design-system'
import { fill } from '../internal/labels'
import type { ProvenanceLabels } from './labels'
import { ACTOR_KINDS, activeFilterCount, EMPTY_FILTERS, PROOF_KEYS, PROV_KINDS, type ProofKey, type ProvActorKind, type ProvFilters, type ProvKind } from './model'

export interface ProvenanceFiltersProps {
  value: ProvFilters
  onChange: (next: ProvFilters) => void
  labels: ProvenanceLabels
  locale?: string
  /** Kinds offered (defaults to every PROV kind). */
  kinds?: readonly ProvKind[]
  /** Offer the "actors as nodes" switch (only when actors with ids exist). */
  canShowActors?: boolean
}

/** The filter fields without the popover (embeddable in a drawer). */
export function ProvenanceFilterFields({ value, onChange, labels: l, kinds = PROV_KINDS, canShowActors = false }: ProvenanceFiltersProps) {
  return (
    <div className="fk-prov-filters">
      <CheckboxGroup label={l.filterKinds} value={value.kinds} onChange={(v) => onChange({ ...value, kinds: v as ProvKind[] })} orientation="vertical">
        {kinds.map((k) => (
          <Checkbox key={k} value={k} label={l.kinds[k]} />
        ))}
      </CheckboxGroup>
      <CheckboxGroup label={l.filterProof} value={value.proofStates} onChange={(v) => onChange({ ...value, proofStates: v as ProofKey[] })}>
        {PROOF_KEYS.map((k) => (
          <Checkbox key={k} value={k} label={l.proof[k]} />
        ))}
      </CheckboxGroup>
      <CheckboxGroup label={l.filterActors} value={value.actorKinds} onChange={(v) => onChange({ ...value, actorKinds: v as ProvActorKind[] })}>
        {ACTOR_KINDS.map((k) => (
          <Checkbox key={k} value={k} label={l.actorKinds[k]} />
        ))}
      </CheckboxGroup>
      <TextField label={l.filterActorName} value={value.actorName} onChange={(t) => onChange({ ...value, actorName: t })} />
      {canShowActors ? <Switch label={l.actorsAsNodes} isSelected={value.actorsAsNodes} onChange={(on) => onChange({ ...value, actorsAsNodes: on })} /> : null}
      <Button variant="quiet" onPress={() => onChange({ ...EMPTY_FILTERS, kinds: [], actorKinds: [], proofStates: [] })} disabled={activeFilterCount(value) === 0} focusableWhenDisabled>
        {l.clearFilters}
      </Button>
    </div>
  )
}

export function ProvenanceFilters(props: ProvenanceFiltersProps) {
  const { value, labels: l, locale } = props
  const count = activeFilterCount(value)
  const trigger = count ? fill(l.filtersActive, { count }, locale) : l.filters
  return (
    <Popover
      title={l.filters}
      placement="bottom"
      align="end"
      trigger={
        <Button variant="secondary" leadingIcon={<SlidersHorizontal />} className="fk-prov-filters__trigger">
          {trigger}
        </Button>
      }
    >
      <ProvenanceFilterFields {...props} />
    </Popover>
  )
}
