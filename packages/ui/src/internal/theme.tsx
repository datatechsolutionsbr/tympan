import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRINT_THEME_ALIASES, resolvePrintThemeName } from '@datatechsolutions/tympan-tokens/print-aliases'
import { useMediaQuery } from './media.ts'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ThemeDensity = 'compact' | 'default' | 'comfortable'

export interface ThemeState {
  /** Token theme (`tympan`, `fakhir`, `neutral`, `high-contrast`, an opt-in `print-*` theme or a generated one). */
  theme: string
  mode: ThemeMode
  /** `mode` with `system` resolved through `prefers-color-scheme`. */
  resolvedMode: 'light' | 'dark'
  density: ThemeDensity
  setTheme: (theme: string) => void
  setMode: (mode: ThemeMode) => void
  setDensity: (density: ThemeDensity) => void
}

const ThemeContext = createContext<ThemeState | null>(null)

export interface ThemeProviderProps {
  /** Controlled theme; pair with `onThemeChange`. */
  theme?: string
  defaultTheme?: string
  onThemeChange?: (theme: string) => void
  mode?: ThemeMode
  defaultMode?: ThemeMode
  onModeChange?: (mode: ThemeMode) => void
  density?: ThemeDensity
  defaultDensity?: ThemeDensity
  onDensityChange?: (density: ThemeDensity) => void
  /**
   * `document` writes the data attributes on `<html>` (one theme per app);
   * `scope` renders a wrapper element carrying them (previews, embeds).
   */
  target?: 'document' | 'scope'
  /**
   * Optional convenience persistence in localStorage under this key, in the
   * format read by `themeInitScript`. Hosts that persist elsewhere (a user
   * profile, a cookie) leave it unset and use the change callbacks.
   */
  storageKey?: string
  /**
   * Font stylesheet per theme name (for example `printThemeFontUrls` from
   * the tokens package). The URL of the current theme is added as a
   * `<link rel="stylesheet">` (in `<head>` for `document`, inside the wrapper
   * for `scope`); themes without an entry load nothing.
   */
  fonts?: Readonly<Record<string, string>>
  className?: string
  children: ReactNode
}

interface Stored {
  theme?: string
  mode?: ThemeMode
  density?: ThemeDensity
}

function readStored(key: string | undefined): Stored {
  if (!key || typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Stored) : {}
  } catch {
    return {}
  }
}

function writeStored(key: string | undefined, value: Stored): void {
  if (!key || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: the host callbacks still fire */
  }
}

function useControllable<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = useState(initial)
  const current = value ?? inner
  const set = useCallback(
    (v: T) => {
      if (value === undefined) setInner(v)
      onChange?.(v)
    },
    [value, onChange],
  )
  return [current, set]
}

/**
 * Theming root. Sets `data-ty-theme`, `data-ty-mode` and `data-ty-density`,
 * which the token stylesheet reads; no styles are injected at runtime.
 */
export function ThemeProvider(props: ThemeProviderProps) {
  const { target = 'document', storageKey, fonts, className, children } = props
  const stored = useMemo(() => readStored(storageKey), [storageKey])
  const [storedTheme, setStoredTheme] = useControllable(props.theme, stored.theme ?? props.defaultTheme ?? 'tympan', props.onThemeChange)
  // A deprecated print theme name (`print-<old style id>`, see PRINT_THEME_ALIASES) is read as the renamed theme.
  const theme = resolvePrintThemeName(storedTheme)
  const setTheme = useCallback((t: string) => setStoredTheme(resolvePrintThemeName(t)), [setStoredTheme])
  const [mode, setMode] = useControllable<ThemeMode>(props.mode, stored.mode ?? props.defaultMode ?? 'system', props.onModeChange)
  const [density, setDensity] = useControllable<ThemeDensity>(
    props.density,
    stored.density ?? props.defaultDensity ?? 'default',
    props.onDensityChange,
  )
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const resolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    writeStored(storageKey, { theme, mode, density })
  }, [storageKey, theme, mode, density])

  useEffect(() => {
    if (target !== 'document' || typeof document === 'undefined') return
    const el = document.documentElement
    el.setAttribute('data-ty-theme', theme)
    el.setAttribute('data-ty-mode', mode)
    el.setAttribute('data-ty-density', density)
  }, [target, theme, mode, density])

  const fontsHref = fonts?.[theme]
  useEffect(() => {
    if (target !== 'document' || typeof document === 'undefined') return
    const existing = document.head.querySelector<HTMLLinkElement>('link[data-ty-theme-fonts]')
    if (!fontsHref) {
      existing?.remove()
      return
    }
    const link = existing ?? document.createElement('link')
    link.rel = 'stylesheet'
    link.setAttribute('data-ty-theme-fonts', '')
    if (link.getAttribute('href') !== fontsHref) link.href = fontsHref
    if (!existing) document.head.appendChild(link)
  }, [target, fontsHref])

  const value = useMemo<ThemeState>(
    () => ({ theme, mode, resolvedMode, density, setTheme, setMode, setDensity }),
    [theme, mode, resolvedMode, density, setTheme, setMode, setDensity],
  )

  return (
    <ThemeContext.Provider value={value}>
      {target === 'scope' ? (
        <div className={className ? `ty-theme-scope ${className}` : 'ty-theme-scope'} data-ty-theme={theme} data-ty-mode={mode} data-ty-density={density}>
          {fontsHref ? <link rel="stylesheet" href={fontsHref} data-ty-theme-fonts="" /> : null}
          {children}
        </div>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  )
}

/** Current theme state; throws outside a ThemeProvider. */
export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>.')
  return ctx
}

/**
 * Inline script for the SPA's index.html, placed in <head> before any
 * stylesheet, so the stored theme applies before first paint (no flash of the
 * wrong theme). It only sets attributes; it reads the same key as
 * `ThemeProvider storageKey`.
 */
export function themeInitScript(storageKey = 'ty-theme', defaults: Stored = {}, options: { fonts?: Readonly<Record<string, string>> } = {}): string {
  const d = JSON.stringify({ theme: defaults.theme ?? 'tympan', mode: defaults.mode ?? 'system', density: defaults.density ?? 'default' })
  // Optional: the font stylesheet of the stored theme, added before first paint (same link ThemeProvider `fonts` manages).
  const fonts = options.fonts && Object.keys(options.fonts).length
    ? `var f=${JSON.stringify(options.fonts).replace(/</g, '\\u003c')}[t];if(f){var l=document.createElement('link');l.rel='stylesheet';l.href=f;l.setAttribute('data-ty-theme-fonts','');document.head.appendChild(l);}`
    : ''
  // Deprecated print theme names map to the renamed theme (PRINT_THEME_ALIASES), as in ThemeProvider.
  const aliases = JSON.stringify(PRINT_THEME_ALIASES).replace(/</g, '\\u003c')
  return `(function(){try{var d=${d};var s=JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||'{}');var e=document.documentElement;var t=s.theme||d.theme;var a=${aliases};if(Object.prototype.hasOwnProperty.call(a,t))t=a[t];e.setAttribute('data-ty-theme',t);e.setAttribute('data-ty-mode',s.mode||d.mode);e.setAttribute('data-ty-density',s.density||d.density);${fonts}}catch(_){}})();`
}
