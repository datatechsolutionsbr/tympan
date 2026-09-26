// Parts a host places in its own page: the question field and the view
// switch, the canvas tools handed to a host dock, the filter chips, and the
// view panels' host hooks (time words, actions).
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/ui'
import { expectNoAxeViolations } from '../../test/axe'
import type { CanvasToolItem } from '../toolbar/canvasTools'
import { EditionCompare } from './EditionCompare'
import { EMPTY_FILTERS, type ProvFilters, type ProvItem, type ProvStatement } from './model'
import { NumberTrace } from './NumberTrace'
import { defaultProvenanceLabels } from './labels'
import { FilterChips } from './ProvenanceFilters'
import { ProvenanceGraph, ProvenanceQuestion, ProvenanceViewSwitch, type ProvenanceViewMode } from './ProvenanceGraph'
import { ProvenanceTimeline } from './ProvenanceTimeline'

const coder = { id: 'c', kind: 'agent' as const, name: 'coder' }
const items: ProvItem[] = [
  { id: 'r', kind: 'retrieval', title: 'r115b', meta: ['sha256 [hash]'], actor: coder, proofState: null, hashCheck: 'not-reread', at: '2026-09-01T00:00:00Z' },
  { id: 'a', kind: 'assertion', title: 'governance.operator_regulatory_position', meta: ['= confirmed_primary'], actor: coder, proofState: null, evidence: '[quote]', at: '2026-09-02T00:00:00Z' },
  { id: 'e', kind: 'edition', title: 'Edition 2026-09-20', actor: { kind: 'person', name: 'P' }, proofState: null, at: '2026-09-20T00:00:00Z' },
]
const statements: ProvStatement[] = [
  { subject: 'a', relation: 'wasDerivedFrom', object: 'r' },
  { subject: 'e', relation: 'wasDerivedFrom', object: 'a' },
]

