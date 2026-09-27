// Deterministic generated avatars: DiceBear draws the artwork from a seed,
// Tympan supplies the colours. By default the colours are CSS custom
// properties, so an inline avatar follows the active theme and mode with no
// re-render; `avatarPalette()` resolves them to hex for contexts without the
// Tympan stylesheet (images, e-mail, server rendering to a file).
import { createAvatar, type Style } from '@dicebear/core'
import { oklchToRgb, presets, printThemePresets, resolveTheme, rgbToOklch, toHex, type Rgba, type ThemeConfig } from '@datatechsolutions/tympan-tokens'
import { ALLOWED_AVATAR_LICENSES, ALLOWED_AVATAR_STYLES, type AllowedAvatarStyle } from './styles'

/**
 * A DiceBear style module (`import * as shapes from '@dicebear/shapes'`).
 * Only the styles in `ALLOWED_AVATAR_STYLES` are accepted.
 */
export interface AvatarStyle {
  meta?: { title?: string; creator?: string; source?: string; license?: { name?: string; url?: string } }
  create: (...args: never[]) => unknown
  schema?: unknown
}

export type AvatarKind = 'person' | 'agent'

/**
 * Colour slots the styles draw with: soft backgrounds (follow the mode), ink
 * shapes, solid fills that carry white artwork, and light paper behind the
 * black line art of figure styles (light in both modes, so faces stay legible).
 */
export const AVATAR_SLOTS = ['soft-1', 'soft-2', 'soft-3', 'ink-1', 'ink-2', 'ink-3', 'solid-1', 'solid-2', 'solid-3', 'paper-1', 'paper-2', 'paper-3'] as const
export type AvatarSlot = (typeof AVATAR_SLOTS)[number]
/** One CSS colour per slot. */
export type AvatarPalette = Record<AvatarSlot, string>

/** Thrown for a style outside the licence allow-list, or a people-only style drawn for an agent. */
export class AvatarStyleError extends Error {
  override name = 'AvatarStyleError'
}

// Sentinel colours handed to DiceBear and swapped for the palette afterwards.
// They are valid hex (DiceBear's option schema) and appear in no allowed style.
const SENTINEL: Record<AvatarSlot, string> = {
  'soft-1': 'fe01a1',
  'soft-2': 'fe01a2',
  'soft-3': 'fe01a3',
  'ink-1': 'fe01b1',
  'ink-2': 'fe01b2',
  'ink-3': 'fe01b3',
  'solid-1': 'fe01c1',
  'solid-2': 'fe01c2',
  'solid-3': 'fe01c3',
  'paper-1': 'fe01d1',
  'paper-2': 'fe01d2',
  'paper-3': 'fe01d3',
}
const s = (...slots: AvatarSlot[]) => slots.map((slot) => SENTINEL[slot])
const SOFT = s('soft-1', 'soft-2', 'soft-3')
const INK = s('ink-1', 'ink-2', 'ink-3')
const SOLID = s('solid-1', 'solid-2', 'solid-3')
const PAPER = s('paper-1', 'paper-2', 'paper-3')

/**
 * Which DiceBear colour options each style gets. Figure styles only get a
 * background: skin, hair and eye colours stay the artist's, never the brand.
 */
const COLOR_OPTIONS: Record<string, Record<string, string[]>> = {
  Glass: { backgroundColor: SOLID },
  'Bootstrap Icons': { backgroundColor: SOLID },
  Identicon: { backgroundColor: s('soft-1', 'soft-3'), rowColor: INK },
  Initials: { backgroundColor: s('soft-1', 'soft-2'), textColor: s('ink-2') },
  Lorelei: { backgroundColor: PAPER },
  'Lorelei Neutral': { backgroundColor: PAPER },
  Notionists: { backgroundColor: PAPER },
  'Open Peeps': { backgroundColor: PAPER },
  'Pixel Art': { backgroundColor: PAPER },
  'Pixel Art Neutral': { backgroundColor: PAPER },
  Rings: { backgroundColor: s('soft-1', 'soft-3'), ringColor: INK },
  Shapes: { backgroundColor: SOFT, shape1Color: INK, shape2Color: SOLID, shape3Color: s('ink-3', 'solid-1') },
  Thumbs: { backgroundColor: SOFT, shapeColor: INK },
}

const mix = (a: string, pct: number, b: string) => `color-mix(in oklch, ${a} ${pct}%, ${b})`

