// CanvasToolbar: renders canvas tool items (see canvasTools.ts) as an APG
// Toolbar (one tab stop, arrow keys between tools). Each tool reveals its
// name beside the icon on hover and keyboard focus. The same items can be
// handed to the design system's bottom dock instead.

import { Fragment, type ReactNode } from 'react'
import { Button as AriaButton, Separator, ToggleButton, Toolbar } from 'react-aria-components'
import type { CanvasToolItem } from './canvasTools'

export interface CanvasToolbarProps {
  items: readonly CanvasToolItem[]
  /** Accessible name of the toolbar. */
  label: string
  orientation?: 'horizontal' | 'vertical'
  /** Where the bar sits: docked at the bottom edge of the canvas, or inline in a host bar. */
  placement?: 'dock' | 'inline'
  /** Extra content after the tools (for example the node search popover). */
  after?: ReactNode
  className?: string
  /** Lets Escape from the canvas land here (EditorShortcuts / FlowEditor). */
  exitTarget?: boolean
}

export function CanvasToolbar({ items, label, orientation = 'horizontal', placement = 'dock', after, className, exitTarget = true }: CanvasToolbarProps) {
  let lastGroup: string | null = null
  return (
    <Toolbar
      aria-label={label}
      orientation={orientation}
      className={['ty-canvas-toolbar', className].filter(Boolean).join(' ')}
      data-placement={placement}
      data-ty-surface-chrome=""
      {...(exitTarget ? { 'data-ty-canvas-exit': '' } : {})}
    >
      {items.map((item) => {
        const divider = lastGroup !== null && lastGroup !== item.group
        lastGroup = item.group
        return (
          <Fragment key={item.id}>
            {divider ? <Separator orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'} className="ty-canvas-toolbar__divider" /> : null}
            <Tool item={item} />
          </Fragment>
        )
      })}
      {after}
    </Toolbar>
  )
}

function ToolFace({ item }: { item: CanvasToolItem }) {
  const Icon = item.icon
  return (
    <>
      {item.text ? (
        <span className="ty-canvas-tool__text" aria-hidden="true">
          {item.text}
        </span>
      ) : Icon ? (
        <Icon className="ty-canvas-tool__icon" aria-hidden="true" focusable="false" />
      ) : null}
      {item.text ? null : (
        <span className="ty-canvas-tool__label" aria-hidden="true">
          {item.label}
          {item.shortcut ? <kbd className="ty-canvas-tool__keys">{item.shortcut.replace('Control+', '⌃')}</kbd> : null}
        </span>
      )}
    </>
  )
}

function Tool({ item }: { item: CanvasToolItem }) {
  const common = {
    className: 'ty-canvas-tool',
    'aria-label': item.label,
    'data-tool': item.id,
    // React Aria does not forward aria-keyshortcuts; set it on the element.
    ref: (el: HTMLButtonElement | null) => {
      if (!el) return
      if (item.shortcut) el.setAttribute('aria-keyshortcuts', item.shortcut)
      else el.removeAttribute('aria-keyshortcuts')
    },
  }
  if (item.kind === 'toggle' || item.kind === 'mode') {
    return (
      <ToggleButton
        {...common}
        isSelected={!!item.pressed}
        onChange={() => {
          // A mode already on stays on (single-select pair).
          if (item.kind === 'mode' && item.pressed) return
          item.onPress?.()
        }}
        isDisabled={item.disabled}
        data-kind={item.kind}
      >
        <ToolFace item={item} />
      </ToggleButton>
    )
  }
  return (
    <AriaButton
      {...common}
      // Disabled tools stay focusable and discoverable; activation is a no-op.
      aria-disabled={item.disabled || undefined}
      data-disabled={item.disabled || undefined}
      onPress={() => {
        if (!item.disabled) item.onPress?.()
      }}
      data-kind="action"
    >
      <ToolFace item={item} />
    </AriaButton>
  )
}
