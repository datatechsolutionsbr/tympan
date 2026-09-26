import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { FakhirProvider } from '@fakhir/design-system'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { FlowEditor } from '../editor/FlowEditor'
import { researchStepWords, readyCatalog, researchStepCatalog, summaryLine } from './researchSteps'
import type { FlowConnector, FlowNode } from '../model/types'
import { createFlowEditorStore } from '../state/editorState'
import { StepPalette, STEP_MEDIA_TYPE, stepDragType, stepOfDrag } from './StepPalette'
import { autoLayout } from '../layout/autoLayout'
import { StepsProvider } from './StepsContext'
import { stepToolItems } from './stepTools'
import { stepEditorWords } from './stepLabels'
import { linkThrough, stepsAccepting, swapNeighbours, wiringIssues } from './wiring'

const en = readyCatalog(researchStepCatalog, researchStepWords.bundles.en)
const pt = readyCatalog(researchStepCatalog, { ...researchStepWords.bundles.en, ...researchStepWords.bundles['pt-BR'] } as Record<string, string>)
const ids = (steps: { id: string }[]) => steps.map((s) => s.id)

const step = (id: string, stepId: string, data: Record<string, unknown> = {}): FlowNode => ({ id, kind: 'step', position: { x: 0, y: 0 }, data: { stepId, ...data } })
const wire = (id: string, source: string, target: string): FlowConnector => ({ id, source, target, sourcePort: 'out', targetPort: 'in-0' })

const flow = () => ({
  nodes: [step('ed', 'frozen-edition', { edition: '2026-09-20', count: 582 }), step('flt', 'filter'), step('grp', 'group', { label: 'By phase' }), step('cnt', 'describe', { label: 'Count per phase' })],
  connectors: [wire('a', 'ed', 'flt'), wire('b', 'flt', 'grp'), wire('c', 'grp', 'cnt')],
})

describe('typed wiring', () => {
  it('offers only the steps whose input takes the arriving shape, and no AI step when agents are off', () => {
    const afterTable = ids(stepsAccepting('table', en.steps))
    expect(afterTable).toEqual(expect.arrayContaining(['join', 'describe', 'reliability', 'composite-index', 'citable-table', 'citable-chart']))
    expect(afterTable).not.toContain('filter')
    expect(ids(stepsAccepting('records', en.steps))).toContain('agent-decision')
    expect(ids(stepsAccepting('records', en.steps, false))).not.toContain('agent-decision')
    expect(stepsAccepting(null, en.steps)).toEqual([])
  })

  it('finds a mismatched link and proposes a bridging step, else removing the link', () => {
    const nodes = [step('t', 'citable-table'), step('n', 'manuscript-number'), step('c', 'citable-chart'), step('r', 'reliability')]
    const found = wiringIssues(nodes, [wire('x', 't', 'n'), wire('y', 'c', 'r')], en.steps)
    expect(found).toHaveLength(2)
    // Same kind of work that takes a table: swap the step.
    expect(found[0]).toMatchObject({ nodeId: 'n', gets: 'table', expects: ['number'], repair: { kind: 'replace', nodeId: 'n', stepId: 'citable-table' } })
    expect(found[1]).toMatchObject({ nodeId: 'r', gets: 'chart', repair: { kind: 'unlink', connectorId: 'y' } })
    expect(wiringIssues(flow().nodes, flow().connectors, en.steps)).toEqual([])
  })

  it('splits a link through a new step and reorders chain neighbours', () => {
    let n = 0
    const through = linkThrough(flow().connectors, 'b', 'new', () => `k${++n}`)
    expect(through.map((c) => `${c.source}>${c.target}`)).toEqual(['ed>flt', 'grp>cnt', 'flt>new', 'new>grp'])
    const swapped = swapNeighbours(flow().connectors, 'flt', 'grp')!
    expect(swapped.map((c) => `${c.source}>${c.target}`)).toEqual(['ed>grp', 'grp>flt', 'flt>cnt'])
    expect(swapNeighbours(flow().connectors, 'ed', 'cnt')).toBeNull()
  })

  it('lets the host word the line, and names a dragged step in its drag types', () => {
    expect(summaryLine(en.byId.get('group')!, { keys: 'phase', line: '[n] groups' }, 'en')).toBe('[n] groups')
    expect(stepOfDrag([STEP_MEDIA_TYPE, stepDragType('recode'), 'text/plain'])).toBe('recode')
    expect(stepOfDrag(['text/plain'])).toBeNull()
  })

  it('keeps a chain on one line and puts a branch after it (mirrored in RTL)', () => {
    const size = { width: 250, height: 86 }
    const nodes = ['a', 'b', 'c', 'd'].map((id) => ({ id, kind: 'step', position: { x: 0, y: 0 }, size }))
    const links = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'b', target: 'd' },
    ]
    const at = Object.fromEntries(autoLayout(nodes, links, 'top-down', { rankGap: 54, siblingGap: 24, alignment: 'start' }).map((n) => [n.id, n.position]))
    expect(at.a!.x).toBe(at.b!.x)
    expect(at.c!.x).toBe(at.b!.x)
    expect(at.d!.x).toBe(at.c!.x + 250 + 24)
    expect(at.c!.y).toBe(at.d!.y)
    const rtl = Object.fromEntries(autoLayout(nodes, links, 'top-down', { rankGap: 54, siblingGap: 24, alignment: 'start', rtl: true }).map((n) => [n.id, n.position]))
    expect(rtl.d!.x).toBeLessThan(rtl.c!.x)
  })

  it('writes the one-line summary only when every value it names is set', () => {
    const edition = pt.byId.get('frozen-edition')!
    expect(summaryLine(edition, { edition: '2026-09-20', count: 582 }, 'pt-BR')).toBe('2026-09-20 · 582 registros')
    expect(summaryLine(edition, { edition: '2026-09-20', count: 1 }, 'pt-BR')).toBe('2026-09-20 · 1 registro')
    expect(summaryLine(edition, { edition: '2026-09-20' }, 'pt-BR')).toBeNull()
  })

  it('puts the dock items in three groups: pointer, shaping, finding', () => {
    const items = stepToolItems({ words: stepEditorWords.bundles['pt-BR'] as never, mode: 'select', onModeChange: () => {}, onAdd: () => {}, onArrange: () => {}, onFit: () => {}, listView: false, onToggleList: () => {}, onSearch: () => {} })
    expect(items.map((i) => `${i.group}:${i.label}`)).toEqual([
      'mode:Selecionar',
      'mode:Mover',
      'layout:Adicionar passo',
      'layout:Reorganizar',
      'layout:Ajustar à tela',
      'find:Ver como lista',
      'find:Buscar passo',
    ])
    expect(items.find((i) => i.id === 'add-step')!.shortcut).toBe('A')
  })
})

