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

const markdown = `# Stage count

The **stage rule** \`v2\` counts cases by what the assistant *does*. See [the protocol](https://www.w3.org/WAI/ARIA/apg/).

- Stages 3 and 4 hold 37 of 94 cases
- Stage 1 fell from 22 to 18

\`\`\`sql
select stage, count(*) from cases group by stage
\`\`\``

function NotificationDemo() {
  const toast = useToast()
  return (
    <div className="ty-gallery-row">
      <Button onPress={() => toast.success('Upload finished', { message: 'Three sources were attached.' })}>Raise a success</Button>
      <Button onPress={() => toast.warning('Rule changed', { message: 'Stage rule v2 is now active.' })}>Raise a warning</Button>
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
          title="Sources and trail"
          eyebrow="Collect"
          eyebrowAside={<Tag>14</Tag>}
          subtitle="Sessions, queries and retrievals behind every assertion."
          icon={<BookOpen />}
          scale="surface"
          headingLevel={3}
          actions={<Button size="compact">New session</Button>}
          accentStripe
        >
          <p>Two sessions this week.</p>
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
          <ListPanelRow leading={<ActorChip kind="person" name="Ana Lima" />}>Coded the stage of Case A</ListPanelRow>
          <ListPanelRow leading={<ActorChip kind="agent" name="stage-counter" />}>Ran the stage count</ListPanelRow>
        </ListPanel>
      </Section>

      <Section id={id('rows')} title="SummaryRow, ListRow">
        <SummaryRow
          title="Census of government AI assistants"
          subtitle="EACH/USP · Owner"
          icon={<BookOpen />}
          iconTone="accent"
          metadata={[
            { label: 'Edition', value: '2026-09-20' },
            { label: 'Records', value: 94 },
          ]}
        />
        <ListRow
          title="Survey A"
          subtitle="Questionnaire"
          icon={<FileText />}
          metadata={[{ label: 'Answers', value: 42 }]}
          actions={[
            { label: 'Edit', onPress: () => {} },
            { label: 'Remove', onPress: () => {}, tone: 'danger' },
          ]}
        />
        <ListRow title="Coding form v2" icon={<FileText />} variant="emphasised" actions={[{ label: 'Open', onPress: () => {} }]} />
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
          <CopyIdentifier value="case-a-example-9f2c7d1e3b5a" />
          <CopyIdentifier value="r115b" />
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
                  <ActorChip kind="person" name="Avaliador" /> 23 Sep
                </>
              ),
              end: <ProofBadge state="proved" />,
              summary: 'Verified the launch year against the service page.',
              details: <p>Source: example.org, retrieved 12 Sep, sha256 9f2c…</p>,
            },
            {
              id: `${scope}-h2`,
              start: (
                <>
                  <ActorChip kind="agent" name="coder-a" /> 22 Sep
                </>
              ),
              end: <ProofBadge state="pending" />,
              details: <p>Coded as stage 4.</p>,
            },
            { id: `${scope}-h3`, start: 'Edition 2026-09-20 frozen' },
          ]}
        />
        <HistoryList items={[]} loading loadingLabel="Loading the history" emptyLabel="No history yet" />
      </Section>

      <Section id={id('grouped')} title="GroupedDisclosureList">
        <GroupedDisclosureList
          headingLevel={3}
          groups={[
            { key: 'proved', header: <ProofBadge state="proved" detail="2" />, items: ['Case A', 'Case C'] },
            { key: 'pending', header: <ProofBadge state="pending" detail="1" />, items: ['Case B'] },
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
