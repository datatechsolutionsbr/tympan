// Renders an element's anatomy to an HTML string: the reference markup the
// React wrappers, the Dioxus bindings and the element's own upgrade must all
// produce. Pure: runs in Node (fixtures, tests) and in the browser.

import { bindingValue, holds, withDefaults, type AnatomyNode, type ElementDefinition, type Props } from './definition.ts'

const VOID = new Set(['input', 'br', 'hr', 'img', 'meta', 'link'])

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * The anatomy of `def` for `props`, with each slot filled by the given
 * (already escaped or trusted) HTML. Attributes keep their declared order;
 * `class` comes first.
 */
export function renderAnatomy(def: ElementDefinition, props: Props, slots: Record<string, string>, instanceId: string): string {
  if (!def.anatomy) return ''
  const resolved = withDefaults(def, props)
  const filled = new Set(Object.entries(slots).filter(([, html]) => html !== '').map(([name]) => name))
  const render = (node: AnatomyNode): string => {
    if (!holds(node.when, resolved, filled)) return ''
    if ('slot' in node) return slots[node.slot] ?? ''
    const attrs: string[] = []
    if (node.class) attrs.push(`class="${escapeHtml(node.class)}"`)
    for (const [name, binding] of Object.entries(node.attrs ?? {})) {
      const value = bindingValue(binding, resolved, filled, instanceId)
      if (value !== undefined) attrs.push(value === '' ? name : `${name}="${escapeHtml(value)}"`)
    }
    const open = `<${node.tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`
    if (VOID.has(node.tag)) return open
    return `${open}${(node.children ?? []).map(render).join('')}</${node.tag}>`
  }
  return render(def.anatomy)
}

/**
 * The host element around the anatomy: `data-ty-instance`, then every prop
 * (defaults applied) as a host attribute, the way the wrappers render it.
 */
export function renderElement(def: ElementDefinition, props: Props, slots: Record<string, string>, instanceId: string): string {
  const resolved = withDefaults(def, props)
  const attrs: string[] = [`data-ty-instance="${escapeHtml(instanceId)}"`]
  for (const [name, prop] of Object.entries(def.props)) {
    const v = resolved[name]
    if (v === undefined || v === false || v === '') continue
    attrs.push(prop.type === 'boolean' ? prop.attribute : `${prop.attribute}="${escapeHtml(String(v))}"`)
  }
  return `<${def.tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>${renderAnatomy(def, props, slots, instanceId)}</${def.tag}>`
}
