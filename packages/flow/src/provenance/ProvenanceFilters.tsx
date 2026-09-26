// Filters of the provenance view. In the graph they are three chips (type,
// actor, proof), each opening its own popover; ProvenanceFilters keeps the
// single "Filters" popover and ProvenanceFilterFields the bare fields.

import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Button as AriaButton, Dialog, DialogTrigger, Popover as AriaPopover } from 'react-aria-components'
import { Button, Checkbox, CheckboxGroup, Popover, Switch, TextField } from '@fakhir/design-system'
import type { ReactNode } from 'react'
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

type ChipKey = 'kinds' | 'actors' | 'proof'

/** Type, actor and proof filters as three chips with popovers ("Type: all"). */
export function FilterChips({ value, onChange, labels: l, locale, kinds = PROV_KINDS, canShowActors = false }: ProvenanceFiltersProps) {
  const chosen = (n: number, all: string) => (n ? fill(l.filterChosen, { count: n }, locale) : all)
  const actorCount = value.actorKinds.length + (value.actorName.trim() ? 1 : 0) + (value.actorsAsNodes ? 1 : 0)
  const chips: Array<{ key: ChipKey; text: string; active: boolean; body: ReactNode }> = [
    {
      key: 'kinds',
      text: fill(l.filterKindChip, { value: chosen(value.kinds.length, l.filterAllKinds) }, locale),
      active: value.kinds.length > 0,
      body: (
        <CheckboxGroup label={l.filterKinds} value={value.kinds} onChange={(v) => onChange({ ...value, kinds: v as ProvKind[] })}>
          {kinds.map((k) => (
            <Checkbox key={k} value={k} label={l.kinds[k]} />
          ))}
        </CheckboxGroup>
      ),
    },
    {
      key: 'actors',
      text: fill(l.filterActorChip, { value: chosen(actorCount, l.filterAllActors) }, locale),
      active: actorCount > 0,
      body: (
        <>
          <CheckboxGroup label={l.filterActors} value={value.actorKinds} onChange={(v) => onChange({ ...value, actorKinds: v as ProvActorKind[] })}>
            {ACTOR_KINDS.map((k) => (
              <Checkbox key={k} value={k} label={l.actorKinds[k]} />
            ))}
          </CheckboxGroup>
          <TextField label={l.filterActorName} value={value.actorName} onChange={(t) => onChange({ ...value, actorName: t })} />
          {canShowActors ? <Switch label={l.actorsAsNodes} isSelected={value.actorsAsNodes} onChange={(on) => onChange({ ...value, actorsAsNodes: on })} /> : null}
        </>
      ),
    },
    {
      key: 'proof',
      text: fill(l.filterProofChip, { value: chosen(value.proofStates.length, l.filterAllProof) }, locale),
      active: value.proofStates.length > 0,
      body: (
        <CheckboxGroup label={l.filterProof} value={value.proofStates} onChange={(v) => onChange({ ...value, proofStates: v as ProofKey[] })}>
          {PROOF_KEYS.map((k) => (
            <Checkbox key={k} value={k} label={l.proof[k]} />
          ))}
        </CheckboxGroup>
      ),
    },
  ]
  return (
    <>
      {chips.map((c) => (
        <DialogTrigger key={c.key}>
          <AriaButton className="fk-prov-chip" data-active={c.active ? 'true' : undefined}>
            {c.text}
            <ChevronDown className="fk-prov-chip__chevron" aria-hidden="true" />
          </AriaButton>
          <AriaPopover className="fk-prov-chip-pop" placement="bottom start" offset={6}>
            <Dialog className="fk-prov-chip-pop__dialog" aria-label={c.text}>
              <div className="fk-prov-filters">{c.body}</div>
            </Dialog>
          </AriaPopover>
        </DialogTrigger>
      ))}
    </>
  )
}
