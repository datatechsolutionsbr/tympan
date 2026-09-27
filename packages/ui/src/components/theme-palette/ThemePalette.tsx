import { Palette, Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Button as AriaButton, Dialog, Modal, ModalOverlay } from 'react-aria-components'
import { presets, printThemePresets, type ThemeConfig } from '@datatechsolutions/tympan-tokens'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { useTheme, type ThemeDensity, type ThemeMode } from '../../internal/theme'
import { SegmentedControl } from '../segmented-control/SegmentedControl'

/** One theme in the palette. `id` is the `data-ty-theme` value. */
export interface ThemePaletteTheme {
  id: string
  label: string
  /** Matched by the search but not shown. */
  keywords?: string[]
}

export interface ThemePaletteGroup {
  id: string
  heading: string
  themes: ThemePaletteTheme[]
}

export interface ThemePaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Theme groups; defaults to the built-in presets and every book style (`themePaletteGroups`). */
  groups?: ThemePaletteGroup[]
  /** Localised name of a theme id (defaults to the theme's own label). */
  labelFor?: (id: string) => string
  /** localStorage key of the recently applied themes; `null` turns the recent group off. */
  recentKey?: string | null
  className?: string
}

const RECENT_DEFAULT = 'ty-theme-palette-recent'

/** Groups of every theme the tokens package ships: the UI presets, then the book styles. */
export function themePaletteGroups(headings: { interface: string; print: string }): ThemePaletteGroup[] {
  const toTheme = (p: ThemeConfig): ThemePaletteTheme => ({ id: p.name, label: p.label ?? p.name, keywords: [p.name] })
  return [
    { id: 'interface', heading: headings.interface, themes: presets.map(toTheme) },
    { id: 'print', heading: headings.print, themes: printThemePresets.map(toTheme) },
  ]
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()

/**
 * Fuzzy score of `text` for `query`: 0 when the query's characters do not all appear in order; higher
 * for a prefix, a word start, then contiguous runs.
 */
export function fuzzyScore(text: string, query: string): number {
  const t = fold(text)
  const q = fold(query.trim())
  if (!q) return 1
  if (t.startsWith(q)) return 1000 - t.length
  const at = t.indexOf(q)
  if (at >= 0) return (/[\s\-(]/.test(t[at - 1] ?? ' ') ? 800 : 600) - at
  let score = 0
  let run = 0
  let i = 0
  for (const ch of q) {
    const found = t.indexOf(ch, i)
    if (found < 0) return 0
    run = found === i ? run + 1 : 1
    score += run * 2 + (/[\s\-(]/.test(t[found - 1] ?? ' ') ? 3 : 0)
    i = found + 1
  }
  return score
}

function readRecent(key: string | null): string[] {
  if (!key) return []
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeRecent(key: string | null, id: string) {
  if (!key) return
  try {
    localStorage.setItem(key, JSON.stringify([id, ...readRecent(key).filter((x) => x !== id)].slice(0, 5)))
  } catch {
    /* storage unavailable */
  }
}

/** Paper, ink and accent of a theme, drawn by the theme's own tokens (a tiny theme scope). */
export function ThemeSwatch({ theme, mode, className }: { theme: string; mode?: 'light' | 'dark'; className?: string }) {
  return (
    <span className={cx('ty-theme-swatch', className)} data-ty-theme={theme} data-ty-mode={mode} aria-hidden="true">
      <span className="ty-theme-swatch__ink" />
      <span className="ty-theme-swatch__accent" />
    </span>
  )
}

interface Row {
  key: string
  theme: ThemePaletteTheme
  group: string
}

/**
 * Command-palette theme picker (spec: this file). Moving the highlight previews the theme on the whole app;
 * Enter applies it, Escape restores the theme the palette opened with. Mode and density sit below the list.
 * Needs a ThemeProvider; book-style themes need `@datatechsolutions/tympan-tokens/print-themes.css`.
 */
export function ThemePalette(props: ThemePaletteProps) {
  const copy = useMessages().themePalette
  const th = useTheme()
  const listId = useId()
  const optionPrefix = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const recentKey = props.recentKey === undefined ? RECENT_DEFAULT : props.recentKey
  const groups = useMemo(
    () => props.groups ?? themePaletteGroups({ interface: copy.groupInterface, print: copy.groupPrint }),
    [props.groups, copy.groupInterface, copy.groupPrint],
  )
  const label = (t: ThemePaletteTheme) => props.labelFor?.(t.id) ?? t.label
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const [announce, setAnnounce] = useState('')
  const initial = useRef<string | null>(null)
  const applied = useRef(false)

  // On open: remember the theme to restore, reset the search, put the highlight on the current theme.
  useEffect(() => {
    if (!props.open) return
    initial.current = th.theme
    applied.current = false
    setQuery('')
    setRecent(readRecent(recentKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open])

  const sections = useMemo(() => {
    const all = groups.flatMap((g) => g.themes.map((theme) => ({ theme, group: g.id })))
    const q = query.trim()
    if (q) {
      const hits = all
        .map((r) => ({ ...r, score: Math.max(fuzzyScore(label(r.theme), q), ...(r.theme.keywords ?? []).map((k) => fuzzyScore(k, q) * 0.9)) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
      return [{ id: 'results', heading: copy.results(hits.length), rows: hits.map((r) => ({ key: `r-${r.theme.id}`, theme: r.theme, group: r.group })) }]
    }
    const out: Array<{ id: string; heading: string; count?: number; rows: Row[] }> = []
    const recents = recent.map((id) => all.find((r) => r.theme.id === id)).filter((r): r is (typeof all)[number] => !!r)
    if (recents.length) out.push({ id: 'recent', heading: copy.recent, rows: recents.map((r) => ({ key: `recent-${r.theme.id}`, ...r })) })
    for (const g of groups) out.push({ id: g.id, heading: g.heading, count: g.themes.length, rows: g.themes.map((theme) => ({ key: `${g.id}-${theme.id}`, theme, group: g.id })) })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, query, recent, copy, props.labelFor])

  const rows = sections.flatMap((s) => s.rows)
  const at = rows.length ? Math.min(cursor, rows.length - 1) : -1
  const current = rows[at]
  const optionId = (r: Row) => `${optionPrefix}-${r.key}`.replace(/[^\w-]/g, '_')

  // When the list changes (open, typing), point at the current theme if it is listed, else the first row.
  useEffect(() => {
    if (!props.open) return
    const i = rows.findIndex((r) => r.theme.id === (initial.current ?? th.theme))
    setCursor(query.trim() ? 0 : Math.max(0, i))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, query, sections])

  useEffect(() => {
    if (current) document.getElementById(optionId(current))?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key])

  const preview = (i: number) => {
    const r = rows[i]
    setCursor(i)
    if (r && r.theme.id !== th.theme) th.setTheme(r.theme.id)
  }

  const apply = (r: Row | undefined) => {
    if (!r) return
    th.setTheme(r.theme.id)
    applied.current = true
    writeRecent(recentKey, r.theme.id)
    setAnnounce(copy.applied(label(r.theme)))
    props.onOpenChange(false)
  }

  const close = () => {
    // Closing without applying (Escape, backdrop) restores the theme the palette opened with.
    if (!applied.current && initial.current && th.theme !== initial.current) th.setTheme(initial.current)
    props.onOpenChange(false)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const step = (to: number) => {
      e.preventDefault()
      if (rows.length) preview((to + rows.length) % rows.length)
    }
    switch (e.key) {
      case 'ArrowDown':
        return step(at + 1)
      case 'ArrowUp':
        return step(at - 1)
      case 'PageDown':
        return step(Math.min(rows.length - 1, at + 8))
      case 'PageUp':
        return step(Math.max(0, at - 8))
      case 'Home':
        if (e.ctrlKey || !query) return step(0)
        return
      case 'End':
        if (e.ctrlKey || !query) return step(rows.length - 1)
        return
      case 'Enter':
        e.preventDefault()
        return apply(current)
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        return close()
    }
  }

  const modes: Array<{ value: ThemeMode; label: string }> = [
    { value: 'system', label: copy.modeSystem },
    { value: 'light', label: copy.modeLight },
    { value: 'dark', label: copy.modeDark },
  ]
  const densities: Array<{ value: ThemeDensity; label: string }> = [
    { value: 'compact', label: copy.densityCompact },
    { value: 'default', label: copy.densityDefault },
    { value: 'comfortable', label: copy.densityComfortable },
  ]
  const previewTheme = current?.theme.id ?? th.theme

  return (
    <>
      <ModalOverlay isOpen={props.open} onOpenChange={(o) => !o && close()} isDismissable isKeyboardDismissDisabled className="ty-theme-palette__backdrop">
        <Modal className={cx('ty-theme-palette', props.className)}>
          <Dialog className="ty-theme-palette__dialog" aria-label={copy.label}>
            <div className="ty-theme-palette__field">
              <Search className="ty-theme-palette__icon" aria-hidden="true" />
              <input
                ref={inputRef}
                className="ty-theme-palette__input"
                role="combobox"
                aria-label={copy.label}
                aria-autocomplete="list"
                aria-expanded={rows.length > 0}
                aria-controls={listId}
                aria-activedescendant={current ? optionId(current) : undefined}
                placeholder={copy.placeholder}
                value={query}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKey}
              />
            </div>
            <div className="ty-theme-palette__body">
              <div id={listId} role="listbox" aria-label={copy.label} className="ty-theme-palette__list">
                {sections.map((s) => (
                  <div key={s.id} role="group" aria-labelledby={`${listId}-${s.id}`} className="ty-theme-palette__group">
                    <div id={`${listId}-${s.id}`} className="ty-theme-palette__heading" role="presentation">
                      <span>{s.heading}</span>
                      {s.count !== undefined ? <span className="ty-theme-palette__count">{copy.count(s.count)}</span> : null}
                    </div>
                    {s.rows.map((r) => {
                      const i = rows.indexOf(r)
                      return (
                        <div
                          key={r.key}
                          id={optionId(r)}
                          role="option"
                          aria-selected={i === at}
                          aria-current={r.theme.id === initial.current ? 'true' : undefined}
                          className="ty-theme-palette__option"
                          onPointerMove={() => i !== at && preview(i)}
                          onClick={() => apply(r)}
                        >
                          <ThemeSwatch theme={r.theme.id} mode={th.resolvedMode} />
                          <span className="ty-theme-palette__name">{label(r.theme)}</span>
                          <code className="ty-theme-palette__id">{r.theme.id}</code>
                        </div>
                      )
                    })}
                  </div>
                ))}
                {!rows.length ? <p className="ty-theme-palette__empty">{copy.noResults(query.trim())}</p> : null}
              </div>
              <aside className="ty-theme-palette__preview" aria-label={copy.preview} data-ty-theme={previewTheme} data-ty-mode={th.resolvedMode}>
                <span className="ty-theme-palette__preview-eyebrow">{copy.preview}</span>
                <span className="ty-theme-palette__preview-title">{current ? label(current.theme) : ''}</span>
                <span className="ty-theme-palette__preview-body">{copy.sample}</span>
                <span className="ty-theme-palette__preview-bar">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="ty-theme-palette__preview-button">Aa</span>
              </aside>
            </div>
            <div className="ty-theme-palette__foot">
              <SegmentedControl label={copy.mode} size="compact" options={modes} value={th.mode} onChange={(m) => th.setMode(m as ThemeMode)} />
              <SegmentedControl label={copy.density} size="compact" options={densities} value={th.density} onChange={(d) => th.setDensity(d as ThemeDensity)} />
              <span className="ty-theme-palette__hints" aria-hidden="true">
                <kbd>↑↓</kbd> {copy.hints.move} <kbd>↵</kbd> {copy.hints.apply} <kbd>esc</kbd> {copy.hints.revert}
              </span>
            </div>
            <div className="ty-visually-hidden" aria-live="polite">
              {query.trim() ? (rows.length ? copy.results(rows.length) : copy.noResults(query.trim())) : ''}
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
      <div className="ty-visually-hidden" role="status" aria-live="polite">
        {announce}
      </div>
    </>
  )
}

export interface ThemePaletteTriggerProps extends Omit<ThemePaletteProps, 'open' | 'onOpenChange'> {
  /** Also open with ⌘/Ctrl+Shift+P and, outside text fields, the T key. Default true. */
  shortcut?: boolean
  /** Hide the theme name (swatch only); the name stays the accessible label. */
  compact?: boolean
  children?: ReactNode
}

/** Button showing the current theme's swatch and name; opens the ThemePalette. */
export function ThemePaletteTrigger({ shortcut = true, compact = false, className, ...rest }: ThemePaletteTriggerProps) {
  const copy = useMessages().themePalette
  const th = useTheme()
  const [open, setOpen] = useState(false)
  const all = useMemo(() => (rest.groups ?? themePaletteGroups({ interface: '', print: '' })).flatMap((g) => g.themes), [rest.groups])
  const found = all.find((t) => t.id === th.theme)
  const name = rest.labelFor?.(th.theme) ?? found?.label ?? th.theme

  useEffect(() => {
    if (!shortcut) return
    const on = (e: globalThis.KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"], [role="combobox"]')
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setOpen(true)
      } else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === 't' || e.key === 'T')) {
        setOpen(true)
      }
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [shortcut])

  return (
    <>
      <AriaButton
        className={cx('ty-theme-palette-trigger', className)}
        data-compact={compact || undefined}
        aria-label={copy.trigger(name)}
        aria-keyshortcuts={shortcut ? 'Control+Shift+P Meta+Shift+P T' : undefined}
        aria-haspopup="dialog"
        onPress={() => setOpen(true)}
      >
        <ThemeSwatch theme={th.theme} mode={th.resolvedMode} />
        {compact ? <Palette className="ty-icon" aria-hidden="true" /> : <span className="ty-theme-palette-trigger__name">{name}</span>}
      </AriaButton>
      <ThemePalette {...rest} open={open} onOpenChange={setOpen} />
    </>
  )
}
