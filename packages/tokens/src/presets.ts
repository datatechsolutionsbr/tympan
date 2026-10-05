import { seedFromColor, type Seed, type SeedName, type ThemeConfig } from './theme.ts'

// Seeds. The brand hue comes from the design direction's accent (§2.3); the
// neutral carries a slight tint of the brand hue; semantic hues are chosen so
// the proof-state greens sit about 30 degrees away from the brand teal (§2.3).
const brand = seedFromColor('#166e5a', 0.13)

const baseSeeds: Record<SeedName, Seed> = {
  brand,
  neutral: { hue: brand.hue, chroma: 0.012 },
  danger: { hue: 12, chroma: 0.2 },
  warning: { hue: 68, chroma: 0.15 },
  success: { hue: 148, chroma: 0.16 },
  info: { hue: 255, chroma: 0.06 },
}

/**
 * Default theme. Generated from seeds, with the exact colours of design
 * direction §2.3 pinned so the product matches the approved direction.
 */
export const tympanPreset: ThemeConfig = {
  name: 'tympan',
  label: 'Tympan',
  seeds: baseSeeds,
  radius: 10,
  contrast: 'default',
  glass: true,
  cta: 'gradient',
  pins: {
    light: {
      brand: '#166e5a',
      'focus-ring': '#166e5a',
      'brand-strong': '#0f5a49',
      'brand-soft': 'rgb(22 110 90 / 0.10)',
      'on-brand': '#f6fbf9',
      bg: '#f6f8fa',
      surface: 'rgb(252 253 253 / 0.82)',
      'surface-raised': 'rgb(252 253 253 / 0.94)',
      'surface-solid': '#fcfdfd',
      'surface-raised-solid': '#fcfdfd',
      'surface-sunken': '#eef2f5',
      line: 'rgb(100 116 139 / 0.22)',
      'line-strong': 'rgb(100 116 139 / 0.38)',
      ink: '#0f172a',
      'ink-2': '#334155',
      'ink-3': '#526077',
      success: '#15803d',
      warning: '#a16207',
      danger: '#be123c',
      neutral: '#526077',
    },
    dark: {
      brand: '#34d399',
      'focus-ring': '#34d399',
      'brand-strong': '#6ee7b7',
      'brand-soft': 'rgb(52 211 153 / 0.14)',
      'on-brand': '#052e25',
      bg: '#0a0f1c',
      surface: 'rgb(20 28 46 / 0.72)',
      'surface-raised': 'rgb(28 38 60 / 0.86)',
      'surface-solid': '#141c2e',
      'surface-raised-solid': '#1c263c',
      'surface-sunken': '#0f1626',
      line: 'rgb(148 163 184 / 0.16)',
      'line-strong': 'rgb(148 163 184 / 0.30)',
      ink: '#eef2f7',
      'ink-2': '#cbd5e1',
      'ink-3': '#94a3b8',
      success: '#4ade80',
      warning: '#fbbf24',
      danger: '#fb7185',
      neutral: '#94a3b8',
    },
  },
  ctaPins: {
    light: ['#047857', '#0f766e', '#0369a1'],
    dark: ['#047857', '#0f766e', '#0369a1'],
  },
}

/** Brand-free grey theme for embedding and white-label use. Fully generated. */
export const neutralPreset: ThemeConfig = {
  name: 'neutral',
  label: 'Neutral',
  seeds: {
    brand: { hue: 255, chroma: 0.03 },
    neutral: { hue: 255, chroma: 0.008 },
    danger: { hue: 18, chroma: 0.19 },
    warning: { hue: 70, chroma: 0.14 },
    success: { hue: 150, chroma: 0.14 },
    info: { hue: 255, chroma: 0.05 },
  },
  radius: 8,
  contrast: 'default',
  glass: true,
  cta: 'solid',
}

/**
 * A named product preset, selected by name
 * (`data-ty-theme="fakhir"`). Today it carries the default theme's values; it
 * is a separate preset so an app that selects it keeps its look if the default changes.
 */
export const fakhirPreset: ThemeConfig = {
  ...tympanPreset,
  name: 'fakhir',
  label: 'Fakhir',
}

/**
 * The Astrlabe workflow engine's look (`data-ty-theme="astrlabe"`): slate
 * neutrals, an indigo brand (indigo 500 as the accent family, one step darker
 * where text needs 4.5:1 on light grounds), liquid-glass surfaces (gradient
 * fills, specular edges, a strong saturation boost at night), the rounder
 * corners of that app (12 px controls, 20 px cards, 24 px sheets), its
 * compact type scale and the sky, indigo and violet mark. The call to
 * action is the indigo to purple gradient its primary buttons fill with, and
 * text (headings included) uses the platform's own system fonts. The state
 * contract holds on every ground: running is a cyan clearly off the indigo
 * brand, waiting is amber.
 */
