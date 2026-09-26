// Evidence panel for the selected provenance item (design direction §3.7,
// §3.13): the proof block first, then who acted (ActorChip before the date,
// §2.11), identifiers in mono, details, and the relations in both directions
// as buttons that move the selection along the trail.

import { CircleCheck, CircleX, Hourglass, RefreshCw, ShieldQuestion } from 'lucide-react'
import { ActorChip, Button, ProofBadge } from '@fakhir/design-system'
import type { ObligationStatus, ProofObligation } from './proofTypes'
import { HashCheck } from './ProvenanceNode'
import { DockedPanel } from '../internal/DockedPanel'
import { formatDateTime } from '../internal/format'
import type { ProvenanceLabels } from './labels'
import { proofKeyOf, relationsOf, type ProvLink, type ProvView, type ProvVertex } from './model'

export interface ProvenanceInspectorProps {
  vertex: ProvVertex
  view: ProvView
  labels: ProvenanceLabels
  locale?: string
  onSelect: (id: string) => void
  onClose?: () => void
  returnFocusTo?: HTMLElement | null
  /** "Reread the source now" (retrievals and sources). */
  onReread?: (id: string) => void
  /** "Ask for verification". */
  onRequestVerification?: (id: string) => void
}

const OBLIGATION_ICON: Record<ObligationStatus, typeof CircleCheck> = { ok: CircleCheck, pending: Hourglass, failed: CircleX }

function Obligations({ list, l }: { list: ProofObligation[]; l: ProvenanceLabels }) {
  return (
    <ul className="fk-prov-obligations">
      {list.map((o) => {
        const Icon = OBLIGATION_ICON[o.status]
        return (
          <li key={o.id} className="fk-prov-obligation" data-status={o.status}>
            <span className="fk-prov-obligation__state">
              <Icon aria-hidden="true" focusable="false" />
              <span className="fk-prov-obligation__word">{l.obligationStatus[o.status]}</span>
            </span>
            <span className="fk-prov-obligation__label">{o.label}</span>
            {o.detail ? (
              <code className="fk-prov-obligation__detail" dir="ltr">
                {o.detail}
              </code>
            ) : null}
            {o.children?.length ? <Obligations list={o.children} l={l} /> : null}
          </li>
        )
      })}
    </ul>
  )
}

