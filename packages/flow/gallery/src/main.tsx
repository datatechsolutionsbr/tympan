import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
// The design system's stylesheet from source (its package export points at dist/).
import '../../../ui/src/styles.css'
import '../../src/styles.css'
import './gallery.css'
import './shell/shell.css'
import { FakhirProvider, SegmentedControl, ThemeProvider, ToastProvider, useTheme, type ThemeMode } from '@fakhir/ui'
import { ComponentsPage } from './pages/ComponentsPage'
import { FlowEditorPage } from './pages/FlowEditorPage'
import { ProvenancePage } from './pages/ProvenancePage'

const STORAGE_KEY = 'fk-flow-gallery-theme'

// Storyboard pages render full screen inside the research shell; the
// components page keeps the gallery bar.
const PAGES = [
  { hash: '#/provenance', label: 'Provenance graph', shell: true, render: () => <ProvenancePage /> },
  { hash: '#/editor', label: 'Analysis workflow (DAG)', shell: true, render: () => <FlowEditorPage /> },
  { hash: '#/components', label: 'Components', shell: false, render: () => <ComponentsPage /> },
]

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash || '#/provenance')
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/provenance')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

function Shell() {
  const hash = useHash()
  const theme = useTheme()
  const page = PAGES.find((p) => hash.startsWith(p.hash)) ?? PAGES[0]!
  if (page.shell) return page.render()
  return (
    <div className="fk-gallery">
      <header className="fk-gallery__bar">
        <strong className="fk-gallery__brand">Fakhir flow canvas</strong>
        <nav className="fk-gallery__nav" aria-label="Gallery pages">
          {PAGES.map((p) => (
            <a key={p.hash} href={p.hash} aria-current={p === page ? 'page' : undefined}>
              {p.label}
            </a>
          ))}
        </nav>
        <SegmentedControl label="Mode" size="compact" options={['system', 'light', 'dark']} value={theme.mode} onChange={(m) => theme.setMode(m as ThemeMode)} />
      </header>
      <main className="fk-gallery__main" id="main">
        {page.render()}
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FakhirProvider>
      <ThemeProvider storageKey={STORAGE_KEY}>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </ThemeProvider>
    </FakhirProvider>
  </StrictMode>,
)
