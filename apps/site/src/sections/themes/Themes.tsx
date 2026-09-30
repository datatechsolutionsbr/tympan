import { Monitor, Moon, Sun, Home, BookOpen, CheckSquare, FileStack, Plus, User, LayoutPanelLeft, Database, ScanEye, Palette, BoxSelect, View, Network } from 'lucide-react'
import { useState } from 'react'
import { 
  SegmentedControl, 
  useTheme, 
  PageHeader, 
  StatStrip, 
  ActivityFeed, 
  AttentionList,
  AppFrame,
  BrandMark,
  RailContextButton,
  RailNavSection,
  RailNavItem,
  FloatingActionBar,
  ThemeScope,
  ListboxSelect,
  StageStrip,
  PhaseBar,
  ResizableSplit,
  EvidencePanel,
  Text
} from '@datatechsolutions/tympan'
import { ThemeSwatch } from '../../../../../packages/ui/src/components/theme-palette/ThemePalette'
import { FlowEditorPage } from '../../../../../packages/ui/gallery/src/flow/pages/FlowEditorPage'
import { ProvenancePage } from '../../../../../packages/ui/gallery/src/flow/pages/ProvenancePage'
import { useI18n } from '../../i18n/I18n'
import { Layout, useGruposTema, useNomeTema } from '../../Layout'
import type { Navegar } from '../../App'
import type { RotaDe } from '../../routes'
import './tour-styles.css'

type RotaThemes = RotaDe<'themes'>

