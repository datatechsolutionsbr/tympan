import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/design-system'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { EditionCompare } from './EditionCompare'
import type { ProvItem } from './model'
import { NumberTrace } from './NumberTrace'
import type { EditionComparison, ProofCertificate, TracedPassage } from './proofTypes'
import { ProvenanceCertificate } from './ProvenanceCertificate'
import { ProvenanceTimeline } from './ProvenanceTimeline'

const coder = { id: 'agent-coder', kind: 'agent' as const, name: 'coder' }
const natalia = { id: 'p-nat', kind: 'person' as const, name: 'Natalia Mesquita' }
const items: ProvItem[] = [
  { id: 'q1', kind: 'query', title: 'IA gov Emirados', actor: coder, at: '2026-09-02T10:00:00Z', proofState: null },
  { id: 'r115b', kind: 'retrieval', title: 'r115b', actor: coder, at: '2026-09-02T10:15:00Z', proofState: 'proved', meta: ['sha256:9f2c'] },
  { id: 'as1', kind: 'assertion', title: 'Posição regulatória', actor: coder, at: '2026-09-03T08:00:00Z', proofState: 'proved' },
  { id: 'rec', kind: 'record', title: 'ae-tamm-4-0', actor: natalia, at: '2026-09-10T16:30:00Z', proofState: 'proved' },
  { id: 'loose', kind: 'source', title: 'Sem data', actor: natalia, proofState: 'pending' },
]

const certificate: ProofCertificate = {
  claimId: 'as1',
  claim: 'governance.operator_regulatory_position = confirmed_primary',
  verdict: 'proved',
  verifier: 'fakhir-verify 0.7.2',
  ranAt: '2026-09-20T14:02:00Z',
  inputEdition: '2026-09-20',
  hash: 'sha256:5d1e…a0c4',
  obligations: [
    { id: 'src', label: 'Two independent sources', status: 'ok', detail: 'rule two-source@3', children: [{ id: 'h1', label: 'Hash of r115b matches', status: 'ok', detail: 'sha256:9f2c…41ab' }] },
    { id: 'rev', label: 'Human review', status: 'pending' },
    { id: 'fresh', label: 'Source re-read within 30 days', status: 'failed', detail: 'last read 2026-07-01' },
  ],
}

const comparison: EditionComparison = {
  a: { id: 'e1', label: '2026-08-15' },
  b: { id: 'e2', label: '2026-09-20' },
  rows: [
    { itemId: 'ae-tamm-4-0.stage', label: 'Stage', a: '3', b: '4', change: 'altered', who: natalia },
    { itemId: 'ae-bur-1-0', label: 'Bürokratt record', b: 'created', change: 'new', who: coder },
    { itemId: 'ae-old-2-0', label: 'Old record', a: 'kept', change: 'removed' },
  ],
}

const passage: TracedPassage = [
  'Stages 3 and 4 add up to ',
  {
    id: 'n37',
    text: '37',
    chain: [
      { id: 's', kind: 'manuscript', title: 'Sentence §4', status: 'ok' },
      { id: 'run', kind: 'analysis', title: 'Count by stage', meta: 'run 2026-09-20T14:02', status: 'ok' },
      { id: 'ed', kind: 'edition', title: 'Edition 2026-09-20', meta: 'edition=2026-09-20', status: 'ok' },
      { id: 'as', kind: 'assertion', title: 'Operator position', status: 'pending' },
    ],
  },
  ' of the 94 cases.',
]

