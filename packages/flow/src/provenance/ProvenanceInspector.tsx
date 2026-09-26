// Evidence panel for the selected provenance item. Reading order: what it is
// and whether it is proved, the quoted evidence, the obligations the proof
// needs, the facts (who, when, values), the actions, then the relations in
// both directions as buttons that move the selection along the trail.

import { CircleCheck, CircleX, FileText, Hourglass, ShieldQuestion, X } from 'lucide-react'
import { Button } from '@fakhir/ui'
import type { ObligationStatus, ProofObligation } from './proofTypes'
import { ActorMark, HashCheck, ProofPill } from './ProvenanceNode'
import { fill } from '../internal/labels'
import { formatDateTime } from '../internal/format'
import type { ProvenanceLabels } from './labels'
import { proofKeyOf, relationsOf, type ProvLink, type ProvView, type ProvVertex } from './model'

export interface ProvenanceInspectorProps {
  vertex: ProvVertex
  view: ProvView
  labels: ProvenanceLabels
  locale?: string
  onSelect: (id: string) => void
  /** Shows a close button (the panel is a sheet on narrow screens). */
  onClose?: () => void
  /** "Reread the source now" (retrievals and sources). */
  onReread?: (id: string) => void
  /** "Ask for verification". */
  onRequestVerification?: (id: string) => void
  /** Words for the item's time (for example a placeholder while dates are not known). */
  formatTime?: (time: number, use: 'tick' | 'detail') => string
  className?: string
}

const OBLIGATION_ICON: Record<ObligationStatus, typeof CircleCheck> = { ok: CircleCheck, pending: Hourglass, failed: CircleX }

function Obligations({ list, l }: { list: ProofObligation[]; l: ProvenanceLabels }) {
  return (
    <ul className="fk-prov-obligations">
      {list.map((o) => {
        const Icon = OBLIGATION_ICON[o.status]
        return (
          <li key={o.id} className="fk-prov-obligation" data-status={o.status}>
            <Icon className="fk-prov-obligation__icon" aria-hidden="true" focusable="false" />
            <span className="fk-prov-obligation__text">
              <span className="fk-prov-obligation__label">{o.label}</span>
              <span className="fk-visually-hidden">
                , <span>{l.obligationStatus[o.status]}</span>
              </span>
              {o.detail ? (
                <code className="fk-prov-obligation__detail" dir="ltr">
                  {o.detail}
                </code>
              ) : null}
            </span>
            {o.children?.length ? <Obligations list={o.children} l={l} /> : null}
          </li>
        )
      })}
    </ul>
  )
}

const capital = (s: string, locale?: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1)

