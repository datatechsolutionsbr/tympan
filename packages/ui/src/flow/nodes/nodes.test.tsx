import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '../../index'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { nodeKindCatalog } from '../catalog/kindCatalog'
import { NodeKindCatalogProvider } from '../catalog/RenderCatalog'
import { AnnouncerProvider } from '../internal/Announcer'
import type { FlowNode } from '../model/types'
import { createFlowEditorStore, FlowEditorStateProvider, type FlowEditorStore } from '../state/editorState'
import { CanvasSurface } from '../surface/CanvasSurface'
import { AgentIdentity, agentTier } from './AgentIdentity'
import { AgentNode } from './AgentNode'
import { useAlignmentGuides, AlignmentGuidesOverlay } from './AlignmentGuides'
import { ConnectionPorts, ConnectToDialog, PortSet } from './ConnectionPorts'
import { DataSourceNode } from './DataSourceNode'
import { GenericNode } from './GenericNode'
import { GroupNode } from './GroupNode'
import { setGroupExpanded } from './groupLayout'
import { NodeRunIndicator } from './NodeRunIndicator'
import { NoteNode } from './NoteNode'
import { portsOf } from './ports'
import { canConnect, declaredNodeSize, nodeAccessibleName, portAnchorFor } from './registry'
import { RuleNode } from './RuleNode'
import { clearSourceMarks, registerSourceMarks } from './sourceMarks'

afterEach(() => {
  nodeKindCatalog.reset()
  clearSourceMarks()
})

function withStore(ui: ReactNode, store: FlowEditorStore = createFlowEditorStore()) {
  return { store, ...render(<FlowEditorStateProvider store={store}>{ui}</FlowEditorStateProvider>) }
}

const card = (root: ParentNode = document) => root.querySelector('.ty-node-card__activator') as HTMLElement

const node = (id: string, kind: string, data: Record<string, unknown> = {}, extra: Partial<FlowNode> = {}): FlowNode => ({ id, kind, position: { x: 0, y: 0 }, data, ...extra })

