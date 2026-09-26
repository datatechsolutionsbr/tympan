// Gallery stand-in for the research shell: navigation rail, a sheet with the
// page header, and a dock floating over the sheet. Pages render inside it at
// 1440×960 so they can be compared with the storyboards. Not shipped.

import type { ReactNode } from 'react'
import { BookOpen, ChartColumn, ChevronsUpDown, Database, FileText, Home, Inbox, Link2, Lock, Settings, Users } from 'lucide-react'
import { useTheme } from '@fakhir/design-system'

export type ShellArea = 'overview' | 'base' | 'sources' | 'provenance' | 'instruments' | 'assignments' | 'analyses' | 'editions' | 'bibliography' | 'people'

type Words = Record<string, string>

const WORDS: Record<string, Words> = {
  'pt-BR': {
    rail: 'Pesquisa', org: 'EACH/USP', study: 'Censo de assistentes de IA governamentais', switchStudy: 'Trocar de pesquisa',
    research: 'Pesquisa', evidence: 'Evidência', collection: 'Coleta', results: 'Resultados', team: 'Equipe',
    overview: 'Visão geral', base: 'Base', sources: 'Fontes e trilha', provenance: 'Proveniência', instruments: 'Instrumentos', assignments: 'Atribuições',
    analyses: 'Análises', editions: 'Edições', bibliography: 'Bibliografia', people: 'Pessoas e agentes',
    user: 'Autora', role: 'owner · admin', account: 'Conta e segurança (alterna o tema)',
  },
  en: {
    rail: 'Research', org: 'EACH/USP', study: 'Census of government AI assistants', switchStudy: 'Switch research',
    research: 'Research', evidence: 'Evidence', collection: 'Collection', results: 'Results', team: 'Team',
    overview: 'Overview', base: 'Base', sources: 'Sources and trail', provenance: 'Provenance', instruments: 'Instruments', assignments: 'Assignments',
    analyses: 'Analyses', editions: 'Editions', bibliography: 'Bibliography', people: 'People and agents',
    user: 'Author', role: 'owner · admin', account: 'Account and security (switches the theme)',
  },
}

const GROUPS: Array<[string, Array<[ShellArea, typeof Home, string?]>]> = [
  ['research', [['overview', Home]]],
  ['evidence', [['base', Database], ['sources', Link2], ['provenance', ProvenanceGlyph as unknown as typeof Home, '#/provenance']]],
  ['collection', [['instruments', FileText], ['assignments', Inbox]]],
  ['results', [['analyses', ChartColumn, '#/editor'], ['editions', Lock], ['bibliography', BookOpen]]],
  ['team', [['people', Users]]],
]

/** Three linked nodes: the product mark and the provenance entry. */
export function ProvenanceGlyph(props: { className?: string }) {
  return (
    <svg className={props.className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M7 6h10M6 8l5 8M18 8l-5 8" />
    </svg>
  )
}

export interface ResearchShellProps {
  locale: string
  area: ShellArea
  crumbs: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  /** Header row under the title line (query bar, view switch). */
  subheader?: ReactNode
  /** Floating dock over the sheet (the canvas tools, or the app dock). */
  dock?: ReactNode
  /** Receives the dock element, for tools a child portals in (the canvas dock). */
  dockSlot?: (el: HTMLDivElement | null) => void
  children: ReactNode
}

export function ResearchShell(p: ResearchShellProps) {
  const w = WORDS[p.locale] ?? WORDS.en!
  const theme = useTheme()
  return (
    <div className="fk-shell">
      <nav className="fk-shell__rail" aria-label={w.rail}>
        <div className="fk-shell__brand">
          <span className="fk-shell__mark" aria-hidden="true">
            <ProvenanceGlyph />
          </span>
          <span className="fk-shell__name">Fakhir</span>
        </div>
        <button type="button" className="fk-shell__study" aria-label={`${w.switchStudy}: ${w.study}`}>
          <span className="fk-shell__study-text">
            <span className="fk-shell__org">{w.org}</span>
            <span className="fk-shell__study-name">{w.study}</span>
          </span>
          <ChevronsUpDown aria-hidden="true" />
        </button>
        {GROUPS.map(([group, links]) => (
          <div key={group} className="fk-shell__group">
            <div className="fk-shell__group-title">{w[group]}</div>
            {links.map(([area, Icon, href]) => (
              <a key={area} className="fk-shell__link" href={href ?? '#'} aria-current={area === p.area ? 'page' : undefined}>
                <Icon className="fk-shell__icon" aria-hidden="true" />
                <span>{w[area]}</span>
              </a>
            ))}
          </div>
        ))}
        <div className="fk-shell__spacer" />
        <div className="fk-shell__user">
          <span className="fk-shell__avatar" aria-hidden="true">
            AD
          </span>
          <span className="fk-shell__who">
            <span className="fk-shell__user-name">{w.user}</span>
            <span className="fk-shell__user-role">{w.role}</span>
          </span>
          <button type="button" className="fk-shell__account" aria-label={w.account} onClick={() => theme.setMode(theme.resolvedMode === 'dark' ? 'light' : 'dark')}>
            <Settings aria-hidden="true" />
          </button>
        </div>
      </nav>
      <main className="fk-shell__sheet" id="main">
        <header className="fk-shell__head">
          <div className="fk-shell__titles">
            <div className="fk-shell__crumbs">{p.crumbs}</div>
            <h1 className="fk-shell__title">{p.title}</h1>
            {p.description ? <p className="fk-shell__description">{p.description}</p> : null}
          </div>
          {p.actions ? <div className="fk-shell__actions">{p.actions}</div> : null}
        </header>
        {p.subheader ? <div className="fk-shell__subhead">{p.subheader}</div> : null}
        <div className="fk-shell__body">{p.children}</div>
        {p.dock || p.dockSlot ? (
          <div className="fk-shell__dock" ref={p.dockSlot}>
            {p.dock}
          </div>
        ) : null}
      </main>
    </div>
  )
}
