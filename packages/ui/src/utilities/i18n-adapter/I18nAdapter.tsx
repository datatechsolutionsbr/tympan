// I18nAdapter (spec: wave-2/i18n-adapter.md). One context for translated
// strings, locale and locale-aware formatting, independent of the host's i18n
// library. It sits next to FakhirProvider: the provider also feeds React
// Aria's I18nProvider, and `useLocale()` falls back to the locale React Aria
// already knows (for example FakhirProvider's `locale`).
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { I18nProvider, useLocale as useAriaLocale } from 'react-aria-components'
import { formatMessage, substitute, type MessageParams } from './icu'

export interface TranslateFn {
  (key: string, params?: MessageParams & { _?: string }): string
  /** Structured value stored under `key` (arrays, objects), or undefined. */
  raw: (key: string) => unknown
}

export type MessageTree = { [key: string]: string | MessageTree | unknown }

export interface I18nAdapterValue {
  locale: string
  translate: (namespace?: string) => TranslateFn
  messages?: MessageTree
}

const AdapterContext = createContext<I18nAdapterValue | null>(null)

function lookup(tree: MessageTree | undefined, path: string): unknown {
  if (!tree) return undefined
  let node: unknown = tree
  for (const segment of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[segment]
  }
  return node
}

const qualify = (namespace: string | undefined, key: string) => (namespace ? `${namespace}.${key}` : key)

/** Builds an adapter value from a nested catalogue and a locale. */
export function createI18nValue(messages: MessageTree, locale: string): I18nAdapterValue {
  const bound = new Map<string, TranslateFn>()
  return {
    locale,
    messages,
    translate(namespace) {
      const slot = namespace ?? ''
      let fn = bound.get(slot)
      if (!fn) {
        const t = ((key: string, params: MessageParams & { _?: string } = {}) => {
          const found = lookup(messages, qualify(namespace, key))
          if (typeof found === 'string') return formatMessage(found, params, locale)
          return fallbackText(namespace, key, params)
        }) as TranslateFn
        t.raw = (key) => lookup(messages, qualify(namespace, key))
        fn = t
        bound.set(slot, fn)
      }
      return fn
    },
  }
}

function fallbackText(namespace: string | undefined, key: string, params: MessageParams & { _?: string }): string {
  if (typeof params._ === 'string') return formatMessage(params._, params)
  return substitute(qualify(namespace, key), params)
}

export function I18nAdapterProvider({ value, children }: { value: I18nAdapterValue; children: ReactNode }) {
  return (
    <AdapterContext.Provider value={value}>
      <I18nProvider locale={value.locale}>{children}</I18nProvider>
    </AdapterContext.Provider>
  )
}

const detached = new Map<string, TranslateFn>()

function detachedTranslator(namespace?: string): TranslateFn {
  const slot = namespace ?? ''
  let fn = detached.get(slot)
  if (!fn) {
    const t = ((key: string, params: MessageParams & { _?: string } = {}) => fallbackText(namespace, key, params)) as TranslateFn
    t.raw = () => undefined
    fn = t
    detached.set(slot, fn)
  }
  return fn
}

/** Namespace-bound translator; identity is stable while inputs are unchanged. */
export function useTranslations(namespace?: string): TranslateFn {
  const value = useContext(AdapterContext)
  return useMemo(() => (value ? value.translate(namespace) : detachedTranslator(namespace)), [value, namespace])
}

/** The BCP 47 locale: the adapter's, else React Aria's (FakhirProvider or the browser). */
export function useLocale(): string {
  const value = useContext(AdapterContext)
  const aria = useAriaLocale().locale
  return value?.locale ?? aria
}

export interface LocaleFormatter {
  dateTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string
  number: (value: number, options?: Intl.NumberFormatOptions) => string
  /** Picks seconds, minutes, hours or days by magnitude. */
  relativeTime: (value: Date | string | number, now?: Date | number) => string
}

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', Number.POSITIVE_INFINITY],
]

export function createFormatter(locale: string): LocaleFormatter {
  return {
    dateTime: (value, options = { dateStyle: 'medium', timeStyle: 'short' }) => new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    number: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    relativeTime(value, now = Date.now()) {
      let amount = (new Date(value).getTime() - new Date(now).getTime()) / 1000
      let unit: Intl.RelativeTimeFormatUnit = 'second'
      for (const [name, size] of STEPS) {
        unit = name
        if (Math.abs(amount) < size) break
        amount /= size
      }
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(amount), unit)
    },
  }
}

export function useFormatter(): LocaleFormatter {
  const locale = useLocale()
  return useMemo(() => createFormatter(locale), [locale])
}