describe('StepPalette', () => {
  const inPt = (ui: ReactNode) => render(<FakhirProvider locale="pt-BR">{ui}</FakhirProvider>)

  it('shelves steps by research verb with their purpose and typed chips, in Portuguese', async () => {
    const { container } = inPt(
      <StepsProvider>
        <StepPalette onPlace={() => {}} />
      </StepsProvider>,
    )
    for (const shelf of ['Entrada', 'Preparar', 'Analisar', 'Decidir', 'Saída']) expect(screen.getByRole('heading', { name: shelf })).toBeInTheDocument()
    expect(screen.getByText('Onde os dados entram')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'Edição congelada' })).toHaveTextContent('início')
    expect(container).not.toHaveTextContent(/Control flow|Data processing|0 itens|Nenhum .* ainda/)
    const filterRow = screen.getByRole('row', { name: 'Filtrar' })
    expect(filterRow).toHaveTextContent('Recebe: registros')
    expect(filterRow).toHaveTextContent('Entrega: registros')
    expect(screen.getByRole('row', { name: 'Decisão por agente' })).toHaveTextContent('IA')
    // Engine primitives wait on a folded shelf.
    expect(screen.getByRole('button', { name: 'Avançado' })).toHaveAttribute('aria-expanded', 'false')
    await expectNoAxeViolations(container)
  })

  it('hides shelves left empty by the filter and says when nothing matches', async () => {
    inPt(
      <StepsProvider>
        <StepPalette onPlace={() => {}} recent={['group']} />
      </StepsProvider>,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Recentes' }))
    expect(screen.getAllByRole('row').map((r) => r.getAttribute('aria-label'))).toEqual(['Agrupar'])
    expect(screen.queryByRole('heading', { name: 'Entrada' })).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: 'Sem IA' }))
    expect(screen.queryByRole('row', { name: 'Decisão por agente' })).toBeNull()
    expect(screen.getByRole('row', { name: 'Regra' })).toBeInTheDocument()
    await userEvent.type(screen.getByRole('searchbox'), 'zzz')
    expect(screen.getByText('Nenhum passo corresponde a “zzz”')).toBeInTheDocument()
  })

  it('jumps to the search with "/" and marks AI steps unavailable when the project has no agents', async () => {
    inPt(
      <StepsProvider aiAllowed={false}>
        <StepPalette onPlace={() => {}} />
      </StepsProvider>,
    )
    await userEvent.keyboard('/')
    expect(screen.getByRole('searchbox')).toHaveFocus()
    expect(screen.getByText('IA desativada neste projeto', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'Decisão por agente' })).toHaveAttribute('aria-disabled', 'true')
  })
})


