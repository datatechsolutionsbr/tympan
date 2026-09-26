import { useId, useRef, type MouseEvent, type ReactNode } from 'react'
import { Button as AriaButton, Heading as AriaHeading, Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import type { RouterNavigateOptions } from '../../internal/provider'

export type SurfaceElevation = 'sheet' | 'raised' | 'floating' | 'flat'

export interface SurfaceProps {
  /** Level 1, 2, 3 or 0 of §2.5. */
  elevation?: SurfaceElevation
  /** Internal padding from §2.1. */
  padding?: 'none' | 'regular' | 'roomy'
  /** Semantics; a section with a title becomes a labelled region. */
  as?: 'section' | 'article' | 'div' | 'li'
  /** Header title (a heading). Required for pressable surfaces: it is the single primary control. */
  title?: ReactNode
  /** Header description. */
  description?: ReactNode
  /** Heading level of the title. */
  titleLevel?: 2 | 3 | 4
  /** Footer region, usually actions. */
  footer?: ReactNode
  /** Makes the whole surface a single press target. */
  onPress?: () => void
  /** Makes the whole surface a link (router adapter). */
  href?: string
  routerOptions?: RouterNavigateOptions
  /** Selectable surfaces: accent-soft state. */
  selected?: boolean
  /** Pressable surfaces only. */
  disabled?: boolean
  id?: string
  className?: string
  children?: ReactNode
}

const INTERACTIVE = 'a[href],button,input,select,textarea,summary,[role="button"],[role="link"],[role="checkbox"],[role="switch"],[tabindex]:not([tabindex="-1"])'

/** Bounded container at a chosen elevation (spec: wave-1/surface.md). */
export function Surface({
  elevation = 'sheet',
  padding = 'regular',
  as: Element = 'section',
  title,
  description,
  titleLevel = 3,
  footer,
  onPress,
  href,
  routerOptions,
  selected = false,
  disabled = false,
  id,
  className,
  children,
}: SurfaceProps) {
  const headingId = `fk-surface-title-${useId().replace(/:/g, '')}`
  const primaryRef = useRef<HTMLElement | null>(null)
  const pressable = !!(onPress || href)
  devWarning(pressable && title == null, 'Surface: a pressable surface needs a `title`, which becomes its primary control.')

  // "Card with a single primary control": presses anywhere on the surface,
  // outside nested controls, are forwarded to the title control.
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (!pressable || disabled || !primaryRef.current) return
    const target = e.target as Element
    if (primaryRef.current.contains(target)) return
    const interactive = target.closest(INTERACTIVE)
    if (interactive && e.currentTarget.contains(interactive)) return
    const selection = typeof window !== 'undefined' ? window.getSelection?.()?.toString() : ''
    if (selection) return
    primaryRef.current.click()
  }

  let titleContent: ReactNode = title
  if (pressable && title != null) {
    titleContent = href ? (
      <AriaLink
        ref={primaryRef as React.Ref<HTMLAnchorElement>}
        href={href}
        routerOptions={routerOptions}
        isDisabled={disabled}
        onPress={onPress}
        className="fk-surface__primary"
      >
        {title}
      </AriaLink>
    ) : (
      <AriaButton ref={primaryRef as React.Ref<HTMLButtonElement>} onPress={onPress} isDisabled={disabled} className="fk-surface__primary">
        {title}
      </AriaButton>
    )
  }

  const labelled = title != null && (Element === 'section' || Element === 'article')

  return (
    <Element
      id={id}
      className={cx('fk-surface', className)}
      aria-labelledby={labelled ? headingId : undefined}
      data-elevation={elevation}
      data-padding={padding}
      data-pressable={pressable || undefined}
      data-selected={selected || undefined}
      data-disabled={(pressable && disabled) || undefined}
      onClick={pressable ? handleClick : undefined}
    >
      {title != null || description != null ? (
        <header className="fk-surface__header">
          {title != null ? (
            <AriaHeading level={titleLevel} id={headingId} className="fk-surface__title">
              {titleContent}
            </AriaHeading>
          ) : null}
          {description != null ? <div className="fk-surface__description">{description}</div> : null}
        </header>
      ) : null}
      {children != null ? <div className="fk-surface__body">{children}</div> : null}
      {footer != null ? <footer className="fk-surface__footer">{footer}</footer> : null}
    </Element>
  )
}
