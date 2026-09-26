import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/design-system'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { setViewportWidth } from '../../test/media'
import { bandLayout, EMPTY_FILTERS, proofPath, provenanceView, type ProvActor, type ProvItem, type ProvStatement } from './model'
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

const view = (focusId: string | null, back: number, forward: number, f = {}) =>
  provenanceView(items, statements, [coder, ana], { focusId, back, forward, filters: { ...EMPTY_FILTERS, ...f } })
const ids = (v: ReturnType<typeof view>) => v.vertices.map((x) => x.id).sort()

function renderGraph(props: Partial<Parameters<typeof ProvenanceGraph>[0]> = {}) {
  return render(<ProvenanceGraph items={items} statements={statements} actors={[coder, ana]} defaultFocusId="as1" defaultBack={2} defaultForward={0} {...props} />)
}

describe('provenance model', () => {
  it('keeps N steps back and M steps forward from the focus', () => {
    expect(ids(view('as1', 1, 0))).toEqual(['as1', 'src'])
    expect(ids(view('as1', 2, 0))).toEqual(['as1', 'r115b', 'src'])
    expect(ids(view('as1', 0, 2))).toEqual(['as1', 'ed', 'rec'])
    expect(ids(view('as1', 1, 1))).toEqual(['as1', 'rec', 'src'])
  })

  it('filters by kind, proof state, actor kind and actor name', () => {
    expect(ids(view(null, 1, 1, { kinds: ['assertion'] }))).toEqual(['as1', 'as2'])
    expect(ids(view(null, 1, 1, { proofStates: ['refuted', 'none'] }))).toEqual(['as2', 'q1'])
    expect(ids(view(null, 1, 1, { actorKinds: ['system'] }))).toEqual(['r115b'])
    expect(ids(view(null, 1, 1, { actorName: 'souza' }))).toEqual(['ed', 'q1', 'src'])
  })

  it('reads in rank order, origins first, and draws actors as nodes only on request', () => {
    const all = view(null, 1, 1)
    expect(all.vertices.slice(0, 2).map((v) => v.id)).toEqual(['q1', 'lonely'])
    expect(all.vertices.some((v) => v.type === 'actor')).toBe(false)
    const withActors = view(null, 1, 1, { actorsAsNodes: true })
    expect(withActors.vertices.some((v) => v.id === 'coder')).toBe(true)
    expect(withActors.links.some((l) => l.relation === 'wasAttributedTo')).toBe(true)
  })

  it('flags an isolated focus and a focus hidden by filters', () => {
    expect(view('lonely', 2, 2).focusIsolated).toBe(true)
    expect(view('as1', 2, 2, { kinds: ['record'] }).focusFiltered).toBe(true)
  })

  it('finds the proof path back to the origin and lays bands top to bottom with the path in column 0', () => {
    const v = view('rec', 8, 0)
    const path = proofPath(v, 'rec')
    expect([...path.nodes].sort()).toEqual(['as1', 'q1', 'r115b', 'rec', 'src'])
    const full = view(null, 0, 0)
    const bands = bandLayout(full, proofPath(full, 'as1').nodes)
    expect(bands.bands.map((b) => b.key)).toEqual(['search', 'read', 'source', 'assertion', 'base', 'edition'])
    const as1 = bands.positions.get('as1')!
    const as2 = bands.positions.get('as2')!
    expect(as1.y).toBe(as2.y)
    expect(as1.x).toBeLessThan(as2.x)
    expect(bands.positions.get('q1')!.y).toBeLessThan(bands.positions.get('r115b')!.y)
    const mirrored = bandLayout(full, proofPath(full, 'as1').nodes, undefined, true)
    expect(mirrored.positions.get('as1')!.x).toBeGreaterThan(mirrored.positions.get('as2')!.x)
    expect(mirrored.labelX).toBeGreaterThan(0)
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

  it('draws research bands in order, labels links and gives each relation its own line style', () => {
    const { container } = renderGraph({ defaultBack: 3, defaultForward: 2 })
    expect([...container.querySelectorAll('.fk-prov-band__name')].map((e) => e.textContent)).toEqual(['Search', 'Reading', 'Source', 'Assertion', 'Base and verification', 'Edition'])
    const relations = [...container.querySelectorAll('.fk-prov-link')].map((e) => e.getAttribute('data-relation'))
    expect(relations).toEqual(expect.arrayContaining(['wasDerivedFrom', 'used', 'wasGeneratedBy']))
    expect([...container.querySelectorAll('.fk-prov-link title')].map((e) => e.textContent)).toEqual(expect.arrayContaining(['was derived from', 'used']))
    const css = cssOf('provenance/ProvenanceGraph.css')
    expect(css).toMatch(/\[data-relation='used'\]\s*\{\s*stroke-dasharray:\s*7 4/)
    expect(css).toMatch(/\[data-relation='wasAttributedTo'\]\s*\{\s*stroke-dasharray:\s*1\.5 4/)
  })

  it('highlights the proof path, dims the rest, marks the focus, and can show only the path', async () => {
    const { container } = renderGraph({ defaultBack: 3, defaultForward: 2, defaultFilters: { ...EMPTY_FILTERS } })
    const node = (id: string) => container.querySelector(`[data-fk-node-id="${id}"]`)
    expect(node('src')!.querySelector('.fk-prov-node-frame')).toHaveAttribute('data-on-path', 'true')
    expect(node('as1')!.querySelector('.fk-prov-node-frame')).toHaveAttribute('data-focus', 'true')
    expect(node('rec')!.querySelector('.fk-node-card')).toHaveAttribute('data-dimmed', 'true')
    expect(container.querySelector('.fk-prov-link[data-on-path="true"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /^record: ae-tamm-4-0/ })).toHaveAccessibleDescription(/off the proof path/)
    await userEvent.click(screen.getByRole('switch', { name: 'Only the proof path' }))
    expect(node('rec')).toBeNull()
    expect(node('src')).not.toBeNull()
  })

  it('shows relations and proof states in the legend with words and line styles', () => {
    render(<ProvenanceLegend labels={defaultProvenanceLabels} />)
    const legend = screen.getByRole('region', { name: 'Proof states' })
    for (const w of ['proved', 'pending', 'refuted', 'not disclosed', 'no proof', 'was derived from', 'used', 'was attributed to']) expect(within(legend).getByText(w)).toBeInTheDocument()
    expect(legend.querySelectorAll('.fk-proof-badge svg')).toHaveLength(5)
    expect(legend.querySelector('.fk-prov-legend__line[data-relation="used"]')).not.toBeNull()
  })

  it('keeps the tools in one row above the canvas, not over it', () => {
    const { container } = renderGraph()
    const row = container.querySelector('.fk-prov__tools')!
    expect(row.nextElementSibling).toHaveClass('fk-surface')
    expect(within(row as HTMLElement).getByLabelText('Steps back')).toBeInTheDocument()
    expect(within(row as HTMLElement).getByLabelText('Steps forward')).toBeInTheDocument()
    expect(row.querySelector('.fk-prov-legend')).not.toBeNull()
  })

  it('opens the evidence panel with reason, quote, obligations and actions', async () => {
    const onReread = vi.fn()
    const onRequestVerification = vi.fn()
    const rich: ProvItem[] = items.map((i) =>
      i.id === 'as1'
        ? {
            ...i,
            proofReason: 'Two independent sources agree.',
            evidence: 'The platform is operated by the Department of Government Enablement.',
            obligations: [
              { id: 'o1', label: 'Source reread', status: 'ok', detail: 'sha256 9f2c1a' },
              { id: 'o2', label: 'Second source', status: 'pending' },
            ],
          }
        : i.id === 'r115b'
          ? { ...i, hashCheck: 'match' }
          : i,
    )
    render(<ProvenanceGraph items={rich} statements={statements} defaultFocusId="as1" defaultSelectedId="as1" onReread={onReread} onRequestVerification={onRequestVerification} />)
    const panel = screen.getByRole('complementary', { name: /^Evidence/ })
    expect(within(panel).getByText('Two independent sources agree.')).toBeInTheDocument()
    expect(within(panel).getByText(/Department of Government Enablement/).tagName).toBe('BLOCKQUOTE')
    const obligations = within(panel).getByRole('heading', { name: 'Proof obligations' }).parentElement!
    expect(within(obligations).getByText('met')).toBeInTheDocument()
    expect(within(obligations).getByText('pending')).toBeInTheDocument()
    await userEvent.click(within(panel).getByRole('button', { name: 'Ask for verification' }))
    expect(onRequestVerification).toHaveBeenCalledWith('as1')
    await userEvent.click(within(panel).getByRole('button', { name: /was derived from source: TAMM official page/ }))
    await userEvent.click(within(screen.getByRole('complementary', { name: /^Evidence/ })).getByRole('button', { name: /was derived from retrieval/ }))
    const retrievalPanel = screen.getByRole('complementary', { name: 'Evidence: Retrieval r115b' })
    expect(within(retrievalPanel).getByText('hash matches')).toBeInTheDocument()
    await userEvent.click(within(retrievalPanel).getByRole('button', { name: 'Reread the source now' }))
    expect(onReread).toHaveBeenCalledWith('r115b')
  })

  it('selects on the canvas and in the tree, and Enter in the tree focuses the node in the graph', async () => {
    renderGraph()
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    await userEvent.click(within(canvas).getByRole('button', { name: /^source: TAMM official page/ }))
    expect(screen.getByRole('complementary', { name: 'Evidence: TAMM official page' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Tree' }))
    const tree = screen.getByRole('treegrid', { name: 'Provenance list' })
    expect(within(tree).getByRole('row', { selected: true })).toHaveTextContent('TAMM official page')
    expect(screen.getByRole('complementary', { name: 'Evidence: TAMM official page' })).toBeInTheDocument()
    const rows = within(tree).getAllByRole('row')
    rows[rows.length - 1]!.focus()
    await userEvent.keyboard('{Enter}')
    const graph = await screen.findByRole('group', { name: 'Provenance graph' })
    await vi.waitFor(() => expect(graph.contains(document.activeElement)).toBe(true))
    expect(document.activeElement).toHaveAccessibleName(/^retrieval: Retrieval r115b/)
  })

  it('navigates the tree with the keyboard and switches between where it came from and where it was used', async () => {
    renderGraph({ defaultView: 'tree', defaultBack: 3, defaultForward: 2 })
    const tree = screen.getByRole('treegrid', { name: 'Provenance list' })
    const rows = () => within(tree).getAllByRole('row')
    expect(rows().map((r) => r.getAttribute('aria-level'))).toContain('3')
    rows()[0]!.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows()[1])
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(rows()[rows().length - 1])
    await userEvent.keyboard('{Home}')
    const before = rows().length
    await userEvent.keyboard('{ArrowLeft}')
    expect(rows().length).toBe(1)
    await userEvent.keyboard('{ArrowRight}')
    expect(rows().length).toBe(before)
    expect(within(tree).queryByText('ae-tamm-4-0')).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: 'Where it was used' }))
    expect(within(screen.getByRole('treegrid')).getByText('ae-tamm-4-0')).toBeInTheDocument()
  })

  it('moves between bands along relations with Up and Down and leaves the canvas with Escape', async () => {
    renderGraph()
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    within(canvas).getByRole('button', { name: /^assertion: governance/ }).focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(document.activeElement).toHaveAccessibleName(/^source: TAMM official page/)
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveAccessibleName(/^assertion: governance/)
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('group', { name: 'Provenance query' }).contains(document.activeElement)).toBe(true)
  })

  it('asks "where did this come from" for any value and moves the focus there', async () => {
    const onFocusChange = vi.fn()
    renderGraph({ onFocusChange })
    const input = screen.getByRole('combobox', { name: 'Where did this come from' })
    await userEvent.clear(input)
    await userEvent.type(input, 'tamm-4')
    const option = await screen.findByRole('option', { name: /ae-tamm-4-0/ })
    await userEvent.click(option)
    expect(onFocusChange).toHaveBeenCalledWith('rec')
  })

  it('changes steps back and forward from the tool row', async () => {
    const onBackChange = vi.fn()
    renderGraph({ onBackChange })
    await userEvent.selectOptions(screen.getByLabelText('Steps back'), '1')
    expect(onBackChange).toHaveBeenCalledWith(1)
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    expect(canvas.querySelector('[data-fk-node-id="r115b"]')).toBeNull()
    await userEvent.selectOptions(screen.getByLabelText('Steps forward'), '2')
    expect(canvas.querySelector('[data-fk-node-id="ed"]')).not.toBeNull()
  })

  it('applies filters to every view', async () => {
    renderGraph({ defaultFocusId: null, defaultFilters: { ...EMPTY_FILTERS, proofStates: ['refuted'] } })
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    expect(canvas.querySelectorAll('[data-fk-node-id]')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Filters (1 active)' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Tree' }))
    expect(within(screen.getByRole('treegrid')).getAllByRole('row')).toHaveLength(1)
  })

  it('shows the timeline, the certificate and the edition comparison of the same data', async () => {
    const onRerun = vi.fn()
    renderGraph({
      certificates: {
        as1: { claimId: 'as1', claim: 'Operator position is confirmed', verdict: 'proved', verifier: 'fakhir-verify 0.7.2', ranAt: '2026-09-21T10:00:00Z', inputEdition: '2026-09-20', hash: 'sha256:77a1', obligations: [{ id: 'o1', label: 'Hash matches', status: 'ok' }] },
      },
      onRerunCertificate: onRerun,
      comparison: { a: { id: 'e1', label: '2026-08-01' }, b: { id: 'e2', label: '2026-09-20' }, rows: [{ itemId: 'as1', label: 'Operator position', a: 'unclear', b: 'confirmed_primary', change: 'altered' }] },
    })
    await userEvent.click(screen.getByRole('radio', { name: 'Timeline' }))
    expect(screen.getAllByText('Ana Souza').length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('radio', { name: 'Certificate' }))
    expect(screen.getByText('fakhir-verify 0.7.2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Run again/ }))
    expect(onRerun).toHaveBeenCalledWith('as1')
    await userEvent.click(screen.getByRole('radio', { name: 'Compare editions' }))
    expect(screen.getAllByText('confirmed_primary').length).toBeGreaterThan(0)
  })

  it('says when the focus has no links and warns when the view is deep', () => {
    const { unmount } = renderGraph({ defaultFocusId: 'lonely' })
    expect(screen.getByText('This item has no recorded links.')).toBeInTheDocument()
    unmount()
    renderGraph({ defaultBack: 10, maxHops: 12 })
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

  it('defaults to the tree below 1024 px', () => {
    setViewportWidth(375)
    renderGraph()
    expect(screen.queryByRole('group', { name: 'Provenance graph' })).toBeNull()
    expect(screen.getByRole('treegrid', { name: 'Provenance list' })).toBeInTheDocument()
  })

  it('works in RTL: tree keys mirror, the inspector opens, and band labels sit at the right', async () => {
    const { container } = render(
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
    await userEvent.click(within(tree).getByText('TAMM official page'))
    expect(screen.getByRole('complementary')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Graph' }))
    const label = container.querySelector('.fk-prov-band__label') as HTMLElement
    expect(label.style.transform).not.toMatch(/^translate\(0px/)
  })

  it('picks the built-in pt-BR strings from the provider locale', () => {
    render(
      <FakhirProvider locale="pt-BR">
        <ProvenanceGraph items={items} statements={statements} defaultFocusId="as1" />
      </FakhirProvider>,
    )
    expect(screen.getByRole('group', { name: 'Grafo de proveniência' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'De onde veio' })).toBeInTheDocument()
    for (const v of ['Grafo', 'Árvore', 'Linha do tempo', 'Certificado', 'Comparar edições']) expect(screen.getByRole('radio', { name: v })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Só o caminho da prova' })).toBeInTheDocument()
  })

  it('handles reduced motion, reduced transparency and forced colours in its stylesheet', () => {
    const css = cssOf('provenance/ProvenanceGraph.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency: reduce\)/)).toMatch(/backdrop-filter:\s*none/)
    const forced = mediaBlock(css, /\(forced-colors: active\)/)
    expect(forced).toMatch(/\.fk-prov-link\s*\{\s*stroke:\s*CanvasText/)
    expect(forced).toMatch(/Highlight/)
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/(margin|padding|border)-(left|right)\b|text-align:\s*(left|right)|\b(left|right):\s/)
  })

  it('updates the selection when controlled', () => {
    const { rerender } = renderGraph({ selectedId: 'src' })
    const canvas = screen.getByRole('group', { name: 'Provenance graph' })
    expect(canvas.querySelector('[data-fk-node-id="src"] .fk-node-card')).toHaveAttribute('data-selected', 'true')
    act(() => rerender(<ProvenanceGraph items={items} statements={statements} defaultFocusId="as1" defaultBack={2} selectedId="r115b" />))
    expect(canvas.querySelector('[data-fk-node-id="r115b"] .fk-node-card')).toHaveAttribute('data-selected', 'true')
  })
})
