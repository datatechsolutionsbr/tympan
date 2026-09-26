import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMediaQuery } from './media.ts'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ThemeDensity = 'compact' | 'default' | 'comfortable'

export interface ThemeState {
  /** Token theme (`fakhir`, `neutral`, `high-contrast` or a generated one). */
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
 * Theming root. Sets `data-fk-theme`, `data-fk-mode` and `data-fk-density`,
 * which the token stylesheet reads; no styles are injected at runtime.
 */
export function ThemeProvider(props: ThemeProviderProps) {
  const { target = 'document', storageKey, className, children } = props
  const stored = useMemo(() => readStored(storageKey), [storageKey])
  const [theme, setTheme] = useControllable(props.theme, stored.theme ?? props.defaultTheme ?? 'fakhir', props.onThemeChange)
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
    el.setAttribute('data-fk-theme', theme)
    el.setAttribute('data-fk-mode', mode)
    el.setAttribute('data-fk-density', density)
  }, [target, theme, mode, density])

  const value = useMemo<ThemeState>(
    () => ({ theme, mode, resolvedMode, density, setTheme, setMode, setDensity }),
    [theme, mode, resolvedMode, density, setTheme, setMode, setDensity],
  )

  return (
    <ThemeContext.Provider value={value}>
      {target === 'scope' ? (
        <div className={className ? `fk-theme-scope ${className}` : 'fk-theme-scope'} data-fk-theme={theme} data-fk-mode={mode} data-fk-density={density}>
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
export function themeInitScript(storageKey = 'fk-theme', defaults: Stored = {}): string {
  const d = JSON.stringify({ theme: defaults.theme ?? 'fakhir', mode: defaults.mode ?? 'system', density: defaults.density ?? 'default' })
  return `(function(){try{var d=${d};var s=JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||'{}');var e=document.documentElement;e.setAttribute('data-fk-theme',s.theme||d.theme);e.setAttribute('data-fk-mode',s.mode||d.mode);e.setAttribute('data-fk-density',s.density||d.density);}catch(_){}})();`
}
