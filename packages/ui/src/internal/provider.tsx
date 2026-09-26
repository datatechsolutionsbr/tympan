import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { I18nProvider, RouterProvider } from 'react-aria-components'
import { defaultMessages, mergeMessages, type MessageOverrides, type Messages } from './messages'

const MessagesContext = createContext<Messages>(defaultMessages)

export interface FakhirProviderProps {
  /** Copy overrides, typically produced by the host's i18n adapter. */
  messages?: MessageOverrides
  /** Base catalogue to merge overrides into (defaults to English). */
  baseMessages?: Messages
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
export function FakhirProvider({ messages, baseMessages = defaultMessages, navigate, useHref, locale, children }: FakhirProviderProps) {
  const merged = useMemo(() => mergeMessages(baseMessages, messages), [baseMessages, messages])
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
