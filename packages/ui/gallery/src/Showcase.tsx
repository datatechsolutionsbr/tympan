// Every wave-1 component (plus ProofBadge and ActorChip) in representative
// states. A test harness for screenshots, not a documentation site.
import { BookOpen, CalendarDays, Copy, Download, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  ActionMenu,
  ActorChip,
  Avatar,
  Breadcrumbs,
  Button,
  Checkbox,
  CheckboxGroup,
  Code,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  Fieldset,
  FieldStack,
  Heading,
  InlineNotice,
  Link,
  ListboxSelect,
  ModalDialog,
  NativeSelect,
  PageHeader,
  Pagination,
  Popover,
  ProgressBar,
  ProofBadge,
  SectionHeading,
  SegmentedControl,
  Separator,
  Skeleton,
  SkipLink,
  Spinner,
  StatusPill,
  Strong,
  Subheading,
  Surface,
  Switch,
  TabPanel,
  Tabs,
  Tag,
  TagList,
  Text,
  TextArea,
  TextField,
  useToast,
  type SortDirection,
} from '../../src'
import { Section } from './Section'

const rows = [
  { id: 'centro', cells: { name: 'Centro station', country: 'Downtown', stage: '12', proof: <ProofBadge state="proved" size="compact" detail="6/6" /> }, label: 'Centro station' },
  { id: 'harbour', cells: { name: 'Harbour station', country: 'Port district', stage: '31', proof: <ProofBadge state="pending" size="compact" detail="4/6" /> }, label: 'Harbour station' },
  { id: 'park', cells: { name: 'Park station', country: 'Green belt', stage: '7', proof: <ProofBadge state="not_disclosed" size="compact" detail="3/6" /> }, label: 'Park station' },
]