describe('host-placed parts', () => {
  it('switches views with a radio group of icons and words, and asks with the hint shown', async () => {
    function Host() {
      const [view, setView] = useState<ProvenanceViewMode>('graph')
      const [focus, setFocus] = useState<string | null>('a')
      return (
        <>
          <ProvenanceQuestion items={items} value={focus} onChange={setFocus} hint />
          <ProvenanceViewSwitch value={view} onChange={setView} />
          <p data-testid="view">{view}</p>
        </>
      )
    }
    const { container } = render(<Host />)
    expect(screen.getByRole('combobox', { name: 'Where did this come from' })).toHaveValue('governance.operator_regulatory_position')
    expect(screen.getByText('value, record, number or sentence')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Certificate' }))
    expect(screen.getByTestId('view')).toHaveTextContent('certificate')
    expect(screen.getByRole('radiogroup', { name: 'View' }).querySelectorAll('svg')).toHaveLength(5)
    await expectNoAxeViolations(container)
  })

  it('hands the canvas tools to a host dock, with the tree and export items, and draws no question row', async () => {
    const got: CanvasToolItem[][] = []
    const onExport = vi.fn()
    render(<ProvenanceGraph items={items} statements={statements} defaultFocusId="a" showQuestionBar={false} onExport={onExport} renderTools={(t) => (got.push(t), <div data-testid="dock" />)} />)
    expect(screen.queryByRole('group', { name: 'Provenance query' })).toBeNull()
    expect(screen.getByTestId('dock')).toBeInTheDocument()
    const ids = got.at(-1)!.map((i) => i.id)
    expect(ids).toEqual(['select', 'pan', 'zoom-out', 'zoom-level', 'zoom-in', 'fit', 'auto-layout', 'list-view', 'export', 'search'])
    expect(got.at(-1)!.find((i) => i.id === 'list-view')!.label).toBe('Navigable tree')
    act(() => got.at(-1)!.find((i) => i.id === 'export')!.onPress!())
    expect(onExport).toHaveBeenCalled()
  })

  it('filters by type, actor and proof from three chips that say what is chosen', async () => {
    function Host() {
      const [f, setF] = useState<ProvFilters>(EMPTY_FILTERS)
      return <FilterChips value={f} onChange={setF} labels={defaultProvenanceLabels} />
    }
    render(<Host />)
    await userEvent.click(screen.getByRole('button', { name: 'Type: all' }))
    const dialog = await screen.findByRole('dialog', { name: 'Type: all' })
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'assertion' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Type: 1 chosen' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('button', { name: 'Actor: all' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Proof: all' })).toBeInTheDocument()
  })

  it('lets the host word the times (placeholders) and add actions under the selected event', () => {
    render(<ProvenanceTimeline items={items} defaultSelectedId="a" formatTime={(t, use) => (t === Date.parse('2026-09-20T00:00:00Z') ? '2026-09-20' : use === 'tick' ? '[date]' : '[date time]')} renderDetailActions={() => <button type="button">See the answer</button>} />)
    const detail = screen.getByRole('complementary', { name: 'Selected event' })
    expect(detail).toHaveTextContent('[date time]')
    expect(within(detail).getByRole('button', { name: 'See the answer' })).toBeInTheDocument()
    expect(screen.getAllByText('[date]').length).toBeGreaterThan(0)
    expect(screen.getByText('2026-09-20')).toBeInTheDocument()
  })

  it('opens the number panel at first, numbers the chain and offers graph and rerun', async () => {
    const onOpenInGraph = vi.fn()
    const n = { id: 'n', text: '26', caption: 'records of [phase 2]', chain: [{ id: 's', kind: 'manuscript' as const, title: 'Sentence', status: 'ok' as const }, { id: 'e', kind: 'edition' as const, title: 'Edition 2026-09-20', status: 'pending' as const }] }
    const { container } = render(<NumberTrace passage={['Phase 2 has ', n, ' records.']} source="[file].tex" defaultOpenId="n" onOpenInGraph={onOpenInGraph} onRerun={() => {}} />)
    const panel = screen.getByRole('region', { name: 'Where 26 comes from' })
    expect(panel).toHaveTextContent('Selected number')
    expect(panel).toHaveTextContent('records of [phase 2]')
    expect(container.querySelectorAll('.fk-numtrace__index')).toHaveLength(2)
    await userEvent.click(within(panel).getByRole('button', { name: 'Open in the graph' }))
    expect(onOpenInGraph).toHaveBeenCalledWith(expect.objectContaining({ id: 'n' }))
    await expectNoAxeViolations(container)
  })

  it('offers "see in the graph" and "ask for a review" on the selected change', async () => {
    const onOpenInGraph = vi.fn()
    const onRequestReview = vi.fn()
    render(
      <FakhirProvider locale="pt-BR">
        <EditionCompare
          comparison={{ a: { id: 'a', label: '2026-09-20' }, b: { id: 'b', label: 'ao vivo' }, rows: [{ itemId: 'x', label: '[registro]', a: '[valor]', b: '[novo]', change: 'altered', aNote: 'fonte [id]' }] }}
          defaultSelectedItemId="x"
          onOpenInGraph={onOpenInGraph}
          onRequestReview={onRequestReview}
        />
      </FakhirProvider>,
    )
    expect(screen.getByText('Antes · 2026-09-20')).toBeInTheDocument()
    expect(screen.getByText('fonte [id]')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ver no grafo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pedir revisão' }))
    expect(onOpenInGraph).toHaveBeenCalledWith('x')
    expect(onRequestReview).toHaveBeenCalledWith('x')
  })

  it('offers "reread" on a claim resting on quoted evidence and words its time through the host', async () => {
    render(<ProvenanceGraph items={items} statements={statements} defaultFocusId="a" onReread={() => {}} formatTime={() => '[date time]'} />)
    const panel = screen.getByRole('complementary', { name: /^Evidence: governance/ })
    expect(within(panel).getByRole('button', { name: 'Reread the source now' })).toBeInTheDocument()
    expect(panel).toHaveTextContent('[date time]')
    expect(panel).toHaveTextContent('the verifier (G7a) has not issued a certificate yet')
  })
})