/** The theme expressions behind each slot; people draw from the brand, agents from the neutral ink. */
const CSS_SOURCES: Record<AvatarKind, AvatarPalette> = {
  person: {
    'soft-1': mix('var(--ty-brand)', 14, 'var(--ty-bg)'),
    'soft-2': mix('var(--ty-brand)', 28, 'var(--ty-bg)'),
    'soft-3': mix('var(--ty-ink)', 10, 'var(--ty-bg)'),
    'ink-1': 'var(--ty-brand)',
    'ink-2': 'var(--ty-brand-strong)',
    'ink-3': mix('var(--ty-brand)', 55, 'var(--ty-ink)'),
    'solid-1': 'var(--ty-brand-600)',
    'solid-2': 'var(--ty-brand-700)',
    'solid-3': 'var(--ty-brand-800)',
    'paper-1': 'var(--ty-brand-100)',
    'paper-2': 'var(--ty-brand-200)',
    'paper-3': 'var(--ty-neutral-100)',
  },
  agent: {
    'soft-1': mix('var(--ty-ink)', 8, 'var(--ty-bg)'),
    'soft-2': mix('var(--ty-ink)', 14, 'var(--ty-bg)'),
    'soft-3': mix('var(--ty-ink)', 20, 'var(--ty-bg)'),
    'ink-1': 'var(--ty-actor-agent)',
    'ink-2': 'var(--ty-ink-3)',
    'ink-3': mix('var(--ty-ink)', 70, 'var(--ty-bg)'),
    'solid-1': 'var(--ty-neutral-600)',
    'solid-2': 'var(--ty-neutral-700)',
    'solid-3': 'var(--ty-neutral-800)',
    'paper-1': 'var(--ty-neutral-50)',
    'paper-2': 'var(--ty-neutral-100)',
    'paper-3': 'var(--ty-neutral-200)',
  },
}

/**
 * The palette as CSS: each slot is `var(--ty-avatar-<slot>, <theme expression>)`,
 * so a host can repaint one slot with a custom property and everything else
 * follows the Tympan theme and colour mode in scope.
 */
export function avatarCssPalette(kind: AvatarKind = 'person'): AvatarPalette {
  const out = {} as AvatarPalette
  for (const slot of AVATAR_SLOTS) out[slot] = `var(--ty-avatar-${slot}, ${CSS_SOURCES[kind][slot]})`
  return out
}

function mixRgb(a: Rgba, pct: number, b: Rgba): Rgba {
  // OKLCH interpolation like CSS color-mix(in oklch): shorter hue arc, an achromatic side takes the other's hue.
  const p = pct / 100
  const x = rgbToOklch(a)
  const y = rgbToOklch(b)
  const hx = x.c < 0.02 ? y.h : x.h
  const hy = y.c < 0.02 ? x.h : y.h
  let dh = hy - hx
  if (dh > 180) dh -= 360
  if (dh < -180) dh += 360
  return oklchToRgb({ l: x.l * p + y.l * (1 - p), c: x.c * p + y.c * (1 - p), h: (hx + dh * (1 - p) + 360) % 360 })
}

/** Finds a built-in or print theme preset by name. */
function presetByName(name: string): ThemeConfig {
  const found = [...presets, ...printThemePresets].find((p) => p.name === name)
  if (!found) throw new Error(`Unknown Tympan theme "${name}".`)
  return found
}

/**
 * The palette resolved to hex for one theme (a preset name or a
 * `ThemeConfig`) in one mode: the same recipe as the CSS palette.
 */
export function avatarPalette(theme: string | ThemeConfig, mode: 'light' | 'dark', kind: AvatarKind = 'person'): AvatarPalette {
  const r = resolveTheme(typeof theme === 'string' ? presetByName(theme) : theme, mode)
  const c = (role: string): Rgba => r.colors[role] ?? { r: 0.5, g: 0.5, b: 0.5, a: 1 }
  const hex = (x: Rgba) => toHex(x)
  if (kind === 'agent') {
    return {
      'soft-1': hex(mixRgb(c('ink'), 8, c('bg'))),
      'soft-2': hex(mixRgb(c('ink'), 14, c('bg'))),
      'soft-3': hex(mixRgb(c('ink'), 20, c('bg'))),
      'ink-1': hex(c('actor-agent')),
      'ink-2': hex(c('ink-3')),
      'ink-3': hex(mixRgb(c('ink'), 70, c('bg'))),
      'solid-1': hex(r.ramps.neutral[600]),
      'solid-2': hex(r.ramps.neutral[700]),
      'solid-3': hex(r.ramps.neutral[800]),
      'paper-1': hex(r.ramps.neutral[50]),
      'paper-2': hex(r.ramps.neutral[100]),
      'paper-3': hex(r.ramps.neutral[200]),
    }
  }
  return {
    'soft-1': hex(mixRgb(c('brand'), 14, c('bg'))),
    'soft-2': hex(mixRgb(c('brand'), 28, c('bg'))),
    'soft-3': hex(mixRgb(c('ink'), 10, c('bg'))),
    'ink-1': hex(c('brand')),
    'ink-2': hex(c('brand-strong')),
    'ink-3': hex(mixRgb(c('brand'), 55, c('ink'))),
    'solid-1': hex(r.ramps.brand[600]),
    'solid-2': hex(r.ramps.brand[700]),
    'solid-3': hex(r.ramps.brand[800]),
    'paper-1': hex(r.ramps.brand[100]),
    'paper-2': hex(r.ramps.brand[200]),
    'paper-3': hex(r.ramps.neutral[100]),
  }
}

