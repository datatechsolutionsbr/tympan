// Generates, from each custom element's definition (packages/ui/src/elements/*/definition.ts):
//
//   packages/ui/src/elements/react/<Name>.tsx   React wrapper (renders the anatomy, wires the events)
//   packages/ui/test/elements/fixtures/...      reference HTML of every example (renderElement)
//
// Usage: node tools/elements/generate.mjs [--check]
// --check writes nothing and exits 1 when a generated file is out of date.

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { actionMenuDefinition } from '../../packages/ui/src/elements/action-menu/definition.ts'
import { avatarDefinition } from '../../packages/ui/src/elements/avatar/definition.ts'
import { brandWordmarkDefinition } from '../../packages/ui/src/elements/brand-wordmark/definition.ts'
import { breadcrumbsDefinition } from '../../packages/ui/src/elements/breadcrumbs/definition.ts'
import { commandPaletteDefinition } from '../../packages/ui/src/elements/command-palette/definition.ts'
import { currencyFieldDefinition } from '../../packages/ui/src/elements/currency-field/definition.ts'
import { dataTableDefinition } from '../../packages/ui/src/elements/data-table/definition.ts'
import { headingDefinition } from '../../packages/ui/src/elements/heading/definition.ts'
import { markdownViewDefinition } from '../../packages/ui/src/elements/markdown-view/definition.ts'
import { notificationCenterDefinition } from '../../packages/ui/src/elements/notification-center/definition.ts'
import { pageHeaderDefinition } from '../../packages/ui/src/elements/page-header/definition.ts'
import { progressBarDefinition } from '../../packages/ui/src/elements/progress-bar/definition.ts'
import { sectionHeadingDefinition } from '../../packages/ui/src/elements/section-heading/definition.ts'
import { segmentedControlDefinition } from '../../packages/ui/src/elements/segmented-control/definition.ts'
import { skipLinkDefinition } from '../../packages/ui/src/elements/skip-link/definition.ts'
import { tabsDefinition } from '../../packages/ui/src/elements/tabs/definition.ts'
import { tagFieldDefinition } from '../../packages/ui/src/elements/tag-field/definition.ts'
import { toastDefinition } from '../../packages/ui/src/elements/toast/definition.ts'
import { wheelPickerDefinition } from '../../packages/ui/src/elements/wheel-picker/definition.ts'
import { buttonDefinition } from '../../packages/ui/src/elements/button/definition.ts'
import { checkboxDefinition } from '../../packages/ui/src/elements/checkbox/definition.ts'
import { drawerDefinition } from '../../packages/ui/src/elements/drawer/definition.ts'
import { gradientMarkDefinition } from '../../packages/ui/src/elements/gradient-mark/definition.ts'
import { inlineNoticeDefinition } from '../../packages/ui/src/elements/inline-notice/definition.ts'
import { linkDefinition } from '../../packages/ui/src/elements/link/definition.ts'
import { modalDefinition } from '../../packages/ui/src/elements/modal/definition.ts'
import { nativeSelectDefinition } from '../../packages/ui/src/elements/native-select/definition.ts'
import { popoverDefinition } from '../../packages/ui/src/elements/popover/definition.ts'
import { separatorDefinition } from '../../packages/ui/src/elements/separator/definition.ts'
import { skeletonDefinition } from '../../packages/ui/src/elements/skeleton/definition.ts'
import { spinnerDefinition } from '../../packages/ui/src/elements/spinner/definition.ts'
import { statusPillDefinition } from '../../packages/ui/src/elements/status-pill/definition.ts'
import { surfaceDefinition } from '../../packages/ui/src/elements/surface/definition.ts'
import { switchDefinition } from '../../packages/ui/src/elements/switch/definition.ts'
import { tagDefinition } from '../../packages/ui/src/elements/tag/definition.ts'
import { textAreaDefinition } from '../../packages/ui/src/elements/text-area/definition.ts'
import { textFieldDefinition } from '../../packages/ui/src/elements/text-field/definition.ts'
import { themePaletteDefinition } from '../../packages/ui/src/elements/theme-palette/definition.ts'
import { renderElement } from '../../packages/ui/src/elements/anatomy.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const check = process.argv.includes('--check')

