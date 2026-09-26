import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '@datatechsolutions/tympan'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { setMedia, setViewportWidth } from '../../test/media'
import { nodeKindCatalog, type NodeKindEntry } from '../catalog/kindCatalog'
import type { FlowConnector, FlowNode } from '../model/types'
import type { CanvasApi } from '../surface/types'
import { CanvasCommandBar, type CanvasCommandBarProps } from './CanvasCommandBar'
import { CanvasBackgroundMenu, NodeContextMenu, nodeSize, SelectionContextMenu } from './CanvasContextMenus'
import { FlowPreview } from './FlowPreview'
import { FlowSwitcherBar } from './FlowSwitcherBar'
import { editorKeyMap } from './keyMap'
import { NodePalette, paletteDragItems } from './NodePalette'
import { RunControls } from './RunControls'
import { SaveStatus } from './SaveStatus'
import { useEditorClipboard, useEditorHistory, useEditorShortcuts } from './useEditorShortcuts'
import { useSelectionArrange } from './useSelectionArrange'

afterEach(() => nodeKindCatalog.reset())

const n = (id: string, x = 0, extra: Partial<FlowNode> = {}): FlowNode => ({ id, kind: 'code', position: { x, y: 0 }, data: { label: id }, size: { width: 100, height: 40 }, ...extra })

// ---- EditorShortcuts ------------------------------------------------------

function ShortcutHarness({ handlers, singleKey, locked }: { handlers: Parameters<typeof useEditorShortcuts>[0]; singleKey?: boolean; locked?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const onLeave = () => document.getElementById('toolbar')?.focus()
  useEditorShortcuts(locked ? { ...handlers, delete: () => false } : handlers, { scope: ref, ...(singleKey !== undefined ? { singleKey } : {}), onLeave })
  return (
    <>
      <div ref={ref} tabIndex={0} data-testid="canvas">
        <input aria-label="name" />
      </div>
      <button id="toolbar" type="button">
        tools
      </button>
      <input aria-label="outside" />
    </>
  )
}

describe('EditorShortcuts', () => {
  it('leaves Mod+A to a text field on the canvas', async () => {
    const selectAll = vi.fn()
    render(<ShortcutHarness handlers={{ selectAll }} />)
    const field = screen.getByLabelText('name')
    await userEvent.type(field, 'abc')
    await userEvent.keyboard('{Control>}a{/Control}')
    expect(selectAll).not.toHaveBeenCalled()
  })

  it('does not prevent Mod+Z when there is nothing to undo', () => {
    render(<ShortcutHarness handlers={{ undo: () => false }} />)
    const e = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true })
    screen.getByTestId('canvas').dispatchEvent(e)
    expect(e.defaultPrevented).toBe(false)
  })

  it('groups with Mod+G on the canvas', async () => {
    const group = vi.fn()
    render(<ShortcutHarness handlers={{ group }} />)
    screen.getByTestId('canvas').focus()
    await userEvent.keyboard('{Control>}g{/Control}')
    expect(group).toHaveBeenCalled()
  })

  it('ignores V outside the canvas and H when single keys are off', async () => {
    const selectTool = vi.fn()
    const panTool = vi.fn()
    const { unmount } = render(<ShortcutHarness handlers={{ selectTool }} />)
    screen.getByLabelText('outside').focus()
    await userEvent.keyboard('v')
    expect(selectTool).not.toHaveBeenCalled()
    unmount()
    render(<ShortcutHarness handlers={{ panTool }} singleKey={false} />)
    screen.getByTestId('canvas').focus()
    await userEvent.keyboard('h')
    expect(panTool).not.toHaveBeenCalled()
  })

  it('refuses Delete while locked', async () => {
    const del = vi.fn()
    render(<ShortcutHarness handlers={{ delete: del }} locked />)
    screen.getByTestId('canvas').focus()
    await userEvent.keyboard('{Delete}')
    expect(del).not.toHaveBeenCalled()
  })

  it('pastes cascaded copies with Mod+V twice (stand-alone helpers)', () => {
    const { result } = renderHook(() => {
      const [nodes, setNodes] = useState<FlowNode[]>([n('a', 0, { selected: true })])
      const [edges, setEdges] = useState<FlowConnector[]>([])
      const history = useEditorHistory(nodes, edges, setNodes, setEdges)
      const clip = useEditorClipboard(nodes, edges, setNodes, setEdges, history.snapshot)
      return { nodes, history, clip }
    })
    act(() => result.current.clip.copy())
    expect(result.current.clip.hasCopied).toBe(true)
    act(() => result.current.clip.paste())
    act(() => result.current.clip.paste())
    expect(result.current.nodes.map((x) => x.position.x)).toEqual([0, 32, 64])
    expect(result.current.history.canUndo).toBe(true)
  })

  it('moves focus to the toolbar on a second Escape with nothing selected', async () => {
    render(<ShortcutHarness handlers={{ escape: () => false }} />)
    screen.getByTestId('canvas').focus()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'tools' })).toHaveFocus()
  })

  it('exports the key map as data', () => {
    expect(editorKeyMap.find((b) => b.action === 'redo')!.chords).toEqual(['Mod+Shift+Z', 'Mod+Y'])
  })
})

