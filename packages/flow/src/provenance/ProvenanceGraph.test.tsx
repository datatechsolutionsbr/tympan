import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/design-system'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { setViewportWidth } from '../../test/media'
import { EMPTY_FILTERS, provenanceView, type ProvActor, type ProvItem, type ProvStatement } from './model'
import { ProvenanceGraph } from './ProvenanceGraph'
import { ProvenanceLegend } from './ProvenanceLegend'
import { defaultProvenanceLabels } from './labels'

const coder: ProvActor = { id: 'coder', kind: 'agent', name: 'coder', agentKey: 'census.coder', model: 'model-x 2026-08' }
const ana: ProvActor = { id: 'ana', kind: 'person', name: 'Ana Souza' }

const items: ProvItem[] = [
  { id: 'q1', kind: 'query', title: 'TAMM assistant', actor: ana, proofState: null, at: '2026-09-10T10:00:00Z' },
  { id: 'r115b', kind: 'retrieval', title: 'Retrieval r115b', meta: ['sha256 9f2c1a'], actor: { kind: 'system', name: 'fetcher' }, proofState: 'proved' },
  { id: 'src', kind: 'source', title: 'TAMM official page', actor: ana, proofState: 'proved' },
  { id: 'as1', kind: 'assertion', title: 'governance.operator_regulatory_position', meta: ['= confirmed_primary'], actor: coder, proofState: 'proved', verifiedBy: 'Ana Souza', rule: 'verify@2' },
  { id: 'as2', kind: 'assertion', title: 'model.sovereignty', actor: coder, proofState: 'refuted' },
  { id: 'rec', kind: 'record', title: 'ae-tamm-4-0', actor: coder, proofState: 'pending' },
  { id: 'ed', kind: 'edition', title: 'Edition 2026-09-20', actor: ana, proofState: 'proved' },
  { id: 'lonely', kind: 'source', title: 'Unlinked note', proofState: 'not_disclosed' },
]
const statements: ProvStatement[] = [
  { subject: 'r115b', relation: 'wasGeneratedBy', object: 'q1' },
  { subject: 'src', relation: 'wasDerivedFrom', object: 'r115b' },
  { subject: 'as1', relation: 'wasDerivedFrom', object: 'src' },
  { subject: 'as2', relation: 'wasDerivedFrom', object: 'src' },
  { subject: 'rec', relation: 'wasDerivedFrom', object: 'as1' },
  { subject: 'ed', relation: 'used', object: 'rec' },
  { subject: 'as1', relation: 'wasAttributedTo', object: 'coder' },
]

const view = (focusId: string | null, hops: number, direction: 'backward' | 'forward' | 'both', f = {}) =>
  provenanceView(items, statements, [coder, ana], { focusId, hops, direction, filters: { ...EMPTY_FILTERS, ...f } })
const ids = (v: ReturnType<typeof view>) => v.vertices.map((x) => x.id).sort()

function renderGraph(props: Partial<Parameters<typeof ProvenanceGraph>[0]> = {}) {
  return render(<ProvenanceGraph items={items} statements={statements} actors={[coder, ana]} defaultFocusId="as1" defaultHops={2} {...props} />)
}

describe('provenance model', () => {
  it('keeps N hops backward, forward and both from the focus', () => {
    expect(ids(view('as1', 1, 'backward'))).toEqual(['as1', 'src'])
    expect(ids(view('as1', 2, 'backward'))).toEqual(['as1', 'r115b', 'src'])
    expect(ids(view('as1', 2, 'forward'))).toEqual(['as1', 'ed', 'rec'])
    expect(ids(view('as1', 1, 'both'))).toEqual(['as1', 'rec', 'src'])
  })

  it('filters by kind, proof state, actor kind and actor name', () => {
    expect(ids(view(null, 1, 'both', { kinds: ['assertion'] }))).toEqual(['as1', 'as2'])
    expect(ids(view(null, 1, 'both', { proofStates: ['refuted', 'none'] }))).toEqual(['as2', 'q1'])
    expect(ids(view(null, 1, 'both', { actorKinds: ['system'] }))).toEqual(['r115b'])
    expect(ids(view(null, 1, 'both', { actorName: 'souza' }))).toEqual(['ed', 'q1', 'src'])
  })

  it('reads in rank order, origins first, and draws actors as nodes only on request', () => {
    const all = view(null, 1, 'both')
    expect(all.vertices.slice(0, 2).map((v) => v.id)).toEqual(['q1', 'lonely'])
    expect(all.vertices.some((v) => v.type === 'actor')).toBe(false)
    const withActors = view(null, 1, 'both', { actorsAsNodes: true })
    expect(withActors.vertices.some((v) => v.id === 'coder')).toBe(true)
    expect(withActors.links.some((l) => l.relation === 'wasAttributedTo')).toBe(true)
  })

  it('flags an isolated focus and a focus hidden by filters', () => {
    expect(view('lonely', 2, 'both').focusIsolated).toBe(true)
    expect(view('as1', 2, 'both', { kinds: ['record'] }).focusFiltered).toBe(true)
  })
})

