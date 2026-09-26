// A provenance item (or an actor drawn as a node) on the canvas, composed from
// GraphNodeCard: kind icon and word, title, mono identifiers, ProofBadge and
// ActorChip (design direction §2.11, §3.13). The border line style follows the
// proof state, so the state never rests on colour.

import type { KeyboardEvent } from 'react'
import { ActorChip, ProofBadge } from '@fakhir/design-system'
import { resolveIcon, FALLBACK_KIND_ICONS } from '../catalog/icons'
import { kindTone } from '../catalog/palette'
import { formatDateTime } from '../internal/format'
import { fill } from '../internal/labels'
import { GraphNodeCard } from '../nodes/GraphNodeCard'
import type { ProvenanceLabels } from './labels'
import { proofKeyOf, type ProvActor, type ProvItem } from './model'

/** Canvas size a provenance card is laid out with before it is measured. */
export const PROV_CARD = Object.freeze({ width: 272, height: 136 })
export const ACTOR_CARD = Object.freeze({ width: 224, height: 92 })

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
  onActivate: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void
}

export function ProvenanceNode({ item, labels: l, locale, selected, dimmed, onActivate, onKeyDown }: ProvenanceNodeProps) {
  const proof = proofKeyOf(item)
  return (
    <GraphNodeCard
      className="fk-prov-node"
      kind={item.kind}
      kindLabel={l.kinds[item.kind]}
      title={item.title}
      description={l.kinds[item.kind]}
      icon={resolveIcon(FALLBACK_KIND_ICONS[item.kind])}
      tone={kindTone(item.kind)}
      width="standard"
      selected={!!selected}
      dimmed={!!dimmed}
      proofState={proof}
      accessibleName={itemAccessibleName(item, l, locale)}
      onActivate={onActivate}
      {...(onKeyDown ? { onKeyDown } : {})}
      meta={
        <div className="fk-prov-node__meta">
          {item.meta?.length ? (
            <span className="fk-prov-node__ids">
              {item.meta.slice(0, 2).map((m) => (
                <code key={m} className="fk-prov-node__id" title={m} dir="ltr">
                  {m}
                </code>
              ))}
            </span>
          ) : null}
          <span className="fk-prov-node__facts">
            <ProofBadge state={item.proofState ?? null} size="compact" label={l.proof[proof]} />
            {item.actor ? <ActorChip kind={item.actor.kind} name={item.actor.name} compact /> : null}
            {item.at ? (
              <time className="fk-prov-node__at" dateTime={item.at}>
                {formatDateTime(item.at, locale, { dateStyle: 'short' })}
              </time>
            ) : null}
          </span>
        </div>
      }
    />
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
      description={l.actorKinds[actor.kind]}
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
