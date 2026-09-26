# CanvasCommandBar

Wave 3 · canvas · Status: specified

## Purpose
A floating, movable toolbar with the canvas tools: interaction mode, zoom, fit, undo, redo, view toggles, layout direction and the shortcut reference.

## Anatomy
- **Grip**: the drag area used to move the bar.
- **Mode pair**: pointer mode and hand (pan) mode.
- **View tools**: zoom in, zoom out, fit.
- **History tools**: undo, redo.
- **Toggles**: overview map, dot grid, compact cards.
- **Layout tool**: cycles free, left-right, top-down; shows a small badge with the current direction when not free.
- **Shortcut tool**: opens a panel listing every shortcut with its keys.
Each tool is an icon button whose name is revealed inline beside the icon on hover and on keyboard focus (not a detached tooltip).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| mode | 'pointer' or 'pan' | required | current interaction mode |
| onModeChange | (mode) => void | required | mode tools |
| onZoomIn, onZoomOut, onFit | () => void | required | view tools |
| onUndo, onRedo | () => void | required | history tools |
| canUndo, canRedo | boolean | required | when false the tool is disabled |
| showMap, showGrid, compactCards | boolean | required | toggle states |
| onToggleMap, onToggleGrid, onToggleCompact | () => void | required | toggle events |
| layoutDirection | 'free', 'left-right', 'top-down' | required | current direction |
| onLayoutDirectionChange | (direction) => void | required | next value in the cycle |
| shortcutsOpen | boolean | required | shortcut panel state |
| onToggleShortcuts, onCloseShortcuts | () => void | required | panel events |
| labels | string map | i18n | every tool name and shortcut description |

## States
Tool: default, hover, focus-visible (name revealed), active (toggle on, pressed), inactive (toggle off), disabled (dimmed, still focusable, activation is a no-op). Bar: resting, being dragged. Shortcut panel: open, closed.

## Keyboard and ARIA
APG Toolbar pattern; RAC Toolbar with ToggleButton for toggles and Button for actions. Arrow keys move between tools, Tab leaves the bar. Toggles expose pressed state; the mode pair behaves as a single-select group. Disabled tools use aria-disabled so they stay discoverable. The shortcut panel is a non-modal dialog (RAC Popover with Dialog): Esc or an outside click closes it and returns focus to its tool. The bar can be moved by keyboard: the grip is focusable and arrow keys nudge it.

## Responsive, touch, motion, forced colours
- 44 px hit area per tool; on narrow screens the bar docks to the bottom edge and wraps into an overflow menu.
- Pressing a tool never starts a bar drag.
- Optional magnification of icons near the pointer is decorative and fully disabled under reduced motion; name reveal becomes instant.
- Forced colours: pressed toggles shown with a border or system highlight, not tint alone.

## Acceptance tests
- Given canUndo is false, when undo is activated, then onUndo is not called and the tool reports disabled.
- Given a disabled tool, when it is hovered or focused, then its name is still revealed.
- Given layout 'free', when the layout tool is activated, then onLayoutDirectionChange receives 'left-right'; from 'top-down' it receives 'free'.
- Given the shortcut panel is open, when Esc is pressed, then onCloseShortcuts is called; when closed, Esc does nothing.
- Given a pointer drag on the grip, when it moves, then the bar moves by the same delta.
- Given a pointer down on a tool, when it moves, then the bar does not move.
