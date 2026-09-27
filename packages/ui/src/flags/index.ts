// @datatechsolutions/tympan/flags (FSL-1.1-ALv2): country, territory and
// regional flags from flag-icons (MIT), one lazily loaded chunk per flag.
// Flags stand for places, never for languages.
export { Flag, type FlagProps, type FlagAspect, type FlagSize } from './Flag'
export { flagName, normalizeFlagCode } from './names'
export { loadFlagSvg, isFlagCode, type FlagArt } from './loadFlag'
export { FLAG_CODES, FLAG_ICONS_VERSION, type FlagCode } from './art'
