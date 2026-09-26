import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { ConnectionPreviewLine } from '../connectors/ConnectionPreviewLine'
import { CanvasSurface } from './CanvasSurface'
import type { CanvasApi, SurfaceNode } from './types'

const nodes: SurfaceNode[] = [
  { id: 'a', rect: { x: 0, y: 0, width: 200, height: 80 } },
  { id: 'b', rect: { x: 400, y: 0, width: 200, height: 80 } },
]

function Node({ id }: { id: string }) {
  return (
    <div>
      <button type="button">node {id}</button>
      <span data-fk-port="" data-fk-port-node={id} data-fk-port-role="source" data-fk-port-id="out" data-testid={`out-${id}`} />
      <span data-fk-port="" data-fk-port-node={id} data-fk-port-role="target" data-fk-port-id="in" data-testid={`in-${id}`} />
    </div>
  )
}

const pointer = (el: Element | Window, type: string, x: number, y: number, extra: Record<string, unknown> = {}) =>
  fireEvent(el, new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, ...extra }) as unknown as Event)

function pe(type: string, x: number, y: number, init: Partial<PointerEventInit> = {}) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 })
  Object.defineProperty(e, 'pointerId', { value: init.pointerId ?? 1 })
  Object.defineProperty(e, 'pointerType', { value: init.pointerType ?? 'mouse' })
  return e
}

