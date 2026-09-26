import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/design-system'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { setViewportWidth } from '../../test/media'
import { nodeKindCatalog } from '../catalog/kindCatalog'
import type { FlowGraph } from '../model/types'
import { createFlowEditorStore } from '../state/editorState'
import { AutosaveController } from './AutosaveController'
import { FlowEditor, FlowEditorProvider } from './FlowEditor'
import { PALETTE_MEDIA_TYPE } from './NodePalette'

afterEach(() => nodeKindCatalog.reset())

const graph = (): FlowGraph => ({
  nodes: [
    { id: 'start', kind: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
    { id: 'sum', kind: 'code', position: { x: 320, y: 0 }, data: { label: 'Sum' } },
    { id: 'note', kind: 'note', position: { x: 0, y: 200 }, data: { text: 'Remember the edition' }, size: { width: 240, height: 120 } },
  ],
  connectors: [{ id: 'c1', source: 'start', target: 'sum' }],
  viewport: { x: 0, y: 0, zoom: 1 },
})

const pe = (type: string, x: number, y: number) => {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 })
  Object.defineProperty(e, 'pointerId', { value: 1 })
  Object.defineProperty(e, 'pointerType', { value: 'mouse' })
  return e
}

describe('FlowEditor', () => {
  it('shows every node and connector of the initial graph and fits it', async () => {
    const { container } = render(<FlowEditor initialGraph={graph()} palette={false} />)
    expect(container.querySelectorAll('[data-fk-node-id]')).toHaveLength(3)
    expect(container.querySelectorAll('.fk-connector__path')).toHaveLength(1)
    expect(screen.getByRole('group', { name: 'Flow canvas' })).toHaveAttribute('aria-roledescription', 'canvas')
    await expectNoAxeViolations(container, ['nested-interactive'])
  })

  it('reports the serialised graph once after edits settle, and immediately when the page is hidden', () => {
    vi.useFakeTimers()
    const onGraphChange = vi.fn()
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes, connectors: graph().connectors } })
    render(<FlowEditor store={store} onGraphChange={onGraphChange} debounceMs={500} palette={false} />)
    act(() => store.actions.setNodes((ns) => ns.map((n) => (n.id === 'sum' ? { ...n, data: { label: 'Total' } } : n))))
    act(() => store.actions.setNodes((ns) => ns.map((n) => (n.id === 'sum' ? { ...n, data: { label: 'Totals' } } : n))))
    act(() => vi.advanceTimersByTime(600))
    expect(onGraphChange).toHaveBeenCalledTimes(1)
    expect(onGraphChange.mock.calls[0]![0].nodes.find((n: { id: string }) => n.id === 'sum').data.label).toBe('Totals')
    act(() => store.actions.setNodes((ns) => ns.slice(0, 2)))
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(onGraphChange).toHaveBeenCalledTimes(2)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    vi.useRealTimers()
  })

  it('refuses a connection dragged onto a note', () => {
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes, connectors: [] } })
    render(<FlowEditor store={store} palette={false} />)
    const out = document.querySelector('[data-fk-port-node="start"][data-fk-port-role="source"]')!
    fireEvent(out, pe('pointerdown', 1, 1))
    const note = document.querySelector('[data-fk-node-id="note"] .fk-note-node')!
    fireEvent(note, pe('pointermove', 2, 2))
    fireEvent(note, pe('pointerup', 2, 2))
    expect(store.getState().connectors).toHaveLength(0)
  })

  it('types V into a text field inside a node without changing the mode', async () => {
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes, connectors: [] } })
    render(<FlowEditor store={store} palette={false} />)
    await userEvent.dblClick(screen.getByText('Remember the edition'))
    await userEvent.keyboard('v')
    expect(store.getState().controlMode).toBe('select')
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toMatch(/v/)
  })

  it('shows no edit, duplicate or delete tools while locked', () => {
    render(<FlowEditor initialGraph={graph()} palette={false} locked />)
    fireEvent.pointerOver(document.querySelector('[data-fk-node-id="sum"]')!)
    expect(screen.queryByRole('button', { name: /Duplicate Sum|Remove Sum|Delete Sum/i })).toBeNull()
    expect(document.querySelector('.fk-editor')).toHaveAttribute('data-locked', 'true')
  })

  it('adds a node where a palette item is dropped, and one undo removes it', () => {
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes.slice(0, 2), connectors: [] } })
    render(<FlowEditor store={store} palette={false} />)
    const canvas = document.querySelector('.fk-editor__canvas')!
    const data = new Map<string, string>([[PALETTE_MEDIA_TYPE, JSON.stringify({ kind: 'code', label: 'Count' })]])
    const dataTransfer = { types: [...data.keys()], getData: (t: string) => data.get(t) ?? '', dropEffect: 'none' }
    fireEvent.dragOver(canvas, { dataTransfer })
    fireEvent.drop(canvas, { dataTransfer, clientX: 300, clientY: 200 })
    expect(store.getState().nodes).toHaveLength(3)
    expect(store.getState().nodes[2]!.data.label).toBe('Count')
    act(() => store.actions.undo())
    expect(store.getState().nodes).toHaveLength(2)
  })

  it('moves focus out of the canvas on Escape with nothing selected', async () => {
    render(<FlowEditor initialGraph={graph()} palette={false} />)
    screen.getByRole('group', { name: 'Flow canvas' }).focus()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('toolbar', { name: 'Canvas tools' })).toContainElement(document.activeElement as HTMLElement)
  })

  it('offers the list view from the dock: configure and delete from it', async () => {
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes.slice(0, 2), connectors: [] } })
    render(<FlowEditor store={store} palette={false} defaultListView />)
    const list = screen.getByRole('region', { name: 'Flow steps' })
    expect(list).toHaveTextContent('Sum')
    await userEvent.click(within(list).getByRole('button', { name: 'More for “Sum”' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }))
    expect(store.getState().nodes.map((n) => n.id)).toEqual(['start'])
    expect(screen.getByRole('button', { name: 'Show as list' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('loads through the provider when the flow id is given', async () => {
    const load = vi.fn(async () => ({ graph: graph() }))
    render(
      <FlowEditorProvider flowId="f1" load={load}>
        <FlowEditor flowId="f1" palette={false} />
      </FlowEditorProvider>,
    )
    expect(await screen.findByText('Sum')).toBeInTheDocument()
    expect(load).toHaveBeenCalledWith('f1')
  })

  it('lays a horizontal flow out right to left in Arabic unless asked to keep LTR', async () => {
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes.slice(0, 2), connectors: graph().connectors, layoutDirection: 'right' } })
    render(
      <FakhirProvider locale="ar">
        <FlowEditor store={store} palette={false} />
      </FakhirProvider>,
    )
    const layoutTool = document.querySelector('[data-tool="auto-layout"]') as HTMLElement
    await userEvent.click(layoutTool)
    const pos = Object.fromEntries(store.getState().nodes.map((n) => [n.id, n.position.x]))
    expect(pos.start!).toBeGreaterThan(pos.sum!)
  })

  it('names the canvas in Portuguese', () => {
    render(
      <FakhirProvider locale="pt-BR">
        <FlowEditor initialGraph={graph()} palette={false} />
      </FakhirProvider>,
    )
    expect(screen.getByRole('group', { name: 'Canvas do fluxo' })).toBeInTheDocument()
  })

  it('keeps side panels on logical sides', () => {
    const css = cssOf('editor/editor.css')
    expect(css).not.toMatch(/(^|[^-])(left|right)\s*:/m)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
  })
})