describe('FlowEditor with research steps', () => {
  const mount = (graph = flow(), extra: Record<string, unknown> = {}) => {
    const store = createFlowEditorStore({ initial: { nodes: graph.nodes, connectors: graph.connectors } })
    const view = render(<FlowEditor store={store} palette={false} {...extra} />)
    return { store, ...view }
  }
  const focusBody = (id: string) => {
    const body = document.querySelector<HTMLElement>(`[data-fk-node-id="${id}"] .fk-step__body`)!
    act(() => body.focus())
    return body
  }

  it('draws steps with kind, title, summary, run badge and typed chips', async () => {
    const { store, container } = mount()
    act(() => store.actions.setNodeResult('ed', { status: 'success' }))
    const card = container.querySelector('[data-fk-node-id="ed"] .fk-step')!
    expect(card).toHaveTextContent('Input')
    expect(card).toHaveTextContent('Frozen edition')
    expect(card).toHaveTextContent('2026-09-20 · 582 records')
    expect(card).toHaveTextContent('ok')
    expect(within(card as HTMLElement).getByRole('button', { name: 'Input: Frozen edition' })).toHaveAccessibleDescription(/Gives: records/)
    expect(container.querySelector('[data-fk-node-id="flt"] .fk-step__line')).toHaveTextContent('not configured')
    await expectNoAxeViolations(container, ['nested-interactive'])
  })

  it('adds after a step with A: only fitting steps are offered, Enter inserts, links and one undo removes it', async () => {
    const { store } = mount()
    focusBody('cnt')
    await userEvent.keyboard('a')
    const dialog = await screen.findByRole('dialog', { name: 'Add after “Count per phase”' })
    const names = within(dialog).getAllByRole('option').map((o) => o.getAttribute('aria-label') ?? o.textContent)
    expect(names.some((n) => /Filter/.test(n!))).toBe(false)
    // A join needs a second input, so it is not offered after one step.
    expect(names.some((n) => /Join/.test(n!))).toBe(false)
    expect(names.some((n) => /Citable table/.test(n!))).toBe(true)
    await userEvent.type(within(dialog).getByRole('searchbox'), 'citable t')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    const added = store.getState().nodes.find((n) => n.data.stepId === 'citable-table')!
    expect(added).toBeDefined()
    expect(store.getState().connectors.some((c) => c.source === 'cnt' && c.target === added.id)).toBe(true)
    act(() => store.actions.undo())
    expect(store.getState().nodes.some((n) => n.data.stepId === 'citable-table')).toBe(false)
  })

  it('adds from the dock item after the selected step, and loose when nothing is selected', async () => {
    const { store } = mount()
    await userEvent.click(screen.getByRole('button', { name: 'Add a step' }))
    const loose = await screen.findByRole('dialog', { name: 'Add a step' })
    expect(within(loose).getAllByRole('option').length).toBeGreaterThan(10)
    await userEvent.keyboard('{Escape}')
    act(() => store.actions.select(['grp']))
    await userEvent.click(screen.getByRole('button', { name: 'Add a step' }))
    expect(await screen.findByRole('dialog', { name: 'Add after “By phase”' })).toBeInTheDocument()
  })

  it('drops a palette step and links it after the nearest open end that fits', () => {
    const { store } = mount()
    const canvas = document.querySelector('.fk-editor__canvas')!
    const data = new Map([[STEP_MEDIA_TYPE, JSON.stringify({ stepId: 'citable-chart' })]])
    const dataTransfer = { types: [...data.keys()], getData: (t: string) => data.get(t) ?? '', dropEffect: 'none' }
    fireEvent.dragOver(canvas, { dataTransfer, clientX: 100, clientY: 100 })
    fireEvent.drop(canvas, { dataTransfer, clientX: 100, clientY: 100 })
    const chart = store.getState().nodes.find((n) => n.data.stepId === 'citable-chart')!
    expect(store.getState().connectors.find((c) => c.target === chart.id)?.source).toBe('cnt')
  })

  it('marks a mismatched link on the step and repairs it from the status bar in one press (swap for a fitting step)', async () => {
    const g = flow()
    g.nodes.push(step('num', 'manuscript-number'))
    g.connectors.push(wire('bad', 'cnt', 'num'))
    const { store, container } = mount(g)
    expect(container.querySelector('[data-fk-node-id="num"] .fk-step')).toHaveAttribute('data-issue', 'true')
    expect(container.querySelector('[data-fk-node-id="num"] .fk-step__line')).toHaveTextContent('expects number; gets table')
    expect(container.querySelector('.fk-issue-bar')).toHaveTextContent('1 problem: “Number for the manuscript” expects number and gets table.')
    await userEvent.click(screen.getByRole('button', { name: 'Replace with Citable table' }))
    expect(store.getState().nodes.find((n) => n.id === 'num')!.data.stepId).toBe('citable-table')
    expect(container.querySelector('.fk-issue-bar')).toBeNull()
  })

  it('sums the flow up with nothing selected and edits a step when one is', async () => {
    const onValidate = () => {}
    const { store } = mount(flow(), { flowFacts: { version: 'v-sample', runsOverEdition: 2, deterministic: true, seed: 's' }, onValidate, outputPreview: (id: string) => (id === 'cnt' ? { columns: ['phase', 'n'], rows: [['a', 9]] } : null) })
    const side = screen.getByRole('complementary', { name: 'Flow summary' })
    expect(side).toHaveTextContent('Steps4')
    expect(side).toHaveTextContent('Uses AIno')
    expect(side).toHaveTextContent('Deterministicyes · seed s')
    await userEvent.click(within(side).getByRole('button', { name: 'Validate flow' }))
    expect(side).toHaveTextContent('No problems found')
    act(() => store.actions.select(['cnt']))
    const settings = screen.getByRole('complementary', { name: 'Count per phase' })
    expect(within(settings).getByRole('table')).toHaveTextContent('9')
    const counts = within(settings).getByRole('textbox', { name: 'Counts' })
    await userEvent.type(counts, '9 · 26{Tab}')
    expect(store.getState().nodes.find((n) => n.id === 'cnt')!.data.counts).toBe('9 · 26')
    await userEvent.click(within(settings).getByRole('button', { name: 'Remove' }))
    expect(store.getState().nodes.some((n) => n.id === 'cnt')).toBe(false)
  })

  it('shows the list view from the dock: arrows move, Alt+arrows reorder, A adds, Enter configures', async () => {
    const { store, container } = mount()
    await userEvent.click(screen.getByRole('button', { name: 'Show as list' }))
    const list = screen.getByRole('region', { name: 'Flow steps' })
    const rows = within(list).getAllByRole('listitem').filter((li) => li.classList.contains('fk-flow-list__row'))
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringContaining('Frozen edition'), expect.stringContaining('Filter'), expect.stringContaining('By phase'), expect.stringContaining('Count per phase')])
    const first = within(rows[0]!).getAllByRole('button')[0]!
    act(() => first.focus())
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveTextContent('Filter')
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(store.getState().connectors.map((c) => `${c.source}>${c.target}`).sort()).toEqual(['ed>grp', 'flt>cnt', 'grp>flt'])
    expect(document.activeElement).toHaveTextContent('Filter')
    expect(within(list).getByRole('button', { name: 'Add a step here' })).toBeInTheDocument()
    await userEvent.keyboard('a')
    expect(await screen.findByRole('dialog', { name: 'Add after “Filter”' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expectNoAxeViolations(container)
  })

  it('reads in Portuguese and mirrors in Arabic', () => {
    const g = flow()
    const store = createFlowEditorStore({ initial: { nodes: g.nodes, connectors: g.connectors } })
    const { unmount } = render(
      <FakhirProvider locale="pt-BR">
        <FlowEditor store={store} />
      </FakhirProvider>,
    )
    expect(screen.getByRole('complementary', { name: 'Resumo do fluxo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver como lista' })).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/Control flow|Start|End|Branch/)
    unmount()
    render(
      <FakhirProvider locale="ar">
        <div dir="rtl">
          <FlowEditor store={store} palette={false} />
        </div>
      </FakhirProvider>,
    )
    expect(document.querySelector('.fk-editor')!.closest('[dir="rtl"]')).not.toBeNull()
  })

  it('keeps its styles logical, with forced colours and reduced motion', () => {
    const css = cssOf('steps/steps.css')
    expect(css).not.toMatch(/(^|[^-])(left|right)\s*:/m)
    expect(css).toMatch(/\[dir='rtl'\] \.fk-shape-flow__arrow/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
  })
})
