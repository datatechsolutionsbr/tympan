// Building blocks of SettingsDialog: one field, the copy action, the
// password change form, a choice set and the profile picture line.
import { Copy } from 'lucide-react'
import { useReducer, useState, type FormEvent, type ReactNode } from 'react'
import { Label, Radio, RadioGroup, Text } from 'react-aria-components'
import { useMessages } from '../../internal/provider'
import { Avatar } from '../avatar/Avatar'
import { Button } from '../button/Button'
import { TextArea } from '../text-area/TextArea'
import { TextField } from '../text-field/TextField'
import type { PasswordWording, PreferenceChoiceSet, ProfileSetup, SettingField, SettingFieldKind } from './settingsTypes'

type Shared = {
  label: string
  hint?: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  name: string
}

/** The control for each field kind. */
const CONTROL_BY_KIND: Record<SettingFieldKind, (shared: Shared) => ReactNode> = {
  multiline: (s) => <TextArea {...s} rows={3} />,
  password: (s) => <TextField {...s} mode="password" />,
  text: (s) => <TextField {...s} inputType="text" />,
  email: (s) => <TextField {...s} inputType="email" />,
  url: (s) => <TextField {...s} inputType="url" />,
}

function CopyValue({ what, text }: { what: string; text: string }) {
  const words = useMessages().settingsDialog
  const [confirmed, setConfirmed] = useState(false)
  const onCopy = () => {
    const clip = typeof navigator === 'undefined' ? undefined : navigator.clipboard
    if (!clip) return setConfirmed(false)
    clip.writeText(text).then(
      () => setConfirmed(true),
      () => setConfirmed(false),
    )
  }
  return (
    <>
      <Button size="compact" iconOnly leadingIcon={<Copy />} accessibleLabel={words.copy(what)} onPress={onCopy} />
      <span role="status" className="fk-visually-hidden">
        {confirmed ? words.copied : ''}
      </span>
    </>
  )
}

export function SettingFieldRow({ field }: { field: SettingField }) {
  const control = CONTROL_BY_KIND[field.kind]({
    label: field.label,
    hint: field.description,
    value: field.value,
    onChange: field.onChange,
    readOnly: field.readOnly,
    placeholder: field.placeholder,
    name: field.key,
  })
  return (
    <div className="fk-settings-dialog__field" data-copyable={field.copyable ? '' : undefined}>
      <div className="fk-settings-dialog__field-control">{control}</div>
      {field.copyable && <CopyValue what={field.label} text={field.value} />}
    </div>
  )
}

interface Secrets {
  current: string
  next: string
  confirm: string
  clash: boolean
}
type SecretEdit = { slot: 'current' | 'next' | 'confirm'; text: string } | { slot: 'clash' }

function secretsStep(state: Secrets, edit: SecretEdit): Secrets {
  if (edit.slot === 'clash') return { ...state, clash: true }
  // Editing the new password or its confirmation clears the mismatch notice.
  return { ...state, [edit.slot]: edit.text, clash: edit.slot === 'current' ? state.clash : false }
}

export function PasswordChange({ wording, onSubmit }: { wording?: PasswordWording; onSubmit: (current: string, next: string, confirm: string) => void }) {
  const words = useMessages().settingsDialog
  const [secrets, edit] = useReducer(secretsStep, { current: '', next: '', confirm: '', clash: false })
  const title = {
    current: wording?.current ?? words.currentPassword,
    next: wording?.next ?? words.newPassword,
    confirm: wording?.confirm ?? words.confirmPassword,
    submit: wording?.submit ?? words.changePassword,
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (secrets.next === secrets.confirm) onSubmit(secrets.current, secrets.next, secrets.confirm)
    else edit({ slot: 'clash' })
  }
  const box = (slot: 'current' | 'next' | 'confirm', autoComplete: string, error?: string) => (
    <TextField
      mode="password"
      label={title[slot]}
      value={secrets[slot]}
      onChange={(text) => edit({ slot, text })}
      autoComplete={autoComplete}
      errorMessage={error}
    />
  )
  return (
    <form noValidate className="fk-settings-dialog__password" onSubmit={submit}>
      {box('current', 'current-password')}
      {box('next', 'new-password')}
      {box('confirm', 'new-password', secrets.clash ? words.passwordMismatch : undefined)}
      <div>
        <Button type="submit">{title.submit}</Button>
      </div>
    </form>
  )
}

export function ChoiceSet({ set, asCards }: { set: PreferenceChoiceSet; asCards: boolean }) {
  return (
    <RadioGroup className="fk-settings-dialog__choices" data-cards={asCards ? '' : undefined} value={set.value} onChange={set.onChange}>
      <Label className="fk-settings-dialog__legend">{set.label}</Label>
      <div className="fk-settings-dialog__choice-grid">
        {set.options.map((option) => (
          <Radio key={option.value} value={option.value} className="fk-settings-dialog__choice">
            <span aria-hidden="true" className="fk-settings-dialog__choice-mark" />
            <span className="fk-settings-dialog__choice-text">
              <span className="fk-settings-dialog__choice-label">{option.label}</span>
              {option.description && (
                <Text slot="description" className="fk-settings-dialog__choice-hint">
                  {option.description}
                </Text>
              )}
            </span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}

export function PictureLine({ setup }: { setup: ProfileSetup }) {
  const words = useMessages().settingsDialog
  return (
    <div className="fk-settings-dialog__picture">
      <Avatar decorative size="large" src={setup.pictureUrl} fallbackText={setup.fallbackText} />
      {setup.onChangePicture && <Button onPress={setup.onChangePicture}>{words.changePicture}</Button>}
    </div>
  )
}
