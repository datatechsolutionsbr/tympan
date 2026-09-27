// Base class of every Tympan custom element (light DOM, no shadow root).
//
// An *enhancing* element finds its anatomy already rendered by the host
// framework (from the same definition, through a generated wrapper) and only
// keeps the bound attributes in step and adds behaviour: it never moves or
// replaces a node the framework owns. Used from plain HTML with just its
// content (`<ty-button variant="primary">Save</ty-button>`), it builds the
// anatomy itself once, moving its children into the slots, and from then on
// re-renders it on every attribute change.
//
// A *self-rendering* element owns its whole subtree; frameworks render an
// empty host and pass data as attributes.

import { bindingValue, holds, withDefaults, type ElementDefinition, type ElementNode, type AnatomyNode, type Props } from './definition.ts'

let instances = 0

// Outside a browser (server rendering, the generator) there is no
// HTMLElement to extend; the classes still load, and are never defined.
const ElementBase = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement

const firstClass = (node: ElementNode) => (node.class ?? '').split(/\s+/)[0] ?? ''

export abstract class TyElement extends ElementBase {
  static definition: ElementDefinition

  static get observedAttributes(): string[] {
    return [...Object.values(this.definition.props).map((p) => p.attribute), 'data-ty-instance']
  }

  #instance: string | undefined
  #owned = false
  #slots = new Map<string, Node[]>()

  get definition(): ElementDefinition {
    return (this.constructor as typeof TyElement).definition
  }

  /** Suffix base of the ids the anatomy needs (`aria-describedby`); wrappers pass theirs as `data-ty-instance`. */
  get instanceId(): string {
    return this.getAttribute('data-ty-instance') || this.id || (this.#instance ??= `ty-${++instances}`)
  }

  /** The current props, read from the host attributes, defaults applied. */
  get props(): Props {
    const out: Props = {}
    for (const [name, prop] of Object.entries(this.definition.props)) {
      if (prop.type === 'boolean') out[name] = this.hasAttribute(prop.attribute)
      else {
        const raw = this.getAttribute(prop.attribute)
        if (raw !== null) out[name] = prop.type === 'number' ? Number(raw) : raw
      }
    }
    return withDefaults(this.definition, out)
  }

  /** Whether this element built its own anatomy (plain HTML use). */
  get owned(): boolean {
    return this.#owned
  }

  connectedCallback(): void {
    if (this.definition.kind === 'enhancing' && this.definition.anatomy) {
      if (!this.anatomyRoot()) this.#adopt()
      this.sync()
    }
    this.connected()
  }

  disconnectedCallback(): void {
    this.disconnected()
  }

  attributeChangedCallback(): void {
    if (this.isConnected && this.definition.kind === 'enhancing') this.sync()
    this.changed()
  }

  /** Hooks for subclasses. */
  protected connected(): void {}
  protected disconnected(): void {}
  protected changed(): void {}

  /** The anatomy's root element, when it is rendered. */
  anatomyRoot(): HTMLElement | null {
    const anatomy = this.definition.anatomy
    if (!anatomy) return null
    for (const child of Array.from(this.children)) if (child.classList.contains(firstClass(anatomy))) return child as HTMLElement
    return null
  }

  /** Bring the anatomy in step with the props. */
  sync(): void {
    const anatomy = this.definition.anatomy
    if (!anatomy) return
    if (this.#owned) {
      this.#patch(anatomy)
      return
    }
    // Framework-rendered: only the attributes of the parts that exist.
    const props = this.props
    const filled = this.#filledSlots()
    const visit = (node: ElementNode, element: Element) => {
      for (const [name, binding] of Object.entries(node.attrs ?? {})) {
        // A control's live state belongs to the framework that renders it.
        if (LIVE.has(name) && 'kind' in binding && binding.kind === 'boolean-attr') continue
        const value = bindingValue(binding, props, filled, this.instanceId)
        if (value === undefined) element.removeAttribute(name)
        else if (element.getAttribute(name) !== value) element.setAttribute(name, value)
      }
      // Same-class siblings (an icon's glyphs) each match their own
      // counterpart; `used` keeps the second path off the first.
      const used = new Set<Element>()
      for (const child of node.children ?? []) {
        if (!('tag' in child) || !child.class) continue
        const match = Array.from(element.children).find((c) => !used.has(c) && c.classList.contains(firstClass(child)))
        if (match) {
          used.add(match)
          visit(child, match)
        }
      }
    }
    const root = this.anatomyRoot()
    if (root) visit(anatomy, root)
  }

  /** Dispatch a bubbling, composed CustomEvent. */
  protected emit(type: string, detail?: unknown): boolean {
    return this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true, cancelable: true }))
  }

  #filledSlots(): Set<string> {
    if (this.#owned) return new Set([...this.#slots].filter(([, nodes]) => nodes.some(isContent)).map(([name]) => name))
    // Framework-rendered: a slot is filled when its part is rendered with content.
    const filled = new Set<string>()
    const walk = (node: AnatomyNode, element: Element | null) => {
      if ('slot' in node) {
        if (element && Array.from(element.childNodes).some(isContent)) filled.add(node.slot)
        return
      }
      if (!('tag' in node)) return
      for (const child of node.children ?? []) {
        if ('slot' in child) walk(child, element)
        else if (element && 'tag' in child && child.class) walk(child, Array.from(element.children).find((c) => c.classList.contains(firstClass(child))) ?? null)
      }
    }
    if (this.definition.anatomy) walk(this.definition.anatomy, this.anatomyRoot())
    return filled
  }

  /** Plain HTML: take the children as slot content and build the anatomy. */
  #adopt(): void {
    for (const node of Array.from(this.childNodes)) {
      const slot = node instanceof Element && node.hasAttribute('slot') ? node.getAttribute('slot')! : 'default'
      const list = this.#slots.get(slot) ?? []
      list.push(node)
      this.#slots.set(slot, list)
    }
    this.#owned = true
  }

  /**
   * Plain HTML: render the anatomy into this element, reusing every node
   * that is still wanted (matched by class) so a focused control keeps
   * focus, and moving only what changed.
   */
  #patch(anatomy: ElementNode): void {
    const props = this.props
    const filled = this.#filledSlots()
    const render = (node: AnatomyNode, existing: Element | null, svg: boolean): Node[] => {
      if (!holds(node.when, props, filled)) return []
      if ('slot' in node) return this.#slots.get(node.slot) ?? []
      if ('text' in node) {
        const value = props[node.text.prop]
        return value === undefined || value === false || value === '' ? [] : [document.createTextNode(String(value))]
      }
      const inSvg = svg || node.tag === 'svg'
      const element = existing ?? (inSvg ? document.createElementNS(SVG_NS, node.tag) : document.createElement(node.tag))
      if (!existing && node.class) element.setAttribute('class', node.class)
      for (const [name, binding] of Object.entries(node.attrs ?? {})) {
        const value = bindingValue(binding, props, filled, this.instanceId)
        // After the first render a control's state is its property: the
        // attribute stays the initial state a form reset returns to.
        if (existing && LIVE.has(name) && 'kind' in binding && binding.kind === 'boolean-attr') {
          ;(element as unknown as Record<string, boolean>)[name] = value !== undefined
          continue
        }
        if (value === undefined) element.removeAttribute(name)
        else if (element.getAttribute(name) !== value) element.setAttribute(name, value)
      }
      const used = new Set<Element>()
      const wanted: Node[] = []
      for (const child of node.children ?? []) {
        if ('slot' in child || 'text' in child) {
          wanted.push(...render(child, null, inSvg))
          continue
        }
        const match = Array.from(element.children).find((c) => !used.has(c) && c.localName === child.tag && c.classList.contains(firstClass(child))) ?? null
        if (match) used.add(match)
        wanted.push(...render(child, match, inSvg))
      }
      wanted.forEach((child, index) => {
        if (element.childNodes[index] !== child) element.insertBefore(child, element.childNodes[index] ?? null)
      })
      while (element.childNodes.length > wanted.length) element.lastChild!.remove()
      return [element]
    }
    const root = this.anatomyRoot()
    const built = render(anatomy, root, false)[0]
    if (built && built !== root) this.replaceChildren(built)
  }
}

