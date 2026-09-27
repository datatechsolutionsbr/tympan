import { useId, useMemo } from 'react'
import { Avatar, type AvatarProps } from '../components/avatar/Avatar'
import { devWarning } from '../internal/dev'
import { avatarSvg, type AvatarPalette, type AvatarStyle } from './avatarSvg'

export interface GeneratedAvatarProps extends Omit<AvatarProps, 'artwork'> {
  /** Any stable string (user id, agent key): the same seed always draws the same avatar. */
  seed: string
  /** An allowed DiceBear style module, e.g. `import * as shapes from '@dicebear/shapes'`. */
  avatarStyle: AvatarStyle
  /** Fixed colours (see `avatarPalette`); by default the avatar follows the theme in scope. */
  palette?: AvatarPalette
}

/**
 * Avatar with generated artwork (DiceBear, CC0 or MIT styles only) in the
 * active theme's colours. Everything else is Avatar: an image wins when it
 * loads, the frame carries the accessible name (or is hidden when
 * `decorative`), agents keep the rounded, dashed frame and take abstract
 * styles only. If the artwork cannot be drawn (a style outside the
 * allow-list, a face style for an agent) the Avatar fallback shows: initials
 * for a person, the bot icon for an agent.
 */
export function GeneratedAvatar({ seed, avatarStyle, palette, actorKind = 'person', ...rest }: GeneratedAvatarProps) {
  const uid = useId()
  const svg = useMemo(() => {
    try {
      return avatarSvg({ seed, style: avatarStyle, theme: palette ?? 'css', kind: actorKind, idPrefix: `ty-av${uid}` })
    } catch (error) {
      devWarning(true, `GeneratedAvatar: ${(error as Error).message} Showing the fallback.`)
      return null
    }
  }, [seed, avatarStyle, palette, actorKind, uid])
  return (
    <Avatar
      {...rest}
      actorKind={actorKind}
      artwork={svg ? <span className="ty-avatar__artwork" data-generated="" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} /> : null}
    />
  )
}
