// Research shell demo: the overview storyboard on the rail + glass sheet +
// bottom dock shell (no top bar). Copy in Brazilian Portuguese, the
// platform's first language (the library copy follows the gallery's language
// switch). No invented research data: record, source and page counts and the
// edition date are the census's known values; everything else is labelled
// example data with neutral names (Caso A, B, C) and round numbers.
import {
  BookMarked,
  BookOpen,
  ChartColumn,
  CheckSquare,
  ClipboardList,
  FileStack,
  FlaskConical,
  Home,
  Map,
  Network,
  Plus,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import {
  ActivityFeed,
  BrandMark,
  AppFrame,
  AttentionList,
  Button,
  EvidencePanel,
  FakhirProvider,
  FloatingActionBar,
  PageHeader,
  PhaseBar,
  ProfileAvatar,
  RailContextButton,
  RailNavItem,
  RailNavSection,
  SectionHeading,
  StageStrip,
  StatStrip,
  Tag,
  ThemeSwitcher,
  useTheme,
  type ActionBarItem,
  type ActivityEntry,
  type AttentionItem,
  type PhaseSegment,
  type Stage,
  type StatStripItem,
} from '../../src'
import { useGalleryLocale } from './locale'

const base = '#/research-shell'
const go = (section: string) => `${base}/${section}`

const stats: StatStripItem[] = [
  { id: 'records', value: 582, label: 'registros', href: go('base'), detail: 'edição 2026-09-20' },
  { id: 'sources', value: 774, label: 'fontes', href: go('fontes') },
  { id: 'pages', value: 456, label: 'páginas lidas', href: go('fontes') },
]

const stages: Stage[] = [
  { id: 'busca', label: 'Busca', href: go('fontes'), status: 'done', figures: ['774 fontes'] },
  { id: 'organizar', label: 'Organizar', href: go('base'), status: 'current', figures: ['582 registros'] },
  { id: 'analisar', label: 'Analisar', href: go('analises'), status: 'attention', figures: ['exemplo'] },
  { id: 'publicar', label: 'Publicar', href: go('edicoes'), status: 'upcoming', figures: ['edição 2026-09-20'] },
  { id: 'manuscrito', label: 'Manuscrito', href: go('manuscrito'), status: 'upcoming' },
]

/** Example shares (round numbers, not census results). */
const phases: PhaseSegment[] = [
  { id: 'proved', label: 'provadas', value: 60, tone: 'proved' },
  { id: 'pending', label: 'pendentes', value: 30, tone: 'pending' },
  { id: 'refuted', label: 'refutadas', value: 5, tone: 'refuted' },
  { id: 'nd', label: 'não informadas', value: 5, tone: 'not_disclosed' },
]

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000)

const activity: ActivityEntry[] = [
  { id: 'a1', actor: { kind: 'person', name: 'Natalia Mesquita' }, text: 'verificou um valor do Caso A', at: minutesAgo(6), meta: 'exemplo' },
  { id: 'a2', actor: { kind: 'agent', name: 'agente-exemplo' }, text: 'executou uma análise de exemplo', at: minutesAgo(180), meta: 'regra de exemplo' },
  { id: 'a3', actor: { kind: 'system', name: 'freeze' }, text: 'congelou a edição 2026-09-20', at: minutesAgo(6 * 1440) },
]

function Navigation() {
  const item = (label: string, icon: typeof Home, section: string, extra: { current?: boolean; count?: number } = {}) => (
    <RailNavItem label={label} icon={icon} href={go(section)} {...extra} />
  )
  return (
    <>
      <RailNavSection>{item('Visão geral', Home, 'visao-geral', { current: true })}</RailNavSection>
      <RailNavSection label="Coletar">
        {item('Fontes e trilha', BookOpen, 'fontes')}
        {item('Instrumentos', ClipboardList, 'instrumentos')}
        {item('Verificação', CheckSquare, 'verificacao', { count: 3 })}
      </RailNavSection>
      <RailNavSection label="Organizar">
        {item('Base', FileStack, 'base')}
        {item('Atlas', Map, 'atlas')}
      </RailNavSection>
      <RailNavSection label="Analisar">{item('Análises', ChartColumn, 'analises')}</RailNavSection>
      <RailNavSection label="Publicar">
        {item('Edições', FlaskConical, 'edicoes')}
        {item('Bibliografia', BookMarked, 'bibliografia')}
      </RailNavSection>
      <RailNavSection label="Provar">{item('Proveniência', Network, 'proveniencia')}</RailNavSection>
      <RailNavSection label="Equipe">{item('Membros e agentes', Users, 'equipe')}</RailNavSection>
    </>
  )
}

function Account() {
  const theme = useTheme()
  return (
    <div className="fk-demo-account">
      <div className="fk-demo-account__who">
        <ProfileAvatar name="Natalia Mesquita" size="sm" decorative />
        <span className="fk-demo-account__name">
          <strong>Natalia Mesquita</strong>
          <span>Owner</span>
        </span>
      </div>
      <ThemeSwitcher mode={theme.resolvedMode} onModeChange={theme.setMode} variant="compact" />
    </div>
  )
}

