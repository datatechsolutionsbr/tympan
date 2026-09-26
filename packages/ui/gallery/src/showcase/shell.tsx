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
            { id: 'r', value: 582, label: 'records', href: '#/base' },
            { id: 'p', value: 60, label: 'proved claims', proof: 'proved' },
            { id: 'w', value: 30, label: 'pending', detail: 'example' },
            { id: 'x', value: 5, label: 'refuted', proof: 'refuted' },
          ]}
        />
      </Section>

      <Section id={id('stage-strip')} title="StageStrip">
        <StageStrip
          label={`Stages ${scope}`}
          stages={[
            { id: 's', label: 'Search', href: '#/sources', status: 'done', figures: ['774 sources'] },
            { id: 'o', label: 'Organise', href: '#/base', status: 'current', figures: ['582 records'] },
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
            { id: 't', proof: 'pending', title: 'Case A', detail: 'Launch year without an open source', action: { label: 'Verify', onPress: () => undefined } },
            { id: 'b', proof: 'refuted', title: 'Case B', detail: 'Stage refuted by the second coder', action: { label: 'Review', href: '#/base/boti' } },
            { id: 'k', proof: 'not_disclosed', title: 'Case C', detail: 'Operator not disclosed' },
          ]}
          seeAllHref="#/verify"
        />
        <AttentionList label={`Attention empty ${scope}`} items={[]} />
      </Section>

      <Section id={id('phase-bar')} title="PhaseBar">
        <PhaseBar
          label={`Proof ${scope}`}
          segments={[
            { id: 'p', label: 'proved', value: 60, tone: 'proved' },
            { id: 'w', label: 'pending', value: 30, tone: 'pending' },
            { id: 'r', label: 'refuted', value: 5, tone: 'refuted' },
            { id: 'n', label: 'not disclosed', value: 5, tone: 'not_disclosed' },
          ]}
          caption="Example finding sentence: on the platform it comes from the run that produced it."
        />
      </Section>

      <Section id={id('activity')} title="ActivityFeed">
        <ActivityFeed
          label={`Activity ${scope}`}
          now={now}
          entries={[
            { id: '1', actor: { kind: 'person', name: 'Natalia Mesquita' }, text: 'verified a value of Case A', at: '2026-09-26T11:54:00Z', meta: 'example-id' },
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
                <Text>Queue: Case A, Case B, Case C.</Text>
                <Text size="meta" tone="muted">
                  Drag the line or use the arrow keys on it.
                </Text>
              </div>
            }
            secondary={
              <EvidencePanel
                title="Situation: in operation"
                subtitle="example-id"
                open
                placement="docked"
                onOpenChange={() => undefined}
                proof={{ state: 'proved', provedBy: 'Reviewer B', at: '23 Sep 2026', rule: 'compile@1' }}
              >
                <Text>“Example quoted passage.”</Text>
              </EvidencePanel>
            }
          />
        </div>
      </Section>
    </div>
  )
}