export function ProvenanceInspector({ vertex, view, labels: l, locale, onSelect, onClose, onReread, onRequestVerification, formatTime, className }: ProvenanceInspectorProps) {
  const byId = new Map(view.vertices.map((v) => [v.id, v]))
  const { back, ahead } = relationsOf(vertex.id, view.links)
  const nameOf = (id: string) => {
    const v = byId.get(id)
    if (!v) return id
    return v.type === 'item' ? `${l.kinds[v.item.kind]}: ${v.item.title}` : `${l.actorKinds[v.actor.kind]}: ${v.actor.name}`
  }
  const relations = (links: ProvLink[], way: 'back' | 'ahead', heading: string) =>
    links.length ? (
      <section className="fk-prov-inspector__relations" aria-labelledby={`fk-prov-rel-${way}-${vertex.id}`}>
        <h3 id={`fk-prov-rel-${way}-${vertex.id}`} className="fk-prov-inspector__eyebrow">
          {heading}
        </h3>
        <ul className="fk-prov-inspector__links">
          {links.map((link) => {
            const other = way === 'back' ? link.source : link.target
            const phrase = way === 'back' ? l.relations[link.relation] : l.relationsReversed[link.relation]
            return (
              <li key={link.id}>
                <button type="button" className="fk-prov-inspector__link" aria-label={`${phrase} ${nameOf(other)}`} onClick={() => onSelect(other)}>
                  <span className="fk-prov-inspector__relation">{phrase}</span>
                  <span className="fk-prov-inspector__target" dir="auto">
                    {nameOf(other)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    ) : null

  const title = vertex.type === 'item' ? vertex.item.title : vertex.actor.name
  const eyebrow = vertex.type === 'item' ? fill(l.inFocus, { kind: capital(l.kinds[vertex.item.kind], locale) }, locale) : capital(l.actorKinds[vertex.actor.kind], locale)
  const close = onClose ? (
    <Button className="fk-prov-inspector__close" variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={l.closeInspector} leadingIcon={<X />} onPress={onClose} />
  ) : null

  if (vertex.type !== 'item') {
    return (
      <aside className={['fk-prov-inspector', className].filter(Boolean).join(' ')} aria-label={`${l.inspector}: ${title}`}>
        <div className="fk-prov-inspector__top">
          <span className="fk-prov-inspector__eyebrow">{eyebrow}</span>
          {close}
        </div>
        <h2 className="fk-prov-inspector__title">{title}</h2>
        <ActorMark actor={vertex.actor} />
        {relations(ahead, 'ahead', l.relationsReversed.wasAttributedTo)}
      </aside>
    )
  }

  const item = vertex.item
  const proof = proofKeyOf(item)
  const note = item.proofReason ?? (item.proofState ? null : l.noCertificateYet)
  // A reading, a source, or a claim resting on quoted evidence can be reread.
  const canReread = !!onReread && (item.kind === 'retrieval' || item.kind === 'source' || (item.kind === 'assertion' && !!item.evidence))
  return (
    <aside className={['fk-prov-inspector', className].filter(Boolean).join(' ')} aria-label={`${l.inspector}: ${title}`}>
      <div className="fk-prov-inspector__top">
        <span className="fk-prov-inspector__eyebrow">{eyebrow}</span>
        {close}
      </div>
      <h2 className="fk-prov-inspector__title" dir="auto">
        {title}
      </h2>
      <div className="fk-prov-inspector__proof">
        <ProofPill state={proof} word={l.proof[proof]} />
        {note ? (
          <span className="fk-prov-inspector__note">
            {item.proofReason ? <span className="fk-visually-hidden">{l.reason}: </span> : null}
            {note}
          </span>
        ) : null}
        {item.hashCheck ? <HashCheck state={item.hashCheck} labels={l} /> : null}
      </div>
      {item.evidence ? (
        <figure className="fk-prov-inspector__evidence">
          <figcaption className="fk-visually-hidden">{l.evidence}</figcaption>
          <blockquote className="fk-prov-inspector__quote" dir="auto">
            {item.evidence}
          </blockquote>
        </figure>
      ) : null}
      {item.obligations?.length ? (
        <section className="fk-prov-inspector__section" aria-labelledby={`fk-prov-obl-${vertex.id}`}>
          <h3 id={`fk-prov-obl-${vertex.id}`} className="fk-prov-inspector__eyebrow">
            {l.obligations}
          </h3>
          <Obligations list={item.obligations} l={l} />
        </section>
      ) : null}
      {item.summary ? <p className="fk-prov-inspector__summary">{item.summary}</p> : null}
      <dl className="fk-prov-inspector__facts">
        {(item.details ?? []).map((d) => (
          <div key={d.label} className="fk-prov-inspector__fact">
            <dt>{d.label}</dt>
            <dd data-mono={d.mono ? 'true' : undefined} dir={d.mono ? 'ltr' : 'auto'}>
              {d.value}
            </dd>
          </div>
        ))}
        {item.actor && !item.details?.length ? (
          <div className="fk-prov-inspector__fact">
            <dt>{l.attributedTo}</dt>
            <dd>
              <ActorMark actor={item.actor} />
            </dd>
          </div>
        ) : null}
        {item.at ? (
          <div className="fk-prov-inspector__fact">
            <dt>{l.when}</dt>
            <dd data-mono="true">
              <time dateTime={item.at}>{formatTime && Number.isFinite(Date.parse(item.at)) ? formatTime(Date.parse(item.at), 'detail') : formatDateTime(item.at, locale)}</time>
            </dd>
          </div>
        ) : null}
      </dl>
      {canReread || onRequestVerification ? (
        <div className="fk-prov-inspector__actions">
          {canReread ? (
            <Button variant="secondary" leadingIcon={<FileText />} onPress={() => onReread!(vertex.id)}>
              {l.reread}
            </Button>
          ) : null}
          {onRequestVerification ? (
            <Button variant="quiet" leadingIcon={<ShieldQuestion />} onPress={() => onRequestVerification(vertex.id)}>
              {l.requestVerification}
            </Button>
          ) : null}
        </div>
      ) : null}
      {relations(back, 'back', l.cameFrom)}
      {relations(ahead, 'ahead', l.madeFrom)}
    </aside>
  )
}
