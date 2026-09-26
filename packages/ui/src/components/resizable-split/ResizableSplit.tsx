import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMinWidth } from '../../internal/media'
import { clampSize, useSplitter } from './useSplitter'

export interface ResizableSplitProps {
  primary: ReactNode
  secondary: ReactNode
  /** Controlled size (px) of the secondary pane. */
  size?: number
  defaultSize?: number
  onSizeChange?: (px: number) => void
  min?: number
  max?: number
  /** Side of the sized pane. */
  secondarySide?: 'start' | 'end'
  /** Arrow-key step (px). */
  step?: number
  /** Accessible name of the splitter. */
  label: string
  /** Below this viewport width the panes stack and the splitter goes away. */
  stackBelow?: number
  className?: string
}

/** Two panes with a keyboard-operable divider (spec: wave-4/resizable-split.md, APG Window Splitter). */
export function ResizableSplit(props: ResizableSplitProps) {
  const min = props.min ?? 240
  const max = props.max ?? 640
  const [own, setOwn] = useState(() => clampSize(props.defaultSize ?? 360, min, max))
  const size = props.size ?? own
  const side = props.secondarySide ?? 'end'
  const { direction } = useLocale()
  const sideBySide = useMinWidth(props.stackBelow ?? 1024)
  const paneId = useId()
  // The sized pane grows towards the splitter, i.e. away from its own side.
  const growsLeft = (side === 'end') === (direction !== 'rtl')
  const splitter = useSplitter({
    size,
    min,
    max,
    step: props.step ?? 8,
    grows: growsLeft ? 'left' : 'right',
    onSize: (px) => {
      if (props.size === undefined) setOwn(px)
      props.onSizeChange?.(px)
    },
  })

  const panes = {
    primary: (
      <div key="primary" className="ty-split__pane" data-pane="primary">
        {props.primary}
      </div>
    ),
    secondary: (
      <div key="secondary" id={paneId} className="ty-split__pane" data-pane="secondary">
        {props.secondary}
      </div>
    ),
    handle: sideBySide ? <div key="handle" {...splitter} aria-label={props.label} aria-controls={paneId} className="ty-split__handle" /> : null,
  }
  const order = side === 'end' ? [panes.primary, panes.handle, panes.secondary] : [panes.secondary, panes.handle, panes.primary]

  return (
    <div
      className={cx('ty-split', props.className)}
      data-side={side}
      data-stacked={sideBySide ? undefined : ''}
      style={{ '--ty-split-size': `${size}px` } as CSSProperties}
    >
      {order}
    </div>
  )
}
