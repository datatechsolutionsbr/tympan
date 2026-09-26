import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../src/styles.css'
import './gallery.css'
import { FakhirProvider, ThemeProvider, ToastProvider } from '../../src'
import { GalleryLocaleContext, useGalleryLocaleState } from './locale'
import { Customizer } from './Customizer'
import { Gallery } from './Gallery'
import { ResearchShellDemo } from './ResearchShell'

const STORAGE_KEY = 'fk-gallery-theme'

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
    <FakhirProvider navigate={navigate} locale={locale.locale} pseudo={locale.pseudo}>
      <ThemeProvider storageKey={STORAGE_KEY}>
        <ToastProvider>
          {hash.startsWith('#/customizer') ? (
            <Customizer />
          ) : hash.startsWith('#/research-shell') ? (
            <ResearchShellDemo />
          ) : (
            <Gallery page={hash.match(/^#\/g\/([\w-]+)/)?.[1]} />
          )}
        </ToastProvider>
      </ThemeProvider>
    </FakhirProvider>
    </GalleryLocaleContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