// ---- SelectionArrange --------------------------------------------------------

function useArrangeHarness(initial: FlowNode[]) {
  const [nodes, setNodes] = useState(initial)
  const snapshots = useRef<FlowNode[][]>([])
  const snapshot = () => snapshots.current.push(nodes)
  const arrange = useSelectionArrange({ nodes, setNodes, snapshot })
  return { nodes, setNodes, arrange, snapshots }
}

describe('SelectionArrange', () => {
  it('does nothing and takes no snapshot when grouping one node', () => {
    const { result } = renderHook(() => useArrangeHarness([n('a', 0, { selected: true })]))
    act(() => result.current.arrange.group())
    expect(result.current.nodes).toHaveLength(1)
    expect(result.current.snapshots.current).toHaveLength(0)
  })

  it('aligns left and right', () => {
    const { result } = renderHook(() => useArrangeHarness([n('a', 10, { selected: true }), n('b', 50, { selected: true }), n('c', 90, { selected: true })]))
    act(() => result.current.arrange.align('left'))
    expect(result.current.nodes.map((x) => x.position.x)).toEqual([10, 10, 10])
    const r = renderHook(() => useArrangeHarness([n('a', 0, { selected: true }), n('b', 300, { selected: true })]))
    act(() => r.result.current.arrange.align('right'))
    expect(r.result.current.nodes.map((x) => x.position.x + 100)).toEqual([400, 400])
  })

  it('distributes three nodes keeping the ends', () => {
    const { result } = renderHook(() => useArrangeHarness([n('a', 0, { selected: true }), n('b', 50, { selected: true }), n('c', 400, { selected: true })]))
    act(() => result.current.arrange.distribute('horizontal'))
    expect(result.current.nodes.map((x) => x.position.x)).toEqual([0, 200, 400])
  })

  it('restores absolute positions after group then ungroup, with one snapshot each', () => {
    const { result } = renderHook(() => useArrangeHarness([n('a', 10, { selected: true }), n('b', 200, { selected: true })]))
    act(() => result.current.arrange.group())
    const frame = result.current.nodes.find((x) => x.kind === 'group')!
    expect(result.current.nodes[0]).toBe(frame)
    act(() => result.current.setNodes((ns) => ns.map((x) => (x.id === frame.id ? { ...x, selected: true } : x))))
    act(() => result.current.arrange.ungroup())
    expect(result.current.nodes.map((x) => [x.id, x.position.x, x.parentId])).toEqual([
      ['a', 10, undefined],
      ['b', 200, undefined],
    ])
    expect(result.current.snapshots.current).toHaveLength(2)
  })
})

// ---- CanvasContextMenus ----------------------------------------------------------

