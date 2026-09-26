// Labels (every user-visible string) and locale.
//
// Each component declares its strings once with `defineLabels(key, { en,
// 'pt-BR', es })`. At render, `useLabels(definition, props.labels)` resolves:
//   1. the component's `labels` prop (partial),
//   2. the host catalogue given to <FlowMessagesProvider messages={{ [key]: … }}>,
//   3. the built-in bundle for the provider locale (exact tag, then language),
//   4. English.
// Templates use an ICU MessageFormat subset (see messageFormat.ts); `fill`
// formats them with the provider locale. Locale and direction come from React
// Aria's I18nProvider, which @datatechsolutions/tympan's TympanProvider sets.

import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react'
import { useLocale } from 'react-aria-components'
import { formatMessage, type MessageValues } from './messageFormat'

export interface LabelDefinition<L extends object> {
  readonly key: string
  readonly bundles: Readonly<Record<string, Partial<L>>> & { readonly en: L }
}

/** Declares a component's strings: English is complete; other locales may be partial. */
export function defineLabels<L extends object>(key: string, bundles: { en: L } & Record<string, Partial<L>>): LabelDefinition<L> {
  return Object.freeze({ key, bundles: Object.freeze({ ...bundles }) as LabelDefinition<L>['bundles'] })
}

/** Locales the library ships strings for. Hosts add any other through FlowMessagesProvider. */
export const BUILT_IN_LOCALES = ['en', 'pt-BR', 'es'] as const

type HostCatalogue = Record<string, Record<string, unknown>>

const MessagesContext = createContext<HostCatalogue | null>(null)

/** Host i18n adapter: `messages[componentKey]` overrides that component's labels. */
export function FlowMessagesProvider({ messages, children }: { messages: HostCatalogue; children: ReactNode }) {
  return createElement(MessagesContext.Provider, { value: messages }, children)
}

function isDefinition<L extends object>(x: L | LabelDefinition<L>): x is LabelDefinition<L> {
  return typeof x === 'object' && x !== null && 'bundles' in x && 'key' in x
}

function stripUndefined<L extends object>(o: Partial<L> | undefined): Partial<L> {
  const out: Partial<L> = {}
  if (!o) return out
  for (const [k, v] of Object.entries(o)) if (v !== undefined) (out as Record<string, unknown>)[k] = v
  return out
}

/** Picks the bundle for a BCP 47 tag: exact, then same language, else nothing. */
export function bundleFor<L extends object>(def: LabelDefinition<L>, locale: string): Partial<L> {
  const exact = def.bundles[locale]
  if (exact) return exact
  const lang = locale.split('-')[0]!.toLowerCase()
  const byLanguage = Object.entries(def.bundles).find(([tag]) => tag.split('-')[0]!.toLowerCase() === lang)
  return byLanguage ? byLanguage[1] : {}
}

/** Resolves labels (see the header). Accepts a definition or a plain English object. */
export function useLabels<L extends object>(defaults: L | LabelDefinition<L>, overrides: Partial<L> | undefined): L {
  const { locale } = useLocale()
  const host = useContext(MessagesContext)
  return useMemo(() => {
    if (!isDefinition(defaults)) return { ...defaults, ...stripUndefined(overrides) }
    return {
      ...defaults.bundles.en,
      ...stripUndefined(bundleFor(defaults, locale)),
      ...stripUndefined(host?.[defaults.key] as Partial<L> | undefined),
      ...stripUndefined(overrides),
    }
  }, [defaults, overrides, locale, host])
}

/** Formats a label template (ICU subset). Pass the locale for plurals and numbers. */
export function fill(template: string, values: MessageValues, locale?: string): string {
  return formatMessage(template, values, locale)
}

export interface FlowLocale {
  locale: string
  direction: 'ltr' | 'rtl'
  rtl: boolean
}

/** Provider locale and reading direction (React Aria I18nProvider, else the browser). */
export function useFlowLocale(): FlowLocale {
  const { locale, direction } = useLocale()
  return useMemo(() => ({ locale, direction, rtl: direction === 'rtl' }), [locale, direction])
}
