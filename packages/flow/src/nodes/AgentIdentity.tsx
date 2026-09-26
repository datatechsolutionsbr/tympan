// AgentIdentity: who an automated agent is, the same way everywhere. Design
// direction §2.11: an agent is a rounded square with a dashed boundary, never
// a round face or initials, and the word "agent" is always visible. No
// external avatar service: the optional generated mark is drawn here from a
// hash of the name.

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { defineLabels, fill, useLabels } from '../internal/labels'

export type AgentTier = 'beginner' | 'intermediate' | 'advanced' | 'expert'

/** Default rating thresholds (a, b, c): below a beginner … at or above c expert. Hosts pass their own. */
export const DEFAULT_TIER_THRESHOLDS: readonly [number, number, number] = [25, 50, 75]

/** Maps a rating to one of four ordered tiers; a missing rating counts as the lowest. */
export function agentTier(rating?: number | null, thresholds: readonly [number, number, number] = DEFAULT_TIER_THRESHOLDS): AgentTier {
  if (rating === undefined || rating === null || Number.isNaN(rating)) return 'beginner'
  const [a, b, c] = thresholds
  if (rating < a) return 'beginner'
  if (rating < b) return 'intermediate'
  if (rating < c) return 'advanced'
  return 'expert'
}

/** FNV-1a over UTF-16 code units: small, stable, no dependency. */
export function nameHash(name: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Deterministic geometric mark: a 5 × 5 grid mirrored left to right, cells
 * switched on by bits of the name hash. Same name, same picture; no faces.
 */
export function GeneratedAgentMark({ name }: { name: string }) {
  const h = nameHash(name)
  const cells: Array<[number, number]> = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      if ((h >>> (row * 3 + col)) & 1) {
        cells.push([col, row])
        if (col < 2) cells.push([4 - col, row])
      }
    }
  }
  const tone = (h % 8) + 1
  return (
    <svg className="fk-agent-mark__generated" viewBox="0 0 5 5" data-tone={`categorical-${tone}`} data-hash={h.toString(16)} aria-hidden="true" focusable="false">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
      ))}
    </svg>
  )
}

export interface AgentMarkProps {
  name: string
  image?: string | null
  size?: 'sm' | 'md'
  /** 'bot': the bot glyph without an image; 'generated': the name's geometric mark. */
  fallback?: 'bot' | 'generated'
}

/** The square, dashed mark of an agent. Decorative: the name is text elsewhere. */
export function AgentMark({ name, image, size = 'md', fallback = 'bot' }: AgentMarkProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = !!image && failedSrc !== image
  return (
    <span className="fk-agent-mark" data-size={size} data-content={showImage ? 'image' : fallback} aria-hidden="true">
      {showImage ? (
        <img className="fk-agent-mark__image" src={image!} alt="" onError={() => setFailedSrc(image!)} />
      ) : fallback === 'generated' ? (
        <GeneratedAgentMark name={name} />
      ) : (
        <Bot className="fk-agent-mark__bot" focusable="false" />
      )}
      <span className="fk-agent-mark__badge">
        <Bot focusable="false" />
      </span>
    </span>
  )
}

export interface AgentIdentityLabels {
  agent: string
  /** Name when the identity sits inside a link or button. */
  name: string
  modelLine: string
}

export const agentIdentityLabels = defineLabels<AgentIdentityLabels>('agentIdentity', {
  en: { agent: 'agent', name: '{name}, agent', modelLine: '{provider} · {model}' },
  'pt-BR': { agent: 'agente', name: '{name}, agente', modelLine: '{provider} · {model}' },
  es: { agent: 'agente', name: '{name}, agente', modelLine: '{provider} · {model}' },
})
export const defaultAgentIdentityLabels = agentIdentityLabels.bundles.en

export interface AgentIdentityProps {
  agent: { name: string; image?: string; role?: string; provider?: string; model?: string }
  size?: 'sm' | 'md'
  fallbackRole?: string
  /** Show the word "agent"; hide only where a column header already says it. */
  showKindWord?: boolean
  /** Mark without an image: the bot glyph (default) or the generated mark. */
  markFallback?: 'bot' | 'generated'
  labels?: Partial<AgentIdentityLabels>
  className?: string
}

/** "provider · model" or whichever is present. */
export function modelLineOf(provider: string | undefined, model: string | undefined, template = defaultAgentIdentityLabels.modelLine): string | null {
  if (provider && model) return fill(template, { provider, model })
  return provider || model || null
}

export function AgentIdentity({ agent, size = 'md', fallbackRole, showKindWord = true, markFallback = 'bot', labels, className }: AgentIdentityProps) {
  const l = useLabels(agentIdentityLabels, labels)
  const modelLine = modelLineOf(agent.provider, agent.model, l.modelLine)
  const role = agent.role || fallbackRole
  const secondary = role ?? modelLine
  return (
    <span className={['fk-agent-identity', className].filter(Boolean).join(' ')} data-size={size}>
      <AgentMark name={agent.name} image={agent.image ?? null} size={size} fallback={markFallback} />
      <span className="fk-agent-identity__text">
        <span className="fk-agent-identity__line">
          <span className="fk-agent-identity__name" title={agent.name}>
            {agent.name}
          </span>
          {showKindWord ? <span className="fk-agent-identity__kind">{l.agent}</span> : null}
        </span>
        {secondary ? (
          <span className="fk-agent-identity__secondary" title={secondary}>
            {secondary}
          </span>
        ) : null}
        {role && modelLine ? <span className="fk-agent-identity__model">{modelLine}</span> : null}
      </span>
    </span>
  )
}
