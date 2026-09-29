// One definition, three renderers: every example of every enhancing element
// renders the same markup through the reference renderer (the fixtures in
// ./fixtures pin it), the generated React wrapper, and the element itself
// when used from plain HTML.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { renderAnatomy, renderElement } from '../../src/elements/anatomy'
import { buttonDefinition } from '../../src/elements/button/definition'
import { checkboxDefinition } from '../../src/elements/checkbox/definition'
import { drawerDefinition } from '../../src/elements/drawer/definition'
import { inlineNoticeDefinition } from '../../src/elements/inline-notice/definition'
import { linkDefinition } from '../../src/elements/link/definition'
import { modalDefinition } from '../../src/elements/modal/definition'
import { nativeSelectDefinition } from '../../src/elements/native-select/definition'
import { separatorDefinition } from '../../src/elements/separator/definition'
import { skeletonDefinition } from '../../src/elements/skeleton/definition'
import { spinnerDefinition } from '../../src/elements/spinner/definition'
import { statusPillDefinition } from '../../src/elements/status-pill/definition'
import { surfaceDefinition } from '../../src/elements/surface/definition'
import { switchDefinition } from '../../src/elements/switch/definition'
import { tagDefinition } from '../../src/elements/tag/definition'
import { textAreaDefinition } from '../../src/elements/text-area/definition'
import { textFieldDefinition } from '../../src/elements/text-field/definition'
import type { ElementDefinition } from '../../src/elements/definition'
import { defineTympanElements } from '../../src/elements'
import { TyButton, TyCheckbox, TyDrawer, TyInlineNotice, TyLink, TyModal, TyNativeSelect, TySeparator, TySkeleton, TySpinner, TyStatusPill, TySurface, TySwitch, TyTag, TyTextArea, TyTextField } from '../../src/elements/react'
import { canon, canonElement } from './canon'

const repo = join(__dirname, '..', '..', '..', '..')
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const camel = (s: string) => s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())

const CASES: Array<[ElementDefinition, ComponentType<Record<string, unknown>>]> = [
  [buttonDefinition, TyButton as unknown as ComponentType<Record<string, unknown>>],
  [checkboxDefinition, TyCheckbox as unknown as ComponentType<Record<string, unknown>>],
  [drawerDefinition, TyDrawer as unknown as ComponentType<Record<string, unknown>>],
  [inlineNoticeDefinition, TyInlineNotice as unknown as ComponentType<Record<string, unknown>>],
  [linkDefinition, TyLink as unknown as ComponentType<Record<string, unknown>>],
  [modalDefinition, TyModal as unknown as ComponentType<Record<string, unknown>>],
  [nativeSelectDefinition, TyNativeSelect as unknown as ComponentType<Record<string, unknown>>],
  [separatorDefinition, TySeparator as unknown as ComponentType<Record<string, unknown>>],
  [skeletonDefinition, TySkeleton as unknown as ComponentType<Record<string, unknown>>],
  [spinnerDefinition, TySpinner as unknown as ComponentType<Record<string, unknown>>],
  [statusPillDefinition, TyStatusPill as unknown as ComponentType<Record<string, unknown>>],
  [surfaceDefinition, TySurface as unknown as ComponentType<Record<string, unknown>>],
  [switchDefinition, TySwitch as unknown as ComponentType<Record<string, unknown>>],
  [tagDefinition, TyTag as unknown as ComponentType<Record<string, unknown>>],
  [textAreaDefinition, TyTextArea as unknown as ComponentType<Record<string, unknown>>],
  [textFieldDefinition, TyTextField as unknown as ComponentType<Record<string, unknown>>],
]

defineTympanElements()

describe('generated files', () => {
  it('are up to date with the definitions', () => {
    expect(() => execFileSync('node', [join(repo, 'tools/elements/generate.mjs'), '--check'], { stdio: 'pipe' })).not.toThrow()
  })
})

for (const [def, Wrapper] of CASES) {
  describe(`${def.tag} parity`, () => {
    for (const example of def.examples) {
      const slots = Object.fromEntries(Object.entries(example.slots).map(([k, v]) => [k, escape(v)]))

      it(`${example.name}: the fixture is the reference rendering`, () => {
        const fixture = readFileSync(join(__dirname, 'fixtures', def.tag, `${example.name}.html`), 'utf8')
        expect(canon(fixture)).toEqual(canon(renderElement(def, example.props, slots, 'i')))
      })

      it(`${example.name}: the React wrapper renders the reference markup`, () => {
        const props: Record<string, unknown> = { ...example.props }
        for (const [slot, text] of Object.entries(example.slots)) props[slot === 'default' ? 'children' : camel(slot)] = text
        const html = renderToStaticMarkup(createElement(Wrapper, props))
        // The wrapper's instance id comes from useId; compare with its own id.
        const instance = /data-ty-instance="([^"]+)"/.exec(html)?.[1] ?? ''
        expect(canon(html)).toEqual(canon(renderElement(def, example.props, slots, instance)))
      })

      it(`${example.name}: the element builds the same anatomy from plain HTML`, () => {
        const host = document.createElement(def.tag)
        host.setAttribute('data-ty-instance', 'i')
        for (const [name, value] of Object.entries(example.props)) {
          const attribute = def.props[name]!.attribute
          if (value === true) host.setAttribute(attribute, '')
          else if (value !== false) host.setAttribute(attribute, String(value))
        }
        for (const [slot, text] of Object.entries(example.slots)) {
          if (slot === 'default') host.append(text)
          else {
            const span = document.createElement('span')
            span.setAttribute('slot', slot)
            span.textContent = text
            host.append(span)
          }
        }
        document.body.append(host)
        // Live text the element fills on upgrade (the link's external hint)
        // is content no renderer owns, not anatomy; clear it to compare.
        for (const live of host.querySelectorAll('.ty-link__hint')) live.replaceChildren()
        // Named-slot content keeps its wrapper span; compare the anatomy with that span in place.
        const expectedSlots = Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, k === 'default' ? v : `<span slot="${k}">${v}</span>`]))
        expect(canonElement(host)).toEqual(canon(renderAnatomy(def, example.props, expectedSlots, 'i')))
        host.remove()
      })
    }
  })
}