export function Showcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-${s}`
  const toast = useToast()
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [page, setPage] = useState(5)
  const [sort, setSort] = useState<{ column?: string; direction: SortDirection }>({ column: 'name', direction: 'ascending' })
  const [selected, setSelected] = useState<Set<string>>(new Set(['harbour']))
  const [segment, setSegment] = useState('Week')
  const [tags, setTags] = useState([
    { id: 'va', label: 'Vila Aurora' },
    { id: 'pm25', label: 'PM2.5', tone: 'category' as const, categoryIndex: 2 },
    { id: 'no2', label: 'NO₂', tone: 'category' as const, categoryIndex: 5 },
  ])

  return (
    <div className="ty-gallery-showcase">
      <Section id={id('typography')} title="Text, Heading">
        <Heading eyebrow="Vila Aurora air-quality study">Stations</Heading>
        <Subheading>Readings and trail</Subheading>
        <Heading level={3}>Identification</Heading>
        <Text size="body-lg" measure="summary">
          A calm, editorial reading summary that says what the screen shows.
        </Text>
        <Text>
          Running text with <Strong>strong emphasis</Strong> and an identifier <Code>station-centro-2026</Code>.
        </Text>
        <Text size="meta" tone="muted">
          Meta text, 12/18, ink-3.
        </Text>
        <Text truncate={1}>A very long sentence that is truncated to one line with an ellipsis while the full value stays available.</Text>
      </Section>

      <Section id={id('buttons')} title="Button">
        <div className="ty-gallery-row">
          <Button variant="primary" leadingIcon={<Plus />}>
            New session
          </Button>
          <Button>Secondary</Button>
          <Button variant="quiet">Quiet</Button>
          <Button variant="danger" leadingIcon={<Trash2 />}>
            Remove
          </Button>
          <Button iconOnly accessibleLabel="Copy link" leadingIcon={<Copy />} />
          <Button iconOnly shape="circle" accessibleLabel="Edit" leadingIcon={<Pencil />} />
          <Button busy busyLabel="Saving">
            Save
          </Button>
          <Button disabled>Disabled</Button>
          <Button size="compact">Compact</Button>
          <Button size="large" shape="pill">
            Large pill
          </Button>
        </div>
      </Section>

      <Section id={id('links')} title="Link">
        <Text>
          Read the <Link href="#/protocol">monitoring protocol</Link> or the{' '}
          <Link href="https://www.w3.org/WAI/ARIA/apg/">APG patterns</Link>.
        </Text>
        <div className="ty-gallery-row">
          <Link href="#/sources" emphasis="subtle" standalone>
            Subtle standalone link
          </Link>
          <Link onPress={() => toast.info('Inline action')}>Inline action</Link>
        </div>
      </Section>

      <Section id={id('forms')} title="Field, TextField, TextArea, NativeSelect, ListboxSelect">
        <FieldStack>
          <TextField label="Station name" hint="As registered in the monitoring network." defaultValue="Centro station" />
          <TextField label="Search" mode="search" placeholder="Search by name" />
          <TextField label="Password" mode="password" defaultValue="correct horse" />
          <TextField label="E-mail" inputType="email" defaultValue="not-an-email" errorMessage="Enter an e-mail address." />
          <TextField label="Key" successMessage="Key verified." defaultValue="ed25519:9f2c" />
          <TextArea label="Quoted evidence" rows={3} showCounter maxLength={280} defaultValue="…daily mean PM2.5 stayed above 25 µg/m³ on 12 days in July." />
          <Field label="Installation year" hint="Four digits." required controlId={id('launch-year')}>
            <input id={id('launch-year')} className="ty-gallery-native-input" defaultValue="2024" />
          </Field>
          <NativeSelect label="Sensor tier" options={['1', '2', '3', '4']} defaultValue="4" />
          <ListboxSelect
            label="Pollutant"
            options={[
              { value: 'pm25', label: 'PM2.5', description: 'Fine particles, µg/m³' },
              { value: 'pm10', label: 'PM10' },
              { value: 'no2', label: 'NO₂', description: 'Nitrogen dioxide, µg/m³' },
              { value: 'o3', label: 'O₃', disabled: true },
            ]}
            defaultValue="no2"
          />
        </FieldStack>
      </Section>

      <Section id={id('choices')} title="Checkbox, Switch, SegmentedControl, Fieldset">
        <Fieldset legend="Coding options" description="Applied when the edition is frozen.">
          <CheckboxGroup label="Pollutants" defaultValue={['pm25']}>
            <Checkbox value="pm25" label="PM2.5" description="Fine particles, daily mean." />
            <Checkbox value="no2" label="NO₂" />
            <Checkbox value="o3" label="O₃" disabled />
          </CheckboxGroup>
          <Checkbox label="Select all rows" isIndeterminate appearance="bare" />
          <Checkbox label="I confirm the raw reading was opened" errorMessage="Confirm before saving." />
          <Switch label="Notifications" defaultSelected />
          <Switch label="Compact tables" layout="tile" description="Denser rows in the verification queue." />
          <SegmentedControl label="Period" options={['Day', 'Week', 'Month']} value={segment} onChange={setSegment} />
        </Fieldset>
      </Section>

      <Section id={id('surfaces')} title="Surface, SectionHeading, Separator">
        <Surface title="Current edition" description="Frozen on 20 Sep 2026 (fictional data)." elevation="sheet" footer={<Button size="compact">Compare</Button>}>
          <SectionHeading title="Verification" level={3} subtitle="3 of 3 cross-checks passed" trailing={<Button size="compact" variant="quiet">History</Button>} />
          <Separator />
          <Text>Manifest signed by the notary agent.</Text>
          <Separator caption="or" />
          <Text size="meta">Raised card below:</Text>
        </Surface>
        <Surface title="Open the record" elevation="raised" onPress={() => toast.info('Surface pressed')} as="article">
          <Text size="meta">The whole card is one press target.</Text>
        </Surface>
      </Section>

      <Section id={id('display')} title="Tag, StatusPill, Avatar, ProofBadge, ActorChip">
        <div className="ty-gallery-row">
          <Tag>Neutral</Tag>
          <Tag tone="accent">Accent</Tag>
          <Tag tone="category" categoryIndex={3}>
            Category 3
          </Tag>
          <Tag onPress={() => toast.info('Tag pressed')}>Pressable</Tag>
          <Tag removable onRemove={() => toast.info('Removed')}>
            Stage: 4
          </Tag>
        </div>
        <TagList label="Active filters" items={tags} onRemove={(tid) => setTags((t) => t.filter((x) => x.id !== tid))} />
        <div className="ty-gallery-row">
          {['active', 'pending', 'rejected', 'processing', 'inactive', 'error'].map((s) => (
            <StatusPill key={s} status={s} />
          ))}
        </div>
        <div className="ty-gallery-row">
          <Avatar name="Marina Duarte" fallbackText="MD" />
          <Avatar name="Marina Duarte" fallbackText="MD" size="large" tint="neutral" />
          <Avatar name="stage-counter" actorKind="agent" />
          <Avatar name="Marina Duarte" fallbackText="MD" size="xsmall" onPress={() => toast.info('Profile')} />
        </div>
        <div className="ty-gallery-row">
          {(['proved', 'pending', 'refuted', 'not_disclosed', null] as const).map((s) => (
            <ProofBadge key={String(s)} state={s} />
          ))}
          {(['proved', 'pending', 'refuted', 'not_disclosed'] as const).map((s) => (
            <ProofBadge key={`c-${s}`} state={s} size="compact" interactive />
          ))}
        </div>
        <ProofBadge state="proved" size="block" provedBy={<ActorChip kind="person" name="Rafael Lima" compact />} at="23 Sep 2026" rule="compile@1" />
        <div className="ty-gallery-stack">
          <ActorChip kind="person" name="Marina Duarte" email="marina.duarte@example.org" />
          <ActorChip kind="agent" name="stage-counter" agentKey="agk_7f3a" model="model-large" />
          <ActorChip kind="system" name="freeze-edition@2" />
        </div>
      </Section>

      <Section id={id('feedback')} title="InlineNotice, ProgressBar, Spinner, Skeleton">
        <InlineNotice tone="info" title="Contract gap" urgency="none">
          The provenance operation is served by the mock until the contract has it.
        </InlineNotice>
        <InlineNotice tone="success" urgency="none">
          Edition verified.
        </InlineNotice>
        <InlineNotice tone="warning" urgency="none" dismissible onDismiss={() => {}}>
          Two station readings were not opened.
        </InlineNotice>
        <InlineNotice tone="danger" title="Verification failed" urgency="none" actions={<Button size="compact">Show diff</Button>}>
          The manifest hash differs from the frozen one.
        </InlineNotice>
        <ProgressBar label="Upload" value={40} />
        <ProgressBar label="Verification" value={3} maxValue={8} valueLabel="3 of 8 steps" tone="success" size="thin" />
        <ProgressBar label="Re-running analysis" indeterminate />
        <div className="ty-gallery-row">
          <Spinner label="Saving" showLabel />
          <Spinner label="Loading" shape="dots" size="small" />
        </div>
        <Skeleton lines={3} />
        <Skeleton preset="stats" count={3} columns={3} />
      </Section>

      <Section id={id('states')} title="EmptyState, ErrorState">
        <EmptyState reason="no-results" onClearFilters={() => toast.info('Filters cleared')} />
        <EmptyState reason="no-data" title="No sources yet" description="The trail starts when a station reading is imported." action={{ label: 'New session', onPress: () => {} }} framing="section" />
        <ErrorState kind="conflict" statusCode={409} problemType="https://example.org/problems/stale-version" details="If-Match did not match the current ETag." onRetry={() => new Promise((r) => setTimeout(r, 1200))} scope="block" />
      </Section>

      <Section id={id('navigation')} title="Breadcrumbs, Tabs, Pagination, SkipLink">
        <Breadcrumbs
          items={[
            { label: 'Example Lab', href: '#/org' },
            { label: 'Vila Aurora air-quality study', href: '#/org/air' },
            { label: 'Base', href: '#/org/air/base' },
            { label: 'Stations', href: '#/org/air/base/stations' },
          ]}
          mode="trail"
        />
        <Tabs label="Analysis" tabs={[{ id: 'def', label: 'Definition' }, { id: 'runs', label: 'Runs', count: 4 }, { id: 'versions', label: 'Versions' }, { id: 'off', label: 'Archived', disabled: true }]}>
          <TabPanel id="def">
            <Text>The canvas is read-only for people who do not edit.</Text>
          </TabPanel>
          <TabPanel id="runs">
            <Text>Four runs.</Text>
          </TabPanel>
          <TabPanel id="versions">
            <Text>Version history.</Text>
          </TabPanel>
          <TabPanel id="off">
            <Text>Archived.</Text>
          </TabPanel>
        </Tabs>
        <Pagination page={page} pageCount={10} totalItems={482} pageSize={50} onPageChange={setPage} pageSizeOptions={[25, 50, 100]} onPageSizeChange={() => setPage(1)} />
        <Text size="meta">
          The skip link below is visually hidden until focused: <SkipLink targetId={id('typography')} label="Skip to the typography section" />
        </Text>
      </Section>

      <Section id={id('table')} title="DataTable">
        <DataTable
          caption="Monitoring stations"
          captionVisible
          columns={[
            { id: 'name', header: 'Station', sortable: true },
            { id: 'country', header: 'District', sortable: true },
            { id: 'stage', header: 'Days above limit', numeric: true },
            { id: 'proof', header: 'Proof' },
          ]}
          rows={rows}
          sortColumn={sort.column}
          sortDirection={sort.direction}
          onSortChange={(column, direction) => setSort({ column, direction })}
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={setSelected}
          density="standard"
        />
        <DataTable caption="Loading table" columns={[{ id: 'a', header: 'Name' }, { id: 'b', header: 'Status' }]} rows={[]} loading loadingRowCount={3} density="compact" />
        <DataTable caption="Empty table" columns={[{ id: 'a', header: 'Name' }, { id: 'b', header: 'Status' }]} rows={[]} density="comfortable" />
      </Section>

      <Section id={id('overlays')} title="ActionMenu, Popover, ModalDialog, Drawer, Toast">
        <div className="ty-gallery-row">
          <ActionMenu
            label="Record actions"
            trigger={<Button iconOnly accessibleLabel="More actions" leadingIcon={<FileText />} />}
            items={[
              { id: 'open', label: 'Open record', icon: BookOpen, shortcut: 'Enter' },
              { id: 'export', label: 'Export CSV', icon: Download },
              { type: 'separator' },
              { id: 'delete', label: 'Delete', icon: Trash2, tone: 'danger' },
              { id: 'freeze', label: 'Freeze (Owner only)', disabled: true },
            ]}
            onAction={(a) => toast.info(`Action: ${a}`)}
          />
          <Popover triggerLabel="About this score" title="Proof score">
            <Text size="meta">Share of assertions with an opened, verified station reading.</Text>
          </Popover>
          <Button onPress={() => setModal(true)}>Open dialog</Button>
          <Button onPress={() => setDrawer(true)}>Open drawer</Button>
          <Button onPress={() => toast.success('Reading saved')}>Success toast</Button>
          <Button onPress={() => toast.error('Could not reach the server', { message: 'Check the connection.' })}>Error toast</Button>
        </div>
        <ModalDialog
          isOpen={modal}
          onOpenChange={setModal}
          title="Freeze edition 2026-09"
          description="5 stations and 1460 daily readings enter the edition."
          actions={
            <>
              <Button onPress={() => setModal(false)}>Cancel</Button>
              <Button variant="primary" onPress={() => setModal(false)}>
                Freeze
              </Button>
            </>
          }
        >
          <TextField label="Type the edition name to confirm" />
        </ModalDialog>
        <Drawer open={drawer} onOpenChange={setDrawer} title="Evidence" placement="end">
          <ProofBadge state="proved" size="block" provedBy="Rafael Lima" at="23 Sep" rule="compile@1" />
          <Text>“…daily mean PM2.5 of 38 µg/m³ at Centro station on 14 July.”</Text>
        </Drawer>
      </Section>

      <Section id={id('page')} title="PageHeader">
        <PageHeader
          headingLevel={2}
          eyebrow="Vila Aurora air-quality study"
          title="Overview"
          summary="Urban air quality at five monitoring stations in Vila Aurora, with the source reading cited for every number (fictional data)."
          meta={[
            { icon: CalendarDays, text: 'edition 2026-09' },
            { icon: FileText, text: '5 stations' },
          ]}
          actions={
            <>
              <Button>Export</Button>
              <Button variant="primary">Verify 12</Button>
            </>
          }
        />
      </Section>
    </div>
  )
}
