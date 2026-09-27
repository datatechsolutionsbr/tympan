// The theme palette's logic without the DOM: the catalogue, the stored
// choice, filtering and the rows. Shared by the element and its tests.

import catalogue from '@datatechsolutions/tympan-tokens/themes.json'

export type Mode = 'system' | 'light' | 'dark'
export type Density = 'compact' | 'default' | 'comfortable'
export const MODES: readonly Mode[] = ['system', 'light', 'dark']
export const DENSITIES: readonly Density[] = ['compact', 'default', 'comfortable']

export interface ThemeEntry {
  name: string
  label: string
  kind: 'preset' | 'print'
  fontsUrl: string | null
}

export const THEMES: readonly ThemeEntry[] = catalogue as ThemeEntry[]

export interface Appearance {
  theme: string
  mode: Mode
  density: Density
}

const isMode = (v: unknown): v is Mode => MODES.includes(v as Mode)
const isDensity = (v: unknown): v is Density => DENSITIES.includes(v as Density)
export const isTheme = (v: unknown): v is string => THEMES.some((t) => t.name === v)

/** The stored choice (the ThemeProvider format); fields that are not valid are dropped. */
export function readStored(storage: Pick<Storage, 'getItem'> | undefined, key: string): Partial<Appearance> {
  try {
    const raw = JSON.parse(storage?.getItem(key) ?? '{}') as Record<string, unknown>
    const out: Partial<Appearance> = {}
    if (isTheme(raw.theme)) out.theme = raw.theme
    if (isMode(raw.mode)) out.mode = raw.mode
    if (isDensity(raw.density)) out.density = raw.density
    return out
  } catch {
    return {}
  }
}

export function writeStored(storage: Pick<Storage, 'setItem'> | undefined, key: string, value: Appearance): void {
  try {
    storage?.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the choice still applies for this page.
  }
}

export function resolve(stored: Partial<Appearance>, defaults: Appearance): Appearance {
  return {
    theme: stored.theme ?? (isTheme(defaults.theme) ? defaults.theme : 'tympan'),
    mode: stored.mode ?? defaults.mode,
    density: stored.density ?? defaults.density,
  }
}

export type RowGroup = 'preset' | 'print' | 'mode' | 'density'

export interface Row {
  key: string
  group: RowGroup
  value: string
  label: string
  /** The theme's name (a code), shown beside a translated label. */
  hint?: string
  current: boolean
  /** Character positions of the query in the label. */
  marks: number[]
}

export interface Section {
  group: RowGroup
  heading: string
  rows: Row[]
}

export interface RowLabels {
  groups: Record<RowGroup, string>
  modes: Record<Mode, string>
  densities: Record<Density, string>
  themes: Record<string, string>
}

const fold = (s: string) => s.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

/** Positions of `query` in `label` (case and accent blind); `null` when it is not there. */
export function match(label: string, query: string, alsoIn: string[] = []): number[] | null {
  const q = fold(query.trim())
  if (!q) return []
  const at = fold(label).indexOf(q)
  if (at >= 0) return Array.from({ length: q.length }, (_, i) => at + i)
  return alsoIn.some((extra) => fold(extra).includes(q)) ? [] : null
}

/** The sections for `query`, in menu order; empty sections are left out. */
export function sections(query: string, current: Appearance, labels: RowLabels, offered?: ReadonlySet<string>): Section[] {
  const out: Section[] = []
  const push = (group: RowGroup, rows: Row[]) => {
    if (rows.length) out.push({ group, heading: labels.groups[group], rows })
  }
  const themeRows = (kind: 'preset' | 'print'): Row[] =>
    THEMES.filter((t) => t.kind === kind && (!offered || offered.has(t.name))).flatMap((t) => {
      const label = labels.themes[t.name] ?? t.label
      const marks = match(label, query, [t.name])
      return marks ? [{ key: `theme:${t.name}`, group: kind, value: t.name, label, hint: t.name, current: t.name === current.theme, marks }] : []
    })
  push('preset', themeRows('preset'))
  push('print', themeRows('print'))
  push(
    'mode',
    MODES.flatMap((m) => {
      const marks = match(labels.modes[m], query, [m])
      return marks ? [{ key: `mode:${m}`, group: 'mode' as const, value: m, label: labels.modes[m], current: m === current.mode, marks }] : []
    }),
  )
  push(
    'density',
    DENSITIES.flatMap((d) => {
      const marks = match(labels.densities[d], query, [d])
      return marks ? [{ key: `density:${d}`, group: 'density' as const, value: d, label: labels.densities[d], current: d === current.density, marks }] : []
    }),
  )
  return out
}

/** The appearance after choosing `row`. */
export function choose(current: Appearance, row: Row): Appearance {
  switch (row.group) {
    case 'preset':
    case 'print':
      return { ...current, theme: row.value }
    case 'mode':
      return { ...current, mode: row.value as Mode }
    case 'density':
      return { ...current, density: row.value as Density }
  }
}
