// @datatechsolutions/tympan/avatars (FSL-1.1-ALv2): deterministic generated
// avatars on DiceBear, in the colours of the active Tympan theme. Needs the
// optional peer @dicebear/core (9.x) and the style packages you use, each on
// the licence allow-list (CC0 1.0 or MIT artwork):
//   import * as shapes from '@dicebear/shapes'
//   <GeneratedAvatar seed={user.id} avatarStyle={shapes} name={user.name} />

export { GeneratedAvatar, type GeneratedAvatarProps } from './GeneratedAvatar'
export {
  avatarSvg,
  avatarPalette,
  avatarCssPalette,
  allowedAvatarStyle,
  AvatarStyleError,
  AVATAR_SLOTS,
  type AvatarSvgOptions,
  type AvatarStyle,
  type AvatarKind,
  type AvatarPalette,
  type AvatarSlot,
} from './avatarSvg'
export {
  ALLOWED_AVATAR_LICENSES,
  ALLOWED_AVATAR_STYLES,
  EXCLUDED_AVATAR_STYLES,
  type AllowedAvatarLicense,
  type AllowedAvatarStyle,
  type AvatarSubject,
  type ExcludedAvatarStyle,
} from './styles'
