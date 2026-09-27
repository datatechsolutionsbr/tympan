import { presets, printThemePresets, resolveTheme, type ThemeConfig } from '@datatechsolutions/tympan-tokens'
import { ChevronDown, Languages, Monitor, Moon, SlidersHorizontal, Sun } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { Popover, SegmentedControl, Switch, useTheme, type NativeSelectGroup, type ThemeDensity, type ThemeMode } from '../../src'
import { GALLERY_LOCALES, directionOf, useGalleryLocale } from './locale'
import { GALLERY_CATEGORIES, GALLERY_PAGES } from './Groups'
import { GalleryFrameContext, scrollToSpecimen } from './Section'

/** Theme picker groups: the built-in presets, then the opt-in print themes (print-themes.css). */
export const THEME_GROUPS: NativeSelectGroup[] = [
  { label: 'Built-in', options: presets.map((p) => ({ value: p.name, label: p.label ?? p.name })) },
  { label: 'Print styles', options: printThemePresets.map((p) => ({ value: p.name, label: p.label ?? p.name })) },
]

/** Sibling galleries of the other workspace packages (their dev ports). */
const SIBLING_GALLERIES = [
  { label: 'Print gallery', href: import.meta.env.DEV ? 'http://localhost:3330' : '../print/index.html' },
]

interface ThemeSwatch {
  name: string
  label: string
  bg: string
  ink: string
  brand: string
}

/** Paper, ink and accent of every theme in light mode, for the picker swatches. */
function useThemeSwatches(): { builtIn: ThemeSwatch[]; print: ThemeSwatch[] } {
  return useMemo(() => {
    const swatch = (p: ThemeConfig): ThemeSwatch => {
      const r = resolveTheme(p, 'light') as unknown as Record<string, string>
      return { name: p.name, label: p.label ?? p.name, bg: String(r.bg), ink: String(r.ink), brand: String(r.brand) }
    }
    return { builtIn: presets.map(swatch), print: printThemePresets.map(swatch) }
  }, [])
}

function Swatch({ s }: { s: ThemeSwatch }) {
  return (
    <span className="ty-gallery-swatch" aria-hidden="true" style={{ background: s.bg, borderColor: s.ink }}>
      <span style={{ background: s.brand }} />
    </span>
  )
}

function ThemePicker() {
  const t = useTheme()
  const { builtIn, print } = useThemeSwatches()
  const [query, setQuery] = useState('')
  const all = [...builtIn, ...print]
  const active = all.find((s) => s.name === t.theme) ?? builtIn[0]!
  const q = query.trim().toLocaleLowerCase()
  const match = (s: ThemeSwatch) => !q || s.label.toLocaleLowerCase().includes(q) || s.name.includes(q)
  const group = (title: string, items: ThemeSwatch[]) => {
    const shown = items.filter(match)
    if (!shown.length) return null
    return (
      <div className="ty-gallery-themes__group" role="group" aria-label={title}>
        <p className="ty-gallery-themes__title">
          {title} <span>{shown.length}</span>
        </p>
        <div className="ty-gallery-themes__grid">
          {shown.map((s) => (
            <AriaButton key={s.name} className="ty-gallery-themes__item" aria-pressed={s.name === t.theme} onPress={() => t.setTheme(s.name)}>
              <Swatch s={s} />
              <span>{s.label}</span>
            </AriaButton>
          ))}
        </div>
      </div>
    )
  }
  return (
    <Popover
      title="Theme"
      placement="bottom"
      align="end"
      showArrow={false}
      className="ty-gallery-popover ty-gallery-popover--wide"
      trigger={
        <AriaButton className="ty-gallery-bar-button" aria-label={`Theme: ${active.label}`}>
          <Swatch s={active} />
          <span className="ty-gallery-bar-button__text">{active.label}</span>
          <ChevronDown aria-hidden="true" size={14} />
        </AriaButton>
      }
    >
      <input className="ty-gallery-themes__search" type="search" placeholder="Filter themes" aria-label="Filter themes" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="ty-gallery-themes">
        {group('Built-in', builtIn)}
        {group('Print styles', print)}
      </div>
    </Popover>
  )
}

