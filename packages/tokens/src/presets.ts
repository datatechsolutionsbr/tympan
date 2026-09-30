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
 * where text needs 4.5:1 on light grounds), translucent glass surfaces and the
 * rounder corners of that app (12 px controls, about 20 px cards). The call to
 * action is the indigo to purple gradient its primary buttons fill with, and
 * text (headings included) uses the platform's own system fonts.
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
      'surface-raised': 'rgb(255 255 255 / 0.9)',
      'surface-solid': '#ffffff',
      'surface-raised-solid': '#ffffff',
      'surface-sunken': '#f1f5f9',
      line: 'rgb(148 163 184 / 0.3)',
      'line-strong': 'rgb(100 116 139 / 0.4)',
      ink: '#0f172a',
      'ink-2': '#334155',
      'ink-3': '#546175',
      success: '#15803d',
      warning: '#a16207',
      danger: '#b91c1c',
      neutral: '#546175',
    },
    dark: {
      brand: '#818cf8',
      'focus-ring': '#818cf8',
      'brand-strong': '#a5b4fc',
      'brand-soft': 'rgb(99 102 241 / 0.2)',
      'on-brand': '#1e1b4b',
      bg: '#020617',
      surface: 'rgb(30 41 59 / 0.62)',
      'surface-raised': 'rgb(30 41 59 / 0.86)',
      'surface-solid': '#131c2f',
      'surface-raised-solid': '#1b2539',
      'surface-sunken': '#0b1222',
      line: 'rgb(148 163 184 / 0.18)',
      'line-strong': 'rgb(148 163 184 / 0.32)',
      ink: '#f8fafc',
      'ink-2': '#cbd5e1',
      'ink-3': '#94a3b8',
      success: '#4ade80',
      warning: '#fbbf24',
      danger: '#f87171',
      neutral: '#94a3b8',
    },
  },
  ctaPins: {
    light: ['#4f46e5', '#7c3aed', '#9333ea'],
    dark: ['#4f46e5', '#7c3aed', '#9333ea'],
  },
  // The platform's own UI fonts, headings included (no web font to fetch).
  fonts: {
    display: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Noto Sans', 'Arial', 'sans-serif'],
    body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Noto Sans', 'Arial', 'sans-serif'],
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

export const presets: readonly ThemeConfig[] = [tympanPreset, fakhirPreset, astrlabePreset, neutralPreset, highContrastPreset]
export const DEFAULT_THEME = 'tympan'