describe('CanvasContextMenus', () => {
  it('node menu: Delete sends the node id and closes', async () => {
    const onDelete = vi.fn()
    const onClose = vi.fn()
    render(<NodeContextMenu anchor={{ x: 10, y: 10 }} targetId="n1" onClose={onClose} onEdit={() => {}} onDuplicate={() => {}} onCopy={() => {}} onDelete={onDelete} />)
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('n1')
    expect(onClose).toHaveBeenCalled()
  })

  it('canvas menu: Paste disabled without clipboard, Add note receives the canvas point', async () => {
    const onAddNote = vi.fn()
    render(<CanvasBackgroundMenu anchor={{ x: 0, y: 0 }} onClose={() => {}} canvasPosition={{ x: 100, y: 200 }} hasClipboardContent={false} onPaste={() => {}} onSelectAll={() => {}} onFitView={() => {}} onAddNote={onAddNote} />)
    expect(await screen.findByRole('menuitem', { name: 'Paste' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add note' }))
    expect(onAddNote).toHaveBeenCalledWith({ x: 100, y: 200 })
  })

  it('selection menu: distribute horizontally', async () => {
    const onDistribute = vi.fn()
    render(<SelectionContextMenu anchor={{ x: 0, y: 0 }} onClose={() => {}} count={3} onCopy={() => {}} onDuplicate={() => {}} onDelete={() => {}} onGroup={() => {}} onAlign={() => {}} onDistribute={onDistribute} />)
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Distribute horizontally' }))
    expect(onDistribute).toHaveBeenCalledWith('horizontal')
  })

  it('Escape closes and returns focus to the invoking element', async () => {
    function Host() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onKeyDown={(e) => e.shiftKey && e.key === 'F10' && setOpen(true)}>
            node
          </button>
          {open ? <NodeContextMenu anchor={{ x: 0, y: 0 }} targetId="n" onClose={() => setOpen(false)} onEdit={() => {}} onDuplicate={() => {}} onCopy={() => {}} onDelete={() => {}} /> : null}
        </>
      )
    }
    render(<Host />)
    screen.getByRole('button', { name: 'node' }).focus()
    await userEvent.keyboard('{Shift>}{F10}{/Shift}')
    const menu = await screen.findByRole('menu')
    expect(within(menu).getAllByRole('menuitem')[0]).toHaveTextContent('Edit')
    await userEvent.keyboard('{Escape}')
    await act(async () => new Promise<void>((r) => requestAnimationFrame(() => r())))
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByRole('button', { name: 'node' })).toHaveFocus()
  })

  it('reports declared then default sizes', () => {
    expect(nodeSize({ size: { width: 120, height: 50 } })).toEqual({ width: 120, height: 50 })
    expect(nodeSize({})).toEqual({ width: 256, height: 96 })
  })
})

// ---- CanvasCommandBar ----------------------------------------------------------

function bar(overrides: Partial<CanvasCommandBarProps> = {}) {
  const props: CanvasCommandBarProps = {
    mode: 'pointer',
    onModeChange: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFit: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: false,
    canRedo: true,
    showMap: false,
    showGrid: true,
    compactCards: false,
    onToggleMap: vi.fn(),
    onToggleGrid: vi.fn(),
    onToggleCompact: vi.fn(),
    layoutDirection: 'free',
    onLayoutDirectionChange: vi.fn(),
    shortcutsOpen: false,
    onToggleShortcuts: vi.fn(),
    onCloseShortcuts: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<CanvasCommandBar {...props} />) }
}

