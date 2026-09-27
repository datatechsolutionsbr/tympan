import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FloatingActionBar } from '../../index'
import { canvasToolItems } from './canvasTools'
import { dockItemsFromCanvasTools } from './dockItems'

const base = {
  zoom: 1,
  mode: 'select' as const,
  onModeChange: vi.fn(),
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  onZoomReset: vi.fn(),
  onFit: vi.fn(),
  onToggleListView: vi.fn(),
  onSearch: vi.fn(),
}

describe('dockItemsFromCanvasTools', () => {
  it('maps modes and toggles to pressed items, keeps groups, shortcuts and handlers', () => {
    const items = dockItemsFromCanvasTools(canvasToolItems(base))
    const byId = Object.fromEntries(items.map((i) => [i.id, i]))
    expect(byId.select).toMatchObject({ pressed: true, group: 'mode', shortcut: 'V' })
    expect(byId.pan).toMatchObject({ pressed: false, group: 'mode' })
    expect(byId['list-view']).toMatchObject({ pressed: false, group: 'layout' })
    expect(byId.fit!.pressed).toBeUndefined()
    byId.fit!.onPress!()
    expect(base.onFit).toHaveBeenCalled()
  })

  it('drops disabled tools and leaves unset optional fields out of the entry', () => {
    const items = dockItemsFromCanvasTools([
      { id: 'a', label: 'A', kind: 'action', group: 'view', text: 'x' },
      { id: 'b', label: 'B', kind: 'toggle', group: 'view', text: 'y', disabled: true },
    ])
    expect(items.map((i) => i.id)).toEqual(['a'])
    expect(Object.keys(items[0]!).sort()).toEqual(['group', 'icon', 'id', 'label'])
  })

  it('renders in the research dock with aria-pressed, the zoom percentage and group separators', () => {
    const { container } = render(<FloatingActionBar destinations={[]} contextual={dockItemsFromCanvasTools(canvasToolItems(base))} anchor="container" />)
    expect(screen.getByRole('button', { name: 'Select' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /100%/ })).toHaveTextContent('100%')
    // mode | view | layout | find
    expect(container.querySelectorAll('.ty-action-bar__separator')).toHaveLength(3)
  })
})
