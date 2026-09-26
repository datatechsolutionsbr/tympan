// The research shell of the gallery pages, built from @fakhir/ui:
// AppFrame (layout="rail": rail, glass sheet, dock), the editorial PageHeader
// and the FloatingActionBar as the dock. The canvas tools of a page become the
// dock's items (dockItemsFromCanvasTools); pages without a canvas get the app
// dock (search, assistant, notifications | theme, language). Pages render at
// 1440×960 so they can be compared with the storyboards. Not shipped.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Bell, BookOpen, Bot, ChartColumn, Database, FileText, Home, Inbox, Languages, Link2, Lock, Moon, Search, Settings, Sun, Users } from 'lucide-react'
import {
  AppFrame,
  BrandMark,
  Button,
  FloatingActionBar,
  PageHeader,
  ProfileAvatar,
  RailContextButton,
  RailNavItem,
  RailNavSection,
  useTheme,
  type ActionBarItem,
  type IconComponent,
} from '@fakhir/ui'
import type { CanvasToolItem } from '../../../src/toolbar/canvasTools'
import { dockItemsFromCanvasTools } from '../../../src/toolbar/dockItems'
import { nextLocale, setHashParam } from './params'

export type ShellArea = 'overview' | 'base' | 'sources' | 'provenance' | 'instruments' | 'assignments' | 'analyses' | 'editions' | 'bibliography' | 'people'

type Words = Record<string, string>

const WORDS: Record<string, Words> = {
  'pt-BR': {
    org: 'EACH/USP', study: 'Censo de assistentes de IA governamentais',
    research: 'Pesquisa', evidence: 'Evidência', collection: 'Coleta', results: 'Resultados', team: 'Equipe',
    overview: 'Visão geral', base: 'Base', sources: 'Fontes e trilha', provenance: 'Proveniência', instruments: 'Instrumentos', assignments: 'Atribuições',
    analyses: 'Análises', editions: 'Edições', bibliography: 'Bibliografia', people: 'Pessoas e agentes',
    user: 'Autora', role: 'owner · admin', account: 'Conta e segurança (alterna o tema)',
    dock: 'Atalhos', search: 'Buscar', assistant: 'Assistente', alerts: 'Notificações', theme: 'Tema escuro', language: 'Idioma',
  },
  en: {
    org: 'EACH/USP', study: 'Census of government AI assistants',
    research: 'Research', evidence: 'Evidence', collection: 'Collection', results: 'Results', team: 'Team',
    overview: 'Overview', base: 'Base', sources: 'Sources and trail', provenance: 'Provenance', instruments: 'Instruments', assignments: 'Assignments',
    analyses: 'Analyses', editions: 'Editions', bibliography: 'Bibliography', people: 'People and agents',
    user: 'Author', role: 'owner · admin', account: 'Account and security (switches the theme)',
    dock: 'Shortcuts', search: 'Search', assistant: 'Assistant', alerts: 'Notifications', theme: 'Dark theme', language: 'Language',
  },
}

/** Three linked nodes: the provenance entry. */
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

const GROUPS: Array<[string, Array<[ShellArea, IconComponent, string?]>]> = [
  ['research', [['overview', Home]]],
  ['evidence', [['base', Database], ['sources', Link2], ['provenance', ProvenanceGlyph as unknown as IconComponent, '#/provenance']]],
  ['collection', [['instruments', FileText], ['assignments', Inbox]]],
  ['results', [['analyses', ChartColumn, '#/editor'], ['editions', Lock], ['bibliography', BookOpen]]],
  ['team', [['people', Users]]],
]

/* ------------------------------------------------------------ dock tools -- */

/**
 * Lifts a viewer's canvas tools (its `renderTools` callback) to the shell's
 * dock. The list is republished only when its shape changes; presses go to
 * the viewer's latest handlers.
 */
export function useDockTools(): [CanvasToolItem[] | null, (items: CanvasToolItem[]) => ReactNode] {
  const [items, setItems] = useState<CanvasToolItem[] | null>(null)
  const latest = useRef<CanvasToolItem[]>([])
  const render = useCallback((next: CanvasToolItem[]) => <ToolsBridge items={next} latest={latest} publish={setItems} />, [])
  const proxied = useMemo(
    () => items?.map((item) => ({ ...item, onPress: () => latest.current.find((i) => i.id === item.id)?.onPress?.() })) ?? null,
    [items],
  )
  return [proxied, render]
}