const DEFINITIONS = [
  [actionMenuDefinition, 'packages/ui/src/elements/action-menu/definition.ts'],
  [avatarDefinition, 'packages/ui/src/elements/avatar/definition.ts'],
  [brandWordmarkDefinition, 'packages/ui/src/elements/brand-wordmark/definition.ts'],
  [breadcrumbsDefinition, 'packages/ui/src/elements/breadcrumbs/definition.ts'],
  [commandPaletteDefinition, 'packages/ui/src/elements/command-palette/definition.ts'],
  [currencyFieldDefinition, 'packages/ui/src/elements/currency-field/definition.ts'],
  [dataTableDefinition, 'packages/ui/src/elements/data-table/definition.ts'],
  [headingDefinition, 'packages/ui/src/elements/heading/definition.ts'],
  [markdownViewDefinition, 'packages/ui/src/elements/markdown-view/definition.ts'],
  [notificationCenterDefinition, 'packages/ui/src/elements/notification-center/definition.ts'],
  [pageHeaderDefinition, 'packages/ui/src/elements/page-header/definition.ts'],
  [progressBarDefinition, 'packages/ui/src/elements/progress-bar/definition.ts'],
  [sectionHeadingDefinition, 'packages/ui/src/elements/section-heading/definition.ts'],
  [segmentedControlDefinition, 'packages/ui/src/elements/segmented-control/definition.ts'],
  [skipLinkDefinition, 'packages/ui/src/elements/skip-link/definition.ts'],
  [tabsDefinition, 'packages/ui/src/elements/tabs/definition.ts'],
  [tagFieldDefinition, 'packages/ui/src/elements/tag-field/definition.ts'],
  [toastDefinition, 'packages/ui/src/elements/toast/definition.ts'],
  [wheelPickerDefinition, 'packages/ui/src/elements/wheel-picker/definition.ts'],
  [buttonDefinition, 'packages/ui/src/elements/button/definition.ts'],
  [checkboxDefinition, 'packages/ui/src/elements/checkbox/definition.ts'],
  [drawerDefinition, 'packages/ui/src/elements/drawer/definition.ts'],
  [gradientMarkDefinition, 'packages/ui/src/elements/gradient-mark/definition.ts'],
  [inlineNoticeDefinition, 'packages/ui/src/elements/inline-notice/definition.ts'],
  [linkDefinition, 'packages/ui/src/elements/link/definition.ts'],
  [modalDefinition, 'packages/ui/src/elements/modal/definition.ts'],
  [nativeSelectDefinition, 'packages/ui/src/elements/native-select/definition.ts'],
  [popoverDefinition, 'packages/ui/src/elements/popover/definition.ts'],
  [separatorDefinition, 'packages/ui/src/elements/separator/definition.ts'],
  [skeletonDefinition, 'packages/ui/src/elements/skeleton/definition.ts'],
  [spinnerDefinition, 'packages/ui/src/elements/spinner/definition.ts'],
  [statusPillDefinition, 'packages/ui/src/elements/status-pill/definition.ts'],
  [surfaceDefinition, 'packages/ui/src/elements/surface/definition.ts'],
  [switchDefinition, 'packages/ui/src/elements/switch/definition.ts'],
  [tagDefinition, 'packages/ui/src/elements/tag/definition.ts'],
  [textAreaDefinition, 'packages/ui/src/elements/text-area/definition.ts'],
  [textFieldDefinition, 'packages/ui/src/elements/text-field/definition.ts'],
  [themePaletteDefinition, 'packages/ui/src/elements/theme-palette/definition.ts'],
]

// The instance id the fixtures render with.
const FIXTURE_INSTANCE = 'i'

const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const header = (source, comment) => `${comment} Generated by tools/elements/generate.mjs from ${source}. Do not edit.`

// ---------------------------------------------------------------------------
// React
// ---------------------------------------------------------------------------