describe('ProvenanceTimeline', () => {
  it('draws one lane per actor with its events in time order and an undated group', () => {
    render(<ProvenanceTimeline items={items} />)
    const lists = screen.getAllByRole('list')
    const coderLane = lists.find((l) => l.getAttribute('aria-labelledby')?.includes('coder'))!
    expect(within(coderLane).getAllByRole('button').map((b) => b.getAttribute('aria-label')!.split(',')[0])).toEqual(['query: IA gov Emirados', 'retrieval: r115b', 'assertion: Posição regulatória'])
    expect(screen.getByText('Without a date')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /coder, agent, 3 events/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Natalia Mesquita, person, 2 events/ })).toBeInTheDocument()
  })

  it('selects an event, shows it in the detail panel and reports it', async () => {
    const onSelect = vi.fn()
    render(<ProvenanceTimeline items={items} onSelect={onSelect} />)
    expect(screen.getByText('Choose an event to see its details.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /retrieval: r115b/ }))
    expect(onSelect).toHaveBeenCalledWith('r115b')
    const detail = screen.getByRole('complementary', { name: 'Selected event' })
    expect(within(detail).getByRole('heading', { name: 'r115b' })).toBeInTheDocument()
    expect(within(detail).getByText('sha256:9f2c')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retrieval: r115b/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('moves along a lane with arrows and across lanes with Up and Down', async () => {
    render(<ProvenanceTimeline items={items} />)
    screen.getByRole('button', { name: /query: IA gov/ }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: /retrieval: r115b/ })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('button', { name: /assertion:/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: /record: ae-tamm-4-0/ })).toHaveFocus()
  })

  it('mirrors arrow keys in Arabic and uses Portuguese words in pt-BR', async () => {
    render(
      <FakhirProvider locale="ar">
        <div dir="rtl">
          <ProvenanceTimeline items={items} />
        </div>
      </FakhirProvider>,
    )
    screen.getAllByRole('button')[0]!.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement!.getAttribute('aria-label')).toMatch(/retrieval/)
  })

  it('passes axe and names lanes in Portuguese', async () => {
    const { container } = render(
      <FakhirProvider locale="pt-BR">
        <ProvenanceTimeline items={items} />
      </FakhirProvider>,
    )
    expect(screen.getByRole('heading', { name: /coder, agente, 3 eventos/ })).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })
})

