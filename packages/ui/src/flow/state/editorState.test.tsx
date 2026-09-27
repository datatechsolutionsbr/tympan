import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FlowConnector, FlowNode } from '../model/types'
import { createDialogStack } from './dialogStack'
import { createFlowEditorStore, FlowEditorStateProvider, useFlowEditorActions, useFlowEditorState } from './editorState'

const n = (id: string, x = 0, selected = false): FlowNode => ({ id, kind: 'code', position: { x, y: 0 }, data: { label: id }, selected })
const c = (source: string, target: string): FlowConnector => ({ id: `${source}-${target}`, source, target })

describe('FlowEditorState', () => {
  it('undoes and redoes graph edits', () => {
    const s = createFlowEditorStore()
    expect(s.getState().past.length > 0).toBe(false)
    s.actions.setNodes([n('A')])
    s.actions.snapshot()
    s.actions.setNodes((prev) => [...prev, n('B')])
    s.actions.undo()
    expect(s.getState().nodes.map((x) => x.id)).toEqual(['A'])
    expect(s.getState().future.length).toBe(1)
    s.actions.redo()
    expect(s.getState().nodes.map((x) => x.id)).toEqual(['A', 'B'])
  })

  it('bounds history depth', () => {
    const s = createFlowEditorStore({ historyLimit: 4 })
    for (let i = 0; i < 9; i++) s.actions.snapshot()
    expect(s.getState().past.length).toBe(4)
  })

  it('clears the future on a new snapshot after undo', () => {
    const s = createFlowEditorStore()
    s.actions.snapshot()
    s.actions.setNodes([n('A')])
    s.actions.undo()
    s.actions.snapshot()
    expect(s.getState().future).toEqual([])
  })

  it('copies selected nodes with inner connectors and pastes fresh, offset, selected copies', () => {
    const s = createFlowEditorStore()
    s.actions.setNodes([n('A', 0, true), n('B', 100, true), n('C', 200)])
    s.actions.setConnectors([c('A', 'B'), c('B', 'C')])
    s.actions.copy()
    s.actions.paste()
    const { nodes, connectors } = s.getState()
    const pasted = nodes.slice(3)
    expect(pasted).toHaveLength(2)
    expect(pasted.every((p) => !['A', 'B'].includes(p.id))).toBe(true)
    expect(pasted.map((p) => p.position.x)).toEqual([32, 132])
    expect(nodes.filter((x) => x.selected).map((x) => x.id)).toEqual(pasted.map((p) => p.id))
    const added = connectors.slice(2)
    expect(added).toHaveLength(1)
    expect(added[0]!.source).toBe(pasted[0]!.id)
    expect(added[0]!.target).toBe(pasted[1]!.id)
  })

  it('cascades a second paste from the first', () => {
    const s = createFlowEditorStore()
    s.actions.setNodes([n('A', 0, true)])
    s.actions.copy()
    s.actions.paste()
    s.actions.paste()
    expect(s.getState().nodes.map((x) => x.position.x)).toEqual([0, 32, 64])
  })

  it('refuses delete and duplicate while locked', () => {
    const s = createFlowEditorStore()
    s.actions.setNodes([n('A', 0, true)])
    s.actions.setLocked(true)
    s.actions.removeSelection()
    s.actions.duplicate()
    expect(s.getState().nodes.map((x) => x.id)).toEqual(['A'])
  })

  it('restores the previous dialog with its payload when a stacked dialog closes', () => {
    const d = createDialogStack()
    d.open('agent-editor', { agentId: 'a1' })
    d.open('node-config', { nodeId: 'n1' })
    expect(d.getState().active?.kind).toBe('node-config')
    d.close()
    expect(d.getState().active).toEqual({ kind: 'agent-editor', payload: { agentId: 'a1' } })
    d.closeAll()
    expect(d.getState().active).toBeNull()
  })

  it('keeps two editor instances independent', () => {
    function Adder({ label }: { label: string }) {
      const actions = useFlowEditorActions()
      const count = useFlowEditorState((s) => s.nodes.length)
      return (
        <button type="button" onClick={() => actions.setNodes((p) => [...p, n(`${label}${p.length}`)])}>
          {label} {count}
        </button>
      )
    }
    render(
      <>
        <FlowEditorStateProvider>
          <Adder label="left" />
        </FlowEditorStateProvider>
        <FlowEditorStateProvider>
          <Adder label="right" />
        </FlowEditorStateProvider>
      </>,
    )
    act(() => screen.getByText('left 0').click())
    expect(screen.getByRole('button', { name: 'left 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'right 0' })).toBeInTheDocument()
  })
})
