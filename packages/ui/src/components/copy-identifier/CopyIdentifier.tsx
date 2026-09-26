import { Check, Copy } from 'lucide-react'
import { useEffect, useReducer, useRef, type SyntheticEvent, type CSSProperties } from 'react'
import { Button, Tooltip, TooltipTrigger } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { writeClipboard } from '../../internal/data-a/clipboard'
import { useMessages } from '../../internal/provider'

export interface CopyIdentifierProps {
  /** Identifier shown (shortened). */
  value: string
  /** Text placed on the clipboard; defaults to `value`. */
  copyValue?: string
  /** Verb before the value in the accessible name ("Copy: …"). */
  label?: string
  /** Characters shown before the ellipsis. */
  visibleLength?: number
  onCopy?: (ok: boolean) => void
  className?: string
}

/** Time the confirmation stays visible, in ms. */
export const COPY_CONFIRMATION_MS = 2000

type Phase = 'idle' | 'copied' | 'failed'
type PhaseEvent = { type: 'result'; ok: boolean } | { type: 'reset' }

function phaseReducer(_: Phase, event: PhaseEvent): Phase {
  if (event.type === 'reset') return 'idle'
  return event.ok ? 'copied' : 'failed'
}

/**
 * First `n` grapheme clusters and an ellipsis, for plain-text contexts (file
 * names, logs). The component itself never cuts text: it shows the whole
 * value and lets CSS elide it at `visibleLength` character widths.
 */
export function shortenIdentifier(value: string, n: number): string {
  const Seg = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter
  const units = Seg ? Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(value), (g) => g.segment) : Array.from(value)
  return units.length <= n ? value : `${units.slice(0, n).join('')}…`
}

const stop = (e: SyntheticEvent) => e.stopPropagation()

/** Shortened identifier that copies its full value (spec: wave-2/copy-identifier.md). */
export function CopyIdentifier({ value, copyValue, label, visibleLength = 8, onCopy, className }: CopyIdentifierProps) {
  const copy = useMessages().copyIdentifier
  const [phase, send] = useReducer(phaseReducer, 'idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const run = async () => {
    const ok = await writeClipboard(copyValue ?? value)
    send({ type: 'result', ok })
    onCopy?.(ok)
    clearTimeout(timer.current)
    if (ok) timer.current = setTimeout(() => send({ type: 'reset' }), COPY_CONFIRMATION_MS)
  }

  const Icon = phase === 'copied' ? Check : Copy
  const status = phase === 'copied' ? copy.copiedStatus(value) : phase === 'failed' ? copy.failed : ''

  return (
    // The wrapper keeps clicks from reaching a clickable parent row or card.
    <span className={cx('ty-copy-identifier', className)} data-phase={phase} onClick={stop} onPointerDown={stop} onKeyDown={stop}>
      <TooltipTrigger delay={300}>
        <Button className="ty-copy-identifier__trigger" aria-label={`${label ?? copy.copy}: ${value}`} onPress={() => void run()}>
          <Icon className="ty-icon" aria-hidden="true" focusable="false" />
          <span
            className="ty-copy-identifier__text"
            aria-hidden="true"
            dir={phase === 'copied' ? undefined : 'ltr'}
            data-elided={phase === 'copied' ? undefined : ''}
            style={{ '--ty-copy-visible': visibleLength } as CSSProperties}
          >
            {phase === 'copied' ? copy.copied : value}
          </span>
        </Button>
        <Tooltip className="ty-copy-identifier__tooltip" offset={6}>
          {value}
        </Tooltip>
      </TooltipTrigger>
      <span className="ty-visually-hidden" role="status">
        {status}
      </span>
    </span>
  )
}
