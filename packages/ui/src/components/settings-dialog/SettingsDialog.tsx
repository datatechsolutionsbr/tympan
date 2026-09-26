import { Copy, LockKeyhole } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Label, Radio, RadioGroup, Text } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Avatar } from '../avatar/Avatar'
import { Button } from '../button/Button'
import { NativeSelect } from '../native-select/NativeSelect'
import { SectionedModal, type ModalSection } from '../sectioned-modal/SectionedModal'
import { Switch } from '../switch/Switch'
import { TextArea } from '../text-area/TextArea'
import { TextField } from '../text-field/TextField'

export type SettingFieldKind = 'text' | 'email' | 'password' | 'url' | 'multiline'

export interface SettingField {
  key: string
  label: string
  description?: string
  value: string
  onChange?: (value: string) => void
  kind: SettingFieldKind
  readOnly?: boolean
  copyable?: boolean
  placeholder?: string
}

export interface SettingChoice {
  value: string
  label: string
  description?: string
}

export interface SettingSwitch {
  key: string
  label: string
  description?: string
  value: boolean
  onChange: (value: boolean) => void
}

export interface SettingChoiceGroup {
  key: string
  label: string
  options: SettingChoice[]
  value: string
  onChange: (value: string) => void
}

export interface SettingsProfile {
  title: string
  pictureUrl?: string
  fallbackText: string
  onChangePicture?: () => void
  fields: SettingField[]
  password?: {
    labels?: Partial<Record<'current' | 'next' | 'confirm' | 'submit', string>>
    onSubmit: (current: string, next: string, confirm: string) => void
  }
}

export interface SettingsPreferences {
  title: string
  description?: string
  switches?: SettingSwitch[]
  radioGroups?: SettingChoiceGroup[]
  choiceGroups?: SettingChoiceGroup[]
  locale?: { label: string; value: string; options: SettingChoice[]; onChange: (value: string) => void }
}

export interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  sections: Array<Omit<ModalSection, 'content' | 'count'>>
  initialSection?: string
  identity?: ReactNode
  profile?: SettingsProfile
  workspace?: { title: string; fields: SettingField[] }
  preferences?: SettingsPreferences
  renderSection?: (id: string) => ReactNode | undefined
  placeholderText?: string
  accessDenied?: { title: string; description: string; icon?: ReactNode }
  signOut?: { label: string; icon?: ReactNode; onPress: () => void }
}

export interface PreferenceGroupProps {
  title?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled block of preferences inside SettingsDialog. */
export function PreferenceGroup({ title, icon, children, className }: PreferenceGroupProps) {
  const titleId = useId()
  return (
    <div role="group" className={cx('fk-preference-group', className)} aria-labelledby={title ? titleId : undefined}>
      {title ? (
        <h3 id={titleId} className="fk-preference-group__title">
          {icon ? (
            <span aria-hidden="true" className="fk-preference-group__icon">
              {icon}
            </span>
          ) : null}
          {title}
        </h3>
      ) : null}
      <div className="fk-preference-group__body">{children}</div>
    </div>
  )
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const copy = useMessages().settingsDialog
  const [done, setDone] = useState(false)
  const write = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setDone(true)
    } catch {
      setDone(false)
    }
  }
  return (
    <>
      <Button size="compact" leadingIcon={<Copy />} onPress={() => void write()} accessibleLabel={copy.copy(label)} iconOnly />
      <span role="status" className="fk-visually-hidden">
        {done ? copy.copied : ''}
      </span>
    </>
  )
}

/** One editable or read-only setting, by kind. */
function FieldRow({ field }: { field: SettingField }) {
  const common = {
    label: field.label,
    hint: field.description,
    value: field.value,
    onChange: field.onChange,
    readOnly: field.readOnly,
    placeholder: field.placeholder,
    name: field.key,
  }
  const control =
    field.kind === 'multiline' ? (
      <TextArea {...common} rows={3} />
    ) : field.kind === 'password' ? (
      <TextField {...common} mode="password" />
    ) : (
      <TextField {...common} inputType={field.kind === 'text' ? 'text' : field.kind} />
    )
  return (
    <div className="fk-settings-dialog__field" data-copyable={field.copyable || undefined}>
      <div className="fk-settings-dialog__field-control">{control}</div>
      {field.copyable ? <CopyButton label={field.label} value={field.value} /> : null}
    </div>
  )
}