export function ResearchShellDemo() {
  const gallery = useGalleryLocale()
  const [navOpen, setNavOpen] = useState(false)
  const [evidence, setEvidence] = useState<AttentionItem | null>(null)

  const attention: AttentionItem[] = [
    { id: 'a', proof: 'pending', title: 'Caso A', detail: 'Valor de exemplo sem fonte aberta' },
    { id: 'b', proof: 'refuted', title: 'Caso B', detail: 'Valor de exemplo refutado pela segunda codificação' },
    { id: 'c', proof: 'not_disclosed', title: 'Caso C', detail: 'Campo de exemplo não informado pelo órgão' },
    { id: 'd', proof: 'none', title: 'Análise de exemplo', detail: 'Execução de exemplo com falha', action: { label: 'Ver execução', href: go('analises') } },
  ].map((row, index) =>
    row.action ? row : { ...row, action: { label: ['Verificar', 'Revisar', 'Abrir'][index] ?? 'Abrir', onPress: () => setEvidence(row as AttentionItem) } },
  ) as AttentionItem[]

  const dockDestinations: ActionBarItem[] = [
    { id: 'overview', label: 'Visão geral', icon: Home, href: go('visao-geral'), active: true },
    { id: 'base', label: 'Base', icon: FileStack, href: go('base') },
    { id: 'verify', label: 'Verificação', icon: CheckSquare, href: go('verificacao'), count: 3 },
    { id: 'graph', label: 'Proveniência', icon: Network, href: go('proveniencia') },
  ]
  const dockContextual: ActionBarItem[] = [
    { id: 'search', label: 'Buscar', icon: Search, shortcut: 'Meta+K', onPress: () => undefined },
    {
      id: 'new',
      label: 'Nova sessão',
      icon: Plus,
      onPress: () => undefined,
      menu: [
        { id: 'session', label: 'Nova sessão de busca' },
        { id: 'instrument', label: 'Novo instrumento' },
      ],
    },
    { id: 'settings', label: 'Configurações do projeto', icon: Settings, onPress: () => undefined },
  ]

  return (
    <FakhirProvider locale={gallery.locale} pseudo={gallery.pseudo} navigate={(href) => (window.location.hash = href.replace(/^#/, ''))}>
      <AppFrame
        layout="rail"
        ambient
        width="reading"
        navOpen={navOpen}
        onNavOpenChange={setNavOpen}
        brand={<BrandMark size="small" />}
        context={<RailContextButton scope="EACH/USP" name="Censo de assistentes de IA governamentais" />}
        navigation={<Navigation />}
        account={<Account />}
        dock={<FloatingActionBar anchor="container" edge="bottom" narrowVariant="tabbar" destinations={dockDestinations} contextual={dockContextual} />}
        aside={
          evidence ? (
            <EvidencePanel
              title={evidence.title}
              subtitle={evidence.detail}
              open
              onOpenChange={(open) => !open && setEvidence(null)}
              proof={{ state: evidence.proof === 'none' ? null : evidence.proof, provedBy: 'Avaliadora de exemplo', rule: 'regra de exemplo' }}
              footer={<Button variant="primary">Salvar e seguir</Button>}
            >
              <p className="fk-demo-quote" dir="auto">“Trecho citado de exemplo.”</p>
              <p className="fk-demo-meta">fonte de exemplo</p>
            </EvidencePanel>
          ) : null
        }
      >
        <PageHeader
          variant="editorial"
          title="Visão geral"
          trail={[{ label: 'EACH/USP', href: go('org') }, { label: 'Censo IA gov', href: go('visao-geral') }, { label: 'Visão geral' }]}
          lead="Registro mundial de assistentes e agentes de IA de governos, com evidência citada por propriedade."
          actions={
            <>
              <Tag tone="neutral" icon={<FlaskConical aria-hidden="true" />}>Dados de exemplo</Tag>
              <Button variant="primary" href={go('verificacao')}>
                Verificar 3
              </Button>
            </>
          }
        />
        <div className="fk-demo-stack">
          <StatStrip label="Estado da pesquisa" items={stats} />
          <section aria-labelledby="demo-stages" className="fk-demo-section">
            <SectionHeading id="demo-stages" title="Da busca ao manuscrito" level={2} />
            <StageStrip label="Etapas da pesquisa" stages={stages} />
          </section>
          <div className="fk-demo-columns">
            <section aria-labelledby="demo-attention" className="fk-demo-section">
              <SectionHeading id="demo-attention" title="O que precisa de você" level={2} />
              <AttentionList label="Pendências" items={attention} maxRows={4} seeAllHref={go('verificacao')} />
            </section>
            <section aria-labelledby="demo-proof" className="fk-demo-section">
              <SectionHeading id="demo-proof" title="Estado da prova" level={2} subtitle="Proporções de exemplo" />
              <PhaseBar label="Estado da prova" segments={phases} caption="Frase-achado de exemplo: na plataforma ela vem da execução que a produziu." />
            </section>
          </div>
          <section aria-labelledby="demo-activity" className="fk-demo-section">
            <SectionHeading id="demo-activity" title="Atividade recente" level={2} />
            <ActivityFeed label="Atividade recente" entries={activity} moreHref={go('trilha')} moreLabel="Ver trilha" />
          </section>
        </div>
      </AppFrame>
    </FakhirProvider>
  )
}
