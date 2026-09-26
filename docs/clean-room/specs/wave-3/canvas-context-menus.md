# CanvasContextMenus

Wave 3 · overlay · Status: specified

## Purpose
Three context menus for the flow canvas (one for a node, one for a multi-node selection, one for empty canvas), built on ActionMenu (wave 1), plus a helper that reports a node's rendered size.

## Anatomy
- Node menu: Edit, Duplicate, Copy, Delete (danger emphasis, last).
- Selection menu: Copy, Duplicate, Group selection, Delete (danger); separator; Align left, Align right, Align top, Align bottom, Centre horizontally, Centre vertically; separator; Distribute horizontally, Distribute vertically. Each item has a lucide icon (§4.4) and a text label.
- Canvas menu: Paste (disabled when the clipboard is empty), Select all, Fit view; separator; Add note (at the pointer's canvas position).
- Size helper: returns the node's measured width and height, falling back to its declared size and then to a documented default.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| anchor | { x: number; y: number } | required | Screen position to open at (pointer or focused element). |
| onClose | () => void | required | Close request; every item closes the menu after its action. |
| targetId (node menu) | string | required | Node acted on. |
| onEdit, onDuplicate, onCopy, onDelete (node menu) | (nodeId: string) => void | required | Item actions. |
| onCopy, onDuplicate, onDelete, onGroup (selection menu) | () => void | required | Act on the whole selection. |
| onAlign (selection menu) | (direction: 'left' or 'right' or 'top' or 'bottom' or 'centreHorizontal' or 'centreVertical') => void | required | See SelectionArrange. |
| onDistribute (selection menu) | (axis: 'horizontal' or 'vertical') => void | required | Even spacing. |
| onPaste, onSelectAll, onFitView (canvas menu) | () => void | required | Canvas actions. |
| onAddNote (canvas menu) | (canvasPosition: { x: number; y: number }) => void | required | Create a note where the menu was opened. |
| canvasPosition (canvas menu) | { x: number; y: number } | required | Canvas coordinates of the anchor. |
| hasClipboardContent (canvas menu) | boolean | required | Enables Paste. |
| labels | object of strings | required | Every item label. |

## States
- item hover and keyboard focus (same visual), disabled (Paste), danger items.
- A menu that just closed must not reopen from the same pointer gesture.

## Keyboard and ARIA
- APG pattern: Menu (role `menu`, `menuitem`, `separator`). RAC primitive: Menu inside Popover, triggered programmatically.
- Opening: secondary click on the target, long press on touch, and from the keyboard with Shift+F10 or the Context Menu key on the focused node, selection or canvas (the fork had pointer-only opening; keyboard opening is required).
- Up and Down move, Home and End jump, typing a letter jumps to the matching item, Enter or Space activates, Escape closes and returns focus to the node or canvas.
- Disabled items stay focusable with `aria-disabled` so their presence is discoverable.

## Responsive, touch, motion, forced colours
- Menu stays within the viewport (flips at edges).
- Items at least 44 px tall on touch.
- Opening uses the quick duration; instant under reduced motion.
- Forced colours: focus indicated with system Highlight; separators visible.

## Acceptance tests
- Given a node is focused, when Shift+F10 is pressed, then the node menu opens with Edit focused.
- Given the node menu is open, when Delete is activated, then onDelete receives the node id and the menu closes.
- Given the clipboard is empty, when the canvas menu opens, then Paste is disabled.
- Given the canvas menu opened at canvas point (100, 200), when Add note is activated, then onAddNote receives that point.
- Given three nodes selected, when Distribute horizontally is activated, then onDistribute receives 'horizontal'.
- Given an open menu, when Escape is pressed, then it closes and focus returns to the invoking element.
- Given a node has no measured size, when the size helper is called, then it returns the declared size or the default.
