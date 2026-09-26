// Gallery section for the "shell" group: the research shell's parts.
import { BookOpen, CheckSquare, FileStack, Home, Network, Plus, User } from 'lucide-react'
import { useState } from 'react'
import {
  ActivityFeed,
  AttentionList,
  EvidencePanel,
  FloatingActionBar,
  PageHeader,
  PhaseBar,
  RailContextButton,
  RailNavItem,
  RailNavSection,
  ResizableSplit,
  StageStrip,
  StatStrip,
  Text,
} from '../../../src'
import { Section } from '../Section'

const now = new Date('2026-09-26T12:00:00Z')

export function ShellShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-${s}`
  const [split, setSplit] = useState(380)
  return (
    <div className="fk-gallery-showcase">
      <Section id={id('page-header-editorial')} title="PageHeader (editorial variant)">
        <PageHeader
          variant="editorial"
          headingLevel={3}
          title="Visão geral"
          trail={[{ label: 'EACH/USP', href: '#/org' }, { label: 'Censo IA gov', href: '#/census' }, { label: 'Visão geral' }]}
          lead="Registro mundial de assistentes e agentes de IA de governos, com evidência citada por propriedade."
        />
      </Section>

      <Section id={id('rail')} title="Rail navigation (RailNavSection, RailNavItem, RailContextButton)">
        <div className="fk-gallery-rail">
          <RailContextButton scope="EACH/USP" name="Censo de assistentes de IA" />
          <nav aria-label={`Rail sample ${scope}`}>
            <RailNavSection>
              <RailNavItem label="Visão geral" icon={Home} href="#/overview" current />
            </RailNavSection>
            <RailNavSection label="Coletar">
              <RailNavItem label="Fontes e trilha" icon={BookOpen} href="#/sources" />
              <RailNavItem label="Verificação" icon={CheckSquare} href="#/verify" count={12} />
            </RailNavSection>
          </nav>
        </div>
      </Section>

      <Section id={id('action-bar')} title="FloatingActionBar (dock)">
        <div className="fk-gallery-dock-stage">
          <FloatingActionBar
            id={id('dock')}
            label={`Dock sample ${scope}`}
            anchor="container"
            edge="bottom"
            focusShortcut={null}
            destinations={[
              { id: 'o', label: 'Overview', icon: Home, href: '#/overview', active: true },
              { id: 'b', label: 'Base', icon: FileStack, href: '#/base' },
              { id: 'v', label: 'Verification', icon: CheckSquare, href: '#/verify', count: 12 },
              { id: 'p', label: 'Provenance', icon: Network, href: '#/graph' },
            ]}
            contextual={[
              { id: 'n', label: 'New session', icon: Plus, onPress: () => undefined, menu: [{ id: 's', label: 'Search session' }, { id: 'i', label: 'Instrument' }] },
              { id: 'me', label: 'Account', icon: User, onPress: () => undefined },
            ]}
          />
        </div>
        <div className="fk-gallery-dock-stage">
          <FloatingActionBar id={id('dock-loading')} label={`Dock loading ${scope}`} anchor="container" edge="bottom" destinations={[]} focusShortcut={null} />
        </div>
      </Section>

      <Section id={id('stat-strip')} title="StatStrip">
        <StatStrip
          label={`Research state ${scope}`}
          items={[
            { id: 'r', value: 94, label: 'records', href: '#/base' },
            { id: 'p', value: 512, label: 'proved claims', proof: 'proved' },
            { id: 'w', value: 145, label: 'pending', detail: '12 assigned to you' },
            { id: 'x', value: 7, label: 'refuted', proof: 'refuted' },
          ]}
        />
      </Section>

      <Section id={id('stage-strip')} title="StageStrip">
        <StageStrip
          label={`Stages ${scope}`}
          stages={[
            { id: 's', label: 'Search', href: '#/sources', status: 'done', figures: ['14 sources'] },
            { id: 'o', label: 'Organise', href: '#/base', status: 'current', figures: ['94 records'] },
            { id: 'a', label: 'Analyse', href: '#/analyses', status: 'attention', figures: ['1 failed run'] },
            { id: 'p', label: 'Publish', status: 'upcoming' },
            { id: 'm', label: 'Manuscript', status: 'upcoming' },
          ]}
        />
      </Section>

      <Section id={id('attention')} title="AttentionList">
        <AttentionList
          label={`Attention ${scope}`}
          items={[
            { id: 't', proof: 'pending', title: 'TAMM AI Assistant', detail: 'Launch year without an open source', action: { label: 'Verify', onPress: () => undefined } },
            { id: 'b', proof: 'refuted', title: 'Boti', detail: 'Stage refuted by the second coder', action: { label: 'Review', href: '#/base/boti' } },
            { id: 'k', proof: 'not_disclosed', title: 'Bürokratt', detail: 'Operator not disclosed' },
          ]}
          seeAllHref="#/verify"
        />
        <AttentionList label={`Attention empty ${scope}`} items={[]} />
      </Section>

      <Section id={id('phase-bar')} title="PhaseBar">
        <PhaseBar
          label={`Proof ${scope}`}
          segments={[
            { id: 'p', label: 'proved', value: 512, tone: 'proved' },
            { id: 'w', label: 'pending', value: 145, tone: 'pending' },
            { id: 'r', label: 'refuted', value: 7, tone: 'refuted' },
            { id: 'n', label: 'not disclosed', value: 64, tone: 'not_disclosed' },
          ]}
          caption="Two thirds of the claims in tables 2 and 3 already have an open, checked source."
        />
      </Section>

      <Section id={id('activity')} title="ActivityFeed">
        <ActivityFeed
          label={`Activity ${scope}`}
          now={now}
          entries={[
            { id: '1', actor: { kind: 'person', name: 'Natalia Mesquita' }, text: 'verified the launch year of TAMM', at: '2026-09-26T11:54:00Z', meta: 'ae-tamm-4-0' },
            { id: '2', actor: { kind: 'agent', name: 'stage-counter' }, text: 'ran the stage count', at: '2026-09-26T09:00:00Z', meta: 'rule stage-rule-v2' },
            { id: '3', actor: { kind: 'system', name: 'freeze@2' }, text: 'froze edition 2026-09-20', at: '2026-09-20T03:00:00Z' },
          ]}
          moreHref="#/trail"
          moreLabel="See trail"
        />
      </Section>

      <Section id={id('split')} title="ResizableSplit and EvidencePanel (docked)">
        <div className="fk-gallery-split-stage">
          <ResizableSplit
            label={`Resize the evidence ${scope}`}
            size={split}
            onSizeChange={setSplit}
            min={340}
            max={420}
            stackBelow={640}
            primary={
              <div className="fk-gallery-stack">
                <Text>Queue: TAMM, Boti, Bürokratt.</Text>
                <Text size="meta" tone="muted">
                  Drag the line or use the arrow keys on it.
                </Text>
              </div>
            }
            secondary={
              <EvidencePanel
                title="Situation: in operation"
                subtitle="ae-tamm-4-0"
                open
                placement="docked"
                onOpenChange={() => undefined}
                proof={{ state: 'proved', provedBy: 'Reviewer B', at: '23 Sep 2026', rule: 'compile@1' }}
              >
                <Text>“…completes services on a platform of more than 900 services.”</Text>
              </EvidencePanel>
            }
          />
        </div>
      </Section>
    </div>
  )
}
