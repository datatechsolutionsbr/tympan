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
    <div className="ty-gallery-showcase">
      <Section id={id('stat-tile')} title="StatTile">
        <div className="ty-gallery-row">
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
          <button type="button" className="ty-gallery-native-input" style={{ inlineSize: 'auto' }} onClick={() => setCount((c) => c + 37)}>
            Add 37
          </button>
        </p>
      </Section>

      <Section id={id('delta')} title="DeltaIndicator">
        <div className="ty-gallery-row">
          <DeltaIndicator value={12.34} />
          <DeltaIndicator value={-3} unit="number" />
          <DeltaIndicator value={0} />
          <DeltaIndicator value={4.2} polarity="lower-is-better" appearance="pill" size="medium" />
          <DeltaIndicator value={-1.5} appearance="pill" />
        </div>
      </Section>

      <Section id={id('metric')} title="MetricTile">
        <div className="ty-gallery-row">
          <MetricTile title="Daily readings" value={1460} subtitle="Edition 2026-09" trend={{ value: 10.5, label: 'vs last edition' }} icon={<Scale />} tone="success" />
          <MetricTile title="Refuted" value={7} tone="danger" icon={<CircleAlert />} trend={{ value: -5.2 }} />
          <MetricTile title="Runs" value={3} surface="plain" trend={{ value: 0 }} />
        </div>
      </Section>

      <Section id={id('agent-output')} title="AgentOutputCard">
        <AgentOutputCard agentName="limit-counter" agentKey="ak_91" duration="3.4 s" output="Centro and Harbour stations added up to 37 of the 94 days above the PM2.5 limit; Park fell from 22 to 18. The count used rule limit-rule-v2 on edition 2026-09." onOpen={() => toast.info('Full output')} />
        <AgentOutputCard agentName="linker" duration="0.2 s" outcome="failed" output="The Riverside station feed returned 404." />
      </Section>

      <Section id={id('record')} title="RecordCard">
        <ul className="ty-gallery-stack" style={{ margin: 0, padding: 0 }}>
          <RecordCard
            title="limit-counter"
            secondary="ak_91 · nova-lite"
            leading={<Bot />}
            state
            accent={3}
            onOpen={() => toast.info('Open limit-counter')}
            footer={<RecordActions recordTitle="limit-counter" editLabel="Edit" deleteLabel="Delete" onEdit={() => toast.info('Edit')} onDelete={() => void toast.success('Deleted')} confirmDeleteTitle="Delete limit-counter?" />}
          >
            Counts the days above the PM2.5 limit per station for every frozen edition.
          </RecordCard>
          <RecordCard title="notary" secondary="Signs editions" state={false} />
        </ul>
      </Section>

      <Section id={id('profile')} title="ProfileSummary">
        <ProfileSummary name="Marina Duarte" email="marina.duarte@example.org" showEmail role="Owner" />
      </Section>

      <Section id={id('contact')} title="ContactCard">
        <ContactSection title="Contact" subtitle="Write to the team that can answer." headingLevel={3}>
          <ContactChannelCard purposeLabel="Research partnerships" email="research@example.org" phone="+55 00 0000-0000" headingLevel={4} />
          <ContactOfficeCard city="Vila Aurora" addressLines={['Rua das Estações, 100', 'Centro', '00000-000']} headingLevel={4} />
        </ContactSection>
      </Section>

      <Section id={id('insight')} title="InsightCard">
        <InsightCard
          actor={{ kind: 'agent', name: 'cleaning-agent', agentKey: 'ak_12' }}
          title="Days above the limit, Centro station"
          value="12 days"
          delta={{ value: 1, unit: 'number' }}
          measures={[
            { id: 'c', label: 'Confidence', value: '82 %', meter: 0.82 },
            { id: 's', label: 'Readings opened', value: '6 of 6' },
          ]}
          actions={[
            { id: 'accept', label: 'Accept', emphasis: 'secondary' },
            { id: 'dismiss', label: 'Dismiss', emphasis: 'quiet' },
          ]}
          onAction={(a) => new Promise<void>((r) => setTimeout(r, 900)).then(() => setOutcome(a === 'accept' ? 'Accepted by Marina just now.' : 'Dismissed.'))}
          outcome={outcome ? { text: outcome } : undefined}
          footnote={{ text: 'Rule limit-rule-v2 applied', href: '#/rules' }}
          proofState="pending"
        />
      </Section>

      <Section id={id('ticker')} title="TickerCard">
        <TickerCard
          title="Mean PM2.5, per station"
          icon={Landmark}
          entries={[
            { id: 'park', name: 'Park station', qualifier: 'Green belt', value: '8.1', change: { value: '−0.4', direction: 'down', sentiment: 'positive' } },
            { id: 'north', name: 'North station', qualifier: 'North district', value: '17.7', change: { value: '+0.2', direction: 'up', sentiment: 'negative' } },
            { id: 'riverside', name: 'Riverside station', qualifier: 'River bank', value: '12.4', change: { value: '0.0', direction: 'flat' } },
          ]}
          asOf="As of edition 2026-09, µg/m³"
          seeAll={{ label: 'See all stations', href: '#/stations' }}
          onEntryPress={(e) => toast.info(`Open ${e}`)}
        />
      </Section>
    </div>
  )
}
