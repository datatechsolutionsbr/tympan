// Gallery section for the "data-b" group: figures, cards and summaries.
import { Bot, CircleAlert, FileCheck2, Landmark, Scale } from 'lucide-react'
import { useState } from 'react'
import {
  AgentOutputCard,
  ContactChannelCard,
  ContactOfficeCard,
  ContactSection,
  DeltaIndicator,
  InsightCard,
  MetricTile,
  ProfileSummary,
  RecordActions,
  RecordCard,
  StatTile,
  TickerCard,
  TweenedNumber,
  useToast,
} from '../../../src'
import { Section } from '../Section'

export function DataBShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-${s}`
  const toast = useToast()
  const [filter, setFilter] = useState(false)
  const [count, setCount] = useState(512)
  const [outcome, setOutcome] = useState<string | undefined>()

  return (
    <div className="fk-gallery-showcase">
      <Section id={id('stat-tile')} title="StatTile">
        <div className="fk-gallery-row">
          <StatTile
            value={count}
            label="Proved claims"
            icon={<FileCheck2 />}
            qualifier="Sep 2026"
            live
            explanation={{ title: 'How it is counted', body: 'Assertions with a proved state in the current edition.', blocks: [{ label: 'Query', text: 'count(assertions where state = proved)' }] }}
          />
          <StatTile value={12} label="Waiting for me" tone="attention" selected={filter} filtered={filter} onPress={() => setFilter((f) => !f)} />
        </div>
      </Section>

      <Section id={id('tweened')} title="TweenedNumber">
        <p>
          Total <TweenedNumber value={count} />{' '}
          <button type="button" className="fk-gallery-native-input" style={{ inlineSize: 'auto' }} onClick={() => setCount((c) => c + 37)}>
            Add 37
          </button>
        </p>
      </Section>

      <Section id={id('delta')} title="DeltaIndicator">
        <div className="fk-gallery-row">
          <DeltaIndicator value={12.34} />
          <DeltaIndicator value={-3} unit="number" />
          <DeltaIndicator value={0} />
          <DeltaIndicator value={4.2} polarity="lower-is-better" appearance="pill" size="medium" />
          <DeltaIndicator value={-1.5} appearance="pill" />
        </div>
      </Section>

      <Section id={id('metric')} title="MetricTile">
        <div className="fk-gallery-row">
          <MetricTile title="Records" value={94} subtitle="Edition 2026-09-20" trend={{ value: 10.5, label: 'vs last edition' }} icon={<Scale />} tone="success" />
          <MetricTile title="Refuted" value={7} tone="danger" icon={<CircleAlert />} trend={{ value: -5.2 }} />
          <MetricTile title="Runs" value={3} surface="plain" trend={{ value: 0 }} />
        </div>
      </Section>

      <Section id={id('agent-output')} title="AgentOutputCard">
        <AgentOutputCard agentName="stage-counter" agentKey="ak_91" duration="3.4 s" output="Stages 3 and 4 add up to 37 of the 94 cases; stage 1 fell from 22 to 18. The count used rule stage-rule-v2 on edition 2026-09-20." onOpen={() => toast.info('Full output')} />
        <AgentOutputCard agentName="linker" duration="0.2 s" outcome="failed" output="The source page returned 404." />
      </Section>

      <Section id={id('record')} title="RecordCard">
        <ul className="fk-gallery-stack" style={{ margin: 0, padding: 0 }}>
          <RecordCard
            title="stage-counter"
            secondary="ak_91 · nova-lite"
            leading={<Bot />}
            state
            accent={3}
            onOpen={() => toast.info('Open stage-counter')}
            footer={<RecordActions recordTitle="stage-counter" editLabel="Edit" deleteLabel="Delete" onEdit={() => toast.info('Edit')} onDelete={() => void toast.success('Deleted')} confirmDeleteTitle="Delete stage-counter?" />}
          >
            Counts records per stage for every frozen edition.
          </RecordCard>
          <RecordCard title="notary" secondary="Signs editions" state={false} />
        </ul>
      </Section>

      <Section id={id('profile')} title="ProfileSummary">
        <ProfileSummary name="Natália Mesquita" email="natalia@example.org" showEmail role="Owner" />
      </Section>

      <Section id={id('contact')} title="ContactCard">
        <ContactSection title="Contact" subtitle="Write to the team that can answer." headingLevel={3}>
          <ContactChannelCard purposeLabel="Research partnerships" email="research@example.org" phone="+55 11 3091-1000" headingLevel={4} />
          <ContactOfficeCard city="São Paulo" addressLines={['Rua Arlindo Béttio, 1000', 'Ermelino Matarazzo', '03828-000']} headingLevel={4} />
        </ContactSection>
      </Section>

      <Section id={id('insight')} title="InsightCard">
        <InsightCard
          actor={{ kind: 'agent', name: 'stage-coder', agentKey: 'ak_12' }}
          title="Stage of Case A"
          value="4 Executes services"
          delta={{ value: 1, unit: 'number' }}
          measures={[
            { id: 'c', label: 'Confidence', value: '82 %', meter: 0.82 },
            { id: 's', label: 'Sources read', value: '6 of 6' },
          ]}
          actions={[
            { id: 'accept', label: 'Accept', emphasis: 'secondary' },
            { id: 'dismiss', label: 'Dismiss', emphasis: 'quiet' },
          ]}
          onAction={(a) => new Promise<void>((r) => setTimeout(r, 900)).then(() => setOutcome(a === 'accept' ? 'Accepted by Natália just now.' : 'Dismissed.'))}
          outcome={outcome ? { text: outcome } : undefined}
          footnote={{ text: 'Rule stage-rule-v2 applied', href: '#/rules' }}
          proofState="pending"
        />
      </Section>

      <Section id={id('ticker')} title="TickerCard">
        <TickerCard
          title="Transparency, per case"
          icon={Landmark}
          entries={[
            { id: 'ee', name: 'Case C', qualifier: 'Country C', value: '0.81', change: { value: '+0.04', direction: 'up', sentiment: 'positive' } },
            { id: 'uk', name: 'Case D', qualifier: 'Country D', value: '0.77', change: { value: '−0.02', direction: 'down', sentiment: 'negative' } },
            { id: 'sp', name: 'Case E', qualifier: 'City E', value: '0.64', change: { value: '0.00', direction: 'flat' } },
          ]}
          asOf="As of edition 2026-09-20"
          seeAll={{ label: 'See all cases', href: '#/cases' }}
          onEntryPress={(e) => toast.info(`Open ${e}`)}
        />
      </Section>
    </div>
  )
}