describe('ProvenanceCertificate', () => {
  it('shows the obligation tree expanded, with levels, status words and mono details', () => {
    render(<ProvenanceCertificate certificate={certificate} />)
    const tree = screen.getByRole('treegrid', { name: 'Proof obligations of the claim' })
    const rows = within(tree).getAllByRole('row')
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveAttribute('aria-level', '1')
    expect(rows[2]).toHaveAttribute('aria-level', '3')
    expect(within(tree).getByText('fails')).toBeInTheDocument()
    expect(within(tree).getByText('sha256:9f2c…41ab').tagName).toBe('CODE')
  })

  it('collapses a branch with the keyboard', async () => {
    render(<ProvenanceCertificate certificate={certificate} />)
    const tree = screen.getByRole('treegrid')
    await userEvent.tab()
    expect(within(tree).getAllByRole('row')[0]).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{ArrowLeft}')
    expect(within(tree).getAllByRole('row')).toHaveLength(4)
  })

  it('lists verdict, verifier, run time, edition and hash, explains determinism and offers the actions', async () => {
    const onRerun = vi.fn()
    const onDownload = vi.fn()
    const { container } = render(<ProvenanceCertificate certificate={certificate} onRerun={onRerun} onDownload={onDownload} />)
    const side = screen.getByRole('complementary', { name: 'Certificate details' })
    expect(within(side).getByText('fakhir-verify 0.7.2')).toBeInTheDocument()
    expect(within(side).getByText('sha256:5d1e…a0c4')).toBeInTheDocument()
    expect(within(side).getByText(/uses no language model/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Run again' }))
    await userEvent.click(screen.getByRole('button', { name: 'Download certificate' }))
    expect(onRerun).toHaveBeenCalled()
    expect(onDownload).toHaveBeenCalled()
    await expectNoAxeViolations(container)
  })

  it('shows the empty state and the Portuguese words', () => {
    const { rerender } = render(<ProvenanceCertificate certificate={null} />)
    expect(screen.getByText('No certificate for this item yet.')).toBeInTheDocument()
    rerender(
      <FakhirProvider locale="pt-BR">
        <ProvenanceCertificate certificate={certificate} onRerun={() => {}} onDownload={() => {}} />
      </FakhirProvider>,
    )
    expect(screen.getByRole('button', { name: 'Rodar de novo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baixar certificado' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Obrigações da prova' })).toBeInTheDocument()
  })

  it('keeps tree keys working right to left', async () => {
    render(
      <FakhirProvider locale="ar">
        <div dir="rtl">
          <ProvenanceCertificate certificate={certificate} />
        </div>
      </FakhirProvider>,
    )
    const tree = screen.getByRole('treegrid')
    await userEvent.tab()
    // In RTL the collapse key is Right Arrow.
    await userEvent.keyboard('{ArrowDown}{ArrowRight}')
    expect(within(tree).getAllByRole('row')).toHaveLength(4)
  })
})

describe('EditionCompare', () => {
  it('counts each kind of change with plural words and filters the table', async () => {
    render(<EditionCompare comparison={comparison} />)
    expect(screen.getByText('1 altered')).toBeInTheDocument()
    expect(screen.getByText('1 new')).toBeInTheDocument()
    expect(screen.getByText('1 removed')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(4)
    await userEvent.click(screen.getByRole('radio', { name: 'new' }))
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Bürokratt record' })).toBeInTheDocument()
  })

  it('writes a word for missing values and never a dash; values are mono', () => {
    render(<EditionCompare comparison={comparison} />)
    expect(screen.getAllByText('not present')).toHaveLength(2)
    expect(screen.getByText('not recorded')).toBeInTheDocument()
    expect(screen.getByText('3').tagName).toBe('CODE')
  })

  it('shows before and after cards for the selected row, chosen by keyboard', async () => {
    const onSelectItem = vi.fn()
    const { container } = render(<EditionCompare comparison={comparison} onSelectItem={onSelectItem} />)
    expect(screen.getByText('Choose a row to compare its values side by side.')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Stage' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(onSelectItem).toHaveBeenCalledWith('ae-tamm-4-0.stage')
    const cards = container.querySelectorAll('.fk-diff__card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('Before, in 2026-08-15')
    expect(cards[1]).toHaveTextContent('After, in 2026-09-20')
    expect(cards[1]).toHaveTextContent('4')
    await expectNoAxeViolations(container)
  })

  it('uses Portuguese words and works right to left', async () => {
    render(
      <FakhirProvider locale="pt-BR">
        <EditionCompare comparison={comparison} />
      </FakhirProvider>,
    )
    expect(screen.getByText('1 alterado')).toBeInTheDocument()
    expect(screen.getAllByText('não consta')).toHaveLength(2)
  })

  it('selects under Arabic too', async () => {
    const onSelectItem = vi.fn()
    render(
      <FakhirProvider locale="ar">
        <div dir="rtl">
          <EditionCompare comparison={comparison} onSelectItem={onSelectItem} />
        </div>
      </FakhirProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Old record' }))
    expect(onSelectItem).toHaveBeenCalledWith('ae-old-2-0')
  })
})

describe('NumberTrace', () => {
  it('opens the chain for a number and returns focus to it on Escape', async () => {
    const { container } = render(<NumberTrace passage={passage} />)
    const number = screen.getByRole('button', { name: 'number 37, show its trace' })
    await userEvent.click(number)
    const panel = screen.getByRole('region', { name: 'Where 37 comes from' })
    const steps = within(panel).getAllByRole('listitem')
    expect(steps).toHaveLength(4)
    expect(steps[3]).toHaveTextContent('pending')
    expect(steps[1]).toHaveTextContent('run 2026-09-20T14:02')
    expect(number).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(within(panel).getByRole('heading')).toHaveFocus())
    await expectNoAxeViolations(container)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Where 37 comes from' })).toBeNull()
    await waitFor(() => expect(number).toHaveFocus())
  })

  it('reports a chosen step and keeps the text direction automatic', async () => {
    const onOpenStep = vi.fn()
    const { container } = render(<NumberTrace passage={passage} onOpenStep={onOpenStep} />)
    expect(container.querySelector('.fk-trace__text')).toHaveAttribute('dir', 'auto')
    await userEvent.click(screen.getByRole('button', { name: /number 37/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Open Count by stage' }))
    expect(onOpenStep).toHaveBeenCalledWith(expect.objectContaining({ id: 'run' }))
  })

  it('uses Portuguese words and works in an Arabic page', async () => {
    const { unmount } = render(
      <FakhirProvider locale="pt-BR">
        <NumberTrace passage={passage} />
      </FakhirProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'número 37, mostrar a origem' }))
    expect(screen.getByText('De onde vem 37')).toBeInTheDocument()
    unmount()
    render(
      <FakhirProvider locale="ar">
        <div dir="rtl">
          <NumberTrace passage={['تجمع المرحلتان ', { id: 'n', text: '37', chain: [] }]} />
        </div>
      </FakhirProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /37/ }))
    expect(screen.getByRole('region')).toBeInTheDocument()
  })
})

describe('ProvenanceViews stylesheet', () => {
  it('uses logical properties, keeps 44 px targets and handles reduced motion, transparency and forced colours', () => {
    const css = cssOf('provenance/ProvenanceViews.css')
    expect(css).not.toMatch(/(^|[\s;{])(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/m)
    expect(css).toMatch(/\.fk-prov-timeline__event\s*\{[^}]*min-block-size:\s*44px/)
    expect(css).toMatch(/\.fk-prov-timeline__lane\s*\{[^}]*min-block-size:\s*110px/)
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency: reduce\)/)).toMatch(/solid/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/Highlight/)
  })
})
