// Gallery section for the "overlays-nav" group: overlays, navigation, steps.
import { Bell, BookOpen, ClipboardCheck, Database, FlaskConical, House, Languages, LogOut, Map, Plus, Settings, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  AppLauncherGrid,
  AppNavigation,
  Button,
  CommandPalette,
  CompactConfirm,
  ConfirmProvider,
  DetailsPopover,
  FloatingActionButton,
  LongPressMenu,
  NavigationFlyout,
  PageDots,
  SectionedModal,
  SettingsDialog,
  StepList,
  ToolbarTrigger,
  useConfirm,
  useToast,
  WizardPage,
  type NavEntry,
} from '../../../src'
import { Section } from '../Section'

const entries: NavEntry[] = [
  { id: 'overview', label: 'Overview', href: '#/overview', icon: <House /> },
  { id: 'sources', label: 'Stations and trail', href: '#/sources', icon: <BookOpen />, group: 'Collect', description: 'Readings, cleaning steps, aggregates' },
  { id: 'verify', label: 'Verification', href: '#/verify', icon: <ClipboardCheck />, group: 'Collect', count: 12 },
  { id: 'base', label: 'Base', href: '#/base', icon: <Database />, group: 'Organise', menu: [{ id: 'saved', label: 'Saved views' }] },
  { id: 'atlas', label: 'Atlas', href: '#/atlas', icon: <Map />, group: 'Organise' },
  { id: 'analyses', label: 'Analyses', href: '#/analyses', icon: <FlaskConical />, group: 'Analyse' },
]

const steps = [
  { id: 'scope', title: 'Scope', description: 'Name the project and what it studies.' },
  { id: 'team', title: 'Team', description: 'Invite people and agents.' },
  { id: 'review', title: 'Review', description: 'Check everything before creating.' },
]

function ConfirmDemo() {
  const confirm = useConfirm()
  const toast = useToast()
  return (
    <Button
      variant="danger"
      leadingIcon={<Trash2 />}
      onPress={async () => {
        const yes = await confirm({ title: 'Remove this station reading?', message: 'The 3 claims that cite it lose their evidence.', tone: 'danger', confirmLabel: 'Remove' })
        toast.info(yes ? 'Removed' : 'Kept')
      }}
    >
      Ask with ConfirmService
    </Button>
  )
}