describe('ProvenanceGraph', () => {
  it('names each node with kind, title, proof word and actor kind', async () => {
    const { container } = renderGraph()
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    expect(within(canvas).getByRole('button', { name: 'assertion: governance.operator_regulatory_position, proved, agent coder' })).toBeInTheDocument()
    expect(within(canvas).getByRole('button', { name: 'source: TAMM official page, proved, person Ana Souza' })).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('labels every link with its relation word', () => {
    const { container } = renderGraph()
    const labels = [...container.querySelectorAll('.fk-prov-link__label')].map((e) => e.textContent)
    expect(labels).toEqual(expect.arrayContaining(['was derived from', 'used']))
    expect(container.querySelector('.fk-prov-link[data-relation="used"]')).not.toBeNull()
  })

  it('shows the proof legend with icon and word per state', () => {
    render(<ProvenanceLegend labels={defaultProvenanceLabels} />)
    const legend = screen.getByRole('region', { name: 'Proof states' })
    for (const w of ['proved', 'pending', 'refuted', 'not disclosed', 'no proof']) expect(within(legend).getByText(w)).toBeInTheDocument()
    expect(legend.querySelectorAll('.fk-proof-badge svg')).toHaveLength(5)
  })

  it('keeps the list and the canvas in sync in both directions', async () => {
    renderGraph()
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    await userEvent.click(within(canvas).getByRole('button', { name: /^record: ae-tamm-4-0/ }))
    const tree = screen.getByRole('treegrid', { name: 'Provenance list' })
    expect(within(tree).getByRole('row', { selected: true })).toHaveTextContent('ae-tamm-4-0')
    expect(screen.getByRole('complementary', { name: 'Evidence: ae-tamm-4-0' })).toBeInTheDocument()
    await userEvent.click(within(tree).getByText('TAMM official page'))
    expect(canvas.querySelector('[data-fk-node-id="src"] .fk-node-card')).toHaveAttribute('data-selected', 'true')
    expect(canvas.querySelector('[data-fk-node-id="rec"] .fk-node-card')).toHaveAttribute('data-selected', 'false')
  })

  it('navigates the list with the keyboard (arrows, Home, End, collapse and expand)', async () => {
    renderGraph()
    const tree = screen.getByRole('treegrid', { name: 'Provenance list' })
    const rows = () => within(tree).getAllByRole('row')
    rows()[0]!.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows()[1])
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(rows()[rows().length - 1])
    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(rows()[0])
    const before = rows().length
    await userEvent.keyboard('{ArrowLeft}')
    expect(rows().length).toBe(1)
    await userEvent.keyboard('{ArrowRight}')
    expect(rows().length).toBe(before)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })

  it('moves along relations with arrow keys on a node and leaves the canvas with Escape', async () => {
    renderGraph()
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    within(canvas).getByRole('button', { name: /^assertion: governance/ }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toHaveAccessibleName(/^source: TAMM official page/)
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toHaveAccessibleName(/^assertion: governance/)
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('group', { name: 'Provenance query' }).contains(document.activeElement)).toBe(true)
  })

  it('follows relations from the evidence panel', async () => {
    renderGraph({ defaultSelectedId: 'as1' })
    const panel = screen.getByRole('complementary', { name: /^Evidence/ })
    expect(within(panel).getByText('rule verify@2')).toBeInTheDocument()
    await userEvent.click(within(panel).getByRole('button', { name: /was derived from source: TAMM official page/ }))
    expect(screen.getByRole('complementary', { name: 'Evidence: TAMM official page' })).toBeInTheDocument()
  })

  it('changes steps and direction from the query bar', async () => {
    const onHopsChange = vi.fn()
    renderGraph({ onHopsChange })
    await userEvent.selectOptions(screen.getByLabelText('Steps'), '1')
    expect(onHopsChange).toHaveBeenCalledWith(1)
    await userEvent.click(screen.getByRole('radio', { name: 'Back to sources' }))
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    expect(canvas.querySelector('[data-fk-node-id="rec"]')).toBeNull()
    expect(canvas.querySelector('[data-fk-node-id="src"]')).not.toBeNull()
  })

  it('applies filters to both the list and the canvas', async () => {
    renderGraph({ defaultFocusId: null, defaultFilters: { ...EMPTY_FILTERS, proofStates: ['refuted'] } })
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    expect(canvas.querySelectorAll('[data-fk-node-id]')).toHaveLength(1)
    expect(within(screen.getByRole('treegrid')).getAllByRole('row')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Filters (1 active)' })).toBeInTheDocument()
  })

  it('says when the focus has no links and warns when the view is deep', () => {
    const { unmount } = renderGraph({ defaultFocusId: 'lonely' })
    expect(screen.getByText('This item has no recorded links.')).toBeInTheDocument()
    unmount()
    renderGraph({ defaultHops: 8 })
    expect(screen.getByText(/Reduce the number of steps/)).toBeInTheDocument()
  })

  it('shows a skeleton with three ghost nodes while loading, and errors with retry', async () => {
    const onRetry = vi.fn()
    const { container, rerender } = renderGraph({ loading: true })
    expect(screen.getByRole('status')).toHaveTextContent('Loading the provenance graph')
    expect(container.querySelectorAll('.fk-prov__ghost')).toHaveLength(3)
    rerender(<ProvenanceGraph items={items} statements={statements} error="Server unavailable (503)" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
    rerender(<ProvenanceGraph items={[]} statements={[]} />)
    expect(screen.getByText('No provenance yet')).toBeInTheDocument()
  })

  it('defaults to the list below 1024 px', () => {
    setViewportWidth(375)
    renderGraph()
    expect(screen.queryByRole('group', { name: 'Provenance graph' })).toBeNull()
    expect(screen.getByRole('treegrid', { name: 'Provenance list' })).toBeInTheDocument()
  })

  it('works in RTL: list keys mirror (Left expands) and the evidence panel opens', async () => {
    render(
      <FakhirProvider locale="ar">
        <div dir="rtl">
          <ProvenanceGraph items={items} statements={statements} defaultFocusId="as1" defaultView="tree" />
        </div>
      </FakhirProvider>,
    )
    const tree = screen.getByRole('treegrid')
    const rows = () => within(tree).getAllByRole('row')
    rows()[0]!.focus()
    const before = rows().length
    await userEvent.keyboard('{ArrowRight}')
    expect(rows().length).toBe(1)
    await userEvent.keyboard('{ArrowLeft}')
    expect(rows().length).toBe(before)
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })

  it('picks the built-in pt-BR strings from the provider locale', () => {
    render(
      <FakhirProvider locale="pt-BR">
        <ProvenanceGraph items={items} statements={statements} defaultFocusId="as1" />
      </FakhirProvider>,
    )
    expect(screen.getByRole('group', { name: 'Grafo de proveniência' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Consulta de proveniência' })).toBeInTheDocument()
  })

  it('handles reduced motion, reduced transparency and forced colours in its stylesheet', () => {
    const css = cssOf('provenance/ProvenanceGraph.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency: reduce\)/)).toMatch(/backdrop-filter:\s*none/)
    const forced = mediaBlock(css, /\(forced-colors: active\)/)
    expect(forced).toMatch(/\.fk-prov-link\s*\{\s*stroke:\s*CanvasText/)
    expect(forced).toMatch(/Highlight/)
    // Relations keep distinct line styles; no physical left/right in layout.
    expect(css).toMatch(/\[data-relation='used'\]\s*\{\s*stroke-dasharray/)
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/(margin|padding|border)-(left|right)\b|text-align:\s*(left|right)|\b(left|right):\s/)
  })

  it('updates the selection when controlled', () => {
    const { rerender } = renderGraph({ selectedId: 'rec' })
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    expect(canvas.querySelector('[data-fk-node-id="rec"] .fk-node-card')).toHaveAttribute('data-selected', 'true')
    act(() => rerender(<ProvenanceGraph items={items} statements={statements} defaultFocusId="as1" selectedId="src" />))
    expect(canvas.querySelector('[data-fk-node-id="src"] .fk-node-card')).toHaveAttribute('data-selected', 'true')
  })
})