describe('GenericNode', () => {
  it('draws a kind known only to the catalog from its entry', () => {
    nodeKindCatalog.install([{ kind: 'geocode', label: 'Geocode', category: 'Data processing', icon: 'target' }])
    const { container } = render(<GenericNode id="g1" kind="geocode" onConfigure={() => {}} />)
    expect(card()).toHaveAccessibleName(/Geocode/)
    expect(screen.getAllByText('Geocode').length).toBeGreaterThan(0)
    expect(container.querySelector('.ty-node-card__bubble svg')).not.toBeNull()
  })

  it('shows the per-instance label instead of the catalog label', () => {
    nodeKindCatalog.install([{ kind: 'code', label: 'Compute', category: 'Data' }])
    render(<GenericNode id="g1" kind="code" label="Count by stage" />)
    expect(screen.getByText('Count by stage')).toBeInTheDocument()
    expect(screen.queryByText('Compute', { selector: '.ty-node-card__title' })).toBeNull()
  })

  it('renders one labelled output port per dynamic output', () => {
    const { container } = render(
      <GenericNode id="g1" kind="switch" dynamicOutputs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B', tone: 'success' }, { id: 'c', label: 'C' }]} />,
    )
    const outs = container.querySelectorAll('[data-ty-port-role="source"]')
    expect(outs).toHaveLength(3)
    expect([...outs].map((o) => o.getAttribute('data-ty-port-id'))).toEqual(['a', 'b', 'c'])
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('reaches its toolbar by Tab when the card has keyboard focus', async () => {
    render(<GenericNode id="g1" kind="code" label="Sum" onConfigure={() => {}} onDuplicate={() => {}} onRemove={() => {}} />)
    await userEvent.tab()
    expect(card()).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('toolbar')).toContainElement(document.activeElement as HTMLElement)
  })

  it('duplicates into one selected copy that a single undo removes', async () => {
    const store = createFlowEditorStore({ initial: { nodes: [node('g1', 'code', { label: 'Sum' }, { selected: true })] } })
    withStore(<GenericNode id="g1" kind="code" label="Sum" />, store)
    await userEvent.click(screen.getByRole('button', { name: /Duplicate Sum/i }))
    const nodes = store.getState().nodes
    expect(nodes).toHaveLength(2)
    expect(nodes[0]!.selected).toBe(false)
    expect(nodes[1]!.selected).toBe(true)
    act(() => store.actions.undo())
    expect(store.getState().nodes).toHaveLength(1)
  })

  it('refuses delete while the canvas is locked', () => {
    const store = createFlowEditorStore({ initial: { nodes: [node('g1', 'code', {}, { selected: true })], locked: true } })
    withStore(<GenericNode id="g1" kind="code" label="Sum" locked />, store)
    expect(screen.queryByRole('button', { name: /Remove Sum|Delete Sum/i })).toBeNull()
    act(() => store.actions.removeNodes(['g1']))
    expect(store.getState().nodes).toHaveLength(1)
  })
})

describe('AgentNode and AgentIdentity', () => {
  const agent = { id: 'a1', name: 'Coder', role: 'Reviewer', modelId: 'prov/family-2026' }

  it('shows name and role when detailed and only the name when compact', () => {
    const { rerender } = render(<AgentNode id="n1" agent={agent} onOpen={() => {}} />)
    expect(screen.getByText('Reviewer')).toBeInTheDocument()
    rerender(<AgentNode id="n1" agent={agent} density="compact" onOpen={() => {}} />)
    expect(screen.getByText('Coder')).toBeInTheDocument()
    expect(screen.queryByText('Reviewer')).toBeNull()
  })

  it('derives the same generated mark from the name on every render', () => {
    const { container, rerender } = render(<AgentNode id="n1" agent={{ id: 'a', name: 'Stage counter' }} />)
    const first = container.querySelector('.ty-agent-mark__generated')?.getAttribute('data-hash')
    rerender(<AgentNode id="n1" agent={{ id: 'a', name: 'Stage counter' }} />)
    expect(first).toBeTruthy()
    expect(container.querySelector('.ty-agent-mark__generated')?.getAttribute('data-hash')).toBe(first)
  })

  it('shows a problem card with the label and "not found" when the agent is missing, ports kept', () => {
    const { container } = render(<AgentNode id="n1" agent={null} label="Classifier" />)
    expect(screen.getByText('Classifier')).toBeInTheDocument()
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
    expect(container.querySelectorAll('[data-ty-port]').length).toBeGreaterThan(0)
  })

  it('removes without opening', async () => {
    const onRemove = vi.fn()
    const onOpen = vi.fn()
    render(<AgentNode id="n1" agent={agent} onOpen={onOpen} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Coder from canvas' }))
    expect(onRemove).toHaveBeenCalledWith('n1')
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('makes the full model id available on focus', async () => {
    const { container } = render(<AgentNode id="n1" agent={agent} onOpen={() => {}} />)
    const mark = container.querySelector('.ty-model-mark') as HTMLElement
    expect(mark).toHaveAccessibleName('model prov/family-2026')
    await expectNoAxeViolations(container)
  })

  it('AgentIdentity: bot glyph in a square mark, broken images replaced, word "agent" visible', () => {
    const { container } = render(<AgentIdentity agent={{ name: 'Coder', image: 'x.png' }} />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.ty-agent-mark__bot')).not.toBeNull()
    expect(screen.getByText('agent')).toBeInTheDocument()
  })

  it('AgentIdentity: role as secondary line with a model chip; model line when no role', () => {
    const { rerender } = render(<AgentIdentity agent={{ name: 'C', role: 'Reviewer', provider: 'p', model: 'm1' }} />)
    expect(screen.getByText('Reviewer')).toBeInTheDocument()
    expect(screen.getByText('p · m1')).toBeInTheDocument()
    rerender(<AgentIdentity agent={{ name: 'C', provider: 'p', model: 'm1' }} />)
    expect(screen.getByText('p · m1')).toHaveClass('ty-agent-identity__secondary')
  })

  it('agentTier maps ratings with thresholds and treats missing as the lowest', () => {
    expect(agentTier(5, [10, 20, 30])).toBe('beginner')
    expect(agentTier(99, [10, 20, 30])).toBe('expert')
    expect(agentTier(undefined, [10, 20, 30])).toBe('beginner')
  })
})

describe('RuleNode', () => {
  const rule = { id: 'r1', name: 'Discount', adjustment: { type: 'percent' as const, value: 10 }, enabled: true }

  it('signs adjustments: +10% and a minus for negative fixed values', () => {
    const { rerender } = render(<RuleNode id="n" rule={rule} />)
    expect(screen.getByText('+10%')).toBeInTheDocument()
    rerender(<RuleNode id="n" rule={{ ...rule, adjustment: { type: 'fixed', value: -5 } }} />)
    expect(screen.getByText('−5')).toBeInTheDocument()
  })

  it('toggles without opening the editor', async () => {
    const onToggle = vi.fn()
    const onOpen = vi.fn()
    render(<RuleNode id="n" rule={rule} onToggleEnabled={onToggle} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onToggle).toHaveBeenCalledWith(rule)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('engine mode shows variables and output when detailed, hidden when compact', () => {
    const cfg = { contextVariables: ['a', 'b'], outputVariable: 'score' }
    const { rerender } = render(<RuleNode id="n" config={cfg} />)
    expect(screen.getByText(/2 variables/)).toBeInTheDocument()
    expect(screen.getByText(/score/)).toBeInTheDocument()
    rerender(<RuleNode id="n" config={cfg} density="compact" />)
    expect(screen.queryByText(/2 variables/)).toBeNull()
  })

  it('shows the problem card without rule or config', () => {
    const { container } = render(<RuleNode id="n" />)
    expect(container.querySelector('.ty-node-card')).toHaveAttribute('data-problem', 'true')
  })
})

describe('NoteNode', () => {
  it('shows the placeholder, edits on double-click and commits on Escape', async () => {
    const onTextChange = vi.fn()
    const { rerender } = render(<NoteNode id="n" text="" placeholder="Write a note" onTextChange={onTextChange} />)
    expect(screen.getByText('Write a note')).toBeInTheDocument()
    rerender(<NoteNode id="n" text="Hello" onTextChange={onTextChange} />)
    await userEvent.dblClick(screen.getByText('Hello'))
    const field = screen.getByRole('textbox')
    expect(field).toHaveFocus()
    expect(field).toHaveValue('Hello')
    await userEvent.type(field, ' there')
    await userEvent.keyboard('{Escape}')
    expect(onTextChange).toHaveBeenCalledWith('Hello there')
  })

  it('keeps typed keys away from canvas shortcuts and falls back to the default tone', async () => {
    const shortcut = vi.fn()
    const { container } = render(
      <div onKeyDown={shortcut}>
        <NoteNode id="n" text="x" tone="purple" onTextChange={() => {}} />
      </div>,
    )
    expect(container.querySelector('.ty-note-node')).toHaveAttribute('data-tone', 'categorical-1')
    await userEvent.dblClick(screen.getByText('x'))
    shortcut.mockClear()
    await userEvent.keyboard('a')
    expect(shortcut).not.toHaveBeenCalled()
  })

  it('never accepts a connection', () => {
    expect(canConnect(node('a', 'code'), node('n', 'note'))).toBe(false)
    expect(portsOf(node('n', 'note'), { ports: () => undefined }, 'right')).toEqual({ inputs: [], outputs: [] })
  })
})

describe('GroupNode', () => {
  const members = [node('g', 'group', { expanded: true }, { size: { width: 400, height: 300 } }), node('m1', 'code', {}, { parentId: 'g' }), node('m2', 'code', {}, { parentId: 'g' })]

  it('collapsing hides members and their connectors; expanding restores them', () => {
    const graph = { nodes: members, connectors: [{ id: 'c', source: 'm1', target: 'm2' }] }
    const collapsed = setGroupExpanded(graph, 'g', false)
    expect(collapsed.nodes.filter((n) => n.parentId === 'g').every((n) => n.hidden)).toBe(true)
    expect(collapsed.connectors[0]!.hidden).toBe(true)
    const expanded = setGroupExpanded(collapsed, 'g', true)
    expect(expanded.nodes.find((n) => n.id === 'm1')!.position).toEqual({ x: 0, y: 0 })
    expect(expanded.nodes.some((n) => n.hidden)).toBe(false)
  })

  it('shows the name on the collapsed card and exposes aria-expanded', async () => {
    const onToggle = vi.fn()
    render(<GroupNode id="g" name="Intake" expanded={false} onToggleExpanded={onToggle} />)
    expect(screen.getByText('Intake')).toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: /Expand Intake/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledWith('g')
  })

  it('manual resize by keyboard reports the new size', async () => {
    const onResize = vi.fn()
    render(<GroupNode id="g" name="Intake" size={{ width: 400, height: 300 }} onToggleExpanded={() => {}} onResize={onResize} selected />)
    screen.getByRole('group', { name: 'Intake' }).focus()
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(onResize).toHaveBeenCalledWith('g', { width: 424, height: 300 })
  })

  it('has no delete control without onRemove and no resize handle while locked', () => {
    const { container } = render(<GroupNode id="g" name="Intake" onToggleExpanded={() => {}} onResize={() => {}} selected locked />)
    expect(screen.queryByRole('button', { name: /Remove|Delete/i })).toBeNull()
    expect(container.querySelector('.ty-group-node__resize')).toBeNull()
  })
})

describe('DataSourceNode', () => {
  const config = { sourceId: 's1', dialect: 'postgresql', table: 'cases', selectedColumns: ['a', 'b', 'c'], filters: [{}, {}], limit: 100 }

  it('reads the counts in order and omits zero counts', () => {
    const { container, rerender } = render(<DataSourceNode id="d" config={config} source={{ name: 'Census' }} />)
    const text = container.querySelector('.ty-datasource-node__counts')!.textContent!
    expect(text.indexOf('3')).toBeLessThan(text.indexOf('2'))
    expect(text).toMatch(/100/)
    rerender(<DataSourceNode id="d" config={{ ...config, filters: [] }} source={{ name: 'Census' }} />)
    expect(container.querySelector('.ty-datasource-node__counts')!.textContent).not.toMatch(/filter/i)
  })

  it('shows the problem card with both ports when not configured', () => {
    const { container } = render(<DataSourceNode id="d" config={null} />)
    expect(container.querySelector('.ty-node-card')).toHaveAttribute('data-problem', 'true')
    expect(container.querySelectorAll('[data-ty-port]')).toHaveLength(2)
  })

  it('read-only sample: "sample" shown and no connection indicator', () => {
    const { container } = render(<DataSourceNode id="d" config={config} readOnly source={{ name: 'S', connected: true }} />)
    expect(screen.getAllByText(/sample/i).length).toBeGreaterThan(0)
    expect(container.querySelector('.ty-datasource-node__connection')).toBeNull()
  })

  it('uses the neutral glyph without a mark, hides a registered mark from AT, falls back when it fails', () => {
    const { container, rerender } = render(<DataSourceNode id="d" config={config} dialects={[{ key: 'postgresql', displayName: 'PostgreSQL' }]} />)
    expect(container.querySelector('[data-mark="fallback"]')).not.toBeNull()
    expect(screen.getAllByText('PostgreSQL').length).toBeGreaterThan(0)
    registerSourceMarks({ postgresql: { src: 'pg.svg' } as never })
    rerender(<DataSourceNode id="d2" config={config} dialects={[{ key: 'postgresql', displayName: 'PostgreSQL' }]} />)
    const img = container.querySelector('img.ty-source-mark')!
    expect(img).toHaveAttribute('aria-hidden', 'true')
    fireEvent.error(img)
    expect(container.querySelector('[data-mark="fallback"]')).not.toBeNull()
  })

  it('keeps the dialect in the accessible name when compact; not a button without onConfigure', () => {
    const { rerender } = render(<DataSourceNode id="d" config={config} density="compact" onConfigure={() => {}} dialects={[{ key: 'postgresql', displayName: 'PostgreSQL' }]} />)
    expect(screen.getByRole('button', { name: /PostgreSQL/ })).toBeInTheDocument()
    rerender(<DataSourceNode id="d" config={config} density="compact" />)
    expect(screen.queryByRole('button', { name: /data source/i })).toBeNull()
  })

  it('reads "not connected" with its icon', () => {
    const { container } = render(<DataSourceNode id="d" config={config} source={{ name: 'S', connected: false }} />)
    const ind = container.querySelector('.ty-datasource-node__connection')!
    expect(ind).toHaveTextContent(/not connected/i)
    expect(ind.querySelector('svg')).not.toBeNull()
  })
})

describe('NodeRunIndicator', () => {
  function setResult(store: FlowEditorStore, r: Parameters<FlowEditorStore['actions']['setNodeResult']>[1]) {
    act(() => store.actions.setNodeResult('n', r))
  }

  it('renders nothing without a result; success shows the mark and "340 ms"', () => {
    const { store, container } = withStore(<NodeRunIndicator nodeId="n" />)
    expect(container.querySelector('.ty-node-run-indicator')).toBeNull()
    setResult(store, { status: 'success', durationMs: 340 })
    expect(container.querySelector('.ty-node-run-indicator svg')).not.toBeNull()
    expect(screen.getByText('340 ms')).toBeInTheDocument()
  })

  it('puts "failed" and the message in the node name and shows 2.5 s', () => {
    const store = createFlowEditorStore({ initial: { nodes: [node('n', 'code', { label: 'Fetch' })] } })
    store.actions.setNodeResult('n', { status: 'error', durationMs: 2500, error: 'timeout' })
    withStore(<GenericNode id="n" kind="code" label="Fetch" onConfigure={() => {}} />, store)
    expect(card()).toHaveAccessibleDescription(/failed.*timeout/)
    expect(screen.getByText('2.5 s')).toBeInTheDocument()
  })

  it('announces the focused node once when its state changes', () => {
    const store = createFlowEditorStore()
    store.actions.setNodeResult('n', { status: 'running' })
    render(
      <AnnouncerProvider>
        <FlowEditorStateProvider store={store}>
          <GenericNode id="n" kind="code" label="Fetch" onConfigure={() => {}} />
        </FlowEditorStateProvider>
      </AnnouncerProvider>,
    )
    act(() => card().focus())
    act(() => store.actions.setNodeResult('n', { status: 'success', durationMs: 10 }))
    expect(screen.getByRole('status')).toHaveTextContent(/Fetch.*succeeded/)
  })

  it('stops spinning under reduced motion and keeps glyphs in forced colours', () => {
    const css = cssOf('flow/nodes/flow-nodes.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/ty-node-run-indicator__mark[^}]*\{[^}]*animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/\.ty-node-run-indicator svg[^}]*\{[^}]*CanvasText/)
  })
})

describe('ConnectionPorts', () => {
  it('moves start-side inputs to the top in top-down layout, keeping ids', () => {
    const p = portsOf(node('n', 'code'), { ports: () => undefined }, 'down')
    expect(p.inputs[0]).toMatchObject({ id: 'in', side: 'top' })
    expect(portAnchorFor(node('n', 'code'), 'in', 'target', 'down', { ports: () => undefined })).toEqual({ side: 'top', along: 0.5 })
  })

  it('spreads a port set of three at quarters with prefixed ids', () => {
    const { container } = render(<PortSet count={3} idPrefix="case" direction="output" side="end" nodeId="n" nodeLabel="Check stock" />)
    const ports = [...container.querySelectorAll('[data-ty-port]')]
    expect(ports.map((p) => p.getAttribute('data-ty-port-id'))).toEqual(['case-0', 'case-1', 'case-2'])
    expect(ports.map((p) => (p as HTMLElement).style.getPropertyValue('--ty-port-along'))).toEqual(['25%', '50%', '75%'])
  })

  it('names ports and does not make them tab stops', () => {
    const p = portsOf(node('n', 'if-else'), { ports: () => undefined }, 'right')
    const { container } = render(<ConnectionPorts nodeId="n" nodeLabel="Check stock" inputs={p.inputs} outputs={p.outputs} />)
    expect(container).toHaveTextContent('output true of Check stock')
    expect(container.querySelectorAll('[data-ty-port][tabindex]')).toHaveLength(0)
  })

  it('floating mode: dropping anywhere on a valid node connects; a plain click still activates', () => {
    const onConnect = vi.fn()
    const onActivate = vi.fn()
    const nodes = [
      { id: 'a', rect: { x: 0, y: 0, width: 256, height: 96 } },
      { id: 'b', rect: { x: 400, y: 0, width: 256, height: 96 } },
    ]
    render(
      <NodeKindCatalogProvider floatingConnections>
        <CanvasSurface
          label="Flow"
          floating
          nodes={nodes}
          renderNode={(n) => <GenericNode id={n.id} kind="code" label={n.id.toUpperCase()} onConfigure={n.id === 'b' ? onActivate : () => {}} />}
          connect={{ canConnect: () => true, onConnect }}
        />
      </NodeKindCatalogProvider>,
    )
    const out = document.querySelector('[data-ty-port-node="a"][data-ty-port-role="source"]')!
    const pe = (type: string) => {
      const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 1, clientY: 1, button: 0 })
      Object.defineProperty(e, 'pointerId', { value: 1 })
      Object.defineProperty(e, 'pointerType', { value: 'mouse' })
      return e
    }
    fireEvent(out, pe('pointerdown'))
    const cardB = screen.getByText('B')
    fireEvent(cardB, pe('pointermove'))
    fireEvent(cardB, pe('pointerup'))
    expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ nodeId: 'a' }), expect.objectContaining({ nodeId: 'b', role: 'target' }))
    fireEvent.click(document.querySelector('[data-ty-node-id="b"] .ty-node-card__activator')!)
    expect(onActivate).toHaveBeenCalled()
  })

  it('"Connect to" creates the same connection as a drag', async () => {
    const onConnect = vi.fn()
    render(<ConnectToDialog isOpen onOpenChange={() => {}} sourceId="a" sourceLabel="Fetch" outputs={[]} targets={[{ nodeId: 'b', label: 'Count' }]} onConnect={onConnect} />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: /Count/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Connect' }))
    expect(onConnect).toHaveBeenCalledWith({ nodeId: 'a', role: 'source' }, { nodeId: 'b', role: 'target' })
  })

  it('keeps 44 px hit areas, no pulse under reduced motion, bordered dots in forced colours', () => {
    const css = cssOf('flow/nodes/flow-nodes.css')
    expect(css).toMatch(/\.ty-port\s*\{[^}]*var\(--ty-control-target, 44px\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/data-target='valid'/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/\.ty-port__dot\s*\{[^}]*CanvasText/)
    expect(css).not.toMatch(/(^|[^-])(left|right)\s*:/m)
  })
})

describe('Alignment guides', () => {
  function Harness({ onApi }: { onApi: (api: ReturnType<typeof useAlignmentGuides>) => void }) {
    const api = useAlignmentGuides({ nameOf: (id) => `Node ${id}` })
    onApi(api)
    return (
      <svg>
        <AlignmentGuidesOverlay guides={api.guides} />
      </svg>
    )
  }
  const others = [
    { id: 'x', rect: { x: 100, y: 300, width: 50, height: 20 } },
    { id: 'y', rect: { x: 400, y: 100, width: 50, height: 20 } },
  ]

  it('shows a vertical guide for equal left edges, the closest match wins, clears on stop', () => {
    let api!: ReturnType<typeof useAlignmentGuides>
    const { container } = render(<Harness onApi={(a) => (api = a)} />)
    expect(container.querySelector('line')).toBeNull()
    act(() => api.createDragHandler([...others, { id: 'm', rect: { x: 0, y: 0, width: 50, height: 20 } }])({ x: 102, y: 0, width: 50, height: 20 }, 'm', ['m']))
    expect(container.querySelector('line[data-axis="vertical"]')).toHaveAttribute('x1', '100')
    act(() => api.onDragStop())
    expect(container.querySelector('line')).toBeNull()
  })

  it('uses another node top for a middle within the threshold and ignores dragged peers', () => {
    let api!: ReturnType<typeof useAlignmentGuides>
    const { container } = render(<Harness onApi={(a) => (api = a)} />)
    act(() => api.createDragHandler([...others, { id: 'peer', rect: { x: 700, y: 700, width: 50, height: 20 } }])({ x: 700, y: 92, width: 50, height: 20 }, 'm', ['m', 'peer']))
    expect(container.querySelector('line[data-axis="horizontal"]')).toHaveAttribute('y1', '100')
  })

  it('announces "aligned with" after a keyboard move', () => {
    let api!: ReturnType<typeof useAlignmentGuides>
    render(
      <AnnouncerProvider>
        <Harness onApi={(a) => (api = a)} />
      </AnnouncerProvider>,
    )
    act(() => api.onKeyboardMove(others, { x: 100, y: 0, width: 50, height: 20 }, 'm'))
    expect(screen.getByRole('status')).toHaveTextContent(/aligned with Node x/i)
  })
})

describe('registry', () => {
  it('applies the connection rules', () => {
    expect(canConnect(node('a', 'code'), node('a', 'code'))).toBe(false)
    expect(canConnect(node('a', 'code'), node('s', 'start'))).toBe(false)
    expect(canConnect(node('e', 'end'), node('b', 'code'))).toBe(false)
    expect(canConnect(node('r', 'rule'), node('b', 'code'))).toBe(false)
    expect(canConnect(node('i', 'iteration'), node('is', 'iteration-start', { iterationId: 'i' }))).toBe(true)
    expect(canConnect(node('x', 'code'), node('is', 'iteration-start', { iterationId: 'i' }))).toBe(false)
  })

  it('sizes nodes before measurement and speaks kind and label', () => {
    expect(declaredNodeSize(node('a', 'agent'), 'detailed').width).toBe(304)
    expect(declaredNodeSize(node('n', 'note', {}, { size: { width: 200, height: 120 } }), 'detailed')).toEqual({ width: 200, height: 120 })
    expect(nodeAccessibleName(node('a', 'code', { label: 'Sum' }), { entry: () => ({ label: 'Compute', category: 'x' }) })).toBe('Compute: Sum')
  })
})

describe('locales and right-to-left', () => {
  it('uses the built-in Portuguese and Spanish strings', () => {
    const { rerender } = render(
      <TympanProvider locale="pt-BR">
        <AgentNode id="n" agent={{ id: 'a', name: 'Codificador' }} onRemove={() => {}} />
      </TympanProvider>,
    )
    expect(screen.getByRole('button', { name: /Remover Codificador/ })).toBeInTheDocument()
    rerender(
      <TympanProvider locale="es">
        <NoteNode id="n" text="" onTextChange={() => {}} />
      </TympanProvider>,
    )
    expect(document.body.textContent).not.toMatch(/Write a note|Add a note/)
  })

  it('works under Arabic (RTL): ports keep logical sides, keyboard rename still works', async () => {
    const onRename = vi.fn()
    const { container } = render(
      <TympanProvider locale="ar">
        <div dir="rtl">
          <GenericNode id="n" kind="code" label="عدّ حسب المرحلة" onConfigure={() => {}} onRename={onRename} />
        </div>
      </TympanProvider>,
    )
    expect(container.querySelector('[data-ty-port-role="target"]')).toHaveAttribute('data-side', 'start')
    act(() => card().focus())
    await userEvent.keyboard('{F2}')
    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), 'مرحلة{Enter}')
    expect(onRename).toHaveBeenCalledWith('n', 'مرحلة')
  })
})