export const astrlabePreset: ThemeConfig = {
  name: 'astrlabe',
  label: 'Astrlabe',
  seeds: {
    brand: seedFromColor('#6366f1', 0.2),
    neutral: { hue: 257, chroma: 0.02 },
    danger: { hue: 25, chroma: 0.2 },
    warning: { hue: 70, chroma: 0.15 },
    success: { hue: 150, chroma: 0.16 },
    info: { hue: 240, chroma: 0.1 },
  },
  chartHues: [277, 237, 163, 75, 12, 293, 185, 48],
  radius: 12,
  contrast: 'default',
  glass: true,
  cta: 'gradient',
  pins: {
    light: {
      brand: '#4f46e5',
      'focus-ring': '#6366f1',
      'brand-strong': '#4338ca',
      'brand-soft': 'rgb(99 102 241 / 0.12)',
      'on-brand': '#ffffff',
      bg: '#f8fafc',
      surface: 'rgb(255 255 255 / 0.72)',
      'surface-raised': 'rgb(255 255 255 / 0.86)',
      'surface-solid': '#ffffff',
      'surface-raised-solid': '#ffffff',
      'surface-sunken': '#f1f5f9',
      // The liquid divider: slate 400 at about a quarter.
      line: 'rgb(148 163 184 / 0.26)',
      'line-strong': 'rgb(100 116 139 / 0.45)',
      ink: '#0f172a',
      // Slate 600 for secondary text, as the app always had.
      'ink-2': '#475569',
      // Slate 500 fails 4.5:1 on the sunken ground by a hair; this is the
      // nearest slate that holds AA there.
      'ink-3': '#5b6779',
      success: '#15803d',
      // Cyan, deliberately off the indigo brand, for the running state.
      info: '#0e7490',
      warning: '#a16207',
      danger: '#be123c',
      neutral: '#5b6779',
      backdrop: 'rgb(15 23 42 / 0.4)',
      // The three soft colour fields behind the glass: violet above, sky below.
      'ambient-1': 'rgb(167 139 250 / 0.05)',
      'ambient-2': 'rgb(56 189 248 / 0.03)',
    },
    dark: {
      brand: '#818cf8',
      'focus-ring': '#818cf8',
      'brand-strong': '#a5b4fc',
      'brand-soft': 'rgb(99 102 241 / 0.2)',
      'on-brand': '#1e1b4b',
      // Slate 950, the app's night ground.
      bg: '#020617',
      surface: 'rgb(30 41 59 / 0.7)',
      'surface-raised': 'rgb(30 41 59 / 0.78)',
      'surface-solid': '#131c2f',
      'surface-raised-solid': '#1b2539',
      'surface-sunken': '#0b1222',
      line: 'rgb(148 163 184 / 0.24)',
      'line-strong': 'rgb(148 163 184 / 0.36)',
      ink: '#ffffff',
      'ink-2': '#cbd5e1',
      'ink-3': '#94a3b8',
      success: '#4ade80',
      info: '#22d3ee',
      warning: '#fbbf24',
      danger: '#fb7185',
      neutral: '#94a3b8',
      backdrop: 'rgb(0 0 0 / 0.5)',
      'ambient-1': 'rgb(124 58 237 / 0.1)',
      'ambient-2': 'rgb(2 132 199 / 0.08)',
    },
  },
  ctaPins: {
    light: ['#4f46e5', '#7c3aed', '#9333ea'],
    dark: ['#4f46e5', '#7c3aed', '#9333ea'],
  },
  // 12 px controls, 20 px cards and panels, 24 px dialogs and hero sheets.
  radii: { card: 20, sheet: 24 },
  // Glass: a light boost on light grounds (more would amplify the ambient
  // tint into a grey-lavender wash), a strong one on dark grounds.
  glassSaturate: { light: 1.15, dark: 1.5 },
  // The liquid-glass elevation: a soft drop under every sheet, a specular
  // inner highlight on its top edge, and the role-named elevation scale.
  shadowPins: {
    light: {
      sheet: [
        { x: 0, y: 4, blur: 16, spread: -2, color: 'rgb(0 0 0 / 0.1)' },
        { x: 0, y: 12, blur: 40, spread: -8, color: 'rgb(0 0 0 / 0.06)' },
      ],
      'sheet-inset': [
        { x: 0, y: 1, blur: 2, spread: 0, color: 'rgb(255 255 255 / 0.7)', inset: true },
        { x: 0, y: -1, blur: 2, spread: 0, color: 'rgb(0 0 0 / 0.04)', inset: true },
      ],
      raised: [
        { x: 0, y: 4, blur: 12, spread: -2, color: 'rgb(15 23 42 / 0.08)' },
        { x: 0, y: 2, blur: 4, spread: -2, color: 'rgb(15 23 42 / 0.04)' },
      ],
      floating: [
        { x: 0, y: 12, blur: 24, spread: -8, color: 'rgb(15 23 42 / 0.12)' },
        { x: 0, y: 4, blur: 8, spread: -4, color: 'rgb(15 23 42 / 0.06)' },
      ],
      modal: [
        { x: 0, y: 40, blur: 100, spread: -30, color: 'rgb(0 0 0 / 0.45)' },
        { x: 0, y: 16, blur: 40, spread: -12, color: 'rgb(0 0 0 / 0.18)' },
      ],
    },
    dark: {
      sheet: [{ x: 0, y: 12, blur: 40, spread: -12, color: 'rgb(0 0 0 / 0.5)' }],
      'sheet-inset': [{ x: 0, y: 1, blur: 1, spread: 0, color: 'rgb(255 255 255 / 0.12)', inset: true }],
      raised: [
        { x: 0, y: 4, blur: 12, spread: -2, color: 'rgb(0 0 0 / 0.5)' },
        { x: 0, y: 2, blur: 4, spread: -2, color: 'rgb(0 0 0 / 0.3)' },
      ],
      floating: [
        { x: 0, y: 12, blur: 24, spread: -8, color: 'rgb(0 0 0 / 0.6)' },
        { x: 0, y: 4, blur: 8, spread: -4, color: 'rgb(0 0 0 / 0.4)' },
      ],
      modal: [
        { x: 0, y: 40, blur: 100, spread: -30, color: 'rgb(0 0 0 / 0.7)' },
        { x: 0, y: 16, blur: 40, spread: -12, color: 'rgb(0 0 0 / 0.5)' },
      ],
    },
  },
  modeStrings: {
    light: {
      // Lit from above: bright top and start edges, grey shaded ones (top end bottom start).
      'glass-edge': 'rgb(255 255 255 / 0.9) rgb(200 200 210 / 0.3) rgb(200 200 210 / 0.25) rgb(255 255 255 / 0.7)',
      'glass-edge-width': '1.5px',
      // The inner highlight of raised and floating glass.
      'glass-highlight': 'inset 0 1px 2px 0 rgb(255 255 255 / 0.8), inset 0 -1px 2px 0 rgb(0 0 0 / 0.05)',
      'glass-fill': 'linear-gradient(135deg, rgb(255 255 255 / 0.8) 0%, rgb(220 225 240 / 0.62) 40%, rgb(240 245 255 / 0.68) 70%, rgb(255 255 255 / 0.8) 100%)',
      'glass-fill-raised': 'linear-gradient(135deg, rgb(255 255 255 / 0.86) 0%, rgb(215 220 238 / 0.7) 40%, rgb(235 240 255 / 0.76) 70%, rgb(255 255 255 / 0.86) 100%)',
      'mark-gradient': 'linear-gradient(135deg, #38bdf8 0%, #6366f1 40%, #a855f7 100%)',
      'wordmark-gradient': 'linear-gradient(90deg, #0369a1, #4338ca, #7e22ce)',
    },
    dark: {
      'glass-edge': 'rgb(255 255 255 / 0.2) rgb(255 255 255 / 0.06) rgb(255 255 255 / 0.04) rgb(255 255 255 / 0.12)',
      'glass-edge-width': '1.5px',
      'glass-highlight': 'inset 0 1px 1px 0 rgb(255 255 255 / 0.15)',
      'glass-fill': 'linear-gradient(140deg, rgb(30 41 59 / 0.7) 0%, rgb(15 23 42 / 0.6) 45%, rgb(20 30 50 / 0.55) 100%)',
      'glass-fill-raised': 'linear-gradient(140deg, rgb(30 41 59 / 0.78) 0%, rgb(15 23 42 / 0.68) 45%, rgb(20 30 50 / 0.62) 100%)',
      'mark-gradient': 'linear-gradient(135deg, #38bdf8 0%, #6366f1 40%, #a855f7 100%)',
      'wordmark-gradient': 'linear-gradient(90deg, #38bdf8, #818cf8, #a855f7)',
    },
  },
  // The app's type scale: 24 px page titles, 18 px sections, 16 px
  // sub-sections, 14 px labels, tight tracking on titles.
  strings: {
    'font-size-display': '24px',
    'font-line-height-display': '32px',
    'font-size-h1': '24px',
    'font-line-height-h1': '32px',
    'font-size-h2': '18px',
    'font-line-height-h2': '28px',
    'font-size-h3': '16px',
    'font-line-height-h3': '24px',
    'font-size-label': '14px',
    'font-line-height-label': '20px',
    'font-tracking-h1': '-0.025em',
  },
  // The platform's own UI fonts, headings included (no web font to fetch).
  fonts: {
    display: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Noto Sans', 'Arial', 'sans-serif'],
    body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Noto Sans', 'Arial', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
  },
}

