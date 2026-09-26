import { NativeSelect, SegmentedControl, ThemeScope, useTheme, type ThemeDensity, type ThemeMode } from '../../src'
import { Showcase } from './Showcase'

export const PRESET_NAMES = ['fakhir', 'neutral', 'high-contrast']

export function GalleryToolbar({ extra }: { extra?: React.ReactNode }) {
  const t = useTheme()
  return (
    <header className="fk-gallery-toolbar">
      <strong className="fk-gallery-toolbar__brand">Fakhir design system</strong>
      <nav className="fk-gallery-toolbar__nav" aria-label="Gallery">
        <a href="#/">Components</a>
        <a href="#/customizer">Theme customizer</a>
      </nav>
      <div className="fk-gallery-toolbar__controls">
        {extra ?? <NativeSelect label="Theme" options={PRESET_NAMES} value={t.theme} onChange={t.setTheme} />}
        <SegmentedControl label="Mode" size="compact" options={['system', 'light', 'dark']} value={t.mode} onChange={(m) => t.setMode(m as ThemeMode)} />
        <SegmentedControl label="Density" size="compact" options={['compact', 'default', 'comfortable']} value={t.density} onChange={(d) => t.setDensity(d as ThemeDensity)} />
      </div>
    </header>
  )
}

/** Every component side by side in light and dark for the selected theme. */
export function Gallery() {
  const t = useTheme()
  return (
    <div className="fk-gallery">
      <GalleryToolbar />
      <main className="fk-gallery-columns">
        <h1 className="fk-visually-hidden">Component gallery</h1>
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} theme={t.theme} mode={mode} density={t.density} className="fk-gallery-column" data-gallery-mode={mode}>
            <p className="fk-gallery-column__label">
              {t.theme} · {mode}
            </p>
            <Showcase scope={mode} />
          </ThemeScope>
        ))}
      </main>
    </div>
  )
}
