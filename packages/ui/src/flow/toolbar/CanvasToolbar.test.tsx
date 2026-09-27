import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { CanvasNodeSearch } from './CanvasNodeSearch'
import { CanvasToolbar } from './CanvasToolbar'
import { canvasToolItems, type CanvasToolOptions } from './canvasTools'

function setup(extra: Partial<CanvasToolOptions> = {}) {
  const o: CanvasToolOptions = {
    zoom: 1,
    mode: 'select',
    onModeChange: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onZoomReset: vi.fn(),
    onFit: vi.fn(),
    onAutoLayout: vi.fn(),
    listView: false,
    onToggleListView: vi.fn(),
    onSearch: vi.fn(),
    locale: 'en',
    ...extra,
  }
  const view = render(<CanvasToolbar items={canvasToolItems(o)} label="Canvas tools" />)
  return { o, ...view }
}

describe('CanvasToolbar and canvas tool items', () => {
  it('produces dock items in order with names, shortcuts and the zoom percentage', () => {
    const items = canvasToolItems({ zoom: 0.75, mode: 'pan', onModeChange() {}, onZoomIn() {}, onZoomOut() {}, onZoomReset() {}, onFit() {}, onAutoLayout() {}, onToggleListView() {}, onSearch() {}, locale: 'en' })
    expect(items.map((i) => i.id)).toEqual(['select', 'pan', 'zoom-out', 'zoom-level', 'zoom-in', 'fit', 'auto-layout', 'list-view', 'search'])
    expect(items.find((i) => i.id === 'zoom-level')!.text).toBe('75%')
    expect(items.find((i) => i.id === 'pan')!.pressed).toBe(true)
  })

  it('is one tab stop and arrow keys move between tools', async () => {
    const { container } = setup()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Select' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'Pan' })).toHaveFocus()
    await userEvent.tab()
    expect(container.contains(document.activeElement)).toBe(false)
    await expectNoAxeViolations(container)
  })

  it('exposes mode and list view as pressed toggles and calls the tool actions', async () => {
    const { o } = setup()
    expect(screen.getByRole('button', { name: 'Select' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Pan' }))
    expect(o.onModeChange).toHaveBeenCalledWith('pan')
    await userEvent.click(screen.getByRole('button', { name: 'Select' }))
    expect(o.onModeChange).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Zoom 100%, reset to 100%' }))
    expect(o.onZoomReset).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'List view' }))
    expect(o.onToggleListView).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Find a node' })).toHaveAttribute('aria-keyshortcuts', 'Control+F')
  })

  it('keeps 44 px hit areas and has reduced-motion and forced-colour rules', () => {
    const css = cssOf('flow/toolbar/toolbar.css')
    expect(css).toMatch(/\.ty-canvas-tool::before\s*\{[^}]*max\(100%, var\(--ty-control-target, 44px\)\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/Highlight/)
  })

  it('finds a node by name and reports the pick', async () => {
    const onPick = vi.fn()
    function Harness() {
      const ref = useRef<HTMLButtonElement>(null)
      const [open, setOpen] = useState(false)
      return (
        <>
          <button ref={ref} type="button" onClick={() => setOpen(true)}>
            find
          </button>
          <CanvasNodeSearch
            isOpen={open}
            onOpenChange={setOpen}
            triggerRef={ref}
            onPick={onPick}
            nodes={[
              { id: 'rd-0714', label: 'Retrieval rd-0714', kindLabel: 'retrieval' },
              { id: 'station-centro-2026', label: 'Record station-centro-2026', kindLabel: 'record' },
            ]}
          />
        </>
      )
    }
    render(<Harness />)
    await userEvent.click(screen.getByText('find'))
    await userEvent.keyboard('centro')
    expect(screen.queryByText('Retrieval rd-0714')).toBeNull()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onPick).toHaveBeenCalledWith('station-centro-2026')
  })
})