/**
 * Astrlabe · Sala de Controle (`data-ty-theme="astrlabe-controle"`): the
 * dark-operations variant of the Astrlabe identity for control rooms and
 * monitoring walls. No glass, square corners (2 px controls), deep blue-slate
 * surfaces, and the saturated state colours of operator consoles: ok green,
 * run cyan, wait amber, fail red, now magenta. Everything renders in a
 * monospace stack so columns of numbers line up.
 */
export const astrlabeControlePreset: ThemeConfig = {
  name: 'astrlabe-controle',
  label: 'Astrlabe · Sala de Controle',
  seeds: {
    brand: seedFromColor('#6366f1', 0.2),
    neutral: { hue: 257, chroma: 0.02 },
    danger: { hue: 12, chroma: 0.2 },
    warning: { hue: 75, chroma: 0.15 },
    success: { hue: 145, chroma: 0.16 },
    info: { hue: 185, chroma: 0.12 },
  },
  radius: 2,
  contrast: 'default',
  glass: false,
  cta: 'solid',
  pins: {
    light: {
      // The control room is always dark: the light mode carries the same
      // dark grounds and the light-on-dark indigo brand.
      brand: '#818cf8',
      'focus-ring': '#818cf8',
      'brand-strong': '#a5b4fc',
      'brand-soft': 'rgb(99 102 241 / 0.2)',
      'on-brand': '#1e1b4b',
      bg: '#131a22',
      surface: 'rgb(26 35 46 / 1)',
      'surface-raised': 'rgb(26 35 46 / 1)',
      'surface-solid': '#1a232e',
      'surface-raised-solid': '#1a232e',
      'surface-sunken': '#0e141b',
      line: '#2e3d4c',
      'line-strong': '#46586a',
      ink: '#e8eef4',
      'ink-2': '#bcc9d6',
      'ink-3': '#93a2b1',
      success: '#3fb950',
      info: '#39c5cf',
      warning: '#d29922',
      danger: '#f85149',
      neutral: '#93a2b1',
      'cursor-now': '#e34ba9',
    },
    dark: {
      brand: '#818cf8',
      'focus-ring': '#818cf8',
      'brand-strong': '#a5b4fc',
      'brand-soft': 'rgb(99 102 241 / 0.2)',
      'on-brand': '#1e1b4b',
      bg: '#131a22',
      surface: 'rgb(26 35 46 / 1)',
      'surface-raised': 'rgb(26 35 46 / 1)',
      'surface-solid': '#1a232e',
      'surface-raised-solid': '#1a232e',
      'surface-sunken': '#0e141b',
      line: '#2e3d4c',
      'line-strong': '#46586a',
      ink: '#e8eef4',
      'ink-2': '#bcc9d6',
      'ink-3': '#93a2b1',
      success: '#3fb950',
      info: '#39c5cf',
      warning: '#d29922',
      danger: '#f85149',
      neutral: '#93a2b1',
      'cursor-now': '#e34ba9',
    },
  },
  // Mono-friendly: one monospace stack for every role.
  fonts: {
    display: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    body: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
  },
}

/** Default hues with high contrast, opaque surfaces and a thicker focus ring. */
export const highContrastPreset: ThemeConfig = {
  name: 'high-contrast',
  label: 'High contrast',
  seeds: baseSeeds,
  radius: 10,
  contrast: 'high',
  glass: false,
  cta: 'solid',
}

export const presets: readonly ThemeConfig[] = [tympanPreset, fakhirPreset, astrlabePreset, astrlabeControlePreset, neutralPreset, highContrastPreset]
export const DEFAULT_THEME = 'tympan'