describe('FlowEditor on narrow screens', () => {
  it('opens the palette as a bottom drawer and places a step by tap', async () => {
    setViewportWidth(375)
    const { container } = render(<FlowEditor initialGraph={graph()} />)
    expect(container.querySelector('.fk-editor__palette')).toBeNull()
    await userEvent.click(container.querySelector('.fk-editor__palette-open') as HTMLElement)
    const drawer = await screen.findByRole('dialog', { name: 'Steps to add' })
    const before = container.querySelectorAll('[data-fk-node-id]').length
    const item = within(drawer).getByRole('row', { name: 'Frozen edition' })
    item.focus()
    await userEvent.keyboard('{Enter}')
    expect(container.querySelectorAll('[data-fk-node-id]').length).toBe(before + 1)
  })
})

describe('FlowEditor keyboard', () => {
  it('moves a focused node with arrow keys (one undo step each) and announces alignment', async () => {
    const store = createFlowEditorStore({
      initial: {
        nodes: [
          { id: 'a', kind: 'code', position: { x: 0, y: 0 }, data: { label: 'A' } },
          { id: 'b', kind: 'code', position: { x: 8, y: 300 }, data: { label: 'B' } },
        ],
        connectors: [],
      },
    })
    render(<FlowEditor store={store} palette={false} />)
    act(() => (document.querySelector('[data-fk-node-id="b"] [data-fk-node-focus]') as HTMLElement).focus())
    await userEvent.keyboard('{ArrowLeft}')
    expect(store.getState().nodes.find((n) => n.id === 'b')!.position.x).toBe(0)
    expect(document.querySelector('[data-fk-announcer="polite"]')).toHaveTextContent(/aligned with A/i)
    act(() => store.actions.undo())
    expect(store.getState().nodes.find((n) => n.id === 'b')!.position.x).toBe(8)
  })

  it('clears the selection on Escape from a focused node, then leaves to the tool bar', async () => {
    render(<FlowEditor initialGraph={graph()} palette={false} />)
    act(() => (document.querySelector('[data-fk-node-id="sum"] [data-fk-node-focus]') as HTMLElement).focus())
    await userEvent.keyboard('{Escape}')
    expect(document.querySelector('[data-fk-node-id="sum"] .fk-node-card')).toHaveAttribute('data-selected', 'false')
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('toolbar', { name: 'Canvas tools' })).toContainElement(document.activeElement as HTMLElement)
  })

  it('deletes a focused connector with Delete, not the selected nodes', async () => {
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes.slice(0, 2).map((n) => ({ ...n, selected: true })), connectors: graph().connectors } })
    render(<FlowEditor store={store} palette={false} />)
    act(() => screen.getByRole('button', { name: /^from Start to Sum/ }).focus())
    await userEvent.keyboard('{Delete}')
    expect(store.getState().connectors).toHaveLength(0)
    expect(store.getState().nodes).toHaveLength(2)
  })

  it('keeps the selection when Delete is pressed on a locked canvas', async () => {
    const store = createFlowEditorStore({ initial: { nodes: [{ id: 'a', kind: 'code', position: { x: 0, y: 0 }, data: { label: 'A' }, selected: true }], connectors: [], locked: true } })
    render(<FlowEditor store={store} palette={false} locked />)
    screen.getByRole('group', { name: 'Flow canvas' }).focus()
    await userEvent.keyboard('{Delete}')
    expect(store.getState().nodes).toHaveLength(1)
  })
})

