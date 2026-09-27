// Flow canvas pages of the gallery (#/flow/...), from the /flow subpath
// sources. Storyboard pages render full screen inside the research shell; the
// components page keeps a gallery bar. The providers come from main.tsx.
import '../../../src/flow/styles.css'
import './flow-gallery.css'
import './shell/shell.css'
import { SegmentedControl, useTheme, type ThemeMode } from '../../../src'
import { ComponentsPage } from './pages/ComponentsPage'
import { FlowEditorPage } from './pages/FlowEditorPage'
import { ProvenancePage } from './pages/ProvenancePage'

export const FLOW_PAGES = [
  { hash: '#/flow/provenance', label: 'Provenance graph', shell: true, render: () => <ProvenancePage /> },
  { hash: '#/flow/editor', label: 'Analysis workflow (DAG)', shell: true, render: () => <FlowEditorPage /> },
  { hash: '#/flow/components', label: 'Components', shell: false, render: () => <ComponentsPage /> },
]

export function FlowGallery({ hash }: { hash: string }) {
  const theme = useTheme()
  const page = FLOW_PAGES.find((p) => hash.startsWith(p.hash)) ?? FLOW_PAGES[0]!
  if (page.shell) return page.render()
  return (
    <div className="ty-flow-gallery">
      <header className="ty-flow-gallery__bar">
        <strong className="ty-flow-gallery__brand">Tympan flow canvas</strong>
        <nav className="ty-flow-gallery__nav" aria-label="Flow gallery pages">
          <a href="#/">Component gallery</a>
          {FLOW_PAGES.map((p) => (
            <a key={p.hash} href={p.hash} aria-current={p === page ? 'page' : undefined}>
              {p.label}
            </a>
          ))}
        </nav>
        <SegmentedControl label="Mode" size="compact" options={['system', 'light', 'dark']} value={theme.mode} onChange={(m) => theme.setMode(m as ThemeMode)} />
      </header>
      <main className="ty-flow-gallery__main" id="main">
        {page.render()}
      </main>
    </div>
  )
}
