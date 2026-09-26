// Canvas tools as items of the design system's research dock
// (FloatingActionBar `contextual`): modes and toggles keep their pressed state
// (aria-pressed), tool groups become separators and the zoom level shows its
// percentage in place of an icon.

import type { ActionBarItem } from '@fakhir/design-system'
import type { CanvasToolItem } from './canvasTools'

export function dockItemsFromCanvasTools(items: readonly CanvasToolItem[]): ActionBarItem[] {
  return items
    .filter((item) => !item.disabled)
    .map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.text ? <span className="fk-canvas-tool__text">{item.text}</span> : item.icon ?? null,
      ...(item.onPress ? { onPress: item.onPress } : {}),
      ...(item.kind === 'action' ? {} : { pressed: !!item.pressed }),
      ...(item.shortcut ? { shortcut: item.shortcut } : {}),
      group: item.group,
    }))
}