/** Attributes whose live value is a property (`checked`), not the attribute. */
const LIVE = new Set(['checked', 'selected'])

/** Anatomy in the SVG namespace (icons): created with `createElementNS` so plain-HTML use renders it. */
const SVG_NS = 'http://www.w3.org/2000/svg'

const isContent = (node: Node) => node.nodeType !== Node.TEXT_NODE || (node.textContent ?? '').trim() !== ''

/** Define `cls` under its tag, with a property accessor per definition prop. Idempotent. */
export function defineTympanElement(cls: typeof TyElement & (new () => TyElement)): void {
  const def = cls.definition
  if (typeof customElements === 'undefined' || customElements.get(def.tag)) return
  for (const [name, prop] of Object.entries(def.props)) {
    if (Object.prototype.hasOwnProperty.call(cls.prototype, name)) continue
    Object.defineProperty(cls.prototype, name, {
      configurable: true,
      get(this: HTMLElement) {
        if (prop.type === 'boolean') return this.hasAttribute(prop.attribute)
        const raw = this.getAttribute(prop.attribute)
        if (raw === null) return prop.default
        return prop.type === 'number' ? Number(raw) : raw
      },
      set(this: HTMLElement, value: unknown) {
        if (prop.type === 'boolean') this.toggleAttribute(prop.attribute, Boolean(value))
        else if (value === null || value === undefined) this.removeAttribute(prop.attribute)
        else this.setAttribute(prop.attribute, String(value))
      },
    })
  }
  customElements.define(def.tag, cls)
}
