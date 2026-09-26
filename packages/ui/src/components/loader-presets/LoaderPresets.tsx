import { createContext, useContext, type ReactNode } from 'react'
import { devWarning } from '../../internal/dev'
import { BrandMark } from '../brand-mark/BrandMark'

/**
 * Tone names accepted by presets: the closed set of wave-4/tone-tint-resolver
 * (accent, the four semantic tones, categorical-1…8).
 */
export const loaderToneNames = [
  'accent',
  'success',
  'pending',
  'error',
  'neutral',
  ...Array.from({ length: 8 }, (_, i) => `categorical-${i + 1}` as const),
] as const
export type LoaderTone = (typeof loaderToneNames)[number]

/** Custom property holding the tone colour, read by the BrandLoader stylesheet. */
export function loaderToneColour(tone: LoaderTone): string {
  if (tone.startsWith('categorical-')) return `var(--ty-${tone})`
  const semantic: Record<string, string> = {
    accent: 'var(--ty-accent)',
    success: 'var(--ty-success)',
    pending: 'var(--ty-warning)',
    error: 'var(--ty-danger)',
    neutral: 'var(--ty-ink-3)',
  }
  return semantic[tone] ?? semantic.accent!
}

export interface LoaderPreset {
  id: string
  /** Product name shown under the mark; the brand name when omitted. */
  name?: string
  mark: ReactNode
  tone: LoaderTone
  /** Default loading phrase (already translated by the host). */
  label?: string
}

export interface LoaderPresetRegistry {
  resolve(id: string): LoaderPreset | undefined
  ids(): string[]
}

/** The only preset shipped: the product mark and the accent tone. */
export const defaultLoaderPreset: LoaderPreset = Object.freeze({
  id: 'default',
  mark: <BrandMark showWordmark={false} size="large" />,
  tone: 'accent',
})

const isTone = (value: unknown): value is LoaderTone => (loaderToneNames as readonly unknown[]).includes(value)

/** Validates presets (unique ids, known tones) and returns a registry that always holds `default`. */
export function createLoaderPresets(presets: readonly LoaderPreset[]): LoaderPresetRegistry {
  const byId: Record<string, LoaderPreset> = Object.create(null)
  for (const p of presets) {
    if (p.id in byId) throw new Error(`createLoaderPresets: preset id "${p.id}" is used twice.`)
    if (!isTone(p.tone)) throw new Error(`createLoaderPresets: preset "${p.id}" has tone "${String(p.tone)}", which is not a tone name (${loaderToneNames.join(', ')}).`)
    byId[p.id] = p
  }
  if (!('default' in byId)) byId.default = defaultLoaderPreset
  return { resolve: (id) => byId[id], ids: () => Object.keys(byId) }
}

const RegistryContext = createContext<LoaderPresetRegistry | null>(null)

export function LoaderPresetProvider({ registry, children }: { registry: LoaderPresetRegistry; children: ReactNode }) {
  return <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>
}

/** Resolves a preset id; unknown ids fall back to `default` (with a development warning). */
export function useLoaderPreset(id = 'default'): LoaderPreset {
  const registry = useContext(RegistryContext)
  const found = registry ? registry.resolve(id) : id === 'default' ? defaultLoaderPreset : undefined
  devWarning(!found, `useLoaderPreset: no preset "${id}"; using "default".`)
  return found ?? registry?.resolve('default') ?? defaultLoaderPreset
}
