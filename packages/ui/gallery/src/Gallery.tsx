import { presets, printThemePresets } from '@datatechsolutions/tympan-tokens'
import { NativeSelect, SegmentedControl, Switch, ThemeScope, useTheme, type NativeSelectGroup, type ThemeDensity, type ThemeMode } from '../../src'
import { GALLERY_LOCALES, useGalleryLocale } from './locale'
import { GALLERY_PAGES } from './Groups'

/** Theme picker groups: the built-in presets, then the opt-in print themes (print-themes.css). */
export const THEME_GROUPS: NativeSelectGroup[] = [
  { label: 'Built-in', options: presets.map((p) => ({ value: p.name, label: p.label ?? p.name })) },
  { label: 'Print styles', options: printThemePresets.map((p) => ({ value: p.name, label: p.label ?? p.name })) },
]

export function GalleryToolbar({ extra }: { extra?: React.ReactNode }) {
  const t = useTheme()
  const l = useGalleryLocale()
  return (
    <header className="ty-gallery-toolbar">
      <strong className="ty-gallery-toolbar__brand">Tympan</strong>
      <nav className="ty-gallery-toolbar__nav" aria-label="Gallery">
        {GALLERY_PAGES.map((p) => (
          <a key={p.id} href={`#/g/${p.id}`}>
            {p.title}
          </a>
        ))}
        <a href="#/research-shell">Research shell</a>
        <a href="#/customizer">Theme customizer</a>
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

/** Every component side by side in light and dark for the selected theme. */
export function Gallery({ page = 'core' }: { page?: string }) {
  const t = useTheme()
  const current = GALLERY_PAGES.find((p) => p.id === page) ?? GALLERY_PAGES[0]!
  const Page = current.Component
  return (
    <div className="ty-gallery">
      <GalleryToolbar />
      <main className="ty-gallery-columns">
        <h1 className="ty-visually-hidden">Component gallery: {current.title}</h1>
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} theme={t.theme} mode={mode} density={t.density} className="ty-gallery-column" data-gallery-mode={mode}>
            <p className="ty-gallery-column__label">
              {t.theme} · {mode}
            </p>
            <Page scope={mode} />
          </ThemeScope>
        ))}
      </main>
    </div>
  )
}
