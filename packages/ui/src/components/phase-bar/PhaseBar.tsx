import type { CSSProperties, ReactNode } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useLocaleText } from '../../internal/speech'
import { useMessages } from '../../internal/provider'
import type { ProofState } from '../proof-badge/ProofBadge'

export type PhaseTone = ProofState | 'none' | 'accent' | 'neutral'

export interface PhaseSegment {
  id: string
  label: string
  value: number
  tone: PhaseTone
}

export interface PhaseBarProps {
  segments: PhaseSegment[]
  label: string
  /** Reading sentence under the bar. */
  caption?: ReactNode
  locale?: string
  className?: string
}

/** Share (0–100) of each value in the total; zero total gives zeros. */
export function shares(values: number[]): number[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0)
  return values.map((v) => (total > 0 ? (Math.max(0, v) / total) * 100 : 0))
}

/** One bar split by share, with a textual legend (spec: wave-4/phase-bar.md; §2.11 textures). */
export function PhaseBar({ segments, label, caption, locale, className }: PhaseBarProps) {
  const words = useMessages().phaseBar
  const adapter = useLocale().locale
  const fmt = new Intl.NumberFormat(locale ?? adapter)
  const percent = shares(segments.map((s) => s.value))
  const speech = useLocaleText()
  const spoken = segments.length ? speech.join(...segments.map((s) => words.part(s.label, fmt.format(s.value)))) : words.empty
  return (
    <figure className={cx('fk-phase-bar', className)}>
      <div className="fk-phase-bar__track" role="img" aria-label={words.named(label, spoken)}>
        {segments.map((segment, i) =>
          segment.value > 0 ? (
            <span
              key={segment.id}
              className="fk-phase-bar__segment"
              data-tone={segment.tone}
              style={{ '--fk-phase-share': `${percent[i]}%` } as CSSProperties}
            />
          ) : null,
        )}
      </div>
      <ul className="fk-phase-bar__legend">
        {segments.map((segment) => (
          <li key={segment.id} className="fk-phase-bar__key" data-tone={segment.tone}>
            <span className="fk-phase-bar__swatch" aria-hidden="true" />
            <span className="fk-phase-bar__word">{segment.label}</span>
            <span className="fk-phase-bar__count">{fmt.format(segment.value)}</span>
          </li>
        ))}
      </ul>
      {caption ? <figcaption className="fk-phase-bar__caption">{caption}</figcaption> : null}
    </figure>
  )
}
