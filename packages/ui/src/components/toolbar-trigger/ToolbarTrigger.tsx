import type { ReactNode } from 'react'
import { Button as AriaButton, Tooltip, TooltipTrigger } from 'react-aria-components'
import { cx } from '../../internal/cx'

export type ToolbarTriggerControls = 'menu' | 'dialog' | 'none'

export interface ToolbarTriggerProps {
  /** Decorative glyph. */
  icon: ReactNode
  /** Accessible name. When a caption is visible the name also carries it (WCAG 2.5.3). */
  label: string
  /** Very short visible text after the icon (a locale code, a word). */
  caption?: string
  onPress?: () => void
  /** Kind of surface the trigger opens; sets `aria-haspopup`. */
  controls?: ToolbarTriggerControls
  expanded?: boolean
  /** Toggle state for switch-like triggers (for example a focus mode). */
  pressed?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

/** Label-in-name: keep the visible caption inside the accessible name. */
function nameWithCaption(label: string, caption?: string): string {
  if (!caption) return label
  return label.toLocaleLowerCase().includes(caption.toLocaleLowerCase()) ? label : `${label}, ${caption}`
}

const popupFor: Record<ToolbarTriggerControls, 'menu' | 'dialog' | undefined> = { menu: 'menu', dialog: 'dialog', none: undefined }

/** Compact bar button that opens a menu, drawer or flyout (spec: wave-2/toolbar-trigger.md). */
export function ToolbarTrigger(props: ToolbarTriggerProps) {
  const name = nameWithCaption(props.label, props.caption)
  const control = (
    <AriaButton
      id={props.id}
      className={cx('fk-toolbar-trigger', props.className)}
      aria-label={name}
      aria-haspopup={popupFor[props.controls ?? 'none']}
      aria-expanded={props.expanded}
      aria-pressed={props.pressed}
      isDisabled={props.disabled}
      onPress={() => props.onPress?.()}
      data-captioned={props.caption ? true : undefined}
      data-expanded-state={props.expanded ? true : undefined}
      data-toggled={props.pressed ? true : undefined}
    >
      <span className="fk-toolbar-trigger__glyph" aria-hidden="true">
        {props.icon}
      </span>
      {props.caption ? (
        <span className="fk-toolbar-trigger__caption" aria-hidden="true">
          {props.caption}
        </span>
      ) : null}
    </AriaButton>
  )
  // Icon-only triggers show their name as a tooltip on hover and focus.
  if (props.caption) return control
  return (
    <TooltipTrigger delay={400}>
      {control}
      <Tooltip className="fk-toolbar-trigger__tip" offset={6}>
        {props.label}
      </Tooltip>
    </TooltipTrigger>
  )
}
