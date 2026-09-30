// A canonical form of an HTML fragment for comparing markup from different
// renderers: elements with sorted attributes (HTML boolean attributes as
// presence), non-blank text.

const BOOLEAN = new Set(['disabled', 'checked', 'hidden', 'open', 'readonly', 'required', 'selected', 'multiple'])

export type Canon = { tag: string; attrs: Record<string, string>; children: Canon[] } | string

function canonNode(node: Node): Canon | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').trim()
    return text ? text : null
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null
  const element = node as Element
  const attrs: Record<string, string> = {}
  for (const name of element.getAttributeNames().sort()) {
    const value = element.getAttribute(name) ?? ''
    if (BOOLEAN.has(name) && value === 'false') continue
    attrs[name] = BOOLEAN.has(name) ? '' : value
  }
  return { tag: element.localName, attrs, children: canonChildren(element) }
}

function canonChildren(parent: Node): Canon[] {
  return Array.from(parent.childNodes)
    .map(canonNode)
    .filter((c): c is Canon => c !== null)
}

export function canon(html: string): Canon[] {
  const template = document.createElement('template')
  template.innerHTML = html
  return canonChildren(template.content)
}

export function canonElement(element: Element): Canon[] {
  return canonChildren(element)
}
