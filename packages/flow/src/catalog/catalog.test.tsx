import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Star } from 'lucide-react'
import { afterEach, describe, expect, it } from 'vitest'
import { cssOf } from '../../test/css'
import { GENERIC_ICON, resolveIcon } from './icons'
import { NodeKindCatalogStore, nodeKindCatalog, type NodeKindEntry } from './kindCatalog'
import { nodeStateAttributes } from './nodeState'
import { connectorTokens, kindTone, kindTokens, overrideKindTones, resetKindTones } from './palette'
import { NodeKindCatalogProvider, useRenderCatalog } from './RenderCatalog'

const entries: NodeKindEntry[] = [
  { kind: 'start', label: 'Start', category: 'Control flow', icon: 'play' },
  { kind: 'code', label: 'Compute', category: 'Data processing', icon: 'code', defaultConfig: { id: '', steps: [{ stepId: '', name: 'a' }] } },
  { kind: 'if-else', label: 'Branch', category: 'Control flow', icon: 'git-branch' },
  { kind: 'agent', label: 'Agent', category: 'AI', defaultConfig: { agentRef: '' } },
]

afterEach(() => {
  nodeKindCatalog.reset()
  resetKindTones()
})

describe('NodeKindCatalog', () => {
  it('answers nothing before a catalog is installed', () => {
    const s = new NodeKindCatalogStore()
    expect(s.entry('code')).toBeUndefined()
    expect(s.exists('code')).toBe(false)
    expect(s.kinds()).toEqual([])
  })

  it('groups kinds by category in catalog order', () => {
    const s = new NodeKindCatalogStore()
    s.install(entries)
    expect(s.byCategory().map((g) => [g.category, g.entries.map((e) => e.kind)])).toEqual([
      ['Control flow', ['start', 'if-else']],
      ['Data processing', ['code']],
      ['AI', ['agent']],
    ])
  })

  it('fills empty ids with new unique ids and leaves the stored default unchanged', () => {
    const s = new NodeKindCatalogStore()
    s.install(entries)
    const a = s.createDefaultConfig('code') as { id: string; steps: Array<{ stepId: string }> }
    const b = s.createDefaultConfig('code') as { id: string; steps: Array<{ stepId: string }> }
    expect(a.id).not.toBe('')
    expect(a.id).not.toBe(b.id)
    expect(a.steps[0]!.stepId).not.toBe(b.steps[0]!.stepId)
    expect(s.defaultConfig('code')).toEqual({ id: '', steps: [{ stepId: '', name: 'a' }] })
    expect(s.createDefaultConfig('agent')).toBeUndefined()
  })

  it('resolves unknown icon keys to the neutral icon', () => {
    expect(resolveIcon('does-not-exist')).toBe(GENERIC_ICON)
  })

  it('lets a host provider override the icon resolver and per-node identity', () => {
    nodeKindCatalog.install(entries)
    function Probe({ kind, data }: { kind: string; data: Record<string, unknown> }) {
      const c = useRenderCatalog()
      const id = c.identity(kind, data)
      const Icon = c.icon(kind)
      return (
        <p>
          <Icon data-testid={`icon-${kind}`} />
          {id?.title ?? c.entry(kind)?.label}
        </p>
      )
    }
    render(
      <NodeKindCatalogProvider icon={() => Star} identity={(_k, d) => (d.special ? { title: 'Special title' } : null)}>
        <Probe kind="code" data={{ special: true }} />
        <Probe kind="code" data={{}} />
      </NodeKindCatalogProvider>,
    )
    expect(screen.getByText('Special title')).toBeInTheDocument()
    expect(screen.getByText('Compute')).toBeInTheDocument()
    expect(screen.getAllByTestId('icon-code')[0]!.getAttribute('class')).toContain('star')
  })
})

describe('FlowPaletteTokens', () => {
  it('uses neutral for a kind absent from catalog and defaults', () => {
    expect(kindTone('something-new')).toBe('neutral')
    expect(kindTone('agent')).toBe('categorical-4')
  })

  it('prefers the catalog tone, and host overrides over both', () => {
    nodeKindCatalog.install([{ kind: 'agent', label: 'Agent', category: 'AI', tone: 'categorical-6' }])
    expect(kindTone('agent')).toBe('categorical-6')
    overrideKindTones({ agent: 'categorical-2' })
    expect(kindTone('agent')).toBe('categorical-2')
    expect(kindTokens('agent').bubble).toBe('var(--fk-flow-tone-categorical-2)')
  })

  it('throws a descriptive error for an unknown tone override', () => {
    expect(() => overrideKindTones({ agent: 'purple' })).toThrow(/purple.*not a tone name/)
  })

  it('has no gradient in any canvas token and runs use the pending semantic colour', () => {
    const tokens = cssOf('tokens.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(tokens).not.toMatch(/gradient/i)
    expect(tokens).toMatch(/--fk-flow-ring-running:\s*var\(--fk-warning\)/)
    expect(connectorTokens.false).toBe('var(--fk-flow-connector-false)')
  })

  it('keeps every categorical tone at ≥ 3:1 against the node surface in light and dark (static check)', () => {
    const css = readFileSync(join(__dirname, '../../../tokens/dist/tokens.css'), 'utf8')
    const pick = (block: string, name: string) => new RegExp(`--fk-${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(block)?.[1]
    const light = css.slice(css.indexOf('[data-fk-theme="fakhir"],'))
    const dark = css.slice(css.indexOf('[data-fk-mode="dark"],'))
    const lum = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!
    }
    const ratio = (a: string, b: string) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
      return (x! + 0.05) / (y! + 0.05)
    }
    for (const block of [light, dark]) {
      const surface = pick(block, 'surface-raised-solid')!
      for (let i = 1; i <= 8; i++) expect(ratio(pick(block, `categorical-${i}`)!, surface)).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('NodeStateStyles', () => {
  it('returns idle, unselected, unlocked, undimmed attributes by default', () => {
    expect(nodeStateAttributes()).toEqual({ 'data-selected': 'false', 'data-run-state': 'idle', 'data-locked': 'false', 'data-dimmed': 'false' })
  })

  it('maps proof state to a line style: pending is dashed', () => {
    expect(nodeStateAttributes({ proofState: 'pending' })['data-proof-state']).toBe('pending')
    expect(cssOf('nodes/GraphNodeCard.css')).toMatch(/\[data-proof-state='pending'\]\s*\{[^}]*dashed/)
  })

  it('shows hover as the strong line token only', () => {
    expect(cssOf('nodes/GraphNodeCard.css')).toMatch(/\.fk-node-card:hover\s*\{\s*--fk-node-border-color:\s*var\(--fk-flow-node-border-hover\);\s*\}/)
  })

  it('in forced colours, running is a dashed system-text border', () => {
    const css = cssOf('nodes/GraphNodeCard.css')
    const forced = css.slice(css.indexOf('@media (forced-colors: active)'))
    expect(forced).toMatch(/\[data-run-state='running'\]\s*\{[^}]*dashed CanvasText/)
    expect(forced).toMatch(/\[data-selected='true'\]\s*\{[^}]*Highlight/)
  })
})
