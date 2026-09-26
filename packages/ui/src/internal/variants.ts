// Variants declared as data. A component lists its variant axes and their
// allowed values once; the returned function validates props, applies
// defaults and yields `data-*` attributes that the component's CSS selects on
// (`.fk-button[data-variant='primary']`). No class strings are generated.

export type VariantConfig = Record<string, readonly string[]>

type Selection<C extends VariantConfig> = { [K in keyof C]?: C[K][number] }
type Resolved<C extends VariantConfig> = { [K in keyof C]: C[K][number] }
type DataAttributes<C extends VariantConfig> = { [K in keyof C as `data-${K & string}`]: C[K][number] }

export interface Variants<C extends VariantConfig> {
  /** Resolved values with defaults applied. */
  resolve(selection: Selection<C>): Resolved<C>
  /** `data-*` attributes for the resolved values. */
  attributes(selection: Selection<C>): DataAttributes<C>
  /** The declared axes (for documentation, galleries and tests). */
  readonly axes: C
  readonly defaults: Resolved<C>
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

export function variants<const C extends VariantConfig>(axes: C, defaults: Resolved<C>): Variants<C> {
  const resolve = (selection: Selection<C>): Resolved<C> => {
    const out = { ...defaults }
    for (const key of Object.keys(axes) as Array<keyof C>) {
      const value = selection[key]
      if (value === undefined) continue
      if (!axes[key]!.includes(value as string)) {
        throw new Error(`Unknown ${String(key)} "${String(value)}"; expected one of ${axes[key]!.join(', ')}.`)
      }
      out[key] = value as Resolved<C>[typeof key]
    }
    return out
  }
  return {
    axes,
    defaults,
    resolve,
    attributes(selection) {
      const resolved = resolve(selection)
      const attrs: Record<string, string> = {}
      for (const [k, v] of Object.entries(resolved)) attrs[`data-${kebab(k)}`] = v as string
      return attrs as DataAttributes<C>
    },
  }
}