describe('CanvasCommandBar', () => {
  it('reports undo as disabled and does not call it', async () => {
    const { props } = bar()
    const undo = screen.getByRole('button', { name: 'Undo' })
    expect(undo).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(undo)
    expect(props.onUndo).not.toHaveBeenCalled()
  })

  it('reveals the name of a disabled tool on focus', async () => {
    const { container } = bar()
    const undo = screen.getByRole('button', { name: 'Undo' })
    act(() => undo.focus())
    expect(undo.querySelector('.ty-canvas-tool__label')).toHaveTextContent('Undo')
    await expectNoAxeViolations(container)
  })

  it('cycles layout free → reading direction and top-down → free', async () => {
    const { props, unmount } = bar()
    await userEvent.click(screen.getByRole('button', { name: /Layout: free/ }))
    expect(props.onLayoutDirectionChange).toHaveBeenCalledWith('left-right')
    unmount()
    const second = bar({ layoutDirection: 'top-down' })
    await userEvent.click(screen.getByRole('button', { name: /Layout: top to bottom/ }))
    expect(second.props.onLayoutDirectionChange).toHaveBeenCalledWith('free')
  })

  it('Escape closes an open shortcut panel', async () => {
    const { props } = bar({ shortcutsOpen: true })
    expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(props.onCloseShortcuts).toHaveBeenCalled()
  })

  it('moves with a grip drag but not when a tool is dragged', () => {
    const { container } = bar()
    const root = container.querySelector('.ty-command-bar') as HTMLElement
    const grip = screen.getByRole('button', { name: 'Move tool bar' })
    const pe = (type: string, x: number, y: number) => {
      const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 })
      Object.defineProperty(e, 'pointerId', { value: 1 })
      return e
    }
    fireEvent(grip, pe('pointerdown', 0, 0))
    fireEvent(grip, pe('pointermove', 30, 12))
    fireEvent(grip, pe('pointerup', 30, 12))
    expect(root.style.translate).toBe('30px 12px')
    const tool = screen.getByRole('button', { name: 'Fit to view' })
    fireEvent(tool, pe('pointerdown', 0, 0))
    fireEvent(tool, pe('pointermove', 100, 100))
    expect(root.style.translate).toBe('30px 12px')
  })
})

// ---- NodePalette --------------------------------------------------------------------

const catalog: NodeKindEntry[] = [
  { kind: 'start', label: 'Start', category: 'Control flow' },
  { kind: 'code', label: 'Compute', category: 'Data processing', defaultConfig: { op: 'sum' } },
  { kind: 'stock', label: 'Stock check', category: 'Data processing' },
  { kind: 'beta', label: 'Beta step', category: 'AI', experimental: true },
  { kind: 'old', label: 'Old step', category: 'AI', deprecated: true },
  { kind: 'agent', label: 'Agent', category: 'AI' },
]

describe('NodePalette', () => {
  it('groups step kinds by category, excluding experimental, deprecated and picker kinds', () => {
    nodeKindCatalog.install(catalog)
    render(<NodePalette />)
    expect(screen.getByText('Compute')).toBeInTheDocument()
    expect(screen.queryByText('Beta step')).toBeNull()
    expect(screen.queryByText('Old step')).toBeNull()
    expect(screen.queryByRole('row', { name: /^Agent$/ })).toBeNull()
  })

  it('filters every section and shows empty messages', async () => {
    nodeKindCatalog.install(catalog)
    render(<NodePalette agents={[{ id: 'a', name: 'Coder' } as never]} />)
    await userEvent.type(screen.getByRole('searchbox'), 'stock')
    expect(screen.getByText('Stock check')).toBeInTheDocument()
    expect(screen.queryByText('Compute')).toBeNull()
  })

  it('reports a collapsed agents section and hides the add rule button without a handler', async () => {
    nodeKindCatalog.install(catalog)
    render(<NodePalette agents={[{ id: 'a', name: 'Coder' } as never]} onCreateAgent={() => {}} />)
    const trigger = screen.getAllByRole('button', { expanded: true }).find((b) => /Agents/.test(b.textContent ?? ''))!
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Add rule' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Add agent' })).toBeInTheDocument()
  })

  it('drags a payload with kind, label and default configuration', () => {
    const [item] = paletteDragItems({ kind: 'code', label: 'Compute', config: { op: 'sum' } })
    expect(JSON.parse(item!['application/x-tympan-node']!)).toEqual({ kind: 'code', label: 'Compute', config: { op: 'sum' } })
  })

  it('places the focused item with Enter', async () => {
    nodeKindCatalog.install(catalog)
    const onPlace = vi.fn()
    render(<NodePalette onPlace={onPlace} />)
    const row = screen.getByRole('row', { name: /Compute/ })
    act(() => row.focus())
    await userEvent.keyboard('{Enter}')
    expect(onPlace).toHaveBeenCalledWith('code', expect.objectContaining({ kind: 'code', label: 'Compute' }))
  })

  it('opens a provider configuration when a provider is activated', async () => {
    nodeKindCatalog.install(catalog)
    const onConfigureProvider = vi.fn()
    render(<NodePalette modelProviders={[{ id: 'p1', name: 'Provider one', configured: true, modelCount: 3 } as never]} onConfigureProvider={onConfigureProvider} />)
    const row = screen.getByRole('row', { name: /Provider one/ })
    act(() => row.focus())
    await userEvent.keyboard('{Enter}')
    expect(onConfigureProvider).toHaveBeenCalledWith('p1')
  })
})

