import { presets, printThemePresets } from '@datatechsolutions/tympan-tokens'
import { useEffect, useRef, useState } from 'react'
import { NativeSelect, SegmentedControl, Switch, useTheme, type NativeSelectGroup, type ThemeDensity, type ThemeMode } from '../../src'
import { GALLERY_LOCALES, useGalleryLocale } from './locale'
import { GALLERY_CATEGORIES, GALLERY_PAGES } from './Groups'
import { GalleryFrameContext, scrollToSpecimen } from './Section'

/** Theme picker groups: the built-in presets, then the opt-in print themes (print-themes.css). */
export const THEME_GROUPS: NativeSelectGroup[] = [
  { label: 'Built-in', options: presets.map((p) => ({ value: p.name, label: p.label ?? p.name })) },
  { label: 'Print styles', options: printThemePresets.map((p) => ({ value: p.name, label: p.label ?? p.name })) },
]

/** Sibling galleries of the other workspace packages (their dev ports). */
const SIBLING_GALLERIES = [
  { label: 'Flow gallery', href: 'http://localhost:3320' },
  { label: 'Print gallery', href: 'http://localhost:3330' },
]

export function GalleryToolbar({ extra, current }: { extra?: React.ReactNode; current?: 'components' | 'research-shell' | 'customizer' }) {
  const t = useTheme()
  const l = useGalleryLocale()
  const links = [
    { id: 'components', label: 'Components', href: '#/g/core' },
    { id: 'research-shell', label: 'Research shell', href: '#/research-shell' },
    { id: 'customizer', label: 'Theme customizer', href: '#/customizer' },
  ]
  // The toolbar wraps on narrow screens; the sticky sidebars sit under it.
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
      <a className="ty-gallery-toolbar__brand" href="#/g/core">
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
        {extra ?? <NativeSelect label="Theme" groups={THEME_GROUPS} value={t.theme} onChange={t.setTheme} />}
        <SegmentedControl label="Mode" size="compact" options={['system', 'light', 'dark']} value={t.mode} onChange={(m) => t.setMode(m as ThemeMode)} />
        <NativeSelect
          label="Language"
          options={GALLERY_LOCALES.map((x) => ({ value: x.tag, label: x.name }))}
          value={l.locale}
          onChange={l.setLocale}
        />
        <Switch isSelected={l.pseudo} onChange={l.setPseudo} label="Pseudo-localization" />
        <SegmentedControl label="Density" size="compact" options={['compact', 'default', 'comfortable']} value={t.density} onChange={(d) => t.setDensity(d as ThemeDensity)} />
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