export function OverlaysNavShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-${s}`
  const [modal, setModal] = useState(false)
  const [settings, setSettings] = useState(false)
  const [compact, setCompact] = useState(false)
  const [flyout, setFlyout] = useState(false)
  const [palette, setPalette] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [dot, setDot] = useState(2)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [collapsed, setCollapsed] = useState(false)
  const account = { name: 'Ana Souza', onProfile: () => {}, onSignOut: () => {}, theme, onThemeChange: setTheme }

  return (
    <div className="ty-gallery-showcase">
      <Section id={id('app-navigation')} title="AppNavigation (sidebar and collapsed rail)">
        <div className="ty-gallery-row" style={{ alignItems: 'stretch' }}>
          <div style={{ inlineSize: 260, border: '1px solid var(--ty-line)', borderRadius: 16 }}>
            <AppNavigation
              entries={entries}
              pathname="#/verify"
              brand={<strong>Acme Research</strong>}
              footer={<span>Edition 2026-09, verified</span>}
              account={account}
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
              labels={{ landmark: `Primary navigation ${scope}` }}
            />
          </div>
          <div style={{ border: '1px solid var(--ty-line)', borderRadius: 16 }}>
            <AppNavigation entries={entries} layout="rail" pathname="#/base" labels={{ landmark: `Rail navigation ${scope}` }} />
          </div>
        </div>
        <AppNavigation entries={entries.slice(0, 4)} layout="floating" pathname="#/overview" labels={{ landmark: `Floating navigation ${scope}` }} />
      </Section>

      <Section id={id('toolbar-trigger')} title="ToolbarTrigger">
        <div className="ty-gallery-row">
          <ToolbarTrigger icon={<Bell />} label="Notifications" />
          <ToolbarTrigger icon={<Languages />} label="Language" caption="PT" controls="menu" expanded={false} />
          <ToolbarTrigger icon={<Sparkles />} label="Focus mode" pressed />
          <ToolbarTrigger icon={<Settings />} label="Settings" disabled />
        </div>
      </Section>

      <Section id={id('flyout-palette')} title="NavigationFlyout, CommandPalette">
        <div className="ty-gallery-row">
          <Button onPress={() => setFlyout(true)}>Open navigation flyout</Button>
          <Button onPress={() => setPalette(true)}>Open command palette</Button>
        </div>
        <NavigationFlyout
          open={flyout}
          onOpenChange={setFlyout}
          title="All destinations"
          currentPath="#/base"
          destinations={entries.map((e) => ({ id: e.id, label: e.label, subtitle: e.description, href: e.href, icon: e.icon }))}
          quickActions={{ theme, onThemeChange: setTheme, onProfile: () => {}, onSignOut: () => {}, onNotifications: () => {}, unseenCount: 3, personName: 'Ana Souza', personInitial: 'A' }}
        />
        <CommandPalette
          open={palette}
          onClose={() => setPalette(false)}
          scopes={[
            { id: 'records', label: 'Records' },
            { id: 'screens', label: 'Screens' },
          ]}
          recent={{ storageKey: 'ty-gallery-palette' }}
          fallbackActions={[{ id: 'create', label: "Create record '{query}'", icon: <Plus />, onSelect: () => {} }]}
          groups={[
            {
              id: 'screens',
              heading: 'Screens',
              scopeId: 'screens',
              items: entries.map((e) => ({ id: e.id, label: e.label, icon: e.icon, hint: e.href.slice(1), onSelect: () => {} })),
            },
            {
              id: 'records',
              heading: 'Records',
              scopeId: 'records',
              items: [
                {
                  id: 'centro',
                  label: 'Centro station',
                  description: 'Downtown, 12 days above the limit',
                  onSelect: () => {},
                  actions: [
                    { id: 'prov', label: 'Open provenance', onSelect: () => {} },
                    { id: 'copy', label: 'Copy link', shortcut: 'C', onSelect: () => {} },
                  ],
                },
                { id: 'harbour', label: 'Harbour station', description: 'Port district, 31 days above the limit', onSelect: () => {} },
              ],
            },
          ]}
        />
      </Section>

      <Section id={id('launcher')} title="AppLauncherGrid">
        <AppLauncherGrid
          pages={[
            ...entries.slice(1, 4).map((e) => ({ id: e.id, label: e.label, href: e.href, icon: e.icon, description: e.description, count: e.count })),
            { id: 'profile', label: 'Profile', href: '#/profile', icon: <House /> },
          ]}
          person={{ name: 'Ana Souza', roleLabel: 'Researcher' }}
          actions={[{ id: 'out', label: 'Sign out', href: '#/', icon: <LogOut />, onPress: () => {} }]}
        />
      </Section>

      <Section id={id('modals')} title="SectionedModal, SettingsDialog, CompactConfirm, ConfirmService">
        <div className="ty-gallery-row">
          <Button onPress={() => setModal(true)}>Edit source</Button>
          <Button onPress={() => setSettings(true)}>Settings</Button>
          <Button onPress={() => setCompact(true)}>Sign out</Button>
          <ConfirmProvider>
            <ConfirmDemo />
          </ConfirmProvider>
        </div>
        <SectionedModal
          open={modal}
          onClose={() => setModal(false)}
          eyebrow="Source"
          title="Edit source"
          subtitle="Changes stay in the draft until the edition is frozen."
          size="md"
          accent
          onSubmit={() => setModal(false)}
          formFooter={{}}
          error="The server refused the URL: it answered 404."
        >
          <label className="ty-gallery-stack">
            URL
            <input className="ty-gallery-native-input" defaultValue="https://example.org" />
          </label>
        </SectionedModal>
        <SettingsDialog
          open={settings}
          onClose={() => setSettings(false)}
          title="Settings"
          outline={[
            { id: 'profile', label: 'Profile', group: 'Account' },
            { id: 'preferences', label: 'Preferences', group: 'Account' },
            { id: 'workspace', label: 'Workspace', group: 'Project' },
          ]}
          content={{
            profile: {
              heading: 'Profile',
              items: [
                { type: 'portrait', id: 'face', initials: 'AS', onReplace: () => {} },
                { type: 'entry', id: 'name', caption: 'Name', text: 'Ana Souza' },
                { type: 'passphrase', id: 'pass', onSave: () => {} },
              ],
            },
            workspace: { heading: 'Workspace', items: [{ type: 'entry', id: 'id', caption: 'Workspace id', text: 'ws-9f2c', locked: true, copy: true }] },
            preferences: {
              heading: 'Preferences',
              items: [
                { type: 'toggle', id: 'haptics', caption: 'Haptics', on: true, onFlip: () => {} },
                {
                  type: 'pick',
                  id: 'density',
                  caption: 'Table density',
                  look: 'cards',
                  chosen: 'default',
                  onPick: () => {},
                  answers: [
                    { id: 'compact', caption: 'Compact', help: '36 px rows' },
                    { id: 'default', caption: 'Default', help: '44 px rows' },
                    { id: 'comfortable', caption: 'Comfortable', help: '52 px rows' },
                  ],
                },
              ],
            },
          }}
          exit={{ label: 'Sign out', icon: <LogOut />, onPress: () => setSettings(false) }}
        />
        <CompactConfirm open={compact} title="Sign out?" message="You will need to sign in again." sourceLabel="Acme Research" onConfirm={() => setCompact(false)} onCancel={() => setCompact(false)} tone="neutral" />
      </Section>

      <Section id={id('details')} title="DetailsPopover, LongPressMenu">
        <div className="ty-gallery-row">
          <DetailsPopover
            triggerLabel="Details of the change"
            title="Status changed"
            tone="success"
            actor={{ kind: 'agent', name: 'stage-counter', detail: 'model v2' }}
            timestamp="2026-09-23T10:00:00Z"
            comparison={{ label: 'Status', fromLabel: 'from', fromValue: 'Pending', toLabel: 'to', toValue: 'Proved' }}
            note={{ label: 'Note', value: 'Source reopened and quote matched.' }}
          />
          <LongPressMenu label="Sources, hold for more" items={[{ label: 'Pin' }, { label: 'Remove', tone: 'danger' }]} onTap={() => {}}>
            <span className="ty-gallery-native-input" style={{ display: 'inline-flex', alignItems: 'center' }}>
              Sources (hold, right click or Shift+F10)
            </span>
          </LongPressMenu>
        </div>
      </Section>

      <Section id={id('steps')} title="StepList, PageDots">
        <StepList label="Project setup" currentIndex={1} steps={steps.map((s) => ({ id: s.id, name: s.title }))} onStepSelect={() => {}} />
        <StepList label="Security setup" appearance="bar" currentIndex={2} steps={steps.map((s) => ({ id: s.id, name: s.title }))} />
        <div className="ty-gallery-row">
          <PageDots count={5} currentIndex={dot} onSelect={setDot} label={`Slides ${scope}`} />
          <PageDots count={5} currentIndex={dot} appearance="pill" />
          <PageDots count={14} currentIndex={dot} />
        </div>
      </Section>

      <Section id={id('fab')} title="FloatingActionButton (inline on wide screens)">
        <FloatingActionButton label={`New session (${scope})`} icon={<Plus />} onPress={() => {}} presentation={scope === "light" ? "responsive" : "inline"} />
      </Section>

      <Section id={id('wizard')} title="WizardPage">
        <WizardPage
          title="New research project"
          eyebrow="Create"
          icon={<Sparkles />}
          steps={steps}
          currentIndex={wizardStep}
          onStepChange={setWizardStep}
          onSubmit={() => setWizardStep(0)}
          onCancel={() => setWizardStep(0)}
          submitLabel="Create project"
        >
          <p>Step body for {steps[wizardStep]?.title}.</p>
        </WizardPage>
      </Section>
    </div>
  )
}
