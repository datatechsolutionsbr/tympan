import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../internal/cx'

export type TextSize = 'body-lg' | 'body' | 'meta'
export type TextTone = 'default' | 'muted' | 'danger' | 'success'
export type TextMeasure = 'none' | 'prose' | 'summary'

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Text token of §2.2. */
  size?: TextSize
  /** Ink level or semantic colour; semantic tones need a word or icon nearby. */
  tone?: TextTone
  /** Element semantics. */
  as?: 'p' | 'span' | 'div'
  /** Maximum line length (prose 68ch, summary 60ch). */
  measure?: TextMeasure
  /** Single-line ellipsis (`true`) or clamp to N lines; full text stays in the tree and as title. */
  truncate?: boolean | number
  /** Tabular figures for numbers. */
  numeric?: boolean
  children: ReactNode
}

type OwnKeys = 'size' | 'tone' | 'as' | 'measure' | 'truncate' | 'numeric' | 'children' | 'className' | 'style' | 'title'

/** Number of visible lines requested by `truncate` (0 = no truncation). */
function lineBudget(truncate: TextProps['truncate']): number {
  if (typeof truncate === 'number') return truncate
  return truncate === true ? 1 : 0
}

/** Everything the element carries besides its children, derived from the props in one place. */
function presentation(props: TextProps) {
  const lines = lineBudget(props.truncate)
  const plain = ['string', 'number'].includes(typeof props.children) ? String(props.children) : undefined
  const style: CSSProperties | undefined = lines < 2 ? props.style : { ...props.style, ['--ty-text-lines' as string]: `${lines}` }
  const truncation = lines === 0 ? undefined : lines === 1 ? 'line' : 'clamp'
  return {
    className: cx('ty-text', props.className),
    style,
    title: props.title ?? (truncation ? plain : undefined),
    'data-size': props.size ?? 'body',
    'data-tone': props.tone ?? 'default',
    'data-measure': props.measure && props.measure !== 'none' ? props.measure : undefined,
    'data-truncate': truncation,
    'data-numeric': props.numeric ? true : undefined,
  }
}

function passthrough(props: TextProps): Omit<TextProps, OwnKeys> {
  const out: Record<string, unknown> = { ...props }
  for (const key of ['size', 'tone', 'as', 'measure', 'truncate', 'numeric', 'children', 'className', 'style', 'title'] satisfies OwnKeys[]) delete out[key]
  return out
}

/** Running text in the type scale (spec: wave-1/text.md). */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(props, ref) {
  const Tag = props.as ?? 'p'
  return (
    <Tag {...passthrough(props)} {...presentation(props)} ref={ref as never}>
      {props.children}
    </Tag>
  )
})

/** Inline emphasis with semantic importance. */
export function Strong(props: { children: ReactNode; className?: string }) {
  return <strong className={cx('ty-strong', props.className)}>{props.children}</strong>
}

export interface CodeProps {
  children: ReactNode
  className?: string
  /**
   * Reserved: delegates to the Copy Identifier behaviour of wave 2. Accepted
   * now so call sites do not change later; it has no effect in wave 1.
   */
  copyable?: boolean
}

/** Inline monospace fragment for identifiers, keys and hashes. */
export function Code(props: CodeProps) {
  return <code className={cx('ty-code', props.className)}>{props.children}</code>
}
