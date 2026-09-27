import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@datatechsolutions/tympan/styles.css'
// Opt-in UI themes derived from the book styles (data-ty-theme="print-<style>").
import '@datatechsolutions/tympan-tokens/print-themes.css'
// The print components' CSS once; each spread adds only its style's custom properties.
import '@datatechsolutions/tympan-print/styles.css'
import './site.css'
import { printThemeFontUrls } from './tokens'
import { ThemeProvider, ToastProvider, TympanProvider } from '@datatechsolutions/tympan'
import { App } from './App'
import { carregarCatalogo, I18nProvider, localeInicial, useI18n } from './i18n/I18n'
import { mensagensTympan } from './i18n/tympan'

/** localStorage key of the site's theme, mode and density (read before first paint by vite.config.ts). */
const SITE_THEME_KEY = 'ty-site-tema'

function ComTympan() {
  const i = useI18n()
  return (
    <TympanProvider locale={i.locale} icuMessages={mensagensTympan(i.catalogo)} navigate={(h) => (location.hash = h.replace(/^#/, ''))}>
      <ThemeProvider storageKey={SITE_THEME_KEY} fonts={printThemeFontUrls}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </TympanProvider>
  )
}

const locale = localeInicial()
void carregarCatalogo(locale).then((catalogo) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider inicial={locale} catalogoInicial={catalogo}>
        <ComTympan />
      </I18nProvider>
    </StrictMode>,
  )
})