describe('AutosaveController', () => {
  it('calls onSnapshot then onAutosave with equal graphs when a node moves', () => {
    const calls: string[] = []
    const graphs: FlowGraph[] = []
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes, connectors: graph().connectors } })
    render(
      <AutosaveController
        store={store}
        palette={false}
        onSnapshot={(g) => {
          calls.push('snapshot')
          graphs.push(g)
        }}
        onAutosave={(g) => {
          calls.push('autosave')
          graphs.push(g)
        }}
      />,
    )
    act(() => store.actions.setNodes((ns) => ns.map((n) => (n.id === 'sum' ? { ...n, position: { x: 400, y: 10 } } : n))))
    expect(calls).toEqual(['snapshot', 'autosave'])
    expect(graphs[0]).toEqual(graphs[1])
  })

  it('calls onAutosave once when a connector is added', () => {
    const onAutosave = vi.fn()
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes, connectors: [] } })
    render(<AutosaveController store={store} palette={false} onAutosave={onAutosave} />)
    act(() => store.actions.setConnectors([{ id: 'x', source: 'start', target: 'sum' }]))
    expect(onAutosave).toHaveBeenCalledTimes(1)
  })

  it('uses new callbacks after a re-render without re-mounting the canvas', () => {
    const first = vi.fn()
    const second = vi.fn()
    const store = createFlowEditorStore({ initial: { nodes: graph().nodes, connectors: [] } })
    function Host() {
      const [late, setLate] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setLate(true)}>
            swap
          </button>
          <AutosaveController store={store} palette={false} onAutosave={late ? second : first} />
        </>
      )
    }
    render(<Host />)
    const canvasBefore = document.querySelector('.fk-surface')
    act(() => store.actions.select(['sum']))
    act(() => screen.getByText('swap').click())
    expect(document.querySelector('.fk-surface')).toBe(canvasBefore)
    act(() => store.actions.setNodes((ns) => ns.slice(0, 2)))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
