import { useMemo } from 'react'

/**
 * Every component takes `labels?: Partial<XLabels>` and ships `defaultXLabels`
 * (English) as data; hosts pass their i18n adapter's strings. Components hold
 * no inline copy.
 */
export function useLabels<L extends object>(defaults: L, overrides: Partial<L> | undefined): L {
  return useMemo(() => (overrides ? { ...defaults, ...stripUndefined(overrides) } : defaults), [defaults, overrides])
}

function stripUndefined<L extends object>(o: Partial<L>): Partial<L> {
  const out: Partial<L> = {}
  for (const [k, v] of Object.entries(o)) if (v !== undefined) (out as Record<string, unknown>)[k] = v
  return out
}

/** Fills `{name}` placeholders of a label template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? String(values[key]) : m))
}