const REACT_ATTR = { class: 'className', for: 'htmlFor', readonly: 'readOnly', tabindex: 'tabIndex', spellcheck: 'spellCheck', autocomplete: 'autoComplete', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin' }

// React writes these HTML boolean attributes only for a truthy value.
const HTML_BOOLEAN = new Set(['checked', 'disabled', 'hidden', 'open', 'readonly', 'required', 'selected', 'multiple'])

function tsType(prop) {
  if (prop.type === 'boolean') return 'boolean'
  if (prop.type === 'number') return 'number'
  if (prop.type === 'enum') return prop.values.map((v) => JSON.stringify(v)).join(' | ')
  return 'string'
}

function reactCondition(condition) {
  return condition
    .split('|')
    .map((c) => {
      const negated = c.startsWith('!')
      const body = negated ? c.slice(1) : c
      let expr
      if (body.startsWith('slot:')) expr = `slots[${JSON.stringify(body.slice(5))}]`
      else if (body.includes(':')) {
        const cut = body.indexOf(':')
        expr = `p.${camel(body.slice(0, cut))} === ${JSON.stringify(body.slice(cut + 1))}`
      } else expr = `truthy(p.${camel(body)})`
      return negated ? `!(${expr})` : expr
    })
    .join(' || ')
}
const reactWhen = (when) => (when?.length ? when.map((c) => `(${reactCondition(c)})`).join(' && ') : null)

/** Whether any condition in the anatomy references a filled slot (the wrapper's `slots`/`filled` are only read then). */
function usesSlotConditions(def) {
  const walk = (node) => {
    const conds = [...(node.when ?? []), ...Object.values(node.attrs ?? {}).flatMap((b) => b.when ?? [])]
    if (conds.some((c) => c.includes('slot:'))) return true
    return (node.children ?? []).some(walk)
  }
  return def.anatomy ? walk(def.anatomy) : false
}

function reactBinding(def, name, binding, tag) {
  let value
  if ('value' in binding) {
    // A fixed HTML boolean attribute is `true` in React, not "" or "true".
    value = HTML_BOOLEAN.has(name) && (binding.value === 'true' || binding.value === '') ? 'true' : JSON.stringify(binding.value)
  }
  else if ('idref' in binding) value = binding.prop ? `(text(p.${camel(binding.prop)}) ?? \`\${instance}-${binding.idref}\`)` : `\`\${instance}-${binding.idref}\``
  else if ('idrefs' in binding) {
    const parts = binding.idrefs.map((entry) => {
      if ('id' in entry) {
        const id = `\`\${instance}-${entry.id}\``
        const cond = reactWhen(entry.when)
        return cond ? `((${cond}) ? ${id} : '')` : id
      }
      return `text(p.${camel(entry.prop)}) ?? ''`
    })
    value = `[${parts.join(', ')}].filter(Boolean).join(' ') || undefined`
  }
  else if (!('kind' in binding)) {
    // A numeric prop stays a number (`rows`); React's typed attributes reject strings.
    value = `p.${camel(binding.prop)}`
  }
  else if (binding.kind === 'flag') value = `truthy(p.${camel(binding.prop)}) ? '' : undefined`
  else if (binding.kind === 'bool') value = `truthy(p.${camel(binding.prop)}) ? 'true' : undefined`
  else if (binding.kind === 'map') {
    const map = `(${JSON.stringify(binding.values)} as Record<string, string>)[String(p.${camel(binding.prop)})]`
    value = binding.fallback
      ? `truthy(p.${camel(binding.prop)}) ? ${map} : (${JSON.stringify(binding.fallback.values)} as Record<string, string>)[String(p.${camel(binding.fallback.prop)})]`
      : `truthy(p.${camel(binding.prop)}) ? ${map} : undefined`
  }
  else if (binding.kind === 'boolean-attr') {
    // React keeps a checkbox's state as a property; the wrapper is controlled.
    value = name === 'checked' && tag === 'input' ? `Boolean(p.${camel(binding.prop)})` : `truthy(p.${camel(binding.prop)}) || undefined`
  }
  const when = reactWhen(binding.when)
  return [REACT_ATTR[name] ?? name, when ? `${when} ? (${value}) : undefined` : value]
}

function reactNode(def, node, indent) {
  const pad = ' '.repeat(indent)
  if ('slot' in node) {
    const expr = node.slot === 'default' ? 'props.children' : `props.${camel(node.slot)}`
    const when = reactWhen(node.when)
    return when ? `${pad}(${when}) ? ${expr} : null` : `${pad}${expr}`
  }
  if ('text' in node) {
    const value = `text(p.${camel(node.text.prop)})`
    const when = reactWhen(node.when)
    return when ? `${pad}(${when}) ? ${value} : null` : `${pad}${value}`
  }
  const attrs = []
  if (node.class) attrs.push(['className', JSON.stringify(node.class)])
  for (const [name, binding] of Object.entries(node.attrs ?? {})) attrs.push(reactBinding(def, name, binding, node.tag))
  for (const event of def.events.filter((e) => e.kind === 'native' && eventTargets(def, e).includes(node))) {
    const detail = Object.keys(event.detail ?? {})
    // Annotate the target: React 19 types resolve a bare param to HTMLElement.
    const dom = { input: 'HTMLInputElement', textarea: 'HTMLTextAreaElement', select: 'HTMLSelectElement', button: 'HTMLButtonElement', a: 'HTMLAnchorElement' }[node.tag] ?? 'HTMLElement'
    const call = detail.length
      ? `(event: ChangeEvent<${dom}>) => handlers.current.${event.reactProp}?.({ ${detail.map((f) => `${f}: event.currentTarget.${f}`).join(', ')} }, event)`
      : `(event: ChangeEvent<${dom}>) => handlers.current.${event.reactProp}?.(event)`
    attrs.push([event.reactProp, call])
    if (node.tag === 'input' && Object.keys(node.attrs ?? {}).includes('checked') && event.reactProp !== 'onChange') attrs.push(['onChange', '() => undefined'])
  }
  const props = `{ ${attrs.map(([k, v]) => `${/^[A-Za-z]\w*$/.test(k) ? k : JSON.stringify(k)}: ${v}`).join(', ')} }`
  const children = (node.children ?? []).map((c) => reactNode(def, c, indent + 2))
  const element = children.length ? `createElement(${JSON.stringify(node.tag)}, ${props},\n${children.join(',\n')},\n${pad})` : `createElement(${JSON.stringify(node.tag)}, ${props})`
  const when = reactWhen(node.when)
  return when ? `${pad}${when} ? ${element} : null` : `${pad}${element}`
}

/**
 * The anatomy parts a native event is wired on: every part with that native
 * control. Mutually exclusive alternatives (the surface's link-or-button
 * primary control) each get the handler; only one renders at a time.
 */
function eventTargets(def, event) {
  const wanted = { click: ['button', 'a'], change: ['input', 'select', 'textarea'], input: ['input', 'textarea'] }[event.type] ?? []
  const out = []
  const walk = (node) => {
    if ('slot' in node) return
    if (wanted.includes(node.tag)) out.push(node)
    for (const child of node.children ?? []) walk(child)
  }
  if (def.anatomy) walk(def.anatomy)
  return out
}

function reactWrapper(def, source) {
  const props = Object.entries(def.props)
  const slots = Object.keys(def.slots ?? {})
  const custom = def.events.filter((e) => e.kind === 'custom')
  const lines = []
  lines.push(header(source, '//'))
  const usesSynthetic = def.events.some((e) => e.kind === 'native')
  const reactImports = ['createElement', 'forwardRef', ...(custom.length ? ['useEffect'] : []), 'useId', 'useImperativeHandle', 'useRef', ...(slots.length ? ['type ReactNode'] : []), ...(usesSynthetic ? ['type ChangeEvent', 'type SyntheticEvent'] : [])]
  lines.push(`import { ${reactImports.join(', ')} } from 'react'`)
  lines.push(`import { defineTympanElements } from '../index.ts'`)
  lines.push('')
  lines.push(`if (typeof window !== 'undefined') defineTympanElements()`)
  lines.push('')
  lines.push(`const truthy = (v: unknown) => v !== undefined && v !== null && v !== false && v !== ''`)
  lines.push(`const text = (v: unknown) => (truthy(v) ? String(v) : undefined)`)
  if (slots.length && usesSlotConditions(def)) lines.push(`const filled = (v: ReactNode) => v !== undefined && v !== null && v !== false && v !== ''`)
  lines.push('')
  lines.push(`/** ${def.doc} */`)
  lines.push(`export interface ${def.name}Props {`)
  for (const [name, prop] of props) lines.push(`  /** ${prop.doc}${prop.default !== undefined ? ` Default: \`${prop.default}\`.` : ''} */`, `  ${name}?: ${tsType(prop)}`)
  for (const slot of slots) lines.push(`  /** ${def.slots[slot].doc} */`, `  ${slot === 'default' ? 'children' : camel(slot)}?: ReactNode`)
  for (const event of def.events) {
    const detail = Object.entries(event.detail ?? {}).map(([k, t]) => `${k}: ${t}`).join('; ')
    const signature = event.kind === 'custom' ? (detail ? `(detail: { ${detail} }) => void` : '() => void') : detail ? `(detail: { ${detail} }, event: SyntheticEvent) => void` : '(event: SyntheticEvent) => void'
    lines.push(`  /** ${event.doc} */`, `  ${event.reactProp}?: ${signature}`)
  }
  lines.push(`  id?: string`, `  className?: string`, `}`)
  lines.push('')
  const defaults = props.filter(([, p]) => p.default !== undefined).map(([n, p]) => `${n}: ${JSON.stringify(p.default)}`)
  if (defaults.length) lines.push(`const DEFAULTS = { ${defaults.join(', ')} } as const`, '')
  lines.push(`export const ${def.name} = forwardRef<HTMLElement, ${def.name}Props>(function ${def.name}(props, ref) {`)
  lines.push(`  const generated = useId()`)
  lines.push(`  const instance = \`ty\${generated.replace(/[^a-zA-Z0-9_-]/g, '')}\``)
  lines.push(`  const handlers = useRef(props)`)
  lines.push(`  handlers.current = props`)
  lines.push(`  const host = useRef<HTMLElement>(null)`)
  lines.push(`  useImperativeHandle(ref, () => host.current as HTMLElement)`)
  if (custom.length) {
    lines.push(`  useEffect(() => {`)
    lines.push(`    const element = host.current`)
    lines.push(`    if (!element) return`)
    lines.push(`    const listeners: Array<[string, EventListener]> = [`)
    for (const event of custom) {
      const hasDetail = Object.keys(event.detail ?? {}).length > 0
      lines.push(`      [${JSON.stringify(event.type)}, (${hasDetail ? 'event' : ''}) => handlers.current.${event.reactProp}?.(${hasDetail ? '(event as CustomEvent).detail' : ''})],`)
    }
    lines.push(`    ]`)
    lines.push(`    for (const [type, listener] of listeners) element.addEventListener(type, listener)`)
    lines.push(`    return () => { for (const [type, listener] of listeners) element.removeEventListener(type, listener) }`)
    lines.push(`  }, [])`)
  }
  // The resolved props, fully typed: each prop is the caller's value or its
  // definition default, so the anatomy below is checked by the compiler.
  lines.push(`  const p = {`)
  for (const [name, prop] of props) {
    lines.push(`    ${name}: props.${name}${prop.default !== undefined ? ` ?? DEFAULTS.${name}` : ''},`)
  }
  lines.push(`  }`)
  if (def.anatomy && usesSlotConditions(def)) lines.push(`  const slots: Record<string, boolean> = { ${slots.map((s) => `${JSON.stringify(s)}: filled(props.${s === 'default' ? 'children' : camel(s)})`).join(', ')} }`)
  const hostAttrs = [`ref: host`, `id: props.id`, `className: props.className`, `'data-ty-instance': instance`]
  // React 19 sets a custom element's own properties (the element defines one
  // per prop) and React 18 writes attributes: `true`/`undefined` means the
  // same to both, `''` or `false` would not.
  for (const [name, prop] of props) hostAttrs.push(`${JSON.stringify(prop.attribute)}: ${prop.type === 'boolean' ? `truthy(p.${name}) ? true : undefined` : `text(p.${name})`}`)
  const anatomy = def.anatomy ? `,\n${reactNode(def, def.anatomy, 4)}` : ''
  lines.push(`  return createElement(${JSON.stringify(def.tag)}, { ${hostAttrs.join(', ')} }${anatomy})`)
  lines.push(`})`)
  lines.push('')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

const outputs = new Map()
const reactDir = 'packages/ui/src/elements/react'
const fixtureDir = 'packages/ui/test/elements/fixtures'

const reactIndex = [header('packages/ui/src/elements/*/definition.ts', '//')]
for (const [def, source] of DEFINITIONS) {
  outputs.set(`${reactDir}/${def.name}.ts`, reactWrapper(def, source))
  reactIndex.push(`export { ${def.name}, type ${def.name}Props } from './${def.name}.ts'`)
  for (const example of def.examples) {
    const slots = Object.fromEntries(Object.entries(example.slots).map(([k, v]) => [k, v.replace(/&/g, '&amp;').replace(/</g, '&lt;')]))
    outputs.set(`${fixtureDir}/${def.tag}/${example.name}.html`, `${renderElement(def, example.props, slots, FIXTURE_INSTANCE)}\n`)
  }
}
outputs.set(`${reactDir}/index.ts`, `${reactIndex.join('\n')}\n`)

let stale = 0
for (const [file, content] of outputs) {
  const path = join(root, file)
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (current === content) continue
  if (check) {
    console.error(`elements: ${file} is out of date (run node tools/elements/generate.mjs)`)
    stale++
    continue
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}
// Fixtures of examples that no longer exist.
for (const tag of existsSync(join(root, fixtureDir)) ? readdirSync(join(root, fixtureDir)) : []) {
  for (const file of readdirSync(join(root, fixtureDir, tag))) {
    const rel = `${fixtureDir}/${tag}/${file}`
    if (outputs.has(rel)) continue
    if (check) {
      console.error(`elements: ${rel} has no example`)
      stale++
    } else rmSync(join(root, rel))
  }
}
if (check && stale) process.exit(1)
console.log(`elements: ${check ? 'checked' : 'wrote'} ${outputs.size} generated files from ${DEFINITIONS.length} definitions (${relative(root, reactDir)}, ${fixtureDir})`)
