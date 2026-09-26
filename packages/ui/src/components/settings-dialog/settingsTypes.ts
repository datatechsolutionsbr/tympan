// Configuration shapes of SettingsDialog (spec: wave-2/settings-dialog.md).
// `SettingField` and the section field names are fixed by the spec; the
// helper shapes around them are this library's own.
import type { ReactNode } from 'react'

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

/** One selectable answer of a preference. */
export interface PreferenceOption {
  value: string
  label: string
  description?: string
}

/** An on/off preference. */
export interface PreferenceToggle {
  key: string
  label: string
  description?: string
  value: boolean
  onChange: (value: boolean) => void
}

/** A one-of-many preference (radio list or cards). */
export interface PreferenceChoiceSet {
  key: string
  label: string
  options: PreferenceOption[]
  value: string
  onChange: (value: string) => void
}

export type PasswordWording = Partial<Record<'current' | 'next' | 'confirm' | 'submit', string>>

export interface ProfileSetup {
  title: string
  pictureUrl?: string
  fallbackText: string
  onChangePicture?: () => void
  fields: SettingField[]
  password?: {
    labels?: PasswordWording
    onSubmit: (current: string, next: string, confirm: string) => void
  }
}

export interface PreferenceSetup {
  title: string
  description?: string
  switches?: PreferenceToggle[]
  radioGroups?: PreferenceChoiceSet[]
  choiceGroups?: PreferenceChoiceSet[]
  locale?: { label: string; value: string; options: PreferenceOption[]; onChange: (value: string) => void }
}

export interface WorkspaceSetup {
  title: string
  fields: SettingField[]
}

export interface BlockedView {
  title: string
  description: string
  icon?: ReactNode
}
