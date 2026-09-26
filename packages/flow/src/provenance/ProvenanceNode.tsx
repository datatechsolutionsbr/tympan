// A provenance item (or an actor drawn as a node) on the canvas: one
// 236×72 card with three lines, the kind glyph and title, the mono
// identifier, then who acted and the check that matters for this item
// (the hash state of a reading, or the proof word of a claim). Proof and
// hash states always carry a word and an icon, never colour alone.

import { useId, type KeyboardEvent, type ReactNode } from 'react'
import { Bot, CircleCheck, CircleDashed, CircleMinus, CircleX, Hourglass, Server, ShieldCheck, ShieldQuestion, ShieldX, User } from 'lucide-react'
import { Button as AriaButton } from 'react-aria-components'
import { resolveIcon, FALLBACK_KIND_ICONS } from '../catalog/icons'
import { fill } from '../internal/labels'
import { useSurface } from '../surface/SurfaceContext'
import type { ProvenanceLabels } from './labels'
import { proofKeyOf, type ProofKey, type ProvActor, type ProvActorKind, type ProvItem } from './model'

/** Canvas size a provenance card is laid out with before it is measured. */
export const PROV_CARD = Object.freeze({ width: 236, height: 72 })
export const ACTOR_CARD = Object.freeze({ width: 200, height: 60 })

export function itemAccessibleName(item: ProvItem, l: ProvenanceLabels, locale?: string): string {
  const actor = item.actor ? `${l.actorKinds[item.actor.kind]} ${item.actor.name}` : ''
  return fill(l.nodeName, { kind: l.kinds[item.kind], title: item.title, proof: l.proof[proofKeyOf(item)], actor }, locale).replace(/,\s*$/, '')
}

/** Items whose proof word is worth a pill (claims, or any item with an explicit state). */
export function showsProof(item: ProvItem): boolean {
  return item.kind === 'assertion' || (item.proofState !== null && item.proofState !== undefined)
}

const ACTOR_GLYPH: Record<ProvActorKind, typeof Bot> = { agent: Bot, person: User, system: Server }

/** Who acted: a small glyph box (dashed for agents, round for people, square for systems) and the name. */
export function ActorMark({ actor, className }: { actor: Pick<ProvActor, 'kind' | 'name'>; className?: string }) {
  const Glyph = ACTOR_GLYPH[actor.kind]
  return (
    <span className={['ty-prov-actor', className].filter(Boolean).join(' ')} data-kind={actor.kind}>
      <span className="ty-prov-actor__glyph" aria-hidden="true">
        <Glyph focusable="false" />
      </span>
      <span className="ty-prov-actor__name" dir="auto">
        {actor.name}
      </span>
    </span>
  )
}

const PROOF_GLYPH: Record<ProofKey, typeof CircleCheck> = { proved: CircleCheck, pending: Hourglass, refuted: CircleX, not_disclosed: CircleDashed, none: CircleMinus }

/** The proof state as a pill: word and glyph, with a border style per state. */
export function ProofPill({ state, word, size = 'regular' }: { state: ProofKey; word: string; size?: 'regular' | 'small' }) {
  const Glyph = PROOF_GLYPH[state]
  return (
    <span className="ty-prov-proof" data-proof={state} data-size={size}>
      <Glyph aria-hidden="true" focusable="false" />
      {word}
    </span>
  )
}

/** "hash matches" / "not reread" / "hash does not match": icon and word, never colour alone. */
export function HashCheck({ state, labels: l }: { state: NonNullable<ProvItem['hashCheck']>; labels: ProvenanceLabels }) {
  const Icon = state === 'match' ? ShieldCheck : state === 'mismatch' ? ShieldX : ShieldQuestion
  return (
    <span className="ty-prov-hash" data-state={state}>
      <Icon aria-hidden="true" focusable="false" />
      {l.hash[state]}
    </span>
  )
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

/** Card chrome shared by items and actors: a full-size activator under three lines of text. */
function CardShell({ name, words, onActivate, onKeyDown, attrs, children }: { name: string; words: string[]; onActivate: () => void; onKeyDown?: ((e: KeyboardEvent<HTMLElement>) => void) | undefined; attrs: Record<string, string | undefined>; children: ReactNode }) {
  const surface = useSurface()
  const describedBy = useId()
  return (
    <div className="ty-prov-card" {...attrs}>
      <AriaButton
        className="ty-prov-card__hit"
        data-ty-node-focus=""
        aria-label={name}
        {...(words.length ? { 'aria-describedby': describedBy } : {})}
        onPress={() => {
          if (surface.justDragged()) return
          onActivate()
        }}
        onKeyDown={(e) => onKeyDown?.(e)}
      />
      {children}
      {words.length ? (
        <span id={describedBy} className="ty-visually-hidden">
          {words.join(', ')}
        </span>
      ) : null}
    </div>
  )
}

export function ProvenanceNode({ item, labels: l, locale, selected, dimmed, onPath, focused, onActivate, onKeyDown }: ProvenanceNodeProps) {
  const proof = proofKeyOf(item)
  const Icon = resolveIcon(FALLBACK_KIND_ICONS[item.kind])
  const words = [...(focused ? [l.focusWord] : []), ...(onPath && !focused ? [l.proofPath] : []), ...(dimmed ? [l.offPath] : []), ...(item.hashCheck ? [l.hash[item.hashCheck]] : [])]
  return (
    <CardShell
      name={itemAccessibleName(item, l, locale)}
      words={words}
      onActivate={onActivate}
      onKeyDown={onKeyDown}
      attrs={{ 'data-kind': item.kind, 'data-on-path': onPath ? 'true' : undefined, 'data-focus': focused ? 'true' : undefined, 'data-selected': selected ? 'true' : undefined, 'data-dimmed': dimmed ? 'true' : undefined }}
    >
      <span className="ty-prov-card__head" aria-hidden="true">
        <Icon className="ty-prov-card__icon" focusable="false" />
        <span className="ty-prov-card__title" dir="auto" title={item.title}>
          {item.title}
        </span>
      </span>
      <code className="ty-prov-card__id" dir="ltr" title={item.meta?.[0]} aria-hidden="true">
        {item.meta?.[0] ?? ''}
      </code>
      <span className="ty-prov-card__foot" aria-hidden="true">
        {item.actor ? <ActorMark actor={item.actor} /> : <span />}
        {item.hashCheck ? <HashCheck state={item.hashCheck} labels={l} /> : showsProof(item) ? <ProofPill state={proof} word={l.proof[proof]} size="small" /> : null}
      </span>
    </CardShell>
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
    <CardShell
      name={fill(l.actorNodeName, { kind: l.actorKinds[actor.kind], name: actor.name }, locale)}
      words={[]}
      onActivate={onActivate}
      onKeyDown={onKeyDown}
      attrs={{ 'data-kind': 'actor', 'data-selected': selected ? 'true' : undefined }}
    >
      <span className="ty-prov-card__head" aria-hidden="true">
        <span className="ty-prov-card__title">{l.actorKinds[actor.kind]}</span>
      </span>
      <code className="ty-prov-card__id" dir="ltr" aria-hidden="true">
        {actor.model ?? ''}
      </code>
      <span className="ty-prov-card__foot" aria-hidden="true">
        <ActorMark actor={actor} />
      </span>
    </CardShell>
  )
}
