// Licence gate for DiceBear avatar styles. DiceBear's code is MIT, but every
// style carries its own artwork licence. Only styles whose artwork is CC0 1.0
// or MIT are allowed; the list below was read from each package's LICENSE file
// and its `meta` export (DiceBear 9.4.3, 2026-09-26). THIRD_PARTY_NOTICES.md
// and PROVENANCE.md carry the same table.

/** Artwork licences that need no attribution in the UI and allow any use. */
export const ALLOWED_AVATAR_LICENSES = ['CC0 1.0', 'MIT'] as const
export type AllowedAvatarLicense = (typeof ALLOWED_AVATAR_LICENSES)[number]

/**
 * What a style depicts. `figure` and `text` styles are for people only: an
 * agent is never drawn with a face or with initials (design direction §2.11).
 */
export type AvatarSubject = 'abstract' | 'figure' | 'text'

export interface AllowedAvatarStyle {
  /** npm package that holds the style. */
  package: string
  /** `meta.title` of the style module (the key the gate matches). */
  title: string
  /** Artwork author as recorded by the package. */
  designer: string
  /** Where the artwork comes from. */
  source: string
  /** Artwork licence (`meta.license.name`). */
  designLicense: AllowedAvatarLicense
  /** Licence of the package code. */
  codeLicense: 'MIT'
  subject: AvatarSubject
}

export const ALLOWED_AVATAR_STYLES: readonly AllowedAvatarStyle[] = [
  { package: '@dicebear/glass', title: 'Glass', designer: 'DiceBear', source: 'https://www.dicebear.com', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'abstract' },
  { package: '@dicebear/icons', title: 'Bootstrap Icons', designer: 'The Bootstrap Authors', source: 'https://github.com/twbs/icons', designLicense: 'MIT', codeLicense: 'MIT', subject: 'abstract' },
  { package: '@dicebear/identicon', title: 'Identicon', designer: 'DiceBear', source: 'https://www.dicebear.com', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'abstract' },
  { package: '@dicebear/initials', title: 'Initials', designer: 'DiceBear', source: 'https://github.com/dicebear/dicebear', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'text' },
  { package: '@dicebear/lorelei', title: 'Lorelei', designer: 'Lisa Wischofsky', source: 'https://www.figma.com/community/file/1198749693280469639', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'figure' },
  { package: '@dicebear/lorelei-neutral', title: 'Lorelei Neutral', designer: 'Lisa Wischofsky', source: 'https://www.figma.com/community/file/1198749693280469639', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'figure' },
  { package: '@dicebear/notionists', title: 'Notionists', designer: 'Zoish', source: 'https://heyzoish.gumroad.com/l/notionists', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'figure' },
  { package: '@dicebear/notionists-neutral', title: 'Notionists', designer: 'Zoish', source: 'https://heyzoish.gumroad.com/l/notionists', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'figure' },
  { package: '@dicebear/open-peeps', title: 'Open Peeps', designer: 'Pablo Stanley', source: 'https://www.openpeeps.com/', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'figure' },
  { package: '@dicebear/pixel-art', title: 'Pixel Art', designer: 'DiceBear', source: 'https://www.figma.com/community/file/1198754108850888330', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'figure' },
  { package: '@dicebear/pixel-art-neutral', title: 'Pixel Art Neutral', designer: 'DiceBear', source: 'https://www.figma.com/community/file/1198754108850888330', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'figure' },
  { package: '@dicebear/rings', title: 'Rings', designer: 'DiceBear', source: 'https://www.dicebear.com', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'abstract' },
  { package: '@dicebear/shapes', title: 'Shapes', designer: 'DiceBear', source: 'https://www.dicebear.com', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'abstract' },
  { package: '@dicebear/thumbs', title: 'Thumbs', designer: 'DiceBear', source: 'https://www.dicebear.com', designLicense: 'CC0 1.0', codeLicense: 'MIT', subject: 'figure' },
]

export interface ExcludedAvatarStyle {
  package: string
  designer: string
  designLicense: string
  reason: string
}

const CC_BY = 'CC BY 4.0 requires visible attribution wherever the artwork is shown.'
const CUSTOM = 'Custom "free for personal and commercial use" terms: not an open licence, no redistribution grant.'

/** DiceBear 9 styles left out, and why. Importing any of them fails `check:provenance`. */
export const EXCLUDED_AVATAR_STYLES: readonly ExcludedAvatarStyle[] = [
  { package: '@dicebear/adventurer', designer: 'Lisa Wischofsky', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/adventurer-neutral', designer: 'Lisa Wischofsky', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/avataaars', designer: 'Pablo Stanley', designLicense: 'Free for personal and commercial use', reason: CUSTOM },
  { package: '@dicebear/avataaars-neutral', designer: 'Pablo Stanley', designLicense: 'Free for personal and commercial use', reason: CUSTOM },
  { package: '@dicebear/big-ears', designer: 'The Visual Team', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/big-ears-neutral', designer: 'The Visual Team', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/big-smile', designer: 'Ashley Seo', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/bottts', designer: 'Pablo Stanley', designLicense: 'Free for personal and commercial use', reason: CUSTOM },
  { package: '@dicebear/bottts-neutral', designer: 'Pablo Stanley', designLicense: 'Free for personal and commercial use', reason: CUSTOM },
  { package: '@dicebear/croodles', designer: 'vijay verma', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/croodles-neutral', designer: 'vijay verma', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/dylan', designer: 'Natalia Spivak', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/fun-emoji', designer: 'Davis Uche', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/micah', designer: 'Micah Lanier', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/miniavs', designer: 'Webpixels', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/personas', designer: 'Draftbit', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/toon-head', designer: 'Johan Melin', designLicense: 'CC BY 4.0', reason: CC_BY },
  { package: '@dicebear/collection', designer: '(all of the above)', designLicense: 'mixed', reason: 'Re-exports every style, including the excluded ones.' },
]
