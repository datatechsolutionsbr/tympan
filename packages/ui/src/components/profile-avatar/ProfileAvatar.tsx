import { UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export type ProfileAvatarSize = 'sm' | 'md' | 'lg' | 'fill'

export interface ProfileAvatarProps {
  name?: string | null
  email?: string | null
  pictureUrl?: string | null
  /** Accessible name; defaults to name, then e-mail, then "Profile". */
  label?: string
  size?: ProfileAvatarSize
  /** Hide from assistive technology when the name is already visible beside it. */
  decorative?: boolean
  className?: string
}

type Face = { kind: 'picture'; url: string } | { kind: 'letter'; letter: string } | { kind: 'glyph' }

/** Chooses what the disc shows, in order: picture, initial, neutral glyph. */
function pickFace(name: string | null | undefined, email: string | null | undefined, url: string | null | undefined, broken: boolean): Face {
  if (url && !broken) return { kind: 'picture', url }
  const source = [name, email].map((s) => s?.trim()).find(Boolean)
  const first = source ? Array.from(source)[0] : undefined
  return first ? { kind: 'letter', letter: first.toLocaleUpperCase() } : { kind: 'glyph' }
}

/** The signed-in person as picture or initial on a disc (spec: wave-2/profile-avatar.md). */
export function ProfileAvatar(props: ProfileAvatarProps) {
  const fallbackLabel = useMessages().profileAvatar.profile
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [props.pictureUrl])

  const face = pickFace(props.name, props.email, props.pictureUrl, broken)
  const label = props.label ?? (props.name?.trim() || props.email?.trim() || fallbackLabel)
  const hidden = props.decorative === true
  const a11y = hidden ? { 'aria-hidden': true as const } : face.kind === 'picture' ? {} : { role: 'img', 'aria-label': label }

  return (
    <span className={cx('fk-profile-avatar', props.className)} data-size={props.size ?? 'fill'} data-face={face.kind} {...a11y}>
      {face.kind === 'picture' ? (
        <img className="fk-profile-avatar__picture" src={face.url} alt={hidden ? '' : label} onError={() => setBroken(true)} />
      ) : face.kind === 'letter' ? (
        <span className="fk-profile-avatar__letter" aria-hidden="true">
          {face.letter}
        </span>
      ) : (
        <UserRound className="fk-profile-avatar__glyph" aria-hidden="true" focusable="false" />
      )}
    </span>
  )
}