const MODES: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: 'system', label: 'System', Icon: Monitor },
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
]

function ModeSwitch() {
  const t = useTheme()
  return (
    <div className="ty-gallery-modes" role="group" aria-label="Color mode">
      {MODES.map(({ id, label, Icon }) => (
        <AriaButton key={id} className="ty-gallery-modes__item" aria-pressed={t.mode === id} aria-label={label} onPress={() => t.setMode(id)}>
          <Icon aria-hidden="true" size={15} />
        </AriaButton>
      ))}
    </div>
  )
}

function LanguagePicker() {
  const l = useGalleryLocale()
  const active = GALLERY_LOCALES.find((x) => x.tag === l.locale) ?? GALLERY_LOCALES[0]!
  return (
    <Popover
      title="Language"
      placement="bottom"
      align="end"
      showArrow={false}
      className="ty-gallery-popover"
      trigger={
        <AriaButton className="ty-gallery-bar-button" aria-label={`Language: ${active.name}`}>
          <Languages aria-hidden="true" size={15} />
          <span className="ty-gallery-bar-button__text ty-gallery-bar-button__code">{active.tag}</span>
        </AriaButton>
      }
    >
      <ul className="ty-gallery-langs">
        {GALLERY_LOCALES.map((x) => (
          <li key={x.tag}>
            <AriaButton className="ty-gallery-langs__item" aria-pressed={x.tag === l.locale} onPress={() => l.setLocale(x.tag)}>
              <span lang={x.tag} dir={directionOf(x.tag)}>
                {x.name}
              </span>
              <code>{x.tag}</code>
            </AriaButton>
          </li>
        ))}
      </ul>
      <div className="ty-gallery-popover__footer">
        <Switch isSelected={l.pseudo} onChange={l.setPseudo} label="Pseudo-localization" />
      </div>
    </Popover>
  )
}

function DisplayOptions() {
  const t = useTheme()
  return (
    <Popover
      title="Display"
      placement="bottom"
      align="end"
      showArrow={false}
      className="ty-gallery-popover"
      trigger={
        <AriaButton className="ty-gallery-bar-button ty-gallery-bar-button--icon" aria-label="Display options">
          <SlidersHorizontal aria-hidden="true" size={15} />
        </AriaButton>
      }
    >
      <SegmentedControl label="Density" size="compact" options={['compact', 'default', 'comfortable']} value={t.density} onChange={(d) => t.setDensity(d as ThemeDensity)} />
    </Popover>
  )
}

function BrandMark() {
  return (
    <svg className="ty-gallery-toolbar__mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="20" r="9" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="16" cy="22.5" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="2" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export function GalleryToolbar({ extra, current }: { extra?: React.ReactNode; current?: 'components' | 'research-shell' | 'flow' | 'customizer' }) {
  const links = [
    { id: 'components', label: 'Components', href: '#/g/core' },
    { id: 'research-shell', label: 'Research shell', href: '#/research-shell' },
    { id: 'flow', label: 'Flow canvas', href: '#/flow/provenance' },
    { id: 'customizer', label: 'Customizer', href: '#/customizer' },
  ]
  // The sticky sidebars sit under the toolbar.
  const header = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = header.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--ty-gallery-header', `${el.offsetHeight}px`)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <header className="ty-gallery-toolbar" ref={header}>
      <a className="ty-gallery-toolbar__brand" href={import.meta.env.DEV ? '#/g/core' : '../index.html'}>
        <BrandMark />
        Tympan
      </a>
      <nav className="ty-gallery-toolbar__nav" aria-label="Gallery">
        {links.map((link) => (
          <a key={link.id} href={link.href} aria-current={current === link.id ? 'page' : undefined}>
            {link.label}
          </a>
        ))}
        {SIBLING_GALLERIES.map((g) => (
          <a key={g.href} href={g.href} className="ty-gallery-toolbar__external">
            {g.label}
          </a>
        ))}
      </nav>
      <div className="ty-gallery-toolbar__controls">
        {extra ?? <ThemePicker />}
        <ModeSwitch />
        <LanguagePicker />
        <DisplayOptions />
      </div>
    </header>
  )
}

