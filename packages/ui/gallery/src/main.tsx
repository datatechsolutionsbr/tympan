import { lazy, StrictMode, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../src/styles.css'
// Opt-in print themes (data-ty-theme="print-<style>"), loaded after the token sheet.
import '@datatechsolutions/tympan-tokens/print-themes.css'
import './gallery.css'
import { printThemeFontUrls } from '@datatechsolutions/tympan-tokens'
import { TympanProvider, ThemeProvider, ToastProvider } from '../../src'
import { GalleryLocaleContext, useGalleryLocaleState } from './locale'
import { Customizer } from './Customizer'
import { Gallery } from './Gallery'
import { ResearchShellDemo } from './ResearchShell'

const STORAGE_KEY = 'ty-gallery-theme'

// The flow canvas pages (the /flow subpath) load on first visit to #/flow/...
const FlowGallery = lazy(() => import('./flow/FlowGallery').then((m) => ({ default: m.FlowGallery })))

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

function App() {
  const hash = useHashRoute()
  const navigate = (href: string) => {
    window.location.hash = href.replace(/^#/, '')
  }
  const locale = useGalleryLocaleState()
  return (
    <GalleryLocaleContext.Provider value={locale}>
    <TympanProvider navigate={navigate} locale={locale.locale} pseudo={locale.pseudo}>
      <ThemeProvider storageKey={STORAGE_KEY} fonts={printThemeFontUrls}>
        <ToastProvider>
          {hash.startsWith('#/customizer') ? (
            <Customizer />
          ) : hash.startsWith('#/research-shell') ? (
            <ResearchShellDemo />
          ) : hash.startsWith('#/flow') ? (
            <Suspense fallback={null}>
              <FlowGallery hash={hash} />
            </Suspense>
          ) : (
            <Gallery page={hash.match(/^#\/g\/([\w-]+)/)?.[1]} />
          )}
        </ToastProvider>
      </ThemeProvider>
    </TympanProvider>
    </GalleryLocaleContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
