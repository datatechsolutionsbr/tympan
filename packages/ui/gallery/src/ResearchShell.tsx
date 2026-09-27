// Research shell demo: the overview storyboard on the rail + glass sheet +
// bottom dock shell (no top bar). Copy in Brazilian Portuguese, the
// platform's first language (the library copy follows the gallery's language
// switch). All data is fictional: the Vila Aurora urban air-quality study of
// Laboratório Exemplo, with invented stations, readings and people, labelled
// "Dados de exemplo" on the page.
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
  TympanProvider,
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
  { id: 'records', value: 1460, label: 'leituras diárias', href: go('base'), detail: 'edição 2026-09 (dados fictícios)' },
  { id: 'sources', value: 5, label: 'estações', href: go('fontes') },
  { id: 'pages', value: 38, label: 'dias acima do limite', href: go('fontes') },
]

const stages: Stage[] = [
  { id: 'busca', label: 'Coleta', href: go('fontes'), status: 'done', figures: ['5 estações'] },
  { id: 'organizar', label: 'Organizar', href: go('base'), status: 'current', figures: ['1460 leituras'] },
  { id: 'analisar', label: 'Analisar', href: go('analises'), status: 'attention', figures: ['exemplo'] },
  { id: 'publicar', label: 'Publicar', href: go('edicoes'), status: 'upcoming', figures: ['edição 2026-09'] },
  { id: 'manuscrito', label: 'Manuscrito', href: go('manuscrito'), status: 'upcoming' },
]

/** Example shares (round, fictional numbers). */
const phases: PhaseSegment[] = [
  { id: 'proved', label: 'provadas', value: 60, tone: 'proved' },
  { id: 'pending', label: 'pendentes', value: 30, tone: 'pending' },
  { id: 'refuted', label: 'refutadas', value: 5, tone: 'refuted' },
  { id: 'nd', label: 'não informadas', value: 5, tone: 'not_disclosed' },
]

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000)

const activity: ActivityEntry[] = [
  { id: 'a1', actor: { kind: 'person', name: 'Marina Duarte' }, text: 'verificou a leitura da estação Centro', at: minutesAgo(6), meta: 'exemplo' },
  { id: 'a2', actor: { kind: 'agent', name: 'agente-limpeza' }, text: 'limpou as leituras de PM2.5 da estação Porto', at: minutesAgo(180), meta: 'regra limpeza@2' },
  { id: 'a3', actor: { kind: 'system', name: 'freeze' }, text: 'congelou a edição 2026-09', at: minutesAgo(6 * 1440) },
]

function Navigation() {
  const item = (label: string, icon: typeof Home, section: string, extra: { current?: boolean; count?: number } = {}) => (
    <RailNavItem label={label} icon={icon} href={go(section)} {...extra} />
  )
  return (
    <>
      <RailNavSection>{item('Visão geral', Home, 'visao-geral', { current: true })}</RailNavSection>
      <RailNavSection label="Coletar">
        {item('Estações e trilha', BookOpen, 'fontes')}
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
    <div className="ty-demo-account">
      <div className="ty-demo-account__who">
        <ProfileAvatar name="Marina Duarte" size="sm" decorative />
        <span className="ty-demo-account__name">
          <strong>Marina Duarte</strong>
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
    { id: 'a', proof: 'pending', title: 'Estação Centro', detail: 'Leitura de PM2.5 sem arquivo bruto aberto' },
    { id: 'b', proof: 'refuted', title: 'Estação Porto', detail: 'Pico de NO₂ refutado pela segunda leitura' },
    { id: 'c', proof: 'not_disclosed', title: 'Estação Parque', detail: 'Calibração não informada pelo operador' },
    { id: 'd', proof: 'none', title: 'Dias acima do limite', detail: 'Execução da agregação com falha', action: { label: 'Ver execução', href: go('analises') } },
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
        { id: 'session', label: 'Nova sessão de coleta' },
        { id: 'instrument', label: 'Novo instrumento' },
      ],
    },
    { id: 'settings', label: 'Configurações do projeto', icon: Settings, onPress: () => undefined },
  ]

  return (
    <TympanProvider locale={gallery.locale} pseudo={gallery.pseudo} navigate={(href) => (window.location.hash = href.replace(/^#/, ''))}>
      <AppFrame
        layout="rail"
        ambient
        width="reading"
        navOpen={navOpen}
        onNavOpenChange={setNavOpen}
        brand={<BrandMark size="small" />}
        context={<RailContextButton scope="Laboratório Exemplo" name="Estudo de qualidade do ar urbano de Vila Aurora" />}
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
              proof={{ state: evidence.proof === 'none' ? null : evidence.proof, provedBy: 'Rafael Lima', rule: 'leitura@2' }}
              footer={<Button variant="primary">Salvar e seguir</Button>}
            >
              <p className="ty-demo-quote" dir="auto">“PM2.5 médio diário de 38 µg/m³ em 14/07.”</p>
              <p className="ty-demo-meta">rede de monitoramento de Vila Aurora, edição 2026-09 (dados fictícios)</p>
            </EvidencePanel>
          ) : null
        }
      >
        <PageHeader
          variant="editorial"
          title="Visão geral"
          trail={[{ label: 'Laboratório Exemplo', href: go('org') }, { label: 'Ar de Vila Aurora', href: go('visao-geral') }, { label: 'Visão geral' }]}
          lead="Qualidade do ar em cinco estações de Vila Aurora, com a leitura de origem citada em cada número."
          actions={
            <>
              <Tag tone="neutral" icon={<FlaskConical aria-hidden="true" />}>Dados de exemplo</Tag>
              <Button variant="primary" href={go('verificacao')}>
                Verificar 3
              </Button>
            </>
          }
        />
        <div className="ty-demo-stack">
          <StatStrip label="Estado da pesquisa" items={stats} />
          <section aria-labelledby="demo-stages" className="ty-demo-section">
            <SectionHeading id="demo-stages" title="Da coleta ao manuscrito" level={2} />
            <StageStrip label="Etapas da pesquisa" stages={stages} />
          </section>
          <div className="ty-demo-columns">
            <section aria-labelledby="demo-attention" className="ty-demo-section">
              <SectionHeading id="demo-attention" title="O que precisa de você" level={2} />
              <AttentionList label="Pendências" items={attention} maxRows={4} seeAllHref={go('verificacao')} />
            </section>
            <section aria-labelledby="demo-proof" className="ty-demo-section">
              <SectionHeading id="demo-proof" title="Estado da prova" level={2} subtitle="Proporções de exemplo" />
              <PhaseBar label="Estado da prova" segments={phases} caption="A zona de baixa emissão reduziu os dias acima do limite de PM2.5 (achado fictício)." />
            </section>
          </div>
          <section aria-labelledby="demo-activity" className="ty-demo-section">
            <SectionHeading id="demo-activity" title="Atividade recente" level={2} />
            <ActivityFeed label="Atividade recente" entries={activity} moreHref={go('trilha')} moreLabel="Ver trilha" />
          </section>
        </div>
      </AppFrame>
    </TympanProvider>
  )
}
