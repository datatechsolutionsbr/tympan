// Safety: the elements never parse HTML at runtime (every label, message
// and attribute value is a text node or an escaped string), and no dangerous
// sink creeps into the element sources.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderElement } from '../../src/elements/anatomy'
import { inlineNoticeDefinition } from '../../src/elements/inline-notice/definition'
import { nativeSelectDefinition } from '../../src/elements/native-select/definition'
import { defineTympanElements } from '../../src/elements'

defineTympanElements()

const src = join(__dirname, '..', '..', 'src', 'elements')

function* sources(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* sources(path)
    else if (entry.endsWith('.ts')) yield path
  }
}

// Sinks that would parse a string into DOM or code. The elements build the
// DOM with createElement and text nodes only (base.ts), so none of these
// may appear in the element sources, generated wrappers included.
const SINKS = [/\binnerHTML\b/, /\bouterHTML\b/, /\binsertAdjacentHTML\b/, /\beval\(/, /\bnew Function\b/, /document\.write/]

describe('element sources', () => {
  it('use no HTML-parsing or code-evaluating sink', () => {
    const offenders: string[] = []
    for (const path of sources(src)) {
      const code = readFileSync(path, 'utf8')
      for (const sink of SINKS) if (sink.test(code)) offenders.push(`${path}: ${sink}`)
    }
    expect(offenders).toEqual([])
  })
})

describe('rendered output escapes markup', () => {
  // Slot content is trusted (or pre-escaped) HTML by contract — the host
  // framework escapes it (React text children are text by nature).
  // Everything the DEFINITION turns into markup — prop-driven text nodes and
  // every attribute value — is escaped by the reference renderer.
  it('a prop-driven text node with markup is escaped in the reference rendering', () => {
    const html = renderElement(
      inlineNoticeDefinition,
      { toneWordInfo: '<img src=x onerror=alert(1)>' },
      { default: 'Saved.' },
      'i',
    )
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('an attribute value with quotes cannot break out of the attribute', () => {
    const html = renderElement(
      nativeSelectDefinition,
      { accessibleLabel: '"><script>alert(1)</script>' },
      { default: 'x' },
      'i',
    )
    expect(html).not.toContain('<script>')
    expect(html).toContain('&quot;&gt;')
  })

  it('markup in host content stays inert after the element upgrades', () => {
    document.body.innerHTML = ''
    const host = document.createElement('ty-tag')
    host.textContent = '<b>not bold markup</b>'
    document.body.append(host)
    // The element adopts the text as a text node; no <b> is ever parsed.
    expect(host.querySelector('b')).toBeNull()
    expect(host.textContent).toBe('<b>not bold markup</b>')
    document.body.replaceChildren()
  })
})
