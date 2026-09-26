import { ExternalLink } from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { isExternalHref } from '../../internal/dom'
import { useMessages } from '../../internal/provider'

export type LinkEmphasis = 'underlined' | 'subtle'

export interface LinkProps {
  /** Destination. Without it the link is an inline action and needs `onPress`. */
  href?: string
  /** Inline action, or a side effect on navigation. */
  onPress?: () => void
  /** `subtle` hides the underline at rest (only where the context makes the link obvious). */
  emphasis?: LinkEmphasis
  /** Opens in a new context with safe `rel`; inferred from absolute URLs to another origin. */
  external?: boolean
  /** Marks the link as the current page. */
  current?: boolean
  /** Navigates by replacing the history entry (router adapter). */
  replace?: boolean
  /** Standalone links (lists, footers) get a 44 px tall hit area; inline prose links do not. */
  standalone?: boolean
  children: ReactNode
  className?: string
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

/** Moves to another location or performs an inline action (spec: wave-1/link.md). */
export const Link = forwardRef<HTMLAnchorElement | HTMLButtonElement, LinkProps>(function Link(props, ref) {
  const { href, onPress, emphasis = 'underlined', external, current = false, replace = false, standalone = false, children, className, ...rest } = props
  const messages = useMessages()
  devWarning(!href && !onPress, 'Link: provide `href` or `onPress`.')

  const classes = cx('fk-link', className)
  const data = {
    'data-emphasis': emphasis,
    'data-standalone': standalone || undefined,
  }

  if (!href) {
    return (
      <AriaButton
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        onPress={() => onPress?.()}
        id={rest.id}
        aria-label={rest['aria-label']}
        aria-describedby={rest['aria-describedby']}
        data-action=""
        {...data}
      >
        {children}
      </AriaButton>
    )
  }

  const isExternal = external ?? isExternalHref(href)
  return (
    <AriaLink
      ref={ref as React.Ref<HTMLAnchorElement>}
      className={classes}
      href={href}
      onPress={onPress ? () => onPress() : undefined}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      routerOptions={replace ? { replace: true } : undefined}
      aria-current={current ? 'page' : undefined}
      id={rest.id}
      aria-label={rest['aria-label']}
      aria-describedby={rest['aria-describedby']}
      {...data}
    >
      {children}
      {isExternal ? (
        <>
          <ExternalLink className="fk-icon fk-mirror-rtl fk-link__external" aria-hidden="true" focusable="false" />
          <span className="fk-visually-hidden"> {messages.link.opensInNewTab}</span>
        </>
      ) : null}
    </AriaLink>
  )
})
