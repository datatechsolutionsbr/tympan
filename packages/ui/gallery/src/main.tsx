import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../src/styles.css'
import './gallery.css'
import { FakhirProvider, ThemeProvider, ToastProvider } from '../../src'
import { Customizer } from './Customizer'
import { Gallery } from './Gallery'

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
  return (
    <FakhirProvider navigate={navigate}>
      <ThemeProvider storageKey={STORAGE_KEY}>
        <ToastProvider>{hash.startsWith('#/customizer') ? <Customizer /> : <Gallery />}</ToastProvider>
      </ThemeProvider>
    </FakhirProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