export function ProvenanceInspector({ vertex, view, labels: l, locale, onSelect, onClose, returnFocusTo, onReread, onRequestVerification }: ProvenanceInspectorProps) {
  const byId = new Map(view.vertices.map((v) => [v.id, v]))
  const { back, ahead } = relationsOf(vertex.id, view.links)
  const nameOf = (id: string) => {
    const v = byId.get(id)
    if (!v) return id
    return v.type === 'item' ? `${l.kinds[v.item.kind]}: ${v.item.title}` : `${l.actorKinds[v.actor.kind]}: ${v.actor.name}`
  }
  const list = (links: ProvLink[], way: 'back' | 'ahead', heading: string) => (
    <section className="fk-prov-inspector__relations" aria-labelledby={`fk-prov-rel-${way}-${vertex.id}`}>
      <h3 id={`fk-prov-rel-${way}-${vertex.id}`} className="fk-prov-inspector__heading">
        {heading}
      </h3>
      {links.length ? (
        <ul className="fk-prov-inspector__links">
          {links.map((link) => {
            const other = way === 'back' ? link.source : link.target
            const phrase = way === 'back' ? l.relations[link.relation] : l.relationsReversed[link.relation]
            return (
              <li key={link.id}>
                <button type="button" className="fk-prov-inspector__link" aria-label={`${phrase} ${nameOf(other)}`} onClick={() => onSelect(other)}>
                  <span className="fk-prov-inspector__relation">{phrase}</span>
                  <span className="fk-prov-inspector__target">{nameOf(other)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="fk-prov-inspector__none">{l.noRelations}</p>
      )}
    </section>
  )

  const title = vertex.type === 'item' ? vertex.item.title : vertex.actor.name
  return (
    <DockedPanel
      className="fk-prov-inspector"
      landmark="complementary"
      label={`${l.inspector}: ${title}`}
      title={title}
      edge="end"
      closeLabel={l.closeInspector}
      {...(onClose ? { onClose } : {})}
      {...(returnFocusTo !== undefined ? { returnFocusTo } : {})}
    >
      {vertex.type === 'item' ? (
        <div className="fk-prov-inspector__body">
          <p className="fk-prov-inspector__kind">{l.kinds[vertex.item.kind]}</p>
          <ProofBadge
            state={vertex.item.proofState ?? null}
            size="block"
            label={l.proof[proofKeyOf(vertex.item)]}
            {...(vertex.item.verifiedBy ? { provedBy: vertex.item.verifiedBy } : {})}
            {...(vertex.item.rule ? { rule: vertex.item.rule } : {})}
          />
          {vertex.item.proofReason ? (
            <p className="fk-prov-inspector__reason">
              <span className="fk-prov-inspector__label">{l.reason}</span> {vertex.item.proofReason}
            </p>
          ) : null}
          {vertex.item.hashCheck ? <HashCheck state={vertex.item.hashCheck} labels={l} /> : null}
          {vertex.item.evidence ? (
            <figure className="fk-prov-inspector__evidence">
              <figcaption className="fk-prov-inspector__heading">{l.evidence}</figcaption>
              <blockquote className="fk-prov-inspector__quote" dir="auto">
                {vertex.item.evidence}
              </blockquote>
            </figure>
          ) : null}
          {vertex.item.obligations?.length ? (
            <section className="fk-prov-inspector__section" aria-labelledby={`fk-prov-obl-${vertex.id}`}>
              <h3 id={`fk-prov-obl-${vertex.id}`} className="fk-prov-inspector__heading">
                {l.obligations}
              </h3>
              <Obligations list={vertex.item.obligations} l={l} />
            </section>
          ) : null}
          {vertex.item.actor || vertex.item.at ? (
            <p className="fk-prov-inspector__act">
              {vertex.item.actor ? (
                <ActorChip
                  kind={vertex.item.actor.kind}
                  name={vertex.item.actor.name}
                  {...(vertex.item.actor.email ? { email: vertex.item.actor.email } : {})}
                  {...(vertex.item.actor.agentKey ? { agentKey: vertex.item.actor.agentKey } : {})}
                  {...(vertex.item.actor.model ? { model: vertex.item.actor.model } : {})}
                />
              ) : null}
              {vertex.item.at ? (
                <time className="fk-prov-inspector__at" dateTime={vertex.item.at}>
                  {formatDateTime(vertex.item.at, locale)}
                </time>
              ) : null}
            </p>
          ) : null}
          {vertex.item.meta?.length ? (
            <ul className="fk-prov-inspector__ids">
              {vertex.item.meta.map((m) => (
                <li key={m}>
                  <code className="fk-prov-inspector__id">{m}</code>
                </li>
              ))}
            </ul>
          ) : null}
          {vertex.item.summary ? <p className="fk-prov-inspector__summary">{vertex.item.summary}</p> : null}
          {vertex.item.details?.length ? (
            <section aria-label={l.details}>
              <h3 className="fk-prov-inspector__heading">{l.details}</h3>
              <dl className="fk-prov-inspector__details">
                {vertex.item.details.map((d) => (
                  <div key={d.label} className="fk-prov-inspector__detail">
                    <dt>{d.label}</dt>
                    <dd>{d.mono ? <code dir="ltr">{d.value}</code> : d.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          {list(back, 'back', l.cameFrom)}
          {list(ahead, 'ahead', l.madeFrom)}
          {onReread || onRequestVerification ? (
            <div className="fk-prov-inspector__actions">
              {onReread && (vertex.item.kind === 'retrieval' || vertex.item.kind === 'source') ? (
                <Button variant="secondary" leadingIcon={<RefreshCw />} onPress={() => onReread(vertex.id)}>
                  {l.reread}
                </Button>
              ) : null}
              {onRequestVerification ? (
                <Button variant="secondary" leadingIcon={<ShieldQuestion />} onPress={() => onRequestVerification(vertex.id)}>
                  {l.requestVerification}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="fk-prov-inspector__body">
          <ActorChip kind={vertex.actor.kind} name={vertex.actor.name} {...(vertex.actor.agentKey ? { agentKey: vertex.actor.agentKey } : {})} {...(vertex.actor.model ? { model: vertex.actor.model } : {})} />
          {list(ahead, 'ahead', l.relationsReversed.wasAttributedTo)}
        </div>
      )}
    </DockedPanel>
  )
}
