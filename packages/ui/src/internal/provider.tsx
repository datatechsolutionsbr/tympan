import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { I18nProvider, RouterProvider } from 'react-aria-components'
import { compileIcuMessages, pseudoLocalize, type IcuCatalogue } from './icuCatalogue'
import { catalogueForLocale, defaultMessages, mergeMessages, type MessageOverrides, type Messages } from './messages'

const MessagesContext = createContext<Messages>(defaultMessages)

export interface TympanProviderProps {
  /** Copy overrides, typically produced by the host's i18n adapter. */
  messages?: MessageOverrides
  /** Base catalogue to merge overrides into (defaults to the shipped catalogue of `locale`: pt, es or en). */
  baseMessages?: Messages
  /** Overrides as ICU MessageFormat strings (function keys take {0}, {1}, … positionally). */
  icuMessages?: IcuCatalogue
  /** Pseudo-localization (accented, expanded, bracketed copy) to catch clipping and hard-coded strings. */
  pseudo?: boolean
  /** Router adapter: client-side navigation for every library link. */
  navigate?: (href: string, options?: RouterNavigateOptions) => void
  /** Router adapter: converts a router href into a native href. */
  useHref?: (href: string) => string
  /** BCP 47 locale for number/date formatting and reading direction. */
  locale?: string
  children: ReactNode
}

/** Options forwarded to the router adapter by links (for example `replace`). */
export interface RouterNavigateOptions {
  replace?: boolean
}

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: RouterNavigateOptions
  }
}

/**
 * Root provider: supplies copy (I18n adapter) and the router adapter used by
 * every link-like component. Optional: components fall back to English copy
 * and native navigation without it.
 */
export function TympanProvider({ messages, baseMessages, icuMessages, pseudo = false, navigate, useHref, locale, children }: TympanProviderProps) {
  const merged = useMemo(() => {
    const base = baseMessages ?? (locale ? catalogueForLocale(locale) : defaultMessages)
    let out = mergeMessages(base, messages)
    if (icuMessages) out = mergeMessages(out, compileIcuMessages(icuMessages, out, locale ?? 'en'))
    return pseudo ? pseudoLocalize(out) : out
  }, [baseMessages, messages, icuMessages, pseudo, locale])
  let tree = <MessagesContext.Provider value={merged}>{children}</MessagesContext.Provider>
  if (navigate) {
    tree = (
      <RouterProvider navigate={navigate} {...(useHref ? { useHref } : {})}>
        {tree}
      </RouterProvider>
    )
  }
  if (locale) tree = <I18nProvider locale={locale}>{tree}</I18nProvider>
  return tree
}

/** Current copy catalogue. */
export function useMessages(): Messages {
  return useContext(MessagesContext)
}