export function Themes({ rota, ir }: { rota: RotaThemes; ir: Navegar }) {
  const { t } = useI18n()
  const thGlobal = useTheme() // We keep this if we want to read default, but we'll use local state
  const grupos = useGruposTema()
  const nomeTema = useNomeTema()
  
  const [activeStep, setActiveStep] = useState<string | null>('rail')
  const [activeView, setActiveView] = useState<'base' | 'canvas' | 'provenance'>('base')

  // Theme restricted to the shell
  const [shellTheme, setShellTheme] = useState(thGlobal.theme)
  const [shellMode, setShellMode] = useState(thGlobal.resolvedMode)
  const [split, setSplit] = useState(300)

  const steps = [
    { id: 'rail', title: 'Navegação Lateral', description: 'O trilho (Rail) mantém as áreas principais sempre acessíveis. Foca no contexto atual da aplicação.', icon: <LayoutPanelLeft /> },
    { id: 'header', title: 'Cabeçalho (PageHeader)', description: 'Traz título editorial, breadcrumbs e resumo, situando o usuário no fluxo de trabalho.', icon: <BoxSelect /> },
    { id: 'stats', title: 'Métricas (StatStrip)', description: 'Barra de estatísticas rápidas usando as cores semânticas (proved, pending, refuted).', icon: <Database /> },
    { id: 'content', title: 'Atenção e Atividade', description: 'Listas focadas no que precisa de ação imediata ou trilha de auditoria.', icon: <ScanEye /> },
    { id: 'dock', title: 'Barra de Ações (Dock)', description: 'Ações flutuantes no rodapé, sempre à mão, como busca, assistente e novo item.', icon: <Plus /> },
    { id: 'theme', title: 'Experimente os Themes', description: 'Mude as cores através do menu embutido no cabeçalho do Base Shell.', icon: <Palette /> },
  ]

  const now = new Date('2026-09-26T12:00:00Z')

  return (
    <Layout secao="themes" className="ty-site-pagina--temas" rotuloLateral="Tour">
      <div className="ty-tour-layout">
        
        {/* Navegador lateral do Tour */}
        <div className="ty-tour-sidebar">
          <h2 style={{ marginBottom: 8, fontSize: 24 }}>Tour de Componentes</h2>
          <p style={{ color: 'var(--ty-ink-2)', marginBottom: 32, lineHeight: 1.5 }}>
            Veja como o layout é construído. Clique nas etapas para dar foco e entender cada bloco.
          </p>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {steps.map(step => (
              <div 
                key={step.id} 
                className="ty-tour-step" 
                data-active={activeStep === step.id}
                onClick={() => {
                  setActiveStep(step.id)
                  if (activeView !== 'base') setActiveView('base') // Força voltar pro Base se for clicar nos passos do tour
                }}
              >
                <div className="ty-tour-step-title">{step.title}</div>
                <div className="ty-tour-step-desc">{step.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visualização interativa do Shell */}
        <div className="ty-tour-preview" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          
          {/* Seletor de Views (Carrossel) */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <SegmentedControl
              label="Application Examples"
              options={[
                { value: 'base', label: 'Dashboard Base', icon: LayoutPanelLeft },
                { value: 'canvas', label: 'Workflow Canvas', icon: View },
                { value: 'provenance', label: 'Grafo (Provenance)', icon: Network },
              ]}
              value={activeView}
              onChange={(v) => setActiveView(v as any)}
            />
          </div>

          <div className={['ty-tour-preview-inner', activeStep && activeView === 'base' ? 'ty-site-has-focus' : ''].filter(Boolean).join(' ')} style={{ flex: 1, minHeight: 0 }}>
            {/* O ThemeScope isola a cor selecionada apenas para os previews */}
            <ThemeScope theme={shellTheme} mode={shellMode} style={{ width: '100%', height: '100%', display: 'flex' }}>
              
              {activeView === 'canvas' && <FlowEditorPage />}
              {activeView === 'provenance' && <ProvenancePage />}

              {activeView === 'base' && (
                <AppFrame
                  layout="rail"
                  width="full"
                  ambient
                  navOpen={false}
                  brand={<BrandMark size="small" />}
                  context={<RailContextButton scope="Example Lab" name="Air Quality" />}
                  navigation={
                    <div className="ty-tour-target" data-tour-active={activeStep === 'rail'} style={{ borderRadius: 8 }}>
                      <RailNavSection label="Pesquisa">
                        <RailNavItem label="Overview" icon={Home} href="#/" current />
                      </RailNavSection>
                      <RailNavSection label="Evidências">
                        <RailNavItem label="Estações e trilha" icon={BookOpen} href="#/" />
                        <RailNavItem label="Verificação" icon={CheckSquare} href="#/" count={12} />
                      </RailNavSection>
                    </div>
                  }
                  dock={
                    <div className="ty-tour-target" data-tour-active={activeStep === 'dock'} style={{ borderRadius: 16 }}>
                      <FloatingActionBar 
                        anchor="container" 
                        edge="bottom" 
                        destinations={[
                          { id: 'o', label: 'Overview', icon: Home, href: '#/', active: true },
                          { id: 'b', label: 'Base', icon: FileStack, href: '#/' },
                        ]} 
                        contextual={[
                          { id: 'n', label: 'Nova sessão', icon: Plus, onPress: () => undefined },
                          { id: 'me', label: 'Conta', icon: User, onPress: () => undefined },
                        ]} 
                        label="Atalhos" 
                        focusShortcut={null} 
                      />
                    </div>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div className={['ty-tour-target', activeStep === 'theme' ? 'ty-site-no-outline' : ''].filter(Boolean).join(' ')} data-tour-active={activeStep === 'header' || activeStep === 'theme'} style={{ flexShrink: 0, borderRadius: 8 }}>
                      <PageHeader
                        variant="editorial"
                        headingLevel={3}
                        title="Overview"
                        trail={[{ label: 'Example Lab', href: '#/' }, { label: 'Overview' }]}
                        lead="Qualidade do ar em cinco estações, com a leitura de origem citada em cada número."
                        actions={
                          <div className="ty-tour-target" data-tour-active={activeStep === 'theme'} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 4, borderRadius: 8 }}>
                            <SegmentedControl
                              accessibleLabel="Modo de Cor"
                              size="compact"
                              options={[
                                { value: 'light', label: 'Claro', icon: Sun },
                                { value: 'dark', label: 'Escuro', icon: Moon },
                                { value: 'system', label: 'Auto', icon: Monitor },
                              ]}
                              value={shellMode}
                              onChange={(v) => setShellMode(v as any)}
                            />
                            <div style={{ width: 220 }}>
                              <ListboxSelect
                                accessibleLabel="Escolha o tema"
                                value={shellTheme}
                                onChange={(v) => setShellTheme(v)}
                                options={grupos.flatMap(g => g.themes).map(t => ({
                                  value: t.id,
                                  label: nomeTema(t.id),
                                  icon: <ThemeSwatch theme={t.id} mode={shellMode === 'system' ? 'light' : shellMode} />
                                }))}
                              />
                            </div>
                          </div>
                        }
                      />
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                      
                      {/* Stats Block */}
                      <div className="ty-tour-target" data-tour-active={activeStep === 'stats'} style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, borderRadius: 8 }}>
                        <StageStrip
                          label="Stages"
                          stages={[
                            { id: 's', label: 'Coletar', href: '#/', status: 'done', figures: ['5 estações'] },
                            { id: 'o', label: 'Organizar', href: '#/', status: 'current', figures: ['1460 leituras'] },
                            { id: 'a', label: 'Analisar', href: '#/', status: 'attention', figures: ['1 falha'] },
                            { id: 'p', label: 'Publicar', status: 'upcoming' },
                          ]}
                        />
                        <StatStrip
                          label="Research state"
                          items={[
                            { id: 'r', value: 1460, label: 'leituras diárias', href: '#/' },
                            { id: 'p', value: 60, label: 'alegações provadas', proof: 'proved' },
                            { id: 'w', value: 30, label: 'pendentes', detail: 'Vila Aurora' },
                            { id: 'x', value: 5, label: 'refutadas', proof: 'refuted' },
                          ]}
                        />
                        <PhaseBar
                          label="Proof"
                          segments={[
                            { id: 'p', label: 'provado', value: 60, tone: 'proved' },
                            { id: 'w', label: 'pendente', value: 30, tone: 'pending' },
                            { id: 'r', label: 'refutado', value: 5, tone: 'refuted' },
                            { id: 'n', label: 'não divulgado', value: 5, tone: 'not_disclosed' },
                          ]}
                          caption="A zona de baixa emissão reduziu os dias acima do limite."
                        />
                      </div>

                      {/* Content Block */}
                      <div className="ty-tour-target" data-tour-active={activeStep === 'content'} style={{ display: 'flex', flexDirection: 'column', padding: 24, borderRadius: 8, paddingBottom: 100 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                          <AttentionList
                            label="Atenção"
                            items={[
                              { id: 't', proof: 'pending', title: 'Estação Centro', detail: 'Leitura PM2.5 sem arquivo aberto', action: { label: 'Verificar', onPress: () => undefined } },
                              { id: 'b', proof: 'refuted', title: 'Estação Porto', detail: 'Pico de NO₂ refutado pela 2ª leitura', action: { label: 'Revisar', href: '#/' } },
                            ]}
                            seeAllHref="#/"
                          />
                          <ActivityFeed
                            label="Atividade Recente"
                            now={now}
                            entries={[
                              { id: '1', actor: { kind: 'person', name: 'Marina Duarte' }, text: 'verificou a leitura Centro', at: '2026-09-26T11:54:00Z', meta: 'rd-0714' },
                              { id: '2', actor: { kind: 'agent', name: 'limit-counter' }, text: 'contou os dias acima do limite', at: '2026-09-26T09:00:00Z', meta: 'rule limit-rule-v2' },
                            ]}
                            moreHref="#/"
                            moreLabel="Ver trilha completa"
                          />
                        </div>
                        <div style={{ minHeight: 280, border: '1px solid var(--ty-line)', borderRadius: 8, overflow: 'hidden' }}>
                          <ResizableSplit
                            label="Split example"
                            size={split}
                            onSizeChange={setSplit}
                            min={200}
                            max={400}
                            primary={
                              <div style={{ padding: 16 }}>
                                <Text>Fila: Centro, Harbour and Park stations.</Text>
                                <Text size="meta" tone="muted">Arraste a linha divisória.</Text>
                              </div>
                            }
                            secondary={
                              <EvidencePanel
                                title="Status da estação: operando"
                                subtitle="station-centro-2026"
                                open
                                placement="docked"
                                onOpenChange={() => undefined}
                                proof={{ state: 'proved', provedBy: 'Rafael Lima', at: '23 Set 2026', rule: 'compile@1' }}
                              >
                                <Text>“Média diária PM2.5 de 38 µg/m³ em 14 de Julho.”</Text>
                              </EvidencePanel>
                            }
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </AppFrame>
              )}
            </ThemeScope>
          </div>
        </div>

      </div>
    </Layout>
  )
}