function ToolsBridge({ items, latest, publish }: { items: CanvasToolItem[]; latest: { current: CanvasToolItem[] }; publish: (items: CanvasToolItem[] | null) => void }) {
  latest.current = items
  const shape = items.map((i) => `${i.id}:${i.label}:${i.pressed ? 1 : 0}:${i.disabled ? 1 : 0}:${i.text ?? ''}`).join('|')
  useLayoutEffect(() => publish(latest.current), [shape, publish, latest])
  useEffect(() => () => publish(null), [publish])
  return null
}

/* ----------------------------------------------------------------- shell -- */

export interface ResearchShellProps {
  locale: string
  area: ShellArea
  /** Trail levels joined by " / " (the last one is the current page). */
  crumbs: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  /** Row under the title line (query bar, view switch). */
  subheader?: ReactNode
  /** Canvas tools for the dock (from useDockTools); the app dock otherwise. */
  tools?: CanvasToolItem[] | null
  /** Name of the dock when it carries canvas tools. */
  toolsLabel?: string
  /** Compact header (graph view of the provenance storyboard). */
  compact?: boolean
  children: ReactNode
}

function Account({ w }: { w: Words }) {
  const theme = useTheme()
  return (
    <div className="fk-flow-account">
      <ProfileAvatar name={w.user!} size="sm" decorative />
      <span className="fk-flow-account__who">
        <span className="fk-flow-account__name">{w.user}</span>
        <span className="fk-flow-account__role">{w.role}</span>
      </span>
      <Button variant="quiet" iconOnly accessibleLabel={w.account!} leadingIcon={<Settings />} onPress={() => theme.setMode(theme.resolvedMode === 'dark' ? 'light' : 'dark')} />
    </div>
  )
}

function useAppDock(w: Words, locale: string): ActionBarItem[] {
  const theme = useTheme()
  const dark = theme.resolvedMode === 'dark'
  return [
    { id: 'search', label: w.search!, icon: Search, onPress: () => undefined, group: 'app' },
    { id: 'assistant', label: w.assistant!, icon: Bot, onPress: () => undefined, group: 'app' },
    { id: 'alerts', label: w.alerts!, icon: Bell, onPress: () => undefined, group: 'app' },
    { id: 'theme', label: w.theme!, icon: dark ? Sun : Moon, pressed: dark, onPress: () => theme.setMode(dark ? 'light' : 'dark'), group: 'prefs' },
    { id: 'language', label: `${w.language}: ${locale}`, icon: Languages, onPress: () => setHashParam('lang', nextLocale(locale)), group: 'prefs' },
  ]
}

export function ResearchShell(p: ResearchShellProps) {
  const w = WORDS[p.locale] ?? WORDS.en!
  const [navOpen, setNavOpen] = useState(false)
  const appDock = useAppDock(w, p.locale)
  const dockItems = p.tools ? dockItemsFromCanvasTools(p.tools) : appDock
  const trail = p.crumbs.split(' / ').map((label) => ({ label }))

  return (
    <AppFrame
      layout="rail"
      width="full"
      ambient
      className={p.compact ? 'fk-flow-frame fk-flow-frame--compact' : 'fk-flow-frame'}
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      brand={<BrandMark size="small" />}
      context={<RailContextButton scope={w.org!} name={w.study!} />}
      navigation={GROUPS.map(([group, links]) => (
        <RailNavSection key={group} label={w[group]}>
          {links.map(([area, icon, href]) => (
            <RailNavItem key={area} label={w[area]!} icon={icon} href={href ?? '#'} current={area === p.area} />
          ))}
        </RailNavSection>
      ))}
      account={<Account w={w} />}
      dock={<FloatingActionBar anchor="container" edge="bottom" destinations={[]} contextual={dockItems} label={p.tools ? p.toolsLabel : w.dock} focusShortcut={null} />}
    >
      <PageHeader variant="editorial" title={p.title} trail={trail} lead={p.description} actions={p.actions} className="fk-flow-frame__header">
        {p.subheader}
      </PageHeader>
      <div className="fk-flow-frame__body">{p.children}</div>
    </AppFrame>
  )
}
