import { Bot, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button as AriaButton, Link as AriaLink, type PressEvent } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { useMessages } from '../../internal/provider'

/** The first `count` user-perceived characters (grapheme clusters), so marks and emoji stay whole. */
function leadingGraphemes(text: string, count: number): string {
  const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter
  if (!Segmenter) return Array.from(text).slice(0, count).join('')
  let out = ''
  let taken = 0
  for (const { segment } of new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) {
    if (taken === count) break
    out += segment
    taken += 1
  }
  return out
}

export type AvatarSize = 'xsmall' | 'small' | 'regular' | 'large'

export interface AvatarProps {
  /** Image URL; on load error the fallback shows. */
  src?: string | null
  /** One or two characters shown without an image (derived by the host from a name). */
  fallbackText?: string
  /** Accessible name; required unless `decorative`. */
  name?: string
  /** Hides the avatar from assistive tech when the name is shown next to it. */
  decorative?: boolean
  /** Person: circle with initials. Agent: rounded square, bot icon, dashed border, never initials (§2.11). */
  actorKind?: 'person' | 'agent'
  size?: AvatarSize
  /** Fallback background: accent-soft or neutral. */
  tint?: 'accent' | 'neutral'
  /** Makes the avatar a button. */
  onPress?: (e: PressEvent) => void
  /** Makes the avatar a link (router adapter). */
  href?: string
  className?: string
}

/** Person or agent picture with fallback (spec: wave-1/avatar.md; design direction §2.11). */
export function Avatar({ src, fallbackText, name, decorative = false, actorKind = 'person', size = 'regular', tint = 'accent', onPress, href, className }: AvatarProps) {
  const messages = useMessages()
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  const pressable = !!(onPress || href)
  devWarning(!decorative && !name, 'Avatar: `name` is required unless `decorative`.')

  const isAgent = actorKind === 'agent'
  const showImage = !!src && !failed
  // Inside a pressable wrapper the visual is decorative: the control carries the name.
  const hidden = decorative || pressable

  let inner
  if (showImage) {
    inner = <img className="fk-avatar__image" src={src ?? undefined} alt={hidden ? '' : (name ?? '')} onError={() => setFailed(true)} />
  } else if (isAgent) {
    inner = <Bot className="fk-avatar__icon" aria-hidden="true" focusable="false" />
  } else if (fallbackText) {
    inner = (
      <span className="fk-avatar__initials" aria-hidden="true">
        {leadingGraphemes(fallbackText, 2)}
      </span>
    )
  } else {
    inner = <User className="fk-avatar__icon" aria-hidden="true" focusable="false" />
  }

  const visual = (
    <span
      className={cx('fk-avatar', !pressable && className)}
      data-kind={actorKind}
      data-size={size}
      data-tint={tint}
      data-image={showImage || undefined}
      aria-hidden={hidden ? true : undefined}
      role={!hidden && !showImage ? 'img' : undefined}
      aria-label={!hidden && !showImage ? name : undefined}
    >
      {inner}
    </span>
  )

  if (!pressable) return visual

  const label = name ? messages.avatar.open(name) : undefined
  if (href) {
    return (
      <AriaLink href={href} onPress={onPress} aria-label={label} className={cx('fk-avatar-control', className)} data-size={size}>
        {visual}
      </AriaLink>
    )
  }
  return (
    <AriaButton onPress={onPress} aria-label={label} className={cx('fk-avatar-control', className)} data-size={size}>
      {visual}
    </AriaButton>
  )
}