describe('CanvasSurface', () => {
  it('renders nodes in the given reading order inside a named canvas group', async () => {
    const { container } = render(<CanvasSurface label="Flow" roleDescription="canvas" nodes={nodes} renderNode={(n) => <Node id={n.id} />} />)
    const group = screen.getByRole('group', { name: 'Flow' })
    expect(group).toHaveAttribute('aria-roledescription', 'canvas')
    expect([...container.querySelectorAll('[data-fk-node-id]')].map((e) => e.getAttribute('data-fk-node-id'))).toEqual(['a', 'b'])
    await expectNoAxeViolations(container)
  })

  it('draws a connector path for each visible connector', () => {
    const { container } = render(<CanvasSurface label="Flow" nodes={nodes} connectors={[{ id: 'c', source: 'a', target: 'b' }]} renderNode={(n) => <Node id={n.id} />} />)
    expect(container.querySelectorAll('.fk-flow-surface__connector')).toHaveLength(1)
  })

  it('fits on mount and zooms with the ladder through its handle', () => {
    const api = createRef<CanvasApi>()
    render(<CanvasSurface label="Flow" nodes={nodes} renderNode={(n) => <Node id={n.id} />} apiRef={api} />)
    expect(api.current!.getViewport().zoom).toBeLessThanOrEqual(1)
    act(() => api.current!.zoomTo(1))
    act(() => api.current!.zoomIn())
    expect(api.current!.getViewport().zoom).toBe(1.1)
    act(() => api.current!.zoomOut())
    expect(api.current!.getViewport().zoom).toBe(1)
  })

  it('pans with arrow keys and zooms with + and - when the canvas itself has focus', async () => {
    const api = createRef<CanvasApi>()
    render(<CanvasSurface label="Flow" nodes={nodes} fit="none" renderNode={(n) => <Node id={n.id} />} apiRef={api} />)
    screen.getByRole('group', { name: 'Flow' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(api.current!.getViewport().x).toBe(-40)
    await userEvent.keyboard('+')
    expect(api.current!.getViewport().zoom).toBe(1.1)
  })

  it('moves focus out on Escape when nothing is left to clear', async () => {
    const onLeave = vi.fn()
    const onEscape = vi.fn(() => false)
    render(<CanvasSurface label="Flow" nodes={nodes} renderNode={(n) => <Node id={n.id} />} onEscape={onEscape} onLeave={onLeave} />)
    screen.getByRole('button', { name: 'node a' }).focus()
    await userEvent.keyboard('{Escape}')
    expect(onEscape).toHaveBeenCalled()
    expect(onLeave).toHaveBeenCalled()
  })

  it('connects by dragging from an output port onto another node', () => {
    const onConnect = vi.fn()
    render(<CanvasSurface label="Flow" nodes={nodes} renderNode={(n) => <Node id={n.id} />} connect={{ canConnect: () => true, onConnect }} />)
    fireEvent(screen.getByTestId('out-a'), pe('pointerdown', 10, 10))
    fireEvent(screen.getByTestId('in-b'), pe('pointermove', 400, 20))
    fireEvent(screen.getByTestId('in-b'), pe('pointerup', 400, 20))
    expect(onConnect).toHaveBeenCalledWith({ nodeId: 'a', role: 'source', portId: 'out' }, { nodeId: 'b', role: 'target', portId: 'in' })
  })

  it('refuses a drop on a node that cannot be connected and shows the invalid preview', () => {
    const onConnect = vi.fn()
    const { container } = render(<CanvasSurface label="Flow" nodes={nodes} renderNode={(n) => <Node id={n.id} />} connect={{ canConnect: () => false, onConnect, nameOf: (id) => `Node ${id}` }} />)
    fireEvent(screen.getByTestId('out-a'), pe('pointerdown', 10, 10))
    fireEvent(screen.getByTestId('in-b'), pe('pointermove', 400, 20))
    expect(container.querySelector('.fk-connection-preview')).toHaveAttribute('data-validity', 'invalid')
    expect(screen.getByRole('status')).toHaveTextContent('Node b: cannot connect')
    fireEvent(screen.getByTestId('in-b'), pe('pointerup', 400, 20))
    expect(onConnect).not.toHaveBeenCalled()
    expect(container.querySelector('.fk-connection-preview')).toBeNull()
  })

  it('drags nodes after a small threshold and reports the delta in canvas units', () => {
    const onNodeDrag = vi.fn()
    render(<CanvasSurface label="Flow" fit="none" nodes={nodes} dragNodes renderNode={(n) => <div>card {n.id}</div>} onNodeDrag={onNodeDrag} />)
    const card = screen.getByText('card a')
    fireEvent(card, pe('pointerdown', 10, 10))
    fireEvent(window, pe('pointermove', 12, 11))
    expect(onNodeDrag).not.toHaveBeenCalled()
    fireEvent(window, pe('pointermove', 60, 40))
    fireEvent(window, pe('pointerup', 60, 40))
    expect(onNodeDrag).toHaveBeenCalledWith({ ids: ['a'], delta: { x: 0, y: 0 }, phase: 'start' })
    expect(onNodeDrag).toHaveBeenLastCalledWith({ ids: ['a'], delta: { x: 50, y: 30 }, phase: 'end' })
  })

  it('reports a background press and marquee selection', () => {
    const onBackgroundPress = vi.fn()
    const onMarquee = vi.fn()
    render(<CanvasSurface label="Flow" fit="none" nodes={nodes} marquee renderNode={(n) => <Node id={n.id} />} onBackgroundPress={onBackgroundPress} onMarquee={onMarquee} />)
    const pane = screen.getByRole('group', { name: 'Flow' })
    fireEvent(pane, pe('pointerdown', 900, 500))
    fireEvent(window, pe('pointerup', 900, 500))
    expect(onBackgroundPress).toHaveBeenCalled()
    fireEvent(pane, pe('pointerdown', -10, -10))
    fireEvent(window, pe('pointermove', 250, 100))
    fireEvent(window, pe('pointerup', 250, 100))
    expect(onMarquee).toHaveBeenCalledWith(['a'], false)
  })

  it('does not animate the preview under reduced motion and marks refusal with a glyph in forced colours', () => {
    const css = cssOf('surface/surface.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/Highlight/)
    const { container } = render(
      <svg>
        <ConnectionPreviewLine from={{ x: 0, y: 0, side: 'end' }} to={{ x: 100, y: 50 }} validity="invalid" />
      </svg>,
    )
    expect(container.querySelector('.fk-connection-preview__refusal')).not.toBeNull()
    expect(container.querySelector('.fk-connection-preview')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws the preview from an input port the same way', () => {
    const { container } = render(<CanvasSurface label="Flow" nodes={nodes} renderNode={(n) => <Node id={n.id} />} connect={{ canConnect: () => true, onConnect: () => {} }} />)
    fireEvent(screen.getByTestId('in-b'), pe('pointerdown', 400, 20))
    pointer(window, 'pointermove', 100, 100)
    expect(container.querySelector('.fk-connection-preview__path')).not.toBeNull()
  })
})
