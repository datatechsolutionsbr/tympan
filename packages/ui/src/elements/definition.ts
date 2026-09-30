// The single source of a Tympan custom element: its properties, events,
// slots and light-DOM anatomy, as plain data. The element class reads it at
// runtime; tools/elements/generate.mjs reads it to write the React wrappers
// and the parity fixtures. Nothing here touches the DOM, so the generator
// can import it in Node.

export type Scalar = string | number | boolean

export interface PropDef {
  type: 'boolean' | 'string' | 'number' | 'enum'
  /** Allowed values of an `enum` property. */
  values?: readonly string[]
  default?: Scalar
  /** Attribute on the host element (kebab case). */
  attribute: string
  doc: string
}

/**
 * A condition on the rendered instance: `prop`, `!prop`, `prop:value`
 * (equality, for enum-valued props), `slot:name` or `!slot:name`;
 * alternatives joined with `|` (`slot:default|slot:description`).
 * All listed conditions must hold.
 */
export type Condition = string

/** Every binding may carry `when`: the attribute is left out unless the conditions hold. */
export type AttrBinding = (
  /** A fixed value. */
  | { value: string }
  /** The property's value as text; left out when it is undefined, empty or false. */
  | { prop: string }
  /** Present (empty) while the property is truthy (`data-busy=""`). */
  | { prop: string; kind: 'flag' }
  /** `"true"` while the property is truthy, left out otherwise (`aria-busy`). */
  | { prop: string; kind: 'bool' }
  /** A native boolean attribute (`disabled`, `checked`). */
  | { prop: string; kind: 'boolean-attr' }
  /**
   * The prop's value mapped through `values` (`role` from `urgency`); a
   * value the map does not cover leaves the attribute out. When the prop is
   * unset, `fallback` (another prop's map) decides.
   */
  | { prop: string; kind: 'map'; values: Record<string, string>; fallback?: { prop: string; values: Record<string, string> } }
  /** An id unique to the instance: `<instance id>-<suffix>`; a non-empty `prop` value wins (a surrounding field's control id). */
  | { idref: string; prop?: string }
  /**
   * Space-joined ids (`aria-describedby`): each `{ id, when }` contributes
   * `<instance id>-<id>` while its conditions hold, each `{ prop }` the
   * property's raw value while non-empty. Left out when nothing contributes.
   */
  | { idrefs: ReadonlyArray<{ id: string; when?: Condition[] } | { prop: string }> }
) & { when?: Condition[] }

export interface ElementNode {
  tag: string
  class?: string
  attrs?: Record<string, AttrBinding>
  when?: Condition[]
  children?: AnatomyNode[]
}

/** Where the host's own children go (the framework keeps owning them). */
export interface SlotNode {
  slot: string
  when?: Condition[]
}

/** Text taken from a prop's value (escaped at render), e.g. the notice's tone word. */
export interface TextNode {
  text: { prop: string }
  when?: Condition[]
}

export type AnatomyNode = ElementNode | SlotNode | TextNode

export interface EventDef {
  /** DOM event type (`click`, `change`, `ty-theme-change`). */
  type: string
  /** `native`: bubbled from a native control inside; `custom`: a CustomEvent the element dispatches. */
  kind: 'native' | 'custom'
  /** Fields of a custom event's `detail`. */
  detail?: Record<string, 'string' | 'boolean' | 'number'>
  /** Prop name on the React wrapper (`onThemeChange`). */
  reactProp: string
  doc: string
}

export interface Example {
  name: string
  props: Record<string, Scalar>
  /** Plain text for each slot (`default`, `description`, …). */
  slots: Record<string, string>
}

export interface ElementDefinition {
  tag: string
  /** PascalCase name: `TyButton`. */
  name: string
  /**
   * `enhancing`: the host framework renders the anatomy (from this
   * definition) and the element adds behaviour without moving any node.
   * `self-rendering`: the element owns its whole subtree (data-driven
   * composites); wrappers render an empty host.
   */
  kind: 'enhancing' | 'self-rendering'
  doc: string
  props: Record<string, PropDef>
  events: EventDef[]
  slots?: Record<string, { doc: string }>
  anatomy?: ElementNode
  examples: Example[]
}

export type Props = Record<string, Scalar | undefined>

/** The props with each definition default applied. */
export function withDefaults(def: ElementDefinition, props: Props): Props {
  const out: Props = { ...props }
  for (const [name, prop] of Object.entries(def.props)) {
    if (out[name] === undefined && prop.default !== undefined) out[name] = prop.default
  }
  return out
}

const truthy = (v: Scalar | undefined) => v !== undefined && v !== false && v !== ''

/** Whether every condition holds for these props and filled slots. */
export function holds(conditions: Condition[] | undefined, props: Props, slots: ReadonlySet<string>): boolean {
  if (!conditions) return true
  const one = (c: string) => {
    const negated = c.startsWith('!')
    const body = negated ? c.slice(1) : c
    let value: boolean
    if (body.startsWith('slot:')) value = slots.has(body.slice(5))
    else if (body.includes(':')) {
      const cut = body.indexOf(':')
      value = String(props[body.slice(0, cut)]) === body.slice(cut + 1)
    } else value = truthy(props[body])
    return negated ? !value : value
  }
  return conditions.every((c) => c.split('|').some(one))
}

/**
 * The attribute value a binding yields, or `undefined` to leave the
 * attribute out. Boolean attributes and flags yield `""`.
 */
export function bindingValue(binding: AttrBinding, props: Props, slots: ReadonlySet<string>, instanceId: string): string | undefined {
  if (!holds(binding.when, props, slots)) return undefined
  if ('value' in binding) return binding.value
  if ('idref' in binding) {
    const override = binding.prop !== undefined ? props[binding.prop] : undefined
    if (truthy(override)) return String(override)
    return `${instanceId}-${binding.idref}`
  }
  if ('idrefs' in binding) {
    const ids: string[] = []
    for (const entry of binding.idrefs) {
      if ('id' in entry) {
        if (holds(entry.when, props, slots)) ids.push(`${instanceId}-${entry.id}`)
      } else {
        const raw = props[entry.prop]
        if (truthy(raw)) ids.push(String(raw))
      }
    }
    return ids.length ? ids.join(' ') : undefined
  }
  const v = props[binding.prop]
  if (!('kind' in binding)) return truthy(v) ? String(v) : undefined
  switch (binding.kind) {
    case 'flag':
    case 'boolean-attr':
      return truthy(v) ? '' : undefined
    case 'bool':
      return truthy(v) ? 'true' : undefined
    case 'map': {
      if (truthy(v)) return binding.values[String(v)]
      if (binding.fallback) {
        const fv = props[binding.fallback.prop]
        if (truthy(fv)) return binding.fallback.values[String(fv)]
      }
      return undefined
    }
  }
}

/** Every element part (nodes with a class), depth first. */
export function parts(node: ElementNode): ElementNode[] {
  const out: ElementNode[] = [node]
  for (const child of node.children ?? []) if ('tag' in child) out.push(...parts(child))
  return out
}

/** kebab-case attribute name → camelCase property name. */
export const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
