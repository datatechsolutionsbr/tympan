// Gallery section for the "data-a" group: panels, rows, lists, identifiers,
// notification history, recovery codes and markdown.
import { Bell, BookOpen, FileText, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import {
  ActorChip,
  Button,
  CopyIdentifier,
  CountBadge,
  GroupedDisclosureList,
  HistoryList,
  ListPanel,
  ListPanelRow,
  ListRow,
  MarkdownView,
  NotificationCenter,
  NotificationCenterProvider,
  ProfileAvatar,
  ProofBadge,
  RecoveryCodeList,
  SectionPanel,
  SummaryRow,
  Tag,
  useToast,
} from '../../../src'
import { Section } from '../Section'

const markdown = `# Days above the limit

The **limit rule** \`v2\` counts the days whose mean PM2.5 is *above* 25 µg/m³. See [the protocol](https://www.w3.org/WAI/ARIA/apg/).

- Centro and Harbour stations hold 37 of 94 days
- Park station fell from 22 to 18

\`\`\`sql
select station, count(*) from daily_readings where pm25 > 25 group by station
\`\`\``

function NotificationDemo() {
  const toast = useToast()
  return (
    <div className="ty-gallery-row">
      <Button onPress={() => toast.success('Upload finished', { message: 'Three station files were attached.' })}>Raise a success</Button>
      <Button onPress={() => toast.warning('Rule changed', { message: 'Limit rule v2 is now active.' })}>Raise a warning</Button>
      <NotificationCenter />
    </div>
  )
}

export function DataAShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-data-a-${s}`
  const [revealed, setRevealed] = useState(false)

  return (
    <>
      <Section id={id('section-panel')} title="SectionPanel">
        <SectionPanel
          title="Stations and trail"
          eyebrow="Collect"
          eyebrowAside={<Tag>5</Tag>}
          subtitle="Station readings, cleaning steps and aggregates behind every assertion."
          icon={<BookOpen />}
          scale="surface"
          headingLevel={3}
          actions={<Button size="compact">New session</Button>}
          accentStripe
        >
          <p>Two imports this week.</p>
        </SectionPanel>
        <SectionPanel title="Collapsible panel" headingLevel={3} scale="surface" elevation="raised" collapsible defaultOpen={false} actions={<Button size="compact">Export</Button>}>
          <p>Folded content.</p>
        </SectionPanel>
      </Section>

      <Section id={id('list-panel')} title="ListPanel">
        <ListPanel label={`Project settings (${scope})`}>
          <ListPanelRow leading={<Settings />} onAction={() => {}}>
            General
          </ListPanelRow>
          <ListPanelRow leading={<Users />} onAction={() => {}} textValue="Members" trailing={<Tag>3</Tag>}>
            Members
          </ListPanelRow>
          <ListPanelRow leading={<FileText />} disabled onAction={() => {}}>
            Signing keys
          </ListPanelRow>
        </ListPanel>
        <ListPanel as="feed" label={`Recent activity (${scope})`} elevation="raised">
          <ListPanelRow leading={<ActorChip kind="person" name="Ana Lima" />}>Checked the Centro station reading</ListPanelRow>
          <ListPanelRow leading={<ActorChip kind="agent" name="limit-counter" />}>Counted the days above the limit</ListPanelRow>
        </ListPanel>
      </Section>

      <Section id={id('rows')} title="SummaryRow, ListRow">
        <SummaryRow
          title="Vila Aurora urban air-quality study"
          subtitle="Example Lab · Owner"
          icon={<BookOpen />}
          iconTone="accent"
          metadata={[
            { label: 'Edition', value: '2026-09' },
            { label: 'Stations', value: 5 },
          ]}
        />
        <ListRow
          title="Resident exposure survey"
          subtitle="Questionnaire"
          icon={<FileText />}
          metadata={[{ label: 'Answers', value: 42 }]}
          actions={[
            { label: 'Edit', onPress: () => {} },
            { label: 'Remove', onPress: () => {}, tone: 'danger' },
          ]}
        />
        <ListRow title="Reading check form v2" icon={<FileText />} variant="emphasised" actions={[{ label: 'Open', onPress: () => {} }]} />
        <ListRow title="Old draft" variant="compact" actions={[{ label: 'Restore', onPress: () => {}, disabled: true }]} />
      </Section>

      <Section id={id('badges')} title="CountBadge, ProfileAvatar, CopyIdentifier">
        <div className="ty-gallery-row">
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <Button iconOnly accessibleLabel="Approvals" leadingIcon={<Bell />} aria-describedby={id('badge')} />
            <CountBadge count={12} id={id('badge')} itemNoun={{ one: 'approval', other: 'approvals' }} />
          </span>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <Button iconOnly accessibleLabel="Messages" leadingIcon={<Bell />} aria-describedby={id('badge-2')} />
            <CountBadge count={150} tone="neutral" id={id('badge-2')} />
          </span>
          <ProfileAvatar name="Maria Souza" size="sm" />
          <ProfileAvatar email="joao@example.org" size="md" />
          <ProfileAvatar size="lg" />
          <CopyIdentifier value="station-centro-2026-9f2c7d1e3b5a" />
          <CopyIdentifier value="rd-0714" />
        </div>
      </Section>

      <Section id={id('history')} title="HistoryList">
        <HistoryList
          loadingLabel="Loading the history"
          emptyLabel="No history yet"
          defaultExpandedIds={[`${scope}-h1`]}
          items={[
            {
              id: `${scope}-h1`,
              start: (
                <>
                  <ActorChip kind="person" name="Rafael Lima" /> 23 Sep
                </>
              ),
              end: <ProofBadge state="proved" />,
              summary: 'Verified the daily PM2.5 mean against the raw station file.',
              details: <p>Source: Centro station, read 12 Sep, sha256 9f2c…</p>,
            },
            {
              id: `${scope}-h2`,
              start: (
                <>
                  <ActorChip kind="agent" name="cleaning-agent" /> 22 Sep
                </>
              ),
              end: <ProofBadge state="pending" />,
              details: <p>Cleaned: 38 µg/m³.</p>,
            },
            { id: `${scope}-h3`, start: 'Edition 2026-09 frozen' },
          ]}
        />
        <HistoryList items={[]} loading loadingLabel="Loading the history" emptyLabel="No history yet" />
      </Section>

      <Section id={id('grouped')} title="GroupedDisclosureList">
        <GroupedDisclosureList
          headingLevel={3}
          groups={[
            { key: 'proved', header: <ProofBadge state="proved" detail="2" />, items: ['Centro station', 'Park station'] },
            { key: 'pending', header: <ProofBadge state="pending" detail="1" />, items: ['Harbour station'] },
          ]}
          defaultCollapsedKeys={['pending']}
          getItemKey={(name) => name}
          renderItem={(name) => <span>{name}</span>}
        />
      </Section>

      <Section id={id('recovery')} title="RecoveryCodeList">
        <RecoveryCodeList
          codes={['4821-0937', '5530-1846', '7712-9065', '0394-2278', '6650-3181', '9043-5527']}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          strings={{ listLabel: `Recovery codes (${scope})` }}
        />
      </Section>

      <Section id={id('markdown')} title="MarkdownView">
        <MarkdownView text={markdown} headingBase={3} />
      </Section>

      <Section id={id('notifications')} title="NotificationCenter">
        <NotificationCenterProvider>
          <NotificationDemo />
        </NotificationCenterProvider>
      </Section>
    </>
  )
}