// ---- FlowPreview ------------------------------------------------------------------------

describe('FlowPreview', () => {
  const graph = {
    nodes: [
      { id: 'ds', kind: 'datasource', position: { x: 0, y: 0 }, data: { sourceId: 's', table: 'cases', label: 'Census' } },
      { id: 'ag', kind: 'agent', position: { x: 0, y: 200 }, data: { agentRef: 'a1' } },
      { id: 'g', kind: 'code', position: { x: 0, y: 400 }, data: { label: 'Count' } },
    ],
    connectors: [
      { id: 'c1', source: 'ds', target: 'ag' },
      { id: 'c2', source: 'ag', target: 'g' },
    ],
  }

  it('draws each node with its rich card', () => {
    const { container } = render(<FlowPreview graph={graph} reference={{ agents: [{ id: 'a1', name: 'Coder' }] }} />)
    expect(container.querySelector('.ty-datasource-node')).not.toBeNull()
    expect(screen.getByText('Coder')).toBeInTheDocument()
    expect(screen.getByText('Count')).toBeInTheDocument()
  })

  it('marks nodes without a status as not run', () => {
    const { container } = render(<FlowPreview graph={graph} nodeStatuses={{ ds: 'completed' }} />)
    expect(container.querySelectorAll('.ty-preview-status[data-status="unknown"]').length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('[data-ty-node-id="ds"] .ty-preview-status')).toHaveAttribute('data-status', 'completed')
  })

  it('keeps saved positions with layout preserve', () => {
    const { container } = render(<FlowPreview graph={graph} layout="preserve" />)
    expect((container.querySelector('[data-ty-node-id="ag"]') as HTMLElement).style.transform).toBe('translate(0px, 200px)')
  })

  it('calls onNodeActivate on click and on Enter', async () => {
    const onNodeActivate = vi.fn()
    const { container } = render(<FlowPreview graph={graph} onNodeActivate={onNodeActivate} />)
    const btn = container.querySelector('[data-ty-node-id="g"] .ty-node-card__activator') as HTMLElement
    await userEvent.click(btn)
    act(() => btn.focus())
    await userEvent.keyboard('{Enter}')
    expect(onNodeActivate).toHaveBeenCalledTimes(2)
    expect(onNodeActivate).toHaveBeenCalledWith('g')
  })

  it('keeps positions and zoom when the selection changes', () => {
    const api = { current: null as CanvasApi | null }
    const { rerender, container } = render(<FlowPreview graph={graph} apiRef={api} selectedNodeId={null} />)
    const before = api.current!.getViewport()
    const pos = (container.querySelector('[data-ty-node-id="g"]') as HTMLElement).style.transform
    rerender(<FlowPreview graph={graph} apiRef={api} selectedNodeId="g" />)
    expect(api.current!.getViewport()).toEqual(before)
    expect((container.querySelector('[data-ty-node-id="g"]') as HTMLElement).style.transform).toBe(pos)
  })
})

// ---- FlowSwitcherBar, SaveStatus, RunControls ---------------------------------------------------

