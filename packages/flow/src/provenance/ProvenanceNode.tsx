// A provenance item (or an actor drawn as a node) on the canvas, composed from
// GraphNodeCard: kind icon and word, title, mono identifiers, ProofBadge and
// ActorChip (design direction §2.11, §3.13). The border line style follows the
// proof state, so the state never rests on colour.

import type { KeyboardEvent } from 'react'
import { ShieldCheck, ShieldQuestion, ShieldX } from 'lucide-react'
import { ActorChip, ProofBadge } from '@fakhir/design-system'
import { resolveIcon, FALLBACK_KIND_ICONS } from '../catalog/icons'
import { kindTone } from '../catalog/palette'
import { fill } from '../internal/labels'
import { GraphNodeCard } from '../nodes/GraphNodeCard'
import type { ProvenanceLabels } from './labels'
import { proofKeyOf, type ProvActor, type ProvItem } from './model'

/** Canvas size a provenance card is laid out with before it is measured. */
export const PROV_CARD = Object.freeze({ width: 236, height: 72 })
export const ACTOR_CARD = Object.freeze({ width: 200, height: 60 })

export function itemAccessibleName(item: ProvItem, l: ProvenanceLabels, locale?: string): string {
  const actor = item.actor ? `${l.actorKinds[item.actor.kind]} ${item.actor.name}` : ''
  return fill(l.nodeName, { kind: l.kinds[item.kind], title: item.title, proof: l.proof[proofKeyOf(item)], actor }, locale).replace(/,\s*$/, '')
}

export interface ProvenanceNodeProps {
  item: ProvItem
  labels: ProvenanceLabels
  locale?: string
  selected?: boolean
  dimmed?: boolean
  /** On the focus item's proof path (accent border). */
  onPath?: boolean
  /** The focus item itself (halo). */
  focused?: boolean
  onActivate: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void
}

export function ProvenanceNode({ item, labels: l, locale, selected, dimmed, onPath, focused, onActivate, onKeyDown }: ProvenanceNodeProps) {
  const proof = proofKeyOf(item)
  const words = [...(focused ? [l.focusWord] : []), ...(onPath && !focused ? [l.proofPath] : []), ...(item.hashCheck ? [l.hash[item.hashCheck]] : [])]
  return (
    <div className="fk-prov-node-frame" data-on-path={onPath ? 'true' : undefined} data-focus={focused ? 'true' : undefined}>
    <GraphNodeCard
      className="fk-prov-node"
      kind={item.kind}
      kindLabel={l.kinds[item.kind]}
      title={item.title}
      icon={resolveIcon(FALLBACK_KIND_ICONS[item.kind])}
      tone={kindTone(item.kind)}
      width="narrow"
      selected={!!selected}
      dimmed={!!dimmed}
      proofState={proof}
      accessibleName={itemAccessibleName(item, l, locale)}
      stateWords={words}
      labels={{ dimmed: l.offPath }}
      onActivate={onActivate}
      {...(onKeyDown ? { onKeyDown } : {})}
      meta={
        <div className="fk-prov-node__meta">
          {item.meta?.length ? (
            <span className="fk-prov-node__ids">
              {item.meta.slice(0, 1).map((m) => (
                <code key={m} className="fk-prov-node__id" title={m} dir="ltr">
                  {m}
                </code>
              ))}
            </span>
          ) : null}
          <span className="fk-prov-node__facts">
            <ProofBadge state={item.proofState ?? null} size="compact" label={l.proof[proof]} />
            {item.actor ? <ActorChip kind={item.actor.kind} name={item.actor.name} compact /> : null}
            {item.hashCheck ? <HashCheck state={item.hashCheck} labels={l} /> : null}
          </span>
        </div>
      }
    />
    </div>
  )
}

/** "hash matches" / "not reread" / "hash does not match": icon and word, never colour alone. */
export function HashCheck({ state, labels: l }: { state: NonNullable<ProvItem['hashCheck']>; labels: ProvenanceLabels }) {
  const Icon = state === 'match' ? ShieldCheck : state === 'mismatch' ? ShieldX : ShieldQuestion
  return (
    <span className="fk-prov-hash" data-state={state}>
      <Icon aria-hidden="true" focusable="false" />
      {l.hash[state]}
    </span>
  )
}

export interface ActorNodeProps {
  actor: ProvActor & { id: string }
  labels: ProvenanceLabels
  locale?: string
  selected?: boolean
  onActivate: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void
}

/** An actor as its own node (only when "show actors as nodes" is on). */
export function ActorNode({ actor, labels: l, locale, selected, onActivate, onKeyDown }: ActorNodeProps) {
  return (
    <GraphNodeCard
      className="fk-prov-node"
      kind="actor"
      kindLabel={l.actorKinds[actor.kind]}
      title={actor.name}
      tone="neutral"
      width="narrow"
      selected={!!selected}
      accessibleName={fill(l.actorNodeName, { kind: l.actorKinds[actor.kind], name: actor.name }, locale)}
      onActivate={onActivate}
      {...(onKeyDown ? { onKeyDown } : {})}
      meta={<ActorChip kind={actor.kind} name={actor.name} {...(actor.agentKey ? { agentKey: actor.agentKey } : {})} {...(actor.model ? { model: actor.model } : {})} />}
    />
  )
}
