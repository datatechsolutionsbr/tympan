// SettingsDialog (spec: wave-2/settings-dialog.md).
//
// Account and workspace settings assembled from configuration inside a
// SectionedModal. The three built-in sections (profile, workspace,
// preferences) are drawn from their configuration objects; any other section
// comes from `renderSection`, else a placeholder sentence.
import { LockKeyhole } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { NativeSelect } from '../native-select/NativeSelect'
import { SectionedModal, type ModalSection } from '../sectioned-modal/SectionedModal'
import { Switch } from '../switch/Switch'
import { ChoiceSet, PasswordChange, PictureLine, SettingFieldRow } from './settingsParts'
import type { BlockedView, PreferenceSetup, ProfileSetup, SettingField, WorkspaceSetup } from './settingsTypes'

export type {
  BlockedView,
  PreferenceChoiceSet,
  PreferenceOption,
  PreferenceSetup,
  PreferenceToggle,
  ProfileSetup,
  SettingField,
  SettingFieldKind,
  WorkspaceSetup,
} from './settingsTypes'

export interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  sections: Array<Omit<ModalSection, 'content' | 'count'>>
  initialSection?: string
  identity?: ReactNode
  profile?: ProfileSetup
  workspace?: WorkspaceSetup
  preferences?: PreferenceSetup
  renderSection?: (id: string) => ReactNode | undefined
  placeholderText?: string
  accessDenied?: BlockedView
  signOut?: { label: string; icon?: ReactNode; onPress: () => void }
}

export interface PreferenceGroupProps {
  title?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled block of preferences inside SettingsDialog (a group, not a landmark). */
export function PreferenceGroup(props: PreferenceGroupProps) {
  const headId = useId()
  const heading = props.title ? (
    <h3 id={headId} className="fk-preference-group__title">
      {props.icon && (
        <span aria-hidden="true" className="fk-preference-group__icon">
          {props.icon}
        </span>
      )}
      {props.title}
    </h3>
  ) : null
  return (
    <div role="group" aria-labelledby={heading ? headId : undefined} className={cx('fk-preference-group', props.className)}>
      {heading}
      <div className="fk-preference-group__body">{props.children}</div>
    </div>
  )
}

const fieldList = (fields: SettingField[]) => fields.map((field) => <SettingFieldRow key={field.key} field={field} />)

function profileBody(setup: ProfileSetup): ReactNode {
  return (
    <PreferenceGroup title={setup.title}>
      <PictureLine setup={setup} />
      {fieldList(setup.fields)}
      {setup.password && <PasswordChange wording={setup.password.labels} onSubmit={setup.password.onSubmit} />}
    </PreferenceGroup>
  )
}

function workspaceBody(setup: WorkspaceSetup): ReactNode {
  return <PreferenceGroup title={setup.title}>{fieldList(setup.fields)}</PreferenceGroup>
}

function preferencesBody(setup: PreferenceSetup): ReactNode {
  const { locale } = setup
  return (
    <PreferenceGroup title={setup.title}>
      {setup.description && <p className="fk-settings-dialog__description">{setup.description}</p>}
      {(setup.switches ?? []).map((toggle) => (
        <Switch key={toggle.key} label={toggle.label} description={toggle.description} isSelected={toggle.value} onChange={toggle.onChange} />
      ))}
      {(setup.radioGroups ?? []).map((set) => (
        <ChoiceSet key={set.key} set={set} asCards={false} />
      ))}
      {(setup.choiceGroups ?? []).map((set) => (
        <ChoiceSet key={set.key} set={set} asCards />
      ))}
      {locale && <NativeSelect label={locale.label} value={locale.value} options={locale.options} onChange={locale.onChange} />}
    </PreferenceGroup>
  )
}

/** Built-in content for a section id, when the matching configuration is present. */
function builtIn(id: string, props: SettingsDialogProps): ReactNode | undefined {
  if (id === 'profile' && props.profile) return profileBody(props.profile)
  if (id === 'workspace' && props.workspace) return workspaceBody(props.workspace)
  if (id === 'preferences' && props.preferences) return preferencesBody(props.preferences)
  return undefined
}

function Blocked({ view }: { view: BlockedView }) {
  return (
    <div className="fk-settings-dialog__denied">
      <span aria-hidden="true" className="fk-settings-dialog__denied-icon">
        {view.icon ?? <LockKeyhole />}
      </span>
      <h3 className="fk-settings-dialog__denied-title">{view.title}</h3>
      <p className="fk-settings-dialog__description">{view.description}</p>
    </div>
  )
}

export function SettingsDialog(props: SettingsDialogProps) {
  const words = useMessages().settingsDialog
  const frame = { open: props.open, onClose: props.onClose, title: props.title, subtitle: props.subtitle }

  // Asked to open on a section the person may not see: show the denial instead.
  const wanted = props.initialSection
  if (props.accessDenied && wanted && props.sections.every((section) => section.id !== wanted)) {
    return (
      <SectionedModal {...frame} size="md">
        <Blocked view={props.accessDenied} />
      </SectionedModal>
    )
  }

  const fallback = <p className="fk-settings-dialog__placeholder">{props.placeholderText ?? words.placeholder}</p>
  const filled: ModalSection[] = props.sections.map((section) => ({
    ...section,
    content: builtIn(section.id, props) ?? props.renderSection?.(section.id) ?? fallback,
  }))
  const leave = props.signOut && (
    <Button fullWidth variant="danger" leadingIcon={props.signOut.icon} onPress={props.signOut.onPress}>
      {props.signOut.label}
    </Button>
  )
  return (
    <SectionedModal
      {...frame}
      size="xl"
      className="fk-settings-dialog"
      sections={filled}
      defaultSection={wanted}
      identity={props.identity}
      navigationFooter={leave || undefined}
    />
  )
}