function PasswordForm({ config }: { config: NonNullable<SettingsProfile['password']> }) {
  const copy = useMessages().settingsDialog
  const [values, setValues] = useState({ current: '', next: '', confirm: '' })
  const [mismatch, setMismatch] = useState(false)
  const label = (k: 'current' | 'next' | 'confirm' | 'submit', fallback: string) => config.labels?.[k] ?? fallback
  const edit = (k: keyof typeof values) => (v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }))
    if (k !== 'current') setMismatch(false)
  }
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (values.next !== values.confirm) {
      setMismatch(true)
      return
    }
    config.onSubmit(values.current, values.next, values.confirm)
  }
  return (
    <form className="fk-settings-dialog__password" onSubmit={send} noValidate>
      <TextField mode="password" label={label('current', copy.currentPassword)} value={values.current} onChange={edit('current')} autoComplete="current-password" />
      <TextField mode="password" label={label('next', copy.newPassword)} value={values.next} onChange={edit('next')} autoComplete="new-password" />
      <TextField
        mode="password"
        label={label('confirm', copy.confirmPassword)}
        value={values.confirm}
        onChange={edit('confirm')}
        autoComplete="new-password"
        errorMessage={mismatch ? copy.passwordMismatch : undefined}
      />
      <div>
        <Button type="submit">{label('submit', copy.changePassword)}</Button>
      </div>
    </form>
  )
}

function ChoiceGroupView({ group, cards }: { group: SettingChoiceGroup; cards: boolean }) {
  return (
    <RadioGroup className="fk-settings-dialog__choices" data-cards={cards || undefined} value={group.value} onChange={group.onChange}>
      <Label className="fk-settings-dialog__legend">{group.label}</Label>
      <div className="fk-settings-dialog__choice-grid">
        {group.options.map((o) => (
          <Radio key={o.value} value={o.value} className="fk-settings-dialog__choice">
            <span className="fk-settings-dialog__choice-mark" aria-hidden="true" />
            <span className="fk-settings-dialog__choice-text">
              <span className="fk-settings-dialog__choice-label">{o.label}</span>
              {o.description ? (
                <Text slot="description" className="fk-settings-dialog__choice-hint">
                  {o.description}
                </Text>
              ) : null}
            </span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}

const panels: Record<string, (p: SettingsDialogProps) => ReactNode | undefined> = {
  profile: ({ profile }) =>
    profile ? (
      <PreferenceGroup title={profile.title}>
        <ProfileHeader profile={profile} />
        {profile.fields.map((f) => (
          <FieldRow key={f.key} field={f} />
        ))}
        {profile.password ? <PasswordForm config={profile.password} /> : null}
      </PreferenceGroup>
    ) : undefined,
  workspace: ({ workspace }) =>
    workspace ? (
      <PreferenceGroup title={workspace.title}>
        {workspace.fields.map((f) => (
          <FieldRow key={f.key} field={f} />
        ))}
      </PreferenceGroup>
    ) : undefined,
  preferences: ({ preferences: p }) =>
    p ? (
      <PreferenceGroup title={p.title}>
        {p.description ? <p className="fk-settings-dialog__description">{p.description}</p> : null}
        {p.switches?.map((s) => (
          <Switch key={s.key} label={s.label} description={s.description} isSelected={s.value} onChange={s.onChange} />
        ))}
        {p.radioGroups?.map((g) => <ChoiceGroupView key={g.key} group={g} cards={false} />)}
        {p.choiceGroups?.map((g) => <ChoiceGroupView key={g.key} group={g} cards />)}
        {p.locale ? <NativeSelect label={p.locale.label} value={p.locale.value} options={p.locale.options} onChange={p.locale.onChange} /> : null}
      </PreferenceGroup>
    ) : undefined,
}

function ProfileHeader({ profile }: { profile: SettingsProfile }) {
  const copy = useMessages().settingsDialog
  return (
    <div className="fk-settings-dialog__picture">
      <Avatar src={profile.pictureUrl} fallbackText={profile.fallbackText} size="large" decorative />
      {profile.onChangePicture ? <Button onPress={profile.onChangePicture}>{copy.changePicture}</Button> : null}
    </div>
  )
}

function Denied({ view }: { view: NonNullable<SettingsDialogProps['accessDenied']> }) {
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

/** Account and workspace settings assembled from configuration (spec: wave-2/settings-dialog.md). */
export function SettingsDialog(props: SettingsDialogProps) {
  const copy = useMessages().settingsDialog
  const denied = !!props.initialSection && !props.sections.some((s) => s.id === props.initialSection) && !!props.accessDenied
  const contentFor = (id: string): ReactNode =>
    panels[id]?.(props) ?? props.renderSection?.(id) ?? <p className="fk-settings-dialog__placeholder">{props.placeholderText ?? copy.placeholder}</p>

  const sections: ModalSection[] = props.sections.map((s) => ({ ...s, content: contentFor(s.id) }))
  const foot = props.signOut ? (
    <Button variant="danger" fullWidth leadingIcon={props.signOut.icon} onPress={props.signOut.onPress}>
      {props.signOut.label}
    </Button>
  ) : undefined

  if (denied && props.accessDenied) {
    return (
      <SectionedModal open={props.open} onClose={props.onClose} title={props.title} subtitle={props.subtitle} size="md">
        <Denied view={props.accessDenied} />
      </SectionedModal>
    )
  }
  return (
    <SectionedModal
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      subtitle={props.subtitle}
      size="xl"
      sections={sections}
      defaultSection={props.initialSection}
      identity={props.identity}
      navigationFooter={foot}
      className="fk-settings-dialog"
    />
  )
}