describe('FlowSwitcherBar', () => {
  const flows = [
    { id: 'a', name: 'Stage count', version: 2, isDraft: true, updatedAt: new Date('2026-09-26T10:00:00Z') },
    { id: 'b', name: 'Coding check', version: 5, isDraft: false },
    { id: 'c', name: 'Edition diff', version: 1, isDraft: false },
  ]
  it('marks the active flow with aria-current and shows the draft pill with icon and word', () => {
    const { container } = render(<FlowSwitcherBar flows={flows} activeFlowId="b" isLoading={false} onSelect={() => {}} onCreate={() => {}} onDelete={() => {}} />)
    expect(screen.getByRole('button', { name: /^Coding check/ })).toHaveAttribute('aria-current', 'page')
    const draft = screen.getByText('Draft')
    expect(draft.closest('.ty-status-pill')?.querySelector('svg')).not.toBeNull()
    return expectNoAxeViolations(container)
  })

  it('has no delete button for a single flow; delete does not select', async () => {
    const onDelete = vi.fn()
    const onSelect = vi.fn()
    const { unmount } = render(<FlowSwitcherBar flows={flows.slice(0, 1)} activeFlowId="a" isLoading={false} onSelect={() => {}} onCreate={() => {}} onDelete={() => {}} />)
    expect(screen.queryByRole('button', { name: /Delete flow/ })).toBeNull()
    unmount()
    render(<FlowSwitcherBar flows={flows} activeFlowId="a" isLoading={false} onSelect={onSelect} onCreate={() => {}} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete flow Coding check' }))
    expect(onDelete).toHaveBeenCalledWith('b', 'Coding check')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows skeletons and a loading status', () => {
    render(<FlowSwitcherBar flows={[]} activeFlowId={null} isLoading onSelect={() => {}} onCreate={() => {}} onDelete={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading flows')
  })

  it('reads relative time in Portuguese', () => {
    render(
      <TympanProvider locale="pt-BR">
        <FlowSwitcherBar flows={flows} activeFlowId="a" isLoading={false} now={new Date('2026-09-26T10:10:00Z')} onSelect={() => {}} onCreate={() => {}} onDelete={() => {}} />
      </TympanProvider>,
    )
    expect(document.body.textContent).toMatch(/há 10 minutos/)
  })

  it('becomes a select below 640 px', () => {
    setViewportWidth(375)
    render(<FlowSwitcherBar flows={flows} activeFlowId="a" isLoading={false} onSelect={() => {}} onCreate={() => {}} onDelete={() => {}} />)
    expect(document.querySelector('select, [role="button"][aria-haspopup="listbox"], button[aria-haspopup="listbox"]')).not.toBeNull()
  })
})

describe('SaveStatus', () => {
  it('shows saving in a status region, then announces saved; idle renders nothing visible; error word', () => {
    const { rerender } = render(<SaveStatus status="saving" />)
    expect(screen.getByRole('status')).toHaveTextContent('Saving')
    rerender(<SaveStatus status="saved" />)
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
    rerender(<SaveStatus status="idle" />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    rerender(<SaveStatus status="error" />)
    expect(screen.getByRole('status')).toHaveAttribute('data-status', 'error')
    expect(screen.getByRole('status')).toHaveTextContent('Not saved')
  })
})

describe('RunControls', () => {
  it('runs when idle and stops when running, keeping the same button', async () => {
    const onRun = vi.fn()
    const onStop = vi.fn()
    const { rerender } = render(<RunControls isRunning={false} onRun={onRun} onStop={onStop} />)
    const main = screen.getByRole('button', { name: 'Run' })
    await userEvent.click(main)
    expect(onRun).toHaveBeenCalled()
    expect(onStop).not.toHaveBeenCalled()
    rerender(<RunControls isRunning onRun={onRun} onStop={onStop} />)
    expect(screen.getByRole('button', { name: 'Stop' })).toBe(main)
    await userEvent.click(main)
    expect(onStop).toHaveBeenCalled()
  })

  it('omits history without a handler; publishing disables publish; status slot comes first', () => {
    const { container } = render(<RunControls isRunning={false} onRun={() => {}} onStop={() => {}} onPublish={() => {}} isPublishing saveStatus={<span>Saved</span>} />)
    expect(screen.queryByRole('button', { name: 'Run history' })).toBeNull()
    expect(screen.getByRole('button', { name: /Publishing/ })).toBeDisabled()
    expect(container.querySelector('.ty-run-controls')!.firstElementChild).toHaveClass('ty-run-controls__status')
  })

  it('replaces the spinner under reduced motion', () => {
    setMedia({ reducedMotion: true })
    const css = cssOf('editor/editor.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/ty-run-controls__spinner[^}]*\{[^}]*animation:\s*none/)
  })
})