interface TocEntry {
  id: string
  title: string
}

/** The specimens the page rendered, read back from their card captions. */
function useSpecimens(page: string): TocEntry[] {
  const [entries, setEntries] = useState<TocEntry[]>([])
  useEffect(() => {
    const titles = document.querySelectorAll<HTMLElement>('.ty-gallery-page .ty-gallery-card__title')
    setEntries([...titles].map((h) => ({ id: h.id, title: h.textContent ?? '' })))
    window.scrollTo({ top: 0 })
  }, [page])
  return entries
}

/** Highlights the specimen nearest the top of the viewport. */
function useActiveSpecimen(entries: TocEntry[]): string | undefined {
  const [active, setActive] = useState<string>()
  useEffect(() => {
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records.filter((r) => r.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )
    for (const e of entries) {
      const el = document.getElementById(e.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [entries])
  return active
}

/**
 * The component gallery as a documentation site: category
 * sidebar, one card per component with Preview/Code, light/dark and width
 * switches, and an "On this page" list of the specimens.
 */
export function Gallery({ page = 'core' }: { page?: string }) {
  const t = useTheme()
  const current = GALLERY_PAGES.find((p) => p.id === page) ?? GALLERY_PAGES[0]!
  const Page = current.Component
  const entries = useSpecimens(current.id)
  const active = useActiveSpecimen(entries)
  const index = GALLERY_PAGES.indexOf(current)
  const previous = GALLERY_PAGES[index - 1]
  const next = GALLERY_PAGES[index + 1]

  return (
    <div className="ty-gallery">
      <GalleryToolbar current="components" />
      <div className="ty-gallery-docs">
        <nav className="ty-gallery-sidebar" aria-label="Component categories">
          {GALLERY_CATEGORIES.map((category) => (
            <div key={category} className="ty-gallery-sidebar__group">
              <h2 className="ty-gallery-sidebar__heading">{category}</h2>
              <ul className="ty-gallery-sidebar__list">
                {GALLERY_PAGES.filter((p) => p.category === category).map((p) => (
                  <li key={p.id}>
                    <a className="ty-gallery-sidebar__link" href={`#/g/${p.id}`} aria-current={p.id === current.id ? 'page' : undefined}>
                      {p.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <main className="ty-gallery-main">
          <header className="ty-gallery-page-header">
            <p className="ty-gallery-page-header__eyebrow">{current.category}</p>
            <h1 className="ty-gallery-page-header__title">{current.title}</h1>
            <p className="ty-gallery-page-header__lead">{current.description}</p>
            <p className="ty-gallery-page-header__meta">
              {entries.length} {entries.length === 1 ? 'example' : 'examples'} · theme {t.theme}
            </p>
          </header>
          <GalleryFrameContext.Provider value={{ theme: t.theme, mode: t.resolvedMode, density: t.density }}>
            <div className="ty-gallery-page" key={current.id}>
              <Page scope="main" />
            </div>
          </GalleryFrameContext.Provider>
          <nav className="ty-gallery-pager" aria-label="Previous and next page">
            {previous ? (
              <a className="ty-gallery-pager__link" href={`#/g/${previous.id}`}>
                <span className="ty-gallery-pager__hint">Previous</span>
                {previous.title}
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a className="ty-gallery-pager__link ty-gallery-pager__link--next" href={`#/g/${next.id}`}>
                <span className="ty-gallery-pager__hint">Next</span>
                {next.title}
              </a>
            )}
          </nav>
        </main>

        <nav className="ty-gallery-toc" aria-label="On this page">
          <h2 className="ty-gallery-sidebar__heading">On this page</h2>
          <ul className="ty-gallery-sidebar__list">
            {entries.map((e) => (
              <li key={e.id}>
                <a
                  className="ty-gallery-toc__link"
                  href={`#${e.id}`}
                  aria-current={active === e.id ? 'location' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    scrollToSpecimen(e.id)
                  }}
                >
                  {e.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
