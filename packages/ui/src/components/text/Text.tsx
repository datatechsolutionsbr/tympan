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

/** Running text in the type scale (spec: wave-1/text.md). */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { size = 'body', tone = 'default', as: Element = 'p', measure = 'none', truncate = false, numeric = false, className, style, title, children, ...rest },
  ref,
) {
  const lines = typeof truncate === 'number' ? truncate : truncate ? 1 : 0
  const fullText = typeof children === 'string' || typeof children === 'number' ? String(children) : undefined
  const mergedStyle: CSSProperties | undefined =
    lines > 1 ? { ...style, ['--fk-text-lines' as string]: String(lines) } : style
  return (
    <Element
      {...rest}
      ref={ref as never}
      className={cx('fk-text', className)}
      style={mergedStyle}
      title={title ?? (lines > 0 ? fullText : undefined)}
      data-size={size}
      data-tone={tone}
      data-measure={measure !== 'none' ? measure : undefined}
      data-truncate={lines === 1 ? 'line' : lines > 1 ? 'clamp' : undefined}
      data-numeric={numeric || undefined}
    >
      {children}
    </Element>
  )
})

/** Inline emphasis with semantic importance. */
export function Strong({ children, className }: { children: ReactNode; className?: string }) {
  return <strong className={cx('fk-strong', className)}>{children}</strong>
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
export function Code({ children, className }: CodeProps) {
  return <code className={cx('fk-code', className)}>{children}</code>
}