/**
 * The allow-list entry of a style, or an `AvatarStyleError` when the style's
 * artwork licence is not CC0 1.0 or MIT, or the style is not on the list.
 */
export function allowedAvatarStyle(style: AvatarStyle): AllowedAvatarStyle {
  const title = style?.meta?.title
  const license = style?.meta?.license?.name
  if (!license || !(ALLOWED_AVATAR_LICENSES as readonly string[]).includes(license)) {
    throw new AvatarStyleError(`Avatar style "${title ?? 'unknown'}" has artwork licence "${license ?? 'unknown'}"; only CC0 1.0 and MIT styles are allowed.`)
  }
  const entry = ALLOWED_AVATAR_STYLES.find((e) => e.title === title && e.designLicense === license)
  if (!entry) throw new AvatarStyleError(`Avatar style "${title ?? 'unknown'}" is not on the Tympan allow-list.`)
  return entry
}

/** FNV-1a, for short deterministic id prefixes. */
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

const escapeAttr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export interface AvatarSvgOptions {
  /** Any stable string (user id, e-mail hash, agent key): same seed, same avatar. */
  seed: string
  /** An allowed DiceBear style module. */
  style: AvatarStyle
  /** Width and height in px; omitted, the SVG fills its container. */
  size?: number
  /** `'css'` (default): colours follow the theme in scope. A palette (see `avatarPalette`): fixed colours. */
  theme?: 'css' | AvatarPalette
  /** People draw from the brand; agents from the neutral ink, and only with abstract styles. */
  kind?: AvatarKind
  /** Prefix for the SVG's internal ids (masks, gradients); defaults to a hash of seed, style and kind. */
  idPrefix?: string
  /** Accessible name: the SVG becomes role="img". Without it the SVG is aria-hidden (decorative). */
  title?: string
}

/**
 * A generated avatar as an SVG string, deterministic from the seed. Throws
 * `AvatarStyleError` for a style outside the licence allow-list, and for a
 * face or initials style drawn for an agent.
 */
export function avatarSvg({ seed, style, size, theme = 'css', kind = 'person', idPrefix, title }: AvatarSvgOptions): string {
  const entry = allowedAvatarStyle(style)
  if (kind === 'agent' && entry.subject !== 'abstract') {
    throw new AvatarStyleError(`Avatar style "${entry.title}" draws ${entry.subject === 'text' ? 'initials' : 'a face'}; agents take an abstract style (Glass, Bootstrap Icons, Identicon, Rings, Shapes).`)
  }
  const colors = COLOR_OPTIONS[entry.title] ?? { backgroundColor: SOFT }
  const extra: Record<string, unknown> =
    entry.title === 'Initials' ? { fontFamily: [theme === 'css' ? 'var(--ty-font-sans, system-ui, sans-serif)' : 'system-ui, sans-serif'], fontWeight: 600, fontSize: 42 } : {}
  let svg = createAvatar(style as unknown as Style<object>, { seed, ...(size ? { size } : {}), ...colors, ...extra }).toString()

  const palette = theme === 'css' ? avatarCssPalette(kind) : theme
  for (const slot of AVATAR_SLOTS) svg = svg.replace(new RegExp(`#${SENTINEL[slot]}`, 'gi'), escapeAttr(palette[slot]))

  // Scope internal ids so several avatars on one page never share a mask or gradient.
  const prefix = (idPrefix ?? `ty-av-${hash(`${entry.title}\u0000${kind}\u0000${seed}`)}`).replace(/[^\w-]/g, '')
  svg = svg.replace(/(\bid="|url\(#|href="#)([\w-]+)([")])/g, (_m, a: string, id: string, b: string) => `${a}${prefix}-${id}${b}`)

  const a11y = title ? `role="img" aria-label="${escapeAttr(title)}"` : 'aria-hidden="true" focusable="false"'
  return svg.replace(/^<svg /, `<svg ${a11y} `)
}
